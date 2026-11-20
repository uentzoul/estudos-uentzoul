import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root=path.resolve(import.meta.dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const page=read('extras.html');
const script=read('extras.js');
const wordSource=read('extras-data.js');
const index=read('index.html');
const dataContext={window:{}};
vm.runInNewContext(wordSource,dataContext,{filename:'extras-data.js'});
const data=dataContext.window.PSICO_EXTRAS_DATA;
const norm=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();

test('Extras é acessível a contas conectadas, com TetrisZoul exclusivo de administradores',()=>{
 assert.match(index,/id="navExtrasGames"/);
 assert.doesNotMatch(index,/id="navExtrasSoon"/);
 assert.ok(index.indexOf('id="navExtrasGames"')<index.indexOf('id="navAdminConfig"'));
 assert.match(index,/case 'extras':body='<div class="psico-extras-embed">/);
 assert.match(page,/id="extrasGate"/);
 assert.match(script,/isAdmin=!role.error&&role.data===true/);
 assert.match(script,/if\(b.dataset.game==="tetris"\)b.hidden=!isAdmin/);
 assert.match(script,/game==="tetris"&&!isAdmin/);
 assert.match(read('tetriszoul.html'),/rpc\("uentzoul_is_admin"\)/);
 assert.doesNotMatch(read('admin-config.js'),/admin-tetriszoul-link/);
 for(const game of ['tetris','psico','conexo','contexto'])assert.match(page,new RegExp('data-game="'+game+'"'));
});
test('Calendário permite escolher somente a partir de 20/11/2026 até o dia atual',()=>{
 assert.match(page,/id="calendarToggle"/);
 assert.match(page,/id="calendarPopup"/);
 assert.match(page,/id="calendarDays"/);
 assert.doesNotMatch(page,/id="archiveDate"/);
 assert.match(script,/const ARCHIVE_START="2026-11-20"/);
 assert.match(script,/value>=ARCHIVE_START&&value<=dateBrazil\(\)/);
 assert.match(script,/function renderCalendar\(\)/);
 assert.match(script,/function selectArchiveDay\(/);
 assert.ok(page.indexOf('data-game="psico"')<page.indexOf('data-game="contexto"'));
 assert.ok(page.indexOf('data-game="contexto"')<page.indexOf('data-game="conexo"'));
 assert.ok(page.indexOf('data-game="conexo"')<page.indexOf('data-game="tetris"'));
});
test('Banco inicial tem somente respostas de cinco letras e sem duplicações',()=>{
 assert.ok(data.wordBank.length>=50);
 assert.ok(data.wordBank.every(w=>norm(w.word).length===5&&w.area&&w.hint));
 assert.equal(new Set(data.wordBank.map(w=>norm(w.word))).size,data.wordBank.length);
 assert.ok(data.connectionGroups.length>=20);
 assert.ok(data.semanticDomains.length>=8);
});
test('Scripts extras são sintaticamente válidos',()=>{
 assert.doesNotThrow(()=>new vm.Script(script));
 assert.doesNotThrow(()=>new vm.Script(wordSource));
});
function engine(){
 const expanded=script.replace(/\nstart\(\);\n\}\)\(\);\s*$/,
  '\nwindow.__extTest={init:initializeDay,getWord,wordColors,inputPsico,conexoSubmit,contextSubmit,renderPsico,renderConexo,renderContexto,rank:()=>contextRankings,target:()=>contextTarget,groups:()=>connectionGroups,tiles:()=>connectionTiles,terms:()=>contextTerms,states:()=>states,setActive:v=>{active=v;},setBank:v=>{psicoBank=v;},mark:tileMark,rankTerm:contextRankTerm,validArchiveDay};\n})();');
 assert.notEqual(expanded,script,'acesso de teste ao motor');
 const storage=new Map(),elements=new Map();
 const fakeElement=id=>{
  if(!elements.has(id))elements.set(id,{id,hidden:false,textContent:'',innerHTML:'',value:'',focus(){},blur(){},setAttribute(){},getAttribute(){return null;}});
  return elements.get(id);
 };
 const document={
  body:{scrollHeight:1200},documentElement:{scrollHeight:1200},getElementById:fakeElement,
  addEventListener(){},querySelectorAll(){return[];},querySelector(){return null;}
 };
 const window={PSICO_EXTRAS_DATA:data,addEventListener(){}};
 window.parent=window;
 const sandbox={window,document,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},console,Date,Intl,Math,URL,location:{href:'https://example.test/extras.html'},requestAnimationFrame(){}};
 vm.runInNewContext(expanded,sandbox,{filename:'extras-engine.js'});
 return window.__extTest;
}
test('Psico avalia letras repetidas e aceita palavra correta',()=>{
 const e=engine();e.init();e.setActive('psico');
 const answer=norm(e.getWord().word);
 for(const letter of answer)e.inputPsico(letter);
 e.inputPsico('ENTER');
 assert.equal(e.states().psico.won,true);
 assert.equal(e.states().psico.guesses.length,1);
 assert.equal(e.states().psico.guesses[0],answer);
 assert.equal(Array.from(e.wordColors('AAAAA','ABCDE')).filter(v=>v==='correct').length,1);
});
test('Conexo escolhe quatro grupos distintos e registra solução',()=>{
 const e=engine();e.init();e.setActive('conexo');
 assert.equal(e.groups().length,4);
 const tileTerms=e.tiles().map(t=>norm(t.word));
 assert.equal(new Set(tileTerms).size,16);
 e.states().conexo.selected=e.tiles().filter(t=>t.group===0).map(t=>t.id);
 e.conexoSubmit();
 assert.equal(e.states().conexo.solved.length,1);
 assert.equal(e.states().conexo.mistakes,0);
});
test('Contexto apresenta ranking semântico e aceita a palavra correta',()=>{
 const e=engine();e.init();e.setActive('contexto');
 assert.ok(e.terms().size>=100);
 assert.equal(e.rank().get(e.target()),1);
 e.contextSubmit(e.target());
 assert.equal(e.states().contexto.won,true);
 assert.equal(e.states().contexto.guesses.length,1);
});

