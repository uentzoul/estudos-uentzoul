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
let countryCode=null,countryStarted=false,countryApplied=false;
let extrasFrame=null,extrasDetail=null;
const games=new Set(['psico','contexto','conexo','tetris']);
try{const cached=sessionStorage.getItem('psicomoodle_origin_country_v1');if(/^[A-Z]{2}$/.test(cached||''))countryCode=cached;}catch(_){}
const app=()=>window.uentzoulAIAuth;
const client=()=>app()?.client?.();
const allowed=new Set(['home','subject','exams','test','calendar','messages','ai','audio','library','admin','vacation','extras','books','audiobooks','caderno','concursos']);
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
const current=()=>{
 const route=window.uentzoulCurrentRoute?.()||{page:'home',semester:'2026/2'};
 if(document.getElementById('vr-root'))return {page:'vacation',semester:route.semester};
 if(route.page==='extras'){
  const frame=document.getElementById('psicoExtrasFrame');
  if(frame!==extrasFrame){extrasFrame=frame;extrasDetail=null;}
  return {...route,detail:extrasDetail};
 }
 extrasFrame=null;extrasDetail=null;
 return route;
};
const clean=(value,len=48)=>String(value||'').toLowerCase().replace(/[^a-z0-9_-]/g,'').slice(0,len);
function normalize(info={}){
 const page=allowed.has(info.page)?info.page:null;
 const semester=['2026/1','2026/2','2027/1'].includes(info.semester)?info.semester:null;
 let detail=null;
 if(page==='subject'){
  const subject=clean(info.subject);
  const area=clean(info.subjectArea,32);
  detail=subject?(subject+(area?':'+area:'')):null;
 }
 if(page==='extras'){
  const [game,action]=String(info.detail||'').split(':');
  if(games.has(game))detail=game+(action==='played'?':played':'');
 }
 return {page,detail,semester};
}
/* Leitura técnica geral do navegador; não coleta IP, localização, UA completo,
   impressão digital (fingerprint) ou identificador persistente de hardware. */
/* Coleta somente o país aproximado por rede; não armazena IP.
   A consulta é feita pelo próprio navegador usando o serviço externo GeoJS. */
