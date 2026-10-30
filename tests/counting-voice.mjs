import assert from 'node:assert/strict';
const queued=[];let cancelled=0,starts=0,ends=0;
const synth={getVoices:()=>[{lang:'hi-IN',name:'Swara'}],cancel(){cancelled++;},speak(u){queued.push(u);}};
globalThis.window={speechSynthesis:synth,SpeechSynthesisUtterance:class{constructor(text){this.text=text;}}};
const {LearningVoice}=await import('../learning-voice.js');
const voice=new LearningVoice({onStart(){starts++;},onEnd(){ends++;}});
voice.say('एक',{queue:true,rate:1.05});voice.say('दो',{queue:true,rate:1.05});voice.say('तीन',{queue:true,rate:1.05});assert.equal(cancelled,0);assert.equal(voice.pending,3);assert.equal(queued.length,1);
for(let i=0;i<3;i++){const u=queued[i];assert.equal(u.lang,'hi-IN');assert.equal(u.rate,1.05);u.onstart();u.onend();assert.equal(voice.pending,2-i);assert.equal(ends,i===2?1:0);u.onend();}
assert.deepEqual(queued.map(u=>u.text),['एक','दो','तीन']);assert.equal(starts,3);assert.equal(ends,1);
voice.say('चार',{queue:true});const stale=queued.at(-1);voice.cancel();assert.equal(voice.pending,0);const ended=ends;stale.onend();assert.equal(ends,ended);voice.setEnabled(false);const length=queued.length;voice.say('पाँच',{queue:true});assert.equal(queued.length,length);
console.log('PASS: count taps remain ordered, no concurrent voices, music ducking spans the whole queue, cancellation drops stale counts, mute prevents playback.');
