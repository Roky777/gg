import{byId}from'./animation-studio/authored-clips.mjs';
import{teachingScenes,resolveScene}from'./animation-studio/teaching-scenes.mjs';
import{applyAuthoredMotion}from'./animation-studio/rig-motion.mjs';
import{drawStudioProps,drawStudioBack}from'./animation-studio/prop-renderer.mjs';
/** The game and library share these assets and the same painted rig. */
export class ProductionPlayer{
 constructor({director,container,paused=()=>false,reduced=false,narrate=()=>{}}){
  Object.assign(this,{director,container,paused,reduced,narrate});this.current=null;this.serial=0;this.request=null;this.scene=null;this.destroyed=false;this.oldModifier=director.poseModifier;
  director.setPoseModifier((s,f)=>{if(this.current){const part=resolveScene(this.current.clip,this.current.time);let clip={...part.clip,sceneState:{...part.clip.sceneState,reducedMotion:this.reduced}};if(this.current.entrance&&this.current.time<.26&&!clip.transitionFrom){const u=Math.max(0,Math.min(1,this.current.time/.26));clip={...clip,transitionFrom:{...this.current.entrance,weight:u*u*(3-2*u)}}}this.lastPose=applyAuthoredMotion(s,clip,part.time)}else this.oldModifier?.(s,f)})
 }
 async attach(){
  await this.director.ready;if(this.destroyed||this.originalAdapter)return;
  const rig=this.director.rig;this.originalAdapter=rig.referenceAdapter;
  this.adapter=v=>{const rendered=this.originalAdapter(v);this.onRendered?.(rendered);if(this.scene&&this.current){const part=resolveScene(this.current.clip,this.current.time);drawStudioProps(this.scene.front,{...part.clip,sceneState:{...part.clip.sceneState,hideCanvasCaption:true}},part.time,rendered);drawStudioBack(this.scene.back,part.clip,part.time);if(part.label&&this.lastLabel!==part.label){this.lastLabel=part.label;this.scene.caption.textContent=part.label;this.narrate(part.label)}}return rendered};
  rig.referenceAdapter=this.adapter
 }
 async play(id,{scene=false,onComplete=()=>{},caption='',context={},loop=false,autoComplete=false,keepScene=false}={}){
  const entrance=keepScene?(this.current?{...resolveScene(this.current.clip,this.current.time),pose:this.lastPose}:this.pendingEntrance??null):null,token=++this.serial;this.pendingEntrance=entrance;this.stop(false,keepScene&&scene);const sourceClip=typeof id==='object'?id:byId.get(id)??teachingScenes.find(c=>c.id===id);const clip=sourceClip?{...sourceClip,sceneState:{...sourceClip.sceneState,...context}}:null;if(!clip)throw Error('Unknown production action '+id);
  await this.attach();if(this.destroyed||token!==this.serial)return;
  this.director.clearQueue();await this.director.show('idle');if(this.destroyed||token!==this.serial)return;
  if(scene&&!this.scene)this.openScene(caption);if(this.scene)this.scene.caption.textContent=caption;this.current={clip,time:0,onComplete,ended:false,loop,autoComplete,entrance};this.pendingEntrance=null;this.lastLabel='';this.last=performance.now();this.director.actor.seek(0);this.run()
 }
 openScene(caption){
  const wrap=document.createElement('div');wrap.className='teaching-stage';const back=document.createElement('canvas'),front=document.createElement('canvas'),label=document.createElement('p'),tools=document.createElement('div'),replay=document.createElement('button'),next=document.createElement('button');
  label.className='teaching-caption';label.textContent=caption;tools.className='teaching-tools';replay.textContent='Replay';next.textContent=this.reduced?'Next step':'Skip';replay.type=next.type='button';tools.append(replay,next);back.className='teaching-back';front.className='teaching-front';
  const canvas=this.director.canvas;this.scene={wrap,back,front,caption:label,next,home:canvas.parentNode,style:canvas.getAttribute('style'),canvasClass:canvas.className};back.width=front.width=canvas.width;back.height=front.height=canvas.height;canvas.className='teaching-character';canvas.removeAttribute('style');wrap.append(back,canvas,front,label,tools);this.container.append(wrap);document.querySelector('.mascot')?.classList.add('scene-playing');
  replay.onclick=()=>{if(!this.current||this.paused())return;this.current.time=0;this.lastLabel='';this.last=performance.now();this.current.ended=false;next.textContent=this.reduced?'Next step':'Skip';this.run()};
  next.onclick=()=>{if(!this.current||this.paused())return;if(this.reduced&&!this.current.ended){const beat=this.current.clip.beats?.find(([t])=>t>this.current.time+.01);if(beat){this.current.time=Math.min(this.current.clip.duration,beat[0]+.45);this.director.actor.seek(this.current.time);this.lastLabel='';return}}const callback=this.current.onComplete;this.stop();callback()}
 }
 run(){
  cancelAnimationFrame(this.request);if(!this.current)return;
  if(this.reduced&&this.scene){this.director.actor.seek(this.current.time);return}
  this.request=requestAnimationFrame(now=>{if(!this.current)return;const elapsed=Math.max(0,(now-this.last)/1000),dt=Math.min(.1,elapsed);this.last=now;
   if(!this.paused()&&!document.hidden){this.onFrame?.(elapsed);this.current.time=this.reduced?this.current.clip.duration:Math.min(this.current.clip.duration,this.current.time+dt);this.director.actor.seek(this.current.time);
    if(this.current.time>=this.current.clip.duration){if(this.current.loop){this.current.entrance=null;this.current.time=0;this.director.actor.seek(0)}else if(this.current.autoComplete){this.current.ended=true;this.current.onComplete();return}else if(this.scene){this.current.ended=true;this.scene.next.textContent='Continue';return}else{const callback=this.current.onComplete;this.stop();callback();return}}}
   this.run()
  })
 }
 stop(invalidate=true,preserveScene=false){
  if(invalidate){this.serial++;this.pendingEntrance=null;this.lastPose=null;}cancelAnimationFrame(this.request);this.request=null;this.current=null;this.lastLabel='';
  if(this.scene&&!preserveScene){const s=this.scene,canvas=this.director.canvas;s.home.prepend(canvas);canvas.className=s.canvasClass;if(s.style===null)canvas.removeAttribute('style');else canvas.setAttribute('style',s.style);s.wrap.remove();this.scene=null;document.querySelector('.mascot')?.classList.remove('scene-playing')}
  if(this.director.actor){this.director.actor.restart();this.director.actor.setSpeech(!!this.director.speaking)}if(this.director.rig)for(const v of this.director.rig.views)v.skeleton.sparkyAuthoredPose=null
 }
 destroy(){this.destroyed=true;this.stop();this.director.setPoseModifier(this.oldModifier);if(this.originalAdapter&&this.director.rig.referenceAdapter===this.adapter)this.director.rig.referenceAdapter=this.originalAdapter}
}
