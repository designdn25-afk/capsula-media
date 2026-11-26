// Capsula T7 (11,5 × 2,25 m, h 2,45 m): format de container 40HQ, cu toată latura lungă din sticlă.
// Carcasa e un „tub” alb cu colțuri rotunjite: văzută din față, o ramă albă în jurul vitrajului. Capetele și spatele sunt pline.
// Axe: X = lungimea (baia la −X, dormitorul la +X), vitrajul spre +Z. Stă pe o terasă joasă din lemn.
import { THREE, box, clamp } from './kit.js';
import * as F from './furn.js';

export const info = { id: 'T7', w: 11.5, d: 2.25, h: 2.45 };

const L = 11.5, D = 2.25, H = 2.45, RC = .35, T = .12;          // lungime, adâncime, înălțime, raza colțurilor, grosimea carcasei
const Y0 = .34, Y1 = Y0 + H, YC = 2.1, FY = Y0 + T + .02;         // baza carcasei, vârful, tăietura acoperișului, pardoseala
const HW = L / 2, IW = HW - T, ZF = D / 2, ZB = -D / 2;          // IW = jumătate din golul ramei
const ZI = ZB + T, ZG = ZF - .09;                               // fața interioară a spatelui; planul geamului (retras în ramă)
const SKY = [[0, [.4, .38, .38]], [.2, [.52, .49, .47]], [.33, [1.7, 1.65, 1.55]], [.45, [1.1, 1.15, 1.22]], [.8, [.8, .9, 1.08]], [1, [.62, .74, .98]]];   // ca la furn.pane

// contur în U cu colțuri rotunjite: închis la yBase, deschis la yOpen (yOpen sub yBase = U întors, pentru acoperiș); normalele arată în afară
function uPath(a, yBase, yOpen, r, n = 10) {
  const s = yOpen > yBase ? 1 : -1, p = [{ x: -a, y: yOpen, nx: -1, ny: 0 }];
  for (let i = 0; i <= n; i++) { const g = i / n * Math.PI / 2; p.push({ x: -a + r - r * Math.cos(g), y: yBase + s * (r - r * Math.sin(g)), nx: -Math.cos(g), ny: -s * Math.sin(g) }); }
  for (let i = n; i >= 0; i--) { const g = i / n * Math.PI / 2; p.push({ x: a - r + r * Math.cos(g), y: yBase + s * (r - r * Math.sin(g)), nx: Math.cos(g), ny: -s * Math.sin(g) }); }
  p.push({ x: a, y: yOpen, nx: 1, ny: 0 }); return p;
}
// fâșie netedă: conturul întins pe Z, între z0 și z1; inward = fața spre interiorul tubului
function strip(p, z0, z1, inward = false) {
  const pos = [], nor = [], idx = [], k = inward ? -1 : 1, a = p[0], b = p[1];
  p.forEach(q => { pos.push(q.x, q.y, z0, q.x, q.y, z1); nor.push(k * q.nx, k * q.ny, 0, k * q.nx, k * q.ny, 0); });
  const flip = ((b.y - a.y) * a.nx - (b.x - a.x) * a.ny) * k * (z1 - z0) < 0;
  for (let i = 0; i < p.length - 1; i++) { const A = 2 * i, B = A + 1, C = A + 2, E = A + 3; flip ? idx.push(A, B, C, B, E, C) : idx.push(A, C, B, B, C, E); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx); return g;
}
// formă plană între două contururi (sau conturul plin, dacă inner lipsește); m = −1 o oglindește pe X (pentru fețele dinspre spate)
function shape(outer, inner, holes = [], m = 1) {
  const pts = outer.map(q => new THREE.Vector2(m * q.x, q.y)); if (inner) for (let i = inner.length - 1; i >= 0; i--) pts.push(new THREE.Vector2(m * inner[i].x, inner[i].y));
  const sh = new THREE.Shape(pts);
  holes.forEach(([x0, y0, x1, y1]) => sh.holes.push(new THREE.Path([[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(([x, y]) => new THREE.Vector2(m * x, y)))));
  return sh;
}
// față plană la z; back = cu fața spre −Z
function face(outer, inner, z, back = false, holes = []) {
  const g = new THREE.ShapeGeometry(shape(outer, inner, holes, back ? -1 : 1)); if (back) g.rotateY(Math.PI); return g.translate(0, 0, z);
}
// ramă cu grosime (între două contururi), de la z0 spre +Z
const band = (outer, inner, z0, depth) => new THREE.ExtrudeGeometry(shape(outer, inner), { depth, bevelEnabled: false }).translate(0, 0, z0);
const bx = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
// mai multe piese mărunte din același material, lipite într-un singur mesh
function merge(list) {
  const pos = [], nor = [];
  list.forEach(g0 => { const g = g0.index ? g0.toNonIndexed() : g0; pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array); });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); return g;
}
// geam plan cu reflexia cerului; culorile urmează înălțimea din tot vitrajul (g0…g1), ca bucata de jos și cea din acoperiș să se continue
function skyGlass(x0, x1, ya, yb, g0, g1, z) {
  const ys = [ya, ...SKY.map(s => g0 + s[0] * (g1 - g0)).filter(y => y > ya + .001 && y < yb - .001), yb], pos = [], nor = [], col = [], idx = [];
  ys.forEach((y, j) => {
    const t = (y - g0) / (g1 - g0); let k = 0; while (k < SKY.length - 2 && t > SKY[k + 1][0]) k++;
    const a = SKY[k], b = SKY[k + 1], f = clamp((t - a[0]) / (b[0] - a[0])), c = a[1].map((v, i) => v + (b[1][i] - v) * f);
    pos.push(x0, y, z, x1, y, z); nor.push(0, 0, 1, 0, 0, 1); col.push(...c, ...c);
    if (j) { const i = 2 * j; idx.push(i - 2, i - 1, i + 1, i - 2, i + 1, i); }
  });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); return g;
}

