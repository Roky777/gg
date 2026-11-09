export function createLimbSkin(S,atlas,data){
 data.slots.push(new S.SlotData(data.slots.length,'SeatedShorts',data.bones[0]));
 const cache=new WeakMap();
 function get(view,name,uv,triangles){let items=cache.get(view);if(!items){items=new Map();cache.set(view,items)}let m=items.get(name);if(!m){m=new S.MeshAttachment(name);m.region=atlas.findRegion(name);m.regionUVs=new Float32Array(uv);m.updateRegion();m.triangles=triangles;m.worldVerticesLength=uv.length;m.vertices=new Float32Array(uv.length);items.set(name,m)}return m}
 function shin(view,side,knee,ankle){
  const name='Shin_'+side,verts=[],uv=[],tri=[],length=Math.hypot(ankle[0]-knee[0],ankle[1]-knee[1])||1,u=[(ankle[0]-knee[0])/length,(ankle[1]-knee[1])/length],N=8,rows=[];
  for(let i=0;i<=8;i++){const a=-Math.PI/2+i*Math.PI/16;rows.push([10*Math.sin(a),Math.max(.001,10*Math.cos(a))])}
  for(let i=1;i<=12;i++){const t=i/12;rows.push([length*t,10-1.6*t])}
  for(let i=1;i<=8;i++){const a=i*Math.PI/16;rows.push([length+8.4*Math.sin(a),Math.max(.001,8.4*Math.cos(a))])}
  rows.forEach(([s,r],j)=>{for(let i=0;i<=N;i++){const t=i/N,n=(2*t-1)*r;verts.push(knee[0]+u[0]*s-u[1]*n,knee[1]+u[1]*s+u[0]*n);uv.push((128+(t-.5)*58*Math.min(1,r/10))/256,.5);if(j<rows.length-1&&i<N){const k=j*(N+1)+i;tri.push(k,k+N+1,k+1,k+1,k+N+1,k+N+2)}}});
  const m=get(view,name,uv,tri);m.vertices.set(verts);m.joints={knee:knee.slice(),ankle:ankle.slice()};return m;
 }
 function apply(view,out){
  const pose=view.skeleton.sparkyAuthoredPose,extra=out.findSlot('SeatedShorts');extra.setAttachment(null);if(!pose||pose.upperBodyOnly)return out;
  for(const side of['L','R']){const leg=pose.legs?.[side];if(!leg||!(pose.seat>0))continue;out.findSlot('Leg_'+side).setAttachment(shin(view,side,leg.knee,leg.ankle))}
  // Change the pose drawing during the table-occluded bend. Crossfading two
  // different silhouettes exposed the chair through the pelvis on the rise.
  const blend=(pose.seat??0)>.55?1:0;if(!blend)return out;
  const m=get(view,'SeatedShorts',[0,0,0,1,1,1,1,0],[0,1,2,2,3,0]),top=124.5+(pose.body?.[1]??0)+9,x=pose.body?.[0]??0,bottom=top-61;
  m.vertices.set([x-63,top,x-63,bottom,x+63,bottom,x+63,top]);m.color.set(1,1,1,blend);m.seatContact=[x,74];extra.setAttachment(m);
  const original=out.findSlot('Shorts');original.getAttachment().color.a=1-blend;const at=out.drawOrder.indexOf(original);out.drawOrder.splice(at+1,0,extra);return out;
 }
 return{apply};
}
