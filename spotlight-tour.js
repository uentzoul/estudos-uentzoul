/* PsicoMoodle — tour guiado por destaque dos elementos reais (14/11/2026). */
(()=>{
'use strict';
if(window.__psicoSpotlightTour)return;
window.__psicoSpotlightTour=true;

const steps=[
 {page:'home',find:'.dashboard-hero .hero-status',title:'Seu espaço de estudos',body:'Esta é a página inicial do PsicoMoodle. Aqui você acompanha o progresso do semestre: a porcentagem indica quanto das atividades cadastradas já foi concluído.'},
 {page:'home',find:'#homeCourses [data-action="subject:avaliacao"]',title:'Escolha uma disciplina',body:'Cada cartão abre uma disciplina com seus materiais e atividades. Durante o tutorial, apenas observe o cartão destacado. Clique em Próximo para conhecer a disciplina de Avaliação Psicológica.',tip:'Depois de concluir o tutorial, você poderá abrir qualquer disciplina livremente.'},
 {page:'subject',find:'.subject-hub-menu',title:'Tudo de uma matéria em um só lugar',body:'A disciplina reúne trilha de estudos para a prova, materiais e textos, estudos dirigidos, simulados, flashcards, casos, podcasts e conteúdos para revisar.',tip:'Uma boa sequência é começar pela trilha e praticar com questões depois.'},
 {page:'subject',tab:'docs',find:'#docs .doc-compact .donecontrol',fallback:'#docs .doclist .doc-compact, #docs .sectiontop',title:'Materiais e textos',body:'Nesta seção, você encontra os conteúdos disponíveis para cada disciplina, como textos-base, artigos, slides, capítulos, roteiros de estudo e outros arquivos ou links. Depois de consultar ou estudar um material, utilize “Marcar como visto” no próprio item. Assim, você acompanha o que já foi lido ou revisado e identifica facilmente o que ainda falta, mesmo quando a lista é extensa.',tip:'A marcação é pessoal e manual: abrir um arquivo ou link externo não o marca automaticamente como visto.'},
 {page:'calendar',tab:'provas',find:'.agenda-switch',title:'Agenda e horários',body:'A agenda reúne três consultas: datas das avaliações, grade semanal de aulas e conteúdos previstos para cada encontro. Vamos conhecer cada uma.'},
 {page:'calendar',tab:'provas',find:'.agenda-calendar-layout',fallback:'[data-action="agenda-tab:provas"]',title:'Provas e avaliações',body:'Veja as datas das provas no calendário, confira a disciplina correspondente e consulte informações sobre avaliações e substitutivas.',tip:'As datas podem mudar. Confirme eventuais alterações no Moodle oficial.'},
 {page:'calendar',tab:'horarios',find:'.schedule-day',fallback:'[data-action="agenda-tab:horarios"]',title:'Horários das aulas',body:'Esta visão mostra os dias da semana, as disciplinas e os respectivos horários. Consulte-a para organizar a rotina de aulas.',tip:'Use as abas acima para alternar entre as diferentes visões da agenda.'},
 {page:'calendar',tab:'conteudos',find:'.agenda-daygroup[data-agenda-date="2026-11-16"]',fallback:'.agenda-daygroup, [data-action="agenda-tab:conteudos"]',title:'Conteúdo de cada dia',body:'Confira os assuntos previstos nas aulas e as leituras indicadas nos cronogramas. Quando houver uma revisão correspondente no site, você poderá abri-la por aqui.',tip:'Use “Incluir aulas anteriores” para consultar os registros já passados.'},
 {page:'exams',tab:'ready',find:'.ge-ready-subject .examcard',fallback:'[data-ge-tab="ready"]',title:'Cinco simulados para cada prova',body:'Na aba Simulados prontos, cada disciplina reúne cinco modelos para treinar. Responda às questões, entregue sua tentativa e consulte a correção para descobrir o que precisa revisar.'},
 {page:'exams',tab:'ai',find:'.ge-generator',fallback:'[data-ge-tab="ai"]',title:'Crie seu próprio simulado',body:'Na aba Criar simulado, escolha a disciplina, a dificuldade normal ou difícil, a quantidade de questões e se deseja incluir dissertativas. Depois, acesse a correção e o histórico das suas provas.',tip:'A criação e o compartilhamento de simulados personalizados exigem uma conta conectada.'},
 {page:'messages',tab:'private',find:'#dmUserSearch',fallback:'.dm-channel-tabs [data-dm-tab="private"]',title:'Converse em particular',body:'Na lista de conversas, pesquise um colega pelo nome e inicie uma conversa direta para tirar dúvidas, combinar estudos e trocar materiais.',login:'Entre na sua conta para acessar as conversas privadas e as demais funções de Mensagens.'},
 {page:'messages',tab:'groups',find:'[data-dm-new-group]',fallback:'.dm-channel-tabs [data-dm-tab="groups"]',title:'Crie um grupo de estudos',body:'Em Mensagens, use o botão Criar grupo, escolha um nome e convide os colegas. É um espaço para organizar trabalhos, discutir questões e estudar em conjunto.',login:'Depois de entrar na conta, use Criar grupo para iniciar uma conversa com seus colegas.'},
 {page:'messages',tab:'global',find:'#dmContacts [data-dmw-global]',fallback:'#dmContacts .dm-global',title:'Participe do chat geral',body:'Na lista de conversas, selecione Chat Geral, logo abaixo de Pesquisar conversas. Esse espaço reúne os estudantes cadastrados para trocar informações, tirar dúvidas e conversar com a turma.',login:'O chat geral fica disponível para estudantes conectados à conta.'},
 {page:'messages',tab:'global',find:'[data-dmv-share-open]',fallback:'.dm-composer, .dm-channel-tabs',title:'Compartilhe conteúdos sem sair do chat',body:'Dentro de uma conversa, use o recurso de compartilhamento para encontrar materiais, simulados, podcasts e tópicos já listados no PsicoMoodle. Também é possível enviar mensagens, imagens e figurinhas.',tip:'Simulados personalizados são enviados por conversa privada, com convite para o colega acessar.',login:'Depois de entrar na conta e abrir uma conversa, você poderá compartilhar materiais do catálogo diretamente pelo chat.'},
 {page:'ai',find:'.tz-shell .tz-composer',fallback:'.tz-shell .tz-form, .tz-shell .tz-chat',tourScene:'ai-chat',title:'Conheça a IA Tzoul',body:'A IA Tzoul é a assistente de estudos do PsicoMoodle. Faça perguntas sobre as disciplinas, peça explicações, resumos, questões, roteiros ou ajuda para interpretar os conteúdos. Você também pode anexar PDFs, documentos e imagens à conversa.',tip:'É preciso estar conectado à conta para enviar mensagens. Confira as informações importantes nos materiais originais e com os professores.'},
 {page:'ai',find:'.tz-context summary',fallback:'.tz-shell .tz-form, .tz-shell .tz-chat',tourScene:'ai-filters',title:'Personalize sua resposta',body:'Antes de perguntar, abra “Filtrar matérias”. É possível selecionar uma disciplina ou material disponível, escolher entre Conversa e Documento e definir a profundidade Padrão ou Aprofundada. As conversas anteriores ficam no histórico.',tip:'A consulta integral a um documento depende de o arquivo estar acessível; caso contrário, a IA pode usar o conteúdo indexado no site.'},
 {page:'vacation',find:'#vr-root .vr-months',fallback:'#vr-root .vr-months-wrap, #navVacationReview',tourScene:'vacation-months',title:'Revisão de Férias: reviva o semestre',body:'Esta é a linha do tempo do primeiro semestre: os meses são capítulos. Clique em Março, Abril, Maio ou Junho para expandir os assuntos; abrir um mês fecha o anterior. Bolinhas maiores destacam conceitos essenciais e as cores identificam as disciplinas.',tip:'O primeiro semestre está disponível para todos. O segundo ainda está em preparação e permanece “Em breve” para os alunos até a liberação prevista para 27/11.'},
 {page:'vacation',find:'#vr-root .vr-material-button',fallback:'#vr-root .vr-materials, #vr-root .vr-month-detail',tourScene:'vacation-materials',title:'Explore os marcos e abra os materiais',body:'Ao escolher um marco da linha do tempo, surge um painel com o que foi aprendido, por que isso importa e as conexões com outras matérias. Em Materiais relacionados, cada botão abre o arquivo original completo, sem passar pela Biblioteca.',tip:'É possível explorar a linha do tempo sem login. Para abrir os PDFs e outros arquivos originais, entre na sua conta.'},
 {page:'home',find:'#semesterCurrent',title:'Escolha o semestre',body:'Use este seletor para alternar entre os períodos de Psicologia. Cada semestre tem sua própria organização, e os conteúdos aparecem conforme são cadastrados. O modo claro ou escuro também pode ser alterado no menu.',tip:'O tutorial terminou. Você poderá iniciá-lo novamente pelo botão Tutorial.'}
];

/* Mobile: explicações breves; desktop permanece como estava. */
const mobileCopy=[
 {title:'Progresso do semestre',body:'Aqui você vê o que já concluiu e o que falta estudar.'},
 {title:'Escolha uma matéria',body:'Toque numa disciplina para abrir os materiais e atividades dela.'},
 {title:'Trilha para a prova',body:'Dentro da matéria, siga a trilha para saber por onde começar a revisão.'},
 {title:'Materiais e textos',body:'Depois de estudar, toque em “Marcar como visto”. A marcação é manual.'},
 {title:'Agenda e horários',body:'Alterne entre provas, horários de aula e conteúdos de cada dia.'},
 {title:'Provas e avaliações',body:'Confira as datas das provas. Se houver mudanças, consulte o Moodle oficial.'},
 {title:'Horários das aulas',body:'Veja os dias da semana, as matérias e os horários das aulas.'},
 {title:'Conteúdo de cada dia',body:'Consulte os temas e as leituras previstos para cada aula.'},
 {title:'Simulados prontos',body:'Cada prova tem cinco simulados. Responda e confira a correção.'},
 {title:'Criar simulado',body:'Escolha a matéria e a dificuldade para criar questões e treinar.'},
 {title:'Conversas privadas',body:'Pesquise o nome de um colega e abra uma conversa privada.'},
 {title:'Grupos de estudos',body:'Use o botão de criar grupo para reunir colegas e combinar trabalhos.'},
 {title:'Chat Geral',body:'Este é o Chat Geral, onde todos podem trocar mensagens e tirar dúvidas.'},
 {title:'Compartilhar no chat',body:'Em uma conversa, use Compartilhar para enviar materiais do PsicoMoodle.'},
 {title:'Converse com a IA Tzoul',body:'Peça explicações, resumos ou questões. Com a conta conectada, dá para anexar PDFs, documentos e fotos.'},
 {title:'Filtre as respostas da IA',body:'Toque em “Filtrar matérias” para escolher disciplina, material, tipo de resposta e profundidade.'},
 {title:'Revisão de Férias',body:'A linha do tempo do 1º semestre é aberta a todos. Toque em um mês para ver seus principais assuntos.'},
 {title:'Conteúdos e materiais originais',body:'Toque num marco para ver a explicação e os arquivos relacionados. Para abrir os PDFs, entre na conta.'}
];
const mobileSteps=[
 {page:'home',find:'#pmMobileMenuToggle',tourScene:'menu-button',
  title:'Abra o menu',body:'Arraste para a direita em qualquer parte da tela. O menu acompanha seu dedo. Ou toque em ☰.'},
 {page:'home',find:'#siteSidebar',tourScene:'menu-list',
  title:'Explore o PsicoMoodle',body:'Aqui estão as páginas, matérias e outras opções. Para fechar, arraste para a esquerda em qualquer lugar da tela ou toque fora.'},
 ...steps.slice(0,-1).map((s,i)=>({...s,...mobileCopy[i],baseIndex:i,
  ...(i===2?{tourScene:'trail',find:'.subject-hub-menu [data-action="subjectArea:trail"]'}:{}),
  ...(i===12?{tourScene:'global-chat',find:'#main .dm-shell.has-conversation .dm-chat-head'}:{})
 })),
 {page:'home',find:'#pmMobileTopbar .mobile-brand-actions',tourScene:'preferences',
  title:'Tema e perfil',body:'Aqui você muda entre claro e escuro e acessa seu perfil.'},
 {...steps[steps.length-1],baseIndex:steps.length-1,tourScene:'semester',
  title:'Escolha o semestre',body:'Abra ☰ e escolha o semestre. Você pode repetir o tutorial quando quiser.'}
];
/* Quatro percursos: desktop/celular e usuário conectado/visitante.
   No acesso sem conta, o chat é apresentado sem simular recursos indisponíveis. */
const guestAIStep={
 page:'ai',find:'.tz-login [data-action="tz-login"]',fallback:'.tz-shell .tz-notice, .tz-shell .tz-form',
 baseIndex:14,tourScene:'guest-ai',
 title:'IA Tzoul: sua assistente de estudos',
 body:'A IA Tzoul ajuda a estudar as matérias, explicar conceitos, criar resumos e questões e trabalhar com anexos. Para conversar, anexar arquivos e consultar o histórico, é necessário entrar ou cadastrar uma conta. O botão Entrar / Cadastrar está nesta página.',
 login:'Depois de entrar, faça o tutorial novamente para conhecer o filtro por disciplina, os materiais e os tipos de resposta.'
};
const guestMessageStep={
 page:'messages',find:'.dm-login-panel [data-account-action="open"]',
 fallback:'.dm-login-panel',baseIndex:10,tourScene:'guest-message',
 title:'Mensagens: entre para conversar',
 body:'Para enviar mensagens, participar do chat geral, criar grupos e compartilhar materiais com colegas, entre na sua conta ou cadastre-se. O botão Entrar / Cadastrar aparece nesta tela.',
 login:'O chat exige uma conta. Depois de entrar, inicie o tutorial novamente para conhecer todas as funções de Mensagens.'
};
const desktopGuestSteps=[
 ...steps.slice(0,10).map((s,i)=>({...s,baseIndex:i})),
 guestMessageStep,
 guestAIStep,
 {...steps[16],baseIndex:16},
 {...steps[17],baseIndex:17,
   body:'Selecione um marco para ler a explicação e ver os documentos associados. A linha do tempo é pública, mas abrir os arquivos completos exige uma conta conectada.'},
 {...steps[steps.length-1],baseIndex:steps.length-1,
  body:'Escolha o semestre para consultar os conteúdos disponíveis. O modo claro ou escuro também pode ser alterado no menu. Entre na sua conta para participar dos chats e acompanhar suas atividades.'}
];
const mobileGuestSteps=[
 ...mobileSteps.slice(0,12),
 {...guestMessageStep,
  title:'Mensagens exigem uma conta',
  body:'Para conversar com a turma, participar de grupos e compartilhar materiais, primeiro entre ou cadastre-se. Este é o botão de acesso.'},
 {...guestAIStep,title:'IA Tzoul exige login',
   body:'A IA pode ajudar com dúvidas, resumos e questões. Entre ou cadastre-se para conversar, anexar materiais e usar os filtros.'},
 {...steps[16],...mobileCopy[16],baseIndex:16},
 {...steps[17],...mobileCopy[17],baseIndex:17},
 {...mobileSteps[mobileSteps.length-2],
  body:'Aqui você pode mudar o tema do site. Para acessar seu perfil, entre na conta ou cadastre-se.'},
 {...mobileSteps[mobileSteps.length-1],
  body:'Abra ☰ para mudar de semestre. Você poderá repetir o tutorial depois de entrar na conta.'}
];
const byId=id=>document.getElementById(id);
const q=s=>document.querySelector(s);
let active=false,index=0,chosen='avaliacao',lastFocus=null,originSemester=null,changedSemester=false,temporaryVacationSemester=false;
let runSteps=steps,tourMobile=false,tourLoggedIn=false;
const isLoggedIn=()=>!!window.uentzoulAIAuth?.user?.();
const originalIndex=()=>Number.isInteger(runSteps[index]?.baseIndex)?runSteps[index].baseIndex:(!tourMobile&&runSteps===steps?index:-1);
const tourScene=()=>runSteps[index]?.tourScene||'';
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
 const mobile=innerWidth<=760;
 let entry=byId('pmTourEntry');
 if(!entry){
  entry=document.createElement('div');entry.id='pmTourEntry';entry.className='pm-tour-entry';
  entry.innerHTML='<button type="button" id="pmTourLaunch" class="pm-tour-launch" aria-label="Iniciar tutorial guiado do site"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H20v15H6.5A2.5 2.5 0 0 1 4 16.5zM4 16.5A2.5 2.5 0 0 1 6.5 14H20M8 8h8"/></svg><span>Tutorial</span></button>';
 }
 entry.classList.toggle('is-first-visit',isFirstVisit());
 // Mobile: Tutorial entre o resumo do semestre e a apresentação das disciplinas.
 // Desktop: permanece na linha da descrição da Biblioteca.
 if(mobile){
  if(entry.parentNode!==intro.parentNode||entry.nextElementSibling!==intro){
   intro.parentNode.insertBefore(entry,intro);
  }
 }else if(entry.parentNode!==intro)intro.appendChild(entry);
}
function build(){
 if(shell)return;
 shell=document.createElement('div');shell.id='pmSpotlight';shell.className='pm-spotlight';shell.hidden=true;
 shell.innerHTML='<svg class="pm-spotlight-svg" aria-hidden="true" preserveAspectRatio="none"><path class="pm-spotlight-path" fill-rule="evenodd"></path></svg>'+
 '<div class="pm-spotlight-interaction-shield" aria-hidden="true"></div>'+
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
function targetNode(selector){
 if(!selector)return null;
 const node=q(selector);
 if(!node)return null;
 const rect=node.getBoundingClientRect();
 return rect.width>0&&rect.height>0?node:null;
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
 document.querySelectorAll('.pm-tour-day-lesson').forEach(n=>n.classList.remove('pm-tour-day-lesson'));
 if(step.page==='vacation'){
  // Demonstra o primeiro semestre real sem publicar nem alterar conteúdos.
  const first=q('#semesterDropdown [data-semester="2026/1"]');
  if(first&&!first.classList.contains('active')){first.click();temporaryVacationSemester=true;}
  const alreadyOpen=!!q('#main.vr-active #vr-root .vr-months');
  const ready=alreadyOpen?Promise.resolve():Promise.resolve(window.PSICO_VACATION_REVIEW?.show?.());
  return ready.then(()=>{
   if(!active||runSteps[index]!==step)return;
   if(step.tourScene==='vacation-materials'){
    const month=q('#vr-root [data-vr-month="3"]');
    if(month&&month.getAttribute('aria-expanded')!=='true')month.click();
    const firstEvent=q('#vr-panel-3 .vr-event');
    if(firstEvent&&firstEvent.getAttribute('aria-expanded')!=='true')firstEvent.click();
   }
  });
 }
 if(temporaryVacationSemester){
  q('#semesterDropdown [data-semester="2026/2"]')?.click();
  temporaryVacationSemester=false;
 }
 if(step.page==='subject'){
  if(step.tab==='docs'){
   // Acesse de verdade Materiais e textos; não marque nenhum material durante o tour.
   if(page()!=='subject')chooseSubject();
   const docs=q('#main .subject-hub-menu [data-action="subjectArea:docs"]');
   if(docs)docs.click();
  }else chooseSubject();
 }else navigate(step.page);
 // "Chat Geral" é um contato fixo logo abaixo da busca, não uma aba no cabeçalho.
 if(step.page==='messages' && step.tab==='global'){
  const search=q('#dmUserSearch');
  if(search?.value){search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));}
 }
 if(step.tab&&step.page!=='subject')selectTab(step);
 if(tourMobile&&tourLoggedIn&&step.tourScene==='global-chat'&&!q('#main .dm-shell.has-conversation .dm-chat-head .dm-global-avatar')){
  // No celular, o chat aberto ocupa outra tela: mostre a conversa, não o item oculto da lista.
  q('#main #dmContacts [data-dmw-global]')?.click();
 }
 if(step.page==='messages'&&step.tab==='global'&&originalIndex()===13&&tourLoggedIn){
  // O compartilhamento só é mostrado dentro de uma conversa aberta.
  const general=q('#main #dmContacts [data-dmw-global]');
  if(general)general.click();
 }
 if(originalIndex()===7){
  // Marcador visual temporário; não modifica nem salva o conteúdo real.
  mondayClassRow()?.classList.add('pm-tour-day-lesson');
 }
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
 if(step.tourScene==='guest-message'){
  const signIn=targetNode('#main .dm-login-panel [data-account-action="open"]')||
   targetNode('#main .dm-login-panel');
  if(signIn)return {node:signIn,login:true};
 }
 if(tourMobile){
  const focused={
   1:()=>targetNode('#homeCourses [data-action="subject:avaliacao"]')?.closest('.course-card')||targetNode('#homeCourses .course-card'),
   2:()=>targetNode('#main .subject-hub-menu [data-action="subjectArea:trail"]'),
   5:()=>calendarEventDay(),
   6:()=>targetNode('#main .schedule-day:has(.schedule-lesson)'),
   7:()=>mondayClassRow(),
   10:()=>tourLoggedIn?targetNode('#main .dm-list .dm-search-label')||targetNode('#main .dm-list-head'):null,
   11:()=>tourLoggedIn?targetNode('#main [data-dm-new-group]'):null,
   12:()=>tourLoggedIn?targetNode('#main .dm-shell.has-conversation .dm-chat-head:has(.dm-global-avatar)')||targetNode('#main #dmContacts [data-dmw-global]'):null,
   13:()=>tourLoggedIn?targetNode('#main [data-dmv-share-open]')||targetNode('#main .dm-composer'):null
  }[originalIndex()]?.();
  if(focused)return {node:focused,login:false};
 }
 let node=targetNode('#main '+step.find)||targetNode(step.find);
 if(tourMobile&&node){
  if(node.matches('.subject-hub-menu'))node=targetNode('#main .subject-hub-menu .subject-hub-card')||node;
  if(node.matches('.agenda-switch'))node=targetNode('#main .agenda-switch button')||node;
  if(node.matches('.ge-generator'))node=targetNode('#main .ge-generator button, #main .ge-generator select')||node;
 }
 if(node)return {node,login:false};
 const substitute=step.fallback?step.fallback.split(',').map(x=>x.trim()).map(x=>targetNode('#main '+x)||targetNode(x)).find(Boolean):null;
 const login=step.page==='messages'?targetNode('#main .dm-login-panel [data-account-action="open"]')||targetNode('#main .dm-login-panel'):null;
 const fallback=substitute||login||available('#nav [data-page="'+step.page+'"]')||targetNode('#main > :first-child')||available('.dashboard-hero');
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
 if(step.page==='vacation')return available('#navVacationReview');
 if(step.page==='subject'){
  return available('#subjectNav [data-action="subject:'+chosen+'"]')||
         available('#nav [data-page="home"]');
 }
 return available('#nav [data-page="'+step.page+'"]');
}
function updateSidebarHighlight(step){
 document.querySelectorAll('#nav .pm-tour-nav-current').forEach(el=>el.classList.remove('pm-tour-nav-current'));
 document.querySelectorAll('.pm-tour-day-lesson').forEach(el=>el.classList.remove('pm-tour-day-lesson'));
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
 if(index===7&&w>=1050){
  // Materiais por dia: destaque à esquerda e explicação no espaço reservado à direita.
  const group=available('#main .agenda-daygroup[data-agenda-date="2026-11-16"]');
  const gr=group?.getBoundingClientRect();
  if(gr){
   const x=Math.max(12,gr.right+16);
   const panelWidth=Math.min(345,w-x-14);
   if(panelWidth>=260){
    balloon.style.width=panelWidth+'px';
    const h2=balloon.getBoundingClientRect().height;
    const lesson=mondayClassRow()?.getBoundingClientRect();
    const preferredTop=lesson?lesson.top:gr.top;
    balloon.dataset.side='right';
    balloon.style.left=Math.round(x)+'px';
    balloon.style.top=Math.round(clamp(preferredTop,12,Math.max(12,h-h2-12)))+'px';
    return;
   }
  }
 }
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
 const bar=available('#pmMobileTopbar');
 const headerBottom=bar?bar.getBoundingClientRect().bottom:0;
 const drawerOpen=document.body.classList.contains('pm-mobile-menu-open');
 const top=drawerOpen?12:clamp(headerBottom>0?headerBottom+8:12,12,Math.max(12,innerHeight*.38));
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
 if(originalIndex()===5 && node.matches('.agenda-cal-day'))return calendarWeekRect(node);
 if(mobile&&originalIndex()===6&&node.matches('.schedule-day')){
  // Etapa 9/18: enquadra o cartão inteiro da segunda-feira, do título
  // à última aula, mantendo todos os horários visíveis.
  return node.getBoundingClientRect();
 }
 // A data aparece na faixa anexada à própria aula; destacar só a aula
 // de Metapsicologia, não todos os outros encontros de segunda-feira.
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
 // Os botões da barra e da gaveta não dependem da rolagem do documento.
 if(['menu-button','menu-list','preferences','semester'].includes(tourScene()))return;
 const zone=mobileShowcase(),r=targetVisualBounds(node,true),room=zone.bottom-zone.top;
 if(room<50)return;
 const old=originalIndex();
 const marginTop=old===1||old===6||old===7?6:12;
 let desired=zone.top+marginTop;
 if(old!==1&&old!==6&&old!==7&&r.height<room-24)desired=zone.top+(room-r.height)/2;
 // Não recentrar blocos altos no meio, pois isso cortava o título do item.
 const delta=r.top-desired;
 if(Math.abs(delta)<4)return;
 const maxScroll=document.documentElement.scrollHeight-innerHeight;
 const next=clamp(window.scrollY+delta,0,Math.max(0,maxScroll));
 if(Math.abs(next-window.scrollY)<3)return;
 pendingScroll=true;
 window.scrollTo({top:next,behavior:'auto'});
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
  pendingScroll=false;
  if(active)layout(false);
 }));
}
function layout(scrollTarget=false){
 if(!active||!shell||shell.hidden)return;
 const found=findNode(runSteps[index]),node=found.node;
 if(!node)return;
 if(originalIndex()===7&&node.matches('.agenda-classrow'))node.classList.add('pm-tour-day-lesson');
 const mobile=tourMobile;
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
 const fixedMobile=['menu-button','menu-list','preferences','semester'].includes(tourScene());
 if(mobile&&!fixedMobile&&(visual.bottom<zone.top+4||visual.top>zone.bottom-4)){
  // Alvo fora do espaço visível: não destaque um recorte falso.
  spot.style.display='none';
  shell.querySelector('.pm-spotlight-svg').setAttribute('viewBox','0 0 '+innerWidth+' '+innerHeight);
  shell.querySelector('.pm-spotlight-path').setAttribute('d','M 0 0 H '+innerWidth+' V '+innerHeight+' H 0 Z');
  if(sidebarSpot)sidebarSpot.hidden=true;
  return;
 }
 spot.style.display='';
 let r;
 if(mobile&&tourScene()==='menu-list'){
  const side=node.getBoundingClientRect(),popup=balloon.getBoundingClientRect();
  const left=clamp(side.left+6,6,innerWidth-40),right=clamp(side.right-6,left+24,innerWidth-6);
  const top=clamp(side.top+8,6,innerHeight-90);
  const bottom=clamp(Math.min(side.bottom-8,popup.top-12),top+40,innerHeight-6);
  r={left,right,top,bottom,width:right-left,height:bottom-top};
 }else if(mobile&&['menu-button','semester','preferences'].includes(tourScene())){
  r=currentRect(node);
 }else if(mobile)r=clipVisualBounds(visual,zone);
 else r=originalIndex()===7?currentRect({getBoundingClientRect:()=>visual}):currentRect(node);
 lastRect=r;
 const navNode=updateSidebarHighlight(runSteps[index]);
 if(originalIndex()===7&&node.matches('.agenda-classrow'))node.classList.add('pm-tour-day-lesson');
 const navRect=!mobile&&navNode?currentRect(navNode):null;
 const overlap=navRect&&navRect.left<r.right&&navRect.right>r.left&&navRect.top<r.bottom&&navRect.bottom>r.top;
 cutout(r,overlap?null:navRect);
 if(!mobile)positionPopover(r);
}

