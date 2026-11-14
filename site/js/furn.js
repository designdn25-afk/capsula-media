// Piese comune pentru casele din grădină: geamuri, mobilier simplu, terase, trepte, balustrade.
// Toate piesele au originea pe podea (y = 0) în centrul lor și folosesc materialele din kit.materials().
import { THREE, box, clamp, ease } from './kit.js';

const G = () => new THREE.Group();
const add = (g, ...o) => { o.forEach(x => g.add(x)); return g; };
const cyl = (r, h, m, x = 0, y = 0, z = 0, seg = 20) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m); c.position.set(x, y, z); return c; };

// geam plan cu reflexia cerului (culori pe vârfuri: jos solul, la mijloc orizontul luminos, sus cerul). Folosește M.glass.
export function pane(w, h, mat) {
  const g = new THREE.PlaneGeometry(w, h, 1, 5), p = g.attributes.position, c = [];
  const stops = [[0, [.4, .38, .38]], [.2, [.52, .49, .47]], [.33, [1.7, 1.65, 1.55]], [.45, [1.1, 1.15, 1.22]], [.8, [.8, .9, 1.08]], [1, [.62, .74, .98]]];
  for (let i = 0; i < p.count; i++) { const t = (p.getY(i) + h / 2) / h; let k = 0; while (k < stops.length - 2 && t > stops[k + 1][0]) k++; const a = stops[k], b = stops[k + 1], f = Math.min(1, Math.max(0, (t - a[0]) / (b[0] - a[0]))); c.push(a[1][0] + (b[1][0] - a[1][0]) * f, a[1][1] + (b[1][1] - a[1][1]) * f, a[1][2] + (b[1][2] - a[1][2]) * f); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
  const m = new THREE.Mesh(g, mat); m.castShadow = false; m.receiveShadow = false; return m;
}
// fereastră / ușă de sticlă cu ramă închisă: panou pe planul XY, centrat, cu fața spre +Z. n = câte canaturi.
export function glazing(M, w, h, n = 1, frame = .06) {
  const g = G(); const gl = pane(w - frame * 2, h - frame * 2, M.glass); gl.position.z = .005; g.add(gl);
  g.add(box(w, frame, .05, M.frame, 0, h / 2 - frame / 2, 0), box(w, frame, .05, M.frame, 0, -h / 2 + frame / 2, 0), box(frame, h, .05, M.frame, -w / 2 + frame / 2, 0, 0), box(frame, h, .05, M.frame, w / 2 - frame / 2, 0, 0));
  for (let i = 1; i < n; i++) g.add(box(frame * .8, h, .05, M.frame, -w / 2 + w * i / n, 0, 0));
  return g;
}

export function bed(M, w = 1.6, l = 2.0) {
  const g = G(); add(g, box(w, .28, l, M.wood, 0, .14, 0), box(w - .06, .2, l - .06, M.white, 0, .38, 0), box(w, .9, .08, M.fabric, 0, .45, -l / 2 - .04), box(w - .1, .06, l * .55, M.fabric, 0, .5, l * .2));
  [-1, 1].forEach(s => g.add(box(w * .38, .12, .36, M.white, s * w * .24, .54, -l / 2 + .28))); return g;
}
export function sofa(M, l = 1.8, mat) {
  const m = mat || M.sofa, g = G(); add(g, box(l, .4, .78, m, 0, .2, 0), box(l, .42, .18, m, 0, .6, -.3), box(.16, .56, .78, m, -l / 2 + .08, .28, 0), box(.16, .56, .78, m, l / 2 - .08, .28, 0)); return g;
}
export function armchair(M, mat) { const m = mat || M.fabric, g = G(); add(g, box(.7, .38, .7, m, 0, .19, 0), box(.7, .42, .14, m, 0, .58, -.28), box(.12, .5, .7, m, -.29, .25, 0), box(.12, .5, .7, m, .29, .25, 0)); return g; }
export function tableRound(M, r = .45, h = .74) { const g = G(); add(g, cyl(r, .04, M.white, 0, h, 0, 28), cyl(.05, h, M.white, 0, h / 2, 0), cyl(r * .5, .03, M.white, 0, .015, 0)); return g; }
export function tableRect(M, w = 1.4, d = .8, h = .74, top) { const g = G(); g.add(box(w, .05, d, top || M.white, 0, h, 0)); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => g.add(box(.05, h, .05, M.wood, a * (w / 2 - .06), h / 2, b * (d / 2 - .06)))); return g; }
export function coffee(M, r = .32) { const g = G(); add(g, cyl(r, .04, M.wood, 0, .38, 0, 24), cyl(.03, .38, M.dark, 0, .19, 0)); return g; }
export function chair(M, mat) { const m = mat || M.fabric, g = G(); add(g, box(.42, .06, .42, m, 0, .45, 0), box(.42, .42, .06, m, 0, .69, -.18)); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => g.add(box(.03, .45, .03, M.dark, a * .18, .225, b * .18))); return g; }
export function kitchen(M, l = 1.8, upper = false) { const g = G(); add(g, box(l, .86, .58, M.green, 0, .43, 0), box(l + .04, .04, .62, M.wood, 0, .88, 0), box(.5, .02, .4, M.steel, l * .2, .905, 0)); if (upper) g.add(box(l, .6, .34, M.white, 0, 1.75, -.12)); return g; }
export function wardrobe(M, w = 1.2, h = 2.1, d = .58) { const g = G(); g.add(box(w, h, d, M.white, 0, h / 2, 0), box(.02, h - .1, .01, M.seam, 0, h / 2, d / 2 + .005)); return g; }
export function desk(M, w = 1.2) { const g = G(); add(g, box(w, .04, .6, M.white, 0, .74, 0), box(.04, .74, .56, M.white, -w / 2 + .04, .37, 0), box(.04, .74, .56, M.white, w / 2 - .04, .37, 0)); return g; }
export function rug(M, w = 2, d = 1.4, color = 0xe6ded2) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, .015, d), new THREE.MeshStandardMaterial({ color, roughness: 1 })); m.position.y = .008; m.receiveShadow = true; return m; }
export function shower(M, w = .9, d = .9) { const g = G(), sg = M.showerglass || M.glass; add(g, box(w, .05, d, M.white, 0, .025, 0), box(w, 1.95, .02, sg, 0, 1.0, d / 2), box(.02, 1.95, d, sg, w / 2, 1.0, 0), box(.03, 1.6, .03, M.dark, -w / 2 + .12, 1.1, -d / 2 + .1), box(.2, .03, .2, M.dark, -w / 2 + .2, 1.92, -d / 2 + .16)); return g; }
export function wc(M) { const g = G(); add(g, box(.38, .4, .5, M.white, 0, .2, .05), box(.38, .5, .16, M.white, 0, .45, -.25)); return g; }
export function vanity(M, w = .8) { const g = G(); add(g, box(w, .5, .46, M.white, 0, .6, 0), box(w + .04, .04, .5, M.white, 0, .87, 0), box(w * .7, .7, .03, M.skyglass || M.frame, 0, 1.55, -.22)); return g; }
export function wallBox(M, w, d, h = 2.4, mat) { const m = box(w, h, d, mat || M.inner, 0, h / 2, 0); m.castShadow = false; return m; }
export function curtain(M, w = .5, h = 2.2) { const g = G(); for (let i = 0; i < 4; i++) g.add(box(w / 4 - .01, h, .04 + (i % 2) * .03, M.fabric, -w / 2 + w / 8 + i * w / 4, h / 2, 0)); return g; }

