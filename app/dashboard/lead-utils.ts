import type { Lead } from '@/lib/typebot';

export const TIMEZONE = 'America/Sao_Paulo';
export const DAY_MS = 86_400_000;

const dayKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const shortDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIMEZONE,
  day: '2-digit',
  month: '2-digit',
});

const fullDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIMEZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
});

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIMEZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** Chave YYYY-MM-DD no fuso de Sao Paulo, para agrupar leads por dia. */
export function dayKey(date: Date): string {
  return dayKeyFormatter.format(date);
}

export function dayKeysBack(days: number, from = Date.now()): string[] {
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) keys.push(dayKey(new Date(from - i * DAY_MS)));
  return keys;
}

export function formatShortDate(key: string): string {
  return shortDateFormatter.format(new Date(`${key}T12:00:00Z`));
}

export function formatFullDate(key: string): string {
  return fullDateFormatter.format(new Date(`${key}T12:00:00Z`));
}

export function formatTime(iso: string): string {
  return timeFormatter.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

export function formatRelative(iso: string, now = Date.now()): string {
  const diffSeconds = Math.round((now - new Date(iso).getTime()) / 1000);
  if (diffSeconds < 60) return 'agora mesmo';
  if (diffSeconds < 3600) return `ha ${Math.floor(diffSeconds / 60)} min`;
  if (diffSeconds < 86400) return `ha ${Math.floor(diffSeconds / 3600)} h`;
  return `ha ${Math.floor(diffSeconds / 86400)} d`;
}

export const PERIODS = [
  { id: 'today', label: 'Hoje', days: 1 },
  { id: 'yesterday', label: 'Ontem', days: 1 },
  { id: '7d', label: '7 dias', days: 7 },
  { id: '14d', label: '14 dias', days: 14 },
  { id: '30d', label: '30 dias', days: 30 },
  { id: 'all', label: 'Todo o periodo', days: 0 },
] as const;

export type PeriodId = (typeof PERIODS)[number]['id'];

/** Numero de dias dos filtros de janela (7d/14d/30d). Chamado so apos excluir
 *  today/yesterday/all. */
export function periodWindowDays(period: PeriodId): number {
  switch (period) {
    case '7d':
      return 7;
    case '30d':
      return 30;
    default:
      return 14;
  }
}

/**
 * Janela {since, until} em YYYY-MM-DD (fuso Sao Paulo) para os paineis de ADS.
 * Segue a convencao do Google/Meta: "ultimos N dias" terminam ONTEM (hoje e
 * parcial e nao entra); "hoje"/"ontem" sao dias isolados; "todo o periodo" vai
 * ate hoje. E o que faz o painel bater com a interface do Google Ads.
 */
export function adsPeriodDateRange(period: PeriodId, now = Date.now()): { since: string; until: string } {
  const today = dayKey(new Date(now));
  const yesterday = dayKey(new Date(now - DAY_MS));
  switch (period) {
    case 'today':
      return { since: today, until: today };
    case 'yesterday':
      return { since: yesterday, until: yesterday };
    case '7d':
      return { since: dayKey(new Date(now - 7 * DAY_MS)), until: yesterday };
    case '14d':
      return { since: dayKey(new Date(now - 14 * DAY_MS)), until: yesterday };
    case '30d':
      return { since: dayKey(new Date(now - 30 * DAY_MS)), until: yesterday };
    case 'all':
      return { since: dayKey(new Date(now - 90 * DAY_MS)), until: today };
  }
}

/** Rotulo com o intervalo de datas coberto pelo filtro, exibido abaixo do nome. */
export function periodRangeLabel(period: PeriodId, now = Date.now()): string {
  if (period === 'all') return 'todos os leads';
  if (period === 'today') return formatFullDate(dayKey(new Date(now)));
  if (period === 'yesterday') return formatFullDate(dayKey(new Date(now - DAY_MS)));
  const keys = dayKeysBack(periodWindowDays(period), now);
  return `${formatShortDate(keys[0])} - ${formatShortDate(keys[keys.length - 1])}`;
}

export function filterByPeriod(leads: Lead[], period: PeriodId, now = Date.now()): Lead[] {
  if (period === 'all') return leads;

  if (period === 'today' || period === 'yesterday') {
    const target = dayKey(new Date(period === 'today' ? now : now - DAY_MS));
    return leads.filter((lead) => dayKey(new Date(lead.createdAt)) === target);
  }

  const allowed = new Set(dayKeysBack(periodWindowDays(period), now));
  return leads.filter((lead) => allowed.has(dayKey(new Date(lead.createdAt))));
}

/**
 * Quantos leads cairam no periodo imediatamente ANTERIOR, de mesma duracao, para
 * o card de comparacao ("vs periodo anterior"). "Todo o periodo" nao tem anterior.
 */
export function countInPreviousPeriod(leads: Lead[], period: PeriodId, now = Date.now()): number {
  if (period === 'all') return 0;

  if (period === 'today' || period === 'yesterday') {
    // today -> compara com ontem; yesterday -> compara com anteontem.
    const target = dayKey(new Date(now - (period === 'today' ? 1 : 2) * DAY_MS));
    return leads.filter((lead) => dayKey(new Date(lead.createdAt)) === target).length;
  }

  // Janela de N dias que termina onde a atual comeca (sem sobrepor).
  const days = periodWindowDays(period);
  const allowed = new Set(dayKeysBack(days, now - days * DAY_MS));
  return leads.filter((lead) => allowed.has(dayKey(new Date(lead.createdAt)))).length;
}

export function countByDay(leads: Lead[], keys: string[]): { key: string; count: number }[] {
  const counts = new Map<string, number>(keys.map((key) => [key, 0]));
  for (const lead of leads) {
    const key = dayKey(new Date(lead.createdAt));
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return keys.map((key) => ({ key, count: counts.get(key) ?? 0 }));
}

export const UTM_DIMENSIONS = [
  { id: 'utmSource', label: 'UTM Source' },
  { id: 'utmMedium', label: 'UTM Medium' },
  { id: 'utmCampaign', label: 'UTM Campaign' },
  { id: 'utmContent', label: 'UTM Content' },
] as const;

export type UtmDimension = (typeof UTM_DIMENSIONS)[number]['id'];

export function whatsappLink(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return null;
  return `https://wa.me/${digits.startsWith('55') ? digits : `55${digits}`}`;
}
