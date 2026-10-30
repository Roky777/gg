import assert from 'node:assert/strict';import fs from 'node:fs';
const load=async file=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8')).toString('base64'));
const {AssemblyDeck,ASSEMBLY_PICTURES}=await load('assembly-catalog.js');
const {AssemblyRound,createAssemblyBoard,sectionAt,shuffledSections}=await load('assembly-game.js');
const manifest=JSON.parse(fs.readFileSync(new URL('../assets/art/assembly/manifest.json',import.meta.url)));assert.equal(manifest.ready,true);assert.equal(manifest.images.length,40);
for(const item of ASSEMBLY_PICTURES){const png=fs.readFileSync(new URL('../assets/art/assembly/'+item.id+'.png',import.meta.url));assert.equal(png.subarray(1,4).toString(),'PNG');assert.equal(png.readUInt32BE(16),768);assert.equal(png.readUInt32BE(20),768);}
assert.equal(ASSEMBLY_PICTURES.length,40);assert.equal(new Set(ASSEMBLY_PICTURES.map(x=>x.id)).size,40);
let seed=37;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);const deck=new AssemblyDeck(ASSEMBLY_PICTURES,random);let last;
for(let cycle=0;cycle<10;cycle++){const bag=Array.from({length:40},()=>deck.next());assert.equal(new Set(bag.map(x=>x.id)).size,40);assert.notEqual(bag[0].id,last);last=bag.at(-1).id;}
assert.equal(sectionAt(99,{top:100,bottom:400,height:300}),-1);assert.equal(sectionAt(100,{top:100,bottom:400,height:300}),0);assert.equal(sectionAt(250,{top:100,bottom:400,height:300}),1);assert.equal(sectionAt(400,{top:100,bottom:400,height:300}),2);assert.equal(sectionAt(401,{top:100,bottom:400,height:300}),-1);
for(let i=0;i<100;i++){const sections=shuffledSections(random);assert.deepEqual([...sections].sort(),[0,1,2]);assert(!sections.every((v,i)=>v===i));}
class Element{
 constructor(tag){this.tag=tag;this.children=[];this.style={};this.attrs={};this.events={};this.classes=new Set();this.classList={add:(...names)=>names.forEach(n=>this.classes.add(n)),remove:(...names)=>names.forEach(n=>this.classes.delete(n)),toggle:(n,on)=>{if(on??!this.classes.has(n))this.classes.add(n);else this.classes.delete(n);},contains:n=>this.classes.has(n)};}
 append(...els){this.children.push(...els);}replaceChildren(...els){this.children=els;}setAttribute(k,v){this.attrs[k]=v;}removeAttribute(k){delete this.attrs[k];}addEventListener(k,fn){(this.events[k]??=[]).push(fn);}focus(){this.focused=true;}remove(){this.removed=true;}setPointerCapture(){}getBoundingClientRect(){return {left:100,right:400,top:100,bottom:400,width:300,height:300};}cloneNode(){return new Element(this.tag);}
}
globalThis.document={createElement:tag=>new Element(tag),body:new Element('body')};
const calls=[],spoken=[];let finished=0,matched=0,paused=false;
const round=new AssemblyRound({element:new Element('main'),picture:createAssemblyBoard(ASSEMBLY_PICTURES[0]),sound:kind=>calls.push(kind),tell:(text,options)=>spoken.push({text,options}),director:{request:(name)=>calls.push(name)},onComplete:()=>finished++,onMatch:()=>matched++,isPaused:()=>paused,random});
assert.equal(round.sources[0].events.click,undefined);assert.equal(round.zones[0].events.click,undefined);round.place(0,2);assert.equal(round.placed.size,0);round.place(0,1);assert(round.zones[0].classList.contains('hint'));assert.equal(round.placed.size,0);assert.equal(spoken.at(-1).options.speak,false);
round.place(0,0);assert.equal(round.placed.size,1);assert(round.sources[0].disabled);assert.equal(round.selected,null);round.place(0,0);assert.equal(round.placed.size,1);
paused=true;round.place(1,1);assert.equal(round.placed.size,1);paused=false;
round.place(1,1);round.place(2,2);assert.equal(finished,1);assert.equal(round.placed.size,3);assert.equal(matched,2);assert(spoken.every(line=>line.options.speak===false));round.place(2,2);assert.equal(finished,1);round.destroy();assert.equal(round.allowed(),false);
// Pointer capture: release outside cancels placement, release on the right zone fits.
let fits=0;const pointerRound=new AssemblyRound({element:new Element('main'),picture:createAssemblyBoard(ASSEMBLY_PICTURES[1]),sound(){},tell(){},director:{request(){}},onComplete:()=>fits++,random});
const event=(x,y)=>({clientX:x,clientY:y,pointerId:1,button:0,preventDefault(){}});
pointerRound.begin(event(500,150),0);pointerRound.end(event(500,150));assert.equal(pointerRound.selected,null);assert.equal(pointerRound.placed.size,0,'A tap must not select or place a piece');
pointerRound.begin(event(500,150),0);pointerRound.move(event(450,160));pointerRound.end(event(450,160));assert.equal(pointerRound.placed.size,0);assert.equal(pointerRound.ghost,null);
pointerRound.begin(event(500,150),0);pointerRound.move(event(150,150));pointerRound.end(event(150,150));assert.equal(pointerRound.placed.size,1);assert.equal(pointerRound.ghost,null);pointerRound.destroy();assert.equal(fits,0);
// Decorative socket margins must not count as picture drop targets.
const insetRound=new AssemblyRound({element:new Element('main'),picture:createAssemblyBoard(ASSEMBLY_PICTURES[2]),sound(){},tell(){},onComplete(){},random});
insetRound.target.getBoundingClientRect=()=>({left:130,right:370,top:130,bottom:370,width:240,height:240});
insetRound.begin(event(500,150),0);insetRound.move(event(115,150));insetRound.end(event(115,150));assert.equal(insetRound.placed.size,0);
insetRound.begin(event(500,150),0);insetRound.move(event(150,150));insetRound.end(event(150,150));assert.equal(insetRound.placed.size,1);
insetRound.begin(event(500,250),1);insetRound.move(event(150,250));insetRound.end(event(150,250));assert.equal(insetRound.placed.size,2);
insetRound.begin(event(500,340),2);insetRound.move(event(150,340));insetRound.end(event(150,340));assert.equal(insetRound.placed.size,3);insetRound.destroy();
console.log('PASS: 40-picture shuffle bags, no boundary repeats, exact slice selection, wrong-slot hints, drag-only placement, pause, duplicate prevention and round cleanup.');
