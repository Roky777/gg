// Visit every game in the established order, wrapping from a chosen starting point.
export const GAME_ORDER=Object.freeze([
 'letters','letter-picture','letter-case','word-picture',
 'counting','count-connect','equal-groups','colour-match',
 'assembly','differences','food-sort','accessory-grid'
]);
const START_KEY='sparky-playlist-start-v1';
export function randomPlaylistStart({random=Math.random,storage}={}){
 let previous=null;
 try{storage??=globalThis.localStorage;const raw=storage?.getItem(START_KEY);if(raw!=null&&Number.isInteger(Number(raw))&&Number(raw)>=0&&Number(raw)<GAME_ORDER.length)previous=Number(raw);}catch{}
 const count=GAME_ORDER.length-(previous===null?0:1);
 let index=Math.max(0,Math.min(count-1,Math.floor(random()*count)));
 if(previous!==null&&index>=previous)index++;
 try{storage?.setItem(START_KEY,String(index));}catch{}
 return index;
}
export class GamePlaylist {
 constructor({startIndex=0}={}){this.cursor=0;this.startIndex=Number.isInteger(startIndex)?((startIndex%GAME_ORDER.length)+GAME_ORDER.length)%GAME_ORDER.length:0;}
 get startId(){return GAME_ORDER[this.startIndex];}
 next(){const visit=this.cursor++,index=(this.startIndex+visit)%GAME_ORDER.length;return{id:GAME_ORDER[index],round:Math.floor(visit/GAME_ORDER.length),position:index+1,total:GAME_ORDER.length};}
}
