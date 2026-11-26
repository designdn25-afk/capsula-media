// Schematic layers employ expanded spacing for legibility. Positions describe the
// diagram, not installation dimensions. Coordinates share the exterior X7's axes.
export const X7_CUTAWAY_FOCUS = new Set(['underfloorHeating', 'tripleGlazing', 'underbodyInsulation']);

function sheet(vertices, normal, color, texture, mapping) {
  return { vertices, normal, color, texture, mapping };
}

function twoSided(vertices, normal, color, texture, mapping) {
  return [
    sheet(vertices, normal, color, texture, mapping),
    sheet(vertices, normal.map(n => -n), color, texture, mapping)
  ];
}

function bitmap(width, height, draw) {
  const layer = document.createElement('canvas');
  layer.width = width;
  layer.height = height;
  draw(layer.getContext('2d'), width, height);
  return layer;
}

const materials = new Map();
function finish(name, draw, width, height) {
  if (!materials.has(name)) materials.set(name, bitmap(width, height, draw));
  return materials.get(name);
}

function deckMap(heated, bright) {
  return finish('floor-' + heated + '-' + bright, (ctx, w, h) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, heated && bright ? '#f0dac0' : '#e7e5dc');
    gradient.addColorStop(1, heated && bright ? '#fff0d4' : '#f8f5e9');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    // Represent a few broad floor panels, leaving the wiring easy to read.
    ctx.strokeStyle = '#c5c8bd';
    ctx.lineWidth = 1.4;
    for (let i = 1; i < 7; i++) {
      ctx.beginPath();
      ctx.moveTo(w * i / 7, 0);
      ctx.lineTo(w * i / 7, h);
      ctx.stroke();
    }
    if (!heated) return;
    const cable = new Path2D();
    const left = w * .065, right = w * .887, gap = h * .128;
    const y0 = h * .175;
    cable.moveTo(left - w * .024, y0);
    for (let row = 0; row < 6; row++) {
      const y = y0 + row * gap;
      const goingRight = row % 2 === 0;
      const end = goingRight ? right : left;
      cable.lineTo(end, y);
      if (row < 5) cable.arc(end, y + gap / 2, gap / 2, -Math.PI / 2, Math.PI / 2, !goingRight);
    }
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = bright ? '#b04f22' : '#ae9b88';
    ctx.lineWidth = bright ? 13 : 7;
    ctx.stroke(cable);
    ctx.strokeStyle = bright ? '#ed853b' : '#cfb59b';
    ctx.lineWidth = bright ? 8 : 4;
    ctx.stroke(cable);
    if (bright) {
      ctx.strokeStyle = '#ffd094';
      ctx.lineWidth = 2;
      ctx.stroke(cable);
    }
  }, 990, 310);
}

function insulationMap(bright) {
  return finish('board-' + bright, (ctx, w, h) => {
    ctx.fillStyle = bright ? '#c8bd77' : '#c7c6ac';
    ctx.fillRect(0, 0, w, h);
    // Sparse cross-hatching denotes insulating material without implying a composition.
    ctx.strokeStyle = bright ? '#a89d60' : '#b6b4a0';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = -h; i < w; i += 11) {
      ctx.moveTo(i, h);
      ctx.lineTo(i + h, 0);
    }
    ctx.stroke();
    ctx.strokeStyle = bright ? '#978e56' : '#aeac94';
    ctx.lineWidth = 2;
    for (let i = 1; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(w * i / 6, 0);
      ctx.lineTo(w * i / 6, h);
      ctx.stroke();
    }
  }, 825, 245);
}

function panelMap(bright) {
  return finish('glass-' + bright, (ctx, w, h) => {
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, bright ? '#69bdd633' : '#a1baba16');
    gradient.addColorStop(.58, bright ? '#c4eef52b' : '#d1e1da18');
    gradient.addColorStop(1, bright ? '#4791ad48' : '#92adaa25');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = bright ? '#ffffff49' : '#ffffff27';
    ctx.beginPath();
    ctx.moveTo(w * .57, 0);
    ctx.lineTo(w * .74, 0);
    ctx.lineTo(w * .45, h);
    ctx.lineTo(w * .28, h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = bright ? '#409dbc' : '#92a6a1';
    ctx.lineWidth = bright ? 5 : 3;
    ctx.strokeRect(1, 1, w - 2, h - 2);
    ctx.strokeStyle = bright ? '#b7edf4' : '#d5e2df';
    ctx.lineWidth = 2;
    ctx.strokeRect(4.5, 4.5, w - 9, h - 9);
  }, 310, 255);
}

