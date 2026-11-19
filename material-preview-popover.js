/* Prévia leve dos arquivos de Materiais e Textos — sem renderização de PDF ao passar o mouse. */
(()=>{
'use strict';
if(window.UentzoulMaterialPreviews)return;
const BUCKET='uentzoul-library-files',TABLE='uentzoul_library_uploads',DELAY=500;
const auth=()=>window.uentzoulAIAuth, client=()=>auth()?.client?.(), admin=()=>window.uentzoulAdminConfig?.isAdmin?.()===true;
const clean=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const cachedUrls=new Map(),attempted=new Set();
let activeCard=null,timer=null,token=0,pop=null,pdfLoader=null,backfillRunning=false,backfillDelay=0;
function rowFor(key){return window.uentzoulLibraryManager?.previewRecord?.(key)||window.uentzoulLibraryApp?.record?.(key)||null;}
function titleFor(card){return (card.querySelector('.docname,.doc-title,.file-title')?.textContent||card.querySelector('a[data-library-file]')?.textContent||card.textContent||'Material').trim().replace(/\s+/g,' ').slice(0,160);}
function metadata(card){
 const anchor=card.querySelector('a[data-library-file]');
 const key=anchor?.dataset.libraryFile||'';
 const row=key?rowFor(key):null;
 const title=titleFor(card);
 const name=String(row?.filename||anchor?.getAttribute('href')||title||'');
 const ext=(name.match(/\.(pdf|pptx|docx)(?:[?#]|$)/i)||[])[1]?.toUpperCase()||(/powerpoint|slides/i.test(name)?'SLIDES':'ARQUIVO');
 const tags=(Array.isArray(row?.content_tags)?row.content_tags:[]).filter(t=>typeof t==='string'&&!t.startsWith('psicomoodle:')).slice(0,3);
 const summary=String(row?.content_summary||'').trim();
 const excerpt=summary.includes('Amostra:')?summary.split('Amostra:').slice(1).join('Amostra:').trim():summary;
 const topics=summary.match(/Conteúdo identificado:\s*([^.]*)/i)?.[1]||tags.join(', ');
 return {key,row,title,ext,excerpt,topics};
}
function element(){
 if(pop)return pop;
 pop=document.createElement('div');
 pop.id='pm-document-hover-preview';
 pop.className='pm-document-hover-preview';
 pop.setAttribute('role','tooltip');
 pop.hidden=true;
 document.body.appendChild(pop);
 return pop;
}
function hide(){
 clearTimeout(timer);timer=null;activeCard=null;token++;
 if(pop){pop.hidden=true;pop.replaceChildren();}
}
function placement(card){
 if(!pop||pop.hidden||!card?.isConnected)return;
 const box=card.getBoundingClientRect(),width=pop.offsetWidth||370,height=pop.offsetHeight||360,gap=14;
 let left=box.right+gap;
 if(left+width>innerWidth-12)left=box.left-width-gap;
 if(left<12)left=Math.max(12,Math.min(innerWidth-width-12,box.left));
 let top=Math.max(12,Math.min(box.top,innerHeight-height-12));
 pop.style.left=Math.round(left)+'px';pop.style.top=Math.round(top)+'px';
}
function coverMarkup(m){
 return '<div class="pm-preview-cover"><span class="pm-preview-cover-type">'+clean(m.ext)+'</span><strong>'+clean(m.title)+'</strong>'+
 '<span class="pm-preview-cover-summary">'+clean(m.topics||m.excerpt||'Confira o documento para ver o conteúdo completo.').slice(0,190)+'</span>'+
 '<small>Informações do arquivo</small></div>';
}
async function urlFor(path){
 const v=cachedUrls.get(path);
 if(v&&v.until>Date.now())return v.url;
 const c=client();if(!c)return '';
 const response=await c.storage.from(BUCKET).createSignedUrl(path,3600);
 if(response.error||!response.data?.signedUrl)return '';
 cachedUrls.set(path,{url:response.data.signedUrl,until:Date.now()+45*60*1000});
 return response.data.signedUrl;
}
async function imageFor(m,expected){
 if(!m.row?.preview_path)return;
 try{
  const url=await urlFor(m.row.preview_path);
  if(!url||expected!==token||!pop||pop.hidden)return;
  const img=new Image();
  img.alt='Imagem de uma página representativa do documento '+m.title;
  img.decoding='async';
  img.onload=()=>{
   if(expected!==token||!activeCard?.isConnected||!pop||pop.hidden)return;
   const surface=pop.querySelector('.pm-preview-visual');
   if(surface){surface.replaceChildren(img);surface.classList.add('pm-preview-has-image');placement(activeCard);}
  };
  img.src=url;
 }catch(e){console.warn('Miniatura indisponível; mantendo resumo do arquivo.',e);}
}
function show(card){
 if(activeCard!==card||!card.isConnected||document.hidden)return;
 const m=metadata(card),expected=token,el=element();
 const subtitle=m.topics&&m.excerpt&&m.topics!==m.excerpt?m.topics:m.excerpt;
 el.innerHTML='<div class="pm-preview-head"><span class="pm-preview-kicker">PRÉVIA DO MATERIAL</span><span class="pm-preview-format">'+clean(m.ext)+'</span></div>'+
 '<div class="pm-preview-visual">'+coverMarkup(m)+'</div>'+
 '<div class="pm-preview-foot"><strong>'+clean(m.title)+'</strong>'+
 (subtitle?'<p>'+clean(subtitle).slice(0,195)+'</p>':'')+
 '<span class="pm-preview-hint">Clique no material para abrir o arquivo completo</span></div>';
 el.hidden=false;placement(card);
 imageFor(m,expected);
}
function eligible(target){
 const card=target?.closest?.('#docs .doc-compact, .s1-library-organized .doc-compact, .library-page .course-detail-resources .doc-compact');
 if(!card||card.closest('.pm-is-editing')||!card.querySelector('a[href]'))return null;
 return card;
}
function begin(card){
 if(activeCard===card)return;
 hide();activeCard=card;const expected=token;
 timer=setTimeout(()=>{if(activeCard===card&&token===expected)show(card);},DELAY);
}
document.addEventListener('pointerover',e=>{
 if(e.pointerType&&e.pointerType!=='mouse'&&e.pointerType!=='pen')return;
 const card=eligible(e.target);
 if(card)begin(card);
});
document.addEventListener('pointerout',e=>{
 if(activeCard&&activeCard.contains(e.target)&&!activeCard.contains(e.relatedTarget))hide();
});
document.addEventListener('focusin',e=>{const card=eligible(e.target);if(card)begin(card);});
document.addEventListener('focusout',e=>{if(activeCard&&activeCard.contains(e.target)&&!activeCard.contains(e.relatedTarget))hide();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')hide();});
document.addEventListener('click',()=>hide(),true);
window.addEventListener('scroll',()=>{if(activeCard)hide();},{passive:true,capture:true});
window.addEventListener('resize',hide,{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden)hide();});
window.addEventListener('uentzoul:semester',hide);
window.addEventListener('uentzoul:material-placements-updated',hide);

function canvasBlob(canvas){
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Não foi possível criar a imagem.')),'image/webp',0.78));
}
function loader(){
 if(window.pdfjsLib?.getDocument)return Promise.resolve(window.pdfjsLib);
 if(pdfLoader)return pdfLoader;
 pdfLoader=new Promise((resolve,reject)=>{
  const tag=document.createElement('script');
  tag.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  tag.onload=()=>window.pdfjsLib?.getDocument?resolve(window.pdfjsLib):reject(Error('Leitor de PDF indisponível'));
  tag.onerror=()=>reject(Error('Não foi possível carregar o leitor de PDF'));
  document.head.appendChild(tag);
 }).catch(err=>{pdfLoader=null;throw err;});
 return pdfLoader;
}
async function pdfImage(file,title){
 const pdfjs=await loader();
 pdfjs.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
 const pdf=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),disableFontFace:true}).promise;
 try{
  let chosen=1,best=-9999;
  const slides=/slides|apresenta[cç][aã]o|aula\s|\.ppt/i.test(title);
  const samples=Math.min(pdf.numPages,slides?5:3);
  for(let number=1;number<=samples;number++){
   let page;
   try{
    page=await pdf.getPage(number);
    const content=await page.getTextContent();
    const text=content.items.map(item=>item.str||'').join(' ').trim();
    const words=text.split(/\s+/).filter(Boolean).length;
    // Artigos privilegiam o título; apresentações privilegiam um slide de conteúdo.
    const score=slides?(words>=12&&words<=160?25:0)+(number===2?9:0)-Math.abs(words-75)/13:
      (number===1?32:0)+(words>=25?8:0)-Math.max(0,words-520)/25;
    if(score>best){best=score;chosen=number;}
   }catch(_){}
   finally{page?.cleanup();}
  }
  const page=await pdf.getPage(chosen),original=page.getViewport({scale:1});
  const scale=Math.min(900/original.width,1250/original.height,2);
  const viewport=page.getViewport({scale:scale});
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(viewport.width));
  canvas.height=Math.max(1,Math.round(viewport.height));
  const context=canvas.getContext('2d',{alpha:false});
  if(!context)throw Error('Canvas indisponível');
  context.fillStyle='#ffffff';context.fillRect(0,0,canvas.width,canvas.height);
  await page.render({canvasContext:context,viewport,background:'#ffffff'}).promise;
  const blob=await canvasBlob(canvas);
  canvas.width=canvas.height=1;page.cleanup();
  return blob;
 }finally{await pdf.destroy();}
}
function wrap(ctx,text,x,y,width,lineHeight,limit){
 const words=String(text||'').split(/\s+/).filter(Boolean);let line='',count=0;
 for(const word of words){
  const candidate=line?line+' '+word:word;
  if(ctx.measureText(candidate).width>width&&line){
   ctx.fillText(line,x,y);y+=lineHeight;count++;line=word;
   if(count>=limit)return y;
  }else line=candidate;
 }
 if(line&&count<limit)ctx.fillText(line,x,y);
 return y+lineHeight;
}
async function textImage(file,opts){
 const canvas=document.createElement('canvas');canvas.width=900;canvas.height=620;
 const ctx=canvas.getContext('2d',{alpha:false});
 ctx.fillStyle='#f5f4f8';ctx.fillRect(0,0,900,620);
 ctx.fillStyle='#fff';ctx.fillRect(48,42,804,536);
 ctx.fillStyle='#635ca5';ctx.fillRect(48,42,8,536);
 ctx.fillStyle='#60598a';ctx.font='700 18px Arial, sans-serif';
 ctx.fillText(/pptx/i.test(file.name)?'APRESENTAÇÃO':/docx/i.test(file.name)?'DOCUMENTO':'MATERIAL',86,100);
 ctx.fillStyle='#28263d';ctx.font='bold 38px Arial, sans-serif';
 const y=wrap(ctx,opts.title||file.name,86,164,705,46,4);
 ctx.fillStyle='#55536b';ctx.font='22px Arial, sans-serif';
 const summary=String(opts.summary||'').replace(/Conteúdo identificado:\s*/i,'').replace(/Amostra:/i,' — ');
 wrap(ctx,summary||'Prévia de leitura. Abra o arquivo para conferir a formatação original.',86,Math.max(290,y+25),705,36,7);
 ctx.fillStyle='#7b778e';ctx.font='18px Arial, sans-serif';
 ctx.fillText('Resumo visual • formato original disponível ao abrir',86,541);
 return canvasBlob(canvas);
}
async function saveFromFile(file,opts){
 const c=client(),user=auth()?.user?.();
 if(!c||!user||!admin()||!file||!opts?.resourceKey||!opts.storagePath)return false;
 if(!/\.(pdf|docx|pptx)$/i.test(file.name||opts.storagePath))return false;
 const old=rowFor(opts.resourceKey);
 if(old?.preview_path)return true;
 let blob;
 if((file.name||opts.storagePath).toLowerCase().endsWith('.pdf'))blob=await pdfImage(file,opts.title||file.name);
 else blob=await textImage(file,opts);
 const path='materials/scheduled/previews/'+crypto.randomUUID()+'.webp';
 const uploaded=await c.storage.from(BUCKET).upload(path,blob,{cacheControl:'31536000',contentType:'image/webp',upsert:false});
 if(uploaded.error)throw uploaded.error;
 const updated=await c.from(TABLE).update({preview_path:path}).eq('resource_key',opts.resourceKey).is('preview_path',null).select('resource_key,preview_path');
 if(updated.error||!updated.data?.length){
  await c.storage.from(BUCKET).remove([path]).catch(()=>{});
  if(updated.error)throw updated.error;
  return !!rowFor(opts.resourceKey)?.preview_path;
 }
 window.uentzoulLibraryManager?.notePreview?.(opts.resourceKey,path);
 window.dispatchEvent(new CustomEvent('uentzoul:material-preview-ready',{detail:{key:opts.resourceKey}}));
 return true;
}
window.addEventListener('uentzoul:material-preview-ready',event=>{
 if(!activeCard||!pop||pop.hidden)return;
 const m=metadata(activeCard);
 if(m.key&&m.key===event.detail?.key)imageFor(m,token);
});
// Material antigo: somente o administrador baixa a fonte, uma vez, fora do fluxo de hover.
// O orçamento evita que centenas de PDFs sejam baixados em uma única visita.
async function backfill(){
 if(backfillRunning||!admin()||document.hidden)return;
 const rows=window.uentzoulLibraryManager?.previewItems?.()||[];
 if(!rows.length)return;
 backfillRunning=true;
 let processed=0,bytes=0;
 try{
  for(const row of rows){
   if(!admin()||document.hidden||processed>=24||bytes>=100*1024*1024)break;
   if(!row?.storage_path||row.preview_path||attempted.has(row.resource_key))continue;
   if(!/\.(pdf|docx|pptx)$/i.test(row.storage_path))continue;
   attempted.add(row.resource_key);
   const size=Number(row.size_bytes)||0;
   if(size>16*1024*1024)continue;
   try{
    const result=await client().storage.from(BUCKET).download(row.storage_path);
    if(result.error||!result.data)throw result.error||Error('Documento indisponível');
    bytes+=size;processed++;
    const file=new File([result.data],row.filename||row.storage_path.split('/').pop(),{type:row.mime_type||result.data.type});
    await saveFromFile(file,{resourceKey:row.resource_key,storagePath:row.storage_path,title:row.display_title||row.filename,summary:row.content_summary});
   }catch(err){console.warn('Não foi possível gerar miniatura para',row.resource_key,err?.message||err);}
   await new Promise(resolve=>setTimeout(resolve,4500));
  }
 }finally{backfillRunning=false;}
}
function planBackfill(){
 if(backfillDelay)clearTimeout(backfillDelay);
 backfillDelay=setTimeout(()=>{backfillDelay=0;backfill();},18000);
}
window.addEventListener('uentzoul:library-updated',planBackfill);
window.addEventListener('uentzoul:auth',planBackfill);
window.UentzoulMaterialPreviews={saveFromFile,backfill,previewRecord:rowFor};
planBackfill();
})();