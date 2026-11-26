// Casa T6 (5,85 × 4,17 m desfăcută, h 2,55 m): casă care se extinde. Modulul din față, fix (2,27 m adâncime), are livingul cu
// chicinetă; partea din spate, care se trage în afară (mai îngustă: 5,45 m, puțin mai joasă, cu podeaua cu o treaptă mai sus), are
// baia și dormitorul. Carcasa e gri (cum era la târg), cu colțurile de sus rotunjite. Făcută după planul și pozele primite de la client.
// Axe: X = lungimea (chicineta și baia la −X, canapeaua și patul la +X), fațada cu ușa și vitrajul spre +Z.
import { THREE, box, clamp } from './kit.js';
import * as F from './furn.js';

export const info = { id: 'T6', w: 5.85, d: 4.17, h: 2.55 };

const L = 5.85, DF = 2.27, DT = 4.17, H = 2.55, T = .1, RC = .3, RB = .06;   // lungime, adâncimea modulului fix, adâncimea totală, înălțime, grosimea pereților, razele colțurilor
const Y0 = .3, Y1 = Y0 + H, YC = 2.2, FY = Y0 + T + .02;                      // baza carcasei, vârful, tăietura acoperișului, pardoseala livingului
const HW = L / 2, IW = HW - T, ZF = DT / 2, ZM = ZF - DF, ZB = -DT / 2, ZG = ZF - T;   // ZM = spatele modulului fix; ZG = fața interioară a peretelui din față
// partea extensibilă: jumătate de lățime (afară / înăuntru), marginea ei din față (unde începe treapta), fața interioară a spatelui, înălțimi
const SW = 5.45 / 2, SI = SW - T, ZS = ZG - 1.94, ZI = ZB + T, YS0 = FY, YS1 = Y1 - T - .02, FS = YS0 + .1, CS = YS1 - .1;
// fațada, de la stânga: perete plin 1,38 m · ușă 0,86 m · stâlp · vitraj 3,26 m
const DX0 = -HW + 1.38, DX1 = DX0 + .86, GX0 = DX1 + .1, GX1 = GX0 + 3.26, DY1 = FY + 2.03, GY1 = FY + 2.2;
// fereastra dormitorului, pe capătul din dreapta al părții extensibile (pe Z și pe Y)
const WZ0 = -1.15, WZ1 = -.5, WY0 = FS + .9, WY1 = FS + 1.65;
const SKY = [[0, [.4, .38, .38]], [.2, [.52, .49, .47]], [.33, [1.7, 1.65, 1.55]], [.45, [1.1, 1.15, 1.22]], [.8, [.8, .9, 1.08]], [1, [.62, .74, .98]]];   // ca la furn.pane

