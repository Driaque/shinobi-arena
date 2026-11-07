"""Build responsive PNGs from approved image-generation masters (requires Pillow)."""
import argparse
import json
from pathlib import Path
from PIL import Image

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('source', type=Path)
parser.add_argument('--destination', type=Path, default=Path('apps/web/assets/painted-v1'))
args = parser.parse_args()
characters = ['silent','winta','dora','aren','eira','kael','nyra','rook','veyra','oryn']
stages = ['skyglass','frost','forge','grove','court']
manifest = {'revision': 1, 'portraits': {}, 'stages': {}}
for group, names, sizes in [('portraits', characters, [192,384,768]), ('stages', stages, [320,640,1280,1600])]:
    folder = args.destination / group
    folder.mkdir(parents=True, exist_ok=True)
    for name in names:
        source = args.source / (('stage-' if group == 'stages' else '') + name + '.png')
        with Image.open(source) as original:
            original.load()
            image = original.convert('RGB')
            exports = []
            for width in sizes:
                if width > image.width:
                    raise ValueError(f'{source.name}: {width}px export would upscale {image.width}px source')
                height = round(image.height * width / image.width)
                output = folder / f'{name}-{width}.png'
                resized = image.resize((width, height), Image.Resampling.LANCZOS)
                resized.save(output, format='PNG', optimize=True, compress_level=9)
                with Image.open(output) as check:
                    check.verify()
                exports.append({'file': str(output.relative_to(args.destination)), 'width': width, 'height': height, 'bytes': output.stat().st_size})
            manifest[group][name] = {'source': source.name, 'sourceWidth': image.width, 'sourceHeight': image.height, 'alpha': False, 'focalPoint': [0.5, 0.32] if group == 'portraits' else [0.5, 0.5], 'exports': exports}
(args.destination / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(f'Validated {sum(len(item["exports"]) for group in ["portraits","stages"] for item in manifest[group].values())} PNG exports')
