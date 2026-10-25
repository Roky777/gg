/** Additive poses on the existing rig. Never change scale, camera, feet or meshes. */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ease=v=>v*v*(3-2*v);
export class CompanionPose{
 constructor({reduced=false}={}){this.reduced=reduced;this.target={x:0,y:0};this.gaze={x:0,y:0};this.gesture=null;this.time=0;this.cache=new WeakMap();this.enabled=true;}
 look(x=.5,y=.5){this.target={x:clamp(.3+x*.55,0,.85),y:clamp((.5-y)*.85,-.45,.45)};}
 faceChild(){this.target={x:0,y:0};}
 act(kind){if(this.reduced)return;if(this.gesture&&this.gesture.kind===kind&&(this.gesture.start===null||this.time-this.gesture.start<this.gesture.duration))return;this.gesture={kind,start:null,duration:kind==='wave'?1.8:kind==='guide'?1.6:.85};}
 clear(){this.gesture=null;this.faceChild();}
 apply(skeleton,{time,dt=1/60,active='idle'}={}){
  if(this.reduced||!this.enabled)return;this.time=time;
  let b=this.cache.get(skeleton);if(!b){b={face:skeleton.findBone('Face'),eyes:['Eyeball_L','Eyeball_R'].map(n=>skeleton.findBone(n)),wrist:skeleton.findBone('Hand_Left_IK_Bone2'),palm:skeleton.findBone('Palm_R2')};this.cache.set(skeleton,b);}
  const weight=1-Math.exp(-Math.min(dt,.1)*8);this.gaze.x+=(this.target.x-this.gaze.x)*weight;this.gaze.y+=(this.target.y-this.gaze.y)*weight;
  // Keep authored strong expressions intact; additive attention belongs to resting poses.
  if(active!=='idle'&&active!=='talk')return;
  for(const eye of b.eyes){if(!eye?.parent)continue;this.worldOffset(eye,this.gaze.x*6,this.gaze.y*5);}
  const g=this.gesture;if(!g)return;if(g.start===null)g.start=time;const t=(time-g.start)/g.duration;if(t>=1){this.gesture=null;if(g.kind==='wave')this.look(.5,.5);return;}
  const envelope=ease(Math.min(1,t*5))*ease(Math.min(1,(1-t)*5));
  if(b.face){const nod=g.kind==='nod'?-2.3*Math.sin(t*Math.PI*2):g.kind==='ponder'?1.8*Math.sin(t*Math.PI):-.8*Math.sin(t*Math.PI);b.face.rotation+=nod*envelope;}
  if((g.kind==='guide'||g.kind==='wave')&&b.wrist){
   const goal=g.kind==='wave'?{x:300+Math.sin(t*Math.PI*6)*14,y:620}:{x:285,y:650+this.target.y*130};
   this.worldOffset(b.wrist,(goal.x-b.wrist.worldX)*envelope,(goal.y-b.wrist.worldY)*envelope);
   if(b.palm&&g.kind==='wave')b.palm.rotation+=Math.sin(t*Math.PI*6)*9*envelope;
  }
 }
 worldOffset(bone,dx,dy){const p=bone.parent;if(!p)return;const det=p.a*p.d-p.b*p.c;if(Math.abs(det)<1e-7)return;bone.x+=(p.d*dx-p.b*dy)/det;bone.y+=(p.a*dy-p.c*dx)/det;}
}
