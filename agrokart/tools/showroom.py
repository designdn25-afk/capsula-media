#!/usr/bin/env python3
"""Showroomul virtual 360° (demo/showroom.html): o hală în care te plimbi din oprire în oprire, cu puncte pe fiecare utilaj.
Imaginile (demo/img/showroom/sN.jpg) sunt făcute cu AI din schița 3D a halei (agrokart/surse/showroom/hall.html): fiecare utilaj
stă în schiță la locul de mai jos, deci punctele se așază prin calcul, nu de mână.   python3 agrokart/tools/showroom.py"""
import json, math, os, re, html, urllib.parse
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); D = R + '/demo'
U = {u['id']: u for u in json.load(open(R + '/date/utilaje.json', encoding='utf8'))}
TEL, TEL_A, WA = '0729249362', '0729 249 362', '40729249362'
H_OCHI = 1.6
# opririle: (id, nume, x, z)   ·   hala: lată 16 m (x de la -8 la 8), lungă 46 m (z de la 0 = intrare la 46 = peretele cu sigla)
OPRIRI = [('s1', 'Tractoare 25–60 CP', 0, 8), ('s2', 'Tractoare 70–100 CP', 0, 20), ('s3', 'Tractoare 100–160 CP', 0, 25.7), ('s4', 'Camera mini excavatoarelor', 0, 38.5)]
PERETE = 32   # peretele cu ușă dintre hala tractoarelor și camera mini excavatoarelor (clientul: „tractoarele separat și excavatoarele separat… în altă cameră”)
# utilajele: id, fel, mărime, parte (-1 / 1 = cele două șiruri, 0 = pe podium), z      (la fel ca în hall.html)
LOC = [('tye-254', 'T', .95, -1, 5), ('tye-404', 'T', 1.0, 1, 5), ('tye-504', 'T', 1.05, -1, 11), ('tye-604', 'T', 1.08, 1, 11),
       ('te-704', 'T', 1.12, -1, 17), ('te-1004', 'T', 1.15, 1, 17), ('te-1004-cabina', 'T', 1.18, -1, 23), ('tb-1004', 'T', 1.25, 1, 23),
       ('tb-1404', 'T', 1.35, -1, 28.5), ('tdf-1604', 'T', 1.45, 1, 28.5), ('kn-15', 'E', .85, -1, 36.5), ('kn-20', 'E', 1.0, 1, 36.5), ('kn-25', 'E', 1.2, 0, 41.5)]
GRUPE = {'T': [('motor', 'Motor', (0, 1.5, 1.0), r'^(motor|cilindree|putere|cai putere|turație|alimentare|pornire|rezervoare)'),
               ('cabina', 'Post de conducere', (0, 2.35, -.6), r'^(configurație|direcție|transmisie|ambreiaj|încărcător)'),
               ('roti', 'Roți și tracțiune', (.85, .75, -.75), r'^(tip tracțiune|tracțiune|anvelope|greutate)'),
               ('spate', 'Priză de putere și hidraulică', (0, 1.05, -1.55), r'^(pto|hidraulică)')],
         'E': [('motor', 'Motor și hidraulică', (0, 1.05, -.8), r'^(motor|pompă|distribuitor)'),
               ('cabina', 'Cabină și comenzi', (-.15, 2.0, -.2), r'^(cabină|comenzi|culoare)'),
               ('brat', 'Braț', (.35, 1.9, 1.5), r'^(braț)'),
               ('senile', 'Deplasare', (.62, .3, 0), r'^(deplasare)')]}

DE_MANA = {'s4': [('kn-25', 'nume', 1265, 722), ('kn-25', 'cabina', 1265, 947), ('kn-25', 'motor', 1367, 1120), ('kn-25', 'brat', 959, 865), ('kn-25', 'senile', 1306, 1212),
                  ('kn-15', 'nume', 2836, 824), ('kn-15', 'cabina', 2836, 988), ('kn-15', 'motor', 2897, 1141),
                  ('kn-20', 'nume', 3468, 855), ('kn-20', 'cabina', 3468, 1008), ('kn-20', 'motor', 3448, 1151), ('kn-20', 'brat', 3672, 1090)]}

def lume(p, x, y, z, rot, s):
    px, py, pz = p[0] * s, p[1] * s, p[2] * s
    return (x + px * math.cos(rot) + pz * math.sin(rot), y + py, z - px * math.sin(rot) + pz * math.cos(rot))

