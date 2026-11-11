import { bubbleTitle } from './bubble-title.js?v=1';
/**
 * Top banner: at the start of each board the game's name drops in from the top as a
 * bubble title (the game's lettering: white rim, navy outline, glossy sunny fill, bouncy
 * letters) with spark rays, and what to do sits on a cream pill underneath. Drawn as SVG,
 * so it stays sharp on any screen. It never blocks a tap and lifts away after a few seconds.
 */
export class TopBanner{
 constructor(game,{duration=3800,reduced=false}={}){
  const el=document.createElement('div');el.className='top-banner';el.hidden=true;el.setAttribute('role','status');el.setAttribute('aria-live','polite');
  el.innerHTML='<div class="tb-title"><i class="tb-ray tb-ray-l" aria-hidden="true"></i><span class="tb-svg"></span><i class="tb-ray tb-ray-r" aria-hidden="true"></i></div><div class="tb-pill"><img class="tb-swatch" alt="" draggable="false" hidden><em lang="en"></em></div>';
  game.append(el);Object.assign(this,{el,duration,reduced,timers:[]});
  this.slot=el.querySelector('.tb-svg');this.pill=el.querySelector('.tb-pill');this.rule=el.querySelector('em');this.swatch=el.querySelector('.tb-swatch');
 }
 clear(){this.timers.forEach(clearTimeout);this.timers=[];}
 show({title,rule='',swatch=null}){
  if(!title)return;this.clear();
  this.slot.replaceChildren(bubbleTitle(title,{scheme:'sun',size:120}));this.el.setAttribute('aria-label',rule?title+'. '+rule:title);
  this.rule.textContent=rule;this.pill.hidden=!rule;
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
