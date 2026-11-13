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
let lastRowsSignature='',lastAdmin=false,refreshPending=false;
let reviewed=[],isAnalyzing=false,scanToken=0;
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
const subjects=()=>window.UentzoulLibraryAnalyzer?.subjects||{geral:'Cadernos integrados',meta:'Metapsicologia',tcc:'TCC',familia:'Psicologia da Família',social:'Psicologia Social',avaliacao:'Avaliação Psicológica',grupos:'Psicologia dos Grupos'};
function titleFromFile(file,analysis){
 const original=String(file.name||'').replace(/\.(pdf|docx|pptx)$/i,'').replace(/[_]+/g,' ').trim();
 if(/^doc\s*\d+$/i.test(original)&&analysis?.topics?.length)return analysis.topics.slice(0,2).join(' e ');
 return original.slice(0,140)||'Material complementar';
}
function updateCounter(){
 const st=api()?.uploadStats?.(),el=document.getElementById('libraryUploadCounter');
 if(!st||!el)return;
 el.innerHTML='<strong>'+st.sent+' de '+st.total+'</strong><span>materiais enviados</span><em>'+st.missing+' faltando</em>'+
 '<div class="library-count-track"><i style="width:'+(st.total?Math.round(st.sent/st.total*100):100)+'%"></i></div>';
}
function destinationOptions(r){
 const list=entries().filter(x=>!r.subject||x.subject===r.subject).sort((a,b)=>
  Number(b.key===r.suggestion?.key)-Number(a.key===r.suggestion?.key)||a.title.localeCompare(b.title,'pt-BR'));
 return '<option value="__new__" '+(r.targetKey==='__new__'?'selected':'')+'>+ Adicionar como novo material</option>'+
 list.map(x=>'<option value="'+clean(x.key)+'" '+(r.targetKey===x.key?'selected':'')+'>'+
  clean(x.title)+(x.uploaded?' · substituir arquivo':' · arquivo pendente')+'</option>').join('');
}
function reviewCard(r,i){
 const a=r.analysis,quality=a?.quality||'',hit=a?.hits?.length?a.hits.slice(0,7).join(' · '):'Nenhum marcador forte identificado';
 const status=!a?'Analisando o conteúdo…':quality==='pacote'?'Arquivo identificado em pacote organizado · confirma o destino antes de publicar':quality==='texto'?
  'Texto analisado · '+(a.textLength/1000).toFixed(1)+' mil caracteres amostrados · '+(a.confidence==='alta'?'confiança alta':a.confidence==='moderada'?'confiança moderada':'confirmar classificação'):
  'Não foi possível ler o texto interno. Confira o documento e escolha a disciplina manualmente.';
 const examStatus=a?.examMatch==='principal'?'Corresponde ao conteúdo previsto para a prova final':a?.examMatch==='complementar'?'Material complementar relacionado aos temas da prova':a?.examMatch==='fora'?'Pertence à disciplina, mas está fora do foco da prova final':'Relevância para a prova precisa de confirmação';
 const warn=r.conflict?'O nome aponta para outro material. A identificação pelo conteúdo prevaleceu; confirma o destino.':
  a?.quality==='indisponivel'?(a.error||'Leitor indisponível'):'';
 const choices='<option value="">Selecione a disciplina</option>'+
  Object.entries(subjects()).map(([id,label])=>'<option value="'+id+'" '+(id===r.subject?'selected':'')+'>'+clean(label)+'</option>').join('');
 return '<div class="library-review-card" data-review-card="'+i+'">'+
  '<div class="library-review-file"><div><strong>'+clean(r.file.name)+'</strong><small>'+Math.round(r.file.size/1024)+' KB · '+clean(status)+'</small></div>'+
  '<span class="library-review-indicator '+(a?.confidence==='alta'?'strong':'')+'">'+(!a?'Lendo…':quality==='texto'?'Conteúdo lido':quality==='pacote'?'Pacote conferido':'Revisão manual')+'</span></div>'+
  (a?.quality==='texto'?'<div class="library-review-evidence"><strong>Assuntos reconhecidos no conteúdo</strong><span>'+clean(hit)+'</span><small class="library-review-exam-match">'+clean(examStatus)+'</small>'+
  (a.preview?'<details><summary>Ver trecho extraído para conferência</summary><p>'+clean(a.preview)+'</p></details>':'')+'</div>':'')+
  (warn?'<p class="library-review-warning">'+clean(warn)+'</p>':'')+
  '<div class="library-review-fields"><label>Disciplina <select data-review-subject="'+i+'">'+choices+'</select></label>'+
  '<label>Vincular a material existente ou criar novo <select data-review-target="'+i+'">'+destinationOptions(r)+'</select></label>'+
  (r.targetKey==='__new__'?'<label>Nome exibido na Biblioteca <input data-review-title="'+i+'" maxlength="160" type="text" value="'+clean(r.title)+'" placeholder="Título do material"></label>':'')+
  '<label>Visibilidade <select data-review-scope="'+i+'"><option value="in" '+(r.scope==='in'?'selected':'')+'>Biblioteca das provas finais</option>'+
  '<option value="archive" '+(r.scope==='archive'?'selected':'')+'>Guardar para outro momento (fora da revisão)</option></select></label></div>'+
  '<p class="library-review-foot">'+(r.targetKey==='__new__'?'O arquivo será cadastrado como material novo.':'Este arquivo será associado ao material selecionado.')+
  ' O destino pode ser alterado antes da publicação.</p></div>';
}
function paint(){
 const el=document.getElementById('libraryUploadFeedback'),btn=document.getElementById('libraryUploadSend');
 updateCounter();
 if(!el)return;
 if(btn){btn.disabled=isBusy||isAnalyzing||!reviewed.length;btn.textContent=isBusy?'Enviando arquivos…':isAnalyzing?'Lendo os materiais…':'Publicar '+reviewed.length+' material(is) revisado(s)';}
 let html='';
 if(reviewed.length)html='<div class="library-review-intro"><strong>'+reviewed.length+' arquivo(s) selecionado(s)</strong>'+
 '<small>'+ (isAnalyzing?'Analisando o conteúdo de cada arquivo…':'Confira as disciplinas, destinos e conteúdos antes de publicar.')+'</small></div>'+
 '<div class="library-review-list">'+reviewed.map(reviewCard).join('')+'</div>';
 if(logEntries.length)html+='<div class="library-upload-log">'+logEntries.slice(-60).map(row=>
  '<div class="'+(row.ok?'upload-ok':'upload-fail')+'">'+clean(row.message)+'</div>').join('')+'</div>';
 if(isBusy)html+='<div class="library-upload-progress"><span id="libraryUploadBar" style="width:0%"></span></div><small id="libraryUploadPosition">Preparando arquivos…</small>';
 el.innerHTML=html||'Selecione arquivos para analisar os assuntos, revisar os destinos e enviar.';
}

