import './globals.css';
import { Inter } from 'next/font/google';
import { Metadata } from 'next';
import ClientLayout from '@/components/layout/ClientLayout';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://centralgsm.com.br'),
  title: {
    default: 'CENTRAL GSM | Aluguel de UnlockTool, Box Digital e Ferramentas GSM 24h',
    template: '%s | Central GSM'
  },
  description: 'Plataforma oficial de aluguel de ferramentas GSM e Box virtuais no Brasil. Acesso imediato à UnlockTool (6h, 12h, 24h), Chimera Tool, Android Multi Tool (AMT), TSM Tool e DFT Pro. Ativação automática via Pix.',
  keywords: [
    // Ferramentas principais
    'UnlockTool', 'aluguel UnlockTool', 'UnlockTool 24h', 'UnlockTool comprar horas',
    'Chimera Tool', 'aluguel Chimera Tool', 'Chimera Pro',
    'Android Multi Tool', 'AMT aluguel', 'AMT Tool',
    'TSM Tool', 'TSM Tool server', 'aluguel TSM Tool',
    'DFT Tool Pro', 'DFT Tool', 'KG Pro Tool', 'Samsung Tool',
    // Serviços e intenção de busca (SEO / Planejador de Palavras-chave)
    'aluguel de box digital', 'aluguel de ferramentas gsm', 'desbloqueio xiaomi mi cloud',
    'remover conta google frp', 'desbloqueio mdm payjoy samsung', 'remover conta google samsung',
    'assistência técnica celular ferramentas', 'box virtual gsm', 'licenças de software gsm',
    'créditos gsm brasil', 'servidor de desbloqueio', 'desbloqueio remoto celular',
    'Central GSM', 'Jackson e Israel GSM'
  ],
  authors: [{ name: 'Central GSM - Israel & Jackson' }],
  creator: 'Central GSM',
  publisher: 'Central GSM',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://centralgsm.com.br',
  },
  openGraph: {
    title: 'CENTRAL GSM | Aluguel de UnlockTool, Box Digital e Ferramentas GSM',
    description: 'Acesso imediato às melhores ferramentas de assistência técnica no Brasil: UnlockTool, Chimera, AMT, TSM. Ativação automática instantânea via Pix.',
    url: 'https://centralgsm.com.br',
    siteName: 'Central GSM',
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CENTRAL GSM | Aluguel de Ferramentas GSM e Unlock',
    description: 'Aluguel temporário de UnlockTool, Chimera e ferramentas para técnicos no Brasil.',
  },
  other: {
    // GEO Tags para posicionamento no Brasil (São Paulo / Nacional)
    'geo.region': 'BR-SP',
    'geo.placename': 'São Paulo, Brasil',
    'geo.position': '-23.55052;-46.633308',
    'ICBM': '-23.55052, -46.633308',
    'language': 'Portuguese',
    'coverage': 'Brasil',
    'distribution': 'Global',
    'rating': 'General',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  // Schema.org Structured Data (JSON-LD) para exibição rica no Google
  const schemaOrganization = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Central GSM',
    alternateName: 'Jackson & Israel GSM',
    url: 'https://centralgsm.com.br',
    description: 'Plataforma especializada em aluguel temporário de licenças de software e ferramentas GSM para assistência técnica.',
    telephone: '+5511966959666',
    priceRange: 'R$ 7,99 - R$ 199,99',
    currenciesAccepted: 'BRL',
    paymentAccepted: 'Pix, Cartão de Crédito',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'BR',
      addressRegion: 'SP',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Brasil',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '1420',
      bestRating: '5',
      worstRating: '1',
    },
    sameAs: [
      'https://wa.me/5511966959666',
      'https://chat.whatsapp.com/DELs1QYHUQAK83NpJwAjTD'
    ],
  };

  return (
    <html lang="pt-BR" className="dark">
      <head>
        {/* Schema.org Dados Estruturados para o Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrganization) }}
        />
      </head>
      <body className={`${inter.className} min-h-screen bg-[#0f172a]`}>
        {/* Google Tag Manager / Google Ads */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=AW-18049987745"
        />
        {gaId && (
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
          />
        )}
        <Script
          id="google-tracking"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());

              // Google Ads
              gtag('config', 'AW-18049987745');
              ${gaId ? `gtag('config', '${gaId}');` : ''}
            `,
          }}
        />
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
