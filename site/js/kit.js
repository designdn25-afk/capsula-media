// Unelte comune pentru scenele 3D ale site-ului (three.js e local, în site/vendor; nimic de pe alte site-uri).
// Folosit de: js/x7.js (modelul capsulei), js/story.js (povestea de la deschidere), js/houses.js + js/garden.js (grădina cu case).
import * as THREE from '../vendor/three.module.min.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
export { THREE };

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function webglOK() {
  try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; }
}

export function makeRenderer(canvas, { alpha = true, shadows = true } = {}) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha, powerPreference: 'high-performance' });
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 1;
  r.shadowMap.enabled = shadows;
  r.shadowMap.type = THREE.PCFSoftShadowMap;
  return r;
}

// potrivește canvasul la elementul lui; întoarce true dacă s-a schimbat mărimea
export function fit(renderer, camera, el, maxDpr = 2) {
  const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return false;
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  const k = w + 'x' + h + '@' + dpr; if (renderer.__k === k) return false; renderer.__k = k;
  renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix(); return true;
}

// lumină de studio pentru reflexii (generată local, o singură dată)
export function studioEnv(renderer) {
  const pm = new THREE.PMREMGenerator(renderer); const t = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose(); return t;
}

/* ---------- conturul în plan: dreptunghi cu colțuri rotunjite, parcurs cu lungimea de arc s ----------
   s = 0 pe latura din față (z = +W/2) la x = +a și crește spre −x, apoi ocolește capătul din stânga, spatele, capătul din dreapta. */
export function perimeter(L, W, r) {
  const a = L / 2 - r, w = W / 2, e = w - r, q = Math.PI * r / 2;
  const segs = [2 * a, q, 2 * e, q, 2 * a, q, 2 * e, q]; const starts = []; let acc = 0; segs.forEach(l => { starts.push(acc); acc += l; });
  const total = acc;
  function at(s) {
    s = ((s % total) + total) % total; let i = 7; for (let k = 0; k < 8; k++) if (s < starts[k] + segs[k]) { i = k; break; }
    const t = s - starts[i]; let g;
    switch (i) {
      case 0: return { x: a - t, z: w, nx: 0, nz: 1 };
      case 1: g = Math.PI / 2 + t / r; return { x: -a + r * Math.cos(g), z: e + r * Math.sin(g), nx: Math.cos(g), nz: Math.sin(g) };
      case 2: return { x: -L / 2, z: e - t, nx: -1, nz: 0 };
      case 3: g = Math.PI + t / r; return { x: -a + r * Math.cos(g), z: -e + r * Math.sin(g), nx: Math.cos(g), nz: Math.sin(g) };
      case 4: return { x: -a + t, z: -w, nx: 0, nz: -1 };
      case 5: g = 1.5 * Math.PI + t / r; return { x: a + r * Math.cos(g), z: -e + r * Math.sin(g), nx: Math.cos(g), nz: Math.sin(g) };
      case 6: return { x: L / 2, z: -e + t, nx: 1, nz: 0 };
      default: g = t / r; return { x: a + r * Math.cos(g), z: e + r * Math.sin(g), nx: Math.cos(g), nz: Math.sin(g) };
    }
  }
  return { L, W, r, a, w, e, total, starts, segs, at,
    sFront: x => a - x, sBack: x => starts[4] + (x + a), sLeft: z => starts[2] + (e - z), sRight: z => starts[6] + (z + e) };
}

function geo(pos, nor, idx, uv) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  if (nor) g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  if (uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  if (idx) g.setIndex(idx);
  if (!nor) g.computeVertexNormals();
  return g;
}

// profilul vertical al carcasei: jos rotunjit spre interior (raza rb), sus rotunjit (raza rt). d = retragerea spre interior.
export function arcBottom(y0, rb, n = 6) { const p = []; for (let i = 0; i <= n; i++) { const a = i / n * Math.PI / 2; p.push({ d: rb * (1 - Math.sin(a)), y: y0 + rb * (1 - Math.cos(a)) }); } return p; }
export function arcTop(y1, rt, n = 7) { const p = []; for (let i = 0; i <= n; i++) { const a = i / n * Math.PI / 2; p.push({ d: rt * (1 - Math.cos(a)), y: y1 - rt + rt * Math.sin(a) }); } return p; }

