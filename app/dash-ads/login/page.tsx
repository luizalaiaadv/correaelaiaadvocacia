import type { Metadata } from 'next';
import LoginForm from './login-form';

export const metadata: Metadata = {
  title: 'Acesso restrito | Correa & Laia Advocacia',
  robots: { index: false, follow: false },
};

export default function DashAdsLoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <div aria-hidden className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[url('/texture-bg.webp')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#16101a]/85 via-[#121016]/70 to-[#0a0910]/85" />
      </div>
      <LoginForm />
    </main>
  );
}
