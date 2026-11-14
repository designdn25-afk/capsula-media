// Casele din grădina 3D. Ca să schimbi sau să adaugi o casă: pui modelul ei în js/h_<nume>.js (vezi surse/final/CASE-3D.md)
// și modifici rândul de aici. Nimic altceva nu trebuie atins.
//   cod  = modelul din catalog; suprafața, dimensiunile, împărțirea și prețul se iau din lista window.CAT a paginii
//   mod  = fișierul modelului 3D (fără .js)
//   x, z = locul casei în grădină, în metri (x = stânga/dreapta, z = spre intrare)
//   rot  = spre ce parte se uită fațada, în grade (0 = spre intrare, plus = spre dreapta)
//   nota = un rând scurt, afișat sub nume (opțional)
export const CASE = [
  { cod: 'X7', mod: 'h_x7', x: 15.5, z: 11, rot: -28, nota: 'O vezi în showroom-ul din Ciorogârla' },
  { cod: 'T7', mod: 'h_t7', x: -15.5, z: 13, rot: 28 },
  { cod: 'E7', mod: 'h_e7', x: -17, z: -9, rot: 34 },
  { cod: 'V3', mod: 'h_v3', x: 15.5, z: -10, rot: -36 },
  { cod: 'M9', mod: 'h_m9', x: 0, z: -31, rot: 0 },
];

// Grădina: mărimea gardului viu și locul intrării (metri)
export const GRADINA = { latime: 64, adancime: 72, centruZ: -8, intrareZ: 28 };
