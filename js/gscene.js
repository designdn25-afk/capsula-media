// Scena de bază a grădinii: cer adevărat (soare, nori, apus, stele), gazon, soare cu umbre, ceață spre orizont, reflexii luate din cer.
// Ora zilei se dă cu setTime(t): ziua 10,6 · seara 19,9. Seara geamurile devin străvezii, iar pereții interiori (M.inner, M.ceil, M.floor),
// benzile LED (M.ledIn, M.led) și lămpile (M.lamp) se aprind. Ziua, interioarele au puțină lumină proprie, ca să nu pară peșteri.
// Uneltele pentru aspectul real (texturi, materiale, cer) sunt în js/real.js.
import { THREE, makeRenderer, fit, materials, clamp, lerp } from './kit.js';
import { x7Materials } from './x7.js';
import { houseMaterials, glassNight } from './furn.js';
import * as R from './real.js';

const DEG = Math.PI / 180, C = h => new THREE.Color(h);
// Lumina zilei în grădină (alta decât a machetei de la deschidere, kit.DAY). Pe ore, amestecate lin:
//   zen / hor = cerul sus și la orizont · fog = ceața din zare (culoarea de pe ecran) · glow = lumina din jurul soarelui · cl / cs = norii la lumină și la umbră
//   az / el = soarele (grade) · sc / si = culoarea și tăria lui · sun = discul de pe cer · hs / hg / hi = lumina cerului și a pământului · env = tăria reflexiilor
//   ex = expunere · n = noapte (0…1) · gl = culoarea geamului · cloud = cât de vizibili sunt norii
const COL = ['zen', 'hor', 'fog', 'glow', 'cl', 'cs', 'sc', 'hs', 'hg', 'gl'], NUM = ['az', 'el', 'si', 'sun', 'hi', 'env', 'ex', 'n', 'cloud'];
const DAY = [
  { t: 6.5, zen: '#4d7ab8', hor: '#f3d3b4', fog: '#c2bcae', glow: '#ff9d58', cl: '#ffe6d0', cs: '#8f9ab2', az: -62, el: 10, sc: '#ffc793', si: 2.6, sun: 1, hs: '#dde2ee', hg: '#6c685a', hi: .58, env: .26, ex: 1.25, n: 0, gl: '#8894a0', cloud: .85 },
  { t: 9.2, zen: '#2c68bc', hor: '#bfd8ee', fog: '#9eb1a4', glow: '#bcd0e0', cl: '#ffffff', cs: '#a4b0c4', az: -36, el: 36, sc: '#fff1de', si: 3.5, sun: 1, hs: '#dbe4f2', hg: '#74725f', hi: .6, env: .27, ex: 1.22, n: 0, gl: '#7d8c98', cloud: .9 },
  { t: 12.5, zen: '#2862b8', hor: '#bcd6ee', fog: '#a0b3a6', glow: '#b8cee0', cl: '#ffffff', cs: '#a8b4c8', az: 8, el: 56, sc: '#fff8ee', si: 3.7, sun: 1, hs: '#dce5f3', hg: '#767461', hi: .6, env: .27, ex: 1.2, n: 0, gl: '#7d8c98', cloud: .9 },
  { t: 17.6, zen: '#3a68ac', hor: '#f4d3ae', fog: '#bdb3a2', glow: '#ff9a50', cl: '#ffdcb8', cs: '#868ca8', az: 58, el: 16, sc: '#ffb273', si: 3.0, sun: 1, hs: '#d6d8e8', hg: '#6e6654', hi: .58, env: .27, ex: 1.25, n: .1, gl: '#8c8c90', cloud: .9 },
  { t: 19.1, zen: '#27397a', hor: '#f0a66c', fog: '#8c7a74', glow: '#ff6a2c', cl: '#ff9a74', cs: '#48486c', az: 74, el: 3, sc: '#ff9058', si: 1.2, sun: .6, hs: '#98a2d4', hg: '#4a4640', hi: .75, env: .5, ex: 1.4, n: .55, gl: '#6c6c7c', cloud: .9 },
  { t: 19.9, zen: '#1c2a62', hor: '#d07c52', fog: '#3c3d55', glow: '#f0561e', cl: '#c66a58', cs: '#2c2e52', az: 80, el: -1, sc: '#e09a80', si: .6, sun: 0, hs: '#8c9be0', hg: '#34363c', hi: 1.1, env: .8, ex: 1.7, n: .82, gl: '#5a5e70', cloud: .85 },
  { t: 21.2, zen: '#050914', hor: '#0e1630', fog: '#0a0f1c', glow: '#0a1020', cl: '#161e34', cs: '#080c18', az: 110, el: 30, sc: '#93a8ff', si: .45, sun: 0, hs: '#27325a', hg: '#090c15', hi: .34, env: .4, ex: 1.5, n: 1, gl: '#3a4050', cloud: .5 },
].map(k => { const o = { ...k }; COL.forEach(c => { o[c] = C(k[c]); }); return o; });
function dayAt(t, out) {
  let i = 0; while (i < DAY.length - 2 && t > DAY[i + 1].t) i++;
  const a = DAY[i], b = DAY[i + 1], f = clamp((t - a.t) / (b.t - a.t)), g = f * f * (3 - 2 * f);
  for (const k of COL) (out[k] || (out[k] = new THREE.Color())).copy(a[k]).lerp(b[k], g);
  for (const k of NUM) out[k] = lerp(a[k], b[k], g);
  out.t = t; return out;
}

