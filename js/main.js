// GİRİŞ SEKANSI
const loader=document.getElementById('loader');
const ldPct=document.getElementById('ldPct');
let ldDone=false;
// Perde oturumda BİR kez. İkinci ziyarette beklemek gösteriş değil, gecikmedir.
const seenBefore=(()=>{try{return sessionStorage.getItem('kayraSeen')==='1'}catch(e){return false}})();
if(seenBefore){
  if(loader){loader.style.transition='none';loader.remove()}
  document.body.classList.remove('pre');document.body.classList.add('ready');
  ldDone=true;
}else{
  const t0=performance.now(),dur=1050;
  (function tick(t){
    const p=Math.min((t-t0)/dur,1),e=1-Math.pow(1-p,2);
    if(ldPct)ldPct.textContent=Math.round(e*100);
    if(p<1&&!ldDone)requestAnimationFrame(tick);else{ldDone=true;siteReady()}
  })(t0);
  setTimeout(siteReady,2500);
}
function siteReady(){
  if(!document.body.classList.contains('pre'))return;
  if(ldPct)ldPct.textContent=100;
  document.body.classList.remove('pre');document.body.classList.add('ready');
  loader.classList.add('done');
  setTimeout(()=>loader&&loader.remove(),850);
  try{sessionStorage.setItem('kayraSeen','1')}catch(e){}
}

// MARQUEE ikizle
const mq=document.getElementById('mqTrack');
if(mq)mq.innerHTML+=mq.innerHTML;

// Önce/sonra SÜRGÜSÜ kaldırıldı (2026-07-26): ikili kadraja geçildi, sürücü JS'e gerek kalmadı.

// FİLM ŞERİDİ — kesintisiz döngü için ikizle
const strip=document.getElementById('strip');
if(strip)strip.innerHTML+=strip.innerHTML;

// LIGHTBOX — kart ve şerit görselleri tıklayınca büyür
const lb=document.getElementById('lb'),lbImg=lb.querySelector('img');
function openLB(src,alt){lbImg.src=src;lbImg.alt=alt||'';lb.classList.add('open');document.body.style.overflow='hidden'}
function closeLB(){lb.classList.remove('open');lbImg.removeAttribute('src');document.body.style.overflow=''}
lb.addEventListener('click',closeLB);
addEventListener('keydown',e=>{if(e.key==='Escape')closeLB()});
document.querySelectorAll('.card .ph img,.rise-fr img,.diptych img').forEach(el=>{
  el.classList.add('zoomable');
  el.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openLB(el.src,el.alt)});
});

// SAYAÇLAR (8 / 3 / 610)
const statIo=new IntersectionObserver(es=>es.forEach(en=>{
  if(!en.isIntersecting)return;statIo.unobserve(en.target);
  const b=en.target,target=parseInt(b.textContent,10);if(isNaN(target))return;
  if(matchMedia('(prefers-reduced-motion:reduce)').matches){return}
  const suffix=b.querySelector('i')?b.querySelector('i').outerHTML:'';
  const t0=performance.now(),dur=1300;
  (function tick(t){const p=Math.min((t-t0)/dur,1),e=1-Math.pow(1-p,3);
    b.innerHTML=Math.round(target*e)+suffix;
    if(p<1)requestAnimationFrame(tick)})(t0);
  setTimeout(()=>{b.innerHTML=target+suffix},dur+200);
}),{threshold:.6});
document.querySelectorAll('.stat b,.hstat b').forEach(b=>statIo.observe(b));

// NAV + parallax + başlık derinliği + progress (tek rAF)
const hd=document.getElementById('hd');
const heroTitle=document.querySelector('.display'),progressBar=document.getElementById('progressBar');
const heroInner=document.querySelector('.hero-inner');
const noMotion=matchMedia('(prefers-reduced-motion:reduce)').matches;
let lastY=0,tick2=false;
addEventListener('scroll',()=>{
  if(tick2)return;tick2=true;
  requestAnimationFrame(()=>{
    hd.classList.toggle('solid',scrollY>40);
    hd.classList.toggle('hidden',scrollY>340&&scrollY>lastY);
    if(!noMotion&&scrollY<innerHeight){
      if(heroTitle)heroTitle.style.transform='translateY('+(scrollY*.08)+'px)';
      // kapak metni sinematik çıkış yapar: kaydırdıkça geride kalır
      if(heroInner)heroInner.style.opacity=Math.max(0,1-scrollY/(innerHeight*.62));
    }
    if(progressBar){
      const max=document.documentElement.scrollHeight-innerHeight;
      progressBar.style.transform='scaleX('+(max>0?scrollY/max:0)+')';
    }
    riseUpdate();
    lastY=scrollY;tick2=false;
  });
},{passive:true});
hd.classList.toggle('solid',scrollY>40);

/* ============================================================
   YÜKSELİŞ — kaydırmaya bağlı yapışkan sekans.
   Scroll-jack YOK: sayfa normal akar, biz sadece track içindeki
   ilerleme oranını okuyup hangi karenin görüneceğine karar veririz.
   ============================================================ */
const riseTrack=document.querySelector('.rise-track'),
      riseFrames=Array.from(document.querySelectorAll('.rise-fr')),
      riseSteps=Array.from(document.querySelectorAll('#riseSteps li')),
      riseMeter=document.getElementById('riseMeter'),
      riseNum=document.getElementById('riseNum');