function renderCopy(step){
 const found=findNode(step);
 shell.querySelector('#pmSpotlightTitle').textContent=step.title;
 const mobile=tourMobile;
 const extra=mobile?'':(found.login?(step.login||'Entre na sua conta para usar este recurso.'):(step.tip||''));
 shell.querySelector('.pm-spotlight-body').textContent=step.body;
 // No celular há um único texto curto; no desktop mantemos as dicas.
 const hint=shell.querySelector('.pm-spotlight-tip');
 hint.textContent=extra;
 hint.hidden=!extra;
 shell.querySelector('.pm-spotlight-counter').textContent=(index+1)+' / '+runSteps.length;
 shell.querySelector('.pm-spotlight-track span').style.width=100*(index+1)/runSteps.length+'%';
 shell.querySelector('.pm-spotlight-back').disabled=index===0;
 shell.querySelector('.pm-spotlight-next').innerHTML=index===runSteps.length-1?'Concluir <span aria-hidden="true">✓</span>':'Próximo <span aria-hidden="true">→</span>';
}
function syncMobileMenu(step){
 if(!tourMobile)return;
 const drawer=window.pmMobileDrawer;
 if(step.tourScene==='menu-list'||step.tourScene==='semester'){
  drawer?.open?.();
  drawer?.scrollToTop?.();
 }else drawer?.close?.();
}
function show(n){
 if(!active)return;
 index=clamp(n,0,runSteps.length-1);
 document.documentElement.dataset.pmTourStep=String(originalIndex()+1);
 document.documentElement.dataset.pmTourScene=tourScene();
 mobilePositionAttempts=0;
 const serial=++stepSerial,step=runSteps[index];
 const preparation=prep(step);
 syncMobileMenu(step);
 // Atualiza o texto imediatamente; para a linha do tempo, aguarda a abertura
 // real dos conteúdos antes de posicionar o destaque no elemento correto.
 renderCopy(step);
 Promise.resolve(preparation).catch(error=>{console.warn('Preparação do tutorial:',error)}).then(()=>{
  if(!active||serial!==stepSerial)return;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   if(!active||serial!==stepSerial)return;
   renderCopy(step);layout(true);
   balloon.querySelector('.pm-spotlight-next')?.focus({preventScroll:true});
   clearTimeout(fadeTimer);
   fadeTimer=setTimeout(()=>{if(active&&serial===stepSerial){renderCopy(step);layout(true)}},270);
  }));
 });
}
function move(dir){
 if(!active)return;
 if(index===runSteps.length-1&&dir>0){close();return}
 show(index+dir);
}
function open(){
 if(active)return;
 temporaryVacationSemester=false;
 build();lastFocus=document.activeElement;
 originSemester=q('.semester-option[aria-current="true"]')?.dataset.semester||null;
 changedSemester=!!(originSemester&&originSemester!=='2026/2');
 if(changedSemester)q('.semester-option[data-semester="2026/2"]')?.click();
 tourMobile=innerWidth<=760;
  tourLoggedIn=isLoggedIn();
  runSteps=tourMobile?(tourLoggedIn?mobileSteps:mobileGuestSteps):(tourLoggedIn?steps:desktopGuestSteps);
  document.documentElement.dataset.pmTourAuth=tourLoggedIn?'logged':'guest';
 // Qualquer gesto já iniciado deve terminar antes do bloqueio total da tela.
 window.pmMobileDrawer?.cancelGesture?.();
 window.pmMobileDrawer?.close?.();
 active=true;shell.hidden=false;document.documentElement.classList.add('pm-tour-running');
 show(0);
}
function close(){
 if(!active)return;
 active=false;++stepSerial;
 clearTimeout(fadeTimer);shell.hidden=true;
 window.pmMobileDrawer?.close?.();
 document.documentElement.classList.remove('pm-tour-running');
 delete document.documentElement.dataset.pmTourStep;
 delete document.documentElement.dataset.pmTourScene;
  delete document.documentElement.dataset.pmTourAuth;
 document.querySelectorAll('#nav .pm-tour-nav-current').forEach(el=>el.classList.remove('pm-tour-nav-current'));
 if(sidebarSpot)sidebarSpot.hidden=true;
 if(temporaryVacationSemester){
  q('#semesterDropdown [data-semester="2026/2"]')?.click();
  temporaryVacationSemester=false;
 }
 if(changedSemester&&originSemester)q('.semester-option[data-semester="'+originSemester+'"]')?.click();
 changedSemester=false;
 // Ao concluir ou fechar, a navegação pode ter recriado a página Início:
 // recoloca o botão sem exigir recarregamento ou gesto do usuário.
 insertEntry();
 requestAnimationFrame(()=>{
  insertEntry();
  const original=lastFocus?.isConnected?lastFocus:byId('pmTourLaunch');
  original?.focus?.({preventScroll:true});
 });
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
}
function blockBackgroundInteraction(event){
 if(!active||!event.isTrusted)return;
 // Nenhum item atrás do tutorial, nem os elementos recortados, pode receber cliques/toques.
 if(event.target?.closest?.('.pm-spotlight-popover'))return;
 if(event.cancelable)event.preventDefault();
 event.stopImmediatePropagation();
}
function keepTutorialFocus(event){
 if(!active||!balloon||balloon.contains(event.target))return;
 event.stopPropagation();
 balloon.querySelector('.pm-spotlight-next')?.focus({preventScroll:true});
}
function blockManualScroll(event){
 if(!active)return;
 // Permita ler o balão do tutorial em telas menores, sem rolar a página atrás.
 if(event.target?.closest?.('.pm-spotlight-popover'))return;
 if(event.cancelable)event.preventDefault();
 if(tourMobile)event.stopImmediatePropagation();
}
function blockScrollKeys(event){
 if(!active)return;
 if(!tourMobile&&event.target?.closest?.('.pm-spotlight-popover'))return;
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
 frame=requestAnimationFrame(()=>{
  frame=0;
  if(active&&((innerWidth<=760)!==tourMobile)){close();return}
  // A entrada precisa existir até mesmo quando o tour muda de página.
  insertEntry();
  if(active)layout(false);
 });
}
function init(){
 build();insertEntry();
 const main=byId('main');
 if(main)new MutationObserver(refresh).observe(main,{childList:true,subtree:false});
 window.addEventListener('resize',refresh,{passive:true});
 window.addEventListener('uentzoul:auth',()=>{
  // O estado da sessão pode mudar durante o tour.
  if(active&&isLoggedIn()!==tourLoggedIn)close();
  else refresh();
 });
 window.addEventListener('scroll',refresh,{capture:true,passive:true});
 if(window.visualViewport)window.visualViewport.addEventListener('resize',refresh,{passive:true});
 document.addEventListener('click',click,true);
 // Defesa adicional caso um recorte receba eventos através do SVG em algum navegador.
 // A navegação interna do tutorial usa cliques programáticos, que não são bloqueados.
 for(const type of ['pointerdown','pointerup','touchstart','touchend','mousedown','mouseup','click','dblclick','contextmenu']){
  document.addEventListener(type,blockBackgroundInteraction,{capture:true,passive:false});
 }
 document.addEventListener('focusin',keepTutorialFocus,true);
 document.addEventListener('keydown',keys,true);
 document.addEventListener('wheel',blockManualScroll,{capture:true,passive:false});
 document.addEventListener('touchmove',blockManualScroll,{capture:true,passive:false});
 document.addEventListener('keydown',blockScrollKeys,true);
 window.pmStartSpotlightTour=open;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();
