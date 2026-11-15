/* Caderno de aula — primeira prévia administrativa.
   Conteúdo local por conta, nenhuma alteração nas tabelas ou em outras abas. */
(function(){
'use strict';
const root=document.getElementById('nbRoot');
let userId='';
try{
 if(window.parent!==window &&
    window.parent.uentzoulAdminConfig?.isAdmin?.()===true &&
    window.parent.uentzoulAIAuth?.user?.()?.id){
  userId=String(window.parent.uentzoulAIAuth.user().id);
 }
}catch(_){}
if(!userId){
 root.innerHTML='<section><strong>Acesso restrito.</strong><p>Esta prévia só pode ser aberta por uma conta administrativa autenticada no site.</p></section>';
 return;
}
const W=780,H=1240,L=34,START=97,ROWS=30,FIRST_LINE=3;
const STORE='uentzoul:caderno:alpha2:'+userId;
const LEGACY_STORE='uentzoul:caderno:alpha1:'+userId;
const COLORS={black:'#24242e',blue:'#2559a4',red:'#bb3d43'};
const MODES=['text','select','draw','erase','sticky','warp'];
const ACTIONS=[
 ['text','Escrever'],['select','Selecionar'],['draw','Desenhar'],['erase','Borracha'],['sticky','Post-it'],['warp','Deformar'],
 ['black','Caneta preta'],['blue','Caneta azul'],['red','Caneta vermelha'],
 ['print','Letra de forma'],['cursive','Letra cursiva'],
 ['prev','Página anterior'],['next','Próxima página'],['zoomIn','Aproximar'],['zoomOut','Afastar'],
 ['smooth','Alternar ajuste do traço']
];
const emptyPage=()=>({title:'',date:'',notes:[],strokes:[],stickies:[]});
const newBook=(name='Meu caderno')=>({id:'book-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),name,pages:[]});
const defaults=()=>({books:[{id:'book-original',name:'Meu caderno',pages:[]}],bookId:'book-original',page:0,mode:'select',font:'print',ink:'blue',size:1,smooth:false,zoom:.88,shortcuts:{},stickyTone:'yellow',eraserMode:'parts',eraserRadius:14});
const hasPageContent=p=>!!(p?.notes?.some(n=>String(n.text||'').trim())||p?.strokes?.some(s=>s.points?.length)||p?.stickies?.length);
const cleanPage=p=>({title:String(p?.title||'').slice(0,100),date:String(p?.date||'').slice(0,16),
 notes:Array.isArray(p?.notes)?p.notes.slice(0,140):[],strokes:Array.isArray(p?.strokes)?p.strokes.slice(0,500):[],
 stickies:Array.isArray(p?.stickies)?p.stickies.slice(0,40):[]});
let data=defaults(),stored=null;
try{stored=JSON.parse(localStorage.getItem(STORE)||'null');}catch(_){}
if(!stored)try{
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
  data.size=Math.min(3,Math.max(1,Number(data.size)||1));
  if(!MODES.includes(data.mode))data.mode='text';
  if(!COLORS[data.ink])data.ink='blue';
  if(!['print','cursive'].includes(data.font))data.font='print';
  if(!data.shortcuts||typeof data.shortcuts!=='object')data.shortcuts={};
 }
}
const activeBook=()=>data.books.find(b=>b.id===data.bookId)||data.books[0];
data.pages=activeBook().pages;
data.mode='select'; // Ferramenta inicial segura, mesmo depois de restaurar sessão.
if(!stored?.smoothingV3){data.smooth=true;data.smoothingV3=true;}
let pendingPage=emptyPage(),galleryOpen=false,drawerOpen=false,galleryOffset=0,railOpen=!window.matchMedia('(max-width:760px)').matches;
let selected=null,contextTarget=null,panDrag=null,lastPointer=null,toolPaletteOpen=false,eraseDrag=null,moveDrag=null,resizeDrag=null;
function materializePage(){
 if(data.page!==data.pages.length||!hasPageContent(pendingPage))return;
 if(data.pages.length>=250)return;
 data.pages.push(pendingPage);pendingPage=emptyPage();
}
function serializable(){
 materializePage();
 // Páginas sem conteúdo não contam nem permanecem salvas.
 for(const book of data.books){
  const original=book.pages||[];
  let skipped=0;
  const cleaned=[];
  original.forEach((item,i)=>{
   if(hasPageContent(item))cleaned.push(item);
   else if(book.id===data.bookId){
    if(i<data.page)skipped++;
    if(i===data.page)pendingPage=cleanPage(item);
   }
  });
  if(book.id===data.bookId){
   data.page=Math.min(cleaned.length,Math.max(0,data.page-skipped));
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
let editing=null, previewText='',drawPoints=null,warpDrag=null,stickyDrag=null,selectedStroke=-1,tapCandidate=null;
let undoStack=[],redoStack=[],listening='',pinch=null,saveTimer=null,flipping=false;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const page=()=>data.pages[data.page]||pendingPage;
const id=()=>typeof crypto.randomUUID==='function'?crypto.randomUUID():'nb-'+Date.now()+'-'+Math.random().toString(36).slice(2);
const isMobile=()=>window.matchMedia('(max-width:760px)').matches;
function persistNow(){
 clearTimeout(saveTimer);
 try{localStorage.setItem(STORE,JSON.stringify(serializable()));return true}
 catch(e){status('Armazenamento cheio. Exporte uma cópia do caderno.','error');return false}
}
function save(){
 clearTimeout(saveTimer);
 saveTimer=setTimeout(()=>{
  if(persistNow())status('Salvo neste dispositivo','success');
 },180);
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
 '<header class="nb-top"><div class="nb-brand"><button type="button" class="nb-mark nb-hamburger" data-nb-action="drawer" aria-label="Abrir lista de cadernos" title="Cadernos">☰</button><div><h1 id="nbBookHeading">Caderno de aula</h1><p>Prévia exclusiva da administração</p></div></div>'+
 '<div class="nb-top-right"><span class="nb-status" id="nbStatus" role="status">Rascunho local · salvo automaticamente</span><button class="nb-quiet" data-nb-action="export">Exportar PDF</button></div></header>'+
 '<div class="nb-tools" id="nbTools" role="toolbar" aria-label="Ferramentas do caderno">'+
 '<div class="nb-toolgroup"><button class="nb-tool" data-nb-action="text" title="Escrever nas linhas">✎ Escrever</button>'+
 '<button class="nb-tool" data-nb-action="select" title="Selecionar anotações, post-its e desenhos">⌖ Selecionar</button>'+
 '<button class="nb-tool" data-nb-action="erase" title="Apagar partes ou traços inteiros de desenhos">⌫ Borracha</button>'+
 '<button class="nb-tool" data-nb-action="draw" title="Desenhar diretamente na folha">〰 Desenhar</button>'+
 '<button class="nb-tool" data-nb-action="sticky" title="Colocar um post-it">▤ Post-it</button>'+
 '<button class="nb-tool" data-nb-action="warp" title="Deformar somente traços corrigidos">⌁ Deformar</button>'+
 '<span id="nbEraserControls" class="nb-eraser-controls" hidden><label for="nbEraseBehavior">Apagar</label>'+
 '<select id="nbEraseBehavior" aria-label="Tipo de borracha"><option value="parts">Trechos</option><option value="whole">Traço inteiro</option></select>'+
 '<label for="nbEraseSize">Raio</label><input id="nbEraseSize" type="range" min="6" max="32" step="2" value="14" aria-label="Tamanho da borracha"></span></div>'+
 '<span class="nb-sep"></span><div class="nb-toolgroup"><span class="nb-colors" aria-label="Cor da caneta">'+
 '<button class="nb-color" data-nb-action="black" style="--swatch:#24242e" aria-label="Caneta preta"><span></span></button>'+
 '<button class="nb-color" data-nb-action="blue" style="--swatch:#2559a4" aria-label="Caneta azul"><span></span></button>'+
 '<button class="nb-color" data-nb-action="red" style="--swatch:#bb3d43" aria-label="Caneta vermelha"><span></span></button></span>'+
 '<select class="nb-font-select" id="nbFont" aria-label="Tipo de letra"><option value="print">Letra de forma</option><option value="cursive">Letra cursiva</option></select>'+
 '<select class="nb-size-select" id="nbSize" aria-label="Altura da letra"><option value="1">1 linha</option><option value="2">2 linhas</option><option value="3">3 linhas</option></select></div>'+
 '<div class="nb-toolgroup"><label class="nb-correct-toggle" title="Reconhecer formas simples e suavizar tremores"><input id="nbSmooth" type="checkbox">Ajustar traços</label>'+
 '<button class="nb-tool" data-nb-action="shortcuts" title="Personalizar teclas e botões do mouse">⌨ Atalhos</button>'+
 '<button class="nb-tool" data-nb-action="undo" title="Desfazer">↶</button><button class="nb-tool" data-nb-action="redo" title="Refazer">↷</button></div></div>'+
 '<div class="nb-workspace" id="nbWorkspace"><aside id="nbPageRail" class="nb-page-rail" aria-label="Folhas deste caderno"></aside>'+
 '<div class="nb-view" id="nbViewport" aria-label="Folha do caderno, com zoom e rolagem">'+
 '<div class="nb-stage" id="nbStage"><div class="nb-sheet-wrap" id="nbWrap">'+
 '<div class="nb-sheet" id="nbSheet"><div class="nb-holes" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>'+
 '<input id="nbPaperTitle" class="nb-paper-title" placeholder="Título da aula (opcional)" maxlength="100" aria-label="Título da aula">'+
 '<div class="nb-paper-date-group"><label class="nb-paper-date-label" for="nbPaperDate">Data</label><input id="nbPaperDate" class="nb-paper-date" type="date" aria-label="Data da aula"></div>'+
 '<button class="nb-corner-back" data-nb-action="prev" aria-label="Voltar à página anterior" title="Página anterior">‹</button>'+
 '<div class="nb-line-hover" id="nbLineHover" hidden></div>'+
 '<canvas id="nbDrawing" class="nb-drawing" width="780" height="1240" aria-label="Área de desenho"></canvas>'+
 '<div class="nb-text-layer" id="nbTextLayer"></div><div class="nb-sticky-layer" id="nbStickyLayer"></div><div class="nb-transform-layer" id="nbTransformLayer"></div>'+
 '<div id="nbEditorHost"></div><button class="nb-fold" data-nb-action="next" title="Virar a página" aria-label="Virar a página"></button><span class="nb-fold-label" aria-hidden="true">›</span>'+
 '<div class="nb-page-num" id="nbPageNum"></div></div></div></div></div></div>'+
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
 return data.page>=count?'Nova página · '+count+' '+(count===1?'salva':'salvas'):'Página '+(data.page+1)+' de '+count;
}
function updateBookHeading(){$('nbBookHeading').textContent=activeBook().name||'Caderno de aula';}
const view=$('nbViewport'),sheet=$('nbSheet'),canvas=$('nbDrawing'),ctx=canvas.getContext('2d'),wrap=$('nbWrap');
function currentRect(){return sheet.getBoundingClientRect()}
function point(event){
 const r=currentRect();return{x:clamp((event.clientX-r.left)/data.zoom,0,W),y:clamp((event.clientY-r.top)/data.zoom,0,H)};
}
function setZoom(value,saveState=true){
 data.zoom=clamp(Number(value)||1,.42,2.3);
 wrap.style.width=(W*data.zoom)+'px';wrap.style.height=(H*data.zoom)+'px';
 sheet.style.transform='scale('+data.zoom+')';sheet.style.transformOrigin='top left';
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
 const target=isMobile()?.98:1.12;
 if(data.zoom<target)setZoom(target);
 const y=(START+(line+2)*L)*data.zoom;
 view.scrollTop=clamp(y-view.clientHeight*.38,0,view.scrollHeight-view.clientHeight);
 view.scrollLeft=clamp(110*data.zoom-view.clientWidth*.17,0,view.scrollWidth-view.clientWidth);
}
function refreshTools(){
 for(const a of MODES){const b=root.querySelector('[data-nb-action="'+a+'"]');b?.setAttribute('aria-pressed',String(data.mode===a));}
 $('nbEraserControls').hidden=data.mode!=='erase';
 $('nbEraseBehavior').value=data.eraserMode==='whole'?'whole':'parts';
 $('nbEraseSize').value=clamp(Number(data.eraserRadius)||14,6,32);
 for(const a of Object.keys(COLORS)){const b=root.querySelector('[data-nb-action="'+a+'"]');b?.setAttribute('aria-pressed',String(data.ink===a));}
 $('nbFont').value=data.font;$('nbSize').value=String(data.size);$('nbSmooth').checked=!!data.smooth;
 sheet.dataset.mode=data.mode;
 $('nbPageCount').textContent=pageCountLabel();updateBookHeading();
 $('nbPageNum').textContent=String(data.page+1).padStart(2,'0');
 $('nbPaperTitle').value=page().title||'';$('nbPaperDate').value=page().date||'';
 const back=$('nbSheet').querySelector('.nb-corner-back');if(back)back.disabled=data.page===0;
}
function letterMarkup(text){
 return Array.from(String(text||'')).map(ch=>{
  if(ch==='\n')return '<br>';
  const isUpper=/\p{Lu}/u.test(ch);
  return '<span class="'+(isUpper?'nb-uppercase':'nb-lowercase')+'">'+esc(ch)+'</span>';
 }).join('');
}
function noteMarkup(n,preview){
 const size=clamp(Number(n.size)||1,1,3),
  top=START+(Number(n.line)||0)*L+(Number(n.offsetY)||0),
  left=clamp(Number(n.x)||110,85,W-65),
  width=clamp(Number(n.frameW)||620,70,W-left-20),
  scaleX=clamp(Number(n.scaleX)||1,.35,3.8),scaleY=clamp(Number(n.scaleY)||1,.35,3.8);
 const css='left:'+left+'px;right:auto;width:'+width+'px;top:'+top+'px;min-height:'+
  (size*L)+'px;transform:scale('+scaleX+','+scaleY+');transform-origin:top left;--nb-small:'+
  (size*26)+'px;color:'+(COLORS[n.ink]||COLORS.blue)+';';
 return '<div class="nb-note '+(n.font==='cursive'?'cursive':'print')+(preview?' nb-preview':'')+
  (editing&&editing.id===n.id?' nb-selected':'')+(n.pending?' nb-correcting':'')+
  '" style="'+css+'"'+(!preview?' data-nb-note="'+esc(n.id)+'"':'')+'><span class="nb-note-content">'+letterMarkup(n.text)+'</span></div>';
}
function renderNotes(){
 const notes=page().notes;
 $('nbTextLayer').innerHTML=notes.filter(n=>!(editing&&n.id===editing.id)).map(n=>noteMarkup(n,false)).join('');
}
function editorMarkup(){
 const host=$('nbEditorHost');
 if(!editing){host.innerHTML='';return;}
 const line=editing.line,top=START+line*L-6,fsize=clamp(Number(data.size)||1,1,3)*26;
 const lineHeight=Math.max(34,Math.round(fsize*1.22));
 host.innerHTML='<textarea class="nb-inline-edit '+(data.font==='cursive'?'cursive':'print')+
  '" id="nbEditorText" style="top:'+top+'px;--nb-small:'+fsize+'px;line-height:'+lineHeight+'px;color:'+
  (COLORS[data.ink]||COLORS.blue)+';" rows="1" maxlength="2500" spellcheck="true"'+
  ' aria-label="Escrever diretamente na linha '+(line+1)+'"></textarea>';
 const input=$('nbEditorText');input.value=editing.draft||'';
 input.style.height=Math.max(38,input.scrollHeight)+'px';
 requestAnimationFrame(()=>{input.focus({preventScroll:true});input.setSelectionRange(input.value.length,input.value.length)});
}
function beginEdit(line){
 if(data.mode!=='text'||line<FIRST_LINE)return;
 line=clamp(line,FIRST_LINE,ROWS-1);
 if(editing&&editing.line!==line){
  const current=String($('nbEditorText')?.value||'');
  if(current.trim())saveEditor(false);else closeEditor();
 }
 if(line===FIRST_LINE&&data.size>2)data.size=2;
 const existing=page().notes.find(n=>line>=Number(n.line)&&line<Number(n.line)+Number(n.span||Number(n.size)||1));
 editing={line:existing?Number(existing.line):line,id:existing?.id||null,draft:existing?.original||existing?.text||''};
 if(existing){data.font=existing.font;data.ink=existing.ink;data.size=existing.size;}
 if(editing.line===FIRST_LINE&&data.size>2)data.size=2;
 previewText=editing.draft;
 refreshTools();renderNotes();editorMarkup();focusLine(editing.line);
}
function closeEditor(){editing=null;previewText='';renderNotes();editorMarkup();}
function occupiedSpan(note){
 const size=clamp(Number(note.size)||1,1,3);
 const maxLineChars=Math.max(12,Math.floor(53/size));
 const visualRows=Math.max(1,String(note.text||'').split('\n').reduce((n,line)=>n+Math.max(1,Math.ceil(line.length/maxLineChars)),0));
 return clamp(size*visualRows,1,ROWS);
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
function fallbackBasic(text){
 return text.replace(/ {2,}/g,' ').replace(/\s+([,.;!?])/g,'$1').replace(/([,;!?])(?=[^\s])/g,'$1 ').trim();
}
async function correctNote(noteId,raw){
 const currentOwner=userId;
 try{
  const auth=window.parent.uentzoulAIAuth;
  if(!window.parent.uentzoulAdminConfig?.isAdmin?.()||auth?.user?.()?.id!==currentOwner)throw Error('A sessão administrativa terminou.');
  const c=auth.client?.();
  if(!c)throw Error('Serviço indisponível.');
  const {data:result,error}=await c.functions.invoke('caderno-revisao',{body:{text:raw}});
  if(error||typeof result?.text!=='string')throw error||Error('Sem resposta da revisão.');
  const revised=result.text.trim();
  if(!revised||revised.length<raw.length*.5||revised.length>raw.length*1.75)throw Error('Revisão não confiável.');
  const n=data.books.flatMap(b=>b.pages).flatMap(p=>p.notes).find(n=>n.id===noteId);
  if(!n||n.original!==raw)return;
  n.text=revised;n.pending=false;n.reviewed=result.reviewed===true;n.span=occupiedSpan(n);
  if(page().notes.includes(n))makeRoom(n);
  if(page().notes.includes(n))renderNotes();
  save();
  status(result.reviewed===false?'Texto original preservado: a revisão automática não foi confirmada.':revised===raw?'Anotação conferida, sem mudanças.':'Gramática corrigida sem reescrever a anotação.',result.reviewed===false?'error':'success');
 }catch(err){
  const n=data.books.flatMap(b=>b.pages).flatMap(p=>p.notes).find(n=>n.id===noteId);
  if(!n||n.original!==raw)return;
  n.pending=false;n.reviewed=false;
  n.text=raw;
  if(page().notes.includes(n))renderNotes();
  save();status('Anotação salva. Revisão de IA indisponível; texto original preservado.','error');
 }
}
function saveEditor(advance=true){
 if(!editing)return;
 const priorLine=editing.line;
 const typed=String($('nbEditorText')?.value||'').trim();
 if(!typed){closeEditor();if(advance)advanceLine(priorLine+1);return}
 checkpoint();
 let n=editing.id?page().notes.find(n=>n.id===editing.id):null;
 if(!n){n={id:id(),line:editing.line,text:typed};page().notes.push(n)}
 Object.assign(n,{text:typed,original:typed,font:data.font,size:data.size,ink:data.ink,pending:true,reviewed:false});
 n.span=occupiedSpan(n);makeRoom(n);materializePage();
 const nid=n.id;closeEditor();renderNotes();save();
 status('Linha registrada; revisão gramatical em andamento…','');
 void correctNote(nid,typed);
 if(advance)advanceLine(priorLine+1);
}
function renderStickies(){
 $('nbStickyLayer').innerHTML=page().stickies.map(s=>
  '<div class="nb-sticky" data-nb-sticky="'+esc(s.id)+'" data-tone="'+esc(s.tone||'yellow')+
  '" style="left:'+clamp(Number(s.x)||0,90,W-50)+'px;top:'+clamp(Number(s.y)||0,95,H-50)+
  'px;width:'+clamp(Number(s.w)||170,65,460)+'px;height:'+clamp(Number(s.h)||146,65,460)+'px;">'+
  '<div class="nb-sticky-head" data-nb-drag="'+esc(s.id)+'" title="Arraste para mover"><span>✦ Nota adesiva</span>'+
  '<button type="button" data-nb-delete-sticky="'+esc(s.id)+'" title="Remover post-it" aria-label="Remover post-it"'+(selected?.type==='sticky'&&selected.id===s.id?'':' hidden')+'>×</button></div>'+
  '<textarea aria-label="Escreva no post-it" data-nb-sticky-text="'+esc(s.id)+'" maxlength="700" placeholder="Sua observação…">'+esc(s.text||'')+'</textarea></div>'
 ).join('');
}
function addSticky(p){
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
  paintStroke(s.points,s.ink,Number(s.width)||2.6,!!s.corrected);
  if((data.mode==='warp'&&selectedStroke===i)||(selected?.type==='stroke'&&selected.id===s.id)){
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
  host.innerHTML='';return;
 }
 const minW=selected.type==='stroke'?12:42,minH=selected.type==='stroke'?12:35;
 const x=clamp(rect.x,0,W-minW),y=clamp(rect.y,0,H-minH);
 const width=clamp(rect.w,minW,W-x),height=clamp(rect.h,minH,H-y);
 host.innerHTML='<div class="nb-transform-box" style="left:'+x+'px;top:'+y+'px;width:'+width+
  'px;height:'+height+'px;" role="group" aria-label="Redimensionar item selecionado">'+
  TRANSFORM_HANDLES.map(dir=>'<button type="button" class="nb-transform-handle nb-handle-'+dir+
   '" data-nb-handle="'+dir+'" aria-label="Redimensionar '+dir+'" title="Arraste para redimensionar"></button>').join('')+
  '</div>';
}
function startResize(event,dir){
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
  item.scaleY=clamp(drag.initialScaleY*b.h/Math.max(1,drag.rect.h),.35,3.8);
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
  left:view.scrollLeft,top:view.scrollTop,moved:false,mode:data.mode,button:event.button};
 sheet.setPointerCapture?.(event.pointerId);
 event.preventDefault();
}

function startMoveDrag(event,type,item){
 if(!item)return;
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
  drawCanvas();
 }else if(drag.type==='sticky'){
  item.x=clamp(drag.originX+dx,88,W-(Number(item.w)||170));
  item.y=clamp(drag.originY+dy,95,H-(Number(item.h)||146));
  const el=root.querySelector('[data-nb-sticky="'+item.id+'"]');
  if(el){el.style.left=item.x+'px';el.style.top=item.y+'px';}
  renderSelectionHandles();
 }else if(drag.type==='note'){
  const el=root.querySelector('[data-nb-note="'+item.id+'"]');
  if(el)el.style.transform='translate('+dx+'px,'+dy+'px) scale('+(Number(item.scaleX)||1)+','+(Number(item.scaleY)||1)+')';
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
  const maxLine=Math.max(FIRST_LINE,ROWS-span);
  const intended=clamp(drag.originLine+delta,FIRST_LINE,maxLine);
  const collides=line=>page().notes.some(n=>n.id!==item.id&&
    line<(Number(n.line)||0)+Math.max(1,Number(n.span)||1)&&line+span>Number(n.line));
  let chosen=intended;
  if(collides(chosen)){
   const available=Array.from({length:maxLine-FIRST_LINE+1},(_,i)=>i+FIRST_LINE)
    .filter(line=>!collides(line))
    .sort((a,b)=>Math.abs(a-intended)-Math.abs(b-intended));
   chosen=available.length?available[0]:drag.originLine;
  }
  item.line=chosen;
  item.x=clamp(drag.originX+((drag.last||drag.start).x-drag.start.x),85,W-70);
 }
 serializable();renderNotes();renderStickies();drawCanvas();refreshTools();renderSelectionHandles();save();
 status('Item movido. Use Ctrl+Z para desfazer.','success');
}

function pointerDownCanvas(event){
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
  event.preventDefault();
 }else if(data.mode==='warp'){
  let best={score:18,index:-1,point:0};
  page().strokes.forEach((stroke,i)=>{
   if(!stroke.corrected)return;
   (stroke.points||[]).forEach((q,j)=>{const d=dist(p,q);if(d<best.score)best={score:d,index:i,point:j}});
  });
  if(best.index<0){status('A deformação só funciona em traços ajustados.','error');return}
  checkpoint();selectedStroke=best.index;
  const stroke=page().strokes[best.index];
  warpDrag={index:best.index,at:best.point,from:p,original:stroke.points.map(q=>({...q}))};
  canvas.setPointerCapture?.(event.pointerId);event.preventDefault();drawCanvas();
 }
}
function pointerMoveCanvas(event){
 if(eraseDrag&&eraseDrag.pointerId===event.pointerId){applyEraser(point(event));event.preventDefault();return;}
 if(moveDrag&&moveDrag.pointerId===event.pointerId&&moveDrag.type==='stroke'){updateMoveDrag(event);event.preventDefault();return;}
 if(drawPoints){drawPoints.push(point(event));drawCanvas();event.preventDefault();}
 if(warpDrag){
  const p=point(event),dx=p.x-warpDrag.from.x,dy=p.y-warpDrag.from.y;
  const reference=warpDrag.original[warpDrag.at];
  page().strokes[warpDrag.index].points=warpDrag.original.map(q=>{
   const weight=Math.exp(-Math.pow(dist(q,reference)/83,2)*1.3);
   return{x:clamp(q.x+dx*weight,5,W-5),y:clamp(q.y+dy*weight,5,H-5)};
  });
  drawCanvas();event.preventDefault();
 }
}
function pointerUpCanvas(event){
 if(eraseDrag){eraseDrag=null;serializable();renderNotes();save();status('Desenho apagado. Use Ctrl+Z para desfazer.','success');}
 if(moveDrag&&moveDrag.type==='stroke'){finishMoveDrag(event);}
 if(drawPoints){
  const raw=drawPoints;drawPoints=null;
  if(raw.length){
   const result=data.smooth?fluidStroke(raw):{points:raw,kind:'free'};
   page().strokes.push({id:id(),points:result.points,corrected:!!data.smooth,kind:result.kind,ink:data.ink,width:2.6});
   save();status(data.smooth?'Desenho ajustado. Pode usar Deformar.':'Traço livre inserido.','success');
  }
 }
 if(warpDrag){warpDrag=null;save();status('Traço deformado.','success');}
 drawCanvas();
}

/* A escrita acontece no papel; Enter conclui a linha e posiciona o cursor na próxima. */
function advanceLine(to){
 if(to>=ROWS){
  if(data.page<data.pages.length){flip(1);setTimeout(()=>{if(data.mode==='text')beginEdit(FIRST_LINE)},230)}
  else status('Fim da folha. Use Próxima para continuar em uma nova página.','');
  return;
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
function switchBook(bookId){
 if(!data.books.some(b=>b.id===bookId))return;
 if(editing)saveEditor(false);
 checkpoint();data.bookId=bookId;data.pages=activeBook().pages;data.page=0;
 pendingPage=emptyPage();selected=null;galleryOffset=0;
 renderPage();renderDrawer();renderPageRail();if(galleryOpen)renderGallery();
 save();closeDrawer();
}
function renderDrawer(){
 const host=$('nbDrawer');if(!host)return;
 host.innerHTML=
  '<div class="nb-drawer-top"><div><span class="nb-drawer-eyebrow">Biblioteca pessoal</span><strong>Meus cadernos</strong></div>'+
  '<button type="button" data-nb-action="closeDrawer" aria-label="Fechar cadernos">×</button></div>'+
  '<div class="nb-book-list">'+data.books.map((book,i)=>
    '<button class="nb-book-row '+(book.id===data.bookId?'active':'')+'" data-nb-book="'+esc(book.id)+'" aria-label="Abrir caderno '+esc(book.name)+'">'+
     '<span class="nb-book-cover" data-cover="'+(i%6)+'"><span class="nb-cover-spine" aria-hidden="true"></span>'+
     '<span class="nb-cover-title">'+esc(book.name)+'</span><span class="nb-cover-foot">ESTUDOS UENTZOUL</span></span>'+
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
}
function renderPageRail(){
 const host=$('nbPageRail');if(!host)return;
 const pages=data.pages;
 host.innerHTML=
  '<div class="nb-rail-inner"><div class="nb-rail-head"><span>Folhas</span><span class="nb-rail-count">'+pages.length+'</span></div>'+
  '<div class="nb-rail-scroll">'+pages.map((p,i)=>
   '<button class="nb-rail-page '+(i===data.page?'active':'')+'" data-nb-rail-page="'+i+'" title="Ir para folha '+(i+1)+'">'+
   '<span class="nb-rail-paper" aria-hidden="true"><span class="nb-rail-title">'+esc(p.title||'')+'</span>'+
   (p.notes||[]).slice(0,10).map(n=>'<span class="nb-rail-text" style="top:'+
    clamp((START+(Number(n.line)||0)*L)/H*100,4,90)+'%">'+
    esc(String(n.text||'').slice(0,44))+'</span>').join('')+
    (p.stickies||[]).slice(0,3).map(st=>'<span class="nb-rail-note" data-tone="'+esc(st.tone||'yellow')+
     '" style="left:'+clamp((Number(st.x)||110)/W*100,10,70)+'%;top:'+
     clamp((Number(st.y)||175)/H*100,8,83)+'%"></span>').join('')+
    '</span><span class="nb-rail-caption">Folha '+(i+1)+'</span></button>'
  ).join('')+
  '<button class="nb-rail-new '+(data.page===pages.length?'active':'')+
  '" data-nb-rail-page="'+pages.length+'">＋<span>Nova folha</span></button></div></div>'+
  '<button class="nb-rail-tab" type="button" data-nb-action="toggleRail" aria-label="'+
   (railOpen?'Recolher':'Abrir')+' lista de folhas" title="'+(railOpen?'Recolher':'Mostrar')+
   ' folhas">'+(railOpen?'‹':'›')+'</button>';
 host.classList.toggle('is-open',railOpen);
 $('nbWorkspace').classList.toggle('rail-open',railOpen);
}
function goRailPage(index){
 if(!Number.isInteger(index)||index<0||index>data.pages.length)return;
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
 const notes=(p.notes||[]).slice(0,16).map(n=>
  '<span class="nb-thumb-text" style="top:'+clamp((START+(Number(n.line)||0)*L)/H*100,0,96)+'%;color:'+
  (COLORS[n.ink]||COLORS.blue)+';font-family:'+(n.font==='cursive'?"'Caveat',cursive":"'Patrick Hand',cursive")+'">'+
  esc(String(n.text||'').slice(0,105))+'</span>').join('');
 const postits=(p.stickies||[]).slice(0,7).map(n=>
  '<span class="nb-thumb-postit" data-tone="'+esc(n.tone||'yellow')+'" style="left:'+
  clamp((Number(n.x)||110)/W*100,5,80)+'%;top:'+clamp((Number(n.y)||180)/H*100,10,84)+'%"></span>').join('');
 const strokes=(p.strokes||[]).slice(0,60).map(st=>{
  const points=(st.points||[]).filter((_,i)=>i%Math.max(1,Math.ceil(st.points.length/150))===0).map(pt=>
   clamp(Number(pt.x)||0,0,W).toFixed(1)+','+clamp(Number(pt.y)||0,0,H).toFixed(1)).join(' ');
  return '<polyline points="'+points+'" fill="none" stroke="'+(COLORS[st.ink]||COLORS.blue)+'" stroke-width="'+
   clamp(Number(st.width)||2.6,1,8)*3.5+'" stroke-linejoin="round" stroke-linecap="round"/>';
 }).join('');
 return '<button class="nb-gallery-card" data-nb-open-page="'+index+'" aria-label="Abrir folha '+(index+1)+'">'+
  '<span class="nb-gallery-paper"><span class="nb-thumb-rule"></span><span class="nb-thumb-head">'+esc(p.title||'')+'</span>'+
  '<span class="nb-thumb-date">'+esc(p.date||'')+'</span>'+notes+postits+
  '<svg viewBox="0 0 780 1240" preserveAspectRatio="none" aria-hidden="true">'+strokes+'</svg></span>'+
  '<span class="nb-gallery-caption"><strong>Folha '+(index+1)+'</strong><small>'+
  esc(p.date?new Date(p.date+'T12:00:00').toLocaleDateString('pt-BR'):p.title||'Sem título')+
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
}
function transitionView(change,fromEl=null,toEl=null){
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(reduced||!document.startViewTransition){change();return}
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
function findStrokeNear(p,includeUncorrected=true){
 let best={score:16,stroke:null,index:-1};
 page().strokes.forEach((s,i)=>{
  if(!includeUncorrected&&!s.corrected)return;
  const pts=s.points||[];
  pts.forEach(q=>{const d=dist(p,q);if(d<best.score)best={score:d,stroke:s,index:i}});
 });return best;
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
 if(!selected)return;
 const target=selectedItem();if(!target){selected=null;return}
 checkpoint();
 const prop=selected.type==='note'?'notes':selected.type==='stroke'?'strokes':'stickies';
 page()[prop]=page()[prop].filter(x=>x.id!==selected.id);
 selected=null;$('nbContextMenu').hidden=true;
 serializable();refreshTools();renderNotes();renderStickies();drawCanvas();save();
 status('Item removido. Use Ctrl+Z para desfazer.','success');
}
function contextMenu(event){
 if(event.target.closest('#nbEditorText,#nbPaperTitle,#nbPaperDate,.nb-drawer,.nb-gallery'))return;
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
  [['move','⌖ Selecionar e mover'],...(item.corrected?[['warp','⌁ Deformar desenho']]:[['fix','✧ Corrigir traço']]),
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
 if(action==='correct'&&selected.type==='note'){item.pending=true;renderNotes();void correctNote(item.id,item.original||item.text||'');return}
 if(action==='warp'&&selected.type==='stroke'&&item.corrected){data.mode='warp';refreshTools();drawCanvas();status('Arraste o traço para deformá-lo.','');return}
 if(action==='fix'&&selected.type==='stroke'&&!item.corrected){
  checkpoint();const r=fluidStroke(item.points);item.points=r.points;item.kind=r.kind;item.corrected=true;
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
    !event.target.closest('#nbViewport')||event.target.closest('textarea,input,button')){
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
  const icons={text:'✎',select:'⌖',draw:'〰',sticky:'▤',warp:'⌁'};
  marker.textContent=icons[data.mode]||'⌖';
  marker.style.left=(event.clientX+13)+'px';marker.style.top=(event.clientY+12)+'px';
 }
 marker.hidden=false;
}

function renderPage(){
 selectedStroke=-1;selected=null;closeEditor();renderSelectionHandles();
 refreshTools();renderNotes();renderStickies();drawCanvas();setZoom(data.zoom,false);
}
function renderAll(){
 renderPage();renderPageRail();updateShortcutsList();
 if(drawerOpen)renderDrawer();
 if(galleryOpen)renderGallery();
 renderStickyPalette();
}
function flip(direction){
 if(flipping)return;
 if(editing)saveEditor(false);
 const target=data.page+direction;
 if(target<0||target>data.pages.length)return;
 if(target===data.page)return;
 if(target===data.pages.length&&data.pages.length>=250){status('Limite de páginas atingido nesta prévia.','error');return}
 flipping=true;sheet.classList.add('nb-folding');
 setTimeout(()=>{
  data.page=target;selected=null;sheet.classList.remove('nb-folding');flipping=false;renderPage();
  view.scrollTop=0;view.scrollLeft=0;renderPageRail();save();
 },170);
}
function downloadJSON(){
 const blob=new Blob([JSON.stringify({version:2,exportedAt:new Date().toISOString(),books:data.books,activeBookId:data.bookId},null,2)],{type:'application/json'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);
 a.download='cadernos-estudos-uentzoul-'+new Date().toISOString().slice(0,10)+'.json';
 document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1200);
 status('Cópia dos cadernos exportada.','success');
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
 if(action==='sticky'){toolPaletteOpen=!toolPaletteOpen;renderStickyPalette();return;}
 if(MODES.includes(action)){
  if(editing)saveEditor(false);
  data.mode=action;toolPaletteOpen=false;selected=null;selectedStroke=-1;
  refreshTools();renderNotes();renderStickies();drawCanvas();renderStickyPalette();save();
  if(action==='select')status('Clique para selecionar e arrastar textos, desenhos ou post-its.','');
  if(action==='erase')status('Arraste a borracha sobre o desenho para apagar trechos ou traços inteiros.','');
  if(action==='warp')status('Selecione e arraste um traço corrigido.','');
  return;
 }
 if(COLORS[action]){data.ink=action;refreshTools();renderNotes();save();return}
 switch(action){
 case 'print':case 'cursive':
  data.font=action;refreshTools();renderNotes();
  if(editing){editing.draft=$('nbEditorText')?.value||'';editorMarkup()}
  save();break;
 case 'prev':flip(-1);break;case 'next':flip(1);break;
 case 'drawer':toggleDrawer();break;case 'closeDrawer':closeDrawer();break;
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
 const ctx=event.target.closest('[data-nb-context]');
 if(ctx){contextAction(ctx.dataset.nbContext);return}
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
 if(d){
  checkpoint();page().stickies=page().stickies.filter(s=>s.id!==d.dataset.nbDeleteSticky);
  renderStickies();save();return;
 }
 const bind=event.target.closest('[data-nb-bind]');
 if(bind){listening=bind.dataset.nbBind;$('nbShortcutHint').textContent='Pressione uma tecla ou botão extra do mouse.';updateShortcutsList();return;}
 const button=event.target.closest('[data-nb-action]');
 if(button){act(button.dataset.nbAction);return}
 if(event.target.id==='nbShortcutsDialog')act('closeShortcuts');
 if(!event.target.closest('#nbContextMenu'))$('nbContextMenu').hidden=true;
 if(!event.target.closest('#nbStickyPalette')&&!event.target.closest('[data-nb-action="sticky"]')){
  toolPaletteOpen=false;renderStickyPalette();
 }
});
root.addEventListener('change',event=>{
 if(event.target.id==='nbFont'){
  data.font=event.target.value;renderNotes();
  if(editing){editing.draft=$('nbEditorText')?.value||'';editorMarkup()}
  save();
 }
 if(event.target.id==='nbSize'){
  data.size=clamp(Number(event.target.value),1,editing?.line===FIRST_LINE?2:3);
  refreshTools();renderNotes();
  if(editing){editing.draft=$('nbEditorText')?.value||'';editorMarkup()}
  save();
 }
 if(event.target.id==='nbSmooth'){data.smooth=event.target.checked;save();}
 if(event.target.id==='nbEraseBehavior'){data.eraserMode=event.target.value==='whole'?'whole':'parts';save();}
 if(event.target.id==='nbPaperDate'){page().date=event.target.value;save();}
});
root.addEventListener('input',event=>{
 const t=event.target;
 if(t.id==='nbEraseSize'){data.eraserRadius=clamp(Number(t.value)||14,6,32);save();return;}
 if(t.id==='nbEditorText'){
  if(!editing)return;
  editing.draft=t.value;previewText=t.value;
  t.style.height=Math.max(38,t.scrollHeight)+'px';
  return;
 }
 if(t.id==='nbPaperTitle'){page().title=t.value;save();return;}
 if(t.id==='nbZoomSlider'){
  zoomAt(Number(t.value)/100,view.getBoundingClientRect().left+view.clientWidth/2,view.getBoundingClientRect().top+view.clientHeight/2);return;
 }
 if(t.matches('[data-nb-sticky-text]')){
  const st=page().stickies.find(s=>s.id===t.dataset.nbStickyText);
  if(st){st.text=t.value;save();}
 }
});
root.addEventListener('keydown',event=>{
 if(event.target.id==='nbEditorText'){
  if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){
   event.preventDefault();event.stopPropagation();saveEditor(true);return;
  }
  if(event.key==='Escape'){event.preventDefault();closeEditor();act('select');}
 }
 if(event.target.id==='nbNewBook'&&event.key==='Enter'){event.preventDefault();addBook();}
 if(event.target.id==='nbRenameBook'&&event.key==='Enter'){event.preventDefault();renameBook();}
});
document.addEventListener('keydown',event=>{
 if(listening){event.preventDefault();bindShortcut(event);return}
 if(event.isComposing)return;
 const inInput=!!event.target.closest('textarea,input,select,[contenteditable="true"]');
 if((event.ctrlKey||event.metaKey)&&!inInput){
  if(event.code==='KeyZ'){event.preventDefault();if(event.shiftKey)redo();else undo();return}
  if(event.code==='KeyY'){event.preventDefault();redo();return}
 }
 if(!inInput&&!event.repeat&&(event.key==='Delete'||event.key==='Backspace')&&selected){
  event.preventDefault();deleteSelected();return;
 }
 if(event.key==='Escape'){
  if(resizeDrag)finishResize();
  if(!$('nbContextMenu').hidden)$('nbContextMenu').hidden=true;
  if(toolPaletteOpen){toolPaletteOpen=false;renderStickyPalette();}
  if(drawerOpen)closeDrawer();
  if(galleryOpen)hideGallery();
  if(!$('nbShortcutsDialog').hidden)$('nbShortcutsDialog').hidden=true;
  selected=null;act('select');event.preventDefault();return;
 }
 if(inInput||event.repeat)return;
 const code=shortcutEventString(event);
 const action=Object.keys(data.shortcuts).find(k=>data.shortcuts[k]===code);
 if(action){event.preventDefault();act(action);}
});
root.addEventListener('pointerdown',event=>{
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
 const handleButton=event.target.closest('[data-nb-handle]');
 if(handleButton&&event.button===0){startResize(event,handleButton.dataset.nbHandle);return;}
 const note=event.target.closest('[data-nb-note]'),sticky=event.target.closest('[data-nb-sticky]');
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
 const inSheet=!!event.target.closest('#nbSheet');
 if(inSheet&&(event.button===1 ||
      event.button===0&&data.mode==='select' ||
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
 toolCursor(event);
 if(resizeDrag&&resizeDrag.pointerId===event.pointerId){updateResize(event);return;}
 if(moveDrag&&moveDrag.pointerId===event.pointerId){updateMoveDrag(event);return;}
 if(panDrag&&event.pointerId===panDrag.pointerId){
  const dx=event.clientX-panDrag.startX,dy=event.clientY-panDrag.startY;
  if(Math.hypot(dx,dy)>6)panDrag.moved=true;
  if(panDrag.moved){
   view.scrollLeft=panDrag.left-dx;view.scrollTop=panDrag.top-dy;
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
 if(data.mode==='text'&&event.pointerType==='mouse'&&!editing){
  const pos=point(event),el=$('nbLineHover');
  if(pos.x>=90&&pos.y>=START+FIRST_LINE*L&&pos.y<START+ROWS*L){
   el.style.top=(START+Math.floor((pos.y-START)/L)*L)+'px';el.hidden=false;
  }else el.hidden=true;
 }
});
root.addEventListener('pointerup',event=>{
 if(resizeDrag&&resizeDrag.pointerId===event.pointerId){finishResize(event);return;}
 if(moveDrag&&moveDrag.pointerId===event.pointerId){finishMoveDrag(event);return;}
 if(panDrag&&event.pointerId===panDrag.pointerId){
  const drag=panDrag;panDrag=null;
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
 if(resizeDrag&&resizeDrag.pointerId===event.pointerId)finishResize(event);
 if(moveDrag&&moveDrag.pointerId===event.pointerId)finishMoveDrag(event);
 tapCandidate=null;panDrag=null;if(stickyDrag){stickyDrag=null;save();}
});
root.addEventListener('pointerleave',()=>{$('nbToolCursor').hidden=true});
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
 if(event.button===2&&event.target.closest('#nbSheet')&&(selectedItem()||event.target.closest('[data-nb-note],[data-nb-sticky]')))return;
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
  const typed=String($('nbEditorText')?.value||'').trim();
  if(typed){
   let note=editing.id?page().notes.find(n=>n.id===editing.id):null;
   if(!note){note={id:id(),line:editing.line,text:typed};page().notes.push(note)}
   Object.assign(note,{text:typed,original:typed,font:data.font,size:data.size,ink:data.ink,pending:false,reviewed:false});
   note.span=occupiedSpan(note);makeRoom(note);
  }
 }
 persistNow();
});
setInterval(()=>{
 try{
  if(!window.parent.uentzoulAdminConfig?.isAdmin?.()||window.parent.uentzoulAIAuth?.user?.()?.id!==userId){
   document.body.innerHTML='<div class="nb-guard">Esta prévia foi encerrada porque a sessão administrativa mudou.</div>';
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
status('Rascunho salvo apenas neste dispositivo.','');
if(isMobile()&&!localStorage.getItem(STORE))setZoom(.5,false);
})();
