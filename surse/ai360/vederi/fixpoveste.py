# Cadrele pentru site ale filmării „reale” a poveștii de la deschidere (site/img/st/film/f_0000.webp …), din filmările
# transformate cu Runway Aleph (vezi CITESTE.md, partea a patra). Numerotarea e continuă și trebuie să se potrivească cu
# FILM.T din site/js/story.js:
#
#   python3 fixpoveste.py 0 <aleph-0.mp4> --prim <imaginea reală a primului cadru>        → f_0000 … f_0191  (dimineața)
#   python3 fixpoveste.py 1 <aleph-1.mp4> --prim <imaginea reală a capătului vitrat>      → f_0192 … f_0383  (acoperișul se ridică)
#   python3 fixpoveste.py 2 <aleph-2.mp4> --prim <imaginea reală de sus> --seara <aleph-3r.mp4> --ultim <imaginea reală de seară>
#                                                                                          → f_0384 … f_0647  (de sus → seara)
#
# Din 17 nov 2026 se scot TOATE cadrele filmărilor (înainte: unul din două). Clientul: „îmi place cum arată casa, dar nu se mișcă
# lin deloc”: cu jumătate din cadre, o treaptă a rotiței trecea prin ~10 cadre (ca un film la 12 cadre pe secundă).
# Bucățile 0 și 1: toate cele 192 de cadre, 1280 px. Primul cadru al fiecărei bucăți se ia din imaginea mare de
# referință (mai clară decât filmarea), potrivită peste primul cadru al filmării (fixflat.py), la 1920 px.
# Bucata 2 e făcută din două filmări: din aleph-2 (coborârea de sus) se folosesc doar primele 72 de cadre (după aceea generatorul
# n-a mai pus acoperișul la loc), apoi imaginea se topește, pe 30 de cadre, în filmarea de seară.
# Filmarea de seară (aleph-3r) a fost făcută de la coadă la cap (pornește de la imaginea de noapte, ca generatorul să aibă
# referința bună) și se întoarce aici; cele 192 de cadre ale ei stau pe 191 de locuri, iar ultimul loc (f_0647) e imaginea mare de seară.
import sys, os, glob, subprocess, tempfile, shutil
from PIL import Image
a = sys.argv[1:]; k = int(a[0]); src = a[1]
opt = lambda n: a[a.index(n) + 1] if n in a else None
prim, seara, ultim = opt('--prim'), opt('--seara'), opt('--ultim')
here = os.path.dirname(os.path.abspath(__file__)); out = os.path.normpath(os.path.join(here, '..', '..', '..', 'site', 'img', 'st', 'film')); os.makedirs(out, exist_ok=True)
tmp = tempfile.mkdtemp(); tot = [0, 0]
def cadre(video, nume):
    d = os.path.join(tmp, nume); os.makedirs(d); subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', video, '-qscale:v', '2', os.path.join(d, 'f_%05d.jpg')], check=True)
    fr = sorted(glob.glob(os.path.join(d, 'f_*.jpg'))); assert len(fr) >= 190, len(fr); return fr
def mic(im): return im if im.size[0] <= 1280 else im.resize((1280, round(im.size[1] * 1280 / im.size[0])), Image.LANCZOS)
def scrie(i, im, q=74): f = os.path.join(out, 'f_%04d.webp' % i); im.save(f, 'WEBP', quality=q, method=5); tot[0] += 1; tot[1] += os.path.getsize(f)
def mare(i, cadru, imagine):   # imaginea mare, potrivită peste cadrul filmării, la 1920 px
    ref = os.path.join(tmp, 'ref.jpg'); Image.open(cadru).convert('RGB').save(ref, quality=95); al = os.path.join(tmp, 'mare.webp')
    subprocess.run([sys.executable, os.path.join(here, 'fixflat.py'), ref, imagine, al, '1920'], check=True); scrie(i, Image.open(al).convert('RGB'), 84)
fr = cadre(src, 'a'); F = len(fr); desc = lambda j: mic(Image.open(fr[min(F - 1, j)]).convert('RGB'))
if k < 2:
    for j in range(192):
        if j == 0 and prim: mare(k * 192, fr[0], prim)
        else: scrie(k * 192 + j, desc(j))
else:
    assert seara, 'bucata 2 are nevoie de --seara <filmarea de seară, făcută de la coadă la cap>'
    ev = cadre(seara, 'b'); ev.reverse(); E = len(ev)   # în ordinea poveștii: de la apus spre noapte
    B0, N0, NB, NS = 384, 72, 30, 191                    # primul loc · cadre din coborâre · cadre de topire · locuri pentru seară
    for j in range(N0):
        if j == 0 and prim: mare(B0, fr[0], prim)
        else: scrie(B0 + j, desc(j))
    for s in range(NS):
        im = mic(Image.open(ev[min(E - 1, round(s * (E - 1) / (NS - 1)))]).convert('RGB'))
        if s < NB: t = (s + 1) / (NB + 1); t = t * t * (3 - 2 * t); d = desc(N0 + 2 * s); im = Image.blend(d if d.size == im.size else d.resize(im.size, Image.LANCZOS), im, t)   # coborârea merge mai departe (2 cadre pe loc: seara are locurile de două ori mai rare)
        scrie(B0 + N0 + s, im)
    if ultim: mare(B0 + N0 + NS, ev[E - 1], ultim)
    else: scrie(B0 + N0 + NS, mic(Image.open(ev[E - 1]).convert('RGB')))
print('bucata %d: %d cadre · %.1f MB · %s' % (k, tot[0], tot[1] / 1e6, out))
shutil.rmtree(tmp)
