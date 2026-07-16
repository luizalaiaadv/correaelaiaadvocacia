'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Bell,
  BellOff,
  CircleAlert,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Minus,
  RefreshCw,
  Table2,
  TrendingDown,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import imgLogo from '@/public/logofooter.webp';
import type { Lead } from '@/lib/typebot';
import { cn } from '@/lib/utils';
import {
  PERIODS,
  UTM_DIMENSIONS,
  countByDay,
  dayKey,
  dayKeysBack,
  filterByPeriod,
  formatDateTime,
  formatFullDate,
  formatRelative,
  formatShortDate,
  formatTime,
  periodRangeLabel,
  whatsappLink,
  type PeriodId,
} from './lead-utils';
import { requestNotificationPermission, useLeadNotifications } from './use-lead-notifications';

const REFRESH_MS = 10_000;

type View = 'overview' | 'leads';

export default function DashboardClient() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [period, setPeriod] = useState<PeriodId>('today');
  const [view, setView] = useState<View>('overview');
  const [notificationsOn, setNotificationsOn] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const { toasts, dismiss } = useLeadNotifications(leads, notificationsOn);

  const load = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/leads', { cache: 'no-store' });

      if (response.status === 401) {
        router.replace('/dashboard/login');
        return;
      }

      const data = (await response.json()) as { leads?: Lead[]; error?: string };

      if (!response.ok) {
        setError(data.error ?? `Falha ao sincronizar (HTTP ${response.status}).`);
        return;
      }

      setLeads(data.leads ?? []);
      setLastUpdated(new Date());
      setError(null);
    } catch {
      setError('Falha de conexao ao buscar os leads.');
    } finally {
      setIsRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), REFRESH_MS);
    return () => clearInterval(interval);
  }, [load]);

  // Mantem os rotulos relativos ("ha 3 min") corretos entre um fetch e outro.
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, []);

  function toggleNotifications() {
    if (notificationsOn) {
      setNotificationsOn(false);
      return;
    }
    // O aviso dentro da pagina nao depende da permissao do sistema: se o usuario
    // ignorar ou negar o prompt, o toast e o som continuam funcionando.
    setNotificationsOn(true);
    void requestNotificationPermission();
  }

  async function handleLogout() {
    await fetch('/api/dashboard-auth', { method: 'DELETE' });
    router.replace('/dashboard/login');
  }

  const stats = useMemo(() => {
    const all = leads ?? [];
    const todayKey = dayKey(new Date(now));
    const yesterdayKey = dayKey(new Date(now - 86_400_000));

    const todayCount = all.filter((lead) => dayKey(new Date(lead.createdAt)) === todayKey).length;
    const yesterdayCount = all.filter((lead) => dayKey(new Date(lead.createdAt)) === yesterdayKey).length;
    const chartDays = period === '14d' || period === 'all' ? 14 : 7;

    return {
      total: all.length,
      todayCount,
      yesterdayCount,
      delta: todayCount - yesterdayCount,
      visible: filterByPeriod(all, period, now),
      series: countByDay(all, dayKeysBack(chartDays, now)),
    };
  }, [leads, period, now]);

  const isLoading = leads === null;
  const periodLabel = `${PERIODS.find((item) => item.id === period)?.label} - ${periodRangeLabel(period, now)}`;

  return (
    <div className="min-h-screen bg-[#0f1020] text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Header
          view={view}
          onViewChange={setView}
          period={period}
          onPeriodChange={setPeriod}
          onRefresh={() => void load()}
          isRefreshing={isRefreshing}
          notificationsOn={notificationsOn}
          onToggleNotifications={toggleNotifications}
          onLogout={() => void handleLogout()}
          now={now}
        />

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          >
            <CircleAlert className="size-4 shrink-0" aria-hidden />
            {error}
          </div>
        )}

        {view === 'overview' ? (
          <>
            <section className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <StatCard
                label="Leads hoje"
                icon={<Users className="size-4" aria-hidden />}
                value={isLoading ? null : String(stats.todayCount)}
                caption={formatFullDate(dayKey(new Date(now)))}
              />
              <StatCard
                label="Hoje vs. ontem"
                icon={
                  stats.delta > 0 ? (
                    <TrendingUp className="size-4" aria-hidden />
                  ) : stats.delta < 0 ? (
                    <TrendingDown className="size-4" aria-hidden />
                  ) : (
                    <Minus className="size-4" aria-hidden />
                  )
                }
                iconTone={stats.delta > 0 ? 'positive' : stats.delta < 0 ? 'negative' : 'neutral'}
                value={isLoading ? null : `${stats.delta > 0 ? '+' : ''}${stats.delta}`}
                caption={`${stats.yesterdayCount} lead(s) ontem`}
              />
            </section>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Panel title="Leads / dia" subtitle={rangeSubtitle(stats.series)}>
                <DailyChart series={stats.series} isLoading={isLoading} />
              </Panel>

              <Panel title="Leads recentes" subtitle={periodLabel}>
                <RecentLeads leads={stats.visible} isLoading={isLoading} now={now} />
              </Panel>
            </section>
          </>
        ) : (
          <Panel title="Dados dos leads" subtitle={periodLabel}>
            <LeadsTable leads={stats.visible} isLoading={isLoading} />
          </Panel>
        )}

        <footer className="mt-6 flex flex-col gap-2 text-xs tracking-wide text-white/35 uppercase sm:flex-row sm:items-center sm:justify-between">
          <span>Total geral: {isLoading ? '--' : stats.total} leads</span>
          <span>Sincronizacao automatica a cada 10s</span>
          <span>
            Ultima atualizacao: {lastUpdated ? lastUpdated.toLocaleTimeString('pt-BR') : '--'}
          </span>
        </footer>
      </div>

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

