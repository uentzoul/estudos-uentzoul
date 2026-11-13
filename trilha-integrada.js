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


function podcasts(ctx,episodes){
 if(!episodes.length)return '';
 return '<section class="ti-block">'+heading('Podcasts específicos','Reproduza nesta página')+
 '<div class="ti-podcast-list">'+episodes.map(e=>
 '<article class="ti-podcast"><div class="ti-podcast-title"><span>♫</span><div><small>EPISÓDIO '+String(e.n).padStart(2,'0')+'</small><strong>'+esc(e.title)+'</strong></div></div>'+
 '<audio controls preload="none" playsinline src="'+esc(e.src)+'" aria-label="Ouvir podcast '+esc(e.title)+'"></audio>'+
 '<div class="ti-podcast-tools"><label>Velocidade <select data-ti-speed aria-label="Velocidade de reprodução">'+
 ['0.5','0.75','1','1.25','1.5','2'].map(v=>'<option value="'+v+'"'+(v==='1'?' selected':'')+'>'+v.replace('.',',')+'×</option>').join('')+
 '</select></label><button type="button" data-ti-download="'+esc(e.src)+'" data-ti-filename="'+esc(e.title)+'">↓ Baixar</button></div></article>').join('')+'</div></section>';
}
function flashcards(ctx,topics){
 let cards=window.PSICO_PRACTICE?.focusCards?.(ctx.subject,ctx.topics||[],topics.map(t=>t.title),4)||[];
 if(!cards.length)cards=topics.slice(0,4).map(t=>({key:'fallback:'+ctx.subject+':'+norm(t.title),tag:'Compreensão',front:'Explique '+t.title+'.',back:t.definition}));
 return '<section class="ti-block">'+heading('Flashcards específicos','Vire os cartões para conferir')+
 '<div class="ti-flash-grid">'+cards.map((c,i)=>
 '<article class="ti-flash-card"><small>'+esc(c.tag||'Recordação ativa')+' · '+(i+1)+'</small>'+
 '<button type="button" data-ti-flip aria-expanded="false"><span class="ti-flash-front">'+esc(c.front).replace(/\n/g,' ')+'</span>'+
 '<span class="ti-flash-back" hidden>'+esc(c.back).replace(/\n/g,' ')+'</span><em>Clique para revelar a resposta</em></button>'+
 '<button class="ti-flash-mark" type="button" data-ti-mark="'+esc(c.key)+'" data-ti-subject="'+esc(ctx.subject)+'"'+(c.remembered?' disabled':'')+'>'+(c.remembered?'✓ Lembrado':'✓ Lembrei')+'</button></article>').join('')+'</div></section>';
}


function guidedQuestions(ctx,topics){
 const result=[],seen=new Set(),words=new Set(topics.flatMap(t=>norm(t.title).split(/[^a-z0-9]+/).filter(w=>w.length>5)));
 for(const guide of window.PSICO_GUIDES?.[ctx.subject]||[]){
  for(const q of guide.questions||[]){
   const label=norm(q.topic||q.section||''),phrase=norm(q.question||'');
   if(!phrase||seen.has(phrase))continue;
   let score=topics.some(t=>label&&label===norm(t.title))?10:0;
   if(!score)for(const word of words){if(label.includes(word))score+=2;else if(phrase.includes(word))score++;}
   if(score>=3){seen.add(phrase);result.push({q,origin:guide.status==='original'?'Questão do estudo dirigido original':'Revisão temática adaptada'});}
   if(result.length>=2)break;
  }
  if(result.length>=2)break;
 }
 if(!result.length)for(const t of topics.slice(0,2))result.push({
  q:{question:'Explique '+t.title+' e mostre por que esta afirmação está incorreta: '+(t.myth||'o contexto nunca importa.'),
   explanation:t.definition+' '+(t.myth?(window.PSICO_REVIEW_ERRORS?.explain?.(ctx.subject,t)||''):'')},
  origin:'Questão de revisão elaborada para a trilha'
 });
 return result;
}
function guided(ctx,topics){
 const list=guidedQuestions(ctx,topics);
 if(!list.length)return '';
 return '<details class="ti-guided"><summary><span>▣</span><strong>Estudo dirigido deste assunto</strong><small>'+list.length+' '+(list.length===1?'questão':'questões')+'</small><span aria-hidden="true">⌄</span></summary>'+
 '<div class="ti-guided-content">'+list.map(({q,origin},i)=>
 '<article class="ti-question"><small>'+esc(origin)+' · '+(i+1)+'</small><p>'+esc(q.question)+'</p>'+
 (q.options?.length?'<ol type="A">'+q.options.map(o=>'<li>'+esc(o.text)+'</li>').join('')+'</ol>':'')+
 '<details><summary>Ver resposta comentada</summary><div>'+
 (q.answer&&q.options?.length?'<strong>Gabarito: '+esc(q.answer)+'</strong>':'')+
 '<p>'+esc(q.explanation||'Consulte o conceito indicado acima.')+'</p>'+
 (q.contrast?'<p>'+esc(q.contrast)+'</p>':'')+'</div></details></article>').join('')+'</div></details>';
}
function finalTests(ctx){
 const exams=(ctx.exams||[]).slice(0,5);
 if(!exams.length)return '';
 return '<section class="ti-tests"><span>REVISÃO FINAL</span><h2>Teste o que aprendeu</h2>'+
 '<p>Faça uma prova e use a correção para identificar quais conceitos precisam de mais estudo.</p><div>'+
 exams.map((e,i)=>'<button type="button" data-action="test:'+esc(e.id)+'">Simulado '+(i+1)+' <span aria-hidden="true">→</span></button>').join('')+'</div></section>';
}

window.PSICO_TRAIL_STATUS='carregado';})();