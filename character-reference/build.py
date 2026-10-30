"""Register reference artwork on the existing rig, preserving named regions and motion.
Image generation supplies new painting; this script only registers/packs the parts.
"""
from pathlib import Path
from collections import deque
from PIL import Image
import numpy as np,json,shutil,hashlib
P=Path(__file__).resolve().parent;ROOT=P.parent.parent;BASE=P.parent/'sparky-animations 4';N='Lucas_Activity_Icecream';A=P/'assets';A.mkdir(exist_ok=True)
R=json.loads((P/'source/regions.json').read_text());atlas=np.array(Image.open(BASE/'assets'/f'{N}.png').convert('RGBA'));out=atlas.copy();records=[]
def region(name):
 r=R[name];x,y,w,h=r['bounds'];rot=r.get('rotate')=='90';return x,y,h if rot else w,w if rot else h,rot

def unpack(name):
 x,y,w,h,rot=region(name);a=np.array(Image.fromarray(atlas[y:y+h,x:x+w]).rotate(-90 if rot else 0,expand=True));alpha=a[:,:,3];rgb=np.minimum(255,np.rint(a[:,:,:3].astype(float)*255/np.maximum(1,alpha[:,:,None]))).astype('uint8');return rgb,alpha

def flood(rgb,mask):
 v=rgb.copy();known=mask.copy();q=deque(zip(*np.where(known)));assert q
 while q:
  y,x=q.popleft()
  for yy,xx in [(y-1,x),(y+1,x),(y,x-1),(y,x+1)]:
   if 0<=yy<known.shape[0] and 0<=xx<known.shape[1] and not known[yy,xx]:v[yy,xx]=v[y,x];known[yy,xx]=1;q.append((yy,xx))
 return v

def crop(im):return im.crop(im.getchannel('A').point(lambda n:255 if n>100 else 0).getbbox())
def pack(name,rgb,alpha):
 v=np.dstack((np.rint(rgb.astype(float)*alpha[:,:,None]/255).astype('uint8'),alpha));x,y,w,h,rot=region(name);v=np.array(Image.fromarray(v).rotate(90 if rot else 0,expand=True));assert v.shape==(h,w,4),(name,v.shape,(h,w));out[y:y+h,x:x+w]=v

def fit(name,art,own_alpha=False):
 _,alpha=unpack(name);h,w=alpha.shape;ys,xs=np.where(alpha>100);l,t,r,b=xs.min(),ys.min(),xs.max()+1,ys.max()+1
 art=crop(art).resize((r-l,b-t),Image.Resampling.LANCZOS);v=np.array(art);known=(v[:,:,3]>220)&(v[:,:,:3].max(axis=2)>85);paint=flood(v[:,:,:3],known);paint[v[:,:,3]>220]=v[:,:,:3][v[:,:,3]>220];rgb=np.pad(paint,((t,h-b),(l,w-r),(0,0)),mode='edge')
 if own_alpha:
  alpha=np.zeros((h,w),dtype='uint8');alpha[t:b,l:r]=v[:,:,3]
 pack(name,rgb,alpha);records.append({'region':name,'retainsJointCoverage':not own_alpha})

