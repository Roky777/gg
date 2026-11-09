const scene=(name,surface='grass',life={clouds:true,vegetation:1})=>({name,image:'worlds-v3/shared-playroom-v1.webp',surface:'floor',mode:'background',life:{sunlight:1}});
export const SCENES={
 amusement:scene('amusement'),
 playroom:scene('playroom','floor',{sunlight:1}),
 garden:scene('garden'),
 stage:scene('stage','floor',{sunlight:1}),
 beach:scene('beach','floor',{clouds:true,vegetation:1,water:1}),
 market:scene('market','floor',{clouds:true,vegetation:.35}),
 farm:scene('farm'),
 art:scene('art','floor',{sunlight:1}),
 kitchen:{name:'kitchen',image:'worlds-v3/shared-playroom-v1.webp',surface:'floor',mode:'dedicated'},
 chalkboard:{name:'chalkboard',image:'worlds-v3/shared-playroom-v1.webp',surface:'floor',mode:'dedicated'}
};
export const GAME_SCENES={
 letters:'playroom',counting:'playroom',assembly:'playroom',differences:'playroom',
 'count-connect':'playroom','equal-groups':'playroom','colour-match':'playroom',
 'word-picture':'playroom','letter-case':'playroom','letter-picture':'playroom',
 'food-sort':'kitchen','accessory-grid':'chalkboard'
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
