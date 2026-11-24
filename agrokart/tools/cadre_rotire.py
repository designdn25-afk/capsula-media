#!/usr/bin/env python3
"""Face cadrele pentru rotirea 360 din doua filme (jumatate + jumatate).
Folosire: cadre_rotire.py film1.mp4 film2.mp4 folder_iesire [cadre_pe_jumatate]"""
import subprocess, sys, os, glob, shutil, tempfile
from PIL import Image
f1, f2, out = sys.argv[1:4]
per = int(sys.argv[4]) if len(sys.argv) > 4 else 48
os.makedirs(out + '/m', exist_ok=True)
for f in glob.glob(out + '/*.webp') + glob.glob(out + '/m/*.webp'): os.remove(f)
k = 0
for film in (f1, f2):
    tmp = tempfile.mkdtemp()
    subprocess.run(['ffmpeg', '-v', 'error', '-i', film, tmp + '/%04d.png'], check=True)
    fr = sorted(glob.glob(tmp + '/*.png'))
    n = len(fr)
    # fara ultimul cadru: el este egal cu primul cadru din filmul urmator
    idx = [round(i * (n - 1) / per) for i in range(per)]
    for i in idx:
        im = Image.open(fr[i]).convert('RGB')
        im.resize((1024, 570), Image.LANCZOS).save(f'{out}/{k:03d}.webp', quality=68, method=5)
        if k % 2 == 0:
            im.resize((640, 356), Image.LANCZOS).save(f'{out}/m/{k:03d}.webp', quality=64, method=5)
        k += 1
    shutil.rmtree(tmp)
print('cadre:', k)
