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
  /** Rotulo do "resultado" de conversao — muda entre as plataformas. */
  resultLabel: string;
  accent: PlatformAccent;
  campaignNames: string[];
};

export const PLATFORMS: Record<PlatformId, PlatformConfig> = {
  meta: {
    id: 'meta',
    label: 'Meta Ads',
    short: 'Meta',
    resultLabel: 'Resultados',
    accent: {
      badge: 'bg-[#0866FF]/20 text-[#7fb0ff] border-[#0866FF]/40',
      chip: 'bg-[#0866FF]/25 text-[#7fb0ff]',
      edge: 'bg-[#0866FF]',
      glow: 'bg-[#0866FF]/35',
      rule: 'via-[#0866FF]/80',
      bar: 'bg-[#2b6fff]',
      barHover: 'group-hover:bg-[#7fb0ff]',
    },
    campaignNames: [
      'Trabalhista - Reels Video',
      'Rescisao Indireta - Estatico',
      'Verbas Rescisorias - Carrossel',
      'Remarketing - Site',
    ],
  },
  google: {
    id: 'google',
    label: 'Google Ads',
    short: 'Google',
    resultLabel: 'Conversoes',
    accent: {
      badge: 'bg-[#1a9e5b]/20 text-[#5fce87] border-[#1a9e5b]/40',
      chip: 'bg-[#1a9e5b]/25 text-[#5fce87]',
      edge: 'bg-[#1a9e5b]',
      glow: 'bg-[#1a9e5b]/35',
      rule: 'via-[#1a9e5b]/80',
      bar: 'bg-[#1f9d57]',
      barHover: 'group-hover:bg-[#5fce87]',
    },
    campaignNames: [
      'Search - Advogado Trabalhista BH',
      'Search - Calculo Rescisao',
      'PMax - Direitos Trabalhistas',
      'Search - Marca',
    ],
  },
};
