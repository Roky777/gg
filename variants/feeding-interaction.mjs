import{springStep}from'../animation-studio/spring-response.mjs';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function foodFollowTarget(x,y,mouth,stage,food){const mx=mouth.left+mouth.width/2,my=mouth.top+mouth.height/2,d=Math.hypot((x-mx)/(mouth.width*.75),(y-my)/(mouth.height*.75)),canEat=food?.reaction?food.reaction!=='no':food?.category==='everyday'||food?.index<14;return{gaze:[clamp((x-stage.left-stage.width/2)/(stage.width*.4),-.8,.8),clamp((stage.height*.4-y+stage.top)/(stage.height*.45),-.6,.45)],ready:canEat?clamp((1.8-d)/.9,0,1):0};}
// Exact damped oscillator solution: pointer event frequency must not affect motion.
// Eyes lead; the head follows with a very small, heavily damped settle. The jaw
// is critically damped so it never bounces through a food/contact pose.
function spring(value,velocity,target,dt,hz,damping,lo,hi){
 const[next,speed]=springStep(value,velocity,target,dt,hz,damping);
 const bounded=clamp(next,lo,hi);
 return[bounded,bounded!==next?0:clamp(speed,-80,80)];
}
export function resetFoodFollow(state){state.gaze=[0,0];state.headGaze=[0,0];state.ready=0;state.velocity={gaze:[0,0],head:[0,0],ready:0};state.active=false;return state;}
export function advanceFoodFollow(state,target,dt){
 if(!Number.isFinite(dt)||dt>.25)return resetFoodFollow(state);
 if(dt<=0)return state;
 state.headGaze??=state.gaze.slice();state.velocity??={gaze:[0,0],head:[0,0],ready:0};
 for(let i=0;i<2;i++){
  const lo=i?-.6:-.8,hi=i?.45:.8,to=clamp(target.gaze[i],lo,hi);
  [state.gaze[i],state.velocity.gaze[i]]=spring(state.gaze[i],state.velocity.gaze[i],to,dt,7,1,lo,hi);
  [state.headGaze[i],state.velocity.head[i]]=spring(state.headGaze[i],state.velocity.head[i],to,dt,3,.9,lo,hi);
 }
 [state.ready,state.velocity.ready]=spring(state.ready,state.velocity.ready,clamp(target.ready,0,1),dt,5,1,0,1);
 return state;
}
