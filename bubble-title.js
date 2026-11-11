/**
 * Bubble titles: the game's lettering style, drawn as SVG so it is razor sharp at any
 * resolution. Each title is four stacked copies of the same text:
 *   1. a thick white rim with a soft navy drop shadow (the 3D drop),
 *   2. a dark navy outline,
 *   3. the gradient fill (sunny yellow-orange or sky blue),
 *   4. a white gloss over the upper half of the letters.
 * Letters bounce slightly up and down and tilt a little, like hand-set toy letters.
 */
const SCHEMES = {
  sun: ['#fffbd2', '#ffe25a', '#ffbe1e', '#ff8d0f'],
  sky: ['#f2fcff', '#9ae0ff', '#45b4f6', '#1f80e0'],
  berry: ['#ffe9f4', '#ff9fcb', '#ff5f9e', '#e43a7f'],
  snow: ['#ffffff', '#ffffff', '#f1f9ff', '#c9e8ff'],
  navy: ['#4a68ee', '#2c4cd4', '#1f3bb4', '#172d94']
};
let serial = 0;
const measurer = document.createElement('canvas').getContext('2d');
const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Returns an <svg> element; height follows the box it is placed in. */
export function bubbleTitle(text, { scheme = 'sun', size = 100, bounce = .07, tilt = 4, letterSpacing = .02, outline = '#12397a', shadow = '#0c2f66' } = {}) {
  const id = 'bt' + Math.random().toString(36).slice(2, 6) + (++serial), colors = SCHEMES[scheme] ?? SCHEMES.sun;
  measurer.font = `1000 ${size}px Nunito, 'Arial Rounded MT Bold', Arial, sans-serif`;
  const chars = [...text], rim = size * .36, pad = rim * .75;
  const width = Math.ceil(measurer.measureText(text).width + chars.length * size * letterSpacing + pad * 2);
  const height = Math.ceil(size * 1.32 + pad * 2), base = pad + size * .98;
  // Per-glyph bounce (dy is relative to the previous glyph) and tilt.
  let prev = 0; const dy = [], rot = [];
  chars.forEach((ch, i) => { const target = ch === ' ' ? 0 : (i % 2 ? -1 : 1) * size * bounce; dy.push((target - prev).toFixed(1)); prev = target; rot.push(ch === ' ' ? 0 : ((i % 3) - 1) * tilt); });
  const attrs = `x="50%" y="${base}" text-anchor="middle" dy="${dy.join(' ')}" rotate="${rot.join(' ')}" letter-spacing="${(size * letterSpacing).toFixed(1)}" font-family="Nunito, 'Arial Rounded MT Bold', Arial, sans-serif" font-weight="1000" font-size="${size}" stroke-linejoin="round" paint-order="stroke"`;
  const t = esc(text), svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`); svg.setAttribute('class', 'bubble-title'); svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = `<defs><linearGradient id="${id}f" x1="0" y1="${base - size * .82}" x2="0" y2="${base + size * .12}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${colors[0]}"/><stop offset=".38" stop-color="${colors[1]}"/><stop offset=".72" stop-color="${colors[2]}"/><stop offset="1" stop-color="${colors[3]}"/></linearGradient><linearGradient id="${id}g" x1="0" y1="${base - size * .8}" x2="0" y2="${base - size * .32}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><filter id="${id}s" x="-10%" y="-20%" width="120%" height="160%"><feDropShadow dx="0" dy="${(size * .085).toFixed(1)}" stdDeviation="${(size * .02).toFixed(1)}" flood-color="${shadow}" flood-opacity=".75"/></filter></defs>`
    + `<text ${attrs} fill="#fff" stroke="#fff" stroke-width="${rim.toFixed(1)}" filter="url(#${id}s)">${t}</text>`
    + `<text ${attrs} fill="${outline}" stroke="${outline}" stroke-width="${(size * .17).toFixed(1)}">${t}</text>`
    + `<text ${attrs} fill="url(#${id}f)">${t}</text>`
    + `<text ${attrs} fill="url(#${id}g)">${t}</text>`;
  return svg;
}
