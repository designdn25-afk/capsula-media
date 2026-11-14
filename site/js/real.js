// Unelte pentru aspectul „real” al grădinii cu case (js/gscene.js + js/genv.js). Nimic de pe alte site-uri: toate texturile se desenează
// aici, pe canvas, o singură dată la pornire.
//   textures()            texturile: iarbă, frunze, flori, lemn, scânduri, dale, piatră, țesătură, scoarță de pin, zgomot
//   triplanar(mat, o)     pune o textură pe un material fără coordonate UV (după poziție, în metri); merge și pe copiile făcute de F.fadeSet
//   realMaterials(M, T)   materialele comune ale caselor: lemn, pardoseală, lambriu, piatră, textile, pereți, geam LOW-E
//   lawnMaterial(T)       gazonul
//   makeSky / makeEnv     cerul (gradient, soare, nori, stele) și reflexiile luate din el
//   Cards / Solid         geometrie: „cartonașe” cu frunze și piese pline adunate într-o singură plasă
//   treeGeo(kind, seed)   copaci, tufe și smocuri din cartonașe cu frunze
import { THREE, clamp, lerp, smooth } from './kit.js';

const TAU = Math.PI * 2;
export const rng = (s = 1) => () => (s = (s * 16807) % 2147483647) / 2147483647;
const cv = (w, h = w, read = false) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d', read ? { willReadFrequently: true } : undefined)]; };   // read = pixelii se citesc înapoi (texturile cu transparență)
const css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

/* =====================================================================================================================
   TEXTURI
   ===================================================================================================================== */
