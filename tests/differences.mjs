import fs from 'node:fs';import assert from 'node:assert/strict';
const load=async file=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8')).toString('base64'));
const {createDifferenceBoard,DifferenceProgress,DifferenceRound}=await load('differences-game.js');
const regions=[0,1,2].map(id=>({id,changed:true,sides:[0,1].map(side=>({name:['Shorts','Feather','Ball'][id],outline:'M90,240 L150,230 L170,400 L95,390 Z',bounds:{x:.1+id*.25,y:.2,w:.2,h:.25},hit:{x:.09+id*.25,y:.19,w:.22,h:.27},...(id===2?{extraHits:[{x:.1,y:.8,w:.2,h:.1}]}:{})}))}));
const pair={id:'test',name:'Pirate Playroom',images:['a.png','b.png'],regions,changed:[0,1,2]};
const normal=createDifferenceBoard(pair),flipped=createDifferenceBoard(pair,{swap:true});assert.deepEqual(normal.pair.images,['a.png','b.png']);assert.deepEqual(flipped.pair.images,['b.png','a.png']);assert.equal(normal.cards.length,2);assert.equal(flipped.pair.regions[0].sides[0],pair.regions[0].sides[1]);assert.deepEqual(pair.images,['a.png','b.png']);
const p=new DifferenceProgress(regions);assert.equal(p.find(99),false);assert.equal(p.find(0),true);assert.equal(p.find(0),false);assert.equal(p.complete,false);p.find(1);p.find(2);assert.equal(p.complete,true);
class Element{
 constructor(tag){this.tag=tag;this.children=[];this.style={};this.attrs={};this.classes=new Set();this.events={};this.classList={add:(...names)=>names.forEach(n=>this.classes.add(n)),remove:(...names)=>names.forEach(n=>this.classes.delete(n)),contains:n=>this.classes.has(n)};}
 append(...items){this.children.push(...items);}replaceChildren(...items){this.children=items;}setAttribute(key,value){this.attrs[key]=value;}addEventListener(key,fn){(this.events[key]??=[]).push(fn);}
}
globalThis.document={createElement:tag=>new Element(tag),createElementNS:(_,tag)=>new Element(tag)};
let wins=0,matches=0,paused=false;const round=new DifferenceRound({element:new Element('main'),picture:normal,isPaused:()=>paused,onMatch:()=>matches++,onComplete:()=>wins++});
assert.equal(round.buttons[0].get(2).length,2);paused=true;assert.equal(round.find(0),false);assert.equal(round.progress.found.size,0);paused=false;
assert.equal(round.find(0),true);assert.equal(round.progress.found.size,1);assert.equal(matches,1);assert.equal(round.find(0),false);assert.equal(round.progress.found.size,1);
for(let side=0;side<2;side++){assert(round.buttons[side].get(0)[0].disabled);const mark=round.wraps[side].children.at(-1);assert.equal(mark.tag,'svg');assert.equal(mark.children[0].tag,'path');assert.equal(mark.children[0].attrs.fill,'none');assert.equal(mark.children[0].attrs.d,pair.regions[0].sides[side].outline);assert.equal(mark.attrs.class,'difference-found-outline');}
assert.equal(round.find(1),true);assert.equal(matches,2);assert.equal(round.find(2),true);assert.equal(wins,1);assert.equal(round.find(2),false);assert.equal(wins,1);for(const map of round.buttons)for(const group of map.values())assert(group.every(b=>b.disabled));round.destroy();assert.equal(round.allowed(),false);
const fresh=new DifferenceRound({element:new Element('main'),picture:flipped,onComplete:()=>wins++});fresh.destroy();assert.equal(fresh.find(0),false);assert.equal(wins,1);
console.log('PASS: three unique differences, either-side matching, duplicate protection, paired unfilled outlines, multiple hit areas, pause, completion and stale-round cleanup.');
