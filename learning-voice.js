import {mouthShapeAt} from './lip-sync.js?v=lip-sync-40';
import {RECORDINGS,recordingFor} from './voice-cues.js?v=lip-sync-40';
/** One cancellable voice queue. Supplied recordings keep their natural pace/pitch. */
// Sparky has one voice: the game and each board keep their own queue, but they share this channel,
// so two recordings never play over each other. The channel also survives versioned module URLs during a cached release.
// VOICE RULES (what may stop what):
//  1. One line at a time. A new line may cut off the line that is playing only if it is at least as
//     important; otherwise the new line is dropped (never saved for later: stale prompts confuse).
//  2. Importance: 4 celebration (board won) > 3 response to what the child just did (right/wrong,
//     hint after a mistake, naming what was tapped, feeding reactions, story steps) > 2 instruction
//     (game intro, welcome) > 1 nudge (idle help, waiting lines, control tips).
//  3. A nudge never starts within 1.2 s after another line ended (no back-to-back chatter).
//  4. The same line is never restarted while it plays, nor repeated within 3 s (except celebrations).
//  5. A line with no supplied recording stays silent and does not interrupt anything.
//  6. Board change, pause, mute and a hidden tab cancel everything at once (cancel()).
const channel=globalThis[Symbol.for('sparky.recordedVoice')]??= {speaking:new Set(),lastEnd:-1e9,lastId:'',lastStart:-1e9};
const speaking=channel.speaking;
export function cancelAllVoices(){for(const voice of [...speaking])voice.cancel();}
export function voicePriority(id,recording){const c=recording?.category||'';
 if(/_win$/.test(c)||c==='transition'||id==='praise_tada')return 4;
 if(/^(small_success|retry|praise|differences_progress|letter_reading|counting|picture_name|colour_name|accessory_name|feeding|feeding_help|clue_help|story)$/.test(c))return 3;
 if(/_intro$/.test(c)||c==='welcome')return 2;
 return 1;}
function blocked(self,id,p){const now=performance.now();
 for(const v of new Set([self,...speaking])){const c=v.current||v.jobs[0];if(!c)continue;if(c.priority>p)return true;if(c.id===id&&v.current)return true;}
 if(p<=1&&now-channel.lastEnd<1200)return true;if(p<4&&id===channel.lastId&&now-channel.lastStart<3000)return true;return false;}
export class LearningVoice {
 constructor({onStart=()=>{},onEnd=()=>{},onUnavailable=()=>{},audioFactory=typeof Audio==='function'?()=>new Audio():null}={}){
  Object.assign(this,{onStart,onEnd,onUnavailable});this.enabled=true;this.serial=0;this.pending=0;this.jobs=[];this.current=null;
  this.audio=audioFactory?.();if(this.audio)this.audio.preload='auto';
  this.supported=!!this.audio;
 }
 unlock(){
  if(!this.audio||this.unlocked)return;this.unlocked=true;
  // Unlock this reusable media element in the actual user gesture on mobile.
  this.audio.src='data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQIAAACAgA==';
  const promise=this.audio.play();promise?.catch(()=>{});this.audio.pause();
 }
 cancel(){
  if(this.current?.playing)channel.lastEnd=performance.now();this.serial++;this.jobs=[];this.pending=0;this.current=null;speaking.delete(this);
  if(this.audio){this.audio.onplaying=null;this.audio.onended=null;this.audio.onerror=null;this.audio.onwaiting=null;this.audio.pause();this.audio.removeAttribute('src');this.audio.load();}
  this.onEnd();
 }
 speechFrame(){
  const job=this.current;if(!job)return null;
  if(!job.recording)return null;
  const playing=!!job.playing&&!this.audio.paused;
  return {playing,shape:playing?mouthShapeAt(job.id,this.audio.currentTime):'X',time:this.audio.currentTime||0,id:job.id};
 }
 setEnabled(on){this.enabled=on;if(!on)this.cancel();}
 say(text,{queue=false,rate=.85,pitch=1.05,volume=1,priority}={}){
  if(!this.enabled)return;
  const id=recordingFor(text),recording=id?RECORDINGS[id]:null;
  // Unrecorded lines stay silent and leave whatever is playing alone (rule 5).
  if(!recording||!this.audio)return;
  const p=priority??voicePriority(id,recording);
  if(!queue){if(blocked(this,id,p))return;this.cancel();}
  else if([...speaking].some(v=>v!==this&&(v.current||v.jobs[0])?.priority>p))return;
  this.jobs.push({id,text:/[ऀ-ॿ]/.test(text)?text:recording?.text||text,recording,rate,pitch,priority:p,volume:Math.max(0,Math.min(1,volume))});this.pending++;speaking.add(this);this.pump();
 }
 saySequence(items,options={}){if(!this.enabled)return;const first=items.find(t=>recordingFor(t));if(!first)return;const id=recordingFor(first),p=options.priority??voicePriority(id,RECORDINGS[id]);if(blocked(this,id,p))return;this.cancel();for(const text of items)this.say(text,{...options,priority:p,queue:true});}
 pump(){
  if(this.current||!this.jobs.length||!this.enabled)return;
  const next=this.jobs[0];
  if([...speaking].some(v=>v!==this&&(v.current||v.jobs[0])?.priority>next.priority)){this.cancel();return;}
  const job=this.jobs.shift(),token=this.serial;this.current=job;
  const valid=()=>token===this.serial&&this.current===job;
  const finish=()=>{if(!valid())return;this.current=null;this.pending--;channel.lastEnd=performance.now();if(this.jobs.length)this.pump();else{speaking.delete(this);this.onEnd();}};
  const start=()=>{if(!valid())return;job.playing=true;this.unlocked=true;if(!job.started){job.started=true;channel.lastId=job.id;channel.lastStart=performance.now();this.onStart({id:job.id,category:job.recording?.category,duration:job.recording?.duration});}};
  if(!job.recording||!this.audio){finish();return;}
  for(const other of [...speaking])if(other!==this)other.cancel();speaking.add(this);
  const audio=this.audio;let failed=false;
  const error=e=>{if(!valid()||failed)return;failed=true;audio.onplaying=audio.onended=audio.onerror=null;audio.pause();if(e?.name==='NotAllowedError')this.unlocked=false;this.onUnavailable();finish();};
  audio.src=new URL(job.recording.path,import.meta.url).href;audio.volume=job.volume;audio.playbackRate=1;audio.onplaying=start;audio.onended=finish;audio.onerror=error;audio.onwaiting=()=>{if(valid())job.playing=false;};
  try{audio.play()?.catch(error);}catch(e){error(e);}
 }
}
