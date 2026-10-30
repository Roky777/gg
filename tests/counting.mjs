import fs from 'node:fs';import assert from 'node:assert/strict';
const load=file=>import(new URL('../'+file,import.meta.url));
const {COUNTING_ITEMS,makeCountingBoard,RowCount,CountingRound}=await load('counting-game.js');
const assets=JSON.parse(fs.readFileSync(new URL('../assets/art/counting/manifest.json',import.meta.url)));assert.equal(assets.ready,true);assert.equal(assets.images.length,20);
for(const item of COUNTING_ITEMS){const png=fs.readFileSync(new URL('../assets/art/counting/'+item.id+'.png',import.meta.url));assert.equal(png.subarray(1,4).toString(),'PNG');assert.equal(png.readUInt32BE(16),512);assert.equal(png.readUInt32BE(20),512);}
assert.equal(COUNTING_ITEMS.length,20);assert.equal(new Set(COUNTING_ITEMS.map(x=>x.id)).size,20);
let seed=17;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);let recent=[];const seen=new Set(),items=new Set();
for(let i=0;i<1500;i++){
 const wins=i%9,b=makeCountingBoard({wins,recent},random);assert.equal(b.cards.length,4);assert.equal(new Set(b.cards.map(c=>c.id)).size,4);assert.equal(new Set(b.numbers).size,4);assert.deepEqual([...b.numbers].sort((a,b)=>a-b),b.cards.map(c=>c.amount).sort((a,b)=>a-b));assert(!recent.includes(b.id));assert(!b.numbers.every((n,i)=>n===b.cards[i].amount));for(const c of b.cards){assert(c.amount>=1&&c.amount<=(wins<3?5:wins<6?8:10));items.add(c.id);}seen.add(b.id);recent=[...recent,b.id].slice(-12);
}
assert.equal(items.size,20);assert(seen.size>1400);
const counter=new RowCount(5);assert.equal(counter.tap(4),1);assert.equal(counter.tap(0),2);assert.equal(counter.tap(4),1);assert.equal(counter.ordinals.size,2);assert.equal(counter.tap(5),null);assert.equal(counter.tap(-1),null);
class Element{
 constructor(tag){this.tag=tag;this.children=[];this.style={setProperty(k,v){this[k]=v;}};this.attrs={};this.events={};this.classes=new Set();this.classList={add:(...names)=>names.forEach(n=>this.classes.add(n)),remove:(...names)=>names.forEach(n=>this.classes.delete(n)),toggle:(n,on)=>{if(on??!this.classes.has(n))this.classes.add(n);else this.classes.delete(n);},contains:n=>this.classes.has(n)};}
 append(...els){this.children.push(...els);}replaceChildren(...els){this.children=els;}setAttribute(k,v){this.attrs[k]=v;}addEventListener(k,fn){(this.events[k]??=[]).push(fn);}focus(){this.focused=true;}remove(){this.removed=true;}setPointerCapture(){}getBoundingClientRect(){return {left:100,right:400,top:100,bottom:200,width:300,height:100};}cloneNode(deep=false){const copy=new Element(this.tag);copy.className=this.className;Object.assign(copy.style,this.style);if(deep)copy.children=this.children.map(c=>c.cloneNode(true));return copy;}querySelector(selector){return this.children.find(c=>c.className===selector.slice(1))||null;}
}
globalThis.document={createElement:tag=>new Element(tag),body:new Element('body')};
let complete=0,matches=0,paused=false;const heard=[];const picture=makeCountingBoard({wins:0},random);
const round=new CountingRound({element:new Element('main'),picture,onCount:(n,row)=>heard.push([n,row]),onMatch:()=>matches++,onComplete:()=>complete++,isPaused:()=>paused});
const row=picture.cards.findIndex(c=>c.amount>=2);round.count(row,1);round.count(row,0);round.count(row,1);assert.deepEqual(heard,[[1,row],[2,row],[1,row]]);assert.equal(round.counts[row].ordinals.size,2);assert.equal(round.objects[row][1].querySelector('.object-ordinal').textContent,'1');assert.equal(round.objects[row][0].querySelector('.object-ordinal').textContent,'2');
const wrong=picture.cards.find(c=>c.amount!==picture.cards[0].amount).amount;round.place(wrong,0);assert.equal(round.answers.size,0);
paused=true;round.count(row,0);round.place(picture.cards[0].amount,0);assert.equal(heard.length,3);assert.equal(round.answers.size,0);paused=false;
picture.cards.forEach((c,i)=>round.place(c.amount,i));assert.equal(complete,1);assert.equal(matches,3);assert.equal(round.answers.size,4);round.place(picture.cards[0].amount,0);assert.equal(complete,1);round.destroy();assert(!round.allowed());
// A child can answer the entire board with no counting taps at all.
let direct=0;const bypass=new CountingRound({element:new Element('main'),picture,onComplete:()=>direct++});picture.cards.forEach((c,i)=>bypass.place(c.amount,i));assert.equal(direct,1);assert(bypass.counts.every(c=>c.ordinals.size===0));bypass.destroy();
// Dragged numbers use row hit areas and never require prior counting.
const dragged=new CountingRound({element:new Element('main'),picture});
dragged.rows.forEach((row,i)=>{row.getBoundingClientRect=()=>({left:100,right:400,top:100+i*120,bottom:200+i*120,width:300,height:100});});
const event=(x,y)=>({clientX:x,clientY:y,pointerId:7,button:0,preventDefault(){}});
const number=picture.cards[1].amount;
dragged.begin(event(500,150),number);dragged.move(event(250,270));dragged.end(event(250,270));assert(dragged.answers.has(1));assert.equal(dragged.ghost,null);assert(dragged.counts.every(c=>c.ordinals.size===0));
const outside=picture.cards[0].amount;dragged.begin(event(500,150),outside);dragged.move(event(450,180));dragged.end(event(450,180));assert.equal(dragged.answers.size,1);assert.equal(dragged.ghost,null);dragged.destroy();
console.log('PASS: 1,500 varied four-row boards, 20 assets, adaptive counts, unique number answers, optional counting, no double-counting, visible ordinals, direct answers, pause and cleanup.');

// The same colorful PNG is kept when a tile moves into an answer dock.
for(const [number,chip] of round.chips){assert.equal(chip.querySelector('.number-art').style.backgroundImage,`url('assets/art/ui-board/numbers/${number}.png')`);}
for(const rowIndex of round.answers){const amount=picture.cards[rowIndex].amount;assert.equal(round.docks[rowIndex].querySelector('.number-art').style.backgroundImage,`url('assets/art/ui-board/numbers/${amount}.png')`);}

const taps=new CountingRound({element:new Element('main'),picture});
for(const chip of taps.chips.values()){chip.events.click[0]({detail:0});assert.equal(taps.selected,null,'Reading a number must not select a tile');}
for(const dock of taps.docks)assert.equal(dock.events.click,undefined,'Dock taps must not place a tile');
taps.begin(event(500,150),picture.cards[0].amount);taps.end(event(500,150));assert.equal(taps.selected,null);assert.equal(taps.answers.size,0);
taps.objects[0][0].events.click[0]();assert.equal(taps.counts[0].ordinals.size,1,'Picture taps still count');taps.destroy();
console.log('PASS: stationary taps cannot select/place numbers; picture taps still count; cancelled drags clear selection.');