test('VÍNCULO tem tentativas ilimitadas, não encerra por erros e permite marcação',()=>{
 const e=engine();e.init('2026-11-21');e.setActive('conexo');
 const tiles=e.tiles();
 assert.equal(tiles.length,16);
 const wrong=[...tiles.filter(t=>t.group===0).slice(0,3),tiles.find(t=>t.group===1)];
 for(let i=0;i<8;i++){
  e.states().conexo.selected=wrong.map(t=>t.id);
  e.conexoSubmit();
 }
 assert.equal(e.states().conexo.done,false,'errar não encerra a partida');
 assert.equal(e.states().conexo.solved.length,0);
 const id=e.tiles()[0].id;
 e.mark(id);
 assert.ok(e.states().conexo.marked.includes(id));
 e.mark(id);
 assert.ok(!e.states().conexo.marked.includes(id));
 assert.doesNotMatch(read('extras.js'),/Erros disponíveis:/);
 assert.match(read('extras.js'),/function conexoDragMove\(/);
 assert.match(read('extras.js'),/contextmenu/);
});
test('CONTEXTO aceita palpites livres, sem autocomplete e sem texto sobre 141 termos',()=>{
 const e=engine();e.init('2026-11-21');e.setActive('contexto');
 e.contextSubmit('uma palavra inventada que nao esta no dicionario');
 assert.equal(e.states().contexto.guesses.length,1);
 assert.equal(e.states().contexto.won,false);
 assert.ok(e.rankTerm('uma palavra inventada')>1);
 assert.doesNotMatch(page,/contextSuggest|<datalist/);
 assert.doesNotMatch(script,/ranking considera|termos cadastrados/i);
});
test('Dia inaugural preserva EXAME e as quatro conexões originais',()=>{
 const e=engine();e.init('2026-11-20');
 assert.equal(e.getWord().word,'EXAME');
 assert.deepEqual(Array.from(e.groups(),g=>Array.from(g.terms).join(' / ')),[
  'Testagem / Observação / Entrevistado / Relatório',
  'Coesão / Liderança / Normas / Papéis',
  'Hospitalar / Forense / Escolar / Organizacional',
  'Infância / Adolescência / Adultez / Velhice'
 ]);
});
