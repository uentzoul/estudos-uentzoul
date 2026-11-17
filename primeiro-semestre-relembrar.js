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
/* Cada simulado trabalha um conjunto próprio de temas.
   Os agrupamentos seguem apenas os conceitos efetivamente cadastrados no acervo. */
const examUnits={
 profissao:[
  ['Fundamentos, formação e ética',[0,1,2]],
  ['Filosofia moral e sigilo profissional',[3,4,5]],
  ['Educação, trabalho e Justiça',[6,7,8]],
  ['Clínica, especialidades e pesquisa',[9,10,11]],
  ['Pós-graduação e compromisso social',[12,13]]
 ],
 processos:[
  ['Sensação e percepção',[0,1,2]],
  ['Atenção e representação mental',[3,4,5]],
  ['Aprendizagem e sistemas de memória',[6,7,8,9]],
  ['Casos clínicos e funções executivas',[10,11,12]],
  ['Resolução de problemas e julgamento',[13,14,15]]
 ],
 direitos:[
  ['Fundamentos e universalidade dos direitos',[0,1,2]],
  ['Diversidade cultural e interculturalidade',[3,4]],
  ['Diferenças sociais e interseccionalidade',[5,6,7]],
  ['Ditadura, memória e compromisso ético',[8,9,10]],
  ['Políticas públicas, ODS e atuação',[11,12,13,14]]
 ],
 epistemologia:[
  ['Fundamentos do conhecimento científico',[0,1,2]],
  ['Filosofia antiga e formas de investigação',[3,4,5,6]],
  ['Ciência moderna e positivismo',[7,8]],
  ['Popper e Kuhn: teorias e mudanças',[9,10,11]],
  ['Lakatos e métodos de pesquisa',[12,13]]
 ],
 historia:[
  ['Historiografia e pensamento antigo',[0,1,2]],
  ['Renascimento e psicologia científica',[3,4,5]],
  ['Funcionalismo, Gestalt e Behaviorismo',[6,7,8]],
  ['Psicanálise, humanismo e cognitivismo',[9,10,11]],
  ['Psicologia no Brasil e pluralidade',[12,13]]
 ],
 sociocognitivas:[
  ['Piaget: esquemas e assimilação',[0,1,2]],
  ['Acomodação e início dos estágios',[3,4,5]],
  ['Desenvolvimento do pensamento lógico',[6,7,8]],
  ['Vygotsky, cultura e mediação',[9,10,11]],
  ['ZDI, internalização e paradigmas',[12,13,14]]
 ],
 desenvolvimento:[
  ['Fundamentos e teorias do desenvolvimento',[0,1,2,3]],
  ['Gestação, nascimento e primeira infância',[4,5,6]],
  ['Infância e mudanças no desenvolvimento',[7,8,9]],
  ['Adolescência e vida adulta',[10,11,12,13]],
  ['Envelhecimento, perdas e luto',[14,15,16]]
 ]
};
function themeGroups(id,arr){
 const plan=examUnits[id]||[];
 const assigned=new Set(plan.flatMap(([,indices])=>indices));
 const groups=plan.map(([label,indices])=>({label,items:indices.filter(i=>i<arr.length).map(i=>arr[i])}));
 // Se novos temas forem cadastrados, não são descartados silenciosamente.
 const extras=arr.filter((_,i)=>!assigned.has(i));
 if(extras.length&&groups.length){
  groups[groups.length-1].items.push(...extras);
  groups[groups.length-1].label+=' e temas adicionais';
 }
 return groups.filter(g=>g.items.length);
}

