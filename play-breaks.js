import {InteractiveBreak} from './activity-rounds.js?v=soil-anchor-55';
/** Short, optional play between completed learning boards. */
export const FUN_ACTIVITIES={
 'wash-toy':{title:'Wash the Muddy Toy',rule:'Rub off the mud, then swipe to rinse!',intro:'टॉय को रब करके साफ करो। फिर साबुन हटा दो!',duration:35000,images:['counting/toy-car.png','counting/teddy.png','counting/duckling.png']},
 'grow-garden':{title:'Grow a Tiny Garden',rule:'Drag the can to a pot. Hold to water!',intro:'पानी का कैन गमले तक लाओ। थोड़ा रुको, फूल उगेगा!',duration:30000,images:['fun/flower-pot-v1.png','assembly/watering-can.png','counting/flower.png']},
 'roll-ball':{title:'Roll the Ball',rule:'Pull the ball back, then let go!',intro:'बॉल को पीछे खींचो, फिर छोड़ दो। बास्केट में डालो!',duration:35000,images:['counting/ball.png','fun/basket-v1.png']},
 'magic-reveal':{title:'Magic Colour Reveal',rule:'Swipe to bring the colours back!',intro:'उंगली घुमाओ, और तस्वीर के रंग वापस लाओ!',duration:30000,images:['counting/butterfly.png','counting/fish.png','assembly/robot.png','objects/rainbow.png']},
 'drum-duet':{title:'Sparky’s Drum Duet',rule:'Listen, then tap the drums!',intro:'मेरी बीट सुनो। अब तुम ड्रम बजाओ!',duration:30000,images:['assembly/drum.png']},
 'balloon-pop':{title:'Balloon Pop',rule:'Tap the balloons!',intro:'चलो, गुब्बारों पर टैप करके उन्हें पॉप करो!',duration:12000,images:['objects/balloon.png']},
 'jelly-wiggle':{title:'Jelly Wiggle',rule:'Tap a jelly. Watch it wiggle!',intro:'जेली पर टैप करो, और उसे हिलते हुए देखो!',duration:12000,images:['fun/jelly.png']}
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
export function createPlayBreak(options){return ['balloon-pop','jelly-wiggle'].includes(options.picture.topic)?new PlayBreak(options):new InteractiveBreak(options);}
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