function planarRect(x0, x1, y, z0, z1, color, texture) {
  const a = [x0, y, z0], b = [x1, y, z0], c = [x1, y, z1], d = [x0, y, z1];
  return sheet([a,b,c,d], [0,1,0], color, texture, [a,b,d]);
}

function pane(x0, x1, y0, y1, z, bright) {
  const a = [x0, y1, z], b = [x1, y1, z], c = [x1, y0, z], d = [x0, y0, z];
  return twoSided([a,b,c,d], [0,0,1], 'transparent', panelMap(bright), [a,b,d]);
}

function shellRing(edges, y0, y1, thickness, baseColor) {
  const result = [];
  for (const edge of edges) {
    const {a, b} = edge;
    const A = [a.x, y1, a.z], B = [b.x, y1, b.z];
    const C = [b.x, y0, b.z], D = [a.x, y0, a.z];
    const innerA = [a.x - a.nx * thickness, y1, a.z - a.nz * thickness];
    const innerB = [b.x - b.nx * thickness, y1, b.z - b.nz * thickness];
    // Flat edges and curved corner segments exactly follow the X7 perimeter.
    const nx = (a.nx + b.nx) / 2, nz = (a.nz + b.nz) / 2;
    result.push(...twoSided([A,B,C,D], [nx,0,nz], baseColor));
    result.push(sheet([innerA,innerB,B,A], [0,1,0], '#e0e4db'));
  }
  return result;
}

function glassBays(batch, box, halfWidth, halfDepth, y0, y1, illustratedBay) {
  const trim = '#84908e';
  for (const side of [-1, 1]) {
    const z = side * (halfDepth - .035);
    for (const [x0, x1] of [[-halfWidth + .55, -1.65], [-1.59, -.75], [.57, 2.56], [2.62, halfWidth - .78]]) {
      const a = [x0, y1, z], b = [x1, y1, z], c = [x1, y0, z], d = [x0, y0, z];
      const skipGlass = illustratedBay && side === 1 && x0 < -4;
      if (!skipGlass) batch.push(...twoSided([a,b,c,d], [0,0,1], 'rgba(152,179,179,.085)'));
      batch.push(...box(x1 - .022, x1 + .022, y0, y1, z - .018, z + .018, trim));
    }
    // Faceted white shoulders around the characteristic central door opening.
    const silhouette = (coords, color) => {
      const face = coords.map(([x,y]) => [x,y,z]);
      batch.push(...twoSided(face, [0,0,1], color));
    };
    silhouette([[-1.56,y1],[-.36,y1],[-.36,y0],[-1.52,y0],[-1.03,y0+.49],[-1.03,y1-.51]], 'rgba(178,190,187,.65)');
    silhouette([[.33,y1],[1.10,y1],[.71,y1-.42],[.71,y0+.30],[.99,y0],[.33,y0]], 'rgba(188,199,194,.65)');
    batch.push(...box(-.40,-.35,y0,y1,z-.035,z+.035,trim));
    batch.push(...box(.32,.37,y0,y1,z-.035,z+.035,trim));
    batch.push(...box(-.40,.37,y1-.05,y1,z-.035,z+.035,trim));
    batch.push(...box(-.28,-.23,y0+.90,y0+1.13,z-.04,z+.04, '#4d6465'));
  }
}

