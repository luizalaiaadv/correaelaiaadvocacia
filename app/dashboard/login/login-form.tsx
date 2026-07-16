'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Lock, LoaderCircle } from 'lucide-react';

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
      className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#171833] p-8 shadow-2xl"
    >
      <div className="mb-6 flex flex-col items-center text-center">
        <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-secondary/20 text-secondary">
          <Lock className="size-5" aria-hidden />
        </span>
        <h1 className="font-display text-xl text-accent">Dashboard de Leads</h1>
        <p className="mt-1 text-sm text-white/50">Correa &amp; Laia Advocacia</p>
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
        className="w-full rounded-lg border border-white/10 bg-[#0f1020] px-4 py-3 text-white outline-none transition focus:border-secondary"
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