// rețea mică de valori la întâmplare; întinsă peste tot canvasul (cu netezire) dă „zgomot” moale care se repetă fără cusături
function lattice(nx, ny, r, lo, hi, mono) {
  const [c, x] = cv(nx, ny), im = x.createImageData(nx, ny), d = im.data, k = hi - lo;
  for (let i = 0; i < d.length; i += 4) { const v = lo + k * r(); d[i] = v; d[i + 1] = mono ? v : lo + k * r(); d[i + 2] = mono ? v : lo + k * r(); d[i + 3] = 255; }
  x.putImageData(im, 0, 0); return c;
}
function noise(x, W, H, nx, ny, r, { a = 1, op = 'source-over', lo = 0, hi = 255, mono = true } = {}) {
  const p = x.createPattern(lattice(nx, ny, r, lo, hi, mono), 'repeat'); p.setTransform(new DOMMatrix([W / nx, 0, 0, H / ny, 0, 0]));
  x.save(); x.globalAlpha = a; x.globalCompositeOperation = op; x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.fillStyle = p; x.fillRect(0, 0, W, H); x.restore();
}
// desenează o formă și copiile ei de peste margini, ca textura să se repete fără cusături
function wrapDraw(x, W, px, py, rad, fn) {
  const xs = px < rad ? [0, W] : px > W - rad ? [0, -W] : [0], ys = py < rad ? [0, W] : py > W - rad ? [0, -W] : [0];
  for (const ox of xs) for (const oy of ys) { x.save(); x.translate(px + ox, py + oy); fn(); x.restore(); }
}
function toTex(c, { srgb = true, aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; return t;
}
// textură cu transparență (frunze, flori): zonele goale primesc culoarea medie, ca marginile să nu iasă întunecate
function alphaTex(c, fill, gain = 1.8) {
  const W = c.width, H = c.height, d = c.getContext('2d').getImageData(0, 0, W, H).data;
  for (let i = 0; i < d.length; i += 4) { const a = d[i + 3]; if (a < 12) { d[i] = fill[0]; d[i + 1] = fill[1]; d[i + 2] = fill[2]; d[i + 3] = 0; } else d[i + 3] = Math.min(255, a * gain); }
  const t = new THREE.DataTexture(new Uint8Array(d.buffer), W, H, THREE.RGBAFormat); t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 4; t.needsUpdate = true; return t;
}

function noiseCanvas() {   // trei canale independente, mai multe octave (nori, variația gazonului, tencuială)
  const W = 256, [c, x] = cv(W), r = rng(3);
  [[4, 1], [8, 1 / 3], [16, 1 / 7], [32, 1 / 15], [64, 1 / 31]].forEach(([n, a]) => noise(x, W, W, n, n, r, { a, mono: false }));
  return c;
}

function grassCanvas() {
  const W = 512, [c, x] = cv(W), r = rng(5);
  x.fillStyle = '#5b7838'; x.fillRect(0, 0, W, W);
  noise(x, W, W, 9, 9, r, { a: .14, op: 'overlay' }); noise(x, W, W, 37, 37, r, { a: .22, op: 'overlay' }); noise(x, W, W, 128, 128, r, { a: .22, op: 'overlay' });
  const pal = [[66, 92, 40], [74, 102, 44], [84, 112, 48], [94, 122, 54], [104, 132, 60], [116, 142, 68], [72, 96, 46], [58, 80, 38], [130, 146, 78]];
  x.lineCap = 'round';
  for (let i = 0; i < 7000; i++) {
    const px = r() * W, py = r() * W, a = r() * TAU, l = 4 + r() * 9, dx = Math.cos(a) * l, dy = Math.sin(a) * l;
    x.strokeStyle = css(pal[(r() * pal.length) | 0], .3 + r() * .5); x.lineWidth = .8 + r() * 1.3;
    wrapDraw(x, W, px, py, 14, () => { x.beginPath(); x.moveTo(0, 0); x.lineTo(dx, dy); x.stroke(); });
  }
  return c;
}

function leafPath(x, l, w) { x.beginPath(); x.moveTo(0, l / 2); x.quadraticCurveTo(w, l * .1, 0, -l / 2); x.quadraticCurveTo(-w, l * .1, 0, l / 2); }
function drawLeaf(x, r, l, col) {
  const w = l * (.5 + .2 * r());
  x.fillStyle = css(col); leafPath(x, l, w); x.fill();
  x.fillStyle = css(mix3(col, [255, 255, 190], .13)); x.beginPath(); x.moveTo(0, l / 2); x.quadraticCurveTo(w, l * .1, 0, -l / 2); x.closePath(); x.fill();
  x.strokeStyle = css(mix3(col, [16, 26, 8], .5), .7); x.lineWidth = .9; x.beginPath(); x.moveTo(0, l / 2); x.lineTo(0, -l / 2); x.stroke();
}
// mănunchi de frunze pe fond transparent (un „cartonaș” din coroana unui copac / dintr-o tufă)
function leafCanvas(seed, { n = 86, len = [24, 38], dark = [36, 62, 28], mid = [74, 114, 46], light = [124, 158, 68], spread = .37 } = {}) {
  const W = 256, [c, x] = cv(W, W, true), r = rng(seed); x.lineCap = 'round';
  x.strokeStyle = 'rgba(60,46,32,.9)'; x.lineWidth = 2;
  for (let i = 0; i < 5; i++) { const a = r() * TAU, l = W * (.16 + .2 * r()); x.beginPath(); x.moveTo(W / 2, W / 2); x.quadraticCurveTo(W / 2 + Math.cos(a + .5) * l * .5, W / 2 + Math.sin(a + .5) * l * .5, W / 2 + Math.cos(a) * l, W / 2 + Math.sin(a) * l); x.stroke(); }
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), a = r() * TAU, d = Math.pow(r(), .6) * spread * W, l = lerp(len[0], len[1], r());
    const col = t < .5 ? mix3(dark, mid, t * 2 * (.55 + .45 * r())) : mix3(mid, light, (t - .5) * 2 * r());
    x.save(); x.translate(W / 2 + Math.cos(a) * d, W / 2 + Math.sin(a) * d); x.rotate(r() * TAU); drawLeaf(x, r, l, col); x.restore();
  }
  return c;
}
// frunziș des, fără goluri (corpul gardului viu, miezul tufelor)
function hedgeCanvas() {
  const W = 256, [c, x] = cv(W), r = rng(17);
  x.fillStyle = '#18240f'; x.fillRect(0, 0, W, W);
  for (let i = 0; i < 620; i++) {
    const t = i / 620, px = r() * W, py = r() * W, a = r() * TAU, l = 13 + r() * 9, col = mix3([26, 44, 20], [92, 128, 54], t * t * (.4 + .6 * r()));
    wrapDraw(x, W, px, py, 16, () => { x.rotate(a); drawLeaf(x, r, l, col); });
  }
  return c;
}
// rămurică de conifer; vârful e sus (v = 0)
function sprayCanvas() {
  const W = 256, [c, x] = cv(W, W, true), r = rng(29), pal = [[20, 40, 24], [28, 54, 30], [38, 68, 36], [50, 84, 42], [66, 100, 50]]; x.lineCap = 'round';
  const needles = (x0, y0, x1, y1, k) => {
    const L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L, an = Math.atan2(uy, ux);
    for (let s = 0; s < L; s += 2.4) for (const sd of [-1, 1]) { const a = an + sd * (.7 + .55 * r()), l = (6 + 6 * r()) * k, px = x0 + ux * s, py = y0 + uy * s; x.strokeStyle = css(pal[(r() * pal.length) | 0], .96); x.lineWidth = 1.5 + r(); x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); }
  };
  for (let y = 238; y > 40; y -= 13 + 5 * r()) for (const sd of [-1, 1]) {
    const L = (14 + (y - 30) * .44) * (.8 + .3 * r()), a = -Math.PI / 2 + sd * (.95 + .25 * r()), y0 = y + 6 * r(), x1 = 128 + Math.cos(a) * L, y1 = y0 + Math.sin(a) * L;
    x.strokeStyle = 'rgba(50,38,26,.9)'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(128, y0); x.lineTo(x1, y1); x.stroke(); needles(128, y0, x1, y1, 1);
  }
  x.strokeStyle = 'rgba(50,38,26,.95)'; x.lineWidth = 2.4; x.beginPath(); x.moveTo(128, 250); x.lineTo(128, 16); x.stroke(); needles(128, 250, 128, 12, .9);
  return c;
}
// patru feluri de flori, albe (culoarea o dă fiecare strat): margarete · spice (lavandă, salvie) · trandafiri / bujori · flori mărunte
function flowersCanvas() {
  const W = 512, [c, x] = cv(W, W, true), r = rng(23), g = (lo = 212, hi = 255) => { const v = lo + r() * (hi - lo); return css([v, v, v]); };
  const spots = (n, m, ox, oy, min) => { const P = []; let k = 0; while (P.length < n && k++ < 4000) { const px = ox + m + r() * (256 - 2 * m), py = oy + m + r() * (256 - 2 * m); if (P.every(q => Math.hypot(q[0] - px, q[1] - py) > min)) P.push([px, py]); } return P; };
  spots(10, 30, 0, 0, 54).forEach(([px, py]) => {
    const R = 21 + 8 * r(), n = 11 + ((r() * 4) | 0); x.save(); x.translate(px, py); x.rotate(r() * TAU);
    for (let i = 0; i < n; i++) { x.save(); x.rotate(i / n * TAU); x.fillStyle = g(); x.beginPath(); x.ellipse(0, -R / 2, R * .17, R / 2, 0, 0, TAU); x.fill(); x.restore(); }
    x.fillStyle = 'rgb(150,112,46)'; x.beginPath(); x.arc(0, 0, R * .24, 0, TAU); x.fill(); x.fillStyle = 'rgba(90,60,20,.5)'; x.beginPath(); x.arc(0, 0, R * .12, 0, TAU); x.fill(); x.restore();
  });
  for (let i = 0; i < 8; i++) {
    const px = 256 + 22 + i * 30 + (r() - .5) * 10, top = 14 + r() * 40, lean = (r() - .5) * 14;
    x.strokeStyle = 'rgb(86,104,70)'; x.lineWidth = 2; x.beginPath(); x.moveTo(px, 254); x.lineTo(px + lean, top + 6); x.stroke();
    for (let y = top; y < 150; y += 4.2) { const k = clamp((y - top) / 26, .35, 1), cx = px + lean * (1 - (y - top) / (254 - top)) + (r() - .5) * 9 * k; x.fillStyle = g(196); x.beginPath(); x.ellipse(cx, y, 4.6 * k, 3.6, r() * 3, 0, TAU); x.fill(); }
  }
  spots(6, 40, 0, 256, 74).forEach(([px, py]) => {
    const R = 30 + 8 * r(); x.save(); x.translate(px, py); x.rotate(r() * TAU);
    for (let k = 0; k < 4; k++) { const rr = R * (1 - k * .24), n = 7 - k; for (let i = 0; i < n; i++) { const a = i / n * TAU + k * .5; x.fillStyle = g(205 + k * 6, 240 + k * 5); x.strokeStyle = 'rgba(96,96,96,.5)'; x.lineWidth = 1.2; x.beginPath(); x.arc(Math.cos(a) * rr * .56, Math.sin(a) * rr * .56, rr * .46, 0, TAU); x.fill(); x.stroke(); } }
    x.fillStyle = 'rgb(206,206,206)'; x.beginPath(); x.arc(0, 0, R * .13, 0, TAU); x.fill(); x.restore();
  });
  spots(44, 13, 256, 256, 24).forEach(([px, py]) => {
    const R = 8 + 3.5 * r(); x.save(); x.translate(px, py); x.rotate(r() * TAU);
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; x.fillStyle = g(); x.beginPath(); x.arc(Math.cos(a) * R * .58, Math.sin(a) * R * .58, R * .5, 0, TAU); x.fill(); }
    x.fillStyle = 'rgb(170,150,90)'; x.beginPath(); x.arc(0, 0, R * .24, 0, TAU); x.fill(); x.restore();
  });
  return c;
}

