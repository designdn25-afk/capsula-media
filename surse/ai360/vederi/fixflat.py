# python3 fixflat.py sursa.jpg generat.png iesire.webp [latura_mare]
# Potrivește imaginea generată peste sursă (mică deplasare / mărire, dacă generatorul a mișcat cadrul) și o salvează pentru site.
import sys, numpy as np, cv2
from PIL import Image
src, gen, out = sys.argv[1:4]; L = int(sys.argv[4]) if len(sys.argv) > 4 else 3840
a = cv2.imread(src); b = cv2.imread(gen); H, W = b.shape[:2]
a = cv2.resize(a, (W, H), interpolation=cv2.INTER_CUBIC)
s = 1600 / W; ga = cv2.cvtColor(cv2.resize(a, None, fx=s, fy=s, interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY); gb = cv2.cvtColor(cv2.resize(b, None, fx=s, fy=s, interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY)
sift = cv2.SIFT_create(6000); ka, da = sift.detectAndCompute(ga, None); kb, db = sift.detectAndCompute(gb, None)
m = cv2.BFMatcher().knnMatch(db, da, k=2); good = [x for x, y in m if x.distance < .72 * y.distance]
M = None
if len(good) >= 12:
    pb = np.float32([kb[g.queryIdx].pt for g in good]) / s; pa = np.float32([ka[g.trainIdx].pt for g in good]) / s
    M, inl = cv2.estimateAffinePartial2D(pb, pa, method=cv2.RANSAC, ransacReprojThreshold=6 / s * s * 4)
    n = int(inl.sum()) if inl is not None else 0
    if M is not None:
        sc = float(np.hypot(M[0, 0], M[1, 0])); rot = float(np.degrees(np.arctan2(M[1, 0], M[0, 0]))); d = pb[inl.ravel() == 1] - pa[inl.ravel() == 1]
        print('potriviri %d / %d · mărire %.4f · rotire %.3f° · deplasare %.1f, %.1f px (din %d) · abatere medie înainte %.1f px' % (n, len(good), sc, rot, M[0, 2], M[1, 2], W, float(np.mean(np.hypot(d[:, 0], d[:, 1])))))
        if n < 25 or abs(sc - 1) > .06 or abs(rot) > 1.5: print('  potrivire nesigură: imaginea rămâne cum e'); M = None
else: print('prea puține potriviri (%d): imaginea rămâne cum e' % len(good))
if M is not None: b = cv2.warpAffine(b, M, (W, H), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)
im = Image.fromarray(cv2.cvtColor(b, cv2.COLOR_BGR2RGB)); k = L / max(W, H)
if k < 1: im = im.resize((round(W * k), round(H * k)), Image.LANCZOS)
im.save(out, 'WEBP', quality=84, method=6); print(out, im.size)
