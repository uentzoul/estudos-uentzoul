/* Apresentação integrada dos estudos dirigidos nas disciplinas do PsicoMoodle. Sem links externos e sem novas chamadas de API. */
(()=>{
 'use strict';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=s=>esc(String(s??'').replace(/\s*\n\s*/g,' ').replace(/\s+/g,' ').trim());


 const OFFICIAL_TAG='psicomoodle:estudo-dirigido:professor';
 const UPLOAD_TABLE='uentzoul_library_uploads',GUIDES_TABLE='uentzoul_study_guides';
 const TARGETS=Object.freeze({familia:'P2',tcc:'P2',meta:'P2',grupos:'P2',social:'P3',avaliacao:'P3'});
 const FALLBACK_IDS=Object.freeze({
   familia:['final-2026-2-familia'],tcc:['final-2026-2-tcc'],
   meta:['final-2026-2-meta'],grupos:['final-2026-2-grupos'],
   social:['final-2026-2-social','social-novos-textos-2026'],
   avaliacao:['final-2026-2-avaliacao']
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
 function sourceStatusMarkup(subject,doc){
   const exam=TARGETS[subject],error=preparation.errors[subject];
   const running=preparation.running===subject;
   const title=doc?.display_title||doc?.filename||'Roteiro do professor';
   if(!doc)return '<div class="sd-empty" data-sd-subject="'+esc(subject)+'">Ainda não há estudo dirigido disponível para '+esc(exam)+'.</div>';
   if(isAdmin()&&!running)setTimeout(()=>{void prepareGuide(subject)},900);
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
     if(subj&&node.isConnected){const markup=window.renderStudyGuide(subj);if(node.outerHTML!==markup)node.outerHTML=markup;}
   });
 }
 async function refreshSources(force=false){
   const c=client(),user=window.uentzoulAIAuth?.user?.();
   if(!c||!user||sourcesLoading||(!force&&Date.now()-lastSourcesAt<30000))return;
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
     if(changed)refreshVisibleGuides();
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
   finally{preparation.running=null;refreshVisibleGuides();}
 }
 document.addEventListener('click',async event=>{
   const start=event.target.closest('[data-sd-prepare]');
   if(start){event.preventDefault();void prepareGuide(start.dataset.sdPrepare,true);return;}
   const link=event.target.closest('[data-sd-official]');
   if(!link)return;
   event.preventDefault();
   const c=client(),user=window.uentzoulAIAuth?.user?.();
   if(!c||!user){alert('Entre na conta para consultar o documento do professor.');window.uentzoulAIAuth?.openLogin?.();return;}
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
   if(isAdmin())document.querySelectorAll('[data-sd-subject]').forEach(node=>{
     const subject=node.getAttribute('data-sd-subject');
     if(subject&&TARGETS[subject])void prepareGuide(subject);
   });
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
 function renderItem(q,idx,guideId){
  const hasOptions=Array.isArray(q.options)&&q.options.length>0;
  const opts=hasOptions?'<div class="sd-options" aria-label="Alternativas comentadas">'+q.options.map(o=>
   '<div class="sd-option'+(o.letter===q.answer?' sd-correct':'')+'"><span class="sd-option-letter">'+esc(o.letter)+'</span><div>'+fmt(o.text)+'</div>'+
   (o.letter===q.answer?'<span class="sd-option-tag">Correta</span>':'')+'</div>'
  ).join('')+'</div>':'';
  const answer=hasOptions?(q.answer?'Resposta-modelo: alternativa '+q.answer:'Alternativa correta não confirmada'):'Resposta-modelo e explicação';
  const details=q.contrast?'<div class="sd-contrast"><strong>'+(hasOptions?'Por que as outras alternativas não servem':'Como organizar a resposta')+'</strong>'+paragraph(q.contrast)+'</div>':'';
  return '<article class="sd-question-block" id="sd-question-'+esc(guideId||'roteiro')+'-'+esc(q.n)+'">'+
    '<div class="sd-question-top"><span class="sd-question-number">'+String(q.n).padStart(2,'0')+'</span><div>'+
    '<span class="sd-question-topic">'+fmt(q.topic||'Questão comentada')+'</span><div class="sd-question-text">'+questionText(q.question)+'</div></div></div>'+
    opts+'<div class="sd-response"><div class="sd-response-title"><span aria-hidden="true">✓</span><strong>'+esc(answer)+'</strong></div>'+paragraph(q.explanation)+'</div>'+
    details+(q.points?.length?'<div class="sd-breakdown"><h4>Explicação parte por parte</h4><div class="sd-parts">'+q.points.map(part).join('')+'</div></div>':'')+
  '</article>';
 }

 function renderGuideHtml(subject,guide,doc,generated){
   const exam=TARGETS[subject],items=Array.isArray(guide.questions)?guide.questions:[];
   if(!items.length)return '<div class="sd-empty" data-sd-subject="'+esc(subject)+'">O roteiro ainda não contém questões suficientes para exibição.</div>';
   return '<section class="sd-root" data-sd-subject="'+esc(subject)+'" aria-label="Estudos dirigidos da disciplina">'+
    '<header class="sd-header"><span class="sd-kicker">'+(generated?'REVISÃO AUTORAL':'ROTEIRO DO PROFESSOR')+' · '+esc(exam)+'</span>'+
    '<h2>Estudos dirigidos</h2><p>'+(generated?
    'Não foi encontrado um estudo dirigido oficial desta avaliação. Este roteiro foi preparado como alternativa de revisão.':
    'Questões do roteiro do professor, com respostas-modelo comentadas para consulta e estudo.')+'</p></header>'+
    '<details class="sd-guide" open><summary class="sd-guide-summary"><span class="sd-guide-icon" aria-hidden="true">▤</span>'+
    '<span class="sd-guide-label"><strong>'+fmt(guide.title)+'</strong><small>'+fmt(guide.subtitle||'')+'</small></span>'+
    '<span class="sd-count">'+items.length+' questões</span><span class="sd-arrow" aria-hidden="true">⌄</span></summary>'+
    '<div class="sd-guide-body"><div class="sd-source"><strong>'+(generated?'Estudo dirigido autoral':'Enunciados do estudo dirigido do professor')+'</strong>'+
    '<p>'+fmt(guide.source||'')+'</p><p>'+(generated?
      'Revisão gerada a partir dos materiais da disciplina. Não representa um roteiro fornecido pelo professor.':
      'As explicações e respostas-modelo são materiais de estudo; só o gabarito explicitamente fornecido pelo professor é oficial.')+'</p></div>'+
    '<div class="sd-q-count">'+items.length+' questões respondidas e comentadas</div>'+
    '<div class="sd-items">'+items.map((q,i,all)=>
      (q.section&&(i===0||all[i-1].section!==q.section)?'<div class="sd-topic-divider"><span>'+fmt(q.section)+'</span></div>':'')+
      renderItem(q,i,guide.id)).join('')+'</div>'+openOriginalMarkup(doc)+'</div></details></section>';
 }
 window.renderStudyGuide=function(subject){
   if(!Object.prototype.hasOwnProperty.call(TARGETS,subject))return '<div class="sd-empty">Não há estudo dirigido desta disciplina na seleção atual.</div>';
   if(!window.uentzoulAIAuth?.user?.())return '<div class="sd-empty" data-sd-subject="'+esc(subject)+'">Entre na sua conta para consultar os estudos dirigidos.</div>';
   if(semester()!=='2026/2')return '<div class="sd-empty" data-sd-subject="'+esc(subject)+'">A seleção atual de estudos dirigidos corresponde às avaliações de 2026/2.</div>';
   if(!sourcesReady&&client()){
     void refreshSources();
     return '<div class="sd-empty" data-sd-subject="'+esc(subject)+'">Consultando os estudos dirigidos da avaliação '+TARGETS[subject]+'…</div>';
   }
   const doc=currentDoc(subject),saved=currentSaved(subject);
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
   return '<div class="sd-empty" data-sd-subject="'+esc(subject)+'">Ainda não há estudo dirigido disponível para a avaliação '+TARGETS[subject]+'.</div>';
 };

})();