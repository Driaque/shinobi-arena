#!/usr/bin/env python3
"""Lossless responsive PNG export from generated masters; no artwork generation."""
import argparse,json,hashlib
from pathlib import Path
from PIL import Image
p=argparse.ArgumentParser();p.add_argument('--masters-root',type=Path,required=True);p.add_argument('--require-complete',action='store_true');args=p.parse_args()
root=Path(__file__).resolve().parents[1];out=root/'apps/web/assets/painted-v2';out.mkdir(parents=True,exist_ok=True)
manifest={'revision':1,'groups':{}}
for group,folder,prefix,sizes in [('moves','move-masters','',[64,128,256]),('weapons','equipment-masters','weapon-',[64,128,256]),('items','equipment-masters','item-',[64,128,256]),('fighters','future-masters','',[192,384,768])]:
 dest=out/group;dest.mkdir(exist_ok=True);entries={}
 for source in sorted((args.masters_root/folder).glob(prefix+'*.png')):
  if group=='weapons' and not source.stem.startswith('weapon-'):continue
  if group=='items' and not source.stem.startswith('item-'):continue
  key=source.stem.removeprefix(prefix)
  with Image.open(source) as master:
   image=master.convert('RGBA' if 'A' in master.getbands() else 'RGB')
   assert min(image.size)>=max(sizes),f'Master too small: {source}'
   record={'source':source.name,'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'sourceWidth':image.width,'sourceHeight':image.height,'alpha':image.mode=='RGBA','focalPoint':[.5,.32 if group=='fighters' else .5],'exports':[]}
   for width in sizes:
    resized=image.resize((width,round(image.height*width/image.width)),Image.Resampling.LANCZOS)
    file=dest/f'{key}-{width}.png';resized.save(file,optimize=True,compress_level=9)
    record['exports'].append({'file':str(file.relative_to(out)),'width':resized.width,'height':resized.height,'bytes':file.stat().st_size})
   entries[key]=record
 manifest['groups'][group]=entries
(out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
counts={g:len(v) for g,v in manifest['groups'].items()};print(json.dumps(counts))
if args.require_complete:assert counts=={'moves':64,'weapons':7,'items':7,'fighters':25},'Incomplete original-world art exports'
