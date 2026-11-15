/* Navegação principal e passeio contextual pelo PsicoMoodle. */
(()=>{
'use strict';
function setup(){
 // Celulares ficam somente na vertical; tablets podem continuar na horizontal.
 if(!document.getElementById('pm-phone-portrait-css')){
  const link=document.createElement('link');
  link.id='pm-phone-portrait-css';link.rel='stylesheet';
  link.href='phone-portrait-only.css?v=20261115-1';
  document.head.appendChild(link);
 }
 if(!document.getElementById('pm-phone-portrait-js')){
  const script=document.createElement('script');
  script.id='pm-phone-portrait-js';script.src='phone-portrait-only.js?v=20261115-1';
  script.async=true;document.head.appendChild(script);
 }
 const nav=document.getElementById('nav');
 if(nav){
  const anchor=nav.querySelector('.nav-upcoming')||nav.querySelector('[data-page="admin"]')||null;
  for(const page of ['home','calendar','exams','messages','ai']){
   const node=nav.querySelector('[data-page="'+page+'"]');
   if(node)nav.insertBefore(node,anchor);
  }
 }
 // Marca e nome: atalhos discretos para Início, sem atualizar toda a página.
 // Funciona tanto no cabeçalho compacto quanto na barra lateral desktop.
 for(const identity of document.querySelectorAll('.mobile-brand > .mobile-identity, #siteSidebar > .logo')){
  identity.classList.add('pm-home-brand-link');
  identity.setAttribute('role','link');
  identity.setAttribute('tabindex','0');
  identity.setAttribute('aria-label','Ir para o Início do PsicoMoodle');
  const goHome=()=>{
   const home=document.querySelector('#nav [data-page="home"]');
   if(!home)return;
   home.click();
   window.pmMobileDrawer?.close?.();
   window.scrollTo({top:0,behavior:'instant'});
  };
  identity.addEventListener('click',goHome);
  identity.addEventListener('keydown',event=>{
   if(event.key!=='Enter'&&event.key!==' ')return;
   event.preventDefault();
   goHome();
  });
 }
 if(!document.getElementById('pm-tutorial-styles')){
  const style=document.createElement('link');
  style.id='pm-tutorial-styles';
  style.rel='stylesheet';
  style.href='spotlight-tour.css?v=20261115-smooth-mobile-v29';
  document.head.appendChild(style);
 }
 if(!document.getElementById('pm-ai-sidebar-polish')){
  const link=document.createElement('link');
  link.id='pm-ai-sidebar-polish';
  link.rel='stylesheet';
  link.href='ia-sidebar-polish.css?v=20261114-1';
  document.head.appendChild(link);
 }
 if(!document.getElementById('pm-voice-style')){
  const style=document.createElement('link');
  style.id='pm-voice-style';style.rel='stylesheet';
  style.href='voice-dictation.css?v=20261114-v1';
  document.head.appendChild(style);
 }
 if(!document.getElementById('pm-voice-script')){
  const script=document.createElement('script');
  script.id='pm-voice-script';script.src='voice-dictation.js?v=20261114-v2';
  script.async=true;document.head.appendChild(script);
 }
 if(!document.getElementById('pm-course-manager-script')){
  const script=document.createElement('script');
  script.id='pm-course-manager-script';
  script.src='course-week-manager.js?v=20261114-editor-v6';
  script.async=true;document.head.appendChild(script);
 }
 if(!document.getElementById('pm-course-manager-style')){
  const css=document.createElement('link');
  css.id='pm-course-manager-style';css.rel='stylesheet';
  css.href='course-week-manager.css?v=20261114-editor-v6';
  document.head.appendChild(css);
 }
 if(!document.getElementById('pm-tutorial-script')){
  const script=document.createElement('script');
  script.id='pm-tutorial-script';
  script.src='spotlight-tour.js?v=20261115-flicker-fixed-v32';
  script.async=true;
  document.head.appendChild(script);
 }
 if(!document.getElementById('pm-podcast-mini-styles')){
  const link=document.createElement('link');
  link.id='pm-podcast-mini-styles';
  link.rel='stylesheet';
  link.href='podcast-mini.css?v=20261114-podcast-mini-v2';
  document.head.appendChild(link);
 }
 if(!document.getElementById('pm-podcast-mini-script')){
  const script=document.createElement('script');
  script.id='pm-podcast-mini-script';
  script.src='podcast-mini.js?v=20261114-podcast-mini-v2';
  script.async=true;
  document.head.appendChild(script);
 }
 if(!document.getElementById('pm-flashcards-tour-style')){
  const css=document.createElement('link');
  css.id='pm-flashcards-tour-style';
  css.rel='stylesheet';
  css.href='flashcards-tour.css?v=20261114-flash-tour-v1';
  document.head.appendChild(css);
 }
 if(!document.getElementById('pm-chat-mobile-css')){
  const link=document.createElement('link');
  link.id='pm-chat-mobile-css';
  link.rel='stylesheet';
  link.href='chat-mobile-refinement.css?v=20261114-chat-mobile-v21';
  document.head.appendChild(link);
 }
 if(!document.getElementById('pm-chat-mobile-js')){
  const script=document.createElement('script');
  script.id='pm-chat-mobile-js';
  script.src='chat-mobile-viewport.js?v=20261114-chat-mobile-v21';
  script.async=true;
  document.head.appendChild(script);
 }
 if(!document.getElementById('pm-mobile-drawer-css')){
  const link=document.createElement('link');
  link.id='pm-mobile-drawer-css';
  link.rel='stylesheet';
  link.href='mobile-drawer.css?v=20261114-smooth-locked-v18';
  document.head.appendChild(link);
 }
 if(!document.getElementById('pm-mobile-drawer-js')){
  const script=document.createElement('script');
  script.id='pm-mobile-drawer-js';
  script.src='mobile-drawer.js?v=20261114-smooth-locked-v18';
  script.async=true;
  document.head.appendChild(script);
 }
 if(!document.getElementById('pm-flashcards-tour-script')){
  const script=document.createElement('script');
  script.id='pm-flashcards-tour-script';
  script.src='flashcards-tour.js?v=20261114-flash-tour-v1';
  script.async=true;
  document.head.appendChild(script);
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});
else setup();
})();

