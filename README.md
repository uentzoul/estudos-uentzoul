# PsicoMoodle
Central de estudos de Psicologia 2026/2, responsiva para desktop, Android e iOS.

## Conteúdo do site
O `index.html` publicado contém as seis disciplinas e o catálogo ativo de **40 podcasts**:
- TCC: 10 episódios
- Psicologia de Grupos: 6 episódios
- Psicologia da Família: 7 episódios
- Metapsicologia: 6 episódios no catálogo da P2 (o episódio sobre o tema excluído foi retirado da revisão ativa, sem apagar o arquivo original)
- Avaliação Psicológica: 5 episódios
- Psicologia Social: 6 episódios (outros dois ainda não recebidos)

## Atenção — hospedagem dos áudios
**Os arquivos M4A ainda precisam ser transferidos para este repositório.** O catálogo e os botões de download estão no HTML, mas só funcionarão quando os arquivos reais estiverem publicados em `audios/<disciplina>/<episodio>.m4a`. Não é necessário ter áudio pré-instalado no celular: cada arquivo é transferido sob demanda quando hospedado.

## GitHub Pages
Workflow de publicação em `.github/workflows/pages.yml`. Em **Settings → Pages**, escolha **Source: GitHub Actions**. Após a implantação, o endereço previsto é https://uentzoul.github.io/estudos-uentzoul/.

## Acesso às contas

O acesso ao site é feito por e-mail e senha usando o cadastro próprio do PsicoMoodle. As contas atuais continuam válidas.

## IA Tzoul e simulados personalizados

- Histórico de conversas separado por estudante, com opção de abrir, renomear e excluir chats anteriores.
- A IA Tzoul consulta a base de materiais do semestre, com opção de respostas aprofundadas.
- A aba Simulados apresenta provas com 15 questões. Na revisão de Metapsicologia (P2), cada um dos cinco simulados possui exclusivamente 15 questões objetivas: 7 de múltipla escolha, 5 de combinações de afirmativas e 3 de verdadeiro ou falso, sem dissertativas. Nas demais disciplinas, a distribuição depende da prova e do roteiro de estudos.
- Dificuldades Normal e Difícil, com questões voltadas ao estilo documentado dos professores.
- Uma entrega por pessoa por prova; depois de entregue, o simulado fica para consulta da correção.
- Compartilhamento das provas geradas com outros estudantes cadastrados. Gabaritos permanecem protegidos no servidor até a entrega.

## Atualizações da comunidade — novembro de 2026

### Mensagens

Todos os tipos de chat ficam na aba **Mensagens**: **Privadas**, **Grupos** e **Global**. A primeira opção conversa com outros perfis do ranking; a segunda permite criar grupos e escolher participantes; a terceira é visível a todos os usuários autenticados.

Recursos: mensagens com horário e data; stickers iniciais em emoji; envio de imagens PNG/JPEG/WebP/GIF até 5 MB em bucket privado; marcar DMs como lidas; apagar uma mensagem própria para todos. A exclusão é uma redação irreversível do conteúdo no banco, e o cliente tenta remover o arquivo correspondente do armazenamento. URLs de imagem assinadas anteriormente podem continuar válidas até expirar.

A segurança usa autenticação Supabase, políticas RLS para mensagens privadas e de grupo, checagem de associação a grupos e armazenamento privado. O chat global não é privado: qualquer pessoa cadastrada pode ler as mensagens.

### Ranking e progresso

Os botões **Marcar como visto / ✓ Visto** permanecem marcadores de acompanhamento de estudo; não concedem pontos. O ranking utiliza somente a tabela de **premiações por simulados oficiais de 2026/2 verificadas no servidor**.

Regra atual: cada simulado oficial pode render **10 pontos** se a pessoa acertar pelo menos **70% das questões objetivas na primeira tentativa válida**. O servidor impõe limite de tentativas e não permite pontuar duas vezes no mesmo simulado. Simulados pessoais não pontuam. O registro antigo de atividades permanece na área de progresso, mas não é convertido automaticamente em pontos.

Limitação: o HTML histórico ainda inclui gabaritos necessários à correção local. Um usuário tecnicamente avançado ainda pode examiná-los. A validação pelo servidor evita falsificação direta do ranking e pontuação por caixas de seleção, mas **não é uma prova antifraude inviolável**. Para maior robustez no futuro, entregar questões e gabaritos exclusivamente pelo servidor e randomizar versões das provas.

