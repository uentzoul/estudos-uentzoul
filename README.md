# Estudos Uentzoul
Central de estudos de Psicologia 2026/2, responsiva para desktop, Android e iOS.

## Conteúdo do site
O `index.html` publicado contém as seis disciplinas e o catálogo de **41 podcasts**:
- TCC: 10 episódios
- Psicologia de Grupos: 6 episódios
- Psicologia da Família: 7 episódios
- Metapsicologia: 7 episódios
- Avaliação Psicológica: 5 episódios
- Psicologia Social: 6 episódios (outros dois ainda não recebidos)

## Atenção — hospedagem dos áudios
**Os arquivos M4A ainda precisam ser transferidos para este repositório.** O catálogo e os botões de download estão no HTML, mas só funcionarão quando os arquivos reais estiverem publicados em `audios/<disciplina>/<episodio>.m4a`. Não é necessário ter áudio pré-instalado no celular: cada arquivo é transferido sob demanda quando hospedado.

## GitHub Pages
Workflow de publicação em `.github/workflows/pages.yml`. Em **Settings → Pages**, escolha **Source: GitHub Actions**. Após a implantação, o endereço previsto é https://uentzoul.github.io/estudos-uentzoul/.

## Acesso às contas

O acesso ao site é feito por e-mail e senha usando o cadastro próprio do Estudos Uentzoul. As contas atuais continuam válidas.

## IA Tzoul e simulados personalizados

- Histórico de conversas separado por estudante, com opção de abrir, renomear e excluir chats anteriores.
- A IA Tzoul consulta a base de materiais do semestre, com opção de respostas aprofundadas.
- A aba Simulados gera uma prova inédita quando solicitada: 13 objetivas e 2 dissertativas.
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

## Política de preservação de dados (obrigatória nas atualizações)

**Não apagar ou reinicializar mensagens, conversas, simulados, respostas, provas entregues, matérias pessoais, agenda, histórico ou progresso ao atualizar a aparência ou funcionalidades do site.** Fazer alterações incrementais no código e migrações não destrutivas. Não usar TRUNCATE, DROP TABLE, migrações que esvaziem registros, nem sobrescrever históricos com arrays vazios em atualização automática. Exclusão só pode ocorrer por ação explícita e confirmada da própria pessoa sobre o seu conteúdo. Testar antes de publicar.

## Atualização sem recarregar a página

As mensagens privadas, dos grupos e do chat global utilizam Supabase Realtime e verificação de segurança periódica na aba aberta, inclusive ao retornar ao site. Compartilhamentos e novos simulados gerais também são atualizados por eventos e checagem periódica. A área Pessoal atualiza seus conteúdos sem recarregamento da página e preserva anotações em edição. O andamento de simulados gerais e pessoais fica salvo localmente durante a tentativa, além de as entregas concluídas permanecerem no Supabase.

Os enunciados dos simulados usam separação de parágrafos, assertivas I/II/III em blocos próprios e destaque do comando final. Emojis decorativos são suprimidos apenas na exibição, sem alterar as questões já salvas; a IA foi orientada a não gerá-los em provas novas.


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
