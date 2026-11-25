#!/usr/bin/env python3
"""Camera mini excavatoarelor (s4): prin ușă, generatorul lăsase tractoarele „pătrățoase” (clientul, 25 nov 2026: „uite din spate
cum se vede”). Aici, în golul ușii se pune vederea reală a halei, luată din imaginea opririi s3 privind înapoi (aceleași unghiuri,
micșorată în jurul liniei orizontului, ca de la câțiva metri mai departe). Fără credite.   python3 fixusa.py   (schimbă s4.jpg pe loc)"""
import os, numpy as np
from PIL import Image, ImageFilter
D = os.path.dirname(os.path.abspath(__file__)) + '/../demo/img/showroom/'
a = np.roll(np.asarray(Image.open(D + 's4.jpg').convert('RGB')), 2048, axis=1).copy(); b = np.roll(np.asarray(Image.open(D + 's3.jpg').convert('RGB')), 2048, axis=1)
X0, X1, CX, CY, K = 1799, 2282, 2048, 1024, .6
yy, xx = np.mgrid[0:2048, 0:4096]; t = ((xx - 2040) / 240.) ** 2
m = (xx >= X0) & (xx <= X1) & (yy >= 823 + 15 * t) & (yy <= 1179 - 9 * t) & ~((xx < 1840) & (yy > 1086) & (yy < 1148)) & ~((xx > 1803) & (xx < 1820) & (yy >= 1148))
sx = np.clip(((xx - CX) / K + CX).round().astype(int), 0, 4095); sy = np.clip(((yy - CY) / K + CY).round().astype(int), 0, 2047)
src = np.asarray(Image.fromarray(b).filter(ImageFilter.GaussianBlur(.7)))[sy, sx]   # (micșorare: puțin netezită înainte)
mk = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2)))[..., None] / 255.
a = (a * (1 - mk) + src * mk).astype(np.uint8)
Image.fromarray(np.roll(a, -2048, axis=1)).save(D + 's4.jpg', quality=86, optimize=True, progressive=True)
Image.fromarray(a).crop((1500, 650, 2600, 1300)).save('/tmp/usa.jpg', quality=85)
