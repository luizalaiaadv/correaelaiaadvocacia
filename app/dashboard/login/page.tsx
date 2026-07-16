import type { Metadata } from 'next';
import LoginForm from './login-form';

export const metadata: Metadata = {
  title: 'Acesso restrito | Correa & Laia Advocacia',
  robots: { index: false, follow: false },
};

export default function DashboardLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f1020] px-4 py-12">
      <LoginForm />
    </main>
  );
}
