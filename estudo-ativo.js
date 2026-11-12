(()=>{
'use strict';
if(window.PSICO_PRACTICE)return;
const state={};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=s=>String(s??'').replace(/\s+/g,' ').trim();
function own(){try{return window.uentzoulAIAuth?.user?.()?.id||'visitante'}catch{return 'visitante'}}
function S(id){return state[id]||(state[id]={id,semester:'2026/2',topics:[],position:0,flipped:false,again:false,seen:new Set(),caseIndex:-1,step:0,chosen:-1,previous:'',finished:false})}
function cards(id){
 const all=[];S(id).topics.forEach(t=>{
  if(!t?.title||!t?.definition)return;
  const key=id+':'+n(t.title).toLowerCase();
  all.push({key:key+':def',tag:t.title,front:'O que significa '+n(t.title)+'?',back:t.definition});
  if(t.scenario)all.push({key:key+':caso',tag:'Aplicação',front:n(t.scenario)+'\nQual conceito ajuda a entender?',back:n(t.title)+': '+n(t.definition)});
  if(t.myth)all.push({key:key+':mito',tag:'Erro comum',front:'Verdadeiro ou falso?\n'+n(t.myth),back:'Falso. '+n(t.definition)});
 });
 return all;
}
function key(id){return 'psicomoodle:flash:v1:'+S(id).semester+':'+own()+':'+id}
function records(id){try{return JSON.parse(localStorage.getItem(key(id))||'{}')||{}}catch{return {}}}
function save(id,r){try{localStorage.setItem(key(id),JSON.stringify(r))}catch(e){console.warn('Não foi possível salvar a revisão deste dispositivo',e)}}
function due(id){
 const s=S(id),r=records(id);return cards(id).filter(c=>s.again?!s.seen.has(c.key):!r[c.key]||Number(r[c.key].due||0)<=Date.now());
}
function cardView(id){
 const s=S(id),all=cards(id),queue=due(id),data=records(id);s.position=Math.min(s.position,Math.max(0,queue.length-1));
 const count=all.filter(c=>data[c.key]?.hits>0).length;
 const shell='<section class="as-shell" data-active-mode="flash" data-active-id="'+esc(id)+'"><header class="as-head"><div><small>RECORDAÇÃO ATIVA</small><h2>Flashcards</h2><p>Responde mentalmente, vira o cartão e marca se lembrou. Os assuntos esquecidos voltam antes nas próximas revisões.</p></div><span>'+all.length+' cartões</span></header>';
 if(!all.length)return shell+'<div class="as-empty">Não há conteúdos preparados para criar flashcards nesta disciplina.</div></section>';
 if(!queue.length)return shell+'<div class="as-complete"><div class="as-complete-symbol">✓</div><h3>Revisão concluída por enquanto</h3><p>As próximas revisões aparecerão conforme os intervalos de estudo.</p><p>'+count+' cartões lembrados ao menos uma vez</p><button class="as-primary" type="button" data-active-action="again">Revisar todos agora</button></div></section>';
 const c=queue[s.position];
 return shell+'<div class="as-info"><span>'+queue.length+' disponíveis para revisão</span><span>'+(s.position+1)+' de '+queue.length+'</span></div>'+
 '<button type="button" class="as-card '+(s.flipped?'is-flipped':'')+'" data-active-action="flip" aria-label="Virar flashcard"><span class="as-card-inner"><span class="as-face as-front"><small>'+esc(c.tag)+'</small><strong>'+esc(c.front).replace(/\n/g,'<br>')+'</strong><em>Toca para virar ↻</em></span><span class="as-face as-back"><small>RESPOSTA</small><strong>'+esc(c.back)+'</strong><em>Toca para voltar ↻</em></span></span></button>'+
 (s.flipped?'<div class="as-actions"><button type="button" class="as-secondary" data-active-action="miss">Não lembrei</button><button class="as-primary" data-active-action="hit" type="button">Lembrei</button></div>':
 '<div class="as-actions"><button type="button" class="as-secondary" data-active-action="skip">Pular</button><button class="as-primary" data-active-action="flip" type="button">Mostrar resposta</button></div>')+
 '<p class="as-note">Sem pontuação ou ranking. O histórico de revisão fica salvo neste dispositivo e separado por conta.</p></section>';
}
function listView(id){
 const list=window.PSICO_CASES?.[id]||[];
 return '<section class="as-shell" data-active-mode="case" data-active-id="'+esc(id)+'"><header class="as-head"><div><small>LABORATÓRIO DE CASOS</small><h2>Estudos de casos</h2><p>Situações fictícias com decisões, consequências e explicações. O objetivo é exercitar raciocínio, não adivinhar diagnósticos.</p></div><span>'+list.length+' casos</span></header>'+
 '<div class="as-case-list">'+list.map((c,i)=>'<button type="button" class="as-case-tile" data-active-action="open" data-index="'+i+'"><span>'+String(i+1).padStart(2,'0')+'</span><strong>'+esc(c.title)+'</strong><small>'+esc(c.area)+'</small><b aria-hidden="true">→</b></button>').join('')+'</div></section>';
}
function caseView(id){
 const s=S(id),all=window.PSICO_CASES?.[id]||[],c=all[s.caseIndex];if(!c)return listView(id);
 const start='<section class="as-shell" data-active-mode="case" data-active-id="'+esc(id)+'"><div class="as-case-nav"><button type="button" data-active-action="back">← Todos os casos</button><span>Caso '+(s.caseIndex+1)+' de '+all.length+'</span></div><div class="as-case-hero"><small>'+esc(c.area)+'</small><h2>'+esc(c.title)+'</h2><p>'+esc(c.intro)+'</p></div>';
 if(s.finished)return start+'<div class="as-complete"><div class="as-complete-symbol">✓</div><h3>Fim do caso</h3><p>'+esc(c.wrapUp)+'</p><button class="as-secondary" data-active-action="restart" type="button">Recomeçar</button><button class="as-primary" data-active-action="next" type="button">Próximo caso</button></div></section>';
 const st=c.stages[s.step];if(!st)return listView(id);
 const opts=st.choices.map((o,i)=>'<button type="button" class="as-choice '+(s.chosen===i?'selected':'')+'" data-active-action="choose" data-index="'+i+'" '+(s.chosen>=0?'disabled':'')+'><span>'+String.fromCharCode(65+i)+'</span>'+esc(o.label)+'</button>').join('');
 const feedback=s.chosen<0?'':'<div class="as-feedback"><h4>Consequência da escolha</h4><p>'+esc(st.choices[s.chosen].outcome)+'</p><h4>Como interpretar</h4><p>'+esc(st.choices[s.chosen].reason)+'</p></div><div class="as-actions"><button class="as-primary" type="button" data-active-action="continue">'+(s.step+1===c.stages.length?'Concluir caso':'Continuar o caso')+'</button></div>';
 return start+'<div class="as-case-step"><span>Decisão '+(s.step+1)+' de '+c.stages.length+'</span><span class="as-step-track"><i style="width:'+(100*(s.step+1)/c.stages.length)+'%"></i></span></div>'+
 (s.previous?'<div class="as-previous"><strong>Resultado anterior</strong><p>'+esc(s.previous)+'</p></div>':'')+
 '<div class="as-situation"><h3>'+esc(st.prompt)+'</h3><div class="as-choices">'+opts+'</div></div>'+feedback+'</section>';
}
function refresh(root){const id=root.dataset.activeId;root.outerHTML=root.dataset.activeMode==='flash'?cardView(id):caseView(id)}
window.PSICO_PRACTICE={
 flashcards(id,topics,semester){const s=S(id);s.topics=Array.isArray(topics)?topics:[];s.semester=semester||'2026/2';return cardView(id)},
 cases(id){return (window.PSICO_CASES?.[id]?.length?caseView(id):'<div class="as-empty">Nenhum caso disponível nesta matéria.</div>')},
 hasCases(id){return !!window.PSICO_CASES?.[id]?.length}
};
document.addEventListener('click',e=>{
 const btn=e.target instanceof Element?e.target.closest('[data-active-action]'):null;if(!btn)return;
 const root=btn.closest('[data-active-mode][data-active-id]');if(!root)return;
 const id=root.dataset.activeId,s=S(id),action=btn.dataset.activeAction;
 e.preventDefault();
 if(root.dataset.activeMode==='flash'){
  if(action==='again'){s.again=true;s.seen.clear();s.position=0;s.flipped=false}
  if(action==='flip')s.flipped=!s.flipped;
  if(action==='skip'){s.position=(s.position+1)%Math.max(due(id).length,1);s.flipped=false}
  if(action==='hit'||action==='miss'){
   const c=due(id)[s.position];if(!c)return;const r=records(id),old=r[c.key]||{hits:0,misses:0};
   const hits=action==='hit'?Math.min(10,old.hits+1):0;
   const days=[1,3,7,14,30,60,90];
   r[c.key]={hits,misses:old.misses+(action==='miss'?1:0),due:Date.now()+(action==='hit'?days[Math.min(hits-1,days.length-1)]*86400000:600000)};
   save(id,r);if(s.again)s.seen.add(c.key);
   s.position=0;s.flipped=false;
  }
 }else{
  if(action==='open'){s.caseIndex=Number(btn.dataset.index);s.step=0;s.chosen=-1;s.previous='';s.finished=false}
  if(action==='back')s.caseIndex=-1;
  if(action==='restart'){s.step=0;s.chosen=-1;s.previous='';s.finished=false}
  if(action==='choose'&&s.chosen<0)s.chosen=Number(btn.dataset.index);
  if(action==='continue'&&s.chosen>=0){
   const c=window.PSICO_CASES[id][s.caseIndex];
   s.previous=c.stages[s.step].choices[s.chosen].outcome;
   s.step++;s.chosen=-1;
   if(s.step>=c.stages.length)s.finished=true;
  }
  if(action==='next'){const n=window.PSICO_CASES[id].length;s.caseIndex=(s.caseIndex+1)%n;s.step=0;s.chosen=-1;s.previous='';s.finished=false}
 }
 refresh(root);
});
})();