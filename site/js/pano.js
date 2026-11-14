// Fotografii reale 360° (panorame echirectangulare) desenate peste scena 3D, pentru interiorul caselor care au așa ceva.
// Se folosește din js/garden.js: când vizitatorul intră în casă, fotografia apare lin peste macheta 3D, aliniată cu ea.
import { THREE } from './kit.js';

export function createPano(renderer) {
  const U = { tA: { value: null }, tB: { value: null }, mixB: { value: 0 }, op: { value: 0 }, yaw: { value: 0 }, pitch: { value: 0 }, th: { value: 1 }, asp: { value: 1 }, off: { value: new THREE.Vector2() } };
  const mat = new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthTest: false, depthWrite: false, toneMapped: false,
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader: `uniform sampler2D tA;uniform sampler2D tB;uniform float mixB,op,yaw,pitch,th,asp;uniform vec2 off;varying vec2 vUv;
vec3 look(vec2 nd){vec3 d=normalize(vec3(nd.x*th*asp,nd.y*th,-1.));float cp=cos(pitch),sp=sin(pitch),cy=cos(yaw),sy=sin(yaw);
 d=vec3(d.x,d.y*cp-d.z*sp,d.y*sp+d.z*cp);return vec3(d.x*cy-d.z*sy,d.y,d.x*sy+d.z*cy);}
void main(){vec3 d=look((vUv*2.-1.)-off*2.);vec2 uv=vec2(.5+atan(d.x,-d.z)/6.2831853,.5+asin(clamp(d.y,-1.,1.))/3.14159265);
 vec3 c=texture2D(tA,uv).rgb;if(mixB>.001)c=mix(c,texture2D(tB,uv).rgb,mixB);gl_FragColor=vec4(c,op);
 #include <colorspace_fragment>
}` });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); quad.frustumCulled = false;
  const scene = new THREE.Scene(); scene.add(quad); const cam = new THREE.Camera();
  const cache = new Map(), loader = new THREE.TextureLoader();
  // încarcă o panoramă (o singură dată); întoarce o promisiune cu textura sau null
  function load(url) {
    let e = cache.get(url); if (e) return e.p;
    e = { tex: null }; cache.set(url, e);
    e.p = new Promise(res => loader.load(url, t => { t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; e.tex = t; res(t); }, undefined, () => { cache.delete(url); res(null); }));
    return e.p;
  }
  const ready = url => { const e = cache.get(url); return e && e.tex ? e.tex : null; };
  // desenează fotografia peste ce e deja în cadru; yaw/pitch în grade (yaw 0 = centrul imaginii, plus = spre dreapta), fov vertical în grade
  function render(tex, texB, mixB, opacity, yaw, pitch, fov, asp, offX, offY) {
    U.tA.value = tex; U.tB.value = texB || tex; U.mixB.value = texB ? mixB : 0; U.op.value = opacity; U.yaw.value = yaw * Math.PI / 180; U.pitch.value = pitch * Math.PI / 180;
    U.th.value = Math.tan(fov * Math.PI / 360); U.asp.value = asp; U.off.value.set(offX, -offY);
    const ac = renderer.autoClear; renderer.autoClear = false; renderer.render(scene, cam); renderer.autoClear = ac;
  }
  return { load, ready, render };
}
