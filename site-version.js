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
  // Navegação no mesmo alinhamento desde o primeiro quadro.
  // Não remover e reinserir todos os botões ao carregar: isso causava o flick.
  const anchor=nav.querySelector('.nav-upcoming')||nav.querySelector('[data-page="admin"]')||null;
  const items=[
   nav.querySelector('[data-page="home"]'),
   nav.querySelector('[data-page="calendar"]'),
   nav.querySelector('[data-page="exams"]'),
   nav.querySelector('#navCadernoPreview'),
   nav.querySelector('[data-page="messages"]'),
   nav.querySelector('[data-page="ai"]'),
   nav.querySelector('#navVacationReview')
  ].filter(Boolean);
  let next=anchor;
  for(const node of items.reverse()){
   if(node.nextElementSibling!==next)nav.insertBefore(node,next);
   next=node;
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
  script.src='spotlight-tour.js?v=20261116-flicker-fixed-v33';
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
  // Atualizar sem consentimento recriava o DOM inteiro enquanto a pessoa estudava.
  // Nunca recarregar automaticamente; o usuário escolhe quando aplicar a nova versão.
  promptUpdate(latest);
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
   css.href='revisao-ferias.css?v=20261116-static-nav-no-flash-v6';
   document.head.appendChild(css);
  }
  if(!document.getElementById('pm-vacation-timeline-js')){
   const js=document.createElement('script');
   js.id='pm-vacation-timeline-js';
   js.src='revisao-ferias.js?v=20261116-review-click-stable-v7';
   js.async=true;document.head.appendChild(js);
  }
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});
 else setup();
})();
/* Carrega painel de Saúde do Site somente na interface administrativa. */
(()=>{const load=()=>{if(document.getElementById('pm-site-health-panel-script'))return;const s=document.createElement('script');s.id='pm-site-health-panel-script';s.src='site-health-panel.js?v=20261114-v1';s.async=true;document.head.appendChild(s)};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load()})();