async function refresh(){
 if(refreshing){refreshPending=true;return;}
 if(isBusy)return;
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
  const {data,error}=await c.from(TABLE).select('resource_key,storage_path,filename,mime_type,size_bytes,updated_at,file_subject,display_title,content_summary,content_tags,exam_scope,scan_quality').order('resource_key');
  if(error)throw error;
  const rows=(data||[]).filter(r=>typeof r.storage_path==='string'&&r.storage_path.startsWith('materials/'));
  const signature=JSON.stringify(rows);
  if(signature!==lastRowsSignature){lastRowsSignature=signature;api().applyRows(rows);window.dispatchEvent(new Event('uentzoul:library-updated'));}
  initialized=true;paint();
 }catch(err){console.warn('Não foi possível atualizar os arquivos da Biblioteca:',err);if(isAdmin)show('Falha ao consultar a Biblioteca: '+(err?.message||'tente novamente'))}
 finally{refreshing=false;if(refreshPending){refreshPending=false;queueMicrotask(refresh);}}
}
async function select(files){
 if(isBusy)return;
 const list=Array.from(files||[]).filter(f=>f&&typeof f.name==='string');
 // ZIPs enviados pelo carregador comum são encaminhados ao importador próprio.
 const zipFiles=list.filter(f=>/\.zip$/i.test(f.name));
 if(zipFiles.length){
  if(zipFiles.length!==list.length){
   ++scanToken;reviewed=[];chosenFiles=[];logEntries=[{ok:false,message:'Selecione os ZIPs separadamente dos PDFs, DOCX ou PPTX.'}];isAnalyzing=false;paint();return;
  }
  ++scanToken;reviewed=[];chosenFiles=[];logEntries=[];paint();
  for(const archive of zipFiles)await importLibraryPackage(archive,true);
  return;
 }
 ++scanToken;const mine=scanToken;
 reviewed=list.map(file=>({file,analysis:null,subject:'',title:titleFromFile(file,null),
  suggestion:getTarget(file),targetKey:'__new__',scope:'in',conflict:false}));
 chosenFiles=list;logEntries=[];isAnalyzing=!!list.length;paint();
 for(let i=0;i<reviewed.length;i++){
  if(scanToken!==mine)return;
  const r=reviewed[i];
  try{
   const analyzer=window.UentzoulLibraryAnalyzer;
   r.analysis=analyzer?await analyzer.analyze(r.file):
    {quality:'indisponivel',error:'O leitor de documentos não carregou',topics:[],hits:[]};
   const suggested=r.analysis?.subject||'',known=r.suggestion;
   // Cadernos multidisciplinares não devem ser tratados como material de uma disciplina única.
   r.subject=known?.subject==='geral'?'geral':(suggested||known?.subject||'');
   r.title=known?.title||titleFromFile(r.file,r.analysis);
   r.conflict=!!(suggested&&known?.subject&&known.subject!=='geral'&&suggested!==known.subject);
   r.targetKey=known&&!r.conflict?known.key:'__new__';
   r.scope=known?.inExam||['principal','complementar'].includes(r.analysis?.examMatch)?'in':'archive';
  }catch(err){r.analysis={quality:'indisponivel',error:err?.message||'Leitura indisponível'};r.subject=r.suggestion?.subject||'';r.targetKey=r.suggestion?.key||'__new__';r.scope=r.suggestion?.inExam?'in':'archive'}
  paint();
 }
 if(scanToken!==mine)return;isAnalyzing=false;paint();
}

