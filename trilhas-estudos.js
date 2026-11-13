/* Trilhas de Estudos para a Prova: apenas atalhos para conteúdos reais do site. */
(()=>{
'use strict';
const PLANS={
tcc:[
 {title:'Entender a Terapia do Esquema',goal:'Construa a base antes de tentar responder questões clínicas.',steps:[
 ['material','terapia do esquema','Leia a apresentação, concentrando-se nas necessidades emocionais, esquemas iniciais e modos.'],
 ['audio',1,'Ouça a explicação de fundamentos da Terapia do Esquema.'],
 ['audio',2,'Revise os nove primeiros esquemas com exemplos.'],
 ['audio',3,'Revise os demais esquemas e compare padrões semelhantes.'],
 ['flash',0,'Recupere os conceitos sem consultar os slides.']]},
 {title:'Compreender os modelos de terceira onda',goal:'Relacione cada abordagem à situação em que ela pode ser aplicada.',steps:[
 ['material','tccs de terceira onda','Leia os slides da terceira onda, identificando o foco de cada abordagem.'],
 ['audio',6,'Conecte a evolução do behaviorismo às terapias de terceira onda.'],
 ['material','act na clínica','Leia o texto de ACT e identifique os seis processos do Hexaflex.'],
 ['audio',7,'Ouça ACT e o modelo Hexaflex depois da leitura.'],
 ['cases',0,'Aplique flexibilidade psicológica, esquemas e modos aos casos.']]},
 {title:'Diferenciar intervenções e avaliar casos',goal:'Aprenda a justificar escolhas, em vez de apenas decorar siglas.',steps:[
 ['audio',8,'Compare DBT e MBCT.'],
 ['audio',9,'Compare CFT e FAP.'],
 ['audio',10,'Integre as intervenções clínicas apresentadas nos áudios.'],
 ['guided',0,'Responda ao estudo dirigido e identifique os temas em que ainda tem dúvidas.']]},
 {title:'Consolidar e testar a compreensão',goal:'Use a prática para localizar e corrigir dificuldades.',steps:[
 ['topics',0,'Reveja conceitos, exemplos e erros comuns.'],
 ['exam',1,'Faça o primeiro simulado para testar fundamentos.'],
 ['exam',3,'Avance para questões que exigem integração.'],
 ['exam',5,'Finalize com o simulado mais exigente e consulte a correção.']]}
],
familia:[
 {title:'Reconhecer violência e fatores de proteção',goal:'Comece pelas situações familiares que exigem uma leitura ética e contextual.',steps:[
 ['material','violência intrafamiliar','Leia as apresentações e o texto sobre violência intrafamiliar.'],
 ['audio',3,'Identifique dinâmicas da violência no ambiente familiar.'],
 ['audio',4,'Estude sinais de violência contra crianças e adolescentes.'],
 ['cases',0,'Analise casos sem culpabilização automática de familiares.']]},
 {title:'Entender perda, luto e dependência química',goal:'Relacione sintomas, vínculos, redes de apoio e ciclo de vida.',steps:[
 ['material','luto','Leia o material de luto e reorganização familiar.'],
 ['material','dependência química','Leia o capítulo sobre dependência química na perspectiva sistêmica.'],
 ['audio',5,'Ouça os efeitos da dependência química nas relações familiares.'],
 ['flash',0,'Revise luto, violência e dependência química com recordação ativa.']]},
 {title:'Aplicar o atendimento clínico à família',goal:'Aprenda a diferenciar possibilidades de atuação e limites da intervenção.',steps:[
 ['material','atendimentos clínico','Leia as possibilidades de atendimento clínico, hospitalar, escolar e jurídico.'],
 ['audio',7,'Relacione padrões familiares e transmissão geracional.'],
 ['guided',0,'Responda às questões comentadas do estudo dirigido.'],
 ['topics',0,'Confira os pontos em que ainda erra ou hesita.']]},
 {title:'Treinar para a prova',goal:'Revise primeiro os fundamentos e depois situações complexas.',steps:[
 ['exam',1,'Faça uma prova inicial para localizar dúvidas.'],
 ['exam',3,'Interprete situações com múltiplos conceitos.'],
 ['exam',5,'Conclua com a dificuldade máxima e revise os erros.']]}
],
meta:[
 {title:'Visualizar o funcionamento do aparelho psíquico',goal:'Use as aulas do professor para estabelecer a sequência dos conceitos.',steps:[
 ['video',0,'Abra a linha do tempo e consulte cada aula por assunto e minutagem.'],
 ['material','segunda tópica','Leia os slides da segunda tópica após a explicação do professor.'],
 ['audio',4,'Relacione Id, Ego e Superego ao conflito psíquico.']]},
 {title:'Distinguir Édipo e narcisismo',goal:'Evite reduzir os conceitos a definições isoladas.',steps:[
 ['material','édipo','Leia os slides do complexo de Édipo.'],
 ['audio',1,'Comece pelo narcisismo e sua função metapsicológica.'],
 ['audio',2,'Ouça o papel do Édipo na constituição psíquica.'],
 ['topics',0,'Compare os principais conceitos usando exemplos.']]},
 {title:'Organizar pulsão, angústia e conflito',goal:'Conecte mecanismos, instâncias e transformações teóricas.',steps:[
 ['material','pulsão','Leia a apresentação sobre pulsão e suas características.'],
 ['audio',5,'Distinga instinto, pulsão e pulsão de morte.'],
 ['material','angústia','Leia o material sobre angústia e identifique as duas formulações freudianas.'],
 ['audio',6,'Ouça a comparação entre as teorias freudianas da angústia.'],
 ['guided',0,'Responda ao estudo dirigido P2 para localizar lacunas.']]},
 {title:'Revisão integradora e simulado',goal:'Teste articulações conceituais e identifique os pontos que ainda precisam de revisão.',steps:[
 ['audio',7,'Ouça a revisão geral da metapsicologia.'],
 ['flash',0,'Treine definições e diferenciações sem consultar anotações.'],
 ['exam',2,'Teste conceitos e relações fundamentais.'],
 ['exam',5,'Encerre com os casos mais exigentes.']]}
],
grupos:[
 {title:'Compreender o Psicodrama de Moreno',goal:'Parta das ideias de papel, espontaneidade, cena e ação.',steps:[
 ['material','psicodrama','Leia a apresentação ou o texto de Psicodrama.'],
 ['audio',1,'Ouça a apresentação do Psicodrama e sua proposta.'],
 ['audio',2,'Aprofunde papéis e dramatização com exemplos.'],
 ['cases',0,'Analise uma situação grupal pela lógica do Psicodrama.']]},
 {title:'Compreender os Grupos de Encontro de Carl Rogers',goal:'Diferencie facilitação, empatia, congruência e consideração positiva incondicional.',steps:[
 ['material','carl rogers','Leia o material sobre Carl Rogers e Grupos de Encontro.'],
 ['audio',3,'Ouça os fundamentos dos grupos de encontro.'],
 ['audio',4,'Entenda o funcionamento dos grupos rogerianos.'],
 ['flash',0,'Compare os conceitos de Rogers e Moreno.']]},
 {title:'Analisar Escritores da Liberdade',goal:'Relacione a dinâmica grupal a vínculos, diferenças e transformação.',steps:[
 ['material','escritores da liberdade','Consulte o material de estudo do filme.'],
 ['audio',6,'Ouça uma síntese comparativa de Moreno e Rogers.'],
 ['guided',0,'Responda às perguntas dirigidas para articular teoria e filme.'],
 ['topics',0,'Revise os conceitos que aparecem na análise do grupo.']]},
 {title:'Treinar as aproximações e diferenças',goal:'Conclua passando do conceito à leitura crítica de situações.',steps:[
 ['exam',1,'Faça a primeira prova de verificação.'],
 ['exam',3,'Integre teorias, exemplos e o filme.'],
 ['exam',5,'Corrija a prova avançada e retorne aos temas de maior erro.']]}
],
social:[
 {title:'Entender a produção social da subjetividade',goal:'Inicie com a perspectiva sócio-histórica e o contexto brasileiro.',steps:[
 ['material','psicologia sócio-histórica','Leia a apresentação e os textos de perspectiva sócio-histórica.'],
 ['audio',1,'Ouça a discussão sobre a formação social da identidade.'],
 ['topics',0,'Explique os conceitos com situações da vida cotidiana.']]},
 {title:'Ler ideologia, fatalismo e libertação',goal:'Relacione os autores às condições históricas e às desigualdades.',steps:[
 ['material','o latino indolente','Leia o texto de Martín-Baró e destaque a crítica ao fatalismo.'],
 ['audio',2,'Ouça a discussão sobre ideologia e fatalismo.'],
 ['material','desideologização','Leia a contribuição da desideologização à Psicologia Social.'],
 ['audio',6,'Ouça a síntese sobre Psicologia da Libertação.'],
 ['cases',0,'Analise situações sem naturalizar desigualdades.']]},
 {title:'Relacionar marcadores sociais e políticas públicas',goal:'Entenda os efeitos de raça, gênero, interseccionalidades e políticas.',steps:[
 ['material','epistemicídio','Leia o material sobre epistemicídio, racismo e sexismo.'],
 ['material','interseccionalidade','Leia o texto sobre interseccionalidades e processos de subjetivação.'],
 ['audio',5,'Ouça a discussão sobre epistemicídio e neutralidade científica.'],
 ['material','infância e políticas públicas','Leia o material sobre infância e políticas públicas.'],
 ['audio',4,'Ouça a discussão crítica sobre infância, proteção e vigilância.']]},
 {title:'Fechar com articulação e prova',goal:'Transforme a leitura dos textos em respostas justificadas.',steps:[
 ['guided',0,'Responda às perguntas do estudo dirigido.'],
 ['flash',0,'Recupere autores, conceitos e exemplos.'],
 ['exam',1,'Faça o simulado inicial.'],
 ['exam',3,'Treine interpretação intermediária.'],
 ['exam',5,'Finalize com o simulado avançado e confira a correção.']]}
],
avaliacao:[
 {title:'Compreender documentos e decisões técnicas',goal:'Primeiro, distinga finalidade, estrutura, limites e princípios éticos dos documentos.',steps:[
 ['material','elaboração de documentos','Leia a apresentação sobre elaboração de documentos psicológicos.'],
 ['audio',1,'Diferencie os documentos psicológicos e suas finalidades.'],
 ['audio',2,'Relacione documentação e fundamentos da psicometria.'],
 ['audio',3,'Compare laudo, parecer e relatório em situações concretas.']]},
 {title:'Dominar entrevistas e devolutiva',goal:'Aprenda a vincular demanda, método, comunicação e cuidado ético.',steps:[
 ['material','entrevista de devolução','Leia os slides sobre entrevista de devolução.'],
 ['audio',4,'Ouça a discussão sobre entrevista e anamnese.'],
 ['guided',0,'Responda às questões de entrevista e devolutiva.'],
 ['cases',0,'Aplique princípios éticos a exemplos de avaliação.']]},
 {title:'Distinguir contextos de avaliação',goal:'Relacione o contexto à demanda, aos instrumentos e aos documentos.',steps:[
 ['material','contexto organizacional','Estude demandas e limites no contexto organizacional.'],
 ['material','hospitalar e forense','Leia os exemplos de avaliação hospitalar e forense.'],
 ['audio',5,'Revise validade, precisão e fundamentos psicométricos.'],
 ['topics',0,'Organize conceitos e exemplos para evitar confusões na prova.']]},
 {title:'Integrar e verificar aprendizagem',goal:'Feche a revisão com recordação ativa e correções comentadas.',steps:[
 ['flash',0,'Revise os conceitos essenciais sem consultar materiais.'],
 ['exam',1,'Faça o simulado de conceitos básicos.'],
 ['exam',3,'Treine questões com mais interpretação.'],
 ['exam',5,'Confira a correção do simulado final e revise os pontos em que teve dúvidas.']]}
]
};
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LABELS={material:['Leitura','file-text'],audio:['Podcast','headphones'],flash:['Flashcards','layers'],cases:['Estudo de casos','brain'],guided:['Estudo dirigido','list-checks'],topics:['Revisão','book-open'],exam:['Simulado','clipboard-check'],video:['Aulas gravadas','play-circle']};
const ACTIONS={flash:['flash','Abrir flashcards'],cases:['cases','Abrir estudos de casos'],guided:['guided','Abrir estudo dirigido'],topics:['topics','Abrir conteúdos para revisar']};
function prepare(subject,phaseIndex,stepIndex,step,ctx,usedDocs){
 const [type,id,explanation]=step;
 const key='trail:'+subject+':'+phaseIndex+':'+stepIndex;
 let label=LABELS[type]?.[0]||'Estudo',title='',action='';
 if(type==='material'){
  const query=normalize(id);
  const m=(ctx.materials||[]).find(x=>x.available&&x.url!==null&&!usedDocs.has(x)&&normalize((x.title||'')+' '+(x.source||'')).includes(query));
  if(!m)return null;
  usedDocs.add(m);title=m.title;
  const url=m._libraryUpload?'#':m.url;
  const attr=m._libraryUpload?' data-library-file="'+safe(m._libraryKey)+'"':'';
  action='<a class="study-trail-open" href="'+safe(url)+'"'+attr+' target="_blank" rel="noopener noreferrer" aria-label="Abrir '+safe(title)+'">Abrir arquivo <span aria-hidden="true">↗</span></a>';
 }else if(type==='audio'){
  const i=(ctx.episodes||[]).findIndex(e=>Number(e.n)===Number(id));
  if(i<0||!ctx.episodeAvailable(i))return null;
  const e=ctx.episodes[i];title=e.title;
  action='<button type="button" class="study-trail-open" data-action="trailAudio:'+safe(subject)+':'+Number(e.n)+'">Ouvir episódio <span aria-hidden="true">→</span></button>';
 }else if(type==='exam'){
  const exam=(ctx.exams||[])[Number(id)-1];
  if(!exam)return null;
  title='Simulado '+id+' · '+(['','Muito fácil','Fácil','Intermediário','Difícil','Muito difícil'][Number(id)]||'Revisão');
  action='<button type="button" class="study-trail-open" data-action="test:'+safe(exam.id)+'">Iniciar simulado <span aria-hidden="true">→</span></button>';
 }else if(type==='video'){
  if(subject!=='meta')return null;
  title='Linha do Tempo das Aulas Gravadas';
  action='<a class="study-trail-open" href="metapsicologia-p2.html">Ver aulas gravadas <span aria-hidden="true">↗</span></a>';
 }else if(ACTIONS[type]){
  title=({flash:'Treino de recordação ativa',cases:'Aplicação em estudos de casos',guided:'Questões do estudo dirigido',topics:'Conteúdos e exemplos comentados'})[type];
  action='<button type="button" class="study-trail-open" data-action="subjectArea:'+ACTIONS[type][0]+'">'+ACTIONS[type][1]+' <span aria-hidden="true">→</span></button>';
 }else return null;
 return {key,label,title,action,explanation,completed:ctx.isDone(key),mark:ctx.doneBox(key,'Concluir etapa')};
}
function render(ctx){
 const subject=ctx?.subject,plan=PLANS[subject];if(!plan)return '<div class="study-trail-empty">A trilha desta disciplina será montada quando houver materiais publicados.</div>';
 const usedDocs=new Set(),phases=plan.map((p,pi)=>({...p,items:p.steps.map((st,si)=>prepare(subject,pi,si,st,ctx,usedDocs)).filter(Boolean)})).filter(p=>p.items.length);
 const items=phases.flatMap(p=>p.items),completed=items.filter(i=>i.completed).length;
 const percent=items.length?Math.round(completed/items.length*100):0;
 let number=0;
 const html=phases.map((phase,i)=>'<section class="study-trail-phase" id="study-trail-phase-'+safe(subject)+'-'+i+'"><div class="study-trail-phase-head"><div class="study-trail-phase-index">'+String(i+1).padStart(2,'0')+'</div><div><span class="study-trail-kicker">ETAPA '+(i+1)+' DE '+phases.length+'</span><h2>'+safe(phase.title)+'</h2><p>'+safe(phase.goal)+'</p></div></div><div class="study-trail-items">'+
 phase.items.map(item=>{number++;return '<article class="study-trail-item '+(item.completed?'done':'')+'"><span class="study-trail-counter">'+String(number).padStart(2,'0')+'</span><div class="study-trail-item-content"><span class="study-trail-kind">'+safe(item.label)+'</span><h3>'+safe(item.title)+'</h3><p>'+safe(item.explanation)+'</p><div class="study-trail-item-footer">'+item.action+item.mark+'</div></div></article>'}).join('')+
 '</div></section>').join('');
 return '<div class="study-trail" style="--study-trail-color:'+safe(ctx.color||'#8069be')+'"><header class="study-trail-intro"><div class="study-trail-intro-text"><span class="study-trail-overline">ROTEIRO GUIADO · '+safe(ctx.subjectName||'Psicologia')+'</span><h1>Trilha de Estudos para a Prova</h1><p>Uma sequência recomendada para compreender, praticar e revisar: as leituras, podcasts, exercícios e simulados continuam nas suas páginas originais.</p><div class="study-trail-quick">'+phases.map((p,i)=>'<a href="#study-trail-phase-'+safe(subject)+'-'+i+'">'+(i+1)+'. '+safe(p.title)+'</a>').join('')+'</div></div><div class="study-trail-progress"><span>SEU PROGRESSO</span><strong>'+completed+'<small> / '+items.length+' etapas</small></strong><div class="study-trail-track" role="progressbar" aria-label="Progresso da trilha" aria-valuenow="'+percent+'" aria-valuemin="0" aria-valuemax="100"><i style="width:'+percent+'%"></i></div><b>'+percent+'% concluído</b></div></header>'+
 '<p class="study-trail-caption">Os arquivos só aparecem aqui quando estão publicados. Marque cada etapa depois de estudar; a sequência fica salva no seu progresso pessoal.</p><div class="study-trail-phases">'+html+'</div><div class="study-trail-finish"><strong>Concluiu a sequência?</strong><p>Reveja a correção dos simulados e volte às seções originais para aprofundar os conteúdos que ainda trouxeram dúvida.</p></div></div>';
}
window.PSICO_STUDY_TRAILS={render,plans:PLANS};
})();