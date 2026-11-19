/* Trilhas tradicionais retiradas do Estudos Uentzoul.
 * A única trilha preservada é a página de vídeos de Metapsicologia.
 * API mantida para não quebrar chamadas antigas do site. */
(()=>{
'use strict';
const VIDEO_PAGE='metapsicologia-p2.html';
window.PSICO_STUDY_TRAILS={
 plans:{},
 integrated:false,
 render(ctx){
  if(ctx?.subject==='meta'){
   return '<section class="meta-video-only">'+
    '<h2>Trilha de Vídeos — Metapsicologia</h2>'+
    '<p>Aulas gravadas organizadas por temas, capítulos e minutagens.</p>'+
    '<a class="meta-video-only-open" href="'+VIDEO_PAGE+'">Abrir trilha de vídeos →</a>'+
    '</section>';
  }
  return '<section class="study-trail-retired"><p>As trilhas de estudos foram retiradas desta disciplina. Os materiais, estudos dirigidos, flashcards e simulados continuam disponíveis nas respectivas áreas.</p>'+
    '<button type="button" data-action="subjectArea:home">Voltar às opções</button></section>';
 }
};
const TARGET='[data-action="subjectArea:trail"]';
function adjust(root){
 if(!root||root.nodeType!==1&&root.nodeType!==9)return;
 const buttons=[];
 if(root.nodeType===1&&root.matches?.(TARGET))buttons.push(root);
 root.querySelectorAll?.(TARGET).forEach(btn=>buttons.push(btn));
 for(const btn of buttons){
  const hub=btn.closest('.subject-hub');
  const heading=hub?.querySelector('.subject-hub-heading h1, .subject-hub-hero h1, h1');
  if(!/^metapsicologia\b/i.test((heading?.textContent||'').trim()))continue;
  btn.classList.add('video-trail-link');
  btn.setAttribute('data-video-trail-entry','true');
  const title=btn.querySelector('.subject-hub-card-title, strong');
  if(title&&title.textContent!=='Trilha de Vídeos')title.textContent='Trilha de Vídeos';
  const description=btn.querySelector('.subject-hub-card-desc');
  if(description&&description.textContent!=='Aulas gravadas por capítulos e minutagens')description.textContent='Aulas gravadas por capítulos e minutagens';
 }
}
document.addEventListener('click',event=>{
 const btn=event.target.closest?.('[data-video-trail-entry="true"]');
 if(!btn)return;
 event.preventDefault();
 event.stopImmediatePropagation();
 window.location.assign(VIDEO_PAGE);
},true);
function start(){
 adjust(document);
 const observer=new MutationObserver(records=>{
  for(const record of records){
   for(const node of record.addedNodes){
    if(node.nodeType===1)adjust(node);
   }
  }
 });
 observer.observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
else start();
})();
