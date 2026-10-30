import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
import {LIP_SYNC} from '../lip-sync-data.js';import {RECORDINGS} from '../voice-recordings.js';import {mouthShapeAt,voiceGesture} from '../lip-sync.js';
assert.equal(Object.keys(LIP_SYNC).length,165);
for(const[id,r]of Object.entries(RECORDINGS)){
 const track=LIP_SYNC[id];assert(track);assert.equal(track.sha256,crypto.createHash('sha256').update(fs.readFileSync(new URL('../'+r.path,import.meta.url))).digest('hex'),'Audio changed without rebuilding sync: '+id);
 assert.equal(track.duration,r.duration);assert.equal(track.cues[0][0],0);assert.equal(track.cues.at(-1)[1],'X');
 for(let i=0;i<track.cues.length;i++){const[t,shape]=track.cues[i];assert('ABCDEFX'.includes(shape));if(i)assert(t>=track.cues[i-1][0]);assert(t<=r.duration+.02);assert.equal(mouthShapeAt(id,t),shape);}
 assert.equal(mouthShapeAt(id,-1),'X');assert.equal(mouthShapeAt(id,r.duration),'X');
 const open=track.cues.find(c=>c[1]!=='X');assert(open,id+' needs voiced poses');assert.equal(mouthShapeAt(id,open[0]),open[1]);
}
assert.equal(mouthShapeAt('missing',.3),'X');assert.equal(voiceGesture('welcome'),'wave');assert.equal(voiceGesture('counting'),'nod');assert.equal(voiceGesture('assembly_help'),'guide');assert.equal(voiceGesture('letters_win'),null,'Authored celebration remains in charge');assert.equal(voiceGesture('retry'),null,'No automatic sad/scolding response');
console.log('PASS: 165 audio hashes match; cue ranges/order; exact media-time mouth samples; silence/end closure; task-appropriate gestures and preserved celebration control.');
