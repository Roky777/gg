import { bubbleTitle } from './bubble-title.js?v=1';
/**
 * Top banner: at the start of each board a sunny signboard swings down on two golden ropes
 * with the game's name (crisp SVG bubble lettering) and what to do, sways gently, then rises
 * away. It sits above the board between the corner buttons and never blocks a tap.
 */
export class TopBanner{
 constructor(game,{duration=3800,reduced=false}={}){
  const el=document.createElement('div');el.className='top-banner';el.hidden=true;el.setAttribute('role','status');el.setAttribute('aria-live','polite');
  el.innerHTML='<div class="tb-sway"><i class="tb-rope tb-rope-l" aria-hidden="true"></i><i class="tb-rope tb-rope-r" aria-hidden="true"></i><div class="tb-board"><i class="tb-shine" aria-hidden="true"></i><i class="tb-star tb-star-l" aria-hidden="true"></i><i class="tb-star tb-star-r" aria-hidden="true"></i><span class="tb-svg"></span><span class="tb-rule"><img class="tb-swatch" alt="" draggable="false" hidden><em lang="en"></em></span></div></div>';
  game.append(el);Object.assign(this,{el,duration,reduced,timers:[]});
  this.slot=el.querySelector('.tb-svg');this.ruleRow=el.querySelector('.tb-rule');this.rule=el.querySelector('em');this.swatch=el.querySelector('.tb-swatch');
 }
 clear(){this.timers.forEach(clearTimeout);this.timers=[];}
 show({title,rule='',swatch=null}){
  if(!title)return;this.clear();
  this.slot.replaceChildren(bubbleTitle(title,{scheme:'sky',size:110,bounce:.05,tilt:3}));this.el.setAttribute('aria-label',rule?title+'. '+rule:title);
  this.rule.textContent=rule;this.ruleRow.hidden=!rule;
  if(swatch){this.swatch.src='assets/art/objects/balloon.webp';this.swatch.style.filter=`hue-rotate(${swatch.hue}deg)`;this.swatch.hidden=false;}else this.swatch.hidden=true;
  const el=this.el;el.hidden=false;el.classList.remove('in','out');void el.offsetWidth;el.classList.add('in');
  this.timers.push(setTimeout(()=>this.hide(),this.duration));
 }
 hide({immediate=false}={}){
  this.clear();const el=this.el;if(el.hidden)return;
  if(immediate||this.reduced){el.classList.remove('in','out');el.hidden=true;return;}
  el.classList.remove('in');el.classList.add('out');this.timers.push(setTimeout(()=>{el.hidden=true;el.classList.remove('out');},380));
 }
}
