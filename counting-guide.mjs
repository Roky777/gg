// Counting board hand tutorial: a hand carries the correct number from the tray
// to the first empty "?" pocket. It only demonstrates; it never places an answer
// and never takes input (pointer-events:none).
const HAND='assets/art/toy-board/connection-hand-play.webp';
const FIRST_DELAY=1500,IDLE_DELAY=9000,REPEAT_DELAY=11000,MAX_UNANSWERED_REPEATS=3;
export class CountingGuide{
 constructor(round,{paused=()=>false,reduced=false}={}){
  Object.assign(this,{round,board:round.element,paused,reduced});this.animations=[];this.repeats=0;this.abort=new AbortController();
  this.layer=document.createElement('div');this.layer.className='counting-guide';this.layer.hidden=true;this.layer.setAttribute('aria-hidden','true');this.board.append(this.layer);
  const listen=(node,event,fn)=>node.addEventListener(event,fn,{signal:this.abort.signal});
  // Any touch or key means the child is playing: get out of the way, offer help again later.
  for(const event of['pointerdown','keydown'])listen(this.board,event,()=>{this.repeats=0;this.stop();this.schedule(IDLE_DELAY)});
  listen(window,'resize',()=>{this.stop();this.schedule(6500)});
  listen(document,'visibilitychange',()=>document.hidden?this.stop():this.schedule(6500));
  this.observer=new MutationObserver(()=>{if(this.paused())this.stop();else this.schedule(6500)});
  const dialog=document.getElementById('pause-dialog'),game=this.board.closest('.game');
  if(dialog)this.observer.observe(dialog,{attributes:true,attributeFilter:['open']});
  if(game)this.observer.observe(game,{attributes:true,attributeFilter:['inert']});
  this.schedule(FIRST_DELAY);
 }
 schedule(delay){clearTimeout(this.timer);if(this.destroyed||this.round.answers.size>=4)return;this.timer=setTimeout(()=>this.show(),delay)}
 /** The demonstration step: first empty row and the number chip that belongs there. */
 step(preferredRow=null){
  const r=this.round,cards=r.picture.cards,open=i=>Number.isInteger(i)&&i>=0&&i<cards.length&&!r.answers.has(i);
  const row=open(preferredRow)?preferredRow:cards.findIndex((_,i)=>open(i));if(row<0)return null;
  const chip=r.chips.get(cards[row].amount);if(!chip||chip.disabled)return null;
  return{row,chip,dock:r.docks[row]};
 }
 /** Play the demonstration now. Returns true if it started. */
 show(preferredRow=null){
  this.stop();const r=this.round;
  if(this.destroyed||r.destroyed||r.drag||r.answers.size>=4||this.paused())return false;
  const step=this.step(preferredRow);if(!step)return false;
  const{row,chip,dock}=step,root=this.board.getBoundingClientRect(),a=(chip.querySelector('.number-art')??chip).getBoundingClientRect(),b=dock.getBoundingClientRect();
  if(!root.width||!a.width||!b.width)return false;
  this.chip=chip;this.row=r.rows[row];this.dock=dock;
  chip.classList.add('count-guide-source');dock.classList.add('count-guide-target');this.row.classList.add('count-guide-row');
  // Same language as Count & Connect: the numbers stay put; only a hand travels
  // along a dotted line from the number to its "?" pocket.
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),path=document.createElementNS('http://www.w3.org/2000/svg','path');svg.append(path);
  const hand=new Image();hand.src=HAND;hand.alt='';hand.draggable=false;hand.className='counting-demo-hand';
  this.layer.replaceChildren(svg,hand);this.layer.hidden=false;
  const x1=a.left-root.left+a.width*.5,y1=a.top-root.top+a.height*.5,x2=b.left-root.left+b.width*.5,y2=b.top-root.top+b.height*.5,bend=Math.min(60,Math.abs(x2-x1)*.18);
  svg.setAttribute('viewBox',`0 0 ${root.width} ${root.height}`);path.setAttribute('d',`M${x1} ${y1} C${x1-(x1-x2)*.35} ${y1-bend},${x2+(x1-x2)*.35} ${y2-bend},${x2} ${y2}`);
  const size=hand.getBoundingClientRect().width||48,at=(x,y)=>`translate(${x-size*.15}px,${y-size*.17}px)`;
  hand.style.transform=at(x1,y1);
  if(this.reduced){svg.style.display='none';hand.style.opacity='1';this.end=setTimeout(()=>this.finish(),1800);return true}
  const duration=2400,length=path.getTotalLength(),frames=[];
  for(let i=0;i<=30;i++){const t=i/30,progress=Math.max(0,Math.min(1,(t-.2)/.58)),eased=progress*progress*(3-2*progress),p=path.getPointAtLength(length*eased);frames.push({offset:t,transform:at(p.x,p.y),opacity:t<.08?t/.08:t>.92?(1-t)/.08:1});}
  this.animations.push(hand.animate(frames,{duration,fill:'both'}),path.animate([{strokeDashoffset:length,opacity:0},{strokeDashoffset:length,opacity:0,offset:.2},{strokeDashoffset:0,opacity:.8,offset:.78},{opacity:0}],{duration,fill:'both'}));
  this.end=setTimeout(()=>this.finish(),duration+50);
  return true;
 }
 finish(){this.stop();if(++this.repeats<MAX_UNANSWERED_REPEATS)this.schedule(REPEAT_DELAY)}
 /** Called after a correct answer: demonstrate the next row later if the child stalls. */
 answered(){this.repeats=0;this.stop();this.schedule(IDLE_DELAY)}
 get playing(){return !this.layer.hidden}
 stop(){clearTimeout(this.timer);clearTimeout(this.end);for(const a of this.animations)a.cancel();this.animations=[];this.chip?.classList.remove('count-guide-source');this.dock?.classList.remove('count-guide-target');this.row?.classList.remove('count-guide-row');this.chip=this.dock=this.row=null;this.layer.hidden=true;this.layer.replaceChildren()}
 destroy(){this.destroyed=true;this.stop();this.abort.abort();this.observer.disconnect();this.layer.remove()}
}