# Existing high-resolution sports outfit masters were drawn for these same cells.
master=Image.open(ROOT/'animation-library/lucas-reskin-review/source/exact-reference-body-v7.png').convert('RGBA')
entries=json.loads((ROOT/'animation-library/lucas-reskin-review/source/body-order.json').read_text())
cells={}
for e in entries:
 i=e['index'];cells[e['name']]=master.crop((round(i%4*master.width/4),round(i//4*master.height/4),round((i%4+1)*master.width/4),round((i//4+1)*master.height/4)))
for name in ['Body','Body_2','Leg_R','Leg_L_2','Side_Body_New','Foots/Foot_L','Foots/Foot_R','Foots/Foot_Side','Foots/Foot_Cross_L']:
 fit(name,cells[name])
fit('T_shirt_2',Image.open(P/'source/torso-panel.png').convert('RGBA'))
for name in ['Hand_R','Hand_R(2)','Hand_R_Blur1']:fit(name,cells['Hand_R'])
# Register the separately authored bent-arm variants, retaining their soft caps.
# Shared colours, with the short sleeve on the proximal segment and golden distal arm.
for name in R:
 if name.startswith('Hand_Sep_'):
  rgb,alpha=unpack(name);h,w=alpha.shape
  # Sample the same source limb consistently in the source segment's orientation.
  src=crop(cells['Hand_R']);upper=name.startswith('Hand_Sep_1');src=src.crop((0,0,src.width,round(src.height*.52))) if upper else src.crop((0,round(src.height*.45),src.width,src.height));fit(name,src)
# Reference head is assembled from source-painted parts, with features separate.
parts=ROOT/'animation/sparky/godot-parts/parts';meta=json.loads((ROOT/'animation/sparky/godot-parts/parts-manifest.json').read_text());lookup={e['name']:e for e in meta['parts']};head=Image.new('RGBA',(236,212))
for name in ['Face','Flame_Crown']:
 x,y,w,h=lookup[name]['source_rect'];head.alpha_composite(Image.open(parts/(name+'.png')).convert('RGBA'),(x-138,y-191))
head.save(P/'source/reference-head.png');fit('Face',head,True)
fit('Neck',Image.open(parts/'Neck.png').convert('RGBA'))
fit('Palms/Palm_R',Image.open(parts/'Glove_L.png').convert('RGBA'),True)
# Closed smiling mouth and small nose use the actual reference drawing.
fit('Lips/Lips_N',Image.open(parts/'Smile.png').convert('RGBA'),True)
fit('Nose',Image.open(parts/'Nose.png').convert('RGBA'),True)
# The old fuzzy yellow eye halo is replaced by a thin outline registered to the
# inner eye opening. Do not change the clipping mesh, pupil movement, or blink keys.
def hole_box(im):
 a=np.array(im.getchannel('A'));mask=a<40;seen=np.zeros(mask.shape,bool);q=deque()
 for y in range(a.shape[0]):
  for x in [0,a.shape[1]-1]:
   if mask[y,x]:seen[y,x]=1;q.append((y,x))
 for x in range(a.shape[1]):
  for y in [0,a.shape[0]-1]:
   if mask[y,x] and not seen[y,x]:seen[y,x]=1;q.append((y,x))
 while q:
  y,x=q.popleft()
  for yy,xx in [(y-1,x),(y+1,x),(y,x-1),(y,x+1)]:
   if 0<=yy<a.shape[0] and 0<=xx<a.shape[1] and mask[yy,xx] and not seen[yy,xx]:seen[yy,xx]=1;q.append((yy,xx))
 ys,xs=np.where(mask&~seen);return (xs.min(),ys.min(),xs.max()+1,ys.max()+1)
rgb,aa=unpack('Eyepart_R');old=Image.fromarray(np.dstack((rgb,aa)));eye=Image.open(P/'source/eye-outline-master.png').convert('RGBA');a=hole_box(old);b=hole_box(eye);sx=(a[2]-a[0])/(b[2]-b[0]);sy=(a[3]-a[1])/(b[3]-b[1]);eye=eye.resize((round(eye.width*sx),round(eye.height*sy)),Image.Resampling.LANCZOS);eye_canvas=Image.new('RGBA',old.size);eye_canvas.paste(eye,(round(a[0]-b[0]*sx),round(a[1]-b[1]*sy)));e=np.array(eye_canvas);pack('Eyepart_R',e[:,:,:3],e[:,:,3]);records.append({'region':'Eyepart_R','registration':'inner eye opening','haloRemoved':True})
# The legacy centre logo remains hidden: the PW badge is part of the new shirt.
assert np.all(out[:,:,:3]<=out[:,:,3:4]);Image.fromarray(out).save(A/f'{N}.png')
for ext in ['atlas','skel']:shutil.copyfile(BASE/'assets'/f'{N}.{ext}',A/f'{N}.{ext}')
manifest=json.loads((BASE/'manifest.json').read_text());manifest['revision']=hashlib.sha256(out.tobytes()).hexdigest()[:16];manifest['camera']={'x':0,'y':660,'width':1280,'height':1600};(P/'manifest.json').write_text(json.dumps(manifest,indent=2));(P/'art-registration.json').write_text(json.dumps(records,indent=2));print('Packed',len(records),'reference parts')