let riseCur=-1;
function riseUpdate(){
  if(!riseTrack||!riseFrames.length)return;
  const r=riseTrack.getBoundingClientRect(),span=r.height-innerHeight;
  if(span<=0)return;
  const p=Math.min(Math.max(-r.top/span,0),1);
  if(riseMeter)riseMeter.style.height=(p*100).toFixed(1)+'%';
  const i=Math.min(riseFrames.length-1,Math.floor(p*riseFrames.length));
  if(i===riseCur)return;
  riseCur=i;
  riseFrames.forEach((f,k)=>f.classList.toggle('on',k===i));
  riseSteps.forEach((s,k)=>{s.classList.toggle('on',k===i);s.classList.toggle('past',k<i)});
  if(riseNum)riseNum.textContent=String(i+1).padStart(2,'0');
}
riseUpdate();
// KAPAK KARELERİ — 6,5 sn'de bir çapraz geçiş. Sekme arkadayken durur (pil/CPU).
const heroSlides=Array.from(document.querySelectorAll('.hero-bg .hb'));
if(heroSlides.length>1&&!noMotion){
  let hi=0,heroTimer=null;
  const nextHero=()=>{ heroSlides[hi].classList.remove('on'); hi=(hi+1)%heroSlides.length;
    const el=heroSlides[hi]; el.style.animation='none';void el.offsetWidth;el.style.animation='';
    el.classList.add('on'); };
  const startHero=()=>{if(!heroTimer)heroTimer=setInterval(nextHero,6500)};
  const stopHero=()=>{clearInterval(heroTimer);heroTimer=null};
  addEventListener('visibilitychange',()=>document.hidden?stopHero():startHero());
  startHero();
}

// ÖZEL İMLEÇ KALDIRILDI (2026-07-25, müşteri kararı): imleç halkası
// hem dikkat dağıtıyordu hem de Apple/Netflix tipografi yönüyle çelişiyordu.
// Sistem imleci kullanılıyor; rAF döngüsü de böylece kapandı.

// MIKNATISLI BUTONLAR
if(matchMedia('(hover:hover) and (pointer:fine)').matches&&!noMotion){
  document.querySelectorAll('.hero-ctas .btn,.nav-cta').forEach(b=>{
    b.addEventListener('mousemove',e=>{
      const r=b.getBoundingClientRect();
      const dx=(e.clientX-r.left-r.width/2)/r.width,dy=(e.clientY-r.top-r.height/2)/r.height;
      b.style.transform='translate('+(dx*8)+'px,'+(dy*6)+'px)';
    });
    b.addEventListener('mouseleave',()=>{b.style.transform=''});
  });
}

function toggleMenu(){document.getElementById('mnav').classList.toggle('open')}
function setLang(l){
  document.documentElement.lang=l;
  document.querySelectorAll('[data-tr]').forEach(el=>{
    const tr=el.getAttribute('data-tr');
    let v;
    if(l==='tr')v=tr;
    else if(l==='en')v=el.getAttribute('data-en')||tr;
    else v=RU[tr]||RU[tr.replace(/&/g,'&amp;')]||el.getAttribute('data-en')||tr;
    if(el.tagName==='INPUT'||el.tagName==='TEXTAREA'){el.placeholder=v.replace(/<[^>]*>/g,'');}
    else{el.innerHTML=v;}
  });
  ['tr','en','ru'].forEach(x=>document.getElementById('l-'+x).classList.toggle('on',x===l));
}
// PORTFÖY BULUCU — üç seçim, çıktısı hazır WhatsApp mesajı.
// data-v değerleri bilerek Türkçe: mesaj firmanın telefonuna gidiyor.
const finder=document.getElementById('finder');
if(finder){
  const pick={},sum=document.getElementById('finderSum');
  function finderRefresh(){
    finder.querySelectorAll('.chips').forEach(g=>{
      const on=g.querySelector('button.on');
      pick[g.dataset.k]=on?on.dataset.v:'';
    });
    if(sum)sum.innerHTML='<b>'+[pick.tip,pick.bolge,pick.butce].filter(Boolean).join(' · ')+'</b>';
  }
  finder.querySelectorAll('.chips button').forEach(b=>b.onclick=()=>{
    Array.from(b.parentElement.children).forEach(x=>x.classList.remove('on'));
    b.classList.add('on');finderRefresh();
  });
  finderRefresh();
  document.getElementById('finderGo').onclick=()=>{
    const l=document.documentElement.lang||'tr',s=[pick.tip,pick.bolge,pick.butce].join(' · ');
    const txt=l==='en'?`Hello, I'm looking for: ${s}. Could you send me the matching homes?`
             :l==='ru'?`Здравствуйте! Ищу: ${s}. Пришлите, пожалуйста, подходящие варианты.`
             :`Merhaba, şunu arıyorum: ${s}. Uygun evleri gönderebilir misiniz?`;
    window.open('https://wa.me/905338298030?text='+encodeURIComponent(txt),'_blank');
  };
}
// İletişim formu kaldırıldı (2026-07-29, müşteri kararı): her CTA doğrudan
// WhatsApp'a gidiyor, form fazlalıktı. sendWA() de gereksiz kaldı.
// reveal
const io=new IntersectionObserver((es)=>es.forEach(en=>{if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target)}}),{threshold:.12});
document.querySelectorAll('.rv').forEach(el=>io.observe(el));
