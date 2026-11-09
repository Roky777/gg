// Analytic scalar damped oscillator. Callers own suspension resets and bounds.
// Values are relative angles or offsets, never quaternion components.
export function springStep(value,velocity,target,dt,frequency,damping){
 if(dt<=0)return[value,velocity];
 const w=2*Math.PI*frequency,x=value-target;
 if(Math.abs(damping-1)<1e-6){const e=Math.exp(-w*dt),b=velocity+w*x;return[target+(x+b*dt)*e,(velocity-w*b*dt)*e];}
 if(damping>1){const q=Math.sqrt(damping*damping-1),a=-w*(damping-q),b=-w*(damping+q),c=(velocity-b*x)/(a-b),d=x-c,ea=Math.exp(a*dt),eb=Math.exp(b*dt);return[target+c*ea+d*eb,a*c*ea+b*d*eb];}
 const e=Math.exp(-damping*w*dt),wd=w*Math.sqrt(1-damping*damping),b=(velocity+damping*w*x)/wd,c=Math.cos(wd*dt),s=Math.sin(wd*dt);
 return[target+e*(x*c+b*s),e*((-x*wd*s+b*wd*c)-damping*w*(x*c+b*s))];
}
