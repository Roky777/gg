import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const pack=new URL('../sparky-animations%204/',import.meta.url);
const sandbox=vm.createContext({console});
vm.runInContext(fs.readFileSync(new URL('vendor/spine-webgl.min.js',pack),'utf8'),sandbox);
const S=sandbox.spine;globalThis.spine=S;
const atlas=new S.TextureAtlas(fs.readFileSync(new URL('assets/Lucas_Activity_Icecream.atlas',pack),'utf8'));
const data=new S.SkeletonBinary(new S.AtlasAttachmentLoader(atlas)).readSkeletonData(fs.readFileSync(new URL('assets/Lucas_Activity_Icecream.skel',pack)));
const source=fs.readFileSync(new URL('rig-player.js',pack),'utf8');
const {SparkyRigPlayer,applyRigPose}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const rig=Object.assign(Object.create(SparkyRigPlayer.prototype),{data,time:0,views:new Set()});
const body=['Body','T_shirt','Leg_L','Leg_R','Foots-Foot_L','Foots-Foot_R','Neck'];
const actor=rig.add({getContext:()=>({})},'Sequence/1/Lookaround_Sad',{loop:false,baseClip:'0Final/Idle/Idle_EB',preserveSlots:body});
const view=[...rig.views][0];
for(const time of [0,.5,1,2,2.66]){
 rig.time=time;applyRigPose(view,time);
 for(const name of body){const slot=view.skeleton.findSlot(name);assert(slot.getAttachment(),`Body missing at ${time}: ${name}`);assert(Number.isFinite(slot.bone.worldX));}
 assert.equal(view.skeleton.findSlot('Lips').getAttachment().name,'Lips/Sad');
}
const snapshot=()=>view.skeleton.bones.map(b=>[b.x,b.y,b.rotation,b.scaleX,b.scaleY]);
const before=snapshot();actor.setAnimation('0Final/Idle/Idle_EB',{loop:true,mixSeconds:.45});
applyRigPose(view,rig.time);
const start=snapshot();
for(let b=0;b<before.length;b++)for(let i=0;i<5;i++)assert(Math.abs(before[b][i]-start[b][i])<.001,`Pose snapped at transition: ${b}/${i}`);
rig.time+=.225;applyRigPose(view,rig.time);
assert(view.entry.mixingFrom,'Return should still be blending halfway through');
const midpoint=snapshot();assert(midpoint.some((bone,b)=>bone.some((n,i)=>Math.abs(n-before[b][i])>.01)),'Mix should move toward idle');
rig.time+=.3;applyRigPose(view,rig.time);rig.time+=.016;applyRigPose(view,rig.time);
assert.equal(view.entry.mixingFrom,null,'Outgoing action must release after the blend');
actor.destroy();assert.equal(rig.views.size,0);
for(const name of ['0Final/Appreciation/Thumbs_Up_2','0Final/Appreciation/Clapping','0Final/Idle/Lookaround_Wow','0Final/Appreciation/Yeahh_1','0Final/Appreciation/Hurray','0Final/Woohoo','0Final/Super_Happy','0Final/Wow_2']){
 const actor=rig.add({getContext:()=>({})},name,{loop:false,baseClip:'0Final/Idle/Idle_EB'});
 const view=[...rig.views][0];for(const fraction of [0,.25,.5,.75,1]){rig.time=view.start+data.findAnimation(name).duration*fraction;applyRigPose(view,rig.time);for(const slot of body)assert(view.skeleton.findSlot(slot).getAttachment(),`${name} missing ${slot} at ${fraction}`);}
 const before=view.skeleton.bones.map(b=>[b.x,b.y,b.rotation,b.scaleX,b.scaleY]);
 actor.setAnimation('0Final/Idle/Idle_EB',{loop:true,mixSeconds:.45});applyRigPose(view,rig.time);
 view.skeleton.bones.forEach((b,index)=>[b.x,b.y,b.rotation,b.scaleX,b.scaleY].forEach((n,i)=>assert(Math.abs(n-before[index][i])<.001,`${name} snapped on exit`)));
 rig.time+=.2;applyRigPose(view,rig.time);assert(view.entry.mixingFrom);
 const frozen=view.skeleton.findBone('Face').rotation;applyRigPose(view,rig.time);assert.equal(view.skeleton.findBone('Face').rotation,frozen,'Mix advanced while paused');
 rig.time+=.3;applyRigPose(view,rig.time);rig.time+=.016;applyRigPose(view,rig.time);assert.equal(view.entry.mixingFrom,null);
 for(const slot of body)assert(view.skeleton.findSlot(slot).getAttachment());
 actor.destroy();
}
console.log('PASS: full-body sad reaction, continuous exits for all nine reactions, timed blends, settled idle and paused transitions.');
