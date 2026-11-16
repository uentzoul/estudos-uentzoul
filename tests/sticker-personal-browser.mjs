import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:844}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setContent('<!doctype html><html lang="pt-BR"><head></head><body><main class="dm-shell"><div id="fixture"></div></main></body></html>');
  await page.addStyleTag({path:path.join(root,'chat-sticker-personal.css')});
  await page.addScriptTag({content:"\nvar onlineUser={id:'11111111-1111-4111-8111-111111111111',is_anonymous:false};\nvar client={\n from:function(){return {\n  select:function(_,options){this.isCount=Boolean(options&&options.head);return this;},\n  eq:function(){return this;},order:function(){return this;},limit:function(){return this;},\n  then:function(resolve,reject){return Promise.resolve(this.isCount?{count:0,error:null}:{data:[],error:null}).then(resolve,reject);}\n }},\n functions:{invoke:async(_,opts)=>({data:opts.body.action==='preview'\n   ?{code:opts.body.code,title:'Pacote de Teste',count:2,preview:[]}\n   :{id:'22222222-2222-4222-8222-222222222222',title:'Pacote de Teste',count:2,total:2},error:null})}\n};\nvar dmComposer=()=>'<form><section id=\"pmStickerPanel\"><header class=\"pm-sticker-head\"><strong>Figurinhas</strong><button type=\"button\">×</button></header></section></form>';\nwindow.uentzoulStickerPacks={refresh:()=>{window.__refreshed=(window.__refreshed||0)+1}};\n"});
  await page.addScriptTag({path:path.join(root,'chat-sticker-personal.js')});
  await page.evaluate(()=>document.querySelector('#fixture').innerHTML=dmComposer());
  await page.getByRole('button',{name:'Adicionar pacote de figurinhas'}).click();
  const dialog=page.getByRole('dialog',{name:'Adicionar pacote'});
  assert.equal(await dialog.count(),1);
  assert.equal(await page.evaluate(()=>uentzoulStickerPersonal.codeFrom('https://sticker.ly/s/A3ZA4F')),'A3ZA4F');
  assert.equal(await page.evaluate(()=>uentzoulStickerPersonal.codeFrom('https://evil.example/s/A3ZA4F')),'');
  await dialog.locator('#pmPackCode').fill('https://sticker.ly/s/A3ZA4F');
  await dialog.getByRole('button',{name:'Verificar pacote'}).click();
  await dialog.getByText('2 figurinhas encontradas').waitFor({state:'visible'});
  await dialog.locator('#pmPackRights').check();
  await dialog.getByRole('button',{name:'Importar pacote'}).click();
  await dialog.getByText('Pacote Pacote de Teste adicionado: 2 figurinhas.').waitFor({state:'visible'});
  assert.ok((await page.evaluate(()=>window.__refreshed))>0);
  await dialog.getByRole('button',{name:'Imagens próprias'}).click();
  assert.equal(await dialog.locator('#pmPackName').isVisible(),true);
  assert.equal(await dialog.locator('#pmPackCode').isVisible(),false);
  const box=await dialog.boundingBox();
  assert.ok(box&&box.x>=-1&&box.x+box.width<=width+1,'Modal fora da tela '+width);
  await page.keyboard.press('Escape');
  assert.equal(await dialog.count(),0);
  assert.deepEqual(errors,[]);
  await page.close();
 }
 console.log('Pacotes pessoais: modal, link, permissões, imports e responsividade OK');
}finally{await browser.close();}
