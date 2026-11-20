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
 assert.match(html,/ARR \(ms\)/);
 assert.match(html,/data-touch="drop"/);
 assert.match(html,/uentzoul_is_admin/,'permite só acesso administrativo');
 assert.match(html,/uentzoul_tetriszoul_runs/,'recordes salvos na conta');
});

test('Entrada no Admin Config fica diretamente depois do LOG, sem modificar papéis',()=>{
 const admin=read('admin-config.js');
 const body=admin.slice(admin.indexOf('function render(){'));
 const log=body.indexOf('adminLogMarkup()+');
 const game=body.indexOf('Jogar TetrisZoul');
 assert.ok(log>=0&&game>log,'link após LOG');
 assert.match(body,/href="\.\/tetriszoul\.html"/);
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
 const ctx={clearRect:noop,fillRect:noop,beginPath:noop,moveTo:noop,lineTo:noop,stroke:noop};
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
