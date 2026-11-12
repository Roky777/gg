/** Quiet rounds with a short celebration before automatic progression. Timings are design defaults, not developmental claims. */
// Use distinct recordings, rather than synonyms that resolve to the same MP3.
const VOICES={letters:'letters',numbers:'numbers',assembly:'assembly','count-groups':'count',differences:'differences'};
export class ResponseDeck{
 constructor(random=Math.random){this.random=random;this.bags=new Map();this.histories=new Map();}
 next(key,options){
  const historyKey=key.endsWith(':win')?'win-voice':key;const recent=this.histories.get(historyKey)||[];this.histories.set(historyKey,recent);
  let bag=this.bags.get(key)||[];
  if(!bag.length){bag=[...options];for(let i=bag.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}this.bags.set(key,bag);}
  let at=bag.findIndex(v=>!recent.slice(-2).includes(v));
  if(at<0)at=bag.findIndex(v=>v!==recent.at(-1));
  // A shared short response may have just played in a different game type.
  // Defer it rather than repeating it at a bag boundary.
  if(at<0&&options.length>1){const alternatives=options.filter(v=>v!==recent.at(-1));const value=alternatives[Math.floor(this.random()*alternatives.length)];const existing=bag.indexOf(value);if(existing>=0)bag.splice(existing,1);recent.push(value);recent.splice(0,Math.max(0,recent.length-2));return value;}
  if(at<0)at=0;
  const value=bag.splice(at,1)[0];recent.push(value);recent.splice(0,Math.max(0,recent.length-2));return value;
 }
}
export class ModeDeck{
 constructor(random=Math.random){this.random=random;this.bag=[];this.last=null;this.key='';}
 next(modes){const key=[...modes].sort().join('|');if(key!==this.key){this.bag=[];this.key=key;}
  if(!this.bag.length){this.bag=[...modes];for(let i=this.bag.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[this.bag[i],this.bag[j]]=[this.bag[j],this.bag[i]];}if(this.bag.length>1&&this.bag.at(-1)===this.last)[this.bag[0],this.bag[this.bag.length-1]]=[this.bag.at(-1),this.bag[0]];}
  this.last=this.bag.pop();return this.last;
 }
}
export class PlayFlow{
 constructor({speak=()=>{},react=()=>{},ready=()=>{},cheer=()=>{},random=Math.random,next=()=>{},now=()=>Date.now(),canSpeak=()=>true,celebrationDuration=()=>0,setTimer=(fn,ms)=>setTimeout(fn,ms),clearTimer=id=>clearTimeout(id)}={}){Object.assign(this,{speak,react,ready,cheer,next,now,canSpeak,setTimer,clearTimer,celebrationDuration});this.responses=new ResponseDeck(random);this.entries=0;this.lastSpeech=-Infinity;this.introduced=new Set();this.visits=new Map();this.timers=new Set();this.token=0;this.matchCount=0;this.wins=0;this.round=null;this.paused=false;this.advanceTimer=null;this.advanceDue=null;this.remaining=2500;}
 line(kind){const prefix=VOICES[this.topic];if(!prefix)return '';const options=kind==='win'?[prefix+'_win_01',prefix+'_win_02','small_success_03','small_success_04']:[prefix+'_'+kind+'_01',prefix+'_'+kind+'_02'];return this.responses.next(this.topic+':'+kind,options);}
 entry(){
  this.entries++;if(this.entries===1){this.react('invite',1.8);return;}
  // Acknowledge the new board, then give the child room to concentrate.
  this.react(this.responses.next('entry',['guide','ponder','nod','attend','stall','intro','lookhappy2']),1.2);
 }
 speechGesture(category){
  if(category?.endsWith('_intro'))return null; // Entry already supplies the board gesture.
  if(category?.endsWith('_help')||category==='controls')return this.responses.next('help-pose',['guide','nod','ponder']);
  if(category==='counting'||category==='letter_reading')return null;
  if(category==='welcome')return 'invite';return null;
 }
 help(){return this.line('help');}

