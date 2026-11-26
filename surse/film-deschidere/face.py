# Filmul de la deschidere, care rulează singur: capsula apare ca schiță (plan), se „umple” în casă reală, acoperișul coboară pe ea,
# camera se rotește în jurul ei dimineața, apoi vine seara. Făcut din cadrele filmării reale (fără credite): python3 face.py
import cv2, numpy as np, os
R = lambda i: cv2.imread('fr/%04d.jpg' % i)
A = list(range(400, 216, -1)); B = list(range(216, -1, -1)); C = list(range(502, 648)); XF = 22; INTRO = 84; LINES = 14; OUTRO = 16
H, W = 1080, 1920
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
bg = np.zeros((H, W, 3), np.float32); t = yy / H; bg[..., 0] = 96 - 34 * t; bg[..., 1] = 52 - 22 * t; bg[..., 2] = 16 - 6 * t      # albastru de plan (BGR)
grid = ((xx % 60 < 1.2) | (yy % 60 < 1.2)).astype(np.float32) * 14; bg += grid[..., None]
def sketch(img, k=1.0):
    g = cv2.GaussianBlur(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), (0, 0), 2.3); e = cv2.Canny(g, 34, 92); e = cv2.dilate(e, np.ones((2, 2), np.uint8))
    e = cv2.GaussianBlur(e.astype(np.float32), (0, 0), .8) / 255.; glow = cv2.GaussianBlur(e, (0, 0), 6) * .55
    a = np.clip(e * 1.25 + glow, 0, 1)[..., None] * k; return bg * (1 - a) + np.array([255, 244, 226], np.float32) * a
ease = lambda x: x * x * (3 - 2 * x)
seq = [('A', i) for i in A] + [('B', i) for i in B]
n = 0
def put(img): 
    global n; cv2.imwrite('out/%04d.jpg' % n, np.clip(img, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 95]); n += 1
for j, (_, i) in enumerate(seq):
    img = R(i).astype(np.float32)
    if j < INTRO:
        sk = sketch(img.astype(np.uint8), min(1, (j + 1) / LINES))
        p = ease(max(0, (j - LINES) / (INTRO - LINES)))                       # cât s-a „umplut”
        d = (xx * .82 + (H - yy) * .57) / (W * .82 + H * .57)                  # frontul înaintează din stânga-jos spre dreapta-sus
        front = p * 1.24 - .12; m = np.clip((front - d) / .10, 0, 1); m = (m * m * (3 - 2 * m))[..., None]
        band = np.exp(-((d - front) / .028) ** 2)[..., None] * (1 - p) ** .4
        img = sk * (1 - m) + img * m + band * np.array([255, 236, 200], np.float32) * .85
    put(img)
a0 = R(0).astype(np.float32)
for k in range(XF): b = R(C[k]).astype(np.float32); u = ease((k + 1) / (XF + 1)); put(a0 * (1 - u) + b * u)     # dimineața se topește în seară
for k, i in enumerate(C[XF:]):
    img = R(i).astype(np.float32); left = len(C) - XF - k
    if left <= OUTRO: u = ease(1 - (left - 1) / OUTRO); img = img * (1 - u) + bg * u                              # la sfârșit se stinge în albastrul planului (filmul o ia de la capăt)
    put(img)
print('cadre', n)
