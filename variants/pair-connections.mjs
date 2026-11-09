const SVG='http://www.w3.org/2000/svg';
export class PairConnections{
 constructor(round){this.round=round;this.drag=null;this.failed=null;}
 bindSource(button,key,item){
  const r=this.round;button.dataset.source=key;
  r.listen(button,'click',()=>{if(this.suppressed===button&&performance.now()<this.suppressUntil){this.suppressed=null;return;}this.clearFailure();r.select(button,key,item);});
  r.listen(button,'pointerdown',e=>{if(!r.active()||button.disabled||e.button!==0)return;r.onActivity();this.clearFailure();this.drag={button,key,item,id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};button.setPointerCapture?.(e.pointerId);});
  r.listen(button,'pointermove',e=>{const d=this.drag;if(!d||d.id!==e.pointerId)return;if(Math.hypot(e.clientX-d.x,e.clientY-d.y)>8)d.moved=true;if(!d.moved)return;e.preventDefault();d.point={x:e.clientX,y:e.clientY};d.target=this.targetAt(e.clientX,e.clientY);this.render();});
  r.listen(button,'pointerup',e=>{const d=this.drag;if(!d||d.id!==e.pointerId)return;this.drag=null;if(d.moved){this.suppressed=button;this.suppressUntil=performance.now()+200;const target=this.targetAt(e.clientX,e.clientY);r.select(button,key,item);if(target)r.tryPair(target,target.dataset.target);}this.render();});
  for(const event of['pointercancel','lostpointercapture'])r.listen(button,event,e=>{if(this.drag?.id===e.pointerId)this.cancel();});
 }
 targetAt(x,y){const target=document.elementFromPoint(x,y)?.closest('[data-target]');return target&&this.round.right.contains(target)&&!target.disabled?target:null;}
 reject(a,b){this.clearFailure();this.failed=[a,b];this.render();this.timer=setTimeout(()=>{this.failed=null;this.render();},900);}
 clearFailure(){clearTimeout(this.timer);this.failed=null;this.render();}
 cancel(){this.drag=null;this.clearFailure();}
 render(){
  const r=this.round,svg=r.lineSvg;if(!svg||r.destroyed)return;const box=r.body.getBoundingClientRect();svg.replaceChildren();svg.setAttribute('viewBox',`0 0 ${box.width||1} ${box.height||1}`);
  const line=(a,b,state,point)=>{
   const left=a.getBoundingClientRect(),right=b?.getBoundingClientRect(),x1=left.right-box.left,y1=left.top+left.height/2-box.top,x2=right?right.left-box.left:point.x-box.left,y2=right?right.top+right.height/2-box.top:point.y-box.top,curve=Math.max(18,Math.abs(x2-x1)*.42),group=document.createElementNS(SVG,'g');group.setAttribute('class','connection-'+state);
   const path=document.createElementNS(SVG,'path');path.setAttribute('d',`M${x1} ${y1} C${x1+curve} ${y1},${x2-curve} ${y2},${x2} ${y2}`);group.append(path);
   for(const[x,y]of[[x1,y1],[x2,y2]]){const dot=document.createElementNS(SVG,'circle');dot.setAttribute('cx',x);dot.setAttribute('cy',y);dot.setAttribute('r','5');group.append(dot);}
   if(state==='wrong'){const mark=document.createElementNS(SVG,'text');mark.setAttribute('x',(x1+x2)/2);mark.setAttribute('y',(y1+y2)/2-10);mark.setAttribute('text-anchor','middle');mark.textContent='×';group.append(mark);}
   svg.append(group);
  };
  for(const[a,b]of r.lines)if(!r.focus||a.classList.contains('level-current'))line(a,b,'correct');
  if(this.failed)line(...this.failed,'wrong');
  const d=this.drag;if(d?.moved&&d.point)line(d.button,d.target,d.target?(d.key===d.target.dataset.target?'correct':'wrong'):'draft',d.point);
 }
 destroy(){clearTimeout(this.timer);this.drag=null;this.failed=null;}
}
