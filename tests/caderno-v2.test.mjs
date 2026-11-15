// Testes incrementais do Caderno: não dependem de login ou serviços externos.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const script=read('caderno.js'),style=read('caderno.css'),html=read('caderno.html'),nav=read('site-version.js');
const fn=(start,end)=>{
 const a=script.indexOf(start),b=script.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'função extraível: '+start);
 const body=script.slice(a,b).trim();
 const last=body.lastIndexOf('}');
 assert.ok(last>0,'fechamento de função: '+start);
 return body.slice(0,last+1);
};
test('Prévia deve exigir administrador autenticado e nunca usar service role no browser',()=>{
 assert.match(script,/window\.parent\.uentzoulAdminConfig\?\.isAdmin\?\.\(\)===true/);
 assert.match(script,/const STORE='uentzoul:caderno:alpha2:'/);
 assert.match(script,/const LEGACY_STORE='uentzoul:caderno:alpha1:'/);
 assert.match(script,/functions\.invoke\('caderno-revisao'/);
 assert.doesNotMatch(script,/\bservice[_-]?role\b/i);
 assert.match(html,/robots" content="noindex, nofollow"/);
 assert.match(nav,/button\.hidden=!allowed/);
 assert.match(nav,/navCadernoPreview/);
});
test('Texto é editado diretamente no caderno sem caixa de envio flutuante',()=>{
 assert.match(script,/class="nb-inline-edit /);
 assert.doesNotMatch(script,/Escrevendo na linha/);
 assert.doesNotMatch(script,/Digite rapidamente suas anotações/);
 assert.match(script,/const W=780,H=1240,L=34,START=28,ROWS=30,FIRST_LINE=3/);
 assert.match(script,/line<FIRST_LINE/);
 assert.match(script,/if\(editing\.line===FIRST_LINE&&data\.size>2\)data\.size=2/);
 assert.match(script,/if\(event\.key==='Enter'&&!event\.shiftKey&&!event\.isComposing\)/);
 assert.match(style,/\.nb-inline-edit\{/);
});
test('Enter registra e corrige texto e move para a próxima linha; vazio apenas move',()=>{
 const src=fn('function saveEditor(advance=true){','function renderStickies(){');
 let calls={checkpoints:0,correct:[],advanced:[],saved:0},value='  Psicologia e uma ciencia  ';
 const mockPage={notes:[]},context={
  editing:{id:null,line:3},data:{font:'print',size:1,ink:'blue'},
  $:()=>({value}),checkpoint(){calls.checkpoints++},page:()=>mockPage,
  id:()=>String(calls.checkpoints),occupiedSpan:()=>2,makeRoom(){},
  materializePage(){},closeEditor(){},renderNotes(){},
  save(){calls.saved++},status(){},correctNote(id,text){calls.correct.push({id,text})},
  advanceLine(i){calls.advanced.push(i)}
 };
 const saveEditor=vm.runInNewContext('('+src+')',context);
 saveEditor(true);
 assert.equal(mockPage.notes.length,1);
 assert.equal(mockPage.notes[0].text,'Psicologia e uma ciencia');
 assert.equal(calls.correct.length,1);
 assert.equal(calls.advanced[0],4);
 assert.equal(calls.saved,1);
 value='   ';context.editing={id:null,line:7};
 saveEditor(true);
 assert.equal(mockPage.notes.length,1,'Enter vazio não cria nota');
 assert.equal(calls.correct.length,1,'Enter vazio não invoca IA');
 assert.equal(calls.advanced[1],8);
 context.editing={id:null,line:10};value='Teste';saveEditor(false);
 assert.equal(calls.advanced.length,2,'Salvar ao trocar de área não salta linha');
});
test('Páginas vazias não são preservadas ao virar ou serializar',()=>{
 const def=script.match(/const hasPageContent=p=>([^\n]+);/);
 assert.ok(def);
 const hasPageContent=vm.runInNewContext('(p=>'+def[1]+')');
 assert.equal(!!hasPageContent({title:'',notes:[],strokes:[],stickies:[]}),false);
 assert.equal(!!hasPageContent({title:'Título',date:'2026-11-15',notes:[],strokes:[],stickies:[]}),false);
 assert.equal(!!hasPageContent({notes:[{text:'Texto'}],strokes:[],stickies:[]}),true);
 assert.equal(!!hasPageContent({notes:[],strokes:[{points:[{x:1,y:1}]}],stickies:[]}),true);
 assert.equal(!!hasPageContent({notes:[],strokes:[],stickies:[{text:'Observação'}]}),true);
 assert.match(script,/target>data\.pages\.length/);
 assert.match(script,/if\(hasPageContent\(item\)\)cleaned\.push\(item\)/);
 assert.match(script,/Nova página ·/);
});
test('Galeria exibe 15 folhas em cinco colunas e transição respeita movimento reduzido',()=>{
 assert.match(script,/const cards=data\.pages\.slice\(from,from\+limit\)/);
 assert.match(script,/galleryOffset\*limit/);
 assert.match(script,/limit=15/);
 assert.match(style,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
 assert.match(style,/::view-transition-group\(nb-shared-sheet\)/);
 assert.match(style,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(script,/document\.startViewTransition/);
});
test('Post-its têm paleta e seleção, Ctrl+Z, Delete e menu contextual de acordo com tipo',()=>{
 for(const marker of ['nbStickyPalette','data-nb-tone','nbToolCursor','nb-context-menu','data-nb-context','deleteSelected','selectItem'])
  assert.ok(script.includes(marker),marker);
 assert.match(script,/event\.code==='KeyZ'/);
 assert.match(script,/event\.key==='Delete'/);
 assert.match(script,/selected\.type==='note'/);
 assert.match(script,/selected\.type==='stroke'/);
 assert.match(script,/selected\.type==='sticky'/);
 assert.match(script,/\[\['warp','⌁ Moldar desenho'\]\]/);
 assert.match(script,/\[\['fix','✧ Corrigir traço'\]\]/);
});
test('O marcador Em breve de Trabalhos é igual ao do Caderno e não usa tooltip externo',()=>{
 assert.match(nav,/jobs\.querySelector\('\.nav-upcoming-tip'\)\?\.remove\(\)/);
 assert.match(nav,/badge\.className='nb-preview-label'/);
 assert.match(nav,/#navUpcomingFloatingTip\{display:none!important\}/);
});


test('Borracha remove trechos sem apagar os demais fragmentos e aceita traço inteiro',()=>{
 const start=script.indexOf('function pointSegmentDistance('),end=script.indexOf('function startMoveDrag(',start);
 assert.ok(start>=0&&end>start);
 const code=script.slice(start,end);
 const {pointNearStroke,cutStrokeAt}=vm.runInNewContext(
  '(()=>{'+code+';return {pointNearStroke,cutStrokeAt};})()',
  {clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),dist:(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),
   id:(()=>{let n=1;return()=>String(n++);})()}
 );
 const stroke={id:'original',points:[{x:0,y:40},{x:120,y:40}],width:2.6,ink:'blue',corrected:true};
 assert.equal(pointNearStroke({x:61,y:40},stroke,10),true);
 assert.equal(pointNearStroke({x:61,y:90},stroke,10),false);
 const chunks=cutStrokeAt(stroke,{x:60,y:40},10);
 assert.equal(chunks.length,2);
 assert.ok(chunks[0].points.at(-1).x<60);
 assert.ok(chunks[1].points[0].x>60);
 assert.equal(chunks[0].corrected,false,'cortes não devem continuar sendo formas geométricas perfeitas');
 assert.match(script,/data\.eraserMode==='whole'/);
 assert.match(script,/checkpoint\(\);eraseDrag=/);
 assert.match(script,/case 'undo':undo\(\)/);
});
test('Selecionar move desenhos com coordenadas e texto entre linhas, mantendo Ctrl+Z',()=>{
 for(const part of ['startMoveDrag(','updateMoveDrag(','finishMoveDrag(','originLine','originX','originY',
  "drag.type==='note'","drag.type==='stroke'","drag.type==='sticky'"])
  assert.ok(script.includes(part),'seleção movível: '+part);
 assert.match(script,/Math\.round\(\(\(drag\.last\|\|drag\.start\)\.y-drag\.start\.y\)\/L\)/);
 assert.match(script,/item\.line=chosen/);
 assert.match(script,/page\(\)\.notes\.some\(n=>n\.id!==item\.id/);
 assert.match(script,/item\.points=drag\.originalPoints\.map/);
 assert.match(script,/if\(!drag\.moved\)\{checkpoint\(\)/);
 assert.match(style,/\.nb-sheet\[data-mode="select"\] \.nb-sticky\{touch-action:none/);
});
test('Exportar PDF usa canvas local, gera páginas A4, e não expõe dados fora do navegador',async()=>{
 const pdf=read('caderno-pdf.js');
 assert.match(html,/src="caderno-pdf\.js\?v=/);
 assert.match(script,/window\.uentzoulCadernoPDF\?\.exportBook\?\.\(activeBook\(\),status\)/);
 assert.doesNotMatch(script,/case 'export':downloadJSON\(\)/);
 assert.match(pdf,/canvas\.toDataURL\('image\/jpeg'/);
 assert.doesNotMatch(pdf,/\bfetch\(/);
 const start=pdf.indexOf('function assemblePdf(images){'),end=pdf.indexOf('async function exportBook(',start);
 assert.ok(start>=0&&end>start);
 const create=vm.runInNewContext('(()=>{const WIDTH=780,HEIGHT=1240,enc=new TextEncoder();'+
  pdf.slice(start,end)+';return assemblePdf;})()',{Blob,TextEncoder});
 const pdfBlob=create([new Uint8Array([0xff,0xd8,0xff,0xd9])]);
 assert.equal(pdfBlob.type,'application/pdf');
 const bytes=Buffer.from(await pdfBlob.arrayBuffer());
 assert.ok(bytes.subarray(0,8).toString('latin1').startsWith('%PDF-1.4'));
 assert.match(bytes.toString('latin1'),/\/Count 1/);
 assert.match(bytes.toString('latin1'),/xref\n0 6\n/);
 assert.match(bytes.toString('latin1'),/%%EOF/);
});


test('Traços ajustados preservam percurso original e reduzem tremores em curvas fluidas',()=>{
 const start=script.indexOf('function fluidStroke('),end=script.indexOf('function paintStroke(',start);
 assert.ok(start>0&&end>start);
 const factory=vm.runInNewContext('(()=>{const W=780,H=1240;'+script.slice(start,end)+';return fluidStroke})()',
  {clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),dist:(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)});
 const raw=Array.from({length:120},(_,i)=>({x:120+i*3,
  y:380+50*Math.sin(i/14)+(i%2===0?4:-4)}));
 const corrected=factory(raw);
 assert.equal(corrected.kind,'fluid');
 assert.ok(corrected.points.length>raw.length);
 assert.ok(Math.abs(corrected.points[0].x-raw[0].x)<.01);
 assert.ok(Math.abs(corrected.points.at(-1).y-raw.at(-1).y)<.01);
 const roughness=points=>{
  let total=0;
  for(let i=1;i<points.length-1;i++)total+=Math.abs(points[i-1].y-2*points[i].y+points[i+1].y);
  return total/Math.max(1,points.length-2);
 };
 assert.ok(roughness(corrected.points)<roughness(raw)/3,
  'A curva ajustada precisa ser muito menos tremida do que a original');
 assert.ok(Math.max(...corrected.points.map(p=>p.y))-Math.min(...corrected.points.map(p=>p.y))>70,
  'Não pode achatar o desenho em uma reta');
 assert.match(script,/data\.smooth\?fluidStroke\(raw\)/);
});
test('Selecionar é padrão, ESC volta ao seletor e papel pode ser arrastado sem selecionar item',()=>{
 assert.match(script,/bookId:'book-original',page:0,mode:'select'/);
 assert.match(script,/data\.mode='select'; \/\/ Ferramenta inicial segura/);
 assert.match(script,/if\(event\.key==='Escape'\)\{/);
 assert.match(script,/selected=null;act\('select'\)/);
 assert.match(script,/function startPan\(event\)/);
 assert.match(script,/startPan\(event\);\}/);
 assert.match(script,/view\.scrollLeft=panDrag\.left-dx;view\.scrollTop=panDrag\.top-dy/);
});
test('Oito alças redimensionam cantos e lados com limites para texto, desenho e post-it',()=>{
 const start=script.indexOf('function transformRect('),end=script.indexOf('function updateResize(',start);
 const transform=vm.runInNewContext('(()=>{'+script.slice(start,end)+'return transformRect})()',
  {W:780,H:1240,clamp:(v,a,b)=>Math.max(a,Math.min(b,v))});
 const box={x:100,y:100,w:200,h:100};
 const right=transform(box,'e',60,0);
 assert.equal(right.x,100);assert.equal(right.w,260);assert.equal(right.h,100);
 const bottomRight=transform(box,'se',40,30);
 assert.equal(bottomRight.w,240);assert.equal(bottomRight.h,130);
 const topLeft=transform(box,'nw',-20,-30);
 assert.equal(topLeft.x,80);assert.equal(topLeft.y,70);
 assert.equal(topLeft.w,220);assert.equal(topLeft.h,130);
 assert.match(script,/data-nb-handle/);
 assert.match(script,/resizeDrag&&resizeDrag\.pointerId/);
 assert.match(script,/item\.points=drag\.points\.map/);
});
test('A data sobe, os cadernos têm capas e as folhas têm uma aba lateral própria',()=>{
 assert.match(script,/class="nb-paper-date-group"/);
 assert.match(style,/\.nb-paper-date-group\{position:absolute;top:30px/);
 assert.match(style,/font-size:16px/);
 assert.match(script,/id="nbPageRail"/);
 assert.match(script,/class="nb-rail-tab"/);
 assert.match(style,/\.nb-page-rail\{position:absolute/);
 assert.match(script,/class="nb-book-cover"/);
 assert.match(style,/\.nb-book-cover\[data-cover="5"\]/);
 assert.match(script,/window\.addEventListener\('popstate'/);
 assert.match(style,/html\[data-theme="dark"\] \.nb-sheet\{background-color:#fffdf8/);
});
test('Borracha exibe mira realmente centrada no ponto e remover post-it exige seleção',()=>{
 assert.match(script,/marker\.style\.left=event\.clientX\+'px'/);
 assert.match(script,/marker\.style\.top=event\.clientY\+'px'/);
 assert.match(style,/\.nb-tool-cursor\.nb-eraser-target\{/);
 assert.match(style,/transform:translate\(-50%,-50%\)/);
 assert.match(script,/selected\?\.type==='sticky'&&selected\.id===s\.id/);
 assert.match(style,/\.nb-sticky-head button\[hidden\]\{display:none!important\}/);
});


test('Título da aula desaparece e a data ocupa a segunda linha física',()=>{
 assert.doesNotMatch(script,/id="nbPaperTitle"/);
 assert.match(script,/START=28,ROWS=30,FIRST_LINE=3/);
 assert.match(style,/\.nb-paper-date-group\{[\s\S]*?top:30px/);
 assert.match(style,/\.nb-corner-back\{[\s\S]*?top:12px/);
 assert.match(script,/if\(data\.page===0\)backToBooks\(\)/);
});
test('Correção local protege o usuário mesmo sem resposta da IA',()=>{
 const i=script.indexOf('function fallbackBasic('),j=script.indexOf('async function correctNote(',i);
 assert.ok(i>=0&&j>i);
 const basic=vm.runInNewContext('('+script.slice(i,j).trim()+')');
 assert.equal(basic('boa tarde rapaziada'),'Boa tarde, rapaziada.');
 assert.equal(basic('oi pessoal'),'Oi pessoal.');
 assert.equal(basic('nao posso'),'Não posso.');
 assert.match(script,/text:fallbackBasic\(typed\)/);
 assert.match(script,/n\.text=fallbackBasic\(raw\)/);
 assert.match(script,/input\.value\.endsWith\(' '\)/);
});
test('Ao apagar item, zera seleção e controles; não redimensiona outros desenhos',()=>{
 assert.match(script,/selected=null;selectedStroke=-1;resizeDrag=null;moveDrag=null/);
 assert.match(script,/renderStickies\(\);drawCanvas\(\);renderSelectionHandles\(\);save\(\)/);
 assert.match(script,/if\(!inInput&&!event\.repeat&&\(event\.key==='Delete'/);
});
test('Moldar seleciona o traço sem deformar; quadrado para mover e ponto para moldar',()=>{
 assert.match(script,/\['warp','Moldar'\]/);
 assert.match(script,/data-nb-move-handle/);
 assert.match(script,/data-nb-mold-handle/);
 assert.match(script,/const hit=findStrokeNear\(p,false\)/);
 assert.match(script,/warpDrag=\{pointerId:event\.pointerId/);
 assert.match(script,/if\(warpDrag&&warpDrag\.pointerId===event\.pointerId\)/);
});
test('Capas dimensionam palavras inteiras e moldura ocupa altura do viewport',()=>{
 assert.match(script,/function fitCoverTitles\(\)/);
 assert.match(script,/ctx\.measureText\(word\)\.width/);
 assert.match(style,/hyphens:none!important/);
 assert.match(nav,/function fitNotebookHeight\(\)/);
 assert.match(nav,/window\.innerHeight-top-6/);
});
