#!/usr/bin/env python3
"""Construieste paginile demo AgroKart din date/utilaje.json.
Folosire (din folderul agrokart):  python3 tools/genereaza.py
Iese: demo/index.html (deschidere + catalog) si demo/<id>.html pentru fiecare utilaj.
Rotirea 360 apare automat la utilajele care au cadre in demo/img/rot/<id>/ ."""
import json, os, glob, html, urllib.parse, re

R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = R + '/demo'
U = json.load(open(R + '/date/utilaje.json', encoding='utf8'))
TEL, TEL_A, WA = '+40729249362', '0729 249 362', '40729249362'
ORDINE = ['tye-254', 'tye-404', 'tye-504', 'tye-604', 'te-704', 'te-1004', 'te-1004-cabina',
          'tb-1004', 'tb-1404', 'tdf-1604', 'kn-15', 'kn-20', 'kn-25']
U.sort(key=lambda u: ORDINE.index(u['id']))
# imagine "in camp" (facuta cu AI) pentru prima parte a paginii, acolo unde exista
CAMP = {'tye-404': 'img/tye-404-camp'}
e = html.escape

IC_TEL = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1L6.6 10.8z"/></svg>'
IC_WA = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.8 14.2c-.25.7-1.4 1.3-1.95 1.35-.5.05-1.15.25-3.85-.8-3.25-1.3-5.3-4.6-5.45-4.8-.15-.2-1.3-1.75-1.3-3.3s.8-2.35 1.1-2.65c.3-.3.65-.4.85-.4h.6c.2 0 .45-.05.7.55.25.65.9 2.2.95 2.35.1.15.15.35.05.55-.1.2-.15.35-.3.5l-.45.55c-.15.15-.3.3-.15.6.2.3.8 1.3 1.7 2.1 1.15 1.05 2.15 1.35 2.45 1.5.3.15.5.15.65-.05.2-.2.75-.9.95-1.2.2-.3.4-.25.7-.15.25.1 1.8.85 2.1 1 .3.15.5.25.6.35.05.15.05.75-.2 1.45z"/></svg>'


def wa(text):
    return 'https://wa.me/%s?text=%s' % (WA, urllib.parse.quote(text))


def fmt(n):
    return f'{n:,}'.replace(',', '.')


def nr(pret):
    return int(pret.replace('.', ''))


def cp(u):
    m = re.search(r'(\d+) CP', u['titlu'])
    return m.group(1) + ' CP' if m else 'Mini excavator'


def nume(u):
    """Numele scurt: fara 'Tractor 40 CP - ' / 'Mini excavator '."""
    t = u['titlu']
    t = re.sub(r'^Tractor \d+ CP - ', '', t)
    return t.replace('Mini excavator ', '')


def cap(titlu, descriere, extra='', peste=False):
    return f'''<!doctype html>
<html lang="ro">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>{e(titlu)}</title>
<meta name="description" content="{e(descriere)}">
<link rel="icon" href="img/logo.png">
<link rel="stylesheet" href="style.css">
{extra}</head>
<body>
<header{' class="peste"' if peste else ''}>
  <div class="wrap antet">
    <a href="index.html" aria-label="AgroKart, prima pagină"><img src="img/logo.png" alt="AgroKart" width="333" height="266"></a>
    <nav class="nav" aria-label="Meniu">
      <a href="index.html#tractoare">Tractoare</a>
      <a href="index.html#excavatoare">Mini excavatoare</a>
      <a href="index.html#contact">Contact</a>
    </nav>
    <a class="btn btn-suna btn-mic" href="tel:{TEL}">{IC_TEL}<span class="lung">Sună:&nbsp;</span>{TEL_A}</a>
  </div>
</header>
'''


def coada(mesaj_wa, scripturi=''):
    return f'''
<footer>
  <div class="wrap">Pagină de probă pentru AgroKart · nu este site-ul oficial. Imaginile din câmp și rotirile sunt realizate cu AI și sunt orientative. Prețurile și datele sunt cele afișate pe agrokart.ro.</div>
</footer>
<div class="jos">
  <a class="btn btn-suna" href="tel:{TEL}">{IC_TEL}Sună</a>
  <a class="btn btn-wa" href="{wa(mesaj_wa)}" target="_blank" rel="noopener">{IC_WA}WhatsApp</a>
</div>
{scripturi}</body>
</html>
'''