/* Detecta novas publicações, sem interromper simulados ou conversas. */
(()=>{
'use strict';
if(window.__siteVersionWatcher)return;window.__siteVersionWatcher=true;
const version=document.querySelector('meta[name="app-build"]')?.content||'';
if(!version)return;
let notified=false,checking=false;
function reload(version){
 const url=new URL(location.href);
 url.searchParams.set('versao',String(version).slice(0,12));
 window.location.replace(url.toString());
}
function promptUpdate(version){
 if(notified)return;notified=true;
 const bar=document.createElement('div');bar.id='site-update-notice';
 bar.setAttribute('role','status');
 bar.style.cssText='position:fixed;bottom:16px;right:16px;z-index:20000;max-width:min(350px,calc(100vw - 32px));background:var(--paper,#fff);color:var(--ink,#2a2636);border:1px solid var(--line,#ccc);border-radius:13px;padding:13px 15px;box-shadow:0 10px 36px #0003;font-size:12px;display:flex;align-items:center;gap:12px';
 const label=document.createElement('span');label.textContent='Há uma versão mais recente do site disponível.';
 const action=document.createElement('button');action.type='button';action.textContent='Atualizar';
 action.style.cssText='background:var(--accent,#715fc0);color:#fff;padding:9px 11px;border:0;border-radius:8px;cursor:pointer;font:inherit;font-weight:800';
 action.addEventListener('click',()=>reload(version));
 bar.append(label,action);document.body.appendChild(bar);
}
async function check(){
 if(checking||document.hidden)return;
 checking=true;
 try{
  const res=await fetch('./site-version.txt?v='+Date.now(),{cache:'no-store'});
  if(!res.ok)return;
  const latest=(await res.text()).trim();
  if(!/^[a-f0-9]{40}$/.test(latest)||latest===version)return;
  const current=document.querySelector('[data-page].active')?.dataset.page||'';
  const safe=['home','library'].includes(current)&&!document.querySelector('input[type="file"]:focus');
  if(safe)reload(latest);else promptUpdate(latest);
 }catch(_){}
 finally{checking=false;}
}
window.addEventListener('focus',check);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)check()});
setInterval(check,90000);
setTimeout(check,15000);
})();


