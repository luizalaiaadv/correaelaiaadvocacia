export const SESSION_COOKIE = 'dash_session';

/**
 * Deriva o valor do cookie a partir da senha. Usa Web Crypto para funcionar
 * tanto no middleware quanto nas route handlers.
 */
export async function sessionToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`correaelaia-dashboard:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/** Comparacao em tempo constante para nao vazar a senha por timing. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
