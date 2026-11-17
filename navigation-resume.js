/* Estudos Uentzoul — mantém a última tela da aba ao atualizar/recarregar.
   Armazena somente contexto de navegação, nunca conteúdo ou credenciais. */
(()=>{
'use strict';
if(window.__uentzoulResumeNavigation)return;
window.__uentzoulResumeNavigation=true;
const KEY='uentzoul:resume-location:v1',UPDATE='uentzoul:resume-update:v1',HISTORY='psicomoodle-navigation-v1';
let storage;
try{storage=window.sessionStorage;storage.getItem(KEY);}catch(_){storage=null;}
const read=key=>{try{return storage?.getItem(key)||null}catch(_){return null}};
const write=(key,value)=>{try{storage?.setItem(key,value)}catch(_){}};
const remove=key=>{try{storage?.removeItem(key)}catch(_){}};
const navEntry=performance.getEntriesByType?.('navigation')?.[0];
const reload=navEntry?.type==='reload';
const freshUpdate=read(UPDATE)==='1';
remove(UPDATE);
const authFragment=/(?:^#|&)(?:access_token|refresh_token|error_code|error_description|type=recovery)=/.test(location.hash);
let previous=null;
try{previous=JSON.parse(read(KEY)||'null')}catch(_){}
if(!previous||previous.version!==1||!previous.history?.[HISTORY]||Date.now()-previous.time>90*86400000)previous=null;
const savedHash=previous?.hash||'';
const explicitDifferentHash=location.hash&&savedHash&&location.hash!==savedHash&&!freshUpdate;
let pending=(reload||freshUpdate)&&!authFragment&&!explicitDifferentHash?previous:null;
let captureAllowed=!pending,restoring=false,lastSignature='',attempts=0;
const account=()=>{
 try{const u=window.uentzoulAIAuth?.user?.();return u?.id&&!u.is_anonymous?u.id:null}catch(_){return null}
};
const currentRoute=()=>{try{return window.uentzoulCurrentRoute?.()||null}catch(_){return null}};
const validSnap=v=>v&&v[HISTORY]===true&&v.screen&&typeof v.screen.page==='string';
function surface(){
 if(window.PSICO_NOTEBOOK_ACTIVE?.()&&document.getElementById('uentzoulCadernoFrame'))return 'notebook';
 if(document.getElementById('vr-root')?.isConnected&&document.getElementById('main')?.classList.contains('vr-active'))return 'vacation';
 if(document.querySelector('#main .pm-maintenance-shell'))return 'maintenance';
 return 'core';
}
function capture(){
 if(!captureAllowed||restoring||authFragment)return;
 const route=currentRoute();
 if(!route)return;
 const original=history.state,base=validSnap(original)?{...original,screen:{...original.screen}}:{
  [HISTORY]:true,semester:route.semester||'2026/2',screen:{page:route.page||'home'},agenda:null,chat:null
 };
 base.semester=route.semester||base.semester;
 base.screen.page=route.page||base.screen.page;
 base.screen.subject=route.subject||null;
 base.screen.subjectArea=route.subjectArea||null;
 const chat=window.uentzoulChatNavigation?.snapshot?.();
 if(base.screen.page==='messages'&&chat){
  base.chat={tab:chat.tab,peerId:chat.peerId||null,roomId:chat.roomId||null};
  base.screen.peerId=chat.tab==='private'?chat.peerId||null:null;
 }
 base.scrollY=Math.max(0,window.scrollY||0);
 const info={version:1,time:Date.now(),history:base,hash:location.hash,surface:surface(),owner:account()};
 const signature=JSON.stringify([base,info.hash,info.surface,info.owner]);
 if(signature===lastSignature)return;
 lastSignature=signature;
 write(KEY,JSON.stringify(info));
}
function done(){
 pending=null;restoring=false;captureAllowed=true;
 capture();
}
function fallback(){
 // A tela anterior deixou de existir ou não está disponível neste dispositivo.
 const route=currentRoute();
 if(route?.page!=='home'){
  const home=document.querySelector('#nav [data-page="home"]');
  home?.click();
 }
 done();
}
function applyCore(state){
 const wanted=state?.screen?.page||'home',now=currentRoute();
 if(now?.page===wanted&&now?.semester===state.semester&&
  (wanted!=='subject'||now.subject===state.screen.subject&&now.subjectArea===state.screen.subjectArea)&&
  (wanted!=='messages'||JSON.stringify(window.uentzoulChatNavigation?.snapshot?.()||null)===JSON.stringify(state.chat||null))){
  return true;
 }
 if(!validSnap(state))return false;
 restoring=true;
 try{
  const targetHash=savedHash&&/^#[^#]*$/.test(savedHash)?savedHash:location.hash;
  history.replaceState(state,'',location.pathname+location.search+targetHash);
  window.dispatchEvent(new PopStateEvent('popstate',{state}));
 }catch(e){console.warn('Não foi possível restaurar o histórico do site',e);return false}
 finally{restoring=false}
 return currentRoute()?.page===wanted;
}
function tryRestore(){
 if(!pending)return;
 const info=pending,state=info.history,page=state.screen.page;
 const who=account();
 if(info.owner&&who&&who!==info.owner){fallback();return;}
 if(!validSnap(state)){fallback();return;}
 if(info.surface==='notebook'&&window.PSICO_NOTEBOOK_IS_PHONE?.()){fallback();return;}
 if(info.surface==='notebook'&&(!window.PSICO_NOTEBOOK_ACTIVE||!document.getElementById('navCadernoPreview')))return;
 if(info.surface==='vacation'&&!window.PSICO_VACATION_REVIEW?.show)return;
 if(info.surface==='maintenance'&&!window.uentzoulMaintenance?.isAuthorized?.())return;
 if(page==='admin'&&!window.uentzoulAdminConfig?.isAdmin?.())return;
 if(info.surface==='notebook'&&!who)return;
 const restored=applyCore(state);
 if(!restored){
  if(page==='admin'||page==='messages'&&info.owner&&!who)return;
  fallback();return;
 }
 if(info.surface==='notebook'){
  if(!window.PSICO_NOTEBOOK_ACTIVE?.())document.getElementById('navCadernoPreview')?.click();
  if(!window.PSICO_NOTEBOOK_ACTIVE?.())return;
 }else if(info.surface==='vacation'){
  if(!document.getElementById('vr-root'))void window.PSICO_VACATION_REVIEW.show();
  if(!document.getElementById('vr-root'))return;
 }else if(info.surface==='maintenance'){
  if(!document.querySelector('#main .pm-maintenance-shell')){
   document.querySelector('#main [data-pm-maintenance-open]')?.click();
  }
  if(!document.querySelector('#main .pm-maintenance-shell'))return;
 }
 done();
 const y=Math.max(0,Number(state.scrollY)||0);
 if(y)requestAnimationFrame(()=>window.scrollTo({top:y,behavior:'instant'}));
}
function schedule(){
 if(pending){tryRestore();return;}
 setTimeout(capture,100);
}
window.PSICO_REMEMBER_NAVIGATION=()=>{
 if(!pending){capture();write(UPDATE,'1');}
};
document.addEventListener('click',schedule,true);
window.addEventListener('uentzoul:route',schedule);
window.addEventListener('uentzoul:semester',schedule);
window.addEventListener('uentzoul:auth',schedule);
window.addEventListener('popstate',schedule);
document.addEventListener('visibilitychange',()=>{if(!document.hidden) schedule();else capture()});
window.addEventListener('pagehide',capture);
window.addEventListener('beforeunload',capture);
const retry=setInterval(()=>{
 if(!pending){clearInterval(retry);capture();return;}
 tryRestore();
 if(++attempts>=90){
  // Aguardar a autenticação sem substituir o destino; quando a sessão voltar,
  // o evento de autenticação ainda tentará reabrir a tela protegida.
  clearInterval(retry);
 }
},400);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});
else schedule();
setTimeout(tryRestore,0);
})();