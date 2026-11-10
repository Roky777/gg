import{FOODS,objectImage}from'./food-catalogue.mjs';
import{COLOUR_SETS}from'./colour-sets.mjs';
import{uniqueBoard,freshRandom}from'./board-variety.mjs';
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
// Pictures made for counting groups, and extra single-word pictures for the
// word and letter games (all in assets/art).
const COUNT_PICS=['apple','ball','butterfly','cupcake','duckling','fish','flower','jelly','ladybird','mushroom','orange','peach','pear','rabbit','star-biscuit','strawberry','teddy','toy-block','toy-car','turtle'].map(k=>'counting/'+k+'.webp');
const countingWord=(key,label)=>({kind:'image',key,label,image:'counting/'+key+'.webp'});
export const WORD_PICS=[...OBJECTS,countingWord('ball','Ball'),countingWord('butterfly','Butterfly'),countingWord('cupcake','Cupcake'),countingWord('flower','Flower'),countingWord('ladybird','Ladybird'),countingWord('mushroom','Mushroom'),countingWord('rabbit','Rabbit'),countingWord('teddy','Teddy'),countingWord('turtle','Turtle'),countingWord('peach','Peach'),countingWord('strawberry','Strawberry')];
const signatureOf=(id,pairs)=>id+':'+pairs.map(p=>[p.key,p.left.image??p.left.text??'',p.left.count??'',p.right.image??p.right.text??p.right.colour??'',p.right.count??''].join('/')).sort().join('|');
/** One board's content. `random` makes it repeatable for tests; play passes a fresh one. */
export function matchContent(id,round=0,random=randomFor(7183+round*113)){
 const pick=(items,n=3)=>shuffled(items,random).slice(0,n);let pairs=[];
 if(id==='count-connect'||id==='equal-groups'){
  const counts=pick(Array.from({length:round<3?3:5},(_,i)=>i+1)),pictures=pick(COUNT_PICS,6);
  pairs=counts.map((n,i)=>({key:String(n),left:{kind:'group',count:n,image:pictures[i],label:'Count these objects'},right:id==='count-connect'?{kind:'text',text:String(n),label:String(n)}:{kind:'group',count:n,image:pictures[i+3],label:'Count these objects'}}));
 }
 if(id==='colour-match')pairs=pick(COLOUR_SETS).map(set=>{const o=pick(set.objects,1)[0];return{key:set.name,left:o,right:{kind:'colour',colour:set.colour,label:set.name}}});
 if(id==='word-picture'||id==='letter-picture'){
  const pool=round<3?WORD_PICS.filter(o=>o.label.length<=5):WORD_PICS,chosen=[],labels=new Set(),letters=new Set();
  for(const o of shuffled(pool,random)){const first=o.label[0];if(labels.has(o.label)||(id==='letter-picture'&&letters.has(first)))continue;labels.add(o.label);letters.add(first);chosen.push(o);if(chosen.length===3)break}
  pairs=chosen.map(o=>({key:o.key,left:{kind:'text',text:id==='word-picture'?o.label.toUpperCase():o.label[0],label:id==='word-picture'?o.label:o.label[0]},right:o}));
 }
 if(id==='letter-case'){// Easy rounds use letters whose small form looks different from the capital.
  const letters=round<3?'ABDEGHMNRT':'ABCDEFGHJKLMNOPQRSTUVWXYZ';pairs=pick([...letters]).map(letter=>({key:letter,left:{kind:'text',text:letter,label:'Capital '+letter},right:{kind:'text',text:letter.toLowerCase(),label:'Small '+letter.toLowerCase()}}))}
 if(!pairs.length)throw Error('No matching content for '+id);return{pairs,left:shuffled(pairs,random),right:shuffled(pairs,random),signature:signatureOf(id,pairs)};
}
/** A board for play: random every time and not one already shown on this device. */
export function freshMatchContent(id,round=0){return uniqueBoard(id,()=>matchContent(id,round,freshRandom()))}
export const STORIES=[
 {id:'ST01',title:'A Little Seed',steps:[{key:'plant',label:'Plant a seed'},{key:'water',label:'Water gently'},{key:'grow',label:'A plant grows'}]},
 {id:'ST02',title:'Ready for a Meal',steps:[{key:'wash',label:'Wash your hands'},{key:'eat',label:'Enjoy your meal'},{key:'clear',label:'Clear your plate'}]},
 {id:'ST03',title:'Let’s Make a Meal',steps:[{key:'mix',label:'Mix the batter'},{key:'cook',label:'A grown-up cooks'},{key:'serve',label:'Serve the food'}]}
];
