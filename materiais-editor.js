/* PsicoMoodle — organização manual dos materiais (somente administradores). */
(()=>{
'use strict';
const TABLE='uentzoul_material_placements';
const SEMESTER='2026/2';
const CATEGORIES=[
 {id:'plans',title:'Planos de ensino e cronogramas',core:true},
 {id:'classes',title:'Aulas e apresentações',core:true},
 {id:'texts',title:'Textos-base e bibliografia',core:true},
 {id:'review',title:'Guias e materiais de revisão',core:false},
 {id:'videos',title:'Vídeos e referências online',core:false},
 {id:'extras',title:'Materiais complementares',core:false}
];
const BY_ID=new Map(CATEGORIES.map(x=>[x.id,x]));
const BY_TITLE=new Map(CATEGORIES.map(x=>[x.title,x.id]));
const HIDDEN='__hidden__';
let placements=new Map(),editing=null,rerender=()=>{},fetching=false,lastFetch=0,notice='',draggedKey='';
const auth=()=>window.uentzoulAIAuth;
const client=()=>auth()?.client?.();
const user=()=>auth()?.user?.();
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key=m=>String(m._libraryKey||(m.subject+'::'+m.title));
const placementKey=(s,k)=>SEMESTER+'|'+s+'|'+k;
function titleFor(m){
 const row=placements.get(placementKey(m.subject,key(m)));
 return typeof row?.display_title==='string'&&row.display_title.trim()?row.display_title:m.title;
}
const allowed=()=>!!user()?.id&&window.uentzoulAdminConfig?.isAdmin?.()===true;
function category(m,classify){
 const stored=placements.get(placementKey(m.subject,key(m)));
 return BY_ID.has(stored?.category)?stored.category:(BY_TITLE.get(classify(m))||'extras');
}
function currentGroups(materials,subject,classify){
 const groups=Object.fromEntries(CATEGORIES.map(c=>[c.id,[]]));groups[HIDDEN]=[];
 materials.filter(m=>m?.available&&m.subject===subject).forEach((m,i)=>{
  const p=placements.get(placementKey(subject,key(m))),id=p?.is_hidden===true?HIDDEN:category(m,classify);
  groups[id].push({key:key(m),material:m,order:i,position:p?.category===id?p.position:null});
 });
 for(const cat of CATEGORIES)groups[cat.id].sort((a,b)=>{
  if(a.position!==null||b.position!==null){
   if(a.position===null)return 1;if(b.position===null)return -1;
   if(a.position!==b.position)return a.position-b.position;
  }
  if(cat.id==='plans'){
   const priority=x=>/plano de ensino/i.test(x.material.title||'')?0:/cronograma/i.test(x.material.title||'')?1:2;
   const d=priority(a)-priority(b);if(d)return d;
  }
  return a.order-b.order;
 });
 return groups;
}
function copyForEditing(materials,subject,classify){
 const groups=currentGroups(materials,subject,classify),items=materials.filter(m=>m?.available&&m.subject===subject);
 return {subject,
  groups:Object.fromEntries([...CATEGORIES.map(c=>[c.id,groups[c.id].map(x=>x.key)]),[HIDDEN,groups[HIDDEN].map(x=>x.key)]]),
  materials:new Map(items.map(m=>[key(m),m])),
  titles:new Map(items.map(m=>[key(m),titleFor(m)])),
  restores:new Map(items.map(m=>[key(m),category(m,classify)])),
  selected:new Set(),busy:false,error:''};
}
function renderGroups(materials,opts){
 const subject=opts?.subject||materials[0]?.subject||'';
 const isEditing=allowed()&&editing?.subject===subject&&!opts.libraryView;
 const base=currentGroups(materials,subject,opts.classify),active=isEditing?editing:null;
 const groups=isEditing?Object.fromEntries([
  ...CATEGORIES.map(c=>[c.id,(active.groups[c.id]||[]).map(k=>({key:k,material:active.materials.get(k)})).filter(x=>x.material)]),
  [HIDDEN,(active.groups[HIDDEN]||[]).map(k=>({key:k,material:active.materials.get(k)})).filter(x=>x.material)]
 ]):base;
 const show=CATEGORIES.filter(c=>c.core||groups[c.id].length||isEditing);
 const options=selected=>CATEGORIES.map(c=>'<option value="'+c.id+'"'+(c.id===selected?' selected':'')+'>'+esc(c.title)+'</option>').join('');
 const pick=x=>'<label class="pm-edit-pick"><input type="checkbox" data-pm-select="'+esc(x.key)+'"'+(active.selected.has(x.key)?' checked':'')+' aria-label="Selecionar o material '+esc(x.material.title)+'"></label>';
 const sections=show.map(cat=>{
  const list=groups[cat.id];
  const cards=isEditing?list.map((x,i)=>
   '<div class="pm-edit-row" draggable="true" data-pm-file="'+esc(x.key)+'">'+
    pick(x)+
    '<span class="pm-drag-handle" draggable="true" tabindex="0" role="img" aria-label="Arraste para reorganizar '+esc(x.material.title)+'" title="Arraste para reorganizar">⠿</span>'+
    '<label class="pm-edit-name-label"><span>Nome exibido</span><input type="text" maxlength="180" data-pm-title="'+esc(x.key)+'" value="'+esc(active.titles.get(x.key)??x.material.title)+'" aria-label="Nome exibido do arquivo '+esc(x.material.title)+'" autocomplete="off"></label>'+
    '<label class="pm-edit-move-label"><span>Categoria</span><select data-pm-category="'+esc(x.key)+'" aria-label="Categoria do arquivo '+esc(x.material.title)+'">'+options(cat.id)+'</select></label>'+
    '<span class="pm-edit-order-controls"><button type="button" data-pm-order="up" data-pm-key="'+esc(x.key)+'" aria-label="Mover para cima"'+(i===0?' disabled':'')+'>↑</button>'+
    '<button type="button" data-pm-order="down" data-pm-key="'+esc(x.key)+'" aria-label="Mover para baixo"'+(i===list.length-1?' disabled':'')+'>↓</button></span>'+
    '<button type="button" class="pm-edit-hide" data-pm-visibility="hide" data-pm-key="'+esc(x.key)+'" aria-label="Ocultar o material '+esc(x.material.title)+'">Ocultar</button></div>').join(''):
   list.map((x,i)=>opts.card({...x.material,title:titleFor(x.material)},i)).join('');
  return '<section class="material-block pm-material-group'+(isEditing?' pm-is-editing':'')+'" data-pm-group="'+cat.id+'">'+
   '<h3>'+esc(cat.title)+'<span>'+list.length+' '+(list.length===1?'item':'itens')+'</span></h3>'+
   '<div class="'+(isEditing?'pm-edit-list':'doclist')+'">'+(cards||
    '<div class="pm-empty-group">'+(isEditing?'Solte um arquivo aqui para transferi-lo para esta categoria.':'Nenhum material nesta categoria.')+'</div>')+
   '</div></section>';
 }).join('');
 if(!isEditing)return (notice?'<p class="pm-save-notice" role="status">'+esc(notice)+'</p>':'')+sections;
 const selectedVisible=CATEGORIES.reduce((n,c)=>n+(active.groups[c.id]||[]).filter(k=>active.selected.has(k)).length,0);
 const selectedHidden=(active.groups[HIDDEN]||[]).filter(k=>active.selected.has(k)).length;
 const hidden=groups[HIDDEN];
 const hiddenSection='<section class="material-block pm-material-group pm-is-editing pm-hidden-group">'+
  '<h3>Materiais ocultos<span>'+hidden.length+' '+(hidden.length===1?'item':'itens')+'</span></h3>'+
  '<p class="pm-hidden-hint">Estes materiais não aparecem para os estudantes. É possível restaurá-los a qualquer momento.</p>'+
  '<div class="pm-edit-list">'+(hidden.length?hidden.map(x=>
   '<div class="pm-edit-row pm-hidden-row" data-pm-file="'+esc(x.key)+'">'+pick(x)+
   '<span class="pm-hidden-name">'+esc(active.titles.get(x.key)??x.material.title)+'</span>'+
   '<button type="button" class="pm-edit-restore" data-pm-visibility="restore" data-pm-key="'+esc(x.key)+'">Restaurar</button></div>'
  ).join(''):'<div class="pm-empty-group">Nenhum material oculto.</div>')+'</div></section>';
 const controls='<div class="pm-edit-selection" aria-label="Seleção de materiais">'+
  '<strong>'+active.selected.size+' '+(active.selected.size===1?'material selecionado':'materiais selecionados')+'</strong>'+
  '<button type="button" data-pm-bulk="select-all">Selecionar todos</button>'+
  '<button type="button" data-pm-bulk="clear"'+(active.selected.size?'':' disabled')+'>Limpar seleção</button>'+
  '<button type="button" data-pm-bulk="hide"'+(selectedVisible?'':' disabled')+'>Ocultar selecionados</button>'+
  '<button type="button" data-pm-bulk="restore"'+(selectedHidden?'':' disabled')+'>Restaurar selecionados</button></div>';
 return '<div class="pm-edit-instructions"><strong>Modo de edição</strong><span>Selecione os materiais para ocultá-los ou restaurá-los em conjunto. Também é possível editar o nome exibido, escolher a categoria, arrastar e alterar a ordem. Os arquivos originais não são apagados. Clique em Salvar organização para publicar as alterações.</span></div>'+
  (active.error?'<p class="pm-edit-error" role="alert">'+esc(active.error)+'</p>':'')+
  controls+'<div class="pm-editor-groups">'+sections+hiddenSection+'</div>';
}
function editButton(subject){
 if(editing&&editing.owner!==user()?.id)editing=null;
 if(!allowed()||!subject)return '';
 if(editing?.subject===subject){
  return '<div class="pm-edit-toolbar">'+
   '<button type="button" class="pm-cancel" data-pm-cancel'+(editing.busy?' disabled':'')+'>Cancelar</button>'+
   '<button type="button" class="pm-save" data-pm-save'+(editing.busy?' disabled':'')+'>'+(editing.busy?'Salvando…':'Salvar organização')+'</button></div>';
 }
 return '<button type="button" class="pm-edit-button" data-pm-edit="'+esc(subject)+'" aria-label="Editar organização dos materiais">✎ Editar</button>';
}
function repaint(){
 const y=window.scrollY;
 rerender();
 try{window.scrollTo({top:y,behavior:'instant'});}catch(_){window.scrollTo(0,y);}
}
function move(k,to,before){
 if(!editing||editing.busy||!BY_ID.has(to)||!editing.materials.has(k))return;
 for(const cat of CATEGORIES)editing.groups[cat.id]=editing.groups[cat.id].filter(v=>v!==k);
 editing.groups[HIDDEN]=editing.groups[HIDDEN].filter(v=>v!==k);
 const target=editing.groups[to],i=before&&target.includes(before)?target.indexOf(before):target.length;
 target.splice(i,0,k);editing.restores.set(k,to);editing.error='';repaint();
}
function setHidden(k,hide,quiet=false){
 if(!editing||editing.busy||!editing.materials.has(k))return;
 const wasHidden=editing.groups[HIDDEN].includes(k);if(wasHidden===hide)return;
 if(hide){
  const previous=CATEGORIES.find(c=>editing.groups[c.id].includes(k));
  if(previous)editing.restores.set(k,previous.id);
  for(const cat of CATEGORIES)editing.groups[cat.id]=editing.groups[cat.id].filter(v=>v!==k);
  editing.groups[HIDDEN].push(k);
 }else{
  editing.groups[HIDDEN]=editing.groups[HIDDEN].filter(v=>v!==k);
  const target=editing.restores.get(k);
  editing.groups[BY_ID.has(target)?target:'extras'].push(k);
 }
 editing.selected.delete(k);editing.error='';if(!quiet)repaint();
}
function clearHighlight(){document.querySelectorAll('.pm-material-group.pm-drop-target').forEach(x=>x.classList.remove('pm-drop-target'));}
async function save(){
 const state=editing;
 if(!state||state.busy||!allowed()||state.owner!==user()?.id)return;
 const invalid=[...state.titles].find(([k,name])=>state.materials.has(k)&&(!String(name).trim()||String(name).trim().length>180));
 if(invalid){state.error='O nome de cada material deve conter de 1 a 180 caracteres.';repaint();return;}
 const c=client(),u=user();if(!c||!u){state.error='Entre na sua conta para salvar.';repaint();return;}
 state.busy=true;state.error='';repaint();
 try{
  const check=await c.rpc('uentzoul_is_admin');
  if(check.error||check.data!==true||user()?.id!==u.id)throw Error('Sua conta não possui permissão de administrador.');
  const makeRow=(k,cat,pos,hidden)=>({
   semester:SEMESTER,subject:state.subject,resource_key:k,category:cat,position:pos,is_hidden:hidden,
   display_title:String(state.titles.get(k)||'').trim()===String(state.materials.get(k)?.title||'').trim()?null:String(state.titles.get(k)||'').trim(),
   updated_at:new Date().toISOString()
  });
  const rows=CATEGORIES.flatMap(cat=>(state.groups[cat.id]||[]).map((k,i)=>makeRow(k,cat.id,i,false)));
  rows.push(...(state.groups[HIDDEN]||[]).map((k,i)=>makeRow(k,BY_ID.has(state.restores.get(k))?state.restores.get(k):'extras',i,true)));
  if(rows.length){
   const result=await c.from(TABLE).upsert(rows,{onConflict:'semester,subject,resource_key'});
   if(result.error)throw result.error;
   const query=await c.from(TABLE).select('resource_key,category,position,display_title,is_hidden').eq('semester',SEMESTER).eq('subject',state.subject);
   if(query.error)throw query.error;
   const verified=new Map((query.data||[]).map(x=>[x.resource_key,x]));
   if(rows.some(r=>verified.get(r.resource_key)?.category!==r.category||verified.get(r.resource_key)?.position!==r.position||
    verified.get(r.resource_key)?.is_hidden!==r.is_hidden||(verified.get(r.resource_key)?.display_title||null)!==(r.display_title||null))){
    throw Error('Não foi possível confirmar a gravação de todas as alterações. Atualize a página e confira a organização.');
   }
   for(const row of rows)placements.set(placementKey(row.subject,row.resource_key),row);
  }
  notice='Alterações de materiais salvas para todos os usuários.';
  editing=null;lastFetch=Date.now();repaint();
 }catch(e){if(editing===state){state.error=e?.message||'Falha ao salvar a organização.';state.busy=false;repaint();}}
}
async function refresh(force=false){
 if(fetching)return;
 const c=client();
 if(!c||(!force&&Date.now()-lastFetch<12000))return;
 fetching=true;
 try{
  const r=await c.from(TABLE).select('semester,subject,resource_key,category,position,display_title,is_hidden').eq('semester',SEMESTER).limit(2000);
  if(r.error)throw r.error;
  const next=new Map((r.data||[]).map(x=>[placementKey(x.subject,x.resource_key),x]));
  const changed=JSON.stringify([...placements])!==JSON.stringify([...next]);
  placements=next;lastFetch=Date.now();
  if(changed&&!editing)repaint();
 }catch(e){console.warn('Não foi possível atualizar a organização dos materiais:',e);}
 finally{fetching=false;}
}
function setRerender(callback){if(typeof callback==='function')rerender=callback;}
document.addEventListener('click',event=>{
 const edit=event.target.closest('[data-pm-edit]');
 if(edit){event.preventDefault();if(!allowed())return;const subject=edit.dataset.pmEdit;
  const materials=window.PSICO_MATERIAL_EDITOR?.getMaterials?.(subject)||[];
  const classify=window.PSICO_MATERIAL_EDITOR?.classify;
  if(!classify)return;
  editing=copyForEditing(materials,subject,classify);editing.owner=user()?.id;notice='';repaint();return;
 }
 if(event.target.closest('[data-pm-cancel]')){event.preventDefault();if(editing&&!editing.busy){editing=null;notice='';repaint();}return;}
 if(event.target.closest('[data-pm-save]')){event.preventDefault();save();return;}
 const visibility=event.target.closest('[data-pm-visibility]');
 if(visibility&&editing&&!editing.busy&&allowed()){
  event.preventDefault();setHidden(visibility.dataset.pmKey,visibility.dataset.pmVisibility==='hide');return;
 }
 const bulk=event.target.closest('[data-pm-bulk]');
 if(bulk&&editing&&!editing.busy&&allowed()){
  event.preventDefault();const action=bulk.dataset.pmBulk;
  if(action==='clear')editing.selected.clear();
  else if(action==='select-all')editing.selected=new Set([...CATEGORIES.flatMap(c=>editing.groups[c.id]),...editing.groups[HIDDEN]]);
  else if(action==='hide'||action==='restore')for(const k of [...editing.selected])setHidden(k,action==='hide',true);
  repaint();return;
 }
 const button=event.target.closest('[data-pm-order]');if(!button||!editing||editing.busy)return;
 event.preventDefault();const k=button.dataset.pmKey,cat=CATEGORIES.find(c=>editing.groups[c.id].includes(k));
 if(!cat)return;const list=editing.groups[cat.id],index=list.indexOf(k),step=button.dataset.pmOrder==='up'?-1:1,next=index+step;
 if(next<0||next>=list.length)return;
 [list[index],list[next]]=[list[next],list[index]];repaint();
});
document.addEventListener('input',event=>{
 const control=event.target.closest('[data-pm-title]');
 if(!control||!editing||editing.busy||!allowed())return;
 if(editing.materials.has(control.dataset.pmTitle))editing.titles.set(control.dataset.pmTitle,control.value);
});
document.addEventListener('change',event=>{
 const pick=event.target.closest('[data-pm-select]');
 if(pick&&editing&&!editing.busy&&allowed()){
  if(pick.checked)editing.selected.add(pick.dataset.pmSelect);
  else editing.selected.delete(pick.dataset.pmSelect);
  repaint();return;
 }
 const control=event.target.closest('[data-pm-category]');
 if(!control||!editing||editing.busy)return;
 move(control.dataset.pmCategory,control.value,null);
});
document.addEventListener('dragstart',event=>{
 const row=event.target.closest('[data-pm-file]');
 if(!row||!editing||editing.busy||event.target.closest('button,select,input,textarea'))return;
 draggedKey=row.dataset.pmFile;event.dataTransfer.effectAllowed='move';
 event.dataTransfer.setData('text/plain',draggedKey);
 row.classList.add('pm-dragging');
});
document.addEventListener('dragover',event=>{
 const group=event.target.closest('[data-pm-group]');
 if(!editing||editing.busy||!draggedKey||!group||!BY_ID.has(group.dataset.pmGroup))return;
 event.preventDefault();event.dataTransfer.dropEffect='move';clearHighlight();group.classList.add('pm-drop-target');
});
document.addEventListener('drop',event=>{
 const group=event.target.closest('[data-pm-group]');
 if(!editing||editing.busy||!draggedKey||!group||!BY_ID.has(group.dataset.pmGroup))return;
 event.preventDefault();const from=draggedKey;draggedKey='';clearHighlight();
 const row=event.target.closest('[data-pm-file]');
 if(row?.dataset.pmFile===from)return;
 move(from,group.dataset.pmGroup,row?.dataset.pmFile||null);
});
document.addEventListener('dragend',()=>{draggedKey='';clearHighlight();document.querySelectorAll('.pm-dragging').forEach(x=>x.classList.remove('pm-dragging'));});
window.addEventListener('focus',()=>refresh());
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
window.addEventListener('uentzoul:library-updated',()=>refresh());
setInterval(()=>refresh(),45000);
let attempts=0;
function start(){if(client())refresh(true);else if(attempts++<60)setTimeout(start,900);}
start();
window.PSICO_MATERIAL_EDITOR={render:renderGroups,editButton,setRerender,refresh,
 getMaterials:null,classify:null,categories:CATEGORIES,titleFor,isEditing:()=>!!editing};
})();
