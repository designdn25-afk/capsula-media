import { drawOpening } from './glazing.js';
import { preloadX7Glass, preloadX7Optics, x7Geometry } from './x7-view.js';
import { MODELS, defaultConfig } from './config.js';
const SIDES = ['front', 'right', 'back', 'left'];
const DETAIL = 100;
const TAU = Math.PI * 2;
const DEFAULT_CAMERA = { yaw: .515, pitch: .237 };
const X7_CAMERA = { yaw: -.55, pitch: .128 };
const X7_CUTAWAY_CAMERA = { yaw: -.48, pitch: .43 };
const CAMERAS = {
  '3d': DEFAULT_CAMERA,
  front: { yaw: 0, pitch: 0 },
  back: { yaw: Math.PI, pitch: 0 },
  side: { yaw: Math.PI / 2, pitch: 0 },
  right: { yaw: Math.PI / 2, pitch: 0 },
  left: { yaw: -Math.PI / 2, pitch: 0 },
  top: { yaw: 0, pitch: Math.PI / 2 }
};
const oak = '#b89269';
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
function rng(seed) {
  let n = seed >>> 0;
  return () => ((n = (Math.imul(n, 1664525) + 1013904223) >>> 0) / 4294967296);
}
function tint(hex, gain, offset = 0) {
  const s = /^#[\da-f]{6}$/i.test(hex) ? hex : oak;
  const c = Number.parseInt(s.slice(1), 16);
  return 'rgb(' + [c >> 16, (c >> 8) & 255, c & 255].map(x => Math.round(clamp(x * gain + offset, 0, 255))).join(',') + ')';
}
function texture(width, height) {
  const sheet = document.createElement('canvas');
  sheet.width = Math.max(1, Math.ceil(width));
  sheet.height = Math.max(1, Math.ceil(height));
  return [sheet, sheet.getContext('2d')];
}
function line(ctx, x1, y1, x2, y2, color, width) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}
function cladding(ctx, width, height, spec, seed) {
  const { orientation, material, color } = spec;
  const random = rng(seed);
  const horizontal = orientation === 'horizontal';
  ctx.save();
  if (horizontal) {
    ctx.translate(0, height);
    ctx.rotate(-Math.PI / 2);
  }
  const across = horizontal ? height : width;
  const length = horizontal ? width : height;
  if (material === 'wood') {
    const count = Math.max(1, Math.round(across / (horizontal ? 12.8 : 10.3)));
    const span = across / count;
    ctx.fillStyle = tint(color, .68);
    ctx.fillRect(0, 0, across, length);
    for (let i = 0; i < count; i++) {
      const x = i * span;
      const tone = .94 + random() * .14;
      const grad = ctx.createLinearGradient(x, 0, x + span, 0);
      grad.addColorStop(0, tint(color, tone * 1.03, 3));
      grad.addColorStop(.27, tint(color, tone, 5));
      grad.addColorStop(.82, tint(color, tone, 3));
      grad.addColorStop(.94, tint(color, tone * .95, 2));
      grad.addColorStop(1, tint(color, tone * .69));
      ctx.fillStyle = grad;
      ctx.fillRect(x + .65, 0, span - .6, length);
      for (let j = 0; j < 7; j++) {
        const gx = x + 1.5 + random() * Math.max(1, span - 3);
        const gy = -20 + random() * length;
        const extent = 20 + random() * length * .9;
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.bezierCurveTo(gx + .9, gy + extent * .28, gx - .7, gy + extent * .68, gx + .2, gy + extent);
        ctx.strokeStyle = j % 3 ? 'rgba(67,45,28,.085)' : 'rgba(255,231,187,.18)';
        ctx.lineWidth = .45 + random() * .55;
        ctx.stroke();
      }
      if (random() > .81) {
        const kx = x + span * (.32 + random() * .36);
        const ky = 8 + random() * (length - 16);
        ctx.beginPath();
        ctx.ellipse(kx, ky, span * .12, span * .49, .08, 0, TAU);
        ctx.strokeStyle = 'rgba(72,50,30,.14)';
        ctx.lineWidth = .65;
        ctx.stroke();
      }
    }
  } else if (material === 'metal') {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, across, length);
    const count = Math.ceil(across / 7);
    const span = across / count;
    for (let i = 0; i < count; i++) {
      const x = i * span;
      const g = ctx.createLinearGradient(x, 0, x + span, 0);
      [[0, .73], [.19, .8], [.35, 1.02], [.70, 1.02], [.78, .98], [1, .73]].forEach(([f,t]) => g.addColorStop(f,tint(color,t,2)));
      ctx.fillStyle = g;
      ctx.fillRect(x, 0, span + .5, length);
    }
  } else {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, across, length);
    const count = Math.max(1, Math.round(across / 41));
    const span = across / count;
    for (let i = 0; i < count; i++) {
      ctx.fillStyle = tint(color, .98 + random() * .04);
      ctx.fillRect(i * span, 0, span, length);
      line(ctx, i * span, 0, i * span, length, tint(color, .65), 1.2);
      line(ctx, i * span + 1, 0, i * span + 1, length, tint(color, 1.08), .7);
    }
  }
  ctx.restore();
}
function openingRects(span, side, opening) {
  const individual = Array.isArray(opening.items);
  const types = individual ? opening.items.slice(0,3) : Array(clamp(Math.round(Number(opening.count) || 1),1,3)).fill(opening.type);
  if (!types.length) return [];
  const sideElevation = side === 'right' || side === 'left';
  const margin = Math.min(span * .135, 1.14);
  const available = span - margin * 2;
  const gap = types.length > 1 ? Math.min(.50, span * .064) : 0;
  const bay = (available - (types.length - 1) * gap) / types.length;
  const slots = types.map(type => {
    const slider = type === 'slider', door = type === 'door';
    const cap = door ? 1.06 : slider ? (sideElevation ? 2.55 : 3.40) : (sideElevation ? 1.62 : 2.08);
    return { type, w:Math.min(cap,bay), bottom:slider || door ? .01 : sideElevation ? .8 : .95, top:slider || door ? 2.32 : 2.23 };
  });
  // Separately specified openings retain their own place when the next opening is edited.
  // Legacy configurations group matching openings together at the centre of the facade.
  const legacyStart = (span - slots.length * slots[0].w - (slots.length - 1) * gap) / 2;
  return slots.map((slot,i) => ({...slot,x:individual ? margin + i*(bay+gap) + (bay-slot.w)/2 : legacyStart+i*(slot.w+gap)}))
    .filter(slot => ['window','door','slider'].includes(slot.type));
}
function wallTexture(span, ambientHeight, rawSpec, openSpec, side, seed, roofHeightAt) {
  const [sheet, ctx] = texture(span * DETAIL, ambientHeight * DETAIL);
  const w = sheet.width, h = sheet.height;
  const spec = { material:'wood', color:oak, orientation:'vertical', ...rawSpec };
  cladding(ctx,w,h,spec,seed);
  const shade = ctx.createLinearGradient(0, 0, 0, h);
  shade.addColorStop(0, 'rgba(77,56,36,.06)');
  shade.addColorStop(.72, 'rgba(255,242,220,.035)');
  shade.addColorStop(1, 'rgba(52,45,37,.10)');
  ctx.fillStyle = shade;
  ctx.fillRect(0,0,w,h);
  // Soft shadows below the roof's edge follow the exact roof line.
  for (let x=0;x<w;x+=3) {
    const v = h - roofHeightAt(x/w*span) * DETAIL;
    const g = ctx.createLinearGradient(0,v,0,v+22);
    g.addColorStop(0,'rgba(39,33,26,.23)');
    g.addColorStop(.28,'rgba(50,42,32,.11)');
    g.addColorStop(1,'rgba(50,42,32,0)');
    ctx.fillStyle=g;
    ctx.fillRect(x,Math.max(0,v),3.1,22);
  }
  const fallback = side === 'front' ? {type:'slider', count:2} : {type:'window', count:1};
  const opening = {...fallback, ...openSpec};
  const panes = openingRects(span, side, opening);
  panes.forEach((a,i) => drawOpening(ctx,a.x*DETAIL,h-a.top*DETAIL,a.w*DETAIL,(a.top-a.bottom)*DETAIL,{type:a.type,index:i,wall:side}));
  const entry = panes.find(p => p.type === 'slider' || p.type === 'door');
  if (entry) {
    const x = entry.x * DETAIL - 18;
    const y = h - 1.79 * DETAIL;
    ctx.fillStyle='rgba(40,31,22,.17)';
    ctx.fillRect(x+1.9,y+2.2,4.5,14.8);
    ctx.fillStyle='#31322e'; ctx.fillRect(x,y,4.2,14);
    ctx.fillStyle='#64655b'; ctx.fillRect(x,y,.8,14);
    ctx.fillStyle='#e4cd9c'; ctx.fillRect(x+.8,y+13.3,2.8,1);
  }
  // Fixed studio lighting lets changes in orientation remain easy to read.
  const light = side === 'right' ? .185 : side === 'left' ? .075 : side === 'back' ? .13 : .00;
  if (light) {
    ctx.fillStyle='rgba(31,35,32,'+light+')';ctx.fillRect(0,0,w,h);
  }
  return sheet;
}
function roofTexture(w, depth, color, material) {
  const [sheet,ctx] = texture(w * DETAIL, depth * DETAIL);
  const width=sheet.width,height=sheet.height;
  const random=rng(3323);
  const gradient = ctx.createLinearGradient(0,0,width*.38,height);
  gradient.addColorStop(0,tint(color,1.02,9));
  gradient.addColorStop(.6,tint(color,.96,7));
  gradient.addColorStop(1,tint(color,.94,9));
  ctx.fillStyle=gradient;
  ctx.fillRect(0,0,width,height);
  if (material === 'shingle') {
    const tileW=34,tileH=14;
    for (let row=0;row<=height/tileH;row++) {
      for (let x = row%2 ? -tileW*.5 : 0;x<width;x+=tileW) {
        ctx.fillStyle=tint(color,.89+random()*.18,5);
        ctx.fillRect(x+1,row*tileH+1,tileW-1,tileH-1);
        line(ctx,x,row*tileH+tileH,x+tileW,row*tileH+tileH,tint(color,.57),1);
      }
    }
  } else {
    const n=Math.max(2,Math.round(width/40));
    const tileW=width/n;
    for (let i=0;i<=n;i++) {
      const x=i*tileW;
      ctx.fillStyle='rgba(0,0,0,'+(.009+random()*.045)+')';
      ctx.fillRect(x+3.2,0,tileW-3.2,height);
      line(ctx,x+2.2,0,x+2.2,height,tint(color,.70,1),2.5);
      line(ctx,x,0,x,height,tint(color,1.23,12),1.6);
    }
  }
  for (let i=0;i<width*height/75;i++) {
    ctx.fillStyle=i%2?'rgba(255,255,255,.03)':'rgba(0,0,0,.025)';
    ctx.fillRect(random()*width,random()*height,1,1);
  }
  return sheet;
}
function deckTexture(w,d) {
  const [sheet,ctx]=texture(w*DETAIL,d*DETAIL);
  // Same grain family as the cladding, with a paler oiled finish.
  cladding(ctx,sheet.width,sheet.height,{orientation:'horizontal',material:'wood',color:'#bd9b78'},12313);
  const wash=ctx.createLinearGradient(0,0,0,sheet.height);
  wash.addColorStop(0,'rgba(225,204,169,.1)');
  wash.addColorStop(1,'rgba(54,45,31,.14)');
  ctx.fillStyle=wash;
  ctx.fillRect(0,0,sheet.width,sheet.height);
  return sheet;
}
const vec=(x,y,z)=>[x,y,z];
function modelGeometry(config) {
  const { length: w, width: d } = MODELS[config?.model] || MODELS.compact;
  const roof={style:'mono', material:'metal', color:'#373b39', overhang:true,...config?.roof};
  const base=.29, nominalHeight=2.67;
  const overhang=roof.overhang ? .26 : .065;
  const high = Math.min(.95, d * .148);
  const top = z => roof.style === 'gable'
    ? nominalHeight + high*(1-Math.abs(z)/(d/2))
    : nominalHeight + (z/d + .5)*.20;
  const surfaces=[];
  function face(vertices, color, normal, texture = null, mapping = null) {
    return {vertices,color,normal,texture,mapping};
  }
  function box(x1,x2,z1,z2,y1,y2,colors,cover=null) {
    const a=vec(x1,y1,z2),b=vec(x2,y1,z2),c=vec(x2,y1,z1),e=vec(x1,y1,z1);
    const A=vec(x1,y2,z2),B=vec(x2,y2,z2),C=vec(x2,y2,z1),E=vec(x1,y2,z1);
    return [
      face([a,b,B,A],colors[0],[0,0,1]),
      face([b,c,C,B],colors[1],[1,0,0]),
      face([c,e,E,C],colors[1],[0,0,-1]),
      face([e,a,A,E],colors[0],[-1,0,0]),
      face([A,B,C,E],colors[2],[0,1,0],cover,cover?[A,B,E]:null)
    ];
  }
  const deckFront=d/2+.96;
  const deckLeft=-w/2-.18,deckRight=w/2+.18;
  const deckBack=-d/2-.13, deckWidth=deckRight-deckLeft;
  const deckMat=deckTexture(deckWidth,deckFront-deckBack);
  const stepLeft=-w/2+.35,stepRight=w/2-.35,stepFront=deckFront+.27;
  const step=box(stepLeft,stepRight,deckFront-.06,stepFront,.032,.135,['#a0886e','#89735d','#c2aa8d'],deckTexture(stepRight-stepLeft,.34));
  const frame=box(deckLeft+.10,deckRight-.10,deckBack+.10,deckFront-.095,.03,.19,['#4c453b','#413d37','#635b50']);
  const deck=box(deckLeft,deckRight,deckBack,deckFront,.16,.27,['#a38569','#8f755a','#c6a987'],deckMat);
  const reveal=box(-w/2+.02,w/2-.02,-d/2+.02,d/2-.02,.26,base+.025,['#514c41','#4b463e','#635848']);
  const starts=[[-w/2,d/2],[w/2,d/2],[w/2,-d/2],[-w/2,-d/2]];
  const normals=[[0,0,1],[1,0,0],[0,0,-1],[-1,0,0]];
  const maxH=nominalHeight+(roof.style==='gable'?high:.20);
  const walls=SIDES.map((side,i)=>{
    const [ax,az]=starts[i],[bx,bz]=starts[(i+1)%4];
    const len=i%2?d:w;
    const surfTop = s => top(az+(bz-az)*(s/len));
    const map=wallTexture(len,maxH,config?.walls?.[side], config?.openings?.[side],side,22136+i*353,surfTop);
    const verts=[vec(ax,base,az),vec(bx,base,bz),vec(bx,base+top(bz),bz)];
    if (i%2 && roof.style==='gable') verts.push(vec(ax,base+top(0),0));
    verts.push(vec(ax,base+top(az),az));
    const wallFace=face(verts,'#b19a81',normals[i],map,[vec(ax,base+maxH,az),vec(bx,base+maxH,bz),vec(ax,base,az)]);
    wallFace.wall=side;
    return wallFace;
  });
  const rx=w/2+overhang, rz=d/2+overhang;
  const cap=.12;
  const roofGroup=[];
  const matte=roof.color, trim=roof.trimColor || matte;
  const roofLevel=z=>base+top(z);
  const sections=roof.style==='gable'?[[rz,0],[0,-rz]]:[[rz,-rz]];
  for (const [za,zb] of sections) {
    const ya=roofLevel(za),yb=roofLevel(zb);
    const A=vec(-rx,ya+cap,za),B=vec(rx,ya+cap,za),C=vec(rx,yb+cap,zb),E=vec(-rx,yb+cap,zb);
    const bottom=(p)=>vec(p[0],p[1]-cap,p[2]);
    const normZ=(yb-ya)/(za-zb);
    roofGroup.push(
      face([A,B,C,E],matte,[0,1,normZ],roofTexture(2*rx,Math.hypot(za-zb,ya-yb),matte,roof.material),[A,B,E]),
      face([bottom(A),bottom(E),E,A],tint(trim,.85,2),[-1,0,0]),
      face([bottom(C),bottom(B),B,C],tint(trim,.77,1),[1,0,0])
    );
    if(za===rz) roofGroup.push(face([bottom(A),bottom(B),B,A],tint(trim,.89,2),[0,0,1]));
    if(zb===-rz) roofGroup.push(face([bottom(C),bottom(E),E,C],tint(trim,.80,1),[0,0,-1]));
    roofGroup.push(face([bottom(A),bottom(B),bottom(C),bottom(E)],tint(trim,.69,2),[0,-1,-normZ]));
  }
  for(const f of roofGroup) f.blocksPicking=true;
  surfaces.push(step,frame,deck,reveal,walls,roofGroup);
  return { w,d,base,deckFront,stepFront,deckLeft,deckRight,deckBack,top:base+maxH+cap,surfaces };
}
function capsuleShadow(g) {
  const layers=[];
  function softRectangle(cx,cz,width,depth,radius,softness,density,count) {
    // Integrate a penumbra from outside to inside. Keeping the outlines on the ground
    // plane also keeps each contact patch attached to its foot in a perspective view.
    for(let i=0;i<count;i++){
      const outer=(1-i/(count-1))*2-1;
      const grow=outer*softness;
      const hw=Math.max(.012,width/2+grow),hd=Math.max(.012,depth/2+grow);
      const r=Math.min(hw,hd,Math.max(.008,radius+grow));
      const points=[];
      for(let q=0;q<4;q++) {
        const sx=q===0||q===3?1:-1,sz=q<2?1:-1;
        for(let j=0;j<=5;j++){
          const angle=(q+j/5)*Math.PI/2;
          points.push(vec(cx+sx*(hw-r)+Math.cos(angle)*r,.003,cz+sz*(hd-r)+Math.sin(angle)*r));
        }
      }
      const weight=(1-Math.cos(2*Math.PI*(i+.5)/count))/count;
      layers.push({points,alpha:1-Math.pow(1-density,weight)});
    }
  }
  softRectangle(.49,-.56,g.w+.30,g.d+.53,.56,1.02,.20,17);
  softRectangle(.13,-.16,g.w-.15,g.d-.01,.48,.39,.26,14);
  for(const x of [-g.w/2+1.02,0,g.w/2-1.02]) for(const z of [-g.d/2+.32,g.d/2-.32]) {
    softRectangle(x+.013,z-.012,.42,.34,.06,.13,.48,9);
  }
  if(!g.cutaway && g.stepFront>g.deckFront)softRectangle(.018,(g.stepFront+g.deckFront)/2,1.18,g.stepFront-g.deckFront,.06,.14,.24,9);
  return {layers};
}
function groundShadow(g) {
  if(g.capsule)return capsuleShadow(g);
  const px=55, reach=3.2;
  const left=g.deckLeft-reach,right=g.deckRight+reach,front=g.stepFront+reach,back=g.deckBack-reach;
  const [image,c]=texture((right-left)*px,(front-back)*px);
  function footprint(x1,x2,z1,z2,softness,alpha) {
    c.save();c.filter='blur('+ (softness*px) +'px)';
    c.fillStyle='rgba(55,50,40,'+alpha+')';
    c.fillRect((x1-left)*px,(front-z2)*px,(x2-x1)*px,(z2-z1)*px);c.restore();
  }
  footprint(g.deckLeft-.05,g.deckRight+.52,g.deckBack-.65,g.deckFront+.04,.45,.22);
  footprint(g.deckLeft+.13,g.deckRight+.36,g.deckBack-.39,g.deckFront+.07,.14,.22);
  footprint(g.deckLeft+.06,g.deckRight+.12,g.deckBack-.13,g.deckFront+.035,.055,.26);
  footprint(-g.w/2+.29,g.w/2-.28,g.deckFront-.04,g.stepFront+.05,.07,.17);
  return {image, coords:[vec(left,.002,front),vec(right,.002,front),vec(left,.002,back)]};
}
function planting(g) {
  const ox=-g.w/2+.35, oz=g.d/2+.54, base=.275;
  const r=.175, rimY=base+.37;
  const random=rng(482);
  const translate=(x,y,z)=>vec(ox+x,base+y,oz+z);
  const pot=[];
  for(let i=0;i<32;i++) {
    const a=i*TAU/32,b=(i+1)*TAU/32;
    const p=(angle,rad,y)=>translate(rad*Math.cos(angle),y,rad*Math.sin(angle));
    const nx=Math.cos((a+b)/2),nz=Math.sin((a+b)/2);
    const gain=.82+(.5+(-nx*.54+nz*.83)*.5)*.26;
    pot.push({vertices:[p(a,r*.79,0),p(b,r*.79,0),p(b,r,.37),p(a,r,.37)],normal:[nx,0,nz],color:tint('#b9afa0',gain)});
  }
  pot.push({vertices:Array.from({length:32},(_,i)=>vec(ox+r*Math.cos(i*TAU/32),rimY,oz+r*Math.sin(i*TAU/32))),normal:[0,1,0],color:'#756f58'});
  const branches=[],leaves=[];
  const greens=['#757c57','#626e4c','#89916b','#69764f','#919672','#677151','#7c805e'];
  for(let i=0;i<23;i++) {
    const a=random()*TAU;
    const reach=.10+random()*.17;
    const height=.26+random()*.34;
    const tip=translate(Math.cos(a)*reach,.37+height,Math.sin(a)*reach);
    const start=translate((random()-.5)*.11,.36,(random()-.5)*.11);
    branches.push([start,tip]);
    for(let k=0;k<10;k++) {
      const t=.2+.8*random(), angle=a+(random()-.5)*2.5;
      const p=vec(start[0]+(tip[0]-start[0])*t,start[1]+(tip[1]-start[1])*t,start[2]+(tip[2]-start[2])*t);
      leaves.push({base:p,tip:vec(p[0]+Math.cos(angle)*.06,p[1]+.025+random()*.034,p[2]+Math.sin(angle)*.06),color:greens[Math.floor(random()*greens.length)]});
    }
  }
  return {pos:vec(ox,base,oz),pot,branches,leaves};
}
function drawPath(ctx,pts) {
  ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);
  ctx.closePath();
}
function paintImage(ctx,image,orig,right,below) {
  ctx.transform((right[0]-orig[0])/image.width,(right[1]-orig[1])/image.width,(below[0]-orig[0])/image.height,(below[1]-orig[1])/image.height,orig[0],orig[1]);
  ctx.drawImage(image,0,0);
}
function paintTriangle(ctx,image,p,q,r,u,v,du,dv) {
  const ex=q[0]-p[0],ey=q[1]-p[1],fx=r[0]-p[0],fy=r[1]-p[1];
  const det=ex*fy-ey*fx;
  if(Math.abs(det)<.01)return;
  // Overlap internal edges by a subpixel. The face's exact outer clipping path
  // stays in effect, so coverage never extends beyond the physical panel.
  const tri=[p,q,r],sign=Math.sign(det);
  const normals=tri.map((a,i)=>{
    const b=tri[(i+1)%3],dx=b[0]-a[0],dy=b[1]-a[1];
    const len=Math.hypot(dx,dy)||1;
    return [sign*dy/len,-sign*dx/len];
  });
  const expanded=tri.map((a,i)=>{
    const n=normals[i],m=normals[(i+2)%3];
    const extent=Math.min(2.5,.65/Math.max(.1,1+n[0]*m[0]+n[1]*m[1]));
    return [a[0]+(n[0]+m[0])*extent,a[1]+(n[1]+m[1])*extent];
  });
  ctx.save();drawPath(ctx,expanded);ctx.clip();
  const ax=ex/du,ay=ey/du,bx=fx/dv,by=fy/dv;
  ctx.transform(ax,ay,bx,by,p[0]-ax*u-bx*v,p[1]-ay*u-by*v);
  ctx.drawImage(image,0,0);
  ctx.restore();
}
function paintPerspectivePlane(ctx,image,mapping,project) {
  const [origin,right,below]=mapping;
  const uAxis=right.map((n,i)=>n-origin[i]),vAxis=below.map((n,i)=>n-origin[i]);
  const locate=(u,v)=>project(origin.map((n,i)=>n+u*uAxis[i]+v*vAxis[i]));
  const p=locate(0,0),q=locate(1,0),r=locate(0,1),s=locate(1,1);
  const midpointError=(a,b,mid)=>Math.hypot(mid[0]-(a[0]+b[0])/2,mid[1]-(a[1]+b[1])/2);
  const du=midpointError(p,q,locate(.5,0)),dv=midpointError(p,r,locate(0,.5));
  const skew=Math.hypot(s[0]-q[0]-r[0]+p[0],s[1]-q[1]-r[1]+p[1]);
  if(Math.max(du,dv,skew)<.55) {paintImage(ctx,image,p,q,r);return;}
  // Extra triangles only where the pinhole projection departs visibly from affine.
  const cols=clamp(Math.ceil(Math.sqrt((du+skew*.16)/.65)),1,12);
  const rows=clamp(Math.ceil(Math.sqrt((dv+skew*.16)/.65)),1,10);
  const grid=Array.from({length:rows+1},(_,j)=>Array.from({length:cols+1},(_,i)=>locate(i/cols,j/rows)));
  const tw=image.width/cols,th=image.height/rows;
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++) {
    const a=grid[j][i],b=grid[j][i+1],c=grid[j+1][i],d=grid[j+1][i+1];
    paintTriangle(ctx,image,a,b,c,i*tw,j*th,tw,th);
    paintTriangle(ctx,image,d,c,b,(i+1)*tw,(j+1)*th,-tw,-th);
  }
}
function paintFace(ctx,face,project,perspective) {
  const pts=face.vertices.map(project);
  ctx.save();
  drawPath(ctx,pts);
  ctx.fillStyle=face.color;
  ctx.fill();
  if(face.texture) {
    ctx.clip();
    ctx.save();
    if(perspective)paintPerspectivePlane(ctx,face.texture,face.mapping,project);
    else paintImage(ctx,face.texture,...face.mapping.map(project));
    ctx.restore();
    if(face.shade){drawPath(ctx,pts);ctx.fillStyle='rgba(28,38,42,'+face.shade+')';ctx.fill();}
  }
  ctx.restore();
}
function drawPlant(ctx,plant,camera,project,scale,drawBatch) {
  const shadow=project(plant.pos);
  if(camera[1]>.04) {
    ctx.save();ctx.translate(shadow[0],shadow[1]);
    ctx.scale(1,Math.max(.12,camera[1]));
    const r=.31*scale;
    const grad=ctx.createRadialGradient(.02*scale,0,0,.035*scale,0,r);
    grad.addColorStop(0,'rgba(45,43,32,.26)');grad.addColorStop(1,'rgba(45,43,32,0)');
    ctx.fillStyle=grad;ctx.fillRect(-r,-r,r*2.2,r*2);ctx.restore();
  }
  drawBatch(plant.pot);
  for(const [a,b] of plant.branches) {
    const p=project(a),q=project(b);
    line(ctx,p[0],p[1],q[0],q[1],'#747459',Math.max(.5,scale*.009));
  }
  for(const {base,tip,color} of plant.leaves) {
    const a=project(base),b=project(tip),dx=b[0]-a[0],dy=b[1]-a[1];
    const len=Math.hypot(dx,dy);
    if(len<.1)continue;
    ctx.save();ctx.translate((a[0]+b[0])/2,(a[1]+b[1])/2);ctx.rotate(Math.atan2(dy,dx));
    ctx.beginPath();ctx.ellipse(0,0,len*.55,scale*.012,0,0,TAU);
    ctx.fillStyle=color;ctx.fill();ctx.restore();
  }
}
function dimensions(ctx,g,project,camera) {
  const dx=camera[0]>=0?1:-1,dz=camera[2]>=0?1:-1;
  const frontEdge=dz>0?g.stepFront:g.deckBack;
  const sideEdge=dx>0?g.deckRight:g.deckLeft;
  const segments=[
    [vec(-g.w/2,.01,frontEdge+dz*.48),vec(g.w/2,.01,frontEdge+dz*.48),g.w],
    [vec(sideEdge+dx*.56,.01,-g.d/2),vec(sideEdge+dx*.56,.01,g.d/2),g.d]
  ];
  if(camera[1]<.9) {
    const low=vec(-dx*(g.w/2+.36),g.base,-dz*g.d/2),high=vec(low[0],g.top,low[2]);
    segments.push([low,high,Math.round((g.top-g.base)*100)/100]);
  }
  ctx.save();ctx.font='500 12px system-ui, sans-serif';ctx.textBaseline='middle';ctx.textAlign='center';
  for(const [p,q,measure] of segments) {
    const a=project(p),b=project(q);
    const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);
    if(len<38)continue;
    const tx=-dy/len*3.4,ty=dx/len*3.4,label=String(measure).replace('.',',')+' m';
    line(ctx,...a,...b,'#797a6d',.85);
    line(ctx,a[0]-tx,a[1]-ty,a[0]+tx,a[1]+ty,'#797a6d',1);
    line(ctx,b[0]-tx,b[1]-ty,b[0]+tx,b[1]+ty,'#797a6d',1);
    const x=(a[0]+b[0])/2,y=(a[1]+b[1])/2;
    const tw=ctx.measureText(label).width;
    ctx.fillStyle='#f4f3ef';ctx.fillRect(x-tw/2-5,y-9,tw+10,18);
    ctx.fillStyle='#4e5146';ctx.fillText(label,x,y);
  }
  ctx.restore();
}
function makeScene(config, layer) {
  const house=config.model==='x7' ? x7Geometry(config, layer) : modelGeometry(config);
  return {house,shadow:groundShadow(house),plant:house.capsule ? null : planting(house)};
}
function pointInPolygon(x,y,polygon) {
  let inside=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++) {
    const [xi,yi]=polygon[i], [xj,yj]=polygon[j];
    if ((yi>y)!==(yj>y) && x<(xj-xi)*(y-yi)/(yj-yi)+xi) inside=!inside;
  }
  return inside;
}
export function createViewer(canvas,{onViewChange,onWallSelect}={}) {
  const ctx=canvas.getContext('2d',{alpha:true});
  let scene=null, currentConfig=null, latestConfig=null, opticsStarted=false;
  let yaw=DEFAULT_CAMERA.yaw,pitch=DEFAULT_CAMERA.pitch,zoomAmount=1,view='3d',showDimensions=false;
  let activeLayer=null;
  let frame=0,tween=0,closing=false,drag=null,tap=null;
  const captured=new Map(), pickSurfaces=[];
  const reduced=typeof matchMedia!=='undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  canvas.style.touchAction='none';
  canvas.style.cursor='grab';
  const announce=(name)=>{
    if(name!==view){view=name;onViewChange?.(name);}
  };
  const schedule=()=>{if(!frame&&!closing)frame=requestAnimationFrame(draw);};
  function perspectiveCamera() {
    if (activeLayer) return X7_CUTAWAY_CAMERA;
    return latestConfig?.model === 'x7' ? X7_CAMERA : DEFAULT_CAMERA;
  }
  function update(config, layer = null) {
    if(closing)return;
    const settings=config||defaultConfig();
    const key=JSON.stringify([settings.model,settings.roof,settings.walls,settings.openings,settings.extras,settings.interior,settings.optional,layer]);
    if(key===currentConfig)return;
    const x7=settings.model==='x7',previous=latestConfig?.model;
    const switchedScene = Boolean(activeLayer) !== Boolean(layer);
    latestConfig=settings;
    activeLayer=layer;
    if(switchedScene || (view==='3d' && (!previous || (previous==='x7')!==x7))) {
      stopTween();
      const camera=perspectiveCamera();
      yaw=camera.yaw;pitch=camera.pitch;
      if(switchedScene) { zoomAmount=1; announce('3d'); }
    }
    currentConfig=key;scene=makeScene(settings,activeLayer);schedule();
    if(x7 && !opticsStarted && typeof Image!=='undefined'){
      opticsStarted=true;
      Promise.allSettled([preloadX7Optics,preloadX7Glass].map(load=>Promise.resolve().then(load))).then(results=>{
        if(closing || latestConfig?.model!=='x7' || !results.some(r=>r.status==='fulfilled'))return;
        scene=makeScene(latestConfig,activeLayer);schedule();
      });
    }
  }
  function draw(){
    frame=0;
    const rect=canvas.getBoundingClientRect(),w=rect.width,h=rect.height;
    if(!ctx||!w||!h)return;
    const dpr=Math.min(window.devicePixelRatio||1,2.2);
    const bw=Math.max(1,Math.round(w*dpr)),bh=Math.max(1,Math.round(h*dpr));
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;}
    ctx.setTransform(bw/w,0,0,bh/h,0,0);ctx.clearRect(0,0,w,h);
    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality='high';
    if(!scene)update(defaultConfig());
    const sy=Math.sin(yaw),cy=Math.cos(yaw),sp=Math.sin(pitch),cp=Math.cos(pitch);
    const camera=[sy*cp,sp,cy*cp],g=scene.house;
    const perspective=g.capsule&&view==='3d';
    const eyeDistance=27.5,aimHeight=g.capsule?g.top*.45:0;
    const eye=[eyeDistance*camera[0],aimHeight+eyeDistance*camera[1],eyeDistance*camera[2]];
    const dot=p=>p[0]*camera[0]+p[1]*camera[1]+p[2]*camera[2];
    const bare=([x,y,z])=>{
      const height=y-(perspective?aimHeight:0);
      const depth=sy*x+cy*z;
      const lens=perspective?eyeDistance/(eyeDistance-cp*depth-sp*height):1;
      return [(cy*x-sy*z)*lens,(sp*depth-cp*height)*lens];
    };
    const corners=[];
    const maxHeight=Math.max(g.top,g.crownHeight||0);
    for(const x of [g.deckLeft-.13,g.deckRight+.13]) {
      for(const z of [g.deckBack-.12,g.stepFront]) {
        corners.push(bare(vec(x,0,z)));
        corners.push(bare(vec(x,maxHeight,Math.min(z,g.d/2+.24))));
      }
    }
    const lo=[Math.min(...corners.map(p=>p[0])),Math.min(...corners.map(p=>p[1]))],hi=[Math.max(...corners.map(p=>p[0])),Math.max(...corners.map(p=>p[1]))];
    // Fit the whole house against whichever edge is limiting in this layout.
    // Reserve extra space for dimension lines only when they are displayed.
    const dimensionLines = showDimensions && !g.cutaway;
    const fillWidth=dimensionLines ? .83 : .94;
    const fillHeight=dimensionLines ? .74 : .90;
    const scale=Math.min(w*fillWidth/(hi[0]-lo[0]),h*fillHeight/(hi[1]-lo[1]))*zoomAmount;
    const xCenter=(hi[0]+lo[0])/2,yCenter=(hi[1]+lo[1])/2;
    const project=p=>{const a=bare(p);return [w/2+(a[0]-xCenter)*scale,h*.505+(a[1]-yCenter)*scale];};
    const depth=face=>face.vertices.reduce((n,p)=>n+dot(p),0)/face.vertices.length;
    const facesEye=face=>{
      if(!perspective)return dot(face.normal)>.00001;
      const a=face.vertices[0],n=face.normal;
      return n[0]*(eye[0]-a[0])+n[1]*(eye[1]-a[1])+n[2]*(eye[2]-a[2])>.00001;
    };
    pickSurfaces.length=0;
    const drawBatch=batch=>{
      const visible=batch.filter(facesEye).sort((a,b)=>depth(a)-depth(b));
      for(const f of visible){
        paintFace(ctx,f,project,perspective);
        if(onWallSelect && (f.wall || f.blocksPicking)){
          pickSurfaces.push({wall:f.wall,polygon:f.vertices.map(project)});
        }
      }
    };
    if(g.capsule && (perspective || sp>.004)){
      ctx.save();ctx.fillStyle='#353c3d';
      for(const layer of scene.shadow.layers){
        ctx.globalAlpha=layer.alpha;
        drawPath(ctx,layer.points.map(project));ctx.fill();
      }
      ctx.restore();
    }else if(sp>.004){
      ctx.save();paintImage(ctx,scene.shadow.image,...scene.shadow.coords.map(project));ctx.restore();
    }else{
      const a=project(vec(0,0,0)),shadowWidth=scale*(Math.abs(cy)*g.w+Math.abs(sy)*g.d)*.59;
      ctx.save();ctx.translate(a[0],a[1]);ctx.scale(shadowWidth,Math.max(2,scale*.035));
      const grad=ctx.createRadialGradient(0,0,0,0,0,1);
      grad.addColorStop(0,'rgba(52,47,37,.19)');grad.addColorStop(.82,'rgba(52,47,37,.12)');grad.addColorStop(1,'rgba(52,47,37,0)');
      ctx.fillStyle=grad;ctx.fillRect(-1,-1,2,2);ctx.restore();
    }
    const inFront=camera[2]>=0 || (camera[0]<-.035&&camera[2]>-.18);
    for(let i=0;i<g.surfaces.length;i++){
      if(scene.plant&&i===3&&!inFront)drawPlant(ctx,scene.plant,camera,project,scale,drawBatch);
      drawBatch(g.surfaces[i]);
    }
    if(scene.plant&&inFront)drawPlant(ctx,scene.plant,camera,project,scale,drawBatch);
    if(dimensionLines)dimensions(ctx,g,project,camera);
  }
  function stopTween(){if(tween)cancelAnimationFrame(tween);tween=0;}
  function goTo(name,restoreZoom=false) {
    if(!Object.hasOwn(CAMERAS,name))return;
    announce(name==='left' || name==='right' ? 'side' : name);stopTween();
    const dest=name==='3d'?perspectiveCamera():CAMERAS[name];
    const fromY=yaw,fromP=pitch,fromZ=zoomAmount;
    const delta=((dest.yaw-yaw+Math.PI*3)%TAU+TAU)%TAU-Math.PI;
    if(reduced){yaw=dest.yaw;pitch=dest.pitch;if(restoreZoom)zoomAmount=1;schedule();return;}
    const started=performance.now();
    function move(now){
      const u=Math.min(1,(now-started)/310),t=1-(1-u)**3;
      yaw=fromY+delta*t;pitch=fromP+(dest.pitch-fromP)*t;
      if(restoreZoom)zoomAmount=fromZ+(1-fromZ)*t;
      schedule();
      if(u<1)tween=requestAnimationFrame(move);else tween=0;
    }
    tween=requestAnimationFrame(move);
  }
  function zoom(factor) {
    if(!Number.isFinite(factor)||factor<=0)return;
    stopTween();zoomAmount=clamp(zoomAmount*factor,.56,2.5);schedule();
  }
  function centroid(){
    const ps=[...captured.values()];
    return {x:ps.reduce((v,p)=>v+p.x,0)/ps.length,y:ps.reduce((v,p)=>v+p.y,0)/ps.length,spacing:ps.length===2?Math.hypot(ps[0].x-ps[1].x,ps[0].y-ps[1].y):0};
  }
  function pointerDown(e){
    if(e.pointerType==='mouse'&&e.button!==0)return;
    stopTween();captured.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture?.(e.pointerId);
    tap=captured.size===1 ? {x:e.clientX,y:e.clientY,id:e.pointerId} : null;
    drag=centroid();canvas.style.cursor='grabbing';
  }
  function pointerMove(e){
    if(!captured.has(e.pointerId))return;
    if(tap && Math.hypot(e.clientX-tap.x,e.clientY-tap.y)<5)return;
    tap=null;
    captured.set(e.pointerId,{x:e.clientX,y:e.clientY});const next=centroid();
    if(drag){
      const dx=next.x-drag.x,dy=next.y-drag.y;
      if(next.spacing&&drag.spacing)zoomAmount=clamp(zoomAmount*next.spacing/drag.spacing,.56,2.5);
      if(Math.abs(dx)+Math.abs(dy)>.025){
        yaw-=dx*.009;pitch=clamp(pitch+dy*.0075,0,Math.PI/2);
        announce('3d');
      }
      schedule();
    }
    drag=next;
  }
  function pointerEnd(e){
    if(!captured.has(e.pointerId))return;
    const selected=tap && tap.id===e.pointerId && e.type==='pointerup' && Math.hypot(e.clientX-tap.x,e.clientY-tap.y)<5;
    tap=null;
    if(selected && onWallSelect) {
      const rect=canvas.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;
      for(let i=pickSurfaces.length-1;i>=0;i--) {
        const f=pickSurfaces[i];
        if(pointInPolygon(x,y,f.polygon)) {
          if(f.wall)onWallSelect(f.wall);
          break;
        }
      }
    }
    captured.delete(e.pointerId);
    drag=captured.size?centroid():null;
    canvas.style.cursor=drag?'grabbing':'grab';
  }
  function wheel(e){e.preventDefault();zoom(Math.exp(-Math.max(-160,Math.min(160,e.deltaY))*.0016));}
  function dbl(){goTo('3d',true);}
  function key(e){
    if(e.altKey||e.metaKey||e.ctrlKey)return;
    switch(e.key){
      case 'ArrowLeft':yaw+=.13;break;
      case 'ArrowRight':yaw-=.13;break;
      case 'ArrowUp':pitch=clamp(pitch+.085,0,Math.PI/2);break;
      case 'ArrowDown':pitch=clamp(pitch-.085,0,Math.PI/2);break;
      case '+':case '=':e.preventDefault();zoom(1.13);return;
      case '-':e.preventDefault();zoom(1/1.13);return;
      case 'Home':e.preventDefault();dbl();return;
      default:return;
    }
    e.preventDefault();stopTween();announce('3d');schedule();
  }
  const listeners=[['pointerdown',pointerDown],['pointermove',pointerMove],['pointerup',pointerEnd],['pointercancel',pointerEnd],['lostpointercapture',pointerEnd],['wheel',wheel,{passive:false}],['dblclick',dbl],['keydown',key]];
  for(const args of listeners)canvas.addEventListener(...args);
  const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(schedule):null;
  observer?.observe(canvas);window.addEventListener('resize',schedule);schedule();
  return {
    update,
    setView(name){goTo(name);},
    zoom,
    reset(){goTo('3d',true);},
    setDimensions(value){showDimensions=Boolean(value);schedule();},
    destroy(){
      closing=true;stopTween();cancelAnimationFrame(frame);observer?.disconnect();window.removeEventListener('resize',schedule);
      for(const args of listeners)canvas.removeEventListener(...args);
    }
  };
}
