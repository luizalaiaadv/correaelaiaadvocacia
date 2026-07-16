const API_BASE = 'https://app.typebot.io/api/v1';
const PAGE_SIZE = 50;
const MAX_PAGES = 20;

export type Lead = {
  id: string;
  createdAt: string;
  isCompleted: boolean;
  name: string | null;
  whatsapp: string | null;
  message: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
};

type TypebotVariable = { name?: string; value?: unknown };
type TypebotResult = {
  id: string;
  createdAt: string;
  isCompleted?: boolean;
  variables?: TypebotVariable[];
};

/** Marcas de acento (combining diacritics) que sobram apos normalizar em NFD. */
const DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g');

/**
 * Os nomes das variaveis sao definidos no editor do Typebot e podem variar em
 * caixa, acento e separador entre versoes do bot, por isso a chave e normalizada.
 */
function normalizeKey(key: string): string {
  return key
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .replace(/[\s_-]/g, '');
}

function pick(vars: Map<string, string>, ...names: string[]): string | null {
  for (const name of names) {
    const value = vars.get(normalizeKey(name));
    if (value) return value;
  }
  return null;
}

function toLead(result: TypebotResult): Lead {
  const vars = new Map<string, string>();
  for (const variable of result.variables ?? []) {
    if (!variable?.name) continue;
    const raw = Array.isArray(variable.value) ? variable.value.join(', ') : variable.value;
    if (raw === null || raw === undefined) continue;
    const value = String(raw).trim();
    if (value) vars.set(normalizeKey(variable.name), value);
  }

  return {
    id: result.id,
    createdAt: result.createdAt,
    isCompleted: Boolean(result.isCompleted),
    name: pick(vars, 'Nome', 'name', 'nome completo'),
    whatsapp: pick(vars, 'Whatsapp', 'telefone', 'phone', 'celular'),
    message: pick(vars, 'Resposta', 'mensagem', 'message', 'duvida'),
    utmSource: pick(vars, 'utm_source'),
    utmMedium: pick(vars, 'utm_medium'),
    utmCampaign: pick(vars, 'utm_campaign'),
    utmContent: pick(vars, 'utm_content'),
  };
}

/** Distingue "faltou configurar o ambiente" de "o Typebot falhou": as causas sao opostas. */
export class TypebotConfigError extends Error {
  constructor(public readonly missing: string[]) {
    super(`Variaveis ausentes no ambiente: ${missing.join(', ')}.`);
    this.name = 'TypebotConfigError';
  }
}

export async function fetchLeads(): Promise<Lead[]> {
  const token = process.env.TYPEBOT_API_TOKEN;
  const typebotId = process.env.TYPEBOT_ID;

  const missing = [
    !token && 'TYPEBOT_API_TOKEN',
    !typebotId && 'TYPEBOT_ID',
  ].filter((name): name is string => Boolean(name));

  if (missing.length > 0) throw new TypebotConfigError(missing);

  const leads: Lead[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < MAX_PAGES; page++) {
    const url = new URL(`${API_BASE}/typebots/${typebotId}/results`);
    url.searchParams.set('limit', String(PAGE_SIZE));
    if (cursor) url.searchParams.set('cursor', cursor);

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Typebot respondeu ${response.status} ao listar resultados.`);
    }

    const data = (await response.json()) as {
      results?: TypebotResult[];
      nextCursor?: string | null;
    };

    for (const result of data.results ?? []) leads.push(toLead(result));

    if (!data.nextCursor) break;
    cursor = data.nextCursor;
  }

  return leads.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
