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
   '\n\nQual interpretação estaria errada? Explique por quê.',
  options:[],answer:null,
  explanation:'Conceito: '+t.definition+'\n\nAplicação: '+t.scenario+
  '\n\nInterpretação inadequada: '+t.myth+'\n\nReferência no acervo: '+t.source,
  contrast:'Explique o conceito, relacione-o ao exemplo e mostre por que a outra interpretação não se aplica.',
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
 return all.filter(x=>x.title!==t.title).map(x=>{
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
  :'O conceito '+entry.title+' pode ser relacionado ao tema, mas focaliza outro mecanismo: '+entry.definition+' O ponto central do caso é '+t.title+'.'}));
 const shift=(model+i)%4,options=variants.slice(shift).concat(variants.slice(0,shift));
 const prompts=[
  'Leia a situação:\n\n'+t.scenario+'\n\nQual conceito explica melhor a situação?',
  'Qual conceito corresponde à explicação abaixo?\n\n'+t.definition,
  'Um aluno interpreta o caso assim:\n\n'+t.myth+'\n\nQual conceito ajuda a avaliar essa interpretação?',
  'Considere o exemplo:\n\n'+t.scenario+'\n\nQual conceito explica melhor o que aconteceu?',
  'Qual conceito é descrito a seguir?\n\n'+t.definition,
  'Exemplo:\n\n'+t.scenario+'\n\nQual conceito é mais adequado ao caso?'
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
   '\n\nRelacione sua resposta com '+other.title+' e explique que conclusões não podem ser tiradas apenas desse exemplo.',
  criteria:['Definir corretamente '+t.title,'Explicar o caso com informações concretas',
   'Explicar a relação com '+other.title,'Não tirar conclusões além dos dados do caso'],
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

/* Casos do 1º semestre: hipóteses concorrentes são conceitos do próprio acervo,
   não recomendações obviamente descuidadas. As duas etapas exigem ler o caso
   e depois distinguir conceitualmente os mecanismos. IDs preservados. */
const CASE_CONTRASTS={"sociocognitivas":[["Assimilação aplica esquemas disponíveis à novidade; acomodação modifica esquemas diante de incompatibilidades.","Assimilação reorganiza o esquema quando o objeto não se encaixa; acomodação apenas reconhece um objeto semelhante.","Assimilação só ocorre antes do pensamento operatório; acomodação torna-se possível ao iniciar as operações formais."],["A perspectiva histórico-cultural explica a gênese social das funções; mediação descreve recursos simbólicos e instrumentais nessa relação.","A mediação é a ajuda direta de um adulto, enquanto a perspectiva histórico-cultural descreve principalmente maturação biológica.","A perspectiva histórico-cultural trata apenas de convivência; signos e linguagem pertencem aos esquemas individuais de Piaget."],["A zona de desenvolvimento iminente descreve processos em amadurecimento na colaboração; internalização envolve reorganização da atividade compartilhada.","A zona de desenvolvimento iminente mede somente o que a criança já faz sozinha; internalização é reprodução literal da instrução.","A internalização corresponde à passagem da ajuda para a autonomia com reprodução do procedimento aprendido, e a zona de desenvolvimento iminente descreve essa transferência."]],"epistemologia":[["Conhecimento científico exige investigação e crítica de evidências; mito e logos nomeiam modos históricos de explicação que podem coexistir.","A ciência se distingue do senso comum por rejeitar toda experiência cotidiana; a passagem do mito ao logos encerra a explicação narrativa.","O senso comum é uma etapa inicial do método científico, e o logos corresponde necessariamente à experimentação controlada."],["Popper exige refutabilidade e testes críticos; Kuhn descreve pesquisa normal orientada por paradigma e exemplares compartilhados.","Popper fundamenta a ciência normal em paradigmas, enquanto Kuhn define ciência pela possibilidade de falsificação de hipóteses.","A refutação de uma previsão basta, para Kuhn, para inaugurar um paradigma; Popper considera provas positivas cumulativas."],["Lakatos analisa progresso ou degeneração de programas ao longo do tempo; métodos qualitativos e quantitativos se distinguem pelas perguntas e evidências.","Um programa é progressivo quando escolhe metodologia quantitativa, enquanto programas qualitativos só podem produzir hipóteses auxiliares.","Para Lakatos, falhar em um teste exige abandonar o núcleo duro; métodos mistos são incompatíveis com programas de pesquisa."]],"historia":[["Agostinho e Tomás articulam fé e razão de modos diferentes; a Renascença reorganiza essas questões em novos contextos.","O pensamento medieval abandona a filosofia clássica e discute apenas doutrina religiosa; a Renascença restaura pela primeira vez a razão.","A reflexão medieval já segue os métodos da Psicologia experimental, enquanto o Renascimento retorna a explicações míticas."],["Freud investiga conflitos, defesas e processos inconscientes; o humanismo enfatiza experiência vivida, singularidade e relações.","A Psicanálise se concentra na experiência consciente imediata; o humanismo explica sintomas principalmente pelo recalque inconsciente.","Freud e o humanismo partem da mesma teoria pulsional e diferem somente na técnica de escuta em sessão."],["A história da Psicologia brasileira envolve instituições e condições políticas locais; a pluralidade descreve abordagens com objetos e métodos diversos.","A Psicologia brasileira segue a mesma sequência internacional de escolas, enquanto sua pluralidade se refere apenas a especializações.","A pluralidade de escolas elimina a relevância do contexto brasileiro para compreender a formação da profissão."]],"processos":[["Percepção organiza e interpreta estímulos; atenção seletiva prioriza quais informações recebem processamento em cada contexto.","Atenção seletiva produz o significado final da imagem; percepção apenas decide quais estímulos chegam ao sistema nervoso.","A percepção de uma imagem ambígua depende exclusivamente de focalização atencional, sem participação de expectativas e memória."],["Memória não declarativa permite aprender habilidades sem relato consciente; o caso H. M. oferece evidências de dissociação de sistemas.","Memória não declarativa é recordar episódios pessoais; H. M. exemplifica perda homogênea de toda aprendizagem procedimental.","O caso H. M. demonstrou que executar habilidades requer memória episódica preservada e verbalização das etapas."],["Alterações frontais podem comprometer autorregulação; resolução de problemas envolve metas, planejamento e revisão de estratégias.","O caso Gage demonstra que toda decisão depende de uma única área; resolver problemas seria apenas aplicar uma regra já aprendida.","Dificuldades de planejamento após lesão são melhor explicadas por perda de memória semântica do que por processos executivos."]],"profissao":[["Ética problematiza fundamentos de normas e valores; Kant oferece uma formulação específica baseada em dever e universalização de máximas.","Ética identifica as condutas aceitas pela maioria; Kant avalia moralidade principalmente pelas consequências agradáveis.","Moral e ética são sinônimos técnicos; a contribuição de Kant consiste em adaptar regras às preferências individuais."],["Psicologia Clínica e da Saúde atua em diferentes contextos de cuidado; registro de especialista reconhece qualificação e não define sozinho as atribuições gerais.","A Psicologia da Saúde corresponde a atendimento exclusivamente hospitalar; registro de especialista define autorização de atuação clínica.","O registro de especialista substitui a formação generalista e delimita quais demandas o profissional pode investigar em saúde."],["Especialização e residência integram formações lato sensu com regras próprias; mestrado e doutorado são stricto sensu, voltados também à pesquisa.","Mestrado profissional é lato sensu por sua relação com a prática; doutorado é stricto sensu apenas quando vinculado à docência.","Residência e doutorado são equivalentes como formação stricto sensu, enquanto especialização exige defesa de dissertação."]],"direitos":[["Universalismo afirma titularidade de direitos; relativismo cultural ressalta contextos de interpretação, sem que isso resolva automaticamente tensões.","Universalismo exige uniformidade cultural de aplicação; relativismo pressupõe que nenhuma prática possa ser analisada criticamente.","Relativismo e universalismo descrevem a mesma posição jurídica, divergindo apenas quanto à competência dos Estados."],["A Clínica do Testemunho articula escuta e reconhecimento de violência de Estado; compromisso ético-político diz respeito à orientação ampla da prática profissional.","O testemunho só possui relevância após comprovação judicial; compromisso ético-político limita-se à neutralidade da escuta técnica.","Clínica do Testemunho e compromisso ético-político referem-se à mesma modalidade de tratamento individual sem dimensão histórica."],["A Agenda 2030 integra dimensões social, econômica e ambiental; a atuação psicológica dialoga com saúde, desigualdade e clima em ODS específicos.","A Agenda 2030 se organiza exclusivamente em metas ambientais; saúde e desigualdade são temas de serviços públicos alheios aos ODS.","Os ODS 3, 10 e 13 abordam apenas indicadores clínicos, sem relação com desigualdade ou fatores ambientais."]],"desenvolvimento":[["Freud e Rogers oferecem perspectivas distintas sobre conflito e experiência; Erikson organiza crises psicossociais ao longo do ciclo vital.","Freud e Rogers utilizam os mesmos estágios psicossexuais, enquanto Erikson restringe o desenvolvimento aos primeiros anos de vida.","A teoria de Erikson explica apenas mudanças biológicas, e as perspectivas de Freud e Rogers diferem unicamente na terminologia."],["O sono pode influenciar atenção e comportamento, mas dificuldades escolares exigem contexto e outras hipóteses explicativas.","A privação de sono é critério diagnóstico suficiente para explicar desatenção; mudanças de etapa escolar têm influência marginal.","O sono interfere somente no estado físico, enquanto dificuldades emocionais e de aprendizagem dependem exclusivamente de identidade adolescente."],["No adulto jovem, trabalho, intimidade e autonomia podem se reorganizar; na adultez intermediária entram outras transições, sem sequência obrigatória.","Ser adulto jovem depende de concluir casamento e carreira, ao passo que a meia-idade se define por declínio intelectual homogêneo.","Adulto jovem e adultez intermediária se distinguem predominantemente por demandas ocupacionais, enquanto mudanças nos vínculos afetivos são secundárias."]]};
function makeCase(id,t,other,i){
 const all=topics(id),nearest=relatedFirstTopics([t,other],all,t).filter(x=>x.title!==other.title);
 const third=nearest[0]||all.find(x=>x.title!==t.title&&x.title!==other.title)||other;
 const comparison=CASE_CONTRASTS[id]?.[i-1];
 const labels=[
  [t,other,third].map((x,j)=>({
   best:j===0,label:x.title+': '+x.definition,
   outcome:'A equipe passa a interpretar a situação pelo mecanismo de '+x.title+'.',
   reason:x.title===t.title?
    'Esta leitura se relaciona melhor ao dado central do exemplo: '+t.scenario+' '+t.definition:
    'O conceito de '+x.title+' está corretamente descrito, mas não explica com a mesma precisão o aspecto central do cenário. '+t.definition
  })),
  (comparison||[]).map((label,j)=>({
   best:j===0,label,
   outcome:j===0?'A equipe diferencia mecanismos teóricos e considera sua aplicação no caso.':
    'A interpretação se aproxima de outra noção estudada, mas confunde a função dos conceitos.',
   reason:j===0?'A distinção é consistente com os materiais: '+t.definition+' '+other.definition:
    'A alternativa troca a ênfase dos conceitos ou atribui a um deles uma função que não corresponde à teoria. '+t.title+': '+t.definition+' '+other.title+': '+other.definition
  }))
 ];
 if(labels[1].length!==3)throw Error('Contraste conceitual ausente: '+id+'/'+i);
 const seed=id.split('').reduce((a,c)=>a+c.charCodeAt(0),0)+i;
 const stages=labels.map((options,j)=>{
  const offset=(seed+j)%3;
  options.splice(offset,0,options.shift());
  return {prompt:j===0?
   'A partir do exemplo, qual formulação corresponde melhor ao mecanismo estudado?':
   'Qual comparação entre os conceitos está correta?',
   choices:options};
 });
 return {id:'relembrar-2026-1-'+id+'-'+i,title:'Caso '+i+' — '+t.title,
  area:'Aplicação e pensamento crítico',
  intro:t.scenario+' Há mais de uma hipótese possível, e a equipe precisa compará-las.',
  stages,
  wrapUp:'Síntese: '+t.definition+' Leitura indicada: '+t.source+'. Articulação: '+other.source+'.'};
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
 const arr=ctx.topics||[],chunks=[arr.slice(0,4),arr.slice(4,8),arr.slice(8,12),arr.slice(12)].filter(x=>x.length);
 const steps=['Rever os conceitos básicos','Ligar teoria e exemplos','Aplicar o que aprendeu','Treinar para relembrar'];
 const goals=['Leia os conceitos e confira se consegue explicá-los.','Veja como os conceitos aparecem em situações do dia a dia.','Compare explicações e pratique com exemplos.','Use as questões para descobrir o que ainda precisa revisar.'];
 const areas=[['topics','Ver todos os conceitos'],['guided','Abrir estudo dirigido'],['cases','Abrir estudos de casos'],['tests','Ver todos os simulados']];
 const list=chunks.map((chunk,i)=>{
  const first=chunk[0];
  const flash='<div class="s1-trail-flash"><div class="s1-trail-flash-top"><strong>Flashcards desta etapa</strong><span data-s1-status>1 de '+chunk.length+'</span></div>'+
   '<div class="s1-trail-flash-deck">'+chunk.map((t,j)=>'<button type="button" class="s1-trail-flash-card'+(j===0?' is-current':'')+'" data-s1-flip'+(j?' hidden':'')+' aria-pressed="false" aria-label="Mostrar resposta"><span class="s1-trail-flash-inner"><span class="s1-trail-flash-face s1-trail-flash-front">Explique: '+esc(t.title)+'</span><span class="s1-trail-flash-face s1-trail-flash-back">'+esc(t.definition)+'</span></span></button>').join('')+'</div>'+
   '<div class="s1-trail-flash-nav"><button type="button" data-s1-prev disabled>← Anterior</button><span>Toque no cartão para virar</span><button type="button" data-s1-next'+(chunk.length===1?' disabled':'')+'>Próximo →</button></div></div>';
  const example='<details class="s1-trail-practice"><summary>Exemplo e resposta comentada</summary><div><p>'+esc(first.scenario)+'</p><strong>Qual conceito explica melhor essa situação?</strong><details><summary>Ver explicação</summary><p>'+esc(first.title)+': '+esc(first.definition)+'</p><p><b>Cuidado:</b> '+esc(first.myth)+'</p></details></div></details>';
  const tests=i===chunks.length-1?'<div class="s1-trail-exams"><strong>Simulados para praticar</strong><div>'+
   (ctx.exams||[]).map((e,j)=>'<button type="button" data-action="test:'+esc(e.id)+'">Simulado '+(j+1)+' →</button>').join('')+'</div></div>':'';
  return '<section class="s1-step"><div class="s1-step-head"><span>'+String(i+1).padStart(2,'0')+'</span><div><h3>'+esc(steps[i])+'</h3><p>'+esc(goals[i])+'</p></div></div>'+
   '<div class="s1-trail-concepts"><h4>Conceitos desta etapa</h4>'+chunk.map(t=>'<details><summary>'+esc(t.title)+'</summary><p>'+esc(t.definition)+'</p><p><b>Exemplo:</b> '+esc(t.scenario)+'</p></details>').join('')+'</div>'+
   flash+example+tests+
   '<div class="s1-actions"><button class="btn ghost" type="button" data-action="subjectArea:'+areas[i][0]+'">'+areas[i][1]+' →</button>'+
   '<div class="s1-done">'+ctx.doneBox('trail:relembrar:'+ctx.id+':'+i,'Etapa concluída')+'</div></div></section>';
 }).join('');
 return '<div class="s1-trail"><header><small>REVISÃO DO 1º SEMESTRE</small><h2>Trilha de Estudos para Relembrar</h2>'+
 '<p>Reveja um assunto por vez. Leia, vire os flashcards, pratique com os exemplos e faça os simulados.</p></header>'+list+'</div>';
}
document.addEventListener('click',event=>{
 const trigger=event.target.closest?.('[data-s1-flip],[data-s1-prev],[data-s1-next]');
 if(!trigger||!trigger.closest('.s1-trail'))return;
 event.preventDefault();
 if(trigger.hasAttribute('data-s1-flip')){
  const flip=!trigger.classList.contains('is-flipped');
  trigger.classList.toggle('is-flipped',flip);
  trigger.setAttribute('aria-pressed',String(flip));
  trigger.setAttribute('aria-label',flip?'Mostrar pergunta':'Mostrar resposta');
  return;
 }
 const viewer=trigger.closest('.s1-trail-flash'),cards=[...viewer.querySelectorAll('[data-s1-flip]')],active=cards.findIndex(x=>!x.hidden);
 const next=Math.max(0,Math.min(cards.length-1,active+(trigger.hasAttribute('data-s1-next')?1:-1)));
 if(active===next||!cards.length)return;
 cards.forEach((card,i)=>{card.hidden=i!==next;card.classList.toggle('is-current',i===next);});
 viewer.querySelector('[data-s1-status]').textContent=(next+1)+' de '+cards.length;
 viewer.querySelector('[data-s1-prev]').disabled=next===0;
 viewer.querySelector('[data-s1-next]').disabled=next===cards.length-1;
});

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