// lemn (fibra pe orizontală), în tonuri neutre: culoarea o dă materialul
function woodCanvas() {
  const W = 512, [c, x] = cv(W), r = rng(31);
  x.fillStyle = '#cfcbc6'; x.fillRect(0, 0, W, W);
  noise(x, W, W, 2, 22, r, { a: .5, op: 'overlay' }); noise(x, W, W, 5, 128, r, { a: .5, op: 'overlay' }); noise(x, W, W, 12, 512, r, { a: .32, op: 'overlay' });
  noise(x, W, W, 3, 3, r, { a: .1, op: 'overlay', mono: false });
  x.lineCap = 'round';
  for (let i = 0; i < 150; i++) {
    const y = r() * W, x0 = r() * W, l = 60 + r() * 300, a = (r() - .5) * 5, b = (r() - .5) * 5, e = (r() - .5) * 3;
    x.strokeStyle = r() < .7 ? `rgba(70,48,28,${.06 + .16 * r()})` : `rgba(255,250,240,${.05 + .1 * r()})`; x.lineWidth = .6 + r() * 1.4;
    for (const o of [0, -W]) { x.beginPath(); x.moveTo(x0 + o, y); x.bezierCurveTo(x0 + o + l * .3, y + a, x0 + o + l * .7, y + b, x0 + o + l, y + e); x.stroke(); }
  }
  return c;
}
// scânduri cu rosturi (pardoseală, lambriu), tăiate din textura de lemn
function planksCanvas(wood, rows, seed) {
  const W = 512, [c, x] = cv(W), r = rng(seed), h = W / rows, pat = x.createPattern(wood, 'repeat'), J = 'rgba(26,19,13,.82)';
  for (let j = 0; j < rows; j++) {
    const y = j * h, t = r();
    pat.setTransform(new DOMMatrix([1, 0, 0, 1, (r() * W) | 0, (r() * W) | 0])); x.fillStyle = pat; x.fillRect(0, y, W, h);
    x.fillStyle = t < .5 ? `rgba(40,26,14,${.24 * (1 - t * 2)})` : `rgba(255,246,230,${.15 * (t * 2 - 1)})`; x.fillRect(0, y, W, h);
    x.fillStyle = J; x.fillRect(0, y, W, 2); x.fillStyle = 'rgba(255,255,255,.1)'; x.fillRect(0, y + 2, W, 1);
    const b = r() * W; [b, (b + W / 2 + (r() - .5) * 90) % W].forEach(bx => { x.fillStyle = J; x.fillRect(bx | 0, y, 2, h); });
  }
  return c;
}
// dale mari de beton, cu rosturi (platformele de sub case, rondul)
function paversCanvas() {
  const W = 512, [c, x] = cv(W), r = rng(41), n = 4, s = W / n, J = '#5d5953';
  x.fillStyle = '#b4b0a8'; x.fillRect(0, 0, W, W);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const t = r(), px = i * s + (j % 2 ? s / 2 : 0); x.fillStyle = t < .5 ? `rgba(60,55,48,${.17 * (1 - 2 * t)})` : `rgba(255,252,244,${.15 * (2 * t - 1)})`; x.fillRect(px, j * s, s, s); if (px + s > W) x.fillRect(px - W, j * s, s, s); }
  noise(x, W, W, 7, 7, r, { a: .2, op: 'overlay' }); noise(x, W, W, 128, 128, r, { a: .24, op: 'overlay' }); noise(x, W, W, 256, 256, r, { a: .2, op: 'overlay' });
  for (let j = 0; j < n; j++) {
    x.fillStyle = J; x.fillRect(0, j * s, W, 3); x.fillStyle = 'rgba(255,255,255,.16)'; x.fillRect(0, j * s + 3, W, 1);
    for (let i = 0; i < n; i++) { const px = (i * s + (j % 2 ? s / 2 : 0)) % W; x.fillStyle = J; x.fillRect(px, j * s, 3, s); x.fillStyle = 'rgba(255,255,255,.14)'; x.fillRect(px + 3, j * s + 3, 1, s - 3); }
  }
  return c;
}
// piatră / beton pătat, neutru
function stoneCanvas() {
  const W = 256, [c, x] = cv(W), r = rng(47);
  x.fillStyle = '#c9c7c2'; x.fillRect(0, 0, W, W);
  noise(x, W, W, 3, 3, r, { a: .4, op: 'overlay' }); noise(x, W, W, 9, 9, r, { a: .4, op: 'overlay' }); noise(x, W, W, 40, 40, r, { a: .35, op: 'overlay' }); noise(x, W, W, 256, 256, r, { a: .22, op: 'overlay' });
  noise(x, W, W, 4, 4, r, { a: .07, op: 'overlay', mono: false });
  return c;
}
// zid din piatră așezată în rânduri
function ledgerCanvas() {
  const W = 512, [c, x] = cv(W), r = rng(53), hs = [56, 72, 48, 80, 64, 72, 56, 64], pal = [[198, 192, 182], [174, 168, 158], [214, 208, 198], [152, 146, 138], [186, 178, 166], [138, 132, 126], [206, 198, 184]];
  x.fillStyle = '#3d3a36'; x.fillRect(0, 0, W, W); let y = 0;
  hs.forEach(h => {
    const ws = []; let tot = 0; while (tot < W) { const w = 60 + r() * 130; ws.push(w); tot += w; } let px = r() * W;
    ws.forEach(w0 => { const w = w0 * W / tot, col = pal[(r() * pal.length) | 0], g = x.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, css(mix3(col, [255, 255, 255], .14))); g.addColorStop(.7, css(col)); g.addColorStop(1, css(mix3(col, [0, 0, 0], .3)));
      x.fillStyle = g; for (const o of [0, -W]) x.fillRect(px + o + 2, y + 2, w - 4, h - 4); px = (px + w) % W; });
    y += h;
  });
  noise(x, W, W, 12, 12, r, { a: .28, op: 'overlay' }); noise(x, W, W, 128, 128, r, { a: .28, op: 'overlay' });
  return c;
}
// țesătură
function weaveCanvas() {
  const W = 128, [c, x] = cv(W), r = rng(61), n = 16, s = W / n; x.fillStyle = '#bdbdbd'; x.fillRect(0, 0, W, W);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const hz = (i + j) % 2 === 0, v = (hz ? 226 : 192) + (r() - .5) * 26; x.fillStyle = css([v, v, v]); if (hz) x.fillRect(i * s, j * s + 1, s, s - 2); else x.fillRect(i * s + 1, j * s, s - 2, s); }
  return c;
}
// mulci din scoarță (pământul din straturile cu flori)
function mulchCanvas() {
  const W = 256, [c, x] = cv(W), r = rng(67), pal = [[70, 50, 36], [86, 62, 44], [50, 36, 26], [100, 74, 52], [40, 29, 21], [80, 60, 44], [112, 86, 62]];
  x.fillStyle = '#35271c'; x.fillRect(0, 0, W, W);
  for (let i = 0; i < 1000; i++) { const px = r() * W, py = r() * W, a = r() * TAU, w = 5 + r() * 9, h = 2.5 + r() * 3.5, col = pal[(r() * pal.length) | 0]; wrapDraw(x, W, px, py, 12, () => { x.rotate(a); x.fillStyle = css(col); x.fillRect(-w / 2, -h / 2, w, h); x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(-w / 2, h / 2 - 1, w, 1); }); }
  return c;
}
// umbră moale sub o casă (dreptunghi cu margini estompate); m = cât iese în afara casei, în metri
export function softRectTexture(w, d, m = 1.2) {
  const k = 128 / Math.max(w + 2 * m, d + 2 * m), W = Math.round((w + 2 * m) * k), H = Math.round((d + 2 * m) * k), [c, x] = cv(W, H), e = m * k;
  x.shadowColor = '#000'; x.shadowBlur = e * .9; x.shadowOffsetX = W * 2; x.fillStyle = '#000';
  for (let i = 0; i < 2; i++) x.fillRect(-W * 2 + e * .8, e * .8, W - e * 1.6, H - e * 1.6);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function blobTexture(stops) {   // pată rotundă moale: [[poziție, 'culoare'], …]
  const [c, x] = cv(128), g = x.createRadialGradient(64, 64, 0, 64, 64, 64); stops.forEach(s => g.addColorStop(s[0], s[1])); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

let TEX = null;
export function textures() {
  if (TEX) return TEX;
  const t0 = performance.now(), wood = woodCanvas();
  TEX = {
    noise: toTex(noiseCanvas(), { srgb: false, aniso: 2 }), grass: toTex(grassCanvas(), { aniso: 16 }),
    leaf: alphaTex(leafCanvas(11, { n: 104, spread: .385 }), [62, 98, 40], 2.6), leafS: alphaTex(leafCanvas(13, { n: 170, len: [15, 24], spread: .41 }), [62, 98, 40], 2.6), spray: alphaTex(sprayCanvas(), [34, 62, 34], 2.4),
    hedge: toTex(hedgeCanvas()), flowers: alphaTex(flowersCanvas(), [226, 226, 226], 2.2),
    wood: toTex(wood), planks: toTex(planksCanvas(wood, 8, 37)), pavers: toTex(paversCanvas(), { aniso: 16 }), stone: toTex(stoneCanvas()), ledger: toTex(ledgerCanvas()), weave: toTex(weaveCanvas(), { aniso: 4 }), mulch: toTex(mulchCanvas()),
  };
  textures.ms = performance.now() - t0;   // cât a durat desenarea (pentru verificare)
  return TEX;
}

/* =====================================================================================================================
   MATERIALE
   ===================================================================================================================== */
// Textură pe un material fără UV: proiectată pe cele trei axe, după poziția punctului (în metri).
//   map     textura;  scale = câți metri acoperă o repetare (număr sau [pe lung, pe lat])
//   space   'local' = în sistemul obiectului (scândurile urmează casa, oricum ar fi ea rotită) sau 'world'
//   gain    cu cât se înmulțește culoarea;  amt = cât din textură se vede (1 = toată, 0 = deloc; rămâne doar la luciu)
//   rough   cât schimbă textura luciul;  bump = relief fals;  emis = textura se vede și pe lumina proprie (pardoseala, seara)
//   vert    scândurile stau în picioare pe pereți
export function triplanar(mat, { map, scale = 1, space = 'local', gain = 1, amt = 1, rough = 0, bump = 0, emis = 0, vert = false } = {}) {
  const s = Array.isArray(scale) ? scale : [scale, scale];
  const U = { tpMap: { value: map }, tpS: { value: new THREE.Vector4(1 / s[0], 1 / s[1], gain, amt) }, tpF: { value: new THREE.Vector3(rough, bump, emis) } };
  const key = 'tp-' + space + (rough ? 'r' : '') + (bump ? 'b' : '') + (emis ? 'e' : '') + (vert ? 'v' : '');
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vTpP;\nvarying vec3 vTpN;').replace('#include <begin_vertex>', `#include <begin_vertex>
      vec4 tpP = vec4( transformed, 1.0 ); vec3 tpN = objectNormal;
      #ifdef USE_INSTANCING
        tpP = instanceMatrix * tpP; tpN = mat3( instanceMatrix ) * tpN;
      #endif
      ${space === 'world' ? 'tpP = modelMatrix * tpP; tpN = mat3( modelMatrix ) * tpN;' : ''}
      vTpP = tpP.xyz; vTpN = tpN;`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      uniform sampler2D tpMap; uniform vec4 tpS; uniform vec3 tpF; varying vec3 vTpP; varying vec3 vTpN;
      vec3 tpBump( vec3 pos, vec3 nrm, float h, float fd ) {
        vec2 dH = vec2( dFdx( h ), dFdy( h ) ); vec3 sx = dFdx( pos ), sy = dFdy( pos ), r1 = cross( sy, nrm ), r2 = cross( nrm, sx );
        float det = dot( sx, r1 ) * fd; vec3 gr = sign( det ) * ( dH.x * r1 + dH.y * r2 ); return normalize( abs( det ) * nrm - gr );
      }`)
      .replace('#include <map_fragment>', `#include <map_fragment>
      vec3 tpW = abs( normalize( vTpN ) ); tpW = tpW * tpW; tpW = tpW * tpW; tpW /= ( tpW.x + tpW.y + tpW.z );
      vec3 tpC = texture2D( tpMap, vTpP.${vert ? 'yz' : 'zy'} * tpS.xy ).rgb * tpW.x + texture2D( tpMap, vTpP.xz * tpS.xy ).rgb * tpW.y + texture2D( tpMap, vTpP.${vert ? 'yx' : 'xy'} * tpS.xy ).rgb * tpW.z;
      float tpL = dot( tpC, vec3( .3333 ) );
      diffuseColor.rgb *= mix( vec3( 1.0 ), tpC * tpS.z, tpS.w );`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = clamp( roughnessFactor + ( .5 - tpL ) * tpF.x, .05, 1.0 );')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' + (bump ? 'normal = tpBump( - vViewPosition, normal, tpL * tpF.y, faceDirection );' : ''))
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + (emis ? 'totalEmissiveRadiance *= mix( vec3( 1.0 ), tpC * tpS.z, tpF.z );' : ''));
  };
  mat.customProgramCacheKey = () => key; mat.needsUpdate = true; return mat;
}

