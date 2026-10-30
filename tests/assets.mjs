import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const modelSource=fs.readFileSync(new URL('../model.js',import.meta.url),'utf8');
const {PICTURES}=await import('data:text/javascript;base64,'+Buffer.from(modelSource).toString('base64'));
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const exists=p=>assert(fs.existsSync(path.join(root,p)),`Missing ${p}`);
for(const f of ['index.html','game.css','game.js','model.js','mascot-director.js','game-audio.js','assets/audio/daylight-on-the-carpet.mp3','assets/art/park-grounded-v3.webp',...['sunshine','rocket','duck','apple'].map(n=>`assets/art/${n}-wide-v3.webp`)])exists(f);
assert.equal(PICTURES.length,36);
let count=0;for(const p of PICTURES){assert.equal(p.cards.length,3);for(const card of p.cards){exists(`assets/art/${card.image}`);const png=fs.readFileSync(path.join(root,'assets/art',card.image));assert(card.image.endsWith('.png'));assert.equal(png.subarray(1,4).toString(),'PNG');assert.equal(png.readUInt32BE(16),600);assert.equal(png.readUInt32BE(20),1140);count++;}assert.equal(p.axis,'vertical');}
assert.equal(count,108);
for(const name of ['sound-on','sound-off','close','next','play','restart'])exists(`assets/icons/${name}.png`);
for(const name of ['sound-on','sound-off','pause','next'])exists(`assets/art/ui-controls/${name}-v1.svg`);
for(const name of ['teal','gold']){const png=fs.readFileSync(path.join(root,`assets/art/ui-controls/button-${name}-v1.png`));assert.equal(png.subarray(1,4).toString(),'PNG');assert(png.readUInt32BE(16)>=1024);assert.equal(png.readUInt32BE(16),png.readUInt32BE(20));assert.equal(png[25],6,'Button art must preserve RGBA transparency');}
exists('controls.css');
const pack='sparky-animations 4';const manifest=JSON.parse(fs.readFileSync(path.join(root,pack,'manifest.json')));
for(const name of [manifest.skeleton,manifest.atlas,manifest.texture,'rig-player.js','vendor/spine-webgl.min.js','vendor/SPINE-LICENSE.txt'])exists(`${pack}/${name}`);
assert(manifest.camera.width>0&&manifest.camera.height>0);
const texture=fs.readFileSync(path.join(root,pack,manifest.texture));assert.equal(texture.readUInt32BE(16),4096);assert.equal(texture.readUInt32BE(20),4096);
const director=fs.readFileSync(path.join(root,'mascot-director.js'),'utf8');
const clipSource=director.match(/export const CLIPS=\{([\s\S]+?)\};/)[1];
const clips=[...clipSource.matchAll(/\w+:(['"])(.*?)\1/g)].map(m=>m[2]);assert.equal(clips.length,14);
for(const name of clips){const clip=manifest.animations.find(c=>c.name===name);assert(clip,`Unknown clip ${name}`);assert(clip.duration>0);assert.equal(clip.loop,name==='0Final/Idle/Idle_EB');}
const game=fs.readFileSync(path.join(root,'game.js'),'utf8');assert(game.includes("flow.complete()"));assert(!game.includes('presentation.json'));
for(const old of ['assets/animations','assets/animations-before-rig-v3','assets/rig','assets/character','player.js','player-before-rig-v3.js','presentation.json','rig','rig-player.js','sparky-character.js'])assert(!fs.existsSync(path.join(root,old)),`Legacy animation remains: ${old}`);
console.log('PASS: 36 semantic ordering puzzles, 108 whole PNG picture-card references, controls, complete bundled Spine pack, fourteen game actions, loop flags, native PNG card dimensions and bundled runtime.');
