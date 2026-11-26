// Casa extensibilă „K5” (4,0 × 5,0 m desfăcută, h 2,55 m): o singură cameră de ~20 m², cu terasă pe tot acoperișul
// (balustradă de sticlă de 1,2 m) și scară dreaptă de oțel pe latura din stânga (15 trepte de 28 cm, podest de 1,1 × 1,1 m în spate,
// pe doi stâlpi). Făcută după planșa furnizorului (plan + patru fațade): pereți cu lamele verticale din WPC, maro-arămii, rame
// închise la culoare; pe fațadă o ușă dublă de sticlă (1,6 × 2,32 m) și un vitraj îngust (0,59 × 2,34 m), restul pereților sunt plini.
// Înăuntru, după plan: canapea și pat pe peretele din dreapta, televizor și un corp jos pe peretele dinspre scară. Fără baie, fără bucătărie.
// Axe: X = lățimea fațadei (scara și ușa la −X, canapeaua și patul la +X), fațada cu ușa spre +Z.
import { THREE, box, clamp } from './kit.js';
import * as F from './furn.js';

export const info = { id: 'K5', w: 4.0, d: 5.0, h: 2.55 };

const W = 4.0, D = 5.0, H = 2.55, T = .1;                                     // lățime, adâncime, înălțimea cutiei, grosimea pereților
const Y0 = .15, FY = Y0 + .15, Y1 = Y0 + H, HC = 1.95, YC = FY + HC;           // baza cutiei, pardoseala, vârful cutiei, tăietura acoperișului (de la pardoseală / de la sol)
const YT = Y1 - .08, YD = Y1 + .2, GH = 1.2;                                  // tavanul, puntea terasei (peste rama de 20 cm), înălțimea balustradei
const HW = W / 2, ZF = D / 2, ZB = -D / 2, XI = HW - T, ZG = ZF - T, ZI = ZB + T;
// fațada, de la stânga: ramă 0,10 · ușă 1,60 · perete 1,03 · vitraj 0,59 · perete 0,535 · ramă 0,14
const DX0 = -HW + .1, DX1 = DX0 + 1.6, WX0 = DX1 + 1.03, WX1 = WX0 + .59, OH = 2.28, DY1 = FY + OH;
const GOL = [[(DX0 + DX1) / 2, DX1 - DX0, FY, OH], [(WX0 + WX1) / 2, WX1 - WX0, FY, OH]];   // golurile: [mijloc, lățime, prag, înălțime]
// scara: lățime 1,1 m lângă peretele din stânga; podestul în spate, rampa coboară spre față (4,2 m) și trece puțin de colțul casei
const NT = 15, RUN = .28, RISE = YD / (NT + 1), SXA = -HW - .04, SXB = SXA - 1.1, SXC = (SXA + SXB) / 2, SZ0 = ZB + 1.1, SZ1 = SZ0 + NT * RUN;
const PAS = .1;                                                                // pasul lamelelor de pe pereți
const SKY = [[0, [.4, .38, .38]], [.2, [.52, .49, .47]], [.33, [1.7, 1.65, 1.55]], [.45, [1.1, 1.15, 1.22]], [.8, [.8, .9, 1.08]], [1, [.62, .74, .98]]];   // ca la furn.pane

