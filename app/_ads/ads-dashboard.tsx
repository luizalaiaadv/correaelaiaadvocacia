'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  BadgeInfo,
  Bot,
  CalendarRange,
  Chrome,
  CircleAlert,
  CircleDollarSign,
  Eye,
  Facebook,
  LogOut,
  MessageCircle,
  MousePointerClick,
  Percent,
  Play,
  RefreshCw,
  Repeat,
  Share2,
  Target,
  Timer,
  TrendingUp,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react';
import imgLogo from '@/public/logofooter.webp';
import type { AdsResponse } from '@/lib/meta-ads';
import { cn } from '@/lib/utils';
import { APP_BUILD_LABEL, APP_BUILT_AT } from '@/lib/app-version';
import { PERIODS, dayKey, rangeLabel, type DateRange, type PeriodId } from '../dashboard/lead-utils';
import { useClientNow } from '../dashboard/use-client-now';
import { useScrollFade } from '../dashboard/use-scroll-fade';
import { useSessionKeepAlive } from '../dashboard/use-session-keepalive';
import LeadsPanel from '../dashboard/leads-panel';
import { TABS, type PlatformAccent, type TabConfig, type TabId } from './config';
import BalanceAlert from './balance-alert';
import {
  adsPeriodRangeLabel,
  formatBRL,
  formatBRLCompact,
  formatCompact,
  formatDecimal,
  formatInt,
  formatPercent,
  formatSeconds,
  formatShortDate,
  ratio,
} from './ads-utils';

/**
 * Flag da aba Typebot (lista de leads do Typebot). OCULTA por padrao — o painel
 * volta a ser so Meta/Google. Quando for rodar campanha com Typebot de novo,
 * troque para `true`: o componente <LeadsPanel/> e a pagina /dashboard continuam
 * prontos, entao basta isto para a aba reaparecer. Ver CHANGELOG.md ("Aba Typebot").
 */
const SHOW_TYPEBOT_TAB = false;
/**
 * Flag da aba "Meta Estágio" (campanha de engajamento para o Direct). OCULTA por
 * enquanto — troque para `true` quando a campanha voltar a ser acompanhada. Toda
 * a logica (TABS['meta-estagio'], KPIs de engajamento) continua pronta.
 */
const SHOW_ESTAGIO_TAB = false;

const TAB_ITEMS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'meta', label: 'Meta', icon: Facebook },
  { id: 'google', label: 'Google', icon: Chrome },
  ...(SHOW_ESTAGIO_TAB ? [{ id: 'meta-estagio' as const, label: 'Meta Estágio', icon: MessageCircle }] : []),
  ...(SHOW_TYPEBOT_TAB ? [{ id: 'typebot' as const, label: 'Typebot', icon: Bot }] : []),
];

