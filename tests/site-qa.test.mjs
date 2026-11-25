// Auditoria automatizada do PsicoMoodle: previne regressões de interface e de recursos locais.
// Execução: node --test tests/site-qa.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root=path.resolve(import.meta.dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const html=read('index.html');
const review=read('revisao-ferias.js');

function allFiles(dir){
 return fs.readdirSync(dir,{withFileTypes:true}).flatMap(item=>{
  const full=path.join(dir,item.name);
  return item.isDirectory()?allFiles(full):[full];
 });
}

test('Chat de Manutenção permanece disponível sem chamada de voz ou vídeo',()=>{
 const maintenance=read('chat-admin-maintenance.js').trim();
 const start='/* Fonte: chat-admin-maintenance.js */\n';
 const end='\n/* Fonte: chat-stickers.js */';
 const begin=html.indexOf(start),finish=html.indexOf(end,begin+start.length);
 assert.ok(begin>=0&&finish>begin,'o HTML continua incluindo o chat de manutenção');
 assert.equal(html.slice(begin+start.length,finish).trim(),maintenance,'o módulo integrado continua sincronizado');
 assert.doesNotMatch(maintenance,/data-pm-maintenance-call|uentzoulGroupCalls|Entrar na call/,'nenhuma entrada para chamadas no chat de manutenção');
 assert.match(maintenance,/data-pm-maintenance-open/,'atalho de manutenção segue disponível');
 assert.match(maintenance,/data-pm-maintenance-back/,'navegação do chat preservada');
 assert.match(maintenance,/pmMaintenanceForm/,'envio de mensagens segue disponível');
});


