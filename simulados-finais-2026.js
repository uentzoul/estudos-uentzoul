/* Revisão de lançamento — simulados finais de Psicologia PUCRS 2026/2.
   Novos IDs preservam tentativas, correções e questões de edições anteriores. */
(()=>{
'use strict';
const VERSION='rev-final-20261113-r2';
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
function choices(all,t,level,slot,id,version=VERSION){
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
 const right={text:t.title+': '+definition(t)+'.',correct:true,why:(version===VERSION?'A situação exemplifica '+t.title+'. '+definition(t)+'. Interprete os elementos do caso considerando o contexto e os limites dos dados apresentados.':definition(t)+'. Na situação: '+context(t))};
 const answer=(level*2+slot)%5,options=wrongs.slice(0,4);options.splice(answer,0,right);
 const commands=version===VERSION?['Qual interpretação é mais coerente com o material da disciplina?','Que conceito ajuda a compreender melhor o caso apresentado?','Qual alternativa relaciona corretamente teoria, situação e contexto?','Qual alternativa define o conceito mais compatível com a situação?','Qual formulação conceitual é mais consistente com os elementos apresentados?']:['Qual interpretação é mais coerente com o material da disciplina?','Que conceito ajuda a compreender melhor o caso apresentado?','Qual alternativa relaciona corretamente teoria, situação e contexto?','Qual análise profissional evita inferências indevidas nesse caso?','Qual formulação integra melhor conceito, aplicação e limites da conclusão?'];
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
function generate(id,level,topics,version=VERSION){
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
function apply(db){
 if(!db?.subjects||!db?.topics||!Array.isArray(db.exams))return;
 for(const id of ['tcc','familia','meta','grupos','social','avaliacao']){
  if(!db.subjects[id])continue;
  const topics=curated(db,id);
  if(id==='familia')for(const x of familyExtra)if(!db.topics.familia.some(t=>t.title===x.title))db.topics.familia.push({...x});
  if(topics.length<3)continue;
  for(let level=1;level<=5;level++){
   // Mantenha os simulados da revisão anterior acessíveis para consultar
   // tentativas concluídas, sem alterar seus enunciados ou gabaritos.
   const archived=generate(id,level,topics,PREVIOUS_VERSION);
   if(!db.exams.some(e=>e.id===archived.id))db.exams.push(archived);
   const exam=generate(id,level,topics,VERSION);
   if(!db.exams.some(e=>e.id===exam.id))db.exams.push(exam);
  }
 }
}
window.PSICO_FINAL_EXAMS={apply,curated,familyExtra,version:VERSION};
})();
