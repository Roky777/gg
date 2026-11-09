import{SCENES}from'./scene-backgrounds.mjs';

// Sculpted scene artwork supplies the forms; bounded motion supplies the life.
// A single image draw plus three shared cloud sprites keeps the scene lightweight.
const game=document.querySelector('.game'),dialog=document.getElementById('pause-dialog'),reduce=matchMedia('(prefers-reduced-motion:reduce)');
const canvas=document.createElement('canvas');canvas.className='illustrated-world';canvas.setAttribute('aria-hidden','true');canvas.hidden=true;game.prepend(canvas);
const atmosphere=document.createElement('div');atmosphere.className='scene-atmosphere';atmosphere.setAttribute('aria-hidden','true');atmosphere.hidden=true;canvas.after(atmosphere);
const cloudSpecs=[{phase:.26,duration:84,width:16,top:2.5,opacity:.96},{phase:.73,duration:110,width:12,top:3.5,opacity:.86},{phase:1.08,duration:96,width:18,top:7.5,opacity:.95}];
const clouds=cloudSpecs.map(spec=>{const node=new Image();node.src='assets/art/worlds-v2/cloud.webp';node.alt='';node.draggable=false;node.style.cssText=`width:${spec.width}%;top:${spec.top}%;opacity:${spec.opacity}`;atmosphere.append(node);return{...spec,node,x:0};});
let worldWidth=1;
// Runtime occlusion matte: clouds belong in the sky, behind the painted trees.
// This samples the current artwork; it does not add or repaint scenic objects.
function updateSkyMask(){
 if(!current()?.life?.clouds||!image){atmosphere.style.maskImage='none';return;}
 const mask=document.createElement('canvas');mask.width=768;mask.height=432;const ctx=mask.getContext('2d',{willReadFrequently:true});
 const scale=Math.max(mask.width/image.naturalWidth,mask.height/image.naturalHeight)*1.012,w=image.naturalWidth*scale,h=image.naturalHeight*scale;ctx.drawImage(image,(mask.width-w)/2,(mask.height-h)/2,w,h);
 const pixels=ctx.getImageData(0,0,mask.width,mask.height),clamp=n=>Math.max(0,Math.min(1,n));
 for(let i=0;i<pixels.data.length;i+=4){const r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2],y=Math.floor(i/4/mask.width)/mask.height;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=255;pixels.data[i+3]=Math.round(255*Math.min(clamp((b-r-20)/40),clamp((b-g-4)/20))*clamp((.28-y)/.035));}
 ctx.putImageData(pixels,0,0);atmosphere.style.maskImage=`url("${mask.toDataURL('image/png')}")`;
}
let gl,program,buffer,texture,image,sceneName='',serial=0,raf=0,last=0,time=0,frames=0,lost=false,failed=false,ready=false;
let pointer={x:0,y:0},target={x:0,y:0},locations;
const current=()=>SCENES[game.dataset.sceneBackground];
const wanted=()=>current()?.mode==='background';
const blocked=()=>!wanted()||document.hidden||dialog.open||game.inert||document.body.classList.contains('compact-screen')||matchMedia('(orientation:portrait)').matches;
const vertex=`attribute vec2 position;varying vec2 uv;void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
const fragment=`precision mediump float;varying vec2 uv;uniform sampler2D artwork;uniform vec2 cover;uniform vec2 pointer;uniform float time;uniform float motion;uniform float vegetation;uniform float water;uniform float sunlight;
void main(){vec2 p=.5+(uv-.5)*cover/1.012;float fromTop=1.-p.y;float foreground=smoothstep(.57,1.,fromTop);
p.x+=motion*pointer.x*(.00045+foreground*.0011);
p.y+=motion*pointer.y*(.0002+foreground*.0005);
float edge=1.-smoothstep(.025,.13,min(p.x,1.-p.x));float canopy=edge*(1.-smoothstep(.36,.66,fromTop));
float planting=sin(3.14159*clamp((fromTop-.78)/.22,0.,1.));
p.x+=motion*vegetation*sin(time*.75+p.y*15.+p.x*7.)*(canopy*.0014+planting*.00085);
float shore=smoothstep(.43,.49,fromTop)*(1.-smoothstep(.61,.69,fromTop));
p.x+=motion*water*shore*sin(time*.65+p.y*120.)*.0009;
vec4 colour=texture2D(artwork,clamp(p,vec2(.0005),vec2(.9995)));
float glint=pow(max(0.,sin(p.x*180.+p.y*260.+time*.8)),10.)*shore*.012*water;
float daylight=(.5+.5*sin(time*.32))*.006*sunlight*(1.-smoothstep(.02,.36,p.x));
colour.rgb+=motion*(vec3(glint)+vec3(daylight,daylight*.8,daylight*.45));gl_FragColor=colour;}`;
function shader(kind,source){const s=gl.createShader(kind);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
function initialize(){
 gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});if(!gl)throw Error('WebGL unavailable');
 const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment);program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
 buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);const pos=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
 locations={};for(const name of['cover','pointer','time','motion','vegetation','water','sunlight'])locations[name]=gl.getUniformLocation(program,name);gl.uniform1i(gl.getUniformLocation(program,'artwork'),0);
 texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);if(image)upload();
}
function upload(){gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);ready=true;}
function resize(){const r=game.getBoundingClientRect(),dpr=Math.min(devicePixelRatio,1.5);worldWidth=r.width;canvas.width=Math.max(1,Math.round(r.width*dpr));canvas.height=Math.max(1,Math.round(r.height*dpr));if(gl&&!lost){gl.viewport(0,0,canvas.width,canvas.height);if(ready&&wanted()&&!blocked())render();}}
function drawAtmosphere(){atmosphere.hidden=!current()?.life?.clouds||!wanted()||!ready||lost||failed;if(atmosphere.hidden)return;for(const cloud of clouds){cloud.x=(((reduce.matches?0:time)/cloud.duration+cloud.phase)%1.28)-.18;cloud.node.style.transform=`translate3d(${cloud.x*worldWidth}px,0,0)`;}}
function render(){if(!ready||lost||failed)return;gl.useProgram(program);const screen=canvas.width/canvas.height,art=image.naturalWidth/image.naturalHeight,life=current()?.life??{};gl.uniform2f(locations.cover,art>screen?screen/art:1,art>screen?1:art/screen);gl.uniform2f(locations.pointer,reduce.matches?0:pointer.x,reduce.matches?0:pointer.y);gl.uniform1f(locations.time,time);gl.uniform1f(locations.motion,reduce.matches?0:1);for(const name of['vegetation','water','sunlight'])gl.uniform1f(locations[name],life[name]??0);gl.drawArrays(gl.TRIANGLES,0,3);drawAtmosphere();frames++;canvas.hidden=!wanted();game.dataset.illustratedWorld='ready';}
function tick(now){raf=0;if(blocked()||!ready||lost||failed)return;if(!last||now-last>=1000/30-1){const dt=last?Math.min((now-last)/1000,.1):0;last=now;time+=dt;const blend=1-Math.exp(-3.5*dt);pointer.x+=(target.x-pointer.x)*blend;pointer.y+=(target.y-pointer.y)*blend;render();}raf=requestAnimationFrame(tick);}
function sync(){if(blocked()||!ready||lost||failed){cancelAnimationFrame(raf);raf=0;last=0;canvas.hidden=!wanted()||!ready||lost||failed;drawAtmosphere();return;}canvas.hidden=false;if(reduce.matches){cancelAnimationFrame(raf);raf=0;last=0;pointer=target={x:0,y:0};render();}else if(!raf){last=0;raf=requestAnimationFrame(tick);}}
async function sceneChanged(){const scene=current();const token=++serial;cancelAnimationFrame(raf);raf=0;last=0;ready=false;canvas.hidden=true;atmosphere.hidden=true;pointer=target={x:0,y:0};if(scene?.mode!=='background'||failed)return;try{if(!gl)initialize();const next=new Image();next.src='assets/art/'+scene.image;await next.decode();if(token!==serial)return;image=next;sceneName=scene.name;updateSkyMask();upload();resize();sync();}catch(error){if(token!==serial)return;failed=true;game.dataset.illustratedWorld='fallback';canvas.hidden=true;atmosphere.hidden=true;console.warn('Sculpted scene keeps its CSS artwork fallback.',error);}}
new MutationObserver(sceneChanged).observe(game,{attributes:true,attributeFilter:['data-scene-background']});new MutationObserver(sync).observe(game,{attributes:true,attributeFilter:['inert']});new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});new MutationObserver(sync).observe(dialog,{attributes:true,attributeFilter:['open']});new ResizeObserver(()=>{resize();sync();}).observe(game);document.addEventListener('visibilitychange',sync);reduce.addEventListener('change',sync);
game.addEventListener('pointermove',event=>{if(event.pointerType==='touch'||reduce.matches||blocked())return;const r=game.getBoundingClientRect();target={x:Math.max(-1,Math.min(1,(event.clientX-r.left)/r.width*2-1)),y:Math.max(-1,Math.min(1,(event.clientY-r.top)/r.height*2-1))};},{passive:true});game.addEventListener('pointerleave',()=>{target={x:0,y:0};},{passive:true});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;canvas.hidden=true;atmosphere.hidden=true;cancelAnimationFrame(raf);raf=0;game.dataset.illustratedWorld='fallback';});canvas.addEventListener('webglcontextrestored',()=>{try{lost=false;initialize();resize();sync();}catch(error){failed=true;canvas.hidden=true;atmosphere.hidden=true;game.dataset.illustratedWorld='fallback';}});
window.sparkyIllustratedWorld={get status(){return{type:'sculpted-2.5d',scene:sceneName,source:current()?.image,active:wanted(),paused:blocked(),ready,failed,lost,reduced:reduce.matches,time,frames,width:canvas.width,height:canvas.height,drawCalls:ready?1:0,clouds:atmosphere.hidden?[]:clouds.map(c=>({x:c.x,width:c.width,duration:c.duration})),life:{...current()?.life},pointer:{...pointer}};},sample(u,v){if(!ready||lost)return null;render();const rgba=new Uint8Array(4);gl.readPixels(Math.floor(u*canvas.width),Math.floor((1-v)*canvas.height),1,1,gl.RGBA,gl.UNSIGNED_BYTE,rgba);return Array.from(rgba);}};
resize();sceneChanged();
