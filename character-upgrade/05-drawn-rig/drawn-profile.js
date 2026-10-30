/** A source-sized FK mesh profile driven by the existing Spine control rig.
 * The original binary, animation times and constraints are never modified. */
const RAD=Math.PI/180,DEG=180/Math.PI,wrap=a=>((a+180)%360+360)%360-180;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const rotate=(x,y,r)=>({x:x*Math.cos(r)-y*Math.sin(r),y:x*Math.sin(r)+y*Math.cos(r)});
export const JOINT_LIMITS={shoulder_L:[-25,65],shoulder_R:[-25,65],forearm_L:[-15,100],forearm_R:[-15,100],hand_L:[-30,30],hand_R:[-30,30],thigh_L:[-20,35],thigh_R:[-20,35],shin_L:[0,65],shin_R:[0,65],foot_L:[-25,25],foot_R:[-25,25],head:[-20,20]};
export const PRESETS={neutral:{},elbows:{forearm_L:80,forearm_R:80},wrists:{forearm_L:45,forearm_R:45,hand_L:25,hand_R:-25},shoulders:{shoulder_L:55,shoulder_R:55},knees:{thigh_L:15,thigh_R:15,shin_L:55,shin_R:55},ankles:{foot_L:20,foot_R:-20},head:{head:18}};
function neutralNative(data){const sk=new spine.Skeleton(data),state=new spine.AnimationState(new spine.AnimationStateData(data));state.setAnimation(0,'0Final/Idle/Idle_EB',false).trackTime=0;state.apply(sk);sk.updateWorldTransform(spine.Physics.none);return sk;}
export function makeProfile(data,nativeData,geometry={},anchors={}){
 const bind=neutralNative(nativeData),cache=new WeakMap(),scale=3.55;
 const stats={clampedTargets:0,byBone:{},samples:0};
 const delta=(sk,name)=>wrap(sk.findBone(name).getWorldRotationX()-bind.findBone(name).getWorldRotationX());
 function inverse(b,p){const x=p.x-b.worldX,y=p.y-b.worldY,det=b.a*b.d-b.b*b.c;return {x:(b.d*x-b.b*y)/det,y:(b.a*y-b.c*x)/det};}
 function nativeArm(sk,side){const palm=nativePalm(sk,side);const l=side==='L',normal=sk.findSlot(l?'Right_Shoulder':'Left_Shoulder')?.getAttachment();return normal?{shoulder:sk.findBone(l?'Hand_L3':'Hand_L5'),elbow:sk.findBone(l?'Hand_L4':'Hand_L6'),hand:palm?.bone??sk.findBone(l?'Palm_R':'Palm_R2')}:{shoulder:sk.findBone(l?'Hand_Sep_3':'Hand_Sep_1'),elbow:sk.findBone(l?'Hand_Sep_4':'Hand_Sep_2'),hand:palm?.bone??sk.findBone(l?'Hand_Sep_Palm_R_No_Scale':'Hand_Sep_Palm_No_Scale')};}
 function solve(ref,upperName,lowerName,endName,target,bendSign){
  const upper=ref.findBone(upperName),lower=ref.findBone(lowerName),end=ref.findBone(endName),parent=upper.parent;
  const l1=Math.hypot(lower.data.x,lower.data.y),l2=Math.hypot(end.data.x,end.data.y),ox=upper.worldX,oy=upper.worldY;
  const dx=(target.x-ox)/scale,dy=(target.y-oy)/scale,raw=Math.hypot(dx,dy),r=Math.max(Math.abs(l1-l2)+.01,Math.min(l1+l2-.01,raw));
  if(raw>l1+l2+.1){stats.clampedTargets++;stats.byBone[upperName]=(stats.byBone[upperName]??0)+1;}
  const a2=bendSign*Math.acos(Math.max(-1,Math.min(1,(r*r-l1*l1-l2*l2)/(2*l1*l2))));
  const a1=Math.atan2(dy,dx)-Math.atan2(l2*Math.sin(a2),l1+l2*Math.cos(a2));
  const rest1=Math.atan2(lower.data.y,lower.data.x),rest2=Math.atan2(end.data.y,end.data.x);
  upper.rotation=wrap((a1-rest1)*DEG-parent.getWorldRotationX());
  lower.rotation=wrap((a2+rest1-rest2)*DEG);ref.updateWorldTransform(spine.Physics.none);
 }
 function sample(v,{joints={},native=false}={}){
  let ref=cache.get(v);if(!ref){ref=new spine.Skeleton(data);cache.set(v,ref);}ref.setToSetupPose();ref.bones[0].scaleX=ref.bones[0].scaleY=scale;
  if(native){
   const sk=v.skeleton,body=sk.findBone('Body'),restBody=bind.findBone('Body');ref.bones[0].x=(body.worldX-restBody.worldX)*.46;ref.bones[0].y=(body.worldY-restBody.worldY)*.46;
   const torso=ref.findBone('torso');torso.rotation=delta(sk,'T_shirt');ref.findBone('head').rotation=wrap(delta(sk,'Face')-torso.rotation);
   ref.updateWorldTransform(spine.Physics.none);
   for(const side of ['L','R']){
    const l=side==='L',control=nativeArm(sk,side),old={hand:bind.findBone(control.hand.data.name)};
    const upper=ref.findBone('upper_arm_'+side),[sx,sy]=anchors['shoulder_'+side],[hx,hy]=anchors['hand_'+side];
    const restShoulder=bind.findBone(control.shoulder.data.name),rx=old.hand.worldX-restShoulder.worldX,ry=old.hand.worldY-restShoulder.worldY;
    const factor=Math.hypot(hx-sx,hy-sy)*scale/Math.hypot(rx,ry),angleOffset=Math.atan2(sy-hy,hx-sx)-Math.atan2(ry,rx);
    const ray=rotate((control.hand.worldX-control.shoulder.worldX)*factor,(control.hand.worldY-control.shoulder.worldY)*factor,angleOffset);
    const target={x:upper.worldX+ray.x,y:upper.worldY+ray.y};
    solve(ref,'upper_arm_'+side,'forearm_'+side,'hand_'+side,target,l?1:-1);
    // upper_arm carries the IK rotation; the shared proximal shoulder remains at the torso.
    const hand=ref.findBone('hand_'+side);const wristDelta=wrap(control.hand.getWorldRotationX()-old.hand.getWorldRotationX());hand.rotation=wrap(wristDelta-hand.parent.getWorldRotationX());
    const foot=ref.findBone('foot_'+side),n=sk.findBone(l?'Foots/Foot_R':'Foots/Foot_R2'),bn=bind.findBone(l?'Foots/Foot_R':'Foots/Foot_R2');
    const targetFoot={x:(l?-32:32)*scale+(n.worldX-bn.worldX)*.46,y:55*scale+(n.worldY-bn.worldY)*.46};
    solve(ref,'thigh_'+side,'shin_'+side,'foot_'+side,targetFoot,l?-1:1);foot.rotation=wrap(delta(sk,l?'Foots/Foot_R':'Foots/Foot_R2')-foot.parent.getWorldRotationX());
   }
  }
  for(const [name,value]of Object.entries(joints)){
   const b=ref.findBone(name);if(!b)continue;const left=name.endsWith('_L');let sign=1;
   if(name.startsWith('shoulder')||name.startsWith('thigh')||name.startsWith('shin'))sign=left?-1:1;
   if(name.startsWith('forearm'))sign=left?1:-1;b.rotation+=value*sign;
  }
  ref.updateWorldTransform(spine.Physics.none);
  correctJointVolume(ref,geometry,anchors,scale);
  if(native){
   const t=(v.fixedTime??Math.max(0,v.entry.trackTime))%3.4;const closed=t>=2.04&&t<2.12,half=t>=2&&t<2.2&&!closed;
   for(const side of ['L','R']){
    ref.setAttachment('EyeWhite_'+side,(closed?'EyeClosed_':half?'EyeHalf_':'EyeWhite_')+side);
    if(closed||half)ref.findSlot('Iris_'+side).setAttachment(null);
    const palm=nativePalm(v.skeleton,side),name=palm?.getAttachment()?.name??'';
    const clap=!v.skeleton.findSlot(side==='L'?'Right_Shoulder':'Left_Shoulder')?.getAttachment();
    const pose=/Thumb/i.test(name)?'Thumb':/Point/i.test(name)?'Point':/Fist|Punch/i.test(name)?'Fist':clap?'Clap':/Flip|Hi|Open/i.test(name)?'Wave':'Hand';
    ref.setAttachment('Hand_'+side,pose+'_'+side);
    const wrist=ref.findBone('hand_'+side);
    if(pose==='Clap')wrist.rotation=-wrist.parent.getWorldRotationX();
   }
   const source=v.speaking?v.skeleton.findSlot('mouth'):v.skeleton.findSlot('Lips'),n=source?.getAttachment()?.name??'';
   const shape=v.speaking?(v.speechSource?.()?.shape??n.split('/').at(-1)):null;
   const visemes={A:'Teeth',B:'Teeth',C:'Talk',D:'A',E:'O',F:'U',X:'Smile'};
   const mouth=shape?(visemes[shape]??'Talk'):/Big_smile|Laugh/i.test(n)?'Laugh':/Sad/i.test(n)?'Sad':/Normal_Smile|Smile/i.test(n)?'Happy':'Smile';
   ref.setAttachment('Mouth','Mouth_'+mouth);
   ref.updateWorldTransform(spine.Physics.none);
  }
  stats.samples++;return ref;
 }
 return {sample,stats,bind,nativeArm};
}
export async function installFitProfile(player,settings={}){
 const url=new URL('./Sparky_Drawn.atlas',import.meta.url).href,am=player.instance.assetManager;
 await new Promise((resolve,reject)=>am.loadTextureAtlas(url,resolve,(_,err)=>reject(Error(String(err)))));
 const json=await(await fetch(new URL('./Sparky_Drawn.json',import.meta.url))).json();
 const [geometry,registration]=await Promise.all(['geometry.json','registration.json'].map(async p=>(await fetch(new URL(p,import.meta.url))).json()));
 const data=new spine.SkeletonJson(new spine.AtlasAttachmentLoader(am.get(url))).readSkeletonData(json),profile=makeProfile(data,player.data,geometry,registration.anchors);
 player.referenceAdapter=v=>profile.sample(v,typeof settings==='function'?settings(v):settings);
 const c=player.instance;c.renderer.camera.position.set(0,737,0);c.renderer.camera.viewportWidth=1440;c.renderer.camera.viewportHeight=1800;c.renderer.camera.update();
 return {profile,data};
}

