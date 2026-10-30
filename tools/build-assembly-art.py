"""Package generated PNGs without painting, blurring or altering the artwork.
Full-resolution sources: /Volumes/ROKYSM/Sparky-Artwork/assembly/source.
The live manifest is published only after all 40 images pass validation.
"""
import json, re
from pathlib import Path
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[1]
SOURCE=Path('/Volumes/ROKYSM/Sparky-Artwork/assembly/source')
OUTPUT=ROOT/'assets/art/assembly'
ids=re.findall(r"^ \['([^']+)'",(ROOT/'assembly-catalog.js').read_text(),re.M)
assert len(ids)==40 and len(set(ids))==40
OUTPUT.mkdir(exist_ok=True,parents=True)
missing=[]
images=[]
for name in ids:
    source=SOURCE/(name+'.png')
    if not source.exists() or not source.stat().st_size:
        missing.append(name); continue
    with Image.open(source) as opened:
        image=opened.convert('RGBA')
    alpha=image.getchannel('A')
    bounds=alpha.point(lambda value: 255 if value>20 else 0).getbbox()
    assert bounds, f'{name}: empty artwork'
    assert min(bounds[:2])>0 and bounds[2]<image.width and bounds[3]<image.height, f'{name}: artwork touches canvas edge'
    assert alpha.getextrema()[0]==0, f'{name}: missing transparent background'
    # Preserve the full alpha silhouette, with identical generous padding per image.
    image=image.crop(bounds)
    image.thumbnail((650,650),Image.Resampling.LANCZOS)
    canvas=Image.new('RGBA',(768,768))
    canvas.alpha_composite(image,((768-image.width)//2,(768-image.height)//2))
    canvas.save(OUTPUT/(name+'.png'),optimize=True)
    images.append({'id':name,'file':name+'.png','width':768,'height':768})
# A contact sheet makes shape, palette, consistency and unwanted fragments reviewable.
sheet=Image.new('RGB',(1000,8*145),'#edf3e8')
draw=ImageDraw.Draw(sheet)
for i,entry in enumerate(images):
    with Image.open(OUTPUT/entry['file']) as image:
        image.thumbnail((120,120),Image.Resampling.LANCZOS)
        x=(i%8)*125+(125-image.width)//2;y=(i//8)*145
        sheet.paste(image,(x,y),image)
        draw.text(((i%8)*125+5,y+123),entry['id'],fill='#244b50')
sheet=sheet.crop((0,0,1000,((len(images)+7)//8)*145))
sheet.save(ROOT/'output/assembly-contact-sheet.jpg',quality=90)
(OUTPUT/'art-audit.json').write_text(json.dumps({'count':len(images),'missing':missing,'source':str(SOURCE),'images':images},indent=2))
if missing:
    print('Still waiting for artwork: '+', '.join(missing))
else:
    (OUTPUT/'manifest.json').write_text(json.dumps({'ready':True,'images':images},indent=2))
    print('READY: 40 transparent 768 × 768 PNGs. All silhouettes fully inside the canvas.')
print(f'Packaged {len(images)} / 40 pictures.')
