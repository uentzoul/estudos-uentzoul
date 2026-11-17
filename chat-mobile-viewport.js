/* Cabeçalho e campo de mensagens acompanham a altura visível no iOS e Android. */
(()=>{
'use strict';
if(window.__pmChatViewportFit)return;
window.__pmChatViewportFit=true;
const root=document.documentElement;
let frame=0;
function update(){
 frame=0;
 const phone=window.matchMedia('(max-width:760px)').matches;
 const chat=phone&&!!document.querySelector('.app > .main > .dm-shell');
 if(!chat){root.style.removeProperty('--pm-chat-viewport-height');return}
 const visible=window.visualViewport?.height||window.innerHeight;
 if(Number.isFinite(visible)&&visible>120)
  root.style.setProperty('--pm-chat-viewport-height',Math.round(visible)+'px');
}
function schedule(){
 if(frame)return;
 frame=requestAnimationFrame(update);
}
const main=document.getElementById('main');
if(main)new MutationObserver(schedule).observe(main,{childList:true});
window.addEventListener('resize',schedule,{passive:true});
window.visualViewport?.addEventListener('resize',schedule,{passive:true});
window.visualViewport?.addEventListener('scroll',schedule,{passive:true});
document.addEventListener('focusin',schedule,true);
document.addEventListener('focusout',schedule,true);
schedule();
})();
/* Carregamento modular das calls: não altera o HTML histórico nem os demais chats. */
(()=>{
 if(window.__uentzoulGroupCallLoader)return;
 window.__uentzoulGroupCallLoader=true;
 const stylesheet=document.createElement('link');
 stylesheet.rel='stylesheet';
 stylesheet.href='group-call.css?v=20261117-call-v1';
 stylesheet.id='uentzoul-group-call-css';
 document.head.appendChild(stylesheet);
 const script=document.createElement('script');
 script.src='group-call.js?v=20261117-call-v1';
 script.id='uentzoul-group-call-js';
 script.defer=true;
 document.body.appendChild(script);
})();
