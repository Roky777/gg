import{artNode}from'./art.mjs';
import{servingPlan}from'./serving-rules.mjs';
export function servingNode(food){
 const plan=servingPlan(food),root=document.createElement('span');root.className='food-serving serving-'+plan.dish;root.dataset.servingMethod=plan.method;root.setAttribute('aria-hidden','true');
 if(plan.dish==='plate'||plan.dish==='bowl'){
  const src=plan.dish==='plate'?'assets/art/play-kit/serving-plate.svg':'assets/art/feeding-room/serving-bowl-back.svg',back=new Image();back.src=src;back.className='serving-dish-back';back.alt='';back.draggable=false;root.append(back);
 }
 const foodLayer=document.createElement('span');foodLayer.className='serving-food';foodLayer.append(artNode(food));root.append(foodLayer);
 if(plan.dish==='plate'||plan.dish==='bowl'){
  const front=new Image();front.src=plan.dish==='plate'?'assets/art/play-kit/serving-plate-front.svg':'assets/art/feeding-room/serving-bowl-front.svg';front.className='serving-dish-front';front.alt='';front.draggable=false;root.append(front);
 }
 return root;
}
// Only a small edible area is lifted from illustrations with baked-in dishes.
// The crop never includes a second bowl or transfers a whole bowl to the mouth.
export function portionNode(food){
 const plan=servingPlan(food);if(!plan.crop||!plan.portionImage)return artNode(plan.portionImage?{...food,image:plan.portionImage,images:undefined}:food);
 const root=document.createElement('span');root.className='food-portion';root.dataset.foodIndex=food.index;root.setAttribute('aria-hidden','true');const img=new Image(),[x,y,w,h]=plan.crop;img.src='assets/art/'+plan.portionImage;img.alt='';img.draggable=false;img.style.width=100/w+'%';img.style.height=100/h+'%';img.style.left=-x/w*100+'%';img.style.top=-y/h*100+'%';root.append(img);return root;
}
export function utensilCarry(tool,food=null){
 const root=document.createElement('span');root.className='utensil-carry';root.dataset.tool=tool;root.setAttribute('aria-hidden','true');const img=new Image();img.src='assets/art/figma-ui/feeding-'+tool+'.webp';img.alt='';img.className='carried-tool';img.draggable=false;root.append(img);if(food){const bite=document.createElement('span');bite.className='carried-bite';bite.append(portionNode(food));root.append(bite)}return root;
}