### Aba Pessoal

A aba **Pessoal** foi reconstruída como um espaço de estudo privado por matéria:

- Na tela inicial, o estudante vê cartões animados com os nomes das matérias e pode selecionar **Criar uma nova matéria**.
- O cadastro abre uma janela para informar nome, anotações iniciais, arquivos e referências.
- Cada matéria reúne **Visão geral**, **Materiais**, **Agenda**, **Simulados** e **IA / Documentos**.
- Fontes: anotações, links HTTPS e arquivos PDF, DOCX, PPTX, TXT e Markdown (até 12 MB por arquivo). São enviados a um bucket privado e protegidos por políticas RLS. Links são referências; o conteúdo de páginas externas não é extraído automaticamente.
- Agenda: calendário mensal interativo, compromissos com data, hora, tipo, observações e conclusão.
- Simulados: uma prova inédita por solicitação, com 13 objetivas e 2 dissertativas, dificuldade normal ou difícil, apenas uma entrega por pessoa e histórico de revisão. Simulados anteriores de seis questões continuam em consulta.
- IA Tzoul: criação de resumos, fichamentos, trabalhos, roteiros de estudo, questões e pedidos personalizados. Os textos ficam salvos na própria matéria e podem ser exportados.
- As anotações e os simulados antigos das contas cadastradas foram preservados. O conteúdo das matérias é privado, independente do ranking e das disciplinas oficiais.

A Edge Function **ia-tzoul** valida a sessão e confere a titularidade da matéria antes de consultar os materiais. A geração usa a **OPENAI_API_KEY** do servidor e depende dos créditos disponíveis e da cota diária. O servidor mantém os gabaritos das novas provas separados do conteúdo fornecido antes da entrega.

### Interface e comunicação

A Biblioteca foi alinhada com títulos, contadores e materiais distribuídos em grades estáveis para computador e celular. Em mensagens de grupos e no chat global, avisos destinados à coletividade utilizam tratamento no plural.


## Trabalhos — prévia exclusiva do administrador (20/11/2026)

A navegação **Trabalhos** continua visível com o aviso **Em breve** para visitantes e estudantes. Apenas contas confirmadas como administradoras pela verificação `uentzoul_is_admin` do Supabase podem abrir a primeira versão de teste (botão **Trabalhos · Teste**).

A prévia, em `trabalhos.js` e `trabalhos.css`, contém **Meus trabalhos**, **Criar trabalho** e **Minha rota**: cadastro do enunciado, identificação orientadora de exigências, checklist editável, seis etapas com perguntas reflexivas, mapa de decisões, escolhas metodológicas, organização de tarefas em grupo e exportação de roteiro em TXT. Não redige automaticamente o trabalho acadêmico.

**Conferência (20/11/2026):** a seção `trabalhos-conferencia.js` / `.css` lê documentos locais em **PPTX, PDF, DOCX, TXT e Markdown**, permitindo analisar apenas slides, apenas texto escrito ou ambos. O conteúdo textual extraído é enviado somente após clique explícito, para a Edge Function `trabalhos-revisao`, cuja autenticação e autorização de administrador são verificadas no servidor. A função usa a chave OpenAI apenas no servidor, consulta a cota de IA Tzoul e retorna sugestões específicas com localização, justificativa e possível ajuste; a prioridade é fidelidade ao enunciado, argumentação, coerência, estrutura, evidências e adequação de cada gênero acadêmico. Não é nota, detector de plágio nem avaliação visual de imagens, diagramas ou diagramação. PDFs digitalizados sem texto selecionável precisam de conversão prévia ou texto colado manualmente. Dependências de leitura de PDF/Office são carregadas sob demanda via CDN e precisam de conexão.

**Dados:** arquivos originais e textos extraídos não são armazenados no servidor nem gravados no rascunho local; o texto enviado passa pela API de IA com `store:false`. O último parecer gerado, sem os materiais originais, fica registrado no armazenamento local da conta administradora neste navegador. Os testes automatizados de regressão da Conferência estão em `tests/trabalhos.test.mjs`.

