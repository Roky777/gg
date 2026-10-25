/** Hindi device speech. Only child-requested counting uses the short speech queue. */
export class LearningVoice {
 constructor({onStart=()=>{},onEnd=()=>{},onUnavailable=()=>{}}={}){
  Object.assign(this,{onStart,onEnd,onUnavailable});this.enabled=true;this.serial=0;this.pending=0;
  this.supported='speechSynthesis' in window&&'SpeechSynthesisUtterance' in window;
 }
 cancel(){this.serial++;this.pending=0;if(this.supported)window.speechSynthesis.cancel();this.onEnd();}
 setEnabled(on){this.enabled=on;if(!on)this.cancel();}
 say(text,{queue=false,rate=.85,pitch=1.05,volume=1}={}){
  if(!queue)this.cancel();if(!this.enabled)return;if(!this.supported){this.onUnavailable();return;}
  const token=this.serial,u=new SpeechSynthesisUtterance(text);u.lang='hi-IN';u.rate=rate;u.pitch=Math.max(.8,Math.min(1.3,pitch));u.volume=Math.max(0,Math.min(1,volume));
  const voices=speechSynthesis.getVoices();u.voice=voices.find(v=>/^hi[-_]IN$/i.test(v.lang)&&/Google|Swara|Kalpana|Lekha/i.test(v.name))||voices.find(v=>/^hi(?:[-_]|$)/i.test(v.lang))||null;
  this.pending++;let finished=false;
  const finish=()=>{if(token!==this.serial||finished)return;finished=true;this.pending=Math.max(0,this.pending-1);if(!this.pending)this.onEnd();};
  u.onstart=()=>{if(token===this.serial)this.onStart();};u.onend=finish;
  u.onerror=e=>{if(token===this.serial){finish();if(!['canceled','interrupted'].includes(e.error))this.onUnavailable();}};
  speechSynthesis.speak(u);
 }
}
