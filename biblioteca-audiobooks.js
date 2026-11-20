/* PsicoMoodle — audiobooks, sem compartilhar audio do player de podcasts.
   Somente gravações com autorização de hospedagem entram no player interno. */
(()=>{
'use strict';
if(window.PSICO_AUDIO_LIBRARY)return;
const TABLE='uentzoul_audiobook_chapters',BUCKET='uentzoul-book-audios',LIMIT=50*1024*1024;
const SOURCES={
 'marcondes-filosofia':[{title:'Audible Brasil',lang:'Português · versão comercial',url:'https://www.audible.com.br/pd/Iniciacao-a-historia-da-filosofia-Audiolivro/B0HN5RHJ9T'}],
 'kuhn-revolucoes':[{title:'Apple Books',lang:'Inglês · versão comercial',url:'https://books.apple.com/us/audiobook/the-structure-of-scientific-revolutions-unabridged/id317266681'}],
 'popper-logica':[{title:'Google Play Audiobooks',lang:'Inglês · versão comercial',url:'https://play.google.com/store/audiobooks/details/The_Logic_of_Scientific_Discovery?hl=en_US&id=AQAAAEBSFz1XfM'}],
 'collins-interseccionalidade':[{title:'Google Play Audiobooks',lang:'Inglês · segunda edição, diferente da tradução brasileira',url:'https://play.google.com/store/audiobooks/details/Intersectionality_2nd_Edition?hl=en_GB&id=AQAAAEBCdCU0dM'}],
 'hall-identidade':[{title:'Rádio Híbrida · UFMA',lang:'Português · somente capítulos 1 e 2 · escuta externa',url:'https://www.radiohibrida.ufma.br/audiobook-a-identidade-cultural-na-pos-modernidade-staurt-hall/'}]
};
let rows=[],loaded=false,loading=false,owner='',selected='',selectedChapter='',filter='',search='',notice='',busy=false,formOpen=false;
let player=new Audio(),audioKey='',lastSave=0,lastPosition=0,playToken=0;
player.preload='none';player.playbackRate=1;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const books=()=>window.PSICO_BOOK_LIBRARY?.books?.()||[];
const book=k=>books().find(b=>b.id===k)||(()=>{const r=rows.find(x=>x.book_key===k&&x.book_title);return r?{id:k,title:r.book_title,author:r.book_author||'Autor não informado',subject:r.book_subject||'Audiobooks',cover:r.book_cover_url||'',colors:['#4e4b77','#8679a7','#f0e6f8']}:null})();
const chapters=k=>rows.filter(r=>r.book_key===k).sort((a,b)=>a.chapter_order-b.chapter_order);
const isAdmin=()=>!!(window.uentzoulAdminConfig?.isAdmin?.()&&window.uentzoulAIAuth?.user?.()?.id);
const canListen=()=>!!window.uentzoulAIAuth?.user?.()?.id;
const client=()=>window.uentzoulAIAuth?.client?.();
const user=()=>window.uentzoulAIAuth?.user?.()?.id||'';
const clock=n=>{n=Math.floor(Math.max(0,Number(n)||0));return n>=3600?Math.floor(n/3600)+':'+String(Math.floor(n%3600/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0'):Math.floor(n/60)+':'+String(n%60).padStart(2,'0')};
const clean=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const formatTime=str=>{const parts=String(str).replace(',','.').split(':');return parts.reduce((a,p)=>a*60+(parseFloat(p)||0),0)};
const current=()=>rows.find(r=>r.id===selectedChapter)||null;
const positionKey=r=>'psicomoodle_audiobook_'+user()+'_'+r.id;
function savePosition(force){if(!audioKey||!player.currentTime||!user())return;const now=Date.now();if(!force&&now-lastSave<6000)return;lastSave=now;try{localStorage.setItem('psa_position_'+audioKey,String(player.currentTime))}catch(_){}}
function remembered(r){try{return Math.max(0,Number(localStorage.getItem('psa_position_'+r.id))||0)}catch(_){return 0}}
function openBook(k){if(!book(k)||(!isAdmin()&&!chapters(k).length))return;if(audioKey&&rows.find(r=>r.id===audioKey)?.book_key!==k){savePosition(true);player.pause();}selected=k;selectedChapter=chapters(k)[0]?.id||'';search='';notice='';formOpen=false;redraw()}
function redraw(){if(isAdmin())window.uentzoulAdminBridge?.refreshCurrent?.();else window.uentzoulAudioRefresh?.()}
function cover(b,small){const colors=b.colors||['#4e4b77','#8679a7','#f0e6f8'];const image=/^https:\/\//i.test(b.cover||'')||/^assets\//.test(b.cover||'')?b.cover:'';return '<div class="psa-cover'+(small?' psa-cover-small':'')+'" style="--psa-0:'+esc(colors[0])+';--psa-1:'+esc(colors[1])+'">'+(image?'<img src="'+esc(image)+'" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">':'<span class="psa-cover-initial">'+esc((b.title||'A').slice(0,1))+'</span>')+'<div class="psa-cover-shine"></div><span class="psa-cover-ribbon">AUDIOBOOK</span><span class="psa-cover-headset" aria-hidden="true">♫</span></div>'}
function itemCard(b){const count=chapters(b.id).length,external=(SOURCES[b.id]||[]).length;
return '<article class="psa-item"><button type="button" data-psa-open="'+esc(b.id)+'" aria-label="Audiobook '+esc(b.title)+'">'+cover(b,false)+'<div class="psa-item-copy"><strong>'+esc(b.title)+'</strong><small>'+esc(b.author)+'</small><span class="psa-state '+(count?'is-playable':'')+'">'+(count?count+' capítulo'+(count>1?'s':'')+' no site':external?'Versão externa encontrada':'Sem áudio identificado')+'</span></div></button></article>'}
function shelf(){
 const bs=isAdmin()?books():[...new Set(rows.filter(r=>r.audio_path).map(r=>r.book_key))].map(book).filter(Boolean);
 const show=bs.filter(b=>!filter||clean([b.title,b.author,b.subject].join(' ')).includes(clean(filter)));
 const message=!loaded&&!isAdmin()?'Carregando audiobooks publicados…':filter?'Nenhum audiobook encontrado nessa busca.':isAdmin()?'Nenhuma obra cadastrada.':'Nenhum audiobook publicado até o momento.';
 return '<div class="psb-subhead"><div><button class="psb-back" '+(isAdmin()?'data-psb-tab="home"':'data-psa-backhome')+'>‹ Biblioteca</button><h2>Biblioteca de audiobooks</h2><p>'+
 (isAdmin()?'Ouça gravações autorizadas por capítulos ou consulte as versões disponíveis em plataformas oficiais.':'Audiobooks enviados e publicados para escuta no site.')+'</p></div><span class="psb-count">'+bs.length+' '+(bs.length===1?'audiobook':'audiobooks')+'</span></div>'+
 '<div class="psa-search"><label for="psaFind">Buscar título ou autor</label><input id="psaFind" type="search" placeholder="Pesquisar audiobooks..." value="'+esc(filter)+'" autocomplete="off"></div>'+
 '<div class="psa-library-grid">'+show.map(itemCard).join('')+'</div>'+
 (!show.length?'<p class="psa-info">'+message+'</p>':'')+
 (isAdmin()?'<p class="psa-disclaimer">As versões comerciais são links externos. Compra ou assinatura não permitem reenvio ao site. Apenas arquivos com licença de hospedagem podem ser reproduzidos aqui.</p>':'');
}
function links(k){const entries=SOURCES[k]||[];
return '<section class="psa-sources"><h3>Onde ouvir fora do site</h3>'+(entries.length?entries.map(x=>'<div class="psa-source"><div><strong>'+esc(x.title)+'</strong><small>'+esc(x.lang)+'</small></div><a href="'+esc(x.url)+'" target="_blank" rel="noopener noreferrer">Abrir plataforma ↗</a></div>').join(''):'<p>Não foi encontrada uma edição comercial ou gravação confiável correspondente a esta obra na pesquisa atual.</p>')+'<p class="psa-source-note">Links externos não autorizam baixar, converter ou redistribuir suas gravações.</p></section>'}
function playback(){const cs=chapters(selected),r=current()||cs[0];
if(!cs.length)return '<div class="psa-no-audio"><span>♫</span><strong>Ainda não há gravação hospedada deste livro</strong><p>Quando uma edição autorizada for enviada, o player, os capítulos e a transcrição serão exibidos aqui.</p></div>';
const active=r&&audioKey===r.id,paused=player.paused||!active,duration=active&&Number.isFinite(player.duration)?player.duration:0,progress=active?player.currentTime:remembered(r);
return '<section class="psa-player" aria-label="Player do audiobook"><span class="psa-player-kicker">AUDIOBOOK · REPRODUÇÃO</span><h3>'+esc(r?.chapter_title||'Capítulo')+'</h3>'+
'<div class="psa-player-progress"><span id="psaElapsed">'+clock(progress)+'</span><input id="psaSeek" type="range" min="0" max="1000" value="'+(duration?Math.min(1000,Math.round(progress/duration*1000)):0)+'" aria-label="Posição da reprodução" '+(duration?'':'disabled')+'><span id="psaDuration">'+(duration?clock(duration):'--:--')+'</span></div>'+
'<div class="psa-player-controls"><button data-psa-skip="-10" aria-label="Voltar dez segundos">−10</button><button class="psa-main-play" data-psa-play aria-label="'+(paused?'Reproduzir':'Pausar')+'">'+(paused?'▶':'Ⅱ')+'</button><button data-psa-skip="10" aria-label="Avançar dez segundos">+10</button><label>Velocidade <select id="psaSpeed" aria-label="Velocidade de reprodução">'+[0.75,1,1.25,1.5,1.75,2].map(n=>'<option value="'+n+'" '+(Number(player.playbackRate)===n?'selected':'')+'>'+String(n).replace('.',',')+'×</option>').join('')+'</select></label></div>'+
'<div class="psa-player-status" id="psaPlayStatus" role="status">Retome de onde parou ou escolha um capítulo.</div></section>'+
'<section class="psa-chapters"><h3>Sumário do audiobook <small>'+cs.length+' capítulo'+(cs.length===1?'':'s')+'</small></h3>'+cs.map(c=>'<button type="button" class="psa-chapter '+(r?.id===c.id?'active':'')+'" data-psa-chapter="'+esc(c.id)+'"><span>'+String(c.chapter_order).padStart(2,'0')+'</span><strong>'+esc(c.chapter_title)+'</strong><span class="psa-chapter-play">'+(audioKey===c.id&&!player.paused?'Ⅱ':'▶')+'</span></button>').join('')+'</section>'+
'<section class="psa-transcript"><div class="psa-transcript-head"><div><h3>Transcrição e busca por trechos</h3><p>Toque numa fala com horário para saltar ao ponto correspondente.</p></div></div>'+
(r?.transcript_vtt?'<label for="psaTranscriptFind">Localizar trecho</label><input type="search" id="psaTranscriptFind" value="'+esc(search)+'" placeholder="Buscar na transcrição..." autocomplete="off"><div id="psaTranscriptCues" class="psa-cue-list">'+cueHtml(r)+'</div>':'<p class="psa-info">Este capítulo ainda não possui uma transcrição com horários. O sumário por capítulos já está disponível.</p>')+'</section>'}
function cues(text){return String(text||'').trim().split(/\r?\n\s*\r?\n/).map(block=>{const lines=block.split(/\r?\n/).map(x=>x.trim());const i=lines.findIndex(x=>x.includes('-->'));if(i<0)return null;const m=lines[i].match(/(\d{2}:)?\d{2}:\d{2}[.,]\d{3}\s*-->\s*(\d{2}:)?\d{2}:\d{2}[.,]\d{3}/);if(!m)return null;const start=formatTime(m[0].split('-->')[0].trim());const content=lines.slice(i+1).join(' ').replace(/<[^>]+>/g,'').trim();return content?{start,content}:null}).filter(Boolean)}
function cueHtml(r){const found=cues(r.transcript_vtt).filter(c=>!search||clean(c.content).includes(clean(search)));return found.length?found.slice(0,800).map(c=>'<button type="button" class="psa-cue" data-psa-seek="'+c.start+'"><time>'+clock(c.start)+'</time><span>'+esc(c.content)+'</span></button>').join(''):'<p class="psa-info">Nenhum trecho encontrado.</p>'}
function uploader(){const cs=chapters(selected),next=Math.min(250,Math.max(0,...cs.map(r=>r.chapter_order))+1);
return '<section class="psa-admin"><button class="psa-admin-toggle" type="button" data-psa-toggle aria-expanded="'+formOpen+'">'+(formOpen?'− Fechar envio de capítulos':'+ Adicionar capítulo autorizado')+'</button>'+(formOpen?'<form id="psaUploadForm"><h3>Adicionar gravação à biblioteca</h3><p>Somente áudio próprio, de domínio público verificado ou com autorização expressa para hospedar. Não envie cópias de Audible, Spotify ou outras plataformas.</p>'+
'<label>Nome do capítulo<input name="chapter" required maxlength="200" placeholder="Ex.: Capítulo 1 — Introdução"></label><label>Ordem<input name="order" required type="number" min="1" max="250" value="'+next+'"></label>'+
'<label>Arquivo MP3, M4A ou OGG (até 50 MB por capítulo)<input name="audio" type="file" accept=".mp3,.m4a,.ogg,audio/mpeg,audio/mp4,audio/ogg" required></label>'+
'<label>Transcrição temporizada, opcional (VTT ou SRT)<input name="transcript" type="file" accept=".vtt,.srt,text/vtt,text/plain"></label>'+
'<label class="psa-rights"><input name="rights" type="checkbox" required> Confirmo que tenho direito de hospedar e disponibilizar esta gravação e sua transcrição no site.</label>'+
'<button class="psa-submit" type="submit" '+(busy?'disabled':'')+'>'+(busy?'Enviando…':'Publicar capítulo')+'</button></form>':'')+
(cs.length?'<details class="psa-admin-manage"><summary>Gerenciar capítulos publicados</summary>'+cs.map(r=>'<div><span>'+esc(r.chapter_title)+'</span><button type="button" data-psa-delete="'+esc(r.id)+'">Excluir</button></div>').join('')+'</details>':'')+'</section>'}
function detail(){
 const b=book(selected);
 if(!b||(!isAdmin()&&!chapters(selected).length)){selected='';return shelf()}
 return '<div class="psa-detail"><button class="psb-back" data-psa-back>‹ Audiobooks</button><div class="psa-hero">'+cover(b,true)+'<div><span class="psa-eyebrow">BIBLIOTECA DE AUDIOBOOKS</span><h2>'+esc(b.title)+'</h2><p>'+esc(b.author)+'</p><small>'+esc(b.subject||'Biblioteca')+'</small></div></div><div class="psa-detail-columns"><div>'+playback()+(isAdmin()?links(selected):'')+'</div>'+
 (isAdmin()?'<div>'+uploader()+'</div>':'')+'</div><p class="psa-notice" id="psaNotice" role="status">'+esc(notice)+'</p></div>'
}
function render(){return '<div class="psa-app">'+(selected?detail():shelf())+'</div>'}
async function load(force){if(!canListen())return;if(loading||(loaded&&!force))return;const uid=user();if(uid!==owner){owner=uid;rows=[];loaded=false;selected='';}const c=client();if(!c)return;loading=true;try{const q=await c.from(TABLE).select('id,book_key,chapter_order,chapter_title,audio_path,transcript_vtt,book_title,book_author,book_subject,book_cover_url,created_at').order('chapter_order',{ascending:true});if(q.error)throw q.error;if(uid!==user())return;rows=q.data||[];loaded=true;notice='';redraw()}catch(err){notice='Não foi possível carregar os audiobooks: '+(err?.message||'erro');loaded=true;redraw()}finally{loading=false}}
function afterRender(){if(!canListen())return;void load(false);syncPlayer()}
function stop(){savePosition(true);playToken++;player.pause();player.removeAttribute('src');player.load();audioKey='';selectedChapter=''}
async function playChapter(id,autoplay=true){if(!canListen())return;const r=rows.find(x=>x.id===id);if(!r)return;selectedChapter=r.id;if(audioKey===id&&player.src){if(autoplay){if(player.paused)await player.play().catch(showPlayError);else player.pause();}redraw();return}
savePosition(true);const token=++playToken;const c=client();if(!c)return;notice='Preparando áudio…';redraw();
try{const signed=await c.storage.from(BUCKET).createSignedUrl(r.audio_path,14400);if(signed.error||!signed.data?.signedUrl)throw signed.error||Error('Endereço indisponível');if(token!==playToken||!canListen())return;player.pause();audioKey=id;player.src=signed.data.signedUrl;player.load();lastPosition=remembered(r);notice='';redraw();if(autoplay)await player.play().catch(showPlayError)}
catch(err){notice='Não foi possível abrir o áudio: '+(err?.message||'erro');redraw()}}
function showPlayError(err){notice='O navegador não conseguiu reproduzir: '+(err?.message||'erro de áudio');redraw()}
function syncPlayer(){refreshMini();const active=current();if(!active)return;const p=audioKey===active.id,elapsed=p?(player.currentTime||0):remembered(active),duration=p&&Number.isFinite(player.duration)?player.duration:0;const seek=$('psaSeek'),now=$('psaElapsed'),end=$('psaDuration');if(now)now.textContent=clock(elapsed);if(end)end.textContent=duration?clock(duration):'--:--';if(seek){seek.disabled=!duration;if(seek!==document.activeElement)seek.value=duration?String(Math.round(1000*elapsed/duration)):'0'}const play=document.querySelector('[data-psa-play]');if(play){play.textContent=p&&!player.paused?'Ⅱ':'▶';play.setAttribute('aria-label',p&&!player.paused?'Pausar':'Reproduzir')}const status=$('psaPlayStatus');if(status)status.textContent=p&&!player.paused?'Reproduzindo · '+esc(active.chapter_title):'Pronto para escutar';const list=$('psaTranscriptCues');if(list&&p){for(const el of list.querySelectorAll('[data-psa-seek]')){const time=Number(el.dataset.psaSeek);el.classList.toggle('active',player.currentTime>=time&&player.currentTime<time+6)}}}
async function upload(form){if(busy||!isAdmin()||!selected)return;const data=new FormData(form),file=data.get('audio'),title=String(data.get('chapter')||'').trim(),order=Number(data.get('order'));if(!file||!file.size||!title||!Number.isInteger(order)||order<1||order>250||data.get('rights')!=='on')return;if(chapters(selected).some(r=>r.chapter_order===order)){notice='Já existe um capítulo nessa posição. Escolhe outro número.';redraw();return}if(file.size>LIMIT){notice='O limite é de 50 MB por capítulo. Divide o áudio em partes menores.';redraw();return}
const ext=(file.name.split('.').pop()||'').toLowerCase();const types={mp3:'audio/mpeg',m4a:'audio/mp4',ogg:'audio/ogg'};if(!types[ext]){notice='Escolhe um arquivo MP3, M4A ou OGG.';redraw();return}
let transcript=null;const attachment=data.get('transcript');if(attachment&&attachment.size){if(attachment.size>500000||!/[.](vtt|srt)$/i.test(attachment.name)){notice='A transcrição precisa ser um arquivo VTT ou SRT de até 500 KB.';redraw();return}transcript=await attachment.text();if(!cues(transcript).length){notice='A transcrição não contém marcações de tempo válidas.';redraw();return}}
busy=true;notice='Enviando capítulo…';redraw();const path='audiobooks/'+selected+'/'+crypto.randomUUID()+'.'+ext;const c=client();let uploaded=false;try{const sent=await c.storage.from(BUCKET).upload(path,file,{contentType:types[ext],cacheControl:'3600',upsert:false});if(sent.error)throw sent.error;uploaded=true;const b=book(selected);if(!b)throw Error('Livro não localizado');
 const coverUrl=/^https:\/\/[^\s]+$/i.test(b.cover||'')&&!/token=|signature=/i.test(b.cover||'')?b.cover:null;
 const saved=await c.from(TABLE).insert({book_key:selected,chapter_order:order,chapter_title:title,audio_path:path,transcript_vtt:transcript,created_by:user(),book_title:b.title,book_author:b.author,book_subject:b.subject||'',book_cover_url:coverUrl}).select('id,book_key,chapter_order,chapter_title,audio_path,transcript_vtt,book_title,book_author,book_subject,book_cover_url,created_at').single();if(saved.error)throw saved.error;rows.push(saved.data);formOpen=false;notice='Capítulo publicado com sucesso.'}
catch(err){if(uploaded)try{await c.storage.from(BUCKET).remove([path])}catch(_){}notice='Falha no envio: '+(err?.message||'erro de rede')}finally{busy=false;redraw()}}
async function removeChapter(id){if(!isAdmin())return;const r=rows.find(x=>x.id===id);if(!r||!window.confirm('Excluir o capítulo "'+r.chapter_title+'"?'))return;busy=true;try{if(audioKey===id)stop();const c=client();const removed=await c.from(TABLE).delete().eq('id',id);if(removed.error)throw removed.error;rows=rows.filter(x=>x.id!==id);const file=await c.storage.from(BUCKET).remove([r.audio_path]);notice=file.error?'Capítulo retirado do catálogo; arquivo pendente de limpeza.':'Capítulo excluído.';if(selectedChapter===id)selectedChapter=chapters(selected)[0]?.id||''}catch(err){notice='Erro ao excluir: '+(err?.message||'erro')}finally{busy=false;redraw()}}
document.addEventListener('click',e=>{if(!e.target.closest?.('#psbLibrary .psa-app')||!canListen())return;
const el=e.target.closest('[data-psa-open],[data-psa-back],[data-psa-chapter],[data-psa-play],[data-psa-skip],[data-psa-seek],[data-psa-toggle],[data-psa-delete],[data-psa-backhome]');
if(!el)return;e.preventDefault();
if(el.hasAttribute('data-psa-backhome')){window.uentzoulAudioGoHome?.();return;}
if(el.hasAttribute('data-psa-open'))openBook(el.dataset.psaOpen);
else if(el.hasAttribute('data-psa-back')){savePosition(true);selected='';formOpen=false;redraw()}
else if(el.hasAttribute('data-psa-chapter'))void playChapter(el.dataset.psaChapter);
else if(el.hasAttribute('data-psa-play')){const r=current()||chapters(selected)[0];if(r)void playChapter(r.id)}
else if(el.hasAttribute('data-psa-skip')){if(audioKey)player.currentTime=Math.max(0,Math.min(Number.isFinite(player.duration)?player.duration:Infinity,player.currentTime+Number(el.dataset.psaSkip)));syncPlayer()}
else if(el.hasAttribute('data-psa-seek')){const r=current();if(!r)return;const t=Number(el.dataset.psaSeek);if(audioKey===r.id){player.currentTime=t;syncPlayer()}else{void playChapter(r.id).then(()=>{if(audioKey===r.id)player.currentTime=t})}}
else if(el.hasAttribute('data-psa-toggle')&&isAdmin()){formOpen=!formOpen;redraw()}
else if(el.hasAttribute('data-psa-delete')&&isAdmin()&&!busy)void removeChapter(el.dataset.psaDelete);
});
document.addEventListener('submit',e=>{if(e.target.id!=='psaUploadForm'||!isAdmin())return;e.preventDefault();void upload(e.target)});
document.addEventListener('input',e=>{if(!canListen()||!e.target.closest?.('#psbLibrary .psa-app'))return;if(e.target.id==='psaFind'){const cursor=e.target.selectionStart;filter=e.target.value;redraw();requestAnimationFrame(()=>{const el=$('psaFind');if(el){el.focus();el.setSelectionRange(cursor,cursor)}})}else if(e.target.id==='psaTranscriptFind'){search=e.target.value;const r=current();const el=$('psaTranscriptCues');if(r&&el)el.innerHTML=cueHtml(r)}else if(e.target.id==='psaSeek'&&Number.isFinite(player.duration)&&player.duration){const t=player.duration*Number(e.target.value)/1000;const el=$('psaElapsed');if(el)el.textContent=clock(t)}});
document.addEventListener('change',e=>{if(e.target.id==='psaSeek'&&Number.isFinite(player.duration)&&player.duration){player.currentTime=player.duration*Number(e.target.value)/1000;syncPlayer()}if(e.target.id==='psaSpeed')player.playbackRate=Number(e.target.value)||1});
player.addEventListener('loadedmetadata',()=>{if(lastPosition&&Number.isFinite(player.duration))player.currentTime=Math.min(lastPosition,Math.max(0,player.duration-2));lastPosition=0;syncPlayer()});
player.addEventListener('play',()=>{const podcast=$('audioPlayer');if(podcast&&!podcast.paused)podcast.pause();syncPlayer()});
for(const name of ['pause','timeupdate','durationchange','ratechange','seeking'])player.addEventListener(name,()=>{if(name==='timeupdate')savePosition(false);syncPlayer()});
player.addEventListener('ended',()=>{savePosition(true);const idx=chapters(rows.find(r=>r.id===audioKey)?.book_key).findIndex(r=>r.id===audioKey),list=chapters(rows.find(r=>r.id===audioKey)?.book_key);if(list[idx+1])void playChapter(list[idx+1].id);else syncPlayer()});
window.addEventListener('uentzoul:auth',()=>{if(!canListen()||owner&&owner!==user()){stop();rows=[];owner='';loaded=false;selected='';filter='';notice=''}});
window.addEventListener('pagehide',()=>savePosition(true));
let mini=null,miniRefreshFrame=0;
function miniMarkup(){
 return '<div class="psa-mini-art" aria-hidden="true">♫</div><div class="psa-mini-main"><span class="psa-mini-label">AUDIOBOOK</span><strong id="psaMiniTitle">Livro narrado</strong><span id="psaMiniChapter">Capítulo</span><div class="psa-mini-progress"><span id="psaMiniElapsed">0:00</span><input id="psaMiniSeek" type="range" min="0" max="1000" value="0" aria-label="Posição do audiobook"><span id="psaMiniDuration">--:--</span></div></div><div class="psa-mini-buttons"><button data-psa-mini-back type="button" aria-label="Voltar dez segundos">−10</button><button data-psa-mini-play type="button" aria-label="Reproduzir audiobook">▶</button><button data-psa-mini-forward type="button" aria-label="Avançar dez segundos">+10</button><button data-psa-mini-close type="button" aria-label="Fechar miniplayer do audiobook">×</button></div>';
}
function buildMini(){
 if(mini||!document.body)return;
 mini=document.createElement('aside');mini.id='psaMini';mini.className='psa-mini';mini.setAttribute('aria-label','Miniplayer de audiobook');mini.setAttribute('role','region');mini.hidden=true;mini.innerHTML=miniMarkup();document.body.appendChild(mini);
 mini.addEventListener('click',e=>{
  if(e.target.closest('[data-psa-mini-close]')){stop();refreshMini();return}
  if(e.target.closest('[data-psa-mini-play]')){if(audioKey){if(player.paused)void player.play().catch(showPlayError);else player.pause()}return}
  if(e.target.closest('[data-psa-mini-back]')){player.currentTime=Math.max(0,player.currentTime-10);syncPlayer();return}
  if(e.target.closest('[data-psa-mini-forward]')){player.currentTime=Math.min(Number.isFinite(player.duration)?player.duration:Infinity,player.currentTime+10);syncPlayer();return}
 });
 mini.querySelector('#psaMiniSeek').addEventListener('change',e=>{
  if(Number.isFinite(player.duration)&&player.duration>0){player.currentTime=player.duration*Number(e.target.value)/1000;syncPlayer()}
 });
 const main=document.querySelector('#main');
 if(main)new MutationObserver(()=>{
  if(!miniRefreshFrame)miniRefreshFrame=requestAnimationFrame(()=>{miniRefreshFrame=0;refreshMini()});
 }).observe(main,{childList:true,subtree:true});
}
function refreshMini(){
 if(!mini)return;
 const r=rows.find(x=>x.id===audioKey);
 const visible=canListen()&&!!r&&!!player.src&&!document.querySelector('#psbLibrary .psa-player');
 mini.hidden=!visible;
 if(!visible)return;
 const b=book(r.book_key),dur=Number.isFinite(player.duration)&&player.duration>0?player.duration:0;
 mini.querySelector('#psaMiniTitle').textContent=b?.title||'Audiobook';
 mini.querySelector('#psaMiniChapter').textContent=r.chapter_title;
 mini.querySelector('#psaMiniElapsed').textContent=clock(player.currentTime);
 mini.querySelector('#psaMiniDuration').textContent=dur?clock(dur):'--:--';
 const seek=mini.querySelector('#psaMiniSeek');seek.disabled=!dur;
 if(document.activeElement!==seek)seek.value=dur?String(Math.round(player.currentTime/dur*1000)):'0';
 const button=mini.querySelector('[data-psa-mini-play]');button.textContent=player.paused?'▶':'Ⅱ';button.setAttribute('aria-label',player.paused?'Reproduzir audiobook':'Pausar audiobook');
}
document.addEventListener('play',e=>{if(e.target?.id==='audioPlayer'&&!player.paused)player.pause()},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',buildMini,{once:true});else buildMini();
window.PSICO_AUDIO_LIBRARY={render,afterRender,stop,hasRecording:key=>chapters(key).length>0};
})();