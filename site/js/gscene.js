// Scena de bază a grădinii: cer, gazon, soare, ceață spre orizont. Ora zilei se dă cu setTime(t) (aceleași chei ca la deschidere).
// Seara: geamurile devin transparente, pereții interiori (M.inner, M.ceil), benzile LED (M.ledIn, M.led) și lămpile (M.lamp) se aprind.
import { THREE, makeRenderer, fit, studioEnv, materials, dayAt, clamp, lerp } from './kit.js';
import { x7Materials } from './x7.js';
import { houseMaterials, glassNight } from './furn.js';

function lawnTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#86b062' : '#7ea95a'; x.fillRect(i * 32, 0, 32, 256); }
  let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 900; i++) { x.fillStyle = rnd() > .5 ? 'rgba(255,255,255,.05)' : 'rgba(40,70,20,.05)'; x.fillRect(rnd() * 256, rnd() * 256, 2, 3); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

export function createGScene(canvas, { shadowSize = 2048, half = 46 } = {}) {
  const renderer = makeRenderer(canvas, { alpha: false, shadows: true });
  const scene = new THREE.Scene(); scene.environment = studioEnv(renderer);
  const camera = new THREE.PerspectiveCamera(38, 1, .5, 1200);
  const M = houseMaterials(x7Materials(materials()));
  M.glass = M.glass.clone();
  const U = { top: { value: new THREE.Color() }, bot: { value: new THREE.Color() } };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(700, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: U,
    vertexShader: 'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'uniform vec3 top;uniform vec3 bot;varying vec3 vP;void main(){float h=clamp(normalize(vP).y*3.4,0.,1.);gl_FragColor=vec4(mix(bot,top,pow(h,.7)),1.);\n#include <colorspace_fragment>\n}' }));
  sky.renderOrder = -10; scene.add(sky);
  scene.fog = new THREE.Fog(0xffffff, 110, 420);
  const lt = lawnTexture(); lt.repeat.set(110, 110);
  const lawnM = new THREE.MeshStandardMaterial({ color: 0xffffff, map: lt, roughness: 1 });
  const lawn = new THREE.Mesh(new THREE.CircleGeometry(520, 48), lawnM); lawn.rotation.x = -Math.PI / 2; lawn.receiveShadow = true; scene.add(lawn);
  const sun = new THREE.DirectionalLight(0xffffff, 3); sun.castShadow = true; sun.shadow.mapSize.set(shadowSize, shadowSize);
  const sc = sun.shadow.camera; sc.left = -half; sc.right = half; sc.top = half; sc.bottom = -half; sc.near = 1; sc.far = 260; sun.shadow.bias = -.0005; sun.shadow.normalBias = .05; sun.shadow.radius = 4; scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(0xffffff, 0xcccccc, 1); scene.add(hemi);
  const N = 300, sp = new Float32Array(N * 3); for (let i = 0; i < N; i++) { const u = (i * .61803398875) % 1, v = .1 + .88 * ((i * .7548776662) % 1), th = u * Math.PI * 2, ph = Math.acos(v), r = 600; sp[3 * i] = r * Math.sin(ph) * Math.cos(th); sp[3 * i + 1] = r * Math.cos(ph); sp[3 * i + 2] = r * Math.sin(ph) * Math.sin(th); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false })); scene.add(stars);
  const warm = new THREE.Color(0xffc890), d = {};
  function setTime(t) {
    dayAt(t, d); const az = d.az * Math.PI / 180, el = Math.max(d.el, 9) * Math.PI / 180;
    sun.position.set(Math.sin(az) * Math.cos(el) * 120, Math.sin(el) * 120, Math.cos(az) * Math.cos(el) * 120); sun.color.copy(d.sc); sun.intensity = d.si;
    hemi.color.copy(d.hs); hemi.groundColor.copy(d.hg); hemi.intensity = d.hi * 1.15; renderer.toneMappingExposure = d.ex; scene.environmentIntensity = lerp(.4, .1, d.n);
    U.top.value.copy(d.top); U.bot.value.copy(d.bot); scene.fog.color.copy(d.bot); stars.material.opacity = clamp((d.n - .55) / .45) * .9;
    const n = d.n; glassNight(M.glass, n, d.gl);
    M.led.emissiveIntensity = n * 2.6; M.ledIn.emissiveIntensity = n * 3.2; M.lamp.emissiveIntensity = n * 3.4;
    M.inner.emissive.copy(warm); M.inner.emissiveIntensity = n * .6; M.ceil.emissive.copy(warm); M.ceil.emissiveIntensity = n * .7; M.floor.emissive.copy(warm); M.floor.emissiveIntensity = n * .22;
    if (M.clones) for (const [m, c] of M.clones) { c.color.copy(m.color); if (c.emissive) { c.emissive.copy(m.emissive); c.emissiveIntensity = m.emissiveIntensity; } c.metalness = m.metalness; c.roughness = m.roughness; if (m.envMapIntensity !== undefined) c.envMapIntensity = m.envMapIntensity; c.opacity = m.opacity * (1 - (c.userData.k || 0)); }
    return d;
  }
  setTime(12.5);
  return { renderer, scene, camera, M, sun, hemi, lawn, setTime, day: d, fit: (el, dpr) => fit(renderer, camera, el, dpr), render() { renderer.render(scene, camera); } };
}
