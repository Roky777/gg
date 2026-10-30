/** Export complete atlas cells with an explicit transparent safety border. */
const fs=require('fs'),path=require('path');const sharp=require('/Users/rax/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),folder=root+'/assets/icons',names=['sound-on','sound-off','close','next','play','restart'];
(async()=>{for(let i=0;i<names.length;i++)await sharp(folder+'/source-atlas.png').extract({left:i%3*512,top:Math.floor(i/3)*512,width:512,height:512}).resize(240,240).extend({left:8,right:8,top:8,bottom:8,background:'#00000000'}).png().toFile(folder+'/'+names[i]+'.png');console.log('Exported six complete PNG buttons with8px transparent border.');})();
