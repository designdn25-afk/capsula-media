import cv2,numpy as np,sys
from PIL import Image
def edgesmap(a):
    g=cv2.cvtColor(a,cv2.COLOR_RGB2GRAY).astype(np.float32)
    g=cv2.GaussianBlur(g,(0,0),2)
    gx=cv2.Sobel(g,cv2.CV_32F,1,0);gy=cv2.Sobel(g,cv2.CV_32F,0,1)
    m=np.sqrt(gx*gx+gy*gy);m/=np.percentile(m,99)+1e-6
    return np.clip(m,0,1).astype(np.float32)
def align(ref,mov,box,mode=cv2.MOTION_AFFINE):
    x0,y0,x1,y1=box
    r=edgesmap(ref);m=edgesmap(mov)
    mask=np.zeros(r.shape,np.uint8);mask[y0:y1,x0:x1]=255
    warp=np.eye(2,3,dtype=np.float32)
    best=None
    for lvl in [0.25,0.5,1.0]:
        rs=cv2.resize(r,None,fx=lvl,fy=lvl);ms=cv2.resize(m,None,fx=lvl,fy=lvl);mk=cv2.resize(mask,None,fx=lvl,fy=lvl,interpolation=cv2.INTER_NEAREST)
        w=warp.copy();w[:,2]*=lvl
        try:
            cc,w=cv2.findTransformECC(rs,ms,w,mode,(cv2.TERM_CRITERIA_EPS|cv2.TERM_CRITERIA_COUNT,300,1e-6),mk,5)
        except cv2.error as e:
            print('ecc fail',lvl,e);continue
        w[:,2]/=lvl;warp=w;best=cc
    return warp,best
if __name__=='__main__':
    ref=np.asarray(Image.open(sys.argv[1]).convert('RGB'))
    mov=np.asarray(Image.open(sys.argv[2]).convert('RGB').resize((ref.shape[1],ref.shape[0]),Image.LANCZOS))
    box=tuple(int(v) for v in sys.argv[4].split(','))
    w,cc=align(ref,mov,box)
    print('warp',w.tolist(),'cc',cc)
    out=cv2.warpAffine(mov,w,(ref.shape[1],ref.shape[0]),flags=cv2.INTER_LANCZOS4|cv2.WARP_INVERSE_MAP,borderMode=cv2.BORDER_REPLICATE)
    Image.fromarray(out).save(sys.argv[3])
    # overlay preview
    def ed(a):
        g=cv2.GaussianBlur(cv2.cvtColor(a,cv2.COLOR_RGB2GRAY),(0,0),1.5);return cv2.Canny(g,40,120)
    ov=np.zeros_like(ref);ov[...,0]=ed(ref);ov[...,1]=ed(out)
    Image.fromarray(ov).crop((800,250,2149,1150)).resize((1012,675)).save(sys.argv[3].rsplit('.',1)[0]+'_ov.png')
