/* A Biblioteca de audiobooks não pode mostrar livros sem gravação a membros comuns. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const code=fs.readFileSync(new URL('../biblioteca-audiobooks.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const rows=[
 {id:'chapter-1',book_key:'marcondes-filosofia',chapter_order:1,chapter_title:'Introdução',audio_path:'audiobooks/marcondes-filosofia/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.mp3',book_title:'Iniciação à história da filosofia',book_author:'Danilo Marcondes',book_subject:'Filosofia'},
 {id:'chapter-2',book_key:'album-custom',chapter_order:1,chapter_title:'Capítulo único',audio_path:'audiobooks/album-custom/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb.mp3',book_title:'Livro do Álbum',book_author:'Uma Autora',book_subject:'Psicologia'}
];
function setup(){
 let admin=false,refresh=0;
 const listeners={};
 class AudioFake{
  constructor(){this.paused=true;this.currentTime=0;this.duration=NaN;this.playbackRate=1;this.src=''}
  addEventListener(){}
  pause(){this.paused=true}
  load(){}
  removeAttribute(){this.src=''}
  play(){this.paused=false;return Promise.resolve()}
 }
 const doc={readyState:'loading',addEventListener:(name,fn)=>{(listeners[name]??=[]).push(fn)},getElementById:()=>null,querySelector:()=>null};
 const w={addEventListener(){},uentzoulAdminConfig:{isAdmin:()=>admin},
 uentzoulAIAuth:{user:()=>({id:'member-1'}),client:()=>({from:()=>({select:()=>({order:async()=>({data:rows,error:null})})})})},
 PSICO_BOOK_LIBRARY:{books:()=>[
  {id:'marcondes-filosofia',title:'Iniciação à história da filosofia',author:'Danilo Marcondes',subject:'Filosofia'},
  {id:'piaget-seis-estudos',title:'Seis estudos de psicologia',author:'Jean Piaget',subject:'Psicologia'}
 ]},uentzoulAudioRefresh(){refresh++}};
 vm.runInNewContext(code,{window:w,document:doc,Audio:AudioFake,localStorage:{getItem:()=>null,setItem(){}},MutationObserver:class{},FormData:class{},requestAnimationFrame:()=>0,crypto:{randomUUID:()=> 'id'}});
 return {w,listeners,setAdmin:n=>{admin=n},refreshCount:()=>refresh};
}
test('Membros veem somente audiobooks efetivamente enviados, inclusive os adicionados ao álbum',async()=>{
 const x=setup();
 let view=x.w.PSICO_AUDIO_LIBRARY.render();
 assert.doesNotMatch(view,/data-psa-open=/);
 x.w.PSICO_AUDIO_LIBRARY.afterRender();
 await new Promise(resolve=>setImmediate(resolve));
 view=x.w.PSICO_AUDIO_LIBRARY.render();
 assert.match(view,/Iniciação à história da filosofia/);
 assert.match(view,/Livro do Álbum/);
 assert.doesNotMatch(view,/Seis estudos de psicologia/);
 assert.doesNotMatch(view,/Versão externa encontrada/);
 assert.equal((view.match(/data-psa-open=/g)||[]).length,2);
 assert.ok(x.refreshCount()>=1,'catálogo atualiza quando o servidor responde');
 const click={dataset:{psaOpen:'album-custom'},hasAttribute:key=>key==='data-psa-open'};
 x.listeners.click[0]({target:{closest:selector=>selector==='#psbLibrary .psa-app'?true:click},preventDefault(){}});
 view=x.w.PSICO_AUDIO_LIBRARY.render();
 assert.match(view,/Sumário do audiobook/);
 assert.doesNotMatch(view,/Adicionar capítulo autorizado/);
 assert.doesNotMatch(view,/Onde ouvir fora do site/);
});
test('Administrador continua vendo todas as obras e tem ferramentas exclusivas',()=>{
 const x=setup();x.setAdmin(true);
 const view=x.w.PSICO_AUDIO_LIBRARY.render();
 assert.match(view,/Seis estudos de psicologia/);
 assert.match(view,/Iniciação à história da filosofia/);
});
test('Membros autenticados podem abrir a Biblioteca sem acesso às ferramentas administrativas',()=>{
 assert.match(html,/id="navBookLibraryAdmin" data-page="books" aria-label="Biblioteca — livros"/);
 assert.doesNotMatch(html,/navAudiobooksMembers/);
 assert.doesNotMatch(html,/<span class="nav-label">Audiobooks<\/span>/);
 assert.match(html,/if\(page==='audiobooks'\)return/);
 assert.match(html,/if\(current.page==='audiobooks'\)current.page='home'/);
 assert.match(html,/case 'audiobooks':body=/);
 assert.match(html,/if\(page==='books'&&!window\.uentzoulAIAuth\?\.user\?\.\(\)\)/);
 assert.doesNotMatch(html,/id="navBookLibraryAdmin" data-page="books" hidden/);
 assert.match(code,/if\(busy\|\|!isAdmin\(\)\|\|!selected\)return/);
 assert.match(code,/const bs=isAdmin\(\)\?books\(\):\[\.\.\.new Set\(rows\.filter/);
});

test('Audiobooks continuam em breve e bloqueados para leitura, inclusive para administradores',()=>{
 const books=fs.readFileSync(new URL('../biblioteca-livros.js',import.meta.url),'utf8');
 const css=fs.readFileSync(new URL('../biblioteca-livros.css',import.meta.url),'utf8');
 assert.match(books,/psb-category-audio psb-category-coming" disabled aria-disabled="true"/);
 assert.match(books,/if\(tab\.dataset\.psbTab==='audio'\)return/);
 assert.match(books,/if\(activeShelf==='audio'\)activeShelf='home'/);
 assert.match(css,/\.psb-category-audio\.psb-category-coming/);
 assert.doesNotMatch(html,/pm-audio-soon-tag/);
});
