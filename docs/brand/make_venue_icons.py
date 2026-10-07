"""Export the 3D building icons of the KENNETH places into the app.

Usage: python docs/brand/make_venue_icons.py <renders folder> [repo root]

The renders are made outside the repo (one per place, about 1254 px, transparent, the building on a
light grey tile, in the house style of the car icons; prompts and reference photos stay with the brand
kit). Each one is cropped to the tile and building, fitted into a 192 px square with a little margin,
bottom-aligned so every tile sits on the same line, and saved as public/venues/<id>.webp: enough for a
64 px icon on a 3x screen. Every place in src/data/venues.ts must have a render.
"""
import re
import sys
from pathlib import Path

from PIL import Image

RENDERS = Path(sys.argv[1])
ROOT = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(__file__).resolve().parents[2]
OUT = ROOT / 'public' / 'venues'
SIZE, MARGIN = 192, 6

ids = re.findall(r"^    id: '([a-z0-9-]+)',", (ROOT / 'src' / 'data' / 'venues.ts').read_text(encoding='utf-8'), re.M)
missing = [i for i in ids if not (RENDERS / f'{i}.png').exists()]
assert not missing, f'no render for {missing}'

OUT.mkdir(parents=True, exist_ok=True)
total = 0
for vid in ids:
    img = Image.open(RENDERS / f'{vid}.png').convert('RGBA')
    alpha = img.getchannel('A').point(lambda a: 0 if a < 16 else a)
    img.putalpha(alpha)
    img = img.crop(alpha.getbbox())
    scale = (SIZE - 2 * MARGIN) / max(img.size)
    img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    tile = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    tile.alpha_composite(img, ((SIZE - img.width) // 2, SIZE - MARGIN - img.height))
    path = OUT / f'{vid}.webp'
    tile.save(path, 'WEBP', quality=86, method=6)
    total += path.stat().st_size
print(f'{len(ids)} icons, {total // 1024} KB in {OUT}')
