// A short, cancellable demonstration. It never submits an answer or captures input.
export class ConnectionGuide {
 constructor(focus){
  this.focus=focus;this.round=focus.round;this.animations=[];
  this.element=document.createElement('div');this.element.className='connection-guide';this.element.hidden=true;this.element.setAttribute('aria-hidden','true');
  this.element.innerHTML='<svg><path/></svg><img class="connection-guide-hand" src="assets/art/toy-board/connection-hand-play.webp" alt="" draggable="false">';
  this.round.body.append(this.element);
  for(const event of ['pointerdown','keydown'])this.round.listen(this.round.element,event,()=>{this.stop();this.schedule(9000);});
  this.round.listen(window,'resize',()=>{this.stop();this.schedule(6500);});
  this.round.listen(focus.motion,'change',()=>this.stop());
 }
 schedule(delay=6500){clearTimeout(this.timer);if(!this.round.active()||this.round.isPaused())return;this.timer=setTimeout(()=>this.show(),delay);}
 show(){
  this.stop();if(!this.round.active()||this.round.isPaused()||this.round.connections?.drag)return;
  const f=this.focus,source=f.current,target=f.choices.find(b=>!b.disabled&&b.dataset.target===source.dataset.source);if(!target)return;
  const box=this.round.body.getBoundingClientRect(),a=source.getBoundingClientRect(),b=target.getBoundingClientRect();
  const x1=a.right-box.left,y1=a.y+a.height/2-box.y,x2=b.left-box.left,y2=b.y+b.height/2-box.y,curve=Math.max(18,(x2-x1)*.42);
  const svg=this.element.querySelector('svg'),path=svg.firstElementChild,hand=this.element.querySelector('img');
  svg.setAttribute('viewBox',`0 0 ${box.width} ${box.height}`);path.setAttribute('d',`M${x1} ${y1} C${x1+curve} ${y1},${x2-curve} ${y2},${x2} ${y2}`);
  this.element.hidden=false;const size=hand.getBoundingClientRect().width,at=(x,y)=>`translate(${x-size*.15}px,${y-size*.17}px)`;
  hand.style.transform=at(x1,y1);svg.style.display=f.motion.matches?'none':'';
  if(f.motion.matches){this.end=setTimeout(()=>this.stop(),1600);return;}
  const duration=2200,length=path.getTotalLength(),frames=[];
  for(let i=0;i<=30;i++){const t=i/30,progress=Math.max(0,Math.min(1,(t-.2)/.58)),eased=progress*progress*(3-2*progress),p=path.getPointAtLength(length*eased);frames.push({offset:t,transform:at(p.x,p.y),opacity:t<.08?t/.08:t>.92?(1-t)/.08:1});}
  this.animations.push(hand.animate(frames,{duration,fill:'both'}),path.animate([{strokeDashoffset:length,opacity:0},{strokeDashoffset:length,opacity:0,offset:.2},{strokeDashoffset:0,opacity:.7,offset:.78},{opacity:0}],{duration,fill:'both'}));
  this.end=setTimeout(()=>this.stop(),duration);
 }
 stop(){clearTimeout(this.timer);clearTimeout(this.end);for(const a of this.animations)a.cancel();this.animations=[];this.element.hidden=true;}
 destroy(){this.stop();this.element.remove();}
}
