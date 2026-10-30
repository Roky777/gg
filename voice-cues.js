import {RECORDINGS} from './voice-recordings.js?v=lip-sync-40';
export {RECORDINGS};
const normalize=s=>String(s).toLowerCase().replace(/[.!?।…]/g,'').trim();
const lookup=new Map(Object.entries(RECORDINGS).map(([id,r])=>[normalize(r.text),id]));
const aliases={
 letters_intro_01:['चलो, एक जैसे अक्षर ढूँढते हैं।','एक जैसे अक्षर साथ लगाओ।'],
 letters_intro_02:['तस्वीर को उसके अक्षर तक पहुँचाओ।'],
 letters_help_02:['तस्वीर वाला अक्षर ऊपर ढूँढो।'],
 letters_win_01:['अक्षर मिल गए!','सारे अक्षर मिल गए!','तुमने अक्षर पहचान लिए!','अक्षरों की जोड़ी तैयार!'],
 numbers_intro_01:['चलो, गिनकर नंबर से मिलाएँ।','तस्वीरों को उनके नंबर से मिलाओ।'],
 numbers_intro_02:['कितनी तस्वीरें हैं? सही नंबर ढूँढो।'],
 numbers_help_01:['एक-एक तस्वीर गिनकर देखो।'],
 numbers_win_01:['बिल्कुल सही गिना!','तुमने सही गिना!','सारे नंबर मिल गए!','गिनकर सही मिलाया!'],
 count_intro_01:['चलो, साथ में गिनें और नंबर रखें।','कितने हैं? सही नंबर लगाओ।'],
 count_intro_02:['चाहो तो तस्वीरों पर टैप करके गिनो।','तस्वीरों पर टैप करके गिन सकते हो।'],
 count_win_01:['सब सही गिना!','सही गिनती, सही नंबर!','तुमने सब सही गिना!','हर तस्वीर को नंबर मिल गया!'],
 assembly_intro_01:['मिलकर तीन टुकड़ों की तस्वीर बनाएँ।','छाया देखकर टुकड़े जोड़ो।'],
 assembly_intro_02:['कौन सा टुकड़ा कहाँ लगेगा?'],
 assembly_help_02:['छाया का आकार देखकर टुकड़ा रखो।'],
 assembly_win_01:['तस्वीर तैयार है!','पूरी तस्वीर बन गई!','तीनों टुकड़े जुड़ गए!'],
 differences_intro_01:['चलो, दोनों तस्वीरों में तीन अंतर ढूँढें।','दोनों तस्वीरें देखो और अंतर ढूँढो।'],
 differences_intro_02:['देखो, कौन सी तीन चीज़ें अलग हैं?'],
 differences_help_01:['एक बार रंग और चीज़ें ध्यान से देखो।'],
 differences_win_01:['तीनों अंतर मिल गए!','तुमने तीनों अंतर ढूँढ लिए!','सारे अंतर मिल गए!']
};
for(const [id,texts] of Object.entries(aliases))for(const t of texts)lookup.set(normalize(t),id);
['शून्य','एक','दो','तीन','चार','पाँच','छह','सात','आठ','नौ','दस'].forEach((n,i)=>lookup.set(n,'number_'+String(i).padStart(2,'0')));
export function recordingFor(text){return RECORDINGS[text]?text:lookup.get(normalize(text))||null;}
export function pictureVoice(name){
 const id='picture_'+String(name).toLowerCase().replaceAll('-','_').replaceAll(' ','_');
 return RECORDINGS[id]?id:null;
}
/** Extra readings are requested by the child, never appended to every win. */
export function reviewVoices(picture){
 if(picture.topic==='letters')return picture.cards.map(c=>'letter_'+c.value.toLowerCase());
 if(picture.topic==='numbers')return picture.cards.map(c=>'number_'+String(c.amount).padStart(2,'0'));
 if(picture.topic==='count-groups')return picture.cards.flatMap(c=>[pictureVoice(c.id),'number_'+String(c.amount).padStart(2,'0')]).filter(Boolean);
 if(picture.topic==='assembly')return [pictureVoice(picture.item.id)].filter(Boolean);
 return ['differences_win_01'];
}