// terasă din lemn cu rosturi; originea în centrul terasei, fața de sus la y = h
export function deck(M, w, d, h = .3) {
  const g = G(); const top = box(w, .06, d, M.wood, 0, h - .03, 0); top.receiveShadow = true; top.castShadow = true; g.add(top, box(w - .1, h - .06, d - .1, M.dark, 0, (h - .06) / 2, 0));
  const n = Math.max(2, Math.round(d / .16)); for (let i = 1; i < n; i++) { const l = box(w, .004, .012, M.dark, 0, h + .001, -d / 2 + d * i / n); l.castShadow = false; g.add(l); }
  return g;
}
// trepte: urcă spre −Z (spre casă); originea jos, la mijlocul primei trepte
export function steps(M, w = 1.1, n = 3, rise = .16, run = .28, mat) {
  const g = G(); for (let i = 0; i < n; i++) { const t = box(w, rise, run * (n - i), mat || M.steel, 0, rise * (i + .5), run / 2 - (i + n) * run / 2); t.castShadow = true; t.receiveShadow = true; g.add(t); } return g;
}
// balustradă de-a lungul axei X, centrată; glass = panouri de sticlă, altfel bare verticale
export function railing(M, len, h = 1.0, glass = true) {
  const g = G(); g.add(box(len, .04, .05, M.frame, 0, h, 0));
  const n = Math.max(1, Math.round(len / 1.2)); for (let i = 0; i <= n; i++) g.add(box(.04, h, .04, M.frame, -len / 2 + len * i / n, h / 2, 0));
  if (glass) { const p = new THREE.Mesh(new THREE.BoxGeometry(len - .06, h - .16, .012), M.railglass || M.showerglass || M.glass); p.position.y = h / 2 - .02; p.castShadow = false; g.add(p); } else { const k = Math.round(len / .14); for (let i = 1; i < k; i++) g.add(box(.018, h - .06, .018, M.frame, -len / 2 + len * i / k, h / 2, 0)); }
  return g;
}
// lampă de grădină (se aprinde seara: M.lamp.emissiveIntensity)
export function lampPost(M, h = 2.6) { const g = G(); add(g, cyl(.05, h, M.frame, 0, h / 2, 0, 10), box(.34, .06, .34, M.frame, 0, h + .03, 0)); const b = new THREE.Mesh(new THREE.BoxGeometry(.26, .22, .26), M.lamp || M.ledIn || M.white); b.position.y = h - .12; b.castShadow = false; g.add(b); g.children.forEach(c => { if (c !== b) c.castShadow = true; }); return g; }

