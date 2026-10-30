/** Short optional play between completed learning boards. */
export class BreakSchedule{
 constructor(every=4){this.every=every;this.nextAt=every;this.index=0;}
 take(completed){if(completed<this.nextAt)return null;this.nextAt=completed+this.every;return ['balloon-pop','jelly-wiggle'][this.index++%2];}
}
export function makeFunBoard(kind){const balloon=kind==='balloon-pop';return {id:'play-break:'+kind,topic:kind,fun:true,cards:[{image:balloon?'objects/balloon.png':'fun/jelly.png'}],title:balloon?'Balloon Pop':'Jelly Wiggle',rule:balloon?'Tap the balloons!':'Tap a jelly. Watch it wiggle!',intro:balloon?'गुब्बारों पर टैप करके उन्हें फोड़ो।':'जेली पर टैप करो। देखो, कैसे हिलती है!'};}
export class PlayBreak{
 constructor({element,picture,reduced=false,onPlay=()=>{},onComplete=()=>{},onNext=()=>{},isPaused=()=>false,raf=fn=>requestAnimationFrame(fn),caf=id=>cancelAnimationFrame(id)}){
  Object.assign(this,{element,picture,reduced,onPlay,onComplete,onNext,isPaused,raf,caf});this.elapsed=0;this.last=null;this.destroyed=false;this.finished=false;this.seen=new Set();this.taps=0;this.animations=new Map();
  element.className='board fun-board '+picture.topic;element.replaceChildren();element.setAttribute('aria-label',picture.title+'. '+picture.rule);
  const heading=document.createElement('header');heading.className='fun-heading';const title=document.createElement('h2');title.textContent=picture.title;heading.append(title);const hint=document.createElement('p');hint.textContent=picture.rule;heading.append(hint);element.append(heading);
  const toys=document.createElement('div');toys.className='fun-toys';element.append(toys);this.buttons=[];
  for(let i=0;i<6;i++){
   const toy=document.createElement('button');toy.type='button';toy.className='fun-toy';toy.setAttribute('aria-label',(picture.topic==='balloon-pop'?'Pop balloon ':'Wiggle jelly ')+(i+1));toy.style.setProperty('--hue',i*57+'deg');toy.style.setProperty('--delay',-(i*.37)+'s');
   const art=document.createElement('img');art.src='assets/art/'+picture.cards[0].image;art.alt='';art.draggable=false;toy.append(art);toys.append(toy);this.buttons.push(toy);toy.addEventListener('click',()=>this.play(i));
  }
  this.frame=this.raf(t=>this.tick(t));
 }
 play(index){
  if(this.destroyed||this.finished||this.isPaused()||index<0||index>=6)return;
  const toy=this.buttons[index],balloon=this.picture.topic==='balloon-pop';if(balloon&&this.seen.has(index))return;
  this.seen.add(index);this.taps++;
  if(balloon){toy.disabled=true;toy.classList.add('popped');toy.setAttribute('aria-label','Balloon popped');
   if(!this.reduced)for(let n=0;n<8;n++){const spark=document.createElement('span');spark.className='pop-spark';spark.setAttribute('aria-hidden','true');spark.style.setProperty('--angle',n*45+'deg');toy.append(spark);}
  }else if(!this.reduced){const art=toy.querySelector('img');this.animations.get(index)?.cancel();this.animations.set(index,art.animate([{transform:'scale(1)'},{transform:'scale(1.2,.78) rotate(-5deg)',offset:.18},{transform:'scale(.88,1.13) rotate(4deg)',offset:.4},{transform:'scale(1.08,.94) rotate(-2deg)',offset:.65},{transform:'scale(1)'}],{duration:720,easing:'ease-out'}));}
  this.onPlay({index,taps:this.taps,kind:this.picture.topic});if(this.seen.size===6)this.complete();
 }
 complete(){if(this.finished||this.destroyed)return;this.finished=true;this.finishedAt=this.elapsed;this.onComplete();}
 tick(time){
  if(this.destroyed)return;const delta=this.last===null?0:Math.max(0,Math.min(100,time-this.last));this.last=time;const blocked=this.isPaused();
  if(blocked!==this.blocked){this.blocked=blocked;for(const animation of this.element.getAnimations?.({subtree:true})||[])blocked?animation.pause():animation.play();}
  if(!blocked){this.elapsed+=delta;if(!this.finished&&this.elapsed>=12000)this.complete();if(this.finished&&this.elapsed-this.finishedAt>=1500){this.destroyed=true;this.onNext();return;}}
  this.frame=this.raf(t=>this.tick(t));
 }
 cancelDrag(){} // Shared navigation/rotation contract; play breaks use taps.
 destroy(){this.destroyed=true;this.caf(this.frame);for(const a of this.animations.values())a.cancel();this.animations.clear();}
}
