import{OrderingGuide}from'./ordering-guide.mjs';
let orderingGuide=null;
import{renderLearningType}from'./learning-type.mjs';
import{applySceneBackground,backgroundFor}from'./scene-backgrounds.mjs';
import{GamePlaylist}from'./game-playlist.mjs';
import {cardReadings,bindCardReading} from './card-audio.js?v=polish-52';
import {BreakSchedule,createPlayBreak,makeFunBoard,FUN_KINDS} from './play-breaks.js?v=soil-anchor-55';
import {reviewVoices,pictureVoice,RECORDINGS,recordingFor} from './voice-cues.js?v=lip-sync-40';
import {syncLayout} from './responsive-layout.js?v=board-finish-14';
import {CompanionPose} from './companion-pose.js?v=companion-57';
import {PlayFlow,ModeDeck} from './play-flow.js?v=companion-57';
import {solved,swap,scramble,slotAt,swapFeedback} from './model.js?v=lip-sync-40';
import {MascotDirector,CLIPS} from './mascot-director.js?v=perf-2';
import {GameAudio} from './game-audio.js?v=activities-53';
import {makeBoard} from './puzzle-generator.js?v=drag-only-47';
import {LearningVoice} from './learning-voice.js?v=recorded-only-1';
import {AssemblyRound,createAssemblyBoard} from './assembly-game.js?v=polish-52';
import {AssemblyDeck} from './assembly-catalog.js?v=lip-sync-40';
import {CountingRound,makeCountingBoard,COUNT_WORDS} from './counting-game.js?v=drop-pocket-15';
import {RoundBanner} from './round-banner.js?v=lip-sync-40';
import {DifferenceRound,createDifferenceBoard} from './differences-game.js?v=red-contours-55';
import {VARIANTS,makeVariantBoard} from './variants/content.mjs';
let VariantRoundController=null,variantRoundNumber=0,letterAnimations=null;
async function prepareVariant(picture){if(picture.topic==='variants'&&!VariantRoundController)VariantRoundController=(await import('./variants/round.mjs')).VariantRound;if(picture.topic==='letters'&&!letterAnimations){const{LetterCompanion}=await import('./letter-companion.mjs');letterAnimations=new LetterCompanion({director,companion,reduced});}}
const $=id=>document.getElementById(id),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const director=new MascotDirector($('mascot'),CLIPS,{reduced});
const companion=new CompanionPose({reduced});director.setPoseModifier((skeleton,frame)=>companion.apply(skeleton,frame));
let order=[1,2,0],pieces=[],drag=null,done=false,busy=false,roundToken=0,soundOn=true,settle=null,celebration=null;
const pictureImages=new Map(),pictureLoads=new Map();
let upcomingBoard=null,prefetchTimer=null;
function warmNextRound(){
 clearTimeout(prefetchTimer);
 prefetchTimer=setTimeout(()=>{
  if(document.hidden||navigator.connection?.saveData||upcomingBoard)return;
  upcomingBoard=newBoard();
  // Keep its place in the sequence if preloading fails; Next retries that board.
  void loadPicture(upcomingBoard).catch(()=>{});
 },1200);
}
async function loadOpeningArt(picture){
 // Decode only art used by the opening activity; later modes load on demand.
 const paths=[backgroundFor(picture).image,'toy-controls/shell.webp','toy-board/board.webp'];
 await Promise.all([document.fonts.ready,...paths.map(async path=>{const image=new Image();image.src='assets/art/'+path;await image.decode();})]);
}
const assemblyDeck=new AssemblyDeck();
let activeRound=null,assemblyEnabled=false,countingEnabled=false,countVoiceRow=null,groupWins=0,differencesEnabled=false,differenceDeck=null;
const roundBanner=new RoundBanner($('round-banner'),$('round-banner-title'));
let bannerRound=-1;
const introducedVariants=new Set();
function introduce(){
 // Newer boards: their recorded introduction plays the first time each game appears this session.
 if(currentPicture?.variant){if(currentPicture.variant!=='food-sort'&&!introducedVariants.has(currentPicture.variant)&&voiceUnlocked&&soundOn&&activeRound?.narrate&&!activeRound.complete){introducedVariants.add(currentPicture.variant);activeRound.narrate(currentPicture.rule);}return;}
 if(currentPicture?.fun){if(!activeRound?.announced&&voiceUnlocked&&soundOn&&activeRound){activeRound.announced=true;voice.say(currentPicture.intro,{volume:.85});}return;}
 if(bannerRound!==roundToken){roundBanner.show(topic);bannerRound=roundToken;}
 flow.offerIntro();
}

