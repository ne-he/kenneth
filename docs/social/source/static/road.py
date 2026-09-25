"""One road that runs through a whole carousel.

The five slides sit side by side as a 5400 x 1350 panorama. The road is a
single polyline in that space with rounded, street-like corners, drawn the way
the KENNETH app draws a navigation route: soft green glow, white casing, and a
green core whose colour follows route progress. Faint side streets make it read
as a map rather than a decorative line.

Each carousel defines its own `Road(route, streets, waypoints)`. The static
slides (PIL) and any motion slide (Hyperframes) both read that same object, so
the road meets itself exactly at every slide edge.
"""
import json
import re
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 1080, 1350
SS = 2  # supersample for clean edges
RADIUS = 40
PAD = 90  # how far past the slide edge a motion path runs, so the car can leave the frame

ROUTE_START = (52, 211, 153)   # #34d399, app route-line start
ROUTE_END = (5, 150, 105)      # #059669, app ROUTE_COLOR
CASING = (247, 251, 247)

# Sizes at 1080 px. The app uses 16 / 9 / 5.5 on a phone map; scaled for a post.
BED_W, STREET_W = 38, 20
GLOW_W, CASING_W, CORE_W = 30, 15, 9
BED_DARK = (220, 255, 236, 17)
BED_LIGHT = (15, 38, 32, 15)


def _unit(a, b):
    v = np.array(b, float) - np.array(a, float)
    return v / np.linalg.norm(v)


def route_color(progress):
    p = float(np.clip(progress, 0, 1))
    return tuple(int(round(a + (b - a) * p)) for a, b in zip(ROUTE_START, ROUTE_END))


def hex_color(c):
    return '#%02x%02x%02x' % c


