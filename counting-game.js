/** Optional tap-to-count and drag-only number placement. No counting gate. */
export const COUNTING_ITEMS=[
 ['jelly','जेली'],['rabbit','खरगोश'],['duckling','बत्तख'],['toy-car','खिलौना गाड़ी'],
 ['apple','सेब'],['orange','संतरा'],['pear','नाशपाती'],['fish','मछली'],
 ['turtle','कछुआ'],['ladybird','लेडीबर्ड'],['butterfly','तितली'],['star-biscuit','बिस्कुट'],
 ['cupcake','कपकेक'],['toy-block','खिलौना ब्लॉक'],['flower','फूल'],['teddy','टेडी'],
 ['ball','गेंद'],['peach','आड़ू'],['mushroom','मशरूम'],['strawberry','स्ट्रॉबेरी']
].map(([id,name])=>({id,name}));
export const COUNT_WORDS=['शून्य','एक','दो','तीन','चार','पाँच','छह','सात','आठ','नौ','दस'];
export function shuffleItems(items,random=Math.random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function makeCountingBoard({wins=0,recent=[],maxQuantity=10}={},random=Math.random){
 const max=Math.max(4,Math.min(maxQuantity,wins<3?5:wins<6?8:10));let board;
 for(let attempt=0;attempt<30;attempt++){
  const items=shuffleItems(COUNTING_ITEMS,random).slice(0,4);
  const amounts=shuffleItems(Array.from({length:max},(_,i)=>i+1),random).slice(0,4);
  const cards=items.map((item,id)=>({...item,image:`counting/${item.id}.png`,amount:amounts[id],value:amounts[id],label:item.name,kind:'count-group'}));
  let numbers=shuffleItems(amounts,random);if(numbers.every((n,i)=>n===amounts[i]))numbers.push(numbers.shift());
  board={id:'count-groups:'+cards.map(c=>c.id+'-'+c.amount).join(','),topic:'count-groups',cards,numbers,targets:amounts.map(String),maxQuantity:max,rule:'गिनकर सही नंबर लगाओ।',intro:'चाहो तो तस्वीरों पर टैप करके गिनो। फिर सही नंबर को खींचकर उसकी जगह रखो। बिना गिने भी नंबर रख सकते हो।',learn:cards.map(c=>`${c.name}… ${COUNT_WORDS[c.amount]}।`).join(' ')};
  if(!recent.includes(board.id))break;
 }
 return board;
}
/** The ordinal belongs to an object, so repeated taps cannot inflate the total. */
export class RowCount{
 constructor(amount){this.amount=amount;this.ordinals=new Map();}
 tap(index){if(!Number.isInteger(index)||index<0||index>=this.amount)return null;if(!this.ordinals.has(index))this.ordinals.set(index,this.ordinals.size+1);return this.ordinals.get(index);}
}
/** One shared illustrated tile follows a number from tray to answer and badge. */
export function numberArt(number){
 const tile=document.createElement('span');tile.className='number-art';tile.setAttribute('aria-hidden','true');
 tile.style.backgroundImage=`url('assets/art/ui-board/numbers/${number}.png')`;return tile;
}
export class CountingRound{
 constructor({element,picture,onCount=()=>{},onMatch=()=>{},onWrong=()=>{},onComplete=()=>{},onActivity=()=>{},sound=()=>{},tell=()=>{},isPaused=()=>false,random=Math.random}){
  Object.assign(this,{element,picture,onCount,onMatch,onWrong,onComplete,onActivity,sound,tell,isPaused});this.selected=null;this.answers=new Set();this.counts=picture.cards.map(c=>new RowCount(c.amount));this.destroyed=false;this.drag=null;this.timers=[];this.misses=0;
  element.className='board counting-board';element.replaceChildren();element.setAttribute('aria-label',picture.intro);
  this.rows=[];this.docks=[];this.objects=[];this.chips=new Map();const rows=document.createElement('div');rows.className='quantity-rows';element.append(rows);
  picture.cards.forEach((card,rowIndex)=>{
   const row=document.createElement('section');row.className='quantity-row';row.setAttribute('aria-label',`${card.name} की तस्वीरें`);const grid=document.createElement('div');grid.className='quantity-objects';grid.style.setProperty('--count-rows',card.amount>5?'2':'1');row.append(grid);const objects=[];
   for(let index=0;index<card.amount;index++){
    const object=document.createElement('button');object.type='button';object.className='count-object';object.setAttribute('aria-label',`${card.name}, तस्वीर ${index+1}। गिनने के लिए टैप करो।`);const image=document.createElement('img');image.src='assets/art/'+card.image;image.alt='';image.draggable=false;object.append(image);
    object.addEventListener('click',()=>this.count(rowIndex,index));grid.append(object);objects.push(object);
   }
   const dock=document.createElement('button');dock.type='button';dock.className='quantity-dock';dock.textContent='?';dock.setAttribute('aria-label',`${card.name} के लिए नंबर यहाँ रखो`);row.append(dock);rows.append(row);this.rows.push(row);this.docks.push(dock);this.objects.push(objects);
   dock.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();this.docks[Math.max(0,Math.min(3,rowIndex+(e.key==='ArrowDown'?1:-1)))].focus();}else if(e.key==='Escape'){this.selected=null;this.updateSelection();}});
  });
  const tray=document.createElement('div');tray.className='quantity-numbers';tray.setAttribute('aria-label','Drag each number to the matching group.');element.append(tray);
  for(const number of picture.numbers){
   const chip=document.createElement('button');chip.type='button';chip.className='number-chip';chip.textContent=String(number);chip.append(numberArt(number));chip.setAttribute('aria-label',`${COUNT_WORDS[number]}। Drag to the matching picture group.`);chip.setAttribute('aria-pressed','false');tray.append(chip);this.chips.set(number,chip);
   chip.addEventListener('pointerdown',e=>this.begin(e,number));chip.addEventListener('pointermove',e=>this.move(e));chip.addEventListener('pointerup',e=>this.end(e));chip.addEventListener('pointercancel',()=>this.cancelDrag());chip.addEventListener('lostpointercapture',()=>this.cancelDrag());
   chip.addEventListener('keydown',e=>{if(e.key==='Escape'){this.selected=null;this.updateSelection();}});
  }
 }
 allowed(){return !this.destroyed&&!this.isPaused()&&this.answers.size<4;}
 count(row,index){if(!this.allowed())return;const ordinal=this.counts[row].tap(index);if(ordinal===null)return;this.onActivity();const object=this.objects[row][index];let badge=object.querySelector('.object-ordinal');if(!badge){badge=document.createElement('span');badge.className='object-ordinal';badge.setAttribute('aria-hidden','true');object.append(badge);}badge.textContent=String(ordinal);badge.append(numberArt(ordinal));object.classList.add('counted');object.setAttribute('aria-label',`${this.picture.cards[row].name}… ${COUNT_WORDS[ordinal]}। पहले से गिनी हुई तस्वीर।`);this.onCount(ordinal,row);}
 updateSelection(){for(const [number,chip]of this.chips){chip.classList.toggle('selected',number===this.selected);chip.setAttribute('aria-pressed',String(number===this.selected));}this.docks.forEach((dock,i)=>dock.classList.toggle('awaiting-number',this.selected!==null&&!this.answers.has(i)));}
 begin(e,number){if(!this.allowed()||this.chips.get(number).disabled||e.button!==0)return;e.preventDefault();this.cancelDrag();this.onActivity();const chip=this.chips.get(number);chip.focus({preventScroll:true});this.drag={number,pointer:e.pointerId,x:e.clientX,y:e.clientY,moved:false};chip.setPointerCapture(e.pointerId);}
 move(e){const drag=this.drag;if(!drag||drag.pointer!==e.pointerId)return;if(!this.allowed()){this.cancelDrag();return;}const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.moved&&Math.hypot(dx,dy)<7)return;if(!drag.moved){drag.moved=true;const rect=this.chips.get(drag.number).querySelector('.number-art').getBoundingClientRect();const ghost=this.chips.get(drag.number).cloneNode(true);ghost.className='number-ghost';ghost.setAttribute('aria-hidden','true');ghost.tabIndex=-1;Object.assign(ghost.querySelector('.number-art').style,{width:'100%',height:'100%'});Object.assign(ghost.style,{left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px'});document.body.append(ghost);this.ghost=ghost;this.selected=drag.number;this.updateSelection();}this.ghost.style.transform=`translate(${dx}px,${dy}px)`;const row=this.dropRow(e.clientX,e.clientY);this.docks.forEach((dock,i)=>dock.classList.toggle('drop-active',i===row&&!this.answers.has(i)));}
 dropRow(x,y){return this.rows.findIndex(row=>{const r=row.getBoundingClientRect();return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;});}
 end(e){const drag=this.drag;if(!drag||drag.pointer!==e.pointerId)return;const row=this.dropRow(e.clientX,e.clientY);this.cancelDrag();if(!this.allowed())return;if(drag.moved||Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>7){if(row>=0)this.place(drag.number,row);}}
 cancelDrag(){this.ghost?.remove();this.ghost=null;this.drag=null;this.selected=null;this.updateSelection();this.docks.forEach(dock=>dock.classList.remove('drop-active'));}
 place(number,row){if(!this.allowed()||this.answers.has(row)||!this.chips.has(number)||this.chips.get(number).disabled)return;this.onActivity();if(this.picture.cards[row].amount!==number){this.misses++;this.onWrong();this.sound('tap');this.tell('फिर से देखो। चाहो तो तस्वीरों पर टैप करके गिनो।',{speak:false});if(this.misses>=2){this.rows[row].classList.add('count-hint');this.timers.push(setTimeout(()=>this.rows[row].classList.remove('count-hint'),1500));}return;}
  this.answers.add(row);this.misses=0;this.selected=null;const chip=this.chips.get(number);chip.disabled=true;chip.classList.add('used');const dock=this.docks[row];dock.textContent=String(number);dock.append(numberArt(number));dock.disabled=true;dock.setAttribute('aria-label',`${this.picture.cards[row].name}… ${COUNT_WORDS[number]}। सही!`);this.rows[row].classList.add('answered');this.rows[row].classList.remove('count-hint');this.updateSelection();
  if(this.answers.size===4){this.element.classList.add('counting-complete');this.onComplete();}else{this.onMatch();this.tell('सही! ✓',{speak:false});[...this.chips.values()].find(c=>!c.disabled)?.focus({preventScroll:true});}
 }
 destroy(){this.destroyed=true;this.cancelDrag();this.timers.forEach(clearTimeout);}
}
