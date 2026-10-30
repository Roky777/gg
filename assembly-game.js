/** Three exact image sections, with drag-only placement. */
export function createAssemblyBoard(item){
 const image=`assembly/${item.id}.png`;
 return {id:`assembly:${item.id}`,topic:'assembly',axis:'vertical',item,cards:[0,1,2].map(value=>({image,value,label:item.name,kind:'assembly'})),targets:['ऊपर','बीच','नीचे'],intro:`चलो, तस्वीर बनाएँ! दाईं तरफ तीन टुकड़े हैं। टुकड़े को पकड़कर उसकी छाया पर रखो।`,rule:'तीन टुकड़ों से पूरी तस्वीर बनाओ।',learn:`वाह! तुमने ${item.name} की पूरी तस्वीर बना दी! ${item.fact}`};
}
export function sectionAt(y,rect){if(y<rect.top||y>rect.bottom)return -1;return Math.min(2,Math.floor((y-rect.top)/rect.height*3));}
export function shuffledSections(random=Math.random){const a=[0,1,2];for(let i=2;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}if(a.every((v,i)=>v===i))[a[0],a[2]]=[a[2],a[0]];return a;}
export class AssemblyRound{
 constructor({element,picture,sound,tell,director,onComplete,onMatch=()=>{},onWrong=()=>{},onActivity=()=>{},isPaused=()=>false,reduced=false,random=Math.random}){
  Object.assign(this,{element,picture,sound,tell,director,onComplete,onMatch,onWrong,onActivity,isPaused,reduced});this.placed=new Set();this.selected=null;this.misses=0;this.destroyed=false;this.drag=null;this.timers=[];
  element.className='board assembly-board';element.replaceChildren();element.setAttribute('aria-label',picture.rule);
  const progress=document.createElement('div');progress.className='assembly-progress sr-only';progress.setAttribute('aria-label','तीन में से शून्य टुकड़े लगे');this.progress=progress;for(let i=0;i<3;i++){const dot=document.createElement('span');dot.textContent='★';dot.setAttribute('aria-hidden','true');progress.append(dot);}element.append(progress);
  const shell=document.createElement('div');shell.className='assembly-art';element.append(shell);const target=document.createElement('div');target.className='assembly-surface';shell.append(target);this.target=target;const silhouette=document.createElement('img');silhouette.src='assets/art/'+picture.cards[0].image;silhouette.className='assembly-silhouette';silhouette.alt='तस्वीर की छाया';silhouette.draggable=false;target.append(silhouette);
  this.zones=[];this.sources=[];
  for(let id=0;id<3;id++){
   const zone=document.createElement('button');zone.type='button';zone.className='assembly-zone';zone.style.top=`${id*100/3}%`;zone.setAttribute('aria-label',picture.targets[id]+' का टुकड़ा यहाँ रखो');this.zones[id]=zone;target.append(zone);
  }
  const guides=document.createElement('div');guides.className='assembly-guides';guides.setAttribute('aria-hidden','true');for(let i=1;i<3;i++){const line=document.createElement('span');line.style.top=`${i*100/3}%`;guides.append(line);}target.append(guides);
  const tray=document.createElement('div');tray.className='assembly-tray';tray.setAttribute('aria-label','तस्वीर के तीन टुकड़े');element.append(tray);
  for(const id of shuffledSections(random)){
   const card=document.createElement('button');card.type='button';card.className='assembly-choice';card.setAttribute('aria-label',`तस्वीर का ${picture.targets[id]} का टुकड़ा। Drag this piece onto its matching shadow.`);card.setAttribute('aria-pressed','false');card.append(this.art(id));const grip=document.createElement('span');grip.className='assembly-grip';grip.textContent='⠿';grip.setAttribute('aria-hidden','true');card.append(grip);tray.append(card);this.sources[id]=card;
   card.addEventListener('pointerdown',e=>this.begin(e,id));card.addEventListener('pointermove',e=>this.move(e));card.addEventListener('pointerup',e=>this.end(e));card.addEventListener('pointercancel',()=>this.cancelDrag());card.addEventListener('lostpointercapture',()=>this.cancelDrag());
   card.addEventListener('keydown',e=>{if(e.key==='Escape'){this.selected=null;this.updateSelection();}});
  }
  this.zones.forEach((zone,id)=>zone.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();this.zones[Math.max(0,Math.min(2,id+(e.key==='ArrowDown'?1:-1)))].focus();}else if(e.key==='Escape'){const selected=this.selected;this.selected=null;this.updateSelection();if(selected!==null)this.sources[selected].focus();}}));
  const arrow=document.createElement('span');arrow.className='assembly-direction';arrow.textContent='←';arrow.setAttribute('aria-hidden','true');element.append(arrow);
 }
 art(id){const frame=document.createElement('span');frame.className='assembly-section';const image=document.createElement('img');image.src='assets/art/'+this.picture.cards[0].image;image.alt='';image.draggable=false;image.style.top=`-${id*100}%`;frame.append(image);return frame;}
 allowed(){return !this.destroyed&&!this.isPaused()&&this.placed.size<3;}
 updateSelection(){this.sources.forEach((source,id)=>{source.classList.toggle('selected',id===this.selected);source.setAttribute('aria-pressed',String(id===this.selected));});this.target.classList.toggle('awaiting-piece',this.selected!==null);}
 begin(e,id){if(!this.allowed()||this.placed.has(id)||e.button!==0)return;e.preventDefault();this.onActivity();this.cancelDrag();const card=this.sources[id];card.focus({preventScroll:true});this.drag={id,pointer:e.pointerId,x:e.clientX,y:e.clientY,moved:false};card.setPointerCapture(e.pointerId);}
 move(e){const drag=this.drag;if(!drag||drag.pointer!==e.pointerId)return;if(!this.allowed()){this.cancelDrag();return;}const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.moved&&Math.hypot(dx,dy)<7)return;if(!drag.moved){drag.moved=true;const rect=this.sources[drag.id].getBoundingClientRect();const ghost=this.sources[drag.id].cloneNode(true);ghost.className='assembly-ghost';ghost.setAttribute('aria-hidden','true');ghost.removeAttribute('aria-label');ghost.tabIndex=-1;Object.assign(ghost.style,{left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px'});document.body.append(ghost);this.ghost=ghost;this.selected=drag.id;this.updateSelection();}
  this.ghost.style.transform=`translate(${dx}px,${dy}px)`;const rect=this.target.getBoundingClientRect();const zone=e.clientX>=rect.left&&e.clientX<=rect.right?sectionAt(e.clientY,rect):-1;this.zones.forEach((z,i)=>z.classList.toggle('drop-active',zone===i&&!this.placed.has(i)));
 }
 end(e){const drag=this.drag;if(!drag||drag.pointer!==e.pointerId)return;const rect=this.target.getBoundingClientRect();const zone=e.clientX>=rect.left&&e.clientX<=rect.right?sectionAt(e.clientY,rect):-1;this.cancelDrag();if(!this.allowed())return;if(drag.moved||Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>7){if(zone>=0)this.place(drag.id,zone);}}
 cancelDrag(){this.ghost?.remove();this.ghost=null;this.drag=null;this.selected=null;this.updateSelection();this.zones.forEach(z=>z.classList.remove('drop-active'));}
 place(id,zone){if(!this.allowed()||this.placed.has(id)||this.placed.has(zone))return;this.onActivity();if(id!==zone){this.misses++;this.onWrong();this.sound('tap');this.tell('दूसरी जगह कोशिश करो।',{speak:false});if(this.misses>=2){this.zones[id].classList.add('hint');this.timers.push(setTimeout(()=>this.zones[id].classList.remove('hint'),2400));}return;}
  this.placed.add(id);this.misses=0;this.selected=null;this.updateSelection();const source=this.sources[id];source.disabled=true;source.classList.add('used');this.zones[id].append(this.art(id));this.zones[id].classList.add('filled');this.zones[id].disabled=true;this.zones[id].classList.remove('hint');this.sound('swap');this.progress.setAttribute('aria-label',`तीन में से ${this.placed.size} टुकड़े लगे`);[...this.progress.children].forEach((dot,i)=>dot.classList.toggle('earned',i<this.placed.size));
  if(this.placed.size===3){this.element.classList.add('assembly-complete');const whole=document.createElement('img');whole.className='assembly-full-image';whole.src='assets/art/'+this.picture.cards[0].image;whole.alt=this.picture.item.name;whole.draggable=false;this.target.append(whole);this.onComplete();}else{this.tell('सही! ✓',{speak:false});this.onMatch();const next=this.sources.find(s=>!s.disabled);next?.focus({preventScroll:true});}
 }
 destroy(){this.destroyed=true;this.cancelDrag();this.timers.forEach(clearTimeout);}
}
