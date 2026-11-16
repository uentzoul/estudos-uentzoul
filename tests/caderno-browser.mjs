// Teste funcional do Caderno em um navegador real, com autenticador local simulado.
// Nenhum usuário, tabela ou função de produção é acessado; o servidor é localhost.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const html='<!doctype html><html lang="pt-BR"><meta charset="utf-8">'+
 '<meta name="viewport" content="width=device-width, initial-scale=1">'+
 '<style>html,body{margin:0;height:100%;overflow:hidden}iframe{border:0;width:100%;height:100vh}</style>'+
 '<script>window.uentzoulAdminConfig={isAdmin:()=>true};'+
 'window.uentzoulAIAuth={user:()=>({id:"qa-browser-admin"}),'+
 'client:()=>({functions:{invoke:async(_,args)=>({data:{text:args.body.text.replace(/nao/g,"não"),reviewed:true},error:null})}})};'+
 '</script><iframe id="nbQaFrame" title="Caderno QA" src="/caderno.html"></iframe></html>';
const types={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8','.css':'text/css;charset=utf-8'};
const server=createServer(async(req,res)=>{
 const uri=new URL(req.url,'http://localhost'),pathname=uri.pathname;
 if(pathname==='/'){
  res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});res.end(html);return;
 }
 if(!/^\/caderno(?:-pdf)?\.(?:html|js|css)$/.test(pathname)){
  res.writeHead(404);res.end('not found');return;
 }
 try{
  const file=await readFile(path.join(base,pathname.slice(1)));
  res.writeHead(200,{'content-type':types[path.extname(pathname)],'cache-control':'no-store'});res.end(file);
 }catch(_){res.writeHead(404);res.end('not found')}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const address='http://127.0.0.1:'+server.address().port+'/';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 const ctx=await browser.newContext({viewport:{width:1366,height:900},acceptDownloads:true});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(address,{waitUntil:'domcontentloaded'});
 const f=page.frameLocator('#nbQaFrame');
 await f.locator('#nbShelf').waitFor({state:'visible',timeout:15000});
 assert.equal(await f.locator('[data-nb-shelf-book]').count(),6,'Estante inicia com as seis matérias');
 assert.deepEqual(await f.locator('.nb-shelf-title').allTextContents(),[
  'Psicologia da Família','Avaliação Psicológica',
  'Teorias e Modelos Comportamentais e Cognitivos',
  'Psicologia Social I','Metapsicologia','Psicologia de Grupos']);
 const colors=await f.locator('.nb-shelf-cover').evaluateAll(els=>
  els.map(el=>getComputedStyle(el).getPropertyValue('--nb-book-cover').trim()));
 assert.equal(new Set(colors).size,6,'Cada matéria deve ter sua própria cor');
 const columns=await f.locator('.nb-shelf-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);
 assert.equal(columns,3,'Estante desktop deve organizar as seis capas em 3 colunas');
 for(const title of await f.locator('.nb-shelf-title').all()){
  const state=await title.evaluate(el=>{
   const font=getComputedStyle(el),ctx=document.createElement('canvas').getContext('2d');
   ctx.font=font.fontWeight+' '+font.fontSize+' '+font.fontFamily;
   return {word:Math.max(...el.textContent.split(/\s+/).map(w=>ctx.measureText(w).width)),
    width:el.clientWidth};
  });
  assert.ok(state.word<state.width+4,'Nenhum nome de matéria deve cortar uma palavra na capa');
 }
 await f.locator('[data-nb-shelf-book="materia-familia"]').click();
 await f.locator('#nbSheet').waitFor({state:'visible',timeout:15000});
 assert.equal(await f.locator('#nbTools').isVisible(),false,'Caderno abre em modo somente leitura');
 assert.equal(await f.locator('#nbPaperDate').isDisabled(),true);
 assert.equal(await f.locator('#nbEditToggle').textContent(),'✎ Editar');
 const rawReadOnly=await f.locator('#nbSheet').boundingBox();
 await page.mouse.click(rawReadOnly.x+250*rawReadOnly.width/780,
  rawReadOnly.y+140*rawReadOnly.height/1240);
 assert.equal(await f.locator('#nbEditorText').count(),0,'Modo leitura não pode criar notas ao tocar na folha');
 await f.locator('.nb-page-control [data-nb-action="next"]').click();
 assert.equal(await f.locator('#nbPageNum').textContent(),'01','Leitura não cria páginas vazias');
 await f.locator('#nbEditToggle').click();
 assert.equal(await f.locator('#nbTools').isVisible(),true,'Editar libera as ferramentas');
 assert.equal(await f.locator('#nbPaperDate').isEnabled(),true);
 // Data deve ocupar a segunda linha real, sem campo de título.
 const datePos=await f.locator('.nb-paper-date-group').evaluate(el=>({top:parseFloat(getComputedStyle(el).top),height:el.offsetHeight}));
 assert.equal(datePos.top,30);
 assert.ok(datePos.height>=30);
 assert.equal(await f.locator('#nbPaperTitle').count(),0);
 assert.ok(await f.locator('.nb-corner-back').evaluate(el=>parseFloat(getComputedStyle(el).top))<20);

 assert.equal(await f.locator('[data-nb-action="none"]').getAttribute('aria-pressed'),'true','Navegar precisa ser o padrão neutro');
 assert.equal(await f.locator('#nbPageRail').count(),1);
 assert.ok(await f.locator('#nbPageRail').evaluate(el=>el.classList.contains('is-open')),'Miniaturas laterais devem estar abertas no desktop');
 await f.locator('[data-nb-action="text"]').click();
 const point=async(x,y)=>{
  const box=await f.locator('#nbSheet').boundingBox();
  return{x:box.x+x*box.width/780,y:box.y+y*box.height/1240};
 };
 // Com Selecionar, arrastar o espaço vazio desloca a folha (não desenha).
 await f.locator('[data-nb-action="select"]').click();
 const blank=await point(550,540);
 const beforePan=(await f.locator('#nbSheet').boundingBox()).y;
 await page.mouse.move(blank.x,blank.y);await page.mouse.down();
 await page.mouse.move(blank.x,blank.y-132,{steps:9});await page.mouse.up();
 const afterPan=(await f.locator('#nbSheet').boundingBox()).y;
 assert.ok(afterPan<beforePan-20,'Selecionar deve arrastar a página livremente para cima e para baixo');
 const resetBlank=await point(550,540);
 await page.mouse.move(resetBlank.x,resetBlank.y);await page.mouse.down();
 await page.mouse.move(resetBlank.x,resetBlank.y+132,{steps:9});await page.mouse.up();
 await f.locator('[data-nb-action="text"]').click();
 const first=await point(250,28+3*34+8);
 await page.mouse.click(first.x,first.y);
 const inline=f.locator('#nbEditorText');
 await inline.waitFor({state:'visible'});
 const y1=Number((await inline.getAttribute('style')).match(/top:\s*([\d.]+)px/)?.[1]);
 await inline.fill('A psicologia nao e simples');
 await inline.press('Enter');
 await f.locator('[data-nb-note]').first().waitFor({state:'visible'});
 await page.waitForFunction(()=>{
  const doc=document.querySelector('#nbQaFrame')?.contentDocument;
  return doc?.querySelector('#nbTextLayer .nb-note')?.textContent?.includes('não');
 },{timeout:5000});
 // A miniatura deve ter a mesma fonte, conteúdo e geometria real da folha.
 await f.locator('.nb-rail-paper .nb-snapshot-sheet .nb-note').first().waitFor({state:'visible'});
 const fullNote=f.locator('#nbTextLayer .nb-note').first();
 const railNote=f.locator('.nb-rail-paper .nb-snapshot-sheet .nb-note').first();
 assert.equal(await railNote.textContent(),await fullNote.textContent(),'Prévia deve mostrar o texto completo, não um resumo');
 assert.equal(await railNote.getAttribute('style'),await fullNote.getAttribute('style'),'Fonte, tamanho e posição precisam ser idênticos antes da escala');
 const thumb=f.locator('.nb-rail-paper').first();
 const imageSize=await thumb.boundingBox(),scaledSheet=await f.locator('.nb-rail-paper .nb-snapshot-sheet').first().boundingBox();
 assert.ok(Math.abs(imageSize.width-scaledSheet.width)<2,'A página deve caber exatamente na largura da miniatura');
 const fullPage=await f.locator('#nbSheet').boundingBox(),fullBounds=await fullNote.boundingBox(),thumbBounds=await railNote.boundingBox();
 assert.ok(Math.abs((fullBounds.x-fullPage.x)/fullPage.width-(thumbBounds.x-imageSize.x)/imageSize.width)<.02,
  'Posição horizontal do texto deve ser proporcional à folha real');
 assert.ok(Math.abs((fullBounds.y-fullPage.y)/fullPage.height-(thumbBounds.y-imageSize.y)/imageSize.height)<.02,
  'Posição vertical do texto deve ser proporcional à folha real');
 // Ao reabrir a anotação corrigida, não pode reaparecer o texto original com erro.
 await fullNote.click();
 assert.equal(await f.locator('#nbEditorText').inputValue(),'A psicologia não e simples.',
  'Reedição precisa partir do texto corrigido e não do rascunho pré-revisão');
 await f.locator('#nbEditorText').press('Enter');
 const second=f.locator('#nbEditorText');
 assert.ok(await second.isVisible(),'Enter deve abrir nova linha diretamente no papel');
 const y2=Number((await second.getAttribute('style')).match(/top:\s*([\d.]+)px/)?.[1]);
 assert.equal(y2-y1,34,'Tamanho 1 deve avançar uma linha física');
 const oneLineSizing=await f.locator('#nbTextLayer .nb-note').first().evaluate(el=>{
  const content=el.querySelector('.nb-note-content');
  const paper=document.querySelector('#nbSheet'),scale=paper.getBoundingClientRect().width/780;
  const bounds=el.querySelector('.nb-note-content').getBoundingClientRect();
  const positionTop=parseFloat(el.style.top);
  const target=paper.getBoundingClientRect().top+(positionTop+34)*scale;
  return {capital:parseFloat(getComputedStyle(content).fontSize),
   lower:parseFloat(getComputedStyle(el).fontSize),lineGap:(target-bounds.bottom)/scale,
   top:positionTop,cssHeight:bounds.height/scale};
 });
 console.log('LINE BASELINE QA '+JSON.stringify(oneLineSizing));
 // Verificação visual por pixels: a cor da caneta não pode ficar "flutuando".
 // As linhas da pauta são azuis claras; pixels de tinta possuem R baixo e B>G.
 const visual=await f.locator('#nbSheet').boundingBox(),inkZoom=visual.width/780;
 const area={x:visual.x+135*inkZoom,y:visual.y+(oneLineSizing.top-20)*inkZoom,
  width:470*inkZoom,height:80*inkZoom};
 await f.locator('#nbEditorText').evaluate(el=>{el.dataset.qaVisibility=el.style.visibility;el.style.visibility='hidden'});
 const sample=await page.screenshot({clip:area,animations:'disabled'});
 await f.locator('#nbEditorText').evaluate(el=>{el.style.visibility=el.dataset.qaVisibility||''});
 const ink=await page.evaluate(async b64=>{
  const img=new Image();img.src='data:image/png;base64,'+b64;await img.decode();
  const cv=document.createElement('canvas');cv.width=img.width;cv.height=img.height;
  const cx=cv.getContext('2d');cx.drawImage(img,0,0);
  const raw=cx.getImageData(0,0,img.width,img.height).data;
  let minY=Infinity,maxY=-1,count=0;
  for(let y=0;y<img.height;y++)for(let x=0;x<img.width;x++){
   const i=(y*img.width+x)*4,r=raw[i],g=raw[i+1],b=raw[i+2];
   if(r<95&&g<150&&b<210&&b>g+22){
    minY=Math.min(minY,y);maxY=Math.max(maxY,y);count++;
   }
  }
  const suspects=[];
  for(let x=0;x<img.width;x++){
   const y=maxY,i=(y*img.width+x)*4,r=raw[i],g=raw[i+1],b=raw[i+2];
   if(r<95&&g<150&&b<210&&b>g+22&&suspects.length<15)suspects.push({x,r,g,b});
  }
  return{minY,maxY,count,suspects};
 },sample.toString('base64'));
 const visualGap=(((28+4*34)-(oneLineSizing.top-20))*inkZoom-ink.maxY)/inkZoom;
 console.log('INK GAP QA '+JSON.stringify({visualGap,ink,zoom:inkZoom}));
 assert.ok(ink.count>100&&visualGap>=0&&visualGap<=7,'A tinta da anotação deve ficar 0–7px acima da pauta horizontal, sem flutuar nem atravessá-la');

 assert.equal(oneLineSizing.capital,oneLineSizing.lower,'Em 1 linha a maiúscula NÃO deve ocupar a linha de cima');
 assert.equal(oneLineSizing.capital,26,'Letra tamanho 1 deve ter altura normal de escrita');
 await second.press('Enter');
 assert.equal(await f.locator('[data-nb-note]').count(),1,'Enter sem conteúdo não cria nota');
 // Posicionar um post-it rosa pela paleta.
 await f.locator('[data-nb-action="sticky"]').click();
 await f.locator('[data-nb-tone="pink"]').click();
 const pst=await point(520,420);await page.mouse.click(pst.x,pst.y);
 assert.equal(await f.locator('#nbStickyLayer .nb-sticky[data-tone="pink"]').count(),1,'Paleta de post-its deve selecionar cor');
 await f.locator('#nbStickyLayer .nb-sticky textarea').fill('Lembrete');
 await f.locator('.nb-rail-paper .nb-sticky-text-preview').first().waitFor({state:'attached'});
 await page.waitForFunction(()=>{
  const d=document.querySelector('#nbQaFrame')?.contentDocument;
  return d?.querySelector('.nb-rail-paper .nb-sticky-text-preview')?.textContent==='Lembrete';
 });
 assert.equal(await f.locator('.nb-rail-paper .nb-sticky-text-preview').first().textContent(),'Lembrete',
  'A miniatura precisa reproduzir também o texto completo do post-it');
 // A exclusão de um post-it só aparece quando ele é selecionado.
 assert.equal(await f.locator('[data-nb-delete-sticky]').isVisible(),false);
 // Selecionar e deslocar o texto de uma linha para outra.
 await f.locator('[data-nb-action="select"]').click();
 const note=f.locator('[data-nb-note]').first();
 const beforeTop=Number((await note.getAttribute('style')).match(/top:\s*([\d.]+)px/)?.[1]);
 const noteBox=await note.boundingBox();
 await page.mouse.move(noteBox.x+30,noteBox.y+9);
 await page.mouse.down();
 await page.mouse.move(noteBox.x+30,noteBox.y+88,{steps:7});
 await page.mouse.up();
 const afterTop=Number((await note.getAttribute('style')).match(/top:\s*([\d.]+)px/)?.[1]);
 assert.ok(afterTop>beforeTop,'Selecionar deve permitir arrastar texto para outra linha');
 // Não deve restar nenhuma marca/fantasma de seleção depois do arraste.
 assert.equal(await f.locator('.nb-note.nb-selected').count(),0);
 assert.equal(await f.locator('.nb-transform-box').count(),0);
 // Texto pode retornar às primeiras linhas reais, sem bloqueio do antigo título.
 const movedBox=await note.boundingBox();
 await page.mouse.move(movedBox.x+25,movedBox.y+12);await page.mouse.down();
 await page.mouse.move(movedBox.x+25,movedBox.y-185,{steps:9});await page.mouse.up();
 const upperTop=Number((await note.getAttribute('style')).match(/top:\s*([\d.]+)px/)?.[1]);
 assert.ok(upperTop<100,'Texto deve poder ser arrastado para a região superior da folha');
 // Oito alças de esticar / achatar para post-its, textos e desenhos.
 await f.locator('#nbStickyLayer .nb-sticky').first().click({position:{x:30,y:40}});
 await f.locator('.nb-transform-handle').first().waitFor({state:'visible'});
 assert.equal(await f.locator('.nb-transform-handle').count(),8);
 assert.equal(await f.locator('[data-nb-delete-sticky]').isVisible(),true);
 const st=f.locator('#nbStickyLayer .nb-sticky').first();
 const oldWidth=await st.evaluate(el=>el.getBoundingClientRect().width);
 const handle=f.locator('.nb-handle-se');const hb=await handle.boundingBox();
 await page.mouse.move(hb.x+hb.width/2,hb.y+hb.height/2);await page.mouse.down();
 await page.mouse.move(hb.x+hb.width/2+43,hb.y+hb.height/2+20,{steps:7});await page.mouse.up();
 const newWidth=await st.evaluate(el=>el.getBoundingClientRect().width);
 assert.ok(newWidth>oldWidth+15,'Esticar pelo canto deve aumentar a largura do post-it');
 // Botão excluir permanece clicável, sem disparar o arraste do post-it.
 await f.locator('[data-nb-delete-sticky]').click();
 assert.equal(await f.locator('#nbStickyLayer .nb-sticky').count(),0,'× remove post-it selecionado');
 await f.locator('body').press('Control+z');
 assert.equal(await f.locator('#nbStickyLayer .nb-sticky').count(),1,'Ctrl+Z recupera post-it');
 // Desenhar um risco, apagar parcialmente e desfazer.
 await f.locator('[data-nb-action="draw"]').click();
 const start=await point(280,570),stop=await point(500,570);
 await page.mouse.move(start.x,start.y);await page.mouse.down();
 await page.mouse.move(stop.x,stop.y,{steps:20});await page.mouse.up();
 await page.waitForTimeout(250);
 const readStrokes=()=>f.locator('#nbRoot').evaluate(()=>{
  const saved=JSON.parse(localStorage.getItem('uentzoul:caderno:alpha2:qa-browser-admin'));
  return saved?.books[0]?.pages[0]?.strokes||[];
 });
 let strokes=await readStrokes();assert.equal(strokes.length,1,'Desenho precisa ser salvo');
 const thumbDrawing=f.locator('.nb-rail-paper .nb-snapshot-drawing path');
 await thumbDrawing.first().waitFor({state:'attached'});
 assert.ok((await thumbDrawing.first().getAttribute('d')).length>15,'A miniatura precisa desenhar o traço real');
 assert.equal(await thumbDrawing.count(),1,'A prévia acompanha o número de traços sem símbolos substitutos');
 await f.locator('[data-nb-action="erase"]').click();
 const mid=await point(390,570);await page.mouse.click(mid.x,mid.y);
 await page.waitForTimeout(250);
 strokes=await readStrokes();
 assert.equal(strokes.length,2,'Borracha parcial divide o risco em dois fragmentos');
 await f.locator('body').press('Control+z');
 await page.waitForTimeout(250);
 strokes=await readStrokes();assert.equal(strokes.length,1,'Ctrl+Z restaura o desenho apagado');
 // Galeria de folhas apresenta apenas as páginas com conteúdo.
 assert.ok(await f.locator('.nb-rail-page').count()>=1,'O painel lateral mostra a folha salva');
 await f.locator('[data-nb-action="toggleRail"]').click();
 assert.equal(await f.locator('#nbPageRail').evaluate(el=>el.classList.contains('is-open')),false);
 await f.locator('[data-nb-action="toggleRail"]').click();
 assert.equal(await f.locator('#nbPageRail').evaluate(el=>el.classList.contains('is-open')),true);
 await f.locator('[data-nb-action="gallery"]').click();
 await f.locator('#nbGallery').waitFor({state:'visible'});
 await f.locator('[data-nb-open-page="0"]').waitFor({state:'visible'});
 const galleryRect=await f.locator('.nb-gallery-paper').first().boundingBox();
 assert.ok(galleryRect.height/galleryRect.width>1.51,
  'A galeria de Folhas deve mostrar uma folha vertical, não um quadrado');
 assert.equal(await f.locator('[data-nb-open-page]').count(),1);
 await f.locator('[data-nb-open-page="0"]').click();
 await f.locator('#nbGallery').waitFor({state:'hidden'});
 // Enter e dois espaços finais encerram linhas com pontuação/capitalização imediatas.
 await f.locator('[data-nb-action="text"]').click();
 const greeting=await point(250,28+12*34+7);
 await page.mouse.click(greeting.x,greeting.y);
 await f.locator('#nbEditorText').fill('boa tarde rapaziada');
 await f.locator('#nbEditorText').press('Enter');
 await f.locator('#nbTextLayer .nb-note').filter({hasText:'Boa tarde, rapaziada.'}).first().waitFor();
 await f.locator('#nbEditorText').fill('boa tarde rapaziada ');
 await f.locator('#nbEditorText').press('Space');
 await f.locator('#nbTextLayer .nb-note').filter({hasText:'Boa tarde, rapaziada.'}).last().waitFor();
 // PDF local contém uma página do caderno.
 const [download]=await Promise.all([
  page.waitForEvent('download',{timeout:30000}),
  f.locator('[data-nb-action="export"]').click()
 ]);
 assert.match(download.suggestedFilename(),/\.pdf$/i);
 assert.match(download.suggestedFilename(),/PsicoMoodle/);
 const savedPdf=await readFile(await download.path());
 assert.ok(savedPdf.subarray(0,8).toString('latin1').startsWith('%PDF-1.4'));
 assert.match(savedPdf.toString('latin1'),/\/Count 1/);
 // Na segunda folha, Delete deve excluir um traço sem esticar o outro.
 await f.locator('.nb-page-control [data-nb-action="next"]').click();
 await page.waitForTimeout(220);
 await f.locator('[data-nb-action="draw"]').click();
 const drawSegment=async(y)=>{
  const a=await point(300,y),b=await point(510,y);
  await page.mouse.move(a.x,a.y);await page.mouse.down();
  await page.mouse.move(b.x,b.y,{steps:12});await page.mouse.up();
  await page.waitForTimeout(250);
 };
 await drawSegment(430);await drawSegment(560);
 const pageTwoStrokes=()=>f.locator('#nbRoot').evaluate(()=>{
  const saved=JSON.parse(localStorage.getItem('uentzoul:caderno:alpha2:qa-browser-admin'));
  return saved?.books[0]?.pages[1]?.strokes||[];
 });
 const originalSecond=await pageTwoStrokes();assert.equal(originalSecond.length,2);
 await f.locator('[data-nb-action="select"]').click();
 const selectedPoint=await point(400,430);await page.mouse.click(selectedPoint.x,selectedPoint.y);
 await f.locator('.nb-transform-handle').first().focus();
 await f.locator('.nb-transform-handle').first().press('Delete');
 await page.waitForTimeout(260);
 const remaining=await pageTwoStrokes();
 assert.equal(remaining.length,1,'Delete deve excluir só o traço selecionado');
 assert.deepEqual(remaining[0].points,originalSecond[1].points,'Delete não pode aumentar o outro desenho');
 // Moldar: tocar/arrastar sobre o traço NÃO altera o desenho.
 await f.locator('[data-nb-action="warp"]').click();
 const moldPoint=await point(400,560);
 await page.mouse.move(moldPoint.x,moldPoint.y);await page.mouse.down();
 await page.mouse.move(moldPoint.x+35,moldPoint.y+12,{steps:6});await page.mouse.up();
 await page.waitForTimeout(250);
 const noMold=await pageTwoStrokes();
 assert.deepEqual(noMold[0].points,remaining[0].points,'Arrastar diretamente o desenho em Moldar não o deforma');
 await f.locator('.nb-transform-move').waitFor({state:'visible'});
 const grab=await f.locator('.nb-transform-move').boundingBox();
 await page.mouse.move(grab.x+grab.width/2,grab.y+grab.height/2);await page.mouse.down();
 await page.mouse.move(grab.x+grab.width/2+25,grab.y+grab.height/2-20,{steps:6});await page.mouse.up();
 await page.waitForTimeout(260);
 const translated=await pageTwoStrokes();
 assert.ok(Math.abs(translated[0].points[0].x-remaining[0].points[0].x)>10,
  'Quadradinho em Moldar precisa mover o desenho sem modificar sua forma');
 // Voltar à estante (sem sair do iframe) e verificar capas simétricas.
 await f.locator('[data-nb-action="backToBooks"]').click();
 await f.locator('#nbShelf').waitFor({state:'visible'});
 assert.equal(await f.locator('[data-nb-shelf-book]').count(),6);
 const cover=f.locator('[data-nb-shelf-book="materia-metapsicologia"] .nb-shelf-title');
 assert.equal(await cover.textContent(),'Metapsicologia');
 assert.ok(await cover.evaluate(el=>{
  const ctx=document.createElement('canvas').getContext('2d'),st=getComputedStyle(el);
  ctx.font=st.fontWeight+' '+st.fontSize+' '+st.fontFamily;
  return ctx.measureText('Metapsicologia').width<=el.clientWidth+3;
 }), 'Nome da matéria deve caber inteiro na capa');
 assert.equal(await f.locator('.nb-shelf-mark').first().textContent(),'PSICOMOODLE');
 // No modo leitura, mouse Voltar e histórico interno jamais devem abandonar o Caderno.
 await f.locator('[data-nb-shelf-book="materia-metapsicologia"]').click();
 await f.locator('#nbSheet').waitFor({state:'visible'});
 assert.equal(await f.locator('#nbTools').isVisible(),false);
 await f.locator('#nbRoot').evaluate(()=>history.back());
 await f.locator('#nbShelf').waitFor({state:'visible'});
 assert.equal(await page.locator('#nbQaFrame').count(),1,'Voltar do navegador não remove o iframe');
 await f.locator('[data-nb-shelf-book="materia-avaliacao"]').click();
 await f.locator('#nbSheet').waitFor({state:'visible'});
 const blockedSideBack=await f.locator('#nbSheet').evaluate(el=>{
  const ev=new MouseEvent('mousedown',{button:3,bubbles:true,cancelable:true,view:window});
  el.dispatchEvent(ev);return ev.defaultPrevented;
 });
 assert.equal(blockedSideBack,true,'Botão lateral 3 deve cancelar a navegação padrão');
 await f.locator('#nbShelf').waitFor({state:'visible'});
 assert.equal(await page.locator('#nbQaFrame').count(),1,'Botão lateral não sai do PsicoMoodle');
 await page.evaluate(()=>{document.documentElement.dataset.theme='dark'});
 await page.waitForFunction(()=>{
  const frame=document.querySelector('#nbQaFrame')?.contentDocument;
  return frame?.documentElement.dataset.theme==='dark';
 },{timeout:5000});
 assert.equal(await f.locator('#nbSheet').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 253, 248)');
 assert.deepEqual(errors,[],'Nenhum erro JavaScript de execução');
 await ctx.close();
 // Também verifica o trilho de folhas recolhido no celular e a abertura pelo puxador.
 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,acceptDownloads:true});
 const mobilePage=await mobile.newPage();
 await mobilePage.goto(address,{waitUntil:'domcontentloaded'});
 const mf=mobilePage.frameLocator('#nbQaFrame');
 await mf.locator('#nbShelf').waitFor({state:'visible'});
 assert.equal(await mf.locator('.nb-shelf-book').count(),6);
 assert.equal(await mf.locator('.nb-shelf-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),2,
  'No celular as capas usam duas colunas simétricas');
 await mf.locator('[data-nb-shelf-book="materia-familia"]').click();
 await mf.locator('#nbSheet').waitFor({state:'visible'});
 assert.equal(await mf.locator('#nbPageRail').evaluate(el=>el.classList.contains('is-open')),false,
   'No celular, a lista de páginas começa recolhida');
 await mf.locator('[data-nb-action="toggleRail"]').click();
 assert.equal(await mf.locator('#nbPageRail').evaluate(el=>el.classList.contains('is-open')),true,
   'O puxador deve abrir o painel móvel');
 await mobile.close();
 // Teste isolado: modo neutro, fontes, dupla folha e editor em ambos os lados.
 const bookContext=await browser.newContext({viewport:{width:1440,height:940},acceptDownloads:true});
 const bookPage=await bookContext.newPage(),bookErrors=[];
 bookPage.on('pageerror',error=>bookErrors.push(error.message));
 await bookPage.goto(address,{waitUntil:'domcontentloaded'});
 const bf=bookPage.frameLocator('#nbQaFrame');
 await bf.locator('#nbShelf').waitFor({state:'visible'});
 await bf.locator('[data-nb-shelf-book="materia-familia"]').click();
 await bf.locator('#nbSheet').waitFor({state:'visible'});
 assert.equal(await bf.locator('#nbTools').isVisible(),false);
 await bf.locator('#nbEditToggle').click();
 assert.equal(await bf.locator('[data-nb-action="none"]').getAttribute('aria-pressed'),'true');
 const fontOptions=await bf.locator('#nbFont option').allTextContents();
 assert.deepEqual(fontOptions,['Letra de forma 1','Letra de forma 2','Letra cursiva']);
 // A seta anterior não pode abrir a biblioteca quando já se está na primeira folha.
 await bf.locator('.nb-page-control [data-nb-action="prev"]').click();
 await bf.locator('.nb-page-control [data-nb-action="prev"]').click();
 assert.equal(await bf.locator('#nbDrawer').isVisible(),false);
 // Verifica ESC sem marca roxa e sem seleção persistente.
 await bf.locator('[data-nb-action="text"]').click();
 const begin=await bf.locator('#nbSheet').boundingBox();
 const firstX=begin.x+250*begin.width/780,firstY=begin.y+(28+3*34+8)*begin.height/1240;
 await bookPage.mouse.click(firstX,firstY);
 await bf.locator('#nbEditorText').fill('Anotação da folha esquerda');
 await bf.locator('#nbEditorText').press('Escape');
 assert.equal(await bf.locator('[data-nb-action="none"]').getAttribute('aria-pressed'),'true');
 assert.equal(await bf.locator('#nbEditorText').count(),0);
 assert.equal(await bf.locator('.nb-transform-box').count(),0);
 assert.equal(await bf.locator('#nbLineHover').isVisible(),false);
 await bf.locator('#nbLayout').selectOption('book');
 await bf.locator('#nbCompanionWrap').waitFor({state:'visible'});
 assert.equal(await bf.locator('#nbStage').evaluate(el=>el.classList.contains('nb-double')),true);
 const one=await bf.locator('#nbWrap').boundingBox(),two=await bf.locator('#nbCompanionWrap').boundingBox();
 assert.ok(one.width>200&&two.width>200,'Cada folha do caderno aberto deve ocupar espaço real');
 assert.ok(Math.abs(one.y-two.y)<3,'Páginas abertas devem estar alinhadas verticalmente');
 assert.ok(two.x>=one.x+one.width-3,'Primeira folha à esquerda, segunda à direita');
 // Ler: a data vazia não aparece; arraste também funciona na folha direita.
 await bf.locator('#nbEditToggle').click();
 assert.equal(await bf.locator('.nb-paper-date-group').isVisible(),false,
  'A visualização não exibe campos de data sem preenchimento');
 const dragStart=await bf.locator('#nbCompanionWrap').boundingBox();
 const beforeFreePan=await bf.locator('#nbWrap').boundingBox();
 await bookPage.mouse.move(dragStart.x+dragStart.width*.50,dragStart.y+dragStart.height*.55);
 await bookPage.mouse.down();
 await bookPage.mouse.move(dragStart.x+dragStart.width*.50-124,dragStart.y+dragStart.height*.55-82,{steps:9});
 await bookPage.mouse.up();
 const afterFreePan=await bf.locator('#nbWrap').boundingBox();
 assert.ok(afterFreePan.x<beforeFreePan.x-90&&afterFreePan.y<beforeFreePan.y-60,
  'A folha direita também deve arrastar o caderno livremente em X e Y');
 assert.equal(await bf.locator('#nbPageNum').textContent(),'01',
  'Arrastar a folha direita não pode trocar de página por engano');
 const movedCompanion=await bf.locator('#nbCompanionWrap').boundingBox();
 await bookPage.mouse.move(movedCompanion.x+movedCompanion.width*.50,movedCompanion.y+movedCompanion.height*.55);
 await bookPage.mouse.down();
 await bookPage.mouse.move(movedCompanion.x+movedCompanion.width*.50+124,movedCompanion.y+movedCompanion.height*.55+82,{steps:9});
 await bookPage.mouse.up();
 await bookPage.waitForTimeout(110);
 await bf.locator('#nbEditToggle').click();
 // A segunda folha é clicável e abre editor naquela mesma posição.
 await bf.locator('[data-nb-action="text"]').click();
 const z=await bf.locator('#nbRoot').evaluate(()=>Number(document.querySelector('#nbZoomText').textContent.replace('%',''))/100);
 const secondLeft=bf.locator('#nbCompanionWrap');
 await secondLeft.click({position:{x:140*z,y:(28+3*34+8)*z}});
 await bf.locator('#nbEditorText').waitFor({state:'visible'});
 assert.equal(await bf.locator('#nbZoomText').textContent(),'61%',
  'Ao clicar para escrever na folha direita, o caderno aberto não deve dar zoom inesperado');
 await bf.locator('#nbEditorText').fill('Anotação da folha direita');
 await bf.locator('#nbEditorText').press('Enter');
 await bookPage.waitForTimeout(260);
 assert.equal(await bf.locator('#nbPageNum').textContent(),'02');
 assert.match(await bf.locator('#nbCompanionPaper .nb-note').first().textContent(),/Anotação da folha esquerda/);
 assert.match(await bf.locator('#nbTextLayer .nb-note').first().textContent(),/Anotação da folha direita/);
 // Cursiva conectada é a 3ª opção e fica disponível ao escrever na folha direita.
 await bf.locator('#nbFont').selectOption('joined');
 const third=await bf.locator('#nbSheet').boundingBox();
 await bookPage.mouse.click(third.x+250*third.width/780,third.y+(28+8*34)*third.height/1240);
 await bf.locator('#nbEditorText').fill('Escrita cursiva conectada');
 await bf.locator('#nbEditorText').press('Enter');
 await bf.locator('#nbTextLayer .nb-note.joined').waitFor({state:'visible'});
 assert.match(await bf.locator('#nbTextLayer .nb-note.joined').first().evaluate(el=>getComputedStyle(el).fontFamily),/Dancing Script/);
 // Ao avançar no caderno, passa-se para o próximo par de páginas.
 await bf.locator('.nb-page-control [data-nb-action="next"]').click();
 await bookPage.waitForTimeout(590);
 assert.equal(await bf.locator('#nbPageNum').textContent(),'03');
 assert.equal(await bf.locator('#nbCompanionWrap').isVisible(),true);
 // ESC deve retornar a Navegar, com possibilidade de pan e zoom livres.
 await bf.locator('#nbRoot').press('Escape');
 assert.equal(await bf.locator('[data-nb-action="none"]').getAttribute('aria-pressed'),'true');
 await bf.locator('#nbZoomSlider').fill('76');
 assert.equal(await bf.locator('#nbZoomText').textContent(),'76%');
 assert.deepEqual(bookErrors,[],'Nenhum erro de execução no caderno de duas páginas');
 await bookContext.close();
 // Migração em um navegador limpo: exibe só as seis capas e arquiva o legado.
 const priorContext=await browser.newContext({viewport:{width:1150,height:800}});
 await priorContext.addInitScript(()=>{
  const flag='qa-legacy-seed-installed';
  if(localStorage.getItem(flag))return;
  localStorage.setItem(flag,'yes');
  localStorage.setItem('uentzoul:caderno:alpha2:qa-browser-admin',JSON.stringify({
   books:[{id:'legacy-book',name:'Caderno antigo',pages:[{
    date:'2026-11-01',notes:[{id:'old-note',line:3,text:'Guardado com segurança',size:1}],
    strokes:[],stickies:[]}]}],bookId:'legacy-book',page:0,mode:'none'
  }));
 });
 const priorPage=await priorContext.newPage();await priorPage.goto(address,{waitUntil:'domcontentloaded'});
 const pf=priorPage.frameLocator('#nbQaFrame');
 await pf.locator('#nbShelf').waitFor({state:'visible'});
 assert.equal(await pf.locator('.nb-shelf-book').count(),6);
 const archives=await pf.locator('#nbShelf').evaluate(()=>{
  const backup=localStorage.getItem('psicomoodle:caderno:backup-antes-das-seis-materias:qa-browser-admin');
  const fresh=JSON.parse(localStorage.getItem('uentzoul:caderno:alpha2:qa-browser-admin')||'{}');
  return{backup:backup&&JSON.parse(backup),fresh};
 });
 assert.equal(archives.backup.books[0].name,'Caderno antigo');
 assert.equal(archives.backup.books[0].pages[0].notes[0].text,'Guardado com segurança');
 assert.equal(archives.fresh.books.length,6);
 assert.equal(archives.fresh.curriculumSeeded,true);
 await priorContext.close();
 console.log('Caderno browser QA OK: Enter, IA, post-it, seleção, borracha, Ctrl+Z, galeria, PDF, pan e celular');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