const playlist=new GamePlaylist();
const isCombinedGame=()=>{const id=new URLSearchParams(location.search).get('game');return!id||id==='all';};
async function loadPicture(pic){
 const loaded=await Promise.all(pic.cards.map(async card=>{if(pictureImages.has(card.image)){const cached=pictureImages.get(card.image);pictureImages.delete(card.image);pictureImages.set(card.image,cached);return cached;}let pending=pictureLoads.get(card.image);if(!pending){pending=(async()=>{const image=new Image();image.src=`assets/art/${card.image}`;await image.decode();pictureImages.set(card.image,image);while(pictureImages.size>24)pictureImages.delete(pictureImages.keys().next().value);return image;})();pictureLoads.set(card.image,pending);}try{return await pending;}finally{pictureLoads.delete(card.image);}}));return loaded;
}
let idleTimer=null,reactionCount=0,idleCount=0,tapCount=0;
let wins=0,topic='letters',voiceUnlocked=false,lastSpoken='',completed=new Set(),roundCount=0,navigationLoading=false,currentPicture=null,letterWins=0,numberWins=0,lastTopic=null,recentBoards=[];
try{const saved=JSON.parse(localStorage.getItem('sparky-learning-pictures-v1')||'[]');if(Array.isArray(saved))completed=new Set(saved.filter(id=>typeof id==='string').slice(-200));}catch{}

let reviewActive=false;
// Two voices (game + board) share Sparky's mouth. One stopping or being cancelled
// must not close his mouth while the other is still talking.
function syncSpeaking(){const on=!!(voice?.current||activeRound?.voice?.current);gameAudio.setSpeaking(on);director.setSpeaking(on);}
const voice=new LearningVoice({onStart(cue){syncSpeaking();const gesture=flow.speechGesture(cue?.category);if(gesture)respond(gesture);},onEnd(){syncSpeaking();if(reviewActive){reviewActive=false;if(!navigationLoading&&!document.hidden&&!screenUnavailable()&&!$('pause-dialog').open)flow.resume();}},onUnavailable(){$('voice-note').textContent='Audio is unavailable in this browser.';}});
// Sparky's mouth follows whichever recorded voice is speaking: the game's, or the board's own
// (board intros, hints, praise and Food Choices lines play through the board voice).
director.setSpeechSource(()=>{const a=voice.speechFrame(),b=activeRound?.voice?.speechFrame?.();return a?.playing?a:b?.playing?b:a??b??null});
function tell(message,{speak=true,display=message}={}){lastSpoken=message;$('learning-caption').textContent=display;if(speak&&voiceUnlocked&&soundOn)voice.say(message);}
function saveLearning(){try{localStorage.setItem('sparky-learning-pictures-v1',JSON.stringify([...completed]));}catch{}}
const modeDeck=new ModeDeck();const breakSchedule=new BreakSchedule(4);
function newBoard(){
 const entry=isCombinedGame()?playlist.next():null;
 const requestedVariant=entry?.id??new URLSearchParams(location.search).get('game');
 const variantId=requestedVariant==='story-order'?'letter-case':requestedVariant;
 if(VARIANTS.some(v=>v.id===variantId)){const board=makeVariantBoard(variantId,entry?.round??variantRoundNumber++);if(entry)board.session=entry;return board;}
 const available=['letters','numbers',...(assemblyEnabled?['assembly']:[]),...(countingEnabled?['count-groups']:[]),...(differencesEnabled?['differences']:[])];
 const requestedMode=entry?.id??new URLSearchParams(location.search).get('game');
 const mode=['letters','numbers'].includes(requestedMode)?requestedMode:requestedMode==='assembly'&&assemblyEnabled?'assembly':requestedMode==='counting'&&countingEnabled?'count-groups':requestedMode==='differences'&&differencesEnabled?'differences':modeDeck.next(available);
 const board=mode==='differences'?createDifferenceBoard(differenceDeck.next(),{swap:Math.random()<.5}):mode==='count-groups'?makeCountingBoard({wins:groupWins,recent:recentBoards,maxQuantity:Math.min(innerWidth,innerHeight)<450?5:10}):mode==='assembly'?createAssemblyBoard(assemblyDeck.next()):makeBoard({letterWins,numberWins,lastTopic,recent:recentBoards,preferredTopic:mode});
 if(entry)board.session=entry;lastTopic=board.topic;recentBoards.push(board.id);recentBoards=recentBoards.slice(-12);return board;
}

