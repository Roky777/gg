/** Fresh, target-supported picture matches for ages 5–6. */
export const ALPHABET=[['A','apple','apples'],['B','balloon','balloons'],['C','carrot','carrots'],['D','duck','ducks'],['E','egg','eggs'],['F','fish','fish'],['G','grapes','bunches of grapes'],['H','house','houses'],['I','ice cream','ice creams'],['J','jellyfish','jellyfish'],['K','kite','kites'],['L','leaf','leaves'],['M','moon','moons'],['N','nest','nests'],['O','orange','oranges'],['P','pear','pears'],['Q','quilt','quilts'],['R','rainbow','rainbows'],['S','sun','suns'],['T','tree','trees'],['U','umbrella','umbrellas'],['V','van','vans'],['W','watermelon','watermelons'],['X','xylophone','xylophones'],['Y','yarn','balls of yarn'],['Z','zebra','zebras']];
// Devanagari pronunciation keeps device Hindi speech clear, including English letter names.
export const NUMBER_WORDS=['शून्य','एक','दो','तीन','चार','पाँच','छह','सात','आठ','नौ','दस'];
export const LETTER_NAMES=['ए','बी','सी','डी','ई','एफ','जी','एच','आई','जे','के','एल','एम','एन','ओ','पी','क्यू','आर','एस','टी','यू','वी','डबल यू','एक्स','वाई','ज़ेड'];
const OBJECT_SPEECH=['ऐपल','बलून','कैरट','डक','एग','फिश','ग्रेप्स','हाउस','आइसक्रीम','जेलीफिश','काइट','लीफ','मून','नेस्ट','ऑरेंज','पेयर','क्विल्ट','रेनबो','सन','ट्री','अम्ब्रेला','वैन','वॉटरमेलन','ज़ाइलोफोन','यार्न','ज़ेब्रा'];
const COUNT_SPEECH={'apple':'सेब','orange':'संतरे','pear':'नाशपाती','carrot':'गाजर','balloon':'गुब्बारे','duck':'बत्तखें','fish':'मछलियाँ','egg':'अंडे','leaf':'पत्ते','van':'वैन'};
export function numberReview(quantities){
 const [a,b,c]=quantities.map(n=>NUMBER_WORDS[n]);
 return `वाह! सही गिना! चलो, छोटे से बड़े की ओर पढ़ें। इन तीनों में ${a} सबसे छोटा है। उससे बड़ा ${b} है। और उससे बड़ा ${c} है। ${a}… ${b}… ${c}। बहुत बढ़िया!`;
}
export const COUNTABLES=['apple','orange','pear','carrot','balloon','duck','fish','egg','leaf','van'].map(name=>ALPHABET.find(v=>v[1]===name));
export const imageFor=name=>name==='ice cream'?'objects/ice-cream-whole-v2.png':'objects/'+name.replaceAll(' ','-')+'.png';
export function shuffled(values,random=Math.random){const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function makeBoard({letterWins=0,numberWins=0,lastTopic=null,recent=[],preferredTopic=null}={},random=Math.random){
 // Mix both skills, but avoid long runs of one type. Numbers begin within five.
 const topic=['letters','numbers'].includes(preferredTopic)?preferredTopic:lastTopic==='numbers'?'letters':lastTopic==='letters'?(random()<.7?'numbers':'letters'):(random()<.5?'letters':'numbers');
 let board;
 for(let attempt=0;attempt<30;attempt++){
  if(topic==='letters'){
   const pool=letterWins<3?ALPHABET.slice(0,6):ALPHABET;
   const chosen=shuffled(pool,random).slice(0,3).sort((a,b)=>a[0].localeCompare(b[0]));
   const lower=letterWins>=6;const cards=chosen.map(([letter,name])=>({image:imageFor(name),label:name,letter,value:letter,say:`${LETTER_NAMES[letter.charCodeAt(0)-65]} फॉर ${OBJECT_SPEECH[letter.charCodeAt(0)-65]}।`,kind:'object'}));
   board={id:'letters:'+chosen.map(v=>v[0]).join('')+':'+Number(lower),topic,axis:'vertical',cards,targets:chosen.map(v=>lower?v[0].toLowerCase():v[0]),intro:lower?'ऊपर छोटे अक्षर देखो। हर तस्वीर पर बड़े अक्षर को उसके जैसे छोटे अक्षर से मिलाओ। तस्वीर को खींचकर सही जगह पर रखो।':'ऊपर के अक्षर देखो। हर तस्वीर को उसके जैसे अक्षर के नीचे लगाओ। तस्वीर को खींचकर सही जगह पर रखो।',learn:'वाह! तुमने सही मिलाया! चलो, साथ में पढ़ें। '+cards.map(c=>c.say).join(' उसके बाद… '),rule:'तस्वीर का अक्षर ऊपर वाले अक्षर से मिलाओ।'};
  }else{
   const max=numberWins<4?5:numberWins<8?7:10;
   const quantities=shuffled(Array.from({length:max},(_,i)=>i+1),random).slice(0,3).sort((a,b)=>a-b);
   const item=COUNTABLES[Math.floor(random()*COUNTABLES.length)];
   // One object type per board keeps the counting goal clear; fresh type next time.
   const cards=quantities.map(n=>({image:imageFor(item[1]),object:item[1],plural:item[2],label:`${n} ${n===1?item[1]:item[2]}`,value:n,amount:n,kind:'count',say:`इस तस्वीर में ${NUMBER_WORDS[n]} हैं। ऊपर ${NUMBER_WORDS[n]} ढूँढो।`}));
   board={id:`numbers:${item[1]}:${quantities.join(',')}`,topic,axis:'vertical',cards,targets:quantities.map(String),maxQuantity:max,intro:`चलो, ${COUNT_SPEECH[item[1]]} गिनें! हर तस्वीर में कितने हैं? एक-एक करके गिनो। फिर उसे सही नंबर के नीचे लगाओ। तस्वीर को खींचकर सही जगह पर रखो।`,learn:numberReview(quantities),rule:'एक-एक करके गिनो। फिर ऊपर के सही नंबर से मिलाओ।'};
  }
  if(!recent.includes(board.id))break;
 }
 return board;
}
