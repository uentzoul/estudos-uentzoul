(()=>{
'use strict';
if(window.__courseLibraryLoaded)return;window.__courseLibraryLoaded=true;
const courses=[
['familia','Psicologia da Família','#8169bb','Família, luto e clínica'],
['avaliacao','Avaliação Psicológica','#3e95a4','Práticas e contextos'],
['tcc','Teorias e Modelos Comportamentais e Cognitivos','#3c9a7c','Teorias comportamentais e cognitivas'],
['meta','Metapsicologia','#625ca4','Psicanálise e aparelho psíquico'],
['grupos','Psicologia dos Grupos','#bf8755','Processos grupais'],
['social','Psicologia Social I','#b56e8c','Psicologia social crítica']
];
let host=null,selected='',filter='',sort='name',view='grid',progressFilter='all';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const items=()=>{try{return window.uentzoulLibraryApp?.items?.()||[]}catch{return []}};
const identity=()=>{try{return window.uentzoulAIAuth?.user?.()?.id||'visitante'}catch{return 'visitante'}};
const storageKey=x=>'pucrs:course-done:2026-2:'+identity()+':'+x.key;
function marked(x){try{return localStorage.getItem(storageKey(x))==='1'}catch{return false}}
function mark(x,v){try{v?localStorage.setItem(storageKey(x),'1'):localStorage.removeItem(storageKey(x))}catch{}}
function docs(id){return items().filter(x=>x.subject===id&&x.uploaded===true&&x.inExam!==false&&x.key)}
function calc(id){const d=docs(id),n=d.filter(marked).length;return {n,total:d.length,p:d.length?Math.round(100*n/d.length):0}}
function detect(){
 for(const selector of ['#biblioteca','#view-biblioteca','#page-biblioteca','#biblioteca-content','[data-page="biblioteca"]','[data-view="biblioteca"]']){
 const el=document.querySelector(selector);if(el&&el.children.length&&el.tagName!=='BUTTON'&&el.tagName!=='A')return el;}
 const title=[...document.querySelectorAll('h1,h2,h3')].find(el=>/^biblioteca( de estudos)?$/i.test((el.textContent||'').trim()));
 return title?.closest('section,article,[role="tabpanel"]')||null;
}
function css(){
 if(document.getElementById('pucrs-course-css'))return;
 const s=document.createElement('style');s.id='pucrs-course-css';
 s.textContent=[
 '.pucrs-courses>[data-original-library]{display:none!important}',
 '#pucrs-courses{display:block!important;color:var(--ink,#272333);padding:clamp(12px,2vw,25px);max-width:1300px;margin:auto}',
 '.pc-eyebrow{font-size:11px;font-weight:850;letter-spacing:1px;text-transform:uppercase;color:var(--muted,#827e8d)}',
 '.pc-head{font-size:clamp(22px,3vw,31px);margin:7px 0;font-weight:850}.pc-intro{font-size:13px;color:var(--muted,#827e8d)}',
 '.pc-toolbar{display:flex;gap:9px;flex-wrap:wrap;margin:21px 0}',
 '.pc-toolbar input,.pc-toolbar select{min-height:42px;border:1px solid var(--line,#dcd7e5);border-radius:10px;background:var(--paper,#fff);color:var(--ink,#272333);font:inherit;font-size:12px;padding:9px 12px}',
 '.pc-toolbar input{flex:1 1 200px;min-width:160px}',
 '.pc-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}',
 '.pc-card{border:1px solid var(--line,#dcd7e5);border-radius:15px;background:var(--paper,#fff);overflow:hidden;box-shadow:0 5px 15px #1713210a}',
 '.pc-card button{width:100%;padding:0;border:0;background:none;color:inherit;text-align:left;font:inherit;cursor:pointer}',
 '.pc-card button:hover .pc-cover{filter:brightness(1.09)}',
 '.pc-cover{height:133px;background:linear-gradient(115deg,var(--pc-color),color-mix(in srgb,var(--pc-color) 53%,white));position:relative;overflow:hidden}',
 '.pc-cover:before{content:"";position:absolute;right:-45px;top:-80px;width:210px;height:210px;border:25px solid #ffffff23;border-radius:50%}',
 '.pc-cover:after{content:"Ψ";position:absolute;bottom:4px;left:18px;font:70px Georgia,serif;color:#ffffff9c}',
 '.pc-card-body{padding:16px}.pc-card h3{font-size:14px;line-height:1.4;margin:0;min-height:40px;font-weight:800}',
 '.pc-card p{font-size:11px;color:var(--muted,#827e8d);margin:7px 0 13px;min-height:28px}',
 '.pc-count{display:flex;justify-content:space-between;font-size:11px;color:var(--muted,#827e8d);gap:5px;margin-bottom:7px}',
 '.pc-meter{height:7px;border-radius:20px;overflow:hidden;background:var(--line,#e6e0eb)}',
 '.pc-meter span{height:100%;display:block;background:var(--accent,#8971c1);border-radius:inherit}',
 '.pc-card-foot{display:flex;justify-content:space-between;align-items:center;margin-top:15px;font-size:11px;color:var(--muted,#827e8d)}',
 '.pc-grid.pc-list{grid-template-columns:1fr}.pc-list .pc-card button{display:grid;grid-template-columns:170px 1fr}.pc-list .pc-cover{height:100%;min-height:125px}',
 '.pc-back{border:1px solid var(--line,#dcd7e5);border-radius:10px;background:var(--paper,#fff);color:var(--ink,#272333);padding:10px 13px;cursor:pointer;margin-bottom:16px;font:inherit;font-size:12px}',
 '.pc-detail{border:1px solid var(--line,#dcd7e5);border-radius:16px;overflow:hidden;background:var(--paper,#fff);margin-bottom:22px}',
 '.pc-banner{background:linear-gradient(115deg,var(--pc-color),color-mix(in srgb,var(--pc-color) 53%,white));height:110px;padding:12px 24px;display:flex;align-items:center;color:#fff;font:66px Georgia,serif}',
 '.pc-detail-body{padding:20px}.pc-detail h2{font-size:21px;margin:7px 0}.pc-detail p{color:var(--muted,#827e8d);font-size:12px}',
 '.pc-resource{display:flex;gap:14px;align-items:center;flex-wrap:wrap;border:1px solid var(--line,#dcd7e5);border-radius:12px;background:var(--paper,#fff);padding:14px;margin-bottom:9px}',
 '.pc-resource-title{flex:1 1 180px;min-width:0;font-size:13px;font-weight:750;overflow-wrap:anywhere}',
 '.pc-resource small{display:block;color:var(--muted,#827e8d);font-size:11px;margin-top:4px;font-weight:400}',
 '.pc-open{color:var(--accent,#8971c1);border:1px solid var(--line,#dcd7e5);border-radius:9px;text-decoration:none;font-size:12px;font-weight:750;padding:9px 12px}',
 '.pc-complete{display:flex;gap:6px;align-items:center;font-size:11px;color:var(--muted,#827e8d)}',
 '.pc-complete input{width:17px;height:17px;accent-color:var(--accent,#8971c1)}',
 '.pc-empty{border:1px dashed var(--line,#dcd7e5);padding:35px;text-align:center;border-radius:13px;color:var(--muted,#827e8d);font-size:13px}',
 '.pc-disclaimer{font-size:11px;color:var(--muted,#827e8d);margin-top:20px;line-height:1.6}',
 '@media(max-width:900px){.pc-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}',
 '@media(max-width:600px){.pc-grid{grid-template-columns:1fr}.pc-toolbar>*{flex:1 1 100%;width:100%}.pc-list .pc-card button{display:block}.pc-list .pc-cover{height:90px;min-height:90px}.pc-resource{align-items:start}}'
 ].join('\n');document.head.appendChild(s);
}
const meter=p=>'<div class="pc-count"><span>'+p.n+' de '+p.total+' materiais concluídos</span><strong>'+p.p+'%</strong></div><div class="pc-meter" role="progressbar" aria-valuenow="'+p.p+'" aria-valuemin="0" aria-valuemax="100"><span style="width:'+p.p+'%"></span></div>';
function home(){
 let available=courses.filter(c=>c[1].toLowerCase().includes(filter.toLowerCase()));
 if(progressFilter==='started')available=available.filter(c=>calc(c[0]).p>0&&calc(c[0]).p<100);
 if(progressFilter==='done')available=available.filter(c=>calc(c[0]).total&&calc(c[0]).p===100);
 if(progressFilter==='new')available=available.filter(c=>calc(c[0]).p===0);
 available.sort((a,b)=>sort==='progress'?calc(b[0]).p-calc(a[0]).p||a[1].localeCompare(b[1]):a[1].localeCompare(b[1]));
 host.innerHTML='<div class="pc-eyebrow">Psicologia PUCRS · 2026/2</div><h2 class="pc-head">Biblioteca de estudos</h2><div class="pc-intro">Matérias das provas finais. Clique em uma disciplina para acessar os materiais.</div>'+
 '<div class="pc-toolbar"><select aria-label="Semestre"><option>2026/2</option></select><input id="pc-search" placeholder="Buscar matéria" value="'+escape(filter)+'" aria-label="Buscar matéria"><select id="pc-progress"><option value="all">Todas</option><option value="new">Não iniciadas</option><option value="started">Em andamento</option><option value="done">Concluídas</option></select><select id="pc-sort"><option value="name">Ordenar por nome</option><option value="progress">Ordenar por progresso</option></select><select id="pc-view"><option value="grid">Cartões</option><option value="list">Lista</option></select></div>'+
 (available.length?'<div class="pc-grid '+(view==='list'?'pc-list':'')+'">'+available.map(c=>'<article class="pc-card" style="--pc-color:'+c[2]+'"><button type="button" data-pc-course="'+c[0]+'"><div class="pc-cover"></div><div class="pc-card-body"><h3>'+escape(c[1])+'</h3><p>'+escape(c[3])+'</p>'+meter(calc(c[0]))+'<div class="pc-card-foot"><span>2026/2 · Prova final</span><span>Ver materiais →</span></div></div></button></article>').join('')+'</div>':'<div class="pc-empty">Nenhuma matéria encontrada.</div>')+
 '<div class="pc-disclaimer">O progresso conta somente materiais marcados como concluídos, neste navegador. Não gera pontos automaticamente.</div>';
 host.querySelector('#pc-progress').value=progressFilter;host.querySelector('#pc-sort').value=sort;host.querySelector('#pc-view').value=view;
}
function detail(){
 const c=courses.find(c=>c[0]===selected);if(!c){selected='';home();return}
 const d=docs(selected);
 host.innerHTML='<button type="button" class="pc-back" data-pc-back>← Voltar às matérias</button><section class="pc-detail" style="--pc-color:'+c[2]+'"><div class="pc-banner">Ψ</div><div class="pc-detail-body"><div class="pc-eyebrow">2026/2 · Prova final</div><h2>'+escape(c[1])+'</h2><p>'+escape(c[3])+'</p>'+meter(calc(selected))+'</div></section><h3 style="font-size:16px;margin:12px 0">Materiais da prova</h3>'+
 (d.length?d.map((x,i)=>'<div class="pc-resource"><span aria-hidden="true">▤</span><div class="pc-resource-title">'+escape(x.title||x.source||'Material')+'<small>Material '+(i+1)+' · Arquivo da biblioteca</small></div><a class="pc-open" href="#" data-library-file="'+escape(x.key)+'">Abrir material</a><label class="pc-complete"><input type="checkbox" data-pc-done="'+escape(x.key)+'" '+(marked(x)?'checked':'')+'> Concluído</label></div>').join(''):'<div class="pc-empty">Nenhum material publicado para a prova desta disciplina até o momento.</div>')+
 '<div class="pc-disclaimer">Marque o material como concluído após estudar. Os arquivos usam a abertura segura já existente no site.</div>';
}
function render(){if(host)(selected?detail():home())}
function mount(){
 if(host?.isConnected)return;
 const target=detect();if(!target||target===document.body||target===document.documentElement)return;
 css();for(const x of [...target.children])x.setAttribute('data-original-library','1');
 target.classList.add('pucrs-courses');
 host=document.createElement('div');host.id='pucrs-courses';target.appendChild(host);render();
}
document.addEventListener('click',event=>{
 const c=event.target.closest('[data-pc-course]');if(c){selected=c.dataset.pcCourse;render()}
 else if(event.target.closest('[data-pc-back]')){selected='';render()}
});
document.addEventListener('change',event=>{
 const t=event.target;
 if(t.id==='pc-progress'){progressFilter=t.value;render()}
 else if(t.id==='pc-sort'){sort=t.value;render()}
 else if(t.id==='pc-view'){view=t.value;render()}
 else if(t.matches('[data-pc-done]')){const x=items().find(i=>i.key===t.dataset.pcDone);if(x){mark(x,t.checked);render()}}
});
document.addEventListener('input',event=>{
 if(event.target.id!=='pc-search')return;
 const pos=event.target.selectionStart;filter=event.target.value;home();
 const next=host.querySelector('#pc-search');next.focus();next.setSelectionRange(pos,pos);
});
function start(){
 mount();
 new MutationObserver(()=>{if(!host?.isConnected)mount()}).observe(document.body,{childList:true,subtree:true});
 window.addEventListener('uentzoul:auth',render);
 window.addEventListener('uentzoul:library-updated',render);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();