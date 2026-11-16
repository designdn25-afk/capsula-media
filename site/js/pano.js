// Fotografii reale 360° (panorame echirectangulare) desenate peste scena 3D, pentru interiorul caselor care au așa ceva, și
// imagini obișnuite pentru vederile din afară. Se folosește din js/garden.js: imaginea apare lin peste macheta 3D, aliniată cu ea.
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
  const cache = new Map(), loader = new THREE.TextureLoader(), order = [];   // order = cele folosite recent (se țin cel mult 3 în memorie)
  const touch = url => { const i = order.indexOf(url); if (i >= 0) order.splice(i, 1); order.push(url); };
  const trim = () => { while (order.length > 3) { const u = order.shift(), e = cache.get(u); if (e && e.tex && e.tex !== U.tA.value) { e.tex.dispose(); cache.delete(u); } else if (e && e.tex) { order.push(u); break; } } };
  // încarcă o panoramă (o singură dată); întoarce o promisiune cu textura sau null
  // flat = imagine obișnuită (nu 360°): se arată de obicei micșorată, deci primește și variantele mici (mipmap)
  // Imaginile obișnuite (mari, 4K) se despachetează în afara firului principal (ImageBitmap) și se urcă pe placa video imediat ce
  // sosesc, nu în clipa în care apar pe ecran: altfel pagina s-ar poticni o fracțiune de secundă la fiecare schimbare de vedere.
  const canBitmap = typeof createImageBitmap === 'function' && typeof fetch === 'function';
  function load(url, flat) {
    let e = cache.get(url); if (e) return e.p;
    e = { tex: null }; cache.set(url, e);
    const setup = t => { t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.LinearFilter;
      if (flat) { t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy()); }
      else { t.wrapS = THREE.RepeatWrapping; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; }
      e.tex = t; touch(url); trim(); return t; };
    const classic = () => new Promise(res => loader.load(url, t => res(setup(t)), undefined, () => { cache.delete(url); res(null); }));
    e.p = flat && canBitmap
      ? fetch(url).then(r => (r.ok ? r.blob() : Promise.reject(new Error('img')))).then(b => createImageBitmap(b)).then(bm => {
          const t = new THREE.Texture(bm); t.flipY = false; t.userData.fy = -1; t.needsUpdate = true; setup(t);   // (rândul de sus al imaginii e primul: se întoarce la desen, vezi fy)
          try { renderer.initTexture(t); if (bm.close) bm.close(); } catch (_) {}   // e deja pe placa video: copia din memorie nu mai trebuie
          return t; }).catch(classic)
      : classic();
    return e.p;
  }
  const ready = url => { const e = cache.get(url); if (e && e.tex) { touch(url); return e.tex; } return null; };
  // desenează fotografia peste ce e deja în cadru; yaw/pitch în grade (yaw 0 = centrul imaginii, plus = spre dreapta), fov vertical în grade
  function render(tex, texB, mixB, opacity, yaw, pitch, fov, asp, offX, offY) {
    U.tA.value = tex; U.tB.value = texB || tex; U.mixB.value = texB ? mixB : 0; U.op.value = opacity; U.yaw.value = yaw * Math.PI / 180; U.pitch.value = pitch * Math.PI / 180;
    U.th.value = Math.tan(fov * Math.PI / 360); U.asp.value = asp; U.off.value.set(offX, -offY);
    const ac = renderer.autoClear; renderer.autoClear = false; renderer.render(scene, cam); renderer.autoClear = ac;
  }
  /* Imagine obișnuită (o „fotografie” făcută din locul în care stă camera, privind în aceeași direcție), așezată exact peste scena 3D:
     r = [stânga, dreapta, jos, sus] = cât cuprinde ea, în tangente față de direcția privirii. fov, asp, offX, offY = camera de acum.
     Unde imaginea nu ajunge (ecran mai lat sau mai înalt decât ea), se stinge lin și rămâne scena 3D de dedesubt. */
  const UF = { tA: { value: null }, fy: { value: 1 }, op: { value: 0 }, th: { value: 1 }, asp: { value: 1 }, off: { value: new THREE.Vector2() }, c: { value: new THREE.Vector2() }, hf: { value: new THREE.Vector2(1, 1) } };
  const matF = new THREE.ShaderMaterial({ uniforms: UF, transparent: true, depthTest: false, depthWrite: false, toneMapped: false,
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader: `uniform sampler2D tA;uniform float op,th,asp,fy;uniform vec2 off,c,hf;varying vec2 vUv;
void main(){vec2 nd=(vUv*2.-1.)-off*2.;vec2 q=(vec2(nd.x*th*asp,nd.y*th)-c)/hf;vec2 e=smoothstep(vec2(1.),vec2(.94),abs(q));
 gl_FragColor=vec4(texture2D(tA,vec2(q.x*.5+.5,.5+q.y*.5*fy)).rgb,op*e.x*e.y);
 #include <colorspace_fragment>
}` });
  const quadF = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), matF); quadF.frustumCulled = false; const sceneF = new THREE.Scene(); sceneF.add(quadF);
  function renderFlat(tex, opacity, r, fov, asp, offX, offY) {
    UF.tA.value = tex; UF.fy.value = (tex.userData && tex.userData.fy) || 1; UF.op.value = opacity; UF.th.value = Math.tan(fov * Math.PI / 360); UF.asp.value = asp; UF.off.value.set(offX, -offY);
    UF.c.value.set((r[0] + r[1]) / 2, (r[2] + r[3]) / 2); UF.hf.value.set((r[1] - r[0]) / 2, (r[3] - r[2]) / 2);
    const ac = renderer.autoClear; renderer.autoClear = false; renderer.render(sceneF, cam); renderer.autoClear = ac;
  }
  // imaginea acoperă tot ecranul? (atunci scena 3D de dedesubt nu mai trebuie desenată)
  const covers = (r, fov, asp, offX, offY) => { const th = Math.tan(fov * Math.PI / 360), cx = (r[0] + r[1]) / 2, cy = (r[2] + r[3]) / 2, hx = (r[1] - r[0]) / 2 * .94, hy = (r[3] - r[2]) / 2 * .94;
    return (-1 - 2 * offX) * th * asp >= cx - hx && (1 - 2 * offX) * th * asp <= cx + hx && (-1 + 2 * offY) * th >= cy - hy && (1 + 2 * offY) * th <= cy + hy; };
  return { load, ready, render, renderFlat, covers };
}
