import numpy as np,cv2,sys
sys.path.insert(0,'.')
from shiftfill2 import shift_fill2
from PIL import Image
D='../deploy/img/'
CROP=32
# ---------- imagine înaltă (telefon / panou pătrat): fotografia, fără cablu, fără banda neagră ----------
nt=np.asarray(Image.open(D+'hero_near_t.webp').convert('RGBA')).astype(np.float32)
ft=np.asarray(Image.open(D+'hero_far_t.webp').convert('RGB')).astype(np.float32)
tc=np.asarray(Image.open('t_comp.png').convert('RGB')).astype(np.float32)
tf=np.asarray(Image.open('t_comp_fill3.png').convert('RGB')).astype(np.float32)
ch=np.abs(tf-tc).max(2)>0.5
print('tall changed px',int(ch.sum()),'rows',np.where(ch.any(1))[0][[0,-1]])
assert (nt[...,3][ch]==255).all()
nt[ch,:3]=tf[ch];ft[ch]=tf[ch]
nt=nt[:,CROP:];ft=ft[:,CROP:]
gt=Image.open(D+'hero_glass_t.png');print('glass_t',gt.size,gt.mode)
gt=gt.crop((CROP//2,0,gt.size[0],gt.size[1]))
Image.fromarray(nt.clip(0,255).astype(np.uint8),'RGBA').save('out/hero_near_t.webp',quality=86,method=6)
Image.fromarray(ft.clip(0,255).astype(np.uint8)).save('out/hero_far_t.webp',quality=82,method=6)
gt.save('out/hero_glass_t.png',optimize=True)
print('tall size',nt.shape,'glass',gt.size)
# ---------- imagine lată (calculator): compoziția aprobată, fără cablu; solul întreg pe stratul apropiat ----------
fw=np.asarray(Image.open(D+'hero_far.webp').convert('RGB')).astype(np.float32)
nw=np.asarray(Image.open(D+'hero_near.webp').convert('RGBA')).astype(np.float32)
H,W=fw.shape[:2];a=nw[...,3:4]/255
C=fw*(1-a)+nw[...,:3]*a
M2=cv2.imread('cable_mask2.png',0)
Mw=np.zeros((H,W),np.uint8);Mw[:,700:700+M2.shape[1]]=M2
srcok=np.ones((H,W),bool);srcok[:,:700+CROP]=False
Cf,(DX,DY,yc)=shift_fill2(C,Mw,srcok,1250,H,lam=12,K=16)
print('wide DX',DX.astype(int).tolist(),'DY',DY.astype(int).tolist())
Image.fromarray(Cf.clip(0,255).astype(np.uint8)).save('w_comp_fill.png')
Image.fromarray(C.clip(0,255).astype(np.uint8)).save('w_comp.png')
chw=np.abs(Cf-C).max(2)>0.5
# linia orizontului (unde se termină cerul), apoi masca solului
b_,g_,r_=C[...,2],C[...,1],C[...,0]
sky=((b_>r_+40)&(b_>g_+10))
hor=np.zeros(W,np.float32)
for x in range(W):
    ys=np.where(sky[900:1400,x])[0];hor[x]=900+ys.max()+1 if len(ys) else 1172
hor=np.clip(cv2.GaussianBlur(hor.reshape(1,-1),(0,0),25).ravel(),1120,1200)
yy=np.arange(H)[:,None].astype(np.float32)
G=np.clip((yy-hor[None,:])/10+.5,0,1)
a2=np.maximum(a[...,0],G)
far_rgb=fw.copy();far_rgb[chw]=Cf[chw]
# culoarea stratului apropiat aleasă astfel încât imaginea în repaus să fie exact Cf
near_rgb=nw[...,:3].copy()
sel=(a2>0.02)&((G>0)|chw)
A2=a2[...,None]
sol=(Cf-far_rgb*(1-A2))/np.maximum(A2,1e-3)
near_rgb[sel]=np.clip(sol[sel],0,255)
nw2=np.dstack([near_rgb,a2*255])
Image.fromarray(nw2.clip(0,255).astype(np.uint8),'RGBA').save('out/hero_near_w.webp',quality=86,method=6)
Image.fromarray(far_rgb.clip(0,255).astype(np.uint8)).save('out/hero_far_w.webp',quality=82,method=6)
# verificare: aspectul în repaus trebuie să rămână identic în afara zonei cablului
fn=np.asarray(Image.open('out/hero_far_w.webp').convert('RGB')).astype(np.float32)
nn=np.asarray(Image.open('out/hero_near_w.webp').convert('RGBA')).astype(np.float32)
an=nn[...,3:4]/255;Cn=fn*(1-an)+nn[...,:3]*an
d=np.abs(Cn-C).mean(2)
outside=~cv2.dilate(chw.astype(np.uint8),np.ones((9,9),np.uint8)).astype(bool)
print('rest diff outside fill: mean',round(float(d[outside].mean()),2),'p99',round(float(np.percentile(d[outside],99)),1),'max',round(float(d[outside].max()),1))
print('ground fully on near (rows>=1210):',float((an[1210:,:,0]>0.99).mean()))
