// Contact-driven clips retain their registered native grips. These replacement
// poses are for free gestures; a separate library control auditions every asset.
const gestures={F01:{},F02:{},S01:{},S02:{},S03:{R:'open'},S04:{},S05:{R:'open'},S06:{R:'relaxed'},S07:{},S08:{R:'support'},S13:{L:'support',R:'support'},S14:{R:'open'},G01:{R:'point'},G02:{L:'point',R:'point'},G03:{R:'point'},G04:{L:'support',R:'support'},G05:{R:'point'},G06:{R:'point'},G07:{},G08:{R:'point'},F03:{R:'support'},F10:{R:'support'},F11:{R:'open'},A06:{R:'point'}};
export function glovePoseFor(clip,time){
 if(clip.referenceMotion||clip.base&&clip.base!=='0Final/Idle/Idle_EB')return null;
 if(clip.id?.startsWith('FI'))return Object.fromEntries(['L','R'].map(side=>[side,{pose:clip.id==='FI03'&&side===(clip.sceneState?.pointSide??'R')?'open':'relaxed',mix:1}]));
 if(clip.id?.startsWith('FW'))return Object.fromEntries(['L','R'].map(side=>[side,{pose:clip.id==='FW03'&&side==='R'||clip.id==='FW05'?'open':'relaxed',mix:1}]));
 let spec=({FD00:{},FD01:{},FD07:{R:'relaxed'},FD02:{},FD03:{R:'thumb'},FD04:{R:'open'},FD05:{},FD06:{},LM01:{R:'support'},LM02:{R:'point'},LM03:{R:'open'},LM04:{R:'support'},LM05:{L:'support',R:'support'}})[clip.id]??gestures[clip.id];
 if(!spec){if(clip.prop&&!['kneel','sprout','helper'].includes(clip.prop))return null;spec={};}
 // One hand drawing for the complete gesture: transparent crossfades created
 // doubled fingers and the time gates made a different glove pop in mid-lift.
 return Object.fromEntries(['L','R'].map(side=>{const requested=spec[side]??'relaxed';return[side,{pose:requested==='support'?'open':requested,flexSign:requested==='support'?-1:1,mix:1}]}));
}
