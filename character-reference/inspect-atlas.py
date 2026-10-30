from pathlib import Path
from PIL import Image,ImageDraw
import re,json
P=Path(__file__).resolve().parent;A=P.parent/'sparky-animations 4/assets';name='Lucas_Activity_Icecream';regions={};n=None
for line in (A/(name+'.atlas')).read_text().splitlines()[5:]:
 if ':' not in line:n=line;regions[n]={'name':n}
 elif n:
  k,v=line.split(':',1);regions[n][k]=[int(x) for x in v.split(',')] if k in ['bounds','offsets'] else v
im=Image.open(A/(name+'.png')).convert('RGBA');names=['Face','Eyepart_R','Eyeball_R','Eyebrow_R','Lips/Normal_Smile','Nose','T_shirt_2','Hand_R','Leg_R','Foots/Foot_L','Palms/Palm_R']
can=Image.new('RGBA',(1200,((len(names)+3)//4)*330),(40,45,50,255));d=ImageDraw.Draw(can)
for i,n in enumerate(names):
 r=regions[n];x,y,w,h=r['bounds'];rot=r.get('rotate')=='90';v=im.crop((x,y,x+(h if rot else w),y+(w if rot else h))).rotate(-90 if rot else 0,expand=True);v.save(P/'source'/('current-'+n.replace('/','_')+'.png'));v.thumbnail((270,280));cx=i%4*300;cy=i//4*330;can.alpha_composite(v,(cx+(300-v.width)//2,cy+30));d.text((cx+5,cy+5),n,fill='white');print(n,r)
can.convert('RGB').save(P/'source/current-parts.jpg');(P/'source/regions.json').write_text(json.dumps(regions,indent=2))