// geamul: valori comune tuturor geamurilor (și copiilor lor). base = opacitatea „de zi” a geamului întreg, inside = 1 când privitorul e în casă
export const GLASS = { base: { value: .5 }, inside: { value: 0 } };
// Geam LOW-E: reflectă cerul (mai tare când e privit pieziș), lasă să se vadă puțin interiorul; din casă se vede prin el grădina.
export function glassMaterial() {
  const m = new THREE.MeshStandardMaterial({ color: 0x7d8c98, metalness: 1, roughness: .04, envMapIntensity: 1.1, transparent: true, premultipliedAlpha: true, opacity: .5, depthWrite: false, side: THREE.DoubleSide });
  m.onBeforeCompile = sh => {
    sh.uniforms.gBase = GLASS.base; sh.uniforms.gIn = GLASS.inside;
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float gBase; uniform float gIn;')
      .replace('#include <opaque_fragment>', `float gK = clamp( opacity / max( gBase, .001 ), 0.0, 1.0 );   // copiile care se sting odată cu acoperișul
      float gFr = pow( 1.0 - abs( dot( normalize( vViewPosition ), normal ) ), 4.0 );
      outgoingLight *= gK * mix( 1.0, .03, gIn ); diffuseColor.a = mix( gBase, 1.0, gFr * .55 ) * gK * mix( 1.0, .2, gIn );
      #include <opaque_fragment>`)
      .replace('#include <premultiplied_alpha_fragment>', '');   // reflexia se adună întreagă peste ce se vede prin geam
  };
  m.customProgramCacheKey = () => 'lowe'; return m;
}

