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
function sparkle(node){
 if(reduced.matches||paused()||effects.childElementCount>=24)return;
 const b=node.getBoundingClientRect(),f=frame.getBoundingClientRect();
 for(let i=0;i<4;i++){
  const spark=document.createElementNS('http://www.w3.org/2000/svg','svg');spark.setAttribute('viewBox','0 0 24 24');spark.classList.add('board-play-spark');
  const path=document.createElementNS(spark.namespaceURI,'path');path.setAttribute('d','M12 1 15 8 23 9 17 15 19 23 12 19 5 23 7 15 1 9 9 8Z');path.setAttribute('fill',['#ffcc60','#fff0b3','#86dec8','#ffb497'][i]);path.setAttribute('stroke','#fff9de');path.setAttribute('stroke-width','1.3');spark.append(path);
  spark.style.left=((b.left+b.width*(i%2?.8:.2)-f.left)/f.width*100)+'%';spark.style.top=((b.top+b.height*.45-f.top)/f.height*100)+'%';effects.append(spark);
  const x=(i%2?1:-1)*(14+i*4),y=-18-(i%3)*10;
  const a=animate(spark,[{opacity:0,transform:'translate(-50%,-50%) scale(.4)'},{opacity:1,offset:.2},{opacity:0,transform:`translate(calc(-50% + ${x}px),calc(-50% + ${y}px)) rotate(${i%2?28:-28}deg) scale(.8)`}],{duration:620+i*35,easing:'cubic-bezier(.2,.6,.3,1)'});
  if(a)a.finished.catch(()=>{}).finally(()=>spark.remove());else spark.remove();
 }
}
function targets(){
 if(board.querySelector('.variant-columns'))return [...board.querySelectorAll('[data-target]')];
 for(const selector of ['.story-slot','.quantity-row','.assembly-zone','.difference-spot','.piece','.sticker-cell']){const nodes=[...board.querySelectorAll(selector)];if(nodes.length)return nodes;}
 return [];
}
function updateProgress(){const nodes=targets(),earned=n=>n.matches('.matched,.answered,.filled,.in-place,.found');
 if(!matchTextures.length&&board.querySelector('.variant-columns'))for(const name of ['token-blue','token-correct','card-selected','card-correct']){const img=new Image();img.src=`assets/art/toy-board/${name}.webp`;matchTextures.push(img);img.decode().catch(()=>{});}
 taskCount=nodes.length;earnedCount=nodes.filter(earned).length;
 if(nodes.length&&nodes.every(earned))frame.classList.add('board-play-complete');else frame.classList.remove('board-play-complete');
}
function entrance(){clear();updateProgress();if(paused())return;
 [...board.querySelectorAll(targetSelector)].slice(0,16).forEach((node,i)=>animate(node,[{opacity:.35},{opacity:1}],{duration:240,delay:Math.min(i*32,180),easing:'ease-out'}));
}
new MutationObserver(records=>{
 let rebuild=false;
 for(const record of records){
  if(record.type==='childList'&&record.target===board)rebuild=true;
  if(record.type!=='attributes')continue;
  const node=record.target,old=record.oldValue?.split(/\s+/)??[];
  const state=['matched','answered','filled','in-place','found'].find(c=>node.classList.contains(c)&&!old.includes(c));
  if(state&&node.matches('.variant-card,.story-slot,.quantity-row,.assembly-zone,.piece,.sticker-cell,.difference-spot')){
   animate(node,[{filter:'brightness(1.14)'},{filter:'brightness(1)'}],{duration:460,easing:'ease-out'});
   // One burst for a pair, on its receiving side; source and target settle together.
   if(!node.hasAttribute('data-source')){sparkle(node);
    if(node.hasAttribute('data-target')){const path=board.querySelector('.connection-correct:last-child path');if(path){const length=path.getTotalLength();animate(path,[{strokeDasharray:`${length} ${length}`,strokeDashoffset:length},{strokeDasharray:`${length} ${length}`,strokeDashoffset:0}],{duration:320,easing:'cubic-bezier(.2,.7,.3,1)'});}}
   }
  }
 }
 updateProgress();
 if(rebuild){clearTimeout(rebuildTimer);rebuildTimer=setTimeout(entrance,100);}
}).observe(board,{subtree:true,childList:true,attributes:true,attributeFilter:['class'],attributeOldValue:true});
board.addEventListener('pointerdown',e=>{if(paused())return;pressed?.classList.remove('toy-pressed');pressed=e.target.closest(targetSelector);if(pressed&&!pressed.disabled)pressed.classList.add('toy-pressed');},{passive:true});
function release(){pressed?.classList.remove('toy-pressed');pressed=null;}
for(const event of ['pointerup','pointercancel','blur'])window.addEventListener(event,release,{passive:true});
// Rejection motion belongs to the connection, never to the child's active target.
new MutationObserver(records=>{for(const r of records)for(const node of r.addedNodes){if(node.nodeType!==1||!node.matches('.connection-wrong'))continue;
 if(pressed)continue;
 animate(node,[{opacity:.4},{opacity:1},{opacity:.6},{opacity:1}],{duration:380,easing:'ease-in-out'});
}}).observe(board,{subtree:true,childList:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
new MutationObserver(()=>{if(paused())clear();}).observe(document.getElementById('pause-dialog'),{attributes:true,attributeFilter:['open']});
new MutationObserver(()=>{if(paused())clear();}).observe(stage,{attributes:true,attributeFilter:['inert']});
reduced.addEventListener('change',clear);window.addEventListener('resize',clear,{passive:true});
window.sparkyBoardPlay={get status(){return{activeAnimations:animations.size,particles:effects.childElementCount,progress:taskCount,earned:earnedCount,reduced:reduced.matches,paused:!!paused()};}};
entrance();