**Persistência temporária:** nesta fase, os registros são armazenados apenas no `localStorage` do navegador e associados ao ID da conta administradora. Não existe sincronização entre dispositivos ou colaboração em tempo real. Não utilizar a prévia para dados sensíveis. A liberação para estudantes dependerá de autorização explícita e de uma futura camada de persistência segura no servidor, com políticas RLS.

## Política de preservação de dados (obrigatória nas atualizações)

**Não apagar ou reinicializar mensagens, conversas, simulados, respostas, provas entregues, matérias pessoais, agenda, histórico ou progresso ao atualizar a aparência ou funcionalidades do site.** Fazer alterações incrementais no código e migrações não destrutivas. Não usar TRUNCATE, DROP TABLE, migrações que esvaziem registros, nem sobrescrever históricos com arrays vazios em atualização automática. Exclusão só pode ocorrer por ação explícita e confirmada da própria pessoa sobre o seu conteúdo. Testar antes de publicar.

## Atualização sem recarregar a página

As mensagens privadas, dos grupos e do chat global utilizam Supabase Realtime e verificação de segurança periódica na aba aberta, inclusive ao retornar ao site. Compartilhamentos e novos simulados gerais também são atualizados por eventos e checagem periódica. A área Pessoal atualiza seus conteúdos sem recarregamento da página e preserva anotações em edição. O andamento de simulados gerais e pessoais fica salvo localmente durante a tentativa, além de as entregas concluídas permanecerem no Supabase.

Os enunciados dos simulados usam separação de parágrafos, assertivas I/II/III em blocos próprios e destaque do comando final. Emojis decorativos são suprimidos apenas na exibição, sem alterar as questões já salvas; a IA foi orientada a não gerá-los em provas novas.


## Prévia administrativa — Caderno (15/11/2026)

O menu ganha uma entrada **Caderno · Em breve**, logo depois de **Simulados**. Essa entrada é criada exclusivamente para contas que o Supabase confirma como administradoras (função uentzoul_is_admin); não aparece para estudantes ou visitantes. O acesso leva à página caderno.html dentro de um iframe de mesma origem, e o próprio editor valida novamente a sessão administrativa. A função de IA do servidor também faz autorização no Supabase.

**Primeiro protótipo:**
- Caderno pautado com 30 linhas por página, título opcional, folha longa, até 250 páginas no teste, virada com canto animado e navegação anterior/próxima.
- Digitação ao clicar em uma linha; prévia na própria folha e caixa editável; Enter insere, Shift+Enter acrescenta linha. Corrige gramática depois, preservando primeiro o texto original.
- Fontes manuais Patrick Hand (letra de forma) e Caveat (cursiva), cores preto/azul/vermelho, alturas de 1/2/3 linhas e caixa alta com uma linha adicional.
- Post-its editáveis e arrastáveis; desenho à mão livre; opção de ajustar círculos, elipses, retângulos, linhas e curvas; ferramenta de deformação somente para traços previamente ajustados.
- Zoom com roda do mouse, controles dedicados e gesto de pinça no celular. O toque móvel aguarda confirmação para não abrir o editor durante a rolagem.
- Atalhos configuráveis para ações, teclas e botões secundários do mouse. Atalhos reservados pelo navegador e clique principal não são substituíveis.
- Exportação em JSON e desfazer/refazer.

**Persistência e limites desta prévia:** o conteúdo é salvo **somente no armazenamento local do navegador, separado por ID da conta**; ainda não sincroniza dispositivos ou navegadores e pode ser perdido caso o armazenamento local seja limpo. Recomenda-se exportar cópias de segurança. O editor preserva a anotação original se a revisão falhar. A função caderno-revisao (Supabase Edge, JWT obrigatório e uentzoul_is_admin) recebe apenas o trecho a corrigir e usa a chave da OpenAI somente no servidor. Revisões podem depender de créditos e latência da IA; não há garantia semântica absoluta. Não foram alteradas ou limpas tabelas de dados do site. Testes de sintaxe e de reconhecimento geométrico foram adicionados; testes manuais com contas reais em Safari/Chrome ainda são necessários antes da liberação geral.

Os arquivos caderno.html, caderno.css e caderno.js são separados das demais páginas. A integração do menu está no final de site-version.js.

## Funcionalidade prevista — Trabalhos

