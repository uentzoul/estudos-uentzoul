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
let placements=new Map(),editing=null,rerender=()=>{},fetching=false,lastFetch=0,notice='',draggedKey='';
const auth=()=>window.uentzoulAIAuth;
const client=()=>auth()?.client?.();
const user=()=>auth()?.user?.();
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key=m=>String(m._libraryKey||(m.subject+'::'+m.title));
const placementKey=(s,k)=>SEMESTER+'|'+s+'|'+k;
const allowed=()=>!!user()?.id&&(window.uentzoulAdminConfig?.isAdmin?.()===true||window.uentzoulLibraryManager?.isAdmin?.()===true);
function category(m,classify){
 const stored=placements.get(placementKey(m.subject,key(m)));
 return BY_ID.has(stored?.category)?stored.category:(BY_TITLE.get(classify(m))||'extras');
}
function currentGroups(materials,subject,classify){
 const all=CATEGORIES.map(x=>[x.id,[]]),groups=Object.fromEntries(all);
 materials.filter(m=>m&&m.available&&m.subject===subject).forEach((m,i)=>{
  const id=category(m,classify);
  const p=placements.get(placementKey(subject,key(m)));
  groups[id].push({key:key(m),material:m,order:i,position:p?.category===id?p.position:null});
 });
 for(const cat of CATEGORIES){
  groups[cat.id].sort((a,b)=>{
   if(a.position!==null||b.position!==null){
    if(a.position===null)return 1;
    if(b.position===null)return -1;
    if(a.position!==b.position)return a.position-b.position;
   }
   if(cat.id==='plans'){
    const priority=x=>/plano de ensino/i.test(x.material.title||'')?0:/cronograma/i.test(x.material.title||'')?1:2;
    const d=priority(a)-priority(b);if(d)return d;
   }
   return a.order-b.order;
  });
 }
 return groups;
}
function copyForEditing(materials,subject,classify){
 const groups=currentGroups(materials,subject,classify);
 return {subject,groups:Object.fromEntries(CATEGORIES.map(c=>[c.id,groups[c.id].map(x=>x.key)])),
  materials:new Map(materials.filter(m=>m?.available&&m.subject===subject).map(m=>[key(m),m])),busy:false,error:''};
}
function renderGroups(materials,opts){
 const subject=opts?.subject||materials[0]?.subject||'';
 const isEditing=allowed()&&editing?.subject===subject&&!opts.libraryView;
 const base=currentGroups(materials,subject,opts.classify);
 const active=isEditing?editing:null;
 const groups=isEditing?Object.fromEntries(CATEGORIES.map(c=>[c.id,(active.groups[c.id]||[]).map(k=>({key:k,material:active.materials.get(k)})).filter(x=>x.material)])):base;
 const show=CATEGORIES.filter(c=>c.core||groups[c.id].length||isEditing);
 const optionMarkup=(selected)=>CATEGORIES.map(c=>'<option value="'+c.id+'"'+(c.id===selected?' selected':'')+'>'+esc(c.title)+'</option>').join('');
 const sections=show.map(cat=>{
  const list=groups[cat.id];
  const cards=isEditing?list.map((x,i)=>
   '<div class="pm-edit-row" data-pm-file="'+esc(x.key)+'">'+
    '<span class="pm-drag-handle" draggable="true" tabindex="0" role="img" aria-label="Arraste para reorganizar '+esc(x.material.title)+'" title="Arraste para reorganizar">⠿</span>'+
    '<span class="pm-edit-file-title">'+esc(x.material.title)+'</span>'+
    '<label class="pm-edit-move-label"><span>Categoria</span><select data-pm-category="'+esc(x.key)+'" aria-label="Categoria do arquivo '+esc(x.material.title)+'">'+optionMarkup(cat.id)+'</select></label>'+
    '<span class="pm-edit-order-controls"><button type="button" data-pm-order="up" data-pm-key="'+esc(x.key)+'" aria-label="Mover para cima"'+(i===0?' disabled':'')+'>↑</button>'+
    '<button type="button" data-pm-order="down" data-pm-key="'+esc(x.key)+'" aria-label="Mover para baixo"'+(i===list.length-1?' disabled':'')+'>↓</button></span>'+
   '</div>').join(''):list.map((x,i)=>opts.card(x.material,i)).join('');
  return '<section class="material-block pm-material-group'+(isEditing?' pm-is-editing':'')+'" data-pm-group="'+cat.id+'">'+
   '<h3>'+esc(cat.title)+'<span>'+list.length+' '+(list.length===1?'item':'itens')+'</span></h3>'+
   '<div class="'+(isEditing?'pm-edit-list':'doclist')+'">'+(cards||
    '<div class="pm-empty-group">'+(isEditing?'Solte um arquivo aqui para transferi-lo para esta categoria.':'Nenhum material nesta categoria.')+'</div>')+
   '</div></section>';
 }).join('');
 if(!isEditing)return (notice?'<p class="pm-save-notice" role="status">'+esc(notice)+'</p>':'')+sections;
 return '<div class="pm-edit-instructions"><strong>Modo de edição</strong><span>Arraste os arquivos entre as categorias ou use o seletor “Categoria”. As setas alteram a ordem dentro de cada seção. Clique em Salvar organização para publicar as alterações.</span></div>'+
  (active.error?'<p class="pm-edit-error" role="alert">'+esc(active.error)+'</p>':'')+
  '<div class="pm-editor-groups">'+sections+'</div>';
}
function editButton(subject){
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
 for(const cat of CATEGORIES){editing.groups[cat.id]=editing.groups[cat.id].filter(v=>v!==k);}
 const target=editing.groups[to];
 const i=before&&target.includes(before)?target.indexOf(before):target.length;
 target.splice(i,0,k);
 editing.error='';
 repaint();
}
function clearHighlight(){document.querySelectorAll('.pm-material-group.pm-drop-target').forEach(x=>x.classList.remove('pm-drop-target'));}
async function save(){
 const state=editing;
 if(!state||state.busy||!allowed())return;
 const c=client(),u=user();
 if(!c||!u){state.error='Entre na sua conta para salvar.';repaint();return;}
 state.busy=true;state.error='';repaint();
 try{
  const check=await c.rpc('uentzoul_is_admin');
  if(check.error||check.data!==true||user()?.id!==u.id)throw Error('Sua conta não possui permissão de administrador.');
  const rows=CATEGORIES.flatMap(cat=>(state.groups[cat.id]||[]).map((k,i)=>({
   semester:SEMESTER,subject:state.subject,resource_key:k,category:cat.id,position:i,updated_at:new Date().toISOString()
  })));
  if(rows.length){
   const result=await c.from(TABLE).upsert(rows,{onConflict:'semester,subject,resource_key'});
   if(result.error)throw result.error;
   const query=await c.from(TABLE).select('resource_key,category,position').eq('semester',SEMESTER).eq('subject',state.subject);
   if(query.error)throw query.error;
   const verified=new Map((query.data||[]).map(x=>[x.resource_key,x]));
   if(rows.some(r=>verified.get(r.resource_key)?.category!==r.category||verified.get(r.resource_key)?.position!==r.position)){
    throw Error('Não foi possível confirmar a gravação de todas as alterações. Atualize a página e confira a organização.');
   }
   for(const row of rows)placements.set(placementKey(row.subject,row.resource_key),row);
  }
  notice='Organização salva para todos os usuários.';
  editing=null;
  lastFetch=Date.now();
  repaint();
 }catch(e){
  if(editing===state){state.error=e?.message||'Falha ao salvar a organização.';state.busy=false;repaint();}
 }
}
async function refresh(force=false){
 if(fetching)return;
 const c=client();
 if(!c||(!force&&Date.now()-lastFetch<12000))return;
 fetching=true;
 try{
  const r=await c.from(TABLE).select('semester,subject,resource_key,category,position').eq('semester',SEMESTER).limit(2000);
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
  editing=copyForEditing(materials,subject,classify);notice='';repaint();return;
 }
 if(event.target.closest('[data-pm-cancel]')){event.preventDefault();if(editing&&!editing.busy){editing=null;notice='';repaint();}return;}
 if(event.target.closest('[data-pm-save]')){event.preventDefault();save();return;}
 const button=event.target.closest('[data-pm-order]');if(!button||!editing||editing.busy)return;
 event.preventDefault();const k=button.dataset.pmKey,cat=CATEGORIES.find(c=>editing.groups[c.id].includes(k));
 if(!cat)return;const list=editing.groups[cat.id],index=list.indexOf(k),step=button.dataset.pmOrder==='up'?-1:1,next=index+step;
 if(next<0||next>=list.length)return;
 [list[index],list[next]]=[list[next],list[index]];repaint();
});
document.addEventListener('change',event=>{
 const control=event.target.closest('[data-pm-category]');
 if(!control||!editing||editing.busy)return;
 move(control.dataset.pmCategory,control.value,null);
});
document.addEventListener('dragstart',event=>{
 const handle=event.target.closest('.pm-drag-handle');
 if(!handle||!editing||editing.busy)return;
 const row=handle.closest('[data-pm-file]');if(!row)return;
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
 move(from,group.dataset.pmGroup,row?.dataset.pmFile===from?null:row?.dataset.pmFile||null);
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
 getMaterials:null,classify:null,categories:CATEGORIES,isEditing:()=>!!editing};
})();
