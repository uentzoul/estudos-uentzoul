/* PsicoMoodle — sumário automático dos livros; não envia documentos para servidores extras. */
(()=>{
'use strict';
if(window.PSICO_BOOK_TOC)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
let state=null,generation=0,eventsBound=false;
function context(){return window.PSICO_BOOK_LIBRARY?.getReaderContext?.()||null}
function cacheKey(c){return 'psb-toc-v6::'+(window.uentzoulAIAuth?.user?.()?.id||'')+'::'+c.book.id+'::'+c.book.path+'::'+c.total}
function readCache(c){
 try{
  const record=JSON.parse(localStorage.getItem(cacheKey(c))||'null');
  if(!record||!Array.isArray(record.items)||!['outline','text','reviewed'].includes(record.kind))return null;
  return {kind:record.kind,items:record.items.filter(x=>
   typeof x.title==='string'&&x.title.length<=200&&(x.missing===true||(Number.isInteger(x.page)&&x.page>=1&&x.page<=c.total))).slice(0,240)};
 }catch(_){return null}
}
function writeCache(c,items,kind){
 try{localStorage.setItem(cacheKey(c),JSON.stringify({kind,items:items.slice(0,240)}))}catch(_){}
}
function logicalPage(c,source,x=null,y=null){
 let first=-1;
 for(let i=0;i<c.leafMap.length;i++){
  const leaf=c.leafMap[i];
  if(leaf.source!==source)continue;
  if(first<0)first=i;
  if(x===null||y===null)continue;
  const cols=leaf.cols||1,rows=leaf.rows||1;
  const col=Math.min(cols-1,Math.max(0,Math.floor(x*cols)));
  const row=Math.min(rows-1,Math.max(0,Math.floor((1-y)*rows)));
  if(leaf.index===row*cols+col)return i+1;
 }
 return first<0?1:first+1;
}
async function pdfBookmarks(c,gen){
 let tree;
 try{tree=await c.pdf.getOutline()}catch(_){return []}
 if(!Array.isArray(tree)||!tree.length)return [];
 const items=[],pageCache=new Map();
 async function locate(node){
  try{
   let dest=node.dest;
   if(typeof dest==='string')dest=await c.pdf.getDestination(dest);
   if(!Array.isArray(dest)||dest[0]==null)return 0;
   const ref=dest[0],key=typeof ref==='object'?JSON.stringify(ref):String(ref);
   if(pageCache.has(key))return pageCache.get(key);
   const zero=typeof ref==='number'?ref:await c.pdf.getPageIndex(ref);
   const source=Number.isInteger(zero)?zero+1:0;
   pageCache.set(key,source);
   return source;
  }catch(_){return 0}
 }
 async function visit(list,depth){
  for(const item of list){
   if(generation!==gen||items.length>=220)return;
   const source=await locate(item);
   const title=String(item.title||'').replace(/\s+/g,' ').trim();
   if(source>=1&&source<=c.pdf.numPages&&title.length>=2&&title.length<=200){
    items.push({title,page:logicalPage(c,source),level:Math.min(3,depth)});
   }
   if(Array.isArray(item.items)&&item.items.length)await visit(item.items,depth+1);
  }
 }
 await visit(tree,0);
 return items;
}
function textLines(content,page,c,source){
 const raw=content?.items||[];
 if(!raw.length)return [];
 const geom=c.leafMap.find(x=>x.source===source)||{cols:1,rows:1};
 const cols=geom.cols||1,rows=geom.rows||1;
 const view=page.view||[0,0,600,800];
 const w=Math.max(1,view[2]-view[0]),h=Math.max(1,view[3]-view[1]);
 const groups=new Map(),sizes=[];
 for(const item of raw){
  const str=String(item.str||'').trim(),t=item.transform;
  if(!str||!Array.isArray(t)||t.length<6)continue;
  const x=(t[4]-view[0])/w,y=(t[5]-view[1])/h;
  if(x<0||x>1||y<0||y>1)continue;
  const size=Math.hypot(Number(t[2])||0,Number(t[3])||0)||10;
  sizes.push(size);
  const col=Math.max(0,Math.min(cols-1,Math.floor(x*cols)));
  const row=Math.max(0,Math.min(rows-1,Math.floor((1-y)*rows)));
  const key=col+'|'+row+'|'+Math.round(t[5]/3);
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push({str,x,y,size});
 }
 sizes.sort((a,b)=>a-b);
 const normal=sizes[Math.floor(sizes.length/2)]||10,lines=[];
 for(const group of groups.values()){
  group.sort((a,b)=>a.x-b.x);
  const title=group.map(x=>x.str).join(' ').replace(/\s+/g,' ').trim();
  if(!title||title.length>135)continue;
  const first=group[0],localTop=(1-first.y)*rows%1;
  lines.push({title,x:first.x,y:first.y,normal,
   size:Math.max(...group.map(x=>x.size)),localTop});
 }
 return lines;
}
function heading(line){
 const title=line.title.replace(/\s+/g,' ').trim();
 if(title.length<6||title.length>115||/\.{3,}\s*\d{1,4}$/.test(title))return '';
 if(/^(?:sum[aá]rio|[ií]ndice|conte[uú]do|table of contents)\s*$/i.test(title))return '';
 const named=/^(?:cap[ií]tulo|chapter|parte|part|se[cç][aã]o|section|unidade|unit|livro)\b/i;
 const front=/^(?:pref[aá]cio|pr[oó]logo|introdu[cç][aã]o|conclus[aã]o|considera[cç][oõ]es finais|bibliografia|refer[eê]ncias|ap[eê]ndice|anexo|posf[aá]cio|agradecimentos)\s*(?::|$)/i;
 const numbered=/^\d{1,2}(?:\.\d{1,2}){0,2}[.)]?\s+[\p{L}].{5,90}$/u;
 const upper=title===title.toLocaleUpperCase('pt-BR')&&
   /[\p{L}]/u.test(title)&&title.split(' ').length>=2&&title.split(' ').length<=10;
 const large=line.size>=line.normal*1.18;
 if(named.test(title)&&(line.localTop<.66||large))return title;
 if(front.test(title)&&(line.localTop<.65||large))return title;
 if(numbered.test(title)&&large&&line.localTop<.5)return title;
 if(upper&&large&&title.length>=12&&title.length<=75&&line.localTop<.32)return title;
 return '';
}
async function textHeadings(c,gen){
 const result=[],seen=new Map(),limit=Math.min(c.pdf.numPages,300);
 let searchable=0;
 for(let start=1;start<=limit;start+=8){
  if(generation!==gen)return [];
  const end=Math.min(limit,start+7);
  const batch=await Promise.all(Array.from({length:end-start+1},(_,i)=>start+i).map(async source=>{
   try{
    const p=await c.pdf.getPage(source);
    const content=await p.getTextContent();
    return {source,lines:textLines(content,p,c,source),hasText:(content.items||[]).some(x=>String(x.str||'').trim())};
   }catch(_){return {source,lines:[],hasText:false}}
  }));
  for(const section of batch){
   if(section.hasText)searchable++;
   if(section.source<=24&&section.lines.some(x=>/^(sum[aá]rio|[ií]ndice|table of contents)$/i.test(x.title)))continue;
   for(const line of section.lines){
    const title=heading(line);
    if(!title)continue;
    const page=logicalPage(c,section.source,line.x,line.y);
    const key=norm(title),prior=seen.get(key)||0;
    if(prior&&page-prior<20)continue;
    seen.set(key,page);
    result.push({title,page,level:0});
    if(result.length>=150)break;
   }
   if(result.length>=150)break;
  }
  if(generation!==gen)return [];
  if(start>=24&&searchable===0)break;
  if(start%24===1&&state&&generation===gen){
   state.status='Identificando seções… '+Math.round(end/limit*100)+'%';
   refreshStatus();
  }
  if(result.length>=150)break;
  await new Promise(resolve=>setTimeout(resolve,0));
 }
 result.sort((a,b)=>a.page-b.page);
 return result;
}
function renderEntries(items,kind){
 const q=norm(state?.query||'');
 const matches=q?items.filter(x=>norm(x.title).includes(q)||String(x.page).includes(q)):items;
 if(!matches.length)return '<p class="psb-toc-empty">Nenhuma correspondência.</p>';
 return '<div class="psb-toc-links">'+matches.map(x=>{
  const padding=' style="--psb-toc-depth:'+Math.max(0,Math.min(3,x.level||0))+'"';
  if(x.missing)return '<div class="psb-toc-entry psb-toc-unavailable" aria-disabled="true"'+padding+'>'+
    '<span class="psb-toc-entry-title">'+esc(x.title)+'</span><span class="psb-toc-entry-page">Indisponível</span></div>';
  return '<button type="button" class="psb-toc-entry" data-psb-toc-page="'+x.page+'" data-psb-toc-kind="'+kind+'"'+padding+'>'+
   '<span class="psb-toc-entry-title">'+esc(x.title)+'</span><span class="psb-toc-entry-page">'+x.page+'</span></button>';
 }).join('')+'</div>';
}
function renderBody(){
 if(!state)return '';
 return state.items.length?
  '<div class="psb-toc-subheading">Capítulos e seções</div>'+renderEntries(state.items,'chapter'):
  '<p class="psb-toc-empty">'+(state.loading?
   'Identificando os capítulos deste livro…':
   'Não foi possível identificar os capítulos com segurança neste arquivo. Em PDFs digitalizados sem texto reconhecível, o sumário depende de marcadores ou de identificação das seções.')+'</p>';
}
function refreshStatus(){
 const el=document.getElementById('psbTocStatus');
 if(el&&state)el.textContent=state.status;
}
function refreshBody(){
 const el=document.getElementById('psbTocBody');
 if(el)el.innerHTML=renderBody();
 sync();
}
function sync(){
 if(!state)return;
 const panel=document.getElementById('psbTocPanel'),c=context();
 if(!panel||!c)return;
 const current=c.currentPage();
 let currentChapter=0;
 for(const item of state.items)if(!item.missing&&item.page<=current)currentChapter=item.page;
 for(const b of panel.querySelectorAll('[data-psb-toc-kind="chapter"]')){
  const selected=Number(b.dataset.psbTocPage)===currentChapter;
  b.classList.toggle('is-current',selected);
  if(selected)b.setAttribute('aria-current','location');
  else b.removeAttribute('aria-current');
 }
}
function setOpen(on){
 if(!state)return;
 state.open=!!on;
 const panel=document.getElementById('psbTocPanel');
 const button=document.querySelector('#psbReader [data-psb-toc-toggle]');
 if(panel)panel.hidden=!state.open;
 if(button)button.setAttribute('aria-expanded',String(state.open));
 if(state.open)sync();
}
function mount(){
 const c=context(),reader=document.getElementById('psbReader');
 if(!c||!reader)return;
 const key=c.book.id+'::'+c.book.path+'::'+c.total;
 if(!state||state.key!==key){
  generation++;
  const cached=readCache(c);
  state={
   key,query:'',open:false,loading:!cached,kind:cached?.kind||'unknown',
   items:cached?.items||[],
   status:cached?'Sumário disponível':'Identificando capítulos…'
  };
  if(cached)state.status=cached.kind==='reviewed'?'Sumário conferido no exemplar':cached.kind==='outline'?'Capítulos do próprio PDF':'Seções identificadas no texto';
  else void build(c,generation);
 }
 const tools=reader.querySelector('.psb-reader-tools');
 if(tools&&!tools.querySelector('[data-psb-toc-toggle]')){
  tools.insertAdjacentHTML('afterbegin','<button type="button" class="psb-toc-toggle" data-psb-toc-toggle aria-expanded="false" aria-controls="psbTocPanel" title="Sumário" aria-label="Abrir sumário do livro">☷ <span>Sumário</span></button>');
 }
 if(!reader.querySelector('#psbTocPanel')){
  reader.insertAdjacentHTML('beforeend',
   '<aside id="psbTocPanel" class="psb-toc-panel" aria-label="Sumário do livro" hidden>'+
   '<header class="psb-toc-header"><div><strong>Sumário</strong><small id="psbTocStatus">'+esc(state.status)+'</small></div>'+
   '<button type="button" data-psb-toc-close aria-label="Fechar sumário">×</button></header>'+
   '<label class="psb-toc-search"><span aria-hidden="true">⌕</span><input type="search" id="psbTocFilter" placeholder="Buscar capítulo ou seção" aria-label="Buscar capítulo no sumário"></label>'+
   '<div class="psb-toc-body" id="psbTocBody">'+renderBody()+'</div></aside>');
 }
 const input=reader.querySelector('#psbTocFilter');
 if(input&&input.value!==state.query)input.value=state.query;
 setOpen(state.open);
 refreshStatus();sync();
 if(!eventsBound){
  eventsBound=true;
  document.addEventListener('click',e=>{
   const root=e.target.closest?.('#psbReader');
   if(!root)return;
   if(e.target.closest('[data-psb-toc-toggle]')){setOpen(!state?.open);return}
   if(e.target.closest('[data-psb-toc-close]')){setOpen(false);return}
   const target=e.target.closest('[data-psb-toc-page]');
   if(target){
    const current=context();
    if(!current)return;
    current.goPage(Number(target.dataset.psbTocPage));
    if(window.innerWidth<820)setOpen(false);
   }
  });
  document.addEventListener('input',e=>{
   if(e.target?.id!=='psbTocFilter'||!state)return;
   state.query=e.target.value;refreshBody();
  });
 }
}
function reviewedChapters(c){
 const source=window.PSICO_BOOK_VERIFIED_TOC?.[c.book.id];
 if(!Array.isArray(source)||!source.length)return null;
 return source.map(entry=>{
  if(entry.missing===true)return {title:String(entry.title),missing:true,level:Number(entry.level)||0};
  const match=Number.isInteger(entry.index)?
   c.leafMap.findIndex(leaf=>leaf.source===entry.source&&leaf.index===entry.index):-1;
  const page=match>=0?match+1:logicalPage(c,entry.source);
  return {title:String(entry.title),page,level:Number(entry.level)||0};
 }).filter(x=>x.title.trim().length>=2&&(x.missing||(Number.isInteger(x.page)&&x.page>=1&&x.page<=c.total)));
}
async function build(c,gen){
 try{
  // Índices conferidos pelo conteúdo do exemplar prevalecem sobre marcadores
  // automáticos, que podem conter autores, referências ou divisões falsas.
  const reviewed=reviewedChapters(c);
  if(generation!==gen)return;
  if(reviewed?.length){
   state.items=reviewed;state.kind='reviewed';state.loading=false;
   state.status=reviewed.some(x=>x.missing)?'Sumário revisado · há capítulos ausentes deste arquivo':'Capítulos e seções conferidos no exemplar';
   writeCache(c,reviewed,'reviewed');
   refreshStatus();refreshBody();return;
  }
  let items=await pdfBookmarks(c,gen),kind='outline';
  if(generation!==gen)return;
  if(!items.length){
   items=await textHeadings(c,gen);
   kind=items.length?'text':'unknown';
  }
  if(generation!==gen||!state)return;
  state.items=items;state.kind=kind;state.loading=false;
  state.status=kind==='outline'?'Capítulos do próprio PDF':
   kind==='text'?'Capítulos e seções identificados no texto':
   'Nenhum capítulo identificado neste PDF';
  if(kind!=='unknown')writeCache(c,items,kind);
  refreshStatus();refreshBody();
 }catch(_){
  if(generation!==gen||!state)return;
  state.items=[];state.kind='unknown';state.loading=false;
  state.status='Não foi possível identificar capítulos neste PDF.';
  refreshStatus();refreshBody();
 }
}
function close(){generation++;state=null}
function isOpen(){return !!state?.open}
window.PSICO_BOOK_TOC={mount,sync,close,isOpen,closePanel:()=>setOpen(false)};
})();