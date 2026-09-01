import type { NextConfig } from 'next';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

/**
 * Versao do projeto, montada no BUILD e injetada no bundle. A parte semantica vem
 * do package.json (sobe com `npm run version:patch`); o hash do commit muda
 * sozinho a cada alteracao publicada, entao da para saber exatamente o que esta
 * no ar sem depender de ninguem lembrar de atualizar um numero.
 */
function appVersion(): { version: string; commit: string; builtAt: string } {
  const { version } = JSON.parse(readFileSync('./package.json', 'utf8')) as { version: string };

  // Na Vercel o hash vem por variavel; localmente perguntamos ao proprio git.
  let commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? '';
  if (!commit) {
    try {
      commit = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .trim();
    } catch {
      commit = 'local'; // sem git (ex.: copia do codigo sem historico)
    }
  }

  // Data ja formatada aqui: virando texto fixo no build, o servidor e o cliente
  // renderizam a mesma coisa (nada de erro de hidratacao).
  const builtAt = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());

  return { version, commit, builtAt };
}

const { version, commit, builtAt } = appVersion();

const config: NextConfig = {
  turbopack: {},
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
    NEXT_PUBLIC_APP_COMMIT: commit,
    NEXT_PUBLIC_APP_BUILT_AT: builtAt,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 85],
    minimumCacheTTL: 31536000,
  },
  experimental: {
    optimizePackageImports: ['motion', 'lucide-react', '@typebot.io/react'],
    optimizeCss: true,
  },
  async redirects() {
    return [
      // A raiz passa a levar ao painel. Os anuncios vao para o Instagram/Facebook
      // e para o link proprio do Typebot, entao a landing nao e mais o destino
      // do trafego. Redirect temporario (307) — reversivel se um dia a landing
      // publica voltar a ser necessaria.
      { source: '/', destination: '/dash-ads', permanent: false },
      // Rotas antigas -> painel unico, para links/marcadores existentes.
      { source: '/dash-meta', destination: '/dash-ads', permanent: false },
      { source: '/dash-google', destination: '/dash-ads', permanent: false },
      { source: '/dashboard/login', destination: '/dash-ads/login', permanent: false },
    ];
  },
};

export default config;
