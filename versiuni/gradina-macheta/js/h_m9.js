// Casa capsulă M9, pe două niveluri, după imaginile din catalog (surse/catalog/mod/M9*.jpg).
// Parter 11,5 × 3,4 × 3,45 m · etaj 8,3 m (cu copertină) + 2,4 m terasă × 3,3 × 3,45 m · scară exterioară din oțel la capătul din stânga.
// Axe: X = lungimea (livingul la −X, dormitorul de jos și terasa la +X), fațada cu intrarea spre +Z, Y = în sus. Unități: metri.
import { THREE, box, perimeter, arcTop, arcBottom, grow, clipPoly, clamp } from './kit.js';
import * as F from './furn.js';

export const info = { id: 'M9', w: 11.5, d: 3.4, h: 6.9 };

/* ---------- unelte locale ----------
   Toate piesele de pe carcasă folosesc aceeași împărțire a conturului (cuts), ca să nu rămână fante pe colțurile rotunjite. */
const NA = 12;                                                   // câte felii are un colț rotunjit
function cuts(per, s0, s1) {
  if (!per.grid) { per.grid = []; per.starts.forEach((s, i) => { per.grid.push(s); if (i % 2) for (let k = 1; k < NA; k++) per.grid.push(s + per.segs[i] * k / NA); }); }
  const out = [s0], T = per.total;
  for (let n = Math.floor(s0 / T) - 1; n <= Math.ceil(s1 / T); n++) per.grid.forEach(g => { const s = g + n * T; if (s > s0 + 1e-6 && s < s1 - 1e-6) out.push(s); });
  out.push(s1); return out;
}
function geo(pos, nor, idx, col) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  if (col && col.length) g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); return g;
}
// profil plimbat pe contur între s0 și s1 (ca sweep din kit.js, dar pe împărțirea comună)
function sweepG(per, profile, s0 = 0, s1 = per.total) {
  const ss = cuts(per, s0, s1), m = profile.length, pos = [], nor = [], idx = [];
  ss.forEach(s => { const p = per.at(s);
    for (let j = 0; j < m; j++) { const a = profile[Math.max(0, j - 1)], b = profile[Math.min(m - 1, j + 1)], dd = b.d - a.d, dy = b.y - a.y, l = Math.hypot(dd, dy) || 1, pr = profile[j];
      pos.push(p.x - p.nx * pr.d, pr.y, p.z - p.nz * pr.d); nor.push(p.nx * dy / l, dd / l, p.nz * dy / l); } });
  for (let i = 0; i < ss.length - 1; i++) for (let j = 0; j < m - 1; j++) { const A = i * m + j, B = (i + 1) * m + j, C = (i + 1) * m + j + 1, D = i * m + j + 1; idx.push(A, C, B, A, D, C); }
  return geo(pos, nor, idx);
}
// poligon convex în coordonate desfășurate (s, y), așezat pe carcasă; inward = fața spre interior (căptușeala pereților)
function wrapG(per, poly, { off = .012, ys = null, color = null, inward = false } = {}) {
  const sv = poly.map(p => p[0]), ss = cuts(per, Math.min(...sv), Math.max(...sv)), pos = [], nor = [], idx = [], col = [], f = inward ? -1 : 1;
  const emit = piece => { if (piece.length < 3) return; const base = pos.length / 3; let ar = 0;
    piece.forEach(([s, y], i) => { const p = per.at(s), q = piece[(i + 1) % piece.length]; ar += s * q[1] - q[0] * y;
      pos.push(p.x + p.nx * off, y, p.z + p.nz * off); nor.push(f * p.nx, 0, f * p.nz); if (color) col.push(...color(s, y)); });
    for (let k = 1; k < piece.length - 1; k++) (ar > 0) !== inward ? idx.push(base, base + k + 1, base + k) : idx.push(base, base + k, base + k + 1); };
  for (let i = 0; i < ss.length - 1; i++) {
    const piece = clipPoly(clipPoly(poly, ss[i], true), ss[i + 1], false); if (piece.length < 3) continue;
    if (!ys) { emit(piece); continue; }
    const lv = [-1e9, ...ys, 1e9]; for (let j = 0; j < lv.length - 1; j++) emit(clipPoly(clipPoly(piece, lv[j], true, 1), lv[j + 1], false, 1));
  }
  return geo(pos, nor, idx, col);
}
// capac orizontal după contur (retras cu d), între s0 și s1; bucata se închide cu o linie dreaptă
function capG(per, y, d = 0, up = true, s0 = 0, s1 = per.total) {
  const ss = cuts(per, s0, s1), sh = new THREE.Shape(); if (s1 - s0 > per.total - 1e-6) ss.pop();
  ss.forEach((s, i) => { const p = per.at(s), x = p.x - p.nx * d, z = (p.z - p.nz * d) * (up ? -1 : 1); i ? sh.lineTo(x, z) : sh.moveTo(x, z); });
  const g = new THREE.ShapeGeometry(sh); g.rotateX(up ? -Math.PI / 2 : Math.PI / 2); g.translate(0, y, 0); return g;
}
// mai multe geometrii într-una singură (mai puține mesh-uri)
function merge(list) {
  let n = 0; const hasCol = list.length > 0 && list.every(g => g.attributes.color);
  list.forEach(g => { n += g.index ? g.index.count : g.attributes.position.count; });
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = hasCol ? new Float32Array(n * 3) : null; let o = 0;
  list.forEach(g => { const p = g.attributes.position, q = g.attributes.normal, c = g.attributes.color, ix = g.index, cnt = ix ? ix.count : p.count;
    for (let i = 0; i < cnt; i++, o++) { const k = ix ? ix.getX(i) : i;
      pos[3 * o] = p.getX(k); pos[3 * o + 1] = p.getY(k); pos[3 * o + 2] = p.getZ(k); nor[3 * o] = q.getX(k); nor[3 * o + 1] = q.getY(k); nor[3 * o + 2] = q.getZ(k);
      if (col) { col[3 * o] = c.getX(k); col[3 * o + 1] = c.getY(k); col[3 * o + 2] = c.getZ(k); } } });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  if (col) g.setAttribute('color', new THREE.BufferAttribute(col, 3)); return g;
}
// multe cutii / bare într-un singur mesh
function batch() {
  const list = [], q = new THREE.Quaternion(), X = new THREE.Vector3(1, 0, 0);
  const api = {
    box(w, h, d, x, y, z, ry = 0) { const g = new THREE.BoxGeometry(w, h, d); if (ry) g.rotateY(ry); g.translate(x, y, z); list.push(g); return api; },
    beam(a, b, t = .05, t2 = t) { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), dir = B.clone().sub(A), g = new THREE.BoxGeometry(dir.length(), t, t2);
      q.setFromUnitVectors(X, dir.normalize()); g.applyQuaternion(q); A.add(B).multiplyScalar(.5); g.translate(A.x, A.y, A.z); list.push(g); return api; },
    geo: () => merge(list),
    mesh(mat, parent, cast = true) { const o = new THREE.Mesh(merge(list), mat); o.castShadow = cast; o.receiveShadow = true; parent.add(o); return o; },
  };
  return api;
}
const rect = (s0, s1, y0, y1) => [[s0, y0], [s1, y0], [s1, y1], [s0, y1]];
const oct = (c, y0, y1, hw = .5, ch = .22) => [[c - hw + ch, y0], [c + hw - ch, y0], [c + hw, y0 + ch], [c + hw, y1 - ch], [c + hw - ch, y1], [c - hw + ch, y1], [c - hw, y1 - ch], [c - hw, y0 + ch]];
const ringOf = (outer, inner) => outer.map((p, i) => [p, outer[(i + 1) % outer.length], inner[(i + 1) % inner.length], inner[i]]);
const outline = (poly, t) => ringOf(grow(poly, t / 2), grow(poly, -t / 2));
const seamKit = list => ({
  hz: (s0, s1, y) => list.push(rect(s0, s1, y - .011, y + .011)),
  vt: (s, y0, y1) => list.push(rect(s - .011, s + .011, y0, y1)),
  dg: (a, b) => list.push([[a[0], a[1] - .014], [b[0], b[1] - .014], [b[0], b[1] + .014], [a[0], a[1] + .014]]),
});
// reflexia cerului pe geamul curbat: culori pe vârfuri, pe înălțimea geamului (jos solul, la mijloc orizontul luminos, sus cerul)
const SKY = [[0, [.36, .34, .34]], [.21, [.5, .47, .46]], [.336, [1.75, 1.7, 1.6]], [.43, [1.12, 1.16, 1.22]], [.7, [.8, .9, 1.08]], [1, [.62, .74, .98]]];
const sky = (y0, y1) => ({ ys: SKY.slice(1, 5).map(k => y0 + (y1 - y0) * k[0]), color: (s, y) => {
  const t = clamp((y - y0) / (y1 - y0)); let k = 0; while (k < SKY.length - 2 && t > SKY[k + 1][0]) k++;
  const a = SKY[k], b = SKY[k + 1], f = clamp((t - a[0]) / (b[0] - a[0])); return a[1].map((v, i) => v + (b[1][i] - v) * f); } });

