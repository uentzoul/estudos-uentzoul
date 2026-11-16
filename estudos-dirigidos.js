/* Apresentação integrada dos estudos dirigidos nas disciplinas do PsicoMoodle. Sem links externos e sem novas chamadas de API. */
(()=>{
 'use strict';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=s=>esc(String(s??'').replace(/\s*\n\s*/g,' ').replace(/\s+/g,' ').trim());

 const OFFICIAL_TAG='psicomoodle:estudo-dirigido:professor',UPLOAD_TABLE='uentzoul_library_uploads';
 let officialRows=[],officialReady=false,officialLoading=false,lastOfficialCheck=0;
 const semester=()=>window.uentzoulLibraryApp?.semester?.()||'2026/2';
 function officialSubject(row){
   const subj=String(row.file_subject||'');
   if(semester()==='2026/1')return subj.startsWith('2026/1::')?subj.slice(8):'';
   return subj.startsWith('2026/1::')?'':subj;
 }
 function officialExam(row){
   const token=(row.content_tags||[]).find(t=>/^psicomoodle:prova:/i.test(t));
   return token?token.split(':').pop():'';
 }
 function officialFormat(doc){
   return String(doc.filename||'').toLowerCase().match(/\.(pdf|docx|pptx)$/)?.[1]?.toUpperCase()||'Arquivo';
 }
 function renderOfficial(subject,documents){
   return '<section class="sd-root" data-sd-subject="'+esc(subject)+'" aria-label="Estudos dirigidos da disciplina">'+
     '<header class="sd-header"><span class="sd-kicker">ROTEIRO DO PROFESSOR</span><h2>Estudos dirigidos</h2>'+
     '<p>Os documentos oficiais do professor têm prioridade. Abra o roteiro original para consultar as questões da prova.</p></header>'+
     documents.map((doc,i)=>'<details class="sd-guide" '+(i===0?'open':'')+'>'+
       '<summary class="sd-guide-summary"><span class="sd-guide-icon" aria-hidden="true">▤</span><span class="sd-guide-label">'+
       '<strong>'+fmt(doc.display_title||doc.filename||'Estudo dirigido')+'</strong>'+
       '<small>Material oficial do professor'+(officialExam(doc)?' · '+fmt(officialExam(doc)):'')+'</small></span>'+
       '<span class="sd-count">'+officialFormat(doc)+' oficial</span><span class="sd-arrow" aria-hidden="true">⌄</span></summary>'+
       '<div class="sd-guide-body"><div class="sd-source"><strong>Estudo dirigido original do professor</strong>'+
       '<p>O documento é preservado na íntegra. Os roteiros produzidos por IA não substituem este material.</p></div>'+
       '<a class="sd-official-action" href="#" data-sd-official="'+esc(doc.resource_key)+'">Abrir estudo dirigido ('+officialFormat(doc)+') ↗</a>'+
       '</div></details>').join('')+'</section>';
 }
 function refreshVisibleGuides(){
   document.querySelectorAll('[data-sd-subject]').forEach(node=>{
     const subj=node.getAttribute('data-sd-subject');
     if(subj&&node.isConnected)node.outerHTML=window.renderStudyGuide(subj);
   });
 }
 async function refreshOfficialGuides(force=false){
   const client=window.uentzoulAIAuth?.client?.();
   if(!client||officialLoading||(!force&&Date.now()-lastOfficialCheck<30000))return;
   officialLoading=true;lastOfficialCheck=Date.now();
   try{
     const {data,error}=await client.from(UPLOAD_TABLE)
       .select('resource_key,display_title,filename,file_subject,storage_path,content_tags,publish_at,library_public')
       .contains('content_tags',[OFFICIAL_TAG]).limit(500);
     if(error)throw error;
     const current=Date.now();
     const next=(data||[]).filter(d=>d.library_public===true&&typeof d.storage_path==='string'&&d.storage_path.startsWith('materials/'))
       .sort((a,b)=>String(a.display_title||a.filename||'').localeCompare(String(b.display_title||b.filename||''),'pt-BR'));
     const changed=!officialReady||JSON.stringify(officialRows)!==JSON.stringify(next);
     officialRows=next;officialReady=true;
     if(changed)refreshVisibleGuides();
   }catch(err){
     console.warn('Não foi possível consultar os roteiros oficiais:',err);
     if(!officialReady){officialReady=true;refreshVisibleGuides();}
   }finally{officialLoading=false;}
 }

 // Abre um link temporário do Storage privado, mesmo quando o restante do material
 // permanece fora do escopo das provas até a data programada de liberação.
 document.addEventListener('click',async event=>{
   const link=event.target.closest('[data-sd-official]');
   if(!link)return;
   event.preventDefault();
   const client=window.uentzoulAIAuth?.client?.(),user=window.uentzoulAIAuth?.user?.();
   if(!client||!user){alert('Entre na conta para consultar o estudo dirigido.');window.uentzoulAIAuth?.openLogin?.();return;}
   const row=officialRows.find(d=>d.resource_key===link.dataset.sdOfficial);
   if(!row?.storage_path){alert('O documento não está disponível. Atualize a página e tente novamente.');return;}
   const tab=window.open('','_blank');
   if(tab){try{tab.document.title='Abrindo estudo dirigido…';tab.document.body.textContent='Carregando documento…';}catch(_){}}
   try{
     const {data,error}=await client.storage.from('uentzoul-library-files').createSignedUrl(row.storage_path,3600);
     if(error||!data?.signedUrl)throw error||Error('Link temporário indisponível.');
     if(tab&&!tab.closed)tab.location.replace(data.signedUrl);else window.location.assign(data.signedUrl);
   }catch(err){if(tab&&!tab.closed)tab.close();alert('Não foi possível abrir o estudo dirigido: '+(err?.message||'tente novamente'));}
 });
 window.addEventListener('uentzoul:library-updated',()=>{void refreshOfficialGuides(true);});
 window.addEventListener('uentzoul:auth',()=>{officialReady=false;lastOfficialCheck=0;void refreshOfficialGuides(true);});
 window.addEventListener('focus',()=>{void refreshOfficialGuides();});
 setInterval(()=>{if(!document.hidden)void refreshOfficialGuides();},45000);
 setTimeout(()=>{void refreshOfficialGuides(true);},1000);
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
 function renderItem(q,idx,guideId){
  const hasOptions=Array.isArray(q.options)&&q.options.length>0;
  const opts=hasOptions?'<div class="sd-options" aria-label="Alternativas comentadas">'+q.options.map(o=>
   '<div class="sd-option'+(o.letter===q.answer?' sd-correct':'')+'"><span class="sd-option-letter">'+esc(o.letter)+'</span><div>'+fmt(o.text)+'</div>'+
   (o.letter===q.answer?'<span class="sd-option-tag">Correta</span>':'')+'</div>'
  ).join('')+'</div>':'';
  const answer=hasOptions?'Resposta correta: alternativa '+q.answer:'Resposta-modelo e explicação';
  const details=q.contrast?'<div class="sd-contrast"><strong>'+(hasOptions?'Por que as outras alternativas não servem':'Como organizar a resposta')+'</strong>'+paragraph(q.contrast)+'</div>':'';
  return '<article class="sd-question-block" id="sd-question-'+esc(guideId||'roteiro')+'-'+esc(q.n)+'">'+
    '<div class="sd-question-top"><span class="sd-question-number">'+String(q.n).padStart(2,'0')+'</span><div>'+
    '<span class="sd-question-topic">'+fmt(q.topic||'Questão comentada')+'</span><div class="sd-question-text">'+questionText(q.question)+'</div></div></div>'+
    opts+'<div class="sd-response"><div class="sd-response-title"><span aria-hidden="true">✓</span><strong>'+esc(answer)+'</strong></div>'+paragraph(q.explanation)+'</div>'+
    details+(q.points?.length?'<div class="sd-breakdown"><h4>Explicação parte por parte</h4><div class="sd-parts">'+q.points.map(part).join('')+'</div></div>':'')+
  '</article>';
 }
 window.renderStudyGuide=function(subject){
   if(!officialReady&&window.uentzoulAIAuth?.client?.()){
    void refreshOfficialGuides();
    return '<div class="sd-empty" data-sd-subject="'+esc(subject)+'">Consultando estudos dirigidos oficiais do professor…</div>';
   }
   const official=officialRows.filter(d=>officialSubject(d)===subject);
   if(official.length)return renderOfficial(subject,official);
   const allGuides=window.PSICO_GUIDES?.[subject]||[];
   // Em 2026/2, mostre somente os roteiros relacionados à revisão atual.
   // A fonte dos estudos dirigidos anteriores permanece preservada no repositório.
   const liveGuideIds={
    tcc:new Set(['final-2026-2-tcc','tcc-novos-textos-2026']),
    familia:new Set(['final-2026-2-familia']),
    meta:new Set(['final-2026-2-meta','meta-p2-professor','meta-revisao']),
    grupos:new Set(['final-2026-2-grupos']),
    social:new Set(['social-novos-textos-2026']),
    avaliacao:new Set(['final-2026-2-avaliacao','avaliacao-p2'])
   };
   const onlyCurrent=window.PSICO_FINAL_EXAMS?.version&&liveGuideIds[subject];
   const available=onlyCurrent?allGuides.filter(g=>liveGuideIds[subject].has(g.id)):allGuides;
   const originals=available.filter(g=>g.status==='original');
   const guides=originals.length?originals:available;
   if(!guides.length)return '<div class="sd-empty" data-sd-subject="'+esc(subject)+'">Ainda não há um estudo dirigido com enunciados suficientes para montar esta área.</div>';
   return '<section class="sd-root" data-sd-subject="'+esc(subject)+'" aria-label="Estudos dirigidos da disciplina">'+
    '<header class="sd-header"><span class="sd-kicker">ESTUDO EXPLICADO</span><h2>Estudos dirigidos</h2>'+
    '<p>Encontre perguntas, respostas comentadas e explicações em um só lugar. Selecione um roteiro para consultar o conteúdo completo.</p></header>'+
    guides.map((g,i)=>'<details class="sd-guide" '+(i===0?'open':'')+'>'+
      '<summary class="sd-guide-summary"><span class="sd-guide-icon" aria-hidden="true">▤</span><span class="sd-guide-label">'+
      '<strong>'+fmt(g.title)+'</strong><small>'+fmt(g.subtitle)+'</small></span><span class="sd-count">'+g.questions.length+' '+(g.status==='adaptado'?'temas':'questões')+'</span><span class="sd-arrow" aria-hidden="true">⌄</span></summary>'+
      '<div class="sd-guide-body"><div class="sd-source"><strong>'+(g.status==='original'?'Enunciados originais':'Revisão temática adaptada')+'</strong>'+
      '<p>'+fmt(g.source)+'</p><p>'+(g.status==='original'?'As respostas e as análises são explicações de estudo; o gabarito das objetivas foi conferido com o roteiro.':'Não reproduz as perguntas literais do estudo dirigido original: organiza os conteúdos dos materiais e das aulas cadastrados na disciplina.')+'</p></div>'+
      '<div class="sd-q-count">'+g.questions.length+' '+(g.status==='adaptado'?'temas explicados':'questões respondidas e comentadas')+'</div>'+
      '<div class="sd-items">'+g.questions.map((q,idx,all)=> (q.section&&(idx===0||all[idx-1].section!==q.section)?'<div class="sd-topic-divider"><span>'+fmt(q.section)+'</span></div>':'')+renderItem(q,idx,g.id)).join('')+'</div></div></details>').join('')+
    '</section>';
 };
})();