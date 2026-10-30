"""Package full imagegen story illustrations and their visually reviewed targets.
No shelf composites: every A/B picture is a complete native illustration.
Only resizing and PNG packaging happen here; illustration pixels are not painted.
"""
import json,sys
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'assets/art/differences';SOURCE=OUT/'scenes'
outlines=json.loads((OUT/'outlines.json').read_text()) if (OUT/'outlines.json').exists() else {}
plans=json.loads((OUT/'story-plans.json').read_text());regions=json.loads((OUT/'regions.json').read_text());boards=[];missing=[]
def box(values):
 x,y,w,h=values;assert x>=0 and y>=0 and w>0 and h>0 and x+w<=1.00001 and y+h<=1.00001
 return {'x':x,'y':y,'w':w,'h':h}
def padded(values):
 x,y,w,h=values;x1=max(0,x-.012);y1=max(0,y-.009);x2=min(1,x+w+.012);y2=min(1,y+h+.009)
 return box([x1,y1,x2-x1,y2-y1])
for plan in plans:
 id=plan['id'];paths=[SOURCE/(id+'-'+side+'.png') for side in ['a','b']]
 if not all(p.exists() for p in paths):missing.append(id);continue
 assert len(plan['targets'])==3 and len(regions[id])==3
 for path,side in zip(paths,['a','b']):
  im=Image.open(path).convert('RGB');assert im.width>=900 and im.height>=1100
  assert abs(im.width/im.height-.75)<.04,(id,im.size)
  im=im.resize((900,1200),Image.Resampling.LANCZOS);im.save(OUT/(id+'-'+side+'.png'),optimize=True)
 targets=[]
 for i,values in enumerate(regions[id]):
  hit=padded(values)
  if id=='camping' and i==1:hit=box([0,.22,.28,.44])
  if id=='station' and i==2:hit=box([.71,.12,.29,.45])
  sides=[{'name':plan['targets'][i],'bounds':box(values),'hit':hit.copy()} for _ in range(2)]
  if id in outlines:
   for side in sides:side['outline']=outlines[id][i]
  if id=='station' and i==2:
   for side in sides:side['extraHits']=[box([0,.24,.24,.30])]
  targets.append({'id':i,'changed':True,'sides':sides})
 boards.append({'id':id,'name':plan['name'],'images':[f'differences/{id}-a.png',f'differences/{id}-b.png'],'regions':targets,'changed':[0,1,2]})
# Full pair sheets, four pairs per page, for visual review of all forty pictures.
review=ROOT/'output/differences-review';review.mkdir(exist_ok=True)
for page in range((len(boards)+3)//4):
 sheet=Image.new('RGB',(1200,1760),'#fff9eb');draw=ImageDraw.Draw(sheet)
 for row,board in enumerate(boards[page*4:page*4+4]):
  for side in range(2):
   im=Image.open(ROOT/'assets/art'/board['images'][side]);im.thumbnail((300,400));sheet.paste(im,(side*315,row*440+15))
  draw.text((650,row*440+30),board['name'],fill='#285969')
  for index,target in enumerate(board['regions']):draw.text((650,row*440+75+index*45),target['sides'][0]['name'],fill='#285969')
 sheet.save(review/f'page-{page+1}.jpg',quality=94)
(OUT/'validation.json').write_text(json.dumps({'count':len(boards),'photos':len(boards)*2,'missing':missing,'targetsPerBoard':3,'nativeStoryIllustrations':True},indent=2))
if missing:print('Waiting for matching illustrations: '+', '.join(missing))
else:
 assert len(boards)==20
 destination=OUT/('manifest.json' if '--publish' in sys.argv else 'manifest-candidate.json');destination.write_text(json.dumps({'ready':True,'boards':boards},indent=2));print('READY FOR REVIEW: twenty storybook pairs, forty 900 × 1200 PNG photos. '+str(destination))
print(f'Packaged {len(boards)} / 20 story pairs.')
