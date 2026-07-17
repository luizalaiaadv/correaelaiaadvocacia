# Replicar o dashboard de leads para outro cliente

O dashboard le todos os dados de variaveis de ambiente — nada de token ou ID
fica escrito no codigo. Replicar e, na maior parte, configuracao. O unico
codigo que muda e a marca (nome e imagens), e o script `novo-cliente-dashboard.mjs`
cuida da parte de texto.

Tempo estimado por cliente: ~20 minutos.

---

## Visao geral: 3 baldes

1. **Variaveis de ambiente** — Typebot, senha, Supabase (por cliente).
2. **Supabase** — uma tabela por cliente (um SQL).
3. **Marca** — nome e imagens (o script troca os textos; as imagens sao manuais).

---

## Passo a passo

### 1. Copiar os arquivos do dashboard

Cada cliente ja tem seu proprio repo/site. Copie para dentro dele:

```
app/dashboard/            (a interface inteira)
app/api/leads/            (leitura dos leads no Typebot)
app/api/contacted/        (marca de contatado)
app/api/dashboard-auth/   (login por senha)
lib/typebot.ts
lib/contacted-store.ts
lib/dashboard-auth.ts
proxy.ts                  (protege /dashboard e as rotas /api)
app/globals.css           (as classes .glass-*, .scroll-fade-x, .no-scrollbar)
```

Imagens em `public/`: `logofooter.webp`, `texture-bg.webp`, `icon-192.png`,
`icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`,
`manifest.webmanifest`, `offline.html`, `sw.js`.

Dependencias no `package.json` (se ja nao tiver): `lucide-react`.

> Se o site do cliente ja tem `globals.css`, nao sobrescreva — copie apenas os
> blocos das classes `.glass-*`, `.scroll-fade-x`, `.no-scrollbar` e os
> `@keyframes` de `fade-in`/`modal-in`, alem das cores da marca em `@theme`.

### 2. Descobrir os IDs do Typebot

Atencao a uma pegadinha: o "ID" que aparece no compartilhamento costuma ser o
**publicId**, nao o ID interno que a API usa.

Com o token de API do cliente em maos (Typebot > Settings > My account > API
tokens), rode:

```bash
# 1) lista os workspaces (pegue o "id")
curl -H "Authorization: Bearer SEU_TOKEN" \
  "https://app.typebot.io/api/v1/workspaces"

# 2) lista os typebots do workspace (pegue o "id" do bot certo)
curl -H "Authorization: Bearer SEU_TOKEN" \
  "https://app.typebot.io/api/v1/typebots?workspaceId=WORKSPACE_ID"
```

O `id` do bot (algo como `thorn5s34pqkiz57jkb9c7vg`) e o `TYPEBOT_ID`.

> A base da API e `app.typebot.io`, nao `typebot.io`.

### 3. Criar o banco no Supabase

Crie um projeto para o cliente (ou use um existente) e rode no SQL Editor:

```sql
create table if not exists public.contacted_leads (
  lead_id text primary key,
  contacted_at timestamptz not null default now()
);
alter table public.contacted_leads enable row level security;
```

**RLS ligado e nenhuma policy** — e o que impede a chave publica de ler/escrever.
Nao crie policies. Todo acesso vem do servidor, com a chave secreta.

Pegue em Project Settings > API Keys:
- **Project URL** (`https://xxxx.supabase.co`) — use SEM o `/rest/v1` no fim.
- **Secret key** (`sb_secret_...`).

### 4. Preencher as variaveis

No `.env.local` do cliente:

```
TYPEBOT_API_TOKEN=...          # token de API do cliente
TYPEBOT_ID=...                 # id interno do bot (passo 2)
DASHBOARD_PASSWORD=...         # senha forte e unica por cliente
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
```

Gere uma senha forte:
```bash
node -e "console.log(require('crypto').randomBytes(21).toString('base64url'))"
```

### 5. Trocar a marca (script)

Da raiz DESTE repo (o modelo), rode apontando para a pasta do cliente:

```bash
node scripts/novo-cliente-dashboard.mjs \
  --dir "../adv-fernanda-romano" \
  --nome "Fernanda Romano Advocacia" \
  --curto "Fernanda Romano" \
  --sigla "FR" \
  --slug "fernandaromano"
```

O script troca os textos da marca nos arquivos do dashboard. **As imagens sao
manuais** — substitua na pasta `public/` do cliente:
- `logofooter.webp` — logo em versao clara (aparece sobre o fundo escuro)
- `texture-bg.webp` — textura de fundo
- `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`
  — icones do PWA (gere a partir da logo do cliente)

### 6. Cadastrar as variaveis na Vercel

No projeto Vercel do cliente > Settings > Environment Variables, adicione as
CINCO variaveis do passo 4, marcando **Production e Preview**. Depois, redeploy.

> Sem isso, o deploy sobe mas o dashboard cai com "Configuracao ausente no
> servidor" — o `.env.local` nao vai para o Git.

### 7. Verificar

Depois do deploy:
- `SEU-DOMINIO/dashboard/login` deve responder (senha configurada).
- Entre com a senha; os leads devem carregar.
- Clique num WhatsApp: o lead deve ficar cinza (marca de contatado no banco).

---

## O que muda por cliente (resumo)

| Item | Onde | Como |
| --- | --- | --- |
| Token/ID do Typebot | env | passo 2 |
| Senha do dashboard | env | passo 4 |
| URL/chave Supabase | env | passo 3-4 |
| Tabela contacted_leads | Supabase | passo 3 |
| Nome do escritorio | codigo | script (passo 5) |
| Logo, textura, icones | public/ | manual (passo 5) |

Nada de logica de dados muda entre clientes — so configuracao e aparencia.

---

## Manutencao

Este e o modelo. Uma correcao feita aqui (num bug do dashboard) precisa ser
copiada para o repo de cada cliente. Mantenha a lista de clientes que usam o
dashboard para saber onde replicar.
