# PsicoMoodle — registro de continuidade (13/11/2026)

Este registro distingue código publicado, recursos armazenados e tarefas pendentes. Não substituir por promessas de conclusão: só marcar concluído após verificar no GitHub/Supabase e, para reprodução, testar em navegador.

## Código publicado em 13/11/2026
- Player de podcast: streaming nativo, visualização de ondas ilustrativas (não é análise do áudio real), timeline, 0,5×–2×, salto de ±10 segundos, botão de download e fallback para arquivo em cache.
- O elemento `audio` agora é fixado fora da área que sofre re-renderização, preservando mídia/buffer ao navegar.
- Reprodutor oculto até selecionar um episódio. Estado do episódio 7 de Psicologia Social: pendente; episódio 8: presente.
- IA Tzoul: respostas com botões de baixar PDFs encontrados na biblioteca privada `uentzoul-library-files`. A consulta usa a tabela `uentzoul_library_uploads`; o download abre URL assinada obtida no clique, por usuário autenticado, e persiste somente `resource_key` no histórico.
- O arquivo `CarlRogers.pdf` está registrado em `grupos::CarlRogers`; busca "me manda os slides Carl Rogers" passou em teste de lógica, mas ainda precisa de teste manual com sessão de usuário.

## Recursos e conteúdo já integrados antes destes commits
- `estudo-ativo.js`: flashcards em grade; `Lembrei` concluído, `Pular` mantém pendente.
- `psicomoodle-new-content.js`: complementos de ACT e 16 documentos de Psicologia Social registrados no catálogo como pendentes de PDF original, com conteúdo de estudo e exercícios.
- `casos-act-social.js`: novos casos práticos de ACT e Psicologia Social.
- Módulos de chat, simulados e dados pessoais preservados; **não executar resets ou migrações destrutivas**.

## Pendências verificadas, não concluídas
1. **Publicar os 16 PDFs originais de Psicologia Social I**. Os títulos constam em `psicomoodle-new-content.js` e os arquivos originais foram localizados na Biblioteca do ChatGPT, mas não havia linhas com `file_subject='social'` na tabela `uentzoul_library_uploads` na verificação de 13/11. Não colocar link inventado ou marcar como publicado antes de subir cada binário no bucket via uploader autenticado. O PDF `Slides_Epistemicídio_Racismo e Sexismo_Psicologia Social I(1).pdf` tem aproximadamente 61,4 MB e excede o limite de 50 MB da biblioteca; reduzir o tamanho preservando legibilidade antes do upload.
2. **Publicar PDF original de ACT** `ACT na clínica.pdf.pdf` (aproximadamente 16,5 MB) que está na Biblioteca do ChatGPT; o complemento conceitual já existe, mas o PDF integral ainda não foi localizado como arquivo enviado à biblioteca Supabase.
3. **Conversão integral dos arquivos não-PDF**. Existem materiais enviados em DOCX/PPTX na biblioteca do Supabase; não declarar convertidos até gerar e publicar PDFs equivalentes, preservando o documento original.
4. **Podcast Social 07**: `social/07_identidade_e_representacoes_sociais_revisao.m4a` está referenciado no catálogo, mas não foi encontrado no bucket público `study-podcasts` na conferência. Não confundir com episódio 08, que já está armazenado.
5. **Testes de reprodução em navegador real** (desktop e celular): ouvir um episódio completo em rede estável e instável, alternar abas, usar pausa, retomada, velocidades e download. O código passou no teste de sintaxe, o Actions passou, mas o áudio real ainda não foi ouvido no navegador durante esta sessão.
6. **Conferir assinaturas de download** em contas reais: abrir resposta antiga da IA Tzoul e baixar `CarlRogers.pdf` novamente, sem salvar URL temporária no histórico.

