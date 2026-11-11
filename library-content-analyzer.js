/* Classificação local e explicável dos materiais, usando o TEXTO interno (não apenas o nome). */
(()=>{'use strict';
const rules={
 meta:[['segunda tópica',['segunda tópica','segunda teoria do aparelho','teoria estrutural','dissecação da personalidade']],['id, ego e superego',['superego','id e ego','id, ego','ego e superego','princípio da realidade']],['Édipo',['complexo de édipo','conflitiva edípica','triangulação edípica','castração simbólica']],['narcisismo',['narcisismo','narcísico','autoerotismo','libido do eu']],['pulsões',['pulsão','pulsões','trieb','pulsional','eros e']],['angústia',['angústia','angústia-sinal','sinal de perigo','primeira teoria da angústia']],['recalcamento',['recalcamento','recalque','recalcado']],['base psicanalítica',['metapsicologia','psicanálise','freud','laplanche','roudiniesco']]],
 familia:[['divórcio e recasamento',['divórcio','recasamento','famílias recasadas','coparentalidade','monoparentais']],['segredos e adoção',['segredos de família','adoção','adotiva','filho adotivo']],['violência intrafamiliar',['violência intrafamiliar','violência familiar','violência doméstica','abuso sexual intrafamiliar']],['luto',['luto','perdas familiares','morte na família']],['dependência química',['dependência química','alcoolismo','uso de substâncias']],['atendimento familiar',['terapia familiar','atendimento familiar','contexto escolar','assistência social','visão sistêmica','fronteiras familiares']]],
 tcc:[['Terapia do Esquema',['terapia do esquema','esquema inicial desadaptativo','modos esquemáticos','reparentalização','young e klosko']],['ACT / flexibilidade',['terapia de aceitação e compromisso','aceitação e compromisso','flexibilidade psicológica','desfusão cognitiva','ação comprometida']],['terapias de terceira onda',['terceira onda','third wave','mindfulness','terapia dialética comportamental','dbt','mbct','cft','fap']],['terapia cognitiva de Beck',['terapia cognitiva de beck','aaron beck','pensamentos automáticos','crenças centrais']],['TREC / Ellis',['terapia racional emotiva','terapia racional-emotiva','albert ellis','trec','modelo abc']]],
 social:[['psicologia social crítica',['psicologia social crítica','martín-baró','martin-baro','psicologia da libertação','fatalismo latino']],['ideologia e marcadores sociais',['ideologização','desideologização','marcadores sociais','relações étnico-raciais','racismo','gênero e sexualidade']],['algoritmos e polarização',['algoritmos','polarização social','polarização afetiva','bolhas de filtro','viés de confirmação','recomendação algorítmica']],['interações sociais',['psicologia social','relações de poder','identidade social','pertencimento']]],
 avaliacao:[['devolução e documentos',['entrevista de devolução','devolutiva','laudo psicológico','parecer psicológico','elaboração de documentos','resolução cfp 06/2019']],['ética e normas',['ética na avaliação psicológica','resolução cfp 31/2022','resolução cfp 31','sigilo profissional','satepsi','código de ética']],['contexto organizacional',['contexto organizacional','avaliação organizacional','recrutamento e seleção','saúde do trabalhador']],['contexto hospitalar',['contexto hospitalar','psicologia hospitalar','hospitalização']],['contexto forense',['contexto forense','avaliação forense','perícia psicológica','psicologia jurídica','contexto judicial']],['atendimento a pessoas trans',['pessoas trans','população trans','identidade de gênero','transexualidade']],['instrumentos de avaliação',['avaliação psicológica','testes psicológicos','psicometria','validade de testes','precisão de testes','padronização','adaptação de instrumentos','bateria de testes','anamnese']]],
 grupos:[['Psicodrama',['psicodrama','jacob levy moreno','sociometria','protagonista','dramatização']],['Carl Rogers',['carl rogers','grupos de encontro','abordagem centrada na pessoa','consideração positiva incondicional']],['Escritores da Liberdade',['escritores da liberdade','freedom writers','erin gruwell']],['processos grupais',['psicologia dos grupos','dinâmica de grupos','cohesão grupal','coesão grupal']]]
};
const filenames={geral:'Cadernos integrados',meta:'Metapsicologia',familia:'Psicologia da Família',tcc:'TCC',social:'Psicologia Social',avaliacao:'Avaliação Psicológica',grupos:'Psicologia dos Grupos'};
const normalize=s=>String(s||'').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[\u00ad]/g,'').replace(/\s+/g,' ').trim();
function load(src,check){if(check())return Promise.resolve();return new Promise((res,rej)=>{const el=document.createElement('script');el.src=src;el.onload=()=>check()?res():rej(Error('Biblioteca de leitura indisponível'));el.onerror=()=>rej(Error('Sem conexão com o leitor de documentos'));document.head.append(el)})}
function pages(n){const arr=[];for(let i=1;i<=Math.min(12,n);i++)arr.push(i);for(const f of [.25,.5,.75,1])arr.push(Math.max(1,Math.min(n,Math.floor(n*f))));return [...new Set(arr)].sort((a,b)=>a-b).slice(0,16)}
async function pdf(file){
 await load('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',()=>!!window.pdfjsLib?.getDocument);
 window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
 const doc=await window.pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer()),disableFontFace:true}).promise;
 let result='';
 try{for(const i of pages(doc.numPages)){const p=await doc.getPage(i),t=await p.getTextContent({normalizeWhitespace:true});result+=' '+t.items.map(x=>x.str||'').join(' ');p.cleanup();if(result.length>40000)break}}finally{await doc.destroy()}
 return result.slice(0,40000)
}
async function docx(file){await load('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js',()=>!!window.mammoth?.extractRawText);const res=await window.mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});return String(res.value||'').slice(0,40000)}
async function pptx(file){
 await load('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',()=>!!window.JSZip?.loadAsync);
 const zip=await window.JSZip.loadAsync(await file.arrayBuffer());const slides=Object.keys(zip.files).filter(x=>/^ppt\/slides\/slide\d+\.xml$/.test(x)).sort((a,b)=>parseInt(a.match(/slide(\d+)/)[1])-parseInt(b.match(/slide(\d+)/)[1]));
 let result='';for(const name of slides.slice(0,35)){let xml=await zip.file(name).async('string');const parts=[...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map(m=>m[1].replace(/&(?:amp|lt|gt|quot|apos);/g,c=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'"}[c])));result+=' '+parts.join(' ');if(result.length>40000)break}return result.slice(0,40000);
}
const finalExamFocus={
 meta:['segunda tópica','id, ego e superego','Édipo','narcisismo','pulsões','angústia','recalcamento'],
 familia:['divórcio e recasamento','segredos e adoção','violência intrafamiliar','luto','dependência química','atendimento familiar'],
 tcc:['Terapia do Esquema','ACT / flexibilidade','terapias de terceira onda'],
 social:['psicologia social crítica','ideologia e marcadores sociais','algoritmos e polarização','interações sociais'],
 avaliacao:['ética e normas','contexto organizacional','contexto hospitalar','contexto forense','atendimento a pessoas trans'],
 grupos:['Psicodrama','Carl Rogers','Escritores da Liberdade','processos grupais']
};
const finalExamSupport={avaliacao:['devolução e documentos','instrumentos de avaliação']};
const weakTokens=['psicologia social','psicanálise','freud','avaliação psicológica','psicologia dos grupos','terapia cognitiva de beck','modelo abc'];
function score(text){
 const flat=normalize(text);const ranked=Object.entries(rules).map(([subject,topics])=>{
  const findings=topics.map(([topic,aliases])=>{
   const hits=aliases.filter(x=>flat.includes(normalize(x)));return hits.length?{topic,hits:hits.slice(0,3)}:null
  }).filter(Boolean);
  const evidence=findings.reduce((n,x)=>n+x.hits.reduce((z,h)=>z+(weakTokens.some(w=>normalize(w)===normalize(h))?1:3),0),0);
  return {subject,label:filenames[subject],score:evidence,topics:findings.map(x=>x.topic),hits:findings.flatMap(x=>x.hits).slice(0,12)};
 }).sort((a,b)=>b.score-a.score);
 return ranked
}
async function analyze(file){
 const ext=String(file?.name||'').split('.').pop().toLowerCase();let text='',error='';
 try{if(ext==='pdf')text=await pdf(file);else if(ext==='docx')text=await docx(file);else if(ext==='pptx')text=await pptx(file);else error='Formato não suportado';}catch(err){error=err?.message||'Não foi possível analisar o texto'}
 const meaningful=normalize(text).length>=80;const ranked=meaningful?score(text):[];
 const best=ranked[0]||null;const runner=ranked[1]||null;
 const confident=!!(best&&best.score>=6&&best.score>=((runner?.score||0)+3));
 let examMatch='incerto';
 if(confident&&best){
  if((finalExamFocus[best.subject]||[]).some(t=>best.topics.includes(t)))examMatch='principal';
  else if((finalExamSupport[best.subject]||[]).some(t=>best.topics.includes(t)))examMatch='complementar';
  else examMatch='fora';
 }
 const preview=text.replace(/\s+/g,' ').trim().slice(0,360);
 return {quality:meaningful?'texto':(error?'indisponivel':'sem_texto'),error,textLength:text.length,preview,
  ranked,subject:confident?best.subject:'',topics:best?.topics||[],hits:best?.hits||[],examMatch,
  confidence:confident?((runner?.score||0)<=best.score/2?'alta':'moderada'):'revisao',
  summary:meaningful?('Conteúdo identificado: '+(best?.topics?.slice(0,6).join(', ')||'sem assunto identificado')+'. Amostra: '+preview.slice(0,180)):'Não foi possível extrair texto verificável; classificação manual necessária.'};
}
window.UentzoulLibraryAnalyzer={analyze,subjects:filenames,normalize,score};
})();