function updateLearningUI(){$('progress').textContent=`★ ${wins}`;}
async function advance(){
 if(navigationLoading)return;navigationLoading=true;flow.cancel();cancelReactions();const breakKind=breakSchedule.take(wins);const next=breakKind?makeFunBoard(breakKind):(upcomingBoard||newBoard());if(!breakKind)upcomingBoard=null;clearTimeout(prefetchTimer);roundBanner.hide({immediate:true});voice.cancel();clearTimeout(settle);clearDrag();activeRound?.cancelDrag();roundToken++;
 try{await loadPicture(next);await prepareVariant(next);roundCount++;sound('next');start(next);syncOrientation();}
 catch(e){if(!breakKind)upcomingBoard=next;busy=false;say('Could not load the next picture. Tap the arrow to try again.');console.error(e);}
 finally{navigationLoading=false;activeRound?.focus?.guide.schedule(1400);if(!done)introduce();warmNextRound();}
}

function readCard(picture,card){
 if(navigationLoading||busy||document.hidden||$('pause-dialog').open||!soundOn)return;
 const cues=cardReadings(picture,card);if(!cues.length)return;
 idleSchedule();flow.requestedSpeech();voiceUnlocked=true;voice.unlock();countVoiceRow=null;
 voice.saySequence(cues,{volume:.9});
 if(done&&voice.pending>0){flow.pause();reviewActive=true;}
}

function cancelReactions(){clearTimeout(idleTimer);director.clearQueue();}
function idleSchedule(){
 flow.activity();clearTimeout(idleTimer);
 if(activeRound?.feeding)return;
 if(reduced||done||document.hidden||$('pause-dialog').open)return;
 idleTimer=setTimeout(()=>{
  if(!done&&!busy&&!drag&&!document.hidden&&!$('pause-dialog').open&&director.active==='idle'){if(idleCount===0)companion.act('ponder');idleCount++;}
  idleSchedule();
 },18000);
}

