import fs from 'node:fs';import assert from 'node:assert/strict';
const root=new URL('../assets/art/',import.meta.url);const candidate=new URL('differences/manifest-candidate.json',root),live=new URL('differences/manifest.json',root);const manifest=JSON.parse(fs.readFileSync(fs.existsSync(live)?live:candidate));
assert.equal(manifest.ready,true);assert.equal(manifest.boards.length,20);assert.equal(new Set(manifest.boards.map(p=>p.id)).size,20);const paths=new Set();
for(const board of manifest.boards){assert.equal(board.images.length,2);assert.equal(board.regions.filter(r=>r.changed).length,3);assert.equal(new Set(board.regions.map(r=>r.id)).size,3);for(const path of board.images){assert(!path.includes('shelf'));paths.add(path);const png=fs.readFileSync(new URL(path,root));assert.equal(png.subarray(1,4).toString(),'PNG');assert.equal(png.readUInt32BE(16),900);assert.equal(png.readUInt32BE(20),1200);assert.equal(png[25],2);}for(const region of board.regions){assert.equal(region.sides.length,2);for(const side of region.sides){assert(!/[\u0900-\u097f]/.test(side.name));for(const box of [side.bounds,side.hit,...(side.extraHits||[])]){assert(box.x>=0&&box.y>=0&&box.w>0&&box.h>0);assert(box.x+box.w<=1.00001&&box.y+box.h<=1.00001);}}}}
assert.equal(paths.size,40);
const font=fs.readFileSync(new URL('../assets/fonts/Nunito-Variable.ttf',import.meta.url));assert.equal(font.readUInt32BE(0),0x00010000);assert(font.includes(Buffer.from('fvar')));assert(fs.readFileSync(new URL('../assets/fonts/OFL-Nunito.txt',import.meta.url),'utf8').includes('SIL OPEN FONT LICENSE'));
console.log('PASS: 20 story boards, 40 full PNG photos, three unique mapped differences each, valid paired hit areas, English labels and licensed local Nunito variable font.');

// Regression: the fins must not acquire the neighboring starfish's edge.
const contourCatalog=JSON.parse(fs.readFileSync(new URL('../assets/art/differences/manifest.json',import.meta.url),'utf8'));
const underwater=contourCatalog.boards.find(b=>b.id==='underwater');
for(const side of underwater.regions[0].sides){
 assert.equal((side.outline.match(/M/g)||[]).length,2);
 const xs=[...side.outline.matchAll(/(\d+),(\d+)/g)].map(m=>Number(m[1]));assert(Math.max(...xs)<558,'Fin outline leaked onto the starfish');
}

// Train highlighting follows visible exterior segments, without windows/stripes
// or joining across the foreground cap, child, and station pillar.
const station=contourCatalog.boards.find(b=>b.id==='station');
const overrides=JSON.parse(fs.readFileSync(new URL('../assets/art/differences/outline-overrides.json',import.meta.url),'utf8'));
for(const side of station.regions[2].sides){assert.equal(side.outline,overrides.station['2']);assert(!side.outline.includes('Z'));assert.equal((side.outline.match(/M/g)||[]).length,6);}
for(const side of station.regions[0].sides)assert.equal(side.outline,overrides.station['0']);
