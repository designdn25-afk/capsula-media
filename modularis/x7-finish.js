// Elevation textures share their datum and edge glazing height on the wrapped X7 shell.
const SCALE = 112;
const photoLayers = new Map();
let photoReady;

// Reuse this promise from the viewer and invalidate its elevation cache when it resolves.
// A failed or unavailable local asset leaves the corresponding procedural glass intact.
export function preloadX7Glass() {
  if (photoReady) return photoReady;
  if (typeof Image === 'undefined') return Promise.resolve();
  const layers=['long-a','long-b','end','furnished-lounge','furnished-seating'];
  photoReady=Promise.all(layers.map(name=>new Promise(resolve=>{
    const image=new Image();
    image.onload=()=>{photoLayers.set(name,image);resolve();};
    image.onerror=()=>resolve();
    image.src=new URL('./assets/x7-glass-'+name+'.webp',import.meta.url).href;
  }))).then(()=>undefined);
  return photoReady;
}

function photo(c, name, opacity) {
  const img=photoLayers.get(name);
  if (!img) return false;
  c.save();
  c.globalAlpha*=opacity;
  c.drawImage(img,0,0,1,1);
  c.restore();
  return true;
}

function gradient(c, x0, y0, x1, y1, colors) {
  const g = c.createLinearGradient(x0,y0,x1,y1);
  for (const [p,color] of colors) g.addColorStop(p,color);
  return g;
}
function path(c, points, close=true) {
  c.beginPath();
  points.forEach(([x,y],i)=>i ? c.lineTo(x,y) : c.moveTo(x,y));
  if (close) c.closePath();
}
function fill(c, points, color) {
  path(c,points); c.fillStyle=color; c.fill();
}
function line(c, points, color, width=1) {
  path(c,points,false); c.lineWidth=width; c.strokeStyle=color; c.stroke();
}
function box(c,x,y,w,h,paint) {
  c.fillStyle=paint; c.fillRect(x,y,w,h);
}
function shade(hex, amount) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  const raw = parseInt(m ? m[1] : 'e7e6df',16);
  const blend = channel => Math.round(amount > 0 ? channel+(255-channel)*amount : channel*(1+amount));
  return `rgb(${blend(raw>>16)},${blend((raw>>8)&255)},${blend(raw&255)})`;
}
function rng(seed) {
  return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0; return seed/4294967296;};
}
function aluminum(c,w,h,shell) {
  box(c,0,0,w,h,gradient(c,0,0,w*0.38,h,[
    [0,shade(shell,.20)],[.33,shade(shell,.045)],[.66,shade(shell,-.05)],[.89,shade(shell,-.115)],[1,shade(shell,-.05)]
  ]));
}
function floorPaint(c, material, opacity=1) {
  if (material!=='oak' && material!=='stone') return;
  c.save();
  path(c,[[0,1],[.20,.72],[.85,.72],[1,1]]);
  c.clip();
  c.globalAlpha*=opacity;
  const oak=material==='oak';
  box(c,0,.72,1,.28,gradient(c,0,.70,.08,1,oak
    ? [[0,'#99815c'],[.42,'#ba966c'],[1,'#d0a773']]
    : [[0,'#969a95'],[.48,'#b1b7b4'],[1,'#a6aaa5']]));
  for (let i=-6;i<10;i++) {
    const from=.51+i*(oak ? .057 : .15),to=.51+i*(oak ? .115 : .32);
    line(c,[[from,.72],[to,1]],oak?'rgba(80,61,39,.34)':'rgba(66,72,69,.43)',oak ? .0016 : .0027);
    if(oak) line(c,[[from+.01,.72],[(from+to)*.5+.017,.85],[to+.02,1]],'rgba(227,195,146,.38)',.0018);
  }
  for(const at of oak?[.79,.895,.945]:[.79,.91]) {
    if(oak) {
      const offset=.2+(at-.74)*2.1;
      line(c,[[offset,at],[offset+.095,at]],'rgba(80,61,39,.32)',.0018);
    } else line(c,[[0,at],[1,at]],'rgba(73,79,76,.36)',.0028);
  }
  c.restore();
}
// Draw only the bed and mattress in normalized window coordinates.
export function paintX7Bed(c) {
  fill(c,[[.19,.75],[.78,.734],[.88,.873],[.24,.95]],'#7d715d');
  fill(c,[[.20,.688],[.77,.679],[.874,.813],[.24,.881]],'#b8ae98');
  fill(c,[[.22,.68],[.47,.677],[.50,.712],[.23,.721]],'#cdc2a9');
  fill(c,[[.49,.677],[.69,.675],[.72,.707],[.53,.71]],'#c1b69c');
}
function room(c, f, alternate, floor) {
  // The glazing projects a bright ceiling, a shadowed reveal and the far interior plane.
  box(c,0,0,1,1,gradient(c,0.05,0.06,0.91,0.83,[[0,'#898b80'],[.36,'#b4a78e'],[.8,'#897b65'],[1,'#5c5b50']]));
  fill(c,[[0,0],[1,0],[.85,.16],[.2,.19]],'#aca792');
  fill(c,[[0,0],[.2,.19],[.2,.72],[0,1]],'#777669');
  fill(c,[[.85,.16],[1,0],[1,1],[.85,.72]],'#8f8874');
  fill(c,[[0,1],[.2,.72],[.85,.72],[1,1]],gradient(c,0,.74,0,1,[[0,'#7e7361'],[1,'#9f9179']]));
  floorPaint(c,floor);
  // Light tracks in the bevelled ceiling continue into perspective.
  line(c,[[.03,.009],[.247,.147],[.809,.127],[.937,.008]],'rgba(255,231,167,0.66)',.006);
  line(c,[[.17,.002],[.339,.112],[.757,.099],[.849,.002]],'rgba(250,230,191,0.39)',.004);
  line(c,[[.2,.70],[.845,.70]],'rgba(244,218,168,.35)',.004);
  if (f.has('furniture')) {
    if (!alternate) {
      fill(c,[[.24,.713],[.31,.70],[.60,.70],[.67,.735],[.66,.80],[.27,.81]],'#615c50');
      fill(c,[[.255,.63],[.58,.625],[.608,.643],[.60,.724],[.258,.734]],'#989481');
      fill(c,[[.265,.73],[.607,.714],[.658,.741],[.30,.767]],'#b3ab8f');
      fill(c,[[.295,.766],[.658,.741],[.648,.785],[.294,.802]],'#99927b');
      fill(c,[[.25,.678],[.273,.675],[.304,.717],[.297,.78],[.256,.785]],'#a49d85');
      fill(c,[[.602,.668],[.615,.661],[.661,.708],[.657,.761],[.637,.769],[.639,.726]],'#aca58c');
      fill(c,[[.322,.648],[.37,.643],[.387,.706],[.335,.713]],'#d5c9ab');
      box(c,.69,.73,.012,.107,'#49483f'); box(c,.668,.838,.068,.006,'#5e5b4d');
      c.beginPath(); c.ellipse(.697,.727,.055,.014,0,0,Math.PI*2); c.fillStyle='#c4b69b'; c.fill();
    } else {
      paintX7Bed(c);
    }
  }
  if (f.has('bed') && !alternate && !f.has('furniture')) paintX7Bed(c);
  if (f.has('kitchen') && alternate) {
    box(c,.207,.22,.119,.489,'#84755f'); box(c,.337,.49,.342,.2,'#99886d');
    box(c,.33,.481,.357,.015,'#5c5b4c');
    for(let col=1;col<4;col++) box(c,.337+col*.084,.505,.002,.178,'#736c59');
    box(c,.403,.329,.259,.008,'#827662');
  }
  if (f.has('curtains')) {
    for (let i=0;i<12;i++) {
      const x=.866+i*.013;
      fill(c,[[x,.054],[x+.014,.044],[x+.021,.932],[x+.006,.938]],
        gradient(c,x,0,x+.017,0,[[0,'#7c7568'],[.45,'#c1b59e'],[1,'#a39884']]));
    }
  }
  if (f.has('projector') && !alternate) {
    box(c,.45,.286,.199,.155,'#5e6056'); box(c,.455,.291,.189,.144,'#a6a698');
    box(c,.525,.029,.023,.026,'#999a89'); box(c,.512,.053,.054,.021,'#d0cbbb');
  }
}
function foliage(c, random, x, y, spread, height, color) {
  const p=[[x-spread,y+.08]];
  for(let i=0;i<=22;i++) {
    const t=i/22;
    const hump=1-Math.pow(Math.abs(2*t-1),1.5);
    p.push([x-spread+t*spread*2,y-(hump*.76+random()*.24)*height]);
  }
  p.push([x+spread,y+.08]); fill(c,p,color);
}
function tintGlass(c,interior) {
  if(interior.glazing==='privacy') {
    // Diffusing glass retains the broad reflected sky, with the room screened from sight.
    box(c,0,0,1,1,gradient(c,.05,.04,.75,1,[
      [0,'rgba(185,208,210,.98)'],[.32,'rgba(216,224,211,.985)'],
      [.59,'rgba(191,205,200,.985)'],[1,'rgba(136,160,158,.985)']
    ]));
    fill(c,[[.28,0],[.58,0],[.42,1],[.18,1]],'rgba(248,250,230,.038)');
  } else if(interior.glazing==='solar') {
    c.save(); c.globalCompositeOperation='multiply';
    box(c,0,0,1,1,gradient(c,0,0,.4,1,[[0,'#90adb8'],[.5,'#759ca9'],[1,'#547d87']]));
    c.restore();
    box(c,0,0,1,.50,gradient(c,0,0,0,.50,[[0,'rgba(179,214,225,.29)'],[1,'rgba(143,193,205,0)']]));
  }
  if (interior.lights==='warm'||interior.lights==='smart') {
    const warm=interior.lights==='warm', glow=warm?'255,191,106':'156,218,239';
    const privacy=interior.glazing==='privacy';
    c.save(); c.globalCompositeOperation='screen';
    box(c,0,0,1,1,gradient(c,0,0,.12,1,[[0,'rgba('+glow+',.38)'],[.49,'rgba('+glow+',.10)'],[1,'rgba('+glow+',.06)']]));
    if(!privacy) {
      for (const [width,alpha] of [[.042,.095],[.018,.18],[.006,.88]]) {
        line(c,[[0,.024],[.18,.164],[.80,.130],[1,.023]],'rgba('+glow+','+alpha+')',width);
      }
      if (!warm) line(c,[[.18,.71],[.81,.71],[.96,.89]],'rgba(177,213,239,.37)',.004);
    }
    c.restore();
  }
}
function glass(c,x,y,w,h, features, interior, alt, seed, end=false) {
  c.save(); c.translate(x,y); c.scale(w,h);
  room(c,features,alt,interior.floor);
  const furnished=features.has('furniture');
  if (furnished) {
    // The lounge photograph contains a screen, so use it only with the cinema option.
    const roomPhoto=features.has('projector')&&!alt?'furnished-lounge':'furnished-seating';
    photo(c,roomPhoto,(features.has('kitchen') || features.has('curtains')) ? .40 : .78);
  }
  const random=rng(seed);
  box(c,0,0,1,1,gradient(c,.09,.02,.21,1,[
    [0,'rgba(100,143,162,.72)'],[.24,'rgba(131,164,175,.59)'],
    [.47,'rgba(189,187,164,.40)'],[.63,'rgba(166,166,139,.22)'],
    [.78,'rgba(65,82,76,.30)'],[1,'rgba(32,51,50,.56)']
  ]));
  for (let k=0;k<3;k++) {
    const p=[[0,1],[0,.63]];
    for(let i=0;i<=35;i++) {
      const t=i/35;
      p.push([t,.64+.035*Math.cos(t*8.4+seed)+Math.sin(t*14+k*.9)*.025-k*.006-random()*.009]);
    }
    p.push([1,1]);fill(c,p,k===0?'rgba(105,124,116,.13)':'rgba(70,88,83,.09)');
  }
  for(let i=0;i<(end?12:18);i++) {
    const spot=random(),edge=Math.pow(Math.abs(spot*2-1),2);
    const height=.073+random()*.17+edge*.12;
    foliage(c,random,spot,.77+random()*.06,.022+random()*.06,height,'rgba(37,55,52,.14)');
  }
  const reflection=end?'end':alt?'long-b':'long-a';
  const selectedContents=features.size>0;
  photo(c,reflection,selectedContents ? .44 : .89);
  if (interior.floor==='oak'||interior.floor==='stone') floorPaint(c,interior.floor,furnished ? .27 : .51);
  box(c,0,.85,1,.15,gradient(c,0,.85,.06,1,[[0,'rgba(46,58,51,.08)'],[1,'rgba(115,120,99,.21)']]));
  fill(c,[[.01,0],[.21,0],[.095,1],[0,1]],'rgba(211,228,224,.063)');
  fill(c,[[.58,0],[.635,0],[.56,1],[.514,1]],'rgba(220,231,219,.048)');
  box(c,0,0,1,.08,gradient(c,0,0,0,.08,[[0,'rgba(24,35,30,.39)'],[1,'rgba(24,35,30,0)']]));
  tintGlass(c,interior);
  c.restore();
}
function mullion(c,x,t,b,trim,w=4) {
  box(c,x-w*.5,t,w,b-t,gradient(c,x-w*.5,0,x+w*.6,0,[[0,shade(trim,.15)],[.30,shade(trim,-.12)],[.83,shade(trim,-.30)],[1,shade(trim,.24)]]));
}
function facade(c,w,h,shell,trim,features,interior,back) {
  aluminum(c,w,h,shell);
  const top=36,bottom=h-36,cy=h*.51, mid=w*.525;
  const doorW=Math.min(106,w*.11);
  const doorL=mid-doorW*.5,doorR=mid+doorW*.5;
  const bayEnd=doorL-w*.059,bayStart=doorR+w*.04;
  const notch=Math.min(52,w*.065);
  const left=[[-6,top],[bayEnd-notch,top],[bayEnd,top+notch*.86],[bayEnd,bottom-notch*.78],[bayEnd-notch,bottom],[-6,bottom]];
  const right=[[bayStart,top+notch*.69],[bayStart+notch,top],[w+5,top],[w+5,bottom],[bayStart+notch,bottom],[bayStart,bottom-notch*.64]];
  const bays=back ? [
    {shape:[[-5,top],[w*.31,top],[w*.334,top+26],[w*.334,bottom-24],[w*.309,bottom],[-5,bottom]],x:0,width:w*.334},
    {shape:[[w*.57,top+25],[w*.594,top],[w+5,top],[w+5,bottom],[w*.594,bottom],[w*.57,bottom-23]],x:w*.57,width:w*.43}
  ] : [{shape:left,x:0,width:bayEnd},{shape:right,x:bayStart,width:w-bayStart}];
  bays.forEach(({shape,x,width},i)=>{
    c.save();path(c,shape);c.clip();
    glass(c,x,top,width,bottom-top,features,interior,i===1,(back?41:11)+i*25);
    const stiles=i===0?[.22,.61]:[.40,.77];
    for (const pos of stiles) mullion(c,x+pos*width,top,bottom,trim,5.4);
    if (!back && i===0) {
      // Interior returns seen behind the chamfered reveal.
      fill(c,[[bayEnd-notch*.12,top+notch*.70],[bayEnd,top+notch*.82],[bayEnd,bottom-notch*.72],[bayEnd-notch*.12,bottom-notch*.63]],'rgba(16,28,27,.52)');
    }
    path(c,shape); c.lineJoin='round'; c.lineWidth=11;c.strokeStyle=shade(trim,-.35);c.stroke();
    path(c,shape);c.lineWidth=2.4;c.strokeStyle=shade(trim,.14);c.stroke();
    c.restore();
  });

  const hair=shade(shell,-.29),highlight=shade(shell,.23);
  if (!back) {
    // Pressed aluminium channels follow the polygonal jamb and stop before the centre entry.
    for(const [off,lit] of [[10,false],[16,true],[24,false]]) {
      const a=bayEnd-notch;
      for(const sign of [-1,1]) {
        const yy=sign===-1?top:bottom;
        const p=[[a-notch*.40,yy+sign*off],[a+off*.37,yy+sign*off],[bayEnd+off*.83,yy-sign*(notch*.74-off*.23)],[doorL-9,cy+sign*(off*.78+18)]];
        line(c,p,lit?'rgba(238,227,185,.86)':hair,lit?1.6:1);
        if(!lit)line(c,p.map(([xx,yy])=>[xx,yy+1]),highlight,.8);
      }
    }
    // Flush entrance panel with a faceted perimeter and recessed pull.
    const dy0=20,dy1=h-21,vc=14;
    const dp=[[doorL+vc,dy0],[doorR-vc,dy0],[doorR,dy0+vc],[doorR,dy1-vc],[doorR-vc,dy1],[doorL+vc,dy1],[doorL,dy1-vc],[doorL,dy0+vc]];
    path(c,dp);c.fillStyle=gradient(c,doorL,0,doorR,h*.7,[[0,shade(shell,-.13)],[.13,shade(shell,.15)],[.70,shade(shell,-.006)],[1,shade(shell,-.12)]]);c.fill();
    path(c,dp);c.lineWidth=2.2;c.strokeStyle=shade(shell,-.43);c.stroke();
    line(c,[[doorL+vc+2,dy0+2],[doorR-vc,dy0+2],[doorR-2,dy0+vc]],highlight,1.4);
    fill(c,[[doorL+6,cy-18],[doorL+14,cy-12],[doorL+13,cy+5],[doorL+7,cy+12]],shade(trim,-.16));
    box(c,doorL+10,cy-9,1.3,13,shade(trim,.35));
  } else {
    const ax=w*.375, bx=w*.511, ay=h*.25, by=h*.80;
    line(c,[[ax,by],[ax,ay+4],[ax+4,ay],[bx,ay],[bx,by],[ax,by]],hair,1.1);
    for(let i=0;i<5;i++)line(c,[[bx-29,by-11-i*3.6],[bx-9,by-11-i*3.6]],shade(shell,-.36),1.2);
  }
  for(const a of [0.19,0.42,0.68,0.88]) {
    const xx=w*a;
    line(c,[[xx,0],[xx,top-1]],hair,.9); line(c,[[xx,bottom+1],[xx,h]],hair,.9);
  }
  line(c,[[0,3],[w,3]],highlight,1.1);
  line(c,[[0,h-5],[w,h-5]],shade(shell,-.22),1.7);
}
function endcap(c,w,h,shell,trim,features,interior,balcony) {
  aluminum(c,w,h,shell);
  const top=36,bottom=h-36;
  c.save();c.beginPath();c.rect(0,top,w,bottom-top);c.clip();
  glass(c,0,top,w,bottom-top,features,interior,balcony,balcony?42:71,true);
  for (const q of balcony?[.16,.49,.82]:[.26,.72]) mullion(c,w*q,top,bottom,trim,balcony?5.4:4.6);
  if (balcony) {
    box(c,w*.49+4,h*.505,2.7,20,shade(trim,-.1));
    box(c,w*.49+4,h*.505,1,20,shade(trim,.33));
    line(c,[[w*.16,top+3],[w*.82,top+3]],shade(trim,-.26),4);
    line(c,[[w*.16,bottom-3],[w*.82,bottom-3]],shade(trim,-.12),4);
  }
  c.restore();
  for (const yy of [top,bottom]) line(c,[[0,yy],[w,yy]],shade(trim,-.2),5.1);
  line(c,[[0,top-3.5],[w,top-3.5]],shade(shell,.28),1.1);
  line(c,[[0,bottom+3],[w,bottom+3]],shade(shell,-.22),1.1);
  line(c,[[0,h-5],[w,h-5]],shade(shell,-.22),1.7);
}
function roof(c,w,h,shell,trim) {
  aluminum(c,w,h,shell);
  // Shallow metal well within the continuous painted parapet.
  const rim=Math.max(12,Math.min(24,h*.05));
  const paintedChannels = [1,3,5].map(i => {
    const body = parseInt(shell.slice(i,i+2),16);
    const frame = parseInt(trim.slice(i,i+2),16);
    return Math.round(.45*body+.55*frame).toString(16).padStart(2,'0');
  });
  const panel = '#' + paintedChannels.join('');
  box(c,rim,rim,w-rim*2,h-rim*2,gradient(c,0,0,w,h,[[0,shade(panel,.10)],[.48,shade(panel,-.07)],[1,shade(panel,.035)]]));
  line(c,[[rim,h-rim],[rim,rim],[w-rim,rim]],shade(trim,-.09),2.6);
  line(c,[[w-rim,rim],[w-rim,h-rim],[rim,h-rim]],shade(shell,-.26),2.4);
  for(let x=rim+90;x<w-rim-25;x+=90) {
    line(c,[[x,rim+2],[x,h-rim-2]],'rgba(20,31,31,.18)',1);
    line(c,[[x+1.5,rim+2],[x+1.5,h-rim-2]],'rgba(246,244,226,.11)',1);
  }
}
// extras may be a Set, a string array or a map of booleans.
export function x7Finish(side,widthM,heightM,{shell='#e9e9e4',trim='#303836',extras=[],interior={}}={}) {
  const w=Math.max(1,Math.round(widthM*SCALE)),h=Math.max(1,Math.round(heightM*SCALE));
  const canvas=typeof document!=='undefined'?document.createElement('canvas'):new OffscreenCanvas(w,h);
  canvas.width=w;canvas.height=h;
  const c=canvas.getContext('2d');
  const provided=extras instanceof Set || Array.isArray(extras)?new Set(extras):new Set(Object.keys(extras||{}).filter(k=>extras[k]));
  const features=new Set();
  for(const [name,aliases] of Object.entries({
    bed:['bed'],
    furniture:['furniture','furnishings','mobilier','sofa','living'],
    kitchen:['kitchen','bucatarie','bucătărie','kitchenette'],
    curtains:['curtains','curtain','perdele','draperii','blinds'],
    projector:['projector','proiector','cinema']
  })) if(aliases.some(alias=>provided.has(alias))) features.add(name);
  if(side==='top') roof(c,w,h,shell,trim);
  else if(side==='front'||side==='back') facade(c,w,h,shell,trim,features,interior,side==='back');
  else endcap(c,w,h,shell,trim,features,interior,side==='right');
  return canvas;
}
