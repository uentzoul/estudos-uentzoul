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
 micDevice:'',camDevice:'',notice:'',noticeTimer:null,callStarted:0,generation:0,reconnectTimer:null};
const eligible=()=>!!bridge.client()&&!!bridge.user()?.id&&!bridge.user()?.is_anonymous;
const group=id=>UUID.test(id||'')&&dm.rooms?.find(r=>r.id===id&&r.kind==='group')||null;
const direct=id=>{
 if(!eligible()||dm.tab!=='private'||dm.peerId!==id||!UUID.test(id||'')||id===onlineUser.id)return null;
 const peer=person(id);
 return {id,kind:'private',peerId:id,selfId:onlineUser.id,name:peer.display_name||'Conversa privada',avatar_url:peer.avatar_url||''};
};
const isPrivate=room=>room?.kind==='private';
const callTopic=room=>isPrivate(room)?'uentzoul-dm-call:'+([room.selfId,room.peerId].sort().join(':')):'uentzoul-call:'+room.id;
const person=id=>typeof dmPrettyPerson==='function'?dmPrettyPerson(id):{display_name:'Participante'};
const myName=()=>person(onlineUser?.id).display_name||'Participante';
function icon(name){
 const icons={mic:'🎙',cam:'▣',screen:'▤',hangup:'☎',hand:'✋',chat:'☰',members:'♙',settings:'⚙',full:'⛶'};
 return icons[name]||'●';
}
function btn(action,label,short,active=false,disabled=false){
 return '<button type="button" class="gc-tool '+(active?'is-on ':'')+(action==='leave'?'is-leave':'')+'" data-gc-action="'+action+'" '+(disabled?'disabled':'')+' title="'+escCall(label)+'" aria-label="'+escCall(label)+'" aria-pressed="'+String(active)+'"><span aria-hidden="true">'+(short||'●')+'</span><small>'+escCall(label)+'</small></button>';
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
 if(isPrivate(S.room)){
  const avatar=S.room.avatar_url||'';
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
 '<span class="gc-connection" data-gc-connection>Preparando</span></header>'+
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
 const head=S.overlay.querySelector('[data-gc-subtitle]');
 const conn=S.overlay.querySelector('[data-gc-connection]');
 if(head)head.textContent=pre?'Configure áudio e vídeo':live?'Conversa por voz e vídeo':joining?'Conectando os participantes…':'Chamada';
 if(conn){conn.textContent=pre?'Prévia':joining?'Conectando…':live?'Ao vivo':'Finalizada';conn.classList.toggle('is-live',live);}
 const controls=S.overlay.querySelector('[data-gc-controls]');
 if(controls){
  controls.innerHTML=btn('mic',S.mic?'Desativar microfone':'Ativar microfone',S.mic?'🎙':'🎙̸',S.mic)+
   btn('cam',S.cam?'Desligar câmera':'Ligar câmera',icon('cam'),S.cam)+
   (live?btn('screen',S.screen?'Parar apresentação':'Compartilhar tela',icon('screen'),S.screen,!navigator.mediaDevices?.getDisplayMedia):'')+
   (live?btn('hand',S.hand?'Abaixar mão':'Levantar mão',icon('hand'),S.hand):'')+
   (live?btn('react','Reagir','❤',S.panel==='react'):'')+
   (live?btn('chat','Mensagens',icon('chat'),S.panel==='chat'):'')+
   (live?btn('members','Participantes',icon('members'),S.panel==='members'):'')+
   (live?btn('settings','Dispositivos',icon('settings'),S.panel==='settings'):'')+
   (live?btn('audio-play','Ativar som','🔊'):'')+
   (live?btn('fullscreen','Tela cheia',icon('full')):'')+
   (pre?'<button type="button" class="gc-join" data-gc-action="join">Participar da call</button>':'')+
   (joining?'<button type="button" class="gc-join" disabled>Entrando…</button>':'')+
   btn(pre?'cancel':'leave',pre?'Cancelar':'Sair da call',pre?'×':'☎');
 }
 if(pre||joining){
  const stage=S.overlay.querySelector('[data-gc-stage]');
  stage.innerHTML='<div class="gc-preview">'+
   '<div class="gc-preview-art">'+roomBadge(S.room)+'</div>'+
   '<h2>'+escCall(S.room.name)+'</h2>'+
   '<p>'+(joining?'Estabelecendo a conexão da chamada…':isPrivate(S.room)?'Você e este contato podem entrar nesta chamada privada. O outro participante só ouvirá ou verá você quando os dispositivos estiverem ligados.':'Ao entrar, os membros do grupo poderão te ouvir e ver quando os dispositivos estiverem ligados.')+'</p>'+
   '<small>O microfone '+(S.mic?'será ligado':'ficará desligado')+' e a câmera '+(S.cam?'será ligada':'ficará desligada')+'.</small></div>';
 }else if(live){tiles();}
 applyPhoto();panelDraw();
}
function tileNode(key){
 const outer=document.createElement('article');outer.className='gc-tile';outer.dataset.key=key;
 outer.innerHTML='<video autoplay playsinline></video><div class="gc-avatar" aria-hidden="true">?</div>'+
  '<div class="gc-tile-info"><strong data-gc-name></strong><span data-gc-icons></span></div>'+
  '<button type="button" class="gc-pin" data-gc-action="pin" data-gc-key="'+escCall(key)+'" aria-label="Fixar participante" title="Fixar participante">⛶</button>';
 return outer;
}
function mediaFor(key){
 if(key===S.key)return S.stream;
 return S.peers.get(key)?.stream||null;
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
 stage.classList.toggle('gc-presenting',members.some(([k,m])=>m.screen)||!!S.pinned);
 members.forEach(([key,m])=>{
  let tile=[...stage.children].find(x=>x.classList.contains('gc-tile')&&x.dataset.key===key);
  if(!tile){tile=tileNode(key);stage.appendChild(tile);}
  tile.classList.toggle('gc-featured',S.pinned?S.pinned===key:!!m.screen);
  const name=m.name||person(m.userId).display_name||'Participante';
  tile.querySelector('[data-gc-name]').textContent=name+(key===S.key?' (você)':'');
  tile.querySelector('[data-gc-icons]').textContent=(m.mic?'🎙':'🔇')+(m.hand?' ✋':'')+(m.screen?' ▤':'');
  const avatar=tile.querySelector('.gc-avatar');avatar.textContent=name.slice(0,1).toUpperCase();
  const v=tile.querySelector('video'),media=mediaFor(key);
  const videoOn=(m.cam||m.screen)&&!!media&&media.getVideoTracks().length;
  if(v.srcObject!==media){v.srcObject=media;v.muted=key===S.key;v.volume=1;}
  v.classList.toggle('is-visible',!!videoOn);
  avatar.hidden=!!videoOn;
  if(media&&v.paused)v.play().catch(()=>{});
  tile.classList.toggle('gc-is-presenting',!!m.screen);
 });
}
function meta(){return {userId:onlineUser?.id||'',name:myName(),mic:S.mic&&!!S.audio,cam:S.cam&&!!S.camera,screen:S.screen&&!!S.display,hand:S.hand,joinedAt:S.callStarted};}
async function publish(){
 if(S.channel&&S.stage==='live')try{await S.channel.track(meta());}catch(e){console.warn('Não foi possível atualizar presença da call',e);}
 S.presence.set(S.key,meta());draw();
}
function createStream(){
 const stream=new MediaStream();
 S.stream=stream;return stream;
}
async function captureAudio(deviceId='',generation=S.generation){
 const settings={echoCancellation:true,noiseSuppression:true,autoGainControl:true,...(deviceId?{deviceId:{exact:deviceId}}:{})};
 const stream=await navigator.mediaDevices.getUserMedia({audio:settings,video:false});
 const next=stream.getAudioTracks()[0];
 if(!next)throw Error('Microfone indisponível.');
 if(generation!==S.generation||S.stage==='off'){next.stop();throw Error('Chamada encerrada');}
 const old=S.audio;S.audio=next;next.enabled=S.mic;
 if(S.stream){for(const t of S.stream.getAudioTracks())S.stream.removeTrack(t);S.stream.addTrack(next);}
 old?.stop();
 await Promise.all([...S.peers.values()].map(p=>p.audioSender.replaceTrack(next).catch(()=>{})));
}
async function captureCamera(deviceId='',generation=S.generation){
 const settings={width:{ideal:640,max:960},height:{ideal:360,max:540},frameRate:{ideal:15,max:20},...(deviceId?{deviceId:{exact:deviceId}}:{facingMode:'user'})};
 const stream=await navigator.mediaDevices.getUserMedia({video:settings,audio:false});
 const next=stream.getVideoTracks()[0];
 if(!next)throw Error('Câmera indisponível.');
 if(generation!==S.generation||S.stage==='off'){next.stop();throw Error('Chamada encerrada');}
 const old=S.camera;S.camera=next;old?.stop();
 await replaceVideo();
}
async function tuneVideo(){
 const peers=[...S.peers.values()].filter(p=>p.pc.connectionState==='connected');
 const outgoing=Math.max(1,peers.length);
 const bitrate=S.screen?Math.max(650000,Math.min(1400000,Math.floor(4200000/outgoing))):
  Math.max(220000,Math.min(560000,Math.floor(1900000/outgoing)));
 await Promise.all(peers.map(async p=>{
  try{
   const sender=p.videoSender,params=sender.getParameters?.();
   if(!params?.encodings?.length)return;
   params.encodings[0].maxBitrate=bitrate;
   params.encodings[0].maxFramerate=S.screen?12:15;
   await sender.setParameters(params);
  }catch(_){/* Alguns dispositivos ignoram parâmetros avançados. */}
 }));
}
async function replaceVideo(){
 const selected=S.display||S.camera||null;
 if(S.stream){for(const t of S.stream.getVideoTracks())S.stream.removeTrack(t);if(selected)S.stream.addTrack(selected);}
 await Promise.all([...S.peers.values()].map(p=>p.videoSender.replaceTrack(selected).catch(e=>console.warn('Não foi possível atualizar vídeo',e))));
 void tuneVideo();
 if(S.stage==='live')await publish();else draw();
}
async function toggleMic(){
 S.mic=!S.mic;
 if(S.stage==='live'){
  if(S.mic&&!S.audio){
   try{await captureAudio(S.micDevice);}catch(e){S.mic=false;status('Permissão de microfone negada ou dispositivo indisponível.');}
  }else if(S.audio)S.audio.enabled=S.mic;
  await publish();
 }else draw();
}
async function toggleCam(){
 S.cam=!S.cam;
 if(S.stage==='live'){
  if(S.cam&&!S.camera){
   try{await captureCamera(S.camDevice);}catch(e){S.cam=false;status('Não foi possível acessar a câmera. Verifique as permissões.');}
  }else if(!S.cam&&S.camera){
   const old=S.camera;S.camera=null;old.stop();await replaceVideo();
  }
  await publish();
 }else draw();
}
async function toggleScreen(){
 const generation=S.generation;
 if(S.screen){await endScreen();return;}
 if(!navigator.mediaDevices?.getDisplayMedia){status('Compartilhamento de tela não está disponível neste navegador.');return;}
 try{
  const stream=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:{ideal:15,max:20}},audio:false});
  if(generation!==S.generation||S.stage!=='live'){stream.getTracks().forEach(t=>t.stop());return;}
  const track=stream.getVideoTracks()[0];if(!track)return;
  S.display=track;S.screen=true;track.addEventListener('ended',()=>{if(S.display===track)void endScreen();},{once:true});
  await replaceVideo();
 }catch(e){if(e?.name!=='NotAllowedError')status('Não foi possível iniciar a apresentação da tela.');}
}
async function endScreen(){
 const old=S.display;S.display=null;S.screen=false;
 if(old){old.onended=null;old.stop();}
 await replaceVideo();
}
function iceConfig(){
 const defaults=[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}];
 const extra=Array.isArray(window.UENTZOUL_CALL_ICE_SERVERS)?window.UENTZOUL_CALL_ICE_SERVERS.filter(s=>s&&typeof s.urls==='string'&&/^turns?:/.test(s.urls)):[];
 return {iceServers:[...defaults,...extra],bundlePolicy:'max-bundle'};
}
function signal(to,body){
 if(!S.channel||S.stage!=='live')return Promise.resolve();
 return S.channel.send({type:'broadcast',event:'webrtc',payload:{from:S.key,to,...body}})
 .catch(e=>console.warn('Falha de sinalização',e));
}
async function offer(peer,iceRestart=false){
 if(peer.busy||peer.pc.signalingState!=='stable'||S.stage!=='live')return;
 peer.busy=true;
 try{
  const description=await peer.pc.createOffer(iceRestart?{iceRestart:true}:{});
  await peer.pc.setLocalDescription(description);
  await signal(peer.key,{description:peer.pc.localDescription?.toJSON?.()||peer.pc.localDescription});
 }catch(e){console.warn('Negociação WebRTC',e);}finally{peer.busy=false;}
}
function ensurePeer(key){
 if(!key||key===S.key||S.peers.has(key)||S.stage!=='live')return S.peers.get(key);
 const pc=new RTCPeerConnection(iceConfig());
 const audioSender=pc.addTransceiver('audio',{direction:'sendrecv'}).sender;
 const videoSender=pc.addTransceiver('video',{direction:'sendrecv'}).sender;
 const peer={key,pc,audioSender,videoSender,stream:new MediaStream(),candidates:[],busy:false,retries:0};
 S.peers.set(key,peer);
 if(S.audio)void audioSender.replaceTrack(S.audio).catch(()=>{});
 if(S.display||S.camera)void videoSender.replaceTrack(S.display||S.camera).catch(()=>{});
 pc.ontrack=event=>{
  const track=event.track;
  if(!peer.stream.getTracks().some(t=>t.id===track.id))peer.stream.addTrack(track);
  track.addEventListener('unmute',tiles);
  track.addEventListener('ended',()=>{try{peer.stream.removeTrack(track)}catch(_){}tiles()});
  tiles();
 };
 pc.onicecandidate=event=>{if(event.candidate)void signal(key,{candidate:event.candidate.toJSON?.()||event.candidate});};
 pc.onnegotiationneeded=()=>{if(S.key<key)void offer(peer);};
 pc.onconnectionstatechange=()=>{
  if(pc.connectionState==='failed'&&peer.retries++<2&&S.key<key){void offer(peer,true);}
  if(pc.connectionState==='connected'){
   peer.retries=0;void tuneVideo();tiles();
  }
  if(pc.connectionState==='closed'){tiles();}
 };
 return peer;
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
  if(msg.description){
   const description=msg.description;
   if(description.type==='offer'){
    if(pc.signalingState!=='stable'&&S.key<msg.from)return;
    await pc.setRemoteDescription(description);
    await pc.setLocalDescription(await pc.createAnswer());
    await signal(msg.from,{description:pc.localDescription?.toJSON?.()||pc.localDescription});
   }else if(description.type==='answer'&&pc.signalingState==='have-local-offer'){
    await pc.setRemoteDescription(description);
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
 S.presence=next;
 for(const [key,peer] of S.peers)if(!next.has(key)){peer.pc.close();S.peers.delete(key);}
 for(const key of next.keys())if(key!==S.key&&!S.peers.has(key))ensurePeer(key);
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
 if(S.stage!=='preview'||!eligible()||!navigator.mediaDevices||!window.RTCPeerConnection){status('Este navegador não oferece os recursos necessários para esta chamada.');return;}
 S.stage='joining';const generation=++S.generation;draw();
 try{
  const room=S.room;
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
   if(S.channel!==channel)return;
   if(statusValue==='SUBSCRIBED'){
    try{
     const returning=S.stage==='live';
     clearTimeout(S.reconnectTimer);S.reconnectTimer=null;
     const current=channel.presenceState();
     const count=Object.values(current).reduce((n,items)=>n+(Array.isArray(items)?items.length:0),0);
     if(!returning&&count>=(isPrivate(room)?2:6)){await leave();alert(isPrivate(room)?'Esta chamada privada já tem dois dispositivos conectados.':'Esta versão aceita até 6 participantes simultâneos para preservar a qualidade da call.');return;}
     if(returning){
      S.peers.forEach(p=>p.pc.close());S.peers.clear();S.pendingSignals=[];S.presence.clear();
     }
     await channel.track(meta());
     if(S.generation!==generation||S.channel!==channel){return;}
     S.stage='live';S.presence.set(S.key,meta());status('',0);draw();synchronize();
     clearInterval(S.guard);S.guard=setInterval(()=>{void checkMembership()},15000);
    }catch(e){status('Não foi possível entrar na call. '+(e.message||''),10);await leave();}
   }else if(['CHANNEL_ERROR','TIMED_OUT'].includes(statusValue)&&S.stage==='live'){
    const label=S.overlay?.querySelector('[data-gc-connection]');
    if(label){label.textContent='Reconectando…';label.classList.remove('is-live');}
    status('Conexão instável. Tentando restabelecer a call automaticamente…',0);
    if(!S.reconnectTimer)S.reconnectTimer=setTimeout(()=>{
     if(S.channel===channel&&S.stage==='live'){
      void leave().then(()=>{if(typeof toast==='function')toast('Não foi possível reconectar. Entre novamente na call.');});
     }
    },30000);
   }else if((statusValue==='CLOSED'||S.stage==='joining'&&['CHANNEL_ERROR','TIMED_OUT'].includes(statusValue))&&S.stage!=='off'){
    await leave();if(typeof toast==='function')toast('A conexão da call foi interrompida. Entre novamente para reconectar.');
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
  const {data,error}=await client.from('uentzoul_room_messages')
   .select('id,sender_id,body,kind,created_at').eq('room_id',roomId)
   .is('deleted_at',null).order('created_at',{ascending:false}).limit(60);
  if(S.room?.id!==roomId||S.generation!==generation)return;
  if(error)throw error;S.chat=(data||[]).reverse();panelDraw();
 }catch(e){status('Falha ao carregar mensagens do grupo.');}
 finally{S.chatBusy=false;}
}
async function sendChat(form){
 const textarea=form.querySelector('textarea');const value=textarea?.value.trim();
 if(!value||value.length>3000||!eligible()||!S.room)return;
 const button=form.querySelector('button[type="submit"]');button.disabled=true;
 try{
  const {error}=await client.from('uentzoul_room_messages')
   .insert({room_id:S.room.id,sender_id:onlineUser.id,body:value,kind:'text'});
  if(error)throw error;textarea.value='';await loadChat();
 }catch(e){status('Não foi possível enviar a mensagem.');}
 finally{button.disabled=false;}
}
function panelDraw(){
 const aside=S.overlay?.querySelector('[data-gc-panel]');if(!aside)return;
 aside.hidden=!S.panel;if(!S.panel){aside.innerHTML='';aside.dataset.gcSignature='';return;}
 const title=S.panel==='chat'?'Mensagens do grupo':S.panel==='members'?'Participantes':S.panel==='react'?'Reações':'Dispositivos';
 let body='';
 if(S.panel==='members'){
  body='<div class="gc-member-list">'+[...S.presence.entries()].map(([k,m])=>
   '<div><span class="gc-member-initial">'+escCall((m.name||'?').slice(0,1).toUpperCase())+'</span><strong>'+escCall(m.name||'Participante')+(k===S.key?' (você)':'')+'</strong><span>'+(m.mic?'🎙':'🔇')+(m.hand?' ✋':'')+'</span></div>').join('')+'</div>';
 }else if(S.panel==='chat'){
  body='<div class="gc-chat-list" data-gc-chat-list>'+S.chat.map(m=>
   '<div class="gc-chat-msg"><strong>'+escCall(person(m.sender_id).display_name||'Estudante')+'</strong><p>'+escCall(m.kind==='text'?m.body:'[Mídia compartilhada no grupo]')+'</p></div>').join('')+
   (!S.chat.length?'<p class="gc-chat-empty">Nenhuma mensagem recente.</p>':'')+'</div>'+
   '<form class="gc-chat-form" data-gc-chat-form><textarea maxlength="3000" rows="2" placeholder="Escreva no grupo…"></textarea><button type="submit" aria-label="Enviar mensagem">➤</button></form>';
 }else if(S.panel==='react'){
  body='<div class="gc-reaction-picker">'+['👏','❤️','😂','🎉','👍'].map(emoji=>
   '<button type="button" data-gc-action="react-emoji" data-gc-emoji="'+emoji+'" aria-label="Reagir com '+emoji+'">'+emoji+'</button>').join('')+'</div>';
 }else{
  body='<div class="gc-device-section"><label>Microfone<select data-gc-device="audio"><option value="">Padrão do sistema</option></select></label>'+
  '<label>Câmera<select data-gc-device="video"><option value="">Padrão do sistema</option></select></label>'+
  '<p>Permissões e compatibilidade dependem do navegador. Compartilhar tela pode não estar disponível em celulares.</p></div>';
 }
 const signature=S.panel+'|'+(S.panel==='chat'?S.chat.map(m=>m.id).join(','):
  S.panel==='members'?JSON.stringify([...S.presence.entries()].map(([k,m])=>[k,m.mic,m.cam,m.hand,m.screen])):
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
}
async function deviceList(){
 if(S.panel!=='settings'||!navigator.mediaDevices?.enumerateDevices)return;
 try{
  const devices=await navigator.mediaDevices.enumerateDevices();
  if(S.panel!=='settings')return;
  for(const [kind,type,chosen] of [['audioinput','audio',S.micDevice],['videoinput','video',S.camDevice]]){
   const select=S.overlay?.querySelector('[data-gc-device="'+type+'"]');if(!select)return;
   const match=devices.filter(d=>d.kind===kind);
   for(const [i,d] of match.entries()){
    const o=document.createElement('option');o.value=d.deviceId;o.textContent=d.label||((type==='audio'?'Microfone ':'Câmera ')+(i+1));select.appendChild(o);
   }
   select.value=chosen;
  }
 }catch(e){console.warn('Falha ao listar dispositivos',e);}
}
async function changeDevice(type,value){
 if(type==='audio'){S.micDevice=value;if(S.mic)try{await captureAudio(value);}catch(e){status('Não foi possível mudar o microfone.');}}
 if(type==='video'){S.camDevice=value;if(S.cam)try{await captureCamera(value);}catch(e){status('Não foi possível mudar a câmera.');}}
 await publish();
}
async function leave(){
 ++S.generation;
 const channel=S.channel;S.channel=null;
 clearInterval(S.guard);S.guard=null;
 clearTimeout(S.reconnectTimer);S.reconnectTimer=null;
 clearTimeout(S.noticeTimer);
 S.peers.forEach(p=>p.pc.close());S.peers.clear();
 if(channel){try{void channel.untrack().catch(()=>{});}catch(_){}try{void client.removeChannel(channel).catch(()=>{});}catch(_){}}
 for(const track of [S.audio,S.camera,S.display])try{track?.stop()}catch(_){}
 S.audio=null;S.camera=null;S.display=null;S.stream=null;S.screen=false;S.hand=false;
 S.presence.clear();S.pendingSignals=[];S.key='';S.stage='off';S.room=null;S.panel='';S.chat=[];S.pinned=null;
 S.overlay?.remove();S.overlay=null;S.photoUrl='';
 try{if(typeof dmShow==='function')dmShow()}catch(_){}
}
function preview(room){
 if(!room||!eligible())return;
 if(S.stage!=='off'){
  if(S.room?.id===room.id){S.overlay?.querySelector('[data-gc-action="mic"]')?.focus();return;}
  if(!confirm('Sair da chamada atual para entrar na chamada de outro grupo?'))return;
  void leave().then(()=>preview(room));return;
 }
 S.room=room;S.stage='preview';++S.generation;S.mic=true;S.cam=false;S.hand=false;S.notice='';
 shell();
}
async function actions(event){
 const target=event.target;
 if(!(target instanceof Element))return;
 const opener=target.closest('[data-gc-open]');
 if(opener){
  event.preventDefault();event.stopPropagation();
  const id=opener.dataset.gcOpen;preview(group(id));return;
 }
 const action=target.closest('[data-gc-action]');
 if(!action||!S.overlay?.contains(action))return;
 event.preventDefault();event.stopPropagation();
 switch(action.dataset.gcAction){
 case 'mic':await toggleMic();break;
 case 'cam':await toggleCam();break;
 case 'screen':await toggleScreen();break;
 case 'hand':S.hand=!S.hand;await publish();break;
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
 case 'chat':case 'members':case 'settings':case 'react':{
  S.panel=S.panel===action.dataset.gcAction?'':action.dataset.gcAction;
  draw();if(S.panel==='chat')void loadChat();break;
 }
 case 'panel-close':S.panel='';draw();break;
 case 'pin':S.pinned=S.pinned===action.dataset.gcKey?null:action.dataset.gcKey;draw();break;
 case 'audio-play':{
  const videos=S.overlay?.querySelectorAll('.gc-tile video:not([muted])')||[];
  for(const v of videos)try{await v.play()}catch(_){}
  status('Tentativa de ativar o áudio dos participantes.',3);break;
 }
 case 'fullscreen':{
  try{if(document.fullscreenElement)await document.exitFullscreen();else await S.overlay.querySelector('.gc-window').requestFullscreen();}catch(_){status('Tela cheia indisponível neste dispositivo.');}break;
 }
 }
}
function init(){
 if(!bridge||!dm||!window.uentzoulMessenger)return false;
 document.addEventListener('click',e=>{void actions(e)},true);
 document.addEventListener('submit',e=>{
  const f=e.target;if(f instanceof HTMLFormElement&&f.matches('[data-gc-chat-form]')){
   e.preventDefault();void sendChat(f);
  }
 },true);
 document.addEventListener('change',e=>{
  const el=e.target;if(el instanceof HTMLSelectElement&&el.dataset.gcDevice)void changeDevice(el.dataset.gcDevice,el.value);
 },true);
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&S.stage==='preview'){e.preventDefault();void leave();}
 },true);
 window.addEventListener('pagehide',()=>{if(S.stage!=='off')void leave();});
 window.addEventListener('resize',fitViewport,{passive:true});
 window.visualViewport?.addEventListener('resize',fitViewport,{passive:true});
 const previousLogout=window.uentzoulMessenger.onLogout;
 window.uentzoulMessenger.onLogout=function(...args){void leave();return previousLogout?.apply(this,args);};
 window.addEventListener('uentzoul:auth',()=>{if(!bridge.user()?.id)void leave();});
 window.uentzoulGroupCalls={open:id=>preview(group(id)),leave:()=>leave(),get active(){return S.stage==='live'},get roomId(){return S.room?.id||null}};
 return true;
}
if(!init()){
 let tries=0;const timer=setInterval(()=>{if(init()||++tries>30)clearInterval(timer)},250);
}
})();