"""Picture-only semantic sorting cards. Each card is a whole asset, never a crop."""
from pathlib import Path
import json,runpy
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'assets/art/ordering';OUT.mkdir(exist_ok=True)
# Reuse the deterministic native illustration vocabulary, without the old card writer.
ns={'__file__':str(ROOT/'tools/build-learning-pictures.py')};source=(ROOT/'tools/build-learning-pictures.py').read_text();exec(source[:source.index('words=list(icons)')],ns)
icons=ns['icons'];apple=ns['apple'];path=ns['path'];circle=ns['circle'];words=list(icons)
def shell(body):return '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="760" viewBox="0 0 400 760"><rect width="400" height="760" fill="#fcfbef"/><ellipse cx="200" cy="662" rx="164" ry="20" fill="#d5e8db" opacity=".6"/>'+body+'</svg>'
def save(name,body):f=OUT/(name+'.svg');f.write_text(shell(body));return 'ordering/'+f.name
def apples(n,y=195,scale=.49):
 # Stable two-column arrangement with a centre item on odd last rows.
 s='';rows=(n+1)//2
 for j in range(n):
  col=j%2;row=j//2;xx=98+col*114 if not(n%2 and j==n-1) else 155
  yy=y+row*95;s+=f'<g transform="translate({xx} {yy}) scale({scale})">{apple}</g>'
 return s
for i,w in enumerate(words):save('object-'+w.replace(' ','-'),circle(200,374,153,'#e4efe3')+f'<g transform="translate(60 225) scale(1.4)">{icons[w]}</g>')
for n in range(0,11):
 body='<rect x="42" y="91" width="316" height="566" rx="57" fill="#e4efdf" stroke="#a9c6b5" stroke-width="4"/>'
 if n:body+=apples(n,137+(5-(n+1)//2)*40)
 else:body+='<ellipse cx="200" cy="408" rx="105" ry="43" fill="#cce0cf"/>'
 save(f'count-{n}',body)
def mathcard(a,b,subtract):
 result=a-b if subtract else a+b
 body='<rect x="36" y="76" width="328" height="385" rx="45" fill="#e0eddd" stroke="#a2c1ae" stroke-width="4"/>'
 if subtract:
  # Remaining apples on main mat. Removed apples sit in a carried small basket.
  for j in range(result):body+=f'<g transform="translate({76+(j%3)*90} {120+(j//3)*100}) scale(.40)">{apple}</g>'
  body+='<ellipse cx="200" cy="580" rx="130" ry="75" fill="#e8e4d5"/>'
  for j in range(b):body+=f'<g transform="translate({78+(j%4)*66} {510+(j//4)*65}) scale(.30)">{apple}</g>'
  body+=path('M65 568Q199 624 335 568L315 635Q198 685 84 635Z','#d3b78b','#6c7b71',4)
  body+=path('M331 609Q367 579 379 598L372 638Q353 655 326 642Z','#fff9ed','#6c7b71',4)
 else:
  for j in range(a):body+=f'<g transform="translate({76+(j%3)*90} {120+(j//3)*100}) scale(.40)">{apple}</g>'
  # A second mat is an additional group, not an ordering step or cropped panel.
  body+='<rect x="36" y="484" width="328" height="176" rx="37" fill="#f4e7ca" stroke="#d3bc8e" stroke-width="4"/>'
  for j in range(b):body+=f'<g transform="translate({68+(j%4)*72} {509+(j//4)*70}) scale(.33)">{apple}</g>'
 return body
pics=[]
for i in range(24):
 chosen=list(range(i,i+3));cards=[{'image':'ordering/object-'+words[j].replace(' ','-')+'.svg','label':words[j],'value':chr(65+j),'say':f'{words[j]}. {words[j]} begins with the letter {chr(65+j)}.'} for j in chosen]
 pics.append(dict(id=f'abc-order-{i}',name=f'{words[i]} · {words[i+1]} · {words[i+2]}',topic='letters',axis='vertical',cards=cards,intro='Put these pictures in alphabet order, from left to right. Say their names. What letter does each name begin with?',learn='Alphabet order! '+'. '.join(f'{chr(65+j)} is for {words[j]}' for j in chosen)+'.',rule='Put the pictures in alphabet order.'))
sets=[[1,2,3],[2,3,4],[3,4,5],[4,5,6],[5,6,7],[6,7,8],[7,8,9],[8,9,10],[1,3,5],[2,4,6],[3,6,9],[0,1,2]]
for i,values in enumerate(sets):
 cards=[dict(image=f'ordering/count-{n}.svg',label=f'{n} apples',value=n,say=f'{n} apples on this mat. '+('An empty mat means zero.' if n==0 else 'Count each apple once.')) for n in values]
 pics.append(dict(id=f'quantity-order-{i}',name='Count and order '+str(i+1),topic='numbers',axis='vertical',cards=cards,intro='Count the apples on each picture. Put the fewest on the left and the most on the right.',learn='From fewest to most: '+', '.join(str(n) for n in values)+'. Great counting!',rule='Count each group. Order from fewest to most.'))
addsets=[[(1,1),(1,2),(2,2)],[(1,2),(1,3),(2,3)],[(2,2),(2,3),(3,3)],[(2,3),(3,3),(3,4)],[(3,3),(3,4),(4,4)],[(3,4),(4,4),(4,5)],[(4,4),(4,5),(5,5)]]
subsets=[[(2,1),(4,2),(5,2)],[(3,2),(5,3),(6,3)],[(4,2),(5,2),(7,3)],[(5,2),(7,3),(7,2)],[(6,2),(7,2),(8,2)],[(7,2),(8,2),(9,2)],[(3,3),(3,2),(4,2)]]
for topic,sets in [('add',addsets),('subtract',subsets)]:
 for i,pairs in enumerate(sets):
  cards=[]
  for a,b in pairs:
   sub=topic=='subtract';v=a-b if sub else a+b;file=f'{topic}-{a}-{b}';save(file,mathcard(a,b,sub))
   speech=f'{a} '+('minus' if sub else 'plus')+f' {b} equals {v}.'
   cards.append(dict(image='ordering/'+file+'.svg',label=f'{a} '+('take away' if sub else 'and')+f' {b} apples',value=v,a=a,b=b,say=speech))
  assert len({c['value'] for c in cards})==3
  pics.append(dict(id=f'{topic}-order-{i}',name=('Add two groups ' if topic=='add' else 'Take away ')+str(i+1),topic=topic,axis='vertical',cards=cards,intro=('Count all the apples on both mats in each picture. Order the totals from smallest to biggest.' if topic=='add' else 'The apples in the carried basket were taken away. Count the apples still on the big green mat. Order what is left, from fewest to most.'),learn='You worked it out! '+ ' '.join(c['say'] for c in cards),rule=('Add both groups. Order the totals.' if topic=='add' else 'Count what is left on the green mat. Order the remainders.')))
pics=[p for p in pics if p['topic'] in ['letters','numbers']]
(ROOT/'learning-pictures.json').write_text(json.dumps(pics,indent=2)+'\n');model=ROOT/'model.js';s=model.read_text();model.write_text('export const PICTURES='+json.dumps(pics,indent=2)+';\n'+s[s.index('export const solved='):]);print('Built',len(pics),'semantic ordering puzzles with whole, text-free picture cards.')
