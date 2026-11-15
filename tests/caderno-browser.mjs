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
 await f.locator('#nbSheet').waitFor({state:'visible',timeout:15000});
 // Data deve ficar no alto, alinhada à faixa do título.
 const datePos=await f.locator('.nb-paper-date-group').evaluate(el=>({top:parseFloat(getComputedStyle(el).top),height:el.offsetHeight}));
 assert.equal(datePos.top,100);
 assert.ok(datePos.height>=38);

 assert.equal(await f.locator('[data-nb-action="select"]').getAttribute('aria-pressed'),'true','Selecionar precisa ser o padrão');
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
 const beforePan=await f.locator('#nbViewport').evaluate(el=>el.scrollTop);
 await page.mouse.move(blank.x,blank.y);await page.mouse.down();
 await page.mouse.move(blank.x,blank.y-132,{steps:9});await page.mouse.up();
 const afterPan=await f.locator('#nbViewport').evaluate(el=>el.scrollTop);
 assert.ok(afterPan>beforePan+20,'Selecionar deve arrastar a página para cima e para baixo');
 await f.locator('#nbViewport').evaluate(el=>{el.scrollTop=0;el.scrollLeft=0});
 await f.locator('[data-nb-action="text"]').click();
 const first=await point(250,97+3*34+8);
 await page.mouse.click(first.x,first.y);
 const inline=f.locator('#nbEditorText');
 await inline.waitFor({state:'visible'});
 const y1=Number((await inline.getAttribute('style')).match(/top:\s*([\d.]+)px/)?.[1]);
 await inline.fill('A psicologia nao e simples');
 await inline.press('Enter');
 await f.locator('[data-nb-note]').first().waitFor({state:'visible'});
 await page.waitForFunction(()=>{
  const doc=document.querySelector('#nbQaFrame')?.contentDocument;
  return doc?.querySelector('.nb-note')?.textContent?.includes('não');
 },{timeout:5000});
 const second=f.locator('#nbEditorText');
 assert.ok(await second.isVisible(),'Enter deve abrir nova linha diretamente no papel');
 const y2=Number((await second.getAttribute('style')).match(/top:\s*([\d.]+)px/)?.[1]);
 assert.equal(y2-y1,34,'Tamanho 1 deve avançar uma linha física');
 await second.press('Enter');
 assert.equal(await f.locator('[data-nb-note]').count(),1,'Enter sem conteúdo não cria nota');
 // Posicionar um post-it rosa pela paleta.
 await f.locator('[data-nb-action="sticky"]').click();
 await f.locator('[data-nb-tone="pink"]').click();
 const pst=await point(520,420);await page.mouse.click(pst.x,pst.y);
 assert.equal(await f.locator('.nb-sticky[data-tone="pink"]').count(),1,'Paleta de post-its deve selecionar cor');
 await f.locator('.nb-sticky textarea').fill('Lembrete');
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
 // Oito alças de esticar / achatar para post-its, textos e desenhos.
 await f.locator('.nb-sticky').first().click({position:{x:30,y:40}});
 await f.locator('.nb-transform-handle').first().waitFor({state:'visible'});
 assert.equal(await f.locator('.nb-transform-handle').count(),8);
 assert.equal(await f.locator('[data-nb-delete-sticky]').isVisible(),true);
 const st=f.locator('.nb-sticky').first();
 const oldWidth=await st.evaluate(el=>el.getBoundingClientRect().width);
 const handle=f.locator('.nb-handle-se');const hb=await handle.boundingBox();
 await page.mouse.move(hb.x+hb.width/2,hb.y+hb.height/2);await page.mouse.down();
 await page.mouse.move(hb.x+hb.width/2+43,hb.y+hb.height/2+20,{steps:7});await page.mouse.up();
 const newWidth=await st.evaluate(el=>el.getBoundingClientRect().width);
 assert.ok(newWidth>oldWidth+15,'Esticar pelo canto deve aumentar a largura do post-it');
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
 assert.equal(await f.locator('[data-nb-open-page]').count(),1);
 await f.locator('[data-nb-open-page="0"]').click();
 await f.locator('#nbGallery').waitFor({state:'hidden'});
 // PDF local contém uma página do caderno.
 const [download]=await Promise.all([
  page.waitForEvent('download',{timeout:30000}),
  f.locator('[data-nb-action="export"]').click()
 ]);
 assert.match(download.suggestedFilename(),/\.pdf$/i);
 const savedPdf=await readFile(await download.path());
 assert.ok(savedPdf.subarray(0,8).toString('latin1').startsWith('%PDF-1.4'));
 assert.match(savedPdf.toString('latin1'),/\/Count 1/);
 // Capas acessíveis pelo botão de voltar e ambiente externo escuro, papel claro.
 await f.locator('[data-nb-action="backToBooks"]').click();
 assert.equal(await f.locator('.nb-book-cover').count(),1);
 // O botão Voltar do navegador/mouse deve retornar à biblioteca de cadernos.
 await f.locator('[data-nb-book]').first().click();
 assert.equal(await f.locator('#nbDrawer').isVisible(),false);
 // Navegação da história interna do iframe (sem aguardar reload da página principal).
 await f.locator('#nbRoot').evaluate(()=>history.back());
 await f.locator('#nbDrawer').waitFor({state:'visible'});
 assert.ok(await f.locator('.nb-book-cover').count()>=1,'Voltar deve mostrar os cadernos');
 await f.locator('[data-nb-action="closeDrawer"]').click();
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
 await mf.locator('#nbSheet').waitFor({state:'visible'});
 assert.equal(await mf.locator('#nbPageRail').evaluate(el=>el.classList.contains('is-open')),false,
   'No celular, a lista de páginas começa recolhida');
 await mf.locator('[data-nb-action="toggleRail"]').click();
 assert.equal(await mf.locator('#nbPageRail').evaluate(el=>el.classList.contains('is-open')),true,
   'O puxador deve abrir o painel móvel');
 await mobile.close();
 console.log('Caderno browser QA OK: Enter, IA, post-it, seleção, borracha, Ctrl+Z, galeria, PDF, pan e celular');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
