"""Trace actual changed artwork into unfilled SVG paths (never bounding ovals).
Both photos share the change silhouette, including the location of removed items.
Re-run after packaging new story photos; original illustrations stay untouched.
"""
import json
from collections import defaultdict
from pathlib import Path
import numpy as np
from PIL import Image,ImageFilter,ImageDraw
ROOT=Path(__file__).resolve().parents[1]; ART=ROOT/'assets/art'; OUT=ART/'differences'
m=json.loads((OUT/'manifest.json').read_text()); W,H=450,600
overrides=json.loads((OUT/'outline-overrides.json').read_text()) if (OUT/'outline-overrides.json').exists() else {}

def hull(points):
 points=sorted(set(points))
 def cross(o,a,b):return (a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0])
 def half(seq):
  out=[]
  for p in seq:
   while len(out)>1 and cross(out[-2],out[-1],p)<=0:out.pop()
   out.append(p)
  return out
 return half(points)[:-1]+half(reversed(points))[:-1]

def contours(mask):
 a=np.array(mask)>0; edges=defaultdict(list)
 for y,x in zip(*np.where(a)):
  if y==0 or not a[y-1,x]: edges[(int(x),int(y))].append((int(x+1),int(y)))
  if x==W-1 or not a[y,x+1]:edges[(int(x+1),int(y))].append((int(x+1),int(y+1)))
  if y==H-1 or not a[y+1,x]:edges[(int(x+1),int(y+1))].append((int(x),int(y+1)))
  if x==0 or not a[y,x-1]:edges[(int(x),int(y+1))].append((int(x),int(y)))
 loops=[]
 while edges:
  start=next(iter(edges));p=start;loop=[]
  while True:
   loop.append(p);q=edges[p].pop()
   if not edges[p]:del edges[p]
   p=q
   if p==start:break
   if p not in edges:break
  area=sum(loop[i][0]*loop[(i+1)%len(loop)][1]-loop[(i+1)%len(loop)][0]*loop[i][1] for i in range(len(loop)))/2
  if area>50:loops.append((area,loop)) # clockwise outer contours; ignore interior texture holes
 return [loop for area,loop in loops if area>max(60,max([a for a,_ in loops],default=0)*.035)]

def belongs_to(loop,region,regions):
 # Expanded trace windows may overlap. A contour belongs to the target whose
 # original reviewed box contains most of its points, then the nearest center.
 def score(r):
  b=r['sides'][0]['bounds'];x,y,w,h=[b[k] for k in ['x','y','w','h']]
  fraction=sum(x<=px/W<=x+w and y<=py/H<=y+h for px,py in loop)/len(loop)
  cx=sum(px/W for px,py in loop)/len(loop);cy=sum(py/H for px,py in loop)/len(loop)
  distance=(cx-x-w/2)**2+(cy-y-h/2)**2
  return fraction,distance
 own,dist=score(region)
 for r in regions:
  if r['id']==region['id']:continue
  other,otherdist=score(r)
  if other>own+.15 or (other>.8 and own>.8 and otherdist<dist*.65):return False
 return True

reviews=[]
for b in m['boards']:
 ims=[Image.open(ART/p).convert('RGB').resize((W,H)) for p in b['images']]
 a,c=[np.array(im).astype(float) for im in ims]; delta=np.max(np.abs(a-c),axis=2)
 overlay=ims[0].copy();draw=ImageDraw.Draw(overlay)
 for region in b['regions']:
  bounds=region['sides'][0]['bounds'];x,y,w,h=[bounds[k] for k in ['x','y','w','h']]
  roi=np.zeros((H,W),dtype=bool);roi[max(0,int((y-.055)*H)):min(H,int((y+h+.055)*H)),max(0,int((x-.055)*W)):min(W,int((x+w+.055)*W))]=True
  # Suppress ordinary paint noise, close small holes, keep only substantive edges.
  mask=Image.fromarray(np.uint8((delta>48)&roi)*255)
  mask=mask.filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.MinFilter(7)).filter(ImageFilter.MedianFilter(5))
  paths=[loop for loop in contours(mask) if belongs_to(loop,region,b['regions'])]
  if 'ball' in region['sides'][0]['name'].lower() and paths:paths=[hull([p for loop in paths for p in loop])]
  if not paths:raise ValueError((b['id'],region['id'],'No actual change found'))
  d=[]
  for loop in paths:
   # Thin collinear contour vertices while preserving each traced silhouette.
   keep=[p for i,p in enumerate(loop) if (p[0]-loop[i-1][0],p[1]-loop[i-1][1])!=(loop[(i+1)%len(loop)][0]-p[0],loop[(i+1)%len(loop)][1]-p[1])]
   d.append('M'+' L'.join(f'{px*2},{py*2}' for px,py in keep)+' Z')
   draw.line(loop+[loop[0]],fill='#ffcb32',width=2)
  for side in region['sides']:side['outline']=overrides.get(b['id'],{}).get(str(region['id']),' '.join(d))
 reviews.append((b['name'],overlay))
(OUT/'outlines.json').write_text(json.dumps({b['id']:[r['sides'][0]['outline'] for r in b['regions']] for b in m['boards']},indent=2)+'\n')
for name in ['manifest.json','manifest-candidate.json']:(OUT/name).write_text(json.dumps(m,indent=2)+'\n')
review=Path('/tmp/sparky-difference-outlines');review.mkdir(parents=True,exist_ok=True)
for page in range(5):
 sheet=Image.new('RGB',(1200,860),'#fff9eb');d=ImageDraw.Draw(sheet)
 for i,(name,im) in enumerate(reviews[page*4:page*4+4]):
  im.thumbnail((285,800));sheet.paste(im,(i*300,30));d.text((i*300+5,8),name,fill='#285969')
 sheet.save(review/f'outlines-{page+1}.jpg',quality=92)
print('Traced 60 change silhouettes, paired on all 40 photos.')
