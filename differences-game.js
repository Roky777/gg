/** Two complete, pre-rendered pictures; three unique item changes per board. */
export function createDifferenceBoard(pair,{swap=false}={}){
 const images=swap?[...pair.images].reverse():[...pair.images];
 const regions=pair.regions.map(region=>({...region,sides:swap?[...region.sides].reverse():[...region.sides]}));
 const assets=[...images,...regions.filter(r=>r.changed).flatMap(r=>r.sides.map(s=>s.highlight))].filter(Boolean);
 return {id:'differences:'+pair.id,topic:'differences',pair:{...pair,images,regions},cards:assets.map(image=>({image,label:pair.name,kind:'difference-art'})),targets:[],rule:'दोनों तस्वीरों में तीन अंतर ढूँढो।',intro:'दोनों तस्वीरों को ध्यान से देखो। जो चीज़ अलग है, उस पर टैप करो। किसी भी तस्वीर पर टैप कर सकते हो।',learn:`वाह! ${pair.name} की तस्वीरों में तीनों अंतर मिल गए!`};
}
export class DifferenceProgress{
 constructor(regions){this.changed=new Set(regions.filter(r=>r.changed).map(r=>r.id));this.found=new Set();}
 find(id){if(!this.changed.has(id)||this.found.has(id))return false;this.found.add(id);return true;}
 get complete(){return this.found.size===this.changed.size;}
}
export class DifferenceRound{
 constructor({element,picture,onMatch=()=>{},onWrong=()=>{},onComplete=()=>{},onActivity=()=>{},sound=()=>{},tell=()=>{},isPaused=()=>false}){
  Object.assign(this,{element,picture,onMatch,onWrong,onComplete,onActivity,sound,tell,isPaused});this.progress=new DifferenceProgress(picture.pair.regions);this.destroyed=false;this.buttons=[new Map(),new Map()];this.wraps=[];
  element.className='board differences-board';element.replaceChildren();element.setAttribute('aria-label',picture.intro);
  this.status=document.createElement('p');this.status.className='sr-only';this.status.setAttribute('role','status');this.status.setAttribute('aria-live','polite');this.status.textContent='0 of 3 differences found.';element.append(this.status);
  const gallery=document.createElement('div');gallery.className='difference-pictures';element.append(gallery);
  picture.pair.images.forEach((path,side)=>{
   const panel=document.createElement('section');panel.className='difference-panel';panel.setAttribute('aria-label',`${side===0?'Left':'Right'} picture: ${picture.pair.name}`);
   const wrap=document.createElement('div');wrap.className='difference-image-wrap';const photo=document.createElement('img');photo.className='difference-photo';photo.src='assets/art/'+path;photo.alt=picture.pair.name;photo.draggable=false;wrap.append(photo);panel.append(wrap);gallery.append(panel);this.wraps.push(wrap);
   picture.pair.regions.forEach((region,index)=>{
    const buttons=[region.sides[side].hit,...(region.sides[side].extraHits||[])].map(hit=>{const button=document.createElement('button');button.type='button';button.className='difference-object';this.placeElement(button,hit);button.setAttribute('aria-label',`${region.sides[side].name}. Compare this item with the other picture.`);button.addEventListener('click',()=>this.find(region.id));wrap.append(button);return button;});this.buttons[side].set(region.id,buttons);
   });
  });
 }
 placeElement(element,box){Object.assign(element.style,{left:box.x*100+'%',top:box.y*100+'%',width:box.w*100+'%',height:box.h*100+'%'});}
 allowed(){return !this.destroyed&&!this.isPaused()&&!this.progress.complete;}
 find(id){
  if(!this.allowed())return false;this.onActivity();
  if(!this.progress.find(id)){if(!this.progress.found.has(id)){this.onWrong();this.sound('tap');this.tell('दोनों तस्वीरों को ध्यान से देखो।',{speak:false});}return false;}
  const region=this.picture.pair.regions.find(r=>r.id===id);
  for(let side=0;side<2;side++){
   for(const button of this.buttons[side].get(id)){button.disabled=true;button.classList.add('found');button.setAttribute('aria-label',`${region.sides[side].name}: difference found!`);}
   const ns='http://www.w3.org/2000/svg',glow=document.createElementNS(ns,'svg');glow.setAttribute('class','difference-found-outline');glow.setAttribute('viewBox','0 0 900 1200');glow.setAttribute('preserveAspectRatio','none');glow.setAttribute('aria-hidden','true');
   const outline=region.sides[side].outline;
   if(outline){const shape=document.createElementNS(ns,'path');for(const [key,value]of Object.entries({d:outline,fill:'none',stroke:'#ed352f','stroke-width':2.5,'stroke-linejoin':'round','stroke-linecap':'round','vector-effect':'non-scaling-stroke'}))shape.setAttribute(key,String(value));glow.append(shape);this.wraps[side].append(glow);}

  }
  this.status.textContent=`${this.progress.found.size} of 3 differences found.`;
  if(this.progress.complete){this.element.classList.add('differences-complete');for(const buttons of this.buttons)for(const group of buttons.values())for(const button of group)button.disabled=true;this.onComplete();}
  else{this.tell('सही अंतर मिला! ✓',{speak:false});this.onMatch();}
  return true;
 }
 cancelDrag(){} // Shared round lifecycle; this mode uses taps, clicks and keyboard.
 destroy(){this.destroyed=true;}
}
