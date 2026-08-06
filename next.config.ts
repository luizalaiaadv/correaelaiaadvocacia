import type { NextConfig } from 'next';

const config: NextConfig = {
  turbopack: {},
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
