import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const timerCode=source.slice(source.indexOf('function idleSchedule(){'),source.indexOf("\ntry{soundOn="));
const timers=new Map(),requests=[];let serial=0;
const context=vm.createContext({idleTimer:null,idleCount:0,reduced:false,done:false,busy:false,drag:null,selected:null,document:{hidden:false},dialog:{open:false},$:()=>context.dialog,director:{active:'idle',request:name=>requests.push(name)},setTimeout(fn,ms){assert.equal(ms,18000);timers.set(++serial,fn);return serial;},clearTimeout(id){timers.delete(id);}});
vm.runInContext(timerCode,context);
const fire=()=>{const [id,fn]=timers.entries().next().value;timers.delete(id);fn();};
context.idleSchedule();assert.equal(timers.size,1);fire();assert.deepEqual(requests,['intro']);fire();assert.deepEqual(requests,['intro','wow']);
for(const [key,value] of [['busy',true],['drag',{}],['selected',0]]){context[key]=value;fire();assert.equal(requests.length,2);context[key]=key==='busy'?false:null;}
context.director.active='hurray';fire();assert.equal(requests.length,2);context.director.active='idle';
context.document.hidden=true;fire();assert.equal(requests.length,2);assert.equal(timers.size,0);context.document.hidden=false;
for(const [key,value] of [['done',true],['reduced',true]]){context[key]=value;context.idleSchedule();assert.equal(timers.size,0);context[key]=false;}
context.dialog.open=true;context.idleSchedule();assert.equal(timers.size,0);context.dialog.open=false;
context.idleSchedule();context.idleSchedule();assert.equal(timers.size,1);
console.log('PASS: quiet reactions alternate at 18 seconds, reset without duplicate timers, and stay quiet during interaction, actions, pause, hidden tabs and reduced motion.');
