import{ScratchCoverage,GardenGrowth,RollPhysics,RhythmPattern,clamp}from'./activity-models.js?v=activities-53';
const ART='assets/art/';
const make=(tag,cls,parent)=>{const e=document.createElement(tag);if(cls)e.className=cls;parent?.append(e);return e;};
const image=(path,cls,parent)=>{const e=make('img',cls,parent);e.src=ART+path;e.alt='';e.draggable=false;return e;};
const local=(e,element)=>{const r=element.getBoundingClientRect();return{x:clamp((e.clientX-r.left)/r.width,0,1),y:clamp((e.clientY-r.top)/r.height,0,1)};};

/** Five touch activities. One clock owns physics, demonstrations and auto-return. */
export class InteractiveBreak{
 constructor({element,picture,reduced=false,onPlay=()=>{},onComplete=()=>{},onNext=()=>{},isPaused=()=>false,raf=fn=>requestAnimationFrame(fn),caf=id=>cancelAnimationFrame(id)}){
  Object.assign(this,{element,picture,reduced,onPlay,onComplete,onNext,isPaused,raf,caf});
  this.elapsed=0;this.last=null;this.lastInput=0;this.firstInput=null;this.finished=false;this.destroyed=false;this.interactions=0;this.lastEffect=-Infinity;this.listeners=[];this.animations=new Set();this.pointer=null;
  element.className='board fun-board interactive-break '+picture.topic;element.replaceChildren();element.setAttribute('aria-label',picture.title+'. '+picture.rule);
  const head=make('header','fun-heading',element);make('h2','',head).textContent=picture.title;this.hint=make('p','',head);this.hint.textContent=picture.rule;
  this.stage=make('div','activity-stage',element);this.stage.setAttribute('role','group');this.stage.setAttribute('aria-label',picture.rule);
  this.status=make('p','sr-only',element);this.status.setAttribute('role','status');
  this.dots=make('div','activity-progress',element);this.dots.setAttribute('aria-hidden','true');
  if(['wash-toy','magic-reveal'].includes(picture.topic))this.buildScratch();
  else if(picture.topic==='grow-garden')this.buildGarden();
  else if(picture.topic==='roll-ball')this.buildRoll();
  else this.buildDrums();
  this.frame=this.raf(t=>this.tick(t));
 }
 listen(el,type,fn){el.addEventListener(type,fn);this.listeners.push(()=>el.removeEventListener(type,fn));}
 allowed(){return !this.destroyed&&!this.finished&&!this.isPaused();}
 progress(amount,total){this.dots.replaceChildren();for(let i=0;i<total;i++)make('span',i<amount?'earned':'',this.dots);}
 effect(kind,{index=0,x=.5,y=.5,force=false,demo=false}={}){
  if(!force&&this.elapsed-this.lastEffect<180)return;this.lastEffect=this.elapsed;
  this.onPlay({kind:this.picture.topic,effect:kind,index,x,y,taps:this.interactions,demo});
 }
 active(){this.interactions++;this.lastInput=this.elapsed;this.firstInput??=this.elapsed;}
 pulse(el){if(this.reduced)return;const a=el.animate([{scale:'1'},{scale:'1.09',offset:.3},{scale:'1'}],{duration:280,easing:'ease-out'});this.animations.add(a);a.onfinish=()=>this.animations.delete(a);}
 complete(success=true){if(this.destroyed||this.finished)return;this.finished=true;this.finishedAt=this.elapsed;this.cancelDrag();this.stage.classList.add('activity-finished');this.hint.textContent=success?'Lovely! Let’s keep playing.':'Ready for the next game!';this.status.textContent=success?'Activity complete!':'Returning to the next board.';this.onComplete({played:success&&this.interactions>0,completed:success,kind:this.picture.topic});}
 tick(time){if(this.destroyed)return;const dt=this.last===null?0:clamp(time-this.last,0,100);this.last=time;const blocked=this.isPaused();
  if(blocked!==this.blocked){this.blocked=blocked;if(blocked)this.cancelDrag();for(const a of this.element.getAnimations?.({subtree:true})||[])blocked?a.pause():a.play();}
  if(!blocked){this.elapsed+=dt;if(!this.finished)this.update?.(dt);if(!this.finished&&this.firstInput!==null&&this.elapsed-this.firstInput>this.picture.duration&&this.elapsed-this.lastInput>6000)this.complete(false);
   if(this.finished&&this.elapsed-this.finishedAt>=1800){this.destroy();this.onNext();return;}}
  this.frame=this.raf(t=>this.tick(t));
 }
 capture(el,e){if(e.button!==0||!this.allowed()||this.pointer)return false;e.preventDefault();this.pointer={id:e.pointerId,el};el.setPointerCapture(e.pointerId);this.active();return true;}
 cancelDrag(){const p=this.pointer;this.pointer=null;this.scratchPrevious=null;this.watering=-1;this.stage.classList.remove('watering');if(this.can)this.can.style.transform='';if(this.ball&&!this.physics.flight)this.drawBall();if(p){try{if(p.el.hasPointerCapture(p.id))p.el.releasePointerCapture(p.id);}catch{}}}
 destroy(){if(this.destroyed)return;this.destroyed=true;this.cancelDrag();this.caf(this.frame);for(const remove of this.listeners)remove();for(const a of this.animations)a.cancel();this.listeners=[];this.animations.clear();}

