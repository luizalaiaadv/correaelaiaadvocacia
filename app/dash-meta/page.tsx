import type { Metadata } from 'next';
import AdsDashboard from '../_ads/ads-dashboard';

export const metadata: Metadata = {
  title: 'Meta Ads | Correa & Laia Advocacia',
  robots: { index: false, follow: false },
};

export default function DashMetaPage() {
  return <AdsDashboard platform="meta" />;
}
