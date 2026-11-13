// Hand tutorial for boards that had none (Build the Picture, Find 3 Differences, Sticker Studio).
// Same hand art and dotted path as the connection guide. It only demonstrates: it never answers,
// never captures input, stops the moment the child touches the board and comes back when the
// child is idle again. pair() returns {from,to} (carry a piece) or {to,tap:true} (tap a spot).
const HAND='assets/art/toy-board/connection-hand-play.webp';
export class HandGuide{
 constructor({root,pair,active=()=>true,paused=()=>false,first=1400,again=12000,afterTouch=9000,repeats=2}){
  Object.assign(this,{root,pair,active,paused,again,afterTouch,repeats});this.shows=0;this.animations=[];this.timers=new Set();
  this.reduced=matchMedia('(prefers-reduced-motion: reduce)');
  this.element=document.createElement('div');this.element.className='hand-guide';this.element.hidden=true;this.element.setAttribute('aria-hidden','true');
  this.element.innerHTML=`<svg><path/></svg><span class="hand-guide-ring"></span><img class="hand-guide-hand" src="${HAND}" alt="" draggable="false">`;
  root.append(this.element);
  this.onTouch=()=>{this.stop();this.shows=0;this.schedule(this.afterTouch);};this.onResize=()=>{this.stop();this.schedule(4000);};
  root.addEventListener('pointerdown',this.onTouch,true);addEventListener('keydown',this.onTouch);addEventListener('resize',this.onResize);
  this.schedule(first);
 }
 later(fn,ms){const t=setTimeout(()=>{this.timers.delete(t);fn();},ms);this.timers.add(t);return t;}
 schedule(delay=this.again){clearTimeout(this.timer);if(this.destroyed)return;this.timer=setTimeout(()=>this.show(),delay);}
 show(){
  this.stop();if(this.destroyed||!this.active())return;
  if(this.paused()){this.schedule(1500);return;}/* wait until the game is playing again */
  if(this.shows>=this.repeats)return;const p=this.pair();if(!p?.to)return;this.shows++;
  const box=this.root.getBoundingClientRect(),c=e=>{const r=e.getBoundingClientRect();return[r.x+r.width/2-box.x,r.y+r.height/2-box.y];};
  const [x2,y2]=c(p.to),[x1,y1]=p.from?c(p.from):[x2+box.width*.12,y2+box.height*.18];
  const svg=this.element.querySelector('svg'),path=svg.firstElementChild,hand=this.element.querySelector('img'),ring=this.element.querySelector('span');
  svg.setAttribute('viewBox',`0 0 ${box.width} ${box.height}`);const bend=Math.max(20,Math.hypot(x2-x1,y2-y1)*.25);
  path.setAttribute('d',`M${x1} ${y1} Q${(x1+x2)/2} ${Math.min(y1,y2)-bend} ${x2} ${y2}`);svg.style.display=p.tap||this.reduced.matches?'none':'';
  this.element.hidden=false;const size=hand.getBoundingClientRect().width,at=(x,y,s=1)=>`translate(${x-size*.15}px,${y-size*.17}px) scale(${s})`;
  ring.style.left=x2+'px';ring.style.top=y2+'px';
  if(this.reduced.matches){hand.style.transform=at(x2,y2);this.end=this.later(()=>this.stop(),1600);return;}
  const duration=p.tap?2000:2600,length=path.getTotalLength(),frames=[];
  if(p.tap){/* glide in, two taps on the spot */
   for(const [o,x,y,s,a] of [[0,x1,y1,1,0],[.12,x1,y1,1,1],[.4,x2,y2,1,1],[.48,x2,y2,.86,1],[.56,x2,y2,1,1],[.66,x2,y2,.86,1],[.74,x2,y2,1,1],[.9,x2,y2,1,1],[1,x2,y2,1,0]])frames.push({offset:o,transform:at(x,y,s),opacity:a});
   this.animations.push(ring.animate([{opacity:0,scale:.3},{opacity:0,scale:.3,offset:.47},{opacity:1,scale:.6,offset:.5},{opacity:0,scale:1.6,offset:.64},{opacity:1,scale:.6,offset:.67},{opacity:0,scale:1.6,offset:.82},{opacity:0}],{duration,fill:'both'}));
  }else{/* press on the piece, carry it along the dotted path, press on its place */
   for(let i=0;i<=32;i++){const t=i/32,q=Math.max(0,Math.min(1,(t-.22)/.56)),e=q*q*(3-2*q),pt=path.getPointAtLength(length*e),press=(t>.12&&t<.2)||(t>.8&&t<.88)?.88:1;frames.push({offset:t,transform:at(pt.x,pt.y,press),opacity:t<.08?t/.08:t>.94?(1-t)/.06:1});}
   this.animations.push(path.animate([{strokeDashoffset:length,opacity:0},{strokeDashoffset:length,opacity:0,offset:.22},{strokeDashoffset:0,opacity:.75,offset:.78},{opacity:0}],{duration,fill:'both'}),
    ring.animate([{opacity:0,scale:.3},{opacity:0,scale:.3,offset:.8},{opacity:1,scale:.6,offset:.83},{opacity:0,scale:1.6,offset:.98},{opacity:0}],{duration,fill:'both'}));
  }
  this.animations.push(hand.animate(frames,{duration,fill:'both'}));
  const watch=setInterval(()=>{if(this.paused()||!this.active()){clearInterval(watch);this.stop();this.schedule(1500);}},250);this.watch=watch;
  this.end=this.later(()=>{this.stop();this.schedule();},duration);
 }
 stop(){clearTimeout(this.timer);clearInterval(this.watch);for(const t of this.timers)clearTimeout(t);this.timers.clear();for(const a of this.animations)a.cancel();this.animations=[];this.element.hidden=true;}
 destroy(){this.destroyed=true;this.stop();this.root.removeEventListener('pointerdown',this.onTouch,true);removeEventListener('keydown',this.onTouch);removeEventListener('resize',this.onResize);this.element.remove();}
}
