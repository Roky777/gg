// Curated source files stay in lucas/curated_assets. Runtime copies are local
// to the game so the complete game can be shared without its parent folder.
const image=name=>'curated-foods/'+name+'.webp';
const entry=(label,file,group='snack',category='everyday',reaction='happy',extra={})=>({label,image:image(file),group,category,reaction,...extra});
const legacy=[
 {label:'Idli and sambar',group:'meal'},
 entry('Vegetable poha','vegetable-poha-bowl','meal'),
 {label:'Dal and rice',images:[image('dal-cooked-bowl'),image('rice-cooked-bowl')],group:'meal'},
 {label:'Roti and bhindi',images:[image('chapati-roti-authentic-v2'),image('okra-bhindi')],group:'meal'},
 entry('Vegetable khichdi','moong-dal-khichdi-bowl','meal'),
 entry('Plain dosa','plain-dosa-clean-v2','meal'),
 entry('Dhokla','steamed-dhokla-plate','meal'),
 entry('Plain curd','curd-plain-bowl','protein'),
 entry('Banana','banana-yellow-whole','fruit'),
 entry('Mango','mango-ripe-whole','fruit'),
 entry('Guava','guava-half-pink','fruit'),
 {label:'Water',group:'water',serving:'sip'},
 entry('Toffee','toffee-wrapped','treat','sometimes','tooth'),
 entry('Chocolate wafer','chocolate-wafer-2d','treat','sometimes','tooth'),
 entry('Potato chips','potato-chips-in-bowl-v2','treat','sometimes','no'),
 entry('Fizzy drink','soda-can-generic','treat','sometimes','no',{serving:'sip'})
];
const foods=[
 ...[
 ['Apple','apple-red-whole'],['Grapes','grapes-purple-bunch'],['Orange','orange-fruit-whole'],['Pear','pear-green-whole'],['Pineapple','pineapple-whole'],['Papaya','papaya-half'],['Pomegranate','pomegranate-whole-cut'],['Strawberry','strawberry-red'],['Watermelon','watermelon-wedge'],['Kiwi','kiwi-half'],['Coconut','coconut-half']
 ].map(([label,file])=>entry(label,file,'fruit')),
 ...[
 ['Carrot','carrot-whole'],['Tomato','tomato-red-whole'],['Cucumber','cucumber-whole'],['Green peas','green-peas-pod'],['Green beans','green-beans-bundle'],['Broccoli','broccoli-floret'],['Cauliflower','cauliflower-head'],['Cabbage','cabbage-green-head'],['Capsicum','capsicum-green-whole'],['Spinach','spinach-bunch'],['Pumpkin','pumpkin-whole'],['Sweet corn','sweet-corn-cob'],['Boiled potato','potato-boiled']
 ].map(([label,file])=>entry(label,file,'vegetable')),
 ...[
 ['Vegetable upma','vegetable-upma-bowl'],['Oat porridge','oats-porridge-plain-bowl'],['Vegetable sandwich','sandwich-vegetable-wholewheat'],['Wholewheat toast','toast-wholewheat-plain']
 ].map(([label,file])=>entry(label,file,'meal')),
 ...[
 ['Paneer','paneer-cubes'],['Boiled chana','chana-boiled-bowl'],['Boiled egg','boiled-egg-whole-and-half-v2'],['Grilled fish','fish-grilled-whole-silver-v2'],['Grilled chicken','grilled-chicken-wing-reference-v3'],['Almonds','almonds-small-group'],['Peanuts','peanuts-shelled-group']
 ].map(([label,file])=>entry(label,file,'protein')),
 entry('Plain milk','milk-plain-glass','drink','everyday','happy',{serving:'sip'}),
 entry('Plain popcorn','popcorn-plain-bowl'),
 // Preparation matters: steamed momos are a meal, not a sweet/fried treat.
 entry('Steamed momos','steamed-white-momos-hot-v2','meal'),
 ...[
 ['Pink doughnut','donut-pink-frosting-sprinkles'],['Cream biscuits','cream-biscuits-2d'],['Jalebi','three-jalebis'],['Jalebi spiral','jalebi-spiral'],['Cotton candy','cotton-candy-pink'],['Lollipop','spiral-lollipop'],['Jelly','jelly-cup-2d'],['Ice cream','ice-cream-cone-2d'],['Gummy sweets','gummy-bears-group'],['Gulab jamun','gulab-jamun-bowl'],['Chocolate pudding','pudding-chocolate-cup'],['Frosted cake','cake-colorful-frosted'],['Birthday cake','cake-colorful-frosted-cherries-candle'],['Besan ladoo','besan-ladoo-group'],['Chocolate brownie','chocolate-brownie-2d'],['Chocolate cookie','chocolate-chip-cookie']
 ].map(([label,file])=>entry(label,file,'treat','sometimes','tooth')),
 ...[
 ['Vada pav','vada-pav-2d'],['French fries','french-fries-red-carton'],['Instant noodles','instant-noodles-red-bowl'],['Hot dog','hot-dog-classic'],['Fried momos','fried-momos-serving'],['Onion pakora','onion-pakora-serving-clean-v2'],['Cheesy nachos','nachos-cheese-serving'],['Kachori','kachori-whole'],['Potato smileys','potato-smiley-group'],['Samosa','samosa-open-filling'],['Cheese pizza','cheese-pizza-whole'],['Pizza slice','cheese-pizza-slice-dripping-v2'],['Bread pakora','bread-pakora-serving-clean-v2'],['Potato pakora','aloo-pakora-flat-reference'],['Cheeseburger','cheeseburger-classic'],['Cheese puffs','cheese-puffs-serving'],['Cheese puffs packet','cheese-puffs-packet-v2'],['Chole bhature','chole-bhature-2d'],['Chowmein','chowmein-bowl']
 ].map(([label,file])=>entry(label,file,'treat','sometimes','no')),
 entry('Cola','cola-glass','treat','sometimes','no',{serving:'sip'}),
 entry('Cola glass','cola-glass-2d','treat','sometimes','no',{serving:'sip'})
];
export const FOODS=[...legacy,...foods].map((f,index)=>({kind:'food',index,key:'food-'+index,category:'everyday',reaction:'happy',serving:'bite',...f}));
export const foodByIndex=index=>FOODS[index]??FOODS[8];
export const foodImages=food=>food.images??(food.image?[food.image]:[]);
export const foodPool=group=>FOODS.filter(food=>food.group===group);
export const CURATED_OBJECTS={apple:'apple-red-whole',carrot:'carrot-whole',egg:'boiled-egg-whole-and-half-v2',grapes:'grapes-purple-bunch',orange:'orange-fruit-whole',pear:'pear-green-whole',watermelon:'watermelon-wedge'};
export const objectImage=key=>CURATED_OBJECTS[key]?image(CURATED_OBJECTS[key]):'objects/'+key+'.webp';
