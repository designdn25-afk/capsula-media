// Casa modulară „YK5” (9,6 × 3,3 m, h 3,0 m): cadru alb de oțel (stâlpi și grinzi de 160 × 160 mm, ca o ramă de tablou), umplut cu
// panouri de lemn compozit cu lamele verticale; acoperiș plat alb. Făcută după fișa furnizorului (o imagine din afară și două din
// interior; fără plan). Din imaginea din afară: la capătul din stânga, sub același cadru, e o terasă acoperită, deschisă în față și
// în lateral; apoi ușa glisantă de sticlă din patru canaturi (geam triplu), apoi perete plin de lemn cu aplică; capătul din dreapta
// e tot plin, cu aplică. Împărțirea dinăuntru e o schemă orientativă: living cu bucătărie în dreptul ușii glisante (canapea și
// rafturi pe peretele din spate, blat cu chiuvetă și lămpi suspendate), iar în spatele peretelui de lemn dormitorul (spre spate, cu
// fereastră presupusă pe fațada din spate) și baia (spre față; fișa nu o arată, locul ei e o presupunere).
// Axe: X = lungimea (terasa acoperită la −X, dormitorul la +X), fațada cu ușa glisantă spre +Z.
import { THREE, box, clamp } from './kit.js';
import * as F from './furn.js';

export const info = { id: 'YK5', w: 9.6, d: 3.3, h: 3.0 };

const L = 9.6, D = 3.3, H = 3.0, FR = .16, T = .1, IN = .05;                  // lungime, lățime, înălțime; secțiunea cadrului; grosimea pereților; cât sunt retrași față de cadru
const YD = .28, Y0 = YD, FY = Y0 + FR, Y1 = Y0 + H, YB = Y1 - FR;             // terasa, baza casei, pardoseala, vârful, sub grinda de sus
const HC = 2.0, YC = FY + HC, YT = Y1 - .2, HT = YT - FY;                     // tăietura acoperișului (de la pardoseală / de la sol), tavanul
const HW = L / 2, ZF = D / 2, ZB = -ZF, ZG = ZF - IN - T, ZI = -ZG, XI = HW - IN - T;
const XP = -2.1, XL = XP + .15, XG0 = XP + FR, XG1 = 1.7;                     // stâlpul dublu dintre terasă și casă, fața dinăuntru a peretelui terasei, ușa glisantă
const XB = 1.63, ZT = .43, WT = .06;                                          // peretele dormitorului, peretele băii, grosimea pereților dinăuntru
const D1 = [-.44, .38], D2 = [1.8, 2.52];                                      // ușa dormitorului (pe Z), ușa băii (pe X)
const WIN = [3.6, 1.4, FY + .85, 1.1];                                        // fereastra dormitorului, pe spate: mijloc, lățime, pervaz, înălțime
const SW = .075, ST = .025, SP = .12;                                         // lamelele: lățime, grosime, pas
const SKY = [[0, [.4, .38, .38]], [.2, [.52, .49, .47]], [.33, [1.7, 1.65, 1.55]], [.45, [1.1, 1.15, 1.22]], [.8, [.8, .9, 1.08]], [1, [.62, .74, .98]]];   // ca la furn.pane