export default function AdsDashboard() {
  const router = useRouter();
  // Desliza a sessao em atividade real; sem interacao por 30 min = deslogado.
  useSessionKeepAlive();
  // Aba escolhida dentro da propria pagina (Meta abre por padrao).
  const [tab, setTab] = useState<TabId>('meta');
  const isTypebot = tab === 'typebot';
  // Typebot e a lista de leads (LeadsPanel); Meta/Google sao painel de ads (TABS).
  const config = isTypebot ? null : TABS[tab];
  // Para as abas de ads, "Atualizar" mora no header (ao lado de Sair); o nonce
  // sinaliza o corpo a recarregar e o corpo devolve o carregamento para o icone
  // girar. A aba Typebot tem os proprios controles dentro do LeadsPanel.
  const [reloadNonce, setReloadNonce] = useState(0);
  const [bodyLoading, setBodyLoading] = useState(true);
  const handleLoadingChange = useCallback((loading: boolean) => setBodyLoading(loading), []);

  async function handleLogout() {
    await fetch('/api/dashboard-auth', { method: 'DELETE' });
    router.replace('/dash-ads/login');
  }

  return (
    <div className="relative min-h-screen text-white">
      <div aria-hidden className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[url('/texture-bg.webp')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#16101a]/85 via-[#121016]/70 to-[#0a0910]/85" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Image
                src={imgLogo}
                alt="Correa & Laia Advocacia"
                priority
                className="w-[104px] sm:w-[124px]"
                style={{ height: 'auto' }}
              />
              <div className="border-l border-white/15 pl-4">
                <p className="text-[11px] font-medium tracking-[0.2em] text-secondary uppercase">
                  {isTypebot ? 'Dashboard em tempo real' : 'Trafego pago'}
                </p>
                <h1 className="mt-0.5 flex items-center gap-2 font-display text-2xl text-accent sm:text-3xl">
                  {isTypebot ? 'Leads do Typebot' : config!.label}
                  <span
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase',
                      isTypebot
                        ? 'border-secondary/40 bg-secondary/25 text-[#e8b39a]'
                        : config!.accent.badge,
                    )}
                  >
                    {isTypebot ? 'Typebot' : config!.short}
                  </span>
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Atualizar so nas abas de ads; na Typebot o LeadsPanel tem o seu. */}
              {!isTypebot && (
                <button
                  type="button"
                  onClick={() => setReloadNonce((n) => n + 1)}
                  className="glass-soft flex items-center gap-2 px-3 py-2 text-sm text-white/70 transition hover:text-white"
                >
                  <RefreshCw className={cn('size-4', bodyLoading && 'animate-spin')} aria-hidden />
                  <span className="hidden sm:inline">Atualizar</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => void handleLogout()}
                aria-label="Sair"
                className="glass-soft flex items-center gap-2 p-2 px-3 text-sm text-white/60 transition hover:text-white"
              >
                <LogOut className="size-4" aria-hidden />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>

          {/* Seletor de aba (Meta/Google; abas Estágio e Typebot entram via flag). */}
          <div
            role="tablist"
            aria-label="Painel"
            className="glass-panel flex gap-1 rounded-xl p-1"
          >
            {TAB_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition sm:flex-none',
                  tab === id ? 'bg-accent text-[#0f1020]' : 'text-white/55 hover:text-white',
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </button>
            ))}
          </div>
        </header>

        {isTypebot ? (
          <LeadsPanel />
        ) : (
          <AdsPlatformBody
            key={tab}
            tab={config!}
            reloadNonce={reloadNonce}
            onLoadingChange={handleLoadingChange}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Corpo de uma aba: filtro de periodo, KPIs, grafico de investimento e a(s)
 * campanha(s). O filtro segue a convencao das interfaces nativas (N dias
 * terminando ONTEM). Remonta ao trocar de aba (key={tab}).
 */
function AdsPlatformBody({
  tab,
  reloadNonce,
  onLoadingChange,
}: {
  tab: TabConfig;
  reloadNonce: number;
  onLoadingChange: (loading: boolean) => void;
}) {
  const router = useRouter();
  const config = tab;
  const [period, setPeriod] = useState<PeriodId>('7d');
  // Relogio so no cliente: a pagina e pre-renderizada, entao ler a data no
  // corpo do componente congelaria a data do build no HTML (erro de hidratacao).
  const now = useClientNow();
  // Intervalo personalizado (date picker). Quando preenchido, manda as datas e
  // ignora o preset — igual aos gerenciadores de anuncio.
  const [custom, setCustom] = useState<DateRange | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [data, setData] = useState<AdsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const periodScroller = useScrollFade<HTMLDivElement>();

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const qs = new URLSearchParams({ period });
      if (custom) {
        qs.set('since', custom.since);
        qs.set('until', custom.until);
      }
      if (tab.campaignId) qs.set('campaignId', tab.campaignId);
      if (tab.resultAction) qs.set('resultAction', tab.resultAction);
      // Seguidores so fazem sentido na campanha de trafego para o perfil.
      if (tab.kind !== 'traffic') qs.set('followers', '0');
      const response = await fetch(`/api/ads/${tab.apiPlatform}?${qs.toString()}`, {
        cache: 'no-store',
      });
      if (response.status === 401) {
        router.replace('/dash-ads/login');
        return;
      }
      const json = (await response.json()) as AdsResponse & { error?: string };
      if (!response.ok) {
        setError(json.error ?? `Falha ao carregar (HTTP ${response.status}).`);
        return;
      }
      setData(json);
      setError(null);
    } catch {
      setError('Falha de conexao ao buscar os dados.');
    } finally {
      setIsLoading(false);
    }
  }, [tab, period, custom, router]);

  useEffect(() => {
    void load();
  }, [load, reloadNonce]);

  // Reporta o carregamento ao header (icone de Atualizar gira enquanto busca).
  useEffect(() => {
    onLoadingChange(isLoading);
  }, [isLoading, onLoadingChange]);

  const totals = data?.totals;
  const ctr =
    totals && totals.impressions > 0 ? totals.clicks / totals.impressions : 0;
  const cpc = totals && totals.clicks > 0 ? totals.spend / totals.clicks : 0;
  const cpa = totals && totals.results > 0 ? totals.spend / totals.results : 0;

  const presetLabel = PERIODS.find((p) => p.id === period)?.label ?? '';
  // Enquanto o relogio do cliente nao chega (primeiro render), mostra so o nome
  // do periodo — o intervalo entra logo depois, sem quebrar a hidratacao.
  const periodLabel = custom
    ? `Personalizado - ${rangeLabel(custom)}`
    : now === null
      ? presetLabel
      : `${presetLabel} - ${adsPeriodRangeLabel(period, now)}`;

  // Alcance/frequencia/CPM e engajamento vem do bloco de video do insights.
  const v = data?.video;

  // Campanha de ENGAJAMENTO (Direct): so as metricas que importam nesse objetivo.
  // Nao entram seguidores, retencao de video nem CPC — sao de outra campanha.
  const engagementKpis: Kpi[] = [
    {
      label: 'Investimento',
      value: totals ? formatBRL(totals.spend) : null,
      hint: 'Quanto foi gasto nesta campanha no periodo.',
      icon: <CircleDollarSign className="size-4" aria-hidden />,
      accent: METRIC_ACCENTS.amber,
    },
    {
      label: config.resultLabel,
      value: totals ? formatInt(totals.results) : null,
      hint: 'Quantas pessoas puxaram conversa no Direct a partir do anuncio. E o resultado principal aqui.',
      icon: <MessageCircle className="size-4" aria-hidden />,
      accent: METRIC_ACCENTS.blue,
    },
    {
      label: `Custo/${config.resultSingular}`,
      value: totals ? formatBRL(cpa) : null,
      hint: 'Quanto custou, em media, cada conversa iniciada no Direct.',
      icon: <CircleDollarSign className="size-4" aria-hidden />,
      accent: METRIC_ACCENTS.pink,
    },
    {
      label: 'Alcance',
      value: v ? formatCompact(v.reach) : null,
      hint: 'Quantas pessoas DIFERENTES viram o anuncio.',
      icon: <Users className="size-4" aria-hidden />,
      accent: METRIC_ACCENTS.teal,
    },
    {
      label: 'Impressões',
      value: totals ? formatCompact(totals.impressions) : null,
      hint: 'Quantas vezes o anuncio apareceu na tela (a mesma pessoa pode ver varias vezes).',
      icon: <Eye className="size-4" aria-hidden />,
      accent: METRIC_ACCENTS.sky,
    },
    {
      label: 'Frequência',
      value: v ? formatDecimal(v.frequency) : null,
      hint: 'Quantas vezes a mesma pessoa viu o anuncio. Acima de 3, costuma cansar.',
      icon: <Repeat className="size-4" aria-hidden />,
      accent: METRIC_ACCENTS.orange,
    },
    {
      label: 'CPM',
      value: v ? formatBRL(v.cpm) : null,
      hint: 'Quanto custa aparecer 1.000 vezes.',
      icon: <TrendingUp className="size-4" aria-hidden />,
      accent: METRIC_ACCENTS.emerald,
    },
    {
      label: 'Engajamento',
      value: v ? `${formatInt(v.saves)} / ${formatInt(v.shares)}` : null,
      hint: 'Salvamentos e compartilhamentos — sinais de que o anuncio interessou de verdade.',
      icon: <Share2 className="size-4" aria-hidden />,
      accent: METRIC_ACCENTS.rose,
    },
  ];

  const trafficKpis: Kpi[] = [
    {
      label: 'Investimento',
      value: totals ? formatBRL(totals.spend) : null,
      hint: 'Quanto foi gasto no anúncio neste período.',
      icon: <CircleDollarSign className="size-4" aria-hidden />,
      accent: METRIC_ACCENTS.amber,
    },
    {
      label: 'Impressões',
      value: totals ? formatCompact(totals.impressions) : null,
      hint: 'Quantas vezes o anúncio apareceu na tela das pessoas.',
      icon: <Eye className="size-4" aria-hidden />,
      accent: METRIC_ACCENTS.sky,
    },
    {
      label: 'Cliques',
      value: totals ? formatInt(totals.clicks) : null,
      hint: 'Quantas vezes clicaram no anúncio.',
      icon: <MousePointerClick className="size-4" aria-hidden />,
      accent: METRIC_ACCENTS.rose,
    },
    {
      label: 'CTR',
      value: totals ? formatPercent(ctr) : null,
      hint: 'De cada 100 pessoas que viram, quantas clicaram. Quanto maior, mais atrativo está o anúncio.',
      icon: <Percent className="size-4" aria-hidden />,
      accent: METRIC_ACCENTS.emerald,
    },
    {
      label: 'CPC médio',
      value: totals ? formatBRL(cpc) : null,
      hint: 'Quanto custou, em média, cada clique.',
      icon: <TrendingUp className="size-4" aria-hidden />,
      accent: METRIC_ACCENTS.orange,
    },
    {
      label: config.resultLabel,
      value: totals ? formatInt(totals.results) : null,
      hint:
        config.id === 'google'
          ? 'Quantas pessoas fizeram a ação desejada (ex.: preencher o formulário).'
          : 'Quantas pessoas clicaram para visitar o perfil.',
      icon: <Target className="size-4" aria-hidden />,
      accent: METRIC_ACCENTS.blue,
    },
    {
      label: `Custo/${config.resultSingular}`,
      value: totals ? formatBRL(cpa) : null,
      hint: `Quanto custou, em média, cada ${config.resultSingular}.`,
      icon: <CircleDollarSign className="size-4" aria-hidden />,
      accent: METRIC_ACCENTS.pink,
    },
  ];

  const kpis: Kpi[] = config.kind === 'engagement' ? engagementKpis : trafficKpis;

  if (config.kind === 'traffic' && data?.followers !== undefined) {
    // Como o Business Suite: se der para ler o ganho no periodo, ele e o numero
    // principal (acompanha as datas) e o total vai como legenda. Sem a permissao
    // de insights do IG, mostra so o total.
    const gained = data.followersGained;
    kpis.push({
      label: 'Seguidores',
      value:
        gained !== undefined
          ? `${gained >= 0 ? '+' : ''}${formatInt(gained)}`
          : formatInt(data.followers),
      caption:
        gained !== undefined
          ? `${formatInt(data.followers)} no total`
          : undefined,
      hint:
        gained !== undefined
          ? 'Seguidores ganhos no período (já descontando quem deixou de seguir).'
          : 'Total de seguidores do perfil hoje.',
      icon: <Users className="size-4" aria-hidden />,
      accent: METRIC_ACCENTS.teal,
    });
  }

  // Metricas da campanha de SEGUIDORES com criativo em video (so Meta).
  const spend = totals?.spend ?? 0;
  const gainedFollowers = data?.followersGained;
  const costPerFollower = gainedFollowers && gainedFollowers > 0 ? spend / gainedFollowers : null;
  const hookRate = v ? ratio(v.views3s, totals?.impressions ?? 0) : null;
  const thruRate = v ? ratio(v.thruplays, totals?.impressions ?? 0) : null;
  const costPerThruplay = v && v.thruplays > 0 ? spend / v.thruplays : null;
  const completionRate = v ? ratio(v.p100, v.plays) : null;
  const profileToFollower =
    v?.profileViews && gainedFollowers !== undefined ? ratio(gainedFollowers, v.profileViews) : null;

  const videoKpis: Kpi[] = v && config.kind === 'traffic'
    ? [
        {
          label: 'Custo por seguidor',
          value: costPerFollower === null ? '--' : formatBRL(costPerFollower),
          hint: 'O mais importante: quanto custou cada seguidor novo. Quanto menor, melhor.',
          icon: <UserPlus className="size-4" aria-hidden />,
          accent: METRIC_ACCENTS.teal,
        },
        {
          label: 'Visitas ao perfil',
          value: v.profileViews === undefined ? '--' : formatInt(v.profileViews),
          hint: 'Quantas vezes o perfil foi aberto no período.',
          icon: <Eye className="size-4" aria-hidden />,
          accent: METRIC_ACCENTS.sky,
        },
        {
          label: 'Perfil → seguidor',
          value: profileToFollower === null ? '--' : formatPercent(profileToFollower),
          hint: 'De quem visitou o perfil, quantos seguiram. Se estiver baixo, o ajuste é na bio e nos posts.',
          icon: <UserPlus className="size-4" aria-hidden />,
          accent: METRIC_ACCENTS.emerald,
        },
        {
          label: 'Taxa de retenção (3s)',
          value: hookRate === null ? '--' : formatPercent(hookRate),
          caption: `${formatCompact(v.views3s)} viram 3s`,
          hint: 'De quem viu o anúncio, quantos pararam para assistir pelo menos 3 segundos. Mede a força do início do vídeo.',
          icon: <Play className="size-4" aria-hidden />,
          accent: METRIC_ACCENTS.rose,
        },
        {
          label: 'ThruPlay',
          value: formatInt(v.thruplays),
          caption: thruRate === null ? undefined : `${formatPercent(thruRate)} das impressões`,
          hint: 'Quantos assistiram 15 segundos ou o vídeo até o fim — atenção de verdade.',
          icon: <Play className="size-4" aria-hidden />,
          accent: METRIC_ACCENTS.orange,
        },
        {
          label: 'Custo por ThruPlay',
          value: costPerThruplay === null ? '--' : formatBRL(costPerThruplay),
          hint: 'Quanto custou cada pessoa que assistiu o vídeo de verdade.',
          icon: <CircleDollarSign className="size-4" aria-hidden />,
          accent: METRIC_ACCENTS.pink,
        },
        {
          label: 'Tempo médio assistido',
          value: formatSeconds(v.avgWatchSeconds),
          caption: completionRate === null ? undefined : `${formatPercent(completionRate)} até o fim`,
          hint: 'Quantos segundos, em média, as pessoas assistiram do vídeo.',
          icon: <Timer className="size-4" aria-hidden />,
          accent: METRIC_ACCENTS.amber,
        },
        {
          label: 'CPM',
          value: formatBRL(v.cpm),
          hint: 'Quanto custa aparecer 1.000 vezes. Se subir muito, o vídeo cansou ou o público está apertado.',
          icon: <TrendingUp className="size-4" aria-hidden />,
          accent: METRIC_ACCENTS.blue,
        },
        {
          label: 'Frequência',
          value: formatDecimal(v.frequency),
          caption: `${formatCompact(v.reach)} pessoas alcançadas`,
          hint: 'Quantas vezes a mesma pessoa viu o anúncio. Acima de 3, costuma cansar.',
          icon: <Repeat className="size-4" aria-hidden />,
          accent: METRIC_ACCENTS.orange,
        },
        {
          label: 'Salvamentos e compart.',
          value: `${formatInt(v.saves)} / ${formatInt(v.shares)}`,
          hint: 'Quantos salvaram e quantos compartilharam. São os sinais mais fortes de que o conteúdo é bom.',
          icon: <Share2 className="size-4" aria-hidden />,
          accent: METRIC_ACCENTS.emerald,
        },
      ]
    : [];

  // Saldo da conta (independe do periodo) — mostrado no pop-up do canto.
  const balance = data?.balance;

  return (
    <>
      <div className="mb-5">
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
                aria-selected={!custom && period === item.id}
                onClick={() => {
                  setCustom(null);
                  setShowPicker(false);
                  setPeriod(item.id);
                }}
                className={cn(
                  'shrink-0 rounded-lg px-4 py-2 text-center transition',
                  !custom && period === item.id
                    ? 'bg-accent text-[#0f1020]'
                    : 'text-white/55 hover:text-white',
                )}
              >
                <span className="block text-xs font-semibold tracking-wide uppercase">
                  {item.label}
                </span>
                <span className="block text-[10px] opacity-70">
                  {/* Espaco fixo ate o relogio do cliente chegar: evita pulo de layout. */}
                  {now === null ? ' ' : adsPeriodRangeLabel(item.id, now)}
                </span>
              </button>
            ))}

            {/* Intervalo personalizado, como nos gerenciadores de anuncio. */}
            <button
              type="button"
              role="tab"
              aria-selected={Boolean(custom)}
              onClick={() => setShowPicker((open) => !open)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-center transition',
                custom ? 'bg-accent text-[#0f1020]' : 'text-white/55 hover:text-white',
              )}
            >
              <CalendarRange className="size-3.5" aria-hidden />
              <span>
                <span className="block text-xs font-semibold tracking-wide uppercase">
                  Personalizado
                </span>
                <span className="block text-[10px] opacity-70">
                  {custom ? rangeLabel(custom) : 'escolher datas'}
                </span>
              </span>
            </button>
          </div>
        </div>

        {showPicker && (
          <DateRangePicker
            value={custom}
            maxDate={dayKey(new Date(now ?? Date.now()))}
            onApply={(next) => {
              setCustom(next);
              setShowPicker(false);
            }}
            onClear={() => {
              setCustom(null);
              setShowPicker(false);
            }}
          />
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          <CircleAlert className="size-4 shrink-0" aria-hidden />
          {error}
        </div>
      )}

      {data?.sample && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          <BadgeInfo className="size-4 shrink-0" aria-hidden />
          Dados de exemplo — a integracao com a API do {config.label} sera
          ligada no proximo passo.
        </div>
      )}

      {/* Saldo da conta: pop-up no canto, que encolhe numa bolinha ao fechar. */}
      {balance && <BalanceAlert balance={balance} />}

      <section className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <StatCard key={kpi.label} {...kpi} loading={isLoading} />
        ))}
      </section>

      {/* Metricas da campanha de seguidores (video). So o Meta preenche. */}
      {videoKpis.length > 0 && (
        <section className="mb-5">
          <div className="mb-3 flex items-baseline gap-3">
            <h2 className="font-display text-lg text-accent">Seguidores e vídeo</h2>
            <p className="text-[11px] tracking-wide text-white/40 uppercase">
              o que importa para ganhar seguidores
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {videoKpis.map((kpi) => (
              <StatCard key={kpi.label} {...kpi} loading={isLoading} />
            ))}
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel
          title="Investimento / dia"
          subtitle={periodLabel}
          accent={config.accent}
          icon={<CircleDollarSign className="size-4" aria-hidden />}
        >
          <SpendChart
            series={data?.series ?? []}
            accent={config.accent}
            loading={isLoading}
          />
        </Panel>

        <Panel
          title="Campanhas ativas"
          subtitle={`${data?.campaigns.length ?? 0} em veiculacao - ${periodLabel}`}
          accent={config.accent}
          icon={<Target className="size-4" aria-hidden />}
        >
          <CampaignList
            campaigns={data?.campaigns ?? []}
            resultLabel={config.resultLabel}
            loading={isLoading}
          />
        </Panel>
      </section>

      <footer className="mt-6 flex flex-col gap-2 text-xs tracking-wide text-white/35 uppercase sm:flex-row sm:items-center sm:justify-between">
        <span>
          Investimento no periodo: {totals ? formatBRL(totals.spend) : '--'}
        </span>
        {data?.followersHandle && <span>@{data.followersHandle}</span>}
        <span title={APP_BUILT_AT ? `Publicado em ${APP_BUILT_AT}` : undefined}>
          {config.label} · painel do cliente · {APP_BUILD_LABEL}
        </span>
      </footer>
    </>
  );
}