try{soundOn=localStorage.getItem('sparky-swap-sound')!=='off';}catch{}
function say(message){$('status').textContent=message;}
const gameAudio=new GameAudio({enabled:soundOn,element:$('background-music')});
// Browser audio starts only after a real pointer or keyboard interaction.
addEventListener('pointerdown',()=>{if(screenUnavailable())return;const first=!voiceUnlocked;voiceUnlocked=true;voice.unlock();gameAudio.unlock();if(first&&currentPicture)introduce();},{capture:true});
addEventListener('keydown',()=>{if(screenUnavailable())return;const first=!voiceUnlocked;voiceUnlocked=true;voice.unlock();gameAudio.unlock();if(first&&currentPicture)introduce();},{capture:true});
function sound(kind='swap'){gameAudio.cue(kind);}
const flow=new PlayFlow({celebrationDuration:(_topic,text)=>1000*(RECORDINGS[recordingFor(text)]?.duration||0),next:()=>{if(done)void advance();},speak:text=>voice.say(topic==='letters'&&recordingFor(text)?.startsWith('letters_intro')&&currentPicture.targets[0]===currentPicture.targets[0].toLowerCase()?'letters_intro_03':text),cheer:cue=>voice.say(cue.text,cue),react:respond,ready:show=>$('next').classList.toggle('round-ready',show),canSpeak:()=>!screenUnavailable()&&voiceUnlocked&&soundOn&&!document.hidden&&!$('pause-dialog').open&&!navigationLoading});
function respond(name,seconds=1.2){
 if(topic==='letters'&&letterAnimations?.respond(name))return;
 if(['nod','guide','invite','ponder','attend'].includes(name)){
  if(name==='invite')companion.faceChild();else companion.look(.5,.5);
  if(name!=='attend')companion.act(name==='invite'?'wave':name);
 }else{companion.faceChild();void director.react(name,{seconds:Math.max(seconds,director.animations?.get(director.clips[name])?.duration||0)}).catch(()=>{});}
}
function attendTo(element){if(!element?.getBoundingClientRect)return;const r=element.getBoundingClientRect(),b=$('board').getBoundingClientRect();if(b.width&&b.height){const x=(r.left+r.width/2-b.left)/b.width,y=(r.top+r.height/2-b.top)/b.height;companion.look(x,y);if(topic==='letters')letterAnimations?.track(x,y);}}
$('board').addEventListener('pointerdown',e=>{if(!done)attendTo(e.target.closest('button')||e.target);},{capture:true});
$('board').addEventListener('focusin',e=>{if(!done)attendTo(e.target);});
function layoutArt(){syncLayout($('board'));}
function position(){
 const vertical=currentPicture.axis==='vertical';
 pieces.forEach((piece,id)=>{const slot=order.indexOf(id);piece.style.left=vertical?`${slot*100/3+2}%`:'0';piece.style.top=vertical?'30%':`${slot*100/3}%`;piece.setAttribute('aria-label',`${currentPicture.cards[id].label}, position ${slot+1} of 3; target ${currentPicture.targets[slot]}`);piece.classList.toggle('in-place',slot===id);$('board').querySelectorAll('.slot-target')[slot]?.classList.toggle('ordering-home-filled',slot===id);$('board').querySelectorAll('.picture-sockets>span')[slot]?.classList.toggle('ordering-home-filled',slot===id);});
}
function clearDrag(){if(drag){pieces[drag.id].classList.remove('dragging');pieces[drag.id].style.transform='';drag=null;}pieces.forEach(p=>p.classList.remove('target'));}
// Keep a child's drag alive if a browser releases capture when the hint clears.
// Global listeners are registered once; they only run for an active ordering drag.
addEventListener('pointermove',e=>{
 if(!drag||e.pointerId!==drag.pointer)return;const id=drag.id,piece=pieces[id],dx=e.clientX-drag.x,dy=e.clientY-drag.y;
 if(Math.hypot(dx,dy)>6)drag.moved=true;if(!drag.moved)return;
 piece.classList.add('dragging');piece.style.transform=`translate(${dx}px,${dy}px)`;
 const rect=$('board').getBoundingClientRect();if(topic==='letters')letterAnimations?.track((e.clientX-rect.left)/rect.width,(e.clientY-rect.top)/rect.height);
 drag.target=(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)?drag.slot:slotAt(e.clientX,e.clientY,rect,currentPicture.axis);
 pieces.forEach((p,n)=>p.classList.toggle('target',n!==id&&order.indexOf(n)===drag.target));
});
addEventListener('pointerup',e=>{if(!drag||e.pointerId!==drag.pointer)return;const{slot,target,moved}=drag;clearDrag();if(moved)exchange(slot,target)});
addEventListener('pointercancel',clearDrag);addEventListener('blur',clearDrag);
function confetti({small=false}={}){
 clearTimeout(celebration);$('confetti').replaceChildren();if(reduced)return;
 for(let i=0;i<(small?12:24);i++){const bit=document.createElement('i');bit.style.setProperty('--x',`${25+Math.random()*60}%`);bit.style.setProperty('--color',['#ffca35','#ff6377','#66d6ed','#8bec55'][i%4]);bit.style.setProperty('--delay',`${Math.random()*.08}s`);$('confetti').append(bit);}
 const token=roundToken;celebration=setTimeout(()=>{if(token===roundToken)$('confetti').replaceChildren();},850);
}
function matchCelebration(){roundBanner.hide({immediate:true});voice.cancel();const localBoardFeedback=window.sparkyBoardPlay&&($('board').matches('.counting-board,.assembly-board')||$('board').querySelector('.variant-columns,.story-order-board'));if(!localBoardFeedback)confetti({small:true});if(topic==='letters')letterAnimations?.play('LM03');flow.match();sound('friend');}

function finish(){roundBanner.hide({immediate:true});cancelReactions();done=true;wins++;updateLearningUI();completed.add(currentPicture.id);saveLearning();if(topic==='letters')letterWins++;else if(topic==='numbers')numberWins++;else if(topic==='count-groups')groupWins++;upcomingBoard=null;warmNextRound();voice.cancel();tell('बहुत बढ़िया! ✓',{speak:false});$('task-rule').textContent='Well done! ✓';$('board').classList.add('solved');$('next').disabled=false;say('Well done! A new puzzle is coming. You can also choose Next now.');flow.complete();sound('win');confetti();}

