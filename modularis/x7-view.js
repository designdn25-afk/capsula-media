import { makeX7Cutaway, X7_CUTAWAY_FOCUS } from './x7-cutaway.js';
import { x7Finish } from './x7-finish.js';
import { photographicFront } from './x7-optics.js';
export { preloadX7Glass } from './x7-finish.js';
export { preloadX7Optics } from './x7-optics.js';

const pi = Math.PI;
const V = (x,y,z) => [x,y,z];
const lightColor = '#e9eeed';
const darkColor = '#273940';
const sides = ['front','right','back','left'];

function adjust(color, brightness, add=0) {
  const v=Number.parseInt(color.slice(1),16);
  const channel = (value) => Math.max(0,Math.min(255,Math.round(value*brightness+add)));
  return 'rgb('+[v>>16,(v>>8)&255,v&255].map(channel).join(',')+')';
}
function surface(vertices,normal,color,texture,mapping) {
  return { vertices, normal, color, texture, mapping };
}
function label(face,side) {
  face.wall=side;
  return face;
}
function box(x0,x1,y0,y1,z0,z1,color) {
  const a=V(x0,y0,z1),b=V(x1,y0,z1),c=V(x1,y0,z0),d=V(x0,y0,z0);
  const A=V(x0,y1,z1),B=V(x1,y1,z1),C=V(x1,y1,z0),D=V(x0,y1,z0);
  return [surface([a,b,B,A],[0,0,1],adjust(color,.98)),
    surface([b,c,C,B],[1,0,0],adjust(color,.79)),
    surface([c,d,D,C],[0,0,-1],adjust(color,.80)),
    surface([d,a,A,D],[-1,0,0],adjust(color,.90)),
    surface([A,B,C,D],[0,1,0],adjust(color,1.04,3))];
}
// Points carry horizontal normals, so inset profiles retain concentric curved corners.
function perimeter(hx,hz,radius) {
  const edges=[];
  const point = (x,z,nx,nz) => ({x,z,nx,nz});
  const flat = (side,ax,az,bx,bz,nx,nz) => edges.push({side,a:point(ax,az,nx,nz),b:point(bx,bz,nx,nz)});
  const corner = (from,to,cx,cz,start) => {
    const n=9;
    const at=t=>{
      const a=start+t*pi/2;
      return point(cx+radius*Math.sin(a),cz+radius*Math.cos(a),Math.sin(a),Math.cos(a));
    };
    for(let i=0;i<n;i++) {
      const t=(i+.5)/n;
      edges.push({side:t<.5?from:to,from,to,t,a:at(i/n),b:at((i+1)/n)});
    }
  };
  flat('front',-hx+radius,hz,hx-radius,hz,0,1);
  corner('front','right',hx-radius,hz-radius,0);
  flat('right',hx,hz-radius,hx,-hz+radius,1,0);
  corner('right','back',hx-radius,-hz+radius,pi/2);
  flat('back',hx-radius,-hz,-hx+radius,-hz,0,-1);
  corner('back','left',-hx+radius,-hz+radius,pi);
  flat('left',-hx,-hz+radius,-hx,hz-radius,-1,0);
  corner('left','front',-hx+radius,hz-radius,3*pi/2);
  return edges;
}
function onRing(p,y,inset=0) {
  return V(p.x-p.nx*inset,y,p.z-p.nz*inset);
}
function normal(edge,ny=0) {
  const nx=edge.a.nx+edge.b.nx,nz=edge.a.nz+edge.b.nz,scale=Math.hypot(nx,nz);
  return [nx/scale,ny,nz/scale];
}
function wall(edge,low,high,inset,color,tex=null) {
  const a=onRing(edge.a,low,inset),b=onRing(edge.b,low,inset),A=onRing(edge.a,high,inset),B=onRing(edge.b,high,inset);
  return label(surface([a,b,B,A],normal(edge),color,tex,tex?[A,B,a]:null),edge.side);
}
function cornerTexture(edge,facades) {
  // A continuous transition across each radiused glass bay avoids a flat, box-like end.
  const a=facades[edge.from],b=facades[edge.to];
  const img=document.createElement('canvas');img.width=22;img.height=a.height;
  const c=img.getContext('2d');
  const bandA=Math.min(a.width*.20,94),bandB=Math.min(b.width*.20,94);
  const pieceA=Math.max(1,bandA/9.5),pieceB=Math.max(1,bandB/9.5);
  const xA=Math.max(0,a.width-pieceA-edge.t*(bandA-pieceA));
  const xB=(1-edge.t)*(bandB-pieceB);
  c.save();c.translate(img.width,0);c.scale(-1,1);
  c.drawImage(a,xA,0,pieceA,a.height,0,0,img.width,img.height);
  c.globalAlpha=edge.t;c.drawImage(b,xB,0,pieceB,b.height,0,0,img.width,img.height);
  c.restore();
  const glint=Math.exp(-((edge.t-.42)**2)/.016);
  c.fillStyle='rgba(224,237,242,'+glint*.13+')';
  c.fillRect(0,0,img.width,img.height);
  return img;
}
function decking() {
  const s=document.createElement('canvas');s.width=170;s.height=460;const c=s.getContext('2d');
  const g=c.createLinearGradient(0,0,s.width,0);
  g.addColorStop(0,'#756958');g.addColorStop(1,'#a39680');c.fillStyle=g;c.fillRect(0,0,s.width,s.height);
  for(let i=0;i<s.height;i+=16){c.fillStyle='#665c4e';c.fillRect(0,i,s.width,1.6);c.fillStyle='rgba(241,230,193,.22)';c.fillRect(0,i+1.8,s.width,1);}
  return s;
}

