import type { Metadata } from 'next';
import DashboardClient from './dashboard-client';

export const metadata: Metadata = {
  title: 'Leads em tempo real | Correa & Laia Advocacia',
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return <DashboardClient />;
}