export function build(M) {
  const R = F.fadeSet(M), U = F.fadeSet(M);                      // R = acoperișul etajului, U = tot etajul (și tavanul parterului)
  const root = new THREE.Group(); root.name = 'M9';
  const gnd = new THREE.Group(), stair = new THREE.Group(), up = new THREE.Group(), roof = new THREE.Group(); root.add(gnd, stair, up, roof);
  const mk = (g, m, parent, cast = true, recv = true) => { const o = new THREE.Mesh(g, m); o.castShadow = cast; o.receiveShadow = recv; parent.add(o); return o; };
  const TW = .13;                                                // grosimea pereților exteriori

  // un nivel: panouri albe + căptușeală interioară, rosturi, panouri ieșite în afară (uși), geamuri cu ramă și bandă LED
  function storey(per, S, parent, dx, dy, { walls, yIn, inner = [], seams, panels, wins, mull, y0, y1 }) {
    const w = (polys, o) => merge(polys.map(p => wrapG(per, p, o))).translate(dx, dy, 0);
    mk(w(walls, { off: 0 }), S.shell, parent);
    mk(w([...inner, ...walls.map(p => clipPoly(p, yIn, true, 1)).filter(p => p.length > 2)], { off: -TW, inward: true }), S.inner, parent, false);
    mk(w(seams, { off: .004 }), S.seam, parent, false);
    mk(w(panels, { off: .022 }), S.shell, parent, false);
    const fr = wins.flatMap(p => ringOf(p, grow(p, -.075)));
    mull.forEach(([p, list]) => list.forEach(s => { const q = clipPoly(clipPoly(p, s - .035, true), s + .035, false); if (q.length > 2) fr.push(q); }));
    mk(merge([w(fr, { off: .008 }), w(panels.map(p => grow(p, .035)), { off: .006 })]), S.frame, parent, false);
    mk(w(wins.flatMap(p => ringOf(grow(p, .04), p)), { off: .01 }), S.led, parent, false);
    mk(w(wins, { off: 0, ...sky(y0, y1) }), S.glass, parent, false, false).renderOrder = 2;
  }

  /* ================= PARTERUL (capsulă de 11,5 × 3,4 m, ca X7) ================= */
  const pg = perimeter(11.5, 3.4, 1.1), T = pg.total, H = 3.45, Y0 = .15, YW0 = .45, YW1 = 3.17, g0 = .70, g1 = 2.84, YF = .62, c0 = 1.24, c1 = 2.30;
  const XD = -1.0, XB = 1.0, sd = pg.sFront(XD), sb = pg.sBack(XB);         // ușa din față și ușa din spate
  const bt = T - 6.906, bf = T - 6.006;
  const BED = [[3.45, c0], [3.45, c1], [2.55, g1], [-6.006, g1], [-6.906, c1], [-6.906, c0], [-6.006, g0], [2.55, g0]];   // dormitorul: ocolește capătul din dreapta
  const WSM = [[8.4, g0], [8.4, g1], [7.45, g1], [7.15, 2.5], [7.15, 1.04], [7.45, g0]];                                   // geamul înalt din stânga ușii
  const WLV = [[14.0, g0], [15.25, g0], [16.0, c0], [16.0, c1], [15.25, g1], [14.0, g1]];                                  // livingul, pe spate (în dreptul scării)
  const sG = [], KG = seamKit(sG);
  [[3.45, 7.15], [8.4, 14.0], [16.0, bt]].forEach(([a, b]) => { KG.hz(a, b, g1); KG.hz(a, b, g0); });
  for (let s = 1.2; s < T; s += 2.326) { KG.vt(s, g1 + .02, YW1); KG.vt(s, YW0, g0 - .02); }
  [1, 2, 3, 4].forEach(i => KG.vt(pg.starts[i], g0, g1));                                                                  // capătul plin din stânga
  [.3, .6].forEach(k => {
    KG.dg([2.55 + k, g1], [3.45 + k, c1]); KG.vt(3.45 + k, c0, c1); KG.dg([3.45 + k, c0], [2.55 + k, g0]);
    KG.dg([15.25 + k, g1], [16.0 + k, c1]); KG.vt(16.0 + k, c0, c1); KG.dg([16.0 + k, c0], [15.25 + k, g0]);
  });
  KG.dg([7.15, g1], [6.85, 2.5]); KG.vt(6.85, 1.04, 2.5); KG.dg([6.85, 1.04], [7.15, g0]);
  KG.dg([bf - .3, g1], [bt - .3, c1]); KG.vt(bt - .3, c0, c1); KG.dg([bt - .3, c0], [bf - .3, g0]);
  [sd, sb].forEach(c => sG.push(...outline(oct(c, g0 + .02, g1 - .02, .95, .42), .022)));                                  // panoul octogonal din jurul ușii
  storey(pg, M, gnd, 0, 0, {
    walls: [rect(-6.906, bt, g1, YW1), rect(-6.906, bt, YW0, g0), rect(3.45, 7.15, g0, g1), rect(8.4, 14.0, g0, g1), rect(16.0, bt, g0, g1),
      [[2.55, g0], [3.45, g0], [3.45, c0]], [[2.55, g1], [3.45, g1], [3.45, c1]], [[7.45, g0], [7.15, g0], [7.15, 1.04]], [[7.45, g1], [7.15, g1], [7.15, 2.5]],
      [[15.25, g0], [16.0, g0], [16.0, c0]], [[15.25, g1], [16.0, g1], [16.0, c1]], [[bt, g0], [bf, g0], [bt, c0]], [[bt, g1], [bf, g1], [bt, c1]]],
    yIn: YF, seams: sG, panels: [oct(sd, .5, 3.08), oct(sb, .5, 3.08)],
    wins: [BED, WSM, WLV], mull: [[BED, [0, -pg.segs[1], -pg.segs[1] - pg.segs[2], -2 * pg.segs[1] - pg.segs[2]]], [WLV, [14.75]]], y0: g0, y1: g1,
  });
  mk(sweepG(pg, [{ d: 0, y: YW1 + .002 }, { d: TW, y: YW1 + .002 }]), M.cut, gnd, false);                                 // grosimea pereților, văzută de sus
  gnd.add(box(.05, .2, .05, M.frame, XD - .34, 1.58, pg.w + .055), box(.05, .2, .05, M.frame, XB + .34, 1.58, -pg.w - .055));   // mânerele
  // grila de ventilație de pe capătul din stânga
  const sv = pg.sLeft(0), slats = []; for (let y = 1.3; y < 2.45; y += .14) slats.push(rect(sv - .17, sv + .17, y, y + .05));
  mk(wrapG(pg, rect(sv - .22, sv + .22, 1.2, 2.5), { off: .006 }), M.frame, gnd, false);
  mk(merge(slats.map(p => wrapG(pg, p, { off: .012 }))), M.steel, gnd, false);
  // copertinele subțiri de deasupra celor două uși
  const vs = new THREE.Shape(); vs.moveTo(-1.5, 0); vs.lineTo(1.5, 0); vs.lineTo(1.22, .36); vs.lineTo(-1.22, .36);
  mk(merge([[XD, 1], [XB, -1]].map(([x, f]) => { const g = new THREE.ExtrudeGeometry(vs, { depth: .09, bevelEnabled: false }); g.rotateX(Math.PI / 2); if (f < 0) g.rotateY(Math.PI); return g.translate(x, YW1, f * (pg.w - .02)); })), M.shell, gnd);
  // șasiul: partea de jos rotunjită, tălpile, treptele de la cele două uși
  mk(sweepG(pg, arcBottom(Y0, .3)), M.shell, gnd);
  mk(capG(pg, Y0, .3, false), M.dark, gnd, false);
  const feet = batch(); [-4.4, 0, 4.4].forEach(x => [-1.05, 1.05].forEach(z => feet.box(.34, .148, .34, x, .074, z))); feet.mesh(M.stone, gnd);
  const stp = batch();
  [[XD, 1], [XB, -1]].forEach(([x, f]) => { for (let i = 0; i < 3; i++) { const z = f * (pg.w + .78 - i * .3), h = .14 + i * .16;
    stp.box(1.02, .04, .3, x, .16 + i * .16, z); [-.48, .48].forEach(dx => stp.box(.03, h, .03, x + dx, h / 2, z)); } });
  stp.mesh(M.steel, gnd);
  // pardoseala și împărțirea: living + bucătărie la stânga, baia la mijloc (spre fațadă), dormitorul la dreapta
  mk(capG(pg, YF, .1, true), M.floor, gnd, false);
  const gi = new THREE.Group(); gi.position.y = YF; gnd.add(gi);
  const put = (g, o, x, z, ry = 0) => { o.position.set(x, o.position.y, z); o.rotation.y = ry; g.add(o); return o; };
  put(gi, F.wallBox(M, .07, 1.9, 2.3), -.4, .65); put(gi, F.wallBox(M, .07, 1.9, 2.3), 1.15, .65);                         // pereții băii
  put(gi, F.wallBox(M, .69, .07, 2.3), -.09, -.3); put(gi, F.wallBox(M, .24, .07, 2.3), 1.065, -.3);
  put(gi, F.shower(M, .8, .85), .71, 1.14, Math.PI); put(gi, F.wc(M), -.02, 1.22, Math.PI); put(gi, F.vanity(M, .7), -.13, .2, Math.PI / 2);
  put(gi, F.wardrobe(M, 1.85, 2.1, .58), 1.48, .64, Math.PI / 2);                                                          // dulapul din spatele patului
  put(gi, F.rug(M, 2.7, 2.2), 3.2, .45); put(gi, F.bed(M, 1.6, 2.0), 2.9, .5, Math.PI / 2);
  const kit = new THREE.Group();                                                                                           // bucătăria: corp din lemn, blat alb, peninsulă, dulapuri sus
  kit.add(box(1.9, .86, .58, M.wood, 0, .43, 0), box(1.94, .04, .62, M.white, 0, .88, 0), box(.46, .02, .36, M.steel, .45, .905, 0), box(.5, .02, .4, M.black, -.3, .905, 0),
    box(1.9, .6, .34, M.white, 0, 1.78, -.12), box(.58, .86, 1.0, M.wood, -.66, .43, .79), box(.62, .04, 1.08, M.white, -.66, .88, .81));
  put(gi, kit, -1.55, -1.28);
  put(gi, F.rug(M, 2.3, 1.7), -4.2, 0); put(gi, F.sofa(M, 1.9), -5.03, 0, Math.PI / 2); put(gi, F.coffee(M), -4.05, 0); put(gi, F.armchair(M), -3.2, .95, -Math.PI * .75);
  [[1.9, 1.5], [-3.6, 1.5], [3.0, -1.5], [-4.3, -1.5]].forEach(([x, z]) => put(gi, F.curtain(M, .5, 2.15), x, z));         // draperii la capetele geamurilor

  /* ================= ETAJUL (tot ce ține de el: set propriu de materiale U) ================= */
  // pt = conturul etajului împreună cu terasa (10,7 m); pu = conturul acoperișului (8,3 m). Capetele din stânga coincid cu al parterului.
  const pt = perimeter(10.7, 3.3, 1.1), pu = perimeter(8.3, 3.3, 1.1), CT = -.4, CU = -1.6, XW = .6;                       // XW = peretele de sticlă dinspre terasă
  const UB = .25, UF = .14, u0 = .66, u1 = 2.72, d0 = 1.2, d1 = 2.18, UW1 = 3.17, US = 2.78;                               // înălțimi față de baza etajului
  const sA = pt.sFront(XW - CT), sB = pt.sBack(XW - CT), tA = sB, tB = pt.total + sA;                                      // pereții: sA…sB · terasa: tA…tB
  const tu = g => g.translate(CT, H, 0);
  // capacul parterului (dispare odată cu etajul, ca să se vadă parterul de sus)
  mk(merge([sweepG(pg, arcTop(H, .28)), capG(pg, H, .28, true)]), U.shell, up);
  mk(capG(pg, 3.02, .1, false), U.ceil, up, false);
  [-.95, .95].forEach(z => up.add(box(8.2, .02, .05, U.ledIn, 0, 3.0, z)));
  // pereții etajului
  const WUF = [[sA + .1, u0], [5.85, u0], [6.75, d0], [6.75, d1], [5.85, u1], [sA + .1, u1]];                              // geamul mare din față
  const wb = sB - 1.95, wt = sB - 2.85;
  const WUB = [[sB - .1, u0], [wb, u0], [wt, d0], [wt, d1], [wb, u1], [sB - .1, u1]];                                      // geamul din spate
  const sE = pt.sLeft(0), oF = 7.8, oB = wt - 1.05;                                                                        // ușa de la scară; panourile octogonale pline
  const sU = [], KU = seamKit(sU);
  KU.hz(6.75, wt, u1); KU.hz(6.75, wt, u0);
  for (let s = sA + 1.1; s < sB; s += 2.25) { KU.vt(s, u1 + .02, UW1); KU.vt(s, UB, u0 - .02); }
  KU.vt(pt.starts[1], u0, u1); KU.vt(pt.starts[4], u0, u1);
  KU.dg([6.15, u1], [7.05, d1]); KU.vt(7.05, d0, d1); KU.dg([7.05, d0], [6.15, u0]);
  KU.dg([wb - .3, u1], [wt - .3, d1]); KU.vt(wt - .3, d0, d1); KU.dg([wt - .3, d0], [wb - .3, u0]);
  storey(pt, U, up, CT, H, {
    walls: [rect(sA, sB, u1, UW1), rect(sA, sB, UB, u0), rect(sA, sA + .1, u0, u1), rect(sB - .1, sB, u0, u1), rect(6.75, wt, u0, u1),
      [[5.85, u0], [6.75, u0], [6.75, d0]], [[5.85, u1], [6.75, u1], [6.75, d1]], [[wb, u0], [wt, u0], [wt, d0]], [[wb, u1], [wt, u1], [wt, d1]]],
    yIn: UF, inner: [rect(sA, sB, UF, UB)], seams: sU, panels: [oct(oF, .34, 3.06, .56, .28), oct(oB, .34, 3.06, .56, .28), oct(sE, .27, 2.75)],
    wins: [WUF, WUB], mull: [[WUF, [sA + 1.6]], [WUB, [sB - 1.5]]], y0: u0, y1: u1,
  });
  mk(tu(sweepG(pt, [{ d: 0, y: UW1 + .002 }, { d: TW, y: UW1 + .002 }], sA, sB)), U.cut, up, false);
  up.add(box(.05, .2, .05, U.frame, -5.75 - .055, H + 1.5, .34));                                                          // mânerul ușii de la scară
  // baza etajului + bordura terasei (o singură bandă rotunjită), pardoseala, puntea terasei
  mk(tu(merge([sweepG(pt, arcBottom(.03, .22)), sweepG(pt, [{ d: 0, y: UB }, { d: .09, y: UB }], tA, tB), sweepG(pt, [{ d: .09, y: UB }, { d: .09, y: UF }], tA, tB)])), U.shell, up);
  mk(tu(capG(pt, .03, .22, false)), U.cut, up, false);                                                                     // rostul închis la culoare dintre cele două module
  mk(tu(capG(pt, UF, .1, true, sA, sB)), U.floor, up, false);
  mk(tu(capG(pt, UF, .09, true, tA, tB)), U.wood, up, false);
  const pl = batch(), ri = pt.r - .09;
  for (let z = -1.4; z < 1.41; z += .2) { const a = Math.abs(z), xe = (a <= pt.e ? pt.L / 2 - .09 : pt.a + Math.sqrt(ri * ri - (a - pt.e) ** 2)) + CT - .02; pl.box(xe - XW, .006, .012, (xe + XW) / 2, H + UF + .003, z); }
  pl.mesh(U.dark, up, false);
  // peretele de sticlă spre terasă: stâlpi la colțuri, buiandrug, uși glisante
  const zc = pt.w - .07, hw = pt.w - TW - .005;
  [-1, 1].forEach(f => up.add(box(TW, US - UB, TW, U.shell, XW - TW / 2, H + (US + UB) / 2, f * zc)));
  up.add(box(TW, UW1 - US, pt.w * 2 - .01, U.shell, XW - TW / 2, H + (UW1 + US) / 2, 0), box(TW, .004, hw * 2, U.cut, XW - TW / 2, H + UW1 + .002, 0));
  const gw = F.glazing(U, hw * 2, US - UF, 4); gw.position.set(XW - TW / 2, H + (US + UF) / 2, 0); gw.rotation.y = Math.PI / 2; up.add(gw);
  gw.traverse(o => { if (o.isMesh && o.material === U.glass) o.renderOrder = 2; });
  // balustrada de sticlă a terasei
  const rg = sweepG(pt, [{ d: .045, y: UB + .02 }, { d: .045, y: 1.22 }], tA, tB), rg2 = rg.clone(); rg2.index.array.reverse(); rg2.attributes.normal.array.forEach((v, i, a) => { a[i] = -v; });
  mk(tu(merge([rg, rg2])), U.railglass, up, false, false);
  const bar = (y, h) => sweepG(pt, [{ d: .02, y }, { d: .02, y: y + h }, { d: .07, y: y + h }, { d: .07, y }, { d: .02, y }], tA, tB);
  const posts = batch(), np = 9;
  for (let i = 0; i <= np; i++) { const p = pt.at(tA + (tB - tA) * i / np); posts.box(.045, 1.0, .045, p.x - p.nx * .045 + CT, H + UB + .5, p.z - p.nz * .045, Math.atan2(p.nx, p.nz)); }
  mk(merge([tu(bar(1.22, .04)), tu(bar(UB, .04)), posts.geo()]), U.frame, up);
  // interiorul etajului: dormitor cu dulap și birou; pe terasă o măsuță cu două scaune
  const ui = new THREE.Group(); ui.position.y = H + UF; up.add(ui);
  const rug = box(2.7, .015, 2.3, U.fabric, 0, .008, 0); rug.receiveShadow = true; put(ui, rug, -1.3, 0);
  put(ui, F.bed(U, 1.6, 2.0), -1.5, 0, Math.PI / 2); put(ui, F.wardrobe(U, 2.0, 2.1, .58), -3.8, -1.2);
  put(ui, F.desk(U, 1.2), -3.95, 1.2, Math.PI); put(ui, F.chair(U), -3.95, .62);
  put(ui, F.curtain(U, .5, 2.2), -1.72, 1.46); put(ui, F.curtain(U, .5, 2.2), -1.07, -1.46);
  put(ui, F.tableRound(U, .3, .7), 3.1, .3); put(ui, F.chair(U), 2.5, .3, Math.PI / 2); put(ui, F.chair(U), 3.7, .3, -Math.PI / 2);

  /* ================= ACOPERIȘUL ETAJULUI (set propriu R): muchie rotunjită, copertina de peste terasă, tavanul cu LED ================= */
  const k0 = pu.sBack(XW - CU), k1 = pu.total + pu.sFront(XW - CU), tr = g => g.translate(CU, H, 0);                       // copertina: k0…k1
  mk(tr(merge([sweepG(pu, arcTop(3.45, .28)), capG(pu, 3.45, .28, true), sweepG(pu, [{ d: 0, y: US }, { d: 0, y: UW1 }], k0, k1)])), R.shell, roof);
  mk(tr(merge([capG(pu, US, 0, false, k0, k1), capG(pu, 3.02, .1, false, k1 - pu.total, k0)])), R.ceil, roof, false);
  [-.9, .9].forEach(z => roof.add(box(5.0, .02, .05, R.ledIn, -2.5, H + 3.0, z), box(1.1, .02, .05, R.ledIn, 1.6, H + US - .011, z * .8)));

  /* ================= SCARA EXTERIOARĂ ȘI TURNUL DE OȚEL (rămân pe loc) ================= */
  const YL = H + .22, NR = 20, rise = YL / NR, run = .225, xT = -4.5, xB0 = xT + (NR - 1) * run, z1 = -1.92, z2 = -2.78, m = rise / run, yT = (xB0 - xT) * m;
  const st = batch(), td = batch();
  for (let i = 1; i < NR; i++) td.box(run + .03, .035, z1 - z2 - .06, xB0 - (i - .5) * run, i * rise - .0175, (z1 + z2) / 2);
  [z1, z2].forEach(z => {
    st.beam([xB0 + .1, -.16, z], [xT, yT - .08, z], .2, .04);                                                              // vangurile
    st.beam([xB0, 1.05, z], [xT, yT + 1.05, z], .04); st.beam([xB0, .55, z], [xT, yT + .55, z], .025);                     // mâna curentă
    for (let i = 0; i < NR - 1; i += 3) st.box(.035, 1.05, .035, xB0 - i * run, i * rise + .525, z);
    st.box(.035, 1.2, .035, xT, YL + .35, z);
  });
  // podestul ocolește colțul rotunjit al etajului
  const zf = .8, xl = -7.0, sh = new THREE.Shape(); sh.moveTo(xl, -zf);
  cuts(pt, pt.starts[1] + pt.r * (Math.PI / 2 - Math.asin((zf - pt.e) / pt.r)), pt.sBack(xT - CT)).forEach(s => { const p = pt.at(s); sh.lineTo(p.x + p.nx * .03 + CT, -(p.z + p.nz * .03)); });
  sh.lineTo(xT, -(z2 - .04)); sh.lineTo(xl, -(z2 - .04));
  const lg = new THREE.ExtrudeGeometry(sh, { depth: .08, bevelEnabled: false }); lg.rotateX(-Math.PI / 2); lg.translate(0, YL - .08, 0);
  mk(merge([lg, td.geo()]), M.steel, stair);
  // balustrada podestului
  const xr = xl + .04, zr = zf - .04, xw = -5.77, rp = [[xT, z2], [xr, z2], [xr, zr], [xw, zr]];
  for (let i = 0; i < 3; i++) { const a = rp[i], b = rp[i + 1], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 1.15));
    [[.95, .04], [.48, .025]].forEach(([h, t]) => st.beam([a[0], YL + h, a[1]], [b[0], YL + h, b[1]], t));
    for (let k = 1; k <= n; k++) st.box(.035, .95, .035, a[0] + (b[0] - a[0]) * k / n, YL + .475, a[1] + (b[1] - a[1]) * k / n); }
  // turnul: stâlpi, centuri, contravântuiri în X
  const yb = YL - .13, lA = [-6.95, -2.76], lB = [-6.95, .74], lC = [-5.88, .74], lD = [-4.56, -2.76], lE = [-4.56, -1.9];
  [lA, lB, lC, lD, lE].forEach(([x, z]) => st.box(.09, YL - .08, .09, x, (YL - .08) / 2, z));
  [[lA, lB], [lB, lC], [lA, lD], [lD, lE]].forEach(([a, b]) => [yb, 1.85].forEach(y => st.beam([a[0], y, a[1]], [b[0], y, b[1]], .09, .06)));
  [[lA, lB], [lA, lD]].forEach(([a, b]) => [[.12, 1.78], [1.92, yb - .08]].forEach(([ya, yc]) => { st.beam([a[0], ya, a[1]], [b[0], yc, b[1]], .04); st.beam([a[0], yc, a[1]], [b[0], ya, b[1]], .04); }));
  st.mesh(M.white, stair);

  return {
    root, levels: 2,
    // k: 0 = casa întreagă · 1 = fără acoperișul etajului · 2 = fără etaj (se vede parterul)
    openRoof(k) { F.lift(roof, R, Math.min(k, 1), 2.2); F.lift(up, U, k - 1, 2.6); },
    rooms: [
      { n: 'Dormitor', x: -1.5, y: H + 1.2, z: 0, lvl: 1 }, { n: 'Terasă', x: 3.0, y: H + 1.0, z: -.3, lvl: 1 },
      { n: 'Living', x: -4.3, y: 1.1, z: .2, lvl: 2 }, { n: 'Bucătărie', x: -1.6, y: 1.8, z: -1.1, lvl: 2 }, { n: 'Baie', x: .35, y: 2.0, z: .7, lvl: 2 }, { n: 'Dormitor', x: 3.3, y: 1.1, z: .4, lvl: 2 },
    ],
    // cutia e simetrică pe X față de origine, deși turnul scării iese doar la stânga (ansamblul real: x de la −7,0 la +5,75)
    size: { w: 14.2, d: 5.9, h: 6.9, cz: -.05 },
  };
}
