import {SparkyRigPlayer} from './sparky-current/player.js?v=perf-1';

export const CLIPS={
 idle:'0Final/Idle/Idle_EB',
 talk:'0Final/Vocal/Great choice! How about',
 yes:'0Final/Appreciation/Thumbs_Up_2',
 no:'Sequence/1/Lookaround_Sad',
 win:'0Final/Appreciation/Clapping',
 intro:'0Final/Idle/Lookaround_Wow',
 encourage:'0Final/Appreciation/Yeahh_1',
 hurray:'0Final/Appreciation/Hurray',
 woohoo:'0Final/Woohoo',
 delight:'0Final/Super_Happy',
 think:'0Final/Vocal/I wonder what magical flavor',
 guide:'0Final/Vocal/Let’s add some sprinkles!',
 proud:"0Final/Vocal/You're doing amazing! This",
 wow:'0Final/Wow_2'
};

/** One shared rig, complete actions, and the newest pending reaction. */
export class MascotDirector {
 constructor(canvas,clips=CLIPS,{reduced=false,restMs=300}={}){
  this.canvas=canvas;this.clips=clips;this.reduced=reduced;this.restMs=restMs;
  this.active=null;this.actor=null;this.queue=[];this.paused=false;this.destroyed=false;
  this.serial=0;this.loading=false;this.idleUntil=0;this.drainTimer=null;this.requestId=null;
  const manifestURL=new URL('./sparky-current/manifest.json',import.meta.url).href;
  const loading=new URLSearchParams(location.search).get('character')==='sports-candidate'
   ? import('./character-upgrade/03-joint-fit/load-candidate.js').then(m=>m.loadCandidate(new URL('./sparky-animations%204/manifest.json',import.meta.url).href))
   : SparkyRigPlayer.load(manifestURL);
  this.ready=loading.then(rig=>{
   if(this.destroyed){rig.destroy();return rig;}
   this.rig=rig;
   this.animations=new Map(rig.manifest.animations.map(clip=>[clip.name,clip]));
   for(const name of Object.values(clips))if(!this.animations.has(name))throw Error('Missing Sparky action: '+name);
   rig.setPaused(this.paused||this.reduced||document.hidden);
   return rig;
  });
 }
 async show(name){
  const serial=++this.serial;this.loading=true;
  try{
   await this.ready;if(this.destroyed||serial!==this.serial)return;
   const clip=this.animations.get(this.clips[name]);if(!clip)throw Error('Unknown Sparky action: '+name);
   cancelAnimationFrame(this.requestId);
   this.active=name;this.clip=clip;this.actionDuration=clip.duration;this.started=this.rig.time;
   const options={loop:clip.loop,baseClip:this.clips.idle,preserveSlots:name==='no'?['Shadow','Tail','Body_2','Palm_R','Palm_R3','Right_Shoulder','Left_Shoulder','Leg_L','Foots-Foot_L','Leg_R','Body','Foots-Foot_R','Stomach_White','Body_DP','T_shirt','Pocket','Neck']:[]};
   if(this.actor)this.actor.setAnimation(clip.name,{...options,mixSeconds:name==='idle'?.45:.22});
   else this.actor=this.rig.add(this.canvas,clip.name,options);
   this.actor.setPoseModifier?.((skeleton,frame)=>this.poseModifier?.(skeleton,{...frame,active:this.active}));
   this.actor.setSpeechSource?.(()=>this.speechSource?.());
   this.actor.setSpeech?.(!!this.speaking);
   this.canvas.dataset.animation=name;this.canvas.dataset.clip=clip.name;
   this.canvas.dataset.motionState=name==='idle'?'resting':'action';
   if(this.reduced)this.actor.seek(0);
   this.watchCompletion();
  }finally{if(serial===this.serial){this.loading=false;this.drain();}}
 }
 watchCompletion(){
  cancelAnimationFrame(this.requestId);this.requestId=null;
  if(this.destroyed||this.paused||this.reduced||!this.clip||this.clip.loop||this.active==='idle')return;
  this.requestId=requestAnimationFrame(()=>{
   this.requestId=null;
   if(this.rig.time-this.started>=this.actionDuration){
    this.idleUntil=this.rig.time+.45+this.restMs/1000;this.show('idle');
   }else this.watchCompletion();
  });
 }
 async react(name,{seconds=.85}={}){
  if(this.destroyed||this.reduced||!this.clips[name])return;
  this.clearQueue();await this.show(name);
  if(this.active===name)this.actionDuration=Math.min(this.clip.duration,seconds);
 }
 setPoseModifier(fn){this.poseModifier=fn;}
 setSpeechSource(fn){this.speechSource=fn;this.actor?.setSpeechSource?.(fn);}
 setSpeaking(value){this.speaking=value;this.actor?.setSpeech?.(value);}
 request(name,{priority=false}={}){
  if(this.destroyed||!this.clips[name]||(this.reduced&&name!=='idle'))return;
  if(name==='idle'){if(!this.active&&!this.loading)this.show('idle');return;}
  if(this.active===name){if(priority)this.clearQueue();return;}
  if(this.queue.includes(name))return;
  if(priority)this.queue=[name];else if(this.queue.length<1)this.queue.push(name);
  if(this.active==='idle')this.drain();else if(!this.active&&!this.loading)this.show(this.queue.shift());
 }
 drain(){
  cancelAnimationFrame(this.drainTimer);
  if(this.destroyed||this.paused||this.loading||this.active!=='idle'||!this.queue.length)return;
  const wait=(this.idleUntil-this.rig.time)*1000;
  if(wait>0){this.drainTimer=requestAnimationFrame(()=>this.drain());return;}
  this.show(this.queue.shift());
 }
 clearQueue(){this.queue=[];cancelAnimationFrame(this.drainTimer);}
 pause(){this.paused=true;cancelAnimationFrame(this.drainTimer);cancelAnimationFrame(this.requestId);this.rig?.setPaused(true);}
 resume(){this.paused=false;this.rig?.setPaused(this.reduced||document.hidden);this.watchCompletion();this.drain();}
 destroy(){this.destroyed=true;this.serial++;this.clearQueue();cancelAnimationFrame(this.requestId);this.rig?.destroy();}
}
