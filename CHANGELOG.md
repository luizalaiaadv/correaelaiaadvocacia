# Changelog

Registro das mudanças do painel (**correaelaiaadvocacia** — `/dash-ads`).
Datas em fuso de São Paulo.

## 2026-08-28

### Instalacao no celular (PWA) — Android e iPhone/iPad
O painel voltou a ser instalavel, agora a partir da tela principal (`/dash-ads`).

- **O que estava quebrado:** o `manifest.webmanifest` apontava para `/dashboard` (rota
  antiga) e so era referenciado no layout de `/dashboard`. Como `/dash-ads` nao tinha
  layout proprio, a tela principal **nao oferecia instalacao** nem registrava o
  service worker.
- **Correcoes:**
  - `manifest.webmanifest`: `start_url` agora e **`/dash-ads`**; nome atualizado para
    "Correa & Laia | Painel" (`C&L Painel`); incluido o icone de 180x180 do iOS.
  - Novo `app/dash-ads/layout.tsx` com `manifest`, `appleWebApp`, `apple-touch-icon`,
    `theme-color` e `viewport-fit: cover` (area do notch), alem do registro do
    service worker.
  - Adicionada a meta legada **`apple-mobile-web-app-capable`** nos dois layouts: o
    Next 16 emite so a tag moderna `mobile-web-app-capable`, que o Safari so entende
    a partir do **iOS 16.4** — sem a legada, iPhones mais antigos abririam o app numa
    aba comum em vez de tela cheia.
- **Verificado no HTML gerado** (`/dash-ads` e `/dashboard`): manifest, apple-touch-icon,
  `apple-mobile-web-app-capable`, `mobile-web-app-capable` e `theme-color` presentes.
  Icones conferidos: 192x192, 512x512, maskable 512x512 e apple 180x180. O `proxy`
  nao intercepta manifest/sw/icones (precisam ser publicos para a instalacao).

### Correção: erro de hidratação (hydration mismatch)
- **Sintoma:** no console, *"A tree hydrated but some attributes of the server rendered
  HTML didn't match the client properties"*.
- **Causa:** `/dash-ads` e `/dashboard` são **pré-renderizadas** (HTML gerado no build),
  mas os componentes liam `Date.now()` no corpo do render (`useState(() => Date.now())`).
  Resultado: o HTML saía com as **datas do dia do build** e o navegador calculava as
  **datas de hoje** — os dois não batiam.
- **Correção:** novo hook `app/dashboard/use-client-now.ts` (`useClientNow`), que devolve
  `null` no primeiro render e `Date.now()` só depois de montar no navegador. Todos os
  rótulos de data passaram a ser renderizados apenas com o relógio do cliente.
- **Verificado:** o HTML pré-renderizado das duas páginas agora tem **zero** datas
  (antes trazia, por exemplo, `23/08 - 29/08` congelado do build).

### Métricas de campanha de seguidores (vídeo) — aba Meta
Nova seção **"Seguidores e vídeo"**, sincronizada com a API do Meta e do Instagram.
Cada card traz uma **explicação em linguagem simples** para a cliente entender sozinha:

| Métrica | O que é |
|---|---|
| **Custo por seguidor** | Quanto custou cada seguidor novo (a métrica mais importante) |
| **Visitas ao perfil** | Quantas vezes o perfil foi aberto (Instagram insights) |
| **Perfil → seguidor** | De quem visitou o perfil, quantos seguiram |
| **Taxa de retenção (3s)** | Quantos pararam para assistir 3s — força do início do vídeo |
| **ThruPlay** | Quantos assistiram 15s ou até o fim |
| **Custo por ThruPlay** | Quanto custou cada pessoa que assistiu de verdade |
| **Tempo médio assistido** | Segundos médios assistidos + % que viu até o fim |
| **CPM** | Custo para aparecer 1.000 vezes |
| **Frequência** | Quantas vezes a mesma pessoa viu (acima de 3 cansa) |
| **Salvamentos / compart.** | Sinais mais fortes de conteúdo bom |