def unghi(o, p):   # yaw (0 = spre peretele din capăt, plus = spre dreapta în imagine), pitch, distanță
    dx, dy, dz = p[0] - o[0], p[1] - H_OCHI, p[2] - o[1]; d = math.hypot(dx, dz)
    return round(math.degrees(math.atan2(-dx, dz)), 1), round(math.degrees(math.atan2(dy, d)), 1), d

def nume(u): return re.sub(r'^Tractor \d+ CP - ', '', u['titlu']).replace('Mini excavator ', '')

fise = {}; scene = []
for uid, fel, s, parte, z in LOC:
    u = U[uid]; x = parte * 4.7 if parte else 4.4; y0 = 0 if parte else .3; rot = math.pi + parte * -.95 if parte else math.pi - .8
    gr = []
    for cod, titlu, p, rx in GRUPE[fel]:
        randuri = [[k, v] for k, v in u['spec'].items() if re.search(rx, k.lower())]
        if not randuri: continue
        a, b = lume(p, x, y0, z, rot, s), lume((-p[0], p[1], p[2]), x, y0, z, rot, s)
        gr.append({'cod': cod, 'titlu': titlu, 'p': a if abs(a[0]) <= abs(b[0]) else b, 'r': randuri})   # (partea dinspre culoar)
    m = re.search(r'(\d+) CP', u['titlu'])
    fise[uid] = {'nume': nume(u), 'fel': 'Tractor' + (' · ' + m.group(1) + ' CP' if m else '') if fel == 'T' else 'Mini excavator', 'pret': u['pret'], 'promo': u.get('promo', False),
                 'descriere': u.get('descriere', ''), 'spec': list(u['spec'].items()), 'poza': f'img/modele/{uid}.webp', 'pagina': f'{uid}.html',
                 'top': (x, y0 + (3.25 if fel == 'T' else 2.95) * s, z), 'c': (x, z), 'gr': gr}
for i, (sid, snume, sx, sz) in enumerate(OPRIRI):
    o = (sx, sz); pct = []; nav = []
    for uid, f in fise.items():
        d = math.hypot(f['c'][0] - sx, f['c'][1] - sz)
        if d > 8.2 or (f['c'][1] > PERETE) != (sz > PERETE): continue   # doar utilajele de lângă oprire, din aceeași încăpere
        yw, pt, _ = unghi(o, f['top']); pct.append({'t': 'nume', 'u': uid, 'yaw': yw, 'pitch': pt, 'departe': d > 8.2})
        if d <= 8.2:
            for g in f['gr']:
                yw, pt, _ = unghi(o, g['p']); pct.append({'t': 'info', 'u': uid, 'g': g['cod'], 'yaw': yw, 'pitch': pt})
    if sid in DE_MANA:   # imaginea acestei opriri nu a păstrat așezarea din schiță: punctele sunt puse după imagine (pixeli din 4096 × 2048)
        pct = [dict({'t': 'nume' if g == 'nume' else 'info', 'u': uid, 'yaw': round((px / 4096 - .5) * 360, 1), 'pitch': round((.5 - py / 2048) * 180, 1)}, **({} if g == 'nume' else {'g': g}))
               for uid, g, px, py in DE_MANA[sid] if g == 'nume' or any(x['cod'] == g for x in fise[uid]['gr'])]
    for j, (tid, tn, tx, tz) in enumerate(OPRIRI):
        if j == i: continue
        yw, pt, d = unghi(o, (tx, 0, tz)); nav.append({'la': tid, 'nume': tn, 'yaw': yw, 'pitch': round(pt, 1), 'm': round(max(.42, min(1, 7 / d)), 2)})
    scene.append({'id': sid, 'nume': snume, 'img': f'img/showroom/{sid}.jpg', 'pct': pct, 'nav': nav})
for f in fise.values():
    for g in f['gr']: del g['p']
    del f['top'], f['c']
date = json.dumps({'scene': scene, 'fise': fise, 'wa': WA}, ensure_ascii=False, separators=(',', ':'))

