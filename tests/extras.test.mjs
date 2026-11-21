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

test('Extras segue o Caderno: celular bloqueado, tablet e PC liberados',()=>{
 assert.match(index,/function isExtrasPhone\(\)/,'detector do dispositivo no site');
 assert.match(index,/if\(page==='extras'&&isExtrasPhone\(\)\)return;/,'bloqueia cliques e rotas diretas');
 assert.match(index,/if\(current\.page==='extras'&&isExtrasPhone\(\)\)current\.page='home'/,'não mantém Extras ao renderizar no celular');
 assert.match(index,/extraButton\.disabled=phone/,'Extras realmente desativado');
 assert.match(index,/pm-extras-phone-locked/,'aparência igual ao Caderno');
 assert.match(script,/if\(isExtrasPhone\(\)\)\{showAuthError/,'proteção na página própria');
 const start=index.indexOf('function isExtrasPhone(){');
 const end=index.indexOf('const go=(page,extra={})=>{',start);
 assert.ok(start>0&&end>start);
 const source=index.slice(start,end);
 const fn=vm.runInNewContext('('+source.match(/function isExtrasPhone\(\)\{[\s\S]*?\n\}/)[0]+')');
 const check=(ua,platform,touches,width,height,mobile)=>fn.call(null);
 // The same detector is also exposed by the Caderno; verify its real implementation separately.
 const loader=read('site-version.js');
 const existing=loader.match(/function isNotebookPhone\(\)\{[\s\S]*?\n \}/);
 assert.ok(existing,'Caderno conserva a detecção de aparelho');
 for(const [ua,expected] of [
  ['Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile',true],
  ['Mozilla/5.0 (Linux; Android 14; Pixel 7) Mobile Safari/537.36',true],
  ['Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)',false],
  ['Mozilla/5.0 (Linux; Android 15; Tablet SM-X710) Safari/537.36',false],
  ['Mozilla/5.0 (Windows NT 10.0; Win64; x64)',false]
 ]){
  const actual=vm.runInNewContext('('+source.match(/function isExtrasPhone\(\)\{[\s\S]*?\n\}/)[0]+')()',{
   window:{},navigator:{userAgent:ua,platform:ua.includes('Windows')?'Win32':'Linux',maxTouchPoints:0},
   screen:{width:900,height:1440}
  });
  assert.equal(actual,expected,ua);
 }
});

test('Extras é acessível a contas conectadas, com TetrisZoul exclusivo de administradores',()=>{
 assert.match(index,/id="navExtrasGames"/);
 assert.doesNotMatch(index,/id="navExtrasSoon"/);
 assert.ok(index.indexOf('id="navExtrasGames"')<index.indexOf('id="navAdminConfig"'));
 assert.match(index,/case 'extras':body='<div class="psico-extras-embed">/);
 assert.match(page,/id="extrasGate"/);
 assert.match(script,/isAdmin=!role\?\.error&&role\?\.data===true/);
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
 assert.ok(data.wordBank.length>=220);
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
  '\nwindow.__extTest={init:initializeDay,getWord,wordColors,inputPsico,conexoSubmit,contextSubmit,renderPsico,renderConexo,renderContexto,rank:()=>contextRankings,target:()=>contextTarget,groups:()=>connectionGroups,tiles:()=>connectionTiles,terms:()=>contextTerms,states:()=>states,setActive:v=>{active=v;},setBank:v=>{psicoBank=v;},setPsicoMode,getPsicoWords,psicoState,getAdminAnswersFor,getPsicoWordsFor,getPsicoDayWordsFor,psicoDeck:()=>PSICO_ANSWER_DECK,classicCore:()=>PSICO_CLASSIC_CORE,showAdminAnswers:()=>{adminAnswersOpen=true;updateAdminAnswers();},setAdmin:v=>{isAdmin=v;},node:document.getElementById,config:()=>PSICO_MODES[psicoMode],html:()=>document.getElementById("gameHost").innerHTML,mark:tileMark,rankTerm:contextRankTerm,targets:()=>TARGETS,near:()=>NEAR,wordValid:isContextWord,reinitContexto:initContexto,feedback:()=>feedback,validArchiveDay,dragStart:conexoDragStart,dragMove:conexoDragMove,dragEnd:conexoDragEnd,allow:()=>{approved=true;}};\n})();');
 assert.notEqual(expanded,script,'acesso de teste ao motor');
 const storage=new Map(),elements=new Map();
 const fakeElement=id=>{
  if(!elements.has(id))elements.set(id,{id,hidden:false,textContent:'',innerHTML:'',value:'',focus(){},blur(){},setAttribute(){},getAttribute(){return null;}});
  return elements.get(id);
 };
 const document={
  body:{scrollHeight:1200,appendChild(){}},documentElement:{scrollHeight:1200},getElementById:fakeElement,
  addEventListener(){},querySelectorAll(){return[];},querySelector(){return null;}
 };
 const window={PSICO_EXTRAS_DATA:data,addEventListener(){}};
 window.parent=window;
 const sandbox={window,document,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},console,Date,Intl,Math,URL,location:{href:'https://example.test/extras.html'},requestAnimationFrame(){},setTimeout,clearTimeout};
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

test('Psico Duplo usa dois tabuleiros independentes, com sete palpites compartilhados',()=>{
 const e=engine();e.init('2026-11-21');e.setActive('psico');e.allow();e.setPsicoMode('duplo');
 const words=Array.from(e.getPsicoWords(),w=>norm(w.word));
 assert.equal(words.length,2);
 assert.equal(new Set(words).size,2);
 assert.equal(e.config().attempts,7);
 assert.equal((e.html().match(/class="psico-board-column/g)||[]).length,2);
 for(const letter of words[0])e.inputPsico(letter);
 e.inputPsico('ENTER');
 assert.equal(e.psicoState().guesses.length,1);
 assert.equal(e.psicoState().solvedAt[0],1);
 assert.equal(e.psicoState().solvedAt[1],0);
 assert.equal(e.psicoState().done,false);
 assert.match(e.html(),/psico-board-solved/);
 for(const letter of words[1])e.inputPsico(letter);
 e.inputPsico('ENTER');
 assert.equal(e.psicoState().won,true);
 assert.equal(e.psicoState().done,true);
 assert.equal(e.psicoState().guesses.length,2);
});
test('Psico Quádruplo usa quatro grades, nove tentativas e termina somente ao resolver tudo ou esgotar chances',()=>{
 const e=engine();e.init('2026-11-21');e.setActive('psico');e.allow();e.setPsicoMode('quadruplo');
 assert.equal(e.config().attempts,9);
 assert.equal(e.getPsicoWords().length,4);
 assert.equal(new Set(e.getPsicoWords().map(x=>norm(x.word))).size,4);
 assert.equal((e.html().match(/class="psico-board-column/g)||[]).length,4);
 for(let i=0;i<9;i++){e.inputPsico('ZZZZZ');e.inputPsico('ENTER');}
 assert.equal(e.psicoState().guesses.length,9);
 assert.equal(e.psicoState().done,true);
 assert.equal(e.psicoState().won,false);
 assert.match(e.html(),/Respostas:/);
});
test('Trocar de modo não remove o progresso anterior do PSICO clássico',()=>{
 const e=engine();e.init('2026-11-21');e.setActive('psico');e.allow();
 const answer=norm(e.getWord().word);
 e.inputPsico('ZZZZZ');e.inputPsico('ENTER');
 assert.equal(e.states().psico.guesses.length,1);
 e.setPsicoMode('duplo');
 e.inputPsico('ZZZZZ');e.inputPsico('ENTER');
 assert.equal(e.states().psico.variants.duplo.guesses.length,1);
 e.setPsicoMode('quadruplo');
 assert.equal(e.psicoState().guesses.length,0);
 e.setPsicoMode('classico');
 assert.equal(e.states().psico.guesses.length,1);
 assert.notEqual(answer,'ZZZZZ');
});


test('Quadruplo de desktop ocupa quatro colunas e mantém versão responsiva',()=>{
 const styles=read('extras.css');
 assert.match(styles,/\.psico-multi-grid\.psico-multi-quadruplo\{max-width:1530px\}/);
 assert.match(styles,/@media\(min-width:840px\)\s*\{\s*\.psico-multi-grid\.psico-multi-quadruplo\{grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
 assert.match(script,/psico-multi-'\+psicoMode/);
 assert.match(script,/installExtrasWideHost\(\)/);
 assert.doesNotMatch(script,/body:has\(#psicoExtrasFrame\):not\(\.pm-extras-sidebar-open\) #siteSidebar/);
 assert.doesNotMatch(script,/button=doc\.createElement\("button"\)/);
 assert.match(script,/doc\.getElementById\("pmExtrasSidebarToggle"\)\?\.remove\(\)/);
 assert.match(script,/body:has\(#psicoExtrasFrame\) \.app>\.main/);
});
test('PSICO respeita a agenda de Psicologia sem duplicar respostas e preserva 21/11',()=>{
 const e=engine();
 const calendar={
 "2026-11-22": [
  "GRUPO",
  "PAPEL",
  "NORMA",
  "LÍDER",
  "COESO",
  "PODER",
  "LAÇOS"
 ],
 "2026-11-23": [
  "LAUDO",
  "TESTE",
  "EXAME",
  "TRAÇO",
  "HUMOR",
  "DADOS",
  "SINAL"
 ],
 "2026-11-24": [
  "ÉTICA",
  "MORAL",
  "CULPA",
  "JUÍZO",
  "IDEAL",
  "ABUSO",
  "RISCO"
 ],
 "2026-11-25": [
  "MANIA",
  "FOBIA",
  "VÍCIO",
  "SURTO",
  "ÂNSIA",
  "CRISE",
  "RAIVA"
 ],
 "2026-11-26": [
  "ÉDIPO",
  "FREUD",
  "LAPSO",
  "LACAN",
  "KLEIN",
  "ADLER",
  "SONHO"
 ],
 "2026-11-27": [
  "AROMA",
  "VISÃO",
  "TÁTIL",
  "SABOR",
  "OLHAR",
  "OUVIR",
  "FOCAR"
 ]
};
 for(const [date,words] of Object.entries(calendar)){
  assert.deepEqual(Array.from(e.getPsicoDayWordsFor(date),item=>norm(item.word)),words.map(norm),date);
 }
 assert.deepEqual(Array.from(e.getPsicoDayWordsFor('2026-11-21'),item=>norm(item.word)),
  ['PAVOR','NETOS','FATOR','FALHA','REDES','GRITO','VIVER']);
 assert.deepEqual(Array.from(e.getPsicoDayWordsFor('2026-11-20'),item=>norm(item.word)),
  ['EXAME','LAUDO','CAUSA','GANHO','NOÇÃO','MEDOS','RITMO'].map(norm));
 const deck=Array.from(e.psicoDeck(),item=>norm(item.word));
 assert.equal(new Set(deck).size,deck.length,'respostas editoriais não podem gerar repetição no baralho');
});

test('Respostas da data selecionada correspondem aos desafios reais nos três jogos',()=>{
 const e=engine();
 for(const date of ['2026-11-20','2026-11-21','2026-11-27']){
  e.init(date);e.setActive('psico');e.allow();
  assert.equal(e.getAdminAnswersFor(date,'psico','classico')[0],e.getWord().word);
  for(const mode of ['duplo','quadruplo']){
   e.setPsicoMode(mode);
   assert.deepEqual(Array.from(e.getAdminAnswersFor(date,'psico',mode)),Array.from(e.getPsicoWords(),x=>x.word));
  }
  assert.equal(e.getAdminAnswersFor(date,'contexto')[0],e.target());
  assert.deepEqual(Array.from(e.getAdminAnswersFor(date,'conexo'),x=>x.title),Array.from(e.groups(),x=>x.title));
 }
});
test('Botão de revelar respostas é exclusivo de administradores e contextualizado por aba',()=>{
 const e=engine();e.init('2026-11-20');e.setActive('psico');e.allow();
 assert.match(page,/id="adminAnswersToggle"[^>]*hidden/);
 assert.match(page,/id="adminAnswersPanel"[^>]*hidden/);
 e.setAdmin(false);e.showAdminAnswers();
 assert.equal(e.node('adminAnswersToggle').hidden,true);
 assert.equal(e.node('adminAnswersPanel').hidden,true);
 e.setAdmin(true);e.showAdminAnswers();
 assert.equal(e.node('adminAnswersToggle').hidden,false);
 assert.equal(e.node('adminAnswersPanel').hidden,false);
 assert.match(e.node('adminAnswersPanel').innerHTML,/PSICO Clássico/);
 assert.equal((e.node('adminAnswersPanel').innerHTML.match(/class="admin-answers-day"/g)||[]).length,1);
 e.setActive('conexo');e.showAdminAnswers();
 assert.match(e.node('adminAnswersPanel').innerHTML,/VÍNCULO/);
 assert.match(e.node('adminAnswersPanel').innerHTML,/admin-answers-groups/);
 e.setActive('contexto');e.showAdminAnswers();
 assert.match(e.node('adminAnswersPanel').innerHTML,/CONTEXTO/);
});

test('PSICO apresenta nome centralizado acima dos modos e mantém o contador separado',()=>{
 const styles=read('extras.css');
 assert.match(script,/class="psico-game-heading"><h2 class="psico-wordmark">PSICO<\/h2><\/div>/);
 assert.match(styles,/\.psico-game-heading\{display:flex;align-items:center;justify-content:center/);
 assert.match(styles,/\.psico-wordmark\{/);
 const e=engine();e.init('2026-11-20');e.setActive('psico');e.allow();e.renderPsico();
 const markup=e.html(),word=markup.indexOf('class="psico-wordmark"'),modes=markup.indexOf('class="psico-mode-switch"');
 assert.ok(word>=0&&modes>word,'o logo fica acima das abas');
 assert.match(markup,/class="psico-mode-status"/);
});
test('Revelar respostas mostra apenas a data selecionada, nunca dias futuros',()=>{
 const e=engine();e.init('2026-11-21');e.setActive('psico');e.allow();e.setAdmin(true);e.showAdminAnswers();
 const markup=e.node('adminAnswersPanel').innerHTML;
 assert.equal((markup.match(/class="admin-answers-day"/g)||[]).length,1);
 assert.match(markup,/21 de nov/);
 assert.doesNotMatch(markup,/22 de nov|23 de nov|próximos 7 dias/i);
 for(const mode of ['duplo','quadruplo']){
  e.setPsicoMode(mode);e.showAdminAnswers();
  assert.equal((e.node('adminAnswersPanel').innerHTML.match(/class="admin-answers-day"/g)||[]).length,1);
  assert.equal((e.node('adminAnswersPanel').innerHTML.match(/class="admin-answers-words"/g)||[]).length,1);
 }
 for(const game of ['conexo','contexto']){
  e.setActive(game);e.showAdminAnswers();
  assert.equal((e.node('adminAnswersPanel').innerHTML.match(/class="admin-answers-day"/g)||[]).length,1);
 }
});

test('Respostas do Psico mantêm sete palavras diferentes entre três modos por pelo menos 35 dias',()=>{
 const e=engine(),all=new Set();
 const dateAt=offset=>new Date(Date.parse('2026-11-21T12:00:00Z')+offset*86400000).toISOString().slice(0,10);
 assert.ok(e.psicoDeck().length>=245);
 for(let n=0;n<35;n++){
  const day=dateAt(n);
  const classic=e.getPsicoWordsFor(day,'classico').map(x=>norm(x.word));
  const duplo=e.getPsicoWordsFor(day,'duplo').map(x=>norm(x.word));
  const quadruplo=e.getPsicoWordsFor(day,'quadruplo').map(x=>norm(x.word));
  const words=[...classic,...duplo,...quadruplo];
  assert.equal(words.length,7,day+' precisa ter sete soluções');
  assert.equal(new Set(words).size,7,day+' contém resposta repetida entre modos');
  for(const word of words){
   assert.ok(!all.has(word),day+' repete '+word+' de dia anterior');
   all.add(word);
  }
  if(n<30)assert.ok(e.classicCore().has(classic[0]),day+' prioriza tema psicológico no clássico');
 }
 assert.equal(all.size,245);
});
test('Desafio inaugural permanece intacto e novos termos são reais e ligados à Psicologia',()=>{
 const e=engine();
 assert.deepEqual(Array.from(e.getPsicoWordsFor('2026-11-20','classico'),x=>norm(x.word)),['EXAME']);
 assert.deepEqual(Array.from(e.getPsicoWordsFor('2026-11-20','duplo'),x=>norm(x.word)),['LAUDO','CAUSA']);
 assert.deepEqual(Array.from(e.getPsicoWordsFor('2026-11-20','quadruplo'),x=>norm(x.word)),['GANHO','NOCAO','MEDOS','RITMO']);
 const needed=['ÂNIMO','ÂNSIA','MÁGOA','CIÚME','SUSTO','PAVOR','LAPSO','VISÃO','LÍDER','ABUSO','SURTO','MÉDIA'];
 for(const word of needed)assert.ok(data.wordBank.some(x=>norm(x.word)===norm(word)),word+' deve existir');
 assert.ok(data.wordBank.every(x=>norm(x.word).length===5&&x.area&&x.hint));
 assert.equal(new Set(data.wordBank.map(x=>norm(x.word))).size,data.wordBank.length);
 assert.match(page,/extras-data\.js\?v=20261120-context-oneword-v1/);
});

test('Conexo escolhe quatro grupos distintos e registra solução',()=>{
 const e=engine();e.init();e.setActive('conexo');
 assert.equal(e.groups().length,4);
 const tileTerms=e.tiles().map(t=>norm(t.word));
 assert.equal(new Set(tileTerms).size,16);
 e.states().conexo.selected=e.tiles().filter(t=>t.group===0).map(t=>t.id);
 e.conexoSubmit();
 assert.equal(e.states().conexo.solved.length,1);
 assert.deepEqual(Array.from(e.states().conexo.wrong),[]);
});
test('Contexto apresenta ranking semântico e aceita a palavra correta',()=>{
 const e=engine();e.init();e.setActive('contexto');
 assert.ok(e.terms().size>=100);
 assert.equal(e.rank().get(e.target()),1);
 e.contextSubmit(e.target());
 assert.equal(e.states().contexto.won,true);
 assert.equal(e.states().contexto.guesses.length,1);
});

test('CONTEXTO colore barrinhas gradualmente do vermelho ao amarelo e verde pelo ranking',()=>{
 const e=engine();e.init('2026-11-21');e.setActive('contexto');
 const ranked=Array.from(e.rank()).sort((a,b)=>a[1]-b[1]);
 assert.ok(ranked.length>100,'ranking semântico com gradação suficiente');
 const ranks=[1,Math.floor(ranked.length/5),Math.floor(ranked.length/2),ranked.length];
 e.states().contexto.guesses=ranks.map(rank=>({word:ranked[rank-1][0]}));
 e.renderContexto();
 const markup=e.html();
 const colored=Array.from(markup.matchAll(/class="context-fill" style="width:([0-9]+)%;--context-hue:([0-9]+)"/g),
  m=>({width:Number(m[1]),hue:Number(m[2])}));
 assert.equal(colored.length,4,'uma barra colorida por tentativa');
 assert.ok(colored.every((row,i)=>i===0||colored[i-1].width>=row.width),
  'barras devem encolher quanto mais distante estiver a palavra');
 assert.ok(colored.every((row,i)=>i===0||colored[i-1].hue>=row.hue),
  'cores devem progredir sem saltos invertidos');
 assert.equal(colored[0].hue,120,'resposta correta verde');
 assert.ok(colored.at(-1).hue<45,'termos distantes em vermelho ou vermelho-alaranjado');
 assert.ok(colored.some(row=>row.hue>=45&&row.hue<=80),'intervalo intermediário amarelo');
 const styles=read('extras.css');
 assert.ok(styles.includes('background:hsl(var(--context-hue,0) 82% 43% / .64)'));
 assert.ok(styles.includes(':root[data-theme=dark] .context-guess .context-fill'));
 assert.ok(!styles.includes('.context-guess.far .context-fill'));
 assert.ok(!styles.includes('.context-guess.mid .context-fill'));
 assert.ok(!styles.includes('.context-guess.hot .context-fill'));
});

test('CONTEXTO rejeita expressões com duas ou mais palavras sem atribuir ranking',()=>{
 const e=engine();e.init('2026-11-20');e.setActive('contexto');
 for(const phrase of ['redes sociais','saúde mental','ciclo vital','qualidade de vida','terapia do esquema','apoio social','redes-sociais','duas    palavras','rede2']){
  const count=e.states().contexto.guesses.length;
  assert.equal(e.wordValid(phrase),false,phrase);
  assert.equal(e.rankTerm(phrase),Infinity,'não classificar '+phrase);
  e.contextSubmit(phrase);
  assert.equal(e.states().contexto.guesses.length,count,'não registrar '+phrase);
  assert.equal(e.feedback().kind,'error','mostrar erro para '+phrase);
 }
 assert.match(e.feedback().message,/apenas uma palavra/i);
 e.contextSubmit('atenção');
 assert.equal(e.states().contexto.guesses.length,1,'palavra acentuada válida continua permitida');
 assert.equal(e.wordValid('pulsão'),true);
 assert.equal(e.wordValid('redes'),true);
 assert.ok(e.rankTerm('redes')>=1,'uma palavra válida recebe ranking');
});

test('CONTEXTO não possui expressões nem nas respostas diárias nem no dicionário semântico',()=>{
 const e=engine();e.init('2026-11-20');
 assert.equal(e.targets().length,89,'preserva a quantidade e a rotação das respostas');
 assert.ok(e.targets().every(e.wordValid),'todas as respostas têm somente uma palavra');
 assert.ok(data.semanticDomains.every(domain=>domain.terms.every(e.wordValid)),
  'todos os termos editoriais cadastrados são palavras únicas');
 assert.ok(Object.entries(e.near()).every(([term,related])=>e.wordValid(term)&&related.every(e.wordValid)),
  'todas as relações semânticas próximas usam palavras únicas');
 assert.ok(!e.terms().has('REDES SOCIAIS'),'o antigo palpite #4 não existe mais');
 assert.ok(e.terms().has('REDES'),'termo simples substitui a expressão');
 assert.equal(e.target(),'POLARIZACAO','preserva resposta inaugural do jogo');
 // O cálculo de datas circula por todas as 89 respostas (11 e 89 são coprimos).
 for(let i=0;i<89;i++){
  const day=new Date(Date.UTC(2026,10,20+i)).toISOString().slice(0,10);
  e.init(day);
  assert.ok(e.wordValid(e.target()),'resposta composta no dia '+day);
  assert.ok(e.terms().has(e.target()),'resposta inexistente no dia '+day);
 }
});

test('CONTEXTO limpa palpites compostos antigos sem perder palavras válidas nem dica',()=>{
 const e=engine();e.init('2026-11-20');
 const st=e.states().contexto;st.hint=true;
 st.guesses=[{word:'redes sociais'},{word:'ALGORITMO'},{word:'ciclo vital'},{word:'algoritmo'},{word:'atenção'}];
 st.done=true;st.won=true;
 e.reinitContexto();
 assert.deepEqual(Array.from(st.guesses,g=>g.word),['ALGORITMO','atenção']);
 assert.equal(st.won,false,'vitória inválida deve ser desfeita');
 assert.equal(st.done,false);
 assert.equal(st.hint,true,'progresso válido permanece preservado');
 e.renderContexto();
 assert.doesNotMatch(e.html(),/redes sociais|ciclo vital/i);
 assert.match(e.html(),/algoritmo/i);
 assert.match(e.html(),/atencao/i); // O índice normaliza acentos, como já fazia antes.
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
test('CONTEXTO aceita palavras individuais desconhecidas, sem autocomplete',()=>{
 const e=engine();e.init('2026-11-21');e.setActive('contexto');
 e.contextSubmit('inexistencialidade');
 assert.equal(e.states().contexto.guesses.length,1);
 assert.equal(e.states().contexto.won,false);
 assert.ok(e.rankTerm('inexistencialidade')>1);
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

test('Interface enxuta: sem textos internos de desenvolvimento ou explicações redundantes',()=>{
 assert.doesNotMatch(page,/Desafios a partir de 20\/11\/2026|um novo desafio por dia/i);
 assert.doesNotMatch(page,/Acesso antecipado|Progresso individual por dia/);
 assert.doesNotMatch(script,/Cores:<\/b>|Tenta “memória”|ranking considera|141 termos cadastrados/i);
 assert.doesNotMatch(script,/Tente descobrir um termo da Psicologia|Toque numa letra para editá-la/);
});
test('Arraste do VÍNCULO reordena peças em tempo real, com captura de ponteiro no grid',()=>{
 const e=engine();e.init('2026-11-21');e.setActive('conexo');e.allow();
 const cls=()=>{const flags=new Set(['conexo-tile']);return {
  add:v=>flags.add(v),remove:v=>flags.delete(v),contains:v=>flags.has(v)
 }};
 const grid={tiles:[],pointer:null,classList:cls(),querySelectorAll(){return this.tiles},
  getBoundingClientRect(){return {left:0,right:400,top:0,bottom:400}},
  setPointerCapture(id){this.pointer=id},hasPointerCapture(id){return this.pointer===id},
  releasePointerCapture(){this.pointer=null},
  insertBefore(el,ref){
   this.tiles.splice(this.tiles.indexOf(el),1);
   const pos=ref?this.tiles.indexOf(ref):this.tiles.length;
   this.tiles.splice(pos<0?this.tiles.length:pos,0,el);
  }};
 for(const word of e.tiles()){
  const tile={dataset:{tile:word.id},classList:cls(),style:{},
   closest:selector=>selector.includes('conexo-grid')?grid:tile,
   getBoundingClientRect(){
    const i=grid.tiles.indexOf(tile),left=i%4*100,top=Math.floor(i/4)*100;
    return {left,top,width:90,height:90,right:left+90,bottom:top+90};
   },
   cloneNode(){return {
    style:{},classList:cls(),removeAttribute(){},setAttribute(){},remove(){}
   }},
   getAnimations(){return []},animate(){}};
  Object.defineProperty(tile,'nextElementSibling',{get(){return grid.tiles[grid.tiles.indexOf(tile)+1]||null}});
  grid.tiles.push(tile);
 }
 const tile=grid.tiles[0],id=tile.dataset.tile;
 e.dragStart({target:tile,button:0,pointerId:8,clientX:45,clientY:45});
 e.dragMove({pointerId:8,clientX:345,clientY:345,cancelable:true,preventDefault(){}});
 assert.equal(grid.pointer,8,'o grid captura o movimento mesmo quando a peça sai da posição original');
 assert.equal(grid.tiles[15],tile,'peça vai para o quadrado mais próximo do cursor');
 e.dragEnd({pointerId:8});
 assert.equal(grid.pointer,null,'ponteiro liberado ao soltar');
 assert.equal(e.states().conexo.shuffled[15],id,'nova ordem persiste');
 assert.equal(e.states().conexo.selected.length,0,'arrastar não seleciona a palavra');
});

test('Extras reutiliza autenticação do site e não cria outra sessão dentro do iframe',()=>{
 assert.match(script,/function hostLogin\(\)/);
 assert.match(script,/window\.parent\.uentzoulAIAuth/);
 assert.match(script,/client=host\.client/);
 assert.match(script,/uid=linked\.id/);
 assert.match(script,/client=await loadStandaloneClient\(\)/,'acesso isolado continua disponível');
 assert.match(script,/event==="SIGNED_OUT"/);
 assert.doesNotMatch(page,/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase/);
 assert.match(page,/class="extras-booting"/);
 assert.match(script,/document\.documentElement\.classList\.remove\("extras-booting"\)/);
});
test('Extras não interrompe a abertura aguardando consulta de permissões ou progresso',()=>{
 const s=script.slice(script.indexOf('async function start(){'),script.indexOf('document.addEventListener("click"',script.indexOf('async function start(){')));
 assert.ok(s.indexOf('approved=true')<s.indexOf('client.rpc("uentzoul_is_admin")'));
 assert.ok(s.indexOf('switchGame(initial)')<s.indexOf('loadCloud(enteredDay)'));
 assert.match(s,/if\(event==="SIGNED_OUT"\)/,'sem tratar INITIAL_SESSION como logout');
});

test('Iframe de conta autenticada abre Extras imediatamente com sessão do site, sem outra janela de login',async()=>{
 const expanded=script.replace(/\nstart\(\);\n\}\)\(\);\s*$/,
  '\nwindow.__authHarness={start,approved:()=>approved,client:()=>client,isAdmin:()=>isAdmin,uid:()=>uid};\n})();');
 assert.notEqual(expanded,script);
 let madeClient=0,requestedUser=0,resolveRole,authListener;
 const rolePromise=new Promise(resolve=>{resolveRole=resolve});
 const shared={
  auth:{
   getUser:async()=>{requestedUser++;return {data:{user:null}}},
   onAuthStateChange(fn){authListener=fn;return {data:{subscription:{unsubscribe(){}}}};}
  },
  // Retorno Supabase PostgrestBuilder: thenable sem metodo .catch.
  rpc:()=>({then:(resolve,reject)=>rolePromise.then(resolve,reject)}),
  from:()=>({select:()=>({eq(){return this},order(){return this},limit:async()=>({data:[],error:null})})})
 };
 const els=new Map();
 const node=id=>{
  if(!els.has(id))els.set(id,{id,hidden:id==='extrasApp',textContent:'',innerHTML:'',disabled:false,
   classList:{remove(){}},setAttribute(){},focus(){}});
  return els.get(id);
 };
 const doc={
  documentElement:{dataset:{},classList:{remove(){}},scrollHeight:900},
  body:{scrollHeight:900},getElementById:node,
  querySelector:s=>s==='.extras-tabs'?{classList:{toggle(){}}}:null,
  querySelectorAll:()=>[],addEventListener(){}
 };
 const url='https://example.test';
 const parent={
  location:{origin:url},document:{documentElement:{dataset:{theme:'dark'}}},
  uentzoulAIAuth:{user:()=>({id:'conta-logada'}),client:()=>shared,getSession:async()=>null},
  postMessage(){}
 };
 const win={parent,PSICO_EXTRAS_DATA:data,addEventListener(){},
  supabase:{createClient(){madeClient++;throw Error('cliente duplicado')}}};
 const storage=new Map();
 const sandbox={
  window:win,document:doc,console,Date,Intl,URL,Math,
  localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
  location:{origin:url,href:url+'/extras.html'},history:{replaceState(){}},
  requestAnimationFrame(){},setTimeout,clearTimeout
 };
 vm.runInNewContext(expanded,sandbox,{filename:'extras-auth-harness.js'});
 const loading=win.__authHarness.start();
 assert.equal(win.__authHarness.approved(),true,'app aberta antes de esperar permissão e banco');
 assert.equal(node('extrasApp').hidden,false,'jogos visíveis sem tela de login');
 assert.equal(node('extrasGate').hidden,true,'nenhum painel branco de login');
 assert.equal(win.__authHarness.client(),shared,'mesmo cliente do site');
 assert.equal(win.__authHarness.uid(),'conta-logada');
 assert.equal(madeClient,0,'não inicia outro Supabase');
 assert.equal(requestedUser,0,'não consulta getUser de outra instância');
 assert.equal(doc.documentElement.dataset.theme,'dark','tema herdado antes de mostrar a interface');
 authListener?.('INITIAL_SESSION',null);
 assert.equal(node('extrasApp').hidden,false,'evento inicial sem payload não é logout');
 resolveRole({data:true,error:null});
 await loading;
 assert.equal(win.__authHarness.isAdmin(),true);
 assert.equal(node('extrasApp').hidden,false,'RPC thenable não fecha a tela dos jogos');
 assert.equal(node('extrasGate').hidden,true,'RPC thenable não mostra painel de erro');
});
