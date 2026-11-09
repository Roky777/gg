// These are game interaction choices, not a claim that a food has only one
// culturally correct way of being eaten. Kept independent of food indices.
export function servingPlan(food){
 const file=(food.image??food.images?.[0]??'').split('/').at(-1)??'',name=food.label.toLowerCase();
 let method=food.serving==='sip'?'cup':'hand';
 if(/poha|upma|khichdi|dal and rice|plain curd|porridge|boiled chana|gulab jamun|pudding|jelly/.test(name))method='spoon';
 if(/noodles|chowmein|paneer|boiled potato|broccoli|cauliflower|grilled fish|momos|cake|brownie|kiwi|papaya|potato smileys/.test(name))method='fork';
 const embedded=!!food.images?.some(p=>/bowl|plate|glass|cup/.test(p))||/bowl|plate|glass|cup|carton|packet|wrapped|cone|can-generic|chole-bhature/.test(file)||food.index===0||food.index===11;
 const dish=embedded?'embedded':method==='cup'?'none':/almonds|peanuts|gummy sweets|cheese puffs$/.test(name)?'bowl':'plate';
 let crop=null,portionImage=food.images?.[0]??food.image??null;
 if(embedded&&method!=='cup')crop=/noodles|chowmein/.test(name)?[.27,.39,.43,.22]:/gulab jamun/.test(name)?[.35,.08,.3,.3]:/pudding|jelly|curd/.test(name)?[.33,.25,.34,.19]:/poha|upma|khichdi|dal|chana/.test(name)?[.3,.22,.4,.25]:/wrapped|packet|carton/.test(file)?null:[.3,.19,.4,.32];
 if(method==='fork'&&!crop)crop=/cake|brownie/.test(name)?[.28,.4,.42,.3]:[.3,.25,.36,.32];
 if(/chowmein/.test(name))crop=[.3,.2,.4,.25];
 if(/wrapped/.test(file))crop=[.32,.28,.34,.4];
 if(/french-fries/.test(file))crop=[.25,.03,.5,.23];
 if(/potato-chips|popcorn/.test(file))crop=[.28,.1,.44,.28];
 if(/cheese-puffs-packet/.test(file)){portionImage='curated-foods/cheese-puffs-serving.webp';crop=null;}
 if(/cheese-pizza-whole/.test(file)){portionImage='curated-foods/cheese-pizza-slice-dripping-v2.webp';crop=null;}
 if(food.index===0){portionImage='variants/indian-food-sheet-v1.webp';crop=[.0625,.125,.085,.0625];}
 return{method,dish,embedded,crop,portionImage};
}
