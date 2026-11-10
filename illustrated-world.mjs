import{SCENES}from'./scene-backgrounds.mjs';

// Sculpted scene artwork supplies the forms; bounded motion supplies the life.
// A single image draw plus three shared cloud sprites keeps the scene lightweight.
// The canvas covers the whole screen. Inside the 16:9 stage the artwork maps
// exactly as before; wider screens continue it with a mirrored edge, taller
// screens with a soft blurred edge, so nothing in the stage moves or stretches.
const game=document.querySelector('.game'),dialog=document.getElementById('pause-dialog'),reduce=matchMedia('(prefers-reduced-motion:reduce)');
const canvas=document.createElement('canvas');canvas.className='illustrated-world';canvas.setAttribute('aria-hidden','true');canvas.hidden=true;game.prepend(canvas);
const atmosphere=document.createElement('div');atmosphere.className='scene-atmosphere';atmosphere.setAttribute('aria-hidden','true');atmosphere.hidden=true;canvas.after(atmosphere);
const cloudSpecs=[{phase:.26,duration:84,width:16,top:2.5,opacity:.96},{phase:.73,duration:110,width:12,top:3.5,opacity:.86},{phase:1.08,duration:96,width:18,top:7.5,opacity:.95}];
const clouds=cloudSpecs.map(spec=>{const node=new Image();node.src='assets/art/worlds-v2/cloud.webp';node.alt='';node.draggable=false;node.style.cssText=`width:${spec.width}%;top:${spec.top}%;opacity:${spec.opacity}`;atmosphere.append(node);return{...spec,node,x:0};});
let worldWidth=1;
// Stage placement inside the full-screen canvas, as fractions of the canvas.
let layout={x:0,y:0,top:0,w:1,h:1,aspect:16/9},maskKey='';
function measure(){
 const c=canvas.getBoundingClientRect(),g=game.getBoundingClientRect();
 if(!c.width||!c.height||!g.width||!g.height)return layout;
 layout={x:(g.left-c.left)/c.width,y:(c.bottom-g.bottom)/c.height,top:(g.top-c.top)/c.height,w:g.width/c.width,h:g.height/c.height,aspect:g.width/g.height,cw:c.width,ch:c.height,gw:g.width,gh:g.height};
 worldWidth=c.width;
 for(const cloud of clouds){cloud.node.style.width=cloud.width*g.width/100+'px';cloud.node.style.top=(g.top-c.top)+cloud.top*g.height/100+'px';}
 return layout;
}
const mirror=x=>{x=Math.abs(x);return x>1?2-x:x;};
// Runtime occlusion matte: clouds belong in the sky, behind the painted trees.
// This samples the current artwork; it does not add or repaint scenic objects.
function updateSkyMask(){
 if(!current()?.life?.clouds||!image){atmosphere.style.maskImage='none';maskKey='';return;}
 const key=sceneName+'|'+(current()?.pan??0)+'|'+[layout.x,layout.top,layout.w,layout.h].map(n=>n.toFixed(3)).join(',');if(key===maskKey)return;maskKey=key;
 // Artwork in stage space, exactly as the original stage-sized matte drew it.
 const art=document.createElement('canvas');art.width=768;art.height=432;const actx=art.getContext('2d',{willReadFrequently:true});
 const scale=Math.max(art.width/image.naturalWidth,art.height/image.naturalHeight)*1.012,w=image.naturalWidth*scale,h=image.naturalHeight*scale;actx.drawImage(image,(art.width-w)/2,(art.height-h)/2,w,h);
 const src=actx.getImageData(0,0,art.width,art.height).data;
 const mw=768,mh=Math.max(1,Math.round(768*(layout.ch||432)/(layout.cw||768)));
 const mask=document.createElement('canvas');mask.width=mw;mask.height=mh;const ctx=mask.getContext('2d');const pixels=ctx.createImageData(mw,mh),clamp=n=>Math.max(0,Math.min(1,n));
 for(let j=0;j<mh;j++){const sy=((j+.5)/mh-(layout.top||0))/layout.h;const ay=Math.min(art.height-1,Math.max(0,Math.floor(clamp(sy)*art.height)));
  const pan=current()?.pan??0;for(let i=0;i<mw;i++){let sx=((i+.5)/mw-layout.x)/layout.w+pan;
   // Same mirror as the shader: reflect at the artwork edge, then return to stage space.
   if(sx<0||sx>1)sx=.5+(mirror(.5+(sx-.5)/1.012)-.5)*1.012;
   const ax=Math.min(art.width-1,Math.max(0,Math.floor(sx*art.width))),k=(ay*art.width+ax)*4,o=(j*mw+i)*4,r=src[k],g=src[k+1],b=src[k+2];
   pixels.data[o]=pixels.data[o+1]=pixels.data[o+2]=255;pixels.data[o+3]=Math.round(255*Math.min(clamp((b-r-20)/40),clamp((b-g-4)/20))*clamp((.28-sy)/.035));}}
 // 3x3 minimum: removes single-pixel 'sky' speckles inside painted scenery (e.g. a
 // white awning) so a passing cloud never shows through as dots; open sky keeps its shape.
 const alpha=new Uint8ClampedArray(mw*mh);for(let k=0;k<alpha.length;k++)alpha[k]=pixels.data[k*4+3];
 for(let j=0;j<mh;j++)for(let i=0;i<mw;i++){let m=255;for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const y=Math.min(mh-1,Math.max(0,j+dj)),x=Math.min(mw-1,Math.max(0,i+di)),v=alpha[y*mw+x];if(v<m)m=v}pixels.data[(j*mw+i)*4+3]=m}
 ctx.putImageData(pixels,0,0);atmosphere.style.maskImage=`url("${mask.toDataURL('image/png')}")`;
}
let gl,program,buffer,texture,image,sceneName='',serial=0,raf=0,last=0,time=0,frames=0,lost=false,failed=false,ready=false;
let pointer={x:0,y:0},target={x:0,y:0},locations;
const current=()=>SCENES[game.dataset.sceneBackground];
// Outdoor and themed plates animate; dedicated rooms (kitchen, chalkboard) are drawn once.
const wanted=()=>current()?.mode==='background';
const shown=()=>wanted()||current()?.mode==='dedicated';
const blocked=()=>!wanted()||document.hidden||dialog.open||game.inert||document.body.classList.contains('compact-screen')||matchMedia('(orientation:portrait)').matches;
const vertex=`attribute vec2 position;varying vec2 uv;void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
const fragment=`precision mediump float;varying vec2 uv;uniform sampler2D artwork;uniform vec2 cover;uniform vec4 stage;uniform float zoom;uniform float tiles;uniform float board;uniform float sky;uniform float pan;uniform vec2 pointer;uniform float time;uniform float motion;uniform float vegetation;uniform float water;uniform float sunlight;
float mirror(float x){x=abs(x);return x>1.?2.-x:x;}
vec4 art(vec2 p){return texture2D(artwork,clamp(vec2(mirror(p.x),tiles>0.?mirror(p.y):p.y),vec2(.0005),vec2(.9995)));}
void main(){vec2 s=(uv-stage.xy)/stage.zw;s.x+=pan;vec2 p=.5+(s-.5)*cover/zoom;
if(board>0.&&(stage.z<.999||stage.w<.999)){
// A framed board grows to the screen: its frame bands sit at the screen edges and
// the plain interior continues between them. Units are artwork fractions.
vec2 edge=vec2(uv.x,1.-uv.x)/stage.z;vec2 vert=vec2(uv.y,1.-uv.y)/stage.w;vec2 q=clamp(p,vec2(.03,.05),vec2(.97,.97));
if(edge.x<.0151)q.x=edge.x;else if(edge.y<.0151)q.x=1.-edge.y;
if(vert.x<.05)q.y=vert.x;else if(vert.y<.0269)q.y=1.-vert.y;p=q;}
float fromTop=1.-p.y;float foreground=smoothstep(.57,1.,fromTop);
p.x+=motion*pointer.x*(.00045+foreground*.0011);
p.y+=motion*pointer.y*(.0002+foreground*.0005);
float edge=1.-smoothstep(.025,.13,min(p.x,1.-p.x));float canopy=edge*(1.-smoothstep(.36,.66,fromTop));
float planting=sin(3.14159*clamp((fromTop-.78)/.22,0.,1.));
p.x+=motion*vegetation*sin(time*.75+p.y*15.+p.x*7.)*(canopy*.0014+planting*.00085);
float shore=smoothstep(.43,.49,fromTop)*(1.-smoothstep(.61,.69,fromTop));
p.x+=motion*water*shore*sin(time*.65+p.y*120.)*.0009;
// Beyond the top or bottom edge: outdoor skies mirror briefly (canopies continue),
// then everything dissolves into a wide soft blur so no object reads upside down.
float outside=max(p.y-1.,-p.y);float reflected=sky>0.&&p.y>1.?1.:0.;
if(reflected>0.)p.y=2.-p.y;
vec4 colour=art(p);
if(outside>0.&&tiles<1.){float r=min(.2,outside*2.5);vec4 soft=vec4(0.);for(int k=-4;k<=4;k++){soft+=art(vec2(p.x+r*float(k)/4.,p.y))+art(vec2(p.x+r*(float(k)+.5)/4.,reflected>0.?p.y:p.y>1.?.97:.03));}colour=mix(colour,soft/18.,reflected>0.?smoothstep(.02,.09,outside):smoothstep(0.,.03,outside));}
float glint=pow(max(0.,sin(p.x*180.+p.y*260.+time*.8)),10.)*shore*.012*water;
float daylight=(.5+.5*sin(time*.32))*.006*sunlight*(1.-smoothstep(.02,.36,p.x));
colour.rgb+=motion*(vec3(glint)+vec3(daylight,daylight*.8,daylight*.45));gl_FragColor=colour;}`;
function shader(kind,source){const s=gl.createShader(kind);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
function initialize(){
 gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});if(!gl)throw Error('WebGL unavailable');
 const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment);program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
 buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);const pos=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
 locations={};for(const name of['cover','stage','zoom','tiles','board','sky','pan','pointer','time','motion','vegetation','water','sunlight'])locations[name]=gl.getUniformLocation(program,name);gl.uniform1i(gl.getUniformLocation(program,'artwork'),0);
 texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);if(image)upload();
}
function upload(){gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);ready=true;}
function resize(){measure();const dpr=Math.min(devicePixelRatio,1.5);canvas.width=Math.max(1,Math.round((layout.cw||1)*dpr));canvas.height=Math.max(1,Math.round((layout.ch||1)*dpr));if(gl&&!lost){gl.viewport(0,0,canvas.width,canvas.height);if(ready&&shown()){if(wanted()){try{updateSkyMask();}catch(error){maskKey='';console.warn('Cloud matte unavailable; scenery continues.',error);}}render();}}}
function drawAtmosphere(){atmosphere.hidden=!current()?.life?.clouds||!wanted()||!ready||lost||failed;if(atmosphere.hidden)return;for(const cloud of clouds){cloud.x=(((reduce.matches?0:time)/cloud.duration+cloud.phase)%1.28)-.18;cloud.node.style.transform=`translate3d(${cloud.x*worldWidth}px,0,0)`;}}
function render(){if(!ready||lost||failed)return;gl.useProgram(program);const screen=layout.aspect,art=image.naturalWidth/image.naturalHeight,life=wanted()?current()?.life??{}:{},motion=wanted()&&!reduce.matches?1:0;gl.uniform2f(locations.cover,art>screen?screen/art:1,art>screen?1:art/screen);gl.uniform4f(locations.stage,layout.x,layout.y,layout.w,layout.h);gl.uniform1f(locations.zoom,wanted()?1.012:1);gl.uniform1f(locations.tiles,current()?.edge==='tiles'?1:0);gl.uniform1f(locations.board,current()?.edge==='board'?1:0);gl.uniform1f(locations.sky,wanted()&&life.clouds?1:0);gl.uniform1f(locations.pan,current()?.pan??0);gl.uniform2f(locations.pointer,motion?pointer.x:0,motion?pointer.y:0);gl.uniform1f(locations.time,time);gl.uniform1f(locations.motion,motion);for(const name of['vegetation','water','sunlight'])gl.uniform1f(locations[name],life[name]??0);gl.drawArrays(gl.TRIANGLES,0,3);drawAtmosphere();frames++;canvas.hidden=!shown();game.dataset.illustratedWorld='ready';}
function tick(now){raf=0;if(blocked()||!ready||lost||failed)return;if(!last||now-last>=1000/30-1){const dt=last?Math.min((now-last)/1000,.1):0;last=now;time+=dt;const blend=1-Math.exp(-3.5*dt);pointer.x+=(target.x-pointer.x)*blend;pointer.y+=(target.y-pointer.y)*blend;render();}raf=requestAnimationFrame(tick);}
function sync(){if(blocked()||!ready||lost||failed){cancelAnimationFrame(raf);raf=0;last=0;canvas.hidden=!shown()||!ready||lost||failed;if(!canvas.hidden&&!wanted())render();drawAtmosphere();return;}canvas.hidden=false;if(reduce.matches){cancelAnimationFrame(raf);raf=0;last=0;pointer=target={x:0,y:0};render();}else if(!raf){last=0;raf=requestAnimationFrame(tick);}}
async function sceneChanged(){const scene=current();const token=++serial;cancelAnimationFrame(raf);raf=0;last=0;ready=false;canvas.hidden=true;atmosphere.hidden=true;pointer=target={x:0,y:0};if(!shown()||failed)return;try{if(!gl)initialize();const next=new Image();next.src='assets/art/'+scene.image;await next.decode();if(token!==serial)return;image=next;sceneName=scene.name;maskKey='';upload();resize();sync();}catch(error){if(token!==serial)return;failed=true;game.dataset.illustratedWorld='fallback';canvas.hidden=true;atmosphere.hidden=true;console.warn('Sculpted scene keeps its CSS artwork fallback.',error);}}
let pending=0;const relayout=()=>{if(pending)return;pending=requestAnimationFrame(()=>{pending=0;resize();sync();});};
new MutationObserver(sceneChanged).observe(game,{attributes:true,attributeFilter:['data-scene-background']});new MutationObserver(sync).observe(game,{attributes:true,attributeFilter:['inert']});new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});new MutationObserver(sync).observe(dialog,{attributes:true,attributeFilter:['open']});new ResizeObserver(relayout).observe(game);new ResizeObserver(relayout).observe(canvas);addEventListener('resize',relayout);game.addEventListener('screenfill',relayout);document.addEventListener('visibilitychange',sync);reduce.addEventListener('change',sync);
game.addEventListener('pointermove',event=>{if(event.pointerType==='touch'||reduce.matches||blocked())return;const r=game.getBoundingClientRect();target={x:Math.max(-1,Math.min(1,(event.clientX-r.left)/r.width*2-1)),y:Math.max(-1,Math.min(1,(event.clientY-r.top)/r.height*2-1))};},{passive:true});game.addEventListener('pointerleave',()=>{target={x:0,y:0};},{passive:true});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;canvas.hidden=true;atmosphere.hidden=true;cancelAnimationFrame(raf);raf=0;game.dataset.illustratedWorld='fallback';});canvas.addEventListener('webglcontextrestored',()=>{try{lost=false;initialize();resize();sync();}catch(error){failed=true;canvas.hidden=true;atmosphere.hidden=true;game.dataset.illustratedWorld='fallback';}});
window.sparkyIllustratedWorld={get status(){return{type:'sculpted-2.5d',scene:sceneName,source:current()?.image,active:wanted(),shown:shown(),paused:blocked(),ready,failed,lost,reduced:reduce.matches,time,frames,width:canvas.width,height:canvas.height,stage:{...layout},drawCalls:ready?1:0,clouds:atmosphere.hidden?[]:clouds.map(c=>({x:c.x,width:c.width,duration:c.duration})),life:{...current()?.life},pointer:{...pointer}};},sample(u,v){if(!ready||lost)return null;render();const rgba=new Uint8Array(4);gl.readPixels(Math.floor(u*canvas.width),Math.floor((1-v)*canvas.height),1,1,gl.RGBA,gl.UNSIGNED_BYTE,rgba);return Array.from(rgba);}};
resize();sceneChanged();
