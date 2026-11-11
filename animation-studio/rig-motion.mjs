import{evaluateMotion,blendMotionPoses,sampleKeys}from'./motion-math.mjs';
import{glovePoseFor}from'./glove-poses.mjs';
import{sampleMotionClock}from'./motion-clock.mjs';
const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
const referenceScratch=new WeakMap();
const nativeFields=['x','y','rotation','scaleX','scaleY','shearX','shearY'];
function blendNativeBone(b,rest,w){for(let j=0;j<nativeFields.length;j++){const key=nativeFields[j],delta=b[key]-rest[j],v=key==='rotation'||key.startsWith('shear')?Math.atan2(Math.sin(delta*Math.PI/180),Math.cos(delta*Math.PI/180))*180/Math.PI:delta;b[key]=key.startsWith('scale')&&rest[j]*b[key]<0?(w<.5?rest[j]:b[key]):rest[j]+v*w}}
function referenceMotion(sk,reference,time,settle,duration){
 const baseline=settle?sk.bones.map(b=>[b.x,b.y,b.rotation,b.scaleX,b.scaleY,b.shearX,b.shearY]):null,attachments=settle?sk.slots.map(s=>s.getAttachment()):null;
 sk.setToSetupPose();
 const S=globalThis.spine,apply=(name,t,loop=false,alpha=1)=>{const a=sk.data.findAnimation(name);if(!a)throw Error('Missing reference animation '+name);a.apply(sk,-1,t,loop,null,alpha,S.MixBlend.replace,S.MixDirection.mixIn)};
 const fromPose=(name,t,loop,w)=>{if(w>=1)return;let scratch=referenceScratch.get(sk);if(!scratch){scratch=new S.Skeleton(sk.data);referenceScratch.set(sk,scratch)}scratch.setToSetupPose();sk.data.findAnimation(name).apply(scratch,-1,t,loop,null,1,S.MixBlend.replace,S.MixDirection.mixIn);for(let i=0;i<sk.bones.length;i++)blendNativeBone(sk.bones[i],nativeFields.map(k=>scratch.bones[i][k]),w)};
 let name,t;
 if(reference.keys){name=reference.name;t=reference.linear?Math.max(0,Math.min(1,time/reference.duration))*reference.keys.at(-1)[1]:sampleMotionClock(reference.keys,time);apply(name,t)}
 else if(time<reference.entryEnd){name=reference.entry;t=time;apply(name,t)}
 else if(time<reference.holdEnd){name=reference.hold;t=(time-reference.entryEnd)*(reference.holdRate??1);apply(name,t,true);fromPose(reference.entry,reference.entryEnd,false,ease((time-reference.entryEnd)/.15))}
 else{name=reference.entry;const u=(time-reference.holdEnd)/(reference.duration-reference.holdEnd);t=reference.entryEnd*(1-ease(u));apply(name,t);fromPose(reference.hold,(reference.holdEnd-reference.entryEnd)*(reference.holdRate??1),true,ease((time-reference.holdEnd)/.15))}
 if(baseline){const w=Math.min(ease(time/settle.in),ease((duration-time)/settle.out))*(settle.strength??1);/* strength < 1 plays the source body motion partly (seated reactions) */for(let i=0;i<sk.bones.length;i++)blendNativeBone(sk.bones[i],baseline[i],w);if(w<.5)for(let i=0;i<sk.slots.length;i++)sk.slots[i].setAttachment(attachments[i]);}
 sk.updateWorldTransform(S.Physics.none);return{name,time:t,loop:!!reference.hold&&name===reference.hold};
}
export function applyAuthoredMotion(sk,clip,time){
 if(!clip){sk.sparkyAuthoredPose=null;return null}
 const reference=clip.referenceMotion?referenceMotion(sk,clip.referenceMotion,time,clip.nativeSettle,clip.duration):null;
 let pose=evaluateMotion(clip,time);if(clip.transitionFrom)pose=blendMotionPoses(clip.transitionFrom.pose??evaluateMotion(clip.transitionFrom.clip,clip.transitionFrom.time),pose,clip.transitionFrom.weight);pose.gloves=glovePoseFor(clip,time);sk.sparkyAuthoredPose=pose;
 if(reference){pose.referenceMotion=reference;pose.keepOriginalGloves=true;pose.gloves=null;if(!clip.referenceArmTargets){if(clip.authoredArmSides){for(const s of['L','R'])if(!clip.authoredArmSides.includes(s)){delete pose.arms[s];delete pose.wrist[s]}}else{pose.arms={};pose.wrist={};}}/* authoredArmSides: those arms follow the channels, the rest keep the source animation */}
 pose.armOffsets=clip.armOffsets;pose.feedingHandScale=clip.feedingHandScale??1;
 pose.upperBodyOnly=!!clip.upperBodyOnly;
 pose.tableOcclusionY=clip.upperBodyOnly&&!clip.sceneState?.fullFeeding?116:null;
 const body=sk.findBone('Body');if(body&&(pose.body[0]||pose.body[1])){const p=body.parent,dx=pose.body[0]/(92/484),dy=pose.body[1]/(81/407),d=p.a*p.d-p.b*p.c;body.x+=(p.d*dx-p.b*dy)/d;body.y+=(p.a*dy-p.c*dx)/d}
 if(pose.mouth){const slot=sk.findSlot('Lips'),path={Smile:'Lips/Lips_N',O:'Lips/O',Teeth:'Lips/Teeth1',Happy:'Lips/Big_smile',Sad:'Lips/Sad',Pain:'Lips/Pain_Sad'}[pose.mouth],a=path&&sk.getAttachment(slot.data.index,path);if(a)slot.setAttachment(a)}
 const head=sk.findBone('Face');if(head){head.rotation+=pose.head;const p=head.parent,dx=pose.headPosition[0]*4,dy=pose.headPosition[1]*4,d=p.a*p.d-p.b*p.c;head.x+=(p.d*dx-p.b*dy)/d;head.y+=(p.a*dy-p.c*dx)/d}
 for(const side of ['L','R']){
  const bone=sk.findBone(side==='L'?'Palm_R':'Palm_R2');if(bone)bone.rotation+=pose.wrist[side]??0;
  const grip=clip.grips?.[side],window=clip.gripWindows?.[side]??[0,clip.duration];if(grip&&time>=window[0]&&time<=window[1]){const slot=sk.findSlot(side==='L'?'Palm_R':'Palm_R3'),a=sk.getAttachment(slot.data.index,grip);if(a)slot.setAttachment(a)}
  const eye=sk.findBone('Eyeball_'+side),p=eye?.parent;if(p){const dx=pose.gaze[0]*12,dy=pose.gaze[1]*8,d=p.a*p.d-p.b*p.c;eye.x+=(p.d*dx-p.b*dy)/d;eye.y+=(p.a*dy-p.c*dx)/d}
 }
 return pose;
}
