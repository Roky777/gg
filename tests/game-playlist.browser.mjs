import{GAME_ORDER}from'../game-playlist.mjs';
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),assert=(v,m)=>{if(!v)throw Error(m);};
async function until(fn){for(let i=0;i<500;i++){if(fn())return;await sleep(30);}throw Error('Combined game transition did not finish');}
export async function reviewGamePlaylist(){
 // A fresh visit opens on the start screen: press PLAY like a child would.
 {const home=document.getElementById('pause-dialog');for(let i=0;i<40&&!home.open;i++)await new Promise(r=>setTimeout(r,50));if(home.open)document.getElementById('resume').click();}
 const stage=document.querySelector('.game'),results=[];
 for(let i=0;i<=GAME_ORDER.length;i++){
  const review=window.sparkyReview,pic=review.picture,expected=GAME_ORDER[i%GAME_ORDER.length];
  assert(pic.session?.id===expected,'Wrong game at position '+(i+1)+': '+pic.session?.id);
  assert(pic.session.position===i%GAME_ORDER.length+1&&pic.session.round===Math.floor(i/GAME_ORDER.length),'Playlist position or round is wrong');
  assert(stage.dataset.sessionGame===expected,'Visible game differs from session');
  assert(new URLSearchParams(location.search).get('game')==='all','Sequence navigated away from the combined game');
  assert(!pic.fun,'Extra break replaced one of the 13 games');
  if(pic.variant)assert(review.current?.spec.id===expected,'Variant controller does not match the board');
  else assert(pic.topic===({counting:'count-groups'}[expected]??expected),'Classic game fell back to another mode');
  assert(stage.classList.contains('feeding-room')===(expected==='food-sort'),'Feeding scene leaked across game transition');
  assert(stage.classList.contains('sticker-room')===(expected==='accessory-grid'),'Sticker scene leaked across game transition');
  const next=document.getElementById('next');assert(!next.disabled&&getComputedStyle(next).visibility!=='hidden','Next unavailable in '+expected);
  results.push({id:expected,round:pic.session.round,position:pic.session.position});
  if(i===GAME_ORDER.length)break;
  // Exercise a prefetched board, rapid repeat input, and restart without skipping.
  if(i===0){document.getElementById('exit').click();document.getElementById('resume').click();await sleep(80);assert(review.picture===pic,'Home + PLAY advanced the playlist');await sleep(1500);}
  next.click();next.click();await until(()=>review.picture!==pic&&!review.navigating);await sleep(180);
 }
 assert(!GAME_ORDER.includes('story-order'),'Story ordering remains in the playlist');
 assert(new Set(results.slice(0,GAME_ORDER.length).map(x=>x.id)).size===GAME_ORDER.length,'Not all active games were visited');
 return{passed:true,allGames:GAME_ORDER.length,cycleWrap:true,prefetch:true,rapidNextGuard:true,restartKeepsPosition:true,results};
}
