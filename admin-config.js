/* PsicoMoodle — administração com autorização no Supabase. */
(()=>{
'use strict';
const TABLE='uentzoul_admin_topics',PRESENCE='uentzoul_presence';
let admin=false,owner=null,checking=false,topics=[],topicsSignature='',presence=[],reports=[],busy=false,notice='',editing=null,lastPresence=0,lastReports=0;
let accessLog=[],logOpen=false,logTab='online',lastLog=0,logError='',markingTest=false;
let visitActivity=new Map(),visitActivityLoading=false,visitActivityError='',lastVisitActivity=0;
const ACTIVITY_TABS=new Set(['explored','entryOnly','unclassified']);
const FOREIGN_TAB='foreign';
let lastLogGesture=0,logRenderTimer=null,lastLogRenderKey='';
let secretLogOpen=false,secretLogClicks=0,lastSecretLogClick=0;
let botRuns=[],lastBotRuns=0,botRunsError='',botRunsLoading=false;
let selectedVisitId=null,selectedPresenceId=null,visitSteps=[],visitLoading=false,visitError='',logLimit=200,hasMoreEntries=false;
let guestOnlineCount=null,lastGuestCount=0,guestCountError='';
let guestPingBusy=false,lastGuestPing=0;
const GUEST_SESSION_KEY='pm_guest_online_session_v1';
const TEST_LABELS='uentzoul_access_log_labels';
const auth=()=>window.uentzoulAIAuth;
const bridge=()=>window.uentzoulAdminBridge;
const client=()=>auth()?.client?.();
const user=()=>auth()?.user?.();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const subjects=()=>bridge()?.subjects?.()||{};
function isAdmin(){return admin && owner===user()?.id;}
function updateNav(){
 const el=document.getElementById('navAdminConfig');
 if(el){el.hidden=!isAdmin();el.style.display=isAdmin()?'':'none';}
 if(!isAdmin()&&location.hash==='#admin')bridge()?.goHome?.();
 bridge()?.refreshNav?.();
}
async function heartbeat(){
 const c=client(),u=user();
 if(!c||!u||document.visibilityState!=='visible')return;
 try{await c.rpc('uentzoul_heartbeat');}catch(e){console.warn('Presença não registrada:',e);}
}
async function loadTopics(){
 const c=client();if(!c)return;
 try{
  const {data,error}=await c.from(TABLE).select('id,semester,subject,title,definition,scenario,myth,sort_order,updated_at').order('sort_order',{ascending:true}).limit(500);
  if(error)throw error;
  const sig=JSON.stringify(data||[]);
  if(sig!==topicsSignature){topicsSignature=sig;topics=data||[];bridge()?.applyTopics?.(topics);if(isAdmin())refreshAdminPage();}
 }catch(e){console.warn('Conteúdos adicionais indisponíveis:',e);}
}
function reportsMarkup(){
 return reports.length?reports.map(r=>'<article class="admin-report-entry"><div><strong>Relato anônimo</strong><time>'+esc(new Date(r.created_at).toLocaleString('pt-BR'))+'</time></div><p>'+esc(r.body)+'</p></article>').join(''):
 '<p class="admin-muted">Não há relatos de erros recebidos.</p>';
}
async function loadReports(){
 if(!isAdmin()||!client())return;
 try{
  const {data,error}=await client().rpc('uentzoul_list_error_reports');
  if(error)throw error;
  reports=data||[];lastReports=Date.now();
  const area=document.getElementById('adminErrorReports');
  if(area)area.innerHTML=reportsMarkup();
 }catch(e){console.warn('Não foi possível consultar relatos:',e);}
}


/* Presença de visitantes: uma chave aleatória por aba, guardada apenas nesta sessão.
   Não coleta nome, rota ou IP; a tabela expira sessões rapidamente.
   O backend conta abas/sessões com atividade nos últimos dois minutos. */
function guestSessionKey(create=false){
 try{
  let key=sessionStorage.getItem(GUEST_SESSION_KEY);
  if(!key&&create){
   key=globalThis.crypto?.randomUUID?.()||'';
   if(!key&&globalThis.crypto?.getRandomValues){
    const b=new Uint8Array(16);globalThis.crypto.getRandomValues(b);
    b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;
    const hex=Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');
    key=hex.slice(0,8)+'-'+hex.slice(8,12)+'-'+hex.slice(12,16)+'-'+hex.slice(16,20)+'-'+hex.slice(20);
   }
   if(key)sessionStorage.setItem(GUEST_SESSION_KEY,key);
  }
  return key||null;
 }catch(_){return null;}
}
async function guestPresenceHeartbeat(){
 // Navegadores do robô de revisão não são visitantes anônimos.
 if(window.__uentzoulSiteHealthAudit===true)return;
 const c=client();
 if(!c||document.visibilityState!=='visible'||guestPingBusy)return;
 if(user()?.id){await guestPresenceLeave();return;}
 if(Date.now()-lastGuestPing<25000)return;
 guestPingBusy=true;
 try{
  // A checagem da sessão impede contar como visitante um usuário já logado
  // cujo estado de autenticação ainda esteja inicializando.
  const session=await c.auth.getSession();
  if(session.error||session.data?.session?.user?.id)return;
  const key=guestSessionKey(true);if(!key)return;
  const res=await c.rpc('uentzoul_guest_heartbeat',{p_session_key:key,p_online:true});
  if(res.error)throw res.error;
  lastGuestPing=Date.now();
 }catch(error){console.warn('Presença anônima indisponível:',error?.message||error)}
 finally{guestPingBusy=false;}
}
async function guestPresenceLeave(){
 const c=client(),key=guestSessionKey(false);
 if(!c||!key)return;
 try{
  const {error}=await c.rpc('uentzoul_guest_heartbeat',{p_session_key:key,p_online:false});
  if(error)throw error;
  sessionStorage.removeItem(GUEST_SESSION_KEY);
  lastGuestPing=0;
 }catch(error){console.warn('Não foi possível encerrar presença anônima:',error?.message||error);}
}
async function loadGuestOnline(){
 if(!isAdmin()||!logOpen||!client())return;
 try{
  const {data,error}=await client().rpc('uentzoul_guest_online_count');
  if(error)throw error;
  guestOnlineCount=Math.max(0,Number(data)||0);
  guestCountError='';
  lastGuestCount=Date.now();
 }catch(error){
  guestOnlineCount=null;guestCountError='Contagem temporariamente indisponível.';
  console.warn('Contagem de visitantes indisponível:',error?.message||error);
 }
 updateLogPanel();
}
function onlineAccountsCount(){return presence.filter(loggedOnline).length;}
function onlineTotalCount(){
 return guestOnlineCount===null?null:onlineAccountsCount()+guestOnlineCount;
}
function guestOnlineMarkup(){
 const accounts=onlineAccountsCount();
 const guests=guestOnlineCount===null?'—':String(guestOnlineCount);
 const total=onlineTotalCount();
 return '<div class="admin-online-overview" aria-label="Resumo dos acessos ativos">'+
   '<section class="admin-online-stat admin-online-guests" aria-label="Visitantes sem login online">'+
   '<div class="admin-online-label"><span class="admin-online-pulse" aria-hidden="true"></span><strong>VISITANTES ANÔNIMOS</strong></div>'+
   '<div class="admin-online-big" id="adminLogGuestCount">'+guests+'</div>'+
   '<p>Sem login · atividade nos últimos 2 minutos</p>'+
   '<small id="adminLogGuestState">'+esc(guestCountError||'Somente quantidade, sem identificação')+'</small></section>'+
   '<section class="admin-online-stat"><span class="admin-online-label">CONTAS LOGADAS</span>'+
   '<strong class="admin-online-number" id="adminLogAccountCount">'+accounts+'</strong>'+
   '<p>Usuários identificados ativos</p></section>'+
   '<section class="admin-online-stat"><span class="admin-online-label">TOTAL ONLINE</span>'+
   '<strong class="admin-online-number" id="adminLogTotalCount">'+(total===null?'—':total)+'</strong>'+
   '<p>Contas e sessões anônimas</p></section></div>';
}

async function loadPresence(){
 if(!isAdmin()||!client())return;
 try{
  const [seen,profiles]=await Promise.all([
   client().from(PRESENCE).select('user_id,last_seen').order('last_seen',{ascending:false}).limit(500),
   client().from('uentzoul_profiles').select('user_id,display_name').limit(500)
  ]);
  if(seen.error)throw seen.error;
  if(profiles.error)throw profiles.error;
  const names=new Map((profiles.data||[]).map(p=>[p.user_id,p.display_name]));
  presence=(seen.data||[]).filter(p=>p.user_id!==user()?.id).map(p=>({...p,name:names.get(p.user_id)||'Usuário cadastrado'}));
  lastPresence=Date.now();updateLogPanel();
 }catch(e){logError='Não foi possível consultar os acessos.';updateLogPanel();console.warn('Presença indisponível:',e)}
}

/* Classificação por visita, não por pessoa. Registros antigos sem percurso
   são mantidos como desconhecidos: nunca presumimos que só entraram e saíram. */
function classifyVisitActivity(steps){
 if(!steps.length)return 'unknown';
 const homeRoutes=new Set();
 for(const step of steps){
  if(step.kind!=='navigate')continue;
  const section=step.section||'home';
  if(section!=='home')return 'explored';
  homeRoutes.add([section,step.detail||'',step.semester||''].join('|'));
 }
 return homeRoutes.size>1?'explored':'entryOnly';
}
async function loadVisitActivity(force=false){
 if(!isAdmin()||!client()||!ACTIVITY_TABS.has(logTab)||visitActivityLoading)return;
 const idStrings=accessLog.map(r=>String(r.id));
 if(!idStrings.length)return;
 const hasMissing=idStrings.some(id=>!visitActivity.has(id));
 if(!force&&!hasMissing&&Date.now()-lastVisitActivity<120000){updateLogPanel();return}
 visitActivityLoading=true;visitActivityError='';updateLogPanel();
 try{
  const collected=new Map(idStrings.map(id=>[id,[]]));
  // Lotes pequenos e paginação para não truncar trajetos de visitas longas.
  for(let i=0;i<accessLog.length;i+=60){
   const ids=accessLog.slice(i,i+60).map(r=>r.id);
   for(let offset=0;;offset+=1000){
    const {data,error}=await client().from('uentzoul_visit_steps')
     .select('access_id,kind,section,detail,semester')
     .in('access_id',ids).order('id',{ascending:true}).range(offset,offset+999);
    if(error)throw error;
    for(const step of data||[]){
     const list=collected.get(String(step.access_id));
     if(list)list.push(step);
    }
    if((data||[]).length<1000)break;
   }
  }
  for(const [id,steps] of collected)visitActivity.set(id,classifyVisitActivity(steps));
  lastVisitActivity=Date.now();
 }catch(error){
  visitActivityError='Não foi possível classificar as visitas. Tente atualizar novamente.';
  console.warn('Classificação de visitas indisponível:',error?.message||error);
 }finally{visitActivityLoading=false;updateLogPanel()}
}
async function loadAccess(){
 if(!isAdmin()||!client())return;
 try{
  const [events,profiles,labels]=await Promise.all([
   client().from('uentzoul_access_log').select('id,user_id,actor,entered_at,last_seen_at,ended_at,device_info').order('entered_at',{ascending:false}).limit(logLimit+1),
   client().from('uentzoul_profiles').select('user_id,display_name').limit(500),
   client().from(TEST_LABELS).select('access_id').limit(1000)
  ]);
  if(events.error)throw events.error;
  if(profiles.error)throw profiles.error;
  if(labels.error)throw labels.error;
  const names=new Map((profiles.data||[]).map(p=>[p.user_id,p.display_name]));
  const marked=new Set((labels.data||[]).map(x=>String(x.access_id)));
  hasMoreEntries=(events.data||[]).length>logLimit;
  accessLog=(events.data||[]).filter(r=>r.user_id!==user()?.id).slice(0,logLimit).map(r=>{
   const isTest=r.actor==='anonymous'&&marked.has(String(r.id));
   return {...r,isTest,name:r.actor==='anonymous'?(isTest?'Meu teste anônimo':'Visitante anônimo'):names.get(r.user_id)||'Usuário cadastrado'};
  });
  lastLog=Date.now();logError='';updateLogPanel();if(ACTIVITY_TABS.has(logTab))void loadVisitActivity();
 }catch(e){logError='Não foi possível carregar o histórico de entradas.';updateLogPanel();console.warn('Log indisponível:',e)}
}
// Histórico do robô oficial obtido de execuções do GitHub Actions.
 // Sem heurísticas de user-agent nem rótulos inventados para acessos antigos.
async function loadBotRuns(force=false){
 if(!isAdmin()||!document.getElementById('adminConfigPage')||botRunsLoading)return;
 if(!force&&Date.now()-lastBotRuns<120000){updateLogPanel();return}
 botRunsLoading=true;botRunsError='';updateLogPanel();
 try{
  const response=await fetch('https://api.github.com/repos/uentzoul/estudos-uentzoul/actions/workflows/site-health.yml/runs?per_page=15',{
   headers:{Accept:'application/vnd.github+json'}
  });
  if(!response.ok)throw Error('GitHub HTTP '+response.status);
  const data=await response.json();
  botRuns=(data.workflow_runs||[]).filter(r=>Number.isSafeInteger(Number(r.id))).map(r=>({
   id:Number(r.id),started:r.run_started_at||r.created_at,trigger:r.event,
   status:r.status,conclusion:r.conclusion
  }));
  lastBotRuns=Date.now();
 }catch(error){botRunsError='Não foi possível consultar o GitHub agora. '+String(error?.message||'');}
 finally{botRunsLoading=false;updateLogPanel()}
}
function botLogMarkup(){
 const url='https://github.com/uentzoul/estudos-uentzoul/actions/workflows/site-health.yml';
 if(botRunsLoading&&!botRuns.length)return '<p class="admin-muted" role="status">Carregando as verificações automáticas…</p>';
 if(botRunsError&&!botRuns.length)return '<p class="admin-muted" role="status">'+esc(botRunsError)+'</p><p><a href="'+url+'" target="_blank" rel="noopener noreferrer">Consultar no GitHub</a></p>';
 const explanation='<p class="admin-log-explain">Registros confirmados pelo GitHub Actions do nosso monitor de layout. Cada execução testa até quatro dispositivos e não entra na contagem de visitantes. Outros robôs não são identificados automaticamente.</p>';
 if(!botRuns.length)return explanation+'<p class="admin-muted">Ainda não há verificações registradas.</p><p><a href="'+url+'" target="_blank" rel="noopener noreferrer">Abrir monitoramento</a></p>';
 const trigger=event=>event==='schedule'?'Revisão programada · a cada 2 horas':event==='push'?'Revisão após atualização':event==='workflow_dispatch'?'Revisão manual':'Revisão automática';
 const status=r=>r.status!=='completed'?'Em execução':r.conclusion==='success'?'Concluída · sem falha crítica':r.conclusion==='failure'?'Falha detectada · consultar relatório':r.conclusion==='cancelled'?'Cancelada':'Concluída · '+String(r.conclusion||'resultado indefinido');
 return explanation+(botRunsError?'<p class="admin-muted">'+esc(botRunsError)+'</p>':'')+
 '<div class="admin-log-rows">'+botRuns.map(r=>
  '<div class="admin-log-row"><a class="admin-log-row-target" href="https://github.com/uentzoul/estudos-uentzoul/actions/runs/'+r.id+'" target="_blank" rel="noopener noreferrer">'+
  '<span class="admin-log-avatar" aria-hidden="true">B</span>'+
  '<span class="admin-log-person"><strong>Bot · Saúde do Site</strong><small>'+esc(trigger(r.trigger))+' · '+esc(status(r))+'</small></span>'+
  '<time datetime="'+esc(r.started||'')+'">'+esc(logDate(r.started))+'</time>'+
  '<span class="admin-log-expand" aria-hidden="true">↗</span></a></div>'
 ).join('')+'</div>'+
 '<p class="admin-log-foot">Exibindo as 15 execuções mais recentes. Abra uma entrada para ver erros, capturas e detalhes da auditoria.</p>';
}
function logDate(date){
 if(!date)return '—';
 try{return new Date(date).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}
 catch(_){return '—'}
}
function loggedOnline(p){return !!p.last_seen&&Date.now()-new Date(p.last_seen).getTime()<120000}
const VISIT_SECTION={home:'Página inicial',subject:'Disciplina',exams:'Simulados',test:'Simulado',calendar:'Agenda e Horários',messages:'Mensagens',ai:'IA Tzoul',audio:'Podcasts',library:'Biblioteca',admin:'Admin Config',vacation:'Revisão de Férias'};
const VISIT_SUBJECTS={tcc:'TCC',familia:'Psicologia da Família',meta:'Metapsicologia',grupos:'Psicologia dos Grupos',social:'Psicologia Social',avaliacao:'Avaliação Psicológica',profissao:'Psicologia como Profissão',processos:'Processos Psicológicos Básicos',direitos:'Psicologia e Direitos Humanos',epistemologia:'Fundamentos Epistemológicos em Psicologia',historia:'História da Psicologia',sociocognitivas:'Teorias Sociocognitivas',desenvolvimento:'Psicologia do Desenvolvimento',inteligencia:'Avaliação Psicológica: Inteligência e Funções Cognitivas',basesbiologicas:'Bases Biológicas do Comportamento Humano',psicopatologia:'Concepções em Psicopatologia',observacao:'Observação e Entrevista',grupos2:'Psicologia dos Grupos II',psiquismo:'Psiquismo e Subjetividade em Psicanálise',escolar:'Psicologia Escolar e da Educação I',etica:'Ética e Legislação em Psicologia'};
const VISIT_AREAS={trail:'Trilha de Estudos',topics:'Conteúdos',docs:'Materiais e textos',tests:'Simulados',podcasts:'Podcasts',guided:'Estudo dirigido',flash:'Flashcards',cases:'Estudos de caso'};
function visitTitle(step){
 if(step.kind==='entry')return 'Entrou no site';
 if(step.kind==='exit')return 'Saiu do site';
 if(step.section==='subject'){
  const parts=String(step.detail||'').split(':');
  const base=VISIT_SUBJECTS[parts[0]]||'uma disciplina';
  return 'Acessou '+base+(parts[1]&&VISIT_AREAS[parts[1]]?' · '+VISIT_AREAS[parts[1]]:'');
 }
 if(step.section==='test')return 'Abriu um simulado';
 return 'Acessou '+(VISIT_SECTION[step.section]||'uma seção do site');
}
const DEVICE_KIND={phone:'Celular',tablet:'Tablet',desktop:'Computador',unknown:'Dispositivo'};
function originStatus(row){
 const code=String(row?.device_info?.country_code||'').toUpperCase();
 if(!/^[A-Z]{2}$/.test(code)||code==='XX')return {label:'País não identificado',foreign:false,known:false};
 if(code==='BR')return {label:'Brasil · país estimado',foreign:false,known:true};
 let country=code;
 try{country=new Intl.DisplayNames(['pt-BR'],{type:'region'}).of(code)||code;}catch(_){}
 return {label:'FORA DO BRASIL · '+country,foreign:true,known:true};
}
function deviceSummary(row){
 const d=row?.device_info;
 if(!d||typeof d!=='object')return 'Dispositivo não registrado';
 const family=d.family&&d.family!=='Other'?d.family:DEVICE_KIND[d.kind]||'Dispositivo';
 const browser=d.browser&&d.browser!=='Other'?d.browser:'Navegador não identificado';
 const os=d.os&&d.os!=='Other'?d.os:'';
 return [family,browser,os].filter(Boolean).join(' · ');
}
function deviceDetails(row){
 const d=row?.device_info;
 if(!d||typeof d!=='object')return '<section class="admin-visit-device"><strong>Informações do dispositivo</strong>'+
  '<p>Dispositivo não registrado. Essas informações não podem ser reconstruídas para visitas antigas.</p></section>';
 const pairs=[
  ['Categoria',DEVICE_KIND[d.kind]||'Não identificada'],
  ['Aparelho',d.family&&d.family!=='Other'?d.family:'Não identificado'],
  ['Navegador',d.browser&&d.browser!=='Other'?d.browser+(d.browser_major?' '+d.browser_major:''):'Não identificado'],
  ['Sistema operacional',d.os&&d.os!=='Other'?d.os+(d.os_version?' '+d.os_version:''):'Não identificado'],
  ['Tela informada',Number.isInteger(d.width)&&Number.isInteger(d.height)?d.width+' × '+d.height+' pixels CSS':'Não informada'],
  ['Modo de acesso',d.mode==='standalone'?'Tela inicial / aplicativo':d.mode==='fullscreen'?'Tela cheia':'Navegador'],
   ['País aproximado',originStatus(row).label]
 ];
 return '<section class="admin-visit-device"><strong>Informações do dispositivo</strong>'+
  '<dl>'+pairs.map(([name,value])=>'<div><dt>'+esc(name)+'</dt><dd>'+esc(value)+'</dd></div>').join('')+'</dl>'+
  '<p>País estimado pela rede, sujeito a VPN, proxy e imprecisões. Acesso estrangeiro não significa necessariamente robô ou invasão. O site não guarda IP, cidade, endereço ou agente de usuário completo. Visitas anteriores podem não ter localização.</p></section>';
}
function visitDetail(row){
 if(!row)return '';
 if(visitLoading)return '<div class="admin-visit-detail" role="status">Carregando percurso desta visita…</div>';
 if(visitError)return '<div class="admin-visit-detail" role="alert">'+esc(visitError)+'</div>';
 const steps=visitSteps.slice(0,100);
 const items=steps.length?steps:[{kind:'entry',section:'home',happened_at:row.entered_at}];
 const timeline=items.map(step=>'<li class="admin-visit-step" data-kind="'+esc(step.kind)+'">'+
  '<time datetime="'+esc(step.happened_at)+'">'+esc(logDate(step.happened_at))+'</time>'+
  '<strong>'+esc(visitTitle(step))+'</strong>'+
  (step.semester?'<small>'+esc(step.semester)+'</small>':'')+'</li>').join('');
 const last=steps[steps.length-1];
 let ending='';
 if(!last||last.kind!=='exit'){
  // Um fim registrado é confirmado. Sem ele, o fim é estimado pela inatividade,
  // nunca apresentado como logout ou como horário exato de saída.
  const endRecorded=!!row.ended_at;
  const stamp=row.ended_at||row.last_seen_at||row.entered_at;
  const lastSeenMs=Date.parse(row.last_seen_at||row.entered_at||'');
  const stillActive=!endRecorded&&Number.isFinite(lastSeenMs)&&Date.now()-lastSeenMs<150000;
  const status=stillActive?'Sessão possivelmente ativa':'Sessão encerrada';
  const note=stillActive?'A visita pode continuar em andamento.':
   endRecorded?'Encerramento registrado pelo sistema.':
   'Encerramento estimado por inatividade. O horário exibido é da última atividade conhecida, não de uma saída confirmada.';
  ending='<li class="admin-visit-step '+(endRecorded?'':'admin-visit-uncertain')+'"><time datetime="'+esc(stamp||'')+'">'+esc(logDate(stamp))+'</time>'+
   '<strong>'+status+'</strong><small>'+note+'</small></li>';
 }
 const message=steps.length?'Sequência observada nesta visita. Apenas as seções acessadas são registradas.':
  'Registro anterior a este recurso. As páginas visitadas não eram armazenadas e não é possível reconstruir o percurso antigo.';
 return '<section class="admin-visit-detail" aria-label="Percurso desta visita">'+
  '<div class="admin-visit-head"><div><strong>Histórico desta visita</strong><small>'+esc(row.name||'Visitante')+' · Entrada '+esc(logDate(row.entered_at))+'</small></div>'+
  '<button type="button" data-admin-close-visit aria-label="Fechar histórico">Fechar ×</button></div>'+
  '<p class="admin-visit-note">'+esc(message)+'</p>'+deviceDetails(row)+
  '<ol class="admin-visit-timeline">'+timeline+ending+'</ol></section>';
}
// Abre/fecha o percurso sem substituir a lista nem destruir o botão tocado.
 // Evita que o Safari reinicie o scroll ou tente focar um elemento removido.
 function updateVisitExpansion(){
  if(logRenderTimer){clearTimeout(logRenderTimer);logRenderTimer=null;}
  const list=document.getElementById('adminLogData')?.querySelector('.admin-log-rows');
  if(!list){updateLogPanel();return;}
  const y=list.scrollTop,x=list.scrollLeft;
  for(const button of list.querySelectorAll('[data-admin-open-visit]')){
   const row=button.closest('.admin-log-row');
   if(!row)continue;
   const visitId=button.dataset.adminOpenVisit||'';
   const presenceId=button.dataset.adminOpenPresence||'';
   const match=visitId?accessLog.find(entry=>String(entry.id)===visitId):null;
   const selected=match?selectedVisitId===visitId:!!presenceId&&selectedPresenceId===presenceId;
   const previous=row.nextElementSibling;
   if(previous?.classList.contains('admin-visit-detail'))previous.remove();
   row.classList.toggle('is-selected',selected);
   button.setAttribute('aria-expanded',String(selected));
   if(selected)button.setAttribute('data-admin-visit-selected','');
   else button.removeAttribute('data-admin-visit-selected');
   const arrow=button.querySelector('.admin-log-expand');
   if(arrow)arrow.textContent=selected?'⌃':'⌄';
   if(!selected)continue;
   const html=match?visitDetail(match):
    '<section class="admin-visit-detail"><strong>Histórico desta presença</strong>'+
    '<p class="admin-visit-note">A conta está no painel de presença, mas não há uma entrada individual associada entre os registros carregados. Não é possível reconstruir páginas ou ações a partir de um status online.</p>'+
    '<button type="button" data-admin-close-visit>Fechar ×</button></section>';
   row.insertAdjacentHTML('afterend',html);
  }
  list.scrollTop=y;list.scrollLeft=x;
 }
 async function openVisit(id){
 if(!isAdmin())return;
 if(selectedVisitId===String(id)){selectedVisitId=null;selectedPresenceId=null;visitSteps=[];updateVisitExpansion();return;}
 const record=accessLog.find(row=>String(row.id)===String(id));
 if(!record)return;
 selectedVisitId=String(id);selectedPresenceId=null;visitSteps=[];visitError='';visitLoading=true;updateVisitExpansion();
 try{
  const {data,error}=await client().from('uentzoul_visit_steps')
   .select('id,kind,section,detail,semester,happened_at')
   .eq('access_id',record.id).order('happened_at',{ascending:true}).order('id',{ascending:true}).limit(100);
  if(error)throw error;
  if(selectedVisitId!==String(id))return;
  visitSteps=data||[];
 }catch(error){visitError='Não foi possível consultar o percurso. '+(error?.message||'Verifique a conexão.');}
 finally{if(selectedVisitId===String(id)){visitLoading=false;updateVisitExpansion();
  // Sem scrollIntoView: no iPhone ele pode deslocar também a página inteira.
 }}
}
function logMarkup(){
 if(logTab==='bots')return botLogMarkup();
 if(logError)return '<p class="admin-muted" role="status">'+esc(logError)+'</p>';
 const grouping=ACTIVITY_TABS.has(logTab);
 if(grouping&&visitActivityError)return '<p class="admin-muted" role="alert">'+esc(visitActivityError)+'</p>';
 if(grouping&&visitActivityLoading&&!lastVisitActivity)return '<p class="admin-muted" role="status">Classificando os percursos registrados…</p>';
 const rows=logTab===FOREIGN_TAB?accessLog.filter(row=>originStatus(row).foreign):
  grouping?accessLog.filter(row=>!originStatus(row).foreign).filter(row=>{
  const kind=visitActivity.get(String(row.id));
  return kind===({explored:'explored',entryOnly:'entryOnly',unclassified:'unknown'}[logTab]);
 }):logTab==='online'?presence.filter(loggedOnline):logTab==='last'?presence:
  accessLog.filter(row=>!originStatus(row).foreign);
 const title=logTab===FOREIGN_TAB?'Nenhum acesso de fora do Brasil identificado nos registros carregados. Visitas sem país confirmado ficam na aba Entradas.':
  logTab==='explored'?'Nenhuma visita com navegação adicional registrada.':
  logTab==='entryOnly'?'Nenhuma visita limitada à entrada registrada.':
  logTab==='unclassified'?'Nenhuma visita antiga sem percurso registrado.':
  logTab==='online'?'Nenhuma conta identificada como ativa nos últimos dois minutos.':
  logTab==='last'?'Nenhum último acesso registrado.':'Ainda não há entradas registradas.';
 const intro=logTab===FOREIGN_TAB?'<p class="admin-log-explain">Acessos com país estimado fora do Brasil. Isso não significa necessariamente robô ou invasão. VPN e proxy podem alterar o país. Cada linha é uma visita, não uma pessoa única.</p>':
  grouping?'<p class="admin-log-explain">'+(logTab==='explored'?
  'Visitas que acessaram outras áreas ou navegaram entre semestres. Inclui contas e anônimos.':
  logTab==='entryOnly'?'Visitas com registro, mas sem navegação adicional observada. Rolar a mesma página não é registrado.':
  'Registros antigos ou incompletos sem histórico de percurso. Não é possível dizer se navegaram.')+
  ' Cada linha representa uma visita, não uma pessoa única.'+
  (visitActivityLoading?' Atualizando classificação…':'')+'</p>':'';
 if(!rows.length)return intro+'<p class="admin-muted">'+title+'</p>'+((logTab===FOREIGN_TAB&&hasMoreEntries)?'<button type="button" class="admin-log-more" data-admin-log-more>Carregar mais 200 entradas anteriores</button>':'');
 return intro+'<div class="admin-log-rows">'+rows.slice(0,logTab==='online'?100:logLimit).map(row=>{
  const active=logTab==='online'?true:logTab==='last'&&loggedOnline(row);
  const name=esc(row.name||'Usuário cadastrado');
  const when=logTab==='entries'||logTab===FOREIGN_TAB||grouping?row.entered_at:row.last_seen;
  const status=logTab==='online'?'Online agora':logTab==='last'?(active?'Online agora':'Última atividade registrada'):
   row.actor==='anonymous'?(row.isTest?'Identificado manualmente como teste do administrador':'Visita anônima · sem conta'):'Entrou na conta';
  const match=logTab==='entries'||logTab===FOREIGN_TAB||grouping?row:accessLog.find(entry=>entry.user_id&&entry.user_id===row.user_id);
  const selected=match?selectedVisitId===String(match.id):selectedPresenceId===String(row.user_id);
  const markButton=(logTab==='entries'||logTab===FOREIGN_TAB||grouping)&&row.actor==='anonymous'?
   '<button type="button" class="admin-log-test-toggle" data-admin-test-access="'+esc(row.id)+'" '+(markingTest?'disabled':'')+
   ' aria-label="'+(row.isTest?'Desfazer identificação deste acesso como meu teste':'Identificar este acesso como meu teste')+'">'+
   (row.isTest?'Desfazer marcação':'Marcar como meu teste')+'</button>':'';
  const button='<button type="button" class="admin-log-row-target" data-admin-open-visit="'+esc(match?.id||'')+'"'+
   (!match?' data-admin-open-presence="'+esc(row.user_id||'')+'"':'')+
   ' aria-expanded="'+selected+'"'+(selected?' data-admin-visit-selected':'')+'>'+
   '<span class="admin-log-avatar '+(active?'is-online':'')+'" aria-hidden="true">'+(row.actor==='anonymous'?'?':name.trim().charAt(0).toUpperCase()||'U')+'</span>'+
   '<span class="admin-log-person"><strong>'+name+'</strong><small>'+esc(status)+'</small>'+((logTab==='entries'||logTab===FOREIGN_TAB||grouping)?'<small class="admin-log-device">'+esc(deviceSummary(row))+'</small><small class="admin-log-origin" style="font-weight:750">'+esc(originStatus(row).label)+'</small>':'')+'</span>'+
   '<time datetime="'+esc(when||'')+'">'+esc(logDate(when))+'</time>'+
   '<span class="admin-log-expand" aria-hidden="true">'+(selected?'⌃':'⌄')+'</span></button>';
  return '<div class="admin-log-row'+(selected?' is-selected':'')+'">'+button+markButton+'</div>'+
   (selected?(match?visitDetail(match):'<section class="admin-visit-detail"><strong>Histórico desta presença</strong><p class="admin-visit-note">A conta está no painel de presença, mas não há uma entrada individual associada entre os registros carregados. Não é possível reconstruir páginas ou ações a partir de um status online.</p><button type="button" data-admin-close-visit>Fechar ×</button></section>'):'');
 }).join('')+'</div>'+
 ((logTab==='entries'||logTab===FOREIGN_TAB||grouping)&&hasMoreEntries?'<button type="button" class="admin-log-more" data-admin-log-more>Carregar mais 200 entradas anteriores</button>':'');
}

// Não reconstrói a lista enquanto alguém está rolando: no iOS, trocar
// innerHTML durante o gesto faz o contêiner interno voltar ao início.
function logViewKey(){return [logTab,logLimit].join('|');}
function markLogGesture(event){
 const list=event.target?.closest?.('.admin-log-rows');
 if(list&&document.getElementById('adminLogData')?.contains(list))lastLogGesture=Date.now();
}
document.addEventListener('touchstart',markLogGesture,{capture:true,passive:true});
document.addEventListener('touchmove',markLogGesture,{capture:true,passive:true});
document.addEventListener('wheel',markLogGesture,{capture:true,passive:true});
document.addEventListener('scroll',markLogGesture,true);
function updateLogPanel(){
 const contents=document.getElementById('adminLogData');
 if(contents){
  const key=logViewKey();
  const sameView=key===lastLogRenderKey;
  const list=contents.querySelector('.admin-log-rows');
  const recentlyScrolled=sameView&&list&&Date.now()-lastLogGesture<1750;
  if(recentlyScrolled){
   if(logRenderTimer)clearTimeout(logRenderTimer);
   logRenderTimer=setTimeout(()=>{logRenderTimer=null;updateLogPanel()},1850);
  }else{
   if(logRenderTimer){clearTimeout(logRenderTimer);logRenderTimer=null}
   const markup=logMarkup();
   if(contents.innerHTML!==markup){
    const y=sameView&&list?list.scrollTop:0;
    const x=sameView&&list?list.scrollLeft:0;
    contents.innerHTML=markup;
    const updated=contents.querySelector('.admin-log-rows');
    if(updated&&sameView){updated.scrollTop=y;updated.scrollLeft=x}
   }
   lastLogRenderKey=key;
  }
 }
 const accounts=onlineAccountsCount(),total=onlineTotalCount();
 const counter=document.getElementById('adminLogOnlineCount');
 if(counter)counter.textContent=total===null?'—':String(total);
 const anonymous=document.getElementById('adminLogGuestCount');
 if(anonymous)anonymous.textContent=guestOnlineCount===null?'—':String(guestOnlineCount);
 const identified=document.getElementById('adminLogAccountCount');
 if(identified)identified.textContent=String(accounts);
 const combined=document.getElementById('adminLogTotalCount');
 if(combined)combined.textContent=total===null?'—':String(total);
 const status=document.getElementById('adminLogGuestState');
 if(status)status.textContent=guestCountError||'Somente quantidade, sem identificação';
 const tabs=document.querySelectorAll('[data-admin-log-tab]');
 for(const button of tabs)button.setAttribute('aria-selected',String(button.dataset.adminLogTab===logTab));
}
/* A tela comum do LOG mostra somente os três contadores.
   O histórico é montado apenas após cinco cliques na bolinha verde. */
function secretLogMarkup(){
 return '<section class="admin-log-secret-panel" aria-label="Central de Monitoramento">'+
  '<div class="admin-log-secret-head">'+
  '<button type="button" class="admin-log-secret-back" data-admin-log-back>← Voltar aos contadores</button>'+
  '<strong>Central de Monitoramento</strong></div>'+
  '<p class="admin-log-explain">O status online é uma estimativa de atividade nos últimos dois minutos. Clique em uma entrada para consultar o percurso resumido da visita. O registro não guarda mensagens, respostas ou textos digitados. O país é estimado pela rede e não comprova identidade ou robô. Visitas antigas podem exibir país não identificado.</p>'+
  '<div class="admin-log-toolbar" role="tablist" aria-label="Visualização dos acessos">'+
  [['online','Online','adminLogOnlineCount'],['last','Último acesso',''],['entries','Entradas',''],['foreign','Fora do Brasil',''],['explored','Navegaram',''],['entryOnly','Só entraram',''],['unclassified','Sem dados',''],['bots','Robôs','']].map(([tab,label,id])=>
   '<button type="button" role="tab" data-admin-log-tab="'+tab+'" aria-selected="'+(logTab===tab)+'">'+label+(id?' <span id="'+id+'">'+(onlineTotalCount()===null?'—':onlineTotalCount())+'</span>':'')+'</button>').join('')+
  '<button type="button" class="admin-log-refresh" data-admin-log-refresh title="Atualizar registros" aria-label="Atualizar registros">↻</button></div>'+
  '<div id="adminLogData">'+logMarkup()+'</div>'+
  '<p class="admin-log-foot">Os registros de entrada são mantidos por até 60 dias. As verificações do nosso robô são exibidas na aba Robôs e não contam como visitantes. A contagem anônima é aproximada, não identifica visitantes e não corresponde necessariamente a pessoas únicas; abas em segundo plano deixam de contar após dois minutos sem atividade.</p></section>';
}
function adminLogMarkup(){
 lastLogRenderKey=logViewKey();
 return '<details id="adminLogDisclosure" class="admin-card admin-log-card" '+(logOpen?'open':'')+'>'+
  '<summary><div class="admin-log-title"><span class="admin-log-glyph" aria-hidden="true">⌁</span>'+
  '<div><strong>LOG</strong><small>Contas e visitantes online</small></div></div>'+
  '<span class="admin-log-summary-meta">Privado <span aria-hidden="true">⌄</span></span></summary>'+
  '<div class="admin-log-content"><div id="adminLogView">'+
  (secretLogOpen?secretLogMarkup():guestOnlineMarkup())+
  '</div></div></details>';
}
function switchLogView(){
 const view=document.getElementById('adminLogView');
 if(!view||!isAdmin())return;
 if(logRenderTimer){clearTimeout(logRenderTimer);logRenderTimer=null;}
 lastLogGesture=0;
 lastLogRenderKey=logViewKey();
 view.innerHTML=secretLogOpen?secretLogMarkup():guestOnlineMarkup();
 updateLogPanel();
}
function refreshAdminPage(){
 if(document.getElementById('adminConfigPage')&&isAdmin())bridge()?.rerenderAdmin?.();
}
async function refresh(){
 const c=client(),u=user();
 if(!c||!u){
  if(owner){owner=null;admin=false;secretLogOpen=false;secretLogClicks=0;presence=[];accessLog=[];guestOnlineCount=null;topics=[];topicsSignature='';updateNav();}
  return;
 }
 if(checking)return;checking=true;
 try{
  if(owner!==u.id){
   admin=false;owner=u.id;secretLogOpen=false;secretLogClicks=0;presence=[];updateNav();
   const {data,error}=await c.rpc('uentzoul_is_admin');
   if(error)throw error;
   if(user()?.id!==u.id)return;
   admin=data===true;updateNav();
   if(isAdmin())window.uentzoulLibraryManager?.refresh?.();
  }
  await loadTopics();
  if(isAdmin()&&document.getElementById('adminConfigPage')){await loadReports();if(logOpen)await Promise.all([loadPresence(),loadGuestOnline(),...(secretLogOpen?[loadAccess()]:[])]);}
 }catch(e){console.warn('Verificação de administrador:',e);if(user()?.id===owner){admin=false;updateNav();}}
 finally{checking=false;}
}
function formMarkup(){
 const current=topics.find(t=>t.id===editing)||null;
 const options=Object.entries(subjects()).map(([id,name])=>'<option value="'+esc(id)+'" '+((current?.subject||'')===id?'selected':'')+'>'+esc(name)+'</option>').join('');
 return '<section class="admin-card"><h2>'+ (current?'Editar conteúdo':'Adicionar conteúdo')+'</h2>'+
 '<form id="adminTopicForm" class="admin-topic-form">'+
 '<label>Disciplina<select name="subject" required><option value="">Selecione a matéria</option>'+options+'</select></label>'+
 '<label>Título<input name="title" required maxlength="180" value="'+esc(current?.title||'')+'" placeholder="Título do tópico"></label>'+
 '<label>Explicação<textarea name="definition" rows="4" placeholder="Conteúdo para revisar">'+esc(current?.definition||'')+'</textarea></label>'+
 '<label>Exemplo<textarea name="scenario" rows="2" placeholder="Exemplo de aplicação">'+esc(current?.scenario||'')+'</textarea></label>'+
 '<label>Erro comum<textarea name="myth" rows="2" placeholder="Equívoco frequente">'+esc(current?.myth||'')+'</textarea></label>'+
 '<div class="admin-actions"><button type="submit" class="admin-primary" '+(busy?'disabled':'')+'>'+(busy?'Salvando…':current?'Salvar alterações':'Adicionar conteúdo')+'</button>'+
 (current?'<button type="button" data-admin-cancel>Cancelar edição</button>':'')+'</div></form></section>';
}
function listMarkup(){
 const filtered=topics.filter(t=>t.semester==='2026/2');
 return '<section class="admin-card"><h2>Conteúdos adicionados</h2>'+
 (filtered.length?'<div class="admin-topic-list">'+filtered.map(t=>'<div class="admin-topic-line"><div><strong>'+esc(t.title)+'</strong><small>'+esc(subjects()[t.subject]||t.subject)+'</small></div>'+
 '<div class="admin-topic-buttons"><button type="button" data-admin-edit="'+esc(t.id)+'">Editar</button><button type="button" data-admin-delete="'+esc(t.id)+'">Excluir</button></div></div>').join('')+'</div>':'<p class="admin-muted">Ainda não há tópicos adicionados por aqui. Os conteúdos anteriores continuam preservados.</p>')+'</section>';
}
function render(){
 if(!isAdmin())return '<section class="panel"><h1>Acesso restrito</h1><p>Esta área é exclusiva do administrador.</p></section>';
 // Mantém os relatórios, a biblioteca e o LOG intactos.
 // Os conteúdos salvos continuam intactos no banco e nas disciplinas.
 return '<div class="admin-config-page" id="adminConfigPage">'+
 '<header class="admin-header"><span class="admin-kicker">Painel privado</span><h1>Admin Config</h1><p>Adicione e analise arquivos por semestre e acompanhe os registros da plataforma.</p></header>'+
 '<details class="admin-card admin-reports"><summary>Relatos de erros <span>Privado</span></summary><div id="adminErrorReports">'+reportsMarkup()+'</div></details>'+
 (bridge()?.adminLibrary?.()||'')+
 adminLogMarkup()+
 '</div>';
}
function afterRender(){
 if(!isAdmin())return;
 if(logOpen&&(Date.now()-lastPresence>12000||Date.now()-lastLog>12000||Date.now()-lastGuestCount>12000)){
  loadPresence();loadGuestOnline();if(secretLogOpen){loadAccess();if(ACTIVITY_TABS.has(logTab))void loadVisitActivity();}
 }
 if(Date.now()-lastReports>25000)loadReports();
}

async function saveTopic(form){
 if(!isAdmin()||busy)return;
 const c=client(),u=user();if(!c||!u)return;
 const data=new FormData(form),subject=String(data.get('subject')||'');
 if(!subjects()[subject])return;
 const payload={semester:'2026/2',subject,title:String(data.get('title')||'').trim().slice(0,180),definition:String(data.get('definition')||'').trim().slice(0,16000),scenario:String(data.get('scenario')||'').trim().slice(0,5000),myth:String(data.get('myth')||'').trim().slice(0,5000),updated_by:u.id,updated_at:new Date().toISOString()};
 if(payload.title.length<3)return;
 busy=true;notice='';const submit=form.querySelector('[type=submit]');if(submit)submit.disabled=true;
 try{
  const q=editing?c.from(TABLE).update(payload).eq('id',editing):c.from(TABLE).insert(payload);
  const {error}=await q;if(error)throw error;
  editing=null;notice='Conteúdo salvo e disponibilizado na disciplina.';
  await loadTopics();refreshAdminPage();
 }catch(e){notice='Não foi possível salvar: '+(e.message||e);refreshAdminPage();}
 finally{busy=false;}
}
async function deleteTopic(id){
 if(!isAdmin()||busy||!topics.some(t=>t.id===id)||!confirm('Excluir este conteúdo adicionado? Os conteúdos originais não serão alterados.'))return;
 busy=true;
 try{const {error}=await client().from(TABLE).delete().eq('id',id);if(error)throw error;editing=null;notice='Conteúdo excluído.';await loadTopics();refreshAdminPage();}
 catch(e){notice='Falha ao excluir: '+(e?.message||'erro');refreshAdminPage();}
 finally{busy=false;}
}
async function toggleTestAccess(id){
 if(!isAdmin()||markingTest)return;
 const event=accessLog.find(x=>String(x.id)===String(id)&&x.actor==='anonymous');
 if(!event)return;
 const c=client();if(!c)return;
 markingTest=true;updateLogPanel();
 try{
  const check=await c.rpc('uentzoul_is_admin');
  if(check.error||check.data!==true)throw Error('Permissão administrativa não confirmada.');
  const res=event.isTest?await c.from(TEST_LABELS).delete().eq('access_id',event.id):
   await c.from(TEST_LABELS).insert({access_id:event.id});
  if(res.error)throw res.error;
  await loadAccess();
 }catch(e){
  logError='Falha ao identificar acesso: '+(e?.message||'erro desconhecido');
 }finally{markingTest=false;updateLogPanel();}
}
document.addEventListener('submit',e=>{if(e.target.id!=='adminTopicForm')return;e.preventDefault();saveTopic(e.target);});
document.addEventListener('click',e=>{
 // Cinco cliques diretamente na bolinha verde, sem qualquer feedback visual.
 const pulse=e.target.closest?.('.admin-online-pulse');
 if(pulse&&isAdmin()&&logOpen&&document.getElementById('adminLogView')?.contains(pulse)){
  const now=Date.now();
  secretLogClicks=now-lastSecretLogClick<=2500?secretLogClicks+1:1;
  lastSecretLogClick=now;
  if(secretLogClicks===5){
   secretLogClicks=0;lastSecretLogClick=0;secretLogOpen=true;logTab='online';
   selectedVisitId=null;selectedPresenceId=null;visitSteps=[];
   switchLogView();
   void loadPresence();void loadGuestOnline();void loadAccess();
  }
  return;
 }
 if(e.target.closest?.('[data-admin-log-back]')&&isAdmin()&&secretLogOpen){
  secretLogOpen=false;secretLogClicks=0;lastSecretLogClick=0;logTab='online';
  selectedVisitId=null;selectedPresenceId=null;visitSteps=[];
  switchLogView();return;
 }
 const edit=e.target.closest('[data-admin-edit]');if(edit&&isAdmin()){editing=edit.dataset.adminEdit;refreshAdminPage();return;}
 const del=e.target.closest('[data-admin-delete]');if(del&&isAdmin()){deleteTopic(del.dataset.adminDelete);return;}
 if(e.target.closest('[data-admin-cancel]')&&isAdmin()){editing=null;refreshAdminPage();return;}
 if(e.target.closest('[data-admin-refresh]')&&isAdmin()){heartbeat().then(loadPresence);loadAccess();loadGuestOnline();loadReports();}
 const open=e.target.closest('[data-admin-open-visit]');
 if(open&&isAdmin()&&open.dataset.adminOpenVisit){void openVisit(open.dataset.adminOpenVisit);return;}
 if(open&&isAdmin()&&open.dataset.adminOpenPresence){const uid=open.dataset.adminOpenPresence;selectedPresenceId=selectedPresenceId===uid?null:uid;selectedVisitId=null;visitSteps=[];updateVisitExpansion();return;}
 if(e.target.closest('[data-admin-close-visit]')&&isAdmin()){selectedVisitId=null;selectedPresenceId=null;visitSteps=[];updateVisitExpansion();return;}
 if(e.target.closest('[data-admin-log-more]')&&isAdmin()){logLimit+=200;void loadAccess();return;}
 const test=e.target.closest('[data-admin-test-access]');
 if(test&&isAdmin()){toggleTestAccess(test.dataset.adminTestAccess);return;}
 const log=e.target.closest('[data-admin-log-tab]');
 if(log&&isAdmin()){logTab=log.dataset.adminLogTab;selectedVisitId=null;selectedPresenceId=null;visitSteps=[];updateLogPanel();if(logTab==='bots')void loadBotRuns();if(ACTIVITY_TABS.has(logTab))void loadVisitActivity();return}
 if(e.target.closest('[data-admin-log-refresh]')&&isAdmin()){loadPresence();loadAccess();loadGuestOnline();if(logTab==='bots')void loadBotRuns(true);if(ACTIVITY_TABS.has(logTab))void loadVisitActivity(true);return}
});

document.addEventListener('toggle',e=>{
 if(e.target.id!=='adminLogDisclosure'||!isAdmin())return;
 logOpen=e.target.open;
 if(!logOpen){
  secretLogOpen=false;secretLogClicks=0;lastSecretLogClick=0;logTab='online';
  selectedVisitId=null;selectedPresenceId=null;visitSteps=[];
  switchLogView();return;
 }
 if(Date.now()-lastPresence>5000||Date.now()-lastGuestCount>5000){
  loadPresence();loadGuestOnline();
 }
 if(secretLogOpen&&Date.now()-lastLog>5000){
  loadAccess();if(logTab==='bots')void loadBotRuns();if(ACTIVITY_TABS.has(logTab))void loadVisitActivity();
 }
},true);
/* As navegações são registradas no visit-path.js; presença online permanece independente. */

window.addEventListener('uentzoul:auth',()=>{
 refresh();heartbeat();
 if(user()?.id)void guestPresenceLeave();else void guestPresenceHeartbeat();
});
window.addEventListener('focus',()=>{refresh();heartbeat();guestPresenceHeartbeat();});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){refresh();heartbeat();guestPresenceHeartbeat();}});
window.addEventListener('online',()=>{refresh();heartbeat();guestPresenceHeartbeat();});
setInterval(()=>{if(document.visibilityState==='visible'){refresh();heartbeat();guestPresenceHeartbeat();}},45000);
// Mantém o painel online atualizando enquanto o administrador o consulta.
setInterval(()=>{
 if(!isAdmin()||!logOpen||!document.getElementById('adminConfigPage')||document.visibilityState!=='visible')return;
 void loadPresence();void loadGuestOnline();
},20000);
window.uentzoulAdminConfig={isAdmin,render,afterRender,refresh,loadPresence,loadReports};
let tries=0;
const start=()=>{if(client()){refresh();heartbeat();guestPresenceHeartbeat()}else if(tries++<40)setTimeout(start,800)};
start();
})();
