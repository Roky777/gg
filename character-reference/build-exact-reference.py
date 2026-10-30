"""Register original reference pixels; no generative redraw or silhouette rescaling."""
from pathlib import Path
import json, shutil, math
ROOT=Path(__file__).resolve().parents[2]
SRC=ROOT/'animation/sparky/godot-parts'
OUT=Path(__file__).resolve().parent/'exact'
OUT.mkdir(exist_ok=True)
j=json.loads((SRC/'Sparky_Parts.json').read_text())
parts={p['name']:p for p in json.loads((SRC/'parts-manifest.json').read_text())['parts']}
# All source coordinates share one registration. Each overlap uses the same
# weight field, including the small painted caps hidden under its neighbour.
positions={}
for b in j['bones']:
 p=positions.get(b.get('parent'),(0,0));positions[b['name']]=(p[0]+b.get('x',0),p[1]+b.get('y',0))
indices={b['name']:i for i,b in enumerate(j['bones'])}
slots={s['name']:s for s in j['slots']}
def weights(name,x,y):
 side='L' if name.endswith('_L') else 'R'
 if name.startswith(('Sleeve_','Upper_Arm_','Forearm_','Glove_')):
  # Skinning transition lies inside the elbow overlap, never on the silhouette.
  t=max(0,min(1,(y-449)/12));t=t*t*(3-2*t)
  if name.startswith('Glove_'):return [('hand_'+side,1)]
  return [('shoulder_'+side,1-t),('forearm_'+side,t)]
 if name.startswith(('Thigh_','Shin_')):
  t=max(0,min(1,(y-518)/10));t=t*t*(3-2*t)
  return [('thigh_'+side,1-t),('shin_'+side,t)]
 return [(slots[name]['bone'],1)]
for slot,attachments in j['skins'][0]['attachments'].items():
 for name,a in attachments.items():
  p=parts[name];sx,sy,w,h=p['source_rect'];nx=max(1,math.ceil(w/6));ny=max(1,math.ceil(h/6))
  uv=[];vertices=[];tri=[]
  for iy in range(ny+1):
   for ix in range(nx+1):
    u,v=ix/nx,iy/ny;x,y=sx+u*w,sy+v*h;uv += [u,v]
    ws=[(b,wt) for b,wt in weights(slot,x,y) if wt>1e-8];vertices.append(len(ws))
    for bone,wt in ws:
     bx,by=positions[bone];vertices += [indices[bone],x-256-bx,594-y-by,wt]
  for iy in range(ny):
   for ix in range(nx):
    q=iy*(nx+1)+ix;tri += [q,q+nx+1,q+1,q+1,q+nx+1,q+nx+2]
  attachments[name]={'type':'mesh','path':name,'uvs':uv,'triangles':tri,'vertices':vertices,'hull':0,'width':w,'height':h}
(OUT/'Sparky_Reference.json').write_text(json.dumps(j,separators=(',',':')))
shutil.copy2(SRC/'Sparky_Parts.atlas',OUT/'Sparky_Parts.atlas')
shutil.copy2(SRC/'Sparky_Parts.png',OUT/'Sparky_Parts.png')
(OUT/'registration.json').write_text(json.dumps({'source':'animation/sparky/godot-parts','uniformScale':3.55,'sourceOrigin':[256,594],'sourcePixelHeight':403,'parts':len(parts),'externalAlpha':'unaltered source alpha','jointWeights':'shared elbow and knee fields'},indent=2))
print('Built exact source atlas and weighted reference rig:',OUT)
