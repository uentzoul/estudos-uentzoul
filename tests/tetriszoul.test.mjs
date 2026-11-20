import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root=path.resolve(import.meta.dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const html=read('tetriszoul.html');
const script=html.match(/<script>\n([\s\S]*?)\n<\/script>/)?.[1];

test('TetrisZoul possui página própria com regras 40 Lines',()=>{
 assert.ok(script,'jogo embutido disponível');
 assert.match(html,/lang="pt-BR"/);
 assert.match(html,/id="board"/);
 assert.match(html,/TARGET=40/);
 assert.match(html,/7-bag/);
 assert.match(html,/DAS \(ms\)/);
 assert.match(html,/restart:"KeyD"/);
 assert.match(html,/id="settingsDrawer"/);
 assert.match(html,/data-setting-pane="skin"/);
 assert.doesNotMatch(html,/id="lobby"/);
 assert.match(html,/ARR \(ms\)/);
 assert.match(html,/data-touch="drop"/);
 assert.match(html,/uentzoul_is_admin/,'permite só acesso administrativo');
 assert.match(html,/uentzoul_tetriszoul_runs/,'recordes salvos na conta');
});

test('TetrisZoul só aparece na última opção do Extras, não no Admin Config',()=>{
 const admin=read('admin-config.js');
 const extras=read('extras.html');
 const js=read('extras.js');
 assert.doesNotMatch(admin,/admin-tetriszoul-link|Jogar TetrisZoul/);
 assert.ok(extras.indexOf('data-game="tetris"')>extras.indexOf('data-game="conexo"'));
 assert.match(extras,/data-game="tetris" aria-selected="false" hidden/);
 assert.match(js,/if\(b.dataset.game==="tetris"\)b.hidden=!isAdmin/);
 assert.match(html,/rpc\("uentzoul_is_admin"\)/);
 assert.doesNotMatch(html,/set_concurso_role|set_tetris_role|grant_role/);
});

test('JavaScript do TetrisZoul é sintaticamente válido',()=>{
 assert.doesNotThrow(()=>new vm.Script(script,{filename:'tetriszoul.html#game'}));
});

test('Motor: 7 peças distintas, rotação, deslocamento, Hold e queda',()=>{
 const altered=script.replace(/\nverify\(\);\n\}\)\(\);\s*$/,
 '\nwindow.__tzTest={reset,rotate,move,holdPiece,hardDrop,shuffleBag,state:()=>({pieces,lines,phase,piece,hold,grid})};\n})();');
 assert.notEqual(altered,script,'funções do jogo localizadas');
 const noop=()=>{};
 const ctx={clearRect:noop,fillRect:noop,beginPath:noop,moveTo:noop,lineTo:noop,stroke:noop,strokeRect:noop,save:noop,restore:noop};
 const elements=new Map();
 function id(key){
  if(!elements.has(key))elements.set(key,{
   textContent:'',innerHTML:'',value:'',hidden:false,addEventListener:noop,
   getContext:()=>ctx,append:noop,width:key==='board'?300:120,height:key==='board'?600:76
  });
  return elements.get(key);
 }
 const document={getElementById:id,addEventListener:noop,querySelectorAll:()=>[],createElement:()=>({textContent:'',append:noop})};
 const crypto={getRandomValues:arr=>{for(let i=0;i<arr.length;i++)arr[i]=i*17+21;}};
 const window={addEventListener:noop,crypto};
 const storage={getItem:()=>null,setItem:noop};
 const sandbox={document,window,localStorage:storage,performance:{now:()=>15000},requestAnimationFrame:noop,crypto,console};
 vm.runInNewContext(altered,sandbox,{filename:'tetriszoul-engine.test.js'});
 const game=window.__tzTest;
 game.reset();
 const bag=game.shuffleBag();
 assert.equal(bag.length,7);
 assert.equal(new Set(bag).size,7);
 game.rotate(1);
 assert.equal(game.state().piece.r,1);
 const beforeX=game.state().piece.x;
 game.move(-1,0);
 assert.equal(game.state().piece.x,beforeX-1);
 game.holdPiece();
 assert.ok(game.state().hold);
 game.hardDrop();
 assert.equal(game.state().pieces,1);
 assert.equal(game.state().grid.flat().filter(Boolean).length,4);
});

test('Soft drop em Fast e Ultra percorre várias linhas por frame, sem fixar a peça',()=>{
  const altered=script.replace(/\nverify\(\);\n\}\)\(\);\s*$/,
    '\nwindow.__tzTest={reset,press,release,frame,settings,allow:()=>{approved=true;},state:()=>({y:piece.y,pieces,phase})};\n})();');
  assert.notEqual(altered,script,'motor de soft drop localizado');
  const noop=()=>{};
  const ctx={clearRect:noop,fillRect:noop,beginPath:noop,moveTo:noop,lineTo:noop,stroke:noop,strokeRect:noop,save:noop,restore:noop};
  const elements=new Map();
  function id(key){
    if(!elements.has(key))elements.set(key,{
      textContent:'',innerHTML:'',value:'',hidden:false,addEventListener:noop,
      getContext:()=>ctx,append:noop,width:key==='board'?300:120,height:key==='board'?600:76
    });
    return elements.get(key);
  }
  let time=1000;
  const crypto={getRandomValues:arr=>{for(let i=0;i<arr.length;i++)arr[i]=i*17+21;}};
  const document={getElementById:id,addEventListener:noop,querySelectorAll:()=>[],createElement:()=>({textContent:'',append:noop})};
  const window={addEventListener:noop,crypto};
  const sandbox={document,window,localStorage:{getItem:()=>null,setItem:noop},performance:{now:()=>time},requestAnimationFrame:noop,crypto,console};
  vm.runInNewContext(altered,sandbox,{filename:'tetriszoul-softdrop.test.js'});
  const game=window.__tzTest;
  game.reset();game.allow();game.settings.softDrop='fast';
  game.press('down');
  const initial=game.state().y;
  time+=20;game.frame();
  assert.equal(game.state().y-initial,4,'Fast desce quatro linhas em 20 ms, sem limite de uma por frame');
  assert.equal(game.state().pieces,0,'soft drop não efetua hard drop');
  game.release('down');
  const stopped=game.state().y;time+=100;game.frame();
  assert.equal(game.state().y,stopped,'a queda para imediatamente ao soltar a seta');
  game.reset();game.settings.softDrop='ultra';
  game.press('down');const ultraStart=game.state().y;
  time+=16;game.frame();
  assert.ok(game.state().y-ultraStart>=15,'Ultra atravessa mais de uma linha por frame');
  game.reset();game.settings.softDrop='instant';
  game.press('down');time+=16;game.frame();
  assert.equal(game.state().pieces,0,'Instant não trava a peça no tabuleiro');
  const bottom=game.state().y;time+=16;game.frame();
  assert.equal(game.state().y,bottom,'Instant deixa a peça no ponto de contato');
});
