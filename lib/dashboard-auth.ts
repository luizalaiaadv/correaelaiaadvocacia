export const SESSION_COOKIE = 'dash_session';

/** Timeout por inatividade da sessao do dashboard (minutos). Ajustavel por env. */
const IDLE_MINUTES = Number(process.env.SESSION_IDLE_MINUTES) || 30;
export const SESSION_TTL_MS = IDLE_MINUTES * 60 * 1000;

/** Comparacao em tempo constante para nao vazar segredo por timing. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

// HMAC-SHA256 com a senha do dashboard como chave. Web Crypto: roda no proxy
// (middleware) e nas route handlers.
async function hmac(password: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return toHex(signature);
}

/**
 * Cria o valor do cookie de sessao: `expiracao.assinatura`. A expiracao vai
 * assinada, entao o cliente nao consegue estende-la sem a senha.
 */
export async function createSession(password: string, ttlMs = SESSION_TTL_MS): Promise<{ value: string; maxAgeSec: number }> {
  const exp = Date.now() + ttlMs;
  const payload = String(exp);
  const value = `${payload}.${await hmac(password, payload)}`;
  return { value, maxAgeSec: Math.floor(ttlMs / 1000) };
}

/** Valida assinatura e expiracao. Sessao expirada = nao autenticado. */
export async function verifySession(cookie: string, password: string): Promise<boolean> {
  const dot = cookie.lastIndexOf('.');
  if (dot <= 0) return false;

  const payload = cookie.slice(0, dot);
  const signature = cookie.slice(dot + 1);

  const exp = Number(payload);
  if (!Number.isFinite(exp) || exp <= Date.now()) return false;

  return safeEqual(signature, await hmac(password, payload));
}
