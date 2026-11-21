/* Concursos — Missões de estudo. Interface isolada; usa somente os dados e a persistência existentes. */
(()=>{
'use strict';
if(window.PMConcursoLudico)return;
const E=v=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const pick=(arr,n)=>arr.slice().sort(()=>Math.random()-.5).slice(0,n);
const stamp=()=>new Date().toISOString();
const DAY=86400000;
let ctx=null,identity=null,lastView=null,paused=false,focus=false,topicId='',step=0,session=null,face=false,subjectId='todos',page='dashboard',speaking=false;
const stateReset=()=>{lastView=null;paused=false;focus=false;topicId='';step=0;session=null;face=false;subjectId='todos';page='dashboard';stopSpeech();};
function stopSpeech(){try{window.speechSynthesis?.cancel();}catch(_){}speaking=false;}
const subjects=()=>ctx.data.subjects||[];
const topics=()=>ctx.data.topics||[];
const questions=()=>ctx.data.questions||[];
const cards=()=>ctx.data.flashcards||[];
const subject=id=>subjects().find(x=>x.id===id);
const topic=id=>topics().find(x=>x.id===id);
const qid=id=>questions().find(x=>x.id===id);
const cdid=id=>cards().find(x=>x.id===id);
function meta(){
 let m=ctx.store.notes.__concursos_ludico;
 if(!m||typeof m!=='object'||Array.isArray(m)){m={};ctx.store.notes.__concursos_ludico=m;}
 for(const k of ['lessons','glossary','review','cardDue'])if(!m[k]||typeof m[k]!=='object'||Array.isArray(m[k]))m[k]={};
 if(!Number.isFinite(m.sessions))m.sessions=0;
 return m;
}
function answers(){return questions().filter(q=>ctx.store.answers[q.id]&&Number.isInteger(ctx.store.answers[q.id].answer));}
function wrong(){return questions().filter(q=>ctx.store.answers[q.id]&&ctx.store.answers[q.id].correct===false);}
function due(){
 const m=meta(),now=Date.now();
 return questions().filter(q=>{
  const prior=ctx.store.answers[q.id],item=m.review[q.id];
  return (prior&&prior.correct===false)||!!(item&&new Date(item.due).getTime()<=now);
 });
}
const knownCards=()=>cards().filter(c=>ctx.store.flashcards[c.id]===true).length;
const lessonCount=()=>Object.keys(meta().lessons).filter(id=>topic(id)).length;
const button=(act,title,extra='',klass='ld-button')=>'<button type="button" class="'+klass+'" data-ld="'+act+'" '+extra+'>'+title+'</button>';
const percent=(a,b)=>b?Math.round(a/b*100):0;
function titlebar(){
 const remaining=Math.max(0,Math.ceil((new Date('2026-12-13T00:00:00-03:00').getTime()-Date.now())/DAY));
 return '<header class="ld-header"><div class="ld-brand"><span class="ld-brand-mark" aria-hidden="true">✦</span><div><strong>Missão Concurso</strong><span>HCPA · Assistente Administrativo II</span></div></div><div class="ld-top-actions"><span class="ld-exam">Prova: 13/12/2026 · '+remaining+' dias</span>'+button('focus',focus?'Sair do foco':'Modo foco','','ld-button ld-quiet')+'</div></header>';
}
function navbar(){
 const list=[['inicio','⌂','Início'],['materias','◈','Explorar'],['banco','◎','Desafios'],['flashcards','▣','Cartões'],['simulados','◇','Simulados'],['dia','▤','Plano']];
 return '<nav class="ld-nav" aria-label="Explorar Concursos">'+list.map(x=>'<button type="button" data-ld="nav" data-page="'+x[0]+'" '+(ctx.view===x[0]?'aria-current="page"':'')+'><span aria-hidden="true">'+x[1]+'</span>'+x[2]+'</button>').join('')+(ctx.rights.admin?'<button type="button" data-ld="admin">Gerenciar acesso</button>':'')+'</nav>';
}
function renderBody(body){
 if(!ctx)return;
 ctx.renderHTML('<div class="ld-root '+(focus?'ld-focus':'')+'">'+titlebar()+navbar()+
 (paused?'<section class="ld-break ld-panel"><span class="ld-big-icon" aria-hidden="true">☕</span><h1>Pausa livre</h1><p>O que você respondeu já está guardado. Retome quando quiser, sem perder pontos nem precisar recomeçar.</p>'+button('resume','Continuar de onde parei','','ld-button ld-primary')+'</section>':body)+
 '<footer class="ld-footer">Avance no seu ritmo. O objetivo é compreender e lembrar, não correr contra o relógio.</footer></div>');
}
function chips(){
 return '<div class="ld-chips"><span>'+answers().length+' questões praticadas</span><span>'+lessonCount()+' assuntos explorados</span><span>'+knownCards()+' cartões conhecidos</span></div>';
}
function home(){
 const m=meta(),w=wrong().length,review=due().length,first=ctx.store.plan?.length?ctx.store.plan.findIndex(d=>!ctx.store.completed[d.date]):-1;
 const next=first>=0?ctx.store.plan[first]:null;
 return '<section class="ld-welcome ld-panel"><div><div class="ld-eyebrow">Seu ponto de partida</div><h1>Que tal uma missão rápida?</h1><p>Um assunto de cada vez. Você aprende, testa e descobre o que já sabe — sem precisar encarar uma aula enorme.</p><div class="ld-actions">'+button('quick','Começar · 5 questões <span aria-hidden="true">↗</span>','','ld-button ld-primary ld-large')+button('surprise','Me surpreenda','','ld-button ld-secondary')+'</div></div><div class="ld-mission-stamp" aria-hidden="true"><span>5</span><small>questões por missão</small></div></section>'+
 chips()+
 '<div class="ld-section-title"><div><span class="ld-eyebrow">Escolha o jeito de estudar</span><h2>Hoje, qual parece mais interessante?</h2></div>'+button('pause','Fazer uma pausa','','ld-button ld-quiet')+'</div>'+
 '<div class="ld-grid ld-activities">'+
 tile('learn-random','📖','Descobrir um assunto','Conteúdo em pequenas etapas, com exemplos do material.')+
 tile('quick','🎯','Desafio relâmpago','Cinco questões e correção após cada resposta.')+
 tile('match-random','🧩','Jogo dos conceitos','Encontre o conceito que combina com uma definição.')+
 tile('flash-random','🃏','Vira-cartas','Lembre a resposta antes de virar o cartão.')+
 tile('errors','🔎','Detetive dos erros',w+' questões com erro para investigar outra vez.')+
 tile('due','🔁','Revisão inteligente',review+' questões para retomar e consolidar.')+'</div>'+
 '<section class="ld-plan-highlight ld-panel"><div><span class="ld-eyebrow">Próxima etapa</span><h2>'+(next?'Dia '+next.day+' do seu plano':'Seu mapa de estudos')+'</h2><p>'+(next?'Temas: '+next.topics.slice(0,3).map(id=>topic(id)?.title||id).join(' · ')+(next.topics.length>3?' e outros.':'.'):'Organize suas matérias por facilidade e dificuldade, sem apagar o que você já respondeu.')+'</p></div>'+
 button(next?'day-open':'plan-config',next?'Abrir missão do dia':'Montar meu mapa',next?'data-index="'+ctx.store.plan.indexOf(next)+'"':'','ld-button ld-primary')+'</section>'+
 '<div class="ld-mini-stats"><div><strong>'+m.sessions+'</strong><span>Missões realizadas</span></div><div><strong>'+Object.keys(ctx.store.completed).filter(x=>ctx.store.completed[x]).length+'</strong><span>Dias assinalados</span></div><div><strong>'+w+'</strong><span>Erros para revisar</span></div></div>';
}
function tile(act,ico,name,desc,extra=''){
 return '<button type="button" class="ld-activity" data-ld="'+act+'" '+extra+'><span class="ld-activity-icon" aria-hidden="true">'+ico+'</span><strong>'+E(name)+'</strong><span>'+E(desc)+'</span><span class="ld-activity-arrow" aria-hidden="true">↗</span></button>';
}
function sectionHead(k,h,desc){
 return '<div class="ld-page-head"><span class="ld-eyebrow">'+E(k)+'</span><h1>'+E(h)+'</h1><p>'+E(desc)+'</p></div>';
}
function subjectView(){
 const list=subjects();
 return sectionHead('Expedições','Escolha uma matéria','Você pode começar por qualquer assunto; não precisa seguir uma ordem fixa.')+
 '<div class="ld-grid ld-subjects">'+list.map((s,i)=>{
  const ts=topics().filter(t=>t.subject===s.id);
  const mastered=ts.filter(t=>meta().lessons[t.id]).length;
  return '<button class="ld-subject" data-ld="subject" data-subject="'+E(s.id)+'"><span class="ld-subject-index">0'+(i+1)+'</span><strong>'+E(s.name)+'</strong><span>'+ts.length+' assuntos disponíveis</span><div class="ld-track"><i style="width:'+percent(mastered,ts.length)+'%"></i></div><small>'+mastered+'/'+ts.length+' explorados</small><span class="ld-subject-arrow" aria-hidden="true">↗</span></button>';
 }).join('')+'</div>';
}
function subjectTopics(id){
 const s=subject(id),list=topics().filter(t=>t.subject===id);
 if(!s)return subjectView();
 return '<div class="ld-back-row">'+button('back-subjects','← Todas as matérias','','ld-button ld-quiet')+'</div>'+
 sectionHead('Trilha de conhecimento',s.name,'Selecione um assunto para ver o conteúdo ou jogar com o que aprendeu.')+
 '<div class="ld-topic-grid">'+list.map((t,i)=>{
 const q=questions().filter(x=>x.topic===t.id),a=q.filter(x=>ctx.store.answers[x.id]);
 return '<article class="ld-topic-card ld-panel"><div class="ld-topic-tag">Assunto '+(i+1)+' <span>'+(meta().lessons[t.id]?'✓ Explorado':'Novo')+'</span></div><h2>'+E(t.title)+'</h2><p>'+E(t.summary||'')+'</p><div class="ld-topic-meta">'+a.length+'/'+q.length+' questões praticadas</div><div class="ld-actions">'+button('topic','Explorar','data-topic="'+E(t.id)+'"','ld-button ld-primary')+button('quiz-topic','Testar','data-topic="'+E(t.id)+'"','ld-button ld-secondary')+'</div></article>';
 }).join('')+'</div>';
}
function topicView(id){
 const t=topic(id);if(!t)return subjectView();
 const list=questions().filter(q=>q.topic===id),note=(t.notes||[]).length;
 return '<div class="ld-back-row">'+button('subject','← '+E(subject(t.subject)?.name||'Matérias'),'data-subject="'+E(t.subject)+'"','ld-button ld-quiet')+'</div>'+
 sectionHead('Assunto em foco',t.title,t.summary||'')+
 '<div class="ld-grid ld-topic-choices">'+
 tile('lesson','📘','Aprender por etapas',(t.study||[]).length+' blocos de leitura curtos com o material original.')+
 tile('quiz-topic','🎯','Testar o que aprendeu',list.length+' questões deste assunto.','data-topic="'+E(id)+'"')+
 tile('match-topic','🧩','Associar conceitos',note+' conceitos para reconhecer.','data-topic="'+E(id)+'"')+
 tile('cards-topic','🃏','Vira-cartas','Recuperar as ideias sem olhar a resposta.','data-topic="'+E(id)+'"')+'</div>'+
 '<details class="ld-panel ld-full-theory"><summary>Consultar todo o material deste assunto</summary><div>'+
 (t.study||[]).map(part=>'<section><h3>'+E(part.title)+'</h3><p>'+E(part.body)+'</p></section>').join('')+
 (t.notes||[]).length?'<h3>Conceitos essenciais</h3>'+t.notes.map(n=>'<p><strong>'+E(n.term)+':</strong> '+E(n.explanation)+'</p>').join(''):'')+'</div></details>';
}
function learn(id){
 const t=topic(id);if(!t)return draw();
 topicId=id;step=0;page='lesson';draw();
}
function lessonView(){
 const t=topic(topicId);if(!t)return subjectView();
 const sections=(t.study||[]).filter(x=>x.title||x.body);
 const total=sections.length+1,rec=sections[step]||null;
 if(!sections.length)return topicView(topicId);
 return '<div class="ld-back-row">'+button('topic','← Voltar ao assunto','data-topic="'+E(topicId)+'"','ld-button ld-quiet')+'</div>'+
 '<section class="ld-lesson ld-panel"><div class="ld-stage-top"><span class="ld-eyebrow">Microaula · '+E(subject(t.subject)?.name||'')+'</span><span class="ld-pill">Etapa '+(step+1)+' de '+total+'</span></div>'+
 '<div class="ld-track"><i style="width:'+percent(step+1,total)+'%"></i></div>'+
 (rec?'<div class="ld-reading"><span class="ld-step-icon">✦</span><h1>'+E(rec.title||t.title)+'</h1><div class="ld-reading-text">'+E(rec.body||'')+'</div></div>':
 '<div class="ld-reading"><span class="ld-step-icon">★</span><h1>O que ficou na memória?</h1><p>Antes de responder às questões, tente lembrar o principal sem consultar o texto.</p>'+
 (t.check||[]).slice(0,3).map((z,i)=>'<details class="ld-reflect"><summary>Pergunta para pensar '+(i+1)+'</summary><p>'+E(z)+'</p></details>').join('')+
 '<p class="ld-muted">Não precisa escrever. Pense na resposta e prossiga quando quiser.</p></div>')+
 '<div class="ld-actions ld-between">'+button('speak',speaking?'Parar leitura':'Ouvir esta etapa','','ld-button ld-secondary')+
 button('lesson-next',step===total-1?'Concluir e praticar':'Próxima etapa →','','ld-button ld-primary')+'</div></section>';
}
function startQuiz(opts={}){
 const filter=opts.topic?questions().filter(q=>q.topic===opts.topic):opts.subject?questions().filter(q=>q.subject===opts.subject):opts.type==='errors'?wrong():opts.type==='due'?due():questions();
 const m=meta();
 const pool=filter.slice().sort((a,b)=>{
  const ap=ctx.store.answers[a.id],bp=ctx.store.answers[b.id];
  const wa=(ap?.correct===false?4:0)+(m.review[a.id]&&new Date(m.review[a.id].due).getTime()<=Date.now()?3:0)+(ap?0:2);
  const wb=(bp?.correct===false?4:0)+(m.review[b.id]&&new Date(m.review[b.id].due).getTime()<=Date.now()?3:0)+(bp?0:2);
  return wb-wa||Math.random()-.5;
 });
 if(!pool.length){ctx.toast('Ainda não há questões nesse modo. Experimente outro desafio.');return;}
 const count=Math.min(Number(opts.count)||5,pool.length);
 const chosen=pool.slice(0,count);
 session={kind:'quiz',ids:chosen.map(q=>q.id),index:0,selected:null,good:0,completed:false,title:opts.type==='errors'?'Detetive dos erros':opts.type==='due'?'Revisão inteligente':opts.title||'Desafio relâmpago'};
 page='game';paused=false;draw();
}
function quizView(){
 const s=session,q=s&&qid(s.ids[s.index]);if(!q)return finishView();
 const chosen=s.selected,correct=chosen===q.answer;
 return '<div class="ld-back-row">'+button('close','← Sair do desafio','','ld-button ld-quiet')+button('pause','Pausa livre','','ld-button ld-quiet')+'</div>'+
 '<section class="ld-game ld-panel"><div class="ld-stage-top"><span class="ld-eyebrow">'+E(s.title)+'</span><span class="ld-pill">'+(s.index+1)+' / '+s.ids.length+'</span></div>'+
 '<div class="ld-track"><i style="width:'+percent(s.index,s.ids.length)+'%"></i></div>'+
 '<p class="ld-game-category">'+E(subject(q.subject)?.name||'')+' · '+E(topic(q.topic)?.title||'')+'</p>'+
 '<h1>'+E(q.stem)+'</h1><div class="ld-choices" role="group" aria-label="Alternativas">'+q.options.map((option,i)=>{
  const cls=chosen===null?'':i===q.answer?' is-correct':i===chosen?' is-wrong':'';
  return '<button type="button" data-ld="answer" data-choice="'+i+'" class="ld-choice'+cls+'" '+(chosen!==null?'disabled':'')+'><span class="ld-choice-letter">'+String.fromCharCode(65+i)+'</span><span>'+E(option)+'</span></button>';
 }).join('')+'</div>'+
 (chosen===null?'<p class="ld-muted">Escolha uma alternativa. O resultado aparece na hora.</p>':
 '<section class="ld-explain" aria-live="polite"><h2>'+(correct?'✓ Boa! Você acertou.':'Boa tentativa. Vamos entender a resposta.')+'</h2>'+
 '<p><strong>Resposta: '+String.fromCharCode(65+q.answer)+'.</strong> '+E(q.options[q.answer])+'</p>'+
 (q.feedback?.[chosen]?'<p>'+E(q.feedback[chosen])+'</p>':'')+
 (chosen!==q.answer&&q.feedback?.[q.answer]?'<p>'+E(q.feedback[q.answer])+'</p>':'')+
 '<details><summary>Entender todas as alternativas</summary>'+q.options.map((option,i)=>'<p><strong>'+String.fromCharCode(65+i)+'.</strong> '+E(q.feedback?.[i]||option)+'</p>').join('')+'</details>'+
 '<div class="ld-actions">'+button('next',s.index+1===s.ids.length?'Ver minha conquista':'Próxima questão →','','ld-button ld-primary')+'</div></section>')+
 '</section>';
}
function recordAnswer(choice){
 const s=session,q=s&&qid(s.ids[s.index]);if(!q||s.kind!=='quiz'||s.selected!==null||!Number.isInteger(choice)||choice<0||choice>=q.options.length)return;
 s.selected=choice;const right=choice===q.answer;if(right)s.good++;
 ctx.store.answers[q.id]={answer:choice,correct:right,at:stamp()};
 const m=meta(),prev=m.review[q.id],stage=right?Math.min(3,(prev?.stage||0)+1):0;
 const wait=right?[0,3,7,14][stage]:1;
 m.review[q.id]={stage,due:new Date(Date.now()+wait*DAY).toISOString()};
 ctx.save();draw();
}
function glossaryPool(id){
 const s=topic(id)?.subject;
 const own=topic(id)?.notes||[];
 const related=topics().filter(t=>t.subject===s).flatMap(t=>t.notes||[]);
 const entries=(own.length>=3?own:related).filter(x=>x.term&&x.explanation);
 const uniq=new Map(entries.map(x=>[x.term.trim().toLowerCase(),x]));
 return [...uniq.values()];
}
function startMatch(id){
 const all=glossaryPool(id);
 if(all.length<2){ctx.toast('Não há conceitos suficientes para esse jogo neste assunto.');return;}
 topicId=id;
 session={kind:'match',items:pick(all,Math.min(5,all.length)),pool:all,index:0,selected:null,good:0,completed:false,title:'Jogo dos conceitos'};
 page='game';paused=false;draw();
}
function matchView(){
 const s=session,item=s?.items[s.index];if(!item)return finishView();
 const choices=[item,...pick(s.pool.filter(x=>x.term!==item.term),3)];
 const old=s.optionsFor;
 if(!old||old.index!==s.index){
  s.optionsFor={index:s.index,items:pick(choices,choices.length)};
 }
 const options=s.optionsFor.items;
 return '<div class="ld-back-row">'+button('close','← Sair do desafio','','ld-button ld-quiet')+button('pause','Pausa livre','','ld-button ld-quiet')+'</div>'+
 '<section class="ld-game ld-panel"><div class="ld-stage-top"><span class="ld-eyebrow">Conecte as ideias</span><span class="ld-pill">'+(s.index+1)+' / '+s.items.length+'</span></div>'+
 '<div class="ld-track"><i style="width:'+percent(s.index,s.items.length)+'%"></i></div>'+
 '<p class="ld-game-category">Qual é o conceito?</p><h1>'+E(item.explanation)+'</h1><div class="ld-choices">'+options.map((opt,i)=>
 '<button type="button" data-ld="match-answer" data-choice="'+i+'" class="ld-choice '+(s.selected===null?'':opt.term===item.term?'is-correct':s.selected===i?'is-wrong':'')+'" '+(s.selected!==null?'disabled':'')+'><span class="ld-choice-letter">'+String.fromCharCode(65+i)+'</span><span>'+E(opt.term)+'</span></button>').join('')+'</div>'+
 (s.selected===null?'<p class="ld-muted">As respostas vêm dos conceitos do próprio material.</p>':
 '<section class="ld-explain" aria-live="polite"><h2>'+(options[s.selected]?.term===item.term?'✓ Conexão feita!':'Agora você já sabe qual era.')+'</h2><p><strong>'+E(item.term)+'.</strong> '+E(item.explanation)+'</p>'+button('next',s.index+1===s.items.length?'Ver minha conquista':'Próxima conexão →','','ld-button ld-primary')+'</section>')+'</section>';
}
function recordMatch(choice){
 const s=session,item=s?.items[s.index],options=s?.optionsFor?.items||[];
 if(!item||s.kind!=='match'||s.selected!==null||!Number.isInteger(choice)||!options[choice])return;
 s.selected=choice;if(options[choice].term===item.term)s.good++;
 draw();
}
function startCards(opts={}){
 let pool=cards().filter(c=>(!opts.topic||c.topic===opts.topic)&&(!opts.subject||c.subject===opts.subject));
 pool=pool.sort((a,b)=>Number(ctx.store.flashcards[a.id]===true)-Number(ctx.store.flashcards[b.id]===true));
 if(!pool.length){ctx.toast('Não há cartões neste assunto.');return;}
 session={kind:'cards',ids:pool.slice(0,Math.min(opts.count||7,pool.length)).map(x=>x.id),index:0,good:0,completed:false,title:'Vira-cartas'};
 face=false;page='game';paused=false;draw();
}
function cardsView(){
 const s=session,c=s&&cdid(s.ids[s.index]);if(!c)return finishView();
 return '<div class="ld-back-row">'+button('close','← Sair do jogo','','ld-button ld-quiet')+button('pause','Pausa livre','','ld-button ld-quiet')+'</div>'+
 '<section class="ld-game ld-panel"><div class="ld-stage-top"><span class="ld-eyebrow">Vira-cartas</span><span class="ld-pill">'+(s.index+1)+' / '+s.ids.length+'</span></div>'+
 '<div class="ld-track"><i style="width:'+percent(s.index,s.ids.length)+'%"></i></div>'+
 '<p class="ld-game-category">'+E(subject(c.subject)?.name||'')+'</p><button class="ld-flip '+(face?'is-flipped':'')+'" type="button" data-ld="flip" aria-label="'+(face?'Ver pergunta':'Revelar resposta')+'"><small>'+(face?'RESPOSTA':'PERGUNTA')+'</small><strong>'+E(face?c.back:c.front)+'</strong><span>'+(face?'Toque para rever a pergunta':'Pense na resposta e toque para virar')+'</span></button>'+
 (face?'<div class="ld-actions ld-card-actions">'+button('card-grade','Preciso rever','data-known="false"','ld-button ld-secondary')+button('card-grade','Eu sabia!','data-known="true"','ld-button ld-primary')+'</div>':'<p class="ld-muted">Tente recordar antes de virar. Não há tempo limite.</p>')+'</section>';
}
function recordCard(known){
 const s=session,c=s&&cdid(s.ids[s.index]);if(!c||s.kind!=='cards'||!face)return;
 ctx.store.flashcards[c.id]=known;
 meta().cardDue[c.id]=new Date(Date.now()+(known?3:1)*DAY).toISOString();
 ctx.save();if(known)s.good++;next();
}
function next(){
 if(!session)return;
 session.index++;session.selected=null;face=false;
 if(session.index>=((session.kind==='match'?session.items:session.ids)||[]).length)complete();
 else draw();
}
function complete(){
 if(!session||session.completed)return;
 session.completed=true;meta().sessions++;
 if(session.kind==='match'&&topicId)meta().glossary[topicId]=stamp();
 ctx.save();page='finish';draw();
}
function finishView(){
 if(!session)return home();
 const count=session.kind==='match'?session.items.length:session.ids.length;
 const label=session.kind==='cards'?'cartões conhecidos':session.kind==='match'?'associações certas':'respostas certas';
 return '<section class="ld-finish ld-panel"><span class="ld-win" aria-hidden="true">★</span><span class="ld-eyebrow">Missão finalizada</span><h1>Mais uma conquista!</h1><p>Você completou uma atividade. O importante é continuar avançando.</p><div class="ld-result"><strong>'+session.good+' / '+count+'</strong><span>'+label+'</span></div><div class="ld-actions ld-center">'+button('quick','Outra missão curta','','ld-button ld-primary')+button('nav','Voltar ao início','data-page="inicio"','ld-button ld-secondary')+'</div></section>';
}
function dailyView(){
 const plan=ctx.store.plan||[];
 if(!plan.length)return sectionHead('Seu percurso','Monte seu mapa de estudos','O plano organiza os conteúdos em dias. Você também pode fazer desafios avulsos, sem depender dele.')+
 '<section class="ld-panel ld-empty">'+button('nav','Escolher prioridades','data-page="configurar"','ld-button ld-primary')+'</section>';
 const finished=plan.filter(d=>ctx.store.completed[d.date]).length;
 return sectionHead('Sua jornada','Mapa de estudos',finished+' de '+plan.length+' dias assinalados. Use o plano como guia, não como obrigação.')+
 '<div class="ld-progress-summary ld-panel"><div><strong>'+percent(finished,plan.length)+'%</strong><span>do mapa percorrido</span></div><div class="ld-track"><i style="width:'+percent(finished,plan.length)+'%"></i></div>'+button('nav','Alterar prioridades','data-page="configurar"','ld-button ld-secondary')+'</div>'+
 '<div class="ld-days">'+plan.map((d,i)=>'<button type="button" class="ld-day '+(ctx.store.completed[d.date]?'is-done':'')+'" data-ld="day-open" data-index="'+i+'"><strong>Dia '+d.day+'</strong><small>'+E(d.date.slice(8,10)+'/'+d.date.slice(5,7))+'</small><span>'+d.topics.slice(0,2).map(id=>E(topic(id)?.title||id)).join(' · ')+'</span><b>'+(ctx.store.completed[d.date]?'✓ Concluído':'Abrir →')+'</b></button>').join('')+'</div>';
}
function dayView(index){
 const d=ctx.store.plan?.[index];if(!d)return dailyView();
 return '<div class="ld-back-row">'+button('nav','← Mapa de estudos','data-page="dia"','ld-button ld-quiet')+'</div>'+
 sectionHead('Seu mapa · Dia '+d.day,'Uma missão de cada vez','Não é preciso fazer todos os assuntos de uma vez. Escolha por onde começar.')+
 '<div class="ld-topic-grid">'+d.topics.map((id,i)=>{
 const t=topic(id);if(!t)return '';
 return '<article class="ld-panel ld-topic-card"><div class="ld-topic-tag">Etapa '+(i+1)+' de '+d.topics.length+'</div><h2>'+E(t.title)+'</h2><p>'+E(t.summary||'')+'</p><div class="ld-actions">'+button('learn-id','Aprender','data-topic="'+E(id)+'"','ld-button ld-primary')+button('quiz-topic','Praticar','data-topic="'+E(id)+'"','ld-button ld-secondary')+'</div></article>';
 }).join('')+'</div><section class="ld-panel ld-completion"><h2>Finalizar o dia</h2><p>Marque como concluído quando sentir que estudou o suficiente.</p>'+button('day-complete',ctx.store.completed[d.date]?'✓ Dia concluído · desfazer':'Marcar dia como concluído','data-index="'+index+'"','ld-button ld-primary')+'</section>';
}
function challengeView(){
 return sectionHead('Arena de estudo','Desafios que ensinam','Mude de atividade sempre que quiser. Toda correção explica o motivo da resposta.')+
 '<div class="ld-grid ld-activities">'+
 tile('quick','⚡','5 questões','Treino breve para começar agora.')+
 tile('ten','🎯','10 questões','Um desafio um pouco maior.')+
 tile('errors','🔎','Detetive de erros',wrong().length+' questões erradas para revisitar.')+
 tile('due','🔁','Revisão inteligente',due().length+' questões disponíveis para revisar.')+
 tile('match-random','🧩','Conectar conceitos','Jogo de conceitos com o conteúdo já estudado.')+
 tile('surprise','🎲','Desafio surpresa','O assunto muda a cada rodada.')+'</div>'+
 '<div class="ld-filter ld-panel"><h2>Treinar uma matéria específica</h2><div class="ld-subject-buttons">'+subjects().map(s=>button('quiz-subject',E(s.name),'data-subject="'+E(s.id)+'"','ld-button ld-secondary')).join('')+'</div></div>';
}
function examsView(){
 return sectionHead('Treino de prova','Simulados sem surpresas','Treine com a composição das matérias do HCPA. Pare quando precisar: nada aqui tem tempo obrigatório.')+
 '<div class="ld-grid ld-activities">'+tile('exam10','⏱','Aquecimento','10 questões sortidas.')+tile('exam20','📋','Simulado médio','20 questões, com correção imediata.')+tile('exam40','🏁','Simulado completo','40 questões e revisão das respostas.')+'</div>';
}
function startExam(count){
 const n=count===40?{especificos:25,portugues:5,informatica:5,logica:5}:count===20?{especificos:13,portugues:3,informatica:2,logica:2}:{especificos:6,portugues:2,informatica:1,logica:1};
 let list=Object.entries(n).flatMap(([id,k])=>pick(questions().filter(q=>q.subject===id),k));
 if(!list.length){ctx.toast('Banco de questões indisponível.');return;}
 list=pick(list,list.length);
 session={kind:'quiz',ids:list.map(q=>q.id),index:0,selected:null,good:0,completed:false,title:'Simulado · '+count+' questões'};
 page='game';draw();
}
function flashView(){
 return sectionHead('Memória em movimento','Vira-cartas','O segredo é tentar lembrar primeiro e só depois revelar a resposta.')+
 '<div class="ld-panel ld-filter"><h2>Escolha o tema do baralho</h2><div class="ld-subject-buttons">'+
 button('flash-random','Todas as matérias','','ld-button ld-primary')+
 subjects().map(s=>button('cards-subject',E(s.name),'data-subject="'+E(s.id)+'"','ld-button ld-secondary')).join('')+'</div><p class="ld-muted">'+knownCards()+' de '+cards().length+' cartões marcados como conhecidos.</p></div>';
}
function setupView(){
 const list=subjects();
 return sectionHead('Seu percurso','Ajuste seu mapa','Marque quais assuntos exigem mais atenção. É possível estudar sem montar o plano.')+
 '<section class="ld-panel ld-priorities"><p>O plano usa o mesmo material e as mesmas 200 questões. Suas respostas e anotações são mantidas.</p>'+
 list.map(s=>'<details '+(s.id===list[0]?.id?'open':'')+'><summary>'+E(s.name)+'</summary><div class="ld-priority-list">'+topics().filter(t=>t.subject===s.id).map(t=>
 '<label><span><strong>'+E(t.title)+'</strong><small>'+E(t.summary||'')+'</small></span><select data-ld-priority="'+E(t.id)+'" aria-label="Prioridade de '+E(t.title)+'">'+
 [['domino','Já domino'],['revisar','Revisar'],['estudar','Preciso aprender'],['prioridade','Tenho dificuldade']].map(([key,label])=>'<option value="'+key+'" '+((ctx.store.settings[t.id]||'revisar')===key?'selected':'')+'>'+label+'</option>').join('')+'</select></label>').join('')+'</div></details>').join('')+
 '<div class="ld-actions">'+button('generate',''+(ctx.store.plan?.length?'Atualizar meu mapa':'Criar meu mapa')+'','','ld-button ld-primary')+button('nav','Voltar','data-page="inicio"','ld-button ld-secondary')+'</div></section>';
}
function draw(){
 if(!ctx)return;
 let content='';
 if(page==='lesson')content=lessonView();
 else if(page==='game')content=session?.kind==='quiz'?quizView():session?.kind==='cards'?cardsView():matchView();
 else if(page==='finish')content=finishView();
 else if(page==='topic')content=topicView(topicId);
 else if(page==='subject')content=subjectTopics(subjectId);
 else if(page==='day-open')content=dayView(step);
 else if(ctx.view==='materias')content=subjectView();
 else if(ctx.view==='materia')content=subjectTopics(ctx.subject);
 else if(ctx.view==='banco')content=challengeView();
 else if(ctx.view==='simulados')content=examsView();
 else if(ctx.view==='flashcards')content=flashView();
 else if(ctx.view==='dia')content=dailyView();
 else if(ctx.view==='configurar')content=setupView();
 else content=home();
 renderBody(content);
}
function chooseTopic(id){if(!topic(id))return;topicId=id;page='topic';draw();}
function route(destination){
 page='dashboard';session=null;paused=false;stopSpeech();
 if(ctx.view===destination)draw();else ctx.go(destination);
}
function handle(action,el){
 const a=el.dataset;
 if(action==='focus'){focus=!focus;draw();return;}
 if(action==='pause'){paused=true;stopSpeech();draw();return;}
 if(action==='resume'){paused=false;draw();return;}
 if(action==='nav'){route(a.page||'inicio');return;}
 if(action==='admin'&&ctx.rights.admin){page='dashboard';ctx.go('admin');return;}
 if(action==='subject'){subjectId=a.subject;page='subject';draw();return;}
 if(action==='back-subjects'){page='dashboard';ctx.go('materias');return;}
 if(action==='topic'){chooseTopic(a.topic);return;}
 if(action==='learn-id'){learn(a.topic);return;}
 if(action==='lesson'){learn(topicId);return;}
 if(action==='learn-random'){const t=pick(topics(),1)[0];if(t)learn(t.id);return;}
 if(action==='lesson-next'){
  const t=topic(topicId);if(!t)return;
  const sections=(t.study||[]).filter(x=>x.title||x.body);
  if(step<sections.length){step++;draw();}
  else {meta().lessons[topicId]=stamp();ctx.save();startQuiz({topic:topicId,count:3,title:'Hora de lembrar'});}
  return;
 }
 if(action==='speak'){
  if(speaking){stopSpeech();draw();return;}
  const t=topic(topicId),section=(t?.study||[])[step],u=window.speechSynthesis;
  if(!u||!window.SpeechSynthesisUtterance){ctx.toast('Leitura em voz alta não disponível neste navegador.');return;}
  stopSpeech();const utter=new SpeechSynthesisUtterance(section?(section.title+'. '+section.body):'Pense no que você acabou de aprender.');
  utter.lang='pt-BR';utter.rate=.94;utter.onend=()=>{speaking=false;};utter.onerror=()=>{speaking=false;};
  try{u.speak(utter);speaking=true;draw();}catch(_){ctx.toast('A leitura não foi iniciada.');}
  return;
 }
 if(action==='quick'){startQuiz({count:5});return;}
 if(action==='ten'){startQuiz({count:10,title:'Desafio de dez questões'});return;}
 if(action==='surprise'){startQuiz({count:5,title:'Desafio surpresa'});return;}
 if(action==='errors'){startQuiz({type:'errors',count:5});return;}
 if(action==='due'){startQuiz({type:'due',count:5});return;}
 if(action==='quiz-topic'){startQuiz({topic:a.topic||topicId,count:5,title:'Desafio do assunto'});return;}
 if(action==='quiz-subject'){startQuiz({subject:a.subject,count:5,title:'Desafio de '+(subject(a.subject)?.name||'matéria')});return;}
 if(action==='match-random'){
  const available=topics().filter(t=>glossaryPool(t.id).length>=2);
  const t=pick(available,1)[0];if(t)startMatch(t.id);else ctx.toast('Não há conceitos disponíveis.');return;
 }
 if(action==='match-topic'){startMatch(a.topic||topicId);return;}
 if(action==='flash-random'){startCards({});return;}
 if(action==='cards-topic'){startCards({topic:a.topic||topicId});return;}
 if(action==='cards-subject'){startCards({subject:a.subject});return;}
 if(action==='answer'){recordAnswer(Number(a.choice));return;}
 if(action==='match-answer'){recordMatch(Number(a.choice));return;}
 if(action==='next'){next();return;}
 if(action==='flip'){face=!face;draw();return;}
 if(action==='card-grade'){recordCard(a.known==='true');return;}
 if(action==='close'){session=null;page='dashboard';paused=false;draw();return;}
 if(action==='exam10'){startExam(10);return;}
 if(action==='exam20'){startExam(20);return;}
 if(action==='exam40'){startExam(40);return;}
 if(action==='day-open'){step=Math.max(0,Number(a.index)||0);page='day-open';draw();return;}
 if(action==='day-complete'){
  const i=Number(a.index),d=ctx.store.plan?.[i];if(!d)return;
  ctx.store.completed[d.date]=!ctx.store.completed[d.date];ctx.save();draw();return;
 }
 if(action==='plan-config'){route('configurar');return;}
 if(action==='generate'){void ctx.generate();return;}
}
document.addEventListener('click',event=>{
 const el=event.target instanceof Element?event.target.closest('.ld-root [data-ld]'):null;
 if(!el||!ctx)return;
 event.preventDefault();event.stopImmediatePropagation();
 handle(el.dataset.ld,el);
},true);
document.addEventListener('change',event=>{
 const el=event.target;
 if(!(el instanceof Element)||!el.closest('.ld-root')||!el.hasAttribute('data-ld-priority')||!ctx)return;
 const id=el.getAttribute('data-ld-priority');
 if(topic(id)&&['domino','revisar','estudar','prioridade'].includes(el.value)){ctx.store.settings[id]=el.value;ctx.save();}
},true);
document.addEventListener('keydown',event=>{
 const root=document.querySelector('.ld-root');
 if(!root||!ctx||paused||event.altKey||event.metaKey||event.ctrlKey||/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||''))return;
 if(page==='game'&&session?.kind==='quiz'&&session.selected===null&&/^[1-5]$/.test(event.key)){
  event.preventDefault();recordAnswer(Number(event.key)-1);
 }else if(page==='game'&&session?.selected!==null&&event.key==='Enter'){
  event.preventDefault();next();
 }
});
window.PMConcursoLudico={
 render(next){
  if(!next||next.view==='admin'||next.view==='caderno')return false;
  const id=next.rights?.id;
  if(identity!==id){identity=id;stateReset();}
  ctx=next;
  if(lastView!==ctx.view){lastView=ctx.view;page='dashboard';session=null;paused=false;stopSpeech();}
  if(topicId&&!topic(topicId)){page='dashboard';topicId='';}
  draw();return true;
 },
 close(){stopSpeech();stateReset();ctx=null;}
};
})();