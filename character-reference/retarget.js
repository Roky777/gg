/** Candidate only: source-pixel reference rig, motion driven by native controls.
 * No edits to the shipped skeleton, its animation timelines or source texture. */
const CONTROL={pelvis:'Body',torso:'T_shirt',neck:'Neck',head:'Face',shoulder_L:'Hand_L3',upper_arm_L:'Hand_L3',forearm_L:'Hand_L4',hand_L:'Palm_R',shoulder_R:'Hand_L5',upper_arm_R:'Hand_L5',forearm_R:'Hand_L6',hand_R:'Palm_R2',thigh_L:'Leg_R',shin_L:'Leg_R2',foot_L:'Foots/Foot_R',thigh_R:'Leg_R3',shin_R:'Leg_R4',foot_R:'Foots/Foot_R2',brow_L:'Eyebrow_R',brow_R:'Eyebrow_L',eye_L:'Face',eye_R:'Face',nose:'Face',mouth:'Face',flame:'Face'};
const wrap=a=>((a+180)%360+360)%360-180;
export async function installReferenceRig(player){
 const base=new URL('./exact/',import.meta.url),atlasURL=new URL('Sparky_Parts.atlas',base).href;
 const am=player.instance.assetManager;
 await new Promise((resolve,reject)=>am.loadTextureAtlas(atlasURL,resolve,(_,e)=>reject(Error(String(e)))));
 const json=await (await fetch(new URL('Sparky_Reference.json',base))).json();
 const data=new spine.SkeletonJson(new spine.AtlasAttachmentLoader(am.get(atlasURL))).readSkeletonData(json);
 const bind=new spine.Skeleton(player.data),bs=new spine.AnimationState(new spine.AnimationStateData(player.data));
 bs.setAnimation(0,'0Final/Idle/Idle_EB',false).trackTime=0;bs.apply(bind);bind.updateWorldTransform(spine.Physics.none);
 const views=new WeakMap(),scale=3.55;
 player.referenceAdapter=v=>{
  let ref=views.get(v);if(!ref){ref=new spine.Skeleton(data);views.set(v,ref);}
  ref.setToSetupPose();
  const root=ref.bones[0];root.scaleX=root.scaleY=scale;
  const body=v.skeleton.findBone('Body'),originalBody=bind.findBone('Body');
  root.x=body.worldX-originalBody.worldX;root.y=body.worldY-originalBody.worldY;
  const angles=new Map([['root',0]]);
  for(const b of ref.bones.slice(1)){
   const name=CONTROL[b.data.name],native=v.skeleton.findBone(name),rest=bind.findBone(name);
   const absolute=native&&rest?wrap(native.getWorldRotationX()-rest.getWorldRotationX()):angles.get(b.parent.data.name);
   b.rotation=wrap(absolute-angles.get(b.parent.data.name));angles.set(b.data.name,absolute);
  }
  // The original four authored blink drawings remain source-pixel artwork.
  // This independent idle blink never scales the head, eyes or whole actor.
  const t=(v.fixedTime??Math.max(0,player.time-v.start))%3.4;
  const eye=t>=2&&t<2.04?'half_closed':t>=2.04&&t<2.12?'closed':t>=2.12&&t<2.2?'half_open':'open';
  for(const side of ['L','R'])ref.setAttachment('Eye_'+side,'Eye_'+side+'_'+eye);
  ref.updateWorldTransform(spine.Physics.none);return ref;
 };
 player.manifest.camera={x:0,y:737,width:1440,height:1800};
 const c=player.instance,m=player.manifest.camera;c.renderer.camera.position.set(m.x,m.y,0);c.renderer.camera.viewportWidth=m.width;c.renderer.camera.viewportHeight=m.height;c.renderer.camera.update();
 return {data,bind};
}
