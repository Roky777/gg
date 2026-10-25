/** Quiet rounds with a short celebration before automatic progression. Timings are design defaults, not developmental claims. */
const LINES={
 letters:{intro:['चलो, एक जैसे अक्षर ढूँढते हैं।','एक जैसे अक्षर साथ लगाओ।','तस्वीर को उसके अक्षर तक पहुँचाओ।'],win:['सारे अक्षर मिल गए!','तुमने अक्षर पहचान लिए!','अक्षरों की जोड़ी तैयार!'],hint:'तस्वीर वाला अक्षर ऊपर ढूँढो।'},
 numbers:{intro:['चलो, गिनकर नंबर से मिलाएँ।','कितनी तस्वीरें हैं? सही नंबर ढूँढो।','तस्वीरों को उनके नंबर से मिलाओ।'],win:['तुमने सही गिना!','सारे नंबर मिल गए!','गिनकर सही मिलाया!'],hint:'एक-एक तस्वीर गिनकर देखो।'},
 assembly:{intro:['मिलकर तीन टुकड़ों की तस्वीर बनाएँ।','कौन सा टुकड़ा कहाँ लगेगा?','छाया देखकर टुकड़े जोड़ो।'],win:['पूरी तस्वीर बन गई!','तीनों टुकड़े जुड़ गए!','तस्वीर तैयार है!'],hint:'छाया का आकार देखकर टुकड़ा रखो।'},
 'count-groups':{intro:['चलो, साथ में गिनें और नंबर रखें।','चाहो तो तस्वीरों पर टैप करके गिनो।','कितने हैं? सही नंबर लगाओ।'],win:['सही गिनती, सही नंबर!','तुमने सब सही गिना!','हर तस्वीर को नंबर मिल गया!'],hint:'तस्वीरों पर टैप करके गिन सकते हो।'},
 differences:{intro:['चलो, दोनों तस्वीरों में तीन अंतर ढूँढें।','देखो, कौन सी तीन चीज़ें अलग हैं?','दोनों तस्वीरें देखो और अंतर ढूँढो।'],win:['तीनों अंतर मिल गए!','तुमने तीनों अंतर ढूँढ लिए!','सारे अंतर मिल गए!'],hint:'एक बार रंग और चीज़ें ध्यान से देखो।'}
};
export class ModeDeck{
 constructor(random=Math.random){this.random=random;this.bag=[];this.last=null;this.key='';}
 next(modes){const key=[...modes].sort().join('|');if(key!==this.key){this.bag=[];this.key=key;}
  if(!this.bag.length){this.bag=[...modes];for(let i=this.bag.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[this.bag[i],this.bag[j]]=[this.bag[j],this.bag[i]];}if(this.bag.length>1&&this.bag.at(-1)===this.last)[this.bag[0],this.bag[this.bag.length-1]]=[this.bag.at(-1),this.bag[0]];}
  this.last=this.bag.pop();return this.last;
 }
}
export class PlayFlow{
 constructor({speak=()=>{},react=()=>{},ready=()=>{},cheer=()=>{},random=Math.random,next=()=>{},now=()=>Date.now(),canSpeak=()=>true,setTimer=(fn,ms)=>setTimeout(fn,ms),clearTimer=id=>clearTimeout(id)}={}){Object.assign(this,{speak,react,ready,cheer,next,now,canSpeak,setTimer,clearTimer});this.lastSpeech=-Infinity;this.introduced=new Set();this.visits=new Map();this.lineCounts=new Map();this.timers=new Set();this.token=0;this.matchCount=0;this.wins=0;this.round=null;this.paused=false;this.advanceTimer=null;this.advanceDue=null;this.remaining=2500;}
 line(kind){const key=this.topic+':'+kind;const options=LINES[this.topic]?.[kind];if(!options)return '';const n=this.lineCounts.get(key)||0;this.lineCounts.set(key,n+1);return options[n%options.length];}
 later(fn,ms){const token=this.token;const id=this.setTimer(()=>{this.timers.delete(id);if(token===this.token)fn();},ms);this.timers.add(id);return id;}
 cancelIntro(){if(this.introTimer!==null&&this.introTimer!==undefined){this.clearTimer(this.introTimer);this.timers.delete(this.introTimer);this.introTimer=null;}}
 cancel(){this.token++;for(const id of this.timers)this.clearTimer(id);this.timers.clear();this.introTimer=null;this.advanceTimer=null;this.advanceDue=null;this.ready(false);}
 start(topic){this.cancel();this.topic=topic;this.paused=false;this.remaining=2500;this.round={done:false,advanced:false,mistakes:0,hinted:false};this.matchCount=0;this.visits.set(topic,(this.visits.get(topic)||0)+1);this.offerIntro();}
 automatic(text,{gap=12000}={}){if(!text||!this.canSpeak()||this.now()-this.lastSpeech<gap)return false;this.lastSpeech=this.now();this.speak(text);return true;}
 offerIntro(){if(!this.round||this.round.done||!this.canSpeak()||this.introTimer!=null)return;const visit=this.visits.get(this.topic)||1;
  // Explain a new mechanic once. Occasional short reminders after repeated visits.
  if(this.introduced.has(this.topic)&&(visit%4!==0||this.now()-this.lastSpeech<45000))return;
  this.introTimer=this.later(()=>{this.introTimer=null;if(this.automatic(this.line('intro'))){this.introduced.add(this.topic);}},450);
 }
 activity(){this.cancelIntro();}
 requestedSpeech(){this.cancelIntro();this.lastSpeech=this.now();}
 match(){this.activity();if(this.round?.done)return;this.matchCount++;this.react('nod',.85);}
 mistake(){this.activity();if(!this.round||this.round.done)return;this.round.mistakes++;if(this.round.mistakes<2||this.round.hinted)return;this.round.hinted=true;this.react('guide',1.6);this.automatic(LINES[this.topic]?.hint,{gap:20000});return true;}
 complete(){if(!this.round||this.round.done)return;this.activity();this.round.done=true;this.wins++;
  const gesture={letters:'yes',numbers:'proud',assembly:'win','count-groups':'yes',differences:'proud'}[this.topic]||'yes';
  this.react(gesture,1.8);
  const success={letters:'अक्षर मिल गए!',numbers:'बिल्कुल सही गिना!','count-groups':'सब सही गिना!',assembly:'तस्वीर तैयार है!',differences:'तीनों अंतर मिल गए!'}[this.topic];
  this.later(()=>{if(this.canSpeak()){this.lastSpeech=this.now();this.cheer({text:success,reaction:gesture,rate:1.07,pitch:1.06,volume:.8});}},120);
  this.later(()=>this.ready(true),950);
  this.armAdvance();
 }
 armAdvance(){if(!this.round?.done||this.round.advanced||this.paused||this.advanceTimer!==null)return;this.advanceDue=this.now()+this.remaining;
  this.advanceTimer=this.later(()=>{this.advanceTimer=null;this.advanceDue=null;if(this.paused||!this.round?.done||this.round.advanced)return;this.round.advanced=true;this.next();},this.remaining);
 }
 pause(){if(this.paused)return;if(this.advanceDue!==null)this.remaining=Math.max(0,this.advanceDue-this.now());this.cancel();this.paused=true;}
 resume(){this.paused=false;if(this.round?.done){this.ready(true);this.armAdvance();}}
}