// suprafață obținută prin plimbarea profilului de-a lungul conturului
export function sweep(per, profile, { ds = .16, s0 = 0, s1 = null } = {}) {
  const len = (s1 === null ? per.total : s1 - s0), n = Math.max(2, Math.ceil(len / ds)), m = profile.length; const pos = [], nor = [], idx = [];
  for (let i = 0; i <= n; i++) {
    const p = per.at(s0 + len * i / n);
    for (let j = 0; j < m; j++) {
      const a = profile[Math.max(0, j - 1)], b = profile[Math.min(m - 1, j + 1)], dd = b.d - a.d, dy = b.y - a.y, l = Math.hypot(dd, dy) || 1, pr = profile[j];
      pos.push(p.x - p.nx * pr.d, pr.y, p.z - p.nz * pr.d); nor.push(p.nx * dy / l, dd / l, p.nz * dy / l);
    }
  }
  for (let i = 0; i < n; i++) for (let j = 0; j < m - 1; j++) { const A = i * m + j, B = (i + 1) * m + j, C = (i + 1) * m + j + 1, D = i * m + j + 1; idx.push(A, C, B, A, D, C); }
  return geo(pos, nor, idx);
}

// capac orizontal (acoperiș / pardoseală) după conturul retras cu d; up = fața în sus
export function cap(per, y, d = 0, up = true, ds = .16) {
  const n = Math.ceil(per.total / ds), sh = new THREE.Shape();
  for (let i = 0; i < n; i++) { const p = per.at(per.total * i / n), x = p.x - p.nx * d, z = (p.z - p.nz * d) * (up ? -1 : 1); i ? sh.lineTo(x, z) : sh.moveTo(x, z); }
  const g = new THREE.ShapeGeometry(sh); g.rotateX(up ? -Math.PI / 2 : Math.PI / 2); g.translate(0, y, 0);
  return g;
}

function clipS(poly, sv, keepGreater, ax = 0) {
  const out = [], n = poly.length, o = 1 - ax, inside = p => (keepGreater ? p[ax] >= sv - 1e-9 : p[ax] <= sv + 1e-9);
  for (let i = 0; i < n; i++) {
    const a = poly[i], b = poly[(i + 1) % n], ia = inside(a), ib = inside(b);
    if (ia) out.push(a);
    if (ia !== ib) { const t = (sv - a[ax]) / (b[ax] - a[ax]), q = []; q[ax] = sv; q[o] = a[o] + (b[o] - a[o]) * t; out.push(q); }
  }
  return out;
}
export const clipPoly = clipS;

// poligon convex desenat în coordonate „desfășurate” (s, y) și așezat pe carcasă, urmând curbura; off = cât iese în afară
// ys = niveluri la care suprafața se împarte și pe înălțime; color(s, y) → [r,g,b] pune culori pe vârfuri (reflexia cerului pe geam)
export function wrapPoly(per, poly, { off = .012, ds = .14, ys = null, color = null } = {}) {
  const ss = poly.map(p => p[0]), smin = Math.min(...ss), smax = Math.max(...ss), n = Math.max(1, Math.ceil((smax - smin) / ds));
  const pos = [], nor = [], idx = [], col = [];
  const emit = piece => { if (piece.length < 3) return; const base = pos.length / 3;
    piece.forEach(([s, y]) => { const p = per.at(s); pos.push(p.x + p.nx * off, y, p.z + p.nz * off); nor.push(p.nx, 0, p.nz); if (color) col.push(...color(s, y)); });
    for (let k = 1; k < piece.length - 1; k++) idx.push(base, base + k, base + k + 1); };
  for (let i = 0; i < n; i++) {
    const a = smin + (smax - smin) * i / n, b = smin + (smax - smin) * (i + 1) / n;
    const piece = clipS(clipS(poly, a, true), b, false); if (piece.length < 3) continue;
    if (!ys) { emit(piece); continue; }
    const lv = [-1e9, ...ys, 1e9]; for (let j = 0; j < lv.length - 1; j++) emit(clipS(clipS(piece, lv[j], true, 1), lv[j + 1], false, 1));
  }
  // orientare spre exterior
  if (idx.length) {
    const v = i => new THREE.Vector3(pos[3 * i], pos[3 * i + 1], pos[3 * i + 2]);
    const A = v(idx[0]), B = v(idx[1]), C = v(idx[2]), nn = B.sub(A).cross(C.sub(A));
    if (nn.x * nor[3 * idx[0]] + nn.z * nor[3 * idx[0] + 2] < 0) for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
  }
  const g = geo(pos, nor, idx); if (color) g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); return g;
}

