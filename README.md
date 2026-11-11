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

Cada estudante autenticado pode criar uma matéria complementar com título e conteúdo próprio (até 16.000 caracteres), editar as notas, excluir a matéria e gerar um simulado pessoal de seis questões de múltipla escolha. As questões e explicações são criadas pela IA Tzoul e ficam salvas exclusivamente na conta.

O servidor usa o conteúdo da matéria do próprio estudante e verifica seu ID de usuário com RLS. A geração depende de a função **ia-tzoul** estar configurada com uma **OPENAI_API_KEY** válida, com saldo disponível e dentro da cota diária. Falhas da API não criam questões fictícias. Os simulados pessoais ficam separados do ranking competitivo.
