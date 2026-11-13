const SVG='http://www.w3.org/2000/svg';
let titleSerial=0;
const titleMeasure=document.createElement('canvas').getContext('2d');
function curvedTitle(title){
 const id='ribbon-title-'+(++titleSerial),svg=document.createElementNS(SVG,'svg');
 svg.setAttribute('viewBox','0 0 1280 272');svg.setAttribute('aria-hidden','true');
 svg.innerHTML=`<defs><path id="${id}" d="M175 165 Q640 65 1105 165"/><linearGradient id="${id}-gold" x1="0" y1="30" x2="0" y2="175" gradientUnits="userSpaceOnUse"><stop stop-color="#fffde0"/><stop offset=".45" stop-color="#ffed69"/><stop offset="1" stop-color="#ffb71f"/></linearGradient></defs>`;
 titleMeasure.font='1000 82px Nunito, sans-serif';
 const size=Math.min(92,82*895/Math.max(1,titleMeasure.measureText(title).width));
 const text=document.createElementNS(SVG,'text');text.setAttribute('font-family','Nunito, sans-serif');text.setAttribute('font-weight','1000');text.setAttribute('font-size',size.toFixed(2));text.setAttribute('fill',`url(#${id}-gold)`);text.setAttribute('stroke','#6b197c');text.setAttribute('stroke-width','2');text.setAttribute('paint-order','stroke');text.setAttribute('text-anchor','middle');
 const path=document.createElementNS(SVG,'textPath');path.setAttribute('href','#'+id);path.setAttribute('startOffset','50%');path.textContent=title;text.append(path);svg.append(text);return svg;
}
/** Glossy Arcade purple/gold lesson ribbon. Clear live text, no competing reward effects. */
export class TopBanner{
 constructor(game,{duration=3800,reduced=false}={}){
  const el=document.createElement('div');el.className='top-banner';el.hidden=true;el.setAttribute('role','status');el.setAttribute('aria-live','polite');
  el.innerHTML='<div class="tb-swing"><img class="tb-art" src="assets/art/arcade2/lesson-ribbon-gloss-v4.webp" alt="" draggable="false"><div class="tb-polish" aria-hidden="true"><i class="tb-light-pass"></i></div><div class="tb-copy"><span class="tb-svg"></span></div></div><div class="tb-glints" aria-hidden="true"></div>';
  game.append(el);Object.assign(this,{game,el,duration,reduced,timers:[]});
  this.slot=el.querySelector('.tb-svg');this.light=el.querySelector('.tb-light-pass');this.glints=el.querySelector('.tb-glints');this.animations=new Set();this.motion=matchMedia('(prefers-reduced-motion:reduce)');
  this.onHidden=()=>{if(document.hidden)this.hide({immediate:true});};document.addEventListener('visibilitychange',this.onHidden);
  this.onMotion=()=>{if(this.motion.matches)this.stopEffects();};this.motion.addEventListener('change',this.onMotion);
  this.onAlign=()=>this.alignBoard();game.addEventListener('screenfill',this.onAlign);window.addEventListener('resize',this.onAlign,{passive:true});
 }
 alignBoard(){
  const frame=this.game.querySelector('.puzzle-frame'),board=frame?.querySelector('#board'),split=board?.classList.contains('counting-board');
  const align=!!frame&&(split||board?.dataset.variant==='count-connect');this.el.classList.toggle('board-aligned',align);if(!align)return;
  // Counting's main painted board is 69.65% of the frame; the number tray is separate.
  const stage=this.game.getBoundingClientRect(),rect=frame.getBoundingClientRect(),width=rect.width*(split?.6965:1);
  this.el.style.setProperty('--banner-board-center',(rect.left-stage.left+width/2)+'px');
  this.el.style.setProperty('--banner-board-width',Math.max(split?260:320,Math.min(700,split?width*.94:stage.width*.52))+'px');
 }
 stopEffects(){for(const a of this.animations)a.cancel();this.animations.clear();this.glints.replaceChildren();}
 clear(){this.timers.forEach(clearTimeout);this.timers=[];this.stopEffects();}
 animate(node,frames,timing){const a=node.animate(frames,timing);this.animations.add(a);a.finished.catch(()=>{}).finally(()=>this.animations.delete(a));return a;}
 entrance(){
  if(this.reduced||this.motion.matches||!this.el.getClientRects().length)return;
  this.animate(this.el,[{opacity:0,transform:'translate(-50%,-28px) scale(.84) rotate(-2deg)'},{opacity:1,transform:'translate(-50%,1px) scale(1.035) rotate(.7deg)',offset:.57},{transform:'translate(-50%,-2px) scale(.992) rotate(-.25deg)',offset:.79},{opacity:1,transform:'translate(-50%,0) scale(1) rotate(0)'}],{duration:680,easing:'cubic-bezier(.2,.75,.3,1)'});
  this.animate(this.slot,[{opacity:0,transform:'scale(.92)'},{opacity:1,transform:'scale(1.02)',offset:.7},{opacity:1,transform:'scale(1)'}],{duration:390,delay:150,easing:'ease-out'});
  this.animate(this.light,[{opacity:0,transform:'translateX(-150%) skewX(-18deg)'},{opacity:.85,offset:.18},{opacity:.7,offset:.72},{opacity:0,transform:'translateX(950%) skewX(-18deg)'}],{duration:760,delay:430,easing:'ease-in-out'});
  [[12,38],[29,18],[47,10],[65,18],[83,35],[93,56]].forEach(([x,y],i)=>{
   const star=document.createElementNS(SVG,'svg');star.setAttribute('viewBox','0 0 32 32');star.innerHTML='<path d="M16 1L20 12L31 16L20 20L16 31L12 20L1 16L12 12Z" fill="#fff9b8" stroke="#ffcc43" stroke-width="1.3"/><circle cx="16" cy="16" r="3" fill="white"/>';star.style.cssText=`left:${x}%;top:${y}%;width:${i%2?4:3.2}cqw`;this.glints.append(star);
   const a=this.animate(star,[{opacity:0,transform:'translate(-50%,-50%) scale(.15) rotate(-25deg)'},{opacity:1,transform:'translate(-50%,-50%) scale(1.1) rotate(0)',offset:.35},{opacity:0,transform:'translate(-50%,calc(-50% - 7px)) scale(.35) rotate(25deg)'}],{duration:560,delay:480+i*85,easing:'ease-out'});a.finished.catch(()=>{}).finally(()=>star.remove());
  });
 }
 destroy(){this.hide({immediate:true});document.removeEventListener('visibilitychange',this.onHidden);this.motion.removeEventListener('change',this.onMotion);this.game.removeEventListener('screenfill',this.onAlign);window.removeEventListener('resize',this.onAlign);this.el.remove();}
 show(opts){
  const {title,tries=0}=opts??{};
  if(!title)return;this.clear();this.alignBoard();
  // Wait for the loading screen (and its fade-out copy) to be gone so the drop is seen in full.
  if(tries<25&&[...document.querySelectorAll('.loading')].some(l=>!l.hidden)){this.timers.push(setTimeout(()=>this.show({...opts,tries:tries+1}),100));return;}
  this.slot.replaceChildren(curvedTitle(title));this.el.setAttribute('aria-label',title);
  const el=this.el;el.hidden=false;el.classList.remove('in','out');void el.offsetWidth;el.classList.add('in');this.entrance();
  this.timers.push(setTimeout(()=>this.hide(),this.duration));
 }
 hide({immediate=false}={}){
  this.clear();const el=this.el;if(el.hidden)return;
  if(immediate||this.reduced||this.motion.matches){el.classList.remove('in','out');el.hidden=true;return;}
  el.classList.remove('in');el.classList.add('out');this.animate(el,[{opacity:1,transform:'translate(-50%,0) scale(1)'},{opacity:0,transform:'translate(-50%,-16px) scale(.94)'}],{duration:260,easing:'ease-in',fill:'forwards'});this.timers.push(setTimeout(()=>{el.hidden=true;el.classList.remove('out');this.stopEffects();},270));
 }
}

