"""Pack native generated PNG objects into whole learning cards; no sliced pictures."""
from pathlib import Path
from PIL import Image,ImageDraw
import json,sys
sys.path.insert(0,'/private/tmp/sparky-motion-deps')
import cv2,numpy as np
ROOT=Path(__file__).resolve().parents[1];SOURCE=ROOT/'assets/art/source/learning-png';OUT=ROOT/'assets/art/ordering-png';OUT.mkdir(exist_ok=True);OBJECTS=SOURCE/'objects';OBJECTS.mkdir(exist_ok=True)
words=['apple','balloon','carrot','duck','egg','fish','grapes','house','ice cream','jellyfish','kite','leaf','moon','nest','orange','pear','quilt','rainbow','sun','tree','umbrella','van','watermelon','xylophone','yarn','zebra','basket']
objects={}
for group,start in [('a-i',0),('j-r',9),('s-z',18)]:
 board=Image.open(SOURCE/(group+'.png')).convert('RGBA')
 for i in range(9):
  cell=board.crop((round(i%3*board.width/3),round(i//3*board.height/3),round((i%3+1)*board.width/3),round((i//3+1)*board.height/3)))
  alpha=np.array(cell.getchannel('A'));n,labels,stats,_=cv2.connectedComponentsWithStats((alpha>40).astype('uint8'));areas=stats[1:,cv2.CC_STAT_AREA];assert len(areas)>0
  largest=int(np.argmax(areas))+1
  keep=[]
  for label in range(1,n):
   x,y,w,h,area=stats[label];touches_cell_edge=x<3 or y<3 or x+w>=cell.width-3 or y+h>=cell.height-3
   if label==largest or (area>max(20,areas.max()*.008) and not touches_cell_edge):keep.append(label)
  mask=np.isin(labels,keep);ys,xs=np.where(mask);box=(max(0,xs.min()-2),max(0,ys.min()-2),min(cell.width,xs.max()+3),min(cell.height,ys.max()+3));cell=cell.crop(box)
  # Preserve generated alpha, removing only isolated tiny sheet speckles.
  v=np.array(cell);v[:,:,3]*=mask[box[1]:box[3],box[0]:box[2]].astype('uint8');cell=Image.fromarray(v);word=words[start+i];objects[word]=cell;cell.save(OBJECTS/(word.replace(' ','-')+'.png'))
# Independently redrawn replacements for grid objects whose own silhouettes crossed a cell boundary.
for word in ['kite','quilt','van','ice cream']:
 replacement=SOURCE/'single'/(word.replace(' ','-')+'.png')
 if not replacement.exists():continue
 im=Image.open(replacement).convert('RGBA');v=np.array(im);n,labels,stats,_=cv2.connectedComponentsWithStats((v[:,:,3]>40).astype('uint8'));areas=stats[1:,cv2.CC_STAT_AREA];largest=int(np.argmax(areas))+1;keep=[i for i in range(1,n) if i==largest or (stats[i,4]>max(20,areas.max()*.008) and stats[i,0]>2 and stats[i,1]>2 and stats[i,0]+stats[i,2]<im.width-2 and stats[i,1]+stats[i,3]<im.height-2)];mask=np.isin(labels,keep);v[:,:,3]*=mask.astype('uint8');ys,xs=np.where(mask);box=(max(0,xs.min()-3),max(0,ys.min()-3),min(im.width,xs.max()+4),min(im.height,ys.max()+4));im=Image.fromarray(v).crop(box);objects[word]=im;im.save(OBJECTS/(word.replace(' ','-')+'.png'))
# Explicit transparent export padding keeps resampling away from image boundaries.
for word,obj in list(objects.items()):
 padded=Image.new('RGBA',(obj.width+16,obj.height+16));padded.alpha_composite(obj,(8,8));objects[word]=padded;padded.save(OBJECTS/(word.replace(' ','-')+'.png'))
def blank():return Image.new('RGBA',(600,1140),(252,251,239,255))
def paste(im,obj,box):
 image=obj.copy();image.thumbnail((box[2]-box[0],box[3]-box[1]),Image.Resampling.LANCZOS);x=round((box[0]+box[2]-image.width)/2);y=round((box[1]+box[3]-image.height)/2);im.alpha_composite(image,(x,y))
def apple_group(im,n,box,cols=2):
 if not n:return
 rows=(n+cols-1)//cols;cw=(box[2]-box[0])/cols;ch=(box[3]-box[1])/rows;size=min(cw*.86,ch*.87,160)
 for j in range(n):
  col=j%cols;row=j//cols;cx=box[0]+(col+.5)*cw;cy=box[1]+(row+.5)*ch
  if n%cols and row==rows-1:cx=box[0]+(col+(cols-n%cols)/2+.5)*cw
  paste(im,objects['apple'],(int(cx-size/2),int(cy-size/2),int(cx+size/2),int(cy+size/2)))
def save(name,im):im.convert('RGB').save(OUT/(name+'.png'),optimize=True)
for word in words[:26]:
 im=blank();paste(im,objects[word],(50,345,550,925));save('object-'+word.replace(' ','-'),im)
for n in range(11):
 im=blank();d=ImageDraw.Draw(im);d.rounded_rectangle((46,155,554,982),radius=70,fill='#e3eddd',outline='#c1d8bf',width=3)
 if n:apple_group(im,n,(70,205,530,945),2)
 else:paste(im,objects['basket'],(130,390,470,720))
 save('count-'+str(n),im)
pics=[p for p in json.loads((ROOT/'learning-pictures.json').read_text()) if p['topic'] in ['letters','numbers']]
for p in pics:
 if p['topic'] not in ['add','subtract']:continue
 for card in p['cards']:
  a,b=card['a'],card['b'];im=blank();d=ImageDraw.Draw(im);sub=p['topic']=='subtract';result=card['value'];d.rounded_rectangle((40,135,560,660),radius=60,fill='#e3eddd',outline='#bfd2b7',width=3)
  apple_group(im,result if sub else a,(65,170,535,620),3)
  if sub:
   # A hand-carried basket visually marks the apples removed from the main mat.
   paste(im,objects['basket'],(65,735,535,1040));apple_group(im,b,(135,700,465,900),min(4,b))
   d=ImageDraw.Draw(im);d.rounded_rectangle((515,872,598,950),radius=30,fill='#fff8eb',outline='#617873',width=4);d.ellipse((503,876,548,930),fill='#fff8eb',outline='#617873',width=3)
  else:
   d.rounded_rectangle((40,705,560,1020),radius=52,fill='#f3e7cb',outline='#decc9f',width=3);apple_group(im,b,(70,730,530,990),3)
  save(Path(card['image']).stem,im)
for p in pics:
 for c in p['cards']:c['image']='ordering-png/'+Path(c['image']).stem+'.png'
 for c in p['cards']:
  if p['topic']=='letters':c['say']=c['label']+'. '+c['value']+' is for '+c['label']+'.'
 p['intro']={'letters':'Put the letters in alphabet order. Tap a picture to hear its name.','numbers':'Count the apples. Put the fewest first.','add':'Count both mats in each picture. Put the smallest total first.','subtract':'The basket holds apples taken away. Count what is left on the green mat. Put the fewest first.'}[p['topic']]

(ROOT/'learning-pictures.json').write_text(json.dumps(pics,indent=2)+'\n');model=ROOT/'model.js';s=model.read_text();model.write_text('export const PICTURES='+json.dumps(pics,indent=2)+';\n'+s[s.index('export const solved='):]);print('Packed generated PNG object cards and count/maths mats; all live cards use PNG.')