// linie (pentru desenul tehnic) în coordonate desfășurate, așezată pe carcasă
export function wrapLine(per, pts, { off = .02, ds = .14, closed = true } = {}) {
  const out = [], n = pts.length, m = closed ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const a = pts[i], b = pts[(i + 1) % n], k = Math.max(1, Math.ceil(Math.abs(b[0] - a[0]) / ds));
    for (let j = 0; j < k; j++) {
      const t0 = j / k, t1 = (j + 1) / k, p = per.at(lerp(a[0], b[0], t0)), q = per.at(lerp(a[0], b[0], t1));
      out.push(p.x + p.nx * off, lerp(a[1], b[1], t0), p.z + p.nz * off, q.x + q.nx * off, lerp(a[1], b[1], t1), q.z + q.nz * off);
    }
  }
  return out;
}

// mărește un poligon convex cu m (pentru rame)
export function grow(poly, m) {
  const n = poly.length; let ar = 0; for (let i = 0; i < n; i++) { const p = poly[i], q = poly[(i + 1) % n]; ar += p[0] * q[1] - q[0] * p[1]; }
  const sg = ar > 0 ? 1 : -1;
  const L = poly.map((p, i) => { const q = poly[(i + 1) % n], dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1; return { px: p[0] + sg * dy / l * m, py: p[1] - sg * dx / l * m, dx, dy }; });
  return L.map((b, i) => { const a = L[(i - 1 + n) % n], den = a.dx * b.dy - a.dy * b.dx; if (Math.abs(den) < 1e-9) return [b.px, b.py]; const t = ((b.px - a.px) * b.dy - (b.py - a.py) * b.dx) / den; return [a.px + a.dx * t, a.py + a.dy * t]; });
}

export function lineSeg(positions, material) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); return new THREE.LineSegments(g, material); }
export function edges(geometry, material, angle = 28) { return new THREE.LineSegments(new THREE.EdgesGeometry(geometry, angle), material); }

export function box(w, h, d, mat, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); return m; }

/* ---------- materiale (set nou pentru fiecare scenă, ca să poată fi animate separat) ---------- */
export function materials() {
  const S = (o) => new THREE.MeshStandardMaterial(o);
  return {
    shell: S({ color: 0xf4f2ed, roughness: .46, metalness: .03, side: THREE.DoubleSide }),
    cut: S({ color: 0x2b2e34, roughness: .8 }),
    seam: S({ color: 0xcfcbc2, roughness: .7 }),
    frame: S({ color: 0x191c21, roughness: .42, metalness: .35 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x17304f, roughness: .05, metalness: .92, envMapIntensity: 1.25, transparent: true, opacity: .96, depthWrite: false, side: THREE.DoubleSide, vertexColors: true }),
    led: S({ color: 0xc19558, roughness: .4, metalness: .5, emissive: 0xffc46b, emissiveIntensity: 0 }),
    steel: S({ color: 0x8d949c, roughness: .4, metalness: .75 }),
    dark: S({ color: 0x24272c, roughness: .6, metalness: .2 }),
    floor: S({ color: 0xc8a57a, roughness: .7 }),
    inner: S({ color: 0xf1ece4, roughness: .9 }),
    sofa: S({ color: 0x1f3a30, roughness: .9 }),
    fabric: S({ color: 0xd9c3ae, roughness: .95 }),
    green: S({ color: 0x6f8a6b, roughness: .8 }),
    wood: S({ color: 0xb58858, roughness: .65 }),
    white: S({ color: 0xfbfaf7, roughness: .6 }),
    black: S({ color: 0x17181b, roughness: .7 }),
    stone: S({ color: 0xbdb8ae, roughness: .9 }),
    line: new THREE.LineBasicMaterial({ color: 0xe9dcc2, transparent: true, opacity: 0, depthWrite: false }),
    lineGold: new THREE.LineBasicMaterial({ color: 0xd4a24c, transparent: true, opacity: 0, depthWrite: false }),
  };
}

/* ---------- vegetație stilizată ---------- */
export function tree(kind = 0, s = 1, mats = {}) {
  const g = new THREE.Group();
  const trunkM = mats.trunk || new THREE.MeshStandardMaterial({ color: 0x8a7a6a, roughness: .9 });
  const leafM = mats.leaf || new THREE.MeshStandardMaterial({ color: 0xdedbd2, roughness: .95, flatShading: true });
  const tr = new THREE.Mesh(new THREE.CylinderGeometry(.06 * s, .1 * s, 1.5 * s, 6), trunkM); tr.position.y = .75 * s; tr.castShadow = true; g.add(tr);
  if (kind === 1) { // conifer
    for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry((1.15 - i * .28) * s, 1.5 * s, 7), leafM); c.position.y = (1.6 + i * .95) * s; c.castShadow = true; g.add(c); }
  } else { // foios
    const a = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15 * s, 1), leafM); a.position.y = 2.35 * s; a.scale.y = 1.05; a.castShadow = true; g.add(a);
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(.75 * s, 1), leafM); b.position.set(.7 * s, 1.95 * s, .25 * s); b.castShadow = true; g.add(b);
  }
  return g;
}

