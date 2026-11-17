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
//   date = datele casei, pentru un model care nu e în catalogul paginii (window.CAT): s = seria, sn = numele seriei, d = dimensiuni,
//          a = m², l = împărțire, t = un rând de descriere, p = prețul cu TVA (null = „Preț pe ofertă”)
export const CASE = [
  { cod: 'X7', mod: 'h_x7', x: 15.5, z: 11, rot: -28, nota: 'O vezi în showroom-ul din Ciorogârla',
    // fotografii reale 360° din showroom (aceleași ca în turul 360): [numele camerei, punctul din tur]. x0, z0 = legătura dintre planul
    // turului și model (metri); ochi = înălțimea aparatului foto față de sol. Altă casă cu poze 360 primește un rând „pano” la fel.
    // gradina = fotografiile de zi care au, doar pentru grădină, o copie în img/gd/x7/ în care la ferestre se vede grădina în locul parcării
    // (17 nov 2026: clientul a cerut „aici aș vrea să arate din grădină… nu din parcare”; doar ce e dincolo de geam e schimbat cu AI,
    // restul e fotografia reală; cum s-au făcut: surse/ai360/x7_geamuri/). Turul 360° folosește tot fotografiile neschimbate din p360/.
    pano: { x0: 5.75, z0: -1.7, ochi: 2.15, pts: [['Living', 'living'], ['Masă', 'masa'], ['Bucătărie', 'blat'], ['Baie', 'baie'], ['Dormitor', 'dorm']],
      gradina: ['living', 'masa', 'blat', 'dorm'] } },
  { cod: 'T7', mod: 'h_t7', x: -15.5, z: 13, rot: 28, ai: ['t7_baie', 't7_bucatarie', 't7_living', 't7_dormitor'] },
  { cod: 'E7', mod: 'h_e7', x: -17, z: -9, rot: 34, ai: ['e7_living', 'e7_bucatarie', 'e7_baie', 'e7_dormitor', 'e7_balcon'] },
  { cod: 'V3', mod: 'h_v3', x: 15.5, z: -10, rot: -36, ai: ['v3_dormitor', 'v3_living', 'v3_baie', 'v3_terasa'] },
  { cod: 'M9', mod: 'h_m9', x: 0, z: -31, rot: 0, ai: ['m9_dormitor', 'm9_terasa', 'm9_living', 'm9_bucatarie', 'm9_baie', 'm9_dormitor2'] },
  // T6: prima casă comandată de client (16 nov 2026), în partea nouă a grădinii. Datele sunt din fișa furnizorului; prețul de vânzare
  // nu se știe încă (nu-l inventa). Camerele din model: Living, Bucătărie, Baie, Dormitor.
  { cod: 'T6', mod: 'h_t6', x: 15.5, z: 40, rot: -30, ai: ['t6_living', 't6_bucatarie', 't6_baie', 't6_dormitor'],
    date: { s: 'T', sn: 'Extensibilă', d: '5,85 × 4,17 × 2,55 m', a: 24, l: '1 dormitor · 1 living cu chicinetă · 1 baie',
      t: 'Casă care se extinde: se transportă îngustă (2,27 m) și se desface pe loc la 4,17 m. Living cu chicinetă, baie și dormitor.', p: null } },
  // C20: casa extensibilă de 20 ft (17 nov 2026), pe locul din stânga al părții noi. Datele sunt din oferta furnizorului; prețul de
  // vânzare nu se știe încă (nu-l inventa). Camerele din model: Living, Bucătărie, Baie, Dormitor 1, Dormitor 2.
  { cod: 'C20', mod: 'h_c20', x: -15.5, z: 40, rot: 30, ai: ['c20_living', 'c20_bucatarie', 'c20_baie', 'c20_dormitor1', 'c20_dormitor2'],
    date: { s: 'C', sn: 'Extensibilă', d: '5,9 × 6,2 × 2,48 m', a: 36.6, l: '2 dormitoare · 1 living cu bucătărie · 1 baie',
      t: 'Casă extensibilă de 20 ft: vine strânsă, cât un container, și se desface pe loc în ambele părți. Două dormitoare, living cu bucătărie și baie.', p: null } },
];

// Grădina: mărimea gardului viu și locul intrării (metri). Pe 16 nov 2026 a fost mărită spre intrare (înainte: adancime 72, centruZ −8,
// intrareZ 28), ca să încapă și casele noi; partea veche a rămas exact pe loc (vezi js/genv.js). Locuri de casă în partea nouă:
// x = ±15,5, z = 40. straturiNoi = straturi cu flori puse pe locurile încă libere: [x, z, jumătate de lățime, jumătate de adâncime, culori 0–3];
// când vine o casă pe un loc liber, stratul de acolo se scoate din listă. Dacă mai trebuie loc: se mărește iar adancime (și centruZ,
// intrareZ cu jumătate / cu totul), apoi se refac imaginile cu toată grădina.
export const GRADINA = { latime: 64, adancime: 98, centruZ: 5, intrareZ: 54, straturiNoi: [] };