 buildScratch(){
  this.phase=0;const wash=this.picture.topic==='wash-toy';this.progress(0,wash?2:1);
  const target=make('div','scratch-target',this.stage);this.scratchTarget=target;
  this.scratchArt=image(this.picture.cards[0].image,'scratch-art',target);
  this.canvas=make('canvas','scratch-canvas',target);this.canvas.width=this.canvas.height=512;this.ctx=this.canvas.getContext('2d');
  const ready=()=>{if(this.destroyed)return;const sample=document.createElement('canvas');sample.width=sample.height=512;const c=sample.getContext('2d');c.drawImage(this.scratchArt,0,0,512,512);const data=c.getImageData(0,0,512,512).data,points=[];
   for(let y=8;y<512;y+=14)for(let x=8;x<512;x+=14)if(data[(y*512+x)*4+3]>100)points.push([x/512,y/512]);
   this.scratchPoints=points;this.resetScratch();};
  if(this.scratchArt.complete&&this.scratchArt.naturalWidth)ready();else this.listen(this.scratchArt,'load',ready);
  const rub=e=>{if(!this.allowed()||this.pointer?.id!==e.pointerId||!this.coverage)return;const point=local(e,target),prev=this.scratchPrevious||point;this.scratchPrevious=point;this.lastInput=this.elapsed;
   this.ctx.save();this.ctx.globalCompositeOperation='destination-out';this.ctx.lineCap='round';this.ctx.lineWidth=78;this.ctx.beginPath();this.ctx.moveTo(prev.x*512,prev.y*512);this.ctx.lineTo(point.x*512,point.y*512);this.ctx.stroke();this.ctx.beginPath();this.ctx.arc(point.x*512,point.y*512,39,0,Math.PI*2);this.ctx.fill();this.ctx.restore();
   if(this.coverage.stroke(prev,point))this.effect(wash?(this.phase?'water':'scrub'):'reveal',{x:point.x,y:point.y});
   if(this.coverage.progress>.79){if(wash&&this.phase===0){this.phase=1;this.progress(1,2);this.hint.textContent='Now swipe away the bubbles!';this.status.textContent='Toy scrubbed. Swipe to rinse.';this.resetScratch();this.effect('water',{force:true});}else{this.ctx.clearRect(0,0,512,512);this.progress(wash?2:1,wash?2:1);this.complete();}}};
  this.listen(this.canvas,'pointerdown',e=>{if(this.capture(this.canvas,e))rub(e);});this.listen(this.canvas,'pointermove',rub);
  this.listen(this.canvas,'pointerup',e=>{if(this.pointer?.id===e.pointerId)this.cancelDrag();});this.listen(this.canvas,'pointercancel',()=>this.cancelDrag());this.listen(this.canvas,'lostpointercapture',()=>this.cancelDrag());
  const help=make('span','scratch-hand',target);help.textContent='↔';help.setAttribute('aria-hidden','true');
  // Keyboard and assistive activation clean one region per action, preserving interaction.
  this.canvas.tabIndex=0;this.canvas.setAttribute('role','button');this.canvas.setAttribute('aria-label',wash?'Rub the toy to clean it. Use arrow keys or Space to brush.':'Brush the picture to reveal its colours. Use arrow keys or Space to brush.');
  this.keyBrush=0;this.listen(this.canvas,'keydown',e=>{if(!this.allowed()||!this.coverage||![' ','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();this.active();const row=this.keyBrush++%7,y=(row+.5)/7;const r=target.getBoundingClientRect();this.pointer={id:-1,el:this.canvas};this.scratchPrevious={x:0,y};rub({pointerId:-1,clientX:r.right,clientY:r.top+y*r.height});this.cancelDrag();});
 }
 resetScratch(){const c=this.ctx;c.clearRect(0,0,512,512);c.globalCompositeOperation='source-over';c.filter=this.picture.topic==='magic-reveal'?'grayscale(1) brightness(.95)':'none';c.drawImage(this.scratchArt,0,0,512,512);c.filter='none';
  if(this.picture.topic==='wash-toy'){
   c.globalCompositeOperation='source-atop';c.fillStyle=this.phase?'#e8faffef':'#8b5c32f5';c.fillRect(0,0,512,512);
   for(let i=0;i<60;i++){const x=(i*137+67)%512,y=(i*83+13)%512,r=7+(i%5)*4;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=this.phase?'#ffffff':'#67432288';c.fill();if(this.phase){c.strokeStyle='#a6deef';c.lineWidth=2;c.stroke();}}
  }
  c.globalCompositeOperation='source-over';this.coverage=new ScratchCoverage(this.scratchPoints,.086);this.scratchPrevious=null;
 }

 buildGarden(){
  this.growth=new GardenGrowth();this.progress(0,3);this.watering=-1;this.pots=[];this.flowers=[];
  const bed=make('div','garden-bed',this.stage);
  for(let i=0;i<3;i++){const pot=make('button','garden-pot',bed);pot.type='button';pot.setAttribute('aria-label',`Water pot ${i+1}. Drag the can here or hold to grow a flower.`);
   const flower=image('counting/flower.webp','garden-flower',pot);flower.style.setProperty('--flower-hue',['0deg','28deg','-28deg'][i]);/* larger shifts turn the leaves brown or blue */image('fun/flower-pot-v1.webp','garden-pot-art',pot);image('fun/flower-pot-v1.webp','garden-pot-art garden-pot-front',pot);const drops=make('span','water-drops',pot);drops.setAttribute('aria-hidden','true');this.pots.push(pot);this.flowers.push(flower);
   this.listen(pot,'pointerdown',e=>{if(this.capture(pot,e)){this.watering=i;this.stage.classList.add('watering');pot.classList.add('being-watered');}});this.listen(pot,'pointerup',()=>this.stopWater());this.listen(pot,'pointercancel',()=>this.stopWater());this.listen(pot,'lostpointercapture',()=>this.stopWater());
   this.listen(pot,'keydown',e=>{if(!this.allowed()||![' ','Enter'].includes(e.key))return;e.preventDefault();this.active();if(this.growth.water(i,350))this.bloom(i);this.paintGarden();});
  }
  this.can=make('button','watering-can',this.stage);this.can.type='button';this.can.setAttribute('aria-label','Drag the watering can onto a pot, and hold to water.');image('assembly/watering-can.webp','',this.can);
  this.listen(this.can,'pointerdown',e=>{if(this.capture(this.can,e)){this.canStart={x:e.clientX,y:e.clientY};this.effect('water',{force:true});}});
  this.listen(this.can,'pointermove',e=>{if(!this.allowed()||this.pointer?.el!==this.can||this.pointer.id!==e.pointerId)return;this.lastInput=this.elapsed;this.can.style.transform=`translate(${e.clientX-this.canStart.x}px,${e.clientY-this.canStart.y}px) rotate(22deg)`;
   this.watering=this.pots.findIndex(p=>{const r=p.getBoundingClientRect();return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;});this.pots.forEach((p,i)=>p.classList.toggle('being-watered',i===this.watering));this.stage.classList.toggle('watering',this.watering>=0);});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])this.listen(this.can,type,()=>this.stopWater());
  this.update=dt=>{if(this.watering<0||!this.pointer)return;this.lastInput=this.elapsed;const i=this.watering;if(this.growth.values[i]<1){if(this.growth.water(i,dt))this.bloom(i);this.effect('water',{index:i,x:(i+.5)/3,y:.65});this.paintGarden();}};
 }
 stopWater(){this.pots.forEach(p=>p.classList.remove('being-watered'));this.cancelDrag();}
 bloom(i){this.pots[i].classList.add('grown');this.pots[i].setAttribute('aria-label',`Flower ${i+1} has bloomed!`);this.effect('bloom',{index:i,force:true});this.progress(this.growth.values.filter(v=>v===1).length,3);this.status.textContent='A flower bloomed!';}
 paintGarden(){this.flowers.forEach((f,i)=>{f.style.opacity=String(clamp(this.growth.values[i]*2,0,1));f.style.transform=`translateX(-50%) scale(${.15+.85*this.growth.values[i]})`;});if(this.growth.complete)this.complete();}

 buildRoll(){
  this.physics=new RollPhysics();this.score=0;this.resetAt=null;this.progress(0,3);this.stage.classList.add('roll-stage');
  make('div','roll-ground',this.stage);this.aim=make('canvas','roll-aim',this.stage);this.aim.width=1000;this.aim.height=500;
  this.basket=make('div','roll-basket',this.stage);image('fun/basket-v1.webp','',this.basket);this.basket.setAttribute('aria-hidden','true');
  this.ball=make('button','rolling-ball',this.stage);this.ball.type='button';this.ball.setAttribute('aria-label','Pull the ball back and release towards the basket. Press Space to roll.');image('counting/ball.webp','',this.ball);this.drawBall();
  this.listen(this.ball,'pointerdown',e=>{if(this.physics.flight||this.resetAt!==null)return;if(this.capture(this.ball,e)){this.pull={x:150,y:365};this.hint.textContent='Pull back… then let go!';}});
  this.listen(this.ball,'pointermove',e=>{if(!this.allowed()||this.pointer?.id!==e.pointerId)return;const p=local(e,this.stage);this.pull={x:clamp(p.x*1000,35,240),y:clamp(p.y*500,300,480)};this.ball.style.left=this.pull.x/10+'%';this.ball.style.top=this.pull.y/5+'%';this.drawAim();this.lastInput=this.elapsed;});
  this.listen(this.ball,'pointerup',e=>{if(this.pointer?.id!==e.pointerId||!this.allowed())return;const p=this.pull;this.cancelDrag();this.launch(p&&Math.hypot(p.x-150,p.y-365)>10?p:undefined);});
  this.listen(this.ball,'pointercancel',()=>this.cancelDrag());this.listen(this.ball,'lostpointercapture',()=>{if(this.pointer)this.cancelDrag();});
  this.listen(this.ball,'click',e=>{if(e.detail===0&&this.allowed()&&!this.physics.flight&&this.resetAt===null){this.active();this.launch();}});
  this.update=dt=>{if(this.resetAt!==null){if(this.elapsed>=this.resetAt){this.physics.reset();this.ball.classList.remove('ball-caught');this.resetAt=null;this.drawBall();}return;}
   const result=this.physics.step(dt/1000);this.drawBall();if(result==='caught'){this.score++;this.progress(this.score,3);this.ball.classList.add('ball-caught');this.pulse(this.basket);this.effect('catch',{force:true,x:.82,y:.65});this.status.textContent=`${this.score} of 3 balls in the basket.`;if(this.score===3)this.complete();else{this.hint.textContent='In it goes! Roll another.';this.resetAt=this.elapsed+750;}}
   else if(result==='retry'){this.hint.textContent='Have another roll!';this.resetAt=this.elapsed+550;}};
 }
 launch(pull){this.physics.launch(pull);this.aim.getContext('2d').clearRect(0,0,1000,500);this.effect('roll',{force:true,x:.2,y:.8});}
 drawBall(){this.ball.style.left=this.physics.x/10+'%';this.ball.style.top=this.physics.y/5+'%';this.ball.style.setProperty('--roll-angle',this.reduced?'0deg':this.physics.x*.8+'deg');}
 drawAim(){const c=this.aim.getContext('2d');c.clearRect(0,0,1000,500);const p=new RollPhysics();p.launch(this.pull);c.fillStyle='#6ea9a4';for(let i=0;i<25;i++){p.step(.035);if(i%3===0){c.beginPath();c.arc(p.x,p.y,4,0,Math.PI*2);c.fill();}}}

 buildDrums(){
  this.progress(0,2);this.patternRound=0;this.pattern=new RhythmPattern([0,2]);this.mode='listen';this.demoAt=this.elapsed+600;this.demoIndex=0;this.pads=[];
  const pads=make('div','drum-pads',this.stage);const labels=['Low drum','Middle drum','High drum'];
  for(let i=0;i<3;i++){const pad=make('button','drum-pad',pads);pad.type='button';pad.style.setProperty('--drum-hue',i*95+'deg');pad.setAttribute('aria-label',labels[i]+'. Tap or press to play.');image('assembly/drum.webp','',pad);const marker=make('span','drum-beat',pad);marker.textContent=String(i+1);marker.setAttribute('aria-hidden','true');this.pads.push(pad);
   this.listen(pad,'pointerdown',e=>{if(e.button!==0||!this.allowed())return;e.preventDefault();this.drumTap(i);});this.listen(pad,'click',e=>{if(e.detail===0&&this.allowed())this.drumTap(i);});}
  this.hint.textContent='Listen to Sparky… then play!';
  this.update=()=>{if(this.mode!=='listen'||this.elapsed<this.demoAt)return;if(this.demoIndex<this.pattern.sequence.length){this.hitDrum(this.pattern.sequence[this.demoIndex++],true);this.demoAt=this.elapsed+600;}else{this.mode='copy';this.hint.textContent='Your turn! Copy the glowing drums.';this.showBeat();}};
 }
 hitDrum(i,demo=false){this.pulse(this.pads[i]);this.effect('drum-'+i,{index:i,force:true,demo,x:(i+.5)/3,y:.65});const note=make('span','drum-note',this.pads[i]);note.textContent='♪';note.setAttribute('aria-hidden','true');if(this.reduced){note.remove();return;}const a=note.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-50px)'}],{duration:500});this.animations.add(a);a.onfinish=()=>{note.remove();this.animations.delete(a);};}
 showBeat(){this.pads.forEach((p,i)=>p.classList.toggle('next-beat',this.mode==='copy'&&i===this.pattern.sequence[this.pattern.at]));}
 drumTap(i){this.active();if(this.mode==='listen'){this.mode='copy';this.demoAt=Infinity;}this.hitDrum(i);
  if(this.pattern.tap(i)){this.patternRound++;this.progress(this.patternRound,2);if(this.patternRound===2){this.complete();return;}this.pattern=new RhythmPattern([1,0,2]);this.demoIndex=0;this.mode='listen';this.demoAt=this.elapsed+900;this.hint.textContent='Nice beat! Listen to this one…';}this.showBeat();}
}
