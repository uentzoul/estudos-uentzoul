/* Apresentação integrada dos estudos dirigidos nas disciplinas do PsicoMoodle. Sem links externos e sem novas chamadas de API. */
(()=>{
 'use strict';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=s=>esc(String(s??'').replace(/\s*\n\s*/g,' ').replace(/\s+/g,' ').trim());


 // Reutiliza o progresso por conta e semestre já mantido pelo núcleo do site.
 const wasSeen=id=>!!window.uentzoulProfileBridge?.progress?.()?.completed?.[id];
 function seenControl(id){
   if(!window.uentzoulAIAuth?.user?.())return '';
   const checked=wasSeen(id);
   return '<label class="donecontrol sd-seen-control '+(checked?'is-checked':'')+'" title="Marcação pessoal de estudo">'+
     '<input type="checkbox" data-complete="'+esc(id)+'" aria-label="Marcar estudo dirigido como visto" '+(checked?'checked':'')+'>'+
     '<span>'+(checked?'✓ Visto':'Marcar como visto')+'</span></label>';
 }

 const OFFICIAL_TAG='psicomoodle:estudo-dirigido:professor';
 const UPLOAD_TABLE='uentzoul_library_uploads',GUIDES_TABLE='uentzoul_study_guides';
 const TARGETS=Object.freeze({familia:'P2',tcc:'P2',meta:'P2',grupos:'P2',social:'P3',avaliacao:'P3'});
 const FALLBACK_IDS=Object.freeze({
   familia:['familia-p2-revisao-conferida-2026'],tcc:[],
   meta:[],grupos:['grupos-p2-revisao-conferida-2026'],
   social:['social-p3-revisao-integrada-2026'],
   avaliacao:['avaliacao-p3-revisao-conferida-2026']
 });
 let officialRows=[],publishedGuides=[],sourcesReady=false,sourcesLoading=false,lastSourcesAt=0;
 const preparation={running:null,attempts:Object.create(null),errors:Object.create(null)};
 const semester=()=>window.uentzoulLibraryApp?.semester?.()||'2026/2';
 const isAdmin=()=>!!(window.uentzoulAdminConfig?.isAdmin?.()||window.uentzoulLibraryManager?.isAdmin?.());
 const client=()=>window.uentzoulAIAuth?.client?.();
 function docSubject(row){
   const subj=String(row.file_subject||'');
   return subj.startsWith('2026/1::')?'':subj;
 }
 function docExam(row){
   const tag=(row.content_tags||[]).find(t=>/^psicomoodle:prova:/i.test(t));
   return tag?tag.split(':').pop().toUpperCase():'';
 }
 const docFormat=doc=>String(doc.filename||'').toLowerCase().match(/\.(pdf|docx|pptx)$/)?.[1]?.toUpperCase()||'Documento';
 const currentDoc=subject=>officialRows.filter(row=>docSubject(row)===subject&&docExam(row)===TARGETS[subject])
   .sort((a,b)=>Number(b.updated_at?Date.parse(b.updated_at):0)-Number(a.updated_at?Date.parse(a.updated_at):0))[0]||null;
 const currentSaved=subject=>publishedGuides.find(row=>row.subject===subject&&row.exam===TARGETS[subject])||null;
 function inlineOriginal(subject){
   const exam=TARGETS[subject],guides=window.PSICO_GUIDES?.[subject]||[];
   return guides.find(g=>g.status==='original'&&
    (new RegExp('(?:^|[^a-z0-9])'+exam.toLowerCase()+'(?:[^a-z0-9]|$)','i').test(String(g.id||'')+' '+String(g.title||''))||
     (subject==='meta'&&g.id==='meta-p2-professor')))||null;
 }
 function currentFallback(subject){
   const ids=FALLBACK_IDS[subject]||[];
   const guides=window.PSICO_GUIDES?.[subject]||[];
   return ids.map(id=>guides.find(g=>g.id===id&&g.status==='adaptado')).find(Boolean)||null;
 }
 function openOriginalMarkup(doc){
   return doc?'<div class="sd-original-file"><span>Arquivo original do professor</span>'+
    '<a href="#" class="sd-official-action" data-sd-official="'+esc(doc.resource_key)+'">Abrir documento ('+esc(docFormat(doc))+') ↗</a></div>':'';
 }
 // Somente o estudo dirigido P3 de Avaliação Psicológica, confirmado pelo
 // proprietário em 19/11/2026, pode iniciar esta preparação assistida.
 // As outras disciplinas e provas continuam sem geração automática.
 let avaliacaoP3AutoRequested=false;
 function prepareMissingGuides(){
   if(avaliacaoP3AutoRequested||!sourcesReady||!isAdmin()||preparation.running)return;
   const doc=currentDoc('avaliacao'),saved=currentSaved('avaliacao');
   if(!doc||doc.resource_key!=='avaliacao::Estudo dirigido para P3::27nov-66f091e7-018d-461d-b2cc-b78b51a6f575'|| 
      !Array.isArray(doc.content_tags)||
      !doc.content_tags.includes(OFFICIAL_TAG)||
      !doc.content_tags.includes('psicomoodle:prova:P3')||
      (saved?.resource_key===doc.resource_key&&saved.guide?.questions?.length))return;
   avaliacaoP3AutoRequested=true;
   void prepareGuide('avaliacao');
 }
 function sourceStatusMarkup(subject,doc){
   const exam=TARGETS[subject],error=preparation.errors[subject];
   const running=preparation.running===subject;
   const title=doc?.display_title||doc?.filename||'Roteiro do professor';
   if(!doc)return '<div class="sd-empty" data-sd-subject="'+esc(subject)+'">Ainda não há estudo dirigido oficial confirmado para '+esc(exam)+'.</div>';
   // Não iniciar correções sem validação documental explícita.
   return '<section class="sd-root" data-sd-subject="'+esc(subject)+'" aria-label="Estudos dirigidos da disciplina">'+
    '<header class="sd-header"><span class="sd-kicker">ESTUDO DIRIGIDO · '+esc(exam)+'</span><h2>Estudos dirigidos</h2>'+
    '<p>O documento oficial do professor já está cadastrado. A versão comentada utiliza as questões originais, com respostas-modelo e explicações no próprio site.</p></header>'+
    '<div class="sd-guide"><div class="sd-guide-body"><strong>'+fmt(title)+'</strong>'+
    '<p class="sd-preparing-message">'+(running?'Preparando as questões e respostas comentadas…':
      error?'Não foi possível concluir a preparação automática: '+fmt(error):
      'A transcrição e a correção comentada deste roteiro ainda não foram publicadas.')+'</p>'+
    (isAdmin()?'<button class="sd-official-action" type="button" data-sd-prepare="'+esc(subject)+'" '+
      (running?'disabled':'')+'>'+(running?'Preparando…':'Gerar versão integral comentada')+'</button>':'')+
    openOriginalMarkup(doc)+'</div></div></section>';
 }
 function refreshVisibleGuides(){
   document.querySelectorAll('[data-sd-subject]').forEach(node=>{
     const subj=node.getAttribute('data-sd-subject');
     if(!subj||!node.isConnected)return;
     // A sincronização de materiais jamais deve fechar uma explicação em leitura.
     // Ao navegar novamente, a área será gerada com os dados atualizados.
     if(node.contains(document.activeElement)||node.querySelector('details[open],input:focus,textarea:focus'))return;
     const markup=window.renderStudyGuide(subj);
     if(node.outerHTML!==markup)node.outerHTML=markup;
   });
 }
 async function refreshSources(force=false){
   const c=client(),user=window.uentzoulAIAuth?.user?.();
   if(!c||sourcesLoading||(!force&&Date.now()-lastSourcesAt<30000))return;
   sourcesLoading=true;lastSourcesAt=Date.now();
   try{
     const [uploads,saved]=await Promise.all([
       c.from(UPLOAD_TABLE)
        .select('resource_key,display_title,filename,file_subject,storage_path,content_tags,publish_at,library_public,updated_at')
        .contains('content_tags',[OFFICIAL_TAG]).limit(500),
       c.from(GUIDES_TABLE)
        .select('semester,subject,exam,resource_key,guide,published,updated_at')
        .eq('semester','2026/2').eq('published',true).limit(20)
     ]);
     if(uploads.error)throw uploads.error;
     if(saved.error)throw saved.error;
     const documents=(uploads.data||[]).filter(d=>typeof d.storage_path==='string'&&d.storage_path.startsWith('materials/'));
     const guides=(saved.data||[]).filter(g=>g.published&&TARGETS[g.subject]===g.exam&&Array.isArray(g.guide?.questions));
     const changed=!sourcesReady||JSON.stringify(documents)!==JSON.stringify(officialRows)||
       JSON.stringify(guides)!==JSON.stringify(publishedGuides);
     officialRows=documents;publishedGuides=guides;sourcesReady=true;
     if(changed){refreshVisibleGuides();window.dispatchEvent(new Event('uentzoul:study-guides-updated'));}
     if(isAdmin())setTimeout(prepareMissingGuides,900);
   }catch(error){
     console.warn('Consulta dos estudos dirigidos indisponível:',error);
     if(!sourcesReady){sourcesReady=true;refreshVisibleGuides();}
   }finally{sourcesLoading=false;}
 }
 async function prepareGuide(subject,force=false){
   const exam=TARGETS[subject],doc=currentDoc(subject),existing=currentSaved(subject);
   if(!isAdmin()||!client()||!exam||!doc||preparation.running||
      (existing?.resource_key===doc.resource_key&&Array.isArray(existing?.guide?.questions)))return;
   if(!force&&Date.now()-(preparation.attempts[subject]||0)<180000)return;
   preparation.attempts[subject]=Date.now();preparation.running=subject;
   delete preparation.errors[subject];refreshVisibleGuides();
   try{
     const {data,error}=await client().functions.invoke('study-guide-prepare',
       {body:{subject,exam,resource_key:doc.resource_key}});
     if(error||!data?.ok)throw Error(data?.error||error?.message||'Falha de geração');
     await refreshSources(true);
   }catch(error){preparation.errors[subject]=error?.message||'Não foi possível processar o documento.';}
   finally{preparation.running=null;refreshVisibleGuides();if(isAdmin())setTimeout(prepareMissingGuides,1200);}
 }
 document.addEventListener('click',async event=>{
   const start=event.target.closest('[data-sd-prepare]');
   if(start){event.preventDefault();void prepareGuide(start.dataset.sdPrepare,true);return;}
   const link=event.target.closest('[data-sd-official]');
   if(!link)return;
   event.preventDefault();
   const c=client(),user=window.uentzoulAIAuth?.user?.();
   if(!c){alert('O serviço de arquivos está indisponível. Tente novamente.');return;}
   const row=officialRows.find(d=>d.resource_key===link.dataset.sdOfficial);
   if(!row?.storage_path){alert('O arquivo não está disponível.');return;}
   const tab=window.open('','_blank');
   if(tab){try{tab.document.title='Abrindo estudo dirigido…';tab.document.body.textContent='Carregando documento…';}catch(_){}}
   try{
     const {data,error}=await c.storage.from('uentzoul-library-files').createSignedUrl(row.storage_path,3600);
     if(error||!data?.signedUrl)throw error||Error('Link indisponível.');
     if(tab&&!tab.closed)tab.location.replace(data.signedUrl);else window.location.assign(data.signedUrl);
   }catch(error){if(tab&&!tab.closed)tab.close();alert('Não foi possível abrir o material: '+(error?.message||'tente novamente'));}
 });
 window.addEventListener('uentzoul:library-updated',()=>{void refreshSources(true);});
 window.addEventListener('uentzoul:auth',()=>{sourcesReady=false;lastSourcesAt=0;void refreshSources(true);});
 window.addEventListener('focus',()=>{void refreshSources();});
 setInterval(()=>{
   if(document.hidden)return;
   void refreshSources();
   if(isAdmin())prepareMissingGuides();
 },20000);
 setTimeout(()=>{void refreshSources(true);},1000);
 function paragraph(s){
  const text=String(s||'').trim();
  if(!text)return '';
  return text.split(/\n\s*\n/g).filter(Boolean).map(p=>'<p>'+fmt(p)+'</p>').join('');
 }
 function questionText(s){
  const cleaned=String(s??'').replace(/\s*\n\s*/g,' ').replace(/\s+/g,' ').trim();
  const segments=cleaned.split(/(?=\b(?:I|II|III|IV|V)\.(?=\s|[A-ZÁÉÍÓÚÀÃÕ]))/).filter(Boolean);
  return segments.map((p,i)=>'<p class="sd-statement'+(i?' sd-assertion':'')+'">'+fmt(p)+'</p>').join('');
 }
 function part(p,i){
  return '<div class="sd-part"><span class="sd-part-index">'+String(i+1).padStart(2,'0')+'</span><div><strong>'+fmt(p.title)+'</strong><p>'+fmt(p.explanation)+'</p>'+
  (p.example?'<p class="sd-part-example">'+fmt(p.example)+'</p>':'')+'</div></div>';
 }
 // Respostas curtas revisadas a partir das 21 questões oficiais da P3.
 const P3_DIRECT=Object.freeze([
  "Comece pelos pontos positivos e pelas capacidades do paciente. Depois, explique as dificuldades e apresente orientações. Acolha as reações emocionais, use uma linguagem clara e confirme se a pessoa entendeu.",
  "Os responsáveis devem receber as informações necessárias para apoiar a criança. A criança também deve participar quando adequado, com explicações próprias para sua idade. Confirme o entendimento de ambos e preserve o sigilo.",
  "Arzeno: primeiro os responsáveis, depois a criança ou o adolescente. Macedo e Carrasco: primeiro o adolescente, depois um encontro com os responsáveis e o adolescente. Para crianças, propõem a devolução junto aos pais.",
  "É a avaliação de características psicológicas e competências relacionadas ao trabalho. Serve para auxiliar a seleção, o desenvolvimento profissional e outras decisões organizacionais, considerando as exigências da função e o bem-estar dos trabalhadores.",
  "É uma entrevista que usa exemplos de comportamentos passados para entender como a pessoa pode agir no futuro. No modelo CAR: Contexto é a situação; Ação é o que a pessoa fez; Resultado é o que aconteceu depois. O passado fornece pistas, mas não garante o comportamento futuro.",
  "O psicólogo observa comunicação, escuta, trabalho em equipe, liderança ou iniciativa, resolução de conflitos, organização, tomada de decisão e adaptação. Deve avaliar comportamentos observáveis, com critérios definidos para a vaga, e combinar os dados com outras fontes.",
  "O laudo comunica os resultados da avaliação e ajuda a fundamentar decisões. É necessário quando a finalidade ou as normas exigem esse documento. Deve ser claro, baseado em evidências, respeitar o sigilo e incluir apenas as informações necessárias.",
  "Busca entender como a doença e a hospitalização afetam o paciente emocionalmente, cognitivamente e socialmente, para orientar o cuidado. Considera a história da pessoa, a condição clínica, o tratamento, o ambiente hospitalar, a família e a equipe de saúde.",
  "É compreender a pessoa pela interação de três dimensões: biológica (corpo e saúde), psicológica (pensamentos, emoções e comportamentos) e social (família, relações e condições de vida). Nenhuma delas explica sozinha o adoecimento.",
  "É uma avaliação do funcionamento mental da pessoa naquele momento. Investiga aparência, comportamento, consciência, orientação, atenção, memória, linguagem, humor, afeto, pensamento, percepção, atividade psicomotora, julgamento e consciência da própria condição (insight).",
  "É uma alteração aguda e flutuante da atenção e da consciência, que pode causar confusão, desorientação, problemas de memória e mudanças na percepção. Pode ocorrer por doenças, medicamentos ou outras causas clínicas e exige avaliação da equipe de saúde.",
  "Devem constar a data, a identificação profissional, o motivo do atendimento, os procedimentos, as observações relevantes, as intervenções, as orientações e o plano de acompanhamento. Registre apenas o necessário para o cuidado e preserve o sigilo.",
  "Conforme o material de aula, a pessoa entra no PROTIG pelo GERCON e passa por entrevistas com Psicologia, Psiquiatria e Serviço Social, além de exames. A equipe busca entender sua história, demandas e necessidades para definir encaminhamentos e acompanhamento. A identidade de gênero não depende de cirurgia.",
  "O perito oficial é nomeado pelo juiz, atua de forma imparcial e produz um laudo pericial. O assistente técnico é indicado por uma das partes, analisa a perícia e produz um parecer técnico. Ambos devem respeitar a ética e os dados obtidos.",
  "O perito oficial avalia questões psicológicas relevantes ao processo, responde aos quesitos e apresenta um laudo que auxilia o juiz. Deve ter conhecimento técnico, investigar os fatos, analisar diferentes hipóteses e manter a imparcialidade. A decisão final é do juiz.",
  "Falta de preparo técnico, conflito de interesses, vínculos que comprometam a imparcialidade e situações legais de impedimento ou suspeição podem impedir a atuação. O perito precisa ter competência e ser imparcial porque suas conclusões podem influenciar decisões judiciais.",
  "Deve reconhecer seus limites, explicar que não possui preparo suficiente e não assumir a avaliação sem condições técnicas. Pode encaminhar a demanda a um profissional qualificado ou buscar capacitação e supervisão adequada antes de realizá-la.",
  "Respeito pelas pessoas: garantir autonomia, participação voluntária e proteção de quem tem autonomia reduzida. Beneficência: maximizar benefícios e minimizar riscos. Justiça: distribuir de forma justa os riscos e benefícios da pesquisa.",
  "É a decisão informada e voluntária de participar da avaliação após receber explicações sobre seus objetivos, procedimentos, riscos e limites do sigilo. Com crianças e adolescentes, o responsável legal fornece a autorização pertinente e o avaliado recebe explicações adequadas à idade e participa por meio do assentimento, conforme as normas.",
  "Devem ser protegidos relatos, dados pessoais, resultados, documentos, registros e materiais dos testes. O compartilhamento pode ocorrer com autorização válida, por obrigação legal ou dever profissional pertinente, ou quando necessário ao cuidado e à proteção de direitos. Compartilhe apenas o indispensável.",
  "Porque um teste mostra apenas uma parte do funcionamento psicológico e pode sofrer influência do contexto, da saúde e do estado emocional. A avaliação deve reunir entrevistas, observações, histórico e instrumentos adequados para chegar a conclusões mais completas e confiáveis."
]);
 const cleanAnswer=s=>String(s||'').replace(/^\s*Resposta[- ]modelo(?:\s*\([^)]*\))?\s*:\s*/i,'').trim();
 function renderItem(q,idx,guideId){
  const hasOptions=Array.isArray(q.options)&&q.options.length>0;
  const opts=hasOptions?'<div class="sd-options" aria-label="Alternativas">'+q.options.map(o=>
   '<div class="sd-option"><span class="sd-option-letter">'+esc(o.letter)+'</span><div>'+fmt(o.text)+'</div></div>'
  ).join('')+'</div>':'';
  const explanation=cleanAnswer(q.explanation);
  const correctOption=hasOptions&&q.answer?q.options.find(o=>String(o.letter).trim().toUpperCase()===String(q.answer).trim().toUpperCase()):null;
  const direct=String(q.directAnswer||((guideId==='official-2026-2-avaliacao-p3')?P3_DIRECT[q.n-1]:'')||(correctOption?String(correctOption.letter)+') '+String(correctOption.text||''):hasOptions?(q.answer?'Alternativa '+q.answer:'Alternativa correta não confirmada'):explanation)||'').trim();
  const extra=(explanation&&explanation!==direct?'<div class="sd-extra-explanation">'+paragraph(explanation)+'</div>':'')+
    (q.contrast?'<div class="sd-contrast">'+paragraph(q.contrast)+'</div>':'')+
    (q.points?.length?'<div class="sd-breakdown"><div class="sd-parts">'+q.points.map(part).join('')+'</div></div>':'');
  const details=extra?'<details class="sd-more"><summary>Ver explicação completa</summary>'+extra+'</details>':'';
  return '<article class="sd-question-block" id="sd-question-'+esc(guideId||'roteiro')+'-'+esc(q.n)+'">'+
    '<div class="sd-question-top"><span class="sd-question-number">'+String(q.n).padStart(2,'0')+'</span><div>'+
    '<span class="sd-question-topic">'+fmt(q.topic||'Questão comentada')+'</span><div class="sd-question-text">'+questionText(q.question)+'</div></div></div>'+
    opts+'<details class="sd-answer-toggle"><summary class="sd-answer-summary"><span class="sd-answer-summary-icon" aria-hidden="true">⌄</span><span class="sd-answer-open-label">Ver resposta</span><span class="sd-answer-close-label">Ocultar resposta</span></summary><div class="sd-answer-content">'+
    '<div class="sd-response sd-direct-answer">'+paragraph(direct)+'</div>'+details+
  '</div></details></article>';
 }

 function renderGuideHtml(subject,guide,doc,generated){
   const exam=TARGETS[subject],items=Array.isArray(guide.questions)?guide.questions:[];
   if(!items.length)return '<div class="sd-empty" data-sd-subject="'+esc(subject)+'">O roteiro ainda não contém questões suficientes para exibição.</div>';
   return '<section class="sd-root" data-sd-subject="'+esc(subject)+'" aria-label="Estudos dirigidos da disciplina">'+
    '<header class="sd-header"><div class="sd-header-top"><span class="sd-kicker">'+(generated?'REVISÃO AUTORAL':'ROTEIRO DO PROFESSOR')+' · '+esc(exam)+'</span>'+seenControl('guided:'+subject+':'+exam)+'</div>'+
    '<h2>Estudos dirigidos</h2><p>'+(generated?
    'Não foi encontrado um estudo dirigido oficial desta avaliação. Este roteiro foi preparado como alternativa de revisão.':
    'Questões do professor com respostas e explicações para estudar.')+'</p></header>'+
    '<details class="sd-guide" open><summary class="sd-guide-summary"><span class="sd-guide-icon" aria-hidden="true">▤</span>'+
    '<span class="sd-guide-label"><strong>'+fmt(guide.title)+'</strong><small>'+fmt(guide.subtitle||'')+'</small></span>'+
    '<span class="sd-count">'+items.length+' questões</span><span class="sd-arrow" aria-hidden="true">⌄</span></summary>'+
    '<div class="sd-guide-body"><div class="sd-source"><strong>'+(generated?'Estudo dirigido autoral':'Enunciados do estudo dirigido do professor')+'</strong>'+
    '<p>'+fmt(guide.source||'')+'</p><p>'+(generated?
      'Revisão gerada a partir dos materiais da disciplina. Não representa um roteiro fornecido pelo professor.':
      'As respostas são de apoio ao estudo, salvo quando houver gabarito oficial.')+'</p></div>'+
    '<div class="sd-q-count">'+items.length+' questões · abra a resposta de cada uma quando quiser</div>'+
    '<div class="sd-items">'+items.map((q,i,all)=>
      (q.section&&(i===0||all[i-1].section!==q.section)?'<div class="sd-topic-divider"><span>'+fmt(q.section)+'</span></div>':'')+
      renderItem(q,i,guide.id)).join('')+'</div>'+openOriginalMarkup(doc)+'</div></details></section>';
 }
 window.PSICO_STUDY_GUIDES={
  progressKey:subject=>Object.prototype.hasOwnProperty.call(TARGETS,subject)?'guided:'+subject+':'+TARGETS[subject]:null,
  hasGuide(subject){
   if(!Object.prototype.hasOwnProperty.call(TARGETS,subject)||semester()!=='2026/2')return false;
   if(subject==='meta'&&(window.PSICO_GUIDES?.meta||[]).some(g=>g.id==='meta-p2-professor'&&g.questions?.length))return true;
   const doc=currentDoc(subject),saved=currentSaved(subject);
   return !!((doc&&saved?.resource_key===doc.resource_key&&saved.guide?.questions?.length)||
    inlineOriginal(subject)?.questions?.length||currentFallback(subject)?.questions?.length);
  }
 };
 window.renderStudyGuide=function(subject){
   if(!Object.prototype.hasOwnProperty.call(TARGETS,subject))return '<div class="sd-empty">Não há estudo dirigido desta disciplina na seleção atual.</div>';

   if(semester()!=='2026/2')return '<div class="sd-empty" data-sd-subject="'+esc(subject)+'">A seleção atual de estudos dirigidos corresponde às avaliações de 2026/2.</div>';
   if(!sourcesReady&&client()){
     void refreshSources();
     return '<div class="sd-empty" data-sd-subject="'+esc(subject)+'">Consultando os estudos dirigidos da avaliação '+TARGETS[subject]+'…</div>';
   }
   const doc=currentDoc(subject),saved=currentSaved(subject);
   // Metapsicologia P2: priorizar o recorte conferido do roteiro original.
   // O bloco de Angústia não integra a seleção solicitada para esta prova.
   if(subject==='meta'){
     const p2=(window.PSICO_GUIDES?.meta||[]).find(g=>g.id==='meta-p2-professor');
     if(p2?.questions?.length){
       const questions=p2.questions.filter(q=>!/^ang[uú]stia$/i.test(String(q.section||'').trim()));
       return renderGuideHtml(subject,{...p2,questions},doc,false);
     }
   }
   if(doc&&saved?.resource_key===doc.resource_key&&saved.guide?.questions?.length)
     return renderGuideHtml(subject,saved.guide,doc,false);
   const embedded=inlineOriginal(subject);
   if(embedded)return renderGuideHtml(subject,embedded,doc,false);
   if(doc)return sourceStatusMarkup(subject,doc);
   const fallback=currentFallback(subject);
   if(fallback){
     const copy={...fallback,
       title:'Estudo dirigido — '+TARGETS[subject]+' (revisão autoral)'};
     return renderGuideHtml(subject,copy,null,true);
   }
   return '<div class="sd-empty" data-sd-subject="'+esc(subject)+'">'+
    (subject==='tcc'||subject==='meta'?
     'O roteiro oficial da avaliação '+TARGETS[subject]+' está temporariamente indisponível. Recarregue a aba para consultar a fonte do professor.':
     'Ainda não há estudo dirigido disponível para a avaliação '+TARGETS[subject]+'.')+'</div>';
 };

})();