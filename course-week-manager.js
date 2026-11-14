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
 const assigned=weekRows.filter(r=>r.semester===semester&&r.subject===subject);
 const maxWeek=Math.max(18,...assigned.map(r=>r.week_number));
 const groups=Array.from({length:maxWeek},(_,i)=>i+1).map(n=>{
  const records=assigned.filter(r=>r.week_number===n).sort((a,b)=>a.position-b.position);
  return '<details class="pm-week-group" '+(n===1?'open':'')+'><summary><span class="pm-week-number">SEMANA '+String(n).padStart(2,'0')+'</span><strong>Semana '+n+'</strong><small>'+records.length+' '+(records.length===1?'material':'materiais')+'</small><span class="pm-week-chevron" aria-hidden="true">⌄</span></summary><div class="pm-week-content">'+
  (records.length?records.map(r=>{
   const m=map.get(r.resource_key);
   return m?'<div class="pm-week-row">'+card(m)+' '+(admin()?'<button type="button" class="pm-week-remove" data-pm-week-remove="'+esc(r.resource_key)+'" data-pm-week-number="'+n+'" data-pm-week-subject="'+esc(subject)+'" data-pm-week-sem="'+esc(semester)+'" aria-label="Retirar arquivo da semana '+n+'">Retirar</button>':'')+'</div>':
    '<p class="admin-muted">Arquivo não disponível no acervo atual.</p>';
  }).join(''):'<p class="pm-week-empty">Nenhum material adicionado nesta semana.</p>')+
  '</div></details>';
 }).join('');
 const choices=items.map(m=>'<option value="'+esc(resourceKey(m))+'">'+esc(m.title)+'</option>').join('');
 const add=admin()?'<form class="pm-week-form" id="pmWeekForm"><h3>Organizar arquivo por semana</h3><p>Escolha um arquivo do acervo e a semana em que ele será exibido. O arquivo original continua no Acervo geral.</p><input type="hidden" name="semester" value="'+esc(semester)+'"><input type="hidden" name="subject" value="'+esc(subject)+'">'+
 '<label>Arquivo<select name="resource_key" required>'+choices+'</select></label>'+
 '<label>Semana<input type="number" name="week_number" min="1" max="30" value="1" required></label>'+
 '<button type="submit" '+(!items.length?'disabled':'')+'>Adicionar à semana</button></form>':'';
 return {tabs:base,weekly:true,body:'<div class="pm-weeks-intro"><strong>Organização por semana</strong><p>Os materiais aparecem na semana correspondente, como no Moodle. É possível consultar os mesmos arquivos também no Acervo geral.</p></div>'+add+'<div class="pm-week-list">'+groups+'</div>'};
}
async function addWeek(form){
 if(!admin()||saving)return;
 const data=new FormData(form),semester=String(data.get('semester')),subject=String(data.get('subject'));
 const resource_key=String(data.get('resource_key')),week_number=Number(data.get('week_number'));
 if(!resource_key||!Number.isInteger(week_number)||week_number<1||week_number>30)return;
 saving=true;
 try{
  const {error}=await client().from(WEEKS).upsert({semester,subject,resource_key,week_number,position:weekRows.filter(r=>r.semester===semester&&r.subject===subject&&r.week_number===week_number).length},{onConflict:'semester,subject,resource_key,week_number'});
  if(error)throw error;await reload();
 }catch(e){alert('Não foi possível organizar o arquivo: '+(e.message||e))}
 finally{saving=false;bridge()?.refreshNav?.()}
}
async function removeWeek(button){
 if(!admin()||saving)return;
 saving=true;
 try{
  const {error}=await client().from(WEEKS).delete().eq('semester',button.dataset.pmWeekSem).eq('subject',button.dataset.pmWeekSubject).eq('week_number',Number(button.dataset.pmWeekNumber)).eq('resource_key',button.dataset.pmWeekRemove);
  if(error)throw error;await reload();
 }catch(e){alert('Não foi possível retirar o arquivo: '+(e.message||e))}
 finally{saving=false;bridge()?.refreshNav?.()}
}
document.addEventListener('toggle',e=>{if(e.target.id==='pmCourseAdmin')openAdmin=e.target.open},true);
document.addEventListener('submit',e=>{if(e.target.id==='pmSubjectForm'){e.preventDefault();addSubject(e.target)}else if(e.target.id==='pmWeekForm'){e.preventDefault();addWeek(e.target)}});
document.addEventListener('click',e=>{
 const tab=e.target.closest('[data-pm-material-tab]');
 if(tab){tabs.set(tabKey(tab.dataset.pmSem,tab.dataset.pmSubject),tab.dataset.pmMaterialTab);bridge()?.refreshNav?.();return}
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