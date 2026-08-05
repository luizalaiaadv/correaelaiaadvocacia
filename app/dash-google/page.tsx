import type { Metadata } from 'next';
import AdsDashboard from '../_ads/ads-dashboard';

export const metadata: Metadata = {
  title: 'Google Ads | Correa & Laia Advocacia',
  robots: { index: false, follow: false },
};

export default function DashGooglePage() {
  return <AdsDashboard platform="google" />;
}