export function createGScene(canvas, { shadowSize = 2048, half = 46 } = {}) {
  const renderer = makeRenderer(canvas, { alpha: false, shadows: true }), lite = shadowSize < 2048;   // lite = ecran mic (telefon)
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(38, 1, .5, 1200), T = R.textures();
  const sky = R.makeSky(T.noise); scene.add(sky.mesh);
  const M = R.realMaterials(houseMaterials(x7Materials(materials())), T);
  scene.fog = new THREE.Fog(0xa0b3a6, 140, 620);
  const lw = R.lawnMaterial(T), lawn = new THREE.Mesh(new THREE.CircleGeometry(520, 48), lw.mat); lawn.rotation.x = -Math.PI / 2; lawn.receiveShadow = true; scene.add(lawn);
  const sun = new THREE.DirectionalLight(0xffffff, 3); sun.castShadow = true; sun.shadow.mapSize.set(shadowSize, shadowSize);
  const sc = sun.shadow.camera; sc.left = -half; sc.right = half; sc.top = half; sc.bottom = -half; sc.near = 1; sc.far = 260; sun.shadow.bias = -.0004; sun.shadow.normalBias = .045; scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(0xffffff, 0xcccccc, 1); scene.add(hemi);

  const d = { top: new THREE.Color(), bot: new THREE.Color() }, warm = C(0xffc890), fillDay = C(0xfff0dc), grass = C(0x5a6155), trees = C(0x1c2a18), v = new THREE.Vector3();
  const boxes = [];   // casele (le pune genv.js): când privitorul e într-una, geamurile se văd dinăuntru
  // mobila și lemnul primesc seara puțină lumină caldă (în culoarea lor), ca interioarele să nu rămână albăstrui lângă pereții luminați
  const lit = [M.white, M.wood, M.fabric, M.sofa, M.green, M.black, M.clad, M.orange];
  let envT = -99, envDirty = true, moved = false, lastT = -99;
  function setTime(t) {
    dayAt(t, d); d.top.copy(d.zen); d.bot.copy(d.fog);
    const az = d.az * DEG, es = d.el * DEG, el = Math.max(d.el, 11) * DEG, tp = sun.target.position, n = d.n;
    sun.position.set(tp.x + Math.sin(az) * Math.cos(el) * 120, Math.sin(el) * 120, tp.z + Math.cos(az) * Math.cos(el) * 120); sun.color.copy(d.sc); sun.intensity = d.si;
    hemi.color.copy(d.hs); hemi.groundColor.copy(d.hg); hemi.intensity = d.hi; renderer.toneMappingExposure = d.ex; scene.environmentIntensity = d.env; scene.fog.color.copy(d.fog);
    const U = sky.U, gl = (d.si * Math.sin(el) + d.hi * 1.6) / Math.PI;
    U.uZen.value.copy(d.zen); U.uHor.value.copy(d.hor); U.uFog.value.copy(d.fog).convertLinearToSRGB(); U.uGlow.value.copy(d.glow); U.uCl.value.copy(d.cl); U.uCs.value.copy(d.cs);
    U.uSunDir.value.set(Math.sin(az) * Math.cos(es), Math.sin(es), Math.cos(az) * Math.cos(es)); U.uSunCol.value.copy(d.sc).multiplyScalar(d.sun);
    U.uGround.value.copy(grass).multiplyScalar(gl); U.uTree.value.copy(trees).multiplyScalar(gl); U.uP.value.set(d.cloud, .5, clamp((n - .55) / .45), 0);
    glassNight(M.glass, n, d.gl); R.GLASS.base.value = M.glass.opacity;
    M.led.emissiveIntensity = n * 1.3; M.ledIn.emissiveIntensity = n * 3.2; M.lamp.emissiveIntensity = n * 3.4;
    M.inner.emissive.copy(fillDay).lerp(warm, n); M.inner.emissiveIntensity = lerp(.27, .6, n); M.ceil.emissive.copy(M.inner.emissive); M.ceil.emissiveIntensity = lerp(.36, .7, n); M.floor.emissive.copy(M.inner.emissive); M.floor.emissiveIntensity = lerp(.07, .24, n);
    for (const m of lit) { m.emissive.copy(m.color).multiply(warm); m.emissiveIntensity = n * .34; }
    if (M.clones) for (const [m, c] of M.clones) { c.color.copy(m.color); if (c.emissive) { c.emissive.copy(m.emissive); c.emissiveIntensity = m.emissiveIntensity; } c.metalness = m.metalness; c.roughness = m.roughness; if (m.envMapIntensity !== undefined) c.envMapIntensity = m.envMapIntensity; c.opacity = m.opacity * (1 - (c.userData.k || 0)); }
    if (Math.abs(t - lastT) > 1e-4) { moved = true; lastT = t; if (Math.abs(t - envT) > .02) envDirty = true; }
    return d;
  }
  setTime(12.5);
  // reflexiile se iau din cerul de mai sus (o singură textură, refăcută pe loc când se schimbă ora)
  const env = R.makeEnv(renderer, sky, lite ? 128 : 256); scene.environment = env.texture; envT = 12.5; envDirty = false;
  R.ENVMAPPED.forEach(k => { M[k].envMap = env.texture; });
  const G = { renderer, scene, camera, M, sun, hemi, lawn, setTime, day: d, T, sky, env, lawnU: lw.U, boxes, lit, fit: (el, dpr) => fit(renderer, camera, el, dpr),
    render() {
      // reflexiile se refac doar când ora s-a schimbat destul sau s-a oprit (setTime poate fi chemat la fiecare cadru)
      if (envDirty && (!moved || Math.abs(d.t - envT) >= .6)) { env.update(); envT = d.t; envDirty = false; }
      moved = false;
      let k = 0; for (const b of boxes) { v.copy(camera.position).applyMatrix4(b.inv); const o = Math.max(Math.abs(v.x) - b.w / 2, Math.abs(v.z - b.cz) - b.d / 2, v.y - b.h, -v.y); k = Math.max(k, clamp((.5 - o) / .8)); }
      R.GLASS.inside.value = k;
      renderer.render(scene, camera);
    } };
  return G;
}
