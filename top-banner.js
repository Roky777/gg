/**
 * Top banner: at the start of each board a ribbon drops in from the top of the screen
 * with the game's name and what to do, stays a few seconds, then slides back up.
 * It sits above the board between the corner buttons and never blocks a tap.
 */
export class TopBanner{
 constructor(game,{duration=3600,reduced=false}={}){
  const el=document.createElement('div');el.className='top-banner';el.hidden=true;el.setAttribute('role','status');el.setAttribute('aria-live','polite');
  el.innerHTML='<div class="tb-ribbon"><img class="tb-shell" src="assets/art/ui-finish/ribbon-shell.svg" alt="" draggable="false"><div class="tb-text"><strong lang="en"></strong><span><img class="tb-swatch" alt="" draggable="false" hidden><em lang="en"></em></span></div></div>';
  game.append(el);Object.assign(this,{el,duration,reduced,timers:[]});
  this.title=el.querySelector('strong');this.rule=el.querySelector('em');this.swatch=el.querySelector('.tb-swatch');
 }
 clear(){this.timers.forEach(clearTimeout);this.timers=[];}
 show({title,rule='',swatch=null}){
  if(!title)return;this.clear();this.title.textContent=title;this.rule.textContent=rule;this.rule.parentElement.hidden=!rule;
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
