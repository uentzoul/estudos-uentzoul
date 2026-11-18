
(()=>{
'use strict';
if(window.__uentzoulConcursoLoaded)return;
window.__uentzoulConcursoLoaded=true;
const D=window.CONCURSO_DATA;
if(!D){console.error('Conteúdo de Concursos indisponível');return;}
const $=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const client=()=>window.uentzoulAIAuth?.client?.();
const user=()=>{const u=window.uentzoulAIAuth?.user?.();return u?.id&&!u.is_anonymous?u:null;};
const subjects=Object.fromEntries(D.subjects.map(x=>[x.id,x]));
const topics=Object.fromEntries(D.topics.map(x=>[x.id,x]));
const qById=Object.fromEntries(D.questions.map(x=>[x.id,x]));
const priorities={domino:0,revisar:1,estudar:2.25,prioridade:3.75};
const pLabels={domino:'Já domino · dispensar',revisar:'Revisão rápida',estudar:'Preciso estudar',prioridade:'Tenho dificuldade · priorizar'};
const defaultState=()=>({settings:{},plan:[],completed:{},answers:{},flashcards:{},notes:{}});
let store=defaultState(),rights={id:null,admin:false,concurso:false},active=false,external=false,checking=false,working=false;
let view='inicio',subject='todos',noteSubject='portugues',dayIndex=0,session=null,cardFilter='todos',cardIndex=0,cardFlipped=false,roleList=[],roleSet=new Set();
const NAV_KEY='uentzoul:concursos:nav:v1';
function rememberView(){try{sessionStorage.setItem(NAV_KEY,JSON.stringify({view,dayIndex,subject,noteSubject}))}catch(e){}}
function restoreView(){try{const v=JSON.parse(sessionStorage.getItem(NAV_KEY)||'null');if(v&&['inicio','configurar','dia','materias','materia','banco','simulados','flashcards','caderno'].includes(v.view)){view=v.view;dayIndex=Math.max(0,Math.min(23,Number(v.dayIndex)||0));if(subjects[v.subject])subject=v.subject;if(subjects[v.noteSubject])noteSubject=v.noteSubject;}}catch(e){}}
let saveJob=0,renderJob=0;
const allowed=()=>!!rights.id&&(rights.admin||rights.concurso);
const onlyContest=()=>rights.concurso&&!rights.admin;
const settingsFor=id=>store.settings[id]||'revisar';
const dateOf=i=>new Date(Date.UTC(2026,10,19+i)).toISOString().slice(0,10);
const shortDate=s=>s.slice(8)+'/'+s.slice(5,7);
const shuffle=a=>a.map(v=>({v,r:Math.random()})).sort((a,b)=>a.r-b.r).map(x=>x.v);
const doneCount=()=>Object.values(store.completed).filter(Boolean).length;
const acc=()=>{const a=Object.entries(store.answers).filter(([id])=>!!qById[id]).map(([,v])=>v);return a.length?Math.round(a.filter(x=>x.correct).length/a.length*100):0;};
function toast(message){
 let el=$('concursosToast');
 if(!el){el=document.createElement('div');el.id='concursosToast';el.style.cssText='position:fixed;z-index:100000;bottom:18px;right:16px;max-width:320px;padding:13px 17px;background:#302b46;color:#fff;border-radius:12px;box-shadow:0 8px 28px #0004;font:600 13px system-ui';document.body.append(el);}
 el.textContent=message;clearTimeout(el.timer);el.timer=setTimeout(()=>el.remove(),4600);
}
async function load(){
 const c=client();if(!c||!rights.id)return;
 const r=await c.from('uentzoul_concurso_progress').select('settings,plan,completed,answers,flashcards,notes').eq('user_id',rights.id).maybeSingle();
 if(r.error){console.warn('Concursos: falha ao carregar dados',r.error);return;}
 const d=r.data||{};
 store={...defaultState(),...d};
 if(!Array.isArray(store.plan))store.plan=[];
 for(const k of ['settings','completed','answers','flashcards','notes'])if(!store[k]||Array.isArray(store[k])||typeof store[k]!=='object')store[k]={};
 // Amplia planos antigos sem apagar dias concluídos, respostas, flashcards ou anotações.
 if(store.plan.length===24&&store.plan.some(d=>!Array.isArray(d.topics)||d.topics.length<6)){
  store.plan=plan(store.plan);
  await save();
 }
}
async function save(){
 const c=client(),id=rights.id;if(!c||!id||!allowed())return;
 const r=await c.from('uentzoul_concurso_progress').upsert({
  user_id:id,settings:store.settings,plan:store.plan,completed:store.completed,
  answers:store.answers,flashcards:store.flashcards,notes:store.notes,updated_at:new Date().toISOString()
 },{onConflict:'user_id'});
 if(r.error){console.warn('Concursos: falha ao salvar',r.error);toast('Não foi possível salvar. Verifique a conexão.');}
}
function scheduleSave(){clearTimeout(saveJob);saveJob=setTimeout(save,400);}
async function refreshAccess(force=false){
 const u=user();
 if(!u){
  if(rights.id){rights={id:null,admin:false,concurso:false};store=defaultState();active=false;external=false;}
  syncChrome();return;
 }
 if(checking||(!force&&rights.id===u.id))return;
 checking=true;
 try{
  const r=await client().rpc('uentzoul_concurso_access');
  if(r.error)throw r.error;if(user()?.id!==u.id)return;
  const changed=rights.id!==u.id;
  rights={id:u.id,admin:r.data?.admin===true,concurso:r.data?.concurso===true};
  window.uentzoulContestAccess?.setVerified?.(rights.id,rights.admin,rights.concurso);
  if(allowed()){
   if(changed)await load();
   if(!active&&(onlyContest()||location.hash==='#concursos'&&rights.admin)){enter(true);}
  }else{
   active=false;external=false;
  }
 }catch(e){
  console.warn('Concursos: falha na autenticação do cargo',e);
  // Uma falha temporária na RPC não deve desbloquear os semestres de um cargo já confirmado.
  if(rights.id!==u.id){rights={id:u.id,admin:false,concurso:false};active=false;}
 }
 finally{checking=false;syncChrome();}
}
function syncChrome(){
 document.documentElement.classList.toggle('pm-concurso-user',onlyContest());
 document.documentElement.classList.toggle('pm-concurso-mode',active);
 const menu=$('semesterDropdown');
 if(menu){
  let b=menu.querySelector('[data-concurso-select]');
  if(allowed()){
   if(!b){
    b=document.createElement('button');b.type='button';b.className='semester-option concurso-semester-option';
    b.dataset.concursoSelect='true';b.innerHTML='<span>Concursos</span><span class="semester-option-check" aria-hidden="true">✓</span>';
    menu.appendChild(b);
   }
   b.hidden=false;
  }else if(b)b.remove();
  menu.querySelectorAll('[data-semester]').forEach(el=>{
   if(el.hidden!==onlyContest())el.hidden=onlyContest();
   if(active){el.classList.remove('active');el.removeAttribute('aria-current');}
  });
  if(active&&b){b.classList.add('active');b.setAttribute('aria-current','true');}
 }
 if(active){
  const nav=$('nav'),existing=$('navConcursoNotebook');
  if(nav&&!existing){
   const btn=document.createElement('button');btn.type='button';btn.className='sidebtn';
   btn.id='navConcursoNotebook';btn.dataset.coNotebook='true';
   btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M5 3h14v18H5zM9 3v18M12 8h4M12 12h4M12 16h4"/></svg><span class="nav-label">Caderno</span>';
   (nav.querySelector('[data-page="exams"]')||nav.lastElementChild)?.after(btn);
  }
  const label=$('semesterCurrentLabel');if(label&&label.textContent!=='Concursos')label.textContent='Concursos';
  if(!external)document.querySelectorAll('#nav [data-page]').forEach(n=>n.classList.toggle('active',n.dataset.page===(view==='simulados'?'exams':'home')));
  $('navConcursoNotebook')?.classList.toggle('active',view==='caderno');
  const side=$('subjectNav');
  if(side&&!side.querySelector('[data-concurso-subject]')){
   for(const s of D.subjects){const b=document.createElement('button');b.type='button';b.className='sidebtn';b.dataset.concursoSubject=s.id;b.textContent=s.name;side.appendChild(b);}
  }
 }else{
  document.querySelectorAll('#subjectNav [data-concurso-subject]').forEach(n=>n.remove());
  $('navConcursoNotebook')?.remove();
 }
}
function enter(restored=false){
 if(!allowed())return;
 if(!active){view='inicio';subject='todos';if(restored)restoreView();}
 active=true;external=false;
 if(onlyContest()||!restored){
  try{history.replaceState(onlyContest()?null:history.state,'',location.pathname+location.search+'#concursos');}catch(e){}
 }
 render();syncChrome();window.pmMobileDrawer?.close?.();
}
function exit(){
 if(onlyContest())return;
 active=false;external=false;
 try{if(location.hash==='#concursos')history.replaceState(history.state,'',location.pathname+location.search);}catch(e){}
 syncChrome();
}
function renderHTML(content){
 if(!active||external)return;
 const root=$('main');if(!root)return;
 root.classList.remove('nb-shell-active');root.innerHTML='<div class="concursos-shell">'+content+'</div>';
 syncChrome();
}
const b=(action,title,extra='',style='co-btn')=>'<button type="button" class="'+style+'" data-co="'+action+'" '+extra+'>'+title+'</button>';
function heading(title,subtitle){
 return '<div class="co-row co-between" style="margin-bottom:18px"><div><p class="co-kicker">Concursos · HCPA 2026</p><h1>'+esc(title)+'</h1><p class="co-muted">'+esc(subtitle)+'</p></div>'+b('tab','Voltar ao início','data-tab="inicio"')+'</div>';
}
function header(){
 const percent=Math.round(doneCount()/24*100);
 return '<section class="co-hero"><div class="co-hero-top"><div><p class="co-kicker">Prova · 13 de dezembro de 2026</p><h1>Assistente Administrativo II</h1><p class="co-muted">19/11 a 12/12 · 24 dias · cerca de 1h40 por dia</p></div><span class="co-pill">HCPA</span></div><div class="co-stats"><div class="co-stat"><strong>'+doneCount()+'/24</strong><small>Dias concluídos</small></div><div class="co-stat"><strong>'+percent+'%</strong><small>Progresso diário</small></div><div class="co-stat"><strong>'+acc()+'%</strong><small>Acertos registrados</small></div><div class="co-stat"><strong>200</strong><small>Questões disponíveis</small></div></div><div class="co-progress-track"><span style="width:'+percent+'%"></span></div></section>';
}
function tabs(){
 return '<nav class="co-tabs" aria-label="Ferramentas Concursos">'+
 [['inicio','Plano diário'],['materias','Matérias'],['banco','Banco de questões'],['simulados','Mini simulados'],['flashcards','Flashcards']].concat(rights.admin?[['admin','Gerenciar cargo']]:[]).map(([id,t])=>
 '<button type="button" data-co="tab" data-tab="'+id+'" aria-current="'+(view===id?'page':'false')+'">'+t+'</button>').join('')+'</nav>';
}
function home(){
 let content=header()+tabs();
 if(!store.plan.length){
  content+='<section class="co-card"><p class="co-kicker">Primeiro acesso</p><h2>Crie seu plano de estudo personalizado</h2><p>Indique em quais assuntos você já tem segurança e quais exigem mais atenção. Cada dia reúne seis assuntos, questões e flashcards na mesma página, com cerca de 1h40 de estudo.</p>'+b('tab','Escolher minhas prioridades','data-tab="configurar"','co-btn co-btn-primary')+'</section>';
 }else{
  content+='<div class="co-row co-between"><div><h2>Seu cronograma de estudos</h2><p class="co-muted">Abra um dia para estudar seis assuntos, responder questões e revisar flashcards sem sair da página.</p></div>'+b('tab','Alterar prioridades','data-tab="configurar"')+'</div>';
  content+='<div class="co-grid">'+store.plan.map((day,i)=>
   '<button type="button" data-co="open-day" data-day="'+i+'" class="co-card co-day '+(store.completed[day.date]?'co-done':'')+'"><span class="co-day-number">Dia '+(i+1)+'</span><span class="co-day-date">'+shortDate(day.date)+'</span><span class="co-day-label">'+esc(day.topics.map(t=>topics[t]?.title||t).join(' + '))+'</span><span class="co-day-status">'+(store.completed[day.date]?'✓ Concluído':'Abrir · cerca de 1h40')+'</span></button>').join('')+'</div>';
 }
 renderHTML(content);
}
function setup(){
 let html=heading('O que você já conhece?','Escolha o grau de domínio em cada assunto para montar os 24 dias.');
 html+='<div class="co-guide">Os assuntos marcados como <strong>Já domino</strong> ficam fora do estudo principal. <strong>Preciso estudar</strong> e <strong>Tenho dificuldade</strong> ganham mais tempo e reaparecem nas revisões.</div>';
 for(const s of D.subjects){
  html+='<section style="margin:22px 0"><h2>'+esc(s.name)+'</h2><div class="co-topic-list">';
  for(const t of D.topics.filter(t=>t.subject===s.id)){
   html+='<label class="co-topic"><span><strong>'+esc(t.title)+'</strong><small>'+esc(t.summary)+'</small></span><select aria-label="Domínio de '+esc(t.title)+'" data-concurso-priority="'+t.id+'">'+
    Object.entries(pLabels).map(([v,l])=>'<option value="'+v+'" '+(settingsFor(t.id)===v?'selected':'')+'>'+l+'</option>').join('')+'</select></label>';
  }
  html+='</div></section>';
 }
 html+='<div class="co-row co-between"><p class="co-muted">Reconfigurar o cronograma reinicia os cartões concluídos, mas mantém respostas e flashcards.</p>'+b('generate','Gerar meu plano de estudos','','co-btn co-btn-primary')+'</div>';
 renderHTML(html);
}
function plan(previous=[]){
 const permitted=D.topics.filter(t=>settingsFor(t.id)!=='domino');
 const pool=permitted.length?permitted:D.topics;
 const usage=Object.fromEntries(pool.map(t=>[t.id,0]));
 const out=[];
 for(let d=0;d<24;d++){
  // Conservar os assuntos que já estavam previstos nos planos antigos.
  const old=Array.isArray(previous[d]?.topics)?previous[d].topics.filter(id=>pool.some(t=>t.id===id)):[];
  const picked=[...new Set(old)].slice(0,6);
  picked.forEach(id=>{usage[id]++;});
  while(picked.length<6){
   let candidates=pool.filter(t=>!picked.includes(t.id));
   if(!candidates.length)break;
   // Quatro temas específicos e dois básicos, respeitando prioridades pessoais.
   const specificCount=picked.filter(id=>topics[id]?.subject==='especificos').length;
   const generalCount=picked.length-specificCount;
   const desired=specificCount<4&&(generalCount>=2||picked.length%3!==1)?'especificos':'geral';
   let group=candidates.filter(t=>desired==='especificos'?t.subject==='especificos':t.subject!=='especificos');
   if(!group.length)group=candidates;
   group.sort((a,b)=>{
    const score=t=>(priorities[settingsFor(t.id)]||.1)/(1+.72*usage[t.id]);
    return score(b)-score(a)||((d+picked.length)%3===0?a.id.localeCompare(b.id):b.id.localeCompare(a.id));
   });
   picked.push(group[0].id);usage[group[0].id]++;
  }
  out.push({
   day:d+1,date:previous[d]?.date||dateOf(d),topics:picked,
   minutes:d>=21?[25,55,20]:[35,45,20],
   review:d>=21?'Revisão final':(d+1)%5===0?'Revisão de consolidação':'Estudo orientado'
  });
 }
 return out;
}
async function generate(){
 if(working)return;
 if(store.plan.length&&!confirm('Criar novo cronograma? Dias já concluídos serão reiniciados.'))return;
 working=true;
 renderHTML('<section class="co-loading" role="status" aria-live="polite"><p class="co-kicker">Planejamento personalizado</p><h1>Montando seus 24 dias</h1><p class="co-muted">Seis assuntos, questões e flashcards por dia · cerca de 1h40.</p><div class="co-progress-track"><span id="coLoadFill" style="width:0%"></span></div><div class="co-loading-log" id="coLoadLines"></div></section>');
 const steps=['Identificando os assuntos prioritários','Distribuindo seis assuntos por dia','Selecionando questões e flashcards para revisão','Organizando os 24 dias até a prova','Salvando o plano na sua conta'];
 for(let i=0;i<steps.length;i++){
  const el=document.createElement('p');el.className='current';el.textContent='◌ '+steps[i];$('coLoadLines')?.appendChild(el);
  await new Promise(resolve=>setTimeout(resolve,350));
  el.textContent='✓ '+steps[i];el.className='done';
  if($('coLoadFill'))$('coLoadFill').style.width=((i+1)*20)+'%';
 }
 store.plan=plan();store.completed={};await save();
 working=false;view='inicio';render();
}
function guide(topic){
 const t=topics[topic];if(!t)return '';
 const reading=(t.study||[]).map(section=>'<section style="margin-bottom:19px"><h3>'+esc(section.title)+'</h3><p>'+esc(section.body)+'</p></section>').join('');
 const glossary='<details style="margin-top:17px"><summary style="font-weight:750;cursor:pointer">Relembrar os conceitos essenciais</summary><div style="padding:12px 0">'+
  t.notes.map(n=>'<p><strong>'+esc(n.term)+':</strong> '+esc(n.explanation)+'</p>').join('')+'</div></details>';
 const check=(t.check||[]).length?'<section class="co-step"><h3>Confira se entendeu</h3><ol style="padding-left:20px;margin:7px 0">'+
  t.check.map(q=>'<li style="margin:7px 0">'+esc(q)+'</li>').join('')+'</ol></section>':'';
 return '<div class="co-guide">'+reading+glossary+check+'</div>';
}
// Conjuntos determinísticos: avançam pelo banco ao longo dos dias e não mudam a cada render.
function dailyItems(items,topicIds,count,number){
 return topicIds.flatMap((topic,index)=>{
  const pool=items.filter(item=>item.topic===topic);
  if(!pool.length)return [];
  const start=((number-1)*count+index)%pool.length;
  return Array.from({length:Math.min(count,pool.length)},(_,i)=>pool[(start+i)%pool.length]);
 });
}
const dailyAnswerKey=(d,q)=>'daily:'+d.date+':'+q.id;
const dailyCardKey=(d,c)=>'daily:'+d.date+':'+c.id;
const dayFlipped=new Set();
function dailyQuestion(q,index,total,d){
 const key=dailyAnswerKey(d,q),a=store.answers[key],selected=Number.isInteger(a?.answer)?a.answer:null;
 return '<article class="co-day-question" data-co-question="'+esc(q.id)+'" data-co-index="'+index+'">'+
 '<div class="co-day-item-top"><span class="co-day-counter">Questão '+(index+1)+' de '+total+'</span><span class="co-day-tag">'+esc(topics[q.topic]?.title||'Assunto')+'</span></div>'+
 '<h3>'+esc(q.stem)+'</h3>'+
 '<div class="co-choices">'+q.options.map((option,i)=>
 '<button type="button" data-co="daily-answer" data-question="'+esc(q.id)+'" data-choice="'+i+'" class="co-choice '+(selected===null?'':i===q.answer?'co-correct':i===selected?'co-wrong':'')+'"'+(selected!==null?' disabled':'')+'>'+
 '<span>'+String.fromCharCode(65+i)+'</span><span>'+esc(option)+'</span></button>').join('')+'</div>'+
 (selected===null?'<p class="co-muted co-day-hint">Selecione uma alternativa para ver a correção.</p>':
 '<section class="co-feedback" role="status"><strong>'+(selected===q.answer?'✓ Resposta correta':'Resposta incorreta · correta: '+String.fromCharCode(65+q.answer))+'</strong>'+
 '<ol class="co-day-explanations">'+q.options.map((x,i)=>
 '<li><strong>'+String.fromCharCode(65+i)+'. '+esc(x)+'</strong><p class="co-muted">'+esc(q.feedback[i]||'')+'</p></li>').join('')+'</ol></section>')+
 '</article>';
}
function dailyFlashcard(c,index,total,d){
 const key=dailyCardKey(d,c),flipped=dayFlipped.has(key);
 const known=store.flashcards[key],rated=known===true||known===false;
 return '<article class="co-day-flashcard" data-co-card="'+esc(c.id)+'" data-co-index="'+index+'">'+
 '<div class="co-day-item-top"><span class="co-day-counter">Flashcard '+(index+1)+' de '+total+'</span><span class="co-day-tag">'+esc(topics[c.topic]?.title||'Assunto')+'</span></div>'+
 '<button type="button" class="co-day-flip" data-co="daily-flip" data-card="'+esc(c.id)+'" aria-label="'+(flipped?'Mostrar pergunta':'Revelar resposta')+'">'+
 '<small>'+(flipped?'RESPOSTA':'PERGUNTA')+'</small><strong>'+esc(flipped?c.back:c.front)+'</strong>'+
 '<span>'+(flipped?'Toque para voltar à pergunta':'Toque para revelar a resposta')+'</span></button>'+
 '<div class="co-day-flash-actions">'+
 '<button type="button" class="co-btn'+(rated&&known===false?' co-day-chosen':'')+'" data-co="daily-rating" data-card="'+esc(c.id)+'" data-known="false" aria-pressed="'+(rated&&known===false)+'">Preciso revisar</button>'+
 '<button type="button" class="co-btn'+(rated&&known===true?' co-day-chosen':'')+'" data-co="daily-rating" data-card="'+esc(c.id)+'" data-known="true" aria-pressed="'+(rated&&known===true)+'">Já sei</button>'+
 '</div></article>';
}
function dailyProgress(d,qs,cs){
 const answered=qs.filter(q=>Number.isInteger(store.answers[dailyAnswerKey(d,q)]?.answer)).length;
 const rated=cs.filter(c=>typeof store.flashcards[dailyCardKey(d,c)]==='boolean').length;
 const correct=qs.filter(q=>store.answers[dailyAnswerKey(d,q)]?.correct===true).length;
 return {answered,rated,correct};
}
function refreshDailyProgress(){
 if(view!=='dia')return;
 const d=store.plan[dayIndex];if(!d)return;
 const qs=dailyItems(D.questions,d.topics,3,d.day),cs=dailyItems(D.flashcards,d.topics,2,d.day);
 const p=dailyProgress(d,qs,cs);
 for(const [id,txt] of [['coDayAnswered',p.answered+' / '+qs.length],['coDayReviewed',p.rated+' / '+cs.length],['coDayCorrect',p.correct+' acertos']]){
  const el=$(id);if(el)el.textContent=txt;
 }
 for(const [id,count,total] of [['coDayQuestionProgress',p.answered,qs.length],['coDayCardProgress',p.rated,cs.length]]){
  const el=$(id);if(el)el.style.width=(total?count/total*100:0)+'%';
 }
}
function updateDailyAnswer(id,choice){
 const d=store.plan[dayIndex],q=qById[id];
 if(!d||!q||!dailyItems(D.questions,d.topics,3,d.day).some(item=>item.id===id))return;
 if(!Number.isInteger(choice)||choice<0||choice>=q.options.length)return;
 const key=dailyAnswerKey(d,q);
 if(Number.isInteger(store.answers[key]?.answer))return;
 const entry={answer:choice,correct:choice===q.answer,at:new Date().toISOString()};
 store.answers[key]=entry;
 store.answers[q.id]=entry; // Também alimenta o histórico geral e a revisão de erros.
 scheduleSave();
 const el=Array.from(document.querySelectorAll('#main .co-day-question')).find(x=>x.dataset.coQuestion===id);
 if(el)el.outerHTML=dailyQuestion(q,Number(el.dataset.coIndex),dailyItems(D.questions,d.topics,3,d.day).length,d);
 refreshDailyProgress();
}
function updateDailyCard(id,type,known){
 const d=store.plan[dayIndex],c=D.flashcards.find(item=>item.id===id);
 if(!d||!c||!dailyItems(D.flashcards,d.topics,2,d.day).some(item=>item.id===id))return;
 const key=dailyCardKey(d,c);
 if(type==='flip'){
  if(dayFlipped.has(key))dayFlipped.delete(key);else dayFlipped.add(key);
 }else if(type==='rating'){
  store.flashcards[key]=known;
  store.flashcards[c.id]=known; // Sincroniza com a aba geral de flashcards.
  scheduleSave();
 }
 const el=Array.from(document.querySelectorAll('#main .co-day-flashcard')).find(x=>x.dataset.coCard===id);
 if(el)el.outerHTML=dailyFlashcard(c,Number(el.dataset.coIndex),dailyItems(D.flashcards,d.topics,2,d.day).length,d);
 refreshDailyProgress();
}
function day(){
 const d=store.plan[dayIndex];if(!d)return go('inicio');
 const qs=dailyItems(D.questions,d.topics,3,d.day),cs=dailyItems(D.flashcards,d.topics,2,d.day),p=dailyProgress(d,qs,cs);
 const intro=heading('Dia '+d.day+' · '+shortDate(d.date),d.review+' · cerca de 1h40 de estudo, no seu ritmo');
 const summary='<div class="co-day-overview" aria-label="Progresso do estudo do dia">'+
 '<div><span>Assuntos</span><strong>'+d.topics.length+'</strong></div>'+
 '<div><span>Questões respondidas</span><strong id="coDayAnswered">'+p.answered+' / '+qs.length+'</strong></div>'+
 '<div><span>Flashcards revisados</span><strong id="coDayReviewed">'+p.rated+' / '+cs.length+'</strong></div>'+
 '<div><span>Desempenho</span><strong id="coDayCorrect">'+p.correct+' acertos</strong></div></div>';
 const theory='<section class="co-day-stage" aria-labelledby="coDayTheoryTitle">'+
 '<div class="co-day-stage-head"><span class="co-day-stage-number">01</span><div><h2 id="coDayTheoryTitle">Ler e compreender</h2><p>Tempo sugerido: '+d.minutes[0]+' min · '+d.topics.length+' assuntos com conceitos, exemplos e perguntas de revisão.</p></div></div>'+
 d.topics.map((id,i)=>'<article class="co-card co-day-reading"><div class="co-day-reading-head"><span>Assunto '+(i+1)+' de '+d.topics.length+'</span><span>'+esc(subjects[topics[id]?.subject]?.name||'')+'</span></div>'+
 '<h3>'+esc(topics[id]?.title||id)+'</h3>'+guide(id)+'</article>').join('')+'</section>';
 const questions='<section class="co-day-stage" aria-labelledby="coDayQuestionsTitle">'+
 '<div class="co-day-stage-head"><span class="co-day-stage-number">02</span><div><h2 id="coDayQuestionsTitle">Resolver questões</h2>'+
 '<p>Tempo sugerido: '+d.minutes[1]+' min · '+qs.length+' questões aqui mesmo. Responda e confira a explicação de cada alternativa.</p></div></div>'+
 '<div class="co-day-progress-track"><span id="coDayQuestionProgress" style="width:'+(qs.length?p.answered/qs.length*100:0)+'%"></span></div>'+
 '<div class="co-day-question-list">'+qs.map((q,i)=>dailyQuestion(q,i,qs.length,d)).join('')+'</div></section>';
 const flash='<section class="co-day-stage" aria-labelledby="coDayFlashTitle">'+
 '<div class="co-day-stage-head"><span class="co-day-stage-number">03</span><div><h2 id="coDayFlashTitle">Revisar flashcards</h2>'+
 '<p>Tempo sugerido: '+d.minutes[2]+' min · '+cs.length+' cartões. Revele as respostas e marque o que já sabe.</p></div></div>'+
 '<div class="co-day-progress-track"><span id="coDayCardProgress" style="width:'+(cs.length?p.rated/cs.length*100:0)+'%"></span></div>'+
 '<div class="co-day-card-list">'+cs.map((c,i)=>dailyFlashcard(c,i,cs.length,d)).join('')+'</div></section>';
 const footer='<section class="co-card co-day-finish"><div><h2>Concluir o estudo do dia</h2><p class="co-muted">O progresso de questões e flashcards é salvo automaticamente. Marque o dia como concluído quando terminar.</p></div>'+
 b('complete-day',store.completed[d.date]?'✓ Dia concluído · desfazer':'✓ Marcar dia como concluído','','co-btn co-btn-primary')+'</section>';
 renderHTML(intro+summary+theory+questions+flash+footer);
}
function notebook(){
 const selector='<select class="co-select" data-co-filter="notes" aria-label="Matéria do caderno">'+D.subjects.map(s=>'<option value="'+s.id+'" '+(noteSubject===s.id?'selected':'')+'>'+esc(s.name)+'</option>').join('')+'</select>';
 renderHTML(heading('Meu caderno','Anotações particulares de Concursos, separadas por matéria e salvas na conta.')+
 '<section class="co-card"><div class="co-row co-between"><h2>Anotações</h2>'+selector+'</div>'+
 '<textarea id="coNotebookText" rows="14" spellcheck="true" aria-label="Anotações do concurso" placeholder="Escreva aqui seu resumo, dúvidas e observações da matéria..." style="display:block;resize:vertical;width:100%;min-height:330px;background:var(--paper,#fff);color:inherit;border:1px solid var(--line,#d8d3e5);border-radius:12px;padding:16px;font:400 15px/1.65 system-ui;margin:16px 0">'+esc(store.notes[noteSubject]||'')+'</textarea>'+
 '<p class="co-muted">As anotações são privadas. As alterações são salvas automaticamente.</p></section>');
}
function matters(){
 renderHTML(header()+tabs()+'<h2>Disciplinas e assuntos</h2><div class="co-grid">'+D.subjects.map(s=>
 '<button type="button" class="co-card co-day" data-co="matter" data-subject="'+s.id+'"><span class="co-kicker">'+s.examQuestions+' questões na prova</span><span class="co-day-number">'+esc(s.name)+'</span><span class="co-day-label">'+D.topics.filter(t=>t.subject===s.id).length+' grupos de estudo</span><span class="co-day-status">Abrir conteúdo</span></button>').join('')+'</div>');
}
function matter(){
 const s=subjects[subject]||D.subjects[0];
 renderHTML(heading(s.name,'Leitura estruturada por assunto, com prática específica.')+
 b('questions','Resolver questões da matéria','data-subject="'+s.id+'"','co-btn co-btn-primary')+
 D.topics.filter(t=>t.subject===s.id).map(t=>'<section class="co-card" style="margin-top:12px"><h2>'+esc(t.title)+'</h2><p class="co-muted">'+esc(t.summary)+'</p>'+guide(t.id)+b('questions','Praticar este assunto','data-topic="'+t.id+'"')+'</section>').join(''));
}
function filterBox(){
 return '<select class="co-select" data-co-filter="subject" aria-label="Matéria"><option value="todos">Todas as matérias</option>'+
 D.subjects.map(s=>'<option value="'+s.id+'" '+(subject===s.id?'selected':'')+'>'+esc(s.name)+'</option>').join('')+'</select>';
}
function bank(){
 const wrong=D.questions.filter(q=>store.answers[q.id]&&!store.answers[q.id].correct).length;
 renderHTML(header()+tabs()+'<section class="co-card"><h2>Banco de 200 questões</h2><p>Escolha uma matéria ou pratique todas. Uma questão por vez, com correção imediata e explicação de cada alternativa.</p><div class="co-row">'+filterBox()+b('questions','Começar questões','','co-btn co-btn-primary')+b('wrong','Refazer erros ('+wrong+')',wrong?'':'disabled')+'</div></section>'+
 '<div class="co-grid" style="margin-top:12px">'+D.subjects.map(s=>'<article class="co-card"><strong>'+esc(s.name)+'</strong><p class="co-muted">'+D.questions.filter(q=>q.subject===s.id).length+' questões disponíveis</p>'+b('questions','Praticar','data-subject="'+s.id+'"')+'</article>').join('')+'</div>');
}
function startQuestions(filter='todos',topic=null,incorrect=false){
 let questions=D.questions.filter(q=>(filter==='todos'||q.subject===filter)&&(!topic||q.topic===topic));
 if(incorrect)questions=questions.filter(q=>store.answers[q.id]&&!store.answers[q.id].correct);
 if(!questions.length)return toast('Não há questões nesse filtro.');
 questions=shuffle(questions).sort((a,b)=>(priorities[settingsFor(b.topic)]||0)-(priorities[settingsFor(a.topic)]||0));
 session={ids:questions.map(q=>q.id),index:0,selected:null,good:0,mode:'banco'};
 go('question');
}
function mini(n){
 const sizes=n===40?{especificos:25,portugues:5,informatica:5,logica:5}:n===20?{especificos:13,portugues:3,informatica:2,logica:2}:{especificos:6,portugues:2,informatica:1,logica:1};
 const selected=Object.entries(sizes).flatMap(([id,count])=>shuffle(D.questions.filter(q=>q.subject===id)).sort((a,b)=>(priorities[settingsFor(b.topic)]||0)-(priorities[settingsFor(a.topic)]||0)).slice(0,count));
 session={ids:shuffle(selected).map(q=>q.id),index:0,selected:null,good:0,mode:'simulado'};
 go('question');
}
function simulations(){
 renderHTML(header()+tabs()+'<h2>Escolha um simulado</h2><p class="co-muted">Depois de responder, aparece a alternativa certa com explicações; os resultados ficam no histórico de respostas.</p><div class="co-grid">'+
 [[10,'Treino rápido'],[20,'Mini simulado'],[40,'Simulado completo']].map(([n,label])=>
 '<article class="co-card"><p class="co-kicker">'+n+' questões</p><h3>'+label+'</h3><p class="co-muted">Questões selecionadas conforme suas prioridades e a composição da prova.</p>'+b('mini','Começar','data-size="'+n+'"','co-btn co-btn-primary')+'</article>').join('')+'</div>');
}
function question(){
 if(!session)return go('banco');
 if(session.index>=session.ids.length)return go('result');
 const q=qById[session.ids[session.index]],selected=session.selected;
 let html=heading(session.mode==='simulado'?'Simulado em andamento':'Banco de questões',subjects[q.subject]?.name+' · '+topics[q.topic]?.title)+
 '<section class="co-card co-question"><div class="co-row co-between"><span class="co-pill">Questão '+(session.index+1)+' de '+session.ids.length+'</span><span class="co-muted">'+session.good+' acertos nesta sessão</span></div>'+
 '<div class="co-progress-track"><span style="width:'+(session.index/session.ids.length*100)+'%"></span></div><div class="co-spacer"></div><h2>'+esc(q.stem)+'</h2>'+
 '<div class="co-choices">'+q.options.map((option,i)=>'<button type="button" data-co="answer" data-choice="'+i+'" class="co-choice '+(selected===null?'':i===q.answer?'co-correct':i===selected?'co-wrong':'')+'" '+(selected!==null?'disabled':'')+'><span>'+String.fromCharCode(65+i)+'</span><span>'+esc(option)+'</span></button>').join('')+'</div>';
 if(selected!==null){
  html+='<section class="co-feedback" role="status"><strong>'+(selected===q.answer?'✓ Resposta correta':'Resposta incorreta. Correta: '+String.fromCharCode(65+q.answer))+'</strong><ol style="list-style:none;padding:0">'+q.options.map((x,i)=>
   '<li><strong>'+String.fromCharCode(65+i)+'. '+esc(x)+'</strong><p class="co-muted">'+esc(q.feedback[i])+'</p></li>').join('')+'</ol></section>';
 }
 html+='<div class="co-row co-between" style="margin-top:18px">'+b('cancel','Encerrar sessão')+
 (selected===null?'<span class="co-muted">Escolha a resposta para corrigir.</span>':b('next',session.index===session.ids.length-1?'Ver resultado':'Próxima questão','','co-btn co-btn-primary'))+'</div></section>';
 renderHTML(html);
}
function answer(i){
 if(!session||session.selected!==null)return;
 const q=qById[session.ids[session.index]];
 if(!q||i<0||i>=q.options.length)return;
 session.selected=i;
 if(i===q.answer)session.good++;
 store.answers[q.id]={answer:i,correct:i===q.answer,at:new Date().toISOString()};
 scheduleSave();question();
}
function result(){
 if(!session)return go('banco');
 const pct=Math.round(session.good/session.ids.length*100);
 renderHTML(heading('Sessão concluída','As respostas e erros ficam registrados na sua conta.')+
 '<section class="co-card" style="text-align:center;max-width:600px;margin:auto"><p class="co-kicker">'+session.mode+'</p><h1>'+session.good+' de '+session.ids.length+' acertos</h1><p class="co-muted">'+pct+'% nesta sessão</p><div class="co-row" style="justify-content:center">'+b('tab','Banco de questões','data-tab="banco"','co-btn co-btn-primary')+b('wrong','Rever as erradas')+b('tab','Cronograma','data-tab="inicio"')+'</div></section>');
}
const cards=()=>D.flashcards.filter(c=>cardFilter==='todos'||c.subject===cardFilter||c.topic===cardFilter).sort((a,b)=>Number(store.flashcards[a.id]===true)-Number(store.flashcards[b.id]===true));
function flashcards(){
 const list=cards();if(cardIndex>=list.length)cardIndex=0;
 const c=list[cardIndex],known=list.filter(c=>store.flashcards[c.id]===true).length;
 const filter='<select class="co-select" data-co-filter="cards"><option value="todos">Todas as matérias</option>'+D.subjects.map(s=>
 '<option value="'+s.id+'" '+(cardFilter===s.id?'selected':'')+'>'+esc(s.name)+'</option>').join('')+'</select>';
 renderHTML(header()+tabs()+'<div class="co-row co-between"><div><h2>Flashcards</h2><p class="co-muted">Toque no cartão e marque o que já domina.</p></div>'+filter+'</div>'+
 (!c?'<p>Sem cartões nesse filtro.</p>':'<div style="text-align:center"><p class="co-muted">'+(cardIndex+1)+' / '+list.length+' · '+known+' dominados</p><button type="button" class="co-flash" data-co="flip"><div><small>'+esc(subjects[c.subject]?.name)+'</small><p style="margin:12px 0"><strong>'+esc(cardFlipped?c.back:c.front)+'</strong></p><small>'+(cardFlipped?'Toque para voltar à pergunta':'Toque para revelar a resposta')+'</small></div></button><div class="co-row" style="justify-content:center">'+b('card-rating','Preciso revisar','data-known="false"')+b('card-rating','Já sei','data-known="true"','co-btn co-btn-primary')+b('next-card','Próximo')+'</div></div>'));
}
async function adminLoad(){
 if(!rights.admin)return;
 const c=client();if(!c)return;
 const [a,b]=await Promise.all([c.from('uentzoul_profiles').select('user_id,display_name').order('display_name').limit(500),
  c.from('uentzoul_concurso_users').select('user_id').limit(500)]);
 if(a.error||b.error)return toast('Não foi possível carregar as contas.');
 roleList=a.data||[];roleSet=new Set((b.data||[]).map(u=>u.user_id));if(active&&view==='admin')admin();
}
function admin(){
 renderHTML(header()+tabs()+'<section class="co-card"><h2>Conceder cargo Concursos</h2><p class="co-muted">Depois que a pessoa criar a conta, conceda aqui o cargo. O cadastro ficará oculto da comunidade e sem acesso às mensagens.</p><div style="overflow:auto"><table class="co-admin-table"><thead><tr><th>Usuário</th><th>Permissão atual</th><th>Alterar</th></tr></thead><tbody>'+
 roleList.map(u=>'<tr><td>'+esc(u.display_name)+'</td><td>'+(roleSet.has(u.user_id)?'Concursos':'Conta comum')+'</td><td>'+b('role',roleSet.has(u.user_id)?'Revogar':'Conceder','data-user="'+u.user_id+'" data-enable="'+(!roleSet.has(u.user_id))+'" '+(u.user_id===rights.id?'disabled':''))+'</td></tr>').join('')+'</tbody></table></div></section>');
}
async function toggleRole(id,yes){
 if(!rights.admin||!id||id===rights.id)return;
 const p=roleList.find(x=>x.user_id===id);if(!p)return;
 if(!confirm((yes?'Conceder':'Revogar')+' cargo Concursos para '+p.display_name+'?'))return;
 const r=await client().rpc('uentzoul_set_concurso_role',{p_user_id:id,p_enabled:yes});
 if(r.error)return toast('Permissão não alterada: '+r.error.message);
 toast('Permissão atualizada.');await adminLoad();
}
function go(dest){
 if(!active||!allowed())return;
 external=false;view=dest;rememberView();
 if(dest==='admin'&&rights.admin)void adminLoad();
 render();
}
function render(){
 if(!active||external||working)return;
 if(view==='inicio')home();
 else if(view==='configurar')setup();
 else if(view==='dia')day();
 else if(view==='materias')matters();
 else if(view==='materia')matter();
 else if(view==='banco')bank();
 else if(view==='simulados')simulations();
 else if(view==='question')question();
 else if(view==='result')result();
 else if(view==='flashcards')flashcards();
 else if(view==='caderno')notebook();
 else if(view==='admin')admin();
 else home();
}
document.addEventListener('click',e=>{
 if(!(e.target instanceof Element))return;
 const competition=e.target.closest('#semesterDropdown [data-concurso-select]');
 if(competition){
  e.preventDefault();e.stopImmediatePropagation();
  if(allowed())enter();$('semesterDropdown').hidden=true;$('semesterCurrent')?.setAttribute('aria-expanded','false');return;
 }
 const ordinary=e.target.closest('#semesterDropdown [data-semester]');
 if(ordinary&&active){
  if(onlyContest()){e.preventDefault();e.stopImmediatePropagation();return;}
  exit();return;
 }
 if(onlyContest()&&e.target.closest('#nav [data-page="messages"],#nav [data-page="calendar"],#nav #navVacationReview,[data-dm-peer],[data-dm-room],[data-dm-tab],[data-action^="messages:"]')){
  e.preventDefault();e.stopImmediatePropagation();return;
 }
 if(!active)return;
 const notebookButton=e.target.closest('#navConcursoNotebook,#navCadernoPreview');
 if(notebookButton){e.preventDefault();e.stopImmediatePropagation();go('caderno');window.pmMobileDrawer?.close?.();return;}
 const sub=e.target.closest('[data-concurso-subject]');
 if(sub){e.preventDefault();e.stopImmediatePropagation();subject=sub.dataset.concursoSubject;go('materia');window.pmMobileDrawer?.close?.();return;}
 const nav=e.target.closest('#nav [data-page]');
 if(nav){
  if(['home','exams'].includes(nav.dataset.page)){
   e.preventDefault();e.stopImmediatePropagation();go(nav.dataset.page==='exams'?'simulados':'inicio');window.pmMobileDrawer?.close?.();return;
  }
  if(nav.dataset.page==='ai'){
   if(onlyContest()){e.preventDefault();e.stopImmediatePropagation();return;}
   external=true;return;
  }
  if(onlyContest()){e.preventDefault();e.stopImmediatePropagation();return;}
 }
 const button=e.target.closest('[data-co]');if(!button)return;
 e.preventDefault();e.stopImmediatePropagation();
 const cmd=button.dataset.co;
 if(cmd==='tab')go(button.dataset.tab);
 if(cmd==='generate')void generate();
 if(cmd==='open-day'){dayIndex=Number(button.dataset.day)||0;go('dia');}
 if(cmd==='matter'){subject=button.dataset.subject;go('materia');}
 if(cmd==='complete-day'){const d=store.plan[dayIndex];if(d){store.completed[d.date]=!store.completed[d.date];scheduleSave();const el=document.querySelector('#main .co-day-finish [data-co="complete-day"]');if(el)el.textContent=store.completed[d.date]?'✓ Dia concluído · desfazer':'✓ Marcar dia como concluído';}}
 if(cmd==='daily-answer'){updateDailyAnswer(button.dataset.question,Number(button.dataset.choice));return;}
 if(cmd==='daily-flip'){updateDailyCard(button.dataset.card,'flip');return;}
 if(cmd==='daily-rating'){updateDailyCard(button.dataset.card,'rating',button.dataset.known==='true');return;}
 if(cmd==='questions')startQuestions(button.dataset.subject||subject,button.dataset.topic||null);
 if(cmd==='wrong')startQuestions('todos',null,true);
 if(cmd==='mini')mini(Number(button.dataset.size));
 if(cmd==='answer')answer(Number(button.dataset.choice));
 if(cmd==='next'&&session){session.index++;session.selected=null;go(session.index>=session.ids.length?'result':'question');}
 if(cmd==='cancel')go(session?.mode==='simulado'?'simulados':'banco');
 if(cmd==='flip'){cardFlipped=!cardFlipped;flashcards();}
 if(cmd==='next-card'){cardIndex++;cardFlipped=false;flashcards();}
 if(cmd==='card-rating'){const c=cards()[cardIndex];if(c){store.flashcards[c.id]=button.dataset.known==='true';scheduleSave();}cardIndex++;cardFlipped=false;flashcards();}
 if(cmd==='role')void toggleRole(button.dataset.user,button.dataset.enable==='true');
},true);
document.addEventListener('change',e=>{
 const t=e.target;if(!active||!(t instanceof Element))return;
 if(t.matches('[data-concurso-priority]')){store.settings[t.dataset.concursoPriority]=t.value;scheduleSave();}
 if(t.matches('[data-co-filter="subject"]'))subject=t.value;
 if(t.matches('[data-co-filter="cards"]')){cardFilter=t.value;cardIndex=0;cardFlipped=false;flashcards();}
 if(t.matches('[data-co-filter="notes"]')){noteSubject=t.value;rememberView();notebook();}
});
document.addEventListener('input',e=>{if(e.target?.id==='coNotebookText'&&active){store.notes[noteSubject]=e.target.value;scheduleSave();}});
window.addEventListener('uentzoul:auth',()=>void refreshAccess(true));
window.addEventListener('focus',()=>void refreshAccess(true));
window.addEventListener('hashchange',()=>{
 if(onlyContest()){
  window.uentzoulContestAccess?.lock?.();
  if(!active)enter(true);
  return;
 }
 if(location.hash==='#concursos'&&allowed()&&!active)enter(true);
});
function boot(){
 syncChrome();void refreshAccess();
 const root=$('main');
 if(root){new MutationObserver(()=>{
  if(active&&!external&&!working&&!root.querySelector('.concursos-shell')&&!renderJob){
   renderJob=requestAnimationFrame(()=>{renderJob=0;render();});
  }
 }).observe(root,{childList:true});}
 setInterval(()=>{syncChrome();if((user()?.id||null)!==rights.id)void refreshAccess(true);},1700);
 setInterval(()=>{if(user())void refreshAccess(true);},60000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
