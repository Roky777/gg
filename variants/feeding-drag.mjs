import{portionNode,utensilCarry}from'./food-serving.mjs';
import{servingPlan}from'./serving-rules.mjs';

// A serving is artwork, not a second interactive card. Keeping this separate
// also prevents copied button IDs, labels, borders and selected-state chrome.
export function createFoodDrag(food,source,{tool=null}={}){
 const ghost=document.createElement('div'),box=(source.querySelector('.variant-art')??source).getBoundingClientRect();
 ghost.className='variant-drag-ghost feeding-food-drag';
 ghost.setAttribute('aria-hidden','true');
 const cup=food&&servingPlan(food).method==='cup',scale=Math.min(1,innerWidth/1000);
 ghost.style.width=(tool?120*scale:Math.min(cup?82:64,Math.max(40,box.width*.6)))+'px';
 ghost.style.height=(tool?86*scale:Math.min(cup?90:60,Math.max(40,box.height*.7)))+'px';
 if(cup)ghost.dataset.cup='true';
 if(tool)ghost.dataset.tool=tool;
 ghost.append(tool?utensilCarry(tool,food):portionNode(food));
 return ghost;
}

export function positionFoodDrag(ghost,x,y,mouth){
 ghost.style.left=x+'px';ghost.style.top=y+'px';
 const radius=Math.max(mouth.width,mouth.height)*1.5,distance=Math.hypot(x-mouth.left-mouth.width/2,y-mouth.top-mouth.height/2),near=Math.max(0,Math.min(1,1-distance/radius)),ease=near*near*(3-2*near);
 ghost.style.transform=`scale(${1-(ghost.dataset.cup?0:ghost.dataset.tool ? 0 : .45)*ease})`;
}
