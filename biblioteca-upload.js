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
const client=()=>auth()?.client?.();
const sizeText=size=>(size/1024/1024).toLocaleString('pt-BR',{maximumFractionDigits:1})+' MB';
function safeCover(s){
 try{const u=new URL(String(s||'').trim());return u.protocol==='https:'?u.href:null}catch(_){return null;}
}
function books(){return hasAccess()?uploaded.slice():[];}
function toBook(row){
 if(!row||!/^materials\/scheduled\/books\/[a-f0-9-]{36}[.]pdf$/.test(String(row.storage_path||'')))return null;
 return {id:'album-'+row.id,title:String(row.title||'Sem título'),
  author:String(row.author||'Autor não informado'),subject:String(row.subject||'Acervo enviado'),
  path:row.storage_path,part:!!row.part,cover:safeCover(row.cover_url),
  colors:['#4e4b77','#8679a7','#f0e6f8'],newBook:true};
}
async function load(onChange,force=false){
 if(typeof onChange==='function')refresh=onChange;
 if(!hasAccess()){uploaded=[];loaded=false;owner='';return;}
 const uid=userId();
 if(owner!==uid){owner=uid;uploaded=[];loaded=false;notice='';queue=[];}
 if(loading||(loaded&&!force))return;
 const c=client();if(!c)return;
 loading=true;
 try{
  const {data,error}=await c.from(TABLE)
   .select('id,title,author,subject,storage_path,filename,size_bytes,cover_url,part,created_at')
   .order('created_at',{ascending:false});
  if(error)throw error;
  if(!hasAccess()||uid!==userId())return;
  uploaded=(data||[]).map(toBook).filter(Boolean);
  loaded=true;
  if(refresh)refresh();
 }catch(error){
  if(uid===userId()){loaded=true;notice='Não foi possível consultar os livros enviados: '+(error?.message||'erro de conexão');}
 }finally{loading=false;}
}
function defaultTitle(name){
 return String(name||'Livro sem título').replace(/[.]pdf$/i,'').replace(/[_]+/g,' ').replace(/\s+/g,' ').trim().slice(0,180);
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
  queue.push({key:crypto.randomUUID(),file,title:defaultTitle(file.name),author:'',subject:'',part:false,
   coverUrl:'',status:invalid?'error':'ready',error:invalid});
 }
 syncQueue();
}
function queueMarkup(){
 if(!queue.length)return '<p class="psb-album-blank">Seleciona um ou mais PDFs para preparar os livros.</p>';
 return queue.map(item=>'<article class="psb-album-item" data-upload-item="'+esc(item.key)+'">'+
  '<div class="psb-album-file"><span class="psb-album-pdf" aria-hidden="true">PDF</span><div><strong>'+esc(item.file.name)+'</strong><small>'+sizeText(item.file.size)+'</small></div>'+
  '<button type="button" data-psb-remove="'+esc(item.key)+'" '+(busy?'disabled':'')+' aria-label="Remover arquivo">×</button></div>'+
  '<div class="psb-album-fields"><label>Título do livro<input type="text" maxlength="180" required data-psb-field="title" data-psb-key="'+esc(item.key)+'" value="'+esc(item.title)+'"></label>'+
  '<label>Autor ou organizador<input type="text" maxlength="200" data-psb-field="author" data-psb-key="'+esc(item.key)+'" value="'+esc(item.author)+'" placeholder="Autor não informado"></label>'+
  '<label>Assunto<input type="text" maxlength="120" data-psb-field="subject" data-psb-key="'+esc(item.key)+'" value="'+esc(item.subject)+'" placeholder="Acervo enviado"></label>'+
  '<label>Link da capa (opcional)<input type="url" maxlength="1800" data-psb-field="coverUrl" data-psb-key="'+esc(item.key)+'" value="'+esc(item.coverUrl)+'" placeholder="https://..."></label></div>'+
  '<label class="psb-album-excerpt"><input type="checkbox" data-psb-field="part" data-psb-key="'+esc(item.key)+'" '+(item.part?'checked':'')+'> É um trecho, não o livro completo</label>'+
  '<p class="psb-album-state'+(item.status==='error'?' is-error':item.status==='done'?' is-success':'')+'" role="status">'+
  esc(item.error||({ready:'Pronto para enviar',uploading:'Enviando PDF…',saving:'Registrando na estante…',done:'Livro adicionado à Biblioteca'}[item.status]||'Preparando…'))+'</p></article>').join('');
}
function currentBooks(){
 if(!uploaded.length)return '<p class="psb-album-blank">Nenhum livro enviado por aqui ainda.</p>';
 return '<div class="psb-album-history">'+uploaded.map(book=>'<div class="psb-album-history-item"><span class="psb-album-history-icon">▤</span><div><strong>'+esc(book.title)+'</strong><small>'+esc(book.author)+' · '+esc(book.subject)+'</small></div></div>').join('')+'</div>';
}
function render(){
 if(!hasAccess())return '<section class="panel"><h2>Acesso restrito</h2></section>';
 return '<div class="psb-subhead"><div><button type="button" data-psb-tab="home" class="psb-back">‹ Biblioteca</button>'+
  '<h2>Álbum de novos livros</h2><p>Envia teus PDFs e cadastra cada obra. Depois do envio, ela aparece automaticamente na Biblioteca de livros.</p></div>'+
  '<span class="psb-count">Administrador</span></div>'+
  '<section class="psb-album-panel"><div class="psb-album-panel-head"><div><h3>Adicionar PDFs</h3><p>Podes selecionar vários livros de uma vez ou arrastá-los para cá.</p></div><span class="psb-album-limit">Até 50 MB por PDF</span></div>'+
  '<label class="psb-album-drop" id="psbAlbumDrop"><span class="psb-album-drop-icon" aria-hidden="true">↑</span><strong>Selecionar livros do dispositivo</strong>'+
  '<span>PDF · clica ou arrasta os arquivos</span><input id="psbAlbumInput" type="file" accept=".pdf,application/pdf" multiple aria-label="Selecionar arquivos PDF"></label>'+
  '<div class="psb-album-info">O limite de 50 MB é do Supabase Free. Os livros ficam em armazenamento privado e só são adicionados após o envio ser confirmado.</div>'+
  '<div id="psbUploadQueue" class="psb-album-queue">'+queueMarkup()+'</div>'+
  '<div class="psb-album-actions"><p id="psbAlbumNotice" role="status" aria-live="polite">'+esc(notice)+'</p>'+
  '<button type="button" class="psb-album-send" id="psbAlbumSend" data-psb-submit '+(busy||!queue.some(x=>x.status==='ready'||x.status==='error')?'disabled':'')+'>'+
  (busy?'Enviando livros…':'Enviar livros à Biblioteca')+'</button></div></section>'+
  '<section class="psb-album-library"><div class="psb-album-library-head"><div><h3>Livros enviados</h3><p>Os títulos cadastrados neste álbum ficam salvos no acervo.</p></div>'+
  '<button type="button" data-psb-tab="books">Ver na estante</button></div>'+
  (loading?'<p class="psb-album-blank">Carregando catálogo…</p>':currentBooks())+'</section>';
}
function syncQueue(){
 const box=document.getElementById('psbUploadQueue');if(box)box.innerHTML=queueMarkup();
 const send=document.getElementById('psbAlbumSend');
 if(send){send.disabled=busy||!queue.some(x=>x.status==='ready'||x.status==='error');send.textContent=busy?'Enviando livros…':'Enviar livros à Biblioteca';}
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
 const targets=queue.filter(x=>x.status==='ready'||x.status==='error');
 if(!targets.length)return;
 busy=true;notice='Enviando '+targets.length+(targets.length===1?' livro…':' livros…');syncQueue();
 let ok=0,fail=0;
 for(const item of targets){
  let path='';
  try{
   if(!hasAccess())throw Error('Acesso de administrador encerrado.');
   const title=item.title.trim(),author=item.author.trim()||'Autor não informado';
   const subject=item.subject.trim()||'Acervo enviado';
   if(!title||title.length>180||author.length>200||subject.length>120)throw Error('Revisa o título, autor e assunto deste livro.');
   if(!/\.pdf$/i.test(item.file.name)||item.file.size>MAX_BYTES||item.file.size<100)throw Error('O arquivo deve ser um PDF de até 50 MB.');
   if(item.file.type&&item.file.type!=='application/pdf')throw Error('O arquivo selecionado não é um PDF.');
   const signature=await item.file.slice(0,5).text();
   if(signature!=='%PDF-')throw Error('Este arquivo não possui um cabeçalho PDF válido.');
   const cover=String(item.coverUrl||'').trim();
   if(cover&&!safeCover(cover))throw Error('O link de capa precisa começar com https://');
   item.error='';item.status='uploading';syncQueue();
   path='materials/scheduled/books/'+crypto.randomUUID()+'.pdf';
   const sent=await c.storage.from(BUCKET).upload(path,item.file,{contentType:'application/pdf',upsert:false,cacheControl:'3600'});
   if(sent.error)throw sent.error;
   if(!hasAccess())throw Error('Acesso encerrado antes do cadastro.');
   item.status='saving';syncQueue();
   const record={title,author,subject,filename:item.file.name.slice(0,255),
    storage_path:path,size_bytes:item.file.size,part:!!item.part,
    cover_url:cover||null,uploaded_by:userId()};
   const added=await c.from(TABLE).insert(record).select('id').single();
   if(added.error){
    await c.storage.from(BUCKET).remove([path]).catch(()=>{});
    throw added.error;
   }
   path='';item.status='done';ok++;
  }catch(error){
   item.status='error';item.error=uploadMessage(error);fail++;
  }
  syncQueue();
 }
 busy=false;
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
});
document.addEventListener('input',event=>{
 if(!hasAccess()||!event.target.closest?.('#psbLibrary'))return;
 const field=event.target.dataset?.psbField;
 if(!['title','author','subject','coverUrl'].includes(field))return;
 const item=queue.find(x=>x.key===event.target.dataset.psbKey);
 if(item){item[field]=event.target.value;if(item.status==='error'&&item.file.size<=MAX_BYTES){item.status='ready';item.error='';}}
});
document.addEventListener('click',event=>{
 if(!hasAccess()||!event.target.closest?.('#psbLibrary'))return;
 const removed=event.target.closest('[data-psb-remove]');
 if(removed&&!busy){queue=queue.filter(x=>x.key!==removed.dataset.psbRemove);syncQueue();return;}
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
 if(!hasAccess()){uploaded=[];loaded=false;owner='';queue=[];notice='';}
});
window.PSICO_BOOK_UPLOAD={books,load,render,maxBytes:MAX_BYTES};
})();
