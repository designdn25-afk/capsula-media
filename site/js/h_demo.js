// test: toate piesele din furn.js pe o terasă
import { THREE, box } from './kit.js'; import * as F from './furn.js';
export const info = { id: 'DEMO', w: 12, d: 6, h: 3 };
export function build(M) {
  const root = new THREE.Group(); const dk = F.deck(M, 12, 6, .3); root.add(dk);
  const put = (o, x, z, ry = 0) => { o.position.set(x, .3, z); o.rotation.y = ry; root.add(o); return o; };
  put(F.bed(M), -4.8, -1.6); put(F.sofa(M, 1.8), -2.4, -2); put(F.armchair(M), -.8, -2); put(F.tableRound(M), .4, -2); put(F.chair(M), 1.1, -2, -1.57); put(F.tableRect(M), 2.6, -2);
  put(F.coffee(M), -2.4, -.9); put(F.kitchen(M, 1.8, true), 4.8, -2.4); put(F.wardrobe(M), -5, 1.6); put(F.desk(M), -3.4, 1.6); put(F.shower(M), -1.8, 1.6); put(F.wc(M), -.6, 1.6); put(F.vanity(M), .5, 1.6);
  put(F.curtain(M), 1.6, 1.6); put(F.rug(M), 3, .4); put(F.railing(M, 3, 1, true), 4, 2.9); put(F.railing(M, 3, 1, false), 0, 2.9); put(F.lampPost(M), 5.6, 1.8);
  const gz = F.glazing(M, 2.4, 2.2, 3); gz.position.set(2.8, 1.4, 1.8); root.add(gz);
  const st = F.steps(M, 1.2, 2, .15, .3); st.position.set(-4, 0, 3.3); root.add(st);
  root.add(F.wallBox(M, .08, 2, 2.4).translateX(1.5).translateY(.3).translateZ(-1.9));
  return { root, levels: 1, openRoof() {}, rooms: [], size: { w: 12, d: 6, h: 3 } };
}
