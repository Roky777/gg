// Demonstrates the actual swap gesture without changing the puzzle's order.
export class OrderingGuide{
 constructor(board,{state,paused,reduced=false}){
  Object.assign(this,{board,state,paused,reduced});this.animations=[];this.abort=new AbortController();
  this.layer=document.createElement('div');this.layer.className='ordering-guide';this.layer.hidden=true;this.layer.setAttribute('aria-hidden','true');board.append(this.layer);
  const listen=(node,event,fn)=>node.addEventListener(event,fn,{signal:this.abort.signal});
  for(const event of['pointerdown','keydown'])listen(board,event,()=>{this.stop();this.schedule(9000)});
  listen(window,'resize',()=>{this.stop();this.schedule(6500)});
  listen(document,'visibilitychange',()=>document.hidden?this.stop():this.schedule(6500));
  this.observer=new MutationObserver(()=>{if(this.paused())this.stop();else this.schedule(6500)});this.observer.observe(document.getElementById('pause-dialog'),{attributes:true,attributeFilter:['open']});this.observer.observe(board.closest('.game'),{attributes:true,attributeFilter:['inert']});
  this.schedule(1500);
 }
 schedule(delay){clearTimeout(this.timer);this.timer=setTimeout(()=>this.show(),delay)}
 show(){
  this.stop();const{pieces,order,done,busy,drag}=this.state();if(this.paused()||done||busy||drag)return;
  const id=order.find((value,slot)=>value!==slot);if(id===undefined)return;
  const source=pieces[id],destination=pieces[order[id]],header=this.board.querySelectorAll('.slot-target')[id];if(!source||!destination||!header)return;
  this.source=source;this.header=header;source.classList.add('ordering-invite');header.classList.add('ordering-destination');
  const root=this.board.getBoundingClientRect(),a=source.getBoundingClientRect(),b=destination.getBoundingClientRect();
  const ghost=source.cloneNode(true);ghost.className='ordering-demo-card';ghost.removeAttribute('aria-label');ghost.removeAttribute('data-card-index');ghost.disabled=true;ghost.tabIndex=-1;ghost.style.cssText=`left:${a.left-root.left}px;top:${a.top-root.top}px;width:${a.width}px;height:${a.height}px`;
  const hand=new Image();hand.src='assets/art/toy-board/connection-hand.webp';hand.alt='';hand.draggable=false;hand.className='ordering-demo-hand';
  this.layer.replaceChildren(ghost,hand);this.layer.hidden=false;
  const startX=a.left-root.left+a.width*.45,startY=a.top-root.top+a.height*.57;
  hand.style.left=startX+'px';hand.style.top=startY+'px';
  if(this.reduced){ghost.hidden=true;this.end=setTimeout(()=>this.stop(),1700);return}
  const dx=b.left-a.left,dy=b.top-a.top,frames=[{transform:'translate(0,0)',opacity:0},{transform:'translate(0,0)',opacity:.92,offset:.18},{transform:`translate(${dx*.5}px,${dy-12}px)`,opacity:.92,offset:.5},{transform:`translate(${dx}px,${dy}px)`,opacity:.92,offset:.78},{transform:`translate(${dx}px,${dy}px)`,opacity:0}];
  for(const node of[ghost,hand])this.animations.push(node.animate(frames,{duration:2400,easing:'ease-in-out',fill:'both'}));
  this.end=setTimeout(()=>{this.stop();this.schedule(11000)},2450);
 }
 stop(){clearTimeout(this.timer);clearTimeout(this.end);for(const a of this.animations)a.cancel();this.animations=[];this.source?.classList.remove('ordering-invite');this.header?.classList.remove('ordering-destination');this.layer.hidden=true;this.layer.replaceChildren()}
 destroy(){this.stop();this.abort.abort();this.observer.disconnect();this.layer.remove()}
}
