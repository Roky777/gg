"""Package the twenty individual generated counting illustrations as padded PNGs."""
from pathlib import Path
import re,json
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[1]
source=root/'assets/art/counting/source';out=source.parent
ids=re.findall(r"\['([a-z-]+)','",(root/'counting-game.js').read_text().split('].map')[0])
assert len(ids)==20 and len(set(ids))==20
images=[];missing=[]
for name in ids:
 p=source/(name+'.png')
 if not p.exists():missing.append(name);continue
 im=Image.open(p).convert('RGBA');a=im.getchannel('A');box=a.point(lambda value:255 if value>20 else 0).getbbox()
 assert box and box[0]>0 and box[1]>0 and box[2]<im.width and box[3]<im.height,name+': artwork touches edge'
 assert a.getextrema()[0]==0,name+': no transparent background'
 im=im.crop(box);im.thumbnail((432,432),Image.Resampling.LANCZOS)
 canvas=Image.new('RGBA',(512,512));canvas.alpha_composite(im,((512-im.width)//2,(512-im.height)//2));canvas.save(out/(name+'.png'),optimize=True)
 images.append({'id':name,'file':name+'.png','width':512,'height':512})
sheet=Image.new('RGB',(1000,700),'#edf3e8');draw=ImageDraw.Draw(sheet)
for index,item in enumerate(images):
 im=Image.open(out/item['file']);im.thumbnail((165,145),Image.Resampling.LANCZOS);x=index%5*200+(200-im.width)//2;y=index//5*175+5;sheet.paste(im,(x,y),im);draw.text((index%5*200+15,y+150),item['id'],fill='#285965')
sheet.save(root/'output/counting-assets-review.jpg',quality=93)
(out/'art-audit.json').write_text(json.dumps({'images':images,'missing':missing},indent=2))
if missing:print('Still waiting: '+', '.join(missing))
else:(out/'manifest.json').write_text(json.dumps({'ready':True,'images':images},indent=2));print('READY: 20 transparent padded 512 × 512 counting PNGs.')
print(f'Packaged {len(images)} / 20 assets.')
