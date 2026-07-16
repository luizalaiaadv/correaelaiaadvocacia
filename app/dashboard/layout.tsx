import type { Metadata, Viewport } from 'next';
import ServiceWorkerRegistration from './sw-registration';

export const metadata: Metadata = {
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'C&L Leads',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#78362d',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ServiceWorkerRegistration />
    </>
  );
}
