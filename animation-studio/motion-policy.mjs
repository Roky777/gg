// Protect authored contact before choosing a secondary follower. The policy is
// derived from clip data, so composed scenes and editable copies use it too.
export function motionPolicyFor(clip){
 const channels=clip?.channels??{},native=!!clip?.referenceMotion||!Object.keys(channels).length;
 const prop=!!clip?.prop&&clip.prop!=='fed-food',faceContact=['S05','S06','FD02','FD06'].includes(clip?.id),precision=Object.values(clip?.grips??{}).some(g=>/Point/.test(g));
 const support=!!(channels.seat||channels.legL||channels.legR||channels.body),contact=native||prop||faceContact||!!clip?.armImpacts?.length||!!clip?.gripWindows;
 const reduced=!!clip?.sceneState?.reducedMotion;
 return{native,contact,precision,planted:support,reduced,
  head:!reduced&&!native&&!prop&&!faceContact&&!!channels.head,
  headPosition:!reduced&&!native&&!prop&&!faceContact&&!support&&!!channels.headPosition,
  arms:!reduced&&!contact&&!precision&&!support,
  gazeLead:!reduced&&!native&&!prop&&!faceContact&&!!channels.gaze,
  reason:reduced?'Secondary motion disabled for reduced motion':native?'Source acting and attachment timing preserved':contact?'Contact paths and prop ownership preserved':precision?'Pointing targets held precisely':support?'Feet, seat and support transforms preserved':'Free gesture: bounded head and arm follow-through'};
}
