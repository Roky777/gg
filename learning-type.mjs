import{OBJECTS}from'./variants/content.mjs';
const words=new Set(OBJECTS.map(o=>o.label.toUpperCase()));
export function learningTypeAsset(value){
 const text=String(value);
 if(/^[A-Z]$/.test(text))return'learning-type/upper-'+text+'.svg';
 if(/^[a-z]$/.test(text))return'learning-type/lower-'+text+'.svg';
 if(/^(?:[0-9]|10)$/.test(text))return'learning-type/number-'+text+'.svg';
 if(words.has(text.toUpperCase()))return'learning-type/word-'+text.toLowerCase()+'.svg';
 return null;
}
export function renderLearningType(node,value){
 const text=String(value),asset=learningTypeAsset(text);node.textContent=text;node.dataset.learningText=text;
 if(!asset){node.classList.remove('has-learning-art');return node;}
 node.classList.add('has-learning-art');const img=new Image();img.className='learning-type-image';img.src='assets/art/'+asset;img.alt='';img.draggable=false;node.append(img);return node;
}
