/* ===== Tur virtual interior X7: 360° real, puncte pe podea, zi/seară ===== */
(function(){
const root=document.getElementById('vt');if(!root||!window.pannellum)return;
const $=id=>document.getElementById(id);
const log=(...a)=>{try{console.log('[VT]',...a)}catch(e){}};
// ---------- date ----------
const SEQ=['ext','prag','intrare','living','masa','mijloc','canapea','vitraj','colt','blat','hol','baie','dormu','dorm','dormf'];
const N={
 ext:{n:'Exterior',H:0,hf:112,p:[5.9,5.0],v:[-22,2],txt:'Capsula X7, expusă în showroom-ul din Ciorogârla. Urcă treptele și intră pe ușa principală.',f:['Ușă cu yală smart','Vitraje panoramice','Trepte de acces'],
  tags:[[93,22,'Ușă cu yală smart',0],[-80,4,'Vitraj lateral',1],[-14,-50,'Trepte de acces',1]],links:[['prag',0,-15]]},
 prag:{n:'Pragul ușii',H:0,p:[5.9,3.3],v:[15,-6],txt:'Din prag vezi deja tot interiorul: baia în față, livingul cu luminator în dreapta.',f:['Baie cu ușă glisantă','Living cu luminator'],
  tags:[[-45,-2,'Baie cu ușă glisantă',1],[52,16,'Living cu luminator',0],[30,-24,'Blat bucătărie',0]],links:[['intrare',0,-32],['ext',180,-20]]},
 intrare:{n:'Hol de intrare',H:-85,p:[5.9,2.6],v:[-10,-5],txt:'Holul leagă livingul de baie și dormitor. Toate spațiile sunt pe un singur nivel, fără trepte în interior.',f:['Ușă de intrare smart','Acces direct în living','Baie lângă intrare'],
  tags:[[-22,26,'Luminator panoramic',1],[132,-20,'Yală smart',0],[-150,-2,'Baie',1],[-55,-26,'Blat bucătărie',1]],links:[['prag',95,-34],['living',-8],['hol',-172]]},
 living:{n:'Living',H:-90,p:[8.5,1.5],v:[0,-5],txt:'Living luminos, cu luminator în tavan, vitraj pe trei laturi și bandă LED. Draperiile închid complet spațiul seara.',f:['Luminator','Vitraj LOW-E','Bandă LED','Draperii pe tot perimetrul'],
  tags:[[-30,50,'Luminator panoramic',1],[45,66,'Bandă LED în tavan',0],[38,3,'Vitraj din podea până în tavan',0],[80,-2,'Draperii pe tot perimetrul',0],[-155,50,'Aer condiționat integrat',1]],links:[['canapea',15],['masa',-45],['blat',-150],['intrare',162]]},
 canapea:{n:'Vitrajul de pe capăt',H:-110,p:[10.9,1.2],v:[-40,-3],txt:'Vitraj din podea până în tavan, cu geam dublu LOW-E 6+12A+6. Canapeaua stă chiar lângă geam.',f:['Geam dublu LOW-E','Vedere panoramică','Canapea (mobilier opțional)'],
  tags:[[-60,10,'Geam dublu LOW-E 6+12A+6',1],[92,-44,'Canapea',0],[123,32,'Luminator',0]],links:[['mijloc',155,-24],['masa',-172]]},
 masa:{n:'Masa din living',H:35,p:[9.3,0.6],v:[170,-8],txt:'Loc de luat masa pentru două persoane, între blatul de bucătărie și zona de relaxare.',f:['Masă rotundă','Lângă blatul de bucătărie'],
  tags:[[-60,-20,'Blat cu dulapuri',1],[-150,8,'Vitraj lateral',1]],links:[['canapea',165],['living',-100],['blat',-55],['mijloc',145,-26]]},
 mijloc:{n:'Centrul livingului',H:90,p:[9.9,1.35],v:[15,-6],txt:'Din mijlocul livingului vezi blatul de bucătărie, masa și vitrajul lateral. Totul e deschis și luminos.',f:['Spațiu deschis','Luminator','Vitraj lateral'],
  tags:[[10,-14,'Blat bucătărie',0],[55,-35,'Masă rotundă',0],[-90,5,'Vitraj lateral',1],[2,64,'Luminator panoramic',0]],links:[['blat',0],['masa',52],['canapea',-178,-22],['vitraj',155,-22],['colt',-155,-22]]},
 vitraj:{n:'Lângă canapea',H:70,p:[10.5,2.3],v:[20,-6],txt:'Canapeaua stă lângă vitrajul de pe capăt. Ziua, lumina intră în living din trei direcții.',f:['Vitraj pe 3 laturi','Canapea (mobilier opțional)','Bandă LED'],
  tags:[[-120,5,'Vitraj panoramic',1],[130,-45,'Canapea',0],[15,38,'Luminator',0],[32,62,'Bandă LED',0]],links:[['mijloc',-18,-24],['colt',65,-16]]},
 colt:{n:'Colțul cu vitraj',H:75,p:[10.75,0.55],v:[-25,-6],txt:'Vitraj curbat din podea până în tavan, cu geam dublu LOW-E și vedere largă afară.',f:['Vitraj curbat','Geam dublu LOW-E'],
  tags:[[120,5,'Vitraj din podea până în tavan',0],[-105,-40,'Canapea',1],[-15,40,'Luminator',1]],links:[['mijloc',-12,-28],['blat',-20,-10],['vitraj',-62,-16]]},
 blat:{n:'Blat de bucătărie',H:-90,p:[7.6,1.4],v:[-80,-10],txt:'Blat din lemn cu dulapuri, prize pregătite și racorduri pentru bucătărie. Mobilierul de bucătărie e opțional.',f:['Racorduri pregătite','Prize integrate','Mobilier opțional'],
  tags:[[-100,-25,'Blat din lemn cu dulapuri',1],[-102,-4,'Prize și întrerupătoare',1],[-30,52,'Luminator',1]],links:[['living',-5],['masa',-50],['hol',178],['intrare',140]]},
 hol:{n:'Hol central',H:173,p:[5.1,2.2],v:[85,-5],txt:'Ușa de intrare, tabloul electric și accesul spre baie și dormitor, toate într-un singur loc.',f:['Tablou electric','Acces baie','Acces dormitor'],
  tags:[[-5,36,'Tablou electric',0],[-32,-9,'Ușă de intrare',1],[150,-4,'Baie',0]],links:[['baie',150],['dormu',85],['intrare',-40],['blat',-100]]},
 baie:{n:'Baie',H:180,p:[5.2,0.85],v:[80,-8],txt:'Baie completă: duș cu cabină de sticlă, lavoar suspendat, oglindă cu LED și WC smart.',f:['Duș cu cabină de sticlă','Oglindă cu LED','WC smart','Lavoar suspendat'],
  tags:[[-90,0,'Duș cu cabină de sticlă',1],[95,13,'Oglindă cu iluminare LED',0],[82,-30,'Lavoar suspendat',0],[178,-52,'WC smart',0]],links:[['hol',0,-24]]},
 dormu:{n:'Intrare în dormitor',H:-90,p:[3.3,2.3],v:[-150,-5],txt:'Din hol intri în dormitor: biroul te întâmpină la intrare, iar draperiile acoperă tot peretele. Fotografiat seara, cu luminile aprinse.',f:['Birou','Draperii pe tot peretele','Iluminat LED'],
  tags:[[-35,-5,'Ușa glisantă a băii',0],[-107,-30,'Birou',1],[75,5,'Draperii pe tot peretele',0],[-150,62,'Bandă LED',1]],links:[['hol',-3],['dorm']]},
 dorm:{n:'Dormitor',H:-85,p:[1.9,1.5],v:[180,-5],txt:'Dormitorul separat are vitraj panoramic pe tot capătul, aer condiționat și loc de birou. Aici e amenajat cu fotolii.',f:['Vitraj panoramic','Aer condiționat','Birou','Fotolii (opționale)'],
  tags:[[-90,12,'Vitraj panoramic',1],[-100,-38,'Fotolii (mobilier opțional)',1],[-18,-25,'Birou',1],[-3,29,'Aer condiționat integrat',0]],links:[['dormu',5],['dormf',180]]},
 dormf:{n:'Vitrajul dormitorului',H:70,p:[1.0,1.4],v:[0,-5],txt:'Vedere liberă afară. Draperiile din podea până în tavan asigură intimitate oricând.',f:['Vitraj pe tot capătul','Draperii din podea până în tavan'],
  tags:[[-55,15,'Vitraj panoramic',1],[-3,-26,'Fotolii (mobilier opțional)',0],[-130,10,'Draperii',1],[132,50,'Aer condiționat',0]],links:[['dorm',165]]},
 living_n:{n:'Living, seara',night:1,off:0,day:'living',v:[10,-3],txt:'Cu draperiile trase, banda LED din tavan și lumina de sub draperii creează o atmosferă caldă.',f:['Bandă LED ambientală','Draperii blackout','Lumină caldă'],
  tags:[[40,68,'Bandă LED ambientală',0],[70,0,'Draperii închise complet',0],[20,-48,'Lumină LED sub draperii',0],[-40,52,'Luminator',1]]},
 masa_n:{n:'Masa, seara',night:1,off:-68,day:'masa',v:[110,-8],txt:'Masa din living, seara, cu lumina indirectă aprinsă.',f:['Iluminat indirect','Draperii trase'],
  tags:[[-135,-20,'Blat cu dulapuri',1],[105,24,'Luminator',0]]},
 baie_n:{n:'Baie, seara',night:1,off:180,day:'baie',v:[-110,-5],txt:'Oglinda cu LED și spoturile din tavan luminează toată baia.',f:['Oglindă cu LED','Spoturi în tavan'],
  tags:[[-95,12,'Oglindă cu iluminare LED',0],[90,0,'Duș',0],[2,-55,'WC smart',0]]},
 dorm_n:{n:'Dormitor, seara',night:1,off:0,day:'dorm',v:[-20,-3],txt:'Iluminat LED indirect și draperii blackout pe tot perimetrul dormitorului.',f:['LED indirect','Draperii blackout'],
  tags:[[-90,58,'Bandă LED în tavan',1],[60,0,'Draperii blackout',0],[-18,-25,'Birou',1]]}
};
const NIGHT={living:'living_n',masa:'masa_n',baie:'baie_n',dorm:'dorm_n'};
Object.keys(N).forEach(k=>{const d=N[k];if(d.night){const b=N[d.day];d.H=b.H+d.off;d.p=b.p;d.links=b.links.map(([t,y,pt])=>[t,y==null?null:y+d.off,pt]);}});
const norm=a=>((a%360)+540)%360-180;
const dayOf=k=>N[k].night?N[k].day:k;
function dist(a,b){const p=N[a].p,q=N[b].p;return Math.hypot(q[0]-p[0],q[1]-p[1])}
function bearing(a,b){const p=N[a].p,q=N[b].p;return Math.atan2(q[0]-p[0],-(q[1]-p[1]))*180/Math.PI}
function linkPos(k,l){const [t,y,pt]=l,day=dayOf(k),dd=dist(day,t);return {t,yaw:norm(y==null?N[k].H+bearing(day,t):y),pitch:pt!=null?pt:-Math.max(9,Math.min(48,Math.atan(1.35/Math.max(.6,dd))*180/Math.PI))}}
// ---------- imagini ----------
const IMG=(k,l)=>`p360/${k}_${l}.webp`;
const cache=new Map();
// descărcare cu progres; imaginea se dă vizualizatorului ca blob (o singură descărcare)
function pre(u,onp,ctl){let e=cache.get(u);if(e)return e.p;e={ok:false,url:null};cache.set(u,e);
  e.p=(async()=>{try{const r=await fetch(u,ctl?{signal:ctl.signal}:{});if(!r.ok)throw new Error(r.status);const tot=+r.headers.get('content-length')||0;
    let blob;if(r.body&&tot&&onp){const rd=r.body.getReader(),ch=[];let n=0;while(true){const {done,value}=await rd.read();if(done)break;ch.push(value);n+=value.length;onp(n/tot)}blob=new Blob(ch,{type:'image/webp'})}else blob=await r.blob();
    e.url=URL.createObjectURL(blob);e.ok=true;return true}catch(err){cache.delete(u);return false}})();return e.p}
const has=u=>cache.has(u)&&cache.get(u).ok;
const src=u=>has(u)?cache.get(u).url:u;
let speed=0;
const isMob=()=>matchMedia('(max-width:900px)').matches;
const ORD=['s','m','l','x'];
const LEVELS=()=>(isMob()||Math.min(screen.width,screen.height)<700)?['s','m']:((window.devicePixelRatio||1)>=1.5||window.innerWidth>1700?['s','l','x']:['s','l']);
function bestLoaded(k){for(const l of ['x','l','m','s'])if(has(IMG(k,l)))return l;return null}
// ---------- vizualizator ----------
const stage=$('vtStage'),loadBar=$('vtLoad').firstElementChild,toast=$('vtToast'),hint=$('vtHint');
let V=null,cur='ext',mode='day',busy=false,started=false,curKey='',dragging=false,autoT=null,auto=false;
const added=new Set();
const ov=document.createElement('canvas');ov.className='vt-ov';stage.insertBefore(ov,stage.children[1]);
const D2R=Math.PI/180;
function snap(){try{const c=document.querySelector('#vtPano canvas');if(!c||!V)return false;V.getRenderer().render(V.getPitch()*D2R,V.getYaw()*D2R,V.getHfov()*D2R);
  if(ov.width!==c.width||ov.height!==c.height){ov.width=c.width;ov.height=c.height}ov.getContext('2d').drawImage(c,0,0);
  ov.style.transition='none';ov.style.transform='scale(1)';ov.style.filter='none';ov.style.opacity='1';return true}catch(e){log('snap',e);return false}}
function fx(kind){void ov.offsetWidth;requestAnimationFrame(()=>requestAnimationFrame(()=>{
  if(kind==='walk'){ov.style.transition='transform 1.1s cubic-bezier(.3,0,.2,1),opacity .9s ease .12s,filter 1s ease';ov.style.transform='scale(1.7)';ov.style.filter='blur(3px)';ov.style.opacity='0'}
  else{ov.style.transition='opacity '+(kind==='slow'?1.4:kind==='quick'?.45:.75)+'s ease';ov.style.opacity='0'}}))}
function hsGo(div,a){div.innerHTML=`<span class="ring"></span><span class="lbl">→ ${a.label}</span>`;div.classList.add('vt-go');if(a.main)div.classList.add('main');div.title=a.label}
function hsTag(div,a){div.innerHTML=`<span class="d"></span><span class="t">${a.t}</span>`;div.classList.add('vt-tagd');if(a.l)div.classList.add('l')}
function shown(k){return mode==='night'&&NIGHT[k]?NIGHT[k]:k}
function sceneCfg(k,l){const d=N[k],day=dayOf(k),si=SEQ.indexOf(day),nxt=SEQ[si+1];
  const hs=[];
  d.links.forEach(l=>{const L=linkPos(k,l),t=L.t;
    hs.push({pitch:L.pitch,yaw:L.yaw,type:'info',cssClass:'vt-hsx',createTooltipFunc:hsGo,createTooltipArgs:{label:N[t].n,main:t===nxt},clickHandlerFunc:(e,a)=>{e&&e.stopPropagation&&e.stopPropagation();go(a.t,{yaw:a.yaw,pitch:a.pitch})},clickHandlerArgs:L})});
  d.tags.forEach(([y,p,t,lft])=>hs.push({pitch:p,yaw:y,type:'info',cssClass:'vt-hsx',createTooltipFunc:hsTag,createTooltipArgs:{t,l:lft}}));
  return {type:'equirectangular',panorama:src(IMG(k,l)),yaw:d.v[0],pitch:d.v[1],hfov:d.hf||100,hotSpots:hs}}
function key(k,l){const kk=k+'~'+l;if(!added.has(kk)){if(V)V.addScene(kk,sceneCfg(k,l));added.add(kk)}return kk}
function loadKey(kk,pitch,yaw,hfov,fade){return new Promise(res=>{let done=false;const fin=ok=>{if(done)return;done=true;V.off('load',onl);V.off('error',one);clearTimeout(tm);res(ok)};
  const onl=()=>fin(true),one=e=>{log('error',e);fin(false)};V.on('load',onl);V.on('error',one);const tm=setTimeout(()=>fin(false),25000);
  try{V.getConfig().sceneFadeDuration=fade;V.loadScene(kk,pitch,yaw,hfov)}catch(e){log('loadScene',e);fin(false)}})}
let loadTimer=null;function loading(on){clearInterval(loadTimer);if(on){let w=8;loadBar.style.width=w+'%';loadTimer=setInterval(()=>{w=Math.min(92,w+(92-w)*.07);loadBar.style.width=w+'%'},200)}else{loadBar.style.width='100%';setTimeout(()=>loadBar.style.width='0',400)}}
function say(t,ms){toast.textContent=t;toast.classList.add('on');clearTimeout(say.t);say.t=setTimeout(()=>toast.classList.remove('on'),ms||2600)}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
// ---------- deplasare ----------
async function go(t,via,opts){opts=opts||{};if(busy||!V)return;const from=cur;if(t===from)return;busy=true;if(upCtl){try{upCtl.abort()}catch(e){}upCtl=null;hd.classList.remove('on')}stopAuto(opts.auto);hideIntro();hint.classList.remove('on');
  const tk=shown(t);let lvl=bestLoaded(tk);const t0=performance.now();
  try{V.stopAutoRotate()}catch(e){}
  if(via)V.lookAt(Math.max(-18,Math.min(0,via.pitch*.35)),via.yaw,Math.min(V.getHfov(),100),600);
  if(!lvl){loading(true);const ok=await Promise.race([pre(IMG(tk,'s')),wait(15000).then(()=>false)]);if(!ok){busy=false;loading(false);say('Imaginea se încarcă greu. Mai încearcă o dată.');return}lvl='s'}
  if(via){const left=620-(performance.now()-t0);if(left>0)await wait(left)}
  // direcția de sosire: continuăm mersul în aceeași direcție
  let ay=N[tk].v[0],ap=N[tk].v[1];
  const hasSnap=snap();
  setCur(t);
  const ok=await loadKey(key(tk,lvl),ap,ay,via?118:106,0);
  loading(false);
  if(!ok){busy=false;fx('quick');say('Nu am putut încărca acest punct.');return}
  if(hasSnap)fx(via?'walk':'fade');
  const hf=N[tk].hf||100;V.setHfov(hf,via?1200:900);
  setTimeout(()=>{busy=false},via?700:400);
  afterArrive(tk)}
let upCtl=null,upFor='';
const hd=document.getElementById('vtHD');
function afterArrive(tk){curKey=V.getScene();upgrade(tk).then(()=>{if(shown(cur)!==tk)return;
  const n=SEQ[SEQ.indexOf(cur)+1];if(n)pre(IMG(shown(n),'s'));N[dayOf(tk)].links.forEach(([t])=>pre(IMG(shown(t),'s')))})}
async function upgrade(tk){if(upCtl&&upFor!==tk){try{upCtl.abort()}catch(e){}upCtl=null}
  for(const lv of LEVELS().slice(1)){if(shown(cur)!==tk)return;const have=bestLoaded(tk);if(have&&ORD.indexOf(have)>=ORD.indexOf(lv))continue;
    const u=IMG(tk,lv);if(!has(u)){upCtl=new AbortController();upFor=tk;hd.classList.add('on');hd.textContent='HD · 0%';
      const ok=await pre(u,p=>{if(shown(cur)===tk)hd.textContent='HD · '+Math.round(p*100)+'%'},upCtl);upCtl=null;hd.classList.remove('on');if(!ok)return}
    while((dragging||busy)&&shown(cur)===tk)await wait(300);
    if(shown(cur)!==tk||busy)return;if(V.getScene()===key(tk,lv))continue;
    busy=true;const sn=snap();const ok2=await loadKey(key(tk,lv),V.getPitch(),V.getYaw(),V.getHfov(),0);if(sn)fx('quick');busy=false;if(ok2)curKey=V.getScene()}}
// ---------- zi / seară ----------
async function setMode(m){if(m===mode||busy||!V)return;mode=m;$('vtDay').classList.toggle('on',m==='day');$('vtNight').classList.toggle('on',m==='night');thumbs();
  const k=cur;const fromK=V.getScene().split('~')[0],toK=shown(k);
  if(fromK===toK){if(m==='night')say('Varianta de seară există în living, la masă, în baie și în dormitor.',3200);return}
  busy=true;loading(true);const lvl=bestLoaded(toK)||((await pre(IMG(toK,'s')))?'s':null);if(!lvl){busy=false;loading(false);return}
  const off=(N[toK].night?N[toK].off:0)-(N[fromK].night?N[fromK].off:0);
  const sn=snap();const ok=await loadKey(key(toK,lvl),V.getPitch(),norm(V.getYaw()+off),V.getHfov(),0);if(sn)fx('slow');loading(false);busy=false;if(ok){ui();afterArrive(toK)}}
// ---------- interfață ----------
const thumbsEl=$('vtThumbs');
function thumbs(){thumbsEl.innerHTML=SEQ.map((k,i)=>`<button class="vt-th${k===cur?' on':''}" data-k="${k}" type="button"><img src="p360/t_${shown(k)}.jpg" alt="" loading="lazy"><span>${i+1}. ${N[k].n}</span></button>`).join('');
  [...thumbsEl.children].forEach(b=>b.onclick=()=>go(b.dataset.k))}
function setCur(k){cur=k;ui()}
function ui(){const k=shown(cur),d=N[k],i=SEQ.indexOf(cur);$('vtRoom').textContent=d.n;$('vtIdx').textContent=(i+1)+' / '+SEQ.length;$('vtTitle').textContent=d.n;$('vtText').textContent=d.txt;
  $('vtStepPill').textContent='Punctul '+(i+1)+' din '+SEQ.length+(N[k].night?' · seara':'');$('vtFeats').innerHTML=d.f.map(x=>`<span>${x}</span>`).join('');
  $('vtPrev').disabled=$('vtPrevA').disabled=i===0;$('vtNext').textContent=i===SEQ.length-1?'De la început ↺':'Înainte ›';
  [...thumbsEl.children].forEach(b=>b.classList.toggle('on',b.dataset.k===cur));const on=thumbsEl.querySelector('.on');if(on&&started){const r=on.offsetLeft-thumbsEl.clientWidth/2+on.clientWidth/2;thumbsEl.scrollTo({left:r,behavior:'smooth'})}
  mini.querySelectorAll('.nd').forEach(n=>n.classList.toggle('on',n.dataset.k===cur))}
function viaTo(t){const k=shown(cur),l=N[k].links.find(x=>x[0]===t);return l?linkPos(k,l):null}
function step(dlt){let i=SEQ.indexOf(cur)+dlt;if(i>=SEQ.length)i=0;if(i<0)return;const t=SEQ[i];go(t,viaTo(t))}
$('vtPrev').onclick=$('vtPrevA').onclick=()=>step(-1);$('vtNext').onclick=$('vtNextA').onclick=()=>step(1);
$('vtDay').onclick=()=>setMode('day');$('vtNight').onclick=()=>setMode('night');
$('vtFs').onclick=()=>{const el=stage;if(document.fullscreenElement){document.exitFullscreen()}else if(el.requestFullscreen){el.requestFullscreen().catch(()=>{el.classList.toggle('fs')})}else if(el.webkitRequestFullscreen){el.webkitRequestFullscreen()}};
document.addEventListener('fullscreenchange',()=>{setTimeout(()=>{try{V&&V.resize()}catch(e){}},120)});
root.tabIndex=-1;root.addEventListener('keydown',e=>{if(e.key==='ArrowRight'&&e.target.tagName!=='INPUT')step(1);if(e.key==='ArrowLeft')step(-1)});
// tur automat
function stopAuto(fromAuto){if(fromAuto)return;if(auto){auto=false;clearTimeout(autoT);$('vtAuto').classList.remove('on');$('vtAuto').textContent='▶ Turul automat'}}
function autoNext(){if(!auto)return;autoT=setTimeout(async()=>{if(!auto)return;if(busy){autoNext();return}const i=SEQ.indexOf(cur);if(i>=SEQ.length-1){stopAuto();return}
  const t=SEQ[i+1];await go(t,viaTo(t),{auto:true});try{V.startAutoRotate(-4)}catch(e){}autoNext()},6500)}
$('vtAuto').onclick=()=>{if(auto){stopAuto();return}auto=true;$('vtAuto').classList.add('on');$('vtAuto').textContent='❚❚ Oprește turul';hideIntro();try{V.startAutoRotate(-4)}catch(e){}autoNext()};
// interacțiune
stage.addEventListener('pointerdown',e=>{if(e.target.closest('button,.vt-mini'))return;dragging=true;hint.classList.remove('on');if(auto&&!e.target.closest('.vt-go'))stopAuto()});
window.addEventListener('pointerup',()=>{dragging=false});window.addEventListener('pointercancel',()=>{dragging=false});
// ---------- minihartă ----------
const mini=$('vtMini');
(function(){const nds=SEQ.map(k=>{const [x,y]=N[k].p;return `<g class="nd" data-k="${k}" transform="translate(${x} ${y})"><title>${N[k].n}</title><circle r=".2"/></g>`}).join('');
 mini.innerHTML=`<svg viewBox="-0.3 -0.35 12.2 5.75" aria-hidden="false"><defs><radialGradient id="vtConeG" cx="0" cy="0" r="1.6" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#e8c27a" stop-opacity=".85"/><stop offset="1" stop-color="#e8c27a" stop-opacity="0"/></radialGradient></defs>
 <rect class="cap" x="0" y="0" width="11.6" height="3" rx="1.1"/>
 <rect class="wall" x="4.3" y="0.05" width="2.2" height="1.55"/><line x1="3.6" y1="0.05" x2="3.6" y2="1.75" stroke="rgba(255,255,255,.45)" stroke-width=".06"/>
 <rect class="fur" x="6.6" y="0.08" width="1.55" height="0.42" rx=".08"/><circle class="fur" cx="9.3" cy="0.62" r=".3"/><rect class="fur" x="10.65" y="1.25" width=".5" height="1.45" rx=".18"/>
 <rect class="fur" x="3.05" y="0.12" width=".45" height=".85" rx=".05"/><rect class="fur" x="0.35" y="0.55" width=".55" height=".55" rx=".12"/><rect class="fur" x="0.35" y="1.95" width=".55" height=".55" rx=".12"/>
 <line x1="5.5" y1="3" x2="6.3" y2="3" stroke="#e8c27a" stroke-width=".12"/><rect class="fur" x="5.35" y="3.12" width="1.1" height=".38" rx=".06"/>
 <text class="rl" x="1.8" y="2.75">DORMITOR</text><text class="rl" x="5.4" y="1.0">BAIE</text><text class="rl" x="9.4" y="2.6">LIVING</text><text class="rl" x="7.3" y="4.4">INTRARE</text>
 <g id="vtCone"><path class="cone" d="M0 0 L-0.9 -1.3 A1.58 1.58 0 0 1 0.9 -1.3 Z"/></g>${nds}</svg><div class="mt"><span>Planul capsulei X7</span><span id="vtMiniN"></span></div>`;
 mini.querySelectorAll('.nd').forEach(n=>n.addEventListener('click',()=>go(n.dataset.k)))})();
const cone=$('vtCone'),conePath=cone.firstElementChild;
let lastH=0;
function coneLoop(){if(V&&visible){try{const k=V.getScene().split('~')[0],d=N[k];const yaw=V.getYaw(),hf=V.getHfov();const a=Math.min(70,hf/2)*Math.PI/180,r=1.58;
  if(Math.abs(hf-lastH)>.5){lastH=hf;conePath.setAttribute('d',`M0 0 L${(-Math.sin(a)*r).toFixed(3)} ${(-Math.cos(a)*r).toFixed(3)} A${r} ${r} 0 0 1 ${(Math.sin(a)*r).toFixed(3)} ${(-Math.cos(a)*r).toFixed(3)} Z`)}
  cone.setAttribute('transform',`translate(${d.p[0]} ${d.p[1]}) rotate(${(yaw-d.H).toFixed(1)})`)}catch(e){}}requestAnimationFrame(coneLoop)}
// ---------- pornire ----------
function hideIntro(){const i=$('vtIntro');if(i&&!i.classList.contains('off')){i.classList.add('off');hint.classList.add('on');setTimeout(()=>hint.classList.remove('on'),5000)}}
$('vtStart').onclick=e=>{e.stopPropagation();hideIntro();started=true;try{V&&V.startAutoRotate(-3)}catch(_){}setTimeout(()=>{try{V&&V.stopAutoRotate()}catch(_){}},2600)};
let visible=false;
async function init(){if(V)return;loading(true);const t0=performance.now();await pre(IMG('ext','s'));const dt=(performance.now()-t0)/1000;speed=70/Math.max(.05,dt);
  log('speed KB/s',speed|0);
  const scenes={'ext~s':sceneCfg('ext','s')};added.add('ext~s');
  V=pannellum.viewer('vtPano',{default:{firstScene:'ext~s',sceneFadeDuration:800,autoLoad:true,showControls:false,compass:false,mouseZoom:false,keyboardZoom:false,hfov:100,minHfov:45,maxHfov:120,friction:.12,touchPanSpeedCoeffFactor:1,backgroundColor:[.06,.065,.075],strings:{loadingLabel:'Se încarcă…'}},scenes});
  V.on('load',()=>{loading(false)});V.on('error',e=>{log('err',e);loading(false)});
  V.on('load',function first(){V.off('load',first);curKey=V.getScene();afterArrive('ext')});
  thumbs();ui();coneLoop()}
thumbs();ui();
new IntersectionObserver(es=>{visible=es[0].isIntersecting;if(visible&&!V)init()},{rootMargin:'500px'}).observe(root);
})();