## Critérios de preservação
- Não apagar mensagens, simulados, arquivos ou registros de usuários em updates de interface.
- Evitar afirmar que a publicação do site garante a integridade do áudio sem teste funcional.
- Manter somente temas exigidos para as provas na biblioteca visível, sem destruir arquivos originais.
- Não compartilhar a chave de serviço do Supabase nem publicar o bucket privado como público.

## Referências de trabalho
- Repositório: https://github.com/uentzoul/estudos-uentzoul
- Endereço previsto do site (conforme README): https://uentzoul.github.io/estudos-uentzoul/
- Deploy: GitHub Actions em `.github/workflows/pages.yml`
- Projeto de banco: `Estudos Uentzoul` (referência do Supabase no código)

## Atualização posterior — importação em lote e escopo de Psicologia Social (13/11/2026)
- A Biblioteca **não tem mais um painel separado para arquivos novos**. Arquivos disponíveis e cadastrados sem PDF ficam juntos nas seções normais de Slides, Textos-base, Atividades etc. Os pendentes continuam identificados, sem inventar links.
- **Painel privado Admin Config**: mostra agora o uploader da biblioteca (`admin-config.js` → `window.uentzoulAdminBridge.adminLibrary()`). Adicionado botão **Importar pacote ZIP organizado** e campo `libraryPackageInput` (`index.html`), com interpretação dos pacotes pelo `library-manager.js`; valida CRC/bytes/hash SHA-256, identifica títulos/disciplinas e prepara arquivos para publicação no Supabase pelo usuário autenticado.
- Foram preparados **três ZIPs para download na conversa do ChatGPT**, NÃO hospedados no repositório: `PsicoMoodle_01_Familia_e_ACT.zip` (5 PDFs), `PsicoMoodle_02_Social_Textos_e_Slides.zip` (8 PDFs), `PsicoMoodle_03_Social_Continuacao.zip` (8 PDFs). Importá-los pelo Admin Config e clicar em **Publicar materiais revisados**. O admin precisa fazer isso do navegador; a conexão MCP do Supabase não disponibiliza upload direto de binários locais desta conversa.
- Quatro materiais de Família foram cadastrados com os nomes exatos dos pacotes. Outros dois arquivos reenviados (`Aula Flias Uso substancias` e `Violência Intrafamiliar`) já constavam na biblioteca privada do Supabase e não foram duplicados. A atividade DOCX foi convertida em PDF de duas páginas, preservando o conteúdo.
- `ACT na clínica` está no primeiro pacote (16,5 MB), com classificação Texto-base em TCC. **PDF ainda não publicado no Supabase até ocorrer o envio pelo administrador.**
- Psicologia Social: conjunto de 16 PDFs enviados define o escopo. Os 18 tópicos explicativos correspondentes foram mantidos; os conteúdos antigos sobre algoritmos e outros assuntos não presentes no conjunto foram ocultados da revisão e da base da IA. São exibidos apenas os podcasts 1, 2, 4, 5 e 6, que correspondem ao escopo; o 3, 7 e 8 foram ocultados, mas **não apagados do armazenamento**. Foram gerados quatro simulados novos baseados no conjunto, sem excluir históricos de tentativas existentes.
- **Martín-Baró foi mantido** porque os arquivos enviados em 13/11 incluíam explicitamente `Psicologia Social Crítica - Baró(1).pdf`, `O latino indolente.pdf` e `A desideologização...` (além de texto-base sobre fatalismo). Não o excluir por suposição.
- Slides de epistemicídio (original ≈61 MB) excediam o limite de 50 MB por arquivo no uploader. Foi produzida versão otimizada de 13 páginas ≈9 MB, verificada visualmente e incluída no pacote 3; o arquivo original da Biblioteca ChatGPT não foi alterado.
- Próxima verificação: importar os três ZIPs no Admin Config, confirmar 21 novos registros na tabela `uentzoul_library_uploads`, abrir arquivos assinados com uma conta de usuário e verificar a atualização automática da Biblioteca. **O deploy do código não significa que os PDFs já foram enviados.**


