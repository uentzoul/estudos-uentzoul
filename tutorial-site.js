/* PsicoMoodle | Tutorial contextual, opcional e responsivo */
(()=>{
'use strict';
if(window.__psicoTutorialV1)return;
window.__psicoTutorialV1=true;

const chapters=[
 {id:'inicio',icon:'⌂',title:'Primeiros passos',tag:'Conheça a página inicial',intro:'A página inicial reúne as disciplinas e mostra como seus estudos estão avançando.',steps:[
  ['Encontre suas matérias','Na Biblioteca, veja os cartões de cada disciplina e use a busca para localizar uma matéria.'],
  ['Acompanhe o progresso','A porcentagem do semestre e as barras dos cartões refletem atividades e materiais marcados como concluídos.'],
  ['Abra um cartão','Selecione uma disciplina para encontrar as ferramentas e os conteúdos daquela matéria.']
 ],example:'Quer começar a estudar? Abra a disciplina da próxima prova e siga sua trilha de estudos.',route:'home'},
 {id:'disciplinas',icon:'▦',title:'Disciplinas',tag:'Tudo organizado por matéria',intro:'Cada disciplina reúne os recursos de estudo em um único lugar, sem precisar procurar em várias páginas.',steps:[
  ['Escolha uma disciplina','Clique no cartão correspondente na Biblioteca.'],
  ['Escolha uma ferramenta','Encontre Trilha de Estudos, Materiais e textos, Estudos dirigidos, Simulados, Flashcards, Casos, Podcasts e Conteúdos para revisar.'],
  ['Volte quando quiser','Retorne às opções da disciplina para trocar de atividade.']
 ],example:'Em Metapsicologia, também é possível acessar a Linha do Tempo das Aulas Gravadas.',route:'subject'},
 {id:'trilha',icon:'✧',title:'Trilha de estudos',tag:'Seu roteiro para a prova',intro:'É o melhor ponto de partida quando você não sabe por qual assunto começar.',steps:[
  ['Siga as etapas','Leia a explicação do tema e abra os materiais recomendados em cada etapa.'],
  ['Pratique sem sair da trilha','Use os podcasts, os flashcards e as questões relacionadas ao conteúdo.'],
  ['Conclua com um simulado','Depois de revisar os assuntos, faça uma prova para testar o que aprendeu.']
 ],example:'Leia um conceito, ouça a explicação e tente responder à questão antes de ver a resposta.',route:'trail'},
 {id:'materiais',icon:'▤',title:'Materiais e textos',tag:'Slides, artigos e arquivos',intro:'Os documentos ficam separados por categorias para facilitar a localização das leituras.',steps:[
  ['Abra Materiais e textos','Localize planos de ensino, aulas e apresentações, textos-base e outras categorias disponíveis.'],
  ['Escolha um documento','Clique no material para abri-lo. Quando houver um arquivo publicado, o site oferece acesso ao original.'],
  ['Registre o que estudou','Marque como visto ou concluído, quando essa opção aparecer, para atualizar seu acompanhamento.']
 ],example:'Antes de um simulado, abra os textos-base da disciplina e revise os pontos em que tem dúvida.',route:'docs'},
 {id:'revisao',icon:'☷',title:'Revisão e estudos dirigidos',tag:'Entenda antes de memorizar',intro:'Use essas áreas para organizar conceitos, tirar dúvidas e testar sua compreensão.',steps:[
  ['Revise os conceitos','Em Conteúdos para revisar, abra cada assunto e leia as explicações e os exemplos.'],
  ['Tente responder sozinho','Nos Estudos dirigidos, leia a pergunta e formule sua resposta antes de consultar a resolução.'],
  ['Confira a explicação','Compare seu raciocínio com o comentário para identificar o que ainda precisa estudar.']
 ],example:'Se errar uma pergunta, volte ao conceito na revisão e tente explicar a resposta com suas palavras.',route:'guided'},
 {id:'pratica',icon:'◇',title:'Flashcards e casos',tag:'Aprenda fazendo',intro:'São duas formas diferentes de praticar sem apenas reler os mesmos textos.',steps:[
  ['Teste sua memória','Nos Flashcards, tente lembrar da resposta antes de revelá-la. Marque Lembrei ou Pular conforme seu desempenho.'],
  ['Aplique os conceitos','Nos Estudos de casos, analise a situação e compare sua decisão com a justificativa apresentada.'],
  ['Retome o que foi difícil','Volte aos cartões ou aos casos que exigiram mais esforço.']
 ],example:'Depois de estudar uma teoria, faça flashcards e resolva um caso para verificar se consegue aplicá-la.',route:'flash'},
 {id:'simulados',icon:'✦',title:'Simulados',tag:'Treine para a avaliação',intro:'Os simulados ajudam a verificar o que você já domina e o que merece outra revisão.',steps:[
  ['Escolha como praticar','Abra um simulado pronto ou use Criar simulado para montar sua própria prova.'],
  ['Responda e entregue','Leia as alternativas com atenção e justifique as respostas dissertativas quando houver.'],
  ['Analise a correção','Confira os comentários, consulte seu histórico e compartilhe um simulado com colegas quando desejar.']
 ],example:'Após terminar, revise os assuntos das questões que errou antes de iniciar outro simulado.',route:'exams'},
 {id:'podcasts',icon:'♫',title:'Podcasts',tag:'Estude também ouvindo',intro:'Os episódios funcionam como apoio às leituras e podem ser encontrados dentro das disciplinas.',steps:[
  ['Selecione um episódio','Entre em Podcasts na disciplina e inicie a reprodução.'],
  ['Ajuste o ritmo','Use a linha do tempo, pause ou altere a velocidade para acompanhar melhor a explicação.'],
  ['Retome os assuntos','Ouça novamente um trecho e utilize o download quando o arquivo estiver disponível.']
 ],example:'Ouça um episódio após ler o texto correspondente e anote os conceitos que deseja revisar.',route:'podcasts'},
 {id:'mensagens',icon:'▤',title:'Mensagens e compartilhamento',tag:'Estude junto com seus colegas',intro:'Use conversas privadas e espaços de grupo para trocar dúvidas e conteúdos sem sair do site.',steps:[
  ['Escolha uma conversa','Abra Mensagens e selecione um colega ou um grupo.'],
  ['Compartilhe algo do site','Na conversa, abra a opção de compartilhar conteúdos do PsicoMoodle. Busque e selecione materiais, podcasts ou simulados do catálogo.'],
  ['Envie um simulado criado','Simulados personalizados podem ser compartilhados por conversa privada; o colega recebe um convite para acessá-los.']
 ],example:'Encontrou um artigo importante? Selecione-o na lista de materiais e envie o acesso diretamente ao colega.',route:'messages'},
 {id:'ia',icon:'✳',title:'IA Tzoul',tag:'Tire dúvidas sobre as aulas',intro:'A IA ajuda a estudar os assuntos e materiais disponíveis no PsicoMoodle.',steps:[
  ['Faça uma pergunta específica','Pergunte sobre um conceito, peça uma explicação com exemplo ou solicite a comparação entre duas teorias.'],
  ['Peça ajuda com materiais','Quando disponível, solicite arquivos da biblioteca, atividades ou explicações sobre trechos de uma leitura.'],
  ['Confirme informações importantes','Use a resposta para estudar e confira o material original, principalmente antes da prova.']
 ],example:'Experimente: “Explique reforço negativo com um exemplo clínico e depois faça uma pergunta para eu responder.”',route:'ai'},
 {id:'agenda',icon:'▦',title:'Agenda, perfil e pontos',tag:'Organize sua rotina',intro:'O site também ajuda a acompanhar datas, progresso e sua participação.',steps:[
  ['Confira a agenda','Veja dias de aula, horários e avaliações em Agenda e Horários.'],
  ['Acompanhe sua participação','Consulte o progresso, a pontuação e o ranking quando essas informações estiverem disponíveis.'],
  ['Personalize a experiência','Use o perfil e o modo claro/escuro. Se encontrar um problema, selecione Relatar erro no menu.']
 ],example:'Confira a data da próxima prova e abra a trilha da disciplina para organizar a revisão.',route:'calendar'}
];
let chapterIndex=0;
let overlay=null;
let lastFocus=null;
let scheduled=false;
let currentSubject='tcc';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const iconArrow='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';

function entry(){
 const section=document.querySelector('#main #homeCourses');
 if(!section||!section.querySelector('.course-toolbar')||!document.querySelector('#main .dashboard-hero'))return;
 let wrap=document.getElementById('pmTutorialEntry');
 if(!wrap){
  wrap=document.createElement('div');
  wrap.id='pmTutorialEntry';wrap.className='pm-tutorial-entry';
  wrap.innerHTML='<button type="button" class="pm-tutorial-launch" data-pm-help="launch" aria-haspopup="dialog" aria-controls="pmTutorialOverlay"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H20v15H6.5A2.5 2.5 0 0 1 4 16.5z"/><path d="M4 16.5A2.5 2.5 0 0 1 6.5 14H20M8 8h8"/></svg><span>Tutorial</span></button>';
 }
 if(wrap.nextElementSibling!==section)section.before(wrap);
}
function scheduleEntry(){
 if(scheduled)return;
 scheduled=true;
 requestAnimationFrame(()=>{scheduled=false;entry()});
}

function build(){
 if(overlay)return;
 overlay=document.createElement('div');
 overlay.id='pmTutorialOverlay';
 overlay.className='pm-tutorial-overlay';
 overlay.hidden=true;
 overlay.innerHTML=
  '<div class="pm-tutorial-shade" data-pm-help="close"></div>'+
  '<section class="pm-tutorial-dialog" role="dialog" aria-modal="true" aria-labelledby="pmTutorialTitle" tabindex="-1">'+
   '<header class="pm-tutorial-top"><div><span class="pm-tutorial-overline">GUIA DO PSICOMOODLE</span><h2 id="pmTutorialTitle">Aprenda a usar o site</h2><p>Escolha um assunto ou siga o guia na ordem que preferir.</p></div>'+
   '<button type="button" class="pm-tutorial-close" data-pm-help="close" aria-label="Fechar tutorial">×</button></header>'+
   '<div class="pm-tutorial-layout"><nav class="pm-tutorial-nav" aria-label="Assuntos do tutorial" id="pmTutorialNav"></nav>'+
   '<div class="pm-tutorial-content" id="pmTutorialContent" aria-live="polite"></div></div>'+
   '<footer class="pm-tutorial-footer"><span id="pmTutorialCount"></span><div class="pm-tutorial-footer-actions">'+
    '<button type="button" class="pm-tutorial-prev" data-pm-help="prev">Anterior</button>'+
    '<button type="button" class="pm-tutorial-next" data-pm-help="next">Próximo '+iconArrow+'</button></div></footer>'+
  '</section>';
 document.body.appendChild(overlay);
}

function render(){
 if(!overlay)return;
 const chapter=chapters[chapterIndex];
 const nav=overlay.querySelector('#pmTutorialNav');
 nav.innerHTML=chapters.map((c,i)=>'<button type="button" class="pm-tutorial-navitem'+(i===chapterIndex?' is-current':'')+'" data-pm-help="chapter" data-pm-index="'+i+'" aria-current="'+(i===chapterIndex?'step':'false')+'"><span class="pm-tutorial-navicon" aria-hidden="true">'+c.icon+'</span><span>'+esc(c.title)+'</span></button>').join('');
 const subjectOptions=[
  ['tcc','Teorias Comportamentais e Cognitivas'],['familia','Psicologia da Família'],['avaliacao','Avaliação Psicológica'],
  ['meta','Metapsicologia'],['grupos','Psicologia dos Grupos'],['social','Psicologia Social I']
 ];
 const isSubject=['subject','trail','docs','guided','flash','podcasts'].includes(chapter.route);
 overlay.querySelector('#pmTutorialContent').innerHTML=
  '<div class="pm-tutorial-step"><span class="pm-tutorial-step-number">'+String(chapterIndex+1).padStart(2,'0')+' / '+String(chapters.length).padStart(2,'0')+'</span><span class="pm-tutorial-step-tag">'+esc(chapter.tag)+'</span></div>'+
  '<h3>'+esc(chapter.title)+'</h3><p class="pm-tutorial-intro">'+esc(chapter.intro)+'</p>'+
  '<ol class="pm-tutorial-steps">'+chapter.steps.map((step,i)=>'<li><span class="pm-tutorial-step-index">'+(i+1)+'</span><div><strong>'+esc(step[0])+'</strong><p>'+esc(step[1])+'</p></div></li>').join('')+'</ol>'+
  '<div class="pm-tutorial-example"><span>NA PRÁTICA</span><p>'+esc(chapter.example)+'</p></div>'+
  '<div class="pm-tutorial-jump">'+(isSubject?'<label for="pmTutorialSubject">Disciplina de exemplo</label><select id="pmTutorialSubject">'+subjectOptions.map(x=>'<option value="'+x[0]+'"'+(currentSubject===x[0]?' selected':'')+'>'+esc(x[1])+'</option>').join('')+'</select>':'')+
  '<button type="button" class="pm-tutorial-visit" data-pm-help="visit">Ver no site '+iconArrow+'</button></div>';
 overlay.querySelector('#pmTutorialCount').textContent=(chapterIndex+1)+' de '+chapters.length+' assuntos';
 overlay.querySelector('[data-pm-help="prev"]').disabled=chapterIndex===0;
 const next=overlay.querySelector('[data-pm-help="next"]');
 next.innerHTML=chapterIndex===chapters.length-1?'Concluir':'Próximo '+iconArrow;
 nav.querySelector('[aria-current="step"]')?.scrollIntoView({block:'nearest'});
 overlay.querySelector('.pm-tutorial-content').scrollTop=0;
}
function open(index){
 build();
 chapterIndex=Math.max(0,Math.min(chapters.length-1,Number(index)||0));
 lastFocus=document.activeElement;
 overlay.hidden=false;
 document.documentElement.classList.add('pm-tutorial-open');
 render();
 overlay.querySelector('.pm-tutorial-close')?.focus({preventScroll:true});
}
function close(){
 if(!overlay||overlay.hidden)return;
 overlay.hidden=true;
 document.documentElement.classList.remove('pm-tutorial-open');
 if(lastFocus&&lastFocus.isConnected)lastFocus.focus({preventScroll:true});
}
function change(next){
 chapterIndex=Math.max(0,Math.min(chapters.length-1,next));
 render();
}

function markTarget(selector){
 requestAnimationFrame(()=>{
  const node=document.querySelector(selector);
  if(!node)return;
  try{node.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});}catch(_){}
  node.classList.add('pm-tutorial-pointed');
  setTimeout(()=>node.classList.remove('pm-tutorial-pointed'),2800);
 });
}
function visit(){
 const chapter=chapters[chapterIndex],route=chapter.route;
 close();
 const home=()=>document.querySelector('#nav [data-page="home"]')?.click();
 if(route==='home'){home();markTarget('#main #homeCourses');return}
 if(['exams','messages','ai','calendar'].includes(route)){
  const button=document.querySelector('#nav [data-page="'+route+'"]');
  if(button){button.click();markTarget('#main > :first-child')}return;
 }
 // A navegação é feita pelos mesmos botões do site, sem modificar o estado interno.
 const pick=()=>{
  const selector='[data-action="subject:'+currentSubject+'"]';
  let target=document.querySelector('#nav '+selector)||document.querySelector('#main '+selector);
  if(!target){home();target=document.querySelector('#nav '+selector)||document.querySelector('#main '+selector)}
  if(!target)return;
  target.click();
  const area={trail:'trail',docs:'docs',guided:'guided',flash:'flash',podcasts:'podcasts'}[route];
  if(area){
   const button=document.querySelector('#main [data-action="subjectArea:'+area+'"]');
   if(button)button.click();
   markTarget('#main .subject-hub-area');
  }else markTarget('#main .subject-hub-menu');
 };
 pick();
}
function handleClick(event){
 const target=event.target.closest('[data-pm-help]');
 if(!target)return;
 event.preventDefault();event.stopPropagation();
 const cmd=target.dataset.pmHelp;
 if(cmd==='launch')open(0);
 else if(cmd==='close')close();
 else if(cmd==='chapter')change(Number(target.dataset.pmIndex));
 else if(cmd==='prev')change(chapterIndex-1);
 else if(cmd==='next'){if(chapterIndex===chapters.length-1)close();else change(chapterIndex+1)}
 else if(cmd==='visit')visit();
}
function handleKeys(event){
 if(!overlay||overlay.hidden)return;
 if(event.key==='Escape'){event.preventDefault();close();return}
 if(event.key!=='Tab')return;
 const focusable=Array.from(overlay.querySelectorAll('button:not([disabled]),select')).filter(el=>el.getClientRects().length>0);
 if(!focusable.length)return;
 const first=focusable[0],last=focusable[focusable.length-1];
 if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
 else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
}
function init(){
 build();entry();
 const main=document.getElementById('main');
 if(main)new MutationObserver(scheduleEntry).observe(main,{childList:true});
 document.addEventListener('click',handleClick,true);
 document.addEventListener('keydown',handleKeys,true);
 document.addEventListener('change',event=>{if(event.target.id==='pmTutorialSubject')currentSubject=event.target.value},true);
 window.psicoOpenTutorial=open;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
