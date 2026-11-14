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
 assert.match(review,/2026-11-27T03:00:00Z/);
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
