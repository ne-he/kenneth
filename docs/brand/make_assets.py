"""Regenerate the KENNETH PWA icons and the OG image on the ink / porcelain / cornflower palette.

Usage: python docs/brand/make_assets.py <repo root>

The K is read from docs/brand/kenneth-logo-1024.png (K of roads on a pure black field).
The black field is lifted to ink with a per-channel max: the road body never drops
below luminance 41, so every K pixel stays exactly as drawn and only the field moves.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(sys.argv[1])
PUB = ROOT / 'public'
FONT = ROOT / 'docs/social/source/static/fonts/PlusJakartaSans.ttf'

INK = (18, 18, 22)        # #121216
CANVAS = (246, 246, 243)  # #f6f6f3 porcelain
INK2 = (85, 85, 92)       # #55555c
INK3 = (138, 138, 144)    # #8a8a90
INK3_DARK = (110, 110, 119)  # #6e6e77, muted label on a dark card
TINT = (227, 234, 253)    # #e3eafd cornflower tint
LED = {'penuh': (255, 107, 94), 'ramai': (245, 196, 81), 'lega': (94, 212, 160)}  # app LED tokens

logo = np.array(Image.open(ROOT / 'docs/brand/kenneth-logo-1024.png').convert('RGB'))
LOGO_INK = Image.fromarray(np.maximum(logo, np.array(INK, np.uint8)))


def icon(size, scale, radius=0):
    """Square icon on ink. scale = logo frame / icon frame. radius > 0 rounds the corners (RGBA)."""
    im = Image.new('RGB', (size, size), INK)
    s = round(size * scale)
    k = LOGO_INK.resize((s, s), Image.Resampling.LANCZOS)
    im.paste(k, ((size - s) // 2, (size - s) // 2))
    if radius:
        ss = 4
        mask = Image.new('L', (size * ss, size * ss), 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, size * ss - 1, size * ss - 1), radius=radius * ss, fill=255)
        im = im.convert('RGBA')
        im.putalpha(mask.resize((size, size), Image.Resampling.LANCZOS))
    return im


def font(size, weight):
    f = ImageFont.truetype(str(FONT), size)
    f.set_variation_by_axes([weight])
    return f


def put(d, s, x, cap_top, size, weight, fill, tracking=0, leading=None):
    """Draw text with its cap height starting at cap_top (so layout is measured from the letter tops)."""
    f = font(size, weight)
    y = cap_top - d.textbbox((0, 0), 'H', font=f)[1]
    step = leading or round(size * 1.19)
    for line in s.split('\n'):
        if tracking:
            cx = x
            for ch in line:
                d.text((cx, y), ch, font=f, fill=fill)
                cx += d.textlength(ch, font=f) + tracking
        else:
            d.text((x, y), line, font=f, fill=fill)
        y += step


# 5 x 7 block digits, the style of the gate signboards.
GLYPHS = {
    '0': ['11111', '10001', '10001', '10001', '10001', '10001', '11111'],
    '1': ['00001', '00001', '00001', '00001', '00001', '00001', '00001'],
    '2': ['11111', '00001', '00001', '11111', '10000', '10000', '11111'],
    '3': ['11111', '00001', '00001', '11111', '00001', '00001', '11111'],
    '4': ['10001', '10001', '10001', '11111', '00001', '00001', '00001'],
    '5': ['11111', '10000', '10000', '11111', '00001', '00001', '11111'],
    '6': ['11111', '10000', '10000', '11111', '10001', '10001', '11111'],
    '7': ['11111', '00001', '00001', '00001', '00001', '00001', '00001'],
    '8': ['11111', '10001', '10001', '11111', '10001', '10001', '11111'],
    '9': ['11111', '10001', '10001', '11111', '00001', '00001', '11111'],
    '%': ['11000', '11001', '00010', '00100', '01000', '10011', '00011'],
}


def led(im, x, y, s, color, pitch=6, block=5):
    layer = Image.new('RGBA', im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    cx = x
    for ch in s:
        for r, row in enumerate(GLYPHS[ch]):
            for c, v in enumerate(row):
                if v == '1':
                    d.rounded_rectangle((cx + c * pitch, y + r * pitch, cx + c * pitch + block - 1, y + r * pitch + block - 1), radius=1, fill=color + (255,))
        cx += 6 * pitch
    glow = layer.filter(ImageFilter.GaussianBlur(7))
    glow.putalpha(glow.getchannel('A').point(lambda a: int(a * 0.75)))
    im.alpha_composite(glow)
    im.alpha_composite(layer)


def og():
    W, H = 1200, 630
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    # One soft cornflower tint low on the right, where the old green glow sat.
    t = np.exp(-(((xx - 1000) / 520) ** 2 + ((yy - 640) / 400) ** 2))[..., None]
    bg = np.array(CANVAS, np.float32) * (1 - t) + np.array(TINT, np.float32) * t
    im = Image.fromarray(bg.astype(np.uint8), 'RGB').convert('RGBA')
    dots = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    dd = ImageDraw.Draw(dots)
    for y in range(11, H, 24):
        for x in range(11, W, 24):
            dd.rectangle((x, y, x + 1, y + 1), fill=INK + (33,))
    im.alpha_composite(dots)

    im.alpha_composite(icon(60, 1.03, radius=13), (72, 64))
    d = ImageDraw.Draw(im)
    put(d, 'KENNETH', 150, 86, 24, 800, INK, tracking=5)
    put(d, 'Cek parkir\nsemudah cek\ncuaca.', 74, 183, 62, 800, INK, leading=69)
    put(d, 'Seberapa penuh, antri gerbang berapa menit,\ndan ke mana kalau penuh. Sebelum kamu\nberangkat.', 73, 409, 24, 450, INK2, leading=34)
    put(d, 'Prototipe Venture Creation · BINUS 2026 · data simulasi', 73, 548, 18, 500, INK3)

    cards = [
        ((686, 120), 'CP', '96%', 'penuh', 'PENUH'),
        ((914, 120), 'NEO', '45%', 'lega', 'LEGA'),
        ((686, 281), 'MTA', '62%', 'lega', 'LEGA'),
        ((914, 281), 'LMP', '86%', 'ramai', 'RAMAI'),
    ]
    for (x, y), label, value, key, word in cards:
        d.rounded_rectangle((x, y, x + 213, y + 146), radius=20, fill=INK)
        put(d, label, x + 24, y + 30, 15, 700, INK3_DARK, tracking=2)
        led(im, x + 24, y + 53, value, LED[key])
        d = ImageDraw.Draw(im)
        put(d, word, x + 24, y + 113, 15, 800, LED[key], tracking=1)
    return im.convert('RGB')


if __name__ == '__main__':
    icon(192, 0.92).save(PUB / 'pwa-192.png', optimize=True)
    icon(512, 0.92).save(PUB / 'pwa-512.png', optimize=True)
    icon(180, 0.90).save(PUB / 'apple-touch-icon.png', optimize=True)
    icon(512, 0.72).save(PUB / 'maskable-512.png', optimize=True)  # K inside the inner 56%, well within the 80% safe zone
    icon(32, 0.96, radius=7).save(PUB / 'favicon-32.png', optimize=True)
    icon(48, 0.96, radius=11).save(PUB / 'favicon-48.png', optimize=True)
    og().save(PUB / 'og.png', optimize=True)
    print('done')
