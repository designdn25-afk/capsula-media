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

// Imagini 360° realiste (făcute cu AI pornind de la machetă) pentru vederile din afară: toată grădina și fiecare casă din față.
// Pentru fiecare: [imaginea pe ecran lat, imaginea pe ecran înalt] (fișiere din img/gd/ai/, fără .webp). Se arată doar ziua.
// Locurile din care sunt făcute se citesc din pagină cu __gradina.views(); dacă muți o casă sau grădina, imaginile trebuie refăcute.
export const VEDERI = {};
