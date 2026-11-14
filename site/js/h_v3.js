// V3 — căsuță mică în formă de „casă”: pereți drepți + acoperiș în două ape, cu muchii rotunjite (6,4 × 3,3 × 3,3 m).
// Coama e pe Z. Fațada cu vitraj e spre +Z, retrasă sub copertină, cu balcon. Ușa glisantă mare și luminatorul sunt pe latura −X, spre terasă.
import { THREE, box, grow, clipPoly, clamp } from './kit.js';
import * as F from './furn.js';

export const info = { id: 'V3', w: 6.4, d: 3.3, h: 3.3 };

const HW = 1.65, ZB = -3.2, ZF = 3.2, ZG = 2.6;                    // jumătate din lățime, spatele, fața carcasei, planul vitrajului din față
const Y0 = .16, YF = .45, YE = 2.2, YT = 3.3, YC = 2.08, TW = .09; // sub carcasă, pardoseală, streașină, coamă, tăietura pereților, grosimea peretelui
const YG = 2.5, DH = .43, DW = 1.8, DF = 1.2;                      // vârful vitrajului din față; terasa: înălțime, lățimea de pe latură, adâncimea din față

/* ---------- unelte locale ---------- */
// adună poligoane convexe într-o singură geometrie; n = o normală pentru tot poligonul sau câte una pe vârf (fețele se orientează după ea)
function builder() {
  const pos = [], nor = [], col = [], idx = [];
  const B = {
    poly(pts, n, c) {
      const m = pts.length; if (m < 3) return B; const base = pos.length / 3, each = Array.isArray(n[0]), n0 = each ? n[0] : n;
      let ax = 0, ay = 0, az = 0;
      for (let i = 0; i < m; i++) { const p = pts[i], q = pts[(i + 1) % m]; ax += (p[1] - q[1]) * (p[2] + q[2]); ay += (p[2] - q[2]) * (p[0] + q[0]); az += (p[0] - q[0]) * (p[1] + q[1]); }
      const flip = ax * n0[0] + ay * n0[1] + az * n0[2] < 0;
      pts.forEach((p, i) => { const k = each ? n[i] : n; pos.push(p[0], p[1], p[2]); nor.push(k[0], k[1], k[2]); if (c) col.push(c[i][0], c[i][1], c[i][2]); });
      for (let i = 1; i < m - 1; i++) flip ? idx.push(base, base + i + 1, base + i) : idx.push(base, base + i, base + i + 1);
      return B;
    },
    geo() {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      if (col.length) g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); return g;
    },
  };
  return B;
}

