/* Revisão de lançamento — simulados finais de Psicologia PUCRS 2026/2.
   Novos IDs preservam tentativas, correções e questões de edições anteriores. */
(()=>{
'use strict';
const VERSION='rev-provas-equivalentes-20261113';
const META_VERSION='rev-meta-p2-roteiro-variado-20261119-v2';
const UPCOMING_VERSION='rev-provas-variadas-20261119-v1';
const SOCIAL_VERSION='rev-social-primeira-prova-uma-dissertativa-20261119-v2';
const EVAL_VERSION='rev-avaliacao-p3-21-questoes-20261119-v1';
const LEGACY_CURRENT='rev-final-20261113-r2';
const PREVIOUS_VERSION='rev-final-20261113';
const LETTERS=['I','II','III','IV','V'];
const familyExtra=[
{title:'Mitos, rituais e lealdades familiares',definition:'Mitos familiares são narrativas e expectativas compartilhadas que participam da organização das relações; os rituais podem expressar pertencimento, valores e regras, com sentidos diferentes entre os integrantes.',scenario:'Uma família debate se deve manter uma celebração tradicional: algumas pessoas a vivenciam como apoio, outras como obrigação.',myth:'Em um ritual familiar, o significado compartilhado pelo grupo define sua função principal, enquanto interpretações diferentes entre integrantes têm pouca relevância para compreender o vínculo.'},
{title:'Ritos de passagem e transgeracionalidade',definition:'Ritos de passagem marcam transições do ciclo vital; a perspectiva transgeracional investiga transmissão e transformação de valores, papéis e padrões entre gerações, sem supor determinismo.',scenario:'Quando a filha sai de casa, familiares percebem expectativas sobre autonomia herdadas de outras gerações e começam a negociá-las.',myth:'Na perspectiva transgeracional, padrões recebidos de gerações anteriores tendem a determinar os papéis atuais, e a renegociação familiar é apenas uma adaptação superficial.'}
];
const evalScope=new Set(['Entrevista de devolução','Linguagem e comunicação na devolução','Sigilo e compartilhamento ético','Avaliação no contexto organizacional','Avaliação hospitalar','Avaliação forense','Atendimento a pessoas trans','Ética na avaliação psicológica','Resolução CFP 31/2022 e fontes de informação','Resolução CFP 06/2019 e documentos','Laudo e parecer','Bateria e escolha de instrumentos']);
const norm=x=>String(x||'').replace(/\s+/g,' ').trim().replace(/[.?!]+$/,'');
const get=(a,i)=>a[((i%a.length)+a.length)%a.length];
const context=t=>t.scenario||'Uma pessoa apresenta demanda que exige avaliação atenta às condições de vida e ao contexto.';
const definition=t=>norm(t.definition);
const invalid=t=>norm(t.myth||'Uma única característica seria suficiente para interpretar todos os casos, independentemente do contexto.');
function curated(db,id){
 let items=id==='social'?[...(window.PSICOMOODLE_NEW_CONTENT?.social||[])]:[...(db.topics[id]||[])];
 if(id==='familia')for(const x of familyExtra)if(!items.some(t=>t.title===x.title))items.push(x);
 if(id==='avaliacao'&&!window.PSICO_AVALIACAO_P3_PRACTICE?.topics?.length)items=items.filter(x=>evalScope.has(x.title));
  if(id==='meta')items=items.filter(x=>!/^ang[uú]stia$/i.test(x.section||'')&&!/ang[uú]sti/i.test(x.title||''));
 return items.filter(x=>x.title&&x.definition);
}
function choices(all,t,level,slot,id,version=LEGACY_CURRENT){
 const seed=all.indexOf(t),seen=new Set([t.title]),wrongs=[];
 for(let i=1;i<all.length+2&&wrongs.length<4;i++){
  const other=get(all,seed+i*(level%2+1)+level);
  if(seen.has(other.title))continue;seen.add(other.title);
  wrongs.push({text:'Priorizar '+other.title+': '+definition(other)+'.',correct:false,
   why:'A alternativa se relaciona a '+other.title+', mas não explica melhor o caso. '+definition(t)+'.'});
 }
 for(const o of [
 {text:invalid(t)+'.',correct:false,why:'Generalização não sustentada pelo material. '+definition(t)+'.'},
 {text:'Desconsiderar a demanda e aplicar uma explicação única a todas as situações.',correct:false,why:'A formulação precisa ser contextualizada.'},
 {text:'Tratar fatores históricos, culturais e relacionais como irrelevantes para a análise.',correct:false,why:'Essa conclusão não é sustentada por um caso isolado.'},
 {text:'Presumir que um comportamento possui função idêntica em qualquer ambiente.',correct:false,why:'É necessário considerar contexto, função e limites de interpretação.'}
 ]){if(wrongs.length===4)break;if(!wrongs.some(x=>x.text===o.text))wrongs.push(o);}
 const right={text:t.title+': '+definition(t)+'.',correct:true,why:(version===LEGACY_CURRENT?'A situação exemplifica '+t.title+'. '+definition(t)+'. Interprete os elementos do caso considerando o contexto e os limites dos dados apresentados.':definition(t)+'. Na situação: '+context(t))};
 const answer=(level*2+slot)%5,options=wrongs.slice(0,4);options.splice(answer,0,right);
 const commands=version===LEGACY_CURRENT?['Qual interpretação está mais de acordo com a matéria?','Qual conceito explica melhor o caso?','Qual alternativa relaciona a teoria ao caso?','Qual alternativa define o conceito mais compatível com a situação?','Qual explicação combina melhor com o que foi apresentado?']:['Qual interpretação está mais de acordo com a matéria?','Qual conceito explica melhor o caso?','Qual alternativa relaciona a teoria ao caso?','Qual alternativa evita conclusões sem dados suficientes?','Qual formulação integra melhor conceito, aplicação e limites da conclusão?'];
 return {type:'choice',id,concept:t.title,prompt:'Situação: '+context(t)+'\n\n'+commands[level-1],options,answer,source:'Material de revisão da disciplina'};
}
function trueFalse(t,level,slot,id){
 const truth=(level+slot)%2===0;
 return {type:'tf',id,concept:t.title,prompt:'A afirmação a seguir sobre '+t.title+':\n\n'+(truth?definition(t):invalid(t))+'.',
 answer:truth,explanation:(truth?'Verdadeiro. ':'Falso. ')+definition(t)+'.'};
}
function assertions(a,b,c,level,slot,id){
 const raw=[
 {text:definition(a)+'.',truth:true,why:definition(a)+'.'},
 {text:invalid(a)+'.',truth:false,why:definition(a)+'.'},
 {text:definition(b)+'.',truth:true,why:definition(b)+'.'},
 {text:invalid(b)+'.',truth:false,why:definition(b)+'.'},
 {text:definition(c)+'.',truth:true,why:definition(c)+'.'}
 ];
 const shifted=raw.map((_,i)=>raw[(i+level+slot)%5]).map((s,i)=>({...s,l:LETTERS[i]}));
 const correct=shifted.filter(x=>x.truth).map(x=>x.l);
 const sets=[correct,shifted.slice(0,3).map(x=>x.l),[shifted[0].l,shifted[2].l,shifted[3].l],
  [shifted[0].l,shifted[3].l,shifted[4].l],[shifted[1].l,shifted[2].l,shifted[4].l],
  [shifted[0].l,shifted[1].l,shifted[2].l,shifted[4].l]];
 const unique=[],seen=new Set();
 for(const list of sets){const key=list.join('|');if(!seen.has(key)){seen.add(key);unique.push(list);}}
 const answer=(level+slot*2)%5,options=unique.slice(1,5);options.splice(answer,0,correct);
 return {type:'combo',id,concept:a.title,prompt:'Leia as afirmações sobre '+a.title+', '+b.title+' e '+c.title+'.\n\nMarque a opção com apenas as afirmações corretas.',
 assertions:shifted,options:options.map(x=>'Apenas '+x.join(', ')+'.'),answer,correct,answerSets:options};
}
function discursive(a,b,level,id){
 const tasks=['Defina os conceitos e apresente um exemplo aplicado.','Compare os conceitos e mostre semelhanças e diferenças.','Relacione os conceitos ao caso e explique por quê.','Analise o caso e explique os limites da intervenção.','Justifique sua resposta usando a teoria, o contexto e os cuidados éticos.'];
 return {type:'essay',id,concept:a.title,
 prompt:'Considere a situação: '+context(a)+'\n\n'+tasks[level-1]+'\n\nRelacione '+a.title+' com '+b.title+'. Use as informações do caso para justificar a resposta.',
 criteria:['Explicar corretamente '+a.title+'.','Relacionar o caso a '+b.title+' sem confundir os conceitos.','Utilizar elementos concretos da situação apresentada.','Considerar limites de interpretação, contexto e implicações éticas.'],
 model:'O conceito de '+a.title+' pode ser entendido assim: '+definition(a)+'. No caso, '+context(a)+' A análise também dialoga com '+b.title+': '+definition(b)+'. Uma resposta adequada diferencia as duas formulações e considera as características específicas da situação, evitando conclusões universais ou estigmatizantes.',
 source:'Resposta orientativa de estudo; confira os documentos originais.'};
}
function generate(id,level,topics,version=LEGACY_CURRENT){
 const qs=[],base=(level-1)*7;
 // Evite saltos múltiplos do número de assuntos: isso repetia um único tema
 // de Grupos e somente quatro temas por prova de Avaliação Psicológica.
 const stride=version===PREVIOUS_VERSION?3:(topics.length%3===0?5:3);
 for(let i=0;i<10;i++){
  const a=get(topics,base+i*stride),b=get(topics,base+i*stride+1),c=get(topics,base+i*stride+2);
  const qid=id+'-'+version+'-'+level+'-'+(i+1);
  qs.push(i===2||i===7?assertions(a,b,c,level,i,qid):
   i===3||i===6||i===9?trueFalse(a,level,i,qid):choices(topics,a,level,i,qid,version));
 }
 for(let i=0;i<2;i++)qs.push(discursive(get(topics,base+11+i*5),get(topics,base+15+i*5),level,id+'-'+version+'-'+level+'-'+(11+i)));
 return {id:id+'-'+version+'-'+level,subject:id,model:level,title:'Simulado '+level,final2026:true,revision:version,questions:qs};
}

// Cinco provas equivalentes: nao existe progressao de dificuldade pela versao.
// Cada prova possui 13 objetivas (inclusive assertivas/VF) e 2 dissertativas.
// Questões autorais com base nos conceitos e situações do acervo da disciplina.
const FORMATS={
 tcc:['combo','choice','combo','choice','combo','choice','combo','choice','combo','choice','combo','choice','combo'],
 familia:['choice','choice','combo','choice','choice','tf','choice','choice','combo','choice','choice','combo','choice'],
 meta:['combo','choice','choice','combo','choice','choice','combo','choice','combo','choice','tf','choice','combo'],
 grupos:['choice','combo','choice','choice','tf','choice','combo','choice','choice','combo','choice','choice','combo'],
 social:['combo','choice','tf','choice','combo','combo','choice','tf','combo','choice','combo','choice','combo'],
 avaliacao:['choice','combo','choice','choice','tf','choice','combo','choice','choice','combo','choice','combo','choice']
};
const groupTopics=[
 {title:'Psicodrama: aquecimento e dramatização',definition:'O aquecimento prepara a participação e a dramatização permite explorar situações por meio da ação, sem impor exposição forçada.',scenario:'Durante uma atividade, a coordenação prepara a turma antes de convidar participantes a representar uma situação.',myth:'Na dramatização psicodramática, a encenação pode iniciar diretamente pelo conflito central quando o grupo já manifesta confiança, tornando o aquecimento dispensável.'},
 {title:'Psicodrama: compartilhamento',definition:'O compartilhamento acolhe percepções suscitadas pela dramatização, sem reduzir a experiência a julgamento dos participantes.',scenario:'Depois da cena, os participantes falam sobre o que sentiram e identificaram em si.',myth:'No compartilhamento psicodramático, a principal tarefa é interpretar os papéis encenados e oferecer devolutivas sobre a atuação do protagonista.'},
 {title:'Psicodrama: papéis e espontaneidade',definition:'Os papéis são explorados na ação dramática, e a espontaneidade envolve respostas criativas e adequadas a situações presentes.',scenario:'Uma pessoa experimenta uma resposta diferente ao representar um conflito interpessoal.',myth:'Na teoria de Moreno, espontaneidade é a expressão imediata de impulsos individuais; a adequação da resposta à situação é secundária.'},
 {title:'Rogers: empatia no grupo',definition:'A compreensão empática busca aproximar-se do referencial vivido de outra pessoa, sem substituir sua experiência pela interpretação de quem escuta.',scenario:'Uma participante relata insegurança e o grupo procura compreender seu sentido antes de aconselhar.',myth:'Na abordagem de Rogers, demonstrar empatia implica validar a interpretação da outra pessoa como correta antes de explorar seu significado.'},
 {title:'Rogers: consideração positiva incondicional',definition:'Considerar alguém positivamente significa reconhecer seu valor sem condicionar o acolhimento à aprovação de cada conduta.',scenario:'Uma integrante admite uma dificuldade sem ser humilhada, enquanto o grupo conversa sobre responsabilidades.',myth:'A consideração positiva incondicional exige suspender a avaliação de comportamentos que prejudicam colegas para não comprometer a aceitação da pessoa.'},
 {title:'Rogers: congruência e autenticidade',definition:'Congruência é coerência e presença genuína na relação, sem exigir a exposição impulsiva de todos os sentimentos.',scenario:'Um facilitador reconhece uma tensão presente sem fingir neutralidade artificial nem atacar participantes.',myth:'A congruência rogeriana consiste principalmente em verbalizar as próprias reações internas, mesmo quando isso desloca o foco da experiência do participante.'},
 {title:'Rogers: facilitação e não diretividade',definition:'O facilitador acompanha a experiência do grupo e favorece autonomia, escuta e participação sem determinar previamente as respostas.',scenario:'Numa discussão, a facilitadora estimula diferentes vozes sem decidir por elas o significado da experiência.',myth:'Na facilitação não diretiva, o profissional evita intervir nos limites do grupo, pois qualquer estrutura de convivência contraria a autonomia dos participantes.'},
 {title:'Rogers: conflitos e confiança no grupo',definition:'A confiança pode favorecer a expressão e a elaboração de divergências; não implica ausência obrigatória de conflitos.',scenario:'Dois participantes discordam, e o grupo procura compreender os sentimentos sem silenciar a discordância.',myth:'Em grupos de encontro, o surgimento de conflito indica falha na confiança e deve ser contido antes que os participantes possam expressar sentimentos difíceis.'},
 {title:'Escritores da Liberdade: vínculos e escuta',definition:'No filme, práticas educativas de expressão e escuta ajudam estudantes a conhecer experiências distintas e construir vínculos.',scenario:'Estudantes compartilham relatos pessoais e começam a reconhecer experiências que antes desprezavam.',myth:'As práticas de escrita e escuta no filme podem ser classificadas como psicoterapia de grupo porque possibilitam expressão emocional e fortalecimento de vínculos.'},
 {title:'Escritores da Liberdade: preconceito e pertencimento',definition:'Conflitos, identidades e preconceitos atravessam relações escolares, que podem ser transformadas por práticas coletivas de reconhecimento.',scenario:'Grupos de estudantes inicialmente hostis encontram pontos de contato ao ouvir histórias uns dos outros.',myth:'A aproximação observada entre os estudantes indica superação dos conflitos sociais envolvidos na turma, pois o reconhecimento mútuo resolve suas principais causas.'}
];
function equalTopics(db,id){
 const items=curated(db,id).slice();
 if(id==='grupos')for(const t of groupTopics)if(!items.some(a=>a.title===t.title))items.push(t);
 return items;
}
function pickPool(all,model,slot,offset=0){
 // Rotacao por versao e passo coprimo ao numero de topicos.
 const n=all.length;
 let step=n>15?7:n>9?5:n>5?3:1;
 while(step<n&&gcd(step,n)!==1)step++;
 return get(all,(model-1)*3 + slot*step + offset);
}
function gcd(a,b){while(b){const t=a%b;a=b;b=t;}return a;}
function compact(s,max=260){
 const a=norm(s);return a.length<=max?a:a.slice(0,max).replace(/\s+\S*$/,'')+'…';
}

/* Distratores curriculares, não frases caricatas:
   dois conceitos próximos + dois equívocos plausíveis sobre os próprios conceitos.
   Não mudar IDs, ordem das provas ou posição correta calculada pelo modelo. */
const CLOSE_TOPICS={
 tcc:[
 ['Esquema Inicial','Necessidades emocionais','Defectividade','Abandono','Resignação','Modos esquemáticos','Reparentalização','Confrontação'],
 ['Flexibilidade psicológica','Desfusão','Aceitação e evitação','Valores e ação','ACT','Hexaflex','Self como contexto','RFT'],
 ['DBT','MBCT','CFT','FAP','Psicoterapia Baseada','Prática Baseada']
 ],
 familia:[
 ['Violência intrafamiliar','Abuso sexual','Atendimento familiar em clínica','Assistência social'],
 ['Luto','Mitos','Ritos','transgeracionalidade'],
 ['Dependência química','Atendimento familiar hospitalar','Atendimento familiar escolar','Atendimento familiar em clínica']
 ],
 meta:[
 ['Primeira tópica','Segunda tópica','Id e princípio','Ego e princípio','Superego','Três senhores','Ideal do ego'],
 ['Complexo de Édipo','Triangulação','Castração','Narcisismo'],
 ['Pulsão','Fonte, pressão','Dualismos','Mecanismos de defesa']
 ],
 grupos:[
 ['Psicodrama','Moreno','Aquecimento','Compartilhamento','papéis e espontaneidade'],
 ['Carl Rogers','Rogers','Empatia','congruência','consideração positiva','facilitação','conflitos e confiança'],
 ['Escritores da Liberdade','preconceito e pertencimento','vínculos e escuta']
 ],
 social:[
 ['Psicologia Sócio-Histórica','Psicologia da Libertação','Desideologização','Fatalismo','Democracia'],
 ['Epistemicídio','genocídios/epistemicídios','Racismo e sexismo epistêmicos'],
 ['Gênero','Feminismos','Interseccionalidade','Categorias de relação','migração'],
 ['Infância','Políticas públicas de infância'],
 ['Tecnologias da informação','Viés de confirmação','Identidade social','Polarização','Bolha','Câmara de eco','algorítmica','consenso','Publicidade','feeds']
 ],
 avaliacao:[
 ['Entrevista de devolução','Linguagem e comunicação','Sigilo','Ética na avaliação'],
 ['contexto organizacional','hospitalar','forense','pessoas trans'],
 ['Resolução CFP','Laudo','parecer','Bateria','instrumentos']
 ]
};
function similarTopics(subject,topics,a){
 const groups=CLOSE_TOPICS[subject]||[],title=String(a.title||'').toLocaleLowerCase('pt-BR');
 const index=topics.indexOf(a);
 const group=groups.find(gr=>gr.some(part=>title.includes(part.toLocaleLowerCase('pt-BR'))))||[];
 const tokens=x=>new Set(String(x||'').toLocaleLowerCase('pt-BR').split(/[^\p{L}\p{N}]+/u)
   .filter(w=>w.length>3&&!/^(sobre|como|para|uma|entre|pelos|essa|contexto|psicologia|psicológica|abordagem|atendimento|estudo)$/.test(w)));
 const base=tokens(a.title+' '+a.definition),groupTitles=group.map(x=>x.toLocaleLowerCase('pt-BR'));
 return topics.filter(x=>x!==a).map((t,i)=>{
  const otherTitle=String(t.title||'').toLocaleLowerCase('pt-BR'),words=tokens(t.title+' '+t.definition);
  let overlap=0;for(const w of words)if(base.has(w))overlap++;
  const close=groupTitles.some(part=>otherTitle.includes(part));
  const span=Math.abs(topics.indexOf(t)-index);
  return {topic:t,score:(close?60:0)+Math.min(18,overlap*4)+7/(1+span)};
 }).sort((x,y)=>y.score-x.score||topics.indexOf(x.topic)-topics.indexOf(y.topic))
  .map(x=>x.topic);
}
function questionChoice(subject,topics,model,slot,a,qid){
 const near=similarTopics(subject,topics,a),b=near[0]||a,c=near[1]||near[0]||a;
 const option=(topic,valid,misconception=false)=>({
  text:topic.title+' — '+compact(misconception?invalid(topic):definition(topic),225)+'.',
  correct:valid,
  why:valid?'A situação corresponde à formulação central de '+a.title+'. '+definition(a)+'.':
   misconception?'A frase confunde aspectos do conceito '+topic.title+'. '+definition(topic)+'.':
    'O conceito '+topic.title+' é próximo e pode participar da análise, mas não é o processo mais diretamente descrito. '+definition(a)+'.'
 });
 const opts=[
   option(a,true),
   option(a,false,true),
   option(b,false),
   option(c,false),
   option(b,false,true)
 ];
 // Se houver tópicos insuficientes, impedir alternativas duplicadas.
 const seen=new Set();for(let i=0;i<opts.length;i++){
  if(seen.has(opts[i].text)){
   const other=near.find(t=>!seen.has(t.title+' — '+compact(definition(t),225)+'.'));
   if(other)opts[i]=option(other,false);
  }
  seen.add(opts[i].text);
 }
 const correctPosition=(model*3+slot*2)%opts.length;
 opts.splice(correctPosition,0,opts.shift());
 const command=[
 'Qual formulação teórica interpreta de modo mais preciso o mecanismo central descrito?',
 'Que interpretação diferencia o processo central de outros conceitos relacionados?',
 'Qual leitura está mais fundamentada pela situação e pela definição estudada?',
 'Qual alternativa articula adequadamente a hipótese conceitual e seu mecanismo?'
 ][slot%4];
 return {type:'choice',id:qid,concept:a.title,prompt:'Leia o caso:\n'+context(a)+'\n\n'+command,
  options:opts,answer:correctPosition,source:'Questão autoral baseada nos materiais da disciplina.'};
}

const COMBOS_3=[
 [0,1,2],[0,1,3],[0,1,4],[0,2,3],[0,2,4],
 [0,3,4],[1,2,3],[1,2,4],[1,3,4],[2,3,4]
];
function questionCombo(topics,model,slot,a,b,c,qid){
 const itemPool=[
  {text:compact(definition(a),245)+'.',truth:true,why:definition(a)+'.'},
  {text:compact(invalid(a),245)+'.',truth:false,why:definition(a)+'.'},
  {text:compact(definition(b),245)+'.',truth:true,why:definition(b)+'.'},
  {text:compact(invalid(c),245)+'.',truth:false,why:definition(c)+'.'},
  {text:compact(definition(c),245)+'.',truth:true,why:definition(c)+'.'}
 ];
 // Alternar a ordem nao muda a proporcao 3 verdadeiras/2 falsas.
 const rotation=(model+slot*2)%5;
 const assertions=itemPool.map((_,j)=>itemPool[(j+rotation)%5]).map((x,j)=>({...x,l:LETTERS[j]}));
 const correctIdx=assertions.map((x,j)=>x.truth?j:-1).filter(j=>j>=0);
 const correctKey=correctIdx.join(',');
 const otherSets=COMBOS_3.filter(set=>set.join(',')!==correctKey)
   .sort((x,y)=>Math.abs(x[0]-correctIdx[0])-Math.abs(y[0]-correctIdx[0]));
 const chosen=otherSets.slice((slot+model)%4,(slot+model)%4+4);
 while(chosen.length<4)chosen.push(otherSets[chosen.length]);
 const pos=(model*2+slot)%5;
 const sets=chosen.slice();sets.splice(pos,0,correctIdx);
 const summary=['Analise as cinco afirmações e assinale a alternativa que contém apenas as corretas.',
  'Considere as afirmações a seguir e identifique a combinação correta.',
  'Julgue as proposições e assinale somente o conjunto das verdadeiras.'][slot%3];
 return {type:'combo',id:qid,concept:a.title,
   prompt:'Situação de referência: '+context(a)+'\n\n'+summary,
   assertions,options:sets.map(set=>'Apenas '+set.map(j=>LETTERS[j]).join(', ')+'.'),
   answer:pos,correct:correctIdx.map(j=>LETTERS[j]),answerSets:sets.map(set=>set.map(j=>LETTERS[j])),
   source:'Questão autoral no formato de assertivas combinadas.'};
}
function questionTF(model,slot,a,qid){
 const truth=(model+slot)%2===0;
 return {type:'tf',id:qid,concept:a.title,
  prompt:'Considere a seguinte situação: '+context(a)+'\n\nJulgue a afirmação:\n'+(truth?definition(a):invalid(a))+'.',
  answer:truth,explanation:(truth?'Verdadeiro. ':'Falso. ')+definition(a)+'.',
  source:'Questão autoral baseada nos materiais da disciplina.'};
}
function questionEssay(topics,model,idx,a,b,qid){
 const task=idx===0
 ?'Explique o conceito central, aplique-o ao caso e diferencie-o de um segundo conceito pertinente. Fundamente a análise sem deduzir um diagnóstico a partir de um exemplo isolado.'
 :'Analise a situação relacionando teoria, contexto e possibilidades de atuação. Discuta um limite da interpretação e justifique sua conclusão com elementos do caso.';
 return {type:'essay',id:qid,concept:a.title,
  prompt:'Estudo de caso:\n'+context(a)+'\n\n'+task+'\n\nNa resposta, relacione '+a.title+' e '+b.title+'.',
  criteria:['Definir '+a.title+' com precisão conceitual.','Diferenciar e relacionar '+b.title+'.',
   'Utilizar os elementos efetivamente descritos no caso.','Apresentar justificativa e reconhecer limites ou cuidados éticos.'],
  model:'A situação pode ser discutida com base em '+a.title+': '+definition(a)+'. O relato descreve: '+context(a)+
  ' É importante diferenciá-lo de '+b.title+': '+definition(b)+
  '. Uma resposta bem fundamentada articula esses conceitos à situação, considera suas condições específicas e evita generalizações ou conclusões não autorizadas pelo caso.',
  source:'Resposta orientativa autoral; consulte os materiais da disciplina.'};
}

/* Metapsicologia P2: somente as 28 questões sobre segunda tópica, Édipo e pulsão.
   As alternativas são afirmações completas, retiradas de conceitos relacionados do próprio roteiro.
   Nenhuma alternativa é uma recomendação vaga do tipo "priorizar outro conceito". */
function metaSectionPeers(topics,topic){
 const peers=topics.filter(t=>t!==topic&&t.section===topic.section);
 const ranked=similarTopics('meta',peers.concat([topic]),topic).filter(t=>t.section===topic.section&&t!==topic);
 return ranked.length?ranked:peers;
}
function metaChoice(topics,model,slot,topic,id){
 const peers=metaSectionPeers(topics,topic);
 const options=[
  {text:topic.definition,correct:true,why:'Correto. '+topic.explanation},
  {text:topic.myth,correct:false,why:'Esta interpretação não corresponde ao conceito. '+topic.explanation},
  ...peers.slice(0,3).map(other=>({
   text:other.myth,correct:false,
   why:'A afirmação apresenta uma confusão sobre '+other.title+'. '+other.explanation
  }))
 ];
 const distinct=new Set(options.map(o=>o.text));
 if(distinct.size!==5)throw Error('Alternativas repetidas em '+topic.id);
 const correctPosition=(model*3+slot*2)%5;
 const correct=options.shift();
 options.splice(correctPosition,0,correct);
 return {type:'choice',id,concept:topic.title,
  prompt:'Questão do estudo dirigido:\n'+topic.question+'\n\nQual alternativa apresenta a resposta teoricamente adequada?',
  options,answer:correctPosition,source:'Questão autoral baseada no estudo dirigido P2 do professor Jefferson Krug.'};
}
function metaCombo(topics,model,slot,topic,id){
 const peers=metaSectionPeers(topics,topic),b=peers[0],c=peers[1];
 const statements=[
  {text:topic.definition,truth:true,why:topic.explanation},
  {text:b.myth,truth:false,why:b.explanation},
  {text:b.definition,truth:true,why:b.explanation},
  {text:c.myth,truth:false,why:c.explanation},
  {text:c.definition,truth:true,why:c.explanation}
 ];
 const rotation=(model+slot*2)%5;
 const assertions=statements.map((_,i)=>statements[(i+rotation)%5]).map((x,i)=>({...x,l:LETTERS[i]}));
 const indexes=assertions.map((x,i)=>x.truth?i:-1).filter(i=>i>=0);
 const chosen=COMBOS_3.filter(set=>set.join(',')!==indexes.join(',')).slice((slot+model)%4,(slot+model)%4+4);
 const answer=(model*2+slot)%5,sets=chosen.slice();
 sets.splice(answer,0,indexes);
 return {type:'combo',id,concept:topic.title,
  prompt:'Sobre '+(topic.section==='Segunda tópica'?'a segunda tópica':topic.section==='Édipo'?'o complexo de Édipo':'a teoria das pulsões')+', analise as cinco afirmações e assinale a combinação que contém somente as corretas.',
  assertions,options:sets.map(set=>'Apenas '+set.map(i=>LETTERS[i]).join(', ')+'.'),
  answer,correct:indexes.map(i=>LETTERS[i]),
  answerSets:sets.map(set=>set.map(i=>LETTERS[i])),
  source:'Assertivas autorais baseadas nas questões do estudo dirigido P2.'};
}
function metaTF(model,slot,topic,id){
 const correct=(model+slot)%2===0;
 return {type:'tf',id,concept:topic.title,
  prompt:'Considere o conteúdo do estudo dirigido sobre '+topic.title.toLowerCase()+':\n'+
   (correct?topic.definition:topic.myth)+'\n\nA afirmação está correta ou incorreta?',
  answer:correct,explanation:(correct?'Correta. ':'Incorreta. ')+topic.explanation,
  source:'Afirmação autoral baseada no estudo dirigido P2.'};
}
function metaEssay(topics,model,index,topic,id){
 const peer=metaSectionPeers(topics,topic)[0];
 return {type:'essay',id,concept:topic.title,
  prompt:'Questão do estudo dirigido:\n'+topic.question+
   '\n\nNa resposta, apresente o conceito com clareza e explique sua relação ou diferença em comparação com '+peer.title.toLowerCase()+'.',
  criteria:['Responder integralmente ao enunciado do professor.',
   'Utilizar os conceitos de Freud com precisão e linguagem clara.',
   'Relacionar a resposta ao caso sem fazer generalizações indevidas.',
   'Diferenciar os conceitos indicados e justificar a conclusão.'],
  model:topic.explanation+'\n\nRelação com '+peer.title+': '+peer.definition,
  source:'Resposta-modelo didática, não gabarito oficial.'};
}
function generateMeta(model,topics){
 const format=FORMATS.meta,selected=Array.from({length:15},(_,i)=>topics[((model-1)*3+i*9)%topics.length]);
 const questions=selected.map((topic,i)=>{
  const id='meta-'+META_VERSION+'-'+model+'-'+(i+1);
  if(i>=13)return metaEssay(topics,model,i-13,topic,id);
  if(format[i]==='combo')return metaCombo(topics,model,i,topic,id);
  if(format[i]==='tf')return metaTF(model,i,topic,id);
  return metaChoice(topics,model,i,topic,id);
 });
 return {id:'meta-'+META_VERSION+'-'+model,subject:'meta',model,title:'Simulado '+model,
  final2026:true,revision:META_VERSION,difficulty:'Padrão da prova',
  difficultyLevel:'equivalente',sameDifficulty:true,questions};
}

/* Provas futuras: predominância de teoria, comparações e assertivas.
   Uma aplicação breve por simulado em TCC, Psicologia Social e Avaliação;
   Metapsicologia segue o roteiro teórico. O gerador anterior de Família não muda. */
function variedChoice(subject,topics,model,slot,a,qid){
 const peers=similarTopics(subject,topics,a),b=peers[0]||a,c=peers[1]||b,d=peers[2]||c;
 const options=[
  {text:definition(a).replace(/[.!?]+$/,'')+'.',correct:true,
   why:'Esta é a definição compatível com '+a.title+'. '+definition(a)},
  {text:invalid(a).replace(/[.!?]+$/,'')+'.',correct:false,
   why:'Essa afirmação confunde um aspecto do conceito. '+definition(a)},
  ...[b,c,d].map(t=>({
   text:definition(t).replace(/[.!?]+$/,'')+'.',correct:false,
   why:'Esta definição corresponde a '+t.title+', e não ao conceito solicitado. '+definition(a)
  }))
 ];
 const used=new Set();
 for(let i=0;i<options.length;i++){
  if(used.has(options[i].text))options[i].text='A afirmação corresponde especificamente a '+[b,c,d][Math.max(0,i-2)].title.toLowerCase()+': '+options[i].text;
  used.add(options[i].text);
 }
 const correctIndex=(model*3+slot*2)%5,correct=options.shift();options.splice(correctIndex,0,correct);
 const questions=[
  'Assinale a alternativa que define corretamente '+a.title+'.',
  'Sobre '+a.title+', qual afirmação está de acordo com a teoria estudada?',
  'Qual formulação conceitual é mais precisa para explicar '+a.title+'?',
  'Em relação a '+a.title+', identifique a alternativa teoricamente adequada.'
 ];
 return {type:'choice',id:qid,concept:a.title,prompt:questions[(model+slot)%questions.length],
  options,answer:correctIndex,source:'Questão teórica de revisão baseada nos materiais da disciplina.'};
}
function variedEssay(topics,model,index,a,b,qid){
 const compare=index===0?
 'Diferencie esse assunto de '+b.title.toLowerCase()+' e indique duas consequências relevantes dessa distinção.':
 'Explique a relação entre '+a.title.toLowerCase()+' e '+b.title.toLowerCase()+', apontando uma aproximação e uma diferença.';
 return {type:'essay',id:qid,concept:a.title,
  prompt:'Responda de forma objetiva e fundamentada: o que caracteriza '+a.title+'?\n\n'+compare,
  criteria:['Definir '+a.title+' corretamente.','Explicar '+b.title+' sem confundir os conceitos.',
   'Apresentar uma comparação coerente e bem justificada.','Usar terminologia adequada e redação clara.'],
  model:'O tema '+a.title+' é compreendido da seguinte forma: '+definition(a)+
   '\n\nEm comparação, '+b.title+': '+definition(b)+
   '\n\nA resposta deve estabelecer a distinção entre os conceitos sem atribuir ao primeiro as características exclusivas do segundo.',
  source:'Resposta orientativa baseada nos textos e tópicos da disciplina.'};
}
function generateVaried(id,model,topics){
 const format=FORMATS[id]||FORMATS.tcc,questions=[];
 const version=id==='social'?SOCIAL_VERSION:UPCOMING_VERSION;
 const choiceSlots=format.map((t,i)=>t==='choice'?i:-1).filter(i=>i>=0);
 const caseSlot=choiceSlots[(model-1)%choiceSlots.length];
 for(let i=0;i<13;i++){
  const a=pickPool(topics,model,i),b=pickPool(topics,model,i,1),c=pickPool(topics,model,i,2);
  const qid=id+'-'+version+'-'+model+'-'+(i+1);
  if(format[i]==='combo'){
   const q=questionCombo(topics,model,i,a,b,c,qid);
   const comboPrompts=[
    'Analise as cinco afirmações e identifique a alternativa que reúne apenas as corretas.',
    'Considere as proposições I a V sobre os conceitos estudados. Qual combinação é verdadeira?',
    'Sobre os conteúdos da disciplina, assinale a alternativa que apresenta somente afirmações corretas.',
    'Entre as proposições a seguir, quais estão de acordo com as definições e distinções teóricas estudadas?'
   ];
   q.prompt=comboPrompts[(model+i)%comboPrompts.length];
   questions.push(q);
  }else if(format[i]==='tf'){
   const q=questionTF(model,i,a,qid);
   const truth=q.answer===true;
   q.prompt='Julgue a afirmação sobre '+a.title.toLowerCase()+':\n'+(truth?definition(a):invalid(a)).replace(/[.!?]+$/,'')+'.';
   questions.push(q);
  }else if(i===caseSlot){
   const q=questionChoice(id,topics,model,i,a,qid);
   q.prompt=q.prompt.replace(/^Leia o caso:\n/,'Situação breve:\n');
   questions.push(q);
  }else questions.push(variedChoice(id,topics,model,i,a,qid));
 }
 if(id==='social'){
  // Modelo inspirado nas referências anteriores: 14 itens objetivos, 1 dissertativo.
  // A primeira prova original completa não foi reproduzida nem atribuída ao professor.
  const a=pickPool(topics,model,13),b=pickPool(topics,model,14);
  const tf=questionTF(model,13,a,id+'-'+version+'-'+model+'-14');
  tf.prompt='Julgue a afirmação sobre '+a.title.toLowerCase()+':\n'+
   (tf.answer?definition(a):invalid(a)).replace(/[.!?]+$/,'')+'.';
  questions.push(tf);
  questions.push(variedEssay(topics,model,0,a,b,id+'-'+version+'-'+model+'-15'));
 }else{
  for(let i=0;i<2;i++){
   const a=pickPool(topics,model,13+i*2),b=pickPool(topics,model,14+i*2);
   questions.push(variedEssay(topics,model,i,a,b,id+'-'+version+'-'+model+'-'+(14+i)));
  }
 }
 return {id:id+'-'+version+'-'+model,subject:id,model,
  title:'Simulado '+model,final2026:true,revision:version,
  difficulty:'Padrão da prova',difficultyLevel:'equivalente',sameDifficulty:true,questions};
}
/* Avaliação P3: questões específicas do roteiro docente.
   Em vez de distratores de outros assuntos, as cinco opções tratam do mesmo tema.
   Uma situação breve por prova; demais itens teóricos, combinados ou dissertativos. */
function evalChoice(topic,model,slot,id,withCase=false){
 const texts=[topic.definition,...topic.distractors];
 const choices=texts.map((text,i)=>({
  text:String(text).replace(/[.!?]+$/,'')+'.',
  correct:i===0,
  why:i===0?'Correto. '+topic.definition:
   'Esta interpretação altera uma condição relevante do assunto. '+topic.whyWrong
 }));
 if(new Set(choices.map(x=>x.text)).size!==5)throw Error('Alternativas repetidas: '+topic.title);
 const index=(model*3+slot*2)%5,correct=choices.shift();choices.splice(index,0,correct);
 const prompts=[
  'Sobre '+topic.title.toLowerCase()+', qual alternativa apresenta a interpretação mais adequada?',
  'Considerando os fundamentos de '+topic.title.toLowerCase()+', assinale a afirmação correta.',
  'Qual das alternativas descreve corretamente '+topic.title.toLowerCase()+'?',
  'Na avaliação psicológica, qual afirmação sobre '+topic.title.toLowerCase()+' está de acordo com o roteiro de estudos?'
 ];
 return {type:'choice',id,concept:topic.title,answer:index,options:choices,
  prompt:withCase?
   'Situação breve: '+topic.scenario+'\n\nConsiderando os procedimentos de avaliação psicológica, qual alternativa é a mais adequada?':
   prompts[(model+slot)%prompts.length],
  source:'Questão autoral fundamentada no estudo dirigido da P3.'};
}
function evalCombo(topics,topic,model,slot,id){
 const peers=topics.filter(x=>x.section===topic.section&&x!==topic);
 if(peers.length<2)throw Error('P3 sem tópicos suficientes em '+topic.section);
 const a=peers[(model+slot)%peers.length],b=peers[(model+slot+1)%peers.length];
 const items=[
  {text:topic.definition,truth:true,why:topic.definition},
  {text:a.myth,truth:false,why:a.whyWrong},
  {text:a.definition,truth:true,why:a.definition},
  {text:b.myth,truth:false,why:b.whyWrong},
  {text:b.definition,truth:true,why:b.definition}
 ];
 const rotation=(model+slot*2)%5;
 const assertions=items.map((_,i)=>items[(i+rotation)%5]).map((x,i)=>({...x,l:LETTERS[i]}));
 const correct=assertions.map((a,i)=>a.truth?i:-1).filter(i=>i>=0);
 const decoys=COMBOS_3.filter(x=>x.join(',')!==correct.join(',')).slice((slot+model)%4,(slot+model)%4+4);
 const answer=(model*2+slot)%5,sets=decoys.slice();sets.splice(answer,0,correct);
 const prompts=[
  'Analise as cinco proposições a seguir sobre conteúdos relacionados da avaliação psicológica e assinale a combinação correta.',
  'Considere as afirmações I a V. Qual alternativa reúne apenas as proposições teoricamente adequadas?',
  'Quais proposições sobre os procedimentos e conceitos estudados estão corretas?'
 ];
 return {type:'combo',id,concept:topic.title,prompt:prompts[(model+slot)%3],
  assertions,options:sets.map(z=>'Apenas '+z.map(i=>LETTERS[i]).join(', ')+'.'),
  answer,correct:correct.map(i=>LETTERS[i]),answerSets:sets.map(z=>z.map(i=>LETTERS[i])),
  source:'Assertivas autorais sobre conceitos da mesma área do roteiro P3.'};
}
function evalTF(topic,model,slot,id){
 const truth=(model+slot)%2===0;
 return {type:'tf',id,concept:topic.title,
  prompt:'Julgue a afirmação sobre '+topic.title.toLowerCase()+':\n'+(truth?topic.definition:topic.myth),
  answer:truth,
  explanation:(truth?'Verdadeiro. '+topic.definition:'Falso. '+topic.whyWrong),
  source:'Afirmação elaborada para revisão da P3.'};
}
function evalEssay(topic,model,slot,id){
 const criteria=[
  'Responder ao enunciado da questão do roteiro docente.',
  'Definir o conceito e explicar suas implicações de modo correto.',
  'Distinguir condições, cuidados e limites envolvidos no procedimento.',
  'Usar redação clara, objetiva e tecnicamente fundamentada.'
 ];
 return {type:'essay',id,concept:topic.title,
  prompt:'Questão dissertativa do estudo dirigido da P3:\n'+topic.question,
  criteria,model:topic.explanation,
  source:'Enunciado do professor; resposta-modelo comentada, não gabarito oficial.'};
}
function generateEvaluation(model,topics){
 if(topics.length!==21)throw Error('O roteiro de Avaliação P3 deve ter 21 temas');
 const format=FORMATS.avaliacao;
 const choiceSlots=format.map((x,i)=>x==='choice'?i:-1).filter(i=>i>=0);
 const caseSlot=choiceSlots[(model-1)%choiceSlots.length];
 const qs=[];
 for(let i=0;i<13;i++){
  const q=pickPool(topics,model,i);
  const id='avaliacao-'+EVAL_VERSION+'-'+model+'-'+(i+1);
  if(format[i]==='combo')qs.push(evalCombo(topics,q,model,i,id));
  else if(format[i]==='tf')qs.push(evalTF(q,model,i,id));
  else qs.push(evalChoice(q,model,i,id,i===caseSlot));
 }
 for(let i=0;i<2;i++){
  const q=pickPool(topics,model,13+i*2);
  qs.push(evalEssay(q,model,i,'avaliacao-'+EVAL_VERSION+'-'+model+'-'+(14+i)));
 }
 return {id:'avaliacao-'+EVAL_VERSION+'-'+model,subject:'avaliacao',model,
  title:'Simulado '+model,final2026:true,revision:EVAL_VERSION,
  difficulty:'P3 — roteiro docente',difficultyLevel:'equivalente',sameDifficulty:true,questions:qs};
}
function generateEqual(id,model,topics){
 if(id==='meta'&&Array.isArray(window.PSICO_META_P2_PRACTICE?.topics)&&topics.length===28)
  return generateMeta(model,topics);
 if(id==='avaliacao'&&Array.isArray(window.PSICO_AVALIACAO_P3_PRACTICE?.topics)&&topics.length===21)
  return generateEvaluation(model,topics);
 if(id!=='familia')return generateVaried(id,model,topics);
 const qs=[],format=FORMATS[id]||FORMATS.familia,version=id==='meta'?META_VERSION:VERSION;
 for(let i=0;i<13;i++){
  const a=pickPool(topics,model,i),b=pickPool(topics,model,i,1),c=pickPool(topics,model,i,2);
  const qid=id+'-'+version+'-'+model+'-'+(i+1);
  qs.push(format[i]==='combo'?questionCombo(topics,model,i,a,b,c,qid):
   format[i]==='tf'?questionTF(model,i,a,qid):questionChoice(id,topics,model,i,a,qid));
 }
 for(let i=0;i<2;i++){
  const a=pickPool(topics,model,13+i*2),b=pickPool(topics,model,14+i*2);
  qs.push(questionEssay(topics,model,i,a,b,id+'-'+version+'-'+model+'-'+(14+i)));
 }
 return {id:id+'-'+version+'-'+model,subject:id,model,
   title:'Simulado '+model,final2026:true,revision:VERSION,
   difficulty:'Padrão da prova',difficultyLevel:'equivalente',sameDifficulty:true,
   questions:qs};
}

function apply(db){
 if(!db?.subjects||!db?.topics||!Array.isArray(db.exams))return;
 // Bancos docentes P2 e P3 compartilham os temas da prova com a revisão ativa.
 const p2=window.PSICO_META_P2_PRACTICE?.topics;
 if(Array.isArray(p2)&&p2.length===28)
  db.topics.meta=p2.map(t=>({...t}));
 else if(Array.isArray(db.topics.meta))
  db.topics.meta=db.topics.meta.filter(t=>!/ang[uú]sti/i.test(t.title||''));
 const evaluationP3=window.PSICO_AVALIACAO_P3_PRACTICE?.topics;
 if(Array.isArray(evaluationP3)&&evaluationP3.length===21)
  db.topics.avaliacao=evaluationP3.map(t=>({...t}));
 db.archivedExams=db.archivedExams||[];
 for(const e of db.exams.filter(e=>e?.subject==='meta'))if(!db.archivedExams.some(a=>a.id===e.id))db.archivedExams.push(e);
 db.exams=db.exams.filter(e=>e?.subject!=='meta');
 for(const id of ['tcc','familia','meta','grupos','social','avaliacao']){
  if(!db.subjects[id])continue;
  const oldTopics=curated(db,id);
  const topics=equalTopics(db,id);
  if(id==='familia')for(const x of familyExtra)if(!db.topics.familia.some(t=>t.title===x.title))db.topics.familia.push({...x});
  if(topics.length<3)continue;
  for(let level=1;level<=5;level++){
   // Preservar provas antigas sem alterar questões/gabaritos de tentativas anteriores.
   for(const legacy of (id==='meta'?[]:[PREVIOUS_VERSION,LEGACY_CURRENT])){
     const oldExam=generate(id,level,oldTopics,legacy);
     if(!db.exams.some(e=>e.id===oldExam.id))db.exams.push(oldExam);
   }
   const exam=generateEqual(id,level,topics);
   if(!db.exams.some(e=>e.id===exam.id))db.exams.push(exam);
  }
 }
}
window.PSICO_FINAL_EXAMS={apply,curated,familyExtra,version:UPCOMING_VERSION,familyVersion:VERSION,metaVersion:META_VERSION,socialVersion:SOCIAL_VERSION,evaluationVersion:EVAL_VERSION,generateEqual,formats:FORMATS};
})();
