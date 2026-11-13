// Feedback observes actual game state; it never decides answers or moves hit targets.
const board=document.getElementById('board'),frame=board.closest('.puzzle-frame'),stage=frame.closest('.game');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const effects=document.createElement('div');
effects.className='board-play-effects';effects.setAttribute('aria-hidden','true');
frame.append(effects);
const animations=new Set(),matchTextures=[];let rebuildTimer,pressed,taskCount=0,earnedCount=0;
const targetSelector='.variant-card,.story-slot,.piece,.assembly-choice,.number-chip,.sticker-cell';
const paused=()=>document.hidden||stage.inert||document.getElementById('pause-dialog')?.open;
function animate(node,keys,options){if(reduced.matches||paused())return;const a=node.animate(keys,options);animations.add(a);a.finished.catch(()=>{}).finally(()=>animations.delete(a));return a;}
function clear(){for(const a of animations)a.cancel();animations.clear();effects.replaceChildren();pressed?.classList.remove('toy-pressed');pressed=null;frame.classList.remove('board-play-complete');}
// Joy effects shared with Food Choices: hearts and stars float out from a correct
// answer; a finished board gets a party burst around Sparky. Particles live in a
// stage layer above the scenery, never take input and clear on pause/resize.
const joy=document.createElement('div');joy.className='board-joy';joy.setAttribute('aria-hidden','true');stage.append(joy);
const SHAPES={heart:'M16 27.5S2.5 19.6 2.5 10.2C2.5 5.6 5.9 2.5 9.8 2.5c2.7 0 4.9 1.5 6.2 3.8 1.3-2.3 3.5-3.8 6.2-3.8 3.9 0 7.3 3.1 7.3 7.7 0 9.4-13.5 17.3-13.5 17.3z',star:'M16 2.5l3.9 8.4 9.1 1.1-6.7 6.3 1.8 9.1L16 22.9l-8.1 4.5 1.8-9.1L3 12l9.1-1.1z'};
const FILL={heart:'#ff6b6b',star:'#ffd23f'},EXTRA=['#8fe0c8','#ffb3c7','#9fd6ff'];
const joyAnimations=new Set();let lastBurst=0,lastPointer=null;
function clearJoy(){for(const a of joyAnimations)a.cancel();joyAnimations.clear();joy.replaceChildren();}
function clearAll(){clear();clearJoy();}
function particle(shape,colour){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 32 32');svg.classList.add('board-joy-particle');const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',SHAPES[shape]);path.setAttribute('fill',colour);path.setAttribute('stroke','#fff');path.setAttribute('stroke-width','2');path.setAttribute('stroke-linejoin','round');svg.append(path);return svg;}
function burst(x,y,kind,tight=false){
 if(reduced.matches||document.hidden||document.getElementById('pause-dialog')?.open||joy.childElementCount>=60)return;
 const s=stage.getBoundingClientRect(),unit=s.height/100,party=kind==='party',n=party?18:7;
 for(let i=0;i<n;i++){
  const side=i%2?1:-1,k=Math.floor(i/2)/Math.max(1,Math.ceil(n/2)-1),shape=party?(i%3===0?'star':'heart'):(i%3===1?'heart':'star');
  const colour=i%5===4?EXTRA[i%3]:FILL[shape],node=particle(shape,colour);if(party)node.classList.add('is-party');const size=(party?5.2:5)*unit*(.85+((i*29)%10)/40);
  const a=-Math.PI/2+side*(tight?.25+k*.75:party?.5+k*1.15:.35+k*.95),dist=(tight?24:party?30:19)*unit*(.8+((i*37)%10)/40),x0=party?side*(tight?5:11)*unit:0;
  Object.assign(node.style,{left:(x-s.left)+'px',top:(y-s.top)+'px',width:size+'px',height:size+'px'});joy.append(node);
  lastBurst=performance.now();const anim=node.animate([{opacity:0,transform:`translate(calc(-50% + ${x0}px),-50%) scale(.3)`},{opacity:1,offset:.16},{opacity:1,offset:.72},{opacity:0,transform:`translate(calc(-50% + ${x0+Math.cos(a)*dist}px),calc(-50% + ${Math.sin(a)*dist}px)) rotate(${side*(8+i*3)}deg) scale(1)`}],{duration:party?1700:1150,delay:(i%4)*55,easing:'cubic-bezier(.2,.7,.3,1)',fill:'backwards'});
  joyAnimations.add(anim);anim.finished.catch(()=>{}).finally(()=>{joyAnimations.delete(anim);node.remove();});
 }
}
// A small star carries the successful connection from source to receiver. Sample the
// actual SVG path in screen space; no extra render loop or hit-target movement.
function connectionStar(path){
 if(reduced.matches||paused()||joy.childElementCount>=56)return;
 const matrix=path.getScreenCTM();if(!matrix)return;
 const length=path.getTotalLength(),box=stage.getBoundingClientRect(),star=particle('star',FILL.star);
 Object.assign(star.style,{left:'0',top:'0',width:Math.max(12,box.height*.035)+'px'});joy.append(star);
 const keys=Array.from({length:13},(_,i)=>{const point=path.getPointAtLength(length*i/12),p=new DOMPoint(point.x,point.y).matrixTransform(matrix);return{offset:i/12,opacity:i===0||i===12?0:1,transform:`translate(${p.x-box.left}px,${p.y-box.top}px) translate(-50%,-50%) rotate(${i*12}deg)`};});
 const a=star.animate(keys,{duration:560,easing:'ease-in-out'});joyAnimations.add(a);a.finished.catch(()=>{}).finally(()=>{joyAnimations.delete(a);star.remove();});
}
function sparkle(node){const b=node.getBoundingClientRect();if(!b.width)return;burst(b.left+b.width/2,b.top+b.height*.45,'match');}
// The finished-board confetti (24 pieces; matches use 12) marks a completed board.
let partied=-1e9;
new MutationObserver(()=>{const c=document.getElementById('confetti');if(c.childElementCount>=10&&c.childElementCount<20&&performance.now()-lastBurst>500&&!stage.classList.contains('feeding-room')){const f=frame.getBoundingClientRect(),p=lastPointer&&lastPointer.x>=f.left&&lastPointer.x<=f.right&&lastPointer.y>=f.top&&lastPointer.y<=f.bottom?lastPointer:{x:f.left+f.width/2,y:f.top+f.height*.3};burst(p.x,p.y,'match');}if(c.childElementCount<20)return;if(performance.now()-partied<1500||stage.classList.contains('feeding-room'))return;partied=performance.now();
 const m=stage.querySelector(':scope>.mascot'),mb=m&&getComputedStyle(m).visibility!=='hidden'?m.getBoundingClientRect():null;
 if(mb&&mb.width)burst(mb.left+mb.width/2,mb.top+mb.height*.32,'party',true);
 const f=frame.getBoundingClientRect();burst(f.left+f.width/2,f.top+f.height*.4,'party');
}).observe(document.getElementById('confetti'),{childList:true});function targets(){
 if(board.querySelector('.variant-columns'))return [...board.querySelectorAll('[data-target]')];
 for(const selector of ['.story-slot','.quantity-row','.assembly-zone','.difference-spot','.piece','.sticker-cell']){const nodes=[...board.querySelectorAll(selector)];if(nodes.length)return nodes;}
 return [];
}
function updateProgress(){const nodes=targets(),earned=n=>n.matches('.matched,.answered,.filled,.in-place,.found');
 if(!matchTextures.length&&board.querySelector('.variant-columns'))for(const name of ['token-blue','token-correct','card-selected-play','card-correct-play']){const img=new Image();img.src=`assets/art/toy-board/${name}.webp`;matchTextures.push(img);img.decode().catch(()=>{});}
 taskCount=nodes.length;earnedCount=nodes.filter(earned).length;
 if(nodes.length&&nodes.every(earned))frame.classList.add('board-play-complete');else frame.classList.remove('board-play-complete');
}
function entrance(){clear();updateProgress();if(paused())return;
 [...board.querySelectorAll(targetSelector)].slice(0,16).forEach((node,i)=>animate(node,[{opacity:.35},{opacity:1}],{duration:240,delay:Math.min(i*32,180),easing:'ease-out'}));
}
new MutationObserver(records=>{
 let rebuild=false;const handled=new Set();
 for(const record of records){
  if(record.type==='childList'&&record.target===board)rebuild=true;
  if(record.type!=='attributes')continue;
  const node=record.target,old=record.oldValue?.split(/\s+/)??[];
  const state=['matched','answered','filled','in-place','found'].find(c=>node.classList.contains(c)&&!old.includes(c));
  // One class change can arrive as several records (e.g. remove 'selected', add 'matched'); react once.
  if(state&&!handled.has(node)&&handled.add(node)&&node.matches('.variant-card,.story-slot,.quantity-row,.assembly-zone,.piece,.sticker-cell,.difference-spot,.difference-object')){
   animate(node,[{filter:'brightness(1.14)'},{filter:'brightness(1)'}],{duration:460,easing:'ease-out'});
   // One burst for a pair, on its receiving side; source and target settle together.
   if(!node.hasAttribute('data-source')&&!node.closest('.challenge-collection')){sparkle(node);
    if(node.hasAttribute('data-target')){const path=board.querySelector('.connection-correct:last-child path');if(path){connectionStar(path);const length=path.getTotalLength();animate(path,[{strokeDasharray:`${length} ${length}`,strokeDashoffset:length},{strokeDasharray:`${length} ${length}`,strokeDashoffset:0}],{duration:320,easing:'cubic-bezier(.2,.7,.3,1)'});}}
   }
  }
 }
 updateProgress();
 if(rebuild){clearTimeout(rebuildTimer);rebuildTimer=setTimeout(entrance,100);}
}).observe(board,{subtree:true,childList:true,attributes:true,attributeFilter:['class'],attributeOldValue:true});
window.addEventListener('pointerup',e=>{lastPointer={x:e.clientX,y:e.clientY};},{passive:true,capture:true});
board.addEventListener('pointerdown',e=>{if(paused())return;pressed?.classList.remove('toy-pressed');pressed=e.target.closest(targetSelector);if(pressed&&!pressed.disabled)pressed.classList.add('toy-pressed');},{passive:true});
function release(){pressed?.classList.remove('toy-pressed');pressed=null;}
for(const event of ['pointerup','pointercancel','blur'])window.addEventListener(event,release,{passive:true});
// Rejection motion belongs to the connection, never to the child's active target.
new MutationObserver(records=>{for(const r of records)for(const node of r.addedNodes){if(node.nodeType!==1||!node.matches('.connection-wrong'))continue;
 if(pressed)continue;
 animate(node,[{opacity:.4},{opacity:1},{opacity:.6},{opacity:1}],{duration:380,easing:'ease-in-out'});
}}).observe(board,{subtree:true,childList:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden)clearAll();});
new MutationObserver(()=>{if(paused())clearAll();}).observe(document.getElementById('pause-dialog'),{attributes:true,attributeFilter:['open']});
new MutationObserver(()=>{if(paused())clear();}).observe(stage,{attributes:true,attributeFilter:['inert']});
reduced.addEventListener('change',clearAll);window.addEventListener('resize',clearAll,{passive:true});
window.sparkyBoardPlay={get status(){return{activeAnimations:animations.size,particles:effects.childElementCount+joy.querySelectorAll('.board-joy-particle:not(.is-party)').length,partyParticles:joy.querySelectorAll('.is-party').length,progress:taskCount,earned:earnedCount,reduced:reduced.matches,paused:!!paused()};}};
entrance();
