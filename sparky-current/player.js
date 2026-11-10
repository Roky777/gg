import{FullCharacterPlayer}from'./runtime/character-upgrade/12-sparky-final/player.js?v=perf-3';
import{installPaintedProfile}from'./runtime/character-upgrade/12-sparky-final/motion-fit-painted.js?gesture-fit=perf-2';
const here=new URL('.',import.meta.url);
export class SparkyRigPlayer{
 static async load(manifestURL=new URL('manifest.json',here)){
  const manifest=await(await fetch(manifestURL)).json();
  if(!window.spine)await new Promise((ok,no)=>{const script=document.createElement('script');script.src=new URL('runtime/vendor/spine-webgl.min.js',here);script.onload=ok;script.onerror=()=>no(Error('Cannot load bundled animation runtime'));document.head.append(script)});
  // Size the shared buffer for the visible mascot, rather than half the screen.
  const renderWidth=Math.min(1024,Math.max(640,Math.ceil(innerWidth*.5*Math.min(devicePixelRatio||1,1.5)/128)*128));
  const player=await FullCharacterPlayer.load(new URL(manifest.sourceManifest,here),{renderWidth});
  player.paintedProfile=await installPaintedProfile(player,()=>({}));
  player.manifest=manifest;
  // One fixed padded camera across the gallery and inspector.
  const camera=player.instance.renderer.camera;camera.viewportWidth*=1.2;camera.viewportHeight*=1.2;camera.update();
  return player;
 }
}
