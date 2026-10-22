import numpy as np, glob, os, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from concurrent.futures import ProcessPoolExecutor
Image.MAX_IMAGE_PIXELS=None
R={'ext':'141403_00_230','prag':'141438_00_231','intrare':'141657_00_232','living':'153102_00_180','canapea':'155246_00_185',
   'masa':'155322_00_186','blat':'152419_00_175','hol':'155646_00_190','baie':'155757_00_191','dorm':'160248_00_194','dormf':'160029_00_193',
   'living_n':'160627_00_197','masa_n':'160841_00_200','baie_n':'160930_00_201','dorm_n':'160402_00_195','mijloc':'142005_00_236','vitraj':'141823_00_234','colt':'141925_00_235','dormu':'160451_00_196'}
BLOB={'ext','prag','intrare','mijloc','vitraj','colt'}
def logo(S=1200):
    im=Image.new('RGBA',(S,S),(0,0,0,0));d=ImageDraw.Draw(im)
    d.ellipse([0,0,S-1,S-1],fill=(22,24,28,255));d.ellipse([S*.06,S*.06,S*.94,S*.94],outline=(232,194,122,255),width=int(S*.012))
    f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',int(S*.085))
    f2=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',int(S*.05))
    for txt,fnt,y,col in [('CAPSULA',f,.40,(255,255,255,255)),('ROMÂNIA',f,.52,(232,194,122,255)),('casecapsula.ro',f2,.66,(200,200,200,255))]:
        w=d.textlength(txt,font=fnt);d.text(((S-w)/2,S*y-fnt.size/2),txt,font=fnt,fill=col)
    return np.asarray(im).astype(np.float32)/255
LOGO=None
def nadir(a,cap=12.0):
    global LOGO
    if LOGO is None:LOGO=logo()
    H,W,_=a.shape;rows=int(H*cap/180)+2;y0=H-rows
    yy,xx=np.mgrid[y0:H,0:W].astype(np.float32)
    pitch=90-(yy+.5)/H*180;yaw=(xx+.5)/W*360-180
    r=(90+pitch)/cap  # 0 at nadir,1 at edge
    th=np.radians(yaw)
    S=LOGO.shape[0];u=(0.5+0.5*r*np.sin(th))*(S-1);v=(0.5+0.5*r*np.cos(th))*(S-1)
    L=LOGO[np.clip(v.astype(int),0,S-1),np.clip(u.astype(int),0,S-1)]
    al=L[...,3:4]*np.clip((1-r[...,None])*25,0,1)
    a[y0:H]=a[y0:H]*(1-al)+L[...,:3]*255*al
def inpaint(a):
    import cv2
    H,W,_=a.shape
    x0,x1=int((70+180)/360*W),int((115+180)/360*W);y0,y1=int((90+62)/180*H),int((90+82)/180*H)
    reg=np.clip(a[y0:y1,x0:x1],0,255).astype(np.uint8)
    dark=(reg.max(axis=2)<62).astype(np.uint8)
    n,lab,st,_=cv2.connectedComponentsWithStats(dark)
    m=np.zeros((H,W),np.uint8)
    sc=(W/6144)**2
    for i in range(1,n):
        x,y,w,h,ar=st[i]
        if ar>2500*sc:m[y0:y1,x0:x1][lab==i]=1
    if m.sum()==0:return
    k=int(W/6144*25)|1
    M=cv2.dilate(m,np.ones((k,k),np.uint8))
    ring=cv2.dilate(M,np.ones((k*2,k*2),np.uint8))-M
    ys,xs=np.nonzero(M);ry,rx=np.nonzero(ring)
    best=None
    for deg in list(range(-110,-30,3))+list(range(30,110,3)):
        sh=int(deg/360*W)
        sx=(xs+sh)%W;srx=(rx+sh)%W
        src=a[ys,sx]
        if (src.max(axis=1)<60).mean()>0.02:continue
        d=((a[ry,srx]-a[ry,rx])**2).mean()
        if best is None or d<best[0]:best=(d,sh)
    if best is None:return
    sh=best[1]
    shifted=np.roll(a,-sh,axis=1)
    F=cv2.GaussianBlur(M.astype(np.float32),(k*2+1,k*2+1),0)[...,None]
    yA,yB=ys.min()-2*k,ys.max()+2*k;xA,xB=xs.min()-2*k,xs.max()+2*k
    a[yA:yB,xA:xB]=a[yA:yB,xA:xB]*(1-F[yA:yB,xA:xB])+shifted[yA:yB,xA:xB]*F[yA:yB,xA:xB]
def run(k):
    f=glob.glob(f'raw/*{R[k]}.jpg')[0]
    im=Image.open(f).convert('RGB')
    a=np.asarray(im.resize((8192,4096),Image.LANCZOS)).astype(np.float32)
    if k in BLOB:inpaint(a)
    nadir(a)
    X=Image.fromarray(np.clip(a,0,255).astype(np.uint8))
    X.save(f'out/{k}_x.webp','WEBP',quality=64,method=5)
    X.resize((6144,3072),Image.LANCZOS).save(f'out/{k}_l.webp','WEBP',quality=68,method=5)
    X.resize((4096,2048),Image.LANCZOS).save(f'out/{k}_m.webp','WEBP',quality=64,method=5)
    X.resize((2048,1024),Image.LANCZOS).save(f'out/{k}_s.webp','WEBP',quality=60,method=5)
    return k
if __name__=='__main__':
    ks=sys.argv[1:] or list(R)
    with ProcessPoolExecutor(4) as ex:
        for k in ex.map(run,ks):print(k,flush=True)