// textură mică desenată local: pavaj „în spic”, ca în curtea showroom-ului
export function pavingTexture(base = '#d9d4ca', line = 'rgba(60,50,40,.16)') {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  x.fillStyle = base; x.fillRect(0, 0, 256, 256); x.strokeStyle = line; x.lineWidth = 2;
  const u = 32; for (let j = -1; j < 9; j++) for (let i = -1; i < 9; i++) { const ox = i * u * 2 + (j % 2 ? u : 0), oy = j * u; x.strokeRect(ox, oy, u * 2, u); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

// pată moale (umbră de contact, lumină pe sol)
export function blobTexture(inner = 'rgba(0,0,0,.55)', outer = 'rgba(0,0,0,0)') {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 4, 64, 64, 64); g.addColorStop(0, inner); g.addColorStop(1, outer); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* ---------- lumina zilei: chei pe ore, amestecate lin ---------- */
const C = h => new THREE.Color(h);
export const DAY = [
  // t (ore), top/bot = fundalul paginii, az/el = soarele (grade), sc/si = culoarea și tăria soarelui, hs/hg/hi = lumina cerului, ex = expunere, n = noapte (0…1), gl = culoarea geamului
  { t: 6.5, top: '#f0e9dd', bot: '#ddd3c3', az: -62, el: 14, sc: '#ffd0a0', si: 2.7, hs: '#fff3e6', hg: '#c9bba9', hi: .62, ex: 1.0, n: 0, gl: '#7d93a8' },
  { t: 9.2, top: '#eaeceb', bot: '#d8dad6', az: -40, el: 36, sc: '#fff0db', si: 3.5, hs: '#f2f7ff', hg: '#c4bfb4', hi: .66, ex: 1.0, n: 0, gl: '#3f6fa3' },
  { t: 12.5, top: '#cddff1', bot: '#e6ebee', az: 10, el: 60, sc: '#ffffff', si: 3.7, hs: '#e6f1ff', hg: '#c9c4b7', hi: .7, ex: 1.0, n: 0, gl: '#2a66b3' },
  { t: 17.6, top: '#f0a988', bot: '#f5d9c4', az: 58, el: 15, sc: '#ffab6b', si: 3.3, hs: '#ffdcc0', hg: '#c09a80', hi: .55, ex: 1.0, n: .12, gl: '#c98562' },
  { t: 19.4, top: '#2d2a55', bot: '#d9825e', az: 74, el: 3, sc: '#ff8552', si: 1.0, hs: '#8d86b8', hg: '#5a4040', hi: .42, ex: 1.05, n: .72, gl: '#463c58' },
  { t: 21.2, top: '#050914', bot: '#0c1326', az: 110, el: 30, sc: '#93a8ff', si: .5, hs: '#27325a', hg: '#090c15', hi: .34, ex: 1.1, n: 1, gl: '#101827' },
].map(k => ({ ...k, top: C(k.top), bot: C(k.bot), sc: C(k.sc), hs: C(k.hs), hg: C(k.hg), gl: C(k.gl) }));

export function dayAt(t, out = {}) {
  const K = DAY; let i = 0; while (i < K.length - 2 && t > K[i + 1].t) i++;
  const a = K[i], b = K[i + 1], f = clamp((t - a.t) / (b.t - a.t)), g = f * f * (3 - 2 * f);
  for (const k of ['top', 'bot', 'sc', 'hs', 'hg', 'gl']) (out[k] || (out[k] = new THREE.Color())).copy(a[k]).lerp(b[k], g);
  for (const k of ['az', 'el', 'si', 'hi', 'ex', 'n']) out[k] = lerp(a[k], b[k], g);
  out.t = t; return out;
}
export const clock = t => { const h = Math.floor(t), m = Math.round((t - h) * 60 / 5) * 5; return String(h + (m === 60 ? 1 : 0)).padStart(2, '0') + ':' + String(m === 60 ? 0 : m).padStart(2, '0'); };
