import fs from 'node:fs';
import assert from 'node:assert/strict';
const manifest=JSON.parse(fs.readFileSync(new URL('../sparky-animations%204/manifest.json',import.meta.url)));
let nextId=0;const frames=new Map();
globalThis.requestAnimationFrame=fn=>{frames.set(++nextId,fn);return nextId;};
globalThis.cancelAnimationFrame=id=>frames.delete(id);
globalThis.document={hidden:false};
class FakeRig {
 static async load(){return new FakeRig();}
 constructor(){this.manifest=manifest;this.time=0;this.actors=[];}
 add(canvas,name,options){const actor={name,options,setAnimation(name,options){this.name=name;this.options=options;},destroy(){this.destroyed=true;},seek(time){this.fixedTime=time;}};this.actors.push(actor);return actor;}
 setPaused(value){this.paused=value;}
 destroy(){this.destroyed=true;}
}
globalThis.__FakeRig=FakeRig;
const fakeURL='data:text/javascript;base64,'+Buffer.from('export const SparkyRigPlayer=globalThis.__FakeRig;').toString('base64');
const src=fs.readFileSync(new URL('../mascot-director.js',import.meta.url),'utf8').replace("'./sparky-animations%204/rig-player.js?v=lip-sync-40'",JSON.stringify(fakeURL)).replace('import.meta.url',JSON.stringify(new URL('../mascot-director.js',import.meta.url).href));
const {MascotDirector,CLIPS}=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const advance=async(d,seconds)=>{if(!d.rig.paused)d.rig.time+=seconds;const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn());await flush();};
const d=new MascotDirector({dataset:{}},CLIPS,{restMs:0});
await d.show('idle');assert.equal(d.actor.name,CLIPS.idle);assert.equal(d.actor.options.loop,true);
d.request('yes');await flush();assert.equal(d.active,'yes');assert.equal(d.actor.options.loop,false);
const first=d.actor;d.request('no');d.request('win',{priority:true});assert.deepEqual(d.queue,['win']);assert.equal(first.destroyed,undefined);
await advance(d,.4);assert.equal(d.active,'yes');d.pause();await advance(d,10);assert.equal(d.active,'yes');assert.equal(d.rig.time,.4);
d.resume();await advance(d,.7);assert.equal(d.active,'idle');await advance(d,.5);assert.equal(d.active,'win');assert.equal(d.actor,first);assert.equal(d.actor.name,CLIPS.win);
d.request('win');assert.deepEqual(d.queue,[]);await advance(d,3);assert.equal(d.active,'idle');
await advance(d,.5);d.request('no');await flush();assert.equal(d.actor.name,CLIPS.no);assert.equal(d.actor.options.baseClip,CLIPS.idle);assert.equal(d.rig.actors.length,1);d.request('yes');d.clearQueue();await advance(d,3);assert.equal(d.active,'idle');
const r=new MascotDirector({dataset:{}},CLIPS,{reduced:true});await r.show('idle');r.request('win');assert.equal(r.active,'idle');assert.equal(r.actor.fixedTime,0);assert.equal(r.rig.paused,true);r.pause();r.resume();assert.equal(r.rig.paused,true);
for(const name of ['intro','encourage','hurray','woohoo','delight','wow']){
 await advance(d,.8);d.request(name);await flush();assert.equal(d.active,name);assert.equal(d.actor.name,CLIPS[name]);
 d.pause();const held=d.rig.time;await advance(d,10);assert.equal(d.rig.time,held);d.resume();
 await advance(d,manifest.animations.find(c=>c.name===CLIPS[name]).duration+.1);assert.equal(d.active,'idle');
 r.request(name);assert.equal(r.active,'idle');
}
await d.show('idle');await d.react('hurray',{seconds:.65});assert.equal(d.active,'hurray');assert(d.actionDuration<=.65);d.pause();const reactionStart=d.rig.time;await advance(d,2);assert.equal(d.rig.time,reactionStart);d.resume();await advance(d,.7);assert.equal(d.active,'idle');assert.deepEqual(d.queue,[]);await r.react('hurray');assert.equal(r.active,'idle');
d.destroy();r.destroy();assert.equal(frames.size,0);assert.equal(d.rig.destroyed,true);
console.log('PASS: exact pack clips and loop flags, complete actions, priority queue, idle recovery, paused clock, reduced motion and cleanup.');
