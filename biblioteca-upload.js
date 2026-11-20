/* PsicoMoodle — Álbum de envios de livros, restrito ao administrador.
   Os PDFs são enviados ao bucket privado existente. O catálogo adicional
   reside no Supabase, nunca na memória do navegador ou no GitHub. */
(()=>{
'use strict';
const TABLE='uentzoul_book_catalog';
const BUCKET='uentzoul-library-files';
const MAX_BYTES=50*1024*1024;
let uploaded=[],queue=[],busy=false,loading=false,loaded=false,owner='',notice='',refresh=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const auth=()=>window.uentzoulAIAuth;
const userId=()=>auth()?.user?.()?.id||'';
const hasAccess=()=>Boolean(userId()&&window.uentzoulAdminConfig?.isAdmin?.());
const canRead=()=>Boolean(userId());
const client=()=>auth()?.client?.();
const sizeText=size=>(size/1024/1024).toLocaleString('pt-BR',{maximumFractionDigits:1})+' MB';
function safeCover(s){
 try{const u=new URL(String(s||'').trim());return u.protocol==='https:'?u.href:null}catch(_){return null;}
}
function books(){return canRead()?uploaded.slice():[];}
function toBook(row){
 if(!row||!/^materials\/scheduled\/books\/[a-f0-9-]{36}[.]pdf$/.test(String(row.storage_path||'')))return null;
 return {id:'album-'+row.id,title:String(row.title||'Sem título'),
  author:String(row.author||'Autor não informado'),subject:String(row.subject||'Acervo enviado'),
  path:row.storage_path,part:!!row.part,cover:safeCover(row.cover_url),coverPath:row.cover_path||null,
  colors:['#4e4b77','#8679a7','#f0e6f8'],newBook:true};
}
async function load(onChange,force=false){
 if(typeof onChange==='function')refresh=onChange;
 if(!canRead()){uploaded=[];loaded=false;owner='';return;}
 const uid=userId();
 if(owner!==uid){owner=uid;uploaded=[];loaded=false;notice='';queue=[];}
 if(loading||(loaded&&!force))return;
 const c=client();if(!c)return;
 loading=true;
 try{
  const {data,error}=await c.from(TABLE)
   .select('id,title,author,subject,storage_path,filename,size_bytes,cover_url,cover_path,part,created_at')
   .order('created_at',{ascending:false});
  if(error)throw error;
  if(!canRead()||uid!==userId())return;
  uploaded=(data||[]).map(toBook).filter(Boolean);
  // As capas extraídas do PDF ficam no bucket privado, com links assinados por sessão.
  await Promise.all(uploaded.map(async book=>{
   if(!book.coverPath)return;
   try{
    const signed=await c.storage.from(BUCKET).createSignedUrl(book.coverPath,3600);
    if(!signed.error&&signed.data?.signedUrl)book.cover=signed.data.signedUrl;
   }catch(_){}
  }));
  loaded=true;
  if(refresh)refresh();
 }catch(error){
  if(uid===userId()){loaded=true;notice='Não foi possível consultar os livros enviados: '+(error?.message||'erro de conexão');}
 }finally{loading=false;}
}
function defaultTitle(name){
 return String(name||'Livro sem título').replace(/[.]pdf$/i,'').replace(/[_]+/g,' ').replace(/\s+/g,' ').trim().slice(0,180);
}

function forgetCover(item){
 if(item?.previewUrl){URL.revokeObjectURL(item.previewUrl);item.previewUrl=null;}
}
const reviewTool=()=>window.PSICO_BOOK_REVIEW;
async function reviewItem(item){
 if(!item||item.status==='error'||!hasAccess())return;
 const token=item.reviewToken=(item.reviewToken||0)+1;
 item.status='analyzing';item.error='';syncQueue();
 try{
  const review=await reviewTool()?.analyze?.(item.file,{title:item.title,author:item.author,subject:item.subject});
  if(!review||!queue.includes(item)||token!==item.reviewToken||!hasAccess())return;
  if(!item.edited?.has('title'))item.title=review.title||item.title;
  if(!item.edited?.has('author'))item.author=review.author||'';
  if(!item.edited?.has('subject'))item.subject=review.subject||'Fundamentos da psicologia';
  item.pages=review.pages;
  item.pdfCoverBlob=review.pageCover;
  item.previewUrl=review.pageCover?URL.createObjectURL(review.pageCover):null;
  item.pdfHasCover=!!review.hasCover;
  item.foundCover=review.foundCover||null;
  item.reviewWarnings=review.warnings||[];
  item.coverMode=review.hasCover&&review.pageCover?'pdf':review.foundCover?'found':'none';
  if(item.coverMode==='found'&&!item.edited?.has('coverUrl'))item.coverUrl=review.foundCover.cover;
  item.status='review';
 }catch(err){
  if(!queue.includes(item)||token!==item.reviewToken)return;
  item.status='review';
  item.reviewWarnings=['A análise automática falhou: '+(err?.message||'falha de leitura')+'. Confere os dados manualmente.'];
  item.subject=item.subject||reviewTool()?.inferSubject?.(item.title,item.author)||'Fundamentos da psicologia';
 }
 syncQueue();
}
async function findCoverAgain(item){
 if(!item||!hasAccess()||busy||item.status==='analyzing')return;
 item.searching=true;syncQueue();
 try{
  const found=await reviewTool()?.findCover?.(item.title.trim(),item.author.trim());
  if(!queue.includes(item)||!hasAccess())return;
  item.foundCover=found||null;
  if(found){item.coverMode='found';item.coverUrl=found.cover;item.reviewWarnings=(item.reviewWarnings||[]).filter(w=>!w.includes('Capa não identificada'));}
  else item.reviewWarnings=[...(item.reviewWarnings||[]).filter(w=>!w.includes('Nenhuma capa externa')),'Nenhuma capa externa foi identificada com segurança.'];
 }catch(err){item.reviewWarnings=[...(item.reviewWarnings||[]),'Busca de capa indisponível: '+(err?.message||'erro de rede')];}
 finally{item.searching=false;syncQueue();}
}
function listFiles(list){
 if(!hasAccess()||busy)return;
 const incoming=Array.from(list||[]).slice(0,20);
 for(const file of incoming){
  if(queue.some(x=>x.file===file))continue;
  const invalid=!/\.pdf$/i.test(file.name)||file.type&&file.type!=='application/pdf'?
   'Seleciona um PDF válido.':file.size>MAX_BYTES?
   'Arquivo acima de 50 MB. O plano Free não permite este envio.':file.size<100?
   'O arquivo está vazio ou incompleto.':'';
  const item={key:crypto.randomUUID(),file,title:defaultTitle(file.name),author:'',subject:'',part:false,
   coverUrl:'',status:invalid?'error':'analyzing',error:invalid,edited:new Set(),
   reviewed:false,coverMode:'none',pdfCoverBlob:null,previewUrl:null,foundCover:null,
   pdfHasCover:false,pages:null,reviewWarnings:[],searching:false};
  queue.push(item);
  if(!invalid)void reviewItem(item);
 }
 syncQueue();
}
function queueMarkup(){
 if(!queue.length)return '<p class="psb-album-blank">Seleciona um ou mais PDFs para preparar os livros.</p>';
 return queue.map(item=>'<article class="psb-album-item" data-upload-item="'+esc(item.key)+'">'+
  '<div class="psb-album-file"><span class="psb-album-pdf" aria-hidden="true">PDF</span><div><strong>'+esc(item.file.name)+'</strong><small>'+sizeText(item.file.size)+'</small></div>'+
  '<button type="button" data-psb-remove="'+esc(item.key)+'" '+(busy?'disabled':'')+' aria-label="Remover arquivo">×</button></div>'+
  '<div class="psb-album-review"><div class="psb-album-cover-preview">'+
   (item.coverMode==='pdf'&&item.previewUrl?'<img src="'+esc(item.previewUrl)+'" alt="Prévia da capa extraída do PDF">':
    item.coverMode==='found'&&safeCover(item.coverUrl)?'<img src="'+esc(safeCover(item.coverUrl))+'" alt="Capa encontrada para conferência" loading="lazy">':
    '<span class="psb-album-no-cover">Capa não selecionada</span>')+
  '</div><div class="psb-album-review-data"><strong>Revisão antes de publicar</strong><span>'+
   (item.status==='analyzing'?'Examinando PDF, título, autor e capa…':
    item.pdfHasCover&&item.coverMode==='pdf'?'Capa obtida do próprio PDF':
    item.coverMode==='found'?'Capa encontrada em catálogo — confere se é a edição correta':
    'Sem capa selecionada — a estante usará capa padrão')+'</span>'+
   (item.pages?'<small>'+item.pages+' páginas identificadas</small>':'')+
   '<div class="psb-album-cover-choices">'+
   (item.previewUrl?'<button type="button" data-psb-cover-mode="pdf" data-psb-key="'+esc(item.key)+'" '+(item.coverMode==='pdf'?'aria-pressed="true"':'')+'>Usar 1ª página do PDF</button>':'')+
   (item.foundCover?'<button type="button" data-psb-cover-mode="found" data-psb-key="'+esc(item.key)+'" '+(item.coverMode==='found'?'aria-pressed="true"':'')+'>Capa encontrada</button>':'')+
   '<button type="button" data-psb-find-cover="'+esc(item.key)+'" '+(item.searching||item.status==='analyzing'?'disabled':'')+'>'+(item.searching?'Procurando…':'Buscar outra capa')+'</button>'+
   '<button type="button" data-psb-cover-mode="none" data-psb-key="'+esc(item.key)+'" '+(item.coverMode==='none'?'aria-pressed="true"':'')+'>Sem capa</button></div></div></div>'+
   (item.reviewWarnings?.length?'<div class="psb-album-review-warnings">'+item.reviewWarnings.map(w=>'<p>'+esc(w)+'</p>').join('')+'</div>':'')+
   '<div class="psb-album-fields"><label>Título do livro<input type="text" maxlength="180" required data-psb-field="title" data-psb-key="'+esc(item.key)+'" value="'+esc(item.title)+'"></label>'+
  '<label>Autor ou organizador<input type="text" maxlength="200" data-psb-field="author" data-psb-key="'+esc(item.key)+'" value="'+esc(item.author)+'" placeholder="Autor não informado"></label>'+
  '<label>Assunto<input type="text" maxlength="120" data-psb-field="subject" data-psb-key="'+esc(item.key)+'" value="'+esc(item.subject)+'" placeholder="Acervo enviado"></label>'+
  '<label>Link da capa (opcional, HTTPS)<input type="url" maxlength="1800" data-psb-field="coverUrl" data-psb-key="'+esc(item.key)+'" value="'+esc(item.coverUrl)+'" placeholder="https://..."></label></div>'+
  '<label class="psb-album-excerpt"><input type="checkbox" data-psb-field="part" data-psb-key="'+esc(item.key)+'" '+(item.part?'checked':'')+'> É um trecho, não o livro completo</label>'+
  '<label class="psb-album-confirm"><input type="checkbox" data-psb-confirm="'+esc(item.key)+'" '+(item.reviewed?'checked':'')+' '+(item.status!=='review'?'disabled':'')+'> Revisei o título, o autor, o assunto e a capa. Autorizo o envio deste livro.</label>'+
  '<p class="psb-album-state'+(item.status==='error'?' is-error':item.status==='done'?' is-success':'')+'" role="status">'+
  esc(item.error||({analyzing:'Analisando o PDF no dispositivo…',review:'Aguardando tua confirmação',uploading:'Enviando PDF…',saving:'Registrando na estante…',done:'Livro adicionado à Biblioteca'}[item.status]||'Preparando…'))+'</p></article>').join('');
}
function currentBooks(){
 if(!uploaded.length)return '<p class="psb-album-blank">Nenhum livro enviado por aqui ainda.</p>';
 return '<div class="psb-album-history">'+uploaded.map(book=>'<div class="psb-album-history-item"><span class="psb-album-history-icon">▤</span><div><strong>'+esc(book.title)+'</strong><small>'+esc(book.author)+' · '+esc(book.subject)+'</small></div></div>').join('')+'</div>';
}
function render(){
 if(!hasAccess())return '<section class="panel"><h2>Acesso restrito</h2></section>';
 return '<div class="psb-subhead"><div><button type="button" data-psb-tab="home" class="psb-back">‹ Biblioteca</button>'+
  '<h2>Álbum de novos livros</h2><p>Seleciona os PDFs. A Biblioteca analisa título, autor, assunto e capa antes de permitir o envio, e tu confirmas cada obra.</p></div>'+
  '<span class="psb-count">Administrador</span></div>'+
  '<section class="psb-album-panel"><div class="psb-album-panel-head"><div><h3>Adicionar PDFs</h3><p>Podes selecionar vários livros de uma vez ou arrastá-los para cá.</p></div><span class="psb-album-limit">Até 50 MB por PDF</span></div>'+
  '<label class="psb-album-drop" id="psbAlbumDrop"><span class="psb-album-drop-icon" aria-hidden="true">↑</span><strong>Selecionar livros do dispositivo</strong>'+
  '<span>PDF · clica ou arrasta os arquivos</span><input id="psbAlbumInput" type="file" accept=".pdf,application/pdf" multiple aria-label="Selecionar arquivos PDF"></label>'+
  '<div class="psb-album-info">Primeiro analisamos os PDFs no teu dispositivo e procuramos a capa quando necessário. Nada é enviado antes da tua confirmação. O limite é de 50 MB por PDF no Supabase Free.</div>'+
  '<div id="psbUploadQueue" class="psb-album-queue">'+queueMarkup()+'</div>'+
  '<div class="psb-album-actions"><p id="psbAlbumNotice" role="status" aria-live="polite">'+esc(notice)+'</p>'+
  '<button type="button" class="psb-album-send" id="psbAlbumSend" data-psb-submit '+(busy||!queue.some(x=>x.status==='review'&&x.reviewed)?'disabled':'')+'>'+
  (busy?'Enviando livros…':'Confirmar e enviar livros')+'</button></div></section>'+
  '<section class="psb-album-library"><div class="psb-album-library-head"><div><h3>Livros enviados</h3><p>Os títulos cadastrados neste álbum ficam salvos no acervo.</p></div>'+
  '<button type="button" data-psb-tab="books">Ver na estante</button></div>'+
  (loading?'<p class="psb-album-blank">Carregando catálogo…</p>':currentBooks())+'</section>';
}
function syncQueue(){
 const box=document.getElementById('psbUploadQueue');if(box)box.innerHTML=queueMarkup();
 const send=document.getElementById('psbAlbumSend');
 if(send){send.disabled=busy||!queue.some(x=>x.status==='review'&&x.reviewed);send.textContent=busy?'Enviando livros…':'Confirmar e enviar livros';}
 const msg=document.getElementById('psbAlbumNotice');if(msg)msg.textContent=notice;
}
function uploadMessage(error){
 const str=String(error?.message||error||'O servidor recusou o envio.');
 return /quota|storage.*limit|exceed|payload.*large|413|maximum.*size|too large|limit.*file/i.test(str)?
  'O Supabase recusou o arquivo por tamanho ou quota. No plano Free, o limite é 50 MB por PDF e 1 GB de armazenamento incluído.':str;
}
async function send(){
 if(!hasAccess()||busy)return;
 const c=client();if(!c)return;
 const targets=queue.filter(x=>x.status==='review'&&x.reviewed);
 if(!targets.length)return;
 busy=true;notice='Enviando '+targets.length+(targets.length===1?' livro…':' livros…');syncQueue();
 let ok=0,fail=0;
 for(const item of targets){
  let path='',coverPath='';
  try{
   if(!hasAccess())throw Error('Acesso de administrador encerrado.');
   const title=item.title.trim(),author=item.author.trim();
   const subject=item.subject.trim()||'Acervo enviado';
   if(!title||!author||title.length>180||author.length>200||subject.length>120)throw Error('Preenche e confere título, autor e assunto antes de enviar.');
   if(!/\.pdf$/i.test(item.file.name)||item.file.size>MAX_BYTES||item.file.size<100)throw Error('O arquivo deve ser um PDF de até 50 MB.');
   if(item.file.type&&item.file.type!=='application/pdf')throw Error('O arquivo selecionado não é um PDF.');
   const signature=await item.file.slice(0,5).text();
   if(signature!=='%PDF-')throw Error('Este arquivo não possui um cabeçalho PDF válido.');
   const cover=item.coverMode==='found'?String(item.coverUrl||'').trim():'';
   if(cover&&!safeCover(cover))throw Error('O link de capa precisa começar com https://');
   if(item.coverMode==='pdf'&&!item.pdfCoverBlob)throw Error('A imagem da capa do PDF não está disponível. Faz a revisão novamente.');
   item.error='';item.status='uploading';syncQueue();
   path='materials/scheduled/books/'+crypto.randomUUID()+'.pdf';
   const sent=await c.storage.from(BUCKET).upload(path,item.file,{contentType:'application/pdf',upsert:false,cacheControl:'3600'});
   if(sent.error)throw sent.error;
   if(!hasAccess())throw Error('Acesso encerrado antes do cadastro.');
   if(item.coverMode==='pdf'){
    const image=item.pdfCoverBlob;
    const ext=image.type==='image/webp'?'webp':'jpg';
    coverPath='materials/scheduled/books/covers/'+crypto.randomUUID()+'.'+ext;
    const coverUpload=await c.storage.from(BUCKET).upload(coverPath,image,{contentType:image.type||'image/jpeg',upsert:false,cacheControl:'3600'});
    if(coverUpload.error)throw coverUpload.error;
   }
   item.status='saving';syncQueue();
   const record={title,author,subject,filename:item.file.name.slice(0,255),
    storage_path:path,size_bytes:item.file.size,part:!!item.part,
    cover_url:cover?safeCover(cover):null,cover_path:coverPath||null,uploaded_by:userId()};
   const added=await c.from(TABLE).insert(record).select('id').single();
   if(added.error)throw added.error;
   path='';coverPath='';item.status='done';ok++;
  }catch(error){
   // Um PDF nunca fica pendurado quando a capa ou o cadastro falhar.
   const leftovers=[path,coverPath].filter(Boolean);
   if(leftovers.length)try{await c.storage.from(BUCKET).remove(leftovers);}catch(_){}
   item.status='review';item.reviewed=false;item.error=uploadMessage(error);fail++;
  }
  syncQueue();
 }
 busy=false;
 for(const item of queue.filter(x=>x.status==='done'))forgetCover(item);
 queue=queue.filter(x=>x.status!=='done');
 notice=ok+' '+(ok===1?'livro adicionado':'livros adicionados')+(fail?' · '+fail+(fail===1?' com erro':' com erro'):'')+'.';
 if(ok){loaded=false;await load(null,true);}
 syncQueue();
}
document.addEventListener('change',event=>{
 if(!hasAccess()||!event.target.closest?.('#psbLibrary'))return;
 if(event.target.id==='psbAlbumInput'){listFiles(event.target.files);event.target.value='';return;}
 if(event.target.matches?.('[data-psb-field="part"]')){
  const item=queue.find(x=>x.key===event.target.dataset.psbKey);if(item)item.part=event.target.checked;
 }
 const confirm=event.target.closest?.('[data-psb-confirm]');
 if(confirm){
  const item=queue.find(x=>x.key===confirm.dataset.psbConfirm);
  if(item&&item.status==='review'){
   item.reviewed=confirm.checked;
   if(item.reviewed&&(!item.title.trim()||!item.author.trim()||!item.subject.trim())){
    item.reviewed=false;confirm.checked=false;
    item.error='Confere e preenche título, autor e assunto para concluir a revisão.';
   }else item.error='';
   syncQueue();
  }
 }
});
document.addEventListener('input',event=>{
 if(!hasAccess()||!event.target.closest?.('#psbLibrary'))return;
 const field=event.target.dataset?.psbField;
 if(!['title','author','subject','coverUrl'].includes(field))return;
 const item=queue.find(x=>x.key===event.target.dataset.psbKey);
 if(item){
  item[field]=event.target.value;
  item.edited?.add(field);
  item.reviewed=false;
  if(field==='coverUrl'&&safeCover(item.coverUrl))item.coverMode='found';
  if(item.status==='review')item.error='';
  const send=document.getElementById('psbAlbumSend');if(send)send.disabled=true;
}
});
document.addEventListener('click',event=>{
 if(!hasAccess()||!event.target.closest?.('#psbLibrary'))return;
 const removed=event.target.closest('[data-psb-remove]');
 if(removed&&!busy){const item=queue.find(x=>x.key===removed.dataset.psbRemove);if(item)forgetCover(item);queue=queue.filter(x=>x.key!==removed.dataset.psbRemove);syncQueue();return;}
 const mode=event.target.closest('[data-psb-cover-mode]');
 if(mode&&!busy){
  const item=queue.find(x=>x.key===mode.dataset.psbKey);
  if(item&&item.status==='review'){
   item.coverMode=mode.dataset.psbCoverMode;
   if(item.coverMode==='found'&&item.foundCover)item.coverUrl=item.foundCover.cover;
   item.reviewed=false;syncQueue();
  }
  return;
 }
 const find=event.target.closest('[data-psb-find-cover]');
 if(find&&!busy){const item=queue.find(x=>x.key===find.dataset.psbFindCover);if(item){item.reviewed=false;void findCoverAgain(item);}return;}
 if(event.target.closest('[data-psb-submit]')){event.preventDefault();void send();}
});
document.addEventListener('dragover',event=>{
 if(!hasAccess()||!event.target.closest?.('#psbAlbumDrop'))return;
 event.preventDefault();event.dataTransfer.dropEffect='copy';
});
document.addEventListener('drop',event=>{
 if(!hasAccess()||!event.target.closest?.('#psbAlbumDrop'))return;
 event.preventDefault();listFiles(event.dataTransfer?.files);
});
window.addEventListener('uentzoul:auth',()=>{
 if(!canRead()){
  for(const item of queue)forgetCover(item);
  uploaded=[];loaded=false;owner='';queue=[];notice='';
 }else if(!hasAccess()){
  // Contas comuns mantêm o catálogo lido; somente a fila de edição é limpa.
  for(const item of queue)forgetCover(item);
  queue=[];notice='';
 }
});
window.PSICO_BOOK_UPLOAD={books,load,render,maxBytes:MAX_BYTES};
})();
