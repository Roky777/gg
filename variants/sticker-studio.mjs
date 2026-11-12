import{shuffled}from'./content.mjs';
// Sticker art and room decorations from DUPE GAMES UI (3) and (4).
const ROOT='assets/art/sticker-room/';
// Every round picks its animals and accessories at random from all six of each.
const FRIEND_POOL=['panda','elephant','bunny','giraffe','lion','fox'],ACCESSORY_POOL=['hat','mask','crown','glasses','headphones','flower'];
const names={panda:'Panda',elephant:'Elephant',bunny:'Bunny',giraffe:'Giraffe',lion:'Lion',fox:'Fox',hat:'cowboy hat',mask:'party mask',crown:'crown',glasses:'funny glasses',headphones:'headphones',flower:'flower clip'};
function image(file){const img=new Image();img.src=ROOT+file;img.alt='';img.draggable=false;return img;}
export function stickerArt(friend,accessory){const art=document.createElement('span');art.className='figma-sticker-art';art.dataset.friend=friend;art.setAttribute('aria-hidden','true');art.append(image(friend+'.webp'));if(accessory){const extra=image(accessory+'.webp');extra.className='sticker-worn sticker-worn-'+accessory;art.append(extra);}return art;}
export class StickerStudio{
 constructor(round){
  this.round=round;this.room=round.element.closest('.game');this.room.classList.add('sticker-room');
  const n=round.picture.round<2?2:3;this.n=n;
  const FRIENDS=shuffled([...FRIEND_POOL],round.random).slice(0,n),ACCESSORIES=shuffled([...ACCESSORY_POOL],round.random).slice(0,n);
  const body=round.body;body.classList.add('figma-sticker-studio');body.style.setProperty('--sticker-n',n);
  const rows=document.createElement('div'),columns=document.createElement('div'),grid=document.createElement('div'),tray=document.createElement('div');
  rows.className='figma-sticker-rows';columns.className='figma-sticker-columns';grid.className='sticker-grid figma-sticker-grid';tray.className='sticker-tray figma-sticker-tray';tray.setAttribute('aria-label','Stickers to place');
  const decor=document.createElement('div');decor.className='sticker-decor';decor.setAttribute('aria-hidden','true');
  for(const[kind,file]of[['note','note'],['pin','pin'],['cloud','doodle-cloud'],['line','doodle-line'],['star-w','doodle-star-white'],['star-b','doodle-star-blue'],['star-p','doodle-star-purple'],['swirl','doodle-swirl'],['mark','doodle-mark'],['chalk','chalk']]){const img=image(file+'.webp');img.className=kind;decor.append(img);}
  body.append(decor,rows,columns,grid,tray);this.headers=[];
  for(let i=0;i<n;i++){
   const row=document.createElement('span'),col=document.createElement('span');row.className='sticker-header';col.className='sticker-header';row.setAttribute('aria-label',names[FRIENDS[i]]+' row');col.setAttribute('aria-label',names[ACCESSORIES[i]]+' column');
   row.append(stickerArt(FRIENDS[i]));col.append(image(ACCESSORIES[i]+'.webp'));rows.append(row);columns.append(col);this.headers.push({row,col});
  }
  const cells=new Map(),cellsLayer=document.createElement('div');cellsLayer.className='figma-sticker-cells';grid.append(cellsLayer);
  for(let row=0;row<n;row++)for(let col=0;col<n;col++){
   const key=row+':'+col,cell=document.createElement('button');cell.type='button';cell.className='sticker-cell';cell.dataset.target=key;cell.setAttribute('aria-label',names[FRIENDS[row]]+' with '+names[ACCESSORIES[col]]);
   round.listen(cell,'click',()=>{
    if(!round.active()||!round.selected||cell.disabled)return;
    if(round.selected.key!==key){round.wrong('Follow the animal row and the accessory column.');cell.classList.remove('sticker-retry');void cell.offsetWidth;cell.classList.add('sticker-retry');return;}
    cell.append(stickerArt(FRIENDS[row],ACCESSORIES[col]));round.acknowledge(round.selected.button);round.acknowledge(cell,false);round.selected=null;round.answers.add(key);this.select(null);if(round.answers.size<3)round.narrate(round.answers.size===1?'sticker_success':'praise_careful');round.feedback.textContent=round.answers.size+' of 3 stickers placed';
    if(round.answers.size===3)round.done();
   });cellsLayer.append(cell);cells.set(key,cell);
  }
  for(const key of shuffled([...cells.keys()],round.random).slice(0,3)){
   const[row,col]=key.split(':').map(Number),item={kind:'figma-sticker',friend:FRIENDS[row],accessory:ACCESSORIES[col],row,col,label:names[FRIENDS[row]]+' with '+names[ACCESSORIES[col]]},button=document.createElement('button');button.type='button';button.className='variant-card sticker-piece';button.setAttribute('aria-label',item.label);button.append(stickerArt(item.friend,item.accessory));round.source(button,key,item);tray.append(button);
  }
 }
 select(item){if(item?.accessory&&item!==this.spoken){this.spoken=item;this.round.narrate({hat:'accessory_cowboy_hat',mask:'accessory_party_mask',crown:'accessory_crown'}[item.accessory]??'')}if(!item)this.spoken=null;this.headers.forEach(({row,col},i)=>{row.classList.toggle('sticker-guiding',i===item?.row);col.classList.toggle('sticker-guiding',i===item?.col);});}
 destroy(){this.room.classList.remove('sticker-room');}
}