export function build(M) {
  const R = F.fadeSet(M);                                        // materialele acoperișului (se sting când se ridică)
  const GF = F.fadeSet(M);                                       // geamul fațadei: mai străveziu când acoperișul e ridicat, ca să se vadă interiorul
  const root = new THREE.Group(), roof = new THREE.Group(), inn = new THREE.Group(), up = new THREE.Group(); root.name = 'T7';
  inn.position.y = up.position.y = FY; root.add(inn, roof); roof.add(up);   // inn = interiorul (de la pardoseală); up = piesele interioare de deasupra tăieturii
  const mesh = (g, m, parent = root, cast = true, recv = true) => { const o = new THREE.Mesh(g, m); o.castShadow = cast; o.receiveShadow = recv; parent.add(o); return o; };
  const accent = new THREE.MeshStandardMaterial({ color: 0x7b7e84, roughness: .9 }), RL = F.fadeSet({ accent });   // peretele gri din living (material local)

  /* ---- carcasa: partea de jos (fund + capete, până la tăietură) și acoperișul (colțurile de sus + tavanul) ---- */
  const oLo = uPath(HW, Y0, YC, RC), iLo = uPath(IW, Y0 + T, YC, RC - T), oUp = uPath(HW, Y1, YC, RC), iUp = uPath(IW, Y1 - T, YC, RC - T);
  const WIN = [[-4.33, 1.62, -3.83, 2.02], [4.0, 1.62, 5.2, 2.02]];                 // ferestrele mici din spate: baie, dormitor (x0, y0, x1, y1)
  const rect = (y0, y1) => [{ x: -IW, y: y0 }, { x: IW, y: y0 }, { x: IW, y: y1 }, { x: -IW, y: y1 }];
  mesh(strip(oLo, ZB, ZF), M.shell);
  mesh(strip(iLo, ZG - .02, ZF, true), M.shell, root, false);                       // glaful alb din fața geamului
  mesh(strip(iLo, ZI, ZG - .02, true), M.inner, root, false);                       // capetele, pe interior
  mesh(face(oLo, iLo, ZF), M.shell);                                                // rama albă din față
  mesh(face(oLo, null, ZB, true, WIN), M.shell);                                    // spatele
  mesh(face(rect(Y0 + T, YC), null, ZI, false, WIN), M.inner, root, false);
  mesh(strip(oUp, ZB, ZF), R.shell, roof);
  mesh(strip(iUp, ZG - .02, ZF, true), R.shell, roof, false);
  mesh(strip(iUp, ZI, ZG - .02, true), R.ceil, roof, false);                        // tavanul
  mesh(face(oUp, iUp, ZF), R.shell, roof);
  mesh(face(oUp, null, ZB, true), R.shell, roof);
  mesh(face(rect(YC, Y1 - T), null, ZI), R.inner, roof, false);
  // grosimea pereților, văzută de sus când acoperișul e ridicat
  mesh(merge([-1, 1].map(s => bx(T - .012, .006, D - .012, s * (HW - T / 2), YC - .002, 0)).concat(bx(2 * IW, .006, T - .012, 0, YC - .002, ZB + T / 2))), M.cut, root, false);
  // rosturi fine între panouri
  const smLo = [], smUp = [];
  [-3.45, -1.15, 1.15, 3.45].forEach(x => {
    smLo.push(bx(.024, T - .05, .006, x, Y0 + T / 2 - .005, ZF), bx(.024, YC - Y0 - .1, .006, x, (YC + Y0 + .1) / 2, ZB));
    smUp.push(bx(.024, .006, D, x, Y1, 0), bx(.024, T - .05, .006, x, Y1 - T / 2 + .005, ZF), bx(.024, Y1 - YC, .006, x, (Y1 + YC) / 2, ZB));
  });
  [-1, 1].forEach(s => smLo.push(bx(.006, .024, D, s * HW, 1.22, 0), bx(.006, .024, D, s * HW, YC - .012, 0)));
  smLo.push(bx(L, .024, .006, 0, YC - .012, ZB));
  mesh(merge(smLo), M.seam, root, false); mesh(merge(smUp), R.seam, roof, false);

  /* ---- vitrajul: geam pe toată lungimea, ramă neagră, 11 panouri, unul fiind ușa glisantă ---- */
  const frLo = [], frUp = [], NP = 11, pw = 2 * IW / NP, gy0 = Y0 + T + .05, gy1 = Y1 - T - .05;
  frLo.push(band(iLo, uPath(IW - .05, gy0, YC, RC - T - .05), ZG - .025, .05));
  frUp.push(band(iUp, uPath(IW - .05, gy1, YC, RC - T - .05), ZG - .025, .05));
  const post = (w, d, x, z) => { frLo.push(bx(w, YC - gy0, d, x, (YC + gy0) / 2, z)); frUp.push(bx(w, gy1 - YC, d, x, (gy1 + YC) / 2, z)); };
  for (let k = 1; k < NP; k++) post(.05, .05, -IW + k * pw, ZG);
  const dx0 = -IW + 3 * pw + .025, dx1 = dx0 + pw - .05, dxc = (dx0 + dx1) / 2, dz = ZG + .032;   // ușa glisantă: canat cu ramă mai groasă, în fața bucătăriei
  post(.06, .04, dx0 + .03, dz); post(.06, .04, dx1 - .03, dz);
  frLo.push(bx(dx1 - dx0, .07, .04, dxc, gy0 + .035, dz)); frUp.push(bx(dx1 - dx0, .07, .04, dxc, gy1 - .035, dz));
  root.add(box(.03, .36, .035, M.steel, dx1 - .03, FY + 1.02, dz + .035));
  const gx = IW - .02, ga = Y0 + T + .02, gb = Y1 - T - .02;
  mesh(skyGlass(-gx, gx, ga, YC, ga, gb, ZG), GF.glass, root, false, false);
  mesh(skyGlass(-gx, gx, YC, gb, ga, gb, ZG), R.glass, roof, false, false);
  // banda LED pe conturul vitrajului
  mesh(face(uPath(IW + .022, Y0 + T - .022, YC, RC - T + .022), iLo, ZF + .003), M.led, root, false);
  mesh(face(uPath(IW + .022, Y1 - T + .022, YC, RC - T + .022), iUp, ZF + .003), R.led, roof, false);
  // ferestrele din spate
  WIN.forEach(([x0, y0, x1, y1]) => {
    const xc = (x0 + x1) / 2, yc = (y0 + y1) / 2, w = x1 - x0, h = y1 - y0, zc = ZB + T / 2;
    frLo.push(bx(w + .08, .04, T + .03, xc, y1 + .02, zc), bx(w + .08, .04, T + .03, xc, y0 - .02, zc), bx(.04, h, T + .03, x0 - .02, yc, zc), bx(.04, h, T + .03, x1 + .02, yc, zc));
    const p = F.pane(w, h, M.glass); p.rotation.y = Math.PI; p.position.set(xc, yc, ZB + .04); root.add(p);
  });

  /* ---- pardoseala, tavanul cu benzi LED ---- */
  mesh(bx(2 * IW - .01, .04, ZG - .02 - ZI, 0, FY - .02, (ZG - .02 + ZI) / 2), M.floor, root, false);
  mesh(merge([-.45, .5].map(z => bx(8.6, .015, .04, 0, Y1 - T - .009, z))), R.ledIn, roof, false, false);

  /* ---- interiorul (schemă după imaginea din catalog): baie · bucătărie cu bar · living · dormitor ---- */
  const HC = YC - FY, HT = Y1 - T - FY, zp = -.02, wLo = [], wUp = [];              // înălțimi de la pardoseală: tăietura, tavanul; zp = peretele băii
  const wall = (x0, x1, z0, z1) => { const w = x1 - x0, d = z1 - z0, x = (x0 + x1) / 2, z = (z0 + z1) / 2; wLo.push(bx(w, HC, d, x, HC / 2, z)); wUp.push(bx(w, HT - HC, d, x, (HT + HC) / 2, z)); };
  const put = (o, x, z, ry = 0) => { o.position.set(x, 0, z); o.rotation.y = ry; inn.add(o); return o; };
  // baia: în spate-stânga, după un perete cu ușă de sticlă mată; lavoarul e în fața ei, pe peretele de capăt
  wall(-IW + .005, -4.34, zp - .03, zp + .03); wall(-3.72, -3.55, zp - .03, zp + .03); wall(-3.61, -3.55, ZI, zp - .03);
  wUp.push(bx(.62, HT - 2.09, .06, -4.03, (HT + 2.09) / 2, zp));
  [-4.32, -3.74].forEach(x => { frLo.push(bx(.04, HC, .08, x, FY + HC / 2, zp)); frUp.push(bx(.04, 2.05 - HC, .08, x, FY + (2.05 + HC) / 2, zp)); });
  frUp.push(bx(.62, .04, .08, -4.03, FY + 2.07, zp));
  inn.add(box(.54, HC, .02, M.showerglass, -4.03, HC / 2, zp)); up.add(box(.54, 2.05 - HC, .02, R.showerglass, -4.03, (2.05 + HC) / 2, zp));
  put(F.shower(M, .85, .85), -IW + .44, ZI + .44).scale.y = .82;
  put(F.wc(M), -4.03, ZI + .34);
  inn.add(box(.46, .36, .7, M.clad, -IW + .25, .52, .5), box(.5, .1, .74, M.white, -IW + .26, .75, .5), box(.14, .55, .6, M.steel, -IW + .08, 1.32, .5));
  // bucătăria: frigider, corpuri albe cu blat negru, bar negru cu două scaune; dulapurile de sus se ridică odată cu acoperișul
  inn.add(box(.72, HC, .6, M.steel, -3.16, HC / 2, ZI + .3));
  inn.add(box(1.8, .86, .58, M.white, -1.9, .43, ZI + .29), box(1.82, .04, .62, M.black, -1.9, .88, ZI + .31), box(.46, .012, .36, M.steel, -2.4, .905, ZI + .31));
  inn.add(box(.6, .93, .8, M.black, -1.37, .465, .01));
  put(F.chair(M, M.clad), -1.94, .06, Math.PI / 2); put(F.chair(M, M.clad), -.8, .06, -Math.PI / 2);
  mesh(merge([bx(.72, HT - HC, .6, -3.16, (HT + HC) / 2, ZI + .3), bx(.43, .52, .34, -2.585, HT - .26, ZI + .17), bx(.47, .52, .34, -1.235, HT - .26, ZI + .17)]), R.white, up, false);
  up.add(box(.9, .52, .34, R.wood, -1.92, HT - .26, ZI + .17));
  // livingul: perete gri cu tablouri, canapea, măsuță, lampadar
  inn.add(box(3.5, HC, .02, accent, .77, HC / 2, ZI + .011)); up.add(box(3.5, HT - HC, .02, RL.accent, .77, (HT + HC) / 2, ZI + .011));
  const PIC = [[.42, 1.22, .3, .44], [.84, 1.3, .34, .52], [1.32, 1.42, .38, .3], [1.32, 1.07, .42, .34], [1.8, 1.26, .3, .46]];   // x, y, lățime, înălțime
  mesh(merge(PIC.map(([x, y, w, h]) => bx(w, h, .03, x, y, ZI + .036))), M.white, inn, false);
  mesh(merge(PIC.map(([x, y, w, h]) => bx(w - .1, h - .1, .03, x, y, ZI + .04))), M.fabric, inn, false);
  put(F.sofa(M, 2.4, M.fabric), 1.28, ZI + .43);
  [[.72, M.clad], [1.84, M.stone]].forEach(([x, m]) => { const c = box(.4, .3, .12, m, x, .57, ZI + .3); c.rotation.x = -.22; inn.add(c); });
  inn.add(box(1.2, .04, .5, M.wood, 1.28, .36, .3));
  mesh(merge([[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => bx(.03, .34, .03, 1.28 + a * .54, .17, .3 + b * .2))), M.dark, inn, false);
  const rg = F.rug(M, 2.5, 1.2); rg.position.x = 1.2; rg.position.z = .2; inn.add(rg);
  mesh(merge([new THREE.CylinderGeometry(.014, .014, 1.2, 8).translate(-.62, .6, -.72), new THREE.CylinderGeometry(.13, .13, .02, 16).translate(-.62, .01, -.72)]), M.dark, inn, false);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(.1, .15, .26, 16), M.lamp); shade.position.set(-.62, 1.31, -.72); inn.add(shade);
  // dormitorul: pat cu tăblia la peretele din spate, lambriu de lemn, noptieră
  wall(2.525, 2.595, ZI, .25);
  put(F.bed(M, 1.7, 1.85), 4.62, ZI + 1.03);
  inn.add(box(1.87, 1.05, .02, M.wood, 4.685, .525, ZI + .011), box(.02, 1.05, ZG - .03 - ZI, M.wood, IW - .011, .525, (ZG - .03 + ZI) / 2));
  inn.add(box(.42, .46, .4, M.white, 3.5, .23, ZI + .22));
  mesh(merge(wLo), M.inner, inn, false); mesh(merge(wUp), R.inner, up, false);
  mesh(merge(frLo), M.frame, root, false); mesh(merge(frUp), R.frame, roof, false);
  [inn, up].forEach(g => g.traverse(o => { if (o.isMesh) { o.castShadow = false; if (o.material.transparent) o.renderOrder = -1; } }));   // piesele străvezii din interior se desenează înaintea geamului fațadei

  /* ---- terasa joasă din lemn, treptele din dreptul ușii, soclul retras ---- */
  const dk = F.deck(M, L + 1.2, 4.05, .3); dk.position.z = .7; root.add(dk);
  const st = F.steps(M, 1.5, 2, .1, .3, M.wood); st.position.set(dxc, 0, 2.725 + .45); root.add(st);
  root.add(box(L - .9, .07, D - .2, M.dark, 0, .31, 0));

  return {
    root, levels: 1,
    openRoof(k) { F.lift(roof, R, k, 2.2); const f = clamp(clamp(k) * 1.3); RL.fade(f); GF.fade(f * .6); },
    rooms: [{ n: 'Baie', x: -4.7, y: 2.0, z: -.5, lvl: 1 }, { n: 'Bucătărie', x: -2.1, y: 1.7, z: -.6, lvl: 1 }, { n: 'Living', x: 1.2, y: 1.2, z: .1, lvl: 1 }, { n: 'Dormitor', x: 4.5, y: 1.3, z: .05, lvl: 1 }],
    size: { w: 12.7, d: 4.65, h: 2.79, cz: 1.0 },
  };
}
