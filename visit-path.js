/* PsicoMoodle: percurso resumido por aba. Sem IP, conteúdo digitado, respostas ou URLs privadas. */
(()=>{
'use strict';
if(window.PSICO_VISIT_PATH)return;
// A auditoria oficial do GitHub Actions sinaliza o navegador ANTES de carregar o site.
// Não gera visitas humanas falsas nem altera o histórico salvo.
if(window.__uentzoulSiteHealthAudit===true){
 window.PSICO_VISIT_PATH={status:()=>({ready:false,anonymous:false,automated:true})};
 return;
}
const STORAGE_KEY='psicomoodle_visit_path_v1';
let key=null,identity=null,authToken=null,queue=Promise.resolve(),ready=false,lastRoute='',ending=false;
const app=()=>window.uentzoulAIAuth;
const client=()=>app()?.client?.();
const allowed=new Set(['home','subject','exams','test','calendar','messages','ai','audio','library','admin','vacation']);
function uuid(){
 if(globalThis.crypto?.randomUUID)return globalThis.crypto.randomUUID();
 if(!globalThis.crypto?.getRandomValues)return null;
 const bytes=new Uint8Array(16);globalThis.crypto.getRandomValues(bytes);
 bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
 const hex=Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
 return hex.slice(0,8)+'-'+hex.slice(8,12)+'-'+hex.slice(12,16)+'-'+hex.slice(16,20)+'-'+hex.slice(20);
}
const stored=()=>{try{return sessionStorage.getItem(STORAGE_KEY)}catch(_){return null}};
const save=v=>{try{if(v)sessionStorage.setItem(STORAGE_KEY,v);else sessionStorage.removeItem(STORAGE_KEY)}catch(_){}};
const current=()=>window.uentzoulCurrentRoute?.()||{page:'home',semester:'2026/2'};
const clean=(value,len=48)=>String(value||'').toLowerCase().replace(/[^a-z0-9_-]/g,'').slice(0,len);
function normalize(info={}){
 const page=allowed.has(info.page)?info.page:'home';
 const semester=['2026/1','2026/2','2027/1'].includes(info.semester)?info.semester:null;
 let detail=null;
 if(page==='subject'){
  const subject=clean(info.subject);
  const area=clean(info.subjectArea,32);
  detail=subject?(subject+(area?':'+area:'')):null;
 }
 return {page,detail,semester};
}
function payload(kind,route){
 const entry=normalize(route||current());
 return {p_visit_key:key,p_kind:kind,p_section:entry.page,p_detail:entry.detail,p_semester:entry.semester};
}
function rpc(kind,route){
 if(!key||!client())return Promise.resolve();
 const params=payload(kind,route);
 queue=queue.catch(()=>{}).then(async()=>{
  try{
   const {error}=await client().rpc('uentzoul_track_visit',params);
   if(error)console.warn('Registro resumido de navegação indisponível:',error.message);
  }catch(error){console.warn('Registro resumido de navegação indisponível:',error);}
 });
 return queue;
}
async function sync(){
 const c=client();if(!c)return false;
 try{
  const s=await c.auth.getSession();if(s.error)throw s.error;
  const uid=s.data?.session?.user?.id||null;
  const next=uid||'anonymous';
  authToken=s.data?.session?.access_token||null;
  if(identity!==next||!key){
   identity=next;
   const prev=stored();
   const parts=prev?.split('|')||[];
   key=(parts.length===2&&parts[0]===next&&/^[0-9a-f-]{36}$/.test(parts[1]))?parts[1]:uuid();
   if(!key)return false;
   save(next+'|'+key);
   lastRoute='';
  }
  ready=true;
  return true;
 }catch(error){console.warn('Não foi possível iniciar registro de navegação:',error);return false;}
}
async function navigate(route){
 if(ending)return;
 if(!ready&&!(await sync()))return;
 const source=route||current();
 const normalized=normalize(source);
 const signature=JSON.stringify(normalized);
 if(lastRoute===signature)return;
 lastRoute=signature;
 await rpc('navigate',source);
}
function routeEvent(e){void navigate(e.detail||current());}
function refocus(){
 if(document.visibilityState!=='visible'||ending)return;
 void sync().then(ok=>{if(ok){void navigate(current());void rpc('heartbeat');}});
}
window.addEventListener('uentzoul:route',routeEvent);
window.addEventListener('uentzoul:auth',()=>{void sync().then(ok=>{if(ok)void navigate(current());});});
window.addEventListener('uentzoul:semester',()=>queueMicrotask(()=>{void navigate(current());}));
window.addEventListener('popstate',()=>requestAnimationFrame(()=>{void navigate(current());}));
window.addEventListener('focus',refocus);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refocus();});
window.addEventListener('online',refocus);
setInterval(()=>{if(document.visibilityState==='visible'&&!ending)void sync().then(ok=>{if(ok)void rpc('heartbeat');});},45000);

// pagehide é o melhor esforço disponível no navegador; ausência deste evento
// significa "encerramento não confirmado", nunca uma saída inventada.
window.addEventListener('pagehide',()=>{
 if(ending||!key)return;
 ending=true;
 const configEl=document.getElementById('uentzoul-auth-config');
 let config={};try{config=JSON.parse(configEl?.textContent||'{}')}catch(_){}
 if(config.url&&config.publishableKey){
  const params=payload('exit',current());
  try{
   fetch(config.url.replace(/\/$/,'')+'/rest/v1/rpc/uentzoul_track_visit',{
    method:'POST',mode:'cors',keepalive:true,
    headers:{'Content-Type':'application/json','apikey':config.publishableKey,'Authorization':'Bearer '+(authToken||config.publishableKey)},
    body:JSON.stringify(params)
   }).catch(()=>{});
  }catch(_){}
 }
 save(null);
});
window.addEventListener('pageshow',event=>{
 if(event.persisted){ending=false;ready=false;identity=null;key=null;void sync().then(ok=>{if(ok)void navigate(current());});}
});
window.PSICO_VISIT_PATH={status:()=>({ready:!!ready,anonymous:identity==='anonymous'})};
let attempts=0;
function start(){
 if(client())void sync().then(ok=>{if(ok)void navigate(current());});
 else if(attempts++<50)setTimeout(start,600);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
else start();
})();