import numpy as np, sys
from PIL import Image
n=int(sys.argv[1]); W=int(sys.argv[2]); H=W//2
D=np.array([[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],float); UP=np.array([[0,1,0],[0,1,0],[0,0,-1],[0,0,1],[0,1,0],[0,1,0]],float)
u,v=np.meshgrid((np.arange(W)+.5)/W,(np.arange(H)+.5)/H); lon=(u-.5)*2*np.pi; lat=(.5-v)*np.pi
d=np.stack([-np.sin(lon)*np.cos(lat),np.sin(lat),np.cos(lon)*np.cos(lat)],-1)
for i in range(n):
    out=np.zeros((H,W,3),np.uint8); best=np.full((H,W),-1.0)
    for f in range(6):
        im=np.asarray(Image.open(f'c_{i}_{f}.png').convert('RGB')); S=im.shape[0]
        F=D[f]; R=np.cross(F,UP[f]); R/=np.linalg.norm(R); U=np.cross(R,F)
        a=d@F; m=a>best+1e-9; m&=a>0.3
        px=(d@R)/np.where(a>0,a,1); py=(d@U)/np.where(a>0,a,1); m&=(abs(px)<=1.0005)&(abs(py)<=1.0005)
        x=np.clip(((px+1)/2*S).astype(int),0,S-1); y=np.clip(((1-py)/2*S).astype(int),0,S-1)
        out[m]=im[y[m],x[m]]; best[m]=a[m]
    Image.fromarray(out).save(f'src_{i}.jpg',quality=93); print(i)
