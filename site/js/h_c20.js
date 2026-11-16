// Casa extensibilă de 20 ft „C20” (5,9 × 6,2 m desfăcută, h 2,48 m): un miez de container (2,2 m lățime, mai înalt, cu ramă neagră)
// și două aripi care se desfac în lateral (câte 2,0 m, cu acoperișul puțin înclinat). Două dormitoare și un living cu bucătărie.
// Făcută după planul din oferta furnizorului și după filmulețul din fabrică primite de la client (17 nov 2026): panouri maro cu
// aspect de lemn, rame negre, vitraj dublu la mijloc, ferestre pe aripi; în interior pereți albi cu rame negre, pardoseală
// gri-bej, bucătărie albă în L, baie în spatele miezului, două uși alăturate spre dormitoare. Împărțirea (din plan, măsurată de la
// colțul din stânga-spate): bucătărie 2,33 m · baie 1,39 m · dormitoare 2,48 m pe lățime; dormitorul din spate 3,44 m, cel din față
// 2,42 m pe adâncime. Mobila (canapea, paturi) e pusă doar ca să se înțeleagă camerele: casa vine goală.
// Axe: X = lățimea fațadei (livingul și bucătăria la −X, dormitoarele la +X), fațada cu ușa de sticlă spre +Z.
import { THREE, box, clamp } from './kit.js';
import * as F from './furn.js';

export const info = { id: 'C20', w: 6.2, d: 5.9, h: 2.48 };

