import fs from 'node:fs';import assert from 'node:assert/strict';
const {PICTURES,solved,swap}=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(new URL('../model.js',import.meta.url))).toString('base64'));
assert.equal(PICTURES.length,36);const allLetters=new Set();const topics={};
for(const p of PICTURES){topics[p.topic]=(topics[p.topic]||0)+1;assert.equal(p.cards.length,3);assert.equal(p.axis,'vertical');assert(p.intro&&p.learn&&p.rule);assert.equal(new Set(p.cards.map(c=>c.image)).size,3);for(let i=1;i<3;i++)assert(p.cards[i-1].value<p.cards[i].value);
 for(const c of p.cards){if(p.topic==='letters'){assert(/^[A-Z]$/.test(c.value));allLetters.add(c.value);}else{assert(Number.isInteger(c.value)&&c.value>=0&&c.value<=10);if(p.topic==='add')assert.equal(c.value,c.a+c.b);if(p.topic==='subtract'){assert.equal(c.value,c.a-c.b);assert(c.a<=10&&c.b<=c.a);}}}
 // The six possible permutations have exactly one semantic solution.
 for(const order of [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]]){const values=order.map(i=>p.cards[i].value);assert.equal(solved(order),values[0]<values[1]&&values[1]<values[2]);for(let a=0;a<3;a++)for(let b=0;b<3;b++)assert.equal(swap(order,a,b).length,3);}
}
assert.equal(allLetters.size,26);assert.deepEqual(topics,{letters:24,numbers:12});console.log('PASS: A–Z coverage, unambiguous 3-card ordering, quantities 0–10 across 36 alphabet/counting puzzles.');
