/* Caderno de aula — privado por conta e sincronizado com o Supabase.
   A cópia local permite recuperar alterações quando não há conexão. */
(function(){
'use strict';
const root=document.getElementById('nbRoot');
// Bloqueio de telefones também para acesso direto ao endereço do Caderno.
function isNotebookPhone(){
 try{
  if(window.parent!==window&&typeof window.parent.PSICO_NOTEBOOK_IS_PHONE==='function')
   return window.parent.PSICO_NOTEBOOK_IS_PHONE();
 }catch(_){}
 const ua=String(navigator.userAgent||''),platform=String(navigator.platform||'');
 const touches=Number(navigator.maxTouchPoints)||0;
 const shortSide=Math.min(screen.width||0,screen.height||0);
 if(/iPhone|iPod|Windows Phone|IEMobile/i.test(ua))return true;
 if(/iPad|Tablet|Kindle|Silk|PlayBook|Nexus 7|Nexus 10/i.test(ua)||
  (/Android/i.test(ua)&&!/Mobile/i.test(ua)))return false;
 if(navigator.userAgentData?.mobile===true)return true;
 if(/MacIntel|Macintosh/i.test(platform+' '+ua)&&touches>1)
  return shortSide>0&&shortSide<600;
 if(/Android[^)]*Mobile|Mobile/i.test(ua))return true;
 if(navigator.userAgentData?.mobile===true)return true;
 return !!(window.matchMedia?.('(pointer: coarse)')?.matches&&touches>0&&shortSide>0&&shortSide<600);
}
if(isNotebookPhone()){
 root.className='nb-guard';
 root.innerHTML='<section role="status"><strong>Caderno indisponível no celular.</strong>'+
  '<p>Para usar os cadernos e editar suas anotações, acesse pelo computador ou tablet.</p></section>';
 return;
}
// Caderno reservado a contas registradas; o banco também aplica RLS por usuário.
let userId='';
try{
 const user=window.parent!==window?window.parent.uentzoulAIAuth?.user?.():null;
 if(user?.id&&user.is_anonymous!==true)userId=String(user.id);
}catch(_){}
if(!userId){
 root.className='nb-guard';
 root.innerHTML='<section role="status"><strong>Entre na sua conta.</strong>'+
  '<p>Para abrir e salvar seus cadernos é necessário entrar ou criar uma conta no PsicoMoodle.</p></section>';
 return;
}
const W=780,H=1240,L=34,START=28,ROWS=30,FIRST_LINE=3,BINDER_SAFE=58;
// Cada semestre tem seu catálogo e seu armazenamento. O 2026/2 conserva a chave
// original para manter intactas todas as anotações já existentes.
const SEMESTERS={
 '2026/1':[
  {id:'materia-2026-1-profissao',name:'Psicologia como Profissão',color:'#6577b2'},
  {id:'materia-2026-1-processos',name:'Processos Psicológicos Básicos',color:'#44877e'},
  {id:'materia-2026-1-direitos',name:'Psicologia e Direitos Humanos',color:'#af7181'},
  {id:'materia-2026-1-epistemologia',name:'Fundamentos Epistemológicos em Psicologia',color:'#a48755'},
  {id:'materia-2026-1-historia',name:'História da Psicologia',color:'#786fba'},
  {id:'materia-2026-1-sociocognitivas',name:'Teorias Sociocognitivas',color:'#9370a7'},
  {id:'materia-2026-1-desenvolvimento',name:'Psicologia do Desenvolvimento (Ciclo Vital)',color:'#4c87aa'}
 ],
 '2026/2':[
  {id:'materia-familia',name:'Psicologia da Família',color:'#946b79'},
  {id:'materia-avaliacao',name:'Avaliação Psicológica',color:'#567f88'},
  {id:'materia-tcc',name:'Teorias e Modelos Comportamentais e Cognitivos',color:'#6876a0'},
  {id:'materia-social',name:'Psicologia Social I',color:'#99815e'},
  {id:'materia-metapsicologia',name:'Metapsicologia',color:'#79689b'},
  {id:'materia-grupos',name:'Psicologia de Grupos',color:'#65856f'}
 ],
 '2027/1':[
  {id:'materia-2027-1-inteligencia',name:'Avaliação Psicológica: Inteligência e Funções Cognitivas',color:'#6577b2'},
  {id:'materia-2027-1-basesbiologicas',name:'Bases Biológicas do Comportamento Humano',color:'#44877e'},
  {id:'materia-2027-1-psicopatologia',name:'Concepções em Psicopatologia',color:'#af7181'},
  {id:'materia-2027-1-observacao',name:'Fundamentos e Técnicas em Observação e Entrevista',color:'#a48755'},
  {id:'materia-2027-1-grupos2',name:'Psicologia dos Grupos II',color:'#786fba'},
  {id:'materia-2027-1-psiquismo',name:'Psiquismo e Subjetividade em Psicanálise',color:'#9370a7'},
  {id:'materia-2027-1-escolar',name:'Psicologia Escolar e da Educação I',color:'#4c87aa'},
  {id:'materia-2027-1-etica',name:'Ética e Legislação em Psicologia',color:'#569270'}
 ]
};
function selectedSemester(){
 let value=new URLSearchParams(location.search).get('semester');
 if(!value)try{
  value=window.parent.uentzoulProfileBridge?.semester?.()||
   window.parent.uentzoulLibraryApp?.semester?.();
 }catch(_){}
 return Object.hasOwn(SEMESTERS,value)?value:'2026/2';
}
const SEMESTER=selectedSemester();
const SEMESTER_LABEL={'2026/1':'1º semestre','2026/2':'2º semestre','2027/1':'3º semestre'}[SEMESTER];
const STORE=SEMESTER==='2026/2'?'uentzoul:caderno:alpha2:'+userId:
 'psicomoodle:caderno:'+SEMESTER+':alpha1:'+userId;
const STAMP_KEY=STORE+':modified';
const LEGACY_STORE='uentzoul:caderno:alpha1:'+userId;
const BACKUP_STORE=SEMESTER==='2026/2'?
 'psicomoodle:caderno:backup-antes-das-seis-materias:'+userId:
 'psicomoodle:caderno:'+SEMESTER+':backup:'+userId;
const GRAMMAR_REVIEW_VERSION='20261116-grammar-v2';
const GRAMMAR_BACKUP_KEY=STORE+':backup-before-grammar-20261116';
const SUBJECT_BOOKS=SEMESTERS[SEMESTER];
const initialBooks=()=>SUBJECT_BOOKS.map(b=>({...b,pages:[]}));
const bookColor=b=>{
 const predefined=SUBJECT_BOOKS.find(x=>x.id===b.id);
 const color=predefined?.color||b?.color||'#79689b';
 return /^#[0-9a-fA-F]{6}$/.test(color)?color:'#79689b';
};

const COLORS={black:'#24242e',blue:'#213f72',red:'#bb3d43'};
const MODES=['none','text','select','draw','erase','sticky','warp'];
const ACTIONS=[
 ['none','Mover folha / nenhuma seleção'],['text','Escrever'],['select','Selecionar'],['draw','Desenhar'],['erase','Borracha'],['sticky','Post-it'],['warp','Moldar'],
 ['black','Caneta preta'],['blue','Caneta azul'],['red','Caneta vermelha'],
 ['print','Letra de forma 1'],['cursive','Letra de forma 2'],['joined','Letra cursiva conectada'],
 ['bullets','Lista com marcadores'],['numbered','Lista numerada'],
 ['prev','Página anterior'],['next','Próxima página'],['zoomIn','Aproximar'],['zoomOut','Afastar'],
 ['smooth','Alternar ajuste do traço']
];
const emptyPage=()=>({title:'',date:'',notes:[],strokes:[],stickies:[]});
const newBook=(name='Meu caderno')=>({id:'book-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),name,pages:[]});
const defaults=()=>({books:initialBooks(),bookId:SUBJECT_BOOKS[0].id,page:0,mode:'none',font:'print',ink:'blue',size:1,align:'left',listStyle:'none',layout:'single',smooth:false,zoom:.88,shortcuts:{},stickyTone:'yellow',eraserMode:'parts',eraserRadius:14});
const hasPageContent=p=>!!(String(p?.date||'').trim()||p?.notes?.some(n=>String(n.text||'').trim())||p?.strokes?.some(s=>s.points?.length)||p?.stickies?.length);
const cleanPage=p=>({title:String(p?.title||'').slice(0,100),date:String(p?.date||'').slice(0,16),
 notes:Array.isArray(p?.notes)?p.notes.slice(0,140).map(n=>{const {original,...corrected}=n;corrected.pending=false;return corrected;}):[],strokes:Array.isArray(p?.strokes)?p.strokes.slice(0,500):[],
 stickies:Array.isArray(p?.stickies)?p.stickies.slice(0,40):[]});
let data=defaults(),stored=null;
try{stored=JSON.parse(localStorage.getItem(STORE)||'null');}catch(_){}
if(!stored&&SEMESTER==='2026/2')try{
 const legacy=JSON.parse(localStorage.getItem(LEGACY_STORE)||'null');
 if(legacy&&Array.isArray(legacy.pages))stored={...legacy,books:[{id:'book-original',name:'Meu caderno',pages:legacy.pages}],bookId:'book-original'};
}catch(_){}
if(stored&&typeof stored==='object'){
 const books=(Array.isArray(stored.books)?stored.books.slice(0,50):[])
 .filter(b=>b&&typeof b==='object').map(b=>({id:String(b.id||newBook().id),name:String(b.name||'Sem título').slice(0,70),
 pages:(Array.isArray(b.pages)?b.pages.slice(0,250):[]).map(cleanPage)}));
 if(books.length){
  data={...defaults(),...stored,books};
  for(const b of data.books)while(b.pages.length&&!hasPageContent(b.pages[b.pages.length-1]))b.pages.pop();
  if(!data.books.some(b=>b.id===data.bookId))data.bookId=data.books[0].id;
  data.page=Math.min(data.books.find(b=>b.id===data.bookId).pages.length,Math.max(0,Number(data.page)||0));
  data.zoom=Math.min(2.3,Math.max(.42,Number(data.zoom)||.88));
  data.size=1; // O editor permite somente a altura de uma pauta.
  if(!MODES.includes(data.mode))data.mode='none';
  if(!COLORS[data.ink])data.ink='blue';
  if(!['print','cursive','joined'].includes(data.font))data.font='print';
   if(!['left','center','right','justify'].includes(data.align))data.align='left';
  if(!['none','bullets','numbered'].includes(data.listStyle))data.listStyle='none';
  if(!data.shortcuts||typeof data.shortcuts!=='object')data.shortcuts={};
  if(!['single','book'].includes(data.layout))data.layout='single';
 }
}
// Migração ÚNICA: substitui os cadernos visíveis por seis matérias, com backup
// do estado anterior. Em caso de falta de espaço, não descartar dados antigos.
if(!stored?.curriculumSeeded){
 let backedUp=true;
 const hasOldContent=!!stored?.books?.some(b=>b.pages?.some(p=>hasPageContent(p))||
  (b.name&&b.name!=='Meu caderno'));
 if(hasOldContent){
  try{
   if(!localStorage.getItem(BACKUP_STORE))
    localStorage.setItem(BACKUP_STORE,JSON.stringify(stored));
  }catch(_){backedUp=false}
 }
 if(backedUp){
  const settings={font:data.font,ink:data.ink,size:data.size,zoom:data.zoom,
   layout:data.layout,shortcuts:data.shortcuts,smooth:data.smooth};
  data={...defaults(),...settings,curriculumSeeded:true};
  try{localStorage.setItem(STORE,JSON.stringify(data))}catch(_){}
 }
}
const activeBook=()=>data.books.find(b=>b.id===data.bookId)||data.books[0];
data.pages=activeBook().pages;
data.mode='none'; // Ao abrir, nenhuma ferramenta atua na folha até o usuário escolher.
if(!stored?.smoothingV3){data.smooth=true;data.smoothingV3=true;}
let pendingPage=emptyPage(),galleryOpen=false,drawerOpen=false,galleryOffset=0,railOpen=!window.matchMedia('(max-width:760px)').matches;
let shelfOpen=true,editEnabled=false;
let panOffset={x:0,y:0},suppressLeafClickUntil=0,opposingStrokePointer=null;
let selected=null,contextTarget=null,panDrag=null,lastPointer=null,toolPaletteOpen=false,eraseDrag=null,moveDrag=null,resizeDrag=null;
function materializePage(){
 if(data.page<data.pages.length||!hasPageContent(pendingPage))return;
 if(data.page>=250)return;
 // Permite escrever primeiro na direita sem renumerá-la como esquerda.
 // Folhas vazias intermediárias fazem parte da sequência real do caderno.
 while(data.pages.length<data.page)data.pages.push(emptyPage());
 data.pages.push(pendingPage);pendingPage=emptyPage();
}
function serializable(){
 materializePage();
 for(const book of data.books){
  const cleaned=(book.pages||[]).slice(); // Manter notas pendentes até a IA concluir a revisão.
  // Não manter folhas vazias NO FIM, mas nunca apagar uma folha esquerda
  // vazia caso a folha direita do mesmo par já tenha conteúdo.
  while(cleaned.length&&!hasPageContent(cleaned[cleaned.length-1]))cleaned.pop();
  if(book.id===data.bookId){
   // Em folha dupla, a direita pode estar selecionada, mas ainda não materializada.
   // Checkpoint (Ctrl+Z) não pode renumerá-la como esquerda antes de desenhar.
   const pendingRight=data.layout==='book'&&editEnabled?1:0;
   data.page=Math.min(cleaned.length+pendingRight,Math.max(0,data.page));
   data.pages=cleaned;
  }
  book.pages=cleaned;
 }
 return {...data,pages:undefined};
}
function restoreState(serialized){
 data={...defaults(),...JSON.parse(serialized)};
 if(!Array.isArray(data.books)||!data.books.length)data.books=defaults().books;
 if(!data.books.some(b=>b.id===data.bookId))data.bookId=data.books[0].id;
 data.pages=activeBook().pages;pendingPage=emptyPage();
}
let crossLineUndoReady=false;
let editing=null, previewText='',drawPoints=null,warpDrag=null,stickyDrag=null,selectedStroke=-1,tapCandidate=null;
let grammarRunning=false,grammarPaused=false,grammarDone=0,grammarTotal=0;
const grammarAttempted=new Set(),grammarInFlight=new Set();
let formatMenuOpen='',formatPointerActive=false;
let undoStack=[],redoStack=[],listening='',pinch=null,saveTimer=null,flipping=false;
let localStamp=0;
try{localStamp=Math.max(0,Number(localStorage.getItem(STAMP_KEY))||0)}catch(_){}
let cloudReady=false,cloudBusy=false,cloudDirty=false,cloudLoading=false,cloudTimer=null,retryTimer=null;
let lastContentSignature=JSON.stringify(data.books);
const notebookClient=()=>{
 try{const a=window.parent.uentzoulAIAuth,u=a?.user?.();
  return u?.id===userId&&u?.is_anonymous!==true?a?.client?.():null;}catch(_){return null}
};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const page=()=>data.pages[data.page]||pendingPage;
const id=()=>typeof crypto.randomUUID==='function'?crypto.randomUUID():'nb-'+Date.now()+'-'+Math.random().toString(36).slice(2);
const isMobile=()=>window.matchMedia('(max-width:760px)').matches;
function notesNeedingGrammar(){
 return data.books.flatMap(book=>(book.pages||[]).flatMap(p=>(p.notes||[])))
  .filter(n=>n&&String(n.text||'').trim()&&n.grammarReviewVersion!==GRAMMAR_REVIEW_VERSION);
}
function updateGrammarProgress(){
 const progress=$('nbGrammarProgress'),button=$('nbGrammarRetry');
 const remaining=notesNeedingGrammar().length;
 if(button){
  button.hidden=!remaining&&!grammarRunning;
  button.disabled=grammarRunning||!cloudReady;
  button.textContent=grammarRunning?'Revisando '+grammarDone+'/'+grammarTotal+'…':
   (grammarPaused?'Retomar revisão ('+remaining+')':'Revisar anotações ('+remaining+')');
 }
 if(progress){
  progress.textContent=grammarRunning?'Gramática: '+grammarDone+' de '+grammarTotal:
   grammarPaused?'Revisão pausada · '+remaining+' pendentes':
   remaining?'Revisão disponível para '+remaining+' anotações':'Gramática em dia';
 }
}
function renderShelf(){
 const host=$('nbShelf');if(!host)return;
 host.innerHTML='<div class="nb-shelf-tutorial-bar"><span id="nbGrammarProgress" class="nb-grammar-progress" role="status" aria-live="polite"></span>'+
  '<button type="button" id="nbGrammarRetry" class="nb-shelf-tutorial-button nb-grammar-retry" data-nb-grammar-retry>Revisar anotações</button>'+
  '<button type="button" class="nb-shelf-tutorial-button" data-nb-import>Importar caderno (JSON)</button>'+
  '<button type="button" class="nb-shelf-tutorial-button" data-nb-tour-start aria-label="Abrir tutorial do Caderno">ⓘ Tutorial</button></div>'+
  '<div class="nb-shelf-heading"><span class="nb-shelf-eyebrow">PSICOMOODLE · '+SEMESTER_LABEL.toUpperCase()+'</span>'+
  '<h2>Meus cadernos</h2><p>Escolhe uma matéria para abrir o caderno e folhear suas páginas. Anotações sincronizadas com a sua conta.</p></div>'+
  '<div class="nb-shelf-grid">'+data.books.map((book,i)=>
   '<button class="nb-shelf-book" data-nb-shelf-book="'+esc(book.id)+'" aria-label="Abrir '+esc(book.name)+'">'+
    '<span class="nb-shelf-cover" style="--nb-book-cover:'+bookColor(book)+'" data-cover="'+i%6+'">'+
     '<span class="nb-shelf-spine" aria-hidden="true"></span><span class="nb-shelf-cover-border" aria-hidden="true"></span>'+
     '<span class="nb-shelf-title">'+esc(book.name)+'</span>'+
     '<span class="nb-shelf-mark">PSICOMOODLE</span></span>'+
    '<span class="nb-shelf-book-meta"><strong>'+esc(book.name)+'</strong><small>'+book.pages.length+
     (book.pages.length===1?' folha salva':' folhas salvas')+'</small></span></button>'
  ).join('')+'</div>';
 updateGrammarProgress();
 requestAnimationFrame(fitCoverTitles);
}
function syncNotebookUI(){
 const writtenDate=String(page().date||'');
 const readDate=$('nbPaperDateRead');
 if(readDate){readDate.hidden=!writtenDate;readDate.textContent=writtenDate?new Date(writtenDate+'T12:00:00').toLocaleDateString('pt-BR'):'';}
 $('nbPaperDate')?.closest('.nb-paper-date-group')?.classList.toggle('nb-has-date',!!writtenDate);
 root.classList.toggle('nb-shelf-active',shelfOpen);
 root.classList.toggle('nb-reading',!shelfOpen&&!editEnabled);
 root.classList.toggle('nb-editing',!shelfOpen&&editEnabled);
 $('nbShelf').hidden=!shelfOpen;
 $('nbWorkspace').hidden=shelfOpen;
 $('nbTools').hidden=shelfOpen||!editEnabled;
 root.querySelector('.nb-page-control').hidden=shelfOpen||galleryOpen;
 $('nbEditToggle').hidden=shelfOpen;
 $('nbEditToggle').textContent=editEnabled?'✓ Concluir edição':'✎ Editar';
 $('nbEditToggle').setAttribute('aria-pressed',String(editEnabled));
 $('nbPaperDate').disabled=!editEnabled;
 sheet.dataset.mode=editEnabled?data.mode:'none';
 for(const el of root.querySelectorAll('#nbStickyLayer textarea'))el.readOnly=!editEnabled;
}
function setEditEnabled(value){
 if(shelfOpen)return;
 if(!value&&editing)saveEditor(false);
 closeFormatMenus();
 editEnabled=!!value;
 data.mode='none';selected=null;selectedStroke=-1;toolPaletteOpen=false;
 $('nbLineHover').hidden=true;$('nbCompanionLineHover')?.setAttribute('hidden','');$('nbContextMenu').hidden=true;
 refreshTools();renderNotes();renderStickies();drawCanvas();renderSelectionHandles();
 renderStickyPalette();syncNotebookUI();
 if(!editEnabled)save();
}
function animateShelfTransition(kind,change,from,to){
 const style=document.documentElement;
 const flag=kind==='open'?'nb-opening-book':'nb-closing-book';
 // A cor do verso deve acompanhar a cor real de cada caderno, inclusive no retorno.
 const coverColor=kind==='open'
  ?getComputedStyle(from).getPropertyValue('--nb-book-cover').trim()
  :bookColor(activeBook());
 style.style.setProperty('--nb-flipping-cover',/^#[0-9a-fA-F]{6}$/.test(coverColor)?coverColor:'#79689b');
 style.classList.remove('nb-opening-book','nb-closing-book');
 style.classList.add(flag);
 transitionView(change,from,to);
 setTimeout(()=>{
  style.classList.remove(flag);
  style.style.removeProperty('--nb-flipping-cover');
 },1150);
}
function showShelf(animate=true){
 closeFormatMenus();
 if(editing)saveEditor(false);
 editEnabled=false;data.mode='none';selected=null;selectedStroke=-1;
 if(galleryOpen){galleryOpen=false;$('nbGallery').hidden=true;view.hidden=false;root.classList.remove('nb-gallery-open');}
 if(drawerOpen)closeDrawer();
 const source=!shelfOpen?wrap:null;
 const update=()=>{shelfOpen=true;renderShelf();syncNotebookUI();save();};
 if(animate&&source)animateShelfTransition('close',update,source,
  ()=>root.querySelector('.nb-shelf-book[data-nb-shelf-book="'+data.bookId+'"] .nb-shelf-cover'));
 else update();
}
function openShelfBook(bookId,button){
 if(!data.books.some(b=>b.id===bookId))return;
 const from=button?.querySelector('.nb-shelf-cover');
 const update=()=>{
  shelfOpen=false;editEnabled=false;data.mode='none';
  switchBook(bookId);
  // Cadernos sem nenhuma anotação, data, desenho ou post-it abrem prontos para editar.
  // Um caderno que já foi usado continua iniciando em somente leitura.
  editEnabled=!activeBook().pages.some(hasPageContent);
  data.mode='none';
  refreshTools();syncNotebookUI();
  view.scrollTop=0;view.scrollLeft=0;
 };
 if(from)animateShelfTransition('open',update,from,()=>wrap);
 else update();
}

function persistNow(){
 clearTimeout(saveTimer);
 try{
  const payload=JSON.stringify(serializable());
  // Mudanças de página, zoom ou leitura não podem subir um caderno vazio sobre
  // anotações recentes de outro aparelho antes da primeira sincronização.
  const signature=JSON.stringify(data.books);
  const contentChanged=signature!==lastContentSignature;
  if(contentChanged){
   lastContentSignature=signature;
   localStamp=Math.max(Date.now(),localStamp+1);
   cloudDirty=true;
  }
  localStorage.setItem(STORE,payload);
  if(localStamp)localStorage.setItem(STAMP_KEY,String(localStamp));
  refreshCurrentRailSnapshot();
  if(cloudReady&&cloudDirty)scheduleCloudSave();
  return true;
 }catch(_){status('Armazenamento cheio. Exporte uma cópia em PDF.','error');return false;}
}
function save(){
 clearTimeout(saveTimer);
 saveTimer=setTimeout(()=>{
  if(persistNow())status('Salvo neste dispositivo · sincronização pendente…','success');
 },180);
}
function scheduleCloudSave(delay=650){
 if(!cloudReady||!cloudDirty)return;
 clearTimeout(cloudTimer);cloudTimer=setTimeout(()=>{void flushCloud()},delay);
}
async function flushCloud(){
 if(!cloudReady||!cloudDirty||cloudBusy)return;
 const c=notebookClient();
 if(!c){status('Entre na sua conta para sincronizar. A cópia local está preservada.','error');return;}
 cloudBusy=true;cloudDirty=false;
 const stamp=localStamp,content=serializable();
 try{
  const {error}=await c.from('uentzoul_notebooks').upsert({
   user_id:userId,semester:SEMESTER,content,client_modified_at:stamp,updated_at:new Date().toISOString()
  },{onConflict:'user_id,semester'});
  if(error)throw error;
  clearTimeout(retryTimer);retryTimer=null;
  if(stamp===localStamp&&!cloudDirty)status('Salvo na sua conta e neste dispositivo','success');
 }catch(_){
  cloudDirty=true;
  status('Sem conexão com a nuvem · cópia local preservada.','error');
  clearTimeout(retryTimer);retryTimer=setTimeout(()=>{retryTimer=null;scheduleCloudSave(100)},15000);
 }finally{
  cloudBusy=false;
  if(cloudDirty&&!retryTimer)scheduleCloudSave();
 }
}
async function loadCloud(){
 if(cloudReady||cloudLoading)return;
 const c=notebookClient();if(!c)return;
 cloudLoading=true;
 try{
  const {data:remote,error}=await c.from('uentzoul_notebooks')
   .select('content,client_modified_at').eq('user_id',userId).eq('semester',SEMESTER).maybeSingle();
  if(error)throw error;
  const stamp=Math.max(0,Number(remote?.client_modified_at)||0);
  const valid=Array.isArray(remote?.content?.books)&&remote.content.books.length>0;
  if(valid&&stamp>localStamp&&!cloudDirty){
   try{if(data.books.some(book=>book.pages?.some(hasPageContent))&&!localStorage.getItem(STORE+':backup-before-cloud'))
    localStorage.setItem(STORE+':backup-before-cloud',JSON.stringify(serializable()));}catch(_){}
   restoreState(JSON.stringify(remote.content));
   cloudDirty=false;lastContentSignature=JSON.stringify(data.books);
   data.mode='none';editEnabled=false;selected=null;selectedStroke=-1;
   localStamp=stamp;
   try{localStorage.setItem(STORE,JSON.stringify(serializable()));localStorage.setItem(STAMP_KEY,String(stamp));}catch(_){}
   renderAll();setZoom(data.zoom,false);
   status('Cadernos recuperados da sua conta','success');
  }else if(remote&&!cloudDirty)status('Cadernos sincronizados com sua conta','success');
  cloudReady=true;
  // Revisões antigas são iniciadas somente após recuperar a versão da conta.
  setTimeout(()=>{if(cloudReady&&!grammarPaused)void reviewHistoricalNotes();},700);
  if(cloudDirty||(!remote&&(stored||data.books.some(book=>book.pages?.some(hasPageContent))))||
   (remote&&localStamp>stamp)){
   cloudDirty=true;
   if(localStamp===0){
    localStamp=Date.now();
    try{localStorage.setItem(STAMP_KEY,String(localStamp))}catch(_){}
   }
   scheduleCloudSave(100);
  }
 }catch(_){
  status('Nuvem indisponível · anotações mantidas neste dispositivo','error');
  clearTimeout(retryTimer);retryTimer=setTimeout(()=>{retryTimer=null;void loadCloud()},15000);
 }finally{cloudLoading=false;}
}
function status(message,kind){
 const e=document.getElementById('nbStatus');if(!e)return;
 e.textContent=message;e.dataset.state=kind||'';
}
function checkpoint(){undoStack.push(JSON.stringify(serializable()));if(undoStack.length>45)undoStack.shift();redoStack=[];}
function undo(){
 if(!undoStack.length)return;
 redoStack.push(JSON.stringify(serializable()));restoreState(undoStack.pop());editing=null;renderAll();save();
}
function redo(){
 if(!redoStack.length)return;
 undoStack.push(JSON.stringify(serializable()));restoreState(redoStack.pop());editing=null;renderAll();save();
}
root.className='nb-app';
root.innerHTML=
 '<header class="nb-top"><div class="nb-brand"><button type="button" class="nb-mark nb-hamburger" data-nb-action="drawer" aria-label="Abrir lista de cadernos" title="Cadernos">☰</button><div><h1 id="nbBookHeading">Caderno de aula</h1><p>Meu espaço de anotações</p></div></div>'+
 '<div class="nb-top-right"><button class="nb-quiet nb-back-books" data-nb-action="backToBooks" title="Voltar à estante de cadernos">‹ Cadernos</button><button class="nb-edit-toggle" id="nbEditToggle" data-nb-action="toggleEdit" aria-pressed="false">✎ Editar</button><span class="nb-status" id="nbStatus" role="status">Rascunho local · salvo automaticamente</span><div class="nb-export-wrap"><button type="button" class="nb-quiet nb-export-toggle" data-nb-export-toggle id="nbExportToggle" aria-haspopup="menu" aria-expanded="false" aria-controls="nbExportMenu">Exportar <span aria-hidden="true">⌄</span></button><div id="nbExportMenu" class="nb-export-menu" role="menu" aria-label="Formatos de exportação" hidden><button type="button" role="menuitem" data-nb-export-format="pdf"><strong>Exportar PDF</strong><small>Para leitura e impressão</small></button><button type="button" role="menuitem" data-nb-export-format="json"><strong>Salvar caderno editável (JSON)</strong><small>Backup para restaurar e continuar editando</small></button></div></div></div></header>'+
 '<section class="nb-shelf" id="nbShelf" aria-label="Escolher caderno" hidden></section>'+
 '<input id="nbImportFile" type="file" accept=".json,application/json" hidden aria-label="Selecionar backup do caderno editável">'+ 
 '<div class="nb-tools" id="nbTools" role="toolbar" aria-label="Ferramentas do caderno">'+
 '<div class="nb-toolgroup nb-primary-tools">' +
 '<button type="button" class="nb-tool nb-icon-tool" data-nb-action="none" aria-label="Navegar" title="Navegar">✋</button>' +
 '<button type="button" class="nb-tool nb-icon-tool" data-nb-action="text" aria-label="Escrever" title="Escrever">✍️</button>' +
 '<button type="button" class="nb-tool nb-icon-tool" data-nb-action="select" aria-label="Selecionar" title="Selecionar">👆</button>' +
 '<button type="button" class="nb-tool nb-icon-tool" data-nb-action="erase" aria-label="Borracha" title="Borracha">🧽</button>' +
 '<button type="button" class="nb-tool nb-icon-tool" data-nb-action="draw" aria-label="Desenhar" title="Desenhar">🖌️</button>' +
 '<button type="button" class="nb-tool nb-icon-tool" data-nb-action="sticky" aria-label="Post-it" title="Post-it">🗒️</button>' +
 '<button type="button" class="nb-tool nb-icon-tool" data-nb-action="warp" aria-label="Moldar" title="Moldar">🪄</button>' +
 '<span id="nbEraserControls" class="nb-eraser-controls" hidden><label for="nbEraseBehavior">Apagar</label><select id="nbEraseBehavior" aria-label="Tipo de borracha"><option value="parts">Trechos</option><option value="whole">Traço inteiro</option></select><label for="nbEraseSize">Raio</label><input id="nbEraseSize" type="range" min="6" max="32" step="2" value="14" aria-label="Tamanho da borracha"></span></div><span class="nb-sep"></span><div class="nb-toolgroup nb-format-tools">' +
 '<div class="nb-format-menu" data-nb-format-menu="colors"><button type="button" class="nb-tool nb-format-trigger nb-palette-trigger" data-nb-menu-toggle="colors" aria-label="Cores da caneta" title="Cores da caneta" aria-controls="nbMenuColors" aria-expanded="false">🎨<span id="nbCurrentInk" class="nb-current-ink" aria-hidden="true"></span><span class="nb-menu-chevron" aria-hidden="true">⌄</span></button><div id="nbMenuColors" class="nb-format-panel " role="group" aria-label="Cores da caneta" hidden><button type="button" class="nb-format-option" data-nb-action="black" aria-pressed="false"><span class="nb-color-dot" style="--swatch:#24242e"></span>Preta</button><button type="button" class="nb-format-option" data-nb-action="blue" aria-pressed="false"><span class="nb-color-dot" style="--swatch:#213f72"></span>Azul-marinho</button><button type="button" class="nb-format-option" data-nb-action="red" aria-pressed="false"><span class="nb-color-dot" style="--swatch:#bb3d43"></span>Vermelha</button></div></div>' +
 '<div class="nb-format-menu" data-nb-format-menu="fonts"><button type="button" class="nb-tool nb-format-trigger " data-nb-menu-toggle="fonts" aria-label="Fontes" title="Fontes" aria-controls="nbMenuFonts" aria-expanded="false">Fontes<span class="nb-menu-chevron" aria-hidden="true">⌄</span></button><div id="nbMenuFonts" class="nb-format-panel " role="group" aria-label="Fontes" hidden><button type="button" class="nb-format-option" data-nb-action="print" aria-pressed="false">Letra de forma 1</button><button type="button" class="nb-format-option" data-nb-action="cursive" aria-pressed="false">Letra de forma 2</button><button type="button" class="nb-format-option" data-nb-action="joined" aria-pressed="false">Letra cursiva</button></div></div>' +
 '<div class="nb-format-menu" data-nb-format-menu="alignment"><button type="button" class="nb-tool nb-format-trigger " data-nb-menu-toggle="alignment" aria-label="Alinhamento do texto" title="Alinhamento do texto" aria-controls="nbMenuAlignment" aria-expanded="false"><span id="nbAlignIcon" class="nb-align-bars nb-align-left" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="nb-menu-chevron" aria-hidden="true">⌄</span></button><div id="nbMenuAlignment" class="nb-format-panel nb-panel-right" role="group" aria-label="Alinhar texto" hidden><button type="button" class="nb-format-option" data-nb-align="left" aria-pressed="false"><span class="nb-align-bars nb-align-left" aria-hidden="true"><i></i><i></i><i></i><i></i></span>Esquerda</button><button type="button" class="nb-format-option" data-nb-align="center" aria-pressed="false"><span class="nb-align-bars nb-align-center" aria-hidden="true"><i></i><i></i><i></i><i></i></span>Centralizado</button><button type="button" class="nb-format-option" data-nb-align="right" aria-pressed="false"><span class="nb-align-bars nb-align-right" aria-hidden="true"><i></i><i></i><i></i><i></i></span>Direita</button><button type="button" class="nb-format-option" data-nb-align="justify" aria-pressed="false"><span class="nb-align-bars nb-align-justify" aria-hidden="true"><i></i><i></i><i></i><i></i></span>Justificado</button></div></div>' +
 '<div class="nb-format-menu" data-nb-format-menu="lists"><button type="button" class="nb-tool nb-format-trigger " data-nb-menu-toggle="lists" aria-label="Listas: tópicos e numeração" title="Listas: tópicos e numeração" aria-controls="nbMenuLists" aria-expanded="false" aria-pressed="false">☷<span class="nb-menu-chevron" aria-hidden="true">⌄</span></button><div id="nbMenuLists" class="nb-format-panel nb-panel-right" role="group" aria-label="Listas" hidden><button type="button" class="nb-format-option" data-nb-action="bullets" aria-pressed="false">• Tópicos</button><button type="button" class="nb-format-option" data-nb-action="numbered" aria-pressed="false">1. Numeração</button></div></div>' +
 '</div>' +
 '<div class="nb-toolgroup"><label class="nb-layout-label" for="nbLayout">Estilo</label><select class="nb-layout-select" id="nbLayout" aria-label="Estilo do caderno"><option value="single">Folha única</option><option value="book">Caderno aberto</option></select></div>'+ 
 '<div class="nb-toolgroup"><label class="nb-correct-toggle" title="Corrigir linhas, arcos, círculos, curvas e polígonos; preservar desenhos livres"><input id="nbSmooth" type="checkbox">Ajustar traços</label>'+
 '<button class="nb-tool" data-nb-action="shortcuts" title="Personalizar teclas e botões do mouse">⌨ Atalhos</button>'+
 '<button class="nb-tool" data-nb-action="undo" title="Desfazer">↶</button><button class="nb-tool" data-nb-action="redo" title="Refazer">↷</button></div></div>'+
 '<div class="nb-workspace" id="nbWorkspace"><aside id="nbPageRail" class="nb-page-rail" aria-label="Folhas deste caderno"></aside>'+
 '<div class="nb-view" id="nbViewport" aria-label="Folha do caderno, com zoom e rolagem">'+
 '<div class="nb-stage" id="nbStage"><div class="nb-sheet-wrap" id="nbWrap">'+
 '<div class="nb-sheet" id="nbSheet"><div class="nb-holes" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div><span class="nb-binder-zone" aria-hidden="true"></span>'+
 '<div class="nb-paper-date-group"><input id="nbPaperDate" class="nb-paper-date" type="date" aria-label="Data da aula"><span id="nbPaperDateRead" class="nb-paper-date-read" hidden></span></div>'+
 '<div class="nb-line-hover" id="nbLineHover" hidden></div>'+
 '<canvas id="nbDrawing" class="nb-drawing" width="780" height="1240" aria-label="Área de desenho"></canvas>'+
 '<div class="nb-text-layer" id="nbTextLayer"></div><div class="nb-sticky-layer" id="nbStickyLayer"></div><div class="nb-transform-layer" id="nbTransformLayer"></div>'+
 '<div id="nbEditorHost"></div><button class="nb-fold" data-nb-action="next" title="Virar a página" aria-label="Virar a página"></button><span class="nb-fold-label" aria-hidden="true">›</span>'+
 '<div class="nb-page-num" id="nbPageNum"></div></div></div>'+ 
 '<button type="button" class="nb-sheet-wrap nb-companion-wrap" id="nbCompanionWrap" data-nb-action="switchLeaf" aria-label="Editar a outra folha" hidden><span id="nbCompanionPaper"></span></button></div></div></div>'+
 '<footer class="nb-page-control"><button class="nb-page-btn" data-nb-action="gallery">▦ Folhas</button><button class="nb-page-btn" data-nb-action="prev">‹ Anterior</button>'+
 '<span class="nb-page-indicator" id="nbPageCount">Página 1 de 1</span>'+
 '<button class="nb-page-btn" data-nb-action="next">Próxima ›</button>'+
 '<span class="nb-zoom"><button class="nb-icon-btn" data-nb-action="zoomOut" aria-label="Reduzir zoom">−</button>'+
 '<input type="range" id="nbZoomSlider" min="42" max="230" step="1" aria-label="Zoom do caderno">'+
 '<button class="nb-icon-btn" data-nb-action="zoomIn" aria-label="Ampliar zoom">+</button><span id="nbZoomText">88%</span></span></footer>'+
 '<aside id="nbDrawer" class="nb-drawer" hidden aria-label="Seus cadernos"></aside>'+
 '<section id="nbGallery" class="nb-gallery" hidden aria-label="Todas as folhas do caderno"></section>'+
 '<div id="nbStickyPalette" class="nb-sticky-palette" hidden role="group" aria-label="Cores de post-it"></div>'+
 '<div id="nbContextMenu" class="nb-context-menu" hidden role="menu" aria-label="Ações do item selecionado"></div>'+
 '<div id="nbToolCursor" class="nb-tool-cursor" hidden aria-hidden="true"></div>'+
 '<div class="nb-help" id="nbShortcutsDialog" hidden><div class="nb-dialog" role="dialog" aria-modal="true" aria-labelledby="nbShortcutsHeading">'+
 '<h2 id="nbShortcutsHeading">Seus atalhos</h2><p>Escolha uma ação e pressione a tecla ou o botão do mouse que deseja associar. Os atalhos funcionam quando você não está digitando em um campo.</p>'+
 '<div class="nb-shortcuts" id="nbShortcutsList"></div>'+
 '<div class="nb-dialog-footer"><span class="nb-hint" id="nbShortcutHint">Os atalhos são salvos neste aparelho.</span><button class="nb-quiet" data-nb-action="closeShortcuts">Fechar</button></div></div></div>';
const $=name=>document.getElementById(name);
function pageCountLabel(){
 const count=data.pages.length;
 if(data.layout==='book')return 'Caderno aberto · folhas '+(Math.floor(data.page/2)*2+1)+'–'+(Math.floor(data.page/2)*2+2);
 return data.page>=count?'Nova página · '+count+' '+(count===1?'salva':'salvas'):'Página '+(data.page+1)+' de '+count;
}
function updateBookHeading(){$('nbBookHeading').textContent=activeBook().name||'Caderno de aula';}
const view=$('nbViewport'),sheet=$('nbSheet'),canvas=$('nbDrawing'),ctx=canvas.getContext('2d'),wrap=$('nbWrap'),companion=$('nbCompanionWrap'),stage=$('nbStage');
function currentRect(){return sheet.getBoundingClientRect()}
/* Converter o ponteiro pela geometria real do canvas.
   A resolução HiDPI do bitmap não altera o tamanho da superfície visível. */
function point(event){
 const r=canvas.getBoundingClientRect();
 const rawX=clamp((event.clientX-r.left)*W/Math.max(1,r.width),0,W);
 const x=data.layout==='book'&&editEnabled?
  (data.page%2===0?Math.min(rawX,W-BINDER_SAFE):Math.max(rawX,BINDER_SAFE)):rawX;
 return{x,y:clamp((event.clientY-r.top)*H/Math.max(1,r.height),0,H)};
}
function syncLayoutGeometry(){
 const book=data.layout==='book';
 stage.classList.toggle('nb-double',book);
 companion.hidden=!book;
 sheet.classList.toggle('nb-left-page',book&&data.page%2===0);
 sheet.classList.toggle('nb-right-page',book&&data.page%2===1);
 const side=book&&data.page%2===1;
 wrap.style.order=side?'1':'0';
 companion.style.order=side?'0':'1';
 if(book){
  companion.style.width=(W*data.zoom)+'px';
  companion.style.height=(H*data.zoom)+'px';
  companion.style.setProperty('--nb-snapshot-scale',String(data.zoom));
 }
}
function renderBookSpread(){
 syncLayoutGeometry();
 if(data.layout!=='book')return;
 const index=data.page%2===0?data.page+1:data.page-1;
 const other=data.pages[index]||emptyPage();
 $('nbCompanionPaper').innerHTML=snapshotSheetMarkup(other,index,true);
 companion.setAttribute('aria-label','Abrir e editar folha '+(index+1));
}
function companionIndex(){return data.page%2===0?data.page+1:data.page-1}
function isInBinderZone(event){
 if(data.layout!=='book')return false;
 const onLive=!!event.target.closest?.('#nbSheet');
 const onOther=!!event.target.closest?.('#nbCompanionWrap');
 if(!onLive&&!onOther)return false;
 const rect=(onLive?sheet:companion).getBoundingClientRect();
 const x=(event.clientX-rect.left)/Math.max(.01,data.zoom);
 const index=onLive?data.page:companionIndex();
 return index%2===0?x>=W-BINDER_SAFE:x<=BINDER_SAFE;
}
function activateCompanion(event){
 if(data.layout!=='book'||flipping)return;
 const target=companionIndex();
 if(target>data.pages.length+(editEnabled?1:0)||!editEnabled&&target===data.pages.length){
  status('A folha oposta ainda não foi criada. Use Editar para começar.','');
  return;
 }
 const rect=companion.getBoundingClientRect(),localY=(event.clientY-rect.top)/data.zoom;
 if(editing)saveEditor(false);
 data.page=target;pendingPage=emptyPage();selected=null;selectedStroke=-1;
 renderPage();renderPageRail();save();
 if(data.mode==='text'&&localY>=START+FIRST_LINE*L&&localY<=START+ROWS*L)
  beginEdit(clamp(Math.floor((localY-START)/L),FIRST_LINE,ROWS-1));
}
// O papel oposto passa a usar imediatamente a ferramenta ativa.
 // A troca preserva a posição visual das folhas: somente a folha viva muda de lado.
function beginOpposingLeafGesture(event){
 if(shelfOpen||!editEnabled||data.layout!=='book'||data.mode==='none'||flipping||isInBinderZone(event))return false;
 const target=companionIndex();
 if(target>data.pages.length+1)return false;
 event.preventDefault();event.stopImmediatePropagation();
 if(editing)saveEditor(false);
 data.page=target;pendingPage=emptyPage();selected=null;selectedStroke=-1;
 // Só a folha viva muda: ambas conservam a mesma posição visual.
 // NÃO salvar antes de terminar o gesto na página direita nova.
 renderPage();renderPageRail();
 suppressLeafClickUntil=Date.now()+450;
 const pos=point(event),mode=data.mode;
 if(mode==='text'){
  if(pos.x>=88&&pos.y>=START+FIRST_LINE*L&&pos.y<START+ROWS*L)
   beginEdit(Math.floor((pos.y-START)/L));
  return true;
 }
 if(mode==='sticky'){addSticky(pos);return true;}
 if(mode==='draw'||mode==='erase'){
  checkpoint();
  if(mode==='draw')drawPoints=[pos];
  else{eraseDrag={pointerId:event.pointerId};applyEraser(pos);}
  opposingStrokePointer=event.pointerId;
  // Captura o apontador físico no botão que recebeu o clique original;
  // eventos sintéticos não têm captura garantida em todos os navegadores.
  try{companion.setPointerCapture?.(event.pointerId)}catch(_){}
  return true;
 }
 if(mode==='select'||mode==='warp'){
  const element=document.elementFromPoint(event.clientX,event.clientY);
  const note=element?.closest('#nbSheet [data-nb-note]');
  const sticky=element?.closest('#nbSheet [data-nb-sticky]');
  if(mode==='select'&&note){
   selectItem('note',note.dataset.nbNote);
   startMoveDrag(event,'note',selectedItem());return true;
  }
  if(mode==='select'&&sticky){
   selectItem('sticky',sticky.dataset.nbSticky);
   startMoveDrag(event,'sticky',selectedItem());return true;
  }
  const hit=findStrokeNear(pos,mode==='select');
  if(hit.stroke){
   selectItem('stroke',hit.stroke.id);selectedStroke=hit.index;
   if(mode==='select')startMoveDrag(event,'stroke',hit.stroke);
   return true;
  }
  selected=null;selectedStroke=-1;renderSelectionHandles();
  if(mode==='select')startPan(event);
  return true;
 }
 return true;
}
function setZoom(value,saveState=true){
 data.zoom=clamp(Number(value)||1,.42,2.3);
 wrap.style.width=(W*data.zoom)+'px';wrap.style.height=(H*data.zoom)+'px';
 sheet.style.transform='scale('+data.zoom+')';sheet.style.transformOrigin='top left';
 syncLayoutGeometry();
 $('nbZoomSlider').value=Math.round(data.zoom*100);
 $('nbZoomText').textContent=Math.round(data.zoom*100)+'%';
 if(saveState)save();
}
function zoomAt(value,clientX,clientY){
 const r=currentRect(),old=data.zoom;
 const px=clamp((clientX-r.left)/old,0,W),py=clamp((clientY-r.top)/old,0,H);
 setZoom(value);
 const newer=currentRect();
 view.scrollLeft+=newer.left+px*data.zoom-clientX;
 view.scrollTop+=newer.top+py*data.zoom-clientY;
}
function focusLine(line){
 // Enter mantém zoom e posição; desloca só quando a nova linha sai da tela.
 const paper=sheet.getBoundingClientRect(),viewport=view.getBoundingClientRect();
 if(!viewport.height||!viewport.width)return;
 const y=paper.top+(START+line*L)*data.zoom,lowerY=y+L*data.zoom;
 const marginY=Math.min(76,Math.max(24,viewport.height*.17));
 if(y<viewport.top+marginY)view.scrollTop-=Math.ceil(viewport.top+marginY-y);
 else if(lowerY>viewport.bottom-marginY)view.scrollTop+=Math.ceil(lowerY-(viewport.bottom-marginY));
 const x=paper.left+110*data.zoom;
 const marginX=Math.min(45,Math.max(16,viewport.width*.08));
 if(x<viewport.left+marginX)view.scrollLeft-=Math.ceil(viewport.left+marginX-x);
 else if(x>viewport.right-marginX)view.scrollLeft+=Math.ceil(x-(viewport.right-marginX));
}
/* Uma única opção de menu por vez; nenhuma destas ações altera o zoom. */
const FORMAT_MENUS=['colors','fonts','alignment','lists'];
function showFormatMenu(which=''){
 formatMenuOpen=FORMAT_MENUS.includes(which)?which:'';
 for(const name of FORMAT_MENUS){
  const panel=$('nbMenu'+name[0].toUpperCase()+name.slice(1));
  const button=root.querySelector('[data-nb-menu-toggle="'+name+'"]');
  if(panel)panel.hidden=name!==formatMenuOpen;
  if(button)button.setAttribute('aria-expanded',String(name===formatMenuOpen));
 }
}
function closeFormatMenus(){if(formatMenuOpen)showFormatMenu('');}
function applyTextAlign(align){
 if(!['left','center','right','justify'].includes(align))return;
 data.align=align;
 const item=editing?.id?page().notes.find(n=>n.id===editing.id):selected?.type==='note'?selectedItem():null;
 if(item){item.align=align;renderNotes();}
 const input=$('nbEditorText');if(editing&&input)input.style.textAlign=align;
 refreshTools();save();
}
function refreshTools(){
 for(const a of MODES){const b=root.querySelector('[data-nb-action="'+a+'"]');b?.setAttribute('aria-pressed',String(data.mode===a));}
 $('nbEraserControls').hidden=data.mode!=='erase';
 $('nbEraseBehavior').value=data.eraserMode==='whole'?'whole':'parts';
 $('nbEraseSize').value=clamp(Number(data.eraserRadius)||14,6,32);
 for(const a of Object.keys(COLORS)){const b=root.querySelector('[data-nb-action="'+a+'"]');b?.setAttribute('aria-pressed',String(data.ink===a));}
 $('nbSmooth').checked=!!data.smooth;
 for(const name of ['print','cursive','joined'])root.querySelector('[data-nb-action="'+name+'"]')?.setAttribute('aria-pressed',String(data.font===name));
 const align=['left','center','right','justify'].includes(data.align)?data.align:'left';
 const alignmentIcon=$('nbAlignIcon');if(alignmentIcon)alignmentIcon.className='nb-align-bars nb-align-'+align;
 for(const choice of root.querySelectorAll('[data-nb-align]'))choice.setAttribute('aria-pressed',String(choice.dataset.nbAlign===align));
 const inkIndicator=$('nbCurrentInk');if(inkIndicator)inkIndicator.style.background=COLORS[data.ink]||COLORS.blue;
 root.querySelector('[data-nb-menu-toggle="lists"]')?.setAttribute('aria-pressed',String(data.listStyle!=='none'));
 for(const action of ['bullets','numbered'])root.querySelector('[data-nb-action="'+action+'"]')?.setAttribute('aria-pressed',String(data.listStyle===action));
 $('nbLayout').value=data.layout;
 sheet.dataset.mode=data.mode;
 $('nbPageCount').textContent=pageCountLabel();updateBookHeading();
 $('nbPageNum').textContent=String(data.page+1).padStart(2,'0');
 $('nbPaperDate').value=page().date||'';
}
/* Prefixos de listas integram o próprio texto: nuvem, miniaturas e PDF preservam os itens. */
function listInfo(value){
 const match=/^([ \t]*)(?:(•)(?:[ \t]+|$)|(\d{1,4})\.(?:[ \t]+|$))/.exec(String(value||''));
 return match?{indent:match[1],kind:match[2]?'bullets':'numbered',number:Number(match[3]||0),prefix:match[0]}:null;
}
function nextListNumber(line){
 const previous=page().notes.filter(n=>Number(n.line)+Math.max(1,Number(n.span)||1)===line)
  .sort((a,b)=>Number(b.line)-Number(a.line))[0];
 const item=listInfo(previous?.text||'');
 return item?.kind==='numbered'?Math.min(9999,item.number+1):1;
}
function listMarker(style,line){
 return style==='bullets'?'• ':style==='numbered'?nextListNumber(line)+'. ':'';
}
function normalizeNoteText(raw){
 const item=listInfo(raw);
 return item?item.prefix+fallbackBasic(String(raw).slice(item.prefix.length)):fallbackBasic(raw);
}
/* Cada anotação mantém texto puro e intervalos de cores independentes. */
function inkMapFor(text,ink='blue',runs=[]){
 const size=String(text||'').length,base=COLORS[ink]?ink:'blue',colors=Array(size).fill(base);
 if(Array.isArray(runs))for(const run of runs.slice(0,2500)){
  const start=clamp(Math.floor(Number(run.start)||0),0,size),end=clamp(Math.floor(Number(run.end)||0),start,size);
  if(COLORS[run.ink])colors.fill(run.ink,start,end);
 }
 return colors;
}
function inkRunsFor(text,map,defaultInk='blue'){
 const len=String(text||'').length;if(!len)return [];
 const colors=Array.isArray(map)?map:[],runs=[];
 let previous=COLORS[colors[0]]?colors[0]:defaultInk,start=0;
 for(let i=1;i<=len;i++){
  const next=i<len?(COLORS[colors[i]]?colors[i]:defaultInk):'';
  if(next!==previous){runs.push({start,end:i,ink:previous});start=i;previous=next;}
 }
 return runs;
}
/* Substituições deixam cores nos trechos intactos, inclusive ao aplicar a gramática. */
function reconcileInkMap(before,colors,after,chosenInk){
 before=String(before||'');after=String(after||'');
 const previous=Array.isArray(colors)&&colors.length===before.length?colors:inkMapFor(before,chosenInk);
 if(before===after)return previous.slice();
 let prefix=0;while(prefix<before.length&&prefix<after.length&&before[prefix]===after[prefix])prefix++;
 let suffix=0;
 while(suffix<before.length-prefix&&suffix<after.length-prefix&&
  before[before.length-1-suffix]===after[after.length-1-suffix])suffix++;
 const replaced=before.length-prefix-suffix;
 const ink=replaced?(previous[prefix]||previous[prefix-1]||chosenInk):chosenInk;
 return previous.slice(0,prefix).concat(Array(after.length-prefix-suffix).fill(COLORS[ink]?ink:'blue'),
  suffix?previous.slice(before.length-suffix):[]);
}
function coloredTextMarkup(text,colors,fallback='blue'){
 const value=String(text||'');
 return inkRunsFor(value,colors,fallback).map(run=>
  '<span style="color:'+COLORS[run.ink]+'">'+esc(value.slice(run.start,run.end))+'</span>').join('');
}
function noteTextMarkup(note){
 const value=String(note.text||'');
 return Array.isArray(note.inkRuns)&&note.inkRuns.length?
  coloredTextMarkup(value,inkMapFor(value,note.ink,note.inkRuns),note.ink):
  letterMarkup(value);
}
function syncInkOverlay(){
 if(!editing)return;
 const input=$('nbEditorText'),overlay=$('nbEditorColors');
 if(!input||!overlay)return;
 overlay.innerHTML=coloredTextMarkup(input.value,editing.inkMap,data.ink);
 overlay.style.height=input.clientHeight+'px';
 overlay.scrollTop=input.scrollTop;overlay.scrollLeft=input.scrollLeft;
 input.style.caretColor=COLORS[data.ink]||COLORS.blue;
}
function letterMarkup(text){
 // Uma métrica tipográfica por linha; spans letra por letra deformavam a pauta.
 return esc(String(text||'')).replace(/\n/g,'<br>');
}
function noteMarkup(n,preview){
 const size=clamp(Number(n.size)||1,1,3),
  top=START+(Number(n.line)||0)*L+(Number(n.offsetY)||0)-3,
  left=clamp(Number(n.x)||110,85,W-65),
  width=clamp(Number(n.frameW)||620,70,W-left-20),
  scaleX=clamp(Number(n.scaleX)||1,.35,3.8),scaleY=clamp(Number(n.scaleY)||1,.35,3.8);
 const css='left:'+left+'px;right:auto;width:'+width+'px;top:'+top+'px;min-height:'+
  (size*L)+'px;transform:scale('+scaleX+','+scaleY+');transform-origin:top left;--nb-small:26px;--nb-cap-size:'+
  (26+(size-1)*30)+'px;--nb-note-size:'+(26+(size-1)*30)+'px;--nb-note-row:'+(size*L)+'px;text-align:'+(['left','center','right','justify'].includes(n.align)?n.align:'left')+';color:'+(COLORS[n.ink]||COLORS.blue)+';';
 return '<div class="nb-note '+(n.font==='joined'?'joined':n.font==='cursive'?'cursive':'print')+(preview?' nb-preview':'')+
  (editing&&editing.id===n.id?' nb-selected':'')+(n.pending?' nb-correcting':'')+
  '" style="'+css+'"'+(!preview?' data-nb-note="'+esc(n.id)+'"':'')+'><span class="nb-note-content">'+noteTextMarkup(n)+'</span></div>';
}
function renderNotes(){
 const notes=page().notes;
 $('nbTextLayer').innerHTML=notes.filter(n=>!(editing&&n.id===editing.id)).map(n=>noteMarkup(n,false)).join('');
}
function editorMarkup(caret='end'){
 const host=$('nbEditorHost');
 if(!editing){host.innerHTML='';return;}
 const line=editing.line,top=START+line*L-3,fsize=26;
 const lineHeight=L;
 const fontClass=data.font==='joined'?'joined':data.font==='cursive'?'cursive':'print';
 const shared='top:'+top+'px;--nb-small:'+fsize+'px;--nb-note-size:'+fsize+'px;--nb-note-row:'+lineHeight+'px;text-align:'+data.align+';';
 host.innerHTML='<div id="nbEditorColors" class="nb-inline-colors '+fontClass+'" style="'+shared+'" aria-hidden="true"></div>'+
  '<textarea class="nb-inline-edit nb-colorized '+fontClass+'" id="nbEditorText" style="'+shared+'" rows="1" maxlength="2500" spellcheck="true"'+
  ' aria-label="Escrever diretamente na linha '+(line+1)+'"></textarea>';
 const input=$('nbEditorText');input.value=editing.draft||'';
 input.style.height=Math.max(38,input.scrollHeight)+'px';
 syncInkOverlay();
 requestAnimationFrame(()=>{
  if(!input.isConnected||$('nbEditorText')!==input)return;
  input.focus({preventScroll:true});
  const offset=caret==='start'?0:caret==='end'?input.value.length:
   clamp(Number(caret)||0,0,input.value.length);
  input.setSelectionRange(offset,offset);
 });
}
function beginEdit(line,caret='end'){
 if(!editEnabled||data.mode!=='text'||line<FIRST_LINE)return;
 line=clamp(line,FIRST_LINE,ROWS-1);
 if(editing&&editing.line===line){
  const input=$('nbEditorText');
  if(input){
   input.focus({preventScroll:true});
   const pos=caret==='start'?0:caret==='end'?input.value.length:clamp(Number(caret)||0,0,input.value.length);
   input.setSelectionRange(pos,pos);
  }
  return;
 }
 if(editing&&editing.line!==line)saveEditor(false);
 data.size=1;
 const existing=page().notes.find(n=>line>=Number(n.line)&&line<Number(n.line)+Number(n.span||Number(n.size)||1));
 if(existing)data.listStyle=listInfo(existing.text)?.kind||'none';
 editing={line:existing?Number(existing.line):line,id:existing?.id||null,
  draft:existing?.text||(data.listStyle!=='none'?listMarker(data.listStyle,line):'')};
 if(existing){
  data.font=existing.font;data.align=existing.align||'left';
  editing.inkMap=inkMapFor(editing.draft,existing.ink,existing.inkRuns);
  data.ink=editing.inkMap.at(-1)||existing.ink||data.ink;
 }else editing.inkMap=inkMapFor(editing.draft,data.ink);
 previewText=editing.draft;
 refreshTools();renderNotes();editorMarkup(caret);focusLine(editing.line);
}
/* Marcadores e números são caracteres apagáveis, não elementos fixos. */
function removeListMarker(input,marker){
 if(!editing||!input||!marker)return;
 input.setRangeText('',marker.indent.length,marker.prefix.length,'end');
 data.listStyle='none';
 input.dispatchEvent(new Event('input',{bubbles:true}));
 refreshTools();
 input.focus({preventScroll:true});
}
function toggleList(style){
 const input=$('nbEditorText');
 const target=!editing&&selected?.type==='note'?selectedItem():null;
 const currentStyle=editing?data.listStyle:target?(listInfo(target.text)?.kind||'none'):data.listStyle;
 const next=currentStyle===style?'none':style;
 if(input&&editing){
  const oldText=input.value,oldItem=listInfo(oldText),indent=oldItem?.indent||'';
  const plain=oldItem?indent+oldText.slice(oldItem.prefix.length):oldText;
  const updated=next==='none'?plain:indent+listMarker(next,editing.line)+plain.slice(indent.length);
  const cursor=clamp(input.selectionStart+updated.length-oldText.length,0,updated.length);
  input.value=updated;
  input.dispatchEvent(new Event('input',{bubbles:true}));
  input.focus({preventScroll:true});input.setSelectionRange(cursor,cursor);
 }else if(target){
  const oldItem=listInfo(target.text),indent=oldItem?.indent||'';
  const plain=oldItem?indent+target.text.slice(oldItem.prefix.length):target.text;
  const updated=next==='none'?plain:indent+listMarker(next,Number(target.line))+plain.slice(indent.length);
  if(updated!==target.text){
   checkpoint();
   target.inkRuns=inkRunsFor(updated,reconcileInkMap(target.text,inkMapFor(target.text,target.ink,target.inkRuns),updated,data.ink),target.ink);
   target.text=updated;target.pending=false;delete target.original;delete target.grammarReviewVersion;
   target.span=occupiedSpan(target);makeRoom(target);renderNotes();
  }
 }else{
  data.mode='text';
 }
 data.listStyle=next;refreshTools();save();
 status(next==='none'?'Lista desativada.':next==='bullets'?'Lista com marcadores ativada.':'Lista numerada ativada.','success');
}
function closeEditor(){editing=null;previewText='';renderNotes();editorMarkup();}
function occupiedSpan(note){
 const size=clamp(Number(note.size)||1,1,3);
 // Mede exatamente o fluxo usado na folha: a IA pode mudar palavras, mas nunca o passo da pauta.
 const left=clamp(Number(note.x)||110,85,W-65);
 const width=clamp(Number(note.frameW)||620,70,W-left-20);
 const fontSize=26+(size-1)*30;
 const probe=document.createElement('div');
 probe.className='nb-note '+(note.font==='joined'?'joined':note.font==='cursive'?'cursive':'print');
 probe.style.cssText='left:-9999px;top:0;width:'+width+'px;min-height:0;visibility:hidden;pointer-events:none;'+
  '--nb-small:26px;--nb-note-size:'+fontSize+'px;--nb-note-row:'+(size*L)+'px;';
 probe.innerHTML='<span class="nb-note-content">'+letterMarkup(note.text)+'</span>';
 sheet.appendChild(probe);
 const height=probe.scrollHeight;
 probe.remove();
 if(height>0)return clamp(size*Math.max(1,Math.ceil(height/(size*L)-.01)),1,ROWS);
 // Fallback para testes sem motor de layout.
 const lines=Math.max(1,String(note.text||'').split('\n').length);
 return clamp(size*lines,1,ROWS);
}
function makeRoom(saved){
 const list=page().notes.filter(n=>n.id!==saved.id).sort((a,b)=>a.line-b.line);
 let end=saved.line+saved.span;
 for(const note of list){
  if(note.line<saved.line)continue;
  if(note.line<end){note.line=end;}
  end=note.line+Math.max(1,Number(note.span)||1);
 }
}
function fallbackBasic(input){
 // Protege a tabulação real contra a normalização da revisão gramatical.
 const tabMarker='\uE000';
 let text=String(input||'').replace(/\t/g,tabMarker).replace(/ +/g,' ').replace(/[ \t]+([,.;:!?])/g,'$1')
  .replace(/([,;:!?])(?=[\p{L}\p{N}])/gu,'$1 ').trim();
 if(!text)return '';
 text=text.replace(/\bnao\b/gi,word=>word[0]==='N'?'Não':'não');
 text=text.replace(/^(bom dia|boa tarde|boa noite)\s+(rapaziada|pessoal|gente|galera|turma|professor(?:a)?|amigos)\b/iu,
  (_,saudacao,vocativo)=>saudacao+', '+vocativo);
 text=text.replace(/^(\uE000*)([\p{L}])/u,(_,tabs,first)=>tabs+first.toLocaleUpperCase('pt-BR'));
 // Ponto e vírgula, dois-pontos e vírgula sinalizam continuação e não recebem ponto final.
 text=text.replace(/([;:,])\s*\.(?=[”"'’)\]\}»]*$)/u,'$1');
 if(!/[.!?…;:,][”"'’)\]\}»]*$/u.test(text))text+='.';
 return text.replace(/\uE000/g,'\t');
}
function preserveTypedEnding(original,corrected){
 // Mantém a pontuação final que o aluno digitou mesmo se a IA responder com um ponto.
 // Sem pontuação digitada, a IA continua podendo escolher um ponto, ? ou !.
 const ending=String(original||'').trimEnd().match(/([;:,!?…])([”"'’)\]\}»]*)$/u);
 if(!ending)return corrected;
 let revised=String(corrected||'').trimEnd();
 const revisedEnd=revised.match(/[.,;:!?…]+([”"'’)\]\}»]*)$/u);
 if(revisedEnd)revised=revised.slice(0,revisedEnd.index);
 return revised+ending[1]+(revisedEnd?.[1]||ending[2]);
}
function restoreTextTabs(original,corrected){
 // A IA revisa o conteúdo; os recuos feitos pelo aluno são preservados.
 const source=String(original||'').split('\n'),revised=String(corrected||'').split('\n');
 if(!source.some(line=>line.includes('\t')))return corrected;
 if(source.length!==revised.length){
  const prefix=source[0].match(/^\t*/)?.[0]||'';
  return prefix+String(corrected||'').replace(/^\t*/,'');
 }
 return revised.map((line,i)=>{
  const raw=source[i],prefix=raw.match(/^\t*/)?.[0]||'';
  // Evita realocar um Tab intermediário caso a revisão mude a ordem das palavras.
  if(raw.slice(prefix.length).includes('\t'))return raw;
  return prefix+line.replace(/^\t*/,'');
 }).join('\n');
}
async function grammarError(err){
 let message=String(err?.message||'Revisão indisponível.');
 const http=Number(err?.context?.status)||0;
 if(typeof err?.context?.json==='function'){
  try{const body=await err.context.json();if(body?.error)message=String(body.error);}catch(_){}
 }
 if(http===429&&!/limite/i.test(message))message='Limite diário de revisões atingido.';
 if(http>=500&&message==='Edge Function returned a non-2xx status code')
  message='Serviço de correção temporariamente indisponível.';
 return message;
}
function grammarNote(noteId){
 for(const book of data.books)for(const p of book.pages||[]){
  const n=(p.notes||[]).find(x=>x.id===noteId);
  if(n)return {n,p};
 }
 return null;
}
async function correctNote(noteId,raw,quiet=false){
 const original=String(raw||''),start=grammarNote(noteId);
 const valid=x=>x&&(x.original===original||(!x.original&&x.text===original));
 if(grammarInFlight.has(noteId))return {ok:false,temporary:false,reason:'Revisão em andamento.'};
 if(!valid(start?.n))return {ok:false,temporary:false,reason:'Texto alterado antes da revisão.'};
 grammarInFlight.add(noteId);
 start.n.pending=true;
 if(start.p===page())renderNotes();
 try{
  const auth=window.parent.uentzoulAIAuth;
  if(auth?.user?.()?.id!==userId||auth?.user?.()?.is_anonymous===true)
   throw Error('A sessão terminou. Entre novamente na sua conta.');
  const c=auth.client?.();if(!c)throw Error('Serviço de revisão indisponível.');
  const list=listInfo(original),body=list?original.slice(list.prefix.length):original;
  const {data:result,error}=await c.functions.invoke('caderno-revisao',{body:{text:body}});
  if(error)throw Error(await grammarError(error));
  if(typeof result?.text!=='string')throw Error('O corretor não retornou texto.');
  const revised=result.text.trim();
  if(!revised||revised.length<body.length*.5||revised.length>body.length*1.75)
   throw Error('Revisão não confiável; anotação preservada.');
  const found=grammarNote(noteId);
  if(!valid(found?.n)||editing?.id===noteId)
   return {ok:false,temporary:false,reason:'Anotação editada durante a revisão.'};
  const n=found.n,before=n.text;
  const chosen=result.reviewed===true?revised:body;
  const reviewedText=preserveTypedEnding(body,restoreTextTabs(body,chosen));
  const finalText=list?list.prefix+fallbackBasic(reviewedText):fallbackBasic(reviewedText);
  if(result.reviewed===true){
   if(finalText!==before&&!n.grammarBefore)n.grammarBefore=before;
   n.text=finalText;n.reviewed=true;n.grammarReviewVersion=GRAMMAR_REVIEW_VERSION;
  }else{n.reviewed=false;delete n.grammarReviewVersion;}
  n.pending=false;delete n.original;
  // Na revisão retroativa, preservar a posição, tamanho, cor e fonte das notas.
  if(!quiet){
   n.span=occupiedSpan(n);
   if(found.p===page())makeRoom(n);
  }
  if(found.p===page())renderNotes();
  save();
  if(!quiet)status(result.reviewed===true?
   (finalText===before?'Anotação conferida, sem mudanças.':'Gramática corrigida.'):
   'Não foi possível confirmar a revisão. Anotação preservada.',
   result.reviewed===true?'success':'error');
  return {ok:result.reviewed===true,temporary:false,reason:'Revisão não confirmada.'};
 }catch(err){
  const found=grammarNote(noteId);
  if(valid(found?.n)){
   const n=found.n;n.pending=false;n.reviewed=false;
   delete n.grammarReviewVersion;
   if(n.original===original)n.text=normalizeNoteText(original);
   delete n.original;
   if(found.p===page())renderNotes();
   save();
  }
  const reason=String(err?.message||'Revisão temporariamente indisponível.');
  if(!quiet)status(reason+' Texto salvo para nova tentativa.','error');
  return {ok:false,temporary:true,reason};
 }finally{grammarInFlight.delete(noteId);}
}
function backupGrammarTexts(){
 try{
  if(localStorage.getItem(GRAMMAR_BACKUP_KEY))return true;
  const notes=[];
  for(const book of data.books)for(const [i,p] of (book.pages||[]).entries())
   for(const n of p.notes||[])notes.push({bookId:book.id,page:i,id:n.id,text:n.text,reviewed:n.reviewed===true});
  localStorage.setItem(GRAMMAR_BACKUP_KEY,JSON.stringify({createdAt:new Date().toISOString(),semester:SEMESTER,notes}));
  return true;
 }catch(_){return false;}
}
async function reviewHistoricalNotes(force=false){
 if(grammarRunning||!cloudReady||(!force&&grammarPaused))return;
 const tasks=notesNeedingGrammar().filter(n=>!n.pending&&!grammarInFlight.has(n.id)&&n.id!==editing?.id)
  .map(n=>({id:n.id,text:n.text})).filter(n=>force||!grammarAttempted.has(n.id));
 if(!tasks.length){updateGrammarProgress();return;}
 if(!backupGrammarTexts()){
  grammarPaused=true;updateGrammarProgress();
  status('Não foi possível criar a cópia de segurança. Exporte os cadernos e tente novamente.','error');
  return;
 }
 grammarPaused=false;grammarRunning=true;grammarDone=0;grammarTotal=tasks.length;
 updateGrammarProgress();
 let failed=0,reason='';
 for(const item of tasks){
  if(!root.isConnected||!cloudReady)break;
  grammarAttempted.add(item.id);
  const result=await correctNote(item.id,item.text,true);
  grammarDone++;
  if(!result.ok){
   failed++;
   if(result.temporary){grammarPaused=true;reason=result.reason;updateGrammarProgress();break;}
  }
  updateGrammarProgress();
 }
 grammarRunning=false;persistNow();updateGrammarProgress();
 const remaining=notesNeedingGrammar().length;
 if(grammarPaused)status('Revisão pausada: '+reason+' Use Retomar revisão para continuar.','error');
 else if(failed||remaining){
  grammarPaused=true;updateGrammarProgress();
  status('Faltam '+remaining+' anotações para revisar. Texto original preservado.','error');
 }else status('Revisão das anotações antigas concluída: '+grammarDone+' textos conferidos.','success');
}
function saveEditor(advance=true,insertLine=false){
 if(!editing)return;
 const priorLine=editing.line;
 const typed=String($('nbEditorText')?.value||'').replace(/\r\n?/g,'\n').trimEnd();
 const unchanged=editing.id?page().notes.find(n=>n.id===editing.id):null;
 if(unchanged&&typed===unchanged.text){
  const span=Math.max(1,Number(unchanged.span)||1);
  closeEditor();
  if(advance){
   if(insertLine)insertBlankPauta(priorLine+span);
   advanceLine(insertLine?priorLine+span:priorLine+1);
  }
  return;
 }
 const inkMap=reconcileInkMap(editing.draft,editing.inkMap,typed,data.ink);
 const listOnly=listInfo(typed);
 if(listOnly&&!typed.slice(listOnly.prefix.length).trim()){
  const hadNote=!!editing.id;
  if(hadNote&&page().notes.some(n=>n.id===editing.id)){
   checkpoint();page().notes=page().notes.filter(n=>n.id!==editing.id);
   renderPageRail();save();
  }
  data.listStyle='none';closeEditor();refreshTools();
  if(advance){
   const target=insertLine?priorLine+1:priorLine;
   if(insertLine)insertBlankPauta(target,hadNote);
   advanceLine(target);
  }
  return;
 }
 if(!typed.trim()){
  // Texto existente esvaziado deve ser realmente excluído do armazenamento.
  const previousId=editing.id;
  if(previousId&&page().notes.some(n=>n.id===previousId)){
   checkpoint();
   page().notes=page().notes.filter(n=>n.id!==previousId);
   closeEditor();renderPageRail();save();
   status('Anotação apagada. Ctrl+Z desfaz.','success');
  }else closeEditor();
  if(advance){
   if(insertLine)insertBlankPauta(priorLine+1,!!previousId);
   advanceLine(priorLine+1);
  }
  return;
 }
 checkpoint();
 let n=editing.id?page().notes.find(n=>n.id===editing.id):null;
 if(!n){n={id:id(),line:editing.line,text:typed};page().notes.push(n)}
 const normalized=normalizeNoteText(typed),normalizedInk=reconcileInkMap(typed,inkMap,normalized,data.ink);
 const initialInk=normalizedInk[0]||data.ink;
 // Texto reescrito precisa de uma nova revisão, mesmo que já tenha sido conferido.
 delete n.grammarReviewVersion;
 Object.assign(n,{text:normalized,original:typed,font:data.font,size:1,ink:initialInk,
  inkRuns:inkRunsFor(normalized,normalizedInk,initialInk),align:data.align||'left',pending:true,reviewed:false});
 n.span=occupiedSpan(n);makeRoom(n);materializePage();
 const nextLine=editing.line+Math.max(1,Number(n.span)||1);
 const nid=n.id;closeEditor();renderNotes();
 if(advance&&insertLine)insertBlankPauta(nextLine,true);
 save();
 status('Linha registrada; revisão gramatical em andamento…','');
 void correctNote(nid,typed);
 if(advance)advanceLine(insertLine?nextLine:priorLine+1);
}
function renderStickies(){
 $('nbStickyLayer').innerHTML=page().stickies.map(s=>
  '<div class="nb-sticky" data-nb-sticky="'+esc(s.id)+'" data-tone="'+esc(s.tone||'yellow')+
  '" style="left:'+clamp(Number(s.x)||0,90,W-50)+'px;top:'+clamp(Number(s.y)||0,95,H-50)+
  'px;width:'+clamp(Number(s.w)||170,65,460)+'px;height:'+clamp(Number(s.h)||146,65,460)+'px;">'+
  '<div class="nb-sticky-head" data-nb-drag="'+esc(s.id)+'" title="Arraste para mover"><span>✦ Nota adesiva</span>'+
  '<button type="button" data-nb-delete-sticky="'+esc(s.id)+'" title="Remover post-it" aria-label="Remover post-it"'+
  (editEnabled&&selected?.type==='sticky'&&selected.id===s.id?'':' hidden')+'>×</button></div>'+
  '<textarea aria-label="Escreva no post-it" data-nb-sticky-text="'+esc(s.id)+'" maxlength="700" placeholder="Sua observação…"'+(!editEnabled?' readonly':'')+'>'+esc(s.text||'')+'</textarea></div>'
 ).join('');
}
function addSticky(p){
 if(!editEnabled)return;
 checkpoint();const tones=['yellow','pink','violet'],list=page().stickies;
 const n={id:id(),x:clamp(p.x-75,95,W-185),y:clamp(p.y-30,102,H-172),text:'',tone:data.stickyTone||tones[list.length%3]};
 list.push(n);renderStickies();save();
 const field=root.querySelector('[data-nb-sticky-text="'+n.id+'"]');field?.focus({preventScroll:true});
 status('Post-it inserido. Arraste pela parte superior para movê-lo.','success');
}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function smoothPoints(points){
 if(points.length<4)return points.slice();
 let pts=points.filter((p,i)=>i===0||i===points.length-1||i%2===0).map(p=>({x:p.x,y:p.y}));
 for(let round=0;round<2;round++){
  const out=[pts[0]];
  for(let i=0;i<pts.length-1;i++){
   const a=pts[i],b=pts[i+1];
   out.push({x:.75*a.x+.25*b.x,y:.75*a.y+.25*b.y},{x:.25*a.x+.75*b.x,y:.25*a.y+.75*b.y});
  }
  out.push(pts[pts.length-1]);pts=out;
 }
 return pts;
}
function rectangleScore(points,minX,maxX,minY,maxY){
 const tol=Math.max(4,Math.min(maxX-minX,maxY-minY)*.07),near=points.filter(p=>Math.min(Math.abs(p.x-minX),Math.abs(p.x-maxX),Math.abs(p.y-minY),Math.abs(p.y-maxY))<tol).length;
 return near/Math.max(1,points.length);
}
function perfectShape(raw){
 const points=raw.slice(),a=points[0],b=points[points.length-1];
 let minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x));
 let minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y));
 const w=maxX-minX,h=maxY-minY,diagonal=Math.hypot(w,h);
 if(diagonal<9)return {points:smoothPoints(points),kind:'curve'};
 const closed=dist(a,b)<Math.max(20,diagonal*.16)&&points.length>9;
 if(closed&&w>24&&h>24){
  if(rectangleScore(points,minX,maxX,minY,maxY)>.83){
   const corners=[{x:minX,y:minY},{x:maxX,y:minY},{x:maxX,y:maxY},{x:minX,y:maxY},{x:minX,y:minY}];
   const rect=[];
   for(let j=0;j<corners.length-1;j++)for(let n=0;n<13;n++)rect.push({x:corners[j].x+(corners[j+1].x-corners[j].x)*n/12,y:corners[j].y+(corners[j+1].y-corners[j].y)*n/12});
   return {points:rect,kind:'rectangle'};
  }
  const cx=(minX+maxX)/2,cy=(minY+maxY)/2,ratio=w/h,circle=ratio>.78&&ratio<1.25;
  const rx=circle?(w+h)/4:w/2,ry=circle?rx:h/2;
  const ellipse=Array.from({length:81},(_,i)=>({x:cx+rx*Math.cos(i/80*2*Math.PI),y:cy+ry*Math.sin(i/80*2*Math.PI)}));
  return {points:ellipse,kind:circle?'circle':'ellipse'};
 }
 let maxDistance=0;
 for(const p of points){
  const numerator=Math.abs((b.y-a.y)*p.x-(b.x-a.x)*p.y+b.x*a.y-b.y*a.x);
  maxDistance=Math.max(maxDistance,numerator/Math.max(1,dist(a,b)));
 }
 if(dist(a,b)>38&&maxDistance<7){
  return {points:Array.from({length:51},(_,i)=>({x:a.x+(b.x-a.x)*i/50,y:a.y+(b.y-a.y)*i/50})),kind:'line'};
 }
 return {points:smoothPoints(points),kind:'curve'};
}

/* Vector-quality freehand reconstruction. Retains the user's drawn contour:
   resample -> remove sub-pixel noise -> smoothly fitted cubic Bézier curve. */
function fluidStroke(raw){
 const input=(raw||[]).filter(p=>Number.isFinite(p?.x)&&Number.isFinite(p?.y));
 if(input.length<2)return {points:input.slice(),kind:'curve'};
 const first={...input[0]},last={...input[input.length-1]};
 const spaced=[first];
 // Uniform distance sampling avoids different smoothing on fast and slow mouse motions.
 for(let i=1;i<input.length;i++){
  const a=input[i-1],b=input[i],d=dist(a,b),steps=Math.ceil(d/3);
  if(d<.35)continue;
  for(let j=1;j<=steps;j++)spaced.push({x:a.x+(b.x-a.x)*j/steps,y:a.y+(b.y-a.y)*j/steps});
 }
 if(spaced.length<4)return {points:[first,last],kind:'curve'};
 if(spaced.length>1500){
  const step=Math.ceil(spaced.length/1500);
  const reduced=spaced.filter((_,i)=>i%step===0);
  reduced.push(last);spaced.splice(0,spaced.length,...reduced);
 }
 let filtered=spaced;
 const weights=[1,3,6,3,1],sum=14;
 for(let round=0;round<4;round++){
  filtered=filtered.map((p,i,arr)=>{
   if(i===0)return first;
   if(i===arr.length-1)return last;
   let x=0,y=0;
   for(let k=-2;k<=2;k++){
    const v=arr[clamp(i+k,0,arr.length-1)],weight=weights[k+2];
    x+=v.x*weight;y+=v.y*weight;
   }
   return {x:x/sum,y:y/sum};
  });
 }
 // Preserve the silhouette: anchors are never snapped to a predefined shape.
 const anchors=[filtered[0]];
 for(let i=4;i<filtered.length-1;i+=4)anchors.push(filtered[i]);
 anchors.push(last);
 if(anchors.length<3)return {points:anchors,kind:'curve'};
 const finished=[anchors[0]];
 for(let i=0;i<anchors.length-1;i++){
  const p0=anchors[Math.max(0,i-1)],p1=anchors[i],
   p2=anchors[i+1],p3=anchors[Math.min(anchors.length-1,i+2)];
  const c1={x:p1.x+(p2.x-p0.x)/6,y:p1.y+(p2.y-p0.y)/6};
  const c2={x:p2.x-(p3.x-p1.x)/6,y:p2.y-(p3.y-p1.y)/6};
  const samples=clamp(Math.ceil(dist(p1,p2)/1.9),3,16);
  for(let j=1;j<=samples;j++){
   const t=j/samples,u=1-t;
   finished.push({
    x:clamp(u*u*u*p1.x+3*u*u*t*c1.x+3*u*t*t*c2.x+t*t*t*p2.x,0,W),
    y:clamp(u*u*u*p1.y+3*u*u*t*c1.y+3*u*t*t*c2.y+t*t*t*p2.y,0,H)
   });
  }
 }
 finished[0]=first;finished[finished.length-1]=last;
 return {points:finished.slice(0,2400),kind:'fluid'};
}


/* Ajuste inteligente do desenho: reconhecer somente geometrias plausíveis.
   Os demais desenhos continuam livres, apenas com suavização vetorial. */
function smartStroke(raw){
 const input=(raw||[]).filter(p=>Number.isFinite(p?.x)&&Number.isFinite(p?.y));
 const smooth=fluidStroke(input),points=smooth.points;
 if(points.length<4)return smooth;
 const first=points[0],last=points[points.length-1];
 let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
 for(const p of points){minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);}
 const width=maxX-minX,height=maxY-minY,diag=Math.hypot(width,height);
 if(diag<14)return smooth;
 const closed=input.length>12&&dist(first,last)<Math.max(13,diag*.12);
 if(closed){
  if(width>27&&height>27&&rectangleScore(points,minX,maxX,minY,maxY)>.82){
   const shape=perfectShape(points);
   if(shape.kind==='rectangle')return shape;
  }
  if(width>28&&height>28){
   const cx=(minX+maxX)/2,cy=(minY+maxY)/2,rx=width/2,ry=height/2;
   let rms=0,max=0;
   for(const p of points){
    const e=Math.abs(Math.hypot((p.x-cx)/rx,(p.y-cy)/ry)-1);
    rms+=e*e;max=Math.max(max,e);
   }
   if(Math.sqrt(rms/points.length)<.103&&max<.26){
    let angle=Math.atan2((first.y-cy)/ry,(first.x-cx)/rx),sweep=0;
    const initial=angle;
    for(const p of points.slice(1)){
     const next=Math.atan2((p.y-cy)/ry,(p.x-cx)/rx);
     let change=next-angle;
     while(change>Math.PI)change-=2*Math.PI;
     while(change< -Math.PI)change+=2*Math.PI;
     sweep+=change;angle=next;
    }
    if(Math.abs(sweep)>4.8){
     const circle=rx/ry>.82&&rx/ry<1.22,r=circle?(rx+ry)/2:0;
     return {points:Array.from({length:129},(_,i)=>{
      const t=initial+Math.sign(sweep)*2*Math.PI*i/128;
      return {x:cx+(circle?r:rx)*Math.cos(t),y:cy+(circle?r:ry)*Math.sin(t)};
     }),kind:circle?'circle':'ellipse'};
    }
   }
  }
  // Ramer–Douglas–Peucker com o contorno fechado separado em duas metades.
  function reduce(segment,tolerance){
   if(segment.length<=2)return segment;
   const a=segment[0],b=segment[segment.length-1],dx=b.x-a.x,dy=b.y-a.y;
   let best=-1,at=-1;
   for(let i=1;i<segment.length-1;i++){
    const p=segment[i],t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/Math.max(.001,dx*dx+dy*dy),0,1);
    const d=Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);
    if(d>best){best=d;at=i;}
   }
   if(best<=tolerance)return [a,b];
   return reduce(segment.slice(0,at+1),tolerance).slice(0,-1).concat(reduce(segment.slice(at),tolerance));
  }
  const far=points.reduce((best,p,i)=>dist(p,first)>dist(points[best],first)?i:best,0);
  if(far>3&&far<points.length-4){
   const tol=Math.max(3.6,diag*.028);
   const vertices=reduce(points.slice(0,far+1),tol).slice(0,-1)
    .concat(reduce(points.slice(far).concat([first]),tol).slice(0,-1));
   if(vertices.length>=3&&vertices.length<=9){
    let corners=0;
    for(let i=0;i<vertices.length;i++){
     const p=vertices[i],a=vertices[(i+vertices.length-1)%vertices.length],b=vertices[(i+1)%vertices.length];
     const ux=p.x-a.x,uy=p.y-a.y,vx=b.x-p.x,vy=b.y-p.y;
     const angle=Math.acos(clamp((ux*vx+uy*vy)/Math.max(.001,Math.hypot(ux,uy)*Math.hypot(vx,vy)),-1,1));
     if(angle>.83)corners++;
    }
    if(corners>=3){
     const ideal=[];
     for(let i=0;i<vertices.length;i++){
      const a=vertices[i],b=vertices[(i+1)%vertices.length],count=Math.max(3,Math.ceil(dist(a,b)/3));
      for(let j=0;j<count;j++)ideal.push({x:a.x+(b.x-a.x)*j/count,y:a.y+(b.y-a.y)*j/count});
     }
     ideal.push({...vertices[0]});
     return {points:ideal,kind:'polygon'};
    }
   }
  }
  return smooth;
 }
 const dx=last.x-first.x,dy=last.y-first.y,chord=Math.hypot(dx,dy);
 if(chord>30){
  let maximum=0,variance=0,length=0;
  for(let i=0;i<points.length;i++){
   const p=points[i],e=Math.abs(dx*(p.y-first.y)-dy*(p.x-first.x))/chord;
   maximum=Math.max(maximum,e);variance+=e*e;
   if(i)length+=dist(points[i-1],p);
  }
  if(maximum<Math.max(5.5,chord*.045)&&Math.sqrt(variance/points.length)<Math.max(2.8,chord*.022)&&length/chord<1.13){
   const n=Math.ceil(chord/3);
   return {points:Array.from({length:n+1},(_,i)=>({x:first.x+dx*i/n,y:first.y+dy*i/n})),kind:'line'};
  }
 }
 if(points.length>9){
  // Ajuste algébrico de círculo por mínimos quadrados para arcos abertos.
  let mx=0,my=0;
  for(const p of points){mx+=p.x;my+=p.y;}mx/=points.length;my/=points.length;
  let xx=0,xy=0,yy=0,xz=0,yz=0;
  for(const p of points){
   const x=p.x-mx,y=p.y-my,z=x*x+y*y;
   xx+=x*x;xy+=x*y;yy+=y*y;xz+=x*z;yz+=y*z;
  }
  const determinant=xx*yy-xy*xy;
  if(determinant>Math.max(1,xx*yy*.00001)){
   const cx=mx+(xz*yy-yz*xy)/(2*determinant),cy=my+(yz*xx-xz*xy)/(2*determinant);
   let radius=0;
   for(const p of points)radius+=Math.hypot(p.x-cx,p.y-cy);
   radius/=points.length;
   let errors=0,maximum=0;
   for(const p of points){
    const e=Math.abs(Math.hypot(p.x-cx,p.y-cy)-radius);
    errors+=e*e;maximum=Math.max(maximum,e);
   }
   const initial=Math.atan2(first.y-cy,first.x-cx);
   let previous=initial,sweep=0,totalAngle=0;
   for(const p of points.slice(1)){
    const angle=Math.atan2(p.y-cy,p.x-cx);
    let step=angle-previous;
    while(step>Math.PI)step-=2*Math.PI;
    while(step< -Math.PI)step+=2*Math.PI;
    sweep+=step;totalAngle+=Math.abs(step);previous=angle;
   }
   if(radius>13&&radius<diag*4.5&&Math.abs(sweep)>.58&&Math.abs(sweep)<5.7&&
      Math.abs(sweep)/Math.max(.001,totalAngle)>.85&&
      Math.sqrt(errors/points.length)<Math.max(3.7,diag*.035)&&maximum<Math.max(8,diag*.09)){
    const n=clamp(Math.ceil(radius*Math.abs(sweep)/2.5),36,220);
    return {points:Array.from({length:n+1},(_,i)=>{
     const angle=initial+sweep*i/n;
     return {x:cx+radius*Math.cos(angle),y:cy+radius*Math.sin(angle)};
    }),kind:'arc'};
   }
  }
 }
 if(chord>45&&points.length>8){
  // Uma curva ampla não circular pode ser idealizada por uma Bézier quadrática.
  let totalLength=0;const lengths=[0];
  for(let i=1;i<points.length;i++){totalLength+=dist(points[i-1],points[i]);lengths.push(totalLength);}
  if(totalLength>chord*1.12&&totalLength<chord*2.6){
   let sumX=0,sumY=0,sumWeights=0;
   for(let i=1;i<points.length-1;i++){
    const t=lengths[i]/totalLength,u=1-t,w=2*u*t,p=points[i];
    sumX+=w*(p.x-u*u*first.x-t*t*last.x);
    sumY+=w*(p.y-u*u*first.y-t*t*last.y);
    sumWeights+=w*w;
   }
   if(sumWeights>.01){
    const c={x:sumX/sumWeights,y:sumY/sumWeights};
    let error=0,maximum=0;
    for(let i=0;i<points.length;i++){
     const t=lengths[i]/totalLength,u=1-t,p=points[i];
     const ex=u*u*first.x+2*u*t*c.x+t*t*last.x-p.x;
     const ey=u*u*first.y+2*u*t*c.y+t*t*last.y-p.y;
     const d=Math.hypot(ex,ey);error+=d*d;maximum=Math.max(maximum,d);
    }
    const bend=Math.abs(dx*(c.y-first.y)-dy*(c.x-first.x))/chord;
    if(Math.sqrt(error/points.length)<diag*.043&&maximum<diag*.11&&bend>chord*.13){
     return {points:Array.from({length:101},(_,i)=>{
      const t=i/100,u=1-t;
      return{x:u*u*first.x+2*u*t*c.x+t*t*last.x,y:u*u*first.y+2*u*t*c.y+t*t*last.y};
     }),kind:'bezier'};
    }
   }
  }
 }
 return smooth;
}
function paintStroke(points,color,width,curved=false){
 if(!points?.length)return;
 ctx.beginPath();ctx.lineWidth=width||2.5;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=COLORS[color]||COLORS.blue;
 ctx.moveTo(points[0].x,points[0].y);
 if(points.length===1)ctx.lineTo(points[0].x+.05,points[0].y+.05);
 if(curved&&points.length>2){
  for(let i=1;i<points.length-1;i++){
   const mid={x:(points[i].x+points[i+1].x)/2,y:(points[i].y+points[i+1].y)/2};
   ctx.quadraticCurveTo(points[i].x,points[i].y,mid.x,mid.y);
  }
  ctx.lineTo(points[points.length-1].x,points[points.length-1].y);
 }else for(let i=1;i<points.length;i++)ctx.lineTo(points[i].x,points[i].y);
 ctx.stroke();
}
function drawCanvas(){
 const dpr=Math.min(2,window.devicePixelRatio||1);
 if(canvas.width!==Math.round(W*dpr)||canvas.height!==Math.round(H*dpr)){
  canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);
 }
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
 page().strokes.forEach((s,i)=>{
  paintStroke(s.points,s.ink,Number(s.width)||2.6,!!s.corrected&&!['line','polygon','rectangle'].includes(s.kind));
  if(data.mode!=='warp'&&selected?.type==='stroke'&&selected.id===s.id){
   ctx.lineWidth=1;ctx.strokeStyle='#8065b7';ctx.setLineDash([5,4]);
   const p=s.points;
   if(p.length){ctx.strokeRect(p.reduce((n,x)=>Math.min(n,x.x),W)-5,p.reduce((n,x)=>Math.min(n,x.y),H)-5,
    p.reduce((n,x)=>Math.max(n,x.x),0)-p.reduce((n,x)=>Math.min(n,x.x),W)+10,
    p.reduce((n,x)=>Math.max(n,x.y),0)-p.reduce((n,x)=>Math.min(n,x.y),H)+10);}
   ctx.setLineDash([]);
  }
 });
 if(drawPoints?.length)paintStroke(drawPoints,data.ink,2.6);
}

/* A borracha altera somente as linhas do desenho. A cada trecho cortado,
   preserva os fragmentos remanescentes como traços editáveis e desfazíveis. */
function pointSegmentDistance(p,a,b){
 const dx=b.x-a.x,dy=b.y-a.y,t=clamp(
  ((p.x-a.x)*dx+(p.y-a.y)*dy)/Math.max(.00001,dx*dx+dy*dy),0,1);
 return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);
}
function pointNearStroke(pos,stroke,radius){
 const points=stroke.points||[],width=(Number(stroke.width)||2.6)/2;
 if(!points.length)return false;
 if(points.length===1)return dist(pos,points[0])<=radius+width;
 for(let i=1;i<points.length;i++)
  if(pointSegmentDistance(pos,points[i-1],points[i])<=radius+width)return true;
 return false;
}
function cutStrokeAt(stroke,pos,radius){
 const points=stroke.points||[];
 if(points.length<2)return [];
 const samples=[{...points[0]}];
 const interval=Math.max(2,Math.min(5,radius/3));
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],steps=Math.ceil(dist(a,b)/interval);
  for(let j=1;j<=steps;j++)samples.push({
   x:a.x+(b.x-a.x)*j/steps,y:a.y+(b.y-a.y)*j/steps
  });
 }
 const chunks=[];let run=[];
 const flush=()=>{if(run.length>=2)chunks.push(run);run=[];};
 const threshold=radius+(Number(stroke.width)||2.6)/2;
 for(const p of samples){
  if(dist(p,pos)<=threshold)flush();else run.push(p);
 }
 flush();
 return chunks.map((points,i)=>({
  ...stroke,id:i===0?stroke.id:id(),points,corrected:false,kind:'free'
 }));
}
function applyEraser(pos){
 const radius=clamp(Number(data.eraserRadius)||14,6,32);
 const original=page().strokes||[];
 const updated=[];let touched=false;
 for(const stroke of original){
  if(!pointNearStroke(pos,stroke,radius)){updated.push(stroke);continue;}
  touched=true;
  if(data.eraserMode==='whole')continue;
  updated.push(...cutStrokeAt(stroke,pos,radius));
 }
 if(!touched)return;
 page().strokes=updated.slice(0,700);
 selected=null;selectedStroke=-1;
 drawCanvas();
}

/* Transform controls modelled on vector editors: eight handles for corners and edges. */
const TRANSFORM_HANDLES=['nw','n','ne','e','se','s','sw','w'];
function itemBounds(type,item){
 if(!item)return null;
 if(type==='sticky')return {
  x:clamp(Number(item.x)||110,0,W),y:clamp(Number(item.y)||180,0,H),
  w:clamp(Number(item.w)||170,40,W),h:clamp(Number(item.h)||146,40,H)
 };
 if(type==='note'){
  const sz=clamp(Number(item.size)||1,1,3);
  return {x:clamp(Number(item.x)||110,0,W),y:START+(Number(item.line)||FIRST_LINE)*L+(Number(item.offsetY)||0),
   w:clamp(Number(item.frameW)||620,70,720)*clamp(Number(item.scaleX)||1,.35,3.8),
   h:sz*L*clamp(Number(item.scaleY)||1,.35,3.8)};
 }
 const points=item.points||[];
 if(!points.length)return null;
 const xs=points.map(p=>p.x),ys=points.map(p=>p.y);
 const x=Math.min(...xs),y=Math.min(...ys);
 return {x,y,w:Math.max(6,Math.max(...xs)-x),h:Math.max(6,Math.max(...ys)-y)};
}
function renderSelectionHandles(){
 const host=$('nbTransformLayer');if(!host)return;
 const item=selectedItem(),rect=selected&&item?itemBounds(selected.type,item):null;
 if(!rect||galleryOpen){
  host.innerHTML='';delete host.dataset.selectionKey;return;
 }
 const minW=selected.type==='stroke'?6:42,minH=selected.type==='stroke'?6:35;
 const x=clamp(rect.x,0,W-minW),y=clamp(rect.y,0,H-minH);
 const width=clamp(rect.w,minW,W-x),height=clamp(rect.h,minH,H-y);
 const molding=data.mode==='warp'&&selected.type==='stroke';
 const key=selected.type+':'+String(item.id)+':'+(molding?'mold':'resize');
 const existing=host.querySelector('.nb-transform-box');
 if(existing&&host.dataset.selectionKey===key){
  existing.style.left=x+'px';existing.style.top=y+'px';
  existing.style.width=width+'px';existing.style.height=height+'px';
  return;
 }
 host.dataset.selectionKey=key;
 host.innerHTML='<div class="nb-transform-box'+(molding?' nb-transform-mold':'')+'" style="left:'+x+'px;top:'+y+'px;width:'+width+
  'px;height:'+height+'px;" role="group" aria-label="'+(molding?'Mover ou moldar desenho':'Redimensionar item selecionado')+'">'+
  (molding?
   '<button class="nb-transform-move" data-nb-move-handle="1" type="button" title="Arraste para mover desenho" aria-label="Mover desenho sem deformar">▣</button>'
    :TRANSFORM_HANDLES.map(dir=>'<button type="button" class="nb-transform-handle nb-handle-'+dir+
   '" data-nb-handle="'+dir+'" aria-label="Redimensionar '+dir+'" title="Arraste para redimensionar"></button>').join(''))+
  '</div>';
}
function startResize(event,dir){
 if(!editEnabled)return;
 const item=selectedItem();
 if(!selected||!item||!TRANSFORM_HANDLES.includes(dir))return;
 const bounds=itemBounds(selected.type,item);if(!bounds)return;
 checkpoint();
 resizeDrag={
  pointerId:event.pointerId,dir,type:selected.type,id:item.id,start:point(event),
  rect:{...bounds},points:selected.type==='stroke'?(item.points||[]).map(p=>({...p})):null,
  initialScaleX:Number(item.scaleX)||1,initialScaleY:Number(item.scaleY)||1,
  initialY:Number(item.offsetY)||0
 };
 sheet.setPointerCapture?.(event.pointerId);
 event.preventDefault();
}
function transformRect(bounds,dir,dx,dy){
 let left=bounds.x,top=bounds.y,right=bounds.x+bounds.w,bottom=bounds.y+bounds.h;
 if(dir.includes('w'))left+=dx;
 if(dir.includes('e'))right+=dx;
 if(dir.includes('n'))top+=dy;
 if(dir.includes('s'))bottom+=dy;
 const min=dir.length===1?24:30;
 if(right-left<min){
  if(dir.includes('w'))left=right-min;else right=left+min;
 }
 if(bottom-top<min){
  if(dir.includes('n'))top=bottom-min;else bottom=top+min;
 }
 left=clamp(left,0,W-min);right=clamp(right,left+min,W);
 top=clamp(top,0,H-min);bottom=clamp(bottom,top+min,H);
 return {x:left,y:top,w:right-left,h:bottom-top};
}
function updateResize(event){
 const drag=resizeDrag;
 if(!drag||drag.pointerId!==event.pointerId)return;
 const item=selectedItem();if(!item||item.id!==drag.id)return;
 const p=point(event);
 const b=transformRect(drag.rect,drag.dir,p.x-drag.start.x,p.y-drag.start.y);
 if(drag.type==='stroke'){
  item.points=drag.points.map(q=>({
   x:clamp(b.x+(q.x-drag.rect.x)/Math.max(1,drag.rect.w)*b.w,0,W),
   y:clamp(b.y+(q.y-drag.rect.y)/Math.max(1,drag.rect.h)*b.h,0,H)
  }));
  // Uniformly affine-transformed path stays editable.
  drawCanvas();renderSelectionHandles();
 }else if(drag.type==='sticky'){
  item.x=b.x;item.y=b.y;item.w=b.w;item.h=b.h;
  const el=root.querySelector('[data-nb-sticky="'+item.id+'"]');
  if(el){Object.assign(el.style,{left:b.x+'px',top:b.y+'px',width:b.w+'px',height:b.h+'px'});}
 }else{
  item.x=b.x;
  const rawWidth=clamp(Number(item.frameW)||620,70,720);
  item.scaleX=clamp(b.w/rawWidth,.35,3.8);
  item.scaleY=1; // Arrastar uma alça não amplia a altura das letras além de uma pauta.
  item.offsetY=drag.initialY+b.y-drag.rect.y;
  renderNotes();
 }
 renderSelectionHandles();
 event.preventDefault();
}
function finishResize(event){
 if(!resizeDrag||(event&&event.pointerId!==resizeDrag.pointerId))return;
 resizeDrag=null;renderSelectionHandles();save();
 status('Tamanho atualizado. Ctrl+Z desfaz a transformação.','success');
}
function startPan(event){
 panDrag={pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,
  x:panOffset.x,y:panOffset.y,moved:false,mode:data.mode,button:event.button};
 const capture=event.target.closest?.('#nbCompanionWrap')||sheet;
 capture.setPointerCapture?.(event.pointerId);
 event.preventDefault();
}
function setPan(x,y){
 panOffset.x=x;panOffset.y=y;
 stage.style.transform='translate('+x+'px,'+y+'px)';
}

function startMoveDrag(event,type,item){
 if(!editEnabled||!item)return;
 const p=point(event);
 moveDrag={
  pointerId:event.pointerId,type,id:item.id,
  start:p,startClient:{x:event.clientX,y:event.clientY},moved:false,
  originLine:Number(item.line)||FIRST_LINE,
  originX:Number(item.x)||(type==='note'?110:0),originY:Number(item.y)||0,
  originalPoints:type==='stroke'?(item.points||[]).map(x=>({...x})):null
 };
 sheet.setPointerCapture?.(event.pointerId);
 event.preventDefault();
}
function updateMoveDrag(event){
 const drag=moveDrag;if(!drag||drag.pointerId!==event.pointerId)return;
 const p=point(event),dx=p.x-drag.start.x,dy=p.y-drag.start.y;
 drag.last=p;
 if(!drag.moved&&Math.hypot(dx,dy)<5)return;
 if(!drag.moved){checkpoint();drag.moved=true;}
 const item=selectedItem();
 if(!item||item.id!==drag.id)return;
 if(drag.type==='stroke'){
  item.points=drag.originalPoints.map(q=>({
   x:clamp(q.x+dx,0,W),y:clamp(q.y+dy,0,H)
  }));
  drawCanvas();renderSelectionHandles();
 }else if(drag.type==='sticky'){
  item.x=clamp(drag.originX+dx,88,W-(Number(item.w)||170));
  item.y=clamp(drag.originY+dy,95,H-(Number(item.h)||146));
  const el=root.querySelector('[data-nb-sticky="'+item.id+'"]');
  if(el){el.style.left=item.x+'px';el.style.top=item.y+'px';}
  renderSelectionHandles();
 }else if(drag.type==='note'){
  const el=root.querySelector('[data-nb-note="'+item.id+'"]');
  if(el)el.style.transform='translate(0px,'+(Math.round(dy/L)*L)+'px) scale('+(Number(item.scaleX)||1)+','+(Number(item.scaleY)||1)+')';
 }
 event.preventDefault();
}
function finishMoveDrag(event){
 if(!moveDrag||(event&&moveDrag.pointerId!==event.pointerId))return;
 const drag=moveDrag;moveDrag=null;
 if(!drag.moved)return;
 const item=selectedItem();
 if(!item)return;
 if(drag.type==='note'){
  const delta=Math.round(((drag.last||drag.start).y-drag.start.y)/L);
  const span=Math.max(1,Number(item.span)||1);
  const maxLine=Math.max(0,ROWS-span);
  const intended=clamp(drag.originLine+delta,0,maxLine);
  const collides=line=>page().notes.some(n=>n.id!==item.id&&
    line<(Number(n.line)||0)+Math.max(1,Number(n.span)||1)&&line+span>Number(n.line));
  let chosen=intended;
  if(collides(chosen)){
   const available=Array.from({length:maxLine+1},(_,i)=>i)
    .filter(line=>!collides(line))
    .sort((a,b)=>Math.abs(a-intended)-Math.abs(b-intended));
   chosen=available.length?available[0]:drag.originLine;
  }
  item.line=chosen;
  /* O arraste do texto não altera sua margem horizontal. */
 }
 selected=null;selectedStroke=-1;
 serializable();renderNotes();renderStickies();drawCanvas();refreshTools();renderSelectionHandles();save();
 status('Item movido. Use Ctrl+Z para desfazer.','success');
}

function pointerDownCanvas(event){
 if(!editEnabled)return;
 if(event.button!==0||event.pointerType==='touch'&&pinch)return;
 const p=point(event);
 if(data.mode==='select'){
  const hit=findStrokeNear(p);
  if(hit.stroke){selectItem('stroke',hit.stroke.id);startMoveDrag(event,'stroke',hit.stroke);}
  else {selected=null;renderNotes();renderStickies();drawCanvas();startPan(event);}
  return;
 }
 if(data.mode==='erase'){
  checkpoint();eraseDrag={pointerId:event.pointerId};
  canvas.setPointerCapture?.(event.pointerId);applyEraser(p);
  event.preventDefault();return;
 }
 if(data.mode==='draw'){
  checkpoint();drawPoints=[p];canvas.setPointerCapture?.(event.pointerId);
  drawCanvas();event.preventDefault();
 }else if(data.mode==='warp'){
  const hit=findStrokeNear(p);
  if(hit.stroke){
   selectItem('stroke',hit.stroke.id);selectedStroke=hit.index;
   startWarpDrag(event,hit.stroke,hit.index,hit.anchor);
  }else{
   selected=null;selectedStroke=-1;drawCanvas();renderSelectionHandles();event.preventDefault();
  }
 }
}
function pointerMoveCanvas(event){
 if(eraseDrag&&eraseDrag.pointerId===event.pointerId){applyEraser(point(event));event.preventDefault();return;}
 if(moveDrag&&moveDrag.pointerId===event.pointerId&&moveDrag.type==='stroke'){updateMoveDrag(event);event.preventDefault();return;}
 if(drawPoints){drawPoints.push(point(event));drawCanvas();event.preventDefault();}
 if(warpDrag&&warpDrag.pointerId===event.pointerId){
  const p=point(event),dx=p.x-warpDrag.from.x,dy=p.y-warpDrag.from.y;
  if(!warpDrag.moved&&Math.hypot(dx,dy)<1.5)return;
  const stroke=page().strokes.find(s=>s.id===warpDrag.id);
  if(!stroke){warpDrag=null;return;}
  if(!warpDrag.moved){checkpoint();warpDrag.moved=true;}
  stroke.points=warpDrag.original.map(q=>{
   const weight=Math.exp(-Math.pow(dist(q,warpDrag.center)/83,2)*1.3);
   return{x:clamp(q.x+dx*weight,5,W-5),y:clamp(q.y+dy*weight,5,H-5)};
  });
  drawCanvas();renderSelectionHandles();event.preventDefault();return;
 }
}
function pointerUpCanvas(event){
 if(eraseDrag){eraseDrag=null;serializable();renderNotes();save();status('Desenho apagado. Use Ctrl+Z para desfazer.','success');}
 if(moveDrag&&moveDrag.type==='stroke'){finishMoveDrag(event);}
 if(drawPoints){
  const raw=drawPoints;drawPoints=null;
  if(raw.length){
   const result=data.smooth?smartStroke(raw):{points:raw,kind:'free'};
   page().strokes.push({id:id(),points:result.points,corrected:!!data.smooth,kind:result.kind,ink:data.ink,width:2.6});
   save();status(data.smooth?
    ({arc:'Arco corrigido.',bezier:'Curva ajustada.',circle:'Círculo corrigido.',
      ellipse:'Elipse corrigida.',rectangle:'Retângulo corrigido.',polygon:'Polígono corrigido.',
      line:'Linha endireitada.',fluid:'Desenho suavizado.'}[result.kind]||'Desenho ajustado.')+
    ' Pode usar Deformar.':'Traço livre inserido.','success');
  }
 }
 if(warpDrag&&(!event||event.pointerId===warpDrag.pointerId)){
  const changed=warpDrag.moved;warpDrag=null;renderSelectionHandles();
  if(changed){save();status('Desenho moldado. Ctrl+Z desfaz.','success');}
 }
 drawCanvas();
}

/* A escrita acontece no papel; Enter conclui a linha e posiciona o cursor na próxima. */
/* Inserir uma pauta sem sobrescrever o texto seguinte; o excedente segue na próxima folha. */
function insertBlankPauta(line,alreadyCheckpointed=false){
 const firstPage=line>=ROWS?data.page+1:data.page;
 const firstLine=line>=ROWS?FIRST_LINE:Math.max(FIRST_LINE,line);
 if(firstPage>=250){status('O caderno atingiu o limite de folhas.','error');return false;}
 const staging=new Map();
 let carry=[],shifted=false,finished=false;
 for(let index=firstPage;index<250;index++){
  const source=index<data.pages.length?data.pages[index]:(index===data.page?pendingPage:null);
  const notes=(source?.notes||[]).map(n=>({...n}));
  if(index===firstPage){
   for(const note of notes){
    if(Number(note.line)>=firstLine){note.line=Number(note.line)+1;shifted=true;}
   }
  }
  if(carry.length){
   const used=Math.max(...carry.map(n=>Number(n.line)+Math.max(1,Number(n.span)||1)))-FIRST_LINE;
   for(const note of notes)note.line=Number(note.line)+used;
   notes.push(...carry);shifted=true;
  }
  notes.sort((a,b)=>Number(a.line)-Number(b.line));
  const overflow=notes.filter(n=>Number(n.line)+Math.max(1,Number(n.span)||1)>ROWS);
  staging.set(index,notes.filter(n=>!overflow.includes(n)));
  if(!overflow.length){finished=true;break;}
  let end=FIRST_LINE;
  const first=Number(overflow[0].line);
  carry=overflow.map(note=>{
   const target=Math.max(end,FIRST_LINE+Number(note.line)-first);
   end=target+Math.max(1,Number(note.span)||1);
   return {...note,line:target};
  });
 }
 if(!finished){status('Sem espaço suficiente para inserir uma linha sem perder texto.','error');return false;}
 if(!shifted)return true;
 if(!alreadyCheckpointed)checkpoint();
 for(const [index,notes] of staging){
  if(index<data.pages.length)data.pages[index].notes=notes;
  else if(index===data.page)pendingPage.notes=notes;
  else{
   while(data.pages.length<index)data.pages.push(emptyPage());
   data.pages.push({...emptyPage(),notes});
  }
 }
 materializePage();
 renderNotes();renderBookSpread();renderPageRail();save();
 return true;
}
/* Backspace em pauta vazia desfaz o espaço aberto pelo Enter:
   sobe uma pauta apenas o texto abaixo, sem apagar nem mover o que está acima.
   Não mexe em post-its, desenhos, datas ou anotações de outras folhas. */
function removeBlankPauta(line,alreadyCheckpointed=false){
 if(!editEnabled||data.mode!=='text'||line<FIRST_LINE||line>=ROWS)return false;
 const notes=page().notes;
 // Uma pauta ocupada (inclusive por uma anotação de várias linhas) não é vazia.
 if(notes.some(n=>Number(n.line)<=line&&
    Number(n.line)+Math.max(1,Number(n.span)||1)>line))return false;
 const below=notes.filter(n=>Number(n.line)>line);
 if(!below.length)return false;
 if(!alreadyCheckpointed)checkpoint();
 for(const note of below)note.line=Number(note.line)-1;
 renderNotes();renderBookSpread();renderPageRail();save();
 return true;
}
function previousWritingLine(){
 if(!editing||data.mode!=='text'||!editEnabled)return;
 const input=$('nbEditorText');
 if(!input)return;
 const typed=String(input.value||'');
 const marker=listInfo(typed);
 if(typed.trim()&&!(marker&&!typed.slice(marker.prefix.length).trim()))return;
 const at=editing.line;
 // Apagar uma anotação esvaziada e recolher a pauta deve ser um único Ctrl+Z.
 const hadNote=!!editing.id&&page().notes.some(n=>n.id===editing.id);
 if(editing.id)saveEditor(false);
 else closeEditor();
 const removed=removeBlankPauta(at,hadNote);
 if(removed)status('Pauta vazia removida. Ctrl+Z desfaz.','success');
 if(at>FIRST_LINE){beginEdit(at-1);return;}
 if(data.page>0){
  data.page--;pendingPage=emptyPage();renderPage();renderPageRail();
  const previous=page().notes.filter(n=>Number(n.line)<ROWS)
   .sort((a,b)=>Number(b.line)-Number(a.line))[0];
  beginEdit(previous?Number(previous.line):ROWS-1);
  save();
 }else beginEdit(FIRST_LINE);
}
function advanceLine(to){
 if(to>=ROWS){
  if(data.page+1>=250){status('Limite de folhas do caderno atingido.','error');return;}
  data.page++;pendingPage=emptyPage();selected=null;selectedStroke=-1;
  renderPage();renderPageRail();
  view.scrollTop=0;view.scrollLeft=0;
  save();beginEdit(FIRST_LINE);return;
 }
 let line=Math.max(FIRST_LINE,to);
 for(let i=0;i<ROWS;i++){
  const occupied=page().notes.find(n=>line>=Number(n.line)&&line<Number(n.line)+Number(n.span||Number(n.size)||1));
  if(!occupied)break;
  line=Math.max(line+1,Number(occupied.line)+Number(occupied.span||2));
  if(line>=ROWS)return advanceLine(ROWS);
 }
 beginEdit(line);
}
function switchBook(bookId,fromHistory=false){
 if(!data.books.some(b=>b.id===bookId))return;
 if(editing)saveEditor(false);
 checkpoint();data.bookId=bookId;data.pages=activeBook().pages;data.page=0;
 setPan(0,0);
 pendingPage=emptyPage();selected=null;galleryOffset=0;
 renderPage();renderDrawer();renderPageRail();if(galleryOpen)renderGallery();
 if(!shelfOpen){editEnabled=false;data.mode='none';syncNotebookUI();}
 save();closeDrawer();
 if(!fromHistory){
  try{history.pushState({uentzoulNotebook:'book',bookId},'', '#caderno='+encodeURIComponent(bookId));}catch(_){}
 }
}
function renderDrawer(){
 const host=$('nbDrawer');if(!host)return;
 host.innerHTML=
  '<div class="nb-drawer-top"><div><span class="nb-drawer-eyebrow">Biblioteca pessoal</span><strong>Meus cadernos</strong></div>'+
  '<button type="button" data-nb-action="closeDrawer" aria-label="Fechar cadernos">×</button></div>'+
  '<div class="nb-book-list">'+data.books.map((book,i)=>
    '<button class="nb-book-row '+(book.id===data.bookId?'active':'')+'" data-nb-book="'+esc(book.id)+'" aria-label="Abrir caderno '+esc(book.name)+'">'+
     '<span class="nb-book-cover" data-cover="'+(i%6)+'" style="--nb-book-cover:'+bookColor(book)+'"><span class="nb-cover-spine" aria-hidden="true"></span>'+
     '<span class="nb-cover-title">'+esc(book.name)+'</span><span class="nb-cover-foot">PSICOMOODLE</span></span>'+
     '<span class="nb-book-details"><strong>'+esc(book.name)+'</strong><small>'+book.pages.length+' '+
     (book.pages.length===1?'folha salva':'folhas salvas')+'</small></span></button>'
   ).join('')+'</div>'+
  '<div class="nb-book-form"><label for="nbNewBook">Adicionar caderno</label><div>'+
  '<input id="nbNewBook" maxlength="70" placeholder="Nome da disciplina" autocomplete="off">'+
  '<button type="button" data-nb-action="addBook">Criar</button></div></div>'+
  '<div class="nb-book-form"><label for="nbRenameBook">Renomear caderno atual</label><div>'+
  '<input id="nbRenameBook" maxlength="70" value="'+esc(activeBook().name)+'">'+
  '<button type="button" data-nb-action="renameBook">Salvar</button></div></div>'+
  '<p class="nb-drawer-note">Cada capa corresponde a um caderno diferente. As folhas são salvas neste navegador.</p>';
 requestAnimationFrame(()=>fitCoverTitles());
}
function fitCoverTitles(){
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
 if(!ctx)return;
 for(const title of document.querySelectorAll('.nb-cover-title,.nb-shelf-title')){
  const source=String(title.textContent||'').trim();
  const words=source.split(/\s+/).filter(Boolean),available=Math.max(65,title.clientWidth-3);
  const onShelf=title.classList.contains('nb-shelf-title');
  let chosen=onShelf?21:14;
  // A palavra inteira precisa caber; o navegador nunca fica autorizado a dividi-la.
  for(let px=onShelf?21:14;px>=(onShelf?10:8.5);px-=.5){
   ctx.font='850 '+px+'px system-ui';
   const widest=Math.max(0,...words.map(word=>ctx.measureText(word).width));
   const total=ctx.measureText(source).width;
   const estimatedLines=Math.max(1,Math.ceil(total/available));
   if(widest<=available-2&&estimatedLines*px*1.23<=(onShelf?156:100)){chosen=px;break}
   chosen=px;
  }
  title.style.fontSize=chosen+'px';
  title.style.overflowWrap='normal';
  title.style.wordBreak='keep-all';
  title.style.hyphens='none';
 }
}

/* A miniatura usa a geometria real da folha, nunca uma transcrição resumida. */
function snapshotSvg(p){
 const fmt=v=>clamp(Number(v)||0,-5000,5000).toFixed(2);
 const shapes=(p.strokes||[]).map(st=>{
  const pts=st.points||[];if(!pts.length)return '';
  let d='M '+fmt(pts[0].x)+' '+fmt(pts[0].y);
  if(pts.length===1)d+=' L '+fmt(pts[0].x+.05)+' '+fmt(pts[0].y+.05);
  else if(st.corrected&&!['line','polygon','rectangle'].includes(st.kind)&&pts.length>2){
   for(let i=1;i<pts.length-1;i++){
    const mid={x:(pts[i].x+pts[i+1].x)/2,y:(pts[i].y+pts[i+1].y)/2};
    d+=' Q '+fmt(pts[i].x)+' '+fmt(pts[i].y)+' '+fmt(mid.x)+' '+fmt(mid.y);
   }
   d+=' L '+fmt(pts[pts.length-1].x)+' '+fmt(pts[pts.length-1].y);
  }else for(let i=1;i<pts.length;i++)d+=' L '+fmt(pts[i].x)+' '+fmt(pts[i].y);
  return '<path d="'+d+'" stroke="'+(COLORS[st.ink]||COLORS.blue)+'" stroke-width="'+
   clamp(Number(st.width)||2.6,.5,24)+'" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
 }).join('');
 return '<svg class="nb-snapshot-drawing" viewBox="0 0 780 1240" aria-hidden="true">'+shapes+'</svg>';
}
function snapshotStickyMarkup(st){
 const x=clamp(Number(st.x)||0,90,W-50),y=clamp(Number(st.y)||0,95,H-50);
 const w=clamp(Number(st.w)||170,65,460),h=clamp(Number(st.h)||146,65,460);
 return '<span class="nb-sticky" data-tone="'+esc(st.tone||'yellow')+
  '" style="left:'+x+'px;top:'+y+'px;width:'+w+'px;height:'+h+'px;">'+
  '<span class="nb-sticky-head"><span>✦ Nota adesiva</span></span>'+
  '<span class="nb-sticky-text-preview">'+esc(st.text||'')+'</span></span>';
}
function snapshotSheetMarkup(p,index,withHover=false){
 const date=p.date?new Date(p.date+'T12:00:00').toLocaleDateString('pt-BR'):'';
 return '<span class="nb-sheet nb-snapshot-sheet '+(index%2===0?'nb-left-page':'nb-right-page')+'" aria-hidden="true">'+
  '<span class="nb-holes">'+Array.from({length:8},()=>'<span></span>').join('')+'</span><span class="nb-binder-zone" aria-hidden="true"></span>'+
  (date?'<span class="nb-paper-date-group nb-has-date"><span class="nb-snapshot-date">'+esc(date)+'</span></span>':'')+
  (withHover?'<span class="nb-line-hover" id="nbCompanionLineHover" hidden aria-hidden="true"></span>':'')+
  snapshotSvg(p)+
  '<span class="nb-text-layer">'+(p.notes||[]).map(n=>noteMarkup(n,false).replace(' data-nb-note="'+esc(n.id)+'"','')).join('')+'</span>'+
  '<span class="nb-sticky-layer">'+(p.stickies||[]).map(snapshotStickyMarkup).join('')+'</span>'+
  '<span class="nb-page-num">'+String(index+1).padStart(2,'0')+'</span></span>';
}
function updateSnapshotScales(){
 for(const holder of root.querySelectorAll('.nb-rail-paper,.nb-gallery-paper')){
  if(holder.clientWidth)holder.style.setProperty('--nb-snapshot-scale',String(holder.clientWidth/W));
 }
}
function scheduleSnapshotScales(){requestAnimationFrame(updateSnapshotScales)}

function renderPageRail(){
 const host=$('nbPageRail');if(!host)return;
 const oldScroll=host.querySelector('.nb-rail-scroll')?.scrollTop||0;
 const pages=data.pages;
 const railLeaf=(p,i)=>'<button class="nb-rail-page '+(i===data.page?'active':'')+
  '" data-nb-rail-page="'+i+'" title="Ir para folha '+(i+1)+'">'+
  '<span class="nb-rail-paper" aria-hidden="true">'+snapshotSheetMarkup(p,i)+'</span>'+
  '<span class="nb-rail-caption">Folha '+(i+1)+'</span></button>';
 const railItems=data.layout==='book'
  ?Array.from({length:Math.ceil(pages.length/2)},(_,pair)=>{
    const left=pair*2,right=left+1;
    return '<div class="nb-rail-spread">'+railLeaf(pages[left],left)+
     (pages[right]?railLeaf(pages[right],right):
      '<span class="nb-rail-blank" aria-hidden="true"><span class="nb-rail-paper">'+
       snapshotSheetMarkup(emptyPage(),right)+'</span></span>')+'</div>';
   }).join('')
  :pages.map(railLeaf).join('');
 host.innerHTML=
  '<div class="nb-rail-inner"><div class="nb-rail-head"><span>Folhas</span><span class="nb-rail-count">'+pages.length+'</span></div>'+
  '<div class="nb-rail-scroll">'+railItems+
  '<button class="nb-rail-new '+(data.page===pages.length?'active':'')+
  '" data-nb-rail-page="'+pages.length+'">＋<span>Nova folha</span></button></div></div>'+
  '<button class="nb-rail-tab" type="button" data-nb-action="toggleRail" aria-label="'+
   (railOpen?'Recolher':'Abrir')+' lista de folhas" title="'+(railOpen?'Recolher':'Mostrar')+
   ' folhas">'+(railOpen?'‹':'›')+'</button>';
 host.classList.toggle('is-open',railOpen);
 $('nbWorkspace').classList.toggle('rail-open',railOpen);
 const scroller=host.querySelector('.nb-rail-scroll');if(scroller)scroller.scrollTop=oldScroll;
 scheduleSnapshotScales();
}
function refreshCurrentRailSnapshot(){
 const rail=$('nbPageRail');
 if(!rail||!root.isConnected)return;
 if(rail.querySelectorAll('.nb-rail-page').length!==data.pages.length){
  renderPageRail();return;
 }
 const button=Array.from(rail.querySelectorAll('.nb-rail-page'))
  .find(el=>Number(el.dataset.nbRailPage)===data.page);
 const preview=button?.querySelector('.nb-rail-paper');
 if(preview&&data.page<data.pages.length){
  preview.innerHTML=snapshotSheetMarkup(data.pages[data.page],data.page);
  scheduleSnapshotScales();
 }
}
function goRailPage(index){
 if(!Number.isInteger(index)||index<0||index>data.pages.length||!editEnabled&&index===data.pages.length)return;
 if(editing)saveEditor(false);
 if(index===data.page){if(isMobile())closePageRail();return;}
 data.page=index;pendingPage=emptyPage();selected=null;
 renderPage();renderPageRail();save();
 if(isMobile())closePageRail();
 view.scrollTop=0;view.scrollLeft=0;
}
function closePageRail(){railOpen=false;renderPageRail();}
function togglePageRail(){railOpen=!railOpen;renderPageRail();}
function closeDrawer(){drawerOpen=false;$('nbDrawer').hidden=true;root.classList.remove('nb-drawer-open');}
function backToBooks(){showShelf();}
function navigateBackInside(){
 if(shelfOpen)return;
 if(galleryOpen){hideGallery();return}
 if(editEnabled){setEditEnabled(false);return}
 if(data.page>0){
  if(data.layout==='book'&&data.page%2===1)goRailPage(data.page-1);
  else flip(-1);
  return;
 }
 showShelf();
}
// O histórico do iframe permanece dentro do Caderno mesmo usando o botão
// lateral do mouse ou o Voltar nativo do navegador.
window.addEventListener('popstate',()=>{
 navigateBackInside();
 try{history.pushState({psicomoodleCaderno:'protected'},'','#caderno-interno')}catch(_){}
});
try{
 history.replaceState({psicomoodleCaderno:'base'},'',location.href);
 history.pushState({psicomoodleCaderno:'protected'},'','#caderno-interno');
}catch(_){}
let lastHardwareBack=0;
function sideBack(event){
 if(event.button!==3)return false;
 event.preventDefault();event.stopPropagation();
 if(typeof event.stopImmediatePropagation==='function')event.stopImmediatePropagation();
 const now=performance.now();
 if(now-lastHardwareBack>330){lastHardwareBack=now;navigateBackInside()}
 return true;
}
root.addEventListener('auxclick',sideBack,true);
window.addEventListener('mousedown',sideBack,true);
window.addEventListener('mouseup',event=>{
 if(event.button===3){event.preventDefault();event.stopPropagation()}
},true);
function toggleDrawer(){
 drawerOpen=!drawerOpen;
 if(drawerOpen){toolPaletteOpen=false;renderStickyPalette();renderDrawer()}
 $('nbDrawer').hidden=!drawerOpen;root.classList.toggle('nb-drawer-open',drawerOpen);
}
function addBook(){
 const name=String($('nbNewBook')?.value||'').trim();
 if(!name){$('nbNewBook')?.focus();return}
 if(data.books.length>=50){status('Máximo de 50 cadernos nesta prévia.','error');return}
 checkpoint();const book=newBook(name.slice(0,70));data.books.push(book);switchBook(book.id);save();
}
function renameBook(){
 const name=String($('nbRenameBook')?.value||'').trim();
 if(!name)return;
 checkpoint();activeBook().name=name.slice(0,70);renderDrawer();updateBookHeading();save();
}
function miniSheet(p,index){
 return '<button class="nb-gallery-card" data-nb-open-page="'+index+'" aria-label="Abrir folha '+(index+1)+'">'+
  '<span class="nb-gallery-paper" aria-hidden="true">'+snapshotSheetMarkup(p,index)+'</span>'+
  '<span class="nb-gallery-caption"><strong>Folha '+(index+1)+'</strong><small>'+
  esc(p.date?new Date(p.date+'T12:00:00').toLocaleDateString('pt-BR'):'Sem data')+
  '</small></span></button>';
}
function renderGallery(){
 const host=$('nbGallery'),total=data.pages.length,limit=15,from=galleryOffset*limit;
 const cards=data.pages.slice(from,from+limit).map((p,i)=>miniSheet(p,from+i)).join('');
 host.innerHTML='<header class="nb-gallery-head"><div><span class="nb-gallery-eyebrow">Biblioteca de folhas</span>'+
  '<h2>'+esc(activeBook().name)+'</h2><p>'+total+' '+(total===1?'folha salva':'folhas salvas')+
  ' · clique em uma folha para abri-la</p></div>'+
  '<button class="nb-quiet" data-nb-action="closeGallery">Voltar ao papel</button></header>'+
  (total?'<div class="nb-gallery-grid">'+cards+'</div>':
   '<div class="nb-gallery-empty"><span aria-hidden="true">▤</span><h3>Este caderno ainda está vazio</h3>'+
   '<p>Escreva em uma folha para que ela apareça aqui.</p>'+
   '<button class="nb-tool" data-nb-action="closeGallery">Começar a escrever</button></div>')+
  (total>limit?'<footer class="nb-gallery-nav"><button class="nb-page-btn" data-nb-action="galleryPrev" '+
   (galleryOffset===0?'disabled':'')+'>‹ Anteriores</button><strong>'+
   (galleryOffset+1)+' de '+Math.ceil(total/limit)+'</strong><button class="nb-page-btn" data-nb-action="galleryNext" '+
   ((galleryOffset+1)*limit>=total?'disabled':'')+'>Próximas ›</button></footer>':'');
 scheduleSnapshotScales();
}
function transitionView(change,fromEl=null,toEl=null){
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(reduced){change();return}
 if(!document.startViewTransition){
  // Safari/navegadores sem View Transitions: abrir e voltar à estante nunca será instantâneo.
  change();
  const destination=typeof toEl==='function'?toEl():toEl;
  if(destination?.animate){
   const opening=document.documentElement.classList.contains('nb-opening-book');
   destination.animate(opening?[
    {opacity:0,transform:'perspective(1100px) rotateY(-14deg) scale(.86)'},
    {opacity:1,transform:'perspective(1100px) rotateY(0deg) scale(1)'}
   ]:[
    {opacity:.18,transform:'perspective(1100px) rotateY(-65deg) scale(.85)'},
    {opacity:1,transform:'perspective(1100px) rotateY(0deg) scale(1)'}
   ],{duration:800,easing:'cubic-bezier(.18,.72,.22,1)'});
  }
  return;
 }
 if(fromEl)fromEl.style.viewTransitionName='nb-shared-sheet';
 const transition=document.startViewTransition(()=>{
  change();
  if(toEl){const el=typeof toEl==='function'?toEl():toEl;if(el)el.style.viewTransitionName='nb-shared-sheet'}
 });
 transition.finished.catch(()=>{}).finally(()=>{
  if(fromEl)fromEl.style.viewTransitionName='';
  const el=typeof toEl==='function'?toEl():toEl;if(el)el.style.viewTransitionName='';
 });
}
function showGallery(){
 if(editing)saveEditor(false);
 closeDrawer();galleryOffset=clamp(Math.floor(data.page/15),0,Math.max(0,Math.ceil(data.pages.length/15)-1));
 transitionView(()=>{
  galleryOpen=true;renderGallery();$('nbGallery').hidden=false;view.hidden=true;
  document.querySelector('.nb-page-control').hidden=true;root.classList.add('nb-gallery-open');
 },wrap);
}
function hideGallery(index=null){
 if(index!==null&&Number.isInteger(index)&&index>=0&&index<data.pages.length){
  data.page=index;pendingPage=emptyPage();
 }
 const target=index!==null?$('nbGallery').querySelector('[data-nb-open-page="'+index+'"]'):null;
 transitionView(()=>{
  galleryOpen=false;$('nbGallery').hidden=true;view.hidden=false;
  document.querySelector('.nb-page-control').hidden=false;root.classList.remove('nb-gallery-open');
  renderPage();renderPageRail();view.scrollTop=0;view.scrollLeft=0;save();
 },target,()=>wrap);
}
function renderStickyPalette(){
 const box=$('nbStickyPalette'),button=root.querySelector('[data-nb-action="sticky"]');
 if(!box||!button)return;
 if(!toolPaletteOpen){box.hidden=true;return}
 const rect=button.getBoundingClientRect();
 box.style.left=clamp(rect.left,8,window.innerWidth-220)+'px';
 box.style.top=Math.min(rect.bottom+9,window.innerHeight-190)+'px';
 box.innerHTML='<strong>Escolha o post-it</strong><div class="nb-sticky-swatches">'+
  [['yellow','Amarelo'],['pink','Rosa'],['violet','Lilás']].map(([tone,name])=>
   '<button type="button" data-nb-tone="'+tone+'" aria-label="Selecionar post-it '+name+'" '+
   (data.stickyTone===tone?'aria-pressed="true"':'')+'><span data-tone="'+tone+'">☷</span>'+
   '<small>'+name+'</small></button>').join('')+'</div>';
 box.hidden=false;
}
function closestPointOnStroke(pos,stroke){
 const points=stroke?.points||[];
 if(!points.length)return null;
 let best={distance:dist(pos,points[0]),point:{...points[0]}};
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],dx=b.x-a.x,dy=b.y-a.y,len=dx*dx+dy*dy;
  const t=len?clamp(((pos.x-a.x)*dx+(pos.y-a.y)*dy)/len,0,1):0;
  const p={x:a.x+t*dx,y:a.y+t*dy},d=dist(pos,p);
  if(d<best.distance)best={distance:d,point:p};
 }
 return best;
}
// Pontos intermediários permitem moldar até o meio de traços retos.
function denseWarpPoints(points){
 if(points.length>=2400)return points.map(p=>({...p}));
 const dense=[{...points[0]}];
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],available=Math.max(1,2400-dense.length-(points.length-i-1));
  const steps=Math.min(Math.max(1,Math.ceil(dist(a,b)/5)),available);
  for(let j=1;j<=steps;j++)dense.push({x:a.x+(b.x-a.x)*j/steps,y:a.y+(b.y-a.y)*j/steps});
 }
 return dense;
}
function findStrokeNear(p,includeUncorrected=true){
 let best={score:Math.max(12,16/data.zoom),stroke:null,index:-1};
 page().strokes.forEach((s,i)=>{
  if(!includeUncorrected&&!s.corrected)return;
  const near=closestPointOnStroke(p,s);
  if(near&&near.distance<best.score)best={score:near.distance,stroke:s,index:i,anchor:near.point};
 });
 return best;
}
function startWarpDrag(event,stroke,index,anchor){
 if(!editEnabled||!stroke?.points?.length||index<0)return;
 const from=point(event),near=anchor?{point:anchor}:closestPointOnStroke(from,stroke);
 if(!near)return;
 warpDrag={pointerId:event.pointerId,index,id:stroke.id,from,center:near.point,
  original:denseWarpPoints(stroke.points),moved:false};
 canvas.setPointerCapture?.(event.pointerId);
 event.preventDefault();
}
function selectItem(type,itemId){
 selected={type,id:itemId};
 $('nbContextMenu').hidden=true;
 renderNotes();renderStickies();drawCanvas();
 if(type==='sticky')root.querySelector('[data-nb-sticky="'+itemId+'"]')?.classList.add('nb-selected');
 if(type==='note')root.querySelector('[data-nb-note="'+itemId+'"]')?.classList.add('nb-selected');
 renderSelectionHandles();
}
function selectedItem(){
 if(!selected)return null;
 return (selected.type==='note'?page().notes:selected.type==='stroke'?page().strokes:page().stickies).find(x=>x.id===selected.id)||null;
}
function deleteSelected(){
 if(!editEnabled||!selected)return;
 const target=selectedItem();if(!target){selected=null;return}
 checkpoint();
 const prop=selected.type==='note'?'notes':selected.type==='stroke'?'strokes':'stickies';
 page()[prop]=page()[prop].filter(x=>x.id!==selected.id);
 selected=null;selectedStroke=-1;resizeDrag=null;moveDrag=null;
 $('nbContextMenu').hidden=true;
 serializable();refreshTools();renderNotes();renderStickies();drawCanvas();renderSelectionHandles();save();
 status('Item removido. Use Ctrl+Z para desfazer.','success');
}
function contextMenu(event){
 if(!editEnabled)return;
 if(event.target.closest('#nbEditorText,#nbPaperDate,.nb-drawer,.nb-gallery'))return;
 const note=event.target.closest('[data-nb-note]'),sticky=event.target.closest('[data-nb-sticky]');
 if(note)selectItem('note',note.dataset.nbNote);
 else if(sticky)selectItem('sticky',sticky.dataset.nbSticky);
 else if(event.target===canvas||event.target.closest('#nbSheet')){
  const hit=findStrokeNear(point(event));
  if(hit.stroke)selectItem('stroke',hit.stroke.id);
  else {selected=null;$('nbContextMenu').hidden=true;return;}
 }
 if(!selected||!selectedItem())return;
 event.preventDefault();
 const item=selectedItem(),type=selected.type;
 const actions=type==='note'?
  [['edit','✎ Editar texto'],['move','⌖ Selecionar e mover'],['correct','✧ Revisar gramática'],['copy','▣ Copiar texto'],
   ['blue','● Caneta azul'],['black','● Caneta preta'],['red','● Caneta vermelha'],['delete','⌫ Excluir']]:
  type==='stroke'?
  [['move','⌖ Selecionar e mover'],['warp','⌁ Moldar desenho'],...(!item.corrected?[['fix','✧ Corrigir traço']]:[]),
   ['blue','● Caneta azul'],['black','● Caneta preta'],['red','● Caneta vermelha'],['delete','⌫ Excluir']]:
  [['edit','✎ Editar post-it'],['move','⌖ Selecionar e mover'],['tone:yellow','▤ Amarelo'],['tone:pink','▤ Rosa'],
   ['tone:violet','▤ Lilás'],['delete','⌫ Excluir']];
 const menu=$('nbContextMenu');
 menu.innerHTML=actions.map(([a,label])=>'<button role="menuitem" data-nb-context="'+a+'">'+label+'</button>').join('');
 menu.hidden=false;
 menu.style.left=clamp(event.clientX,8,window.innerWidth-211)+'px';
 menu.style.top=clamp(event.clientY,8,window.innerHeight-actions.length*33-17)+'px';
}
function contextAction(action){
 const item=selectedItem();if(!item)return;
 $('nbContextMenu').hidden=true;
 if(action==='delete'){deleteSelected();return}
 if(action==='move'){data.mode='select';refreshTools();status('Clique e arraste o item para movê-lo.','');return}
 if(action==='edit'){
  if(selected.type==='note'){const line=Number(item.line)||FIRST_LINE;data.mode='text';selected=null;beginEdit(line);}
  else if(selected.type==='sticky'){root.querySelector('[data-nb-sticky-text="'+item.id+'"]')?.focus();}
  return;
 }
 if(action==='copy'&&selected.type==='note'){navigator.clipboard?.writeText?.(item.text||'')?.then?.(()=>status('Texto copiado.','success'));return}
 if(action==='correct'&&selected.type==='note'){
  void correctNote(item.id,item.original||item.text||'');return;
 }
 if(action==='warp'&&selected.type==='stroke'){data.mode='warp';refreshTools();drawCanvas();renderSelectionHandles();status('Arraste qualquer parte do traço para moldar; quadradinho move sem deformar.','');return}
 if(action==='fix'&&selected.type==='stroke'&&!item.corrected){
  checkpoint();const r=smartStroke(item.points);item.points=r.points;item.kind=r.kind;item.corrected=true;
  drawCanvas();save();return;
 }
 if(action.startsWith('tone:')&&selected.type==='sticky'){
  checkpoint();item.tone=action.slice(5);renderStickies();save();return;
 }
 if(COLORS[action]){
  checkpoint();item.ink=action;
  renderNotes();drawCanvas();save();
 }
}
function toolCursor(event){
 const marker=$('nbToolCursor');
 if(event.pointerType==='touch'||!root.contains(event.target)||galleryOpen||
    !event.target.closest('#nbViewport')||event.target.closest('textarea,input,button')||
     data.mode==='draw'||data.mode==='warp'){
   // Usar a mira nativa, exatamente na ponta: sem ícone flutuante deslocado.
  marker.hidden=true;return;
 }
 const erase=data.mode==='erase'&&!!event.target.closest('#nbSheet');
 marker.classList.toggle('nb-eraser-target',erase);
 if(erase){
  marker.textContent='';
  const size=clamp(Number(data.eraserRadius)||14,6,32)*data.zoom*2;
  marker.style.width=size+'px';marker.style.height=size+'px';
  marker.style.left=event.clientX+'px';marker.style.top=event.clientY+'px';
 }else{
  marker.style.width='25px';marker.style.height='25px';
  const icons={none:'✋',text:'✎',select:'⌖',draw:'〰',sticky:'▤',warp:'⌁'};
  marker.textContent=icons[data.mode]||'⌖';
  marker.style.left=(event.clientX+13)+'px';marker.style.top=(event.clientY+12)+'px';
 }
 marker.hidden=false;
}

