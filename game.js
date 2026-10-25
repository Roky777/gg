import {syncLayout} from './responsive-layout.js?v=landscape-38';
import {CompanionPose} from './companion-pose.js?v=landscape-38';
import {PlayFlow,ModeDeck} from './play-flow.js?v=landscape-38';
import {solved,swap,scramble,slotAt,swapFeedback} from './model.js?v=landscape-38';
import {MascotDirector,CLIPS} from './mascot-director.js?v=landscape-38';
import {GameAudio} from './game-audio.js?v=landscape-38';
import {makeBoard} from './puzzle-generator.js?v=landscape-38';
import {LearningVoice} from './learning-voice.js?v=landscape-38';
import {AssemblyRound,createAssemblyBoard} from './assembly-game.js?v=landscape-38';
import {AssemblyDeck} from './assembly-catalog.js?v=landscape-38';
import {CountingRound,makeCountingBoard,COUNT_WORDS} from './counting-game.js?v=landscape-38';
import {RoundBanner} from './round-banner.js?v=landscape-38';
import {DifferenceRound,createDifferenceBoard} from './differences-game.js?v=landscape-38';
const $=id=>document.getElementById(id),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const director=new MascotDirector($('mascot'),CLIPS,{reduced});
const companion=new CompanionPose({reduced});director.setPoseModifier((skeleton,frame)=>companion.apply(skeleton,frame));
let order=[1,2,0],pieces=[],drag=null,selected=null,done=false,busy=false,roundToken=0,soundOn=true,settle=null,celebration=null;
const pictureImages=new Map(),pictureLoads=new Map();
const assemblyDeck=new AssemblyDeck();
let activeRound=null,assemblyEnabled=false,countingEnabled=false,countVoiceRow=null,groupWins=0,differencesEnabled=false,differenceDeck=null;
const roundBanner=new RoundBanner($('round-banner'),$('round-banner-title'));
let bannerRound=-1;
function introduce(){
 if(bannerRound!==roundToken){roundBanner.show(topic);bannerRound=roundToken;}
 flow.offerIntro();
}

const assemblyOnly=new URLSearchParams(location.search).get('game')==='assembly';
const countingOnly=new URLSearchParams(location.search).get('game')==='counting';
const differencesOnly=new URLSearchParams(location.search).get('game')==='differences';
async function loadPicture(pic){
 const loaded=await Promise.all(pic.cards.map(async card=>{if(pictureImages.has(card.image))return pictureImages.get(card.image);let pending=pictureLoads.get(card.image);if(!pending){pending=(async()=>{const image=new Image();image.src=`assets/art/${card.image}`;await image.decode();pictureImages.set(card.image,image);return image;})();pictureLoads.set(card.image,pending);}try{return await pending;}finally{pictureLoads.delete(card.image);}}));return loaded;
}
let idleTimer=null,reactionCount=0,idleCount=0,tapCount=0;
let wins=0,topic='letters',voiceUnlocked=false,lastSpoken='',completed=new Set(),roundCount=0,navigationLoading=false,currentPicture=null,letterWins=0,numberWins=0,lastTopic=null,recentBoards=[];
try{const saved=JSON.parse(localStorage.getItem('sparky-learning-pictures-v1')||'[]');if(Array.isArray(saved))completed=new Set(saved.filter(id=>typeof id==='string').slice(-200));}catch{}