/* Navegação resumida por visita, carregada para estudantes e visitantes. */
(()=>{
 'use strict';
 const setup=()=>{
  if(document.getElementById('pm-visit-path-js'))return;
  const script=document.createElement('script');
  script.id='pm-visit-path-js';script.src='visit-path.js?v=20261115-dispositivos-v4';
  script.async=true;document.head.appendChild(script);
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});
 else setup();
})();

/* Revisão de Férias: entrada única; segue o semestre selecionado no menu existente. */
(()=>{
 'use strict';
 const setup=()=>{
  if(!document.getElementById('pm-vacation-timeline-css')){
   const css=document.createElement('link');
   css.id='pm-vacation-timeline-css';css.rel='stylesheet';
   css.href='revisao-ferias.css?v=20261114-direct-documents-v1';
   document.head.appendChild(css);
  }
  if(!document.getElementById('pm-vacation-timeline-js')){
   const js=document.createElement('script');
   js.id='pm-vacation-timeline-js';
   js.src='revisao-ferias.js?v=20261115-flicker-fixed-v5';
   js.async=true;document.head.appendChild(js);
  }
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});
 else setup();
})();
/* Carrega painel de Saúde do Site somente na interface administrativa. */
(()=>{const load=()=>{if(document.getElementById('pm-site-health-panel-script'))return;const s=document.createElement('script');s.id='pm-site-health-panel-script';s.src='site-health-panel.js?v=20261114-v1';s.async=true;document.head.appendChild(s)};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load()})();


