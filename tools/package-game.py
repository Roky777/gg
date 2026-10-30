"""Bundle the game with its local Spine pack and license; no legacy animations."""
from pathlib import Path
import zipfile
root=Path(__file__).resolve().parents[1]
files=[root/n for n in ['index.html','game.css','game.js','model.js','mascot-director.js','game-audio.js','README.md']]
files+=list((root/'docs').glob('*.md'))+list((root/'tests').glob('*.mjs'))
files+=[root/'assets/art/park-grounded-v3.webp',root/'assets/art/art-direction-v2.json']
files+=list((root/'assets/art').glob('*-wide-v3.webp'))
files+=list((root/'assets/art/puzzles').glob('*.webp'))
files+=[root/'docs/puzzle-art-prompts.json']
files+=[p for p in (root/'assets/icons').glob('*.png') if p.name!='source-atlas.png']
files+=list((root/'assets/audio').glob('*.mp3'))
files+=[p for p in (root/'sparky-animations 4').rglob('*') if p.is_file() and p.name!='.DS_Store']
out=root.parent/'output/sparky-picture-play.zip';out.parent.mkdir(exist_ok=True)
temporary=out.with_suffix('.tmp.zip')
with zipfile.ZipFile(temporary,'w',zipfile.ZIP_DEFLATED,strict_timestamps=False) as z:
 for p in files:z.write(p,Path('sparky-picture-play')/p.relative_to(root))
temporary.replace(out)
print(f'Updated ZIP: {len(files)} files, {out.stat().st_size/1048576:.1f}MB, bundled Spine runtime, assets, license and music included.')
