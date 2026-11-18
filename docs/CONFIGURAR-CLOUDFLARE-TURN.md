# Ativar Cloudflare TURN no Estudos Uentzoul

**Estado:** o código do site e a função Supabase call-ice estão preparados.
**Pendente:** criar a chave Cloudflare TURN e inserir dois segredos no Supabase.
**Não coloque o token secreto no GitHub, no HTML, em mensagens ou em prints.**

## 1. Cloudflare: criar chave TURN

1. Abra https://dash.cloudflare.com/?to=/:account/calls e faça login (ou crie sua conta).
2. Escolha a conta da Cloudflare onde o serviço Realtime/TURN ficará ativo. Caso a Cloudflare solicite configurar faturamento, revise as condições antes de confirmar.
3. Abra Realtime / Calls / TURN (ou a seção equivalente) e crie uma TURN key. Nome sugerido: Estudos Uentzoul.
4. Guarde os dois dados exibidos:
   - **TURN Key ID / UID**: identificador da chave.
   - **TURN key API token / Secret**: token secreto dessa chave (não é o API token global da Cloudflare).

Referência oficial: https://developers.cloudflare.com/realtime/turn/generate-credentials/

## 2. Supabase: cadastrar os segredos

1. Abra https://supabase.com/dashboard/project/swseibmqoetnuctxyusj/functions/secrets
2. Adicione dois secrets (Key = nome exato, Value = conteúdo correspondente da Cloudflare):

| Key | Value |
| --- | --- |
| CF_TURN_KEY_ID | ID / UID da TURN key da Cloudflare |
| CF_TURN_KEY_TOKEN | Secret / API token da mesma TURN key |

3. Clique em Save.
4. Não precisa publicar novamente o site: os secrets ficam disponíveis imediatamente à função call-ice.

**Atenção:** a função exige sessão autenticada e participação autorizada na chamada. A chave de longa duração não é publicada no navegador.

## 3. Testar câmera e tela

1. Todos atualizam a página com Ctrl+Shift+R.
2. Entrem numa chamada de grupo de **duas redes diferentes**.
3. Um liga a câmera e o outro verifica se a imagem chega.
4. Um compartilha a tela e o outro verifica a recepção.
5. Em **Áudio e vídeo**, observem o status de relay. Caso falhe, usem **Copiar diagnóstico da conexão**. Ele não inclui endereços IP.

WebRTC normalmente prefere conexões diretas e usa TURN apenas quando precisa. Assim, TURN estar configurado não significa que todas as calls consumirão relay.

### Se aparecer "sem mídia"

- turnServiceStatus = unconfigured: conferir os dois secrets com os nomes exatos.
- turnServiceStatus = unavailable: verificar se ID e token são da mesma TURN key e consultar logs da Edge Function call-ice.
- relayConfigured = true e ice = failed: credenciais existem, mas houve bloqueio ou falha no caminho de rede.
- ice = connected com vídeo sem imagem: investigar negociação/recepção das faixas de mídia.

Referência Supabase: https://supabase.com/docs/guides/functions/secrets

## 4. Custos e privacidade

Na documentação oficial atual, Cloudflare Realtime TURN informa **US$ 0,05 por GB de saída** e franquia gratuita de **1.000 GB**; confira as condições no painel da conta. O tráfego P2P direto não gera tráfego TURN na Cloudflare. Acompanhe uso e configure alertas de cobrança.

O TURN retransmite mídia protegida pelo WebRTC (DTLS/SRTP); o relay não precisa decodificar o conteúdo.

Referências:
- https://developers.cloudflare.com/realtime/turn/
- https://developers.cloudflare.com/realtime/turn/faq/