function exchange(a,b){
 if(navigationLoading||done||busy||$('pause-dialog').open)return;clearDrag();
 if(a===b){position();return;}
 idleSchedule();const previous=order;order=swap(order,a,b);const feedback=swapFeedback(previous,order);busy=true;$('board').setAttribute('aria-busy','true');position();sound();say(`Swapped positions ${a+1} and ${b+1}.`);const token=roundToken;
 settle=setTimeout(()=>{if(token!==roundToken)return;busy=false;$('board').setAttribute('aria-busy','false');if(solved(order))finish();else if(feedback==='yes'){matchCelebration();}else if(feedback==='no'){if(topic==='letters')letterAnimations?.play('LM04');voice.cancel();tell('फिर से कोशिश करो।',{speak:false});if(flow.mistake())showMatchHint();}},reduced?0:160);
}
function showMatchHint(){
 const id=order.find((value,slot)=>value!==slot);if(id===undefined)return;
 const target=$('board').querySelectorAll('.slot-target')[id],card=pieces[id];target?.classList.add('help-target');card.classList.add('help-card');
 if(topic==='letters'){const b=$('board').getBoundingClientRect(),point=e=>{const r=e.getBoundingClientRect();return[(r.left+r.width/2-b.left)/b.width,(r.top+r.height/2-b.top)/b.height]};if(target&&b.width&&b.height)letterAnimations?.hint(point(card),point(target));}
 setTimeout(()=>{target?.classList.remove('help-target');card.classList.remove('help-card');},topic==='letters'?2700:1800);
}

