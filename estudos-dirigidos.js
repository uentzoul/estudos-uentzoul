/* Apresentação integrada dos estudos dirigidos nas disciplinas do PsicoMoodle. Sem links externos e sem novas chamadas de API. */
(()=>{
 'use strict';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=s=>esc(String(s??'').replace(/\s*\n\s*/g,' ').replace(/\s+/g,' ').trim());
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
 function renderItem(q,idx){
  const hasOptions=Array.isArray(q.options)&&q.options.length>0;
  const opts=hasOptions?'<div class="sd-options" aria-label="Alternativas comentadas">'+q.options.map(o=>
   '<div class="sd-option'+(o.letter===q.answer?' sd-correct':'')+'"><span class="sd-option-letter">'+esc(o.letter)+'</span><div>'+fmt(o.text)+'</div>'+
   (o.letter===q.answer?'<span class="sd-option-tag">Correta</span>':'')+'</div>'
  ).join('')+'</div>':'';
  const answer=hasOptions?'Resposta correta: alternativa '+q.answer:'Resposta-modelo e explicação';
  const details=q.contrast?'<div class="sd-contrast"><strong>'+(hasOptions?'Por que as outras alternativas não servem':'Como organizar a resposta')+'</strong>'+paragraph(q.contrast)+'</div>':'';
  return '<article class="sd-question-block" id="sd-question-'+esc(q.n)+'">'+
    '<div class="sd-question-top"><span class="sd-question-number">'+String(q.n).padStart(2,'0')+'</span><div>'+
    '<span class="sd-question-topic">'+fmt(q.topic||'Questão comentada')+'</span><div class="sd-question-text">'+questionText(q.question)+'</div></div></div>'+
    opts+'<div class="sd-response"><div class="sd-response-title"><span aria-hidden="true">✓</span><strong>'+esc(answer)+'</strong></div>'+paragraph(q.explanation)+'</div>'+
    details+(q.points?.length?'<div class="sd-breakdown"><h4>Explicação parte por parte</h4><div class="sd-parts">'+q.points.map(part).join('')+'</div></div>':'')+
  '</article>';
 }
 window.renderStudyGuide=function(subject){
   const guides=window.PSICO_GUIDES?.[subject]||[];
   if(!guides.length)return '<div class="sd-empty">Ainda não há um estudo dirigido com enunciados suficientes para montar esta área.</div>';
   return '<section class="sd-root" aria-label="Estudos dirigidos da disciplina">'+
    '<header class="sd-header"><span class="sd-kicker">ESTUDO EXPLICADO</span><h2>Estudos dirigidos</h2>'+
    '<p>As perguntas, respostas e explicações estão reunidas aqui, sem abrir outros sites nem trocar de página. Selecione um roteiro para ler o conteúdo inteiro.</p></header>'+
    guides.map((g,i)=>'<details class="sd-guide" '+(i===0?'open':'')+'>'+
      '<summary class="sd-guide-summary"><span class="sd-guide-icon" aria-hidden="true">▤</span><span class="sd-guide-label">'+
      '<strong>'+fmt(g.title)+'</strong><small>'+fmt(g.subtitle)+'</small></span><span class="sd-count">'+g.questions.length+' '+(g.status==='adaptado'?'temas':'questões')+'</span><span class="sd-arrow" aria-hidden="true">⌄</span></summary>'+
      '<div class="sd-guide-body"><div class="sd-source"><strong>'+(g.status==='original'?'Enunciados originais':'Revisão temática adaptada')+'</strong>'+
      '<p>'+fmt(g.source)+'</p><p>'+(g.status==='original'?'As respostas e as análises são explicações de estudo; o gabarito das objetivas foi conferido com o roteiro.':'Não reproduz as perguntas literais do estudo dirigido original: organiza os conteúdos das videoaulas disponíveis.')+'</p></div>'+
      '<div class="sd-q-count">'+g.questions.length+' '+(g.status==='adaptado'?'temas explicados':'questões respondidas e comentadas')+'</div>'+
      '<div class="sd-items">'+g.questions.map((q,idx,all)=> (q.section&&(idx===0||all[idx-1].section!==q.section)?'<div class="sd-topic-divider"><span>'+fmt(q.section)+'</span></div>':'')+renderItem(q,idx)).join('')+'</div></div></details>').join('')+
    '</section>';
 };
})();