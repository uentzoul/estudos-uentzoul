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
