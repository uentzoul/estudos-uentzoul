/* PsicoMoodle — tutorial independente e não destrutivo dos flashcards. */
(()=>{
'use strict';
if(window.__pmFlashTourLoaded)return;
window.__pmFlashTourLoaded=true;
const q=s=>document.querySelector(s);
const byId=id=>document.getElementById(id);
const rootSelector='.as-flash-shell[data-active-mode="flash"]';
const defaultSteps=[
 {mode:'grid',find:'.as-head',title:'Como estudar com flashcards',body:'Cada cartão traz uma pergunta na frente e uma resposta atrás. Tente lembrar a resposta antes de virar. Isso exercita a recordação ativa.',tip:'O tutorial é apenas demonstrativo: nenhuma resposta será registrada.'},
 {mode:'grid',find:'.as-flash-meter',title:'Acompanhe seu progresso',body:'O contador e a barra mostram quantos cartões você marcou como “Lembrei”. Eles são atualizados quando você registra uma resposta.',tip:'Seu histórico é mantido por conta e dispositivo, como indicado na própria tela.'},
 {mode:'grid',find:'.as-flash-tile',title:'Escolha um cartão',body:'Toque em qualquer cartão da grade para começar. “Pendente” ainda não foi lembrado, “Revisar” indica que você não lembrou e “Lembrado” indica uma resposta que você marcou como conhecida.',tip:'Mesmo os cartões lembrados podem ser abertos novamente.'},
 {mode:'front',find:'.as-card',title:'Pense antes de revelar',body:'Leia a pergunta e tente responder mentalmente. Depois, toque no cartão ou use “Mostrar resposta”.',tip:'A demonstração mostra o primeiro cartão, sem mudar seu histórico de estudos.'},
 {mode:'back',find:'.as-card',title:'Confira o verso',body:'Agora você vê a resposta. Compare com o que lembrou antes de decidir como avaliar sua tentativa. Toque no cartão para voltar à pergunta.'},
 {mode:'back',find:'[data-active-action="hit"]',title:'Lembrei',body:'Use “Lembrei” quando conseguir recuperar o conteúdo. O site registra o acerto e agenda revisões espaçadas em intervalos crescentes.',tip:'No tutorial, não vamos clicar neste botão nem somar pontos.'},
 {mode:'back',find:'[data-active-action="miss"]',title:'Não lembrei',body:'Use “Não lembrei” quando não souber ou confundir a resposta. O cartão passa a precisar de revisão, e o sistema registra essa dificuldade.',tip:'Esse botão também não será acionado durante a demonstração.'},
 {mode:'back',find:'[data-active-action="skip"]',title:'Pular',body:'“Pular” avança sem marcar o cartão como lembrado ou errado. É útil quando você quer deixar um assunto para depois.'},
 {mode:'front',find:'.as-flash-nav-bottom',title:'Navegue entre os cartões',body:'Use “Anterior” e “Próximo” para percorrer os cartões. Essas setas, por si só, não registram acertos nem erros.'},
 {mode:'front',find:'[data-active-action="grid"]',title:'Volte para a lista quando quiser',body:'“Todos os flashcards” retorna à grade, onde você pode escolher outro cartão e conferir o progresso. Pronto: agora você pode estudar normalmente.',tip:'Você pode reabrir este tutorial pelo botão no alto da área de Flashcards.'}
];
let open=false,step=0,subject=null,original=null,lastFocus=null,overlay=null,dialog=null,ring=null,hasCards=true,runId=0,raf=0;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function activeRoot(){const r=q(rootSelector);return r&&r.isConnected?r:null;}
function liveSteps(){return hasCards?defaultSteps:[{mode:'grid',find:'.as-head',title:'Como funcionam os flashcards',body:'O flashcard apresenta uma pergunta e, ao virar, uma resposta. Quando houver cartões nesta disciplina, você poderá abrir um cartão, revelar a resposta e escolher “Lembrei”, “Não lembrei” ou “Pular”.',tip:'Esta disciplina ainda não tem cartões para demonstrar. O tutorial não altera dados.'}];}
function build(){
 if(overlay)return;
 overlay=document.createElement('div');
 overlay.id='pmFlashTour';
 overlay.className='pm-flashtour';
 overlay.hidden=true;
 overlay.innerHTML='<div class="pm-flashtour-ring" aria-hidden="true"></div>'+
  '<div class="pm-flashtour-shield" aria-hidden="true"></div>'+
  '<section class="pm-flashtour-dialog" role="dialog" aria-modal="true" aria-labelledby="pmFlashTourTitle" tabindex="-1">'+
   '<div class="pm-flashtour-head"><span>TUTORIAL · FLASHCARDS</span><button type="button" data-flashtour="close" aria-label="Fechar tutorial">×</button></div>'+
   '<h2 id="pmFlashTourTitle"></h2><p class="pm-flashtour-body"></p><p class="pm-flashtour-tip"></p>'+
   '<div class="pm-flashtour-track"><i></i></div>'+
   '<div class="pm-flashtour-controls"><button type="button" data-flashtour="close" class="pm-flashtour-exit">Sair</button>'+
    '<span class="pm-flashtour-count" aria-live="polite"></span>'+
    '<button type="button" data-flashtour="back" class="pm-flashtour-back">Voltar</button>'+
    '<button type="button" data-flashtour="next" class="pm-flashtour-next">Próximo →</button></div>'+
  '</section>';
 document.body.appendChild(overlay);
 dialog=overlay.querySelector('.pm-flashtour-dialog');
 ring=overlay.querySelector('.pm-flashtour-ring');
}
function setDemo(s){
 if(!open||!subject)return false;
 const index=s.mode==='grid'?-1:0;
 return window.PSICO_PRACTICE?.flashTutorialShow?.(subject,index,s.mode==='back')===true;
}
function target(step){
 const root=activeRoot();
 if(!root)return null;
 return root.querySelector(step.find)||root.querySelector('.as-head')||root;
}
function position(node,shouldScroll){
 if(!open||!overlay||overlay.hidden||!node)return;
 const vw=window.innerWidth,vh=window.innerHeight,mobile=vw<=760;
 const rect=node.getBoundingClientRect();
 if(shouldScroll){
  const usableBottom=mobile?(vh-Math.min(380,Math.max(230,dialog.getBoundingClientRect().height))-32):vh-25;
  const desired=mobile?clamp((usableBottom-rect.height)/2,88,Math.max(90,usableBottom-rect.height-6)):Math.max(15,(vh-rect.height)/2);
  if(rect.top<60||rect.bottom>usableBottom){
   const limit=Math.max(0,document.documentElement.scrollHeight-vh);
   const y=clamp(window.scrollY+rect.top-desired,0,limit);
   window.scrollTo({top:y,behavior:'instant'});
   requestAnimationFrame(()=>position(node,false));
   return;
  }
 }
 const r=node.getBoundingClientRect();
 const left=clamp(r.left-6,5,vw-27);
 const right=clamp(r.right+6,left+18,vw-5);
 const top=clamp(r.top-6,5,vh-27);
 const bottom=clamp(r.bottom+6,top+18,vh-5);
 ring.style.left=left+'px';ring.style.top=top+'px';ring.style.width=(right-left)+'px';ring.style.height=(bottom-top)+'px';
 if(mobile){dialog.style.left='12px';dialog.style.right='12px';dialog.style.top='auto';dialog.style.bottom='max(12px, env(safe-area-inset-bottom))';return;}
 const bounds=dialog.getBoundingClientRect(),w=bounds.width,h=bounds.height,gap=18;
 let x,y;
 if(vw-right>=w+gap+12){x=right+gap;y=clamp(top,12,vh-h-12)}
 else if(left>=w+gap+12){x=left-w-gap;y=clamp(top,12,vh-h-12)}
 else if(vh-bottom>=h+gap+12){x=clamp(left,12,vw-w-12);y=bottom+gap}
 else if(top>=h+gap+12){x=clamp(left,12,vw-w-12);y=top-h-gap}
 else{x=clamp((vw-w)/2,12,vw-w-12);y=clamp(bottom+gap,12,vh-h-12)}
 dialog.style.left=Math.round(x)+'px';dialog.style.right='auto';dialog.style.top=Math.round(y)+'px';dialog.style.bottom='auto';
}
function show(i){
 if(!open)return;
 const steps=liveSteps();
 step=clamp(i,0,steps.length-1);
 const seq=++runId,s=steps[step];
 if(!activeRoot()){finish(false);return}
 setDemo(s);
 dialog.querySelector('h2').textContent=s.title;
 dialog.querySelector('.pm-flashtour-body').textContent=s.body;
 const tip=dialog.querySelector('.pm-flashtour-tip');
 tip.textContent=s.tip||'';tip.hidden=!s.tip;
 dialog.querySelector('.pm-flashtour-count').textContent=(step+1)+' / '+steps.length;
 dialog.querySelector('.pm-flashtour-track i').style.width=((step+1)*100/steps.length)+'%';
 dialog.querySelector('.pm-flashtour-back').disabled=step===0;
 dialog.querySelector('.pm-flashtour-next').textContent=step===steps.length-1?'Concluir ✓':'Próximo →';
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
  if(!open||seq!==runId)return;
  position(target(s),true);
  dialog.querySelector('.pm-flashtour-next').focus({preventScroll:true});
 }));
}
function start(){
 if(open||document.documentElement.classList.contains('pm-tour-running'))return;
 const root=activeRoot(),id=root?.dataset.activeId;
 if(!id)return;
 const state=window.PSICO_PRACTICE?.flashTutorialState?.(id);
 if(!state)return;
 build();
 lastFocus=document.activeElement;
 subject=id;original=state;hasCards=state.count>0;
 open=true;
 overlay.hidden=false;
 document.documentElement.classList.add('pm-flash-tour-running');
 show(0);
}
function finish(restore=true){
 if(!open)return;
 open=false;++runId;
 overlay.hidden=true;
 document.documentElement.classList.remove('pm-flash-tour-running');
 if(restore&&subject&&activeRoot()?.dataset.activeId===subject&&original){
  window.PSICO_PRACTICE?.flashTutorialShow?.(subject,original.cardIndex,original.flipped);
 }
 subject=null;original=null;
 const focus=lastFocus?.isConnected?lastFocus:q('[data-flash-tour="start"]');
 focus?.focus?.({preventScroll:true});
 lastFocus=null;
}
function onClick(e){
 const startBtn=e.target.closest?.('[data-flash-tour="start"]');
 if(startBtn){e.preventDefault();e.stopPropagation();start();return}
 if(!open)return;
 const command=e.target.closest?.('[data-flashtour]')?.dataset.flashtour;
 if(!command)return;
 e.preventDefault();e.stopImmediatePropagation();
 if(command==='next')step===liveSteps().length-1?finish():show(step+1);
 else if(command==='back')show(step-1);
 else finish();
}
function stopOutside(e){
 if(!open||!e.isTrusted)return;
 if(e.target.closest?.('.pm-flashtour-dialog'))return;
 if(e.cancelable)e.preventDefault();
 e.stopImmediatePropagation();
}
function keydown(e){
 if(!open)return;
 if(e.key==='Escape'){e.preventDefault();finish();return}
 if(e.key==='ArrowRight'){e.preventDefault();show(Math.min(step+1,liveSteps().length-1));return}
 if(e.key==='ArrowLeft'){e.preventDefault();show(Math.max(0,step-1));return}
 if(e.key!=='Tab')return;
 const btns=[...dialog.querySelectorAll('button:not(:disabled)')];
 const first=btns[0],last=btns[btns.length-1];
 if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
 if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
}
function blockScroll(e){
 if(!open||e.target.closest?.('.pm-flashtour-dialog'))return;
 if(e.cancelable)e.preventDefault();
}
function refresh(){
 if(raf)return;
 raf=requestAnimationFrame(()=>{
  raf=0;
  if(!open)return;
  if(!activeRoot()||activeRoot().dataset.activeId!==subject){finish(false);return}
  position(target(liveSteps()[step]),false);
 });
}
function init(){
 build();
 document.addEventListener('click',onClick,true);
 for(const type of ['pointerdown','pointerup','mousedown','mouseup','touchstart','touchend','click','dblclick','contextmenu']){
  document.addEventListener(type,stopOutside,{capture:true,passive:false});
 }
 document.addEventListener('keydown',keydown,true);
 document.addEventListener('wheel',blockScroll,{capture:true,passive:false});
 document.addEventListener('touchmove',blockScroll,{capture:true,passive:false});
 document.addEventListener('focusin',e=>{if(open&&!dialog.contains(e.target))dialog.querySelector('.pm-flashtour-next')?.focus({preventScroll:true})},true);
 const main=byId('main');
 if(main)new MutationObserver(refresh).observe(main,{childList:true,subtree:true});
 window.addEventListener('resize',refresh,{passive:true});
 window.addEventListener('scroll',refresh,{passive:true});
 window.addEventListener('popstate',()=>{if(open)finish(false)});
 window.pmStartFlashcardsTour=start;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();