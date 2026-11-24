#!/usr/bin/env python3
"""Pune (sau scoate) casele K5 și YK5 în site/js/gradina-data.js și mărește grădina a doua oară (98 → 124 m, spre intrare).

    python3 surse/ai360/k5yk5/pune.py            # le pune (pentru capturile surselor sau, când imaginile sunt gata, definitiv)
    python3 surse/ai360/k5yk5/pune.py --scoate   # le scoate și readuce grădina la 98 m (cât nu au imagini reale, NU se publică)

K5 = căsuța extensibilă 4×5 cu scară exterioară și terasă pe acoperiș; YK5 = casa modulară „YK-5” (9,6 × 3,3 m). Numele sunt de
lucru. Datele sunt din oferta furnizorului (24 nov 2026); prețul de vânzare nu se știe (nu-l inventa; cel din ofertă e de achiziție)."""
import os, sys

P = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'site', 'js', 'gradina-data.js')
RAND = """  // K5 și YK5: casele din oferta din 24 nov 2026, în partea adăugată la a doua mărire a grădinii. Datele sunt din fișa furnizorului;
  // prețul de vânzare nu se știe încă (nu-l inventa). Camerele din model: K5 = Cameră, Terasă; YK5 = Living, Bucătărie, Baie, Dormitor.
  { cod: 'K5', mod: 'h_k5', x: 15.5, z: 66, rot: -30,
    date: { s: 'K', sn: 'Extensibilă cu terasă', d: '4,0 × 5,0 × 2,55 m', a: 20, l: '1 cameră · terasă pe acoperiș',
      t: 'Căsuță care se desface pe loc la 4 × 5 m, cu scară exterioară și terasă pe tot acoperișul, cu balustradă de sticlă.', p: null } },
  { cod: 'YK5', mod: 'h_yk5', x: -15.5, z: 66, rot: 30,
    date: { s: 'YK', sn: 'Modulară', d: '9,6 × 3,3 × 3,0 m', a: 32, l: '1 dormitor · 1 living cu bucătărie · 1 baie',
      t: 'Casă modulară cu ramă albă și fațadă din lamele de lemn: living cu bucătărie în spatele unei uși glisante mari, dormitor, baie și un colț acoperit de terasă.', p: null } },
"""
MIC, MARE = "adancime: 98, centruZ: 5, intrareZ: 54,", "adancime: 124, centruZ: 18, intrareZ: 80,"
SFARSIT = "];\n\n// Grădina: mărimea gardului viu"

s = open(P, encoding='utf-8').read()
are = "{ cod: 'K5'" in s
if '--scoate' in sys.argv:
    if are:
        assert RAND in s and MARE in s, 'rândurile au fost schimbate de mână: scoate-le de mână'
        s = s.replace(RAND, '').replace(MARE, MIC); print('K5 și YK5 scoase; grădina e iar de 98 m')
    else: print('nu erau în grădină')
else:
    if not are:
        assert s.count(SFARSIT) == 1 and MIC in s, 'gradina-data.js arată altfel decât se aștepta'
        s = s.replace(SFARSIT, RAND + SFARSIT).replace(MIC, MARE); print('K5 (15.5, 66) și YK5 (-15.5, 66) puse; grădina e de 124 m')
    else: print('erau deja în grădină')
open(P, 'w', encoding='utf-8').write(s)
