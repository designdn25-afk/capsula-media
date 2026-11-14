// Casa E7 (11,5 × 3,3 × 3,3 m): capsulă lungă pe picioare, cu acoperiș subțire ieșit în afară (ca un capac) și balcon integrat.
// După imaginea din catalog. Axe: X = lungimea (livingul la −X, balconul la +X), intrarea pe fațada +Z, Y în sus. Unități: metri.
// Rudă cu X7 (js/x7.js): aceeași carcasă rotunjită plimbată pe contur, geamuri desenate „desfășurat” (s, y) și așezate pe carcasă.
import { THREE, box, perimeter, sweep, cap, arcBottom, wrapPoly, grow, clipPoly } from './kit.js';
import * as F from './furn.js';

export const info = { id: 'E7', w: 11.5, d: 3.3, h: 3.3 };

// corpul (L × W, colțuri R) · acoperișul-capac (RL × RW, colțuri RR) · cote pe înălțime · XB = peretele de sticlă dintre dormitor și balcon
const D = { L: 11.1, W: 3.0, R: 1.15, RL: 11.5, RW: 3.3, RR: 1.3, Y0: .55, YF: .8, G0: .84, G1: 2.86, YW1: 2.98, YC: 2.95, H: 3.3, XB: 3.9 };

// unește mai multe geometrii într-una singură (poziții + normale), ca să fie mai puține mesh-uri
function merge(list) {
  const pos = [], nor = [], idx = [];
  list.forEach(g => {
    const b = pos.length / 3, p = g.attributes.position, n = g.attributes.normal, ix = g.index;
    for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); }
    if (ix) for (let i = 0; i < ix.count; i++) idx.push(b + ix.getX(i)); else for (let i = 0; i < p.count; i++) idx.push(b + i);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
  return g;
}
// cutie ca geometrie (pentru piesele unite): centrul în (x, y, z), rotită cu ry în jurul verticalei
const bg = (w, h, d, x, y, z, ry = 0) => { const g = new THREE.BoxGeometry(w, h, d); if (ry) g.rotateY(ry); g.translate(x, y, z); return g; };
// bucată de pardoseală după contur, între s0 și s1, închisă cu o linie dreaptă (podeaua balconului)
function capArc(per, y, d, s0, s1, ds = .14) {
  const n = Math.ceil((s1 - s0) / ds), sh = new THREE.Shape();
  for (let i = 0; i <= n; i++) { const p = per.at(s0 + (s1 - s0) * i / n), x = p.x - p.nx * d, z = -(p.z - p.nz * d); i ? sh.lineTo(x, z) : sh.moveTo(x, z); }
  const g = new THREE.ShapeGeometry(sh); g.rotateX(-Math.PI / 2); g.translate(0, y, 0); return g;
}
// profil mutat în afară cu o (rosturile de pe acoperiș stau la câțiva milimetri deasupra lui)
const offP = (P, o) => P.map((p, j) => { const a = P[Math.max(0, j - 1)], b = P[Math.min(P.length - 1, j + 1)], dd = b.d - a.d, dy = b.y - a.y, l = Math.hypot(dd, dy) || 1; return { d: p.d - o * dy / l, y: p.y + o * dd / l }; });

