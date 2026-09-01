export type PlatformId = 'meta' | 'google';

/**
 * Cores de identidade da plataforma. Usadas SO em detalhes (badge, chip do
 * icone, barras do grafico) — a casca de vidro e o fundo quente da marca
 * continuam iguais aos do dashboard de leads, para os tres parecerem um so
 * produto. E identificacao pontual (Von Restorff), nao troca de paleta.
 */
export type PlatformAccent = {
  badge: string;
  chip: string;
  edge: string;
  glow: string;
  rule: string;
  bar: string;
  barHover: string;
};

export type PlatformConfig = {
  id: PlatformId;
  label: string;
  short: string;
  /** Rotulo do "resultado" (plural) e a forma singular, para "Custo/{singular}". */
  resultLabel: string;
  resultSingular: string;
  accent: PlatformAccent;
};

export const PLATFORMS: Record<PlatformId, PlatformConfig> = {
  meta: {
    id: 'meta',
    label: 'Meta Ads',
    short: 'Meta',
    resultLabel: 'Resultados',
    resultSingular: 'resultado',
    accent: {
      badge: 'bg-[#0866FF]/20 text-[#7fb0ff] border-[#0866FF]/40',
      chip: 'bg-[#0866FF]/25 text-[#7fb0ff]',
      edge: 'bg-[#0866FF]',
      glow: 'bg-[#0866FF]/35',
      rule: 'via-[#0866FF]/80',
      bar: 'bg-[#2b6fff]',
      barHover: 'group-hover:bg-[#7fb0ff]',
    },
  },
  google: {
    id: 'google',
    label: 'Google Ads',
    short: 'Google',
    resultLabel: 'Conversões',
    resultSingular: 'conversão',
    accent: {
      badge: 'bg-[#1a9e5b]/20 text-[#5fce87] border-[#1a9e5b]/40',
      chip: 'bg-[#1a9e5b]/25 text-[#5fce87]',
      edge: 'bg-[#1a9e5b]',
      glow: 'bg-[#1a9e5b]/35',
      rule: 'via-[#1a9e5b]/80',
      bar: 'bg-[#1f9d57]',
      barHover: 'group-hover:bg-[#5fce87]',
    },
  },
};

/**
 * IDs das campanhas fixadas em cada aba de ads (o ID e estavel — imune a renome
 * e acento, ao contrario do nome). Se a cliente trocar de campanha, e o ID aqui
 * que se atualiza. O nome ao lado e so referencia humana.
 */
export const META_CAMPAIGNS = {
  // [27/08/26] [Escritório] [Tráfego] CAT (Comunicação de Acidente de Trabalho)
  cat: '120251649227200213',
  // [01/09/26] [Escritório] [Engajamento] Vaga de Estágio (leva para o Direct)
  estagio: '120251748263630213',
} as const;

/**
 * Acao do Meta que conta como "resultado" em cada tipo de campanha. Precisa bater
 * com o objetivo: trafego entrega clique no link; engajamento para o Direct
 * entrega conversa iniciada.
 */
export const RESULT_ACTIONS = {
  linkClick: 'link_click',
  directConversation: 'onsite_conversion.messaging_conversation_started_7d',
} as const;

/**
 * Abas de ADS. A aba Typebot NAO entra aqui: ela mostra a lista de leads
 * (`<LeadsPanel/>`), nao um painel de campanha.
 *
 * `kind` decide QUAIS metricas o painel mostra — campanhas com objetivos
 * diferentes nao se comparam pelos mesmos numeros:
 * - `traffic`     -> trafego para o perfil: seguidores, retencao de video, etc.
 * - `engagement`  -> engajamento para o Direct: conversas, alcance, frequencia.
 */
export type AdsTabId = 'meta' | 'google' | 'meta-estagio';
export type TabId = AdsTabId | 'typebot';
export type TabKind = 'traffic' | 'engagement';

export type TabConfig = {
  id: AdsTabId;
  /** Qual /api/ads/[platform] consultar (as abas do Meta usam a mesma API). */
  apiPlatform: PlatformId;
  label: string;
  short: string;
  resultLabel: string;
  resultSingular: string;
  kind: TabKind;
  /** Escopar o painel numa unica campanha, pelo ID do Meta. */
  campaignId?: string;
  /** Acao contada como "resultado" (default: clique no link). */
  resultAction?: string;
  accent: PlatformAccent;
};

/** Laranja da aba Estagio: distinta do azul do Meta e do verde do Google. */
const ESTAGIO_ACCENT: PlatformAccent = {
  badge: 'border-[#e07b39]/40 bg-[#e07b39]/20 text-[#f0a878]',
  chip: 'bg-[#e07b39]/25 text-[#f0a878]',
  edge: 'bg-[#e07b39]',
  glow: 'bg-[#e07b39]/35',
  rule: 'via-[#e07b39]/80',
  bar: 'bg-[#e07b39]',
  barHover: 'group-hover:bg-[#f0a878]',
};

export const TABS: Record<AdsTabId, TabConfig> = {
  // Meta: campanha CAT de trafego para o perfil (Resultados = cliques; tem seguidores/video).
  meta: {
    ...PLATFORMS.meta,
    apiPlatform: 'meta',
    kind: 'traffic',
    campaignId: META_CAMPAIGNS.cat,
    resultAction: RESULT_ACTIONS.linkClick,
  },
  // Google: conta inteira (todas as campanhas ativas), como antes.
  google: { ...PLATFORMS.google, apiPlatform: 'google', kind: 'traffic' },
  // Meta Estagio: campanha de engajamento que leva para o Direct — metricas
  // proprias (conversas), isoladas da campanha de trafego para o perfil.
  'meta-estagio': {
    id: 'meta-estagio',
    apiPlatform: 'meta',
    label: 'Meta Estágio',
    short: 'Estágio',
    resultLabel: 'Conversas no Direct',
    resultSingular: 'conversa',
    kind: 'engagement',
    campaignId: META_CAMPAIGNS.estagio,
    resultAction: RESULT_ACTIONS.directConversation,
    accent: ESTAGIO_ACCENT,
  },
};

/**
 * Limite de "saldo baixo" (em reais), igual para Meta e Google: a partir daqui
 * o alerta fica VERDE (ok); abaixo, VERMELHO com aviso de recarga.
 */
export const LOW_BALANCE_BRL = 100;
