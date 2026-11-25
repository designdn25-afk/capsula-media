#!/usr/bin/env python3
"""Generatorul de imagini scrie uneori greșit numele de pe plăcuțe și sigla văzută de departe. Aici se rescriu peste imagine:
plăcuță = (x0, y0, x1, y1, text) în pixelii imaginii de 4096 × 2048; text gol = plăcuță fără scris; 'LOGO' = sigla adevărată.
   python3 fixsemne.py <imaginea generată> <ieșire .jpg> '<listă JSON>'"""
import sys, json, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np
src, out, L = sys.argv[1], sys.argv[2], json.loads(sys.argv[3])
im = Image.open(src).convert('RGB').resize((4096, 2048), Image.LANCZOS)
LOGO = Image.open(os.path.dirname(os.path.abspath(__file__)) + '/../demo/img/logo.png').convert('RGBA')
F = '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'
def patru(q, t):   # plăcuță văzută pieziș: cele patru colțuri ale feței (stânga-sus, dreapta-sus, dreapta-jos, stânga-jos)
    import cv2
    global im
    A = np.asarray(im).copy(); cx, cy = int(sum(p[0] for p in q) / 4), int(sum(p[1] for p in q) / 4); R_ = A[min(p[1] for p in q):max(p[1] for p in q), min(p[0] for p in q):max(p[0] for p in q)].reshape(-1, 3).astype(int); G_ = R_[(R_[:, 1] > R_[:, 0] + 40) & (R_[:, 1] > R_[:, 2] + 40) & (R_[:, 0] < 90)]; col = [int(v) for v in np.median(G_ if len(G_) > 20 else R_, axis=0)]
    w, h = 900, 250; p = Image.new('RGB', (w, h), tuple(col)); d = ImageDraw.Draw(p); f = ImageFont.truetype(F, 150); b = d.textbbox((0, 0), t, font=f)
    d.text(((w - (b[2] - b[0])) / 2 - b[0], (h - (b[3] - b[1])) / 2 - b[1]), t, font=f, fill=(240, 244, 238))
    Mx = cv2.getPerspectiveTransform(np.float32([[0, 0], [w, 0], [w, h], [0, h]]), np.float32(q)); W_, H_ = im.size
    wp = cv2.warpPerspective(np.asarray(p), Mx, (W_, H_), flags=cv2.INTER_AREA); mk = cv2.warpPerspective(np.full((h, w), 255, np.uint8), Mx, (W_, H_), flags=cv2.INTER_AREA)
    mk = cv2.GaussianBlur(mk, (0, 0), .7)[..., None] / 255.; im = Image.fromarray((A * (1 - mk) + wp * mk).astype(np.uint8))
for e in L:
    if len(e) == 2: patru(e[0], e[1]); continue
    x0, y0, x1, y1, t = e
    w, h = x1 - x0, y1 - y0; K = 4
    if t == 'LOGO':
        p = Image.new('RGB', (w * K, h * K), (250, 250, 248)); lg = LOGO.copy(); lg.thumbnail((int(w * K * .86), int(h * K * .86)), Image.LANCZOS)
        p.paste(lg, ((w * K - lg.width) // 2, (h * K - lg.height) // 2), lg)
    else:
        a = np.asarray(im.crop((x0, y0, x1, y1))).reshape(-1, 3).astype(int); g = a[(a[:, 1] > a[:, 0] + 15) & (a[:, 1] > a[:, 2] + 15)]
        col = tuple(int(v) for v in np.median(g if len(g) > 20 else a, axis=0)); p = Image.new('RGB', (w * K, h * K), col)
        if t:
            d = ImageDraw.Draw(p); fs = int(h * K * .62)
            while fs > 8:
                f = ImageFont.truetype(F, fs); b = d.textbbox((0, 0), t, font=f)
                if b[2] - b[0] <= w * K * .86: break
                fs -= 2
            d.text(((w * K - (b[2] - b[0])) / 2 - b[0], (h * K - (b[3] - b[1])) / 2 - b[1]), t, font=f, fill=(246, 248, 244))
    p = p.resize((w, h), Image.LANCZOS).filter(ImageFilter.GaussianBlur(.35)); im.paste(p, (x0, y0))
im.save(out, quality=86, optimize=True, progressive=True); print(out, len(L))
