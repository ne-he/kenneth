"""Shared drawing helpers for KENNETH carousels (gradient, type, header, screenshot)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / 'assets'
# Inside the KENNETH repo (docs/social/source/static) the app screenshots already live in docs/screens.
SCREENS = ROOT.parents[2] / 'screens' if (ROOT.parents[2] / 'screens').exists() else ASSETS / 'docs' / 'screens'
MOTION = ROOT.parent / 'motion'
W, H = 1080, 1350
FONT = ROOT / 'fonts' / 'PlusJakartaSans.ttf'

INK = '#0F2620'
MUTED = '#577168'
MUTED2 = '#4A6359'  # light-bg secondary text that passes WCAG AA at 20-24 px
PALE = '#F4F8F3'
WHITE = '#F7FBF7'
MINT = '#A9E9CB'
GREEN = '#18B77B'
RUST = '#B45155'

def rgb(h):
    h=h.lstrip('#')
    return np.array([int(h[i:i+2],16) for i in (0,2,4)],dtype=np.float32)

def font(size, weight=600):
    f=ImageFont.truetype(str(FONT),size)
    f.set_variation_by_axes([weight])
    return f

def gradient(top,bottom,glows=(),seed=1):
    yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
    t=np.clip((yy/H)*.87+(xx/W)*.13,0,1)[...,None]
    a=rgb(top); b=rgb(bottom)
    arr=a[None,None,:]*(1-t)+b[None,None,:]*t
    for cx,cy,rx,ry,color,opacity in glows:
        g=np.exp(-2.0*(((xx-cx)/rx)**2+((yy-cy)/ry)**2))[...,None]*opacity
        arr=arr*(1-g)+rgb(color)[None,None,:]*g
    # Subtle grain keeps the gradients from reading like default UI fills.
    noise=np.random.default_rng(seed).normal(0,1.35,(H,W,1)).astype(np.float32)
    arr=np.clip(arr+noise,0,255).astype(np.uint8)
    return Image.fromarray(arr,'RGB').convert('RGBA')

def tracking(d,text,x,y,size,color,weight=700,space=3):
    f=font(size,weight)
    for c in text:
        d.text((x,y),c,font=f,fill=color)
        x+=d.textlength(c,font=f)+space

def text(d,s,x,y,size,color,weight=600,leading=None):
    f=font(size,weight)
    step=leading or round(size*1.19)
    for line in s.split('\n'):
        d.text((x,y),line,font=f,fill=color)
        y+=step
    return y

def line(d,xy,color,width=2):
    d.line(xy,fill=color,width=width,joint='curve')

def bezier(p0,p1,p2,p3,n=160):
    out=[]
    for t in np.linspace(0,1,n):
        q=(1-t)**3*np.array(p0)+3*(1-t)**2*t*np.array(p1)+3*(1-t)*t*t*np.array(p2)+t**3*np.array(p3)
        out.append(tuple(q))
    return out

def overlay(im,draw_fn):
    layer=Image.new('RGBA',(W,H),(0,0,0,0))
    draw_fn(ImageDraw.Draw(layer))
    im.alpha_composite(layer)

def header(im,page,light=False):
    d=ImageDraw.Draw(im)
    c=INK if light else WHITE
    tracking(d,'KENNETH',78,57,22,c,800,1.2)
    text(d,f'{page:02d} / 05',923,61,16,c,500)

def crop_screenshot(name='explore.png'):
    shot=Image.open(SCREENS/name).convert('RGBA')
    w,h=438,947
    shot=shot.resize((w,h),Image.Resampling.LANCZOS)
    mask=Image.new('L',(w,h),0)
    ImageDraw.Draw(mask).rounded_rectangle((0,0,w-1,h-1),radius=27,fill=255)
    shot.putalpha(mask)
    return shot


def save_set(slides, out):
    """Save slides, a seamless strip (proves the road meets itself) and a spaced preview."""
    out.mkdir(parents=True, exist_ok=True)
    paths=[]
    for i,im in enumerate(slides,1):
        p=out/f'slide-{i:02d}.png'
        im.save(p,optimize=True)
        paths.append(p)
    strip=Image.new('RGB',(W*len(slides),H))
    for i,im in enumerate(slides):
        strip.paste(im,(i*W,0))
    strip.resize((W*len(slides)//3,H//3),Image.Resampling.LANCZOS).save(out/'strip.png',optimize=True)
    preview=Image.new('RGB',(1776,453),'#D7E3DA')
    for i,im in enumerate(slides):
        preview.paste(im.resize((324,405),Image.Resampling.LANCZOS),(24+i*348,24))
    preview.save(out/'preview.png',optimize=True)
    return paths
