import fs from 'node:fs';import assert from 'node:assert/strict';
const {PICTURES,swap,scramble,solved,slotAt,fitPicture,swapFeedback}=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(new URL('../model.js',import.meta.url))).toString('base64'));
assert.equal(PICTURES.length,36);assert.equal(new Set(PICTURES.map(p=>p.id)).size,36);assert(PICTURES.every(p=>p.cards.length===3&&p.axis==='vertical'));for(const p of PICTURES){const values=p.cards.map(c=>c.value);assert(values[0]<values[1]&&values[1]<values[2],'Card solutions require semantic ascending order');}
const permutations=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
for(const initial of permutations){let order=initial.slice();let count=0;for(let slot=0;slot<3;slot++){if(order[slot]!==slot){const before=order.slice();order=swap(order,slot,order.indexOf(slot));assert.deepEqual(before.length,3);count++;}}assert(solved(order));assert(count<=2);assert.deepEqual(initial.slice().sort(),[0,1,2]);}
for(let i=0;i<100;i++){const s=scramble(()=>i/100);assert(!solved(s));assert.deepEqual(s.slice().sort(),[0,1,2]);}
const input=[2,0,1];assert.deepEqual(swap(input,0,2),[1,0,2]);assert.deepEqual(input,[2,0,1]);assert.deepEqual(swap(input,1,1),input);assert.throws(()=>swap(input,-1,0));
const rect={left:100,top:50,width:600,height:300};assert.equal(slotAt(150,90,rect,'vertical'),0);assert.equal(slotAt(650,90,rect,'vertical'),2);assert.equal(slotAt(150,200,rect,'horizontal'),1);assert.equal(slotAt(150,900,rect,'horizontal'),2);
console.log('PASS: all six permutations solve by swapping in at most two moves; both orientations, shuffling, hit testing, and immutable swaps.');

for(const [iw,ih,bw,bh] of [[836,627,925,706],[627,627,925,706],[836,627,400,300]]){const fit=fitPicture(iw,ih,bw,bh);assert(Math.abs(fit.width/iw-fit.height/ih)<1e-10);assert(fit.width>=bw&&fit.height>=bh);assert(Math.abs(fit.x*2+fit.width-bw)<1e-9);}
console.log('PASS: artwork uses one uniform scale, preserving circles and subject proportions.');

assert.equal(swapFeedback([1,2,0],[0,2,1]),'yes');assert.equal(swapFeedback([0,2,1],[1,2,0]),'no');assert.equal(swapFeedback([1,2,0],[1,2,0]),null);assert.equal(swapFeedback([2,1,0],[0,1,2]),'yes');
for(const before of permutations)for(let a=0;a<3;a++)for(let b=0;b<3;b++){const after=swap(before,a,b),delta=after.filter((v,i)=>v===i).length-before.filter((v,i)=>v===i).length;assert.equal(swapFeedback(before,after),delta>0?'yes':delta<0?'no':null);}
console.log('PASS: correct/incorrect swap feedback across every permutation and swap.');
