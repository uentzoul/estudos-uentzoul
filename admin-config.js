/* PsicoMoodle — administração com autorização no Supabase. */
(()=>{
'use strict';
const TABLE='uentzoul_admin_topics',PRESENCE='uentzoul_presence';
let admin=false,owner=null,checking=false,topics=[],topicsSignature='',presence=[],busy=false,notice='',editing=null,lastPresence=0;
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
async function loadPresence(){
 if(!isAdmin()||!client())return;
 try{
  const [online,profiles]=await Promise.all([
   client().from(PRESENCE).select('user_id,last_seen').gte('last_seen',new Date(Date.now()-120000).toISOString()).order('last_seen',{ascending:false}).limit(200),
   client().from('uentzoul_profiles').select('user_id,display_name').limit(500)
  ]);
  if(online.error)throw online.error;
  if(profiles.error)throw profiles.error;
  const people=new Map((profiles.data||[]).map(p=>[p.user_id,p.display_name]));
  presence=(online.data||[]).map(p=>({...p,name:people.get(p.user_id)||'Participante'}));
  lastPresence=Date.now();
  const container=document.getElementById('adminOnlineList');
  if(container)container.innerHTML=onlineMarkup();
 }catch(e){
  console.warn('Consulta de presença não autorizada ou indisponível:',e);
  const el=document.getElementById('adminOnlineList');
  if(el)el.textContent='Não foi possível consultar a presença agora.';
 }
}
function onlineMarkup(){
 return presence.length?presence.map(p=>'<div class="admin-member"><span class="admin-live-dot"></span><strong>'+esc(p.name)+'</strong></div>').join(''):
 '<p class="admin-muted">Nenhum participante ativo nos últimos dois minutos.</p>';
}
function refreshAdminPage(){
 if(document.getElementById('adminConfigPage')&&isAdmin())bridge()?.rerenderAdmin?.();
}
async function refresh(){
 const c=client(),u=user();
 if(!c||!u){
  if(owner){owner=null;admin=false;presence=[];topics=[];topicsSignature='';updateNav();}
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
  if(isAdmin()&&document.getElementById('adminConfigPage'))await loadPresence();
 }catch(e){console.warn('Verificação de administrador:',e);if(user()?.id===owner){admin=false;updateNav();}}
 finally{checking=false;}
}
function formMarkup(){
 const current=topics.find(t=>t.id===editing)||null;
 const options=Object.entries(subjects()).map(([id,name])=>'<option value="'+esc(id)+'" '+((current?.subject||'')===id?'selected':'')+'>'+esc(name)+'</option>').join('');
 return '<section class="admin-card"><h2>'+ (current?'Editar conteúdo':'Adicionar conteúdo')+'</h2>'+
 '<form id="adminTopicForm" class="admin-topic-form">'+
 '<label>Disciplina<select name="subject" required><option value="">Seleciona a matéria</option>'+options+'</select></label>'+
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
 return '<div class="admin-config-page" id="adminConfigPage">'+
 '<header class="admin-header"><span class="admin-kicker">Painel privado</span><h1>Admin Config</h1><p>Gerencie os materiais, os conteúdos e as contas conectadas.</p></header>'+
 '<section class="admin-card"><div class="admin-section-heading"><div><h2>Online agora</h2><p>Somente o administrador pode consultar esta informação.</p></div><button type="button" data-admin-refresh>Atualizar</button></div><div id="adminOnlineList" class="admin-online-list">'+onlineMarkup()+'</div></section>'+
 '<div class="admin-grid">'+formMarkup()+listMarkup()+'</div>'+
 '<div class="admin-uploads">'+(bridge()?.adminLibrary?.()||'<section class="admin-card">Biblioteca indisponível.</section>')+'</div>'+
 (notice?'<p class="admin-notice" role="status">'+esc(notice)+'</p>':'')+
 '</div>';
}
function afterRender(){if(!isAdmin())return; if(Date.now()-lastPresence>10000)loadPresence();window.uentzoulLibraryManager?.refresh?.();}
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
 if(e.target.closest('[data-admin-refresh]')&&isAdmin()){heartbeat().then(loadPresence);}
});
window.addEventListener('uentzoul:auth',()=>{refresh();heartbeat();});
window.addEventListener('focus',()=>{refresh();heartbeat();});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){refresh();heartbeat();}});
window.addEventListener('online',()=>{refresh();heartbeat();});
setInterval(()=>{if(document.visibilityState==='visible'){refresh();heartbeat();}},45000);
window.uentzoulAdminConfig={isAdmin,render,afterRender,refresh,loadPresence};
let tries=0;
const start=()=>{if(client()){refresh();heartbeat()}else if(tries++<40)setTimeout(start,800)};
start();
})();
