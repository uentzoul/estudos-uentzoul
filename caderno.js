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
const W=780,H=1240,L=34,START=97,ROWS=30;
const STORE='uentzoul:caderno:alpha1:'+userId;
const COLORS={black:'#24242e',blue:'#2559a4',red:'#bb3d43'};
const MODES=['text','draw','sticky','warp'];
const ACTIONS=[
 ['text','Escrever'],['draw','Desenhar'],['sticky','Post-it'],['warp','Deformar'],
 ['black','Caneta preta'],['blue','Caneta azul'],['red','Caneta vermelha'],
 ['print','Letra de forma'],['cursive','Letra cursiva'],
 ['prev','Página anterior'],['next','Próxima página'],['zoomIn','Aproximar'],['zoomOut','Afastar'],
 ['smooth','Alternar ajuste do traço']
];
const emptyPage=()=>({title:'',notes:[],strokes:[],stickies:[]});
const defaults=()=>({pages:[emptyPage()],page:0,mode:'text',font:'print',ink:'blue',size:1,smooth:false,zoom:.88,shortcuts:{}});
let data=defaults();
try{
 const stored=JSON.parse(localStorage.getItem(STORE)||'null');
 if(stored&&Array.isArray(stored.pages)&&stored.pages.length&&stored.pages.length<=250){
  data={...defaults(),...stored};
  data.pages=data.pages.map(p=>({
   title:String(p.title||'').slice(0,100),
   notes:Array.isArray(p.notes)?p.notes.slice(0,140):[],
   strokes:Array.isArray(p.strokes)?p.strokes.slice(0,500):[],
   stickies:Array.isArray(p.stickies)?p.stickies.slice(0,40):[]
  }));
  data.page=Math.min(data.pages.length-1,Math.max(0,Number(data.page)||0));
  data.zoom=Math.min(2.3,Math.max(.42,Number(data.zoom)||.88));
  data.size=Math.min(3,Math.max(1,Number(data.size)||1));
  if(!MODES.includes(data.mode))data.mode='text';
  if(!COLORS[data.ink])data.ink='blue';
  if(!['print','cursive'].includes(data.font))data.font='print';
  if(!data.shortcuts||typeof data.shortcuts!=='object')data.shortcuts={};
 }
}catch(e){console.warn('Não foi possível restaurar o rascunho do caderno.',e)}
let editing=null, previewText='',drawPoints=null,warpDrag=null,stickyDrag=null,selectedStroke=-1,tapCandidate=null;
let undoStack=[],redoStack=[],listening='',pinch=null,saveTimer=null,flipping=false;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const page=()=>data.pages[data.page];
const id=()=>typeof crypto.randomUUID==='function'?crypto.randomUUID():'nb-'+Date.now()+'-'+Math.random().toString(36).slice(2);
const isMobile=()=>window.matchMedia('(max-width:760px)').matches;
function save(){
 clearTimeout(saveTimer);
 saveTimer=setTimeout(()=>{
  try{localStorage.setItem(STORE,JSON.stringify(data));status('Salvo neste dispositivo','success')}
  catch(e){status('Armazenamento cheio. Exporte uma cópia do caderno.','error')}
 },180);
}
function status(message,kind){
 const e=document.getElementById('nbStatus');if(!e)return;
 e.textContent=message;e.dataset.state=kind||'';
}
function checkpoint(){undoStack.push(JSON.stringify(data));if(undoStack.length>45)undoStack.shift();redoStack=[];}
function undo(){
 if(!undoStack.length)return;
 redoStack.push(JSON.stringify(data));data=JSON.parse(undoStack.pop());editing=null;renderAll();save();
}
function redo(){
 if(!redoStack.length)return;
 undoStack.push(JSON.stringify(data));data=JSON.parse(redoStack.pop());editing=null;renderAll();save();
}
root.className='nb-app';
root.innerHTML=
 '<header class="nb-top"><div class="nb-brand"><span class="nb-mark" aria-hidden="true">✎</span><div><h1>Caderno de aula</h1><p>Prévia exclusiva da administração</p></div></div>'+
 '<div class="nb-top-right"><span class="nb-status" id="nbStatus" role="status">Rascunho local · salvo automaticamente</span><button class="nb-quiet" data-nb-action="export">Exportar</button></div></header>'+
 '<div class="nb-tools" id="nbTools" role="toolbar" aria-label="Ferramentas do caderno">'+
 '<div class="nb-toolgroup"><button class="nb-tool" data-nb-action="text" title="Escrever nas linhas">✎ Escrever</button>'+
 '<button class="nb-tool" data-nb-action="draw" title="Desenhar diretamente na folha">〰 Desenhar</button>'+
 '<button class="nb-tool" data-nb-action="sticky" title="Colocar um post-it">▤ Post-it</button>'+
 '<button class="nb-tool" data-nb-action="warp" title="Deformar somente traços corrigidos">⌁ Deformar</button></div>'+
 '<span class="nb-sep"></span><div class="nb-toolgroup"><span class="nb-colors" aria-label="Cor da caneta">'+
 '<button class="nb-color" data-nb-action="black" style="--swatch:#24242e" aria-label="Caneta preta"><span></span></button>'+
 '<button class="nb-color" data-nb-action="blue" style="--swatch:#2559a4" aria-label="Caneta azul"><span></span></button>'+
 '<button class="nb-color" data-nb-action="red" style="--swatch:#bb3d43" aria-label="Caneta vermelha"><span></span></button></span>'+
 '<select class="nb-font-select" id="nbFont" aria-label="Tipo de letra"><option value="print">Letra de forma</option><option value="cursive">Letra cursiva</option></select>'+
 '<select class="nb-size-select" id="nbSize" aria-label="Altura da letra"><option value="1">1 linha</option><option value="2">2 linhas</option><option value="3">3 linhas</option></select></div>'+
 '<div class="nb-toolgroup"><label class="nb-correct-toggle" title="Reconhecer formas simples e suavizar tremores"><input id="nbSmooth" type="checkbox">Ajustar traços</label>'+
 '<button class="nb-tool" data-nb-action="shortcuts" title="Personalizar teclas e botões do mouse">⌨ Atalhos</button>'+
 '<button class="nb-tool" data-nb-action="undo" title="Desfazer">↶</button><button class="nb-tool" data-nb-action="redo" title="Refazer">↷</button></div></div>'+
 '<div class="nb-view" id="nbViewport" aria-label="Folha do caderno, com zoom e rolagem">'+
 '<div class="nb-stage" id="nbStage"><div class="nb-sheet-wrap" id="nbWrap">'+
 '<div class="nb-sheet" id="nbSheet"><div class="nb-holes" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>'+
 '<input id="nbPaperTitle" class="nb-paper-title" placeholder="Título desta página (opcional)" maxlength="100" aria-label="Título da página">'+
 '<div class="nb-line-hover" id="nbLineHover" hidden></div>'+
 '<canvas id="nbDrawing" class="nb-drawing" width="780" height="1240" aria-label="Área de desenho"></canvas>'+
 '<div class="nb-text-layer" id="nbTextLayer"></div><div class="nb-sticky-layer" id="nbStickyLayer"></div>'+
 '<div id="nbEditorHost"></div><button class="nb-fold" data-nb-action="next" title="Virar a página" aria-label="Virar a página"></button><span class="nb-fold-label" aria-hidden="true">›</span>'+
 '<div class="nb-page-num" id="nbPageNum"></div></div></div></div></div>'+
 '<footer class="nb-page-control"><button class="nb-page-btn" data-nb-action="prev">‹ Anterior</button>'+
 '<span class="nb-page-indicator" id="nbPageCount">Página 1 de 1</span>'+
 '<button class="nb-page-btn" data-nb-action="next">Próxima ›</button>'+
 '<span class="nb-zoom"><button class="nb-icon-btn" data-nb-action="zoomOut" aria-label="Reduzir zoom">−</button>'+
 '<input type="range" id="nbZoomSlider" min="42" max="230" step="1" aria-label="Zoom do caderno">'+
 '<button class="nb-icon-btn" data-nb-action="zoomIn" aria-label="Ampliar zoom">+</button><span id="nbZoomText">88%</span></span></footer>'+
 '<div class="nb-help" id="nbShortcutsDialog" hidden><div class="nb-dialog" role="dialog" aria-modal="true" aria-labelledby="nbShortcutsHeading">'+
 '<h2 id="nbShortcutsHeading">Seus atalhos</h2><p>Escolha uma ação e pressione a tecla ou o botão do mouse que deseja associar. Os atalhos funcionam quando você não está digitando em um campo.</p>'+
 '<div class="nb-shortcuts" id="nbShortcutsList"></div>'+
 '<div class="nb-dialog-footer"><span class="nb-hint" id="nbShortcutHint">Os atalhos são salvos neste aparelho.</span><button class="nb-quiet" data-nb-action="closeShortcuts">Fechar</button></div></div></div>';