A seção **Trabalhos** aparece no menu principal apenas como prévia. Não tem rota, botão de acesso nem funcionalidade liberada. Ao passar o mouse ou focar a entrada, aparece "Em breve"; no celular essa indicação fica visível.

Para a futura implementação, a proposta é centralizar os trabalhos acadêmicos de cada disciplina:

- Vincular cada trabalho ao cronograma e ao plano de ensino correspondentes, com tema, prazo, professor, formato e critérios de avaliação, se informados.
- Exibir as orientações oficiais, materiais necessários, referências, arquivos e links de apoio sem substituir ou inventar determinações do professor.
- Permitir redigir e organizar o trabalho na própria plataforma, com salvamento por usuário e recuperação de versões, quando esse editor for desenvolvido.
- Criar um checklist de requisitos efetivamente extraídos das orientações recebidas e verificar quais foram atendidos, quais ainda faltam e quais exigem revisão manual.
- Integrar a atividade à agenda de avaliações, aos conteúdos da disciplina e aos materiais de texto sem duplicar dados.
- Deixar claro que a conferência automatizada é auxiliar e não equivale à avaliação ou aprovação do professor.

**Estado atual:** apenas item visual não clicável, sem inserir tarefas fictícias, sem acionar banco de dados nem criar nova aba funcional.


## Fundo do chat — licença

