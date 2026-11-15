/* Saúde do Site: painel privado, informativo e sem alterações no banco. */
(()=>{
'use strict';
if(window.__uentzoulHealthPanel)return;window.__uentzoulHealthPanel=true;
const endpoint='https://api.github.com/repos/uentzoul/estudos-uentzoul/actions/workflows/site-health.yml/runs?per_page=8';
const workflowUrl='https://github.com/uentzoul/estudos-uentzoul/actions/workflows/site-health.yml';
let cache=null,updated=0,loading=false;
const date=t=>t?new Date(t).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}):'—';
const esc=s=>String(s||'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
function authorized(){return window.uentzoulAdminConfig?.isAdmin?.()===true&&!!document.getElementById('adminConfigPage')}
function card(){
 if(!authorized())return;
 const parent=document.getElementById('adminConfigPage');
 if(!parent||document.getElementById('adminSiteHealth'))return;
 const section=document.createElement('details');
 section.className='admin-card';section.id='adminSiteHealth';
 section.style.cssText='margin-block:14px;overflow-wrap:anywhere';
 section.innerHTML='<summary style="cursor:pointer;font-weight:750">Saúde do Site <span style="font-weight:400;opacity:.65">Verificação a cada 2 horas</span></summary>'+
 '<div style="padding:15px 0"><p style="opacity:.8">Testes automáticos em desktop, tablet, iPhone e Android. A rotina verifica a versão publicada sem alterar mensagens, usuários ou simulados.</p>'+
 '<div id="adminHealthResults" role="status">Consultando as últimas verificações…</div>'+
 '<p style="font-size:12px;opacity:.75">Os relatórios detalhados e as capturas ficam nos artefatos de cada execução do GitHub Actions, com retenção de 30 dias. Este painel exibe o estado das execuções, não substitui revisão visual humana.</p>'+
 '<button type="button" id="adminHealthRefresh" style="padding:8px 12px;cursor:pointer">Atualizar verificações</button> '+
 '<a href="'+workflowUrl+'" target="_blank" rel="noopener noreferrer">Abrir relatórios e capturas</a></div>';
 const log=document.getElementById('adminLogDisclosure');
 if(log?.parentNode===parent)parent.insertBefore(section,log);else parent.appendChild(section);
 section.addEventListener('toggle',()=>{if(section.open)void load()});
 section.querySelector('#adminHealthRefresh').addEventListener('click',()=>void load(true));
 if(cache)draw(); 
}
function draw(){
 const target=document.getElementById('adminHealthResults');
 if(!target||!authorized())return;
 if(!cache){target.textContent='Ainda não há resultados disponíveis.';return}
 if(cache.error){target.textContent=cache.error;return}
 if(!cache.runs.length){target.textContent='Nenhuma execução registrada. O agendamento do GitHub pode levar algum tempo para iniciar.';return}
 const head=cache.runs[0];
 const status=r=>r.status!=='completed'?'Em andamento':r.conclusion==='success'?'Sem erros críticos detectados':r.conclusion==='failure'?'Falha — conferir diagnóstico':r.conclusion||'Indefinido';
 target.innerHTML='<p><strong>Última verificação:</strong> '+esc(date(head.created_at))+' · '+esc(status(head))+'</p>'+
 '<ul style="margin:10px 0;padding-left:20px">'+cache.runs.map(r=>'<li style="margin:7px 0">'+
 '<a href="'+esc(r.html_url)+'" target="_blank" rel="noopener noreferrer">'+esc(date(r.created_at))+'</a>'+
 ' — '+esc(status(r))+'</li>').join('')+'</ul>';
}
async function load(force=false){
 if(!authorized()||loading)return;
 if(!force&&Date.now()-updated<120000){draw();return}
 loading=true;
 const target=document.getElementById('adminHealthResults');
 if(target)target.textContent='Atualizando verificações…';
 try{
  const response=await fetch(endpoint,{headers:{Accept:'application/vnd.github+json'}});
  if(!response.ok)throw Error('GitHub retornou HTTP '+response.status);
  const data=await response.json();
  cache={runs:(data.workflow_runs||[]).map(r=>({created_at:r.created_at,status:r.status,conclusion:r.conclusion,html_url:r.html_url}))};
 }catch(e){cache={error:'Não foi possível consultar o GitHub agora. Abra os relatórios pelo link abaixo. '+String(e.message||'')}}
 finally{updated=Date.now();loading=false;draw()}
}
setInterval(()=>{if(authorized())card()},1800);
document.addEventListener('click',e=>{if(e.target.closest('#nav [data-page="admin"]'))setTimeout(card,150)},true);
})();