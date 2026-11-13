/** Cloud occlusion pixels are prepared off the UI thread. */
export function skyMaskPixels({src,sw,sh,mw,mh,fw}){
 const out=new Uint8ClampedArray(mw*mh*4),alpha=new Uint8Array(mw*mh),clamp=n=>Math.max(0,Math.min(1,n));
 for(let j=0;j<mh;j++){const sy=1-(fw.ky*(1-(j+.5)/mh)+fw.by),ay=Math.min(sh-1,Math.max(0,Math.floor(clamp(sy)*sh)));
  for(let i=0;i<mw;i++){const sx=fw.kx*(i+.5)/mw+fw.bx,ax=Math.min(sw-1,Math.max(0,Math.floor(sx*sw))),k=(ay*sw+ax)*4,o=(j*mw+i)*4;
   out[o]=out[o+1]=out[o+2]=255;alpha[j*mw+i]=Math.round(255*Math.min(clamp((src[k+2]-src[k]-20)/40),clamp((src[k+2]-src[k+1]-4)/20))*clamp((.28-sy)/.035));
  }
 }
 for(let j=0;j<mh;j++)for(let i=0;i<mw;i++){let m=255;for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const y=Math.min(mh-1,Math.max(0,j+dj)),x=Math.min(mw-1,Math.max(0,i+di));m=Math.min(m,alpha[y*mw+x]);}out[(j*mw+i)*4+3]=m;}
 return out;
}
if(typeof self!=='undefined')self.onmessage=async({data})=>{try{const pixels=skyMaskPixels(data),canvas=new OffscreenCanvas(data.mw,data.mh),ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.putImageData(new ImageData(pixels,data.mw,data.mh),0,0);const blob=await canvas.convertToBlob({type:'image/png'});self.postMessage({id:data.id,blob});}catch(error){self.postMessage({id:data.id,error:error.message});}};