const bx = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
// mai multe piese din același material, lipite într-un singur mesh
function merge(list) {
  const pos = [], nor = [];
  list.forEach(g0 => { const g = g0.index ? g0.toNonIndexed() : g0, p = g.attributes.position.array, n = g.attributes.normal.array; for (let i = 0; i < p.length; i++) { pos.push(p[i]); nor.push(n[i]); } });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); return g;
}
// perete de-a lungul lui X (la z, gros t), de la yb la yt, cu goluri [mijloc, lățime, prag, înălțime]
function wallX(x0, x1, z, t, yb, yt, holes = []) {
  const out = []; let x = x0;
  holes.forEach(([c, w, s, h]) => { const a = c - w / 2, b = c + w / 2;
    if (a > x) out.push(bx(a - x, yt - yb, t, (a + x) / 2, (yt + yb) / 2, z));
    if (s > yb) out.push(bx(w, s - yb, t, c, (s + yb) / 2, z)); if (s + h < yt) out.push(bx(w, yt - Math.max(s + h, yb), t, c, (yt + Math.max(s + h, yb)) / 2, z)); x = b; });
  if (x1 > x) out.push(bx(x1 - x, yt - yb, t, (x1 + x) / 2, (yt + yb) / 2, z)); return out;
}
// lamele verticale: de-a lungul lui X (pe peretele de la z) sau de-a lungul lui Z (pe peretele de la x), între a și b, de la ya la yb
function slatsX(out, a, b, z, ya, yb) { const n = Math.max(1, Math.round((b - a) / PAS)), p = (b - a) / n; for (let i = 0; i < n; i++) out.push(bx(p * .62, yb - ya, .02, a + (i + .5) * p, (ya + yb) / 2, z)); }
function slatsZ(out, a, b, x, ya, yb) { const n = Math.max(1, Math.round((b - a) / PAS)), p = (b - a) / n; for (let i = 0; i < n; i++) out.push(bx(.02, yb - ya, p * .62, x, (ya + yb) / 2, a + (i + .5) * p)); }
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
  const R = F.fadeSet(M);                                        // materialele acoperișului și ale terasei (se sting când se ridică)
  const GF = F.fadeSet(M);                                       // geamul fațadei: mai străveziu când acoperișul e ridicat
  const root = new THREE.Group(), roof = new THREE.Group(), inn = new THREE.Group(); root.name = 'K5';
  inn.position.y = FY; root.add(inn, roof);                      // inn = interiorul (de la pardoseală)
  const mesh = (g, m, parent = root, cast = true, recv = true) => { const o = new THREE.Mesh(g, m); o.castShadow = cast; o.receiveShadow = recv; parent.add(o); return o; };
  // materiale proprii: lamelele maro-arămii și fondul mai închis dintre ele („emissive” diferit de zero, ca seara să nu fie luminate
  // ca mobila), pardoseala gri-deschis (lumina proprie ține loc de lumina din cameră, ca la pardoseala comună)
  const lemn = new THREE.MeshStandardMaterial({ color: 0xab6b40, roughness: .7, metalness: .05, emissive: 0x010101, emissiveIntensity: 0 });
  const fond = new THREE.MeshStandardMaterial({ color: 0x784a2e, roughness: .8, metalness: .05, side: THREE.DoubleSide, emissive: 0x010101, emissiveIntensity: 0 });
  const RL = F.fadeSet({ lemn, fond });
  const podea = new THREE.MeshStandardMaterial({ color: 0xb3b1ab, roughness: .75, emissive: 0xb3b1ab, emissiveIntensity: .18 });

  /* ---- pereții: până la tăietură rămân pe loc; de la tăietură până sub punte (cu rama terasei) se ridică odată cu acoperișul ---- */
  const YU = YD - .05, pLo = [], pUp = [], sLo = [], sUp = [], inLo = [], inUp = [], frLo = [], frUp = [];
  const zf = ZF - T / 2, zb = ZB + T / 2, yl = (Y0 + YC) / 2, hl = YC - Y0, yu = (YC + YU) / 2, hu = YU - YC;
  pLo.push(...wallX(-HW, HW, zf, T, Y0, YC, GOL), bx(W, hl, T, 0, yl, zb), bx(T, hl, D - 2 * T, -HW + T / 2, yl, 0), bx(T, hl, D - 2 * T, HW - T / 2, yl, 0));
  pUp.push(...wallX(-HW, HW, zf, T, YC, YU, GOL), bx(W, hu, T, 0, yu, zb), bx(T, hu, D - 2 * T, -HW + T / 2, yu, 0), bx(T, hu, D - 2 * T, HW - T / 2, yu, 0));
  // lamelele (între ramele de la colțuri și de la bază); pe fațadă doar pe peretele plin și deasupra golurilor
  const SY0 = Y0 + .1, XR = HW - .14;
  [[DX1, WX0], [WX1, XR]].forEach(([a, b]) => { slatsX(sLo, a, b, ZF + .01, SY0, YC); slatsX(sUp, a, b, ZF + .01, YC, YU); });
  [[DX0, DX1], [WX0, WX1]].forEach(([a, b]) => slatsX(sUp, a, b, ZF + .01, DY1 + .03, YU));
  slatsX(sLo, -XI, XI, ZB - .01, SY0, YC); slatsX(sUp, -XI, XI, ZB - .01, YC, YU);
  [-1, 1].forEach(s => { slatsZ(sLo, ZI, ZG, s * (HW + .01), SY0, YC); slatsZ(sUp, ZI, ZG, s * (HW + .01), YC, YU); });
  mesh(merge(pLo), fond); mesh(merge(pUp), RL.fond, roof); mesh(merge(sLo), lemn); mesh(merge(sUp), RL.lemn, roof);
  // ramele închise la culoare: colțurile, baza, muchia de sus a cutiei și bordura punții
  const E = .028;
  [[-HW + .05, .1], [XR + .07, .14]].forEach(([x, w]) => { frLo.push(bx(w + E, hl, .06, x + Math.sign(x) * E / 2, yl, ZF)); frUp.push(bx(w + E, YD - YC, .06, x + Math.sign(x) * E / 2, (YD + YC) / 2, ZF)); });
  [-1, 1].forEach(s => { frLo.push(bx(.1 + E, hl, .06, s * (HW - .05 + E / 2), yl, ZB), bx(.06, hl, .1, s * HW, yl, ZF - .05), bx(.06, hl, .1, s * HW, yl, ZB + .05));
    frUp.push(bx(.1 + E, YD - YC, .06, s * (HW - .05 + E / 2), (YD + YC) / 2, ZB), bx(.06, YD - YC, .1, s * HW, (YD + YC) / 2, ZF - .05), bx(.06, YD - YC, .1, s * HW, (YD + YC) / 2, ZB + .05));
    frLo.push(bx(.06, .1, D, s * HW, Y0 + .05, 0)); frUp.push(bx(.06, .04, D, s * HW, Y1, 0), bx(.07, .07, D + .07, s * HW, YD - .035, 0)); });
  [[ZF, [[DX1, HW]]], [ZB, [[-HW, HW]]]].forEach(([z, l]) => { l.forEach(([a, b]) => frLo.push(bx(b - a, .1, .06, (a + b) / 2, Y0 + .05, z))); frUp.push(bx(W, .04, .06, 0, Y1, z), bx(W + .07, .07, .07, 0, YD - .035, z)); });
  // rostul dintre partea fixă și aripa care se desface (la 1,585 m de colțul din dreapta), pe față și pe spate
  const XJ = HW - 1.585;
  [ZF + .012, ZB - .012].forEach(z => { frLo.push(bx(.025, YC - SY0, .024, XJ, (YC + SY0) / 2, z)); frUp.push(bx(.025, YU - YC, .024, XJ, (YU + YC) / 2, z)); });

  /* ---- ușa dublă de sticlă și vitrajul îngust (trec de tăietură: partea de sus e în acoperiș) ---- */
  const zd = ZF - .05, dxc = (DX0 + DX1) / 2, wxc = (WX0 + WX1) / 2, ga = FY + .06, gb = DY1 - .06;
  const jamb = (x, w, d = .08) => { frLo.push(bx(w, HC, d, x, FY + HC / 2, zd)); frUp.push(bx(w, DY1 - YC, d, x, (DY1 + YC) / 2, zd)); };
  jamb(DX0 + .03, .06); jamb(DX1 - .03, .06); jamb(dxc - .032, .055, .06); jamb(dxc + .032, .055, .06); jamb(WX0 + .03, .06); jamb(WX1 - .03, .06);
  frLo.push(bx(DX1 - DX0, .06, .08, dxc, FY + .03, zd), bx(WX1 - WX0, .06, .08, wxc, FY + .03, zd), bx(WX1 - WX0 - .1, .04, .06, wxc, FY + .8, zd), bx(WX1 - WX0 - .1, .04, .06, wxc, FY + 1.7, zd));
  frUp.push(bx(DX1 - DX0, .06, .08, dxc, DY1 - .03, zd), bx(WX1 - WX0, .06, .08, wxc, DY1 - .03, zd));
  [[DX0 + .06, dxc - .06], [dxc + .06, DX1 - .06], [WX0 + .06, WX1 - .06]].forEach(([a, b]) => {
    mesh(skyGlass(a, b, ga, YC, ga, gb, zd), GF.glass, root, false, false); mesh(skyGlass(a, b, YC, gb, ga, gb, zd), R.glass, roof, false, false); });
  [-1, 1].forEach(s => root.add(box(.022, .34, .022, M.steel, dxc + s * .075, FY + 1.08, zd + .06), box(.022, .34, .022, M.steel, dxc + s * .075, FY + 1.08, zd - .06)));
  // cele două aplice de pe fațadă (se aprind seara)
  [DX1 + .78, WX1 + .27].forEach(x => { root.add(box(.09, .2, .05, M.dark, x, 1.4, ZF + .045)); const l = box(.055, .14, .03, M.lamp, x, 1.4, ZF + .075); l.castShadow = false; root.add(l); });

  /* ---- pardoseala, fețele dinăuntru ale pereților, grosimea pereților văzută de sus ---- */
  mesh(bx(2 * XI, .04, ZG - ZI, 0, FY - .02, 0), podea, root, false);
  inLo.push(...wallX(-XI, XI, ZG - .006, .012, FY, YC, GOL), bx(2 * XI, HC, .012, 0, FY + HC / 2, ZI + .006), bx(.012, HC, ZG - ZI, -XI + .006, FY + HC / 2, 0), bx(.012, HC, ZG - ZI, XI - .006, FY + HC / 2, 0));
  inUp.push(...wallX(-XI, XI, ZG - .006, .012, YC, YT, GOL), bx(2 * XI, YT - YC, .012, 0, (YT + YC) / 2, ZI + .006), bx(.012, YT - YC, ZG - ZI, -XI + .006, (YT + YC) / 2, 0), bx(.012, YT - YC, ZG - ZI, XI - .006, (YT + YC) / 2, 0));
  const yk = YC - .002, cut = [bx(W - .012, .006, T - .012, 0, yk, zb), bx(T - .012, .006, D - .012, -HW + T / 2, yk, 0), bx(T - .012, .006, D - .012, HW - T / 2, yk, 0)];
  [[-HW, DX0], [DX1, WX0], [WX1, HW]].forEach(([a, b]) => cut.push(bx(b - a - .012, .006, T - .012, (a + b) / 2, yk, zf)));
  mesh(merge(cut), M.cut, root, false);

  /* ---- acoperișul: tavan alb cu spoturi și o șină scurtă cu proiectoare, placa, apoi terasa (punte din scânduri, balustradă de sticlă) ---- */
  mesh(bx(2 * XI, .02, ZG - ZI, 0, YT + .01, 0), R.ceil, roof, false);
  mesh(bx(W - .04, YU - YT - .02, D - .04, 0, (YU + YT + .02) / 2, 0), R.roofDark, roof);
  const sp = []; [-1.15, 0, 1.15].forEach(x => [-1.5, 0, 1.5].forEach(z => sp.push(bx(.09, .008, .09, x, YT - .004, z))));
  [.55, .9, 1.25].forEach(z => sp.push(bx(.05, .05, .05, -.75, YT - .055, z)));
  mesh(merge(sp), R.ledIn, roof, false, false); mesh(bx(.035, .03, 1.1, -.75, YT - .015, .9), R.dark, roof, false, false);
  mesh(bx(W, .05, D, 0, YD - .025, 0), R.wood, roof);
  const ln = []; for (let i = 1; i < 36; i++) ln.push(bx(W - .12, .004, .012, 0, YD + .001, ZB + i * D / 36));
  mesh(merge(ln), R.dark, roof, false, false);
  // balustrada: sticlă pe tot conturul, cu un gol de 1,1 m în dreptul podestului scării; profil jos, mână curentă subțire, stâlpi la colțuri
  const BX = HW - .05, BZ = ZF - .05, gy = YD + .05 + (GH - .08) / 2, gh = GH - .08, rl = [], cap = [];
  const glass = (w, d, x, z) => { const o = box(w, gh, d, R.railglass, x, gy, z); o.castShadow = false; o.receiveShadow = false; roof.add(o); };
  glass(2 * BX, .014, 0, BZ); glass(2 * BX, .014, 0, -BZ); glass(.014, 2 * BZ, BX, 0); glass(.014, BZ - SZ0, -BX, (BZ + SZ0) / 2);
  [[2 * BX, .04, 0, BZ], [2 * BX, .04, 0, -BZ], [.04, 2 * BZ, BX, 0], [.04, BZ - SZ0, -BX, (BZ + SZ0) / 2]].forEach(([w, d, x, z]) => { rl.push(bx(w, .05, d, x, YD + .025, z)); cap.push(bx(w + (w > d ? .04 : 0), .03, d + (d > w ? .04 : 0), x, YD + GH - .015, z)); });
  [[-BX, BZ], [BX, BZ], [BX, -BZ], [-BX, -BZ], [-BX, SZ0]].forEach(([x, z]) => cap.push(bx(.04, GH - .03, .04, x, YD + (GH - .03) / 2, z)));
  mesh(merge(rl), R.frame, roof, false); mesh(merge(cap), R.steel, roof);

  /* ---- interiorul, după plan: canapea de trei locuri și pat (1,5 × 2,0 m, cu două măsuțe rotunde) pe peretele din dreapta;
          televizor și un corp jos pe peretele dinspre scară ---- */
  const put = (o, x, z, ry = 0) => { o.position.set(x, 0, z); o.rotation.y = ry; inn.add(o); return o; };
  put(F.sofa(M, 2.3), XI - .4, 1.22, -Math.PI / 2);
  put(F.bed(M, 1.5, 2.0), XI - 1.09, -1.2, -Math.PI / 2);
  put(F.tableRound(M, .2, .5), XI - .25, -.22); put(F.tableRound(M, .2, .5), XI - .25, -2.17);
  inn.add(box(.04, .58, 1.0, M.black, -XI + .035, 1.3, 1.16), box(.56, .7, 1.2, M.white, -XI + .29, .41, -1.14), box(.52, .06, 1.16, M.dark, -XI + .28, .03, -1.14), box(.012, .6, .012, M.dark, -XI + .575, .41, -1.14));
  mesh(merge(inLo), M.inner, root, false); mesh(merge(inUp), R.inner, roof, false);
  mesh(merge(frLo), M.frame, root); mesh(merge(frUp), R.frame, roof);
  inn.traverse(o => { if (o.isMesh) { o.castShadow = false; if (o.material.transparent) o.renderOrder = -1; } });

  /* ---- soclul retras și treptele de lemn din fața ușii ---- */
  root.add(box(W - .4, Y0, D - .4, M.dark, 0, Y0 / 2, 0));
  const st = F.steps(M, 1.8, 2, FY / 2, .3, M.wood); st.position.set(dxc, 0, ZF + .48); root.add(st);

  /* ---- scara din afară (rămâne pe loc când se ridică acoperișul): vanguri de oțel, trepte de lemn, podest pe doi stâlpi, balustradă cu bare ---- */
  const nose = z => RISE + (SZ1 - z) / RUN * RISE;                              // linia muchiilor treptelor, la z
  const an = Math.atan2(NT * RISE, NT * RUN), LS = Math.hypot(NT * RISE, NT * RUN), zm = (SZ0 + SZ1) / 2;
  const slope = (w, h, x, dy) => new THREE.BoxGeometry(w, h, LS).rotateX(an).translate(x, nose(zm) + dy, zm);
  const tr = [], ot = [bx(1.1, .1, 1.1, SXC, YD - .09, ZB + .55)];
  for (let i = 1; i <= NT; i++) tr.push(bx(1.0, .04, RUN, SXC, i * RISE - .02, SZ1 - (i - .5) * RUN));
  tr.push(bx(1.1, .04, 1.1, SXC, YD - .02, ZB + .55));
  [SXA - .025, SXB + .025].forEach(x => ot.push(slope(.05, .2, x, -.5 * RISE - .08)));
  [ZB + .05, SZ0 - .05].forEach(z => ot.push(bx(.1, YD - .14, .1, SXB + .05, (YD - .14) / 2, z), bx(.26, .016, .26, SXB + .05, .008, z)));
  // balustrada: pe latura din afară a rampei și pe două laturi ale podestului (cea din afară și cea din spate)
  const xr = SXB + .025, zr = ZB + .025, rh = 1.2;
  ot.push(slope(.05, .05, xr, rh - .025), slope(.04, .04, xr, .12));
  for (let j = 0; j < NT * 2; j++) { const z = SZ1 - (j + .5) * RUN / 2; ot.push(bx(.02, rh - .16, .02, xr, nose(z) + .12 + (rh - .16) / 2, z)); }
  [SZ1 - .03, zm, SZ0 + .03].forEach(z => ot.push(bx(.05, rh + .1, .05, xr, nose(z) + (rh - .1) / 2, z)));
  ot.push(bx(.05, .05, 1.1, xr, YD + rh - .025, ZB + .55), bx(.04, .04, 1.1, xr, YD + .12, ZB + .55), bx(1.1, .05, .05, SXC, YD + rh - .025, zr), bx(1.1, .04, .04, SXC, YD + .12, zr), bx(.05, rh, .05, xr, YD + rh / 2, zr), bx(.05, rh, .05, SXA - .025, YD + rh / 2, zr));
  for (let j = 1; j < 8; j++) ot.push(bx(.02, rh - .16, .02, xr, YD + .12 + (rh - .16) / 2, ZB + j * 1.1 / 8), bx(.02, rh - .16, .02, SXB + j * 1.1 / 8, YD + .12 + (rh - .16) / 2, zr));
  mesh(merge(tr), M.wood); mesh(merge(ot), M.frame);

  // punctele: y = pardoseala + 1,1 (pardoseala nu e din materialul comun, deci pagina își ia înălțimea podelei de aici); în fiecare
  // e loc de stat (0,5 m liber de jur împrejur). Terasa e pe acoperiș: se vede doar cu acoperișul la loc (la mersul prin casă),
  // de aceea are lvl 2 (la vederea de sus, cu acoperișul ridicat, eticheta ei ar pluti deasupra patului).
  return {
    root, levels: 1,
    openRoof(k) { F.lift(roof, R, k, 2.2); const f = clamp(clamp(k) * 1.3); RL.fade(f); GF.fade(f * .6); },
    rooms: [{ n: 'Cameră', x: -.4, y: FY + 1.1, z: .9, lvl: 1 }, { n: 'Terasă', x: .3, y: YD + 1.1, z: -.6, lvl: 2 }],
    size: { w: 6.5, d: 5.7, h: YD + GH, cz: .3 },
  };
}