PAG = r'''<!doctype html>
<html lang="ro">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>Showroom virtual AgroKart · tractoare și mini excavatoare în 360°</title>
<meta name="description" content="Plimbă-te prin showroomul virtual AgroKart: apasă pe punctele de pe fiecare tractor și mini excavator ca să vezi specificațiile și prețul.">
<link rel="icon" href="img/logo.png">
<link rel="stylesheet" href="vendor/pannellum.css">
<style>
:root{--verde:#2f6b12;--verde-inchis:#1f4a0b;--galben:#f4b400;--text:#1c1f18;--gri:#5d6457;--linie:#e3e0d6}
*{box-sizing:border-box}
html,body{margin:0;height:100%;overflow:hidden;background:#11150f;color:var(--text);font:17px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
#pano{position:fixed;inset:0}
.pnlm-load-box,.pnlm-about-msg{display:none!important}
.sus{position:fixed;left:0;right:0;top:0;z-index:5;display:flex;align-items:center;gap:12px;padding:10px 14px;padding-top:max(10px,env(safe-area-inset-top));
  background:linear-gradient(#000a,#0000);pointer-events:none}
.sus>*{pointer-events:auto}
.sus .logo{display:flex;align-items:center;gap:10px;color:#fff;text-decoration:none;font-weight:700}
.sus .logo img{height:44px;width:auto;background:#fff;border-radius:10px;padding:3px 6px}
.sus .logo span{font-size:18px;text-shadow:0 1px 6px #000}
.sus .sp{flex:1}
.bt{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 16px;border-radius:12px;border:0;font:inherit;font-weight:700;text-decoration:none;cursor:pointer}
.bt-v{background:var(--verde);color:#fff}.bt-v:hover{background:var(--verde-inchis)}
.bt-a{background:#fff;color:var(--verde-inchis)}
.bt-g{background:#ffffffe6;color:var(--text)}
select.bt{appearance:none;-webkit-appearance:none;padding-right:34px;background:#ffffffe6 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%231c1f18' stroke-width='2'/%3E%3C/svg%3E") no-repeat right 12px center/12px;max-width:44vw}
.jos{position:fixed;left:0;right:0;bottom:0;z-index:5;padding:26px 12px max(12px,env(safe-area-inset-bottom));background:linear-gradient(#0000,#000b);display:flex;flex-direction:column;align-items:center;gap:8px;pointer-events:none}
.opriri{display:flex;gap:8px;max-width:100%;overflow-x:auto;pointer-events:auto;padding:2px}
.opriri button{flex:none;min-height:42px;padding:0 14px;border-radius:999px;border:2px solid #ffffff80;background:#0008;color:#fff;font:inherit;font-size:15px;font-weight:600;cursor:pointer;backdrop-filter:blur(6px)}
.opriri button[aria-current=true]{background:#fff;color:var(--verde-inchis);border-color:#fff}
.nota{color:#ffffffb3;font-size:12px;text-shadow:0 1px 3px #000}
.ajutor{position:fixed;left:50%;top:50%;z-index:6;transform:translate(-50%,-50%);background:#000c;color:#fff;border-radius:18px;padding:18px 22px;max-width:min(440px,88vw);text-align:center;backdrop-filter:blur(8px);transition:opacity .4s}
.ajutor b{display:block;font-size:20px;margin-bottom:6px}.ajutor.gata{opacity:0;pointer-events:none}
.ajutor button{margin-top:12px}
/* punctele */
.hs{width:0;height:0}
.hs-info>i{position:absolute;left:-17px;top:-17px;width:34px;height:34px;border-radius:50%;background:var(--verde);border:3px solid #fff;box-shadow:0 2px 10px #0009;cursor:pointer;display:block}
.hs-info>i::before{content:"";position:absolute;inset:-9px;border-radius:50%;border:2px solid #fff;opacity:.7;animation:puls 2s ease-out infinite}
.hs-info>i::after{content:"+";position:absolute;inset:0;display:grid;place-items:center;color:#fff;font:700 22px/1 system-ui;font-style:normal}
.hs-info>span{position:absolute;left:24px;top:-15px;white-space:nowrap;background:#000c;color:#fff;font-size:14px;font-weight:600;padding:5px 10px;border-radius:8px;opacity:0;pointer-events:none;transition:opacity .15s}
.hs-info:hover>span,.hs-info.on>span{opacity:1}
.hs-info.on>i{background:var(--galben)}
@keyframes puls{from{transform:scale(.7);opacity:.8}to{transform:scale(1.5);opacity:0}}
.hs-nume>button{position:absolute;transform:translate(-50%,-100%);white-space:nowrap;background:#fff;color:var(--text);border:0;border-radius:12px;padding:7px 12px;font:inherit;font-size:15px;font-weight:700;box-shadow:0 3px 14px #0008;cursor:pointer;display:flex;gap:8px;align-items:baseline}
.hs-nume>button::after{content:"";position:absolute;left:50%;top:100%;margin-left:-7px;border:7px solid transparent;border-top-color:#fff}
.hs-nume>button small{font-weight:600;color:var(--verde);font-size:14px}
.hs-nume.departe>button{font-size:13px;padding:5px 9px;opacity:.92}.hs-nume.departe small{display:none}
.hs-nav>button{position:absolute;left:0;top:0;width:150px;height:150px;margin:-75px 0 0 -75px;border-radius:50%;border:7px solid #fff;background:#ffffff2e;cursor:pointer;transform:scale(var(--m)) scaleY(.36);box-shadow:0 0 0 2px #0003,inset 0 0 22px #fff8;transition:background .15s}
.hs-nav>button:hover{background:#ffffff8c}
.hs-nav>span{position:absolute;left:0;top:calc(-34px * var(--m) - 18px);transform:translateX(-50%);white-space:nowrap;background:#000b;color:#fff;font-size:13px;font-weight:600;padding:4px 9px;border-radius:8px;pointer-events:none;opacity:0;transition:opacity .15s}
.hs-nav:hover>span{opacity:1}
/* fișa */
.fisa{position:fixed;z-index:8;right:14px;top:74px;bottom:86px;width:min(400px,calc(100vw - 28px));background:#fffffff5;border-radius:18px;box-shadow:0 10px 40px #0008;display:flex;flex-direction:column;overflow:hidden;transform:translateX(calc(100% + 30px));transition:transform .28s ease;backdrop-filter:blur(8px)}
.fisa.des{transform:none}
.fisa header{display:flex;align-items:flex-start;gap:10px;padding:16px 16px 10px}
.fisa header div{flex:1;min-width:0}
.fisa .fel{font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--verde)}
.fisa h2{margin:2px 0 0;font-size:26px;line-height:1.1}
.fisa .x{flex:none;width:40px;height:40px;border-radius:50%;border:0;background:#eef0ea;font-size:22px;cursor:pointer}
.fisa .corp{flex:1;overflow:auto;padding:0 16px 14px}
.fisa .poza{width:100%;height:150px;object-fit:contain;background:#0d0f0c;border-radius:12px;margin-bottom:10px}
.fisa h3{margin:14px 0 4px;font-size:15px;color:var(--gri);font-weight:700;display:flex;align-items:center;gap:8px}
.fisa h3::before{content:"";width:10px;height:10px;border-radius:50%;background:var(--verde)}
.fisa .gr.on h3{color:var(--text)}.fisa .gr.on h3::before{background:var(--galben)}
.fisa .gr.on{background:#fff8dc;margin:8px -8px 0;padding:2px 8px 6px;border-radius:12px}
.fisa dl{margin:0;display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:0 12px;font-size:15px}
.fisa dt{color:var(--gri);padding:5px 0;border-top:1px solid var(--linie)}.fisa dd{margin:0;padding:5px 0;border-top:1px solid var(--linie);font-weight:600}
.fisa footer{padding:12px 16px;border-top:1px solid var(--linie);background:#fff}
.fisa .pret{font-size:15px;color:var(--gri);margin-bottom:8px}.fisa .pret b{font-size:26px;color:var(--text)}.fisa .pret em{font-style:normal;background:var(--galben);border-radius:6px;padding:1px 7px;font-weight:700;color:#1c1f18;margin-left:6px;font-size:13px}
.fisa .but{display:flex;gap:8px}.fisa .but .bt{flex:1;justify-content:center;font-size:16px;padding:0 10px}.fisa .but .bt-a{border:2px solid var(--verde)}
@media (max-width:700px){
  .sus .logo span,.sus .lung{display:none}.sus .logo img{height:38px}
  .sus{gap:8px}.sus .bt{white-space:nowrap;padding:0 12px;font-size:15px}select.bt{max-width:42vw;padding-right:28px}
  .fisa{left:0;right:0;top:auto;bottom:0;width:auto;max-height:68vh;border-radius:18px 18px 0 0;transform:translateY(calc(100% + 20px))}
  .fisa .poza{height:110px}
  .hs-nume>button{font-size:13px;padding:5px 9px}
}
@media (prefers-reduced-motion:reduce){.hs-info>i::before{animation:none}.fisa{transition:none}}
</style>
</head>
<body>
<div id="pano" aria-label="Showroom virtual AgroKart, imagine 360°"></div>
<div class="sus">
  <a class="logo" href="index.html" aria-label="Înapoi la AgroKart"><img src="img/logo.png" alt="AgroKart" width="333" height="266"><span>Showroom virtual</span></a>
  <span class="sp"></span>
  <select class="bt" id="mergi" aria-label="Mergi la un utilaj"><option value="">Mergi la un utilaj…</option></select>
  <a class="bt bt-v" href="tel:__TEL__"><span class="lung">Sună:&nbsp;</span>__TEL_A__</a>
</div>
<div class="ajutor" id="ajutor"><b>Bun venit în showroomul AgroKart</b>Trage cu degetul sau cu mausul ca să te uiți în jur. Apasă pe cercurile de pe jos ca să mergi mai departe și pe punctele verzi ca să vezi specificațiile.<br><button class="bt bt-a" type="button">Am înțeles</button></div>
<aside class="fisa" id="fisa" aria-live="polite" hidden></aside>
<div class="jos"><div class="opriri" id="opriri" role="tablist" aria-label="Zonele showroomului"></div><div class="nota">Showroom virtual · imagini realizate cu AI, orientative · specificațiile și prețurile sunt cele din catalog</div></div>
<script src="vendor/pannellum.js"></script>
<script>
(function(){
var D=__DATE__,F=D.fise,S={},cur=null,sel=null,v;
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function wa(t){return "https://wa.me/"+D.wa+"?text="+encodeURIComponent(t)}
var fisa=document.getElementById("fisa");
function inchide(){fisa.classList.remove("des");sel=null;marcheaza()}
function deschide(u,g){var f=F[u];sel={u:u,g:g||null};
  var h='<header><div><div class="fel">'+esc(f.fel)+'</div><h2>'+esc(f.nume)+'</h2></div><button class="x" type="button" aria-label="Închide">×</button></header><div class="corp">';
  h+='<img class="poza" src="'+f.poza+'" alt="'+esc(f.nume)+'" loading="lazy">';
  if(!g&&f.descriere)h+='<p style="margin:0 0 4px">'+esc(f.descriere)+'</p>';
  var rest=f.spec.slice();
  f.gr.forEach(function(x){h+='<div class="gr'+(g===x.cod?' on':'')+'" data-g="'+x.cod+'"><h3>'+esc(x.titlu)+'</h3><dl>'+x.r.map(function(r){rest=rest.filter(function(q){return q[0]!==r[0]});return '<dt>'+esc(r[0])+'</dt><dd>'+esc(r[1])+'</dd>'}).join("")+'</dl></div>'});
  if(rest.length)h+='<div class="gr"><h3>Alte date</h3><dl>'+rest.map(function(r){return '<dt>'+esc(r[0])+'</dt><dd>'+esc(r[1])+'</dd>'}).join("")+'</dl></div>';
  h+='</div><footer><div class="pret">Preț cu TVA inclus: <b>'+esc(f.pret)+' €</b>'+(f.promo?'<em>Promoție</em>':'')+'</div><div class="but"><a class="bt bt-a" href="'+f.pagina+'">Pagina modelului</a><a class="bt bt-v" target="_blank" rel="noopener" href="'+wa("Bună ziua, am văzut "+f.nume+" în showroomul virtual și vreau o ofertă.")+'">Cere o ofertă</a></div></footer>';
  fisa.innerHTML=h;fisa.hidden=false;requestAnimationFrame(function(){fisa.classList.add("des")});
  fisa.querySelector(".x").onclick=inchide;var on=fisa.querySelector(".gr.on");if(on)on.scrollIntoView({block:"nearest"});marcheaza()}
function marcheaza(){document.querySelectorAll(".hs-info").forEach(function(e){e.classList.toggle("on",!!sel&&e.dataset.u===sel.u&&e.dataset.g===sel.g)})}
function mk(div,a){div.classList.add("hs");
  if(a.t==="info"){var gg=F[a.u].gr.filter(function(x){return x.cod===a.g})[0];div.classList.add("hs-info");div.dataset.u=a.u;div.dataset.g=a.g;div.innerHTML='<i role="button" tabindex="0" aria-label="'+esc(F[a.u].nume+": "+gg.titlu)+'"></i><span>'+esc(gg.titlu)+'</span>';
    var go=function(e){e.stopPropagation();deschide(a.u,a.g)};div.firstChild.addEventListener("click",go);div.firstChild.addEventListener("keydown",function(e){if(e.key==="Enter")go(e)})}
  else if(a.t==="nume"){div.classList.add("hs-nume");if(a.departe)div.classList.add("departe");div.innerHTML='<button type="button">'+esc(F[a.u].nume)+' <small>'+esc(F[a.u].pret)+' €</small></button>';div.firstChild.addEventListener("click",function(e){e.stopPropagation();deschide(a.u)})}
  else{div.classList.add("hs-nav");div.style.setProperty("--m",a.m);div.innerHTML='<button type="button" aria-label="Mergi la: '+esc(a.nume)+'"></button><span>'+esc(a.nume)+'</span>';div.firstChild.addEventListener("click",function(e){e.stopPropagation();mergi(a.la)})}}
D.scene.forEach(function(s,i){var hs=[];
  s.nav.forEach(function(n){hs.push({pitch:n.pitch,yaw:n.yaw,createTooltipFunc:mk,createTooltipArgs:{t:"nav",la:n.la,nume:n.nume,m:n.m}})});
  s.pct.forEach(function(p){hs.push({pitch:p.pitch,yaw:p.yaw,createTooltipFunc:mk,createTooltipArgs:p})});
  S[s.id]={type:"equirectangular",panorama:s.img,hfov:innerWidth<700?85:100,yaw:0,pitch:-2,hotSpots:hs}});
v=pannellum.viewer("pano",{default:{firstScene:D.scene[0].id,sceneFadeDuration:700,autoLoad:true,showControls:false,compass:false,minHfov:50,maxHfov:115,friction:.12,keyboardZoom:false,mouseZoom:"fullscreenonly"},scenes:S});
function mergi(id,yaw,pitch){if(id===cur){if(yaw!=null)v.lookAt(pitch||0,yaw,v.getHfov(),700);return}
  var y=yaw!=null?yaw:v.getYaw(),p=pitch!=null?pitch:Math.max(-12,Math.min(8,v.getPitch()));v.loadScene(id,p,y,v.getHfov())}
var op=document.getElementById("opriri");
D.scene.forEach(function(s,i){var b=document.createElement("button");b.type="button";b.textContent=(i+1)+". "+s.nume;b.dataset.id=s.id;b.onclick=function(){mergi(s.id)};op.appendChild(b)});
v.on("scenechange",function(id){cur=id;op.querySelectorAll("button").forEach(function(b){b.setAttribute("aria-current",b.dataset.id===id)});setTimeout(marcheaza,60)});
cur=D.scene[0].id;op.firstChild.setAttribute("aria-current","true");
var sl=document.getElementById("mergi");Object.keys(F).forEach(function(u){var o=document.createElement("option");o.value=u;o.textContent=F[u].nume+" · "+F[u].pret+" €";sl.appendChild(o)});
sl.onchange=function(){var u=sl.value;if(!u)return;var best=null;D.scene.forEach(function(s){s.pct.forEach(function(p){if(p.t==="nume"&&p.u===u&&!p.departe&&!best)best={s:s.id,yaw:p.yaw}})});
  if(best){mergi(best.s,best.yaw,-2)}deschide(u);sl.value=""};
var aj=document.getElementById("ajutor"),gata=function(){aj.classList.add("gata")};aj.querySelector("button").onclick=gata;document.getElementById("pano").addEventListener("pointerdown",gata,{once:true});setTimeout(gata,9000);
document.addEventListener("keydown",function(e){if(e.key==="Escape")inchide()});
window.__sr={v:v,mergi:mergi,deschide:deschide};
})();
</script>
</body>
</html>
'''
open(D + '/showroom.html', 'w', encoding='utf8').write(PAG.replace('__DATE__', date).replace('__TEL_A__', TEL_A).replace('__TEL__', TEL))
print('showroom.html:', len(scene), 'opriri,', sum(len(s['pct']) for s in scene), 'puncte')
