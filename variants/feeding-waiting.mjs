export class FeedingWaitClock{
 constructor(random=Math.random){this.random=random;this.remaining=9000;this.last=null;this.bag=[];this.previous=null;}
 reset(){this.remaining=16000+this.random()*8000;this.last=null;}
 activity(){this.remaining=9000;this.last=null;}
 tick(now,eligible){const dt=this.last===null?0:Math.max(0,Math.min(500,now-this.last));this.last=now;if(!eligible)return false;this.remaining-=dt;return this.remaining<=0;}
 next(ids){if(!this.bag.length){this.bag=[...ids];for(let i=this.bag.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[this.bag[i],this.bag[j]]=[this.bag[j],this.bag[i]]}if(this.bag.at(-1)===this.previous)[this.bag[0],this.bag[this.bag.length-1]]=[this.bag.at(-1),this.bag[0]];}return this.previous=this.bag.pop();}
}
export class FeedingWaitingVoice{
 constructor(round){this.round=round;this.serial=0;this.audio=null;}
 stop(){this.serial++;if(this.audio){this.audio.pause();this.audio.currentTime=0;this.audio=null;}}
 async play(clip){this.stop();const serial=this.serial;if(!this.round.isSoundOn())return;try{this.manifest??=fetch('assets/audio/feeding-waiting/manifest.json').then(r=>{if(!r.ok)throw Error('Waiting voice manifest unavailable');return r.json()});const manifest=await this.manifest,cue=manifest.cues[clip.voiceKey];if(serial!==this.serial||this.round.destroyed||!this.round.active()||document.hidden||!this.round.isSoundOn()||!cue?.src)return;const audio=new Audio(new URL(cue.src,new URL('assets/audio/feeding-waiting/',location.href)));this.audio=audio;audio.preload='metadata';audio.onended=()=>{if(this.audio===audio)this.audio=null;};await audio.play();if(serial!==this.serial)audio.pause();}catch{if(serial===this.serial)this.audio=null;/* Missing recordings and autoplay restrictions leave a silent animation. */}}
}
