# Lipește plăcile capturate (zoom 2x) într-o imagine la rezoluția nativă.
# Utilizare: python3 stitch.py OUT W H cols rows tile1 tile2 ... (ordine pe rânduri)
import sys
from PIL import Image
out,W,H,cols,rows=sys.argv[1],int(sys.argv[2]),int(sys.argv[3]),int(sys.argv[4]),int(sys.argv[5])
tiles=sys.argv[6:]
canvas=Image.new('RGB',(W,H))
tw,th=W//cols,H//rows
for i,t in enumerate(tiles):
    r,c=divmod(i,cols)
    im=Image.open(t).convert('RGB')
    x0,y0=c*tw,r*th
    x1=W if c==cols-1 else x0+tw
    y1=H if r==rows-1 else y0+th
    im=im.resize((x1-x0,y1-y0),Image.LANCZOS) if im.size!=(x1-x0,y1-y0) else im
    canvas.paste(im,(x0,y0))
    print(t,Image.open(t).size,'->',(x0,y0,x1,y1))
canvas.save(out)
