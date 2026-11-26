// Grădina din jurul caselor: gard viu, alei cu lespezi, rond, straturi cu flori, tufe, copaci, lămpi, umbre de contact.
// Folosit de js/garden.js după ce casele au fost așezate. Întoarce { night(n) } (lumina lămpilor pe iarbă, seara).
// Pe fiecare casă pune: h.ring (inelul auriu de la alegere) și h.door (punctul din fața ușii).
// Plantele sunt „cartonașe” cu frunze desenate (js/real.js), adunate în puține plase mari: toată grădina (fără case) are în jur de 40 de desene
// și 130 de mii de triunghiuri. Nu are nimic animat: se desenează doar când se mișcă ceva.
import { THREE, clamp, lerp, perimeter, sweep, cap, box } from './kit.js';
import { lampPost } from './furn.js';
import { GRADINA } from './gradina-data.js';
import * as R from './real.js';

const DEG = Math.PI / 180, TAU = Math.PI * 2;

export function buildGarden(G, H) {
  const { scene, M, T } = G, S = o => new THREE.MeshStandardMaterial(o), g = new THREE.Group(); scene.add(g);
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, rr = (a, b) => a + (b - a) * rnd();
  // Grădina a fost mărită spre intrare (16 nov 2026: de la 72 la 98 m adâncime). Ca aleile, florile, tufele și copacii din partea veche să
  // rămână exact unde erau (imaginile reale ale caselor au fost făcute cu ele acolo), partea veche își ia numerele „la întâmplare” în
  // aceeași ordine ca înainte, iar tot ce e nou (aleea de la poarta nouă, straturile, tufele și copacii din față, aleile caselor noi)
  // le ia dintr-un șir separat: extra(() => …). VECHI = unde erau poarta și mijlocul grădinii vechi.
  let seedX = 4801; const extra = fn => { const s = seed; seed = seedX; fn(); seedX = seed; seed = s; }, VECHI = { ez: 28, gz: -8 };
  // A doua mărire (24 nov 2026: de la 98 la 124 m, pentru casele K5 și YK5). La fel ca prima dată: tot ce exista (și partea făcută la
  // prima mărire, în jurul lui T6 și C20) rămâne exact pe loc și își ia numerele din șirurile de dinainte; ce e nou acum (aleea de la
  // poarta nouă, straturile și copacii de lângă ea, aleile caselor noi) are șirul lui: extra2(() => …). E2 = unde era poarta după prima mărire.
  let seedY = 9203; const extra2 = fn => { const s = seed; seed = seedY; fn(); seedY = seed; seed = s; }, VECHI2 = { ez: 54 };
  const { latime: GW, adancime: GD, centruZ: GZ, intrareZ: EZ } = GRADINA, tp = R.triplanar, E2 = Math.min(EZ, VECHI2.ez), NOU2 = EZ > VECHI2.ez + 8;
  const decal = (o) => new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, ...o });
  const m = {
    pave: tp(S({ color: 0xffffff, roughness: .9 }), { map: T.pavers, scale: 2.4, gain: .9, rough: .3, bump: .012 }),                                    // dale mari, aliniate cu fiecare casă
    paveW: tp(S({ color: 0xffffff, roughness: .9 }), { map: T.pavers, scale: 2.4, space: 'world', gain: .9, rough: .3, bump: .012 }),
    stone: tp(S({ color: 0xd2cabb, roughness: .92, vertexColors: true }), { map: T.stone, scale: 1.1, space: 'world', gain: 1.24, rough: .35, bump: .02 }),   // lespezile aleilor
    mulch: tp(S({ color: 0xffffff, roughness: 1, vertexColors: true }), { map: T.mulch, scale: .9, space: 'world', gain: 2.1 }),
    hedge: tp(S({ color: 0xffffff, roughness: .92, vertexColors: true }), { map: T.hedge, scale: 1.05, space: 'world', gain: 1.5 }),
    leaf: R.leafMaterial(T.leaf), leafS: R.leafMaterial(T.leafS), spray: R.leafMaterial(T.spray), flower: R.leafMaterial(T.flowers, { alphaTest: .5, trans: 0 }),
    wood: tp(S({ color: 0xffffff, roughness: 1, vertexColors: true }), { map: T.wood, scale: [1.3, .32], gain: 1.3, vert: true, bump: .03 }),   // scoarță (și miezul întunecat al coroanelor)
    gold: () => new THREE.MeshBasicMaterial({ color: 0xd4a24c, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }),
    glow: new THREE.MeshBasicMaterial({ map: R.blobTexture([[0, 'rgba(255,190,112,.6)'], [.35, 'rgba(255,186,108,.3)'], [1, 'rgba(255,180,100,0)']]), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }),
    blob: decal({ map: R.blobTexture([[0, 'rgba(0,0,0,.62)'], [.5, 'rgba(0,0,0,.36)'], [1, 'rgba(0,0,0,0)']]), opacity: .7 }),
  };
  const sh = (o, cast = true, recv = true) => { o.castShadow = cast; o.receiveShadow = recv; return o; };
  const flat = (geo, mat, y) => { const o = new THREE.Mesh(geo, mat); o.rotation.x = -Math.PI / 2; o.position.y = y; o.receiveShadow = true; return o; };
  const lamps = [], blobs = [];   // blobs = umbrele moi de la baza lucrurilor [x, z, rază]
  // piese mici statice (stâlpi, bănci, lămpi) adunate câte una pe material, ca să nu coste câte un desen fiecare
  const fixed = new THREE.Group(), bake = () => {
    fixed.updateMatrixWorld(true); const by = new Map();
    fixed.traverse(o => { if (!o.isMesh) return; let e = by.get(o.material); if (!e) by.set(o.material, e = { s: new R.Solid(), cast: false }); e.s.add(o.geometry, o.matrixWorld); e.cast = e.cast || o.castShadow; });
    by.forEach((e, mat) => g.add(sh(new THREE.Mesh(e.s.geo(), mat), e.cast, true)));
  };

  // soarele și umbrele lui se centrează pe grădină; gazonul află unde e gardul viu (umbra de la baza lui); geamurile află unde sunt casele
  G.sun.target.position.set(0, 0, GZ); G.sun.target.updateMatrixWorld();
  G.lawnU.lwH.value.set(0, GZ, GW / 2, GD / 2); G.lawnU.lwR.value.set(9, 1.13, 4.2);
  H.forEach(h => { h.g.updateMatrixWorld(true); G.boxes.push({ inv: h.g.matrixWorld.clone().invert(), w: h.s.w, d: h.s.d, h: h.s.h, cz: h.s.cz || 0 }); });

  // materialele proprii ale unei case (cele care nu sunt în setul comun M) primesc și ele textură: lemnul → scânduri, textilele → țesătură, restul → o variație fină
  {
    const known = new Set(Object.values(M)), seen = new Set(), c = {}; (M.clones || []).forEach(q => known.add(q[1]));
    H.forEach(h => h.g.traverse(o => {
      const mt = o.material; if (!o.isMesh || !mt || !mt.isMeshStandardMaterial || known.has(mt) || seen.has(mt)) return; seen.add(mt);
      if (mt.map || mt.transparent || mt.visible === false || mt.emissiveIntensity > 1) return; mt.color.getHSL(c);
      if (mt.emissive.getHex() === 0) G.lit.push(mt);   // seara se luminează cald, ca mobila din setul comun
      if (c.s > .28 && c.h > .04 && c.h < .13 && c.l > .25 && c.l < .8 && mt.roughness < .88) tp(mt, { map: T.planks, scale: [2.2, .96], gain: 1.28, rough: .25, emis: 1 });
      else if (mt.roughness > .97) tp(mt, { map: T.weave, scale: .13, gain: 1.2, amt: .7, emis: 1 });
      else tp(mt, { map: T.stone, scale: 1.6, gain: 1.24, amt: .3, rough: .2 });
    }));
  }

  /* ---------- gardul viu, cu poartă în față ---------- */
  const hp = perimeter(GW, GD, 9), s0 = hp.a + 4.1, s1 = hp.total + hp.a - 4.1;
  const prof = [[0, 0], [.02, .6], [.07, 1.18], [.2, 1.38], [.565, 1.44], [.93, 1.38], [1.06, 1.18], [1.11, .6], [1.13, 0]], np = prof.length;
  const wob = (s, j) => .05 * Math.sin(s * 1.7 + j * 1.3) + .035 * Math.sin(s * 4.3 + j * 2.1) + .02 * Math.sin(s * 9.1 + j * .7);
  {
    const n = Math.ceil((s1 - s0) / .5), P = [], Cc = [], I = [];
    for (let i = 0; i <= n; i++) { const s = s0 + (s1 - s0) * i / n, p = hp.at(s); prof.forEach(([d0, y0], j) => { const w = wob(s, j), d = d0 + (j < 4 ? -w : j > 4 ? w : 0), y = y0 + (j > 1 && j < 7 ? w * .8 : 0), k = lerp(.42, 1, clamp(y / 1.2)); P.push(p.x - p.nx * d, y, p.z - p.nz * d + GZ); Cc.push(k, k, k); }); }
    for (let i = 0; i < n; i++) for (let j = 0; j < np - 1; j++) { const A = i * np + j, B = (i + 1) * np + j, C = B + 1, D = A + 1; I.push(A, C, B, A, D, C); }
    const hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); hg.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); hg.setIndex(I); hg.computeVertexNormals();
    g.add(sh(new THREE.Mesh(hg, m.hedge)));
    // frunzele care ies din gard: îi rup conturul neted
    const Q = new R.Cards(), c = new THREE.Vector3(), fn = new THREE.Vector3(), cn = new THREE.Vector3(), ax = new THREE.Vector3(), ay = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), sd = new THREE.Vector3(1, 0, 0);
    for (let i = 0, N = Math.round((s1 - s0) * 12); i < N; i++) {
      const s = rr(s0 + .25, s1 - .25), p = hp.at(s), f = rnd() * 3.7; let d, y;
      if (f < 1.35) { y = rr(.08, 1.3); d = .09 * (y / 1.3) ** 2 - .05; fn.set(p.nx, .2, p.nz); }
      else if (f < 2.35) { d = rr(.1, 1.03); y = 1.47 - Math.abs(d - .565) * .16; fn.set(p.nx * (.565 - d), 1, p.nz * (.565 - d)); }
      else { y = rr(.08, 1.3); d = 1.18 - .09 * (y / 1.3) ** 2; fn.set(-p.nx, .2, -p.nz); }
      c.set(p.x - p.nx * d, y, p.z - p.nz * d + GZ); fn.normalize(); cn.set(fn.x + rr(-.45, .45), fn.y + rr(-.45, .45), fn.z + rr(-.45, .45)).normalize();
      ax.crossVectors(cn, Math.abs(cn.y) > .9 ? sd : up).normalize(); ay.crossVectors(ax, cn);
      const k = lerp(.5, 1, clamp(y / 1.25)) * rr(.8, 1.12), z = rr(.4, .6);
      Q.add(c, ax, ay, z, z, fn, [k * .74 * rr(.9, 1.1), k * .82, k * .66], undefined);
    }
    g.add(sh(new THREE.Mesh(Q.geo(), m.leafS), false, true));
  }
  seed = 1862663024;   // valoarea de după gardul viu din grădina veche (vezi mai sus)
  // stâlpii porții, din piatră, cu felinare
  [-1, 1].forEach(sg => {
    const x = sg * 4.25, z = EZ - .56;
    fixed.add(sh(box(.92, 2.05, .92, M.stoneWall, x, 1.025, z)), sh(box(1.08, .1, 1.08, M.stone, x, 2.1, z)), box(.38, .32, .38, M.lamp, x, 2.33, z), sh(box(.5, .05, .5, M.frame, x, 2.515, z)));
    lamps.push([sg * 4.2, EZ - 1.9, 5]); blobs.push([x, z, 1.15]);
  });

  /* ---------- locul fiecărei case: platformă din dale, umbră de contact, inel auriu (la alegere), lumină caldă pe iarbă seara ---------- */
  const glows = [];
  H.forEach(h => {
    const s = h.s, cz = s.cz || 0, ao = footprint(h);
    const pad = new THREE.Mesh(cap(perimeter(s.w + 2.6, s.d + 2.6, 1.4), .03), m.pave); pad.position.z = cz; pad.receiveShadow = true; h.g.add(pad);
    const am = flat(new THREE.PlaneGeometry(ao.w, ao.d), decal({ map: ao.map, opacity: .62 }), .046); am.position.z = cz; am.receiveShadow = false; am.renderOrder = 1; h.g.add(am);
    h.ring = new THREE.Mesh(sweep(perimeter(s.w + 3.5, s.d + 3.5, 1.85), [{ d: 0, y: .05 }, { d: .17, y: .05 }], { ds: .45 }), m.gold()); h.ring.position.z = cz; h.ring.visible = false; h.ring.renderOrder = 3; h.g.add(h.ring);
    const gl = flat(new THREE.PlaneGeometry(s.w + 9, s.d + 11), m.glow, .055); gl.receiveShadow = false; gl.position.z = cz + 1.5; gl.renderOrder = 2; gl.visible = false; h.g.add(gl); glows.push(gl);
  });
  // umbra moale de sub o casă: amprenta pieselor ei de lângă pământ (carcasă, terase, trepte), estompată
  function footprint(h) {
    const s = h.s, cz = s.cz || 0, mg = 1.6, w = s.w + 2 * mg, d = s.d + 2 * mg, k = 10, W = Math.ceil(w * k), D = Math.ceil(d * k);
    const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = D; return [c, c.getContext('2d')]; }, [c1, x1] = mk(), [c2, x2] = mk();
    const inv = h.g.matrixWorld.clone().invert(), mt = new THREE.Matrix4(), bb = new THREE.Box3(); x1.fillStyle = '#000';
    h.g.traverse(o => {
      if (!o.isMesh || !o.geometry || !o.material || o.material.visible === false) return; const ge = o.geometry; if (!ge.boundingBox) ge.computeBoundingBox();
      bb.copy(ge.boundingBox).applyMatrix4(mt.multiplyMatrices(inv, o.matrixWorld)); if (bb.min.y > .75 || bb.max.y < .02) return;
      x1.fillRect((bb.min.x + w / 2) * k, (bb.min.z - cz + d / 2) * k, (bb.max.x - bb.min.x) * k, (bb.max.z - bb.min.z) * k);
    });
    x2.shadowColor = '#000'; x2.shadowBlur = k * .75; x2.shadowOffsetX = W * 2; x2.drawImage(c1, -W * 2, 0); x2.drawImage(c1, -W * 2, 0);
    const map = new THREE.CanvasTexture(c2); map.colorSpace = THREE.SRGBColorSpace; return { map, w, d };
  }

  /* ---------- aleile: lespezi rotunjite pe iarbă, de la poartă la rondul din mijloc și de acolo la fiecare casă ---------- */
  const ST = new R.Solid();
  const slab = (cx, cz, rx, rz, rot, h, col) => {
    const N = 11, b = ST.p.length / 3, c = Math.cos(rot), s = Math.sin(rot), ph = rnd() * TAU, ph2 = rnd() * TAU, e = [col[0] * .78, col[1] * .78, col[2] * .78];
    ST.p.push(cx, h, cz); ST.n.push(0, 1, 0); ST.c.push(...col);
    for (let k = 0; k < N; k++) { const a = k / N * TAU, f = 1 + .1 * Math.sin(a * 2 + ph) + .07 * Math.sin(a * 3 + ph2), lx = Math.cos(a) * rx * f, lz = Math.sin(a) * rz * f, ox = lx * c + lz * s, oz = -lx * s + lz * c, nl = Math.hypot(ox, oz) || 1;
      ST.p.push(cx + ox * .9, h, cz + oz * .9, cx + ox, .004, cz + oz); ST.n.push(0, 1, 0, ox / nl * .7, .7, oz / nl * .7); ST.c.push(...col, ...e); }
    for (let k = 0; k < N; k++) { const i0 = b + 1 + k * 2, i1 = b + 1 + ((k + 1) % N) * 2; ST.i.push(b, i1, i0, i0, i1, i1 + 1, i0, i1 + 1, i0 + 1); }
  };
  const path = (pts, step = .86) => { const cv = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], 0, p[1]))), n = Math.max(2, Math.floor(cv.getLength() / step));
    for (let i = 0; i <= n; i++) { const p = cv.getPointAt(i / n), t = cv.getTangentAt(i / n); if (Math.hypot(p.x, p.z) < 4.3) continue; const o = (i % 2 ? .1 : -.1) + rr(-.05, .05), k = rr(.86, 1.06);
      slab(p.x + t.z * o, p.z - t.x * o, rr(.4, .5), rr(.28, .34), Math.atan2(t.x, t.z) + rr(-.3, .3), .042, [k, k * rr(.97, 1.01), k * rr(.93, 1)]); } };
  path([[0, VECHI.ez + 6], [.5, VECHI.ez - 3], [-1.3, 19], [1.1, 10], [0, 4]]);
  if (EZ > VECHI.ez + 8) extra(() => path([[0, E2 + 6], [-.5, E2 - 3], [.9, E2 - 9.5], [-.7, VECHI.ez + 11.5], [0, VECHI.ez + 6.8]]));
  if (NOU2) extra2(() => path([[0, EZ + 6], [.5, EZ - 3], [-.9, EZ - 10], [.7, E2 + 12.5], [0, E2 + 6.8]]));
  let backEnd = [0, GZ - 8];
  H.forEach(h => { const dp = h.g.localToWorld(new THREE.Vector3(0, 0, (h.s.cz || 0) + h.s.d / 2 + 1.5)); h.door = dp; if (Math.abs(dp.x) < 3) backEnd = [dp.x, dp.z]; });
  path([[0, -4], [-1.1, backEnd[1] * .4], [.9, backEnd[1] * .75], backEnd]);
  H.forEach(h => { const d = h.door; if (Math.abs(d.x) < 3) return; const z0 = clamp(d.z + 3, backEnd[1] + 4, EZ - 6), sx = Math.sign(d.x), go = () => path([[sx * 1.2, z0], [d.x * .5, (z0 + d.z) / 2 + 1.2], [d.x, d.z]]);
    h.c.z > VECHI2.ez ? extra2(go) : h.c.z > VECHI.ez ? extra(go) : go(); lamps.push([d.x - sx * 2.2, d.z + 1.2, 4.5]); });   // casele din partea nouă: din șirul separat
  g.add(sh(new THREE.Mesh(ST.geo(), m.stone), false, true));

  /* ---------- rondul din mijloc: dale, jardinieră de piatră cu un copac, două bănci ---------- */
  g.add(flat(new THREE.ShapeGeometry(new THREE.Shape().absarc(0, 0, 3.9, 0, TAU), 48), m.paveW, .035));
  const pot = sh(new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.62, .5, 40), M.stone)); pot.position.y = .25; g.add(pot);
  [[-3.1, 1.9, .5], [3.1, -1.9, .5 + Math.PI]].forEach(([x, z, a]) => { const b = new THREE.Group(); for (let i = 0; i < 4; i++) b.add(sh(box(1.7, .045, .1, M.wood, 0, .45, -.18 + i * .12))); b.add(sh(box(.09, .43, .44, M.stone, -.68, .215, 0)), sh(box(.09, .43, .44, M.stone, .68, .215, 0))); b.position.set(x, 0, z); b.rotation.y = a; fixed.add(b); blobs.push([x, z, 1.1]); });
  lamps.push([-3.3, 9, 4.5], [3.2, 18, 4.5], [-2.6, VECHI.gz - 6, 4.5]); if (EZ > VECHI.ez + 8) lamps.push([-3.3, E2 - 11, 4.5]); if (NOU2) lamps.push([3.3, EZ - 11, 4.5]);

  /* ---------- straturi cu flori: mulci, frunziș verde, flori mici și dese ---------- */
  const beds = [[-27.6, 19, 2.2, 6, 0], [-28.2, 1, 2, 6.5, 1], [-27.6, -24, 2.2, 8, 2], [27.6, 20, 2.2, 6, 1], [28.2, 0, 2, 6.5, 3], [27.6, -25, 2.2, 8, 0],
    [-14, GZ - GD / 2 + 3.4, 8, 1.9, 3], [14, GZ - GD / 2 + 3.4, 8, 1.9, 1], [-14.5, VECHI.ez - 3.2, 7, 1.8, 2], [14.5, VECHI.ez - 3.2, 7, 1.8, 0], [-4.6, 20, 1.3, 4.4, 1], [4.7, 15, 1.3, 4.4, 2], [-6.6, -1.2, 1.4, 3, 0], [6.6, 1.2, 1.4, 3, 3]];
  // straturile din partea nouă (lângă gardul din față, pe laturi și pe locul liber, păstrat pentru următoarea casă): GRADINA.straturiNoi
  const bedsN = EZ > VECHI.ez + 8 ? [[-14.5, E2 - 3.2, 7, 1.8, 1], [14.5, E2 - 3.2, 7, 1.8, 3], [-27.6, E2 - 13, 2.2, 6, 2], [27.6, E2 - 13, 2.2, 6, 0], ...(GRADINA.straturiNoi || [])] : [];
  const bedsN2 = NOU2 ? [[-14.5, EZ - 3.2, 7, 1.8, 3], [14.5, EZ - 3.2, 7, 1.8, 2], [-27.6, EZ - 13, 2.2, 6, 1], [27.6, EZ - 13, 2.2, 6, 3]] : [];   // a doua mărire
  // k = felul florii din textură (0 margarete · 1 spice · 2 trandafiri · 3 mărunte), c = culoarea, h = înălțimea, s = mărimea, w = cât de des apare
  const hex = (x, w, k, h, s) => { const c = new THREE.Color(x); return { c: [c.r, c.g, c.b], w, k, h, s }; };
  const PAL = [
    [hex(0x7a66c2, 5, 1, [.2, .28], 1), hex(0x9484d8, 3, 1, [.2, .3], 1.1), hex(0xf2efe6, 2, 0, [.36, .48], .9), hex(0xe9e6f5, 1.5, 3, [.26, .34], 1)],              // lavandă cu margarete albe
    [hex(0xe07f9c, 4, 2, [.4, .58], 1), hex(0xf4c9d4, 3, 2, [.4, .56], .95), hex(0xfbf7f0, 2.5, 2, [.42, .6], .9), hex(0xc9506e, 1.5, 3, [.28, .36], 1)],           // trandafiri roz și albi
    [hex(0xf0bd2a, 4.5, 0, [.38, .56], 1.05), hex(0xee9426, 2.5, 0, [.36, .5], .95), hex(0xfae28c, 2, 3, [.28, .36], 1), hex(0xf7f3e8, 1, 0, [.36, .46], .85)],    // rudbeckia galbenă și portocalie
    [hex(0x5c5fca, 3.5, 1, [.2, .3], 1.1), hex(0xe58bb4, 3, 3, [.28, .38], 1.1), hex(0xf5f1ea, 2, 0, [.36, .48], .9), hex(0xb672cf, 2, 2, [.38, .5], .8)],          // salvie albastră, flori roz și albe
  ];
  const BD = new R.Solid(), cyl = new THREE.CylinderGeometry(.965, 1, .14, 30), rim = new THREE.CylinderGeometry(1.012, 1.012, .17, 30, 1, true), tufts = [], fl = [[], [], [], []];
  const bed = ([x, z, rx, rz, pi]) => {
    BD.add(cyl, new THREE.Matrix4().makeScale(rx, 1, rz).setPosition(x, .07, z)); BD.add(rim, new THREE.Matrix4().makeScale(rx, 1, rz).setPosition(x, .085, z), [.1, .09, .08]);
    const ar = rx * rz * Math.PI, pt = (q = .93) => { const a = rnd() * TAU, r = Math.sqrt(rnd()) * q; return [x + Math.cos(a) * r * rx, z + Math.sin(a) * r * rz]; }, P = PAL[pi], tw = P.reduce((s, e) => s + e.w, 0);
    for (let i = 0; i < ar * 4.2; i++) { const p = pt(.97), k = rr(.75, 1.1); tufts.push({ x: p[0], y: .12, z: p[1], ry: rnd() * TAU, s: [rr(.85, 1.5), rr(.8, 1.35), rr(.85, 1.5)], c: [k * rr(.82, 1), k, k * rr(.7, .95)] }); }
    for (let i = 0; i < ar * 5.2; i++) { const p = pt(.9); let e = P[0], q = rnd() * tw; for (const o of P) { q -= o.w; e = o; if (q <= 0) break; } const k = rr(.82, 1.08);
      fl[e.k].push({ x: p[0], y: rr(e.h[0], e.h[1]), z: p[1], ry: rnd() * TAU, rx: e.k === 1 ? rr(-.12, .12) : rr(-.3, .3), s: e.s * rr(.8, 1.25), c: [e.c[0] * k, e.c[1] * k, e.c[2] * k] }); }
  };
  beds.forEach(bed); extra(() => bedsN.forEach(bed)); extra2(() => bedsN2.forEach(bed));
  BD.add(new THREE.CircleGeometry(1.36, 36), new THREE.Matrix4().makeRotationX(-Math.PI / 2).setPosition(0, .505, 0));   // pământul din jardiniera rondului
  g.add(sh(new THREE.Mesh(BD.geo(), m.mulch), false, true));
  g.add(R.instances(R.treeGeo(4, 13).crown, m.leafS, tufts, { cast: false }));
  { // câte o plasă mică pentru fiecare fel de floare: una culcată (văzută de sus) + două în picioare; spicele: trei în picioare
    const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1), O = new THREE.Vector3(), W1 = [1, 1, 1], a = new THREE.Vector3(), lo = new THREE.Vector3(0, -.1, 0);
    [[0, 0], [.5, 0], [0, .5], [.5, .5]].forEach(([u, v], k) => {
      const Q = new R.Cards(), uv = [u, v + .5, u + .5, v];
      if (k === 1) for (let i = 0; i < 3; i++) Q.add(O, a.set(Math.cos(i * TAU / 6), 0, Math.sin(i * TAU / 6)).clone(), Y, .3, .46, Y, W1, uv, true);
      else { Q.add(O, X, Z, .34, .34, Y, W1, uv); Q.add(lo, X, Y, .32, .26, Y, [.8, .8, .8], uv); Q.add(lo, Z, Y, .32, .26, Y, [.8, .8, .8], uv); }
      if (fl[k].length) g.add(R.instances(Q.geo(), m.flower, fl[k], { cast: false }));
    });
  }

  /* ---------- tufe și copaci ---------- */
  const bs = [], bsN = [], ends = to => ([x, z, rx, rz]) => { const long = rz > rx; to.push([x + (long ? 0 : -rx * .92), z + (long ? -rz * .92 : 0), rr(.6, .95)], [x + (long ? 0 : rx * .92), z + (long ? rz * .92 : 0), rr(.6, .95)]); };
  beds.forEach(ends(bs));
  for (let i = 0; i < 10; i++) bs.push([rr(-1, 1) * (GW / 2 - 4), GZ - GD / 2 + rr(2.2, 3.4), rr(.7, 1.15)]);
  const bush = R.treeGeo(3, 9), mkBush = b => { const k = rr(.8, 1.08); blobs.push([b[0], b[1], b[2] * 1.25]); return { x: b[0], y: 0, z: b[1], ry: rnd() * TAU, s: [b[2], b[2] * rr(.9, 1.15), b[2]], c: [k * rr(.8, 1), k, k * rr(.72, .95)] }; }, bl = bs.map(mkBush);
  extra(() => { bedsN.forEach(ends(bsN)); bsN.forEach(b => bl.push(mkBush(b))); });
  extra2(() => { const b2 = []; bedsN2.forEach(ends(b2)); b2.forEach(b => bl.push(mkBush(b))); });
  g.add(sh(R.instances(bush.crown, m.leafS, bl)), sh(R.instances(bush.wood, m.wood, bl)));
  // copacii: [x, z, fel (0 foios, 1 conifer), mărime]; cei din afara gardului stau pe un arc, în spate și pe laturi (în față rămâne liber)
  const trees = [[-26.5, 24.5, 0, 1.25], [26.8, 25, 1, 1.3], [-28, -9.5, 1, 1.5], [28, -12, 0, 1.4], [27.5, -37, 0, 1.6], [-26.5, -38, 0, 1.7], [9.5, GZ - GD / 2 + 4, 1, 1.5], [-10.5, GZ - GD / 2 + 4, 1, 1.45], [28, 10, 1, 1.2], [-28.5, 10.5, 0, 1.25]];
  for (let i = 0; i < 16; i++) { const a = (-125 + 250 * (i + rr(-.3, .3)) / 15) * DEG, Rd = rr(50, 66); trees.push([Math.sin(a) * Rd, VECHI.gz - Math.cos(a) * Rd, rnd() < .45 ? 1 : 0, rr(1.7, 2.9)]); }
  for (let i = 0; i < 8; i++) { const a = (-132 + 264 * (i + rr(-.35, .35)) / 7) * DEG, Rd = rr(128, 150); trees.push([Math.sin(a) * Rd, VECHI.gz - Math.cos(a) * Rd, rnd() < .4 ? 1 : 0, rr(2.4, 3.6)]); }
  // patru forme de copac: 0 și 3 = foios rotund (două coroane diferite), 1 = conifer, 2 = foios înalt (mesteacăn)
  const TL = [[], [], [], []], KIND = [0, 1, 2, 0], SEED = [3, 5, 7, 19], tint = [[1, 1, .9], [.92, 1, .96], [1.12, 1.12, .86], [.96, 1.02, .82]];
  const plant = (x, z, f, s, y = 0) => { const q = tint[f], k = rr(.82, 1.08), w = s * rr(.92, 1.1); TL[f].push({ x, y, z, ry: rnd() * TAU, s: [w, s * rr(.92, 1.1), w], c: [q[0] * k * rr(.86, 1.06), q[1] * k, q[2] * k * rr(.8, 1.05)] }); blobs.push([x, z, s * (f === 1 ? 1.25 : 1.45)]); };
  plant(0, 0, 0, 1.42, .45);   // copacul din rond
  trees.forEach(([x, z, kind, s], i) => (kind ? plant(x, z, 1, s) : i % 3 === 1 ? plant(x, z, 2, s * .9) : plant(x, z, i % 2 ? 3 : 0, s * .95)));
  if (EZ > VECHI.ez + 8) extra(() => { plant(-27.2, E2 - 3.6, 0, 1.2); plant(27.6, E2 - 3.2, 1, 1.25); plant(-44, E2 - 12, 3, 2.1); plant(45, E2 - 7, 1, 2.3); plant(-52, E2 + 2, 1, 2.6); plant(55, E2 - 20, 0, 2.2); });
  if (NOU2) extra2(() => { plant(27.2, EZ - 3.6, 0, 1.2); plant(-27.6, EZ - 3.2, 1, 1.25); plant(44, EZ - 13, 3, 2.1); plant(-45, EZ - 6, 1, 2.3); plant(52, EZ + 3, 1, 2.6); plant(-55, EZ - 19, 0, 2.2); });
  TL.forEach((list, f) => { if (!list.length) return; const t = R.treeGeo(KIND[f], SEED[f]); g.add(sh(R.instances(t.crown, f === 1 ? m.spray : m.leaf, list)), sh(R.instances(t.wood, m.wood, list))); });

  /* ---------- lămpile de grădină, lumina lor pe iarbă (seara) și umbrele moi de la baza lucrurilor ---------- */
  lamps.forEach(([x, z], i) => { if (i > 1) { const l = lampPost(M, 2.5); l.position.set(x, 0, z); fixed.add(l); blobs.push([x, z, .55]); } });
  bake();
  const qd = new THREE.PlaneGeometry(2, 2); qd.rotateX(-Math.PI / 2);
  const pools = R.instances(qd, m.glow, lamps.map(([x, z, r]) => ({ x, y: .06, z, s: [r, 1, r] })), { cast: false, recv: false }); pools.renderOrder = 2; pools.visible = false; g.add(pools);
  const bm = R.instances(qd, m.blob, blobs.map(([x, z, r]) => ({ x, y: .05, z, s: [r, 1, r] })), { cast: false, recv: false }); bm.renderOrder = 1; g.add(bm);
  /* ---------- împrejurimile: hale ca în zona showroom-ului din Ciorogârla (cerut de client: „să vadă că suntem în România, în Ciorogârla”) ---------- */
  const hm = { wall: S({ color: 0xdfe2e4, roughness: .7, metalness: .1 }), wall2: S({ color: 0xb9c0c6, roughness: .7, metalness: .15 }), base: S({ color: 0x6f757b, roughness: .8 }),
    door: S({ color: 0x3b4046, roughness: .6, metalness: .3 }), stripe: S({ color: 0x1f5fa8, roughness: .6 }), asphalt: S({ color: 0x55585c, roughness: .95 }) };
  const hall = (x, z, w, d, hgt, ry, alt) => { const q = new THREE.Group(); q.position.set(x, 0, z); q.rotation.y = ry * DEG;
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, hgt, d), alt ? hm.wall2 : hm.wall); body.position.y = hgt / 2; body.castShadow = true; body.receiveShadow = true; q.add(body);
    const bs = new THREE.Mesh(new THREE.BoxGeometry(w + .1, 1.1, d + .1), hm.base); bs.position.y = .55; q.add(bs);
    const st = new THREE.Mesh(new THREE.BoxGeometry(w + .12, .7, d + .12), hm.stripe); st.position.y = hgt - 1.1; q.add(st);
    const n = Math.max(2, Math.round(w / 9)); for (let i = 0; i < n; i++) { const dr = new THREE.Mesh(new THREE.BoxGeometry(3.6, 4.2, .2), hm.door); dr.position.set(-w / 2 + (i + .5) * w / n, 2.1, d / 2 + .06); q.add(dr); }
    g.add(q); };
  [[-78, -58, 62, 30, 10.5, 12, 0], [8, -98, 80, 34, 11.5, 0, 1], [86, -54, 58, 28, 9.5, -14, 0], [108, 22, 44, 26, 9, -80, 1], [-106, 14, 50, 26, 10, 78, 0]].forEach(a => hall(...a));
  // curtea de asfalt din fața porții
  const asf = new THREE.Mesh(new THREE.PlaneGeometry(96, 24), hm.asphalt); asf.rotation.x = -Math.PI / 2; asf.position.set(0, .02, EZ + 24); asf.receiveShadow = true; g.add(asf);
  return { night(n) { const on = n > .01; m.glow.opacity = n * .8; pools.visible = on; glows.forEach(q => { q.visible = on; }); } };
}
