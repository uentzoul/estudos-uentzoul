/* PsicoMoodle — mini player persistente para os podcasts.
   Usa exclusivamente #audioPlayer: nunca cria outro elemento de áudio. */
(()=>{
'use strict';
if(window.__pmPodcastMiniInstalled)return;
window.__pmPodcastMiniInstalled=true;

let audio=null,seenPlayback=false,dismissed=false,trackKey='',trackTitle='Podcast',subjectName='',subject='',episodeIndex=0;
let panel=null,frame=0,seeking=false;
const q=sel=>document.querySelector(sel);
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const clock=seconds=>{
 const n=Math.max(0,Math.floor(Number(seconds)||0));
 const hours=Math.floor(n/3600),min=Math.floor(n%3600/60),sec=String(n%60).padStart(2,'0');
 return hours?hours+':'+String(min).padStart(2,'0')+':'+sec:min+':'+sec;
};
function onPodcastPage(){
 // O player normal continua sendo a única interface na página de podcasts.
 return !!q('#main #psAudioShell');
}
function build(){
 if(panel)return;
 panel=document.createElement('aside');
 panel.id='pmPodcastMini';
 panel.className='pm-podcast-mini';
 panel.hidden=true;
 panel.setAttribute('role','region');
 panel.setAttribute('aria-label','Miniplayer de podcast');
 panel.innerHTML=
 '<div class="pm-mini-header">'+
  '<span class="pm-mini-art" aria-hidden="true">♫</span>'+
  '<div class="pm-mini-details"><span class="pm-mini-kicker" id="pmMiniSubject">PODCAST</span>'+
   '<button class="pm-mini-title" type="button" id="pmMiniOpen" title="Abrir página do podcast"><span id="pmMiniTitle">Podcast</span></button>'+
  '</div>'+
  '<button type="button" class="pm-mini-close" id="pmMiniClose" aria-label="Fechar miniplayer e pausar podcast" title="Fechar miniplayer">×</button>'+
 '</div>'+
 '<div class="pm-mini-seekline">'+
  '<span id="pmMiniElapsed">0:00</span>'+
  '<input id="pmMiniSeek" type="range" min="0" max="1000" value="0" aria-label="Posição no podcast">'+
  '<span id="pmMiniDuration">--:--</span>'+
 '</div>'+
 '<div class="pm-mini-controls">'+
  '<button type="button" id="pmMiniBack" aria-label="Voltar 10 segundos" title="Voltar 10 segundos">−10</button>'+
  '<button type="button" id="pmMiniPlay" class="pm-mini-primary" aria-label="Reproduzir podcast">▶ <span>Reproduzir</span></button>'+
  '<button type="button" id="pmMiniForward" aria-label="Avançar 10 segundos" title="Avançar 10 segundos">+10</button>'+
  '<label class="pm-mini-speed">Velocidade <select id="pmMiniSpeed" aria-label="Velocidade do podcast">'+
   '<option value="0.75">0,75×</option><option value="1">1×</option>'+
   '<option value="1.25">1,25×</option><option value="1.5">1,5×</option><option value="2">2×</option>'+
  '</select></label>'+
 '</div>';
 document.body.appendChild(panel);
 q('#pmMiniClose').addEventListener('click',()=>{
  dismissed=true;
  if(audio&&!audio.paused)audio.pause();
  refresh();
 });
 q('#pmMiniOpen').addEventListener('click',()=>{
  if(subject&&typeof window.pmOpenPodcastFromMini==='function')
   window.pmOpenPodcastFromMini(subject,episodeIndex);
 });
 q('#pmMiniPlay').addEventListener('click',()=>{
  if(!audio||!audio.currentSrc&&!audio.getAttribute('src'))return;
  if(audio.paused){
   audio.play().catch(()=>{ /* Alguns navegadores exigem novo toque. */ });
  }else audio.pause();
  sync();
 });
 q('#pmMiniBack').addEventListener('click',()=>{
  if(!audio)return;
  audio.currentTime=Math.max(0,(audio.currentTime||0)-10);
  sync();
 });
 q('#pmMiniForward').addEventListener('click',()=>{
  if(!audio)return;
  const limit=Number.isFinite(audio.duration)?audio.duration:Infinity;
  audio.currentTime=Math.min(limit,(audio.currentTime||0)+10);
  sync();
 });
 q('#pmMiniSeek').addEventListener('input',event=>{
  seeking=true;
  if(!audio||!Number.isFinite(audio.duration)||audio.duration<=0)return;
  q('#pmMiniElapsed').textContent=clock(audio.duration*Number(event.target.value)/1000);
 });
 q('#pmMiniSeek').addEventListener('change',event=>{
  if(audio&&Number.isFinite(audio.duration)&&audio.duration>0)
   audio.currentTime=audio.duration*Number(event.target.value)/1000;
  seeking=false;sync();
 });
 q('#pmMiniSpeed').addEventListener('change',event=>{
  if(audio)audio.playbackRate=Number(event.target.value)||1;
  sync();
 });
}
function sync(){
 if(!panel||!audio)return;
 const dur=Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:0;
 const elapsed=audio.currentTime||0;
 const play=q('#pmMiniPlay');
 if(play){
  play.innerHTML=audio.paused?'▶ <span>Reproduzir</span>':'Ⅱ <span>Pausar</span>';
  play.setAttribute('aria-label',audio.paused?'Reproduzir podcast':'Pausar podcast');
 }
 q('#pmMiniTitle').textContent=trackTitle||'Podcast';
 q('#pmMiniSubject').textContent=subjectName||'PODCAST';
 q('#pmMiniElapsed').textContent=clock(elapsed);
 q('#pmMiniDuration').textContent=dur?clock(dur):'--:--';
 const seek=q('#pmMiniSeek');
 if(!seeking){
  seek.value=dur?String(Math.round(1000*elapsed/dur)):'0';
  seek.disabled=!dur;
 }
 const speed=q('#pmMiniSpeed'),current=String(audio.playbackRate||1);
 if([...speed.options].some(o=>o.value===current))speed.value=current;
}
function refresh(){
 if(!panel)return;
 const hasSource=!!(audio&&(audio.currentSrc||audio.getAttribute('src')));
 const show=hasSource&&seenPlayback&&!dismissed&&!onPodcastPage();
 panel.hidden=!show;
 document.body.classList.toggle('pm-podcast-mini-visible',show);
 if(show)sync();
}
function schedule(){
 if(frame)return;
 frame=requestAnimationFrame(()=>{frame=0;attach();refresh();});
}
function attach(){
 const candidate=q('#audioPlayer');
 if(!candidate||candidate===audio)return;
 audio=candidate;
 if(audio.currentTime>0||(!audio.paused&&audio.currentSrc))seenPlayback=true;
 audio.addEventListener('play',()=>{
  seenPlayback=true;
  dismissed=false;
  refresh();
 });
 audio.addEventListener('playing',()=>{seenPlayback=true;dismissed=false;refresh()});
 for(const type of ['pause','timeupdate','loadedmetadata','durationchange','ratechange','ended','emptied']){
  audio.addEventListener(type,()=>{
   if(type==='emptied'&&!trackKey)seenPlayback=false;
   if(panel&&!panel.hidden)sync();
   if(type!=='timeupdate')refresh();
  });
 }
 refresh();
}
window.addEventListener('pm:podcast-selected',event=>{
 const data=event.detail||{};
 if(!data.title)return;
 const nextKey=String(data.subject||'')+':'+String(data.index??'');
 if(trackKey!==nextKey){
  seenPlayback=false;dismissed=false;
 }
 trackKey=nextKey;
 trackTitle=String(data.title);
 subjectName=String(data.subjectName||'PODCAST');
 subject=String(data.subject||'');
 episodeIndex=Number(data.index)||0;
 schedule();
});
function start(){
 build();
 attach();
 const main=q('#main');
 if(main)new MutationObserver(schedule).observe(main,{childList:true,subtree:false});
 // setupAudio() move a mídia para body só quando se abre um podcast.
 new MutationObserver(schedule).observe(document.body,{childList:true,subtree:false});
 window.addEventListener('resize',schedule,{passive:true});
 window.addEventListener('pageshow',schedule);
 schedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
else start();
})();
