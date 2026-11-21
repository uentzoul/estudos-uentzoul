/* Protege a modalidade Concursos desde a verificação do cargo, antes de baixar materiais. */
(()=>{
 'use strict';
 if(window.__uentzoulContestBootstrap)return;
 window.__uentzoulContestBootstrap=true;
 let loading=false,loaded=false,checkedAt=0;
 let role={id:null,admin:false,concurso:false};
 const active=()=>{const u=window.uentzoulAIAuth?.user?.();return u&&u.id&&!u.is_anonymous?u:null;};
 const client=()=>window.uentzoulAIAuth?.client?.();
 const onlyContest=()=>!!role.id&&role.concurso&&!role.admin;
 const authorized=()=>!!role.id&&(role.admin||role.concurso);
 const contestUrl=()=>location.pathname+location.search+'#concursos';
 function lockRoute(){
  if(!onlyContest())return;
  document.documentElement.classList.add('pm-concurso-user','pm-concurso-mode');
  // Um histórico de semestre nunca pode ser reaplicado a esta conta.
  if(location.hash!=='#concursos'||history.state!==null){
   try{history.replaceState(null,'',contestUrl());}catch(e){}
  }
  const label=document.getElementById('semesterCurrentLabel');
  if(label)label.textContent='Concursos';
  const semester=document.getElementById('semesterCurrent');
  if(semester){semester.setAttribute('aria-disabled','true');semester.tabIndex=-1;semester.setAttribute('aria-expanded','false');}
  const dropdown=document.getElementById('semesterDropdown');
  if(dropdown)dropdown.hidden=true;
  // Falha ao carregar os materiais não deve liberar a interface de semestres.
  const main=document.getElementById('main');
  if(!loaded&&main&&!main.querySelector('.concursos-shell')&&!main.querySelector('.concursos-pending')){
   main.innerHTML='<section class="concursos-pending" role="status" aria-live="polite"><h1>Concursos</h1><p>Verificando seu acesso e carregando os materiais do concurso.</p></section>';
  }
 }
 function setRole(id,admin,concurso){
  const wasOnly=onlyContest();
  role={id:id||null,admin:admin===true,concurso:concurso===true};
  if(onlyContest()){lockRoute();return;}
  if(wasOnly){
   document.documentElement.classList.remove('pm-concurso-user','pm-concurso-mode');
   const semester=document.getElementById('semesterCurrent');
   if(semester){semester.removeAttribute('aria-disabled');semester.removeAttribute('tabindex');}
  }
 }
 window.uentzoulContestAccess={
  isOnlyContest:onlyContest,
  isAuthorized:authorized,
  lock:lockRoute,
  // Compartilha somente o resultado da RPC autenticada do módulo principal.
  setVerified(id,admin,concurso){if(active()?.id===id)setRole(id,admin,concurso);}
 };
 function blockOtherSections(event){
  if(!onlyContest()||!(event.target instanceof Element))return;
  const blocked=event.target.closest(
   '#semesterCurrent,#semesterDropdown,'+
   '#subjectNav [data-action],#nav [data-page]:not([data-page="home"]):not([data-page="exams"]),'+
   '#navVacationReview,#navAdminConfig,#navCadernoPreview,#navConcursoNotebook,'+
   '[data-dm-tab],[data-dm-peer],[data-dm-room]'
  );
  if(!blocked)return;
  event.preventDefault();event.stopImmediatePropagation();lockRoute();
 }
 // Captura na janela, antes dos manipuladores da navegação acadêmica.
 window.addEventListener('click',blockOtherSections,true);
 window.addEventListener('popstate',event=>{
  if(!onlyContest())return;
  event.stopImmediatePropagation();lockRoute();
 },true);
 window.addEventListener('hashchange',()=>{if(onlyContest())lockRoute();},true);
 window.addEventListener('uentzoul:route',()=>{if(onlyContest())lockRoute();});
 window.addEventListener('uentzoul:semester',()=>{if(onlyContest())lockRoute();});
 function script(id,url){
  return new Promise((resolve,reject)=>{
   if(document.getElementById(id))return resolve();
   const node=document.createElement('script');node.id=id;node.src=url;
   node.onload=()=>resolve();
   node.onerror=()=>{node.remove();reject(Error('Não foi possível abrir '+url));};
   document.head.appendChild(node);
  });
 }
 async function check(force=false){
  const u=active();
  if(!u){if(role.id)setRole(null,false,false);return;}
  if(loading||!client())return;
  const now=Date.now();
  if(!force&&role.id===u.id&&now-checkedAt<(loaded?60000:2800))return;
  checkedAt=now;loading=true;
  try{
   const id=u.id;
   const r=await client().rpc('uentzoul_concurso_access');
   if(r.error)throw r.error;
   if(active()?.id!==id)return;
   setRole(id,r.data?.admin===true,r.data?.concurso===true);
   if(!authorized()||loaded)return;
   const material=await client().from('uentzoul_concurso_materials')
    .select('payload').eq('material_key','hcpa-2026-assistente-administrativo-ii').single();
   if(material.error)throw material.error;
   if(active()?.id!==id)return;
   const data=material.data?.payload;
   if(!data||!Array.isArray(data.questions)||data.questions.length!==200){
    throw Error('Material do concurso indisponível ou incompleto');
   }
   window.CONCURSO_DATA=data;
   // A nova folha de estilos e o código do diário precisam ignorar a versão em cache.
   const css=Array.from(document.querySelectorAll('link[rel="stylesheet"]')).find(el=>{
    try{return new URL(el.href,location.href).pathname.endsWith('/concursos.css');}catch(_){return false;}
   });
   if(css){
    const url=new URL(css.href,location.href);
    url.searchParams.set('v','20261118-daily8-caderno');
    css.href=url.toString();
   }else{
    const link=document.createElement('link');
    link.rel='stylesheet';link.href='concursos.css?v=20261118-daily8-caderno';
    document.head.appendChild(link);
   }
   // O módulo lúdico é carregado somente para usuários já autorizados em Concursos.
   if(!document.getElementById('pm-concursos-ludico-css')){
    const style=document.createElement('link');style.rel='stylesheet';style.id='pm-concursos-ludico-css';
    style.href='concursos-ludico.css?v=20261121-missoes-v1';document.head.appendChild(style);
   }
   await script('pm-concursos-ludico','concursos-ludico.js?v=20261121-missoes-v1');
   await script('pm-concursos-app','concursos.js?v=20261121-missoes-v1');
   loaded=true;
  }catch(error){console.warn('Concursos: acesso ainda indisponível',error);if(onlyContest())lockRoute();}
  finally{loading=false;}
 }
 window.addEventListener('uentzoul:auth',()=>void check(true));
 window.addEventListener('focus',()=>void check(true));
 window.addEventListener('visibilitychange',()=>{if(!document.hidden)void check();});
 setInterval(()=>void check(),7000);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>void check(),{once:true});
 else void check();
})();
