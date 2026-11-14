/* Navegação principal e passeio contextual pelo PsicoMoodle. */
(()=>{
'use strict';
function setup(){
 const nav=document.getElementById('nav');
 if(nav){
  const anchor=nav.querySelector('.nav-upcoming')||nav.querySelector('[data-page="admin"]')||null;
  for(const page of ['home','calendar','exams','messages','ai']){
   const node=nav.querySelector('[data-page="'+page+'"]');
   if(node)nav.insertBefore(node,anchor);
  }
 }
 if(!document.getElementById('pm-tutorial-styles')){
  const style=document.createElement('link');
  style.id='pm-tutorial-styles';
  style.rel='stylesheet';
  style.href='spotlight-tour.css?v=20261114-drag-follow-v14';
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
  script.src='spotlight-tour.js?v=20261114-drag-follow-v14';
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
 if(!document.getElementById('pm-mobile-drawer-css')){
  const link=document.createElement('link');
  link.id='pm-mobile-drawer-css';
  link.rel='stylesheet';
  link.href='mobile-drawer.css?v=20261114-drag-follow-v14';
  document.head.appendChild(link);
 }
 if(!document.getElementById('pm-mobile-drawer-js')){
  const script=document.createElement('script');
  script.id='pm-mobile-drawer-js';
  script.src='mobile-drawer.js?v=20261114-drag-follow-v14';
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