// contur în U cu colțuri rotunjite: închis la yBase, deschis la yOpen (yOpen sub yBase = U întors, pentru acoperiș); normalele arată în afară
function uPath(a, yBase, yOpen, r, n = 10) {
  const s = yOpen > yBase ? 1 : -1, p = [{ x: -a, y: yOpen, nx: -1, ny: 0 }];
  for (let i = 0; i <= n; i++) { const g = i / n * Math.PI / 2; p.push({ x: -a + r - r * Math.cos(g), y: yBase + s * (r - r * Math.sin(g)), nx: -Math.cos(g), ny: -s * Math.sin(g) }); }
  for (let i = n; i >= 0; i--) { const g = i / n * Math.PI / 2; p.push({ x: a - r + r * Math.cos(g), y: yBase + s * (r - r * Math.sin(g)), nx: Math.cos(g), ny: -s * Math.sin(g) }); }
  p.push({ x: a, y: yOpen, nx: 1, ny: 0 }); return p;
}
// fâșie netedă: conturul întins pe Z, între z0 și z1; inward = fața spre interior
function strip(p, z0, z1, inward = false) {
  const pos = [], nor = [], idx = [], k = inward ? -1 : 1, a = p[0], b = p[1];
  p.forEach(q => { pos.push(q.x, q.y, z0, q.x, q.y, z1); nor.push(k * q.nx, k * q.ny, 0, k * q.nx, k * q.ny, 0); });
  const flip = ((b.y - a.y) * a.nx - (b.x - a.x) * a.ny) * k * (z1 - z0) < 0;
  for (let i = 0; i < p.length - 1; i++) { const A = 2 * i, B = A + 1, C = A + 2, E = A + 3; flip ? idx.push(A, B, C, B, E, C) : idx.push(A, C, B, B, C, E); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx); return g;
}
// față plană la z, între conturul din afară și linia golurilor (cut = punctele ei, de la stânga la dreapta); back = cu fața spre −Z
function face(outer, cut, z, back = false) {
  const m = back ? -1 : 1, pts = outer.map(q => new THREE.Vector2(m * q.x, q.y)); for (let i = cut.length - 1; i >= 0; i--) pts.push(new THREE.Vector2(m * cut[i][0], cut[i][1]));
  const g = new THREE.ShapeGeometry(new THREE.Shape(pts)); if (back) g.rotateY(Math.PI); return g.translate(0, 0, z);
}
const bx = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
// mai multe piese din același material, lipite într-un singur mesh
function merge(list) {
  const pos = [], nor = [];
  list.forEach(g0 => { const g = g0.index ? g0.toNonIndexed() : g0, p = g.attributes.position.array, n = g.attributes.normal.array; for (let i = 0; i < p.length; i++) { pos.push(p[i]); nor.push(n[i]); } });
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
  const root = new THREE.Group(), roof = new THREE.Group(), inn = new THREE.Group(), up = new THREE.Group(); root.name = 'T6';
  inn.position.y = up.position.y = FY; root.add(inn, roof); roof.add(up);   // inn = interiorul (de la pardoseala livingului); up = piesele interioare de deasupra tăieturii
  const mesh = (g, m, parent = root, cast = true, recv = true) => { const o = new THREE.Mesh(g, m); o.castShadow = cast; o.receiveShadow = recv; parent.add(o); return o; };
  // materiale proprii: carcasa gri (cu „emissive” diferit de zero, ca seara să nu fie luminată ca mobila) și canapeaua albă
  const body = new THREE.MeshStandardMaterial({ color: 0x747980, roughness: .6, metalness: .1, side: THREE.DoubleSide, emissive: 0x010101, emissiveIntensity: 0 });
  const cream = new THREE.MeshStandardMaterial({ color: 0xece7dd, roughness: 1 }), RL = F.fadeSet({ body, fabric: cream });

  /* ---- modulul din față: carcasă cu colțurile de sus rotunjite, tăiată la YC (ce e deasupra se ridică odată cu acoperișul) ---- */
  const oLo = uPath(HW, Y0, YC, RB), iLo = uPath(IW, Y0 + T, YC, .02), oUp = uPath(HW, Y1, YC, RC), iUp = uPath(IW, Y1 - T, YC, RC - T);
  const NL = [[DX0, YC], [DX0, FY], [DX1, FY], [DX1, YC], [GX0, YC], [GX0, FY], [GX1, FY], [GX1, YC]];          // golurile din fațadă (ușă, vitraj): partea de jos
  const NU = [[DX0, YC], [DX0, DY1], [DX1, DY1], [DX1, YC], [GX0, YC], [GX0, GY1], [GX1, GY1], [GX1, YC]];    // … și partea de sus
  const SL = [[-SW, YC], [-SW, YS0], [SW, YS0], [SW, YC]], SU = [[-SW, YC], [-SW, YS1], [SW, YS1], [SW, YC]];   // golul din spate, prin care iese partea extensibilă
  const ZW = ZS - .08;                                            // peretele dintre living și partea extensibilă: de la ZW la ZS
  const bLo = [strip(oLo, ZM, ZF), face(oLo, NL, ZF), face(oLo, SL, ZM, true)], bUp = [strip(oUp, ZM, ZF), face(oUp, NU, ZF), face(oUp, SU, ZM, true)];
  const inLo = [strip(iLo, ZW, ZG, true), face(iLo, NL, ZG, true)], inUp = [face(iUp, NU, ZG, true)];
  mesh(strip(iUp, ZW, ZG, true), R.ceil, roof, false);            // tavanul livingului

  /* ---- partea extensibilă: o cutie mai îngustă și mai joasă, cu fereastra dormitorului pe capătul din dreapta ---- */
  const zc = (ZS + ZB) / 2, zl = ZS - ZB, zci = (ZS + ZI) / 2, zli = ZS - ZI, yt = CS + .02;
  // un perete lateral (la x, gros t) de la y0 la tăietură, între z0 și z1, cu golul ferestrei
  const sideR = (x, t, y0, z0, z1) => [bx(t, WY0 - y0, z1 - z0, x, (WY0 + y0) / 2, (z0 + z1) / 2), bx(t, YC - WY0, WZ0 - z0, x, (YC + WY0) / 2, (WZ0 + z0) / 2),
    bx(t, YC - WY0, z1 - WZ1, x, (YC + WY0) / 2, (z1 + WZ1) / 2), bx(t, YC - WY1, WZ1 - WZ0, x, (YC + WY1) / 2, (WZ0 + WZ1) / 2)];
  bLo.push(bx(2 * SW, .07, zl, 0, YS0 + .035, zc), bx(T, YC - YS0, zl, -SW + T / 2, (YC + YS0) / 2, zc), ...sideR(SW - T / 2, T, YS0, ZB, ZS), bx(2 * SI, YC - YS0, T, 0, (YC + YS0) / 2, ZB + T / 2));
  bUp.push(bx(2 * SW, YS1 - yt, zl, 0, (YS1 + yt) / 2, zc), ...[-1, 1].map(s => bx(T, yt - YC, zl, s * (SW - T / 2), (yt + YC) / 2, zc)), bx(2 * SI, yt - YC, T, 0, (yt + YC) / 2, ZB + T / 2));
  inLo.push(bx(.012, YC - FS, zli, -SI + .006, (YC + FS) / 2, zci), ...sideR(SI - .006, .012, FS, ZI, ZS), bx(2 * SI, YC - FS, .012, 0, (YC + FS) / 2, ZI + .006));
  inUp.push(...[-1, 1].map(s => bx(.012, CS - YC, zli, s * (SI - .006), (CS + YC) / 2, zci)), bx(2 * SI, CS - YC, .012, 0, (CS + YC) / 2, ZI + .006));
  mesh(bx(2 * SI, .02, zli, 0, CS + .01, zci), R.ceil, roof, false);   // tavanul părții extensibile
  mesh(merge(bLo), body); mesh(merge(bUp), RL.body, roof);

  /* ---- ramele închise la culoare, rosturile dintre panouri, grosimea pereților văzută de sus ---- */
  const frLo = [], frUp = [], zj = ZF - T / 2, dxc = (DX0 + DX1) / 2, gxc = (GX0 + GX1) / 2, ZGL = ZF - .055;
  [DX0 + .02, DX1 - .02].forEach(x => { frLo.push(bx(.04, YC - FY, T + .02, x, (YC + FY) / 2, zj)); frUp.push(bx(.04, DY1 - YC, T + .02, x, (DY1 + YC) / 2, zj)); });    // tocul ușii
  frLo.push(bx(DX1 - DX0, .03, T + .02, dxc, FY + .015, zj)); frUp.push(bx(DX1 - DX0, .04, T + .02, dxc, DY1 - .02, zj));
  [GX0 + .025, GX1 - .025].forEach(x => { frLo.push(bx(.05, YC - FY, T + .02, x, (YC + FY) / 2, zj)); frUp.push(bx(.05, GY1 - YC, T + .02, x, (GY1 + YC) / 2, zj)); });   // rama vitrajului, cu un montant la mijloc
  frLo.push(bx(GX1 - GX0, .05, T + .02, gxc, FY + .025, zj), bx(.05, YC - FY, .05, gxc, (YC + FY) / 2, ZGL)); frUp.push(bx(GX1 - GX0, .05, T + .02, gxc, GY1 - .025, zj), bx(.05, GY1 - YC, .05, gxc, (GY1 + YC) / 2, ZGL));
  const wx = SW - T / 2, wzc = (WZ0 + WZ1) / 2, wyc = (WY0 + WY1) / 2;                                                 // rama ferestrei din dormitor
  frLo.push(bx(T + .03, .04, WZ1 - WZ0, wx, WY1 - .02, wzc), bx(T + .03, .04, WZ1 - WZ0, wx, WY0 + .02, wzc), bx(T + .03, WY1 - WY0, .04, wx, wyc, WZ0 + .02), bx(T + .03, WY1 - WY0, .04, wx, wyc, WZ1 - .02));
  // rosturi: trei linii orizontale pe capete și pe peretele plin al fațadei (patru benzi de panouri), două pe partea extensibilă
  [.94, 1.58, 2.22].forEach(y => { const l = y < YC ? frLo : frUp;
    [-1, 1].forEach(s => l.push(bx(.006, .014, DF - .02, s * HW, y, (ZF + ZM) / 2)));
    l.push(bx(DX0 + HW - .05, .014, .006, (DX0 - HW) / 2, y, ZF), bx(HW - GX1 - .08, .014, .006, (HW + GX1) / 2 + .02, y, ZF)); });
  [1.02, 1.62].forEach(y => { [-1, 1].forEach(s => frLo.push(bx(.006, .014, ZM - ZB - .02, s * SW, y, (ZM + ZB) / 2))); frLo.push(bx(2 * SW - .02, .014, .006, 0, y, ZB)); });
  [-.9, .9].forEach(x => { frLo.push(bx(.014, YC - YS0 - .02, .006, x, (YC + YS0) / 2, ZB)); frUp.push(bx(.014, yt - YC, .006, x, (yt + YC) / 2, ZB)); });
  frUp.push(bx(.014, .006, DF - .3, 0, Y1, (ZF + ZM) / 2));
  const yk = YC - .002, cut = [];
  [-1, 1].forEach(s => cut.push(bx(T - .012, .006, DF - .012, s * (HW - T / 2), yk, (ZF + ZM) / 2), bx(T - .012, .006, zl - .012, s * (SW - T / 2), yk, zc)));
  [[-IW, DX0], [DX1, GX0], [GX1, IW]].forEach(([a, b]) => cut.push(bx(b - a, .006, T - .012, (a + b) / 2, yk, zj)));
  cut.push(bx(2 * SI, .006, T - .012, 0, yk, ZB + T / 2));
  mesh(merge(cut), M.cut, root, false);

  /* ---- ușa de la intrare (oțel, închisă la culoare, cu încuietoare cu cod), vitrajul din două panouri, fereastra dormitorului ---- */
  mesh(bx(DX1 - DX0 - .08, YC - FY - .03, .05, dxc, (YC + FY + .03) / 2, ZF - .035), M.dark); mesh(bx(DX1 - DX0 - .08, DY1 - .04 - YC, .05, dxc, (DY1 - .04 + YC) / 2, ZF - .035), R.dark, roof);
  root.add(box(.05, .26, .02, M.steel, DX1 - .13, FY + 1.07, ZF), box(.14, .025, .03, M.steel, DX1 - .19, FY + 1.02, ZF + .03));
  const ga = FY + .05, gb = GY1 - .05;
  mesh(skyGlass(GX0 + .05, GX1 - .05, ga, YC, ga, gb, ZGL), GF.glass, root, false, false);
  mesh(skyGlass(GX0 + .05, GX1 - .05, YC, gb, ga, gb, ZGL), R.glass, roof, false, false);
  const wp = F.pane(WZ1 - WZ0 - .08, WY1 - WY0 - .08, M.glass); wp.rotation.y = Math.PI / 2; wp.position.set(SW - .04, wyc, wzc); root.add(wp);
  // banda LED de pe conturul vitrajului (se aprinde seara)
  const lw = .022, lo = .012, la = FY - lo - lw, lb = GY1 + lo + lw, lx = [GX0 - lo - lw / 2, GX1 + lo + lw / 2];
  mesh(merge([bx(GX1 - GX0 + 2 * (lo + lw), lw, .006, gxc, la + lw / 2, ZF + .003), ...lx.map(x => bx(lw, YC - la, .006, x, (YC + la) / 2, ZF + .003))]), M.led, root, false);
  mesh(merge([bx(GX1 - GX0 + 2 * (lo + lw), lw, .006, gxc, lb - lw / 2, ZF + .003), ...lx.map(x => bx(lw, lb - YC, .006, x, (lb + YC) / 2, ZF + .003))]), R.led, roof, false);

  /* ---- pardoselile (în partea extensibilă e cu o treaptă mai sus), benzile LED din tavan ---- */
  mesh(bx(2 * IW - .01, .04, ZG - ZW, 0, FY - .02, (ZG + ZW) / 2), M.floor, root, false);
  mesh(bx(2 * SI, .03, zli, 0, FS - .015, zci), M.floor, root, false);
  mesh(merge([bx(4.4, .015, .04, .3, Y1 - T - .009, 1.02), bx(2.6, .015, .04, .85, CS - .009, -.95)]), R.ledIn, roof, false, false);

  /* ---- interiorul, după plan: living cu chicinetă (în față) · baie și dormitor (în spate) ---- */
  const HC = YC - FY, HT = Y1 - T - FY, SF = FS - FY, SC = CS - FY, wLo = [], wUp = [];      // înălțimi de la pardoseala livingului: tăietura, tavanul, podeaua și tavanul din spate
  const wall = (x0, x1, z0, z1, y0 = 0, y1 = HT) => { const w = x1 - x0, d = z1 - z0, x = (x0 + x1) / 2, z = (z0 + z1) / 2; wLo.push(bx(w, HC - y0, d, x, (HC + y0) / 2, z)); if (y1 > HC) wUp.push(bx(w, y1 - HC, d, x, (y1 + HC) / 2, z)); };
  const put = (o, x, z, ry = 0, y = 0) => { o.position.set(x, y, z); o.rotation.y = ry; inn.add(o); return o; };
  const BX = -SI + 1.565, BD1 = BX - .04, BD0 = BD1 - .7, bdc = (BD0 + BD1) / 2, DH = SF + 2;   // BX = unde se termină baia; ușa băii (sticlă mată) între BD0 și BD1
  wall(-IW, -SI, ZW, ZS); wall(SI, IW, ZW, ZS);                                 // de o parte și de alta a părții extensibile
  wall(-SI, BD0, ZW, ZS, 0, SC - .06); wall(BD1, BX + .1, ZW, ZS, 0, SC - .06);  // peretele băii spre living
  wall(BX, BX + .1, ZI, ZW, SF, SC);                                            // peretele dintre baie și dormitor
  wUp.push(bx(BD1 - BD0, SC - .06 - DH, .08, bdc, (SC - .06 + DH) / 2, ZS - .04), bx(2 * SI, HT - SC + .06, .08, 0, (HT + SC - .06) / 2, ZS - .04));   // deasupra ușii băii; grinda de la trecerea spre dormitor
  inn.add(box(BD1 - BD0 - .04, HC - SF, .02, M.showerglass, bdc, (HC + SF) / 2, ZS - .04), box(.02, .14, .07, M.dark, BD0 + .1, SF + 1, ZS - .04));
  up.add(box(BD1 - BD0 - .04, DH - HC, .02, R.showerglass, bdc, (DH + HC) / 2, ZS - .04));
  [BD0 + .015, BD1 - .015].forEach(x => { frLo.push(bx(.03, HC - SF, .09, x, FY + (HC + SF) / 2, ZS - .04)); frUp.push(bx(.03, DH - HC, .09, x, FY + (DH + HC) / 2, ZS - .04)); });
  frUp.push(bx(BD1 - BD0, .03, .09, bdc, FY + DH, ZS - .04));
  // treapta de la trecerea spre dormitor, cu bandă de lumină sub muchie
  inn.add(box(SI - BX - .1, SF, .02, M.wood, (SI + BX + .1) / 2, SF / 2, ZS + .01), box(SI - BX - .1, .018, .012, M.ledIn, (SI + BX + .1) / 2, SF - .025, ZS + .026));
  // chicineta, pe capătul din stânga: corp alb cu chiuvetă neagră și plită; dulapurile de sus se ridică odată cu acoperișul
  const KZ = ZS + .05 + .925, kx = -IW + .29;
  inn.add(box(.58, .86, 1.85, M.white, kx, .43, KZ), box(.61, .04, 1.87, M.white, kx + .015, .88, KZ), box(.36, .012, .42, M.black, kx + .02, .905, KZ - .5), box(.34, .012, .52, M.black, kx + .02, .905, KZ + .5), box(.02, .24, .02, M.steel, kx - .2, 1.02, KZ - .5), box(.14, .02, .02, M.steel, kx - .14, 1.13, KZ - .5));
  up.add(box(.34, .52, 1.85, R.white, -IW + .17, HT - .28, KZ));
  // livingul: canapea albă la capătul din dreapta, măsuță ovală închisă la culoare, perdele la vitraj
  put(F.sofa(M, 1.6, cream), IW - .43, 1.02, -Math.PI / 2);
  mesh(new THREE.CylinderGeometry(1, 1, .035, 32).scale(.27, 1, .5).translate(1.3, .4, 1.02), M.dark, inn, false);
  mesh(merge([-1, 1].map(s => bx(.03, .38, .46, 1.3 + s * .13, .19, 1.02))), M.dark, inn, false);
  [GX0 + .32, GX1 - .32].forEach(x => { put(F.curtain({ fabric: cream }, .45, HC - .02), x, ZG - .11); const c = F.curtain(RL, .45, GY1 - FY - HC - .04); c.position.set(x, HC, ZG - .11); up.add(c); });
  // baia: duș în colțul din spate, lavoar, vas de toaletă; pardoseală de gresie
  inn.add(box(BX + SI, .012, ZW - ZI, M.stone, (BX - SI) / 2, SF + .006, (ZW + ZI) / 2));
  put(F.shower(M, .8, .8), BX - .4, ZI + .4, -Math.PI / 2, SF).scale.y = .85;
  put(F.vanity(M, .5), -SI + .33, ZI + .25, 0, SF).scale.y = .88;
  put(F.wc(M), -SI + .264, -.55, Math.PI / 2, SF).scale.z = .8;   // vas scurt, lipit de perete: în mijlocul băii rămâne loc de stat
  // dormitorul: suport de haine, noptiere cu veioze, pat cu tăblia la peretele din spate, panou tapițat cu lumină deasupra
  const rk = BX + .44;
  mesh(merge([bx(.025, 1.55, .025, rk, SF + .775, -1.85), bx(.025, 1.55, .025, rk, SF + .775, -.75), bx(.025, .025, 1.13, rk, SF + 1.55, -1.3)]), M.steel, inn, false);
  inn.add(box(.4, .025, 1.1, M.wood, rk - .02, SF + .2, -1.3), box(.04, .7, .42, M.white, rk, SF + 1.18, -1.6), box(.04, .6, .38, M.fabric, rk, SF + 1.23, -1.12));
  [.1, 2.15].forEach(x => { inn.add(box(.45, .45, .4, M.wood, x, SF + .225, ZI + .22)); const l = new THREE.Mesh(new THREE.CylinderGeometry(.07, .1, .18, 16), M.lamp); l.position.set(x, SF + .58, ZI + .2); inn.add(l); inn.add(box(.03, .08, .03, M.dark, x, SF + .49, ZI + .2)); });
  put(F.bed(M, 1.5, 1.9), 1.125, ZI + 1.03, 0, SF);
  inn.add(box(SI - BX - .16, 1.05, .025, M.fabric, (SI + BX + .1) / 2, SF + .6, ZI + .026), box(SI - BX - .16, .02, .03, M.ledIn, (SI + BX + .1) / 2, SF + 1.15, ZI + .03));
  mesh(merge(wLo), M.inner, inn, false); mesh(merge(wUp), R.inner, up, false);
  mesh(merge(inLo), M.inner, root, false); mesh(merge(inUp), R.inner, roof, false);
  mesh(merge(frLo), M.frame, root, false); mesh(merge(frUp), R.frame, roof, false);
  [inn, up].forEach(g => g.traverse(o => { if (o.isMesh) { o.castShadow = false; if (o.material.transparent) o.renderOrder = -1; } }));   // piesele străvezii din interior se desenează înaintea geamului fațadei

  /* ---- soclul retras, picioarele părții extensibile, treptele de lemn din dreptul ușii ---- */
  root.add(box(L - .6, Y0, DF - .5, M.dark, 0, Y0 / 2, (ZF + ZM) / 2), box(2 * SW - .6, YS0, .12, M.dark, 0, YS0 / 2, ZB + .35));
  const st = F.steps(M, 1.2, 3, FY / 3, .28, M.wood); st.position.set(dxc, 0, ZF + .72); root.add(st);

  return {
    root, levels: 1,
    openRoof(k) { F.lift(roof, R, k, 2.2); const f = clamp(clamp(k) * 1.3); RL.fade(f); GF.fade(f * .6); },
    rooms: [{ n: 'Living', x: .7, y: 1.3, z: 1.05, lvl: 1 }, { n: 'Bucătărie', x: -1.75, y: 1.6, z: 1.0, lvl: 1 }, { n: 'Baie', x: -1.6, y: 1.9, z: -.6, lvl: 1 }, { n: 'Dormitor', x: .55, y: 1.4, z: -.6, lvl: 1 }],
    size: { w: 6.5, d: 5.1, h: 2.85, cz: .43 },
  };
}