// Materialele care își iau reflexiile direct din cer, fiecare cu tăria lui (celelalte folosesc scene.environmentIntensity). gscene.js le dă textura.
export const ENVMAPPED = ['glass', 'skyglass', 'frame', 'inner', 'ceil', 'floor'];
// Materialele comune ale caselor (M din kit.materials + x7Materials + houseMaterials), făcute să arate a materiale adevărate.
export function realMaterials(M, T) {
  const tp = triplanar;
  tp(M.wood, { map: T.wood, scale: [1.7, 1.7], gain: 1.24, amt: .85, rough: .3, bump: .01, emis: 1 });                    // terase, blaturi, mobilă
  tp(M.floor, { map: T.planks, scale: [2.6, 1.52], gain: 1.3, rough: .3, emis: 1 });                    // parchet (scânduri de 19 cm)
  tp(M.clad, { map: T.planks, scale: [2.2, .88], gain: 1.28, rough: .25, bump: .01, emis: 1 });                  // lambriu pe fațadă
  tp(M.stone, { map: T.stone, scale: 1.3, gain: 1.24, rough: .25 });
  tp(M.stoneWall, { map: T.ledger, scale: [1.5, 1.5], gain: 1.4, rough: .3, bump: .02 });
  tp(M.fabric, { map: T.weave, scale: .11, gain: 1.2, emis: 1 }); tp(M.sofa, { map: T.weave, scale: .11, gain: 1.2, emis: 1 });
  tp(M.inner, { map: T.stone, scale: 2.1, gain: 1.24, amt: .32 }); tp(M.ceil, { map: T.stone, scale: 2.1, gain: 1.24, amt: .25 });   // tencuială: abia se simte
  [M.shell, M.roof].forEach(m => tp(m, { map: T.stone, scale: 3.1, gain: 1.24, amt: .1, rough: .5 }));   // panourile albe rămân curate: doar luciul variază puțin
  tp(M.steel, { map: T.stone, scale: .9, gain: 1.24, amt: .3, rough: .5 }); tp(M.roofDark, { map: T.stone, scale: 1.6, gain: 1.24, amt: .45, rough: .4 });
  M.wood.color.setHex(0xb08253); M.clad.color.setHex(0xa26b3c); M.floor.color.setHex(0xc9a67c);
  M.shell.roughness = M.roof.roughness = .42;
  M.glass = glassMaterial();
  M.skyglass.envMapIntensity = 1.0; M.skyglass.color.setHex(0x23384c); M.frame.envMapIntensity = .6;
  M.inner.envMapIntensity = .22; M.ceil.envMapIntensity = .1; M.floor.envMapIntensity = .3;   // interiorul ia doar puțină culoare din cer și din iarbă
  return M;
}

// Gazon: iarbă tunsă, cu variații la mai multe scări (nu se vede repetarea nici de la 150 m), dungi de tuns abia vizibile, umbră la baza gardului viu.
export function lawnMaterial(T) {
  const U = { lwG: { value: T.grass }, lwN: { value: T.noise }, lwH: { value: new THREE.Vector4(0, 0, 0, 0) }, lwR: { value: new THREE.Vector3(9, 1.13, 4.2) } };
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .95, metalness: 0 });
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vLw;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvLw = ( modelMatrix * vec4( transformed, 1.0 ) ).xz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      uniform sampler2D lwG; uniform sampler2D lwN; uniform vec4 lwH; uniform vec3 lwR; varying vec2 vLw;
      float lwBox( vec2 p, vec2 b, float r ) { vec2 q = abs( p ) - b + r; return length( max( q, 0.0 ) ) + min( max( q.x, q.y ), 0.0 ) - r; }`)
      .replace('#include <map_fragment>', `
      vec2 lq = vec2( vLw.x * .829 - vLw.y * .559, vLw.x * .559 + vLw.y * .829 );                      // același gazon, rotit: ascunde repetarea
      vec3 ln0 = texture2D( lwN, lq * .061 ).rgb, ln1 = texture2D( lwN, vLw * .0173 ).rgb, ln2 = texture2D( lwN, lq * .0041 + .21 ).rgb;
      vec3 lc = mix( texture2D( lwG, vLw * .41 ).rgb, texture2D( lwG, lq * .263 + .37 ).rgb, smoothstep( .38, .62, ln0.g ) );
      lc *= mix( 1.0, dot( texture2D( lwG, lq * 1.57 + .11 ).rgb, vec3( 3.0 ) ), .55 );                 // fire de iarbă, de aproape
      float lMac = smoothstep( .3, .7, ln1.r * .55 + ln2.g * .45 ), lDry = smoothstep( .4, .75, ln1.b * .5 + ln2.r * .5 );
      lc *= mix( .9, 1.08, ln0.r ) * mix( .86, 1.12, lMac ); lc = mix( lc, lc * vec3( 1.16, 1.05, .78 ), lDry * .45 );
      float lIn = 1.0, lAo = 1.0;
      if ( lwH.z > 0.0 ) {
        float dh = lwBox( vLw - lwH.xy, lwH.zw, lwR.x );
        lIn = smoothstep( .3, -.3, dh + lwR.y );
        lAo = 1.0 - .5 * ( 1.0 - smoothstep( 0.0, .95, abs( dh + lwR.y * .5 ) - lwR.y * .5 ) );
        lAo = mix( lAo, 1.0, step( lwH.y + lwH.w - 3.0, vLw.y ) * ( 1.0 - smoothstep( lwR.z - .5, lwR.z + .4, abs( vLw.x - lwH.x ) ) ) );
      }
      lc *= 1.0 + lIn * .045 * ( smoothstep( -.35, .35, sin( vLw.x * 2.3 + sin( vLw.y * .07 ) * .8 ) ) - .5 );   // dungile de la tuns, abia vizibile
      lc = mix( lc * vec3( 1.14, 1.03, .74 ) * mix( .74, 1.1, ln2.b * .6 + ln0.b * .4 ), lc, lIn );              // în afara gardului: fâneață, mai uscată
      diffuseColor.rgb *= lc * lAo;`);
  };
  mat.customProgramCacheKey = () => 'lawn';
  return { mat, U };
}

// Frunziș din „cartonașe”: lumina cade ca pe un volum (normalele nu se întorc pe dos), puțină lumină trece prin frunze.
export function leafMaterial(map, { color = 0xffffff, alphaTest = .32, trans = 1 } = {}) {
  const m = new THREE.MeshLambertMaterial({ map, color, alphaTest, side: THREE.DoubleSide, vertexColors: true });   // fără luciu: frunzele nu sclipesc și costă puțin
  m.onBeforeCompile = sh => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', 'float faceDirection = 1.0;\nvec3 normal = normalize( vNormal );\nvec3 nonPerturbedNormal = normal;')
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
      #if NUM_DIR_LIGHTS > 0
        reflectedLight.directDiffuse += directionalLights[ 0 ].color * diffuseColor.rgb * vec3( .34, .4, .1 ) * ( .25 + .75 * max( dot( - normal, directionalLights[ 0 ].direction ), 0.0 ) ) * ${(.22 * trans).toFixed(3)};
      #endif`);
  };
  m.customProgramCacheKey = () => 'leaf' + trans; return m;
}

