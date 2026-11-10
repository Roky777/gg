/* Shared by the page and the rig worker: how a posed skeleton travels between them. */
export const ANCHORS = ['Hand_L', 'Hand_R', 'Mouth_O', 'Mouth_Sad', 'Mouth_Smile', 'Mouth_Teeth', 'Mouth_Happy'];

// Attachments are identified by their position in the skins, built the same way on
// both sides from the same skeleton file.
export function attachmentTable(skeletonData) {
  const list = [];
  for (const skin of skeletonData.skins) for (const entry of skin.getAttachments()) list.push(entry.attachment);
  return list;
}

/** Pack a posed skeleton (after the page's animation and pose modifiers) for the worker. */
export function packPose(v, index, extra) {
  const sk = v.skeleton, bones = sk.bones, slots = sk.slots, B = new Float32Array(bones.length * 20);
  for (let i = 0; i < bones.length; i++) {
    const b = bones[i], o = i * 20;
    B[o] = b.a; B[o + 1] = b.b; B[o + 2] = b.c; B[o + 3] = b.d; B[o + 4] = b.worldX; B[o + 5] = b.worldY;
    B[o + 6] = b.x; B[o + 7] = b.y; B[o + 8] = b.rotation; B[o + 9] = b.scaleX; B[o + 10] = b.scaleY; B[o + 11] = b.shearX; B[o + 12] = b.shearY;
    B[o + 13] = b.ax; B[o + 14] = b.ay; B[o + 15] = b.arotation; B[o + 16] = b.ascaleX; B[o + 17] = b.ascaleY; B[o + 18] = b.ashearX; B[o + 19] = b.ashearY;
  }
  const attachments = new Int32Array(slots.length), colors = new Float32Array(slots.length * 4), sequence = new Int32Array(slots.length);
  let dark = null; const deformSlots = [], deforms = [];
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i], a = s.getAttachment();
    attachments[i] = a ? (index.get(a) ?? -1) : -1;
    colors[i * 4] = s.color.r; colors[i * 4 + 1] = s.color.g; colors[i * 4 + 2] = s.color.b; colors[i * 4 + 3] = s.color.a;
    sequence[i] = s.sequenceIndex ?? -1;
    if (s.darkColor) { dark ??= new Float32Array(slots.length * 4); dark[i * 4] = s.darkColor.r; dark[i * 4 + 1] = s.darkColor.g; dark[i * 4 + 2] = s.darkColor.b; dark[i * 4 + 3] = s.darkColor.a; }
    if (s.deform?.length) { deformSlots.push(i); deforms.push(Float32Array.from(s.deform)); }
  }
  const drawOrder = Int16Array.from(sk.drawOrder, s => s.data.index);
  const skeleton = Float32Array.of(sk.color.r, sk.color.g, sk.color.b, sk.color.a, sk.x, sk.y, sk.scaleX, sk.scaleY);
  const entry = v.entry ? { name: v.entry.animation.name, trackTime: v.entry.trackTime, loop: !!v.entry.loop } : null;
  let pose = sk.sparkyAuthoredPose ?? null;
  if (pose) { try { pose = structuredClone(pose); } catch { pose = JSON.parse(JSON.stringify(pose)); } }
  const message = { bones: B, attachments, colors, dark, sequence, deformSlots, deforms, drawOrder, skeleton, entry, pose, ...extra };
  const transfer = [B.buffer, attachments.buffer, colors.buffer, sequence.buffer, drawOrder.buffer, skeleton.buffer, ...deforms.map(d => d.buffer)];
  if (dark) transfer.push(dark.buffer);
  return { message, transfer };
}

/** The page-side stand-in for the reshaped skeleton: only the anchor points props read. */
export function anchorSkeleton(anchors) {
  return { findSlot(name) { const p = anchors?.[name]; return p ? { getAttachment: () => ({ vertices: p }) } : null; } };
}
