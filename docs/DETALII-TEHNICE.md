# Detalii tehnice și istoric

Citește secțiunea potrivită înainte să lucrezi la hero, la turul 360 sau la imagini.
Sursa de adevăr este întotdeauna `site/home.html`: tot CSS-ul și JavaScript-ul sunt inline acolo.

## 1. Tema albă
- Blocul `/* ===================== TEMA ALBĂ ===================== */` din `<style>` suprascrie tema veche (închisă).
- Culori: `--bg:#ffffff`, `--bg2:#f4f5f7`, `--ink:#0e1116`, `--mute:#5d6572`, `--accent:#d4a24c`, `--accent-ink:#9a6c1c`.
- Fonturi (Google Fonts): `--display: 'Unbounded'` pentru titluri, `--body: 'Manrope'` pentru text.
- `complet.html` / `index.html` au aceeași temă albă: blocul „TEMA ALBĂ” copiat din home.html (fără regulile care schimbă hero-ul: `.stage3d{height:100vh}` și ascunderea `#rl1…#rl5`), plus regulile formularului alb (care în home.html stau la finalul stilului Pannellum). Dacă schimbi tema în home.html, copiaz-o și aici.

## 2. Secțiunile din home.html (în ordine)
| id | ce conține |
|---|---|
| `bld` | hero Varianta 2: construcția ca un video |
| `top` | hero Varianta 1: poza reală cu efect 3D (`section.stage3d`) |
| `caracteristici` | 4 puncte: Spațiu 36,5 m² · Structură oțel și aluminiu · Geam triplu LOW-E · Smart home |
| `tur` | turul virtual 360° |
| `model` | fișa modelului X7 (39.500 €, rate TBI) |
| `la-comanda` | caruselul cu cele 20 de modele la comandă |
| `galerie` | „De ce noi”: capsule reale din showroom |
| `mai-mult` | carduri care duc la complet.html (configurator, rate, investitori, specificații, legal, FAQ) |
| `contact` | adresa showroom-ului, harta, formularul care trimite pe WhatsApp |

`complet.html` are secțiunile: top, idee, model, la-comanda, compartimentare, interior, configurator, investitori,
galerie, cum-cumperi, livrare, finantare, despre, specificatii, legal, incredere, faq, contact.

## 3. Comutatorul Varianta 1 / Varianta 2
- Markup: `<div class="vsw" id="vsw"><button data-v="1">…</button><button data-v="2">…</button></div>`.
- `home.html` are `<body class="v2" data-var="2">`. `home_v1.html` are `<body data-var="1">` (generat de `tools/make_v1.py`).
- `#v1` / `#v2` în adresă alege varianta. Clasa `v2` pe `<body>` decide ce hero se vede:
  `body.v2 .stage3d{display:none}` și `body:not(.v2) .bld{display:none}`.
- La comutare pagina urcă sus, iar V2 pornește de la început (`window.bldRestart()`).

## 4. Hero Varianta 1 (`#top` → `#rl0 .h3d`)
**Straturi** (de jos în sus):
- `.h3-bg`: imaginea din spate, foarte blurată, umple marginile când straturile se mișcă.
- `.h3-far`: cerul și fundalul fără capsulă (capsula a fost ștearsă din acest strat).
- `.h3-near`: capsula și tot solul (opac); deasupra are `.h3-sweep` (luciul care trece peste geam, prin mască)
  și `.h3-flare` (strălucirea soarelui în geam).
- `.h3-vig`: umbrirea care face textul lizibil.

**Mișcarea**: straturile au `inset:-4%`. Un script mișcă `far` și `near` diferit după mouse sau giroscop (parallax),
plus o mișcare lentă continuă. La încărcare are loc o apropiere de 3,4 s. Pe ecrane ≤800 px scara de bază e 0,96.
Cu `prefers-reduced-motion` mișcarea e oprită.

**Imaginile** (alese prin `<picture>` cu `<source media="(max-aspect-ratio: 5/4)">`):
| fișier | mărime | când | ce este |
|---|---|---|---|
| `img/hero_near_w.webp`, `img/hero_far_w.webp` | 2149×2240 | ecrane late | compoziția APROBATĂ de client: fotografia, plus 700 px extinși în stânga |
| `img/hero_near_t.webp`, `img/hero_far_t.webp` | 1417×2240 | ecrane înalte sau pătrate | doar fotografia reală |
| `img/hero_glass.png` / `img/hero_glass_t.png` | jumătate de rezoluție | – | masca geamurilor pentru luciu |

