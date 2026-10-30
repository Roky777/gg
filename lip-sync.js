import {LIP_SYNC} from './lip-sync-data.js?v=lip-sync-40';
/** Sample the audio clock, not a wall-clock animation loop. */
export function mouthShapeAt(id,seconds){
 const track=LIP_SYNC[id];if(!track||!Number.isFinite(seconds)||seconds<0||seconds>=track.duration)return 'X';
 const cues=track.cues;let lo=0,hi=cues.length-1;
 while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(cues[mid][0]<=seconds)lo=mid;else hi=mid-1;}
 return cues[lo][1];
}
export function voiceGesture(category){
 if(category==='welcome')return 'wave';
 if(category?.endsWith('_help')||category?.endsWith('_intro')||category==='controls')return 'guide';
 if(category==='counting'||category==='letter_reading')return 'nod';
 return null;
}