test('IA Tzoul está pausada na navegação e não é restaurada por histórico antigo',()=>{
 assert.doesNotMatch(html,/data-page="ai"/,'aba de IA ausente da barra lateral');
 assert.doesNotMatch(html,/data-pc-tab="ai"/,'atalho de IA ausente do Espaço Pessoal');
 assert.doesNotMatch(html,/\['ai','IA \/ Documentos'\]/,'aba de IA removida do menu pessoal');
 assert.match(html,/const go=\(page,extra=\{\}\)=>\{\s*if\(page==='ai'\)page='home';/,'rotas diretas redirecionam para a página inicial');
 assert.match(html,/function render\(\)\{\s*if\(current\.page==='ai'\)current\.page='home';/,'estado antigo não consegue reabrir IA');
 assert.doesNotMatch(html,/case 'ai':body=renderAI\(\)/,'renderizador de IA não está ativo');
 assert.match(html,/data-page="extras"/,'jogos Extras continuam disponíveis');
 assert.match(html,/data-page="messages"/,'Mensagens continua disponível');
 assert.match(html,/function renderAI\(\)/,'o código anterior é preservado para eventual retomada');
 assert.match(html,/data-pc-tab="exams"/,'Simulados pessoais permanecem disponíveis');
});

test('Documento principal declara português brasileiro e viewport responsivo',()=>{
 assert.match(html,/<html[^>]*lang="pt-BR"/i);
 assert.match(html,/<meta[^>]+name="viewport"/i);
 assert.match(html,/<main[^>]+id="main"/i);
});


test('Carregador mantém Biblioteca abaixo de Agenda e não recria áreas descontinuadas',()=>{
 const loader=read('site-version.js');
 // Executa a rotina de reordenação sobre a navegação sem Trabalhos.
 const begin=loader.indexOf(" const nav=document.getElementById('nav');");
 const finish=loader.indexOf(' // Marca e nome:',begin);
 assert.ok(begin>=0&&finish>begin,'rotina de ordenação do menu');
 const initial=['home','calendar','exams','caderno','messages','vacation','biblioteca','bibliotecaAdmin','extras'];
 const nodes=Object.fromEntries(initial.map(name=>[name,{name}]));
 const children=initial.map(name=>nodes[name]);
 const selectorMap={
  '[data-page="home"]':'home','[data-page="calendar"]':'calendar','[data-page="exams"]':'exams',
  '#navCadernoPreview':'caderno','[aria-label="Biblioteca — em breve"]':'biblioteca',
  '[data-page="messages"]':'messages','#navVacationReview':'vacation',
  '#navBookLibraryAdmin':'bibliotecaAdmin','[data-page="extras"]':'extras','[data-page="admin"]':null
 };
 for(const node of children)Object.defineProperty(node,'nextElementSibling',{
  get(){return children[children.indexOf(node)+1]||null}
 });
 const nav={
  querySelector(selector){return nodes[selectorMap[selector]]||null},
  insertBefore(node,before){const old=children.indexOf(node);if(old>=0)children.splice(old,1);const index=before?children.indexOf(before):-1;children.splice(index<0?children.length:index,0,node)}
 };
 vm.runInNewContext(loader.slice(begin,finish),{document:{getElementById:id=>id==='nav'?nav:null}});
 assert.deepEqual(children.map(n=>n.name),['home','calendar','biblioteca','bibliotecaAdmin','exams','caderno','messages','vacation','extras'],'menu estável após carregar scripts e login');

 const badgeBegin=loader.indexOf(' function harmonizeUpcoming(){');
 const badgeEnd=loader.indexOf('\n function sync(){',badgeBegin);
 assert.ok(badgeBegin>=0&&badgeEnd>badgeBegin,'rotina de selos');
 const item={name:'biblioteca',badges:[]};
 item.tip={remove(){item.tip=null}};
 item.querySelector=selector=>selector==='.nav-upcoming-tip'?item.tip:selector==='.nb-preview-label'?item.badges[0]:null;
 item.removeAttribute=()=>{};
 item.appendChild=badge=>item.badges.push(badge);
 const fakeDocument={
  querySelectorAll:()=>[item],
  createElement:tag=>({tag,className:'',textContent:'',setAttribute(name,value){this[name]=value}})
 };
 vm.runInNewContext(loader.slice(badgeBegin,badgeEnd)+'\nharmonizeUpcoming();',{document:fakeDocument});
 assert.equal(item.badges.length,1,'Biblioteca mantém um selo');
 assert.equal(item.badges[0].textContent,'Em breve','Biblioteca mostra Em breve');
 assert.equal(item.tip,null,'Biblioteca não mantém tooltip duplicado');
 assert.match(html,/site-version\.js\?v=20\d{6}-[a-z0-9-]+/,'carregador do menu possui versão de cache explícita');
});

test('Biblioteca liberada após Agenda, sem reintroduzir Trabalhos',()=>{
 const navStart=html.indexOf('<nav class="menu" id="nav">');
 const navEnd=html.indexOf('</nav>',navStart);
 assert.ok(navStart>=0&&navEnd>navStart,'menu principal disponível');
 const nav=html.slice(navStart,navEnd);
 const agenda=nav.indexOf('data-page="calendar"');
 const biblioteca=nav.indexOf('id="navBookLibraryAdmin"');
 const simulados=nav.indexOf('data-page="exams"');
 const caderno=nav.indexOf('id="navCadernoPreview"');
 const mensagens=nav.indexOf('data-page="messages"');
 const ferias=nav.indexOf('id="navVacationReview"');
 const extras=nav.indexOf('id="navExtrasGames"');
 const admin=nav.indexOf('id="navAdminConfig"');
 assert.ok(agenda>=0&&biblioteca>agenda&&simulados>biblioteca&&caderno>simulados&&mensagens>caderno&&ferias>mensagens&&extras>ferias&&admin>extras,'ordem preservada');
 assert.match(nav,/id="navBookLibraryAdmin" data-page="books" aria-label="Biblioteca — livros"/);
 assert.doesNotMatch(nav,/aria-label="Biblioteca — em breve"|class="sidebtn nav-upcoming"/);
 assert.doesNotMatch(nav,/Trabalhos|trabalhos|data-page="works"/,'nenhum botão da antiga funcionalidade');
 assert.doesNotMatch(html,/navTrabalhos|PSICO_WORKS|PSICO_WORK_REVIEW|case 'works'|data-page="works"|trabalhos-conferencia\.(css|js)|trabalhos\.(css|js)/,'sem código ou referências do módulo removido');
});

test('Barra oval de busca, ordenação e visualização não retorna em nenhum semestre',()=>{
 for(const removed of [
  'class="course-toolbar"','id="libraryCourseSearch"',
  'id="libraryCourseOrder"','id="libraryCourseMode"',
  'id="libraryCourseNoResults"','Buscar disciplina...'
 ])assert.equal(html.includes(removed),false,removed);
 assert.match(html,/function renderLibrary\(/);
 assert.match(html,/function renderThirdSemester\(/);
 assert.match(html,/class="course-grid/);
});

test('Três semestres continuam cadastrados com suas disciplinas',()=>{
 for(const year of ["'2026/1'","'2026/2'","'2027/1'"])assert.ok(html.includes(year),year);
 const match=html.match(/<script id="dataset" type="application\/json">([\s\S]*?)<\/script>/);
 assert.ok(match,'dataset principal');
 const data=JSON.parse(match[1]);
 assert.equal(Object.keys(data.subjects).length,6,'seis disciplinas do segundo semestre');
 for(const name of ['tcc','familia','meta','grupos','social','avaliacao'])assert.ok(data.subjects[name],name);
});

test('Revisão de Férias já existe no HTML inicial e não pisca no refresh',()=>{
 const elementIndex=html.indexOf('id="navVacationReview"'),extrasIndex=html.indexOf('id="navExtrasGames"');
 assert.ok(elementIndex>0&&extrasIndex>elementIndex,'item na posição final antes do HTML ser exibido');
 assert.match(html,/<script id="pm-vacation-timeline-js"[^>]+defer><\/script>/,'script carregado sem injeção tardia');
 assert.match(html,/<link id="pm-vacation-timeline-css"[^>]+rel="stylesheet"/,'estilo carregado no head');
 const css=read('revisao-ferias.css');
 assert.doesNotMatch(css,/animation:vr-page-enter/,'sem fade de página inteira');
 const section=review.match(/function navButton\(\)\{[\s\S]*?\n\}/);
 assert.ok(section,'função para manter o botão funcional');
 let registrations=0,creations=0,updates=0;
 const button={dataset:{},addEventListener(){registrations++;}};
 const navigation={querySelectorAll:()=>[]};
 const document={getElementById:()=>button,createElement(){creations++;return {};}};
 const initialize=vm.runInNewContext('('+section[0]+')',{
  nav:()=>navigation,document,updateNavStatus:()=>{updates++}
 });
 initialize();initialize();
 assert.equal(creations,0,'não deve recriar o botão existente');
 assert.equal(registrations,0,'o botão não registra listeners diretos: o clique é delegado uma única vez no setup');
 assert.match(review,/document\.addEventListener\('click',event=>\{\s*const button=event\.target\?\.closest\?\.\('#navVacationReview'\)/,'delegação do clique ocorre fora de navButton');
 assert.equal(updates,2,'atualiza somente metadados sem inserir nós');
});

test('Linha do tempo colorida mantém todos os semestres e publicação programada',()=>{
 const pairs={tcc:'#3963c7',familia:'#b46e3d',meta:'#8463b1',grupos:'#2a967d',social:'#ac597f',avaliacao:'#27869e'};
 for(const [subject,color] of Object.entries(pairs))
  assert.ok(review.includes(subject+':[')&&review.includes(color),subject);
 assert.match(review,/const canView=\(sem=semester\)=>sem===1\|\|sem===2\|\|admin\(\)/);
 assert.doesNotMatch(review,/2026-11-27|SECOND_SEMESTER_RELEASE|Revisão de Férias — em breve/);
 assert.match(review,/data-major/);
 assert.match(review,/--vr-color/);
});

test('Scripts internos e scripts inline não possuem erro de sintaxe',()=>{
 for(const file of allFiles(root).filter(x=>x.endsWith('.js')&&!x.includes('/node_modules/'))){
  assert.doesNotThrow(()=>new vm.Script(fs.readFileSync(file,'utf8'),{filename:file}),file);
 }
 const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
 for(let i=0;i<scripts.length;i++){
  const [,attrs,body]=scripts[i];
  if(/\bsrc\s*=/.test(attrs))continue;
  if(/type\s*=\s*["']application\/json["']/i.test(attrs)){assert.doesNotThrow(()=>JSON.parse(body));continue;}
  if(/type\s*=\s*["']application\/ld\+json["']/i.test(attrs))continue;
  assert.doesNotThrow(()=>new vm.Script(body,{filename:'index.html#script'+i}));
 }
});

test('Recursos locais do HTML existem e não geram 404 por caminho ausente',()=>{
 const refs=[...html.matchAll(/<(?:script|link|img|a)\b[^>]*?(?:src|href)\s*=\s*(["'])(.*?)\1/gi)].map(x=>x[2]);
 for(const raw of refs){
  if(!raw || /^(?:https?:|data:|mailto:|tel:|#|\/|\$)/i.test(raw))continue;
  if(raw.includes("'")||raw.includes('${'))continue;
  const relative=raw.split('?')[0].replace(/^\.\//,'');
  assert.ok(fs.existsSync(path.join(root,relative)),relative);
 }
});

test('Estilos mobile e tema escuro permanecem incluídos',()=>{
 for(const sheet of ['mobile-polish.css','mobile-header.css','mobile-drawer.css','revisao-ferias.css']){
  const css=read(sheet);
  assert.match(css,/@media\s*\(/,sheet);
  assert.ok(css.length>1000,sheet);
 }
 assert.match(read('revisao-ferias.css'),/data-theme="dark"/);
});


test('Histórico por visita: linhas clicáveis, percursos reais e registros antigos honestos',()=>{
 const admin=read('admin-config.js');
 const tracker=read('visit-path.js');
 assert.match(admin,/data-admin-open-visit/);
 assert.match(admin,/data-admin-open-presence/);
 assert.match(admin,/data-admin-close-visit/);
 assert.match(admin,/uentzoul_visit_steps/);
 assert.match(admin,/Registro anterior a este recurso/);
 assert.doesNotMatch(admin,/Saída não confirmada/);
 assert.match(admin,/Sessão encerrada/);
 assert.match(admin,/Encerramento estimado por inatividade/);
 assert.match(admin,/Meu teste anônimo/);
 assert.match(tracker,/uentzoul_track_visit/);
 assert.match(tracker,/uentzoul:route/);
 assert.match(tracker,/pagehide/);
 assert.match(tracker,/keepalive:true/);
 assert.doesNotMatch(tracker,/document\.querySelector\(.*message.*textContent/);
 assert.match(read('site-version.js'),/visit-path\.js/);
 assert.match(html,/uentzoulCurrentRoute/);
});

test('Status de visita: ativa, fim registrado e fim estimado sem inventar logout',()=>{
 const admin=read('admin-config.js');
 const match=admin.match(/function visitDetail\(row\)\{[\s\S]*?\n\}/);
 assert.ok(match,'função de histórico localizada');
 const now=Date.parse('2026-11-19T14:00:00.000Z');
 const entry='2026-11-19T13:00:00.000Z';
 const render=(row,steps=[])=>{
  const fn=vm.runInNewContext('('+match[0]+')',{
   visitLoading:false,visitError:'',visitSteps:steps,
   esc:v=>String(v??''),logDate:v=>String(v??''),
   visitTitle:s=>s.kind,deviceDetails:()=>'',Date:class extends Date{static now(){return now}}
  });
  return fn({name:'Visitante',entered_at:entry,...row});
 };
 const recent=render({last_seen_at:'2026-11-19T13:59:00.000Z'});
 assert.match(recent,/Sessão possivelmente ativa/);
 assert.doesNotMatch(recent,/Sessão encerrada/);
 const inactive=render({last_seen_at:'2026-11-19T13:55:00.000Z'});
 assert.match(inactive,/Sessão encerrada/);
 assert.match(inactive,/Encerramento estimado por inatividade/);
 assert.match(inactive,/não de uma saída confirmada/);
 const ended=render({last_seen_at:'2026-11-19T13:59:00.000Z',ended_at:'2026-11-19T13:59:30.000Z'});
 assert.match(ended,/Sessão encerrada/);
 assert.match(ended,/Encerramento registrado pelo sistema/);
 assert.doesNotMatch(ended,/estimado por inatividade/);
 const exited=render({ended_at:'2026-11-19T13:59:30.000Z'},[{kind:'exit',happened_at:'2026-11-19T13:59:30.000Z'}]);
 assert.match(exited,/>exit</);
 assert.doesNotMatch(exited,/Sessão encerrada/,'saída explícita não ganha marcador estimado duplicado');
});

test('Auditoria oficial não infla visitantes e aparece separadamente no LOG',()=>{
 const monitor=read('scripts/site-health.mjs');
 const visits=read('visit-path.js');
 const admin=read('admin-config.js');
 assert.match(monitor,/page\.addInitScript/);
 assert.match(monitor,/__uentzoulSiteHealthAudit/);
 assert.match(visits,/if\(window\.__uentzoulSiteHealthAudit===true\)/);
 assert.match(admin,/async function guestPresenceHeartbeat\(\)\{\s*\/\/[^\n]*\n if\(window\.__uentzoulSiteHealthAudit===true\)return/);
 assert.match(admin,/\['bots','Robôs',''\]/);
 assert.match(admin,/function botLogMarkup\(/);
 assert.match(admin,/actions\/workflows\/site-health\.yml\/runs/);
});

test('LOG mantém rolagem estável em atualizações automáticas e gestos touch',()=>{
 const admin=read('admin-config.js');
 const css=read('admin-config.css');
 assert.match(admin,/function markLogGesture\(/);
 assert.match(admin,/touchmove',markLogGesture/);
 assert.match(admin,/recentlyScrolled/);
 assert.match(admin,/contents\.innerHTML!==markup/);
 assert.match(admin,/list\.scrollTop/);
 assert.match(admin,/updated\.scrollTop=y/);
 assert.doesNotMatch(admin,/scrollIntoView\(/);
 assert.match(css,/\.admin-log-rows\{[^}]*overscroll-behavior-y:contain/);
 assert.match(css,/\.admin-log-rows\{[^}]*-webkit-overflow-scrolling:touch/);
});

test('Safari deve usar WebKit na auditoria de saúde',()=>{
 const monitor=read('scripts/site-health.mjs');
 const workflow=read('.github/workflows/site-health.yml');
 assert.match(monitor,/import \{chromium,webkit,devices\} from 'playwright'/);
 assert.match(monitor,/name:'iphone',engine:'webkit'/);
 assert.match(monitor,/webkit\.launch\(/);
 assert.match(monitor,/engine==='webkit'\?webkitBrowser:chromiumBrowser/);
 assert.match(workflow,/playwright install --with-deps chromium webkit/);
});

test('LOG separa navegação real, entrada simples e registros sem percurso',()=>{
 const admin=read('admin-config.js');
 const match=admin.match(/function classifyVisitActivity\(steps\)\{[\s\S]*?\n\}/);
 assert.ok(match,'classificação compartilhada com o painel administrativo');
 const classify=vm.runInNewContext('('+match[0]+')');
 assert.equal(classify([]),'unknown','registros antigos não podem ser rotulados como saída simples');
 assert.equal(classify([{kind:'entry',section:'home'},{kind:'exit',section:'home'}]),'entryOnly');
 assert.equal(classify([{kind:'entry',section:'home'},{kind:'navigate',section:'home',semester:'2026/2'}]),'entryOnly');
 assert.equal(classify([{kind:'entry',section:'home'},{kind:'navigate',section:'subject',detail:'tcc:docs'}]),'explored');
 assert.equal(classify([{kind:'navigate',section:'home',semester:'2026/1'},{kind:'navigate',section:'home',semester:'2026/2'}]),'explored');
 for(const key of ['explored','entryOnly','unclassified'])assert.match(admin,new RegExp("\\['"+key+"'"));
 assert.match(admin,/\.in\('access_id',ids\)/);
 assert.match(admin,/if\(!isAdmin\(\)\|\|!client\(\)\|\|!ACTIVITY_TABS\.has\(logTab\)/);
});

test('Site só exibe celular na vertical, sem restringir tablets',()=>{
 const js=read('phone-portrait-only.js');
 const css=read('phone-portrait-only.css');
 const version=read('site-version.js');
 const match=js.match(/function isPhoneDevice\(info\)\{[\s\S]*?\n\}/);
 assert.ok(match,'detector de celulares');
 const phone=vm.runInNewContext('('+match[0]+')');
 assert.equal(phone({ua:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',platform:'iPhone',touches:5,shortSide:390}),true);
 assert.equal(phone({ua:'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36',platform:'Linux armv8l',touches:5,shortSide:412}),true);
 assert.equal(phone({ua:'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)',platform:'iPad',touches:5,shortSide:768}),false);
 assert.equal(phone({ua:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Safari/605.1.15',platform:'MacIntel',touches:5,shortSide:768}),false);
 assert.equal(phone({ua:'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 Safari/537.36',platform:'Linux armv8l',touches:5,shortSide:800}),false);
 assert.equal(phone({ua:'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',platform:'Win32',touches:0,coarse:false,shortSide:480}),false);
 assert.match(css,/data-pm-phone-portrait="true"/);
 assert.match(css,/data-pm-phone-landscape="true"/);
 assert.match(js,/orientationchange/);
 assert.match(js,/screen\.orientation\.lock\('portrait'\)/);
 assert.match(version,/phone-portrait-only\.js/);
 assert.match(version,/phone-portrait-only\.css/);
});

test('Tutorial de férias cobre os dois semestres e não muda à força para o primeiro',()=>{
 const tour=read('spotlight-tour.js');
 const loader=read('site-version.js');
 const vacation=read('revisao-ferias.js');
 assert.match(tour,/Revisão de Férias: os dois semestres/);
 assert.match(tour,/Março a Junho/);
 assert.match(tour,/Agosto a Novembro/);
 assert.match(tour,/O primeiro mês já começa aberto/);
 assert.match(tour,/A revisão do 1º e do 2º semestres está liberada/);
 assert.doesNotMatch(tour,/27\/11|segundo ainda está em preparação|temporaryVacationSemester/);
 assert.match(tour,/currentSemester\?\.\(\)===1\?3:8/);
 assert.match(loader,/spotlight-tour\.js\?v=20261116-flicker-fixed-v33/);
 assert.match(vacation,/const MONTHS=\{1:\[3,4,5,6\],2:\[8,9,10,11\]\}/);
});

test('Tutorial móvel usa uma rolagem suave por etapa sem reposicionamento tardio',()=>{
 const tour=read('spotlight-tour.js');
 assert.match(tour,/mobilePositionAttempts>0/);
 assert.match(tour,/runSteps\[index\]\?\.page==='vacation'&&\!q\('#main #vr-root \.vr-months'\)/);
 assert.match(tour,/mobilePositionAttempts=1/);
 assert.match(tour,/window\.scrollTo\(\{top:next,behavior:'instant'\}\)/);
 assert.match(tour,/dataset\.pmTourPreparing='true'/);
 assert.match(tour,/if\(spot\)\{spot\.style\.display='none';spot\.style\.visibility='hidden';\}/,'o destaque anterior deve sumir enquanto a próxima cena é preparada');
 assert.match(tour,/if\(tourMobile&&pendingScroll\)window\.scrollTo/);
 assert.doesNotMatch(tour,/requestAnimationFrame\(\(\)=>requestAnimationFrame\(\(\)=>\{\s*pendingScroll=false/);
});

test('LOG não exibe a própria conta e abre visitas sem reconstruir a lista',()=>{
 const admin=read('admin-config.js');
 assert.match(admin,/presence=\(seen\.data\|\|\[\]\)\.filter\(p=>p\.user_id!==user\(\)\?\.id\)/);
 assert.match(admin,/accessLog=\(events\.data\|\|\[\]\)\.filter\(r=>r\.user_id!==user\(\)\?\.id\)/);
 assert.match(admin,/function logViewKey\(\)\{return \[logTab,logLimit\]/);
 assert.match(admin,/function updateVisitExpansion\(\)/);
 assert.match(admin,/visitLoading=true;updateVisitExpansion\(\)/);
 assert.match(admin,/visitLoading=false;updateVisitExpansion\(\)/);
 const match=admin.match(/function updateVisitExpansion\(\)\{[\s\S]*?\n \}/);
 assert.ok(match,'atualização incremental do detalhe');
 assert.doesNotMatch(match[0],/contents\.innerHTML|list\.innerHTML|scrollIntoView/);
 const expanded={classList:{contains:()=>true},removed:false,remove(){this.removed=true}};
 const row={nextElementSibling:expanded,selection:null,html:'',
  classList:{toggle(_,value){row.selection=value}},
  insertAdjacentHTML(_,markup){row.html=markup}};
 const arrow={textContent:''};
 const button={dataset:{adminOpenVisit:'123'},
  closest:()=>row,setAttribute(){},removeAttribute(){},querySelector:()=>arrow};
 const list={scrollTop:275,scrollLeft:0,querySelectorAll:()=>[button]};
 const context={document:{getElementById:()=>({querySelector:()=>list})},
   accessLog:[{id:123,name:'Visitante anônimo'}],accessRows:()=>[{id:123,name:'Visitante anônimo'}],selectedVisitId:'123',selectedPresenceId:null,
   logRenderTimer:null,visitDetail:()=>'<section class="admin-visit-detail">Percurso</section>',
   updateLogPanel(){throw Error('Não deve reconstruir o LOG')},clearTimeout};
 vm.runInNewContext('('+match[0]+')',context)();
 assert.equal(list.scrollTop,275,'a rolagem original não muda');
 assert.equal(row.selection,true);
 assert.equal(arrow.textContent,'⌃');
 assert.equal(expanded.removed,true);
 assert.match(row.html,/Percurso/);
 // Extras uses a separately paginated collection; it must expand old visits too.
 context.accessLog=[];
 context.accessRows=()=>[{id:123,name:'Visitante anônimo · Mac'}];
 row.selection=null;row.html='';
 vm.runInNewContext('('+match[0]+')',context)();
 assert.equal(row.selection,true);
 assert.equal(list.scrollTop,275);
 assert.match(row.html,/Percurso/);
});

test('LOG identifica tipo de dispositivo, navegador e sistema sem inventar modelo',()=>{
 const tracker=read('visit-path.js'),admin=read('admin-config.js');
 const f=tracker.match(/function deviceInfo\(\)\{[\s\S]*?\n\}\nfunction payload/);
 assert.ok(f,'coletor de informações técnicas da visita');
 const source='('+f[0].replace(/\nfunction payload$/,'')+')()';
 const detect=(ua,platform='iPhone',touches=5,dimensions=[390,844])=>
  vm.runInNewContext(source,{
   navigator:{userAgent:ua,platform,maxTouchPoints:touches,standalone:false,userAgentData:undefined},
   window:{matchMedia:()=>({matches:false})},
   document:{fullscreenElement:null},
   screen:{width:dimensions[0],height:dimensions[1]},
   countryCode:null
  });
 const iphone=detect('Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 Version/26.0 Mobile/15E148 Safari/604.1');
 assert.equal(iphone.kind,'phone');
 assert.equal(iphone.family,'iPhone');
 assert.equal(iphone.browser,'Safari');
 assert.equal(iphone.os,'iOS');
 assert.equal(iphone.os_version,'26.0');
 assert.equal(iphone.width,390);
 const android=detect('Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 Chrome/127.0.0.0 Mobile Safari/537.36','Linux armv8l');
 assert.equal(android.kind,'phone');
 assert.equal(android.family,'Android phone');
 assert.equal(android.browser,'Chrome');
 const ipad=detect('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15','MacIntel',5,[820,1180]);
 assert.equal(ipad.kind,'tablet');
 assert.equal(ipad.family,'iPad');
 const pc=detect('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/127.0.0.0 Safari/537.36','Win32',0,[1920,1080]);
 assert.equal(pc.kind,'desktop');
 assert.equal(pc.family,'Windows PC');
 assert.equal(pc.browser,'Chrome');
 assert.equal(pc.width,1080);
 assert.ok(tracker.includes("p_device:(kind==='navigate'||(kind==='heartbeat'&&countryCode&&!countryApplied))?deviceInfo():null"),'captura país durante navegação ou heartbeat quando disponível');
 assert.match(admin,/\['foreign','Fora do Brasil',''\]/);
 assert.match(tracker,/rpc\('uentzoul_track_visit_device'/);
 assert.match(admin,/ended_at,device_info/);
 assert.match(admin,/deviceSummary\(row\)/);
 assert.match(admin,/deviceDetails\(row\)/);
 assert.match(admin,/Dispositivo não registrado/);
 assert.match(read('site-version.js'),/visit-path\.js\?v=20261115-dispositivos-v4/);
});

test('Tour mobile não pisca ao avançar e voltar nas etapas 6, 9 e 19',()=>{
 const tour=read('spotlight-tour.js');
 const vacation=read('revisao-ferias.js');
 const loader=read('site-version.js');
 const currentScript='spotlight-tour.js?v=20261116-flicker-fixed-v33';
 const currentCSS='spotlight-tour.css?v=20261115-smooth-mobile-v29';
 assert.ok(html.includes(currentScript),'HTML precisa carregar o tutorial corrigido');
 assert.ok(html.includes(currentCSS),'HTML deve usar a mesma versão dos estilos');
 assert.ok(loader.includes(currentScript),'Carregador não pode depender de uma versão antiga');
 assert.ok(loader.includes(currentCSS),'Estilos do carregador devem ser iguais aos do HTML');
 assert.ok(loader.includes('revisao-ferias.js?v=20261116-review-click-stable-v7'));
  assert.ok(html.includes('id="pm-vacation-timeline-js" src="revisao-ferias.js?v=20261116-review-click-stable-v7" defer'));
  assert.ok(html.includes('id="pm-vacation-timeline-css" rel="stylesheet" href="revisao-ferias.css?v=20261116-static-nav-no-flash-v6"'));
 assert.match(tour,/dataset\.pmTourPreparing='true'/);
 assert.match(tour,/dataset\.pmTourPreparing='false'/);
 assert.match(tour,/delete document\.documentElement\.dataset\.pmTourPreparing/);
 assert.match(tour,/layout\(scrollTarget=false\)\{\s*if\(!active\|\|!shell\|\|shell\.hidden\|\|document\.documentElement\.dataset\.pmTourPreparing==='true'\)return/);
 assert.match(tour,/setTimeout\(\(\)=>\{if\(active&&serial===stepSerial\)layout\(false\)\},270\)/);
 assert.doesNotMatch(tour,/window\.scrollTo\(\{top:next,behavior:reduced\?'instant':'smooth'\}\)/);
 const match=tour.match(/function positionMobileTarget\(node\)\{[\s\S]*?\n\}/);
 assert.ok(match,'posicionamento de celular');
 const ctx={
  tourScene:()=>'',mobilePositionAttempts:0,mobileScrollSerial:0,
  mobileShowcase:()=>({top:50,bottom:520}),
  targetVisualBounds:()=>({top:620,height:100}),
  originalIndex:()=>8,
  clamp:(n,min,max)=>Math.max(min,Math.min(max,n)),
  document:{documentElement:{scrollHeight:3000}},
  innerHeight:844,
  window:{scrollY:100,scrollTo(args){ctx.lastScroll=args;ctx.scrollCalls=(ctx.scrollCalls||0)+1;ctx.window.scrollY=args.top;}}
 };
 const position=vm.runInNewContext('('+match[0]+')',ctx);
 position({});
 assert.equal(ctx.scrollCalls,1,'apenas um ajuste de posição por etapa');
 assert.equal(ctx.lastScroll.behavior,'instant','sem animação que faz a tela oscilar');
 position({});
 assert.equal(ctx.scrollCalls,1,'nenhuma correção tardia ao atualizar o destaque');
 assert.match(vacation,/tourCache\?\.semester===selectedSemester/);
 assert.match(vacation,/Date\.now\(\)-tourCache\.savedAt<120000/);
 assert.match(vacation,/if\(snapshot\)\{updateNavStatus\(\);return;\}/);
 assert.match(vacation,/classList\.contains\('pm-tour-running'\)\?'':'<div class="vr-private"/);
});


test('Caderno abre para contas registradas e mantém anotações privadas',()=>{
 const loader=read('site-version.js');
 const notebook=read('caderno.js');
 const markup=read('caderno.html');
 const styles=read('caderno.css');
 assert.match(loader,/navCadernoPreview/);
 assert.match(loader,/const loggedIn=\(\)=>!!account\(\)/);
 assert.match(loader,/button\.hidden=false/,'botão fica visível para visitantes desde a abertura');
 assert.match(loader,/button\.disabled=unavailable/,'botão desativado no celular ou para cargo exclusivo Concursos');
 assert.match(loader,/if\(!loggedIn\(\)\)\{/,'acesso solicita conta quando não autenticado');
 const siteMarkup=read('index.html');
 assert.match(siteMarkup,/id="navCadernoPreview"\s+aria-label="Caderno/,'botão público desde o primeiro paint');
  assert.doesNotMatch(siteMarkup,/id="navCadernoPreview"\s+disabled/,'visitantes podem clicar para entrar ou cadastrar');
  assert.doesNotMatch(siteMarkup,/<span class="nav-label">Caderno<\/span><span class="nb-preview-label">Em breve<\/span>/);
 assert.doesNotMatch(siteMarkup,/id="navCadernoPreview"\s+style="visibility:hidden"/);
 assert.match(loader,/data-page="exams"/);
 assert.match(loader,/caderno\.html\?v=/);
 assert.match(markup,/name="robots" content="noindex, nofollow"/);
 assert.match(markup,/src="caderno\.js\?v=/);
 assert.match(notebook,/if\(user\?\.id&&user\.is_anonymous!==true\)userId=String\(user\.id\)/);
 assert.match(notebook,/uentzoul:caderno:alpha1:/);
 assert.match(notebook,/functions\.invoke\('caderno-revisao'/);
 assert.match(notebook,/const hit=findStrokeNear\(p\)/);
 assert.match(notebook,/tapCandidate/);
 assert.match(notebook,/const defaults=\(\)=>\(\{books:initialBooks\(\)/);
 assert.match(styles,/\.nb-sheet\{/);
 assert.match(styles,/\.nb-sticky\{/);
 assert.doesNotMatch(notebook,/\.from\(['"]uentzoul_(?:messages|progress|profiles|exams)/);
});


test('Celular mostra o Caderno em cinza e bloqueado, enquanto tablet/desktop mantêm acesso',()=>{
 const loader=read('site-version.js'),app=read('caderno.js'),site=read('index.html');
 assert.match(loader,/window\.PSICO_NOTEBOOK_IS_PHONE=isNotebookPhone/);
 assert.match(loader,/button\.disabled=unavailable/);
 assert.match(loader,/button\.classList\.toggle\('nb-phone-locked',phone\)/);
 assert.match(loader,/if\(isNotebookPhone\(\)\)return;/);
 assert.match(loader,/nb-phone-locked\{opacity:\.52!important/);
 assert.match(loader,/button\.setAttribute\('aria-disabled',String\(unavailable\)\)/);
 assert.match(loader,/Caderno disponível somente em computador ou tablet/);
 assert.match(app,/if\(isNotebookPhone\(\)\)\{/);
 assert.match(app,/Caderno indisponível no celular/);
 assert.match(site,/#nav #navCadernoPreview\.nb-phone-locked:disabled\{opacity:\.52!important/);
});

test('Tutorial do Caderno apresenta ferramentas sem escrever nas notas',()=>{
 const tutorial=read('caderno-tutorial.js'),notebook=read('caderno.js');
 const html=read('caderno.html'),css=read('caderno.css'),loader=read('site-version.js');
 assert.match(notebook,/data-nb-tour-start/);
 assert.match(tutorial,/nb-tour-card/);
 assert.match(tutorial,/document\.body\.appendChild\(overlay\)/);
 assert.match(tutorial,/if\(active&&event\.key==='Escape'\)/);
 assert.match(tutorial,/data-nb-action="backToBooks"/);
 for(const feature of ['Escrever','Selecionar','Desenhar','Ajustar traços','Borracha',
  'Post-its','Moldar desenhos','PDF','zoom','atalhos']){
  assert.ok(tutorial.includes(feature),'ausência no tutorial: '+feature);
 }
 assert.match(html,/src="caderno-tutorial\.js\?v=/);
 assert.match(css,/\.nb-shelf-tutorial-button\{/);
 assert.match(notebook,/from\('uentzoul_notebooks'\)\.upsert/);
 assert.match(notebook,/\.select\('content,client_modified_at'\)/);
 assert.match(notebook,/backup-before-cloud/);
 assert.match(loader,/uentzoulAIAuth\?\.openLogin/);
});

test('Caderno ajusta círculo, retângulo e linhas sem confundir as formas',()=>{
 const source=read('caderno.js');
 const start=source.indexOf('function dist(a,b)');
 const end=source.indexOf('function paintStroke(');
 assert.ok(start>=0&&end>start,'implementação de formas extraída para teste');
 const perfectShape=vm.runInNewContext('(()=>{'+source.slice(start,end)+';return perfectShape;})()');
 const circle=Array.from({length:70},(_,i)=>{
  const angle=i/69*2*Math.PI;
  return {x:300+62*Math.cos(angle)+Math.sin(angle*7)*2.1,
          y:400+60*Math.sin(angle)+Math.sin(angle*5)*1.8};
 });
 const rect=[
  ...Array.from({length:25},(_,i)=>({x:300+i*4,y:330})),
  ...Array.from({length:23},(_,i)=>({x:396,y:330+i*4})),
  ...Array.from({length:25},(_,i)=>({x:396-i*4,y:418})),
  ...Array.from({length:23},(_,i)=>({x:300,y:418-i*4}))
 ];
 const line=Array.from({length:45},(_,i)=>({x:100+i*5,y:230+i*.6+Math.sin(i*2)*1.8}));
 const curve=Array.from({length:45},(_,i)=>({x:100+i*5,y:230+Math.sin(i/12)*35+Math.sin(i*2)*1.8}));
 assert.equal(perfectShape(circle).kind,'circle');
 assert.equal(perfectShape(rect).kind,'rectangle');
 assert.equal(perfectShape(line).kind,'line');
 assert.equal(perfectShape(curve).kind,'curve');
});


test('Ajuste inteligente do caderno reconhece meia-lua e não destrói desenhos livres',()=>{
 const source=read('caderno.js'),pdf=read('caderno-pdf.js');
 const start=source.indexOf('function dist(a,b)'),end=source.indexOf('function paintStroke(');
 assert.ok(start>=0&&end>start);
 const {smartStroke}=vm.runInNewContext('(()=>{const W=780,H=1240;const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));'+
  source.slice(start,end)+';return {smartStroke};})()');
 const arc=Array.from({length:115},(_,i)=>{
  const a=-Math.PI+Math.PI*i/114;
  return {x:310+110*Math.cos(a)+Math.sin(i*1.2)*3.5,y:410+110*Math.sin(a)+Math.cos(i*2.1)*3.5};
 });
 const line=Array.from({length:75},(_,i)=>({x:125+5*i,y:210+i*.3+Math.sin(i*2)*2}));
 const circle=Array.from({length:115},(_,i)=>{
  const a=2*Math.PI*i/114;return{x:350+90*Math.cos(a)+Math.sin(i*1.3)*2,y:410+90*Math.sin(a)+Math.cos(i*1.7)*2};
 });
 const triangle=[[140,140],[390,155],[240,375]].flatMap((a,i,v)=>{
  const b=v[(i+1)%v.length];
  return Array.from({length:36},(_,j)=>{
   const t=j/36;return{x:a[0]+(b[0]-a[0])*t+Math.sin(j*1.5),y:a[1]+(b[1]-a[1])*t+Math.cos(j*1.2)};
  });
 });
 const wave=Array.from({length:160},(_,i)=>({x:110+i*2.4,
  y:420+45*Math.sin(i/11)+25*Math.sin(i/4)+Math.sin(i*1.7)*2}));
 const corrected=smartStroke(arc);
 assert.equal(corrected.kind,'arc','meia-lua irregular vira arco circular');
 const center={x:310,y:410};
 const radii=corrected.points.map(p=>Math.hypot(p.x-center.x,p.y-center.y));
 const average=radii.reduce((sum,v)=>sum+v,0)/radii.length;
 const variance=radii.reduce((sum,v)=>sum+(v-average)**2,0)/radii.length;
 assert.ok(Math.sqrt(variance)<1,'arco com raio consistente');
 assert.equal(smartStroke(circle).kind,'circle');
 assert.equal(smartStroke(line).kind,'line');
 assert.equal(smartStroke(triangle).kind,'polygon');
 assert.equal(smartStroke(wave).kind,'fluid','traço complexo não vira círculo/linha');
 assert.match(source,/data\.smooth\?smartStroke\(raw\)/);
 assert.match(source,/const r=smartStroke\(item\.points\)/);
 assert.ok(source.includes("!['line','polygon','rectangle'].includes(s.kind)"),'arestas retas no canvas');
 assert.ok(pdf.includes("!['line','polygon','rectangle'].includes(stroke.kind)"),'arestas retas no PDF');
 assert.match(read('caderno.html'),/caderno\.js\?v=[a-z0-9-]+/,'caderno carrega versão explícita do editor');
 assert.match(read('site-version.js'),/caderno\.html\?v=[a-z0-9-]+/,'navegação carrega versão explícita do caderno');
});

test('Caderno remove a seta superior sem alterar a navegação restante',()=>{
 const script=read('caderno.js'),styles=read('caderno.css');
 assert.doesNotMatch(script,/nb-corner-back/,'não renderizar nem manipular a seta superior');
 assert.doesNotMatch(styles,/nb-corner-back/,'sem CSS restante da seta');
 assert.match(script,/data-nb-action="prev">‹ Anterior/,'botão inferior Anterior preservado');
 assert.match(script,/data-nb-action="next">Próxima ›/,'botão inferior Próxima preservado');
 assert.match(script,/id="nbPageRail"/,'lista lateral de páginas preservada');
 assert.match(script,/data-nb-action="backToBooks"/,'retorno para capas preservado');
});

test('Caderno permanece aberto durante atualizações assíncronas de outras seções',()=>{
 const loader=read('site-version.js');
 assert.match(html,/if\(window\.PSICO_NOTEBOOK_ACTIVE\?\.\(\)&&document\.getElementById\('uentzoulCadernoFrame'\)\)return;/);
 assert.match(html,/window\.PSICO_NOTEBOOK_CLOSE\?\.\(\);/);
 assert.match(loader,/window\.PSICO_NOTEBOOK_CLOSE=deactivate;/);
 assert.match(loader,/if\(previewOpen\)deactivate\(\);/);
});


test('Scripts e estilos locais referenciados no HTML existem',()=>{
 const resources=[...html.matchAll(/<(script|link)\b[^>]+\b(?:src|href)=["']([^"']+)["']/gi)];
 const local=resources.map(m=>m[2])
  .filter(url=>/\.(?:js|css)(?:[?#]|$)/i.test(url))
  .filter(url=>!/^https?:|^\/\/|^data:|^\//i.test(url))
  .map(url=>url.split(/[?#]/)[0].replace(/^\.\//,''));
 assert.ok(local.length>=35,'Site precisa carregar os módulos');
 for(const file of local)assert.ok(fs.existsSync(path.join(root,file)),'Arquivo local ausente: '+file);
});

test('Carregador do Caderno atualiza sua versão de cache no HTML',()=>{
 const loader=read('site-version.js');
 const entry=html.match(/site-version\.js\?v=([^"']+)/);
 const notebook=loader.match(/caderno\.html\?v=([^&"']+)/);
 assert.ok(entry&&notebook,'Versões do carregador e do Caderno devem existir');
 assert.equal(entry[1],notebook[1],'Atualizações do Caderno precisam invalidar o cache do carregador');
});

test('Caderno não expõe o iframe branco antes de carregar',()=>{
 const loader=read('site-version.js');
 assert.match(loader,/opacity:0;visibility:hidden/,'iframe permanece oculto durante o primeiro carregamento');
 assert.match(loader,/nb-frame-ready\{opacity:1;visibility:visible/,'o caderno só aparece quando pronto');
 assert.match(loader,/frame\.addEventListener\('load'/,'aguarda o carregamento do caderno');
 assert.match(loader,/doc\.readyState!==['"]complete['"]/,'aguarda conteúdo completo');
 assert.match(loader,/frame\.classList\.remove\('nb-frame-ready'\)/,'oculta novamente antes de trocar semestre');
 assert.match(html,/site-version\.js\?v=[a-z0-9-]+/,'carregamento da versão atualizada');
});

test('Revisão de Férias: clique delegado, botão destravado e sem fade global',()=>{
 const review=read('revisao-ferias.js');
 assert.match(review,/if\(b\.disabled\)b\.disabled=false/);
 assert.match(review,/removeAttribute\('aria-disabled'\)/);
 assert.match(review,/removeAttribute\('inert'\)/);
 assert.match(review,/event\.target\?\.closest\?\.\('#navVacationReview'\)/);
 assert.match(review,/if\(visible&&semester===selectedSemester&&document\.getElementById\('vr-root'\)\)/);
 assert.doesNotMatch(read('revisao-ferias.css'),/animation:vr-page-enter\s*\.\d/);
});


test('Pacotes pessoais mantêm biblioteca por conta e links seguros do Sticker.ly',()=>{
 const js=read('chat-sticker-personal.js'),css=read('chat-sticker-personal.css');
 assert.match(html,/chat-sticker-personal\.js\?v=/);
 assert.match(html,/chat-sticker-personal\.css\?v=/);
 for(const term of [/data-pm-sticker-add/,/data-pm-pack-import/,/data-pm-pack-upload/,/uentzoul_sticker_packs/,/uentzoul_stickers/,/owner_id/,/stickerly-pack/,/source_type:'upload'/,/enabled:false/])assert.match(js,term);
 assert.match(css,/max-width:600px/);
 assert.doesNotThrow(()=>new vm.Script(js));
 const parser=js.match(/function codeFrom\(text\)\{[\s\S]*?\n\}/)?.[0];
 assert.ok(parser);
 const parse=vm.runInNewContext('('+parser+')',{URL});
 assert.equal(parse('A3ZA4F'),'A3ZA4F');
 assert.equal(parse('https://sticker.ly/s/A3ZA4F'),'A3ZA4F');
 assert.equal(parse('https://sticker.ly/s/A3ZA4F/'),'A3ZA4F');
 assert.equal(parse('https://not-sticker.ly/s/A3ZA4F'),'');
 assert.equal(parse('javascript:alert(1)'),'');
});


test('Detecção diferencia iPhone, iPad e tela MacIntel sensível ao toque',()=>{
 const loader=read('site-version.js');
 const start=loader.indexOf('function isNotebookPhone(){');
 const end=loader.indexOf(' // Mesma regra para o botão da navegação',start);
 assert.ok(start>=0&&end>start);
 const func=loader.slice(start,end).trim();
 const detect=(ua,short,platform='MacIntel',touches=5,mobile=false)=>{
  const phone=vm.runInNewContext('('+func+')',{
   navigator:{userAgent:ua,platform,maxTouchPoints:touches,userAgentData:{mobile}},
   screen:{width:short,height:short*2},
   window:{matchMedia:()=>({matches:touches>0})}
  });
  return phone();
 };
 assert.equal(detect('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0) Mobile Safari',390),true);
 assert.equal(detect('Mozilla/5.0 (iPad; CPU OS 18_0) Mobile Safari',834),false);
 assert.equal(detect('Mozilla/5.0 (Macintosh; Intel Mac OS X) Safari',390),true);
 assert.equal(detect('Mozilla/5.0 (Macintosh; Intel Mac OS X) Safari',900),false);
 assert.match(read('caderno.js'),/if\(\/iPhone\|iPod\|Windows Phone\|IEMobile\/i\.test\(ua\)\)return true/);
});


test('Revisão dos simulados mantém identificadores e exige conhecimento da disciplina',()=>{
 const match=html.match(/<script id="dataset" type="application\/json">([\s\S]*?)<\/script>/);
 assert.ok(match,'Banco de questões da página principal disponível');
 const original=JSON.parse(match[1]);
 assert.equal(original.exams.length,30,'Provas anteriores não podem ser apagadas');
 assert.ok(original.exams.some(x=>x.id==='familia-1'));
 assert.ok(original.exams.some(x=>x.id==='familia-5'));
 const preserved=original.exams.filter(e=>e.subject!=='meta');
 const oldIDs=preserved.map(e=>e.id);
 const oldQuestionIds=preserved.map(e=>e.questions.map(q=>q.id));
 assert.match(html,/store\.results\[e\.id\]/,'Progresso continua indexado pelo mesmo ID');
 assert.match(html,/doneBox\('sim:'\+e\.id/,'Marcações de visto continuam ligadas ao mesmo ID');
 assert.doesNotMatch(html,/Sentir vergonha uma vez é suficiente para confirmar um esquema persistente/);
 const defectividade=original.topics.tcc.find(t=>t.title==='Defectividade e vergonha');
 assert.match(defectividade.myth,/crença.+próprio valor/,'O erro exige conhecer a formulação de defectividade/vergonha');
 const socialSrc=read('psicomoodle-new-content.js');
 const socialMatch=socialSrc.match(/const DATA=(\{[\s\S]*?\});\s*\n/);
 assert.ok(socialMatch);
 const social=JSON.parse(socialMatch[1]).social;
 assert.equal(social.length,18);
 assert.doesNotMatch(social.map(t=>t.myth).join(' '),/assegura automaticamente igualdade|sem relação com pessoas ou poder/);
 const runtime={window:{PSICOMOODLE_NEW_CONTENT:{social}}};
 vm.runInNewContext(read('estudos-dirigidos-meta.js'),runtime);
 vm.runInNewContext(read('metapsicologia-p2-pratica.js'),runtime);
 vm.runInNewContext(read('avaliacao-p3-pratica.js'),runtime);
 vm.runInNewContext(read('simulados-finais-2026.js'),runtime);
 vm.runInNewContext(read('simulados-grupos-filme-2026.js'),runtime);
 runtime.window.PSICO_FINAL_EXAMS.apply(original);
 const kept=original.exams.filter(e=>oldIDs.includes(e.id));
 assert.deepEqual(kept.map(e=>e.id),oldIDs,'IDs das provas anteriores de Família e demais disciplinas não são trocados');
 assert.deepEqual(kept.map(e=>e.questions.map(q=>q.id)),oldQuestionIds,
  'IDs das questões antigas permanecem intactos');
 const current=['tcc','familia','meta','grupos','social','avaliacao'].flatMap(subject=>{
  const ctrl=runtime.window.PSICO_FINAL_EXAMS;
  const revision=subject==='familia'?ctrl.familyVersion:subject==='meta'?ctrl.metaVersion:
   subject==='grupos'?ctrl.groupVersion:subject==='social'?ctrl.socialVersion:subject==='avaliacao'?ctrl.evaluationVersion:ctrl.version;
  return original.exams.filter(e=>e.subject===subject&&e.final2026&&e.revision===revision);
 });
 assert.equal(current.length,30,'Cinco simulados por cada uma das seis disciplinas');
 for(const subject of ['tcc','familia','meta','grupos','social','avaliacao']){
  const exams=current.filter(e=>e.subject===subject);
  assert.equal(exams.length,5,subject);
  for(const exam of exams){
   assert.equal(exam.questions.length,subject==='grupos'?2:15,'Formato atual: '+exam.id);
   assert.equal(new Set(exam.questions.map(q=>q.id)).size,exam.questions.length,'IDs únicos');
   for(const q of exam.questions){
    if(q.type==='choice'||q.type==='combo')assert.ok(q.answer>=0&&q.answer<q.options.length,q.id);
   }
  }
 }
 assert.equal(current.filter(e=>e.id==='social-rev-provas-equivalentes-20261113-1').length,1,'Preserva versão realizada');
 assert.equal(runtime.window.PSICO_FINAL_EXAMS.curated(original,'social').length,49);
 assert.ok(current.filter(e=>e.subject==='social'&&e.model>1).every(e=>e.id.startsWith('social-rev-social-fontes-completas-20261125-v1-')));
 assert.ok(current.filter(e=>e.subject==='familia').every(e=>e.id.startsWith('familia-rev-provas-equivalentes-20261113-')));
 assert.equal(current.reduce((sum,e)=>sum+e.questions.length,0),385,'Questões da revisão atual');
 for(const e of current.filter(x=>x.subject!=='familia')){
  const brief=e.questions.filter(q=>/^Situação breve:|^Uma situação do filme/i.test(q.prompt||''));
  if(e.id!=='social-rev-provas-equivalentes-20261113-1')assert.equal(brief.length,e.subject==='meta'||e.subject==='grupos'?0:1,'Situações breves: '+e.id);
  if(e.subject==='grupos'){
   assert.equal(e.questions.length,2,'Duas questões por simulado de Grupos');
   assert.ok(e.questions.every(q=>q.type==='essay'),'Grupos tem somente dissertativas');
   assert.match(e.questions[0].concept,/Moreno/,'Primeira questão: Moreno');
   assert.match(e.questions[1].concept,/Rogers/,'Segunda questão: Rogers');
   assert.ok(e.questions.every(q=>/Escritores da Liberdade/.test(q.prompt)),'Ambas relacionadas ao filme');
  }
  if(e.subject==='social'){
   const preserved=e.id==='social-rev-provas-equivalentes-20261113-1';
   assert.equal(e.questions.filter(q=>q.type==='essay').length,preserved?2:1,'Social mantém o formato original do primeiro simulado e uma dissertativa nos novos');
   if(!preserved)assert.ok(e.questions.some(q=>/racial|subjetiv|digital|branqueamento|tecnologia|vivência|economicismo/i.test(q.concept)),'Novas fontes presentes');
  }
 }
 assert.match(html,/subject==='familia'\?window\.PSICO_FINAL_EXAMS\?\.familyVersion/,'Família mantém revisão anterior');
 const meta=current.filter(e=>e.subject==='meta');
 assert.ok(meta.every(e=>!e.questions.some(q=>/ang[uú]sti/i.test(JSON.stringify(q)))));
 assert.ok(current.some(e=>e.questions.some(q=>q.type==='combo'&&q.assertions.some(a=>/esquema inicial desadaptativo de crenças intermediárias/.test(a.text)))),
  'Distrator revisado compara conceitos próximos');
});

test('Revisão do primeiro semestre preserva números dos simulados e o banco de fontes',()=>{
 const src=read('primeiro-semestre-dados.js'),raw=JSON.parse(src.split('window.PSICO_FIRST_SEM_DATA=')[1].replace(/;\s*$/,''));
 assert.equal(Object.keys(raw).length,7);
 for(const arr of Object.values(raw)){
  assert.ok(arr.length>=14);
  assert.ok(arr.every(topic=>topic.length===5&&Number.isInteger(topic[4])));
 }
 const win={PSICO_FIRST_SEM_DATA:raw,PSICO_FIRST_SEM_SOURCES:{}};
 vm.runInNewContext(read('primeiro-semestre-relembrar.js'),{window:win});
 const db={topics:{},exams:[]};
 win.PSICO_FIRST_SEMESTER.apply(db);
 assert.equal(db.exams.length,35,'Cinco simulados nas sete matérias');
 assert.ok(db.exams.every(e=>e.questions.length===12));
 assert.equal(new Set(db.exams.map(e=>e.id)).size,35);
 const ids=db.exams.map(e=>e.id);
 win.PSICO_FIRST_SEMESTER.apply(db);
 assert.deepEqual(db.exams.map(e=>e.id),ids,'Não duplicar IDs nem reiniciar progresso');
 assert.ok(db.exams.every(e=>e.id.startsWith('relembrar-2026-1-')));
});


test('Alternativas dos 13 cursos são relevantes, únicas e só revelam a melhor hipótese após a escolha',()=>{
 const raw=JSON.parse(html.match(/<script id="dataset" type="application\/json">([\s\S]*?)<\/script>/)[1]);
 const content=read('psicomoodle-new-content.js');
 const social=JSON.parse(content.match(/const DATA=(\{[\s\S]*?\});\s*\n/)[1]).social;
 const runtime={window:{PSICOMOODLE_NEW_CONTENT:{social}}};
 vm.runInNewContext(read('estudos-dirigidos-meta.js'),runtime);
 vm.runInNewContext(read('metapsicologia-p2-pratica.js'),runtime);
 vm.runInNewContext(read('avaliacao-p3-pratica.js'),runtime);
 vm.runInNewContext(read('simulados-finais-2026.js'),runtime);
 vm.runInNewContext(read('simulados-grupos-filme-2026.js'),runtime);
 runtime.window.PSICO_FINAL_EXAMS.apply(raw);
 const current=['tcc','familia','meta','grupos','social','avaliacao'].flatMap(subject=>{
  const ctrl=runtime.window.PSICO_FINAL_EXAMS;
  const revision=subject==='familia'?ctrl.familyVersion:subject==='meta'?ctrl.metaVersion:
   subject==='grupos'?ctrl.groupVersion:subject==='social'?ctrl.socialVersion:subject==='avaliacao'?ctrl.evaluationVersion:ctrl.version;
  const exams=raw.exams.filter(e=>e.subject===subject&&e.final2026&&e.revision===revision);
  assert.equal(exams.length,5,'Cinco simulados de '+subject);
  return exams;
 });
 assert.equal(current.length,30);
 assert.equal(current.reduce((n,e)=>n+e.questions.length,0),385);
 for(const e of current){
  assert.equal(new Set(e.questions.map(q=>q.id)).size,e.questions.length,'IDs únicos: '+e.id);
  for(const q of e.questions){
   if(e.subject==='meta')assert.doesNotMatch(JSON.stringify(q),/ang[uú]sti/i,'Sem angústia no recorte P2');
   if(q.type==='choice'||q.type==='combo'){
    assert.ok(q.answer>=0&&q.answer<q.options.length,'Gabarito válido: '+q.id);
    const labels=q.options.map(o=>typeof o==='string'?o:o.text);
    assert.equal(new Set(labels).size,labels.length,'Alternativas repetidas: '+q.id);
    if(q.type==='choice')assert.ok(labels.every(v=>v?.trim()?.length>18),'Alternativa vazia ou caricatural: '+q.id);
   }
   if(q.type==='choice'){
    assert.equal(q.options.filter(o=>o.correct===true).length,1,'Uma única melhor resposta: '+q.id);
    assert.equal(q.answer,q.options.findIndex(o=>o.correct===true),'Gabarito sincronizado: '+q.id);
   }
   if(q.type==='combo'){
    assert.equal(q.assertions.filter(a=>a.truth).length,3,'Três assertivas corretas: '+q.id);
    assert.deepEqual(Array.from(q.correct),Array.from(q.assertions.filter(a=>a.truth).map(a=>a.l)),'Combinação coerente: '+q.id);
   }
  }
 }
 const active={window:{PSICO_CASES:{}}};
 for(const name of ['estudos-casos-data.js','casos-act-social.js','casos-finais-2026.js'])
  vm.runInNewContext(read(name),active);
 const firstData=JSON.parse(read('primeiro-semestre-dados.js').split('window.PSICO_FIRST_SEM_DATA=')[1].replace(/;\s*$/,''));
 const first={PSICO_FIRST_SEM_DATA:firstData,PSICO_FIRST_SEM_SOURCES:{}};
 vm.runInNewContext(read('primeiro-semestre-relembrar.js'),{window:first});
 const firstDB={topics:{},exams:[]};first.PSICO_FIRST_SEMESTER.apply(firstDB);
 assert.equal(firstDB.exams.length,35);
 assert.equal(firstDB.exams.reduce((n,e)=>n+e.questions.length,0),420);
 for(const e of firstDB.exams)for(const q of e.questions)if(q.type==='choice'){
  assert.equal(new Set(q.options.map(o=>o.text)).size,q.options.length,'Simulado do 1º semestre sem repetição: '+q.id);
  assert.ok(q.options[q.answer],'Gabarito do 1º semestre: '+q.id);
 }
 Object.assign(active.window.PSICO_CASES,first.PSICO_CASES);
 const cases=Object.values(active.window.PSICO_CASES).flat();
 assert.equal(cases.length,52,'Todos os estudos de caso preservados, incluindo os novos casos P3');
 const positions=[0,0,0];let stages=0;
 for(const c of cases)for(const [i,stage] of c.stages.entries()){
  stages++;
  assert.equal(stage.choices.length,3,'Três alternativas no caso: '+c.id+'/'+i);
  assert.equal(new Set(stage.choices.map(o=>o.label)).size,3,'Sem duplicatas: '+c.id+'/'+i);
  assert.ok(stage.choices.every(o=>o.label&&o.reason&&o.outcome),'Feedback para cada hipótese');
  const best=stage.choices.filter(o=>o.best===true);
  assert.equal(best.length,1,'Uma melhor hipótese identificada: '+c.id+'/'+i);
  positions[stage.choices.findIndex(o=>o.best===true)]++;
  assert.ok(stage.choices.every(o=>o.label.length>=45),'Respostas fundamentadas e não caricatas: '+c.id+'/'+i);
  assert.doesNotMatch(stage.choices.map(o=>o.label).join(' '),
   /afirmar que ela tem um transtorno apenas pelo relato|pedir que ela simplesmente pare de pensar|concluir que o adolescente é responsável pela recuperação/i);
 }
 assert.equal(stages,104,'As duas decisões de cada estudo foram preservadas');
 assert.ok(positions.every(n=>n>=15),'Não entregar gabarito pela posição fixa: '+positions.join('/'));
 assert.match(read('estudo-ativo.js'),/strongest=st\.choices\.findIndex\(option=>option\.best===true\)/);
 assert.match(read('estudo-ativo.js'),/s\.chosen<0\?'':/,'A resposta só aparece depois da escolha');
 const begin=html.indexOf('<section id="offline-simulados">'),end=html.indexOf('</section>',begin);
 const offline=html.slice(begin,end);
 assert.equal((offline.match(/<summary>Questão \d+/g)||[]).length,385,'Leitura offline corresponde às provas atuais');
 assert.doesNotMatch(offline,/ang[uú]stia/i,'Não reintroduzir angústia na leitura de Metapsicologia');
});


test('Avaliação Psicológica P3 mantém 21 tópicos, uma única correta e provas variadas',()=>{
 const runtime={window:{},document:{addEventListener:()=>{},querySelector:()=>null,querySelectorAll:()=>[]}};
 vm.runInNewContext(read('avaliacao-p3-pratica.js'),runtime);
 const topics=runtime.window.PSICO_AVALIACAO_P3_PRACTICE?.topics;
 assert.equal(topics?.length,21,'Banco P3 segue estudo dirigido docente de 21 itens');
 assert.equal(new Set(topics.map(x=>x.title)).size,21,'Tópicos P3 sem repetição');
 assert.ok(topics.every(x=>x.question&&x.explanation&&x.whyWrong&&x.distractors.length===4));
 assert.deepEqual(topics.reduce((acc,t)=>(acc[t.section]=(acc[t.section]||0)+1,acc),{}),{
  'PARTE I – ENTREVISTA DE DEVOLUÇÃO':3,
  'PARTE II – AVALIAÇÃO PSICOLÓGICA ORGANIZACIONAL':4,
  'PARTE III – AVALIAÇÃO PSICOLÓGICA NO CONTEXTO HOSPITALAR E COM PACIENTES TRANS':6,
  'PARTE IV – PERÍCIA PSICOLÓGICA':3,
  'PARTE V – ÉTICA NA AVALIAÇÃO PSICOLÓGICA':5
 });
 vm.runInNewContext(read('simulados-finais-2026.js'),runtime);
 const db={subjects:{avaliacao:{}},topics:{avaliacao:[]},exams:[]};
 runtime.window.PSICO_FINAL_EXAMS.apply(db);
 assert.equal(db.topics.avaliacao.length,21,'A revisão recebe os 21 tópicos');
 const version=runtime.window.PSICO_FINAL_EXAMS.evaluationVersion;
 const exams=db.exams.filter(e=>e.revision===version);
 assert.equal(exams.length,5);
 assert.ok(exams.every(e=>e.questions.length===15));
 for(const exam of exams){
  assert.equal(exam.questions.filter(q=>q.type==='essay').length,2,'Duas dissertativas do roteiro P3');
  assert.equal(exam.questions.filter(q=>(q.prompt||'').startsWith('Situação breve:')).length,1,'Um caso curto por simulado');
  for(const q of exam.questions){
   if(q.type==='choice'){
    assert.equal(q.options.length,5);
    assert.equal(new Set(q.options.map(o=>o.text)).size,5,'Alternativas exclusivas do mesmo assunto');
    assert.ok(q.options.every(o=>o.text.length>60&&o.why?.length>80));
    assert.equal(q.options.filter(o=>o.correct).length,1);
    assert.equal(q.options[q.answer].correct,true);
   }
   if(q.type==='combo'){
    assert.equal(q.assertions.length,5);
    assert.equal(q.assertions.filter(x=>x.truth).length,3);
    assert.equal(q.options[q.answer],'Apenas '+q.correct.join(', ')+'.');
   }
   if(q.type==='essay')assert.ok(q.model?.length>200,'Resposta-modelo extensa e explicativa');
  }
 }
 vm.runInNewContext(read('revisao-erros.js'),runtime);
 for(const t of topics){
  const affirm=runtime.window.PSICO_REVIEW_ERRORS.affirmations('avaliacao',t);
  assert.equal(affirm.correct,t.definition);
  assert.equal(affirm.incorrect,t.myth);
 }
 vm.runInNewContext(read('estudo-ativo.js'),runtime);
 runtime.window.PSICO_PRACTICE.flashcards('avaliacao',topics,'2026/2');
 assert.equal(runtime.window.PSICO_PRACTICE.flashTutorialState('avaliacao').count,21);
 const i=html.indexOf('<article id="offline-avaliacao"'),j=html.indexOf('</article>',i);
 assert.ok(i>0&&j>i);
 const offline=html.slice(i,j);
 assert.equal((offline.match(/<strong>Conceito:/g)||[]).length,21,'Versão offline reflete a P3');
 assert.match(html,/subject==='avaliacao'\?window\.PSICO_FINAL_EXAMS\?\.evaluationVersion/);
});


test('Metapsicologia P2 usa exatamente as 28 perguntas em simulados, flashcards e revisão',()=>{
 const runtime={window:{},document:{addEventListener:()=>{},querySelector:()=>null,querySelectorAll:()=>[]}};
 vm.runInNewContext(read('estudos-dirigidos-meta.js'),runtime);
 vm.runInNewContext(read('metapsicologia-p2-pratica.js'),runtime);
 const bank=runtime.window.PSICO_META_P2_PRACTICE?.topics;
 assert.equal(bank?.length,28,'Banco único do roteiro P2');
 assert.deepEqual(bank.reduce((a,q)=>(a[q.section]=(a[q.section]||0)+1,a),{}),
  {'Segunda tópica':9,'Édipo':12,'Pulsão':7});
 assert.ok(bank.every(q=>!/^ang[uú]stia$/i.test(q.section)));
 vm.runInNewContext(read('simulados-finais-2026.js'),runtime);
 const db={subjects:{meta:{}},topics:{meta:[]},exams:[]};
 runtime.window.PSICO_FINAL_EXAMS.apply(db);
 assert.equal(db.topics.meta.length,28,'A revisão utiliza o banco do professor');
 assert.equal(db.exams.length,5,'Cinco simulados atuais de Metapsicologia');
 assert.ok(db.exams.every(e=>e.questions.length===15),'Quinze questões por prova');
 assert.ok(db.exams.every(e=>e.revision===runtime.window.PSICO_FINAL_EXAMS.metaVersion));
 for(const exam of db.exams)for(const q of exam.questions){
  assert.doesNotMatch(q.concept||'',/ang[uú]stia/i);
  if(q.type==='choice'){
   assert.equal(q.options.length,5);
   assert.equal(new Set(q.options.map(o=>o.text)).size,5,'Alternativas distintas');
   assert.ok(q.options.every(o=>o.text.length>=55),'Distratores desenvolvidos');
   assert.equal(q.options.filter(o=>o.correct).length,1);
   assert.equal(q.options[q.answer].correct,true);
  }
  if(q.type==='combo'){
   assert.equal(q.assertions.length,5);
   assert.equal(q.assertions.filter(a=>a.truth).length,3);
   assert.equal(q.options[q.answer],'Apenas '+q.correct.join(', ')+'.');
  }
 }
 vm.runInNewContext(read('revisao-erros.js'),runtime);
 for(const topic of bank){
  const affirm=runtime.window.PSICO_REVIEW_ERRORS.affirmations('meta',topic);
  assert.equal(affirm.correct,topic.definition);
  assert.equal(affirm.incorrect,topic.incorrect,'Revisão usa confusões conceituais próprias');
  assert.notEqual(affirm.incorrect,topic.myth,'Simulados preservam seus distratores originais');
  assert.equal(runtime.window.PSICO_REVIEW_ERRORS.explain('meta',topic),topic.whyWrong);
  assert.ok(topic.whyWrong.length>=80,'Cada equívoco tem correção didática detalhada');
 }
 vm.runInNewContext(read('estudo-ativo.js'),runtime);
 runtime.window.PSICO_PRACTICE.flashcards('meta',db.topics.meta,'2026/2');
 assert.equal(runtime.window.PSICO_PRACTICE.flashTutorialState('meta').count,28,'Flashcards oficiais com respostas individuais');
});


test('Recuperação de senha preserva login e troca de senha por e-mail',()=>{
 const start=html.indexOf('/* Perfis e ranking online');
 assert.ok(start>0,'Controlador de contas existente');
 const end=html.indexOf('</script>',start);
 assert.ok(end>start,'Script de contas completo');
 const authScript=html.slice(start,end);
 assert.doesNotThrow(()=>new vm.Script(authScript),'Sintaxe do login e da recuperação válida');
 for(const key of [
  'data-account-action="forgot-password-view"',
  "id=\"recoveryEmailForm\"",
  "id=\"recoveryPasswordForm\"",
  'resetPasswordForEmail(email,{redirectTo:CONFIRMATION_RETURN_URL})',
  "auth.updateUser({password})",
  "event==='PASSWORD_RECOVERY'",
  'recoveryLinkError',
  "modalView='recovery-done'"
 ])assert.ok(authScript.includes(key),'Recuperação incompleta: '+key);
 assert.match(authScript,/password!==confirmation/,'Nova senha confirmada antes de salvar');
 assert.match(authScript,/client\.auth\.getUser\(\)/,'Validação da sessão antes da atualização');
 assert.match(authScript,/client\.auth\.signOut\(\)/,'Encerra sessão após troca de senha');
});

test('Chamadas ficam desativadas em grupos e conversas privadas, sem afetar mensagens',()=>{
 assert.ok(!html.includes('pm-group-call-js')&&!html.includes('group-call.js'),'controlador de chamadas não pode ser carregado');
 assert.ok(!html.includes('pm-group-call-css')&&!html.includes('group-call.css'),'estilos exclusivos da call não podem ser carregados');
 assert.doesNotMatch(html,/data-gc-open|data-gc-private|data-pm-maintenance-call/,'nenhum botão de call para grupo, privado ou manutenção');
 assert.doesNotMatch(html,/uentzoulGroupCallBridge|uentzoulGroupCalls/,'API de chamadas não pode ficar acessível no HTML');
 assert.doesNotMatch(html,/Entrar na call|Entrar na call privada/,'mensagens sem convites para call');
 assert.match(html,/data-dmw-group/,'informações dos grupos preservadas');
 assert.match(html,/data-dm-profile/,'perfil das conversas privadas preservado');
 assert.ok(html.includes('dmThreadHtml()'),'visualização do histórico de mensagens preservada');
 assert.ok(html.includes('dmComposer()'),'compositor de mensagens preservado');
});

test('A desativação de calls mantém navegação e chats, sem scripts WebRTC no HTML',()=>{
 assert.ok(!html.includes('group-call.js')&&!html.includes('group-call.css'),'nenhum carregamento de módulo antigo');
 assert.doesNotMatch(html,/data-gc-action|data-gc-open|data-gc-private/,'interface sem controles de chamada');
 assert.ok(html.includes('window.uentzoulMessenger={render:dmRender'),'sistema normal de mensagens segue disponível');
 assert.ok(html.includes('chat-mobile-viewport.js'),'layout móvel do chat permanece ativo');
});

test('Auditoria de atualização protege estudo, modais e leitura do primeiro semestre',()=>{
 const version=read('site-version.js');
 const course=read('course-week-manager.js');
 const study=read('estudos-dirigidos.js');
 const library=read('library-manager.js');
 assert.doesNotThrow(()=>new vm.Script(version),'notificação de versão válida');
 assert.doesNotThrow(()=>new vm.Script(course),'catálogo de disciplinas válido');
 assert.doesNotThrow(()=>new vm.Script(study),'roteiros de estudo válidos');
 assert.doesNotThrow(()=>new vm.Script(library),'biblioteca válida');
 // Antes o HTML verificava uma nova versão e chamava reload mesmo com um estudante lendo.
 assert.ok(!html.includes('function applyVersion()'),'mecanismo de atualização silenciosa removido');
 assert.ok(!html.includes('setInterval(applyVersion,5000)'),'checagem invasiva de 5 segundos removida');
 assert.ok(!html.includes('location.reload();'),'HTML não recarrega a página por conta própria');
 assert.ok(version.includes("action.addEventListener('click',()=>reload(version))"),'atualização depende de clique');
 assert.ok(version.includes('promptUpdate(latest)'),'nova publicação gera aviso, sem recarregar');
 // Uma consulta de simulados não pode remontar explicações, provas ou trilhas.
 const geStart=html.indexOf('async function geLoad(forceRender=false)');
 const geEnd=html.indexOf('async function geCreate()',geStart);
 assert.ok(geStart>0&&geEnd>geStart,'função de sincronização dos simulados encontrada');
 const geBlock=html.slice(geStart,geEnd);
 assert.ok(!geBlock.includes("if(current.page==='exams'||current.page==='subject')render()"),'sem redraw no início da sincronização');
 assert.ok(geBlock.includes("semester!=='2026/1'"),'explicações do primeiro semestre protegidas');
 assert.ok(geBlock.includes('(forceRender||!wasLoaded)'),'atualizações periódicas só atualizam dados');
 assert.ok(geBlock.includes('userReading'),'modal, detalhes e edição preservados');
 assert.ok(html.includes("geLoad(true);return"),'botão atualizar simulados continua funcional');
 assert.ok(course.includes('if(subjectsChanged)bridge()?.applyExtraSubjects?.(additional)'),'catálogo sem alterações não remonta o primeiro semestre');
 assert.ok(study.includes("node.querySelector('details[open],input:focus,textarea:focus')"),'estudo dirigido aberto não é substituído ao sincronizar');
 assert.ok(library.includes('if(needsInitialPaint&&!reviewed.length)paint()'),'sincronização da biblioteca não descarta formulários de upload em andamento');
});

// Regressão: mudanças rápidas de mídia não podem terminar a chamada.
// Cada participante tem um elemento de áudio separado e controle local próprio.
test('Nenhuma função WebRTC é inicializada pela página de mensagens',()=>{
 assert.doesNotMatch(html,/new RTCPeerConnection|navigator\\.mediaDevices\\.getDisplayMedia/,'código de chamada não está embutido');
 assert.doesNotMatch(html,/uentzoulGroupCallBridge|uentzoulGroupCalls/,'módulo de call não está habilitado');
 assert.match(html,/uentzoulMessenger/,'mensageiro continua funcionando');
});

test('Trilhas convencionais removidas, vídeos de Metapsicologia preservados',()=>{
 const trail=read('trilhas-estudos.js');
 const visual=read('trilhas-estudos.css');
 const integrated=read('trilha-integrada.js');
 const first=read('primeiro-semestre-relembrar.js');
 const video=read('metapsicologia-p2.html');
 assert.match(trail,/metapsicologia-p2\.html/,'atalho para vídeos continua acessível');
 assert.match(trail,/video-trail-link/,'Metapsicologia mantém uma entrada específica');
 assert.match(visual,/subjectArea:trail/,'ocultação prévia evita exibir cartões removidos');
 assert.doesNotMatch(first,/function trailView\(/,'trilha do primeiro semestre foi retirada');
 assert.doesNotMatch(first,/Trilha de Estudos para Relembrar/,'menu antigo foi retirado');
 assert.doesNotMatch(integrated,/function render\(ctx\)/,'trilha integrada desativada');
 assert.match(video,/progressNumber/,'página independente de aulas gravadas permanece');
});

test('Questões didáticas mais claras preservam estrutura e gabaritos',()=>{
 const match=html.match(/<script id="dataset" type="application\/json">([\s\S]*?)<\/script>/);
 assert.ok(match,'banco de questões continua no HTML');
 const data=JSON.parse(match[1]);
 const subjects=['tcc','familia','meta','grupos','social','avaliacao'];
 assert.deepEqual(Object.keys(data.topics).sort(),subjects.sort());
 assert.ok(data.exams.length>=30,'as provas anteriores continuam cadastradas');
 const questions=data.exams.flatMap(exam=>exam.questions||[]);
 assert.ok(questions.length>=295,'questões existentes não foram apagadas');
 assert.ok(questions.every(question=>typeof question.id==='string'&&question.id.length>0),'IDs das questões são preservados');
 assert.ok(questions.every(question=>question.type==='essay'?Boolean(question.model):question.answer!==undefined),'questões objetivas mantêm gabaritos e dissertativas mantêm respostas-modelo');
 assert.ok(!questions.some(question=>/com precisão conceitual/i.test(question.prompt||'')),'enunciados antigos e desnecessariamente longos foram reescritos');
});


test('Cargo exclusivo de Concursos fica na modalidade após atualização, histórico e cliques de semestres',async()=>{
 const bootstrap=read('concursos-bootstrap.js'),contest=read('concursos.js'),resume=read('navigation-resume.js'),css=read('concursos.css');
 assert.match(resume,/if\(onlyContest\(\)\|\|isContestPage\(\)\)/,'restauração geral não pode sobrepor concursos');
 assert.match(contest,/onlyContest\(\)\?null:history\.state/,'conta exclusiva limpa histórico acadêmico');
 assert.match(contest,/if\(onlyContest\(\)\)\{e\.preventDefault\(\);e\.stopImmediatePropagation\(\);return;\}/,'IA não abre seção externa');
 assert.match(css,/html\.pm-concurso-user #semesterDropdown\{display:none!important\}/,'seletor não exibe semestres');
 assert.match(css,/html\.pm-concurso-user #nav \[data-page\]:not\(\[data-page="home"\]\):not\(\[data-page="exams"\]\)/);
 const handlers={},classes=new Set();
 class MockElement{
  constructor(selector){this.selector=selector;}
  closest(selector){return selector.includes(this.selector)?this:null;}
 }
 const location={pathname:'/estudos/',search:'',hash:'#semestre'};
 const history={state:{screen:{page:'home'},semester:'2026/2'},replaceState(state,_,url){
  this.state=state;location.hash=url.includes('#')?url.slice(url.indexOf('#')):'';
 }};
 const main={innerHTML:'<div>Semestres</div>',querySelector(selector){
  if(selector==='.concursos-pending'&&this.innerHTML.includes('concursos-pending'))return {};
  if(selector==='.concursos-shell'&&this.innerHTML.includes('concursos-shell'))return {};
  return null;
 }};
 const label={textContent:'2º semestre'};
 const semester={attributes:{},setAttribute(k,v){this.attributes[k]=v;},removeAttribute(k){delete this.attributes[k];},tabIndex:0};
 const dropdown={hidden:false};
 const nodes={main,semesterCurrentLabel:label,semesterCurrent:semester,semesterDropdown:dropdown};
 const document={
  documentElement:{classList:{
   add(...keys){keys.forEach(k=>classes.add(k));},
   remove(...keys){keys.forEach(k=>classes.delete(k));}
  }},
  getElementById:id=>nodes[id]||null,
  querySelectorAll:()=>[],
  createElement:tag=>({tagName:tag,remove(){},onload:null}),
  head:{appendChild(node){node.onload?.();}},
  readyState:'complete',hidden:false
 };
 const user={id:'concursista-1',is_anonymous:false};
 let roleReply={admin:false,concurso:true};
 const client={rpc:async()=>({data:roleReply}),from:()=>({
  select:()=>({eq:()=>({single:async()=>({data:{payload:{questions:Array(200).fill({})}}})})})
 })};
 const window={uentzoulAIAuth:{user:()=>user,client:()=>client},addEventListener(name,fn){
  (handlers[name]||=[]).push(fn);
 }};
 vm.runInNewContext(bootstrap,{window,document,history,location,Element:MockElement,setInterval(){},console,Date,Promise});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(window.uentzoulContestAccess.isOnlyContest(),true);
 assert.equal(location.hash,'#concursos');
 assert.equal(history.state,null,'histórico de semestre descartado');
 assert.equal(label.textContent,'Concursos');
 assert.equal(dropdown.hidden,true);
 assert.ok(classes.has('pm-concurso-user'));
 let stopped=false;location.hash='#semestre';history.state={semester:'2026/1'};
 handlers.popstate[0]({stopImmediatePropagation(){stopped=true;}});
 assert.equal(stopped,true,'histórico anterior é barrado');
 assert.equal(location.hash,'#concursos');
 assert.equal(history.state,null);
 let blocked=false;
 handlers.click[0]({target:new MockElement('#semesterCurrent'),preventDefault(){blocked=true;},stopImmediatePropagation(){}});
 assert.equal(blocked,true,'clique no seletor não abre semestres');
 // O administrador não fica preso a Concursos, mesmo possuindo também esse cargo.
 roleReply={admin:true,concurso:true};
 handlers['uentzoul:auth'][0]();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(window.uentzoulContestAccess.isOnlyContest(),false);
 assert.ok(!classes.has('pm-concurso-user'));
 assert.equal(semester.attributes['aria-disabled'],undefined);
 stopped=false;location.hash='#outro-semestre';
 handlers.popstate[0]({stopImmediatePropagation(){stopped=true;}});
 assert.equal(stopped,false,'administrador continua livre para usar semestres');
 assert.equal(location.hash,'#outro-semestre');
});


test('Caderno fica cinza e inacessível para o cargo exclusivo Concursos, sem bloquear administradores',()=>{
 const contest=read('concursos.js'),bootstrap=read('concursos-bootstrap.js'),css=read('concursos.css'),notebook=read('site-version.js');
 assert.match(css,/html\.pm-concurso-user #navConcursoNotebook:disabled/,'Caderno de Concursos precisa aparecer cinza quando bloqueado');
 assert.match(css,/pointer-events:none!important/,'Caderno bloqueado não recebe cliques');
 assert.match(contest,/notebookButton\.disabled=locked/,'botão desativado apenas para conta exclusiva');
 assert.match(contest,/notebookButton\.setAttribute\('aria-disabled',String\(locked\)\)/,'estado acessível do botão');
 assert.match(contest,/if\(!active\|\|!allowed\(\)\|\|onlyContest\(\)&&dest==='caderno'\)return/,'navegação por função não pode abrir o Caderno');
 assert.match(contest,/if\(onlyContest\(\)&&view==='caderno'\)\{view='inicio';rememberView\(\);\}/,'histórico interno antigo não pode restaurar o Caderno');
 assert.match(contest,/if\(onlyContest\(\)\)return;\s*go\('caderno'\)/,'cliques em ambos os cadernos precisam ser bloqueados');
 assert.match(bootstrap,/#navCadernoPreview,#navConcursoNotebook/,'interceptar acesso antes do carregamento de Concursos');
 assert.match(notebook,/if\(contestLocked\(\)\)\{pendingOpenAfterLogin=false;deactivate\(\);return;\}/,'caderno acadêmico não pode abrir por chamada direta');
 assert.match(notebook,/button\.disabled=unavailable/,'caderno acadêmico respeita acesso e restrição por dispositivo');
 assert.match(contest,/const onlyContest=\(\)=>rights\.concurso&&!rights\.admin/,'administrador continua com acesso');
});


test('Usuário Concurso é oculto da lateral até para administradores',async()=>{
 const sidebarStart=html.indexOf('let concursoHiddenIds=new Set();');
 const sidebarEnd=html.indexOf('function showModal(',sidebarStart);
 const queryStart=html.indexOf('async function hiddenConcursoProfiles(',sidebarEnd);
 const queryEnd=html.indexOf('window.uentzoulRefreshParticipants=',queryStart);
 assert.ok(sidebarStart>0&&sidebarEnd>sidebarStart&&queryStart>sidebarEnd&&queryEnd>queryStart,'código da lista e filtro disponível');
 const side=html.slice(sidebarStart,sidebarEnd),query=html.slice(queryStart,queryEnd);
 const panel={innerHTML:''};
 const profileId='11111111-1111-4111-8111-111111111111';
 const hiddenId='22222222-2222-4222-8222-222222222222';
 const profiles=[
  {user_id:profileId,display_name:'Administrador',avatar_url:''},
  {user_id:hiddenId,display_name:'Conta reservada de concurso',avatar_url:''}
 ];
 const seenTables=[];
 const mockClient={
  from(table){
   seenTables.push(table);
   return {select(){
    return {
     limit:async()=>({data:[{user_id:hiddenId}],error:null}),
     order:()=>({limit:async()=>({data:profiles,error:null})})
    };
   }};
  }
 };
 const sandbox={
  onlineUser:{id:profileId},client:mockClient,rankData:[],rankBusy:false,rankError:'',
  current:()=>({id:profileId,name:'Administrador',avatar:''}),$:id=>id==='profileSidebar'?panel:null,
  esc:s=>String(s),avatar:()=>'',bridge:{semester:()=>'2026/2'},
  window:{uentzoulAdminConfig:{isAdmin:()=>true}},console
 };
 const source='let rankData=[],rankBusy=false,rankError="",rankingSemester=null;\n'+side+'\n'+query+'\nloadRanking();';
 await vm.runInNewContext(source,sandbox);
 assert.ok(seenTables.includes('uentzoul_profiles'));
 assert.ok(seenTables.includes('uentzoul_concurso_users'));
 assert.match(panel.innerHTML,/Administrador/);
 assert.doesNotMatch(panel.innerHTML,/Conta reservada de concurso/);
 assert.match(panel.innerHTML,/1 perfil/,'contagem exclui concursos');
 assert.match(html,/ge\.profiles=\(profiles\.data\|\|\[\]\)\.filter\(p=>!contestUsers\.has\(p\.user_id\)\)/,'compartilhamentos ocultam concursos');
 assert.match(html,/dm\.people=\(people\.data\|\|\[\]\)\.filter\(p=>!contestUsers\.has\(p\.user_id\)\)/,'contatos do chat ocultam concursos');
 assert.match(html,/if\(!dmValid\(id\)\|\|id===onlineUser\.id\|\|concursoHiddenIds\.has\(id\)\)return/,'concurso não pode ser aberto por contato direto');
 const contests=read('concursos.js');
 assert.match(contests,/uentzoulRefreshParticipants\?\.\(\)/,'mudanças de cargo atualizam a lateral');
});

test('Biblioteca sincroniza documentos sem reconstruir a tela inteira e sem piscar',()=>{
 const editor=read('materiais-editor.js');
 assert.match(editor,/window\.dispatchEvent\(new Event\('uentzoul:material-placements-updated'\)\)/);
 const begin=html.indexOf('let docsRefreshTimer=null;');
 const end=html.indexOf("window.addEventListener('uentzoul:material-placements-updated'",begin);
 assert.ok(begin>0&&end>begin,'mecanismo localizado existe');
 const code=html.slice(begin,end);
 assert.match(code,/existing\.replaceWith\(next\)/);
 assert.doesNotMatch(code,/document\.getElementById\('main'\)\.innerHTML\s*=/);
 let active={page:'subject',subjectArea:'docs',subject:'tcc'};
 let isEditing=false,replacements=0,calls=0,id=0;
 const pending=new Map();
 let displayed;
 function node(mark){
  return {mark,isEqualNode(other){return this.mark===other?.mark},
   replaceWith(other){displayed=other;replacements++}};
 }
 displayed=node('anterior');
 const fake={
  current:active,semester:'2026/2',
  window:{PSICO_MATERIAL_EDITOR:{isEditing:()=>isEditing}},
  setTimeout(fn){const n=++id;pending.set(n,fn);return n},
  clearTimeout(n){pending.delete(n)},
  document:{
   querySelector(){return displayed},
   createElement(){return {set innerHTML(value){this.markup=value},
    querySelector(){return node(this.markup)}}}
  },
  renderSubject(){calls++;return 'conteudo-atualizado'},
  renderThirdSemester(){return 'conteudo-atualizado'},
  console
 };
 const run=vm.runInNewContext(code+'\n;({scheduleDocsRefresh})',fake).scheduleDocsRefresh;
 const flush=()=>{const jobs=[...pending.values()];pending.clear();jobs.forEach(job=>job())};
 for(let i=0;i<12;i++)run();
 assert.equal(pending.size,1,'12 notificações devem produzir uma só atualização');
 flush();
 assert.equal(replacements,1);
 assert.equal(calls,1);
 for(let i=0;i<10;i++)run();
 flush();
 assert.equal(replacements,1,'conteúdo igual não deve tocar no DOM');
 isEditing=true;run();
 assert.equal(pending.size,0,'edição não pode ser interrompida');
 isEditing=false;active.page='home';run();
 assert.equal(pending.size,0,'outras páginas não devem atualizar materiais');
});


test('Avaliação P3 oferece 21 conteúdos revisáveis baseados no roteiro detalhado',()=>{
 const reviewModule=read('conteudos-revisao-p3-2026.js');
 const source=read('avaliacao-p3-pratica.js');
 const w={};
 vm.runInNewContext(source,{window:w});
 vm.runInNewContext(reviewModule,{window:w});
 const topics=w.PSICO_DEEP_REVIEWS.get('avaliacao');
 assert.equal(topics.length,21);
 assert.ok(new Set(topics.map(x=>x.section)).size>=4);
 for(const topic of topics)assert.ok(topic.title&&topic.definition&&topic.scenario&&topic.question&&topic.answer&&topic.source,topic.title);
 assert.match(html,/DB\.topics\[key\]=expanded/);
 assert.match(html,/conteudos-revisao-p3-2026\.js\?v=20261124-grupos-filme-v2/);
});

test('Grupos contém 30+ conceitos de Moreno e Rogers conectados ao filme e preserva as duas questões P2',()=>{
 const w={};
 vm.runInNewContext(read('conteudos-revisao-p3-2026.js'),{window:w});
 const topics=w.PSICO_DEEP_REVIEWS.get('grupos');
 assert.ok(topics.length>=40);
 assert.ok(topics.filter(x=>x.section.startsWith('Moreno')).length>=15);
 assert.ok(topics.filter(x=>x.section.startsWith('Rogers')).length>=12);
 for(const topic of topics)assert.ok(topic.title&&topic.definition&&topic.scenario&&!topic.myth&&topic.question&&topic.answer,topic.title);
 assert.ok(topics.some(x=>x.title.includes('Sociometria')));
 assert.ok(topics.some(x=>x.title.includes('Inversão de papéis')));
 assert.ok(topics.some(x=>x.title.includes('Tele:')));
 assert.ok(topics.some(x=>x.title.includes('Congruência')));
 assert.ok(topics.some(x=>x.title.includes('Feedback')));
 assert.ok(topics.some(x=>x.title.includes('Jogo da linha')));
 assert.match(read('simulados-grupos-filme-2026.js'),/questions:\[morenoQuestion,rogersQuestion\]/);
 assert.match(html,/review-chapter-label/);
 assert.match(html,/review-practice-question/);
 assert.match(html,/review-practice-answer/);
});
