export class FeedingWaitClock{
 constructor(random=Math.random){this.random=random;this.remaining=9000;this.last=null;this.bag=[];this.previous=null;}
 reset(){this.remaining=16000+this.random()*8000;this.last=null;}
 activity(){this.remaining=9000;this.last=null;}
 tick(now,eligible){const dt=this.last===null?0:Math.max(0,Math.min(500,now-this.last));this.last=now;if(!eligible)return false;this.remaining-=dt;return this.remaining<=0;}
 next(ids){if(!this.bag.length){this.bag=[...ids];for(let i=this.bag.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[this.bag[i],this.bag[j]]=[this.bag[j],this.bag[i]]}if(this.bag.at(-1)===this.previous)[this.bag[0],this.bag[this.bag.length-1]]=[this.bag.at(-1),this.bag[0]];}return this.previous=this.bag.pop();}
}
export class FeedingWaitingVoice{
 // Waiting lines play through the board voice (feeding_wait_<voiceKey>), so they share
 // the one-voice-at-a-time rule and drive Sparky's lip-sync like every other line.
 constructor(round){this.round=round;this.playing=null;}
 get audio(){const job=this.round.voice?.current;return this.playing&&job?.id===this.playing?{paused:false}:null;}
 stop(){if(this.playing&&this.round.voice?.current?.id===this.playing)this.round.voice.cancel();this.playing=null;}
 play(clip){this.stop();const r=this.round;if(!clip?.voiceKey||!r.isSoundOn()||r.destroyed||!r.active()||document.hidden)return;const id='feeding_wait_'+clip.voiceKey;this.playing=id;r.narrate(id);}
}