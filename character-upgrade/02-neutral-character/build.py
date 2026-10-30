"""Assemble and package existing source artwork; no redraw, resizing or outer blur."""
from pathlib import Path
import json,hashlib,shutil
from PIL import Image
import numpy as np
ROOT=Path(__file__).resolve().parents[3]
SRC=ROOT/'animation/sparky/godot-parts'
OUT=Path(__file__).resolve().parent
P=OUT/'parts';P.mkdir(exist_ok=True)
meta=json.loads((SRC/'parts-manifest.json').read_text());lookup={p['name']:p for p in meta['parts']}
rig=json.loads((SRC/'Sparky_Parts.json').read_text())
source=Image.open(ROOT/'Sparky_Idle_EB_4_Keys.png').convert('RGBA').crop((0,0,512,640))
features=['Eyebrow_L','Eyebrow_R','Eye_L_open','Eye_R_open','Nose','Smile']
# Clean face remains behind independent facial attachments. Restore original gold
# where no opaque feature covers it; retain the pre-existing reconstructed paint
# underneath opaque features, where their motion will uncover the clean surface.
coverage=np.zeros((640,512),dtype=np.uint8)
for name in features:
 x,y,w,h=lookup[name]['source_rect'];a=np.array(Image.open(SRC/'parts'/f'{name}.png'))[:,:,3]
 coverage[y:y+h,x:x+w]=np.maximum(coverage[y:y+h,x:x+w],a)
for part in meta['parts']:shutil.copy2(SRC/'parts'/f"{part['name']}.png",P/f"{part['name']}.png")
x,y,w,h=lookup['Face']['source_rect'];face=np.array(Image.open(P/'Face.png'));gold=np.array(source)[y:y+h,x:x+w];mask=coverage[y:y+h,x:x+w]==0
before=face.copy();face[mask]=gold[mask]
assert np.array_equal(face[~mask],before[~mask]), 'Feature-covered clean paint must remain untouched'
Image.fromarray(face).save(P/'Face.png')
order=[s['attachment'] for s in rig['slots']]
def assemble():
 canvas=Image.new('RGBA',(512,640))
 for name in order:
  x,y,w,h=lookup[name]['source_rect'];canvas.alpha_composite(Image.open(P/f'{name}.png'),(x,y))
 return canvas
old=Image.new('RGBA',(512,640))
for name in order:
 x,y,w,h=lookup[name]['source_rect'];old.alpha_composite(Image.open(SRC/'parts'/f'{name}.png'),(x,y))
assembled=assemble()
def norm(im):
 a=np.array(im);a[a[:,:,3]==0]=0;return a
a,b=norm(assembled),norm(source);delta=np.abs(a.astype(int)-b.astype(int));changed=np.any(delta,axis=2)
assert delta[:,:,:3].max()<=3 and delta[:,:,3].max()<=3, 'Neutral source comparison exceeded 3/255 compositing tolerance'
assembled.save(OUT/'Sparky-Neutral.png');source.save(OUT/'Target-Source.png')
bbox=source.getbbox();assembled.crop(bbox).save(OUT/'Sparky-Neutral-Cropped.png');source.crop(bbox).save(OUT/'Target-Cropped.png')
# Original atlas packing and dimensions, with only the repaired face region changed.
atlas=Image.open(SRC/'Sparky_Parts.png').convert('RGBA');ax,ay,w,h=lookup['Face']['atlas_rect'];f=Image.open(P/'Face.png');atlas.paste(f,(ax,ay))
for d in (1,2):
 atlas.paste(f.crop((0,0,w,1)),(ax,ay-d));atlas.paste(f.crop((0,h-1,w,h)),(ax,ay+h+d-1))
 atlas.paste(f.crop((0,0,1,h)),(ax-d,ay));atlas.paste(f.crop((w-1,0,w,h)),(ax+w+d-1,ay))
atlas.save(OUT/'Sparky_Neutral_Parts.png')
(OUT/'Sparky_Neutral_Parts.atlas').write_text((SRC/'Sparky_Parts.atlas').read_text().replace('Sparky_Parts.png','Sparky_Neutral_Parts.png'))
# Keep editable neutral setup; animation adaptation is explicitly deferred.
rig['animations']={};rig['skeleton']['images']='parts/'
(OUT/'Sparky_Neutral_Setup.json').write_text(json.dumps(rig,indent=2)+'\n')
meta['stage']=2;meta['assembly_order']=order;meta['source_sheet']='Sparky_Idle_EB_4_Keys.png';meta['neutral_only']=True
(OUT/'parts-manifest.json').write_text(json.dumps(meta,indent=2)+'\n')
# Verify every packed region equals the individual transparent file.
for part in meta['parts']:
 ax,ay,w,h=part['atlas_rect'];assert atlas.crop((ax,ay,ax+w,ay+h)).tobytes()==Image.open(P/f"{part['name']}.png").tobytes()
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
unchanged=[p['name'] for p in meta['parts'] if sha(P/f"{p['name']}.png")==sha(SRC/'parts'/f"{p['name']}.png")]
# Confirm original exterior alpha is retained; only hidden background paint changed.
alpha=np.array(source)[:,:,3];solid=alpha>0;inside=solid.copy()
for dy,dx in [(1,0),(-1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,1),(-1,-1)]:inside &= np.roll(solid,(dy,dx),(0,1))
exterior=~inside
assert np.array_equal(a[:,:,3][exterior],b[:,:,3][exterior]), 'Source exterior alpha changed'
report={'stage':2,'scope':'Neutral appearance and source-part package only. Animation and bend coverage not certified.',
 'source':'Sparky_Idle_EB_4_Keys.png, top-left 512×640 pose','sourceSheetSha256':sha(ROOT/'Sparky_Idle_EB_4_Keys.png'),
 'neutralComparison':{'canvas':[512,640],'visibleBounds':list(bbox),'visibleResolution':[bbox[2]-bbox[0],bbox[3]-bbox[1]],'differentPixels':int(changed.sum()),'maxRGBDifference':int(delta[:,:,:3].max()),'maxAlphaDifference':int(delta[:,:,3].max()),'method':'Native RGBA comparison without resampling. Source-transparent RGB is normalized to zero. Up to 3/255 differences from alpha-over compositing are permitted in the interior face; exterior alpha must be identical.'},
 'repair':{'part':'Face','previousDifferentPixels':int(np.any(norm(old)!=b,axis=2).sum()),'changedFacePaintPixels':int(np.any(before!=face,axis=2).sum()),'outerAlphaUnchanged':True,'oldFacialFeaturesBakedIntoFace':False},
 'parts':len(meta['parts']),'neutralVisibleParts':len(order),'byteUnchangedSourceParts':unchanged,
 'atlas':{'size':[512,512],'alpha':'straight','packedRegionsVerified':len(meta['parts']),'gutterPixels':2},
 'hiddenOverlap':{'sourcePaintedCapRows':5,'locations':['upper arm beneath sleeve','forearm beneath upper arm','glove beneath forearm','thigh beneath shorts','shin beneath thigh','shoe beneath shin/sock'],'outerBlurAdded':False,'note':'Reused source-painted overlap caps. Coverage during extreme bends must be tested in stage 3.'},
 'limits':['Native visible source art is 236×403, not a full-HD redraw.','Alternate eye states are preserved as source parts; expressive/blink alignment is deferred.','No alternate gesture hands or side/back artwork supplied.','No game assets or animation timelines changed.']}
(OUT/'validation.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:report[k] for k in ['neutralComparison','repair','parts','atlas']},indent=2))