type Accent = PlatformAccent;

/**
 * Escolha de intervalo de datas, como nos gerenciadores de anuncio. Usa
 * `input[type=date]` nativo: ja abre o calendario do sistema (inclusive no
 * celular), respeita o idioma do aparelho e nao adiciona dependencia nenhuma.
 */
function DateRangePicker({
  value,
  maxDate,
  onApply,
  onClear,
}: {
  value: DateRange | null;
  /** Nao deixa escolher datas no futuro. */
  maxDate: string;
  onApply: (range: DateRange) => void;
  onClear: () => void;
}) {
  const [since, setSince] = useState(value?.since ?? '');
  const [until, setUntil] = useState(value?.until ?? '');
  const ready = Boolean(since && until);

  return (
    <form
      className="glass-panel mt-2 flex flex-wrap items-end gap-3 rounded-xl p-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (ready) onApply({ since, until });
      }}
    >
      <label className="flex flex-col gap-1 text-[11px] tracking-wide text-white/45 uppercase">
        De
        <input
          type="date"
          value={since}
          max={until || maxDate}
          onChange={(event) => setSince(event.target.value)}
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white scheme-dark"
        />
      </label>
      <label className="flex flex-col gap-1 text-[11px] tracking-wide text-white/45 uppercase">
        Ate
        <input
          type="date"
          value={until}
          min={since || undefined}
          max={maxDate}
          onChange={(event) => setUntil(event.target.value)}
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white scheme-dark"
        />
      </label>

      <button
        type="submit"
        disabled={!ready}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-[#0f1020] transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        Aplicar
      </button>
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/60 transition hover:text-white"
        >
          Limpar
        </button>
      )}
    </form>
  );
}

