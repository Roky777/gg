const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const GRIPS={relaxed:[.5,.48],open:[.5,.46],point:[.5,.58],pinch:[.69,.54],cylinder:[.6,.44],tool:[.64,.47],thumb:[.5,.59],support:[.5,.59]};
export function createGloveSkin(S,atlas,registration,data){
 const region=atlas.findRegion('GloveSheet'),entries=new Map(registration.poses.map(p=>[p.id,p])),cache=new WeakMap();
 for(const side of['L','R'])data.slots.push(new S.SlotData(data.slots.length,'GloveBlend_'+side,data.bones[0]));
 function mesh(view,side,pose,joints,flex,alpha=1,blend=false){
  const sourceSide=pose==='relaxed'?(side==='L'?'R':'L'):side,entry=entries.get(pose+'_'+sourceSide);if(!entry)return null;
  let parts=cache.get(view);if(!parts){parts=new Map();cache.set(view,parts)}const key=side+':'+pose+':'+blend;let m=parts.get(key);
  const col=entry.cell%4,row=Math.floor(entry.cell/4);if(!m){m=new S.MeshAttachment('GloveV2_'+key);m.region=region;m.regionUVs=new Float32Array([col/4,row/4,col/4,(row+1)/4,(col+1)/4,(row+1)/4,(col+1)/4,row/4]);m.updateRegion();m.triangles=[0,1,2,2,3,0];m.worldVerticesLength=8;m.vertices=new Float32Array(8);parts.set(key,m)}
  // Every registered asset has the cuff at its bottom. The cupped palm already
  // contains the finger pose; rotating its cuff by 90 degrees detached it from
  // the forearm. Keep the same cuff axis for all glove drawings.
  const mount=pose==='point'?0:clamp(flex,-35,35);
  const angle=Math.atan2(joints.wrist[1]-joints.elbow[1],joints.wrist[0]-joints.elbow[0])+mount*Math.PI/180,forward=[Math.cos(angle),Math.sin(angle)],right=[forward[1],-forward[0]],size=entry.worldSize,anchor=entry.anchor;
  const world=(u,v)=>{const x=(u-anchor[0])*size,y=(anchor[1]-v)*size;return[joints.wrist[0]+right[0]*x+forward[0]*y,joints.wrist[1]+right[1]*x+forward[1]*y]};
  const uv=[[0,0],[0,1],[1,1],[1,0]];uv.forEach(([u,v],i)=>m.vertices.set(world(u,v),i*2));m.color.set(1,1,1,alpha);const grip=GRIPS[pose]??GRIPS.relaxed,gripU=sourceSide==='L'?grip[0]:1-grip[0];m.gripAnchor=world(gripU,grip[1]);m.cuffAnchor=joints.wrist.slice();m.glovePose=pose;
  m.gloveRender={image:registration.image,cell:entry.cell,anchor:entry.anchor,size,forward,right,wrist:joints.wrist.slice(),alpha};return m;
 }
 function apply(view,rendered,joints){
  const native=view.skeleton,pose=native.sparkyAuthoredPose,clip=view.entry?.animation?.name??'';
  const override=view.glovePreview;
  for(const side of['L','R'])rendered.findSlot('GloveBlend_'+side)?.setAttachment(null);
  rendered.drawOrder=rendered.drawOrder.filter(s=>!s.data.name.startsWith('GloveBlend_'));
  if(!override&&(!pose?.gloves||pose.keepOriginalGloves))return rendered;
  for(const side of['L','R']){const slot=rendered.findSlot('Hand_'+side),joint=joints?.get(side);if(!slot||!joint)continue;
   const choice=override?{pose:override}:pose.gloves[side]??{pose:'relaxed'},flex=(pose?.wristFlex?.[side]??0)*(choice.flexSign??1);
   slot.setAttachment(mesh(view,side,choice.pose??'relaxed',joint,flex));
  }
  return rendered;
 }
 return{apply,registration};
}
