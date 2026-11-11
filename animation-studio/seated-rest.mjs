// Seated rest at the feeding table. The old rest hung the arms straight down behind the table
// edge, so only glove tips peeked over it (looked cut off). The new rest lays the gloves on the
// table edge with the forearms showing. Arm keys near the old rest are moved towards the new one
// (fully at the rest, fading out by 45 units away) so big gestures keep their authored shapes.
export const OLD_REST = { L: [-58, 124], R: [59, 124] };
export const NEW_REST = { L: [-42, 150], R: [42, 150] };
const done = new WeakSet();
export function remapSeatedRest(clips) {
  for (const c of clips) {
    if (!c?.channels || done.has(c)) continue; done.add(c);
    for (const side of ['L', 'R']) {
      const keys = c.channels[side]; if (!keys) continue;
      const o = OLD_REST[side], n = NEW_REST[side];
      for (const k of keys) { const w = Math.max(0, 1 - Math.hypot(k[1] - o[0], k[2] - o[1]) / 45); k[1] += w * (n[0] - o[0]); k[2] += w * (n[1] - o[1]); }
    }
  }
  return clips;
}