function rangeSubtitle(series: { key: string }[]): string {
  if (series.length === 0) return '';
  return `${formatShortDate(series[0].key)} - ${formatShortDate(series[series.length - 1].key)}`;
}

function Header({
  view,
  onViewChange,
  period,
  onPeriodChange,
  onRefresh,
  isRefreshing,
  notificationsOn,
  onToggleNotifications,
  onLogout,
  now,
}: {
  view: View;
  onViewChange: (value: View) => void;
  period: PeriodId;
  onPeriodChange: (value: PeriodId) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  notificationsOn: boolean;
  onToggleNotifications: () => void;
  onLogout: () => void;
  now: number;
}) {
  const views: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Visao geral', icon: <LayoutDashboard className="size-4" aria-hidden /> },
    { id: 'leads', label: 'Dados dos leads', icon: <Table2 className="size-4" aria-hidden /> },
  ];

  return (
    <header className="mb-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Image
            src={imgLogo}
            alt="Correa & Laia Advocacia"
            priority
            style={{ width: '64px', height: 'auto' }}
          />
          <div className="border-l border-white/10 pl-4">
            <p className="text-[11px] font-medium tracking-[0.2em] text-secondary uppercase">
              Dashboard em tempo real
            </p>
            <h1 className="mt-0.5 font-display text-2xl text-accent sm:text-3xl">Leads do Typebot</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary"
          >
            <RefreshCw className={cn('size-4', isRefreshing && 'animate-spin')} aria-hidden />
            Atualizar
          </button>
          <button
            type="button"
            onClick={onToggleNotifications}
            aria-pressed={notificationsOn}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition',
              notificationsOn
                ? 'border-secondary/50 bg-secondary/15 text-accent'
                : 'border-white/10 bg-white/5 text-white/60 hover:text-white',
            )}
          >
            {notificationsOn ? <Bell className="size-4" aria-hidden /> : <BellOff className="size-4" aria-hidden />}
            Notificacoes
          </button>
          <button
            type="button"
            onClick={onLogout}
            aria-label="Sair do dashboard"
            className="flex items-center rounded-lg border border-white/10 bg-white/5 p-2 text-white/60 transition hover:text-white"
          >
            <LogOut className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      <div role="tablist" aria-label="Secoes do dashboard" className="mb-3 flex gap-2">
        {views.map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={view === item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition',
              view === item.id
                ? 'border-secondary/50 bg-secondary/15 text-accent'
                : 'border-white/10 bg-white/5 text-white/50 hover:text-white',
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      <div
        role="tablist"
        aria-label="Filtro de periodo"
        className="flex gap-1 overflow-x-auto rounded-xl border border-white/10 bg-[#171833] p-1"
      >
        {PERIODS.map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={period === item.id}
            onClick={() => onPeriodChange(item.id)}
            className={cn(
              'shrink-0 rounded-lg px-4 py-2 text-center transition',
              period === item.id ? 'bg-accent text-[#0f1020]' : 'text-white/55 hover:text-white',
            )}
          >
            <span className="block text-xs font-semibold tracking-wide uppercase">{item.label}</span>
            <span className="block text-[10px] opacity-70">{periodRangeLabel(item.id, now)}</span>
          </button>
        ))}
      </div>
    </header>
  );
}

