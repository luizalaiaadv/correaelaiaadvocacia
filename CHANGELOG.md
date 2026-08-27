# Changelog

Registro das mudanças do painel (**correaelaiaadvocacia** — `/dash-ads`).
Datas em fuso de São Paulo.

## 2026-08-27

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
