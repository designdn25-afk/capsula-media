# Grădina la ferestrele lui X7 (17 nov 2026): lipește în fotografiile reale 360° din showroom bucățile în care doar ce se vede
# prin geam a fost schimbat cu AI (parcarea → grădină). Restul fotografiei rămâne cel real: se ia din bucata editată doar ce diferă
# vizibil de original (adică ce e dincolo de sticlă), cu margini estompate.
#   python3 lipeste_geamuri.py <folderul p360 al site-ului> <folderul cu bucățile editate (living, masa, blat, dormL, dormR: .png sau .jpg)> <folder ieșire> [folder verificare]
#   (bucățile editate folosite pe 17 nov sunt în editate/; de exemplu: python3 lipeste_geamuri.py ../../../site/p360 editate ../../../site/img/gd/x7)
# Scrie <punct>_m.webp (4096×2048) și <punct>_l.webp (6144×3072) pentru living, masa, blat, dorm.
# Bucățile (în procente din fotografie; x poate trece de 100 = se continuă de la capătul celălalt) sunt aceleași cu care s-au tăiat
# sursele trimise la editat (crop/x7w-*.jpg). „lim” = între ce x are voie bucata să schimbe ceva (la dormitor cele două bucăți se
# întâlnesc pe montantul de la 12%). EXCL = părți ale unei bucăți (în fracțiuni din ea: x0, y0, x1, y1) din care nu se ia nimic: la „blat”
# generatorul a desenat în colțul din dreapta-jos un blat de lemn care nu există (și a atins draperia de lângă).
import sys, os, numpy as np, cv2
from PIL import Image
p360, ed_dir, out_dir = sys.argv[1:4]; chk = sys.argv[4] if len(sys.argv) > 4 else None
B = {'living': ('living', 33.5, 62.5, 28.0, 74.4, None), 'masa': ('masa', 86.0, 119.0, 33.0, 70.1, None), 'blat': ('blat', 37.5, 57.5, 31.0, 71.0, None),
     'dormL': ('dorm', 11.0, 40.4, 26.0, 73.0, (12.0, 40.4)), 'dormR': ('dorm', 59.0, 113.8, 26.0, 73.0, (59.0, 112.0))}
EXCL = {'blat': [(.885, 0, 1, 1), (.8, .74, 1, 1)]}
pan = {}
for name, (k, x0, x1, y0, y1, lim) in B.items():
    if k not in pan: pan[k] = np.asarray(Image.open(f'{p360}/{k}_x.webp').convert('RGB')).astype(np.float32)
    P = pan[k]; H, W = P.shape[:2]; X0, X1, Y0, Y1 = round(W * x0 / 100), round(W * x1 / 100), round(H * y0 / 100), round(H * y1 / 100)
    cols = np.arange(X0, X1) % W; o = P[Y0:Y1][:, cols]
    ef = f'{ed_dir}/{name}.png' if os.path.exists(f'{ed_dir}/{name}.png') else f'{ed_dir}/{name}.jpg'
    e = np.asarray(Image.open(ef).convert('RGB').resize((o.shape[1], o.shape[0]), Image.LANCZOS)).astype(np.float32)
    # potrivire fină: generatorul întoarce bucata la altă mărime și uneori ușor întinsă; se potrivește peste original după punctele
    # comune din interior (SIFT + transformare afină; ce e dincolo de geam s-a schimbat și e lăsat deoparte de RANSAC)
    f = 1400 / o.shape[1]; go = cv2.cvtColor(cv2.resize(o, None, fx=f, fy=f, interpolation=cv2.INTER_AREA).astype(np.uint8), cv2.COLOR_RGB2GRAY); ge = cv2.cvtColor(cv2.resize(e, None, fx=f, fy=f, interpolation=cv2.INTER_AREA).astype(np.uint8), cv2.COLOR_RGB2GRAY)
    sift = cv2.SIFT_create(8000); ko, do = sift.detectAndCompute(go, None); ke, de = sift.detectAndCompute(ge, None)
    good = [x for x, y in cv2.BFMatcher().knnMatch(de, do, k=2) if x.distance < .7 * y.distance]
    pe = np.float32([ke[g.queryIdx].pt for g in good]) / f; po = np.float32([ko[g.trainIdx].pt for g in good]) / f
    M, inl = cv2.estimateAffine2D(pe, po, method=cv2.RANSAC, ransacReprojThreshold=2.5 / f)
    n_in = int(inl.sum()); dev = float(np.abs(M - np.float32([[1, 0, 0], [0, 1, 0]]))[:, :2].max())
    assert n_in >= 25 and dev < .03, (name, n_in, dev)
    e = cv2.warpAffine(e, M, (o.shape[1], o.shape[0]), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)
    res = (pe[inl.ravel() == 1] @ M[:, :2].T + M[:, 2]) - po[inl.ravel() == 1]; err = float(np.hypot(res[:, 0], res[:, 1]).mean()); dy, dx = M[1, 2], M[0, 2]
    d = cv2.GaussianBlur(np.abs(e - o).max(2), (0, 0), 3)
    hard = (d > 16).astype(np.uint8); n, lab, st, _ = cv2.connectedComponentsWithStats(hard)
    big = np.zeros_like(hard)
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] > 6000: big[lab == i] = 1
    zone = cv2.dilate(big, np.ones((41, 41), np.uint8))                      # doar în jurul geamurilor: petele mici din interior nu se ating
    a = np.clip((d - 7) / (18 - 7), 0, 1) * zone
    a = cv2.GaussianBlur(cv2.dilate(a, np.ones((5, 5), np.uint8)), (0, 0), 2.5)
    if lim: xs = (np.arange(X0, X1) / W * 100); a[:, (xs < lim[0]) | (xs >= lim[1])] = 0
    for (ex0, ey0, ex1, ey1) in EXCL.get(name, []): a[round(ey0 * a.shape[0]):round(ey1 * a.shape[0]), round(ex0 * a.shape[1]):round(ex1 * a.shape[1])] = 0
    a[:6] = a[-6:] = 0; a[:, :6] = a[:, -6:] = 0; a = cv2.GaussianBlur(a, (0, 0), 1.5)
    comp = o * (1 - a[..., None]) + e * a[..., None]
    P[Y0:Y1][:, cols] = comp
    print(name, 'potriviri %d / %d' % (n_in, len(good)), 'mărire x %.4f y %.4f' % (M[0, 0], M[1, 1]), 'deplasare %.1f, %.1f px' % (dx, dy), 'abatere %.2f px' % err, 'schimbat %.1f%% din bucată' % (100 * float((a > .5).mean())))
    if chk:
        Image.fromarray((a * 255).astype(np.uint8)).resize((o.shape[1] // 3, o.shape[0] // 3)).save(f'{chk}/masca_{name}.png')
        Image.fromarray(comp.clip(0, 255).astype(np.uint8)).resize((o.shape[1] // 2, o.shape[0] // 2), Image.LANCZOS).save(f'{chk}/lipit_{name}.jpg', quality=88)
os.makedirs(out_dir, exist_ok=True)
for k, P in pan.items():
    im = Image.fromarray(P.clip(0, 255).astype(np.uint8))
    for suf, w in (('m', 4096), ('l', 6144)):
        ref = f'{p360}/{k}_{suf}.webp'; im.resize((w, w // 2), Image.LANCZOS).save(f'{out_dir}/{k}_{suf}.webp', 'WEBP', quality=82, method=6)
        print(k, suf, os.path.getsize(f'{out_dir}/{k}_{suf}.webp'), '(real:', os.path.getsize(ref), ')')
