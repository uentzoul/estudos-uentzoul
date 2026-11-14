/* PsicoMoodle — Trilha de Estudos para Relembrar | 2026/1
   Conteúdo autoral de estudo baseado nos arquivos recebidos no primeiro semestre.
   Respostas e simulados são exercícios didáticos, não provas oficiais. */
(()=>{
'use strict';
const RAW=window.PSICO_FIRST_SEM_DATA||{}, SOURCES=window.PSICO_FIRST_SEM_SOURCES||{};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names={profissao:'Psicologia como Profissão',processos:'Processos Psicológicos Básicos',direitos:'Psicologia e Direitos Humanos',epistemologia:'Fundamentos Epistemológicos em Psicologia',historia:'História da Psicologia',sociocognitivas:'Teorias Sociocognitivas',desenvolvimento:'Psicologia do Desenvolvimento (Ciclo Vital)'};
const labels=['','Muito fácil','Fácil','Intermediário','Difícil','Muito difícil'];
const topics=id=>(RAW[id]||[]).map((a,i)=>({title:a[0],definition:a[1],scenario:a[2],myth:a[3],source:(SOURCES[id]||[])[a[4]]||'Material de aula',sourceIndex:a[4],courseIndex:i}));
function question(t,i){
 return {n:i+1,topic:t.title,section:'Conceitos e aplicações do semestre',
  question:'Explique o conceito de '+t.title+' e relacione-o à situação: '+t.scenario+
   '\n\nIndique uma interpretação que seria incorreta e justifique por quê.',
  options:[],answer:null,
  explanation:'Conceito: '+t.definition+'\n\nAplicação: '+t.scenario+
  '\n\nInterpretação inadequada: '+t.myth+'\n\nReferência no acervo: '+t.source,
  contrast:'Uma resposta consistente descreve o conceito, justifica sua relação com o exemplo e explica por que a afirmação incorreta não decorre dos materiais de estudo.',
  points:[
   {title:'Definição',explanation:t.definition,example:''},
   {title:'Exemplo',explanation:'Identifique os elementos da situação relevantes para o conceito.',example:t.scenario},
   {title:'Limite da interpretação',explanation:'Evite esta afirmação:',example:t.myth}
  ]};
}
function guide(id,arr){
 return {id:'relembrar-2026-1-'+id,title:'Estudo dirigido — relembrar o 1º semestre',
  subtitle:arr.length+' temas comentados com exemplos retirados ou adaptados dos conteúdos das aulas',
  source:'Roteiro didático novo, baseado nos arquivos identificados no acervo de '+names[id]+'. Não é um roteiro literal do professor.',
  status:'adaptado',questions:arr.map(question)};
}
function optionQuestion(id,model,i,arr){
 const ix=((model-1)*3+i)%arr.length,t=arr[ix],used=[ix];
 for(let j=1;j<=3;j++){let candidate=(ix+j)%arr.length;while(used.includes(candidate))candidate=(candidate+1)%arr.length;used.push(candidate);}
 const order=used.map(k=>arr[k]),shift=(model+i)%4;
 const variants=order.map((entry,j)=>({text:entry.title,why:j===0
   ?'É a melhor resposta: '+entry.definition+' No exemplo: '+t.scenario
   :'Este conceito se refere a '+entry.definition+' A situação foi construída para enfatizar '+t.title+'.'}));
 const rotated=variants.slice(shift).concat(variants.slice(0,shift));
 return {id:'s1-'+id+'-'+model+'-'+(i+1),type:'choice',
  prompt:'Considere a situação estudada:\n\n'+t.scenario+'\n\nQual conceito explica MELHOR o aspecto central da situação?',
  options:rotated,answer:(4-shift)%4,concept:t.title,source:t.source};
}
function tfQuestion(id,model,i,arr){
 const t=arr[((model-1)*3+i)%arr.length],isTrue=i%2===0;
 return {id:'s1-'+id+'-'+model+'-'+(i+1),type:'tf',concept:t.title,
  prompt:'Sobre '+t.title+', analise a afirmação:\n\n“'+(isTrue?t.definition:t.myth)+'”',
  answer:isTrue,explanation:(isTrue?'Correta. ':'Incorreta. ')+t.definition+' Referência: '+t.source};
}
function essayQuestion(id,model,i,arr){
 const t=arr[((model-1)*3+i)%arr.length],other=arr[(((model-1)*3+i)+1)%arr.length];
 return {id:'s1-'+id+'-'+model+'-'+(i+1),type:'essay',concept:t.title,
  prompt:'A partir do conteúdo de '+names[id]+', explique '+t.title+'.\n\nSituação: '+t.scenario+
   '\n\nArticule sua resposta com '+other.title+' e discuta os limites de uma interpretação simplificadora.',
  criteria:['Definir corretamente '+t.title,'Analisar a situação concreta sem apenas repetir uma definição',
   'Estabelecer uma relação fundamentada com '+other.title,'Evitar inferências excessivas e a interpretação incorreta apresentada nos materiais'],
  model:t.definition+' '+t.scenario+' Relaciona-se com '+other.title+': '+other.definition+
  ' Não se deve concluir que '+t.myth,
  source:'Questão autoral com base em '+t.source+' e '+other.source};
}
function exams(id,arr){
 return Array.from({length:5},(_,i)=>{
  const m=i+1,questions=[];
  for(let j=0;j<6;j++)questions.push(optionQuestion(id,m,j,arr));
  for(let j=6;j<9;j++)questions.push(tfQuestion(id,m,j,arr));
  for(let j=9;j<12;j++)questions.push(essayQuestion(id,m,j,arr));
  return {id:'relembrar-2026-1-'+id+'-'+m,subject:id,model:m,
    title:'Simulado '+m+' · '+labels[m],description:'9 questões objetivas e 3 dissertativas',questions,
    source:'Exercícios didáticos baseados no acervo do primeiro semestre',revision:'relembrar-2026-1'};
 });
}
function makeCase(id,t,other,i){
 const good='Relacionar a situação aos elementos de '+t.title+' e considerar o contexto antes de concluir.';
 const bad='Ignorar o contexto e afirmar que '+t.myth;
 return {id:'relembrar-2026-1-'+id+'-'+i,title:'Caso '+i+' — '+t.title,area:'Aplicação e pensamento crítico',
  intro:t.scenario+' Uma equipe de estudantes deve analisar o exemplo com base nos textos da disciplina.',
  stages:[
  {prompt:'Qual encaminhamento conceitual é mais adequado para começar a análise?',
   choices:[
    {label:good,outcome:'O grupo identifica o que os dados permitem discutir.',reason:t.definition},
    {label:bad,outcome:'A interpretação não se sustenta na leitura do material.',reason:'O enunciado incorreto do texto é: '+t.myth},
    {label:'Concluir que não é necessário consultar o material ou justificar a resposta.',outcome:'O grupo perde a oportunidade de testar sua explicação.',reason:'Um estudo de caso exige conceitos e argumentos verificáveis.'}
   ]},
  {prompt:'Ao aprofundar o estudo, que estratégia ajuda a evitar uma conclusão superficial?',
   choices:[
    {label:'Comparar '+t.title+' a '+other.title+' e justificar as diferenças com a leitura.',outcome:'A equipe explicita relações e limites entre conceitos.',reason:'Segundo as fontes, '+t.definition+' Já '+other.title+': '+other.definition},
    {label:'Tratar '+t.title+' e '+other.title+' como necessariamente sinônimos.',outcome:'As distinções teóricas deixam de ser analisadas.',reason:'As duas expressões descrevem objetos e ênfases próprias.'},
    {label:'Escolher uma resposta pela familiaridade da palavra, sem examinar o cenário.',outcome:'A justificativa fica desconectada dos fatos.',reason:'É preciso associar conceitos aos elementos concretos do caso.'}
   ]}
  ],wrapUp:'Síntese: '+t.definition+' Leitura indicada: '+t.source+'. Articulação: '+other.source+'.'};
}
function cases(id,arr){
 const picks=[Math.min(2,arr.length-1),Math.min(9,arr.length-1),Math.min(12,arr.length-1)];
 return picks.map((pos,i)=>makeCase(id,arr[pos],arr[(pos+1)%arr.length],i+1));
}
function apply(db){
 if(!db||!db.topics||!db.exams)return;
 window.PSICO_GUIDES=window.PSICO_GUIDES||{};
 window.PSICO_CASES=window.PSICO_CASES||{};
 for(const id of Object.keys(names)){
  const arr=topics(id);if(!arr.length)continue;
  db.topics[id]=arr;
  const examIds=new Set(db.exams.map(e=>e.id));
  db.exams.push(...exams(id,arr).filter(e=>!examIds.has(e.id)));
  if(!window.PSICO_GUIDES[id]?.some(g=>g.id==='relembrar-2026-1-'+id)){
   window.PSICO_GUIDES[id]=(window.PSICO_GUIDES[id]||[]).concat(guide(id,arr));
  }
  const old=window.PSICO_CASES[id]||[];
  window.PSICO_CASES[id]=old.filter(c=>!String(c.id||'').startsWith('relembrar-2026-1-')).concat(cases(id,arr));
 }
}
const links=[
 ['trail','✧','Trilha de Estudos para Relembrar','Roteiro guiado para retomar o que foi estudado'],
 ['docs','▤','Materiais e textos','Textos originais enviados e referências utilizadas'],
 ['guided','▣','Estudos dirigidos','Perguntas com explicações por tema'],
 ['tests','✦','Simulados','Cinco níveis de dificuldade por disciplina'],
 ['flash','▧','Flashcards','Recordação ativa e acompanhamento de progresso'],
 ['cases','◇','Estudos de casos','Aplicações e decisões explicadas por etapas'],
 ['topics','☷','Conteúdos para revisar','Conceitos com exemplos e erros frequentes'],
 ['podcasts','♫','Podcasts','A serem adicionados posteriormente']
];
function panel(title,body,sub){
 return '<section class="section s1-panel"><div class="sectiontop"><h2>'+esc(title)+'</h2></div>'+
  (sub?'<p class="s1-help">'+esc(sub)+'</p>':'')+body+'</section>';
}
function top(id,subj){
 return '<div class="subject-hub s1-hub" style="--subject-accent:'+esc(subj.color||'#637bb2')+'">'+
  '<div class="subject-hub-crumb"><button type="button" data-action="page:home">Início</button><span>/</span><span>'+esc(subj.name)+'</span></div>'+
  '<header class="subject-hub-hero"><span class="subject-hub-emblem" aria-hidden="true">Ψ</span>'+
  '<div class="subject-hub-heading"><span class="subject-hub-kicker">1º semestre · 2026/1</span><h1>'+esc(subj.name)+'</h1>'+
  '<p class="subject-hub-date">Revisão e retomada dos estudos — sem data de prova presumida</p></div></header>';
}
const back='<button type="button" class="subject-hub-back" data-action="subjectArea:home">← Voltar às opções</button>';
function docsView(ctx){
 const list=ctx.docs||[],sources=SOURCES[ctx.id]||[];
 const available=list.filter(m=>m.available);
 const html=available.length?'<div class="doclist">'+available.map(ctx.docCard).join('')+'</div>':
  '<p class="s1-help">Os materiais enviados aqui na conversa precisam ser publicados na Biblioteca do site. Até lá, a lista abaixo identifica os textos usados para elaborar esta revisão.</p>';
 return panel('Materiais e textos',html+
  '<details class="s1-ref-list"><summary>Fontes para conferência ('+sources.length+' referências temáticas)</summary><ul>'+
  sources.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></details>',
  'Os títulos abaixo identificam arquivos de referência, não comprovam que já estejam publicados no site.');
}
function topicsView(ctx){
 const arr=ctx.topics||[],done=ctx.doneBox||(()=>''),key=ctx.topicProgressKey||((_,i)=>'topic:'+ctx.id+':'+i);
 return panel('Conteúdos para revisar','<div class="topicgrid review-grid">'+arr.map((t,i)=>
  '<article class="topicunit review-item"><details class="topic review-details"><summary><span class="review-index">'+String(i+1).padStart(2,'0')+'</span><span class="review-title">'+esc(t.title)+'</span></summary>'+
  '<div class="review-body"><div class="review-info"><span class="review-info-label">Conceito</span><p>'+esc(t.definition)+'</p></div>'+
  '<div class="review-info"><span class="review-info-label">Exemplo</span><p>'+esc(t.scenario)+'</p></div>'+
  '<div class="review-mistake"><strong>Interpretação incorreta</strong><p>'+esc(t.myth)+'</p></div>'+
  '<p class="s1-source"><b>Fonte:</b> '+esc(t.source)+'</p></div></details>'+
  '<div class="topicfoot review-actions">'+done(key(ctx.id,i),'Visto')+'</div></article>').join('')+'</div>',
  arr.length+' conceitos organizados por tema. Marque um item depois de relembrá-lo.');
}
function examsView(ctx){
 return panel('Simulados','<div class="examgrid exam-grid-5">'+(ctx.exams||[]).map((e,i)=>
  '<article class="examcard ge-clean-card" style="--accent:'+esc(ctx.subject.color||'#687cb5')+'"><div class="ge-clean-head">'+
  '<h3>'+esc(e.title)+'</h3></div><p class="ge-clean-specs">'+e.questions.length+' questões · 3 dissertativas</p>'+
  '<button type="button" class="btn ge-clean-launch" data-action="test:'+esc(e.id)+'">Iniciar / ver correção →</button></article>').join('')+'</div>',
 'Simulados autorais de revisão: não são provas antigas nem gabaritos oficiais dos professores.');
}
function trailView(ctx){
 const arr=ctx.topics||[],chunks=[arr.slice(0,4),arr.slice(4,8),arr.slice(8,12),arr.slice(12)];
 const steps=['Retomar os fundamentos','Reconectar explicações e exemplos','Aplicar a conceitos próximos','Consolidar e testar a memória'];
 const stepsText=['Comece pela leitura dos conceitos centrais e confira as fontes.','Relacione explicações distintas e reconheça erros comuns.','Use situações e casos para justificar respostas.','Conclua com prática espaçada e simulados progressivos.'];
 const actions=[['topics','Conteúdos para revisar'],['guided','Estudos dirigidos'],['cases','Estudos de casos'],['tests','Simulados']];
 return '<div class="s1-trail"><header><small>ROTEIRO DE RETOMADA · 2026/1</small>'+
  '<h2>Trilha de Estudos para Relembrar</h2><p>Relembre os conteúdos do primeiro semestre com leituras, explicações, flashcards, casos e simulados. Os podcasts serão adicionados depois.</p></header>'+
  chunks.filter(x=>x.length).map((chunk,i)=>
   '<section class="s1-step"><div class="s1-step-head"><span>'+String(i+1).padStart(2,'0')+'</span><div><h3>'+esc(steps[i])+'</h3><p>'+esc(stepsText[i])+'</p></div></div>'+
   '<ol>'+chunk.map(t=>'<li><strong>'+esc(t.title)+'</strong><span>'+esc(t.definition)+'</span></li>').join('')+'</ol>'+
   '<div class="s1-actions"><button class="btn ghost" type="button" data-action="subjectArea:'+actions[i][0]+'">'+actions[i][1]+' →</button>'+
   '<button class="btn ghost" type="button" data-action="subjectArea:flash">Praticar flashcards →</button>'+
   '<div class="s1-done">'+ctx.doneBox('trail:relembrar:'+ctx.id+':'+i,'Etapa concluída')+'</div></div></section>').join('')+'</div>';
}
function renderSubject(ctx){
 const id=ctx.id,area=ctx.area;
 if(!names[id])return '<div class="subject-hub-empty">Disciplina não encontrada.</div>';
 let output='';
 if(!area||area==='home'){
  output='<p class="subject-hub-area-intro">Escolha uma forma de relembrar o conteúdo estudado no primeiro semestre.</p>'+
   '<nav class="subject-hub-menu" aria-label="Áreas de estudo de '+esc(ctx.subject.name)+'">'+links.map(v=>
    '<button type="button" class="subject-hub-card'+(v[0]==='trail'?' subject-trail-highlight':'')+'" data-action="subjectArea:'+v[0]+'">'+
    '<span class="subject-hub-card-icon" aria-hidden="true">'+v[1]+'</span><span class="subject-hub-card-copy">'+
    '<strong class="subject-hub-card-title">'+v[2]+'</strong><span class="subject-hub-card-desc">'+v[3]+'</span></span><span class="subject-hub-card-arrow">→</span></button>').join('')+'</nav>';
 }else if(area==='trail')output=trailView(ctx);
 else if(area==='topics')output=topicsView(ctx);
 else if(area==='docs')output=docsView(ctx);
 else if(area==='flash')output=panel('Flashcards',window.PSICO_PRACTICE?.flashcards(id,ctx.topics,'2026/1')||'<p>Flashcards indisponíveis.</p>');
 else if(area==='cases')output=panel('Estudos de casos',window.PSICO_PRACTICE?.cases(id)||'<p>Casos indisponíveis.</p>');
 else if(area==='guided')output=panel('Estudos dirigidos',window.renderStudyGuide?.(id)||'<p>Estudos dirigidos indisponíveis.</p>');
 else if(area==='tests')output=examsView(ctx);
 else if(area==='podcasts')output=panel('Podcasts','<p class="s1-help">Esta área fica reservada para os episódios que serão enviados posteriormente. Nenhum áudio foi criado ou incluído nesta revisão.</p>');
 return top(id,ctx.subject)+(area&&area!=='home'?back:'')+output+'</div>';
}
function renderExams(db){
 return '<section class="s1-global-exams"><h1>Simulados para relembrar · 1º semestre</h1><p>Selecione uma disciplina. Cada uma tem cinco simulados de revisão, do muito fácil ao muito difícil.</p><div class="s1-global-grid">'+
 Object.keys(names).map(id=>'<article class="s1-exam-course"><strong>'+esc(names[id])+'</strong>'+
 (db.exams||[]).filter(e=>e.subject===id).map(e=>'<button type="button" data-action="test:'+esc(e.id)+'">'+esc(e.title)+' →</button>').join('')+
 '</article>').join('')+'</div></section>';
}
window.PSICO_FIRST_SEMESTER={apply,renderSubject,renderExams,topics,sources:SOURCES};
})();
