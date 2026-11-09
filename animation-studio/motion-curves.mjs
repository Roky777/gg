// Shape-preserving cubic curves: pass through the acting poses without
// stopping at every intermediate key. Flat holds and endpoints stay at rest.
// Cached by immutable key-array identity so sampling does not rebuild tangents.
const cache=new WeakMap();
function prepare(keys){let curve=cache.get(keys);if(curve)return curve;const times=keys.map(k=>k[0]),values=keys.map(k=>k.slice(1)),n=keys.length,slopes=values.map(v=>v.map(()=>0));
 for(let j=0;j<values[0].length;j++)for(let i=1;i<n-1;i++){const h0=times[i]-times[i-1],h1=times[i+1]-times[i],a=(values[i][j]-values[i-1][j])/h0,b=(values[i+1][j]-values[i][j])/h1;if(a*b>0){const w0=2*h1+h0,w1=h1+2*h0;slopes[i][j]=(w0+w1)/(w0/a+w1/b);}}
 curve={times,values,slopes};cache.set(keys,curve);return curve;
}
export function sampleNaturalKeys(keys,t){if(t<=keys[0][0]||keys.length===1)return keys[0].slice(1);if(t>=keys.at(-1)[0])return keys.at(-1).slice(1);const{times,values,slopes}=prepare(keys);let i=0;while(t>times[i+1])i++;const h=times[i+1]-times[i],u=(t-times[i])/h,u2=u*u,u3=u2*u;return values[i].map((v,j)=>{const b=values[i+1][j],p=(2*u3-3*u2+1)*v+(u3-2*u2+u)*h*slopes[i][j]+(-2*u3+3*u2)*b+(u3-u2)*h*slopes[i+1][j];return Math.max(Math.min(v,b),Math.min(Math.max(v,b),p));});}
export function secondaryTime(t,duration,lag=0){const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};return Math.max(0,Math.min(duration,t-lag*smooth(t/.24)*smooth((duration-t)/.36)));}
export function sampleGazeKeys(keys,t){if(t<=keys[0][0]||keys.length===1)return keys[0].slice(1);for(let i=1;i<keys.length;i++){const a=keys[i-1],b=keys[i];if(t<=b[0]){const start=Math.max(a[0],b[0]-.13),q=Math.max(0,Math.min(1,(t-start)/(b[0]-start))),u=q*q*(3-2*q);return a.slice(1).map((v,j)=>v+(b[j+1]-v)*u)}}return keys.at(-1).slice(1);}
// Intent gaze acquires the next target near the start of a travelling beat,
// then holds. Equal adjacent keys retain the explicitly authored quiet hold.
export function sampleIntentGazeKeys(keys,t){
 if(t<=keys[0][0]||keys.length===1)return keys[0].slice(1);
 for(let i=1;i<keys.length;i++){const a=keys[i-1],b=keys[i];if(t<=b[0]){const span=b[0]-a[0],start=a[0]+Math.min(.025,span*.1),end=a[0]+Math.min(.14,span),q=Math.max(0,Math.min(1,(t-start)/Math.max(.001,end-start))),u=q*q*(3-2*q);return a.slice(1).map((v,j)=>v+(b[j+1]-v)*u);}}
 return keys.at(-1).slice(1);
}