/* Caderno: acesso visual exclusivo ao administrador; página de teste isolada. */
(()=>{
 'use strict';
 const STYLE_ID='uentzoul-notebook-preview-style',NAV_ID='navCadernoPreview',FRAME_ID='uentzoulCadernoFrame';
 let previewOpen=false;
 const admin=()=>window.uentzoulAdminConfig?.isAdmin?.()===true&&!!window.uentzoulAIAuth?.user?.()?.id;
 const nav=()=>document.getElementById('nav');
 const main=()=>document.getElementById('main');
 function addStyles(){
  if(document.getElementById(STYLE_ID))return;
  const css=document.createElement('style');css.id=STYLE_ID;
  css.textContent=
   '#nav #navCadernoPreview{display:flex;align-items:center;gap:9px;min-width:0;position:relative;cursor:pointer;}'+
   '#nav .nb-preview-label{margin-left:auto;font-size:9px;font-weight:800;letter-spacing:.2px;white-space:nowrap;padding:3px 6px;border-radius:6px;color:#8067b6;background:#ece5f8;}'+
   '#navUpcomingFloatingTip{display:none!important}#nav #navCadernoPreview.active{background:color-mix(in srgb,#7964b9 14%,var(--paper));border-color:color-mix(in srgb,#7964b9 36%,transparent)}'+
   '#nav #navCadernoPreview[hidden]{display:none!important}'+
   '#main.nb-shell-active{max-width:none!important;width:100%!important;padding:8px 10px!important;overflow:hidden;}'+
   '#main #uentzoulCadernoFrame{display:block;width:100%;height:calc(100dvh - 12px);min-height:0;border:1px solid #e3ddeb;border-radius:16px;background:#f3f1f9;box-shadow:0 10px 32px #342c4715;}'+
   '@media(max-width:760px){#main.nb-shell-active{padding:4px!important;}#main #uentzoulCadernoFrame{height:calc(100dvh - 12px);min-height:0;border-radius:12px}#nav #navCadernoPreview .nb-preview-label{font-size:9px;padding:2px 5px}}';
  document.head.appendChild(css);
 }
 function fitNotebookHeight(){
  if(!previewOpen)return;
  const frame=document.getElementById(FRAME_ID);
  if(!frame)return;
  const top=frame.getBoundingClientRect().top;
  const h=Math.max(380,Math.floor(window.innerHeight-top-6));
  frame.style.height=h+'px';
 }
 function deactivate(){
  previewOpen=false;main()?.classList.remove('nb-shell-active');
  document.getElementById(NAV_ID)?.classList.remove('active');
 }
 function openPreview(){
  if(!admin())return;
  const target=main();if(!target)return;
  previewOpen=true;addStyles();
  target.classList.add('nb-shell-active');
  target.innerHTML='<iframe id="'+FRAME_ID+'" title="Caderno de aula — prévia administrativa" src="./caderno.html?v=20261115-caderno-v7" loading="eager" referrerpolicy="same-origin"></iframe>';
  document.querySelectorAll('#nav [data-page].active').forEach(n=>n.classList.remove('active'));
  document.getElementById(NAV_ID)?.classList.add('active');
  window.pmMobileDrawer?.close?.();
  try{window.scrollTo({top:0,behavior:'instant'})}catch(_){}
  requestAnimationFrame(fitNotebookHeight);
  setTimeout(fitNotebookHeight,180);
 }
 function harmonizeUpcoming(){
  const jobs=document.querySelector('#nav .nav-upcoming');
  if(!jobs)return;
  jobs.querySelector('.nav-upcoming-tip')?.remove();
  jobs.removeAttribute('title');
  if(!jobs.querySelector('.nb-preview-label')){
   const badge=document.createElement('span');
   badge.className='nb-preview-label';badge.textContent='Em breve';
   badge.setAttribute('aria-hidden','true');jobs.appendChild(badge);
  }
 }
 function sync(){
  const el=nav();if(!el)return;
  addStyles();harmonizeUpcoming();
  let button=document.getElementById(NAV_ID);
  if(!button){
   button=document.createElement('button');button.type='button';button.id=NAV_ID;
   button.className='sidebtn nav-caderno';button.title='Caderno · prévia administrativa';
   button.setAttribute('aria-label','Caderno de aula, prévia disponível para administrador');
   button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h14v18H5zM9 3v18M12 8h4M12 12h4M12 16h4"/></svg>'+
    '<span class="nav-label">Caderno</span><span class="nb-preview-label">Em breve</span>';
   button.addEventListener('click',openPreview);
  }
  const exam=el.querySelector('[data-page="exams"]');
  if(button.parentNode!==el||exam?.nextElementSibling!==button){
   if(exam)exam.after(button);else el.appendChild(button);
  }
  const allowed=admin();
  if(previewOpen)fitNotebookHeight();
  button.hidden=!allowed;button.style.display=allowed?'':'none';
  if(previewOpen&&!allowed){
   deactivate();
   window.uentzoulAdminBridge?.refreshCurrent?.();
  }
 }
 function setup(){
  if(!nav()||!main())return;
  sync();
  const observer=new MutationObserver(()=>{
   if(previewOpen&&!document.getElementById(FRAME_ID))deactivate();
  });
  observer.observe(main(),{childList:true});
  window.addEventListener('uentzoul:auth',()=>{sync();setTimeout(sync,420)});
  window.addEventListener('focus',sync);
  window.addEventListener('resize',fitNotebookHeight,{passive:true});
  setInterval(sync,2300);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});
 else setup();
})();
