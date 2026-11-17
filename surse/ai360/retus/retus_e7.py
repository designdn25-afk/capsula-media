# Retușul din 17 nov 2026: scaunul „intrat în bucătărie” din imaginile camerelor E7 (living și bucătărie).
# Din fiecare panoramă s-a tăiat bucata cu scaunul (living: x 1876–2484, y 936–1704; bucătărie: x 700–1468, y 1100–1868), cele două
# bucăți au fost puse una lângă alta într-o singură imagine de 1376×768 și date unui model ieftin de editare
# (gemini-3.1-flash-lite-image, 1K, 16:9: 309 credite; nodul OMfHZTV8Rw0ahpkNGNOL, sursa 5Z0ap2vvqv9QGNvqLFhU), cu cererea „scoate
# scaunul intrat în corpul verde din ambele fotografii, restul rămâne pixel cu pixel”. Scriptul lipește rezultatul la loc doar acolo
# unde s-a schimbat ceva (masca = diferența față de original, în cutia scaunului, cu margini estompate), apoi șterge piciorul de
# scaun rămas sub masă (umplere pe rânduri din pardoseala din stânga și din dreapta).
#   python3 retus_e7.py <cele două bucăți .png> <rezultatul .jpg> <folderul cu e7_living.webp și e7_bucatarie.webp> <folder ieșire>
import sys, numpy as np, cv2
from PIL import Image
orig_p, res_p, src_dir, out_dir = sys.argv[1:5]
O = np.asarray(Image.open(orig_p).convert('RGB')).astype(np.float32)
Rz = np.asarray(Image.open(res_p).convert('RGB').resize((O.shape[1], O.shape[0]), Image.LANCZOS)).astype(np.float32)
PAN = {'living': (0, 608, (1876, 936), (100, 250, 380, 590)), 'bucatarie': (608, 1376, (700, 1100), (170, 190, 640, 690))}   # x0, x1 în canvas; colțul în panoramă; cutia scaunului (în bucată)
for name, (x0, x1, (px, py), (bx0, by0, bx1, by1)) in PAN.items():
    o, r = O[:, x0:x1], Rz[:, x0:x1].copy()
    # potrivire: deplasare întreagă mică (căutată pe zonele neschimbate) și corecție de culoare
    out_box = np.ones(o.shape[:2], bool); out_box[by0:by1, bx0:bx1] = False
    best = (1e9, 0, 0)
    for dy in range(-3, 4):
        for dx in range(-3, 4):
            sh = np.roll(np.roll(r, dy, 0), dx, 1); e = np.abs(sh - o)[8:-8, 8:-8][out_box[8:-8, 8:-8]].mean()
            if e < best[0]: best = (e, dy, dx)
    e, dy, dx = best; r = np.roll(np.roll(r, dy, 0), dx, 1)
    gain = [(o[..., c][out_box].mean() / max(1e-3, r[..., c][out_box].mean())) for c in range(3)]
    r = r * np.array(gain, np.float32)
    d = cv2.GaussianBlur(np.abs(r - o).max(2), (0, 0), 2)
    m = (d > 14).astype(np.uint8); box = np.zeros_like(m); box[by0:by1, bx0:bx1] = 1; m &= box
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((21, 21), np.uint8)); m = cv2.dilate(m, np.ones((13, 13), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)   # doar petele mari (scaunul), nu zgomotul
    keep = np.zeros_like(m)
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] > 1500: keep[lab == i] = 1
    a = cv2.GaussianBlur(keep.astype(np.float32), (0, 0), 5)[..., None]
    comp = o * (1 - a) + r * a
    print(name, 'deplasare', dy, dx, 'abatere în afara scaunului %.2f' % e, 'culoare', [round(g, 3) for g in gain], 'pixeli schimbați', int(keep.sum()))
    Image.fromarray(comp.clip(0, 255).astype(np.uint8)).save(f'{out_dir}/{name}_bucata.png')
    Image.fromarray((keep * 255).astype(np.uint8)).save(f'{out_dir}/{name}_masca.png')
    if name == 'living':   # piciorul negru rămas sub masă
        c = comp.clip(0, 255).astype(np.uint8); x0, y0, x1, y1 = 117, 488, 143, 543
        mk = cv2.dilate((c[y0:y1, x0:x1].astype(np.float32).mean(2) < 48).astype(np.uint8), np.ones((5, 5), np.uint8)); comp = c.astype(np.float32)
        for j in range(mk.shape[0]):
            xs = np.where(mk[j])[0]
            if not len(xs): continue
            a0, b0 = xs.min() - 2, xs.max() + 2
            la = comp[y0 + j, x0 + a0 - 3:x0 + a0 + 1].mean(0); rb = comp[y0 + j, x0 + b0:x0 + b0 + 4].mean(0)
            for x in range(a0, b0 + 1): t = (x - a0) / max(1, b0 - a0); comp[y0 + j, x0 + x] = la * (1 - t) + rb * t
    pan = Image.open(f'{src_dir}/e7_{name}.webp').convert('RGB')
    pan.paste(Image.fromarray(comp.clip(0, 255).astype(np.uint8)), (px, py))
    pan.save(f'{out_dir}/e7_{name}.webp', 'WEBP', quality=90, method=6)
