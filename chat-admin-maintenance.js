/* PsicoMoodle — anotações de manutenção, só do administrador. */
(function(){
'use strict';
if(window.__pmMaintChatLoaded||!window.uentzoulMessenger||typeof dm==='undefined')return;
window.__pmMaintChatLoaded=true;
const st=document.createElement('style');st.id='pm-maintenance-style';st.textContent="\n.dm-shell{min-width:0;box-sizing:border-box;overflow:hidden}\n.dm-shell .dm-list,.dm-shell .dm-main{min-width:0;min-height:0}\n.dm-shell .dm-list-head{display:flex;align-items:center;justify-content:space-between;gap:8px}\n.dm-shell .dm-list-actions{display:flex;align-items:center;gap:6px}\n.dm-shell .dm-soft-button,.dm-shell .dm-head-action{display:inline-flex;align-items:center;justify-content:center;min-height:35px;min-width:35px;gap:5px;padding:6px 10px;border:1px solid var(--line);border-radius:9px;background:var(--soft);color:var(--ink);font-size:12px;font-weight:700;cursor:pointer}\n.dm-shell .dm-contact{min-width:0;border-radius:11px}\n.dm-shell .dm-contact-open{min-width:0;width:100%}\n.dm-shell .dm-contact-text{min-width:0}\n.dm-shell .dm-contacts{min-height:0;overflow-y:auto;overscroll-behavior:contain}\n.dm-shell .dm-chat-head,.dm-shell .dm-chat-head-main{min-width:0}\n.dm-shell .dm-composer-wrap{position:relative}\n.dm-shell .dm-tools-menu{z-index:75}\n.dm-shell .dm-message-popup{z-index:85}\n.pm-maintenance-contact{margin:3px 3px 10px!important;border:1px solid #d9cdef!important;background:#f6f2ff!important}\n.pm-maintenance-contact.selected{background:#eae2ff!important}\n.pm-maintenance-contact .dm-contact-open{gap:9px;padding:9px!important;align-items:center}\n.pm-maintenance-icon{display:grid;place-items:center;width:42px;height:42px;flex:0 0 42px;border-radius:12px;background:#e4dafa;color:#62489e;font-size:23px}\n.pm-maintenance-icon.small{width:36px;height:36px;flex-basis:36px;font-size:19px}\n.pm-maintenance-contact strong{color:#63499f}\n.pm-maintenance-lock{margin-left:auto;font-size:14px}\n.pm-maintenance-shell .dm-chat-head{display:flex;align-items:center;gap:9px}\n.pm-maintenance-heading{min-width:0;flex:1}\n.pm-maintenance-heading strong,.pm-maintenance-heading small{display:block;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}\n.pm-maintenance-private{font-size:10px;border-radius:99px;border:1px solid #d7c8eb;color:#644c9e;padding:5px 9px;background:#f4efff}\n.pm-maintenance-thread{display:flex;flex-direction:column;gap:7px}\n.pm-maintenance-thread .pm-maintenance-message .dm-message-bubble{max-width:min(80%,560px);overflow-wrap:anywhere}\n.pm-maintenance-delete{border:0;background:transparent;color:inherit;text-decoration:underline;font-size:10px;cursor:pointer;opacity:.75}\n.pm-maintenance-composer .dm-composer{display:flex;align-items:center;gap:8px}\n.pm-maintenance-composer .dm-composer textarea{box-sizing:border-box;min-width:0;flex:1;width:100%;min-height:45px;padding:11px;resize:vertical;font-size:14px}\n.pm-maintenance-composer .dm-send-button{flex:0 0 43px}\n.pm-maintenance-hint{display:block;color:var(--muted);font-size:10px;margin:6px 5px 0}\nhtml[data-theme=dark] .pm-maintenance-contact{background:#332b46!important;border-color:#66567e!important}\nhtml[data-theme=dark] .pm-maintenance-contact strong{color:#dccafa}\nhtml[data-theme=dark] .pm-maintenance-icon{background:#47345f;color:#eadbff}\nhtml[data-theme=dark] .pm-maintenance-private{background:#403050;border-color:#725d88;color:#e0ccfb}\n@media(max-width:760px){\n.dm-shell .dm-list-head{padding:12px!important}\n.dm-shell .dm-contacts{padding:4px 8px 12px!important}\n.dm-shell .dm-head-action{padding:6px 9px;min-height:33px;font-size:11px}\n.dm-shell .dm-composer-wrap .dm-composer{grid-template-columns:repeat(5,minmax(0,1fr))!important;grid-template-rows:auto 42px!important}\n.dm-shell .dm-composer-wrap .dm-composer textarea{grid-column:1/-1!important;grid-row:1!important}\n.dm-shell .dm-composer-wrap .dm-composer>[data-dmw-emoji]{grid-column:1!important;grid-row:2!important}\n.dm-shell .dm-composer-wrap .dm-composer>[data-dmv-share-open]{grid-column:2!important;grid-row:2!important}\n.dm-shell .dm-composer-wrap .dm-composer>[data-dmw-tools]{grid-column:3!important;grid-row:2!important}\n.dm-shell .dm-composer-wrap .dm-composer>[data-dmw-record]{grid-column:4!important;grid-row:2!important}\n.dm-shell .dm-composer-wrap .dm-composer>.dm-send-button{grid-column:5!important;grid-row:2!important}\n.dm-shell .pm-maintenance-composer .dm-composer{display:grid!important;grid-template-columns:minmax(0,1fr) 43px!important;grid-template-rows:auto!important;gap:6px!important}\n.dm-shell .pm-maintenance-composer .dm-composer textarea{grid-column:1!important;grid-row:1!important}\n.dm-shell .pm-maintenance-composer .dm-composer .dm-send-button{grid-column:2!important;grid-row:1!important}\n.pm-maintenance-shell .pm-maintenance-private{font-size:9px;padding:4px 6px}\n.pm-maintenance-thread .pm-maintenance-message .dm-message-bubble{max-width:90%}\n}\n@media(max-width:360px){.pm-maintenance-private,.pm-group-label{display:none}}\n";document.head.appendChild(st);
const memo={id:null,rows:[],draft:'',loading:false,loaded:false,saving:false,error:''};
const auth=()=>!!(onlineUser&&dm.isAdmin&&dm.owner===onlineUser.id);
const active=()=>auth()&&dm.tab==='maintenance';
const reset=()=>{memo.id=null;memo.rows=[];memo.draft='';memo.loaded=false;memo.loading=false;memo.saving=false;memo.error=''};
const contactBefore=dmContactRows;
dmContactRows=function(){
 const rows=contactBefore();
 if(!auth())return rows;
 const q=String(dm.search||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 if(q&&!('chat manutencao anotacoes administrador privado'.includes(q)))return rows;
 return '<div class="dm-contact pm-maintenance-contact '+(active()?'selected':'')+'"><button type="button" class="dm-contact-open" data-pm-maintenance-open aria-label="Abrir chat de manutenção">'+
 '<span class="pm-maintenance-icon" aria-hidden="true">✎</span><span class="dm-contact-text"><strong>Chat de Manutenção</strong><small>Conversa privada · somente você</small></span><span class="pm-maintenance-lock" aria-hidden="true">🔒</span></button></div>'+rows;
};
function messages(){
 if(memo.loading&&!memo.loaded)return '<div class="dm-chat-empty"><h3>Carregando anotações…</h3></div>';
 if(memo.error&&!memo.loaded)return '<div class="dm-chat-empty"><h3>Não foi possível carregar</h3><p>'+esc(memo.error)+'</p><button data-pm-maintenance-retry>Tentar novamente</button></div>';
 if(!memo.rows.length)return '<div class="dm-chat-empty"><span>✎</span><h3>Seu chat de manutenção</h3><p>Escreva mensagens para você mesmo. Somente o administrador poderá ler.</p></div>';
 let day='',html='';
 for(const n of memo.rows){
  const key=dmDateKey(n.created_at);
  if(day!==key){day=key;html+='<div class="dm-day"><span>'+esc(dmDateLabel(n.created_at))+'</span></div>'}
  html+='<div class="dm-message mine pm-maintenance-message"><div class="dm-message-bubble"><p class="dm-text-message">'+esc(n.body).replace(/\n/g,'<br>')+'</p>'+
  '<div class="dm-message-info"><time datetime="'+esc(n.created_at)+'">'+esc(dmTime(n.created_at))+'</time><button type="button" class="pm-maintenance-delete" data-pm-maintenance-delete="'+esc(n.id)+'">Excluir</button></div></div></div>';
 }
 return html;
}
function notesPage(){
 const who=esc(dmPrettyPerson(dm.owner).display_name||'Administrador');
 return '<section class="dm-shell has-conversation pm-maintenance-shell"><div class="dm-list">'+
 '<header class="dm-list-head"><div><h1>Mensagens</h1><p>Conversas e grupos</p></div></header>'+
 '<label class="dm-search-label"><input id="dmUserSearch" type="search" placeholder="Pesquisar conversas" value="'+esc(dm.search)+'"></label>'+
 '<div class="dm-contacts" id="dmContacts">'+dmContactRows()+'</div></div><div class="dm-main">'+
 '<header class="dm-chat-head"><button type="button" class="dm-back" data-pm-maintenance-back>‹ Voltar</button>'+
 '<span class="pm-maintenance-icon small" aria-hidden="true">✎</span><span class="dm-chat-head-main pm-maintenance-heading"><strong>Chat de Manutenção</strong><small>Conversa pessoal de '+who+'</small></span>'+
 '<span class="pm-maintenance-private">Privado</span></header>'+
 '<div class="dm-messages pm-maintenance-thread" id="dmMessages">'+messages()+'</div>'+
 '<form id="pmMaintenanceForm" class="dm-composer-wrap pm-maintenance-composer"><div class="dm-composer">'+
 '<textarea id="pmMaintenanceText" rows="2" maxlength="3000" placeholder="Escreva uma anotação de manutenção…">'+esc(memo.draft)+'</textarea>'+
 '<button type="submit" class="dm-send-button" aria-label="Salvar anotação" '+(memo.saving?'disabled':'')+'>➤</button></div>'+
 '<small class="pm-maintenance-hint">Anotações visíveis apenas para sua conta de administrador.</small></form></div></section>';
}
const beforeRender=dmRender;
dmRender=function(){
 if(active())return notesPage();
 return beforeRender()
 .replace('title="Criar grupo" data-dm-new-group>＋</button>','title="Criar grupo" aria-label="Criar grupo" data-dm-new-group>＋ <span class="pm-group-label">Grupo</span></button>')
 .replace('data-dmw-reports title="Relatos">⚑</button>','data-dmw-reports title="Relatos de erros" aria-label="Relatos de erros">Relatos</button>')
 .replace('data-dmw-wallpaper title="Fundo da conversa">⋯</button>','data-dmw-wallpaper title="Escolher fundo" aria-label="Escolher fundo">Fundo</button>');
};
window.uentzoulMessenger.render=dmRender;
async function load(){
 if(!auth()||memo.loading)return;
 const id=onlineUser.id;
 if(memo.id!==id)reset();
 memo.id=id;memo.loading=true;memo.error='';if(active())dmShow();
 try{
  const r=await client.from('uentzoul_admin_notes').select('id,body,created_at,user_id').eq('user_id',id).order('created_at',{ascending:true}).limit(500);
  if(r.error)throw r.error;
  if(!auth()||onlineUser.id!==id)return;
  memo.rows=r.data||[];memo.loaded=true;
 }catch(e){memo.error=e?.message||'Não foi possível carregar as anotações.'}
 finally{memo.loading=false;if(active())dmShow()}
}
async function send(){
 if(!auth()||memo.saving)return;
 const body=String(document.getElementById('pmMaintenanceText')?.value??memo.draft).trim();
 if(!body||body.length>3000)return;
 const id=onlineUser.id;memo.saving=true;memo.draft=body;
 try{
  const r=await client.from('uentzoul_admin_notes').insert({user_id:id,body}).select('id,body,created_at,user_id').single();
  if(r.error)throw r.error;
  if(onlineUser?.id!==id)return;
  memo.rows.push(r.data);memo.loaded=true;memo.draft='';memo.error='';dmShow();
  document.getElementById('pmMaintenanceText')?.focus({preventScroll:true});
 }catch(e){toast(e?.message||'Não foi possível salvar a anotação.')}
 finally{memo.saving=false;if(active())dmShow()}
}
async function erase(id){
 if(!auth()||!dmValid(id))return;
 const r=await client.from('uentzoul_admin_notes').delete().eq('user_id',onlineUser.id).eq('id',id);
 if(r.error){toast('Não foi possível apagar a anotação.');return}
 memo.rows=memo.rows.filter(x=>x.id!==id);dmShow();
}
document.addEventListener('click',function(e){
 const open=e.target.closest('[data-pm-maintenance-open]');
 if(open){
  e.preventDefault();e.stopImmediatePropagation();
  if(!auth())return;
  dm.tab='maintenance';dm.peerId=null;dm.roomId=null;dm.search='';dm.draft='';dm.mediaFile=null;
  dmW.panel=null;dmW.popup=null;dmW.menu=null;dmW.reply=null;
  dmShow();load();return;
 }
 if(e.target.closest('[data-pm-maintenance-back]')){e.preventDefault();e.stopImmediatePropagation();dmWOpen('private',null);return}
 if(e.target.closest('[data-pm-maintenance-retry]')){e.preventDefault();e.stopImmediatePropagation();load();return}
 const del=e.target.closest('[data-pm-maintenance-delete]');
 if(del){e.preventDefault();e.stopImmediatePropagation();if(confirm('Apagar esta anotação?'))erase(del.dataset.pmMaintenanceDelete)}
},true);
document.addEventListener('input',e=>{if(e.target?.id==='pmMaintenanceText')memo.draft=e.target.value});
document.addEventListener('keydown',e=>{if(e.target?.id==='pmMaintenanceText'&&e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();send()}});
document.addEventListener('submit',e=>{if(e.target?.id==='pmMaintenanceForm'){e.preventDefault();e.stopImmediatePropagation();send()}},true);
const previousLogout=dmOnLogout;
dmOnLogout=function(){reset();previousLogout()};
window.uentzoulMessenger.onLogout=dmOnLogout;
})();