def contact(titlu, mesaj):
    return f'''
<section class="contact" id="contact">
  <div class="wrap contact-grid">
    <div>
      <h2>{titlu}</h2>
      <p class="sub">Showroom: Calea București nr. 41, Ciorogârla, Ilfov.<br>Vizionarea se face pe bază de programare.</p>
      <a class="tel" href="tel:{TEL}">{TEL_A}</a>
    </div>
    <div class="butoane" style="margin:0">
      <a class="btn btn-suna" href="tel:{TEL}">Sună acum</a>
      <a class="btn btn-wa" href="{wa(mesaj)}" target="_blank" rel="noopener">WhatsApp</a>
      <a class="btn btn-wa" style="grid-column:1/-1" href="https://www.google.com/maps/search/?api=1&amp;query=Calea+Bucure%C8%99ti+41+Ciorog%C3%A2rla+Ilfov" target="_blank" rel="noopener">Arată-mi drumul pe hartă</a>
    </div>
  </div>
</section>
'''


def card(u):
    promo = '<span class="promo">Promoție</span>' if u['promo'] else ''
    return f'''      <a class="card" href="{u['id']}.html">
        <div class="im">{promo}<img loading="lazy" src="img/modele/{u['id']}.webp" alt="{e(u['titlu'])}"></div>
        <div class="tx">
          <span class="cp">{cp(u)}</span>
          <b>{e(nume(u))}</b>
          <span class="d">{e(u['descriere'])}</span>
          <span class="p">{u['pret']} EUR<small>cu TVA inclus</small></span>
          <span class="vezi">Vezi detalii →</span>
        </div>
      </a>
'''


def pagina_prima():
    tr = [u for u in U if u['tip'] == 'tractor']
    ex = [u for u in U if u['tip'] == 'excavator']
    h = cap('AgroKart · tractoare și mini excavatoare', 'Tractoare de la 25 la 160 CP și mini excavatoare. Prețuri cu TVA inclus.',
            '<link rel="preload" as="image" href="img/deschidere-m.webp" media="(max-width: 859px)">\n', peste=True)
    h += f'''<main>
<section class="deschidere" style="padding:0">
  <picture>
    <source media="(max-width:859px)" srcset="img/deschidere-m.webp">
    <img src="img/deschidere.webp" alt="Patru tractoare roșii AgroKart pe un câmp arat" width="2560" height="1429" fetchpriority="high">
  </picture>
  <span class="nota-ai">Imagine realizată cu AI · orientativă</span>
  <div class="txt"><div class="wrap">
    <h1>Tractoare și mini excavatoare</h1>
    <p>De la 25 la 160 CP. Prețuri cu TVA inclus, garanție 1 an sau 1.000 de ore.</p>
    <div class="butoane">
      <a class="btn btn-suna" href="#tractoare">Vezi tractoarele</a>
      <a class="btn btn-wa" href="tel:{TEL}">{IC_TEL}Sună</a>
    </div>
  </div></div>
</section>

<section style="padding:22px 0 0">
  <div class="wrap avantaje">
    <div><b>Prețul e afișat</b><span>La fiecare utilaj, cu TVA inclus.</span></div>
    <div><b>Transport gratuit la tractoare</b><span>În România, la destinațiile eligibile confirmate în oferta scrisă.</span></div>
    <div><b>Garanție 1 an sau 1.000 ore</b><span>Prima limită atinsă, de la livrare.</span></div>
  </div>
</section>

<section id="tractoare">
  <div class="wrap">
    <h2>Tractoare</h2>
    <p class="sub">{len(tr)} modele, de la cel mai mic la cel mai mare. Apasă pe un tractor ca să-l vezi.</p>
    <div class="catalog">
{''.join(card(u) for u in tr)}    </div>
  </div>
</section>

<section class="sect-exc" id="excavatoare">
  <div class="wrap">
    <h2>Mini excavatoare</h2>
    <p class="sub">{len(ex)} modele pentru săpături, șanțuri și lucrări în curte sau pe șantier.</p>
    <div class="catalog">
{''.join(card(u) for u in ex)}    </div>
  </div>
</section>
{contact('Vino să le vezi', 'Bună ziua, vreau să programez o vizionare.')}
</main>
'''
    h += coada('Bună ziua, mă interesează un utilaj AgroKart.', '''<script>
(function(){var h=document.querySelector("header.peste"),d=document.querySelector(".deschidere");
function f(){h.classList.toggle("jos-pagina",window.scrollY>d.offsetHeight-90);}
window.addEventListener("scroll",f,{passive:true});f();})();
</script>
''')
    open(D + '/index.html', 'w', encoding='utf8').write(h)