// materialele în plus pentru casele din grădină
export function houseMaterials(M) {
  const S = o => new THREE.MeshStandardMaterial(o);
  M.showerglass = M.showerglass || new THREE.MeshPhysicalMaterial({ color: 0xbfd6e2, roughness: .1, transparent: true, opacity: .28, depthWrite: false });
  M.railglass = new THREE.MeshPhysicalMaterial({ color: 0xcfe2ea, roughness: .05, transparent: true, opacity: .22, depthWrite: false });
  M.skyglass = M.skyglass || new THREE.MeshPhysicalMaterial({ color: 0x1b3550, roughness: .05, metalness: .9, transparent: true, opacity: .9 });
  M.ledIn = M.ledIn || S({ color: 0xfff1d6, emissive: 0xffd08a, emissiveIntensity: 0 });
  M.lamp = S({ color: 0xfff4dc, emissive: 0xffcf8a, emissiveIntensity: 0 });
  M.roofDark = S({ color: 0x3a3d43, roughness: .7, metalness: .2 });
  M.clad = S({ color: 0xa8713f, roughness: .7 });          // lambriu / lemn pe fațadă
  M.stoneWall = S({ color: 0xb9b4a8, roughness: .95 });
  M.orange = S({ color: 0xe8842c, roughness: .5 });
  return M;
}

// regulă comună pentru geamuri (geamul LOW-E din real.js): ziua reflectă cerul și lasă să se vadă puțin interiorul; seara devin străvezii și calde
const GLASS_WARM = new THREE.Color(0xffe2b8);
export function glassNight(mat, n, dayColor) {
  if (dayColor) mat.color.copy(dayColor); if (n > .02) mat.color.lerp(GLASS_WARM, n * .3);
  mat.opacity = .5 + (.1 - .5) * n; mat.envMapIntensity = 1.1 + (.75 - 1.1) * n; mat.roughness = .04 + .04 * n;
}

// Set propriu de materiale (copii ale celor comune, cu aceleași nume), pentru o parte a casei care trebuie să poată dispărea singură:
// acoperișul sau etajul. Seara, copiile se aprind odată cu originalele (vezi gscene.js: M.clones).
export function fadeSet(M) {
  const own = {}, src = {};
  const S = new Proxy(own, { get(t, k) {
    if (k in t) return t[k]; const m = M[k]; if (!m || !m.isMaterial) return m;
    const c = m.clone(); c.onBeforeCompile = m.onBeforeCompile; c.customProgramCacheKey = m.customProgramCacheKey; c.userData = { k: 0 }; t[k] = c;   // clone() nu copiază și textura pusă din real.js src[k] = m; (M.clones || (M.clones = [])).push([m, c]); return c; } });
  Object.defineProperty(own, 'fade', { enumerable: false, value: k => { for (const n in src) { const c = own[n], m = src[n], tr = k > .001 || m.transparent;
    c.userData.k = k; if (c.transparent !== tr) { c.transparent = tr; c.needsUpdate = true; } c.opacity = m.opacity * (1 - k); c.depthWrite = k < .5 ? m.depthWrite : false; } } });
  return S;
}
// ridică un grup (acoperiș / etaj) și îl stinge: k = 0 la loc … 1 dispărut. S = setul lui de materiale (fadeSet).
export function lift(group, S, k, h = 2.2) {
  k = clamp(k); const u = group.userData; if (u.y0 === undefined) { u.y0 = group.position.y; group.traverse(o => { if (o.isMesh) o.userData.cs = o.castShadow; }); }
  group.position.y = u.y0 + ease(k) * h; S.fade(clamp(k * 1.3)); group.visible = k < .77;
  const sh = k < .3; if (u.sh !== sh) { u.sh = sh; group.traverse(o => { if (o.isMesh) o.castShadow = sh && o.userData.cs; }); }
}
