// Scena comună pentru capsula X7: curtea pavată, soarele, lumina cerului, stelele. Ora zilei se dă cu setTime(t).
import { THREE, makeRenderer, fit, studioEnv, materials, dayAt, pavingTexture, blobTexture, tree, clamp, lerp } from './kit.js';
import { buildX7, x7Materials } from './x7.js';

export function createStage(canvas, { shadows = true, shadowSize = 2048 } = {}) {
  const renderer = makeRenderer(canvas, { alpha: true, shadows });
  const scene = new THREE.Scene(); scene.environment = studioEnv(renderer);
  const camera = new THREE.PerspectiveCamera(30, 1, .5, 500);
  const M = x7Materials(materials()), x7 = buildX7(M);
  scene.add(x7.root);

  /* curtea: o placă pavată, cu colțuri rotunjite, care „plutește” pe fundalul paginii */
  const yard = new THREE.Group(); scene.add(yard);
  const sw = 23, sd = 12.5, sr = 2.2, sh = new THREE.Shape();
  sh.moveTo(-sw / 2 + sr, -sd / 2); sh.lineTo(sw / 2 - sr, -sd / 2); sh.absarc(sw / 2 - sr, -sd / 2 + sr, sr, -Math.PI / 2, 0); sh.lineTo(sw / 2, sd / 2 - sr); sh.absarc(sw / 2 - sr, sd / 2 - sr, sr, 0, Math.PI / 2);
  sh.lineTo(-sw / 2 + sr, sd / 2); sh.absarc(-sw / 2 + sr, sd / 2 - sr, sr, Math.PI / 2, Math.PI); sh.lineTo(-sw / 2, -sd / 2 + sr); sh.absarc(-sw / 2 + sr, -sd / 2 + sr, sr, Math.PI, Math.PI * 1.5);
  const pav = pavingTexture('#d9d2c5', 'rgba(70,58,44,.2)'); pav.repeat.set(1 / 1.3, 1 / 1.3);
  const slabTop = new THREE.MeshStandardMaterial({ color: 0xffffff, map: pav, roughness: .92 }), slabSide = new THREE.MeshStandardMaterial({ color: 0xbfb8ab, roughness: .9 });
  const slabG = new THREE.ExtrudeGeometry(sh, { depth: .45, bevelEnabled: false, curveSegments: 16 }); slabG.rotateX(Math.PI / 2); // fața de sus la y = 0
  const slab = new THREE.Mesh(slabG, [slabTop, slabSide]); slab.receiveShadow = true; slab.position.z = .6; yard.add(slab);
  const under = new THREE.Mesh(new THREE.PlaneGeometry(40, 24), new THREE.MeshBasicMaterial({ map: blobTexture('rgba(20,16,10,.5)'), transparent: true, depthWrite: false, opacity: .55 }));
  under.rotation.x = -Math.PI / 2; under.position.set(0, -.75, .6); yard.add(under);
  const leaf = new THREE.MeshStandardMaterial({ color: 0xd2ccbf, roughness: .95, flatShading: true }), trunk = new THREE.MeshStandardMaterial({ color: 0x9a8c7c, roughness: .9 });
  [[9.3, -3.9, 0, 1.15], [6.5, -4.9, 1, .85], [2.6, -5.0, 0, .7]].forEach(([x, z, k, s]) => { const t = tree(k, s, { leaf, trunk }); t.position.set(x, 0, z); yard.add(t); });
  // lumina caldă care cade seara pe pavaj, în dreptul geamurilor
  const glowM = new THREE.MeshBasicMaterial({ map: blobTexture('rgba(255,190,110,.85)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
  [[-4.4, 3.4, 7, 4.6], [4.3, 3.2, 6, 4], [-7.2, 0, 4.6, 5.5], [7, 0, 4.2, 5], [3.4, -3.2, 6, 3.6]].forEach(([x, z, w, d]) => { const g = new THREE.Mesh(new THREE.PlaneGeometry(w, d), glowM); g.rotation.x = -Math.PI / 2; g.position.set(x, .012, z); yard.add(g); });

  /* soarele și cerul */
  const sun = new THREE.DirectionalLight(0xffffff, 3); sun.castShadow = shadows;
  sun.shadow.mapSize.set(shadowSize, shadowSize); const sc = sun.shadow.camera; sc.left = -15; sc.right = 15; sc.top = 12; sc.bottom = -12; sc.near = 1; sc.far = 90;
  sun.shadow.bias = -.0004; sun.shadow.normalBias = .035; sun.shadow.radius = 5; scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(0xffffff, 0xcccccc, 1); scene.add(hemi);
  const N = 420, sp = new Float32Array(N * 3); for (let i = 0; i < N; i++) { const u = (i * .61803398875) % 1, v = .08 + .9 * ((i * .7548776662) % 1), th = u * Math.PI * 2, ph = Math.acos(v), r = 220; sp[3 * i] = r * Math.sin(ph) * Math.cos(th); sp[3 * i + 1] = r * Math.cos(ph); sp[3 * i + 2] = r * Math.sin(ph) * Math.sin(th); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false })); scene.add(stars);

  const outl = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(sh.getPoints(24).map(p => new THREE.Vector3(p.x, .01, -p.y + .6))), new THREE.LineBasicMaterial({ color: 0xe9dcc2, transparent: true, opacity: 0, depthWrite: false }));
  yard.add(outl); const trees = yard.children.filter(c => c.isGroup);
  function setBlueprint(b) {
    b = clamp(b); x7.blueprint(b); const on = b > .001;
    [slabTop, slabSide].forEach(m => { if (m.transparent !== on) { m.transparent = on; m.needsUpdate = true; } m.opacity = 1 - b; m.depthWrite = b < .5; });
    slab.visible = b < .995; trees.forEach(t => { t.visible = b < .5; }); under.material.opacity = .55 * (1 - b); outl.material.opacity = b * .35; bpK = b;
  }
  const d = {}; let envBase = 1, bpK = 0;
  function setTime(t) {
    dayAt(t, d); const az = d.az * Math.PI / 180, el = d.el * Math.PI / 180;
    sun.position.set(Math.sin(az) * Math.cos(el) * 45, Math.sin(el) * 45, Math.cos(az) * Math.cos(el) * 45); sun.color.copy(d.sc); sun.intensity = d.si;
    hemi.color.copy(d.hs); hemi.groundColor.copy(d.hg); hemi.intensity = d.hi;
    renderer.toneMappingExposure = d.ex; scene.environmentIntensity = lerp(.42, .1, d.n) * envBase;
    x7.night(d.n, d.gl); stars.material.opacity = clamp((d.n - .55) / .45) * .9; glowM.opacity = clamp((d.n - .25) / .75) * .5 * (1 - bpK);
    return d;
  }
  setTime(9);
  return { renderer, scene, camera, x7, M, yard, sun, hemi, stars, setTime, setBlueprint, day: d,
    setEnv(k) { envBase = k; }, fit: (el, dpr) => fit(renderer, camera, el, dpr), render() { renderer.render(scene, camera); } };
}

// așază camera pe o sferă în jurul țintei: az = 0 privește fațada cu intrarea, pozitiv spre dreapta; el = înălțimea (grade)
export function orbit(camera, { az = 0, el = 15, dist = 30, tx = 0, ty = 1.6, tz = 0 }) {
  const a = az * Math.PI / 180, e = el * Math.PI / 180;
  camera.position.set(tx + Math.sin(a) * Math.cos(e) * dist, ty + Math.sin(e) * dist, tz + Math.cos(a) * Math.cos(e) * dist);
  camera.lookAt(tx, ty, tz);
}