SCURT = [  # (cheie in spec, eticheta mica)
    ('Cai Putere', 'putere'), ('Putere', 'putere'), ('Tip Tracțiune', 'tracțiune'), ('Tracțiune', 'tracțiune'),
    ('Transmisie', 'viteze'), ('PTO Spate', 'priză de putere'), ('PTO spate', 'priză de putere'),
    ('Configurație', 'configurație'), ('Motor', 'motor'), ('Comenzi', 'comenzi'), ('Cabină', 'cabină'), ('Braț', 'braț'),
]


def pe_scurt(u):
    out, vazut = [], set()
    for k, et in SCURT:
        if k in u['spec'] and et not in vazut:
            v = u['spec'][k].split(';')[0].strip()
            if len(v) > 26:
                continue
            vazut.add(et)
            out.append(f'      <div><b>{e(v)}</b><span>{et}</span></div>\n')
        if len(out) == 6:
            break
    return ''.join(out)


def pagina_utilaj(u):
    uid, p = u['id'], nr(u['pret'])
    tractor = u['tip'] == 'tractor'
    cadre = sorted(glob.glob(f'{D}/img/rot/{uid}/*.webp'))
    are_rot = len(cadre) > 0
    titlu1 = e(u['titlu']).replace(' - ', '<br>', 1)
    if uid in CAMP:
        poza = f'''<div class="erou-poza">
      <picture>
        <source media="(max-width:700px)" srcset="{CAMP[uid]}-m.webp">
        <img src="{CAMP[uid]}.webp" alt="{e(u['titlu'])}" fetchpriority="high">
      </picture>
      <span class="nota-ai">Imagine realizată cu AI · orientativă</span>
    </div>'''
    else:
        poza = f'''<div class="erou-poza studio">
      <img src="img/modele/{uid}.webp" alt="{e(u['titlu'])}" fetchpriority="high">
    </div>'''
    transport = ('Transport gratuit pentru tractoare în România, la destinațiile eligibile confirmate în oferta scrisă înainte de comandă.'
                 if tractor else 'Livrarea și termenul se confirmă în oferta scrisă înainte de comandă.')
    omolog = u['spec'].get('Omologare Rutieră') or u['spec'].get('Omologare rutieră')
    nota_pret = 'cu TVA inclus' + (f' · {omolog}' if omolog else '')
    h = cap(f'{u["cod"]} · AgroKart', f'{u["titlu"]}. Preț {u["pret"]} EUR cu TVA inclus.')
    h += f'''<main id="sus">
<div class="wrap"><a class="inapoi" href="index.html#{'tractoare' if tractor else 'excavatoare'}">← Toate {'tractoarele' if tractor else 'mini excavatoarele'}</a></div>
<section class="erou">
  <div class="wrap erou-grid">
    {poza}
    <div>
      <span class="eticheta">În stoc</span>
      <h1>{titlu1}</h1>
      <p class="descr">{e(u['descriere'])}</p>
      <div class="pret-cutie">
        <div class="pret-et">{'Preț promoțional' if u['promo'] else 'Preț'}</div>
        <div class="pret">{u['pret']} <small>EUR</small></div>
        <div class="pret-nota">{nota_pret}</div>
        <div class="butoane">
          <a class="btn btn-suna" href="tel:{TEL}">{IC_TEL}Sună</a>
          <a class="btn btn-wa" href="{wa(f'Bună ziua, mă interesează {u["titlu"]}.')}" target="_blank" rel="noopener">{IC_WA}WhatsApp</a>
        </div>
        <p class="transport">{transport}</p>
      </div>
    </div>
  </div>
</section>

<section style="padding-top:20px">
  <div class="wrap">
    <div class="scurt">
{pe_scurt(u)}    </div>
  </div>
</section>
'''
    if are_rot:
        h += f'''
<section class="rot-fond" id="rotire">
  <div class="wrap">
    <h2>Uită-te la el din toate părțile</h2>
    <p class="sub">Trage cu degetul peste imagine, la stânga sau la dreapta. Sau apasă pe săgeți.</p>
    <div class="rot" id="rot" data-n="{len(cadre)}" data-dir="img/rot/{uid}/" role="img" aria-label="{e(u['cod'])} văzut de jur împrejur">
      <img id="rot-prima" src="img/rot/{uid}/000.webp" alt="" draggable="false">
      <canvas id="rot-c" width="1024" height="570"></canvas>
      <div class="rot-indiciu" id="rot-ind">◀ Trage ca să rotești ▶</div>
      <div class="rot-incarca" id="rot-bar"></div>
      <span class="nota-ai">Rotire realizată cu AI · orientativă</span>
    </div>
    <div class="rot-ctrl">
      <button type="button" id="rot-st" aria-label="Rotește la stânga">◀</button>
      <input type="range" id="rot-sl" min="0" max="100" value="0" aria-label="Rotește utilajul">
      <button type="button" id="rot-dr" aria-label="Rotește la dreapta">▶</button>
    </div>
    <p class="mic">Rotirea este făcută pe calculator pornind de la fotografia utilajului. Detaliile din spate pot fi diferite de utilajul real — vino să-l vezi în showroom.</p>
  </div>
</section>
'''
    if tractor:
        ex, pr = round(p * .10), round(p * .20)
        h += f'''
<section id="garantie">
  <div class="wrap">
    <h2>Alege garanția</h2>
    <p class="sub">Toate pachetele: 1 an sau 1.000 ore de funcționare, prima limită atinsă, de la livrare. Standard este inclus în preț.</p>
    <div class="pachete" data-baza="{p}" data-nume="{e(u['titlu'])}">
      <label class="pachet"><input type="radio" name="g" value="0" data-n="Standard" checked>
        <h3>Standard <em>Inclus</em></h3>
        <ul><li>Piese și manoperă pentru defecțiunile acoperite</li><li>Revizii și consumabile plătite separat</li></ul></label>
      <label class="pachet"><input type="radio" name="g" value="{ex}" data-n="Extra">
        <h3>Extra <em>+ {fmt(ex)} EUR</em></h3>
        <ul><li>Piese și manoperă pentru defecțiunile acoperite</li><li>Prima revizie completă inclusă</li><li>Verificare anuală în atelier</li><li>Transferabil la revânzare</li></ul></label>
      <label class="pachet"><input type="radio" name="g" value="{pr}" data-n="Premium">
        <h3>Premium <em>+ {fmt(pr)} EUR</em></h3>
        <ul><li>Piese și manoperă pentru defecțiunile acoperite</li><li>Primele 3 revizii complete incluse</li><li>Verificare anuală în atelier</li><li>Asistență tehnică prioritară</li><li>Utilaj temporar sau sprijin pentru închiriere</li><li>Sprijin pentru transportul rezervei</li><li>Transferabil la revânzare</li></ul></label>
    </div>
    <div class="total" aria-live="polite">
      <div><span class="et">Tractor + pachet <span id="g-nume">Standard</span></span><br><b><span id="g-total">{u['pret']}</span> EUR</b> <span class="et">cu TVA inclus</span></div>
      <a class="btn btn-wa" id="g-wa" href="#" target="_blank" rel="noopener">Cere oferta pe WhatsApp</a>
    </div>
    <p class="mic">Pachetele Extra și Premium sunt alternative, nu se cumulează. Pachetul și prețul final sunt înscrise în oferta acceptată. <a href="https://agrokart.ro/politica-de-garantie/">Vezi toate condițiile garanției</a>.</p>
  </div>
</section>
'''
    else:
        h += '''
<section id="garantie">
  <div class="wrap">
    <h2>Garanție</h2>
    <p class="sub">1 an sau 1.000 ore de funcționare, prima limită atinsă, de la livrare. <a href="https://agrokart.ro/politica-de-garantie/">Vezi condițiile garanției</a>.</p>
  </div>
</section>
'''
    if u['chirie']:
        h += f'''
<section style="padding-top:0" id="inchiriere">
  <div class="wrap">
    <h2>Sau închiriază-l</h2>
    <p class="sub">Ai nevoie de el doar câteva zile? Îl poți închiria.</p>
    <div class="chirie">
      <div><b>{u['chirie'].replace(' RON/zi', ' RON')}</b> / zi<br><span class="mic" style="font-size:16px">TVA inclus · maximum 8 ore de motor pe zi · transport separat · disponibilitate la cerere</span></div>
      <a class="btn btn-suna" href="tel:{TEL}">Sună pentru închiriere</a>
    </div>
  </div>
</section>
'''
    rand = ''.join(f'        <tr><td>{e(k)}</td><td>{e(v)}</td></tr>\n' for k, v in u['spec'].items())
    nota_ex = '' if tractor else '\n    <p class="mic">Greutatea, dimensiunile, puterea și adâncimea de săpare se confirmă în fișa tehnică a configurației ofertate.</p>'
    h += f'''
<section style="padding-top:0" id="date">
  <div class="wrap">
    <details{'' if tractor else ' open'}>
      <summary>Toate datele tehnice</summary>
      <table>
{rand}      </table>
    </details>{nota_ex}
  </div>
</section>
'''
    alt = [x for x in U if x['tip'] == u['tip'] and x['id'] != uid]
    i = [x['id'] for x in U if x['tip'] == u['tip']].index(uid)
    alt = sorted(alt, key=lambda x: abs([y['id'] for y in U if y['tip'] == u['tip']].index(x['id']) - i))[:3]
    h += f'''
<section style="padding-top:0">
  <div class="wrap">
    <h2>Vezi și</h2>
    <p class="sub">Modele apropiate. <a href="index.html">Vezi tot catalogul</a>.</p>
    <div class="catalog">
{''.join(card(x) for x in alt)}    </div>
  </div>
</section>
{contact('Vino să-l vezi', f'Bună ziua, vreau să programez o vizionare pentru {u["titlu"]}.')}
</main>
'''
    js = ''
    if tractor:
        js += '''<script>
(function(){
  var c=document.querySelector(".pachete"), baza=+c.dataset.baza;
  function fmt(n){return String(n).replace(/\\B(?=(\\d{3})+(?!\\d))/g,".");}
  function upd(){
    var i=document.querySelector("input[name=g]:checked"), v=+i.value, n=i.dataset.n;
    document.getElementById("g-total").textContent=fmt(baza+v);
    document.getElementById("g-nume").textContent=n;
    document.getElementById("g-wa").href="https://wa.me/''' + WA + '''?text="+encodeURIComponent(
      "Bună ziua, vreau ofertă pentru "+c.dataset.nume+" cu garanție "+n+" ("+fmt(baza+v)+" EUR).");
  }
  document.querySelectorAll("input[name=g]").forEach(function(i){i.addEventListener("change",upd);});
  upd();
})();
</script>
'''
    if are_rot:
        js += '<script src="rot.js"></script>\n'
    h += coada(f'Bună ziua, mă interesează {u["titlu"]}.', js)
    open(f'{D}/{uid}.html', 'w', encoding='utf8').write(h)


pagina_prima()
for u in U:
    pagina_utilaj(u)
print('pagini:', 1 + len(U))