const $=name=>document.getElementById(name);
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
 for(const a of Object.keys(COLORS)){const b=root.querySelector('[data-nb-action="'+a+'"]');b?.setAttribute('aria-pressed',String(data.ink===a));}
 $('nbFont').value=data.font;$('nbSize').value=String(data.size);$('nbSmooth').checked=!!data.smooth;
 sheet.dataset.mode=data.mode;
 $('nbPageCount').textContent='Página '+(data.page+1)+' de '+data.pages.length;
 $('nbPageNum').textContent=String(data.page+1).padStart(2,'0');
 $('nbPaperTitle').value=page().title||'';
}
function letterMarkup(text){
 return Array.from(String(text||'')).map(ch=>{
  if(ch==='\n')return '<br>';
  const isUpper=/\p{Lu}/u.test(ch);
  return '<span class="'+(isUpper?'nb-uppercase':'nb-lowercase')+'">'+esc(ch)+'</span>';
 }).join('');
}
function noteMarkup(n,preview){
 const size=clamp(Number(n.size)||1,1,3),top=START+(Number(n.line)||0)*L;
 const css='top:'+top+'px;min-height:'+((size+1)*L)+'px;--nb-small:'+(size*26)+'px;color:'+(COLORS[n.ink]||COLORS.blue)+';';
 return '<div class="nb-note '+(n.font==='cursive'?'cursive':'print')+(preview?' nb-preview':'')+
  (editing&&editing.id===n.id?' nb-selected':'')+(n.pending?' nb-correcting':'')+
  '" style="'+css+'"'+(!preview?' data-nb-note="'+esc(n.id)+'"':'')+'><span class="nb-note-content">'+letterMarkup(n.text)+'</span></div>';
}
function renderNotes(){
 const notes=page().notes;
 $('nbTextLayer').innerHTML=notes.map(n=>noteMarkup(n,false)).join('')+
  (editing&&previewText?noteMarkup({line:editing.line,text:previewText,font:data.font,ink:data.ink,size:data.size,id:'_preview'},true):'');
}
function editorMarkup(){
 const host=$('nbEditorHost');
 if(!editing){host.innerHTML='';return;}
 const pos=START+(editing.line+Math.max(2,data.size+1))*L+8;
 host.innerHTML='<section class="nb-editor" style="top:'+clamp(pos,150,H-193)+'px" aria-label="Editor da linha">'+
  '<div class="nb-editor-head"><span>Escrevendo na linha '+(editing.line+1)+'</span><span>Enter para inserir e revisar</span></div>'+
  '<textarea id="nbEditorText" rows="2" maxlength="2500" placeholder="Digite rapidamente suas anotações…" aria-label="Texto da linha"></textarea>'+
  '<div class="nb-editor-foot"><span>Shift + Enter: nova linha</span><button class="nb-editor-cancel" data-nb-action="cancelEditor">Cancelar</button>'+
  '<button data-nb-action="saveEditor">Inserir ↵</button></div></section>';
 const input=$('nbEditorText');input.value=editing.draft||'';
 requestAnimationFrame(()=>{input.focus({preventScroll:true});input.setSelectionRange(input.value.length,input.value.length)});
}
function beginEdit(line){
 if(data.mode!=='text')return;
 const existing=page().notes.find(n=>line>=Number(n.line)&&line<Number(n.line)+Number(n.span||Number(n.size)+1));
 editing={line:existing?Number(existing.line):line,id:existing?.id||null,draft:existing?.original||existing?.text||''};
 if(existing){data.font=existing.font;data.ink=existing.ink;data.size=existing.size;}
 previewText=editing.draft;
 refreshTools();renderNotes();editorMarkup();focusLine(editing.line);
}
function closeEditor(){editing=null;previewText='';renderNotes();editorMarkup();}
function occupiedSpan(note){
 const size=clamp(Number(note.size)||1,1,3);
 const maxLineChars=Math.max(12,Math.floor(53/size));
 const visualRows=Math.max(1,String(note.text||'').split('\n').reduce((n,line)=>n+Math.max(1,Math.ceil(line.length/maxLineChars)),0));
 return clamp(size+1+(visualRows-1)*size,2,ROWS);
}
function makeRoom(saved){
 const list=page().notes.filter(n=>n.id!==saved.id).sort((a,b)=>a.line-b.line);
 let end=saved.line+saved.span;
 for(const note of list){
  if(note.line<saved.line)continue;
  if(note.line<end){note.line=end;}
  end=note.line+Math.max(2,Number(note.span)||2);
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
  const n=data.pages.flatMap(p=>p.notes).find(n=>n.id===noteId);
  if(!n||n.original!==raw)return;
  n.text=revised;n.pending=false;n.reviewed=result.reviewed===true;n.span=occupiedSpan(n);
  if(page().notes.includes(n))makeRoom(n);
  if(!editing)renderNotes();else renderNotes();
  save();
  status(result.reviewed===false?'Texto original preservado: a revisão automática não foi confirmada.':revised===raw?'Anotação conferida, sem mudanças.':'Gramática corrigida sem reescrever a anotação.',result.reviewed===false?'error':'success');
 }catch(err){
  const n=data.pages.flatMap(p=>p.notes).find(n=>n.id===noteId);
  if(!n||n.original!==raw)return;
  n.pending=false;n.reviewed=false;
  n.text=raw;
  if(page().notes.includes(n))renderNotes();
  save();status('Anotação salva. Revisão de IA indisponível; texto original preservado.','error');
 }
}
function saveEditor(){
 if(!editing)return;
 const typed=String($('nbEditorText')?.value||'').trim();
 if(!typed){closeEditor();return}
 checkpoint();
 let n=editing.id?page().notes.find(n=>n.id===editing.id):null;
 if(!n){n={id:id(),line:editing.line,text:typed};page().notes.push(n)}
 Object.assign(n,{text:typed,original:typed,font:data.font,size:data.size,ink:data.ink,pending:true,reviewed:false});
 n.span=occupiedSpan(n);makeRoom(n);
 const nid=n.id;closeEditor();renderNotes();save();
 status('Inserido. Corrigindo a gramática…','');
 void correctNote(nid,typed);
}
function renderStickies(){
 $('nbStickyLayer').innerHTML=page().stickies.map(s=>
  '<div class="nb-sticky" data-nb-sticky="'+esc(s.id)+'" data-tone="'+esc(s.tone||'yellow')+
  '" style="left:'+clamp(Number(s.x)||0,90,W-180)+'px;top:'+clamp(Number(s.y)||0,95,H-160)+'px;">'+
  '<div class="nb-sticky-head" data-nb-drag="'+esc(s.id)+'" title="Arraste para mover"><span>✦ Nota adesiva</span>'+
  '<button type="button" data-nb-delete-sticky="'+esc(s.id)+'" title="Remover post-it" aria-label="Remover post-it">×</button></div>'+
  '<textarea aria-label="Escreva no post-it" data-nb-sticky-text="'+esc(s.id)+'" maxlength="700" placeholder="Sua observação…">'+esc(s.text||'')+'</textarea></div>'
 ).join('');
}
function addSticky(p){
 checkpoint();const tones=['yellow','pink','violet'],list=page().stickies;
 const n={id:id(),x:clamp(p.x-75,95,W-185),y:clamp(p.y-30,102,H-172),text:'',tone:tones[list.length%3]};
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
 if(dist(a,b)>38&&maxDistance<7)return {points:[a,b],kind:'line'};
 return {points:smoothPoints(points),kind:'curve'};
}
function paintStroke(points,color,width){
 if(!points?.length)return;
 ctx.beginPath();ctx.lineWidth=width||2.5;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=COLORS[color]||COLORS.blue;
 ctx.moveTo(points[0].x,points[0].y);
 if(points.length===1)ctx.lineTo(points[0].x+.05,points[0].y+.05);
 for(let i=1;i<points.length;i++)ctx.lineTo(points[i].x,points[i].y);
 ctx.stroke();
}
function drawCanvas(){
 const dpr=Math.min(2,window.devicePixelRatio||1);
 if(canvas.width!==Math.round(W*dpr)||canvas.height!==Math.round(H*dpr)){
  canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);
 }
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
 page().strokes.forEach((s,i)=>{
  paintStroke(s.points,s.ink,Number(s.width)||2.6);
  if(data.mode==='warp'&&selectedStroke===i){
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
function pointerDownCanvas(event){
 if(event.button!==0||event.pointerType==='touch'&&pinch)return;
 const p=point(event);
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
 if(drawPoints){
  const raw=drawPoints;drawPoints=null;
  if(raw.length){
   const result=data.smooth?perfectShape(raw):{points:raw,kind:'free'};
   page().strokes.push({id:id(),points:result.points,corrected:!!data.smooth,kind:result.kind,ink:data.ink,width:2.6});
   save();status(data.smooth?'Desenho ajustado. Pode usar Deformar.':'Traço livre inserido.','success');
  }
 }
 if(warpDrag){warpDrag=null;save();status('Traço deformado.','success');}
 drawCanvas();
}
function renderPage(){
 selectedStroke=-1;closeEditor();
 refreshTools();renderNotes();renderStickies();drawCanvas();setZoom(data.zoom,false);
}
function renderAll(){refreshTools();renderPage();updateShortcutsList();}
function flip(direction){
 if(flipping)return;
 if(editing)saveEditor();
 const target=data.page+direction;
 if(target<0)return;
 checkpoint();
 if(target>=data.pages.length){if(data.pages.length>=250){status('Este caderno chegou ao limite de páginas do teste.','error');return}data.pages.push(emptyPage())}
 flipping=true;sheet.classList.add('nb-folding');
 setTimeout(()=>{
  data.page=target;sheet.classList.remove('nb-folding');flipping=false;renderPage();
  view.scrollTop=0;view.scrollLeft=0;save();
 },170);
}
function downloadJSON(){
 const blob=new Blob([JSON.stringify({version:1,exportedAt:new Date().toISOString(),pages:data.pages},null,2)],{type:'application/json'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);
 a.download='caderno-estudos-uentzoul-'+new Date().toISOString().slice(0,10)+'.json';
 document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1200);
 status('Cópia de segurança exportada.','success');
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
 if(MODES.includes(action)){
  data.mode=action;editing&&saveEditor();selectedStroke=-1;refreshTools();drawCanvas();save();
  if(action==='sticky')status('Clique na folha para adicionar um post-it.','');
  if(action==='warp')status('Arraste um traço ajustado para deformá-lo.','');
  return;
 }
 if(COLORS[action]){data.ink=action;refreshTools();renderNotes();save();return}
 switch(action){
 case 'print':case 'cursive':data.font=action;refreshTools();renderNotes();save();break;
 case 'prev':flip(-1);break;case 'next':flip(1);break;
 case 'zoomIn':zoomAt(data.zoom+.1,view.getBoundingClientRect().left+view.clientWidth/2,view.getBoundingClientRect().top+view.clientHeight/2);break;
 case 'zoomOut':zoomAt(data.zoom-.1,view.getBoundingClientRect().left+view.clientWidth/2,view.getBoundingClientRect().top+view.clientHeight/2);break;
 case 'smooth':data.smooth=!data.smooth;refreshTools();save();break;
 case 'undo':undo();break;case 'redo':redo();break;case 'export':downloadJSON();break;
 case 'shortcuts':$('nbShortcutsDialog').hidden=false;updateShortcutsList();break;
 case 'closeShortcuts':$('nbShortcutsDialog').hidden=true;listening='';break;
 case 'cancelEditor':closeEditor();break;case 'saveEditor':saveEditor();break;
 }
}
root.addEventListener('click',event=>{
 const d=event.target.closest('[data-nb-delete-sticky]');
 if(d){
  checkpoint();page().stickies=page().stickies.filter(s=>s.id!==d.dataset.nbDeleteSticky);renderStickies();save();return;
 }
 const bind=event.target.closest('[data-nb-bind]');
 if(bind){listening=bind.dataset.nbBind;$('nbShortcutHint').textContent='Pressione uma tecla ou botão extra do mouse.';updateShortcutsList();return;}
 const button=event.target.closest('[data-nb-action]');
 if(button){act(button.dataset.nbAction);return;}
 if(event.target.id==='nbShortcutsDialog')act('closeShortcuts');
});
root.addEventListener('change',event=>{
 if(event.target.id==='nbFont'){data.font=event.target.value;renderNotes();save();}
 if(event.target.id==='nbSize'){data.size=clamp(Number(event.target.value),1,3);renderNotes();save();}
 if(event.target.id==='nbSmooth'){data.smooth=event.target.checked;save();}
});
root.addEventListener('input',event=>{
 const t=event.target;
 if(t.id==='nbEditorText'){editing.draft=t.value;previewText=t.value;renderNotes();return;}
 if(t.id==='nbPaperTitle'){page().title=t.value;save();return;}
 if(t.id==='nbZoomSlider'){
  zoomAt(Number(t.value)/100,view.getBoundingClientRect().left+view.clientWidth/2,view.getBoundingClientRect().top+view.clientHeight/2);return;
 }
 if(t.matches('[data-nb-sticky-text]')){
  const s=page().stickies.find(s=>s.id===t.dataset.nbStickyText);
  if(s){s.text=t.value;save();}
 }
});
root.addEventListener('keydown',event=>{
 if(event.target.id==='nbEditorText'){
  if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();saveEditor();}
  if(event.key==='Escape'){event.preventDefault();closeEditor();}
 }
});
document.addEventListener('keydown',event=>{
 if(listening){event.preventDefault();bindShortcut(event);return;}
 if(event.target.closest('textarea,input,select,[contenteditable="true"]')||event.isComposing||event.repeat)return;
 const code=shortcutEventString(event);
 const action=Object.keys(data.shortcuts).find(k=>data.shortcuts[k]===code);
 if(action){event.preventDefault();act(action);}
});
root.addEventListener('pointerdown',event=>{
 if(listening&&event.button!==0){
  event.preventDefault();
  if(event.button===1||event.button===2||event.button===3||event.button===4){
   const code='mouse:'+event.button;
   checkpoint();Object.keys(data.shortcuts).forEach(k=>{if(data.shortcuts[k]===code)delete data.shortcuts[k]});
   data.shortcuts[listening]=code;listening='';updateShortcutsList();save();
  }
  return;
 }
 const handle=event.target.closest('[data-nb-drag]');
 if(handle&&!event.target.closest('button')){
  const s=page().stickies.find(s=>s.id===handle.dataset.nbDrag);
  if(!s)return;
  checkpoint();stickyDrag={id:s.id,from:{x:event.clientX,y:event.clientY},start:{x:s.x,y:s.y}};
  handle.setPointerCapture?.(event.pointerId);event.preventDefault();return;
 }
 if(data.mode!=='text'&&data.mode!=='sticky')return;
 if(event.target.closest('button,input,textarea,.nb-sticky,.nb-editor'))return;
 const pos=point(event);
 // Em telas touch, só seleciona depois de um toque sem arrasto: não interrompe a rolagem.
 if(event.pointerType==='touch'){
  tapCandidate={pointerId:event.pointerId,x:event.clientX,y:event.clientY,pos,mode:data.mode};
  return;
 }
 if(data.mode==='sticky'){addSticky(pos);return;}
 if(pos.x<88||pos.y<START-10||pos.y>START+ROWS*L)return;
 const line=clamp(Math.floor((pos.y-START)/L),0,ROWS-1);
 beginEdit(line);
});
root.addEventListener('pointermove',event=>{
 if(tapCandidate&&event.pointerId===tapCandidate.pointerId&&
    Math.hypot(event.clientX-tapCandidate.x,event.clientY-tapCandidate.y)>10)tapCandidate=null;
 if(stickyDrag){
  const note=page().stickies.find(s=>s.id===stickyDrag.id);
  if(note){
   note.x=clamp(stickyDrag.start.x+(event.clientX-stickyDrag.from.x)/data.zoom,90,W-185);
   note.y=clamp(stickyDrag.start.y+(event.clientY-stickyDrag.from.y)/data.zoom,100,H-170);
   const el=root.querySelector('[data-nb-sticky="'+note.id+'"]');
   if(el){el.style.left=note.x+'px';el.style.top=note.y+'px';}
  }return;
 }
 if(data.mode==='text'&&event.pointerType==='mouse'&&!editing){
  const pos=point(event),el=$('nbLineHover');
  if(pos.x>=90&&pos.y>=START&&pos.y<START+ROWS*L){el.style.top=(START+Math.floor((pos.y-START)/L)*L)+'px';el.hidden=false;}
  else el.hidden=true;
 }
});
root.addEventListener('pointerup',event=>{
 if(tapCandidate&&event.pointerId===tapCandidate.pointerId){
  const tap=tapCandidate;tapCandidate=null;
  if(!pinch&&tap.mode===data.mode){
   if(data.mode==='sticky')addSticky(tap.pos);
   else if(data.mode==='text'&&tap.pos.x>=88&&tap.pos.y>=START-10&&tap.pos.y<=START+ROWS*L){
    const line=clamp(Math.floor((tap.pos.y-START)/L),0,ROWS-1);beginEdit(line);
   }
  }
 }
 if(stickyDrag){stickyDrag=null;save();}
});
canvas.addEventListener('pointerdown',pointerDownCanvas);
canvas.addEventListener('pointermove',pointerMoveCanvas);
canvas.addEventListener('pointerup',pointerUpCanvas);
canvas.addEventListener('pointercancel',pointerUpCanvas);
canvas.addEventListener('lostpointercapture',()=>{if(drawPoints||warpDrag)pointerUpCanvas();});
root.addEventListener('contextmenu',event=>{
 if(listening||Object.values(data.shortcuts).includes('mouse:2'))event.preventDefault();
});
root.addEventListener('pointerdown',event=>{
 if(listening||event.button===0||event.target.closest('input,textarea,button,select'))return;
 const action=Object.keys(data.shortcuts).find(k=>data.shortcuts[k]==='mouse:'+event.button);
 if(action){event.preventDefault();act(action)}
},true);
view.addEventListener('wheel',event=>{
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
setInterval(()=>{
 try{
  if(!window.parent.uentzoulAdminConfig?.isAdmin?.()||window.parent.uentzoulAIAuth?.user?.()?.id!==userId){
   document.body.innerHTML='<div class="nb-guard">Esta prévia foi encerrada porque a sessão administrativa mudou.</div>';
  }
 }catch(_){document.body.innerHTML='<div class="nb-guard">Acesso encerrado.</div>'}
},7000);
renderAll();
setZoom(data.zoom,false);
status('Rascunho salvo apenas neste dispositivo.','');
if(isMobile()&&!localStorage.getItem(STORE))setZoom(.5,false);
})();
