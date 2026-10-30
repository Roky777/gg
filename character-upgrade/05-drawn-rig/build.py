"""Pack purpose-drawn source tiles and register meshes. No source-character cuts."""
from pathlib import Path
import json,math
import numpy as np
from PIL import Image
O=Path(__file__).resolve().parent;S=O.parent/'04-drawn-parts';(O/'parts').mkdir(exist_ok=True)
# Crop separated generated atlas cells only; retain original generated PNGs.
parts={};rects={};origins={}
def take(name,file,row,col,rows,cols,rect,rotate=0):
 im=Image.open(S/file).convert('RGBA');w,h=im.size
 bands={'01-body.png':[(0,435),(435,700),(700,975),(975,1254)],'02-arms-join-v2.png':[(0,325),(330,577),(578,920),(920,1268)],'03-hands-a.png':[(0,420),(420,797),(797,1199)],'03-hands-b.png':[(0,420),(420,840),(840,h)],'04-legs-shoes.png':[(0,345),(345,730),(730,1120),(1120,1536)],'06-eyes-features.png':[(0,335),(335,580),(580,855),(855,1120),(1120,1300),(1300,1536)],'07-mouths.png':[(0,300),(300,530),(530,800),(800,980),(980,h)]}
 top,bottom=bands.get(file,[(round(i*h/rows),round((i+1)*h/rows))for i in range(rows)])[row]
 cell=im.crop((round(col*w/cols),top,round((col+1)*w/cols),bottom))
 a=np.array(cell)[:,:,3];ys,xs=np.where(a>16);assert len(xs),name
 box=(max(0,int(xs.min())-2),max(0,int(ys.min())-2),min(cell.width,int(xs.max())+3),min(cell.height,int(ys.max())+3));tile=cell.crop(box)
 if name=='Neck':tile=tile.crop((round(tile.width*.22),0,round(tile.width*.78),round(tile.height*.62)))
 if rotate:tile=tile.rotate(rotate,resample=Image.Resampling.BICUBIC,expand=True)
 tile.save(O/'parts'/f'{name}.png');parts[name]=tile;rects[name]=rect;origins[name]={'sheet':file,'cell':[row,col,rows,cols],'nativePixels':list(tile.size),'rotation':rotate,'cropOrigin':[round(col*w/cols)+box[0],top+box[1]]}
# Registration is a fixed model sheet in source units, with feet at y594.
take('Head','05-head.png',0,0,1,1,[138,191,236,211])
take('Torso','01-body.png',0,0,4,2,[211,403,91,78])
take('Neck','01-body.png',3,0,4,2,[240,397,34,19])
take('Shorts','01-body.png',1,0,4,2,[206,471,103,48])
for side,col in [('L',0),('R',1)]:
 left=side=='L'
 take('Upper_'+side,'02-arms-join-v2.png',0,col,4,2,[190 if left else 287,410,43,51])
 # Opposite generated forearm has the correct neutral descending direction.
 take('Lower_'+side,'02-arms-join-v2.png',1,1-col,4,2,[182 if left else 299,440,32,40])
 take('Hand_'+side,'03-hands-a.png',0,col,3,2,[166 if left else 299,461,51,58])
 take('Clap_'+side,'03-hands-a.png',1,col,3,2,[168 if left else 301,453,46,55])
 take('Thumb_'+side,'03-hands-a.png',2,col,3,2,[166 if left else 298,457,51,55],rotate=90 if left else -90)
 take('Wave_'+side,'03-hands-b.png',1,col,3,2,[163 if left else 297,453,56,60],rotate=-70 if left else 70)
 take('Point_'+side,'03-hands-b.png',0,col,3,2,[161 if left else 294,459,62,43])
 take('Fist_'+side,'03-hands-b.png',2,col,3,2,[169 if left else 301,463,46,46])
 take('Thigh_'+side,'04-legs-shoes.png',0,col,4,2,[213 if left else 266,499,33,35])
 take('Shin_'+side,'04-legs-shoes.png',1,col,4,2,[210 if left else 269,516,37,37])
 take('Shoe_'+side,'04-legs-shoes.png',2,col,4,2,[175 if left else 257,535,80,59])
 take('EyeWhite_'+side,'06-eyes-features.png',0,col,6,2,[192 if left else 275,323,50,46])
 take('Iris_'+side,'06-eyes-features.png',1,col,6,2,[206 if left else 289,331,30,37])
 take('EyeHalf_'+side,'06-eyes-features.png',2,col,6,2,[192 if left else 275,323,50,46])
 take('EyeClosed_'+side,'06-eyes-features.png',3,col,6,2,[192 if left else 275,327,50,38])
 take('Brow_'+side,'06-eyes-features.png',4,col,6,2,[202 if left else 283,307,32,12])
