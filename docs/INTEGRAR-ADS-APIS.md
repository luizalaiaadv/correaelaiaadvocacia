# Ligar dados reais: Meta Ads e Google Ads

Hoje `/dash-meta` e `/dash-google` mostram dados de exemplo. Este guia lista o
que e preciso para trocar por dados reais das APIs.

## Como encaixa (arquitetura)

Mesmo padrao do Typebot e do Supabase: as credenciais ficam em variaveis de
ambiente (server-side, nunca no browser), uma rota `/api/...` protegida pela
senha busca os numeros, e o dashboard troca `sampleAdsData` pela resposta real.
A interface **nao muda** — eu mapeio a resposta de cada API para o mesmo formato
`AdsData` que os componentes ja consomem.

O que muda entre as duas plataformas e so a obtencao das credenciais. A do
Google e mais burocratica e tem um item com prazo de dias (developer token).

---

## META ADS

### Credenciais necessarias

| Variavel | O que e | Onde pegar |
| --- | --- | --- |
| `META_ACCESS_TOKEN` | Token que autoriza a leitura | System User no Business Manager |
| `META_AD_ACCOUNT_ID` | Conta de anuncios do cliente | Business Settings > Contas > Contas de anuncios (numero `act_...`) |

### Passo a passo

1. **Business Manager** (business.facebook.com) com acesso a conta de anuncios
   do cliente. Se voce ja gerencia os anuncios da Luiza, ja tem isso.
2. **Criar um app** em developers.facebook.com > My Apps > Create App > tipo
   "Business". Adicione o produto **Marketing API**.
3. **Criar um System User** em Business Settings > Users > System Users (papel
   Admin). System User e o certo para servidor: o token pode ser configurado
   para **nao expirar** — diferente do token de usuario comum, que morre em ~1h.
4. **Gerar o token** do System User com a permissao **`ads_read`**. Associe ao
   token o app (passo 2) e a conta de anuncios do cliente.
5. **Pegar o Ad Account ID** em Business Settings > Contas de anuncios. Nas
   chamadas ele vai com o prefixo `act_` (ex.: `act_1234567890`).

> Para ler apenas contas que voce mesmo gerencia via Business Manager, o token
> de System User costuma bastar sem App Review completo. Se a Meta exigir
> revisao para `ads_read`, o processo e feito no painel do app.

### Dados que a API entrega (endpoint Insights)

`GET /v{versao}/act_{id}/insights` — gasto, impressoes, cliques, CTR, CPC, CPM,
resultados (`actions`, ex.: conversas/leads) e custo por resultado, por dia e por
campanha. E exatamente o que os cards ja esperam.

---

## GOOGLE ADS

> ⚠️ **Comece por aqui com antecedencia.** O "developer token" precisa de
> aprovacao do Google e pode levar de horas a alguns dias. O resto so anda
> depois que ele sair.

### Credenciais necessarias

| Variavel | O que e |
| --- | --- |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Token de desenvolvedor (da conta MCC) |
| `GOOGLE_ADS_CLIENT_ID` | OAuth client do Google Cloud |
| `GOOGLE_ADS_CLIENT_SECRET` | Segredo do OAuth client |
| `GOOGLE_ADS_REFRESH_TOKEN` | Token permanente gerado uma vez pelo fluxo OAuth |
| `GOOGLE_ADS_CUSTOMER_ID` | ID da conta do cliente (10 digitos, sem tracos) |
| `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | ID da conta gestora (MCC), se acessar via ela |

### Passo a passo

1. **Developer Token:** entre na conta **gestora (MCC)** do Google Ads > Ferramentas
   > Central de API. Pegue o token. Ele nasce com acesso so a "contas de teste";
   solicite **Acesso Basico** (formulario) para consultar contas reais. **Esta e
   a etapa com prazo — faca primeiro.**
2. **Projeto no Google Cloud:** ative a "Google Ads API" e crie uma credencial
   **OAuth 2.0 Client ID**. Guarde Client ID e Client Secret. Configure a tela de
   consentimento.
3. **Refresh Token:** rode o fluxo OAuth uma vez (com a conta Google que tem
   acesso aos anuncios), pedindo acesso offline, escopo
   `https://www.googleapis.com/auth/adwords`. Isso devolve um refresh token
   permanente — o servidor troca ele por tokens de acesso curtos sozinho, sem
   manutencao. Eu te passo um script pequeno para gerar esse token.
4. **Customer ID:** o numero de 10 digitos da conta do cliente (canto superior
   do Google Ads, sem os tracos). Se o acesso e via MCC, tambem o ID da MCC como
   `login-customer-id`.

### Dados que a API entrega (GAQL)

Consulta em GAQL no endpoint `searchStream`: custo, impressoes, cliques, CTR,
CPC medio, conversoes e CPA, por dia e por campanha. O custo vem em "micros"
(divide por 1.000.000) — eu trato isso no codigo.

---

## O que eu faco no codigo (depois das credenciais)

1. `lib/meta-ads.ts` e `lib/google-ads.ts` (server-only) — buscam e convertem
   para o formato `AdsData`.
2. `/api/ads/meta` e `/api/ads/google` — rotas protegidas pela senha (entram no
   matcher do `proxy.ts`).
3. Troco `sampleAdsData(...)` por um fetch a essas rotas, com estados de
   carregamento e erro (igual ao dashboard de leads).
4. **Cache server-side** (alguns minutos): o painel atualiza sozinho, e nao
   podemos bater na API a cada 10s — as duas tem limites de uso. Um cache curto
   resolve e ainda deixa o dado "quase em tempo real".

## Variaveis por ambiente

Todas vao no `.env.local` (local) e na Vercel (Production + Preview), por
cliente. Como no resto do projeto: valores nunca passam pelo chat — colados
direto no arquivo e no painel da Vercel.

## Resumo: o que preciso de voce

- **Meta:** `META_ACCESS_TOKEN` (System User, `ads_read`, sem expiracao) e
  `META_AD_ACCOUNT_ID`.
- **Google:** os 6 valores da tabela — comece pelo developer token (prazo).

Com as credenciais em maos, a parte de codigo de cada plataforma leva pouco: o
formato de dados e a interface ja estao prontos.