/** Pose-space correction around shared joint centres prevents LBS volume collapse.
 * Writes ordinary Spine weighted mesh deform offsets; never resizes the actor. */
export function correctJointVolume(ref,geometry,anchors,scale=3.55){
 for(const [name,g] of Object.entries(geometry)){
  const slot=ref.findSlot(name),mesh=slot.getAttachment();slot.deform.length=0;const current=[];mesh.computeWorldVertices(slot,0,mesh.worldVerticesLength,current,0,2);
  const offsets=[];
  for(let i=0;i<g.sourceVertices.length;i++){
   const influences=g.weights[i].filter(([,w])=>w>1e-7);let dx=0,dy=0;
   if(influences.length===2){
    const [proximal,distal]=influences,first=ref.findBone(proximal[0]),last=ref.findBone(distal[0]);
    const angle=(first.getWorldRotationX()+wrap(last.getWorldRotationX()-first.getWorldRotationX())*distal[1])*RAD;
    const [sx,sy]=g.sourceVertices[i],[cx,cy]=anchors[distal[0]],offset=rotate((sx-cx)*scale,(cy-sy)*scale,angle);
    dx=last.worldX+offset.x-current[i*2];dy=last.worldY+offset.y-current[i*2+1];
   }
   for(const [n]of influences){const b=ref.findBone(n),det=b.a*b.d-b.b*b.c;offsets.push((b.d*dx-b.b*dy)/det,(b.a*dy-b.c*dx)/det);}
  }
  slot.deform.push(...offsets);
 }
}


function nativePalm(sk,side){const names=side==='L'?['Palm_R','Palm_R2','Palm_R9','Palm_R20','Palms-Hold_Hand_3']:['Palm_R3','Palm_R8','Palms-Hold_Hand_8','Palm_R22'];return names.map(n=>sk.findSlot(n)).find(sl=>sl?.getAttachment()&&sl.color.a>.01);}
