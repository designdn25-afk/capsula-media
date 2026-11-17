# python3 faclip.py <filmare.mp4 sau folder cu cadre> <folder de ieșire> [opțiuni]
#
# Face „filmul comprimat” al unei rotiri sau al poveștii de la deschidere, cel pe care pagina îl desface cadru cu cadru
# (site/js/clip.js + site/js/clip-worker.js; vezi docs/DETALII-TEHNICE.md, §22). În locul a sute de poze separate, cadrele stau
# într-un film AV1 tăiat în bucăți: de câteva ori mai puține date la aceeași claritate, deci imaginea mare e gata aproape imediat.
#
#   h_00.bin, h_01.bin …   cadrele mari, câte SEG pe fișier (fiecare fișier începe cu un cadru-cheie și se desface singur)
#   lo.bin                 toată filmarea la mărime mică (se arată doar cât nu a sosit încă bucata mare)
#   info.json              ce s-a făcut (pagina nu-l citește; numerele se trec în gradina-data.js / story.js)
#
# Un fișier .bin: „CPV1”, numărul de cadre (u16), 0 (u16), apoi mărimea fiecărui cadru (u32; bitul de sus = cadru-cheie), apoi cadrele.
#
# Opțiuni:  --n 192        câte cadre (luate la distanțe egale din filmare; implicit toate)
#           --w 1920       lățimea cadrelor mari      --crf 30     calitatea lor (mai mic = mai bun, mai mare fișierul)
#           --lo 640       lățimea cadrelor mici      --locrf 40
#           --seg 16       cadre pe fișier            --gop 8      un cadru-cheie la atâtea cadre (SEG e multiplu de GOP)
#           --evita a-b    cadrele a…b ale filmării sunt greșite: se pune cel mai apropiat cadru bun (ca la fixspin.py)
#           --m601         filmarea e citită cu matricea BT.601 (așa au fost citite toate filmările Runway de pe site)
#           --cadre DIR    păstrează și cadrele scoase (PNG, la lățimea cadrelor mari)
#           --doar-mic     reface doar filmul mic (lo.bin), de exemplu la altă mărime
# Exemplu:  python3 faclip.py aleph-c20.mp4 ../../../site/img/gd/rot/c20/v --m601
import sys, os, glob, subprocess, tempfile, shutil, struct, json

a = sys.argv[1:]
if len(a) < 2: sys.exit(__doc__ or 'faclip.py <sursa> <iesire>')
src, out = a[0], a[1]
def opt(n, d=None): return a[a.index(n) + 1] if n in a else d
N = opt('--n'); W = int(opt('--w', 1920)); CRF = int(opt('--crf', 30)); LO = int(opt('--lo', 640)); LOCRF = int(opt('--locrf', 40))
SEG = int(opt('--seg', 16)); GOP = int(opt('--gop', 8)); EV = opt('--evita'); KEEP = opt('--cadre'); PRESET = opt('--preset', '5')
assert SEG % GOP == 0, 'SEG trebuie să fie multiplu de GOP'
tmp = tempfile.mkdtemp(prefix='faclip_')

