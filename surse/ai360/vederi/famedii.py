# python3 famedii.py
#
# Copii la jumătate de mărime ale imaginilor vederilor din afară și ale planurilor (site/img/gd/ai/gr_*.webp și pl_*.webp →
# site/img/gd/ai/m/), pentru ecranele mici (telefoane, panoul îngust). Acolo pânza grădinii are cel mult ~1300 px, deci imaginea
# de 4K nu se vede mai clar, dar are de patru ori mai multe date: pe o legătură de telefon, poza unei case venea în 2–3 secunde.
# Pagina (site/js/garden.js, „lite”) le folosește când fereastra e mai îngustă de 800 px. Se rulează din nou de câte ori se
# schimbă o imagine gr_* sau pl_* (altfel telefonul ar arăta varianta veche).
import os, glob
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__)); ai = os.path.normpath(os.path.join(here, '..', '..', '..', 'site', 'img', 'gd', 'ai'))
out = os.path.join(ai, 'm'); os.makedirs(out, exist_ok=True); t0 = t1 = 0
for f in sorted(glob.glob(os.path.join(ai, 'gr_*.webp')) + glob.glob(os.path.join(ai, 'pl_*.webp'))):
    im = Image.open(f).convert('RGB'); o = os.path.join(out, os.path.basename(f))
    im.resize((round(im.width / 2), round(im.height / 2)), Image.LANCZOS).save(o, 'WEBP', quality=80, method=6)
    t0 += os.path.getsize(f); t1 += os.path.getsize(o); print('%-18s %4dx%-4d %4.0f KB (din %4.0f KB)' % (os.path.basename(f), im.width // 2, im.height // 2, os.path.getsize(o) / 1024, os.path.getsize(f) / 1024))
print('în total: %.1f MB (din %.1f MB)' % (t1 / 1e6, t0 / 1e6))
