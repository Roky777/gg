import{applyAuthoredMotion}from'./animation-studio/rig-motion.mjs';
import{contextualLetterClip,letterClipById}from'./animation-studio/letter-clips.mjs';
import{feedingById}from'./animation-studio/feeding-clips.mjs';
// The completed-board clap (LM06) takes the smooth pacing of the Food Choices clap (FD08):
// the same Clapping source slowed to FD08's 2.6 s, with FD08's softer blend in/out.
// FD08's arm targets are tuned for seated Sparky at table height; on the standing body
// they lifted the hands to the chin and crossed the forearms, so the standing clap keeps
// its own source arm motion and only adopts the timing.
{const clap=feedingById.get('FD08'),standing=letterClipById.get('LM06');if(clap&&standing){const source=standing.referenceMotion.keys.at(-1)[1];Object.assign(standing,{duration:clap.duration,referenceMotion:{...standing.referenceMotion,keys:[[0,0],[clap.duration,source]],duration:clap.duration},nativeSettle:{...clap.nativeSettle},description:'Happy clap at the Food Choices clap pace; completed-board celebration.'});}}
const resting={id:'S01',duration:4,channels:{}};
const responses={invite:'LM01',guide:'LM02',ponder:'LM04',nod:'LM03',yes:'LM05',win:'LM05',encourage:'LM05',hurray:'LM05',woohoo:'LM05',delight:'LM05',proud:'LM05'};
export class LetterCompanion{
 constructor({director,companion,reduced=false}){
  Object.assign(this,{director,companion,reduced,enabled:false,current:null,last:null});this.previous=director.poseModifier;
  director.setPoseModifier((skeleton,frame)=>{this.previous?.(skeleton,frame);if(!this.enabled)return;
   let clip=resting,time=0;
   if(this.current){
    const c=this.current;if(c.start===null)c.start=frame.time;time=Math.max(0,frame.time-c.start);
    if(time<c.clip.duration){clip=c.clip;if(c.previous&&time<.18)clip={...clip,transitionFrom:{...c.previous,weight:Math.min(1,time/.18)}};}
    else{this.current=null;this.sync();}
   }
   applyAuthoredMotion(skeleton,clip,time);this.last={clip,time};
  });
 }
 begin(enabled){this.enabled=enabled;this.entryPending=enabled;this.current=null;this.last=null;if(!enabled&&this.director.rig)for(const v of this.director.rig.views)v.skeleton.sparkyAuthoredPose=null;this.sync()}
 play(id,context){if(!this.enabled||this.reduced)return;if(this.current?.clip.id===id&&!context)return;this.companion.gesture=null;this.current={clip:contextualLetterClip(id,context),start:null,previous:this.last};this.sync(id)}
 respond(name){if(!this.enabled)return false;if(this.entryPending){this.entryPending=false;this.play('LM01');return true}if(this.current?.clip.id==='LM02'&&['guide','nod','ponder'].includes(name))return true;if(name==='attend')return true;const celebrations=['LM06','LM07','LM08'];const id=['win','encourage','hurray','woohoo','delight','proud'].includes(name)?celebrations[(this.celebrationIndex=(this.celebrationIndex??-1)+1)%celebrations.length]:name==='yes'?'LM03':responses[name];if(!id)return false;this.play(id);return true}
 track(x,y){if(!this.enabled)return;if(this.current&&this.current.clip.id!=='S01')this.current={clip:{...resting,duration:.25},start:null,previous:this.last};this.companion.gesture=null;this.companion.look(x,y);this.sync('tracking')}
 hint(from,to){this.play('LM02',{from,to})}
 sync(action='rest'){this.director.canvas.dataset.letterAction=this.enabled?action:'inactive'}
}
