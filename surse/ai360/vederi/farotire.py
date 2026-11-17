# python3 farotire.py <casă: x7|t7|e7|v3|m9|t6|c20> <filmarea rotirii (.mp4)> [--m601] [--mici] [--crf 30]
#
# Tot ce îi trebuie paginii pentru rotirea unei case, dintr-o singură filmare a ocolului (192 de cadre, pornită din locul vederii):
#   site/img/gd/rot/<casă>/v/       filmul comprimat (faclip.py): cadre de 1920 px pentru mișcare + filmul mic
#   site/img/gd/rot/<casă>/l_*.webp 96 de cadre mari (2560 px), arătate când rotirea se oprește
#   site/img/gd/rot/<casă>/s_*.webp (doar cu --mici) cele 192 de poze mici, pentru navigatoarele fără WebCodecs / AV1
# Filmarea e de obicei cea trecută prin Topaz (Rhea, 4K, marcată BT.709). Pentru o filmare Runway nemarcată: --m601.
# După aceea: rândul casei din ROTIRI (site/js/gradina-data.js) primește „v: <număr>” (se mărește la fiecare refacere).
import sys, os, glob, subprocess, tempfile, shutil
from PIL import Image
a = sys.argv[1:]; casa, src = a[0], a[1]; M = 'bt601' if '--m601' in a else 'bt709'
here = os.path.dirname(os.path.abspath(__file__)); rot = os.path.normpath(os.path.join(here, '..', '..', '..', 'site', 'img', 'gd', 'rot', casa)); os.makedirs(rot, exist_ok=True)
crf = a[a.index('--crf') + 1] if '--crf' in a else '30'
subprocess.run([sys.executable, os.path.join(here, 'faclip.py'), src, os.path.join(rot, 'v'), '--n', '192', '--seg', '16', '--crf', crf] + (['--m601'] if M == 'bt601' else []), check=True)
tmp = tempfile.mkdtemp(prefix='rot_')
def cadre(w, pas, nume):
    d = os.path.join(tmp, nume); os.makedirs(d)
    vf = "select='not(mod(n\\,%d))',scale='min(iw,%d)':-2:flags=lanczos:in_color_matrix=%s:in_range=tv:out_range=pc,format=rgb24" % (pas, w, M)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vf', vf, '-vsync', '0', os.path.join(d, 'f_%05d.png')], check=True)
    return sorted(glob.glob(os.path.join(d, 'f_*.png')))
tot = 0; fr = cadre(2560, 2, 'l'); assert len(fr) == 96, len(fr)
for f in glob.glob(os.path.join(rot, 'l_*.webp')): os.remove(f)
for i, f in enumerate(fr): o = os.path.join(rot, 'l_%03d.webp' % i); Image.open(f).convert('RGB').save(o, 'WEBP', quality=78, method=5); tot += os.path.getsize(o)
print('cadre mari: 96 · %.1f MB' % (tot / 1e6)); shutil.rmtree(os.path.join(tmp, 'l'))
if '--mici' in a:
    tot = 0; fr = cadre(1024, 1, 's'); assert len(fr) == 192, len(fr)
    for f in glob.glob(os.path.join(rot, 's_*.webp')): os.remove(f)
    for i, f in enumerate(fr): o = os.path.join(rot, 's_%03d.webp' % i); Image.open(f).convert('RGB').save(o, 'WEBP', quality=72, method=5); tot += os.path.getsize(o)
    print('poze mici: 192 · %.1f MB' % (tot / 1e6))
shutil.rmtree(tmp)
