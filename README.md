# Estudos Uentzoul

Central de estudos de Psicologia 2026/2.

## Estado confirmado em 10/11/2026

- `index.html` publicado na branch `main`: interface e conteúdo de estudos, navegação responsiva e lógica de download individual dos podcasts.
- `README.md` publicado.
- **Áudios .m4a ainda não enviados**: os botões de download só funcionarão após publicar os arquivos reais nos caminhos relativos previstos no catálogo do `index.html`. O botão não gera o episódio nem busca áudio existente no computador de quem acessa.
- A publicação do código **não equivale à ativação do GitHub Pages**, nem comprova os testes em Safari/Chrome mobile.

## Como concluir a integração

1. Enviar os arquivos originais de áudio para o repositório mantendo os caminhos `audios/<disciplina>/<nome-do-episodio>.m4a` que constam no campo `src` dos episódios em `index.html`. Manter maiúsculas, minúsculas e nomes exatamente iguais.
2. Habilitar **Settings → Pages → Deploy from a branch → main → / (root)** para disponibilizar o site por HTTPS.
3. Abrir a URL publicada no Safari do iPhone e Chrome do Android, verificar navegação, abrir um episódio, acionar **Baixar**, reproduzir o arquivo baixado e reabrir a página para confirmar persistência.
4. Confirmar a existência de cada arquivo pela URL pública do próprio episódio. Um erro HTTP 404 indica caminho/arquivo ausente; erro HTML indica que não foi entregue um áudio.

O site faz download sob demanda por episódio, usando o armazenamento local do navegador quando disponível. Não é necessário ter o áudio instalado no aparelho antes de acessar, **desde que os arquivos estejam hospedados**.
