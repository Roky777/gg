import assert from 'node:assert/strict';
import {BreakSchedule,PlayBreak,makeFunBoard} from '../play-breaks.js';
const schedule=new BreakSchedule();for(let wins=0;wins<4;wins++)assert.equal(schedule.take(wins),null);assert.equal(schedule.take(4),'balloon-pop');assert.equal(schedule.take(4),null);assert.equal(schedule.take(7),null);assert.equal(schedule.take(8),'jelly-wiggle');assert.equal(schedule.take(12),'balloon-pop');
class Element{
 constructor(){this.children=[];this.style={setProperty(){}};this.attrs={};this.classes=new Set();this.classList={add:n=>this.classes.add(n)};this.events={};}
 append(...v){this.children.push(...v);}replaceChildren(){this.children=[];}setAttribute(k,v){this.attrs[k]=v;}addEventListener(k,f){this.events[k]=f;}querySelector(){return this.children.find(c=>c.src);}getAnimations(){return [];}animate(){return {cancel(){},pause(){},play(){}};}
}
globalThis.document={createElement:()=>new Element()};let next=0,complete=0,plays=0,paused=false,frame,time=0;
const options={element:new Element(),picture:makeFunBoard('balloon-pop'),onPlay:()=>plays++,onComplete:()=>complete++,onNext:()=>next++,isPaused:()=>paused,raf:fn=>(frame=fn,1),caf:()=>{frame=null;}};
const round=new PlayBreak(options);function tick(ms){for(let i=0;i<ms/20;i++){time+=20;frame?.(time);}}
round.play(0);round.play(0);assert.equal(plays,1,'Popped balloons cannot score or react twice');assert(round.buttons[0].disabled);paused=true;round.play(1);tick(16000);assert.equal(round.seen.size,1);assert.equal(complete,0);assert.equal(next,0);paused=false;
for(let i=1;i<6;i++)round.play(i);assert.equal(complete,1);tick(1480);assert.equal(next,0);tick(20);assert.equal(next,1);round.play(2);assert.equal(complete,1);round.destroy();
next=0;complete=0;plays=0;const jelly=new PlayBreak({...options,element:new Element(),picture:makeFunBoard('jelly-wiggle')});jelly.play(0);jelly.play(0);assert.equal(plays,2,'Jellies can wiggle repeatedly');assert.equal(jelly.seen.size,1);tick(1000);paused=true;tick(16000);assert.equal(complete,0,'Pause does not consume play time');paused=false;tick(11100);assert.equal(complete,1,'A round ends without forcing every object to be tapped');tick(1500);assert.equal(next,1);jelly.destroy();
const skip=new PlayBreak({...options,element:new Element()});skip.destroy();tick(20000);assert.equal(next,1,'Manual skip destroys old auto-next callbacks');
const reduced=new PlayBreak({...options,element:new Element(),reduced:true,picture:makeFunBoard('jelly-wiggle')});reduced.play(0);assert.equal(reduced.animations.size,0);reduced.destroy();
console.log('PASS: break after four wins, alternating games, skip without repeat, six unique pops, repeated jelly taps, active-time limit, pause, reduced motion and no stale auto-next.');
