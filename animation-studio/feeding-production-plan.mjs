const shot=(duration,beats,intent,contact,spacing)=>({duration,beats,intent,contact,spacing});
export const FEEDING_SHOTS={
 FD00:shot(4,[[0,'balanced rest'],[1.15,'small breath crest'],[2.65,'single relaxed blink'],[3.5,'breath settles'],[4,'seamless rest']],'Attentive upper-body idle; hands rest below the tabletop.','No object or face contact.','Subpixel head drift; no rhythmic nod or repeated hand movement.'),
 FD01:shot(1.1,[[0,'child'],[.14,'eyes find the food'],[.36,'head follows'],[.62,'interested hold'],[.84,'blink'],[1.1,'child again']],'Notice the selected food before the player feeds it.','Hands stay down; gaze leads the head.','Quick eye lead, slower head settle, short living hold.'),
 FD02:shot(1.35,[[0,'mouth already accepting food'],[.12,'relaxed jaw opening'],[.3,'hold for the bite'],[.48,'lips close around food'],[.7,'mouth sealed'],[1.05,'little cheek settle'],[1.35,'ready to chew']],'A relaxed, softly rounded eating opening with a small jaw drop and gently changing hold.','Food enters the visible mouth cavity as the lips close.','Open hold, soft lip closure, then a smaller delayed jaw recovery.'),
 FD03:shot(1.8,[[0,'prepare'],[.2,'elbows lead'],[.62,'thumbs read clearly'],[1.08,'warm acknowledgement'],[1.8,'hands below table']],'Clear positive thumbs-up using Lucas’s original shapes.','Preserve source cuff registration; keep thumbs outside the eye area.','Continuous source clock; a readable moving hold, then a longer release.'),
 FD04:shot(2.3,[[0,'consider'],[.3,'hand begins lifting'],[.72,'first na'],[1.08,'second na'],[1.42,'third softer na'],[1.85,'hand lowers'],[2.3,'rest']],'Playful, firm triple refusal with one open palm.','Palm stays beside the lower face, not across the eyes.','Unequal head sweeps decay; hand and head finish on different frames.'),
 FD05:shot(2.15,[[0,'notice'],[.28,'eyes lower'],[.6,'thoughtful tilt'],[1.05,'brief blink'],[1.55,'look back to child'],[2.15,'friendly rest']],'A softer alternative to the spoken triple refusal.','Hands remain hidden below the table.','One considered tilt and recovery; no repeated shaking.'),
 FD06:shot(2.4,[[0,'lips closed'],[.3,'first cheek compression'],[.82,'second smaller chew'],[1.35,'last chew'],[1.94,'swallow'],[2.4,'contented rest']],'Visible closed-mouth chewing with alternating cheek compression and a swallow.','Lips stay closed; the jaw and cheeks carry the chewing action.','Unequal chews diminish, then pause before the swallow.'),
 FD07:shot(4.25,[[0,'notice discomfort'],[.6,'eyes close'],[1.2,'palm reaches cheek'],[2,'supported cheek hold'],[3.05,'release begins'],[4.25,'rest']],'Standard Lucas toothache with a blinking hold.','Original palm and cheek contact remain registered.','Source entry, moving hold, cushioned release; no extra random head motion.'),
 FD08:shot(2.6,[[0,'prepare'],[.42,'hands approach'],[.9,'first clear clap'],[1.45,'follow-through clap'],[1.95,'release'],[2.6,'rest']],'A modest happy clap after swallowing.','Only intentional palm-to-palm contact; original source attachments stay intact.','Preserve source clap accents with a slightly slower overall rate.'),
 FD09:shot(1.65,[[0,'connect with child'],[.3,'head starts down'],[.58,'thank-you dip'],[.88,'small recovery'],[1.25,'residual settle'],[1.65,'rest']],'A restrained thank-you alternative to a large celebration.','Hands stay below the tabletop.','One asymmetric nod, blink after the dip, quiet delayed settle.'),
 FD10:shot(3.35,[[0,'notice taste'],[.55,'hands lift'],[1.05,'yummy expression'],[1.65,'enjoy the taste'],[2.4,'hands descend'],[3.35,'rest']],'Lucas’s expressive yummy action without changing the character’s proportions.','Palms frame cheeks rather than covering eyes or mouth.','Retain source acting accents and hand arcs; soften the final landing.'),
 FD11:shot(1.95,[[0,'notice'],[.32,'small no'],[.76,'opposite sweep'],[1.12,'smaller recovery'],[1.5,'head settles'],[1.95,'rest']],'A quiet head-only refusal, distinct from FD04.','Hands remain down throughout.','Two low-amplitude unequal sweeps; no metronomic oscillation.'),
 FD12:shot(3.45,[[0,'notice discomfort'],[1.2,'hand reaches cheek'],[2,'short open-eyed hold'],[2.4,'release'],[3.45,'rest']],'A shorter single toothache wince.','Same approved cheek attachment, with a shorter source hold.','No added shake; short pause and unhurried recovery.'),
 FD15:shot(2.2,[[0,'rest'],[.2,'hands burst up'],[.36,'first splash'],[.72,'gather'],[1.09,'bigger splash'],[1.46,'gather'],[1.83,'last splash'],[2.2,'rest']],'Super happy: Lucas’s Water_Splash joy played three times (forward, back, forward), the biggest celebration.','Hands fling up and out beside the shoulders, never across the face.','Source clock ping-pongs 0 → end → 0 → end and eases at each turn; arms fling on each splash peak.'),
 FD13:shot(4.85,[[0,'notice discomfort'],[1.2,'hand reaches cheek'],[2,'longer sore-cheek hold'],[2.8,'slow blink'],[3.55,'release'],[4.85,'rest']],'A longer sore-cheek reaction with slower blink timing.','Cheek hand stays planted while the source hold moves subtly.','Longer hold, reduced blink rate and a gentle recovery.'),
};
export function polishFeedingClips(clips){
 for(const c of clips){const p=FEEDING_SHOTS[c.id];c.duration=p.duration;c.beats=p.beats;c.shotPlan=p;c.notes=p.intent+' '+p.contact+' '+p.spacing;c.nativeSettle=c.referenceMotion?{in:.4,out:.4}:null;/* head and body ease into and out of each source animation (0.12 s snapped) */}
 const by=new Map(clips.map(c=>[c.id,c])),set=(id,channels,mouth,blinks)=>{const c=by.get(id);Object.assign(c.channels,channels);if(mouth)c.mouth=mouth;c.blinks=blinks??[];};
 for(const id of['FD00','FD02','FD06'])by.get(id).feedingFace=true;
 set('FD00',{headPosition:[[0,0,0],[1.15,0,.18],[2.3,0,.05],[3.5,0,-.04],[4,0,0]]},[[0,'Smile']],[[2.65,.18]]);
 set('FD01',{gaze:[[0,0,0],[.14,.55,-.28],[.62,.57,-.25],[.9,.25,-.1],[1.1,0,0]],head:[[0,0],[.14,0],[.36,-1.05],[.62,-.85],[1.1,0]]},[[0,'Smile']],[[.84,.16]]);
 by.get('FD01').feedingFace=true;by.get('FD01').channels.eating=[[0,0,0,0,0],[.22,0,0,0,0],[.5,.85,0,0,0],[.74,.85,0,0,0],[1.1,0,0,0,0]];
 by.get('FD01').beats=by.get('FD01').shotPlan.beats=[[0,'child'],[.14,'eyes find food'],[.36,'head follows'],[.5,'mouth opens for a bite'],[.74,'inviting hold'],[1.1,'rest']];
 set('FD02',{headPosition:[[0,0,0],[.18,0,.35],[.38,0,.12],[.66,0,-.45],[1.05,0,-.12],[1.35,0,0]],gaze:[[0,.08,-.18],[.35,0,-.08],[1.35,0,0]],eating:[[0,.88,0,0,0],[.14,1,0,0,0],[.27,.97,0,0,0],[.46,.58,.1,0,0],[.68,.04,.18,.2,0],[.76,0,.12,.15,0],[1.05,0,.08,0,0],[1.35,0,0,0,0]]},[[0,'O'],[.76,'Smile']],[[.52,.18]]);
 set('FD04',{R:[[0,59,124,0],[.3,60,131,0],[.72,75,181,10],[1.08,75,181,8],[1.42,74,180,8],[1.85,66,151,4],[2.3,59,124,0]],head:[[0,0],[.35,0],[.72,-2.6],[1.08,2.1],[1.42,-1.3],[1.8,.35],[2.3,0]],gaze:[[0,0,0],[.3,.45,-.1],[1.6,.4,-.08],[2.3,0,0]]},[[0,'Smile'],[.55,'O'],[.76,'Smile'],[.93,'O'],[1.12,'Smile'],[1.29,'O'],[1.5,'Smile']],[[.16,.16]]);
 set('FD05',{head:[[0,0],[.28,0],[.6,2.1],[1.1,1.8],[1.55,.7],[2.15,0]],gaze:[[0,0,0],[.28,.35,-.3],[1.1,.35,-.24],[1.55,.15,-.05],[2.15,0,0]]},[[0,'Smile'],[.4,'Sad'],[1.55,'Smile']],[[1.05,.18]]);
 set('FD06',{headPosition:[[0,0,0],[.22,0,-.18],[.4,0,.02],[.6,0,-.12],[.8,0,0],[1.02,0,-.08],[1.18,0,0],[1.36,0,-.65],[1.58,0,-.1],[1.85,0,0]],mouthShape:[[0,1,1,0],[.2,1.035,.94,-.05],[.38,.985,1.025,0],[.57,1.025,.955,-.035],[.79,.99,1.015,0],[.98,1.015,.97,-.02],[1.18,1,1,0],[1.36,.99,.96,-.08],[1.65,1,1,0],[1.85,1,1,0]]},[[0,'Smile']],[[1.3,.18]]);
 Object.assign(by.get('FD06').channels,{headPosition:[[0,0,0],[.3,-.35,-.65],[.55,0,.1],[.82,.25,-.5],[1.1,0,.05],[1.35,-.15,-.35],[1.6,0,0],[1.94,0,-1.2],[2.15,0,.1],[2.4,0,0]],eating:[[0,0,.15,0,0],[.3,0,1,-1,0],[.55,0,.2,0,0],[.82,0,.85,1,0],[1.1,0,.1,0,0],[1.35,0,.6,-.7,0],[1.62,0,0,0,0],[1.94,0,0,0,1],[2.18,0,0,0,0],[2.4,0,0,0,0]]});
 set('FD09',{head:[[0,0],[.18,0],[.58,1.3],[.88,-.55],[1.25,.15],[1.65,0]],headPosition:[[0,0,0],[.18,0,0],[.58,0,-.9],[.88,0,.12],[1.3,0,-.04],[1.65,0,0]]},[[0,'Smile'],[.3,'Happy'],[1.25,'Smile']],[[.67,.16]]);
 set('FD11',{head:[[0,0],[.18,0],[.5,-1.65],[.92,1.8],[1.28,-.65],[1.6,.1],[1.95,0]],gaze:[[0,0,0],[.32,.25,-.05],[1.3,.2,-.03],[1.95,0,0]]},[[0,'Smile'],[.36,'O'],[.67,'Smile']],[[1.06,.17]]);
 const clap=by.get('FD08'),yummy=by.get('FD10');clap.referenceMotion.duration=clap.duration;clap.referenceMotion.keys.at(-1)[0]=clap.duration;yummy.referenceMotion.duration=yummy.duration;yummy.referenceMotion.keys.at(-1)[0]=yummy.duration;
 for(const id of['FD07','FD12','FD13']){const c=by.get(id);c.referenceMotion.duration=c.duration;c.referenceMotion.holdEnd=id==='FD07'?3.05:id==='FD12'?2.4:3.55;c.referenceMotion.holdRate=id==='FD13'?.7:1;}
 // Feeding uses chest-height gestures, with free space around the face. Native
 // Lucas face acting remains, but his larger head/hand proportions need a
 // separate arm layout on Sparky rather than copying their screen positions.
 for(const c of clips)c.feedingHandScale=c.id==='FD08'?.78:c.id==='FD10'?.85:c.id==='FD03'?.9:/FD07|FD12|FD13/.test(c.id)?.9:1;
 for(const id of['FD07','FD12','FD13'])by.get(id).armOffsets={R:[8,-10]};
 by.get('FD10').armOffsets={L:[-9,-8],R:[9,-8]};
 const refusal=by.get('FD04');refusal.elbowProjection={L:.75,R:.85};
 refusal.channels.R=[[0,59,124,0],[.3,61,140,0],[.72,72,182,-8],[1.08,73,181,-6],[1.42,72,180,-6],[1.85,66,146,-2],[2.3,59,124,0]];
 clap.referenceArmTargets=true;clap.elbowProjection={L:.85,R:.85};
 for(const side of['L','R']){const sign=side==='L'?-1:1;clap.channels[side]=[[0,sign*59,124,0],[.28,sign*37,165,0],[.45,sign*35,177,0],[.62,sign*12,178,0],[.77,sign*31,177,0],[1.04,sign*12,178,0],[1.2,sign*30,177,0],[1.47,sign*12,178,0],[1.68,sign*31,175,0],[2.05,sign*47,149,0],[2.6,sign*59,124,0]];}
 for(const side of['L','R'])for(const key of clap.channels[side])if(key[0]>0&&key[0]<2.6)key[2]-=22;
 // Entry and exit stay close to the body: hands rise/fall straight below the table
 // edge, and only slide out to the wide rest (±59) while hidden. The old diagonal
 // sweep swung the elbows out above the table and flared the shirt like a skirt.
 for(const side of['L','R']){const s=side==='L'?-1:1,keys=clap.channels[side].filter(k=>k[0]>=.42&&k[0]<=1.68);/* hands rise over ~0.4 s, matching the body's ease-in */clap.channels[side]=[[0,s*59,124,0],[.2,s*50,114,0],[.38,s*40,104,0],...keys,[2,s*33,128,0],[2.28,s*36,102,0],[2.6,s*59,124,0]];}
 clap.armImpacts=[.62,1.04,1.47];
 for(const side of['L','R']){const keys=clap.channels[side];for(const at of clap.armImpacts){const hit=keys.find(k=>Math.abs(k[0]-at)<1e-5);keys.push([at+.04,...hit.slice(1)])}keys.sort((a,b)=>a[0]-b[0]);}
 clap.shotPlan.contact='Clap at chest height, with three deliberate contacts and clear space below the eyes.';
 clap.shotPlan.beats=clap.beats=[[0,'rest'],[.28,'elbows lift'],[.45,'open hands at chest'],[.62,'first clap'],[1.04,'second clap'],[1.47,'last softer clap'],[1.68,'hands separate'],[2.05,'lower hands'],[2.6,'rest']];
 clap.shotPlan.spacing='Accelerate into each clap, hold contact for 40 ms, rebound faster, then lower the hands slowly.';
 // Thumbs-up and yummy follow the clap's compact staging. Their Lucas source arm paths
 // (made for Lucas's proportions) flung Sparky's arms wide, stretched the forearms and
 // crossed the hands at the belly. Source hand shapes, timing and face acting are kept;
 // only the arm targets are authored, at chest height in front of the body.
 const thumbs=by.get('FD03');
 thumbs.referenceArmTargets=true;thumbs.elbowProjection={L:.85,R:.85};delete thumbs.armOffsets;thumbs.feedingHandScale=.82;
 for(const side of['L','R']){const s=side==='L'?-1:1;thumbs.channels[side]=[[0,s*59,124,0],[.2,s*48,134,0],[.45,s*36,148,0],[.62,s*34,152,0],[1.08,s*35,150,0],[1.4,s*47,136,0],[1.8,s*59,124,0]];}
 thumbs.shotPlan.contact='Both thumbs up in front of the chest, hands apart, arms tucked; no wide swing.';
 const yum=by.get('FD10');
 yum.referenceArmTargets=true;yum.elbowProjection={L:.85,R:.85};delete yum.armOffsets;yum.feedingHandScale=.82;
 for(const side of['L','R']){const s=side==='L'?-1:1;yum.channels[side]=[[0,s*59,124,0],[.55,s*42,136,0],[1.05,s*26,144,0],[1.35,s*30,140,0],[1.65,s*24,146,0],[1.95,s*30,140,0],[2.4,s*42,136,0],[3.35,s*59,124,0]];}
 yum.shotPlan.contact='Hands come together at the tummy for two small rubs; the hands never cross.';
 // Super happy splash: Water_Splash starts and ends at rest, so a ping-pong source clock
 // gives three smooth splashes. Arms are authored (source arm paths are Lucas-sized).
 const splash=by.get('FD15');
 if(splash){splash.referenceMotion={name:'Sequence/4/Water_Splash',keys:[[0,0],[.72,.6666],[1.46,0],[2.2,.6666]],duration:splash.duration,pingPong:true};
  splash.referenceArmTargets=true;splash.elbowProjection={L:.85,R:.85};splash.feedingHandScale=.82;
  for(const side of['L','R']){const s=side==='L'?-1:1;splash.channels[side]=[[0,s*59,124,0],[.2,s*52,146,0],[.36,s*68,188,0],[.72,s*48,160,0],[1.09,s*70,192,0],[1.46,s*48,160,0],[1.83,s*68,188,0],[2.02,s*52,146,0],[2.2,s*59,124,0]];}}
 for(const c of clips)c.notes=c.shotPlan.intent+' '+c.shotPlan.contact+' '+c.shotPlan.spacing;
}
