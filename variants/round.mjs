import{LearningVoice}from'../learning-voice.js?v=one-voice-3';
import{recordingFor}from'../voice-cues.js?v=lip-sync-40';
import{renderLearningType}from'../learning-type.mjs';
import{PairConnections}from'./pair-connections.mjs?v=2';
import{ConnectionLevel}from'./connection-level.mjs?v=2';
import{StickerStudio}from'./sticker-studio.mjs?v=5';
import{VARIANTS,STORIES,matchContent,freshMatchContent,shuffled,randomFor}from'./content.mjs';
import{artNode}from'./art.mjs';
import{ProductionPlayer}from'../production-player.mjs';
import{letterClipById}from'../animation-studio/letter-clips.mjs';
import{FoodChoices}from'./food-choices.mjs?v=smooth-6';
import{positionFoodDrag}from'./feeding-drag.mjs';
// Recorded Hinglish voice use (recorded-only: an id without a file stays silent).
// Help cycles through the game's own hint, then how to tap, then how to draw a line.
const HINT_VOICE={'count-connect':'count_connect_help','equal-groups':'equal_help','colour-match':'colour_help','letter-picture':'first_letter_help','letter-case':'case_help','word-picture':'connect_tap','accessory-grid':'sticker_help'};
const WIN_VOICE={'count-connect':['numbers_win_01','numbers_win_02'],'equal-groups':['numbers_win_02','numbers_win_01'],'letter-case':['letters_win_01','letters_win_02'],'letter-picture':['letters_win_02','letters_win_01'],'word-picture':['praise_tada','small_success_02'],'colour-match':['praise_tada','small_success_02'],'accessory-grid':['praise_tada','praise_careful']};
// One short line per correct answer (never stacked); the final answer gets the win line instead.
const PRAISE=['small_success_01','praise_careful','small_success_02','praise_tada','small_success_03','small_success_04'];
let praiseTurn=0,winTurn=0;
export class VariantRound{
 constructor({element,picture,director,reduced=false,isPaused=()=>false,isSoundOn=()=>true,sound=()=>{},onActivity=()=>{},onWrong=()=>{},onMatch=()=>{},onComplete=()=>{},onSpeaking=on=>director?.setSpeaking?.(on)}){Object.assign(this,{element,picture,director,reduced,isPaused,isSoundOn,sound,onSpeaking,onActivity,onWrong,onMatch,onComplete});this.spec=VARIANTS.find(v=>v.id===picture.variant);this.random=randomFor(2281+picture.round*71);this.voice=new LearningVoice({onStart:()=>this.onSpeaking(true),onEnd:()=>this.onSpeaking(false)});this.answers=new Set();this.lines=[];this.selected=null;this.destroyed=false;this.complete=false;this.abort=new AbortController();this.player=new ProductionPlayer({director,container:element,paused:isPaused,reduced,narrate:text=>{if(this.feeding)this.feedback.textContent=text;this.narrate(text)}});this.build()}
 listen(node,event,fn){node.addEventListener(event,fn,{signal:this.abort.signal})}
 text(tag,className,text){const node=document.createElement(tag);node.className=className;node.textContent=text;return node}
 build(){const root=this.element;root.replaceChildren();root.className='board variant-board';root.setAttribute('aria-label',this.spec.title);root.dataset.variant=this.spec.id;const heading=this.text('h1','variant-heading',this.spec.title),instruction=this.text('p','variant-instruction',this.spec.rule);this.feedback=this.text('p','variant-feedback','');this.feedback.setAttribute('role','status');const hear=this.text('button','variant-hear','Hear it');hear.type='button';hear.hidden=true;hear.setAttribute('aria-label','Hear the instructions');this.listen(hear,'click',()=>{this.onActivity();if(this.feeding){if(this.feeding.pending)return;this.feeding.hint();this.narrate(this.feedback.textContent)}else this.narrate(this.spec.rule)});root.append(heading,instruction,hear);this.body=document.createElement('div');this.body.className='variant-body';root.append(this.body,this.feedback);
  if(this.spec.id==='food-sort')this.feeding=new FoodChoices(this);else if(this.spec.id==='accessory-grid')this.buildGrid();else if(this.spec.id==='story-order')this.buildStory();else this.buildPairs();
 }
 button(item,{label=item.label,showLabel=false}={}){const b=document.createElement('button');b.type='button';b.className='variant-card';b.setAttribute('aria-label',label);b.append(artNode(item));if(item.kind==='text')b.style.setProperty('--word-length',String(item.text.length));if(showLabel)b.append(this.text('span','variant-label',item.label));return b}
 active(){return!this.destroyed&&!this.complete&&!this.focus?.busy&&!this.isPaused()}
 select(button,key,item){if(!this.active()||button.disabled)return;this.onActivity();this.sound('select');this.body.querySelectorAll('.selected').forEach(n=>n.classList.remove('selected'));button.classList.add('selected');this.selected={button,key,item};this.sticker?.select(item);if(item.kind==='text')this.narrate(item.label);this.feedback.textContent='Now choose its match.'}
 source(button,key,item){
  if(this.connections){this.connections.bindSource(button,key,item);return;}
  if(item.kind!=='utensil')button.dataset.source=key;
  this.listen(button,'click',()=>item.kind==='utensil'?this.feeding.selectTool(item.tool):this.select(button,key,item));
  this.listen(button,'pointerdown',event=>{
   if(!this.active()||this.feeding?.pending||button.disabled||event.button!==0)return;
   this.drag={button,key,item,x:event.clientX,y:event.clientY,id:event.pointerId,moved:false};
   button.setPointerCapture?.(event.pointerId);
  });
  this.listen(button,'pointermove',event=>{
   const d=this.drag;if(!d||d.id!==event.pointerId)return;
   if(Math.hypot(event.clientX-d.x,event.clientY-d.y)>8)d.moved=true;
   if(!d.moved)return;
   event.preventDefault();
   this.dragPoint={clientX:event.clientX,clientY:event.clientY,pointerId:event.pointerId};
   if(!this.dragFrame)this.dragFrame=requestAnimationFrame(()=>{this.dragFrame=null;this.flushDrag()});
  });
  this.listen(button,'pointerup',event=>{
   const d=this.drag;if(!d||d.id!==event.pointerId)return;
   if(d.moved){this.dragPoint={clientX:event.clientX,clientY:event.clientY,pointerId:event.pointerId};this.flushDrag();}
   this.cancelDrag();
   if(d.moved){if(this.feeding){this.feeding.drop(item,button,event.clientX,event.clientY);return;}this.select(button,key,item);const target=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-target]');if(target&&this.body.contains(target))target.click();}
  });
  this.listen(button,'pointercancel',()=>this.cancelDrag());
  this.listen(button,'lostpointercapture',()=>{if(this.drag?.button===button)this.cancelDrag();});
 }
 flushDrag(){cancelAnimationFrame(this.dragFrame);this.dragFrame=null;const event=this.dragPoint;this.dragPoint=null;if(event)this.paintDrag(event);}
 paintDrag(event){const d=this.drag;if(!d||d.id!==event.pointerId)return;const{item,button}=d;
   const feeding=this.spec.id==='food-sort'&&['food','utensil'].includes(item.kind);if(feeding)this.feeding.trackDrag(item,event.clientX,event.clientY);
   if(!this.ghost){
    if(feeding){this.ghost=this.feeding.createDrag(item,button);button.classList.add('food-being-dragged');}
    else{this.ghost=button.cloneNode(true);this.ghost.classList.add('variant-drag-ghost');this.ghost.setAttribute('aria-hidden','true');this.ghost.style.width=button.getBoundingClientRect().width+'px';}
    document.body.append(this.ghost);
   }
   if(feeding)positionFoodDrag(this.ghost,event.clientX,event.clientY,this.feeding.mouthBounds());
   else{this.ghost.style.left=event.clientX+'px';this.ghost.style.top=event.clientY+'px';}
 }
 cancelDrag(){cancelAnimationFrame(this.dragFrame);this.dragFrame=null;this.dragPoint=null;this.connections?.cancel();this.drag?.button.classList.remove('food-being-dragged');this.feeding?.releaseFood();this.ghost?.remove();this.ghost=null;this.drag=null}
 wrong(message='Have another look. You can try again.'){this.sound('wrong');this.onWrong();if(!this.feeding){this.misses=(this.misses??0)+1;this.narrate(this.misses===1?'retry_01':this.misses===2?(HINT_VOICE[this.spec.id]??'retry_02'):'clue_offer');if(this.misses>=3)this.focus?.guide?.show?.();}this.feedback.textContent=message;void this.player.play(letterClipById.get('LM04')).catch(()=>{})}
 acknowledge(button,notify=true){button.classList.remove('selected');button.classList.add('matched');button.disabled=true;if(notify){this.sound('match');this.onMatch();void this.player.play(letterClipById.get('LM03')).catch(()=>{})}}
 done(){if(this.complete||this.destroyed)return;this.complete=true;this.cancelDrag();if(!this.feeding){this.player.stop();const win=WIN_VOICE[this.spec.id];if(win)this.narrate(win[winTurn++%win.length]);}this.feedback.textContent='You did it!';this.onComplete()}
 accessoryResult(item){const action={glasses:'A02',cap:'A03',helmet:'A04'}[item.accessory];this.feedback.textContent='Let’s see how it fits!';void this.player.play(action,{scene:true,caption:'A friend with '+item.accessory,context:{friendType:item.friend},onComplete:()=>this.done()})}
 buildPairs(){const data=this.picture.content??=freshMatchContent(this.spec.id,this.picture.round);this.columns();this.connections=new PairConnections(this);this.pairTotal=data.pairs.length;for(const p of data.left){const b=this.button(p.left);this.source(b,p.key,p.left);this.left.append(b)}for(const p of data.right){const b=this.button(p.right);b.dataset.target=p.key;this.listen(b,'click',()=>this.tryPair(b,p.key));this.right.append(b)}this.focus=new ConnectionLevel(this,data);this.connectObserver=new ResizeObserver(()=>this.drawLines());this.connectObserver.observe(this.body)}
 columns(){this.body.classList.add('variant-columns');this.left=document.createElement('div');this.right=document.createElement('div');this.left.className='variant-column';this.right.className='variant-column';this.lineSvg=document.createElementNS('http://www.w3.org/2000/svg','svg');this.lineSvg.classList.add('variant-lines');this.lineSvg.setAttribute('aria-hidden','true');this.body.append(this.lineSvg,this.left,this.right)}
 tryPair(target,key){if(!this.active()||target.disabled)return;this.onActivity();if(!this.selected){this.feedback.textContent='Choose a picture or word on the left first.';return}const chosen=this.selected;if(chosen.key!==key){this.connections?.reject(chosen.button,target);this.wrong();return}this.connections?.clearFailure();this.acknowledge(chosen.button);this.acknowledge(target,false);this.answers.add(key);if(this.answers.size<this.pairTotal)this.praise(target);this.lines.push([chosen.button,target]);this.selected=null;this.drawLines();this.feedback.textContent=`${this.answers.size} of ${this.pairTotal} pairs found`;this.focus?.confirm();if(this.answers.size===this.pairTotal){if(this.spec.id==='accessory-pairs')this.accessoryResult(chosen.item);else this.done()}}
 drawLines(){if(this.connections){this.connections.render();return;}if(!this.lineSvg)return;const box=this.body.getBoundingClientRect();this.lineSvg.replaceChildren();this.lineSvg.setAttribute('viewBox',`0 0 ${box.width||1} ${box.height||1}`);for(const[a,b]of this.lines){const l=a.getBoundingClientRect(),r=b.getBoundingClientRect(),path=document.createElementNS('http://www.w3.org/2000/svg','path'),x1=l.right-box.left,y1=l.top+l.height/2-box.top,x2=r.left-box.left,y2=r.top+r.height/2-box.top;path.setAttribute('d',`M${x1} ${y1} C${x1+24} ${y1},${x2-24} ${y2},${x2} ${y2}`);this.lineSvg.append(path)}}
 buildGrid(){this.sticker=new StickerStudio(this);}
 buildStory(){this.story=STORIES[this.picture.round%STORIES.length];this.body.classList.add('story-order-board');const slots=document.createElement('div'),tray=document.createElement('div');slots.className='story-slots';tray.className='story-tray';this.body.append(slots,tray);this.story.steps.forEach((step,index)=>{const b=this.text('button','story-slot',String(index+1));renderLearningType(b,index+1);b.type='button';b.dataset.target=step.key;b.setAttribute('aria-label',['First','Next','Last'][index]);this.listen(b,'click',()=>{if(!this.active()||b.disabled||!this.selected)return;if(this.selected.key!==step.key){this.wrong('Think about what happens '+['first','next','last'][index]+'.');return}b.replaceChildren(artNode(this.selected.item),this.text('span','variant-label',step.label));this.acknowledge(this.selected.button);this.acknowledge(b,false);this.answers.add(step.key);this.selected=null;if(this.answers.size===3){this.feedback.textContent='Let’s watch the whole story!';void this.player.play(this.story.id,{scene:true,caption:this.story.title,onComplete:()=>this.done()})}});slots.append(b)});let steps=shuffled(this.story.steps,this.random);if(steps.every((s,i)=>s.key===this.story.steps[i].key))steps=[steps[1],steps[2],steps[0]];for(const step of steps){const item={...step,kind:'story'},b=this.button(item,{showLabel:true});this.source(b,step.key,item);tray.append(b)}}
 hint(){if(!this.active())return;this.focus?.guide.show();if(this.feeding){this.feeding.hint();return}this.feedback.textContent=this.spec.rule;this.narrate(this.hintVoice());const source=[...this.body.querySelectorAll('[data-source]')].find(b=>!b.disabled),target=source?[...this.body.querySelectorAll('[data-target]')].find(b=>!b.disabled&&b.dataset.target===source.dataset.source):null;if(source&&target){this.body.querySelectorAll('.hint-pair').forEach(n=>n.classList.remove('hint-pair'));source.classList.add('hint-pair');target.classList.add('hint-pair');clearTimeout(this.hintTimer);this.hintTimer=setTimeout(()=>{source.classList.remove('hint-pair');target.classList.remove('hint-pair')},1800)}void this.player.play(this.spec.id==='accessory-pairs'?'G01':this.spec.hint).catch(()=>{})}
 narrateSequence(list,options={}){this.lastNarration=list.at(-1);if(!this.isSoundOn()){this.voice.cancel();return;}const ids=list.filter(t=>recordingFor(t));if(!ids.length)return;this.voice.setEnabled(true);this.voice.unlock();this.voice.saySequence(ids,options)}
 narrate(text,options={}){this.lastNarration=text;if(!this.isSoundOn()){this.voice.cancel();return;}if(!recordingFor(text))return;this.voice.setEnabled(true);this.voice.unlock();this.voice.say(text,options)}
 praise(target){if(this.feeding)return;const colour=this.spec.id==='colour-match'?String(target?.getAttribute('aria-label')??target?.textContent??'').match(/\b(red|green|orange|yellow)\b/i)?.[1]?.toLowerCase():null;this.narrate(colour&&recordingFor('colour_'+colour)?'colour_'+colour:PRAISE[praiseTurn++%PRAISE.length])}
 hintVoice(){const list=this.spec.id==='accessory-grid'?['sticker_help']:[HINT_VOICE[this.spec.id],'connect_tap','connect_drag'].filter(Boolean);this.hintTurn=(this.hintTurn??-1)+1;return list[this.hintTurn%list.length]}
 pause(){this.focus?.pause();this.feeding?.suspendWaiting();this.cancelDrag();this.voice.cancel()}
 resume(){this.focus?.resume()}
 setSound(on){this.voice.setEnabled(on);if(!on)this.feeding?.waitVoice?.stop()}
 destroy(){this.destroyed=true;this.focus?.destroy();this.feeding?.destroy();this.sticker?.destroy();this.connections?.destroy();clearTimeout(this.hintTimer);this.abort.abort();this.cancelDrag();this.connectObserver?.disconnect();this.voice.cancel();this.player.destroy()}
}
