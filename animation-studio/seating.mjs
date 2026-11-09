// Front-view staging: thighs project toward the viewer; knees stay below their
// own hips. Shoes are fixed to the ground while the pelvis transfers to a seat.
export function installSeating(clips){
 for(const c of clips)if(c.id.startsWith('F')||c.id==='C11'){
  c.channels.seat=[[0,1]];
  for(const side of['L','R'])for(const k of c.channels['leg'+side]??[]){k[1]=side==='L'?-28:28;k[2]=78;k[3]=side==='L'?-27.5:27.5;k[4]=55}
  for(const side of['L','R']){const keys=c.channels[side];if(keys?.length===1&&keys[0][2]===145){keys[0][2]=162;c.elbowProjection={...c.elbowProjection,[side]:.15}}}
 }
 const c=clips.find(c=>c.id==='F01');
 c.elbowProjection={L:.15,R:.15};
 c.channels.body=[[0,0,0],[.22,0,-1],[.45,0,-4],[.9,0,-16],[1.14,0,-19.2],[1.34,0,-18],[2.4,0,-18],[2.65,0,-18.5],[2.95,0,-12],[3.5,0,-1],[4,0,0]];
 c.channels.seat=[[0,0],[.45,.12],[.9,.8],[1.14,1],[2.65,1],[2.95,.65],[3.5,.03],[4,0]];
 for(const side of['L','R']){const x=side==='L'?-28:28,foot=side==='L'?-27.5:27.5;c.channels['leg'+side]=[[0,x,74,foot,55],[.45,x,74.5,foot,55],[1.14,x,78,foot,55],[2.65,x,78,foot,55],[3.5,x,74,foot,55],[4,x,74,foot,55]]}
 c.channels.head=[[0,0],[.45,-.8],[1.05,.8],[1.45,0],[2.65,-1],[3.3,.5],[4,0]];
 for(const side of['L','R']){const x=side==='L'?-43:43,rest=side==='L'?-58:59;c.channels[side]=[[0,rest,124,0],[.45,x*1.12,138,0],[1.14,x,162,0],[2.4,x,162,0],[2.65,x*1.05,159,0],[3.5,rest,126,0],[4,rest,124,0]]}
 c.beats=[[0,'prepare'],[.45,'lower with control'],[1.14,'seat contact'],[1.34,'settle'],[2.4,'prepare to stand'],[2.95,'push through feet'],[4,'standing']];
 c.notes='A front-view sit with feet planted, knees under hips, projected thighs and a dedicated seated garment. Prepare, lower, contact, settle; reverse the weight transfer to stand. No stretched standing shorts or wide knee split.';
}
