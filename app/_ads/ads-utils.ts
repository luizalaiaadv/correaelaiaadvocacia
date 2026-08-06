import {
  adsPeriodDateRange,
  dayKey,
  formatFullDate,
  formatShortDate,
  DAY_MS,
  type PeriodId,
} from '../dashboard/lead-utils';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const brlCompact = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});
const int = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });

export const formatBRL = (value: number) => brl.format(value);
export const formatBRLCompact = (value: number) => brlCompact.format(value);
export const formatInt = (value: number) => int.format(value);
export const formatCompact = (value: number) => compact.format(value);
export const formatPercent = (value: number) => `${(value * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;

/** Rotulo do intervalo — reflete exatamente a janela usada nos dados de ads. */
export function adsPeriodRangeLabel(period: PeriodId, now = Date.now()): string {
  if (period === 'all') return 'todo o periodo';
  if (period === 'today') return formatFullDate(dayKey(new Date(now)));
  if (period === 'yesterday') return formatFullDate(dayKey(new Date(now - DAY_MS)));
  const { since, until } = adsPeriodDateRange(period, now);
  return `${formatShortDate(since)} - ${formatShortDate(until)}`;
}

export { formatShortDate };
