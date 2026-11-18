/* Inicia Concursos apenas para usuários com cargo ou administradores. */
(()=>{
 'use strict';
 if(window.__uentzoulContestBootstrap)return;
 window.__uentzoulContestBootstrap=true;
 let loading=false,loaded=false,checkedAt=0;
 const active=()=>{const u=window.uentzoulAIAuth?.user?.();return u&&u.id&&!u.is_anonymous?u:null;};
 const client=()=>window.uentzoulAIAuth?.client?.();
 function script(id,url){
  return new Promise((resolve,reject)=>{
   if(document.getElementById(id))return resolve();
   const node=document.createElement('script');node.id=id;node.src=url;
   node.onload=()=>resolve();
   node.onerror=()=>{node.remove();reject(Error('Não foi possível abrir '+url));};
   document.head.appendChild(node);
  });
 }
 async function check(){
  if(loading||loaded||!active()||!client())return;
  const now=Date.now();
  if(now-checkedAt<2800)return;
  checkedAt=now;loading=true;
  try{
   const id=active()?.id;
   const r=await client().rpc('uentzoul_concurso_access');
   if(r.error)throw r.error;
   if(active()?.id!==id||!r.data?.admin&&!r.data?.concurso)return;
   const material=await client().from('uentzoul_concurso_materials')
    .select('payload').eq('material_key','hcpa-2026-assistente-administrativo-ii').single();
   if(material.error)throw material.error;
   if(active()?.id!==id)return;
   const data=material.data?.payload;
   if(!data||!Array.isArray(data.questions)||data.questions.length!==200){
    throw Error('Material do concurso indisponível ou incompleto');
   }
   window.CONCURSO_DATA=data;
   await script('pm-concursos-app','concursos.js?v=20261118-hcpa3');
   loaded=true;
  }catch(error){console.warn('Concursos: acesso ainda indisponível',error);}
  finally{loading=false;}
 }
 window.addEventListener('uentzoul:auth',check);
 window.addEventListener('focus',check);
 window.addEventListener('visibilitychange',()=>{if(!document.hidden)void check();});
 setInterval(()=>{if(!loaded)void check();},7000);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',check,{once:true});else void check();
})();