const voice=new LearningVoice({onStart(){gameAudio.setSpeaking(true);director.setSpeaking(true);},onEnd(){gameAudio.setSpeaking(false);director.setSpeaking(false);},onUnavailable(){$('voice-note').textContent='इस ब्राउज़र में आवाज़ उपलब्ध नहीं है।';}});
function tell(message,{speak=true,display=message}={}){lastSpoken=message;$('learning-caption').textContent=display;if(speak&&voiceUnlocked&&soundOn)voice.say(message);}
function saveLearning(){try{localStorage.setItem('sparky-learning-pictures-v1',JSON.stringify([...completed]));}catch{}}
const modeDeck=new ModeDeck();
function newBoard(){
 const available=['letters','numbers',...(assemblyEnabled?['assembly']:[]),...(countingEnabled?['count-groups']:[]),...(differencesEnabled?['differences']:[])];
 const requestedMode=new URLSearchParams(location.search).get('game');
 const mode=['letters','numbers'].includes(requestedMode)?requestedMode:assemblyOnly&&assemblyEnabled?'assembly':countingOnly&&countingEnabled?'count-groups':differencesOnly&&differencesEnabled?'differences':modeDeck.next(available);
 const board=mode==='differences'?createDifferenceBoard(differenceDeck.next(),{swap:Math.random()<.5}):mode==='count-groups'?makeCountingBoard({wins:groupWins,recent:recentBoards,maxQuantity:Math.min(innerWidth,innerHeight)<450?5:10}):mode==='assembly'?createAssemblyBoard(assemblyDeck.next()):makeBoard({letterWins,numberWins,lastTopic,recent:recentBoards,preferredTopic:mode});
 lastTopic=board.topic;recentBoards.push(board.id);recentBoards=recentBoards.slice(-12);return board;
}

function updateLearningUI(){$('progress').textContent=`★ ${wins}`;}
async function advance(){
 if(navigationLoading)return;navigationLoading=true;flow.cancel();cancelReactions();const next=newBoard();roundBanner.hide({immediate:true});voice.cancel();clearTimeout(settle);clearDrag();activeRound?.cancelDrag();roundToken++;
 try{await loadPicture(next);roundCount++;sound('next');start(next);syncOrientation();}
 catch(e){busy=false;say('Could not load the next picture. Tap the arrow to try again.');console.error(e);}
 finally{navigationLoading=false;if(!done)introduce();}
}

function cancelReactions(){clearTimeout(idleTimer);director.clearQueue();}
function idleSchedule(){
 flow.activity();clearTimeout(idleTimer);
 if(reduced||done||document.hidden||$('pause-dialog').open)return;
 idleTimer=setTimeout(()=>{
  if(!done&&!busy&&!drag&&selected===null&&!document.hidden&&!$('pause-dialog').open&&director.active==='idle'){if(idleCount===0)companion.act('ponder');idleCount++;}
  idleSchedule();
 },18000);
}

try{soundOn=localStorage.getItem('sparky-swap-sound')!=='off';}catch{}
function say(message){$('status').textContent=message;}
const gameAudio=new GameAudio({enabled:soundOn,element:$('background-music')});
// Browser audio starts only after a real pointer or keyboard interaction.
addEventListener('pointerdown',()=>{if(matchMedia('(orientation:portrait)').matches)return;const first=!voiceUnlocked;voiceUnlocked=true;gameAudio.unlock();if(first&&currentPicture)introduce();},{capture:true});
addEventListener('keydown',()=>{if(matchMedia('(orientation:portrait)').matches)return;const first=!voiceUnlocked;voiceUnlocked=true;gameAudio.unlock();if(first&&currentPicture)introduce();},{capture:true});
function sound(kind='swap'){gameAudio.cue(kind);}
const flow=new PlayFlow({next:()=>{if(done)void advance();},speak:text=>voice.say(text),cheer:cue=>voice.say(cue.text,cue),react:(name,seconds)=>{if(['nod','guide','invite'].includes(name)){companion.act(name==='invite'?'wave':name);}else{companion.faceChild();void director.react(name,{seconds}).catch(()=>{});}},ready:show=>$('next').classList.toggle('round-ready',show),canSpeak:()=>!matchMedia('(orientation:portrait)').matches&&voiceUnlocked&&soundOn&&!document.hidden&&!$('pause-dialog').open&&!navigationLoading});
function attendTo(element){if(!element?.getBoundingClientRect)return;const r=element.getBoundingClientRect(),b=$('board').getBoundingClientRect();if(b.width&&b.height)companion.look((r.left+r.width/2-b.left)/b.width,(r.top+r.height/2-b.top)/b.height);}
$('board').addEventListener('pointerdown',e=>{if(!done)attendTo(e.target.closest('button')||e.target);},{capture:true});
$('board').addEventListener('focusin',e=>{if(!done)attendTo(e.target);});
function layoutArt(){syncLayout($('board'));}
function position(){
 const vertical=currentPicture.axis==='vertical';
 pieces.forEach((piece,id)=>{const slot=order.indexOf(id);piece.style.left=vertical?`${slot*100/3+2}%`:'0';piece.style.top=vertical?'30%':`${slot*100/3}%`;piece.setAttribute('aria-label',`${currentPicture.cards[id].label}, position ${slot+1} of 3; target ${currentPicture.targets[slot]}`);piece.classList.toggle('in-place',slot===id);piece.setAttribute('aria-pressed',String(slot===selected));piece.classList.toggle('selected',slot===selected);});
}
function clearDrag(){if(drag){pieces[drag.id].classList.remove('dragging');pieces[drag.id].style.transform='';drag=null;}pieces.forEach(p=>p.classList.remove('target'));}
function confetti({small=false}={}){
 clearTimeout(celebration);$('confetti').replaceChildren();if(reduced)return;
 for(let i=0;i<(small?12:24);i++){const bit=document.createElement('i');bit.style.setProperty('--x',`${25+Math.random()*60}%`);bit.style.setProperty('--color',['#ffca35','#ff6377','#66d6ed','#8bec55'][i%4]);bit.style.setProperty('--delay',`${Math.random()*.08}s`);$('confetti').append(bit);}
 const token=roundToken;celebration=setTimeout(()=>{if(token===roundToken)$('confetti').replaceChildren();},850);
}
function matchCelebration(){roundBanner.hide({immediate:true});voice.cancel();confetti({small:true});flow.match();sound('friend');}

