/**
 * Top banner: at the start of each board a little play board drops in from the top with
 * the game's name and what to do. Ribbon tails and a warm glow sit behind it, the title
 * pops in letter by letter, stars and confetti burst out as it lands, a gloss sweeps across;
 * after a few seconds it lifts away. It never blocks a tap.
 */
const BURST_COLOURS=['#ffd84a','#ff8a3d','#5ccdf8','#7ed957','#f27fb5','#ffffff'];
export class TopBanner{
 constructor(game,{duration=3800,reduced=false}={}){
  const el=document.createElement('div');el.className='top-banner';el.hidden=true;el.setAttribute('role','status');el.setAttribute('aria-live','polite');
  el.innerHTML='<div class="tb-glow" aria-hidden="true"></div><div class="tb-ribbon"><span class="tb-tail tb-tail-l" aria-hidden="true"></span><span class="tb-tail tb-tail-r" aria-hidden="true"></span><div class="tb-text"><strong lang="en"></strong><span><img class="tb-swatch" alt="" draggable="false" hidden><em lang="en"></em></span></div></div><div class="tb-burst" aria-hidden="true"></div>';
  game.append(el);Object.assign(this,{el,duration,reduced,timers:[]});
  this.title=el.querySelector('strong');this.rule=el.querySelector('em');this.swatch=el.querySelector('.tb-swatch');this.burst=el.querySelector('.tb-burst');
 }
 clear(){this.timers.forEach(clearTimeout);this.timers=[];}
 letters(title){
  // Each letter is its own board-letter (navy outline, blue gradient) and pops in on a wave.
  this.title.replaceChildren();this.title.setAttribute('aria-label',title);
  [...title].forEach((ch,i)=>{const s=document.createElement('span');if(ch===' '){s.className='tb-sp';s.textContent=' ';}else{s.className='tb-ch';s.textContent=ch;s.dataset.text=ch;s.style.setProperty('--i',i);}s.setAttribute('aria-hidden','true');this.title.append(s);});
 }
 pop(){
  // Stars and confetti in the game's colours burst from the board as it lands.
  if(this.reduced)return;this.burst.replaceChildren();
  for(let i=0;i<16;i++){const p=document.createElement('i'),star=i%3===0,a=(i/16)*Math.PI*2+Math.random()*.3,dist=70+Math.random()*60;
   p.className=star?'tb-star':'tb-bit';p.style.setProperty('--dx',(Math.cos(a)*dist*1.6).toFixed(0)+'px');p.style.setProperty('--dy',(Math.sin(a)*dist*.7+20).toFixed(0)+'px');p.style.setProperty('--spin',Math.round(Math.random()*720-360)+'deg');p.style.setProperty('--c',BURST_COLOURS[i%BURST_COLOURS.length]);p.style.animationDelay=(380+Math.random()*80|0)+'ms';this.burst.append(p);}
  this.timers.push(setTimeout(()=>this.burst.replaceChildren(),1700));
 }
 show({title,rule='',swatch=null}){
  if(!title)return;this.clear();this.letters(title);this.rule.textContent=rule;this.rule.parentElement.hidden=!rule;
  if(swatch){this.swatch.src='assets/art/objects/balloon.webp';this.swatch.style.filter=`hue-rotate(${swatch.hue}deg)`;this.swatch.hidden=false;}else this.swatch.hidden=true;
  const el=this.el;el.hidden=false;el.classList.remove('in','out');void el.offsetWidth;el.classList.add('in');this.pop();
  this.timers.push(setTimeout(()=>this.hide(),this.duration));
 }
 hide({immediate=false}={}){
  this.clear();const el=this.el;if(el.hidden)return;
  if(immediate||this.reduced){el.classList.remove('in','out');el.hidden=true;this.burst.replaceChildren();return;}
  el.classList.remove('in');el.classList.add('out');this.timers.push(setTimeout(()=>{el.hidden=true;el.classList.remove('out');this.burst.replaceChildren();},380));
 }
}