/* =====================================================================================================================
   CER + REFLEXII
   ===================================================================================================================== */
// Bolta cerească: albastru adânc sus, ceață luminoasă la orizont, soare, nori moi; seara: apus cald; noaptea: stele.
// Nu depinde de planurile near / far ale camerei (se desenează „la infinit”). În modul env (pentru reflexii) are și pământ + o linie de copaci.
export function makeSky(noiseTex) {
  const C = h => ({ value: new THREE.Color(h) });
  const U = { uN: { value: noiseTex }, uZen: C(0x2f6ec4), uHor: C(0xc6dcf0), uFog: C(0xc9d8e2), uSunDir: { value: V(0, 1, 0) }, uSunCol: C(0xffffff), uGlow: C(0xffffff), uCl: C(0xffffff), uCs: C(0xa8b4c6),
    uGround: C(0x1a2a0c), uTree: C(0x0c1a08), uP: { value: new THREE.Vector4(.9, .5, 0, 0) } };   // uP = (cât de vizibili sunt norii, pragul lor, noapte, mod env)
  const mat = new THREE.ShaderMaterial({ uniforms: U, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vD;\nvoid main() { vD = position; vec4 p = projectionMatrix * vec4( mat3( viewMatrix ) * position, 1.0 ); gl_Position = p.xyww; }',
    fragmentShader: `uniform sampler2D uN; uniform vec3 uZen; uniform vec3 uHor; uniform vec3 uFog; uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uGlow; uniform vec3 uCl; uniform vec3 uCs; uniform vec3 uGround; uniform vec3 uTree; uniform vec4 uP;
      varying vec3 vD;
      float fbm( vec2 p ) { return texture2D( uN, p ).r * .5 + texture2D( uN, p * 2.13 + .31 ).g * .3 + texture2D( uN, p * 4.71 + .57 ).b * .2; }
      void main() {
        vec3 d = normalize( vD ); float y = d.y, h = clamp( y, 0.0, 1.0 ), k = pow( 1.0 - h, 4.5 );
        vec3 col = mix( uZen, uHor, k );
        float sd = max( dot( d, uSunDir ), 0.0 ), azk = max( dot( normalize( d.xz + 1e-5 ), normalize( uSunDir.xz + 1e-5 ) ), 0.0 );
        col += uGlow * ( pow( azk, 4.0 ) * k * .9 + pow( sd, 12.0 ) * .22 );
        float fade = smoothstep( .01, .2, y ) * uP.x;
        if ( fade > 0.001 ) {
          vec2 uv = d.xz / ( y + .16 ) * .085 + vec2( .13, .71 );
          float n = fbm( uv ), n2 = fbm( uv + uSunDir.xz * .028 );
          float c = smoothstep( uP.y, uP.y + .2, n ) * fade;
          col = mix( col, mix( uCs, uCl, clamp( .55 + ( n - n2 ) * 5.0, 0.0, 1.0 ) ), c );
        }
        col += uSunCol * ( pow( sd, 900.0 ) * 2.0 + smoothstep( .99955, .9998, sd ) * 30.0 * ( 1.0 - uP.w ) );
        if ( uP.z > .01 && uP.w < .5 ) {
          vec3 q = d * 150.0, c3 = floor( q ); float rn = fract( sin( dot( c3, vec3( 12.9898, 78.233, 37.719 ) ) ) * 43758.5453 );
          col += vec3( .9, .95, 1.0 ) * step( .9982, rn ) * smoothstep( .45, 0.0, length( fract( q ) - .5 ) ) * uP.z * smoothstep( .02, .25, y ) * ( .5 + rn * 250.0 - 249.5 );
        }
        float az = atan( d.z, d.x ) * .15915;
        float prof = .011 + .03 * texture2D( uN, vec2( az * 3.0, .37 ) ).r * texture2D( uN, vec2( az * 11.0, .61 ) ).g * 2.0;
        if ( uP.w > .5 ) {   // pentru reflexii: cer mai puțin albastru, pământ luminat (cu pete, ca o grădină), copaci și case în jur
          col = mix( vec3( dot( col, vec3( .25, .6, .15 ) ) ), col, .68 );
          prof = prof * 4.0 + .035;
          col = mix( col, uTree * ( .6 + .9 * texture2D( uN, vec2( az * 9.0, y * 2.0 ) ).b ), smoothstep( prof, prof - .02, y ) );
          vec2 gp = d.xz / max( - y, .04 );
          vec3 gnd = uGround * ( .5 + 1.1 * texture2D( uN, gp * .05 ).r ); gnd = mix( gnd, uGround.ggg * 2.6, smoothstep( .56, .6, texture2D( uN, gp * .021 + .4 ).g ) );
          col = mix( col, gnd, smoothstep( 0.0, -.03, y ) );
          col = mix( col, uGround.ggg * 3.4, smoothstep( .66, .7, texture2D( uN, vec2( az * 4.0, .13 ) ).b ) * smoothstep( -.1, -.08, y ) * smoothstep( .06, .04, y ) );
        }
        gl_FragColor = vec4( col, 1.0 );
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        if ( uP.w < .5 ) {   // orizontul se topește în culoarea ceții (aceeași cu a gazonului îndepărtat); peste el, o linie de copaci în zare
          gl_FragColor.rgb = mix( gl_FragColor.rgb, mix( uFog, vec3( 1.0 ), .3 ), smoothstep( .06, 0.0, y ) * .5 );
          gl_FragColor.rgb = mix( gl_FragColor.rgb, uFog * vec3( .8, .86, .9 ), smoothstep( prof, prof - .0035, y ) );
          gl_FragColor.rgb = mix( gl_FragColor.rgb, uFog, smoothstep( .003, -.002, y ) );
        }
      }` });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), mat); mesh.frustumCulled = false; mesh.renderOrder = 10; mesh.matrixAutoUpdate = false;
  return { mesh, U, mat };
}

// Reflexiile (scene.environment) luate din cer. update() se cheamă doar când ora s-a schimbat destul.
export function makeEnv(renderer, sky, size = 256) {
  const rt = new THREE.WebGLCubeRenderTarget(size, { type: THREE.HalfFloatType, generateMipmaps: false }), cam = new THREE.CubeCamera(.1, 10, rt);
  const sc = new THREE.Scene(), m = new THREE.Mesh(sky.mesh.geometry, sky.mat); m.frustumCulled = false; sc.add(m);
  const pm = new THREE.PMREMGenerator(renderer); let out = null;
  const env = { texture: null, update() { sky.U.uP.value.w = 1; cam.update(renderer, sc); sky.U.uP.value.w = 0; out = pm.fromCubemap(rt.texture, out || undefined); env.texture = out.texture; } };   // aceeași textură la fiecare refacere
  env.update(); return env;
}

