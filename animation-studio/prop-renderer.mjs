import{evaluateMotion,clamp,smooth}from'./motion-math.mjs';
import{foodByIndex,foodImages,objectImage}from'../variants/food-catalogue.mjs';
import{servingPlan}from'../variants/serving-rules.mjs';
import{friendSvg}from'../variants/art.mjs';
const friendImages=[0,1,2].map(type=>{const img=new Image();img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(friendSvg(type));return img});
const images=new Map();
const feedingSheet=new Image();
const curatedImages=new Map();
function foodPicture(ctx,index,x,y,size=40){const sources=foodImages(foodByIndex(index));if(sources.length){sources.forEach((src,i)=>{let img=curatedImages.get(src);if(!img){img=new Image();img.src=new URL('../assets/art/'+src,import.meta.url);curatedImages.set(src,img)}if(img.complete&&img.naturalWidth){const portion=sources.length>1?size*.64:size,w=portion*img.naturalWidth/Math.max(img.naturalWidth,img.naturalHeight),h=portion*img.naturalHeight/Math.max(img.naturalWidth,img.naturalHeight),offset=sources.length>1?(i-.5)*size*.46:0;ctx.save();ctx.translate(x+offset,y);ctx.scale(1,-1);ctx.drawImage(img,-w/2,-h/2,w,h);ctx.restore()}});return;}if(!feedingSheet.src)feedingSheet.src=new URL('../assets/art/variants/indian-food-sheet-v1.webp',import.meta.url);if(!feedingSheet.complete||!feedingSheet.naturalWidth)return;const cell=feedingSheet.naturalWidth/4;ctx.save();ctx.translate(x,y);ctx.scale(1,-1);ctx.drawImage(feedingSheet,index%4*cell,Math.floor(index/4)*cell,cell,cell,-size/2,-size/2,size,size);ctx.restore()}
function foodPortion(ctx,food,x,y,size){
 const plan=servingPlan(food),src=plan.portionImage;if(!src){foodPicture(ctx,food.index,x,y,size);return;}
 let img=curatedImages.get(src);if(!img){img=new Image();img.src=new URL('../assets/art/'+src,import.meta.url);curatedImages.set(src,img);}if(!img.complete||!img.naturalWidth)return;
 const crop=plan.crop??[0,0,1,1];ctx.save();ctx.translate(x,y);ctx.scale(1,-1);if(plan.crop){ctx.beginPath();ctx.ellipse(0,0,size*.5,size*.35,0,0,Math.PI*2);ctx.clip();}ctx.drawImage(img,crop[0]*img.naturalWidth,crop[1]*img.naturalHeight,crop[2]*img.naturalWidth,crop[3]*img.naturalHeight,-size/2,-size*.35,size,size*.7);ctx.restore();
}
const eatingToolImages=new Map();
function feedingTool(ctx,method,x,y){let img=document.querySelector('.feeding-utensil .dining-'+method);if(!img?.complete||!img.naturalWidth){img=eatingToolImages.get(method);if(!img){img=new Image();img.src=new URL('../assets/art/figma-ui/feeding-'+method+'.webp',import.meta.url);eatingToolImages.set(method,img);}}if(!img.complete||!img.naturalWidth)return;ctx.save();ctx.translate(x,y);ctx.scale(1,-1);ctx.rotate(-65*Math.PI/180);ctx.drawImage(img,-8,-55*.18,16,55);ctx.restore();}
function fedServing(ctx,clip,time,rendered){
 const index=clip.sceneState?.foodIndex??8;if(!clip.sceneState?.fullFeeding)foodPicture(ctx,index,0,134,43);
 if(clip.id==='FD07'&&time>.5&&time<2.1){const m=anchor(rendered,'Mouth_Sad',null)??anchor(rendered,'Mouth_Smile',[0,211]);ctx.save();ctx.globalAlpha=.5+.5*Math.sin(time*15)**2;ctx.strokeStyle='#eb9d35';ctx.lineWidth=2;ctx.lineCap='round';for(let i=0;i<3;i++){const x=m[0]+69+i*5,y=m[1]+8+i*6;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+5,y+2);ctx.lineTo(x+3,y+6);ctx.lineTo(x+8,y+8);ctx.stroke()}ctx.restore()}
 if(clip.sceneState?.fullFeeding&&clip.sceneState?.externalDelivery)return;
 if(!['FD02','FD14'].includes(clip.id))return;
 if(clip.sceneState?.fullFeeding||clip.feedingFace){const m=anchor(rendered,'Mouth_O',null)??anchor(rendered,'Mouth_Smile',[0,211]),food=foodByIndex(index),method=clip.sceneState?.serviceUtensil??servingPlan(food).method,bite=smooth((time-.28)/.38),withdraw=smooth((time-.68)/.42);
  if(method==='cup'){if(time<1.1){ctx.save();ctx.globalAlpha=1-withdraw;foodPicture(ctx,index,m[0]+9+withdraw*10,m[1]-14-withdraw*12,32);ctx.restore();}return;}
  if(['spoon','fork'].includes(method)&&time<1.1){ctx.save();ctx.globalAlpha=1-withdraw;feedingTool(ctx,method,m[0]+withdraw*13,m[1]-withdraw*12);ctx.restore();}
  if(time<.66)foodPortion(ctx,food,m[0],m[1],22*(1-bite));return;}
 const mouth=anchor(rendered,'Mouth_O',null)??anchor(rendered,'Mouth_Teeth',null)??anchor(rendered,'Mouth_Smile',[0,211]),approach=smooth((time-.15)/.85),withdraw=smooth((time-1.3)/.4),mix=approach*(1-withdraw),start=clip.sceneState?.fullFeeding?[58,84]:[112,138];
 if(index===11){const tilt=.2*approach,c=Math.cos(tilt),s=Math.sin(tilt),target=[mouth[0]+12*c+13*s,mouth[1]+12*s-13*c],p=start.map((v,i)=>v+(target[i]-v)*mix);cup(ctx,p[0],p[1],tilt);return}
 if(index<8){const target=[mouth[0]+20,mouth[1]-7],p=start.map((v,i)=>v+(target[i]-v)*mix),loaded=time<1.25;spoon(ctx,p[0],p[1],0,loaded);if(loaded){const colours=['#fff9db','#edca41','#d7a634','#e4bc77','#d5b84a','#e1bc67','#efcc48','#fffdf4'];ellipse(ctx,p[0]-20,p[1]+8,4,2,colours[index]);if([1,2,4].includes(index))ellipse(ctx,p[0]-21,p[1]+9,1.2,.8,'#69a450')}return}
 const p=start.map((v,i)=>v+(mouth[i]-v)*mix);if(time>=1.25)return;
 ctx.save();ctx.translate(p[0],p[1]);if(index===8){ellipse(ctx,0,0,7,4,'#ffe477','#d2a641');ellipse(ctx,0,0,4.5,2.8,'#fff0ac')}else if(index===9){ctx.fillStyle='#ffca3e';ctx.strokeStyle='#df9937';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-7,-4);ctx.quadraticCurveTo(0,9,8,-2);ctx.closePath();ctx.fill();ctx.stroke()}else{ellipse(ctx,0,0,7,6,'#96c866','#67954c');ellipse(ctx,0,0,5,4.5,'#ffe6b4');for(const x of[-2,1,3])ellipse(ctx,x,0,.7,1,'#a8844d')}ctx.restore();
}
for(const name of ['apple','balloon','carrot','duck']){const img=new Image();img.src=new URL('../assets/art/'+objectImage(name),import.meta.url);images.set(name,img)}
export function paintText(ctx,text,x,y,size=14,colour='#285779'){ctx.save();ctx.translate(x,y);ctx.scale(1,-1);ctx.fillStyle=colour;ctx.font=`900 ${size}px Nunito, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,0,0);ctx.restore()}
function rounded(ctx,x,y,w,h,r=9){ctx.beginPath();ctx.roundRect(x-w/2,y-h/2,w,h,r)}
function card(ctx,x,y,w=68,h=85){ctx.save();ctx.shadowColor='#224a601c';ctx.shadowBlur=6;ctx.shadowOffsetY=2;rounded(ctx,x,y,w,h);ctx.fillStyle='#fffefa';ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#9dcbe2';ctx.lineWidth=1.2;ctx.stroke();ctx.restore()}
function picture(ctx,name,x,y,size=45){const image=images.get(name);if(image?.complete&&image.naturalWidth){ctx.save();ctx.translate(x,y);ctx.scale(1,-1);const r=image.naturalWidth/image.naturalHeight,w=r>1?size:size*r,h=r>1?size/r:size;ctx.drawImage(image,-w/2,-h/2,w,h);ctx.restore()}}
export function anchor(rendered,name,fallback){const v=rendered?.findSlot(name)?.getAttachment()?.vertices;if(!v?.length)return fallback;let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;for(let i=0;i<v.length;i+=2){x0=Math.min(x0,v[i]);x1=Math.max(x1,v[i]);y0=Math.min(y0,v[i+1]);y1=Math.max(y1,v[i+1])}return[(x0+x1)/2,(y0+y1)/2]}
function ellipse(ctx,x,y,rx,ry,fill,stroke){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.2;ctx.stroke()}}
function plate(ctx,x,y,filled=false){ellipse(ctx,x,y-2,43,10,'#58a8d0','#2b6d96');ellipse(ctx,x,y,44,9,'#e8f8ff','#4d93b7');ellipse(ctx,x,y+1,34,6,'#c0e3f1');if(filled){for(const dx of [-15,4,18])ellipse(ctx,x+dx,y+4,10,5,'#fff2ce','#d8c594');ellipse(ctx,x-28,y+3,6,4,'#f29b34');ellipse(ctx,x+28,y+3,6,4,'#6aab60')}}
function portion(ctx,x,y,bitten=false){ctx.save();ctx.translate(x,y);const g=ctx.createLinearGradient(0,8,0,-8);g.addColorStop(0,'#fffce8');g.addColorStop(1,'#e5d6a8');ellipse(ctx,0,0,13,9,g,'#b6a674');if(bitten){ctx.globalCompositeOperation='destination-out';ellipse(ctx,-8,7,4,4,'#000');ctx.globalCompositeOperation='source-over'}ellipse(ctx,3,3,2,1,'#79a852');ctx.restore()}
function spoon(ctx,x,y,angle=0,loaded=false){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.strokeStyle='#567c91';ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(-14,4);ctx.stroke();ctx.strokeStyle='#d6eaf3';ctx.lineWidth=2;ctx.stroke();ellipse(ctx,-20,5,8,4,'#c9e2ed','#6a90a4');if(loaded)ellipse(ctx,-20,7,6,2.5,'#ead18b');ctx.restore()}
function cup(ctx,x,y,angle=0){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.lineWidth=4;ctx.strokeStyle='#3389bd';ctx.beginPath();ctx.ellipse(16,-1,7,9,0,0,Math.PI*2);ctx.stroke();const g=ctx.createLinearGradient(-12,0,12,0);g.addColorStop(0,'#329bdd');g.addColorStop(.45,'#b8eeff');g.addColorStop(1,'#399cda');rounded(ctx,0,-2,25,32,5);ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='#2777a6';ctx.lineWidth=1.4;ctx.stroke();ellipse(ctx,0,13,12,3.5,'#f0fcff','#2777a6');ellipse(ctx,0,13,8,2,'#90d6f4');ctx.restore()}
function bowl(ctx,x,y){ctx.fillStyle='#399bce';ctx.strokeStyle='#316a8c';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x-26,y);ctx.bezierCurveTo(x-22,y-27,x+22,y-27,x+26,y);ctx.closePath();ctx.fill();ctx.stroke();ellipse(ctx,x,y,26,7,'#e8f9ff','#316a8c');ellipse(ctx,x,y,21,4.5,'#e5c97b');for(const[dx,dy]of[[-10,1],[2,-1],[11,1]])ellipse(ctx,x+dx,y+dy,2.2,1.3,'#75a653')}
function glasses(ctx,x,y,scale=1){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);for(const dx of[-13,13]){ellipse(ctx,dx,0,11,10,'#c2f4ff70','#1f6089');ellipse(ctx,dx-3,3,3,1.5,'#ffffffb0')}ctx.strokeStyle='#1f6089';ctx.lineWidth=2.8;ctx.beginPath();ctx.moveTo(-3,2);ctx.quadraticCurveTo(0,6,3,2);ctx.moveTo(-24,3);ctx.lineTo(-29,6);ctx.moveTo(24,3);ctx.lineTo(29,6);ctx.stroke();ctx.restore()}
function hat(ctx,x,y,helmet=false){ctx.save();ctx.translate(x,y);ctx.beginPath();ctx.moveTo(-28,0);ctx.bezierCurveTo(-28,34,28,34,28,0);ctx.closePath();const g=ctx.createLinearGradient(-25,0,25,24);g.addColorStop(0,helmet?'#ed7e24':'#1278ca');g.addColorStop(.5,helmet?'#ffbf59':'#54c4f6');g.addColorStop(1,helmet?'#f89d31':'#168ad8');ctx.fillStyle=g;ctx.fill();ctx.strokeStyle=helmet?'#a65224':'#246c9d';ctx.lineWidth=1.4;ctx.stroke();if(helmet){for(const dx of[-13,0,13]){ctx.strokeStyle='#a85824';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(dx,8);ctx.lineTo(dx*.75,19);ctx.stroke()}}else{ellipse(ctx,0,23,3,2,'#f6ab3e');ellipse(ctx,17,0,22,4,'#f6ab3e','#b97b2e')}ctx.restore()}
function friend(ctx,type){const g=ctx.createLinearGradient(75,0,135,0);g.addColorStop(0,'#59b4aa');g.addColorStop(.5,'#a6e4cf');g.addColorStop(1,'#5db7a6');rounded(ctx,105,73,47,76,12);ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='#4a918c';ctx.lineWidth=1.5;ctx.stroke();ctx.fillStyle='#7fc3b6';ctx.fillRect(96,109,18,17);for(const x of[90,120]){ctx.fillStyle='#589b99';ctx.fillRect(x-5,16,10,22);ellipse(ctx,x,13,12,6,'#397c89','#245e73')}if(Number.isInteger(type)&&friendImages[type]?.complete){ctx.save();ctx.translate(105,158);ctx.scale(1,-1);ctx.drawImage(friendImages[type],-41,-41,82,82);ctx.restore();return}rounded(ctx,105,147,58,57,17);ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='#4a918c';ctx.stroke();for(const x of[93,117]){ellipse(ctx,x,156,7,9,'#fff');ellipse(ctx,x,156,3.5,5,'#264e60');ellipse(ctx,x-1,158,1,1.5,'#fff')}ctx.strokeStyle='#407d7b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(98,136);ctx.quadraticCurveTo(105,131,112,136);ctx.stroke();ellipse(ctx,105,78,10,10,'#f9c563','#bd9347');ctx.fillStyle='#f9e4a6';ctx.fillRect(102,74,6,8)}
function garden(ctx,clip,time,hand){
 ellipse(ctx,89,49,49,13,'#ba8450','#916138');ellipse(ctx,89,54,45,10,'#a27042');
 const hole=clip.prop==='dig'?smooth((time-1.05)/.4):['seed','cover'].includes(clip.prop)?1:0,cover=clip.prop==='cover'?smooth((time-.6)/.7):0;
 if(hole)ellipse(ctx,89,55,11*(1-cover),4*(1-cover),'#67432e');
 if(clip.prop==='dig'){ctx.save();ctx.translate(hand[0]+2,hand[1]);ctx.rotate(-.25);ctx.strokeStyle='#b5743f';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,8);ctx.lineTo(0,-15);ctx.stroke();ctx.fillStyle='#bad3df';ctx.strokeStyle='#567e91';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-7,-13);ctx.lineTo(7,-13);ctx.quadraticCurveTo(7,-27,0,-31);ctx.quadraticCurveTo(-7,-27,-7,-13);ctx.fill();ctx.stroke();if(time>1.45&&time<2.4)ellipse(ctx,1,-26,6,3,'#a27042');ctx.restore()}
 if(clip.prop==='seed'){const fall=smooth((time-1.15)/.4),x=time<1.15?hand[0]:hand[0]+(89-hand[0])*fall,y=time<1.15?hand[1]+4:hand[1]+4+(55-hand[1]-4)*fall;if(time<1.7)ellipse(ctx,x,y,3,4,'#dfb36f','#a4763e')}
 if(clip.prop==='water'){const pouring=time>=1.3&&time<=2.4,angle=-.32*smooth((time-.7)/.6)*(1-smooth((time-2.4)/.7)),x=hand[0]-23,y=hand[1]-15;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.strokeStyle='#477c9c';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(-9,16,12,10,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#83cce6';ctx.strokeStyle='#397b9d';ctx.lineWidth=1.3;rounded(ctx,0,0,36,30,8);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(16,5);ctx.lineTo(36,15);ctx.lineTo(39,10);ctx.lineTo(16,-2);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();if(pouring){const spout=[x+38*Math.cos(angle)-12*Math.sin(angle),y+38*Math.sin(angle)+12*Math.cos(angle)];ctx.strokeStyle='#6dc3e9b0';ctx.lineWidth=2;for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(spout[0],spout[1]+i);ctx.quadraticCurveTo(spout[0]+4+i*2,65,89+i*6,56);ctx.stroke()}}if(time>1.3){ctx.globalAlpha=.4*smooth((time-1.3)/.6);ellipse(ctx,89,54,22,5,'#654c35');ctx.globalAlpha=1}}
 if(clip.prop==='sprout'){if(time<.7){paintText(ctx,'Time passes…',103,135,12)}else{const growth=smooth((time-.7)/1.4),top=55+48*growth;ctx.strokeStyle='#4c9959';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(89,55);ctx.quadraticCurveTo(84,75,91,top);ctx.stroke();ctx.save();ctx.translate(89,top-8);ctx.scale(growth,growth);ctx.fillStyle='#80be67';ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(-28,0,-27,20,-18,14);ctx.quadraticCurveTo(-4,11,0,0);ctx.fill();ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(28,4,26,24,17,19);ctx.quadraticCurveTo(4,14,0,0);ctx.fill();ctx.restore()}}
}
function sink(ctx,clip,time,hand,left){
 for(const x of[-51,72]){ctx.fillStyle='#76a9b9';ctx.fillRect(x-3,5,6,118)}
 ctx.strokeStyle='#75a7bc';ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(60,136);ctx.lineTo(60,174);ctx.quadraticCurveTo(60,190,42,190);ctx.lineTo(13,190);ctx.lineTo(13,179);ctx.stroke();ctx.strokeStyle='#e6f6ff';ctx.lineWidth=2;ctx.stroke();ctx.strokeStyle='#4d7f97';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(57,171);ctx.lineTo(72,171);ctx.stroke();
 const flow=clip.prop==='tap'?time>=.9&&time<2.4:clip.prop==='rinse'&&time<3.1;
 if(flow){ctx.strokeStyle='#84d1f2aa';ctx.lineWidth=3;for(const dx of[-3,0,3]){ctx.beginPath();ctx.moveTo(13+dx,179);ctx.lineTo(13+dx+Math.sin(time*11+dx),139);ctx.stroke()}}
 ellipse(ctx,8,128,67,13,'#e4f4fc','#568fa9');ellipse(ctx,8,130,55,9,'#acd7e7');ctx.fillStyle='#a6cbdc';ctx.beginPath();ctx.moveTo(-59,128);ctx.bezierCurveTo(-51,99,64,99,75,128);ctx.fill();
 rounded(ctx,80,142,16,25,4);ctx.fillStyle='#f8bc66';ctx.fill();ctx.strokeStyle='#b7884e';ctx.lineWidth=1;ctx.stroke();ctx.strokeStyle='#658e9d';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(80,155);ctx.lineTo(80,160);ctx.lineTo(70,160);ctx.stroke();
 if(clip.prop==='soap'||clip.prop==='rinse'){const foam=clip.prop==='soap'?smooth((time-.85)/.5)*(1-smooth((time-4.3)/.6)):1-smooth((time-.7)/2.1);for(let i=0;i<9;i++){const x=(hand[0]+left[0])/2+(i%3-1)*7,y=(hand[1]+left[1])/2+Math.floor(i/3)*5;ellipse(ctx,x,y,(3+i%2)*foam,(3+i%2)*foam,'#ffffffdc','#b8e0ed')}}
 const held=clip.prop==='towel'&&time>=.7&&time<3.7,x=held?(hand[0]+left[0])/2:91,y=held?(hand[1]+left[1])/2-4:122;rounded(ctx,x,y,held?49:23,held?30:22,4);ctx.fillStyle='#fff5cf';ctx.fill();ctx.strokeStyle='#d4bf83';ctx.lineWidth=1;ctx.stroke();
}
function kitchen(ctx,clip,time,hand,left){
 for(const x of[-81,81]){ctx.fillStyle='#6ca0ac';ctx.fillRect(x-4,4,8,119)}rounded(ctx,0,119,197,18,8);ctx.fillStyle='#b7e0df';ctx.fill();ctx.strokeStyle='#6ca0ac';ctx.lineWidth=1.4;ctx.stroke();bowl(ctx,0,143);
 if(clip.prop==='mix'||clip.prop==='garnish')spoon(ctx,hand[0],hand[1]+2,clip.prop==='mix'?Math.sin(time*5)*.12:0,clip.prop==='garnish'&&time<1.4);
 if(clip.prop==='ingredients'||clip.prop==='batter'){const tilt=smooth((time-.7)/.6)*(1-smooth((time-2.2)/.6)),x=hand[0]-9,y=hand[1]+2;cup(ctx,x,y,-tilt*.7);if(tilt>.8){ctx.strokeStyle=clip.prop==='batter'?'#f0d9a2':'#ffefcc';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-14,y+6);ctx.quadraticCurveTo(13,158,0,144);ctx.stroke()}}
 if(clip.prop==='garnish'&&time>=1.4){for(const dx of[-8,3,11])ellipse(ctx,dx,145,2.5,1.5,'#69a65a')}
}
function projection(ctx,canvas){ctx.setTransform(canvas.width/432,0,0,-canvas.height/540,canvas.width/2,canvas.height/2+201.5*canvas.height/540)}
const chairArt=new Image();chairArt.src=new URL('../sparky-current/runtime/character-upgrade/12-sparky-final/limbs-v2/limb-parts.svg',import.meta.url);
export const LEARNING_PROP_LAYOUT={side:178,width:54,innerEdge:151};
const learningScenes=new Set(['target','pair','count','word','case','compare','steps']);
function learningProps(ctx,clip,time){const scene=clip.scene,x=LEARNING_PROP_LAYOUT.side;
 if(scene==='target'){card(ctx,x,165,54,85);picture(ctx,'apple',x,168,43);paintText(ctx,'Apple',x,137,9)}
 if(scene==='pair'){for(const side of[-x,x]){card(ctx,side,170,54,85);picture(ctx,'apple',side,175,43);paintText(ctx,'Apple',side,142,9)}if(time>1.8){ctx.globalAlpha=smooth((time-1.8)/.3);ctx.strokeStyle='#69a981';ctx.lineWidth=2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(-151,118);ctx.quadraticCurveTo(0,83,151,118);ctx.stroke();ctx.setLineDash([])}}
 if(scene==='compare'){for(const side of[-x,x]){card(ctx,side,172,54,122);for(let i=0;i<3;i++)picture(ctx,side<0?'apple':'balloon',side,207-i*33,25);paintText(ctx,'3',side,123,16)}}
 if(scene==='count'){for(let i=0;i<3;i++){const y=205-i*43,active=time>=[.85,1.55,2.25][i];ctx.fillStyle=active?'#e0f1e0':'#ffffffd9';rounded(ctx,x,y,50,38,8);ctx.fill();if(active){ctx.strokeStyle='#73b08a';ctx.lineWidth=1;ctx.stroke()}picture(ctx,'apple',x-3,y,25);paintText(ctx,String(i+1),x+18,y,11,active?'#42865b':'#7896a5')}if(time>=2.8)paintText(ctx,'3',x,66,23,'#42865b')}
 if(scene==='word'){card(ctx,x,188,54,132);paintText(ctx,'APPLE',x,228,11);picture(ctx,'apple',x,175,47);paintText(ctx,'word / picture',x,139,6.5)}
 if(scene==='case'){card(ctx,x,213,54,54);paintText(ctx,'A',x,213,30);card(ctx,x,139,54,54);paintText(ctx,'a',x,139,30)}
 if(scene==='steps')for(let i=0;i<3;i++){const y=217-i*61;card(ctx,x,y,54,50);paintText(ctx,['First','Next','Last'][i],x,y+11,8);paintText(ctx,String(i+1),x,y-9,17)}
}
export function drawStudioBack(canvas,clip,time=0){const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);if(learningScenes.has(clip?.scene)){ctx.save();projection(ctx,canvas);learningProps(ctx,clip,time);ctx.restore();return;}if(clip?.scene!=='table'||clip?.upperBodyOnly||clip?.sceneState?.story==='ST03'||clip?.sceneState?.fullFeeding)return;ctx.save();projection(ctx,canvas);if(chairArt.complete&&chairArt.naturalWidth){ctx.translate(-76,185);ctx.scale(1,-1);ctx.drawImage(chairArt,768,512,256,256,0,0,152,190)}ctx.restore()}
export function drawStudioProps(canvas,clip,time,rendered){const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);if(!clip?.scene||learningScenes.has(clip.scene))return;ctx.save();projection(ctx,canvas);
 const scene=clip.scene;
 if(scene==='table'&&clip.sceneState?.fullFeeding){if(clip.prop==='fed-food')fedServing(ctx,clip,time,rendered)}
 if(scene==='table'&&!clip.sceneState?.fullFeeding){
  const pose=evaluateMotion(clip,time),fallback=pose.arms.R?.wrist??[43,127],hand=anchor(rendered,'Hand_R',fallback),left=anchor(rendered,'Hand_L',pose.arms.L?.wrist??[-43,127]);
  for(const x of[-91,91]){ctx.fillStyle='#68a5ad';ctx.fillRect(x-4,6,8,101);ellipse(ctx,x,6,9,3,'#6199a3')}
  const g=ctx.createLinearGradient(0,116,0,100);g.addColorStop(0,'#c7edf0');g.addColorStop(.35,'#9bd6dc');g.addColorStop(1,'#5c9da8');rounded(ctx,0,108,220,19,9);ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='#4d8996';ctx.lineWidth=1.4;ctx.stroke();
  const serving=clip.prop==='serve',clearing=clip.prop==='clear',held=serving&&time<1.8||clearing&&time>=.65&&time<2.6,plateY=held?(left[1]+hand[1])/2-5:122,plateX=held?(left[0]+hand[0])/2:clearing&&time>=2.6?45:0;
  if(clip.prop==='spoon')bowl(ctx,0,131);else plate(ctx,plateX,plateY,!['F01','F02','F03','C11'].includes(clip.id)&&clip.prop!=='fed-food');
  if(clip.prop==='receive'){const held=time>=1.05;portion(ctx,held?hand[0]:103,held?hand[1]+4:144)}
  if(clip.prop==='handheld')portion(ctx,hand[0]-6,hand[1]+5,time>=1.25);
  if(clip.prop==='spoon')spoon(ctx,hand[0],hand[1]+2,time>=1.3&&time<=2.5?-.15:0,time>=.65&&time<1.95);
  if(clip.prop==='set-down'){const held=time<1.1;spoon(ctx,held?hand[0]:66,held?hand[1]+2:122,0,false)}
  if(clip.prop==='cup'){const held=time>=.85&&time<3.8;cup(ctx,held?hand[0]-12:83,held?hand[1]+5:138,time>=1.9&&time<2.65?.25*smooth((time-1.9)/.4):0)}else cup(ctx,89,138);
  if(clip.prop==='variety'){card(ctx,150,153,66,83);picture(ctx,'carrot',150,158,45);paintText(ctx,'Add a vegetable',150,126,7)}
  if(clip.prop==='fed-food')fedServing(ctx,clip,time,rendered);
  if(clip.sceneState?.story==='MEAL'){foodPicture(ctx,clip.sceneState.foodIndex??0,plateX,plateY+5,48);const sides=(clip.sceneState.mealFoods??[]).filter(i=>i!==clip.sceneState.foodIndex&&foodByIndex(i).group!=='water');sides.forEach((index,i)=>foodPicture(ctx,index,-26+i*52,plateY+1,24));}
 }
 if(scene==='accessory'){
  const p=evaluateMotion(clip,time),hand=anchor(rendered,'Hand_R',p.arms.R?.wrist??[59,124]);
  if(clip.prop==='grid'){
   card(ctx,145,174,112,128);for(let row=0;row<2;row++)for(let col=0;col<2;col++){const x=121+col*46,y=181-row*40,active=time>=2.15&&row===0&&col===1;rounded(ctx,x,y,40,34,5);ctx.fillStyle=active?'#def0df':'#e5f1f6';ctx.fill();ctx.strokeStyle=time>=.9&&time<1.5&&row===0||time>=1.5&&time<2.15&&col===1?'#f6ae4a':'#a4c5d4';ctx.lineWidth=1.2;ctx.stroke();if(active)glasses(ctx,x,y,.45)}paintText(ctx,'Match two clues',145,225,9);paintText(ctx,'Row → column → cell',145,122,7)
  }else{
   friend(ctx,clip.sceneState?.friendType);card(ctx,105,113,72,12);
   if(clip.prop==='inspect')glasses(ctx,hand[0]+8,hand[1]+8,.8);
   if(clip.prop==='glasses'){if(time<1.6)glasses(ctx,hand[0]+12,hand[1]+5);else glasses(ctx,105,157)}
   if(clip.prop==='cap'){if(time<2.05)hat(ctx,hand[0]+12,hand[1]+12);else hat(ctx,105,174)}
   if(clip.prop==='helmet'){if(time<2.25)hat(ctx,hand[0]+12,hand[1]+13,true);else hat(ctx,105,174,true);if(time>=2.7){ctx.strokeStyle='#405b6b';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(80,176);ctx.lineTo(88,133);ctx.quadraticCurveTo(105,118,122,133);ctx.lineTo(130,176);ctx.stroke()}}
   if(clip.prop==='remove'){if(time<.85)glasses(ctx,105,157);else if(time<2.6)glasses(ctx,hand[0]+12,hand[1]+5);else glasses(ctx,105,120,.8)}
  }
 }
 if(['garden','sink','kitchen'].includes(scene)){const pose=evaluateMotion(clip,time),hand=anchor(rendered,'Hand_R',pose.arms.R?.wrist??[59,124]),left=anchor(rendered,'Hand_L',pose.arms.L?.wrist??[-58,124]);if(scene==='garden')garden(ctx,clip,time,hand);if(scene==='sink')sink(ctx,clip,time,hand,left);if(scene==='kitchen')kitchen(ctx,clip,time,hand,left)}
 if(scene==='garden'&&clip.sceneState?.plantGrown)garden(ctx,{prop:'sprout'},3.4,[0,0]);
 if(scene==='cook'){
  ctx.save();ctx.translate(40,20);ctx.scale(1,1.4);friend(ctx);ctx.fillStyle='#fffefa';ctx.strokeStyle='#8cadba';ctx.lineWidth=1.2;rounded(ctx,105,183,65,18,7);ctx.fill();ctx.stroke();for(const dx of[-22,0,22])ellipse(ctx,105+dx,197,15,13,'#fffefa','#8cadba');ctx.restore();
  rounded(ctx,145,121,112,15,6);ctx.fillStyle='#a9d4db';ctx.fill();ctx.strokeStyle='#6596a8';ctx.stroke();for(const x of[103,185]){ctx.fillStyle='#6596a8';ctx.fillRect(x,3,6,110)}ellipse(ctx,145,137,30,7,'#364b61','#19344d');ctx.strokeStyle='#364b61';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(172,138);ctx.lineTo(195,143);ctx.stroke();const flip=time>1.7&&time<3.1?Math.sin((time-1.7)/1.4*Math.PI)*34:0;ellipse(ctx,145,141+flip,23,4,'#e4b46a','#a97131');ctx.strokeStyle='#6596a8';ctx.lineWidth=9;ctx.lineCap='round';const wrist=[151+Math.sin(time*2)*5,166+Math.sin(time*2)*9];ctx.beginPath();ctx.moveTo(133,191);ctx.lineTo(126,174);ctx.lineTo(...wrist);ctx.stroke();ellipse(ctx,...wrist,7,6,'#fffefa','#70939f');ctx.strokeStyle='#8b9caa';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(...wrist);ctx.lineTo(146,146+flip*.3);ctx.stroke();paintText(ctx,'A grown-up helps with cooking',140,325,10)
 }
 if(clip.sceneState?.caption&&!clip.sceneState.hideCanvasCaption){card(ctx,0,436,378,35);paintText(ctx,clip.sceneState.caption,0,436,12)}
 ctx.restore();
}
