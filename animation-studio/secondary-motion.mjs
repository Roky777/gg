import{sampleNaturalKeys}from'./motion-curves.mjs';
import{springStep}from'./spring-response.mjs';
// Bake a bounded fixed-rate follower once per immutable track. Sampling depends
// only on clip time, so slow motion, backwards scrubbing, scene switches and
// dropped render frames cannot retain stale velocities or change the acting.
const cache=new WeakMap(),RATE=240;
function bake(keys,hz,damping){
 let variants=cache.get(keys);if(!variants){variants=new Map();cache.set(keys,variants);}
 const id=hz+':'+damping;if(variants.has(id))return variants.get(id);
 const end=keys.at(-1)[0],count=Math.ceil(end*RATE),values=[keys[0].slice(1)],velocity=values[0].map(()=>0),velocities=[velocity.slice()];
 for(let i=1;i<=count;i++){const target=sampleNaturalKeys(keys,(i-.5)/RATE),previous=values[i-1],next=[];for(let j=0;j<previous.length;j++)[next[j],velocity[j]]=springStep(previous[j],velocity[j],target[j],1/RATE,hz,damping);values.push(next);velocities.push(velocity.slice());}
 const curve={values,velocities};variants.set(id,curve);return curve;
}
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
export function sampleSecondaryKeys(keys,t,duration,{hz=4,damping=.9,limit=.6,amount=.6}={}){
 const primary=sampleNaturalKeys(keys,t);if(keys.length<2||t<=0||t>=duration)return primary;
 const{values,velocities}=bake(keys,hz,damping),u=Math.max(0,Math.min(values.length-1,t*RATE)),i=Math.floor(u),q=u-i,k=Math.min(i+1,values.length-1),a=values[i],b=values[k],q2=q*q,q3=q2*q;
 const envelope=smooth(t/.12)*smooth((duration-t)/.28);
 return primary.map((v,j)=>{const follower=(2*q3-3*q2+1)*a[j]+(q3-2*q2+q)*velocities[i][j]/RATE+(-2*q3+3*q2)*b[j]+(q3-q2)*velocities[k][j]/RATE,lag=follower-v;return v+Math.tanh(lag/limit)*limit*amount*envelope;});
}
