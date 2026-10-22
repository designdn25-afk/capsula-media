# Hărțile de adâncime pentru hero V2 3D -> site/img/x7s_depth.png (rulează din site/img).
# Canal R: etapele „teren” și „structură” (cu stiva de panouri din stânga).
# Canal G: etapele „capsula finalizată” și „seara”.
# Alb = aproape. Cerul e departe; pavajul se apropie liniar spre marginea de jos (așa e pentru un plan orizontal);
# un obiect primește adâncimea pavajului în punctul în care atinge solul.
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as nd
L=lambda n: np.asarray(Image.open(f'x7s_{n}.webp').convert('RGB')).astype(np.float32)
lot,fr,day=L('lot'),L('frame'),L('day')
H,W,_=lot.shape
HOR=815
def gnear(y): return np.where(y>HOR,.30+.70*np.clip((y-HOR)/(H-HOR),0,1),.06*np.clip(y/HOR,0,1))
def base(x):   # rândul de contact cu solul
    if x<520: return 930.0                      # stiva de panouri
    return 915+(850-915)*(x-900)/(1930-900)     # capsula / structura
yy=np.arange(H,dtype=np.float32)[:,None]
ground=gnear(yy)*np.ones((1,W),np.float32)
def objmask(img,close):
    d=np.abs(img-lot).mean(2)
    m=nd.median_filter(d,5)>34
    m[HOR:]=False; m[:150]=False
    xs=np.arange(W); m[:420,(xs<800)|(xs>1800)]=False   # deasupra rândului 420 doar capsula/structura (fără stâlpul din dreapta)
    m=nd.binary_opening(m,iterations=1)
    m=nd.binary_closing(m,iterations=close)
    lab,n=nd.label(m); s=nd.sum(m,lab,range(1,n+1))
    m=np.isin(lab,1+np.where(s>2500)[0]); m=nd.binary_fill_holes(m)
    cols=np.where(m.any(0))[0]
    top=np.full(W,H,dtype=float)
    for x in cols: top[x]=np.where(m[:,x])[0].min()
    # conturul de sus netezit: geamurile reflectă cerul și altfel ar rămâne „găuri” în siluetă
    sm_top=nd.minimum_filter1d(top,241)
    sm_top=np.where((np.arange(W)>=845)&(np.arange(W)<=1935),np.minimum(top,np.maximum(sm_top,nd.maximum_filter1d(np.where(top<H,top,0),9)*0+sm_top)),top)
    out=np.zeros_like(m)
    for x in range(W):
        if top[x]<H or (845<=x<=1935 and sm_top[x]<H):
            t=int(min(top[x],sm_top[x])) if 845<=x<=1935 else int(top[x]); out[t:int(base(x)),x]=True
    return out
def depth(m):
    near=ground.copy()
    for x in np.where(m.any(0))[0]:
        near[m[:,x],x]=gnear(np.float32(base(x)))
    return near
mA=objmask(fr,14); mB=objmask(day,8)
dA,dB=depth(mA),depth(mB)
sm=lambda a:np.asarray(Image.fromarray((np.clip(a,0,1)*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(9)).resize((W//2,H//2),Image.LANCZOS))
rgb=np.dstack([sm(dA),sm(dB),np.zeros((H//2,W//2),np.uint8)])
Image.fromarray(rgb).save('x7s_depth.png',optimize=True)
print('ok')
