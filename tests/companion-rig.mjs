import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);const ctx={console,window:{},self:{},navigator:{},document:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(new URL('sparky-animations%204/vendor/spine-webgl.min.js',root),'utf8'),ctx);const spine=ctx.spine;globalThis.spine=spine;
const data=new spine.SkeletonBinary(new spine.AtlasAttachmentLoader(new spine.TextureAtlas(fs.readFileSync(new URL('sparky-animations%204/assets/Lucas_Activity_Icecream.atlas',root),'utf8')))).readSkeletonData(new Uint8Array(fs.readFileSync(new URL('sparky-animations%204/assets/Lucas_Activity_Icecream.skel',root))));
const {CompanionPose}=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(new URL('companion-pose.js',root),'utf8')).toString('base64'));
const {applyRigPose,createSpeechAnimation}=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(new URL('sparky-animations%204/rig-player.js',root),'utf8')).toString('base64'));
function view(){const skeleton=new spine.Skeleton(data),state=new spine.AnimationState(new spine.AnimationStateData(data));const entry=state.setAnimation(0,'0Final/Idle/Idle_EB',true);return {skeleton,state,entry,fixedTime:null,start:0,previousTime:0,preservedAttachments:new Map(),retiringAttachments:[],preserveUntil:0};}
const base=view(),v=view(),pose=new CompanionPose();v.poseModifier=(s,f)=>pose.apply(s,{...f,active:'idle'});
for(const gesture of ['wave','guide','nod','ponder']){
 pose.act(gesture);pose.look(.9,.1);
 for(let i=0;i<150;i++){
  const t=(i+1)/60;applyRigPose(base,t);applyRigPose(v,t);
  for(let b=0;b<v.skeleton.bones.length;b++){const x=v.skeleton.bones[b],y=base.skeleton.bones[b];assert(Number.isFinite(x.worldX)&&Number.isFinite(x.worldY));assert.equal(x.scaleX,y.scaleX);assert.equal(x.scaleY,y.scaleY);}
  for(const name of ['root','root_Char','Leg_R','Leg_R2','Leg_R3','Leg_R4']){const a=v.skeleton.findBone(name),b=base.skeleton.findBone(name);assert(Math.abs(a.worldX-b.worldX)<.001);assert(Math.abs(a.worldY-b.worldY)<.001);}
  for(const name of ['Eyeball_L','Eyeball_R']){const a=v.skeleton.findBone(name),b=base.skeleton.findBone(name);assert(Math.hypot(a.worldX-b.worldX,a.worldY-b.worldY)<23,'Eye escaped bounded gaze/head gesture');}
 }
 pose.clear();
}
// Voice overlay modifies only facial slots/bones, not body or limb animation.
const speech=view(),silent=view();speech.speaking=true;speech.speechStarted=0;speech.speechAnimation=createSpeechAnimation(data);
let seenMouth=false;
for(let i=0;i<180;i++){const t=i/60;applyRigPose(speech,t);applyRigPose(silent,t);seenMouth ||=!!speech.skeleton.findSlot('mouth').getAttachment();assert.equal(speech.skeleton.findSlot('Lips').getAttachment(),null,'Resting mouth must be hidden throughout speech');for(const name of ['Face','Neck','Left_Shoulder','Right_Shoulder','Leg_R']){const a=speech.skeleton.findBone(name),b=silent.skeleton.findBone(name);assert.equal(a.rotation,b.rotation);assert.equal(a.x,b.x);assert.equal(a.y,b.y);}}
assert(seenMouth);speech.speaking=false;applyRigPose(speech,3.1);assert.equal(speech.skeleton.findSlot('mouth').getAttachment(),null);assert(speech.skeleton.findSlot('Lips').getAttachment(),'Resting smile returns after speech');
const reduced=new CompanionPose({reduced:true}),staticView=view();reduced.look(1,0);reduced.act('wave');staticView.poseModifier=(s,f)=>reduced.apply(s,f);applyRigPose(staticView,0);assert.equal(reduced.gesture,null);
console.log('PASS: real 201-bone rig, four additive gestures, bounded eye motion, no scaling or foot movement, mouth-only speech overlay and reduced-motion behavior.');

// Check through action mixing, where a smile may be coming from another clip.
const runtime=Object.assign(Object.create((await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(new URL('sparky-animations%204/rig-player.js',root),'utf8')).toString('base64'))).SparkyRigPlayer.prototype),{data,time:0,views:new Set()});
for(const clip of ['0Final/Idle/Idle_EB','0Final/Appreciation/Thumbs_Up_2','0Final/Appreciation/Clapping']){
 const actor=runtime.add({getContext:()=>({})},clip,{loop:false,baseClip:'0Final/Idle/Idle_EB'});const v=[...runtime.views][0];actor.setSpeech(true);
 for(let i=0;i<180;i++){runtime.time+=1/60;applyRigPose(v,runtime.time);assert.equal(v.skeleton.findSlot('Lips').getAttachment(),null,clip+' has overlapping old mouth');assert(v.skeleton.findSlot('mouth').getAttachment());if(i===60)actor.setAnimation('0Final/Idle/Idle_EB',{loop:true,mixSeconds:.45});}
 actor.setSpeech(false);runtime.time+=.5;applyRigPose(v,runtime.time);assert(v.skeleton.findSlot('Lips').getAttachment());assert.equal(v.skeleton.findSlot('mouth').getAttachment(),null);actor.destroy();
}
console.log('PASS: exactly one mouth drawing while speaking, including action-to-idle blends, with the original smile restored on stop.');
// The actual audio clock selects native visemes, even when the body mixes clips.
const tracked=runtime.add({getContext:()=>({})},'0Final/Appreciation/Thumbs_Up_2',{baseClip:'0Final/Idle/Idle_EB'}),trackedView=[...runtime.views][0];let sample={shape:'X',playing:true,time:0};tracked.setSpeechSource(()=>sample);tracked.setSpeech(true);
for(const shape of 'ABCDEFX'){
 sample={shape,playing:true,time:.4};runtime.time+=.1;applyRigPose(trackedView,runtime.time);
 assert.equal(trackedView.skeleton.findSlot('mouth').getAttachment().name,'mouth/'+shape);
 assert.equal(trackedView.skeleton.findSlot('Lips').getAttachment(),null);
 for(const bone of trackedView.skeleton.bones)assert(Number.isFinite(bone.worldX)&&Number.isFinite(bone.worldY));
}
sample={shape:'X',playing:false,time:.4};runtime.time+=1;applyRigPose(trackedView,runtime.time);assert.equal(trackedView.skeleton.findSlot('mouth').getAttachment().name,'mouth/X','Buffering/silence never keeps mouthing the old loop');tracked.setSpeech(false);runtime.time+=1;applyRigPose(trackedView,runtime.time);assert.equal(trackedView.skeleton.findSlot('mouth').getAttachment(),null);tracked.destroy();
console.log('PASS: all seven native visemes use the supplied audio-clock sample; pauses close the mouth, no duplicate lips, finite mesh/bone transforms, and speech stop restores the authored expression.');
