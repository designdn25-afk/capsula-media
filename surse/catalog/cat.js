(function(){const D=window.CAT;if(!D)return;const g=id=>document.getElementById(id);
const fmt=a=>String(a).replace('.',',')+' m²';let F='all',Z=null;
function render(){const L=D.filter(m=>(F==='all'||m.s===F)&&(!Z||(Z==='s'?m.a<25:Z==='m'?m.a>=25&&m.a<=35:m.a>35)));
g('cgrid').innerHTML=L.map(m=>`<article class="cc" data-c="${m.c}"><div class="cc-img" style="background-image:url('${m.img[0]}')"><span class="tagS">Seria ${m.s} · ${m.sn}</span>${m.p?'<span class="stock">În stoc</span>':''}</div>
<div class="cc-b"><div class="cc-h"><h4>${m.c}</h4><b>${fmt(m.a)}</b></div><div class="cc-d">${m.d}</div><div class="cc-l">${m.l}</div>
<div class="cc-f"><span class="cc-p ${m.p?'':'req'}">${m.p?m.p+' cu TVA':'Preț la comandă'}</span><span class="more">Detalii →</span></div></div></article>`).join('')||'<p class="note">Niciun model pentru filtrul ales.</p>';
g('cgrid').querySelectorAll('.cc').forEach(el=>el.onclick=()=>open(el.dataset.c));}
document.querySelectorAll('#cfilters .cf').forEach(b=>b.onclick=()=>{if(b.dataset.f){F=b.dataset.f;document.querySelectorAll('#cfilters [data-f]').forEach(x=>x.classList.toggle('on',x===b))}else{Z=Z===b.dataset.z?null:b.dataset.z;document.querySelectorAll('#cfilters [data-z]').forEach(x=>x.classList.toggle('on',x.dataset.z===Z))}render()});
function open(c){const m=D.find(x=>x.c===c);if(!m)return;g('cmser').textContent='Seria '+m.s+' · '+m.sn;g('cmname').textContent=m.c;g('cmdesc').textContent=m.t;
g('cma').textContent=fmt(m.a);g('cmd').textContent=m.d;g('cml').textContent=m.l;g('cmp').textContent=m.p?m.p+' cu TVA (în stoc)':'La comandă: preț pe ofertă';
const show=i=>{g('cmimg').src=m.img[i];g('cmth').querySelectorAll('button').forEach((b,j)=>b.classList.toggle('on',j===i))};
g('cmth').innerHTML=m.img.length>1?m.img.map((s,i)=>`<button data-i="${i}"><img src="${s}" alt=""></button>`).join(''):'';
g('cmth').querySelectorAll('button').forEach(b=>b.onclick=()=>show(+b.dataset.i));show(0);
g('cmcta').href='https://wa.me/40731166070?text='+encodeURIComponent('Bună! Aș dori o ofertă pentru modelul '+m.c+' ('+fmt(m.a)+', '+m.l+'). Locația mea: ');
g('cmodal').classList.add('on');g('cmodal').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';}
function close(){g('cmodal').classList.remove('on');g('cmodal').setAttribute('aria-hidden','true');document.body.style.overflow='';}
g('cmx').onclick=close;g('cmodal').onclick=e=>{if(e.target.id==='cmodal')close()};addEventListener('keydown',e=>{if(e.key==='Escape')close()});
const sel=document.querySelector('#form select[name=model]');if(sel){sel.innerHTML='<option>X7 (în stoc)</option>'+D.filter(m=>m.c!=='X7').map(m=>`<option>${m.c} · ${fmt(m.a)} (la comandă)</option>`).join('')+'<option>Am nevoie de ajutor să aleg</option>'}
render();})();
