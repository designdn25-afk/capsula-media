# Filmul de la deschidere (site/img/st/formare-*.mp4) — 26 nov 2026

Cum se reface (fără credite):
1. Cadrele mari (1920 × 1080, 648) se scot din filmul comprimat al deschiderii vechi: fișierele `site/img/st/film/v/h_NN.bin`
   („CPV1”, n, mărimi, cadre AV1) se pun într-un `.ivf` și se desfac cu ffmpeg în `fr/%04d.jpg` (`-q:v 2`).
2. `python3 face.py` (în folderul cu `fr/` și `out/`): ordinea e 400→217 (de sus, fără acoperiș, acoperișul coboară), 216→0 (ocolul de
   dimineață, invers), topire în seară (502→647), stingere în albastrul planului. Primele 84 de cadre: schița (contururile cadrului
   real, albe pe albastru cu caroiaj) e „umplută” de imaginea reală de un front care înaintează din stânga-jos.
3. `ffmpeg -framerate 30 -i out/%04d.jpg -c:v libx264 -preset slow -preset slower -crf 30 -maxrate 2300k -bufsize 4600k -g 60 -pix_fmt yuv420p -movflags +faststart -an formare2-1080.mp4`
   și la fel cu `-vf scale=1280:720 -maxrate 1000k -bufsize 2000k` pentru `formare2-720.mp4`. Imaginea de așteptare: `out/0395.jpg`.
4. Rândul care se schimbă odată cu filmul are timpii în `surse/final/parts/story.html` (`CAP`, în secunde; filmul are 30 de cadre/s).
Dacă se schimbă filmul, dă-i nume nou (`formare2-…`) și schimbă numele în `story.html` (altfel navigatorul îl ține pe cel vechi).