/** Cor de um card: chip do icone, brilho, fio no topo e barra lateral. */
type CardAccent = { chip: string; glow: string; rule: string; edge: string };

/** Um card de metrica. `hint` explica a metrica em linguagem de cliente. */
type Kpi = {
  label: string;
  value: string | null;
  caption?: string;
  hint?: string;
  icon: React.ReactNode;
  accent: CardAccent;
};

/**
 * Uma cor por metrica, para diferenciar os cards de relance (antes ficava tudo
 * azul no Meta / tudo verde no Google). Paleta categorica alternando quente/frio
 * para vizinhos contrastarem; a identidade da plataforma fica no badge e nas
 * barras do grafico. Sem roxo.
 */
const METRIC_ACCENTS: Record<string, CardAccent> = {
  amber: { chip: 'bg-amber-400/30 text-amber-200', glow: 'bg-amber-400/35', rule: 'via-amber-300/90', edge: 'bg-amber-400' },
  sky: { chip: 'bg-sky-400/30 text-sky-200', glow: 'bg-sky-400/35', rule: 'via-sky-300/90', edge: 'bg-sky-400' },
  rose: { chip: 'bg-rose-500/30 text-rose-200', glow: 'bg-rose-500/35', rule: 'via-rose-400/90', edge: 'bg-rose-400' },
  emerald: { chip: 'bg-emerald-500/30 text-emerald-200', glow: 'bg-emerald-500/35', rule: 'via-emerald-400/90', edge: 'bg-emerald-400' },
  orange: { chip: 'bg-orange-400/30 text-orange-200', glow: 'bg-orange-400/35', rule: 'via-orange-300/90', edge: 'bg-orange-400' },
  blue: { chip: 'bg-blue-500/30 text-blue-200', glow: 'bg-blue-500/35', rule: 'via-blue-400/90', edge: 'bg-blue-400' },
  pink: { chip: 'bg-pink-500/30 text-pink-200', glow: 'bg-pink-500/35', rule: 'via-pink-400/90', edge: 'bg-pink-400' },
  teal: { chip: 'bg-teal-400/30 text-teal-200', glow: 'bg-teal-400/35', rule: 'via-teal-300/90', edge: 'bg-teal-400' },
};