const WT = 6.2, DT = 5.9, H = 2.48, CX = 1.1, T = .075;                       // lățime, adâncime, înălțime, jumătatea miezului, grosimea pereților
const Y0 = .16, FY = Y0 + .14, Y1 = Y0 + H, HC = 1.92, YC = FY + HC;          // baza, pardoseala, vârful miezului, tăietura acoperișului (de la pardoseală / de la sol)
const HW = WT / 2, ZF = DT / 2, ZB = -DT / 2, ZG = ZF - T, ZI = ZB + T, XI = HW - T;
const YI = Y1 - .12, YO = Y1 - .30, RS = .07;                                // acoperișul aripilor: înălțimea lângă miez, la margine; grosimea
const SL = (YI - YO) / (HW - CX);                                            // panta lui
const WW = 1.0, WH = .9, WS = FY + .95, WXF = 2.05, WZE = [-1.3, 1.55];       // ferestrele: lățime, înălțime, pervaz; locul lor pe față / spate (±x) și pe capete (z)
const XB = .62, ZP = .54, ZBA = -.69, XL = -.77, ZS = -2.25;                  // peretele dormitoarelor, peretele dintre ele, fața băii, peretele ei din stânga, geamul dușului
const BD0 = -.16, BD1 = .59, D1 = [-.38, .48], D2 = [.6, 1.46];               // ușa băii (pe X), ușile dormitoarelor (pe Z): cel din spate, cel din față
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
  holes.slice().sort((a, b) => a[0] - b[0]).forEach(([c, w, s, h]) => { const a = c - w / 2, b = c + w / 2;
    if (a > x) out.push(bx(a - x, yt - yb, t, (a + x) / 2, (yt + yb) / 2, z));
    if (s > yb) out.push(bx(w, s - yb, t, c, (s + yb) / 2, z)); if (s + h < yt) out.push(bx(w, yt - s - h, t, c, (yt + s + h) / 2, z)); x = b; });
  if (x1 > x) out.push(bx(x1 - x, yt - yb, t, (x1 + x) / 2, (yt + yb) / 2, z)); return out;
}
// la fel, de-a lungul lui Z (la x)
function wallZ(z0, z1, x, t, yb, yt, holes = []) {
  const out = []; let z = z0;
  holes.slice().sort((a, b) => a[0] - b[0]).forEach(([c, w, s, h]) => { const a = c - w / 2, b = c + w / 2;
    if (a > z) out.push(bx(t, yt - yb, a - z, x, (yt + yb) / 2, (a + z) / 2));
    if (s > yb) out.push(bx(t, s - yb, w, x, (s + yb) / 2, c)); if (s + h < yt) out.push(bx(t, yt - s - h, w, x, (yt + s + h) / 2, c)); z = b; });
  if (z1 > z) out.push(bx(t, yt - yb, z1 - z, x, (yt + yb) / 2, (z1 + z) / 2)); return out;
}
// bucată de perete cu marginea de sus înclinată (sub acoperișul unei aripi): între x0 și x1, de la yb până la y0 (la x0) / y1 (la x1), groasă t pe Z
function slopeX(x0, x1, yb, y0, y1, z, t) {
  const sh = new THREE.Shape([new THREE.Vector2(x0, yb), new THREE.Vector2(x1, yb), new THREE.Vector2(x1, y1), new THREE.Vector2(x0, y0)]);
  return new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: false }).translate(0, 0, z - t / 2);
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
  const root = new THREE.Group(), roof = new THREE.Group(), inn = new THREE.Group(), up = new THREE.Group(); root.name = 'C20';
  inn.position.y = up.position.y = FY; root.add(inn, roof); roof.add(up);   // inn = interiorul (de la pardoseală); up = piesele interioare de deasupra tăieturii
  const mesh = (g, m, parent = root, cast = true, recv = true) => { const o = new THREE.Mesh(g, m); o.castShadow = cast; o.receiveShadow = recv; parent.add(o); return o; };
  // materiale proprii: panourile maro cu aspect de lemn („emissive” diferit de zero, ca seara să nu fie luminate ca mobila) și pardoseala gri-bej
  const lemn = new THREE.MeshStandardMaterial({ color: 0x6f4b31, roughness: .72, metalness: .05, side: THREE.DoubleSide, emissive: 0x010101, emissiveIntensity: 0 });
  const RL = F.fadeSet({ lemn });
  const podea = new THREE.MeshStandardMaterial({ color: 0xb9b3a7, roughness: .8, emissive: 0xb9b3a7, emissiveIntensity: .22 });   // (lumina proprie ține loc de lumina din cameră, ca la pardoseala comună)

  /* ---- pereții din afară: aripile (maro) cu ferestre; partea de sus, până sub acoperișul înclinat, se ridică odată cu acoperișul ---- */
  const win = c => [c, WW, WS, WH], pLo = [], pUp = [], inLo = [], inUp = [], frLo = [], frUp = [], gl = [];
  const yw = x => YI - RS - (Math.abs(x) - CX) * SL;                           // sub acoperișul aripii, la x
  [-1, 1].forEach(s => {
    const xa = s < 0 ? -HW : CX, xb = s < 0 ? -CX : HW, xc = (xa + xb) / 2, xo = s * (HW - T / 2);
    [[ZF - T / 2, 1], [ZB + T / 2, -1]].forEach(([z, f]) => {                   // față și spate
      pLo.push(...wallX(xa, xb, z, T, Y0, YC, [win(s * WXF)])); pUp.push(slopeX(xa, xb, YC, yw(xa), yw(xb), z, T));
      inLo.push(...wallX(xa + (s < 0 ? T : 0), xb - (s > 0 ? T : 0), z - f * (T / 2 + .006), .012, FY, YC, [win(s * WXF)])); inUp.push(slopeX(xa + (s < 0 ? T : 0), xb - (s > 0 ? T : 0), YC, yw(xa) - .02, yw(xb) - .02, z - f * (T / 2 + .006), .012));
      gl.push([s * WXF, WS + WH / 2, z + f * .01, f > 0 ? 0 : Math.PI]); });
    pLo.push(...wallZ(ZB, ZF, xo, T, Y0, YC, WZE.map(win))); pUp.push(bx(T, yw(HW) - YC, DT, xo, (yw(HW) + YC) / 2, 0));   // capătul aripii, cu două ferestre
    inLo.push(...wallZ(ZI, ZG, xo - s * (T / 2 + .006), .012, FY, YC, WZE.map(win))); inUp.push(bx(.012, yw(HW) - .02 - YC, DT - 2 * T, xo - s * (T / 2 + .006), (yw(HW) - .02 + YC) / 2, 0));
    WZE.forEach(z => gl.push([xo + s * .01, WS + WH / 2, z, s * Math.PI / 2]));
    // acoperișul aripii (puțin înclinat spre margine) și tavanul de sub el
    const an = -s * Math.atan(SL), ln = (HW - CX + .06) / Math.cos(an), ym = (YI + YO) / 2;
    mesh(new THREE.BoxGeometry(ln, RS, DT - .02).rotateZ(an).translate(s * (HW + CX + .06) / 2, ym - RS / 2, 0), R.roofDark, roof);
    mesh(new THREE.BoxGeometry((HW - CX - T) / Math.cos(an), .015, DT - 2 * T).rotateZ(an).translate(s * (HW + CX - T) / 2, ym - RS - .012, 0), R.ceil, roof, false);
    // colțurile și marginile negre ale aripii
    [ZF - .03, ZB + .03].forEach(z => { frLo.push(bx(.06, YC - Y0, .06, s * (HW - .03), (YC + Y0) / 2, z)); frUp.push(bx(.06, yw(HW) + RS - YC, .06, s * (HW - .03), (yw(HW) + RS + YC) / 2, z)); });
    frLo.push(bx(HW - CX, .1, .03, xc, Y0 + .05, ZF + .003), bx(HW - CX, .1, .03, xc, Y0 + .05, ZB - .003), bx(.03, .1, DT, s * (HW + .003), Y0 + .05, 0));
  });
  // miezul: spatele (cu fereastra mică a băii) și rama neagră de oțel; fața e toată de sticlă
  const bw = [-.1, .42, FY + 1.3, .42];
  pLo.push(...wallX(-CX, CX, ZB + T / 2, T, Y0, YC, [bw])); pUp.push(bx(2 * CX, Y1 - .1 - YC, T, 0, (Y1 - .1 + YC) / 2, ZB + T / 2));
  inLo.push(...wallX(-CX, CX, ZB + T + .006, .012, FY, YC, [bw])); inUp.push(bx(2 * CX, Y1 - .13 - YC, .012, 0, (Y1 - .13 + YC) / 2, ZB + T + .006));
  [-1, 1].forEach(s => [ZF - .05, ZB + .05].forEach(z => { frLo.push(bx(.1, YC - Y0, .1, s * (CX - .02), (YC + Y0) / 2, z)); frUp.push(bx(.1, Y1 - YC, .1, s * (CX - .02), (Y1 + YC) / 2, z)); }));
  frUp.push(bx(2 * CX + .06, .1, .1, 0, Y1 - .05, ZF - .05), bx(2 * CX + .06, .1, .1, 0, Y1 - .05, ZB + .05), bx(.1, .1, DT, -CX + .02, Y1 - .05, 0), bx(.1, .1, DT, CX - .02, Y1 - .05, 0));
  frLo.push(bx(2 * CX + .06, .12, .1, 0, Y0 + .06, ZF - .04), bx(2 * CX + .06, .12, .1, 0, Y0 + .06, ZB + .04));
  mesh(bx(2 * CX - .1, .08, DT - .1, 0, Y1 - .06, 0), R.roofDark, roof); mesh(bx(2 * CX - .16, .015, DT - 2 * T, 0, Y1 - .125, 0), R.ceil, roof, false);
  mesh(merge(pLo), lemn); mesh(merge(pUp), RL.lemn, roof);

  /* ---- ferestrele: rame negre, geam; vitrajul din față (trece de tăietură: partea de sus e în acoperiș): ușa e canatul din stânga,
          cel din dreapta e fix (peretele dormitoarelor ajunge în dreptul lui) ---- */
  gl.forEach(([x, y, z, ry]) => { const g = F.glazing(M, WW, WH, 2, .05); g.position.set(x, y, z); g.rotation.y = ry; root.add(g); });
  { const g = F.glazing(M, bw[1], bw[3], 1, .04); g.position.set(bw[0], bw[2] + bw[3] / 2, ZB - .01); g.rotation.y = Math.PI; root.add(g); }
  const DX = .95, DY1 = FY + 2.1, zd = ZF - .06, ga = FY + .06, gb = DY1 - .06;
  [-1, 1].forEach(s => { frLo.push(bx(.07, YC - FY, .08, s * (DX - .035), (YC + FY) / 2, zd), bx(.05, YC - FY, .06, s * .03, (YC + FY) / 2, zd)); frUp.push(bx(.07, DY1 - YC, .08, s * (DX - .035), (DY1 + YC) / 2, zd), bx(.05, DY1 - YC, .06, s * .03, (DY1 + YC) / 2, zd)); });
  frLo.push(bx(2 * DX, .06, .08, 0, FY + .03, zd)); frUp.push(bx(2 * DX, .07, .08, 0, DY1 - .035, zd), bx(2 * CX - .2, Y1 - .1 - DY1, .05, 0, (Y1 - .1 + DY1) / 2, zd));
  [-1, 1].forEach(s => { mesh(skyGlass(s < 0 ? -DX + .07 : .055, s < 0 ? -.055 : DX - .07, ga, YC, ga, gb, zd), GF.glass, root, false, false); mesh(skyGlass(s < 0 ? -DX + .07 : .055, s < 0 ? -.055 : DX - .07, YC, gb, ga, gb, zd), R.glass, roof, false, false); });
  root.add(box(.025, .16, .05, M.dark, -.1, FY + 1.05, zd + .05), box(.025, .16, .05, M.dark, -.1, FY + 1.05, zd - .05));

  /* ---- pardoseala și ramele negre din interior (plinta, colțurile, grinzile de la îmbinarea aripilor cu miezul); tavanul e alb, simplu ---- */
  mesh(bx(WT - 2 * T, .04, DT - 2 * T, 0, FY - .02, 0), podea, root, false);
  const PL = .05;
  frLo.push(bx(WT - 2 * T, PL, .02, 0, FY + PL / 2, ZI + .012), bx(.02, PL, DT - 2 * T, -XI + .012, FY + PL / 2, 0), bx(.02, PL, DT - 2 * T, XI - .012, FY + PL / 2, 0));
  [[-XI, -CX], [CX, XI]].forEach(([a, b]) => frLo.push(bx(b - a, PL, .02, (a + b) / 2, FY + PL / 2, ZG - .012)));
  [-1, 1].forEach(s => { [ZG - .02, ZI + .02].forEach(z => { frLo.push(bx(.035, YC - FY, .035, s * (XI - .02), (YC + FY) / 2, z)); frUp.push(bx(.035, yw(HW) - .02 - YC, .035, s * (XI - .02), (yw(HW) - .02 + YC) / 2, z)); });
    mesh(bx(.09, .14, DT - 2 * T, s * CX, Y1 - .195, 0), R.frame, roof, false); });

  /* ---- interiorul, după planul din ofertă: living + bucătărie în L (stânga și mijloc) · baie (în spate, la mijloc) · două dormitoare (dreapta) ---- */
  const wLo = [], wUp = [], put = (o, x, z, ry = 0) => { o.position.set(x, 0, z); o.rotation.y = ry; inn.add(o); return o; };
  const HT = Y1 - .13 - FY, HWg = y => y - .02 - FY, ZE = zd - .04;             // tavanul miezului, de la pardoseală; tavanul aripii; unde se oprește peretele dormitoarelor (la vitraj)
  // peretele dormitoarelor (e și peretele din dreapta al băii), cu cele două uși alăturate
  [[ZI, D1[0]], [D1[1], D2[0]], [D2[1], ZE]].forEach(([a, b]) => wLo.push(bx(.06, HC, b - a, XB, HC / 2, (a + b) / 2)));
  wUp.push(bx(.06, HT - HC, ZE - ZI, XB, (HT + HC) / 2, (ZE + ZI) / 2));
  // peretele dintre dormitoare (sub tavanul drept al miezului, apoi sub cel înclinat al aripii)
  wLo.push(bx(XI - XB - .03, HC, .06, (XI + XB + .03) / 2, HC / 2, ZP));
  wUp.push(bx(CX - XB - .03, HT - HC, .06, (CX + XB + .03) / 2, (HT + HC) / 2, ZP), slopeX(CX, XI, HC, HWg(yw(CX)), HWg(yw(XI)), ZP, .06));
  // baia: peretele din față (cu ușa de sticlă mată, cu ramă neagră) și cel dinspre bucătărie
  wLo.push(bx(BD0 - XL + .03, HC, .06, (BD0 + XL - .03) / 2, HC / 2, ZBA), bx(.06, HC, ZBA - ZI, XL, HC / 2, (ZBA + ZI) / 2));
  wUp.push(bx(XB - XL + .03, HT - HC, .06, (XB + XL - .03) / 2, (HT + HC) / 2, ZBA), bx(.06, HT - HC, ZBA - ZI, XL, (HT + HC) / 2, (ZBA + ZI) / 2));
  inn.add(box(BD1 - BD0 - .05, HC - .04, .02, M.showerglass, (BD0 + BD1) / 2, HC / 2, ZBA), box(.02, .3, .07, M.dark, BD0 + .12, 1.0, ZBA));
  [BD0 + .015, BD1 - .015].forEach(x => frLo.push(bx(.03, HC, .08, x, FY + HC / 2, ZBA)));
  // ușile dormitoarelor (albe): prinse lângă peretele dintre dormitoare, întredeschise spre interiorul camerelor, ca în plan
  [[D1[1], -1], [D2[0], 1]].forEach(([z, s]) => { const g = new THREE.Group(); g.add(box(.04, HC - .02, .84, M.white, 0, (HC - .02) / 2, s * .42)); g.position.set(XB + .03, 0, z); g.rotation.y = s * .44; inn.add(g); });
  // bucătăria în L: corpuri albe cu blat alb pe peretele din spate (sub fereastră) și pe peretele băii, unde e chiuveta dublă de inox
  const KX0 = -XI + .005, KX1 = XL - .03, KZ = ZI + .58, KE = -1.25, KW = .56;   // marginile corpurilor: stânga, dreapta, fața celor din spate, capătul laturii scurte, adâncimea ei
  inn.add(box(KX1 - KX0, .86, .56, M.white, (KX0 + KX1) / 2, .43, ZI + .28), box(KX1 - KX0, .04, .6, M.white, (KX0 + KX1) / 2, .88, ZI + .3),
    box(KW, .86, KE - KZ, M.white, KX1 - KW / 2, .43, (KE + KZ) / 2), box(KW + .03, .04, KE - KZ + .02, M.white, KX1 - KW / 2 - .015, .88, (KE + KZ) / 2 + .01),
    box(.38, .012, .34, M.steel, KX1 - KW / 2, .905, KZ + .28), box(.38, .012, .34, M.steel, KX1 - KW / 2, .905, KZ + .68), box(.02, .24, .02, M.steel, KX1 - .08, 1.02, KZ + .48), box(.14, .02, .02, M.steel, KX1 - .15, 1.13, KZ + .48));
  [-2.6, -2.15, -1.7].forEach(x => inn.add(box(.12, .012, .012, M.dark, x, .72, KZ + .006)));   // mânerele negre
  [KZ + .28, KZ + .78].forEach(z => inn.add(box(.012, .012, .12, M.dark, KX1 - KW - .006, .72, z)));
  // livingul: canapea pe peretele din stânga, măsuță, covor
  put(F.rug(M, 1.7, 2.1), -1.85, .95); put(F.sofa(M, 1.8, M.fabric), -XI + .43, .95, Math.PI / 2); put(F.coffee(M, .32), -1.95, .95);
  // dormitorul din spate (cel mare): pat dublu cu capul la peretele din spate; dormitorul din față: pat de-a lungul peretelui din față
  put(F.bed(M, 1.6, 2.0), 1.84, ZI + 1.085); put(F.bed(M, 1.2, 2.0), XI - 1.085, ZG - .62, -Math.PI / 2);
  inn.add(box(.4, .45, .38, M.wood, 2.86, .225, ZI + .24), box(.38, .45, .4, M.wood, XI - .21, .225, ZG - 1.44));
  // baia: duș pe toată lățimea în spate (după un geam mat), vas de toaletă pe peretele din stânga, lavoar suspendat cu oglindă lângă ușă; pardoseală de gresie
  inn.add(box(XB - XL - .06, .012, ZBA - ZI - .03, M.stone, (XB + XL) / 2, .006, (ZBA + ZI) / 2));
  put(F.shower(M, XB - XL - .08, ZS - ZI), (XB + XL) / 2 - .01, (ZS + ZI) / 2);
  put(F.wc(M), XL + .294, -1.95, Math.PI / 2).scale.z = .8;
  { const v = put(F.vanity(M, .5), XL + .3, ZBA - .275, Math.PI); v.scale.y = .9; v.position.y = .1; }
  mesh(merge(wLo), M.inner, inn, false); mesh(merge(wUp), R.inner, up, false);
  mesh(merge(inLo), M.inner, root, false); mesh(merge(inUp), R.inner, roof, false);
  mesh(merge(frLo), M.frame, root); mesh(merge(frUp), R.frame, roof);
  // grosimea pereților văzută de sus, când acoperișul e ridicat
  const yk = YC - .002, cut = [bx(WT - .012, .006, T - .012, 0, yk, ZB + T / 2), bx(T - .012, .006, DT - .012, -HW + T / 2, yk, 0), bx(T - .012, .006, DT - .012, HW - T / 2, yk, 0)];
  [[-HW, -CX], [CX, HW]].forEach(([a, b]) => cut.push(bx(b - a - .012, .006, T - .012, (a + b) / 2, yk, ZF - T / 2)));
  mesh(merge(cut), M.cut, root, false);
  [inn, up].forEach(g => g.traverse(o => { if (o.isMesh) { o.castShadow = false; if (o.material.transparent) o.renderOrder = -1; } }));   // piesele străvezii din interior se desenează înaintea geamului din față

  /* ---- soclul retras și treptele de lemn din fața ușii ---- */
  root.add(box(WT - .5, Y0, DT - .5, M.dark, 0, Y0 / 2, 0));
  const st = F.steps(M, 1.9, 2, FY / 2, .3, M.wood); st.position.set(0, 0, ZF + .45); root.add(st);

  // punctele camerelor: y = pardoseala + 1,1 (pardoseala nu e din materialul comun, deci pagina își ia înălțimea podelei de aici);
  // în fiecare punct e loc de stat (0,5 m liber de jur împrejur): vezi surse/final/CASE-3D.md
  const RY = FY + 1.1;
  return {
    root, levels: 1,
    openRoof(k) { F.lift(roof, R, k, 2.2); const f = clamp(clamp(k) * 1.3); RL.fade(f); GF.fade(f * .6); },
    rooms: [{ n: 'Living', x: -.9, y: RY, z: 1.0, lvl: 1 }, { n: 'Bucătărie', x: -2.1, y: RY, z: -1.45, lvl: 1 }, { n: 'Baie', x: .05, y: RY, z: -1.25, lvl: 1 },
      { n: 'Dormitor 1', x: 1.84, y: RY, z: -.15, lvl: 1 }, { n: 'Dormitor 2', x: 1.85, y: RY, z: 1.12, lvl: 1 }],
    size: { w: 6.6, d: 6.6, h: 2.64, cz: .3 },
  };
}
