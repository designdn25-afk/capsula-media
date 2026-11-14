# Casele 3D din grădină — cum se construiește un model

Fiecare casă model din secțiunea „Grădina cu case” este un fișier `site/js/h_<id>.js` (de exemplu `h_v3.js`), scris cu three.js
(local, în `site/vendor/`). Stilul este de **machetă de arhitectură**: forme curate, alb cald, geam albastru-reflectorizant,
rame închise la culoare, fără texturi fotografice. Modelul complet de referință este capsula X7: `site/js/x7.js` (+ `h_x7.js`).

## Interfața (obligatorie)

```js
import { THREE, box, perimeter, sweep, cap, arcTop, arcBottom, wrapPoly, wrapLine, grow, clamp, lerp, ease } from './kit.js';
import * as F from './furn.js';

export const info = { id: 'V3', w: 6.4, d: 3.3, h: 3.3 };      // dimensiunile din catalog (m): lungime, lățime, înălțime

export function build(M) {            // M = materialele comune (kit.materials() + x7Materials + furn.houseMaterials)
  return {
    root,                             // THREE.Group. Originea: la sol (y = 0), în centrul casei. X = lungimea, fațada principală spre +Z
    levels: 1,                        // 1 = parter; 2 = parter + etaj
    openRoof(k),                      // k de la 0 la `levels`: 0 = casa întreagă; 1 = acoperișul (și tavanul) ridicat și dispărut,
                                      //   se vede interiorul nivelului de sus; 2 (doar la case cu etaj) = dispare și etajul, se vede parterul
    rooms: [{ n: 'Living', x, y, z, lvl: 1 }],   // puncte pentru etichete (coordonate locale); lvl = la ce k se vede camera (1 sau 2)
    size: { w, d, h, cz },            // cutia întregului ansamblu (cu terasă și trepte): lățime pe X, adâncime pe Z, înălțime; cz = centrul pe Z
  };
}
```

## Reguli

1. **Unități: metri.** Respectă dimensiunile din catalog (`info`). Pardoseala interioară e la ~0,45–0,7 m deasupra solului
   (casele stau pe picioare / pe o terasă), cu trepte la intrare.
2. **Materiale comune, neschimbate** (ca seara să se aprindă toate casele odată, din `gscene.js`):
   - `M.shell` panouri albe · `M.seam` rosturi · `M.frame` rame închise · `M.led` bandă arămie pe conturul geamurilor (luminează seara)
   - `M.glass` geam: are `vertexColors`, deci folosește **`F.pane(w,h,M.glass)`** / **`F.glazing(M,w,h,n)`** pentru geam plan sau
     `wrapPoly(per, poligon, { off: 0, ys: [...], color: fn })` pentru geam curbat (vezi `x7.js`). Geometria de geam fără culori pe vârfuri iese neagră.
   - interior: `M.inner` pereți (luminează cald seara) · `M.ceil` tavan · `M.floor` pardoseală · `M.ledIn` benzi LED în tavan
   - `M.wood`, `M.steel`, `M.dark`, `M.white`, `M.fabric`, `M.sofa`, `M.green`, `M.black`, `M.stone`, `M.clad` (lemn pe fațadă),
     `M.roofDark`, `M.stoneWall`, `M.orange`, `M.lamp` (lămpi exterioare, luminează seara), `M.railglass`, `M.showerglass`
   - Nu schimba culorile materialelor comune. Dacă ai nevoie de altă culoare, fă un material nou, local.
   - Fără `PointLight`/`SpotLight` în case (sunt prea multe case în scenă).
3. **Acoperișul**: toate piesele lui (și tavanul) stau într-un grup separat, cu materiale **clonate local**
   (`M.shell.clone()` etc.), ca să le poți face transparente: în `openRoof(k)` grupul urcă (`position.y = ease(k) * ~2.2`)
   și se stinge (`opacity`), apoi `visible = false`. Pune `material.transparent = true` doar cât k > 0.
4. **Interiorul** trebuie să se vadă de sus când acoperișul e ridicat: pardoseală, pereți despărțitori (`F.wallBox`), mobilier din
   `furn.js` (`bed`, `sofa`, `armchair`, `tableRound`, `tableRect`, `coffee`, `chair`, `kitchen`, `wardrobe`, `desk`, `rug`, `shower`,
   `wc`, `vanity`, `curtain`). Împărțirea urmează camerele din catalog; e o **schemă orientativă**, nu inventa dotări care nu apar
   în imaginile din catalog. Pereții exteriori au grosime vizibilă de sus (un inel închis la culoare, `M.cut`).
5. **Exterior**: terasă (`F.deck`), trepte (`F.steps`), balustradă (`F.railing`) acolo unde modelul are balcon.
6. **Umbre**: piesele mari au `castShadow = true` și `receiveShadow = true`. Geamurile nu aruncă umbră.
7. **Buget**: cel mult ~200 de mesh-uri și ~25.000 de triunghiuri pe casă. Fără texturi încărcate, fără alte biblioteci.
8. Comentarii scurte în română. Cod curat, fără `console.log`.

## Testare

Serverul local servește `site/` pe portul 8765 (`cd site && python3 -m http.server 8765`).
Pagina de test: `http://localhost:8765/_t_house.html?m=<id cu litere mici>&az=-30&el=14&dist=30&t=12.5&roof=0`
(`az` = unghiul în jurul casei, 0 = din față; `el` = înălțimea camerei; `t` = ora: 12.5 zi, 17.2 apus, 19.8 seară; `roof` = 0…levels).

Capturi (planșă cu mai multe unghiuri):
```
export NODE_PATH=$(npm root -g)
cd /tmp/claude-0/-home-user-capsula-media/c0f66d24-07b5-53c3-9b3d-a7a84716db39/scratchpad/v3
PAGE=_t_house.html node shot3d.js <iesire>.jpg 1280 800 "m=v3&az=-30&el=12&dist=22" "m=v3&az=40&el=20&dist=22" "m=v3&az=-20&el=55&dist=18&roof=1" "m=v3&az=-28&el=8&dist=20&t=19.8"
```
Scrie planșele într-un folder al tău din scratchpad (de ex. `…/scratchpad/v3/h_v3/`). Uită-te la ele (micșorate) și compară cu imaginea din catalog.
