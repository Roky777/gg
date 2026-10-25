/** Brief, non-modal round announcements. The board stays interactive throughout. */
export const ROUND_INTROS={
 differences:{title:'Find 3 Differences',speech:'दोनों तस्वीरों में तीन अंतर ढूँढो।'},
 letters:{title:'Match the Letters',speech:'अक्षर से तस्वीर मिलाओ।'},
 numbers:{title:'Match the Numbers',speech:'गिनो और सही नंबर से मिलाओ।'},
 assembly:{title:'Build the Picture',speech:'टुकड़े जोड़कर तस्वीर बनाओ।'},
 'count-groups':{title:'Count and Match',speech:'गिनकर सही नंबर लगाओ।'}
};
export class RoundBanner{
 constructor(element,label,{duration=1700,setTimer=(fn,delay)=>setTimeout(fn,delay),clearTimer=id=>clearTimeout(id)}={}){Object.assign(this,{element,label,duration,setTimer,clearTimer});this.timers=[];}
 clear(){this.timers.forEach(this.clearTimer);this.timers=[];}
 show(topic){const intro=ROUND_INTROS[topic];if(!intro)return;this.clear();this.label.textContent=intro.title;this.element.hidden=false;this.element.classList.remove('leaving','visible');void this.element.offsetWidth;this.element.classList.add('visible');this.timers.push(this.setTimer(()=>this.hide(),this.duration));}
 hide({immediate=false}={}){this.clear();this.element.classList.remove('visible');if(immediate){this.element.classList.remove('leaving');this.element.hidden=true;return;}this.element.classList.add('leaving');this.timers.push(this.setTimer(()=>{this.element.hidden=true;this.element.classList.remove('leaving');},160));}
 destroy(){this.hide({immediate:true});}
}
