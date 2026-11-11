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
