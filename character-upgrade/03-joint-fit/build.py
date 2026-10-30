"""Register continuous source-art limb meshes and a neutral-compatible FK profile."""
from pathlib import Path
from collections import deque
import json,math,hashlib
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[3];OUT=Path(__file__).resolve().parent;SRC=OUT.parent/'02-neutral-character'
P=OUT/'parts';P.mkdir(exist_ok=True)
meta=json.loads((SRC/'parts-manifest.json').read_text());lookup={p['name']:p for p in meta['parts']};rig=json.loads((SRC/'Sparky_Neutral_Setup.json').read_text())
canonical=np.array(Image.open(SRC/'Sparky-Neutral.png'))
groups=['Leg_L','Leg_R','Shorts','Arm_L','Arm_R','Torso','Neck'];gi={n:i for i,n in enumerate(groups)}
def group(n):
 if n.startswith(('Shoe_','Shin_','Thigh_')):return 'Leg_'+n[-1]
 if n.startswith(('Glove_','Forearm_','Upper_Arm_','Sleeve_')):return 'Arm_'+n[-1]
 return n
owner=np.full((640,512),-1,dtype=np.int16)
for n in meta['assembly_order']:
 g=group(n)
 if g not in gi:continue
 x,y,w,h=lookup[n]['source_rect'];alpha=np.array(Image.open(SRC/'parts'/f'{n}.png'))[:,:,3]
 owner[y:y+h,x:x+w][alpha>0]=gi[g]
# Stray islands inherited from row-based extraction belong to the neighbouring
# semantic limb, not the knee/forearm that happened to own that source scanline.
orphans=0
for name in ['Arm_L','Arm_R','Leg_L','Leg_R']:
 label=gi[name];ys,xs=np.where(owner==label);seen=set();components=[]
 for y,x in zip(ys.tolist(),xs.tolist()):
  if (y,x) in seen:continue
  q=deque([(y,x)]);seen.add((y,x));c=[]
  while q:
   py,px=q.popleft();c.append((py,px))
   for dy in (-1,0,1):
    for dx in (-1,0,1):
     ny,nx=py+dy,px+dx
     if 0<=ny<640 and 0<=nx<512 and owner[ny,nx]==label and (ny,nx) not in seen:seen.add((ny,nx));q.append((ny,nx))
  components.append(c)
 components.sort(key=len,reverse=True)
 for c in components[1:]:
  for y,x in c:owner[y,x]=-2;orphans+=1
while np.any(owner==-2):
 ys,xs=np.where(owner==-2);changed=0
 for y,x in zip(ys,xs):
  options=[owner[y+dy,x+dx] for dy,dx in [(-1,0),(1,0),(0,-1),(0,1),(-1,-1),(-1,1),(1,-1),(1,1)] if 0<=y+dy<640 and 0<=x+dx<512 and owner[y+dy,x+dx]>=0]
  if options:owner[y,x]=max(set(options),key=options.count);changed+=1
 if not changed:
  vy,vx=np.where(owner>=0)
  for y,x in zip(ys,xs):
   nearest=np.argmin((vy-y)**2+(vx-x)**2);owner[y,x]=owner[vy[nearest],vx[nearest]]
images={};rects={};overlaps={}
def crop(name,arr):
 ys,xs=np.where(arr[:,:,3]>0);x,y,rr,bb=int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)
 images[name]=Image.fromarray(arr[y:bb,x:rr]);rects[name]=[x,y,rr-x,bb-y];images[name].save(P/f'{name}.png')
for name in groups:
 arr=np.zeros((640,512,4),dtype=np.uint8);mask=owner==gi[name];arr[mask]=canonical[mask]
 # Add matching source paint only beneath the proximal covering part. All outer
 # source alpha is excluded, and feathering stops at these hidden cap pixels.
 parent='Torso' if name.startswith('Arm') else 'Shorts' if name.startswith('Leg') else None
 hidden=np.zeros((640,512),bool)
 if parent:
  grown=mask.copy()
  for distance in range(1,6):
   expanded=grown.copy()
   for dy,dx in [(1,0),(-1,0),(0,1),(0,-1)]:expanded|=np.roll(grown,(dy,dx),(0,1))
   ring=expanded&~grown&(owner==gi[parent])&(canonical[:,:,3]>250)
   if name.startswith('Arm'):ring[431:]=False
   arr[ring]=canonical[ring];arr[ring,3]=(255*(6-distance)/5).astype(np.uint8) if isinstance(distance,np.ndarray) else int(255*(6-distance)/5)
   hidden|=ring;grown=expanded
 overlaps[name]=int(hidden.sum());crop(name,arr)
