import { bubbleTitle } from './bubble-title.js?v=5';
/**
 * Top banner: the asset pack's golden banner, lettered like the loading-screen badge (gold
 * letters, purple outline, white rim) with the instruction in purple. It drops from above the
 * screen, springs and swings to rest just under the top edge, shines and sparkles on landing,
 * then dips and lifts away. Never blocks a tap.
 */
export class TopBanner{
 constructor(game,{duration=3800,reduced=false}={}){
  const el=document.createElement('div');el.className='top-banner';el.hidden=true;el.setAttribute('role','status');el.setAttribute('aria-live','polite');
  el.innerHTML='<div class="tb-swing"><img class="tb-art" src="assets/art/loading/carnival2/banner-golden.webp" alt="" draggable="false"><i class="tb-shine" aria-hidden="true"></i><div class="tb-copy"><span class="tb-svg"></span><span class="tb-rule"><img class="tb-swatch" alt="" draggable="false" hidden><em lang="en"></em></span></div></div><div class="tb-burst" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>';
  game.append(el);Object.assign(this,{el,duration,reduced,timers:[]});
  this.slot=el.querySelector('.tb-svg');this.ruleRow=el.querySelector('.tb-rule');this.rule=el.querySelector('em');this.swatch=el.querySelector('.tb-swatch');
 }
 clear(){this.timers.forEach(clearTimeout);this.timers=[];}
 show(opts){
  const {title,rule='',swatch=null,tries=0}=opts??{};
  if(!title)return;this.clear();
  // Wait for the loading screen (and its fade-out copy) to be gone so the drop is seen in full.
  if(tries<25&&[...document.querySelectorAll('.loading')].some(l=>!l.hidden)){this.timers.push(setTimeout(()=>this.show({...opts,tries:tries+1}),100));return;}
  this.slot.replaceChildren(bubbleTitle(title,{scheme:'sun',size:110,bounce:.04,tilt:2,outline:'#4a1d96',shadow:'#2e0f66',outlineWidth:.13}));this.el.setAttribute('aria-label',rule?title+'. '+rule:title);
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
