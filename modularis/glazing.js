// Glazing is painted into the wall texture at an architectural scale of 100 px/m.
function ramp(c, x1, y1, x2, y2, stops) {
  const paint = c.createLinearGradient(x1, y1, x2, y2);
  for (const [position, color] of stops) paint.addColorStop(position, color);
  return paint;
}

function rect(c, x, y, w, h, fill) {
  c.fillStyle = fill;
  c.fillRect(x, y, w, h);
}

function face(c, points, fill) {
  c.beginPath();
  points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.closePath();
  c.fillStyle = fill;
  c.fill();
}

function seedRand(seed) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

// Normalized room coordinates keep the furnishing layout independent of opening size.
function lounge(c, alternate, window) {
  const ceil = window ? -0.13 : 0.14;
  const floor = window ? 1.12 : 0.76;
  rect(c, 0, 0, 1, 1, ramp(c, 0.05, 0.1, 0.98, 0.78, [
    [0, '#d7c9ae'], [0.31, '#e0d5c1'], [0.75, '#b4a58b'], [1, '#8e816a']
  ]));
  face(c, [[0, 0], [1, 0], [0.84, ceil], [0.12, ceil]], '#ac9d89');
  face(c, [[0, 0], [0.13, ceil], [0.13, floor], [0, 1]], '#b7a991');
  face(c, [[0.84, ceil], [1, 0], [1, 1], [0.84, floor]], '#9c907b');
  face(c, [[0, 1], [0.13, floor], [0.84, floor], [1, 1]], ramp(c, 0, floor, 0, 1, [[0, '#9a886c'], [1, '#cfb991']]));
  if (floor < 1) {
    for (let i = -6; i < 10; i++) {
      const ax = 0.48 + i * 0.092;
      face(c, [[ax, floor], [ax + 0.002, floor], [0.48 + i * 0.16 + 0.003, 1], [0.48 + i * 0.16, 1]], 'rgba(94,74,48,0.22)');
    }
    face(c, [[0.04, 0.93], [0.48, floor + 0.015], [0.87, floor + 0.015], [0.51, 1], [0, 1]], 'rgba(248,235,202,0.13)');
  }

  if (!alternate) {
    // Framed print and long, low oatmeal lounge chair.
    rect(c, 0.27, 0.26, 0.14, 0.23, '#7c705d');
    rect(c, 0.277, 0.269, 0.126, 0.21, '#dfd1b7');
    face(c, [[0.285,0.42],[0.331,0.357],[0.373,0.393],[0.399,0.351],[0.399,0.463],[0.285,0.463]], '#a39c86');
    c.save();
    if (window) { c.translate(0, 0.22); c.scale(1, 1.02); }
    rect(c, 0.19, 0.789, 0.018, 0.059, '#504e42');
    rect(c, 0.55, 0.781, 0.016, 0.051, '#514b40');
    face(c, [[0.16,0.57],[0.49,0.57],[0.54,0.61],[0.53,0.72],[0.16,0.72]], '#b7ae99');
    face(c, [[0.153,0.63],[0.19,0.62],[0.212,0.67],[0.211,0.763],[0.152,0.752]], '#a29780');
    face(c, [[0.205,0.673],[0.518,0.666],[0.579,0.724],[0.213,0.733]], '#e0d3b8');
    face(c, [[0.209,0.735],[0.578,0.726],[0.574,0.79],[0.208,0.803]], '#b6a88b');
    face(c, [[0.523,0.631],[0.548,0.625],[0.594,0.672],[0.59,0.768],[0.555,0.783],[0.556,0.705],[0.517,0.673]], '#c5b89a');
    face(c, [[0.242,0.591],[0.30,0.579],[0.316,0.654],[0.253,0.663]], '#898571');
    c.restore();
  } else {
    // Recessed kitchen joinery gives alternate glazing bays a distinct interior.
    rect(c, 0.14, ceil, 0.2, floor - ceil, '#95836a');
    for (let i = 0; i < 5; i++) {
      rect(c, 0.14 + i * 0.041, ceil, 0.0025, floor - ceil, 'rgba(68,56,40,0.33)');
    }
    rect(c, 0.36, 0.54, 0.45, 0.025, '#6f685a');
    rect(c, 0.37, 0.565, 0.43, Math.max(0.17, floor - 0.565), '#a69475');
    for (let i = 1; i < 4; i++) rect(c, 0.368 + i * 0.107, 0.566, 0.003, Math.max(0.17,floor - 0.566), '#82745e');
    rect(c, 0.46, 0.333, 0.29, 0.012, '#8e8069');
    rect(c, 0.49, 0.281, 0.015, 0.05, '#c9b89a');
    rect(c, 0.514, 0.274, 0.011, 0.057, '#827764');
    rect(c, 0.647, 0.313, 0.075, 0.016, '#a89980');
    rect(c, 0.659, 0.301, 0.052, 0.012, '#bfb197');
  }

  if (!window) {
    // Soft linen on one side. Each fold carries a gradual change in luminance.
    const start = alternate ? 0.905 : 0.012;
    const width = alternate ? 0.075 : 0.092;
    for (let f = 0; f < 7; f++) {
      const a = start + f*width/7;
      face(c, [[a,0.04],[a+width/7+0.002,0.04],[a+width/7+0.013,0.915],[a+0.008,0.923]],
        ramp(c, a, 0, a+width/7+0.001, 0, [[0,'rgba(106,100,87,.68)'],[0.56,'rgba(221,214,193,.9)'],[1,'rgba(180,171,150,.82)']]));
    }
  }
}