// Imagini realiste (făcute cu AI pornind de la machetă) pentru vederile de zi din afară: toată grădina și fiecare casă.
// Pentru fiecare vedere (all = toată grădina, apoi codul casei): [imaginea pentru ecran lat, imaginea pentru ecran înalt]; unde lipsește
// una (null), se vede macheta 3D. O imagine = [fișierul din img/gd/ai/ (fără .webp),
// stânga, dreapta, jos, sus, (opțional) fișierul imaginii de seară] = cât cuprinde ea în jurul direcției în care privește camera (în
// tangente). Fiecare imagine e făcută
// exact din locul în care stă camera în acea vedere (locurile se citesc din pagină cu __gradina.views()), deci, dacă muți o casă,
// schimbi grădina sau locul camerei, imaginile trebuie refăcute (surse/ai360/CITESTE.md). Seara se vede macheta 3D.
export const VEDERI = {
  all: [['gr_all', -0.762, 0.762, -0.558, 0.458], ['gr_all_p', -0.34, 0.34, -0.492, 0.413]],   // grădina mărită, cu T6 și C20 (17 nov 2026)
  X7: [['gr_x7', -1.068, 0.686, -0.514, 0.473], ['gr_x7_p', -0.494, 0.309, -0.282, 0.321]],
  T7: [['gr_t7', -1.065, 0.59, -0.51, 0.421], ['gr_t7_p', -0.491, 0.284, -0.271, 0.31]],
  E7: [['gr_e7', -1.069, 0.712, -0.521, 0.481], ['gr_e7_p', -0.55, 0.337, -0.281, 0.311]],
  V3: [['gr_v3', -1.143, 0.811, -0.597, 0.503], ['gr_v3_p', -0.306, 0.306, -0.279, 0.334]],
  M9: [['gr_m9', -0.997, 0.795, -0.525, 0.483], ['gr_m9_p', -0.302, 0.302, -0.349, 0.407]],
  T6: [['gr_t6', -1.149, 0.805, -0.597, 0.503], ['gr_t6_p', -0.296, 0.296, -0.27, 0.321]],
  C20: [['gr_c20', -1.164, 0.79, -0.597, 0.503], ['gr_c20_p', -0.253, 0.253, -0.296, 0.335]],
};

// Rotirea realistă a unei case: cadrele unei filmări (făcute cu AI pornind de la rotirea machetei) care ocolește casa complet, pe
// cercul vederii ei din afară. Pentru fiecare casă (sau all): [pentru ecran lat, pentru ecran înalt]; unde lipsește (null), la rotire se vede
// macheta 3D. zi / seara = folderul cadrelor din img/gd/rot/ (s_000.webp … mici, pentru mișcare; l_000.webp … mari, pentru oprire);
// n = câte cadre are o rotire completă; az0 = unghiul primului cadru (grade); r = ce cuprinde un cadru: [stânga, dreapta, jos, sus].
// La „all” (toată grădina) filmarea acoperă doar un arc: arc = câte grade (de la az0), iar n = câte cadre are arcul.
// gol = [de la cadrul, până la cadrul]: porțiunea din care filmarea nu are imagini bune (cadrele ei sunt copii ale celor două capete);
// pagina trece repede peste ea, topind un capăt în celălalt (js/garden.js, „golul”). La X7: 50° în spatele casei; se scoate când se reface filmarea.
// Cum se fac: surse/ai360/CITESTE.md, partea a treia.
export const ROTIRI = {
  X7: [{ zi: 'x7', n: 192, nl: 96, az0: 122, r: [-1.068, 0.686, -0.514, 0.473], gol: [191, 26] }, null],
  T7: [{ zi: 't7', n: 192, nl: 96, az0: 58, r: [-1.065, 0.59, -0.51, 0.421] }, null],
  E7: [{ zi: 'e7', n: 192, nl: 96, az0: 4, r: [-1.069, 0.712, -0.521, 0.481] }, null],
  V3: [{ zi: 'v3', n: 192, nl: 96, az0: -66, r: [-1.143, 0.811, -0.597, 0.503] }, null],
  M9: [{ zi: 'm9', n: 192, nl: 96, az0: -30, r: [-0.997, 0.795, -0.525, 0.483] }, null],
  T6: [{ zi: 't6', n: 192, nl: 96, az0: -60, r: [-1.149, 0.805, -0.597, 0.503] }, null],
  C20: [{ zi: 'c20', n: 192, nl: 96, az0: 60, r: [-1.164, 0.79, -0.597, 0.503] }, null],
};

/* Planul fiecărei case (vederea „Plan”, cu acoperișul ridicat) ca imagine realistă, pe ecran lat, ziua: câte un rând pe nivel,
   în ordinea butoanelor de nivel (lvl 1, lvl 2): [fișier din img/gd/ai, stânga, dreapta, jos, sus] sau null. Vezi surse/ai360/CITESTE.md. */
export const PLANURI = {
  X7: [['pl_x7_1', -1.11, 0.588, -0.615, 0.516]],
  T7: [['pl_t7_1', -1.128, 0.551, -0.61, 0.51]],
  E7: [['pl_e7_1', -1.129, 0.561, -0.613, 0.513]],
  V3: [['pl_v3_1', -1.059, 0.67, -0.408, 0.333]],
  M9: [['pl_m9_1', -1.129, 0.561, -0.614, 0.513], ['pl_m9_2', -1.129, 0.561, -0.614, 0.513]],
  T6: [['pl_t6_1', -1.059, 0.67, -0.408, 0.333]],
  C20: [['pl_c20_1', -1.059, 0.67, -0.408, 0.333]],
};
