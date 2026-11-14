/* PsicoMoodle — tour guiado por destaque dos elementos reais (14/11/2026). */
(()=>{
'use strict';
if(window.__psicoSpotlightTour)return;
window.__psicoSpotlightTour=true;

const steps=[
 {page:'home',find:'.dashboard-hero .hero-status',title:'Seu espaço de estudos',body:'Esta é a página inicial do PsicoMoodle. Aqui você acompanha o progresso do semestre: a porcentagem indica quanto das atividades cadastradas já foi concluído.'},
 {page:'home',find:'#homeCourses .course-card-button',title:'Escolha uma disciplina',body:'Cada cartão abre uma disciplina com seus materiais e atividades. Selecione o cartão destacado para conhecer uma matéria ou pressione Próximo para continuar com um exemplo.',tip:'É possível localizar outra matéria pela busca da Biblioteca.',pick:true},
 {page:'subject',find:'.subject-hub-menu',title:'Tudo de uma matéria em um só lugar',body:'A disciplina reúne trilha de estudos para a prova, materiais e textos, estudos dirigidos, simulados, flashcards, casos, podcasts e conteúdos para revisar.',tip:'Uma boa sequência é começar pela trilha e praticar com questões depois.'},
 {page:'subject',tab:'docs',find:'#docs .doc-compact .donecontrol',fallback:'#docs .doclist .doc-compact, #docs .sectiontop',title:'Materiais e textos',body:'Nesta seção, você encontra os conteúdos disponíveis para cada disciplina, como textos-base, artigos, slides, capítulos, roteiros de estudo e outros arquivos ou links. Depois de consultar ou estudar um material, utilize “Marcar como visto” no próprio item. Assim, você acompanha o que já foi lido ou revisado e identifica facilmente o que ainda falta, mesmo quando a lista é extensa.',tip:'A marcação é pessoal e manual: abrir um arquivo ou link externo não o marca automaticamente como visto.'},
 {page:'calendar',tab:'provas',find:'.agenda-switch',title:'Agenda e Horários',body:'A agenda reúne três consultas: datas das avaliações, grade semanal de aulas e conteúdos previstos para cada encontro. Vamos conhecer cada uma.'},
 {page:'calendar',tab:'provas',find:'.agenda-calendar-layout',fallback:'[data-action="agenda-tab:provas"]',title:'Provas e avaliações',body:'Veja as datas das provas no calendário, confira a disciplina correspondente e consulte informações sobre avaliações e substitutivas.',tip:'As datas podem mudar. Confirme eventuais alterações no Moodle oficial.'},
 {page:'calendar',tab:'horarios',find:'.schedule-day',fallback:'[data-action="agenda-tab:horarios"]',title:'Horários das aulas',body:'Esta visão mostra os dias da semana, as disciplinas e os respectivos horários. Consulte-a para organizar a rotina de aulas.',tip:'Use as abas acima para alternar entre as diferentes visões da agenda.'},
 {page:'calendar',tab:'conteudos',find:'.agenda-daygroup[data-agenda-date="2026-11-16"]',fallback:'.agenda-daygroup, [data-action="agenda-tab:conteudos"]',title:'Conteúdo de cada dia',body:'Confira os assuntos previstos nas aulas e as leituras indicadas nos cronogramas. Quando houver uma revisão correspondente no site, você poderá abri-la por aqui.',tip:'Use “Incluir aulas anteriores” para consultar os registros já passados.'},
 {page:'exams',tab:'ready',find:'.ge-ready-subject .examcard',fallback:'[data-ge-tab="ready"]',title:'Cinco simulados para cada prova',body:'Na aba Simulados prontos, cada disciplina reúne cinco modelos para treinar. Responda às questões, entregue sua tentativa e consulte a correção para descobrir o que precisa revisar.'},
 {page:'exams',tab:'ai',find:'.ge-generator',fallback:'[data-ge-tab="ai"]',title:'Crie seu próprio simulado',body:'Na aba Criar simulado, escolha a disciplina, a dificuldade normal ou difícil, a quantidade de questões e se deseja incluir dissertativas. Depois, acesse a correção e o histórico das suas provas.',tip:'A criação e o compartilhamento de simulados personalizados exigem uma conta conectada.'},
 {page:'messages',tab:'private',find:'#dmUserSearch',fallback:'.dm-channel-tabs [data-dm-tab="private"]',title:'Converse em particular',body:'Na aba Privadas, procure um colega pelo nome e inicie uma conversa direta para tirar dúvidas, combinar estudos e trocar materiais.',login:'Entre na sua conta para acessar as conversas privadas e as demais funções de Mensagens.'},
 {page:'messages',tab:'groups',find:'[data-dm-new-group]',fallback:'.dm-channel-tabs [data-dm-tab="groups"]',title:'Crie um grupo de estudos',body:'Na aba Grupos, selecione Criar grupo, escolha um nome e convide os colegas. É um espaço para organizar trabalhos, discutir questões e estudar em conjunto.',login:'Com a conta conectada, abra Grupos e crie uma conversa com seus colegas.'},
 {page:'messages',tab:'global',find:'#dmContacts [data-dmw-global]',fallback:'#dmContacts .dm-global',title:'Participe do chat global',body:'Na lista de conversas, selecione Chat Global, logo abaixo de Pesquisar conversas. Esse espaço reúne os estudantes cadastrados para trocar informações, tirar dúvidas e conversar com a turma.',login:'O chat global fica disponível para estudantes conectados à conta.'},
 {page:'messages',tab:'global',find:'[data-dmv-share-open]',fallback:'.dm-composer, .dm-channel-tabs',title:'Compartilhe conteúdos sem sair do chat',body:'Dentro de uma conversa, use o recurso de compartilhamento para encontrar materiais, simulados, podcasts e tópicos já listados no PsicoMoodle. Também é possível enviar mensagens, imagens e stickers.',tip:'Simulados personalizados são enviados por conversa privada, com convite para o colega acessar.',login:'Depois de entrar na conta e abrir uma conversa, você poderá compartilhar materiais do catálogo diretamente pelo chat.'},
 {page:'home',find:'#semesterCurrent',title:'Escolha o semestre',body:'Use este seletor para alternar entre os períodos de Psicologia. Cada semestre tem sua própria organização, e os conteúdos aparecem conforme são cadastrados. O modo claro ou escuro também pode ser alterado no menu.',tip:'O tutorial terminou. Você poderá iniciá-lo novamente pelo botão Tutorial.'}
];

const byId=id=>document.getElementById(id);
const q=s=>document.querySelector(s);
let active=false,index=0,chosen='tcc',lastFocus=null,originSemester=null,changedSemester=false;
let shell=null,spot=null,sidebarSpot=null,balloon=null,fadeTimer=0,frame=0,stepSerial=0;
let lastRect=null,pendingScroll=false;
let mobilePositionAttempts=0;
const margin=8;
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const FIRST_VISIT_KEY='pm-tour-opened-v1';
function isFirstVisit(){
 try{return localStorage.getItem(FIRST_VISIT_KEY)!=='1'}catch(_){return false}
}
function markTourOpened(){
 try{localStorage.setItem(FIRST_VISIT_KEY,'1')}catch(_){}
 byId('pmTourEntry')?.classList.remove('is-first-visit');
}
function mainReady(){return !!q('#main #homeCourses .course-intro')}
function insertEntry(){
 if(!mainReady())return;
 const intro=q('#main #homeCourses .course-intro');
 let entry=byId('pmTourEntry');
 if(!entry){
  entry=document.createElement('div');entry.id='pmTourEntry';entry.className='pm-tour-entry';
  entry.innerHTML='<button type="button" id="pmTourLaunch" class="pm-tour-launch" aria-label="Iniciar tutorial guiado do site"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H20v15H6.5A2.5 2.5 0 0 1 4 16.5zM4 16.5A2.5 2.5 0 0 1 6.5 14H20M8 8h8"/></svg><span>Tutorial</span></button>';
 }
 entry.classList.toggle('is-first-visit',isFirstVisit());
 if(entry.parentNode!==intro)intro.appendChild(entry);
}
function build(){
 if(shell)return;
 shell=document.createElement('div');shell.id='pmSpotlight';shell.className='pm-spotlight';shell.hidden=true;
 shell.innerHTML='<svg class="pm-spotlight-svg" aria-hidden="true" preserveAspectRatio="none"><path class="pm-spotlight-path" fill-rule="evenodd"></path></svg>'+
 '<div class="pm-spotlight-ring" aria-hidden="true"></div>'+
 '<section class="pm-spotlight-popover" role="dialog" aria-modal="true" aria-labelledby="pmSpotlightTitle" tabindex="-1">'+
 '<div class="pm-spotlight-head"><span class="pm-spotlight-kicker">TOUR PELO PSICOMOODLE</span><button type="button" class="pm-spotlight-close" data-pmtour="close" aria-label="Fechar tutorial">×</button></div>'+
 '<h2 id="pmSpotlightTitle"></h2><p class="pm-spotlight-body"></p><p class="pm-spotlight-tip"></p>'+
 '<div class="pm-spotlight-track"><span></span></div>'+
 '<div class="pm-spotlight-actions"><button type="button" class="pm-spotlight-skip" data-pmtour="close">Pular</button><span class="pm-spotlight-counter"></span>'+
 '<button type="button" class="pm-spotlight-back" data-pmtour="back">Voltar</button>'+
 '<button type="button" class="pm-spotlight-next" data-pmtour="next">Próximo <span aria-hidden="true">→</span></button></div></section>';
 document.body.appendChild(shell);
 sidebarSpot=document.createElement('div');sidebarSpot.className='pm-spotlight-sidebar-ring';sidebarSpot.setAttribute('aria-hidden','true');shell.appendChild(sidebarSpot);
 spot=shell.querySelector('.pm-spotlight-ring');
 balloon=shell.querySelector('.pm-spotlight-popover');
}
function page(){return q('#nav [data-page].active')?.dataset.page||''}
function navigate(p){
 if(page()===p)return;
 const btn=q('#nav [data-page="'+p+'"]');
 if(btn)btn.click();
}
function available(selector){
 if(!selector)return null;
 const n=q(selector);
 if(!n)return null;
 const r=n.getBoundingClientRect();
 // Não destacar elementos que ficam fora da largura visível do celular.
 return r.width>0&&r.height>0&&r.right>2&&r.left<innerWidth-2?n:null;
}
function chooseSubject(){
 if(page()==='subject'){
  const back=q('#main [data-action="subjectArea:home"]');
  if(back)back.click();
  return;
 }
 navigate('home');
 const button=q('#main [data-action="subject:'+chosen+'"]')||q('#nav [data-action="subject:'+chosen+'"]')||q('#main .course-card-button');
 if(button)button.click();
}
function selectTab(step){
 const selector=step.page==='calendar'?'[data-action="agenda-tab:'+step.tab+'"]':step.page==='exams'?'[data-ge-tab="'+step.tab+'"]':'[data-dm-tab="'+step.tab+'"]';
 const tab=q('#main '+selector);
 if(tab&&!tab.matches('[aria-selected="true"],[aria-pressed="true"],.selected,.active'))tab.click();
}
function prep(step){
 if(step.page==='subject'){
  if(step.tab==='docs'){
   // Acesse de verdade Materiais e textos; não marque nenhum material durante o tour.
   if(page()!=='subject')chooseSubject();
   const docs=q('#main .subject-hub-menu [data-action="subjectArea:docs"]');
   if(docs)docs.click();
  }else chooseSubject();
 }else navigate(step.page);
 // "Chat Global" é um contato fixo logo abaixo da busca, não uma aba no cabeçalho.
 if(step.page==='messages' && step.tab==='global'){
  const search=q('#dmUserSearch');
  if(search?.value){search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));}
 }
 if(step.tab&&step.page!=='subject')selectTab(step);
}
function calendarEventDay(){
 const cells=[...document.querySelectorAll('#main .agenda-calendar .agenda-cal-day[data-calendar-date]')];
 const withExams=cells.filter(el=>el.querySelector('.agenda-cal-event'));
 if(!withExams.length)return null;
 const today=new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'});
 return withExams.find(el=>el.dataset.calendarDate>=today)||withExams[withExams.length-1];
}
function mondayClassRow(){
 const group=q('#main .agenda-daygroup[data-agenda-date="2026-11-16"]');
 if(!group)return null;
 return [...group.querySelectorAll('.agenda-classrow')].find(el=>/metapsicologia/i.test(el.textContent||''))||
  group.querySelector('.agenda-classrow')||group;
}
function findNode(step){
 const mobile=innerWidth<=760;
 if(mobile){
  // Alvos escolhidos pela informação que o estudante precisa de fato ver.
  const targeted={
   1:()=>available('#homeCourses .course-card'),
   5:()=>calendarEventDay(),
   6:()=>available('#main .schedule-day:has(.schedule-lesson)'),
   7:()=>mondayClassRow(),
   10:()=>available('#main .dm-list .dm-search-label')||available('#main .dm-list-head'),
   11:()=>available('#main .dm-channel-tabs [data-dm-tab="groups"]'),
   12:()=>available('#main #dmContacts [data-dmw-global]')||available('#main .dm-channel-tabs [data-dm-tab="global"]'),
   13:()=>available('#main .dm-composer')||available('#main .dm-list-head'),
   14:()=>available('#semesterCurrent')
  }[index];
  const target=targeted?.();
  if(target)return {node:target,login:false};
 }
 let node=available('#main '+step.find)||available(step.find);
 if(mobile&&node){
  if(node.matches('.subject-hub-menu'))node=available('#main .subject-hub-menu .subject-hub-card')||node;
  if(node.matches('.agenda-switch'))node=available('#main .agenda-switch button')||node;
  if(node.matches('.ge-generator'))node=available('#main .ge-generator button, #main .ge-generator select')||node;
 }
 if(node)return {node,login:false};
 const substitute=step.fallback?step.fallback.split(',').map(x=>x.trim()).map(x=>available('#main '+x)||available(x)).find(Boolean):null;
 const login=step.page==='messages'?available('#main .dm-login-panel'):null;
 const fallback=substitute||login||available('#nav [data-page="'+step.page+'"]')||available('#main > :first-child')||available('.dashboard-hero');
 return {node:fallback,login:!!login&&!substitute};
}
function currentRect(node){
 if(!node)return {left:innerWidth/2-75,top:innerHeight/2-30,width:150,height:60,right:innerWidth/2+75,bottom:innerHeight/2+30};
 const r=node.getBoundingClientRect();
 const x=clamp(r.left-margin,6,innerWidth-24);
 const y=clamp(r.top-margin,6,innerHeight-24);
 const right=clamp(r.right+margin,x+16,innerWidth-6);
 const bottom=clamp(r.bottom+margin,y+16,innerHeight-6);
 return {left:x,top:y,width:right-x,height:bottom-y,right,bottom};
}
function sidebarNode(step){
 if(!step)return null;
 if(step.page==='subject'){
  return available('#subjectNav [data-action="subject:'+chosen+'"]')||
         available('#nav [data-page="home"]');
 }
 return available('#nav [data-page="'+step.page+'"]');
}
function updateSidebarHighlight(step){
 document.querySelectorAll('#nav .pm-tour-nav-current').forEach(el=>el.classList.remove('pm-tour-nav-current'));
 const node=sidebarNode(step);
 if(node)node.classList.add('pm-tour-nav-current');
 if(!node)return null;
 const r=node.getBoundingClientRect();
 // No mobile o menu pode estar recolhido: não desenhar um falso recorte na borda.
 if(r.right<=0||r.left>=innerWidth||r.bottom<=0||r.top>=innerHeight)return null;
 return node;
}
function cutout(r,sideRect){
 const w=innerWidth,h=innerHeight,rad=Math.min(15,r.width/3,r.height/3);
 const x=r.left,y=r.top,rx=r.right,by=r.bottom;
 let path='M 0 0 H '+w+' V '+h+' H 0 Z '+
 'M '+(x+rad)+' '+y+' H '+(rx-rad)+' Q '+rx+' '+y+' '+rx+' '+(y+rad)+
 ' V '+(by-rad)+' Q '+rx+' '+by+' '+(rx-rad)+' '+by+
 ' H '+(x+rad)+' Q '+x+' '+by+' '+x+' '+(by-rad)+
 ' V '+(y+rad)+' Q '+x+' '+y+' '+(x+rad)+' '+y+' Z';
 if(sideRect){
  const a=sideRect,rr=Math.min(11,a.width/3,a.height/3);
  path+=' M '+(a.left+rr)+' '+a.top+' H '+(a.right-rr)+' Q '+a.right+' '+a.top+' '+a.right+' '+(a.top+rr)+
  ' V '+(a.bottom-rr)+' Q '+a.right+' '+a.bottom+' '+(a.right-rr)+' '+a.bottom+
  ' H '+(a.left+rr)+' Q '+a.left+' '+a.bottom+' '+a.left+' '+(a.bottom-rr)+
  ' V '+(a.top+rr)+' Q '+a.left+' '+a.top+' '+(a.left+rr)+' '+a.top+' Z';
 }
 shell.querySelector('.pm-spotlight-svg').setAttribute('viewBox','0 0 '+w+' '+h);
 shell.querySelector('.pm-spotlight-path').setAttribute('d',path);
 spot.style.cssText='left:'+r.left+'px;top:'+r.top+'px;width:'+r.width+'px;height:'+r.height+'px;';
 if(sidebarSpot){sidebarSpot.hidden=!sideRect;if(sideRect)sidebarSpot.style.cssText='left:'+sideRect.left+'px;top:'+sideRect.top+'px;width:'+sideRect.width+'px;height:'+sideRect.height+'px;';}
}
function positionPopover(r){
 const w=innerWidth,h=innerHeight;
 if(w<=760){
  // No celular a explicação fica sempre em uma área própria, presa ao rodapé.
  balloon.style.width='';balloon.style.left='';balloon.style.top='';balloon.style.bottom='';
  balloon.dataset.side='dock';
  return;
 }
 balloon.style.bottom='';
 if(index!==2)balloon.style.width='';
 const pop=balloon.getBoundingClientRect();
 const pw=pop.width,ph=pop.height,gap=17;
 const spaceBottom=h-r.bottom,spaceTop=r.top,spaceRight=w-r.right,spaceLeft=r.left;
 if(index===2 && w>=800){
  balloon.style.width=Math.min(370,Math.max(310,w*.26))+'px';
  const box=balloon.getBoundingClientRect();
  const menu=available('#main .subject-hub-menu');
  const menuRect=menu?.getBoundingClientRect();
  const rightEdge=menuRect?.right||r.right;
  const x=clamp(rightEdge+18,12,w-box.width-12);
  let y=clamp(r.top+24,12,Math.max(12,h-box.height-12));
  if(x<rightEdge-4&&menuRect)y=clamp(menuRect.top-box.height-18,12,Math.max(12,h-box.height-12));
  balloon.dataset.side='floating';
  balloon.style.left=Math.round(x)+'px';
  balloon.style.top=Math.round(y)+'px';
  return;
 }
 balloon.style.width='';
 let x,y,side='bottom';
 if(spaceBottom>=ph+gap+8){x=clamp(r.left,12,w-pw-12);y=r.bottom+gap;}
 else if(spaceTop>=ph+gap+8){x=clamp(r.left,12,w-pw-12);y=r.top-ph-gap;side='top';}
 else if(spaceRight>=pw+gap+8){x=r.right+gap;y=clamp(r.top,12,h-ph-12);side='right';}
 else if(spaceLeft>=pw+gap+8){x=r.left-pw-gap;y=clamp(r.top,12,h-ph-12);side='left';}
 else{x=clamp((w-pw)/2,8,w-pw-8);y=r.top>h/2?12:Math.max(12,h-ph-12);side='floating';}
 balloon.dataset.side=side;
 balloon.style.left=Math.round(x)+'px';
 balloon.style.top=Math.round(clamp(y,8,Math.max(8,h-ph-8)))+'px';
}
function mobileShowcase(){
 const popup=balloon.getBoundingClientRect();
 const sidebar=available('.sidebar')||available('#sidebar');
 const headerBottom=sidebar?sidebar.getBoundingClientRect().bottom:0;
 const top=clamp(headerBottom>0&&headerBottom<innerHeight*.4?headerBottom+8:12,12,Math.max(12,innerHeight*.38));
 const bottom=Math.max(top+48,popup.top-14);
 return {top,bottom};
}
function clippedRect(node,zone){
 const r=node.getBoundingClientRect();
 const left=clamp(r.left-5,6,innerWidth-26);
 const right=clamp(r.right+5,left+16,innerWidth-6);
 const top=clamp(r.top-5,zone.top,zone.bottom-12);
 const bottom=clamp(r.bottom+5,top+12,zone.bottom);
 return {left,right,top,bottom,width:right-left,height:bottom-top};
}
function calendarWeekRect(node){
 const grid=node.closest('.agenda-calendar-grid');
 if(!grid)return node.getBoundingClientRect();
 const cells=[...grid.children];
 const idx=cells.indexOf(node);
 if(idx<0)return node.getBoundingClientRect();
 const rowStart=Math.floor(idx/7)*7;
 const row=cells.slice(rowStart,rowStart+7);
 if(!row.length)return node.getBoundingClientRect();
 const first=row[0].getBoundingClientRect(),last=row[row.length-1].getBoundingClientRect();
 return {left:first.left,top:Math.min(...row.map(e=>e.getBoundingClientRect().top)),
  right:last.right,bottom:Math.max(...row.map(e=>e.getBoundingClientRect().bottom)),
  width:last.right-first.left,height:Math.max(...row.map(e=>e.getBoundingClientRect().bottom))-first.top};
}
function targetVisualBounds(node,mobile){
 if(index===5 && node.matches('.agenda-cal-day'))return calendarWeekRect(node);
 if(index===7){
  const group=node.closest('.agenda-daygroup')||node;
  const header=group.querySelector('.agenda-daytitle');
  const row=node.matches('.agenda-classrow')?node:mondayClassRow();
  if(header&&row&&group.contains(row)){
   const h=header.getBoundingClientRect(),r=row.getBoundingClientRect();
   return {left:Math.min(h.left,r.left),right:Math.max(h.right,r.right),
    top:Math.min(h.top,r.top),bottom:Math.max(h.bottom,r.bottom),
    width:Math.max(h.right,r.right)-Math.min(h.left,r.left),
    height:Math.max(h.bottom,r.bottom)-Math.min(h.top,r.top)};
  }
 }
 return node.getBoundingClientRect();
}
function clipVisualBounds(r,zone){
 const left=clamp(r.left-5,6,innerWidth-26);
 const right=clamp(r.right+5,left+16,innerWidth-6);
 const top=clamp(r.top-5,zone.top,zone.bottom-12);
 const bottom=clamp(r.bottom+5,top+12,zone.bottom);
 return {left,right,top,bottom,width:right-left,height:bottom-top};
}
function positionMobileTarget(node){
 // O seletor está no cabeçalho fixo: nunca tentar jogá-lo para o corpo da página.
 if(index===14)return;
 const zone=mobileShowcase(),r=targetVisualBounds(node,true),room=zone.bottom-zone.top;
 if(room<50)return;
 const marginTop=index===1||index===6||index===7?6:12;
 let desired=zone.top+marginTop;
 if(index!==1&&index!==6&&index!==7&&r.height<room-24)desired=zone.top+(room-r.height)/2;
 // Não recentrar blocos altos no meio, pois isso cortava o título do item.
 const delta=r.top-desired;
 if(Math.abs(delta)<4)return;
 const maxScroll=document.documentElement.scrollHeight-innerHeight;
 const next=clamp(window.scrollY+delta,0,Math.max(0,maxScroll));
 if(Math.abs(next-window.scrollY)<3)return;
 pendingScroll=true;
 window.scrollTo({top:next,behavior:'instant'});
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
  pendingScroll=false;
  if(active)layout(false);
 }));
}
function layout(scrollTarget=false){
 if(!active||!shell||shell.hidden)return;
 const found=findNode(steps[index]),node=found.node;
 if(!node)return;
 const mobile=innerWidth<=760;
 if(mobile){
  positionPopover(null);
  if(scrollTarget&&!pendingScroll)positionMobileTarget(node);
 }else if(scrollTarget&&!pendingScroll){
  const rect=node.getBoundingClientRect();
  if(rect.top<12||rect.bottom>innerHeight-12){
   pendingScroll=true;
   try{node.scrollIntoView({block:'center',behavior:'auto'});}catch(_){}
   requestAnimationFrame(()=>{pendingScroll=false;layout(false)});
  }
 }
 const zone=mobile?mobileShowcase():null;
 const visual=targetVisualBounds(node,mobile);
 const r=mobile?(index===14?currentRect(node):clipVisualBounds(visual,zone)):
  (index===7?currentRect({getBoundingClientRect:()=>visual}):currentRect(node));
 lastRect=r;
 const navNode=updateSidebarHighlight(steps[index]);
 const navRect=!mobile&&navNode?currentRect(navNode):null;
 const overlap=navRect&&navRect.left<r.right&&navRect.right>r.left&&navRect.top<r.bottom&&navRect.bottom>r.top;
 cutout(r,overlap?null:navRect);
 if(!mobile)positionPopover(r);
}

