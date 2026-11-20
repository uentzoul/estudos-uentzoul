/* PsicoMoodle — tutorial independente do Caderno.
   A demonstração só muda a navegação temporária: não insere nem apaga notas. */
(function(){
 'use strict';
 const root=document.getElementById('nbRoot');
 if(!root)return;
 const steps=[
  {view:'shelf',target:'.nb-shelf-heading',title:'Seus cadernos',body:'Cada disciplina tem um caderno exclusivo. Para salvar e recuperar suas páginas em outro aparelho, você entra com a sua conta do PsicoMoodle.'},
  {view:'shelf',target:'.nb-shelf-book',title:'Escolha a matéria',body:'As capas organizam os conteúdos por disciplina. Clique em qualquer uma para abrir suas páginas. Vamos entrar em um caderno de exemplo sem modificar as anotações.'},
  {view:'shelf',target:'[data-nb-import]',title:'Recuperar um caderno salvo',body:'O botão Importar caderno (JSON) abre um arquivo editável que você salvou antes. Ele cria uma nova capa na estante, sem apagar ou substituir o que já está escrito. Textos, cores, datas, desenhos, post-its e páginas continuam editáveis. O PDF não serve para restaurar a edição.'},
  {view:'book',target:'.nb-top-right',title:'Abrir e editar',body:'Uma matéria já preenchida abre em modo de leitura. O botão Editar permite começar a escrever e desenhar. Cadernos retorna à estante.'},
  {view:'book',target:'#nbPageRail',title:'Lista de folhas',body:'À esquerda você encontra as miniaturas das folhas. Clique em uma página para acessá-la diretamente, sem precisar virar todas as anteriores.'},
  {view:'book',target:'.nb-page-control',title:'Navegação e zoom',body:'Os botões inferiores Anterior, Próxima e Folhas organizam a navegação. O zoom aproxima o papel sem alterar os conteúdos.'},
  {view:'edit',target:'#nbEditToggle',title:'Modo de edição',body:'O botão Editar ativa a barra de ferramentas. Neste tutorial a edição fica bloqueada, assim não há risco de modificar uma nota existente.'},
  {view:'edit',target:'[data-nb-action="text"]',title:'Escrever na pauta',body:'Escolha Escrever e clique na pauta. Enter ao final abre uma nova linha; no meio do texto, cria uma quebra sem apagar o restante. Backspace no início une à linha anterior ou volta a uma pauta vazia; Delete no fim pode unir com a seguinte. As setas atravessam as linhas. Tab recua, Shift + Tab remove recuo e uma seleção com várias linhas também pode ser recuada. As ferramentas visuais continuam separadas.'},
  {view:'edit',target:'[data-nb-menu-toggle="lists"]',title:'Listas com tópicos e numeração',body:'Abra Listas (☷) para escolher • Tópicos ou 1. Numeração. Enter cria automaticamente o próximo item. Para desativar uma lista, apague o símbolo • ou o número no começo da linha com Backspace. O marcador é um caractere comum.'},
   {view:'edit',target:'[data-nb-action="select"]',title:'Selecionar itens',body:'Use Selecionar para escolher textos, desenhos e post-its, reposicioná-los e acessar opções de ajustes.'},
  {view:'edit',target:'[data-nb-action="draw"]',title:'Desenhar à mão',body:'Escolha Desenhar para escrever ou fazer esquemas com a tinta preta, azul-marinho ou vermelha. Os traços ficam associados à folha.'},
  {view:'edit',target:'#nbSmooth',title:'Ajustar traços',body:'Com Ajustar traços ativado, o caderno tenta corrigir linhas, círculos, elipses, meia-luas, arcos e polígonos. Formas complexas recebem suavização.'},
  {view:'edit',target:'[data-nb-action="erase"]',title:'Borracha',body:'Apague trechos ou traços inteiros de desenhos. Você pode selecionar o tipo de borracha e seu raio, sem precisar apagar a página toda.'},
  {view:'edit',target:'[data-nb-action="sticky"]',title:'Post-its',body:'Cole pequenos lembretes no papel. Escreva, escolha a cor, mova o post-it e exclua quando não precisar mais dele.'},
  {view:'edit',target:'[data-nb-action="warp"]',title:'Moldar desenhos',body:'Em Moldar, arraste diretamente qualquer trecho do desenho para deformar só aquela região. O quadradinho move o desenho inteiro sem deformar.'},
  {view:'edit',target:'[data-nb-menu-toggle="colors"]',title:'Cores e formatação',body:'Abra 🎨 para escolher caneta preta, azul-marinho ou vermelha. Uma nova cor vale só para o que for digitado a partir do cursor; o texto anterior mantém a cor. Para recolorir algo já escrito, selecione o trecho antes de escolher a cor. Fontes abre as três letras, e o ícone de linhas abre o alinhamento. As sete ferramentas principais têm ícones e nomes ao passar o mouse.'},
  {view:'edit',target:'#nbLayout',title:'Caderno aberto',body:'No menu Estilo você alterna entre folha única e caderno aberto, com duas folhas lado a lado. A encadernação central não recebe escrita ou desenhos.'},
  {view:'edit',target:'[data-nb-action="undo"]',title:'Desfazer, refazer e atalhos',body:'As setas desfazem e refazem alterações. O botão Atalhos permite personalizar teclas e botões do mouse.'},
  {view:'read',target:'[data-nb-export-toggle]',title:'PDF ou caderno editável (JSON)',body:'Clique em Exportar e escolha: Exportar PDF, para ler ou imprimir; ou Salvar caderno editável (JSON), para guardar uma cópia de segurança de toda esta matéria. O JSON guarda páginas, textos, cores, desenhos, post-its e posições. Para restaurá-lo, volte à estante e clique em Importar caderno (JSON). A sincronização automática com sua conta continua funcionando, mas vale manter um arquivo de backup.'},
  {view:'shelf',target:'.nb-shelf-tutorial-bar',title:'Pronto para usar',body:'Volte sempre ao tutorial por este botão, no canto superior direito da estante. Suas anotações reais não foram modificadas na demonstração.'}
 ];
 let active=false,index=0,overlay=null,originalShelf=true,originalEdit=false;
 const visible=(element)=>element&&!element.hidden&&element.getBoundingClientRect().width>0;
 function click(selector){
  const el=root.querySelector(selector);
  if(el&&!el.disabled)el.click();
 }
 function arrange(view){
  const shelf=root.querySelector('#nbShelf');
  if(view==='shelf'){
   if(shelf&&!visible(shelf))click('[data-nb-action="backToBooks"]');
  }else{
   if(shelf&&visible(shelf))click('[data-nb-shelf-book]');
   const editing=root.classList.contains('nb-editing');
   if(view==='edit'&&!editing)click('#nbEditToggle');
   if(view==='read'&&editing)click('#nbEditToggle');
  }
 }
 function align(){
  if(!active||!overlay)return;
  const focus=overlay.querySelector('.nb-tour-focus');
  const target=root.querySelector(steps[index].target);
  if(!focus||!target){if(focus)focus.hidden=true;return}
  const rect=target.getBoundingClientRect();
  if(rect.width<8||rect.height<8||rect.bottom<=0||rect.top>=innerHeight||
    rect.right<=0||rect.left>=innerWidth){focus.hidden=true;return}
  focus.hidden=false;
  focus.style.left=Math.max(3,rect.left-5)+'px';
  focus.style.top=Math.max(3,rect.top-5)+'px';
  focus.style.width=Math.min(innerWidth-6,rect.width+10)+'px';
  focus.style.height=Math.min(innerHeight-6,rect.height+10)+'px';
 }
 function show(next){
  if(!active)return;
  index=Math.max(0,Math.min(next,steps.length-1));
  const step=steps[index];
  arrange(step.view);
  overlay.querySelector('[data-nb-tour-count]').textContent=(index+1)+' de '+steps.length;
  overlay.querySelector('[data-nb-tour-heading]').textContent=step.title;
  overlay.querySelector('[data-nb-tour-text]').textContent=step.body;
  overlay.querySelector('[data-nb-tour-previous]').disabled=index===0;
  overlay.querySelector('[data-nb-tour-next]').textContent=index===steps.length-1?'Concluir':'Próxima ›';
  requestAnimationFrame(align);
  // A capa tem uma transição 3D. Atualizar o destaque ao final dela, sem reposicionar a página.
  if((index>0&&steps[index-1].view==='shelf'&&step.view!=='shelf')||index===steps.length-1)
   setTimeout(()=>{if(active)align()},900);
 }
 function finish(){
  if(!active)return;
  active=false;document.documentElement.classList.remove('nb-tour-active');
  overlay?.remove();overlay=null;
  if(!originalShelf) return;
  if(!visible(root.querySelector('#nbShelf')))click('[data-nb-action="backToBooks"]');
 }
 function begin(){
  if(active||!visible(root.querySelector('#nbShelf')))return;
  originalShelf=true;originalEdit=root.classList.contains('nb-editing');
  active=true;index=0;
  document.documentElement.classList.add('nb-tour-active');
  overlay=document.createElement('div');
  overlay.id='nbNotebookTutorial';overlay.className='nb-tour-screen';
  overlay.innerHTML='<div class="nb-tour-focus" aria-hidden="true" hidden></div>'+
   '<section class="nb-tour-card" role="dialog" aria-modal="true" aria-labelledby="nbTourHeading">'+
   '<div class="nb-tour-head"><span data-nb-tour-count></span>'+
   '<button type="button" data-nb-tour-exit aria-label="Fechar tutorial">×</button></div>'+
   '<h2 id="nbTourHeading" data-nb-tour-heading></h2><p data-nb-tour-text></p>'+
   '<div class="nb-tour-actions"><button type="button" data-nb-tour-previous>‹ Anterior</button>'+
   '<button type="button" class="nb-tour-next" data-nb-tour-next>Próxima ›</button></div>'+
   '</section>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click',event=>{
   if(event.target.closest('[data-nb-tour-exit]')){finish();return}
   if(event.target.closest('[data-nb-tour-previous]')){show(index-1);return}
   if(event.target.closest('[data-nb-tour-next]')){
    if(index===steps.length-1)finish();else show(index+1);
   }
  });
  show(0);overlay.querySelector('[data-nb-tour-next]')?.focus({preventScroll:true});
 }
 root.addEventListener('click',event=>{
  if(event.target.closest('[data-nb-tour-start]')){event.preventDefault();begin();}
 },true);
 window.addEventListener('keydown',event=>{
  if(active&&event.key==='Escape'){event.preventDefault();finish();}
 });
 window.addEventListener('resize',()=>{if(active)requestAnimationFrame(align)},{passive:true});
 window.addEventListener('scroll',()=>{if(active)requestAnimationFrame(align)},true);
 window.addEventListener('pagehide',finish);
})();
