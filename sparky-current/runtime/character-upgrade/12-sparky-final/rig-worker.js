/* Sparky's painted rig, off the main thread.
 *
 * The page keeps animating the skeleton (cheap) and posts the posed bones and slots
 * here each frame. This worker mirrors that pose on its own copy of the skeleton,
 * runs the painted-profile reshaping (the expensive part: sleeves, shirt, shorts,
 * limbs, gloves) and draws it with WebGL on an OffscreenCanvas. The finished frame
 * goes back as an ImageBitmap with the few anchor points the page needs (hands and
 * mouth), so taps, drags and the board never wait for Sparky.
 */
import { ANCHORS, attachmentTable } from './rig-wire.js?v=1';
let spine, context, renderer, canvas, data, adapter, table, ready = false;
const views = new Map();

async function loadSpine(url) {
  const source = await (await fetch(url)).text();
  // The bundle is a strict-mode script declaring `var spine`; expose it to the modules.
  (0, eval)(source + '\n;self.spine=spine;');
  return self.spine;
}

const loadAsset = (am, kind, url, ...rest) => new Promise((ok, no) => am[kind](url, ok, (_, e) => no(Error(String(e))), ...rest));

async function init({ spineURL, manifestURL, renderWidth, camera, profileURL, svgPages = {}, skelBytes = null }) {
  // SVG atlas pages arrive pre-rasterized from the page (workers cannot decode SVG).
  const realFetch = self.fetch.bind(self);
  self.fetch = (input, options) => { const url = String(input?.url ?? input).split('?')[0]; return svgPages[url] ? Promise.resolve(new Response(svgPages[url], { headers: { 'Content-Type': 'image/png' } })) : realFetch(input, options); };
  spine = await loadSpine(spineURL);
  const manifest = await (await fetch(manifestURL)).json();
  const resource = p => new URL(p, manifestURL).href + '?v=' + manifest.revision;
  const skel = resource(manifest.skeleton), atlas = resource(manifest.atlas), texture = resource(manifest.texture);
  canvas = new OffscreenCanvas(renderWidth, Math.round(renderWidth * 1.25));
  context = new spine.ManagedWebGLRenderingContext(canvas, { alpha: true, antialias: true, premultipliedAlpha: true, preserveDrawingBuffer: false });
  renderer = new spine.SceneRenderer(canvas, context);
  const am = new spine.AssetManager(context);
  // the page already downloaded (and unpacked) the skeleton: use its bytes instead of a second download
  await Promise.all([skelBytes ? null : loadAsset(am, 'loadBinary', skel), loadAsset(am, 'loadTextureAtlas', atlas, { [manifest.texture.split('/').at(-1)]: texture })]);
  data = new spine.SkeletonBinary(new spine.AtlasAttachmentLoader(am.get(atlas))).readSkeletonData(skelBytes ? new Uint8Array(skelBytes) : am.get(skel));
  table = attachmentTable(data);
  // The same painted profile the page used to install, given a minimal player.
  const { installPaintedProfile } = await import(profileURL);
  const player = { instance: { assetManager: am, renderer }, data };
  await installPaintedProfile(player, () => ({}));
  adapter = player.referenceAdapter;
  setCamera(camera);
  ready = true;
}

function setCamera({ x, y, width, height }) {
  const cam = renderer.camera; cam.position.set(x, y, 0); cam.setViewport(width, height); cam.update();
}

function view(id) {
  let v = views.get(id);
  if (!v) { v = { skeleton: new spine.Skeleton(data), entry: null, fixedTime: null, speaking: false, shape: null }; v.speechSource = () => v.shape ? { shape: v.shape } : null; v.attachments = new Int32Array(v.skeleton.slots.length).fill(-2); views.set(id, v); }
  return v;
}