function loadCountry(){
 if(countryStarted||countryCode||window.__uentzoulSiteHealthAudit===true)return;
 countryStarted=true;
 const controller=typeof AbortController==='function'?new AbortController():null;
 const timeout=controller?setTimeout(()=>controller.abort(),3000):null;
 fetch('https://get.geojs.io/v1/ip/country.json',{
  cache:'no-store',mode:'cors',credentials:'omit',referrerPolicy:'no-referrer',
  ...(controller?{signal:controller.signal}:{})
 }).then(response=>{if(!response.ok)throw Error('País indisponível');return response.json();})
 .then(data=>{
  const code=String(data?.country||'').toUpperCase();
  if(!/^[A-Z]{2}$/.test(code)||code==='XX')return;
  countryCode=code;
  try{sessionStorage.setItem('psicomoodle_origin_country_v1',code)}catch(_){}
  if(ready&&key&&!ending)void rpc('heartbeat',current());
 }).catch(()=>{/* Se falhar, manter origem desconhecida. */})
 .finally(()=>{if(timeout)clearTimeout(timeout)});
}
function deviceInfo(){
 const ua=String(navigator.userAgent||'');
 const platform=String(navigator.platform||'');
 const touches=Number(navigator.maxTouchPoints)||0;
 const ipad=/iPad/i.test(ua)||(/Macintosh/i.test(ua)&&(/MacIntel/i.test(platform))&&touches>1);
 const iphone=/iPhone|iPod/i.test(ua);
 const android=/Android/i.test(ua);
 const androidPhone=android&&(/Mobile/i.test(ua)||navigator.userAgentData?.mobile===true);
 const windows=/Windows/i.test(ua);
 const mac=/Macintosh|Mac OS X/i.test(ua);
 const chromeOS=/CrOS/i.test(ua);
 const linux=/Linux|X11/i.test(ua);
 let kind='desktop',family='Other',os='Other',osVersion=null;
 if(ipad){kind='tablet';family='iPad';os='iPadOS';}
 else if(iphone){kind='phone';family='iPhone';os='iOS';}
 else if(android){kind=androidPhone?'phone':'tablet';family=androidPhone?'Android phone':'Android tablet';os='Android';}
 else if(windows){family='Windows PC';os='Windows';}
 else if(chromeOS){family='ChromeOS PC';os='ChromeOS';}
 else if(mac){family='Mac';os='macOS';}
 else if(linux){family='Linux PC';os='Linux';}
 else if(navigator.userAgentData?.mobile===true)kind='phone';
 const iosMatch=ua.match(/(?:CPU (?:iPhone )?OS) ([0-9_]+) like Mac OS X/i);
 const androidMatch=ua.match(/Android\s+([0-9.]+)/i);
 const macMatch=ua.match(/Mac OS X\s+([0-9_.]+)/i);
 const m=os==='iOS'||os==='iPadOS'?iosMatch:os==='Android'?androidMatch:os==='macOS'?macMatch:null;
 if(m)osVersion=m[1].replace(/_/g,'.').slice(0,12);
 let browser='Other',browserVersion=null;
 const variants=[
  ['Edge',/(?:EdgiOS|EdgA|Edg)\/([0-9]+)/i],
  ['Opera',/(?:OPiOS|OPR)\/([0-9]+)/i],
  ['Samsung Internet',/SamsungBrowser\/([0-9]+)/i],
  ['Firefox',/(?:FxiOS|Firefox)\/([0-9]+)/i],
  ['Chrome',/(?:CriOS|Chrome)\/([0-9]+)/i],
  ['Chromium',/Chromium\/([0-9]+)/i],
  ['Safari',/Version\/([0-9]+)[^ ]*.*Safari/i]
 ];
 for(const [name,pattern] of variants){const hit=ua.match(pattern);if(hit){browser=name;browserVersion=hit[1];break;}}
 const sw=Number(screen?.width)||0,sh=Number(screen?.height)||0;
 const dimensions=[sw,sh].every(n=>Number.isInteger(n)&&n>=150&&n<=10000)?
  {width:Math.min(sw,sh),height:Math.max(sw,sh)}:{};
 const mode=navigator.standalone===true||window.matchMedia?.('(display-mode: standalone)')?.matches?
  'standalone':document.fullscreenElement?'fullscreen':'browser';
 return {kind,family,os,os_version:osVersion,browser,browser_major:browserVersion,mode,...dimensions,...(countryCode?{country_code:countryCode}:{})};
}
function payload(kind,route){
 const entry=normalize(route||current());
 return {p_visit_key:key,p_kind:kind,p_section:entry.page,p_detail:entry.detail,p_semester:entry.semester,p_device:(kind==='navigate'||(kind==='heartbeat'&&countryCode&&!countryApplied))?deviceInfo():null};
}
function rpc(kind,route){
 if(!key||!client())return Promise.resolve(false);
 const params=payload(kind,route);
 queue=queue.catch(()=>{}).then(async()=>{
  try{
   const {error}=await client().rpc('uentzoul_track_visit_device',params);
   if(error){console.warn('Registro resumido de navegação indisponível:',error.message);return false;}
   if(params.p_device?.country_code)countryApplied=true;
   return true;
  }catch(error){console.warn('Registro resumido de navegação indisponível:',error);return false;}
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
   identity=next;countryApplied=false;
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
 if(!normalized.page)return;
 const signature=JSON.stringify(normalized);
 if(lastRoute===signature)return;
 lastRoute=signature;
 const ok=await rpc('navigate',source);
 if(!ok&&lastRoute===signature)lastRoute='';
}
function routeEvent(e){void navigate(e.detail?.page==='vacation'?e.detail:current());}
function recordExtra(game,played,source){
 if(!games.has(game)||ending)return;
 const route=window.uentzoulCurrentRoute?.();
 const frame=document.getElementById('psicoExtrasFrame');
 if(route?.page!=='extras'||!frame||source!==frame.contentWindow)return;
 if(extrasFrame!==frame){extrasFrame=frame;extrasDetail=null;}
 const detail=game+(played===true?':played':'');
 if(extrasDetail===game+':played'&&played!==true)return;
 extrasDetail=detail;
 void navigate({...route,detail});
}
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
setInterval(()=>{if(document.visibilityState==='visible'&&!ending)void sync().then(ok=>{if(ok){void navigate(current());void rpc('heartbeat');}});},45000);

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
   fetch(config.url.replace(/\/$/,'')+'/rest/v1/rpc/uentzoul_track_visit_device',{
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
window.PSICO_VISIT_PATH={status:()=>({ready:!!ready,anonymous:identity==='anonymous'}),recordExtra};
let attempts=0;
function start(){
 if(client()){loadCountry();void sync().then(ok=>{if(ok)void navigate(current());});}
 else if(attempts++<50)setTimeout(start,600);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
else start();
})();