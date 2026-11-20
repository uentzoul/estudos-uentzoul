/* PsicoMoodle — Trabalhos: primeira versão guiada, em prévia administrativa. */
(()=>{
'use strict';
const STORAGE='psicomoodle_trabalhos_v1_';
const STAGES=[
 {name:'Entender o enunciado',hint:'O que exatamente a atividade pede?',questions:['Qual é a pergunta central do professor?','Que entregáveis, formato e critérios precisam ser respeitados?','O que ainda preciso esclarecer antes de começar?']},
 {name:'Delimitar o tema',hint:'Transformar um tema amplo em uma questão viável.',questions:['Qual recorte cabe no tempo e no formato pedidos?','Qual pergunta meu trabalho realmente responderá?','O que ficará de fora do escopo?']},
 {name:'Pesquisar e selecionar fontes',hint:'Identificar fontes adequadas e registrar por que usá-las.',questions:['Quais materiais da disciplina são fundamentais?','Quais fontes adicionais precisam ser verificadas?','O que cada fonte acrescenta ao argumento?']},
 {name:'Planejar a estrutura',hint:'Definir uma sequência coerente antes de escrever.',questions:['Que partes ou slides serão necessários?','Que ideia cada parte precisa sustentar?','Como farei a ligação entre as partes?']},
 {name:'Desenvolver com autoria',hint:'Escrever e organizar as próprias interpretações.',questions:['Que argumentos consigo justificar com as fontes?','Onde preciso deixar minha análise mais explícita?','As contribuições de cada integrante estão claras?']},
 {name:'Conferir e finalizar',hint:'Comparar a entrega com o enunciado original.',questions:['Atendi a todos os itens pedidos?','Revisei referências, citações e formatação aplicáveis?','A apresentação ou entrega está coerente e pronta?']}
];
const TYPE_QUESTIONS={
 seminario:['Qual mensagem cada participante precisa explicar?','Como distribuir os tópicos sem repetir informações?','Qual será a relação entre fala e slides?'],
 resenha:['Qual é a tese do texto analisado?','Que argumentos o autor usa?','Quais são os limites e contribuições da obra?'],
 analise:['Que conceitos ajudam a interpretar o caso ou material?','Que evidências sustentam minha interpretação?','Que outras leituras são possíveis?'],
 pesquisa:['Qual problema orientará a pesquisa?','Qual método é viável?','Como apresentarei os resultados sem extrapolar os dados?'],
 relatorio:['Qual atividade ou observação está sendo relatada?','Como distinguir descrição e interpretação?','Qual conclusão é sustentada pelo que foi registrado?'],
 fichamento:['Que conceitos e argumentos precisam ser registrados?','Como separar citação direta, paráfrase e comentário próprio?','Quais páginas preciso anotar para conferir depois?'],
 outro:['Que resultado a atividade espera?','Quais critérios o professor forneceu?','Como comprovar que o objetivo foi atingido?']
};
const SUBJECTS=[['','Sem disciplina definida'],['tcc','Teorias e Modelos Comportamentais e Cognitivos (TCC)'],['familia','Psicologia da Família'],['avaliacao','Avaliação Psicológica'],['social','Psicologia Social I'],['meta','Metapsicologia'],['grupos','Psicologia de Grupos'],['outra','Outra disciplina']];
const TYPES=[['seminario','Seminário / apresentação'],['resenha','Resenha'],['analise','Análise crítica / de caso'],['pesquisa','Pesquisa / trabalho escrito'],['relatorio','Relatório'],['fichamento','Fichamento'],['outro','Outro']];
let view='list',chosen=null,notice='';
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const permitted=()=>Boolean(window.uentzoulAdminConfig?.isAdmin?.()&&window.uentzoulAIAuth?.user?.()?.id);
const userid=()=>window.uentzoulAIAuth?.user?.()?.id||'';
const storekey=()=>STORAGE+userid();
function read(){
 if(!permitted())return [];
 try{
  const raw=JSON.parse(localStorage.getItem(storekey())||'[]');
  return Array.isArray(raw)?raw.filter(x=>x&&typeof x==='object'&&typeof x.id==='string').slice(0,100):[];
 }catch(_){return [];}
}
function save(rows){
 if(!permitted())return false;
 try{localStorage.setItem(storekey(),JSON.stringify(rows));notice='Alterações salvas neste navegador.';return true;}
 catch(_){notice='Não foi possível salvar: verifique o espaço disponível neste navegador.';return false;}
}
function get(){return read().find(x=>x.id===chosen)||null;}
function rerenderWorks(){
 if(!permitted())return;
 window.PSICO_WORKS.forceRender=true;
 try{window.uentzoulAdminBridge?.refreshCurrent?.();}
 finally{window.PSICO_WORKS.forceRender=false;}
}
function edit(patch){
 const rows=read(),i=rows.findIndex(x=>x.id===chosen);
 if(i<0)return;
 rows[i]={...rows[i],...patch,updatedAt:new Date().toISOString()};
 save(rows);
}
function opt(value,label,current){return '<option value="'+esc(value)+'"'+(value===current?' selected':'')+'>'+esc(label)+'</option>';}
function options(items,value){return items.map(x=>opt(x[0],x[1],value)).join('');}
function dateLabel(x){
 if(!x)return 'Sem prazo';
 const bits=x.split('-');
 return bits.length===3?bits[2]+'/'+bits[1]+'/'+bits[0]:'Sem prazo';
}
function progress(x){const done=Array.isArray(x.done)?x.done:[];return done.filter(Boolean).length;}
function header(){
 return '<div class="pw-header"><div><p class="pw-kicker">Trabalhos acadêmicos <span>Prévia administrativa</span></p><h1>Trabalhos</h1><p>Organize o processo de construção de um trabalho sem receber uma resposta pronta.</p></div><div class="pw-privacy">Acesso de teste · somente administrador</div></div>';
}
function navigation(){
 return '<nav class="pw-tabs" aria-label="Áreas de Trabalhos">'+
  [['list','Meus trabalhos'],['new','Criar trabalho'],['route','Minha rota']].map(x=>
  '<button type="button" data-pw-nav="'+x[0]+'" class="'+(view===x[0]?'is-active':'')+'"'+(x[0]==='route'&&!get()?' disabled':'')+'>'+x[1]+'</button>').join('')+
 '</nav>';
}
function listView(){
 const rows=read().sort((a,b)=>(b.updatedAt||'').localeCompare(a.updatedAt||''));
 return '<div class="pw-overview"><div class="pw-overview-copy"><h2>Meus trabalhos</h2><p>Inicie pelo enunciado, registre suas decisões e avance etapa por etapa.</p></div><button type="button" class="pw-btn pw-primary" data-pw-nav="new">+ Criar trabalho</button></div>'+
 (rows.length?'<div class="pw-list">'+rows.map(x=>{
  const done=progress(x),pct=Math.round(done/STAGES.length*100);
  const subject=SUBJECTS.find(s=>s[0]===x.subject)?.[1]||'Outra disciplina';
  return '<article class="pw-job"><div class="pw-job-top"><span>'+esc(TYPES.find(t=>t[0]===x.type)?.[1]||'Trabalho')+'</span><span>'+esc(dateLabel(x.due))+'</span></div><h3>'+esc(x.title)+'</h3><p>'+esc(subject)+'</p><div class="pw-meter"><span style="width:'+pct+'%"></span></div><div class="pw-job-foot"><small>'+done+' de 6 etapas concluídas</small><button type="button" class="pw-btn" data-pw-open="'+esc(x.id)+'">Abrir rota</button></div></article>';
 }).join('')+'</div>':'<section class="pw-empty"><div class="pw-empty-icon">▤</div><h3>Nenhum trabalho cadastrado</h3><p>Crie um trabalho para transformar as instruções do professor em um plano de desenvolvimento.</p><button type="button" class="pw-btn pw-primary" data-pw-nav="new">Criar primeiro trabalho</button></section>')+
 '<p class="pw-footnote">Nesta versão de teste, os rascunhos ficam salvos apenas neste navegador, separados pela conta do administrador. Não há sincronização entre dispositivos.</p>';
}
function createView(){
 return '<section class="pw-sheet"><div class="pw-section-head"><h2>Criar um trabalho</h2><p>Preencha o que você já sabe. O enunciado não precisa estar completo para começar.</p></div>'+
 '<form id="pw-create" class="pw-form"><label class="pw-field">Título do trabalho<input name="title" required maxlength="140" placeholder="Ex.: Análise de um filme a partir da Psicologia da Família"></label>'+
 '<div class="pw-fields"><label class="pw-field">Disciplina<select name="subject">'+options(SUBJECTS,'')+'</select></label>'+
 '<label class="pw-field">Tipo de trabalho<select name="type">'+options(TYPES,'seminario')+'</select></label></div>'+
 '<div class="pw-fields"><label class="pw-field">Prazo de entrega<input type="date" name="due"></label>'+
 '<label class="pw-field">Integrantes (opcional)<input name="members" maxlength="500" placeholder="Nomes separados por vírgula"></label></div>'+
 '<label class="pw-field">Enunciado ou orientações do professor<textarea name="prompt" rows="9" maxlength="20000" placeholder="Cole aqui as instruções, os critérios de avaliação, as exigências de formato e as informações importantes."></textarea></label>'+
 '<p class="pw-field-hint">O sistema não escreve o trabalho: ele organiza exigências, propõe perguntas orientadoras e ajuda você a acompanhar as decisões.</p>'+
 '<div class="pw-form-actions"><button type="button" class="pw-btn" data-pw-nav="list">Cancelar</button><button class="pw-btn pw-primary" type="submit">Criar e abrir minha rota</button></div></form></section>';
}
function insights(x){
 const text=x.prompt||'',hits=[];
 const tests=[
  ['Normas e citações',/\babnt\b|referênci|citaç|bibliograf/i],
  ['Apresentação ou slides',/apresentaç|slide|seminário|exposição oral/i],
  ['Extensão ou número de páginas',/página|lauda|palavra|caractere|pág\./i],
  ['Fontes e leituras obrigatórias',/artig|capítulo|livro|leitura|autor|texto.base|fonte/i],
  ['Avaliação e prazo',/critério|avaliaç|entrega|prazo|data limite/i],
  ['Trabalho em grupo',/\bgrupo\b|equipe|integrante|coletiv/i]
 ];
 for(const [label,re] of tests)if(re.test(text))hits.push(label);
 return '<div class="pw-box"><div class="pw-box-title"><h3>Raio-X do enunciado</h3><small>Leitura orientadora, não validação automática</small></div>'+
 (text.trim()?'<p class="pw-label">Aspectos identificados para conferir:</p>'+(hits.length?'<div class="pw-chips">'+hits.map(s=>'<span>'+esc(s)+'</span>').join('')+'</div>':'<p class="pw-muted">Não foram identificadas exigências específicas por palavras-chave. Confira o enunciado integralmente.</p>')+'<details class="pw-prompt"><summary>Ver enunciado original</summary><p>'+esc(text)+'</p></details>':'<p class="pw-muted">Ainda não há um enunciado. Você pode acrescentá-lo na seção “Detalhes”.</p>')+
 '<p class="pw-helper">Confirme o que o professor realmente pediu. Os itens detectados são apenas pistas, não substituem a leitura.</p></div>';
}
function checklist(x){
 const items=Array.isArray(x.checks)?x.checks:[];
 return '<div class="pw-box"><div class="pw-box-title"><h3>Conferência das exigências</h3><small>'+items.filter(y=>y.ok).length+' / '+items.length+' conferidas</small></div>'+
 (items.length?'<div class="pw-checklist">'+items.map(y=>
 '<label class="pw-check"><input type="checkbox" data-pw-check="'+esc(y.id)+'"'+(y.ok?' checked':'')+'><span>'+esc(y.label)+'</span></label>').join('')+'</div>':'<p class="pw-muted">Adicione exigências do professor e marque cada uma após conferir.</p>')+
 '<form id="pw-add-check" class="pw-add-inline"><input aria-label="Nova exigência" name="label" required maxlength="240" placeholder="Ex.: Usar dois artigos obrigatórios"><button type="submit" class="pw-btn">Adicionar</button></form></div>';
}
function routeView(){
 const x=get();
 if(!x)return '<section class="pw-empty"><h2>Selecione um trabalho</h2><p>Abra uma rota em “Meus trabalhos” para acompanhar as etapas.</p><button type="button" class="pw-btn" data-pw-nav="list">Ver trabalhos</button></section>';
 const done=progress(x),idx=Math.min(STAGES.length-1,Math.max(0,Number(x.stage)||0));
 const stage=STAGES[idx];
 const q=[...stage.questions,...(idx===3||idx===4?TYPE_QUESTIONS[x.type]||TYPE_QUESTIONS.outro:[])];
 return '<div class="pw-workbar"><div><button type="button" class="pw-back" data-pw-nav="list">‹ Voltar aos trabalhos</button><h2>'+esc(x.title)+'</h2><p>'+esc(TYPES.find(t=>t[0]===x.type)?.[1]||'Trabalho')+' · '+esc(dateLabel(x.due))+'</p></div><div class="pw-workbar-actions"><button type="button" class="pw-btn" data-pw-export>Exportar roteiro (.txt)</button><button type="button" class="pw-btn pw-danger" data-pw-delete>Excluir</button></div></div>'+
 '<section class="pw-flow"><div class="pw-flow-head"><strong>Minha rota</strong><span>'+done+' de 6 etapas concluídas</span></div><div class="pw-meter"><span style="width:'+Math.round(done/6*100)+'%"></span></div><div class="pw-steps">'+STAGES.map((s,i)=>'<button type="button" data-pw-stage="'+i+'" class="pw-step '+(i===idx?'is-selected':'')+(x.done?.[i]?' is-done':'')+'"><span class="pw-step-index">'+(x.done?.[i]?'✓':i+1)+'</span><span>'+esc(s.name)+'</span></button>').join('')+'</div></section>'+
 '<div class="pw-columns"><div class="pw-main-column">'+
 '<section class="pw-sheet"><div class="pw-section-head"><p class="pw-label">Etapa '+(idx+1)+' de 6</p><h2>'+esc(stage.name)+'</h2><p>'+esc(stage.hint)+'</p></div>'+
 '<div class="pw-questions"><h3>Perguntas para orientar a construção</h3>'+q.map((s,i)=>'<p><span>'+String(i+1).padStart(2,'0')+'</span>'+esc(s)+'</p>').join('')+'</div>'+
 '<label class="pw-field" for="pw-stage-notes">Anotações desta etapa<textarea id="pw-stage-notes" data-pw-stage-notes="'+idx+'" rows="7" maxlength="12000" placeholder="Registre suas reflexões e escolhas com suas próprias palavras.">'+esc(x.notes?.[idx]||'')+'</textarea></label>'+
 '<div class="pw-form-actions"><button type="button" class="pw-btn" data-pw-complete="'+idx+'">'+(x.done?.[idx]?'✓ Marcar como pendente':'Marcar etapa como concluída')+'</button>'+(idx<5?'<button type="button" class="pw-btn pw-primary" data-pw-stage="'+(idx+1)+'">Próxima etapa →</button>':'')+'</div></section>'+
 '<section class="pw-sheet"><div class="pw-section-head"><h2>Mapa de decisões</h2><p>Registre o que foi definido e por quê. Você pode voltar e modificar depois.</p></div>'+
 '<div class="pw-fields"><label class="pw-field">Recorte do tema<textarea data-pw-field="scope" rows="3" placeholder="Que parte do tema será estudada?">'+esc(x.scope||'')+'</textarea></label><label class="pw-field">Problema / pergunta central<textarea data-pw-field="question" rows="3" placeholder="Que pergunta o trabalho pretende responder?">'+esc(x.question||'')+'</textarea></label></div>'+
 '<label class="pw-field">Caminho escolhido<select data-pw-field="approach">'+options([['','Ainda não definido'],['bibliografica','Pesquisa bibliográfica'],['caso','Análise de caso / obra'],['campo','Observação ou pesquisa de campo'],['documental','Análise documental'],['outro','Outro caminho']],x.approach||'')+'</select></label>'+
 '<label class="pw-field">Decisões, justificativas e argumentos<textarea data-pw-field="decisions" rows="4" placeholder="Que escolhas foram feitas? Quais outras opções foram consideradas?">'+esc(x.decisions||'')+'</textarea></label>'+
 '<label class="pw-field">Fontes e referências a conferir<textarea data-pw-field="sources" rows="4" placeholder="Anote autores, materiais, links e páginas para conferir.">'+esc(x.sources||'')+'</textarea></label></section>'+
 '<section class="pw-sheet"><div class="pw-section-head"><h2>Trabalho em grupo</h2><p>Distribua responsabilidades e registre combinados. Ainda não é uma área colaborativa compartilhada.</p></div>'+
 '<label class="pw-field">Integrantes<textarea data-pw-field="members" rows="2" placeholder="Quem faz parte do grupo?">'+esc(x.members||'')+'</textarea></label>'+
 '<label class="pw-field">Divisão de tarefas e combinados<textarea data-pw-field="tasks" rows="4" placeholder="Ex.: revisão das fontes, organização dos slides, apresentação...">'+esc(x.tasks||'')+'</textarea></label></section>'+
 '<section class="pw-sheet"><div class="pw-section-head"><h2>Detalhes do trabalho</h2><p>Atualize as instruções sem perder as etapas já concluídas.</p></div>'+
 '<label class="pw-field">Título<input data-pw-field="title" maxlength="140" value="'+esc(x.title)+'"></label>'+
 '<div class="pw-fields"><label class="pw-field">Tipo<select data-pw-field="type">'+options(TYPES,x.type)+'</select></label><label class="pw-field">Entrega<input type="date" data-pw-field="due" value="'+esc(x.due||'')+'"></label></div>'+
 '<label class="pw-field">Orientações do professor<textarea data-pw-field="prompt" rows="7" maxlength="20000">'+esc(x.prompt||'')+'</textarea></label></section></div>'+
 '<aside class="pw-side-column">'+insights(x)+checklist(x)+
 '<div class="pw-box"><h3>Como usar esta área</h3><p class="pw-muted">Primeiro entenda a proposta, depois escolha seu recorte e registre as fontes. O roteiro não substitui a orientação do professor e não produz o texto final.</p><p class="pw-muted">As alterações são salvas quando você sai do campo ou marca uma etapa.</p></div></aside></div>';
}
function render(){
 if(!permitted())return '<section class="panel"><h2>Acesso restrito</h2><p>A área de Trabalhos está em desenvolvimento e ainda não está disponível para estudantes.</p></section>';
 if(view==='route'&&!get())view='list';
 return '<div id="pmWorks" class="pw-root">'+header()+navigation()+(notice?'<p class="pw-save-note" role="status">'+esc(notice)+'</p>':'')+(view==='new'?createView():view==='route'?routeView():listView())+'</div>';
}
function afterRender(){}
function open(id){chosen=id;view='route';notice='';rerenderWorks();}
function newId(){return crypto?.randomUUID?.()||('w'+Date.now()+'_'+Math.random().toString(36).slice(2));}
function suggestedChecks(prompt){
 return String(prompt||'').split(/\r?\n/).filter(line=>/^\s*(?:[-*•]\s+|\d+[.)]\s+)/.test(line)).map(line=>line.replace(/^\s*(?:[-*•]\s+|\d+[.)]\s+)/,'').trim()).filter(line=>line.length>=8&&line.length<=240).slice(0,15).map(label=>({id:newId(),label,ok:false}));
}
function create(form){
 const data=new FormData(form),title=String(data.get('title')||'').trim();
 if(!title)return;
 const row={id:newId(),title,subject:String(data.get('subject')||''),type:String(data.get('type')||'outro'),due:String(data.get('due')||''),members:String(data.get('members')||''),prompt:String(data.get('prompt')||''),done:[false,false,false,false,false,false],notes:['','','','','',''],stage:0,checks:suggestedChecks(String(data.get('prompt')||'')),scope:'',question:'',approach:'',decisions:'',sources:'',tasks:'',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
 const rows=read();rows.push(row);
 if(save(rows)){chosen=row.id;view='route';rerenderWorks();}
}
function download(x){
 const lines=['TRABALHO: '+x.title,'Tipo: '+(TYPES.find(t=>t[0]===x.type)?.[1]||''),'Entrega: '+dateLabel(x.due),'Integrantes: '+(x.members||''),'','ENUNCIADO',x.prompt||'(não informado)','','MAPA DE DECISÕES','Recorte: '+(x.scope||''),'Pergunta central: '+(x.question||''),'Caminho: '+(x.approach||''),'Decisões: '+(x.decisions||''),'Fontes a conferir: '+(x.sources||''),'Divisão de tarefas: '+(x.tasks||''),'','ETAPAS'];
 STAGES.forEach((s,i)=>lines.push((x.done?.[i]?'[x] ':'[ ] ')+s.name,'Anotações: '+(x.notes?.[i]||''),''));
 lines.push('EXIGÊNCIAS A CONFERIR');
 (x.checks||[]).forEach(y=>lines.push((y.ok?'[x] ':'[ ] ')+y.label));
 const blob=new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='roteiro-trabalho-'+x.id.slice(0,8)+'.txt';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
document.addEventListener('click',e=>{
 if(!permitted()||!e.target.closest('#pmWorks'))return;
 const nav=e.target.closest('[data-pw-nav]');
 if(nav){view=nav.dataset.pwNav;notice='';rerenderWorks();return;}
 const openBtn=e.target.closest('[data-pw-open]');
 if(openBtn){open(openBtn.dataset.pwOpen);return;}
 const step=e.target.closest('[data-pw-stage]');
 if(step){const i=Number(step.dataset.pwStage);if(i>=0&&i<6){edit({stage:i});rerenderWorks();}return;}
 const complete=e.target.closest('[data-pw-complete]');
 if(complete){const x=get();if(!x)return;const i=Number(complete.dataset.pwComplete),done=[...x.done];done[i]=!done[i];edit({done});rerenderWorks();return;}
 if(e.target.closest('[data-pw-export]')){const x=get();if(x)download(x);return;}
 if(e.target.closest('[data-pw-delete]')){const x=get();if(!x||!confirm('Excluir este trabalho e suas anotações salvas neste navegador?'))return;save(read().filter(row=>row.id!==x.id));chosen=null;view='list';rerenderWorks();}
});
document.addEventListener('submit',e=>{
 if(!permitted()||!e.target.closest('#pmWorks'))return;
 if(e.target.id==='pw-create'){e.preventDefault();create(e.target);return;}
 if(e.target.id==='pw-add-check'){
  e.preventDefault();const label=String(new FormData(e.target).get('label')||'').trim(),x=get();
  if(!label||!x)return;
  edit({checks:[...(x.checks||[]),{id:newId(),label,ok:false}]});
  rerenderWorks();
 }
});
document.addEventListener('change',e=>{
 if(!permitted()||!e.target.closest('#pmWorks'))return;
 const check=e.target.closest('[data-pw-check]'),x=get();
 if(check&&x){edit({checks:(x.checks||[]).map(y=>y.id===check.dataset.pwCheck?{...y,ok:check.checked}:y)});rerenderWorks();return;}
 if(!x)return;
 const field=e.target.closest('[data-pw-field]');
 if(field){edit({[field.dataset.pwField]:field.value});return;}
 const notes=e.target.closest('[data-pw-stage-notes]');
 if(notes){const i=Number(notes.dataset.pwStageNotes),arr=[...x.notes];if(i>=0&&i<6){arr[i]=notes.value;edit({notes:arr});}}
});
window.PSICO_WORKS={render,afterRender,hasAccess:permitted,forceRender:false};
})();