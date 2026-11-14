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
  header.appendChild(brand);

  const row=document.createElement('div');
  row.className='pm-mobile-menu-row';
  const toggle=document.createElement('button');
  toggle.type='button';
  toggle.id='pmMobileMenuToggle';
  toggle.className='pm-mobile-menu-toggle';
  toggle.setAttribute('aria-controls','siteSidebar');
  toggle.setAttribute('aria-expanded','false');
  toggle.setAttribute('aria-label','Abrir menu de navegação');
  toggle.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
  const hint=document.createElement('span');
  hint.className='pm-mobile-menu-hint';
  hint.textContent='Menu';
  row.append(toggle,hint);
  header.appendChild(row);

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
  let opened=false;
  function setOpen(value,restoreFocus=false){
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
   if(opened)closeButton.focus({preventScroll:true});
   else if(restoreFocus&&media.matches)toggle.focus({preventScroll:true});
  }
  toggle.addEventListener('click',()=>setOpen(!opened,true));
  closeButton.addEventListener('click',()=>setOpen(false,true));
  backdrop.addEventListener('click',()=>setOpen(false,true));

  document.addEventListener('click',event=>{
   if(!opened)return;
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
  function onResize(){setOpen(false)}
  if(media.addEventListener)media.addEventListener('change',onResize);
  else if(media.addListener)media.addListener(onResize);
  setOpen(false);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});
 else setup();
})();
