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
 assert.match(script,/const W=780,H=1240,L=34,START=97,ROWS=30,FIRST_LINE=3/);
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
 assert.match(script,/\[\['warp','⌁ Deformar desenho'\]\]/);
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
