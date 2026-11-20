/* PsicoMoodle — Biblioteca de Livros (leitura para contas autenticadas).
   Livros existentes: documentos do bucket privado, abertos somente ao clique.
   Nenhum PDF é carregado durante a renderização da estante. */
(()=>{
'use strict';
const BUCKET='uentzoul-library-files';
const CACHE_DB='psicomoodle_livros_v1';
const CACHE_STORE='pdfs';
const PAGE_STORE='psicomoodle_book_page_v1';
const COVER_STORE='covers';
const BOOKS=[
 {id:'vygotsky-formacao',title:'A formação social da mente',author:'Lev S. Vygotsky',subject:'Psicologia do desenvolvimento',pages:90,part:true,path:'materials/8922ee37-a6bf-42b9-a088-74553da06e4d.pdf',colors:['#6b1631','#a83e57','#efd3d6'],cover:'https://martinsfontespaulista.vteximg.com.br/arquivos/ids/1055184-511-511/242244_ampliada.jpg?v=637266093967730000',coverZoom:1},
 {id:'kuhn-revolucoes',title:'A estrutura das revoluções científicas',author:'Thomas S. Kuhn',subject:'Filosofia e epistemologia',pages:218,path:'materials/662d8e57-4bd5-4660-83d3-978f5bf8ecf5.pdf',colors:['#243658','#436d91','#e0d0aa'],cover:'https://martinsfontespaulista.vteximg.com.br/arquivos/ids/1682173-800-800/166637.jpg?v=638743624714200000',coverZoom:1.02},
 {id:'popper-logica',title:'A lógica da pesquisa científica',author:'Karl Popper',subject:'Filosofia e epistemologia',pages:282,path:'materials/a7fef255-0104-4c90-8215-626cc778ef9e.pdf',colors:['#263c4d','#547889','#d3c2a2'],cover:'https://martinsfontespaulista.vteximg.com.br/arquivos/ids/589186-800-800/724082_detalhes.jpg?v=637260491894570000',coverZoom:1.02},
 {id:'laville-construcao',title:'A construção do saber',author:'Christian Laville e Jean Dionne',subject:'Pesquisa e metodologia',pages:342,path:'materials/edf30302-6d0c-4eef-8e6d-b4b88ae24bc6.pdf',colors:['#a45c5d','#d7a779','#f5d3a8'],cover:'https://down-br.img.susercontent.com/file/br-11134207-7qukw-lh4vl8ku27p126',coverZoom:1.02},
 {id:'marcondes-filosofia',title:'Iniciação à história da filosofia',author:'Danilo Marcondes',subject:'Filosofia e epistemologia',pages:330,path:'materials/f904e991-f020-4806-bf5c-26dce81ecbab.pdf',colors:['#30515a','#6e9c9d','#f4dfb3'],cover:'https://martinsfontespaulista.vteximg.com.br/arquivos/ids/1447141-800-800/117429.jpg?v=638288629981030000',coverZoom:1},
 {id:'schultz-historia',title:'História da psicologia moderna',author:'Duane P. Schultz e Sydney E. Schultz',subject:'História da psicologia',pages:483,path:'materials/6d6e8461-0cfe-4ce7-9e9a-07b1ad6b4603.pdf',colors:['#5d3753','#a67985','#eac9bc'],cover:'https://martinsfontespaulista.vteximg.com.br/arquivos/ids/258309-800-800/861815_ampliada.jpg?v=637251623787600000',coverZoom:1},
 {id:'rumos-percursos',title:'História da psicologia: rumos e percursos',author:'Ana Maria Jacó-Vilela, Arthur A. L. Ferreira e Francisco T. Portugal (orgs.)',subject:'História da psicologia',pages:593,path:'materials/948311e3-11ea-4772-a0ea-d346bafed7b4.pdf',colors:['#675488','#a792b8','#eee1f5'],cover:'https://is1-ssl.mzstatic.com/image/thumb/Publication62/v4/03/90/d4/0390d4e7-2884-df82-6b76-9e792fa1cdeb/1024091637.jpg/1200x1200wz.jpg',coverZoom:1.1},
 {id:'bock-psicologias',title:'Psicologias: uma introdução ao estudo de psicologia',author:'Ana M. B. Bock, Odair Furtado e Maria de Lourdes T. Teixeira',subject:'Fundamentos da psicologia',pages:492,path:'materials/73921dd3-3416-44f3-baa7-416281d0374a.pdf',colors:['#8a5032','#be8663','#f0d0a3'],cover:'https://down-br.img.susercontent.com/file/sg-11134201-8260g-mjem5f5hdz42a4',coverZoom:1},
 {id:'piaget-seis-estudos',title:'Seis estudos de psicologia',author:'Jean Piaget',subject:'Teorias sociocognitivas',pages:138,part:true,path:'materials/5f1c6082-497a-42a2-945e-1c6a8c48ba96.pdf',colors:['#24504f','#4e9684','#d3ddc4'],cover:'assets/piaget-seis-estudos-capa.webp',coverZoom:1},
 {id:'laplanche-vocabulario',title:'Vocabulário da psicanálise',author:'Jean Laplanche e Jean-Bertrand Pontalis',subject:'Psicanálise',path:'materials/8d645726-f77a-469b-b9c7-1196601a9f4f.pdf',colors:['#503e63','#8e749e','#e8cce9'],cover:'https://down-br.img.susercontent.com/file/sg-11134201-7rd71-lul553akanua1f',coverZoom:1},
 {id:'roudinesco-dicionario',title:'Dicionário de psicanálise',author:'Élisabeth Roudinesco e Michel Plon',subject:'Psicanálise',path:'materials/e50e2857-461b-479e-a336-30d0163378ba.pdf',colors:['#4e3446','#8b667f','#dfbdc6'],cover:'https://images.tcdn.com.br/img/img_prod/796789/180_dicionario_de_psicanalise_40703_1_9d0f2252568e67b710a78733a6ec42a3.jpg',coverZoom:1},
 {id:'censo-1',title:'Censo da Psicologia Brasileira — Volume 1',author:'Conselho Federal de Psicologia',subject:'Psicologia no Brasil',pages:272,path:'materials/5121236f-6052-47fb-81cb-43a39ab2174e.pdf',colors:['#32476f','#648ab0','#cfdeee'],cover:'https://censo.cfp.org.br/2022/img/capa-censo-vol-1.png',coverZoom:1},
 {id:'censo-2',title:'Censo da Psicologia Brasileira — Volume 2',author:'Conselho Federal de Psicologia',subject:'Psicologia no Brasil',pages:292,path:'materials/031b3456-79f7-432d-ba60-a82c25d65c16.pdf',colors:['#28575d','#51969a','#c8e6e4'],cover:'https://censo.cfp.org.br/2022/img/capa-censo-vol-2.png',coverZoom:1},
 {id:'hall-identidade',title:'A identidade cultural na pós-modernidade',author:'Stuart Hall',subject:'Psicologia social e direitos',part:true,scanColumns:3,path:'materials/scheduled/711e0e4a-cf52-4229-8042-75b950fba6b2.pdf',colors:['#4a506f','#7e85a9','#d3d5e5'],cover:'https://martinsfontespaulista.vteximg.com.br/arquivos/ids/1704825-1000-1000/731170.jpg?v=638839774338270000',coverZoom:1.03},
 {id:'collins-interseccionalidade',title:'Interseccionalidade',author:'Patricia Hill Collins e Sirma Bilge',subject:'Psicologia social e direitos',pages:91,part:true,path:'materials/00996dd9-c8d5-4672-9c60-d7cf8218880b.pdf',colors:['#794e5c','#ac7783','#f0d2d0'],cover:'https://boitempoeditorial.fbitsstatic.net/img/p/interseccionalidade-capa-sobre-pintura-152655/338306.jpg?h=420&v=no-value&w=420',coverZoom:1},
 {id:'zimerman-grupos',title:'Como trabalhamos com grupos',author:'David E. Zimerman e Luiz Carlos Osório',subject:'Psicologia de grupos',path:'materials/scheduled/7a66839d-e75d-4dfe-af73-e5a09d6a0323.pdf',colors:['#475360','#879ba7','#d7dce0'],cover:'https://livrariadopsicologo.com.br/capas/128/9798573072128.jpg',coverZoom:1},
 {id:'aries-crianca-familia',title:'História social da criança e da família',author:'Philippe Ariès',subject:'Psicologia da família',path:'materials/scheduled/d27048a1-049d-4e5a-b315-47a764818ff4.pdf',colors:['#776041','#ba9a6a','#e8d6ab'],cover:'https://martinsfontespaulista.vteximg.com.br/arquivos/ids/1417487-1000-1000/968646.jpg?v=639111726552530000',coverZoom:1.02},
 {id:'cfp-verdade-revolucionaria',title:'A verdade é revolucionária',author:'Conselho Federal de Psicologia',subject:'Psicologia social e direitos',pages:700,path:'materials/0729a72e-f387-4bf8-b2dd-c236339821c0.pdf',colors:['#493950','#92768f','#e2d2d8'],cover:'https://site.cfp.org.br/wp-content/uploads/2013/12/capa-do-livro.jpg',coverZoom:1},
 {id:'dongo-pensamento-linguagem',title:'Pensamento e linguagem: Vygotsky, Wallon, Chomsky e Piaget',author:'Adrian Oscar Dongo-Montoya',subject:'Teorias sociocognitivas',pages:161,path:'materials/1ef66337-af16-4be8-a68e-a88e297bca86.pdf',colors:['#841e23','#be3339','#191a1e'],cover:'https://books.scielo.org/id/5vwmw/cover/cover.jpeg',coverZoom:1},
 {id:'freud-massas-vol15',title:'Psicologia das massas e análise do Eu e outros textos (1920–1923) — Obras completas, vol. 15',author:'Sigmund Freud',subject:'Psicologia de grupos',pages:300,path:'materials/scheduled/5502d9ef-c67a-4994-a81d-e75f430beae8.pdf',colors:['#71132f','#bb1846','#e9ced2'],cover:'https://americanas.vtexassets.com/arquivos/ids/30533196/7494222_1_xlarge.jpg?v=638794231500430000',coverZoom:1},
 {id:'macedo-neurose',title:'Neurose: leituras psicanalíticas',author:'Mônica Medeiros Kother Macedo (org.)',subject:'Metapsicologia',path:'multipart:neurose-2016',paths:['materials/58281768-cab0-4552-b550-1b98d6176791.pdf','materials/7cdf4500-8713-4af7-bf70-8ad3201e3716.pdf','materials/9b2622fb-b29d-4057-9d8a-f99866fe7699.pdf'],colors:['#65146f','#aa238a','#dbb6d9'],cover:'https://imgv2-2-f.scribdassets.com/img/word_document/640747959/original/2279098431/1?v=1',coverZoom:1},
 {id:'dessen-ciencia-desenvolvimento',title:'A ciência do desenvolvimento humano: tendências atuais e perspectivas futuras',author:'Maria Auxiliadora Dessen e Áderson Luiz Costa Junior (orgs.)',subject:'Psicologia do desenvolvimento',pages:267,pending:true,pendingReason:'PDF integral localizado na Biblioteca; falta transferir para o armazenamento privado do site.',colors:['#718b7a','#c7b6a0','#f5f0e8'],cover:'https://img.wook.pt/images/a-ciencia-do-desenvolvimento-humano-maria-auxiliadora-dessen/MXwxNzEyNTV8MjE4ODY0fDE0Mzc1MTk2MDAwMDA%3D/500x',coverZoom:1},
 {id:'eizirik-ciclo-vida',title:'O ciclo da vida humana: uma perspectiva psicodinâmica',author:'Cláudio Laks Eizirik e Ana Margareth Siqueira Bassols (orgs.)',subject:'Psicologia do desenvolvimento',pending:true,pendingReason:'Livro identificado no Moodle; PDF integral ainda não localizado.',colors:['#74552b','#c98d51','#f5e5b8'],cover:'https://martinsfontespaulista.vteximg.com.br/arquivos/ids/653538-1000-1000/694830_ampliada.jpg?v=637261706550900000',coverZoom:1},
 {id:'justica-adolescente',title:'Justiça, adolescente e ato infracional: socioeducação e responsabilização',author:'Obra coletiva',subject:'Psicologia e direitos humanos',pending:true,pendingReason:'Exemplar localizado começa na página 3; conferência e transferência do PDF integral pendentes.',colors:['#31506d','#6685a3','#e0e7ed'],coverZoom:1},
];
const allBooks=()=>BOOKS.concat(window.PSICO_BOOK_UPLOAD?.books?.()||[]);
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const allowed=()=>Boolean(window.uentzoulAIAuth?.user?.()?.id);
const isAdmin=()=>Boolean(window.uentzoulAdminConfig?.isAdmin?.()&&window.uentzoulAIAuth?.user?.()?.id);
const user=()=>window.uentzoulAIAuth?.user?.()?.id||'';
const client=()=>window.uentzoulAIAuth?.client?.();
const database=(()=>{let promise=null;return ()=>{
 if(promise)return promise;
 if(!('indexedDB' in window))return Promise.reject(Error('Cache local não disponível.'));
 promise=new Promise((resolve,reject)=>{
  const req=indexedDB.open(CACHE_DB,1);
  req.onupgradeneeded=()=>{
   const db=req.result;
   if(!db.objectStoreNames.contains(CACHE_STORE))db.createObjectStore(CACHE_STORE);
   if(!db.objectStoreNames.contains(COVER_STORE))db.createObjectStore(COVER_STORE);
  };
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error||Error('Falha ao abrir o armazenamento local.'));
  req.onblocked=()=>reject(Error('Cache temporariamente bloqueado.'));
 }).catch(err=>{promise=null;throw err});
 return promise;
}})();
async function cachedGet(store,key){
 try{
  const db=await database();
  return await new Promise((res,rej)=>{
   const tx=db.transaction(store,'readonly'),req=tx.objectStore(store).get(key);
   req.onsuccess=()=>res(req.result??null);
   req.onerror=()=>rej(req.error);
  });
 }catch(_){return null;}
}
async function cachedPut(store,key,value){
 try{
  const db=await database();
  await new Promise((res,rej)=>{
   const tx=db.transaction(store,'readwrite');
   tx.objectStore(store).put(value,key);
   tx.oncomplete=()=>res();
   tx.onerror=()=>rej(tx.error);
   tx.onabort=()=>rej(tx.error);
  });
  return true;
 }catch(_){return false;}
}
let activeShelf='home',query='',activeBook=null,documentPDF=null,documentBlob=null,documentBlobs=[],page=1;
let zoom=1,dragX=0,readerBusy=false,openToken=0,pageToken=0;
let loadedKeys=new Set(),coverUrls=new Map(),slideDirection=1;
let pdfPromise=null,lastError='',lastBookId=null,lastUserId='',downloadPct=0;
let focused=false,gestureStart=null,cachedForActive=false,renderTasks=[],downloadBusy=false;
const cacheKey=b=>user()+'::'+b.id+'::'+b.path;
// Reconstrói páginas escaneadas em 2, 3 ou 4 partes, sem modificar os PDFs originais.
// Análise local apenas quando o livro é aberto; não há downloads adicionais na estante.
let leafMap=[];
const bookPageCount=()=>leafMap.length||(documentPDF?.numPages||activeBook?.pages||0);
const sourceForLeaf=n=>leafMap[n-1]||{source:n,cols:1,rows:1,index:0,rotate:0};
const hasSoloCover=()=>activeBook?.id==='piaget-seis-estudos'||
 (sourceForLeaf(1).cols===1&&sourceForLeaf(1).rows===1);
const progressKey=b=>PAGE_STORE+(b.id==='piaget-seis-estudos'?'split-v1_':'scan-layout-v2_')+user()+'_'+b.id;
function getSavedPage(b){
 try{
  const saved=Number(localStorage.getItem(progressKey(b)));
  if(saved>0)return Math.floor(saved);
  const legacy=Number(localStorage.getItem(PAGE_STORE+user()+'_'+b.id));
  if(legacy>0&&leafMap.length){
   const index=leafMap.findIndex(x=>x.source>=legacy);
   return index>=0?index+1:leafMap.length;
  }
 }catch(_){}
 return 1;
}
function savePage(b,n){try{localStorage.setItem(progressKey(b),String(n))}catch(_){}}
function scanGridForRatio(r){
 if(r>=2.45)return [4,1];
 if(r>=1.78)return [3,1];
 if(r>=1.25)return [2,1];
 if(r<=.21)return [1,4];
 if(r<=.29)return [1,3];
 if(r<=.43)return [1,2];
 return [1,1];
}
// Reconhece quatro miniaturas em matriz 2×2 pelo cruzamento de margens e pelo texto
// nas quatro regiões; evita confundir uma página comum com quatro páginas pequenas.
async function isFourUp(pdf,n){
 try{
  const p=await pdf.getPage(n),view=p.getViewport({scale:1});
  if(view.width/view.height<.49||view.width/view.height>1.0)return false;
  const vp=p.getViewport({scale:Math.min(1,450/Math.max(view.width,view.height))});
  const c=document.createElement('canvas');c.width=Math.round(vp.width);c.height=Math.round(vp.height);
  const ctx=c.getContext('2d',{willReadFrequently:true});if(!ctx)return false;
  await p.render({canvasContext:ctx,viewport:vp}).promise;
  const pixels=ctx.getImageData(0,0,c.width,c.height).data,w=c.width,h=c.height;
  function ink(x0,y0,x1,y1){
   let dark=0,total=0;
   for(let y=Math.floor(y0*h);y<Math.floor(y1*h);y+=3)
    for(let x=Math.floor(x0*w);x<Math.floor(x1*w);x+=3){
     const i=(y*w+x)*4;
     dark+=pixels[i]*.299+pixels[i+1]*.587+pixels[i+2]*.114<190?1:0;
     total++;
    }
   return dark/Math.max(total,1);
  }
  const q=[ink(.08,.08,.42,.42),ink(.58,.08,.92,.42),
           ink(.08,.58,.42,.92),ink(.58,.58,.92,.92)];
  const avg=q.reduce((a,b)=>a+b,0)/4;
  return q.every(x=>x>.02)&&
    ink(.486,.06,.514,.94)<Math.min(.025,avg*.3)&&
    ink(.06,.486,.94,.514)<Math.min(.025,avg*.3);
 }catch(_){return false;}
}
async function mapBookPages(pdf,b,token){
 if(b.id==='piaget-seis-estudos'){
  const map=[{source:1,cols:2,rows:1,index:1,rotate:180}];
  for(let n=2;n<=pdf.numPages;n++)map.push(
   {source:n,cols:2,rows:1,index:0,rotate:180},
   {source:n,cols:2,rows:1,index:1,rotate:180});
  map.push({source:1,cols:2,rows:1,index:0,rotate:180});
  return map;
 }
 const geometry=[];
 for(let n=1;n<=pdf.numPages;n+=12){
  if(openToken!==token||!allowed())return null;
  const sample=Array.from({length:Math.min(12,pdf.numPages-n+1)},(_,i)=>n+i);
  const group=await Promise.all(sample.map(async i=>{
   try{
    const p=await pdf.getPage(i),vp=p.getViewport({scale:1});
    return {source:i,r:vp.width/Math.max(vp.height,1)};
   }catch(_){return {source:i,r:.7};}
  }));
  geometry.push(...group);
 }
 const wide=geometry.filter(x=>x.r>=1.25).length;
 const tall=geometry.filter(x=>x.r<=.43).length;
 const bookWide=wide>=Math.max(2,Math.ceil(pdf.numPages*.40));
 const bookTall=tall>=Math.max(2,Math.ceil(pdf.numPages*.40));
 let grid=false;
 if(!bookWide&&!bookTall&&pdf.numPages>=4){
  const s=[Math.max(2,Math.floor(pdf.numPages*.3)),Math.max(3,Math.floor(pdf.numPages*.7))];
  grid=(await Promise.all(s.map(n=>isFourUp(pdf,n)))).every(Boolean);
 }
 if(openToken!==token||!allowed())return null;
 const forced=Number(b.scanColumns)||0;
 const map=[];
 for(const g of geometry){
  let cols=1,rows=1;
  const [detectedCols,detectedRows]=scanGridForRatio(g.r);
  if(forced>=2&&forced<=4){
   if(bookWide&&g.r<1.10){/* preserve a separate cover */}
   else if(bookTall&&g.r>.5){/* preserve a separate cover */}
   else if(g.r<.47)rows=forced;
   else cols=forced;
  }else if(bookWide&&g.r>=1.25)cols=detectedCols;
  else if(bookTall&&g.r<=.43)rows=detectedRows;
  else if(grid&&g.r>.49&&g.r<1){cols=2;rows=2;}
  for(let index=0;index<cols*rows;index++)
   map.push({source:g.source,cols,rows,index,rotate:0});
 }
 return map;
}
// O módulo do sumário é carregado só na abertura de livros; não aumenta o consumo da estante.
let tocModulePromise=null;
function loadBookModule(src){
 return new Promise((resolve,reject)=>{
  const node=document.createElement('script');
  node.src=src;node.async=true;
  node.onload=()=>resolve();
  node.onerror=()=>reject(Error('Não foi possível carregar '+src));
  document.head.appendChild(node);
 });
}
function ensureTocModule(){
 if(window.PSICO_BOOK_TOC)return Promise.resolve(window.PSICO_BOOK_TOC);
 if(tocModulePromise)return tocModulePromise;
 // Carrega primeiro os capítulos conferidos nos exemplares originais.
 // Sem carregamento de PDFs adicionais ou acesso ao Storage.
 tocModulePromise=loadBookModule('biblioteca-capitulos-revisados.js?v=20261120-verificado-v3')
  .catch(err=>{console.warn('Sumários revisados indisponíveis:',err);})
  .then(()=>loadBookModule('biblioteca-sumario.js?v=20261120-toc-v4'))
  .then(()=>window.PSICO_BOOK_TOC||null)
  .catch(err=>{tocModulePromise=null;console.warn(err);return null});
 return tocModulePromise;
}
function pdfjs(){
 if(window.pdfjsLib)return Promise.resolve(window.pdfjsLib);
 if(pdfPromise)return pdfPromise;
 pdfPromise=new Promise((resolve,reject)=>{
  const s=document.createElement('script');s.async=true;
  s.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  s.onload=()=>{
   if(!window.pdfjsLib){reject(Error('Leitor PDF não carregou.'));return;}
   window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
   resolve(window.pdfjsLib);
  };
  s.onerror=()=>reject(Error('Sem conexão para abrir o leitor de PDF.'));
  document.head.appendChild(s);
 }).catch(e=>{pdfPromise=null;throw e});
 return pdfPromise;
}
function badgeLabel(b){return b.pending?(b.id==='justica-adolescente'?'Exemplar incompleto · pendente':'Arquivo pendente'):b.part?'Trecho disponibilizado':b.paths?'18 capítulos · 3 partes reunidas':(b.pages?b.pages+' páginas':'PDF');}
function cover(b,index){
 const colors=b.colors||['#49536a','#8691a7','#e2e3ed'];
 const image=b.cover||coverUrls.get(b.id)||'';
 const title=b.title.replace(/[:—]/g,' ').trim();
 return '<span class="psb-cover-frame" style="--b0:'+colors[0]+';--b1:'+colors[1]+';--b2:'+colors[2]+'">'+
   '<span class="psb-spine" aria-hidden="true"></span>'+
   '<span class="psb-cover-face"><span class="psb-cover-design"><span class="psb-cover-mark" aria-hidden="true">Ψ</span>'+
   '<span class="psb-cover-type">'+esc(title)+'</span><span class="psb-cover-author">'+esc(b.author)+'</span><span class="psb-cover-lines" aria-hidden="true"></span></span>'+
   (image?'<img class="psb-original-cover" style="--psb-cover-zoom:'+Number(b.coverZoom||1)+'" src="'+esc(image)+'" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.style.display=\'none\'">':'')+'</span>'+
   '<span class="psb-cover-loading" aria-hidden="true"><span class="psb-spinner"></span></span>'+
   '</span>';
}
function bookCard(b,i){
 const searchable=normalize([b.title,b.author,b.subject].join(' '));
 return '<article class="psb-book" data-psb-filter="'+esc(searchable)+'" data-psb-book-card="'+esc(b.id)+'"'+(b.pending?' title="'+esc(b.pendingReason||'Arquivo ainda não disponível')+'"':'')+'>'+ 
 '<button type="button" data-psb-open="'+esc(b.id)+'" class="psb-book-button'+(b.pending?' psb-book-pending':'')+'" aria-label="'+(b.pending?'Arquivo pendente: ':'Abrir ')+esc(b.title)+' — '+esc(b.author)+'"'+(b.pending?' disabled aria-disabled="true"':'')+'>'+cover(b,i)+'</button>'+
 '<div class="psb-book-meta"><h3>'+esc(b.title)+'</h3><p>'+esc(b.author)+'</p><span>'+esc(badgeLabel(b))+'</span></div></article>';
}
function categoryCards(){
 return '<div class="psb-categories"><button class="psb-category psb-category-books" data-psb-tab="books">'+
 '<span class="psb-category-icon" aria-hidden="true"><svg viewBox="0 0 64 64"><path d="M32 13c-9-6-20-6-28-2v42c11-4 20-4 28 2 8-6 17-6 28-2V11c-8-4-19-4-28 2zm0 0v42"/></svg></span>'+
 '<span class="psb-category-text"><span class="psb-category-num">01 / ACERVO</span><strong>Biblioteca de livros</strong><small>Obras, dicionários e leituras de Psicologia em um leitor integrado.</small><span class="psb-category-action">Explorar '+allBooks().length+' livros <b>→</b></span></span></button>'+
 '<button type="button" class="psb-category psb-category-audio psb-category-coming" disabled aria-disabled="true" title="Audiobooks — em breve">'+
 '<span class="psb-category-icon" aria-hidden="true"><svg viewBox="0 0 64 64"><rect x="10" y="20" width="44" height="32" rx="11"/><path d="M10 37H3V28c0-17 13-27 29-27s29 10 29 27v9h-7M20 29v15M44 29v15"/></svg></span>'+
 '<span class="psb-category-text"><span class="psb-category-num">02 / ESCUTA</span><strong>Biblioteca de audiobooks</strong><small>Um espaço próprio para os livros narrados e suas futuras coleções.</small><span class="psb-category-action psb-coming-badge">Em breve</span></span></button>'+
 (isAdmin()?'<button type="button" class="psb-category psb-category-upload" data-psb-tab="upload" aria-label="Adicionar livros">'+
 '<span class="psb-category-icon" aria-hidden="true">↑</span><span class="psb-category-text"><span class="psb-category-num">03 / ADMIN</span>'+
 '<strong>Adicionar livros</strong><small>Álbum para enviar PDFs, cadastrar obras e completar a estante.</small><span class="psb-category-action">Abrir álbum de uploads <b>→</b></span></span></button>':'')+'</div>';
}
function mainHeader(){
 return '<header class="psb-main-head"><span class="psb-eyebrow">PSICOMOODLE / ACERVO DIGITAL</span>'+
 '<div class="psb-heading-row"><div><h1>Biblioteca</h1><p>Conhecimento organizado para ler no seu ritmo.</p></div></div></header>';
}
function bookShelf(){
 return '<div class="psb-subhead"><div><button data-psb-tab="home" class="psb-back">‹ Biblioteca</button><h2>Biblioteca de livros</h2><p>Explore o acervo. Cada PDF é carregado individualmente e fica guardado neste dispositivo quando houver espaço.</p></div><span class="psb-count" id="psbBookCount">'+allBooks().length+' livros</span></div>'+
 '<label class="psb-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.7" cy="10.7" r="6.7"/><path d="m16 16 5 5"/></svg>'+
 '<input type="search" id="psbSearch" autocomplete="off" spellcheck="false" value="'+esc(query)+'" placeholder="Pesquisar título, autor ou assunto..." aria-label="Pesquisar livros"></label>'+
 '<div class="psb-shelf" id="psbShelf">'+allBooks().map(bookCard).join('')+'</div>'+
 '<div class="psb-empty" id="psbSearchEmpty" hidden>Nenhum livro encontrado. Experimente outra palavra.</div>'+
 '<p class="psb-shelf-note">Livros disponíveis abrem no leitor integrado. Títulos com arquivo pendente aparecem desativados e não são apresentados como obras integrais disponíveis.</p>';
}
function audioShelf(){
 return window.PSICO_AUDIO_LIBRARY?.render?.()||
 '<div class="psb-subhead"><div><button data-psb-tab="home" class="psb-back">‹ Biblioteca</button><h2>Biblioteca de audiobooks</h2><p>Preparando o catálogo de audiobooks…</p></div></div>';
}
function ensureAudioLibrary(){
 if(window.PSICO_AUDIO_LIBRARY||window.__psaLibraryPending)return;
 window.__psaLibraryPending=true;
 if(!document.getElementById('psaLibraryStyles')){
  const link=document.createElement('link');link.id='psaLibraryStyles';link.rel='stylesheet';link.href='biblioteca-audiobooks.css?v=20261120-2';document.head.appendChild(link);
 }
 const script=document.createElement('script');script.src='biblioteca-audiobooks.js?v=20261120-2';script.async=true;
 script.onload=()=>{window.__psaLibraryPending=false;requestRender();};
 script.onerror=()=>{window.__psaLibraryPending=false;lastError='Não foi possível carregar a biblioteca de audiobooks.';requestRender()};
 document.head.appendChild(script);
}
function isTwoPage(){
 return window.innerWidth>=820 && (focused?window.innerWidth/window.innerHeight>1.15:(document.querySelector('#psbReaderViewport')?.clientWidth||0)>790);
}
function spreadPages(){
 if(!documentPDF)return [page];
 if(!isTwoPage())return [page];
 if(hasSoloCover()&&page===1)return [1];
 const base=hasSoloCover()?(page%2===0?page:page-1):(page%2===1?page:page-1);
 return [base,base+1].filter(n=>n<=bookPageCount());
}
function reader(){
 const b=activeBook;
 if(!b)return '';
 const count=bookPageCount()||'?';
 return '<section class="psb-reader" id="psbReader" aria-label="Leitor de '+esc(b.title)+'">'+
 '<div class="psb-reader-top"><button type="button" class="psb-reader-exit" data-psb-close aria-label="Voltar à Biblioteca">‹ <span>Biblioteca</span></button>'+
 '<div class="psb-reader-title"><strong>'+esc(b.title)+'</strong><span>'+esc(b.author)+'</span></div>'+
 '<div class="psb-reader-tools"><button type="button" data-psb-zoom="-1" aria-label="Reduzir zoom" title="Reduzir zoom">−</button>'+
 '<span class="psb-zoom-count" id="psbZoomCount">'+Math.round(zoom*100)+'%</span>'+
 '<button type="button" data-psb-zoom="1" aria-label="Aumentar zoom" title="Aumentar zoom">+</button>'+
 '<button type="button" data-psb-download aria-label="Baixar PDF" title="Baixar PDF">↓ <span class="psb-tool-desktop">Baixar</span></button>'+
 '<button type="button" data-psb-focus aria-label="Ativar ou sair do modo livro" title="Modo livro">⛶ <span class="psb-tool-desktop">Modo livro</span></button></div></div>'+
 '<div class="psb-reading-stage" id="psbReaderViewport"><button type="button" class="psb-turn-button psb-turn-prev" data-psb-prev aria-label="Página anterior">‹</button>'+
 '<div class="psb-pages" id="psbPages"><div class="psb-sheet" data-psb-sheet="0"><canvas data-psb-canvas="0" aria-label="Página do livro"></canvas><span class="psb-sheet-number" data-psb-num="0"></span></div>'+
 '<div class="psb-sheet" data-psb-sheet="1"><canvas data-psb-canvas="1" aria-label="Página do livro"></canvas><span class="psb-sheet-number" data-psb-num="1"></span></div></div>'+
 '<button type="button" class="psb-turn-button psb-turn-next" data-psb-next aria-label="Próxima página">›</button></div>'+
 '<footer class="psb-reader-bottom"><div class="psb-pager"><button data-psb-first type="button" title="Primeira página">«</button>'+
 '<label class="psb-pager-input"><input id="psbPageInput" type="number" min="1" max="'+count+'" value="'+page+'" aria-label="Ir para a página"> <span>de '+count+'</span></label>'+
 '<button data-psb-last type="button" title="Última página">»</button></div>'+
 '<span class="psb-reader-hint">Arraste, toque nas setas ou use ← → para folhear</span>'+
 '<span class="psb-cached-label" id="psbCachedLabel">'+(cachedForActive?'PDF salvo neste dispositivo':'Leitura online · sem cópia local')+'</span></footer>'+
 '</section>';
}
function render(){
 if(!allowed())return '<section class="panel"><h2>Entre na conta para abrir a Biblioteca.</h2></section>';
 if(lastUserId!==user()){lastUserId=user();closeBook(true);activeShelf='home';query='';}
 if(activeShelf==='audio')activeShelf='home';
 if(activeShelf==='upload'&&!isAdmin())activeShelf='home';
 return '<div class="psb-library" id="psbLibrary">'+
 (activeBook?reader():mainHeader()+
 (activeShelf==='home'?categoryCards():activeShelf==='audio'?audioShelf():activeShelf==='upload'?(window.PSICO_BOOK_UPLOAD?.render?.()||'<p>Carregando álbum…</p>'):bookShelf()))+
 (lastError&&!activeBook?'<p class="psb-error" role="alert">'+esc(lastError)+'</p>':'')+
 '</div>';
}
async function afterRender(){
 if(!allowed())return;
 if(activeBook&&documentPDF){await draw();void ensureTocModule().then(api=>api?.mount?.());return;}
 if(activeShelf==='books'){filterShelf();void restoreCovers();}
 if(activeShelf==='audio'){
  if(window.PSICO_AUDIO_LIBRARY)window.PSICO_AUDIO_LIBRARY.afterRender();
  else ensureAudioLibrary();
 }
 void window.PSICO_BOOK_UPLOAD?.load?.(requestRender);
}
function requestRender(){
 if(!allowed())return;
 window.uentzoulAdminBridge?.refreshCurrent?.();
}
async function restoreCovers(){
 for(const b of allBooks()){
  if(b.cover||coverUrls.has(b.id))continue;
  const stored=await cachedGet(COVER_STORE,cacheKey(b));
  if(!stored||!allowed())continue;
  coverUrls.set(b.id,stored);
  const card=document.querySelector('#psbLibrary [data-psb-book-card="'+b.id+'"] .psb-cover-face');
  if(card&&!card.querySelector('img.psb-original-cover')){
   const img=document.createElement('img');img.className='psb-original-cover';
   img.src=stored;img.alt='';img.loading='lazy';card.appendChild(img);
  }
 }
}
function filterShelf(){
 const q=normalize(query.trim());
 const cards=[...document.querySelectorAll('#psbShelf .psb-book')];
 let shown=0;
 for(const card of cards){const show=(!q||card.dataset.psbFilter.includes(q));card.hidden=!show;if(show)shown++;}
 const count=document.getElementById('psbBookCount');if(count)count.textContent=shown+(shown===1?' livro':' livros');
 const empty=document.getElementById('psbSearchEmpty');if(empty)empty.hidden=shown>0;
}
function setCardLoading(book,on){
 const card=document.querySelector('#psbLibrary [data-psb-book-card="'+book.id+'"]');
 if(card){card.classList.toggle('is-loading',on);const button=card.querySelector('button[data-psb-open]');if(button){button.disabled=on;button.setAttribute('aria-busy',String(on));}}
}
function fileFromCache(b){
 return cachedGet(CACHE_STORE,cacheKey(b));
}
async function loadFile(b){
 const cached=await fileFromCache(b);
 if(cached instanceof Blob&&cached.size>100){cachedForActive=true;return cached;}
 const c=client();
 if(!c||!allowed())throw Error('Entre na tua conta para consultar a Biblioteca.');
 const signing=await c.storage.from(BUCKET).createSignedUrl(b.path,180);
 if(signing.error||!signing.data?.signedUrl)throw Error('Não foi possível liberar a leitura deste PDF. Verifique sua sessão.');
 const resp=await fetch(signing.data.signedUrl,{cache:'no-store'});
 if(!resp.ok)throw Error('O arquivo não pôde ser carregado ('+resp.status+').');
 const size=Number(resp.headers.get('content-length'))||0;
 let blob;
 if(resp.body?.getReader){
  const reader=resp.body.getReader(),parts=[];let received=0;
  while(true){
   const {value,done}=await reader.read();
   if(done)break;
   if(!allowed()){try{await reader.cancel()}catch(_){}throw Error('Acesso encerrado.');}
   parts.push(value);received+=value.byteLength;
   if(size)downloadPct=Math.min(100,Math.round(received/size*100));
  }
  blob=new Blob(parts,{type:'application/pdf'});
 }else blob=await resp.blob();
 if(blob.size<100)throw Error('O PDF recebido está vazio.');
 cachedForActive=await cachedPut(CACHE_STORE,cacheKey(b),blob);
 return blob;
}
// Representa três PDFs de uma mesma obra como um livro contínuo, sem abrir páginas em outras abas.
function virtualDocument(docs){
 const offsets=[],skips=[];let count=0;
 for(let i=0;i<docs.length;i++){
  offsets.push(count);
  // Parte II retoma a folha de transição já presente no fim da Parte I.
  skips.push(i===1?1:0);
  count+=docs[i].numPages-skips[i];
 }
 return {
  numPages:count,
  getPage(n){
   if(!Number.isInteger(n)||n<1||n>count)return Promise.reject(Error('Página fora do livro.'));
   let i=docs.length-1;while(i>0&&n<=offsets[i])i--;
   return docs[i].getPage(n-offsets[i]+skips[i]);
  },
  getOutline:async()=>[],
  destroy:()=>Promise.all(docs.map(x=>x.destroy().catch(()=>{})))
 };
}
async function openBook(id){
 if(!allowed()||readerBusy)return;
 const b=allBooks().find(x=>x.id===id);if(!b||b.pending||(!b.path&&!b.paths?.length))return;
 readerBusy=true;lastError='';downloadPct=0;cachedForActive=false;
 const myToken=++openToken;
 setCardLoading(b,true);
 try{
  const pdf=await pdfjs();
  const multiple=Array.isArray(b.paths)&&b.paths.length>1;
  const blobs=multiple
   ?await Promise.all(b.paths.map((path,i)=>loadFile({...b,path,id:b.id+'-parte-'+(i+1)})))
   :[await loadFile(b)];
  if(myToken!==openToken||!allowed())return;
  const docs=await Promise.all(blobs.map(async blob=>
   pdf.getDocument({data:new Uint8Array(await blob.arrayBuffer()),useSystemFonts:true}).promise));
  const next=multiple?virtualDocument(docs):docs[0];
  if(myToken!==openToken||!allowed()){await next.destroy().catch(()=>{});return;}
  const newMap=await mapBookPages(next,b,myToken);
   if(myToken!==openToken||!allowed()||!newMap){await next.destroy().catch(()=>{});return;}
   documentPDF=next;documentBlob=multiple?null:blobs[0];documentBlobs=blobs;activeBook=b;leafMap=newMap;lastBookId=b.id;
   b.pages=bookPageCount();page=Math.min(bookPageCount(),getSavedPage(b));zoom=1;
  const card=document.querySelector('#psbLibrary [data-psb-book-card="'+b.id+'"]');
  if(card){card.classList.add('is-opening');await new Promise(r=>setTimeout(r,310));}
  if(myToken!==openToken||!allowed())return;
  requestRender();
  void cacheCover(b);
 }catch(err){
  lastError=err?.message||'Não foi possível abrir o livro.';
  setCardLoading(b,false);
  const el=document.querySelector('#psbLibrary [data-psb-book-card="'+b.id+'"]');
  if(el)el.classList.remove('is-opening');
  showNote(lastError);
 }finally{readerBusy=false;}
}
async function cacheCover(b){
 if(b.cover||coverUrls.has(b.id)||!documentPDF)return;
 try{
  const first=await documentPDF.getPage(1),vp=first.getViewport({scale:0.45});
  const canvas=document.createElement('canvas');canvas.width=Math.max(80,Math.round(vp.width));canvas.height=Math.max(110,Math.round(vp.height));
  const ctx=canvas.getContext('2d');await first.render({canvasContext:ctx,viewport:vp}).promise;
  const url=canvas.toDataURL('image/jpeg',0.72);
  if(url.length<120000&&activeBook?.id===b.id){coverUrls.set(b.id,url);await cachedPut(COVER_STORE,cacheKey(b),url);}
 }catch(_){}
}
function closeBook(silent=false){
 ++openToken;++pageToken;
 const old=documentPDF;
 for(const job of renderTasks){try{job.cancel()}catch(_){}}
 renderTasks=[];
 documentPDF=null;documentBlob=null;documentBlobs=[];activeBook=null;leafMap=[];focused=false;zoom=1;cachedForActive=false;
 window.PSICO_BOOK_TOC?.close?.();
 if(document.fullscreenElement?.id==='psbReader'){try{document.exitFullscreen?.()}catch(_){}}
 document.documentElement.classList.remove('psb-mode-book');
 if(!silent){requestRender();requestAnimationFrame(()=>{const input=document.getElementById('psbSearch');if(input)input.value=query;filterShelf();restoreCovers();})}
 if(old){try{old.destroy().catch(()=>{})}catch(_){}}
}
function showNote(message){
 const root=document.getElementById('psbLibrary');if(!root)return;
 let el=root.querySelector('.psb-floating-error');
 if(!el){el=document.createElement('p');el.className='psb-floating-error';el.setAttribute('role','alert');root.appendChild(el);}
 el.textContent=message;
}
async function draw(){
 const reader=document.getElementById('psbReader');
 if(!documentPDF||!reader||!allowed())return;
 const token=++pageToken,ids=spreadPages();
 for(const job of renderTasks){try{job.cancel()}catch(_){}}
 renderTasks=[];
 const sheets=[...reader.querySelectorAll('[data-psb-sheet]')];
 for(let i=0;i<sheets.length;i++){
  const sheet=sheets[i],num=ids[i];sheet.hidden=!num;
  if(num){const caption=sheet.querySelector('[data-psb-num]');if(caption)caption.textContent=String(num);}
 }
 const spread=reader.querySelector('#psbPages');
 if(spread)spread.classList.toggle('psb-single',ids.length===1);
 const pageInput=reader.querySelector('#psbPageInput');if(pageInput){pageInput.value=String(page);pageInput.max=bookPageCount();}
 const zoomText=reader.querySelector('#psbZoomCount');if(zoomText)zoomText.textContent=Math.round(zoom*100)+'%';
 window.PSICO_BOOK_TOC?.sync?.();
 const noPrev=page<=1,noNext=ids[ids.length-1]>=bookPageCount();
 reader.querySelector('[data-psb-prev]')?.toggleAttribute('disabled',noPrev);
 reader.querySelector('[data-psb-next]')?.toggleAttribute('disabled',noNext);
 const width=reader.querySelector('#psbReaderViewport')?.clientWidth||window.innerWidth;
 const height=reader.querySelector('#psbReaderViewport')?.clientHeight||window.innerHeight*0.7;
 const availableWidth=Math.max(220,(width-96)/(ids.length===2?2:1));
 const availableHeight=Math.max(300,height-32);
 const pagesToCleanup=new Set();
 await Promise.all(ids.map(async(num,i)=>{
  try{
   const leaf=sourceForLeaf(num),pdfPage=await documentPDF.getPage(leaf.source);
   if(token!==pageToken||!allowed())return;
   const rotation=(pdfPage.rotate+(leaf.rotate||0))%360;
   const base=pdfPage.getViewport({scale:1,rotation});
   const cols=leaf.cols||1,rows=leaf.rows||1;
   const leafWidth=base.width/cols,leafHeight=base.height/rows;
   let factor=Math.min(availableWidth/leafWidth,availableHeight/leafHeight)*zoom;
   factor=Math.min(Math.max(factor,.15),3.25);
   const dpr=Math.min(window.devicePixelRatio||1,2);
   const viewport=pdfPage.getViewport({scale:factor*dpr,rotation});
   const canvas=sheets[i].querySelector('canvas');
   const ctx=canvas?.getContext('2d',{alpha:false});
   if(!canvas||!ctx)return;
   const rasterW=viewport.width/cols,rasterH=viewport.height/rows;
   canvas.width=Math.max(1,Math.round(rasterW));
   canvas.height=Math.max(1,Math.round(rasterH));
   canvas.style.width=Math.round(leafWidth*factor)+'px';
   canvas.style.height=Math.round(leafHeight*factor)+'px';
   const x=(leaf.index%cols)*rasterW,y=Math.floor(leaf.index/cols)*rasterH;
   const job=pdfPage.render({canvasContext:ctx,viewport,
    ...(cols>1||rows>1?{transform:[1,0,0,1,-x,-y]}:{})});
   renderTasks.push(job);await job.promise;
   if(token!==pageToken||!allowed())return;
   pagesToCleanup.add(pdfPage);
   sheets[i].classList.remove('psb-sheet-transition');
   void sheets[i].offsetWidth;sheets[i].classList.add('psb-sheet-transition');
  }catch(e){
   if(token===pageToken&&e?.name!=='RenderingCancelledException')
    showNote('Erro ao renderizar a página. Tente novamente.');
  }
 }));
 if(token===pageToken)for(const p of pagesToCleanup)p.cleanup();
}
function turn(next){
 if(!documentPDF||!activeBook)return;
 const cover=hasSoloCover(),count=bookPageCount();
 if(isTwoPage()){
  if(next>0)page=cover&&page===1?2:page+2;
  else page=cover&&page===2?1:page-2;
  page=Math.max(1,Math.min(count,page));
  if(cover&&page>1&&page%2!==0)page=Math.max(2,page-1);
  else if(!cover&&page%2===0)page=Math.max(1,page-1);
 }else page=Math.max(1,Math.min(count,page+(next>0?1:-1)));
 savePage(activeBook,page);void draw();
}
function goPage(n){
 if(!documentPDF||!activeBook)return;
 page=Math.min(bookPageCount(),Math.max(1,Math.floor(Number(n)||1)));
 if(isTwoPage()){
  if(hasSoloCover()&&page>1&&page%2!==0)page--;
  else if(!hasSoloCover()&&page%2===0)page--;
 }
 savePage(activeBook,page);void draw();
}
function setZoom(delta){
 zoom=Math.max(0.7,Math.min(2.5,Math.round((zoom+delta*0.15)*100)/100));
 void draw();
}
async function focusBook(){
 const el=document.getElementById('psbReader');if(!el)return;
 if(focused){
  focused=false;document.documentElement.classList.remove('psb-mode-book');
  try{if(document.fullscreenElement)await document.exitFullscreen()}catch(_){}
  void draw();
 }else{
  focused=true;document.documentElement.classList.add('psb-mode-book');
  try{await el.requestFullscreen?.()}catch(_){}
  void draw();
 }
}
async function download(){
 if(!activeBook||downloadBusy||!documentBlobs.length)return;
 downloadBusy=true;
 const book=activeBook;
 const btn=document.querySelector('#psbReader [data-psb-download]');
 if(btn){btn.disabled=true;btn.setAttribute('aria-busy','true');}
 try{
  let blob=documentBlob;
  if(!blob&&documentBlobs.length>1){
   if(!window.PDFLib)await loadBookModule('https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js');
   if(!window.PDFLib)throw Error('Não foi possível preparar o PDF unificado.');
   const merged=await window.PDFLib.PDFDocument.create();
   for(let partIndex=0;partIndex<documentBlobs.length;partIndex++){
    if(!allowed()||activeBook!==book)throw Error('Leitura encerrada.');
    const source=await window.PDFLib.PDFDocument.load(await documentBlobs[partIndex].arrayBuffer());
    const start=book.id==='macedo-neurose'&&partIndex===1?1:0;
    const copied=await merged.copyPages(source,Array.from({length:source.getPageCount()-start},(_,i)=>i+start));
    for(const copiedPage of copied)merged.addPage(copiedPage);
   }
   blob=new Blob([await merged.save()],{type:'application/pdf'});
   if(activeBook===book)documentBlob=blob;
  }
  if(!blob||!allowed()||activeBook!==book)return;
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download=(book.title||'livro').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\w-]+/g,'-')+'.pdf';
  document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),4500);
 }catch(err){showNote(err?.message||'Não foi possível preparar o download.');}
 finally{downloadBusy=false;if(btn?.isConnected){btn.disabled=false;btn.removeAttribute('aria-busy');}}
}
document.addEventListener('input',e=>{
 if(!allowed()||!e.target.closest('#psbLibrary'))return;
 if(e.target.id==='psbSearch'){query=e.target.value;filterShelf();}
});
document.addEventListener('change',e=>{
 if(!allowed()||!e.target.closest('#psbLibrary'))return;
 if(e.target.id==='psbPageInput')goPage(e.target.value);
});
document.addEventListener('click',e=>{
 if(!allowed()||!e.target.closest('#psbLibrary'))return;
 const tab=e.target.closest('[data-psb-tab]');
 if(tab){e.preventDefault();if(tab.dataset.psbTab==='audio')return;if(tab.dataset.psbTab==='upload'&&!isAdmin())return;closeBook(true);activeShelf=tab.dataset.psbTab;lastError='';requestRender();return;}
 const open=e.target.closest('[data-psb-open]');
 if(open){e.preventDefault();void openBook(open.dataset.psbOpen);return;}
 if(e.target.closest('[data-psb-close]')){closeBook();return;}
 if(e.target.closest('[data-psb-next]')){turn(1);return;}
 if(e.target.closest('[data-psb-prev]')){turn(-1);return;}
 if(e.target.closest('[data-psb-first]')){goPage(1);return;}
 if(e.target.closest('[data-psb-last]')){goPage(bookPageCount()||1);return;}
 const z=e.target.closest('[data-psb-zoom]');if(z){setZoom(Number(z.dataset.psbZoom));return;}
 if(e.target.closest('[data-psb-download]')){void download();return;}
 if(e.target.closest('[data-psb-focus]')){void focusBook();return;}
});
document.addEventListener('keydown',e=>{
 if(!allowed()||!activeBook||!document.getElementById('psbReader'))return;
 if(e.key==='Escape'&&window.PSICO_BOOK_TOC?.isOpen?.()){e.preventDefault();window.PSICO_BOOK_TOC.closePanel();return;}
 if(e.target.closest?.('input,textarea,select,[contenteditable=true]'))return;
 if(e.key==='ArrowRight'||e.key==='PageDown'){e.preventDefault();turn(1);}
 if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();turn(-1);}
 if(e.key==='Home'){e.preventDefault();goPage(1);}
 if(e.key==='End'){e.preventDefault();goPage(bookPageCount()||1);}
 if(e.key==='Escape'&&focused){e.preventDefault();void focusBook();}
});
document.addEventListener('pointerdown',e=>{
 if(!allowed()||!activeBook||!e.target.closest('#psbReaderViewport'))return;
 if(e.target.closest('button'))return;
 gestureStart={x:e.clientX,y:e.clientY,id:e.pointerId};
},{passive:true});
document.addEventListener('pointerup',e=>{
 if(!allowed()||!gestureStart||gestureStart.id!==e.pointerId)return;
 const dx=e.clientX-gestureStart.x,dy=e.clientY-gestureStart.y;gestureStart=null;
 if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.5)turn(dx<0?1:-1);
},{passive:true});
window.addEventListener('resize',()=>{
 if(activeBook&&documentPDF&&document.getElementById('psbReader')){clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>void draw(),130);}
});
let resizeTimer=null;
document.addEventListener('fullscreenchange',()=>{
 if(!document.fullscreenElement&&focused){focused=false;document.documentElement.classList.remove('psb-mode-book');}
 if(activeBook)void draw();
});
window.addEventListener('uentzoul:auth',()=>{
 if(!allowed()&&activeBook)closeBook(true);
});
window.PSICO_BOOK_LIBRARY={render,afterRender,hasAccess:allowed,books:()=>allBooks().map(({id,title,author,subject,pages,part,cover,colors,pending})=>({id,title,author,subject,pages,part,cover,colors,pending:!!pending})),isOpen:()=>!!activeBook,getReaderContext:()=>allowed()&&documentPDF&&activeBook?{pdf:documentPDF,book:activeBook,leafMap,total:bookPageCount(),currentPage:()=>page,goPage}:null,reset:()=>{closeBook(true);activeShelf='home';query='';}};
})();