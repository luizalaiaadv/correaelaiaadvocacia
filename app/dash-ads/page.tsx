import type { Metadata } from 'next';
import AdsDashboard from '../_ads/ads-dashboard';

export const metadata: Metadata = {
  title: 'Anuncios | Correa & Laia Advocacia',
  robots: { index: false, follow: false },
};

export default function DashAdsPage() {
  return <AdsDashboard />;
}
