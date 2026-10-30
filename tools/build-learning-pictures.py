"""Exact, scalable learning picture cards for the existing three-strip puzzle."""
from pathlib import Path
import json,html
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'assets/art/learning';OUT.mkdir(exist_ok=True)
C='#24536a'
def circle(x,y,r,fill):return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}"/>'
def path(d,fill,stroke=C,width=5):return f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round"/>'
def line(x,y,a,b,color=C,w=5):return f'<path d="M{x} {y}L{a} {b}" fill="none" stroke="{color}" stroke-width="{w}" stroke-linecap="round"/>'
apple=path('M100 62 C55 25 13 68 28 121 C40 167 69 182 100 167 C132 182 163 158 174 117 C186 64 143 31 100 62Z','#ff8665')+path('M100 61 Q96 37 110 24','none')+path('M109 41 Q117 11 147 21 Q138 48 109 41','#77bd8d')
balloon=path('M100 25 C20 25 28 115 98 151 C169 117 182 25 100 25Z','#fa9eb2')+path('M94 148L105 148L112 163L87 163Z','#fa9eb2')+path('M100 164 Q70 184 105 197','none')
leaf=path('M34 159 Q13 39 165 28 Q180 150 34 159Z','#81c895')+path('M31 168L135 58 M71 126L67 88 M103 95L137 99','none')
fish=path('M31 100L6 58L9 144Z','#f3bf62')+path('M28 100 C66 28 152 31 185 100 C148 174 65 176 28 100Z','#76c9df')+circle(148,88,7,C)+path('M80 115L99 137L113 113','#5aadc7')
icons={
'apple':apple,'balloon':balloon,
'carrot':path('M67 58L140 78L79 185Z','#ffa94c')+path('M95 64Q53 32 70 12M104 66Q99 25 118 9M117 70Q143 26 162 28','none','#70ad72',12)+line(87,103,110,111)+line(84,136,96,140),
'duck':path('M38 122Q28 165 84 170L142 167Q179 151 162 118L113 99Q111 68 88 66Q48 67 59 110Z','#ffd66e')+path('M57 84L24 96L60 104Z','#ff9a55')+circle(73,84,5,C)+path('M88 130Q123 103 141 132Q120 161 88 130','#efbc57'),
'egg':path('M100 15C65 13 24 93 32 135C42 192 160 194 169 133C176 88 134 13 100 15Z','#fff9e6')+path('M56 139Q70 164 100 165','none','#e8d8b4',5),
'fish':fish,
'grapes':''.join(circle(x,y,25,'#b19bd8') for x,y in [(68,65),(114,65),(47,104),(92,105),(137,104),(70,144),(114,144),(92,179)])+path('M92 47Q85 21 109 13','none')+path('M99 37Q127 6 159 26Q137 56 99 37','#7fc493'),
'house':path('M37 94H165V181H37Z','#ffda92')+path('M16 96L101 24L186 96Z','#f59583')+path('M87 181V123H122V181','#91c8cf')+path('M51 115H75V141H51Z','#fff8df'),
'ice cream':path('M60 101L102 191L144 101Z','#dfaf77')+path('M44 100Q31 62 65 48Q74 13 111 29Q146 23 155 58Q183 84 153 106Z','#f6aac0')+line(81,125,121,145,'#c38e58',4)+line(123,122,94,159,'#c38e58',4),
'jellyfish':path('M28 103Q24 24 100 26Q180 22 173 103Z','#c3b3ec')+path('M46 108Q20 154 51 182M80 109Q112 150 77 185M115 109Q91 151 121 188M151 108Q181 146 151 177','none','#a190d0',9)+circle(76,76,5,C)+circle(124,76,5,C),
'kite':path('M100 15L165 85L104 151L36 85Z','#ffd87b')+path('M100 15L104 151M36 85L165 85','none')+path('M104 151Q75 170 112 193','none')+path('M106 168L87 160L89 177Z','#f2959d'),
'leaf':leaf,'moon':path('M145 21C32 9 6 140 86 177Q148 211 184 145C112 173 65 82 145 21Z','#ffe292'),
'nest':path('M19 121Q100 180 182 121L168 166Q96 198 33 161Z','#cba578')+path('M24 133Q100 161 180 131M34 150L152 176M42 173L160 144','none','#a37f57',5)+''.join(f'<ellipse cx="{x}" cy="108" rx="25" ry="35" fill="#c5e4df" stroke="{C}" stroke-width="4"/>' for x in [67,108,146]),
'orange':circle(100,114,71,'#ffba59')+path('M99 45Q102 21 112 15','none')+path('M109 36Q135 6 163 26Q142 53 109 36','#7fc492')+circle(71,89,9,'#ffd68c'),
'pear':path('M89 24Q110 15 119 42C116 82 180 107 162 153C145 193 59 190 38 156C12 111 82 81 89 24Z','#bdd881')+path('M104 27Q102 10 115 5','none')+path('M114 23Q137 9 148 30Q127 43 114 23','#71aa7a'),
'quilt':path('M26 28H178V178H26Z','#fff6d8')+''.join(f'<rect x="{30+i*48}" y="{32+j*47}" width="44" height="43" rx="3" fill="{["#8ccac5","#f7b295","#e6cf8b","#b5acd6"][(i+j)%4]}"/>' for i in range(3) for j in range(3)),
'rainbow':''.join(f'<path d="M{25+i*18} 160 A{75-i*18} {100-i*18} 0 0 1 {175-i*18} 160" fill="none" stroke="{col}" stroke-width="17"/>' for i,col in enumerate(['#f6a399','#f6cc7b','#94cda6','#88c9df'])),
'sun':''.join(line(100+78*__import__('math').cos(i*__import__('math').pi/4),100+78*__import__('math').sin(i*__import__('math').pi/4),100+96*__import__('math').cos(i*__import__('math').pi/4),100+96*__import__('math').sin(i*__import__('math').pi/4),'#edb64d',9) for i in range(8))+circle(100,100,56,'#ffda77'),
'tree':path('M86 105H117V184H86Z','#cda27b')+circle(69,82,43,'#8dcca1')+circle(130,80,45,'#90cba1')+circle(101,45,42,'#a0d9ac'),
'umbrella':path('M17 103Q30 17 100 22Q175 21 186 103Q160 84 132 103Q102 84 73 103Q45 84 17 103Z','#f2a4b1')+path('M100 26V163Q102 192 78 184Q65 180 68 165','none',C,7)+path('M100 25Q70 51 73 100M100 25Q133 51 132 100','none','#d37f92',4),
'van':path('M19 60Q19 45 35 45H130L178 88V157H19Z','#8acbd0')+path('M38 62H84V105H38ZM103 62H126L161 96H103Z','#edf8ed')+circle(53,159,22,C)+circle(147,159,22,C)+circle(53,159,10,'#fff8df')+circle(147,159,10,'#fff8df'),
'watermelon':path('M17 57H184Q179 185 101 184Q25 183 17 57Z','#8fc69b')+path('M31 62H170Q165 166 101 169Q42 165 31 62Z','#ff9e99')+''.join(f'<ellipse cx="{x}" cy="{y}" rx="4" ry="8" fill="{C}" transform="rotate({r} {x} {y})"/>' for x,y,r in [(58,92,-25),(102,110,0),(143,91,25),(76,133,-16),(126,133,16)]),
'xylophone':line(38,163,163,165,'#b7a17c',12)+''.join(f'<rect x="{26+i*29}" y="{29+i*13}" width="26" height="{126-i*13}" rx="7" fill="{["#f69e9f","#f4c675","#acd390","#83c9d5","#b3a5d9"][i]}" stroke="{C}" stroke-width="3"/>' for i in range(5))+line(25,185,162,28,'#aa8461',8)+circle(164,24,14,'#e7c99a'),
'yarn':circle(98,99,69,'#b4a3d9')+path('M52 50Q146 62 153 133M36 77Q135 92 123 163M37 117Q92 104 133 45M61 155Q66 90 117 32M130 158Q161 181 185 162','none','#8e7db4',6),
'zebra':path('M40 67H133L159 42L185 53L177 102H151L139 144H44Z','#fff9e9')+path('M53 143V181M122 143V181','none',C,13)+path('M60 68L72 139M94 68L105 139M127 67L137 112M160 48L163 91','none',C,10)+circle(172,64,4,C)+path('M40 77Q13 58 19 110','none',C,8)
}
words=list(icons);assert len(words)==26
COLORS=['#d9eee4','#e0f0f5','#f5e8cf','#e8e2f1']
def text(x,y,value,size=55,color=C,weight=800):return f'<text x="{x}" y="{y}" text-anchor="middle" font-family="Trebuchet MS,DejaVu Sans,sans-serif" font-size="{size}" font-weight="{weight}" fill="{color}">{html.escape(str(value))}</text>'
def shell(inner,kind,accent='#d9eee4'):
 return f'''<svg xmlns="http://www.w3.org/2000/svg" width="1040" height="800" viewBox="0 0 1040 800"><defs><linearGradient id="paper" x2="0" y2="1"><stop stop-color="#fffcf0"/><stop offset="1" stop-color="#eff6e9"/></linearGradient></defs><rect width="1040" height="800" fill="url(#paper)"/><path d="M0 675Q240 625 520 683T1040 660V800H0Z" fill="{accent}"/><path d="M0 744Q280 704 530 750T1040 723V800H0Z" fill="#c9e5d6" opacity=".5"/>{text(520,66,kind,24,'#5a7b78',700)}{inner}</svg>'''
