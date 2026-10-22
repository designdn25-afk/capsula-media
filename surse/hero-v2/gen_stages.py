import numpy as np,cv2,json
from PIL import Image,ImageDraw,ImageFilter
E=700;HOR=1352-180
photo=np.asarray(Image.open('b_photo.webp').convert('RGB')).astype(np.float32)
H,W,_=photo.shape
cap=np.zeros((H,W),np.uint8);cap[:,E:]=cv2.imread('caps_mask.png',0)[180:2420]
capf=cv2.GaussianBlur(cap.astype(np.float32)/255,(0,0),1.2)[...,None]
gm=cv2.imread('glassV.png',0)
gf=cv2.GaussianBlur(gm.astype(np.float32)/255,(0,0),1.5)[...,None]
yy=np.arange(H)[:,None,None].astype(np.float32)
t=yy/H
L=photo.mean(2,keepdims=True)/255
# ---------- machetă albă ----------
st_top=np.array([226,229,234]);st_bot=np.array([196,201,208])
bg=st_top*(1-t)+st_bot*t+np.zeros((1,W,1))
lumS=cv2.GaussianBlur(L[...,0],(0,0),1.0)[...,None]
clay=(168+82*np.clip(lumS,0,1)**0.6)*np.array([1.0,0.996,0.988])
gy=np.clip((yy-650)/650,0,1)
glassc=np.array([206,218,228])*(1-0.18*gy)+np.array([150,168,186])*0.18*gy
clay=clay*(1-gf)+glassc*gf
sh=np.zeros((H,W),np.float32);cv2.ellipse(sh,(1440,1222),(800,52),1.5,0,360,1,-1)
sh=cv2.GaussianBlur(sh,(0,0),34)[...,None];bg=bg*(1-0.32*sh)
Image.fromarray((bg*(1-capf)+clay*capf).clip(0,255).astype(np.uint8)).save('b_clay.webp',quality=86,method=6)
# ---------- seara ----------
sky_t=np.array([16,22,54]);sky_m=np.array([58,50,108]);sky_h=np.array([236,132,72])
ts=np.clip(yy/HOR,0,1)
sky=np.where(ts<0.6,sky_t*(1-ts/0.6)+sky_m*(ts/0.6),sky_m*(1-(ts-0.6)/0.4)+sky_h*((ts-0.6)/0.4))+np.zeros((1,W,1))
skyT=sky*(0.8+0.35*L)
ground=photo*np.array([0.30,0.29,0.35])
b=np.clip((yy-(HOR-6))/12,0,1);night=skyT*(1-b)+ground*b
capN=photo*np.array([0.32,0.33,0.42])+np.array([6,6,12])
tg=np.clip((yy-700)/600,0,1);warm=np.array([255,200,128])*(1-tg)+np.array([255,152,72])*tg
gl=photo*0.12+warm*0.88*(0.88+0.12*L)
capN=capN*(1-gf)+gl*gf
night=night*(1-capf)+capN*capf
glow=Image.new('L',(W,H),0);gd=ImageDraw.Draw(glow)
T=json.load(open('trace.json'))
for l in T['acoperis'][:2]:gd.line([tuple(p) for p in l],fill=255,width=6)
gA=np.asarray(glow.filter(ImageFilter.GaussianBlur(3))).astype(np.float32)/255
gB=np.asarray(glow.filter(ImageFilter.GaussianBlur(22))).astype(np.float32)/255
spill=cv2.GaussianBlur(gm.astype(np.float32)/255,(0,0),60);spill=np.roll(spill,150,0)*(yy[...,0]>HOR-10)
halo=cv2.GaussianBlur(gm.astype(np.float32)/255,(0,0),18)*(1-gf[...,0])*(1-capf[...,0]*0.6)
night=night+np.array([255,215,160])*(gA[...,None]*0.9+gB[...,None]*0.5)+np.array([255,160,80])*(spill[...,None]*0.6+halo[...,None]*0.25)
Image.fromarray(night.clip(0,255).astype(np.uint8)).save('b_night.webp',quality=86,method=6)
o=Image.new('RGB',(1650,575))
for i,k in enumerate(['clay','night']):o.paste(Image.open(f'b_{k}.webp').convert('RGB').crop((500,350,2149,1500)).resize((825,575)),(i*825,0))
o.save('pv_two.jpg',quality=85)