/* Caderno público para contas cadastradas; cada pessoa tem suas próprias anotações. */
(()=>{
 'use strict';
 const STYLE_ID='uentzoul-notebook-preview-style',NAV_ID='navCadernoPreview',FRAME_ID='uentzoulCadernoFrame';
 let previewOpen=false,lastExplicitNav=0,permissionLostSince=0,pendingOpenAfterLogin=false;
 const account=()=>{const u=window.uentzoulAIAuth?.user?.();return u?.id&&u.is_anonymous!==true?u:null;};
 const loggedIn=()=>!!account();
 // A restrição é pelo tipo de aparelho, não apenas pela largura da janela.
 // iPad e tablets Android continuam disponíveis, mesmo com viewport estreito.
 function isNotebookPhone(){
  const ua=String(navigator.userAgent||''),platform=String(navigator.platform||'');
  const touches=Number(navigator.maxTouchPoints)||0;
  const shortSide=Math.min(screen.width||0,screen.height||0);
  if(/iPad|Tablet|Kindle|Silk|PlayBook|Nexus 7|Nexus 10/i.test(ua)||
    (/Android/i.test(ua)&&!/Mobile/i.test(ua))||
    (/MacIntel|Macintosh/i.test(platform+' '+ua)&&touches>1))return false;
  if(/iPhone|iPod|Windows Phone|IEMobile|Android[^)]*Mobile|Mobile/i.test(ua))return true;
  if(navigator.userAgentData?.mobile===true)return true;
  return !!(window.matchMedia?.('(pointer: coarse)')?.matches&&touches>0&&shortSide>0&&shortSide<600);
 }
 const nav=()=>document.getElementById('nav');
 const main=()=>document.getElementById('main');
 const semesters=['2026/1','2026/2','2027/1'];
 function selectedSemester(){
  let value='';
  try{value=window.uentzoulProfileBridge?.semester?.()||
   window.uentzoulLibraryApp?.semester?.()||'';}catch(_){}
  if(!semesters.includes(value)){
   const choice=document.querySelector('#semesterDropdown [data-semester].active');
   value=choice?.getAttribute('data-semester')||'2026/2';
  }
  return semesters.includes(value)?value:'2026/2';
 }
 const notebookUrl=()=>('./caderno.html?v=20261116-caderno-v21-erase-blur-guard&semester='+
   encodeURIComponent(selectedSemester()));
 function addStyles(){
  if(document.getElementById(STYLE_ID))return;
  const css=document.createElement('style');css.id=STYLE_ID;
  css.textContent=
   '#nav #navCadernoPreview{display:flex;align-items:center;gap:9px;min-width:0;position:relative;cursor:pointer;}'+
   '#nav .nb-preview-label{margin-left:auto;font-size:9px;font-weight:800;letter-spacing:.2px;white-space:nowrap;padding:3px 6px;border-radius:6px;color:#8067b6;background:#ece5f8;}'+
   '#navUpcomingFloatingTip{display:none!important}#nav #navCadernoPreview.active{background:color-mix(in srgb,#7964b9 14%,var(--paper));border-color:color-mix(in srgb,#7964b9 36%,transparent)}'+
   '#nav #navCadernoPreview:disabled{opacity:1!important;pointer-events:none;cursor:not-allowed;transform:none!important}'+
   '#main.nb-shell-active{max-width:none!important;width:100%!important;padding:8px 10px!important;overflow:hidden;background:#f3f1f9;}'+
   'html[data-theme="dark"] #main.nb-shell-active{background:#0c1523;}'+
   // Suppress the iframe's white about:blank first paint until the notebook is loaded.
   '#main #uentzoulCadernoFrame{display:block;width:100%;height:calc(100dvh - 12px);min-height:0;border:1px solid #e3ddeb;border-radius:16px;background:#f3f1f9;box-shadow:0 10px 32px #342c4715;opacity:0;visibility:hidden;}'+
   '#main #uentzoulCadernoFrame.nb-frame-ready{opacity:1;visibility:visible;transition:opacity .16s ease-out;}'+
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
  previewOpen=false;permissionLostSince=0;main()?.classList.remove('nb-shell-active');
  document.getElementById(NAV_ID)?.classList.remove('active');
 }
 window.PSICO_NOTEBOOK_ACTIVE=()=>previewOpen;
 // Chamado apenas por navegação real; atualizações em segundo plano não fecham o caderno.
 window.PSICO_NOTEBOOK_CLOSE=deactivate;
 function restoreNotebookIfStolen(){
  if(!previewOpen||document.getElementById(FRAME_ID))return;
  if(performance.now()-lastExplicitNav<1500){deactivate();return;}
  // Atualização de outro painel não pode substituir silenciosamente o Caderno.
  if(loggedIn())openPreview();
  else if(main()){
   main().classList.add('nb-shell-active');
   main().innerHTML='<section role="status" style="padding:34px">Sessão temporariamente indisponível. Entre novamente para abrir o Caderno.</section>';
  }
 }
 function openPreview(){
  if(!loggedIn()){
   pendingOpenAfterLogin=true;
   window.uentzoulAIAuth?.openLogin?.();
   return;
  }
  pendingOpenAfterLogin=false;
  const target=main();if(!target)return;
  previewOpen=true;permissionLostSince=0;addStyles();
  target.classList.add('nb-shell-active');
  target.innerHTML='<iframe id="'+FRAME_ID+'" title="Caderno de aula — anotações privadas" src="'+notebookUrl()+'" data-nb-semester="'+selectedSemester()+'" loading="eager" referrerpolicy="same-origin"></iframe>';
  const frame=document.getElementById(FRAME_ID);
  if(frame)frame.addEventListener('load',()=>{
   // Ignore the iframe's initial about:blank; wait for actual notebook content.
   try{
    const doc=frame.contentDocument;
    if(!doc||doc.readyState!=='complete'||!doc.getElementById('nbRoot')||
       !/\/caderno\.html$/.test(frame.contentWindow.location.pathname))return;
   }catch(_){return}
   requestAnimationFrame(()=>requestAnimationFrame(()=>{
    if(previewOpen&&frame.isConnected)frame.classList.add('nb-frame-ready');
   }));
  });
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
   // Compatibilidade com versões de HTML em cache: na página atual o botão
   // já existe na navegação desde o primeiro quadro renderizado.
   button=document.createElement('button');button.type='button';button.id=NAV_ID;
   button.className='sidebtn nav-caderno';button.title='Caderno · entre ou crie sua conta';
   button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h14v18H5zM9 3v18M12 8h4M12 12h4M12 16h4"/></svg>'+
    '<span class="nav-label">Caderno</span>';
  }
  if(button.dataset.nbBound!=='true'){
   button.addEventListener('click',openPreview);
   button.dataset.nbBound='true';
  }
  const exam=el.querySelector('[data-page="exams"]');
  if(button.parentNode!==el||exam?.nextElementSibling!==button){
   if(exam)exam.after(button);else el.appendChild(button);
  }
  const phone=isNotebookPhone();
  document.documentElement.dataset.pmNotebookPhone=String(phone);
  const allowed=loggedIn();
  if(previewOpen)fitNotebookHeight();
  // O item aparece desde o primeiro instante; visitas sem conta abrem o login.
  button.hidden=false;
  if(button.style.display)button.style.removeProperty('display');
  if(button.style.visibility)button.style.removeProperty('visibility');
  if(button.disabled)button.disabled=false;
  button.querySelector('.nb-preview-label')?.remove();
  const label=allowed?'Abrir meus cadernos de '+selectedSemester():
    'Caderno: entre ou crie uma conta para salvar anotações';
  if(button.getAttribute('aria-label')!==label)button.setAttribute('aria-label',label);
  if(button.getAttribute('aria-disabled')!=='false')button.setAttribute('aria-disabled','false');
  if(button.hasAttribute('aria-hidden'))button.removeAttribute('aria-hidden');
  const title=allowed?'Caderno · minhas anotações':'Caderno · entre ou crie sua conta';
  if(button.title!==title)button.title=title;
  if(previewOpen&&!allowed){
   // Oscilações temporárias de sessão nunca provocam navegação involuntária.
   if(!permissionLostSince)permissionLostSince=Date.now();
   if(Date.now()-permissionLostSince>12000){
    const frame=document.getElementById(FRAME_ID);
    if(frame&&!frame.dataset.nbLocked){
     frame.dataset.nbLocked='true';
     frame.setAttribute('title','Caderno indisponível sem sessão autenticada');
     frame.srcdoc='<!doctype html><html lang="pt-BR"><meta charset="utf-8"><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#f3f1f9;color:#483c60;font:600 15px system-ui,sans-serif"><p style="padding:28px;text-align:center">Sessão encerrada. Entre novamente para reabrir o caderno.</p></body></html>';
    }
   }
  }else if(previewOpen){
   permissionLostSince=0;
   const frame=document.getElementById(FRAME_ID);
   if(frame?.dataset.nbLocked==='true')openPreview();
   else if(!frame)requestAnimationFrame(restoreNotebookIfStolen);
  }
 }
 function setup(){
  if(!nav()||!main())return;
  sync();
  const observer=new MutationObserver(()=>{
   if(previewOpen&&!document.getElementById(FRAME_ID))requestAnimationFrame(restoreNotebookIfStolen);
  });
  observer.observe(main(),{childList:true});
  nav().addEventListener('click',event=>{
   if(event.target.closest('[data-page],#navAdminConfig,.nav-upcoming')){
    lastExplicitNav=performance.now();
    // Navegação expressa para outra aba: liberar o painel para a nova tela.
    if(previewOpen)deactivate();
   }
  },true);
  window.addEventListener('popstate',()=>{
   if(previewOpen){lastExplicitNav=performance.now();deactivate();}
  });
  window.addEventListener('uentzoul:auth',()=>{
   sync();setTimeout(()=>{
    sync();
    if(pendingOpenAfterLogin&&loggedIn())openPreview();
   },420);
  });
  window.addEventListener('uentzoul:semester',()=>{
   const frame=document.getElementById(FRAME_ID),semester=selectedSemester();
   if(frame&&previewOpen&&frame.dataset.nbSemester!==semester){
    // A página anterior grava as anotações no pagehide antes da troca.
    frame.classList.remove('nb-frame-ready');
    frame.dataset.nbSemester=semester;frame.src=notebookUrl();
   }
   sync();
  });
  window.addEventListener('focus',sync);
  window.addEventListener('resize',()=>{sync();fitNotebookHeight();},{passive:true});
  setInterval(sync,2300);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});
 else setup();
})();
