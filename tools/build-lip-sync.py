"""Offline phonetic lip sync for the supplied Hinglish audio. No browser dependency."""
from pathlib import Path
import argparse,json,subprocess,hashlib,tempfile,concurrent.futures
parser=argparse.ArgumentParser();parser.add_argument('--rhubarb',required=True);args=parser.parse_args()
root=Path(__file__).resolve().parents[1]
records=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import{RECORDINGS}from './voice-recordings.js';console.log(JSON.stringify(RECORDINGS));"],cwd=root,text=True))
cache=root/'tmp/lip-sync';cache.mkdir(parents=True,exist_ok=True)
def generate(pair):
 ident,record=pair;audio=root/record['path'];digest=hashlib.sha256(audio.read_bytes()).hexdigest();cached=cache/(ident+'.json')
 if cached.exists():
  previous=json.loads(cached.read_text())
  if previous.get('sha256')==digest:return ident,previous
 with tempfile.TemporaryDirectory(prefix='sparky-phonetic-') as temp:
  wav=Path(temp)/'recording.wav'
  subprocess.run(['ffmpeg','-v','error','-y','-i',str(audio),'-ar','16000','-ac','1',str(wav)],check=True,stderr=subprocess.PIPE)
  data=json.loads(subprocess.check_output([args.rhubarb,'-r','phonetic','--extendedShapes','X','--threads','1','--quiet','-f','json',str(wav)],stderr=subprocess.PIPE,text=True))
 cues=[[cue['start'],cue['value']] for cue in data['mouthCues']]
 duration=record['duration'];assert cues and all(c[1] in 'ABCDEFX' for c in cues)
 # Explicitly close at the end of the MP3; its timing includes encoder padding.
 cues.append([round(duration,3),'X'])
 result={'sha256':digest,'duration':duration,'cues':cues}
 cached.write_text(json.dumps(result))
 return ident,result
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 result={}
 for n,(ident,data) in enumerate(pool.map(generate,records.items()),1):
  result[ident]=data
  if n%25==0:print(f'Analyzed {n}/165 recordings',flush=True)
(root/'lip-sync-data.js').write_text('// Generated offline with Rhubarb 1.14.0, phonetic recognizer, A-F and X shapes.\nexport const LIP_SYNC='+json.dumps(result,separators=(',',':'))+';\n')
print(f'Generated {len(result)} synchronized tracks, {sum(len(r["cues"]) for r in result.values())} mouth cues.')
