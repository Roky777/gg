// FD03 (Lucas source thumbs-up) is kept in the library but out of play: on Sparky's seated body it
// swings the arms wide, tips the head steeply and points the left thumb sideways.
// FD10 (yummy) is out of play too: on the seated body its gloves float in front of the chest without arms.
export const FEEDING_REACTIONS={happy:['FD08','FD09','FD15'],tooth:['FD07','FD12','FD13'],no:['FD05','FD11']};
export const feedingFamily=food=>food.reaction??(food.category==='everyday'?'happy':food.index<14?'tooth':'no');
export class FeedingReactionDeck{
 constructor(random=Math.random){this.random=random;this.bags=new Map();this.last=new Map()}
 next(food){const family=feedingFamily(food),pool=FEEDING_REACTIONS[family];let bag=this.bags.get(family);if(!bag?.length){bag=[...pool];for(let i=bag.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]]}if(bag.at(-1)===this.last.get(family))[bag[0],bag[bag.length-1]]=[bag.at(-1),bag[0]];this.bags.set(family,bag)}const id=bag.pop();this.last.set(family,id);return id}
}
