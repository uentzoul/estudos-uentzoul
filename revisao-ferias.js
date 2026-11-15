/* PsicoMoodle — Revisão de Férias. Meses expansíveis, um por vez.
   As linhas do tempo do 1º e do 2º semestre são públicas no Supabase (RLS).
   Não cria novas abas de semestre: usa a escolha existente no site. */
(()=>{
'use strict';
if(window.PSICO_VACATION_REVIEW)return;
const TABLE='uentzoul_vacation_review_events';
const UPLOAD_TABLE='uentzoul_library_uploads';
const LIBRARY_BUCKET='uentzoul-library-files';
const SUBJECTS={
 profissao:['Psicologia como Profissão','#3c91a4','Profissão'],
 processos:['Processos Psicológicos Básicos','#6296d1','PPB'],
 direitos:['Psicologia e Direitos Humanos','#d78185','Direitos Humanos'],
 epistemologia:['Fundamentos Epistemológicos em Psicologia','#9e81cc','Epistemologia'],
 historia:['História da Psicologia','#d39e54','História'],
 sociocognitivas:['Teorias Sociocognitivas','#55a58d','Sociocognitivas'],
 desenvolvimento:['Psicologia do Desenvolvimento (Ciclo Vital)','#c078a8','Desenvolvimento'],
 // Segundo semestre: mesma identificação cromática usada nas disciplinas do site.
 tcc:['Teorias e Modelos Comportamentais e Cognitivos','#3963c7','TCC'],
 familia:['Psicologia da Família','#b46e3d','Família'],
 meta:['Metapsicologia e Epistemologia Psicanalítica','#8463b1','Metapsicologia'],
 grupos:['Psicologia dos Grupos','#2a967d','Grupos'],
 social:['Psicologia Social','#ac597f','Social'],
 avaliacao:['Fundamentos e Técnicas em Avaliação Psicológica','#27869e','Avaliação']
};
const MONTHS={1:[3,4,5,6],2:[8,9,10,11]};
const MONTH_NAME={3:'Março',4:'Abril',5:'Maio',6:'Junho',8:'Agosto',9:'Setembro',10:'Outubro',11:'Novembro'};
const MONTH_SHORT={3:'MAR',4:'ABR',5:'MAI',6:'JUN',8:'AGO',9:'SET',10:'OUT',11:'NOV'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let visible=false,semester=1,events=[],openedMonth=null,selectedEvent=null,loading=false,seq=0;
let uploadedFiles=[],fileIndex=new Map(),fileLoadError='';
let navObserver=null,mainObserver=null,monthSequence=0;
const nav=()=>document.getElementById('nav');
const main=()=>document.querySelector('.app > .main')||document.querySelector('main.main')||document.querySelector('.main');
const admin=()=>window.uentzoulAdminConfig?.isAdmin?.()===true;
const canView=(sem=semester)=>sem===1||sem===2||admin();
const client=()=>window.uentzoulAIAuth?.client?.();
const currSemester=()=>{
 const el=document.getElementById('semesterCurrent');
 const active=document.querySelector('#semesterDropdown [aria-selected="true"],#semesterDropdown [data-semester].active');
 const value=(active?.getAttribute('data-semester')||active?.textContent||el?.getAttribute('data-semester')||el?.textContent||'').toLowerCase();
 if(/2026\s*\/\s*2|segundo|2\s*[º°o]\s*semestre|semestre\s*2/.test(value))return 2;
 if(/2026\s*\/\s*1|primeiro|1\s*[º°o]\s*semestre|semestre\s*1/.test(value))return 1;
 // Só utilizamos o semestre previamente selecionado, nunca uma data de prova.
 return Number(el?.dataset?.semester)==2?2:1;
};
function colorFor(subject){
 const meta=SUBJECTS[subject];if(!meta)return '#8791aa';
 const items=Array.from(document.querySelectorAll('#subjectNav [data-subject],#subjectNav [data-id],#subjectNav .sidebtn,[data-subject-color]'));
 const match=items.find(el=>el.dataset.subject===subject||el.dataset.id===subject||
  (el.textContent||'').trim().toLowerCase()===meta[0].toLowerCase());
 if(match){
  for(const target of [match,match.querySelector('[style]'),match.querySelector('.subject-icon'),match.querySelector('.subject-nav-icon')].filter(Boolean)){
   const direct=target.style?.getPropertyValue('--subject-accent')||
    target.style?.getPropertyValue('--accent')||target.dataset?.subjectColor;
   if(direct&&/^(#|rgb|hsl|color\()/i.test(direct.trim()))return direct.trim();
   // Também aproveita as cores definidas em CSS nos botões das disciplinas.
   const styles=getComputedStyle(target);
   const inherited=['--subject-accent','--subject-color','--course-accent','--course-color'];
   for(const prop of inherited){
    const computed=styles.getPropertyValue(prop).trim();
    if(computed&&/^(#|rgb|hsl|color\()/i.test(computed))return computed;
   }
  }
 }
 return meta[1];
}
const dateOf=e=>new Date(String(e.event_date||'').slice(0,10)+'T12:00:00');
const monthOf=e=>dateOf(e).getMonth()+1;
const dateLabel=e=>String(e.event_date||'').slice(8,10)+'/'+String(e.event_date||'').slice(5,7);
const plural=(n,single,multi)=>n===1?single:multi;
function navButton(){
 const el=nav();if(!el)return;
 // O HTML antigo ainda trazia um segundo item estático "Revisão de Férias — Em breve".
 // Preserva os outros avisos (por exemplo, Trabalhos) e mantém só a entrada funcional.
 for(const item of el.querySelectorAll('.nav-upcoming')){
  if(item.querySelector('.nav-upcoming-name')?.textContent?.trim()==='Revisão de Férias')item.remove();
 }
 if(document.getElementById('navVacationReview')){updateNavStatus();return;}
 const button=document.createElement('button');
 button.type='button';button.id='navVacationReview';button.className='sidebtn';
 button.setAttribute('aria-label','Revisão de Férias');
 button.innerHTML='<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17l4-4 4 3 6-9 2 2"/><path d="M3 21h18"/><circle cx="6" cy="7" r="2"/></svg><span class="nav-label"><span class="nav-label-full">Revisão de Férias</span><span class="nav-label-short">Férias</span></span>';
 button.addEventListener('click',async e=>{
  e.stopPropagation();await show();
 });
 const before=el.querySelector('.nav-upcoming')||el.querySelector('[data-page="admin"]');
 if(before)el.insertBefore(button,before);else el.appendChild(button);
 updateNavStatus();
}
function updateNavStatus(){
 const b=document.getElementById('navVacationReview');if(!b)return;
 // Revisões do primeiro e do segundo semestre liberadas também para visitantes.
 b.classList.remove('vr-pending');
 b.querySelector('.vr-soon')?.remove();
 b.title='Abrir Revisão de Férias';
 b.setAttribute('aria-label','Revisão de Férias');
}
function rootElement(){
 const container=main();if(!container)return null;
 let root=document.getElementById('vr-root');
 if(!root){root=document.createElement('section');root.id='vr-root';root.setAttribute('aria-label','Revisão de Férias');
  root.addEventListener('click',handleClick);}
 if(root.parentNode!==container)container.appendChild(root);
 return root;
}
function setActive(active){
 const container=main();if(!container)return;
 container.classList.toggle('vr-active',active);
 document.querySelector('#navVacationReview')?.classList.toggle('active',active);
 if(active){
  nav()?.querySelectorAll('[data-page].active').forEach(b=>b.classList.remove('active'));
 }else{
  document.querySelector('#navVacationReview')?.classList.remove('active');
 }
}
function deactivate(){
 visible=false;seq++;setActive(false);
 openedMonth=null;selectedEvent=null;indexMaterials([]);fileLoadError='';
 document.getElementById('vr-root')?.remove();
}
function privateHTML(){
 return '<div class="vr-private"><span class="vr-private-icon" aria-hidden="true">⌁</span><h2>Revisão indisponível</h2>'+
  '<p>Selecione o primeiro ou o segundo semestre para consultar a linha do tempo.</p></div>';
}
function hero(){
 const which=semester===1?'Primeiro semestre':'Segundo semestre',count=events.length;
 const intro=semester===1?
  'Aproveite as férias para revisar os conteúdos mais importantes estudados no primeiro semestre. Relembre os principais assuntos pela linha do tempo e consulte os materiais relacionados. Para explorar as revisões de outros semestres, use o seletor de semestres e confira os que já estiverem disponíveis.':
  'Aproveite as férias para revisar os conteúdos mais importantes estudados no segundo semestre. Relembre os principais assuntos pela linha do tempo e consulte os materiais relacionados. Para explorar as revisões de outros semestres, use o seletor de semestres e confira os que já estiverem disponíveis.';
 return '<header class="vr-hero">'+
  '<div class="vr-hero-grid"><div class="vr-hero-main">'+
  '<div class="vr-overline"><span class="vr-dot-kicker" aria-hidden="true"></span> PSICOMOODLE / ARQUIVO DE APRENDIZAGENS</div>'+
  '<span class="vr-hero-eyebrow">Revisão de Férias · 2026</span>'+
  '<h1>O que vale<br><em>levar adiante.</em></h1>'+
  '<p>'+intro+'</p>'+
  '<div class="vr-hero-bottom"><span class="vr-year"><span aria-hidden="true">✦</span> '+which+'</span>'+
  '<span class="vr-hint">'+(count?count+' momentos selecionados':'Novos marcos em preparação')+'</span></div>'+
  '</div><div class="vr-hero-art" aria-hidden="true"><span class="vr-art-ring vr-art-ring-one"></span>'+
  '<span class="vr-art-ring vr-art-ring-two"></span><span class="vr-art-ring vr-art-ring-three"></span>'+
  '<span class="vr-art-symbol">Ψ</span><span class="vr-art-annotation">MEMÓRIA / PERCURSO / CONEXÕES</span></div></div></header>';
}
function monthsHTML(){
 const months=MONTHS[semester],openedIndex=months.indexOf(openedMonth);
 return '<section class="vr-months-wrap"><div class="vr-months-intro">'+
 '<div><span class="vr-section-kicker">01 — EXPLORE O PERCURSO</span><h2>Uma história em quatro capítulos.</h2>'+
 '<p>O primeiro mês já está aberto. Selecione outro mês para continuar; só um capítulo fica aberto por vez.</p></div>'+
 '<span class="vr-timeline-year">2026</span></div>'+
 '<nav class="vr-months" style="--vr-progress:'+(openedIndex<0?0:(openedIndex/(months.length-1)*100))+'%" aria-label="Meses do '+(semester===1?'primeiro':'segundo')+' semestre">'+
 months.map((m,i)=>{
  const total=events.filter(e=>monthOf(e)===m).length,on=openedMonth===m;
  return '<button type="button" class="vr-month'+(on?' is-active':'')+'" data-vr-month="'+m+'" aria-expanded="'+on+'" aria-controls="vr-panel-'+m+'">'+
   '<span class="vr-month-index">CAPÍTULO 0'+(i+1)+'</span><span class="vr-month-orb" aria-hidden="true"><span></span></span>'+
   '<strong>'+MONTH_NAME[m]+'</strong><small>'+total+' '+plural(total,'momento','momentos')+'</small></button>';
 }).join('')+'</nav>'+
 months.map(m=>'<div class="vr-expand-shell'+(openedMonth===m?' is-open':'')+'" id="vr-panel-'+m+'" aria-hidden="'+(openedMonth!==m)+'">'+
  '<div class="vr-expand-clip"'+(openedMonth===m?'':' inert')+'><div class="vr-month-detail">'+monthHTML(m)+'</div></div></div>').join('')+
 '</section>';
}
function monthHTML(month){
 const monthEvents=events.filter(e=>monthOf(e)===month).sort((a,b)=>a.event_date.localeCompare(b.event_date)||a.subject.localeCompare(b.subject));
 if(!monthEvents.length)return '<div class="vr-month-detail-head"><div><span class="vr-section-kicker">CAPÍTULO DO SEMESTRE</span><h3>'+MONTH_NAME[month]+'</h3></div></div>'+
  '<div class="vr-empty"><span aria-hidden="true">✧</span><strong>Este capítulo ainda está em construção.</strong><p>Os marcos deste mês serão adicionados depois da conferência dos cronogramas e materiais.</p></div>';
 return '<div class="vr-month-detail-head"><div><span class="vr-section-kicker">CAPÍTULO / '+MONTH_SHORT[month]+' 2026</span><h3>'+MONTH_NAME[month]+'</h3>'+
 '<p>Momentos marcantes de aprendizagem, organizados por data.</p></div>'+
 '<span class="vr-count">'+String(monthEvents.length).padStart(2,'0')+' MOMENTOS</span></div>'+
 '<div class="vr-story-layout"><div class="vr-story-list" aria-label="Conteúdos estudados em '+MONTH_NAME[month]+'">'+
 monthEvents.map((e,i)=>{
  const col=colorFor(e.subject),abbr=SUBJECTS[e.subject]?.[2]||e.subject,on=selectedEvent===e.id;
  return '<button type="button" class="vr-event'+(on?' is-selected':'')+'" data-vr-event="'+esc(e.id)+'" data-major="'+(e.intensity==='major')+'" style="--vr-color:'+esc(col)+';--vr-order:'+i+'" title="'+esc(e.title)+'" aria-label="'+esc(dateLabel(e)+' · '+abbr+' · '+e.title)+'" aria-expanded="'+on+'">'+
   '<span class="vr-event-marker" aria-hidden="true"><span class="vr-event-orb"></span></span>'+
   '<span class="vr-event-content"><span class="vr-event-kicker"><span class="vr-event-date">'+dateLabel(e)+'</span><span class="vr-event-subject">'+esc(abbr)+'</span>'+
   (e.intensity==='major'?'<span class="vr-event-important">ESSENCIAL</span>':'')+'</span>'+
   '<span class="vr-event-title">'+esc(e.title)+'</span><span class="vr-event-caption">'+esc(e.importance.slice(0,105))+(e.importance.length>105?'…':'')+'</span></span>'+
   '<span class="vr-event-arrow" aria-hidden="true">↗</span></button>';
 }).join('')+'</div>'+
 '<div class="vr-story-preview" id="vrSelectedCard-'+month+'">'+(selectedEvent?eventHTML(monthEvents.find(e=>e.id===selectedEvent)):emptyPreview())+'</div></div>';
}
function emptyPreview(){
 return '<div class="vr-preview-empty"><span class="vr-preview-icon" aria-hidden="true">✳</span>'+
 '<span class="vr-preview-label">SEU PRÓXIMO CLIQUE</span><h4>Um ponto.<br>Uma descoberta.</h4>'+
 '<p>Selecione um marco na linha ao lado para explorar o conceito, entender sua importância e encontrar os materiais relacionados.</p>'+
 '<div class="vr-preview-foot"><span aria-hidden="true">↗</span> ESCOLHA UM MOMENTO</div></div>';
}

/* Vincula cada material da linha do tempo ao arquivo original armazenado.
   O número da cópia "(1)", "(2)" etc. não faz parte do título acadêmico.
   Um nome só vira botão quando aponta para UM documento da mesma disciplina e semestre. */
function materialName(name){
 return String(name||'').normalize('NFC').toLocaleLowerCase('pt-BR')
  .replace(/\.(pdf|docx|pptx)$/i,'').replace(/(\s*\(\d+\))+$/g,'').trim();
}
function materialScope(event){
 return Number(event.semester)===1?'2026/1::'+event.subject:event.subject;
}
function indexMaterials(rows){
 uploadedFiles=Array.isArray(rows)?rows:[];
 const index=new Map();
 for(const file of uploadedFiles){
  if(!file?.resource_key||!file.storage_path||!file.file_subject)continue;
  const keys=new Set([file.filename,file.display_title].filter(Boolean).map(materialName));
  for(const label of keys){
   const key=file.file_subject+'\u0000'+label;
   if(!index.has(key))index.set(key,[]);
   if(!index.get(key).some(x=>x.resource_key===file.resource_key))index.get(key).push(file);
  }
 }
 fileIndex=index;
}
function materialFor(event,name){
 const matches=fileIndex.get(materialScope(event)+'\u0000'+materialName(name))||[];
 return matches.length===1?matches[0]:null;
}
function materialButtons(event){
 const names=Array.isArray(event.material_names)?event.material_names:[];
 if(!names.length)return '<p class="vr-material-note">Ainda não foram indicados documentos para este marco.</p>';
 return '<ul class="vr-material-list">'+names.map((label,index)=>{
  const file=materialFor(event,label),nice=file?.display_title||String(label).replace(/\.(pdf|docx|pptx)$/i,'').trim();
  if(!file)return '<li><span class="vr-material-unavailable"><span aria-hidden="true">▤</span><span><strong>'+esc(nice)+'</strong><small>Arquivo original indisponível no acervo</small></span></span></li>';
  const extension=/\.(pdf|docx|pptx)$/i.exec(file.filename||label)?.[1]?.toUpperCase()||'ARQUIVO';
  return '<li><button type="button" class="vr-material-button" data-vr-material="'+index+'" aria-label="'+esc('Abrir documento completo: '+nice)+'">'+
   '<span class="vr-file-glyph" aria-hidden="true">▤</span><span class="vr-material-copy"><strong>'+esc(nice)+'</strong>'+
   '<small>'+extension+' ORIGINAL · ABRIR NA ÍNTEGRA</small></span><span class="vr-material-arrow" aria-hidden="true">↗</span>'+
   '</button></li>';
 }).join('')+'</ul>'+
 (fileLoadError?'<p class="vr-material-note">'+esc(fileLoadError)+'</p>':'');
}
function fileFeedback(message,kind){
 const box=document.querySelector('#vr-root .vr-material-feedback');
 if(box){box.textContent=message||'';box.dataset.state=kind||'info';}
}
async function openMaterial(index){
 if(!visible||!canView()||!Number.isInteger(index)||index<0)return;
 const event=events.find(x=>x.id===selectedEvent);
 if(!event||monthOf(event)!==openedMonth)return;
 const label=event.material_names?.[index],file=label?materialFor(event,label):null;
 if(!file){fileFeedback('Este documento ainda não está disponível no acervo original.','error');return;}
 const user=window.uentzoulAIAuth?.user?.();
 const c=client();
 if(!c){fileFeedback('O serviço de arquivos não está disponível no momento.','error');return;}
 if(!user){fileFeedback('Entre na sua conta para abrir o arquivo original. A revisão pode ser consultada sem login.','error');return;}
 if(!/^materials\/(?:scheduled\/)?[0-9a-f-]{36}\.(pdf|docx|pptx)$/i.test(file.storage_path)){
  fileFeedback('O caminho do documento não está válido.','error');return;
 }
 // Criar a guia dentro do clique evita bloqueio de pop-ups em mobile.
 const tab=window.open('','_blank');
 if(tab){
  try{tab.opener=null;tab.document.title='Abrindo material original…';tab.document.body.textContent='Carregando o documento original…';}catch(_){}
 }
 fileFeedback('Abrindo o arquivo completo…','info');
 try{
  const {data,error}=await c.storage.from(LIBRARY_BUCKET).createSignedUrl(file.storage_path,3600);
  if(error||!data?.signedUrl)throw error||Error('Link temporário indisponível.');
  if(!visible||!canView()){if(tab&&!tab.closed)tab.close();return;}
  if(tab&&!tab.closed)tab.location.replace(data.signedUrl);
  else window.location.assign(data.signedUrl);
  fileFeedback('Documento aberto em uma nova guia.','success');
 }catch(err){
  if(tab&&!tab.closed)tab.close();
  fileFeedback('Não foi possível abrir o documento. '+(err?.message||'Verifique o acesso e tente novamente.'),'error');
 }
}

function eventHTML(e){
 if(!e)return emptyPreview();
 const meta=SUBJECTS[e.subject]||[e.subject,'#8187a5',e.subject],color=colorFor(e.subject);
 return '<article class="vr-card" style="--vr-selected:'+esc(color)+'" aria-label="Detalhes de '+esc(e.title)+'">'+
  '<div class="vr-card-topline"><span class="vr-card-top-dot"></span><span>'+esc(meta[0])+'</span>'+
  '<span class="vr-card-top-kind">'+(e.intensity==='major'?'MARCO ESSENCIAL':'CONCEITO-CHAVE')+'</span></div>'+
  '<div class="vr-card-head"><div><span class="vr-card-meta">'+dateLabel(e)+' · 2026</span>'+
  '<h4 class="vr-card-title">'+esc(e.title)+'</h4></div>'+
  '<button type="button" class="vr-card-close" data-vr-close aria-label="Fechar detalhes">×</button></div>'+
  '<div class="vr-card-block"><strong>O QUE APRENDEMOS</strong><p>'+esc(e.summary)+'</p></div>'+
  '<div class="vr-card-block"><strong>POR QUE LEVAR ADIANTE</strong><p>'+esc(e.importance)+'</p></div>'+
  (e.connection?'<div class="vr-card-connection"><strong><span aria-hidden="true">⌁</span> A CONEXÃO</strong><p>'+esc(e.connection)+'</p></div>':'')+
  '<div class="vr-materials"><strong>MATERIAIS RELACIONADOS · ARQUIVOS NA ÍNTEGRA</strong>'+
  materialButtons(e)+'<p class="vr-material-feedback" role="status" aria-live="polite"></p></div></article>';
}
function render(){
 if(!visible)return;
 const root=rootElement();if(!root)return;
 setActive(true);
 if(!canView()){root.innerHTML=privateHTML();return;}
 if(loading){root.innerHTML='<div class="vr-private"><h2>Preparando a linha do tempo…</h2><p>Conferindo os marcos selecionados.</p></div>';return;}
 root.innerHTML=hero()+monthsHTML();
}
async function load(){
 const request=++seq;loading=true;events=[];openedMonth=null;selectedEvent=null;render();
 try{
  const c=client();if(!c)throw new Error('A conta ainda não está conectada.');
  const [res,materials]=await Promise.all([
   c.from(TABLE).select('id,semester,subject,event_date,intensity,title,summary,importance,connection,material_names')
    .eq('semester',semester).order('event_date',{ascending:true}),
   c.from(UPLOAD_TABLE).select('resource_key,filename,display_title,file_subject,storage_path,publish_at')
    .order('resource_key')
  ]);
  if(res.error)throw res.error;
  if(materials.error){indexMaterials([]);fileLoadError='Não foi possível consultar os arquivos do acervo agora.';}
  else{indexMaterials(materials.data||[]);fileLoadError='';}
  if(!visible||request!==seq)return;
  events=res.data||[];
  // Inicia com março ou agosto aberto em qualquer tamanho de tela.
  openedMonth=MONTHS[semester][0];
  selectedEvent=null;
  loading=false;render();
 }catch(error){
  if(request!==seq||!visible)return;
  loading=false;
  const root=rootElement();
  if(root)root.innerHTML=hero()+'<div class="vr-private"><h2>Não foi possível carregar a revisão</h2><p>'+esc(error.message||'Falha de conexão')+'</p></div>';
 }
}
async function show(){
 visible=true;semester=currSemester();openedMonth=null;selectedEvent=null;loading=true;
 rootElement();setActive(true);render();
 window.dispatchEvent(new CustomEvent('uentzoul:route',{detail:{page:'vacation',semester:'2026/'+semester}}));
 window.pmMobileDrawer?.close?.();
 try{await window.uentzoulAdminConfig?.refresh?.();}catch(_){}
 if(!visible)return;
 updateNavStatus();
 if(!canView()){loading=false;events=[];render();return;}
 await load();
}
function setMonth(month){
 const shell=document.getElementById('vr-panel-'+month),months=MONTHS[semester];
 if(!shell||!months.includes(month)||!canView())return;
 const next=openedMonth===month?null:month;
 openedMonth=next;selectedEvent=null;
 const navRail=document.querySelector('.vr-months');
 if(navRail)navRail.style.setProperty('--vr-progress',next===null?'0%':(months.indexOf(next)/(months.length-1)*100)+'%');
 document.querySelectorAll('.vr-month').forEach(b=>{
  const on=Number(b.dataset.vrMonth)===next;
  b.classList.toggle('is-active',on);b.setAttribute('aria-expanded',String(on));
 });
 document.querySelectorAll('.vr-expand-shell').forEach(panel=>{
  const on=panel.id==='vr-panel-'+next;
  panel.classList.toggle('is-open',on);panel.setAttribute('aria-hidden',String(!on));
  const clip=panel.querySelector('.vr-expand-clip');if(clip)clip.inert=!on;
  const card=panel.querySelector('.vr-story-preview');
  if(card&&card.querySelector('.vr-card'))card.innerHTML=emptyPreview();
  panel.querySelectorAll('.vr-event').forEach(b=>{b.classList.remove('is-selected');b.setAttribute('aria-expanded','false');});
 });
}
function chooseEvent(id){
 const e=events.find(x=>x.id===id);if(!e||monthOf(e)!==openedMonth||!canView())return;
 selectedEvent=selectedEvent===id?null:id;
 const panel=document.getElementById('vr-panel-'+openedMonth);
 const preview=panel?.querySelector('.vr-story-preview');
 if(preview)preview.innerHTML=selectedEvent?eventHTML(e):emptyPreview();
 panel?.querySelectorAll('.vr-event').forEach(node=>{
  const on=node.dataset.vrEvent===selectedEvent;
  node.classList.toggle('is-selected',on);node.setAttribute('aria-expanded',String(on));
 });
 if(preview&&selectedEvent&&window.matchMedia('(max-width:820px)').matches){
  preview.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'nearest'});
 }
}
function handleClick(ev){
 if(!canView())return;
 const month=ev.target.closest('[data-vr-month]');
 if(month){setMonth(Number(month.dataset.vrMonth));return;}
 const event=ev.target.closest('[data-vr-event]');
 if(event){chooseEvent(event.dataset.vrEvent);return;}
 if(ev.target.closest('[data-vr-close]')){
  selectedEvent=null;
  const panel=document.getElementById('vr-panel-'+openedMonth);
  const card=panel?.querySelector('.vr-story-preview');if(card)card.innerHTML=emptyPreview();
  panel?.querySelectorAll('.vr-event').forEach(b=>{b.classList.remove('is-selected');b.setAttribute('aria-expanded','false')});return;
 }
 const related=ev.target.closest('[data-vr-material]');
 if(related){void openMaterial(Number(related.dataset.vrMaterial));return;}
}
function setup(){
 navButton();
 const n=nav();
 if(n&&!navObserver){navObserver=new MutationObserver(()=>navButton());navObserver.observe(n,{childList:true});}
 const m=main();
 if(m&&!mainObserver){mainObserver=new MutationObserver(()=>{if(visible&&!document.getElementById('vr-root')){rootElement();render();}});mainObserver.observe(m,{childList:true});}
 document.addEventListener('click',event=>{
  if(!visible)return;
  const el=event.target.closest('#nav [data-page],#subjectNav .sidebtn,#semesterDropdown [data-semester],#semesterCurrent');
  if(el&&!event.target.closest('#navVacationReview'))deactivate();
 },true);
 window.addEventListener('uentzoul:semester',()=>{
  // A seleção de semestre acontece no núcleo do site; atualiza o menu imediatamente,
  // inclusive se a revisão não estiver aberta.
  updateNavStatus();
  if(visible&&semester!==currSemester())deactivate();
 });
 window.addEventListener('uentzoul:auth',()=>{
  updateNavStatus();
  if(visible){if(!canView()){events=[];loading=false;openedMonth=null;selectedEvent=null;render();}else if(!events.length&&!loading)load();}
 });
}
window.PSICO_VACATION_REVIEW={show,close:deactivate,refresh:()=>{if(visible&&canView())load();},currentSemester:()=>semester};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});
else setup();
})();