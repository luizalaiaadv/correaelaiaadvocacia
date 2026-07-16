'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Lock, LoaderCircle } from 'lucide-react';
import imgLogo from '@/public/logofooter.webp';

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/dashboard-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? 'Nao foi possivel entrar.');
        return;
      }

      router.replace('/dashboard');
      router.refresh();
    } catch {
      setError('Falha de conexao. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-panel w-full max-w-sm p-8"
    >
      <div className="mb-6 flex flex-col items-center text-center">
        <Image
          src={imgLogo}
          alt="Correa & Laia Advocacia"
          priority
          className="mb-4 w-[132px]"
          style={{ height: 'auto' }}
        />
        <h1 className="flex items-center gap-2 font-display text-xl text-accent">
          <Lock className="size-4 text-secondary" aria-hidden />
          Dashboard de Leads
        </h1>
      </div>

      <label htmlFor="password" className="mb-2 block text-xs font-medium tracking-wide text-white/60 uppercase">
        Senha de acesso
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        autoFocus
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className="glass-soft w-full px-4 py-3 text-white outline-none transition focus:border-secondary"
      />

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-3 font-medium text-white transition hover:bg-primary disabled:opacity-60"
      >
        {isSubmitting && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
        {isSubmitting ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}