# 1. cadrele sursei, în ordine
if os.path.isdir(src):
    frames = sorted(f for f in glob.glob(os.path.join(src, '*')) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')))
else:
    d = os.path.join(tmp, 'src'); os.makedirs(d)
    # (o filmare mai mare decât cadrele cerute, de exemplu una trecută prin Topaz la 4K, e micșorată chiar la scoaterea cadrelor)
    vf = "scale='min(iw,%d)':-2:flags=lanczos:in_color_matrix=%s:in_range=tv:out_range=pc,format=rgb24" % (W, 'bt601' if '--m601' in a else 'bt709')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vf', vf, os.path.join(d, 'f_%05d.png')], check=True)
    frames = sorted(glob.glob(os.path.join(d, 'f_*.png')))
F = len(frames); assert F > 1, 'nu am găsit cadre în ' + src
n = int(N) if N else F
ea, eb = (int(x) for x in EV.split('-')) if EV else (1, 0)
def bun(j):
    if not (ea <= j <= eb): return j
    lo, hi = (ea - 1) % F, (eb + 1) % F
    return lo if (j - ea) < (eb - j) else hi
pick = [frames[bun(min(F - 1, round(i * F / n)))] for i in range(n)]
seq = os.path.join(tmp, 'seq'); os.makedirs(seq)
ext = os.path.splitext(pick[0])[1].lower()
for i, f in enumerate(pick): os.symlink(os.path.abspath(f), os.path.join(seq, 'f_%05d%s' % (i, ext)))
if KEEP:
    os.makedirs(KEEP, exist_ok=True)
    for i, f in enumerate(pick): shutil.copyfile(f, os.path.join(KEEP, 'f_%05d%s' % (i, ext)))

# 2. filmul AV1 (cadre-cheie din GOP în GOP, fără schimbări de scenă ghicite; împărțit în „plăci”, ca să se desfacă pe mai multe fire)
def encode(width, crf, tiles, name):
    ivf = os.path.join(tmp, name + '.ivf')
    par = 'scd=0:fast-decode=1:keyint=%d' % GOP + (':tile-columns=2:tile-rows=1' if tiles else '')
    vf = 'scale=%d:-2:flags=lanczos:out_color_matrix=bt709:out_range=tv,format=yuv420p' % width
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', '24', '-i', os.path.join(seq, 'f_%05d' + ext), '-vf', vf,
                    '-c:v', 'libsvtav1', '-crf', str(crf), '-g', str(GOP), '-preset', PRESET, '-svtav1-params', par,
                    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv', '-f', 'ivf', ivf], check=True,
                   env=dict(os.environ, SVT_LOG='1'))
    raw = open(ivf, 'rb').read(); assert raw[:4] == b'DKIF'
    hl, w, h = struct.unpack_from('<H', raw, 6)[0], struct.unpack_from('<H', raw, 12)[0], struct.unpack_from('<H', raw, 14)[0]
    off = hl; fr = []
    while off + 12 <= len(raw): sz = struct.unpack_from('<I', raw, off)[0]; fr.append(raw[off + 12: off + 12 + sz]); off += 12 + sz
    pk = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v', '-show_entries', 'packet=flags', '-of', 'csv=p=0', ivf], capture_output=True, text=True, check=True).stdout.split()
    key = [p.startswith('K') for p in pk]
    assert len(fr) == n and len(key) == n, (len(fr), len(key), n)
    assert all(key[i] for i in range(0, n, GOP)), 'lipsesc cadre-cheie'
    return w, h, fr, [i % GOP == 0 for i in range(n)]   # (cheie = doar începutul fiecărui GOP: de acolo pornește pagina)
def scrie(path, fr, key):
    with open(path, 'wb') as f:
        f.write(b'CPV1' + struct.pack('<HH', len(fr), 0))
        for b, k in zip(fr, key): f.write(struct.pack('<I', len(b) | (0x80000000 if k else 0)))
        for b in fr: f.write(b)
    return os.path.getsize(path)

os.makedirs(out, exist_ok=True)
ns = (n + SEG - 1) // SEG
if '--doar-mic' in a:   # se reface doar filmul mic (cadrele mari rămân cum sunt)
    old = json.load(open(os.path.join(out, 'info.json'))); w, h, tot = old['w'], old['h'], old['mare_mb'] * 1e6; os.remove(os.path.join(out, 'lo.bin'))
else:
    for f in glob.glob(os.path.join(out, 'h_*.bin')) + glob.glob(os.path.join(out, 'lo.bin')): os.remove(f)
    w, h, fr, key = encode(W, CRF, True, 'hi'); tot = 0
    for s in range(ns): tot += scrie(os.path.join(out, 'h_%02d.bin' % s), fr[s * SEG:(s + 1) * SEG], key[s * SEG:(s + 1) * SEG])
lw, lh, lfr, lkey = encode(LO, LOCRF, False, 'lo'); lt = scrie(os.path.join(out, 'lo.bin'), lfr, lkey)
info = dict(n=n, seg=SEG, gop=GOP, w=w, h=h, lo=[lw, lh], crf=CRF, locrf=LOCRF, mare_mb=round(tot / 1e6, 2), mic_mb=round(lt / 1e6, 2), bucati=ns)
json.dump(info, open(os.path.join(out, 'info.json'), 'w'), indent=1)
print('%d cadre · mari %dx%d: %.1f MB în %d bucăți · mici %dx%d: %.2f MB · %s' % (n, w, h, tot / 1e6, ns, lw, lh, lt / 1e6, out))
shutil.rmtree(tmp)