 later(fn,ms){const token=this.token;const id=this.setTimer(()=>{this.timers.delete(id);if(token===this.token)fn();},ms);this.timers.add(id);return id;}
 cancelIntro(){if(this.introTimer!==null&&this.introTimer!==undefined){this.clearTimer(this.introTimer);this.timers.delete(this.introTimer);this.introTimer=null;}}
 cancel(){this.token++;for(const id of this.timers)this.clearTimer(id);this.timers.clear();this.introTimer=null;this.advanceTimer=null;this.advanceDue=null;this.ready(false);}
 start(topic){this.cancel();this.topic=topic;this.paused=false;this.remaining=2500;this.round={done:false,advanced:false,mistakes:0,hinted:false};this.matchCount=0;this.visits.set(topic,(this.visits.get(topic)||0)+1);this.offerIntro();}
 // Spoken feedback the child earned by acting (correct/wrong/idle): never blocked by the quiet gap.
 speakNow(text){if(!text||!this.canSpeak())return false;this.lastSpeech=this.now();this.speak(text);return true;}
 automatic(text,{gap=12000}={}){if(!text||!this.canSpeak()||this.now()-this.lastSpeech<gap)return false;this.lastSpeech=this.now();this.speak(text);return true;}
 offerIntro(){if(!this.round||this.round.done||!this.canSpeak()||this.introTimer!=null)return;
  // Every board opens with its spoken instruction, so a child never lands on a silent board.
  this.introTimer=this.later(()=>{this.introTimer=null;if(this.speakNow(this.line('intro')))this.introduced.add(this.topic);},450);
 }
 activity(){this.cancelIntro();}
 requestedSpeech(){this.cancelIntro();this.lastSpeech=this.now();}
 // Each correct step: a nod plus a short recorded praise ("Haan, yahi!", "Waah, sahi jagah!").
 match(){this.activity();if(this.round?.done)return;this.matchCount++;this.react(this.responses.next('match',['nod','attend','happy','lookhappy','tada']),.85);this.speakNow(this.responses.next('praise',['small_success_01','small_success_02','small_success_03','small_success_04']));}
 // Every wrong try gets a voice reply: a gentle retry line, and from the second try on
 // the game's own help line (returns true then, so the board can also show its hand guide).
 mistake(){this.activity();if(!this.round||this.round.done)return;const n=++this.round.mistakes;
  if(n%2===0){this.round.hinted=true;this.react('guide',1.6);this.speakNow(this.help());return true;}
  this.speakNow(n===1?'retry_01':this.responses.next('retry',['retry_02','retry_03']));return false;}
 // Idle help: alternate the game's help line with "Help chaahiye? Mujh par tap karo."
 idleHelp(count){this.react('guide',1.6);return this.speakNow(count%2===1?'controls_05':this.help());}
 complete(){if(!this.round||this.round.done)return;this.activity();this.round.done=true;this.wins++;
  const gesture=this.responses.next('celebration',['yes','win','encourage','hurray','woohoo','delight','yummy','wow','tada','splash','jog']);
  this.react(gesture,1.8);
  const success=this.line('win');
  this.later(()=>{if(this.canSpeak()){this.lastSpeech=this.now();this.cheer({text:success,reaction:gesture,rate:1,pitch:1,volume:.8});}},120);
  this.later(()=>this.ready(true),950);
  this.remaining=Math.max(this.remaining,this.canSpeak()?this.celebrationDuration(this.topic,success)+320:0);
  this.armAdvance();
 }
 armAdvance(){if(!this.round?.done||this.round.advanced||this.paused||this.advanceTimer!==null)return;this.advanceDue=this.now()+this.remaining;
  this.advanceTimer=this.later(()=>{this.advanceTimer=null;this.advanceDue=null;if(this.paused||!this.round?.done||this.round.advanced)return;this.round.advanced=true;this.next();},this.remaining);
 }
 pause(){if(this.paused)return;if(this.advanceDue!==null)this.remaining=Math.max(0,this.advanceDue-this.now());this.cancel();this.paused=true;}
 resume(){this.paused=false;if(this.round?.done){this.ready(true);this.armAdvance();}}
}
