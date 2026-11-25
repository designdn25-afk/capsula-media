# Showroomul virtual 360° (demo/showroom.html) — 25 nov 2026

Clientul: „vreau să-mi faci showroom ca la Matterport… tractoarele și excavatoarele să arate real… cu puncte la fiecare (punct la
motor = specificațiile)… în capăt sigla AgroKart”, apoi „tractoarele separat și excavatoarele separat… poate în altă cameră”.

- `hall.html` = schița 3D a halei (16 × 46 m): 10 tractoare pe două șiruri, un perete cu ușă largă la z = 32, apoi camera mini
  excavatoarelor (podea galbenă, KN-25 pe podium, peretele verde cu sigla). `cap.js` + `stitch.py` scot imaginea 360° a unei opriri
  (`node cap.js '[[x,1.6,z]]' 1536`, `python3 stitch.py 1 4096`; server pe 8791 în acest dosar, cu three.module.min.js și logo.png alături).
- Fiecare schiță a fost transformată în imagine reală cu `gemini-3-pro-image` (4K, `aspect_ratio: auto`; iese 5504 × 3072 și se
  micșorează la 4096 × 2048), cu pozele utilajelor de aproape ca referință. Cost: 1.817 + 455 de credite pe fiecare imagine legată
  (3.600–4.500 pe oprire). Flux ElevenLabs `3KfWQtAo0iV2Xm39L16u`, nodurile „showroom …”.
- Opriri: s1 (z 8), s2 (z 20), s3 (z 25,7), s4 (z 38,5, camera excavatoarelor). Punctele se calculează din așezarea din schiță
  (`tools/showroom.py`); la s4 generatorul a mutat utilajele și a rotit imaginea (a fost adusă la loc cu 87°), deci punctele ei
  sunt puse de mână (`DE_MANA`).
- Generatorul scrie greșit unele plăcuțe și sigla văzută de departe: se rescriu cu `tools/fixsemne.py` (listele folosite sunt în
  istoricul din CLAUDE.md al proiectului cu capsule / în acest fișier, mai jos).
  s1: `[[1917,1017,1975,1039,"TE 1004"],[2122,1017,2194,1039,"TE 704"],[1972,1014,2009,1025,""],[2091,1014,2119,1025,""],[1780,1034,1916,1071,"TYE 604"],[2183,1034,2317,1071,"TYE 504"],[1994,941,2103,1022,"LOGO"]]`
  s2: `[[1918,1019,1967,1038,"TDF 1604"],[2121,1019,2183,1038,"TB 1404"],[1975,1013,2012,1025,""],[2092,1013,2121,1025,""],[2187,1036,2321,1076,"TE 1004 CABINA"],[2000,911,2100,930,"AGROKART"],[1996,940,2104,1012,"LOGO"]]`
- **Ce a rămas mai slab:** în s2 (făcută înainte de peretele despărțitor) se văd în depărtare mini excavatoare în hala tractoarelor
  și nu se vede peretele cu ușă; în camera excavatoarelor apare un al patrulea excavator, fără nume (inventat de generator).
  Se repară refăcând s2 și s4 (~4.000 de credite fiecare). Nu există oprire la intrare (schița `src_0` există, nod pregătit „oprire 0”).
- Imaginile sunt făcute cu AI: mențiunea de jos („Showroom virtual · imagini realizate cu AI, orientative”) rămâne.
