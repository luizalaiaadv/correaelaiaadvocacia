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
    url: 'https://www.correaelaiaadvocacia.com',
    siteName: 'Correa & Laia Advocacia',
    locale: 'pt_BR',
    images: [
      {
        url: 'https://www.correaelaiaadvocacia.com/luizas.webp',
        width: 341,
        height: 512,
        alt: 'Dra. Luiza Laia e Dra. Luiza Corrêa - Correa & Laia Advocacia',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Correa & Laia Advocacia | Advocacia Trabalhista em BH',
    description:
      'Especialistas em Direito do Trabalho em Belo Horizonte. Defesa técnica e humanizada dos direitos do trabalhador.',
    images: ['https://www.correaelaiaadvocacia.com/luizas.webp'],
  },
  alternates: {
    canonical: 'https://www.correaelaiaadvocacia.com',
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
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://typebot.io" />
        <link rel="dns-prefetch" href="https://typebot.io" />
        <link rel="preconnect" href="https://lh3.googleusercontent.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://lh3.googleusercontent.com" />

        {/* Schema JSON-LD: LocalBusiness + LegalService */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': ['LegalService', 'LocalBusiness'],
              name: 'Correa & Laia Advocacia',
              description:
                'Escritório de advocacia trabalhista em Belo Horizonte especializado em defender os direitos de trabalhadores em MG.',
              url: 'https://www.correaelaiaadvocacia.com',
              image: 'https://www.correaelaiaadvocacia.com/luizas.webp',
              logo: 'https://www.correaelaiaadvocacia.com/logo.webp',
              telephone: '+55-31-99947-1983',
              email: 'contato@correalaiadvocacia.com.br',
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'Rua dos Timbiras, 1940',
                addressLocality: 'Belo Horizonte',
                addressRegion: 'MG',
                postalCode: '30140-069',
                addressCountry: 'BR',
                neighborhood: 'Lourdes',
              },
              geo: {
                '@type': 'GeoCoordinates',
                latitude: -19.9260475,
                longitude: -43.941071,
              },
              openingHoursSpecification: {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: [
                  'Segunda-feira',
                  'Terça-feira',
                  'Quarta-feira',
                  'Quinta-feira',
                  'Sexta-feira',
                ],
                opens: '09:00',
                closes: '18:00',
              },
              priceRange: '$$',
              areaServed: {
                '@type': 'State',
                name: 'Minas Gerais',
              },
              sameAs: [
                'https://www.instagram.com/correaelaia.advocacia',
                'https://www.facebook.com/profile.php?id=61568707289617',
                'https://www.linkedin.com/company/correa-laia-advocacia',
              ],
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '5.0',
                bestRating: '5',
                worstRating: '1',
                ratingCount: '3',
              },
              hasOfferCatalog: {
                '@type': 'OfferCatalog',
                name: 'Serviços Jurídicos Trabalhistas',
                itemListElement: [
                  {
                    '@type': 'Offer',
                    itemOffered: {
                      '@type': 'Service',
                      name: 'Pejotização / Vínculo Empregatício',
                    },
                  },
                  {
                    '@type': 'Offer',
                    itemOffered: {
                      '@type': 'Service',
                      name: 'Cálculo de Verbas Rescisórias',
                    },
                  },
                  {
                    '@type': 'Offer',
                    itemOffered: {
                      '@type': 'Service',
                      name: 'Rescisão Indireta',
                    },
                  },
                  {
                    '@type': 'Offer',
                    itemOffered: {
                      '@type': 'Service',
                      name: 'Assédio Moral e Sexual',
                    },
                  },
                  {
                    '@type': 'Offer',
                    itemOffered: {
                      '@type': 'Service',
                      name: 'Horas Extras Não Pagas',
                    },
                  },
                  {
                    '@type': 'Offer',
                    itemOffered: {
                      '@type': 'Service',
                      name: 'Acidente de Trabalho',
                    },
                  },
                ],
              },
            }),
          }}
        />

        {/* Schema JSON-LD: Attorneys */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                '@context': 'https://schema.org',
                '@type': 'Attorney',
                name: 'Dra. Luiza Laia',
                jobTitle: 'Advogada Trabalhista',
                description:
                  'Graduada em Direito pela PUC Minas em 2020. Pós-Graduada em Direito Processual Trabalhista pela ESA/OAB.',
                worksFor: {
                  '@type': 'LegalService',
                  name: 'Correa & Laia Advocacia',
                  url: 'https://www.correaelaiaadvocacia.com',
                },
                address: {
                  '@type': 'PostalAddress',
                  streetAddress: 'Rua dos Timbiras, 1940',
                  addressLocality: 'Belo Horizonte',
                  addressRegion: 'MG',
                  postalCode: '30140-069',
                  addressCountry: 'BR',
                },
              },
              {
                '@context': 'https://schema.org',
                '@type': 'Attorney',
                name: 'Dra. Luiza Corrêa',
                jobTitle: 'Advogada',
                description:
                  'Graduada em Direito pela Universidade Salgado de Oliveira em 2013. Pós-Graduanda em Holding e Proteção Patrimônio.',
                worksFor: {
                  '@type': 'LegalService',
                  name: 'Correa & Laia Advocacia',
                  url: 'https://www.correaelaiaadvocacia.com',
                },
                address: {
                  '@type': 'PostalAddress',
                  streetAddress: 'Rua dos Timbiras, 1940',
                  addressLocality: 'Belo Horizonte',
                  addressRegion: 'MG',
                  postalCode: '30140-069',
                  addressCountry: 'BR',
                },
              },
            ]),
          }}
        />

        {/* Schema JSON-LD: FAQPage */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'Quais documentos preciso para uma consulta trabalhista?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Geralmente solicitamos a Carteira de Trabalho (física ou digital), Termo de Rescisão (se houver), contracheques dos últimos meses e extrato do FGTS.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Quanto tempo demora um processo trabalhista?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'O tempo varia conforme a complexidade do caso e a comarca. Em média, processos podem levar de 6 meses a 2 anos, mas muitos casos são resolvidos via acordo em menos tempo.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Preciso pagar algo para iniciar o processo?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Trabalhamos com o modelo de honorários ad exitum na maioria dos casos, ou seja, você só paga uma porcentagem ao final do processo, quando receber seus direitos.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Fui demitido e não recebi nada, o que fazer?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Isso é uma irregularidade grave. Você deve procurar um advogado imediatamente para ingressar com uma ação de cobrança de verbas rescisórias e multas previstas em lei.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Posso processar a empresa ainda trabalhando nela?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Sim, é possível. No entanto, analisamos cada caso estrategicamente para evitar retaliações ou situações insustentáveis no ambiente de trabalho.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'O que é rescisão indireta?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'É a "justa causa" aplicada pelo empregado ao empregador quando este descumpre obrigações contratuais graves, permitindo que o trabalhador saia com todos os seus direitos.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Como funciona o cálculo das horas extras?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'As horas extras devem ser pagas com um adicional de no mínimo 50% sobre o valor da hora normal. Se realizadas em domingos ou feriados, o adicional costuma ser de 100%.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'O que caracteriza o assédio moral no trabalho?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Caracteriza-se pela exposição do trabalhador a situações humilhantes e constrangedoras, repetitivas e prolongadas, durante a jornada de trabalho e no exercício de suas funções.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Tenho direito a indenização por acidente de trabalho?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Sim, caso fique comprovada a culpa ou negligência da empresa, o trabalhador tem direito a indenizações por danos morais, estéticos e materiais (como despesas médicas e pensão).',
                  },
                },
              ],
            }),
          }}
        />

        {/* Schema JSON-LD: Reviews */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'LegalService',
              name: 'Correa & Laia Advocacia',
              review: [
                {
                  '@type': 'Review',
                  author: { '@type': 'Person', name: 'Pamela Santos' },
                  reviewRating: {
                    '@type': 'Rating',
                    ratingValue: '5',
                    bestRating: '5',
                  },
                  reviewBody:
                    'Excelente profissionais, atenciosas e cuidadosas. Cuidaram do meu processo do início ao fim. Me senti super amparada e segura.',
                },
                {
                  '@type': 'Review',
                  author: { '@type': 'Person', name: 'Iza Cristina' },
                  reviewRating: {
                    '@type': 'Rating',
                    ratingValue: '5',
                    bestRating: '5',
                  },
                  reviewBody:
                    'Excelentes profissionais, atendimento ágil... Ajudaram demais a empresa onde trabalho, super indico!',
                },
                {
                  '@type': 'Review',
                  author: { '@type': 'Person', name: 'Thauana Santos' },
                  reviewRating: {
                    '@type': 'Rating',
                    ratingValue: '5',
                    bestRating: '5',
                  },
                  reviewBody:
                    'Super atenciosa, educada, dá retorno rápido e me explicou tudo que precisava, bem simples e prático.',
                },
              ],
            }),
          }}
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
