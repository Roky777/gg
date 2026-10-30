import assert from 'node:assert/strict';
import {fitArtwork} from '../responsive-layout.js';
import {makeCountingBoard} from '../counting-game.js';
for(const [width,height] of [[200,160],[350,230],[650,300],[900,650],[1100,720]]){
 const f=fitArtwork(width,height);
 assert(f.assembly<=height&&f.assembly<=width*.62);
 assert(f.tray*1.5<=height+.001);
 assert(f.assembly+f.tray+width*.03<=width+.001,'target and tray must not overlap');
 assert(f.difference*2+width*.04<=width+.001);
 assert(f.difference*(.18+.82*4/3)<=height+.001,'complete photos must fit vertically');
}
for(let i=0;i<300;i++){
 const board=makeCountingBoard({wins:100,maxQuantity:5});
 assert.equal(board.cards.length,4);assert(board.cards.every(c=>c.amount<=5));
 assert.equal(new Set(board.numbers).size,4);
}
console.log('PASS: full photos, assembly target and tray fit narrow/wide board openings; compact counting keeps four unique answers and at most five objects per row.');
