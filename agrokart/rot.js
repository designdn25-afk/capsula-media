/* rotire 360: trage, sageti sau cursor */
(function(){
  var N=+document.getElementById("rot").dataset.n,dirBaza=document.getElementById("rot").dataset.dir, cutie=document.getElementById("rot"), c=document.getElementById("rot-c"),
      ctx=c.getContext("2d"), sl=document.getElementById("rot-sl"), bar=document.getElementById("rot-bar"),
      ind=document.getElementById("rot-ind"), prima=document.getElementById("rot-prima");
  var mic=Math.min(window.innerWidth,window.innerHeight)<700;
  var dir=mic?dirBaza+"m/":dirBaza, pas=mic?2:1;
  var cadre=new Array(N), gata=0, total=0, cur=0, pornit=false;
  sl.max=N-1;
  function nume(i){return dir+("00"+i).slice(-3)+".webp";}
  function arata(i){
    i=((Math.round(i)%N)+N)%N; cur=i;
    var k=i; if(!cadre[k]||!cadre[k].ok){ // cel mai apropiat cadru incarcat
      for(var d=1;d<N;d++){var a=(i+d)%N,b=(i-d+N)%N;
        if(cadre[a]&&cadre[a].ok){k=a;break;} if(cadre[b]&&cadre[b].ok){k=b;break;}}
    }
    var im=cadre[k]; if(im&&im.ok){
      if(c.width!==im.naturalWidth){c.width=im.naturalWidth;c.height=im.naturalHeight;}
      ctx.drawImage(im,0,0); prima.style.visibility="hidden";
    }
    sl.value=i;
  }
  function incarca(){
    if(pornit)return; pornit=true;
    var ordine=[]; for(var i=0;i<N;i+=pas)ordine.push(i);
    // intai rar (tot cercul repede), apoi restul
    ordine.sort(function(a,b){return (a%8===0?0:a%4===0?1:2)-(b%8===0?0:b%4===0?1:2)||a-b;});
    total=ordine.length; var q=0;
    function urm(){
      if(q>=ordine.length)return; var i=ordine[q++], im=new Image();
      im.onload=function(){im.ok=true;cadre[i]=im;gata++;bar.style.width=(100*gata/total)+"%";
        if(gata===total)bar.style.opacity=0; if(i===cur)arata(cur); urm();};
      im.onerror=urm; im.src=nume(i);
    }
    for(var p=0;p<4;p++)urm();
  }
  if("IntersectionObserver" in window){
    new IntersectionObserver(function(e,o){if(e[0].isIntersecting){incarca();o.disconnect();}},{rootMargin:"600px"}).observe(cutie);
  } else incarca();

  var x0=null, c0=0;
  cutie.addEventListener("pointerdown",function(e){x0=e.clientX;c0=cur;cutie.classList.add("trage");
    cutie.setPointerCapture(e.pointerId);ind.style.opacity=0;incarca();});
  cutie.addEventListener("pointermove",function(e){if(x0===null)return;
    var w=cutie.clientWidth; arata(c0+(e.clientX-x0)/w*N*0.9);});
  function sus(){x0=null;cutie.classList.remove("trage");}
  cutie.addEventListener("pointerup",sus); cutie.addEventListener("pointercancel",sus);
  sl.addEventListener("input",function(){ind.style.opacity=0;incarca();arata(+sl.value);});

  function tine(btn,semn){
    var t=null;
    function pasul(){arata(cur+semn*2);}
    function start(e){e.preventDefault();ind.style.opacity=0;incarca();pasul();t=setInterval(pasul,45);}
    function stop(){clearInterval(t);t=null;}
    btn.addEventListener("pointerdown",start);
    ["pointerup","pointerleave","pointercancel"].forEach(function(n){btn.addEventListener(n,stop);});
    btn.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();arata(cur+semn*4);}});
  }
  tine(document.getElementById("rot-st"),-1); tine(document.getElementById("rot-dr"),1);
})();
