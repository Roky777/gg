import assert from 'node:assert/strict';import fs from 'node:fs';
const {ModeDeck,PlayFlow}=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(new URL('../play-flow.js',import.meta.url),'utf8')).toString('base64'));
let seed=17;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const modes=['letters','numbers','assembly','count-groups','differences'],deck=new ModeDeck(random);let last;
for(let i=0;i<100;i++){const bag=Array.from({length:5},()=>deck.next(modes));assert.equal(new Set(bag).size,5);assert.notEqual(last,bag[0]);last=bag.at(-1);}
assert.equal(deck.next(['letters']),'letters');assert.equal(deck.next(['differences']),'differences');
let time=0,serial=0,enabled=true;const jobs=new Map(),spoken=[],actions=[],ready=[];
const setTimer=(fn,ms)=>{const id=++serial;jobs.set(id,{fn,at:time+ms});return id;},clearTimer=id=>jobs.delete(id);
function tick(ms){const end=time+ms;while(true){const next=[...jobs].filter(([,j])=>j.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;time=next[1].at;jobs.delete(next[0]);next[1].fn();}time=end;}
const flow=new PlayFlow({speak:s=>spoken.push(s),react:(...args)=>actions.push(args),ready:v=>ready.push(v),canSpeak:()=>enabled,now:()=>time,setTimer,clearTimer});
flow.start('assembly');tick(449);assert.equal(spoken.length,0);tick(1);assert.equal(spoken.length,1);
flow.match();assert.equal(spoken.length,1);flow.match();assert.notEqual(actions.at(-1)[0],actions.at(-2)[0]);
flow.complete();flow.complete();tick(949);assert.equal(ready.at(-1),false);tick(1);assert.equal(ready.at(-1),true);assert.equal(spoken.length,1,'Completion must not pile speech on an intro');
flow.start('assembly');tick(1000);assert.equal(spoken.length,1,'Do not repeat familiar instructions');
tick(21000);assert.equal(flow.mistake(),undefined);assert.equal(flow.mistake(),true);assert.equal(spoken.length,2);flow.mistake();assert.equal(spoken.length,2);
flow.start('numbers');flow.activity();tick(500);assert.equal(spoken.length,2,'Cancel delayed introductions when the child starts solving');
flow.start('differences');flow.pause();tick(1000);assert.equal(spoken.length,2,'Pause cancels all automatic speech');
tick(20000);flow.start('letters');tick(450);assert.equal(spoken.length,3);assert(spoken.at(-1).startsWith('letters_intro_'));
flow.complete();flow.start('assembly');tick(2000);assert.equal(ready.at(-1),false,'Old completion must not pulse Next on a new board');
enabled=false;flow.start('count-groups');tick(1000);const before=spoken.length;flow.mistake();flow.mistake();flow.complete();tick(2000);assert.equal(spoken.length,before,'Mute blocks automatic narration');
enabled=true;tick(20000);flow.start('numbers');flow.requestedSpeech();flow.complete();tick(1000);assert.equal(spoken.length,before,'User-requested counting has speech priority');
// Exactly one automatic advance at 2.5 seconds; manual Next and old timers cancel it.
let advances=0;const lively=[];const auto=new PlayFlow({next:()=>advances++,react:(...a)=>lively.push(a),now:()=>time,canSpeak:()=>false,setTimer,clearTimer});
auto.start('assembly');auto.complete();tick(2499);assert.equal(advances,0);assert.equal(lively.length,1);assert.equal(lively[0][1],1.8);tick(1);assert.equal(advances,1);tick(5000);assert.equal(advances,1);auto.complete();tick(3000);assert.equal(advances,1);
auto.start('letters');auto.complete();tick(800);auto.pause();tick(9000);assert.equal(advances,1);auto.resume();tick(1699);assert.equal(advances,1);tick(1);assert.equal(advances,2,'Resume keeps the unelapsed celebration time');
auto.start('numbers');auto.complete();tick(400);auto.start('differences');tick(3000);assert.equal(advances,2,'Manual Next cancels old auto-advance');
auto.complete();tick(300);auto.pause();auto.pause();tick(5000);auto.resume();auto.resume();tick(2199);assert.equal(advances,2);tick(1);assert.equal(advances,3,'Repeated pause/resume cannot schedule duplicates');
console.log('PASS: balanced mode bags, quiet speech, varied celebration poses, exact 2.5-second auto-advance, manual skip, pause/resume remaining time, mute and stale-timer cancellation.');
// A companion alternates task acknowledgments and brief approved success recordings.
const responses=[],gestures=[];let audible=true;const companion=new PlayFlow({cheer:c=>responses.push(c),react:n=>gestures.push(n),now:()=>time,canSpeak:()=>audible,setTimer,clearTimer});
for(const topic of modes){companion.start(topic);companion.complete();const first=gestures.at(-1);tick(119);const count=responses.length;tick(1);assert.equal(responses.length,count+1);assert.equal(responses.at(-1).reaction,first);assert.equal(responses.at(-1).pitch,1);assert(!['याय!','वाओ!','वूहू!'].includes(responses.at(-1).text));companion.cancel();}
assert(responses.every(r=>/(_win_0[12]|small_success_0[34])$/.test(r.text)));
companion.start('numbers');companion.complete();companion.start('letters');const beforeResponse=responses.length;tick(200);assert.equal(responses.length,beforeResponse);
companion.complete();companion.pause();tick(500);assert.equal(responses.length,beforeResponse);
audible=false;companion.start('differences');companion.complete();tick(150);assert.equal(responses.length,beforeResponse);
audible=true;companion.start('count-groups');for(let n=0;n<4;n++)companion.match();assert.equal(responses.length,beforeResponse);assert(['nod','ponder','attend'].includes(gestures.at(-1)));companion.cancel();
console.log('PASS: task-specific spoken acknowledgment, quiet nods during solving, no random shout sequence, mute/pause/navigation cancellation.');
let recordedAdvance=0;const recorded=new PlayFlow({next(){recordedAdvance++;},celebrationDuration:()=>3166,now:()=>time,setTimer,clearTimer,canSpeak:()=>true});recorded.start('differences');recorded.complete();tick(3485);assert.equal(recordedAdvance,0);tick(1);assert.equal(recordedAdvance,1);console.log('PASS: recorded celebrations finish before automatic next-board transition.');

// Exercise actual audio IDs over many rounds; aliases must not hide repetition.
const {RECORDINGS,recordingFor}=await import('../voice-cues.js');
const heard=[],entered=[],won=[];let prevVoice,prevGesture;
const varied=new PlayFlow({random,speak:id=>heard.push(id),cheer:c=>heard.push(c.text),react:n=>entered.push(n),now:()=>time,canSpeak:()=>true,setTimer,clearTimer,celebrationDuration:(_topic,id)=>RECORDINGS[id].duration*1000});
for(let i=0;i<100;i++){
 const topic=modes[i%modes.length];varied.start(topic);varied.entry();tick(450);
 for(let k=0;k<2;k++){const id=varied.help();assert(RECORDINGS[id]);assert(id.includes('_help_'));}
 varied.complete();const gesture=entered.at(-1);assert.notEqual(gesture,prevGesture);prevGesture=gesture;won.push(gesture);tick(120);
 const id=heard.at(-1),actual=recordingFor(id);assert(RECORDINGS[actual]);assert.notEqual(actual,prevVoice,'Two successive wins cannot play the same MP3');prevVoice=actual;
 assert(varied.remaining>=RECORDINGS[id].duration*1000+320,'Hold for the selected recording, not a fixed default');varied.cancel();tick(15000);
}
assert.equal(heard.filter(id=>id.includes('_intro_')).length,5,'Explain each mechanic once, not every fourth board');
assert.equal(new Set(won).size,5,'All five meaningful celebration clips are reachable');
const entryFlow=new PlayFlow({random,react:n=>entered.push(n),canSpeak:()=>false,setTimer,clearTimer});const entries=[];
for(let i=0;i<33;i++){entryFlow.start('letters');entryFlow.entry();entries.push(entered.at(-1));entryFlow.cancel();}
assert.equal(entries[0],'invite');assert.equal(entries.filter(n=>n==='invite').length,1,'Wave only once per session');
for(let i=2;i<entries.length;i++)assert.notEqual(entries[i],entries[i-1]);
assert.equal(new Set(entries.slice(1)).size,4);assert.equal(entryFlow.speechGesture('letters_intro'),null,'Audio must not restart the pointing gesture');
console.log('PASS: 100 rounds use real non-repeating win MP3s, exact selected-clip timing, all five celebrations, one instruction per mechanic and four varied arrivals without repeated waving.');
