"""Export the isometric vehicle renders into the app and write the model catalog.

Usage: python docs/brand/make_vehicle_icons.py <renders folder> [repo root]

The renders are made outside the repo (one FRONT and one REAR view per model, 1024 px,
transparent, the body painted in key green #00C853 so the app can repaint it in any
color). Each one is cropped to the car, fitted bottom-aligned into a 360 x 240 frame
so every model has the same footprint, and saved as public/vehicles/<id>-<view>.webp.
src/data/carModels.ts is generated from the table below; edit the table here, not there.

A generic template car (template-car-front.png and template-car-rear.png) stands in for
any model that is not in the list. When it is in the renders folder it is exported too
and HAS_TEMPLATE_CAR becomes true.
"""
import json
import sys
from pathlib import Path

from PIL import Image

RENDERS = Path(sys.argv[1])
ROOT = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(__file__).resolve().parents[2]
OUT = ROOT / 'public' / 'vehicles'
TS = ROOT / 'src' / 'data' / 'carModels.ts'
W, H = 360, 240

# id, full name, brand, body, match keys (lowercase letters and digits; three characters or fewer match a whole word only).
MODELS = [
    ('toyota-avanza', 'Toyota Avanza', 'Toyota', 'mpv', ['avanza']),
    ('toyota-innova-zenix', 'Toyota Kijang Innova Zenix', 'Toyota', 'mpv', ['zenix', 'innovazenix', 'kijanginnovazenix']),
    ('toyota-innova-reborn', 'Toyota Kijang Innova Reborn', 'Toyota', 'mpv', ['innova', 'kijanginnova', 'innovareborn', 'reborn', 'crysta']),
    ('toyota-calya', 'Toyota Calya', 'Toyota', 'mpv', ['calya']),
    ('toyota-rush', 'Toyota Rush', 'Toyota', 'suv', ['rush']),
    ('toyota-agya', 'Toyota Agya', 'Toyota', 'hatch', ['agya']),
    ('toyota-fortuner', 'Toyota Fortuner', 'Toyota', 'suv', ['fortuner']),
    ('toyota-alphard', 'Toyota Alphard', 'Toyota', 'mpv', ['alphard']),
    ('toyota-veloz', 'Toyota Veloz', 'Toyota', 'mpv', ['veloz']),
    ('toyota-raize', 'Toyota Raize', 'Toyota', 'suv', ['raize']),
    ('toyota-yaris-cross', 'Toyota Yaris Cross', 'Toyota', 'suv', ['yariscross']),
    ('toyota-camry', 'Toyota Camry', 'Toyota', 'sedan', ['camry']),
    ('toyota-corolla-cross', 'Toyota Corolla Cross', 'Toyota', 'suv', ['corollacross']),
    ('toyota-voxy', 'Toyota Voxy', 'Toyota', 'mpv', ['voxy']),
    ('toyota-land-cruiser', 'Toyota Land Cruiser', 'Toyota', 'suv', ['landcruiser', 'lc300']),
    ('daihatsu-sigra', 'Daihatsu Sigra', 'Daihatsu', 'mpv', ['sigra']),
    ('daihatsu-terios', 'Daihatsu Terios', 'Daihatsu', 'suv', ['terios']),
    ('daihatsu-ayla', 'Daihatsu Ayla', 'Daihatsu', 'hatch', ['ayla']),
    ('daihatsu-xenia', 'Daihatsu Xenia', 'Daihatsu', 'mpv', ['xenia']),
    ('daihatsu-rocky', 'Daihatsu Rocky', 'Daihatsu', 'suv', ['rocky']),
    ('honda-brio', 'Honda Brio', 'Honda', 'hatch', ['brio']),
    ('honda-hrv', 'Honda HR-V', 'Honda', 'suv', ['hrv']),
    ('honda-crv', 'Honda CR-V', 'Honda', 'suv', ['crv']),
    ('honda-brv', 'Honda BR-V', 'Honda', 'suv', ['brv']),
    ('honda-wrv', 'Honda WR-V', 'Honda', 'suv', ['wrv']),
    ('honda-city-hatchback', 'Honda City Hatchback', 'Honda', 'hatch', ['city', 'cityhatch', 'cityhatchback']),
    ('honda-civic', 'Honda Civic', 'Honda', 'sedan', ['civic']),
    ('honda-jazz', 'Honda Jazz', 'Honda', 'hatch', ['jazz', 'fit']),
    ('honda-mobilio', 'Honda Mobilio', 'Honda', 'mpv', ['mobilio']),
    ('honda-freed', 'Honda Freed', 'Honda', 'mpv', ['freed']),
    ('mitsubishi-xpander', 'Mitsubishi Xpander', 'Mitsubishi', 'mpv', ['xpander', 'xpandercross']),
    ('mitsubishi-pajero-sport', 'Mitsubishi Pajero Sport', 'Mitsubishi', 'suv', ['pajero', 'pajerosport']),
    ('mitsubishi-xforce', 'Mitsubishi XForce', 'Mitsubishi', 'suv', ['xforce']),
    ('suzuki-fronx', 'Suzuki Fronx', 'Suzuki', 'suv', ['fronx']),
    ('suzuki-ertiga', 'Suzuki Ertiga', 'Suzuki', 'mpv', ['ertiga']),
    ('suzuki-xl7', 'Suzuki XL7', 'Suzuki', 'mpv', ['xl7']),
    ('suzuki-jimny', 'Suzuki Jimny', 'Suzuki', 'suv', ['jimny']),
    ('hyundai-creta', 'Hyundai Creta', 'Hyundai', 'suv', ['creta']),
    ('hyundai-stargazer', 'Hyundai Stargazer', 'Hyundai', 'mpv', ['stargazer']),
    ('hyundai-ioniq-5', 'Hyundai Ioniq 5', 'Hyundai', 'suv', ['ioniq5']),
    ('hyundai-palisade', 'Hyundai Palisade', 'Hyundai', 'suv', ['palisade']),
    ('wuling-air-ev', 'Wuling Air ev', 'Wuling', 'hatch', ['airev', 'wulingair']),
    ('wuling-cloud-ev', 'Wuling Cloud EV', 'Wuling', 'hatch', ['cloud', 'cloudev']),
    ('wuling-binguo-ev', 'Wuling Binguo EV', 'Wuling', 'hatch', ['binguo', 'bingo']),
    ('byd-atto-1', 'BYD Atto 1', 'BYD', 'hatch', ['atto1', 'seagull', 'dolphinmini']),
    ('byd-atto-3', 'BYD Atto 3', 'BYD', 'suv', ['atto3']),
    ('byd-m6', 'BYD M6', 'BYD', 'mpv', ['m6', 'bydm6']),
    ('byd-seal', 'BYD Seal', 'BYD', 'sedan', ['seal']),
    ('byd-dolphin', 'BYD Dolphin', 'BYD', 'hatch', ['dolphin']),
    ('byd-sealion-7', 'BYD Sealion 7', 'BYD', 'suv', ['sealion', 'sealion7']),
    ('denza-d9', 'Denza D9', 'Denza', 'mpv', ['d9', 'denza', 'denzad9']),
    ('nissan-serena', 'Nissan Serena', 'Nissan', 'mpv', ['serena']),
    ('mazda-cx-5', 'Mazda CX-5', 'Mazda', 'suv', ['cx5']),
    ('kia-carnival', 'Kia Carnival', 'Kia', 'mpv', ['carnival']),
    ('geely-ex5', 'Geely EX5', 'Geely', 'suv', ['ex5', 'galaxye5']),
    ('vinfast-vf3', 'VinFast VF 3', 'VinFast', 'suv', ['vf3']),
    ('tesla-model-y', 'Tesla Model Y', 'Tesla', 'suv', ['modely']),
    ('tesla-model-3', 'Tesla Model 3', 'Tesla', 'sedan', ['model3']),
    ('jaecoo-j7', 'Jaecoo J7', 'Jaecoo', 'suv', ['j7', 'jaecoo7', 'jaecooj7']),
    ('jaecoo-j5', 'Jaecoo J5', 'Jaecoo', 'suv', ['j5', 'jaecoo5', 'jaecooj5']),
    ('chery-tiggo-8', 'Chery Tiggo 8 Pro', 'Chery', 'suv', ['tiggo8', 'tiggo8pro', 'tiggo8promax']),
    ('chery-tiggo-7', 'Chery Tiggo 7 Pro', 'Chery', 'suv', ['tiggo7', 'tiggo7pro']),
    ('chery-tiggo-cross', 'Chery Tiggo Cross', 'Chery', 'suv', ['tiggocross', 'tiggo4', 'tiggo4pro']),
    ('omoda-5', 'Omoda 5', 'Omoda', 'suv', ['omoda', 'omoda5', 'omodac5', 'c5']),
    ('omoda-e5', 'Omoda E5', 'Omoda', 'suv', ['e5', 'omodae5']),
    ('lexus-lm', 'Lexus LM', 'Lexus', 'mpv', ['lm', 'lm350h', 'lm500h']),
    ('lexus-rx', 'Lexus RX', 'Lexus', 'suv', ['rx', 'rx350', 'rx350h', 'rx500h']),
    ('lexus-lx', 'Lexus LX', 'Lexus', 'suv', ['lx', 'lx570', 'lx600']),
    ('lexus-es', 'Lexus ES', 'Lexus', 'sedan', ['es', 'es300h']),
    ('lexus-nx', 'Lexus NX', 'Lexus', 'suv', ['nx', 'nx350h']),
    ('range-rover', 'Range Rover', 'Land Rover', 'suv', ['rangerover']),
    ('range-rover-sport', 'Range Rover Sport', 'Land Rover', 'suv', ['rangeroversport', 'rrsport']),
    ('range-rover-velar', 'Range Rover Velar', 'Land Rover', 'suv', ['velar', 'rangerovervelar']),
    ('range-rover-evoque', 'Range Rover Evoque', 'Land Rover', 'suv', ['evoque', 'rangeroverevoque']),
    ('porsche-911', 'Porsche 911', 'Porsche', 'sedan', ['911', 'carrera']),
    ('porsche-cayenne', 'Porsche Cayenne', 'Porsche', 'suv', ['cayenne']),
    ('porsche-macan', 'Porsche Macan', 'Porsche', 'suv', ['macan']),
    ('porsche-taycan', 'Porsche Taycan', 'Porsche', 'sedan', ['taycan']),
    ('porsche-panamera', 'Porsche Panamera', 'Porsche', 'sedan', ['panamera']),
    ('rolls-royce-cullinan', 'Rolls-Royce Cullinan', 'Rolls-Royce', 'suv', ['cullinan']),
    ('rolls-royce-ghost', 'Rolls-Royce Ghost', 'Rolls-Royce', 'sedan', ['ghost']),
    ('rolls-royce-phantom', 'Rolls-Royce Phantom', 'Rolls-Royce', 'sedan', ['phantom']),
    ('mclaren-750s', 'McLaren 750S', 'McLaren', 'sedan', ['750s', '720s']),
    ('mclaren-artura', 'McLaren Artura', 'McLaren', 'sedan', ['artura']),
    ('lamborghini-urus', 'Lamborghini Urus', 'Lamborghini', 'suv', ['urus']),
    ('lamborghini-huracan', 'Lamborghini Huracán', 'Lamborghini', 'sedan', ['huracan']),
    ('lamborghini-revuelto', 'Lamborghini Revuelto', 'Lamborghini', 'sedan', ['revuelto']),
    ('koenigsegg-jesko', 'Koenigsegg Jesko', 'Koenigsegg', 'sedan', ['jesko']),
    ('koenigsegg-regera', 'Koenigsegg Regera', 'Koenigsegg', 'sedan', ['regera']),
    ('ferrari-sf90', 'Ferrari SF90 Stradale', 'Ferrari', 'sedan', ['sf90']),
    ('ferrari-296', 'Ferrari 296 GTB', 'Ferrari', 'sedan', ['296', '296gtb']),
    ('ferrari-roma', 'Ferrari Roma', 'Ferrari', 'sedan', ['roma']),
    ('ferrari-purosangue', 'Ferrari Purosangue', 'Ferrari', 'suv', ['purosangue']),
    ('bmw-3-series', 'BMW 3 Series', 'BMW', 'sedan', ['3series', '318i', '320i', '330i', '330e']),
    ('bmw-5-series', 'BMW 5 Series', 'BMW', 'sedan', ['5series', '520i', '530i', 'i5']),
    ('bmw-7-series', 'BMW 7 Series', 'BMW', 'sedan', ['7series', '730li', '740i', '740li', 'i7']),
    ('bmw-x1', 'BMW X1', 'BMW', 'suv', ['x1']),
    ('bmw-x3', 'BMW X3', 'BMW', 'suv', ['x3']),
    ('bmw-x5', 'BMW X5', 'BMW', 'suv', ['x5']),
    ('bmw-x7', 'BMW X7', 'BMW', 'suv', ['x7']),
    ('bmw-ix', 'BMW iX', 'BMW', 'suv', ['ix']),
    ('mercedes-c-class', 'Mercedes-Benz C-Class', 'Mercedes-Benz', 'sedan', ['cclass', 'cklasse', 'c200', 'c250', 'c300']),
    ('mercedes-e-class', 'Mercedes-Benz E-Class', 'Mercedes-Benz', 'sedan', ['eclass', 'eklasse', 'e200', 'e220', 'e300', 'e350']),
    ('mercedes-s-class', 'Mercedes-Benz S-Class', 'Mercedes-Benz', 'sedan', ['sclass', 'sklasse', 's450', 's500', 's580']),
    ('mercedes-gla', 'Mercedes-Benz GLA', 'Mercedes-Benz', 'suv', ['gla', 'gla200']),
    ('mercedes-glc', 'Mercedes-Benz GLC', 'Mercedes-Benz', 'suv', ['glc', 'glc200', 'glc300']),
    ('mercedes-gle', 'Mercedes-Benz GLE', 'Mercedes-Benz', 'suv', ['gle', 'gle450']),
    ('mercedes-gls', 'Mercedes-Benz GLS', 'Mercedes-Benz', 'suv', ['gls', 'gls450']),
    ('mercedes-g-class', 'Mercedes-Benz G-Class', 'Mercedes-Benz', 'suv', ['gclass', 'gklasse', 'gwagon', 'g63', 'g400', 'g500']),
    ('mercedes-v-class', 'Mercedes-Benz V-Class', 'Mercedes-Benz', 'mpv', ['vclass', 'vklasse', 'v250', 'v260', 'v300']),
    ('mini-cooper', 'Mini Cooper', 'Mini', 'hatch', ['mini', 'cooper', 'minicooper']),
    ('jeep-wrangler', 'Jeep Wrangler', 'Jeep', 'suv', ['wrangler', 'rubicon']),
    ('volvo-xc90', 'Volvo XC90', 'Volvo', 'suv', ['xc90']),
    ('audi-q5', 'Audi Q5', 'Audi', 'suv', ['q5']),
    ('bentley-bentayga', 'Bentley Bentayga', 'Bentley', 'suv', ['bentayga']),
]