# Source head and all feature variants stay independent. Only neutral state is used here.
for part in meta['parts']:
 n=part['name']
 if group(n) in gi:continue
 images[n]=Image.open(SRC/'parts'/f'{n}.png').convert('RGBA');rects[n]=part['source_rect'];images[n].save(P/f'{n}.png')
# Extend a clean gold neck under the head. This cap is hidden in neutral.
neck=np.zeros((640,512,4),np.uint8);x,y,w,h=rects['Neck'];neck[y:y+h,x:x+w]=np.array(images['Neck'])
for xx in range(243,272):
 col=neck[402:415,xx];valid=col[(col[:,0]>160)&(col[:,1]>90)&(col[:,2]<70)&(col[:,3]>240)]
 if len(valid):
  for yy in range(393,403):neck[yy,xx]=valid[0];neck[yy,xx,3]=min(255,(yy-392)*85)
crop('Neck',neck)
# Alternate authored game hand poses can replace the neutral glove without a
# second hand remaining in the same mesh. Retain the source cuff as an overlap.
for side in ['L','R']:
 n='Arm_'+side;a=np.array(images[n]);x,y,w,h=rects[n]
 for row in range(h):
  sy=y+row
  if sy>=477:a[row,:,3]=0
  elif sy>=475:a[row,:,3]=(a[row,:,3].astype(float)*(477-sy)/3).astype(np.uint8)
 images[n+'_NoHand']=Image.fromarray(a);rects[n+'_NoHand']=rects[n];images[n+'_NoHand'].save(P/(n+'_NoHand.png'))
# Preserve the original white cuff as an independently oriented hidden wrist cover.
for side in ['L','R']:
 n='Glove_'+side;xx,yy,ww,hh=lookup[n]['source_rect'];c=np.zeros((640,512,4),np.uint8);c[yy:yy+hh,xx:xx+ww]=np.array(Image.open(SRC/'parts'/f'{n}.png'));c[:466,:,3]=0;c[478:,:,3]=0;crop('Cuff_'+side,c)
# Keep source registration but relocate pivots under their covering clothes.
anchors=meta['anchors_source'].copy()
for s in ['L','R']:
 anchors['upper_arm_'+s]=anchors['shoulder_'+s]
 anchors['forearm_'+s]=[203 if s=='L' else 310,448]
 anchors['thigh_'+s]=[229 if s=='L' else 282,505]
 anchors['shin_'+s]=[228 if s=='L' else 284,522]
 anchors['foot_'+s]=[224 if s=='L' else 288,539]
for side in ['L','R']:
 anchors['cuff_'+side]=anchors['hand_'+side];rig['bones'].append({'name':'cuff_'+side,'parent':'forearm_'+side})
for b in rig['bones']:
 x,y=anchors[b['name']];px,py=anchors.get(b.get('parent'),[256,594]);b['x']=x-px;b['y']=py-y
boneindex={b['name']:i for i,b in enumerate(rig['bones'])}
world={n:(xy[0]-256,594-xy[1]) for n,xy in anchors.items()}
order=['Leg_L','Leg_R','Shorts','Torso','Arm_L','Arm_R','Neck','Face','Flame_Crown','Eyebrow_L','Eyebrow_R','Nose','Smile','Eye_L','Eye_R','Cuff_L','Cuff_R']
oldslots={s['name']:s for s in rig['slots']}
assign={n:oldslots[n]['bone'] for n in oldslots};assign.update({'Cuff_L':'cuff_L','Cuff_R':'cuff_R','Arm_L':'shoulder_L','Arm_R':'shoulder_R','Leg_L':'thigh_L','Leg_R':'thigh_R'})
rig['slots']=[{'name':n,'bone':assign[n],'attachment':None if n.startswith('Cuff_') else n+'_open' if n.startswith('Eye_') else n} for n in order]
def smooth(a,b,t):
 t=max(0,min(1,(t-a)/(b-a)));return t*t*(3-2*t)
