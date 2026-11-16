/* Estudos Uentzoul — orientação vertical em telefones; tablets continuam livres. */
(()=>{
'use strict';
if(window.__pmPhonePortraitGuard)return;
window.__pmPhonePortraitGuard=true;

function isPhoneDevice(info){
 const ua=String(info.ua||'');
 const platform=String(info.platform||'');
 const touches=Number(info.touches)||0;
 const shortSide=Number(info.shortSide)||0;
 // iPadOS pode anunciar "MacIntel" mesmo sendo tablet.
 if(/iPhone|iPod|Windows Phone|IEMobile/i.test(ua))return true;
 if(/iPad|Tablet|Kindle|Silk|PlayBook|Nexus 7|Nexus 10/i.test(ua)||
    (/Android/i.test(ua)&&!/Mobile/i.test(ua)))return false;
 if(info.uaMobile===true)return true;
 if((/MacIntel|Macintosh/i.test(platform+' '+ua))&&touches>1)
   return shortSide>0&&shortSide<600;
 if(/Android[^)]*Mobile|Mobile/i.test(ua))return true;
 if(info.uaMobile===true)return true;
 // Dispositivos móveis com user-agent atípico, sem afetar laptops touch.
 return !!info.coarse&&touches>0&&shortSide>0&&shortSide<600;
}
const coarse=!!window.matchMedia?.('(pointer: coarse)')?.matches;
const phone=isPhoneDevice({
 ua:navigator.userAgent,platform:navigator.platform,
 touches:navigator.maxTouchPoints,uaMobile:navigator.userAgentData?.mobile,
 shortSide:Math.min(screen.width||0,screen.height||0),coarse
});
if(!phone)return;
document.documentElement.dataset.pmPhonePortrait='true';
const query=window.matchMedia?.('(orientation: landscape)');
let overlay=null,lockAttempted=false;

function ensureNotice(){
 if(overlay?.isConnected)return overlay;
 if(!document.body)return null;
 overlay=document.getElementById('pm-phone-portrait-notice');
 if(!overlay){
  overlay=document.createElement('div');
  overlay.id='pm-phone-portrait-notice';
  overlay.setAttribute('role','status');
  overlay.setAttribute('aria-live','polite');
  overlay.setAttribute('aria-atomic','true');
  overlay.innerHTML='<div class="pm-phone-portrait-message">'+
   '<svg viewBox="0 0 68 68" width="64" height="64" fill="none" stroke="currentColor" stroke-width="2.8" aria-hidden="true">'+
   '<rect x="22" y="6" width="24" height="45" rx="5"/><path d="M30 44h8"/>'+
   '<path d="M12 45a27 27 0 0 0 15 14M12 45l-5 8m5-8 8 5"/>'+
   '</svg>'+
   '<strong>Use o celular na vertical</strong>'+
   '<p>Para continuar no Estudos Uentzoul, gire o aparelho para a posição vertical.</p>'+
   '</div>';
  document.body.appendChild(overlay);
 }
 return overlay;
}
function tryNativeLock(){
 if(lockAttempted||typeof screen.orientation?.lock!=='function')return;
 const standalone=navigator.standalone===true||
  !!window.matchMedia?.('(display-mode: standalone)')?.matches;
 if(!standalone&&!document.fullscreenElement)return;
 lockAttempted=true;
 try{Promise.resolve(screen.orientation.lock('portrait')).catch(()=>{});}
 catch(_){}
}
function refresh(){
 const notice=ensureNotice();
 const landscape=query?query.matches:window.innerWidth>window.innerHeight;
 document.documentElement.dataset.pmPhoneLandscape=landscape?'true':'false';
 if(notice)notice.setAttribute('aria-hidden',landscape?'false':'true');
 tryNativeLock();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});
else refresh();
query?.addEventListener?.('change',refresh);
window.addEventListener('resize',refresh,{passive:true});
window.addEventListener('orientationchange',refresh,{passive:true});
document.addEventListener('fullscreenchange',tryNativeLock);
window.addEventListener('pageshow',refresh);

// Para os testes de dispositivo, sem expor comandos de orientação ao usuário.
window.pmPhonePortraitGuard={isPhoneDevice};
})();
