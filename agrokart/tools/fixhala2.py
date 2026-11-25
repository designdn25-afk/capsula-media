#!/usr/bin/env python3
"""Oprirea a doua (s2) a fost făcută înainte de peretele despărțitor: în depărtare, în hala tractoarelor, apăreau mini excavatoare
(clientul, 25 nov 2026: „uite aici se vede și excavatorul”). Aici, partea din depărtare a lui s2 se înlocuiește cu ce se vede din
oprirea s3 privind înainte (tractoarele mari, peretele cu ușă, camera galbenă), micșorat în jurul liniei orizontului. Plăcuțele și
tractoarele de aproape rămân. Fără credite.   python3 fixhala2.py <s2 de intrare> <ieșire>"""
import sys, os, numpy as np
from PIL import Image, ImageFilter, ImageDraw
D = os.path.dirname(os.path.abspath(__file__)) + '/../demo/img/showroom/'
a = np.asarray(Image.open(sys.argv[1]).convert('RGB')).copy(); b = np.asarray(Image.open(D + 's3.jpg').convert('RGB').filter(ImageFilter.GaussianBlur(.8)))
K = float(os.environ.get('K', .52)); CX, CY = 2048, 1024
yy, xx = np.mgrid[0:2048, 0:4096]
sx = np.clip(((xx - CX) / K + CX).round().astype(int), 0, 4095); sy = np.clip(((yy - CY) / K + CY).round().astype(int), 0, 2047); src = b[sy, sx]
m = Image.new('L', (4096, 2048), 0); d = ImageDraw.Draw(m)
d.polygon(eval(os.environ.get('POLI', '[(1716,700),(2400,700),(2400,1118),(1716,1118)]')), fill=255)
for r in eval(os.environ.get('PASTREAZA', '[]')): d.polygon(r, fill=0) if len(r) > 2 else d.rectangle([r[0], r[1]], fill=0)
mk = np.asarray(m.filter(ImageFilter.GaussianBlur(float(os.environ.get('MOALE', 5)))))[..., None] / 255.
out = (a * (1 - mk) + src * mk).astype(np.uint8); Image.fromarray(out).save(sys.argv[2], quality=86, optimize=True, progressive=True)
