// One readable challenge, three choices, then a quiet handoff to the next.
// Existing answer validation and connection input remain owned by VariantRound.
import {ConnectionGuide} from './connection-guide.mjs';
export class ConnectionLevel {
 constructor(round,data){
  this.round=round;this.sources=[...round.left.children];this.choices=[...round.right.children];
  this.items=new Map(data.left.map(p=>[p.key,p.left]));this.animations=new Set();this.motion=matchMedia('(prefers-reduced-motion: reduce)');this.phase='question';this.busy=false;this.timer=0;this.remaining=0;
  round.body.classList.add('focused-level');round.left.classList.add('challenge-prompts');round.right.classList.add('challenge-choices');
  this.collection=document.createElement('div');this.collection.className='challenge-collection';this.collection.setAttribute('role','group');this.collection.setAttribute('aria-label','Completed matches');
  const tray=new Image();tray.className='collection-tray-art';tray.src='assets/art/toy-board/collection-tray.webp';tray.alt='';tray.draggable=false;tray.setAttribute('aria-hidden','true');this.collection.append(tray);
  // Pocket centres measured from the native tray artwork, not an assumed grid.
  this.seats=this.sources.map((_,i)=>{const seat=document.createElement('div');seat.className='collection-seat';seat.dataset.seat=i;seat.style.setProperty('--seat-x',[20.35,49.82,79.19][i]+'%');seat.style.setProperty('--seat-y',[48.14,48.07,48.07][i]+'%');this.collection.append(seat);return seat;});
  round.body.append(this.collection);
  this.sources.forEach((b,i)=>{b.hidden=true;b.dataset.levelIndex=i;});
  this.guide=new ConnectionGuide(this);
  this.activate(this.sources[0],false);this.guide.schedule(1400);
  const dialog=document.getElementById('pause-dialog'),stage=round.element.closest('.game');
  this.observer=new MutationObserver(()=>this.sync());if(dialog)this.observer.observe(dialog,{attributes:true,attributeFilter:['open']});if(stage)this.observer.observe(stage,{attributes:true,attributeFilter:['inert']});
  round.listen(document,'visibilitychange',()=>this.sync());
  round.listen(this.motion,'change',()=>{if(this.motion.matches){for(const a of this.animations)a.cancel();this.animations.clear();}});
  round.listen(window,'resize',()=>{for(const a of this.animations)a.cancel();this.animations.clear();this.round.drawLines();});
 }
 animate(node,frames,options){if(this.motion.matches||this.round.isPaused())return;const a=node.animate(frames,options);this.animations.add(a);a.finished.catch(()=>{}).finally(()=>this.animations.delete(a));return a;}
 activate(button,enter=true){
  this.current=button;button.hidden=false;button.classList.add('level-current');button.setAttribute('aria-current','step');
  this.phase='question';this.busy=false;this.round.body.setAttribute('aria-busy','false');
  this.round.selected={button,key:button.dataset.source,item:this.items.get(button.dataset.source)};
  this.round.feedback.textContent=`Question ${this.round.answers.size+1} of ${this.sources.length}. Find the match for ${button.getAttribute('aria-label')}.`;
  if(enter){this.round.onActivity();this.animate(button,[{opacity:0,scale:'.94'},{opacity:1,scale:'1'}],{duration:220,easing:'cubic-bezier(.2,.7,.3,1)'});}
  this.round.drawLines();
  this.guide?.schedule();
 }
 confirm(){
  this.guide.stop();
  this.busy=true;this.phase='confirm';this.round.body.setAttribute('aria-busy','true');
  if(this.round.answers.size===this.sources.length){this.phase='complete';this.round.body.setAttribute('aria-busy','false');this.collectFinalCopy();return;}
  this.remaining=this.motion.matches?300:750;this.schedule();
 }
 schedule(){if(this.timer||this.phase!=='confirm'||this.round.isPaused())return;this.started=performance.now();this.timer=setTimeout(()=>{this.timer=0;this.remaining=0;if(this.round.isPaused())return;this.advance();},this.remaining);}
 advance(){
  if(this.round.destroyed||this.phase!=='confirm')return;
  const old=this.current,before=this.collectionOrigin(old);old.classList.remove('level-current','selected','hint-pair','toy-pressed');old.classList.add('level-kept');old.removeAttribute('aria-current');this.collectionArt(old,old.dataset.source);this.seats[Number(old.dataset.levelIndex)].append(old);
  const next=this.sources.find(b=>!b.disabled);
  if(!next){this.phase='complete';return;}
  this.activate(next);
  this.flyToSeat(old,before);
  if(this.choices.includes(document.activeElement))next.focus({preventScroll:true});
 }
 collectionOrigin(button){const result=this.choices.find(b=>b.dataset.target===button.dataset.source);if(['word-picture','count-connect'].includes(this.round.spec.id)&&result)return result.getBoundingClientRect();const b=button.getBoundingClientRect(),size=Math.min(b.width,b.height)*.72;return{x:b.x+(b.width-size)/2,y:b.y+(b.height-size)/2,width:size,height:size};}
 collectionArt(button,key){if(!['word-picture','count-connect'].includes(this.round.spec.id))return;const result=this.choices.find(b=>b.dataset.target===key);if(result?.firstElementChild){button.replaceChildren(result.firstElementChild.cloneNode(true));button.setAttribute('aria-label','Completed: '+result.getAttribute('aria-label'));}}
 flyToSeat(button,before,copy=false){const after=button.getBoundingClientRect(),dx=(before.x+before.width/2)-(after.x+after.width/2),dy=(before.y+before.height/2)-(after.y+after.height/2);const start={transform:`translate(${dx}px,${dy}px) scale(${before.width/after.width})`,opacity:copy?0:1};this.animate(button,[start,{opacity:1,offset:.2},{transform:'translate(0,0) scale(1)',opacity:1}],{duration:320,delay:copy?100:0,fill:'backwards',easing:'cubic-bezier(.2,.7,.3,1)'});}
 collectFinalCopy(){if(this.finalCopy)return;const source=this.current,key=source.dataset.source,before=this.collectionOrigin(source),copy=source.cloneNode(true);copy.classList.remove('level-current','selected','hint-pair','toy-pressed');copy.classList.add('level-kept','level-final-copy');copy.removeAttribute('data-source');copy.removeAttribute('aria-current');copy.setAttribute('aria-hidden','true');copy.tabIndex=-1;copy.disabled=true;this.collectionArt(copy,key);this.seats[Number(source.dataset.levelIndex)].append(copy);this.finalCopy=copy;this.flyToSeat(copy,before,true);}
 pause(){this.guide.stop();if(this.timer){clearTimeout(this.timer);this.timer=0;this.remaining=Math.max(0,this.remaining-(performance.now()-this.started));}for(const a of this.animations)a.pause();}
 resume(){for(const a of this.animations)a.play();this.schedule();this.guide.schedule();}
 sync(){if(this.round.isPaused())this.pause();else this.resume();}
 destroy(){this.guide.destroy();clearTimeout(this.timer);this.timer=0;this.observer.disconnect();for(const a of this.animations)a.cancel();this.animations.clear();}
}