**Încadrarea** (`object-position`, iar masca luciului folosește aceleași valori):
- late: `100% 42%` pe calculator, `66% 38%` la ≤800 px (blocul „hero 3D din fotografia reală”);
- înalte: `12% 46%` (blocul „hero V1: pe ecrane late rămâne compoziția aprobată…”), ca să se vadă colțul din față al capsulei.

**Strălucirea soarelui**: `sunOf()` din JS dă poziția relativă a reflexiei în imagine:
late `[(700+740)/2149, (1037-180)/2240]`, înalte `[(740-32)/1417, (1037-180)/2240]`.
Dacă schimbi dimensiunile imaginilor, actualizează `sunOf()`, măștile și `object-position`.

**Ce s-a făcut pe 22 oct 2026** (după ce clientul a zis că în panoul îngust imaginea arată „foarte nasol, mai ales jos”):
- pe ecranele înalte sau pătrate se vede doar fotografia reală, fără partea extinsă din stânga, care avea o îmbinare;
- de pe pavaj au fost scoase cablul negru (care părea o dâră de ulei) și o bucată albă de gunoi, cu
  `surse/hero-v1/shiftfill2.py`, care copiază textura pavajului dintr-un loc vecin și taie de-a lungul unei linii invizibile;
- dunga neagră de 32 px din marginea stângă a fotografiei a fost tăiată;
- în imaginea lată tot solul a trecut pe stratul `near`, ca pavajul să nu se mai dubleze la mișcare.
  În repaus imaginea a rămas identică cu cea aprobată.
- Originalele aprobate (cu cablu) sunt păstrate în `surse/hero-v1/hero_*_aprobat_cu_cablu.webp`.
  `surse/hero-v1/build_layers.py` arată cum au fost construite straturile; căile din el trebuie adaptate.

## 5. Hero Varianta 2 (`#bld`) — construcția ca un video
**Imaginile** (toate aliniate pe aceeași fotografie, 2149 px lățime):
`img/x7s_lot.webp` (terenul gol) → `img/x7s_frame.webp` (structura din oțel) → `img/x7s_day.webp` (capsula reală, ziua)
→ `img/x7s_night.webp` (seara). Au fost generate cu AI în YouArt, pornind de la fotografia reală extinsă (`surse/hero-v2/day_2149.png`),
apoi aliniate cu `surse/hero-v2/align.py` (ECC afin pe hărți de contururi).

**Cronologia** (secunde, în scriptul „hero varianta 2”):
- titlul de intro dispare între 2,4 și 3,1 s;
- etapele încep la `S0=[2.8, 4.6, 6.8, 9.0, 10.6, 12.9]`; `FIN=13.0`, `END=14.2`;
- structura apare între 4,0 și 5,3 s; panourile și vitrajul se „construiesc” de jos în sus între 6,6 și 8,7 s
  (mască cu variabila `--r`); seara vine între 10,3 și 11,9 s.
- Timpul curge doar cât hero-ul e vizibil. Pornește după ce s-au încărcat imaginile (cel mult 6 s așteptare).
- „Sari peste ›” sare la final; „↺ Vezi din nou” repornește (`window.bldRestart()`). Cu `prefers-reduced-motion` arată direct finalul.
- Etichetele etapelor (vectorul `ST`): Terenul · Structura din oțel · Panouri și vitraj · Capsula finalizată · Seara, acasă.
- Pe ecrane ≤800 px imaginea stă sus (de la 64 px, înălțime 50svh, `object-position:80% 50%`), iar textele sunt dedesubt.

## 6. Turul 360 (`#tur`)
- Motor: Pannellum (commit 99f4afd, compilat din sursă), inclus inline în home.html (`<style id="pnlm-css">` și scriptul lui).
- Datele sunt în scriptul „tur virtual interior X7”:
  - `SEQ`: ext, prag, intrare, living, masa, mijloc, canapea, vitraj, colt, blat, hol, baie, dormu, dorm, dormf;
  - `N`: pentru fiecare punct, `n` (nume), `H` (corecția direcției), `p` (poziția pe planul mic), `v` (privirea inițială [yaw, pitch]),
    `txt`, `f` (dotări), `tags` (etichete [yaw, pitch, text, parte]) și `links` (săgețile de pe podea [punct, yaw, pitch]);
  - `NIGHT`: living → living_n, masa → masa_n, baie → baie_n, dorm → dorm_n (butonul „☾ Seara”).
