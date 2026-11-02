/** Small interaction models shared by the activities and their tests. */
export const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export class ScratchCoverage{
 constructor(points,radius=.075){this.points=points.map(([x,y])=>({x,y,clear:false}));this.radius=radius;this.cleared=0;}
 stroke(a,b=a){const dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy;let changed=0;
  for(const p of this.points){if(p.clear)continue;const t=den?clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/den,0,1):0;
   if(Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)<=this.radius){p.clear=true;this.cleared++;changed++;}}
  return changed;
 }
 get progress(){return this.points.length?this.cleared/this.points.length:0;}
}
export class GardenGrowth{
 constructor(count=3,holdMs=950){this.values=Array(count).fill(0);this.holdMs=holdMs;}
 water(index,ms){if(!Number.isInteger(index)||index<0||index>=this.values.length)return false;const before=this.values[index];this.values[index]=clamp(before+Math.max(0,ms)/this.holdMs,0,1);return before<1&&this.values[index]===1;}
 get complete(){return this.values.every(v=>v===1);}
}
export class RollPhysics{
 constructor(){this.goal={x:820,y:350};this.reset();}
 reset(){this.x=150;this.y=365;this.vx=0;this.vy=0;this.flight=false;this.age=0;this.settled=0;}
 launch(pull={x:65,y:455}){this.reset();this.vx=clamp((150-pull.x)*6,220,680);this.vy=clamp((365-pull.y)*5,-550,-270);this.flight=true;}
 step(seconds){if(!this.flight)return null;const dt=clamp(seconds,0,.035);this.age+=dt;this.vy+=700*dt;this.x+=this.vx*dt;this.y+=this.vy*dt;
  // A wide basket accepts the ball's centre in its opening, not a tiny pixel target.
  if(Math.abs(this.x-this.goal.x)<76&&this.y>this.goal.y-105&&this.y<this.goal.y+50){this.flight=false;return 'caught';}
  if(this.y>422){this.y=422;this.vy=-Math.abs(this.vy)*.35;this.vx*=.75;if(Math.abs(this.vy)<70)this.settled+=dt;}
  if(this.x>1050||this.age>3.5||this.settled>.3){this.flight=false;return 'retry';}return null;
 }
}
export class RhythmPattern{
 constructor(sequence=[0,2]){this.sequence=sequence;this.at=0;}
 tap(index){if(index===this.sequence[this.at])this.at++;else this.at=index===this.sequence[0]?1:0;return this.at===this.sequence.length;}
}