function rooftopClimate(x,z,y) {
  const result=box(x-.54,x+.54,y+.014,y+.18,z-.34,z+.34,'#909b9a');
  // Weather-shielded intake in the rear service zone, clear of the walking deck.
  for(let i=0;i<13;i++){
    const xx=x-.425+i*.07;
    result.push(...box(xx-.02,xx+.02,y+.18,y+.196,z-.255,z+.255,'#566466'));
  }
  return result;
}
function climatePanel(x,z,y) {
  const result=box(x-.54,x+.54,y,y+.83,z-.08,z,'#465357');
  result.push(...box(x-.49,x+.49,y+.05,y+.78,z-.10,z-.079,'#6e7c7e'));
  for(let i=0;i<14;i++){
    const yy=y+.089+i*.047;
    result.push(...box(x-.435,x+.435,yy,yy+.018,z-.114,z-.10,'#3c4a4e'));
  }
  return result;
}
function roofDeck(y,trim){
  const x0=-3.29,x1=4.57,z0=-1.27,z1=1.27;
  const floorY=y+.095,railTop=y+.96,result=box(x0,x1,y+.028,floorY,z0,z1,'#847968');
  const corners=[V(x0,floorY,z1),V(x1,floorY,z1),V(x1,floorY,z0),V(x0,floorY,z0)];
  const top=result[result.length-1];
  top.texture=decking();top.mapping=[corners[0],corners[1],corners[3]];
  for(const z of [z0+.035,z1-.035]){
    result.push(...box(x0+.03,x1-.03,railTop-.035,railTop,z-.020,z+.020,trim));
    result.push(...box(x0+.045,x1-.045,floorY+.10,floorY+.126,z-.015,z+.015,trim));
    for(let i=0;i<7;i++){
      const xx=x0+.055+i*(x1-x0-.11)/6;
      result.push(...box(xx-.020,xx+.020,floorY,railTop,z-.020,z+.020,trim));
      if(i<6){
        const next=xx+(x1-x0-.11)/6;
        const pts=[V(xx+.034,floorY+.13,z),V(next-.034,floorY+.13,z),V(next-.034,railTop-.04,z),V(xx+.034,railTop-.04,z)];
        result.push(surface(pts,[0,0,1],'rgba(159,192,195,.16)'),surface(pts,[0,0,-1],'rgba(159,192,195,.16)'));
      }
    }
  }
  for(const x of [x0+.055,x1-.055]){
    result.push(...box(x-.020,x+.020,railTop-.035,railTop,z0+.03,z1-.03,trim));
    result.push(...box(x-.016,x+.016,floorY+.10,floorY+.126,z0+.05,z1-.05,trim));
    result.push(...box(x-.020,x+.020,floorY,railTop,-.020,.020,trim));
    const pts=[V(x,floorY+.13,z0+.08),V(x,floorY+.13,z1-.08),V(x,railTop-.04,z1-.08),V(x,railTop-.04,z0+.08)];
    result.push(surface(pts,[1,0,0],'rgba(159,192,195,.16)'),surface(pts,[-1,0,0],'rgba(159,192,195,.16)'));
  }
  return result;
}

