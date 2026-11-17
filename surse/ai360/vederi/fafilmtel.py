# python3 fafilmtel.py <folderul cu cele 648 de cadre mari ale poveștii (PNG, 1920×1080, făcute de cadrepoveste.py)> [--mari]
#
# Cadrele poveștii de la deschidere pentru telefoane (ecran îngust, ținut în picioare). Acolo, din lățimea cadrului se vede doar
# partea din jurul capsulei, deci cadrele sunt tăiate la ea (de la x = 614 până la marginea din dreapta, din 1920; destul și
# pentru telefoanele mici, unde se vede ceva mai mult din lățime): de două ori mai puține date decât cu pozele întregi, la aceeași
# claritate pe ecran.
#   site/img/st/film/t/f_NNNN.webp   un cadru din două (și ultimul), 726×600: se aduc în jurul locului la care a ajuns derularea
#   site/img/st/film/t/p_NN.bin      „pachetele mici”: toate cadrele cu număr par, 363×300, câte 27 într-un fișier (54 de cadre ale
#                                    poveștii). Telefonul le aduce pe rând, începând cu cel de la locul curent: așa are repede ce
#                                    arăta la orice loc al poveștii, oricât de iute se derulează.
# Numerele de aici (tăietura, câte cadre pe pachet) sunt aceleași ca în FILM.tel din site/js/story.js. După o refacere se mărește
# „v” de acolo.
# --mari: reface și pozele întregi de rezervă, site/img/st/film/f_NNNN.webp (1280×720, toate cadrele; pentru tablete și
#         navigatoarele fără WebCodecs / AV1). Primul cadru (f_0000.webp, mai mare) rămâne cum e.
#
# Un fișier p_NN.bin: „CPP1”, numărul de cadre (u16), 0 (u16), mărimea fiecărui cadru (u32), apoi cadrele (WebP), unul după altul.
import sys, os, glob, struct, io
from PIL import Image
a = sys.argv[1:]; src = a[0]
here = os.path.dirname(os.path.abspath(__file__)); film = os.path.normpath(os.path.join(here, '..', '..', '..', 'site', 'img', 'st', 'film'))
out = os.path.join(film, 't'); os.makedirs(out, exist_ok=True)
X0, N, PK = 614, 648, 54                     # tăietura (px din 1920), numărul de cadre, cadre ale poveștii pe pachet
fr = sorted(glob.glob(os.path.join(src, 'f_*.png'))); assert len(fr) == N, len(fr)
for f in glob.glob(os.path.join(out, 'f_*.webp')) + glob.glob(os.path.join(out, 'p_*.bin')): os.remove(f)
tm = tl = tb = 0; low = []
for i, f in enumerate(fr):
    im = Image.open(f).convert('RGB'); assert im.size == (1920, 1080), im.size
    if '--mari' in a and i > 0:
        o = os.path.join(film, 'f_%04d.webp' % i); im.resize((1280, 720), Image.LANCZOS).save(o, 'WEBP', quality=72, method=5); tb += os.path.getsize(o)
    if i % 2 and i != N - 1: continue
    c = im.crop((X0, 0, 1920, 1080))
    o = os.path.join(out, 'f_%04d.webp' % i); c.resize((726, 600), Image.LANCZOS).save(o, 'WEBP', quality=60, method=5); tm += os.path.getsize(o)
    if i % 2 == 0: b = io.BytesIO(); c.resize((363, 300), Image.LANCZOS).save(b, 'WEBP', quality=50, method=6); low.append(b.getvalue())
np = 0
for p in range(0, len(low), PK // 2):
    bl = low[p:p + PK // 2]; o = os.path.join(out, 'p_%02d.bin' % np); np += 1
    with open(o, 'wb') as f:
        f.write(b'CPP1' + struct.pack('<HH', len(bl), 0))
        for b in bl: f.write(struct.pack('<I', len(b)))
        for b in bl: f.write(b)
    tl += os.path.getsize(o)
print('telefon: %d cadre 726×600 · %.1f MB; %d pachete mici (%d cadre 363×300) · %.2f MB' % (len(glob.glob(os.path.join(out, 'f_*.webp'))), tm / 1e6, np, len(low), tl / 1e6))
if tb: print('poze întregi 1280×720: %d · %.1f MB' % (N - 1, tb / 1e6))
