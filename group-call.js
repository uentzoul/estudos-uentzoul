/* Estudos Uentzoul — chamadas WebRTC em grupos e conversas privadas, nunca no chat global. */
(()=>{
'use strict';
if(window.uentzoulGroupCalls)return;
const bridge=window.uentzoulGroupCallBridge;
if(!bridge){console.warn('Chamadas: ponte do mensageiro não encontrada.');return;}
/* O mensageiro está num escopo privado; acessar seu estado somente pela ponte. */
const client={
 from:(...a)=>bridge.client()?.from(...a),
 channel:(...a)=>bridge.client()?.channel(...a),
 removeChannel:(...a)=>bridge.client()?.removeChannel(...a),
 storage:{from:(...a)=>bridge.client()?.storage.from(...a)}
};
const onlineUser={get id(){return bridge.user()?.id},get is_anonymous(){return bridge.user()?.is_anonymous}};
const dm=bridge.state(),dmPrettyPerson=id=>bridge.person(id),dmShow=()=>bridge.refresh();
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const escCall=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const S={room:null,stage:'off',overlay:null,channel:null,key:'',peers:new Map(),presence:new Map(),
 mic:true,cam:false,hand:false,screen:false,audio:null,camera:null,display:null,stream:null,
 panel:'',pinned:null,chat:[],chatBusy:false,chatTimer:null,guard:null,pendingSignals:[],devicePanel:false,photoUrl:'',
 micDevice:'',camDevice:'',notice:'',noticeTimer:null,callStarted:0,generation:0,reconnectTimer:null,presenceTimer:null,connectionWatch:null,lastPresenceAt:0,lastPresenceSignature:'',lastPresenceChannel:null,minimized:false,screenBusy:false,screenMuteTimer:null,videoWatch:null,avatarProfiles:new Map(),avatarLoading:false,avatarRefreshAt:0,camBusy:false,micBusy:false,audioLevels:new Map(),audioNodes:new Map(),audioContext:null};
let videoReplaceQueue=Promise.resolve();
const eligible=()=>!!bridge.client()&&!!bridge.user()?.id&&!bridge.user()?.is_anonymous;
const group=id=>UUID.test(id||'')&&dm.rooms?.find(r=>r.id===id&&r.kind==='group')||null;
const direct=id=>{
 if(!eligible()||dm.tab!=='private'||dm.peerId!==id||!UUID.test(id||'')||id===onlineUser.id)return null;
 const peer=person(id);
 return {id,kind:'private',peerId:id,selfId:onlineUser.id,name:peer.display_name||'Conversa privada',avatar_url:peer.avatar_url||''};
};
const isPrivate=room=>room?.kind==='private';
const isMaintenance=room=>room?.kind==='maintenance';
const maintenanceAllowed=()=>eligible()&&window.uentzoulMaintenance?.isAuthorized?.()===true;
const callTopic=room=>isPrivate(room)?'uentzoul-dm-call:'+([room.selfId,room.peerId].sort().join(':')):'uentzoul-call:'+room.id;
const person=id=>bridge.profile?.(id)|| (typeof dmPrettyPerson==='function'?dmPrettyPerson(id):{display_name:'Participante'});
const myName=()=>person(onlineUser?.id).display_name||'Participante';
/* Ícones vetoriais próprios da barra: independentes de emojis e fontes do sistema. */
function icon(name){
 const paths={
  mic:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/>',
  'mic-off':'<path d="m2 2 20 20M9 9v3a3 3 0 0 0 5.12 2.12M15 9V5a3 3 0 0 0-5.52-1.64M5 10v2a7 7 0 0 0 12 4.9M19 10v2c0 .8-.14 1.58-.39 2.3M12 19v3M8 22h8"/>',
  cam:'<rect x="2" y="5" width="15" height="14" rx="2"/><path d="m17 10 5-3v10l-5-3"/>',
  'cam-off':'<path d="m2 2 20 20M10.5 5H15a2 2 0 0 1 2 2v3l5-3v10l-2.5-1.5M17 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 .7-1.5"/>',
  screen:'<rect x="3" y="3" width="18" height="14" rx="2"/><path d="M8 21h8M12 17v4M12 13V7m-4 4 4-4 4 4"/>',
  'screen-stop':'<rect x="3" y="3" width="18" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><rect x="9" y="7" width="6" height="6" rx="1"/>',
  hand:'<path d="M8 13V6a2 2 0 0 1 4 0v6-8a2 2 0 0 1 4 0v8-6a2 2 0 0 1 4 0v9a7 7 0 0 1-7 7h-2a7 7 0 0 1-4.8-1.9l-4-3.7a2 2 0 0 1 2.7-2.9L8 16"/>',
  react:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  chat:'<path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.3 9 9 0 0 1-4-.9L3 21l1.6-5A8.4 8.4 0 0 1 3 11.5a9 9 0 0 1 18 0Z"/><path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01" stroke-width="3.1"/>',
  members:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.5 1.5 0 0 0 .3 1.7l-2.1 2.1a1.5 1.5 0 0 0-1.7-.3 1.5 1.5 0 0 0-.9 1.4V21h-6v-1.1a1.5 1.5 0 0 0-.9-1.4 1.5 1.5 0 0 0-1.7.3l-2.1-2.1a1.5 1.5 0 0 0 .3-1.7 1.5 1.5 0 0 0-1.4-.9H3v-4h1.1a1.5 1.5 0 0 0 1.4-.9 1.5 1.5 0 0 0-.3-1.7l2.1-2.1a1.5 1.5 0 0 0 1.7.3 1.5 1.5 0 0 0 .9-1.4V3h4v1.1a1.5 1.5 0 0 0 .9 1.4 1.5 1.5 0 0 0 1.7-.3l2.1 2.1a1.5 1.5 0 0 0-.3 1.7 1.5 1.5 0 0 0 1.4.9H21v4h-1.1a1.5 1.5 0 0 0-1.4.9Z"/>',
  audio:'<path d="M11 5 6 9H3v6h3l5 4V5ZM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>',
  full:'<path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3M21 16v3a2 2 0 0 1-2 2h-3"/>',
  'full-exit':'<path d="M3 9h6V3M21 9h-6V3M3 15h6v6M21 15h-6v6"/>',
  'chevron-up':'<path d="m6 15 6-6 6 6"/>',
  restore:'<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 15 16 7M10 7h6v6"/>',
  hangup:'<path d="M3.5 15.4a2.1 2.1 0 0 1-1.4-2.7c1.4-4.3 5.1-6.5 9.9-6.5s8.5 2.2 9.9 6.5a2.1 2.1 0 0 1-1.4 2.7l-2.8.8a2 2 0 0 1-2.4-1.5l-.5-2.2a12 12 0 0 0-5.6 0l-.5 2.2a2 2 0 0 1-2.4 1.5l-2.8-.8Z"/>',
  cancel:'<path d="M18 6 6 18M6 6l12 12"/>'
 };
 return '<svg class="gc-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+(paths[name]||paths.settings)+'</svg>';
}
function btn(action,label,glyph,active=false,disabled=false){
 const toggle=['mic','cam','screen','react','members','settings'].includes(action);
 return '<button type="button" class="gc-tool'+(active?' is-on':'')+(action==='leave'?' is-leave':'')+(action==='settings'?' gc-tool-devices':'')+'" data-gc-action="'+action+'" '+(disabled?'disabled ':'')+'title="'+escCall(label)+'" aria-label="'+escCall(label)+'"'+(toggle?' aria-pressed="'+String(active)+'"':'')+'><span class="gc-icon-wrap" aria-hidden="true">'+icon(glyph||action)+'</span><small>'+escCall(label)+'</small></button>';
}
function syncFullscreenControl(){
 if(!S.overlay)return;
 const control=S.overlay.querySelector('[data-gc-action="fullscreen"]');
 if(!control)return;
 const full=!!(document.fullscreenElement&&S.overlay.contains(document.fullscreenElement));
 const label=full?'Sair da tela cheia':'Tela cheia';
 control.title=label;control.setAttribute('aria-label',label);
 const caption=control.querySelector('small');if(caption)caption.textContent=label;
 const symbol=control.querySelector('.gc-icon-wrap');if(symbol)symbol.innerHTML=icon(full?'full-exit':'full');
}
function status(message,seconds=5){
 S.notice=message;const node=S.overlay?.querySelector('[data-gc-status]');
 if(node){node.textContent=message;node.hidden=!message;}
 clearTimeout(S.noticeTimer);
 if(seconds)S.noticeTimer=setTimeout(()=>{S.notice='';if(node?.isConnected){node.textContent='';node.hidden=true;}},seconds*1000);
}
function getRoomColor(room){
 let hash=0;for(const c of room.id)hash=((hash*31)+c.charCodeAt(0))|0;
 return 245+(Math.abs(hash)%50);
}
function roomBadge(room){
 const first=(room.name||'G').trim().slice(0,1).toUpperCase();
 return '<span class="gc-room-badge" aria-hidden="true">'+escCall(first)+'</span>';
}
async function roomPhoto(){
 const roomId=S.room?.id;
 const path=S.room?.avatar_path;
 if(isPrivate(S.room)||isMaintenance(S.room)){
  const avatar=isMaintenance(S.room)?(person(onlineUser.id)?.avatar_url||''):(S.room.avatar_url||'');
  if(/^https:\/\/[^\s"'<>]+$/i.test(avatar)){S.photoUrl=avatar;applyPhoto();}
  return;
 }
 if(!path||!S.overlay)return;
 let url='';
 if(/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/i.test(path))url=path;
 else if(/^[A-Za-z0-9._/-]+$/.test(path)){
  try{const {data,error}=await client.storage.from('uentzoul-chat-media').createSignedUrl(path,900);if(!error)url=data?.signedUrl||'';}catch(_){}
 }
 if(!url||!S.overlay||S.room?.id!==roomId)return;
 S.photoUrl=url;applyPhoto();
}
function applyPhoto(){
 if(!S.photoUrl||!S.overlay)return;
 S.overlay.querySelectorAll('.gc-room-badge').forEach(node=>{
  if(node.querySelector('img'))return;
  const img=document.createElement('img');img.src=S.photoUrl;img.alt=isPrivate(S.room)?'Foto do contato':'Foto do grupo';node.replaceChildren(img);
 });
}
function fitViewport(){
 if(!S.overlay)return;
 const height=window.visualViewport?.height||window.innerHeight;
 if(Number.isFinite(height)&&height>200)S.overlay.style.setProperty('--gc-visible-height',Math.round(height)+'px');
}
function shell(){
 const hue=getRoomColor(S.room);
 S.overlay=document.createElement('div');S.overlay.className='gc-backdrop';
 S.overlay.style.setProperty('--gc-hue',hue);
 S.overlay.innerHTML='<section class="gc-window" role="dialog" aria-modal="true" aria-label="'+(isPrivate(S.room)?'Chamada privada':'Chamada do grupo')+'">'+
 '<header class="gc-head">'+roomBadge(S.room)+'<div class="gc-head-copy"><strong>'+escCall(S.room.name)+'</strong><small data-gc-subtitle>'+(isPrivate(S.room)?'Chamada privada':'Chamada do grupo')+'</small></div>'+
 '<span class="gc-connection" data-gc-connection>Preparando</span>'+ 
  '<button type="button" class="gc-minimize" data-gc-action="minimize" title="Minimizar chamada para continuar navegando no site" aria-label="Minimizar chamada" hidden>─</button></header>'+
 '<div class="gc-body"><div class="gc-main"><div class="gc-stage" data-gc-stage></div>'+
 '<div class="gc-reactions" aria-live="polite" data-gc-reactions></div>'+
 '<div class="gc-status" role="status" data-gc-status hidden></div>'+
 '<footer class="gc-footer"><div class="gc-controls" data-gc-controls></div></footer></div>'+
 '<aside class="gc-panel" data-gc-panel hidden></aside></div></section>';
 document.body.appendChild(S.overlay);fitViewport();draw();void roomPhoto();
}
function draw(){
 if(!S.overlay)return;
 const live=S.stage==='live',joining=S.stage==='joining',pre=S.stage==='preview';
 const mini=live&&S.minimized;
 S.overlay.classList.toggle('is-mini',mini);
 const windowEl=S.overlay.querySelector('.gc-window');
 if(windowEl){windowEl.setAttribute('aria-modal',mini?'false':'true');windowEl.setAttribute('role',mini?'region':'dialog');}
 const minimize=S.overlay.querySelector('.gc-minimize');
 if(minimize)minimize.hidden=!live||mini;
 const head=S.overlay.querySelector('[data-gc-subtitle]');
 const conn=S.overlay.querySelector('[data-gc-connection]');
 if(head)head.textContent=pre?'Configure áudio e vídeo':mini?'Chamada em andamento':live?'Conversa por voz e vídeo':joining?'Conectando os participantes…':'Chamada';
 if(conn){conn.textContent=pre?'Prévia':joining?'Conectando…':live?'Ao vivo':'Finalizada';conn.classList.toggle('is-live',live);}
 const controls=S.overlay.querySelector('[data-gc-controls]');
 if(controls){
  controls.innerHTML=mini?
   btn('mic',S.mic?'Desativar microfone':'Ativar microfone',S.mic?'mic':'mic-off',S.mic,S.micBusy)+
   btn('cam',S.cam?'Desligar câmera':'Ligar câmera',S.cam?'cam':'cam-off',S.cam,S.camBusy)+
   btn('restore','Abrir chamada completa','restore')+
   btn('leave','Sair da call','hangup'):
   btn('mic',S.mic?'Desativar microfone':'Ativar microfone',S.mic?'mic':'mic-off',S.mic,S.micBusy)+
   btn('cam',S.cam?'Desligar câmera':'Ligar câmera',S.cam?'cam':'cam-off',S.cam,S.camBusy)+
   (live?btn('screen',S.screen?'Parar apresentação':'Compartilhar tela',S.screen?'screen-stop':'screen',S.screen,S.screenBusy||!navigator.mediaDevices?.getDisplayMedia):'')+
   (live?btn('react','Reagir','react',S.panel==='react'):'')+
   (live?btn('members','Participantes','members',S.panel==='members'):'')+
   (live?btn('settings','Áudio e vídeo','chevron-up',S.panel==='settings'):'')+
   (live?btn('audio-play','Ativar som','audio'):'')+
   (live?btn('fullscreen',document.fullscreenElement?'Sair da tela cheia':'Tela cheia',document.fullscreenElement?'full-exit':'full'):'')+
   (pre?'<button type="button" class="gc-join" data-gc-action="join">Participar da call</button>':'')+
   (joining?'<button type="button" class="gc-join" disabled>Entrando…</button>':'')+
   btn(pre?'cancel':'leave',pre?'Cancelar':'Sair da call',pre?'cancel':'hangup');
 }
 if(pre||joining){
  const stage=S.overlay.querySelector('[data-gc-stage]');
  stage.innerHTML='<div class="gc-preview">'+
   '<div class="gc-preview-art">'+roomBadge(S.room)+'</div>'+
   '<h2>'+escCall(S.room.name)+'</h2>'+
   '<p>'+(joining?'Estabelecendo a conexão da chamada…':isMaintenance(S.room)?'Call pessoal do Chat de Manutenção. Teste microfone, câmera, compartilhamento de tela e outros controles. Ninguém mais entra nesta chamada.':isPrivate(S.room)?'Você e este contato podem entrar nesta chamada privada. O outro participante só ouvirá ou verá você quando os dispositivos estiverem ligados.':'Ao entrar, os membros do grupo poderão te ouvir e ver quando os dispositivos estiverem ligados.')+'</p>'+
   '<small>O microfone '+(S.mic?'será ligado':'ficará desligado')+' e a câmera '+(S.cam?'será ligada':'ficará desligada')+'.</small></div>';
 }else if(live){tiles();}
 applyPhoto();panelDraw();
}
function profileAvatarUrl(value){
 if(typeof value!=='string')return '';
 if(/^https:\/\/[^\s"'<>]+$/i.test(value))return value;
 if(/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/i.test(value))return value;
 return '';
}
// A foto do perfil é gravada no bucket público como <user_id>/avatar.jpg.
// O URL direto continua disponível mesmo se o perfil ainda não entrou na lista do chat.
function directAvatarUrl(userId){
 if(!UUID.test(userId||''))return '';
 try{
  const link=client.storage.from('uentzoul-avatars').getPublicUrl(userId+'/avatar.jpg')?.data?.publicUrl;
  return profileAvatarUrl(link);
 }catch(_){return '';}
}
function callAvatarCandidates(userId){
 const profile=bridge.profile?.(userId)||person(userId)||{};
 const candidates=[
  directAvatarUrl(userId),
  profileAvatarUrl(profile.avatar_url),
  profileAvatarUrl(person(userId)?.avatar_url),
  profileAvatarUrl(S.avatarProfiles.get(userId))
 ];
 return [...new Set(candidates.filter(Boolean))];
}
function callAvatarUrl(userId){return callAvatarCandidates(userId)[0]||'';}
function avatarBubble(userId,name,cls){
 return '<span class="'+cls+'" data-gc-avatar-user="'+escCall(userId||'')+'">'+
  '<span class="gc-avatar-initial">'+escCall((name||'?').trim().slice(0,1).toUpperCase()||'?')+'</span>'+
  '<img class="gc-avatar-photo" alt="" hidden decoding="async"></span>';
}
function syncAvatarBubble(node,userId,name){
 if(!node)return;
 const fallback=node.querySelector('.gc-avatar-initial');
 const img=node.querySelector('img.gc-avatar-photo');
 if(!fallback||!img)return;
 fallback.textContent=(name||'?').trim().slice(0,1).toUpperCase()||'?';
 node.dataset.gcAvatarUser=userId||'';
 const urls=callAvatarCandidates(userId);
 const signature=urls.join('|');
 const lastFailed=Number(node.dataset.gcAvatarFailedAt)||0;
 // Repetir tentativas após falha, mas não recriar a imagem a cada render do vídeo.
 if(node.dataset.gcAvatarSignature===signature&&!(lastFailed&&Date.now()-lastFailed>30000))return;
 node.dataset.gcAvatarSignature=signature;
 node.dataset.gcAvatarFailedAt='';
 img.hidden=true;fallback.hidden=false;
 node.classList.remove('gc-has-photo');
 if(!urls.length){
  img.removeAttribute('src');
  img.dataset.gcAvatarUrl='';
  return;
 }
 const token=String(Date.now())+Math.random();
 img.dataset.gcAvatarToken=token;
 const display=()=>{
  if(img.dataset.gcAvatarToken!==token)return;
  img.hidden=false;fallback.hidden=true;
  node.classList.add('gc-has-photo');
  node.dataset.gcAvatarFailedAt='';
 };
 const loadCandidate=(index)=>{
  if(img.dataset.gcAvatarToken!==token)return;
  const url=urls[index];
  if(!url){
   node.dataset.gcAvatarFailedAt=String(Date.now());
   img.hidden=true;fallback.hidden=false;
   node.classList.remove('gc-has-photo');
   img.dataset.gcAvatarUrl='';
   img.removeAttribute('src');
   return;
  }
  img.dataset.gcAvatarUrl=url;
  img.onload=()=>{if(img.dataset.gcAvatarUrl===url)display()};
  img.onerror=()=>{if(img.dataset.gcAvatarUrl===url)loadCandidate(index+1)};
  img.src=url;
  if(img.complete&&img.naturalWidth>0)display();
 };
 loadCandidate(0);
}
async function refreshCallAvatars(){
 if(S.stage!=='live'||!S.room||!eligible()||S.avatarLoading)return;
 const users=[...new Set([...S.presence.values()].map(m=>m.userId).filter(id=>UUID.test(id||'')))];
 if(!users.length)return;
 const now=Date.now();
 if(now-S.avatarRefreshAt<15000)return;
 if(users.every(id=>S.avatarProfiles.has(id))&&now-S.avatarRefreshAt<120000)return;
 const generation=S.generation,room=S.room;
 S.avatarLoading=true;S.avatarRefreshAt=now;
 try{
  const {data,error}=await client.from('uentzoul_profiles').select('user_id,avatar_url').in('user_id',users);
  if(error)throw error;
  if(generation!==S.generation||S.room!==room||S.stage!=='live')return;
  const found=new Map((data||[]).map(p=>[p.user_id,profileAvatarUrl(p.avatar_url)]));
  for(const id of users){
   const avatar=found.get(id);
   if(avatar)S.avatarProfiles.set(id,avatar);
   else S.avatarProfiles.delete(id);
  }
  tiles();
  if(S.panel==='members')panelDraw();
 }catch(e){console.warn('Não foi possível carregar as fotos dos participantes da call',e);}
 finally{S.avatarLoading=false;}
}
function tileNode(key){
 const outer=document.createElement('article');outer.className='gc-tile';outer.dataset.key=key;
 outer.innerHTML='<video autoplay playsinline muted></video><audio autoplay playsinline data-gc-peer-audio></audio>'+avatarBubble('','?','gc-avatar')+
  '<div class="gc-tile-info"><strong data-gc-name></strong><span data-gc-icons></span></div>'+
  '<button type="button" class="gc-volume-open" data-gc-action="volume-peer" data-gc-key="'+escCall(key)+'" title="Ajustar volume desta pessoa" aria-label="Ajustar volume desta pessoa">'+icon('audio')+'</button>'+
  '<button type="button" class="gc-pin" data-gc-action="pin" data-gc-key="'+escCall(key)+'" aria-label="Fixar participante" title="Fixar participante">⛶</button>';
 return outer;
}
function mediaFor(key){
 if(key===S.key)return S.stream;
 return S.peers.get(key)?.stream||null;
}
function restartTile(key){
 const tile=[...(S.overlay?.querySelectorAll('.gc-tile')||[])].find(t=>t.dataset.key===key);
 const video=tile?.querySelector('video');
 if(video){video.srcObject=null;video._gcTrack=null;}
 tiles();
}
function tiles(){
 const stage=S.overlay?.querySelector('[data-gc-stage]');if(!stage)return;
 stage.classList.toggle('gc-tilegrid',true);
 const members=[...S.presence.entries()];
 if(!members.some(([key])=>key===S.key)&&S.key)members.unshift([S.key,meta()]);
 if(!members.length)members.push([S.key,meta()]);
 const keys=new Set(members.map(([key])=>key));
 stage.querySelectorAll('.gc-preview').forEach(x=>x.remove());
 stage.querySelectorAll('.gc-tile').forEach(x=>{if(!keys.has(x.dataset.key))x.remove()});
 const single=members.length<=2;
 stage.classList.toggle('gc-few',single);
 const main=(
  (S.pinned&&keys.has(S.pinned)?S.pinned:null)||
  members.find(([key,m])=>key!==S.key&&m.screen)?.[0]||
  members.find(([key,m])=>key!==S.key&&m.cam)?.[0]||
  members.find(([key])=>key!==S.key)?.[0]||S.key
 );
 const showSelf=main!==S.key&&S.cam&&!!S.camera;
 stage.classList.toggle('gc-presenting',members.some(([k,m])=>m.screen)||!!S.pinned);
 members.forEach(([key,m])=>{
  let tile=[...stage.children].find(x=>x.classList.contains('gc-tile')&&x.dataset.key===key);
  if(!tile){tile=tileNode(key);stage.appendChild(tile);}
  tile.classList.toggle('gc-featured',S.pinned?S.pinned===key:!!m.screen);
  tile.classList.toggle('gc-mini-featured',key===main);
  tile.classList.toggle('gc-mini-self',showSelf&&key===S.key);
  tile.classList.toggle('gc-is-self',key===S.key);
  const name=m.name||person(m.userId).display_name||'Participante';
  tile.querySelector('[data-gc-name]').textContent=name+(key===S.key?' (você)':'');
  tile.querySelector('[data-gc-icons]').textContent=(m.mic?'🎙':'🔇')+(m.hand?' ✋':'')+(m.screen?' ▤':'');
  const avatar=tile.querySelector('.gc-avatar');syncAvatarBubble(avatar,m.userId,name);
  const v=tile.querySelector('video'),media=mediaFor(key);
  const audioEl=tile.querySelector('[data-gc-peer-audio]'),peer=S.peers.get(key),remoteAudio=peer?.audioStream||null;
  const track=media?.getVideoTracks().find(t=>t.readyState==='live')||null;
  const videoOn=!!(m.cam||m.screen)&&!!track&&!track.muted;
  // Alterar faixas num mesmo MediaStream exige reanexar o elemento de vídeo.
  if(v.srcObject!==media||v._gcTrack!==track){
   v.srcObject=null;v._gcTrack=track;
   if(media)v.srcObject=media;
   v.muted=true;v.volume=0;
  }
  v.classList.toggle('is-visible',videoOn);
  avatar.hidden=videoOn;
  if(media&&v.paused)v.play().catch(()=>{});
  if(key===S.key){audioEl.muted=true;audioEl.srcObject=null;}
  else{
   if(audioEl.srcObject!==remoteAudio)audioEl.srcObject=remoteAudio;
   applyPeerAudio(key,m.userId,audioEl);
   if(remoteAudio?.getAudioTracks().some(t=>t.readyState==='live')&&audioEl.paused)audioEl.play().catch(()=>{});
  }
  const adjust=tile.querySelector('.gc-volume-open');
  if(adjust)adjust.hidden=key===S.key;
  tile.classList.toggle('gc-is-presenting',!!m.screen);
 });
}
function meta(){return {userId:onlineUser?.id||'',name:myName(),mic:S.mic&&!!S.audio,cam:S.cam&&!!S.camera,screen:S.screen&&!!S.display,hand:S.hand,joinedAt:S.callStarted};}
async function publish(){
 if(S.stage!=='live'||!S.key)return;
 const generation=S.generation,channel=S.channel;
 // A interface local reage imediatamente. O servidor recebe somente o estado
 // final do conjunto de cliques, no máximo uma atualização por segundo.
 S.presence.set(S.key,meta());
 try{draw()}catch(e){console.warn('Erro visual recuperável na call',e)}
 clearTimeout(S.presenceTimer);
 if(!channel)return;
 const signature=JSON.stringify(meta());
 if(S.lastPresenceChannel===channel&&signature===S.lastPresenceSignature)return;
 const delay=Math.max(350,1100-(Date.now()-S.lastPresenceAt));
 S.presenceTimer=setTimeout(async()=>{
  S.presenceTimer=null;
  if(generation!==S.generation||S.stage!=='live'||S.channel!==channel)return;
  const payload=meta(),currentSignature=JSON.stringify(payload);
  if(S.lastPresenceChannel===channel&&currentSignature===S.lastPresenceSignature)return;
  try{
   const outcome=await channel.track(payload);
   if(outcome==='error'||outcome==='timed out')throw Error(String(outcome));
   if(generation===S.generation&&S.channel===channel){
    S.lastPresenceAt=Date.now();
    S.lastPresenceSignature=currentSignature;
    S.lastPresenceChannel=channel;
   }
  }catch(e){console.warn('Falha recuperável ao atualizar presença da call',e)}
 },delay);
}
/* Volume e mudo são locais por usuário: não modificam o áudio transmitido.
   Elemento de áudio isolado evita que a câmera ao ligar/desligar corte a voz. */
function volumeKey(){return 'uentzoul_call_volumes_v1:'+String(onlineUser.id||'anon');}
function boostAvailable(){return !!(window.AudioContext||window.webkitAudioContext);}
function volumeLimit(){return boostAvailable()?200:100;}
function peerLevel(id){return S.audioLevels.get(id)||{volume:100,muted:false};}
function loadPeerVolumes(){
 S.audioLevels.clear();
 try{
  const rows=JSON.parse(localStorage.getItem(volumeKey())||'{}');
  if(!rows||typeof rows!=='object')return;
  for(const [id,level] of Object.entries(rows).slice(0,250)){
   const v=Number(level?.volume);
   if(UUID.test(id)&&Number.isFinite(v))S.audioLevels.set(id,{volume:Math.max(0,Math.min(200,Math.round(v))),muted:level?.muted===true});
  }
 }catch(_){}
}
function savePeerVolumes(){
 try{localStorage.setItem(volumeKey(),JSON.stringify(Object.fromEntries([...S.audioLevels.entries()].slice(-250))))}catch(_){}
}
function disposePeerAudio(key){
 const node=S.audioNodes.get(key);
 if(!node)return;
 try{node.source.disconnect();node.gain.disconnect()}catch(_){}
 S.audioNodes.delete(key);
}
function gainForPeer(key,element){
 const previous=S.audioNodes.get(key);
 if(previous?.element===element)return previous;
 if(previous)disposePeerAudio(key);
 const Engine=window.AudioContext||window.webkitAudioContext;
 if(!Engine)return null;
 try{
  if(!S.audioContext||S.audioContext.state==='closed')S.audioContext=new Engine();
  const source=S.audioContext.createMediaElementSource(element),gain=S.audioContext.createGain();
  source.connect(gain);gain.connect(S.audioContext.destination);
  const node={source,gain,element};S.audioNodes.set(key,node);
  if(S.audioContext.state==='suspended')void S.audioContext.resume().catch(()=>{});
  return node;
 }catch(e){console.warn('Amplificação de áudio indisponível',e);return null;}
}
function applyPeerAudio(key,userId,element){
 if(!element||key===S.key)return;
 const prefs=peerLevel(userId);
 const volume=Math.min(volumeLimit(),Math.max(0,Number(prefs.volume)||0));
 const graph=volume>100||S.audioNodes.has(key)?gainForPeer(key,element):null;
 if(graph){
  element.volume=1;element.muted=false;
  graph.gain.gain.value=prefs.muted?0:volume/100;
 }else{
  element.volume=(prefs.muted?0:Math.min(volume,100))/100;
  element.muted=prefs.muted||volume===0;
 }
}
function updateVolumeControls(id){
 const panel=S.overlay?.querySelector('[data-gc-panel]');
 if(!panel)return;
 const pref=peerLevel(id);
 panel.querySelectorAll('[data-gc-member-user]').forEach(row=>{
  if(row.dataset.gcMemberUser!==id)return;
  const slider=row.querySelector('[data-gc-volume]'),value=row.querySelector('[data-gc-volume-value]'),mute=row.querySelector('[data-gc-action="mute-peer"]');
  if(slider&&document.activeElement!==slider)slider.value=String(Math.min(pref.volume,volumeLimit()));
  if(value)value.textContent=String(pref.volume)+'%';
  if(mute){
   mute.textContent=pref.muted?'Ativar som':'Silenciar';
   mute.setAttribute('aria-pressed',String(pref.muted));
   mute.classList.toggle('is-muted',pref.muted);
  }
 });
}
function updateVolumeForUser(id){
 for(const [key] of S.peers){
  if(S.presence.get(key)?.userId!==id)continue;
  const tile=[...(S.overlay?.querySelectorAll('.gc-tile')||[])].find(t=>t.dataset.key===key);
  applyPeerAudio(key,id,tile?.querySelector('[data-gc-peer-audio]'));
 }
 updateVolumeControls(id);
}
function validVolumeTarget(id){
 return S.stage==='live'&&UUID.test(id||'')&&id!==onlineUser.id&&[...S.presence.values()].some(m=>m.userId===id);
}
function setPeerVolume(id,newValue){
 if(!validVolumeTarget(id))return;
 const volume=Math.max(0,Math.min(volumeLimit(),Math.round(Number(newValue)||0)));
 S.audioLevels.set(id,{volume,muted:false});
 savePeerVolumes();updateVolumeForUser(id);
}
function togglePeerMute(id){
 if(!validVolumeTarget(id))return;
 const p=peerLevel(id);
 S.audioLevels.set(id,{volume:p.volume,muted:!p.muted});
 savePeerVolumes();updateVolumeForUser(id);
}
function enablePeerSounds(){
 if(S.audioContext?.state==='suspended')void S.audioContext.resume().catch(()=>{});
 S.overlay?.querySelectorAll('[data-gc-peer-audio]').forEach(audio=>{
  if(audio.srcObject?.getAudioTracks()?.length)void audio.play().catch(()=>{});
 });
}
function createStream(){
 const stream=new MediaStream();
 S.stream=stream;return stream;
}
/* Trocas de mídia transacionais: se algum participante rejeitar o novo
   dispositivo, restauramos o anterior antes de liberar a captura antiga. */
async function swapSenderTracks(kind,next,generation=S.generation){
 const senderKey=kind==='audio'?'audioSender':'videoSender';
 const entries=[...S.peers.values()]
  .filter(peer=>peer.pc?.signalingState!=='closed'&&peer[senderKey])
  .map(peer=>({peer,sender:peer[senderKey],before:peer[senderKey].track||null}))
  .filter(entry=>entry.before!==next);
 if(!entries.length)return;
 const results=await Promise.allSettled(entries.map(entry=>entry.sender.replaceTrack(next)));
 const failed=results.find(item=>item.status==='rejected');
 const stale=generation!==S.generation||S.stage==='off';
 if(failed||stale){
  const restored=await Promise.allSettled(entries.map((entry,index)=>
   results[index].status==='fulfilled'&&entry.peer.pc?.signalingState!=='closed'
    ?entry.sender.replaceTrack(entry.before):Promise.resolve()
  ));
  restored.forEach((result,index)=>{
   if(result.status==='rejected'){
    console.warn('Não foi possível restaurar a faixa anterior em um participante',result.reason);
    if(S.stage==='live')schedulePeerRecovery(entries[index].peer);
   }
  });
  throw failed?.reason||Error('Chamada mudou durante a troca do dispositivo.');
 }
}
async function captureAudio(deviceId='',generation=S.generation){
 const settings={echoCancellation:true,noiseSuppression:true,autoGainControl:true,...(deviceId?{deviceId:{exact:deviceId}}:{})};
 const stream=await navigator.mediaDevices.getUserMedia({audio:settings,video:false});
 const next=stream.getAudioTracks()[0];
 if(!next){stream.getTracks().forEach(t=>t.stop());throw Error('Microfone indisponível.');}
 if(generation!==S.generation||S.stage==='off'){stream.getTracks().forEach(t=>t.stop());throw Error('Chamada encerrada');}
 const old=S.audio;next.enabled=S.mic;
 try{
  await swapSenderTracks('audio',next,generation);
  if(generation!==S.generation||S.stage==='off')throw Error('Chamada encerrada');
  S.audio=next;
  if(S.stream){for(const t of S.stream.getAudioTracks())S.stream.removeTrack(t);S.stream.addTrack(next);}
  if(old&&old!==next)old.stop();
 }catch(e){next.stop();throw e;}
}
async function captureCamera(deviceId='',generation=S.generation){
 const settings={width:{ideal:640,max:960},height:{ideal:360,max:540},frameRate:{ideal:15,max:20},...(deviceId?{deviceId:{exact:deviceId}}:{facingMode:'user'})};
 const stream=await navigator.mediaDevices.getUserMedia({video:settings,audio:false});
 const next=stream.getVideoTracks()[0];
 if(!next){stream.getTracks().forEach(t=>t.stop());throw Error('Câmera indisponível.');}
 if(generation!==S.generation||S.stage==='off'){stream.getTracks().forEach(t=>t.stop());throw Error('Chamada encerrada');}
 const old=S.camera;S.camera=next;
 try{
  await replaceVideo();
  if(generation!==S.generation||S.stage==='off')throw Error('Chamada encerrada');
  if(old&&old!==next)old.stop();
 }catch(e){if(generation===S.generation)S.camera=old;next.stop();throw e;}
}
async function tuneVideo(){
 const peers=[...S.peers.values()].filter(p=>p.pc.connectionState==='connected');
 const outgoing=Math.max(1,peers.length);
 const bitrate=S.screen?Math.max(650000,Math.min(1400000,Math.floor(4200000/outgoing))):
  Math.max(220000,Math.min(560000,Math.floor(1900000/outgoing)));
 const fps=S.screen?12:15;
 await Promise.all(peers.map(async p=>{
  // Não reaplicar setParameters em toda sincronização de presença.
  if(p.videoBitrate===bitrate&&p.videoFps===fps)return;
  try{
   const sender=p.videoSender,params=sender.getParameters?.();
   if(!params?.encodings?.length)return;
   params.encodings[0].maxBitrate=bitrate;
   params.encodings[0].maxFramerate=fps;
   await sender.setParameters(params);
   p.videoBitrate=bitrate;p.videoFps=fps;
  }catch(_){/* Alguns dispositivos não suportam parâmetros avançados. */}
 }));
}
function replaceVideo(){
 const generation=S.generation;
 const update=async()=>{
  if(generation!==S.generation||S.stage==='off')return;
  const selected=(S.display?.readyState==='live'?S.display:null)||(S.camera?.readyState==='live'?S.camera:null);
  // A stream local só muda depois da troca bem-sucedida para os peers.
  await swapSenderTracks('video',selected,generation);
  if(generation!==S.generation||S.stage==='off')return;
  if(S.stream){
   for(const track of S.stream.getVideoTracks())S.stream.removeTrack(track);
   if(selected)S.stream.addTrack(selected);
  }
  void tuneVideo();
  if(S.stage==='live'){
   // replaceTrack NÃO renegocia SDP. Uma chamada criada com câmera desligada
   // pode ficar com a direção de vídeo recvonly/inactive; nesse caso a faixa
   // existe no sender mas não chega ao receptor até uma nova oferta/resposta.
   for(const peer of S.peers.values())requestMediaRenegotiation(peer);
   await publish();
  }else draw();
 };
 const pending=videoReplaceQueue.then(update,update);
 videoReplaceQueue=pending.catch(()=>{});
 return pending;
}
async function toggleMic(){
 if(S.micBusy||!['preview','live'].includes(S.stage))return;
 if(S.stage!=='live'){S.mic=!S.mic;draw();return;}
 S.micBusy=true;draw();
 const generation=S.generation;
 try{
  S.mic=!S.mic;
  if(S.mic&&!S.audio){
   try{await captureAudio(S.micDevice,generation)}
   catch(e){if(generation===S.generation){S.mic=false;status('Não foi possível ativar o microfone. Confira as permissões.');}}
  }else if(S.audio)S.audio.enabled=S.mic;
  if(generation===S.generation&&S.stage==='live')await publish();
 }finally{S.micBusy=false;if(S.stage==='live')draw();}
}
async function toggleCam(){
 if(S.camBusy||!['preview','live'].includes(S.stage))return;
 if(S.stage!=='live'){S.cam=!S.cam;draw();return;}
 S.camBusy=true;draw();
 const generation=S.generation;
 try{
  if(S.cam){
   S.cam=false;
   const old=S.camera;S.camera=null;
   try{await replaceVideo();old?.stop();}
   catch(e){S.camera=old;S.cam=true;throw e;}
  }else{
   S.cam=true;
   try{await captureCamera(S.camDevice,generation);}
   catch(e){if(generation===S.generation){S.cam=false;status('Não foi possível ativar a câmera. Confira a permissão ou selecione outra câmera.');}}
  }
  if(generation===S.generation&&S.stage==='live')draw();
 }catch(e){
  console.warn('Falha ao alternar a câmera sem encerrar a call',e);
  if(generation===S.generation){S.cam=!!S.camera;status('Falha temporária ao trocar a câmera. A call continua ativa.');}
 }finally{S.camBusy=false;if(generation===S.generation&&S.stage==='live')draw();}
}
async function toggleScreen(){
 if(S.screenBusy)return;
 S.screenBusy=true;
 const generation=S.generation;
 try{
  if(S.screen){await endScreen();return;}
  if(!navigator.mediaDevices?.getDisplayMedia){status('Compartilhamento de tela não disponível neste navegador.');return;}
  const stream=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:{ideal:15,max:20}},audio:false});
  if(generation!==S.generation||S.stage!=='live'){stream.getTracks().forEach(t=>t.stop());return;}
  const track=stream.getVideoTracks()[0];
  if(!track){stream.getTracks().forEach(t=>t.stop());throw Error('Não há vídeo');}
  try{track.contentHint='detail';}catch(_){}
  S.display=track;S.screen=true;
  track.addEventListener('ended',()=>{
   if(S.display===track)void endScreen().catch(e=>console.warn('Falha ao restaurar a câmera após encerrar a apresentação',e));
  },{once:true});
  track.addEventListener('mute',()=>{
   if(S.display!==track)return;
   clearTimeout(S.screenMuteTimer);
   S.screenMuteTimer=setTimeout(()=>{
    if(S.display===track&&track.muted&&S.stage==='live'&&document.visibilityState==='visible'){
     status('A tela parou de enviar imagem. Compartilhe novamente para retomar.',10);
     void endScreen().catch(e=>console.warn('Falha ao parar o compartilhamento sem vídeo',e));
    }
   },12000);
  });
  track.addEventListener('unmute',()=>clearTimeout(S.screenMuteTimer));
  try{await replaceVideo();}
  catch(e){
   // A tela não entra no lugar da câmera se algum sender rejeitar a troca.
   if(S.display===track){S.display=null;S.screen=false;track.stop();}
   throw e;
  }
 }catch(e){if(e?.name!=='NotAllowedError'&&generation===S.generation)status('Não foi possível iniciar a apresentação da tela.');}
 finally{S.screenBusy=false;if(S.stage==='live')draw();}
}
async function endScreen(){
 const old=S.display;
 if(!old&&!S.screen)return;
 S.display=null;S.screen=false;
 clearTimeout(S.screenMuteTimer);S.screenMuteTimer=null;
 // Primeiro substitui a faixa remota; se houver erro, mantém a tela ativa
 // quando ela ainda estiver disponível, sem interromper microfone ou call.
 try{
  await replaceVideo();
  if(old)try{old.stop()}catch(_){}
 }catch(e){
  if(old?.readyState==='live'&&S.stage==='live'){
   S.display=old;S.screen=true;
   status('Falha temporária ao parar a apresentação. A call continua ativa.',7);
  }else if(old){
   try{old.stop()}catch(_){}
   status('A apresentação terminou, mas houve falha ao retomar a câmera.',7);
  }
  throw e;
 }
}
function iceConfig(){
 const defaults=[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}];
 const extra=Array.isArray(window.UENTZOUL_CALL_ICE_SERVERS)?window.UENTZOUL_CALL_ICE_SERVERS.filter(s=>s&&typeof s.urls==='string'&&/^turns?:/.test(s.urls)):[];
 return {iceServers:[...defaults,...extra],bundlePolicy:'max-bundle'};
}
function signal(to,body){
 if(!S.channel?.send||S.stage!=='live')return Promise.resolve();
 return S.channel.send({type:'broadcast',event:'webrtc',payload:{from:S.key,to,...body}})
 .then(result=>{if(result==='error'||result==='timed out')throw Error('Falha no Broadcast: '+result);})
 .catch(e=>console.warn('Falha de sinalização',e));
}
async function offer(peer,iceRestart=false){
 if(peer.busy||peer.pc.signalingState!=='stable'||S.stage!=='live'||S.peers.get(peer.key)!==peer)return;
 peer.busy=true;
 try{
  const description=await peer.pc.createOffer(iceRestart?{iceRestart:true}:{});
  if(S.peers.get(peer.key)!==peer||S.stage!=='live')return;
  await peer.pc.setLocalDescription(description);
  // A primeira oferta pode ser enviada antes de o outro navegador terminar
  // sua inscrição no Realtime. Guardamos o instante para recuperá-la.
  peer.lastOfferAt=Date.now();
  await signal(peer.key,{description:peer.pc.localDescription?.toJSON?.()||peer.pc.localDescription});
 }catch(e){console.warn('Negociação WebRTC',e);}finally{peer.busy=false;}
}
function requestMediaRenegotiation(peer){
 if(S.stage!=='live'||S.peers.get(peer.key)!==peer||peer.pc.signalingState==='closed')return;
 clearTimeout(peer.mediaTimer);
 peer.mediaTimer=setTimeout(()=>{
  peer.mediaTimer=null;
  if(S.stage!=='live'||S.peers.get(peer.key)!==peer||peer.pc.signalingState==='closed')return;
  if(S.key<peer.key){
   // Somente um lado gera SDP, evitando glare entre dois offerers.
   if(peer.pc.signalingState!=='stable'||peer.busy){requestMediaRenegotiation(peer);return;}
   void offer(peer);
  }else{
   // O peer de maior chave nunca cria oferta; pede ao originador.
   void signal(peer.key,{mediaChanged:true});
  }
 },420);
}
function announcePeerReady(peer){
 if(S.stage!=='live'||S.key<peer.key||S.peers.get(peer.key)!==peer)return;
 const now=Date.now();
 if(now-(peer.lastReadyAt||0)<3200)return;
 peer.lastReadyAt=now;
 void signal(peer.key,{ready:true});
}
// Uma oferta perdida deixa o originador em have-local-offer para sempre.
// O participante que entrou depois confirma que está pronto, e o originador
// refaz a oferta; o monitor também recupera a situação se o aviso se perder.
async function recoverHandshake(peer,urgent=false){
 if(S.stage!=='live'||S.peers.get(peer.key)!==peer||peer.pc.signalingState==='closed')return;
 const pc=peer.pc,now=Date.now();
 if(pc.connectionState==='connected'||pc.iceConnectionState==='connected'||pc.iceConnectionState==='completed')return;
 if(S.key>peer.key){announcePeerReady(peer);return;}
 if(peer.busy)return;
 let discardedOffer=false;
 if(pc.signalingState==='have-local-offer'){
  if(now-(peer.lastOfferAt||0)<(urgent?900:6500))return;
  discardedOffer=true;
  peer.busy=true;
  try{await pc.setLocalDescription({type:'rollback'});}
  catch(e){console.warn('Falha ao recuperar oferta WebRTC',e);return;}
  finally{peer.busy=false;}
 }
 if(S.stage!=='live'||S.peers.get(peer.key)!==peer||pc.signalingState!=='stable')return;
 if(peer.lastAnswerAt&&now-peer.lastAnswerAt<13000)return;
 if(!urgent&&now-(peer.lastOfferAt||0)<3500)return;
 // Se a primeira oferta (e seus candidatos ICE) se perdeu, reiniciar ICE
 // para retransmitir candidatos utilizáveis depois que o outro entrou.
 await offer(peer,discardedOffer||!!peer.lastAnswerAt);
}
function checkPeerConnections(){
 if(S.stage!=='live'||!S.channel)return;
 const now=Date.now();
 for(const peer of S.peers.values()){
  const pc=peer.pc;
  if(pc.connectionState==='connected'||pc.iceConnectionState==='connected'||pc.iceConnectionState==='completed'){
   peer.missingSince=0;continue;
  }
  if(!peer.missingSince)peer.missingSince=now;
  void recoverHandshake(peer);
  if(now-peer.missingSince>18000&&now-(peer.lastConnectionNotice||0)>30000){
   peer.lastConnectionNotice=now;
   status('A conexão de mídia com outro participante não foi estabelecida. Algumas redes exigem servidor TURN.',10);
  }
 }
}
function requestPeerRecovery(peer){
 if(S.stage!=='live'||S.peers.get(peer.key)!==peer||peer.pc.signalingState==='closed')return;
 if(S.key<peer.key)void offer(peer,true);
 else void signal(peer.key,{restartVideo:true});
}
function schedulePeerRecovery(peer){
 if(peer.recoveryTimer||S.stage!=='live'||S.peers.get(peer.key)!==peer)return;
 const delay=Math.min(25000,peer.retries?5000*peer.retries:4000);
 peer.recoveryTimer=setTimeout(()=>{
  peer.recoveryTimer=null;
  if(S.stage!=='live'||S.peers.get(peer.key)!==peer)return;
  if(['failed','disconnected'].includes(peer.pc.connectionState)||['failed','disconnected'].includes(peer.pc.iceConnectionState)){
   peer.retries=Math.min(peer.retries+1,5);
   requestPeerRecovery(peer);
   schedulePeerRecovery(peer);
  }
 },delay);
}
// Só recupera vídeo sem imagem real; não reinicia capturas estáticas funcionais.
function checkVideoHealth(){
 if(S.stage!=='live'||S.minimized||!S.overlay||document.visibilityState!=='visible')return;
 const now=Date.now(),stage=S.overlay.querySelector('[data-gc-stage]');
 for(const [key,member] of S.presence){
  if(key===S.key||!(member.screen||member.cam))continue;
  const peer=S.peers.get(key);
  const tile=[...(stage?.querySelectorAll('.gc-tile')||[])].find(t=>t.dataset.key===key);
  const video=tile?.querySelector('video');
  if(!peer||!video)continue;
  const track=peer.stream.getVideoTracks().find(t=>t.readyState==='live');
  const healthy=!!track&&!track.muted&&video.videoWidth>0&&video.videoHeight>0&&video.readyState>=2;
  if(healthy){peer.videoMissingSince=0;continue;}
  if(!peer.videoMissingSince)peer.videoMissingSince=now;
  if(now-peer.videoMissingSince<9000||now-peer.lastVideoRecoverAt<18000)continue;
  peer.lastVideoRecoverAt=now;
  restartTile(key);
  // ICE pode estar conectado e ainda assim não existir faixa de vídeo,
  // porque a câmera foi ligada após o SDP inicial sem renegociação.
  if((!track||track.muted)&&now-(peer.lastMediaRequestAt||0)>15000){
   peer.lastMediaRequestAt=now;
   requestMediaRenegotiation(peer);
  }
  // A câmera pode trocar de faixa sem que a conexão de rede esteja falhando.
  // Reiniciar ICE por ausência temporária de vídeo também corta o áudio.
  if(now-peer.videoMissingSince>=18000&&
   (['failed','disconnected'].includes(peer.pc.connectionState)||
    ['failed','disconnected'].includes(peer.pc.iceConnectionState)))
   requestPeerRecovery(peer);
 }
}
function ensurePeer(key){
 if(!key||key===S.key||S.peers.has(key)||S.stage!=='live')return S.peers.get(key);
 const pc=new RTCPeerConnection(iceConfig());
 // Apenas o iniciador cria as transceivers antes da primeira oferta.
 // No respondedor, setRemoteDescription(offer) cria as transceivers já
 // associadas aos m-lines do SDP. Criá-las antes gera DUPLICATAS com
 // mid=null, fazendo replaceTrack enviar vídeo por uma faixa NÃO negociada.
 const initiator=S.key<key;
 const audioSender=initiator?pc.addTransceiver('audio',{direction:'sendrecv'}).sender:null;
 const videoSender=initiator?pc.addTransceiver('video',{direction:'sendrecv'}).sender:null;
 const peer={key,pc,audioSender,videoSender,stream:new MediaStream(),audioStream:new MediaStream(),candidates:[],busy:false,retries:0,recoveryTimer:null,departTimer:null,mediaTimer:null,lastMediaRequestAt:0,videoMissingSince:0,lastVideoRecoverAt:0,lastOfferAt:0,lastAnswerAt:0,lastReadyAt:0,missingSince:0,lastConnectionNotice:0};
 S.peers.set(key,peer);
 if(audioSender&&S.audio)void audioSender.replaceTrack(S.audio).catch(e=>console.warn('Falha ao associar microfone ao iniciador',e));
 if(videoSender&&(S.display||S.camera))void videoSender.replaceTrack(S.display||S.camera)
  .then(()=>{if(S.stage==='live')requestMediaRenegotiation(peer);})
  .catch(e=>console.warn('Falha ao conectar vídeo ao participante',e));
 pc.ontrack=event=>{
  const track=event.track;
  if(!peer.stream.getTracks().some(t=>t.id===track.id))peer.stream.addTrack(track);
  if(track.kind==='audio'&&!peer.audioStream.getTracks().some(t=>t.id===track.id))peer.audioStream.addTrack(track);
  track.addEventListener('unmute',()=>restartTile(key));
  track.addEventListener('mute',tiles);
  track.addEventListener('ended',()=>{try{peer.stream.removeTrack(track);if(track.kind==='audio')peer.audioStream.removeTrack(track)}catch(_){}restartTile(key)});
  tiles();
 };
 pc.onicecandidate=event=>{if(event.candidate)void signal(key,{candidate:event.candidate.toJSON?.()||event.candidate});};
 pc.onnegotiationneeded=()=>{if(S.key<key)void offer(peer);};
 pc.onconnectionstatechange=()=>{
  if(pc.connectionState==='failed'||pc.connectionState==='disconnected')schedulePeerRecovery(peer);
  if(pc.connectionState==='connected'){
   peer.missingSince=0;
   clearTimeout(peer.recoveryTimer);peer.recoveryTimer=null;
   peer.retries=0;peer.videoMissingSince=0;void tuneVideo();restartTile(key);
  }
  if(pc.connectionState==='closed'){clearTimeout(peer.recoveryTimer);peer.recoveryTimer=null;tiles();}
 };
 pc.oniceconnectionstatechange=()=>{
  if(pc.iceConnectionState==='failed'||pc.iceConnectionState==='disconnected')schedulePeerRecovery(peer);
 };
 return peer;
}
async function bindAnswererMedia(peer){
 // O SDP recebido cria uma transceiver para cada mídia. É nessas faixas
 // negociadas (mid !== null), não em transceivers locais soltas, que o
 // respondedor precisa colocar microfone, câmera e apresentação.
 const pc=peer.pc;
 for(const kind of ['audio','video']){
  const transceiver=pc.getTransceivers().find(t=>t.mid!==null&&t.receiver?.track?.kind===kind&&!t.stopped);
  if(!transceiver)continue;
  if(transceiver.direction!=='sendrecv')transceiver.direction='sendrecv';
  const sender=transceiver.sender;
  peer[kind==='audio'?'audioSender':'videoSender']=sender;
  const track=kind==='audio'?S.audio:(S.display||S.camera);
  if(sender.track!==track)await sender.replaceTrack(track||null);
 }
}
async function receiveSignal(msg){
 if(!msg||msg.to!==S.key||typeof msg.from!=='string'||msg.from===S.key)return;
 if(!S.presence.has(msg.from)){
  const present=S.channel?.presenceState()?.[msg.from];
  if(present?.[0])S.presence.set(msg.from,{...present[0]});
  else{if(S.pendingSignals.length<64)S.pendingSignals.push(msg);return;}
 }
 const p=ensurePeer(msg.from);if(!p)return;
 const pc=p.pc;
 try{
  if(msg.ready){
   // O outro navegador já está inscrito no canal. Não confiar que a oferta
   // disparada pelo onnegotiationneeded tenha chegado até ele.
   if(S.key<msg.from)await recoverHandshake(p,true);
   return;
  }
  if(msg.mediaChanged){
   if(S.key<msg.from)requestMediaRenegotiation(p);
   return;
  }
  if(msg.restartVideo){if(S.key<msg.from)void offer(p,true);return;}
  if(msg.description){
   const description=msg.description;
   if(description.type==='offer'){
    if(pc.signalingState!=='stable'&&S.key<msg.from)return;
    await pc.setRemoteDescription(description);
    if(S.key>msg.from)await bindAnswererMedia(p);
    await pc.setLocalDescription(await pc.createAnswer());
    await signal(msg.from,{description:pc.localDescription?.toJSON?.()||pc.localDescription});
   }else if(description.type==='answer'&&pc.signalingState==='have-local-offer'){
    await pc.setRemoteDescription(description);
    p.lastAnswerAt=Date.now();
   }
   while(p.candidates.length&&pc.remoteDescription)await pc.addIceCandidate(p.candidates.shift()).catch(()=>{});
  }else if(msg.candidate){
   if(pc.remoteDescription)await pc.addIceCandidate(msg.candidate).catch(()=>{});
   else p.candidates.push(msg.candidate);
  }
 }catch(e){console.warn('Sinalização de vídeo',e);}
}
function synchronize(){
 if(!S.channel||S.stage!=='live')return;
 const next=new Map();
 const snapshot=S.channel.presenceState();
 Object.entries(snapshot).forEach(([key,items])=>{
  const member=Array.isArray(items)?items[0]:null;
  if(member&&UUID.test(member.userId||'')&&typeof key==='string'&&key.length<120&&(!isPrivate(S.room)||[S.room.selfId,S.room.peerId].includes(member.userId))){
   next.set(key,{userId:member.userId,name:String(member.name||'Estudante').slice(0,80),
    mic:!!member.mic,cam:!!member.cam,screen:!!member.screen,hand:!!member.hand,joinedAt:member.joinedAt||0});
  }
 });
 if(S.key)next.set(S.key,meta());
 // Realtime Presence pode enviar saída e entrada simultâneas durante um sync.
 // Preservamos o WebRTC por alguns segundos antes de remover quem realmente saiu.
 const previous=S.presence;
 for(const [key,peer] of S.peers){
  if(next.has(key)){
   clearTimeout(peer.departTimer);peer.departTimer=null;
  }else{
   if(previous.has(key))next.set(key,previous.get(key));
   if(!peer.departTimer){
    const generation=S.generation;
    peer.departTimer=setTimeout(()=>{
     peer.departTimer=null;
     if(S.stage!=='live'||generation!==S.generation||S.peers.get(key)!==peer)return;
     const snapshot=S.channel?.presenceState?.()||{};
     if(snapshot[key]?.length)return;
     S.presence.delete(key);
     disposePeerAudio(key);
     clearTimeout(peer.recoveryTimer);
     clearTimeout(peer.mediaTimer);
     peer.pc.close();S.peers.delete(key);tiles();panelDraw();
    },6000);
   }
  }
 }
 S.presence=next;
 void refreshCallAvatars();
 for(const key of next.keys()){
  if(key===S.key)continue;
  let peer=S.peers.get(key);
  if(!peer)peer=ensurePeer(key);
  if(peer&&S.key>key)announcePeerReady(peer);
 }
 if(S.pendingSignals.length){const pending=S.pendingSignals.splice(0);pending.forEach(msg=>{if(next.has(msg.from))void receiveSignal(msg);});}
 if(S.pinned&&!next.has(S.pinned))S.pinned=null;
 void tuneVideo();tiles();panelDraw();
}
async function checkMembership(){
 if(!S.room||!eligible()||!S.channel)return;
 try{
  const room=S.room;
  if(isPrivate(room)){
   if(room.selfId!==onlineUser.id||!UUID.test(room.peerId)||room.peerId===onlineUser.id)await leave();
   return;
  }
  const {data,error}=await client.from('uentzoul_chat_members').select('user_id').eq('room_id',room.id).eq('user_id',onlineUser.id).maybeSingle();
  if(error)throw error;
  if(S.room?.id!==room.id)return;
  if(!data&&room.owner_id!==onlineUser.id){status('Você não faz mais parte deste grupo.');await leave(); }
 }catch(e){console.warn('Falha temporária ao conferir acesso à chamada',e);}
}
async function join(){
 if(S.stage!=='preview'||!eligible()||!navigator.mediaDevices||(!isMaintenance(S.room)&&!window.RTCPeerConnection)){status('Este navegador não oferece os recursos necessários para esta chamada.');return;}
 S.stage='joining';const generation=++S.generation;draw();
 try{
  const room=S.room;
  if(isMaintenance(room)){
   if(!maintenanceAllowed()||room.userId!==onlineUser.id)throw Error('Somente o administrador pode entrar na call de manutenção.');
   S.key=onlineUser.id+':'+crypto.randomUUID();S.callStarted=Date.now();createStream();
   if(S.mic)try{await captureAudio(S.micDevice,generation);}catch(e){if(generation===S.generation){S.mic=false;status('Microfone indisponível. Você ainda pode testar os outros controles.',8);}}
   if(generation!==S.generation||S.stage!=='joining')return;
   if(S.cam)try{await captureCamera(S.camDevice,generation);}catch(e){if(generation===S.generation){S.cam=false;status('Não foi possível acessar a câmera.',8);}}
   if(generation!==S.generation||S.stage!=='joining')return;
   S.stage='live';S.presence.set(S.key,meta());draw();void refreshCallAvatars();
   return;
  }
  if(isPrivate(room)){
   if(room.selfId!==onlineUser.id||!UUID.test(room.peerId)||room.peerId===onlineUser.id)throw Error('Esta chamada privada não corresponde à sua conta.');
   if(!dm.people?.some(p=>p.user_id===room.peerId))throw Error('Contato indisponível. Abra novamente a conversa.');
  }else{
   const {data,error}=await client.from('uentzoul_chat_members').select('user_id').eq('room_id',room.id).eq('user_id',onlineUser.id).maybeSingle();
   if(error)throw error;
   if(!data&&room.owner_id!==onlineUser.id)throw Error('Somente membros deste grupo podem entrar na call.');
  }
  if(generation!==S.generation||S.stage!=='joining')return;
  S.key=onlineUser.id+':'+crypto.randomUUID();S.callStarted=Date.now();createStream();
  if(S.mic)try{await captureAudio(S.micDevice,generation);}catch(e){if(generation===S.generation){S.mic=false;status('Microfone indisponível. Você entrará apenas para ouvir.',8);}}
  if(generation!==S.generation||S.stage!=='joining')return;
  if(S.cam)try{await captureCamera(S.camDevice,generation);}catch(e){if(generation===S.generation){S.cam=false;status('Câmera indisponível. Você entrará sem vídeo.',8);}}
  if(generation!==S.generation||S.stage!=='joining')return;
  const channel=client.channel(callTopic(room),{config:{private:true,presence:{key:S.key}}});
  S.channel=channel;
  channel.on('broadcast',{event:'webrtc'},({payload})=>{void receiveSignal(payload);});
  channel.on('broadcast',{event:'reaction'},({payload})=>{if(S.stage==='live'&&S.presence.has(payload?.from)&&['👏','❤️','😂','🎉','👍'].includes(payload?.emoji))reaction(payload.emoji);});
  channel.on('broadcast',{event:'chat-updated'},()=>{if(S.stage==='live'&&S.panel==='chat')void loadChat();});
  channel.on('presence',{event:'sync'},()=>synchronize());
  if(isPrivate(room)){
   channel.on('postgres_changes',{event:'INSERT',schema:'public',table:'uentzoul_messages',filter:'recipient_id=eq.'+onlineUser.id},()=>{if(S.panel==='chat')void loadChat();});
  }else{
   channel.on('postgres_changes',{event:'INSERT',schema:'public',table:'uentzoul_room_messages',filter:'room_id=eq.'+room.id},()=>{if(S.panel==='chat')void loadChat();});
  }
  channel.subscribe(async statusValue=>{
   if(S.channel!==channel||S.generation!==generation)return;
   if(statusValue==='SUBSCRIBED'){
    const returning=S.stage==='live';
    try{
     clearTimeout(S.reconnectTimer);S.reconnectTimer=null;
     const current=channel.presenceState();
     const count=Object.values(current).reduce((n,items)=>n+(Array.isArray(items)?items.length:0),0);
     if(!returning&&count>=(isPrivate(room)?2:6)){
      await leave();
      alert(isPrivate(room)?'Esta chamada privada já tem dois dispositivos conectados.':'Esta versão aceita até 6 participantes simultâneos para preservar a qualidade da call.');
      return;
     }
     // WebSocket Realtime reconectado: manter as conexões P2P que ainda
     // funcionam. Apenas ressincronizar as presenças e a sinalização futura.
     if(returning){clearTimeout(S.presenceTimer);S.presenceTimer=null;}
     await channel.track(meta());
     S.lastPresenceAt=Date.now();
     S.lastPresenceSignature=JSON.stringify(meta());
     S.lastPresenceChannel=channel;
     if(S.generation!==generation||S.channel!==channel)return;
     S.stage='live';S.presence.set(S.key,meta());status('',0);
     try{draw();synchronize()}
     catch(e){console.warn('Falha visual sem encerrar a chamada',e);status('Falha visual temporária. A call continua aberta.',8)}
     clearInterval(S.guard);S.guard=setInterval(()=>{void checkMembership();void refreshCallAvatars();},15000);
     clearInterval(S.videoWatch);S.videoWatch=setInterval(checkVideoHealth,4500);
     clearInterval(S.connectionWatch);S.connectionWatch=setInterval(checkPeerConnections,3500);
     checkPeerConnections();
    }catch(e){
     console.warn('Falha de conexão na chamada',e);
     if(S.stage==='joining')await leave();
     else status('Conexão instável. A call permanece aberta.',0);
    }
   }else if(['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(statusValue)){
    if(S.stage==='joining'){await leave();return;}
    if(S.stage!=='live')return;
    const label=S.overlay?.querySelector('[data-gc-connection]');
    if(label){label.textContent='Reconectando…';label.classList.remove('is-live');}
    status('Conexão instável. A chamada continua aberta enquanto tenta reconectar.',0);
    if(!S.reconnectTimer)S.reconnectTimer=setTimeout(()=>{
     S.reconnectTimer=null;
     if(S.channel===channel&&S.stage==='live')status('Conexão ainda instável. Saia e entre novamente caso não retorne.',0);
    },30000);
   }
  });
 }catch(e){if(S.generation!==generation)return;const message=e?.message||'Não foi possível entrar na chamada.';await leave();if(typeof toast==='function')toast(message);else alert(message);}
}
function reaction(emoji){
 const layer=S.overlay?.querySelector('[data-gc-reactions]');if(!layer)return;
 const el=document.createElement('span');el.textContent=emoji;layer.appendChild(el);setTimeout(()=>el.remove(),2600);
}
async function loadChat(){
 if(!S.room||S.chatBusy||S.panel!=='chat')return;
 const roomId=S.room.id,generation=S.generation;
 S.chatBusy=true;
 try{
  if(isMaintenance(S.room)){
   if(!maintenanceAllowed())throw Error('Sem permissão para ler anotações.');
   const {data,error}=await client.from('uentzoul_admin_notes').select('id,user_id,body,kind,created_at').eq('user_id',onlineUser.id).order('created_at',{ascending:false}).limit(60);
   if(S.room?.id!==roomId||S.generation!==generation)return;
   if(error)throw error;
   S.chat=(data||[]).reverse().map(n=>({...n,sender_id:n.user_id}));panelDraw();return;
  }
  const privateCall=isPrivate(S.room);
  const query=client.from(privateCall?'uentzoul_messages':'uentzoul_room_messages')
   .select('id,sender_id,body,kind,created_at');
  const {data,error}=await (privateCall?query.or('and(sender_id.eq.'+S.room.selfId+',recipient_id.eq.'+S.room.peerId+'),and(sender_id.eq.'+S.room.peerId+',recipient_id.eq.'+S.room.selfId+')'):query.eq('room_id',roomId))
   .is('deleted_at',null).order('created_at',{ascending:false}).limit(60);
  if(S.room?.id!==roomId||S.generation!==generation)return;
  if(error)throw error;S.chat=(data||[]).reverse();panelDraw();
 }catch(e){status(isPrivate(S.room)?'Falha ao carregar mensagens privadas.':'Falha ao carregar mensagens do grupo.');}
 finally{S.chatBusy=false;}
}
async function sendChat(form){
 const textarea=form.querySelector('textarea');const value=textarea?.value.trim();
 if(!value||value.length>3000||!eligible()||!S.room)return;
 const button=form.querySelector('button[type="submit"]');button.disabled=true;
 try{
  const room=S.room;
  if(isMaintenance(room)){
   if(!maintenanceAllowed())throw Error('Sem permissão para salvar anotações.');
   const {error}=await client.from('uentzoul_admin_notes').insert({user_id:onlineUser.id,body:value,kind:'text'});
   if(error)throw error;
   textarea.value='';await loadChat();
   void window.uentzoulMaintenance?.refresh?.();
   return;
  }
  const privateCall=isPrivate(room);
  const {error}=await client.from(privateCall?'uentzoul_messages':'uentzoul_room_messages')
   .insert(privateCall?{recipient_id:room.peerId,sender_id:onlineUser.id,body:value,kind:'text'}:{room_id:room.id,sender_id:onlineUser.id,body:value,kind:'text'});
  if(error)throw error;textarea.value='';await loadChat();
  if(S.channel&&S.room===room)void S.channel.send({type:'broadcast',event:'chat-updated',payload:{from:S.key}}).catch(()=>{});
 }catch(e){status('Não foi possível enviar a mensagem.');}
 finally{button.disabled=false;}
}
function panelDraw(){
 const aside=S.overlay?.querySelector('[data-gc-panel]');if(!aside)return;
 aside.hidden=!S.panel;if(!S.panel){aside.innerHTML='';aside.dataset.gcSignature='';return;}
 const title=S.panel==='chat'?(isMaintenance(S.room)?'Anotações de manutenção':isPrivate(S.room)?'Mensagens privadas':'Mensagens do grupo'):S.panel==='members'?'Participantes':S.panel==='react'?'Reações':'Áudio e vídeo';
 let body='';
 if(S.panel==='members'){
  body='<div class="gc-member-list" aria-label="Volume individual dos participantes">'+[...S.presence.entries()].map(([key,m])=>{
   const name=m.name||person(m.userId).display_name||'Participante';
   const self=key===S.key||m.userId===onlineUser.id;
   const pref=peerLevel(m.userId);
   return '<div class="gc-member-entry" data-gc-member-user="'+escCall(m.userId)+'">'+
    '<div class="gc-member-identity">'+avatarBubble(m.userId,name,'gc-member-initial')+
     '<strong>'+escCall(name)+(self?' (você)':'')+'</strong><span>'+(m.mic?'🎙':'🔇')+'</span></div>'+
    (self?'<p class="gc-member-self">Seu microfone é controlado na barra da call.</p>':
     '<div class="gc-member-volume"><div class="gc-member-volume-head"><span>Volume individual</span>'+
      '<output data-gc-volume-value>'+pref.volume+'%</output></div>'+
      '<input type="range" data-gc-volume data-gc-user="'+escCall(m.userId)+'" min="0" max="'+volumeLimit()+'" step="5" value="'+Math.min(volumeLimit(),pref.volume)+'" aria-label="Volume de '+escCall(name)+'">'+
      '<button type="button" class="gc-peer-mute'+(pref.muted?' is-muted':'')+'" data-gc-action="mute-peer" data-gc-user="'+escCall(m.userId)+'" aria-pressed="'+String(pref.muted)+'">'+(pref.muted?'Ativar som':'Silenciar')+'</button></div>')+
   '</div>';
  }).join('')+'</div>';
 }else if(S.panel==='chat'){
  body='<div class="gc-chat-list" data-gc-chat-list>'+S.chat.map(m=>
   '<div class="gc-chat-msg"><strong>'+escCall(person(m.sender_id).display_name||'Estudante')+'</strong><p>'+escCall(m.kind==='text'?m.body:'[Mídia compartilhada na conversa]')+'</p></div>').join('')+
   (!S.chat.length?'<p class="gc-chat-empty">Nenhuma mensagem recente.</p>':'')+'</div>'+
   '<form class="gc-chat-form" data-gc-chat-form><textarea maxlength="3000" rows="2" placeholder="'+(isMaintenance(S.room)?'Anotação pessoal…':isPrivate(S.room)?'Escreva na conversa…':'Escreva no grupo…')+'"></textarea><button type="submit" aria-label="Enviar mensagem">➤</button></form>';
 }else if(S.panel==='react'){
  body='<div class="gc-reaction-picker">'+['👏','❤️','😂','🎉','👍'].map(emoji=>
   '<button type="button" data-gc-action="react-emoji" data-gc-emoji="'+emoji+'" aria-label="Reagir com '+emoji+'">'+emoji+'</button>').join('')+'</div>';
 }else{
  body='<div class="gc-device-section"><p>Escolha o microfone e a câmera desta chamada.</p>'+
   '<label>Selecionar microfone<select data-gc-device="audio" aria-label="Selecionar microfone"><option value="">Padrão do sistema</option></select></label>'+
   '<label>Selecionar câmera<select data-gc-device="video" aria-label="Selecionar câmera"><option value="">Padrão do sistema</option></select></label></div>';
 }
 const signature=S.panel+'|'+(S.panel==='chat'?S.chat.map(m=>m.id).join(','):
  S.panel==='members'?JSON.stringify([...S.presence.entries()].map(([k,m])=>[k,m.mic,m.cam,m.hand,m.screen,callAvatarUrl(m.userId)])):
  S.panel==='settings'?S.micDevice+'|'+S.camDevice:'');
 if(aside.dataset.gcSignature===signature&&aside.childElementCount)return;
 aside.dataset.gcSignature=signature;
 const scrolling=aside.querySelector('.gc-chat-list'),oldScroll=scrolling?.scrollTop||0,atBottom=!scrolling||scrolling.scrollHeight-scrolling.scrollTop-scrolling.clientHeight<90;
 const focus=document.activeElement,typing=focus?.closest('[data-gc-chat-form] textarea');
 const draft=typing?.value??'';
 const wasTyping=!!typing;
 const selection=typing?.selectionStart||0;
 aside.innerHTML='<header class="gc-panel-head"><strong>'+title+'</strong><button type="button" data-gc-action="panel-close" aria-label="Fechar painel">×</button></header>'+body;
 if(S.panel==='chat'){
  const list=aside.querySelector('.gc-chat-list');if(list)list.scrollTop=atBottom?list.scrollHeight:oldScroll;
  const input=aside.querySelector('textarea');if(input&&wasTyping){input.value=draft;input.focus({preventScroll:true});input.setSelectionRange(selection,selection);}
 }else if(S.panel==='settings')void deviceList();
 if(S.panel==='members')aside.querySelectorAll('[data-gc-avatar-user]').forEach(node=>{
  const userId=node.dataset.gcAvatarUser;
  const member=[...S.presence.values()].find(m=>m.userId===userId);
  syncAvatarBubble(node,userId,member?.name||person(userId).display_name||'Participante');
 });
}
async function deviceList(){
 if(S.panel!=='settings'||!navigator.mediaDevices?.enumerateDevices)return;
 try{
  const devices=await navigator.mediaDevices.enumerateDevices();
  if(S.panel!=='settings')return;
  for(const [kind,type,chosen] of [['audioinput','audio',S.micDevice],['videoinput','video',S.camDevice]]){
   const select=S.overlay?.querySelector('[data-gc-device="'+type+'"]');if(!select)return;
   const match=devices.filter(d=>d.kind===kind);
   select.replaceChildren(new Option('Padrão do sistema',''));
   for(const [i,d] of match.entries()){
    const o=document.createElement('option');o.value=d.deviceId;o.textContent=d.label||((type==='audio'?'Microfone ':'Câmera ')+(i+1));select.appendChild(o);
   }
   select.value=chosen;
  }
 }catch(e){console.warn('Falha ao listar dispositivos',e);}
}
async function changeDevice(type,value){
 if(S.stage!=='live')return;
 const generation=S.generation;
 if(type==='audio'){
  if(S.micBusy)return;
  const before=S.micDevice;S.micDevice=value;
  if(S.mic){
   S.micBusy=true;draw();
   try{await captureAudio(value,generation);}
   catch(e){S.micDevice=before;if(generation===S.generation)status('Não foi possível selecionar esse microfone.');}
   finally{S.micBusy=false;if(generation===S.generation)draw();}
  }
 }else if(type==='video'){
  if(S.camBusy)return;
  const before=S.camDevice;S.camDevice=value;
  if(S.cam){
   S.camBusy=true;draw();
   try{await captureCamera(value,generation);}
   catch(e){S.camDevice=before;if(generation===S.generation)status('Não foi possível selecionar essa câmera.');}
   finally{S.camBusy=false;if(generation===S.generation)draw();}
  }
 }
 if(generation===S.generation&&S.stage==='live')await publish();
}
async function leave(){
 ++S.generation;
 const channel=S.channel;S.channel=null;
 clearInterval(S.guard);S.guard=null;
 clearTimeout(S.reconnectTimer);S.reconnectTimer=null;
 clearTimeout(S.presenceTimer);S.presenceTimer=null;
 S.lastPresenceAt=0;S.lastPresenceSignature='';S.lastPresenceChannel=null;
 clearTimeout(S.noticeTimer);
 clearInterval(S.videoWatch);S.videoWatch=null;
 clearInterval(S.connectionWatch);S.connectionWatch=null;
 clearTimeout(S.screenMuteTimer);S.screenMuteTimer=null;
 S.peers.forEach((p,key)=>{disposePeerAudio(key);clearTimeout(p.recoveryTimer);clearTimeout(p.departTimer);clearTimeout(p.mediaTimer);p.pc.close()});S.peers.clear();
 if(channel){try{void channel.untrack().catch(()=>{});}catch(_){}try{void client.removeChannel(channel).catch(()=>{});}catch(_){}}
 for(const track of [S.audio,S.camera,S.display])try{track?.stop()}catch(_){}
 S.audio=null;S.camera=null;S.display=null;S.stream=null;S.screen=false;S.screenBusy=false;S.hand=false;S.camBusy=false;S.micBusy=false;
 const previousContext=S.audioContext;S.audioContext=null;S.audioNodes.clear();if(previousContext)void previousContext.close().catch(()=>{});
 S.presence.clear();S.avatarProfiles.clear();S.avatarRefreshAt=0;S.pendingSignals=[];S.key='';S.stage='off';S.room=null;S.panel='';S.chat=[];S.pinned=null;S.minimized=false;
 S.overlay?.remove();S.overlay=null;S.photoUrl='';
 try{if(typeof dmShow==='function')dmShow()}catch(_){}
}
function setMinimized(value){
 if(S.stage!=='live'||!S.overlay)return;
 if(value&&document.fullscreenElement&&S.overlay.contains(document.fullscreenElement))
  void document.exitFullscreen().catch(()=>{});
 S.minimized=!!value;
 if(value)S.panel='';
 draw();
 const focus=S.overlay.querySelector(value?'[data-gc-action="restore"]':'.gc-minimize');
 focus?.focus({preventScroll:true});
}
function preview(room){
 if(!room||!eligible()||(isMaintenance(room)&&!maintenanceAllowed()))return;
 if(S.stage!=='off'){
  if(S.room?.id===room.id&&S.room?.kind===room.kind){
    if(S.minimized)setMinimized(false);
    else S.overlay?.querySelector('[data-gc-action="mic"]')?.focus();
    return;
   }
  if(!confirm('Sair da chamada atual para entrar em outra conversa?'))return;
  void leave().then(()=>preview(room));return;
 }
 S.room=room;S.stage='preview';S.minimized=false;++S.generation;S.mic=true;S.cam=false;S.hand=false;S.notice='';S.micBusy=false;S.camBusy=false;loadPeerVolumes();
 shell();
}
function previewMaintenance(){
 if(!maintenanceAllowed())return;
 preview({id:'maintenance:'+onlineUser.id,kind:'maintenance',userId:onlineUser.id,name:'Chat de Manutenção'});
}
async function actions(event){
 const target=event.target;
 if(!(target instanceof Element))return;
 const opener=target.closest('[data-gc-open],[data-gc-private]');
 if(opener){
  event.preventDefault();event.stopPropagation();
  if(opener.hasAttribute('data-gc-private'))preview(direct(opener.dataset.gcPrivate));
  else preview(group(opener.dataset.gcOpen));
  return;
 }
 const action=target.closest('[data-gc-action]');
 if(!action||!S.overlay?.contains(action))return;
 event.preventDefault();event.stopPropagation();
 switch(action.dataset.gcAction){
 case 'minimize':setMinimized(true);break;
 case 'restore':setMinimized(false);break;
 case 'mic':await toggleMic();break;
 case 'cam':await toggleCam();break;
 case 'screen':await toggleScreen();break;
 case 'react-emoji':{
  const emoji=action.dataset.gcEmoji;
  if(['👏','❤️','😂','🎉','👍'].includes(emoji)){
   reaction(emoji);
   await S.channel?.send({type:'broadcast',event:'reaction',payload:{from:S.key,emoji}}).catch(()=>{});
  }
  S.panel='';draw();break;
 }
 case 'join':await join();break;
 case 'cancel':case 'leave':await leave();break;
 case 'members':case 'settings':case 'react':{
  S.panel=S.panel===action.dataset.gcAction?'':action.dataset.gcAction;
  draw();break;
 }
 case 'panel-close':S.panel='';draw();break;
 case 'pin':S.pinned=S.pinned===action.dataset.gcKey?null:action.dataset.gcKey;draw();break;
 case 'volume-peer':{
  const member=S.presence.get(action.dataset.gcKey);
  if(!member||member.userId===onlineUser.id)break;
  S.panel='members';draw();
  const row=[...(S.overlay?.querySelectorAll('[data-gc-member-user]')||[])].find(x=>x.dataset.gcMemberUser===member.userId);
  row?.scrollIntoView?.({block:'nearest'});
  row?.querySelector('[data-gc-volume]')?.focus({preventScroll:true});
  break;
 }
 case 'mute-peer':togglePeerMute(action.dataset.gcUser);break;
 case 'audio-play':{
  enablePeerSounds();
  status('Áudio dos participantes ativado quando permitido pelo navegador.',3);
  break;
 }
 case 'fullscreen':{
  try{if(document.fullscreenElement)await document.exitFullscreen();else await S.overlay.querySelector('.gc-window').requestFullscreen();}catch(_){status('Tela cheia indisponível neste dispositivo.');}break;
 }
 }
}
function init(){
 if(!bridge||!dm||!window.uentzoulMessenger)return false;
 document.addEventListener('click',e=>{
  void actions(e).catch(err=>{
   console.warn('Ação da call falhou sem encerrar a chamada',err);
   if(S.stage!=='off')status('Não foi possível completar essa ação. A call continua aberta.',8);
  });
 },true);
 document.addEventListener('submit',e=>{
  const f=e.target;if(f instanceof HTMLFormElement&&f.matches('[data-gc-chat-form]')){
   e.preventDefault();void sendChat(f);
  }
 },true);
 document.addEventListener('input',e=>{
  const input=e.target;
  if(!(input instanceof HTMLInputElement)||!input.matches('[data-gc-volume]')||!S.overlay?.contains(input))return;
  e.stopPropagation();setPeerVolume(input.dataset.gcUser,input.value);
 },true);
 document.addEventListener('change',e=>{
  const el=e.target;if(el instanceof HTMLSelectElement&&el.dataset.gcDevice)void changeDevice(el.dataset.gcDevice,el.value).catch(err=>{console.warn('Falha ao selecionar dispositivo',err);if(S.stage!=='off')status('Erro ao mudar dispositivo. A call continua aberta.',8)});
 },true);
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&S.stage==='preview'){e.preventDefault();void leave();}
 },true);
 window.addEventListener('pagehide',()=>{if(S.stage!=='off')void leave();});
 document.addEventListener('fullscreenchange',syncFullscreenControl);
 window.addEventListener('resize',fitViewport,{passive:true});
 window.visualViewport?.addEventListener('resize',fitViewport,{passive:true});
 const previousLogout=window.uentzoulMessenger.onLogout;
 window.uentzoulMessenger.onLogout=function(...args){void leave();return previousLogout?.apply(this,args);};
 // Refresh de token pode sinalizar sessão ausente por poucos instantes.
 // Logout explícito continua saindo imediatamente pelo onLogout.
 let authGraceTimer=null;
 window.addEventListener('uentzoul:auth',()=>{
  clearTimeout(authGraceTimer);
  if(bridge.user()?.id||S.stage==='off')return;
  authGraceTimer=setTimeout(()=>{
   authGraceTimer=null;
   if(!bridge.user()?.id&&S.stage!=='off')void leave();
  },5000);
 });
 window.uentzoulGroupCalls={open:id=>preview(group(id)),openPrivate:id=>preview(direct(id)),openMaintenance:previewMaintenance,minimize:()=>setMinimized(true),restore:()=>setMinimized(false),leave:()=>leave(),get minimized(){return S.minimized},get active(){return S.stage==='live'},get roomId(){return S.room?.id||null},get kind(){return S.room?.kind||null}};
 return true;
}
if(!init()){
 let tries=0;const timer=setInterval(()=>{if(init()||++tries>30)clearInterval(timer)},250);
}
})();