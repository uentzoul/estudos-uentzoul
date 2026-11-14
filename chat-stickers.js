/* PsicoMoodle — pacotes de figurinhas, recentes e favoritas.
   Envio por um toque com prévia otimista; nunca armazena binários no histórico.
   Os arquivos dos pacotes são publicados pelo administrador, não pelos alunos. */
(function () {
'use strict';
if (window.__pmStickerPacksReady || !window.uentzoulMessenger ||
    typeof dm === 'undefined' || typeof dmW === 'undefined' ||
    typeof dmComposer !== 'function' || typeof dmWMedia !== 'function') return;
window.__pmStickerPacksReady = true;
const BUCKET = 'uentzoul-stickers';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BODY = /^\[Figurinha:([0-9a-f-]{36})\]$/i;
const state = { owner:null, loaded:false, loading:false, open:false, tab:'recent',
  packs:[], stickers:[], byId:new Map(), favorites:new Set(), recents:[],
  pending:[], error:'', lastLoad:0 };
const clean = value => esc(String(value == null ? '' : value));
const session = () => onlineUser && client && onlineUser.id;
const selected = () => dm.tab === 'private' ? dm.peerId :
                       dm.tab === 'global' ? dmWSelected() : dm.roomId;
function reset() {
  state.loaded=false;state.loading=false;state.open=false;state.tab='recent';
  state.packs=[];state.stickers=[];state.byId.clear();
  state.favorites.clear();state.recents=[];state.pending=[];state.error='';
  state.lastLoad=0;
}
function avatarUrl(path) {
  if(!/^[a-zA-Z0-9._/-]+$/.test(path||'') || !path.startsWith('packs/')) return '';
  try {
    return client.storage.from(BUCKET).getPublicUrl(path).data?.publicUrl || '';
  } catch(_) { return ''; }
}
function retrieve(force) {
  const uid=session();
  if (!uid) return;
  if(state.owner !== uid){reset();state.owner=uid;}
  if(state.loading || (!force && state.loaded))return;
  state.loading=true;state.error='';
  Promise.all([
    client.from('uentzoul_sticker_packs').select('id,title,description,position,enabled').order('position'),
    client.from('uentzoul_stickers').select('id,pack_id,title,storage_path,mime_type,position,enabled').order('position'),
    client.from('uentzoul_sticker_favorites').select('sticker_id').eq('user_id',uid),
    client.from('uentzoul_sticker_recents').select('sticker_id,used_at').eq('user_id',uid).order('used_at',{ascending:false}).limit(60)
  ]).then(results=>{
    if(!onlineUser || onlineUser.id!==uid)return;
    const bad=results.find(x=>x.error);
    if(bad)throw bad.error;
    state.packs=results[0].data||[];
    state.stickers=(results[1].data||[]).map(item=>({...item,url:avatarUrl(item.storage_path)}))
      .filter(item=>UUID.test(item.id)&&UUID.test(item.pack_id)&&item.url);
    state.byId=new Map(state.stickers.map(item=>[item.id,item]));
    state.favorites=new Set((results[2].data||[]).map(row=>row.sticker_id));
    state.recents=(results[3].data||[]).map(row=>row.sticker_id);
    state.loaded=true;state.lastLoad=Date.now();
    if(state.tab==='recent'&&!state.recents.length)state.tab=state.packs.find(p=>p.enabled)?.id||'favorites';
  }).catch(error=>{
    if(onlineUser?.id!==uid)return;
    state.error=error?.message||'Não foi possível carregar as figurinhas.';
    state.loaded=true;
  }).finally(()=>{
    if(onlineUser?.id!==uid)return;
    state.loading=false;
    if(document.querySelector('#main .dm-shell'))dmShow();
  });
}
function showableSticker(item) {
  return item && item.enabled && state.packs.some(p=>p.id===item.pack_id&&p.enabled);
}
function activeItems() {
  if(state.tab==='recent')return state.recents.map(id=>state.byId.get(id)).filter(showableSticker);
  if(state.tab==='favorites')return [...state.favorites].map(id=>state.byId.get(id)).filter(showableSticker);
  return state.stickers.filter(item=>item.pack_id===state.tab&&showableSticker(item));
}
const stickerIcon = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3.5h14a2 2 0 0 1 2 2v9L14.5 21H5a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2Z"/><path d="M14 21v-5a2 2 0 0 1 2-2h5"/><path d="M8 9h.01M16 9h.01M8.2 12.5c1.3 2.1 4.7 2.1 6 0"/></svg>';
function drawer() {
  if(!state.open)return '';
  const tabs=[['recent','Recentes','◷'],['favorites','Favoritas','★']]
    .concat(state.packs.filter(p=>p.enabled).map(p=>[p.id,p.title,'▧']));
  const selectedItems=activeItems();
  const head='<header class="pm-sticker-head"><strong>Figurinhas</strong>'+
    '<button type="button" data-pm-sticker-close aria-label="Fechar figurinhas">×</button></header>';
  const nav='<nav class="pm-sticker-tabs" aria-label="Pacotes de figurinhas">'+tabs.map(row=>
    '<button type="button" data-pm-sticker-tab="'+clean(row[0])+'" aria-pressed="'+(state.tab===row[0])+'" title="'+clean(row[1])+'">'+
    '<span aria-hidden="true">'+clean(row[2])+'</span><span>'+clean(row[1])+'</span></button>').join('')+'</nav>';
  const items=selectedItems.map(item=>{
    const favorite=state.favorites.has(item.id);
    return '<div class="pm-sticker-tile">'+
      '<button type="button" class="pm-sticker-tap" data-pm-sticker-send="'+clean(item.id)+'" title="Enviar '+clean(item.title)+'" aria-label="Enviar '+clean(item.title)+'">'+
      '<img alt="'+clean(item.title)+'" src="'+clean(item.url)+'" loading="lazy" decoding="async"></button>'+
      '<button type="button" class="pm-sticker-star '+(favorite?'is-favorite':'')+'" data-pm-sticker-favorite="'+clean(item.id)+'" aria-label="'+(favorite?'Remover das favoritas':'Adicionar às favoritas')+'" aria-pressed="'+favorite+'">'+(favorite?'★':'☆')+'</button></div>';
  }).join('');
  let body;
  if(state.loading&&!state.loaded)body='<p class="pm-sticker-empty">Carregando pacotes…</p>';
  else if(state.error)body='<div class="pm-sticker-empty"><p>Não foi possível carregar os pacotes.</p><button type="button" data-pm-sticker-reload>Tentar novamente</button></div>';
  else if(!state.packs.some(p=>p.enabled))body='<p class="pm-sticker-empty">Nenhum pacote disponível ainda. O administrador poderá adicionar pacotes de figurinhas.</p>';
  else if(!items)body='<p class="pm-sticker-empty">'+(state.tab==='favorites'?'Suas figurinhas favoritas aparecerão aqui.':state.tab==='recent'?'As figurinhas enviadas recentemente aparecerão aqui.':'Esse pacote ainda não tem figurinhas.')+'</p>';
  else body='<div class="pm-sticker-grid">'+items+'</div>';
  return '<section id="pmStickerPanel" class="pm-sticker-panel" aria-label="Escolher figurinha">'+head+nav+
    '<div class="pm-sticker-content">'+body+'</div></section>';
}
const originalComposer=dmComposer;
dmComposer=function() {
  const html=originalComposer();
  if(!html)return html;
  const marker='<button type="button" class="dm-composer-action dm-share-launch"';
  if(!html.includes(marker))return html;
  const trigger='<button type="button" class="dm-composer-action pm-sticker-trigger" data-pm-sticker-open title="Figurinhas" aria-label="Abrir figurinhas" aria-expanded="'+state.open+'">'+stickerIcon+'</button>';
  return html.replace(marker,trigger+marker).replace('</form>',drawer()+'</form>');
};
const originalMedia=dmWMedia;
dmWMedia=function(message){
  if(message?.kind!=='sticker'||message.deleted_at)return originalMedia(message);
  const id=String(message.body||'').match(BODY)?.[1];
  if(!id)return originalMedia(message);
  const item=state.byId.get(id);
  if(!item)return '<div class="pm-sticker-missing" role="img" aria-label="Figurinha">Figurinha indisponível</div>';
  const favorite=state.favorites.has(item.id);
  return '<div class="pm-sticker-message"><img class="pm-sticker-displayed" src="'+clean(item.url)+'" alt="'+clean(item.title)+'" loading="lazy" decoding="async">'+
    '<button type="button" class="pm-sticker-message-fav" data-pm-sticker-favorite="'+clean(item.id)+'" title="'+(favorite?'Remover das favoritas':'Salvar nas favoritas')+'" aria-label="'+(favorite?'Remover figurinha das favoritas':'Salvar figurinha nas favoritas')+'">'+(favorite?'★':'☆')+'</button></div>';
};
function pendingMarkup(p){
  const item=state.byId.get(p.stickerId);
  if(!item)return '';
  const failed=p.status==='failed';
  return '<div class="dm-message mine pm-sticker-pending" data-pm-sticker-pending="'+clean(p.localId)+'">'+
    '<div class="dm-message-bubble"><div class="pm-sticker-message"><img class="pm-sticker-displayed" src="'+clean(item.url)+'" alt="'+clean(item.title)+'"></div>'+
    '<div class="dm-message-info pm-sticker-delivery">'+(failed?
    '<span>Não enviada</span><button type="button" data-pm-sticker-retry="'+clean(p.localId)+'">Tentar novamente</button>':
    '<span aria-label="Enviando figurinha">Enviando…</span>')+'</div></div></div>';
}
const originalThread=dmThreadHtml;
dmThreadHtml=function(){
  let html=originalThread();
  const conversation=selected();
  const rows=state.pending.filter(p=>p.owner===onlineUser?.id&&p.tab===dm.tab&&p.destination===conversation);
  if(!rows.length)return html;
  const saved=dm.tab==='private'?dm.messages:dm.roomMessages;
  const unresolved=rows.filter(p=>!p.serverId||!saved.some(m=>m.id===p.serverId));
  if(!unresolved.length)return html;
  if(html.includes('class="dm-chat-empty"'))html='';
  return html+unresolved.map(pendingMarkup).join('');
};
const originalRender=dmRender;
dmRender=function(){
  if(session())retrieve(false);
  return originalRender();
};
window.uentzoulMessenger.render=dmRender;
function appendPending(p){
  const view=document.querySelector('#dmMessages');
  if(!view||selected()!==p.destination||dm.tab!==p.tab)return;
  if(view.querySelector('.dm-chat-empty'))view.innerHTML='';
  view.insertAdjacentHTML('beforeend',pendingMarkup(p));
  view.scrollTop=view.scrollHeight;
}
async function transmit(item,pending){
  if(!session()||pending.owner!==onlineUser.id)return;
  pending.status='sending';
  const match=document.querySelector('[data-pm-sticker-pending="'+pending.localId+'"]');
  if(match){const info=match.querySelector('.pm-sticker-delivery');if(info)info.innerHTML='<span>Enviando…</span>';}
  try{
    const isPrivate=pending.tab==='private';
    const row={sender_id:pending.owner,body:'[Figurinha:'+item.id+']',kind:'sticker',media_path:null};
    if(isPrivate)row.recipient_id=pending.destination;
    else row.room_id=pending.destination;
    if(pending.replyId)row.reply_to=pending.replyId;
    const table=isPrivate?'uentzoul_messages':'uentzoul_room_messages';
    const answer=await client.from(table).insert(row).select('id').single();
    if(answer.error)throw answer.error;
    pending.serverId=answer.data?.id;
    state.recents=[item.id,...state.recents.filter(id=>id!==item.id)].slice(0,60);
    client.from('uentzoul_sticker_recents').upsert(
      {user_id:pending.owner,sticker_id:item.id,used_at:new Date().toISOString()},
      {onConflict:'user_id,sticker_id'}
    ).then(({error})=>{if(error)console.warn('Não foi possível atualizar recentes',error)});
    await dmLoad();
    if(onlineUser?.id===pending.owner){
      state.pending=state.pending.filter(p=>p.localId!==pending.localId);
      if(document.querySelector('#dmMessages'))dmShow();
    }
  }catch(error){
    pending.status='failed';
    const message=document.querySelector('[data-pm-sticker-pending="'+pending.localId+'"]');
    if(message){
      const info=message.querySelector('.pm-sticker-delivery');
      if(info)info.innerHTML='<span>Não enviada</span><button type="button" data-pm-sticker-retry="'+clean(pending.localId)+'">Tentar novamente</button>';
    }
    console.warn('Falha ao enviar figurinha',error);
  }
}
function send(id){
  const item=state.byId.get(id);
  const destination=selected();
  if(!item||!showableSticker(item)||!UUID.test(destination||'')||!session())return;
  const pending={localId:crypto.randomUUID(),owner:onlineUser.id,
    tab:dm.tab,destination,stickerId:id,status:'sending',serverId:null,
    replyId:dmW.reply?.id||null};
  state.pending.push(pending);
  if(dmW.reply){dmW.reply=null;document.querySelector('.dm-reply-preview')?.remove();}
  appendPending(pending); // Optimistic: visible on the first tap, before any network request.
  void transmit(item,pending);
}
async function toggleFavorite(id){
  const item=state.byId.get(id),uid=session();
  if(!item||!uid)return;
  const was=state.favorites.has(id);
  if(was)state.favorites.delete(id);else state.favorites.add(id);
  if(document.querySelector('#main .dm-shell'))dmShow();
  try{
    const request=was?
      client.from('uentzoul_sticker_favorites').delete().eq('user_id',uid).eq('sticker_id',id):
      client.from('uentzoul_sticker_favorites').insert({user_id:uid,sticker_id:id});
    const result=await request;
    if(result.error)throw result.error;
  }catch(error){
    if(onlineUser?.id!==uid)return;
    if(was)state.favorites.add(id);else state.favorites.delete(id);
    if(document.querySelector('#main .dm-shell'))dmShow();
    toast('Não foi possível salvar a favorita. Tente novamente.');
  }
}
document.addEventListener('click',function(event){
  const target=event.target;
  if(!(target instanceof Element))return;
  const trigger=target.closest('[data-pm-sticker-open]');
  if(trigger){event.preventDefault();event.stopImmediatePropagation();
    if(!session())return;
    state.open=!state.open;
    retrieve(false);
    if(state.open&&state.tab==='recent'&&!state.recents.length)
      state.tab=state.packs.find(p=>p.enabled)?.id||'favorites';
    dmShow();return;
  }
  if(target.closest('[data-pm-sticker-close]')){
    event.preventDefault();event.stopImmediatePropagation();state.open=false;dmShow();return;
  }
  const tab=target.closest('[data-pm-sticker-tab]');
  if(tab){event.preventDefault();event.stopImmediatePropagation();
    state.tab=tab.dataset.pmStickerTab;dmShow();return;
  }
  const favorite=target.closest('[data-pm-sticker-favorite]');
  if(favorite){event.preventDefault();event.stopImmediatePropagation();
    void toggleFavorite(favorite.dataset.pmStickerFavorite);return;
  }
  const sticker=target.closest('[data-pm-sticker-send]');
  if(sticker){event.preventDefault();event.stopImmediatePropagation();
    send(sticker.dataset.pmStickerSend);return;
  }
  const retry=target.closest('[data-pm-sticker-retry]');
  if(retry){event.preventDefault();event.stopImmediatePropagation();
    const pending=state.pending.find(p=>p.localId===retry.dataset.pmStickerRetry);
    const item=pending&&state.byId.get(pending.stickerId);
    if(pending&&item&&pending.status==='failed')void transmit(item,pending);
    return;
  }
  if(target.closest('[data-pm-sticker-reload]')){
    event.preventDefault();event.stopImmediatePropagation();retrieve(true);dmShow();return;
  }
  if(state.open&&!target.closest('#pmStickerPanel')){
    state.open=false;
    document.querySelector('#pmStickerPanel')?.remove();
    document.querySelector('[data-pm-sticker-open]')?.setAttribute('aria-expanded','false');
  }
},true);
const originalOpen=dmWOpen;
dmWOpen=function(type,id){state.open=false;return originalOpen(type,id)};
const originalLogout=dmOnLogout;
dmOnLogout=function(){reset();state.owner=null;return originalLogout()};
window.uentzoulMessenger.onLogout=dmOnLogout;
window.uentzoulStickerPacks={refresh:()=>retrieve(true)};
})();
