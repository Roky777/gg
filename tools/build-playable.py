"""Copy only browser runtime dependencies to a fresh standalone deployment folder."""
from pathlib import Path
import json,re,shutil,sys,subprocess
from urllib.parse import unquote,urlsplit
root=Path(__file__).resolve().parents[1]
out=Path(sys.argv[1]).resolve()
if out.exists() and any(out.iterdir()):raise SystemExit('Build destination must be empty')
out.mkdir(parents=True,exist_ok=True)
files=set()
def add(name):
 p=root/unquote(name.split('?')[0].split('#')[0])
 if not p.is_file():raise FileNotFoundError(p)
 files.add(p.relative_to(root))
def visit(name):
 rel=Path(unquote(name.split('?')[0]));p=root/rel
 if rel in files:return
 add(str(rel))
 if p.suffix in ['.js','.html','.css']:
  s=p.read_text()
  refs=[]
  if p.suffix=='.js':refs+=re.findall(r'(?:from\s*|import\s*)[\'\"]([^\'\"]+)[\'\"]',s)
  if p.suffix=='.html':refs+=re.findall(r'(?:src|href)=[\'\"]([^\'\"]+)[\'\"]',s)
  if p.suffix=='.css':refs+=re.findall(r'url\([\'\"]?([^\)\'\"]+)',s)
  for ref in refs:
   if ref.startswith(('http:','https:','data:','#')):continue
   visit(str(rel.parent/unquote(ref.split('?')[0])))
visit('index.html')
for p in (root/'sparky-audios').rglob('*.mp3'):add(str(p.relative_to(root)))
# Dynamic assets loaded by board generators and the rig loader.
objects=json.loads(subprocess.check_output(['node','--input-type=module','-e',f"import {{ALPHABET,imageFor}} from {json.dumps((root/'puzzle-generator.js').as_uri())};console.log(JSON.stringify(ALPHABET.map(v=>imageFor(v[1]))))"],text=True))
for image in objects:add('assets/art/'+image)
for number in range(1,11):add(f'assets/art/ui-board/numbers/{number}.png')
for folder in ['counting','assembly']:
 for p in (root/'assets/art'/folder).glob('*.png'):add(str(p.relative_to(root)))
 if folder!='ordering-png':add('assets/art/'+folder+'/manifest.json')
add('assets/art/differences/manifest.json')
manifest=json.loads((root/'assets/art/differences/manifest.json').read_text())
def image_refs(value):
 if isinstance(value,str) and value.endswith(('.png','.webp')):add('assets/art/'+value)
 elif isinstance(value,list):
  for v in value:image_refs(v)
 elif isinstance(value,dict):
  for v in value.values():image_refs(v)
image_refs(manifest)
for icon in ['play','restart']:add('assets/icons/'+icon+'.png')
for icon in ['sound-on','sound-off','pause','next']:add('assets/art/ui-controls/'+icon+'-v1.svg')
add('assets/art/ui-board/round-ribbon.png')
add('assets/art/fun/jelly.png')
pack='sparky-animations 4/'
visit(pack+'rig-player.js');add(pack+'manifest.json');add(pack+'vendor/spine-webgl.min.js');add(pack+'vendor/SPINE-LICENSE.txt')
rig=json.loads((root/pack/'manifest.json').read_text())
for key in ['skeleton','atlas','texture']:add(pack+rig[key])
for rel in sorted(files):
 dst=out/rel;dst.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(root/rel,dst)
(out/'.nojekyll').write_text('')
(out/'README.md').write_text('# Sparky learning games\n\nStandalone browser build. Serve this directory over HTTP/HTTPS and open `index.html`. No installation or compilation is needed. Supports GitHub Pages at the repository root.\n\nThe game is landscape-only. Sparky uses bundled Hinglish recordings, with device speech as fallback. Audio starts after interaction. Includes the bundled Spine runtime and its license notice.\n')
assert not any(p.is_symlink() for p in out.rglob('*'))
print(json.dumps({'directory':str(out),'runtime_files':len(files),'bytes':sum((out/f).stat().st_size for f in files),'largest_file':max(((out/f).stat().st_size,str(f)) for f in files)}))
