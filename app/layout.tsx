import type { Metadata } from 'next';
import { Cinzel, Montserrat } from 'next/font/google';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cinzel',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Correa & Laia Advocacia | Advocacia Trabalhista em BH',
  description:
    'Especialistas em Direito do Trabalho em Belo Horizonte. Defesa técnica e humanizada dos direitos do trabalhador. Agende sua consulta com Correa & Laia Advocacia.',
  keywords: [
    'Advocacia Trabalhista',
    'Belo Horizonte',
    'BH',
    'Advogado Trabalhista',
    'Direitos do Trabalhador',
    'Correa & Laia Advocacia',
    'Luiza Laia',
    'Luiza Correa',
    'Verbas Rescisórias',
    'FGTS',
    'Horas Extras',
  ],
  authors: [{ name: 'Correa & Laia Advocacia' }],
  openGraph: {
    type: 'website',
    title: 'Correa & Laia Advocacia | Advocacia Trabalhista em BH',
    description:
      'Especialistas em Direito do Trabalho em Belo Horizonte. Defesa técnica e humanizada dos direitos do trabalhador.',
    images: [
      'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=1200',
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Correa & Laia Advocacia | Advocacia Trabalhista em BH',
    description:
      'Especialistas em Direito do Trabalho em Belo Horizonte. Defesa técnica e humanizada dos direitos do trabalhador.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${cinzel.variable} ${montserrat.variable}`}>
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://typebot.io" />
        <link
          rel="preconnect"
          href="https://lh3.googleusercontent.com"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-KFXXZS4M"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {children}
        <Analytics />
        <Script
          id="gtm"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-KFXXZS4M');`,
          }}
        />
      </body>
    </html>
  );
}