class Road:
    def __init__(self, route, streets=(), waypoints=()):
        """route: corner points in panorama coords (slide k spans x = 1080k .. 1080(k+1)).
        streets: (attached point, free end) pairs; they fade toward the free end.
        waypoints: points on the route marked with a small stop dot (e.g. steps)."""
        self.route = route
        self.streets = list(streets)
        self.waypoints = list(waypoints)
        self.pts, self.dist = self._sample()
        self.total = float(self.dist[-1])

    # ---------- geometry ----------

    def segments(self):
        """Straight and quadratic segments of the rounded polyline."""
        pts = [np.array(p, float) for p in self.route]
        segs = []
        cur = pts[0]
        for i in range(1, len(pts) - 1):
            a = pts[i] - RADIUS * _unit(pts[i - 1], pts[i])
            b = pts[i] + RADIUS * _unit(pts[i], pts[i + 1])
            segs.append(('L', cur, a))
            segs.append(('Q', a, pts[i], b))
            cur = b
        segs.append(('L', cur, pts[-1]))
        return segs

    def _sample(self, step=1.0):
        out = []
        for seg in self.segments():
            if seg[0] == 'L':
                _, p0, p1 = seg
                n = max(2, int(np.linalg.norm(p1 - p0) / step))
                pts = [p0 + (p1 - p0) * t for t in np.linspace(0, 1, n)]
            else:
                _, p0, c, p1 = seg
                pts = [(1 - t) ** 2 * p0 + 2 * (1 - t) * t * c + t * t * p1 for t in np.linspace(0, 1, 40)]
            if out:
                pts = pts[1:]
            out.extend(pts)
        arr = np.array(out)
        d = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(arr, axis=0), axis=1))])
        return arr, d

    def progress_at(self, point):
        i = int(np.argmin(np.linalg.norm(self.pts - np.array(point, float), axis=1)))
        return self.dist[i] / self.total

    def slide_path(self, k):
        """SVG path d for the part of the route on slide k, in slide coordinates,
        extended PAD px past the frame so a car can enter and leave off-screen.
        Corners must not sit on slide edges (guide rule), so only straight
        segments are ever trimmed."""
        x0, x1 = k * W - PAD, (k + 1) * W + PAD
        parts, first, last = [], None, None
        for seg in self.segments():
            if seg[0] == 'L':
                p0, p1 = seg[1].copy(), seg[2].copy()
                lo, hi = min(p0[0], p1[0]), max(p0[0], p1[0])
                if hi < x0 or lo > x1:
                    continue
                for p in (p0, p1):
                    p[0] = np.clip(p[0], x0, x1)
                if not parts:
                    parts.append('M%.1f,%.1f' % (p0[0] - k * W, p0[1]))
                    first = p0
                parts.append('L%.1f,%.1f' % (p1[0] - k * W, p1[1]))
                last = p1
            else:
                _, a, c, b = seg
                if b[0] < x0 or a[0] > x1:
                    continue
                if not parts:
                    parts.append('M%.1f,%.1f' % (a[0] - k * W, a[1]))
                    first = a
                parts.append('Q%.1f,%.1f %.1f,%.1f' % (c[0] - k * W, c[1], b[0] - k * W, b[1]))
                last = b
        return ' '.join(parts), first, last

    # ---------- static slides (PIL) ----------

    def _local(self, pts, k):
        return [((x - k * W) * SS, y * SS) for x, y in pts]

    def draw(self, im, k, dark):
        """Draw the road, side streets and waypoints onto slide k (0-based)."""
        bed = BED_DARK if dark else BED_LIGHT
        layer = Image.new('RGBA', (W * SS, H * SS), (0, 0, 0, 0))
        d = ImageDraw.Draw(layer)
        for a, b in self.streets:
            a, b = np.array(a, float), np.array(b, float)
            n = 60
            for i in range(n):
                t0, t1 = i / n, (i + 1) / n
                alpha = int(bed[3] * (1 - t0) ** 1.2)
                d.line(self._local([a + (b - a) * t0, a + (b - a) * t1], k), fill=bed[:3] + (alpha,), width=STREET_W * SS)
        d.line(self._local(self.pts[::3], k), fill=bed, width=BED_W * SS, joint='curve')
        im.alpha_composite(layer.resize((W, H), Image.Resampling.LANCZOS))

        glow = Image.new('RGBA', (W * SS, H * SS), (0, 0, 0, 0))
        ImageDraw.Draw(glow).line(self._local(self.pts[::3], k), fill=ROUTE_END + (95,), width=GLOW_W * SS, joint='curve')
        glow = glow.filter(ImageFilter.GaussianBlur(9 * SS))
        im.alpha_composite(glow.resize((W, H), Image.Resampling.LANCZOS))

        line = Image.new('RGBA', (W * SS, H * SS), (0, 0, 0, 0))
        d = ImageDraw.Draw(line)
        d.line(self._local(self.pts[::3], k), fill=CASING + (215,), width=CASING_W * SS, joint='curve')
        chunk = 24
        for i in range(0, len(self.pts) - 1, chunk):
            c = route_color(self.dist[i] / self.total)
            d.line(self._local(self.pts[i:i + chunk + 1], k), fill=c + (255,), width=CORE_W * SS, joint='curve')
        for x, y in self.waypoints:
            x, y = (x - k * W) * SS, y * SS
            d.ellipse((x - 11 * SS, y - 11 * SS, x + 11 * SS, y + 11 * SS), fill=CASING + (255,))
            d.ellipse((x - 5.5 * SS, y - 5.5 * SS, x + 5.5 * SS, y + 5.5 * SS), fill=ROUTE_END + (255,))
        im.alpha_composite(line.resize((W, H), Image.Resampling.LANCZOS))

    def draw_destination(self, im, k, font=None, label='P'):
        """Parking marker at the end of the route, app-style: green pin, white P."""
        end, prev = np.array(self.route[-1], float), np.array(self.route[-2], float)
        x, y = end + 44 * _unit(prev, end)  # just past the end of the road
        x -= k * W
        S, size = 4, 120
        pin = Image.new('RGBA', (size * S, size * S), (0, 0, 0, 0))
        d = ImageDraw.Draw(pin)
        c = size * S / 2
        d.ellipse((c - 36 * S, c - 36 * S, c + 36 * S, c + 36 * S), fill=ROUTE_END + (55,))
        d.ellipse((c - 25 * S, c - 25 * S, c + 25 * S, c + 25 * S), fill=(247, 251, 247, 255))
        d.ellipse((c - 21 * S, c - 21 * S, c + 21 * S, c + 21 * S), fill=ROUTE_END + (255,))
        pin = pin.resize((size, size), Image.Resampling.LANCZOS)
        im.alpha_composite(pin, (int(x - size / 2), int(y - size / 2)))
        if font is not None:
            ImageDraw.Draw(im).text((x, y + 1), label, font=font, fill=(247, 251, 247), anchor='mm')
        return x, y

    # ---------- motion slides (Hyperframes) ----------

    def export_motion(self, k, project_dir, dark=True):
        """Write road.js for slide k and put the static path `d` into index.html."""
        d, first, last = self.slide_path(k)
        streets = [[list(a), list(b)] for a, b in self.streets
                   if max(a[0], b[0]) > k * W and min(a[0], b[0]) < (k + 1) * W]
        streets = [[[a[0] - k * W, a[1]], [b[0] - k * W, b[1]]] for a, b in streets]
        waypoints = [[x - k * W, y] for x, y in self.waypoints if k * W < x < (k + 1) * W]
        bed = BED_DARK if dark else BED_LIGHT
        data = {
            'route': d,
            'gradient': [first[0] - k * W, first[1], last[0] - k * W, last[1]],
            'colorStart': hex_color(route_color(self.progress_at(first))),
            'colorEnd': hex_color(route_color(self.progress_at(last))),
            'bed': {'color': '#%02x%02x%02x' % bed[:3], 'opacity': round(bed[3] / 255, 3)},
            'streets': streets,
            'waypoints': waypoints,
            'sizes': {'bed': BED_W, 'street': STREET_W, 'glow': GLOW_W, 'casing': CASING_W, 'core': CORE_W},
        }
        project_dir = Path(project_dir)
        (project_dir / 'road.js').write_text('window.KENNETH_ROAD = ' + json.dumps(data, indent=2) + ';\n', encoding='utf-8')
        # Hyperframes measures the route at load, so it must be a static attribute.
        html = project_dir / 'index.html'
        if html.exists():
            src = html.read_text(encoding='utf-8')
            src = re.sub(r'(<path id="(?:bed|route-glow|route-casing|route-core)" )(?:d="[^"]*" )?',
                         lambda m: m.group(1) + f'd="{d}" ', src)
            src = re.sub(r'(<linearGradient id="core-grad" gradientUnits="userSpaceOnUse") x1="[^"]*" y1="[^"]*" x2="[^"]*" y2="[^"]*"',
                         lambda m: m.group(1) + ' x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f"' % tuple(data['gradient']), src)
            html.write_text(src, encoding='utf-8')


