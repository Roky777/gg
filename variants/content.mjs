import{FOODS,objectImage}from'./food-catalogue.mjs';
export{FOODS}from'./food-catalogue.mjs';
export const VARIANTS=[
 ['count-connect','Count & Connect','Count the objects. Connect each group to its number.','G03'],
 ['equal-groups','Same Amount','Connect groups that have the same number of objects.','G04'],
 ['colour-match','Colour Connections','Connect each object to its colour.','G02'],
 ['word-picture','Words & Pictures','Connect each word to its picture.','G05'],
 ['letter-case','Big & Small Letters','Connect each capital letter to its small letter.','G06'],
 ['letter-picture','Letter Connections','Connect the first letter to its picture.','G05'],
 ['food-sort','Food Choices','Offer food to Sparky and watch how he reacts.','F03'],
 ['accessory-grid','Sticker Studio','Use the friend row and accessory column to place each sticker.','A06']
].map(([id,title,rule,hint],index)=>({id,title,rule,hint,number:index+1}));
export const EXISTING=[{id:'letters',title:'Picture Ordering'},{id:'counting',title:'Counting'},{id:'assembly',title:'Picture Assembly'},{id:'differences',title:'Spot the Difference'}];
const object=(key,label=key)=>({kind:'image',key,label,image:objectImage(key)});
export const OBJECTS=[object('apple','Apple'),object('balloon','Balloon'),object('carrot','Carrot'),object('duck','Duck'),object('egg','Egg'),object('fish','Fish'),object('grapes','Grapes'),object('house','House'),object('kite','Kite'),object('leaf','Leaf'),object('moon','Moon'),object('orange','Orange'),object('pear','Pear'),object('sun','Sun'),object('tree','Tree'),object('umbrella','Umbrella'),object('van','Van'),object('watermelon','Watermelon'),object('xylophone','Xylophone'),object('yarn','Yarn'),object('zebra','Zebra')];
export function randomFor(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
export function shuffled(items,random=Math.random){const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]]}return copy}
export function makeVariantBoard(id,round=0){const spec=VARIANTS.find(v=>v.id===id);if(!spec)throw Error('Unknown activity '+id);return{topic:'variants',variant:id,id:id+'-'+round,round,cards:[],axis:'horizontal',rule:spec.rule,intro:spec.rule,title:spec.title}}
export function matchContent(id,round=0){
 const random=randomFor(7183+round*113),pick=items=>shuffled(items,random).slice(0,3);let pairs=[];
 if(id==='count-connect'||id==='equal-groups'){const counts=pick(Array.from({length:round<3?3:5},(_,i)=>i+1));pairs=counts.map((n,i)=>({key:String(n),left:{kind:'group',count:n,image:objectImage(['apple','duck','kite'][i]),label:'Count these objects'},right:id==='count-connect'?{kind:'text',text:String(n),label:String(n)}:{kind:'group',count:n,image:objectImage(['orange','balloon','fish'][i]),label:'Count these objects'}}))}
 if(id==='colour-match'){pairs=pick([{o:OBJECTS[0],colour:'#e95045',name:'Red'},{o:OBJECTS[9],colour:'#65a966',name:'Green'},{o:OBJECTS[11],colour:'#ffa533',name:'Orange'},{o:FOODS[8],colour:'#f4cf48',name:'Yellow'}]).map(p=>({key:p.name,left:p.o,right:{kind:'colour',colour:p.colour,label:p.name}}))}
 if(id==='word-picture'||id==='letter-picture'){const pool=round<3?OBJECTS.slice(0,6):OBJECTS;pairs=pick(pool).map(o=>({key:o.key,left:{kind:'text',text:id==='word-picture'?o.label.toUpperCase():o.label[0],label:id==='word-picture'?o.label:o.label[0]},right:o}))}
 if(id==='letter-case'){const letters=round<3?'ABEMT':'ACDEFGHIKLMNOPRSTUVWY';pairs=pick([...letters]).map(letter=>({key:letter,left:{kind:'text',text:letter,label:'Capital '+letter},right:{kind:'text',text:letter.toLowerCase(),label:'Small '+letter.toLowerCase()}}))}
 if(!pairs.length)throw Error('No matching content for '+id);return{pairs,left:shuffled(pairs,random),right:shuffled(pairs,random)};
}
export const STORIES=[
 {id:'ST01',title:'A Little Seed',steps:[{key:'plant',label:'Plant a seed'},{key:'water',label:'Water gently'},{key:'grow',label:'A plant grows'}]},
 {id:'ST02',title:'Ready for a Meal',steps:[{key:'wash',label:'Wash your hands'},{key:'eat',label:'Enjoy your meal'},{key:'clear',label:'Clear your plate'}]},
 {id:'ST03',title:'Let’s Make a Meal',steps:[{key:'mix',label:'Mix the batter'},{key:'cook',label:'A grown-up cooks'},{key:'serve',label:'Serve the food'}]}
];