function renderPage(){
 selectedStroke=-1;selected=null;closeEditor();renderSelectionHandles();
 refreshTools();renderNotes();renderStickies();drawCanvas();setZoom(data.zoom,false);renderBookSpread();syncNotebookUI();
}
function renderAll(){
 renderPage();renderPageRail();renderShelf();syncNotebookUI();updateShortcutsList();
 if(drawerOpen)renderDrawer();
 if(galleryOpen)renderGallery();
 renderStickyPalette();
}
function flip(direction){
 if(flipping)return;
 if(editing)saveEditor(false);
 const target=data.layout==='book'?(Math.floor(data.page/2)*2+(direction>0?2:-2)):data.page+direction;
 if(target<0||target>data.pages.length||!editEnabled&&target>=data.pages.length){status(direction<0?'Esta já é a primeira folha.':'Não há mais folhas salvas para ler. Clique em Editar para criar outras.','');return;}
 if(target===data.page)return;
 if(target===data.pages.length&&data.pages.length>=250){status('Limite de páginas atingido nesta prévia.','error');return}
 flipping=true;sheet.classList.add('nb-folding');
 if(data.layout==='book')stage.classList.add(direction>0?'nb-book-turn-next':'nb-book-turn-prev');
 const duration=data.layout==='book'?540:170;
 setTimeout(()=>{
  data.page=target;selected=null;sheet.classList.remove('nb-folding');renderPage();
  view.scrollTop=0;view.scrollLeft=0;renderPageRail();save();
 },data.layout==='book'?320:170);
 setTimeout(()=>{flipping=false;stage.classList.remove('nb-book-turn-next','nb-book-turn-prev')},duration);
}
const EDITABLE_BACKUP_FORMAT='psicomoodle.caderno.editavel';
function downloadJSON(){
 // O arquivo editável contém todas as páginas da matéria em uso, sem dependências externas.
 if(editing)saveEditor(false);
 serializable();
 const book=activeBook();
 const payload={
  format:EDITABLE_BACKUP_FORMAT,version:3,semester:SEMESTER,
  exportedAt:new Date().toISOString(),book:JSON.parse(JSON.stringify(book))
 };
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'});
 const objectUrl=URL.createObjectURL(blob),anchor=document.createElement('a');
 const slug=String(book.name||'caderno').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,55);
 anchor.href=objectUrl;
 anchor.download='caderno-editavel-'+(slug||'anotacoes')+'-'+new Date().toISOString().slice(0,10)+'.json';
 document.body.appendChild(anchor);anchor.click();anchor.remove();
 setTimeout(()=>URL.revokeObjectURL(objectUrl),3000);
 status('Caderno editável exportado em JSON. Guarde o arquivo para recuperá-lo depois.','success');
}
function toggleExportMenu(force){
 const menu=$('nbExportMenu'),button=$('nbExportToggle');
 if(!menu||!button)return;
 const show=typeof force==='boolean'?force:menu.hidden;
 menu.hidden=!show;button.setAttribute('aria-expanded',String(show));
}
function validateBackupBook(book){
 if(!book||typeof book!=='object'||Array.isArray(book)||typeof book.name!=='string'||
   !book.name.trim()||!Array.isArray(book.pages)||book.pages.length>250)
  throw Error('Estrutura do caderno inválida ou incompatível.');
 const pages=[];
 for(const item of book.pages){
  if(!item||typeof item!=='object'||Array.isArray(item)||
     !Array.isArray(item.notes)||item.notes.length>140||
     !Array.isArray(item.strokes)||item.strokes.length>500||
     !Array.isArray(item.stickies)||item.stickies.length>40)
   throw Error('Uma folha do arquivo está inválida.');
  for(const note of item.notes){
   if(!note||typeof note!=='object'||typeof note.text!=='string'||note.text.length>2500)
    throw Error('O arquivo contém anotações inválidas.');
   if(note.inkRuns!==undefined&&(!Array.isArray(note.inkRuns)||note.inkRuns.length>2500))
    throw Error('O arquivo contém cores inválidas.');
  }
  for(const stroke of item.strokes){
   if(!stroke||!Array.isArray(stroke.points)||stroke.points.length>50000||
      !stroke.points.every(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)))
    throw Error('O arquivo contém desenhos inválidos.');
  }
  for(const sticky of item.stickies){
   if(!sticky||typeof sticky.text!=='string'||sticky.text.length>700)
    throw Error('O arquivo contém post-its inválidos.');
  }
  // Mantém estilos, textos, posicionamento e desenhos; troca apenas IDs internos.
  const clean=cleanPage(item);
  clean.notes=clean.notes.map(note=>({...note,id:id(),pending:false}));
  clean.strokes=clean.strokes.map(stroke=>({...stroke,id:id()}));
  clean.stickies=clean.stickies.map(sticky=>({...sticky,id:id()}));
  pages.push(clean);
 }
 return {name:book.name.trim().slice(0,70),
  color:/^#[0-9a-fA-F]{6}$/.test(book.color)?book.color:
   SUBJECT_BOOKS.find(subject=>subject.id===book.id)?.color||'#79689b',
  pages};
}
function parseEditableBackup(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))
  throw Error('Este arquivo não é um backup de caderno.');
 let books,semester='';
 if(raw.format===EDITABLE_BACKUP_FORMAT&&raw.version===3){
  books=[raw.book];semester=String(raw.semester||'');
 }else if(raw.version===2&&Array.isArray(raw.books)){
  // Backups JSON anteriores continham todos os cadernos do semestre.
  books=raw.books;semester=String(raw.semester||'');
 }else throw Error('Formato incompatível. Escolha um JSON exportado pelo Caderno.');
 if(!books.length||books.length>50)
  throw Error('O arquivo não contém uma quantidade válida de cadernos.');
 return {semester,books:books.map(validateBackupBook)};
}
function restoredBookName(name,existing){
 const clean=String(name).slice(0,70),lower=clean.toLocaleLowerCase('pt-BR');
 if(!existing.has(lower)){existing.add(lower);return clean;}
 for(let index=1;index<1000;index++){
  const suffix=index===1?' (restaurado)':' (restaurado '+index+')';
  const label=clean.slice(0,70-suffix.length)+suffix;
  if(!existing.has(label.toLocaleLowerCase('pt-BR'))){
   existing.add(label.toLocaleLowerCase('pt-BR'));return label;
  }
 }
 throw Error('Não foi possível identificar o caderno restaurado.');
}
async function importEditableBackup(file){
 if(!file)return;
 try{
  if(file.size>50*1024*1024)throw Error('O JSON ultrapassa 50 MB.');
  const backup=parseEditableBackup(JSON.parse(await file.text()));
  if(backup.semester&&backup.semester!==SEMESTER){
   if(!window.confirm('O arquivo pertence ao semestre '+backup.semester+
    '. O semestre atual é '+SEMESTER+'. Importar como novo caderno mesmo assim?'))return;
  }
  if(data.books.length+backup.books.length>50)
   throw Error('Limite de 50 cadernos. Não foi feita nenhuma alteração.');
  if(editing)saveEditor(false);
  const prior=JSON.stringify(serializable());
  const oldStamp=localStamp,oldSignature=lastContentSignature,oldDirty=cloudDirty;
  const existing=new Set(data.books.map(book=>String(book.name||'').toLocaleLowerCase('pt-BR')));
  const incoming=backup.books.map(book=>({...book,id:id(),name:restoredBookName(book.name,existing)}));
  checkpoint();
  data.books.push(...incoming);
  data.bookId=incoming[0].id;data.pages=activeBook().pages;data.page=0;
  pendingPage=emptyPage();editing=null;selected=null;selectedStroke=-1;
  editEnabled=false;data.mode='none';shelfOpen=true;
  if(!persistNow()){
   restoreState(prior);localStamp=oldStamp;lastContentSignature=oldSignature;cloudDirty=oldDirty;
   undoStack.pop();renderAll();syncNotebookUI();
   throw Error('Não foi possível armazenar o caderno recuperado. Os originais foram preservados.');
  }
  renderAll();syncNotebookUI();
  status(incoming.length===1?
   'Caderno recuperado! Abra a nova capa na estante para continuar editando.':
   incoming.length+' cadernos recuperados em novas capas editáveis.','success');
 }catch(error){
  status('Importação não concluída: '+String(error?.message||'arquivo inválido'),'error');
 }
}

