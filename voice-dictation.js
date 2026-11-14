/* PsicoMoodle — ditado por IA para Mensagens e IA Tzoul. */
(()=>{
'use strict';
if(window.__pmVoiceDictation)return;
window.__pmVoiceDictation=true;
const MAX_SECONDS=90;
const MAX_BYTES=10*1024*1024;
const state={phase:'idle',mode:null,recorder:null,stream:null,chunks:[],start:0,timer:null,abort:null,cancelled:false,context:null};
const micSvg='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2.5" width="6" height="12" rx="3"/><path d="M5 10.5a7 7 0 0 0 14 0M12 17.5V22m-4 0h8"/></svg>';
let panel=null, scheduled=false;
const $=s=>document.querySelector(s);
function context(){
 const c=$('#dmContacts .dm-contact.selected .dm-contact-open');
 if(!c)return $('#main .dm-chat-head-main')?.textContent?.trim()||null;
 return c.dataset.dmwGlobal?'global':c.dataset.dmRoom?'room:'+c.dataset.dmRoom:c.dataset.dmPeer?'private:'+c.dataset.dmPeer:null;
}
function field(mode){return mode==='ai'?$('#tzPrompt'):$('#dmPrompt')}
function makePanel(){
 if(panel)return;
 panel=document.createElement('div');
 panel.className='pm-voice-panel';panel.id='pmVoicePanel';panel.hidden=true;
 panel.setAttribute('role','status');
 panel.setAttribute('aria-live','polite');
 panel.innerHTML='<div class="pm-voice-indicator" aria-hidden="true"><span></span><span></span><span></span></div>'+
 '<div class="pm-voice-copy"><strong id="pmVoiceTitle">Ditado por voz</strong><small id="pmVoiceStatus"></small></div>'+
 '<div class="pm-voice-actions"><button type="button" data-pm-voice-stop>Concluir</button>'+
 '<button type="button" data-pm-voice-cancel>Cancelar</button>'+
 '<button type="button" data-pm-voice-close hidden>Fechar</button></div>';
 document.body.appendChild(panel);
}
function say(title,message,phase){
 makePanel();
 panel.hidden=false;panel.dataset.phase=phase;
 $('#pmVoiceTitle').textContent=title;
 $('#pmVoiceStatus').textContent=message;
 const stop=panel.querySelector('[data-pm-voice-stop]');
 const cancel=panel.querySelector('[data-pm-voice-cancel]');
 const close=panel.querySelector('[data-pm-voice-close]');
 stop.hidden=phase!=='recording';
 cancel.hidden=phase==='error'||phase==='done';
 close.hidden=phase!=='error'&&phase!=='done';
 cancel.textContent=phase==='processing'?'Cancelar':'Descartar';
 updateButtons();
}
function hide(){
 if(panel)panel.hidden=true;
 state.phase='idle';state.mode=null;state.context=null;
 updateButtons();
}
function updateButtons(){
 document.querySelectorAll('[data-pm-dictate]').forEach(btn=>{
  const busy=state.phase==='recording'||state.phase==='processing';
  btn.classList.toggle('is-recording',busy&&state.mode===btn.dataset.pmDictate);
  btn.setAttribute('aria-pressed',String(busy&&state.mode===btn.dataset.pmDictate));
  if(btn.dataset.pmDictate==='ai'){
   btn.disabled=!!field('ai')?.disabled;
  }
 });
}
function install(){
 const msg=$('#main .dm-composer [data-dmw-record]:not(.pm-voice-original)');
 if(msg){
  msg.removeAttribute('data-dmw-record');
  msg.setAttribute('data-pm-dictate','messages');
  msg.setAttribute('aria-label','Ditar mensagem em texto');
  msg.setAttribute('title','Ditar mensagem em texto');
  msg.classList.add('pm-voice-trigger');
  const toolbar=msg.closest('.dm-composer');
  if(toolbar&&!toolbar.querySelector('.pm-voice-original')){
   const proxy=document.createElement('button');
   proxy.type='button';proxy.hidden=true;proxy.tabIndex=-1;proxy.setAttribute('aria-hidden','true');proxy.style.setProperty('display','none','important');
   proxy.className='pm-voice-original';proxy.setAttribute('data-dmw-record','');
   toolbar.appendChild(proxy);
  }
 }
 const menu=$('#main .dm-tools-menu');
 if(menu&&!menu.querySelector('[data-pm-voice-message]')){
  const button=document.createElement('button');
  button.type='button';
  button.setAttribute('data-pm-voice-message','');
  button.textContent='Gravar mensagem de voz';
  button.title='Enviar uma gravação de áudio, sem transcrever';
  menu.prepend(button);
 }
 const ai=$('#main #tzPrompt');
 if(ai&&!$('#main [data-pm-dictate="ai"]')){
  const button=document.createElement('button');
  button.type='button';button.className='pm-voice-trigger pm-voice-ai';
  button.setAttribute('data-pm-dictate','ai');button.title='Ditar texto para a IA Tzoul';
  button.setAttribute('aria-label','Ditar mensagem por voz');
  button.innerHTML=micSvg;
  const send=ai.closest('.tz-composer')?.querySelector('.tz-send');
  if(send)send.before(button);else ai.after(button);
 }
 updateButtons();
}
function schedule(){
 if(scheduled)return;
 scheduled=true;
 requestAnimationFrame(()=>{scheduled=false;install()});
}
function clear(){
 if(state.timer){clearInterval(state.timer);state.timer=null}
 if(state.stream){
  try{state.stream.getTracks().forEach(t=>t.stop())}catch(_){}
 }
 state.stream=null;
 state.recorder=null;
 state.chunks=[];
}
function cancel(){
 state.cancelled=true;
 if(state.abort){state.abort.abort();state.abort=null}
 try{if(state.recorder&&state.recorder.state!=='inactive')state.recorder.stop()}catch(_){}
 clear();hide();
}
function formatSeconds(seconds){return String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0')}
async function start(mode){
 if(state.phase!=='idle'){
  if(state.phase==='error'||state.phase==='done')hide();
  else return;
 }
 const target=field(mode);
 if(!target||target.disabled)return;
 if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){
  say('Ditado indisponível','Este navegador não permite a gravação pelo microfone.','error');return;
 }
 const available=['audio/webm;codecs=opus','audio/mp4','audio/webm','audio/ogg'].find(x=>MediaRecorder.isTypeSupported(x));
 if(!available){say('Formato não suportado','Tente abrir o site no Chrome, Safari ou Edge atualizado.','error');return}
 state.phase='requesting';state.mode=mode;state.context=mode==='messages'?context():null;state.cancelled=false;
 say('Permissão do microfone','Autorize o acesso ao microfone para começar a ditar.','processing');
 try{
  const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
  if(state.cancelled){stream.getTracks().forEach(t=>t.stop());return}
  const recorder=new MediaRecorder(stream,{mimeType:available});
  state.stream=stream;state.recorder=recorder;state.chunks=[];state.start=Date.now();state.phase='recording';
  recorder.ondataavailable=event=>{if(event.data?.size)state.chunks.push(event.data)};
  recorder.onerror=()=>{clear();say('Falha na gravação','Não foi possível gravar o áudio.','error');state.phase='error'};
  recorder.onstop=async()=>{
   const parts=state.chunks.slice(),type=(recorder.mimeType||available).split(';')[0];
   clear();
   if(!state.cancelled&&parts.length){
    const audio=new Blob(parts,{type});
    await transcribe(audio,mode,state.context);
   }else if(!state.cancelled){state.phase='error';say('Áudio vazio','Tente gravar novamente, falando perto do microfone.','error')}
  };
  recorder.start(250);
  say('Ouvindo você…','00:00 · Pressione Concluir para transformar a fala em texto.','recording');
  state.timer=setInterval(()=>{
   const elapsed=Math.floor((Date.now()-state.start)/1000);
   if(state.phase!=='recording')return;
   $('#pmVoiceStatus').textContent=formatSeconds(elapsed)+' · Pressione Concluir para transcrever.';
   if(elapsed>=MAX_SECONDS)stop();
  },1000);
 }catch(err){
  clear();state.phase='error';
  say('Não foi possível gravar',err?.name==='NotAllowedError'?'Permita o uso do microfone nas configurações do navegador.':'Confira o microfone e tente novamente.','error');
 }
}
function stop(){
 if(state.phase!=='recording'||!state.recorder)return;
 state.phase='processing';
 say('Preparando transcrição','Enviando seu áudio para transcrição.','processing');
 if(state.timer){clearInterval(state.timer);state.timer=null}
 try{if(state.recorder.state!=='inactive')state.recorder.stop()}catch(_){clear();state.phase='error';say('Falha na gravação','Tente novamente.','error')}
}
function displayText(text,mode,capturedContext){
 const target=field(mode);
 if(!target||target.disabled)return false;
 if(mode==='messages'&&capturedContext!==context())return false;
 const existing=target.value.trimEnd();
 const joint=existing?(existing+' '+text.trim()):text.trim();
 if(joint.length>target.maxLength&&target.maxLength>=0)return false;
 const nativeSetter=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value')?.set;
 if(nativeSetter)nativeSetter.call(target,joint);else target.value=joint;
 target.dispatchEvent(new Event('input',{bubbles:true}));
 target.focus({preventScroll:true});
 target.setSelectionRange(target.value.length,target.value.length);
 return true;
}
async function transcribe(blob,mode,capturedContext){
 if(blob.size>MAX_BYTES){state.phase='error';say('Áudio muito longo','Grave um trecho menor, de até 90 segundos.','error');return}
 state.phase='processing';say('Organizando sua fala…','Reconhecendo o português e ajustando a pontuação.','processing');
 try{
  const session=await window.uentzoulAIAuth?.getSession?.();
  if(!session?.access_token)throw Error('Entre na sua conta para usar o ditado.');
  const cfg=JSON.parse($('#uentzoul-auth-config')?.textContent||'{}');
  if(!cfg.url||!cfg.publishableKey)throw Error('Configuração do ditado indisponível.');
  const type=blob.type.split(';')[0],ext=({'audio/webm':'webm','audio/mp4':'mp4','audio/ogg':'ogg'})[type];
  if(!ext)throw Error('Formato de áudio não suportado.');
  const form=new FormData();
  form.append('audio',new File([blob],'ditado.'+ext,{type}));
  const abort=new AbortController();state.abort=abort;
  const response=await fetch(cfg.url+'/functions/v1/ditado-voz',{
   method:'POST',headers:{Authorization:'Bearer '+session.access_token,apikey:cfg.publishableKey},
   body:form,signal:abort.signal
  });
  const result=await response.json().catch(()=>({}));
  if(state.cancelled)return;
  if(!response.ok)throw Error(result?.error||'Não foi possível transcrever. Tente novamente.');
  const text=String(result?.text||'').trim();
  if(!text)throw Error('Não foi possível identificar a fala. Tente novamente.');
  if(displayText(text,mode,capturedContext)){
   hide();return;
  }
  state.phase='done';say('Transcrição pronta','O campo mudou ou o limite de caracteres foi atingido. Use Copiar para não perder sua fala.','done');
  let copy=panel.querySelector('[data-pm-voice-copy]');
  if(!copy){copy=document.createElement('button');copy.type='button';copy.setAttribute('data-pm-voice-copy','');copy.textContent='Copiar texto';panel.querySelector('.pm-voice-actions').prepend(copy)}
  copy.hidden=false;copy.dataset.text=text;
 }catch(err){
  if(state.cancelled||err?.name==='AbortError')return;
  state.phase='error';say('Não foi possível transcrever',String(err?.message||'Verifique a conexão e tente novamente.').slice(0,220),'error');
 }finally{state.abort=null}
}
function onClick(e){
 const mic=e.target.closest('[data-pm-dictate]');
 if(mic){e.preventDefault();e.stopImmediatePropagation();start(mic.dataset.pmDictate);return}
 const record=e.target.closest('[data-pm-voice-message]');
 if(record){
  e.preventDefault();e.stopImmediatePropagation();
  const original=$('#main .dm-composer [data-dmw-record].pm-voice-original')||$('#main .dm-composer [data-dmw-record]');
  if(original)original.click();
  return;
 }
 if(e.target.closest('[data-pm-voice-stop]')){e.preventDefault();stop();return}
 if(e.target.closest('[data-pm-voice-cancel]')){e.preventDefault();cancel();return}
 if(e.target.closest('[data-pm-voice-close]')){e.preventDefault();hide();return}
 const copy=e.target.closest('[data-pm-voice-copy]');
 if(copy){e.preventDefault();navigator.clipboard?.writeText(copy.dataset.text||'').then(()=>hide()).catch(()=>{});return}
}
function init(){
 makePanel();install();
 const main=$('#main');
 if(main)new MutationObserver(schedule).observe(main,{childList:true,subtree:true});
 window.addEventListener('click',onClick,true);
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.phase==='recording')stop()});
 window.addEventListener('pagehide',()=>{if(state.phase==='recording')cancel()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();
