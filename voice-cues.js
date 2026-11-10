import {RECORDINGS} from './voice-recordings.js?v=lip-sync-40';
import {LIP_SYNC} from './lip-sync-data.js?v=lip-sync-40';
import {NEW_RECORDINGS,NEW_LIP_SYNC} from './voice-recordings-new.js?v=2';
// The new Hinglish pack joins the same recorded-only voice (unrecorded lines stay silent).
Object.assign(RECORDINGS,NEW_RECORDINGS);Object.assign(LIP_SYNC,NEW_LIP_SYNC);
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
 differences_win_01:['तीनों अंतर मिल गए!','तुमने तीनों अंतर ढूँढ लिए!','सारे अंतर मिल गए!'],
 // Game instructions (the board's rule text) -> its recorded introduction.
 count_connect_intro:['Count the objects. Connect each group to its number.'],
 equal_intro:['Connect groups that have the same number of objects.'],
 colour_intro:['Connect each object to its colour.'],
 words_intro:['Connect each word to its picture.'],
 letters_intro_03:['Connect each capital letter to its small letter.'],
 first_letter_intro:['Connect the first letter to its picture.'],
 sticker_intro:['Use the friend row and accessory column to place each sticker.'],
 // Food Choices lines shown as captions.
 feeding_refuse_polite:['Hmm. No, thank you.'],
 feeding_refuse_playful:['Not this one!','Na, na, na! Let’s try another food.'],
 feeding_tooth:['Ooh, my tooth!','Ouch, my tooth!','Ow! That tooth again!'],
 feeding_spoon_help:['Use the spoon to pick up a small bite.','Pick up a bite with the spoon.'],
 feeding_fork_help:['Use the fork to pick up a small bite.','Pick up a bite with the fork.'],
 feeding_bring_help:['Bring a bite to my mouth.','Bring the spoon to my mouth.','Bring the fork to my mouth.','Bring the drink to my mouth.'],
 clue_offer:['How about this one?']
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