// secțiunea casei, parcursă cu lungimea de arc u: mijlocul fundului → peretele −X → coamă → peretele +X → înapoi la fund
function profile() {
  const RB = .1, RE = .22, RR = .16, SEG = 6;
  let yr = YT; for (let i = 0; i < 6; i++) yr = YT + RR * (Math.hypot(HW, yr - YE) / HW - 1);          // vârful ascuțit, ca rotunjirea coamei să ajungă exact la YT
  const C = [[0, Y0, 0], [-HW, Y0, RB], [-HW, YE, RE], [0, yr, RR], [HW, YE, RE], [HW, Y0, RB], [0, Y0, 0]], nodes = [], arcs = []; let u = 0;
  const push = (x, y, nx, ny) => { const l = nodes[nodes.length - 1]; if (l) u += Math.hypot(x - l.x, y - l.y); nodes.push({ u, x, y, nx, ny }); };
  C.forEach(([x, y, r], i) => {
    if (!r) { push(x, y, 0, -1); return; }
    const a = C[i - 1], b = C[i + 1], la = Math.hypot(x - a[0], y - a[1]), lb = Math.hypot(b[0] - x, b[1] - y);
    const ax = (x - a[0]) / la, ay = (y - a[1]) / la, bx = (b[0] - x) / lb, by = (b[1] - y) / lb, mx = -ay, my = ax;   // (mx, my) = normala spre exterior
    const phi = Math.acos(clamp(ax * bx + ay * by, -1, 1)), t = r * Math.tan(phi / 2), cx = x - ax * t - mx * r, cy = y - ay * t - my * r, arc = [];
    for (let k = 0; k <= SEG; k++) { const g = -phi * k / SEG, nx = mx * Math.cos(g) - my * Math.sin(g), ny = mx * Math.sin(g) + my * Math.cos(g); push(cx + nx * r, cy + ny * r, nx, ny); if (!k || k === SEG) arc.push(u); }
    arcs.push(arc);
  });
  const at = (v, off = 0) => {
    let i = 1; while (i < nodes.length - 1 && nodes[i].u < v) i++;
    const a = nodes[i - 1], b = nodes[i], f = clamp((v - a.u) / ((b.u - a.u) || 1)), nx = a.nx + (b.nx - a.nx) * f, ny = a.ny + (b.ny - a.ny) * f, l = Math.hypot(nx, ny) || 1;
    return { x: a.x + (b.x - a.x) * f + nx / l * off, y: a.y + (b.y - a.y) * f + ny / l * off, nx: nx / l, ny: ny / l };
  };
  return {
    nodes, U: u, at, uA: arcs[0][0], LS: arcs[2][0] - arcs[1][1],
    outline: (off = 0) => nodes.slice(0, -1).map(n => [n.x + n.nx * off, n.y + n.ny * off]),   // conturul (x, y), mutat cu off
    uL: y => arcs[0][1] + y - Y0 - RB,                                                           // u la înălțimea y, pe peretele −X
    uS: s => arcs[1][1] + s,                                                                     // u la distanța s pe panta −X, de la streașină
  };
}

// bucăți desenate în coordonate desfășurate (u, z) și așezate pe secțiune; off = cât ies în afară; inward = cu fața spre interior
function skin(B, P, polys, off = 0, inward = false) {
  const s = inward ? -1 : 1;
  polys.forEach(poly => {
    const us = poly.map(p => p[0]), lo = Math.min(...us), hi = Math.max(...us);
    for (let i = 1; i < P.nodes.length; i++) {
      const a = P.nodes[i - 1].u, b = P.nodes[i].u; if (b - a < 1e-7 || b <= lo + 1e-7 || a >= hi - 1e-7) continue;
      const piece = clipPoly(clipPoly(poly, a, true), b, false); if (piece.length < 3) continue;
      const q = piece.map(p => P.at(p[0], off)); B.poly(piece.map((p, k) => [q[k].x, q[k].y, p[1]]), q.map(p => [p.nx * s, p.ny * s, 0]));
    }
  });
  return B;
}
const clipY = (poly, lo, hi) => { let p = poly; if (lo !== null) p = clipPoly(p, lo, true, 1); if (hi !== null) p = clipPoly(p, hi, false, 1); return p; };
const flat = (B, pts, z, s) => B.poly(pts.map(p => [p[0], p[1], z]), [0, 0, s]);                 // poligon în planul z, cu fața spre +Z (s = 1) sau −Z
const rc = (a0, a1, b0, b1) => [[a0, b0], [a1, b0], [a1, b1], [a0, b1]];
const ringOf = (o, i) => o.map((p, k) => [p, o[(k + 1) % o.length], i[(k + 1) % i.length], i[k]]);
const dedupe = p => p.filter((q, i) => { const r = p[(i + 1) % p.length]; return Math.hypot(q[0] - r[0], q[1] - r[1]) > 1e-5; });

// geam plan cu reflexia cerului (aceleași trepte ca F.pane), pentru forme care nu sunt dreptunghi; yA…yB = înălțimea întregului vitraj
const SKY = [[0, [.4, .38, .38]], [.2, [.52, .49, .47]], [.33, [1.7, 1.65, 1.55]], [.45, [1.1, 1.15, 1.22]], [.8, [.8, .9, 1.08]], [1, [.62, .74, .98]]];
const skyAt = t => { let k = 0; while (k < SKY.length - 2 && t > SKY[k + 1][0]) k++; const a = SKY[k], b = SKY[k + 1], f = clamp((t - a[0]) / (b[0] - a[0])); return a[1].map((v, i) => v + (b[1][i] - v) * f); };
function skyGlass(B, poly, yA, yB, z) {
  for (let j = 0; j < SKY.length - 1; j++) {
    const piece = clipY(poly, yA + (yB - yA) * SKY[j][0], yA + (yB - yA) * SKY[j + 1][0]);
    if (piece.length > 2) B.poly(piece.map(p => [p[0], p[1], z]), [0, 0, 1], piece.map(p => skyAt((p[1] - yA) / (yB - yA))));
  }
  return B;
}

