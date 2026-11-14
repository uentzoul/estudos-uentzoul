/* PsicoMoodle — gaveta de navegação no celular, preservando o desktop. */
(()=>{
 'use strict';
 if(window.__pmMobileDrawerInstalled)return;
 function setup(){
  if(window.__pmMobileDrawerInstalled)return;
  const app=document.querySelector('.app');
  const side=document.getElementById('siteSidebar');
  const brand=side?.querySelector(':scope > .mobile-brand');
  if(!app||!side||!brand)return;
  window.__pmMobileDrawerInstalled=true;

  const header=document.createElement('header');
  header.id='pmMobileTopbar';
  header.className='pm-mobile-topbar';
  header.setAttribute('aria-label','Cabeçalho do PsicoMoodle');
  const toggle=document.createElement('button');
  toggle.type='button';
  toggle.id='pmMobileMenuToggle';
  toggle.className='pm-mobile-menu-toggle';
  toggle.setAttribute('aria-controls','siteSidebar');
  toggle.setAttribute('aria-expanded','false');
  toggle.setAttribute('aria-label','Abrir menu de navegação');
  toggle.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
  // Uma só linha: ☰ + identidade + tema + perfil.
  brand.insertBefore(toggle,brand.firstElementChild);
  header.appendChild(brand);

  const backdrop=document.createElement('div');
  backdrop.id='pmMobileBackdrop';
  backdrop.className='pm-mobile-backdrop';
  backdrop.setAttribute('aria-hidden','true');

  const drawerHead=document.createElement('div');
  drawerHead.className='pm-mobile-drawer-head';
  const drawerTitle=document.createElement('span');
  drawerTitle.textContent='Navegação';
  const closeButton=document.createElement('button');
  closeButton.type='button';
  closeButton.className='pm-mobile-drawer-close';
  closeButton.setAttribute('aria-label','Fechar menu de navegação');
  closeButton.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 5l14 14M19 5 5 19"/></svg>';
  drawerHead.append(drawerTitle,closeButton);
  side.insertBefore(drawerHead,side.firstChild);

  app.insertBefore(header,side);
  app.insertBefore(backdrop,side);

  const media=window.matchMedia('(max-width:760px)');
  let opened=false,settleTimer=0,settleFrame=0;
  function clearSettle(){
   clearTimeout(settleTimer);
   if(settleFrame)cancelAnimationFrame(settleFrame);
   settleFrame=0;settleTimer=0;
   document.body.classList.remove('pm-mobile-menu-settling');
   document.body.style.removeProperty('--pm-drawer-offset');
   document.body.style.removeProperty('--pm-drawer-opacity');
  }
  function setOpen(value,restoreFocus=false,focusClose=true){
   opened=Boolean(value&&media.matches);
   document.body.classList.toggle('pm-mobile-menu-open',opened);
   toggle.setAttribute('aria-expanded',String(opened));
   toggle.setAttribute('aria-label',opened?'Fechar menu de navegação':'Abrir menu de navegação');
   side.setAttribute('aria-label',media.matches?'Navegação do PsicoMoodle':'Navegação principal');
   if(media.matches){
    side.inert=!opened;
    side.setAttribute('aria-hidden',String(!opened));
   }else{
    side.inert=false;
    side.removeAttribute('aria-hidden');
   }
   if(opened&&focusClose)closeButton.focus({preventScroll:true});
   else if(!opened&&restoreFocus&&media.matches)toggle.focus({preventScroll:true});
  }
  // API do tutorial: abre e fecha sem deslocar o foco do balão explicativo.
  window.pmMobileDrawer={
   open:()=>setOpen(true,false,false),
   close:()=>setOpen(false,false,false),
   isOpen:()=>opened,
   scrollToTop:()=>{side.scrollTop=0;}
  };
  toggle.addEventListener('click',()=>setOpen(!opened,true));
  closeButton.addEventListener('click',()=>setOpen(false,true));
  backdrop.addEventListener('click',()=>setOpen(false,true));

  // Gaveta acompanha o dedo em qualquer região da tela. Só um arraste
  // horizontal deliberado aciona o menu; rolamentos verticais seguem nativos.
  const START_SLOP=9,FINISH_RATIO=.48,FLICK_VELOCITY=.48;
  let gesture=null;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  function horizontalScroller(target){
   for(let el=target;el&&el!==document.body;el=el.parentElement){
    if(!(el instanceof Element))break;
    const style=getComputedStyle(el);
    if(/auto|scroll/.test(style.overflowX)&&el.scrollWidth>el.clientWidth+8)return true;
   }
   return false;
  }
  function modalVisible(){
   if(document.documentElement.classList.contains('pm-tour-running'))return true;
   return [...document.querySelectorAll('dialog[open],[role="dialog"][aria-modal="true"]')]
    .some(el=>!el.hidden&&el.getClientRects().length>0&&getComputedStyle(el).visibility!=='hidden');
  }
  function redrawDrag(progress){
   const p=clamp(progress,0,1);
   document.body.style.setProperty('--pm-drawer-offset',(-105*(1-p)).toFixed(3)+'%');
   document.body.style.setProperty('--pm-drawer-opacity',String(p));
   if(gesture)gesture.progress=p;
  }
  function clearDrag(){
   document.body.classList.remove('pm-mobile-menu-dragging');
   document.body.style.removeProperty('--pm-drawer-offset');
   document.body.style.removeProperty('--pm-drawer-opacity');
  }
  function settleDrag(from,to){
   const body=document.body;
   const remaining=Math.abs(to-from);
   // Menos distância = desaceleração curta; arrastes longos terminam sem trancos.
   const ms=Math.round(165+140*remaining);
   body.style.setProperty('--pm-drawer-duration',ms+'ms');
   body.classList.remove('pm-mobile-menu-dragging');
   body.classList.add('pm-mobile-menu-settling');
   // Força o ponto de partida renderizado antes de iniciar a transição.
   void side.offsetWidth;
   settleFrame=requestAnimationFrame(()=>{
    settleFrame=0;
    if(!body.classList.contains('pm-mobile-menu-settling'))return;
    body.style.setProperty('--pm-drawer-offset',(-105*(1-to)).toFixed(3)+'%');
    body.style.setProperty('--pm-drawer-opacity',String(to));
   });
   settleTimer=setTimeout(()=>{
    clearSettle();
    body.style.removeProperty('--pm-drawer-duration');
   },ms+100);
  }
  function finishDrag(touch,cancel=false){
   const g=gesture;gesture=null;
   if(!g)return;
   if(!g.claimed){clearDrag();return;}
   const elapsed=Math.max(1,Date.now()-g.time);
   const velocity=touch?clamp((touch.clientX-g.x)/elapsed,-2,2):0;
   const travelled=touch?touch.clientX-g.x:(g.progress-g.start)*g.width;
   const distance=Math.abs(travelled);
   const fast=distance>32&&Math.abs(velocity)>FLICK_VELOCITY;
   const shouldOpen=cancel?g.start===1:
    fast?(velocity>0):g.progress>=FINISH_RATIO;
   // Mantém o deslocamento exato do dedo e anima apenas a distância que restou.
   // O elemento continua visível até o fim, evitando saltos entre estados.
   const p=clamp(g.progress,0,1);
   setOpen(shouldOpen,false,false);
   settleDrag(p,shouldOpen?1:0);
  }
  function cancelDrag(){finishDrag(null,true)}
  document.addEventListener('touchstart',event=>{
   if(gesture)cancelDrag();
   // O tutorial é totalmente modal; nenhum gesto da página deve alcançá-lo.
   if(document.documentElement.classList.contains('pm-tour-running'))return;
   // Não interrompe uma animação de assentamento que ainda está terminando.
   if(document.body.classList.contains('pm-mobile-menu-settling'))return;
   if(!media.matches||event.touches.length!==1||modalVisible())return;
   const t=event.touches[0],target=event.target;
   if(horizontalScroller(target))return;
   if(target?.closest?.('input,textarea,select,[contenteditable="true"],[role="slider"]'))return;
   const start=opened?1:0;
   // Abre arrastando da esquerda para a direita a partir de qualquer
   // coordenada horizontal, inclusive cartões e área central da página.
   // Com o menu aberto, o movimento inverso também funciona em toda a tela.
   gesture={start,progress:start,x:t.clientX,y:t.clientY,
    time:Date.now(),width:Math.max(side.getBoundingClientRect().width,1),
    claimed:false};
  },{passive:true});
  document.addEventListener('touchmove',event=>{
   if(document.documentElement.classList.contains('pm-tour-running')){
    if(gesture)cancelDrag();
    return;
   }
   const g=gesture;
   if(!g)return;
   if(event.touches.length!==1){cancelDrag();return;}
   const t=event.touches[0],dx=t.clientX-g.x,dy=t.clientY-g.y;
   if(!g.claimed){
    if(Math.abs(dy)>11&&Math.abs(dy)>Math.abs(dx)*.8){
     gesture=null;return; // rolagem vertical segue nativa
    }
    if(Math.abs(dx)<START_SLOP)return;
    if(Math.abs(dx)<Math.abs(dy)*1.35)return;
    if((g.start===0&&dx<0)||(g.start===1&&dx>0)){
     gesture=null;return;
    }
    g.claimed=true;
    document.body.classList.add('pm-mobile-menu-dragging');
   }
   if(event.cancelable)event.preventDefault();
   redrawDrag(g.start+dx/g.width);
  },{passive:false});
  document.addEventListener('touchend',event=>{
   if(!gesture)return;
   if(event.changedTouches.length!==1){cancelDrag();return;}
   const t=event.changedTouches[0],g=gesture;
   if(g.claimed){
    // Inclui o trecho final que pode ocorrer após o último touchmove.
    redrawDrag(g.start+(t.clientX-g.x)/g.width);
    // Não produzir um clique fantasma ao soltar o arraste no fundo.
    if(event.cancelable)event.preventDefault();
   }
   finishDrag(t);
  },{passive:false});
  document.addEventListener('touchcancel',cancelDrag,{passive:true});
  window.addEventListener('blur',cancelDrag);
  document.addEventListener('visibilitychange',()=>{
   if(document.hidden)cancelDrag();
  });
  document.addEventListener('click',event=>{
   if(!opened)return;
   // Fechamento pelo fundo também funciona sem depender do clique
   // específico na sobreposição, inclusive após um gesto anterior.
   if(!side.contains(event.target)&&!toggle.contains(event.target)){
    setOpen(false,false,false);
    return;
   }
   const item=event.target.closest(
    '#siteSidebar #nav [data-page], #siteSidebar #subjectNav .sidebtn, '+
    '#siteSidebar #semesterDropdown [data-semester], '+
    '#siteSidebar .mobile-secondary-actions button'
   );
   if(item)setOpen(false);
  });

  document.addEventListener('keydown',event=>{
   if(!opened)return;
   if(event.key==='Escape'){
    event.preventDefault();setOpen(false,true);return;
   }
   if(event.key!=='Tab')return;
   const list=[...side.querySelectorAll('button:not([disabled]):not([hidden]),a[href],input:not([disabled]),select:not([disabled]),[tabindex="0"]')]
    .filter(el=>!el.closest('[hidden]')&&el.getClientRects().length>0);
   if(!list.length)return;
   const first=list[0],last=list[list.length-1];
   if(event.shiftKey&&document.activeElement===first){
    event.preventDefault();last.focus();
   }else if(!event.shiftKey&&document.activeElement===last){
    event.preventDefault();first.focus();
   }
  });
  function onResize(){
   cancelDrag();
   clearSettle();
   document.body.style.removeProperty('--pm-drawer-duration');
   setOpen(false);
  }
  if(media.addEventListener)media.addEventListener('change',onResize);
  else if(media.addListener)media.addListener(onResize);
  setOpen(false);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});
 else setup();
})();
