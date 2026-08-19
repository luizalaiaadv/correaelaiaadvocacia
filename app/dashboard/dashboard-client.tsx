'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import imgLogo from '@/public/logofooter.webp';
import { useSessionKeepAlive } from './use-session-keepalive';
import LeadsPanel from './leads-panel';

/**
 * Pagina standalone dos leads (/dashboard). E so a casca — fundo, logo e logout;
 * todo o conteudo (controles, filtro, visao geral, dados, notificacoes) vive em
 * <LeadsPanel/>, o mesmo componente reaproveitado na aba "Typebot" do /dash-ads.
 */
export default function DashboardClient() {
  const router = useRouter();
  // Desliza a sessao em atividade real; sem interacao por 30 min = deslogado.
  useSessionKeepAlive();

  async function handleLogout() {
    await fetch('/api/dashboard-auth', { method: 'DELETE' });
    router.replace('/dash-ads/login');
  }

  return (
    <div className="relative min-h-screen text-white">
      {/* Textura fixa: os paineis de vidro desfocam o que passa por tras deles. */}
      <div aria-hidden className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[url('/texture-bg.webp')] bg-cover bg-center" />
        {/* A foto e um horizonte: ceu claro em cima (lum ~155), mar azul embaixo.
            O veu e neutro (um marrom mataria o azul) e vertical como a imagem,
            mais denso no topo, onde ficam a logo e o titulo. */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#16101a]/85 via-[#121016]/70 to-[#0a0910]/85" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* A logo e um lockup completo (monograma + nome + "ADVOCACIA"). Abaixo
                de ~110px a terceira linha vira borrao ilegivel. */}
            <Image
              src={imgLogo}
              alt="Correa & Laia Advocacia"
              priority
              className="w-[104px] sm:w-[124px]"
              style={{ height: 'auto' }}
            />
            <div className="border-l border-white/15 pl-4">
              <p className="text-[11px] font-medium tracking-[0.2em] text-secondary uppercase">
                Dashboard em tempo real
              </p>
              <h1 className="mt-0.5 font-display text-2xl text-accent sm:text-3xl">Leads do Typebot</h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleLogout()}
            aria-label="Sair do dashboard"
            className="flex items-center rounded-lg border border-white/10 bg-white/5 p-2 text-white/60 transition hover:text-white"
          >
            <LogOut className="size-4" aria-hidden />
          </button>
        </header>

        <LeadsPanel />
      </div>
    </div>
  );
}
