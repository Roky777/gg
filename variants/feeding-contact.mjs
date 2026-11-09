import{anchor}from'../animation-studio/prop-renderer.mjs';
/** Project the visible painted lips, including object-fit letterboxing. */
export class FeedingContact{
 constructor(player,avatar,target){Object.assign(this,{player,avatar,target});this.dirty=true;this.observer=new ResizeObserver(()=>this.dirty=true);this.observer.observe(avatar);}
 update(rendered){
  const canvas=this.player.director.canvas;if(!canvas||!this.player.scene)return;
  if(this.dirty||!this.metrics){const b=canvas.getBoundingClientRect(),a=this.avatar.getBoundingClientRect(),scale=Math.min(b.width/canvas.width,b.height/canvas.height);this.metrics={b,a,w:canvas.width*scale,h:canvas.height*scale};this.dirty=false;}
  const mouth=anchor(rendered,'Mouth_O',null)??anchor(rendered,'Mouth_Smile',null)??anchor(rendered,'Mouth_Teeth',null)??anchor(rendered,'Mouth_Happy',null);if(!mouth)return;
  const{b,a,w,h}=this.metrics,camera=this.player.director.rig.instance.renderer.camera,vw=camera.viewportWidth,vh=camera.viewportHeight,p=camera.position;
  const x=b.left+(b.width-w)/2+(mouth[0]-p.x+vw/2)/vw*w,y=b.top+(b.height-h)/2+(p.y+vh/2-mouth[1])/vh*h;
  const size=Math.max(44,Math.min(68,w*.14));Object.assign(this.target.style,{inset:'auto',left:(x-a.left-size/2)+'px',top:(y-a.top-size/2)+'px',width:size+'px',height:size+'px'});this.target.dataset.contact='painted-lips';
 }
 destroy(){this.observer.disconnect();}
}