def save(name,inner,kind,accent='#d9eee4'):(OUT/(name+'.svg')).write_text(shell(inner,kind,accent))
content=[]
for i,(letter,word) in enumerate(zip('ABCDEFGHIJKLMNOPQRSTUVWXYZ',words)):
 name=f'letter-{letter.lower()}';illustration=f'<circle cx="690" cy="365" r="168" fill="{COLORS[i%4]}"/><g transform="translate(558 235) scale(1.32)">{icons[word]}</g>'
 inner=text(314,435,letter,250,'#257ca2')+text(425,445,letter.lower(),135,'#5595a7')+illustration+text(520,613,word,66)+text(520,729,f'{letter} is for {word}',31,'#486e70',700)
 save(name,inner,'LETTER GARDEN',COLORS[i%4]);content.append(dict(id=name,name=f'{letter} is for {word}',image=f'learning/{name}.svg',axis='vertical' if i%2==0 else 'horizontal',topic='letters',intro=f'Let’s build our letter picture. {letter} is for {word}. Swap the strips to join the picture.',learn=f'{letter}. {letter} is for {word}. This is capital {letter} and little {letter.lower()}.',letter=letter,word=word))
for n in range(1,11):
 name=f'count-{n}';inner=text(285,432,n,245,'#38847c');scale=.44
 # Two rows of five, stable one-to-one arrangement.
 for j in range(n):
  x=515+(j%5)*91;y=244+(j//5)*120
  inner+=f'<g transform="translate({x} {y}) scale({scale})">{apple}</g>'
 inner+=text(520,620,f'{n} '+('apple' if n==1 else 'apples'),60)+text(520,730,'Touch each apple. Count together.',29,'#486e70',700)
 save(name,inner,'COUNTING CLUB');content.append(dict(id=name,name=f'{n} '+('apple' if n==1 else 'apples'),image=f'learning/{name}.svg',axis='vertical' if n%2 else 'horizontal',topic='numbers',intro=f'Let’s make a counting picture. Find all {n} '+('apple.' if n==1 else 'apples.')+' Swap the strips.',learn=', '.join(str(v) for v in range(1,n+1))+f'. {n} '+('apple!' if n==1 else 'apples!')+' The last number tells us how many.',number=n))
def group(n,x,y,color=None,cross=False):
 s=''
 for j in range(n):
  px=x+(j%5)*100;py=y+(j//5)*116
  s+=f'<g transform="translate({px} {py}) scale(.46)">{apple}</g>'
  if cross:s+=f'<path d="M{px+8} {py+80}L{px+82} {py+13}" stroke="#537c83" stroke-width="7" stroke-linecap="round"/>'
 return s
for topic,pairs in [('add',[(1,1),(1,2),(2,2),(2,3),(3,1),(3,3),(4,2),(4,3),(5,2),(5,3),(4,4),(6,2),(6,3),(5,5),(7,3)]),('subtract',[(2,1),(3,1),(3,2),(4,1),(4,2),(5,2),(5,3),(6,2),(6,3),(7,3),(8,4),(9,3),(10,4),(10,5),(4,4)])]:
 for i,(a,b) in enumerate(pairs):
  add=topic=='add';answer=a+b if add else a-b;symbol='+' if add else '−';spoken='plus' if add else 'minus';name=f'{topic}-{a}-{b}'
  inner=text(520,226,f'{a} {symbol} {b} = {answer}',118,'#287e97' if add else '#83619c')
  if add:
   # Joined result is displayed in a single ten frame: two colors of trays.
   inner+=f'<rect x="226" y="299" width="588" height="276" rx="34" fill="#e6f0df" stroke="#a9ccbb" stroke-width="3"/>'
   for j in range(answer):inner+=group(1,250+(j%5)*105,328+(j//5)*113)
   caption=f'{a} apples and {b} more make {answer}.'
  else:
   inner+=f'<rect x="226" y="299" width="588" height="276" rx="34" fill="#e8edf0" stroke="#b4c9cd" stroke-width="3"/>'
   for j in range(a):inner+=group(1,250+(j%5)*105,328+(j//5)*113,cross=j>=answer)
   caption=f'{a} apples. Take away {b}. {answer} left.'
  inner+=text(520,650,caption,36)+text(520,730,'Count the apples to check.',28,'#486e70',700)
  save(name,inner,'ADD TOGETHER' if add else 'TAKE AWAY', '#f5e8cf' if add else '#e8e2f1')
  content.append(dict(id=name,name=f'{a} {spoken} {b}',image=f'learning/{name}.svg',axis='vertical' if i%2==0 else 'horizontal',topic=topic,intro=f'{a} {spoken} {b}. Let’s join the strips to discover the answer.',learn=f'{a} {spoken} {b} equals {answer}. '+(f'{a} apples and {b} more make {answer} apples.' if add else f'Take away the {b} crossed-out apples. '+(f'{answer} apples are left.' if answer else 'There are no apples left. Zero!')),a=a,b=b,answer=answer))
(ROOT/'learning-pictures.json').write_text(json.dumps(content,indent=2)+'\n')
# Keep the swap model self-contained for existing consumers/tests.
model=ROOT/'model.js';s=model.read_text();tail=s[s.index('export const solved='):];model.write_text('export const PICTURES='+json.dumps(content,indent=2)+';\n'+tail)
print(f'Built {len(content)} educational picture puzzles: 26 letters, 10 quantities, 15 addition, 15 subtraction.')
