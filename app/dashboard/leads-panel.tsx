'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  BellOff,
  ChartColumn,
  Check,
  CircleAlert,
  Clock,
  LayoutDashboard,
  MessageCircle,
  Minus,
  RefreshCw,
  Table2,
  TrendingDown,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
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
import { useScrollFade } from './use-scroll-fade';
import { useContactedLeads } from './use-contacted-leads';
import LeadDetailsModal from './lead-details-modal';

const REFRESH_MS = 10_000;

type View = 'overview' | 'leads';

/**
 * Cor de destaque por card, para diferenciar um do outro de relance. A escada e
 * quente (cobre -> dourado -> creme) para nao brigar com o marrom da marca; as
 * duas ultimas sao semanticas e so aparecem no card de variacao.
 */
type Accent = 'copper' | 'gold' | 'cream' | 'positive' | 'negative';

const ACCENTS: Record<Accent, { chip: string; glow: string; rule: string; edge: string }> = {
  copper: {
    chip: 'bg-secondary/40 text-[#e8b39a]',
    glow: 'bg-secondary/45',
    rule: 'via-secondary',
    edge: 'bg-secondary',
  },
  gold: {
    chip: 'bg-amber-400/30 text-amber-200',
    glow: 'bg-amber-400/35',
    rule: 'via-amber-300/90',
    edge: 'bg-amber-400',
  },
  cream: {
    chip: 'bg-accent/30 text-accent',
    glow: 'bg-accent/30',
    rule: 'via-accent/90',
    edge: 'bg-accent',
  },
  positive: {
    chip: 'bg-emerald-500/35 text-emerald-200',
    glow: 'bg-emerald-500/35',
    rule: 'via-emerald-400/90',
    edge: 'bg-emerald-400',
  },
  negative: {
    chip: 'bg-red-500/35 text-red-200',
    glow: 'bg-red-500/35',
    rule: 'via-red-400/90',
    edge: 'bg-red-400',
  },
};

/** Toggle circular de "contatado": preenchido quando marcado, vazado quando nao. */
function ContactedToggle({
  on,
  onToggle,
  size = 'md',
}: {
  on: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md';
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={on ? 'Desmarcar contatado' : 'Marcar como contatado'}
      title={on ? 'Contatado — clique para desmarcar' : 'Marcar como contatado'}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full border transition',
        size === 'sm' ? 'size-6' : 'size-7',
        on
          ? 'border-emerald-400/60 bg-emerald-500/30 text-emerald-300'
          : 'border-white/20 bg-white/5 text-white/25 hover:border-white/40 hover:text-white/60',
      )}
    >
      <Check className={size === 'sm' ? 'size-3' : 'size-3.5'} aria-hidden />
    </button>
  );
}

/** Brilho no canto + fio de luz no topo + barra lateral, na cor do card. */
function AccentDecor({ accent }: { accent: Accent }) {
  const tone = ACCENTS[accent];
  return (
    <>
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute -top-16 -right-10 size-48 rounded-full blur-3xl',
          tone.glow,
        )}
      />
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent',
          tone.rule,
        )}
      />
      <div
        aria-hidden
        className={cn('pointer-events-none absolute top-4 bottom-4 left-0 w-1 rounded-r-full opacity-80', tone.edge)}
      />
    </>
  );
}

/**
 * Corpo do painel de leads do Typebot: controles, filtro de periodo, visao geral
 * / dados, notificacoes e modal. Sem logo nem logout — quem hospeda (a pagina
 * /dashboard ou a aba "Typebot" do /dash-ads) fornece essa casca. O filtro de
 * periodo aqui INCLUI hoje (leads chegam hoje), ao contrario dos paineis de ads.
 */
