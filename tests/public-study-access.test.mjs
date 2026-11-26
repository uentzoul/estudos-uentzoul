import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Visitante pode consultar estudo dirigido embutido sem login',()=>{
 const w={addEventListener(){},uentzoulAIAuth:{user:()=>null,client:()=>null},PSICO_GUIDES:{avaliacao:[{id:'avaliacao-p3-teste',status:'original',title:'P3 roteiro',questions:[{n:1,question:'Enunciado de teste',explanation:'Resposta de teste'}]}]}};
 vm.runInNewContext(read('estudos-dirigidos.js'),{window:w,document:{addEventListener(){},querySelectorAll:()=>[]},setInterval(){},setTimeout(){},console});
 const html=w.renderStudyGuide('avaliacao');
 assert.match(html,/Enunciado de teste/);
 assert.match(html,/Resposta de teste/);
 assert.doesNotMatch(html,/data-complete|Entre na sua conta/);
});
test('Documentos e revisões não exigem sessão; audiobooks permanecem fechados',()=>{
 assert.doesNotMatch(read('library-manager.js'),/if\(!u\|\|!c\)\{alert\('Entre na conta para consultar os arquivos/);
 assert.doesNotMatch(read('revisao-ferias.js'),/if\(!user\)\{fileFeedback\('Entre na sua conta/);
 assert.match(read('index.html'),/if\(page==='audiobooks'\)return/);
 assert.match(read('index.html'),/if\(!onlineUser\)return '<section class="dm-login-panel"/);
});
