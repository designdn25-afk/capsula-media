# python3 fix360.py intrare.png iesire.webp  -> aduce imaginea la 4096×2048 și potrivește marginile din stânga și din dreapta (să nu se vadă cusătura)
# python3 fix360.py intrare.png iesire.webp <deplasare>  -> în plus, întoarce panorama: generatorul o dă uneori rotită față de sursă
#   (camera se uită în altă parte), iar pe site săgețile spre camere ajung atunci în locuri greșite. <deplasare> = cu câți pixeli
#   (socotiți la lățimea 1024, plus = spre dreapta) trebuie mutată ca să se potrivească cu <casă>_<cameră>_src.jpg.
#   Se măsoară cu: python3 fix360.py --masoara <sursa_src.jpg> <imagine.webp>  (și se verifică cu ochii, punând cele două imagini una lângă alta).
import sys
from PIL import Image
import numpy as np
if sys.argv[1] == '--masoara':   # cea mai bună potrivire a contururilor din banda de la mijloc, pentru toate deplasările pe orizontală
    import cv2
    def prep(path, W=1024, H=512):
        g = cv2.GaussianBlur(cv2.cvtColor(np.asarray(Image.open(path).convert('RGB').resize((W, H), Image.LANCZOS)), cv2.COLOR_RGB2GRAY).astype(np.float32), (0, 0), 1.2)
        e = np.hypot(cv2.Sobel(g, cv2.CV_32F, 1, 0, ksize=3), cv2.Sobel(g, cv2.CV_32F, 0, 1, ksize=3))[int(H * .22):int(H * .8)]; return (e - e.mean()) / (e.std() + 1e-6)
    a, b = prep(sys.argv[2]), prep(sys.argv[3]); cc = np.fft.irfft(np.fft.rfft(a, axis=1) * np.conj(np.fft.rfft(b, axis=1)), n=1024, axis=1).sum(0) / a.size
    s = int(np.argmax(cc)); print('deplasare %d px (din 1024) · potrivire %.3f · fără deplasare %.3f' % (s if s <= 512 else s - 1024, cc[s], cc[0])); sys.exit()
src, out = sys.argv[1], sys.argv[2]; shift = float(sys.argv[3]) if len(sys.argv) > 3 else 0
im = Image.open(src).convert('RGB').resize((4096, 2048), Image.LANCZOS)
a = np.asarray(im).astype(np.float32); W = a.shape[1]; K = 72
c = (a[:, 0, :] + a[:, W - 1, :]) / 2
for i in range(K):
    t = (1 - i / K) ** 2
    a[:, i, :] = a[:, i, :] * (1 - t) + c * t
    a[:, W - 1 - i, :] = a[:, W - 1 - i, :] * (1 - t) + c * t
if shift: a = np.roll(a, int(round(shift * W / 1024)), axis=1)   # după ce marginile au fost potrivite, mutarea nu lasă cusătură
Image.fromarray(a.clip(0, 255).astype(np.uint8)).save(out, 'WEBP', quality=86, method=6)
print(out)