function formatShortcut(v){
 if(!v)return 'Definir';
 if(v.startsWith('mouse:'))return 'Mouse '+v.slice(6);
 return v.slice(4).replace(/(?:^|\+)Key/g,'+').replace(/(?:^|\+)Digit/g,'+').replace(/^\+/,'').replace(/Control/g,'Ctrl').replace(/Arrow/g,'').replace(/ /g,'');
}
function updateShortcutsList(){
 const holder=$('nbShortcutsList');if(!holder)return;
 holder.innerHTML=ACTIONS.map(([a,label])=>
  '<div class="nb-shortcut"><span>'+esc(label)+'</span><button type="button" data-nb-bind="'+a+
  '" class="'+(listening===a?'listening':'')+'" aria-label="Definir atalho para '+esc(label)+'">'+
  esc(listening===a?'Pressione…':formatShortcut(data.shortcuts[a]))+'</button></div>'
 ).join('');
}
function shortcutEventString(event){
 const parts=[];
 if(event.ctrlKey)parts.push('Control');
 if(event.altKey)parts.push('Alt');
 if(event.shiftKey)parts.push('Shift');
 if(event.metaKey)parts.push('Meta');
 parts.push(event.code||event.key);
 return 'key:'+parts.join('+');
}
function bindShortcut(event){
 if(event.key==='Escape'){listening='';updateShortcutsList();return}
 if(['Control','Alt','Shift','Meta','Tab'].includes(event.key))return;
 const code=shortcutEventString(event);
 const reserved=/^key:(?:Control|Meta)\+(?:Key[WRLT]|Digit[0-9])$/.test(code)||
  /^key:Alt\+Arrow(?:Left|Right)$/.test(code)||event.key==='F5';
 if(reserved){$('nbShortcutHint').textContent='Este atalho é reservado pelo navegador. Escolha outro.';return}
 checkpoint();
 Object.keys(data.shortcuts).forEach(k=>{if(data.shortcuts[k]===code)delete data.shortcuts[k]});
 data.shortcuts[listening]=code;listening='';updateShortcutsList();save();
 $('nbShortcutHint').textContent='Atalho registrado.';
}
function act(action){
 if(action==='toggleEdit'){setEditEnabled(!editEnabled);return}
 if(action==='backToBooks'){showShelf();return}
 if(action==='drawer'&&shelfOpen)return;
 const allowedReadOnly=['prev','next','gallery','closeGallery','galleryPrev','galleryNext',
  'toggleRail','zoomIn','zoomOut','export','drawer','closeDrawer'];
 if(shelfOpen||!editEnabled&&!allowedReadOnly.includes(action)){
  if(!shelfOpen)status('Somente leitura. Clique em Editar para modificar a folha.','');
  return;
 }
 if(action==='sticky'){
  // Um clique em Post-it ativa a ferramenta; a paleta apenas muda a cor.
  data.mode='sticky';toolPaletteOpen=!toolPaletteOpen;
  refreshTools();renderStickyPalette();save();return;
 }
 if(action==='bullets'||action==='numbered'){toggleList(action);return;}
 if(MODES.includes(action)){
  if(editing)saveEditor(false);
  // Em Moldar, preservar a seleção de qualquer desenho.
  const keepSelection=action==='warp'&&selected?.type==='stroke'&&!!selectedItem();
  data.mode=action;toolPaletteOpen=false;if(!keepSelection)selected=null;selectedStroke=-1;
  $('nbLineHover').hidden=true;$('nbCompanionLineHover')?.setAttribute('hidden','');$('nbContextMenu').hidden=true;
  refreshTools();renderNotes();renderStickies();drawCanvas();renderSelectionHandles();renderStickyPalette();save();
  if(action==='none')status('Modo navegar: arraste a página, use zoom ou selecione outra ferramenta.','');
  if(action==='select')status('Clique para selecionar e arrastar textos, desenhos ou post-its.','');
  if(action==='erase')status('Arraste a borracha sobre o desenho para apagar trechos ou traços inteiros.','');
  if(action==='warp')status('Clique e arraste qualquer trecho do desenho para moldar. O quadradinho move sem deformar.','');
  return;
 }
 if(COLORS[action]){
  const input=$('nbEditorText');
  if(editing&&input){
   const start=input.selectionStart,end=input.selectionEnd;
   if(end>start){
    if(!Array.isArray(editing.inkMap))editing.inkMap=inkMapFor(input.value,data.ink);
    editing.inkMap.fill(action,start,end);
   }
  }
  data.ink=action;
  if(editing)syncInkOverlay();
  refreshTools();renderNotes();save();return;
 }
 switch(action){
 case 'print':case 'cursive':case 'joined':
  data.font=action;refreshTools();renderNotes();
  const fontInput=$('nbEditorText');
  if(editing&&fontInput){
   fontInput.classList.remove('print','cursive','joined');fontInput.classList.add(action);
   const overlay=$('nbEditorColors');
   if(overlay){overlay.classList.remove('print','cursive','joined');overlay.classList.add(action);}
  }
  save();break;
 case 'prev':if(data.page>0)flip(-1);else status('Esta já é a primeira folha. Use Cadernos para ver as capas.','');break;case 'next':flip(1);break;
 case 'drawer':toggleDrawer();break;case 'closeDrawer':closeDrawer();break;
 case 'backToBooks':backToBooks();break;
 case 'toggleRail':togglePageRail();break;
 case 'gallery':showGallery();break;case 'closeGallery':hideGallery();break;
 case 'galleryPrev':galleryOffset=Math.max(0,galleryOffset-1);renderGallery();break;
 case 'galleryNext':galleryOffset=Math.min(Math.floor((data.pages.length-1)/15),galleryOffset+1);renderGallery();break;
 case 'addBook':addBook();break;case 'renameBook':renameBook();break;
 case 'zoomIn':zoomAt(data.zoom+.1,view.getBoundingClientRect().left+view.clientWidth/2,view.getBoundingClientRect().top+view.clientHeight/2);break;
 case 'zoomOut':zoomAt(data.zoom-.1,view.getBoundingClientRect().left+view.clientWidth/2,view.getBoundingClientRect().top+view.clientHeight/2);break;
 case 'smooth':data.smooth=!data.smooth;refreshTools();save();break;
 case 'undo':undo();break;case 'redo':redo();break;
 case 'export':if(editing)saveEditor(false);window.uentzoulCadernoPDF?.exportBook?.(activeBook(),status);break;
 case 'shortcuts':$('nbShortcutsDialog').hidden=false;updateShortcutsList();break;
 case 'closeShortcuts':$('nbShortcutsDialog').hidden=true;listening='';break;
 case 'cancelEditor':closeEditor();break;case 'saveEditor':saveEditor();break;
 }
}
root.addEventListener('click',event=>{
 const exportToggle=event.target.closest('[data-nb-export-toggle]');
 if(exportToggle){toggleExportMenu();return;}
 const formatButton=event.target.closest('[data-nb-export-format]');
 if(formatButton){
  toggleExportMenu(false);
  if(formatButton.dataset.nbExportFormat==='pdf')act('export');
  else if(formatButton.dataset.nbExportFormat==='json')downloadJSON();
  return;
 }
 if(event.target.closest('[data-nb-import]')){$('nbImportFile')?.click();return;}
 if(!event.target.closest('.nb-export-wrap'))toggleExportMenu(false);
 if(!event.target.closest('.nb-format-menu'))closeFormatMenus();
 const shelfBook=event.target.closest('[data-nb-shelf-book]');
 if(shelfBook){openShelfBook(shelfBook.dataset.nbShelfBook,shelfBook);return}
 if(event.target.closest('[data-nb-grammar-retry]')){
  if(!grammarRunning){grammarPaused=false;grammarAttempted.clear();void reviewHistoricalNotes(true);}
  return;
 }
 if(shelfOpen)return;
 const menuTrigger=event.target.closest('[data-nb-menu-toggle]');
 if(menuTrigger){
  if(editEnabled){
   const name=menuTrigger.dataset.nbMenuToggle;
   showFormatMenu(formatMenuOpen===name?'':name);
   if(editing)$('nbEditorText')?.focus({preventScroll:true});
  }
  return;
 }
 const alignmentChoice=event.target.closest('[data-nb-align]');
 if(alignmentChoice){
  if(editEnabled)applyTextAlign(alignmentChoice.dataset.nbAlign);
  closeFormatMenus();
  if(editing)$('nbEditorText')?.focus({preventScroll:true});
  return;
 }
 const ctx=event.target.closest('[data-nb-context]');
 if(ctx){if(editEnabled)contextAction(ctx.dataset.nbContext);return}
 const rail=event.target.closest('[data-nb-rail-page]');
 if(rail){goRailPage(Number(rail.dataset.nbRailPage));return}
 const book=event.target.closest('[data-nb-book]');
 if(book){switchBook(book.dataset.nbBook);return}
 const paper=event.target.closest('[data-nb-open-page]');
 if(paper){hideGallery(Number(paper.dataset.nbOpenPage));return}
 const tone=event.target.closest('[data-nb-tone]');
 if(tone){
  data.stickyTone=tone.dataset.nbTone;data.mode='sticky';
  toolPaletteOpen=false;renderStickyPalette();refreshTools();save();
  status('Post-it '+({yellow:'amarelo',pink:'rosa',violet:'lilás'}[data.stickyTone]||'')+' selecionado. Toque na folha.','');
  return;
 }
 const d=event.target.closest('[data-nb-delete-sticky]');
 if(d&&editEnabled){
  event.preventDefault();event.stopPropagation();
  checkpoint();page().stickies=page().stickies.filter(s=>s.id!==d.dataset.nbDeleteSticky);
  selected=null;renderStickies();renderSelectionHandles();save();
  status('Post-it removido. Ctrl+Z desfaz.','success');return;
 }
 const bind=event.target.closest('[data-nb-bind]');
 if(bind){listening=bind.dataset.nbBind;$('nbShortcutHint').textContent='Pressione uma tecla ou botão extra do mouse.';updateShortcutsList();return;}
 const button=event.target.closest('[data-nb-action]');
 if(button?.dataset.nbAction==='switchLeaf'){
  if(data.layout==='book'&&(data.mode==='none'||Date.now()<suppressLeafClickUntil)){
   event.preventDefault();return;
  }
  activateCompanion(event);return;
 }
 if(button){
  const fromMenu=!!button.closest('.nb-format-panel');
  act(button.dataset.nbAction);
  if(fromMenu){
   closeFormatMenus();
   if(editing)$('nbEditorText')?.focus({preventScroll:true});
  }
  return;
 }
 if(event.target.id==='nbShortcutsDialog')act('closeShortcuts');
 if(!event.target.closest('#nbContextMenu'))$('nbContextMenu').hidden=true;
 if(!event.target.closest('#nbStickyPalette')&&!event.target.closest('[data-nb-action="sticky"]')){
  toolPaletteOpen=false;renderStickyPalette();
 }
});
root.addEventListener('change',event=>{
 if(event.target.id==='nbImportFile'){
  const file=event.target.files?.[0]||null;event.target.value='';
  if(file)void importEditableBackup(file);
  return;
 }
 if(event.target.id==='nbLayout'){
  if(editing)saveEditor(false);
  data.layout=event.target.value==='book'?'book':'single';
  if(data.layout==='book'&&data.zoom>.8)setZoom(.61,false);
  renderPage();renderPageRail();save();
  if(data.layout==='book'){
   requestAnimationFrame(()=>{view.scrollLeft=0;view.scrollTop=0;});
  }
  status(data.layout==='book'?'Caderno aberto: clique em cada folha para editá-la.':'Folha única ativada.','success');
  return;
 }
 if(!editEnabled)return;
 if(event.target.id==='nbSmooth'){data.smooth=event.target.checked;save();}
 if(event.target.id==='nbEraseBehavior'){data.eraserMode=event.target.value==='whole'?'whole':'parts';save();}
 if(event.target.id==='nbPaperDate'&&editEnabled){page().date=event.target.value;syncNotebookUI();save();}
});
// Clicar fora do texto confirma alterações, inclusive a exclusão completa.
document.addEventListener('pointerdown',event=>{
 if(!event.target.closest('.nb-export-wrap'))toggleExportMenu(false);
 formatPointerActive=!!event.target.closest('.nb-format-menu');
 if(!formatPointerActive)closeFormatMenus();
},true);
root.addEventListener('mousedown',event=>{
 if(editing&&event.target.closest('.nb-format-menu'))event.preventDefault();
});
root.addEventListener('focusout',event=>{
 if(formatPointerActive||event.relatedTarget?.closest?.('.nb-format-menu'))return;
 if(event.target.id!=='nbEditorText'||!editing)return;
 // Ocultações temporárias (ex.: renderização ou captura visual) não são saídas reais.
 if(getComputedStyle(event.target).visibility==='hidden'||!event.target.isConnected)return;
 const input=event.target,session=editing;
 queueMicrotask(()=>{
  // Enter/troca de linha e re-renderização do editor podem substituir a caixa.
  if(editing===session&&$('nbEditorText')===input&&document.activeElement!==input)
   saveEditor(false);
 });
});
root.addEventListener('input',event=>{
 const t=event.target;
 if(t.id==='nbEraseSize'){data.eraserRadius=clamp(Number(t.value)||14,6,32);save();return;}
 if(t.id==='nbEditorText'){
  if(!editing)return;
  crossLineUndoReady=false;
  const oldMarker=listInfo(editing.draft),newMarker=listInfo(t.value);
  if(oldMarker&&(!newMarker||newMarker.kind!==oldMarker.kind)){
   data.listStyle='none';refreshTools();
  }
  editing.inkMap=reconcileInkMap(editing.draft,editing.inkMap,t.value,data.ink);
  editing.draft=t.value;previewText=t.value;
  t.style.height=Math.max(38,t.scrollHeight)+'px';
  syncInkOverlay();return;
 }
 if(t.id==='nbZoomSlider'){
  zoomAt(Number(t.value)/100,view.getBoundingClientRect().left+view.clientWidth/2,view.getBoundingClientRect().top+view.clientHeight/2);return;
 }
 if(t.matches('[data-nb-sticky-text]')){
  const st=page().stickies.find(s=>s.id===t.dataset.nbStickyText);
  if(st){st.text=t.value;save();}
 }
});
root.addEventListener('scroll',event=>{
 if(event.target.id==='nbEditorText')syncInkOverlay();
},true);
/* Comportamento padrão do teclado dentro das pautas, independente das ferramentas visuais. */
function noteAtWritingLine(line){
 return page().notes.find(n=>Number(n.line)<=line&&
  line<Number(n.line)+Math.max(1,Number(n.span)||1));
}
function moveWritingCaret(direction,caret='end'){
 if(!editing||!editEnabled||data.mode!=='text')return false;
 const line=editing.line,here=noteAtWritingLine(line);
 const step=direction>0?Math.max(1,Number(here?.span)||1):-1;
 saveEditor(false);
 const target=line+step;
 if(target>=ROWS){
  if(data.page+1>=250)return false;
  data.page++;pendingPage=emptyPage();renderPage();renderPageRail();save();
  beginEdit(FIRST_LINE,caret);return true;
 }
 if(target<FIRST_LINE){
  if(data.page<=0)return false;
  data.page--;pendingPage=emptyPage();renderPage();renderPageRail();save();
  const prev=page().notes.filter(n=>Number(n.line)<ROWS)
   .sort((a,b)=>Number(b.line)-Number(a.line))[0];
  beginEdit(prev?Number(prev.line):ROWS-1,caret);return true;
 }
 beginEdit(target,caret);return true;
}
function snapshotWritingDraft(){
 if(!editing)return null;
 const raw=String($('nbEditorText')?.value||'');
 let note=editing.id?page().notes.find(n=>n.id===editing.id):null;
 if(!raw.trim())return note;
 if(!note){note={id:id(),line:editing.line};page().notes.push(note);editing.id=note.id;}
 const colors=reconcileInkMap(editing.draft,editing.inkMap,raw,data.ink);
 const ink=colors[0]||data.ink;
 Object.assign(note,{text:raw,original:raw,font:data.font,size:1,ink,
  inkRuns:inkRunsFor(raw,colors,ink),align:data.align||'left',pending:false,reviewed:false});
 delete note.grammarReviewVersion;
 note.span=occupiedSpan(note);materializePage();
 return note;
}
function pullWritingLineUp(){
 if(!editing||!editEnabled||data.mode!=='text'||editing.line<=FIRST_LINE)return false;
 const currentLine=editing.line,previousLine=currentLine-1;
 // Backspace no início de uma linha precedida por pauta vazia elimina essa pauta.
 if(noteAtWritingLine(previousLine))return false;
 const input=$('nbEditorText');if(!input||!input.value.trim())return false;
 snapshotWritingDraft();
 checkpoint();
 if(!removeBlankPauta(previousLine,true))return false;
 editing=null;renderNotes();beginEdit(previousLine,'start');
 crossLineUndoReady=true;
 status('Pauta vazia removida. Ctrl+Z desfaz.','success');
 return true;
}
function deleteEmptyWritingLine(){
 if(!editing||!editEnabled||data.mode!=='text')return false;
 const current=noteAtWritingLine(editing.line);
 const next=editing.line+Math.max(1,Number(current?.span)||1);
 if(next>=ROWS||noteAtWritingLine(next)||!page().notes.some(n=>Number(n.line)>next))return false;
 snapshotWritingDraft();checkpoint();
 if(!removeBlankPauta(next,true))return false;
 crossLineUndoReady=true;
 status('Pauta vazia removida. Ctrl+Z desfaz.','success');
 return true;
}
function joinWritingLines(direction){
 if(!editing||data.mode!=='text'||!editEnabled)return false;
 const input=$('nbEditorText');if(!input)return false;
 const line=editing.line,old=editing.id?page().notes.find(n=>n.id===editing.id):null;
 const next=line+Math.max(1,Number(old?.span)||1);
 const neighbor=page().notes.find(n=>n.id!==editing.id&&
  (direction<0?Number(n.line)+Math.max(1,Number(n.span)||1)===line:Number(n.line)===next));
 if(!neighbor)return false;
 const raw=input.value,left=direction<0?String(neighbor.text||''):raw;
 const right=direction<0?raw:String(neighbor.text||'');
 const glue=left&&right&&!/\s$/.test(left)&&!/^\s/.test(right)?' ':'';
 const joined=left+glue+right,position=left.length+glue.length;
 if(joined.length>2500){status('Esta anotação ultrapassaria o limite de caracteres.','error');return false;}
 const lineMain=direction<0?Number(neighbor.line):line;
 const base=direction<0?neighbor:(old||{line,size:1,font:data.font,frameW:620});
 const span=occupiedSpan({...base,line:lineMain,text:joined});
 if(lineMain+span>ROWS){status('Não há espaço para unir essas linhas nesta folha.','error');return false;}
 // Sem deslocar anotações para fora da folha.
 const rest=page().notes.filter(n=>n.id!==neighbor.id&&n.id!==old?.id)
  .sort((a,b)=>Number(a.line)-Number(b.line));
 let limit=lineMain+span;
 for(const n of rest){
  if(Number(n.line)<lineMain)continue;
  limit=Math.max(Number(n.line),limit)+Math.max(1,Number(n.span)||1);
  if(limit>ROWS){status('Não há espaço para unir linhas sem cortar texto.','error');return false;}
 }
 const current=snapshotWritingDraft();
 checkpoint(); // A cópia inclui até os caracteres ainda não confirmados na linha atual.
 const target=direction<0?neighbor:(current||neighbor);
 if(!current&&direction>0)target.line=line;
 const currentMap=inkMapFor(raw,current?.ink||data.ink,current?.inkRuns||[]);
 const neighborMap=inkMapFor(neighbor.text,neighbor.ink,neighbor.inkRuns);
 const first=direction<0?neighborMap:currentMap,last=direction<0?currentMap:neighborMap;
 const colors=first.concat(Array(glue.length).fill(first.at(-1)||data.ink),last);
 const ink=colors[0]||target.ink||data.ink;
 const discard=direction<0?current:(current?neighbor:null);
 page().notes=page().notes.filter(n=>n.id!==discard?.id);
 Object.assign(target,{text:joined,original:joined,ink,
  inkRuns:inkRunsFor(joined,colors,ink),pending:false,reviewed:false,span});
 delete target.grammarReviewVersion;
 makeRoom(target);
 editing=null;renderNotes();renderPageRail();save();
 beginEdit(lineMain,position);
 crossLineUndoReady=true;
 status('Linhas unidas. Ctrl+Z desfaz.','success');
 return true;
}
function applyTabKey(input,outdent){
 const value=input.value,start=input.selectionStart,end=input.selectionEnd;
 if(end>start){
  // Uma seleção não é substituída por Tab: cada linha selecionada recebe/remove recuo.
  const first=value.lastIndexOf('\n',start-1)+1;
  const lastSelected=end>first&&value[end-1]==='\n'?end-1:end;
  const breakAt=value.indexOf('\n',lastSelected);
  const last=breakAt<0?value.length:breakAt;
  const original=value.slice(first,last);
  const updated=original.split('\n').map(line=>outdent?line.replace(/^\t/,''):'\t'+line).join('\n');
  if(value.length+updated.length-original.length>(Number(input.maxLength)||Infinity))return true;
  input.setRangeText(updated,first,last,'select');
  input.setSelectionRange(first,first+updated.length);
 }else if(outdent){
  const first=value.lastIndexOf('\n',start-1)+1;
  if(value[first]==='\t'){
   input.setRangeText('',first,first+1,'start');
   input.setSelectionRange(Math.max(first,start-1),Math.max(first,start-1));
  }else if(start&&value[start-1]==='\t'){
   input.setRangeText('',start-1,start,'start');
  }else return true;
 }else{
  if(value.length+1>(Number(input.maxLength)||Infinity))return true;
  input.setRangeText('\t',start,end,'end');
 }
 input.dispatchEvent(new Event('input',{bubbles:true}));
 return true;
}
root.addEventListener('keydown',event=>{
 if(event.key==='Tab'&&!event.isComposing&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&editEnabled&&
    (event.target.id==='nbEditorText'||event.target.matches?.('[data-nb-sticky-text]'))){
  if(applyTabKey(event.target,event.shiftKey)){event.preventDefault();event.stopPropagation();}
  return;
 }
 if(event.target.id==='nbEditorText'&&editing){
  if(event.isComposing)return;
  const input=event.target,from=input.selectionStart,to=input.selectionEnd;
  const collapsed=from===to,plain=!event.ctrlKey&&!event.metaKey&&!event.altKey;
  if((event.ctrlKey||event.metaKey)&&!event.altKey&&event.code==='KeyZ'&&crossLineUndoReady){
   event.preventDefault();event.stopPropagation();crossLineUndoReady=false;
   if(event.shiftKey)redo();else undo();return;
  }
  if(plain&&collapsed&&event.key==='Backspace'){
   const marker=listInfo(input.value);
   const only=!!(marker&&!input.value.slice(marker.prefix.length).trim());
   const atMarker=!!(marker&&from<=marker.prefix.length&&from>marker.indent.length);
   if(marker&&(only||atMarker)){
    event.preventDefault();event.stopPropagation();removeListMarker(input,marker);return;
   }
   if(from===0){
    event.preventDefault();event.stopPropagation();
    if(!input.value.trim())previousWritingLine();
    else if(!joinWritingLines(-1)&&!pullWritingLineUp())moveWritingCaret(-1,'end');
    return;
   }
   if(!input.value.trim()){
    event.preventDefault();event.stopPropagation();previousWritingLine();return;
   }
  }
  if(plain&&collapsed&&event.key==='Delete'&&to===input.value.length){
   if(joinWritingLines(1)||deleteEmptyWritingLine()){
    event.preventDefault();event.stopPropagation();return;
   }
  }
  if(plain&&collapsed&&
     ((event.key==='ArrowLeft'&&from===0)||
      (event.key==='ArrowRight'&&to===input.value.length)||
      (event.key==='ArrowUp'&&!input.value.slice(0,from).includes('\n'))||
      (event.key==='ArrowDown'&&!input.value.slice(to).includes('\n')&&to===input.value.length))){
   const direction=['ArrowLeft','ArrowUp'].includes(event.key)?-1:1;
   if(moveWritingCaret(direction,direction<0?'end':'start')){
    event.preventDefault();event.stopPropagation();return;
   }
  }
  if((event.ctrlKey||event.metaKey)&&!event.altKey&&
     (event.key==='Home'||event.key==='End')){
   const toEnd=event.key==='End',atPage=toEnd?Math.max(0,data.pages.length-1):0;
   saveEditor(false);data.page=atPage;pendingPage=emptyPage();
   renderPage();renderPageRail();save();
   const notes=page().notes.slice().sort((a,b)=>Number(a.line)-Number(b.line));
   beginEdit(Number(toEnd?(notes.at(-1)?.line??FIRST_LINE):FIRST_LINE),toEnd?'end':'start');
   event.preventDefault();event.stopPropagation();return;
  }
  if(event.key==='Enter'&&!event.shiftKey&&plain){
   event.preventDefault();event.stopPropagation();
   if(from<input.value.length||to<input.value.length){
    // Enter no meio do texto insere uma quebra real sem sobrescrever os caracteres seguintes.
    if(input.value.length-(to-from)+1<=Number(input.maxLength||2500)){
     input.setRangeText('\n',from,to,'end');
     input.dispatchEvent(new Event('input',{bubbles:true}));
    }
   }else saveEditor(true,true);
   return;
  }
  if(event.key===' '&&plain&&!event.repeat&&collapsed&&to===input.value.length&&input.value.endsWith(' ')){
   event.preventDefault();event.stopPropagation();saveEditor(true);return;
  }
  if(event.key==='Escape'){
   event.preventDefault();event.stopPropagation();
   if(formatMenuOpen)closeFormatMenus();else act('none');
  }
 }
 if(event.target.id==='nbNewBook'&&event.key==='Enter'){event.preventDefault();addBook();}
 if(event.target.id==='nbRenameBook'&&event.key==='Enter'){event.preventDefault();renameBook();}
});
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&!$('nbExportMenu')?.hidden){
  toggleExportMenu(false);$('nbExportToggle')?.focus({preventScroll:true});
  event.preventDefault();event.stopPropagation();return;
 }
 if(listening){event.preventDefault();bindShortcut(event);return}
 if(event.isComposing)return;
 const inInput=!!event.target.closest('textarea,input,select,[contenteditable="true"]');
 if(editEnabled&&(event.ctrlKey||event.metaKey)&&!inInput){
  if(event.code==='KeyZ'){event.preventDefault();if(event.shiftKey)redo();else undo();return}
  if(event.code==='KeyY'){event.preventDefault();redo();return}
 }
 if(!inInput&&!event.repeat&&(event.key==='Delete'||event.key==='Backspace')&&selected){
  event.preventDefault();deleteSelected();return;
 }
 if(event.key==='Escape'){
  if(formatMenuOpen){event.preventDefault();closeFormatMenus();return;}
  if(resizeDrag)finishResize();
  if(!$('nbContextMenu').hidden)$('nbContextMenu').hidden=true;
  if(toolPaletteOpen){toolPaletteOpen=false;renderStickyPalette();}
  if(drawerOpen)closeDrawer();
  if(galleryOpen)hideGallery();
  if(!$('nbShortcutsDialog').hidden)$('nbShortcutsDialog').hidden=true;
  selected=null;selectedStroke=-1;act('none');event.preventDefault();return;
 }
 if(inInput||event.repeat)return;
 const code=shortcutEventString(event);
 const action=Object.keys(data.shortcuts).find(k=>data.shortcuts[k]===code);
 if(action&&!shelfOpen){event.preventDefault();act(action);}
});
// Faixa de proteção junto à lombada: nenhum gesto, seleção ou ferramenta.
root.addEventListener('pointerdown',event=>{
 if(isInBinderZone(event)){event.preventDefault();event.stopImmediatePropagation();return;}
 if(event.button===0&&event.target.closest('#nbCompanionWrap')&&
    editEnabled&&data.mode!=='none'){
  beginOpposingLeafGesture(event);
 }
},true);
root.addEventListener('click',event=>{
 if(isInBinderZone(event)){event.preventDefault();event.stopImmediatePropagation();}
},true);
root.addEventListener('contextmenu',event=>{
 if(isInBinderZone(event)){event.preventDefault();event.stopImmediatePropagation();}
},true);
root.addEventListener('pointerup',event=>{
 if(event.target.closest?.('#nbCompanionWrap')&&editEnabled&&data.mode!=='none')
  suppressLeafClickUntil=Date.now()+250;
},true);

