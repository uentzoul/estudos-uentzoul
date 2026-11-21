/* Extras PsicoMoodle — jogos originais de estudo, com acesso administrativo e progresso diário. */
(function(){
"use strict";
const SB_URL="https://swseibmqoetnuctxyusj.supabase.co";
const SB_KEY="sb_publishable_Fa12C_gaam8nv3g4fsWy2w_8nWQZWzq";
const DATA=window.PSICO_EXTRAS_DATA||{wordBank:[],connectionGroups:[],semanticDomains:[]};
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clean=s=>String(s??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().trim();
const cleanTerm=s=>clean(s).replace(/\s+/g," ");
// No CONTEXTO, apenas uma palavra ortográfica por entrada: sem espaços, hífens ou números.
const isContextWord=value=>/^[A-Z]+$/u.test(cleanTerm(value));
const GAMES=["psico","contexto","conexo","tetris"];
const ARCHIVE_START="2026-11-20";
const CONTENT_GAMES=["psico","conexo","contexto"];
// Mantém as respostas do dia inaugural mesmo após ampliar os bancos editoriais.
const LAUNCH_GROUPS=[
 {title:"Elementos presentes no processo de avaliação psicológica",terms:["Testagem","Observação","Entrevistado","Relatório"]},
 {title:"Elementos da dinâmica de grupos",terms:["Coesão","Liderança","Normas","Papéis"]},
 {title:"Áreas de atuação da Psicologia",terms:["Hospitalar","Forense","Escolar","Organizacional"]},
 {title:"Etapas do ciclo vital",terms:["Infância","Adolescência","Adultez","Velhice"]}
];
const TARGETS=["memoria","empatia","recalque","familia","laudo","lideranca","ideologia","esquema","apego","pulsao","atencao","divorcio","polarizacao","inconsciente","cuidado","congruencia","reforco","ciclo","escuta","pensamento","normas","diagnostico","libertacao","preconceito","aprendizagem","avaliacao","cooperacao","desejo","comportamento","democracia","medo","alegria","tristeza","raiva","culpa","vergonha","orgulho","saudade","amor","ansiedade","felicidade","calma","esperanca","luto","motivacao","autonomia","persistencia","autocontrole","impulso","recompensa","rotina","resiliencia","autoeficacia","amizade","confianca","relacionamento","comunicacao","intimidade","limites","convivencia","isolamento","rejeicao","sono","descanso","insonia","cansaco","concentracao","distracao","esquecimento","lembranca","imaginacao","identidade","personalidade","temperamento","autoconhecimento","autoestima","autoconfianca","autoimagem","carater","socializacao","estresse","depressao","trauma","terapia","psicoterapia","sofrimento","autocuidado","vitalidade","saude"];
const NEAR={
 memoria:["atencao","percepcao","aprendizagem","linguagem"],
 empatia:["compreensao","escuta","aceitacao","rogers","consideracao"],
 recalque:["inconsciente","defesa","desejo","pulsao","conflito"],
 familia:["casal","parentalidade","filho","apego","vinculo","cuidado"],
 laudo:["parecer","documento","avaliacao","diagnostico","anamnese"],
 lideranca:["grupo","coesao","papeis","normas","cooperacao"],
 ideologia:["fatalismo","poder","cultura","sociedade","alienacao"],
 esquema:["crenca","pensamento","psicoterapia","abandono","vergonha"],
 apego:["vinculo","familia","parentalidade","infancia","cuidado"],
 pulsao:["libido","desejo","inconsciente","recalque","id"],
 atencao:["memoria","percepcao","cognicao","linguagem"],
 divorcio:["separacao","casal","guarda","recasamento","familia"],
 polarizacao:["algoritmo","vies","redes","midia","opiniao"],
 inconsciente:["recalque","sonho","desejo","id","freud"],
 cuidado:["familia","acolhimento","escuta","parentalidade"],
 congruencia:["autenticidade","rogers","empatia","pessoa"],
 reforco:["comportamento","resposta","estimulo","punicao"],
 ciclo:["infancia","adolescencia","adultez","velhice"],
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
let client=null,uid=null,approved=false,isAdmin=false,day="",ordinal=0,active="psico",states={};
let calendarViewMonth="",calendarOpen=false,conexoMarkMode=false,conexoDrag=null,suppressConexoClick=false;
let archiveLoadToken=0, psicoFlippingRow=-1, psicoMode="classico",adminAnswersOpen=false;
const PSICO_MODES={classico:{label:"Clássico",boards:1,attempts:6},duplo:{label:"Duplo",boards:2,attempts:7},quadruplo:{label:"Quádruplo",boards:4,attempts:9}};
let psicoBank=DATA.wordBank.slice().sort((a,b)=>clean(a.word).localeCompare(clean(b.word),"pt-BR"));
let connectionGroups=[],connectionTiles=[],contextTerms=new Map(),contextRankings=null,contextTarget="",contextFreeRanks=new Map();
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

const PSICO_NEW_DECK_START="2026-11-21";
// A rodada de estreia é imutável para não invalidar tentativas e resultados já salvos.
const PSICO_LAUNCH_WORDS={"classico":["EXAME"],"duplo":["LAUDO","CAUSA"],"quadruplo":["GANHO","NOÇÃO","MEDOS","RITMO"]};
const PSICO_CLASSIC_CORE=new Set("ÉDIPO VÍCIO ÉTICA LAUDO MENTE FOCAR CHORO FOBIA HUMOR AFETO RAIVA GESTO VOZES RITOS CICLO SONHO GRUPO TESTE CULPA CRISE CASAL APEGO NORMA PODER IDEAL CORPO TRAÇO RITMO TÉDIO OLHAR OUVIR PERDA EXAME RISCO REGRA REDES MÍDIA SINAL APOIO MEDOS DADOS METAS SAÚDE RAZÃO NOÇÃO CALMA BRIGA LAÇOS TOQUE FUGIR TENSO JUÍZO NEGAR MEDIR ÂNIMO ÂNSIA MÁGOA CIÚME SUSTO PAVOR TEMOR FÚRIA ABUSO SURTO MANIA LUTOS AFAGO FREUD LACAN KLEIN ADLER LAPSO VISÃO TÁTIL AROMA SABOR OLHOS ROSTO DEDOS MAPAS BLOCO RETER NOTAR PENSA ERROS TEXTO VERBO CÓPIA RUÍDO NEXOS LÍDER COESO TURMA CLIMA PACTO ORDEM BOATO RUMOR CARGO CARGA PAUTA UNIDO IGUAL OUTRO DIGNO JUSTO FALSO LEAIS HONRA RENDA ETNIA DEVER CREDO MITOS MASSA BEBÊS IDOSO IDOSA FILHA PARTO FETOS JOGOS TEMPO TESES MÉDIA TAXAS FATOR ITENS RIGOR PROVA".split(" ").map(clean));
function psicoEntry(word){
 const answer=DATA.wordBank.find(item=>clean(item.word)===clean(word));
 if(!answer)throw Error("Palavra do PSICO ausente do banco: "+word);
 return answer;
}
function buildPsicoAnswerDeck(){
 // O vocabulário é local e versionado; atualizações no banco remoto não trocam as respostas do dia.
 const reserved=new Set(Object.values(PSICO_LAUNCH_WORDS).flat().map(clean));
 const eligible=DATA.wordBank.filter(item=>clean(item.word).length===5&&!reserved.has(clean(item.word)))
  .sort((a,b)=>clean(a.word).localeCompare(clean(b.word),"pt-BR"));
 const core=shuffle(eligible.filter(item=>PSICO_CLASSIC_CORE.has(clean(item.word))),20261121);
 const rest=shuffle(eligible.filter(item=>!PSICO_CLASSIC_CORE.has(clean(item.word))),20261122);
 const result=[];
 // Uma palavra central de Psicologia abre o Clássico; os demais tabuleiros misturam áreas.
 // Cada posição é consumida uma única vez por rodada completa, sem duplicações entre modos/dias.
 while(core.length||rest.length){
  for(let slot=0;slot<7;slot++){
   const useCore=slot===0||slot===2||slot===4;
   const first=useCore?core:rest,second=useCore?rest:core;
   const chosen=first.length?first.shift():second.length?second.shift():null;
   if(chosen)result.push(chosen);
  }
 }
 // Palavras da estreia ficam no fim do baralho padrão, exceto quando agendadas editorialmente.
 result.push(...Object.values(PSICO_LAUNCH_WORDS).flat().map(psicoEntry));
 return result;
}
// Calendário editorial do PSICO: Clássico, Duplo (2) e Quádruplo (4).
// Mantém o dia 21/11 intacto; a partir de 22/11 cada palavra fica em um único slot do baralho.
const PSICO_EDITORIAL_DAYS={
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
function applyPsicoEditorialDays(deck){
 const result=deck.slice();
 const pinned=new Set(Array.from({length:7},(_,i)=>i)); // 21/11 já pode ter resultados registrados.
 for(const [targetDay,words] of Object.entries(PSICO_EDITORIAL_DAYS)){
  const offset=dayNumber(targetDay)-dayNumber(PSICO_NEW_DECK_START);
  const start=offset*7;
  if(words.length!==7||start<7||start+7>result.length)throw Error("Calendário editorial PSICO inválido: "+targetDay);
  for(let i=0;i<words.length;i++){
   const wanted=clean(words[i]);
   const sourceIndex=result.findIndex((item,j)=>!pinned.has(j)&&clean(item.word)===wanted);
   if(sourceIndex<0)throw Error("Palavra não disponível no baralho PSICO: "+words[i]);
   const targetIndex=start+i;
   [result[targetIndex],result[sourceIndex]]=[result[sourceIndex],result[targetIndex]];
   pinned.add(targetIndex);
  }
 }
 return result;
}
const PSICO_ANSWER_DECK=applyPsicoEditorialDays(buildPsicoAnswerDeck());
function getPsicoDayWordsFor(targetDay){
 if(targetDay===ARCHIVE_START)return Object.values(PSICO_LAUNCH_WORDS).flat().map(psicoEntry);
 const offset=Math.max(0,dayNumber(targetDay)-dayNumber(PSICO_NEW_DECK_START));
 const from=(offset*7)%PSICO_ANSWER_DECK.length;
 return Array.from({length:7},(_,i)=>PSICO_ANSWER_DECK[(from+i)%PSICO_ANSWER_DECK.length]);
}

function getWordFor(targetDay){return getPsicoDayWordsFor(targetDay)[0];}
function getWord(){return getWordFor(day);}
function gameStateDefault(game){
 return game==="psico"?{guesses:[],draft:"",done:false,won:false}:
 game==="conexo"?{solved:[],selected:[],wrong:[],shuffled:[],marked:[],done:false,won:false}:
 {guesses:[],hint:false,done:false,won:false};
}
function localKey(game,targetDay=day){return "psicomoodle-extras-v1:"+uid+":"+targetDay+":"+game;}
function localGet(game,targetDay=day){
 try{
  const v=JSON.parse(localStorage.getItem(localKey(game,targetDay)));
  return v&&typeof v==="object"?v:null;
 }catch(_){return null;}
}
function localSet(game,targetDay=day){
 try{localStorage.setItem(localKey(game,targetDay),JSON.stringify(states[game]));}catch(_){}
}
function dateLabel(value){
 return new Intl.DateTimeFormat("pt-BR",{timeZone:"UTC",day:"2-digit",month:"short",year:"numeric"}).format(new Date(value+"T12:00:00Z"));
}
function calendarMonth(offset){
 const current=calendarViewMonth||day.slice(0,7),year=Number(current.slice(0,4)),month=Number(current.slice(5,7));
 const date=new Date(Date.UTC(year,month-1+offset,1));
 const next=date.toISOString().slice(0,7);
 if(next<ARCHIVE_START.slice(0,7)||next>dateBrazil().slice(0,7))return;
 calendarViewMonth=next;renderCalendar();
}
function renderCalendar(){
 const host=$("calendarDays");
 if(!host)return;
 const chosen=calendarViewMonth||day.slice(0,7);
 const year=Number(chosen.slice(0,4)),month=Number(chosen.slice(5,7));
 const first=new Date(Date.UTC(year,month-1,1)),count=new Date(Date.UTC(year,month,0)).getUTCDate();
 const shift=(first.getUTCDay()+6)%7;
 $("calendarMonthLabel").textContent=new Intl.DateTimeFormat("pt-BR",{timeZone:"UTC",month:"long",year:"numeric"}).format(first);
 $("calendarMonthPrev").disabled=chosen<=ARCHIVE_START.slice(0,7);
 $("calendarMonthNext").disabled=chosen>=dateBrazil().slice(0,7);
 const entries=Array.from({length:shift},()=>'<span class="calendar-day-empty" aria-hidden="true"></span>');
 for(let d=1;d<=count;d++){
  const value=chosen+"-"+String(d).padStart(2,"0"),valid=validArchiveDay(value),selected=value===day,today=value===dateBrazil();
  entries.push('<button type="button" class="calendar-day'+(selected?' is-selected':'')+(today?' is-today':'')+'" data-calendar-day="'+value+'" aria-label="'+esc(dateLabel(value))+'" aria-pressed="'+String(selected)+'"'+(valid?'':' disabled')+'>'+d+'</button>');
 }
 host.innerHTML=entries.join("");
 const today=$("archiveToday");if(today)today.disabled=day===dateBrazil();
}
function setCalendarOpen(open){
 calendarOpen=!!open&&active!=="tetris";
 const pop=$("calendarPopup"),button=$("calendarToggle");
 if(pop)pop.hidden=!calendarOpen;
 if(button)button.setAttribute("aria-expanded",String(calendarOpen));
 if(calendarOpen){calendarViewMonth=day.slice(0,7);renderCalendar();}
}
function updateArchiveControls(){
 const label=$("dayLabel"),current=$("calendarSelectedLabel"),wrapper=$("extrasCalendar");
 if(label)label.textContent=dateLabel(day);
 if(current)current.textContent=dateLabel(day);
 if(wrapper)wrapper.hidden=active==="tetris";
 if(active==="tetris")setCalendarOpen(false);
 else renderCalendar();
 updateAdminAnswers();
}
function initializeDay(selected=dateBrazil()){
 day=selected;ordinal=dayNumber(day);psicoFlippingRow=-1;calendarViewMonth=selected.slice(0,7);
 feedback={game:"",message:"",kind:""};
 for(const game of CONTENT_GAMES)states[game]=localGet(game)||gameStateDefault(game);
 if(PSICO_MODES[states.psico.mode])psicoMode=states.psico.mode;
 initConnections();initContexto();updateArchiveControls();
}
function validArchiveDay(value){
 if(!/^\d{4}-\d\d-\d\d$/.test(value))return false;
 const time=Date.parse(value+"T12:00:00Z");
 return Number.isFinite(time)&&new Date(time).toISOString().slice(0,10)===value&&value>=ARCHIVE_START&&value<=dateBrazil();
}
function moveArchiveDay(offset){
 if(!approved)return;
 const time=Date.parse(day+"T12:00:00Z")+offset*86400000;
 const value=new Date(time).toISOString().slice(0,10);
 void selectArchiveDay(value);
}
async function selectArchiveDay(value){
 if(!approved||!validArchiveDay(value)){updateArchiveControls();return;}
 if(value===day){updateArchiveControls();return;}
 const token=++archiveLoadToken;
 // Cada dia possui seu próprio estado em cache e sua chave no Supabase.
 initializeDay(value);
 setCalendarOpen(false);
 renderGame();
 await loadCloud(value);
 if(token!==archiveLoadToken||value!==day)return;
 initConnections();initContexto();renderGame();
}

async function loadWordBank(){
 try{
  const {data,error}=await client.from("uentzoul_extras_word_bank")
    .select("word,course_area,hint").eq("enabled",true).order("word").limit(500);
  if(error)throw error;
  const valid=(data||[]).filter(x=>clean(x.word).length===5);
  if(valid.length>=20){
   const merged=new Map(psicoBank.map(x=>[clean(x.word),x]));
   valid.forEach(x=>merged.set(clean(x.word),{word:x.word,area:x.course_area,hint:x.hint}));
   psicoBank=[...merged.values()].sort((a,b)=>clean(a.word).localeCompare(clean(b.word),"pt-BR"));
  }
 }catch(e){console.warn("Extras: usando banco de palavras local.",e?.message||e);}
}
async function loadCloud(targetDay=day){
 try{
  const res=await client.from("uentzoul_extras_progress")
   .select("game,state,updated_at").eq("user_id",uid).eq("challenge_day",targetDay).limit(3);
  if(res.error)throw res.error;
  if(targetDay!==day)return;
  for(const row of res.data||[]){
   if(!CONTENT_GAMES.includes(row.game)||!row.state||typeof row.state!=="object")continue;
   const local=states[row.game];
   const localTime=Number(local?._savedAt)||0,remoteTime=Number(row.state._savedAt)||Date.parse(row.updated_at)||0;
   // Uma limpeza solicitada pelo dono prevalece sobre o cache antigo do navegador.
   const resetChanged=row.state._resetRevision&&row.state._resetRevision!==local?._resetRevision;
   if(resetChanged||remoteTime>=localTime){states[row.game]=row.state;localSet(row.game,targetDay);}
   else scheduleCloud(row.game,targetDay);
  }
 }catch(e){
  console.warn("Extras: leitura do progresso indisponível.",e?.message||e);
 }
}
function store(game,remote=true){
 if(!CONTENT_GAMES.includes(game))return;
 states[game]._savedAt=Date.now();
 localSet(game);
 if(remote)scheduleCloud(game,day);
}
function scheduleCloud(game,targetDay=day){
 if(!approved||!uid||!client)return;
 const k=targetDay+"|"+game;
 clearTimeout(persistTimers[k]);
 persistTimers[k]=setTimeout(()=>{void flushCloud(game,targetDay);},380);
}
function flushCloud(game,targetDay=day){
 if(!approved||!uid||!client)return Promise.resolve();
 const snapshot=localGet(game,targetDay);
 if(!snapshot?._savedAt)return Promise.resolve();
 const key=targetDay+"|"+game;
 const previous=persistPromises[key]||Promise.resolve();
 persistPromises[key]=previous.catch(()=>{}).then(async()=>{
  const {error}=await client.from("uentzoul_extras_progress").upsert({
   user_id:uid,game,challenge_day:targetDay,state:snapshot,updated_at:new Date().toISOString()
  },{onConflict:"user_id,game,challenge_day"});
  if(error){console.warn("Extras: sincronização adiada.",error.message);return;}
  const newest=localGet(game,targetDay);
  if(newest?._savedAt!==snapshot._savedAt)scheduleCloud(game,targetDay);
 });
 return persistPromises[key];
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
 document.querySelectorAll("[data-game]").forEach(b=>{
  if(b.dataset.game==="tetris")b.hidden=!isAdmin;
  b.setAttribute("aria-selected",String(b.dataset.game===active));
 });
 document.querySelector(".extras-tabs")?.classList.toggle("three-games",!isAdmin);
}
function switchGame(game){
 if(!approved||!GAMES.includes(game)||(game==="tetris"&&!isAdmin))return;
 active=game;
 renderTabs();updateArchiveControls();renderGame();
 try{const url=new URL(location.href);url.searchParams.set("game",game);history.replaceState(null,"",url);}catch(_){}
}

function installExtrasWideHost(){
 if(window.parent===window)return;
 try{
  const parent=window.parent,doc=parent.document;
  if(parent.location.origin!==location.origin||!doc?.head||!doc?.body||!doc.createElement)return;
  // Elimina controles e regras antigos mesmo quando o iframe é reaberto sem recarregar o site.
  doc.getElementById("pmExtrasWideStyle")?.remove();
  doc.getElementById("pmExtrasSidebarToggle")?.remove();
  doc.body.classList.remove("pm-extras-sidebar-open");
  // Mantém a barra esquerda original e sua navegação; só amplia a área útil do Extras.
  const style=doc.createElement("style");
  style.id="pmExtrasWideStyle";
  style.textContent="@media(min-width:761px){"+
   "body:has(#psicoExtrasFrame) #profileSidebar,body:has(#psicoExtrasFrame) #pmRightHandle{display:none!important}"+
   "body:has(#psicoExtrasFrame) .app>.main{max-width:none!important;min-width:0!important;width:auto!important;flex:1 1 0!important;padding:18px clamp(12px,2vw,32px) 35px!important}"+
   "body:has(#psicoExtrasFrame) .psico-extras-embed{max-width:none!important;width:100%!important}"+
  "}";
  doc.head.appendChild(style);
 }catch(e){console.warn("Extras: largura ampliada indisponível.",e?.message||e);}
}
function getAdminAnswersFor(targetDay,game=active,mode=psicoMode){
 if(game==="psico")return getPsicoWordsFor(targetDay,mode).map(item=>item.word);
 if(game==="contexto")return [getContextAnswerFor(targetDay)];
 if(game==="conexo")return getConnectionGroupsFor(targetDay).map(g=>({title:g.title,terms:g.terms.slice()}));
 return [];
}
function updateAdminAnswers(){
 const button=$("adminAnswersToggle"),panel=$("adminAnswersPanel");
 if(!button||!panel)return;
 const allowed=approved&&isAdmin&&active!=="tetris";
 button.hidden=!allowed;
 if(!allowed){panel.hidden=true;button.setAttribute("aria-expanded","false");return;}
 button.setAttribute("aria-expanded",String(adminAnswersOpen));
 button.textContent=adminAnswersOpen?"Ocultar respostas":"Revelar respostas";
 panel.hidden=!adminAnswersOpen;
 if(!adminAnswersOpen)return;
 const gameLabel=active==="psico"?"PSICO "+PSICO_MODES[psicoMode].label:active==="conexo"?"VÍNCULO":"CONTEXTO";
 const solutions=getAdminAnswersFor(day);
 const detail=active==="conexo"?
  '<div class="admin-answers-groups">'+solutions.map(g=>'<div><strong>'+esc(g.title)+'</strong><small>'+g.terms.map(esc).join(" · ")+'</small></div>').join("")+'</div>':
  '<div class="admin-answers-words">'+solutions.map((term,i)=>'<span><b>'+(active==="psico"&&solutions.length>1?(i+1)+'. ':"")+esc(term)+'</b></span>').join("")+'</div>';
 panel.innerHTML='<div class="admin-answers-heading"><strong>Respostas — '+esc(gameLabel)+'</strong><small>Somente administradores · data selecionada</small></div>'+
  '<div class="admin-answers-list"><section class="admin-answers-day"><strong class="admin-answers-date">'+esc(dateLabel(day))+'</strong>'+detail+'</section></div>';
 requestHeight();
}

function renderGame(){
 const host=$("gameHost");
 if(!host||!approved)return;
 if(active==="tetris"&&isAdmin){
  host.innerHTML='<div class="game-panel"><div class="game-head"><div><span class="game-tag">Sprint · 40 Lines</span><h2>TetrisZoul</h2><p>O mesmo jogo independente que já existia no Admin Config, agora reunido com os outros Extras.</p></div><span class="game-stat">40 linhas</span></div>'+
   '<div class="tetris-tools"><span class="section-note">Configurações, skins e recordes permanecem no TetrisZoul.</span><a href="./tetriszoul.html?v=20261120-softdrop-v3" target="_blank" rel="noopener noreferrer">Abrir jogo em tela própria ↗</a></div>'+
   '<iframe class="tetris-frame" id="extrasTetrisFrame" src="./tetriszoul.html?v=20261120-softdrop-v3" title="TetrisZoul — 40 linhas" loading="lazy" allow="fullscreen"></iframe></div>';
 }else if(active==="psico")renderPsico();
 else if(active==="conexo")renderConexo();
 else if(active==="contexto")renderContexto();
 updateAdminAnswers();
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
function getPsicoWordsFor(targetDay,mode){
 const list=getPsicoDayWordsFor(targetDay);
 if(mode==="classico")return list.slice(0,1);
 if(mode==="duplo")return list.slice(1,3);
 if(mode==="quadruplo")return list.slice(3,7);
 return [];
}
function getPsicoWords(){return getPsicoWordsFor(day,psicoMode);}
function psicoState(){
 const root=states.psico;
 if(psicoMode==="classico")return root;
 if(!root.variants||typeof root.variants!=="object")root.variants={};
 if(!root.variants[psicoMode]||typeof root.variants[psicoMode]!=="object")
  root.variants[psicoMode]={guesses:[],draft:"",done:false,won:false};
 return root.variants[psicoMode];
}
function normalizePsico(){
 const st=psicoState(),limit=PSICO_MODES[psicoMode].attempts;
 if(!Array.isArray(st.guesses))st.guesses=[];
 st.guesses=st.guesses.filter(v=>typeof v==="string"&&clean(v).length===5).slice(0,limit);
 if(!Array.isArray(st.cells)||st.cells.length!==5){
  const old=clean(st.draft||"").replace(/[^A-Z]/g,"").slice(0,5);
  st.cells=Array.from({length:5},(_,i)=>old[i]||"");
 }
 st.cells=st.cells.map(v=>clean(v).replace(/[^A-Z]/g,"").slice(0,1));
 st.cursor=Math.max(0,Math.min(4,Number.isInteger(st.cursor)?st.cursor:st.cells.findIndex(v=>!v)));
 st.solvedAt=getPsicoWords().map(({word})=>{
  const found=st.guesses.findIndex(guess=>clean(guess)===clean(word));
  return found<0?0:found+1;
 });
 st.won=st.solvedAt.every(Boolean);
 st.done=st.won||st.guesses.length>=limit;
 if(st.done)st.cursor=0;
 return st;
}
function setPsicoMode(next){
 if(!approved||active!=="psico"||!PSICO_MODES[next]||next===psicoMode)return;
 psicoMode=next;states.psico.mode=next;psicoFlippingRow=-1;
 feedback={game:"",message:"",kind:""};
 store("psico");renderPsico();updateAdminAnswers();
}
function psicoNativeFocus(){
 const input=$("psicoTypeBox");
 if(input)input.focus({preventScroll:true});
}
function selectPsicoCell(index,shouldFocus=true){
 const st=normalizePsico();
 if(st.done||!Number.isInteger(index)||index<0||index>4)return;
 st.cursor=index;store("psico",false);syncPsicoDraft();
 if(shouldFocus)psicoNativeFocus();
}
function syncPsicoDraft(changedIndex=-1){
 const st=normalizePsico();
 document.querySelectorAll("[data-psico-cell]").forEach(node=>{
  const index=Number(node.dataset.psicoCell),letter=st.cells[index]||"";
  node.textContent=letter;
  node.className="psico-cell editable"+(letter?" filled":"")+(index===st.cursor?" cursor-active":"");
  node.setAttribute("aria-label","Posição "+(index+1)+": "+(letter||"vazia")+(index===st.cursor?", selecionada":""));
  if(index===changedIndex){
   node.classList.remove("psico-pop");void node.offsetWidth;node.classList.add("psico-pop");
  }
 });
 const submit=$("psicoSubmit");if(submit)submit.disabled=st.cells.some(v=>!v);
}
function renderPsico(){
 const cfg=PSICO_MODES[psicoMode],answers=getPsicoWords(),st=normalizePsico(),multi=cfg.boards>1;
 const boards=answers.map((answer,boardIndex)=>{
  const solvedAt=st.solvedAt[boardIndex],rows=[];
  for(let r=0;r<cfg.attempts;r++){
   let letters=[],colors=[];
   const locked=r<st.guesses.length&&(!solvedAt||r<solvedAt);
   const editable=r===st.guesses.length&&!st.done&&!solvedAt;
   if(locked){letters=clean(st.guesses[r]).split("");colors=wordColors(st.guesses[r],answer.word);}
   else if(editable)letters=st.cells;
   rows.push('<div class="psico-row'+(r===psicoFlippingRow&&locked?' psico-revealing':'')+'" role="row" aria-label="Palavra '+(boardIndex+1)+', tentativa '+(r+1)+'">'+
    Array.from({length:5},(_,i)=>{
     const letter=letters[i]||"",status=colors[i]||(letter?"filled":"");
     const selected=editable&&i===st.cursor;
     const cls="psico-cell "+status+(editable?" editable":"")+(selected?" cursor-active":"");
     return editable?'<button type="button" class="'+cls+'" data-psico-cell="'+i+'" role="gridcell" aria-label="Posição '+(i+1)+': '+(letter||"vazia")+(selected?", selecionada":"")+'">'+esc(letter)+'</button>':
      '<div class="'+cls+'" role="gridcell" aria-label="'+esc(letter||"vazio")+' '+esc(status)+'">'+esc(letter)+'</div>';
    }).join("")+'</div>');
  }
  const caption=multi?'<div class="psico-board-caption"><strong>Palavra '+(boardIndex+1)+'</strong><span'+(solvedAt?' class="is-solved"':'')+'>'+(solvedAt?'✓ Resolvida':'Em andamento')+'</span></div>':"";
  return '<section class="psico-board-column'+(solvedAt?' psico-board-solved':'')+'" aria-label="Tabuleiro '+(boardIndex+1)+'">'+caption+
   '<div class="psico-board'+(multi?' psico-board-multi':'')+'" role="grid" aria-label="'+cfg.attempts+' tentativas, cinco letras por linha">'+rows.join("")+'</div></section>';
 });
 const boardsHtml=multi?'<div class="psico-multi-grid psico-multi-'+psicoMode+'">'+boards.join("")+'</div>':boards[0];
 let result="";
 if(st.done){
  const title=st.won?(multi?"Todas as palavras encontradas!":"Boa! Palavra encontrada."):"Fim das tentativas.";
  const words=answers.map(answer=>'<b>'+esc(answer.word)+'</b>').join(" · ");
  const explanation=multi?"Respostas: "+words+".":'A palavra era '+words+'. '+esc(answers[0].hint)+' · '+esc(answers[0].area)+'.';
  result='<div class="finish-box"><strong>'+title+'</strong><p>'+explanation+' Escolha outro dia para jogar novamente.</p></div>';
 }
 const editor=st.done?"":'<form id="psicoForm" class="psico-native-form" autocomplete="off">'+
  '<label class="psico-input-visually-hidden" for="psicoTypeBox">Digite as letras usando o teclado do dispositivo</label>'+
  '<input id="psicoTypeBox" type="text" inputmode="text" enterkeyhint="done" autocapitalize="characters" autocomplete="off" autocorrect="off" spellcheck="false" aria-label="Digite as letras na posição selecionada" maxlength="24">'+
  '<button type="submit" class="primary-action" id="psicoSubmit" '+(st.cells.some(v=>!v)?"disabled":"")+'>Enviar palavra</button></form>';
 const switcher='<nav class="psico-mode-switch" aria-label="Modo de jogo">'+
  Object.keys(PSICO_MODES).map(key=>'<button type="button" data-psico-mode="'+key+'" aria-pressed="'+(key===psicoMode)+'"'+
   (key===psicoMode?' class="is-current"':'')+'>'+PSICO_MODES[key].label+'</button>').join("")+'</nav>';
 const solvedCount=st.solvedAt.filter(Boolean).length;
 $("gameHost").innerHTML='<div class="game-panel"><div class="psico-game-heading"><h2 class="psico-wordmark">PSICO</h2></div>'+
  switcher+'<div class="psico-mode-status"><span class="game-stat">'+
  (st.done?(st.won?"Concluído":"Encerrado"):(st.guesses.length+1)+" / "+cfg.attempts)+'</span></div>'+(multi?'<p class="psico-multi-status" aria-live="polite">'+solvedCount+' de '+cfg.boards+' palavras resolvidas · '+cfg.attempts+' tentativas compartilhadas</p>':"")+
  boardsHtml+feedbackHtml("psico")+editor+result+'</div>';
 requestHeight();
}
function inputPsico(key){
 if(active!=="psico")return;
 const st=normalizePsico();
 if(st.done)return;
 let changed=-1;
 if(key==="BACK"||key==="DELETE"){
  if(st.cells[st.cursor]){changed=st.cursor;st.cells[st.cursor]="";}
  else if(st.cursor>0){st.cursor--;changed=st.cursor;st.cells[st.cursor]="";}
  store("psico",false);syncPsicoDraft(changed);return;
 }
 if(key==="LEFT"||key==="RIGHT"||key==="HOME"||key==="END"){
  st.cursor=key==="LEFT"?Math.max(0,st.cursor-1):key==="RIGHT"?Math.min(4,st.cursor+1):key==="HOME"?0:4;
  store("psico",false);syncPsicoDraft();return;
 }
 if(key==="ENTER"){
  if(st.cells.some(v=>!v)){
   setFeedback("psico","Preencha as cinco posições antes de enviar.","error");
   const row=document.querySelector(".psico-row .cursor-active")?.parentElement;
   if(row){row.classList.remove("psico-shake");void row.offsetWidth;row.classList.add("psico-shake");}
   return;
  }
  st.guesses.push(st.cells.join(""));
  st.cells=Array(5).fill("");st.draft="";st.cursor=0;
  normalizePsico();psicoFlippingRow=st.guesses.length-1;
  store("psico");
  feedback={game:"psico",message:st.won?"Acertou!":st.done?"As tentativas terminaram.":"Continue tentando.",kind:st.won?"ok":""};
  renderPsico();return;
 }
 const chars=clean(key).replace(/[^A-Z]/g,"");
 if(!chars)return;
 for(const letter of chars){
  changed=st.cursor;st.cells[st.cursor]=letter;
  let next=-1;
  for(let offset=1;offset<=5;offset++){
   const index=(changed+offset)%5;
   if(!st.cells[index]){next=index;break;}
  }
  st.cursor=next>=0?next:Math.min(4,changed+1);
 }
 st.draft=st.cells.join("");feedback={game:"",message:"",kind:""};
 store("psico",false);syncPsicoDraft(changed);
 const message=document.querySelector(".feedback");
 if(message){message.textContent="";message.className="feedback";}
}

function getConnectionGroupsFor(targetDay){
 const chosen=[],seen=new Set();
 const canPick=group=>{
  const unique=group.terms.map(cleanTerm);
  return new Set(unique).size===4&&!unique.some(t=>seen.has(t));
 };
 const add=group=>{chosen.push(group);group.terms.map(cleanTerm).forEach(term=>seen.add(term));};
 if(targetDay===ARCHIVE_START){
  LAUNCH_GROUPS.forEach(add);
 }else{
  const pool=shuffle(DATA.connectionGroups,dayNumber(targetDay)*104729+17);
  const first=pool.find(canPick);
  if(first){
   add(first);
   // Uma segunda categoria temática próxima provoca associações plausíveis,
   // sem introduzir peças duplicadas ou soluções contraditórias.
   const close=pool.find(g=>g!==first&&g.theme&&g.theme===first.theme&&canPick(g));
   if(close)add(close);
  }
  for(const group of pool){if(chosen.length===4)break;if(!chosen.includes(group)&&canPick(group))add(group);}
 }
 if(chosen.length!==4)throw Error("Não foi possível montar quatro grupos exclusivos.");
 return chosen.map((g,i)=>({...g,level:i}));
}
function initConnections(){
 const chosen=getConnectionGroupsFor(day);
 connectionGroups=chosen;
 connectionTiles=shuffle(chosen.flatMap((group,i)=>group.terms.map((word,j)=>({id:i+"-"+j,word,group:i}))),ordinal*83293+101);
 const st=states.conexo;
 if(!Array.isArray(st.solved))st.solved=[];
 if(!Array.isArray(st.selected))st.selected=[];
 if(!Array.isArray(st.wrong))st.wrong=[];
 if(!Array.isArray(st.shuffled))st.shuffled=[];
 if(!Array.isArray(st.marked))st.marked=[];
 st.solved=[...new Set(st.solved.filter(i=>Number.isInteger(i)&&i>=0&&i<4))];
 const ids=new Set(connectionTiles.filter(t=>!st.solved.includes(t.group)).map(t=>t.id));
 st.selected=st.selected.filter(id=>ids.has(id)).slice(0,4);
 st.marked=st.marked.filter(id=>ids.has(id));
 st.shuffled=st.shuffled.filter(id=>ids.has(id));
 // Erros nunca encerram uma partida. Partidas antigas interrompidas podem continuar.
 st.done=st.solved.length===4;
 st.won=st.done;
}
function renderConexo(){
 const st=states.conexo,solved=st.solved||[];
 const show=connectionGroups.map((group,i)=>({group,i})).filter(x=>solved.includes(x.i));
 const remaining=connectionTiles.filter(t=>!solved.includes(t.group));
 const order=new Map((st.shuffled||[]).map((id,i)=>[id,i]));
 const sorted=remaining.sort((a,b)=>(order.get(a.id)??1000+connectionTiles.indexOf(a))-(order.get(b.id)??1000+connectionTiles.indexOf(b)));
 const found=show.map(({group})=>'<div class="conexo-group l'+(group.level%4)+'"><strong>'+esc(group.title)+'</strong><small>'+group.terms.map(esc).join(" · ")+'</small></div>').join("");
 const end=st.done?'<div class="finish-box"><strong>Quatro grupos encontrados!</strong><p>Você resolveu o VÍNCULO deste dia. Escolha outra data para jogar novamente.</p></div>':'';
 $("gameHost").innerHTML='<div class="game-panel"><div class="game-head"><div><h2>VÍNCULO</h2></div><span class="game-stat">'+solved.length+' / 4 grupos</span></div>'+
  '<div class="conexo-solved">'+found+'</div>'+
  '<div class="conexo-grid" aria-label="Palavras do VÍNCULO — arraste para organizar">'+sorted.map(t=>'<button class="conexo-tile '+(st.selected.includes(t.id)?"selected ":"")+(st.marked.includes(t.id)?"marked":"")+'" data-tile="'+esc(t.id)+'" type="button" aria-pressed="'+String(st.selected.includes(t.id))+'" aria-label="'+esc(t.word)+(st.marked.includes(t.id)?" (marcada)":"")+'">'+esc(t.word)+'</button>').join("")+'</div>'+
  feedbackHtml("conexo")+
  (!st.done?'<div class="game-actions"><button type="button" class="secondary-action" data-conexo="shuffle">Misturar</button><button type="button" class="secondary-action" data-conexo="deselect">Desmarcar seleção</button><button type="button" class="secondary-action'+(conexoMarkMode?' conexo-mark-mode':'')+'" data-conexo="markmode" aria-pressed="'+String(conexoMarkMode)+'">Marcar palavras</button><button type="button" class="primary-action" data-conexo="submit" '+(st.selected.length!==4?"disabled":"")+' >Enviar ('+st.selected.length+'/4)</button></div>':"")+
  end+'</div>';
 requestHeight();
}
function tileMark(id){
 const st=states.conexo;if(st.done)return;
 st.marked=st.marked||[];
 st.marked=st.marked.includes(id)?st.marked.filter(x=>x!==id):[...st.marked,id];
 store("conexo");renderConexo();
}
function tileClick(id){
 const st=states.conexo;if(st.done)return;
 if(conexoMarkMode){tileMark(id);return;}
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
  if(!st.wrong.includes(code))st.wrong.push(code);
  if(st.wrong.length>100)st.wrong=st.wrong.slice(-100);
  const count=Math.max(...[0,1,2,3].map(group=>terms.filter(t=>t.group===group).length));
  feedback={game:"conexo",message:count===3?"Faltou uma palavra!":"Essas quatro palavras não formam um grupo.",kind:"error"};
 }
 st.selected=[];st.done=st.solved.length===4;st.won=st.done;
 store("conexo");renderConexo();
}
function conexoAction(action){
 const st=states.conexo;
 if(action==="submit"){conexoSubmit();return;}
 if(action==="markmode"){conexoMarkMode=!conexoMarkMode;renderConexo();return;}
 if(action==="deselect"){st.selected=[];store("conexo",false);renderConexo();return;}
 if(action==="shuffle"){
  const remaining=connectionTiles.filter(t=>!st.solved.includes(t.group));
  st.shuffled=shuffle(remaining,Math.floor(Math.random()*4294967295)+1).map(t=>t.id);
  store("conexo");renderConexo();
 }
}
function conexoGridFlip(grid,modify){
 const tiles=[...grid.querySelectorAll(".conexo-tile")];
 const before=new Map(tiles.map(el=>[el,el.getBoundingClientRect()]));
 // Interrompe a animação anterior após medir a posição visível.
 tiles.forEach(el=>el.getAnimations?.().forEach(anim=>anim.cancel()));
 modify();
 for(const el of tiles){
  if(el.classList.contains("drag-origin"))continue;
  const prev=before.get(el),now=el.getBoundingClientRect();
  const x=prev.left-now.left,y=prev.top-now.top;
  if((Math.abs(x)>0.5||Math.abs(y)>0.5)&&el.animate){
   el.animate([{transform:"translate("+x+"px,"+y+"px)"},{transform:"translate(0,0)"}],
    {duration:230,easing:"cubic-bezier(.22,1,.36,1)"});
  }
 }
}
function conexoDragStart(e){
 if(!approved||active!=="conexo"||states.conexo.done||e.button!==0)return;
 const tile=e.target.closest(".conexo-tile[data-tile]"),grid=tile?.closest(".conexo-grid");
 if(!grid)return;
 conexoDrag={tile,grid,pointerId:e.pointerId,x:e.clientX,y:e.clientY,started:false,ghost:null};
}
function conexoDragMove(e){
 const drag=conexoDrag;
 if(!drag||drag.pointerId!==e.pointerId)return;
 const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
 if(!drag.started){
  if(Math.hypot(dx,dy)<7)return;
  drag.started=true;suppressConexoClick=true;
  // Captura no grid estável: mover uma peça no DOM não perde o gesto.
  try{drag.grid.setPointerCapture(e.pointerId);}catch(_){}
  const rect=drag.tile.getBoundingClientRect();
  drag.ghost=drag.tile.cloneNode(true);
  drag.ghost.removeAttribute("data-tile");
  drag.ghost.setAttribute("aria-hidden","true");
  drag.ghost.classList.add("conexo-drag-ghost");
  Object.assign(drag.ghost.style,{left:rect.left+"px",top:rect.top+"px",width:rect.width+"px",height:rect.height+"px"});
  document.body.appendChild(drag.ghost);
  drag.tile.classList.add("drag-origin");
  drag.grid.classList.add("is-dragging");
 }
 if(e.cancelable)e.preventDefault();
 drag.ghost.style.transform="translate3d("+dx+"px,"+dy+"px,0) scale(1.045)";
 const area=drag.grid.getBoundingClientRect();
 if(e.clientX<area.left-18||e.clientX>area.right+18||e.clientY<area.top-18||e.clientY>area.bottom+18)return;
 const tiles=[...drag.grid.querySelectorAll(".conexo-tile")];
 let targetIndex=-1,distance=Infinity;
 tiles.forEach((el,i)=>{
  const rect=el.getBoundingClientRect();
  const d=Math.pow(e.clientX-(rect.left+rect.width/2),2)+Math.pow(e.clientY-(rect.top+rect.height/2),2);
  if(d<distance){distance=d;targetIndex=i;}
 });
 const from=tiles.indexOf(drag.tile);
 if(targetIndex===from||targetIndex<0)return;
 const other=tiles[targetIndex];
 const next=targetIndex>from?other.nextElementSibling:other;
 conexoGridFlip(drag.grid,()=>drag.grid.insertBefore(drag.tile,next));
}
function conexoDragEnd(e){
 const drag=conexoDrag;if(!drag||drag.pointerId!==e.pointerId)return;
 conexoDrag=null;
 if(!drag.started)return;
 if(drag.grid.hasPointerCapture?.(drag.pointerId)){
  try{drag.grid.releasePointerCapture(drag.pointerId);}catch(_){}
 }
 drag.ghost?.remove();
 drag.tile.classList.remove("drag-origin");
 drag.grid.classList.remove("is-dragging");
 states.conexo.shuffled=[...drag.grid.querySelectorAll("[data-tile]")].map(el=>el.dataset.tile);
 store("conexo");
 renderConexo();
 setTimeout(()=>{suppressConexoClick=false;},300);
}
function displayTerm(value){
 const v=cleanTerm(value),found=contextTerms.get(v);
 return found?.label||String(value??"").toLowerCase();
}
function getContextAnswerFor(targetDay){
 const n=dayNumber(targetDay);
 const answer=cleanTerm(targetDay===ARCHIVE_START?"polarizacao":TARGETS[((n*11+5)%TARGETS.length+TARGETS.length)%TARGETS.length]);
 if(!isContextWord(answer))throw Error("Resposta do Contexto deve ter uma palavra: "+answer);
 return answer;
}
function initContexto(){
 contextTerms=new Map();contextFreeRanks=new Map();
 DATA.semanticDomains.forEach((domain,i)=>domain.terms.forEach(term=>{
  const key=cleanTerm(term);
  if(!isContextWord(key))return;
  if(!contextTerms.has(key))contextTerms.set(key,{label:term,domains:new Set()});
  contextTerms.get(key).domains.add(i);
 }));
 contextTarget=getContextAnswerFor(day);
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
  // Stable tie breaker only. Proximity comes from curated subject-domain links.
  score+=Math.max(0,12-Math.abs(word.length-contextTarget.length));
  score+=((word.charCodeAt(0)*43+word.length*17+ordinal%31)%97)/1000;
  return {word,score};
 }).sort((a,b)=>b.score-a.score||a.word.localeCompare(b.word,"pt-BR"));
 contextRankings=new Map(rankings.map((item,i)=>[item.word,i+1]));
 const st=states.contexto;
 const previous=Array.isArray(st.guesses)?st.guesses:[];
 const seen=new Set();
 // Descartar respostas antigas com mais de uma palavra, repetidas ou malformadas.
 const valid=previous.filter(g=>{
  if(!g||typeof g.word!=="string"||g.word.length>60||!isContextWord(g.word))return false;
  const word=cleanTerm(g.word);
  if(seen.has(word))return false;
  seen.add(word);return true;
 }).slice(-500);
 const won=valid.some(g=>cleanTerm(g.word)===contextTarget);
 const changed=valid.length!==previous.length||!Array.isArray(st.guesses)||st.won!==won||st.done!==won;
 st.guesses=valid;st.won=won;st.done=won;
 if(changed){
  // Não restaurar palpites compostos do cache antigo ou do Supabase.
  if(approved)st._savedAt=Math.max(Date.now(),(Number(st._savedAt)||0)+1);
  localSet("contexto");
  if(approved)scheduleCloud("contexto",day);
 }
}
function contextRankTerm(guess){
 const word=cleanTerm(guess);
 if(!isContextWord(word))return Infinity;
 if(word===contextTarget)return 1;
 const known=contextRankings.get(word);
 if(known)return known;
 if(contextFreeRanks.has(word))return contextFreeRanks.get(word);
 // Aceita texto livre: aproxima variantes morfológicas de conceitos conhecidos,
 // mantendo palpites desconhecidos mais distantes em vez de impedir a tentativa.
 const nearby=(NEAR[contextTarget.toLowerCase()]||[]).map(cleanTerm).filter(isContextWord);
 const direct=nearby.indexOf(word);
 if(direct>=0){const rank=2+direct*5;contextFreeRanks.set(word,rank);return rank;}
 const grams=value=>{
  const s=" "+value+" ",result=new Set();
  for(let i=0;i<s.length-2;i++)result.add(s.slice(i,i+3));
  return result;
 };
 const a=grams(word);let best=0,rank=10000;
 for(const [term,index] of contextRankings){
  if(term.length<3||word.length<3)continue;
  const b=grams(term);let shared=0;
  for(const g of a)if(b.has(g))shared++;
  const similarity=shared/Math.max(1,new Set([...a,...b]).size);
  if(similarity>best){best=similarity;rank=index;}
 }
 if(best>=.42){const result=Math.max(2,Math.round(rank+(1-best)*45));contextFreeRanks.set(word,result);return result;}
 let hash=2166136261;
 for(const char of word)hash=Math.imul(hash^char.charCodeAt(0),16777619)>>>0;
 const result=900+hash%9101;
 contextFreeRanks.set(word,result);return result;
}
function contextHints(){
 const item=contextTerms.get(contextTarget);
 const first=[...item.domains][0];
 return DATA.semanticDomains[first]?.name||"Conteúdo das disciplinas";
}
function renderContexto(){
 const st=states.contexto;
 const all=contextTerms.size,tries=st.guesses.length;
 const best=st.guesses.reduce((m,g)=>Math.min(m,contextRankTerm(g.word)),Infinity);
 const sorted=st.guesses.slice().sort((a,b)=>contextRankTerm(a.word)-contextRankTerm(b.word));
 const results=sorted.map(g=>{
  const rank=contextRankTerm(g.word);
  const closeness=Math.max(3,Math.round(100/(1+Math.max(0,rank-1)/24)));
  // Variação contínua: longe = vermelho (0°), médio = amarelo (60°), perto = verde (120°).
  // Usar a mesma proximidade do preenchimento preserva a ordem semântica das tentativas.
  const hue=Math.round(120*Math.pow((closeness-3)/97,.72));
  return '<div class="context-guess"><span class="context-fill" style="width:'+closeness+'%;--context-hue:'+hue+'"></span><b>'+esc(displayTerm(g.word))+'</b><small>#'+rank+'</small></div>';
 }).join("");
 const result=st.won?'<div class="finish-box"><strong>Você encontrou o termo!</strong><p>'+esc(displayTerm(contextTarget))+' · '+tries+' palpite'+(tries===1?"":"s")+'. Escolha outra data para continuar jogando.</p></div>':"";
 $("gameHost").innerHTML=
  '<div class="game-panel"><div class="game-head"><div><h2>CONTEXTO</h2></div><span class="game-stat">'+(st.won?"Resolvido":"Melhor #"+(tries?best:"—"))+'</span></div>'+
  '<div class="context-layout">'+
  (st.won?"":'<form id="contextForm" class="context-form" autocomplete="off"><input id="contextGuess" aria-label="Uma palavra de Psicologia" placeholder="Digite uma palavra..." maxlength="60" pattern="[A-Za-zÀ-ÖØ-öø-ÿ]+" title="Digite apenas uma palavra, sem espaços." autocapitalize="off" autocomplete="off" autocorrect="off" spellcheck="false" required><button class="primary-action" type="submit">Enviar</button></form>')+
  '<div class="context-help">'+
  (!st.done?'<button class="secondary-action" type="button" id="contextHintBtn" '+(st.hint?"disabled":"")+'>Dica</button>':"")+'</div>'+
  (st.hint?'<div class="context-hint">Área do termo secreto: <b>'+esc(contextHints())+'</b></div>':"")+
  feedbackHtml("contexto")+
  (tries?'<p class="context-status">'+tries+' palpite'+(tries===1?"":"s")+'</p>':'')+
  result+'<div class="context-results">'+results+'</div></div></div>';
 requestHeight();
}
function contextSubmit(text){
 const guess=cleanTerm(text),st=states.contexto;
 if(st.done||!guess)return;
 if(!isContextWord(text)){
  setFeedback("contexto","Digite apenas uma palavra, sem espaços ou expressões.","error");
  return;
 }
 if(st.guesses.some(g=>cleanTerm(g.word)===guess)){setFeedback("contexto","Você já tentou essa palavra.","error");return;}
 st.guesses.push({word:guess});st.won=guess===contextTarget;st.done=st.won;
 if(st.guesses.length>500)st.guesses=st.guesses.slice(-500);
 store("contexto");
 feedback={game:"contexto",message:st.won?"Boa! Encontrou a palavra.":"Palpite registrado.",kind:st.won?"ok":""};
 renderContexto();
 if(!st.done)$("contextGuess")?.focus();
}
function hostLogin(){
 // Mesma origem, mesmo cliente e mesma sessão usados pela página principal.
 // Não criar outro Supabase Client em um iframe que pertence ao próprio site.
 try{
  if(window.parent===window||window.parent.location.origin!==location.origin)return null;
  const auth=window.parent.uentzoulAIAuth;
  const shared=auth?.client?.();
  return shared?.auth&&shared?.from?{auth,client:shared}:null;
 }catch(_){return null;}
}
async function loadStandaloneClient(){
 if(!window.supabase?.createClient){
  await new Promise((resolve,reject)=>{
   const script=document.createElement("script");
   script.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
   script.onload=resolve;script.onerror=()=>reject(Error("Não foi possível carregar a autenticação."));
   document.head.appendChild(script);
  });
 }
 if(!window.supabase?.createClient)throw Error("Não foi possível carregar a autenticação.");
 return window.supabase.createClient(SB_URL,SB_KEY);
}
function showAuthError(message){
 document.documentElement.classList.remove("extras-booting");
 approved=false;
 $("extrasApp").hidden=true;
 $("extrasGate").hidden=false;
 $("extrasGateStatus").textContent=message;
 requestHeight();
}
function followSiteTheme(){
 try{
  const parentTheme=window.parent!==window?window.parent.document.documentElement.dataset.theme:"";
  const theme=parentTheme||localStorage.getItem("psicomoodle-theme");
  document.documentElement.dataset.theme=theme==="dark"?"dark":"light";
 }catch(_){document.documentElement.dataset.theme="light";}
}
// Entrada direta em extras.html também respeita a limitação para PC e tablet.
function isExtrasPhone(){
 try{
  if(window.parent!==window&&window.parent.location.origin===location.origin&&
     typeof window.parent.PSICO_NOTEBOOK_IS_PHONE==='function')
   return Boolean(window.parent.PSICO_NOTEBOOK_IS_PHONE());
 }catch(_){}
 const nav=typeof navigator!=='undefined'?navigator:null;
 if(!nav)return false;
 const ua=String(nav.userAgent||''),platform=String(nav.platform||'');
 const touches=Number(nav.maxTouchPoints)||0;
 const display=typeof screen!=='undefined'?screen:null;
 const shortSide=Math.min(display?.width||0,display?.height||0);
 if(/iPhone|iPod|Windows Phone|IEMobile/i.test(ua))return true;
 if(/iPad|Tablet|Kindle|Silk|PlayBook|Nexus 7|Nexus 10/i.test(ua)||
    (/Android/i.test(ua)&&!/Mobile/i.test(ua)))return false;
 if(nav.userAgentData?.mobile===true)return true;
 if(/MacIntel|Macintosh/i.test(platform+' '+ua)&&touches>1)return shortSide>0&&shortSide<600;
 if(/Android[^)]*Mobile|Mobile/i.test(ua))return true;
 return !!(window.matchMedia?.('(pointer: coarse)')?.matches&&touches>0&&shortSide>0&&shortSide<600);
}
async function start(){
 if(isExtrasPhone()){showAuthError('Extras disponível somente em computador ou tablet.');return;}
 if(authBusy||approved)return;
 authBusy=true;
 followSiteTheme();
 try{
  if(!DATA?.wordBank?.length)throw Error("Não foi possível carregar o vocabulário.");
  const host=hostLogin();
  if(host){
   client=host.client;
   const linked=host.auth.user?.();
   if(linked?.id)uid=linked.id;
   else{
    // O usuário pode estar autenticado enquanto o perfil principal sincroniza.
    const session=await host.auth.getSession?.();
    uid=session?.user?.id||null;
   }
  }else{
   client=await loadStandaloneClient();
   const result=await client.auth.getUser();
   uid=result.error?null:result.data?.user?.id||null;
  }
  if(!uid)throw Error("Abre tua conta no PsicoMoodle para acessar os jogos.");
  initializeDay();
  // Mostrar os jogos assim que a sessão principal estiver disponível.
  // Consulta de banco e permissão administrativa não podem bloquear a tela inteira.
  approved=true;
  installExtrasWideHost();
  document.documentElement.classList.remove("extras-booting");
  $("extrasGate").hidden=true;
  $("extrasApp").hidden=false;
  const requested=new URL(location.href).searchParams.get("game");
  const initial=GAMES.includes(requested)&&requested!=="tetris"?requested:"psico";
  switchGame(initial);
  // O cliente compartilhado publica eventos de login; jamais considerar
  // INITIAL_SESSION sem payload um logout da página principal.
  client.auth.onAuthStateChange((event,session)=>{
   if(event==="SIGNED_OUT"){
    if(host&&host.auth.user?.()?.id===uid)return;
    showAuthError("A sessão foi encerrada. Entra novamente pelo PsicoMoodle.");
   }else if(event==="SIGNED_IN"&&session?.user?.id&&session.user.id!==uid){
    approved=false;uid=null;void start();
   }
  });
  const enteredDay=day,enteredUid=uid;
  // O jogo abre mesmo quando o banco demora a responder; a sincronização
  // atualiza apenas se a conta e o dia ainda coincidirem.
  const [role]=await Promise.all([
   Promise.resolve(client.rpc("uentzoul_is_admin")).catch(e=>({error:e})),
   loadWordBank(),
   loadCloud(enteredDay)
  ]);
  if(!approved||enteredUid!==uid||enteredDay!==day)return;
  isAdmin=!role?.error&&role?.data===true;
  initConnections();initContexto();
  if(requested==="tetris"&&isAdmin)switchGame("tetris");
  else{renderTabs();updateArchiveControls();renderGame();}
  requestHeight();
 }catch(e){
  console.error("Extras: abertura interrompida",e);
  showAuthError(e?.message||"Não foi possível carregar os jogos.");
 }finally{authBusy=false;}
}
document.addEventListener("click",e=>{
 const answersToggle=e.target.closest("#adminAnswersToggle");
 if(answersToggle&&isAdmin&&active!=="tetris"){adminAnswersOpen=!adminAnswersOpen;updateAdminAnswers();return;}
 const calendarToggle=e.target.closest("#calendarToggle"),calendarPrev=e.target.closest("#calendarMonthPrev"),calendarNext=e.target.closest("#calendarMonthNext"),calendarDay=e.target.closest("[data-calendar-day]"),todayButton=e.target.closest("#archiveToday");
 if(calendarToggle){setCalendarOpen(!calendarOpen);return;}
 if(calendarPrev){calendarMonth(-1);return;}
 if(calendarNext){calendarMonth(1);return;}
 if(calendarDay){void selectArchiveDay(calendarDay.dataset.calendarDay);setCalendarOpen(false);return;}
 if(todayButton){void selectArchiveDay(dateBrazil());setCalendarOpen(false);return;}
 if(calendarOpen&&!e.target.closest("#calendarPopup"))setCalendarOpen(false);
 const tab=e.target.closest("[data-game]");
 if(tab){switchGame(tab.dataset.game);return;}
 if(active==="psico"){
  const mode=e.target.closest("[data-psico-mode]");
  if(mode){setPsicoMode(mode.dataset.psicoMode);return;}
  const cell=e.target.closest("[data-psico-cell]");
  if(cell){selectPsicoCell(Number(cell.dataset.psicoCell));return;}
 }
 if(active==="conexo"){
  const tile=e.target.closest("[data-tile]");
  if(tile){if(suppressConexoClick){suppressConexoClick=false;return;}tileClick(tile.dataset.tile);return;}
  const action=e.target.closest("[data-conexo]");
  if(action){conexoAction(action.dataset.conexo);return;}
 }
 if(active==="contexto"){
  if(e.target.closest("#contextHintBtn")){
   states.contexto.hint=true;store("contexto");renderContexto();return;
  }
 }
});
document.addEventListener("contextmenu",e=>{
 if(!approved||active!=="conexo")return;
 const tile=e.target.closest(".conexo-tile[data-tile]");
 if(!tile)return;
 e.preventDefault();tileMark(tile.dataset.tile);
});
document.addEventListener("dragstart",e=>{
 if(e.target.closest?.(".conexo-tile"))e.preventDefault();
});
document.addEventListener("pointerdown",e=>conexoDragStart(e));
document.addEventListener("pointermove",e=>conexoDragMove(e),{passive:false});
document.addEventListener("pointerup",e=>conexoDragEnd(e));
document.addEventListener("pointercancel",e=>conexoDragEnd(e));
document.addEventListener("beforeinput",e=>{
 if(e.target?.id!=="psicoTypeBox"||!approved||active!=="psico")return;
 if(e.inputType==="deleteContentBackward"||e.inputType==="deleteContentForward"){
  e.preventDefault();inputPsico("BACK");
 }
});
document.addEventListener("input",e=>{
 if(e.target?.id!=="psicoTypeBox"||!approved||active!=="psico"||e.isComposing)return;
 const raw=e.target.value;
 e.target.value="";
 if(raw)inputPsico(raw.slice(0,12));
});
document.addEventListener("compositionend",e=>{
 if(e.target?.id!=="psicoTypeBox"||!approved||active!=="psico")return;
 const raw=e.target.value;
 e.target.value="";
 if(raw)inputPsico(raw.slice(0,12));
});
document.addEventListener("submit",e=>{
 if(e.target.id==="psicoForm"){
  e.preventDefault();inputPsico("ENTER");return;
 }
 if(e.target.id==="contextForm"){
  e.preventDefault();
  const value=$("contextGuess")?.value||"";
  contextSubmit(value);
 }
});
document.addEventListener("keydown",e=>{
 if(e.key==="Escape"&&calendarOpen){setCalendarOpen(false);return;}
 if(!approved||active!=="psico"||e.ctrlKey||e.altKey||e.metaKey)return;
 const isNative=e.target?.id==="psicoTypeBox";
 if(isNative){
  const actions={Enter:"ENTER",Backspace:"BACK",Delete:"DELETE",ArrowLeft:"LEFT",ArrowRight:"RIGHT",Home:"HOME",End:"END"};
  if(actions[e.key]){e.preventDefault();inputPsico(actions[e.key]);}
  return; // Outras teclas são inseridas pelo teclado nativo e tratadas em 'input'.
 }
 if(e.target&&(/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)||e.target.isContentEditable||e.target.closest?.("button,a,[role=tab]")))return;
 const actions={Enter:"ENTER",Backspace:"BACK",Delete:"DELETE",ArrowLeft:"LEFT",ArrowRight:"RIGHT",Home:"HOME",End:"END"};
 if(actions[e.key]){e.preventDefault();inputPsico(actions[e.key]);return;}
 if(e.key.length===1&&/^[A-Za-zÀ-ÖØ-öø-ÿ]$/u.test(e.key)){
  e.preventDefault();inputPsico(e.key);
 }
});
let lastObservedToday=dateBrazil();
window.addEventListener("focus",()=>{
 if(!approved)return;
 const current=dateBrazil();
 if(current===lastObservedToday)return;
 const formerlyToday=lastObservedToday;
 lastObservedToday=current;
 // Só avança automaticamente se a pessoa estava no dia corrente.
 if(day===formerlyToday)void selectArchiveDay(current);
 else updateArchiveControls();
});
window.addEventListener("online",()=>{
 if(!approved)return;
 for(const game of CONTENT_GAMES)if(states[game]?._savedAt)void flushCloud(game);
});
window.addEventListener("resize",requestHeight);
if("ResizeObserver" in window){new ResizeObserver(requestHeight).observe(document.body);}
start();
})();