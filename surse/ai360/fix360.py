# python3 fix360.py intrare.png iesire.webp  -> aduce imaginea la 4096×2048 și potrivește marginile din stânga și din dreapta (să nu se vadă cusătura)
import sys
from PIL import Image
import numpy as np
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB').resize((4096, 2048), Image.LANCZOS)
a = np.asarray(im).astype(np.float32); W = a.shape[1]; K = 72
c = (a[:, 0, :] + a[:, W - 1, :]) / 2
for i in range(K):
    t = (1 - i / K) ** 2
    a[:, i, :] = a[:, i, :] * (1 - t) + c * t
    a[:, W - 1 - i, :] = a[:, W - 1 - i, :] * (1 - t) + c * t
Image.fromarray(a.clip(0, 255).astype(np.uint8)).save(out, 'WEBP', quality=86, method=6)
print(out)
