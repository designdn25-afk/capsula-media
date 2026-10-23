#!/bin/sh
# Publică folderul site/ pe GitHub Pages (ramura gh-pages): https://designdn25-afk.github.io/capsula-media/
# Fișierele vechi nefolosite (home_v1.html, hero_*, x7s_frame, x7s_lot) nu se publică.
# Folosire (din rădăcina proiectului): sh tools/publica_pages.sh
set -eu
ROOT=$(pwd)
python3 tools/asambleaza.py
TMP=$(mktemp -d)
cp -r site/. "$TMP/"
cd "$TMP"
rm -f home_v1.html img/hero_far_* img/hero_near_* img/hero_glass.png img/x7s_frame.webp img/x7s_lot.webp
find . -name __pycache__ -prune -exec rm -rf {} +
touch .nojekyll
git init -q -b gh-pages
git add -A
git -c user.name="$(git -C "$ROOT" log -1 --format=%an)" -c user.email="$(git -C "$ROOT" log -1 --format=%ae)" \
  commit -q -m "Site Capsula România pentru GitHub Pages ($(git -C "$ROOT" rev-parse --short HEAD))"
git push -q -f "$(git -C "$ROOT" remote get-url origin)" gh-pages
echo "Publicat. Adresa: https://designdn25-afk.github.io/capsula-media/ (GitHub o actualizează în 1–2 minute)"