export function makeX7Cutaway(focus, selected, shape, box) {
  const {w, d, h, edges} = shape, hx = w / 2, hz = d / 2;
  const heat = 'underfloorHeating', glass = 'tripleGlazing', board = 'underbodyInsulation';
  const has = key => focus === key || selected.has(key);
  const accent = key => focus === key;
  const explodedBoard = has(board);
  const floorY = explodedBoard ? 1.42 : .53;
  const roofY = h + floorY - .53;
  const supports = [], lower = [], deck = [], floorFinish = [], shell = [];
  const boardHeight = .32;
  const gapY = explodedBoard ? floorY - .16 : .29;
  for (const x of [-hx + .87, 0, hx - .87]) {
    for (const z of [-hz + .37, hz - .37]) {
      supports.push(...box(x-.22,x+.22,.027,.072,z-.12,z+.12,'#8c9793'));
      supports.push(...box(x-.115,x+.115,.072,.24,z-.087,z+.087,'#71817f'));
      if (explodedBoard) {
        for (let y = boardHeight + .11; y < gapY; y += .17) {
          supports.push(...box(x-.012,x+.012,y,Math.min(y+.075,gapY),z-.012,z+.012,'#aeb8ac'));
        }
      }
    }
  }
  const x0 = -hx + .21, x1 = hx - .23, z0 = -hz + .16, z1 = hz - .16;
  if (explodedBoard) {
    const edge = accent(board) ? '#a59c58' : '#adad96';
    lower.push(...box(x0, x1, .205, boardHeight, z0, z1, edge));
    lower.push(planarRect(x0, x1, boardHeight + .002, z0, z1, edge, insulationMap(accent(board))));
  }
  // Keep the floor and balcony as separate volumes. The heating stops inside.
  deck.push(...box(x0,x1,floorY-.115,floorY,z0,z1,'#a0aca7'));
  floorFinish.push(planarRect(x0,x1-.70,floorY+.003,z0,z1,'#e8e7dd',deckMap(has(heat),accent(heat))));
  floorFinish.push(planarRect(x1-.70,x1,floorY+.003,z0,z1,'#c5bdab'));
  for (let x = x1 - .61; x < x1; x += .115) {
    floorFinish.push(planarRect(x,x+.01,floorY+.006,z0,z1,'#a9a18f'));
  }

  shell.push(...shellRing(edges, floorY-.215, floorY-.065, .14, '#859490'));
  shell.push(...shellRing(edges, roofY-.17, roofY, .18, 'rgba(128,145,142,.83)'));
  shell.push(sheet(edges.map(({a}) => [a.x,roofY+.001,a.z]), [0,1,0], 'rgba(230,235,227,.12)'));
  // The short, recessed balcony is characteristic of the X7 end profile.
  for (const edge of edges) {
    if (edge.side !== 'right' && edge.to !== 'right' && edge.from !== 'right') continue;
    const {a,b} = edge;
    const normal = [(a.nx+b.nx)/2,0,(a.nz+b.nz)/2];
    const rail = [ [a.x,floorY+.77,a.z], [b.x,floorY+.77,b.z],
      [b.x,floorY+.82,b.z], [a.x,floorY+.82,a.z] ];
    shell.push(...twoSided(rail, normal, 'rgba(127,146,142,.86)'));
  }
  const glassBottom = floorY+.11, glassTop = roofY-.15;
  glassBays(shell, box, hx, hz, glassBottom, glassTop, has(glass));

  for (const edge of edges) {
    if (!edge.from) continue;
    const {a,b} = edge;
    const face = [[a.x,glassBottom,a.z],[b.x,glassBottom,b.z],[b.x,glassTop,b.z],[a.x,glassTop,a.z]];
    const normal = [(a.nx+b.nx)/2,0,(a.nz+b.nz)/2];
    shell.push(...twoSided(face, normal, 'rgba(142,166,162,.13)'));
  }
  for (const x of [-hx+.08, hx-.76]) {
    for (const z of [-hz+.29, hz-.29]) {
      shell.push(...box(x-.036,x+.036,glassBottom,glassTop,z-.029,z+.029,'#919f9d'));
    }
  }
  for (const x of [-hx+.08, hx-.76]) {
    const a = [x,glassTop,-hz+.23], b = [x,glassTop,hz-.23];
    const c = [x,glassBottom,hz-.23], e = [x,glassBottom,-hz+.23];
    shell.push(...twoSided([a,b,c,e],[1,0,0],'rgba(147,177,175,.08)'));
  }

  if (has(glass)) {
    // Pull three full sheets out from one opening so their edges stay countable.
    // These offsets are purely diagrammatic and are unrelated to glazing thickness.
    const active = accent(glass);
    const gap = active ? .31 : .105;
    for (let i = 0; i < 3; i++) {
      const shift = active ? (i + 1) * .20 : 0;
      shell.push(...pane(-hx+.59+shift, -1.69+shift, glassBottom+.08, glassTop-.035, hz + (i + 1) * gap, active));
    }
  }
  return {
    w, d, base:0, deckLeft:-hx, deckRight:hx, deckBack:-hz, deckFront:hz,
    stepFront:hz + (has(glass) ? (accent(glass) ? .95 : .34) : 0),
    top:roofY, crownHeight:roofY, surfaces:[supports,lower,deck,floorFinish,shell],
    capsule:true, cutaway:true
  };
}
