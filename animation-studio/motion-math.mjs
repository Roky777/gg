import{sampleNaturalKeys,sampleIntentGazeKeys}from'./motion-curves.mjs';
import{sampleSecondaryKeys}from'./secondary-motion.mjs';
import{motionPolicyFor}from'./motion-policy.mjs';
export const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
export const smooth=n=>{n=clamp(n);return n*n*(3-2*n)};
const settle=n=>{n=clamp(n);return n*n*n*(10+n*(-15+6*n))};
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const REST={L:{s:[-28,177],e:[-43.9036025697,149.9177234096],w:[-58,124]},R:{s:[29,177],e:[45.0497754075,150.0002315467],w:[59,124]}};
export const sampleKeys=sampleNaturalKeys;
function lengths(side){const r=REST[side];return[Math.hypot(r.e[0]-r.s[0],r.e[1]-r.s[1]),Math.hypot(r.w[0]-r.e[0],r.w[1]-r.e[1])]}
export function solveArm(side,target,offset=[0,0],projection=1){
 const rest=REST[side],shoulder=rest.s.map((v,i)=>v+offset[i]),dx=target[0]-shoulder[0],dy=target[1]-shoulder[1],length=Math.hypot(dx,dy)||1,[a,b]=lengths(side),reach=clamp(length,Math.abs(a-b)+.05,a+b-.00001),u=[dx/length,dy/length],along=(a*a+reach*reach-b*b)/(2*reach),height=Math.sqrt(Math.max(0,a*a-along*along)),n=[-u[1],u[0]],pole=(side==='L'?-1:1)*n[0]-.45*n[1],normal=Math.hypot(pole,.65),plane=pole/normal*projection,depth=height*Math.sqrt(Math.max(0,1-plane*plane)),elbow=[shoulder[0]+u[0]*along+n[0]*height*plane,shoulder[1]+u[1]*along+n[1]*height*plane],wrist=[shoulder[0]+u[0]*reach,shoulder[1]+u[1]*reach];
 if(Math.hypot(target[0]-offset[0]-rest.w[0],target[1]-offset[1]-rest.w[1])<1e-7)return{shoulder,elbow:rest.e.map((v,i)=>v+offset[i]),wrist:rest.w.map((v,i)=>v+offset[i]),depth:0};
 return{shoulder,elbow,wrist,depth};
}
function directions(side,key,projection=1){const p=solveArm(side,key.slice(1,3),[0,0],projection);return[[p.elbow[0]-p.shoulder[0],p.elbow[1]-p.shoulder[1],p.depth],[p.wrist[0]-p.elbow[0],p.wrist[1]-p.elbow[1],-p.depth]]}
function slerp(a,b,t){const la=Math.hypot(...a),lb=Math.hypot(...b),u=a.map(v=>v/la),v=b.map(v=>v/lb),angle=Math.acos(clamp(u.reduce((s,n,i)=>s+n*v[i],0),-1,1));if(angle<1e-6)return a.slice();const den=Math.sin(angle);return u.map((n,i)=>(n*Math.sin((1-t)*angle)+v[i]*Math.sin(t*angle))/den*la)}
const armCurves=new WeakMap();
function continuousArm(side,keys,t,projection,secondary,duration){let variants=armCurves.get(keys);if(!variants){variants=new Map();armCurves.set(keys,variants)}const id=side+':'+projection;let curves=variants.get(id);if(!curves){const poses=keys.map(k=>directions(side,k,projection));curves=[0,1].map(part=>{let previous=null;const angles=keys.map((k,i)=>{const v=poses[i][part],raw=Math.atan2(v[1],v[0]),azimuth=previous===null?raw:previous+wrap(raw-previous);previous=azimuth;return[k[0],azimuth,Math.atan2(v[2],Math.hypot(v[0],v[1]))]});return{angles,length:Math.hypot(...poses[0][part])}});variants.set(id,curves)}return curves.map((curve,part)=>{const[azimuth,elevation]=secondary?sampleSecondaryKeys(curve.angles,t,duration,{hz:part?6:5,damping:.9,limit:.035,amount:.55}):sampleNaturalKeys(curve.angles,t),r=curve.length*Math.cos(elevation);return[r*Math.cos(azimuth),r*Math.sin(azimuth),curve.length*Math.sin(elevation)]});}
function sampleArm(side,keys,t,body,projection=1,impacts=[],secondary=false,duration=0){
 let i=1;while(i<keys.length-1&&t>keys[i][0])i++;const ka=keys[Math.max(0,i-1)],kb=keys[i]??ka,q=kb[0]===ka[0]?0:clamp((t-ka[0])/(kb[0]-ka[0])),hit=impacts.some(at=>Math.abs(at-kb[0])<1e-5),release=impacts.some(at=>Math.abs(at+.04-ka[0])<1e-5),u=hit?q*q:release?1-(1-q)*(1-q):settle(q),a=directions(side,ka,projection),b=directions(side,kb,projection),curved=impacts.length?null:continuousArm(side,keys,t,projection,secondary,duration),upper=curved?.[0]??slerp(a[0],b[0],u),lower=curved?.[1]??slerp(a[1],b[1],u),rest=REST[side],shoulder=rest.s.map((v,j)=>v+body[j]),elbow=shoulder.map((v,j)=>v+upper[j]),wrist=elbow.map((v,j)=>v+lower[j]),neutral=Math.atan2(rest.w[1]-rest.e[1],rest.w[0]-rest.e[0]),angle=Math.atan2(lower[1],lower[0]),flex=clamp((secondary?sampleSecondaryKeys(keys,t,duration,{hz:6,damping:.9,limit:3,amount:.5}):sampleNaturalKeys(keys,t))[2]??0,-35,35);return{arm:{shoulder,elbow,wrist,depth:upper[2],lowerDepth:lower[2]},angle:wrap(angle-neutral)*180/Math.PI+flex,flex}
}
export function evaluateMotion(clip,t){
 const policy=motionPolicyFor(clip);
 const pose={arms:{},legs:{},feet:{},head:0,headPosition:[0,0],body:[0,0],gaze:[0,0],wrist:{},wristFlex:{}};if(clip.channels?.body)pose.body=sampleKeys(clip.channels.body,t);
 for(const side of ['L','R']){
  if(clip.channels?.[side]){const p=sampleArm(side,clip.channels[side],t,pose.body,clip.elbowProjection?.[side]??1,clip.armImpacts,policy.arms,clip.duration);pose.arms[side]=p.arm;pose.wrist[side]=p.angle;pose.wristFlex[side]=p.flex}
  if(clip.channels?.['leg'+side]){const[kx,ky,ax,ay]=sampleKeys(clip.channels['leg'+side],t);pose.legs[side]={knee:[kx,ky],ankle:[ax,ay]};pose.feet[side]={angle:clip.channels?.['foot'+side]?sampleKeys(clip.channels['foot'+side],t)[0]:0}}
 }
 if(clip.channels?.head)pose.head=(policy.head?sampleSecondaryKeys(clip.channels.head,t,clip.duration,{hz:3.5,damping:.9,limit:.8,amount:.65}):sampleKeys(clip.channels.head,t))[0];
 if(clip.channels?.headPosition)pose.headPosition=policy.headPosition?sampleSecondaryKeys(clip.channels.headPosition,t,clip.duration,{hz:4,damping:.95,limit:.45,amount:.6}):sampleKeys(clip.channels.headPosition,t);
 if(clip.channels?.gaze)pose.gaze=policy.gazeLead?sampleIntentGazeKeys(clip.channels.gaze,t):sampleKeys(clip.channels.gaze,t);
 pose.seat=clip.channels?.seat?clamp(sampleKeys(clip.channels.seat,t)[0]):0;
 pose.mouthShape=clip.channels?.mouthShape?sampleKeys(clip.channels.mouthShape,t):[1,1,0];
 if(clip.feedingFace){const[open,chew,side,swallow]=clip.channels?.eating?sampleKeys(clip.channels.eating,t):[0,0,0,0];pose.eating={open,chew,side,swallow,closed:clip.id==='FD02'||clip.id==='FD06'};if(clip.hoverMouth){let dt=t-clip.hoverMouth.start;if(dt<0)dt+=clip.duration;pose.eating.open=clip.hoverMouth.from+(clip.hoverMouth.to-clip.hoverMouth.from)*smooth(dt/.18);}}
 if(Array.isArray(clip.blinks)){pose.blink='open';for(const[at,duration]of clip.blinks){const u=(t-at)/duration;if(u>=0&&u<=1)pose.blink=u<.22||u>.76?'half':'closed'}}
 if(clip.mouth){let key=clip.mouth[0];for(const item of clip.mouth)if(item[0]<=t)key=item;pose.mouth=key[1]}
 const follow=clip.sceneState?.interaction,focus=clip.sceneState?.focusGaze;
 if(focus){pose.gaze=focus.slice();pose.head+=focus[0]*.7;}
 if(follow?.active){const head=follow.headGaze??follow.gaze;pose.gaze=follow.gaze.slice();pose.head+=head[0]*1.3;pose.headPosition[0]+=head[0]*follow.ready*.4;pose.headPosition[1]-=follow.ready*1.8;if(pose.eating)pose.eating.open=Math.max(pose.eating.open,follow.ready*.85);}
 return pose;
}
export function blendMotionPoses(a,b,t){
 const mix=(x,y)=>x+(y-x)*t,body=a.body.map((v,i)=>mix(v,b.body[i])),out={...b,body,arms:{},legs:{},wrist:{},head:mix(a.head,b.head),headPosition:a.headPosition.map((v,i)=>mix(v,b.headPosition[i])),gaze:a.gaze.map((v,i)=>mix(v,b.gaze[i]))};
 for(const side of ['L','R']){const pa=a.arms[side]??solveArm(side,REST[side].w.map((v,i)=>v+a.body[i]),a.body),pb=b.arms[side]??solveArm(side,REST[side].w.map((v,i)=>v+b.body[i]),b.body),upper=slerp([pa.elbow[0]-pa.shoulder[0],pa.elbow[1]-pa.shoulder[1],pa.depth??0],[pb.elbow[0]-pb.shoulder[0],pb.elbow[1]-pb.shoulder[1],pb.depth??0],t),lower=slerp([pa.wrist[0]-pa.elbow[0],pa.wrist[1]-pa.elbow[1],pa.lowerDepth??-(pa.depth??0)],[pb.wrist[0]-pb.elbow[0],pb.wrist[1]-pb.elbow[1],pb.lowerDepth??-(pb.depth??0)],t),shoulder=REST[side].s.map((v,i)=>v+body[i]),elbow=shoulder.map((v,i)=>v+upper[i]);out.arms[side]={shoulder,elbow,wrist:elbow.map((v,i)=>v+lower[i]),depth:upper[2],lowerDepth:lower[2]};out.wrist[side]=(a.wrist[side]??0)+wrap(((b.wrist[side]??0)-(a.wrist[side]??0))*Math.PI/180)*180/Math.PI*t;
  if(a.legs[side]||b.legs[side]){const fallback={knee:[side==='L'?-28:28,74],ankle:[side==='L'?-27.5:27.5,55]},la=a.legs[side]??fallback,lb=b.legs[side]??fallback;out.legs[side]={knee:la.knee.map((v,i)=>mix(v,lb.knee[i])),ankle:la.ankle.map((v,i)=>mix(v,lb.ankle[i]))};out.feet[side]={angle:0}}
 }out.seat=mix(a.seat??0,b.seat??0);out.mouthShape=(a.mouthShape??[1,1,0]).map((v,i)=>mix(v,(b.mouthShape??[1,1,0])[i]));out.wristFlex=Object.fromEntries(['L','R'].map(s=>[s,mix(a.wristFlex?.[s]??0,b.wristFlex?.[s]??0)]));
 if(a.eating||b.eating){const pa=a.eating??{open:0,chew:0,side:0,swallow:0},pb=b.eating??{open:0,chew:0,side:0,swallow:0};out.eating={...pb,...Object.fromEntries(['open','chew','side','swallow'].map(k=>[k,mix(pa[k],pb[k])]))};}
 return out;
}