function AccentDecor({ accent }: { accent: CardAccent }) {
  return (
    <>
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute -top-16 -right-10 size-48 rounded-full blur-3xl',
          accent.glow,
        )}
      />
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent',
          accent.rule,
        )}
      />
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute top-4 bottom-4 left-0 w-1 rounded-r-full opacity-80',
          accent.edge,
        )}
      />
    </>
  );
}

function StatCard({
  label,
  value,
  caption,
  hint,
  icon,
  accent,
  loading,
}: {
  label: string;
  value: string | null;
  caption?: string;
  /** Explicacao em linguagem simples, para a cliente entender a metrica. */
  hint?: string;
  icon: React.ReactNode;
  accent: CardAccent;
  loading: boolean;
}) {
  return (
    <article className="glass-panel relative overflow-hidden p-5">
      <AccentDecor accent={accent} />
      <div className="relative">
        <div className="mb-4 flex items-start justify-between gap-2">
          <h2 className="text-[11px] font-semibold tracking-[0.15em] text-white/45 uppercase">
            {label}
          </h2>
          <span
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-full',
              accent.chip,
            )}
          >
            {icon}
          </span>
        </div>
        {value === null || loading ? (
          <div className="h-8 w-24 animate-pulse rounded bg-white/10" />
        ) : (
          <>
            <p className="font-display text-2xl leading-none text-accent sm:text-3xl">
              {value}
            </p>
            {caption && (
              <p className="mt-1.5 text-[11px] tracking-wide text-white/40 uppercase">
                {caption}
              </p>
            )}
          </>
        )}
        {/* Explicacao da metrica: fica sempre visivel (nao e tooltip) para a
            cliente entender sem precisar passar o mouse — funciona no celular. */}
        {hint && (
          <p className="mt-3 border-t border-white/10 pt-2 text-[11px] leading-snug text-white/45">
            {hint}
          </p>
        )}
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
  accent: Accent;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-panel relative overflow-hidden p-5">
      <AccentDecor accent={accent} />
      <div className="relative">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg text-accent">{title}</h2>
            <p className="mt-0.5 text-[11px] tracking-wide text-white/40 uppercase">
              {subtitle}
            </p>
          </div>
          <span
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-full',
              accent.chip,
            )}
          >
            {icon}
          </span>
        </div>
        {children}
      </div>
    </section>
  );
}

