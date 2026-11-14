/* PsicoMoodle — exclusão individual de mensagens (visão do próprio usuário). */
(function(){
'use strict';
if(window.__pmHideOnlyMeReady || !window.uentzoulMessenger || typeof dm === 'undefined')return;
window.__pmHideOnlyMeReady=true;
let busy=false;
document.addEventListener('click',async function(event){
 const target=event.target instanceof Element?event.target.closest('[data-pm-delete-for-me]'):null;
 if(!target)return;
 event.preventDefault();
 event.stopImmediatePropagation();
 if(busy||!onlineUser||!dmValid(target.dataset.pmDeleteForMe))return;
 const type=target.dataset.pmDeleteScope;
 if(type!=='private'&&type!=='room')return;
 const id=target.dataset.pmDeleteForMe,owner=onlineUser.id;
 const source=type==='private'?dm.messages:dm.roomMessages;
 const row=source.find(m=>m.id===id);
 if(!row)return;
 if(!confirm('Apagar esta mensagem apenas para você? As outras pessoas continuarão vendo a mensagem.'))return;
 busy=true;dmW.menu=null;
 try{
  const payload={user_id:owner};
  if(type==='private')payload.message_id=id;
  else payload.room_message_id=id;
  const r=await client.from('uentzoul_hidden_messages').upsert(payload,{
   onConflict:type==='private'?'user_id,message_id':'user_id,room_message_id',
   ignoreDuplicates:true
  });
  if(r.error)throw r.error;
  if(onlineUser?.id!==owner)return;
  const index=source.findIndex(m=>m.id===id);
  if(index>=0)source.splice(index,1);
  if(dmW.reply?.id===id)dmW.reply=null;
  dmShow();
  dmBadge();
 }catch(error){
  console.warn('Erro ao ocultar mensagem da própria conta',error);
  toast('Não foi possível apagar a mensagem somente para você.');
 }finally{busy=false}
},true);
})();