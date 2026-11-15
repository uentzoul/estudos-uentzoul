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
