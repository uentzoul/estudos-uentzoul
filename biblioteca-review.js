/* PsicoMoodle — revisão de PDFs antes de publicar: identificação, capa e classificação.
   As consultas de capa usam somente catálogos públicos (Google Books e Open Library).
   Nenhum PDF sai do dispositivo durante a prévia. */
(()=>{
'use strict';
let pdfJsRequest=null;
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim();
const forbidden=/^(untitled|sem t[ií]tulo|documento( \d+)?|microsoft word|adobe|scan(ned)?|pdf|livro)$/i;
const stop=new Set(['de','da','do','das','dos','a','o','as','os','e','em','para','por','um','uma','the','of','and','an','to','volume','vol']);
function cleanTitle(s){
 let t=String(s||'').replace(/\.pdf$/i,'').replace(/[_]+/g,' ').replace(/^(?:livro|ebook|e-book|pdf)[ -_:]+/i,'')
  .replace(/\s*[\[(](?:c[oó]pia|copy|\d+)[\])]\s*$/i,'').replace(/\s+/g,' ').trim();
 if(t===t.toUpperCase()&&t.length>8)t=t.toLocaleLowerCase('pt-BR').replace(/^\p{L}/u,c=>c.toLocaleUpperCase('pt-BR'));
 return t.slice(0,180);
}
function cleanAuthor(s){
 let a=String(s||'').replace(/[;|]+/g,', ').replace(/\s+/g,' ').trim();
 if(forbidden.test(a)||/^unknown|anonymous|autor n[aã]o/i.test(a))return '';
 return a.slice(0,200);
}
function plausible(s){return s&&s.length>3&&!forbidden.test(s)&&!/^(http|file:|c:\/)/i.test(s);}
function titleMatch(query,candidate){
 const x=normalize(query),y=normalize(candidate);
 if(!x||!y)return 0;
 if(x===y)return 1;
 const words=s=>new Set(s.split(' ').filter(w=>w.length>=3&&!stop.has(w)));
 const a=words(x),b=words(y);
 if(!a.size||!b.size)return 0;
 let n=0;for(const w of a)if(b.has(w))n++;
 return n/Math.max(a.size,b.size);
}
function inferSubject(title,author){
 const s=normalize(title+' '+author);
 const rules=[
 [/psicanal|freud|lacan|inconsciente|metapsicolog/, 'Psicanálise'],
 [/historia da psicolog|historico da psicolog|historia social|origens da psicolog/, 'História da psicologia'],
 [/familia|familias|casamento|divorcio|parental|crianca/, 'Psicologia da família'],
 [/grupo|grupos|dinamica grupal/, 'Psicologia de grupos'],
 [/comportament|cognitiv|terapia cognitiva|tcc\b/, 'Teorias e modelos comportamentais e cognitivos'],
 [/social|sociedade|ideolog|libertacao|interseccional|identidade cultural|politica/, 'Psicologia social e direitos'],
 [/avaliacao psicolog|psicometr|testes psicolog|laudo/, 'Avaliação psicológica'],
 [/pesquisa|metodolog|cientific|epistemolog|conhecimento/, 'Pesquisa e metodologia'],
 [/desenvolvimento|vygotsk|piaget|aprendizagem/, 'Psicologia do desenvolvimento'],
 [/filosofia|foucault|hegel|kant/, 'Filosofia e epistemologia']
 ];
 return rules.find(([re])=>re.test(s))?.[1]||'Fundamentos da psicologia';
}
function safeUrl(s){
 try{const u=new URL(String(s||'').replace(/^http:/i,'https:'));return u.protocol==='https:'?u.href:null}catch(_){return null}
}
async function pdfjs(){
 if(window.pdfjsLib)return window.pdfjsLib;
 if(pdfJsRequest)return pdfJsRequest;
 pdfJsRequest=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.async=true;
  script.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  script.onload=()=>window.pdfjsLib?resolve(window.pdfjsLib):reject(Error('Biblioteca PDF.js indisponível.'));
  script.onerror=()=>reject(Error('Não foi possível carregar o leitor de PDF.'));
  document.head.appendChild(script);
 }).then(pdf=>{
  pdf.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  return pdf;
 }).catch(err=>{pdfJsRequest=null;throw err});
 return pdfJsRequest;
}
async function previewPage(page){
 const width=page.getViewport({scale:1}).width;
 const vp=page.getViewport({scale:Math.min(1.2,420/width)});
 const canvas=document.createElement('canvas');
 canvas.width=Math.max(1,Math.round(vp.width));canvas.height=Math.max(1,Math.round(vp.height));
 const ctx=canvas.getContext('2d',{alpha:false});
 if(!ctx)throw Error('Não foi possível criar a prévia.');
 ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
 await page.render({viewport:vp,canvasContext:ctx}).promise;
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.82));
 const jpg=blob?.type==='image/webp'?blob:await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.82));
 if(!jpg||jpg.size<200)throw Error('Prévia vazia.');
 return jpg;
}
function imagesOnPage(op,pdf){
 const ids=[pdf.OPS?.paintImageXObject,pdf.OPS?.paintJpegXObject,pdf.OPS?.paintInlineImageXObject,pdf.OPS?.paintImageXObjectRepeat,pdf.OPS?.paintInlineImageXObjectGroup].filter(x=>typeof x==='number');
 return (op?.fnArray||[]).some(n=>ids.includes(n));
}
function extractIsbn(text){
 const match=String(text||'').match(/ISBN(?:[- ]?(?:10|13))?[:\s-]*((?:97[89][\s-]?)?[\dX][\dX\s-]{8,18})/i);
 if(!match)return '';
 const digits=match[1].replace(/[^\dX]/gi,'');
 return (digits.length===10||digits.length===13)?digits:'';
}
async function lookupGoogle(title,author,isbn){
 const q=isbn?'isbn:'+isbn:'intitle:"'+title.replace(/"/g,'')+'"'+(author?' inauthor:"'+author.replace(/"/g,'')+'"':'');
 const url='https://www.googleapis.com/books/v1/volumes?'+new URLSearchParams({q,maxResults:'6',printType:'books'});
 const response=await fetch(url,{headers:{Accept:'application/json'}});
 if(!response.ok)throw Error('Google Books '+response.status);
 const payload=await response.json();
 return (payload.items||[]).map(x=>{
  const v=x.volumeInfo||{};
  return {title:v.title||'',author:(v.authors||[]).join(', '),
   cover:safeUrl(v.imageLinks?.large||v.imageLinks?.medium||v.imageLinks?.thumbnail?.replace('zoom=1','zoom=2')||''),
   source:'Google Books'};
 }).filter(x=>x.cover);
}
async function lookupOpenLibrary(title,author){
 const params=new URLSearchParams({title,fields:'title,author_name,cover_i,isbn',limit:'7'});
 if(author)params.set('author',author);
 const resp=await fetch('https://openlibrary.org/search.json?'+params,{headers:{Accept:'application/json'}});
 if(!resp.ok)throw Error('Open Library '+resp.status);
 const data=await resp.json();
 return (data.docs||[]).filter(x=>x.cover_i).map(x=>({title:x.title||'',author:(x.author_name||[]).slice(0,2).join(', '),
  cover:'https://covers.openlibrary.org/b/id/'+x.cover_i+'-L.jpg',source:'Open Library'}));
}
async function findCover(title,author,isbn=''){
 if(!plausible(title))return null;
 let results=[];
 const pending=[lookupGoogle(title,author,isbn),lookupOpenLibrary(title,author)];
 const settled=await Promise.allSettled(pending);
 for(const s of settled)if(s.status==='fulfilled')results.push(...s.value);
 const ranked=results.map(x=>{
  const similarity=titleMatch(title,x.title);
  const a=normalize(author),b=normalize(x.author);
  const matchesAuthor=!a||!b||a.split(' ').some(w=>w.length>3&&b.includes(w));
  return {...x,similarity,valid:similarity>=.72&&matchesAuthor};
 }).filter(x=>x.valid).sort((a,b)=>b.similarity-a.similarity);
 return ranked[0]||null;
}
async function analyze(file,previous={}){
 const data={title:cleanTitle(previous.title||file.name),author:cleanAuthor(previous.author||''),
  subject:previous.subject||'',pageCover:null,hasCover:false,foundCover:null,pages:null,warnings:[],isbn:''};
 const signature=await file.slice(0,5).text();
 if(signature!=='%PDF-')throw Error('Este arquivo não é um PDF válido.');
 let pdf=null;
 try{
  const lib=await pdfjs();
  pdf=await lib.getDocument({data:new Uint8Array(await file.arrayBuffer()),useSystemFonts:true}).promise;
  data.pages=pdf.numPages;
  const meta=await pdf.getMetadata().catch(()=>null);
  const mt=cleanTitle(meta?.info?.Title||meta?.metadata?.get?.('dc:title')||'');
  const ma=cleanAuthor(meta?.info?.Author||meta?.metadata?.get?.('dc:creator')||'');
  if(plausible(mt)&&!forbidden.test(mt)&&!/^microsoft|documento|scanner/i.test(mt))data.title=mt;
  if(ma)data.author=ma;
  let content='';
  for(let n=1;n<=Math.min(2,pdf.numPages);n++){
   const page=await pdf.getPage(n);
   const text=await page.getTextContent().catch(()=>({items:[]}));
   const pageText=(text.items||[]).map(x=>x.str||'').filter(Boolean).join(' ');
   content+=' '+pageText;
   if(n===1){
    const ops=await page.getOperatorList().catch(()=>null);
    const image=imagesOnPage(ops,lib);
    const shortText=pageText.trim().length<600;
    // O PDF pode começar com a folha de rosto; a seleção é mostrada ao administrador.
    data.hasCover=image&&shortText||pageText.trim().length>25&&pageText.trim().length<155;
    data.pageCover=await previewPage(page).catch(()=>null);
   }
  }
  data.isbn=extractIsbn(content);
  if(!data.author&&/\b(?:por|autor(?:a)?|organi[sz]ador(?:a)?)\b/i.test(content.slice(0,750))){
   const guess=content.slice(0,750).match(/(?:por|autora?|organizadores?)\s*[:\-]?\s*([\p{L}. -]{7,90})/iu);
   if(guess)data.author=cleanAuthor(guess[1].split(/\s+(?:ISBN|Edi[çc][ãa]o|Editora|Resumo|Cap[ií]tulo)\b/i)[0]);
  }
 }catch(err){data.warnings.push('Não foi possível examinar todas as páginas automaticamente. Confere título, autor e capa: '+(err.message||'erro de leitura'));}
 finally{if(pdf)await pdf.destroy().catch(()=>{});}
 if(!data.subject)data.subject=inferSubject(data.title,data.author);
 // Quando a primeira página é capa, usa o documento como fonte principal.
 // Caso contrário, procura a imagem editorial nos catálogos de livros.
 if(!data.hasCover) data.foundCover=await findCover(data.title,data.author,data.isbn).catch(()=>null);
 if(!data.hasCover&&!data.foundCover)data.warnings.push('Capa não identificada. Podes usar a primeira página ou informar um link de capa.');
 if(!data.author)data.warnings.push('Autor não identificado automaticamente. Preenche o nome antes de publicar.');
 return data;
}
window.PSICO_BOOK_REVIEW={analyze,findCover,cleanTitle,cleanAuthor,inferSubject,titleMatch};
})();
