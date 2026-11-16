/* Pacotes pessoais de figurinhas — não altera o envio existente do chat. */
(()=>{
'use strict';
if(window.__pmStickerPersonalLoaded)return;
window.__pmStickerPersonalLoaded=true;
const BUCKET='uentzoul-stickers',MAX_PACKS=20,MAX_FILES=30,MAX_BYTES=1048576;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let installed=false,modal=null,busy=false,preview=null,mode='stickerly';
const clientReady=()=>typeof client!=='undefined'&&client&&typeof onlineUser!=='undefined'&&onlineUser?.id&&!onlineUser.is_anonymous;
const currentUser=()=>clientReady()?onlineUser.id:null;
const escaped=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function codeFrom(text){
 const raw=String(text||'').trim();
 if(/^[a-z0-9]{4,16}$/i.test(raw))return raw.toUpperCase();
 try{
  const normalized=/^https?:\/\//i.test(raw)?raw:'https://'+raw;
  const url=new URL(normalized);
  const m=url.pathname.match(/^\/s\/([a-z0-9]{4,16})\/?$/i);
  if(url.protocol==='https:'&&['sticker.ly','www.sticker.ly'].includes(url.hostname)&&m)return m[1].toUpperCase();
 }catch(_){}
 return '';
}
function status(text,error=false){
 const node=modal?.querySelector('[data-pm-pack-status]');
 if(node){node.textContent=text;node.classList.toggle('is-error',!!error);}
}
function lock(locked){
 busy=locked;
 modal?.querySelectorAll('button[data-pm-pack-preview],button[data-pm-pack-import],button[data-pm-pack-upload],button[data-pm-pack-remove]').forEach(button=>button.disabled=locked);
 modal?.classList.toggle('is-busy',locked);
}
async function messageFor(error){
 if(error?.context?.json)try{const data=await error.context.json();return data.error||data.message||error.message;}catch(_){}
 return error?.message||'Não foi possível concluir esta operação.';
}
function switchMode(next){
 if(!modal||busy)return;
 mode=next==='upload'?'upload':'stickerly';
 modal.querySelectorAll('[data-pm-pack-mode]').forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.pmPackMode===mode)));
 modal.querySelectorAll('[data-pm-pack-section]').forEach(el=>el.hidden=el.dataset.pmPackSection!==mode);
 status('');
}
function close(){
 if(busy)return;
 modal?.remove();modal=null;preview=null;
 document.removeEventListener('keydown',onKey);
}
function onKey(event){if(event.key==='Escape'&&!busy){event.preventDefault();close();}}
function modalHTML(){
 return '<div id="pmStickerAddOverlay" class="pm-sticker-dialog-backdrop">'+
 '<section class="pm-sticker-dialog" role="dialog" aria-modal="true" aria-labelledby="pmStickerAddTitle">'+
 '<header><div><h2 id="pmStickerAddTitle">Adicionar pacote</h2><p>Pacotes exclusivos da sua conta.</p></div>'+
 '<button type="button" class="pm-pack-close" data-pm-pack-close aria-label="Fechar">×</button></header>'+
 '<div class="pm-pack-options" role="group" aria-label="Origem das figurinhas">'+
 '<button type="button" data-pm-pack-mode="stickerly" aria-pressed="true">Sticker.ly</button>'+
 '<button type="button" data-pm-pack-mode="upload" aria-pressed="false">Imagens próprias</button></div>'+
 '<div class="pm-pack-body">'+
 '<section data-pm-pack-section="stickerly"><label for="pmPackCode">Código ou link do Sticker.ly</label>'+
 '<input id="pmPackCode" type="text" placeholder="https://sticker.ly/s/A3ZA4F" maxlength="180" autocomplete="off" spellcheck="false">'+
 '<p class="pm-pack-help">Primeiro verificamos se o Sticker.ly disponibiliza publicamente as imagens.</p>'+
 '<button type="button" class="pm-pack-action" data-pm-pack-preview>Verificar pacote</button>'+
 '<div id="pmPackPreview" class="pm-pack-preview" hidden></div>'+
 '</section>'+
 '<section data-pm-pack-section="upload" hidden><label for="pmPackName">Nome do pacote</label>'+
 '<input id="pmPackName" type="text" maxlength="80" placeholder="Minhas figurinhas" autocomplete="off">'+
 '<label for="pmPackFiles">Selecionar imagens</label>'+
 '<input id="pmPackFiles" type="file" accept="image/png,image/webp,image/gif,image/jpeg" multiple>'+
 '<p class="pm-pack-help">Até 30 imagens PNG, JPG, WEBP ou GIF. Imagens estáticas serão ajustadas para até 512 px; GIFs mantêm a animação se tiverem até 1 MB.</p>'+
 '<button type="button" class="pm-pack-action" data-pm-pack-upload>Adicionar pacote</button></section>'+
 '<div data-pm-pack-status class="pm-pack-status" role="status" aria-live="polite"></div>'+
 '<div class="pm-pack-managed"><div class="pm-pack-managed-title">Meus pacotes <span data-pm-pack-count></span></div>'+
 '<div data-pm-pack-list class="pm-pack-managed-list"><p>Carregando…</p></div></div>'+
 '</div></section></div>';
}
function renderPreview(result){
 const el=modal?.querySelector('#pmPackPreview');if(!el)return;
 const title=escaped(result.title||'Pacote Sticker.ly');
 const images=(Array.isArray(result.preview)?result.preview:[]).filter(s=>/^https:\/\/stickerly\.pstatic\.net\/sticker_pack\//i.test(s)).slice(0,3);
 el.hidden=false;el.innerHTML=
  '<strong>'+title+'</strong><small>'+Number(result.count||0)+' figurinhas encontradas</small>'+
  (images.length?'<div class="pm-pack-preview-strip">'+images.map(url=>'<img src="'+escaped(url)+'" alt="Prévia de figurinha" loading="lazy" referrerpolicy="no-referrer">').join('')+'</div>':'')+
  '<label class="pm-pack-rights"><input type="checkbox" id="pmPackRights"> Confirmo que tenho permissão para utilizar e compartilhar estas imagens.</label>'+
  '<label for="pmPackImportedName">Nome na minha biblioteca (opcional)</label>'+
  '<input id="pmPackImportedName" maxlength="80" value="'+title+'" type="text">'+
  '<button type="button" class="pm-pack-action" data-pm-pack-import>Importar pacote</button>';
}
async function countPacks(){
 const uid=currentUser();if(!uid)throw Error('Entre na sua conta para adicionar pacotes.');
 const {count,error}=await client.from('uentzoul_sticker_packs')
  .select('id',{head:true,count:'exact'}).eq('owner_id',uid);
 if(error)throw error;
 return count||0;
}
async function listOwn(){
 if(!modal||!currentUser())return;
 const target=modal.querySelector('[data-pm-pack-list]');
 const countElement=modal.querySelector('[data-pm-pack-count]');
 if(!target)return;
 const {data,error}=await client.from('uentzoul_sticker_packs')
  .select('id,title,enabled,source_type,source_code,created_at').eq('owner_id',currentUser())
  .order('created_at',{ascending:false}).limit(30);
 if(!modal||!target.isConnected)return;
 if(error){target.textContent='Não foi possível carregar seus pacotes.';return;}
 const items=data||[];
 if(countElement)countElement.textContent='('+items.length+'/'+MAX_PACKS+')';
 const active=items.filter(p=>p.enabled&&UUID.test(p.id));
 if(!active.length){target.innerHTML='<p>Tu ainda não adicionou nenhum pacote.</p>';return;}
 target.innerHTML=active.map(p=>
  '<div class="pm-pack-managed-item"><span>'+escaped(p.title)+'</span>'+
  '<button type="button" data-pm-pack-remove="'+escaped(p.id)+'" aria-label="Remover '+escaped(p.title)+' da minha biblioteca">Remover</button></div>').join('');
}
async function invoke(action,code,extras={}){
 const {data,error}=await client.functions.invoke('stickerly-pack',{body:{action,code,...extras}});
 if(error)throw new Error(await messageFor(error));
 if(data?.error)throw new Error(data.error);
 return data;
}
async function verifyStickerly(){
 if(busy||!modal)return;
 const code=codeFrom(modal.querySelector('#pmPackCode')?.value);
 if(!code){status('Informe um link ou código válido do Sticker.ly.',true);return;}
 lock(true);preview=null;modal.querySelector('#pmPackPreview').hidden=true;
 status('Verificando o pacote público…');
 try{
  const result=await invoke('preview',code);
  if(!Array.isArray(result.preview)&&!(Number(result.count)>0))throw Error('Não foram encontradas figurinhas.');
  preview={...result,code};
  renderPreview(preview);status('Pacote encontrado. Confirme a autorização para importar.');
 }catch(error){status((await messageFor(error))+' Tu também pode adicionar imagens próprias.',true);}
 finally{lock(false);}
}
async function importStickerly(){
 if(busy||!modal||!preview)return;
 if(!modal.querySelector('#pmPackRights')?.checked){status('Confirme a autorização de uso das imagens para importar.',true);return;}
 lock(true);status('Importando figurinhas. Não feche esta janela.');
 try{
  if(await countPacks()>=MAX_PACKS)throw Error('Limite de 20 pacotes por conta atingido.');
  const title=modal.querySelector('#pmPackImportedName')?.value?.trim().slice(0,80)||preview.title;
  const result=await invoke('import',preview.code,{confirmedRights:true,title});
  status('Pacote '+result.title+' adicionado: '+result.count+' figurinhas.'+
    (result.partial?' Algumas imagens não estavam disponíveis.':''));
  preview=null;modal.querySelector('#pmPackPreview').hidden=true;
  await listOwn();window.uentzoulStickerPacks?.refresh?.();
 }catch(error){status(await messageFor(error),true);}
 finally{lock(false);}
}
function bitmapFrom(file){
 return new Promise((resolve,reject)=>{
  const url=URL.createObjectURL(file),img=new Image();
  img.onload=()=>{URL.revokeObjectURL(url);resolve(img);};
  img.onerror=()=>{URL.revokeObjectURL(url);reject(Error('Imagem inválida: '+file.name));};
  img.src=url;
 });
}
async function convert(file){
 const type=file.type;
 if(!['image/png','image/jpeg','image/webp','image/gif'].includes(type))
  throw Error('Formato de arquivo não permitido: '+file.name);
 if(type==='image/gif'){
  if(file.size>MAX_BYTES)throw Error('O GIF '+file.name+' supera 1 MB.');
  return {blob:file,type:'image/gif',ext:'gif'};
 }
 const image=await bitmapFrom(file);
 const ratio=Math.min(1,512/image.naturalWidth,512/image.naturalHeight);
 if(!Number.isFinite(ratio)||ratio<=0)throw Error('Imagem sem dimensões válidas.');
 const canvas=document.createElement('canvas');
 canvas.width=Math.max(1,Math.round(image.naturalWidth*ratio));
 canvas.height=Math.max(1,Math.round(image.naturalHeight*ratio));
 canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
 const toBlob=(quality)=>new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality));
 let blob=await toBlob(.82);
 if(!blob||blob.size>MAX_BYTES)blob=await toBlob(.62);
 if(!blob||blob.size>MAX_BYTES)throw Error('Imagem muito grande: '+file.name);
 return {blob,type:'image/webp',ext:'webp'};
}
async function uploadPersonal(){
 if(busy||!modal)return;
 const name=modal.querySelector('#pmPackName')?.value?.trim();
 const selected=[...(modal.querySelector('#pmPackFiles')?.files||[])];
 if(!name||name.length>80){status('Informe um nome para o pacote.',true);return;}
 if(!selected.length||selected.length>MAX_FILES){status('Selecione de 1 a 30 imagens.',true);return;}
 lock(true);status('Preparando imagens…');
 let packId=null,complete=0,errors=0;
 try{
  if(await countPacks()>=MAX_PACKS)throw Error('Limite de 20 pacotes por conta atingido.');
  const files=[];
  for(const file of selected)files.push(await convert(file));
  const uid=currentUser();
  const {data,error}=await client.from('uentzoul_sticker_packs')
   .insert({title:name,owner_id:uid,source_type:'upload',description:'Pacote de imagens próprias',enabled:true,position:0})
   .select('id').single();
  if(error||!data?.id)throw error||Error('Falha ao criar o pacote.');
  packId=data.id;
  for(let i=0;i<files.length;i++){
   const item=files[i],id=crypto.randomUUID();
   const path='packs/'+uid+'/'+packId+'/'+id+'.'+item.ext;
   status('Adicionando figurinha '+(i+1)+' de '+files.length+'…');
   try{
    const {error:uploadErr}=await client.storage.from(BUCKET).upload(path,item.blob,
      {upsert:false,contentType:item.type,cacheControl:'31536000'});
    if(uploadErr)throw uploadErr;
    const {error:dbErr}=await client.from('uentzoul_stickers')
     .insert({id,pack_id:packId,title:'Figurinha '+(i+1),storage_path:path,mime_type:item.type,position:i,enabled:true});
    if(dbErr){await client.storage.from(BUCKET).remove([path]);throw dbErr;}
    complete++;
   }catch(error){console.warn('Figurinha própria não importada',error);errors++;}
  }
  if(!complete){
   await client.from('uentzoul_sticker_packs').delete().eq('id',packId).eq('owner_id',uid);
   packId=null;throw Error('Nenhuma imagem pôde ser adicionada. Verifique os formatos e tente novamente.');
  }
  status('Pacote criado com '+complete+' figurinhas.'+(errors?' '+errors+' não foram adicionadas.':''));
  modal.querySelector('#pmPackName').value='';
  modal.querySelector('#pmPackFiles').value='';
  await listOwn();window.uentzoulStickerPacks?.refresh?.();
 }catch(error){status(await messageFor(error),true);}
 finally{lock(false);}
}
async function removePack(id){
 if(busy||!UUID.test(id)||!currentUser())return;
 if(!window.confirm('Remover este pacote da tua biblioteca? As figurinhas já enviadas continuarão visíveis nas conversas.'))return;
 lock(true);status('Removendo da biblioteca…');
 try{
  const {error}=await client.from('uentzoul_sticker_packs').update({enabled:false})
   .eq('id',id).eq('owner_id',currentUser());
  if(error)throw error;
  status('Pacote removido da biblioteca. As mensagens antigas foram preservadas.');
  await listOwn();window.uentzoulStickerPacks?.refresh?.();
 }catch(error){status(await messageFor(error),true);}
 finally{lock(false);}
}
function open(){
 if(!currentUser())return;
 if(modal){modal.querySelector('#pmPackCode')?.focus();return;}
 const wrapper=document.createElement('div');
 wrapper.innerHTML=modalHTML();modal=wrapper.firstElementChild;
 document.body.appendChild(modal);
 mode='stickerly';preview=null;busy=false;
 modal.querySelector('#pmPackCode')?.focus();
 document.addEventListener('keydown',onKey);
 void listOwn();
}
function onClick(event){
 const target=event.target;
 if(!(target instanceof Element))return;
 if(target.closest('[data-pm-sticker-add]')){
  event.preventDefault();event.stopPropagation();open();return;
 }
 if(!modal)return;
 if(target===modal||target.closest('[data-pm-pack-close]')){event.preventDefault();close();return;}
 const change=target.closest('[data-pm-pack-mode]');
 if(change){event.preventDefault();switchMode(change.dataset.pmPackMode);return;}
 if(target.closest('[data-pm-pack-preview]')){event.preventDefault();void verifyStickerly();return;}
 if(target.closest('[data-pm-pack-import]')){event.preventDefault();void importStickerly();return;}
 if(target.closest('[data-pm-pack-upload]')){event.preventDefault();void uploadPersonal();return;}
 const remove=target.closest('[data-pm-pack-remove]');
 if(remove){event.preventDefault();void removePack(remove.dataset.pmPackRemove);return;}
}
function mount(){
 if(installed||typeof dmComposer!=='function'||!window.uentzoulStickerPacks)return false;
 installed=true;
 const base=dmComposer;
 dmComposer=function(...args){
  const html=base.apply(this,args);
  if(typeof html!=='string'||!html.includes('id="pmStickerPanel"'))return html;
  const needle='<header class="pm-sticker-head"><strong>Figurinhas</strong>';
  if(!html.includes(needle))return html;
  return html.replace(needle,needle+
    '<button type="button" class="pm-sticker-add-pack" data-pm-sticker-add title="Adicionar pacote" aria-label="Adicionar pacote de figurinhas">'+
    '<span aria-hidden="true">+</span><span>Adicionar pacote</span></button>');
 };
 document.addEventListener('click',onClick);
 window.uentzoulStickerPersonal={open,codeFrom};
 return true;
}
if(!mount()){
 let tries=0;const timer=setInterval(()=>{
  if(mount()||++tries>30)clearInterval(timer);
 },250);
}
})();
