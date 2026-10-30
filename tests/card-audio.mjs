import assert from 'node:assert/strict';
import fs from 'node:fs';
import {cardReadings,bindCardReading} from '../card-audio.js';
import {RECORDINGS} from '../voice-cues.js';
import {makeBoard} from '../puzzle-generator.js';
for(const topic of ['letters','numbers'])for(let i=0;i<100;i++){
 const picture=makeBoard({preferredTopic:topic,letterWins:10,numberWins:10});
 for(const card of picture.cards){
  const cues=cardReadings(picture,card);assert(cues.length>0);
  if(topic==='letters')assert.deepEqual(cues,['letter_'+card.value.toLowerCase()]);
  else assert.deepEqual(cues,['number_'+String(card.amount).padStart(2,'0')],'A quantity tap reads only its total');
  for(const cue of cues)assert(fs.existsSync(new URL('../'+RECORDINGS[cue].path,import.meta.url)));
 }
}
assert.deepEqual(cardReadings({topic:'assembly',item:{id:'teddy-bear'}}),['picture_teddy_bear']);
assert.deepEqual(cardReadings({topic:'count-groups'},{amount:7}),['number_07']);
const handlers={},button={addEventListener(type,fn){(handlers[type]??=[]).push(fn);}};
const fire=(type,overrides={})=>handlers[type]?.forEach(fn=>fn({button:0,pointerId:1,clientX:10,clientY:10,detail:1,...overrides}));
let reads=0,allowed=true;bindCardReading(button,()=>reads++,()=>allowed);
fire('pointerdown');fire('pointerup');fire('click');assert.equal(reads,1,'Pointer tap reads once despite its following click');
fire('click',{detail:0});assert.equal(reads,2,'Keyboard/assistive activation reads');
fire('pointerdown');fire('pointermove',{clientX:30});fire('pointermove');fire('pointerup');fire('click');assert.equal(reads,2,'Dragging out and back does not read');
fire('pointerdown');fire('pointerup',{clientX:30});assert.equal(reads,2,'A displaced release is not a tap without move events');
for(const cancel of ['pointercancel','lostpointercapture']){fire('pointerdown');fire(cancel);fire('pointerup');assert.equal(reads,2);}
fire('pointerdown');allowed=false;fire('pointerup');fire('click',{detail:0});assert.equal(reads,2,'Pause/navigation blocks pending and keyboard readings');
allowed=true;fire('pointerdown',{button:2});fire('pointerup');assert.equal(reads,2,'Right click stays quiet');
console.log('PASS: recorded letter pronunciation, single total-number playback, object/number readings, real asset paths, tap/drag distinction, no double playback, keyboard activation and cancellation.');
