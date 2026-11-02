import {mouthShapeAt} from './lip-sync.js?v=lip-sync-40';
import {RECORDINGS,recordingFor} from './voice-cues.js?v=lip-sync-40';
/** One cancellable voice queue. Supplied recordings keep their natural pace/pitch. */
export class LearningVoice {
 constructor({onStart=()=>{},onEnd=()=>{},onUnavailable=()=>{},audioFactory=typeof Audio==='function'?()=>new Audio():null}={}){
  Object.assign(this,{onStart,onEnd,onUnavailable});this.enabled=true;this.serial=0;this.pending=0;this.jobs=[];this.current=null;
  this.synth=globalThis.window?.speechSynthesis;this.Utterance=globalThis.window?.SpeechSynthesisUtterance;
  this.audio=audioFactory?.();if(this.audio)this.audio.preload='auto';
  this.supported=!!(this.audio||(this.synth&&this.Utterance));
 }
 unlock(){
  if(!this.audio||this.unlocked)return;this.unlocked=true;
  // Unlock this reusable media element in the actual user gesture on mobile.
  this.audio.src='data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQIAAACAgA==';
  const promise=this.audio.play();promise?.catch(()=>{});this.audio.pause();
 }
 cancel(){
  this.serial++;this.jobs=[];this.pending=0;this.current=null;
  if(this.audio){this.audio.onplaying=null;this.audio.onended=null;this.audio.onerror=null;this.audio.onwaiting=null;this.audio.pause();this.audio.removeAttribute('src');this.audio.load();}
  this.synth?.cancel();this.onEnd();
 }
 speechFrame(){
  const job=this.current;if(!job)return null;
  if(job.fallback){
   const playing=!!job.playing&&!job.ttsPaused;
   // System speech has no media clock/phoneme track. Use its word boundaries
   // as a modest approximation; never pretend these are recorded visemes.
   const elapsed=Math.max(0,performance.now()-(job.boundaryAt||0));
   const word=job.word||'';
   const letter=word[Math.min(word.length-1,Math.floor(elapsed/110))]||'';
   const shape=/[mbpमबप]/i.test(letter)?'A':/[uूुऊउw]/i.test(letter)?'F':/[oोौओऔ]/i.test(letter)?'E':/[aाआअ]/i.test(letter)?'D':/[eिीेैईइएऐ]/i.test(letter)?'C':'B';
   return {playing,shape:playing&&word&&elapsed<Math.max(250,word.length*130)?shape:'X',id:null};
  }
  if(!job.recording)return null;
  const playing=!!job.playing&&!this.audio.paused;
  return {playing,shape:playing?mouthShapeAt(job.id,this.audio.currentTime):'X',time:this.audio.currentTime||0,id:job.id};
 }
 setEnabled(on){this.enabled=on;if(!on)this.cancel();}
 say(text,{queue=false,rate=.85,pitch=1.05,volume=1}={}){
  if(!queue)this.cancel();if(!this.enabled)return;
  const id=recordingFor(text),recording=id?RECORDINGS[id]:null;
  this.jobs.push({id,text:/[\u0900-\u097f]/.test(text)?text:recording?.text||text,recording,rate,pitch,volume:Math.max(0,Math.min(1,volume))});this.pending++;this.pump();
 }
 saySequence(items,options={}){this.cancel();if(!this.enabled)return;for(const text of items)this.say(text,{...options,queue:true});}
 pump(){
  if(this.current||!this.jobs.length||!this.enabled)return;
  const job=this.jobs.shift(),token=this.serial;this.current=job;
  const valid=()=>token===this.serial&&this.current===job;
  const finish=()=>{if(!valid())return;this.current=null;this.pending--;if(this.jobs.length)this.pump();else this.onEnd();};
  const start=()=>{if(!valid())return;job.playing=true;if(!job.started){job.started=true;this.onStart({id:job.id,category:job.recording?.category,duration:job.recording?.duration});}};
  const fallback=()=>{
   if(!valid())return;job.fallback=true;
   if(!this.synth||!this.Utterance){this.onUnavailable();finish();return;}
   const u=new this.Utterance(job.text);u.lang='hi-IN';u.rate=job.rate;u.pitch=Math.max(.8,Math.min(1.3,job.pitch));u.volume=job.volume;
   const voices=this.synth.getVoices();u.voice=voices.find(v=>/^hi[-_]IN$/i.test(v.lang)&&/Google|Swara|Kalpana|Lekha/i.test(v.name))||voices.find(v=>/^hi(?:[-_]|$)/i.test(v.lang))||null;
   const wordAt=index=>{job.boundaryAt=performance.now();job.word=job.text.slice(index).match(/^\S+/)?.[0]||'';};
   u.onstart=()=>{if(!valid())return;wordAt(0);start();};
   u.onboundary=e=>{if(valid()&&e.name==='word')wordAt(e.charIndex);};
   u.onpause=()=>{if(valid())job.ttsPaused=true;};u.onresume=()=>{if(valid())job.ttsPaused=false;};
   u.onend=finish;u.onerror=e=>{if(valid()&&!['canceled','interrupted'].includes(e.error))this.onUnavailable();finish();};this.synth.speak(u);
  };
  if(!job.recording||!this.audio){fallback();return;}
  const audio=this.audio;let failed=false;
  const error=e=>{if(!valid()||failed)return;failed=true;audio.onplaying=audio.onended=audio.onerror=null;audio.pause();if(e?.name==='NotAllowedError'){this.unlocked=false;this.onUnavailable();finish();}else fallback();};
  audio.src=new URL(job.recording.path,import.meta.url).href;audio.volume=job.volume;audio.playbackRate=1;audio.onplaying=start;audio.onended=finish;audio.onerror=error;audio.onwaiting=()=>{if(valid())job.playing=false;};
  try{audio.play()?.catch(error);}catch(e){error(e);}
 }
}