## Padrão obrigatório de linguagem do PsicoMoodle (13/11/2026)
- Todas as instruções destinadas a estudantes e usuários devem usar **português-padrão**. No singular, empregar o imperativo formal da 3ª pessoa: **leia, ouça, revise, escolha, confira, clique, responda, escreva, marque, entre, preencha, pressione, use, faça, comece**. Em contextos de turma/grupo, usar o plural: **leiam, ouçam, revisem, escolham, confiram, cliquem, respondam, marquem**.
- **Não** usar imperativos coloquiais de 2ª pessoa como “lê”, “revê”, “ouve”, “marca”, “escolhe”, “confere”, “clica”, “entra”, “preenche”, “pressiona”. Evitar “teu/tua/teus/tuas/podes/precisas” nas mensagens de interface; utilizar “seu/sua/você/pode/precisa” ou linguagem neutra.
- Não modificar transcrições, falas citadas ou verbos na 3ª pessoa do indicativo em exemplos acadêmicos, pois não são instruções ao usuário.
- Revisão executada no texto das telas e de módulos auxiliares: `index.html`, `trilhas-estudos.js`, `estudo-ativo.js`, `estudos-dirigidos.js`, `admin-config.js`, `library-manager.js`, `enviar-podcasts.html`, `metapsicologia-p2-data.js`, `estudos-dirigidos-meta.js`, `metapsicologia-p2.html` e texto auxiliar do chat. Referências de CSS/JS atualizadas para não carregar versões antigas. Não executar limpeza de dados por causa desta revisão.

## Atualização — organização manual de “Materiais e textos” (13/11/2026)
- Todas as disciplinas de 2026/2 exibem as **três categorias fixas**, inclusive vazias: “Planos de ensino e cronogramas”, “Aulas e apresentações” e “Textos-base e bibliografia”. As categorias “Guias e materiais de revisão”, “Vídeos e referências online” e “Materiais complementares” aparecem quando aplicáveis e como áreas de destino no modo Editar.
- O botão **Editar** foi incorporado à própria seção “Materiais e textos” (não foi criada outra aba). Só aparece para uma conta de administrador validada no Supabase pela função `uentzoul_is_admin()` e pelo estado de autenticação ativo. Outras contas não o visualizam.
- No editor: arraste a linha ou use o seletor Categoria, altere a ordem com as setas e pressione **Salvar organização**. **Cancelar** não persiste as mudanças. Nada é transferido, removido ou renomeado no bucket: somente o agrupamento e a posição visual são alterados.
- Persistência global em `public.uentzoul_material_placements` (chave por semestre, disciplina e material; colunas categoria e posição). RLS ativa; `anon` e `authenticated` podem consultar; somente `authenticated` com `uentzoul_is_admin()` pode inserir/atualizar; sem permissão de DELETE. O teste de tentativa de INSERT com papel autenticado sem administrador foi bloqueado.
- Arquivos existentes continuam na categoria estimada pelas regras anteriores até que o administrador os mova expressamente. O editor também preserva a ordenação dentro da categoria quando salva.
- Arquivos adicionados posteriormente entram na classificação automática até serem reorganizados. A leitura das categorias salvas é atualizada ao voltar ao site e periodicamente, sem F5.
- A nova interface está em `materiais-editor.js` e `materiais-editor.css`; `index.html` chama os componentes nas páginas de cada disciplina. O recarregamento automático é bloqueado enquanto houver edição não salva.
- Verificação: sintaxe do JavaScript e das oito seções de script embutidas no HTML passou; teste simulado de deslocamento de um material de TCC entre categorias e persistência passou. O deploy mais recente pelo GitHub Actions terminou com sucesso. **Ainda falta conferir o arraste e a gravação em navegador real com a sessão do administrador**, além de testar pelo menos uma conta de estudante.
