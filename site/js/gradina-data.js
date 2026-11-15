// Casele din grădina 3D. Ca să schimbi sau să adaugi o casă: pui modelul ei în js/h_<nume>.js (vezi surse/final/CASE-3D.md)
// și modifici rândul de aici. Nimic altceva nu trebuie atins.
//   cod  = modelul din catalog; suprafața, dimensiunile, împărțirea și prețul se iau din lista window.CAT a paginii
//   mod  = fișierul modelului 3D (fără .js)
//   x, z = locul casei în grădină, în metri (x = stânga/dreapta, z = spre intrare)
//   rot  = spre ce parte se uită fațada, în grade (0 = spre intrare, plus = spre dreapta)
//   nota = un rând scurt, afișat sub nume (opțional)
//   pano = fotografii reale 360° din interior (opțional); fără ele, în casă se vede macheta 3D
//   ai   = vizualizări 360° făcute cu AI pornind de la machetă, câte una pentru fiecare cameră, în ordinea camerelor din model
//          (fișierele sunt în img/gd/ai/<nume>.webp; sursele și felul în care se fac: surse/ai360/)
export const CASE = [
  { cod: 'X7', mod: 'h_x7', x: 15.5, z: 11, rot: -28, nota: 'O vezi în showroom-ul din Ciorogârla',
    // fotografii reale 360° din showroom (aceleași ca în turul 360): [numele camerei, punctul din tur]. x0, z0 = legătura dintre planul
    // turului și model (metri); ochi = înălțimea aparatului foto față de sol. Altă casă cu poze 360 primește un rând „pano” la fel.
    pano: { x0: 5.75, z0: -1.7, ochi: 2.15, pts: [['Living', 'living'], ['Masă', 'masa'], ['Bucătărie', 'blat'], ['Baie', 'baie'], ['Dormitor', 'dorm']] } },
  { cod: 'T7', mod: 'h_t7', x: -15.5, z: 13, rot: 28, ai: ['t7_baie', 't7_bucatarie', 't7_living', 't7_dormitor'] },
  { cod: 'E7', mod: 'h_e7', x: -17, z: -9, rot: 34, ai: ['e7_living', 'e7_bucatarie', 'e7_baie', 'e7_dormitor', 'e7_balcon'] },
  { cod: 'V3', mod: 'h_v3', x: 15.5, z: -10, rot: -36, ai: ['v3_dormitor', 'v3_living', 'v3_baie', 'v3_terasa'] },
  { cod: 'M9', mod: 'h_m9', x: 0, z: -31, rot: 0, ai: ['m9_dormitor', 'm9_terasa', 'm9_living', 'm9_bucatarie', 'm9_baie', 'm9_dormitor2'] },
];

// Grădina: mărimea gardului viu și locul intrării (metri)
export const GRADINA = { latime: 64, adancime: 72, centruZ: -8, intrareZ: 28 };

// Imagini realiste (făcute cu AI pornind de la machetă) pentru vederile de zi din afară: toată grădina și fiecare casă.
// Pentru fiecare vedere (all = toată grădina, apoi codul casei): [imaginea pentru ecran lat, imaginea pentru ecran înalt]; unde lipsește
// una (null), se vede macheta 3D. O imagine = [fișierul din img/gd/ai/ (fără .webp),
// stânga, dreapta, jos, sus, (opțional) fișierul imaginii de seară] = cât cuprinde ea în jurul direcției în care privește camera (în
// tangente). Fiecare imagine e făcută
// exact din locul în care stă camera în acea vedere (locurile se citesc din pagină cu __gradina.views()), deci, dacă muți o casă,
// schimbi grădina sau locul camerei, imaginile trebuie refăcute (surse/ai360/CITESTE.md). Seara se vede macheta 3D.
export const VEDERI = {
  X7: [['gr_x7', -1.068, 0.686, -0.514, 0.473], null],
};

// Rotirea realistă a unei case: cadrele unei filmări (făcute cu AI pornind de la rotirea machetei) care ocolește casa complet, pe
// cercul vederii ei din afară. Pentru fiecare casă (sau all): [pentru ecran lat, pentru ecran înalt]; unde lipsește (null), la rotire se vede
// macheta 3D. zi / seara = folderul cadrelor din img/gd/rot/ (s_000.webp … mici, pentru mișcare; l_000.webp … mari, pentru oprire);
// n = câte cadre are o rotire completă; az0 = unghiul primului cadru (grade); r = ce cuprinde un cadru: [stânga, dreapta, jos, sus].
// La „all” (toată grădina) filmarea acoperă doar un arc: arc = câte grade (de la az0), iar n = câte cadre are arcul.
// Cum se fac: surse/ai360/CITESTE.md, partea a treia.
export const ROTIRI = {};
