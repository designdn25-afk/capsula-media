import { paintX7Bed } from './x7-finish.js';

// The frontal optical and material maps come from a rectified product photograph.
// Separate coverage and lighting channels preserve actual stamped panel seams when repainting.
const WIDTH=1110, HEIGHT=310;
const refs = new Map();
let pending;
const windows=[
  [[-2,46],[228,46],[342,110],[342,202],[235,259],[-2,259]],
  [[754,68],[844,31],[1001,31],[1060,52],[1112,53],[1112,260],[1060,260],[1005,280],[852,279],[756,240]]
];
function makeCanvas(width,height){
  const out=document.createElement('canvas');out.width=width;out.height=height;return out;
}
const marks=[
  {x:22,top:46,bottom:260,w:10}, {x:187.5,top:46,bottom:260,w:4.2},
  {x:896,top:31,bottom:279,w:5.7}, {x:1055,top:51,bottom:261,w:10}
];
function readMap(img){
  const c=makeCanvas(WIDTH,HEIGHT).getContext('2d',{willReadFrequently:true});
  c.drawImage(img,0,0,WIDTH,HEIGHT);
  return c.getImageData(0,0,WIDTH,HEIGHT).data;
}
export function preloadX7Optics(){
  if(pending)return pending;
  if(typeof Image==='undefined')return Promise.resolve();
  const entries=[
    ['map','x7-front-alloy'],['optical','x7-front-optics'],
    ['seating','x7-glass-furnished-seating'],['cinema','x7-glass-furnished-lounge']
  ];
  pending=Promise.all(entries.map(([id,name])=>new Promise(resolve=>{
    const img=new Image();
    img.onload=()=>{
      try {refs.set(id,id==='map'||id==='optical'?readMap(img):img);}catch { /* use procedural finish when an optical map is unavailable */ }
      resolve();
    };
    img.onerror=()=>resolve();
    img.src=new URL('./assets/'+name+'.webp',import.meta.url).href;
  }))).then(()=>undefined);
  return pending;
}
function path(c,points){
  c.beginPath();c.moveTo(...points[0]);
  for(const p of points.slice(1))c.lineTo(...p);
  c.closePath();
}
function channels(hex){
  const v=parseInt(hex.slice(1),16);return [v>>16,(v>>8)&255,v&255];
}
function scanMaterial(c,shell,lights){
  const map=refs.get('map'), photo=refs.get('optical');
  const image=c.createImageData(WIDTH,HEIGHT),target=image.data,base=channels(shell);
  const lamp=lights==='smart'?[123,223,234]:lights==='warm'?[255,203,119]:[245,235,201];
  const paint=Array.from({length:256},(_,r)=>{
    const tone=r/255,shine=Math.pow(tone,9)*12;
    return base.map((v,i)=>Math.max(0,Math.min(255,v*(.035+tone*.995)+shine+(i===2?3:1))));
  });
  for(let i=0;i<map.length;i+=4){
    const substrate=paint[map[i]],optics=map[i+1]/255,luminous=map[i+2]/255*(lights==='standard'?.67:.94);
    for(let j=0;j<3;j++){
      const coated=substrate[j]*(1-luminous)+lamp[j]*luminous;
      target[i+j]=coated*(1-optics)+photo[i+j]*optics;
    }
    target[i+3]=255;
  }
  c.putImageData(image,0,0);
}
function gradient(c,x0,y0,x1,y1,stops){
  const g=c.createLinearGradient(x0,y0,x1,y1);
  for(const [t,col] of stops)g.addColorStop(t,col);
  return g;
}
function line(c,coords,color,width){
  c.beginPath();c.moveTo(...coords[0]);for(const p of coords.slice(1))c.lineTo(...p);
  c.lineWidth=width;c.strokeStyle=color;c.stroke();
}
function curtain(c,x,y,w,h){
  const n=13,fold=w/n;
  for(let i=0;i<n;i++){
    const left=x+i*fold;
    path(c,[[left,y],[left+fold+.5,y-.3],[left+fold*1.1,y+h-2*Math.sin(i*.83)],[left-fold*.2,y+h+1.5*Math.cos(i*.6)]]);
    c.fillStyle=gradient(c,left,y,left+fold,y+h*.005,[[0,'#817f73'],[.22,'#b5b1a3'],[.53,'#d4cfc0'],[.72,'#bcb7aa'],[1,'#858276']]);c.fill();
  }
}
function floor(c,x,y,w,h,type){
  if(type!=='stone'&&type!=='oak')return;
  const oak=type==='oak';
  const horizon=y+h*.72;
  c.save();
  path(c,[[x,y+h],[x+w*.16,horizon],[x+w*.85,horizon],[x+w,y+h]]);c.clip();
  c.globalAlpha=.77;
  c.fillStyle=gradient(c,x,horizon,x+w*.08,y+h,oak?[[0,'#776654'],[.42,'#a58866'],[1,'#c4a47e']]:[[0,'#626b69'],[.44,'#8c9491'],[1,'#a3a8a3']]);
  c.fillRect(x,horizon,w,h);
  for(let i=-4;i<=9;i++)line(c,[[x+w*.5+(i-3)*w*.052,horizon],[x+w*.5+(i-3)*w*.22,y+h]],oak?'rgba(75,56,39,.34)':'rgba(215,220,214,.55)',oak?.8:1.1);
  for(const v of [.11,.37,.77])line(c,[[x,horizon+(y+h-horizon)*v],[x+w,horizon+(y+h-horizon)*v]],oak?'rgba(82,67,48,.17)':'rgba(213,216,209,.56)',.85);
  c.restore();
}
function kitchen(c,x,y,w,h){
  const dx=x+w*.47,dy=y+h*.59;
  c.save();c.globalAlpha=.88;
  c.fillStyle=gradient(c,dx,dy,dx+w*.28,dy+h*.22,[[0,'#a89479'],[.52,'#c6b291'],[1,'#8b806d']]);
  c.fillRect(dx,dy,w*.33,h*.21);
  for(let i=1;i<4;i++)line(c,[[dx+i*w*.083,dy+3],[dx+i*w*.083,dy+h*.21]],'rgba(72,68,58,.55)',.85);
  c.fillStyle='#d8d0bd';c.fillRect(dx-2,dy-2,w*.34,3);
  line(c,[[dx+w*.24,dy-2],[dx+w*.24,dy-h*.067],[dx+w*.211,dy-h*.067],[dx+w*.211,dy-h*.045]],'#b8c3bb',2);
  c.restore();
}
function opticsForBay(c,index,extras,interior) {
  const poly=windows[index], x=index?752:0,y=index?30:44,w=index?360:343,h=index?251:217;
  c.save();path(c,poly);c.clip();
  if(extras.has('furniture') && refs.has('seating')){
    c.save();c.globalAlpha=.64;
    c.drawImage(refs.get(index&&extras.has('projector')?'cinema':'seating')||refs.get('seating'),x,y,w,h);c.restore();
  }
  floor(c,x,y,w,h,interior.floor);
  if (!index && extras.has('bed') && !extras.has('furniture')) {
    c.save();
    c.translate(x,y);
    c.scale(w,h);
    c.globalAlpha=.82;
    paintX7Bed(c);
    c.restore();
  }
  if(index && extras.has('kitchen'))kitchen(c,x,y,w,h);
  if(!index && extras.has('projector')){
    c.fillStyle='#454a45';c.fillRect(x+w*.45,y+h*.28,w*.215,h*.22);
    c.fillStyle=gradient(c,x,y,x+w,y+h,[[0,'#a1aca8'],[1,'#c1c6ba']]);c.fillRect(x+w*.455,y+h*.286,w*.205,h*.209);
  }
  if(extras.has('curtains'))curtain(c,index?x+w*.77:x+w*.07,y+8,w*.205,h*.9);
  if(interior.lights==='warm'||interior.lights==='smart'){
    const warm=interior.lights==='warm', bright=warm?'rgba(255,189,83,.42)':'rgba(85,218,228,.37)';
    c.fillStyle=gradient(c,x,y,x+w*.04,y+h*.75,[[0,bright],[.28,warm?'rgba(248,178,94,.13)':'rgba(108,222,232,.16)'],[1,'rgba(218,220,208,0)']]);c.fillRect(x,y,w,h);
    line(c,[[x+w*.06,y+h*.08],[x+w*.43,y+h*.11],[x+w*.74,y+h*.09]],warm?'rgba(255,224,162,.79)':'rgba(153,240,239,.82)',1.65);
  }
  if(interior.glazing==='solar'){
    c.fillStyle=gradient(c,x,y,x+w*.62,y+h,[[0,'rgba(36,71,91,.60)'],[.43,'rgba(57,95,108,.44)'],[1,'rgba(25,54,71,.72)']]);c.fillRect(x,y,w,h);
  }
  if(interior.glazing==='privacy'){
    c.fillStyle=gradient(c,x,y,x+w*.31,y+h,[[0,'rgba(209,222,224,.94)'],[.38,'rgba(196,210,209,.87)'],[.67,'rgba(178,194,191,.89)'],[1,'rgba(160,174,171,.97)']]);c.fillRect(x,y,w,h);
    line(c,[[x+w*.1,y],[x-w*.08,y+h]],'rgba(231,240,236,.28)',w*.14);
  }
  c.restore();
}
function drawFrames(c,trim){
  const rgb=channels(trim);
  const dark='rgb('+rgb.map(ch=>Math.round(ch*.66)).join(',')+')',edge='rgb('+rgb.map(ch=>Math.min(255,Math.round(ch*.86+18))).join(',')+')';
  for(const pillar of marks){
    c.fillStyle=gradient(c,pillar.x-pillar.w*.5,0,pillar.x+pillar.w*.5,0,[[0,dark],[.30,edge],[.47,trim],[.84,trim],[1,dark]]);
    c.fillRect(pillar.x-pillar.w/2,pillar.top,pillar.w,pillar.bottom-pillar.top);
  }
  line(c,windows[0],dark,2.1);
  line(c,windows[1].slice(1,5),dark,2);
  line(c,windows[1].slice(6),dark,2);
}
export function photographicFront(fallback,{shell,trim,extras,interior={}}){
  if(!refs.has('map') || !refs.has('optical'))return fallback;
  const out=makeCanvas(WIDTH,HEIGHT),c=out.getContext('2d');
  scanMaterial(c,shell,interior.lights||'standard');
  opticsForBay(c,0,extras,interior);opticsForBay(c,1,extras,interior);
  drawFrames(c,trim);
  return out;
}