const bx = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
// mai multe piese din același material, lipite într-un singur mesh
function merge(list) {
  const pos = [], nor = [];
  list.forEach(g0 => { const g = g0.index ? g0.toNonIndexed() : g0, p = g.attributes.position.array, n = g.attributes.normal.array; for (let i = 0; i < p.length; i++) { pos.push(p[i]); nor.push(n[i]); } });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); return g;
}
// perete de-a lungul lui X (la z, gros t), de la yb la yt, cu goluri de fereastră [mijloc, lățime, pervaz, înălțime]
function wallX(x0, x1, z, t, yb, yt, holes = []) {
  const out = []; let x = x0;
  holes.forEach(([c, w, s, h]) => { const a = c - w / 2, b = c + w / 2;
    if (a > x) out.push(bx(a - x, yt - yb, t, (a + x) / 2, (yt + yb) / 2, z));
    if (s > yb) out.push(bx(w, s - yb, t, c, (s + yb) / 2, z)); if (s + h < yt) out.push(bx(w, yt - s - h, t, c, (yt + s + h) / 2, z)); x = b; });
  if (x1 > x) out.push(bx(x1 - x, yt - yb, t, (x1 + x) / 2, (yt + yb) / 2, z)); return out;
}
// lamele verticale pe o față de perete, de la a la b de-a lungul lui X (ax = 'x', fața la z = p) sau al lui Z (fața la x = p); s = încotro
// privește fața; hole = golul ferestrei. Ce e sub tăietură intră în lo, restul în up (se ridică odată cu acoperișul).
function slats(lo, up, ax, a, b, p, s, hole) {
  const n = Math.round((b - a) / SP), st = (b - a) / n, q = p + s * ST / 2;
  for (let i = 0; i < n; i++) {
    const c = a + (i + .5) * st, seg = hole && c > hole[0] - hole[1] / 2 - SW / 2 && c < hole[0] + hole[1] / 2 + SW / 2 ? [[FY, hole[2]], [hole[2] + hole[3], YB]] : [[FY, YB]];
    seg.forEach(([y0, y1]) => [[lo, y0, Math.min(y1, YC)], [up, Math.max(y0, YC), y1]].forEach(([l, u, v]) => {
      if (v - u > .01) l.push(ax === 'x' ? bx(SW, v - u, ST, c, (u + v) / 2, q) : bx(ST, v - u, SW, q, (u + v) / 2, c)); }));
  }
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
  const GF = F.fadeSet(M);                                       // geamul din față: mai străveziu când acoperișul e ridicat
  const root = new THREE.Group(), roof = new THREE.Group(), inn = new THREE.Group(), up = new THREE.Group(); root.name = 'YK5';
  inn.position.y = up.position.y = FY; root.add(inn, roof); roof.add(up);   // inn = interiorul (de la pardoseală); up = piesele interioare de deasupra tăieturii
  const mesh = (g, m, parent = root, cast = true, recv = true) => { const o = new THREE.Mesh(g, m); o.castShadow = cast; o.receiveShadow = recv; parent.add(o); return o; };
  // materiale proprii: lamelele de lemn și fondul mai închis dintre ele („emissive” diferit de zero, ca seara să nu fie luminate ca mobila); canapeaua deschisă
  const lemn = new THREE.MeshStandardMaterial({ color: 0xb27a47, roughness: .68, metalness: .03, emissive: 0x010101, emissiveIntensity: 0 });
  const fond = new THREE.MeshStandardMaterial({ color: 0x6b4426, roughness: .8, metalness: .03, side: THREE.DoubleSide, emissive: 0x010101, emissiveIntensity: 0 });
  const cream = new THREE.MeshStandardMaterial({ color: 0xece7dd, roughness: 1 }), RL = F.fadeSet({ lemn, fond, fabric: cream });

  /* ---- cadrul alb: grinzi jos și sus, stâlpi la colțuri și un stâlp dublu între terasa acoperită și casă ---- */
  const shLo = [], shUp = [], zc = ZF - FR / 2, xc = HW - FR / 2;
  [[shLo, Y0 + FR / 2], [shUp, Y1 - FR / 2]].forEach(([l, y]) => { [-1, 1].forEach(s => l.push(bx(L, FR, FR, 0, y, s * zc), bx(FR, FR, D - 2 * FR, s * xc, y, 0))); l.push(bx(2 * FR, FR, D - 2 * FR, XP, y, 0)); });
  [-1, 1].forEach(s => { [[-xc, FR], [xc, FR], [XP, 2 * FR]].forEach(([x, w]) => { shLo.push(bx(w, YC - FY, FR, x, (YC + FY) / 2, s * zc)); shUp.push(bx(w, YB - YC, FR, x, (YB + YC) / 2, s * zc)); }); });
  mesh(merge(shLo), M.shell); mesh(merge(shUp), R.shell, roof);

  /* ---- pereții de lemn: un fond închis și lamele verticale deschise; partea de deasupra tăieturii se ridică odată cu acoperișul ---- */
  const pLo = [], pUp = [], sLo = [], sUp = [], inLo = [], inUp = [], frLo = [], frUp = [];
  const zo = ZF - IN - T / 2, xo = HW - IN - T / 2, xp = XP + .1;
  // fața, în dreapta ușii glisante
  pLo.push(bx(HW - FR - XG1, HC, T, (HW - FR + XG1) / 2, (YC + FY) / 2, zo)); pUp.push(bx(HW - FR - XG1, YB - YC, T, (HW - FR + XG1) / 2, (YB + YC) / 2, zo));
  slats(sLo, sUp, 'x', XG1 + .01, HW - FR, ZF - IN, 1);
  inLo.push(bx(XI - XG1, HC, .012, (XI + XG1) / 2, (YC + FY) / 2, ZG - .006)); inUp.push(bx(XI - XG1, YT - YC, .012, (XI + XG1) / 2, (YT + YC) / 2, ZG - .006));
  // capătul din dreapta
  pLo.push(bx(T, HC, D - 2 * FR, xo, (YC + FY) / 2, 0)); pUp.push(bx(T, YB - YC, D - 2 * FR, xo, (YB + YC) / 2, 0));
  slats(sLo, sUp, 'z', ZB + FR, ZF - FR, HW - IN, 1);
  inLo.push(bx(.012, HC, ZG - ZI, XI - .006, (YC + FY) / 2, 0)); inUp.push(bx(.012, YT - YC, ZG - ZI, XI - .006, (YT + YC) / 2, 0));
  // spatele (pe toată lungimea, cu fereastra dormitorului); în dreptul terasei are lamele și pe partea dinăuntru
  pLo.push(...wallX(-HW + FR, HW - FR, -zo, T, FY, YC, [WIN])); pUp.push(bx(L - 2 * FR, YB - YC, T, 0, (YB + YC) / 2, -zo));
  slats(sLo, sUp, 'x', -HW + FR, HW - FR, ZB + IN, -1, WIN); slats(sLo, sUp, 'x', -HW + FR, XP - FR, ZI, 1);
  inLo.push(...wallX(XL, XI, ZI + .006, .012, FY, YC, [WIN])); inUp.push(bx(XI - XL, YT - YC, .012, (XI + XL) / 2, (YT + YC) / 2, ZI + .006));
  // peretele dintre terasa acoperită și living
  pLo.push(bx(T, HC, ZF - FR - ZI, xp, (YC + FY) / 2, (ZF - FR + ZI) / 2)); pUp.push(bx(T, YB - YC, ZF - FR - ZI, xp, (YB + YC) / 2, (ZF - FR + ZI) / 2));
  slats(sLo, sUp, 'z', ZI, ZF - FR, XP + .05, -1);
  inLo.push(bx(.012, HC, ZG - ZI, XL + .006, (YC + FY) / 2, 0)); inUp.push(bx(.012, YT - YC, ZG - ZI, XL + .006, (YT + YC) / 2, 0));
  mesh(merge(pLo), fond); mesh(merge(pUp), RL.fond, roof); mesh(merge(sLo), lemn); mesh(merge(sUp), RL.lemn, roof);

  /* ---- ușa glisantă din patru canaturi (rame negre, geam triplu); trece de tăietură: partea de sus e în acoperiș ---- */
  const zd = ZF - .09, gw = XG1 - XG0, gc = (XG0 + XG1) / 2, ga = FY + .06, gb = YB - .07;
  [XG0 + .035, XG1 - .035].forEach(x => { frLo.push(bx(.07, HC, .08, x, (YC + FY) / 2, zd)); frUp.push(bx(.07, YB - YC, .08, x, (YB + YC) / 2, zd)); });
  [1, 2, 3].forEach(i => { const x = XG0 + gw * i / 4; frLo.push(bx(.065, HC, .06, x, (YC + FY) / 2, zd)); frUp.push(bx(.065, YB - YC, .06, x, (YB + YC) / 2, zd)); });
  frLo.push(bx(gw, .06, .08, gc, FY + .03, zd)); frUp.push(bx(gw, .07, .08, gc, YB - .035, zd));
  mesh(skyGlass(XG0 + .07, XG1 - .07, ga, YC, ga, gb, zd), GF.glass, root, false, false); mesh(skyGlass(XG0 + .07, XG1 - .07, YC, gb, ga, gb, zd), R.glass, roof, false, false);
  [-1, 1].forEach(s => frLo.push(bx(.02, .2, .03, gc + s * .07, FY + 1.05, zd + .045)));   // mânerele
  // fereastra dormitorului (pe spate)
  { const g = F.glazing(M, WIN[1], WIN[3], 2, .05); g.position.set(WIN[0], WIN[2] + WIN[3] / 2, ZB + IN + .04); g.rotation.y = Math.PI; root.add(g); }

  /* ---- aplicele de pe panourile de lemn (lumină în sus și în jos; se aprind seara) ---- */
  const lamp = (x, z, ry) => { const g = new THREE.Group(); g.add(box(.15, .24, .11, M.dark, 0, 0, .055)); [-1, 1].forEach(s => { const l = box(.11, .012, .075, M.lamp, 0, s * .126, .055); l.castShadow = false; g.add(l); }); g.position.set(x, FY + 1.5, z); g.rotation.y = ry; root.add(g); };
  lamp(3.17, ZF - IN + ST, 0); lamp(HW - IN + ST, .7, Math.PI / 2); lamp(-2.85, ZI + ST, 0);

  /* ---- pardoselile: SPC cu aspect de lemn în casă, lemn-plastic pe terasa acoperită; banca albă de pe terasă ---- */
  mesh(bx(XI - XL, .04, ZG - ZI, (XI + XL) / 2, FY - .02, 0), M.floor, root, false);
  const tx0 = -HW + FR, tx1 = XP - FR, txc = (tx0 + tx1) / 2;
  mesh(bx(tx1 - tx0, .04, ZF - FR - ZI, txc, FY - .02, (ZF - FR + ZI) / 2), M.wood, root, false);
  root.add(box(1.9, .42, .45, M.white, -3.35, FY + .21, ZI + ST + .235), box(.4, .3, .4, M.white, -2.5, FY + .15, ZI + ST + .22));

  /* ---- acoperișul plat, alb, cu cute; tavanul alb cu linii LED pe margine și spoturi; lămpile suspendate de deasupra blatului ---- */
  const rf = [bx(L - 2 * FR + .02, .06, D - 2 * FR + .02, 0, Y1 - .07, 0)];
  for (let x = -HW + .4; x < HW - .3; x += .3) rf.push(bx(.11, .025, D - 2 * FR, x, Y1 - .028, 0));
  mesh(merge(rf), R.shell, roof);
  mesh(bx(XI - XL, .02, ZG - ZI, (XI + XL) / 2, YT + .01, 0), R.ceil, roof, false); mesh(bx(tx1 - tx0, .02, D - 2 * FR, txc, YT + .01, 0), R.shell, roof, false);
  const XK = XB - WT / 2, lz = ZG - .12, la = XL + .12, lb = XK - .12, ly = YT - .008, led = [];
  [-lz, lz].forEach(z => led.push(bx(lb - la, .014, .035, (la + lb) / 2, ly, z))); [la, lb].forEach(x => led.push(bx(.035, .014, 2 * lz, x, ly, 0)));
  led.push(bx(XI - XK - .3, .014, .035, (XI + XK) / 2, ly, ZI + .12));
  [[-1.3, .3], [.2, .3], [-.55, -.6], [.9, -.2], [2.2, -.4], [3.6, -.4], [2.9, .98], [-3.4, 0]].forEach(([x, z]) => led.push(bx(.09, .012, .09, x, ly, z)));
  mesh(merge(led), R.ledIn, roof, false, false);
  const PX = [.2, .5, .8], PZ = -1.02;
  mesh(merge(PX.map(x => bx(.01, .5, .01, x, HT - .25, PZ))), R.dark, up, false, false);
  mesh(merge(PX.map(x => new THREE.SphereGeometry(.055, 10, 8).translate(x, HT - .54, PZ))), R.lamp, up, false, false);

  /* ---- interiorul (schemă orientativă): living cu bucătărie · dormitor (spre spate) · baie (spre față) ---- */
  const wLo = [], wUp = [];
  const wall = (x0, x1, z0, z1) => { const w = x1 - x0, d = z1 - z0, x = (x0 + x1) / 2, z = (z0 + z1) / 2; wLo.push(bx(w, HC, d, x, HC / 2, z)); wUp.push(bx(w, HT - HC, d, x, (HT + HC) / 2, z)); };
  const put = (o, x, z, ry = 0) => { o.position.set(x, 0, z); o.rotation.y = ry; inn.add(o); return o; };
  const xa = XB - WT / 2, xb = XB + WT / 2, za = ZT - WT / 2, zb = ZT + WT / 2;
  wall(xa, xb, ZI, D1[0]); wall(xa, xb, D1[1], ZG); wUp.push(bx(WT, HT - HC, D1[1] - D1[0], XB, (HT + HC) / 2, (D1[0] + D1[1]) / 2));       // peretele dormitorului, cu ușa
  wall(xb, D2[0], za, zb); wall(D2[1], XI, za, zb); wUp.push(bx(D2[1] - D2[0], HT - HC, WT, (D2[0] + D2[1]) / 2, (HT + HC) / 2, ZT));          // peretele băii, cu ușa de sticlă mată
  inn.add(box(D2[1] - D2[0] - .05, HC - .04, .02, M.showerglass, (D2[0] + D2[1]) / 2, HC / 2, ZT), box(.02, .3, .07, M.dark, D2[1] - .12, 1.0, ZT));
  [D2[0] + .015, D2[1] - .015].forEach(x => frLo.push(bx(.03, HC, WT + .02, x, FY + HC / 2, ZT)));
  D1.forEach((z, i) => frLo.push(bx(WT + .02, HC, .03, XB, FY + HC / 2, z + (i ? -.015 : .015))));
  { const g = new THREE.Group(); g.add(box(.04, HC - .02, .8, M.white, 0, (HC - .02) / 2, .4)); g.position.set(xa - .03, 0, D1[1]); g.rotation.y = -.1; inn.add(g); }   // ușa dormitorului, deschisă spre living
  // livingul: canapea deschisă la culoare pe peretele din spate, măsuță, covor, raft cu tablouri, perdea la ușa glisantă
  put(F.rug(M, 2.3, 1.5), -1.0, -.1); put(F.sofa(M, 1.75, cream), -1.0, ZI + .41); put(F.tableRect(M, .9, .5, .38), -1.0, -.15);
  inn.add(box(1.0, .03, .12, M.wood, -1.0, 1.42, ZI + .075));
  mesh(merge([[-1.32, .3], [-1.0, .24], [-.7, .3]].map(([x, h]) => bx(.22, h, .02, x, 1.435 + h / 2, ZI + .03))), M.dark, inn, false);
  put(F.curtain({ fabric: cream }, .5, HC - .02), XL + .33, zd - .13); { const c = F.curtain(RL, .5, HT - HC - .02); c.position.set(XL + .33, HC, zd - .13); up.add(c); }
  // bucătăria: blat cu fronturi de lemn și chiuvetă pe peretele din spate, rafturi deschise de lemn deasupra, frigider de inox în colț
  const KX0 = 0, KX1 = 1.0, kc = (KX0 + KX1) / 2, kz = ZI + .3;
  inn.add(box(KX1 - KX0, .86, .58, M.wood, kc, .43, ZI + .3), box(KX1 - KX0 + .02, .04, .62, M.white, kc - .01, .88, ZI + .31), box(.44, .012, .36, M.steel, kc - .1, .905, kz), box(.58, 1.8, .58, M.steel, KX1 + .3, .9, ZI + .3));
  mesh(merge([bx(.02, .24, .02, kc - .1, 1.02, kz - .2), bx(.02, .02, .14, kc - .1, 1.13, kz - .14)]), M.steel, inn, false);
  mesh(merge([bx(KX1 - KX0, .03, .2, kc, 1.32, ZI + .11), bx(KX1 - KX0, .03, .2, kc, 1.66, ZI + .11), bx(.03, .72, .2, KX0 + .015, 1.5, ZI + .11), bx(.03, .72, .2, KX1 - .015, 1.5, ZI + .11)]), M.wood, inn, false);
  // dormitorul: pat dublu cu capul la peretele din dreapta (pe un panou de lemn), dulap, noptieră
  put(F.bed(M, 1.5, 1.8), XI - .985, ZI + .8, -Math.PI / 2); put(F.wardrobe(M, 1.0, HC - .02, .55), xb + .52, ZI + .28);
  inn.add(box(.02, 1.5, 1.6, M.wood, XI - .012, .75, ZI + .8), box(.36, .45, .3, M.wood, XI - .2, .225, .2));
  // baia (loc presupus): duș la capătul din dreapta, vas de toaletă, lavoar suspendat cu oglindă lângă ușă; pardoseală de gresie
  inn.add(box(XI - xb - .01, .012, ZG - zb - .01, M.stone, (XI + xb) / 2, .006, (ZG + zb) / 2));
  put(F.shower(M, ZG - zb - .04, .85), XI - .43, (ZG + zb) / 2, -Math.PI / 2);
  put(F.wc(M), 3.3, zb + .264).scale.z = .8;
  { const v = put(F.vanity(M, .6), xb + .26, 1.1, Math.PI / 2); v.scale.y = .9; v.position.y = .1; }
  mesh(merge(wLo), M.inner, inn, false); mesh(merge(wUp), R.inner, up, false);
  mesh(merge(inLo), M.inner, root, false); mesh(merge(inUp), R.inner, roof, false);
  mesh(merge(frLo), M.frame, root); mesh(merge(frUp), R.frame, roof);
  // grosimea pereților văzută de sus, când acoperișul e ridicat
  const yk = YC - .002;
  mesh(merge([bx(HW - FR - XG1, .006, T - .012, (HW - FR + XG1) / 2, yk, zo), bx(T - .012, .006, D - 2 * FR, xo, yk, 0), bx(L - 2 * FR, .006, T - .012, 0, yk, -zo), bx(T - .012, .006, ZF - FR - ZI, xp, yk, (ZF - FR + ZI) / 2)]), M.cut, root, false);
  [inn, up].forEach(g => g.traverse(o => { if (o.isMesh) { o.castShadow = false; if (o.material.transparent) o.renderOrder = -1; } }));   // piesele străvezii din interior se desenează înaintea geamului din față

  /* ---- terasa de lemn-plastic pe care stă casa (1,5 m în față), cu o treaptă în dreptul ușii glisante ---- */
  const DW = L + 1.0, DZ0 = ZB - .3, DZ1 = ZF + 1.5, dzc = (DZ0 + DZ1) / 2;
  mesh(bx(DW, .05, DZ1 - DZ0, 0, YD - .025, dzc), M.wood); mesh(bx(DW - .2, YD - .05, DZ1 - DZ0 - .2, 0, (YD - .05) / 2, dzc), M.dark);
  const ro = [];
  for (let z = ZF + .15; z < DZ1 - .05; z += .15) ro.push(bx(DW, .004, .012, 0, YD + .001, z));
  for (let z = ZI + .25; z < ZF - FR - .05; z += .2) ro.push(bx(tx1 - tx0, .004, .012, txc, FY + .001, z));
  mesh(merge(ro), M.dark, root, false, false);
  mesh(bx(2.6, YD / 2, .34, gc, YD / 4, DZ1 + .17), M.wood);

  // în fiecare punct e loc de stat (0,5 m liber de jur împrejur): vezi surse/final/CASE-3D.md
  const RY = FY + 1.1;
  return {
    root, levels: 1,
    openRoof(k) { F.lift(roof, R, k, 2.2); const f = clamp(clamp(k) * 1.3); RL.fade(f); GF.fade(f * .6); },
    rooms: [{ n: 'Living', x: -1.0, y: RY, z: .75, lvl: 1 }, { n: 'Bucătărie', x: .55, y: RY, z: -.35, lvl: 1 }, { n: 'Baie', x: 2.3, y: RY, z: .974, lvl: 1 }, { n: 'Dormitor', x: 2.21, y: RY, z: -.3, lvl: 1 }],
    size: { w: 10.6, d: 5.5, h: 3.3, cz: .77 },
  };
}
