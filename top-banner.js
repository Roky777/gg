import { bubbleTitle } from './bubble-title.js?v=2';
/**
 * Top banner: the reusable warm-gold blank banner from the Sparky's Carnival asset pack, with
 * the activity's title (crisp SVG bubble lettering) and what to do rendered live on it. It drops
 * in at the start of each board, stays a few seconds, then lifts away. Never blocks a tap.
 */
export class TopBanner{
 constructor(game,{duration=3800,reduced=false}={}){
  const el=document.createElement('div');el.className='top-banner';el.hidden=true;el.setAttribute('role','status');el.setAttribute('aria-live','polite');
  el.innerHTML='<img class="tb-art" src="assets/art/loading/carnival2/banner-golden.webp" alt="" draggable="false"><div class="tb-copy"><span class="tb-svg"></span><span class="tb-rule"><img class="tb-swatch" alt="" draggable="false" hidden><em lang="en"></em></span></div>';
  game.append(el);Object.assign(this,{el,duration,reduced,timers:[]});
  this.slot=el.querySelector('.tb-svg');this.ruleRow=el.querySelector('.tb-rule');this.rule=el.querySelector('em');this.swatch=el.querySelector('.tb-swatch');
 }
 clear(){this.timers.forEach(clearTimeout);this.timers=[];}
 show({title,rule='',swatch=null}){
  if(!title)return;this.clear();
  this.slot.replaceChildren(bubbleTitle(title,{scheme:'sky',size:110,bounce:.04,tilt:2}));this.el.setAttribute('aria-label',rule?title+'. '+rule:title);
  this.rule.textContent=rule;this.ruleRow.hidden=!rule;this.el.classList.toggle('no-rule',!rule);
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
