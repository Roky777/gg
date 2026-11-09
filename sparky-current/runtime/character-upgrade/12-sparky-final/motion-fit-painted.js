import{loadRuntimeModel}from'./runtime-model.js';
import{createGloveSkin}from'./authored-gloves.js';
import{createLimbSkin}from'./authored-limbs.js';
import{holdingHands}from'./holding-hands.js?v=1';
import{fitFacePoint,mouthForSpeech}from'./face-reference-fit.js?v=1';
import{makeShorts}from'./motion-fit-shorts-v2.js?v=1';
import{makeTwoPartArms}from'./continuous-sleeve-garment.js?v=1';
import{makePropLayer}from'./prop-layer.js?iteration=joint-7';
import{group}from'../09-lucas-shape-first/shape-profile.js';
import{makeSilhouetteProfile}from'./motion-fit-geometry.js?v=perf-1';
function bary(p,a,b,c){const d=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(d)<1e-9)return null;const x=((b[1]-c[1])*(p[0]-c[0])+(c[0]-b[0])*(p[1]-c[1]))/d,y=((c[1]-a[1])*(p[0]-c[0])+(a[0]-c[0])*(p[1]-c[1]))/d;return[x,y,1-x-y]}
// Colour correction measured on flat patches of Target-Cropped.webp (shirt already matches).
const COLOR_FIX={Shorts:[.93,.93,.893],Leg_L:[1,.935,1],Leg_R:[1,.935,1],Arm_L:[1,.94,1],Arm_R:[1,.94,1]};
export function makePaintedProfile(S,sourceData,model,atlas,registration,propAtlas=null,featherAtlas=null,shirtAtlas=null,armAtlas=null,garmentAtlas=null,shortsAtlas=null,irisAtlas=null,glossAtlas=null,limbAtlas=null,eatingAtlas=null){
 for(const[k,v]of Object.entries(COLOR_FIX))if(registration[k])registration[k].tint=v;
 registration.Torso.bounds=[-57.3705,96.9185,57.3705,211.6595];
 const base=makeSilhouetteProfile(S,sourceData,model,atlas.findRegion('Torso'),{paintedOnly:true}),head=model.meshes.find(m=>m.name==='Head'),faceNames=Object.keys(registration).filter(n=>!n.startsWith('NativeHand')&&n!=='WristCuff'&&!model.meshes.some(m=>m.name===n)),data=new S.SkeletonData(),root=new S.BoneData(0,'painted-render-root',null);data.bones.push(root);
 const nativeHandRegions=new Map(Object.entries(registration).filter(([n,r])=>r.nativePath).map(([n,r])=>[r.nativePath,n])),props=makePropLayer(S,sourceData,propAtlas,nativeHandRegions,atlas,base.fitted);
 const bodyNames=base.data.slots.map(s=>s.name),names=[...bodyNames.filter(n=>!/^Hand_|^ForearmFront_/.test(n)),...faceNames,...bodyNames.filter(n=>/^Hand_|^ForearmFront_/.test(n)),'SleeveHem_L','SleeveHem_R','ForearmTop_L','ForearmTop_R','Cuff_L','Cuff_R','NeckShade','UpperSkin_L','UpperSkin_R','ArmholeSeam_L','ArmholeSeam_R','CuffBand_L','CuffBand_R',...['L','R'].flatMap(side=>[...Array.from({length:7},(_,i)=>'UpperJoin_'+side+'_'+i),...Array.from({length:3},(_,i)=>'WristJoin_'+side+'_'+i)]),...props.slots];for(const n of names)data.slots.push(new S.SlotData(data.slots.length,n,root));
 const faceShift=(name,p)=>fitFacePoint(name,p,registration[name].bounds);
 // A shallow warm shadow under the chin, bound to the narrowed neck mesh.
 const neckMesh=model.meshes.find(m=>m.name==='Neck'),NECK_SHADE=[1,.87,.65],neckShade=(()=>{const points=[],triangles=[],N=12;
  for(let i=0;i<=N;i++){const x=-24+48*i/N;points.push([x,201],[x,190+2*(x/20)**2])}
  for(let i=0;i<N;i++){const k=i*2;triangles.push(k,k+1,k+2,k+2,k+1,k+3)}
  const bindings=points.map(p=>{let best,score=Infinity;for(let j=0;j<neckMesh.triangles.length;j+=3){const ids=neckMesh.triangles.slice(j,j+3),w=bary(p,...ids.map(i=>neckMesh.points[i]));if(!w)continue;const sc=w.reduce((a,x)=>a+Math.max(0,-x)**2,0);if(sc<score){score=sc;best={ids,w}}}return best});
  return{points,triangles,bindings}})();
 const faceMeshes={};for(const name of faceNames){const[x0,y0,x1,y1]=registration[name].bounds,points=[],triangles=[];for(let j=0;j<=4;j++)for(let i=0;i<=4;i++)points.push([x0+(x1-x0)*i/4,y1-(y1-y0)*j/4]);for(let j=0;j<4;j++)for(let i=0;i<4;i++){const k=j*5+i;triangles.push(k,k+5,k+1,k+1,k+5,k+6)}const bindings=points.map(p=>{let best,score=Infinity;for(let j=0;j<head.triangles.length;j+=3){const ids=head.triangles.slice(j,j+3),w=bary(faceShift(name,p),...ids.map(i=>head.points[i]));if(!w)continue;const s=w.reduce((a,x)=>a+Math.max(0,-x)**2,0);if(s<score){score=s;best={ids,w};if(s<1e-12)break}}return best});faceMeshes[name]={points,triangles,bindings}}
 const measuredArms=new WeakMap(),nativeHandCopies=new WeakMap(),textureCache=new Map(),cache=new WeakMap(),byName=new Map(model.meshes.map(m=>[m.name,m]));
 function texture(mesh,name,points){let entry=textureCache.get(name);if(!entry){const region=(name==='Torso'?shirtAtlas:name.startsWith('Iris_')&&irisAtlas?irisAtlas:atlas).findRegion(name),[x0,y0,x1,y1]=registration[name].bounds,regionUVs=new Float32Array(points.flatMap(p=>[name==='Iris_L'&&irisAtlas?1-(p[0]-x0)/(x1-x0):(p[0]-x0)/(x1-x0),(y1-p[1])/(y1-y0)])),probe=new S.MeshAttachment(name);probe.region=region;probe.regionUVs=regionUVs;probe.updateRegion();entry={region,regionUVs,uvs:probe.uvs};textureCache.set(name,entry)}mesh.region=entry.region;mesh.regionUVs=entry.regionUVs;mesh.uvs=entry.uvs;const tint=registration[name].tint??[1,1,1];mesh.color.set(tint[0],tint[1],tint[2],1)}
 const shortsPart=makeShorts(S,shortsAtlas);
 const armParts=makeTwoPartArms(S,armAtlas,atlas.findRegion('WristCuff'),garmentAtlas,limbAtlas),GLOVE_SHIFT={L:-6,R:6},GLOVE_SCALE=1.065,CUFF_HALF=9,CUFF_ALONG=[-3,3],SEPARATE_CUFF=false,TORSO_FRONT_HALF=42,FRONT_TOP=250;
 const upperJoins=(out,side)=>Array.from({length:7},(_,i)=>out.findSlot('UpperJoin_'+side+'_'+i)),wristJoins=(out,side)=>Array.from({length:3},(_,i)=>out.findSlot('WristJoin_'+side+'_'+i));
 function attachmentBlend(v,path){
  const animation=v.entry?.animation,t0=v.fixedTime??v.entry?.trackTime??0,t=v.entry?.loop&&animation?.duration?t0%animation.duration:t0,sl=v.skeleton.drawOrder.find(sl=>sl.getAttachment()?.path===path&&sl.color.a>.1),timeline=sl&&animation?.timelines.find(t=>t instanceof S.AttachmentTimeline&&t.slotIndex===sl.data.index);
  if(!timeline)return 1;
  for(let i=0;i<timeline.frames.length;i++)if(t>=timeline.frames[i]&&(i+1===timeline.frames.length||t<timeline.frames[i+1])){const start=timeline.frames[i],end=timeline.frames[i+1]??Infinity,x=Math.max(0,Math.min(1,(t-start)/.12,(end-t)/.12));return x*x*(3-2*x)}
  return 1;
 }
 function sample(v,settings={}){const geometry=base.sample(v),native=v.skeleton,holding=holdingHands(S,base.fitted,native),frameFor=side=>{const f=holding?.frames.get(side)??base.fitted.armFrame(native,side),pointing=native.drawOrder.some(sl=>sl.getAttachment()?.path==='Palms/S/Lu_Point2'&&sl.color.a>.1),open=native.drawOrder.some(sl=>group(sl.data.name)==='hand'+side&&sl.getAttachment()?.path==='Palms/Palm_2'&&sl.color.a>.1);const blend=attachmentBlend(v,'Palms/S/Lu_Point2'),target=[f.goal[0]+(side==='L'?-1:1)*30,f.goal[1]-34];return pointing&&open?{...f,elbow:f.elbow.map((x,i)=>x+(target[i]-x)*blend)}:f};let out=cache.get(v);if(!out){out=new S.Skeleton(data);out.updateWorldTransform(S.Physics.none);cache.set(v,out)}for(const name of bodyNames){const a=geometry.findSlot(name).getAttachment(),slot=out.findSlot(name);slot.setAttachment(null);if(native.sparkyAuthoredPose?.upperBodyOnly&&/^(Shorts|Leg_|Foot_|Sock_)/.test(name))continue;if(!a)continue;const sourceName=name.startsWith('ForearmFront_')?'Arm_'+name.slice(-1):name;texture(a,sourceName,byName.get(sourceName).points);slot.setAttachment(a)}
 out.findSlot('Shorts').setAttachment(native.sparkyAuthoredPose?.upperBodyOnly?null:shortsPart(base.fitted,native));
 const handTransforms=new Map(),mapHand=(p,side)=>{if(!handTransforms.has(side)){const sl=native.drawOrder.filter(sl=>group(sl.data.name)==='hand'+side&&sl.getAttachment()&&sl.color.a>.1).at(-1),path=sl?.getAttachment()?.path??'',f=base.fitted.armFrame(native,side),angle=(f.hand.getWorldRotationX()-f.hb.getWorldRotationX())*Math.PI/180,k=path==='Palms/S/Lu_Point2'?.77:path==='Palms/Palm_2'?.66:/Thumb/.test(path)?.48:/F_Point|Lu_Point|\/Point/.test(path)?.65:/Fist|Jump|Palm_3/.test(path)?.72:path==='Palms/Palm_R'?1:.8;handTransforms.set(side,{f,c:Math.cos(angle),s:Math.sin(angle),k})}const{f,c,s,k}=handTransforms.get(side),q=base.fitted.fitPoint(p,'hand'+side,native),dx=q[0]-f.wrist[0],dy=q[1]-f.wrist[1],x=(dx*c+dy*s)*1.25+(side==='L'?9:-9),y=(-dx*s+dy*c)*.93;const gs=GLOVE_SHIFT[side],K=k*GLOVE_SCALE;return[f.wrist[0]+K*(x*c-y*s)+gs*c,f.wrist[1]+K*(x*s+y*c)+gs*s]};
 for(const side of ['L','R'])out.findSlot('Cuff_'+side).setAttachment(null);
 // Reference has a single white band at the ankle: the shoe's painted collar. A
 // separate sock on top of it read as a doubled cuff, so it is not drawn.
 for(const side of ['L','R'])out.findSlot('Sock_'+side).setAttachment(null);
 // Every visible hand gets a cuff over the wrist end of the arm, whatever glove is drawn.
 // Gloves carry their own painted cuff; a separate cuff only stuck out beneath them.
 for(const side of ['L','R']){if(!SEPARATE_CUFF||!native.drawOrder.some(sl=>group(sl.data.name)==='hand'+side&&sl.getAttachment()&&sl.color.a>.1))continue;
  const f=base.fitted.armFrame(native,side),e=f.elbow,dx=f.wrist[0]-e[0],dy=f.wrist[1]-e[1],len=Math.hypot(dx,dy)||1,u=[dx/len,dy/len],n=[-u[1],u[0]],cv=[];
  for(const[a,b]of[[CUFF_ALONG[0],-CUFF_HALF],[CUFF_ALONG[1],-CUFF_HALF],[CUFF_ALONG[1],CUFF_HALF],[CUFF_ALONG[0],CUFF_HALF]])cv.push(f.wrist[0]+u[0]*a+n[0]*b,f.wrist[1]+u[1]*a+n[1]*b);
  const cuff=new S.MeshAttachment('Cuff_'+side);cuff.region=atlas.findRegion('WristCuff');cuff.vertices=cv;cuff.worldVerticesLength=8;cuff.regionUVs=new Float32Array([0,0,0,1,1,1,1,0]);cuff.triangles=[0,1,2,2,3,0];cuff.updateRegion();out.findSlot('Cuff_'+side).setAttachment(cuff)}
 // Arms are one continuous painted tube swept along shoulder -> filleted elbow
 // arc -> wrist, so outlines and shading run unbroken through every bend.
 // Sparky's own layering rule: a wrist over the torso means the forearm is in front of it.
 const torsoX=(base.fitted.armFrame(native,'L').goal[0]+base.fitted.armFrame(native,'R').goal[0])/2,wristInFront=f=>!f.behind&&Math.abs(f.wrist[0]-torsoX)<TORSO_FRONT_HALF&&f.wrist[1]>95&&f.wrist[1]<FRONT_TOP;
 const garmentFrames={L:frameFor('L'),R:frameFor('R')};out.findSlot('Torso').setAttachment(armParts.body(garmentFrames,geometry.shoulderPoint));
 const forwardArms=new Set(),armJoints=new Map();
 for(const side of ['L','R']){
  const f=frameFor(side);f.feedingUpperBody=!!native.sparkyAuthoredPose?.upperBodyOnly;const parts=armParts.sample(f,side,geometry.shoulderPoint),forward=!f.behind&&(!f.normal||wristInFront(f));armJoints.set(side,parts.joints);if(forward)forwardArms.add(side);
  // Legacy slot names retain their draw-order contracts; attachments themselves
  // are the new UpperArm and Forearm parts, each driven by its own bone segment.
  out.findSlot('Arm_'+side).setAttachment(parts.upper);out.findSlot('UpperSkin_'+side).setAttachment(native.sparkyAuthoredPose?.upperBodyOnly?null:parts.upperSkin);out.findSlot('ArmholeSeam_'+side).setAttachment(parts.seam);out.findSlot('CuffBand_'+side).setAttachment(null);
  out.findSlot('Sleeve_'+side).setAttachment(forward?null:parts.lower);
  out.findSlot('ForearmTop_'+side).setAttachment(forward?parts.lower:null);
  out.findSlot('ForearmFront_'+side).setAttachment(null);
  out.findSlot('SleeveHem_'+side).setAttachment(native.sparkyAuthoredPose?.seat>0?parts.cuff:null);
  parts.upperFade.forEach((m,i)=>out.findSlot('UpperJoin_'+side+'_'+i).setAttachment(m));
  parts.wristFade.forEach((m,i)=>out.findSlot('WristJoin_'+side+'_'+i).setAttachment(m));
 }
 measuredArms.set(v,armJoints);
 // Native gesture attachments retain their authored UV contracts, weighted
 // deformation and wrist orientation. Only the white glove artwork is replaced.
 for(const side of ['L','R']){
  const sl=native.drawOrder.filter(sl=>group(sl.data.name)==='hand'+side&&sl.getAttachment()&&sl.color.a>.1).at(-1),a=sl?.getAttachment(),path=a?.path??a?.name,paint=nativeHandRegions.get(path),clip=native.sparkyAuthoredPose?.referenceMotion?.name??v.entry?.animation?.name??'';
  if(!a){out.findSlot('Hand_'+side).setAttachment(null);continue}if(!paint||path==='Palms/Palm_R'&&!/Clapping/.test(clip))continue;
  let copy=nativeHandCopies.get(a);if(!copy){copy=a.copy();copy.region=(paint==='NativeHand06'&&glossAtlas?glossAtlas:atlas).findRegion(paint);copy.updateRegion();
   if(paint==='NativeHand06'&&glossAtlas){const r=copy.region;copy.uvs=new Float32Array(Array.from(copy.uvs,(value,i)=>i%2?r.v+r.v2-value:r.u+r.u2-value))}
   nativeHandCopies.set(a,copy)}
  const vertices=[];if(a instanceof S.MeshAttachment)a.computeWorldVertices(sl,0,a.worldVerticesLength,vertices,0,2);else a.computeWorldVertices(sl,vertices,0,2);
  const mapped=[];for(let i=0;i<vertices.length;i+=2)mapped.push(...mapHand([vertices[i],vertices[i+1]],side));
  if(path==='Palms/Thumb'){
   // Fixed calibration in this attachment's own long/short axes, following the
   // authored wrist rotation. It does not use frame bounds or actor resizing.
   const dx=mapped[2]-mapped[0],dy=mapped[3]-mapped[1],len=Math.hypot(dx,dy),u=[dx/len,dy/len],n=[-u[1],u[0]],f=base.fitted.armFrame(native,side);
   for(let i=0;i<mapped.length;i+=2){const x=mapped[i]-f.wrist[0],y=mapped[i+1]-f.wrist[1],along=(x*u[0]+y*u[1])*.9,across=(x*n[0]+y*n[1])*1.3;mapped[i]=f.wrist[0]+along*u[0]+across*n[0];mapped[i+1]=f.wrist[1]+along*u[1]+across*n[1]}
  }
  // Constant attachment calibration; retain the original gesture mesh and rotation.
  // Props use mapHand unchanged. Scale about the wrist before the clap seating.
  const gloveGain=(path==='Palms/Palm_R'?1.12:1.22)*(native.sparkyAuthoredPose?.feedingHandScale??1);
  const gloveWrist=base.fitted.armFrame(native,side).wrist;
  for(let i=0;i<mapped.length;i+=2){mapped[i]=gloveWrist[0]+(mapped[i]-gloveWrist[0])*gloveGain;mapped[i+1]=gloveWrist[1]+(mapped[i+1]-gloveWrist[1])*gloveGain}
  if(/Clapping/.test(clip)&&path==='Palms/Palm_R'){
   // Attachment-local UV landmarks, not per-frame bounds. This glove has no
   // cuff band: its rounded base sits directly on the forearm wrist anchor.
   const uv=copy.regionUVs??[0,1,0,0,1,0,1,1],tri=copy.triangles??[0,1,2,2,3,0];
   const landmark=p=>{let best,score=Infinity;for(let j=0;j<tri.length;j+=3){const ids=tri.slice(j,j+3),w=bary(p,...ids.map(i=>[uv[i*2],uv[i*2+1]]));if(!w)continue;const penalty=w.reduce((s,x)=>s+Math.max(0,-x)**2,0);if(penalty<score){score=penalty;best=[ids,w]}}if(!best)return null;const[ids,w]=best;return[0,1].map(axis=>ids.reduce((sum,id,k)=>sum+mapped[id*2+axis]*w[k],0))};
   const cuff=landmark([.5,.06]),palm=landmark([.5,.52]),joints=armJoints.get(side);
   if(cuff&&palm&&joints){const w=joints.wrist;for(let i=0;i<mapped.length;i+=2){mapped[i]+=w[0]-cuff[0];mapped[i+1]+=w[1]-cuff[1]}
    const dx=palm[0]-cuff[0],dy=palm[1]-cuff[1],len=Math.hypot(dx,dy)||1,u=[dx/len,dy/len],verts=[w[0]-u[0],w[1]-u[1]],uv=[.5,.5],tri=[];
    for(let k=0;k<=40;k++){const t=k/40*Math.PI*2,n=13.44*Math.cos(t),a=4.3*Math.sin(t)-1;verts.push(w[0]+u[0]*a-u[1]*n,w[1]+u[1]*a+u[0]*n);uv.push(.5,.5);if(k<40)tri.push(0,k+1,k+2)}
    const band=new S.MeshAttachment('ClapWristBand_'+side);band.region=atlas.findRegion('WristCuff');band.regionUVs=new Float32Array(uv);band.updateRegion();band.vertices=verts;band.worldVerticesLength=verts.length;band.triangles=tri;band.color.set(1,1,1,1);out.findSlot('Cuff_'+side).setAttachment(band);
   }
  }
  const mesh=new S.MeshAttachment('Hand_'+side);mesh.region=copy.region;mesh.vertices=mapped;mesh.worldVerticesLength=mapped.length;mesh.uvs=copy.uvs;mesh.regionUVs=copy.regionUVs??new Float32Array([0,1,0,0,1,0,1,1]);mesh.triangles=copy.triangles??[0,1,2,2,3,0];mesh.color.set(1,1,1,1);out.findSlot('Hand_'+side).setAttachment(mesh);

 }
 {const nv=geometry.findSlot('Neck').getAttachment()?.vertices,slot=out.findSlot('NeckShade');slot.setAttachment(null);
  if(nv){const a=new S.MeshAttachment('NeckShade'),v=neckShade.bindings.flatMap(b=>[b.ids.reduce((t,i,j)=>t+nv[i*2]*b.w[j],0),b.ids.reduce((t,i,j)=>t+nv[i*2+1]*b.w[j],0)]);a.vertices=v;a.worldVerticesLength=v.length;a.triangles=neckShade.triangles;if(!neckShade.uvs){const[x0,y0,x1,y1]=registration.Neck.bounds,u=(0-x0)/(x1-x0),w=(y1-182)/(y1-y0),probe=new S.MeshAttachment('NeckShade');probe.region=atlas.findRegion('Neck');probe.regionUVs=new Float32Array(neckShade.points.flatMap(()=>[u,w]));probe.updateRegion();neckShade.uvs=probe.uvs;neckShade.regionUVs=probe.regionUVs}
   // Flat neck yellow sampled from the middle of the painted neck, tinted to the shadow tone.
   a.region=atlas.findRegion('Neck');a.regionUVs=neckShade.regionUVs;a.uvs=neckShade.uvs;a.color.set(...NECK_SHADE,1);slot.setAttachment(a)}}
 const hv=geometry.findSlot('Head').getAttachment().vertices;
 const eating=native.sparkyAuthoredPose?.eating,faceRest=eating?hv.slice():hv;
 if(eating){const xs=Array.from(hv).filter((_,i)=>i%2===0),ys=Array.from(hv).filter((_,i)=>i%2),cx=(Math.min(...xs)+Math.max(...xs))/2,bottom=Math.min(...ys);for(let i=0;i<hv.length;i+=2){const x=hv[i]-cx,y=hv[i+1]-bottom,jaw=Math.max(0,1-y/48)*Math.max(0,1-Math.abs(x)/100),cheek=Math.exp(-(((Math.abs(x)-63)/25)**2)-((y-35)/24)**2),side=x<0?-1:1;hv[i+1]-=jaw*(8*eating.open+3.2*eating.chew-1.5*eating.swallow);hv[i]+=side*cheek*eating.chew*(3.8+1.8*side*eating.side);}}
 const t=native.sparkyAuthoredPose?.referenceMotion?.time??v.fixedTime??v.entry?.trackTime??0,clip=native.sparkyAuthoredPose?.referenceMotion?.name??v.entry?.animation?.name??'',speaking=settings.speaking||v.speaking,shape=settings.shape??v.speechSource?.()?.shape;
 const visibleBlink=side=>{if(native.sparkyAuthoredPose?.blink)return native.sparkyAuthoredPose.blink;const nativeSide=side==='L'?'R':'L',animation=sourceData.findAnimation(clip),localTime=v.entry?.loop&&animation?.duration>0?t%animation.duration:t;for(const n of ['1','2']){const slot=native.findSlot('EB_'+nativeSide+n);if(!slot?.getAttachment()||slot.color.a<=.5)continue;const timeline=animation?.timelines.find(a=>a instanceof S.AttachmentTimeline&&a.slotIndex===slot.data.index);if(timeline){for(let i=0;i<timeline.frames.length;i++)if(localTime>=timeline.frames[i]&&(i+1===timeline.frames.length||localTime<timeline.frames[i+1]))return localTime-timeline.frames[i]<.065||(i+1<timeline.frames.length&&timeline.frames[i+1]-localTime<.065)?'half':'closed'}return'closed'}return'open'};
 const nativeSpeechPath=native.findSlot('mouth')?.getAttachment()?.path??native.findSlot('mouth')?.getAttachment()?.name??'';
 const nativeSpeechShape=/^mouth\/([A-HX])$/.exec(nativeSpeechPath)?.[1];
 const lips=native.findSlot('Lips')?.getAttachment(),nativeMouth={'Lips/Lips_N':'Smile','Lips/Big_smile':'Happy','Lips/Big_smile_12':'Happy','Lips/Goofy':'Laugh','Lips/O':'O','Lips/Sad':'Sad','Lips/Pain_Sad':'Sad','Lips/Teeth1':'Teeth','Lips/EEE/2':'FV'}[lips?.path??lips?.name];
 let mouth=speaking||(/\/Vocal\//.test(clip)&&nativeSpeechShape)?mouthForSpeech(shape,nativeSpeechShape):nativeMouth??(/Hurray|Clapping|Yeahh|Woohoo|Happy/.test(clip)?'Happy':/Sad|Pain/.test(clip)?'Sad':'Smile');
 for(const name of faceNames){let visible=true;const side=name.slice(-1),blink=visibleBlink(side),closed=blink==='closed';if(name.startsWith('EyeWhite_')||name.startsWith('Iris_'))visible=blink==='open';if(name.startsWith('EyeClosed_'))visible=closed;if(name.startsWith('EyeHalf_'))visible=blink==='half';if(name.startsWith('Mouth_'))visible=name==='Mouth_'+mouth;const slot=out.findSlot(name);slot.setAttachment(null);if(!visible)continue;const f=faceMeshes[name],faceHead=eating&&!name.startsWith('Mouth_')?faceRest:hv,verts=f.bindings.flatMap(b=>[b.ids.reduce((s,i,j)=>s+faceHead[i*2]*b.w[j],0),b.ids.reduce((s,i,j)=>s+faceHead[i*2+1]*b.w[j],0)]),a=new S.MeshAttachment(name);
  if(/^Iris_|^Brow_/.test(name)){
   const boneName=(name.startsWith('Iris_')?'Eyeball_':'Eyebrow_')+(side==='L'?'R':'L'),b=native.findBone(boneName),rest=base.fitted.bind.findBone(boneName),parent=b.parent;
   const reference=[parent.a*rest.x+parent.b*rest.y+parent.worldX,parent.c*rest.x+parent.d*rest.y+parent.worldY],actual=base.fitted.fitPoint([b.worldX,b.worldY],'head',native),zero=base.fitted.fitPoint(reference,'head',native),limit=name.startsWith('Iris_')?3:7,dx=Math.max(-limit,Math.min(limit,actual[0]-zero[0])),dy=Math.max(-limit,Math.min(limit,actual[1]-zero[1]));
   const angle=name.startsWith('Brow_')?Math.max(-20,Math.min(20,b.rotation-rest.rotation))*Math.PI/180:0,c=Math.cos(angle),s=Math.sin(angle),cx=verts.reduce((v,x,i)=>v+(i%2===0?x:0),0)/(verts.length/2),cy=verts.reduce((v,x,i)=>v+(i%2?x:0),0)/(verts.length/2);
   for(let i=0;i<verts.length;i+=2){const x=verts[i]-cx,y=verts[i+1]-cy;verts[i]=cx+x*c-y*s+dx;verts[i+1]=cy+x*s+y*c+dy}
  }
  if(name.startsWith('Mouth_')){const shape=native.sparkyAuthoredPose?.mouthShape;if(shape){let cx=0,cy=0;for(let i=0;i<verts.length;i+=2){cx+=verts[i];cy+=verts[i+1]}cx/=verts.length/2;cy/=verts.length/2;for(let i=0;i<verts.length;i+=2){verts[i]=cx+(verts[i]-cx)*shape[0];verts[i+1]=cy+(verts[i+1]-cy)*shape[1]+shape[2]}}}a.vertices=verts;a.worldVerticesLength=verts.length;a.triangles=f.triangles;texture(a,name,f.points);if(name.startsWith('Brow_'))a.color.set(1,.05,0,1);slot.setAttachment(a)}
 if(eatingAtlas&&eating&&(eating.open>.015||eating.closed)){const open=eating.open>.015,source=out.findSlot('Mouth_'+mouth)?.getAttachment(),verts=source?.vertices;if(verts){const xs=Array.from(verts).filter((_,i)=>i%2===0),ys=Array.from(verts).filter((_,i)=>i%2),x=(Math.min(...xs)+Math.max(...xs))/2+eating.side*eating.chew*1.8,w=open?48+6*eating.open:54-eating.chew*9,h=open?8+24*eating.open:24-eating.chew*4,nose=out.findSlot('Nose')?.getAttachment()?.vertices,noseBottom=nose?Math.min(...Array.from(nose).filter((_,i)=>i%2)):null,restY=(Math.min(...ys)+Math.max(...ys))/2,y=open&&noseBottom!==null?restY*(1-eating.open)+(noseBottom+2-h/2)*eating.open:restY,mesh=new S.MeshAttachment('FeedingMouth');mesh.region=eatingAtlas.findRegion(open?'FeedingOpen':'FeedingClosed');mesh.regionUVs=new Float32Array([0,0,0,1,1,1,1,0]);mesh.updateRegion();mesh.vertices=[x-w/2,y+h/2,x-w/2,y-h/2,x+w/2,y-h/2,x+w/2,y+h/2];mesh.worldVerticesLength=8;mesh.triangles=[0,1,2,2,3,0];mesh.eatingAperture=eating.open;for(const name of faceNames)if(name.startsWith('Mouth_'))out.findSlot(name).setAttachment(null);out.findSlot(open?'Mouth_O':'Mouth_Smile').setAttachment(mesh);}}
 const activeProps=props.sample(native,out,mapHand,holding),beforeHead=[],afterHead=[],beforeHands=[],afterHands=[];
 for(const name of activeProps){const slot=out.findSlot('Prop:'+name);if(name==='Cap_Bottom'||name==='Cap_Top')afterHead.push(slot);else if(/^Birthday|Brush$|Hold_Back/.test(name))beforeHands.push(slot);else afterHands.push(slot)}
 const behind=side=>base.fitted.armFrame(native,side).behind,bodyOrder=bodyNames.filter(n=>n!=='Head'&&!/^Hand_|^ForearmFront_/.test(n)&&!(/^(Arm_|Sleeve_)/.test(n)&&behind(n.slice(-1)))),
  // Arms reaching behind the back are layered behind the shorts as well as the shirt.
  body=[...['L','R'].filter(behind).flatMap(s=>['Arm_'+s,'Sleeve_'+s]),...bodyOrder].flatMap(n=>{
   if(n==='Neck')return[out.findSlot(n),out.findSlot('NeckShade')];
   if(n==='Torso')return[out.findSlot(n),out.findSlot('ArmholeSeam_L'),out.findSlot('ArmholeSeam_R')];
   if(n.startsWith('Arm_')){const side=n.slice(-1);return[...(!forwardArms.has(side)?[out.findSlot('Sleeve_'+side),...wristJoins(out,side)]:[]),...upperJoins(out,side),out.findSlot('UpperSkin_'+side),out.findSlot(n)]}
   if(n.startsWith('Sleeve_'))return[];
   return[out.findSlot(n)];
  }),face=faceNames.map(n=>out.findSlot(n)),forearms=bodyNames.filter(n=>/^ForearmFront_/.test(n)).map(n=>out.findSlot(n)),hands=bodyNames.filter(n=>/^Hand_/.test(n)).map(n=>out.findSlot(n));out.drawOrder=[...body,...beforeHead,out.findSlot('Head'),...face,...afterHead,...beforeHands,...forearms,out.findSlot('SleeveHem_L'),out.findSlot('SleeveHem_R'),...['L','R'].flatMap(side=>[...(forwardArms.has(side)?[out.findSlot('CuffBand_'+side)]:[]),out.findSlot('ForearmTop_'+side),...(forwardArms.has(side)?wristJoins(out,side):[])]),out.findSlot('Cuff_L'),out.findSlot('Cuff_R'),...hands,...afterHands.sort((a,b)=>{const k=s=>s.data.name==='Prop:Icecream'?0:/Prop:Hold_front/.test(s.data.name)?1:2;return k(a)-k(b)})];
 // Only gestures with an authored front/back overlap need interleaved chains.
 const overlapGesture=native.drawOrder.some(sl=>sl.getAttachment()&&sl.color.a>.1&&['Palms/S/Lu_Point2','Palms/Palm_2','Palms/Lucas_Palm_25'].includes(sl.getAttachment().path));
 if(overlapGesture){
  const rank=side=>native.drawOrder.reduce((rank,sl,i)=>group(sl.data.name)==='hand'+side&&sl.getAttachment()&&sl.color.a>.1?i:rank,-1),sides=['L','R'].sort((a,b)=>rank(a)-rank(b));
  const chain=sides.flatMap(side=>[out.findSlot('ForearmTop_'+side),...wristJoins(out,side),out.findSlot('Cuff_'+side),out.findSlot('Hand_'+side)]),moving=new Set(chain);
  const order=out.drawOrder.filter(slot=>!moving.has(slot)),position=order.findIndex(slot=>slot.data.name.startsWith('Prop:Hold_front'));
  order.splice(position<0?order.length:position,0,...chain);out.drawOrder=order;
 }
 if(native.sparkyAuthoredPose?.seat>0){const cuffs=['L','R'].map(s=>out.findSlot('SleeveHem_'+s)),set=new Set(cuffs);out.drawOrder=out.drawOrder.filter(s=>!set.has(s));const at=out.drawOrder.findIndex(s=>s.data.name.startsWith('Hand_'));out.drawOrder.splice(at<0?out.drawOrder.length:at,0,...cuffs)}
 return out;
 }
 return{sample,base,data,faceMeshes,measuredArms};
}
export async function installPaintedProfile(player,settings){
 const am=player.instance.assetManager;
 const atlas=async path=>{const url=new URL(path,import.meta.url).href;await new Promise((ok,no)=>am.loadTextureAtlas(url,ok,(_,e)=>no(Error(String(e)))));return am.get(url)};
 const json=async path=>{const response=await fetch(new URL(path,import.meta.url));if(!response.ok)throw Error('Unable to load '+path);return response.json()};
 // Independent atlases and geometry load together instead of ten serial waits.
 const gloveRoot='./gloves-v2/';
 const [model,reg,paint,props,shirt,arms,garment,shorts,iris,gloss,gloveAtlas,gloveRegistration,limbAtlas,eatingAtlas]=await Promise.all([
  loadRuntimeModel(),json('./paint-registration.json?v=joint-7'),atlas('./Sparky_Painted.atlas?v=joint-7'),atlas('./Native_Props.atlas'),
  atlas('./Shirt-Redraw-v2.atlas'),atlas('./Measured-Arms-v1.atlas'),atlas('./Unified-Shirt-v2.atlas'),atlas('./Shorts-Redraw-v3.atlas'),atlas('./Reference-Iris-v1.atlas'),atlas('./Glove-Gloss-v1.atlas'),atlas(gloveRoot+'sparky-gloves-v2.atlas'),json(gloveRoot+'registration.json'),atlas('./limbs-v2/limb-parts.atlas'),atlas('./feeding-mouth.atlas')
 ]);
 const profile=makePaintedProfile(spine,player.data,model,paint,reg,props,null,shirt,arms,garment,shorts,iris,gloss,limbAtlas,eatingAtlas);
 profile.gloves=createGloveSkin(spine,gloveAtlas,gloveRegistration,profile.data);
 profile.limbs=createLimbSkin(spine,limbAtlas,profile.data);
 player.gloveSkinEnabled=true;
 player.referenceAdapter=v=>{let out=profile.sample(v,settings());out=profile.limbs.apply(v,out);return player.gloveSkinEnabled?profile.gloves.apply(v,out,profile.measuredArms.get(v)):out};
 // Painted artwork already has outlines. The extra silhouette pass made the offset shadow.
 player.outline=null;
 const camera=player.instance.renderer.camera;camera.position.set(0,201.5,0);camera.viewportWidth=360;camera.viewportHeight=450;camera.update();return profile;
}
