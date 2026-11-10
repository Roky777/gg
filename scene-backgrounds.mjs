// pan: shifts the artwork left by this fraction of the stage width so the trees,
// palms and rocks painted at the far-left edge stand clear of Sparky.
const scene=(name,surface='grass',life={clouds:true,vegetation:1},pan=0)=>({name,image:'worlds-v3/'+name+'.webp',surface,mode:'background',life,pan});
export const SCENES={
 amusement:scene('amusement',undefined,undefined,.05),
 playroom:scene('playroom','floor',{sunlight:1}),
 garden:scene('garden',undefined,undefined,.05),
 stage:scene('stage','floor',{sunlight:1}),
 beach:scene('beach','floor',{clouds:true,vegetation:1,water:1},.06),
 market:scene('market','floor',{clouds:true,vegetation:.35},.05),
 farm:scene('farm',undefined,undefined,.05),
 art:scene('art','floor',{sunlight:1}),
 // edge: how the scenery continues beyond the 16:9 stage on other screen shapes.
 kitchen:{name:'kitchen',image:'figma-ui/feeding-wall.webp',surface:'floor',mode:'dedicated',edge:'tiles'},
 chalkboard:{name:'chalkboard',image:'play-kit/studio-backdrop.svg',surface:'floor',mode:'dedicated',edge:'board'}
};
export const GAME_SCENES={
 // The indoor art room and playroom are retired; their games use outdoor scenes.
 letters:'garden',counting:'farm',assembly:'farm',differences:'beach',
 'count-connect':'garden','equal-groups':'market','colour-match':'amusement',
 'word-picture':'market','letter-case':'garden','letter-picture':'amusement',
 'food-sort':'kitchen','accessory-grid':'chalkboard','story-order':'stage'
};
const TOPICS={letters:'letters',numbers:'counting','count-groups':'counting',assembly:'assembly',differences:'differences'};
export function backgroundFor(picture){
 if(picture.fun){return ['grow-garden','wash-toy'].includes(picture.topic)?SCENES.garden:SCENES.amusement;}
 return SCENES[GAME_SCENES[picture.variant??TOPICS[picture.topic]]??'garden'];
}
export function applySceneBackground(game,picture){
 const scene=backgroundFor(picture);game.dataset.sceneBackground=scene.name;game.dataset.sceneSurface=scene.surface;game.dataset.sceneMode=scene.mode;
 if(scene.mode==='background')game.style.setProperty('--scene-background',`url("assets/art/${scene.image}")`);
 else game.style.removeProperty('--scene-background');
 return scene;
}
