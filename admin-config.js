/* PsicoMoodle — administração com autorização no Supabase. */
(()=>{
'use strict';
const TABLE='uentzoul_admin_topics',PRESENCE='uentzoul_presence';
let admin=false,owner=null,checking=false,topics=[],topicsSignature='',presence=[],reports=[],busy=false,notice='',editing=null,lastPresence=0,lastReports=0;
let accessLog=[],logOpen=false,logTab='online',lastLog=0,logError='';
const auth=()=>window.uentzoulAIAuth;
const bridge=()=>window.uentzoulAdminBridge;
const client=()=>auth()?.client?.();
const user=()=>auth()?.user?.();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const subjects=()=>bridge()?.subjects?.()||{};
function isAdmin(){return admin && owner===user()?.id;}
function updateNav(){
 const el=document.getElementById('navAdminConfig');
 if(el){el.hidden=!isAdmin();el.style.display=isAdmin()?'':'none';}
 if(!isAdmin()&&location.hash==='#admin')bridge()?.goHome?.();
 bridge()?.refreshNav?.();
}
async function heartbeat(){
 const c=client(),u=user();
 if(!c||!u||document.visibilityState!=='visible')return;
 try{await c.rpc('uentzoul_heartbeat');}catch(e){console.warn('Presença não registrada:',e);}
}
async function loadTopics(){
 const c=client();if(!c)return;
 try{
  const {data,error}=await c.from(TABLE).select('id,semester,subject,title,definition,scenario,myth,sort_order,updated_at').order('sort_order',{ascending:true}).limit(500);
  if(error)throw error;
  const sig=JSON.stringify(data||[]);
  if(sig!==topicsSignature){topicsSignature=sig;topics=data||[];bridge()?.applyTopics?.(topics);if(isAdmin())refreshAdminPage();}
 }catch(e){console.warn('Conteúdos adicionais indisponíveis:',e);}
}
function reportsMarkup(){
 return reports.length?reports.map(r=>'<article class="admin-report-entry"><div><strong>Relato anônimo</strong><time>'+esc(new Date(r.created_at).toLocaleString('pt-BR'))+'</time></div><p>'+esc(r.body)+'</p></article>').join(''):
 '<p class="admin-muted">Não há relatos de erros recebidos.</p>';
}
async function loadReports(){
 if(!isAdmin()||!client())return;
 try{
  const {data,error}=await client().rpc('uentzoul_list_error_reports');
  if(error)throw error;
  reports=data||[];lastReports=Date.now();
  const area=document.getElementById('adminErrorReports');
  if(area)area.innerHTML=reportsMarkup();
 }catch(e){console.warn('Não foi possível consultar relatos:',e);}
}

async function loadPresence(){
 if(!isAdmin()||!client())return;
 try{
  const [seen,profiles]=await Promise.all([
   client().from(PRESENCE).select('user_id,last_seen').order('last_seen',{ascending:false}).limit(500),
   client().from('uentzoul_profiles').select('user_id,display_name').limit(500)
  ]);
  if(seen.error)throw seen.error;
  if(profiles.error)throw profiles.error;
  const names=new Map((profiles.data||[]).map(p=>[p.user_id,p.display_name]));
  presence=(seen.data||[]).map(p=>({...p,name:names.get(p.user_id)||'Usuário cadastrado'}));
  lastPresence=Date.now();updateLogPanel();
 }catch(e){logError='Não foi possível consultar os acessos.';updateLogPanel();console.warn('Presença indisponível:',e)}
}
async function loadAccess(){
 if(!isAdmin()||!client())return;
 try{
  const [events,profiles]=await Promise.all([
   client().from('uentzoul_access_log').select('id,user_id,actor,entered_at')
     .order('entered_at',{ascending:false}).limit(200),
   client().from('uentzoul_profiles').select('user_id,display_name').limit(500)
  ]);
  if(events.error)throw events.error;
  if(profiles.error)throw profiles.error;
  const names=new Map((profiles.data||[]).map(p=>[p.user_id,p.display_name]));
  accessLog=(events.data||[]).map(r=>({...r,name:r.actor==='anonymous'?'Usuário anônimo':names.get(r.user_id)||'Usuário cadastrado'}));
  lastLog=Date.now();logError='';updateLogPanel();
 }catch(e){logError='Não foi possível carregar o histórico de entradas.';updateLogPanel();console.warn('Log indisponível:',e)}
}
function logDate(date){
 if(!date)return '—';
 try{return new Date(date).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}
 catch(_){return '—'}
}
function loggedOnline(p){return !!p.last_seen&&Date.now()-new Date(p.last_seen).getTime()<120000}
function logMarkup(){
 if(logError)return '<p class="admin-muted" role="status">'+esc(logError)+'</p>';
 const rows=logTab==='online'?presence.filter(loggedOnline):logTab==='last'?presence:accessLog;
 if(!rows.length)return '<p class="admin-muted">'+(logTab==='online'?'Nenhuma conta identificada como ativa nos últimos dois minutos.':logTab==='last'?'Nenhum último acesso registrado.':'Ainda não há entradas registradas.')+'</p>';
 return '<div class="admin-log-rows">'+rows.slice(0,logTab==='online'?100:200).map(row=>{
  const active=logTab==='online'?true:logTab==='last'&&loggedOnline(row);
  const name=esc(row.name||'Usuário cadastrado');
  const when=logTab==='entries'?row.entered_at:row.last_seen;
  const status=logTab==='online'?'Online agora':logTab==='last'?(active?'Online agora':'Última atividade registrada'):(row.actor==='anonymous'?'Visitante sem conta':'Entrou na conta');
  return '<div class="admin-log-row"><span class="admin-log-avatar '+(active?'is-online':'')+'" aria-hidden="true">'+(row.actor==='anonymous'?'?':name.trim().charAt(0).toUpperCase()||'U')+'</span>'+
   '<span class="admin-log-person"><strong>'+name+'</strong><small>'+esc(status)+'</small></span>'+
   '<time datetime="'+esc(when||'')+'">'+esc(logDate(when))+'</time></div>';
 }).join('')+'</div>';
}
function updateLogPanel(){
 const contents=document.getElementById('adminLogData');
 if(contents)contents.innerHTML=logMarkup();
 const counter=document.getElementById('adminLogOnlineCount');
 if(counter)counter.textContent=String(presence.filter(loggedOnline).length);
 const tabs=document.querySelectorAll('[data-admin-log-tab]');
 for(const button of tabs)button.setAttribute('aria-selected',String(button.dataset.adminLogTab===logTab));
}
function adminLogMarkup(){
 return '<details id="adminLogDisclosure" class="admin-card admin-log-card" '+(logOpen?'open':'')+'>'+
  '<summary><div class="admin-log-title"><span class="admin-log-glyph" aria-hidden="true">⌁</span>'+
  '<div><strong>LOG</strong><small>Entradas e presença das contas</small></div></div>'+
  '<span class="admin-log-summary-meta">Privado <span aria-hidden="true">⌄</span></span></summary>'+
  '<div class="admin-log-content"><p class="admin-log-explain">Registra somente entradas e horários, não acompanha páginas nem ações. O status online é estimado pela atividade recente. Visitantes anônimos não têm identificação nem presença individual.</p>'+
  '<div class="admin-log-toolbar" role="tablist" aria-label="Visualização dos acessos">'+
  [['online','Online','adminLogOnlineCount'],['last','Último acesso',''],['entries','Entradas','']].map(([tab,label,id])=>
   '<button type="button" role="tab" data-admin-log-tab="'+tab+'" aria-selected="'+(logTab===tab)+'">'+label+(id?' <span id="'+id+'">'+presence.filter(loggedOnline).length+'</span>':'')+'</button>').join('')+
  '<button type="button" class="admin-log-refresh" data-admin-log-refresh title="Atualizar registros" aria-label="Atualizar registros">↻</button></div>'+
  '<div id="adminLogData">'+logMarkup()+'</div>'+
  '<p class="admin-log-foot">Os registros de entrada são mantidos por até 60 dias. O navegador não informa se uma conta está aberta em outro dispositivo; a presença indica atividade recente.</p></div></details>';
}
function refreshAdminPage(){
 if(document.getElementById('adminConfigPage')&&isAdmin())bridge()?.rerenderAdmin?.();
}
async function refresh(){
 const c=client(),u=user();
 if(!c||!u){
  if(owner){owner=null;admin=false;presence=[];accessLog=[];topics=[];topicsSignature='';updateNav();}
  return;
 }
 if(checking)return;checking=true;
 try{
  if(owner!==u.id){
   admin=false;owner=u.id;presence=[];updateNav();
   const {data,error}=await c.rpc('uentzoul_is_admin');
   if(error)throw error;
   if(user()?.id!==u.id)return;
   admin=data===true;updateNav();
   if(isAdmin())window.uentzoulLibraryManager?.refresh?.();
  }
  await loadTopics();
  if(isAdmin()&&document.getElementById('adminConfigPage')){await loadReports();if(logOpen)await Promise.all([loadPresence(),loadAccess()]);}
 }catch(e){console.warn('Verificação de administrador:',e);if(user()?.id===owner){admin=false;updateNav();}}
 finally{checking=false;}
}
function formMarkup(){
 const current=topics.find(t=>t.id===editing)||null;
 const options=Object.entries(subjects()).map(([id,name])=>'<option value="'+esc(id)+'" '+((current?.subject||'')===id?'selected':'')+'>'+esc(name)+'</option>').join('');
 return '<section class="admin-card"><h2>'+ (current?'Editar conteúdo':'Adicionar conteúdo')+'</h2>'+
 '<form id="adminTopicForm" class="admin-topic-form">'+
 '<label>Disciplina<select name="subject" required><option value="">Selecione a matéria</option>'+options+'</select></label>'+
 '<label>Título<input name="title" required maxlength="180" value="'+esc(current?.title||'')+'" placeholder="Título do tópico"></label>'+
 '<label>Explicação<textarea name="definition" rows="4" placeholder="Conteúdo para revisar">'+esc(current?.definition||'')+'</textarea></label>'+
 '<label>Exemplo<textarea name="scenario" rows="2" placeholder="Exemplo de aplicação">'+esc(current?.scenario||'')+'</textarea></label>'+
 '<label>Erro comum<textarea name="myth" rows="2" placeholder="Equívoco frequente">'+esc(current?.myth||'')+'</textarea></label>'+
 '<div class="admin-actions"><button type="submit" class="admin-primary" '+(busy?'disabled':'')+'>'+(busy?'Salvando…':current?'Salvar alterações':'Adicionar conteúdo')+'</button>'+
 (current?'<button type="button" data-admin-cancel>Cancelar edição</button>':'')+'</div></form></section>';
}
function listMarkup(){
 const filtered=topics.filter(t=>t.semester==='2026/2');
 return '<section class="admin-card"><h2>Conteúdos adicionados</h2>'+
 (filtered.length?'<div class="admin-topic-list">'+filtered.map(t=>'<div class="admin-topic-line"><div><strong>'+esc(t.title)+'</strong><small>'+esc(subjects()[t.subject]||t.subject)+'</small></div>'+
 '<div class="admin-topic-buttons"><button type="button" data-admin-edit="'+esc(t.id)+'">Editar</button><button type="button" data-admin-delete="'+esc(t.id)+'">Excluir</button></div></div>').join('')+'</div>':'<p class="admin-muted">Ainda não há tópicos adicionados por aqui. Os conteúdos anteriores continuam preservados.</p>')+'</section>';
}
function render(){
 if(!isAdmin())return '<section class="panel"><h1>Acesso restrito</h1><p>Esta área é exclusiva do administrador.</p></section>';
 // Apenas os relatórios de erros e o log. O log fica sempre por último.
 // Os conteúdos salvos continuam intactos no banco e nas disciplinas.
 return '<div class="admin-config-page" id="adminConfigPage">'+
 '<header class="admin-header"><span class="admin-kicker">Painel privado</span><h1>Admin Config</h1><p>Organize disciplinas, materiais e acompanhe os registros da plataforma.</p></header>'+
 '<details class="admin-card admin-reports"><summary>Relatos de erros <span>Privado</span></summary><div id="adminErrorReports">'+reportsMarkup()+'</div></details>'+
 (bridge()?.adminLibrary?.()||'')+
 (bridge()?.weeklyAdmin?.()||'')+
 adminLogMarkup()+
 '</div>';
}
function afterRender(){
 if(!isAdmin())return;
 if(logOpen&&(Date.now()-lastPresence>12000||Date.now()-lastLog>12000)){loadPresence();loadAccess()}
 if(Date.now()-lastReports>25000)loadReports();
}

async function saveTopic(form){
 if(!isAdmin()||busy)return;
 const c=client(),u=user();if(!c||!u)return;
 const data=new FormData(form),subject=String(data.get('subject')||'');
 if(!subjects()[subject])return;
 const payload={semester:'2026/2',subject,title:String(data.get('title')||'').trim().slice(0,180),definition:String(data.get('definition')||'').trim().slice(0,16000),scenario:String(data.get('scenario')||'').trim().slice(0,5000),myth:String(data.get('myth')||'').trim().slice(0,5000),updated_by:u.id,updated_at:new Date().toISOString()};
 if(payload.title.length<3)return;
 busy=true;notice='';const submit=form.querySelector('[type=submit]');if(submit)submit.disabled=true;
 try{
  const q=editing?c.from(TABLE).update(payload).eq('id',editing):c.from(TABLE).insert(payload);
  const {error}=await q;if(error)throw error;
  editing=null;notice='Conteúdo salvo e disponibilizado na disciplina.';
  await loadTopics();refreshAdminPage();
 }catch(e){notice='Não foi possível salvar: '+(e.message||e);refreshAdminPage();}
 finally{busy=false;}
}
async function deleteTopic(id){
 if(!isAdmin()||busy||!topics.some(t=>t.id===id)||!confirm('Excluir este conteúdo adicionado? Os conteúdos originais não serão alterados.'))return;
 busy=true;
 try{const {error}=await client().from(TABLE).delete().eq('id',id);if(error)throw error;editing=null;notice='Conteúdo excluído.';await loadTopics();refreshAdminPage();}
 catch(e){notice='Falha ao excluir: '+(e?.message||'erro');refreshAdminPage();}
 finally{busy=false;}
}
document.addEventListener('submit',e=>{if(e.target.id!=='adminTopicForm')return;e.preventDefault();saveTopic(e.target);});
document.addEventListener('click',e=>{
 const edit=e.target.closest('[data-admin-edit]');if(edit&&isAdmin()){editing=edit.dataset.adminEdit;refreshAdminPage();return;}
 const del=e.target.closest('[data-admin-delete]');if(del&&isAdmin()){deleteTopic(del.dataset.adminDelete);return;}
 if(e.target.closest('[data-admin-cancel]')&&isAdmin()){editing=null;refreshAdminPage();return;}
 if(e.target.closest('[data-admin-refresh]')&&isAdmin()){heartbeat().then(loadPresence);loadAccess();loadReports();}
 const log=e.target.closest('[data-admin-log-tab]');
 if(log&&isAdmin()){logTab=log.dataset.adminLogTab;updateLogPanel();return}
 if(e.target.closest('[data-admin-log-refresh]')&&isAdmin()){loadPresence();loadAccess();return}
});

document.addEventListener('toggle',e=>{
 if(e.target.id!=='adminLogDisclosure'||!isAdmin())return;
 logOpen=e.target.open;
 if(logOpen&&(Date.now()-lastPresence>5000||Date.now()-lastLog>5000)){loadPresence();loadAccess()}
},true);
/* Registro leve e não identificável de visitantes sem conta.
   Uma entrada por sessão do navegador, não um log das páginas visualizadas. */
let accessRecording=false;
async function recordAccess(){
 const c=client();if(!c||accessRecording)return;
 accessRecording=true;
 try{
  const session=await c.auth.getSession();
  if(session.error)throw session.error;
  const uid=session.data?.session?.user?.id||user()?.id||null;
  const key='psicomoodle_access_logged_'+(uid||'anonymous');
  try{if(sessionStorage.getItem(key))return}catch(_){}
  const res=await c.rpc('uentzoul_record_access');
  if(res.error)throw res.error;
  try{sessionStorage.setItem(key,'1')}catch(_){}
 }catch(e){console.warn('Entrada não registrada',e)}
 finally{accessRecording=false}
}

window.addEventListener('uentzoul:auth',()=>{refresh();heartbeat();recordAccess();});
window.addEventListener('focus',()=>{refresh();heartbeat();});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){refresh();heartbeat();}});
window.addEventListener('online',()=>{refresh();heartbeat();});
setInterval(()=>{if(document.visibilityState==='visible'){refresh();heartbeat();}},45000);
window.uentzoulAdminConfig={isAdmin,render,afterRender,refresh,loadPresence,loadReports};
let tries=0;
const start=()=>{if(client()){refresh();heartbeat();recordAccess()}else if(tries++<40)setTimeout(start,800)};
start();
})();
