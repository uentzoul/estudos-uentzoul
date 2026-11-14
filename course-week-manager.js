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

/* Seções verificadas nos vídeos do Moodle (2026/2).
   IDs numéricos preservam a tabela existente de vínculos, sem migração. */
const COURSE_SECTIONS={
 social:[
  [1,'Semana 1',['evolucao historica da psicologia social','silvia lane','homem em movimento']],
  [2,'Semana 2 - Origens do pensamento psicossociológico',['origens do pensamento psicossociologico','perspectivas psicossociologicas']],
  [4,'Semana 4',['texto complementar','slides complementar']],
  [5,'Semana 5 - Identidade',['identidade social','identidade e representacoes']],
  [6,'Semana 6 - Representações sociais',['representacoes sociais','representacoes sociais e clinica escola']],
  [7,'Semana 7 - Estigma e preconceito',['estigma e preconceito','construcao de territorio','preconceitos e estigmas']],
  [9,'Semana 9 - Psicologia Sócio-Histórica',['psicologia socio historica','ana bock','socio historica']],
  [10,'Semana 10 - Psicologia Social Crítica (Martín-Baró)',['martin baro','martin-baro','desideologizacao','psicologia social critica','psicologia da libertacao']],
  [11,'Semana 11 - Fatalismo e ideologia',['fatalismo','latino indolente','ideologia','ideologizacao']],
  [12,'Semana 12 - Temas atuais em psicologia social (T2)',['temas atuais em psicologia social','algoritmos e polarizacao','trabalho t2']],
  [14,'Semana 14',['epistemicidio','racismo e sexismo','grosfoguel']]
 ],
 avaliacao:[
  [1,'Plano de Ensino',['plano de ensino','cronograma']],
  [2,'TDE | Trabalho Discente Efetivo',['trabalho discente efetivo','tde']],
  [3,'História da Avaliação Psicológica e Diferença entre Testagem e AP',['historia da avaliacao','testagem e avaliacao psicologica','diferenca entre testagem','testagem e ap']],
  [4,'Atividade Prática 1',['atividade pratica 1','atividade pratica - aplicacao']],
  [5,'Satepsi',['satepsi','sistema de avaliacao de testes psicologicos']],
  [6,'Técnicas psicológicas',['tecnicas psicologicas']],
  [7,'Estudo Dirigido para Prova 1',['estudo dirigido ap p1','estudo dirigido prova 1','estudo dirigido 1']],
  [8,'Entrevista de Anamnese',['entrevista de anamnese','anamnese']],
  [9,'PSICODIAGNÓSTICO',['psicodiagnostico']],
  [10,'Bateria de Testes',['bateria de testes']],
  [11,'Hora do Jogo Diagnóstica',['hora do jogo diagnostica','hora de jogo diagnostica']],
  [12,'Atividade Prática 3 - WISC IV',['wisc iv','wisc-iv','atividade pratica 3']],
  [13,'Fundamentos da psicometria e da construção e adaptação de instrumentos',['fundamentos da psicometria','construcao e adaptacao de instrumentos','adaptacao de instrumentos']],
  [14,'Padronização e Normas Validade e Precisão',['padronizacao','normas validade e precisao','validade e precisao','normalizacao de testes']],
  [15,'Elaboração de Documentos',['elaboracao de documentos','laudo psicologico','parecer psicologico']],
  [16,'Entrevista de Devolução',['entrevista de devolucao','devolutiva','entrevista devolutiva']],
  [17,'AVALIAÇÃO NO CONTEXTO ORGANIZACIONAL',['contexto organizacional','avaliacao organizacional','recrutamento e selecao']],
  [18,'AVALIAÇÃO PSICOLÓGICA NO CONTEXTO HOSPITALAR',['contexto hospitalar','psicologia hospitalar']],
  [19,'AVALIAÇÃO PSICOLÓGICA NO CONTEXTO FORENSE',['contexto forense','avaliacao forense','pericia psicologica']],
  [20,'AVALIAÇÃO PSICOLÓGICA EM CASOS DE PACIENTES TRANS',['pacientes trans','pessoas trans','avaliacao psicologica trans']],
  [21,'Ética em avaliação psicológica',['etica em avaliacao psicologica','codigo de etica','etica em ap']],
  [22,'Estudo dirigido P2',['estudo dirigido p2','estudo dirigido prova 2','estudo dirigido ap 2']]
 ],
 tcc:[
  [1,'Plano de Ensino e Cronograma',['plano de ensino','cronograma']],
  [2,'Introdução ao modelo - TCCs',['introducao ao modelo','introducao tcc']],
  [3,'Behaviorismo Metodológico e Behaviorismo Radical',['behaviorismo metodologico','behaviorismo radical']],
  [4,'Análise do Comportamento',['analise do comportamento']],
  [5,'Condicionamento Respondente',['condicionamento respondente','condicionamento classico']],
  [6,'Condicionamento Operante',['condicionamento operante']],
  [7,'Cognitivismo Aspectos históricos e bases filosóficas',['cognitivismo aspectos historicos','bases filosoficas do cognitivismo']],
  [8,'Terapia Racional Emotiva Comportamental (TREC)',['terapia racional emotiva','trec','albert ellis']],
  [9,'Terapia Cognitiva de Beck',['terapia cognitiva de beck','aaron beck']],
  [10,'Estudo dirigido para a atividade avaliativa 2',['estudo dirigido tcc','roteiro de estudos para a a2','atividade avaliativa 2']],
  [11,'Terapia do Esquema',['terapia do esquema','esquemas iniciais desadaptativos','jeffrey young']],
  [12,'Terceira onda',['terceira onda','terapias de terceira onda']],
  [13,'Terapia de Aceitação e Compromisso (ACT)',['aceitacao e compromisso','terapia act','act na clinica','flexibilidade psicologica','desfusao cognitiva']]
 ],
 familia:[
  [1,'Plano de Ensino',['plano de ensino','cronograma']],
  [2,'Diferentes contextos familiares ao longo da história',['contextos familiares ao longo da historia','familia medieval']],
  [3,'Famílias do século XXI',['familias do seculo xxi','familias contemporaneas']],
  [4,'Ciclo Vital Familiar',['ciclo vital familiar']],
  [5,'Ciclo Vital Familiar - O casal: escolha, contrato e funcionalidade',['escolha contrato e funcionalidade','familia casal','o casal']],
  [6,'Família com filhos pequenos e adolescentes',['filhos pequenos e adolescentes','familia com filhos pequenos']],
  [7,'Infância Adolescência: Recursos',['infancia adolescencia','adolescencia recursos']],
  [8,'A saída dos filhos de casa/ geração canguru/variações da fase',['saida dos filhos de casa','geracao canguru']],
  [9,'Estágio Tardio da Vida',['estagio tardio','adultez tardia']],
  [10,'Revisão',['estudo dirigido familia','questoes orientadoras']],
  [11,'Divórcio e Recasamento',['divorcio','recasamento','familias monoparentais']],
  [12,'Família e segredos',['familia e segredos','segredos familiares','aula segredos']],
  [13,'FILME: Como os Nossos Pais - Trabalho do dia 14/10',['filme como nossos pais','como nossos pais']],
  [14,'Família em situações de Violência Conjugal',['violencia conjugal','violencia entre conjuges']],
  [15,'Famílias e população LGBTQIAPN+ PALESTRA Alexandre',['lgbtqiapn','palestra alexandre']],
  [16,'Família em situações de Violência contra a Criança',['violencia contra a crianca','abuso infantil','violencia infantil']],
  [17,'Famílias em situação de Morte e Luto na Família',['morte e luto','luto na familia','perdas e lutos']],
  [18,'Família em situações de dependência química - Caso',['dependencia quimica','uso de substancias']],
  [19,'Aula Rituais, mitos, e ritos de passagem',['rituais mitos','ritos de passagem']]
 ],
 grupos:[
  [1,'Plano de Ensino',['plano de ensino','cronograma']],
  [2,'Trabalho dos Artigos',['trabalho dos artigos','artigos do trabalho']],
  [3,'O que é um grupo e história da psicologia dos grupos',['historia da psicologia dos grupos','fundamentos teoricos','o que e um grupo']],
  [4,'Freud e a Psicologia das Massas',['psicologia das massas','freud e psicologia das massas']],
  [5,'Modalidades Grupais',['modalidades grupais','modalidades de grupo']],
  [6,'Kurt Lewin e a Dinâmica dos Grupos',['kurt lewin','dinamica dos grupos']],
  [7,'Wilfred Bion e os Pressupostos Básicos',['wilfred bion','pressupostos basicos']],
  [8,'Pichón-Rivière e os Grupos Operativos',['pichon riviere','grupos operativos']],
  [9,'Jacob Moreno e o Psicodrama',['jacob moreno','psicodrama','sociodrama']],
  [10,'Carl Rogers e os Grupos de Encontro',['carl rogers','carlrogers','grupos de encontro']],
  [11,'Grupos Virtuais',['grupos virtuais']],
  [12,'Normas ABNT - Biblioteca PUCRS',['normas abnt','biblioteca pucrs']],
  [13,'Livros em pdf',['livros em pdf']]
 ],
 meta:[
  [1,'Plano de Ensino e Cronograma',['plano de ensino','cronograma']],
  [2,'Slides da Disciplina',['slides da disciplina','slides 01','slides 02','slides 03','slides 07']],
  [3,'Material Bibliográfico',['material bibliografico','livro neurose','laplanche','roudiniesco','dicionario de psicanalise']],
  [4,'Estudos Dirigidos',['estudo dirigido p1','estudo dirigido p2','estudos dirigidos']],
  [5,'Vídeos Sugeridos e Aulas Gravadas',['video sugerido','aula gravada','dunker']],
  [6,'Trabalhos da Disciplina',['trabalhos da disciplina','trabalho da disciplina']]
 ]
};
function moodleSections(subject){return (COURSE_SECTIONS[subject]||[]).map(([number,label,aliases])=>({number,label,aliases}));}
function fold(s){return String(s||'').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();}
function suggestSection(subject,file,analysis,title){
 const defs=moodleSections(subject);if(!defs.length)return null;
 const filename=fold([file?.name,title].filter(Boolean).join(' '));
 const extracted=fold([analysis?.preview,(analysis?.hits||[]).join(' '),(analysis?.topics||[]).join(' '),analysis?.sectionText||''].join(' '));
 const ranked=defs.map(d=>{
  let points=0;
  for(const keyword of d.aliases){
   const word=fold(keyword);if(word.length<4)continue;
   if(filename.includes(word))points+=12;
   else if(extracted.includes(word))points+=4;
  }
  return {number:d.number,label:d.label,points};
 }).sort((a,b)=>b.points-a.points);
 const best=ranked[0],runner=ranked[1];
 return best&&best.points>=8&&best.points-(runner?.points||0)>=4?best:null;
}

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
 '<p class="admin-muted">No 2º semestre, o envio no Admin Config sugere a seção do Moodle automaticamente. Confira em <strong>Por semanas</strong>.</p></div></details>';
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
 const sections=semester==='2026/2'?moodleSections(subject):[];
 const named=sections.length>0;
 const sectionMap=new Map(sections.map(s=>[s.number,s]));
 // Mostrar somente seções que contêm materiais; sem grade artificial de 18 semanas vazias.
 const numbers=[...new Set(assigned.filter(r=>editing||map.has(r.resource_key)).map(r=>r.week_number))].sort((a,b)=>a-b);
 const groups=numbers.map((n,i)=>{
  const records=assigned.filter(r=>r.week_number===n).sort((a,b)=>a.position-b.position);
  const label=sectionMap.get(n)?.label||'Semana '+n;
  const shortLabel=named?'MOODLE':'SEMANA '+String(n).padStart(2,'0');
  return '<details class="pm-week-group" '+(i===0?'open':'')+'><summary><span class="pm-week-number">'+shortLabel+'</span><strong>'+esc(label)+'</strong><small>'+records.length+' '+(records.length===1?'material':'materiais')+'</small><span class="pm-week-chevron" aria-hidden="true">⌄</span></summary><div class="pm-week-content">'+
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
 (named?'<label>Seção do Moodle<select name="week_number" required>'+sections.map(s=>'<option value="'+s.number+'">'+esc(s.label)+'</option>').join('')+'</select></label>':
  '<label>Semana<input type="number" name="week_number" min="1" max="30" value="1" required></label>')+
 '<button type="submit" '+(!items.length?'disabled':'')+'>Adicionar à semana</button></form>':'';
 const toolbar=admin()?'<div class="pm-week-toolbar">'+
  (editing?'<span class="pm-week-edit-message">Modo de edição · escolha os arquivos e suas semanas. As alterações serão publicadas ao salvar.</span>'+
   '<div class="pm-week-toolbar-actions"><button type="button" class="pm-cancel" data-pm-week-cancel>Cancelar</button><button type="button" class="pm-save" data-pm-week-save '+(saving?'disabled':'')+'>Salvar organização</button></div>':
   '<button type="button" class="pm-edit-button" data-pm-week-edit="'+esc(context)+'">✎ Editar</button>')+'</div>':'';
 return {tabs:base,weekly:true,body:'<div class="pm-weeks-intro"><strong>Organização por semana</strong><p>Os materiais aparecem na semana correspondente, como no Moodle. É possível consultar os mesmos arquivos também no Acervo geral.</p></div>'+toolbar+
 (weekNotice?'<p class="pm-save-notice" role="status">'+esc(weekNotice)+'</p>':'')+add+
 '<div class="pm-week-list">'+(groups||'<p class="pm-week-empty">Nenhum material organizado nesta visualização. Novos arquivos podem ser classificados ao serem enviados pelo Admin Config.</p>')+'</div>'};
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
window.PSICO_COURSE_MANAGER={adminPanel,weeklyView,reload,moodleSections,suggestSection};
window.addEventListener('uentzoul:auth',reload);
window.addEventListener('focus',()=>{if(document.visibilityState==='visible')reload()});
let tries=0;function start(){if(client())reload();else if(tries++<30)setTimeout(start,1000)}
start();
})();