// Monotone Hermite time mapping: source time keeps moving at intermediate keys.
// Endpoints ease to rest; interior slopes cannot overshoot or reverse time.
export function sampleMotionClock(keys,time){
 if(time<=keys[0][0])return keys[0][1];if(time>=keys.at(-1)[0])return keys.at(-1)[1];
 const d=keys.slice(1).map((b,i)=>(b[1]-keys[i][1])/(b[0]-keys[i][0])),m=keys.map((_,i)=>i===0||i===keys.length-1?0:d[i-1]*d[i]<=0?0:2*d[i-1]*d[i]/(d[i-1]+d[i]));
 for(let i=0;i<d.length;i++){if(!d[i]){m[i]=m[i+1]=0;continue}const a=m[i]/d[i],b=m[i+1]/d[i],n=Math.hypot(a,b);if(n>3){m[i]=3*a/n*d[i];m[i+1]=3*b/n*d[i]}}
 let i=0;while(time>keys[i+1][0])i++;const a=keys[i],b=keys[i+1],h=b[0]-a[0],u=(time-a[0])/h,u2=u*u,u3=u2*u;
 return(2*u3-3*u2+1)*a[1]+(u3-2*u2+u)*h*m[i]+(-2*u3+3*u2)*b[1]+(u3-u2)*h*m[i+1];
}
