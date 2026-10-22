import numpy as np,cv2
def _cands(res,k=10,rad=8):
    r=res.copy();out=[]
    for _ in range(k):
        i=np.argmin(r);v=r.flat[i]
        if not np.isfinite(v):break
        py,px=np.unravel_index(i,r.shape);out.append((py,px,float(v)))
        r[max(0,py-rad):py+rad+1,max(0,px-rad):px+rad+1]=np.inf
    return out
def shift_fill2(img,M,srcok,y0,y1,lam=40.0,verbose=False,K=10):
    H,W=M.shape;img=img.astype(np.float32)
    bad=((cv2.dilate(M,np.ones((5,5),np.uint8))>0)|(~srcok)).astype(np.float32)
    segs=[];y=y0
    while y<y1:
        h=int(40+(y-1262)*0.09);ya,yb=y,min(y1,y+h)
        Mk=np.zeros_like(M);Mk[ya:yb]=M[ya:yb];ys_,xs_=np.where(Mk>0)
        if len(xs_)==0:y+=h;continue
        xl,xr=xs_.min(),xs_.max();p=int(0.45*h)+8;q=max(26,int(0.6*h))
        ta,tb=max(0,ya-p),min(H,yb+p);tl,tr=max(0,xl-q),min(W,xr+q+1)
        T=img[ta:tb,tl:tr];known=((M[ta:tb,tl:tr]==0)&srcok[ta:tb,tl:tr]).astype(np.float32)
        hole=(Mk[ta:tb,tl:tr]>0).astype(np.float32)
        R=int(max(160,3.0*h));V=int(max(24,0.7*h))
        sa,sb=max(0,ta-V),min(H,tb+V);sl,sr=max(0,tl-R),min(W,tr+R)
        S=img[sa:sb,sl:sr]
        res=cv2.matchTemplate(S,T,cv2.TM_SQDIFF,mask=np.dstack([known]*3))/max(1.0,known.sum())
        ov=cv2.matchTemplate(bad[sa:sb,sl:sr],cv2.dilate(hole,np.ones((9,9),np.uint8)),cv2.TM_CCORR)
        ov2=cv2.matchTemplate((~srcok[sa:sb,sl:sr]).astype(np.float32),known,cv2.TM_CCORR)
        res[(ov>0.5)|(ov2>0.02*known.sum())]=np.inf
        cs=[((sa+py)-ta,(sl+px)-tl,v) for py,px,v in _cands(res,K)]
        segs.append(dict(ya=ya,yb=yb,yc=(ya+yb)/2,h=h,c=cs))
        y+=h
    # Viterbi: decalaje netede de la un segment la altul
    n=len(segs);cost=[np.array([c[2] for c in s['c']]) for s in segs];back=[None]*n
    acc=cost[0].copy()
    for i in range(1,n):
        A=np.array([[c[0],c[1]] for c in segs[i-1]['c']],np.float32);Bc=np.array([[c[0],c[1]] for c in segs[i]['c']],np.float32)
        hh=segs[i]['h']
        tr=lam*(((Bc[:,None,:]-A[None,:,:])**2).sum(2))/(hh*hh)*np.median(cost[i])
        tot=acc[None,:]+tr;back[i]=np.argmin(tot,1);acc=tot[np.arange(len(Bc)),back[i]]+cost[i]
    path=[int(np.argmin(acc))]
    for i in range(n-1,0,-1):path.append(int(back[i][path[-1]]))
    path=path[::-1]
    yc=np.array([s['yc'] for s in segs]);DY=np.array([segs[i]['c'][path[i]][0] for i in range(n)],np.float32);DX=np.array([segs[i]['c'][path[i]][1] for i in range(n)],np.float32)
    if verbose:
        for i in range(n):print(segs[i]['ya'],segs[i]['yb'],'dy,dx',int(DY[i]),int(DX[i]),'rank',path[i],'cost',round(segs[i]['c'][path[i]][2],1))
    rows=np.arange(H,dtype=np.float32)
    dyr=np.interp(rows,yc,DY);dxr=np.interp(rows,yc,DX)
    mapx=(np.arange(W,dtype=np.float32)[None,:]+dxr[:,None]).astype(np.float32)
    mapy=(rows[:,None]+dyr[:,None]+np.zeros((1,W),np.float32)).astype(np.float32)
    src=cv2.remap(img,mapx,mapy,cv2.INTER_CUBIC,borderMode=cv2.BORDER_REFLECT)
    # zonă de înlocuire = gaura lărgită; tăietură de cost minim stânga/dreapta
    out=img.copy();A=np.zeros((H,W),np.float32)
    err=cv2.GaussianBlur(((img-src)**2).sum(2),(0,0),1.0)
    core=cv2.dilate(M,np.ones((3,3),np.uint8))>0
    ys=[y for y in range(y0,y1) if core[y].any()]
    zl={};zr={};cl={};cr={}
    for y in ys:
        xs=np.where(core[y])[0];r=int(10+0.03*(y-1262))
        cl[y],cr[y]=xs.min(),xs.max();zl[y],zr[y]=max(0,xs.min()-r),min(W-1,xs.max()+r)
    def dpcut(side):
        # pentru fiecare rând: poziția tăieturii în [zl,cl] (stânga) sau [cr,zr] (dreapta)
        INF=1e18;prev=None;choices=[]
        for y in ys:
            lo,hi=(zl[y],cl[y]) if side=='L' else (cr[y],zr[y])
            xs=np.arange(lo,hi+1);e=err[y,lo:hi+1].astype(np.float64)
            if prev is None:cum=e.copy();bp=np.full(len(xs),-1)
            else:
                pxs,pcum=prev;cum=np.full(len(xs),INF);bp=np.full(len(xs),-1)
                for j,x in enumerate(xs):
                    m=np.abs(pxs-x)<=2
                    if m.any():k=np.argmin(np.where(m,pcum,INF));cum[j]=pcum[k]+e[j];bp[j]=k
                    else:k=np.argmin(np.abs(pxs-x));cum[j]=pcum[k]+e[j]+1e6;bp[j]=k
            choices.append((xs,bp));prev=(xs,cum)
        j=int(np.argmin(prev[1]));cut={}
        for idx in range(len(ys)-1,-1,-1):
            xs,bp=choices[idx];cut[ys[idx]]=int(xs[j]);j=int(bp[j]) if bp[j]>=0 else j
        return cut
    cutL=dpcut('L');cutR=dpcut('R')
    for y in ys:A[y,cutL[y]:cutR[y]+1]=1
    # corecție de culoare lină, doar din pixeli de cărămidă (fără rosturi) și limitată
    lumI=img@np.array([0.299,0.587,0.114],np.float32);lumS=src@np.array([0.299,0.587,0.114],np.float32)
    med=cv2.blur(lumI,(61,61))
    brick=(lumI>0.8*med)&(lumS>0.8*med)
    ring=(cv2.dilate(A,np.ones((25,25),np.uint8))>0)&(A==0)&srcok&brick
    dif=(img-src)*ring[...,None];wr=cv2.GaussianBlur(ring.astype(np.float32),(0,0),25)+1e-3
    corr=np.clip(cv2.GaussianBlur(dif,(0,0),25)/wr[...,None],-14,14)
    srcc=src+corr
    Af=cv2.GaussianBlur(A,(0,0),1.2);Af=np.maximum(Af,A*(cv2.distanceTransform((A>0).astype(np.uint8),cv2.DIST_L2,3)>2))
    Af=np.clip(Af,0,1)
    # gaura propriu-zisă trebuie acoperită complet
    Af[M>0]=1
    out=img*(1-Af[...,None])+srcc*Af[...,None]
    return out,(DX,DY,yc)
