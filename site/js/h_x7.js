// Capsula X7 pentru grădină (modelul detaliat din js/x7.js, cu aceeași interfață ca restul caselor).
import { buildX7 } from './x7.js';
export const info = { id: 'X7', w: 11.5, d: 3.4, h: 3.45 };
export function build(M) {
  const a = buildX7(M, { lamps: false });
  return { root: a.root, levels: 1, openRoof: k => a.liftRoof(k, 2.4), size: { w: 11.9, d: 5.2, h: 3.45, cz: .6 },
    rooms: [{ n: 'Living', x: -4.3, y: 1.0, z: .35, lvl: 1 }, { n: 'Bucătărie', x: -1.6, y: 1.7, z: -1.15, lvl: 1 }, { n: 'Baie', x: .4, y: 2.0, z: -.7, lvl: 1 }, { n: 'Dormitor', x: 3.9, y: 1.0, z: 0, lvl: 1 }] };
}
