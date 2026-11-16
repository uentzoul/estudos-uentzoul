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

test('Documento principal declara português brasileiro e viewport responsivo',()=>{
 assert.match(html,/<html[^>]*lang="pt-BR"/i);
 assert.match(html,/<meta[^>]+name="viewport"/i);
 assert.match(html,/<main[^>]+id="main"/i);
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
 const elementIndex=html.indexOf('id="navVacationReview"'),upcomingIndex=html.indexOf('aria-label="Trabalhos — em breve"');
 assert.ok(elementIndex>0&&upcomingIndex>elementIndex,'item na posição final antes do HTML ser exibido');
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
 assert.match(admin,/Saída não confirmada/);
 assert.match(admin,/Meu teste anônimo/);
 assert.match(tracker,/uentzoul_track_visit/);
 assert.match(tracker,/uentzoul:route/);
 assert.match(tracker,/pagehide/);
 assert.match(tracker,/keepalive:true/);
 assert.doesNotMatch(tracker,/document\.querySelector\(.*message.*textContent/);
 assert.match(read('site-version.js'),/visit-path\.js/);
 assert.match(html,/uentzoulCurrentRoute/);
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
   accessLog:[{id:123,name:'Visitante anônimo'}],selectedVisitId:'123',selectedPresenceId:null,
   logRenderTimer:null,visitDetail:()=>'<section class="admin-visit-detail">Percurso</section>',
   updateLogPanel(){throw Error('Não deve reconstruir o LOG')},clearTimeout};
 vm.runInNewContext('('+match[0]+')',context)();
 assert.equal(list.scrollTop,275,'a rolagem original não muda');
 assert.equal(row.selection,true);
 assert.equal(arrow.textContent,'⌃');
 assert.equal(expanded.removed,true);
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
   screen:{width:dimensions[0],height:dimensions[1]}
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
 assert.match(tracker,/p_device:kind==='navigate'\?deviceInfo\(\):null/);
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
 assert.match(loader,/button\.disabled=phone/,'botão fica desabilitado apenas em celulares');
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
 assert.match(loader,/button\.disabled=phone/);
 assert.match(loader,/button\.classList\.toggle\('nb-phone-locked',phone\)/);
 assert.match(loader,/if\(isNotebookPhone\(\)\)return;/);
 assert.match(loader,/nb-phone-locked\{opacity:\.52!important/);
 assert.match(loader,/button\.setAttribute\('aria-disabled',String\(phone\)\)/);
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
 assert.match(read('caderno.html'),/20261116-caderno-v32-ink-runs-list-backspace/);
 assert.match(read('site-version.js'),/caderno\.html\?v=20261116-caderno-v32-ink-runs-list-backspace/);
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
 assert.match(html,/site-version\.js\?v=20261116-caderno-v[0-9]+-[a-z0-9-]+/,'carregamento da versão atualizada');
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
