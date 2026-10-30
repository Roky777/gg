import fs from 'node:fs';import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../round-banner.js',import.meta.url),'utf8');const {RoundBanner,ROUND_INTROS}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
assert.deepEqual(Object.keys(ROUND_INTROS).sort(),['assembly','count-groups','differences','letters','numbers']);
for(const intro of Object.values(ROUND_INTROS)){assert(!/[\u0900-\u097f]/.test(intro.title));assert(/[\u0900-\u097f]/.test(intro.speech));assert(intro.speech.length<60);}
let now=0,next=0;const jobs=new Map();const setTimer=(fn,delay)=>{const id=++next;jobs.set(id,{fn,time:now+delay});return id;};const clearTimer=id=>jobs.delete(id);
const advance=ms=>{const end=now+ms;while(true){const due=[...jobs].filter(([,job])=>job.time<=end).sort((a,b)=>a[1].time-b[1].time)[0];if(!due)break;now=due[1].time;jobs.delete(due[0]);due[1].fn();}now=end;};
const classes=new Set();const element={hidden:true,offsetWidth:600,classList:{add:(...names)=>names.forEach(n=>classes.add(n)),remove:(...names)=>names.forEach(n=>classes.delete(n))}},label={textContent:''};
const banner=new RoundBanner(element,label,{setTimer,clearTimer});banner.show('count-groups');assert.equal(label.textContent,ROUND_INTROS['count-groups'].title);assert.equal(element.hidden,false);assert(classes.has('visible'));
advance(1000);banner.show('assembly');assert.equal(jobs.size,1);assert.equal(label.textContent,'Build the Picture');advance(700);assert.equal(element.hidden,false);assert(classes.has('visible'));advance(1000);assert(classes.has('leaving'));advance(160);assert.equal(element.hidden,true);assert.equal(jobs.size,0);
banner.show('letters');banner.hide({immediate:true});assert.equal(element.hidden,true);assert.equal(jobs.size,0);advance(3000);assert.equal(element.hidden,true);
banner.show('numbers');banner.destroy();assert.equal(element.hidden,true);assert.equal(jobs.size,0);
// Browser Window timer methods must not receive the RoundBanner as their receiver.
const oldSet=globalThis.setTimeout,oldClear=globalThis.clearTimeout;
try{globalThis.setTimeout=function(fn,delay){assert(this===undefined||this===globalThis);return setTimer(fn,delay);};globalThis.clearTimeout=function(id){assert(this===undefined||this===globalThis);clearTimer(id);};const defaults=new RoundBanner(element,label);defaults.show('letters');defaults.destroy();assert.equal(jobs.size,0);}finally{globalThis.setTimeout=oldSet;globalThis.clearTimeout=oldClear;}
assert(fs.existsSync(new URL('../assets/art/ui-board/round-ribbon.png',import.meta.url)));
console.log('PASS: five English titles with brief Hindi narration, refreshed popup per round, 1.7-second dismissal, no stale timers, and immediate pause/navigation cleanup.');
