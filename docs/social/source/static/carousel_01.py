"""Carousel 01: Parkir dimulai sebelum tiba. Slide 01 is the motion slide."""
from kit import *
from road import Road, draw_car

OUT = ROOT / 'rendered' / 'carousel-01'

ROAD = Road(
    route=[
        (820, -90),     # 01 enters from the top
        (820, 400),
        (940, 400),     # short jog, like turning into the next street
        (940, 1270),
        (2665, 1270),   # 02 runs along the bottom
        (2665, 130),    # 03 climbs the gap between copy and phone
        (4270, 130),    # 04 crosses above the headline
        (4270, 1270),   # ...and down the right margin
        (5180, 1270),   # 05 arrives
        (5180, 1150),   # destination
    ],
    streets=[
        ((820, 400), (600, 400)), ((940, 400), (1060, 400)), ((940, 400), (940, -40)),
        ((1380, 1270), (1380, 1390)), ((1840, 1270), (1840, 1390)),
        ((2665, 1270), (3150, 1270)), ((2665, 900), (2300, 900)), ((2665, 130), (2400, 130)),
        ((3800, 130), (3800, -40)), ((4270, 1270), (3880, 1270)), ((4270, 1270), (4270, 1390)),
        ((5180, 1270), (5390, 1270)), ((4740, 1270), (4740, 1390)),
    ],
)

def slide1():
    """Static stand-in for the motion cover (used in previews and as fallback)."""
    im=gradient('#071B18','#064735',[(855,370,720,700,'#27A979',.54),(980,1210,750,560,'#0E9668',.48)],1)
    ROAD.draw(im,0,True)
    draw_car(im,940,760,90)
    d=ImageDraw.Draw(im)
    header(im,1)
    text(d,'Parkir dimulai\nsebelum tiba.',78,520,76,WHITE,650,93)
    text(d,'Lihat kondisi, antrean, dan pilihan terdekat\nsebelum menentukan arah.',83,758,27,'#CEE6DA',450,40)
    return im.convert('RGB')

def slide2():
    im=gradient('#F6F8F3','#DDEEE3',[(925,1010,840,900,'#B5DEC8',.40),(100,70,700,800,'#FFFFFF',.65)],2)
    ROAD.draw(im,1,False)
    header(im,2,True)
    d=ImageDraw.Draw(im)
    text(d,'Tiba bukan waktu\nterbaik untuk\nmencari parkir.',76,202,64,INK,620,78)
    text(d,'Tiga hal yang perlu diketahui lebih awal.',80,505,24,MUTED,450)
    rows=[('Ketersediaan','Masih ada ruang atau sudah penuh?'),
          ('Antrean gerbang','Pintu mana yang lebih lancar?'),
          ('Pilihan terdekat','Ke mana jika tujuan utama padat?')]
    y=640
    for title,body in rows:
        line(d,(80,y,1000,y),'#A9C6B5',1)
        text(d,title,80,y+24,31,INK,650)
        text(d,body,80,y+74,20,MUTED,450)
        y+=164
    line(d,(80,y,1000,y),'#A9C6B5',1)
    return im.convert('RGB')

def slide3():
    im=gradient('#081B19','#0B493A',[(900,370,650,780,'#227B5C',.45),(90,1090,650,650,'#0C6650',.3)],3)
    ROAD.draw(im,2,True)
    halo=Image.new('RGBA',(W,H),(0,0,0,0))
    hd=ImageDraw.Draw(halo)
    hd.rounded_rectangle((554,201,1014,1154),radius=47,fill=(0,0,0,125))
    halo=halo.filter(ImageFilter.GaussianBlur(30))
    im.alpha_composite(halo)
    shot=crop_screenshot()
    im.alpha_composite(shot,(566,196))
    header(im,3)
    d=ImageDraw.Draw(im)
    text(d,'Lihat dulu.\nPilih arah.',76,279,68,WHITE,640,86)
    text(d,'Kondisi lokasi dan opsi\ndi sekitarnya, dalam\nsatu tampilan.',82,514,25,'#C8E2D4',450,40)
    text(d,'Tampilan prototipe · data simulasi',566,1160,16,'#B7D3C4',500)
    return im.convert('RGB')

def slide4():
    im=gradient('#F6F8F3','#DCEEE2',[(900,900,850,1000,'#C1E1CE',.44),(0,60,760,620,'#FFFFFF',.65)],4)
    ROAD.draw(im,3,False)
    header(im,4,True)
    d=ImageDraw.Draw(im)
    text(d,'Penuh bukan\njalan buntu.',76,207,74,INK,620,89)
    text(d,'Beralih ke gerbang yang lebih lancar atau\ntempat yang masih tersedia di dekatnya.',81,426,23,MUTED,450,36)
    line(d,(117,640,117,1123),'#65AF89',3)
    for cy in (670,858,1040):
        d.ellipse((108,cy-9,126,cy+9),fill='#0D9163')
    line(d,(117,1123,970,1123),'#8EBAA1',1)
    tracking(d,'TUJUAN AWAL',162,620,14,'#53806B',750,2)
    text(d,'Central Park',160,654,33,INK,650)
    text(d,'95%',792,633,59,RUST,650)
    line(d,(161,789,970,789),'#A4C3B0',1)
    tracking(d,'OPSI 1  /  GERBANG',162,807,14,'#53806B',750,2)
    text(d,'Gerbang 3',160,842,33,INK,650)
    text(d,'2 mnt',796,823,46,'#087F58',650)
    line(d,(161,972,970,972),'#A4C3B0',1)
    tracking(d,'OPSI 2  /  LOKASI',162,989,14,'#53806B',750,2)
    text(d,'Neo Soho',160,1025,33,INK,650)
    text(d,'46%',811,1006,46,'#087F58',650)
    text(d,'Data simulasi.',80,1168,18,MUTED,500)
    return im.convert('RGB')

def slide5():
    im=gradient('#0A523E','#05251F',[(140,250,750,700,'#15A974',.72),(1010,1050,830,900,'#0B825D',.47)],5)
    ROAD.draw(im,4,True)
    draw_car(im,860,1200,-90)
    ROAD.draw_destination(im,4,font(25,800))
    header(im,5)
    d=ImageDraw.Draw(im)
    text(d,'Tahu sebelum\nberangkat.',76,323,84,WHITE,620,103)
    text(d,'Rencanakan parkir seperti kamu\nmerencanakan perjalanan.',81,599,29,'#D1E8DC',450,43)
    line(d,(81,916,999,916),'#7FC7A3',1)
    text(d,'kenneth-park.web.app',77,953,43,WHITE,600)
    text(d,'↗',933,953,46,MINT,500)
    return im.convert('RGB')

if __name__ == '__main__':
    ROAD.export_motion(0, MOTION/'carousel-01', dark=True)
    for p in save_set([slide1(),slide2(),slide3(),slide4(),slide5()], OUT):
        print(p)