def weights(n,x,y):
 if n.startswith('Arm_'):
  s=n[-1];shoulder=smooth(415,434,y);elbow=smooth(444,452,y);wrist=smooth(467,473,y)
  return [('torso',1-shoulder),('upper_arm_'+s,shoulder*(1-elbow)),('forearm_'+s,shoulder*elbow*(1-wrist)),('hand_'+s,shoulder*elbow*wrist)]
 if n.startswith('Leg_'):
  s=n[-1];knee=smooth(519,525,y);ankle=smooth(536,542,y)
  return [('thigh_'+s,1-knee),('shin_'+s,knee*(1-ankle)),('foot_'+s,knee*ankle)]
 return [(assign['Eye_'+n[4]] if n.startswith('Eye_') else assign[n],1)]
# Pack without resampling; RGB extrusion belongs to the atlas gutter, not the actor.
atlas=Image.new('RGBA',(1024,512));ax=4;ay=4;rh=0;packed={};text='Sparky_Joint_Fit.png\nsize:1024,512\nfilter:Linear,Linear\npma:true\n'
for n,im in images.items():
 w,h=im.size
 if ax+w+4>1024:ax=4;ay+=rh+8;rh=0
 assert ay+h+4<=512
 atlas.paste(im,(ax,ay));packed[n]=[ax,ay,w,h]
 for d in (1,2):
  atlas.paste(im.crop((0,0,w,1)),(ax,ay-d));atlas.paste(im.crop((0,h-1,w,h)),(ax,ay+h+d-1));atlas.paste(im.crop((0,0,1,h)),(ax-d,ay));atlas.paste(im.crop((w-1,0,w,h)),(ax+w+d-1,ay))
 text+=f'{n}\nbounds:{ax},{ay},{w},{h}\n';ax+=w+8;rh=max(rh,h)
pm=np.array(atlas);pm[:,:,:3]=((pm[:,:,:3].astype(np.uint16)*pm[:,:,3:4]+127)//255).astype(np.uint8);Image.fromarray(pm).save(OUT/'Sparky_Joint_Fit.png');(OUT/'Sparky_Joint_Fit.atlas').write_text(text)
skin={n:{} for n in order};geometry={}
for n,im in images.items():
 slot='Eye_'+n[4] if n.startswith('Eye_') else n.replace('_NoHand','');x,y,w,h=rects[n]
 if n.startswith(('Arm_','Leg_')):
  nx,ny=math.ceil(w/3),math.ceil(h/2);uv=[];vs=[];tri=[];coords=[]
  for iy in range(ny+1):
   for ix in range(nx+1):
    u,v=ix/nx,iy/ny;sx,sy=x+u*w,y+v*h;coords.append([sx,sy]);uv +=[u,v];ws=[(b,wt)for b,wt in weights(n.replace('_NoHand',''),sx,sy) if wt>1e-7];vs.append(len(ws))
    for b,wt in ws:
     bx,by=world[b];vs +=[boneindex[b],sx-256-bx,594-sy-by,wt]
  for iy in range(ny):
   for ix in range(nx):
    q=iy*(nx+1)+ix;tri +=[q,q+nx+1,q+1,q+1,q+nx+1,q+nx+2]
  skin[slot][n]={'type':'mesh','path':n,'uvs':uv,'triangles':tri,'vertices':vs,'hull':0,'width':w,'height':h};
  if not n.endswith('_NoHand'):geometry[n]={'sourceVertices':coords,'triangles':tri,'weights':[weights(n,*p)for p in coords]}
 else:
  bx,by=anchors[assign[slot]];skin[slot][n]={'x':x+w/2-bx,'y':by-y-h/2,'width':w,'height':h}
rig['skins']=[{'name':'default','attachments':skin}];rig['animations']={};rig['skeleton']['images']='parts/'
(OUT/'Sparky_Joint_Fit.json').write_text(json.dumps(rig,separators=(',',':')))
(OUT/'geometry.json').write_text(json.dumps(geometry,separators=(',',':')))
(OUT/'registration.json').write_text(json.dumps({'source':str(SRC.relative_to(ROOT)),'anchors':anchors,'rects':rects,'packed':packed,'orphanPixelsReassigned':orphans,'hiddenOverlapPixels':overlaps,'parts':len(images),'meshes':4,'nativeBonesReusedAsDrivers':['T_shirt','Neck','Face','Hand_L3','Hand_L4','Palm_R','Hand_L5','Hand_L6','Palm_R2','Leg_R','Leg_R2','Foots/Foot_R','Leg_R3','Leg_R4','Foots/Foot_R2'],'note':'Separate source-sized FK rendering profile driven by existing controls. Not a replacement binary or final animation bake.'},indent=2))
print('Built',len(images),'parts, 4 continuous weighted limb meshes;',orphans,'stray pixels reassigned.')
