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

## Login institucional Microsoft PUCRS

O código do site já prepara duas opções via Supabase Auth:
- Entrar ou cadastrar usando o provedor Azure/Microsoft, solicitando o escopo de e-mail.
- Vincular uma identidade Microsoft ao usuário autenticado, preservando o mesmo ID do Supabase e os dados anteriores (pontuação, bio, mensagens, progresso).

**Status: preparação concluída, ativação institucional pendente.** O uso de Office 365 no Moodle não autoriza automaticamente o aplicativo do site a utilizar o login da universidade. A PUCRS pode precisar aprovar o aplicativo no Microsoft Entra.

### Etapas de ativação pelo administrador

1. Solicitar autorização ao TI/Entra da PUCRS para cadastrar o aplicativo no tenant da universidade. Confirmar com o administrador o Tenant ID real da PUCRS (não supor o ID).
2. Registrar o aplicativo no Microsoft Entra, para contas institucionais aprovadas, com esta Web Redirect URI:
   https://swseibmqoetnuctxyusj.supabase.co/auth/v1/callback
   Configurar os claims de e-mail e o claim opcional xms_edov para melhor validação de endereços de e-mail.
3. No Supabase, abrir Authentication > Sign In / Providers > Azure. Configurar Application Client ID, Client Secret e Tenant URL com a forma https://login.microsoftonline.com/ID_DO_TENANT_PUCRS.
4. No Supabase, abrir Authentication > URL Configuration e permitir a URL de retorno:
   https://uentzoul.github.io/estudos-uentzoul/
5. Nas configurações de Auth do Supabase, habilitar manual identity linking, necessário ao fluxo de vinculação.
6. Testar o login novo, o vínculo ao usuário existente, a preservação dos dados, o retorno ao site e o bloqueio de contas externas à organização permitida.
7. Somente após a aprovação e os testes, no JSON do elemento uentzoul-auth-config de index.html, adicionar o campo público "microsoftPucrsTenantApproved": true (sem alterar as chaves existentes). A interface também verifica o endpoint público /auth/v1/settings do Supabase, que deve responder external.azure como true.

IMPORTANTE: o campo microsoftPucrsTenantApproved controla somente a interface; **não é um controle de segurança**. A restrição institucional deve ser aplicada de verdade no Microsoft Entra e nas configurações do Supabase.

**Não publicar Client Secret nem credenciais de usuário no GitHub.** O Client Secret só deve ser configurado no painel seguro do Supabase.

### Como um estudante usa

- Cadastro existente: fazer login com e-mail e senha no site, depois abrir Meu perfil / Configurações e escolher Vincular Microsoft PUCRS. A vinculação mantém o mesmo ID da conta original.
- Cadastro novo: depois da ativação, selecionar Entrar com Microsoft PUCRS.
- Se a identidade Microsoft já estiver vinculada a outra conta, não tentar mesclar registros diretamente. Recuperar o cadastro correto.

Documentação:
- https://supabase.com/docs/guides/auth/social-sign-in/auth-azure
- https://supabase.com/docs/guides/auth/auth-identity-linking
- https://supabase.com/docs/guides/auth/redirect-urls

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
