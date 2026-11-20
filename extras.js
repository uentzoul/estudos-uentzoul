/* Extras PsicoMoodle — jogos originais de estudo, com acesso administrativo e progresso diário. */
(function(){
"use strict";
const SB_URL="https://swseibmqoetnuctxyusj.supabase.co";
const SB_KEY="sb_publishable_Fa12C_gaam8nv3g4fsWy2w_8nWQZWzq";
const DATA=window.PSICO_EXTRAS_DATA;
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clean=s=>String(s??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().trim();
const cleanTerm=s=>clean(s).replace(/\s+/g," ");
const GAMES=["tetris","psico","conexo","contexto"];
const CONTENT_GAMES=["psico","conexo","contexto"];
const TARGETS=["memoria","empatia","recalque","familia","laudo","lideranca","ideologia","esquema","apego","pulsao","atencao","divorcio","polarizacao","inconsciente","cuidado","congruencia","reforco","ciclo vital","escuta","pensamento","normas","diagnostico","libertacao","preconceito","aprendizagem","avaliacao","cooperacao","desejo","comportamento","democracia"];
const NEAR={
 memoria:["atencao","percepcao","aprendizagem","linguagem"],
 empatia:["compreensao","escuta","aceitacao","rogers","consideracao positiva"],
 recalque:["inconsciente","defesa","desejo","pulsao","conflito"],
 familia:["casal","parentalidade","filho","apego","vinculo","cuidado"],
 laudo:["parecer","documento","avaliacao","diagnostico","anamnese"],
 lideranca:["grupo","coesao","papeis","normas","cooperacao"],
 ideologia:["fatalismo","poder","cultura","sociedade","alienacao"],
 esquema:["crenca","pensamento","terapia do esquema","abandono","vergonha"],
 apego:["vinculo","familia","parentalidade","infancia","cuidado"],
 pulsao:["libido","desejo","inconsciente","recalque","id"],
 atencao:["memoria","percepcao","cognicao","linguagem"],
 divorcio:["separacao","casal","guarda","recasamento","familia"],
 polarizacao:["algoritmo","vies","redes sociais","midia","opiniao"],
 inconsciente:["recalque","sonho","desejo","id","freud"],
 cuidado:["familia","acolhimento","escuta","parentalidade"],
 congruencia:["autenticidade","rogers","empatia","pessoa"],
 reforco:["comportamento","resposta","estimulo","punicao"],
 "ciclo vital":["infancia","adolescencia","adultez","velhice"],
 escuta:["empatia","entrevista","pessoa","acolhimento"],
 pensamento:["cognicao","crenca","esquema","interpretacao"],
 normas:["grupo","papeis","conformidade","sociedade"],
 diagnostico:["avaliacao","laudo","entrevista","testes"],
 libertacao:["fatalismo","ideologia","democracia","poder"],
 preconceito:["discriminacao","desigualdade","exclusao","sociedade"],
 aprendizagem:["condicionamento","reforco","habito","memoria"],
 avaliacao:["laudo","entrevista","testes","devolutiva"],
 cooperacao:["grupo","coletivo","comunicacao","mediacao"],
 desejo:["pulsao","inconsciente","sonho","libido"],
 comportamento:["resposta","estimulo","reforco","aprendizagem"],
 democracia:["libertacao","poder","desigualdade","sociedade"]
};
let client=null,uid=null,approved=false,day="",ordinal=0,active="tetris",states={};
let psicoBank=DATA.wordBank.slice().sort((a,b)=>clean(a.word).localeCompare(clean(b.word),"pt-BR"));
let connectionGroups=[],connectionTiles=[],contextTerms=new Map(),contextRankings=null,contextTarget="";
const persistTimers=Object.create(null),persistPromises=Object.create(null);
let feedback={game:"",message:"",kind:""};
let authBusy=false;
function dateBrazil(){
 const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
 const v=Object.fromEntries(parts.map(p=>[p.type,p.value]));
 return v.year+"-"+v.month+"-"+v.day;
}
function dayNumber(d){return Math.floor(Date.parse(d+"T12:00:00Z")/86400000);}
function seedRandom(seed){
 let a=(seed>>>0)||1;
 return ()=>{a^=a<<13;a^=a>>>17;a^=a<<5;return (a>>>0)/4294967296;};
}
function shuffle(a,seed){
 const arr=a.slice(),rand=seedRandom(seed);
 for(let i=arr.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}
 return arr;
}
function getWord(){
 const list=psicoBank;
 return list[((ordinal*17+23)%list.length+list.length)%list.length];
}
function gameStateDefault(game){
 return game==="psico"?{guesses:[],draft:"",done:false,won:false}:
 game==="conexo"?{solved:[],mistakes:0,selected:[],wrong:[],shuffled:[],done:false,won:false}:
 {guesses:[],hint:false,done:false,won:false};
}
function localKey(game){return "psicomoodle-extras-v1:"+uid+":"+day+":"+game;}
function localGet(game){try{const v=JSON.parse(localStorage.getItem(localKey(game)));return v&&typeof v==="object"?v:null;}catch(_){return null;}}
function localSet(game){try{localStorage.setItem(localKey(game),JSON.stringify(states[game]));}catch(_){}}
function initializeDay(){
 day=dateBrazil();ordinal=dayNumber(day);
 $("dayLabel").textContent=new Intl.DateTimeFormat("pt-BR",{timeZone:"America/Sao_Paulo",day:"2-digit",month:"short",year:"numeric"}).format(new Date(day+"T12:00:00Z"));
 for(const game of CONTENT_GAMES)states[game]=localGet(game)||gameStateDefault(game);
 initConnections();initContexto();
}
async function loadWordBank(){
 try{
  const {data,error}=await client.from("uentzoul_extras_word_bank")
    .select("word,course_area,hint").eq("enabled",true).order("word").limit(500);
  if(error)throw error;
  const valid=(data||[]).filter(x=>clean(x.word).length===5);
  if(valid.length>=20)psicoBank=valid.map(x=>({word:x.word,area:x.course_area,hint:x.hint}));
 }catch(e){console.warn("Extras: usando banco de palavras local.",e?.message||e);}
}
async function loadCloud(){
 try{
  const res=await client.from("uentzoul_extras_progress").select("game,state,updated_at").eq("user_id",uid).eq("challenge_day",day).limit(3);
  if(res.error)throw res.error;
  for(const row of res.data||[]){
   if(!CONTENT_GAMES.includes(row.game)||!row.state||typeof row.state!=="object")continue;
   const local=states[row.game];
   const localTime=Number(local?._savedAt)||0,remoteTime=Number(row.state._savedAt)||Date.parse(row.updated_at)||0;
   if(remoteTime>=localTime){states[row.game]=row.state;localSet(row.game);}
   else scheduleCloud(row.game);
  }
 }catch(e){
  console.warn("Extras: leitura de progresso indisponível.",e?.message||e);
 }
}
function store(game,remote=true){
 if(!CONTENT_GAMES.includes(game))return;
 states[game]._savedAt=Date.now();
 localSet(game);
 if(remote)scheduleCloud(game);
}
function scheduleCloud(game){
 if(!approved||!uid||!client)return;
 clearTimeout(persistTimers[game]);
 persistTimers[game]=setTimeout(()=>{void flushCloud(game);},380);
}
function flushCloud(game){
 if(!approved||!uid||!client)return Promise.resolve();
 const previous=persistPromises[game]||Promise.resolve();
 persistPromises[game]=previous.catch(()=>{}).then(async()=>{
  const snapshot=JSON.parse(JSON.stringify(states[game]));
  const {error}=await client.from("uentzoul_extras_progress").upsert({
   user_id:uid,game,challenge_day:day,state:snapshot,updated_at:new Date().toISOString()
  },{onConflict:"user_id,game,challenge_day"});
  if(error){console.warn("Extras: sincronização adiada.",error.message);return;}
  if(states[game]._savedAt!==snapshot._savedAt)scheduleCloud(game);
 });
 return persistPromises[game];
}
function feedbackHtml(game){
 if(feedback.game!==game||!feedback.message)return '<p class="feedback" role="status"></p>';
 return '<p class="feedback '+esc(feedback.kind)+'" role="status">'+esc(feedback.message)+'</p>';
}
function setFeedback(game,message,kind=""){
 feedback={game,message,kind};
 const el=document.querySelector(".feedback");
 if(el&&game===active){el.className="feedback "+kind;el.textContent=message;}
}
function renderTabs(){
 document.querySelectorAll("[data-game]").forEach(b=>b.setAttribute("aria-selected",String(b.dataset.game===active)));
}
function switchGame(game){
 if(!approved||!GAMES.includes(game))return;
 active=game;
 renderTabs();renderGame();
 try{const url=new URL(location.href);url.searchParams.set("game",game);history.replaceState(null,"",url);}catch(_){}
}
function renderGame(){
 const host=$("gameHost");
 if(!host||!approved)return;
 if(active==="tetris"){
  host.innerHTML='<div class="game-panel"><div class="game-head"><div><span class="game-tag">Sprint · 40 Lines</span><h2>TetrisZoul</h2><p>O mesmo jogo independente que já existia no Admin Config, agora reunido com os outros Extras.</p></div><span class="game-stat">40 linhas</span></div>'+
   '<div class="tetris-tools"><span class="section-note">Configurações, skins e recordes permanecem no TetrisZoul.</span><a href="./tetriszoul.html" target="_blank" rel="noopener noreferrer">Abrir jogo em tela própria ↗</a></div>'+
   '<iframe class="tetris-frame" id="extrasTetrisFrame" src="./tetriszoul.html" title="TetrisZoul — 40 linhas" loading="lazy" allow="fullscreen"></iframe></div>';
 }else if(active==="psico")renderPsico();
 else if(active==="conexo")renderConexo();
 else if(active==="contexto")renderContexto();
 requestHeight();
}
function requestHeight(){
 if(window.parent===window)return;
 requestAnimationFrame(()=>{
  const h=Math.max(document.body.scrollHeight,document.documentElement.scrollHeight);
  window.parent.postMessage({kind:"psicomoodle-extras-height",height:Math.min(4500,Math.max(650,h))},location.origin);
 });
}
function wordColors(guess,answer){
 const q=clean(guess).split(""),a=clean(answer).split(""),colors=Array(5).fill("absent");
 const left={};
 for(let i=0;i<5;i++){
  if(q[i]===a[i])colors[i]="correct";
  else left[a[i]]=(left[a[i]]||0)+1;
 }
 for(let i=0;i<5;i++){
  if(colors[i]==="correct")continue;
  if((left[q[i]]||0)>0){colors[i]="present";left[q[i]]--;}
 }
 return colors;
}
function renderPsico(){
 const answer=getWord(),st=states.psico;
 if(!Array.isArray(st.guesses))st.guesses=[];
 if(typeof st.draft!=="string")st.draft="";
 st.draft=clean(st.draft).replace(/[^A-Z]/g,"").slice(0,5);
 const rows=[];
 for(let r=0;r<6;r++){
  let letters="",colors=[];
  if(r<st.guesses.length){letters=st.guesses[r];colors=wordColors(letters,answer.word);}
  else if(r===st.guesses.length&&!st.done){letters=st.draft;}
  rows.push('<div class="psico-row" role="row">'+Array.from({length:5},(_,i)=>{
   const l=letters[i]||"",status=colors[i]|| (l?"filled":"");
   return '<div class="psico-cell '+status+(r===st.guesses.length&&!st.done?' current':'')+'" role="gridcell" aria-label="'+(l||"vazio")+' '+status+'">'+esc(l)+'</div>';
  }).join("")+'</div>');
 }
 const grades={};
 st.guesses.forEach(guess=>wordColors(guess,answer.word).forEach((grade,i)=>{
  const letter=guess[i],rank={absent:1,present:2,correct:3};
  if(!grades[letter]||rank[grade]>rank[grades[letter]])grades[letter]=grade;
 }));
 const kb=[["Q","W","E","R","T","Y","U","I","O","P"],["A","S","D","F","G","H","J","K","L"],["ENTER","Z","X","C","V","B","N","M","BACK"]];
 let result="";
 if(st.done){
  const title=st.won?"Boa! Palavra encontrada.":"Fim das tentativas.";
  result='<div class="finish-box"><strong>'+title+'</strong><p>A palavra era <b>'+esc(answer.word)+'</b>. '+esc(answer.hint)+' · '+esc(answer.area)+'. Amanhã tem um novo desafio.</p></div>';
 }
 $("gameHost").innerHTML=
  '<div class="game-panel"><div class="game-head"><div><span class="game-tag">Palavra do dia · 5 letras</span><h2>Psico</h2><p>Descubra um termo que aparece nos conteúdos dos dois primeiros semestres. Você tem até seis tentativas.</p></div><span class="game-stat">'+(st.done?(st.won?"Concluído":"Encerrado"):(st.guesses.length+1)+" / 6")+'</span></div>'+
  '<div class="psico-board" role="grid" aria-label="Seis tentativas, cinco letras por linha">'+rows.join("")+'</div>'+
  feedbackHtml("psico")+
  '<div class="psico-keyboard" aria-label="Teclado do Psico">'+kb.map(row=>'<div class="psico-keyrow">'+row.map(key=>
   '<button type="button" data-letter="'+esc(key)+'" class="psico-key '+(key.length>1?"special ":"")+(grades[key]||"")+'" '+(st.done?'disabled':'')+' aria-label="'+esc(key==="BACK"?"Apagar":key==="ENTER"?"Enviar":key)+'">'+esc(key==="BACK"?"⌫":key==="ENTER"?"↵":key)+'</button>'
  ).join("")+'</div>').join("")+'</div>'+
  result+
  '<div class="explanation"><b>Como funciona:</b> verde indica letra na posição correta; amarelo significa letra presente em outra posição; cinza indica letra ausente ou repetida em excesso. Os acentos não precisam ser digitados. As soluções sempre vêm do banco de termos de Psicologia; os palpites podem ser quaisquer sequências de cinco letras.</div></div>';
 requestHeight();
}
function inputPsico(key){
 if(active!=="psico")return;
 const st=states.psico;if(st.done)return;
 if(key==="BACK"){st.draft=st.draft.slice(0,-1);store("psico",false);}
 else if(key==="ENTER"){
  if(st.draft.length!==5){setFeedback("psico","Digite cinco letras.","error");return;}
  const guess=st.draft,correct=clean(getWord().word);
  st.guesses.push(guess);st.draft="";
  st.won=guess===correct;st.done=st.won||st.guesses.length>=6;
  store("psico");
  feedback={game:"psico",message:st.won?"Acertou!":st.done?"As seis tentativas terminaram.":"Continue tentando.",kind:st.won?"ok":""};
 }else{
  const letter=clean(key).replace(/[^A-Z]/g,"").slice(0,1);
  if(!letter||st.draft.length>=5)return;
  st.draft+=letter;store("psico",false);
  feedback={game:"",message:"",kind:""};
 }
 renderPsico();
}
function initConnections(){
 const shuffledGroups=shuffle(DATA.connectionGroups,ordinal*104729+17);
 const chosen=[],seen=new Set();
 for(const group of shuffledGroups){
  if(chosen.length>=4)break;
  const unique=group.terms.map(cleanTerm);
  if(new Set(unique).size!==4||unique.some(t=>seen.has(t)))continue;
  chosen.push(group);unique.forEach(t=>seen.add(t));
 }
 if(chosen.length!==4)throw Error("Não foi possível montar quatro grupos exclusivos.");
 connectionGroups=chosen.map((g,i)=>({...g,level:i}));
 connectionTiles=shuffle(chosen.flatMap((group,i)=>group.terms.map((word,j)=>({id:i+"-"+j,word,group:i}))),ordinal*83293+101);
 const st=states.conexo;
 if(!Array.isArray(st.solved))st.solved=[];
 if(!Array.isArray(st.selected))st.selected=[];
 if(!Array.isArray(st.wrong))st.wrong=[];
 if(!Array.isArray(st.shuffled))st.shuffled=[];
 st.solved=st.solved.filter(i=>Number.isInteger(i)&&i>=0&&i<4);
 st.mistakes=Math.max(0,Math.min(4,Number(st.mistakes)||0));
 st.done=st.solved.length===4||st.mistakes>=4;
 st.won=st.solved.length===4;
}
function renderConexo(){
 const st=states.conexo,solved=st.solved||[];
 const failed=st.done&&!st.won;
 const show=connectionGroups.map((group,i)=>({group,i})).filter(x=>solved.includes(x.i)||failed);
 const remaining=connectionTiles.filter(t=>!solved.includes(t.group)&&!failed);
 const sorted=st.shuffled?.length?remaining.sort((a,b)=>st.shuffled.indexOf(a.id)-st.shuffled.indexOf(b.id)):remaining;
 const found=show.map(({group,i})=>'<div class="conexo-group l'+(group.level%4)+'"><strong>'+esc(group.title)+'</strong><small>'+group.terms.map(esc).join(" · ")+'</small></div>').join("");
 let end="";
 if(st.done)end='<div class="finish-box"><strong>'+(st.won?"Quatro grupos encontrados!":"Tentativas encerradas.")+'</strong><p>'+ (st.won?"Você resolveu o Conexo de hoje.":"As quatro conexões aparecem acima para revisão.")+' Volte amanhã para um novo desafio.</p></div>';
 $("gameHost").innerHTML='<div class="game-panel"><div class="game-head"><div><span class="game-tag">Conexões do dia · 16 palavras</span><h2>Conexo</h2><p>Selecione quatro termos que têm uma ligação. São quatro grupos de quatro; você pode errar até quatro vezes.</p></div><span class="game-stat">'+solved.length+' / 4 grupos</span></div>'+
  '<div class="conexo-solved">'+found+'</div>'+
  '<div class="conexo-grid">'+sorted.map(t=>'<button class="conexo-tile '+(st.selected.includes(t.id)?"selected":"")+'" data-tile="'+esc(t.id)+'" type="button" aria-pressed="'+String(st.selected.includes(t.id))+'">'+esc(t.word)+'</button>').join("")+'</div>'+
  '<div class="lives">Erros disponíveis: '+Array.from({length:4},(_,i)=>'<span class="life '+(i<st.mistakes?"lost":"")+'" aria-label="'+(i<st.mistakes?"Erro usado":"Tentativa disponível")+'"></span>').join("")+'</div>'+
  feedbackHtml("conexo")+
  (!st.done?'<div class="game-actions"><button type="button" class="secondary-action" data-conexo="shuffle">Misturar</button><button type="button" class="secondary-action" data-conexo="deselect">Desmarcar</button><button type="button" class="primary-action" data-conexo="submit" '+(st.selected.length!==4?"disabled":"")+' >Enviar ('+st.selected.length+'/4)</button></div>':"")+
  end+'<div class="explanation">Os conjuntos foram criados com conceitos e assuntos das disciplinas que você estudou. Categorias são reveladas quando acertadas ou ao terminar as tentativas.</div></div>';
 requestHeight();
}
function tileClick(id){
 const st=states.conexo;if(st.done)return;
 if(st.selected.includes(id))st.selected=st.selected.filter(x=>x!==id);
 else if(st.selected.length<4)st.selected.push(id);
 store("conexo",false);renderConexo();
}
function conexoSubmit(){
 const st=states.conexo;
 if(st.done||st.selected.length!==4)return;
 const terms=st.selected.map(id=>connectionTiles.find(t=>t.id===id)).filter(Boolean);
 if(terms.length!==4)return;
 const groups=new Set(terms.map(t=>t.group));
 if(groups.size===1){
  const idx=terms[0].group;
  if(!st.solved.includes(idx))st.solved.push(idx);
  st.solved.sort((a,b)=>a-b);
  feedback={game:"conexo",message:"Grupo encontrado: "+connectionGroups[idx].title,kind:"ok"};
 }else{
  const code=st.selected.slice().sort().join("|");
  if(st.wrong.includes(code)){setFeedback("conexo","Esse conjunto já foi tentado.","error");return;}
  st.wrong.push(code);st.mistakes++;
  const count=Math.max(...[0,1,2,3].map(group=>terms.filter(t=>t.group===group).length));
  feedback={game:"conexo",message:count===3?"Faltou uma palavra!":"Essas quatro palavras não formam um grupo.",kind:"error"};
 }
 st.selected=[];st.done=st.solved.length===4||st.mistakes>=4;st.won=st.solved.length===4;
 store("conexo");renderConexo();
}
function conexoAction(action){
 const st=states.conexo;
 if(action==="submit"){conexoSubmit();return;}
 if(action==="deselect"){st.selected=[];store("conexo",false);renderConexo();return;}
 if(action==="shuffle"){
  const remaining=connectionTiles.filter(t=>!st.solved.includes(t.group));
  st.shuffled=shuffle(remaining,Math.floor(Math.random()*4294967295)+1).map(t=>t.id);
  store("conexo",false);renderConexo();
 }
}
function displayTerm(value){
 const v=cleanTerm(value),found=contextTerms.get(v);
 return found?.label||String(value??"").toLowerCase();
}
function initContexto(){
 contextTerms=new Map();
 DATA.semanticDomains.forEach((domain,i)=>domain.terms.forEach(term=>{
  const key=cleanTerm(term);
  if(!key)return;
  if(!contextTerms.has(key))contextTerms.set(key,{label:term,domains:new Set()});
  contextTerms.get(key).domains.add(i);
 }));
 contextTarget=cleanTerm(TARGETS[((ordinal*11+5)%TARGETS.length+TARGETS.length)%TARGETS.length]);
 if(!contextTerms.has(contextTarget))throw Error("Resposta do Contexto não cadastrada: "+contextTarget);
 const target=contextTerms.get(contextTarget);
 const rankings=[...contextTerms.keys()].map(word=>{
  if(word===contextTarget)return {word,score:1e9};
  const entry=contextTerms.get(word);
  let common=0;
  for(const d of target.domains)if(entry.domains.has(d))common++;
  let score=common*140;
  const nearby=NEAR[contextTarget.toLowerCase()]||[];
  const index=nearby.indexOf(word.toLowerCase());
  if(index>=0)score+=330-index*8;
  const reverse=NEAR[word.toLowerCase()]||[];
  if(reverse.includes(contextTarget.toLowerCase()))score+=270;
  const a=contextTarget.split(" "),b=word.split(" ");
  if(a.some(t=>b.includes(t)))score+=30;
  // Stable tie breaker only. Proximity comes from curated subject-domain links.
  score+=Math.max(0,12-Math.abs(word.length-contextTarget.length));
  score+=((word.charCodeAt(0)*43+word.length*17+ordinal%31)%97)/1000;
  return {word,score};
 }).sort((a,b)=>b.score-a.score||a.word.localeCompare(b.word,"pt-BR"));
 contextRankings=new Map(rankings.map((item,i)=>[item.word,i+1]));
 const st=states.contexto;
 if(!Array.isArray(st.guesses))st.guesses=[];
 st.guesses=st.guesses.filter(g=>g&&typeof g.word==="string"&&contextTerms.has(cleanTerm(g.word))).slice(0,120);
 st.won=st.guesses.some(g=>cleanTerm(g.word)===contextTarget);
 st.done=st.won;
}
function contextHints(){
 const item=contextTerms.get(contextTarget);
 const first=[...item.domains][0];
 return DATA.semanticDomains[first]?.name||"Conteúdo das disciplinas";
}
function renderContexto(){
 const st=states.contexto;
 const all=contextTerms.size,tries=st.guesses.length;
 const best=st.guesses.reduce((m,g)=>Math.min(m,contextRankings.get(cleanTerm(g.word))||all),all);
 const sorted=st.guesses.slice().sort((a,b)=>(contextRankings.get(cleanTerm(a.word))||all)-(contextRankings.get(cleanTerm(b.word))||all));
 const results=sorted.map(g=>{
  const rank=contextRankings.get(cleanTerm(g.word))||all;
  const closeness=Math.max(4,Math.round(100*(1-(rank-1)/Math.max(1,all-1))));
  const grade=rank<=10?"hot":rank<=Math.ceil(all*.3)?"mid":"far";
  return '<div class="context-guess '+grade+'"><span class="context-fill" style="width:'+closeness+'%"></span><b>'+esc(displayTerm(g.word))+'</b><small>#'+rank+' / '+all+'</small></div>';
 }).join("");
 const suggestions=[...contextTerms.values()].map(v=>v.label).sort((a,b)=>a.localeCompare(b,"pt-BR")).map(w=>'<option value="'+esc(w)+'"></option>').join("");
 const result=st.won?'<div class="finish-box"><strong>Você encontrou o termo!</strong><p>'+esc(displayTerm(contextTarget))+' · '+tries+' palpite'+(tries===1?"":"s")+'. Amanhã será outra palavra da Psicologia.</p></div>':"";
 $("gameHost").innerHTML=
  '<div class="game-panel"><div class="game-head"><div><span class="game-tag">Contexto do dia · Associação semântica</span><h2>Contexto</h2><p>Tente descobrir um termo da Psicologia. Cada palpite recebe uma posição: quanto menor o número, mais perto do sentido da resposta.</p></div><span class="game-stat">'+(st.won?"Resolvido":"Melhor #"+(tries?best:"—"))+'</span></div>'+
  '<div class="context-layout">'+
  (st.won?"":'<form id="contextForm" class="context-form" autocomplete="off"><input id="contextGuess" list="contextSuggest" aria-label="Palavra ou termo de Psicologia" placeholder="Digite uma palavra ou termo..." maxlength="60" required><datalist id="contextSuggest">'+suggestions+'</datalist><button class="primary-action" type="submit">Enviar</button></form>')+
  '<div class="context-help"><div class="explanation">O ranking considera <b>'+all+' termos cadastrados</b> e relações temáticas revisadas para este jogo. Não é o ranking do Contexto original nem uma inteligência semântica geral.</div>'+
  (!st.done?'<button class="secondary-action" type="button" id="contextHintBtn" '+(st.hint?"disabled":"")+'>Dica</button>':"")+'</div>'+
  (st.hint?'<div class="context-hint">Área do termo secreto: <b>'+esc(contextHints())+'</b></div>':"")+
  feedbackHtml("contexto")+
  '<p class="context-status">'+tries+' palpite'+(tries===1?"":"s")+' · #1 é a resposta · Ordenado do mais próximo para o mais distante</p>'+
  result+'<div class="context-results">'+(results||'<p class="section-note">Tenta “memória”, “grupo”, “empatia”, “laudo” ou outro conceito que vimos nas aulas.</p>')+'</div></div></div>';
 requestHeight();
}
function contextSubmit(text){
 const guess=cleanTerm(text),st=states.contexto;
 if(st.done||!guess)return;
 if(!contextTerms.has(guess)){
  setFeedback("contexto","Ainda não temos esse termo no vocabulário. Digite um termo cadastrado ou escolha uma sugestão.","error");return;
 }
 if(st.guesses.some(g=>cleanTerm(g.word)===guess)){setFeedback("contexto","Você já tentou esse termo.","error");return;}
 st.guesses.push({word:guess});st.won=guess===contextTarget;st.done=st.won;
 if(st.guesses.length>120)st.guesses=st.guesses.slice(-120);
 store("contexto");
 feedback={game:"contexto",message:st.won?"Boa! Encontrou a palavra.":"Palpite registrado.",kind:st.won?"ok":""};
 renderContexto();
 if(!st.done)$("contextGuess")?.focus();
}
async function start(){
 if(authBusy)return;authBusy=true;
 try{
  if(!DATA||!window.supabase?.createClient)throw Error("Os recursos dos jogos não carregaram. Verifique sua conexão.");
  client=window.supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
  const session=await client.auth.getUser();
  if(session.error||!session.data?.user?.id)throw Error("Faça login no PsicoMoodle para abrir o Extras.");
  uid=session.data.user.id;
  const role=await client.rpc("uentzoul_is_admin");
  if(role.error||role.data!==true)throw Error("Extras está em prévia: somente administradores têm acesso.");
  initializeDay();
  await Promise.all([loadWordBank(),loadCloud()]);
  approved=true;
  for(const game of CONTENT_GAMES)if(states[game]?._savedAt)void flushCloud(game);
  $("extrasGate").hidden=true;$("extrasApp").hidden=false;
  const requested=new URL(location.href).searchParams.get("game");
  switchGame(GAMES.includes(requested)?requested:"tetris");
  try{
   const theme=window.parent!==window?window.parent.document.documentElement.dataset.theme:localStorage.getItem("psicomoodle-theme");
   if(theme==="dark")document.documentElement.dataset.theme="dark";
  }catch(_){}
  client.auth.onAuthStateChange((event,newSession)=>{
   if(event==="SIGNED_OUT"||!newSession?.user?.id||newSession.user.id!==uid){
    approved=false;$("extrasApp").hidden=true;$("extrasGate").hidden=false;
    $("extrasGateStatus").textContent="A sessão foi encerrada. Faça login novamente.";
    requestHeight();
   }
  });
  requestHeight();
 }catch(e){
  $("extrasGateStatus").textContent=e.message||"Não foi possível confirmar o acesso.";
  requestHeight();
 }finally{authBusy=false;}
}
document.addEventListener("click",e=>{
 const tab=e.target.closest("[data-game]");
 if(tab){switchGame(tab.dataset.game);return;}
 if(active==="psico"){
  const key=e.target.closest("[data-letter]");
  if(key){key.blur?.();inputPsico(key.dataset.letter);return;}
 }
 if(active==="conexo"){
  const tile=e.target.closest("[data-tile]");
  if(tile){tileClick(tile.dataset.tile);return;}
  const action=e.target.closest("[data-conexo]");
  if(action){conexoAction(action.dataset.conexo);return;}
 }
 if(active==="contexto"){
  if(e.target.closest("#contextHintBtn")){
   states.contexto.hint=true;store("contexto");renderContexto();return;
  }
 }
});
document.addEventListener("submit",e=>{
 if(e.target.id==="contextForm"){
  e.preventDefault();
  const value=$("contextGuess")?.value||"";
  contextSubmit(value);
 }
});
document.addEventListener("keydown",e=>{
 if(!approved||active!=="psico")return;
 if(e.target&&(/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)||e.target.isContentEditable||e.target.closest?.("button,a,[role=tab]")))return;
 if(e.ctrlKey||e.altKey||e.metaKey)return;
 if(e.key==="Enter"){e.preventDefault();inputPsico("ENTER");return;}
 if(e.key==="Backspace"){e.preventDefault();inputPsico("BACK");return;}
 if(e.key.length===1&&/^[A-Za-zÀ-ÖØ-öø-ÿ]$/u.test(e.key)){
  e.preventDefault();inputPsico(e.key);
 }
});
window.addEventListener("focus",()=>{if(approved&&dateBrazil()!==day)location.reload();});
window.addEventListener("online",()=>{
 if(!approved)return;
 for(const game of CONTENT_GAMES)if(states[game]?._savedAt)void flushCloud(game);
});
window.addEventListener("resize",requestHeight);
if("ResizeObserver" in window){new ResizeObserver(requestHeight).observe(document.body);}
start();
})();