/* Biblioteca — carregamento dinâmico e uploads privados para o administrador */
(()=>{
'use strict';
const BUCKET='uentzoul-library-files';
const TABLE='uentzoul_library_uploads';
const PROJECT='swseibmqoetnuctxyusj';
const MAX=50*1024*1024;
const FORMATS={
 pdf:'application/pdf',
 docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
 pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation'
};
let client=null,user=null,isAdmin=false,isBusy=false,chosenFiles=[],logEntries=[],refreshing=false,adminCheckedFor=null,initialized=false;
let lastRowsSignature='',lastAdmin=false;
const api=()=>window.uentzoulLibraryApp;
const auth=()=>window.uentzoulAIAuth;
function clean(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));}
function norm(s){
 return String(s||'').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/\(\d+\)(?=\.[^.]+$)/g,'').replace(/[^a-z0-9]/g,'');
}
function typeOf(file){const ext=String(file.name||'').split('.').pop().toLowerCase();return {ext,mime:FORMATS[ext]||null};}
function entries(){return api()?.items?.()||[];}
function getTarget(file){
 const name=norm(file.name);
 const matches=entries().filter(x=>[x.source,x.legacyUrl?.split('/').pop(),x.legacyUrl,x.title+'.'+typeOf(file).ext].some(v=>v&&norm(v)===name));
 return matches.length===1?matches[0]:null;
}
function show(message){
 const el=document.getElementById('libraryUploadFeedback');
 if(el)el.textContent=message||'';
}
function paint(){
 const el=document.getElementById('libraryUploadFeedback'),btn=document.getElementById('libraryUploadSend');
 if(!el)return;
 if(btn){btn.disabled=isBusy||!chosenFiles.length;btn.textContent=isBusy?'Enviando arquivos…':'Enviar para a Biblioteca';}
 let html='';
 if(chosenFiles.length)html='<strong>'+chosenFiles.length+' arquivo(s) selecionado(s)</strong>'+
   '<div class="library-upload-log">'+chosenFiles.slice(0,30).map(file=>{
    const target=getTarget(file),fmt=typeOf(file),status=!fmt.mime?'Formato não permitido':file.size>MAX?'Acima de 50 MB':target?'→ '+target.title:'→ escolha o material no seletor (envie individualmente)';
    return '<div>'+clean(file.name)+'<br><small>'+clean(status)+'</small></div>';
   }).join('')+'</div>';
 if(logEntries.length)html+='<div class="library-upload-log">'+logEntries.slice(-30).map(row=>
  '<div class="'+(row.ok?'upload-ok':'upload-fail')+'">'+clean(row.message)+'</div>').join('')+'</div>';
 if(isBusy)html+='<div class="library-upload-progress"><span id="libraryUploadBar" style="width:0%"></span></div><small id="libraryUploadPosition">Preparando arquivos…</small>';
 el.innerHTML=html||'Os materiais enviados ficam disponíveis no site sem precisar abrir o GitHub.';
}
async function refresh(){
 if(refreshing||isBusy)return;
 const a=auth(), c=a?.client?.();
 if(!c||!api())return;
 refreshing=true;
 try{
  client=c;user=a.user?.()||null;
  const id=user?.id||null;
  if(id!==adminCheckedFor){
   adminCheckedFor=id;
   isAdmin=false;
   if(id){
    const status=await c.rpc('uentzoul_is_admin');
    if(status.error){adminCheckedFor=null;throw status.error;}
    isAdmin=status.data===true;
   }
  }
  if(isAdmin!==lastAdmin){lastAdmin=isAdmin;api().setAdmin(isAdmin);}
  const {data,error}=await c.from(TABLE).select('resource_key,storage_path,filename,mime_type,size_bytes,updated_at').order('resource_key');
  if(error)throw error;
  const rows=(data||[]).filter(r=>typeof r.storage_path==='string'&&r.storage_path.startsWith('materials/'));
  const signature=JSON.stringify(rows);
  if(signature!==lastRowsSignature){lastRowsSignature=signature;api().applyRows(rows);}
  initialized=true;paint();
 }catch(err){console.warn('Não foi possível atualizar os arquivos da Biblioteca:',err);if(isAdmin)show('Falha ao consultar a Biblioteca: '+(err?.message||'tente novamente'))}
 finally{refreshing=false;}
}
function select(files){
 if(isBusy)return;
 chosenFiles=Array.from(files||[]).filter(f=>f&&typeof f.name==='string');
 logEntries=[];paint();
 if(chosenFiles.length===1){
  const match=getTarget(chosenFiles[0]),sel=document.getElementById('libraryUploadTarget');
  if(sel&&match)sel.value=match.key;
 }
}
async function loadTus(){
 if(window.tus?.Upload)return window.tus;
 return new Promise((resolve,reject)=>{
  const src='https://cdn.jsdelivr.net/npm/tus-js-client@4.3.1/dist/tus.min.js';
  const script=document.createElement('script');script.src=src;script.async=true;
  script.onload=()=>window.tus?.Upload?resolve(window.tus):reject(Error('O carregador de arquivos grandes não iniciou.'));
  script.onerror=()=>reject(Error('Não foi possível carregar a transferência de arquivos grandes.'));
  document.head.appendChild(script);
 });
}
async function transfer(file,path,mime,update){
 const a=auth(),c=a?.client?.();if(!c)throw Error('A conta está desconectada.');
 if(file.size<=6*1024*1024){
  update(5);
  const res=await c.storage.from(BUCKET).upload(path,file,{contentType:mime,cacheControl:'3600',upsert:false});
  if(res.error)throw res.error;update(100);return;
 }
 let tus;
 try{tus=await loadTus()}catch(err){console.warn('Transferência resumível indisponível; tentando envio direto:',err);}
 if(!tus){
  const res=await c.storage.from(BUCKET).upload(path,file,{contentType:mime,cacheControl:'3600',upsert:false});
  if(res.error)throw res.error;update(100);return;
 }
 const session=await a.getSession();if(!session?.access_token)throw Error('Sessão expirada. Entre novamente na conta.');
 return new Promise((resolve,reject)=>{
  const uploader=new tus.Upload(file,{
   endpoint:'https://'+PROJECT+'.storage.supabase.co/storage/v1/upload/resumable',
   retryDelays:[0,3000,5000,10000,20000],
   headers:{authorization:'Bearer '+session.access_token},
   metadata:{bucketName:BUCKET,objectName:path,contentType:mime,cacheControl:'3600'},
   uploadDataDuringCreation:true,removeFingerprintOnSuccess:true,
   chunkSize:6*1024*1024,
   onProgress:(sent,total)=>update(Math.round(100*sent/Math.max(1,total))),
   onSuccess:()=>resolve(),
   onError:e=>reject(e)
  });
  uploader.start();
 });
}
async function submit(event){
 event.preventDefault();
 if(isBusy||!chosenFiles.length)return;
 const a=auth(),c=a?.client?.(),u=a?.user?.();
 if(!c||!u||!isAdmin){show('Somente o administrador pode enviar arquivos.');return;}
 const selected=document.getElementById('libraryUploadTarget')?.value||'';
 const singleTarget=chosenFiles.length===1?entries().find(x=>x.key===selected):null;
 const queue=chosenFiles.map(f=>({file:f,target:singleTarget||getTarget(f)}));
 const used=new Set();let passed=0,failed=0;
 isBusy=true;logEntries=[];paint();
 for(let i=0;i<queue.length;i++){
  const {file,target}=queue[i],fmt=typeOf(file);
  const pos=document.getElementById('libraryUploadPosition');
  const bar=document.getElementById('libraryUploadBar');
  const progress=n=>{if(bar)bar.style.width=n+'%';if(pos)pos.textContent=(i+1)+' de '+queue.length+' · '+file.name+' · '+n+'%';};
  progress(0);
  if(!fmt.mime||!file.size||file.size>MAX){logEntries.push({ok:false,message:file.name+': use PDF, DOCX ou PPTX de até 50 MB.'});failed++;continue;}
  if(!target){logEntries.push({ok:false,message:file.name+': não foi possível identificar o material. Envie individualmente e selecione o destino.'});failed++;continue;}
  if(used.has(target.key)){logEntries.push({ok:false,message:file.name+': material repetido no mesmo envio. Envie outra versão separadamente.'});failed++;continue;}
  used.add(target.key);
  try{
   if(a.user()?.id!==u.id)throw Error('A conta mudou durante o envio.');
   const path='materials/'+crypto.randomUUID()+'.'+fmt.ext;
   await transfer(file,path,fmt.mime,progress);
   const {error}=await c.from(TABLE).upsert({
    resource_key:target.key,storage_path:path,filename:file.name.slice(0,255),
    mime_type:fmt.mime,size_bytes:file.size,updated_by:u.id,updated_at:new Date().toISOString()
   },{onConflict:'resource_key'});
   if(error)throw Error('Arquivo enviado, mas não vinculado: '+error.message);
   const proof=await c.storage.from(BUCKET).createSignedUrl(path,120);
   if(proof.error)throw Error('O arquivo foi salvo, mas a abertura falhou: '+proof.error.message);
   logEntries.push({ok:true,message:'Publicado: '+target.title+' ('+file.name+')'});passed++;
  }catch(err){failed++;logEntries.push({ok:false,message:file.name+': '+(err?.message||'falha no envio')});}
  paint();
 }
 isBusy=false;chosenFiles=[];
 const el=document.getElementById('libraryFileInput');if(el)el.value='';
 await refresh();
 paint();
 const message='Envio concluído: '+passed+' publicado(s)'+(failed?' · '+failed+' pendência(s)':'')+'.';
 const feedback=document.getElementById('libraryUploadFeedback');
 if(feedback){const summary=document.createElement('strong');summary.textContent=message;feedback.prepend(summary);}
}
document.addEventListener('click',async e=>{
 const open=e.target.closest('a[data-library-file]');
 if(open){
  e.preventDefault();
  const key=open.dataset.libraryFile,record=api()?.record?.(key);
  if(!record?.storage_path){alert('Arquivo ainda não foi anexado.');return;}
  const a=auth(),c=a?.client?.(),u=a?.user?.();
  if(!u||!c){alert('Entre na conta para consultar os arquivos da Biblioteca.');a?.openLogin?.();return;}
  // A janela é criada sincronamente para que celulares não bloqueiem a abertura.
  const tab=window.open('','_blank');
  if(tab){try{tab.document.title='Abrindo material…';tab.document.body.textContent='Carregando o material…';}catch(_){}}
  try{
   const {data,error}=await c.storage.from(BUCKET).createSignedUrl(record.storage_path,3600);
   if(error||!data?.signedUrl)throw error||Error('Link temporário indisponível.');
   if(tab&&!tab.closed)tab.location.replace(data.signedUrl);else window.location.assign(data.signedUrl);
  }catch(err){if(tab&&!tab.closed)tab.close();alert('Não foi possível abrir o material: '+(err?.message||'tente novamente'))}
  return;
 }
 const drop=e.target.closest('[data-library-upload-drop]');
 if(drop){e.preventDefault();document.getElementById('libraryFileInput')?.click();}
});
document.addEventListener('change',e=>{
 if(e.target.id==='libraryFileInput')select(e.target.files);
});
document.addEventListener('submit',e=>{
 if(e.target.id==='libraryUploadForm')submit(e);
});
document.addEventListener('dragover',e=>{
 const drop=e.target.closest('[data-library-upload-drop]');if(drop){e.preventDefault();drop.classList.add('is-dragover');}
});
document.addEventListener('dragleave',e=>{
 const drop=e.target.closest('[data-library-upload-drop]');if(drop)drop.classList.remove('is-dragover');
});
document.addEventListener('drop',e=>{
 const drop=e.target.closest('[data-library-upload-drop]');if(drop){e.preventDefault();drop.classList.remove('is-dragover');select(e.dataTransfer.files);}
});
document.addEventListener('keydown',e=>{
 const drop=e.target.closest('[data-library-upload-drop]');if(drop&&(e.key==='Enter'||e.key===' ')){e.preventDefault();document.getElementById('libraryFileInput')?.click();}
});
window.addEventListener('uentzoul:auth',()=>{adminCheckedFor=null;refresh();});
window.addEventListener('focus',refresh);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
window.addEventListener('online',refresh);
setInterval(refresh,30000);
let attempts=0;
function tryStart(){
 if(auth()?.client?.()){refresh();return;}
 if(attempts++<35)setTimeout(tryStart,1000);
}
tryStart();
window.uentzoulLibraryManager={refresh,ready:()=>initialized,isAdmin:()=>isAdmin};
})();
