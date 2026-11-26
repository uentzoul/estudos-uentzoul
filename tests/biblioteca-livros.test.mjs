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

test('A Biblioteca aparece para todos sem restaurar Trabalhos',()=>{
 const nav=html.slice(html.indexOf('<nav class="menu" id="nav">'),html.indexOf('</nav>',html.indexOf('<nav class="menu" id="nav">')));
 const agenda=nav.indexOf('data-page="calendar"');
 const books=nav.indexOf('id="navBookLibraryAdmin"');
 const exams=nav.indexOf('data-page="exams"');
 assert.ok(agenda>=0&&books>agenda&&exams>books,'Biblioteca entre Agenda e Simulados');
 assert.match(nav,/id="navBookLibraryAdmin" data-page="books" aria-label="Biblioteca — livros"/);
 assert.doesNotMatch(nav,/aria-label="Biblioteca — em breve"|<small class="psb-admin-mini">/);
 assert.doesNotMatch(html,/if\(page==='books'&&!window\.uentzoulAIAuth\?\.user\?\.\(\)\)/);
 assert.doesNotMatch(html,/if\(current\.page==='books'&&!window\.uentzoulAIAuth\?\.user\?\.\(\)\)current\.page='home'/);
 assert.match(html,/case 'books':body=window\.PSICO_BOOK_LIBRARY\?\.render\(\)/);
 assert.doesNotMatch(nav,/Trabalhos|data-page="works"/);
 assert.match(loader,/document\.querySelectorAll\('#nav \[aria-label="Trabalhos — em breve"\]/);
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

test('Membros consultam livros; audiobooks ficam bloqueados e o envio continua administrativo',()=>{
 const h=harness();
 let s=h.w.PSICO_BOOK_LIBRARY.render();
 assert.match(s,/Biblioteca de livros/);
 assert.match(s,/Biblioteca de audiobooks/);
 assert.match(s,/psb-category-audio psb-category-coming/,'audiobooks bloqueados');
 assert.match(s,/Em breve/);
 assert.doesNotMatch(s,/data-psb-tab="upload"/,'sem botão de envio para membro');
 h.enable();
 s=h.w.PSICO_BOOK_LIBRARY.render();
 assert.match(s,/data-psb-tab="upload"/,'envio exclusivo do administrador');
 assert.equal(h.stats(),0,'nenhum PDF transferido na tela inicial');
 const books=h.w.PSICO_BOOK_LIBRARY.books();
 assert.ok(books.length>=15,'um acervo inicial com obras realmente armazenadas');
 assert.equal(books.length,new Set(books.map(b=>b.id)).size,'sem obras duplicadas no catálogo');
 assert.ok(!books.some(b=>b.id==='foucault-loucura'),'Slides da aula História da Loucura não são livro de Foucault');
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

test('Capas editoriais substituem miniaturas e ocupam a moldura sem faixas brancas',()=>{
 const ids=['vygotsky-formacao','kuhn-revolucoes','popper-logica','laville-construcao','marcondes-filosofia','schultz-historia','rumos-percursos','bock-psicologias','piaget-seis-estudos','laplanche-vocabulario','roudinesco-dicionario','censo-1','censo-2','hall-identidade','collins-interseccionalidade','zimerman-grupos','aries-crianca-familia','cfp-verdade-revolucionaria'];
 for(const id of ids){
  const item=main.split('\n').find(line=>line.startsWith(" {id:'"+id+"'"));
  const cover=item?.match(/cover:'([^']+)'/)?.[1]||'';
  const remote=/^https:\/\//.test(cover);
  const local=/^assets\/[a-zA-Z0-9._/-]+\.(webp|png|jpe?g)$/.test(cover)
   && fs.existsSync(new URL('../'+cover,import.meta.url));
  assert.ok(item&&(remote||local),'capa editorial '+id);
 }
 const piaget=main.split('\n').find(line=>line.startsWith(" {id:'piaget-seis-estudos'"));
 assert.match(piaget,/cover:'assets\/piaget-seis-estudos-capa\.webp',coverZoom:1/);
 const coverFile=fs.readFileSync(new URL('../assets/piaget-seis-estudos-capa.webp',import.meta.url));
 assert.ok(coverFile.length>10000,'capa de Piaget presente');
 assert.equal(coverFile.subarray(0,4).toString(),'RIFF');
 assert.equal(coverFile.subarray(8,12).toString(),'WEBP');
 assert.match(main,/const image=b\.cover\|\|coverUrls\.get\(b\.id\)\|\|''/);
 assert.match(main,/if\(b\.cover\|\|coverUrls\.has\(b\.id\)\)continue/);
 assert.match(main,/if\(b\.cover\|\|coverUrls\.has\(b\.id\)\|\|!documentPDF\)return/);
 assert.match(main,/is1-ssl\.mzstatic\.com\/image\/thumb\/Publication62/);
 assert.doesNotMatch(main,/i\.zst\.com\.br\/thumbs\/12\/32\/31/);
 assert.match(css,/\.psb-original-cover\{[^}]*object-fit:cover/);
 assert.match(css,/transform:scale\(var\(--psb-cover-zoom,1\)\)/);
 assert.doesNotMatch(css,/\.psb-original-cover\{[^}]*object-fit:contain/);
});


test('Álbum de envios admin integra PDFs sem alterar obras antigas',()=>{
 const uploader=read('biblioteca-upload.js');
 assert.match(html,/biblioteca-upload\.js\?v=20261120-member-release-v1/);
 assert.match(main,/const allBooks=\(\)=>BOOKS\.concat\(window\.PSICO_BOOK_UPLOAD\?\.books\?\.\(\)\|\|\[\]\)/);
 assert.match(main,/data-psb-tab="upload"/);
 assert.match(main,/activeShelf==='upload'/);
 assert.match(main,/allBooks\(\)\.map\(bookCard\)/);
 assert.match(main,/allBooks\(\)\.find\(x=>x\.id===id\)/);
 assert.match(main,/PSICO_BOOK_UPLOAD\?\.load\?\.\(requestRender\)/);
 assert.match(uploader,/const TABLE='uentzoul_book_catalog'/);
 assert.match(uploader,/const MAX_BYTES=50\*1024\*1024/);
 assert.match(uploader,/materials\/scheduled\/books\//);
 assert.match(uploader,/contentType:'application\/pdf',upsert:false/);
 assert.match(uploader,/signature!=='%PDF-'/);
 assert.match(uploader,/window\.uentzoulAdminConfig\?\.isAdmin\?\.\(\)/);
 assert.match(uploader,/\.insert\(record\)\.select\('id'\)\.single\(\)/);
 assert.match(uploader,/type="file" accept=".pdf,application\/pdf" multiple/);
 assert.match(css,/\.psb-album-drop/);
 assert.match(css,/\.psb-album-fields/);
 new vm.Script(uploader,{filename:'biblioteca-upload.js'});
});


test('O envio só inicia após análise da capa e confirmação editorial',()=>{
 const upload=read('biblioteca-upload.js');
 const review=read('biblioteca-review.js');
 assert.match(html,/biblioteca-review\.js\?v=20261120-review-v1/);
 assert.ok(html.indexOf('biblioteca-review.js?v=')<html.indexOf('biblioteca-upload.js?v='));
 assert.match(upload,/function reviewItem\(item\)/);
 assert.match(upload,/data-psb-confirm/);
 assert.match(upload,/const targets=queue\.filter\(x=>x\.status==='review'&&x\.reviewed\)/);
 assert.match(upload,/data-psb-cover-mode="pdf"/);
 assert.match(upload,/data-psb-find-cover/);
 assert.match(upload,/if\(!title\|\|!author/);
 assert.match(upload,/cover_path:coverPath\|\|null/);
 assert.match(upload,/createSignedUrl\(book\.coverPath,3600\)/);
 assert.match(upload,/const leftovers=\[path,coverPath\]\.filter\(Boolean\)/);
 assert.match(review,/pageCover=await previewPage\(page\)/);
 assert.match(review,/data\.hasCover/);
 assert.match(review,/!data\.hasCover\) data\.foundCover=await findCover/);
 assert.match(review,/www\.googleapis\.com\/books\/v1\/volumes/);
 assert.match(review,/openlibrary\.org\/search\.json/);
 assert.match(css,/\.psb-album-review/);
 assert.match(css,/\.psb-album-cover-preview img/);
 new vm.Script(upload,{filename:'biblioteca-upload.js'});
 new vm.Script(review,{filename:'biblioteca-review.js'});
});
test('Classificação automática preserva assunto e exige correspondência de capa',()=>{
 const code=read('biblioteca-review.js');
 const w={};
 vm.runInNewContext(code,{window:w});
 const f=w.PSICO_BOOK_REVIEW;
 assert.ok(f,'analisador exportado');
 assert.equal(f.inferSubject('História da psicologia: rumos e percursos','Jacó-Vilela'),'História da psicologia');
 assert.equal(f.inferSubject('Vocabulário da psicanálise','Laplanche'),'Psicanálise');
 assert.equal(f.inferSubject('Psicologia da Família',''), 'Psicologia da família');
 assert.equal(f.titleMatch('História da psicologia moderna','História da Psicologia Moderna'),1);
 assert.ok(f.titleMatch('A estrutura das revoluções científicas','Manual de Radiologia Veterinária')<.4);
 assert.equal(f.cleanTitle('LIVRO_HISTÓRIA DA PSICOLOGIA.pdf'),'História da psicologia');
});


test('Sumário clicável é criado automaticamente por livro e respeita páginas divididas',()=>{
 const toc=read('biblioteca-sumario.js');
 const reviewed=read('biblioteca-capitulos-revisados.js');
 const verifiedContext={window:{}};
 vm.runInNewContext(reviewed,verifiedContext);
 const catalog=verifiedContext.window.PSICO_BOOK_VERIFIED_TOC;
 assert.ok(Object.keys(catalog).length>=18,'sumários disponíveis para ao menos 18 obras conferidas');
 assert.ok(Object.values(catalog).reduce((n,items)=>n+items.length,0)>=372,'sumários confrontados com os livros, com lacunas identificadas');
 assert.equal(catalog['hall-identidade'].length,6);
 assert.ok(catalog['hall-identidade'].some(item=>item.index===1),'seções de Hall apontam para a folha interna correta');
 assert.equal(catalog['bock-psicologias'].filter(item=>item.title.startsWith('Capítulo')).length,23);
 const pageLimits={
  'vygotsky-formacao':90,'kuhn-revolucoes':218,'popper-logica':282,
  'laville-construcao':342,'marcondes-filosofia':330,'schultz-historia':483,
  'rumos-percursos':593,'bock-psicologias':492,'piaget-seis-estudos':69,
  'laplanche-vocabulario':580,'roudinesco-dicionario':888,'censo-1':272,
  'censo-2':292,'hall-identidade':30,'collins-interseccionalidade':91,
  'zimerman-grupos':377,'aries-crianca-familia':275,'cfp-verdade-revolucionaria':700
 };
 for(const [id,entries] of Object.entries(catalog)){
  assert.ok(entries.length>0,id+' possui entradas no sumário');
  if(!pageLimits[id])continue; // Obras recém-integradas são validadas por seus próprios limites de páginas.
  let last=0;
  for(const entry of entries){
   assert.ok(entry.title.length>2,id+' capítulo com título');
   if(entry.missing){
    assert.equal(entry.source,undefined,id+' sem destino fabricado');
    continue;
   }
   assert.ok(Number.isInteger(entry.source)&&entry.source>=1&&entry.source<=pageLimits[id],id+': '+entry.title);
   assert.ok(entry.source>=last,id+': sequência de páginas em ordem');
   if(entry.index!==undefined)assert.ok([0,1,2,3].includes(entry.index),id+' índice de coluna válido');
   last=entry.source;
  }
 }
 function sequence(id,re,expected){
  const nums=Array.from(catalog[id],x=>x.title.match(re)?.[1]).filter(Boolean).map(Number);
  assert.deepEqual(nums,Array.from({length:expected},(_,i)=>i+1),id+' sem saltos ou inversões');
 }
 sequence('zimerman-grupos',/^(\d+)\./,38);
 sequence('laville-construcao',/^Capítulo (\d+)/,10);
 sequence('schultz-historia',/^Capítulo (\d+)/,15);
 sequence('bock-psicologias',/^Capítulo (\d+)/,23);
 sequence('kuhn-revolucoes',/^(\d+)\./,12);
 sequence('collins-interseccionalidade',/^(\d+)\./,8);
 const popChapters=catalog['popper-logica'].filter(x=>x.title.startsWith('Capítulo '));
 assert.equal(popChapters.length,10);
 assert.deepEqual(Array.from(popChapters,x=>x.title.match(/^Capítulo ([IVX]+)/)[1]),
  ['I','II','III','IV','V','VI','VII','VIII','IX','X']);
 assert.equal(catalog['collins-interseccionalidade'].filter(x=>x.missing).length,6,'o trecho digital inclui apenas capítulos 1 e 2');
 assert.equal(catalog['kuhn-revolucoes'].filter(x=>x.missing).length,1,'Kuhn contém lacuna assinalada, sem link falso');
 assert.equal(catalog['aries-crianca-familia'].filter(x=>x.missing).length,1,'Ariès possui abertura não identificada');
 assert.equal(catalog['cfp-verdade-revolucionaria'].filter(x=>x.level===0).length,16,'apresentação e 15 estados');
 assert.match(toc,/psb-toc-unavailable/);
 assert.match(toc,/if\(entry\.missing===true\)/);
 assert.match(toc,/psb-toc-v6::/);
 assert.match(css,/\.psb-toc-unavailable\{/);

 assert.match(main,/biblioteca-capitulos-revisados\.js\?v=20261120-verificado-v3/);
 assert.match(toc,/function reviewedChapters\(c\)/);
 assert.match(toc,/c\.leafMap\.findIndex\(leaf=>leaf\.source===entry\.source&&leaf\.index===entry\.index\)/);
 assert.match(toc,/state\.kind='reviewed'/);
 assert.match(main,/ensureTocModule\(\)\.then\(api=>api\?\.mount\?\.\(\)\)/);
 assert.match(main,/getReaderContext:\(\)=>allowed\(\)&&documentPDF&&activeBook/);
 assert.match(main,/window\.PSICO_BOOK_TOC\?\.close\?\.\(\)/);
 assert.match(main,/window\.PSICO_BOOK_TOC\?\.sync\?\.\(\)/);
 assert.match(toc,/await c\.pdf\.getOutline\(\)/);
 assert.match(toc,/await c\.pdf\.getPage\(source\)/);
 assert.match(toc,/await p\.getTextContent\(\)/);
 assert.match(toc,/logicalPage\(c,source/);
 assert.match(toc,/data-psb-toc-page/);
 assert.match(toc,/state\.query=e\.target\.value/);
 assert.match(toc,/function cacheKey/);
 assert.match(css,/\.psb-toc-panel\[hidden\]\{display:none!important\}/);
 const sandbox={window:{},document:{},localStorage:{getItem:()=>null,setItem:()=>{}},setTimeout,console};
 vm.runInNewContext(toc,sandbox);
 const api=sandbox.window.PSICO_BOOK_TOC;
 assert.ok(api,'módulo publicado e inicializável');
 assert.equal(typeof api.ranges,'undefined','sumário não deve inventar divisões por página');
 assert.doesNotMatch(toc,/Navegação por páginas|Páginas ['"]\+first|data-psb-toc-kind="range"/);
 assert.match(toc,/Capítulos e seções/);
 assert.match(toc,/Nenhum capítulo identificado neste PDF/);
 assert.match(toc,/await c\.pdf\.getOutline\(\)/);
 assert.match(toc,/function heading\(line\)/);
 assert.match(main,/biblioteca-sumario\.js\?v=20261120-toc-v4/);
 api.close();
});

 test('Visitante sem conta abre a Biblioteca sem desbloquear audiobooks ou envio',()=>{
 const h=harness();h.w.uentzoulAIAuth.user=()=>null;
 const view=h.w.PSICO_BOOK_LIBRARY.render();
 assert.match(view,/Biblioteca de livros/);
 assert.match(view,/psb-category-audio psb-category-coming/);
 assert.doesNotMatch(view,/data-psb-tab="upload"/);
 assert.equal(h.stats(),0);
 });
