// Casa modulară desenată „pe bune”: scenă 3D adevărată (three.js, ținut local în ./vendor), cu materiale, lumină, umbre, sticlă,
// iarbă și cer. Înlocuiește desenul plat din viewer.js pentru Modul 32 / Modul 48; Capsula X7 rămâne pe viewer.js (acolo se
// folosesc fotografii). Aceeași interfață ca viewer.js: createViewer(canvas, {onViewChange, onWallSelect}) →
// {update, setView, zoom, reset, setDimensions, destroy}. Toate opțiunile din panou (fațadă pe fiecare parte, material, montaj,
// culoare, acoperiș, streașină, uși și ferestre, pardoseală, lumini, sticlă) vin prin config și se văd pe loc.
import * as THREE from './vendor/three.module.min.js';
import { createViewer as createFlat } from './viewer.js';
import { MODELS, defaultConfig } from './config.js';
import { materials as x7Kit } from './x7/kit.js';
import { buildX7, x7Materials } from './x7/x7.js';

const SIDES = ['front', 'right', 'back', 'left'];
const CAM = { '3d': [.6, .115], front: [0, .045], back: [Math.PI, .045], side: [Math.PI / 2, .045], right: [Math.PI / 2, .045], left: [-Math.PI / 2, .045], top: [0, Math.PI / 2 - .001] };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rng = seed => { let n = seed >>> 0; return () => ((n = (Math.imul(n, 1664525) + 1013904223) >>> 0) / 4294967296); };