# The 2025 best sellers (Gaikindo), in their order: what the picker shows before anything is typed.
POPULAR = ['toyota-innova-zenix', 'toyota-avanza', 'daihatsu-sigra', 'honda-brio', 'toyota-calya', 'toyota-rush',
           'mitsubishi-xpander', 'byd-atto-1', 'toyota-agya', 'daihatsu-terios', 'toyota-fortuner', 'suzuki-fronx',
           'honda-hrv', 'daihatsu-ayla', 'byd-m6']

TEMPLATE = 'template-car'


def export(src: Path, dest: Path):
    """Crop to the car, fit it bottom-aligned into the frame, save as WebP."""
    im = Image.open(src).convert('RGBA')
    box = im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
    car = im.crop(box)
    scale = min(W * 0.94 / car.width, H * 0.9 / car.height)
    car = car.resize((round(car.width * scale), round(car.height * scale)), Image.LANCZOS)
    frame = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    frame.alpha_composite(car, ((W - car.width) // 2, round(H * 0.97) - car.height))
    frame.save(dest, 'WEBP', quality=84, method=6)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    ids = [m[0] for m in MODELS]
    assert len(ids) == len(set(ids)), 'duplicate id'
    assert all(p in ids for p in POPULAR), 'popular id not in the table'
    done, missing = [], []
    for m in MODELS:
        views = [RENDERS / f'{m[0]}-{v}.png' for v in ('front', 'rear')]
        if not all(v.exists() for v in views):
            missing.append(m[0])
            continue
        for v, src in zip(('front', 'rear'), views):
            export(src, OUT / f'{m[0]}-{v}.webp')
        done.append(m)
    template = all((RENDERS / f'{TEMPLATE}-{v}.png').exists() for v in ('front', 'rear'))
    if template:
        for v in ('front', 'rear'):
            export(RENDERS / f'{TEMPLATE}-{v}.png', OUT / f'{TEMPLATE}-{v}.webp')

    rows = []
    for mid, name, brand, body, keys in done:
        pop = ', popular: true' if mid in POPULAR else ''
        rows.append(f"  {{ id: '{mid}', name: {json.dumps(name, ensure_ascii=False)}, brand: '{brand}', body: '{body}'{pop}, keys: {json.dumps(keys)} }},")
    TS.write_text(
        '// Generated by docs/brand/make_vehicle_icons.py from the render set. Edit the table there, not here.\n'
        "import type { CarBody } from '../store/app'\n\n"
        'export interface CarModel {\n'
        '  id: string\n'
        '  /** The full name, as it is saved on the vehicle: "Toyota Avanza". */\n'
        '  name: string\n'
        '  brand: string\n'
        '  body: CarBody\n'
        '  /** A 2025 best seller, shown before anything is typed. */\n'
        '  popular?: true\n'
        '  /** Lowercase letters and digits; three characters or fewer only match a whole word. */\n'
        '  keys: string[]\n'
        '}\n\n'
        '/** Every model with an isometric icon in public/vehicles (front and rear view, body in key green). */\n'
        'export const CAR_MODELS: CarModel[] = [\n' + '\n'.join(rows) + '\n]\n\n'
        f'/** Order of the best sellers in the picker. */\nexport const POPULAR_ORDER = {json.dumps(POPULAR)}\n\n'
        '/** Whether the generic template car (public/vehicles/template-car-*.webp) has been made yet. */\n'
        f'export const HAS_TEMPLATE_CAR = {"true" if template else "false"}\n',
        encoding='utf-8',
    )
    print(f'{len(done)} models exported, template {"yes" if template else "not yet"}; missing renders: {missing or "none"}')


if __name__ == '__main__':
    main()