CAR_ON_DARK = {'body': (247, 251, 247), 'glass': (15, 38, 32), 'roof': (214, 234, 223)}
CAR_ON_LIGHT = {'body': (15, 38, 32), 'glass': (207, 232, 218), 'roof': (36, 70, 59)}


def draw_car(im, x, y, angle, on_light=False):
    """Top-down car, nose pointing along `angle` degrees (0 = +x, 90 = down).
    White on dark slides; ink on light slides so it never disappears."""
    c = CAR_ON_LIGHT if on_light else CAR_ON_DARK
    S = 4
    cw, ch = 120, 120
    car = Image.new('RGBA', (cw * S, ch * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(car)
    cx, cy = cw * S / 2, ch * S / 2
    r = lambda x0, y0, x1, y1: (cx + x0 * S, cy + y0 * S, cx + x1 * S, cy + y1 * S)
    d.rounded_rectangle(r(-29, -15, 29, 15), radius=8 * S, fill=c['body'] + (255,))
    d.rounded_rectangle(r(5, -11.5, 15, 11.5), radius=3 * S, fill=c['glass'] + (225,))
    d.rounded_rectangle(r(-21, -10.5, -14, 10.5), radius=2.5 * S, fill=c['glass'] + (200,))
    d.rounded_rectangle(r(-13, -11, 4, 11), radius=3 * S, fill=c['roof'] + (255,))
    d.ellipse(r(24, -12, 28, -7), fill=(255, 250, 225, 255))
    d.ellipse(r(24, 7, 28, 12), fill=(255, 250, 225, 255))
    shadow = Image.new('RGBA', car.size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle(r(-28, -13, 30, 17), radius=9 * S, fill=(0, 12, 8, 80 if on_light else 120))
    shadow = shadow.filter(ImageFilter.GaussianBlur(5 * S))
    shadow.alpha_composite(car)
    out = shadow.rotate(-angle, resample=Image.Resampling.BICUBIC).resize((cw, ch), Image.Resampling.LANCZOS)
    im.alpha_composite(out, (int(round(x - cw / 2)), int(round(y - ch / 2))))
