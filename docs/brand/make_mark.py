"""Lift the K off its black field, so the logo sits on the app's own background.

Usage: python docs/brand/make_mark.py [repo root]

The K (roads seen from above) was drawn on pure black, and the app showed it inside a black
square. Here the field goes: the dark pixels joined to the image border become transparent, and
the soft edge between road and field keeps its partial alpha, its colour un-mixed from the black,
so the K sits cleanly on a light or a dark background. Dark pixels the road encloses (the car's
windows) stay as drawn. Needs ffmpeg on the PATH for the loop, which is re-rendered from the
480 px source clip docs/brand/kenneth-loop-480.mp4 (the K and its car on black).

Writes:
  docs/brand/kenneth-k.png              transparent master, cropped to the K
  src/assets/logo-mark.webp             the mark in the app, 192 px tall
  public/brand/k-mark.webp              the splash, 288 px tall
  public/brand/loop-light|dark.mp4|webm the onboarding loop on the light and the dark surface
  public/brand/poster-light|dark.jpg    its first frame, shown until the video plays
"""
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[2]
BRAND = ROOT / 'docs' / 'brand'
PUB = ROOT / 'public' / 'brand'
# The onboarding loop plays inside a card, so its field is the card's colour: --surface in src/index.css.
SURFACE = {'light': (255, 255, 255), 'dark': (21, 21, 26)}


def lift(rgb: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Colour without the black, and alpha. Road pixels are never darker than about 60, the field is 0."""
    lum = rgb.max(axis=2).astype(np.float32)
    labels, _ = ndimage.label(lum < 18)
    edge = np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]])
    field = np.isin(labels, np.unique(edge[edge > 0]))
    rim = ndimage.binary_dilation(field, iterations=2) & ~field
    # On the rim a pixel is the road's colour mixed with black: c = a * road. The road's colour is the brightest
    # nearby pixel, white on a lane edge, grey where a road ends flat.
    near = ndimage.maximum_filter(lum, size=7)
    alpha = np.ones_like(lum)
    alpha[field] = 0
    alpha[rim] = np.clip(lum / np.maximum(near, 40), 0, 1)[rim]
    a = np.maximum(alpha, 1e-3)[..., None]
    color = np.where(alpha[..., None] > 0, rgb.astype(np.float32) / a, 0)
    return np.clip(color, 0, 255), alpha


def on(color: np.ndarray, alpha: np.ndarray, bg: tuple[int, int, int]) -> Image.Image:
    a = alpha[..., None]
    return Image.fromarray(np.round(color * a + np.array(bg, np.float32) * (1 - a)).astype(np.uint8))


def rgba(color: np.ndarray, alpha: np.ndarray) -> Image.Image:
    return Image.fromarray(np.dstack([color, alpha * 255]).round().astype(np.uint8), 'RGBA')


def mark() -> None:
    color, alpha = lift(np.array(Image.open(BRAND / 'kenneth-logo-1024.png').convert('RGB')))
    k = rgba(color, alpha)
    k = k.crop(k.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox())
    k.save(BRAND / 'kenneth-k.png', optimize=True)
    for height, path in ((192, ROOT / 'src' / 'assets' / 'logo-mark.webp'), (288, PUB / 'k-mark.webp')):
        small = k.resize((round(k.width * height / k.height), height), Image.LANCZOS)
        small.save(path, 'WEBP', quality=90, method=6)
        print(path.relative_to(ROOT), small.size)


def loop() -> None:
    ffmpeg = shutil.which('ffmpeg')
    if not ffmpeg:
        sys.exit('ffmpeg is not on the PATH')
    with tempfile.TemporaryDirectory() as tmp:
        src = Path(tmp) / 'src'
        src.mkdir()
        subprocess.run([ffmpeg, '-v', 'error', '-i', str(BRAND / 'kenneth-loop-480.mp4'), '-vsync', '0', str(src / '%04d.png')], check=True)
        frames = sorted(src.glob('*.png'))
        for theme, bg in SURFACE.items():
            out = Path(tmp) / theme
            out.mkdir()
            for f in frames:
                on(*lift(np.array(Image.open(f).convert('RGB'))), bg).save(out / f.name)
            Image.open(out / frames[0].name).save(PUB / f'poster-{theme}.jpg', quality=88)
            pattern = str(out / '%04d.png')
            subprocess.run([ffmpeg, '-v', 'error', '-y', '-framerate', '30', '-i', pattern, '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
                            '-crf', '26', '-preset', 'slow', '-movflags', '+faststart', '-an', str(PUB / f'loop-{theme}.mp4')], check=True)
            subprocess.run([ffmpeg, '-v', 'error', '-y', '-framerate', '30', '-i', pattern, '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuv420p',
                            '-crf', '38', '-b:v', '0', '-row-mt', '1', '-an', str(PUB / f'loop-{theme}.webm')], check=True)
            print(f'loop-{theme}: {len(frames)} frames')


if __name__ == '__main__':
    mark()
    loop()
