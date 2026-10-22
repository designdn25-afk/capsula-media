import numpy as np,sys
from PIL import Image
Image.MAX_IMAGE_PIXELS=None
def view(eq,yaw,pitch,hfov,W=960,H=540):
    E=np.asarray(eq);h,w,_=E.shape
    f=(W/2)/np.tan(np.radians(hfov)/2)
    x,y=np.meshgrid(np.arange(W)-W/2+.5,np.arange(H)-H/2+.5)
    d=np.stack([x,-y,np.full_like(x,f)],-1);d/=np.linalg.norm(d,axis=-1,keepdims=True)
    p=np.radians(pitch);Rx=np.array([[1,0,0],[0,np.cos(p),np.sin(p)],[0,-np.sin(p),np.cos(p)]])
    t=np.radians(yaw);Ry=np.array([[np.cos(t),0,np.sin(t)],[0,1,0],[-np.sin(t),0,np.cos(t)]])
    d=d@Rx.T@Ry.T
    lon=np.arctan2(d[...,0],d[...,2]);lat=np.arcsin(np.clip(d[...,1],-1,1))
    u=((lon/np.pi+1)/2*w).astype(int)%w;v=((0.5-lat/np.pi)*h).astype(int).clip(0,h-1)
    return Image.fromarray(E[v,u])
if __name__=='__main__':
    k=sys.argv[1];eq=Image.open(f'out/{k}_l.webp').convert('RGB')
    vs=[(-70,5,110),(-35,5,110),(0,5,110),(40,5,110),(-50,10,130),(10,10,130)]
    o=Image.new('RGB',(960*2,540*3))
    for i,(y,p,hf) in enumerate(vs):o.paste(view(eq,y,p,hf),((i%2)*960,(i//2)*540))
    o.resize((1440,1215)).save(f'../pv_{k}.jpg',quality=82)