root.addEventListener('pointerdown',event=>{
 if(event.button===3){sideBack(event);return}
 if(shelfOpen)return;
 if(!editEnabled){
   const onCompanion=!!event.target.closest('#nbCompanionWrap');
   const onPaper=event.button===0&&(onCompanion||
    (event.target.closest('#nbSheet')&&!event.target.closest('button,input,textarea')));
   if(onPaper)startPan(event);
   return;
  }
 // Também no modo Editar, a outra folha deve poder ser arrastada livremente.
 // Um clique sem movimento continua ativando aquela folha para escrita.
 if(event.button===0&&data.layout==='book'&&event.target.closest('#nbCompanionWrap')){
  startPan(event);return;
 }
 if(listening&&event.button!==0){
  event.preventDefault();
  if([1,2,3,4].includes(event.button)){
   const code='mouse:'+event.button;
   checkpoint();
   Object.keys(data.shortcuts).forEach(k=>{if(data.shortcuts[k]===code)delete data.shortcuts[k]});
   data.shortcuts[listening]=code;listening='';updateShortcutsList();save();
  }
  return;
 }
 if(event.target.closest('#nbContextMenu,#nbStickyPalette,#nbGallery,#nbDrawer,#nbPageRail'))return;
 const moveHandle=event.target.closest('[data-nb-move-handle]');
 if(moveHandle&&event.button===0&&data.mode==='warp'&&selected?.type==='stroke'){
  startMoveDrag(event,'stroke',selectedItem());return;
 }
 const handleButton=event.target.closest('[data-nb-handle]');
 if(handleButton&&event.button===0){startResize(event,handleButton.dataset.nbHandle);return;}
 const note=event.target.closest('[data-nb-note]'),sticky=event.target.closest('[data-nb-sticky]');
 if(event.button===0&&event.target.closest('[data-nb-delete-sticky]'))return;
 if(data.mode==='select'&&event.button===0){
  if(note){
   selectItem('note',note.dataset.nbNote);
   startMoveDrag(event,'note',selectedItem());return;
  }
  if(sticky){
   selectItem('sticky',sticky.dataset.nbSticky);
   startMoveDrag(event,'sticky',selectedItem());return;
  }
  if(event.target===canvas)return;
 }
 const handle=event.target.closest('[data-nb-drag]');
 if(handle&&!event.target.closest('button')&&data.mode!=='select'){
  const st=page().stickies.find(st=>st.id===handle.dataset.nbDrag);
  if(!st)return;
  checkpoint();stickyDrag={id:st.id,from:{x:event.clientX,y:event.clientY},start:{x:st.x,y:st.y}};
  handle.setPointerCapture?.(event.pointerId);event.preventDefault();return;
 }
 if(event.button===0&&sticky&&event.target.closest('textarea')){
  if(selected?.type!=='sticky'||selected?.id!==sticky.dataset.nbSticky){
   selected={type:'sticky',id:sticky.dataset.nbSticky};
   // Não recriar o textarea enquanto o usuário está digitando.
   const holder=root.querySelector('[data-nb-sticky="'+sticky.dataset.nbSticky+'"]');
   holder?.classList.add('nb-selected');
   holder?.querySelector('[data-nb-delete-sticky]')?.removeAttribute('hidden');
   renderSelectionHandles();
  }
  return;
 }
 const inSheet=!!event.target.closest('#nbSheet');
 if(inSheet&&(event.button===1 ||
      event.button===0&&['select','none'].includes(data.mode) ||
      event.pointerType==='mouse'&&event.button===0&&['text','sticky'].includes(data.mode))&&
     !event.target.closest('button,input,textarea,.nb-sticky,.nb-editor')){
  startPan(event);return;
 }
 if(event.button!==0||!inSheet||!['text','sticky','select'].includes(data.mode))return;
 if(event.target.closest('button,input,textarea,.nb-sticky'))return;
 const pos=point(event);
 if(event.pointerType==='touch'){
  tapCandidate={pointerId:event.pointerId,x:event.clientX,y:event.clientY,pos,mode:data.mode};
  return;
 }
 if(data.mode==='sticky'){addSticky(pos);return}
 if(data.mode==='text'&&pos.x>=88&&pos.y>=START+FIRST_LINE*L&&pos.y<START+ROWS*L){
  beginEdit(Math.floor((pos.y-START)/L));
 }
});
root.addEventListener('pointermove',event=>{
 if(opposingStrokePointer===event.pointerId){
  pointerMoveCanvas(event);return;
 }
 toolCursor(event);
 if(resizeDrag&&resizeDrag.pointerId===event.pointerId){updateResize(event);return;}
 if(moveDrag&&moveDrag.pointerId===event.pointerId){updateMoveDrag(event);return;}
 if(warpDrag&&warpDrag.pointerId===event.pointerId){pointerMoveCanvas(event);return;}
 if(panDrag&&event.pointerId===panDrag.pointerId){
  const dx=event.clientX-panDrag.startX,dy=event.clientY-panDrag.startY;
  if(Math.hypot(dx,dy)>6)panDrag.moved=true;
  if(panDrag.moved){
   setPan(panDrag.x+dx,panDrag.y+dy);
   event.preventDefault();
  }
  return;
 }
 if(tapCandidate&&event.pointerId===tapCandidate.pointerId&&
    Math.hypot(event.clientX-tapCandidate.x,event.clientY-tapCandidate.y)>10)tapCandidate=null;
 if(stickyDrag){
  const st=page().stickies.find(st=>st.id===stickyDrag.id);
  if(st){
   st.x=clamp(stickyDrag.start.x+(event.clientX-stickyDrag.from.x)/data.zoom,90,W-185);
   st.y=clamp(stickyDrag.start.y+(event.clientY-stickyDrag.from.y)/data.zoom,100,H-170);
   const el=root.querySelector('[data-nb-sticky="'+st.id+'"]');
   if(el){el.style.left=st.x+'px';el.style.top=st.y+'px';}
  }return;
 }
 // A linha roxa acompanha a folha física sob o mouse, não a folha ativa.
 if(data.mode==='text'&&event.pointerType==='mouse'&&!editing){
  const liveHover=$('nbLineHover'),companionHover=$('nbCompanionLineHover');
  liveHover.hidden=true;
  if(companionHover)companionHover.hidden=true;
  const onLive=!!event.target.closest('#nbSheet');
  const onCompanion=data.layout==='book'&&!!event.target.closest('#nbCompanionWrap');
  if((onLive||onCompanion)&&!isInBinderZone(event)){
   const rect=(onCompanion?companion:sheet).getBoundingClientRect();
   const x=(event.clientX-rect.left)*W/Math.max(1,rect.width);
   const y=(event.clientY-rect.top)*H/Math.max(1,rect.height);
   const el=onCompanion?companionHover:liveHover;
   if(el&&x>=90&&x<W&&y>=START+FIRST_LINE*L&&y<START+ROWS*L){
    el.style.top=(START+Math.floor((y-START)/L)*L)+'px';
    el.hidden=false;
   }
  }
 }
});
root.addEventListener('pointerup',event=>{
 if(opposingStrokePointer===event.pointerId){
  opposingStrokePointer=null;
  pointerUpCanvas(event);
  suppressLeafClickUntil=Date.now()+250;
  return;
 }
 if(resizeDrag&&resizeDrag.pointerId===event.pointerId){finishResize(event);return;}
 if(moveDrag&&moveDrag.pointerId===event.pointerId){finishMoveDrag(event);return;}
 if(warpDrag&&warpDrag.pointerId===event.pointerId){pointerUpCanvas(event);return;}
 if(panDrag&&event.pointerId===panDrag.pointerId){
  const drag=panDrag;panDrag=null;
   if(drag.moved)suppressLeafClickUntil=Date.now()+80;
  if(drag.button===0&&!drag.moved){
   const pos=point(event);
   if(drag.mode==='text'&&pos.x>=88&&pos.y>=START+FIRST_LINE*L&&pos.y<START+ROWS*L)
    beginEdit(Math.floor((pos.y-START)/L));
   else if(drag.mode==='sticky')addSticky(pos);
   else if(drag.mode==='select'){selected=null;renderNotes();renderStickies();drawCanvas();}
  }
  return;
 }
 if(tapCandidate&&event.pointerId===tapCandidate.pointerId){
  const tap=tapCandidate;tapCandidate=null;
  if(!pinch&&tap.mode===data.mode){
   if(data.mode==='sticky')addSticky(tap.pos);
   else if(data.mode==='text'&&tap.pos.x>=88&&tap.pos.y>=START+FIRST_LINE*L&&tap.pos.y<START+ROWS*L)
    beginEdit(Math.floor((tap.pos.y-START)/L));
   else if(data.mode==='select'&&event.target===canvas){
    const hit=findStrokeNear(tap.pos);if(hit.stroke)selectItem('stroke',hit.stroke.id);
   }
  }
 }
 if(stickyDrag){stickyDrag=null;save();}
});
root.addEventListener('pointercancel',event=>{
 if(opposingStrokePointer===event.pointerId){
  opposingStrokePointer=null;pointerUpCanvas(event);
 }
 if(resizeDrag&&resizeDrag.pointerId===event.pointerId)finishResize(event);
 if(moveDrag&&moveDrag.pointerId===event.pointerId)finishMoveDrag(event);
 if(warpDrag&&warpDrag.pointerId===event.pointerId)pointerUpCanvas(event);
 tapCandidate=null;panDrag=null;if(stickyDrag){stickyDrag=null;save();}
});
root.addEventListener('pointerleave',()=>{
 $('nbToolCursor').hidden=true;$('nbLineHover').hidden=true;
 $('nbCompanionLineHover')?.setAttribute('hidden','');
});
canvas.addEventListener('pointerdown',pointerDownCanvas);
canvas.addEventListener('pointermove',pointerMoveCanvas);
canvas.addEventListener('pointerup',pointerUpCanvas);
canvas.addEventListener('pointercancel',pointerUpCanvas);
canvas.addEventListener('lostpointercapture',()=>{if(drawPoints||warpDrag||eraseDrag||moveDrag?.type==='stroke')pointerUpCanvas();});
root.addEventListener('contextmenu',event=>{
 if(listening)return event.preventDefault();
 if(event.target.closest('#nbSheet'))contextMenu(event);
 if(Object.values(data.shortcuts).includes('mouse:2')&&event.target.closest('#nbSheet'))event.preventDefault();
});
root.addEventListener('pointerdown',event=>{
 if(listening||event.button===0||event.target.closest('input,textarea,button,select'))return;
 if(event.button===2&&editEnabled&&event.target.closest('#nbSheet')&&(selectedItem()||event.target.closest('[data-nb-note],[data-nb-sticky]')))return;
 const action=Object.keys(data.shortcuts).find(k=>data.shortcuts[k]==='mouse:'+event.button);
 if(action){event.preventDefault();act(action)}
},true);
view.addEventListener('wheel',event=>{
 // Campos editáveis mantêm a rolagem nativa; na folha, a roda controla o zoom.
 if(event.target.closest('textarea,input,select'))return;
 event.preventDefault();
 const speed=event.deltaMode===1?13:1;
 zoomAt(data.zoom*Math.exp(-event.deltaY*speed*.0015),event.clientX,event.clientY);
},{passive:false});
view.addEventListener('touchstart',event=>{
 if(event.touches.length===2){
  const a=event.touches[0],b=event.touches[1];
  pinch={distance:Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY),zoom:data.zoom};
  tapCandidate=null;drawPoints=null;warpDrag=null;
 }
},{passive:true});
view.addEventListener('touchmove',event=>{
 if(event.touches.length!==2||!pinch)return;
 event.preventDefault();
 const a=event.touches[0],b=event.touches[1];
 const gap=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);
 zoomAt(pinch.zoom*gap/Math.max(5,pinch.distance),(a.clientX+b.clientX)/2,(a.clientY+b.clientY)/2);
},{passive:false});
view.addEventListener('touchend',event=>{if(event.touches.length<2)pinch=null},{passive:true});
window.addEventListener('blur',()=>{if(drawPoints||warpDrag)pointerUpCanvas();if(stickyDrag){stickyDrag=null;save();}});
window.addEventListener('pagehide',()=>{
 // O iframe pode ser desmontado ao navegar: conserva inclusive a anotação ainda em edição.
 if(editing){
  const typed=String($('nbEditorText')?.value||'').replace(/\r\n?/g,'\n').trimEnd();
  const marker=listInfo(typed);
  if(marker&&!typed.slice(marker.prefix.length).trim()){
   if(editing.id)page().notes=page().notes.filter(n=>n.id!==editing.id);
  }else if(!typed.trim()&&editing.id){
   // Ao descarregar o iframe, não persistir uma anotação já apagada na caixa.
   page().notes=page().notes.filter(n=>n.id!==editing.id);
  }else if(typed.trim()){
   let note=editing.id?page().notes.find(n=>n.id===editing.id):null;
   if(!note){note={id:id(),line:editing.line,text:typed};page().notes.push(note)}
   const colors=reconcileInkMap(editing.draft,editing.inkMap,typed,data.ink);
   delete note.grammarReviewVersion;
   Object.assign(note,{text:typed,original:typed,font:data.font,size:data.size,ink:colors[0]||data.ink,
    inkRuns:inkRunsFor(typed,colors,data.ink),pending:false,reviewed:false});
   note.span=occupiedSpan(note);makeRoom(note);
  }
 }
 persistNow();
});
setInterval(()=>{
 try{
  if(window.parent.uentzoulAIAuth?.user?.()?.id!==userId||window.parent.uentzoulAIAuth?.user?.()?.is_anonymous===true){
   document.body.innerHTML='<div class="nb-guard">A conta ativa mudou. Entre novamente para acessar seus cadernos.</div>';
  }
 }catch(_){document.body.innerHTML='<div class="nb-guard">Acesso encerrado.</div>'}
},7000);
function syncTheme(){
 let dark=false;
 try{dark=window.parent.document.documentElement.getAttribute('data-theme')==='dark'}catch(_){}
 document.documentElement.dataset.theme=dark?'dark':'light';
}
syncTheme();window.matchMedia('(prefers-color-scheme:dark)').addEventListener?.('change',syncTheme);
setInterval(syncTheme,1100);
renderAll();
setZoom(data.zoom,false);
void loadCloud();
window.addEventListener('online',()=>{
 if(!cloudReady)void loadCloud();
 else if(cloudDirty){clearTimeout(retryTimer);retryTimer=null;scheduleCloudSave(100);}
});
window.addEventListener('visibilitychange',()=>{
 if(document.visibilityState==='hidden'&&cloudDirty&&cloudReady)void flushCloud();
});
window.addEventListener('resize',scheduleSnapshotScales,{passive:true});
status('Carregando os cadernos da sua conta…','');
if(isMobile()&&!localStorage.getItem(STORE))setZoom(.5,false);
})();