function finish(){roundBanner.hide({immediate:true});cancelReactions();done=true;wins++;updateLearningUI();completed.add(currentPicture.id);saveLearning();if(topic==='letters')letterWins++;else if(topic==='numbers')numberWins++;else if(topic==='count-groups')groupWins++;voice.cancel();tell('बहुत बढ़िया! ✓',{speak:false});$('task-rule').textContent='Well done! ✓';$('board').classList.add('solved');$('next').disabled=false;say('Well done! A new puzzle is coming. You can also choose Next now.');pieces.forEach(p=>p.disabled=true);flow.complete();sound('win');confetti();}

function exchange(a,b){
 if(navigationLoading||done||busy||$('pause-dialog').open)return;selected=null;clearDrag();
 if(a===b){position();return;}
 idleSchedule();const previous=order;order=swap(order,a,b);const feedback=swapFeedback(previous,order);busy=true;$('board').setAttribute('aria-busy','true');position();sound();say(`Swapped positions ${a+1} and ${b+1}.`);const token=roundToken;
 settle=setTimeout(()=>{if(token!==roundToken)return;busy=false;$('board').setAttribute('aria-busy','false');if(solved(order))finish();else if(feedback==='yes'){matchCelebration();}else if(feedback==='no'){voice.cancel();tell('फिर से कोशिश करो।',{speak:false});if(flow.mistake())showMatchHint();}},reduced?0:160);
}
function showMatchHint(){
 const id=order.find((value,slot)=>value!==slot);if(id===undefined)return;
 const target=$('board').querySelectorAll('.slot-target')[id],card=pieces[id];target?.classList.add('help-target');card.classList.add('help-card');
 setTimeout(()=>{target?.classList.remove('help-target');card.classList.remove('help-card');},1800);
}
function choose(slot){if(navigationLoading||done||busy||$('pause-dialog').open)return;if(selected===null){selected=slot;idleSchedule();sound('select');position();say(`Position ${slot+1} selected. Choose another picture to swap.`);voice.cancel();}else if(selected===slot){selected=null;position();}else exchange(selected,slot);}
function start(index){
 voice.cancel();cancelReactions();clearTimeout(settle);clearTimeout(celebration);clearDrag();activeRound?.destroy();activeRound=null;countVoiceRow=null;idleCount=0;void director.show('idle').catch(()=>{});roundToken++;currentPicture=index;topic=currentPicture.topic;flow.start(topic);companion.clear();if(roundCount<=1){companion.faceChild();companion.act('wave');}else{companion.look(.5,.5);companion.act('guide');}done=false;busy=false;selected=null;order=scramble();const pic=currentPicture,vertical=true;
 $('next').disabled=false;$('board').setAttribute('aria-busy','false');$('board').className='board '+(vertical?'vertical':'horizontal');$('board').setAttribute('aria-label',`${pic.rule} Drag a whole picture onto another to swap their positions.`);$('confetti').replaceChildren();$('board').replaceChildren();pieces=[];
 if(topic==='differences'){
  const token=roundToken;activeRound=new DifferenceRound({element:$('board'),picture:pic,sound,tell,onActivity:idleSchedule,isPaused:()=>navigationLoading||document.hidden||$('pause-dialog').open,onWrong:()=>flow.mistake(),onMatch:matchCelebration,onComplete:()=>{if(token===roundToken&&!done)finish();}});
  updateLearningUI();$('task-rule').textContent=pic.rule;tell(pic.intro,{speak:false});layoutArt();idleSchedule();introduce();say(pic.rule);return;
 }
 if(topic==='count-groups'){
  const token=roundToken;
  activeRound=new CountingRound({element:$('board'),picture:pic,sound,tell,onActivity:idleSchedule,isPaused:()=>navigationLoading||document.hidden||$('pause-dialog').open,onWrong:()=>flow.mistake(),onCount:(ordinal,row)=>{companion.look(.55,(row+.5)/4);companion.act('nod');flow.requestedSpeech();if(!soundOn)return;voiceUnlocked=true;if(countVoiceRow!==row){voice.cancel();countVoiceRow=row;}voice.say(COUNT_WORDS[ordinal],{queue:true,rate:1.05});},onMatch:matchCelebration,onComplete:()=>{if(token===roundToken&&!done)finish();}});
  updateLearningUI();$('task-rule').textContent=pic.rule;tell(pic.intro,{speak:false});layoutArt();idleSchedule();introduce();say(pic.rule);return;
 }
 if(topic==='assembly'){const token=roundToken;activeRound=new AssemblyRound({element:$('board'),picture:pic,director,sound,tell,reduced,onActivity:idleSchedule,isPaused:()=>navigationLoading||document.hidden||$('pause-dialog').open,onWrong:()=>flow.mistake(),onMatch:matchCelebration,onComplete:()=>{if(token===roundToken&&!done)finish();}});updateLearningUI();$('task-rule').textContent=pic.rule;tell(pic.intro,{speak:false});layoutArt();idleSchedule();introduce();say(pic.rule);return;}

 for(let id=0;id<3;id++){
  const card=pic.cards[id],piece=document.createElement('button');piece.className='piece';piece.type='button';piece.style.width='29.333334%';piece.style.height='61%';const grip=document.createElement('span');grip.className='card-grip';grip.setAttribute('aria-hidden','true');piece.append(grip);piece.setAttribute('aria-pressed','false');
  if(topic==='letters'){
   const letter=document.createElement('span');letter.className='card-letter';letter.textContent=card.letter;letter.setAttribute('aria-hidden','true');piece.append(letter);
   const art=document.createElement('img');art.className='card-art';art.src='assets/art/'+card.image;art.alt='';art.draggable=false;piece.append(art);
   const name=document.createElement('span');name.className='card-name';name.textContent=card.label.charAt(0).toUpperCase()+card.label.slice(1);name.lang='en';name.setAttribute('aria-hidden','true');piece.append(name);
  }else{
   const mat=document.createElement('span');mat.className='count-grid';mat.style.setProperty('--rows',String(Math.ceil(card.amount/2)));mat.setAttribute('aria-hidden','true');
   for(let n=0;n<card.amount;n++){const cell=document.createElement('span');cell.className='count-item';if(card.amount%2&&n===card.amount-1)cell.classList.add('odd-last');const image=document.createElement('img');image.src='assets/art/'+card.image;image.alt='';image.draggable=false;cell.append(image);mat.append(cell);}piece.append(mat);
  }
  pieces.push(piece);$('board').append(piece);
  piece.addEventListener('pointerdown',e=>{
   if(navigationLoading||done||busy||$('pause-dialog').open||e.button!==0)return;e.preventDefault();idleSchedule();sound('select');piece.focus({preventScroll:true});drag={id,slot:order.indexOf(id),x:e.clientX,y:e.clientY,pointer:e.pointerId,moved:false,target:order.indexOf(id)};piece.setPointerCapture(e.pointerId);
  });
  piece.addEventListener('pointermove',e=>{if(!drag||drag.id!==id||e.pointerId!==drag.pointer)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>6)drag.moved=true;if(!drag.moved)return;piece.classList.add('dragging');piece.style.transform=`translate(${dx}px,${dy}px)`;const rect=$('board').getBoundingClientRect();drag.target=(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)?drag.slot:slotAt(e.clientX,e.clientY,rect,pic.axis);pieces.forEach((p,n)=>p.classList.toggle('target',n!==id&&order.indexOf(n)===drag.target));});
  piece.addEventListener('pointerup',e=>{if(!drag||drag.id!==id||e.pointerId!==drag.pointer)return;const {slot,target,moved}=drag;clearDrag();if(moved)exchange(slot,target);else choose(slot);});
  piece.addEventListener('pointercancel',clearDrag);piece.addEventListener('lostpointercapture',()=>{if(drag?.id===id)clearDrag();});
  piece.addEventListener('click',e=>{if(e.detail===0)choose(order.indexOf(id));});
  piece.addEventListener('keydown',e=>{const slot=order.indexOf(id);if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const next=Math.max(0,Math.min(2,slot+(['ArrowUp','ArrowLeft'].includes(e.key)?-1:1)));pieces[order[next]].focus();}else if(e.key==='Escape'){selected=null;position();}});
 }
 const targets=document.createElement('div');targets.className='slot-targets';targets.setAttribute('aria-hidden','true');pic.targets.forEach(target=>{const badge=document.createElement('span');badge.className='slot-target';badge.textContent=target;targets.append(badge);});$('board').append(targets);const sockets=document.createElement('div');sockets.className='picture-sockets';sockets.setAttribute('aria-hidden','true');for(let n=0;n<3;n++)sockets.append(document.createElement('span'));$('board').prepend(sockets);
 position();layoutArt();updateLearningUI();$('task-rule').textContent=currentPicture.rule;tell(currentPicture.intro,{speak:false});idleSchedule();introduce();say(pic.rule);
}
function closePause(){$('pause-dialog').close();flow.resume();director.resume();gameAudio.setPaused(false);sound('tap');idleSchedule();}
function pause(){flow.pause();companion.clear();roundBanner.hide({immediate:true});voice.cancel();cancelReactions();clearDrag();activeRound?.cancelDrag();if(!$('pause-dialog').open){sound('tap');gameAudio.setPaused(true);director.pause();$('pause-dialog').showModal();}}
$('mascot-button').onclick=()=>{
 if($('pause-dialog').open||navigationLoading)return;idleSchedule();sound('tap');companion.faceChild();companion.act('guide');flow.requestedSpeech();
 let explanation=currentPicture.intro;
 if(!done&&(topic==='letters'||topic==='numbers')){showMatchHint();explanation=topic==='letters'?'चलो, साथ में देखें। तस्वीर का अक्षर ऊपर ढूँढो।':'इस तस्वीर में कितने हैं? एक-एक करके गिनें।';}
 else if(!done&&topic==='count-groups'){const row=currentPicture.cards.findIndex((_,i)=>!activeRound.answers.has(i));if(row>=0){const helpedRow=activeRound.rows[row];helpedRow.classList.add('count-hint');companion.look(.5,(row+.5)/4);setTimeout(()=>helpedRow.classList.remove('count-hint'),1800);}explanation='तस्वीरों पर टैप करो। हम एक-एक करके गिनेंगे।';}
 else if(!done&&topic==='assembly'){const id=[0,1,2].find(i=>!activeRound.placed.has(i));if(id!==undefined){activeRound.zones[id].classList.add('hint');companion.look(.4,(id+.5)/3);const zone=activeRound.zones[id];setTimeout(()=>zone.classList.remove('hint'),1800);}explanation='छाया देखो। इस आकार वाला टुकड़ा ढूँढते हैं।';}
 else if(!done&&topic==='differences'){companion.look(.5,.4);explanation='एक-एक चीज़ देखो। क्या उसका रंग या आकार बदल गया?';}
 if(soundOn){voiceUnlocked=true;voice.say(done?currentPicture.learn:explanation,{rate:.94,pitch:1.04,volume:.85});}
};
$('exit').onclick=pause;$('resume').onclick=closePause;$('restart').onclick=()=>{closePause();sound('swap');start(currentPicture);};$('pause-dialog').addEventListener('cancel',e=>{e.preventDefault();closePause();});
$('next').onclick=advance;
function muteUI(){$('sound').setAttribute('aria-label',soundOn?'Mute sound':'Turn sound on');$('sound').setAttribute('aria-pressed',String(!soundOn));$('sound').querySelector('img').src=`assets/icons/${soundOn?'sound-on':'sound-off'}.png`;}
$('sound').onclick=()=>{soundOn=!soundOn;try{localStorage.setItem('sparky-swap-sound',soundOn?'on':'off');}catch{}muteUI();gameAudio.setEnabled(soundOn);voice.setEnabled(soundOn);if(soundOn)sound('tap');};muteUI();voice.setEnabled(soundOn);
addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('pause-dialog').open){e.preventDefault();pause();}});
document.addEventListener('visibilitychange',()=>{clearDrag();activeRound?.cancelDrag();gameAudio.setHidden(document.hidden);if(document.hidden){flow.pause();companion.clear();roundBanner.hide({immediate:true});voice.cancel();clearTimeout(idleTimer);director.pause();}else if(!$('pause-dialog').open&&!portraitScreen.matches){director.resume();flow.resume();idleSchedule();}});
const portraitScreen=matchMedia('(orientation:portrait)');
function syncOrientation(){
 const blocked=portraitScreen.matches;
 document.querySelector('.game').inert=blocked;
 if(blocked){flow.pause();companion.clear();voice.cancel();cancelReactions();roundBanner.hide({immediate:true});director.pause();gameAudio.setPaused(true);}
 else if(!document.hidden&&!$('pause-dialog').open){flow.resume();director.resume();gameAudio.setPaused(false);idleSchedule();}
}
const refreshLayout=()=>{clearDrag();activeRound?.cancelDrag();layoutArt();syncOrientation();};
addEventListener('resize',refreshLayout);window.visualViewport?.addEventListener('resize',refreshLayout);
if('ResizeObserver' in window)new ResizeObserver(()=>layoutArt()).observe($('board'));
async function boot(){try{
 await Promise.all([
  (async()=>{try{const response=await fetch('assets/art/assembly/manifest.json?v=landscape-38');if(response.ok){const catalog=await response.json();assemblyEnabled=catalog.ready===true&&catalog.images?.length===40;}}catch{}})(),
  (async()=>{try{const response=await fetch('assets/art/counting/manifest.json?v=landscape-38');if(response.ok){const catalog=await response.json();countingEnabled=catalog.ready===true&&catalog.images?.length===20;}}catch{}})(),
  (async()=>{try{const response=await fetch('assets/art/differences/manifest.json?v=landscape-38');if(response.ok){const catalog=await response.json();differencesEnabled=catalog.ready===true&&catalog.boards?.length===20&&catalog.boards.every(p=>p.images?.length===2&&p.regions?.filter(r=>r.changed).length===3);if(differencesEnabled)differenceDeck=new AssemblyDeck(catalog.boards);}}catch{}})()
 ]);
 const first=newBoard();await Promise.all([director.ready,loadPicture(first)]);await director.show('idle');roundCount=1;start(first);$('loading').hidden=true;syncOrientation();
 }catch(e){$('loading').querySelector('p').textContent='Could not load the game. Please refresh.';console.error(e);}}

boot();
