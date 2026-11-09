import{shuffled}from'./content.mjs';
import{dealContent}from'./content-deck.mjs';
const ROOT='assets/art/figma-ui/';
const FRIENDS=['panda','elephant','bunny'],ACCESSORIES=['hat','mask','crown'];
const names={panda:'Panda',elephant:'Elephant',bunny:'Bunny',hat:'cowboy hat',mask:'party mask',crown:'crown'};
function image(file){const img=new Image();img.src=ROOT+file;img.alt='';img.draggable=false;return img;}
export function stickerArt(friend,accessory){const art=document.createElement('span');art.className='figma-sticker-art';art.dataset.friend=friend;art.setAttribute('aria-hidden','true');art.append(image('sticker-'+friend+'.webp'));if(accessory){const extra=image('sticker-'+accessory+'.webp');extra.className='sticker-worn sticker-worn-'+accessory;art.append(extra);}return art;}
export class StickerStudio{
 constructor(round){
  this.round=round;this.room=round.element.closest('.game');this.room.classList.add('sticker-room');
  const n=round.picture.round<2?2:3;this.n=n;const friends=dealContent('sticker-friends',FRIENDS,n,round.picture.round),accessories=dealContent('sticker-accessories',ACCESSORIES,n,round.picture.round);
  const body=round.body;body.classList.add('figma-sticker-studio');body.style.setProperty('--sticker-n',n);
  const rows=document.createElement('div'),columns=document.createElement('div'),grid=document.createElement('div'),tray=document.createElement('div');
  rows.className='figma-sticker-rows';columns.className='figma-sticker-columns';grid.className='sticker-grid figma-sticker-grid';tray.className='sticker-tray figma-sticker-tray';tray.setAttribute('aria-label','Stickers to place');
  body.append(rows,columns,grid,tray);this.headers=[];
  for(let i=0;i<n;i++){
   const row=document.createElement('span'),col=document.createElement('span');row.className='sticker-header';col.className='sticker-header';row.setAttribute('aria-label',names[friends[i]]+' row');col.setAttribute('aria-label',names[accessories[i]]+' column');
   row.append(stickerArt(friends[i]));col.append(image('sticker-'+accessories[i]+'.webp'));rows.append(row);columns.append(col);this.headers.push({row,col});
  }
  const cells=new Map(),cellsLayer=document.createElement('div');cellsLayer.className='figma-sticker-cells';grid.append(cellsLayer);
  for(let row=0;row<n;row++)for(let col=0;col<n;col++){
   const key=row+':'+col,cell=document.createElement('button');cell.type='button';cell.className='sticker-cell';cell.dataset.target=key;cell.setAttribute('aria-label',names[friends[row]]+' with '+names[accessories[col]]);
   round.listen(cell,'click',()=>{
    if(!round.active()||!round.selected||cell.disabled)return;
    if(round.selected.key!==key){round.wrong('Follow the animal row and the accessory column.');cell.classList.remove('sticker-retry');void cell.offsetWidth;cell.classList.add('sticker-retry');return;}
    cell.append(stickerArt(friends[row],accessories[col]));round.acknowledge(round.selected.button);round.acknowledge(cell,false);round.selected=null;round.answers.add(key);this.select(null);round.feedback.textContent=round.answers.size+' of 3 stickers placed';
    if(round.answers.size===3)round.done();
   });cellsLayer.append(cell);cells.set(key,cell);
  }
  for(const key of shuffled([...cells.keys()],round.random).slice(0,3)){
   const[row,col]=key.split(':').map(Number),item={kind:'figma-sticker',friend:friends[row],accessory:accessories[col],row,col,label:names[friends[row]]+' with '+names[accessories[col]]},button=document.createElement('button');button.type='button';button.className='variant-card sticker-piece';button.setAttribute('aria-label',item.label);button.append(stickerArt(item.friend,item.accessory));round.source(button,key,item);tray.append(button);
  }
 }
 select(item){this.headers.forEach(({row,col},i)=>{row.classList.toggle('sticker-guiding',i===item?.row);col.classList.toggle('sticker-guiding',i===item?.col);});}
 destroy(){this.room.classList.remove('sticker-room');}
}
