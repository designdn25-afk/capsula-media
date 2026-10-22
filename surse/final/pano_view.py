#!/usr/bin/env python3
"""Decupează o fotografie obișnuită (perspectivă) dintr-o panoramă 360° equirectangulară.

Exemplu:
  python3 pano_view.py pano.png out.webp --yaw 40 --pitch -5 --fov 75 --w 2400 --h 1350
yaw: 0 = centrul panoramei, pozitiv spre dreapta (grade). pitch: pozitiv în sus. fov: unghiul orizontal (grade).
--preview: salvează și o panoramă micșorată cu grilă de grade (yaw/pitch), ca să alegi direcția.
"""
import argparse, numpy as np
from PIL import Image, ImageDraw
Image.MAX_IMAGE_PIXELS = None

def view(eq, yaw, pitch, fov, W, H, roll=0.0):
    EH, EW = eq.shape[:2]
    f = (W / 2) / np.tan(np.radians(fov) / 2)
    xs = np.arange(W) - (W - 1) / 2
    ys = np.arange(H) - (H - 1) / 2
    x, y = np.meshgrid(xs, ys)
    z = np.full_like(x, f)
    v = np.stack([x, -y, z], -1)
    v /= np.linalg.norm(v, axis=-1, keepdims=True)
    cr, sr = np.cos(np.radians(roll)), np.sin(np.radians(roll))
    Rz = np.array([[cr, -sr, 0], [sr, cr, 0], [0, 0, 1]])
    cp, sp = np.cos(np.radians(pitch)), np.sin(np.radians(pitch))
    Rx = np.array([[1, 0, 0], [0, cp, sp], [0, -sp, cp]])
    cy, sy = np.cos(np.radians(yaw)), np.sin(np.radians(yaw))
    Ry = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]])
    v = v @ (Ry @ Rx @ Rz).T
    lon = np.arctan2(v[..., 0], v[..., 2])
    lat = np.arcsin(np.clip(v[..., 1], -1, 1))
    u = (lon / (2 * np.pi) + 0.5) * EW - 0.5
    w = (0.5 - lat / np.pi) * EH - 0.5
    # biliniar
    u0 = np.floor(u).astype(int); w0 = np.floor(w).astype(int)
    du = (u - u0)[..., None]; dw = (w - w0)[..., None]
    u0m = u0 % EW; u1m = (u0 + 1) % EW
    w0c = np.clip(w0, 0, EH - 1); w1c = np.clip(w0 + 1, 0, EH - 1)
    a = eq[w0c, u0m]; b = eq[w0c, u1m]; c = eq[w1c, u0m]; d = eq[w1c, u1m]
    out = (a * (1 - du) * (1 - dw) + b * du * (1 - dw) + c * (1 - du) * dw + d * du * dw)
    return np.clip(out, 0, 255).astype(np.uint8)

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('src'); ap.add_argument('out')
    ap.add_argument('--yaw', type=float, default=0); ap.add_argument('--pitch', type=float, default=0)
    ap.add_argument('--roll', type=float, default=0)
    ap.add_argument('--fov', type=float, default=75)
    ap.add_argument('--w', type=int, default=2400); ap.add_argument('--h', type=int, default=1350)
    ap.add_argument('--q', type=int, default=84)
    ap.add_argument('--preview', action='store_true')
    a = ap.parse_args()
    im = Image.open(a.src).convert('RGB')
    if a.preview:
        p = im.resize((2048, 1024), Image.LANCZOS); d = ImageDraw.Draw(p)
        for yaw in range(-180, 181, 30):
            x = (yaw / 360 + 0.5) * 2048; d.line([(x, 0), (x, 1024)], fill=(255, 0, 0)); d.text((x + 3, 3), str(yaw), fill=(255, 255, 0))
        for pit in range(-60, 61, 30):
            y = (0.5 - pit / 180) * 1024; d.line([(0, y), (2048, y)], fill=(255, 0, 0)); d.text((3, y + 3), str(pit), fill=(255, 255, 0))
        p.save(a.out, quality=82); print('preview', a.out); raise SystemExit
    eq = np.asarray(im).astype(np.float32)
    o = Image.fromarray(view(eq, a.yaw, a.pitch, a.fov, a.w, a.h, a.roll))
    kw = {'quality': a.q}
    if a.out.endswith('.webp'): kw['method'] = 6
    o.save(a.out, **kw); print('ok', a.out, o.size)
