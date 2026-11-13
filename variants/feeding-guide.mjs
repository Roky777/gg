/** A brief asset-based demonstration. It never feeds food or changes progress. */
export class FeedingGuide{
 constructor(feeding){this.feeding=feeding;this.hand=new Image();this.hand.src='assets/art/toy-board/connection-hand-play.webp';this.hand.alt='';this.hand.className='feeding-demo-hand';this.hand.hidden=true;feeding.room.append(this.hand);}
 show(foodButton,method){
  this.stop();const f=this.feeding;if(f.pending||f.round.reduced||!f.round.active()||f.round.drag)return;
  const tool=f.tools.get(method),nodes=tool?[tool,foodButton,f.target]:[foodButton,f.target];if(nodes.some(n=>!n))return;
  const points=nodes.map(n=>{const b=n.getBoundingClientRect();return{x:b.left+b.width/2,y:b.top+b.height/2}}),frames=[{left:points[0].x+'px',top:points[0].y+'px',opacity:0,offset:0}];
  points.forEach((p,i)=>frames.push({left:p.x+'px',top:p.y+'px',opacity:.9,offset:.12+i*.7/(points.length-1)}));const last=points.at(-1);frames.push({left:last.x+'px',top:last.y+'px',opacity:0,offset:1});this.hand.hidden=false;this.motion=this.hand.animate(frames,{duration:2800,easing:'ease-in-out',fill:'both'});this.timer=setTimeout(()=>this.stop(),2850);
 }
 stop(){clearTimeout(this.timer);this.motion?.cancel();this.motion=null;this.hand.hidden=true;}
 destroy(){this.stop();this.hand.remove();}
}