export function build(M) {
  const per = perimeter(D.L, D.W, D.R), perR = perimeter(D.RL, D.RW, D.RR), T = per.total;
  const root = new THREE.Group(); root.name = 'E7';
  const R = F.fadeSet(M), roof = new THREE.Group(); roof.name = 'roof'; root.add(roof);   // acoperișul are setul lui de materiale
  const mesh = (g, m, parent = root, cast = true, recv = true) => { const o = new THREE.Mesh(g, m); o.castShadow = cast; o.receiveShadow = recv; parent.add(o); return o; };
  const g0 = D.G0, g1 = D.G1, YF = D.YF, XB = D.XB, c = .45;

  /* ---- golurile, în coordonate desfășurate (s, y): octogoane cu colțuri teșite ---- */
  const oct = (s0, s1) => [[s0, g0 + c], [s0 + c, g0], [s1 - c, g0], [s1, g0 + c], [s1, g1 - c], [s1 - c, g1], [s0 + c, g1], [s0, g1 - c]];
  const sL0 = per.sFront(-3.2), sL1 = per.sBack(-3.5);                 // livingul: fața, capătul rotund, colțul din spate
  const LIV = oct(sL0, sL1);
  const sR1 = per.sFront(.65), sR0 = per.sBack(XB + .04) - T;          // golul mare din dreapta: geamul dormitorului + balconul deschis
  const OPEN = oct(sR0, sR1), sP = per.sFront(XB);                     // sP = locul peretelui de sticlă
  const BED = clipPoly(OPEN, sP, true);                                // doar partea cu geam (dormitorul)
  const sc = per.sFront(-2), dy0 = YF + .02, dy1 = 2.74, ch = .07;     // ușa de intrare
  const DOOR = [[sc - .5 + ch, dy0], [sc + .5 - ch, dy0], [sc + .5, dy0 + ch], [sc + .5, dy1 - ch], [sc + .5 - ch, dy1], [sc - .5 + ch, dy1], [sc - .5, dy1 - ch], [sc - .5, dy0 + ch]];

  /* ---- carcasa albă ---- */
  mesh(sweep(per, [...arcBottom(D.Y0, .25), { d: 0, y: g0 }]), M.shell);            // burta rotunjită + brâul de jos
  mesh(sweep(per, [{ d: 0, y: g1 }, { d: 0, y: D.YW1 }]), M.shell);                 // brâul de sus
  const rect = (a, b) => [[a, g0], [b, g0], [b, g1], [a, g1]];
  const tri = (s, k) => [[[s, g0], [s + k * c, g0], [s, g0 + c]], [[s, g1], [s + k * c, g1], [s, g1 - c]]];
  const panels = [rect(sR1, sL0), rect(sL1, sR0 + T), ...tri(sL0, 1), ...tri(sL1, -1), ...tri(sR0, 1), ...tri(sR1, -1)];
  mesh(merge(panels.map(p => wrapPoly(per, p, { off: 0 }))), M.shell);
  mesh(sweep(per, [{ d: 0, y: D.YW1 + .002 }, { d: .13, y: D.YW1 + .002 }]), M.cut, root, false);       // grosimea pereților, văzută de sus
  mesh(sweep(per, [{ d: -.004, y: 2.935 }, { d: -.004, y: D.YW1 }]), M.frame, root, false);             // umbra de sub capac
  // rosturi verticale simple între panouri
  const seams = [], vt = (s, y0, y1) => seams.push(wrapPoly(per, [[s - .014, y0], [s + .014, y0], [s + .014, y1], [s - .014, y1]], { off: .004 }));
  [-2.68, -1.32, .05].forEach(x => vt(per.sFront(x), D.Y0 + .26, 2.925));
  [-2.68, -1.32, .05, 1.7].forEach(x => vt(per.sBack(x), D.Y0 + .26, 2.925));
  mesh(merge(seams), M.seam, root, false);
  // ușa simplă: panou alb ieșit puțin, cu rost închis la culoare și mâner vertical
  mesh(wrapPoly(per, grow(DOOR, .03), { off: .006 }), M.frame, root, false);
  mesh(wrapPoly(per, DOOR, { off: .012 }), M.shell, root, false);
  root.add(box(.035, .5, .05, M.frame, -2.36, YF + 1.05, per.w + .045));
  // căptușeala interioară a pereților plini (seara luminează cald)
  [[sR1, sL0], [sL1, sR0 + T]].forEach(([a, b]) => mesh(sweep(per, [{ d: .1, y: 2.94 }, { d: .1, y: YF }], { s0: a, s1: b }), M.inner, root, false));

  /* ---- vitrajul: geam cu reflexia cerului, ramă închisă, bandă LED pe contur ---- */
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t), GR = [.5, .47, .46], HZ = [1.75, 1.7, 1.6], MID = [1.12, 1.16, 1.22], TOPC = [.8, .9, 1.08];
  const YS = [1.25, 1.52, 1.72, 2.3];
  const skyCol = (s, y) => { const w = .04 * Math.sin(s * 2.1); return y < YS[0] ? mix([.36, .34, .34], GR, (y - g0) / (YS[0] - g0)) : y < YS[1] ? mix(GR, HZ, (y - YS[0]) / (YS[1] - YS[0]) + w) : y < YS[2] ? mix(HZ, MID, (y - YS[1]) / (YS[2] - YS[1])) : y < YS[3] ? mix(MID, TOPC, (y - YS[2]) / (YS[3] - YS[2])) : mix(TOPC, [.62, .74, .98], (y - YS[3]) / (g1 - YS[3])); };
  [LIV, BED].forEach(w => mesh(wrapPoly(per, w, { off: 0, ys: YS, color: skyCol }), M.glass, root, false, false));
  const ringOf = (o, i) => o.map((p, k) => [p, o[(k + 1) % o.length], i[(k + 1) % i.length], i[k]]);
  const strip = (w, s, hw = .035) => clipPoly(clipPoly(w, s - hw, true), s + hw, false);            // montant vertical
  const frames = [], leds = [];
  [LIV, OPEN].forEach(w => {
    ringOf(w, grow(w, -.075)).forEach(q => frames.push(wrapPoly(per, q, { off: .008 })));
    ringOf(grow(w, .04), w).forEach(q => leds.push(wrapPoly(per, q, { off: .01 })));
  });
  [[LIV, [8.8, 10.6, 11.31, 13.11]], [BED, [1.58, 2.66]]].forEach(([w, list]) => list.forEach(s => frames.push(wrapPoly(per, strip(w, s), { off: .009 }))));
  frames.push(wrapPoly(per, strip(OPEN, sP, .05), { off: .009 }));
  mesh(merge(frames), M.frame, root, false);
  mesh(merge(leds), M.led, root, false);

  /* ---- balconul deschis de la capătul din dreapta: podea de lemn, balustradă de sticlă, uși mari de sticlă spre dormitor ---- */
  const sB1 = per.sFront(XB + .04), YD = YF + .015;
  mesh(capArc(per, YD, .05, sR0, sB1), M.wood, root, false);
  const gr = []; for (let z = -1.2; z <= 1.21; z += .2) { const t = Math.abs(z) - per.e, x1 = t <= 0 ? D.L / 2 - .1 : per.a + Math.sqrt((D.R - .1) ** 2 - t * t), x0 = XB + .08; gr.push(bg(x1 - x0, .004, .012, (x0 + x1) / 2, YD + .003, z)); }
  mesh(merge(gr), M.dark, root, false, false);
  const hr = YF + 1.04;
  const rg = mesh(sweep(per, [{ d: .04, y: YF + .09 }, { d: .04, y: hr - .04 }], { s0: sR0, s1: sB1 }), M.railglass, root, false, false); rg.renderOrder = 2;
  mesh(sweep(per, [{ d: .065, y: hr - .04 }, { d: .015, y: hr - .04 }, { d: .015, y: hr }, { d: .065, y: hr }, { d: .065, y: hr - .04 }], { s0: sR0, s1: sB1 }), M.frame, root, true, false);
  const posts = []; for (let i = 0; i <= 4; i++) { const p = per.at(sR0 + .03 + (sB1 - sR0 - .06) * i / 4); posts.push(bg(.028, hr - YF - .04, .028, p.x - p.nx * .04, (YF + hr - .04) / 2, p.z - p.nz * .04, Math.atan2(p.nx, p.nz))); }
  mesh(merge(posts), M.frame);
  const gh = g1 - YF - .02, gz = F.glazing(M, 2.72, gh, 3); gz.rotation.y = Math.PI / 2; gz.position.set(XB, YF + .01 + gh / 2, 0); root.add(gz);
  root.add(box(.08, 2.94 - g1 + .01, 2.8, M.frame, XB, (2.94 + g1 - .01) / 2, 0));
  [-1, 1].forEach(k => { const p = box(.1, 2.94 - YF, .09, M.frame, XB, (2.94 + YF) / 2, k * 1.405); p.castShadow = true; root.add(p); });
  const bal = new THREE.Group(); bal.position.y = YD; root.add(bal);
  const ac = F.armchair(M, M.white); ac.position.set(4.6, 0, -.45); ac.rotation.y = Math.PI / 2; bal.add(ac);
  const ct = F.coffee(M, .26); ct.position.set(4.75, 0, .55); bal.add(ct);

  /* ---- acoperișul: capac subțire care iese în afară de jur împrejur, luminator; tavanul și benzile LED țin tot de el ---- */
  const lid = [{ d: .27, y: 2.99 }, { d: .03, y: 2.99 }, { d: 0, y: 3.02 }, { d: 0, y: 3.17 }, { d: .04, y: 3.225 }, { d: .14, y: 3.275 }, { d: .32, y: D.H }];
  mesh(sweep(perR, lid), R.shell, roof);
  mesh(cap(perR, D.H, .32, true), R.shell, roof);
  const rs = [], lidS = offP(lid.slice(2), .004);
  [-4.2, -2.68, -1.32, .05, 1.7, 3.9].forEach(x => {
    [perR.sFront(x), perR.sBack(x)].forEach(s => rs.push(sweep(perR, lidS, { s0: s - .014, s1: s + .014 })));
    rs.push(bg(.028, .004, D.RW - .64, x, D.H + .002, 0));
  });
  mesh(merge(rs), R.seam, roof, false);
  const sky = { x: 2.4, z: 0, w: 2.0, d: 1.0 };
  mesh(new THREE.BoxGeometry(sky.w + .16, .06, sky.d + .16), R.frame, roof).position.set(sky.x, D.H + .025, sky.z);
  mesh(new THREE.BoxGeometry(sky.w, .07, sky.d), R.skyglass, roof, false).position.set(sky.x, D.H + .035, sky.z);
  mesh(cap(per, D.YC, .1, false), R.ceil, roof, false);
  [-.95, .95].forEach(z => mesh(new THREE.BoxGeometry(8.2, .02, .05), R.ledIn, roof, false, false).position.set(-.6, D.YC - .012, z));

  /* ---- dedesubt: fundul carcasei și picioarele subțiri ---- */
  mesh(cap(per, D.Y0, .25, false), M.dark, root, false);
  const legs = []; [-4.1, 0, 4.1].forEach(x => [-.85, .85].forEach(z => legs.push(bg(.22, D.Y0, .22, x, D.Y0 / 2, z))));
  mesh(merge(legs), M.stone);

  /* ---- intrarea: podest alb în fața ușii, trepte albe de-a lungul fațadei, balustrade de sticlă ---- */
  const zs = per.w, st = new THREE.Group(); root.add(st);
  const land = box(1.5, .12, 1.0, M.white, -2, YF - .06, zs + .5); land.castShadow = true; land.receiveShadow = true; st.add(land);
  [zs + .1, zs + .93].forEach(z => { const p = box(.07, YF - .12, .07, M.white, -1.3, (YF - .12) / 2, z); p.castShadow = true; st.add(p); });
  const n = 4, rise = YF / (n + 1), run = .28, fl = F.steps(M, .9, n, rise, run, M.white);
  fl.rotation.y = -Math.PI / 2; fl.position.set(-2.75 - n * run + run / 2, 0, zs + .5); st.add(fl);                 // urcă spre +X, până la podest
  const r1 = F.railing(M, 1.5, .95); r1.position.set(-2, YF, zs + .97); st.add(r1);
  const r2 = F.railing(M, .88, .95); r2.rotation.y = Math.PI / 2; r2.position.set(-1.25, YF, zs + .49); st.add(r2);
  // balustrada înclinată de pe marginea treptelor: bară, stâlp și panou de sticlă
  const xa = -2.75 - n * run, xb = -2.77, sl = rise / run, yn = x => YF + (x + 2.75) * sl, zr = zs + .97, bl = Math.hypot(xb - xa, yn(xb) - yn(xa));
  const bar = box(bl, .04, .05, M.frame, (xa + xb) / 2, (yn(xa) + yn(xb)) / 2 + .95, zr); bar.rotation.z = Math.atan(sl); st.add(bar);
  st.add(box(.04, .95, .04, M.frame, xa + .02, yn(xa) + .475, zr));
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.Float32BufferAttribute([xa + .05, yn(xa) + .12, zr, xb, yn(xb) + .12, zr, xb, yn(xb) + .9, zr, xa + .05, yn(xa) + .9, zr], 3));
  pg.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], 3)); pg.setIndex([0, 1, 2, 0, 2, 3]);
  mesh(pg, M.railglass, st, false, false).renderOrder = 2;

  /* ---- pardoseala și interiorul (schemă orientativă): living, bucătărie, baie la mijloc, dormitor spre balcon ---- */
  mesh(cap(per, YF, .1, true), M.floor, root, false);
  const inG = new THREE.Group(); inG.position.y = YF; root.add(inG);
  const put = (o, x, z, ry = 0) => { o.position.x = x; o.position.z = z; o.rotation.y = ry; inG.add(o); return o; };
  const WH = 2.14;
  put(F.wallBox(M, .07, 1.6, WH), -.7, -.6); put(F.wallBox(M, .07, 1.6, WH), .9, -.6); put(F.wallBox(M, 1.67, .07, WH), .1, .2);   // baia
  // living: canapea la capătul din stânga, măsuță, covor, masă rotundă cu două scaune
  put(F.rug(M, 1.9, 1.5), -4.05, 0); put(F.sofa(M, 1.8), -4.72, 0, Math.PI / 2); put(F.coffee(M, .3), -3.85, .05);
  put(F.tableRound(M, .38), -3.0, -.82); put(F.chair(M), -3.0, -.2, Math.PI); put(F.chair(M), -2.42, -.82, -Math.PI / 2);
  // bucătărie mică pe peretele din spate
  put(F.kitchen(M, 1.6, true), -1.62, -1.09);
  // baia: duș, WC, lavoar
  put(F.shower(M, .8, .8), .46, -.98, -Math.PI / 2); put(F.wc(M), -.3, -1.05); put(F.vanity(M, .6), -.42, -.2, Math.PI / 2);
  // dormitor: pat dublu cu tăblia la peretele băii, cu vedere spre balcon
  put(F.rug(M, 2.2, 1.9, 0xe9e2d6), 2.35, -.35); put(F.bed(M, 1.6, 2.0), 2.02, -.48, Math.PI / 2);
  // draperii la capetele geamurilor
  [[-3.62, .6], [1.32, .7]].forEach(([x, w]) => root.add(box(w, 2.0, .05, M.fabric, x, YF + 1.03, 1.33)));

  return {
    root, levels: 1,
    openRoof(k) { F.lift(roof, R, k, 2.2); },
    rooms: [
      { n: 'Living', x: -4.2, y: 1.3, z: .2, lvl: 1 }, { n: 'Bucătărie', x: -1.65, y: 2.0, z: -1.0, lvl: 1 }, { n: 'Baie', x: .1, y: 2.3, z: -.6, lvl: 1 },
      { n: 'Dormitor', x: 2.2, y: 1.4, z: -.3, lvl: 1 }, { n: 'Balcon', x: 4.75, y: 1.2, z: 0, lvl: 1 },
    ],
    size: { w: 11.5, d: 4.2, h: 3.37, cz: .43 },
  };
}