take('Nose','06-eyes-features.png',5,0,6,2,[249,357,19,12])
for i,name in enumerate(['Smile','Happy','Teeth','Talk','A','O','U','FV','Sad','Laugh']):take('Mouth_'+name,'07-mouths.png',i//2,i%2,5,2,[238 if name not in ['A','O','U'] else 248,372 if name not in ['A','O','U'] else 368,41 if name not in ['A','O','U'] else 20,12 if name=='Smile' else 20 if name in ['Sad','Teeth','FV'] else 28])
# Bone chains keep forearm pivots inside the gold overlap. Names map to legacy driver.
A={'root':[256,594],'pelvis':[256,498],'torso':[256,472],'neck':[256,408],'head':[256,402]};B=[('root',None),('pelvis','root'),('torso','pelvis'),('neck','torso'),('head','neck')]
for s in ['L','R']:
 l=s=='L';a={'shoulder':[214 if l else 299,425],'upper_arm':[214 if l else 299,425],'forearm':[202 if l else 311,448],'hand':[192 if l else 321,470],'thigh':[229 if l else 282,505],'shin':[228 if l else 284,522],'foot':[224 if l else 288,539]}
 for n,parent in [('shoulder','torso'),('upper_arm','shoulder_'+s),('forearm','upper_arm_'+s),('hand','forearm_'+s),('thigh','pelvis'),('shin','thigh_'+s),('foot','shin_'+s)]:A[n+'_'+s]=a[n];B.append((n+'_'+s,parent))
for n,xy in [('brow_L',[218,314]),('brow_R',[299,314]),('eye_L',[218,349]),('eye_R',[299,349]),('nose',[258,363]),('mouth',[259,376])]:A[n]=xy;B.append((n,'head'))
bones=[]
for n,p in B:
 x,y=A[n];px,py=A.get(p,[256,594]);bones.append({'name':n,**({'parent':p}if p else {}),'x':x-px,'y':py-y})
idx={b['name']:i for i,b in enumerate(bones)}
# One explicit draw order: limbs behind torso/shorts; hands in front of clothing.
slots=[];skin={};geom={}
def smooth(a,b,t):t=max(0,min(1,(t-a)/(b-a)));return t*t*(3-2*t)
def add(slot,bone,names,mesh=False,kind=None):
 slots.append({'name':slot,'bone':bone,'attachment':names[0]});skin[slot]={}
 for name in names:
  x,y,w,h=rects[name]
  if not mesh:
   bx,by=A[bone];skin[slot][name]={'path':name,'x':x+w/2-bx,'y':by-y-h/2,'width':w,'height':h};continue
  nx,ny=math.ceil(w/4),math.ceil(h/3);uv=[];vertices=[];tri=[];coords=[];influences=[];s=slot[-1]
  for iy in range(ny+1):
   for ix in range(nx+1):
    u,v=ix/nx,iy/ny;px,py=x+u*w,y+v*h
    if kind in ['upper','lower']:
     origin=origins[name];cx,cy=origin['cropOrigin'];iw,ih=origin['nativePixels'];sx,sy=cx+u*iw,cy+v*ih
     if kind=='upper':
      srcA,srcB=([420,70],[280,265])if s=='L' else([820,70],[960,265]);dstA=A['upper_arm_'+s];dstB=A['forearm_'+s]
     else:
      srcA,srcB=([950,380],[790,530])if s=='L' else([280,380],[455,530]);dstA=A['forearm_'+s];dstB=A['hand_'+s]
     vx,vy=srcB[0]-srcA[0],srcB[1]-srcA[1];wx,wy=dstB[0]-dstA[0],dstB[1]-dstA[1];den=vx*vx+vy*vy;aa=(wx*vx+wy*vy)/den;bb=(wy*vx-wx*vy)/den
     px=dstA[0]+aa*(sx-srcA[0])-bb*(sy-srcA[1]);py=dstA[1]+bb*(sx-srcA[0])+aa*(sy-srcA[1])
    uv +=[u,v];coords.append([px,py])
    if kind=='upper':ws=[('upper_arm_'+s,1)]
    elif kind=='lower':t=smooth(445,450,py);ws=[('upper_arm_'+s,1-t),('forearm_'+s,t)]
    elif kind=='thigh':t=smooth(518,526,py);ws=[('thigh_'+s,1-t),('shin_'+s,t)]
    else:t=smooth(536,544,py);ws=[('shin_'+s,1-t),('foot_'+s,t)]
    ws=[(b,wt)for b,wt in ws if wt>1e-7];influences.append(ws);vertices.append(len(ws))
    for b,wt in ws:bx,by=A[b];vertices +=[idx[b],px-bx,by-py,wt]
  for iy in range(ny):
   for ix in range(nx):q=iy*(nx+1)+ix;tri +=[q,q+nx+1,q+1,q+1,q+nx+1,q+nx+2]
  skin[slot][name]={'type':'mesh','path':name,'uvs':uv,'triangles':tri,'vertices':vertices,'hull':0,'width':w,'height':h};geom[slot]={'sourceVertices':coords,'triangles':tri,'weights':influences}
for s in ['L','R']:
 add('Shoe_'+s,'foot_'+s,['Shoe_'+s]);add('Shin_'+s,'shin_'+s,['Shin_'+s],True,'shin');add('Thigh_'+s,'thigh_'+s,['Thigh_'+s],True,'thigh')
add('Shorts','pelvis',['Shorts'])
add('Torso','torso',['Torso'])
for s in ['L','R']:add('Upper_'+s,'upper_arm_'+s,['Upper_'+s],True,'upper');add('Lower_'+s,'forearm_'+s,['Lower_'+s],True,'lower')
add('Neck','neck',['Neck']);add('Head','head',['Head'])
for s in ['L','R']:
 add('EyeWhite_'+s,'eye_'+s,['EyeWhite_'+s,'EyeHalf_'+s,'EyeClosed_'+s]);add('Iris_'+s,'eye_'+s,['Iris_'+s]);add('Brow_'+s,'brow_'+s,['Brow_'+s])
add('Nose','nose',['Nose']);add('Mouth','mouth',['Mouth_'+n for n in ['Smile','Happy','Teeth','Talk','A','O','U','FV','Sad','Laugh']])
for s in ['L','R']:add('Hand_'+s,'hand_'+s,[n+'_'+s for n in ['Hand','Clap','Thumb','Wave','Point','Fist']])
# Native generated pixels are packed intact; dimensions in attachment geometry
# register their intended model size independently from atlas pixel resolution.
size=4096;atlas=Image.new('RGBA',(size,size));text=f'Sparky_Drawn.png\nsize:{size},{size}\nfilter:Linear,Linear\npma:false\n';px=4;py=4;rh=0;packed={}
for n,im in parts.items():
 w,h=im.size
 if px+w+4>size:px=4;py+=rh+8;rh=0
 assert py+h+4<=size,(n,py,h)
 atlas.paste(im,(px,py));packed[n]=[px,py,w,h]
 for d in (1,2):
  atlas.paste(im.crop((0,0,w,1)),(px,py-d));atlas.paste(im.crop((0,h-1,w,h)),(px,py+h+d-1));atlas.paste(im.crop((0,0,1,h)),(px-d,py));atlas.paste(im.crop((w-1,0,w,h)),(px+w+d-1,py))
 text+=f'{n}\nbounds:{px},{py},{w},{h}\n';px+=w+8;rh=max(rh,h)
atlas.save(O/'Sparky_Drawn.png');(O/'Sparky_Drawn.atlas').write_text(text)
rig={'skeleton':{'spine':'4.2.36','x':-118,'y':0,'width':236,'height':403,'images':'parts/'},'bones':bones,'slots':slots,'skins':[{'name':'default','attachments':skin}],'animations':{}}
(O/'Sparky_Drawn.json').write_text(json.dumps(rig,separators=(',',':')));(O/'geometry.json').write_text(json.dumps(geom,separators=(',',':')));(O/'registration.json').write_text(json.dumps({'anchors':A,'rects':rects,'origins':origins,'packed':packed,'meshes':len(geom),'parts':len(parts)},indent=2))
print('Packed',len(parts),'newly drawn regions;',len(geom),'weighted meshes;',len(bones),'bones. Used atlas height',py+rh)
