// Measures the screen space around the 16:9 stage so scenery and controls can
// use the whole landscape screen. The stage and its board are never resized.
//   --fill-*  distance from each stage edge to the screen edge (scenery)
//   --safe-*  distance from each stage edge to the safe-area edge (controls)
const game=document.querySelector('.game');
const px=value=>parseFloat(value)||0;
let frame=0,lastKey='';
function update(){
 frame=0;
 const g=game.getBoundingClientRect();if(!g.width||!g.height)return;
 const body=getComputedStyle(document.body),w=document.documentElement.clientWidth,h=document.documentElement.clientHeight;
 const fill={left:g.left,top:g.top,right:w-g.right,bottom:h-g.bottom};
 const safe={left:g.left-px(body.paddingLeft),top:g.top-px(body.paddingTop),right:w-g.right-px(body.paddingRight),bottom:h-g.bottom-px(body.paddingBottom)};
 const values={'--stage-w':g.width,'--stage-h':g.height};
 // Top/bottom may be negative: on long phones the stage is taller than the screen (wide-stage.css),
 // so scenery and controls move inward by that amount. --clip-top is how much of the stage is above the screen.
 for(const side of['left','right']){values['--fill-'+side]=Math.max(0,fill[side]);values['--safe-'+side]=Math.max(0,safe[side]);}
 for(const side of['top','bottom']){values['--fill-'+side]=fill[side];values['--safe-'+side]=safe[side];}
 values['--clip-top']=Math.max(0,-fill.top);
 const key=Object.values(values).map(n=>n.toFixed(1)).join(',');if(key===lastKey)return;lastKey=key;
 for(const[name,value]of Object.entries(values))game.style.setProperty(name,value.toFixed(2)+'px');
 game.dataset.screenFill=fill.left+fill.right>1?'wide':fill.top+fill.bottom>1?'tall':'exact';
 // Short stages (phones with browser toolbars) need a few layouts to make room for
 // 44px targets. "Side room" means the corner controls sit outside the stage.
 game.toggleAttribute('data-short-stage',g.height<319.5);
 game.toggleAttribute('data-side-room',Math.min(fill.left,fill.right)>=56);
 game.dispatchEvent(new Event('screenfill'));
}
const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
new ResizeObserver(schedule).observe(game);new ResizeObserver(schedule).observe(document.body);
addEventListener('resize',schedule);addEventListener('orientationchange',schedule);visualViewport?.addEventListener('resize',schedule);
update();

// Phones: browser toolbars can take a quarter of a landscape screen. On touch
// devices that allow it (Android Chrome, iPad), the first tap enters full screen
// and keeps landscape. iPhone Safari does not offer page full screen; the game
// still fits its visible area there.
const root=document.documentElement;
const fullscreenElement=()=>document.fullscreenElement||document.webkitFullscreenElement;
const canFullscreen=!!(root.requestFullscreen||root.webkitRequestFullscreen)&&(document.fullscreenEnabled||document.webkitFullscreenEnabled);
const touchScreen=matchMedia('(pointer:coarse)').matches&&navigator.maxTouchPoints>0;
const installed=matchMedia('(display-mode:fullscreen),(display-mode:standalone)').matches;
const offered=canFullscreen&&touchScreen&&!installed;
const portraitNow=matchMedia('(orientation:portrait)');
let entering=null;
function enterFullscreen(){if(!entering)entering=enterNow().finally(()=>{entering=null});return entering;}
async function enterNow(){
 if(!offered)return;
 // Already full screen but still upright (an earlier lock failed): ask for landscape again.
 if(!fullscreenElement()){try{await(root.requestFullscreen?root.requestFullscreen({navigationUI:'hide'}):root.webkitRequestFullscreen());}catch{return;}}
 try{await screen.orientation?.lock?.('landscape');}catch{}
}
if(offered){
 // pointerup/touchend carry user activation for touch input; pointerdown does not.
 const first=()=>{removeEventListener('pointerup',first,true);removeEventListener('touchend',first,true);enterFullscreen();};
 addEventListener('pointerup',first,true);addEventListener('touchend',first,true);
 const prompt=document.querySelector('.rotate-prompt');
 if(prompt){
  const play=document.createElement('button');play.type='button';play.className='fullscreen-play';play.setAttribute('aria-label','Play full screen');
  play.innerHTML='<img src="assets/art/toy-controls/play.svg" alt="" draggable="false">';
  // A tap anywhere on the upright screen turns the game sideways; the button stays
  // until the game really is sideways, so a refused rotation can be retried.
  prompt.addEventListener('click',enterFullscreen);prompt.append(play);
  const sync=()=>{play.hidden=!!fullscreenElement()&&!portraitNow.matches;};
  document.addEventListener('fullscreenchange',sync);document.addEventListener('webkitfullscreenchange',sync);portraitNow.addEventListener?.('change',sync);sync();
 }
}
window.sparkyScreenFill={get status(){return{fill:game.dataset.screenFill,fullscreenOffered:offered,fullscreen:!!fullscreenElement()};}};

// Board frame height for the 9-slice board art (wide-stage.css). offsetHeight ignores
// transforms, so the corners do not flicker during the board's pop-in animation.
{const frame=document.querySelector('.puzzle-frame');if(frame&&'ResizeObserver'in window){const set=()=>frame.style.setProperty('--frame-h',frame.offsetHeight+'px');new ResizeObserver(set).observe(frame);set();}}
