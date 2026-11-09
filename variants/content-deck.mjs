// Runtime entropy changes each visit. A cached deal is stable during loading,
// rendering and Restart, while the bag makes later rounds explore the pool.
const entropy=globalThis.crypto?.getRandomValues?.(new Uint32Array(1))[0]??Math.floor(Math.random()*2**32);
export function contentSeed(key){let h=entropy;for(const c of String(key))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
const decks=new Map();
const identity=item=>typeof item==='object'?(item.key??item.index??item.name??item.id??JSON.stringify(item)):item;
export function dealContent(key,items,count,round=0){
 let d=decks.get(key);if(!d){d={bag:[],deals:new Map(),last:[]};decks.set(key,d);}
 if(d.deals.has(round))return d.deals.get(round).slice();
 const picked=[];
 while(picked.length<Math.min(count,items.length)){
  if(!d.bag.length){d.bag=items.slice();for(let i=d.bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[d.bag[i],d.bag[j]]=[d.bag[j],d.bag[i]];}
   // Deal unseen choices before choices from the immediately preceding board.
   d.bag.sort((a,b)=>Number(d.last.includes(identity(b)))-Number(d.last.includes(identity(a))));
  }
  let index=d.bag.findLastIndex(item=>!picked.some(p=>identity(p)===identity(item)));if(index<0){d.bag=[];continue;}
  picked.push(d.bag.splice(index,1)[0]);
 }
 d.last=picked.map(identity);d.deals.set(round,picked.slice());return picked;
}
