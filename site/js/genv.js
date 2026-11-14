// Grădina din jurul caselor: gard viu, alei cu dale, rond, straturi cu flori, tufe, copaci, lămpi.
// Folosit de js/garden.js după ce casele au fost așezate. Întoarce { night(n) } (lumina lămpilor pe iarbă, seara).
// Pe fiecare casă pune: h.ring (inelul auriu de la alegere) și h.door (punctul din fața ușii).
import { THREE, clamp, tree, blobTexture, pavingTexture, perimeter, sweep, cap, box } from './kit.js';
import { lampPost } from './furn.js';
import { GRADINA } from './gradina-data.js';

const DEG = Math.PI / 180;

/* ---------- grădina: gard viu, alei cu dale, flori, copaci, lămpi ---------- */
export function buildGarden(G, H) {
  const { scene, M } = G, S = o => new THREE.MeshStandardMaterial(o), g = new THREE.Group(); scene.add(g);
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, rr = (a, b) => a + (b - a) * rnd();
  const { latime: GW, adancime: GD, centruZ: GZ, intrareZ: EZ } = GRADINA;
  const m = {
    hedge: S({ color: 0x3f6b3a, roughness: 1, side: THREE.DoubleSide }), stone: S({ color: 0xd9d3c7, roughness: .95 }), soil: S({ color: 0x4f3e31, roughness: 1 }),
    pave: S({ color: 0xffffff, roughness: .95, map: pavingTexture('#e6e1d6', 'rgba(70,60,45,.13)') }), trunk: S({ color: 0x6d5846, roughness: 1 }),
    leaf: [0x4d8a44, 0x6aa353, 0x35683a, 0x7fae5c].map(c => S({ color: c, roughness: 1, flatShading: true })),
    bush: S({ color: 0x4a7f42, roughness: 1, flatShading: true }), tuft: S({ color: 0x5c9150, roughness: 1 }), flower: S({ color: 0xffffff, roughness: .8 }),
    gold: () => new THREE.MeshBasicMaterial({ color: 0xd4a24c, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }),
    glow: new THREE.MeshBasicMaterial({ map: blobTexture('rgba(255,196,120,.55)', 'rgba(255,196,120,0)'), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }),
  };
  m.pave.map.repeat.set(.42, .42);
  const sh = (o, cast = true, recv = true) => { o.castShadow = cast; o.receiveShadow = recv; return o; };
  const flat = (geo, mat, y) => { const o = new THREE.Mesh(geo, mat); o.rotation.x = -Math.PI / 2; o.position.y = y; o.receiveShadow = true; return o; };
  const lamps = [];

  // gardul viu, cu poartă în față
  const hp = perimeter(GW, GD, 9), prof = [{ d: 0, y: 0 }, { d: 0, y: 1.2 }, { d: .18, y: 1.38 }, { d: .95, y: 1.38 }, { d: 1.13, y: 1.2 }, { d: 1.13, y: 0 }];
  const hedge = sh(new THREE.Mesh(sweep(hp, prof, { ds: .9, s0: hp.a + 3.7, s1: hp.total + hp.a - 3.7 }), m.hedge)); hedge.position.z = GZ; g.add(hedge);
  [-1, 1].forEach(sg => { g.add(sh(box(.8, 2, .8, m.stone, sg * 4.2, 1, EZ - .5)), sh(box(.95, .08, .95, m.stone, sg * 4.2, 2.42, EZ - .5))); const l = box(.5, .36, .5, M.lamp, sg * 4.2, 2.2, EZ - .5); g.add(l); lamps.push([sg * 4.2, EZ - 1.6, 5]); });

  // locul fiecărei case: platformă pavată, inel auriu (la alegere), lumină caldă pe iarbă seara
  H.forEach(h => {
    const s = h.s, cz = s.cz || 0;
    const pad = new THREE.Mesh(cap(perimeter(s.w + 2.6, s.d + 2.6, 1.4), .03), m.pave); pad.position.z = cz; pad.receiveShadow = true; h.g.add(pad);
    h.ring = new THREE.Mesh(sweep(perimeter(s.w + 3.5, s.d + 3.5, 1.85), [{ d: 0, y: .05 }, { d: .17, y: .05 }], { ds: .45 }), m.gold()); h.ring.position.z = cz; h.ring.visible = false; h.ring.renderOrder = 3; h.g.add(h.ring);
    const gl = flat(new THREE.PlaneGeometry(s.w + 9, s.d + 11), m.glow, .045); gl.receiveShadow = false; gl.position.z = cz + 1.5; gl.renderOrder = 2; h.g.add(gl);
  });

  // aleile: dale pe iarbă, de la poartă la rondul din mijloc și de acolo la fiecare casă
  const stones = [];
  const path = (pts, step = .98) => { const cv = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], 0, p[1]))), n = Math.max(2, Math.floor(cv.getLength() / step));
    for (let i = 0; i <= n; i++) { const p = cv.getPointAt(i / n), t = cv.getTangentAt(i / n); if (Math.hypot(p.x, p.z) < 4.1) continue; stones.push([p.x + rr(-.05, .05), p.z + rr(-.05, .05), Math.atan2(t.x, t.z) + rr(-.1, .1), rr(.92, 1.08)]); } };
  path([[0, EZ + 6], [.5, EZ - 3], [-1.3, 19], [1.1, 10], [0, 4]]);
  let backEnd = [0, GZ - 8];
  H.forEach(h => { const dp = h.g.localToWorld(new THREE.Vector3(0, 0, (h.s.cz || 0) + h.s.d / 2 + 1.5)); h.door = dp; if (Math.abs(dp.x) < 3) backEnd = [dp.x, dp.z]; });
  path([[0, -4], [-1.1, backEnd[1] * .4], [.9, backEnd[1] * .75], backEnd]);
  H.forEach(h => { const d = h.door; if (Math.abs(d.x) < 3) return; const z0 = clamp(d.z + 3, backEnd[1] + 4, EZ - 6), sx = Math.sign(d.x); path([[sx * 1.2, z0], [d.x * .5, (z0 + d.z) / 2 + 1.2], [d.x, d.z]]); lamps.push([d.x - sx * 2.2, d.z + 1.2, 4.5]); });
  const sm = new THREE.InstancedMesh(new THREE.BoxGeometry(1.08, .06, .5), m.stone, stones.length), dm = new THREE.Object3D(); sm.receiveShadow = true;
  stones.forEach((s, i) => { dm.position.set(s[0], .03, s[1]); dm.rotation.set(0, s[2], 0); dm.scale.set(s[3], 1, s[3]); dm.updateMatrix(); sm.setMatrixAt(i, dm.matrix); }); g.add(sm);

  // rondul din mijloc, cu un copac
  g.add(flat(new THREE.ShapeGeometry(new THREE.Shape().absarc(0, 0, 3.9, 0, Math.PI * 2), 40), m.pave, .035));
  const pot = sh(new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.62, .5, 36), m.stone)); pot.position.y = .25; g.add(pot);
  const so = new THREE.Mesh(new THREE.CylinderGeometry(1.34, 1.34, .06, 36), m.soil); so.position.y = .5; g.add(so);
  const t0 = tree(0, 1.5, { trunk: m.trunk, leaf: m.leaf[1] }); t0.position.y = .45; g.add(t0);
  [[-3.1, 1.9, .5], [3.1, -1.9, .5 + Math.PI]].forEach(([x, z, a]) => { const b = new THREE.Group(); b.add(sh(box(1.7, .07, .46, M.wood, 0, .45, 0)), sh(box(.08, .45, .4, m.stone, -.7, .225, 0)), sh(box(.08, .45, .4, m.stone, .7, .225, 0))); b.position.set(x, 0, z); b.rotation.y = a; g.add(b); });
  lamps.push([-3.3, 9, 4.5], [3.2, 18, 4.5], [-2.6, GZ - 6, 4.5]);

  // straturi cu flori
  const beds = [[-27.6, 19, 2.2, 6, 0], [-28.2, 1, 2, 6.5, 1], [-27.6, -24, 2.2, 8, 2], [27.6, 20, 2.2, 6, 1], [28.2, 0, 2, 6.5, 3], [27.6, -25, 2.2, 8, 0],
    [-14, GZ - GD / 2 + 3.4, 8, 1.9, 3], [14, GZ - GD / 2 + 3.4, 8, 1.9, 1], [-14.5, EZ - 3.2, 7, 1.8, 2], [14.5, EZ - 3.2, 7, 1.8, 0], [-4.6, 20, 1.3, 4.4, 1], [4.7, 15, 1.3, 4.4, 2], [-6.6, -1.2, 1.4, 3, 0], [6.6, 1.2, 1.4, 3, 3]];
  const pal = [[0x9a7fe0, 0xf4f1ff], [0xee8fb0, 0xffffff], [0xf3c64e, 0xf59a4a], [0x8f6fd6, 0xe98ab3]];
  const fl = [], tu = [];
  beds.forEach(([x, z, rx, rz, pi]) => {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, .14, 28), m.soil); b.scale.set(rx, 1, rz); b.position.set(x, .07, z); b.receiveShadow = true; g.add(b);
    const ar = rx * rz * Math.PI, pt = () => { const a = rnd() * 6.283, r = Math.sqrt(rnd()) * .93; return [x + Math.cos(a) * r * rx, z + Math.sin(a) * r * rz]; };
    for (let i = 0; i < ar * 3; i++) { const p = pt(); fl.push([p[0], rr(.3, .52), p[1], rr(.75, 1.25), pal[pi][rnd() < .68 ? 0 : 1]]); }
    for (let i = 0; i < ar * 1.7; i++) { const p = pt(); tu.push([p[0], p[1], rr(.8, 1.3)]); }
  });
  const fm = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.13, 0), m.flower, fl.length), col = new THREE.Color();
  fl.forEach((f, i) => { dm.position.set(f[0], f[1], f[2]); dm.rotation.set(0, 0, 0); dm.scale.setScalar(f[3]); dm.updateMatrix(); fm.setMatrixAt(i, dm.matrix); fm.setColorAt(i, col.setHex(f[4])); }); fm.receiveShadow = true; g.add(fm);
  const tm = new THREE.InstancedMesh(new THREE.ConeGeometry(.2, .42, 5), m.tuft, tu.length);
  tu.forEach((t, i) => { dm.position.set(t[0], .14 + .2 * t[2], t[1]); dm.rotation.set(0, rnd() * 3, 0); dm.scale.setScalar(t[2]); dm.updateMatrix(); tm.setMatrixAt(i, dm.matrix); }); tm.receiveShadow = true; g.add(tm);

  // tufe rotunde și copaci
  const bs = []; beds.forEach(([x, z, rx, rz]) => { const long = rz > rx; bs.push([x + (long ? 0 : -rx * .92), z + (long ? -rz * .92 : 0), rr(.6, .95)], [x + (long ? 0 : rx * .92), z + (long ? rz * .92 : 0), rr(.6, .95)]); });
  for (let i = 0; i < 10; i++) bs.push([rr(-1, 1) * (GW / 2 - 4), GZ - GD / 2 + rr(2.2, 3.4), rr(.7, 1.15)]);
  const bm = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), m.bush, bs.length);
  bs.forEach((b, i) => { dm.position.set(b[0], b[2] * .62, b[1]); dm.rotation.set(0, rnd() * 3, 0); dm.scale.set(b[2], b[2] * .78, b[2]); dm.updateMatrix(); bm.setMatrixAt(i, dm.matrix); }); sh(bm); g.add(bm);
  const trees = [[-26.5, 24.5, 0, 1.25], [26.8, 25, 1, 1.3], [-28, -9.5, 1, 1.5], [28, -12, 0, 1.4], [27.5, -37, 0, 1.6], [-26.5, -38, 0, 1.7], [9.5, GZ - GD / 2 + 4, 1, 1.5], [-10.5, GZ - GD / 2 + 4, 1, 1.45], [28, 10, 1, 1.2], [-28.5, 10.5, 0, 1.25]];
  for (let i = 0; i < 30; i++) { const a = (-125 + 250 * (i + rr(-.3, .3)) / 29) * DEG, R = rr(50, 70); trees.push([Math.sin(a) * R, GZ - Math.cos(a) * R, rnd() < .45 ? 1 : 0, rr(1.7, 2.9)]); }
  trees.forEach(([x, z, kind, s], i) => { const t = tree(kind, s, { trunk: m.trunk, leaf: m.leaf[(i * 7 + kind) % m.leaf.length] }); t.position.set(x, 0, z); t.rotation.y = rnd() * 6; g.add(t); });

  // lămpile de grădină și lumina lor pe iarbă (seara)
  lamps.forEach(([x, z, r], i) => { if (i > 1) { const l = lampPost(M, 2.5); l.position.set(x, 0, z); g.add(l); } const gl = flat(new THREE.PlaneGeometry(r * 2, r * 2), m.glow, .05); gl.position.x = x; gl.position.z = z; gl.receiveShadow = false; gl.renderOrder = 2; g.add(gl); });
  return { night(n) { m.glow.opacity = n * .85; } };
}