/* =====================================================================================================================
   GEOMETRIE
   ===================================================================================================================== */
const UV = [0, 0, 1, 1];
// „cartonașe”: dreptunghiuri cu textură transparentă (frunze, flori), adunate într-o singură plasă
export class Cards {
  constructor() { this.p = []; this.n = []; this.u = []; this.c = []; this.i = []; }
  // c = centrul; ax, ay = axele (unitare) pe lățime și pe înălțime; n = normala pentru lumină; col = [r, g, b]; uv = [u0, v0, u1, v1]; foot = prins de marginea de jos
  add(c, ax, ay, w, h, n, col, uv = UV, foot = false) {
    const b = this.p.length / 3, hw = w / 2, y0 = foot ? 0 : -h / 2, y1 = foot ? h : h / 2, P = this.p;
    P.push(c.x - ax.x * hw + ay.x * y0, c.y - ax.y * hw + ay.y * y0, c.z - ax.z * hw + ay.z * y0, c.x + ax.x * hw + ay.x * y0, c.y + ax.y * hw + ay.y * y0, c.z + ax.z * hw + ay.z * y0,
      c.x + ax.x * hw + ay.x * y1, c.y + ax.y * hw + ay.y * y1, c.z + ax.z * hw + ay.z * y1, c.x - ax.x * hw + ay.x * y1, c.y - ax.y * hw + ay.y * y1, c.z - ax.z * hw + ay.z * y1);
    for (let k = 0; k < 4; k++) { this.n.push(n.x, n.y, n.z); this.c.push(col[0], col[1], col[2]); }
    this.u.push(uv[0], uv[1], uv[2], uv[1], uv[2], uv[3], uv[0], uv[3]); this.i.push(b, b + 1, b + 2, b, b + 2, b + 3); return this;
  }
  get count() { return this.i.length / 6; }
  geo() { return mkGeo(this.p, this.n, this.c, this.i, this.u); }
}
function mkGeo(p, n, c, i, u) {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
  if (u) g.setAttribute('uv', new THREE.Float32BufferAttribute(u, 2)); g.setIndex(i); return g;
}
// piese pline (cu culori pe vârfuri) adunate într-o singură plasă: un singur desen pentru tot
export class Solid {
  constructor() { this.p = []; this.n = []; this.c = []; this.i = []; }
  add(g, m, col = [1, 1, 1]) {
    const b = this.p.length / 3, P = g.attributes.position, N = g.attributes.normal, nm = new THREE.Matrix3().getNormalMatrix(m), v = V();
    for (let k = 0; k < P.count; k++) { v.fromBufferAttribute(P, k).applyMatrix4(m); this.p.push(v.x, v.y, v.z); v.fromBufferAttribute(N, k).applyMatrix3(nm).normalize(); this.n.push(v.x, v.y, v.z); const cc = typeof col === 'function' ? col(this.p[this.p.length - 3], this.p[this.p.length - 2], this.p[this.p.length - 1]) : col; this.c.push(cc[0], cc[1], cc[2]); }
    if (g.index) for (let k = 0; k < g.index.count; k++) this.i.push(b + g.index.getX(k)); else for (let k = 0; k < P.count; k++) this.i.push(b + k);
    return this;
  }
  // tub prin punctele [{ x, y, z, r }] (trunchi, ramuri)
  tube(pts, seg, col) {
    const b = this.p.length / 3, t = V(), u = V(), w = V(), n = pts.length;
    pts.forEach((p, j) => {
      const a = pts[Math.max(0, j - 1)], c = pts[Math.min(n - 1, j + 1)]; t.set(c.x - a.x, c.y - a.y, c.z - a.z).normalize();
      u.set(1, 0, 0); if (Math.abs(t.x) > .9) u.set(0, 0, 1); u.cross(t).normalize(); w.crossVectors(t, u);
      for (let k = 0; k < seg; k++) { const an = k / seg * TAU, ca = Math.cos(an), sa = Math.sin(an), nx = u.x * ca + w.x * sa, ny = u.y * ca + w.y * sa, nz = u.z * ca + w.z * sa, sh = .8 + .2 * ((k * 7 + j * 3) % 5) / 4;
        this.p.push(p.x + nx * p.r, p.y + ny * p.r, p.z + nz * p.r); this.n.push(nx, ny, nz); this.c.push(col[0] * sh, col[1] * sh, col[2] * sh); }
    });
    for (let j = 0; j < n - 1; j++) for (let k = 0; k < seg; k++) { const A = b + j * seg + k, B = b + j * seg + (k + 1) % seg, C = A + seg, D = B + seg; this.i.push(A, B, C, B, D, C); }
    return this;
  }
  geo() { return mkGeo(this.p, this.n, this.c, this.i); }
}

function randDir(r, o) { const u = r() * 2 - 1, a = r() * TAU, s = Math.sqrt(1 - u * u); return o.set(s * Math.cos(a), u, s * Math.sin(a)); }
const AX = V(1, 0, 0), AY = V(0, 1, 0);
// coroană: cartonașe cu frunze așezate pe câțiva lobi (elipsoizi), aproape tangente la ei; mai întunecate spre interior și spre poale
function crown(Q, r, lobes, { n, size, uv = UV, tint = [1, 1, 1], cut = -.6, tilt = .7, inner = 0 }) {   // inner = partea de cartonașe puse mai în adânc (umplu golurile)
  const tot = lobes.reduce((s, l) => s + l.r[0] * l.r[2], 0), d = V(), p = V(), nn = V(), ax = V(), ay = V(), t = V(), C = lobes[0].c;
  let y0 = Infinity, y1 = -Infinity, R = 0; lobes.forEach(l => { y0 = Math.min(y0, l.c.y - l.r[1]); y1 = Math.max(y1, l.c.y + l.r[1]); R = Math.max(R, Math.hypot(l.c.x - C.x, l.c.z - C.z) + l.r[0]); });
  for (let i = 0, guard = 0; i < n && guard < n * 6; guard++) {
    let l = lobes[0], k = r() * tot; for (const o of lobes) { k -= o.r[0] * o.r[2]; l = o; if (k <= 0) break; }
    randDir(r, d); if (d.y < cut && r() < .85) continue;
    const deep = i < n * inner, dp = deep ? .42 + .3 * r() : .76 + .3 * r(); p.set(l.c.x + d.x * l.r[0] * dp, l.c.y + d.y * l.r[1] * dp, l.c.z + d.z * l.r[2] * dp);
    if (!deep && lobes.some(o => o !== l && ((p.x - o.c.x) / o.r[0]) ** 2 + ((p.y - o.c.y) / o.r[1]) ** 2 + ((p.z - o.c.z) / o.r[2]) ** 2 < .5)) continue;
    nn.copy(d).addScaledVector(randDir(r, t), tilt).normalize();
    ax.crossVectors(nn, Math.abs(nn.y) > .9 ? AX : AY).normalize(); ay.crossVectors(ax, nn);
    const a = r() * TAU, ca = Math.cos(a), sa = Math.sin(a); t.copy(ax).multiplyScalar(ca).addScaledVector(ay, sa); ay.multiplyScalar(ca).addScaledVector(ax, -sa); ax.copy(t);
    nn.set(p.x - C.x, (p.y - C.y) * (lobes[0].r[0] / lobes[0].r[1]), p.z - C.z).normalize().lerp(d, .4); nn.y += .15; nn.normalize();
    const rad = Math.hypot(p.x - C.x, (p.y - C.y) * (lobes[0].r[0] / lobes[0].r[1]), p.z - C.z) / R;
    const ao = lerp(.4, 1, smooth(.3, .95, rad)) * lerp(.62, 1, clamp((p.y - y0) / (y1 - y0))) * (.86 + .28 * r()), s = lerp(size[0], size[1], r());
    Q.add(p, ax, ay, s, s, nn, [ao * tint[0] * (.92 + .16 * r()), ao * tint[1], ao * tint[2] * (.86 + .28 * r())], uv); i++;
  }
}

