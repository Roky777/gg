import {RECORDINGS,pictureVoice} from './voice-cues.js?v=lip-sync-40';

/** Use the supplied recordings for the card the child actually touched. */
export function cardReadings(picture,card){
 let cues=[];
 if(picture.topic==='letters')cues=['letter_'+String(card.value).toLowerCase(),pictureVoice(card.label)];
 else if(picture.topic==='numbers')cues=['number_'+String(card.amount).padStart(2,'0')];
 else if(picture.topic==='assembly')cues=[pictureVoice(picture.item.id)];
 else if(picture.topic==='count-groups')cues=['number_'+String(card.amount).padStart(2,'0')];
 return cues.filter(cue=>cue&&RECORDINGS[cue]);
}

/** A completed tap reads the card; drags and cancelled pointers stay quiet. */
export function bindCardReading(button,onRead,canRead=()=>true){
 let pointer=null;
 button.addEventListener('pointerdown',event=>{
  if(event.button!==0||!canRead())return;
  pointer={id:event.pointerId,x:event.clientX,y:event.clientY,moved:false};
 });
 button.addEventListener('pointermove',event=>{
  if(pointer?.id===event.pointerId&&Math.hypot(event.clientX-pointer.x,event.clientY-pointer.y)>6)pointer.moved=true;
 });
 button.addEventListener('pointerup',event=>{
  const tap=pointer;if(tap?.id!==event.pointerId)return;pointer=null;
  if(!tap.moved&&Math.hypot(event.clientX-tap.x,event.clientY-tap.y)<=6&&canRead())onRead();
 });
 const cancel=()=>{pointer=null;};
 button.addEventListener('pointercancel',cancel);button.addEventListener('lostpointercapture',cancel);
 // Native button activation from Enter/Space or assistive technology.
 button.addEventListener('click',event=>{if(event.detail===0&&canRead())onRead();});
}
