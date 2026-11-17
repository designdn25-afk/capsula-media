# python3 farotire.py <casă: x7|t7|e7|v3|m9|t6|c20> <filmarea rotirii (.mp4)> [--m601] [--mici] [--doar-telefon] [--doar-pachet] [--crf 30]
#
# Tot ce îi trebuie paginii pentru rotirea unei case, dintr-o singură filmare a ocolului (192 de cadre, pornită din locul vederii):
#   site/img/gd/rot/<casă>/v/       filmul comprimat (faclip.py): cadre de 1920 px pentru mișcare + filmul mic (calculator)
#   site/img/gd/rot/<casă>/l_*.webp 96 de cadre mari (2560 px), arătate când rotirea se oprește
#   site/img/gd/rot/<casă>/s_*.webp (cu --mici) cele 192 de poze mici (1024 px), pentru telefoane, tablete și navigatoarele fără
#                                   WebCodecs / AV1
#   site/img/gd/rot/<casă>/p.bin    (cu --mici) „pachetul mic”: un cadru din două, la 768 px, într-un singur fișier. Telefonul îl
#                                   aduce primul, dintr-o singură cerere: așa are de la început ce arăta la orice unghi, oricât de
#                                   repede e rotită casa (pozele de 1024 px vin apoi, în jurul locului la care se uită vizitatorul)
# --doar-telefon: face doar pozele mici și pachetul mic (filmul comprimat și cadrele mari rămân cum sunt).
# --doar-pachet:  face doar pachetul mic.
# Filmarea e de obicei cea trecută prin Topaz (Rhea, 4K, marcată BT.709). Pentru o filmare Runway nemarcată: --m601.
# După aceea: rândul casei din ROTIRI (site/js/gradina-data.js) primește „v: <număr>” (filmul) și „p: <număr>” (pachetul mic);
# numărul se mărește la fiecare refacere.
#
# Un fișier p.bin: „CPP2”, numărul de cadre (u16), 0 (u16), apoi pentru fiecare cadru mărimea (u32) și numărul lui în rotire (u16),
# apoi cadrele (WebP), unul după altul. Cadrele stau de la rare la dese (întâi câte unul din 16 de jur împrejur, apoi din 8, din 4,
# din 2), în fiecare treaptă întâi cele mai apropiate de locul vederii (cadrul 0): pagina le folosește pe măsură ce sosesc, deci
# după primele ~200 KB rotirea are deja ce arăta de jur împrejur.
import sys, os, glob, subprocess, tempfile, shutil, struct, io
from PIL import Image
a = sys.argv[1:]; casa, src = a[0], a[1]; M = 'bt601' if '--m601' in a else 'bt709'
here = os.path.dirname(os.path.abspath(__file__)); rot = os.path.normpath(os.path.join(here, '..', '..', '..', 'site', 'img', 'gd', 'rot', casa)); os.makedirs(rot, exist_ok=True)
crf = a[a.index('--crf') + 1] if '--crf' in a else '30'; PAC = '--doar-pachet' in a; TEL = '--doar-telefon' in a or PAC
if not TEL: subprocess.run([sys.executable, os.path.join(here, 'faclip.py'), src, os.path.join(rot, 'v'), '--n', '192', '--seg', '16', '--crf', crf] + (['--m601'] if M == 'bt601' else []), check=True)
tmp = tempfile.mkdtemp(prefix='rot_')
def cadre(w, pas, nume):
    d = os.path.join(tmp, nume); os.makedirs(d)
    vf = "select='not(mod(n\\,%d))',scale='min(iw,%d)':-2:flags=lanczos:in_color_matrix=%s:in_range=tv:out_range=pc,format=rgb24" % (pas, w, M)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vf', vf, '-vsync', '0', os.path.join(d, 'f_%05d.png')], check=True)
    return sorted(glob.glob(os.path.join(d, 'f_*.png')))
if not TEL:
    tot = 0; fr = cadre(2560, 2, 'l'); assert len(fr) == 96, len(fr)
    for f in glob.glob(os.path.join(rot, 'l_*.webp')): os.remove(f)
    for i, f in enumerate(fr): o = os.path.join(rot, 'l_%03d.webp' % i); Image.open(f).convert('RGB').save(o, 'WEBP', quality=78, method=5); tot += os.path.getsize(o)
    print('cadre mari: 96 · %.1f MB' % (tot / 1e6)); shutil.rmtree(os.path.join(tmp, 'l'))
if TEL or '--mici' in a:
    if not PAC:
        tot = 0; fr = cadre(1024, 1, 's'); assert len(fr) == 192, len(fr)
        for f in glob.glob(os.path.join(rot, 's_*.webp')): os.remove(f)
        for i, f in enumerate(fr): o = os.path.join(rot, 's_%03d.webp' % i); Image.open(f).convert('RGB').save(o, 'WEBP', quality=72, method=5); tot += os.path.getsize(o)
        print('poze mici: 192 · %.1f MB' % (tot / 1e6)); shutil.rmtree(os.path.join(tmp, 's'))
    # pachetul mic: cadrele cu număr par (aceleași unghiuri ca la cadrele mari), 768 px
    fr = cadre(768, 2, 'p'); assert len(fr) == 96, len(fr); bl = []
    for f in fr: b = io.BytesIO(); Image.open(f).convert('RGB').save(b, 'WEBP', quality=50, method=6); bl.append(b.getvalue())
    n2 = 192; idx = [2 * j for j in range(len(bl))]; lvl = lambda i: 0 if i % 16 == 0 else 1 if i % 8 == 0 else 2 if i % 4 == 0 else 3
    order = sorted(range(len(bl)), key=lambda j: (lvl(idx[j]), min(idx[j], n2 - idx[j]), idx[j]))   # de la rare la dese; în fiecare treaptă, de la locul vederii în ambele părți
    with open(os.path.join(rot, 'p.bin'), 'wb') as f:
        f.write(b'CPP2' + struct.pack('<HH', len(bl), 0))
        for j in order: f.write(struct.pack('<IH', len(bl[j]), idx[j]))
        for j in order: f.write(bl[j])
    print('pachetul mic: 96 de cadre · %.2f MB' % (os.path.getsize(os.path.join(rot, 'p.bin')) / 1e6))
shutil.rmtree(tmp)
