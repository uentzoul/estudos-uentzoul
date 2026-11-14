/* Revisão de lançamento — simulados finais de Psicologia PUCRS 2026/2.
   Novos IDs preservam tentativas, correções e questões de edições anteriores. */
(()=>{
'use strict';
const VERSION='rev-provas-equivalentes-20261113';
const LEGACY_CURRENT='rev-final-20261113-r2';
const PREVIOUS_VERSION='rev-final-20261113';
const LETTERS=['I','II','III','IV','V'];
const familyExtra=[
{title:'Mitos, rituais e lealdades familiares',definition:'Mitos familiares são narrativas e expectativas compartilhadas que participam da organização das relações; os rituais podem expressar pertencimento, valores e regras, com sentidos diferentes entre os integrantes.',scenario:'Uma família debate se deve manter uma celebração tradicional: algumas pessoas a vivenciam como apoio, outras como obrigação.',myth:'Um ritual familiar sempre possui o mesmo significado para todos e não pode mudar.'},
{title:'Ritos de passagem e transgeracionalidade',definition:'Ritos de passagem marcam transições do ciclo vital; a perspectiva transgeracional investiga transmissão e transformação de valores, papéis e padrões entre gerações, sem supor determinismo.',scenario:'Quando a filha sai de casa, familiares percebem expectativas sobre autonomia herdadas de outras gerações e começam a negociá-las.',myth:'Transgeracionalidade significa repetir inevitavelmente todas as escolhas das gerações anteriores.'}
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
 if(id==='avaliacao')items=items.filter(x=>evalScope.has(x.title));
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
 const commands=version===LEGACY_CURRENT?['Qual interpretação é mais coerente com o material da disciplina?','Que conceito ajuda a compreender melhor o caso apresentado?','Qual alternativa relaciona corretamente teoria, situação e contexto?','Qual alternativa define o conceito mais compatível com a situação?','Qual formulação conceitual é mais consistente com os elementos apresentados?']:['Qual interpretação é mais coerente com o material da disciplina?','Que conceito ajuda a compreender melhor o caso apresentado?','Qual alternativa relaciona corretamente teoria, situação e contexto?','Qual análise profissional evita inferências indevidas nesse caso?','Qual formulação integra melhor conceito, aplicação e limites da conclusão?'];
 return {type:'choice',id,concept:t.title,prompt:'Situação: '+context(t)+'\n\n'+commands[level-1],options,answer,source:'Material de revisão da disciplina'};
}
function trueFalse(t,level,slot,id){
 const truth=(level+slot)%2===0;
 return {type:'tf',id,concept:t.title,prompt:'Julgue a seguinte afirmação sobre '+t.title+':\n\n'+(truth?definition(t):invalid(t))+'.',
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
 return {type:'combo',id,concept:a.title,prompt:'Analise as afirmações abaixo sobre '+a.title+', '+b.title+' e '+c.title+'.\n\nAssinale a alternativa que contém somente as afirmações corretas.',
 assertions:shifted,options:options.map(x=>'Apenas '+x.join(', ')+'.'),answer,correct,answerSets:options};
}
function discursive(a,b,level,id){
 const tasks=['Defina os conceitos e apresente um exemplo aplicado.','Compare os conceitos e identifique diferenças e aproximações.','Relacione os conceitos à situação, justificando sua interpretação.','Analise criticamente o caso e indique limites da intervenção.','Desenvolva uma argumentação fundamentada, considerando contexto, teoria e implicações éticas.'];
 return {type:'essay',id,concept:a.title,
 prompt:'Considere a situação: '+context(a)+'\n\n'+tasks[level-1]+'\n\nArticule '+a.title+' com '+b.title+' e justifique as conclusões sem ultrapassar os dados apresentados.',
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
 {title:'Psicodrama: aquecimento e dramatização',definition:'O aquecimento prepara a participação e a dramatização permite explorar situações por meio da ação, sem impor exposição forçada.',scenario:'Durante uma atividade, a coordenação prepara a turma antes de convidar participantes a representar uma situação.',myth:'Na dramatização, toda pessoa deve ser obrigada a revelar experiências íntimas.'},
 {title:'Psicodrama: compartilhamento',definition:'O compartilhamento acolhe percepções suscitadas pela dramatização, sem reduzir a experiência a julgamento dos participantes.',scenario:'Depois da cena, os participantes falam sobre o que sentiram e identificaram em si.',myth:'O compartilhamento tem como finalidade decidir quem representou corretamente seu papel.'},
 {title:'Psicodrama: papéis e espontaneidade',definition:'Os papéis são explorados na ação dramática, e a espontaneidade envolve respostas criativas e adequadas a situações presentes.',scenario:'Uma pessoa experimenta uma resposta diferente ao representar um conflito interpessoal.',myth:'Espontaneidade significa agir sem qualquer consideração pelas pessoas ou pelo contexto.'},
 {title:'Rogers: empatia no grupo',definition:'A compreensão empática busca aproximar-se do referencial vivido de outra pessoa, sem substituir sua experiência pela interpretação de quem escuta.',scenario:'Uma participante relata insegurança e o grupo procura compreender seu sentido antes de aconselhar.',myth:'Empatia exige concordar com qualquer conclusão da pessoa que fala.'},
 {title:'Rogers: consideração positiva incondicional',definition:'Considerar alguém positivamente significa reconhecer seu valor sem condicionar o acolhimento à aprovação de cada conduta.',scenario:'Uma integrante admite uma dificuldade sem ser humilhada, enquanto o grupo conversa sobre responsabilidades.',myth:'Aceitação incondicional impede estabelecer limites e conversar sobre comportamentos que prejudicam o grupo.'},
 {title:'Rogers: congruência e autenticidade',definition:'Congruência é coerência e presença genuína na relação, sem exigir a exposição impulsiva de todos os sentimentos.',scenario:'Um facilitador reconhece uma tensão presente sem fingir neutralidade artificial nem atacar participantes.',myth:'Autenticidade é comunicar impulsivamente tudo que se pensa sem considerar consequências.'},
 {title:'Rogers: facilitação e não diretividade',definition:'O facilitador acompanha a experiência do grupo e favorece autonomia, escuta e participação sem determinar previamente as respostas.',scenario:'Numa discussão, a facilitadora estimula diferentes vozes sem decidir por elas o significado da experiência.',myth:'Não diretividade significa abandonar o grupo e deixar de cuidar dos limites necessários.'},
 {title:'Rogers: conflitos e confiança no grupo',definition:'A confiança pode favorecer a expressão e a elaboração de divergências; não implica ausência obrigatória de conflitos.',scenario:'Dois participantes discordam, e o grupo procura compreender os sentimentos sem silenciar a discordância.',myth:'Um grupo acolhedor demonstra sua qualidade pela inexistência permanente de conflitos.'},
 {title:'Escritores da Liberdade: vínculos e escuta',definition:'No filme, práticas educativas de expressão e escuta ajudam estudantes a conhecer experiências distintas e construir vínculos.',scenario:'Estudantes compartilham relatos pessoais e começam a reconhecer experiências que antes desprezavam.',myth:'A atividade pedagógica apresentada equivale formalmente a psicoterapia de grupo.'},
 {title:'Escritores da Liberdade: preconceito e pertencimento',definition:'Conflitos, identidades e preconceitos atravessam relações escolares, que podem ser transformadas por práticas coletivas de reconhecimento.',scenario:'Grupos de estudantes inicialmente hostis encontram pontos de contato ao ouvir histórias uns dos outros.',myth:'A aproximação entre os estudantes apaga automaticamente todos os conflitos históricos e sociais.'}
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
function questionChoice(subject,topics,model,slot,a,qid){
 const others=[],seen=new Set([a.title]);
 for(let k=1;k<topics.length+6&&others.length<4;k++){
   const o=pickPool(topics,model,slot,k);
   if(!o||seen.has(o.title))continue;
   seen.add(o.title);others.push(o);
 }
 const opts=[{text:a.title+' — '+compact(definition(a),230)+'.',correct:true,
   why:'É a interpretação que melhor corresponde ao elemento central da situação. '+definition(a)+'.'}];
 for(const o of others)opts.push({text:o.title+' — '+compact(definition(o),230)+'.',correct:false,
   why:'Esta alternativa descreve '+o.title+', mas a situação foi construída para exemplificar principalmente '+a.title+'.'});
 while(opts.length<5){
   const fallback=opts.length===1?invalid(a):'Uma interpretação baseada apenas em parte dos dados, sem considerar a situação em sua totalidade';
   opts.push({text:fallback+'.',correct:false,why:'A alternativa não contempla adequadamente o contexto. '+definition(a)+'.'});
 }
 const n=opts.length,correctPosition=(model*3+slot*2)%n;
 const right=opts.shift();opts.splice(correctPosition,0,right);
 const command=[
 'Considerando a situação e o conceito que melhor a explica, assinale a alternativa correta.',
 'Qual alternativa estabelece a relação conceitual mais precisa com o caso?',
 'Que conceito permite interpretar o aspecto central da situação sem extrapolar os dados?',
 'Assinale a alternativa que melhor corresponde à situação descrita.'
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
  prompt:'Estudo de caso:\n'+context(a)+'\n\n'+task+'\n\nNa resposta, articule '+a.title+' e '+b.title+'.',
  criteria:['Definir '+a.title+' com precisão conceitual.','Diferenciar e articular '+b.title+'.',
   'Utilizar os elementos efetivamente descritos no caso.','Apresentar justificativa e reconhecer limites ou cuidados éticos.'],
  model:'A situação pode ser discutida com base em '+a.title+': '+definition(a)+'. O relato descreve: '+context(a)+
  ' É importante diferenciá-lo de '+b.title+': '+definition(b)+
  '. Uma resposta bem fundamentada articula esses conceitos à situação, considera suas condições específicas e evita generalizações ou conclusões não autorizadas pelo caso.',
  source:'Resposta orientativa autoral; consulte os materiais da disciplina.'};
}
function generateEqual(id,model,topics){
 const qs=[],format=FORMATS[id]||FORMATS.familia;
 for(let i=0;i<13;i++){
  const a=pickPool(topics,model,i),b=pickPool(topics,model,i,1),c=pickPool(topics,model,i,2);
  const qid=id+'-'+VERSION+'-'+model+'-'+(i+1);
  qs.push(format[i]==='combo'?questionCombo(topics,model,i,a,b,c,qid):
   format[i]==='tf'?questionTF(model,i,a,qid):questionChoice(id,topics,model,i,a,qid));
 }
 for(let i=0;i<2;i++){
  const a=pickPool(topics,model,13+i*2),b=pickPool(topics,model,14+i*2);
  qs.push(questionEssay(topics,model,i,a,b,id+'-'+VERSION+'-'+model+'-'+(14+i)));
 }
 return {id:id+'-'+VERSION+'-'+model,subject:id,model,
   title:'Simulado '+model,final2026:true,revision:VERSION,
   difficulty:'Padrão da prova',difficultyLevel:'equivalente',sameDifficulty:true,
   questions:qs};
}

function apply(db){
 if(!db?.subjects||!db?.topics||!Array.isArray(db.exams))return;
 for(const id of ['tcc','familia','meta','grupos','social','avaliacao']){
  if(!db.subjects[id])continue;
  const topics=equalTopics(db,id);
  if(id==='familia')for(const x of familyExtra)if(!db.topics.familia.some(t=>t.title===x.title))db.topics.familia.push({...x});
  if(topics.length<3)continue;
  for(let level=1;level<=5;level++){
   // Preservar provas antigas sem alterar questões/gabaritos de tentativas anteriores.
   for(const legacy of [PREVIOUS_VERSION,LEGACY_CURRENT]){
     const oldExam=generate(id,level,topics,legacy);
     if(!db.exams.some(e=>e.id===oldExam.id))db.exams.push(oldExam);
   }
   const exam=generateEqual(id,level,topics);
   if(!db.exams.some(e=>e.id===exam.id))db.exams.push(exam);
  }
 }
}
window.PSICO_FINAL_EXAMS={apply,curated,familyExtra,version:VERSION,generateEqual,formats:FORMATS};
})();
