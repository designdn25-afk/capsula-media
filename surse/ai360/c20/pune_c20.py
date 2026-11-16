#!/usr/bin/env python3
"""Pune (sau scoate) casa C20 în site/js/gradina-data.js: rândul ei din CASE și stratul cu flori de pe locul ei.

    python3 surse/ai360/c20/pune_c20.py            # o pune (pentru capturile surselor sau, când imaginile sunt gata, definitiv)
    python3 surse/ai360/c20/pune_c20.py --scoate   # o scoate (cât nu are imagini reale, casa NU se publică: s-ar vedea macheta)

Când imaginile reale sunt gata, rândul primește și `ai: [...]`, iar în VEDERI / ROTIRI / PLANURI se adaugă rândurile ei
(vezi surse/ai360/CITESTE.md, partea a șasea). Numele „C20” e de lucru: clientul n-a spus încă cum vrea să se numească."""
import os, sys

P = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'site', 'js', 'gradina-data.js')
RAND = """  // C20: casa extensibilă de 20 ft (17 nov 2026), pe locul din stânga al părții noi. Datele sunt din oferta furnizorului; prețul de
  // vânzare nu se știe încă (nu-l inventa). Camerele din model: Living, Bucătărie, Baie, Dormitor 1, Dormitor 2.
  { cod: 'C20', mod: 'h_c20', x: -15.5, z: 40, rot: 30,
    date: { s: 'C', sn: 'Extensibilă', d: '5,9 × 6,2 × 2,48 m', a: 36.6, l: '2 dormitoare · 1 living cu bucătărie · 1 baie',
      t: 'Casă extensibilă de 20 ft: vine strânsă, cât un container, și se desface pe loc în ambele părți. Două dormitoare, living cu bucătărie și baie.', p: null } },
"""
STRAT, FARA = "straturiNoi: [[-15.5, 40, 4.6, 2.6, 1]] };", "straturiNoi: [] };"
SFARSIT = "];\n\n// Grădina: mărimea gardului viu"

s = open(P, encoding='utf-8').read()
are = "{ cod: 'C20'" in s
if '--scoate' in sys.argv:
    if are:
        assert RAND in s and FARA in s, 'rândul C20 a fost schimbat de mână: scoate-l de mână'
        s = s.replace(RAND, '').replace(FARA, STRAT)
        print('C20 scoasă din grădină')
    else:
        print('C20 nu era în grădină')
else:
    if not are:
        assert s.count(SFARSIT) == 1 and STRAT in s, 'gradina-data.js arată altfel decât se aștepta'
        s = s.replace(SFARSIT, RAND + SFARSIT).replace(STRAT, FARA)
        print('C20 pusă în grădină (x = -15.5, z = 40); stratul cu flori de pe locul ei a fost scos')
    else:
        print('C20 era deja în grădină')
open(P, 'w', encoding='utf-8').write(s)
