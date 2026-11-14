# Vizualizări 360° „reale” ale interiorului, făcute cu AI

Clientul a cerut (14 nov 2026) ca interiorul caselor din grădină să arate real, „ca în al doilea filmuleț” (o animație 3D simplă
trecută printr-un generator cu inteligență artificială). Aici sunt sursele și pașii. X7 nu e aici: are fotografii reale.

## Ce e în folder
- `<casă>_<cameră>_src.jpg` — imaginea 360° (4096×2048) a machetei, din punctul în care stă vizitatorul în camera respectivă.
- `captura-360.html` — pagina care scoate o astfel de imagine (copie a `site/_t_pano.html`; se pune în `site/` ca să meargă).
- `cap360.js` — o deschide cu Playwright și salvează imaginea: `node cap360.js iesire.jpg 4096 "x=..&y=..&z=..&face=1536"`.
- `fix360.py` — aduce imaginea primită de la generator la 4096×2048 și potrivește marginile din stânga și din dreapta.

## Pașii
1. Punctele (în coordonatele lumii) se citesc din pagină: `__gradina.H[i].walk.pts` după ce intri în casa `i`.
   Imaginea se scoate cu centrul spre −Z și fără rotire, de aceea în `garden.js` aceste puncte au `H = −rotirea casei`.
2. Imaginea-sursă trebuie să fie la o adresă publică (a fost urcată temporar pe ramura `gh-pages`, în `img/gd/src/`; următoarea
   publicare a site-ului o șterge de acolo).
3. În ElevenLabs (conectorul din Claude): se atașează imaginea ca referință și se rulează un nod „image-generation” cu modelul
   `gemini-3-pro-image`, `aspect_ratio: auto`, `resolution: 4K`, o singură variantă (~2.270 de credite, ~0,45 $ pe imagine).
   Cererea: „fă din această machetă 3D o fotografie realistă; e o panoramă echirectangulară 360°: păstrează proiecția, poziția
   camerei, orizontul, geometria, golurile și mobila în aceleași locuri; marginile din stânga și din dreapta trebuie să se lege”
   + descrierea camerei (ce se vede în machetă) + „fără oameni, text, logo-uri sau mobilă în plus”.
4. Rezultatul vine 16:9 (5504×3072); `fix360.py` îl readuce la 2:1 și netezește cusătura. Fișierul final: `site/img/gd/ai/<nume>.webp`.
5. Numele se trec în `site/js/gradina-data.js`, în lista `ai` a casei, **în ordinea camerelor din model**.

Descărcarea rezultatelor se face de pe `elevenlabsusercontent.com`; mediul de lucru „capsula-media” are această adresă permisă.
Seara, în casele cu imagini AI se vede macheta 3D (imaginile sunt doar de zi).