function renderCopy(step){
 const found=findNode(step);
 shell.querySelector('#pmSpotlightTitle').textContent=step.title;
 shell.querySelector('.pm-spotlight-body').textContent=step.body;
 const hint=shell.querySelector('.pm-spotlight-tip');
 hint.textContent=found.login?(step.login||'Entre na sua conta para usar este recurso.'):(step.tip||'');
 hint.hidden=!hint.textContent;
 shell.querySelector('.pm-spotlight-counter').textContent=(index+1)+' / '+steps.length;
 shell.querySelector('.pm-spotlight-track span').style.width=100*(index+1)/steps.length+'%';
 shell.querySelector('.pm-spotlight-back').disabled=index===0;
 shell.querySelector('.pm-spotlight-next').innerHTML=index===steps.length-1?'Concluir <span aria-hidden="true">✓</span>':'Próximo <span aria-hidden="true">→</span>';
}
function show(n){
 if(!active)return;
 index=clamp(n,0,steps.length-1);
 document.documentElement.dataset.pmTourStep=String(index+1);
 mobilePositionAttempts=0;
 const serial=++stepSerial,step=steps[index];
 prep(step);
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
  if(!active||serial!==stepSerial)return;
  // A navegação pode exibir um placeholder momentâneo durante a autenticação.
  renderCopy(step);layout(true);
  balloon.querySelector('.pm-spotlight-next')?.focus({preventScroll:true});
  clearTimeout(fadeTimer);
  fadeTimer=setTimeout(()=>{if(active&&serial===stepSerial){renderCopy(step);layout(true)}},240);
 }));
}
function move(dir){
 if(!active)return;
 if(index===steps.length-1&&dir>0){close();return}
 show(index+dir);
}
function open(){
 if(active)return;
 build();lastFocus=document.activeElement;
 originSemester=q('.semester-option[aria-current="true"]')?.dataset.semester||null;
 changedSemester=!!(originSemester&&originSemester!=='2026/2');
 if(changedSemester)q('.semester-option[data-semester="2026/2"]')?.click();
 active=true;shell.hidden=false;document.documentElement.classList.add('pm-tour-running');
 show(0);
}
function close(){
 if(!active)return;
 active=false;++stepSerial;
 clearTimeout(fadeTimer);shell.hidden=true;
 document.documentElement.classList.remove('pm-tour-running');
 delete document.documentElement.dataset.pmTourStep;
 document.querySelectorAll('#nav .pm-tour-nav-current').forEach(el=>el.classList.remove('pm-tour-nav-current'));
 if(sidebarSpot)sidebarSpot.hidden=true;
 if(changedSemester&&originSemester)q('.semester-option[data-semester="'+originSemester+'"]')?.click();
 changedSemester=false;
 lastFocus?.isConnected&&lastFocus.focus?.({preventScroll:true});
}
function click(event){
 if(event.target.closest('#pmTourLaunch')){event.preventDefault();markTourOpened();open();return}
 if(!active)return;
 const command=event.target.closest('[data-pmtour]')?.dataset.pmtour;
 if(command){
  event.preventDefault();event.stopPropagation();
  if(command==='close')close();
  else if(command==='next')move(1);
  else if(command==='back')move(-1);
  return;
 }
 if(steps[index]?.pick){
  const btn=event.target.closest('#homeCourses [data-action^="subject:"]');
  if(btn){chosen=btn.dataset.action.slice(8);setTimeout(()=>{if(active&&index===1)move(1)},30)}
 }
}
function blockManualScroll(event){
 if(!active)return;
 // O texto do tutorial pode rolar dentro do próprio balão, sem mover a página.
 if(event.target?.closest?.('.pm-spotlight-popover'))return;
 if(event.cancelable)event.preventDefault();
}
function blockScrollKeys(event){
 if(!active||event.target?.closest?.('.pm-spotlight-popover'))return;
 if([' ','Spacebar','PageUp','PageDown','Home','End','ArrowUp','ArrowDown'].includes(event.key)){
  event.preventDefault();
 }
}
function keys(event){
 if(!active)return;
 if(event.key==='Escape'){event.preventDefault();close();return}
 if(event.key==='ArrowRight'&&document.activeElement?.tagName!=='INPUT'){event.preventDefault();move(1);return}
 if(event.key==='ArrowLeft'&&document.activeElement?.tagName!=='INPUT'){event.preventDefault();move(-1);return}
 if(event.key!=='Tab')return;
 const nodes=[...shell.querySelectorAll('button:not([disabled])')];
 const first=nodes[0],last=nodes[nodes.length-1];
 if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
 if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
}
function refresh(){
 if(frame)return;
 frame=requestAnimationFrame(()=>{frame=0;if(active)layout(false);else insertEntry()});
}
function init(){
 build();insertEntry();
 const main=byId('main');
 if(main)new MutationObserver(refresh).observe(main,{childList:true,subtree:false});
 window.addEventListener('resize',refresh,{passive:true});
 window.addEventListener('scroll',refresh,{capture:true,passive:true});
 if(window.visualViewport)window.visualViewport.addEventListener('resize',refresh,{passive:true});
 document.addEventListener('click',click,true);
 document.addEventListener('keydown',keys,true);
 document.addEventListener('wheel',blockManualScroll,{capture:true,passive:false});
 document.addEventListener('touchmove',blockManualScroll,{capture:true,passive:false});
 document.addEventListener('keydown',blockScrollKeys,true);
 window.pmStartSpotlightTour=open;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();