export default function LeadsPanel() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [period, setPeriod] = useState<PeriodId>('today');
  const [view, setView] = useState<View>('overview');
  const [notificationsOn, setNotificationsOn] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const { toasts, dismiss } = useLeadNotifications(leads, notificationsOn);
  const { contacted, mark, toggle: toggleContacted, markAll, unmarkAll } = useContactedLeads();
  const periodScroller = useScrollFade<HTMLDivElement>();

  const load = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/leads', { cache: 'no-store' });

      if (response.status === 401) {
        router.replace('/dash-ads/login');
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

  const stats = useMemo(() => {
    const all = leads ?? [];
    const todayKey = dayKey(new Date(now));
    const yesterdayKey = dayKey(new Date(now - 86_400_000));

    const todayCount = all.filter((lead) => dayKey(new Date(lead.createdAt)) === todayKey).length;
    const yesterdayCount = all.filter((lead) => dayKey(new Date(lead.createdAt)) === yesterdayKey).length;
    const chartDays = period === '30d' ? 30 : period === '14d' || period === 'all' ? 14 : 7;

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

  const views: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Visao geral', icon: <LayoutDashboard className="size-4" aria-hidden /> },
    { id: 'leads', label: 'Dados dos leads', icon: <Table2 className="size-4" aria-hidden /> },
  ];

  return (
    <>
      <div className="mb-5">
        {/* Controles proprios do painel de leads (o logo/logout ficam na casca). */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div role="tablist" aria-label="Secoes do dashboard" className="flex gap-2">
            {views.map((item) => (
              <button
                key={item.id}
                role="tab"
                aria-selected={view === item.id}
                onClick={() => setView(item.id)}
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary"
            >
              <RefreshCw className={cn('size-4', isRefreshing && 'animate-spin')} aria-hidden />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
            <button
              type="button"
              onClick={toggleNotifications}
              aria-pressed={notificationsOn}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition',
                notificationsOn
                  ? 'border-secondary/50 bg-secondary/15 text-accent'
                  : 'border-white/10 bg-white/5 text-white/60 hover:text-white',
              )}
            >
              {notificationsOn ? <Bell className="size-4" aria-hidden /> : <BellOff className="size-4" aria-hidden />}
              <span className="hidden sm:inline">Notificacoes</span>
            </button>
          </div>
        </div>

        {/* O vidro fica no wrapper e a rolagem no filho: a mask do scroll-fade
            dissolveria a borda e o proprio vidro se estivesse no mesmo elemento. */}
        <div className="glass-panel rounded-xl p-1">
          <div
            ref={periodScroller}
            role="tablist"
            aria-label="Filtro de periodo"
            className="scroll-fade-x no-scrollbar flex gap-1 overflow-x-auto"
          >
            {PERIODS.map((item) => (
              <button
                key={item.id}
                role="tab"
                aria-selected={period === item.id}
                onClick={() => setPeriod(item.id)}
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
        </div>
      </div>

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
              accent="copper"
              icon={<Users className="size-4" aria-hidden />}
              value={isLoading ? null : String(stats.todayCount)}
              caption={formatFullDate(dayKey(new Date(now)))}
            />
            <StatCard
              label="Hoje vs. ontem"
              // Aqui a cor carrega significado (subiu/caiu), entao ela manda.
              accent={stats.delta > 0 ? 'positive' : stats.delta < 0 ? 'negative' : 'copper'}
              icon={
                stats.delta > 0 ? (
                  <TrendingUp className="size-4" aria-hidden />
                ) : stats.delta < 0 ? (
                  <TrendingDown className="size-4" aria-hidden />
                ) : (
                  <Minus className="size-4" aria-hidden />
                )
              }
              value={isLoading ? null : `${stats.delta > 0 ? '+' : ''}${stats.delta}`}
              caption={`${stats.yesterdayCount} lead(s) ontem`}
            />
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel
              title="Leads / dia"
              subtitle={rangeSubtitle(stats.series)}
              accent="gold"
              icon={<ChartColumn className="size-4" aria-hidden />}
            >
              <DailyChart series={stats.series} isLoading={isLoading} />
            </Panel>

            <Panel
              title="Leads recentes"
              subtitle={periodLabel}
              accent="cream"
              icon={<Clock className="size-4" aria-hidden />}
            >
              <RecentLeads
                leads={stats.visible}
                isLoading={isLoading}
                now={now}
                onSelect={setSelectedLead}
                contacted={contacted}
                onWhatsappClick={mark}
              />
            </Panel>
          </section>
        </>
      ) : (
        <Panel title="Dados dos leads" subtitle={periodLabel}>
          <LeadsData
            leads={stats.visible}
            isLoading={isLoading}
            onSelect={setSelectedLead}
            contacted={contacted}
            onToggle={toggleContacted}
            onWhatsappClick={mark}
            onMarkAll={markAll}
            onUnmarkAll={unmarkAll}
          />
        </Panel>
      )}

      <footer className="mt-6 flex flex-col gap-2 text-xs tracking-wide text-white/35 uppercase sm:flex-row sm:items-center sm:justify-between">
        <span>Total geral: {isLoading ? '--' : stats.total} leads</span>
        <span>Sincronizacao automatica a cada 10s</span>
        <span>
          Ultima atualizacao: {lastUpdated ? lastUpdated.toLocaleTimeString('pt-BR') : '--'}
        </span>
      </footer>

      <ToastStack toasts={toasts} onDismiss={dismiss} />

      {selectedLead && (
        <LeadDetailsModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          isContacted={contacted.has(selectedLead.id)}
          onToggleContacted={() => toggleContacted(selectedLead.id)}
          onWhatsappClick={() => mark(selectedLead.id)}
        />
      )}
    </>
  );
}

function rangeSubtitle(series: { key: string }[]): string {
  if (series.length === 0) return '';
  return `${formatShortDate(series[0].key)} - ${formatShortDate(series[series.length - 1].key)}`;
}

function StatCard({
  label,
  value,
  caption,
  icon,
  accent,
}: {
  label: string;
  value: string | null;
  caption: string;
  icon: React.ReactNode;
  accent: Accent;
}) {
  return (
    <article className="glass-panel relative overflow-hidden p-5">
      <AccentDecor accent={accent} />

      <div className="relative">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-[11px] font-semibold tracking-[0.15em] text-white/45 uppercase">{label}</h2>
          <span className={cn('flex size-8 items-center justify-center rounded-full', ACCENTS[accent].chip)}>
            {icon}
          </span>
        </div>

        {value === null ? (
          <div className="h-10 w-20 animate-pulse rounded bg-white/10" />
        ) : (
          <p className="font-display text-4xl leading-none text-accent">{value}</p>
        )}

        <p className="mt-3 text-xs tracking-wide text-white/40 uppercase">{caption}</p>
      </div>
    </article>
  );
}

function Panel({
  title,
  subtitle,
  accent,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  accent?: Accent;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className={cn('glass-panel p-5', accent && 'relative overflow-hidden')}>
      {accent && <AccentDecor accent={accent} />}

      <div className="relative">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg text-accent">{title}</h2>
            <p className="mt-0.5 text-[11px] tracking-wide text-white/40 uppercase">{subtitle}</p>
          </div>
          {accent && icon && (
            <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-full', ACCENTS[accent].chip)}>
              {icon}
            </span>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

function DailyChart({ series, isLoading }: { series: { key: string; count: number }[]; isLoading: boolean }) {
  if (isLoading) return <div className="h-40 animate-pulse rounded-lg bg-white/5" />;

  const max = Math.max(1, ...series.map((point) => point.count));
  // Com 14 colunas o rotulo "05/07" nao cabe na largura de um celular e estoura
  // o card. Acima de 7 barras, mostra so o dia; a data completa fica no title.
  const compact = series.length > 7;

  return (
    <div className="flex h-40 items-end gap-1 overflow-hidden sm:gap-1.5">
      {series.map((point) => (
        <div
          key={point.key}
          className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
        >
          <span className="text-[10px] font-medium text-white/50">{point.count > 0 ? point.count : ''}</span>
          <div
            className={cn(
              'w-full rounded-t transition-all',
              point.count > 0 ? 'bg-secondary group-hover:bg-accent' : 'bg-white/5',
            )}
            style={{ height: `${Math.max(2, (point.count / max) * 100)}%` }}
            title={`${formatShortDate(point.key)}: ${point.count} lead(s)`}
          />
          <span className="max-w-full truncate text-[9px] text-white/30">
            {compact ? point.key.slice(8) : formatShortDate(point.key)}
          </span>
        </div>
      ))}
    </div>
  );
}

function RecentLeads({
  leads,
  isLoading,
  now,
  onSelect,
  contacted,
  onWhatsappClick,
}: {
  leads: Lead[];
  isLoading: boolean;
  now: number;
  onSelect: (lead: Lead) => void;
  contacted: ReadonlySet<string>;
  onWhatsappClick: (id: string) => void;
}) {
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
        const isContacted = contacted.has(lead.id);
        const link = whatsappLink(lead.whatsapp);
        return (
          <li
            key={lead.id}
            className={cn(
              'glass-soft flex items-stretch overflow-hidden transition',
              isContacted && 'opacity-50 saturate-50',
            )}
          >
            <button
              type="button"
              onClick={() => onSelect(lead)}
              aria-label={`Ver dados de ${lead.name?.trim() || 'lead sem nome'}`}
              className="min-w-0 flex-1 cursor-pointer p-3 text-left transition hover:bg-white/[0.06]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-white">
                  {isContacted && <Check className="size-3 shrink-0 text-emerald-400" aria-hidden />}
                  <span className="truncate">{lead.name?.trim() || 'Lead sem nome'}</span>
                </span>
                <span className="shrink-0 text-[10px] text-white/35">{formatRelative(lead.createdAt, now)}</span>
              </div>
              <div className="mt-1 truncate text-xs text-white/45">
                {formatTime(lead.createdAt)} - {lead.utmSource?.trim() || 'direto'}
              </div>
            </button>

            {link && (
              // Link real, fora do botao: abre a conversa e ja marca como contatado.
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onWhatsappClick(lead.id)}
                aria-label={`Abrir WhatsApp de ${lead.name?.trim() || 'lead'}`}
                className={cn(
                  'flex shrink-0 items-center gap-1 border-l border-white/10 px-3 text-xs transition',
                  isContacted
                    ? 'text-white/35 hover:text-white/60'
                    : 'text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300',
                )}
              >
                <MessageCircle className="size-3.5" aria-hidden />
                <span className="hidden sm:inline">{lead.whatsapp}</span>
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function LeadsData({
  leads,
  isLoading,
  onSelect,
  contacted,
  onToggle,
  onWhatsappClick,
  onMarkAll,
  onUnmarkAll,
}: {
  leads: Lead[];
  isLoading: boolean;
  onSelect: (lead: Lead) => void;
  contacted: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onWhatsappClick: (id: string) => void;
  onMarkAll: (ids: string[]) => void;
  onUnmarkAll: (ids: string[]) => void;
}) {
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

  const visibleIds = leads.map((lead) => lead.id);
  const contactedCount = visibleIds.filter((id) => contacted.has(id)).length;
  const allContacted = contactedCount === visibleIds.length;

  return (
    <>
      {/* Grupo de acao em massa: age so sobre os leads do periodo filtrado. */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs tracking-wide text-white/45 uppercase">
          {contactedCount} de {visibleIds.length} contatado(s)
        </span>
        <div role="group" aria-label="Marcar contatados em massa" className="glass-soft flex overflow-hidden p-0.5">
          <button
            type="button"
            onClick={() => onMarkAll(visibleIds)}
            aria-pressed={allContacted}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition',
              allContacted ? 'bg-emerald-500/25 text-emerald-200' : 'text-white/55 hover:text-white',
            )}
          >
            <Check className="size-3" aria-hidden />
            Marcar todos
          </button>
          <button
            type="button"
            onClick={() => onUnmarkAll(visibleIds)}
            aria-pressed={contactedCount === 0}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition',
              contactedCount === 0 ? 'bg-white/10 text-white/80' : 'text-white/55 hover:text-white',
            )}
          >
            Desmarcar todos
          </button>
        </div>
      </div>
      {/* Celular: cartoes compactos; tocar abre o modal com todos os campos.
          Tabela de 8 colunas em 375px vira rolagem lateral cega — em lista, cada
          lead se le inteiro de uma vez. */}
      <ul className="space-y-2 md:hidden">
        {leads.map((lead) => {
          const isContacted = contacted.has(lead.id);
          const link = whatsappLink(lead.whatsapp);
          return (
            <li
              key={lead.id}
              className={cn('glass-soft overflow-hidden transition', isContacted && 'opacity-50 saturate-50')}
            >
              <div className="flex items-stretch">
                <button
                  type="button"
                  onClick={() => onSelect(lead)}
                  aria-label={`Ver dados de ${lead.name?.trim() || 'lead sem nome'}`}
                  className="min-w-0 flex-1 cursor-pointer p-3 text-left transition hover:bg-white/[0.06]"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-white">
                      {lead.name?.trim() || 'Lead sem nome'}
                    </span>
                    <span className="shrink-0 text-[10px] whitespace-nowrap text-white/40">
                      {formatDateTime(lead.createdAt)}
                    </span>
                  </div>

                  {lead.message?.trim() && (
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/55">{lead.message.trim()}</p>
                  )}

                  {lead.utmContent?.trim() && (
                    <span className="mt-2 inline-block max-w-full truncate rounded-full bg-secondary/25 px-2 py-0.5 text-[10px] text-[#e8b39a]">
                      {lead.utmContent.trim()}
                    </span>
                  )}
                </button>

                <div className="flex shrink-0 flex-col items-center justify-center gap-2 border-l border-white/10 px-3">
                  <ContactedToggle size="sm" on={isContacted} onToggle={() => onToggle(lead.id)} />
                  {link && (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => onWhatsappClick(lead.id)}
                      aria-label={`Abrir WhatsApp de ${lead.name?.trim() || 'lead'}`}
                      className={cn(
                        'flex size-6 items-center justify-center rounded-full transition',
                        isContacted
                          ? 'text-white/35 hover:text-white/60'
                          : 'text-emerald-400 hover:bg-emerald-500/15 hover:text-emerald-300',
                      )}
                    >
                      <MessageCircle className="size-3.5" aria-hidden />
                    </a>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Desktop: a tabela completa continua valendo; a linha tambem abre o modal. */}
      <div className="hidden overflow-x-auto md:block">
        <LeadsTable
          leads={leads}
          onSelect={onSelect}
          contacted={contacted}
          onToggle={onToggle}
          onWhatsappClick={onWhatsappClick}
        />
      </div>
    </>
  );
}

function LeadsTable({
  leads,
  onSelect,
  contacted,
  onToggle,
  onWhatsappClick,
}: {
  leads: Lead[];
  onSelect: (lead: Lead) => void;
  contacted: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onWhatsappClick: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th scope="col" className="px-3 py-2 text-[11px] font-semibold tracking-[0.15em] text-white/45 uppercase">
              Contatado
            </th>
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
            const isContacted = contacted.has(lead.id);
            return (
              <tr
                key={lead.id}
                onClick={() => onSelect(lead)}
                className={cn(
                  'cursor-pointer border-b border-white/5 transition hover:bg-white/[0.05]',
                  isContacted && 'opacity-50 saturate-50',
                )}
              >
                <td className="px-3 py-3">
                  <ContactedToggle on={isContacted} onToggle={() => onToggle(lead.id)} />
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-white/60">{formatDateTime(lead.createdAt)}</td>
                <td className="px-3 py-3 font-medium text-white">{lead.name?.trim() || '--'}</td>
                <td className="px-3 py-3 whitespace-nowrap">
                  {link ? (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(event) => {
                        event.stopPropagation();
                        onWhatsappClick(lead.id);
                      }}
                      className={cn(
                        'inline-flex items-center gap-1 transition',
                        isContacted ? 'text-white/40 hover:text-white/60' : 'text-emerald-400 hover:text-emerald-300',
                      )}
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
          className="glass-panel animate-modal-in pointer-events-auto flex items-start gap-3 border-secondary/40 p-4"
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