function canopy(c, seed, side) {
  const rnd = seedRand(seed);
  c.save();
  c.translate(side ? 1 : 0, 0);
  c.scale(side ? -1 : 1, 1);
  for (let i=0; i<96; i++) {
    const py = rnd() * 0.55;
    const reach = 0.16 + Math.sin(py * 12 + 0.6) * 0.055;
    const px = rnd() * Math.max(0.02, reach - py * 0.18);
    const r = 0.012 + rnd() * 0.046;
    c.beginPath();
    c.ellipse(px - 0.015, py - 0.08, r, r * (0.55 + rnd()), -0.5, 0, Math.PI * 2);
    c.fillStyle = i % 3 === 0 ? 'rgba(71,85,69,.047)' : 'rgba(106,119,97,.06)';
    c.fill();
  }
  c.restore();
}

export function drawOpening(c, x, y, w, h, {type = 'window', index = 0, wall = 'front'} = {}) {
  if (type === 'none' || !(w > 2 && h > 2)) return;
  c.save();
  c.translate(x, y);
  const f = Math.max(2, Math.min(5, w * 0.065, h * 0.045));
  rect(c, -2, -1.6, w + 5, h + 4.3, 'rgba(52,42,32,0.42)');
  rect(c, 0, 0, w, h, '#383a35');
  rect(c, 0, 0, 1.1, h, '#62645a');
  rect(c, 1, 0, w-1, 0.9, '#717065');
  const iw = w - 2 * f;
  const ih = h - 2 * f;
  if (iw < 1 || ih < 1) { c.restore(); return; }

  if (type === 'door') {
    rect(c, f, f, iw, ih, ramp(c, f, 0, w-f, h, [[0,'#6b7169'],[0.5,'#525b56'],[1,'#414a45']]));
    const g = Math.max(1, Math.min(3.0, iw * 0.03));
    const glass = iw * 0.24;
    rect(c, f+g*3, f+g*4, glass, ih-g*8, '#383e38');
    rect(c, f+g*4, f+g*5, Math.max(0.4,glass-g*2), ih-g*10, ramp(c, 0,0,0,h, [[0,'#929e99'],[0.42,'#acafa0'],[0.66,'#989983'],[1,'#6e7163']]));
    rect(c, w-f-g*3.6, h*0.43, g*1.4, h*0.145, '#303733');
    rect(c, w-f-g*3.5, h*0.43, Math.max(0.5,g*0.38), h*0.145, '#a1a59a');
  } else {
    c.save();
    c.translate(f, f);
    c.scale(iw, ih);
    c.beginPath();
    c.rect(0,0,1,1);
    c.clip();
    const first = (index + (wall === 'front' || wall === 'left' ? 0 : 1)) % 2 === 0;
    lounge(c, !first, type === 'window');
    // Reflection and interior shading share one continuous surface across all panes.
    rect(c,0,0,1,1,ramp(c,0,0.03,0.32,0.98,[[0,'rgba(157,176,177,.58)'],[0.29,'rgba(194,201,191,.25)'],[0.61,'rgba(198,201,183,.11)'],[1,'rgba(132,148,140,.2)']]));
    face(c,[[0.28,0],[0.50,0],[0.08,1],[0,1],[0,0.81]],'rgba(236,241,226,.065)');
    face(c,[[0.72,0],[0.77,0],[0.43,1],[0.39,1]],'rgba(246,243,222,.044)');
    canopy(c,29+index*37+wall.length,first);
    rect(c,0,0,1,0.11,ramp(c,0,0,0,0.11,[[0,'rgba(29,39,33,.28)'],[1,'rgba(29,39,33,0)']]));
    c.restore();

    const cols = type === 'slider' ? (iw/ih > 1.66 ? 3 : 2) : (iw/ih > 1.8 ? 2 : 1);
    const m = Math.max(1.8, Math.min(3.6,f *.77));
    for (let i = 1; i < cols; i++) {
      const mx = f + iw*i/cols;
      rect(c,mx - m*0.57,f,m*1.42,ih,'rgba(28,36,33,.75)');
      rect(c,mx-m/2,f,m,ih,'#454b43');
      rect(c,mx-m/2,f,Math.max(0.5,m*0.22),ih,'#797c6c');
      if (type === 'slider' && i === 1) {
        rect(c,mx + m*0.7,h*0.49,Math.min(1.9,m*.64),Math.min(15,h*0.072),'#40463e');
      }
    }
    rect(c,f,f,iw,0.9,'rgba(15,24,19,.5)');
    rect(c,f,f,0.9,ih,'rgba(15,24,19,.4)');
    rect(c,f,h-f-1,iw,1.0,'#81877a');
  }
  rect(c,-1,h-0.1,w+2,1.5,'#747468');
  c.restore();
}