- Campos usados: `video_play_actions`, `video_thruplay_watched_actions`,
  `video_avg_time_watched_actions`, `video_p25/50/75/100_watched_actions`, `reach`,
  `frequency`, `cpm`, e `actions` (`video_view` = views de 3s, `onsite_conversion.post_save`,
  `post` = compartilhamentos). Visitas ao perfil vêm de IG insights `profile_views`
  (exige `metric_type=total_value`).
- A seção só aparece no **Meta** (o Google não tem métricas de vídeo/perfil).
- Os KPIs antigos também ganharam explicação.

### Filtro de data personalizado (date picker)
- Novo botão **"Personalizado"** ao lado dos períodos, com **De / Até** — igual aos
  gerenciadores de anúncio. Usa `input[type=date]` nativo (abre o calendário do
  sistema, funciona no celular, **sem biblioteca nova**).
- O intervalo escolhido vale para **Meta e Google** e para todos os números da tela.
- Backend: `/api/ads/[platform]?since=YYYY-MM-DD&until=YYYY-MM-DD`. As datas são
  validadas (`isDateKey`); inválidas caem no preset e datas invertidas são corrigidas
  automaticamente (`resolveAdsRange` em `app/dashboard/lead-utils.ts`).

## 2026-08-27

### Alerta de saldo restante (Meta e Google)
- Novo banner no topo das abas **Meta** e **Google** com o **saldo restante da conta**.
- **Meta**: usa o saldo pré-pago do funding source (`funding_source_details.display_string`,
  "Saldo disponível"); se não houver pré-pago, cai para `spend_cap − amount_spent`.
- **Google**: `account_budget` → limite aprovado − valor servido ("Orçamento da conta").
  Conta auto-pay (cartão) não tem `account_budget` → o alerta simplesmente não aparece.
- Fica **vermelho** quando o saldo está baixo (< 10% do limite) e âmbar caso contrário.
- Dado vem em `AdsResponse.balance` (`lib/meta-ads.ts` / `lib/google-ads.ts`); é opcional,
  se a leitura falhar o resto do painel continua funcionando.

### Aba Typebot (lista de leads) — OCULTADA 🔕
- A aba **Typebot** do `/dash-ads` foi **ocultada**. O painel voltou a ser só **Meta** e **Google**.
- **Nada foi apagado.** O componente `app/dashboard/leads-panel.tsx` (`<LeadsPanel/>`) e a
  página independente **`/dashboard`** continuam funcionando normalmente.
- A aba está atrás de um **flag** em `app/_ads/ads-dashboard.tsx`:
  ```ts
  const SHOW_TYPEBOT_TAB = false; // troque para true para reativar a aba
  ```

#### ▶ Como reativar (quando voltar a rodar campanha com Typebot)
- **Jeito fácil:** é só pedir — *"coloque o Typebot novamente"* — e a aba volta.
- **Na mão:** em `app/_ads/ads-dashboard.tsx`, troque `SHOW_TYPEBOT_TAB` de `false` para `true`.
  Não precisa de mais nada: a aba reaparece mostrando os leads de `/api/leads`, com
  visão geral (cards que seguem o período), lista, "contatado" e notificações.

### Aba Meta — campanha trocada
- Passou a mostrar a campanha **CAT**: `[27/08/26] [Escritório] [Tráfego] CAT (Comunicação de
  Acidente de Trabalho)`, id `120251649227200213`.
- O escopo agora é por **ID** da campanha (imune a acento/parênteses/renome). Para trocar de
  campanha no futuro, basta editar o id em `app/_ads/config.ts` → `META_CAMPAIGNS.cat`.

### Outras correções recentes
- **Google Ads**: API atualizada de `v21` (desativada pela Google, respondia 404) para **v25**.
- **Aba Typebot (enquanto esteve visível)**: os cards da visão geral passaram a seguir o
  período selecionado ("Leads no período" + "vs. período anterior").
- **Supabase (marca de "contatado")**: erro de banco fora do ar agora loga **uma linha**
  no terminal em vez de stack trace; a lista de leads segue funcionando sem ele.
