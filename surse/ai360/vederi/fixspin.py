# python3 fixspin.py <filmare.mp4 sau folder cu cadre> <folder de ieșire în site/img/gd/rot/> [n=72] [mic=1280] [mare=1920]
# Scoate din filmarea unei rotiri complete n cadre la distanțe egale și le salvează pentru site:
#   s_000.webp … (mici, pentru mișcare) și l_000.webp … (mari, pentru când rotirea se oprește).
# Primul cadru al filmării = primul cadru al rotirii (az0 din info.json); ultimul cadru e cu un pas înainte de întoarcerea la primul.
# Exemplu cu cadre de ocolit: EVITA=0-25 python3 fixspin.py filmare.mp4 ../../../site/img/gd/rot/x7 72
import sys, os, glob, subprocess, tempfile, shutil
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
n = int(sys.argv[3]) if len(sys.argv) > 3 else 72; small = int(sys.argv[4]) if len(sys.argv) > 4 else 1280; big = int(sys.argv[5]) if len(sys.argv) > 5 else 1920
tmp = None
if os.path.isdir(src): frames = sorted(glob.glob(os.path.join(src, 'f_*.jpg')))
else:
    tmp = tempfile.mkdtemp(); subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-qscale:v', '2', os.path.join(tmp, 'f_%05d.jpg')], check=True)
    frames = sorted(glob.glob(os.path.join(tmp, 'f_*.jpg')))
F = len(frames); os.makedirs(out, exist_ok=True); tot = [0, 0]
# EVITA=a-b: cadrele a…b ale filmării sunt greșite (de exemplu primele, în care generatorul încă pleacă de la imaginea de referință);
# în locul lor se pune cel mai apropiat cadru bun (rotirea „stă” puțin acolo)
ev = os.environ.get('EVITA'); ea, eb = (int(x) for x in ev.split('-')) if ev else (1, 0)
def bun(j):
    if not (ea <= j <= eb): return j
    lo, hi = (ea - 1) % F, (eb + 1) % F
    return lo if (j - ea) < (eb - j) else hi
for i in range(n):
    im = Image.open(frames[bun(min(F - 1, round(i * F / n)))]).convert('RGB'); w, h = im.size
    for pre, side, q, k in (('s_', small, 72, 0), ('l_', big, 82, 1)):
        j = im if w <= side else im.resize((side, round(h * side / w)), Image.LANCZOS); f = os.path.join(out, '%s%03d.webp' % (pre, i)); j.save(f, 'WEBP', quality=q, method=5); tot[k] += os.path.getsize(f)
print('%d cadre din %d · mici %.1f MB · mari %.1f MB · %s' % (n, F, tot[0] / 1e6, tot[1] / 1e6, out))
if tmp: shutil.rmtree(tmp)
