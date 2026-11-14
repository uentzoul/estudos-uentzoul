/* PsicoMoodle — Revisão de Férias. Meses expansíveis, um por vez.
   A linha do tempo fica no Supabase e só pode ser consultada por admin via RLS.
   Não cria novas abas de semestre: usa a escolha existente no site. */
(()=>{
'use strict';
if(window.PSICO_VACATION_REVIEW)return;
const TABLE='uentzoul_vacation_review_events';
const SUBJECTS={
 profissao:['Psicologia como Profissão','#3c91a4','Profissão'],
 processos:['Processos Psicológicos Básicos','#6296d1','PPB'],
 direitos:['Psicologia e Direitos Humanos','#d78185','Direitos Humanos'],
 epistemologia:['Fundamentos Epistemológicos em Psicologia','#9e81cc','Epistemologia'],
 historia:['História da Psicologia','#d39e54','História'],
 sociocognitivas:['Teorias Sociocognitivas','#55a58d','Sociocognitivas'],
 desenvolvimento:['Psicologia do Desenvolvimento (Ciclo Vital)','#c078a8','Desenvolvimento']
};
const MONTHS={1:[3,4,5,6],2:[8,9,10,11]};
const MONTH_NAME={3:'Março',4:'Abril',5:'Maio',6:'Junho',8:'Agosto',9:'Setembro',10:'Outubro',11:'Novembro'};
const MONTH_SHORT={3:'MAR',4:'ABR',5:'MAI',6:'JUN',8:'AGO',9:'SET',10:'OUT',11:'NOV'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let visible=false,semester=1,events=[],openedMonth=null,selectedEvent=null,loading=false,seq=0;
let navObserver=null,mainObserver=null;
const nav=()=>document.getElementById('nav');
const main=()=>document.querySelector('.app > .main')||document.querySelector('main.main')||document.querySelector('.main');
const admin=()=>window.uentzoulAdminConfig?.isAdmin?.()===true;
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
 if(document.getElementById('navVacationReview'))return;
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
 const old=b.querySelector('.vr-soon');
 if(admin()){old?.remove();b.title='Abrir Revisão de Férias';}
 else{if(!old){const tag=document.createElement('span');tag.className='vr-soon';tag.textContent='Em breve';b.appendChild(tag);}
  b.title='Revisão de Férias — em breve';}
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
 openedMonth=null;selectedEvent=null;
 document.getElementById('vr-root')?.remove();
}
function privateHTML(){
 return '<div class="vr-private"><span class="vr-private-icon" aria-hidden="true">⌁</span><h2>Revisão de Férias</h2>'+
  '<p>Em breve, tu vai poder revisitar os principais conceitos de cada semestre numa linha do tempo interativa.</p>'+
  '<p>Esta área está em desenvolvimento e, por enquanto, só pode ser acessada pela administração.</p></div>';
}
function hero(){
 const which=semester===1?'Primeiro semestre':'Segundo semestre';
 const count=events.length;
 return '<header class="vr-hero"><div class="vr-overline"><span class="vr-dot-kicker"></span> Revisão de Férias · Acesso administrativo</div>'+
 '<h1>'+which+'</h1>'+
 '<p>Uma viagem pelos conceitos que vale a pena levar adiante. Abra um mês para ver os marcos de aprendizagem, depois selecione uma bolinha para recordar o tema e suas conexões.</p>'+
 '<div class="vr-hero-bottom"><span class="vr-year">2026 · '+which+'</span>'+
 '<span class="vr-hint">'+(count?count+' marcos selecionados · 7 disciplinas':'Espaço preparado para os próximos conteúdos')+'</span></div></header>';
}
function monthsHTML(){
 return '<section class="vr-months-wrap"><div class="vr-months-intro"><h2>O percurso do semestre</h2>'+
 '<p>Escolha um mês. Quando outro é aberto, o anterior se recolhe automaticamente.</p></div>'+
 '<nav class="vr-months" aria-label="Meses do '+(semester===1?'primeiro':'segundo')+' semestre">'+
 MONTHS[semester].map((m,i)=>{
  const total=events.filter(e=>monthOf(e)===m).length;
  const on=openedMonth===m;
  return '<button type="button" class="vr-month'+(on?' is-active':'')+'" data-vr-month="'+m+'" aria-expanded="'+on+'" aria-controls="vrMonthExpanded">'+
   '<span class="vr-month-index">0'+(i+1)+'</span><span class="vr-month-orb" aria-hidden="true"></span>'+
   '<strong>'+MONTH_NAME[m]+'</strong><small>'+total+' '+plural(total,'marco','marcos')+'</small></button>';
 }).join('')+'</nav>'+
 '<div class="vr-expand-shell'+(openedMonth?' is-open':'')+'" id="vrMonthExpanded"><div class="vr-expand-clip"><div class="vr-month-detail" id="vrMonthDetail">'+(openedMonth?monthHTML(openedMonth):'')+'</div></div></div></section>';
}
function monthHTML(month){
 const monthEvents=events.filter(e=>monthOf(e)===month).sort((a,b)=>a.event_date.localeCompare(b.event_date)||a.subject.localeCompare(b.subject));
 if(!monthEvents.length){
  return '<div class="vr-month-detail-head"><h3>'+MONTH_NAME[month]+'</h3></div><p>Sem marcos cadastrados neste mês.</p>'+
   '<div class="vr-empty">Este período ainda está sendo organizado. Os marcos aparecerão aqui depois que os cronogramas e materiais forem conferidos.</div>';
 }
 return '<div class="vr-month-detail-head"><h3>'+MONTH_NAME[month]+'</h3><span class="vr-count">'+monthEvents.length+' '+plural(monthEvents.length,'marco selecionado','marcos selecionados')+'</span></div>'+
 '<p>As bolinhas maiores indicam os conceitos de conexão entre matérias. Toque ou clique para abrir a explicação.</p>'+
 '<div class="vr-events-scroll" tabindex="0" aria-label="Marcos de '+MONTH_NAME[month]+'">'+
 '<div class="vr-events" style="--vr-columns:'+monthEvents.length+'">'+monthEvents.map(e=>{
  const col=colorFor(e.subject),abbr=SUBJECTS[e.subject]?.[2]||e.subject;
  return '<button type="button" class="vr-event'+(selectedEvent===e.id?' is-selected':'')+'" data-vr-event="'+esc(e.id)+'" data-major="'+(e.intensity==='major')+'" style="--vr-color:'+esc(col)+'" title="'+esc(dateLabel(e)+' · '+e.title)+'" aria-label="'+esc(dateLabel(e)+' · '+abbr+' · '+e.title)+'" aria-expanded="'+(selectedEvent===e.id)+'">'+
   '<span class="vr-event-date">'+dateLabel(e)+'</span><span class="vr-event-stem" aria-hidden="true"></span><span class="vr-event-orb" aria-hidden="true"></span>'+
   '<span class="vr-event-subject">'+esc(abbr)+'</span><span class="vr-event-title">'+esc(e.title)+'</span></button>';
 }).join('')+'</div></div><div id="vrSelectedCard">'+(selectedEvent?eventHTML(monthEvents.find(e=>e.id===selectedEvent)):'')+'</div>';
}
function eventHTML(e){
 if(!e)return '';
 const meta=SUBJECTS[e.subject]||[e.subject,'#8187a5',e.subject];
 const color=colorFor(e.subject);
 return '<article class="vr-card" style="--vr-selected:'+esc(color)+'" aria-label="Detalhes de '+esc(e.title)+'">'+
  '<div class="vr-card-head"><div><span class="vr-card-subject">'+esc(meta[0])+'</span>'+
  '<h4 class="vr-card-title">'+esc(e.title)+'</h4><span class="vr-card-meta">'+dateLabel(e)+' de 2026 · '+(e.intensity==='major'?'Conexão essencial':'Conceito importante')+'</span></div>'+
  '<button type="button" class="vr-card-close" data-vr-close aria-label="Fechar detalhes">×</button></div>'+
  '<div class="vr-card-grid"><div class="vr-card-block"><strong>O que aprendemos</strong><p>'+esc(e.summary)+'</p></div>'+
  '<div class="vr-card-block"><strong>Por que lembrar</strong><p>'+esc(e.importance)+'</p></div></div>'+
  (e.connection?'<div class="vr-card-connection"><strong>Conexão:</strong> '+esc(e.connection)+'</div>':'')+
  '<div class="vr-materials"><strong>Materiais relacionados do acervo de estudos</strong><ul class="vr-material-list">'+
  (Array.isArray(e.material_names)?e.material_names:[]).map(m=>'<li>'+esc(m)+'</li>').join('')+'</ul>'+
  '<button type="button" class="vr-open-library" data-vr-library>Abrir a Biblioteca <span aria-hidden="true">→</span></button></div></article>';
}
function render(){
 if(!visible)return;
 const root=rootElement();if(!root)return;
 setActive(true);
 if(!admin()){root.innerHTML=privateHTML();return;}
 if(loading){root.innerHTML='<div class="vr-private"><h2>Preparando a linha do tempo…</h2><p>Conferindo os marcos selecionados.</p></div>';return;}
 root.innerHTML=hero()+monthsHTML();
}
async function load(){
 const request=++seq;loading=true;events=[];openedMonth=null;selectedEvent=null;render();
 try{
  const c=client();if(!c)throw new Error('A conta ainda não está conectada.');
  const res=await c.from(TABLE).select('id,semester,subject,event_date,intensity,title,summary,importance,connection,material_names')
   .eq('semester',semester).order('event_date',{ascending:true});
  if(res.error)throw res.error;
  if(!visible||request!==seq)return;
  events=res.data||[];
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
 window.pmMobileDrawer?.close?.();
 try{await window.uentzoulAdminConfig?.refresh?.();}catch(_){}
 if(!visible)return;
 updateNavStatus();
 if(!admin()){loading=false;events=[];render();return;}
 await load();
}
function setMonth(month){
 const shell=document.getElementById('vrMonthExpanded');if(!shell)return;
 if(openedMonth===month){
  openedMonth=null;selectedEvent=null;shell.classList.remove('is-open');
  document.querySelectorAll('.vr-month').forEach(b=>{b.classList.remove('is-active');b.setAttribute('aria-expanded','false')});
  return;
 }
 const previous=openedMonth;
 const switchTo=()=>{
  if(!visible||!admin())return;
  openedMonth=month;selectedEvent=null;
  document.querySelectorAll('.vr-month').forEach(b=>{const on=Number(b.dataset.vrMonth)===month;b.classList.toggle('is-active',on);b.setAttribute('aria-expanded',String(on))});
  const detail=document.getElementById('vrMonthDetail');
  if(detail)detail.innerHTML=monthHTML(month);
  requestAnimationFrame(()=>shell.classList.add('is-open'));
 };
 if(previous){
  openedMonth=null;shell.classList.remove('is-open');
  setTimeout(switchTo,190);
 }else{switchTo();}
}
function chooseEvent(id){
 const e=events.find(x=>x.id===id);if(!e||monthOf(e)!==openedMonth)return;
 selectedEvent=selectedEvent===id?null:id;
 const selectedCard=document.getElementById('vrSelectedCard');
 if(selectedCard)selectedCard.innerHTML=selectedEvent?eventHTML(e):'';
 document.querySelectorAll('.vr-event').forEach(node=>{
  const on=node.dataset.vrEvent===selectedEvent;
  node.classList.toggle('is-selected',on);node.setAttribute('aria-expanded',String(on));
 });
 selectedCard?.querySelector('.vr-card')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});
}
function handleClick(ev){
 if(!admin())return;
 const month=ev.target.closest('[data-vr-month]');
 if(month){setMonth(Number(month.dataset.vrMonth));return;}
 const event=ev.target.closest('[data-vr-event]');
 if(event){chooseEvent(event.dataset.vrEvent);return;}
 if(ev.target.closest('[data-vr-close]')){
  selectedEvent=null;const card=document.getElementById('vrSelectedCard');if(card)card.innerHTML='';
  document.querySelectorAll('.vr-event').forEach(b=>{b.classList.remove('is-selected');b.setAttribute('aria-expanded','false')});return;
 }
 if(ev.target.closest('[data-vr-library]')){
  const library=nav()?.querySelector('[data-page="library"]');
  if(library)library.click();
 }
}
function setup(){
 navButton();
 const n=nav();
 if(n&&!navObserver){navObserver=new MutationObserver(()=>{if(!document.getElementById('navVacationReview'))navButton()});navObserver.observe(n,{childList:true});}
 const m=main();
 if(m&&!mainObserver){mainObserver=new MutationObserver(()=>{if(visible&&!document.getElementById('vr-root')){rootElement();render();}});mainObserver.observe(m,{childList:true});}
 document.addEventListener('click',event=>{
  if(!visible)return;
  const el=event.target.closest('#nav [data-page],#subjectNav .sidebtn,#semesterDropdown [data-semester],#semesterCurrent');
  if(el&&!event.target.closest('#navVacationReview'))deactivate();
 },true);
 window.addEventListener('uentzoul:auth',()=>{
  updateNavStatus();
  if(visible&&!admin()){events=[];loading=false;openedMonth=null;selectedEvent=null;render();}
 });
}
window.PSICO_VACATION_REVIEW={show,close:deactivate,refresh:()=>{if(visible&&admin())load();},currentSemester:()=>semester};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});
else setup();
})();