export function build(M) {
  const P = profile(), U = P.U, R = F.fadeSet(M);
  const root = new THREE.Group(); root.name = 'V3';
  const roof = new THREE.Group(); roof.name = 'roof'; root.add(roof);
  const mesh = (g, m, parent = root, cast = true, recv = true) => { const o = new THREE.Mesh(g.geo ? g.geo() : g, m); o.castShadow = cast; o.receiveShadow = recv; parent.add(o); return o; };
  const put = (o, x, y, z, ry = 0, parent = root) => { o.position.set(x, y, z); o.rotation.y = ry; parent.add(o); return o; };
  const solid = (...a) => { const b = box(...a); b.castShadow = true; b.receiveShadow = true; root.add(b); return b; };

  // lemnul cald din interior: material local; seara se aprinde odată cu M.inner. Copia pentru tavan (WR) se stinge odată cu acoperișul.
  const WI = new THREE.MeshStandardMaterial({ color: 0xcfa878, roughness: .78, emissive: 0xffb877, emissiveIntensity: 0 });
  const RL = F.fadeSet({ wood: WI }), WR = RL.wood;
  WI.onBeforeRender = WR.onBeforeRender = () => { WI.emissiveIntensity = WR.emissiveIntensity = (M.inner.emissiveIntensity || 0) * 1.05; };

  const ZI = ZB + TW, XI = HW - TW;                                  // fețele interioare ale pereților
  const EP = .004, YC1 = YC + EP;                                    // pereții urcă puțin pe sub acoperiș, ca să nu rămână fante la îmbinare
  const uA = P.uA, uC = P.uL(YC), uC1 = P.uL(YC1), uF = P.uL(YF), uH = P.uL(DH);
  const DZ0 = -1.3, DZ1 = .75, DY1 = 1.95, uD1 = P.uL(DY1);          // ușa glisantă de pe latura −X
  const wallL = (z0, z1, ua) => {                                    // peretele −X, cu golul ușii (grilă, ca muchiile vecine să aibă aceleași vârfuri)
    const us = [ua, uF, uD1, uC1], zs = [z0, DZ0, DZ1, z1], o = [];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (i !== 1 || j !== 1) o.push(rc(us[i], us[i + 1], zs[j], zs[j + 1]));
    return o;
  };
  const ledRim = (B, lo, hi) => { ringOf(P.outline(-TW + .03), P.outline(-TW)).forEach(q => { const c = clipY(q, lo, hi); if (c.length > 2) flat(B, c, ZF + .003, 1); }); return B; };   // banda arămie de pe muchia copertinei
  const rim = (B, lo, hi) => { const o = P.outline(), n = P.outline(-TW); ringOf(o, n).forEach(q => { const c = clipY(q, lo, hi); if (c.length > 2) flat(B, c, ZF, 1); }); return B; };

  /* ---- carcasa albă, până la tăietură (YC) ---- */
  const sh = skin(builder(), P, [...wallL(ZB, ZF, uA), rc(U - uC1, U - uA, ZB, ZF)]);
  flat(sh, clipY(P.outline(), null, YC1), ZB, -1);                   // frontonul din spate
  skin(sh, P, [rc(uH - .03, uC1, ZG, ZF), rc(U - uC1, U - uH + .03, ZG, ZF)], -TW, true);   // interiorul copertinei
  rim(sh, DH, YC1);                                                  // muchia din față a copertinei
  mesh(sh, M.shell);
  mesh(skin(builder(), P, [rc(0, uA, ZB, ZF), rc(U - uA, U, ZB, ZF)]), M.dark, root, false);
  // inelul închis la culoare al pereților tăiați (ținut la câțiva mm de fețele albe, ca să nu se întrevadă prin ele)
  [-1, 1].forEach(s => root.add(box(TW - .009, .004, ZF - ZB - .016, M.cut, s * (XI + .001 + (TW - .009) / 2), YC + .001, 0)));
  root.add(box(2 * XI, .004, TW - .009, M.cut, 0, YC + .001, ZB + .008 + (TW - .009) / 2));
  // rosturile dintre panouri (cele de pe acoperiș stau în grupul lui)
  const SW = .011, ZS = [-1.86, DZ0 - .06, DZ1 + .06, 1.36], sm = builder(), smR = builder(), um = P.uS(P.LS * .52);
  ZS.forEach(z => { skin(sm, P, [rc(uA, uC, z - SW, z + SW), rc(U - uC, U - uA, z - SW, z + SW)], .004); skin(smR, P, [rc(uC, U - uC, z - SW, z + SW)], .004); });
  skin(smR, P, [rc(um - SW, um + SW, ZB, ZS[1]), rc(um - SW, um + SW, ZS[2], ZF), rc(U - um - SW, U - um + SW, ZB, ZF)], .004);
  [-.55, .55].forEach(x => { const st = clipPoly(clipPoly(P.outline(), x - SW, true, 0), x + SW, false, 0); flat(sm, clipY(st, Y0 + .1, YC), ZB - .004, -1); flat(smR, clipY(st, YC, null), ZB - .004, -1); });
  mesh(sm, M.seam, root, false);
  // tălpile
  [-2.7, 0, 2.7].forEach(z => [-1.2, 1.2].forEach(x => solid(.3, Y0 + .01, .3, M.stone, x, (Y0 + .01) / 2, z)));

  /* ---- interiorul: lambriu pe pereți, pardoseală ---- */
  const li = skin(builder(), P, [...wallL(ZI, ZG, uF - .03), rc(U - uC1, U - uF + .03, ZI, ZG)], -TW, true);
  flat(li, clipY(P.outline(-TW), YF - .03, YC1), ZI, 1);
  mesh(li, WI, root, false);
  const fl = box(2 * XI, .05, ZG - ZI, M.floor, 0, YF - .025, (ZG + ZI) / 2); fl.receiveShadow = true; root.add(fl);
  root.add(box(2 * XI, .05, ZF - ZG, M.wood, 0, DH - .025, (ZF + ZG) / 2));                    // podeaua de sub copertină

  /* ---- ușa glisantă spre terasă (latura −X) ---- */
  const dw = DZ1 - DZ0, dh = DY1 - YF, dz = (DZ0 + DZ1) / 2, dx = -HW + TW / 2, FB = .07, FT = TW + .04;
  root.add(box(FT, FB, dw, M.frame, dx, YF + FB / 2, dz), box(FT, FB, dw, M.frame, dx, DY1 - FB / 2, dz));
  [DZ0 + FB / 2, dz, DZ1 - FB / 2].forEach(z => root.add(box(FT, dh - 2 * FB, FB, M.frame, dx, YF + dh / 2, z)));
  put(F.pane(dw - FB, dh - FB, M.glass), dx, YF + dh / 2, dz, -Math.PI / 2);
  mesh(skin(builder(), P, [rc(uD1, uD1 + .03, DZ0 - .03, DZ1 + .03), rc(uF, uD1, DZ0 - .03, DZ0), rc(uF, uD1, DZ1, DZ1 + .03)], .006), M.led, root, false);

  /* ---- vitrajul din față, retras sub copertină: partea de jos (restul ține de acoperiș) ---- */
  const GO = dedupe(clipY(P.outline(-TW), YF, YG)), GI = grow(GO, -.07), GG = grow(GO, -.02), FD = .08, XM = .2;
  root.add(box(2 * XI, .07, FD, M.frame, 0, YF + .035, ZG), box(.06, YC - YF - .07, FD, M.frame, XM, (YF + .07 + YC) / 2, ZG));
  [-1, 1].forEach(s => root.add(box(.07, YC - YF - .07, FD, M.frame, s * (XI - .035), (YF + .07 + YC) / 2, ZG)));
  mesh(skyGlass(builder(), clipY(GG, null, YC), YF, YG, ZG), M.glass, root, false, false);
  mesh(ledRim(builder(), DH, YC), M.led, root, false);

  /* ---- fereastra mică a băii, pe frontonul din spate ---- */
  put(F.glazing(M, .62, .62, 1, .055), -.9, 1.64, ZB - .03, Math.PI);
  root.add(box(.52, .52, .004, M.inner, -.9, 1.64, ZB - .004));                               // seara pare luminată din interior

  /* ---- acoperișul: pantele, coama, luminatorul, tavanul și partea de sus a frontoanelor ---- */
  const rs = skin(builder(), P, [rc(uC, U - uC, ZB, ZF)]);
  flat(rs, clipY(P.outline(), YC, null), ZB, -1);
  skin(rs, P, [rc(uC, U - uC, ZG, ZF)], -TW, true);
  rim(rs, YC, null);
  flat(rs, clipY(P.outline(-TW), YG, null), ZG + .03, 1);                                     // triunghiul plin de deasupra vitrajului
  mesh(rs, R.shell, roof);
  mesh(smR, R.seam, roof, false);
  const rw = skin(builder(), P, [rc(uC, U - uC, ZI, ZG)], -TW, true);                         // tavanul din lemn
  flat(rw, clipY(P.outline(-TW), YC, null), ZI, 1); flat(rw, clipY(P.outline(-TW), YG, null), ZG - .03, -1);
  mesh(rw, WR, roof, false);
  const sk = rc(P.uS(.2), P.uS(1.5), DZ0 + .08, DZ1 - .08);                                   // luminatorul, pe panta −X
  mesh(skin(builder(), P, ringOf(sk, grow(sk, -.08)), .022), R.frame, roof, false);
  mesh(skin(builder(), P, [grow(sk, -.04)], .012), R.skyglass, roof, false, false);
  const gf = builder(); ringOf(GO, GI).forEach(q => { const c = clipY(q, YC, null); if (c.length > 2) { flat(gf, c, ZG + FD / 2, 1); flat(gf, c, ZG - FD / 2, -1); } });
  mesh(gf, R.frame, roof, false);
  roof.add(box(.06, YG - .07 - YC, FD, R.frame, XM, (YC + YG - .07) / 2, ZG));
  mesh(skyGlass(builder(), clipY(GG, YC, null), YF, YG, ZG), R.glass, roof, false, false);
  mesh(ledRim(builder(), YC, null), R.led, roof, false);
  roof.add(box(.05, .02, 4.6, R.ledIn, 0, YT - TW - .02, -.4));                               // banda LED de sub coamă

  /* ---- camerele: baia în spate, patul în dreptul ușii glisante, canapeaua lângă vitrajul din față ---- */
  const ZP = -1.95, PH = YC - YF;
  root.add(box(.37, PH, .07, WI, -XI + .185, YF + PH / 2, ZP), box(1.95, PH, .07, WI, XI - .975, YF + PH / 2, ZP));
  root.add(box(2 * XI - .004, .012, ZP - .035 - ZI, M.stone, 0, YF + .006, (ZP - .035 + ZI) / 2));
  // dușul și oglinda sunt scurtate, ca să încapă sub tavanul înclinat (și sub tăietura pereților)
  put(F.shower(M, .9, .9), 1.09, YF + .012, -2.62, Math.PI).scale.y = .82; put(F.vanity(M, .7), -.2, YF + .012, ZI + .255).scale.y = .84;
  put(F.wc(M), -1.22, YF + .012, -2.5, Math.PI / 2);
  put(F.bed(M, 1.6, 2), .47, YF, -.45, -Math.PI / 2);
  root.add(box(.32, .4, .32, M.wood, 1.38, YF + .2, .56), box(.03, .2, .03, M.dark, 1.38, YF + .5, .56));
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(.08, .12, .17, 16), M.lamp); shade.position.set(1.38, YF + .68, .56); root.add(shade);
  // dulapul deschis de lângă baie
  root.add(box(1.05, .28, .42, M.wood, .96, YF + .14, -1.7), box(1.05, .03, .03, M.wood, .96, YF + 1.6, -1.7));
  [-.51, .51].forEach(s => root.add(box(.03, 1.32, .03, M.wood, .96 + s, YF + .94, -1.7)));
  [[.62, M.white, .6], [.84, M.fabric, .52], [1.06, M.white, .64], [1.27, M.dark, .5]].forEach(([x, m, h]) => root.add(box(.16, h, .07, m, x, YF + 1.58 - h / 2, -1.7)));
  put(F.sofa(M, 1.8, M.fabric), .5, YF, ZG - .45, Math.PI);
  const cu = box(.34, .3, .1, new THREE.MeshStandardMaterial({ color: 0xd8a545, roughness: .9 }), -.12, YF + .56, ZG - .29); cu.rotation.x = .25; root.add(cu);
  root.add(box(.4, .03, .4, M.black, -.78, YF + .43, 2.26), box(.04, .42, .04, M.black, -.78, YF + .21, 2.26));

  /* ---- afară: terasa în L (balconul din față + latura cu ușa), trepte, balustradă, două fotolii ---- */
  put(F.deck(M, 2 * HW + DW, DF, DH), -DW / 2, 0, ZF + DF / 2);
  put(F.deck(M, ZF - ZB, DW, DH), -HW - DW / 2, 0, (ZF + ZB) / 2, Math.PI / 2);
  root.add(box(DW - .1, DH - .06, .1, M.dark, -HW - DW / 2, (DH - .06) / 2, ZF));
  put(F.steps(M, 1.2, 2, .145, .28, M.wood), -HW - DW / 2 - .15, 0, ZF + DF + .42);
  const zr = ZF + DF - .04;
  put(F.railing(M, 2 * HW - .08, 1, true), 0, DH, zr); put(F.railing(M, zr - ZF - .04, 1, true), HW - .04, DH, (zr + ZF + .04) / 2, Math.PI / 2);
  [put(F.armchair(M), -HW - .37, DH, -2.7, -Math.PI / 2), put(F.armchair(M), -HW - .37, DH, -1.85, -Math.PI / 2), put(F.coffee(M, .28), -HW - 1.2, DH, -2.28)]
    .forEach(g => g.traverse(o => { if (o.isMesh) o.castShadow = true; }));
  // inscripția „V3” de pe perete, ca în catalog (desenată local)
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128; const cx = cv.getContext('2d');
  cx.font = '700 112px Manrope, Arial, Helvetica, sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillStyle = '#17181b'; cx.fillText('V3', 128, 68);
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4;
  put(new THREE.Mesh(new THREE.PlaneGeometry(1.1, .55), new THREE.MeshStandardMaterial({ map: tx, transparent: true, depthWrite: false, roughness: .6 })), -HW - .006, 1.05, 2.28, -Math.PI / 2);

  const z1 = ZF + DF + .56;                                          // până la prima treaptă
  return {
    root, levels: 1,
    openRoof(k) { F.lift(roof, R, k, 2.2); RL.fade(clamp(clamp(k) * 1.3)); },
    rooms: [{ n: 'Dormitor', x: .3, y: 1.3, z: -.45, lvl: 1 }, { n: 'Living', x: .4, y: 1.3, z: 1.5, lvl: 1 }, { n: 'Baie', x: .1, y: 1.7, z: -2.55, lvl: 1 }, { n: 'Terasă', x: -2.6, y: 1, z: 1.4, lvl: 1 }],
    size: { w: 2 * (HW + DW), d: z1 - ZB, h: YT, cz: (z1 + ZB) / 2 },  // terasa e doar pe latura −X: cutia e simetrică pe X, ca să o cuprindă
  };
}
