const body=document.body;body.classList.add('loading');
const resetInitialScroll=()=>{if(!location.hash)scrollTo(0,0)};
addEventListener('pageshow',resetInitialScroll);
window.addEventListener('load',()=>{setTimeout(()=>{document.querySelector('.loader').classList.add('done');body.classList.remove('loading');body.classList.add('ready');requestAnimationFrame(resetInitialScroll)},450)});
const header=document.querySelector('.site-header');
addEventListener('scroll',()=>header.classList.toggle('scrolled',scrollY>40),{passive:true});
const toggle=document.querySelector('.menu-toggle'),nav=document.querySelector('#global-nav');
function setMenu(open){
  if(!toggle||!nav)return;
  toggle.classList.toggle('open',open);
  nav.classList.toggle('open',open);
  body.classList.toggle('nav-open',open);
  toggle.setAttribute('aria-expanded',String(open));
  toggle.setAttribute('aria-label',open?'メニューを閉じる':'メニューを開く');
}
if(toggle&&nav){
  toggle.addEventListener('click',()=>setMenu(!nav.classList.contains('open')));
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
  addEventListener('keydown',e=>{if(e.key==='Escape')setMenu(false)});
  addEventListener('resize',()=>{if(innerWidth>900)setMenu(false)},{passive:true});
}
const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');if(entry.target.classList.contains('story'))entry.target.classList.add('in-view');observer.unobserve(entry.target)}}),{threshold:.14});
document.querySelectorAll('.reveal-up,.reveal-mask,.story').forEach(el=>observer.observe(el));
setTimeout(()=>document.querySelectorAll('.reveal-mask').forEach(el=>el.classList.add('visible')),1400);
const tabs=document.querySelectorAll('[data-tab]'),panels=document.querySelectorAll('[data-panel]');
function openTab(name){tabs.forEach(t=>t.classList.toggle('active',t.dataset.tab===name));panels.forEach(p=>p.classList.toggle('active',p.dataset.panel===name))}
tabs.forEach(tab=>tab.addEventListener('click',()=>openTab(tab.dataset.tab)));
document.querySelectorAll('[data-open-tab]').forEach(link=>link.addEventListener('click',()=>openTab(link.dataset.openTab)));
const parallaxEls=[...document.querySelectorAll('[data-parallax]')];
let ticking=false;function parallax(){const y=scrollY;parallaxEls.forEach(el=>{const rect=el.parentElement.getBoundingClientRect();const rate=Number(el.dataset.parallax);if(rect.bottom>0&&rect.top<innerHeight)el.style.transform=`translate3d(0,${(rect.top-innerHeight/2)*rate}px,0) scale(1.08)`});ticking=false}
addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(parallax);ticking=true}},{passive:true});parallax();
const cursor=document.querySelector('.cursor');if(matchMedia('(pointer:fine)').matches){addEventListener('mousemove',e=>{cursor.style.left=e.clientX+'px';cursor.style.top=e.clientY+'px'});document.querySelectorAll('a,button,.menu-row').forEach(el=>{el.addEventListener('mouseenter',()=>cursor.classList.add('hover'));el.addEventListener('mouseleave',()=>cursor.classList.remove('hover'))})}