// Copaci și plante la scara 1 (≈ 4 m înălțime; se măresc la așezare). kind: 0 = foios rotund · 1 = conifer · 2 = foios înalt (mesteacăn) · 3 = tufă · 4 = smoc mic
// Întoarce { crown (cartonașe cu frunze), wood (trunchi, ramuri și miezul întunecat al coroanei) }.
export function treeGeo(kind, seed = 1) {
  const r = rng(seed), Q = new Cards(), S = new Solid(), mat = (sx, sy, sz, x, y, z) => new THREE.Matrix4().makeScale(sx, sy, sz).setPosition(x, y, z);
  const core = [.042, .075, .03], ico = new THREE.IcosahedronGeometry(1, 1);
  if (kind === 1) {
    const H0 = .5, H1 = 4.3, p = V(), ax = V(), ay = V(), nn = V(), bark = [.16, .11, .08];
    for (let i = 0; i < 210; i++) {
      const t = 1 - Math.sqrt(r()), y = lerp(H0, H1 - .4, t), full = 1.1 * Math.pow(1 - t, .9) + .07, k = .7 + .34 * r(), a = r() * TAU, ca = Math.cos(a), sa = Math.sin(a), dr = .3 + .35 * r();
      ay.set(ca, -dr, sa).normalize(); ax.set(-sa, 0, ca); const w = lerp(.78, .4, t) * (.85 + .3 * r()), h = w * 1.4;
      p.set(ca * full * k, y, sa * full * k).addScaledVector(ay, -h * .32);
      nn.set(ca * .8, .65, sa * .8).normalize();
      const ao = lerp(.45, 1, smooth(.6, 1, k)) * lerp(.7, 1, t) * (.85 + .3 * r());
      Q.add(p, ax, ay, w, h, nn, [ao * (.9 + .2 * r()), ao, ao * (.9 + .2 * r())], [0, 1, 1, 0]);
    }
    for (let k = 0; k < 3; k++) { const a = k * TAU / 6 + .3; ax.set(Math.cos(a), 0, Math.sin(a)); nn.set(-ax.z * .5, .7, ax.x * .5).normalize(); Q.add(p.set(0, H1 - .78, 0), ax, AY, .52, .95, nn, [1, 1, 1], [0, 1, 1, 0], true); }
    S.tube([{ x: 0, y: 0, z: 0, r: .1 }, { x: 0, y: 1.2, z: 0, r: .075 }, { x: 0, y: H1 - .6, z: 0, r: .02 }], 6, bark);
    S.add(new THREE.ConeGeometry(.62, H1 - 1.1, 8), mat(1, 1, 1, 0, H0 + (H1 - 1.1) / 2, 0), core);
  } else if (kind >= 3) {
    const big = kind === 3, C = V(0, big ? .46 : .12, 0), lobes = [{ c: C, r: big ? [1, .66, 1] : [.3, .2, .3] }];
    if (big) for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + r(), d = .45 + .2 * r(); lobes.push({ c: V(Math.cos(a) * d, .5 + .2 * r(), Math.sin(a) * d), r: [.55, .45, .55] }); }
    crown(Q, r, lobes, { n: big ? 78 : 9, size: big ? [.44, .62] : [.26, .36], cut: big ? -.25 : -.1, tilt: big ? .6 : .5 });
    if (big) S.add(ico, mat(.84, .56, .84, 0, .4, 0), core);
  } else {
    const tall = kind === 2, C = V(0, tall ? 2.75 : 2.55, 0), lobes = [{ c: C, r: tall ? [.82, 1.42, .82] : [1.2, 1.06, 1.2] }], nl = tall ? 5 : 6, bark = tall ? [.6, .58, .52] : [.19, .14, .1];
    for (let i = 0; i < nl; i++) { const a = i / nl * TAU + r() * .8, d = tall ? .3 + .2 * r() : .62 + .25 * r(), y = tall ? lerp(-1, .85, i / (nl - 1)) : lerp(-.36, .5, r()), rr = tall ? .5 + .18 * r() : .6 + .22 * r(); lobes.push({ c: V(Math.cos(a) * d, C.y + y, Math.sin(a) * d), r: [rr, rr * .9, rr] }); }
    crown(Q, r, lobes, { n: tall ? 290 : 330, size: tall ? [.5, .78] : [.56, .9], inner: .16 });
    const lean = (r() - .5) * .12;
    S.tube([{ x: 0, y: 0, z: 0, r: tall ? .1 : .13 }, { x: lean, y: .7, z: lean * .5, r: tall ? .08 : .1 }, { x: -lean * .5, y: 1.4, z: 0, r: tall ? .065 : .085 }, { x: 0, y: 2.1, z: 0, r: .06 }, { x: 0, y: C.y + .35, z: 0, r: .028 }], 7, bark);
    for (let i = 1; i <= 4; i++) { const l = lobes[i], y = 1.35 + .22 * i; S.tube([{ x: 0, y, z: 0, r: .045 }, { x: l.c.x * .5, y: lerp(y, l.c.y, .55), z: l.c.z * .5, r: .034 }, { x: l.c.x * .95, y: l.c.y, z: l.c.z * .95, r: .016 }], 5, bark); }
    S.add(ico, mat(lobes[0].r[0] * .6, lobes[0].r[1] * .6, lobes[0].r[2] * .6, 0, C.y, 0), core);
  }
  return { crown: Q.geo(), wood: S.p.length ? S.geo() : null };
}

// un rând de obiecte identice (InstancedMesh) din lista [{ x, y, z, ry, s | [sx, sy, sz], c }]
export function instances(geo, mat, list, { cast = true, recv = true } = {}) {
  const im = new THREE.InstancedMesh(geo, mat, list.length), o = new THREE.Object3D(), col = new THREE.Color();
  list.forEach((e, i) => { o.position.set(e.x, e.y || 0, e.z); o.rotation.set(e.rx || 0, e.ry || 0, 0); if (Array.isArray(e.s)) o.scale.set(e.s[0], e.s[1], e.s[2]); else o.scale.setScalar(e.s || 1); o.updateMatrix(); im.setMatrixAt(i, o.matrix); if (e.c) im.setColorAt(i, col.setRGB(e.c[0], e.c[1], e.c[2])); });
  im.castShadow = cast; im.receiveShadow = recv; im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); return im;
}
