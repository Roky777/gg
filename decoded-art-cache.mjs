/** Bounded decoded-image reuse; the browser may discard evicted pixels under memory pressure. */
export class DecodedArtCache {
 constructor({maxEntries=64,maxPixels=12_000_000,createImage=()=>new Image()}={}){Object.assign(this,{maxEntries,maxPixels,createImage});this.cache=new Map();this.pending=new Map();this.pixels=0;}
 load(src){
  const cached=this.cache.get(src);if(cached){this.cache.delete(src);this.cache.set(src,cached);return Promise.resolve(cached.image);}
  if(this.pending.has(src))return this.pending.get(src);
  const job=(async()=>{const image=this.createImage();image.src=src;try{await image.decode();}catch{return image;}
   const pixels=image.naturalWidth*image.naturalHeight;
   if(pixels>0&&pixels<=this.maxPixels){this.cache.set(src,{image,pixels});this.pixels+=pixels;
    while(this.cache.size>this.maxEntries||this.pixels>this.maxPixels){const key=this.cache.keys().next().value;this.pixels-=this.cache.get(key).pixels;this.cache.delete(key);}
   }return image;
  })();this.pending.set(src,job);const clear=()=>{if(this.pending.get(src)===job)this.pending.delete(src)};job.then(clear,clear);return job;
 }
 get stats(){return{entries:this.cache.size,pixels:this.pixels,pending:this.pending.size,maxEntries:this.maxEntries,maxPixels:this.maxPixels};}
}