- Fișiere: `p360/<punct>_s.webp`, `_m`, `_l`, `_x` (de la mic la foarte mare). Se încarcă întâi varianta mică, apoi
  cele mari în fundal (fetch → blob). `p360/t_<punct>.jpg` sunt miniaturile.
- Interfața: card „Începe turul”, numele camerei, Zi/Seara, ecran complet, plan mic, săgeți, bandă cu miniaturi,
  panou cu descriere și „▶ Turul automat”. Trecerea între puncte folosește o captură a imaginii care se estompează.
- Fotografiile 360 originale sunt în release-ul GitHub https://github.com/designdn25-afk/capsula-media/releases/tag/v1
  (fișiere `IMG_2026100x_HHMMSS_00_NNN.jpg`). `surse/tur360/proc.py` leagă fiecare punct de fișierul original (dicționarul `R`),
  pune sigla Capsula România jos (nadir), șterge trepiedul și scoate cele 4 mărimi.
  `surse/tur360/t360.*` sunt o copie mai veche a codului; versiunea actuală e cea din home.html.

## 7. Caruselul „Capsule la comandă” (`#la-comanda`)
- 20 de modele: X7, X5, M9, M7, V11, V9, V8, V7, V6, V5, V3, V2, PX7, PX5, PX3, E7, E5, E3, T7, T5.
  Doar X7 are preț afișat (39.500 €). Imaginile sunt randări din catalogul producătorului, incluse direct în pagină (data URI).
- A fost generat inițial cu `surse/catalog/cat_build.py` din `surse/catalog/mod/*.jpg`. Versiunea actuală e cea din home.html.

## 8. Resurse externe
- GitHub (media): https://github.com/designdn25-afk/capsula-media (release `v1`: fotografii 360, poze și video).
- YouArt: proiectul „Capsula X7 — construcție scroll (hero)”, id `12fe7f23-4b67-452b-ad0d-32b03df472b6`.
  Creditele erau 0 la 22 oct 2026; pentru imagini AI noi trebuie reîncărcat contul.
- Site-ul actual: https://casecapsula.ro (sursa textelor; EN/BG și PDF-urile trimit acolo).
- Datele structurate (JSON-LD) din `<head>` folosesc o imagine de pe casecapsula.ro. Pentru SEO e normal.

## 9. Istoric pe scurt
1. Pagina principală nouă, cu tot conținutul de pe casecapsula.ro; pagina lungă `complet.html`.
2. Turul 360 refăcut de la zero din pozele 360 de pe GitHub: 15 puncte, zi și seară, încărcare progresivă HD.
   S-a scos un deget care se vedea la început. Apoi clientul a pus turul pe pauză.
3. Hero V1: capsula reală pe exterior, cu efect 3D. Partea din stânga, care era blurată, a fost extinsă.
   O propunere care schimba tot a fost refuzată și s-a revenit la varianta inițială. Petele de pe pavaj, care păreau ulei, au fost curățate.
   Clientul a aprobat varianta și a cerut să fie salvată (`versiuni/v1-hero-3d/`).
4. Interfața a trecut pe alb, „Geam triplu LOW-E” a fost pus peste tot, iar secțiunea „De la prima vizită la casa ta” a fost scoasă.
5. Hero V2: construcția „de la schiță”, după un video de referință al clientului. Prima variantă (desen) a fost refuzată,
   apoi a fost refăcută cu imagini AI realiste și transformată într-un „video” care rulează singur, fără scroll.
6. Demo-ul a fost publicat cu două linkuri publice (V1 și V2).
7. 22 oct 2026: V1 a fost curățat pe telefon și în panoul îngust (vezi secțiunea 4), salvat în `versiuni/v1-hero-curat/`.
   Apoi proiectul a fost mutat în Claude Code.

## 10. Unelte folosite
- Python 3 cu `numpy`, `opencv-python`, `pillow`, `scipy` pentru scripturile din `surse/`.
- Node + Playwright (Chromium) pentru `tools/test_pagini.js`.
- Imaginile se salvează în WebP (calitate 82–86, `method=6`). PNG doar pentru măști.
