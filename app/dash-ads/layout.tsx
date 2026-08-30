import type { Metadata, Viewport } from 'next';
import ServiceWorkerRegistration from '../dashboard/sw-registration';

/**
 * Metadados de instalacao (PWA) do painel. Ficam aqui porque /dash-ads e a tela
 * principal — e a que a cliente instala no celular. O `manifest` cobre Android;
 * `appleWebApp` + `icons.apple` cobrem o iPhone/iPad, que ignoram o manifest
 * para icone e modo tela cheia e leem essas meta tags.
 */
export const metadata: Metadata = {
  title: 'Painel | Correa & Laia Advocacia',
  robots: { index: false, follow: false },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'C&L Painel',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    apple: '/apple-touch-icon.png',
  },
  other: {
    // O Next 16 emite so a tag moderna `mobile-web-app-capable`, que o Safari so
    // entende a partir do iOS 16.4. Esta versao legada mantem a abertura em tela
    // cheia nos iPhones/iPads mais antigos.
    'apple-mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: '#78362d',
  // Ocupa a area sob o notch quando aberto como app (iOS).
  viewportFit: 'cover',
};

export default function DashAdsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ServiceWorkerRegistration />
    </>
  );
}
