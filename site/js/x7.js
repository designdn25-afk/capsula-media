// Modelul 3D al capsulei X7 (11,5 × 3,4 m, h 3,45 m), construit din geometrie simplă, după fotografiile din showroom.
// Axe: X = lungimea (livingul la −X, dormitorul la +X), Z = lățimea (intrarea la +Z), Y = în sus. Unități: metri.
// Părți (pentru desenul „desfăcut”): roof, walls, glazing, frame, floor, chassis.
import { THREE, perimeter, sweep, cap, arcBottom, arcTop, wrapPoly, wrapLine, grow, lineSeg, edges, box, clamp, lerp, ease } from './kit.js';

export const X7 = { L: 11.5, W: 3.4, H: 3.45, R: 1.1, Y0: .15, YW0: .45, YW1: 3.17, GY0: .70, GY1: 2.84, YF: .62 };

export function buildX7(M, { lamps: withLamps = true } = {}) {
  const D = X7, per = perimeter(D.L, D.W, D.R), T = per.total;
  const root = new THREE.Group(); root.name = 'X7';
  const P = {}; ['chassis', 'floor', 'frame', 'glazing', 'walls', 'roof'].forEach(n => { P[n] = new THREE.Group(); P[n].name = n; root.add(P[n]); });
  const mesh = (g, m, parent, { cast = true, recv = true } = {}) => { const o = new THREE.Mesh(g, m); o.castShadow = cast; o.receiveShadow = recv; parent.add(o); return o; };
  const L = {}; Object.keys(P).forEach(n => { L[n] = []; });           // liniile fiecărei părți (desen tehnic)
  const line = (part, pos, gold) => { L[part].push(...pos); if (gold) (L[part + 'G'] || (L[part + 'G'] = [])).push(...pos); };
  const ring = (y, d = 0) => wrapLine(per, [[0, y], [T, y]], { off: -d, closed: false });

  /* ---- geamurile, în coordonate desfășurate (s, y) ---- */
  const g0 = D.GY0, g1 = D.GY1;
  const LIV = [[7.0, 1.31], [8.1, g0], [15.26, g0], [15.26, g1], [8.1, g1], [7.0, 2.31]];                // livingul: fața, capătul și colțul din spate
  const BED = [[3.07, .99], [3.07, 2.58], [2.17, g1], [-6.826, g1], [-7.726, 2.31], [-7.726, 1.31], [-6.826, g0], [2.17, g0]]; // dormitorul
  const sc = per.sFront(.12);                                                                             // ușa de intrare
  const DOOR = [[sc - .28, .5], [sc + .28, .5], [sc + .5, .72], [sc + .5, 2.86], [sc + .28, 3.08], [sc - .28, 3.08], [sc - .5, 2.86], [sc - .5, .72]];
  const bt = T - 7.726, bf = T - 6.826;                                                                   // vârful și capătul teșiturii din spate

  /* ---- pereții (panourile albe) ---- */
  mesh(sweep(per, [{ d: 0, y: g1 }, { d: 0, y: D.YW1 }]), M.shell, P.walls);
  mesh(sweep(per, [{ d: 0, y: D.YW0 }, { d: 0, y: g0 }]), M.shell, P.walls);
  const solid = [
    [[3.07, g0], [7.0, g0], [7.0, g1], [3.07, g1]],
    [[2.17, g0], [3.07, g0], [3.07, .99]], [[2.17, g1], [3.07, g1], [3.07, 2.58]],
    [[7.0, g0], [8.1, g0], [7.0, 1.31]], [[7.0, g1], [8.1, g1], [7.0, 2.31]],
    [[15.26, g0], [bt, g0], [bt, g1], [15.26, g1]],
    [[bt, g0], [bf, g0], [bt, 1.31]], [[bt, g1], [bf, g1], [bt, 2.31]],
  ];
  solid.forEach(p => mesh(wrapPoly(per, p, { off: 0 }), M.shell, P.walls));
  mesh(sweep(per, [{ d: 0, y: D.YW1 + .002 }, { d: .13, y: D.YW1 + .002 }]), M.cut, P.walls, { cast: false });
  // rosturi între panouri (linii fine, ca în fotografii)
  const seams = [];
  const hz = (s0, s1, y) => seams.push([[s0, y - .011], [s1, y - .011], [s1, y + .011], [s0, y + .011]]);
  const vt = (s, y0, y1) => seams.push([[s - .011, y0], [s + .011, y0], [s + .011, y1], [s - .011, y1]]);
  const dg = (a, b) => seams.push([[a[0], a[1] - .014], [b[0], b[1] - .014], [b[0], b[1] + .014], [a[0], a[1] + .014]]);
  hz(3.07, 7.0, g1); hz(3.07, 7.0, g0); hz(15.26, bt, g1); hz(15.26, bt, g0);
  for (let s = 1.2; s < T; s += 2.326) { vt(s, g1 + .02, D.YW1); vt(s, D.YW0, g0 - .02); }
  vt(sc - .8, g0, g1); vt(sc + .8, g0, g1);
  [.3, .6].forEach(k => {
    dg([8.1 - k, g1], [7.0 - k, 2.31]); vt(7.0 - k, 1.31, 2.31); dg([7.0 - k, 1.31], [8.1 - k, g0]);
    dg([3.07 + k, 2.58], [2.17 + k, g1]); vt(3.07 + k, .99, 2.58); dg([2.17 + k, g0], [3.07 + k, .99]);
    dg([bf - k, g1], [bt - k, 2.31]); vt(bt - k, 1.31, 2.31); dg([bt - k, 1.31], [bf - k, g0]);
  });
  seams.forEach(p => mesh(wrapPoly(per, p, { off: .004 }), M.seam, P.walls, { cast: false }));
  // ușa: panou alb ieșit puțin în afară, cu rost închis la culoare și mâner
  mesh(wrapPoly(per, grow(DOOR, .035), { off: .006 }), M.frame, P.walls, { cast: false });
  mesh(wrapPoly(per, DOOR, { off: .022 }), M.shell, P.walls);
  mesh(wrapPoly(per, [[sc - .3, .78], [sc + .3, .78], [sc + .3, 2.72], [sc - .3, 2.72]].map(p => p), { off: .03 }), M.shell, P.walls, { cast: false });
  P.walls.add(box(.05, .2, .05, M.frame, .12 - .34, 1.58, per.w + .055));
  // grila de ventilație și hubloul din spate
  const sg = per.sBack(.45);
  mesh(wrapPoly(per, [[sg - .2, 1.2], [sg + .2, 1.2], [sg + .2, 2.5], [sg - .2, 2.5]], { off: .006 }), M.frame, P.walls, { cast: false });
  for (let y = 1.3; y < 2.45; y += .14) mesh(wrapPoly(per, [[sg - .16, y], [sg + .16, y], [sg + .16, y + .05], [sg - .16, y + .05]], { off: .012 }), M.steel, P.walls, { cast: false });
  const sh = per.sBack(-.75), hub = []; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; hub.push([sh + .26 * Math.cos(a), 1.95 + .26 * Math.sin(a)]); }
  mesh(wrapPoly(per, grow(hub, .05), { off: .006 }), M.frame, P.walls, { cast: false });
  line('walls', ring(D.YW1)); line('walls', ring(g1)); line('walls', ring(g0)); line('walls', ring(D.YW0));
  line('walls', wrapLine(per, LIV)); line('walls', wrapLine(per, BED)); line('walls', wrapLine(per, DOOR), true);

  /* ---- vitrajul: geam, ramă închisă la culoare, bandă LED pe contur ---- */
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t), GR = [.5, .47, .46], HZ = [1.75, 1.7, 1.6], MID = [1.12, 1.16, 1.22], TOPC = [.8, .9, 1.08];
  const skyCol = (s, y) => { const w = .04 * Math.sin(s * 2.1); return y < 1.15 ? mix([.36, .34, .34], GR, (y - g0) / (1.15 - g0)) : y < 1.42 ? mix(GR, HZ, (y - 1.15) / .27 + w) : y < 1.62 ? mix(HZ, MID, (y - 1.42) / .2) : y < 2.2 ? mix(MID, TOPC, (y - 1.62) / .58) : mix(TOPC, [.62, .74, .98], (y - 2.2) / (g1 - 2.2)); };
  const ringOf = (outer, inner) => outer.map((p, i) => [p, outer[(i + 1) % outer.length], inner[(i + 1) % inner.length], inner[i]]);
  [LIV, BED].forEach(w => {
    mesh(wrapPoly(per, w, { off: 0, ys: [1.15, 1.42, 1.62, 2.2], color: skyCol }), M.glass, P.glazing, { cast: false, recv: false });
    ringOf(w, grow(w, -.075)).forEach(q => mesh(wrapPoly(per, q, { off: .008 }), M.frame, P.glazing, { cast: false }));
    ringOf(grow(w, .04), w).forEach(q => mesh(wrapPoly(per, q, { off: .01 }), M.led, P.glazing, { cast: false }));
    line('glazing', wrapLine(per, w), true); line('glazing', wrapLine(per, grow(w, -.075)));
  });
  mesh(wrapPoly(per, hub, { off: .01, color: () => MID }), M.glass, P.glazing, { cast: false, recv: false });
  const clipAt = (w, s, hw = .035) => { // montant vertical: poligonul geamului tăiat la o fâșie îngustă
    let o = w; const cut = (poly, sv, ge) => { const r = []; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length], ia = ge ? a[0] >= sv : a[0] <= sv, ib = ge ? b[0] >= sv : b[0] <= sv; if (ia) r.push(a); if (ia !== ib) { const t = (sv - a[0]) / (b[0] - a[0]); r.push([sv, a[1] + (b[1] - a[1]) * t]); } } return r; };
    o = cut(cut(o, s - hw, true), s + hw, false); return o;
  };
  [[LIV, [8.45, 9.72, 11.03, 12.23, 13.5, 14.45]], [BED, [1.65, .17, -1.73, -2.93, -4.66, -5.9]]].forEach(([w, list]) => list.forEach(s => {
    const q = clipAt(w, s); if (q.length >= 3) { mesh(wrapPoly(per, q, { off: .009 }), M.frame, P.glazing, { cast: false }); line('glazing', wrapLine(per, [[s, Math.min(...q.map(p => p[1]))], [s, Math.max(...q.map(p => p[1]))]], { closed: false })); }
  }));
  // ușa de sticlă din capătul livingului (ramă)
  const sd = per.sLeft(0);
  ringOf([[sd - .45, g0 + .02], [sd + .45, g0 + .02], [sd + .45, 2.6], [sd - .45, 2.6]], [[sd - .39, g0 + .08], [sd + .39, g0 + .08], [sd + .39, 2.54], [sd - .39, 2.54]]).forEach(q => mesh(wrapPoly(per, q, { off: .011 }), M.frame, P.glazing, { cast: false }));

  /* ---- acoperișul: muchie rotunjită, capac, luminator; tavanul cu benzile LED ține tot de el ---- */
  const top = arcTop(D.H, .28);
  mesh(sweep(per, top), M.roof, P.roof);
  mesh(cap(per, D.H, .28, true), M.roof, P.roof);
  mesh(cap(per, 3.02, .1, false), M.ceil, P.roof, { cast: false });
  const sky = { x: -3.6, z: 0, w: 1.6, d: 1.5 };
  P.roof.add(box(sky.w + .16, .07, sky.d + .16, M.skyframe || M.frame, sky.x, D.H + .03, sky.z));
  const skg = box(sky.w, .08, sky.d, M.skyglass, sky.x, D.H + .04, sky.z); skg.castShadow = false; P.roof.add(skg);
  [-.95, .95].forEach(z => { const l = box(8.2, .02, .05, M.ledIn, 0, 3.0, z); l.castShadow = false; P.roof.add(l); });
  line('roof', ring(D.YW1)); line('roof', ring(D.H, .28)); line('roof', ring(D.H - .1, .04));
  const rq = (x, z, w, d, y) => [x - w / 2, y, z - d / 2, x + w / 2, y, z - d / 2, x + w / 2, y, z - d / 2, x + w / 2, y, z + d / 2, x + w / 2, y, z + d / 2, x - w / 2, y, z + d / 2, x - w / 2, y, z + d / 2, x - w / 2, y, z - d / 2];
  line('roof', rq(sky.x, sky.z, sky.w, sky.d, D.H + .08), true);

  /* ---- șasiul: partea de jos rotunjită, tălpile, treptele ---- */
  mesh(sweep(per, arcBottom(D.Y0, .3)), M.shell, P.chassis);
  mesh(cap(per, D.Y0, .3, false), M.dark, P.chassis, { cast: false });
  [-4.4, 0, 4.4].forEach(x => [-1.05, 1.05].forEach(z => P.chassis.add(box(.34, .16, .34, M.stone, x, .08, z))));
  for (let i = 0; i < 3; i++) { const t = box(1.02, .04, .3, M.steel, .12, .16 + i * .16, per.w + .78 - i * .3); t.castShadow = true; P.chassis.add(t); }
  for (let i = 0; i < 3; i++) [-.48, .48].forEach(dx => P.chassis.add(box(.03, .14 + i * .16, .03, M.steel, .12 + dx, (.14 + i * .16) / 2, per.w + .78 - i * .3)));
  line('chassis', ring(D.YW0)); line('chassis', ring(D.Y0, .3));

  /* ---- structura din oțel (se vede doar în desenul desfăcut) ---- */
  const beams = [], B = (w, h, d, x, y, z) => { const b = box(w, h, d, M.steel, x, y, z); P.frame.add(b); beams.push(b); };
  const xs = [-4.65, -2.33, 0, 2.33, 4.65], zs = [-1.52, 1.52], t = .09;
  [.52, 3.08].forEach(y => { zs.forEach(z => B(9.3 + t, t, t, 0, y, z)); [-5.55, 5.55].forEach(x => B(t, t, 1.3, x, y, 0)); xs.forEach(x => B(t, t, 3.04, x, y, 0)); [[-1, 1], [-1, -1], [1, 1], [1, -1]].forEach(([sx, sz]) => { const b = box(1.25, t, t, M.steel, sx * 5.1, y, sz * 1.08); b.rotation.y = -sx * sz * .82; P.frame.add(b); beams.push(b); }); });
  xs.forEach(x => zs.forEach(z => B(t, 2.56, t, x, 1.8, z))); [-5.55, 5.55].forEach(x => [-.6, .6].forEach(z => B(t, 2.56, t, x, 1.8, z)));
  P.frame.visible = false;
  beams.forEach(b => { b.updateMatrix(); const e = new THREE.EdgesGeometry(b.geometry); e.applyMatrix4(b.matrix); L.frame.push(...e.attributes.position.array); });

  /* ---- pardoseala și interiorul (așa cum e amenajat în showroom) ---- */
  mesh(cap(per, D.YF, .1, true), M.floor, P.floor, { cast: false });
  const F = D.YF, items = [];
  const put = (o) => { P.floor.add(o); items.push(o); o.castShadow = false; return o; };
  const wall = (w, d, x, z) => put(box(w, 2.3, d, M.inner, x, F + 1.15, z));
  wall(2.2, .07, .4, .1); wall(.07, 1.55, -.7, -.675); wall(.07, 1.55, 1.5, -.675);       // baia
  wall(.07, 1.7, 2.2, -.6);                                                              // peretele dormitorului
  // living: canapea verde, măsuță, masă rotundă cu două scaune
  put(box(.62, .4, 1.5, M.sofa, -5.02, F + .2, .47)); put(box(.16, .78, 1.5, M.sofa, -5.3, F + .39, .47)); put(box(.62, .58, .16, M.sofa, -5.02, F + .29, 1.2)); put(box(.62, .58, .16, M.sofa, -5.02, F + .29, -.26));
  const cyl = (r, h, m, x, y, z) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 20), m); c.position.set(x, y, z); return put(c); };
  cyl(.3, .04, M.wood, -4.2, F + .4, .47); cyl(.03, .4, M.dark, -4.2, F + .2, .47);
  cyl(.42, .04, M.white, -3.5, F + .74, -.82); cyl(.05, .72, M.white, -3.5, F + .36, -.82);
  [[-4.1, -.82], [-2.9, -.82]].forEach(([x, z]) => { put(box(.42, .08, .42, M.fabric, x, F + .45, z)); put(box(.06, .42, .42, M.fabric, x + (x < -3.5 ? -.2 : .2), F + .68, z)); });
  // bucătăria: blat din lemn pe corpuri verzi
  put(box(1.55, .86, .44, M.green, -1.57, F + .43, -1.2)); put(box(1.61, .04, .5, M.wood, -1.57, F + .88, -1.18));
  // baia: duș cu cabină de sticlă, lavoar, WC
  put(box(.9, 2.0, .9, M.showerglass, 1.0, F + 1.0, -.95)); put(box(.7, .12, .42, M.white, -.2, F + .8, -1.2)); put(box(.36, .4, .52, M.white, .25, F + .2, -.2));
  // dormitor: birou și două fotolii (ca în showroom)
  put(box(.46, .74, .86, M.white, 2.52, F + .37, -.96));
  [[5.0, -.68], [5.0, .72]].forEach(([x, z]) => { put(box(.6, .42, .6, M.black, x, F + .21, z)); put(box(.16, .85, .6, M.black, x + .26, F + .42, z)); });
  // draperii la capetele geamurilor
  [[-2.75, 1.63], [-3.25, 1.63], [1.95, 1.63], [2.45, 1.63], [2.0, -1.63]].forEach(([x, z]) => put(box(.42, 2.1, .05, M.fabric, x, F + 1.2, z)));
  items.forEach(o => { o.updateMatrix(); const e = new THREE.EdgesGeometry(o.geometry, 20); e.applyMatrix4(o.matrix); L.floor.push(...e.attributes.position.array); });
  line('floor', ring(D.YF, .1), true);
  // luminile din interior (se aprind seara)
  const lamps = (withLamps ? [[-3.6, 2.5, 0], [.3, 2.5, .8], [3.9, 2.5, 0]] : []).map(p => { const l = new THREE.PointLight(0xffc27a, 0, 9, 1.6); l.position.set(...p); P.floor.add(l); return l; });

  /* ---- liniile desenului tehnic ---- */
  const lineObjs = [];
  Object.keys(P).forEach(n => { if (L[n].length) { const o = lineSeg(L[n], M.line); o.renderOrder = 5; P[n].add(o); lineObjs.push(o); } if (L[n + 'G']) { const o = lineSeg(L[n + 'G'], M.lineGold); o.renderOrder = 6; P[n].add(o); lineObjs.push(o); } });
  lineObjs.forEach(o => { o.visible = false; });

  /* ---- comenzi ---- */
  const OFF = { chassis: -1.15, floor: 0, frame: 0, glazing: 3.0, walls: 5.9, roof: 8.7 };
  const solids = [M.cut, M.shell, M.seam, M.frame, M.led, M.steel, M.dark, M.floor, M.inner, M.sofa, M.fabric, M.green, M.wood, M.white, M.black, M.stone, M.roof, M.ceil, M.ledIn];
  const api = {
    root, parts: P, per, lamps, OFF,
    // k = 0 întreg … 1 desfăcut pe straturi
    explode(k) { api._ex = ease(clamp(k)); api._lay(); P.frame.visible = k > .001; },
    _lay() { Object.keys(P).forEach(n => { P[n].position.y = OFF[n] * (api._ex || 0) + (n === 'roof' ? (api._lift || 0) : 0); }); },
    // b = 0 machetă plină … 1 desen tehnic (linii pe fond închis)
    blueprint(b) {
      b = clamp(b); const on = b > .001; lineObjs.forEach(o => { o.visible = on; }); M.line.opacity = b * .95; M.lineGold.opacity = b;
      const a = 1 - b * .93; solids.forEach(m => { if (m.transparent !== (on || m.userData.fade === true)) { m.transparent = on || m.userData.fade === true; m.needsUpdate = true; } if (m.userData.fade !== true) m.opacity = a; m.depthWrite = b < .5; });
      api._bp = b;
    },
    // acoperișul dispare (0…1), ca să se vadă împărțirea interioară
    openRoof(k) { k = clamp(k); [M.roof, M.ceil, M.ledIn, M.skyglass].forEach(m => { m.userData.fade = k > .001; const tr = k > .001 || (api._bp || 0) > .001; if (m.transparent !== tr && m !== M.skyglass) { m.transparent = tr; m.needsUpdate = true; } m.opacity = (m === M.skyglass ? .9 : 1) * (1 - k) * (1 - (api._bp || 0) * .93); }); P.roof.children.forEach(c => { if (c.isMesh) c.castShadow = k < .5; }); P.roof.visible = k < .995 || (api._bp || 0) > .001; api._roof = k; },
    // varianta pentru grădină: acoperișul se ridică și dispare
    liftRoof(k, h = 2.2) { k = clamp(k); api._lift = ease(k) * h; api._lay(); api.openRoof(clamp(k * 1.25)); },
    // n = 0 zi … 1 noapte: geamul devine transparent, se aprind luminile și banda LED
    night(n, glassColor) {
      n = clamp(n); const g = M.glass; if (glassColor) g.color.copy(glassColor); if (n > .02) g.color.lerp(new THREE.Color(0xffe2b8), n * .85);
      g.opacity = lerp(.96, .16, n); g.metalness = lerp(.92, 0, n); g.envMapIntensity = lerp(1.25, .25, n); g.roughness = lerp(.05, .12, n);
      M.led.emissiveIntensity = n * 2.6; M.ledIn.emissiveIntensity = n * 3.2; lamps.forEach((l, i) => { l.intensity = n * (i === 1 ? 9 : 16); });
      M.inner.emissive.setHex(0xffc890); M.inner.emissiveIntensity = n * .22; M.ceil.emissive.setHex(0xffc890); M.ceil.emissiveIntensity = n * .35;
    },
  };
  api.explode(0); api.blueprint(0); api.night(0);
  return api;
}

// materialele în plus de care are nevoie X7, pe lângă cele din kit.materials()
export function x7Materials(M) {
  M.roof = M.shell.clone(); M.ceil = M.inner.clone(); M.ceil.side = THREE.DoubleSide;
  M.ledIn = new THREE.MeshStandardMaterial({ color: 0xfff1d6, emissive: 0xffd08a, emissiveIntensity: 0 });
  M.skyglass = new THREE.MeshPhysicalMaterial({ color: 0x1b3550, roughness: .05, metalness: .9, transparent: true, opacity: .9, envMapIntensity: 1.3 });
  M.showerglass = new THREE.MeshPhysicalMaterial({ color: 0xbfd6e2, roughness: .1, metalness: 0, transparent: true, opacity: .28, depthWrite: false });
  return M;
}
