/** One persistent music track, mixed beneath soft interactive cues. */
export class GameAudio {
 constructor({enabled=true,element,createContext=()=>new (window.AudioContext||window.webkitAudioContext)()}={}){
  this.enabled=enabled;this.music=element||new Audio(new URL('./assets/audio/Sunny_Afternoon_Meadow.mp3',import.meta.url));this.music.loop=true;this.music.preload='none';this.music.volume=1;this.createContext=createContext;this.context=null;this.unlocked=false;this.paused=false;this.hidden=false;this.lastCue=-Infinity;this.musicLevel=.07;this.speechLevel=.018;this.speaking=false;this.activeTones=new Set();
 }
 setup(){if(this.context)return;this.context=this.createContext();const c=this.context;this.master=c.createGain();this.musicGain=c.createGain();this.effects=c.createGain();this.master.gain.value=this.enabled?1:0;this.musicGain.gain.value=0;this.effects.gain.value=this.speaking?.20:.45;this.master.connect(c.destination);this.musicGain.connect(this.master);this.effects.connect(this.master);this.source=c.createMediaElementSource(this.music);this.source.connect(this.musicGain);}
 prepare(){if(!this.enabled||this.context)return;try{this.setup();}catch{}}
 get targetMusicLevel(){return this.speaking?this.speechLevel:this.musicLevel;}
 setSpeaking(value){this.speaking=value;this.fadeMusic(this.targetMusicLevel,value?.15:.85);if(this.effects){const g=this.effects.gain,t=this.context.currentTime;g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(value?.20:.45,t+.12);}}
 async unlock(){this.unlocked=true;if(!this.enabled||this.paused||this.hidden)return;try{if(this.context?.state==='running'&&!this.music.paused)return;this.setup();await this.context.resume();if(!this.enabled||this.paused||this.hidden)return;await this.music.play();this.fadeMusic(this.targetMusicLevel,2);}catch(e){if(e.name!=='NotAllowedError')console.warn('Music playback unavailable:',e.message);}}
 fadeMusic(value,seconds=.18){if(!this.context)return;const g=this.musicGain.gain,t=this.context.currentTime;g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(value,t+seconds);}
 setEnabled(enabled){this.enabled=enabled;if(this.master){const t=this.context.currentTime;this.master.gain.cancelScheduledValues(t);this.master.gain.setValueAtTime(enabled?1:0,t);}if(!enabled){this.music.pause();this.stopCues();}else if(this.unlocked)this.unlock();}
 stopCues(){for(const osc of this.activeTones){try{osc.stop();}catch{}}this.activeTones.clear();}
 sync(){if(this.paused||this.hidden){this.stopCues();this.music.pause();this.context?.suspend().catch(()=>{});}else if(this.unlocked&&this.enabled)this.unlock();}
 setPaused(value){this.paused=value;this.sync();}
 setHidden(value){this.hidden=value;this.sync();}
 cue(kind='swap'){
  if(!this.enabled||!this.unlocked||this.paused||this.hidden||!this.context||this.context.state!=='running')return;
  const c=this.context,t=c.currentTime;if(t-this.lastCue<.09&&kind!=='win')return;this.lastCue=t;
  const voices={scrub:[[180,0,.08]],water:[[740,0,.07],[580,.035,.08]],bloom:[[659,0,.12],[988,.08,.16]],roll:[[220,0,.12],[294,.06,.12]],catch:[[523,0,.12],[784,.08,.18]],reveal:[[784,0,.08],[988,.04,.1]],'drum-0':[[130,0,.17]],'drum-1':[[220,0,.14]],'drum-2':[[392,0,.12]],pop:[[880,0,.07],[440,.035,.09]],jelly:[[330,0,.10],[494,.045,.13]],select:[[523,.0,.10]],swap:[[392,0,.13],[523,.065,.17]],tap:[[659,0,.09]],next:[[523,0,.13],[784,.10,.19]],friend:[[659,0,.16],[784,.11,.18]],win:[[523,0,.24],[659,.12,.26],[784,.24,.30],[1047,.38,.42]]}[kind]||[[523,0,.12]];
  if(kind==='win'){this.stopCues();const g=this.musicGain.gain;g.cancelScheduledValues(t);const level=this.targetMusicLevel;g.setValueAtTime(Math.min(g.value,level),t);g.linearRampToValueAtTime(level*.55,t+.07);g.setValueAtTime(level*.55,t+.65);g.linearRampToValueAtTime(level,t+1.5);}
  for(const [hz,delay,duration]of voices){const osc=c.createOscillator(),g=c.createGain(),start=t+delay;osc.type='sine';osc.frequency.setValueAtTime(hz,start);osc.frequency.exponentialRampToValueAtTime(kind.startsWith('drum-')?hz*.38:hz*.998,start+duration);g.gain.setValueAtTime(0,start);g.gain.linearRampToValueAtTime(kind==='win'?.10:.065,start+.012);g.gain.exponentialRampToValueAtTime(.0001,start+duration);osc.connect(g);g.connect(this.effects);this.activeTones.add(osc);osc.onended=()=>{this.activeTones.delete(osc);osc.disconnect();g.disconnect();};osc.start(start);osc.stop(start+duration+.02);}
 }
}
