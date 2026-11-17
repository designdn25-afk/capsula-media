# python3 cadrepoveste.py <folder de ieșire> --a0 <aleph-0.mp4> --a1 <aleph-1.mp4> --a2 <aleph-2.mp4> --a3r <aleph-3r.mp4>
#                         --k0 <imaginea-cheie 0> --k1 <imaginea-cheie 1> --k2 <imaginea-cheie 2> --k4 <imaginea-cheie de seară>
#                         [--m601] [--w 1920]
#
# Cadrele poveștii de la deschidere la mărime mare (f_0000.png … f_0647.png, 1920×1080), pentru filmul comprimat al paginii
# (apoi: python3 faclip.py <folderul acesta> ../../../site/img/st/film/v --seg 24). Aceeași așezare ca fixpoveste.py (care scrie
# pozele mici, de rezervă) și ca FILM.T din site/js/story.js:
#   0…191    dimineața (aleph-0)                 primul cadru = imaginea-cheie 0, potrivită peste cadrul filmării
#   192…383  acoperișul se ridică (aleph-1)      primul cadru = imaginea-cheie 1
#   384…455  de sus (primele 72 de cadre din aleph-2; primul = imaginea-cheie 2)
#   456…646  seara (aleph-3r, întoarsă; pe primele 30 de locuri imaginea se topește din coborâre în seară)
#   647      imaginea-cheie de seară
# --m601: filmările sunt citite cu matricea BT.601 (așa au fost citite filmările Runway pentru pozele de pe site); fără el, BT.709
# (filmările trecute prin Topaz sunt marcate BT.709).
import sys, os, glob, subprocess, tempfile, shutil
from PIL import Image
a = sys.argv[1:]; out = a[0]
opt = lambda n, d=None: a[a.index(n) + 1] if n in a else d
W = int(opt('--w', 1920)); H = W * 9 // 16; M = 'bt601' if '--m601' in a else 'bt709'
here = os.path.dirname(os.path.abspath(__file__)); tmp = tempfile.mkdtemp(prefix='poveste_'); os.makedirs(out, exist_ok=True)
def cadre(video, nume):
    d = os.path.join(tmp, nume); os.makedirs(d)
    vf = 'scale=%d:%d:flags=lanczos:in_color_matrix=%s:in_range=tv:out_range=pc,format=rgb24' % (W, H, M)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', video, '-vf', vf, os.path.join(d, 'f_%05d.png')], check=True)
    fr = sorted(glob.glob(os.path.join(d, 'f_*.png'))); assert len(fr) >= 190, len(fr); return fr
def scrie(i, im): im.save(os.path.join(out, 'f_%04d.png' % i), compress_level=1)
def cheie(i, cadru, imagine):   # imaginea-cheie (mai clară decât filmarea), potrivită peste cadrul filmării
    ref = os.path.join(tmp, 'ref.jpg'); Image.open(cadru).convert('RGB').save(ref, quality=95); al = os.path.join(tmp, 'cheie.webp')
    subprocess.run([sys.executable, os.path.join(here, 'fixflat.py'), ref, imagine, al, '3840'], check=True)
    scrie(i, Image.open(al).convert('RGB').resize((W, H), Image.LANCZOS))
desc = lambda fr, j: Image.open(fr[min(len(fr) - 1, j)]).convert('RGB')
for k in (0, 1):
    fr = cadre(opt('--a%d' % k), 'a%d' % k)
    for j in range(192):
        if j == 0: cheie(k * 192, fr[0], opt('--k%d' % k))
        else: scrie(k * 192 + j, desc(fr, j))
    shutil.rmtree(os.path.join(tmp, 'a%d' % k)); print('bucata', k)
fr = cadre(opt('--a2'), 'a2'); ev = cadre(opt('--a3r'), 'a3'); ev.reverse(); E = len(ev)   # seara, în ordinea poveștii: de la apus spre noapte
B0, N0, NB, NS = 384, 72, 30, 191
for j in range(N0):
    if j == 0: cheie(B0, fr[0], opt('--k2'))
    else: scrie(B0 + j, desc(fr, j))
for s in range(NS):
    im = Image.open(ev[min(E - 1, round(s * (E - 1) / (NS - 1)))]).convert('RGB')
    if s < NB: t = (s + 1) / (NB + 1); t = t * t * (3 - 2 * t); im = Image.blend(desc(fr, N0 + 2 * s), im, t)   # coborârea merge mai departe (2 cadre pe loc)
    scrie(B0 + N0 + s, im)
cheie(B0 + N0 + NS, ev[E - 1], opt('--k4'))
print('648 de cadre, %dx%d · %s' % (W, H, out)); shutil.rmtree(tmp)
