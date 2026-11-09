export async function loadRuntimeModel(){
 if(typeof DecompressionStream==='function'){
  const response=await fetch(new URL('./mesh-model.runtime.json.gz?v=1',import.meta.url));
  if(response.ok&&response.body){const model=await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).json();if(model.runtimeFormat!==1)throw Error('Unsupported character runtime model');return model}
 }
 const response=await fetch(new URL('./mesh-model.runtime.json?v=1',import.meta.url));
 if(!response.ok)throw Error('Unable to load character runtime model');
 const model=await response.json();if(model.runtimeFormat!==1)throw Error('Unsupported character runtime model');return model;
}
