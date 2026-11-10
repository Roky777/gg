// Endless boards: every board is a fresh random combination, and boards already
// shown on this device are remembered so the same one does not come back.
// Storage can be unavailable (private mode, blocked site data); then only this
// session's boards are remembered.
const KEY='sparky-seen-boards-v1',KEEP=4000;
let memory=null;
function load(){
 if(memory)return memory;
 try{memory=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{memory={}}
 return memory;
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(memory))}catch{}}
export function freshRandom(){
 let seed;try{const a=new Uint32Array(1);crypto.getRandomValues(a);seed=a[0]}catch{seed=(Math.random()*2**32)>>>0}
 let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296};
}
/** Build boards until one has not been seen before (bounded tries). */
export function uniqueBoard(game,build,{tries=80}={}){
 const seen=load(),list=seen[game]??=[],known=new Set(list);let board=null;
 for(let i=0;i<tries;i++){const next=build();board??=next;if(!known.has(next.signature)){board=next;break}}
 list.push(board.signature);if(list.length>KEEP)list.splice(0,list.length-KEEP);save();
 return board;
}
export function seenCount(game){return(load()[game]??[]).length}
export function forgetBoards(){memory={};save()}
