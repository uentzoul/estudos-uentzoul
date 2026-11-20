/* Regressões da Biblioteca de Livros: acesso, estante, leitura individual. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html');
const main=read('biblioteca-livros.js');
const css=read('biblioteca-livros.css');
const loader=read('site-version.js');

test('A Biblioteca de Livros fica reservada ao administrador, sem ressuscitar Trabalhos',()=>{
 const nav=html.slice(html.indexOf('<nav class="menu" id="nav">'),html.indexOf('</nav>',html.indexOf('<nav class="menu" id="nav">')));
 const agenda=nav.indexOf('data-page="calendar"');
 const upcoming=nav.indexOf('aria-label="Biblioteca — em breve"');
 const live=nav.indexOf('id="navBookLibraryAdmin"');
 const exams=nav.indexOf('data-page="exams"');
 assert.ok(agenda>=0&&upcoming>agenda&&live>upcoming&&exams>live,'Biblioteca mantida entre Agenda e Simulados');
 assert.match(nav, /id="navBookLibraryAdmin" data-page="books" hidden/);
 assert.match(html, /if\(page==='books'&&!window\.uentzoulAdminConfig\?\.isAdmin\?\.\(\)\)return/);
 assert.match(html, /if\(current\.page==='books'&&!window\.uentzoulAdminConfig\?\.isAdmin\?\.\(\)\)current\.page='home'/);
 assert.match(html, /case 'books':body=window\.PSICO_BOOK_LIBRARY\?\.render\(\)/);
 assert.match(css,/#nav \[aria-label="Biblioteca — em breve"\]\[hidden\]\{display:none!important\}/);
 assert.doesNotMatch(nav, /Trabalhos|data-page="works"/);
 assert.match(loader, /document\.querySelectorAll\('#nav \[aria-label="Trabalhos — em breve"\]/);
});

test('A estante só carrega documentos ao abrir um livro e preserva o acervo privado',()=>{
 assert.match(main,/const BUCKET='uentzoul-library-files'/);
 assert.match(main,/createSignedUrl\(b\.path,180\)/);
 assert.match(main,/cachedGet\(CACHE_STORE,cacheKey\(b\)\)/);
 assert.match(main,/cachedPut\(CACHE_STORE,cacheKey\(b\),blob\)/);
 assert.match(main,/pdf\.getDocument\(\{data:new Uint8Array\(await blob\.arrayBuffer\(\)\)/);
 assert.match(main,/pdfjsLib/);
 assert.match(main,/async function focusBook\(\)/);
 assert.match(main,/function isTwoPage\(\)/);
 assert.match(main,/async function cacheCover\(b\)/);
 assert.match(main,/AUDIO|Biblioteca de audiobooks/i);
 assert.match(main,/is-loading/);
 assert.match(css,/\.psb-cover-loading/);
 assert.match(css,/html\.psb-mode-book/);
 assert.match(html,/biblioteca-livros\.js\?v=/);
 assert.match(html,/biblioteca-livros\.css\?v=/);
});

function harness(){
 let admin=false,storageTouched=0;
 const listeners={};
 const fakeStorage={
  getItem:()=>null,setItem:()=>{},length:0
 };
 const dom={
  documentElement:{classList:{remove(){},add(){}}},
  fullscreenElement:null,
  addEventListener(type,handler){(listeners[type]||=[]).push(handler)},
  querySelector(){return null},
  querySelectorAll(){return []}
 };
 const w={
  innerWidth:1200,innerHeight:780,devicePixelRatio:1,
  uentzoulAdminConfig:{isAdmin:()=>admin},
  uentzoulAIAuth:{user:()=>({id:'test-admin'}),client:()=>{
   storageTouched++;
   return {storage:{from:()=>({createSignedUrl:()=>{throw Error('Não deve carregar livro ao abrir a estante') }})}};
  }},
  uentzoulAdminBridge:{refreshCurrent(){}},
  addEventListener(){},
  setTimeout
 };
 vm.runInNewContext(main,{window:w,document:dom,localStorage:fakeStorage,crypto:{},setTimeout,clearTimeout,requestAnimationFrame:cb=>cb(),Blob,console});
 return {w,dom,listeners,enable:()=>{admin=true},stats:()=>storageTouched};
}

test('Inicialmente a biblioteca não oferece dados a alunos e mostra as duas categorias apenas ao administrador',()=>{
 const h=harness();
 assert.match(h.w.PSICO_BOOK_LIBRARY.render(),/Acesso restrito/);
 h.enable();
 let s=h.w.PSICO_BOOK_LIBRARY.render();
 assert.match(s,/Biblioteca de livros/);
 assert.match(s,/Biblioteca de audiobooks/);
 assert.equal(h.stats(),0,'nenhum PDF transferido na tela inicial');
 const books=h.w.PSICO_BOOK_LIBRARY.books();
 assert.ok(books.length>=15,'um acervo inicial com obras realmente armazenadas');
 assert.equal(books.length,new Set(books.map(b=>b.id)).size,'sem obras duplicadas no catálogo');
 assert.ok(books.every(b=>b.title&&b.author&&b.subject),'títulos e autores identificados');
 const tab={
  dataset:{psbTab:'books'},
  closest(selector){return selector==='#psbLibrary'||selector==='[data-psb-tab]'?this:null}
 };
 for(const handle of h.listeners.click||[])handle({target:tab,preventDefault(){}});
 s=h.w.PSICO_BOOK_LIBRARY.render();
 assert.match(s,/Pesquisar título, autor ou assunto/);
 assert.match(s,/A formação social da mente/);
 assert.match(s,/Vocabulário da psicanálise/);
 assert.equal(h.stats(),0,'nenhum PDF é baixado ao mostrar as capas');
});
