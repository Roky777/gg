import { applyRigPose, createSpeechAnimation } from './player.js?v=perf-4';
import { attachmentTable, packPose, anchorSkeleton } from './rig-wire.js?v=1';
const SVG_PAGES = ['./feeding-mouth.svg', './limbs-v2/limb-parts.svg'];

/**
 * Same interface as FullCharacterPlayer, but the painted reshaping and drawing run in
 * rig-worker.js. The page only animates the skeleton (Spine state + pose modifiers)
 * and paints the finished frame, so Sparky no longer competes with taps and drags.
 *
 * Differences callers can see:
 *  - `referenceAdapter` is not available here; `afterFrame(rendered, view)` runs when a
 *    frame is shown, with a stand-in skeleton that answers `findSlot(name)` for the
 *    hands and mouth (what the feeding/teaching props read).
 *  - `instance.renderer.camera` is a plain copy of the worker's camera.
 */
export class WorkerRigPlayer {
  static supported() {
    try { return typeof Worker === 'function' && typeof OffscreenCanvas === 'function' && 'transferToImageBitmap' in OffscreenCanvas.prototype && !!new OffscreenCanvas(1, 1).getContext('webgl'); }
    catch { return false; }
  }

  static async load(manifestURL, { renderWidth = 768, camera, spineURL, profileURL, timeout = 30000 } = {}) {
    const url = new URL(manifestURL, document.baseURI), manifest = await (await fetch(url)).json();
    const resource = p => new URL(p, url).href + '?v=' + manifest.revision;
    // Pose data only: textures are loaded by the worker, which draws.
    const [skel, atlasText] = await Promise.all([
      fetch(resource(manifest.skeleton)).then(r => { if (!r.ok) throw Error('Unable to load skeleton'); return r.arrayBuffer(); }),
      fetch(resource(manifest.atlas)).then(r => { if (!r.ok) throw Error('Unable to load atlas'); return r.text(); })
    ]);
    const data = new spine.SkeletonBinary(new spine.AtlasAttachmentLoader(new spine.TextureAtlas(atlasText))).readSkeletonData(new Uint8Array(skel));
    // Workers cannot decode SVG, and two atlas pages are SVG: rasterize them here at their
    // natural size (what the page renderer uploads) and hand the worker PNGs instead.
    const svgPages = {};
    await Promise.all(SVG_PAGES.map(async path => {
      const src = new URL(path, import.meta.url).href, img = new Image(); img.src = src; await img.decode();
      const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; c.getContext('2d').drawImage(img, 0, 0);
      svgPages[src] = await new Promise(r => c.toBlob(r, 'image/png'));
    }));
    const worker = new Worker(new URL('./rig-worker.js?v=2', import.meta.url), { type: 'module' });
    const player = new WorkerRigPlayer(manifest, data, worker, renderWidth, camera);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error('Rig worker did not start')), timeout);
      worker.onerror = e => { clearTimeout(timer); reject(Error('Rig worker failed: ' + (e.message || 'error'))); };
      worker.onmessage = ({ data: m }) => {
        if (m.type === 'ready') {
          clearTimeout(timer);
          if (m.attachments !== player.table.length || m.slots !== data.slots.length) { reject(Error('Rig worker skeleton differs')); return; }
          worker.onmessage = e => player.receive(e.data); worker.onerror = e => console.error('Rig worker error', e.message); resolve();
        } else if (m.type === 'error') { clearTimeout(timer); reject(Error(m.message)); }
      };
      worker.postMessage({ type: 'init', svgPages, spineURL: new URL(spineURL, document.baseURI).href, manifestURL: url.href, renderWidth, camera, profileURL: new URL(profileURL, document.baseURI).href });
    }).catch(error => { worker.terminate(); throw error; });
    player.start();
    return player;
  }

  constructor(manifest, data, worker, renderWidth, camera) {
    Object.assign(this, { manifest, data, worker, renderWidth, isWorker: true });
    this.views = new Set(); this.byId = new Map(); this.nextId = 1; this.seq = 0; this.inflight = null;
    this.time = 0; this.speed = 1; this.framesShown = 0; this.paused = false; this.last = performance.now(); this.gloveSkinEnabled = true;
    this.table = attachmentTable(data); this.index = new Map(this.table.map((a, i) => [a, i]));
    const cam = { position: { x: camera.x, y: camera.y }, viewportWidth: camera.width, viewportHeight: camera.height };
    this.instance = { renderer: { camera: cam }, dispose: () => {} };
    this.canvas = { width: renderWidth, height: Math.round(renderWidth * 1.25) };
    globalThis.sparkyRig = this; this.pointerActive = false;
  }

  start() {
    const tick = () => { if (this.destroyed) return; this.frame = requestAnimationFrame(tick); this.step(); };
    this.frame = requestAnimationFrame(tick);
  }

  step() {
    const now = performance.now(), dt = Math.min((now - this.last) / 1000, .1); this.last = now;
    if (!this.paused && !document.hidden) this.time += dt * this.speed;
    if (document.hidden) return;
    // A frame that never came back (worker busy or lost) must not freeze Sparky forever.
    if (this.inflight && now - this.inflight.sent > 2000) this.inflight = null;
    if (this.inflight) return;
    let speaking = false; for (const v of this.views) if (v.speaking) { speaking = true; break; }
    if (!speaking && now < (this.holdUntil ?? 0)) return;
    if (now - (this.lastFrame ?? -1e9) < 33 - 4) return;
    const poses = [], transfer = [];
    for (const v of this.views) {
      if (!v.visible || (!v.dirty && this.paused && !v.speaking)) continue;
      applyRigPose(v, this.time);
      const shape = v.speaking ? v.speechSource?.()?.shape ?? null : null;
      const packed = packPose(v, this.index, { id: v.id, fixedTime: v.fixedTime, speaking: v.speaking, shape });
      poses.push(packed.message); transfer.push(...packed.transfer);
      v.tableY = v.skeleton.sparkyAuthoredPose?.tableOcclusionY; v.dirty = false;
    }
    if (!poses.length) return;
    this.lastFrame = now; this.inflight = { seq: ++this.seq, sent: now };
    this.worker.postMessage({ type: 'frame', seq: this.seq, views: poses }, transfer);
  }

  receive(m) {
    if (m.type === 'error') { console.error('Sparky rig worker:', m.message); this.inflight = null; return; }
    if (m.type !== 'frame') return;
    const sent = this.inflight?.seq === m.seq ? this.inflight.sent : null; this.inflight = null;
    for (const f of m.frames) {
      const v = this.byId.get(f.id);
      if (!v || this.destroyed) { f.bitmap.close(); continue; }
      const ctx = v.context, w = v.canvas.width, h = v.canvas.height;
      ctx.clearRect(0, 0, w, h); ctx.drawImage(f.bitmap, 0, 0, w, h); f.bitmap.close();
      if (Number.isFinite(v.tableY)) { const c = this.instance.renderer.camera, row = (c.position.y + c.viewportHeight / 2 - v.tableY) / c.viewportHeight * h; ctx.clearRect(0, Math.max(0, row), w, h); }
      v.rendered = anchorSkeleton(f.anchors); this.framesShown++;
      try { this.afterFrame?.(v.rendered, v); } catch (error) { console.error(error); }
      this.workerCost = this.workerCost ? this.workerCost * .85 + f.cost * .15 : f.cost;
    }
    if (sent !== null) { const cost = performance.now() - sent; this.renderCost = this.renderCost ? this.renderCost * .85 + cost * .15 : cost; }
  }

  add(canvas, clip, { loop = true, baseClip = null, preserveSlots = [] } = {}) {
    const speechAnimation = createSpeechAnimation(this.data);
    const skeleton = new spine.Skeleton(this.data), stateData = new spine.AnimationStateData(this.data), state = new spine.AnimationState(stateData);
    const validate = name => { if (!this.data.findAnimation(name)) throw Error('Unknown clip: ' + name); }; validate(clip);
    if (baseClip) { validate(baseClip); state.setAnimation(0, baseClip, true); }
    state.apply(skeleton);
    const baseAttachments = new Map(skeleton.slots.map(slot => [slot.data.name, slot.getAttachment()]));
    const attachments = names => names.map(name => { const slot = skeleton.findSlot(name); if (!slot) throw Error('Unknown preserved slot: ' + name); return [slot, baseAttachments.get(name)]; });
    // Resizing clears a canvas: keep its current picture (the still of Sparky) until the first live frame.
    if (canvas.width !== this.canvas.width || canvas.height !== this.canvas.height) { const keep = document.createElement('canvas'); keep.width = canvas.width; keep.height = canvas.height; keep.getContext('2d').drawImage(canvas, 0, 0); canvas.width = this.canvas.width; canvas.height = this.canvas.height; canvas.getContext('2d').drawImage(keep, 0, 0, canvas.width, canvas.height); }
    const track = baseClip ? 1 : 0, id = this.nextId++;
    const v = { id, speechAnimation, speaking: false, speechStarted: 0, poseModifier: null, canvas, context: canvas.getContext('2d'), skeleton, state, stateData, track, baseAttachments, preservedAttachments: attachments(preserveSlots), retiringAttachments: [], preserveUntil: 0, entry: state.setAnimation(track, clip, loop), visible: true, dirty: true, start: this.time, previousTime: this.time, fixedTime: null };
    this.views.add(v); this.byId.set(id, v);
    return {
      setSpeechSource: fn => { v.speechSource = fn; v.dirty = true; },
      setSpeech: value => { if (v.speaking !== value) { v.speaking = value; v.speechStarted = this.time; v.dirty = true; } },
      setPoseModifier: fn => { v.poseModifier = fn; v.dirty = true; },
      setAnimation: (name, { loop = true, mixSeconds = .35, preserveSlots = [] } = {}) => {
        validate(name);
        applyRigPose(v, this.time);
        v.retiringAttachments = v.preservedAttachments; v.preserveUntil = this.time + mixSeconds;
        v.preservedAttachments = attachments(preserveSlots);
        stateData.setMix(v.entry.animation.name, name, mixSeconds);
        v.entry = state.setAnimation(track, name, loop); v.start = this.time; v.previousTime = this.time; v.fixedTime = null; v.dirty = true;
      },
      setVisible: value => { v.visible = value; v.dirty = true; },
      seek: time => { v.fixedTime = time; v.dirty = true; },
      restart: () => { v.fixedTime = null; v.start = this.time; v.previousTime = this.time; v.dirty = true; },
      destroy: () => { this.views.delete(v); this.byId.delete(id); this.worker.postMessage({ type: 'drop', id }); }
    };
  }
  setPaused(value) { this.paused = value; for (const v of this.views) v.dirty = true; }
  setSpeed(value) { this.speed = value; }
  destroy() { this.destroyed = true; cancelAnimationFrame(this.frame); this.views.clear(); this.worker.terminate(); }
}
