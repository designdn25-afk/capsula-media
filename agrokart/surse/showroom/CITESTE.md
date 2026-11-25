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
- **Prin ușa camerei excavatoarelor** generatorul lăsase tractoarele „pătrățoase” (clientul a trimis captură). Reparat fără credite
  cu `tools/fixusa.py`: în golul ușii din s4 e pusă vederea reală a halei, luată din s3 privind înapoi. Se rulează o singură dată,
  pe imaginea proaspăt generată (după `fixsemne.py`); rezultatul se publică sub nume nou (`IMG` în `showroom.py`, acum `s4_v2`).
- **Oprirea a doua fără excavatoare** (clientul: „uite aici se vede și excavatorul”): `tools/fixhala2.py` pune în partea din depărtare a
  lui s2 ce se vede din s3 privind înainte (tractoarele mari, peretele cu ușă, camera galbenă). Folosit cu
  `POLI='[(1545,790),(2530,790),(2530,945),(2470,965),(2470,1170),(2105,1170),(2105,1118),(1985,1118),(1985,1170),(1800,1170),(1800,1118),(1716,1118),(1716,992),(1565,945),(1545,935)]'`
  și `PASTREAZA='[[(1776,1028),(1920,1082)],[(2181,1030),(2325,1082)],[(1838,1082),(1853,1176)],[(2245,1082),(2260,1176)]]'`; rezultatul e `s2_v2.jpg`.
- **Butonul X** (sus, dreapta) scoate vizitatorul din showroom la prima pagină (clientul l-a cerut după ce ChatGPT a pus showroomul pe
  site: nu avea cum să se întoarcă la meniu).
- Clientul i-a dat lui ChatGPT arhiva showroomului (folderul `showroom/` de sine stătător) și e pus la
  https://agrokart-karl-utilaje.appwithchat.chatgpt.site/showroom/ . La fiecare schimbare primește o arhivă mică de actualizare + textul.