// Mirror the page's posed skeleton. World transforms arrive final, so nothing here
// recomputes them; the reshaping reads bones, slots, draw order and the authored pose.
function apply(v, p) {
  const sk = v.skeleton, bones = sk.bones, B = p.bones;
  for (let i = 0; i < bones.length; i++) {
    const b = bones[i], o = i * 20;
    b.a = B[o]; b.b = B[o + 1]; b.c = B[o + 2]; b.d = B[o + 3]; b.worldX = B[o + 4]; b.worldY = B[o + 5];
    b.x = B[o + 6]; b.y = B[o + 7]; b.rotation = B[o + 8]; b.scaleX = B[o + 9]; b.scaleY = B[o + 10]; b.shearX = B[o + 11]; b.shearY = B[o + 12];
    b.ax = B[o + 13]; b.ay = B[o + 14]; b.arotation = B[o + 15]; b.ascaleX = B[o + 16]; b.ascaleY = B[o + 17]; b.ashearX = B[o + 18]; b.ashearY = B[o + 19];
  }
  const slots = sk.slots, A = p.attachments, C = p.colors, D = p.dark;
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i], index = A[i];
    if (v.attachments[i] !== index) { s.setAttachment(index < 0 ? null : table[index]); v.attachments[i] = index; }
    s.deform.length = 0; s.sequenceIndex = p.sequence[i];
    s.color.set(C[i * 4], C[i * 4 + 1], C[i * 4 + 2], C[i * 4 + 3]);
    if (D && s.darkColor) s.darkColor.set(D[i * 4], D[i * 4 + 1], D[i * 4 + 2], D[i * 4 + 3]);
  }
  for (let k = 0; k < p.deformSlots.length; k++) {
    const d = slots[p.deformSlots[k]].deform, src = p.deforms[k];
    d.length = src.length; for (let j = 0; j < src.length; j++) d[j] = src[j];
  }
  sk.drawOrder = Array.from(p.drawOrder, i => slots[i]);
  sk.color.set(p.skeleton[0], p.skeleton[1], p.skeleton[2], p.skeleton[3]); sk.x = p.skeleton[4]; sk.y = p.skeleton[5]; sk.scaleX = p.skeleton[6]; sk.scaleY = p.skeleton[7];
  sk.sparkyAuthoredPose = p.pose;
  v.entry = p.entry ? { animation: data.findAnimation(p.entry.name), trackTime: p.entry.trackTime, loop: p.entry.loop } : null;
  v.fixedTime = p.fixedTime; v.speaking = p.speaking; v.shape = p.shape;
}

function anchors(rendered) {
  const out = {};
  for (const name of ANCHORS) {
    const vertices = rendered?.findSlot(name)?.getAttachment()?.vertices;
    if (!vertices?.length) { out[name] = null; continue; }
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let i = 0; i < vertices.length; i += 2) { x0 = Math.min(x0, vertices[i]); x1 = Math.max(x1, vertices[i]); y0 = Math.min(y0, vertices[i + 1]); y1 = Math.max(y1, vertices[i + 1]); }
    out[name] = [(x0 + x1) / 2, (y0 + y1) / 2];
  }
  return out;
}

function draw(p) {
  const started = performance.now(), v = view(p.id);
  apply(v, p);
  const t0 = performance.now(), rendered = adapter(v), t1 = performance.now(), gl = context.gl;
  gl.viewport(0, 0, canvas.width, canvas.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
  renderer.begin(); renderer.drawSkeleton(rendered, false); renderer.end();
  const bitmap = canvas.transferToImageBitmap();
  const end = performance.now();
  return { id: p.id, bitmap, anchors: anchors(rendered), cost: end - started, parts: [Math.round(t1 - t0), Math.round(end - t1)], clip: p.pose?.referenceMotion?.name ?? p.entry?.name, at: +(p.pose?.referenceMotion?.time ?? p.fixedTime ?? p.entry?.trackTime ?? 0).toFixed(2) };
}

self.onmessage = async ({ data: message }) => {
  try {
    if (message.type === 'init') { await init(message); self.postMessage({ type: 'ready', slots: data.slots.length, bones: data.bones.length, attachments: table.length }); return; }
    if (!ready) return;
    if (message.type === 'frame') {
      const frames = message.views.map(draw);
      self.postMessage({ type: 'frame', seq: message.seq, frames }, frames.map(f => f.bitmap));
    } else if (message.type === 'camera') setCamera(message.camera);
    else if (message.type === 'drop') views.delete(message.id);
  } catch (error) {
    self.postMessage({ type: 'error', message: String(error?.stack || error), seq: message?.seq });
  }
};
