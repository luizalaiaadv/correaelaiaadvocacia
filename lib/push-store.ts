/**
 * Inscricoes de push (aparelhos que aceitaram receber aviso de saldo), guardadas
 * no Supabase — tabela `push_subscriptions`.
 *
 * Mesma regra do `contacted-store`: acesso so no servidor com a chave secreta
 * (RLS ligado e sem policy). O `endpoint` e a identidade do aparelho e e a chave
 * primaria, entao reinscrever o mesmo celular atualiza em vez de duplicar.
 */

export type PushSubscriptionRecord = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

function config() {
  const raw = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!raw || !key) return null;
  const url = raw.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  return { base: `${url}/rest/v1/push_subscriptions`, key };
}

function headers(key: string, extra: Record<string, string> = {}) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

/** Salva (ou atualiza) a inscricao de um aparelho. */
export async function saveSubscription(sub: PushSubscriptionRecord): Promise<void> {
  const cfg = config();
  if (!cfg) throw new Error('Supabase nao configurado para push.');

  const response = await fetch(cfg.base, {
    method: 'POST',
    headers: headers(cfg.key, { Prefer: 'resolution=merge-duplicates,return=minimal' }),
    body: JSON.stringify([sub]),
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Supabase ${response.status}: ${(await response.text()).slice(0, 200)}`);
  }
}

export async function listSubscriptions(): Promise<PushSubscriptionRecord[]> {
  const cfg = config();
  if (!cfg) return [];

  const response = await fetch(`${cfg.base}?select=endpoint,p256dh,auth`, {
    headers: headers(cfg.key),
    cache: 'no-store',
  });
  if (!response.ok) return [];
  return (await response.json()) as PushSubscriptionRecord[];
}

/** Remove inscricoes mortas (o navegador devolve 404/410 quando o app foi desinstalado). */
export async function deleteSubscription(endpoint: string): Promise<void> {
  const cfg = config();
  if (!cfg) return;
  await fetch(`${cfg.base}?endpoint=eq.${encodeURIComponent(endpoint)}`, {
    method: 'DELETE',
    headers: headers(cfg.key),
    cache: 'no-store',
  }).catch(() => {});
}
