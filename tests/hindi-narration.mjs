import assert from 'node:assert/strict';
import fs from 'node:fs';
const load=async file=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8')).toString('base64'));
const {makeBoard,numberReview,NUMBER_WORDS}=await load('puzzle-generator.js');
assert.equal(numberReview([2,3,4]),'वाह! सही गिना! चलो, छोटे से बड़े की ओर पढ़ें। इन तीनों में दो सबसे छोटा है। उससे बड़ा तीन है। और उससे बड़ा चार है। दो… तीन… चार। बहुत बढ़िया!');
for(let i=0;i<150;i++){
 const b=makeBoard({letterWins:10,numberWins:10});
 assert(/[\u0900-\u097f]/.test(b.intro));assert(/[\u0900-\u097f]/.test(b.learn));
 if(b.topic==='numbers')assert.equal(b.learn,numberReview(b.cards.map(c=>c.amount)));
 for(const c of b.cards)assert(/[\u0900-\u097f]/.test(c.say));
}
let spoken,cancelled=0,started=0,ended=0;
const synth={cancel(){cancelled++;},getVoices(){return [{name:'English',lang:'en-US'},{name:'Swara',lang:'hi-IN'}];},speak(u){spoken=u;}};
globalThis.window={speechSynthesis:synth,SpeechSynthesisUtterance:class{constructor(text){this.text=text;}}};
globalThis.speechSynthesis=synth;globalThis.SpeechSynthesisUtterance=window.SpeechSynthesisUtterance;
const {LearningVoice}=await import('../learning-voice.js');
const v=new LearningVoice({onStart(){started++;},onEnd(){ended++;}});
v.say(numberReview([1,5,10]));assert.equal(spoken.lang,'hi-IN');assert.equal(spoken.voice.lang,'hi-IN');assert(spoken.text.includes(NUMBER_WORDS[10]));spoken.onstart();assert.equal(started,1);
const stale=spoken;v.cancel();const count=ended;stale.onend();assert.equal(ended,count);assert(cancelled>=2);
synth.getVoices=()=>[{name:'English',lang:'en-US'}];v.say('एक दो तीन');assert.equal(spoken.voice,null);assert.equal(spoken.lang,'hi-IN');
v.setEnabled(false);const previous=spoken;v.say('नहीं बोलना');assert.equal(spoken,previous);
console.log('PASS: dynamic Hindi number comparisons, Hindi alphabet prompts, Hindi voice selection, cancellation, and mute.');
v.setEnabled(true);v.say('वूहू!',{rate:1.08,pitch:1.2,volume:.82});assert.equal(spoken.rate,1.08);assert.equal(spoken.pitch,1.2);assert.equal(spoken.volume,.82);assert.equal(spoken.lang,'hi-IN');
v.say('वाओ!',{pitch:9,volume:2});assert.equal(spoken.pitch,1.3);assert.equal(spoken.volume,1);
console.log('PASS: cheerful voice prosody stays within bounded pitch and volume.');
