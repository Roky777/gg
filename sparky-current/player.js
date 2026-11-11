import{FullCharacterPlayer}from'./runtime/character-upgrade/12-sparky-final/player.js?v=perf-4';
import{installPaintedProfile}from'./runtime/character-upgrade/12-sparky-final/motion-fit-painted.js?gesture-fit=perf-2';
const here=new URL('.',import.meta.url);
const useWorker=()=>globalThis.sparkyRigSlow!==true&&new URLSearchParams(location.search).get('rigworker')!=='0';
export class SparkyRigPlayer{
 static async load(manifestURL=new URL('manifest.json',here)){
  const manifest=await(await fetch(manifestURL)).json();
  if(!window.spine)await new Promise((ok,no)=>{const script=document.createElement('script');script.src=new URL('runtime/vendor/spine-webgl.min.js',here);script.onload=ok;script.onerror=()=>no(Error('Cannot load bundled animation runtime'));document.head.append(script)});
  // Size the shared buffer for the visible mascot, rather than half the screen.
  const renderWidth=Math.min(1024,Math.max(640,Math.ceil(innerWidth*.5*Math.min(devicePixelRatio||1,1.5)/128)*128));
  // Preferred: reshape and draw Sparky in a worker so taps, drags and the board never wait
  // for him. Any browser that cannot (no OffscreenCanvas WebGL, start-up failure) keeps the
  // in-page renderer below. ?rigworker=0 forces the in-page renderer.
  const camera={x:0,y:201.5,width:360*1.2,height:450*1.2};
  if(useWorker()){
   try{
    const{WorkerRigPlayer}=await import('./runtime/character-upgrade/12-sparky-final/worker-player.js?v=8');
    if(WorkerRigPlayer.supported()){
     const player=await WorkerRigPlayer.load(new URL(manifest.sourceManifest,here),{renderWidth,camera,spineURL:new URL('runtime/vendor/spine-webgl.min.js',here),profileURL:new URL('./runtime/character-upgrade/12-sparky-final/motion-fit-painted.js?gesture-fit=perf-2',here)});
     player.manifest=manifest;return player;
    }
   }catch(error){console.warn('Sparky worker renderer unavailable; drawing in the page.',error);}
  }
  const player=await FullCharacterPlayer.load(new URL(manifest.sourceManifest,here),{renderWidth});
  player.paintedProfile=await installPaintedProfile(player,()=>({}));
  player.manifest=manifest;
  // One fixed padded camera across the gallery and inspector.
  const cam=player.instance.renderer.camera;cam.viewportWidth*=1.2;cam.viewportHeight*=1.2;cam.update();
  return player;
 }
}
