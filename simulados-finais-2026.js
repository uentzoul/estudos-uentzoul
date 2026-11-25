/* Revisão de lançamento — simulados finais de Psicologia PUCRS 2026/2.
   Novos IDs preservam tentativas, correções e questões de edições anteriores. */
(()=>{
'use strict';
const VERSION='rev-provas-equivalentes-20261113';
const META_VERSION='rev-meta-p2-15-objetivas-20261119-v3';
const UPCOMING_VERSION='rev-provas-variadas-20261119-v1';
const SOCIAL_OLD_VERSION='rev-social-primeira-prova-uma-dissertativa-20261119-v2';
const SOCIAL_VERSION='rev-social-fontes-completas-20261125-v1';
const SOCIAL_EXTRA=[{"title":"Subjetividade como processo material","definition":"A subjetividade é movimento de pensamento, emoção e ação, constituído nas relações sociais; não é substância interna ou estática.","scenario":"Uma trabalhadora interpreta uma crítica, sente desvalorização e decide conversar com a equipe.","myth":"A subjetividade é uma entidade interna fixa que permanece independente da história.","source":"Subjetividade como expressão das relações sociais, slides 4–6"},{"title":"Subjetivação e objetivação","definition":"Subjetivação é apropriação e produção de sentidos da realidade; objetivação é a expressão concreta da atividade em falas, relações e produções. São movimentos inseparáveis.","scenario":"Uma estudante ressignifica a experiência de exclusão e organiza uma ação coletiva.","myth":"A subjetivação ocorre exclusivamente no interior do sujeito e a objetivação não altera a realidade social.","source":"Subjetividade como expressão das relações sociais, slide 7"},{"title":"Vivência: singular e social","definition":"A vivência articula condições objetivas com os sentidos, emoções e ações singulares de cada sujeito; não há resposta subjetiva mecanicamente determinada.","scenario":"Duas pessoas expostas à mesma situação de racismo produzem sentidos e respostas diferentes.","myth":"A mesma posição social determina necessariamente vivências idênticas.","source":"Subjetividade como expressão das relações sociais, slides 8–9"},{"title":"Identidade como metamorfose","definition":"Identidade é processo histórico constituído por atividades, relações e projetos; pode transformar-se em novas condições e experiências.","scenario":"Uma pessoa modifica sua relação com o trabalho ao integrar uma organização coletiva.","myth":"A identidade verdadeira é uma essência que se mantém inalterada apesar das relações.","source":"Subjetividade como expressão das relações sociais, slide 10"},{"title":"Dimensão subjetiva da realidade","definition":"A subjetividade também se expressa nas práticas sociais e produções humanas, integrando a própria realidade objetiva que os sujeitos constroem.","scenario":"Uma instituição modifica práticas excludentes após mobilização de estudantes.","myth":"A dimensão subjetiva está exclusivamente no interior das pessoas e não participa da vida coletiva.","source":"Subjetividade como expressão das relações sociais, slide 11"},{"title":"Raça como construção histórica de dominação","definition":"A classificação racial moderna se articula à conquista colonial e à expansão capitalista, convertendo diferenças em hierarquias e distribuição desigual de recursos.","scenario":"Uma hierarquia ocupacional histórica é justificada por supostas diferenças naturais.","myth":"A classificação racial moderna é independente das relações coloniais e da organização do trabalho.","source":"Raça, ideologia e subjetividade, slides 2–3"},{"title":"Hierarquia racial e trabalho","definition":"A divisão racial do trabalho articulou escravidão, servidão e trabalho assalariado; a abolição jurídica não eliminou a desigualdade de recursos e posições.","scenario":"Uma organização apresenta desigualdade persistente no acesso a postos de direção.","myth":"A abolição jurídica eliminou automaticamente a desigualdade material entre grupos raciais.","source":"Raça, ideologia e subjetividade, slide 3; Moura e Quijano"},{"title":"Mediação ideológica da dominação racial","definition":"Representações ideológicas podem legitimar desigualdades historicamente produzidas, apresentando-as como naturais ou decorrentes apenas de escolhas individuais.","scenario":"Uma desigualdade de acesso à educação é explicada unicamente por mérito individual.","myth":"Ideologia racial consiste apenas em preconceitos conscientes sem relação com condições materiais.","source":"Raça, ideologia e subjetividade, slide 4"},{"title":"Branqueamento e mito da democracia racial","definition":"O branqueamento estabelece referências brancas como superiores; o mito da democracia racial representa harmonia e igualdade enquanto oculta barreiras estruturais.","scenario":"Uma pessoa é pressionada a modificar referências culturais enquanto a instituição afirma que todos têm oportunidades iguais.","myth":"O mito da democracia racial demonstra que a igualdade material já foi alcançada.","source":"Raça, ideologia e subjetividade, slide 5"},{"title":"Racismo e constituição subjetiva","definition":"Relações racializadas atravessam identificação, valor, expectativas e vínculos, podendo ser incorporadas, elaboradas ou contestadas de modos singulares.","scenario":"Uma estudante questiona padrões de competência que desvalorizam seu pertencimento.","myth":"O pertencimento racial determina automaticamente o pensamento e a conduta de cada pessoa.","source":"Raça, ideologia e subjetividade, slides 6–7"},{"title":"Luta antirracista e disputa de sentidos","definition":"A transformação antirracista envolve condições materiais, memória, conhecimentos, reconhecimento e organização coletiva.","scenario":"Um coletivo recupera histórias apagadas e reivindica acesso a espaços institucionais.","myth":"A valorização simbólica substitui integralmente a transformação das condições materiais.","source":"Raça, ideologia e subjetividade, slide 8"},{"title":"Colonialismo digital e colonialismo de dados","definition":"Faustino e Lippold relacionam o colonialismo digital à concentração de infraestrutura e poder informacional e à captura de dados e atividades humanas para acumulação de capital.","scenario":"Uma plataforma concentra dados, publicidade e infraestrutura enquanto usuários têm pouco controle sobre os fluxos.","myth":"Colonialismo digital é apenas uma metáfora para uso excessivo de celulares.","source":"Colonialismo Digital, introdução e capítulos 1–2"},{"title":"Materialidade do digital","definition":"O digital depende de hardware, energia, redes, trabalho humano e infraestrutura; virtual não equivale a irreal, e a intangibilidade não elimina sua base material.","scenario":"Uma foto armazenada na nuvem depende de servidores e redes físicas.","myth":"Arquivos digitais existem sem suporte material, consumo energético ou trabalho.","source":"Colonialismo Digital, cap. 1, p. 32–37"},{"title":"Quem coloniza quem: algoritmos e poder","definition":"Os algoritmos são produzidos em relações sociais e com finalidades determinadas; não são sujeitos autônomos que explicam por si a dominação.","scenario":"Um feed prioriza conteúdos segundo objetivos comerciais e critérios definidos pela plataforma.","myth":"O algoritmo possui uma intenção social autônoma, independente de proprietários e programadores.","source":"Colonialismo Digital, cap. 1, p. 40–42"},{"title":"Fetiche da tecnologia","definition":"O fetiche da tecnologia oculta relações sociais ao apresentar a técnica como neutra ou como entidade salvadora ou demoníaca independente da sociedade.","scenario":"Uma discussão atribui toda desigualdade à inteligência artificial sem investigar quem a desenvolve e com quais objetivos.","myth":"A crítica ao fetiche exige tratar a tecnologia como causa autônoma e inevitável de toda dominação.","source":"Colonialismo Digital, cap. 2, p. 43–45"},{"title":"Continuidades e mudanças do capitalismo digital","definition":"Os autores reconhecem mudanças tecnológicas e na composição orgânica do capital sem supor ruptura total com a exploração capitalista nem negar as transformações atuais.","scenario":"Uma análise de aplicativos investiga simultaneamente novas formas de controle e relações históricas de trabalho.","myth":"O capitalismo digital rompeu inteiramente com exploração e acumulação anteriores.","source":"Colonialismo Digital, cap. 2, p. 45–47"},{"title":"Politicismo, economicismo e eurocentrismo","definition":"O politicismo separa política das condições econômicas; o economicismo reduz as demais dimensões a reflexos mecânicos. Os autores defendem análise dialética que também considere racismo e colonialismo.","scenario":"Uma análise de plataformas articula economia, ideologia, racialização e poder político.","myth":"Uma análise econômica é suficiente para explicar mecanicamente toda manifestação racial e política.","source":"Colonialismo Digital, cap. 2, p. 47–49"},{"title":"Racialização digital e racismo algorítmico","definition":"O racismo pode materializar-se nas condições de trabalho, acesso e desenhos tecnológicos; sistemas digitais podem reproduzir hierarquias históricas sem serem agentes independentes.","scenario":"Um sistema de seleção reproduz desigualdades presentes nos dados e nas escolhas institucionais.","myth":"O racismo algorítmico só ocorre quando o programador declara explicitamente intenção discriminatória.","source":"Colonialismo Digital, introdução, p. 25–27; cap. 2"}];
const SOCIAL_PRESERVED_ID='social-rev-provas-equivalentes-20261113-1';
const SOCIAL_PRESERVED=()=>/* Revisão de lançamento — simulados finais de Psicologia PUCRS 2026/2.
   Novos IDs preservam tentativas, correções e questões de edições anteriores. */
(()=>{
'use strict';
const VERSION='rev-provas-equivalentes-20261113';
const META_VERSION='rev-prova-foco-p2-20261116';
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
 if(id==='avaliacao')items=items.filter(x=>evalScope.has(x.title));
  if(id==='meta')items=items.filter(x=>!/ang[uú]sti/i.test(x.title||''));
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
function generateEqual(id,model,topics){
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
 // Novo recorte da P2: o tema retirado da prova não pode reaparecer em
 // tópicos, alternativas, assertivas, flashcards ou modelos legados.
 if(Array.isArray(db.topics.meta)){
   db.topics.meta=db.topics.meta.filter(t=>!/ang[uú]sti/i.test(t.title||'')).map(t=>({
     ...t,
     definition:String(t.definition||'').replace(/conflitos e angústia/gi,'conflitos e tensões psíquicas'),
     scenario:String(t.scenario||'').replace(/angústia/gi,'tensão psíquica'),
     myth:String(t.myth||'').replace(/angústia/gi,'tensão psíquica')
   }));
 }
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
return generateEqual('social',1,[{"title":"Psicologia Sócio-Histórica: sujeito e história","definition":"Na perspectiva apresentada por Ana Bock, o sujeito constitui-se nas relações e condições históricas e materiais; não pode ser explicado como natureza humana abstrata e isolada.","scenario":"Uma estudante analisa sofrimento escolar considerando trabalho familiar, instituição e práticas sociais.","myth":"Na perspectiva sócio-histórica, a atividade psicológica pode ser explicada por propriedades individuais e as relações sociais funcionam apenas como cenário de sua manifestação."},{"title":"Psicologia Sócio-Histórica: crítica à naturalização","definition":"A crítica sócio-histórica questiona explicações que transformam relações produzidas socialmente em características universais e imutáveis do indivíduo.","scenario":"Em vez de atribuir fracasso escolar à preguiça inata, a equipe examina oportunidades e exclusões.","myth":"Na crítica à naturalização, diferenças de posição social são tratadas como consequência predominante de disposições individuais, e não de processos históricos."},{"title":"Psicologia da Libertação e práxis social","definition":"Martín-Baró propõe uma Psicologia comprometida com os problemas históricos das maiorias populares, recuperação da memória e transformação das condições de opressão.","scenario":"Um projeto comunitário parte das demandas dos moradores e fortalece sua participação política.","myth":"Na Psicologia da Libertação, a mudança social aparece como consequência da adaptação subjetiva às instituições já existentes, em vez de integrar a práxis psicológica."},{"title":"Desideologização e memória histórica","definition":"Desideologizar é examinar quem produz interpretações sociais, quais interesses são ocultados e como recuperar experiências e memória de grupos oprimidos.","scenario":"Uma análise questiona a afirmação de que a pobreza existe somente por falta de esforço.","myth":"Desideologizar consiste em corrigir crenças individuais sem investigar as narrativas públicas que organizam a memória histórica."},{"title":"Fatalismo: três dimensões articuladas","definition":"O fatalismo latino-americano discutido por Martín-Baró associa ideias de destino, atitudes de resignação e comportamentos de submissão, socialmente produzidos em relações de dominação.","scenario":"Uma comunidade deixa de reivindicar direitos porque aprendeu a considerar impossível mudar sua situação.","myth":"O fatalismo se manifesta principalmente em crenças individuais sobre destino, enquanto afetos e comportamentos têm papel periférico na sua manutenção."},{"title":"Fatalismo e transformação histórica","definition":"A leitura crítica do fatalismo não culpa grupos marginalizados; relaciona a aparente aceitação do destino a estruturas históricas e possibilidades concretas de ação coletiva.","scenario":"Moradores começam a participar de um conselho após experiências de organização e conquista de direitos.","myth":"A transformação do fatalismo depende principalmente de mudança na atitude pessoal, mesmo quando permanecem as condições sociais que sustentam a experiência de impotência."},{"title":"Epistemicídio e hierarquias de conhecimento","definition":"Grosfoguel discute o apagamento e a inferiorização de saberes associados a processos coloniais, racistas e sexistas, que privilegiam a voz de homens ocidentais.","scenario":"Um curso reconhece apenas autores europeus e desqualifica sistematicamente cosmologias indígenas.","myth":"A noção de epistemicídio designa a perda de registros escritos, sendo independente dos mecanismos de exclusão de povos e modos de conhecer."},{"title":"Quatro genocídios/epistemicídios do longo século XVI","definition":"Grosfoguel articula a conquista de Al-Andalus contra muçulmanos e judeus, a conquista das Américas contra povos indígenas, a escravização de africanos e a perseguição de mulheres acusadas de bruxaria.","scenario":"Uma discussão histórica conecta exclusão de saberes, violência colonial e consolidação das universidades ocidentalizadas.","myth":"O estudo dos quatro genocídios e epistemicídios enfatiza rupturas militares e territoriais, mas considera secundária a formação de hierarquias de conhecimento."},{"title":"Racismo e sexismo epistêmicos","definition":"São mecanismos que atribuem legitimidade desigual à produção de conhecimento segundo posições geopolíticas e sociais, desqualificando perspectivas subalternizadas.","scenario":"Uma pesquisadora afrodescendente é desconsiderada enquanto análises semelhantes de autores europeus são validadas.","myth":"A exclusão de determinados conhecimentos da ciência decorre predominantemente de diferenças de método, sem relação estruturante com raça ou gênero."},{"title":"Gênero como categoria analítica","definition":"Na Psicologia Social, gênero permite estudar como diferenças e hierarquias são produzidas nas relações históricas, sem tratá-las como essências naturais.","scenario":"Uma pesquisa observa expectativas diferentes para alunas e alunos na mesma instituição.","myth":"O uso de gênero como categoria analítica se concentra em classificar diferenças individuais, sem investigar como as hierarquias são instituídas nas relações sociais."},{"title":"Feminismos, produção do conhecimento e crítica","definition":"O debate feminista interroga quem é reconhecido como sujeito de pesquisa, como conceitos são empregados e como relações de poder atravessam o conhecimento.","scenario":"Uma revisão questiona por que experiências de algumas mulheres são tratadas como universais.","myth":"A crítica feminista da ciência pode ser atendida pela ampliação de participação feminina nas amostras, sem rever categorias e posições de quem pesquisa."},{"title":"Interseccionalidade: relação de relações de poder","definition":"A interseccionalidade analisa como gênero, racialização, classe, migração e outras relações se cruzam e produzem experiências específicas, que não se explicam somando rótulos isolados.","scenario":"Uma trabalhadora migrante encontra barreiras que envolvem conjuntamente gênero, classe e nacionalidade.","myth":"A interseccionalidade exige avaliar separadamente gênero, classe e racialização e depois somar seus efeitos, sem alterar o modelo de cada categoria."},{"title":"Interseccionalidade e processos de subjetivação","definition":"As condições sociais interligadas atravessam reconhecimento, possibilidades de ação e sofrimento, mas não determinam identidades de forma mecânica.","scenario":"Uma estudante relata expectativas contraditórias associadas à sua origem social e posição de gênero.","myth":"A formação da subjetividade pode ser explicada por escolhas individuais, enquanto relações de poder atuam apenas no acesso a recursos materiais."},{"title":"Categorias de relação e migração brasileira","definition":"Adriana Piscitelli analisa como categorias de diferença e poder ajudam a compreender experiências de brasileiras em mercados de trabalho e matrimonial transnacionais.","scenario":"Uma pesquisa evita presumir que todas as migrantes brasileiras tenham o mesmo grau de autonomia.","myth":"Na análise de experiências migratórias, nacionalidade e destino explicam as oportunidades de maneira mais decisiva que a relação entre classe, gênero e racialização."},{"title":"Infância como construção histórica e social","definition":"Cruz, Hillesheim e Guareschi discutem a infância como categoria construída social e historicamente, e como práticas psi participam das formas de defini-la.","scenario":"Uma equipe questiona padrões de desenvolvimento usados sem considerar contexto social e histórico.","myth":"As práticas psicológicas sobre a infância descrevem etapas universais já dadas, e as mudanças institucionais apenas adaptam a linguagem empregada."},{"title":"Políticas públicas de infância e práticas psi","definition":"A análise histórica de dispositivos como Roda dos Expostos, Juizado de Menores, SAM, FEBEM e ECA evidencia mudanças na assistência, tutela e direitos das crianças.","scenario":"Uma política atual é avaliada por seu compromisso com direitos em vez de apenas vigiar famílias.","myth":"As transformações das políticas de infância podem ser interpretadas apenas como evolução progressiva da proteção, sem considerar dispositivos de tutela e normalização."},{"title":"Tecnologias da informação e subjetividade","definition":"Tecnologias digitais são produzidas e usadas por sujeitos e instituições com interesses; podem modular visibilidades, vínculos e experiências subjetivas sem determinar mecanicamente todo comportamento.","scenario":"Dois perfis recebem recomendações diferentes depois de interações, o que exige observar algoritmo e escolhas sociais.","myth":"A subjetividade digital resulta principalmente de efeitos técnicos do algoritmo, com pouca participação de interesses institucionais e práticas dos próprios usuários."},{"title":"Democracia formal e participação efetiva","definition":"A distinção feita em Psicologia da Libertação considera que instituições e eleições não bastam quando barreiras sociais impedem maiorias de exercer poder real.","scenario":"Uma cidade vota regularmente, mas grupos excluídos não têm condições de participar das decisões.","myth":"A presença de instituições representativas define participação efetiva, enquanto as desigualdades de acesso ao poder pertencem a uma esfera externa à análise da democracia."}]);
})();
const EVAL_VERSION='rev-avaliacao-p3-fontes-revisadas-20261119-v2';
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
const definition=t=>norm(t.examDefinition||t.definition);
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
 meta:['combo','choice','choice','combo','choice','tf','combo','choice','combo','choice','tf','choice','combo','choice','tf'],
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

/* Metapsicologia P2: 15 itens objetivos em cada simulado, baseados nas 28 questões de segunda tópica, Édipo e pulsão.
   As alternativas são afirmações completas, retiradas de conceitos relacionados do próprio roteiro.
   Nenhuma alternativa é uma recomendação vaga do tipo "priorizar outro conceito". */
function metaSectionPeers(topics,topic){
 const peers=topics.filter(t=>t!==topic&&t.section===topic.section);
 const ranked=similarTopics('meta',peers.concat([topic]),topic).filter(t=>t.section===topic.section&&t!==topic);
 return ranked.length>=3?ranked:peers.length>=3?peers:topics.filter(t=>t!==topic);
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
  prompt:'Sobre '+topic.title.toLowerCase()+', qual afirmação está de acordo com a teoria freudiana?',
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
function generateMeta(model,topics){
 const format=FORMATS.meta,selected=Array.from({length:15},(_,i)=>topics[((model-1)*3+i*9)%topics.length]);
 const questions=selected.map((topic,i)=>{
  const id='meta-'+META_VERSION+'-'+model+'-'+(i+1);
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
function generateVaried(id,model,topics,overrideVersion){
 const format=FORMATS[id]||FORMATS.tcc,questions=[];
 const version=overrideVersion||(id==='social'?SOCIAL_VERSION:UPCOMING_VERSION);
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
  questions.push(variedEssay(topics,model,0,version===SOCIAL_VERSION?b:a,version===SOCIAL_VERSION?pickPool(topics,model,15):b,id+'-'+version+'-'+model+'-15'));
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
 if(id==='meta')
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
 // Guardar as provas anteriores de Avaliação P3 sem duplicá-las nas provas ativas.
 const olderP3=e=>e?.subject==='avaliacao'&&String(e.revision||'').startsWith('rev-avaliacao-p3-')&&e.revision!==EVAL_VERSION;
 for(const e of db.exams.filter(olderP3))if(!db.archivedExams.some(a=>a.id===e.id))db.archivedExams.push(e);
 db.exams=db.exams.filter(e=>!olderP3(e));
 for(const id of ['tcc','familia','meta','grupos','social','avaliacao']){
  if(!db.subjects[id])continue;
  const oldTopics=curated(db,id);
  const topics=equalTopics(db,id);
  if(id==='familia')for(const x of familyExtra)if(!db.topics.familia.some(t=>t.title===x.title))db.topics.familia.push({...x});
  if(topics.length<3)continue;
  if(id==='social'){
   const original=db.exams.find(e=>e.id===SOCIAL_PRESERVED_ID)||db.archivedExams.find(e=>e.id===SOCIAL_PRESERVED_ID)||SOCIAL_PRESERVED();
   const expanded=[...topics,...SOCIAL_EXTRA];
   for(let level=1;level<=5;level++){
    const prior=generateVaried(id,level,topics,SOCIAL_OLD_VERSION);
    if(!db.archivedExams.some(e=>e.id===prior.id))db.archivedExams.push(db.exams.find(e=>e.id===prior.id)||prior);
   }
   const previous=db.exams.filter(e=>e.subject==='social');
   for(const e of previous)if(e.id!==original.id&&e.revision!==SOCIAL_VERSION&&!db.archivedExams.some(a=>a.id===e.id))db.archivedExams.push(e);
   db.exams=db.exams.filter(e=>e.subject!=='social');
   // Mesmo ID, questões, respostas e gabarito da prova realizada; apenas marca a edição ativa.
   db.exams.push({...original,revision:SOCIAL_VERSION});
   for(let level=2;level<=5;level++)db.exams.push(generateVaried(id,level,expanded));
   for(const t of SOCIAL_EXTRA)if(!db.topics.social.some(x=>x.title===t.title))db.topics.social.push(t);
   continue;
  }
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
window.PSICO_FINAL_EXAMS={apply,curated:(db,id)=>id==='social'?[...curated(db,id),...SOCIAL_EXTRA]:curated(db,id),familyExtra,version:UPCOMING_VERSION,familyVersion:VERSION,metaVersion:META_VERSION,socialVersion:SOCIAL_VERSION,evaluationVersion:EVAL_VERSION,generateEqual,formats:FORMATS};

function socialNotice(){
 const nav=document.querySelector('nav.subject-hub-menu[aria-label*="Psicologia Social"]');
 if(!nav||nav.previousElementSibling?.id==='social-p3-simulado-notice'||document.getElementById('social-p3-simulado-notice'))return;
 const btn=document.createElement('button');btn.type='button';btn.id='social-p3-simulado-notice';btn.className='p3-podcast-update';btn.dataset.action='subjectArea:exams';
 btn.innerHTML='<span class="p3-podcast-update-icon" aria-hidden="true">✓</span><span class="p3-podcast-update-copy"><small>NOVIDADE · PROVA 3</small><strong>Simulados atualizados!</strong><span>Novas questões sobre raça, subjetividade e colonialismo digital, com os conteúdos da prova desde a semana 9.</span></span><span class="p3-podcast-update-link">Ver simulados →</span>';
 const target=[...nav.querySelectorAll('button')].find(x=>/simulados?/i.test(x.textContent));if(target){btn.dataset.action=target.dataset.action||'subjectArea:exams';nav.parentNode.insertBefore(btn,nav.previousElementSibling?.classList.contains('subject-hub-area-intro')?nav.previousElementSibling:nav);}
}
if(typeof document!=='undefined'){
 const start=()=>{socialNotice();new MutationObserver(socialNotice).observe(document.body,{childList:true,subtree:true});};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
}
})();
