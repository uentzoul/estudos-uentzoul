(()=>{'use strict';const catalog=window.PSICO_TRAIL_CURRICULUM;const trail=window.PSICO_STUDY_TRAILS;if(!catalog||!trail)return;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const topicsFor=(ctx,names)=>names.map(n=>(ctx.topics||[]).find(t=>norm(t.title)===norm(n))).filter(Boolean);
const docsFor=(ctx,queries)=>{
 const result=[];
 for(const q of queries||[]){
  const m=(ctx.materials||[]).find(x=>x.available&&(x.url||x._libraryUpload)&&norm([x.title,x.source].join(' ')).includes(norm(q)));
  if(m&&!result.includes(m))result.push(m);
  if(result.length===2)break;
 }
 return result;
};
const audioFor=(ctx,numbers)=>{
 const selected=new Set(numbers||[]);
 return (ctx.episodes||[]).map((e,i)=>({...e,index:i})).filter(e=>selected.has(Number(e.n))&&ctx.episodeAvailable?.(e.index)&&/^https:\/\//.test(e.src||'')).slice(0,3);
};
const heading=(title,sub='')=>'<div class="ti-block-heading"><h3>'+esc(title)+'</h3>'+(sub?'<span>'+esc(sub)+'</span>':'')+'</div>';
function concepts(ctx,topics){
 return '<section class="ti-block">'+heading('Conceitos essenciais',topics.length+' pontos selecionados')+
 '<div class="ti-concept-grid">'+topics.map(t=>'<article class="ti-concept"><strong>'+esc(t.title)+'</strong><p>'+esc(t.definition)+'</p>'+
 (t.scenario?'<details><summary>Exemplo de aplicação</summary><p>'+esc(t.scenario)+'</p></details>':'')+
 (t.myth?'<details><summary>Erro que deve ser evitado</summary><p><b>Afirmação incorreta:</b> '+esc(t.myth)+'</p><p><b>Por que está errado?</b> '+esc(window.PSICO_REVIEW_ERRORS?.explain?.(ctx.subject,t)||t.definition)+'</p></details>':'')+
 '</article>').join('')+'</div></section>';
}
function readings(ctx,docs){
 if(!docs.length)return '';
 return '<section class="ti-block">'+heading('Leitura escolhida','Para aprofundar sem ler uma apresentação inteira')+
 '<div class="ti-reading-list">'+docs.map(m=>{
 const url=m._libraryUpload?'#':m.url,attr=m._libraryUpload?' data-library-file="'+esc(m._libraryKey)+'"':'';
 return '<a class="ti-reading" href="'+esc(url)+'"'+attr+' target="_blank" rel="noopener noreferrer"><span>▤</span><span><strong>'+esc(m.title)+'</strong><small>Consulte os conceitos trabalhados nesta etapa</small></span><span>↗</span></a>';
 }).join('')+'</div></section>';
}

window.PSICO_TRAIL_STATUS='carregado';})();