// Construction is independent of the timber house. The footprint, aluminium shell,
// recessed end balcony, panoramic belt and central entrance are characteristic of the X7.
export function x7Geometry(config, cutawayFocus = null) {
  const w=11.5,d=3.4,h=3.45,hx=w/2,hz=d/2,r=.56;
  const base=.36,lower=base+.115,upper=h-.19;
  const extras=new Set([...(Array.isArray(config.extras)?config.extras:[]),...(Array.isArray(config.optional)?config.optional:[])]);
  const interior=config.interior || {};
  const trim=config.roof?.trimColor || darkColor;
  const finish=Object.fromEntries(sides.map(side=>[side,config.walls?.[side]?.color||lightColor]));
  const topColor=config.walls?.top?.color || config.roof?.color || lightColor;
  const edges=perimeter(hx,hz,r),legs=[],envelope=[];
  if (X7_CUTAWAY_FOCUS.has(cutawayFocus)) {
    return makeX7Cutaway(cutawayFocus, extras, { w, d, h, edges }, box);
  }
  const roof=x7Finish('top',w,d,{shell:topColor,trim,extras});
  const textures=Object.fromEntries(sides.map(side=>{
    const spec={shell:finish[side],trim,extras,interior};
    const tex=x7Finish(side,(side==='front'||side==='back')?w-2*r:d-2*r,upper-lower,spec);
    return [side,side==='front'?photographicFront(tex,spec):tex];
  }));
  // Six load points and a recessed floor rail under the raised enclosure.
  legs.push(...box(-hx+.47,hx-.47,.255,base+.025,-hz+.26,hz-.26,'#374043'));
  for(const x of [-hx+1.02,0,hx-1.02]) for(const z of [-hz+.32,hz-.32]){
    legs.push(...box(x-.21,x+.21,.015,.067,z-.16,z+.16,'#525b5d'));
    legs.push(...box(x-.121,x+.121,.055,base-.025,z-.092,z+.092,'#697071'));
    legs.push(...box(x-.16,x+.16,base-.058,base-.018,z-.13,z+.13,'#828b89'));
  }
  if(extras.has('steps')) {
    for(let i=0;i<3;i++){
      const high=.15+i*.15,front=hz+.82-i*.26;
      legs.push(...box(-.57,.57,high-.08,high,front-.29,front,'#747d7e'));
      for(const x of [-.43,.43]) legs.push(...box(x-.035,x+.035,.025,high-.05,front-.22,front-.06,'#464e50'));
    }
  }
  function band(edge,y0,y1,inset0,inset1,level) {
    const n=normal(edge,(inset1-inset0)/(y1-y0));
    const a=onRing(edge.a,y0,inset0),b=onRing(edge.b,y0,inset0),A=onRing(edge.a,y1,inset1),B=onRing(edge.b,y1,inset1);
    const light=.91+.055*n[2]-.065*n[0]+Math.max(-.07,Math.min(.10,n[1]*.075));
    return label(surface([a,b,B,A],n,adjust(finish[edge.side],light*level,1)),edge.side);
  }
  const horizontalCover=(points,y,inset,color,tex)=>{
    const pts=points.map(edge=>onRing(edge.a,y,inset));
    const ox=-hx+inset,oz=hz-inset;
    const f=surface(pts,[0,1,0],color,tex,tex?[V(ox,y,oz),V(-ox,y,oz),V(ox,y,-oz)]:null);
    f.blocksPicking=true;return f;
  };
  // Recessed sliding wall leaves a covered balcony inside the labelled overall length.
  const doorX=hx-.78;
  const balconyEnd={side:'right',a:{x:doorX,z:hz-.09,nx:1,nz:0},b:{x:doorX,z:-hz+.09,nx:1,nz:0}};
  const door=wall(balconyEnd,base+.22,h-.255,0,trim,textures.right);door.shade=.115;envelope.push(door);
  const floorCorners=[V(doorX,base+.20,hz-.075),V(hx-.075,base+.20,hz-r),V(hx-.075,base+.20,-hz+r),V(doorX,base+.20,-hz+.075)];
  envelope.push(surface(floorCorners,[0,1,0],'#8f8474',decking(),[V(doorX,base+.20,hz-.075),V(hx-.075,base+.20,hz-.075),V(doorX,base+.20,-hz+.075)]));
  for(const edge of edges){
    const nearBalcony=edge.side==='right'||edge.from==='right'||edge.to==='right';
    const panel=finish[edge.side];
    if(!nearBalcony){
      const tex=edge.from?cornerTexture(edge,textures):textures[edge.side];
      const f=wall(edge,lower,upper,.003,panel,tex);
      f.shade=Math.max(0,.045+.085*f.normal[0]-.048*f.normal[2]);envelope.push(f);
    }else{
      // The outer five railing panels and the glass run around the balcony radius.
      // Slightly smoked rail glazing remains transparent against the recessed doors.
      const railBase=base+.26,railTop=base+1.18;
      const railing=wall(edge,railBase,railTop,.04,'rgba(105,140,146,.18)');envelope.push(railing);
      envelope.push(wall(edge,railTop-.023,railTop,.035,adjust(trim,.96,8)));
      envelope.push(wall(edge,railBase-.035,railBase,.039,adjust(trim,.93,6)));
      envelope.push(band(edge,lower,base+.26,.003,.001,.96));
      envelope.push(band(edge,h-.31,upper,.006,.003,.99));
    }
    // Stepped bevels catch narrow highlights along the continuous top and bottom mouldings.
    for(const [a,b,i0,i1,level] of [
      [base,base+.028,.105,.064,.69],[base+.028,base+.066,.064,.023,.87],[base+.066,lower,.023,.003,.994],
      [upper,h-.12,.003,0,.975],[h-.12,h-.071,0,.014,1.015],[h-.071,h-.03,.014,.045,1.025],[h-.03,h,.045,.095,1.017]
    ])envelope.push(band(edge,a,b,i0,i1,level));
  }
  // Four real posts at the end. Slim perimeter frames keep the glazing open.
  for(const z of [-hz+r,hz-r]){
    envelope.push(...box(hx-.085,hx-.045,base+.23,h-.29,z-.027,z+.027,trim));
  }
  for(const z of [-hz+.035,hz-.035]){
    envelope.push(...box(hx-r-.035,hx-r+.025,base+.225,h-.255,z-.027,z+.027,trim));
  }
  const roofFace=horizontalCover(edges,h,.095,topColor,roof);
  envelope.push(roofFace);
  if(extras.has('climate')){
    envelope.push(...climatePanel(.61,-hz,base+.75),...rooftopClimate(-4.45,-.55,h));
  }
  if(extras.has('roofTerrace'))envelope.push(...roofDeck(h,trim));
  const crownHeight=h+(extras.has('roofTerrace')?.96:extras.has('climate')?.20:0);
  // Painter draws support feet and stair treads first, then the convex shell and recessed glazing.
  return {w,d,base:0,deckFront:hz,stepFront:hz+(extras.has('steps')?.82:0),
    deckLeft:-hx,deckRight:hx,deckBack:-hz,top:h,crownHeight,surfaces:[legs,envelope],capsule:true};
}