function StatCard({
  label,
  value,
  caption,
  icon,
  iconTone = 'neutral',
}: {
  label: string;
  value: string | null;
  caption: string;
  icon: React.ReactNode;
  iconTone?: 'neutral' | 'positive' | 'negative';
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-[#171833] p-5">
      <div className="mb-4 flex items-start justify-between">
        <h2 className="text-[11px] font-semibold tracking-[0.15em] text-white/45 uppercase">{label}</h2>
        <span
          className={cn(
            'flex size-8 items-center justify-center rounded-full',
            iconTone === 'positive' && 'bg-emerald-500/20 text-emerald-300',
            iconTone === 'negative' && 'bg-red-500/20 text-red-300',
            iconTone === 'neutral' && 'bg-secondary/20 text-secondary',
          )}
        >
          {icon}
        </span>
      </div>

      {value === null ? (
        <div className="h-10 w-20 animate-pulse rounded bg-white/10" />
      ) : (
        <p className="font-display text-4xl leading-none text-accent">{value}</p>
      )}

      <p className="mt-3 text-xs tracking-wide text-white/40 uppercase">{caption}</p>
    </article>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#171833] p-5">
      <h2 className="font-display text-lg text-accent">{title}</h2>
      <p className="mt-0.5 mb-4 text-[11px] tracking-wide text-white/40 uppercase">{subtitle}</p>
      {children}
    </section>
  );
}

function DailyChart({ series, isLoading }: { series: { key: string; count: number }[]; isLoading: boolean }) {
  if (isLoading) return <div className="h-40 animate-pulse rounded-lg bg-white/5" />;

  const max = Math.max(1, ...series.map((point) => point.count));

  return (
    <div className="flex h-40 items-end gap-1.5">
      {series.map((point) => (
        <div key={point.key} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5">
          <span className="text-[10px] font-medium text-white/50">{point.count > 0 ? point.count : ''}</span>
          <div
            className={cn(
              'w-full rounded-t transition-all',
              point.count > 0 ? 'bg-secondary group-hover:bg-accent' : 'bg-white/5',
            )}
            style={{ height: `${Math.max(2, (point.count / max) * 100)}%` }}
            title={`${formatShortDate(point.key)}: ${point.count} lead(s)`}
          />
          <span className="text-[9px] whitespace-nowrap text-white/30">{formatShortDate(point.key)}</span>
        </div>
      ))}
    </div>
  );
}

function RecentLeads({ leads, isLoading, now }: { leads: Lead[]; isLoading: boolean; now: number }) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((index) => (
          <div key={index} className="h-14 animate-pulse rounded-lg bg-white/5" />
        ))}
      </div>
    );
  }

  if (leads.length === 0) {
    return <p className="py-8 text-center text-sm text-white/40">Nenhum lead no periodo selecionado.</p>;
  }

  return (
    <ul className="max-h-40 space-y-2 overflow-y-auto pr-1">
      {leads.slice(0, 25).map((lead) => {
        const link = whatsappLink(lead.whatsapp);
        return (
          <li key={lead.id} className="rounded-lg border border-white/5 bg-white/[0.03] p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-medium text-white">{lead.name?.trim() || 'Lead sem nome'}</p>
              <span className="shrink-0 text-[10px] text-white/35">{formatRelative(lead.createdAt, now)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="truncate text-xs text-white/45">
                {formatTime(lead.createdAt)} - {lead.utmSource?.trim() || 'direto'}
              </span>
              {link && (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex shrink-0 items-center gap-1 text-xs text-emerald-400 transition hover:text-emerald-300"
                >
                  <MessageCircle className="size-3" aria-hidden />
                  {lead.whatsapp}
                </a>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function LeadsTable({ leads, isLoading }: { leads: Lead[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="h-12 animate-pulse rounded-lg bg-white/5" />
        ))}
      </div>
    );
  }

  if (leads.length === 0) {
    return <p className="py-12 text-center text-sm text-white/40">Nenhum lead no periodo selecionado.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-white/10">
            {['Data', 'Nome', 'Whatsapp', 'Resposta'].map((heading) => (
              <th
                key={heading}
                scope="col"
                className="px-3 py-2 text-[11px] font-semibold tracking-[0.15em] text-white/45 uppercase"
              >
                {heading}
              </th>
            ))}
            {UTM_DIMENSIONS.map((dimension) => (
              <th
                key={dimension.id}
                scope="col"
                className="px-3 py-2 text-[11px] font-semibold tracking-[0.15em] text-secondary uppercase"
              >
                {dimension.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const link = whatsappLink(lead.whatsapp);
            return (
              <tr key={lead.id} className="border-b border-white/5 transition hover:bg-white/[0.03]">
                <td className="px-3 py-3 whitespace-nowrap text-white/60">{formatDateTime(lead.createdAt)}</td>
                <td className="px-3 py-3 font-medium text-white">{lead.name?.trim() || '--'}</td>
                <td className="px-3 py-3 whitespace-nowrap">
                  {link ? (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-400 transition hover:text-emerald-300"
                    >
                      <MessageCircle className="size-3" aria-hidden />
                      {lead.whatsapp}
                    </a>
                  ) : (
                    <span className="text-white/30">--</span>
                  )}
                </td>
                <td className="px-3 py-3 text-white/70">{lead.message?.trim() || '--'}</td>
                {UTM_DIMENSIONS.map((dimension) => {
                  const value = lead[dimension.id]?.trim();
                  return (
                    <td key={dimension.id} className="px-3 py-3 text-white/60" title={value || undefined}>
                      {value || <span className="text-white/25">--</span>}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: { id: string; name: string; source: string }[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-80"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 rounded-xl border border-secondary/40 bg-[#171833] p-4 shadow-2xl"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
            <Users className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-accent">Novo lead recebido</p>
            <p className="truncate text-xs text-white/60">
              {toast.name} - origem: {toast.source}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            aria-label="Fechar notificacao"
            className="shrink-0 text-white/40 transition hover:text-white"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}