O fundo padrão das mensagens usa a estampa **Topography**, de **Steve Schoger / Hero Patterns**, distribuída sob [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Fonte: https://heropatterns.com/ (repositório: https://github.com/sschoger/hero-patterns). A estampa foi recolorida e teve sua opacidade ajustada para os temas claro e escuro do PsicoMoodle. Os arquivos estão em `assets/chat-topography-light.svg` e `assets/chat-topography-dark.svg`. Créditos mantidos também no CSS e nos SVGs.


## Chamadas em grupos e conversas privadas — 17/11/2026

A aba **Mensagens** oferece o botão **Entrar na call** tanto ao abrir uma conversa em **Grupos** quanto em **Privadas**. **Chat Geral não tem chamadas.** O botão abre a prévia com microfone e câmera configuráveis, e a pessoa confirma sua entrada antes de transmitir. Na conversa individual, **cada um dos dois participantes precisa abrir a mesma conversa e entrar na call**; ainda não existe toque ou notificação automática de chamada recebida.

Durante a call: voz e vídeo WebRTC, compartilhamento de tela nos navegadores compatíveis, participantes, levantar a mão, reações, fixação de participante, tela cheia, troca de dispositivos e painel integrado às mensagens existentes. Em privadas, o painel usa `uentzoul_messages`, sem misturar com mensagens de grupos; em grupos, usa `uentzoul_room_messages`. A tela utiliza nome/foto do grupo ou contato e é adaptada para desktop e celular. Ao sair, os canais e as faixas de captura são encerrados, sem apagar o histórico.

**Segurança:** a sinalização em grupos usa tópicos `uentzoul-call:<id>` com RLS de membros. Nas privadas, os tópicos são `uentzoul-dm-call:<uuid-menor>:<uuid-maior>`, com políticas SELECT/INSERT em `realtime.messages` que autorizam apenas as duas contas autenticadas identificadas no tópico; a ordenação garante que ambos entrem na mesma sala. Canais usam `private:true`; a opção global "Allow public access" deve ficar desativada nas configurações de Realtime para impor autorização aos canais privados. O áudio e vídeo trafegam por WebRTC, não pelo banco de mensagens. Em grupos, a participação é reconferida periodicamente.

**Navegação enquanto a call está ativa:** depois de entrar numa call, toque em **─ Minimizar chamada** no cabeçalho. A call passa a ser uma janela flutuante no canto inferior direito, com imagem do participante em destaque, câmera própria quando ligada, microfone, câmera, ampliar e sair. O restante do site pode ser usado normalmente (Caderno, simulados, outras seções). Para voltar à sala, use **⛶ Abrir chamada completa** na janelinha ou abra a conversa original e clique no botão de chamada. Minimizar **não** encerra o canal WebRTC nem os dispositivos e **não** abre um novo stream. O atualizador automático também respeita chamadas ativas e adia recarregamentos.

A janela acompanha apenas a navegação **interna sem recarregar a página**. Recarregar o navegador, fechar a aba ou sair do site encerra a sessão; não há continuidade em segundo plano entre páginas independentes. No celular, o navegador pode restringir microfone, vídeo ou a execução quando o aplicativo fica em segundo plano.

**Capacidade e limitações importantes:** esta é uma implementação WebRTC peer-to-peer (malha), dimensionada inicialmente para **até seis participantes simultâneos** por chamada. Usa STUN e aceita configuração opcional de servidores TURN através de `window.UENTZOUL_CALL_ICE_SERVERS`. Sem um TURN de produção, algumas combinações de firewall/NAT podem impedir a conexão; não se deve garantir conectividade universal. Para escalar sem sobrecarregar os usuários e oferecer confiabilidade semelhante ao Google Meet, é necessário contratar/provisionar um serviço de mídia com **SFU** (por exemplo LiveKit) e **TURN** com credenciais temporárias. Compartilhamento de tela pode estar indisponível no iPhone e em alguns navegadores móveis. Gravação de reunião, legendas automáticas, salas simultâneas e efeitos de fundo não foram implementados.

O código do recurso fica isolado em `group-call.js` e `group-call.css`, carregados diretamente pelo `index.html`. O site depende de HTTPS, permissão de câmera/microfone e deve ser validado manualmente com ao menos dois perfis reais em redes diferentes, no Chrome e Safari, antes de considerar chamadas em produção testadas ponta a ponta.

## TetrisZoul — 40 linhas (20/11/2026)

O TetrisZoul é um jogo independente inspirado no Sprint de 40 linhas: tabuleiro 10×20, 7-bag, Hold, SRS, Ghost Piece, cronômetro e controles ajustáveis. Acessível apenas a administradores pela quarta e última aba de **Extras**, em iframe ou tela própria (tetriszoul.html). **Não existe mais atalho no Admin Config.** A página do jogo e a tabela de recordes uentzoul_tetriszoul_runs verificam a permissão administrativa; os tempos pessoais já salvos permanecem.

**Futuro, não implementado:** permitir o cargo **Tetris**, cumulativo com outros cargos. Não habilitar esse cargo sem nova autorização.

## Extras — jogos de Psicologia (20/11/2026)

- **Acesso:** Extras aparece abaixo de Trabalhos e é acessível às contas conectadas. **PSICO**, **CONTEXTO** e **VÍNCULO** aparecem para todas elas, nessa ordem. **Tetris** é a quarta aba, visível e utilizável somente por administradores. A persistência Supabase tem RLS por conta.
- **Calendário:** um único botão abre o calendário mensal. Desafios de **20/11/2026** até o dia atual em America/Sao_Paulo, sem dias anteriores ou futuros. Cada conta mantém estado independente por data e jogo.
- **PSICO:** cinco letras, seis tentativas e teclado nativo. Banco de **90 respostas** de cinco letras, abrangendo psicologia geral. A resposta inaugural permanece **EXAME**.
- **VÍNCULO:** quatro grupos de quatro palavras, com categorias academicamente corretas, conceitos gerais e autores estudados. Mistura temas próximos em dias posteriores; não existe limite de erros. Suporta reorganizar palavras por arraste, marcar com botão direito e ativar modo de marcação por toque. O catálogo tem **34 categorias**. As quatro conexões do dia inaugural foram preservadas.
- **CONTEXTO:** palpites livres sem sugestões automáticas. Vocabulário ampliado para **16 domínios semânticos** e **89 respostas possíveis**; a resposta inaugural permanece **polarização**. Palpites fora da base são aceitos e classificados por aproximação lexical. Palavras catalogadas seguem relações temáticas; não é um modelo de embeddings universal nem uma cópia integral do Contexto original.
- **Progresso:** tabela uentzoul_extras_progress por usuário, jogo e data, sincronizada com cache local. Os resets específicos do PSICO e VÍNCULO em 20/11/2026 têm revisão própria para impedir restauração do progresso antigo por caches de navegador.
- **Integridade:** código e respostas estáticas do GitHub Pages podem ser inspecionados; a autorização no Supabase protege os dados, não torna as respostas um segredo criptográfico. Um cargo Tetris futuro exigirá autorização também no banco de recordes, sem alterar o acesso atual.
