import {InteractiveBreak} from './activity-rounds.js?v=garden-56';
/** Short, optional play between completed learning boards. */
export const FUN_ACTIVITIES={
 'wash-toy':{title:'Wash the Muddy Toy',rule:'Rub off the mud, then swipe to rinse!',intro:'टॉय को रब करके साफ करो। फिर साबुन हटा दो!',duration:35000,images:['counting/toy-car.webp','counting/teddy.webp','counting/duckling.webp']},
 'grow-garden':{title:'Grow a Tiny Garden',rule:'Drag the can to a pot. Hold to water!',intro:'पानी का कैन गमले तक लाओ। थोड़ा रुको, फूल उगेगा!',duration:30000,images:['fun/flower-pot-v1.webp','assembly/watering-can.webp','counting/flower.webp']},
 'roll-ball':{title:'Roll the Ball',rule:'Pull the ball back, then let go!',intro:'बॉल को पीछे खींचो, फिर छोड़ दो। बास्केट में डालो!',duration:35000,images:['counting/ball.webp','fun/basket-v1.webp']},
 'magic-reveal':{title:'Magic Colour Reveal',rule:'Swipe to bring the colours back!',intro:'उंगली घुमाओ, और तस्वीर के रंग वापस लाओ!',duration:30000,images:['counting/butterfly.webp','counting/fish.webp','assembly/robot.webp','objects/rainbow.webp']},
 'drum-duet':{title:'Sparky’s Drum Duet',rule:'Listen, then tap the drums!',intro:'मेरी बीट सुनो। अब तुम ड्रम बजाओ!',duration:30000,images:['assembly/drum.webp']},
 'balloon-pop':{title:'Balloon Pop',rule:'Tap the balloons!',intro:'चलो, गुब्बारों पर टैप करके उन्हें पॉप करो!',duration:12000,images:['objects/balloon.webp']},
 'jelly-wiggle':{title:'Jelly Wiggle',rule:'Tap a jelly. Watch it wiggle!',intro:'जेली पर टैप करो, और उसे हिलते हुए देखो!',duration:12000,images:['fun/jelly.webp']}
};
export const FUN_KINDS=Object.keys(FUN_ACTIVITIES);
const shuffled=(items,random)=>{const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
export class BreakSchedule{
 constructor(every=4,random=Math.random){this.every=every;this.nextAt=every;this.index=0;this.random=random;this.last=null;this.bag=['wash-toy',...shuffled(FUN_KINDS.filter(k=>k!=='wash-toy'),random)];}
 take(completed){if(completed<this.nextAt)return null;this.nextAt=completed+this.every;
  if(!this.bag.length){this.bag=shuffled(FUN_KINDS,this.random);if(this.bag[0]===this.last)[this.bag[0],this.bag[1]]=[this.bag[1],this.bag[0]];}
  this.index++;return this.last=this.bag.shift();}
}
export function makeFunBoard(kind,random=Math.random){const config=FUN_ACTIVITIES[kind];if(!config)throw Error('Unknown activity: '+kind);let images=[...config.images];if(kind==='wash-toy'||kind==='magic-reveal')images=[images[Math.floor(random()*images.length)]];return{id:'play-break:'+kind,topic:kind,fun:true,cards:images.map(image=>({image})),...config};}
export function createPlayBreak(options){if(options.picture.topic==='balloon-pop'&&!options.reduced)return new BalloonRise(options);return ['balloon-pop','jelly-wiggle'].includes(options.picture.topic)?new PlayBreak(options):new InteractiveBreak(options);}
// Balloon colours that read cleanly on the pink source art (60-120deg turn it brown/olive).
const BALLOON_HUES=[0,20,40,140,180,220,260,300];
/**
 * Balloons float up from the bottom; tap to pop. Each pop bursts into confetti in
 * the balloon's colour; every fifth balloon is a sparkly star balloon with a bigger
 * burst. No misses or failure: unpopped balloons simply float away. Ends after
 * 12 pops or 25 s of active play, then a short celebration.
 */
export class BalloonRise{
 constructor({element,picture,onPlay=()=>{},onComplete=()=>{},onNext=()=>{},isPaused=()=>false,raf=fn=>requestAnimationFrame(fn),caf=id=>cancelAnimationFrame(id),random=Math.random}){
  Object.assign(this,{element,picture,onPlay,onComplete,onNext,isPaused,raf,caf,random});
  this.elapsed=0;this.last=null;this.destroyed=false;this.finished=false;this.popped=0;this.spawned=0;this.nextSpawn=150;this.goal=12;this.limit=25000;this.items=[];this.lastLane=-1;this.seen=new Set();
  element.className='board fun-board balloon-pop balloon-rise';element.replaceChildren();element.setAttribute('aria-label',picture.title+'. '+picture.rule);
  this.sky=document.createElement('div');this.sky.className='balloon-sky';element.append(this.sky);
  this.frame=this.raf(t=>this.tick(t));
 }
 spawn(){
  const lanes=6;let lane=Math.floor(this.random()*lanes);if(lane===this.lastLane)lane=(lane+1+Math.floor(this.random()*(lanes-1)))%lanes;this.lastLane=lane;
  const index=this.spawned++,star=index%5===4,hue=star?40:BALLOON_HUES[Math.floor(this.random()*BALLOON_HUES.length)];
  const button=document.createElement('button');button.type='button';button.className='balloon-up'+(star?' star-balloon':'');button.setAttribute('aria-label',star?'Pop the star balloon':'Pop the balloon');
  const art=document.createElement('img');art.src='assets/art/'+this.picture.cards[0].image;art.alt='';art.draggable=false;button.append(art);
  button.style.setProperty('--hue',hue+'deg');
  const item={button,index,star,hue,x:(lane+.5)/lanes+(this.random()-.5)*.06,y:1.15,speed:1/(5200+this.random()*1600),sway:.012+this.random()*.018,phase:this.random()*6.3,size:.82+this.random()*.28};
  button.style.setProperty('--size',item.size);
  const pop=e=>{e?.preventDefault?.();this.pop(item);};
  button.addEventListener('pointerdown',pop);button.addEventListener('click',pop);
  this.sky.append(button);this.items.push(item);this.place(item);
 }
 place(item){const w=this.sky.clientWidth||1,h=this.sky.clientHeight||1,x=item.x+Math.sin(this.elapsed/700+item.phase)*item.sway;item.button.style.transform=`translate(${(x*w).toFixed(1)}px,${(item.y*h).toFixed(1)}px) translate(-50%,-50%) rotate(${(Math.sin(this.elapsed/900+item.phase)*6).toFixed(1)}deg)`;}
 pop(item){
  if(this.destroyed||this.finished||item.popped||this.isPaused())return;
  item.popped=true;this.popped++;this.seen.add(item.index);item.button.disabled=true;item.button.classList.add('popped');
  const sky=this.sky.getBoundingClientRect?.(),b=item.button.getBoundingClientRect?.();
  this.burst(item,b&&sky?{x:b.left-sky.left+b.width/2,y:b.top-sky.top+b.height*.38}:{x:0,y:0});
  setTimeout(()=>item.button.remove(),260);
  const page=b&&typeof innerWidth==='number'?{x:(b.left+b.width/2)/innerWidth,y:(b.top+b.height/2)/innerHeight}:{};
  this.onPlay({index:item.index%6,taps:this.popped,kind:'balloon-pop',effect:'pop',...page});
  if(this.popped>=this.goal)this.complete();
 }
 burst(item,at){
  const layer=document.createElement('div');layer.className='balloon-burst'+(item.star?' star-burst':'');layer.style.left=at.x+'px';layer.style.top=at.y+'px';layer.style.setProperty('--hue',item.hue+'deg');
  const ring=document.createElement('span');ring.className='pop-ring';layer.append(ring);
  const pieces=item.star?18:11;
  for(let i=0;i<pieces;i++){const bit=document.createElement('span');const star=item.star&&i%2===0;bit.className=star?'pop-star':'pop-bit';const angle=i/pieces*Math.PI*2+this.random()*.4,dist=(item.star?70:48)+this.random()*30;bit.style.setProperty('--dx',(Math.cos(angle)*dist).toFixed(1)+'px');bit.style.setProperty('--dy',(Math.sin(angle)*dist).toFixed(1)+'px');bit.style.setProperty('--spin',Math.round(this.random()*540-270)+'deg');bit.style.animationDelay=(this.random()*40|0)+'ms';layer.append(bit);}
  this.sky.append(layer);setTimeout(()=>layer.remove(),item.star?1000:800);
 }
 complete(){if(this.finished||this.destroyed)return;this.finished=true;this.finishedAt=this.elapsed;this.element.classList.add('balloons-done');this.onComplete({played:this.popped>0,kind:'balloon-pop'});}
 tick(time){
  if(this.destroyed)return;const delta=this.last===null?0:Math.max(0,Math.min(100,time-this.last));this.last=time;const blocked=this.isPaused();
  if(blocked!==this.blocked){this.blocked=blocked;for(const animation of this.element.getAnimations?.({subtree:true})||[])blocked?animation.pause():animation.play();}
  if(!blocked){
   this.elapsed+=delta;
   if(!this.finished){this.nextSpawn-=delta;const live=this.items.filter(i=>!i.popped).length;if(this.nextSpawn<=0&&live<6){this.spawn();this.nextSpawn=650+this.random()*450;}if(this.elapsed>=this.limit)this.complete();}
   for(const item of this.items){if(item.popped)continue;item.y-=delta*item.speed*(this.finished?2.2:1);this.place(item);}
   this.items=this.items.filter(item=>{if(!item.popped&&item.y<-.4){item.button.remove();return false}return !item.popped||item.button.isConnected!==false});
   if(this.finished&&this.elapsed-this.finishedAt>=1800){this.destroyed=true;this.onNext();return;}
  }
  this.frame=this.raf(t=>this.tick(t));
 }
 cancelDrag(){}
 destroy(){this.destroyed=true;this.caf(this.frame);}
}
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
 complete(){if(this.finished||this.destroyed)return;this.finished=true;this.finishedAt=this.elapsed;this.onComplete({played:this.taps>0,kind:this.picture.topic});}
 tick(time){
  if(this.destroyed)return;const delta=this.last===null?0:Math.max(0,Math.min(100,time-this.last));this.last=time;const blocked=this.isPaused();
  if(blocked!==this.blocked){this.blocked=blocked;for(const animation of this.element.getAnimations?.({subtree:true})||[])blocked?animation.pause():animation.play();}
  if(!blocked){this.elapsed+=delta;if(!this.finished&&this.elapsed>=12000)this.complete();if(this.finished&&this.elapsed-this.finishedAt>=1500){this.destroyed=true;this.onNext();return;}}
  this.frame=this.raf(t=>this.tick(t));
 }
 cancelDrag(){} // Shared navigation/rotation contract; play breaks use taps.
 destroy(){this.destroyed=true;this.caf(this.frame);for(const a of this.animations.values())a.cancel();this.animations.clear();}
}
