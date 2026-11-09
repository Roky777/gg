// One visit to each shipped game before starting the next set of rounds.
export const GAME_ORDER=Object.freeze([
 'letters','letter-picture','letter-case','word-picture',
 'counting','count-connect','equal-groups','colour-match',
 'assembly','differences','food-sort','accessory-grid'
]);
export class GamePlaylist {
 constructor(){this.cursor=0;}
 next(){const index=this.cursor++;return{id:GAME_ORDER[index%GAME_ORDER.length],round:Math.floor(index/GAME_ORDER.length),position:index%GAME_ORDER.length+1,total:GAME_ORDER.length};}
}
