/* PsicoMoodle — matérias adicionais e materiais organizados por semana. */
(()=>{
'use strict';
if(window.PSICO_COURSE_MANAGER)return;
const SUBJECTS='uentzoul_extra_subjects',WEEKS='uentzoul_material_weeks';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const auth=()=>window.uentzoulAIAuth;
const client=()=>auth()?.client?.();
const admin=()=>window.uentzoulAdminConfig?.isAdmin?.()===true;
const bridge=()=>window.uentzoulAdminBridge;
let additional=[],weekRows=[],loaded=false,notice='',saving=false,openAdmin=false;
const tabs=new Map();
let weekEditState=null,weekNotice='';
const colors=['#6577b2','#44877e','#af7181','#a48755','#786fba','#9370a7','#4c87aa'];
const resourceKey=m=>String(m._libraryKey||m.subject+'::'+m.title);
function rerender(){bridge()?.refreshNav?.();bridge()?.rerenderAdmin?.();}
async function reload(){
 const c=client();if(!c)return;
 try{
  const [subj,week]=await Promise.all([
   c.from(SUBJECTS).select('id,semester,subject_key,name,code,hours,color').order('name'),
   c.from(WEEKS).select('semester,subject,resource_key,week_number,position').order('week_number').order('position')
  ]);
  if(subj.error)throw subj.error;
  if(week.error)throw week.error;
  const a=JSON.stringify(subj.data||[]),b=JSON.stringify(week.data||[]);
  const changed=!loaded||a!==JSON.stringify(additional)||b!==JSON.stringify(weekRows);
  additional=subj.data||[];weekRows=week.data||[];loaded=true;
  bridge()?.applyExtraSubjects?.(additional);
  if(changed)rerender();
 }catch(e){console.warn('Catálogo de disciplinas e semanas indisponível:',e);}
}
function adminPanel(){
 if(!admin())return '';
 return '<details class="admin-card pm-manager-admin" '+(openAdmin?'open':'')+' id="pmCourseAdmin"><summary><strong>Gerenciar disciplinas e semanas</strong><span>1º e 3º semestres · organização semanal</span></summary>'+
 '<div class="pm-admin-content"><p class="admin-muted">Cadastre disciplinas do primeiro e terceiro semestre. Os cartões ficam visíveis para todos. Os nomes já existentes são mantidos.</p>'+
 '<form id="pmSubjectForm" class="pm-admin-form"><label>Semestre<select name="semester"><option value="2026/1">1º semestre · 2026/1</option><option value="2027/1">3º semestre · 2027/1</option></select></label>'+
 '<label>Nome da disciplina<input name="name" maxlength="180" minlength="3" required placeholder="Nome completo da disciplina"></label>'+
 '<label>Código (opcional)<input name="code" maxlength="40" placeholder="Ex.: 9615G-02"></label>'+
 '<label>Carga horária (opcional)<input name="hours" type="number" min="0" max="600" value="0"></label>'+
 '<button type="submit" class="admin-primary" '+(saving?'disabled':'')+'>Adicionar disciplina</button></form>'+
 (notice?'<p class="pm-manager-notice" role="status">'+esc(notice)+'</p>':'')+
 '<h3>Disciplinas adicionadas pelo Admin</h3>'+
 (additional.length?'<div class="pm-admin-subject-list">'+additional.map(r=>'<div><span><strong>'+esc(r.name)+'</strong><small>'+esc(r.semester)+(r.code?' · '+esc(r.code):'')+'</small></span><button type="button" data-pm-remove-subject="'+esc(r.id)+'" '+(saving?'disabled':'')+'>Excluir</button></div>').join('')+'</div>':'<p class="admin-muted">Nenhuma disciplina extra cadastrada até agora.</p>')+
 '<p class="admin-muted">A distribuição de arquivos por semana é feita dentro de cada matéria, na aba <strong>Por semanas</strong>.</p></div></details>';
}
function hashName(s){return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,54);}
async function addSubject(form){
 if(!admin()||saving)return;
 const values=new FormData(form),semester=String(values.get('semester')||'');
 const name=String(values.get('name')||'').trim(),code=String(values.get('code')||'').trim(),hours=Number(values.get('hours')||0);
 if(!['2026/1','2027/1'].includes(semester)||name.length<3||name.length>180||!Number.isInteger(hours)||hours<0||hours>600)return;
 const existing=bridge()?.getSemesterSubjects?.(semester)||{};
 if(Object.values(existing).some(s=>String(s.name).toLocaleLowerCase('pt-BR')===name.toLocaleLowerCase('pt-BR'))){notice='Esta disciplina já existe neste semestre.';rerender();return}
 saving=true;
 try{
  const base=hashName(name)||'materia';
  let key='admin-'+base,i=2;
  while(existing[key]||additional.some(r=>r.semester===semester&&r.subject_key===key))key='admin-'+base+'-'+i++;
  const c=client();
  const check=await c.rpc('uentzoul_is_admin');
  if(check.error||check.data!==true)throw Error('Acesso administrativo não confirmado.');
  const {error}=await c.from(SUBJECTS).insert({semester,subject_key:key,name,code,hours,color:colors[additional.length%colors.length]});
  if(error)throw error;
  notice='Disciplina adicionada com sucesso.';form.reset();await reload();
 }catch(e){notice='Não foi possível adicionar: '+(e.message||e)}
 finally{saving=false;rerender();}
}
async function removeSubject(id){
 if(!admin()||saving||!confirm('Excluir esta disciplina adicionada pelo administrador?'))return;
 saving=true;
 try{
  const {error}=await client().from(SUBJECTS).delete().eq('id',id);
  if(error)throw error;
  notice='Disciplina extra excluída.';await reload();
 }catch(e){notice='Falha ao excluir: '+(e.message||e)}
 finally{saving=false;rerender()}
}
function tabKey(sem,subject){return sem+'|'+subject}
function weeklyView(semester,subject,materials,card){
 const mode=tabs.get(tabKey(semester,subject))||'general';
 const base='<div class="pm-material-tabs" role="tablist" aria-label="Organização dos materiais">'+
 '<button type="button" role="tab" aria-selected="'+(mode==='general')+'" data-pm-material-tab="general" data-pm-sem="'+esc(semester)+'" data-pm-subject="'+esc(subject)+'">▤ Acervo geral</button>'+
 '<button type="button" role="tab" aria-selected="'+(mode==='weeks')+'" data-pm-material-tab="weeks" data-pm-sem="'+esc(semester)+'" data-pm-subject="'+esc(subject)+'">▦ Por semanas</button></div>';
 if(mode==='general')return {tabs:base,weekly:false};
 const items=(materials||[]).filter(m=>m.available&&m._libraryUpload?.exam_scope!==false);
 const map=new Map(items.map(m=>[resourceKey(m),m]));
 const context=tabKey(semester,subject);
 const editing=admin()&&weekEditState?.context===context;
 const assigned=editing?weekEditState.rows:weekRows.filter(r=>r.semester===semester&&r.subject===subject);
 const maxWeek=Math.max(18,...assigned.map(r=>r.week_number));
 const groups=Array.from({length:maxWeek},(_,i)=>i+1).map(n=>{
  const records=assigned.filter(r=>r.week_number===n).sort((a,b)=>a.position-b.position);
  return '<details class="pm-week-group" '+(n===1?'open':'')+'><summary><span class="pm-week-number">SEMANA '+String(n).padStart(2,'0')+'</span><strong>Semana '+n+'</strong><small>'+records.length+' '+(records.length===1?'material':'materiais')+'</small><span class="pm-week-chevron" aria-hidden="true">⌄</span></summary><div class="pm-week-content">'+
  (records.length?records.map(r=>{
   const m=map.get(r.resource_key);
   return m?'<div class="pm-week-row">'+card(m)+' '+(editing?'<button type="button" class="pm-week-remove" data-pm-week-remove="'+esc(r.resource_key)+'" data-pm-week-number="'+n+'" data-pm-week-subject="'+esc(subject)+'" data-pm-week-sem="'+esc(semester)+'" aria-label="Retirar arquivo da semana '+n+'">Retirar</button>':'')+'</div>':
    '<p class="admin-muted">Arquivo não disponível no acervo atual.</p>';
  }).join(''):'<p class="pm-week-empty">Nenhum material adicionado nesta semana.</p>')+
  '</div></details>';
 }).join('');
 const choices=items.map(m=>'<option value="'+esc(resourceKey(m))+'">'+esc(m.title)+'</option>').join('');
 const add=editing?'<form class="pm-week-form" id="pmWeekForm"><h3>Organizar arquivo por semana</h3><p>Escolha um arquivo do acervo e a semana em que ele será exibido. O arquivo original continua no Acervo geral.</p><input type="hidden" name="semester" value="'+esc(semester)+'"><input type="hidden" name="subject" value="'+esc(subject)+'">'+
 '<label>Arquivo<select name="resource_key" required>'+choices+'</select></label>'+
 '<label>Semana<input type="number" name="week_number" min="1" max="30" value="1" required></label>'+
 '<button type="submit" '+(!items.length?'disabled':'')+'>Adicionar à semana</button></form>':'';
 const toolbar=admin()?'<div class="pm-week-toolbar">'+
  (editing?'<span class="pm-week-edit-message">Modo de edição · escolha os arquivos e suas semanas. As alterações serão publicadas ao salvar.</span>'+
   '<div class="pm-week-toolbar-actions"><button type="button" class="pm-cancel" data-pm-week-cancel>Cancelar</button><button type="button" class="pm-save" data-pm-week-save '+(saving?'disabled':'')+'>Salvar organização</button></div>':
   '<button type="button" class="pm-edit-button" data-pm-week-edit="'+esc(context)+'">✎ Editar</button>')+'</div>':'';
 return {tabs:base,weekly:true,body:'<div class="pm-weeks-intro"><strong>Organização por semana</strong><p>Os materiais aparecem na semana correspondente, como no Moodle. É possível consultar os mesmos arquivos também no Acervo geral.</p></div>'+toolbar+
 (weekNotice?'<p class="pm-save-notice" role="status">'+esc(weekNotice)+'</p>':'')+add+
 '<div class="pm-week-list">'+groups+'</div>'};
}
function weekContext(form){
 const f=new FormData(form);
 return {semester:String(f.get('semester')||''),subject:String(f.get('subject')||''),resource_key:String(f.get('resource_key')||''),week_number:Number(f.get('week_number'))};
}
function enterWeekEdit(context){
 if(!admin()||saving)return;
 const [semester,subject]=String(context).split('|');
 if(!['2026/1','2026/2','2027/1'].includes(semester)||!subject)return;
 weekEditState={context,rows:weekRows.filter(r=>r.semester===semester&&r.subject===subject).map(r=>({...r})),dirty:false};
 weekNotice='';bridge()?.refreshNav?.();
}
function cancelWeekEdit(){
 if(saving)return;
 weekEditState=null;weekNotice='';bridge()?.refreshNav?.();
}
function addWeek(form){
 if(!admin()||saving||!weekEditState)return;
 const data=weekContext(form);
 if(tabKey(data.semester,data.subject)!==weekEditState.context)return;
 if(!data.resource_key||!Number.isInteger(data.week_number)||data.week_number<1||data.week_number>30)return;
 if(!Array.from(form.querySelector('[name="resource_key"]')?.options||[]).some(o=>o.value===data.resource_key))return;
 if(weekEditState.rows.some(r=>r.resource_key===data.resource_key&&r.week_number===data.week_number)){
  weekNotice='Este arquivo já está cadastrado na semana '+data.week_number+'.';bridge()?.refreshNav?.();return;
 }
 weekEditState.rows.push({...data,position:weekEditState.rows.filter(r=>r.week_number===data.week_number).length});
 weekEditState.dirty=true;weekNotice='Arquivo incluído na organização. Clique em Salvar organização para publicar.';
 bridge()?.refreshNav?.();
}
function removeWeek(button){
 if(!admin()||saving||!weekEditState)return;
 const {pmWeekSem:semester,pmWeekSubject:subject,pmWeekRemove:resource_key,pmWeekNumber:n}=button.dataset;
 if(tabKey(semester,subject)!==weekEditState.context)return;
 const before=weekEditState.rows.length;
 weekEditState.rows=weekEditState.rows.filter(r=>!(r.resource_key===resource_key&&r.week_number===Number(n)));
 if(weekEditState.rows.length!==before){weekEditState.dirty=true;weekNotice='Arquivo retirado da semana. Salve para publicar.';bridge()?.refreshNav?.();}
}
async function saveWeekEdit(){
 const state=weekEditState;
 if(!admin()||saving||!state)return;
 if(!state.dirty){cancelWeekEdit();return;}
 const [semester,subject]=state.context.split('|'),c=client();
 if(!c)return;
 saving=true;weekNotice='';
 try{
  const check=await c.rpc('uentzoul_is_admin');
  if(check.error||check.data!==true)throw Error('Permissão de administrador não confirmada.');
  const previous=weekRows.filter(r=>r.semester===semester&&r.subject===subject);
  const key=r=>r.resource_key+'|'+r.week_number;
  const desired=new Set(state.rows.map(key));
  const existing=new Set(previous.map(key));
  for(const row of previous.filter(r=>!desired.has(key(r)))){
   const {error}=await c.from(WEEKS).delete()
    .eq('semester',semester).eq('subject',subject).eq('resource_key',row.resource_key).eq('week_number',row.week_number);
   if(error)throw error;
  }
  const added=state.rows.filter(r=>!existing.has(key(r)));
  if(added.length){
   const {error}=await c.from(WEEKS).upsert(added.map(r=>({semester,subject,resource_key:r.resource_key,week_number:r.week_number,position:r.position})),
    {onConflict:'semester,subject,resource_key,week_number'});
   if(error)throw error;
  }
  const verify=await c.from(WEEKS).select('resource_key,week_number').eq('semester',semester).eq('subject',subject);
  if(verify.error)throw verify.error;
  const actual=new Set((verify.data||[]).map(key));
  if(actual.size!==desired.size||[...desired].some(k=>!actual.has(k)))throw Error('Nem todos os vínculos foram confirmados. Confira e salve novamente.');
  weekEditState=null;weekNotice='Organização por semanas salva com sucesso.';
  await reload();
 }catch(e){weekNotice='Não foi possível salvar: '+(e.message||e);}
 finally{saving=false;bridge()?.refreshNav?.();}
}
document.addEventListener('toggle',e=>{if(e.target.id==='pmCourseAdmin')openAdmin=e.target.open},true);
document.addEventListener('submit',e=>{if(e.target.id==='pmSubjectForm'){e.preventDefault();addSubject(e.target)}else if(e.target.id==='pmWeekForm'){e.preventDefault();addWeek(e.target)}});
document.addEventListener('click',e=>{
 const tab=e.target.closest('[data-pm-material-tab]');
 if(tab){
  const context=tabKey(tab.dataset.pmSem,tab.dataset.pmSubject);
  if(tab.dataset.pmMaterialTab==='general'&&weekEditState?.context===context){
   if(weekEditState.dirty&&!confirm('Descartar as alterações feitas nas semanas?'))return;
   weekEditState=null;weekNotice='';
  }
  tabs.set(context,tab.dataset.pmMaterialTab);bridge()?.refreshNav?.();return;
 }
 const edit=e.target.closest('[data-pm-week-edit]');if(edit){enterWeekEdit(edit.dataset.pmWeekEdit);return}
 if(e.target.closest('[data-pm-week-cancel]')){cancelWeekEdit();return}
 if(e.target.closest('[data-pm-week-save]')){saveWeekEdit();return}
 const del=e.target.closest('[data-pm-remove-subject]');
 if(del){removeSubject(del.dataset.pmRemoveSubject);return}
 const week=e.target.closest('[data-pm-week-remove]');if(week)removeWeek(week);
});
window.PSICO_COURSE_MANAGER={adminPanel,weeklyView,reload};
window.addEventListener('uentzoul:auth',reload);
window.addEventListener('focus',()=>{if(document.visibilityState==='visible')reload()});
let tries=0;function start(){if(client())reload();else if(tries++<30)setTimeout(start,1000)}
start();
})();