function start(index){
 orderingGuide?.destroy();orderingGuide=null;
 voice.cancel();cancelReactions();clearTimeout(settle);clearTimeout(celebration);clearDrag();activeRound?.destroy();activeRound=null;countVoiceRow=null;idleCount=0;void director.show('idle').catch(()=>{});roundToken++;currentPicture=index;const stage=document.querySelector('.game');stage.dataset.sessionGame=currentPicture.session?.id??currentPicture.variant??currentPicture.topic;stage.dataset.sessionPosition=String(currentPicture.session?.position??'');topic=currentPicture.topic;applySceneBackground(document.querySelector('.game'),currentPicture);$('board').dataset.topic=topic;letterAnimations?.begin(topic==='letters');flow.start(topic);companion.clear();flow.entry();done=false;busy=false;order=scramble();const pic=currentPicture,vertical=true;
 // Fun rounds now play inside the same blue board as every other game.
document.querySelector('.game').classList.remove('activity-scene');document.querySelector('.game').classList.toggle('fun-round',!!pic.fun);
 if(topic==='variants'){
  const token=roundToken;pieces=[];$('next').disabled=false;$('board').setAttribute('aria-busy','false');roundBanner.hide({immediate:true});
  activeRound=new VariantRoundController({element:$('board'),picture:pic,director,reduced,isPaused:()=>navigationLoading||screenUnavailable()||document.hidden||portraitScreen.matches||$('pause-dialog').open,isSoundOn:()=>soundOn,sound,onActivity:idleSchedule,onWrong:()=>flow.mistake(),onMatch:matchCelebration,onSpeaking:()=>syncSpeaking(),onComplete:()=>{if(token===roundToken&&!done)finish()}});
  if(location.hostname==='127.0.0.1'||location.hostname==='localhost')window.sparkyVariant=activeRound;
  updateLearningUI();$('task-rule').textContent=pic.rule;tell(pic.intro,{speak:false});layoutArt();idleSchedule();say(pic.rule);return;
 }
 if(pic.fun){
  let lastActivityGesture=-Infinity;
  pieces=[];$('next').disabled=false;$('board').setAttribute('aria-busy','false');
  activeRound=createPlayBreak({element:$('board'),picture:pic,reduced,isPaused:()=>navigationLoading||screenUnavailable()||document.hidden||portraitScreen.matches||$('pause-dialog').open,
   onPlay:({index=0,taps,kind,effect,x,y,demo})=>{sound(effect||(kind==='balloon-pop'?'pop':'jelly'));companion.look(x??(index%3+.5)/3,y??(Math.floor(index/3)+.5)/2);const now=performance.now();if(now-lastActivityGesture>1200&&(demo||taps===1||taps%3===0)){lastActivityGesture=now;companion.act(kind==='jelly-wiggle'?'ponder':'nod');}},
   onComplete:({played})=>{done=true;if(played){confetti();sound('friend');respond(pic.topic==='balloon-pop'?'delight':'encourage',1.2);if(soundOn&&voiceUnlocked)voice.say('small_success_03',{volume:.8});}},onNext:()=>void advance()});
  layoutArt();tell(pic.intro,{speak:false});say(pic.rule);introduce();return;
 }
 $('next').disabled=false;$('board').setAttribute('aria-busy','false');$('board').className='board '+(vertical?'vertical':'horizontal');$('board').setAttribute('aria-label',`${pic.rule} Drag a whole picture onto another to swap their positions.`);$('confetti').replaceChildren();$('board').replaceChildren();pieces=[];
 if(topic==='differences'){
  const token=roundToken;activeRound=new DifferenceRound({element:$('board'),picture:pic,sound,tell,onActivity:idleSchedule,isPaused:()=>navigationLoading||screenUnavailable()||document.hidden||$('pause-dialog').open,onWrong:()=>flow.mistake(),onMatch:matchCelebration,onComplete:()=>{if(token===roundToken&&!done)finish();}});
  updateLearningUI();$('task-rule').textContent=pic.rule;tell(pic.intro,{speak:false});layoutArt();idleSchedule();introduce();say(pic.rule);return;
 }
 if(topic==='count-groups'){
  const token=roundToken;
  activeRound=new CountingRound({element:$('board'),picture:pic,sound,tell,onActivity:idleSchedule,isPaused:()=>navigationLoading||screenUnavailable()||document.hidden||$('pause-dialog').open,onWrong:()=>flow.mistake(),onRead:number=>readCard(pic,{amount:number}),onCount:(ordinal,row)=>{companion.look(.55,(row+.5)/4);flow.requestedSpeech();if(!soundOn)return;voiceUnlocked=true;voice.unlock();if(countVoiceRow!==row){voice.cancel();countVoiceRow=row;}voice.say(COUNT_WORDS[ordinal],{queue:true,rate:1.05});},onMatch:matchCelebration,onComplete:()=>{if(token===roundToken&&!done)finish();}});
  updateLearningUI();$('task-rule').textContent=pic.rule;tell(pic.intro,{speak:false});layoutArt();idleSchedule();introduce();say(pic.rule);return;
 }
 if(topic==='assembly'){const token=roundToken;activeRound=new AssemblyRound({element:$('board'),picture:pic,onRead:()=>readCard(pic),director,sound,tell,reduced,onActivity:idleSchedule,isPaused:()=>navigationLoading||screenUnavailable()||document.hidden||$('pause-dialog').open,onWrong:()=>flow.mistake(),onMatch:matchCelebration,onComplete:()=>{if(token===roundToken&&!done)finish();}});updateLearningUI();$('task-rule').textContent=pic.rule;tell(pic.intro,{speak:false});layoutArt();idleSchedule();introduce();say(pic.rule);return;}

 for(let id=0;id<3;id++){
  const card=pic.cards[id],piece=document.createElement('button');piece.className='piece';piece.dataset.cardIndex=String(id);piece.type='button';piece.style.width='29.333334%';piece.style.height='61%';const grip=document.createElement('span');grip.className='card-grip';grip.setAttribute('aria-hidden','true');piece.append(grip);
  if(topic==='letters'){
   const letter=document.createElement('span');letter.className='card-letter';renderLearningType(letter,card.letter);letter.setAttribute('aria-hidden','true');piece.append(letter);
   const art=document.createElement('img');art.className='card-art';art.src='assets/art/'+card.image;art.alt='';art.draggable=false;piece.append(art);
   const name=document.createElement('span');name.className='card-name';name.textContent=card.label.charAt(0).toUpperCase()+card.label.slice(1);name.lang='en';name.setAttribute('aria-hidden','true');piece.append(name);
  }else{
   const mat=document.createElement('span');mat.className='count-grid';mat.style.setProperty('--rows',String(Math.ceil(card.amount/2)));mat.setAttribute('aria-hidden','true');
   for(let n=0;n<card.amount;n++){const cell=document.createElement('span');cell.className='count-item';if(card.amount%2&&n===card.amount-1)cell.classList.add('odd-last');const image=document.createElement('img');image.src='assets/art/'+card.image;image.alt='';image.draggable=false;cell.append(image);mat.append(cell);}piece.append(mat);
  }
  pieces.push(piece);$('board').append(piece);
  bindCardReading(piece,()=>readCard(pic,card),()=>!navigationLoading&&!busy&&!$('pause-dialog').open);
  piece.addEventListener('pointerdown',e=>{
   if(navigationLoading||done||busy||$('pause-dialog').open||e.button!==0)return;e.preventDefault();idleSchedule();sound('select');piece.focus({preventScroll:true});drag={id,slot:order.indexOf(id),x:e.clientX,y:e.clientY,pointer:e.pointerId,moved:false,target:order.indexOf(id)};piece.setPointerCapture(e.pointerId);
  });
  piece.addEventListener('pointercancel',clearDrag);
  piece.addEventListener('keydown',e=>{const slot=order.indexOf(id);if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const next=Math.max(0,Math.min(2,slot+(['ArrowUp','ArrowLeft'].includes(e.key)?-1:1)));pieces[order[next]].focus();}else if(e.key==='Escape'){clearDrag();}});
 }
 const targets=document.createElement('div');targets.className='slot-targets';targets.setAttribute('aria-hidden','true');pic.targets.forEach(target=>{const badge=document.createElement('span');badge.className='slot-target';renderLearningType(badge,target);targets.append(badge);});$('board').append(targets);const sockets=document.createElement('div');sockets.className='picture-sockets';sockets.setAttribute('aria-hidden','true');for(let n=0;n<3;n++)sockets.append(document.createElement('span'));$('board').prepend(sockets);
 position();layoutArt();orderingGuide=new OrderingGuide($('board'),{state:()=>({pieces,order,done,busy,drag}),paused:()=>navigationLoading||document.hidden||screenUnavailable()||$('pause-dialog').open,reduced});updateLearningUI();$('task-rule').textContent=currentPicture.rule;tell(currentPicture.intro,{speak:false});idleSchedule();introduce();say(pic.rule);
}
function closePause(){$('pause-dialog').close();flow.resume();director.resume();activeRound?.resume?.();gameAudio.setPaused(false);sound('tap');idleSchedule();}
function pause(){reviewActive=false;flow.pause();companion.clear();roundBanner.hide({immediate:true});activeRound?.pause?.();voice.cancel();cancelReactions();clearDrag();activeRound?.cancelDrag();if(!$('pause-dialog').open){sound('tap');gameAudio.setPaused(true);director.pause();$('pause-dialog').showModal();}}
$('mascot-button').onclick=()=>{
 if(topic==='variants'){if(!$('pause-dialog').open&&!navigationLoading)activeRound?.hint();return;}
 if($('pause-dialog').open||navigationLoading)return;if(currentPicture?.fun){if(soundOn){voiceUnlocked=true;voice.unlock();voice.say(currentPicture.intro);}return;}idleSchedule();sound('tap');companion.faceChild();flow.requestedSpeech();
 let explanation=currentPicture.intro;
 if(!done&&(topic==='letters'||topic==='numbers')){showMatchHint();explanation=flow.help();}
 else if(!done&&topic==='count-groups'){const row=currentPicture.cards.findIndex((_,i)=>!activeRound.answers.has(i));if(row>=0){const helpedRow=activeRound.rows[row];helpedRow.classList.add('count-hint');companion.look(.5,(row+.5)/4);setTimeout(()=>helpedRow.classList.remove('count-hint'),1800);}explanation=flow.help();}
 else if(!done&&topic==='assembly'){const id=[0,1,2].find(i=>!activeRound.placed.has(i));if(id!==undefined){activeRound.zones[id].classList.add('hint');companion.look(.4,(id+.5)/3);const zone=activeRound.zones[id];setTimeout(()=>zone.classList.remove('hint'),1800);}explanation=flow.help();}
 else if(!done&&topic==='differences'){companion.look(.5,.4);explanation=flow.help();}
 if(soundOn){voiceUnlocked=true;voice.unlock();if(done){voice.cancel();flow.pause();voice.saySequence(reviewVoices(currentPicture),{volume:.85});reviewActive=voice.pending>0;if(!reviewActive)flow.resume();}else voice.say(explanation,{volume:.85});}
};
$('exit').onclick=pause;$('resume').onclick=closePause;$('restart').onclick=()=>{closePause();sound('swap');start(currentPicture);};$('pause-dialog').addEventListener('cancel',e=>{e.preventDefault();closePause();});
$('next').onclick=advance;
function muteUI(){$('sound').setAttribute('aria-label',soundOn?'Mute sound':'Turn sound on');$('sound').setAttribute('aria-pressed',String(!soundOn));$('sound').querySelector('img').src='assets/art/toy-controls/'+(soundOn?'sound-on.svg':'sound-off.svg');}
$('sound').onclick=()=>{soundOn=!soundOn;try{localStorage.setItem('sparky-swap-sound',soundOn?'on':'off');}catch{}muteUI();gameAudio.setEnabled(soundOn);voice.setEnabled(soundOn);activeRound?.setSound?.(soundOn);if(soundOn){sound('tap');introduce();}};muteUI();voice.setEnabled(soundOn);
addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('pause-dialog').open){e.preventDefault();pause();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)activeRound?.pause?.();clearDrag();activeRound?.cancelDrag();gameAudio.setHidden(document.hidden);if(document.hidden){flow.pause();companion.clear();roundBanner.hide({immediate:true});voice.cancel();clearTimeout(idleTimer);director.pause();}else if(!$('pause-dialog').open&&!screenUnavailable()){director.resume();activeRound?.resume?.();flow.resume();idleSchedule();}});
const portraitScreen=matchMedia('(orientation:portrait)');
function screenUnavailable(){return portraitScreen.matches||document.body.classList.contains('compact-screen');}
let orientationBlocked=false;
function syncOrientation(){
 const game=document.querySelector('.game'),box=game.getBoundingClientRect(),portrait=portraitScreen.matches,compact=!portrait&&(box.width<454.9||box.height<255.9);
 document.body.classList.toggle('compact-screen',compact);
 const prompt=document.querySelector('.rotate-prompt');prompt.querySelector('h1').textContent=compact?'A little more space':'Rotate your phone';prompt.querySelector('p').textContent=compact?'Make this window bigger or use full screen to play with Sparky.':'Turn your phone sideways to play with Sparky.';prompt.setAttribute('aria-label',compact?'More space needed to play':'Rotate your phone to play');
 const blocked=portrait||compact,changed=blocked!==orientationBlocked;orientationBlocked=blocked;
 document.querySelector('.game').inert=blocked;
 if(blocked){if(changed)activeRound?.pause?.();flow.pause();companion.clear();voice.cancel();cancelReactions();roundBanner.hide({immediate:true});director.pause();gameAudio.setPaused(true);}
 else if(!document.hidden&&!$('pause-dialog').open){if(changed)activeRound?.resume?.();flow.resume();director.resume();gameAudio.setPaused(false);idleSchedule();}
}
portraitScreen.addEventListener('change',syncOrientation);
const refreshLayout=()=>{clearDrag();activeRound?.cancelDrag();layoutArt();syncOrientation();};
addEventListener('resize',refreshLayout);window.visualViewport?.addEventListener('resize',refreshLayout);
if('ResizeObserver' in window)new ResizeObserver(()=>layoutArt()).observe($('board'));
async function boot(){performance.mark('sparky:boot-start');try{
 await Promise.all([
  (async()=>{try{const response=await fetch('assets/art/assembly/manifest.json?v=lip-sync-40');if(response.ok){const catalog=await response.json();assemblyEnabled=catalog.ready===true&&catalog.images?.length===40;}}catch{}})(),
  (async()=>{try{const response=await fetch('assets/art/counting/manifest.json?v=lip-sync-40');if(response.ok){const catalog=await response.json();countingEnabled=catalog.ready===true&&catalog.images?.length===20;}}catch{}})(),
  (async()=>{try{const response=await fetch('assets/art/differences/manifest.json?v=red-contours-55');if(response.ok){const catalog=await response.json();differencesEnabled=catalog.ready===true&&catalog.boards?.length===20&&catalog.boards.every(p=>p.images?.length===2&&p.regions?.filter(r=>r.changed).length===3);if(differencesEnabled)differenceDeck=new AssemblyDeck(catalog.boards);}}catch{}})()
 ]);
 const previewKind=new URLSearchParams(location.search).get('game');const first=FUN_KINDS.includes(previewKind)?makeFunBoard(previewKind):newBoard();await Promise.all([director.ready,loadPicture(first),loadOpeningArt(first),prepareVariant(first)]);await director.show('idle');roundCount=1;start(first);$('loading').hidden=true;performance.mark('sparky:ready');performance.measure('sparky:boot','sparky:boot-start','sparky:ready');syncOrientation();warmNextRound();
 }catch(e){$('loading').querySelector('p').textContent='Could not load the game. Please refresh.';console.error(e);}}

if(location.hostname==='127.0.0.1'||location.hostname==='localhost')window.sparkyReview={async startVariant(id,round=0){clearTimeout(prefetchTimer);upcomingBoard=null;const picture=makeVariantBoard(id,round);await prepareVariant(picture);const url=new URL(location.href);url.searchParams.set('game',id);history.replaceState(null,'',url);variantRoundNumber=round+1;start(picture);syncOrientation();return activeRound;},get current(){return activeRound},get picture(){return currentPicture},get navigating(){return navigationLoading},get breaks(){return breakSchedule}};
boot();