function SpendChart({
  series,
  accent,
  loading,
}: {
  series: { key: string; spend: number }[];
  accent: Accent;
  loading: boolean;
}) {
  if (loading)
    return <div className="h-40 animate-pulse rounded-lg bg-white/5" />;
  if (series.length === 0)
    return (
      <p className="py-12 text-center text-sm text-white/40">
        Sem investimento no periodo.
      </p>
    );

  const max = Math.max(1, ...series.map((p) => p.spend));
  const compact = series.length > 7;

  return (
    <div className="flex h-40 items-end gap-1 overflow-hidden sm:gap-1.5">
      {series.map((point) => (
        <div
          key={point.key}
          className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
        >
          <span className="text-[9px] font-medium whitespace-nowrap text-white/45">
            {formatBRLCompact(point.spend)}
          </span>
          <div
            className={cn(
              'w-full rounded-t transition-all',
              accent.bar,
              accent.barHover,
            )}
            style={{ height: `${Math.max(2, (point.spend / max) * 100)}%` }}
            title={`${formatShortDate(point.key)}: ${formatBRL(point.spend)}`}
          />
          <span className="max-w-full truncate text-[9px] text-white/30">
            {compact ? point.key.slice(8) : formatShortDate(point.key)}
          </span>
        </div>
      ))}
    </div>
  );
}

function CampaignList({
  campaigns,
  resultLabel,
  loading,
}: {
  campaigns: { name: string; spend: number; clicks: number; results: number }[];
  resultLabel: string;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-white/5" />
        ))}
      </div>
    );
  }
  if (campaigns.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-white/40">
        Nenhuma campanha ativa no periodo.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {campaigns.map((c) => {
        const cpa = c.results > 0 ? c.spend / c.results : 0;
        return (
          <li key={c.name} className="glass-soft p-3">
            <div className="flex items-center justify-between gap-2">
              <span
                className="truncate text-sm font-medium text-white"
                title={c.name}
              >
                {c.name}
              </span>
              <span className="shrink-0 text-sm text-accent">
                {formatBRL(c.spend)}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-white/45">
              <span>{formatInt(c.clicks)} cliques</span>
              <span>
                {formatInt(c.results)} {resultLabel.toLowerCase()}
              </span>
              <span>CPA {formatBRL(cpa)}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
