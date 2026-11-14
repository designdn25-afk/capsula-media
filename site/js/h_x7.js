// Capsula X7 pentru grădina cu case: același model ca la deschidere (js/x7.js), cu acoperișul pe un set propriu de materiale.
import { buildX7 } from './x7.js';
import { clamp, ease } from './kit.js';
import { fadeSet } from './furn.js';

export const info = { id: 'X7', w: 11.5, d: 3.4, h: 3.45 };

export function build(M) {
  const R = fadeSet(M), MX = Object.create(M); ['roof', 'ceil', 'ledIn', 'skyglass'].forEach(k => { MX[k] = R[k]; }); MX.skyframe = R.frame;
  const a = buildX7(MX, { lamps: false }), roof = a.parts.roof; let sh = true;
  return {
    root: a.root, levels: 1,
    openRoof(k) { k = clamp(k); a._lift = ease(k) * 2.4; a._lay(); R.fade(clamp(k * 1.3)); roof.visible = k < .77; const s = k < .3; if (s !== sh) { sh = s; roof.children.forEach(c => { if (c.isMesh) c.castShadow = s; }); } },
    size: { w: 11.9, d: 5.2, h: 3.45, cz: .6 },
    rooms: [{ n: 'Living', x: 4.3, y: 1.0, z: .35, lvl: 1 }, { n: 'Bucătărie', x: 1.6, y: 1.7, z: -1.15, lvl: 1 }, { n: 'Baie', x: -.4, y: 2.0, z: -.7, lvl: 1 }, { n: 'Dormitor', x: -3.9, y: 1.0, z: 0, lvl: 1 }],
  };
}