async function getZipParser(){
 if(window.JSZip?.loadAsync)return window.JSZip;
 return new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src='https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
  script.async=true;
  script.onload=()=>window.JSZip?.loadAsync?resolve(window.JSZip):reject(Error('O leitor ZIP não iniciou.'));
  script.onerror=()=>reject(Error('Não foi possível carregar o leitor ZIP.'));
  document.head.appendChild(script);
 });
}
function packageBytesHex(buffer){
 return [...new Uint8Array(buffer)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
async function importLibraryPackage(archive,append=false){
 if(isBusy||isAnalyzing||!archive)return;
 if(!isAdmin){show('Somente o administrador pode importar materiais para o acervo.');return;}
 const lower=String(archive.name||'').toLowerCase();
 if(!lower.endsWith('.zip')){show('Escolha um dos arquivos ZIP do pacote PsicoMoodle.');return;}
 if(archive.size>85*1024*1024){show('Este pacote é grande demais. Use os ZIPs separados (até 85 MB).');return;}
 const previous=append?reviewed.slice():[];
 const mine=++scanToken;isAnalyzing=true;reviewed=previous;chosenFiles=previous.map(r=>r.file);logEntries=[];
 show('Lendo o ZIP e verificando os arquivos…');
 try{
  const JSZip=await getZipParser();
  const zip=await JSZip.loadAsync(archive,{checkCRC32:true});
  const manifest=zip.file('psicomoodle_import.json');
  if(!manifest)throw Error('O pacote não contém psicomoodle_import.json.');
  const spec=JSON.parse(await manifest.async('string'));
  if(spec?.format!=='psicomoodle-library-package-v1'||!Array.isArray(spec.materials)||
    spec.materials.length<1||spec.materials.length>40)throw Error('Manifesto do pacote inválido.');
  const next=[];
  for(let i=0;i<spec.materials.length;i++){
   if(scanToken!==mine)return;
   const item=spec.materials[i];
   if(!item||typeof item!=='object'||!subjects()[item.subject]||
     typeof item.title!=='string'||item.title.trim().length<3||item.title.length>160||
     !/^arquivos\/[0-9]{2,3}\.pdf$/.test(String(item.entry||''))||
     typeof item.filename!=='string'||!item.filename.toLowerCase().endsWith('.pdf')||
     /[\/\\]/.test(item.filename))throw Error('Arquivo inválido no manifesto: registro '+(i+1));
   const member=zip.file(item.entry);
   if(!member)throw Error('Arquivo não encontrado no ZIP: '+item.filename);
   const bytes=await member.async('uint8array');
   if(bytes.length<100||bytes.length>MAX||bytes[0]!==37||bytes[1]!==80||bytes[2]!==68||bytes[3]!==70)
    throw Error('PDF inválido ou acima de 50 MB: '+item.filename);
   if(Number.isInteger(item.bytes)&&bytes.length!==item.bytes)
    throw Error('Tamanho do PDF não corresponde ao manifesto: '+item.filename);
   if(typeof item.sha256==='string'&&/^[a-f0-9]{64}$/i.test(item.sha256)){
    const digest=packageBytesHex(await crypto.subtle.digest('SHA-256',bytes));
    if(digest!==item.sha256.toLowerCase())throw Error('Verificação de integridade falhou: '+item.filename);
   }
   const file=new File([bytes],item.filename,{type:'application/pdf'});
   const key=item.subject+'::'+item.title.trim();
   const exact=entries().find(x=>x.key===key);
   next.push({file,analysis:{quality:'pacote',confidence:'alta',topics:[],summary:String(item.summary||'Material original do semestre.').slice(0,600),examMatch:'principal'},
    subject:item.subject,title:item.title.trim(),suggestion:exact||null,targetKey:exact?.key||'__new__',
    scope:item.scope==='archive'?'archive':'in',conflict:false});
  }
  if(scanToken!==mine)return;
  const combined=[...previous,...next];
  const keys=new Set();
  for(const r of combined){
   const key=r.subject+'::'+r.title;
   if(keys.has(key))throw Error('Material repetido entre pacotes: '+r.title);
   keys.add(key);
  }
  reviewed=combined;chosenFiles=combined.map(r=>r.file);
  logEntries=[{ok:true,message:'Pacotes conferidos: '+combined.length+' PDF(s) prontos para revisão. Os nomes e disciplinas já estão preenchidos. Confirme os destinos e clique em Publicar.'}];
 }catch(err){
  reviewed=previous;chosenFiles=previous.map(r=>r.file);logEntries=[{ok:false,message:'Falha ao importar '+archive.name+': '+(err.message||String(err))}];
 }finally{
  if(scanToken===mine){isAnalyzing=false;paint();}
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
 if(isBusy||isAnalyzing||!reviewed.length)return;
 const a=auth(),c=a?.client?.(),u=a?.user?.();
 if(!c||!u||!isAdmin){show('Somente o administrador pode enviar arquivos.');return;}
 const catalog=entries();
 const queue=reviewed.map(r=>{
  const existing=catalog.find(x=>x.key===r.targetKey);
  const subject=existing?.subject||r.subject;
  const title=(existing?.title||r.title||'').trim().slice(0,160);
  const key=existing?.key||(subject&&title?subject+'::'+title:'');
  return {file:r.file,r,key,subject,title,scope:r.scope==='in'};
 });
 let passed=0,failed=0;const used=new Set();
 isBusy=true;logEntries=[];paint();
 for(let i=0;i<queue.length;i++){
  const {file,r,key,subject,title,scope}=queue[i],fmt=typeOf(file);
  const progress=n=>{
   const bar=document.getElementById('libraryUploadBar'),pos=document.getElementById('libraryUploadPosition');
   if(bar)bar.style.width=n+'%';if(pos)pos.textContent=(i+1)+' de '+queue.length+' · '+file.name+' · '+n+'%';
  };
  progress(0);
  if(!fmt.mime||!file.size||file.size>MAX){logEntries.push({ok:false,message:file.name+': PDF, DOCX ou PPTX de até 50 MB.'});failed++;continue}
  if(!subjects()[subject]||!key||title.length<3){logEntries.push({ok:false,message:file.name+': confirme a disciplina e o título antes de enviar.'});failed++;continue}
  if(used.has(key)){logEntries.push({ok:false,message:file.name+': há outro arquivo com o mesmo destino no envio.'});failed++;continue}
  used.add(key);
  try{
   if(a.user()?.id!==u.id)throw Error('Conta alterada durante o envio.');
   const path='materials/'+crypto.randomUUID()+'.'+fmt.ext;
   await transfer(file,path,fmt.mime,progress);
   const {error}=await c.from(TABLE).upsert({
    resource_key:key,storage_path:path,filename:file.name.slice(0,255),mime_type:fmt.mime,
    size_bytes:file.size,updated_by:u.id,updated_at:new Date().toISOString(),
    file_subject:subject,display_title:title,content_summary:String(r.analysis?.summary||'').slice(0,600),
    content_tags:(r.analysis?.topics||[]).slice(0,15),exam_scope:scope,scan_quality:r.analysis?.quality||'manual'
   },{onConflict:'resource_key'});
   if(error)throw Error('Arquivo salvo, mas falhou ao associar ao acervo: '+error.message);
   const proof=await c.storage.from(BUCKET).createSignedUrl(path,120);
   if(proof.error)throw Error('Arquivo enviado, mas a abertura falhou: '+proof.error.message);
   logEntries.push({ok:true,message:(scope?'Publicado na revisão: ':'Guardado fora da revisão: ')+title+' ('+file.name+')'});passed++;
  }catch(err){failed++;logEntries.push({ok:false,message:file.name+': '+(err?.message||'falha no envio')});}
  paint();
 }
 isBusy=false;isAnalyzing=false;reviewed=[];chosenFiles=[];
 const input=document.getElementById('libraryFileInput');if(input)input.value='';
 // Atualiza os cartões, o contador e o acervo sem exigir F5.
 await refresh();paint();
 const feedback=document.getElementById('libraryUploadFeedback');
 if(feedback){const summary=document.createElement('strong');summary.textContent='Envio concluído: '+passed+' publicado(s)'+(failed?' · '+failed+' pendência(s)':'')+'.';feedback.prepend(summary)}
}
document.addEventListener('click',async e=>{
 const packageTrigger=e.target.closest('[data-library-package-choose]');
 if(packageTrigger){e.preventDefault();document.getElementById('libraryPackageInput')?.click();return;}
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
 if(drop){e.preventDefault();const input=document.getElementById('libraryFileInput');
  if(input){if(!input.accept.includes('.zip'))input.accept=(input.accept?input.accept+',':'')+'.zip';input.click();}
 }
});
document.addEventListener('change',e=>{
 if(e.target.id==='libraryFileInput')select(e.target.files);
 if(e.target.id==='libraryPackageInput'){importLibraryPackage(e.target.files?.[0]);e.target.value='';}
 const subj=e.target.closest('[data-review-subject]');
 if(subj){const i=Number(subj.dataset.reviewSubject),r=reviewed[i];if(!r)return;
  r.subject=subj.value;r.targetKey='__new__';if(!r.title)r.title=titleFromFile(r.file,r.analysis);paint();return;}
 const dest=e.target.closest('[data-review-target]');
 if(dest){const i=Number(dest.dataset.reviewTarget),r=reviewed[i];if(!r)return;
  r.targetKey=dest.value;const match=entries().find(x=>x.key===dest.value);
  if(match){r.subject=match.subject;r.title=match.title;r.scope=match.inExam?'in':r.scope;}paint();return;}
 const scope=e.target.closest('[data-review-scope]');
 if(scope){const r=reviewed[Number(scope.dataset.reviewScope)];if(r)r.scope=scope.value;return;}
});
document.addEventListener('input',e=>{
 const field=e.target.closest('[data-review-title]');if(!field)return;
 const r=reviewed[Number(field.dataset.reviewTitle)];if(r)r.title=field.value;
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