"""Index supplied audio by the approved recording order; verify every MP3 decodes."""
from pathlib import Path
import json,re,subprocess,concurrent.futures
root=Path(__file__).resolve().parents[1]
clips=json.loads((root/'docs/sparky-voice-recording-list.json').read_text())['clips']
files=list((root/'sparky-audios').rglob('*.mp3'))
by_code={}
for f in files:
 code=re.match(r'([TANV]\d+)',f.name).group(1)
 if code in by_code:raise ValueError('Duplicate recording '+code)
 by_code[code]=f
core=[r for r in clips if r['category'] not in ['letter_reading','counting','picture_name']]
letters=[r for r in clips if r['category']=='letter_reading'];numbers=[r for r in clips if r['category']=='counting'];names=[r for r in clips if r['category']=='picture_name']
pairs=[]
for prefix,items,start in [('T',core,1),('A',letters,1),('N',numbers,0),('V',names,1)]:
 for n,r in enumerate(items,start):pairs.append((r,by_code[f'{prefix}{n:02}']))
assert len(pairs)==len(files)==165

def probe(pair):
 r,f=pair
 result=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','json',str(f)],text=True))
 # Decode the complete file, not just its header.
 subprocess.run(['ffmpeg','-v','error','-i',str(f),'-f','null','-'],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
 duration=float(result['format']['duration']);assert duration>0
 return r['id'],{'path':str(f.relative_to(root)),'text':r['text'],'duration':round(duration,3),'category':r['category']}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:records=dict(pool.map(probe,pairs))
output='// Generated from the approved script and supplied MP3s. Rebuild with tools/index-recorded-voices.py.\nexport const RECORDINGS='+json.dumps(records,ensure_ascii=False,indent=1)+';\n'
(root/'voice-recordings.js').write_text(output)
print(f'Validated {len(records)} recordings; {sum(v["duration"] for v in records.values()):.1f}s total.')
for k,v in records.items():
 if k.endswith('_win_01') or k in ['letters_win_01','numbers_win_01','count_win_01','assembly_win_01','differences_win_01']:print(k,v['duration'])