/* ---------- texturi făcute pe loc (fără fișiere) ---------- */
function canvasTex(w, h, paint, { srgb = true, repeat = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; paint(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}
const TEX = {};
function cladTex(material) {   // [culoare (aproape albă, se înmulțește cu culoarea aleasă), relief]; un pătrat = 2,4 m; fâșiile merg pe verticală
  if (TEX[material]) return TEX[material];
  const S = 1024, r = rng(material.length * 977 + 5);
  const col = canvasTex(S, S, (g) => {
    g.fillStyle = '#fff'; g.fillRect(0, 0, S, S);
    if (material === 'wood') {
      const n = 20, bw = S / n;
      for (let i = 0; i < n; i++) { const v = 205 + Math.floor(r() * 50); g.fillStyle = `rgb(${v},${v - 3},${v - 8})`; g.fillRect(i * bw, 0, bw, S);
        for (let k = 0; k < 26; k++) { const x = i * bw + 2 + r() * (bw - 4), y = r() * S, len = 60 + r() * 420; g.strokeStyle = `rgba(70,45,20,${.05 + r() * .13})`; g.lineWidth = .6 + r() * 1.4; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + (r() - .5) * 5, y + len * .3, x + (r() - .5) * 5, y + len * .7, x + (r() - .5) * 3, y + len); g.stroke(); }
        if (r() < .35) { const x = i * bw + bw * (.3 + r() * .4), y = r() * S; const gr = g.createRadialGradient(x, y, 1, x, y, 9 + r() * 7); gr.addColorStop(0, 'rgba(60,35,15,.5)'); gr.addColorStop(1, 'rgba(60,35,15,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, 9, 16, 0, 0, 7); g.fill(); }
        g.fillStyle = 'rgba(20,12,5,.55)'; g.fillRect(i * bw - 1.5, 0, 3, S); }
    } else if (material === 'metal') {
      const n = 6, bw = S / n; for (let i = 0; i < n; i++) { const gr = g.createLinearGradient(i * bw, 0, (i + 1) * bw, 0); gr.addColorStop(0, '#e9e9e9'); gr.addColorStop(.5, '#fbfbfb'); gr.addColorStop(1, '#ececec'); g.fillStyle = gr; g.fillRect(i * bw, 0, bw, S); g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(i * bw + 3, 0, 4, S); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(i * bw + 9, 0, 4, S); }
    } else {
      for (let k = 0; k < 9000; k++) { const v = 215 + Math.floor(r() * 40); g.fillStyle = `rgba(${v},${v},${v},.5)`; g.fillRect(r() * S, r() * S, 2 + r() * 3, 2 + r() * 3); }
      g.fillStyle = 'rgba(25,25,25,.6)'; for (let i = 0; i < 2; i++) g.fillRect(i * S / 2 - 2, 0, 4, S); for (let j = 0; j < 2; j++) g.fillRect(0, j * S / 2 + S * .1 - 2, S, 4);
      g.fillStyle = 'rgba(60,60,60,.7)'; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (const [dx, dy] of [[26, 26], [S / 2 - 26, 26], [26, S / 2 - 26], [S / 2 - 26, S / 2 - 26]]) { g.beginPath(); g.arc(i * S / 2 + dx, (j * S / 2 + S * .1 + dy) % S, 4, 0, 7); g.fill(); }
    }
  });
  const bump = canvasTex(S, S, (g) => {
    g.fillStyle = '#808080'; g.fillRect(0, 0, S, S);
    if (material === 'wood') { const n = 20, bw = S / n; for (let i = 0; i < n; i++) { const gr = g.createLinearGradient(i * bw, 0, (i + 1) * bw, 0); gr.addColorStop(0, '#000'); gr.addColorStop(.08, '#9a9a9a'); gr.addColorStop(.5, '#b0b0b0'); gr.addColorStop(.92, '#9a9a9a'); gr.addColorStop(1, '#000'); g.fillStyle = gr; g.fillRect(i * bw, 0, bw, S); } }
    else if (material === 'metal') { const n = 6, bw = S / n; for (let i = 0; i < n; i++) { g.fillStyle = '#7c7c7c'; g.fillRect(i * bw, 0, bw, S); const gr = g.createLinearGradient(i * bw, 0, i * bw + 14, 0); gr.addColorStop(0, '#808080'); gr.addColorStop(.5, '#fff'); gr.addColorStop(1, '#808080'); g.fillStyle = gr; g.fillRect(i * bw, 0, 14, S); } }
    else { const r2 = rng(91); for (let k = 0; k < 14000; k++) { const v = 110 + Math.floor(r2() * 40); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(r2() * S, r2() * S, 2, 2); } g.fillStyle = '#000'; for (let i = 0; i < 2; i++) g.fillRect(i * S / 2 - 2, 0, 4, S); for (let j = 0; j < 2; j++) g.fillRect(0, j * S / 2 + S * .1 - 2, S, 4); }
  }, { srgb: false });
  return (TEX[material] = [col, bump]);
}
function roofTex(material) {
  const key = 'roof-' + material; if (TEX[key]) return TEX[key];
  const S = 1024, r = rng(material.length * 31 + 7);
  const col = canvasTex(S, S, g => { g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, S, S);
    if (material === 'shingle') { const rows = 12, rh = S / rows, cw = S / 6; for (let j = 0; j < rows; j++) for (let i = -1; i < 7; i++) { const v = 170 + Math.floor(r() * 80); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(i * cw + (j % 2) * cw / 2 + 2, j * rh + 2, cw - 4, rh - 3); } for (let k = 0; k < 30000; k++) { g.fillStyle = `rgba(${r() < .5 ? 0 : 255},${r() < .5 ? 0 : 255},${r() < .5 ? 0 : 255},.07)`; g.fillRect(r() * S, r() * S, 2, 2); } g.fillStyle = 'rgba(0,0,0,.5)'; for (let j = 0; j < rows; j++) g.fillRect(0, j * rh - 2, S, 5); }
    else { const n = 5, bw = S / n; for (let i = 0; i < n; i++) { g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(i * bw + 2, 0, 5, S); g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(i * bw + 9, 0, 5, S); } } });
  const bump = canvasTex(S, S, g => { g.fillStyle = '#808080'; g.fillRect(0, 0, S, S);
    if (material === 'shingle') { const rows = 12, rh = S / rows; for (let j = 0; j < rows; j++) { const gr = g.createLinearGradient(0, j * rh, 0, (j + 1) * rh); gr.addColorStop(0, '#303030'); gr.addColorStop(.15, '#b0b0b0'); gr.addColorStop(1, '#707070'); g.fillStyle = gr; g.fillRect(0, j * rh, S, rh); } }
    else { const n = 5, bw = S / n; for (let i = 0; i < n; i++) { const gr = g.createLinearGradient(i * bw, 0, i * bw + 16, 0); gr.addColorStop(0, '#808080'); gr.addColorStop(.5, '#fff'); gr.addColorStop(1, '#808080'); g.fillStyle = gr; g.fillRect(i * bw, 0, 16, S); } } }, { srgb: false });
  return (TEX[key] = [col, bump]);
}
function boardsTex() {   // scânduri de terasă / parchet, pe lungime; un pătrat = 1,6 m
  if (TEX.boards) return TEX.boards; const S = 512, r = rng(77);
  const col = canvasTex(S, S, g => { const n = 11, bh = S / n; for (let j = 0; j < n; j++) { const v = 200 + Math.floor(r() * 50); g.fillStyle = `rgb(${v},${v - 4},${v - 10})`; g.fillRect(0, j * bh, S, bh); for (let k = 0; k < 14; k++) { g.strokeStyle = `rgba(70,45,20,${.06 + r() * .1})`; g.lineWidth = .6 + r(); const y = j * bh + 2 + r() * (bh - 4), x = r() * S; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 80 + r() * 300, y + (r() - .5) * 3); g.stroke(); } g.fillStyle = 'rgba(15,10,5,.6)'; g.fillRect(0, j * bh - 1, S, 2.5); const x = r() * S; g.fillRect(x, j * bh, 2, bh); } });
  return (TEX.boards = col);
}
function grassTex() {
  if (TEX.grass) return TEX.grass; const S = 512, r = rng(5);
  return (TEX.grass = canvasTex(S, S, g => { g.fillStyle = '#6a8450'; g.fillRect(0, 0, S, S); for (let k = 0; k < 60; k++) { const x = r() * S, y = r() * S, rad = 40 + r() * 90, gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, r() < .5 ? 'rgba(120,140,70,.22)' : 'rgba(60,90,45,.22)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; for (const [dx, dy] of [[0, 0], [S, 0], [-S, 0], [0, S], [0, -S]]) g.fillRect(x - rad + dx, y - rad + dy, rad * 2, rad * 2); } for (let k = 0; k < 30000; k++) { const v = r(); g.strokeStyle = `rgba(${70 + v * 70},${100 + v * 60},${45 + v * 40},.5)`; g.lineWidth = 1; const x = r() * S, y = r() * S; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - .5) * 4, y - 3 - r() * 6); g.stroke(); } }));
}
function stoneTex() {
  if (TEX.stone) return TEX.stone; const S = 512, r = rng(19);
  return (TEX.stone = canvasTex(S, S, g => { g.fillStyle = '#d8d5cf'; g.fillRect(0, 0, S, S); for (let k = 0; k < 9000; k++) { const v = 190 + Math.floor(r() * 50); g.fillStyle = `rgba(${v},${v},${v - 4},.5)`; g.fillRect(r() * S, r() * S, 3, 3); } g.strokeStyle = 'rgba(90,88,82,.7)'; g.lineWidth = 3; for (let i = 0; i <= 2; i++) { g.beginPath(); g.moveTo(i * S / 2, 0); g.lineTo(i * S / 2, S); g.stroke(); g.beginPath(); g.moveTo(0, i * S / 2); g.lineTo(S, i * S / 2); g.stroke(); } }));
}
function skyTex() {
  return canvasTex(1024, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3f7fcb'); gr.addColorStop(.36, '#8fbbe6'); gr.addColorStop(.5, '#e6eef2'); gr.addColorStop(.52, '#b9c4a0'); gr.addColorStop(1, '#6a8450'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const r = rng(2026); g.filter = 'blur(9px)'; for (let k = 0; k < 26; k++) { const x = r() * w, y = h * (.2 + r() * .24), n = 4 + Math.floor(r() * 5); for (let j = 0; j < n; j++) { g.fillStyle = `rgba(255,255,255,${.35 + r() * .4})`; const cx = x + (r() - .5) * 110, rx = 26 + r() * 46; for (const dx of [0, w, -w]) { g.beginPath(); g.ellipse(cx + dx, y + (r() - .5) * 12, rx, rx * .32, 0, 0, 7); g.fill(); } } } g.filter = 'none'; }, { repeat: false });
}
function treesTex() {   // șirul de copaci din depărtare, șters (ca într-o fotografie cu fundalul neclar)
  return canvasTex(2048, 256, (g, w, h) => { const r = rng(404); g.clearRect(0, 0, w, h); g.filter = 'blur(5px)';
    for (let layer = 0; layer < 3; layer++) for (let i = 0; i < 90; i++) { const x = r() * w, rad = 26 + r() * 46, y = h - 20 - r() * 40 - layer * 6, v = r(); g.fillStyle = `rgba(${48 + v * 40 + layer * 12},${84 + v * 45 + layer * 12},${44 + v * 25},${.9})`; for (const dx of [0, -w, w]) { g.beginPath(); g.ellipse(x + dx, y - rad * .6, rad, rad * (1 + r() * .7), 0, 0, 7); g.fill(); } }
    g.filter = 'none'; const gr = g.createLinearGradient(0, h - 26, 0, h); gr.addColorStop(0, 'rgba(96,128,70,0)'); gr.addColorStop(1, 'rgba(111,143,74,1)'); g.fillStyle = gr; g.fillRect(0, h - 26, w, 26); }, { repeat: true });
}

/* ---------- geometria casei (aceleași măsuri ca în viewer.js) ---------- */
function openingRects(span, side, opening) {
  const individual = Array.isArray(opening.items);
  const types = individual ? opening.items.slice(0, 3) : Array(clamp(Math.round(Number(opening.count) || 1), 1, 3)).fill(opening.type);
  if (!types.length) return [];
  const sideEl = side === 'right' || side === 'left', margin = Math.min(span * .135, 1.14), available = span - margin * 2, gap = types.length > 1 ? Math.min(.5, span * .064) : 0, bay = (available - (types.length - 1) * gap) / types.length;
  const slots = types.map(type => { const slider = type === 'slider', door = type === 'door', cap = door ? 1.06 : slider ? (sideEl ? 2.55 : 3.4) : (sideEl ? 1.62 : 2.08); return { type, w: Math.min(cap, bay), bottom: slider || door ? .01 : sideEl ? .8 : .95, top: slider || door ? 2.32 : 2.23 }; });
  const legacyStart = (span - slots.length * slots[0].w - (slots.length - 1) * gap) / 2;
  return slots.map((s, i) => ({ ...s, x: individual ? margin + i * (bay + gap) + (bay - s.w) / 2 : legacyStart + i * (s.w + gap) })).filter(s => ['window', 'door', 'slider'].includes(s.type));
}

function buildHouse(config, env) {
  const G = new THREE.Group(), { length: w, width: d } = MODELS[config.model] || MODELS.compact;
  const roof = { style: 'mono', material: 'metal', color: '#373b39', overhang: true, ...config.roof }, base = .29, nominal = 2.67, over = roof.overhang ? .34 : .07, high = Math.min(.95, d * .148);
  const top = z => roof.style === 'gable' ? nominal + high * (1 - Math.abs(z) / (d / 2)) : nominal + (z / d + .5) * .2, T = .16;
  const walls = [];
  const std = (o) => new THREE.MeshStandardMaterial(o), mesh = (geo, mat, cast = true, recv = true) => { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = recv; return m; };
  const box = (sx, sy, sz, mat, x, y, z, parent = G) => { const m = mesh(new THREE.BoxGeometry(sx, sy, sz), mat); m.position.set(x, y, z); parent.add(m); return m; };
  const alu = std({ color: 0x24282b, roughness: .42, metalness: .75 }), white = std({ color: 0xf2efe9, roughness: .9 });
  const glazing = config.interior?.glazing || 'standard';
  const glass = new THREE.MeshPhysicalMaterial({ color: glazing === 'solar' ? 0x8a6b45 : glazing === 'privacy' ? 0x5f6d73 : 0xcfe3ea, roughness: .04, metalness: glazing === 'privacy' ? .55 : .1, transparent: true, opacity: glazing === 'privacy' ? .72 : glazing === 'solar' ? .42 : .2, envMapIntensity: 1.6, side: THREE.DoubleSide, depthWrite: false });
  // terasă, treaptă, soclu
  const bt = boardsTex();
  const deckMat = c => { const t = bt.clone(); t.needsUpdate = true; return [std({ color: c, map: t, roughness: .78 }), t]; };
  const deckFront = d / 2 + .96, deckLeft = -w / 2 - .18, deckRight = w / 2 + .18, deckBack = -d / 2 - .13;
  { const [m, t] = deckMat(0xc9a882); t.repeat.set((deckRight - deckLeft) / 1.6, (deckFront - deckBack) / 1.6); box(deckRight - deckLeft, .11, deckFront - deckBack, m, 0, .215, (deckFront + deckBack) / 2);
    const [m2, t2] = deckMat(0xb99873); t2.repeat.set((w - .7) / 1.6, .25); box(w - .7, .1, .33, m2, 0, .085, deckFront + .105);
    box(deckRight - deckLeft - .2, .16, deckFront - deckBack - .2, std({ color: 0x3c3832, roughness: .9 }), 0, .11, (deckFront + deckBack) / 2);
    box(w - .04, .06, d - .04, std({ color: 0x4a453c, roughness: .8 }), 0, base - .005, 0); }
  // pereți: fiecare e o placă cu goluri pentru uși și ferestre
  const starts = [[-w / 2, d / 2], [w / 2, d / 2], [w / 2, -d / 2], [-w / 2, -d / 2]];
  SIDES.forEach((side, i) => {
    const [ax, az] = starts[i], [bx, bz] = starts[(i + 1) % 4], len = i % 2 ? d : w, zAt = s => az + (bz - az) * (s / len), spec = { material: 'wood', orientation: 'vertical', color: '#b89269', ...config.walls?.[side] };
    const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(len, 0); sh.lineTo(len, top(bz)); if (i % 2 && roof.style === 'gable') sh.lineTo(len / 2, top(0)); sh.lineTo(0, top(az)); sh.closePath();
    const rects = openingRects(len, side, config.openings?.[side] || { type: 'none', count: 1 });
    for (const r of rects) { const h = new THREE.Path(); h.moveTo(r.x, r.bottom); h.lineTo(r.x + r.w, r.bottom); h.lineTo(r.x + r.w, r.top); h.lineTo(r.x, r.top); h.closePath(); sh.holes.push(h); }
    const [ct, cb] = cladTex(spec.material), map = ct.clone(), bump = cb.clone(); for (const t of [map, bump]) { t.needsUpdate = true; t.repeat.set(1 / 2.4, 1 / 2.4); if (spec.orientation === 'horizontal') { t.rotation = Math.PI / 2; } }
    const mat = std({ color: spec.color, map, bumpMap: bump, bumpScale: spec.material === 'fiber' ? .6 : 1.6, roughness: spec.material === 'metal' ? .42 : spec.material === 'wood' ? .78 : .9, metalness: spec.material === 'metal' ? .55 : 0 });
    const grp = new THREE.Group(); grp.position.set(ax, base, az); grp.rotation.y = i * Math.PI / 2;   // x local = de-a lungul peretelui, z local = spre afară
    const outer = mesh(new THREE.ExtrudeGeometry(sh, { depth: T * .55, bevelEnabled: false }), mat); outer.position.z = -T * .55; outer.userData.wall = side; grp.add(outer); walls.push(outer);
    const inner = mesh(new THREE.ExtrudeGeometry(sh, { depth: T * .45, bevelEnabled: false }), white); inner.position.z = -T; grp.add(inner);
    for (const r of rects) {   // tocul, sticla, canatul
      const hh = r.top - r.bottom, cx = r.x + r.w / 2, cy = r.bottom + hh / 2, f = .055;
      const bar = (sx, sy, x, y, z = -T / 2, dz = T + .03) => { const m = mesh(new THREE.BoxGeometry(sx, sy, dz), alu); m.position.set(x, y, z); grp.add(m); };
      bar(r.w, f, cx, r.top - f / 2); bar(r.w, r.type === 'window' ? f : .03, cx, r.bottom + (r.type === 'window' ? f : .03) / 2); bar(f, hh, r.x + f / 2, cy); bar(f, hh, r.x + r.w - f / 2, cy);
      if (r.type === 'door') { const dm = mesh(new THREE.BoxGeometry(r.w - 2 * f, hh - f - .03, .05), std({ color: 0x2b3033, roughness: .5, metalness: .5 })); dm.position.set(cx, r.bottom + .03 + (hh - f - .03) / 2, -T * .35); grp.add(dm);
        const gl = mesh(new THREE.PlaneGeometry(r.w * .26, hh * .62), glass, false, false); gl.position.set(cx + r.w * .12, cy + .1, -T * .35 + .028); grp.add(gl);
        const hd = mesh(new THREE.BoxGeometry(.03, .22, .05), std({ color: 0xc9ccd0, roughness: .25, metalness: .9 })); hd.position.set(r.x + f + .1, r.bottom + 1.02, -T * .35 + .05); grp.add(hd); }
      else { const n = r.type === 'slider' ? (r.w > 2.4 ? 3 : 2) : (r.w > 1.5 ? 2 : 1); for (let k = 1; k < n; k++) bar(.05, hh - f, r.x + r.w * k / n, cy, -T / 2 + (r.type === 'slider' && k % 2 ? .02 : 0), .07);
        const gl = mesh(new THREE.PlaneGeometry(r.w - 2 * f, hh - 2 * f), glass, false, false); gl.position.set(cx, cy, -T / 2); gl.renderOrder = 2; grp.add(gl);
        if (r.type === 'window') { const sill = mesh(new THREE.BoxGeometry(r.w + .1, .03, .12), alu); sill.position.set(cx, r.bottom - .015, .03); grp.add(sill); } }
    }
    G.add(grp);
  });
  for (const [cx, cz] of starts) { const h = top(cz) + .02; box(.2, h, .2, std({ color: roof.trimColor || roof.color, roughness: .5, metalness: .45 }), cx - Math.sign(cx) * .075, base + h / 2 - .01, cz - Math.sign(cz) * .075); }
  // interior: pardoseală, tavan, câteva piese de mobilier (se văd prin sticlă)
  const fl = config.interior?.floor || 'standard';
  { let m; if (fl === 'stone') { const t = stoneTex().clone(); t.needsUpdate = true; t.repeat.set(w / 1.2, d / 1.2); m = std({ color: 0xd9d6cf, map: t, roughness: .55 }); } else { const t = bt.clone(); t.needsUpdate = true; t.repeat.set(w / 1.6, d / 1.6); m = std({ color: fl === 'oak' ? 0xc79a62 : 0xcfc6b6, map: t, roughness: fl === 'oak' ? .5 : .7 }); }
    const f = mesh(new THREE.BoxGeometry(w - .3, .02, d - .3), m, false, true); f.position.set(0, base + .012, 0); G.add(f);
    const sofaM = std({ color: 0xcfc4b0, roughness: .95 }), woodM = std({ color: 0x9a744c, roughness: .6 }), rugM = std({ color: 0xe6dfd2, roughness: 1 });
    const rb = (sx, sy, sz, mat, x, y, z) => box(sx, sy, sz, mat, x, base + y, z);
    const sx0 = -w * .22; rb(2.3, .01, 1.5, rugM, sx0, .025, .2); rb(1.9, .36, .8, sofaM, sx0, .22, -d / 2 + .62); rb(1.9, .42, .2, sofaM, sx0, .6, -d / 2 + .32); rb(.2, .2, .8, sofaM, sx0 - .95, .5, -d / 2 + .62); rb(.2, .2, .8, sofaM, sx0 + .95, .5, -d / 2 + .62);
    rb(.9, .05, .5, woodM, sx0, .34, .35); for (const [a, b] of [[-.38, -.18], [.38, -.18], [-.38, .18], [.38, .18]]) rb(.04, .3, .04, woodM, sx0 + a, .17, .35 + b);
    const bx0 = w * .26; rb(1.7, .28, 2.05, woodM, bx0, .16, -d / 2 + 1.2); rb(1.62, .2, 1.95, std({ color: 0xf4f1ec, roughness: 1 }), bx0, .4, -d / 2 + 1.22); rb(1.7, .7, .08, woodM, bx0, .55, -d / 2 + .2); rb(.55, .12, .34, std({ color: 0xfbfaf7, roughness: 1 }), bx0 - .4, .55, -d / 2 + .5); rb(.55, .12, .34, std({ color: 0xfbfaf7, roughness: 1 }), bx0 + .4, .55, -d / 2 + .5);
    rb(.08, 2.3, d * .5, white, w * .04, 1.15, -d / 2 + d * .25 + .1);   // un perete despărțitor scurt
    const lights = config.interior?.lights || 'standard', lc = lights === 'warm' ? 0xffc98a : lights === 'smart' ? 0xcfe0ff : 0xfff1dc;
    for (const x of [sx0, bx0]) { const l = new THREE.PointLight(lc, lights === 'standard' ? 5 : 11, 9, 1.6); l.position.set(x, base + 2.25, 0); G.add(l); const bulb = mesh(new THREE.CylinderGeometry(.16, .16, .025, 24), new THREE.MeshBasicMaterial({ color: lc }), false, false); bulb.position.set(x, base + 2.6, 0); G.add(bulb); }
  }
  // acoperiș: plăci înclinate (una sau două ape), cu margine în culoarea bordurii
  const rx = w / 2 + over, rz = d / 2 + over, cap = .13, [rt, rb2] = roofTex(roof.material), trim = std({ color: roof.trimColor || roof.color, roughness: .5, metalness: .5 });
  for (const [za, zb] of roof.style === 'gable' ? [[rz, 0], [0, -rz]] : [[rz, -rz]]) {
    const ya = base + top(za), yb = base + top(zb), run = Math.hypot(za - zb, ya - yb), map = rt.clone(), bump = rb2.clone(); for (const t of [map, bump]) { t.needsUpdate = true; t.repeat.set(2 * rx / 2.2, run / 2.2); }
    const topM = std({ color: roof.color, map, bumpMap: bump, bumpScale: 2, roughness: roof.material === 'shingle' ? .95 : .4, metalness: roof.material === 'shingle' ? 0 : .6 });
    const slab = mesh(new THREE.BoxGeometry(2 * rx, cap, run), [trim, trim, topM, std({ color: 0xece8e0, roughness: .9 }), trim, trim]); slab.position.set(0, (ya + yb) / 2 + cap / 2, (za + zb) / 2); slab.rotation.x = Math.atan2(ya - yb, za - zb) * -1; G.add(slab);
    const ceil = mesh(new THREE.PlaneGeometry(w - .3, run), std({ color: 0xf4f1eb, roughness: .95 }), false, true); ceil.rotation.x = Math.PI / 2 + slab.rotation.x; ceil.position.set(0, (ya + yb) / 2 - .012, (za + zb) / 2); G.add(ceil);
  }
  if (roof.style === 'gable') { const ridge = mesh(new THREE.BoxGeometry(2 * rx + .02, .05, .22), trim); ridge.position.set(0, base + top(0) + cap + .01, 0); G.add(ridge); }
  // jgheab și burlan pe latura joasă (la o apă: în spate), ca la o casă adevărată
  { const zl = roof.style === 'gable' ? rz : -rz, y = base + top(roof.style === 'gable' ? rz : -rz); const gut = mesh(new THREE.CylinderGeometry(.06, .06, 2 * rx, 12, 1, false, 0, Math.PI), trim); gut.rotation.z = Math.PI / 2; gut.rotation.y = Math.PI; gut.position.set(0, y + .02, zl + Math.sign(zl) * .06); G.add(gut);
    const pipe = mesh(new THREE.CylinderGeometry(.04, .04, y - .1, 12), trim); pipe.position.set(w / 2 + .05, y / 2 + .05, zl - Math.sign(zl) * (over - .02)); G.add(pipe); }
  // ghiveci pe terasă
  { const pot = mesh(new THREE.CylinderGeometry(.2, .15, .38, 24), std({ color: 0xb9afa0, roughness: .9 })); pot.position.set(-w / 2 + .35, .27 + .19, d / 2 + .54); G.add(pot); const r = rng(482), leafM = std({ color: 0x5f7a45, roughness: .8, side: THREE.DoubleSide });
    for (let k = 0; k < 46; k++) { const a = r() * 6.283, h = .25 + r() * .5, lf = mesh(new THREE.SphereGeometry(.07 + r() * .05, 6, 5), leafM); lf.scale.set(1, .35, .5); lf.position.set(-w / 2 + .35 + Math.cos(a) * (.05 + r() * .2), .66 + h, d / 2 + .54 + Math.sin(a) * (.05 + r() * .2)); lf.rotation.set(r() * 3, a, r() * 1.2); G.add(lf); } }
  return { group: G, walls, w, d, height: base + nominal + (roof.style === 'gable' ? high : .2) + cap };
}

/* ---------- Capsula X7: modelul 3D adevărat (același ca pe site-ul cu capsule), colorat după opțiuni ---------- */
function buildCapsule(config) {
  const M = x7Materials(x7Kit()), shell = config.walls?.front?.color || '#e9eeed', trim = config.roof?.trimColor || '#273940', it = config.interior || {};
  M.shell.color.set(shell); M.roof.color.set(config.roof?.color || shell); M.seam.color.set(shell).multiplyScalar(.82); M.frame.color.set(trim); M.dark.color.set(trim);
  const dark = M.shell.color.getHSL({}).l < .45; M.shell.roughness = dark ? .34 : .42; M.shell.metalness = dark ? .35 : .12; M.roof.roughness = M.shell.roughness; M.roof.metalness = M.shell.metalness;
  M.glass.opacity = .5; M.glass.metalness = .55; M.glass.color.set(0x24384a);
  M.floor.color.set(it.floor === 'oak' ? 0xc79a62 : it.floor === 'stone' ? 0xcfcbc3 : 0xc8b79c); M.floor.roughness = it.floor === 'stone' ? .5 : .65;
  const api = buildX7(M, { lamps: true }); api.night(it.lights === 'warm' ? .62 : it.lights === 'smart' ? .5 : .3);
  if (it.lights === 'smart') { M.led.emissive.set(0x9fd0ff); M.ledIn.emissive.set(0xcfe4ff); }
  const G = new THREE.Group(); G.add(api.root); api.root.traverse(o => { if (o.isMesh) { o.castShadow = o.material !== M.glass && o.material !== M.skyglass; o.receiveShadow = true; } if (o.isLineSegments) o.visible = false; });
  return { group: G, walls: [], w: 11.5, d: 3.4, height: 3.45, capsule: true };
}

/* ---------- vizualizatorul ---------- */
export function createViewer(canvas, opts = {}) {
  const { onViewChange, onWallSelect } = opts;
  let flat = null, gl = null, R = null, scene = null, cam = null, house = null, key = null, latest = null, useGL = false, closing = false, frame = 0, tween = 0;
  let yaw = CAM['3d'][0], pitch = CAM['3d'][1], zoomAmount = 1, view = '3d', dims = false, dimGroup = null, sun = null, wasCapsule = false;
  const camOf = name => (name === '3d' && wasCapsule ? [-.58, .1] : CAM[name] || CAM['3d']);
  const flatViewer = () => (flat ??= createFlat(canvas, opts));
  const announce = name => { if (name !== view) { view = name; onViewChange?.(name); } };
  const schedule = () => { if (!frame && !closing && useGL) frame = requestAnimationFrame(draw); };
  const sync = () => { if (!gl) return; gl.hidden = canvas.hidden || !useGL; canvas.style.display = useGL ? 'none' : ''; gl.setAttribute('aria-label', canvas.getAttribute('aria-label') || ''); };
  const mo = new MutationObserver(sync); mo.observe(canvas, { attributes: true, attributeFilter: ['hidden', 'aria-label'] });
  const nativeData = canvas.toDataURL.bind(canvas);
  canvas.toDataURL = (...a) => { if (useGL && gl) { draw(); return gl.toDataURL(...a); } return nativeData(...a); };

  function init() {
    gl = document.createElement('canvas'); gl.className = canvas.className; gl.tabIndex = 0; gl.style.touchAction = 'none'; gl.style.cursor = 'grab'; canvas.after(gl);
    R = new THREE.WebGLRenderer({ canvas: gl, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = .98; R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
    scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xdde6e6, 45, 130);
    const sky = skyTex(); sky.mapping = THREE.EquirectangularReflectionMapping; scene.background = sky;
    const pm = new THREE.PMREMGenerator(R); scene.environment = pm.fromEquirectangular(sky).texture; pm.dispose(); scene.environmentIntensity = .75;
    cam = new THREE.PerspectiveCamera(26, 1, .3, 400);
    scene.add(new THREE.HemisphereLight(0xcfe2ff, 0x7c8a5c, .55));
    sun = new THREE.DirectionalLight(0xfff2dc, 3.1); sun.position.set(-10, 13, 9); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0004; sun.shadow.normalBias = .03; sun.shadow.radius = 4;
    Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 50 }); scene.add(sun);
    const gt = grassTex(); gt.repeat.set(55, 55); const ground = new THREE.Mesh(new THREE.PlaneGeometry(360, 360), new THREE.MeshStandardMaterial({ color: 0xffffff, map: gt, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
    const tt = treesTex(); tt.repeat.set(4, 1); const trees = new THREE.Mesh(new THREE.CylinderGeometry(70, 70, 9.5, 64, 1, true), new THREE.MeshBasicMaterial({ map: tt, transparent: true, side: THREE.BackSide, fog: true, depthWrite: false })); trees.position.y = 4.6; scene.add(trees);
    // o alee de dale până la treaptă
    const st = stoneTex().clone(); st.needsUpdate = true; st.repeat.set(1, 4); const path = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 9), new THREE.MeshStandardMaterial({ color: 0xcfcbc3, map: st, roughness: .85 })); path.rotation.x = -Math.PI / 2; path.position.set(0, .012, 9); path.receiveShadow = true; path.userData.path = 1; scene.add(path);
    for (const [t, f, o] of [['pointerdown', down], ['pointermove', move], ['pointerup', end], ['pointercancel', end], ['lostpointercapture', end], ['wheel', wheel, { passive: false }], ['dblclick', () => goTo('3d', true)], ['keydown', keydown]]) gl.addEventListener(t, f, o);
    ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null; ro?.observe(gl); window.addEventListener('resize', schedule);
  }
  let ro = null;
  function disposeHouse() { if (!house) return; scene.remove(house.group); house.group.traverse(o => { o.geometry?.dispose(); for (const m of [].concat(o.material || [])) { for (const k of ['map', 'bumpMap']) m[k]?.dispose?.(); m.dispose(); } }); house = null; }
  function update(config, layer = null) {
    if (closing) return; const settings = config || defaultConfig(); latest = settings;
    const want = !layer, capsule = settings.model === 'x7';
    if (!want) { useGL = false; sync(); flatViewer().update(settings, layer); return; }
    if (!gl) { try { init(); } catch (e) { console.warn('3D indisponibil, rămâne desenul simplu', e); gl = null; flatViewer().update(settings, layer); return; } }
    if (!useGL || capsule !== wasCapsule) { useGL = true; wasCapsule = capsule; [yaw, pitch] = camOf('3d'); zoomAmount = 1; }
    sync();
    const k = JSON.stringify([settings.model, settings.roof, settings.walls, settings.openings, settings.interior, settings.extras]); if (k === key) { schedule(); return; } key = k;
    disposeHouse(); house = capsule ? buildCapsule(settings) : buildHouse(settings); scene.add(house.group);
    scene.traverse(o => { if (o.userData.path) o.position.z = house.d / 2 + 1.25 + 4.5; });
    buildDims(); schedule();
  }
  function textSprite(text) { const c = document.createElement('canvas'); c.width = 256; c.height = 96; const g = c.getContext('2d'); g.fillStyle = 'rgba(255,255,255,.94)'; g.beginPath(); g.roundRect(8, 14, 240, 68, 18); g.fill(); g.fillStyle = '#2b2622'; g.font = '600 40px system-ui,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 128, 50); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false })); s.scale.set(1.6, .6, 1); s.renderOrder = 9; return s; }
  function buildDims() {
    if (dimGroup) { scene.remove(dimGroup); dimGroup = null; } if (!dims || !house) return; dimGroup = new THREE.Group(); const { w, d, height } = house, fmt = v => String(Math.round(v * 100) / 100).replace('.', ',') + ' m', lm = new THREE.LineBasicMaterial({ color: 0x2b2622, depthTest: false });
    const seg = (a, b, label) => { const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]); const l = new THREE.Line(g, lm); l.renderOrder = 8; dimGroup.add(l); const s = textSprite(label); s.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + .1, (a[2] + b[2]) / 2); dimGroup.add(s); };
    seg([-w / 2, .05, d / 2 + 1.9], [w / 2, .05, d / 2 + 1.9], fmt(w)); seg([w / 2 + 1, .05, -d / 2], [w / 2 + 1, .05, d / 2], fmt(d)); seg([-w / 2 - .7, 0, d / 2 + .1], [-w / 2 - .7, height, d / 2 + .1], fmt(height)); scene.add(dimGroup);
  }
  function draw() {
    frame = 0; if (!gl || !house || closing) return; const rect = gl.getBoundingClientRect(), W = rect.width, H = rect.height; if (!W || !H) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2); if (R.getPixelRatio() !== dpr) R.setPixelRatio(dpr); const sz = R.getSize(new THREE.Vector2()); if (sz.x !== Math.round(W) || sz.y !== Math.round(H)) R.setSize(Math.round(W), Math.round(H), false);
    cam.aspect = W / H; const { w, d, height } = house, rad = Math.hypot(w + .4, d + 1.6, height) / 2, vf = cam.fov * Math.PI / 360, hf = Math.atan(Math.tan(vf) * cam.aspect), dist = rad / Math.sin(Math.min(vf, hf)) * (house.capsule ? .7 : .86) / zoomAmount;
    const ty = height * .5, tz = .35; cam.position.set(Math.sin(yaw) * Math.cos(pitch) * dist, ty + Math.sin(pitch) * dist, tz + Math.cos(yaw) * Math.cos(pitch) * dist); cam.up.set(0, 1, 0); if (pitch > 1.45) cam.up.set(-Math.sin(yaw), 0, -Math.cos(yaw)); cam.lookAt(0, ty, tz); cam.updateProjectionMatrix();
    R.render(scene, cam);
  }
  function stopTween() { if (tween) cancelAnimationFrame(tween); tween = 0; }
  function goTo(name, restoreZoom = false) {
    if (!useGL) { flatViewer().setView(name); return; }
    const c = camOf(name); stopTween(); let [ty, tp] = c; const y0 = yaw, p0 = pitch, z0 = zoomAmount, t0 = performance.now(); ty = y0 + ((ty - y0 + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
    const step = now => { const k = Math.min(1, (now - t0) / 420), e = k * k * (3 - 2 * k); yaw = y0 + (ty - y0) * e; pitch = p0 + (tp - p0) * e; if (restoreZoom) zoomAmount = z0 + (1 - z0) * e; draw(); tween = k < 1 ? requestAnimationFrame(step) : 0; };
    announce(name === 'right' || name === 'left' ? name : name); tween = requestAnimationFrame(step);
  }
  function zoom(f) { if (!useGL) { flatViewer().zoom(f); return; } zoomAmount = clamp(zoomAmount * f, .56, 2.5); schedule(); }
  const ptr = new Map(); let drag = null, tap = null;
  const centroid = () => { const a = [...ptr.values()], x = a.reduce((n, p) => n + p.x, 0) / a.length, y = a.reduce((n, p) => n + p.y, 0) / a.length; return { x, y, spacing: a.length > 1 ? Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) : 0 }; };
  function down(e) { gl.setPointerCapture?.(e.pointerId); ptr.set(e.pointerId, { x: e.clientX, y: e.clientY }); drag = centroid(); tap = ptr.size === 1 ? { id: e.pointerId, x: e.clientX, y: e.clientY } : null; stopTween(); gl.style.cursor = 'grabbing'; }
  function move(e) { if (!ptr.has(e.pointerId)) return; ptr.set(e.pointerId, { x: e.clientX, y: e.clientY }); const n = centroid(); if (drag) { const dx = n.x - drag.x, dy = n.y - drag.y; if (n.spacing && drag.spacing) zoomAmount = clamp(zoomAmount * n.spacing / drag.spacing, .56, 2.5); if (Math.abs(dx) + Math.abs(dy) > .025) { yaw -= dx * .009; pitch = clamp(pitch + dy * .0075, .02, Math.PI / 2 - .001); announce('3d'); } schedule(); } drag = n; }
  function end(e) { if (!ptr.has(e.pointerId)) return; const sel = tap && tap.id === e.pointerId && e.type === 'pointerup' && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) < 5; tap = null;
    if (sel && onWallSelect && house) { const r = gl.getBoundingClientRect(), rc = new THREE.Raycaster(); rc.setFromCamera(new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height * 2 - 1)), cam); const hit = rc.intersectObjects(house.group.children, true).find(h => h.object.material !== undefined && !h.object.material.transparent); if (hit?.object.userData.wall) onWallSelect(hit.object.userData.wall); }
    ptr.delete(e.pointerId); drag = ptr.size ? centroid() : null; gl.style.cursor = drag ? 'grabbing' : 'grab'; }
  function wheel(e) { e.preventDefault(); zoom(Math.exp(-clamp(e.deltaY, -160, 160) * .0016)); }
  function keydown(e) { if (e.altKey || e.metaKey || e.ctrlKey) return; switch (e.key) { case 'ArrowLeft': yaw += .13; break; case 'ArrowRight': yaw -= .13; break; case 'ArrowUp': pitch = clamp(pitch + .085, .02, Math.PI / 2 - .001); break; case 'ArrowDown': pitch = clamp(pitch - .085, .02, Math.PI / 2 - .001); break; case '+': case '=': e.preventDefault(); zoom(1.13); return; case '-': e.preventDefault(); zoom(1 / 1.13); return; case 'Home': e.preventDefault(); goTo('3d', true); return; default: return; } e.preventDefault(); stopTween(); announce('3d'); schedule(); }
  return {
    update,
    setView(name) { goTo(name); },
    zoom,
    reset() { if (useGL) goTo('3d', true); else flatViewer().reset(); },
    setDimensions(v) { dims = Boolean(v); flat?.setDimensions(v); if (useGL) { buildDims(); schedule(); } },
    destroy() { closing = true; stopTween(); cancelAnimationFrame(frame); mo.disconnect(); ro?.disconnect(); window.removeEventListener('resize', schedule); flat?.destroy(); if (R) { disposeHouse(); R.dispose(); gl.remove(); } }
  };
}
