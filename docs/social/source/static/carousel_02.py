"""Carousel 02: Pulang tanpa muter basement (cari kendaraan). Slide 04 is the motion slide."""
from kit import *
from road import Road, draw_car

OUT = ROOT / 'rendered' / 'carousel-02'

# Steps on slide 04: the road is the timeline, one waypoint per step.
STEP_Y = [600, 790, 980]
STEP_X = 3240 + 960
STEPS = [
    ('SAAT PARKIR', 'Simpan lokasi', 'Lantai, zona, pilar. Tambah foto kalau perlu.'),
    ('SAAT PULANG', 'Cari kendaraan', 'Buka Aktivitas, lihat petakmu dalam 3D.'),
    ('DARI LOBI', 'Ikuti rute', 'Jalan kaki dari lobi lift terdekat.'),
]

ROAD = Road(
    route=[
        (880, 1440),    # 01 comes up the right side
        (880, 130),
        (2100, 130),    # 02 crosses above the headline
        (2100, 1270),   # ...and down the right margin
        (2665, 1270),   # 03 enters along the bottom
        (2665, 130),    # climbs the gap between copy and phone
        (4200, 130),    # 04 enters at the top (motion slide)
        (4200, 1270),   # the steps sit along this stretch
        (5080, 1270),   # 05 arrives
        (5080, 1150),
    ],
    streets=[
        ((880, 960), (700, 960)), ((880, 960), (1060, 960)), ((880, 130), (880, -40)),
        ((1500, 130), (1500, -40)), ((2100, 1270), (1700, 1270)),
        ((2665, 1270), (3150, 1270)), ((2665, 900), (2300, 900)), ((2665, 130), (2400, 130)),
        ((3700, 130), (3700, -40)), ((4200, 1270), (4200, 1390)),
        ((5080, 1270), (5390, 1270)), ((4700, 1270), (4700, 1390)),
    ],
    waypoints=[(STEP_X, y + 75) for y in STEP_Y],
)

def slide1():
    im=gradient('#071B18','#064735',[(855,370,720,700,'#27A979',.54),(980,1210,750,560,'#0E9668',.48)],11)
    ROAD.draw(im,0,True)
    d=ImageDraw.Draw(im)
    header(im,1)
    text(d,'Pulang tanpa\nmuter basement.',78,520,76,WHITE,650,93)
    text(d,'Simpan lokasi parkir sekali, lalu ikuti\nrutenya waktu mau pulang.',83,758,27,'#CEE6DA',450,40)
    return im.convert('RGB')

def slide2():
    im=gradient('#F6F8F3','#DDEEE3',[(925,1010,840,900,'#B5DEC8',.40),(100,70,700,800,'#FFFFFF',.65)],12)
    ROAD.draw(im,1,False)
    header(im,2,True)
    d=ImageDraw.Draw(im)
    text(d,'Basement itu\nsemua mirip.',76,207,74,INK,620,89)
    text(d,'Yang biasanya terlupa waktu mau pulang.',80,426,24,MUTED2,450)
    rows=[('Lantai','B1 atau B2? Semua lantai terlihat sama.'),
          ('Zona dan pilar','Huruf dan warnanya sudah lewat dari ingatan.'),
          ('Lobi lift','Tadi turun dari lift yang mana?')]
    y=640
    for title,body in rows:
        line(d,(80,y,970,y),'#A9C6B5',1)
        text(d,title,80,y+24,31,INK,650)
        text(d,body,80,y+74,20,MUTED2,450)
        y+=164
    line(d,(80,y,970,y),'#A9C6B5',1)
    return im.convert('RGB')

def slide3():
    im=gradient('#081B19','#0B493A',[(900,370,650,780,'#227B5C',.45),(90,1090,650,650,'#0C6650',.3)],13)
    ROAD.draw(im,2,True)
    halo=Image.new('RGBA',(W,H),(0,0,0,0))
    ImageDraw.Draw(halo).rounded_rectangle((554,201,1014,1154),radius=47,fill=(0,0,0,125))
    im.alpha_composite(halo.filter(ImageFilter.GaussianBlur(30)))
    im.alpha_composite(crop_screenshot('find-car-3d.png'),(566,196))
    header(im,3)
    d=ImageDraw.Draw(im)
    text(d,'Petakmu,\ndalam 3D.',76,279,68,WHITE,640,86)
    text(d,'Lantai, zona, dan pilar,\nlengkap dengan rute jalan\nkaki dari lobi.',82,514,25,'#C8E2D4',450,40)
    text(d,'Tampilan prototipe · data simulasi',566,1160,16,'#B7D3C4',500)
    return im.convert('RGB')

def slide4():
    """Static stand-in for the motion slide (same layout as motion/carousel-02)."""
    im=gradient('#F6F8F3','#DCEEE2',[(900,900,850,1000,'#C1E1CE',.44),(0,60,760,620,'#FFFFFF',.65)],14)
    ROAD.draw(im,3,False)
    draw_car(im,960,960,90,on_light=True)
    header(im,4,True)
    d=ImageDraw.Draw(im)
    text(d,'Tiga langkah\nke mobilmu.',76,207,74,INK,620,89)
    text(d,'Simpan waktu parkir, cari waktu pulang.',81,426,23,MUTED2,450)
    for y,(label,title,body) in zip(STEP_Y,STEPS):
        line(d,(80,y,880,y),'#A4C3B0',1)
        tracking(d,label,80,y+26,14,'#3E6A56',750,2)
        text(d,title,80,y+56,33,INK,650)
        text(d,body,80,y+104,20,MUTED2,450)
    line(d,(80,1170,880,1170),'#A4C3B0',1)
    return im.convert('RGB')

def slide5():
    im=gradient('#0A523E','#05251F',[(140,250,750,700,'#15A974',.72),(1010,1050,830,900,'#0B825D',.47)],15)
    ROAD.draw(im,4,True)
    draw_car(im,760,1200,-90)
    ROAD.draw_destination(im,4,font(25,800))
    header(im,5)
    d=ImageDraw.Draw(im)
    text(d,'Parkir diingat,\npulang tenang.',76,323,84,WHITE,620,103)
    text(d,'Simpan lokasi parkir gratis,\ntanpa langganan.',81,599,29,'#D1E8DC',450,43)
    line(d,(81,916,999,916),'#7FC7A3',1)
    text(d,'kenneth-park.web.app',77,953,43,WHITE,600)
    text(d,'↗',933,953,46,MINT,500)
    return im.convert('RGB')

if __name__ == '__main__':
    ROAD.export_motion(3, MOTION/'carousel-02', dark=False)
    for p in save_set([slide1(),slide2(),slide3(),slide4(),slide5()], OUT):
        print(p)
