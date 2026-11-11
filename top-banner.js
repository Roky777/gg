import { bubbleTitle } from './bubble-title.js?v=5';
/**
 * Top banner (new_banner_items): the wavy coral carnival ribbon with the activity title in navy
 * bubble lettering, a glossy star sticker with golden burst rays on each side, and what to do on
 * a cream pill. It drops from above the screen after the loading screen has gone, springs and
 * swings to rest just under the top edge; stars pop, rays burst, a shine sweeps across; then it
 * dips and lifts away. Never blocks a tap.
 */
const ART = 'assets/art/banner/';
export class TopBanner{
 constructor(game,{duration=3800,reduced=false}={}){
  const el=document.createElement('div');el.className='top-banner';el.hidden=true;el.setAttribute('role','status');el.setAttribute('aria-live','polite');
  el.innerHTML=`<div class="tb-swing"><img class="tb-art" src="${ART}ribbon.webp" alt="" draggable="false"><i class="tb-shine" aria-hidden="true"></i>`
   +`<div class="tb-row"><img class="tb-rays tb-rays-l" src="${ART}rays.webp" alt="" draggable="false"><img class="tb-star tb-star-l" src="${ART}star.webp" alt="" draggable="false">`
   +`<span class="tb-svg"></span><img class="tb-star tb-star-r" src="${ART}star.webp" alt="" draggable="false"><img class="tb-rays tb-rays-r" src="${ART}rays.webp" alt="" draggable="false"></div><span class="tb-rule"><img class="tb-swatch" alt="" draggable="false" hidden><em lang="en"></em></span></div>`
   +`<div class="tb-burst" aria-hidden="true">${'<i></i>'.repeat(8)}</div>`;
  game.append(el);Object.assign(this,{el,duration,reduced,timers:[]});
  this.slot=el.querySelector('.tb-svg');this.ruleRow=el.querySelector('.tb-rule');this.rule=el.querySelector('em');this.swatch=el.querySelector('.tb-swatch');
  for(const src of['ribbon.webp','star.webp','rays.webp']){const i=new Image();i.src=ART+src;}
 }
 clear(){this.timers.forEach(clearTimeout);this.timers=[];}
 show(opts){
  const {title,rule='',swatch=null,tries=0}=opts??{};
  if(!title)return;this.clear();
  // Wait for the loading screen (and its fade-out copy) to be gone so the drop is seen in full.
  if(tries<25&&[...document.querySelectorAll('.loading')].some(l=>!l.hidden)){this.timers.push(setTimeout(()=>this.show({...opts,tries:tries+1}),100));return;}
  this.slot.replaceChildren(bubbleTitle(title,{scheme:'navy',size:120,bounce:0,tilt:0,outline:'#172d94',shadow:'#7a2a14',outlineWidth:.06}));this.el.setAttribute('aria-label',rule?title+'. '+rule:title);
  this.rule.textContent=rule;this.ruleRow.hidden=!rule;this.el.classList.toggle('no-rule',!rule);
  if(swatch){this.swatch.src='assets/art/objects/balloon.webp';this.swatch.style.filter=`hue-rotate(${swatch.hue}deg)`;this.swatch.hidden=false;}else this.swatch.hidden=true;
  const el=this.el;el.hidden=false;el.classList.remove('in','out');void el.offsetWidth;el.classList.add('in');
  this.timers.push(setTimeout(()=>this.hide(),this.duration));
 }
 hide({immediate=false}={}){
  this.clear();const el=this.el;if(el.hidden)return;
  if(immediate||this.reduced){el.classList.remove('in','out');el.hidden=true;return;}
  el.classList.remove('in');el.classList.add('out');this.timers.push(setTimeout(()=>{el.hidden=true;el.classList.remove('out');},460));
 }
}
