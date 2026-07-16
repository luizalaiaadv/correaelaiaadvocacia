/**
 * Persistencia da marca de "lead contatado" no Supabase (tabela contacted_leads).
 *
 * Acesso apenas server-side com a chave secreta: a tabela tem RLS ligado e
 * nenhuma policy, entao a chave publica nao le nem escreve. Quem protege a
 * rota e a senha do dashboard (proxy.ts). Sem SDK: a API REST do Supabase
 * (PostgREST) resolve com fetch puro.
 */

export class SupabaseConfigError extends Error {
  constructor(public readonly missing: string[]) {
    super(`Variaveis ausentes no ambiente: ${missing.join(', ')}.`);
    this.name = 'SupabaseConfigError';
  }
}

function config() {
  // Aceita tanto os nomes proprios quanto os que a integracao Vercel-Supabase provisiona.
  const raw = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  const missing = [!raw && 'SUPABASE_URL', !key && 'SUPABASE_SECRET_KEY'].filter(
    (name): name is string => Boolean(name),
  );
  if (missing.length > 0) throw new SupabaseConfigError(missing);

  // Tolera a URL colada com o caminho REST junto ("https://x.supabase.co/rest/v1/"):
  // e um engano facil de cometer no painel e dobraria o caminho da requisicao.
  const url = (raw as string).replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

  return { base: `${url}/rest/v1/contacted_leads`, key: key as string };
}

async function request(path: string, init: RequestInit & { key: string }): Promise<Response> {
  const { key, ...rest } = init;
  const response = await fetch(path, {
    ...rest,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...rest.headers,
    },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Supabase respondeu ${response.status}: ${(await response.text()).slice(0, 200)}`);
  }
  return response;
}

export async function listContacted(): Promise<string[]> {
  const { base, key } = config();
  const response = await request(`${base}?select=lead_id`, { key });
  const rows = (await response.json()) as { lead_id: string }[];
  return rows.map((row) => row.lead_id);
}

export async function markContacted(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { base, key } = config();
  await request(base, {
    key,
    method: 'POST',
    // merge-duplicates: marcar de novo um lead ja marcado nao e erro.
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(ids.map((lead_id) => ({ lead_id }))),
  });
}

export async function unmarkContacted(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { base, key } = config();
  const list = ids.map((id) => `"${id.replace(/"/g, '')}"`).join(',');
  await request(`${base}?lead_id=in.(${encodeURIComponent(list)})`, { key, method: 'DELETE' });
}
