# python3 fixpoveste.py <filmare.mp4> <bucata k> [invers] [--prim <imagine mare a primului cadru>]
# Scoate din filmarea „reală” a unei bucăți din povestea de la deschidere cadrele pentru site: câte unul din două (96 din 192),
# 1280 px lățime, în site/img/st/film/f_<k*96 + j>.webp (numerotare continuă, ca în js/story.js).
#   invers        filmarea a fost făcută de la coadă la cap (ultima bucată: pornește de la imaginea de noapte) și se întoarce aici
#   --prim x.png  primul cadru al bucății se ia dintr-o imagine mare (imaginea de referință, mai clară decât filmarea), 2560 px;
#                 imaginea e potrivită întâi peste primul cadru al filmării (vezi fixflat.py), ca trecerea să nu tresară
import sys, os, glob, subprocess, tempfile, shutil
from PIL import Image
a = sys.argv[1:]; src = a[0]; k = int(a[1]); inv = 'invers' in a; prim = a[a.index('--prim') + 1] if '--prim' in a else None
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'site', 'img', 'st', 'film'); os.makedirs(out, exist_ok=True)
tmp = tempfile.mkdtemp(); subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-qscale:v', '2', os.path.join(tmp, 'f_%05d.jpg')], check=True)
fr = sorted(glob.glob(os.path.join(tmp, 'f_*.jpg'))); F = len(fr); assert F >= 190, F
if inv: fr.reverse()
tot = 0
for j in range(96):
    im = Image.open(fr[min(F - 1, j * 2)]).convert('RGB'); f = os.path.join(out, 'f_%04d.webp' % (k * 96 + j))
    if j == 0 and prim:
        ref = os.path.join(tmp, 'ref0.jpg'); im.save(ref, quality=95); al = os.path.join(tmp, 'prim.webp')
        subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fixflat.py'), ref, prim, al, '2560'], check=True)
        im = Image.open(al).convert('RGB'); im.save(f, 'WEBP', quality=84, method=5)
    else:
        if im.size[0] > 1280: im = im.resize((1280, round(im.size[1] * 1280 / im.size[0])), Image.LANCZOS)
        im.save(f, 'WEBP', quality=74, method=5)
    tot += os.path.getsize(f)
print('bucata %d: 96 cadre din %d%s · %.1f MB · %s' % (k, F, ' (întoarse)' if inv else '', tot / 1e6, os.path.normpath(out)))
shutil.rmtree(tmp)
