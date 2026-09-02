# Aviso de saldo no celular (push)

Notificação **"Saldo do Meta"** / **"Saldo do Google"** quando a conta cai abaixo de
R$ 100 (o limite fica em `app/_ads/config.ts` → `LOW_BALANCE_BRL`).

## 1. Criar a tabela no Supabase

No painel do Supabase → **SQL Editor** → cole e rode:

```sql
create table if not exists public.push_subscriptions (
  endpoint   text primary key,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);

-- Mesma proteção da tabela de "contatado": ninguém acessa com a chave pública.
-- O acesso é só pelo servidor, com a chave secreta.
alter table public.push_subscriptions enable row level security;
```

## 2. Variáveis de ambiente na Vercel

Já estão no `.env.local`. Copie **os mesmos valores** para a Vercel
(Settings → Environment Variables → Production e Preview):

| Variável | Para que serve |
|---|---|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | identifica o site para o navegador (pode ser pública) |
| `VAPID_PRIVATE_KEY` | assina os envios — **secreta** |
| `VAPID_SUBJECT` | contato do responsável (exigido pelo padrão) |
| `CRON_SECRET` | protege a rota que o cron chama — **secreta** |

## 3. Cron

Já configurado em `vercel.json`: roda **todo dia às 09:00 (horário de Brasília)**.
A Vercel envia o `CRON_SECRET` automaticamente. Para mudar o horário, ajuste o
`schedule` (está em UTC: `0 12 * * *` = 09:00 em São Paulo).

## 4. Ativar no aparelho

No painel, abra o aviso de saldo (canto inferior direito) e toque em
**"Avisar no celular"**. A permissão só pode ser pedida a partir de um toque —
por isso é um botão.

### Android
Funciona no Chrome, instalado ou não.

### iPhone / iPad
**Só funciona com o painel instalado na tela de início** (Compartilhar →
"Adicionar à Tela de Início"), no **iOS 16.4 ou superior**. No Safari em aba o
sistema nem oferece a permissão — é limitação da Apple, não do projeto.

## Como testar sem esperar o cron

```bash
curl -H "Authorization: Bearer <CRON_SECRET>" https://www.correaelaiaadvocacia.com/api/push/check-balance
```

Resposta `{"ok":true,"avisos":0,...}` = nenhuma conta abaixo do limite (nada enviado).
Para forçar um teste, baixe temporariamente o `LOW_BALANCE_BRL`.
