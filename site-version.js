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


/* Aba Pessoal suspensa por solicitacao do administrador.
   Esconde a entrada e impede que a interface antiga seja acessada,
   sem tocar nos registros privados ou nos demais modulos. */
(()=>{
 'use strict';
 if(window.__personalTabSuspended)return;
 window.__personalTabSuspended=true;
 const css=document.createElement('style');
 css.id='personal-tab-suspended';
 css.textContent='button[data-page="personal"],a[data-page="personal"],[data-nav="personal"],#pc2ModalPortal{display:none!important}';
 (document.head||document.documentElement).appendChild(css);

 function removeEntry(){
  document.querySelectorAll('button[data-page="personal"],a[data-page="personal"],[data-nav="personal"]').forEach(node=>node.remove());
  const dialog=document.getElementById('pc2ModalPortal');
  if(dialog)dialog.remove();
  document.body?.classList.remove('pc2-modal-visible');
 }
 let redirecting=false;
 function enforce(){
  removeEntry();
  const personalVisible=!!document.querySelector('#main .pc2-page, #main .pc-page, #main .pc-login')||
    !!document.querySelector('[data-page="personal"].active');
  if(!personalVisible||redirecting)return;
  const home=document.querySelector('button[data-page="home"],a[data-page="home"]');
  if(!home)return;
  redirecting=true;
  try{home.click()}finally{queueMicrotask(()=>{redirecting=false})}
 }
 document.addEventListener('click',event=>{
  const target=event.target;
  if(!(target instanceof Element))return;
  if(target.closest('[data-page="personal"],[data-nav="personal"],[data-pc-new]')){
   event.preventDefault();event.stopImmediatePropagation();
  }
 },true);
 let queued=false;
 function schedule(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;enforce()});
 }
 function start(){
  enforce();
  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
 }
 if(document.body)start();else document.addEventListener('DOMContentLoaded',start,{once:true});
})();