function relatedFirstTopics(focus,all,t){
 const index=all.findIndex(x=>x.title===t.title);
 const source=new Set(String(t.title+' '+t.definition).toLocaleLowerCase('pt-BR')
  .split(/[^\p{L}\p{N}]+/u).filter(x=>x.length>4));
 return all.filter(x=>x!==t).map(x=>{
  const distance=Math.abs(all.findIndex(t=>t.title===x.title)-index);
  const common=String(x.title+' '+x.definition).toLocaleLowerCase('pt-BR')
   .split(/[^\p{L}\p{N}]+/u).filter(w=>source.has(w)).length;
  return {topic:x,score:(focus.some(y=>y.title===x.title)?45:0)+Math.min(20,common*3)+12/(1+distance)};
 }).sort((a,b)=>b.score-a.score||all.indexOf(a.topic)-all.indexOf(b.topic)).map(e=>e.topic);
}
function optionQuestion(id,model,i,focus,all){
 const t=focus[(i+model-1)%focus.length];
 // Em vez de conceitos aleatórios de toda a disciplina, testar diferenças
 // entre o tópico focal e seus vizinhos no mesmo módulo e referencial.
 const near=relatedFirstTopics(focus,all,t);
 const entries=[t,...near.slice(0,3)];
 const variants=entries.map((entry,j)=>({text:entry.title,why:j===0
  ?'É a melhor resposta para os elementos descritos: '+entry.definition+' No exemplo: '+t.scenario
  :'O conceito '+entry.title+' pode ser relacionado ao tema, mas focaliza outro mecanismo: '+entry.definition+' A situação enfatiza '+t.title+'.'}));
 const shift=(model+i)%4,options=variants.slice(shift).concat(variants.slice(0,shift));
 const prompts=[
  'Analise a situação:\n\n'+t.scenario+'\n\nQual conceito identifica melhor o processo central descrito?',
  'Compare os conceitos próximos da lista. Qual deles corresponde ao mecanismo abaixo?\n\n'+t.definition,
  'Um aluno interpreta o caso assim:\n\n'+t.myth+'\n\nQual conceito é necessário para examinar criticamente essa hipótese?',
  'Considerando o tema abordado no material, analise:\n\n'+t.scenario+'\n\nQual leitura conceitual é a mais específica?',
  'A formulação abaixo se relaciona diretamente a qual conceito, e não apenas a uma noção próxima?\n\n'+t.definition,
  'Uma situação de aplicação teórica:\n\n'+t.scenario+'\n\nQual dos conceitos apresentados tem melhor correspondência com o caso?'
 ];
 return {id:'s1-'+id+'-temas-'+model+'-obj-'+(i+1),type:'choice',
  prompt:prompts[i%prompts.length],options,answer:(4-shift)%4,concept:t.title,source:t.source};
}
function tfQuestion(id,model,i,focus){
 const t=focus[(i+1)%focus.length],isTrue=(model+i)%2===0;
 return {id:'s1-'+id+'-temas-'+model+'-vf-'+(i+1),type:'tf',concept:t.title,
  prompt:'Sobre '+t.title+', analise a afirmação:\n\n“'+(isTrue?t.definition:t.myth)+'”',
  answer:isTrue,explanation:(isTrue?'Correta. ':'Incorreta. ')+t.definition+' Referência: '+t.source};
}
function essayQuestion(id,model,i,focus){
 const t=focus[(i+model-1)%focus.length],other=focus[(i+model)%focus.length];
 return {id:'s1-'+id+'-temas-'+model+'-disc-'+(i+1),type:'essay',concept:t.title,
  prompt:'A partir do conteúdo de '+names[id]+', explique '+t.title+'.\n\nSituação: '+t.scenario+
   '\n\nArticule sua resposta com '+other.title+' e discuta os limites de uma interpretação simplificadora.',
  criteria:['Definir corretamente '+t.title,'Analisar a situação concreta sem apenas repetir uma definição',
   'Estabelecer uma relação fundamentada com '+other.title,'Evitar inferências excessivas e a interpretação incorreta apresentada nos materiais'],
  model:t.definition+' '+t.scenario+' Relaciona-se com '+other.title+': '+other.definition+
  ' Não se deve concluir que '+t.myth,
  source:'Questão autoral com base em '+t.source+' e '+other.source};
}
function exams(id,arr){
 return themeGroups(id,arr).map((group,i)=>{
  const m=i+1,questions=[];
  for(let j=0;j<6;j++)questions.push(optionQuestion(id,m,j,group.items,arr));
  for(let j=0;j<3;j++)questions.push(tfQuestion(id,m,j,group.items));
  for(let j=0;j<3;j++)questions.push(essayQuestion(id,m,j,group.items));
  return {id:'relembrar-2026-1-'+id+'-temas-'+m,subject:id,model:m,
   title:'Simulado '+m+' · '+group.label,
   description:'9 questões objetivas e 3 dissertativas · dificuldade equilibrada',
   focus:group.label,topicsCovered:group.items.map(t=>t.title),questions,
   source:'Exercícios didáticos baseados nos temas cadastrados do primeiro semestre',
   revision:'relembrar-2026-1'};
 });
}
function makeCase(id,t,other,i){
 const good='Relacionar a situação aos elementos de '+t.title+' e considerar o contexto antes de concluir.';
 const bad='Interpretar o caso como confirmação da hipótese de que '+t.myth;
 return {id:'relembrar-2026-1-'+id+'-'+i,title:'Caso '+i+' — '+t.title,area:'Aplicação e pensamento crítico',
  intro:t.scenario+' Uma equipe de estudantes deve analisar o exemplo com base nos textos da disciplina.',
  stages:[
  {prompt:'Qual encaminhamento conceitual é mais adequado para começar a análise?',
   choices:[
    {label:good,outcome:'O grupo identifica o que os dados permitem discutir.',reason:t.definition},
    {label:bad,outcome:'A interpretação não se sustenta na leitura do material.',reason:'O enunciado incorreto do texto é: '+t.myth},
    {label:'Priorizar a explicação de '+other.title+' a partir da premissa: '+other.definition,outcome:'O grupo utiliza uma explicação conceitual diferente da que melhor se relaciona ao problema descrito.',reason:'É preciso distinguir o que o exemplo descreve de outros processos relacionados: '+t.definition}
   ]},
  {prompt:'Ao aprofundar o estudo, que estratégia ajuda a evitar uma conclusão superficial?',
   choices:[
    {label:'Comparar '+t.title+' a '+other.title+' e justificar as diferenças com a leitura.',outcome:'A equipe explicita relações e limites entre conceitos.',reason:'Segundo as fontes, '+t.definition+' Já '+other.title+': '+other.definition},
    {label:'Considerar os processos de '+t.title+' e '+other.title+' equivalentes para interpretar o caso.',outcome:'As diferenças entre mecanismos teóricos ficam subestimadas.',reason:'As duas noções descrevem objetos e ênfases que precisam ser diferenciados.'},
    {label:'Transferir diretamente a explicação de '+other.title+' para o exemplo sem verificar se os dados sustentam o mesmo mecanismo.',outcome:'A analogia não sustenta a conclusão proposta.',reason:'O caso deve ser interpretado a partir das características e condições descritas, e não apenas pela semelhança entre temas.'}
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
  // Substitui apenas os simulados de revisão do 1º semestre, sem duplicar modelos antigos.
  for(let j=db.exams.length-1;j>=0;j--){
   if(db.exams[j].subject===id && db.exams[j].revision==='relembrar-2026-1')db.exams.splice(j,1);
  }
  db.exams.push(...exams(id,arr));
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
 ['tests','✦','Simulados','Cinco temas diferentes, com dificuldade equilibrada'],
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
 const available=(ctx.docs||[]).filter(m=>m.available),sources=SOURCES[ctx.id]||[];
 const manager=window.PSICO_COURSE_MANAGER;
 const organizer=manager?.weeklyView?.('2026/1',ctx.id,available,ctx.docCard);
 const weekly=!!organizer?.weekly;
 const editor=window.PSICO_MATERIAL_EDITOR;
 const general=editor?.render?.(available,{
  subject:ctx.id,libraryView:false,
  classify:ctx.classify||(()=> 'Materiais complementares'),
  card:ctx.docCard
 })||'<div class="doclist">'+available.map(ctx.docCard).join('')+'</div>';
 const content='<div class="s1-library-organized">'+(organizer?.tabs||'')+
  (weekly?organizer.body:
   '<div class="s1-library-general">'+(editor?.editButton?.(ctx.id)||'')+
   (available.length?general:'<p class="s1-help">Nenhum documento desta disciplina está publicado.</p>')+
   (sources.length?'<details class="s1-ref-list"><summary>Fontes para conferência ('+sources.length+' referências)</summary><ul>'+sources.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></details>':'')+'</div>')+
  '</div>';
 return panel('Materiais e textos',content,
  'Acervo geral: arquivos por tipo. Por semanas: os nomes e a sequência aparecem como no Moodle de 2026/1.');
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
 'Cinco blocos de temas diferentes, com dificuldade equilibrada. Exercícios autorais: não são provas antigas nem gabaritos oficiais.');
}
function trailView(ctx){
 const arr=ctx.topics||[],chunks=[arr.slice(0,4),arr.slice(4,8),arr.slice(8,12),arr.slice(12)];
 const steps=['Retomar os fundamentos','Reconectar explicações e exemplos','Aplicar a conceitos próximos','Consolidar e testar a memória'];
 const stepsText=['Comece pela leitura dos conceitos centrais e confira as fontes.','Relacione explicações distintas e reconheça erros comuns.','Use situações e casos para justificar respostas.','Conclua com prática espaçada e simulados divididos por tema.'];
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
 return '<section class="s1-global-exams"><h1>Simulados para relembrar · 1º semestre</h1><p>Selecione uma disciplina. Cada disciplina tem cinco simulados de dificuldade equilibrada, distribuídos por temas diferentes do material já cadastrado.</p><div class="s1-global-grid">'+
 Object.keys(names).map(id=>'<article class="s1-exam-course"><strong>'+esc(names[id])+'</strong>'+
 (db.exams||[]).filter(e=>e.subject===id).map(e=>'<button type="button" data-action="test:'+esc(e.id)+'">'+esc(e.title)+' →</button>').join('')+
 '</article>').join('')+'</div></section>';
}
window.PSICO_FIRST_SEMESTER={apply,renderSubject,renderExams,topics,sources:SOURCES};
})();
