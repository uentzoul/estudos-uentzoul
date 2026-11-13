/* PsicoMoodle — estudos dirigidos da revisão final de 2026/2.
   Questões didáticas autorais fundamentadas nos tópicos de estudo já cadastrados.
   Roteiros originais dos professores são preservados separadamente. */
(()=>{
'use strict';
const TARGETS=['tcc','familia','meta','grupos','avaliacao'];
function makeQuestion(topic,i){
 const scenario=String(topic.scenario||'Analise como o conceito se aplica a uma situação real, respeitando o contexto.').trim();
 const idea=String(topic.definition||'').trim();
 const myth=String(topic.myth||'').trim();
 return {n:i+1,topic:topic.title,section:'Revisão final por conceito',
 question:'Explique '+topic.title+'.\n\nConsidere a situação: '+scenario+'\n\nQuais elementos dessa situação devem ser considerados ao aplicar o conceito e que limites precisam ser respeitados na interpretação?',
 options:[],answer:null,
 explanation:'Definição: '+idea+'\n\nSituação para análise: '+scenario+'\n\nPara relacionar o caso ao conceito, identifique os acontecimentos relevantes, considere o contexto e examine outras explicações plausíveis. O exemplo, isoladamente, não autoriza uma conclusão diagnóstica ou causal.',
 contrast:(myth?'Evite a interpretação simplista: '+myth+'\n\n':'')+'Uma resposta completa diferencia descrição, explicação e possível intervenção, com cautela ética.',
 points:[
 {title:'Definição do conceito',explanation:idea,example:''},
 {title:'Aplicação ao cenário',explanation:'Identifique fatos relevantes da situação e relacione-os ao conceito sem ignorar outras explicações plausíveis.',example:scenario},
 {title:'Limites e conclusão',explanation:'Considere aspectos éticos, sociais e contextuais; não conclua diagnóstico ou causalidade a partir de um exemplo isolado.',example:''}
 ]};
}
function apply(db){
 const curated=window.PSICO_FINAL_EXAMS?.curated;
 if(typeof curated!=='function'||!db?.topics)return;
 const guides=window.PSICO_GUIDES||(window.PSICO_GUIDES={});
 for(const subject of TARGETS){
  const id='final-2026-2-'+subject;
  const topics=curated(db,subject);
  if(!topics?.length)continue;
  guides[subject]=guides[subject]||[];
  if(guides[subject].some(x=>x.id===id))continue;
  guides[subject].unshift({id,title:'Estudo dirigido — revisão final de 2026/2',
   subtitle:topics.length+' conceitos comentados com exemplos e limites de interpretação',
   source:'Roteiro didático autoral organizado com base nos tópicos dos materiais cadastrados na disciplina. Não reproduz literalmente um estudo dirigido do professor nem substitui a leitura dos arquivos.',
   status:'adaptado',questions:topics.map(makeQuestion)});
 }
}
window.PSICO_FINAL_GUIDES={apply,makeQuestion};
})();