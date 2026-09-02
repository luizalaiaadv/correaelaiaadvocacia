'use client';

import { useState } from 'react';
import { Bell, BellRing, Wallet, X } from 'lucide-react';
import type { AdsBalance } from '@/lib/meta-ads';
import { cn } from '@/lib/utils';
import { formatBRL } from './ads-utils';
import { LOW_BALANCE_BRL } from './config';
import { useBalancePush } from './use-balance-push';

/**
 * Aviso de saldo da conta como pop-up no canto inferior direito. Ao fechar, ele
 * nao some: encolhe numa bolinha (do mesmo canto) que reabre com um clique —
 * assim o saldo continua a um toque de distancia sem ocupar a tela.
 *
 * Regra de cor (igual para Meta e Google): >= LOW_BALANCE_BRL fica verde ("ok");
 * abaixo disso fica vermelho e a bolinha pisca, avisando que precisa recarregar.
 */
export default function BalanceAlert({ balance }: { balance: AdsBalance }) {
  const [open, setOpen] = useState(true);
  const low = balance.remaining < LOW_BALANCE_BRL;
  const push = useBalancePush();

  // Bolinha minimizada: media (44px), pisca so quando o saldo esta baixo.
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Saldo da conta: ${formatBRL(balance.remaining)}${low ? ' — saldo baixo' : ''}. Abrir detalhes.`}
        title={`Saldo: ${formatBRL(balance.remaining)}`}
        className={cn(
          'fixed right-4 bottom-4 z-50 flex size-11 items-center justify-center rounded-full border shadow-lg transition sm:right-6 sm:bottom-6',
          low
            ? 'border-red-400/50 bg-red-500/25 text-red-200 hover:bg-red-500/35'
            : 'border-emerald-400/50 bg-emerald-500/25 text-emerald-200 hover:bg-emerald-500/35',
        )}
      >
        {/* O anel que pulsa e so decorativo; o ponto solido garante contraste. */}
        {low && (
          <span
            aria-hidden
            className="absolute inline-flex size-11 animate-ping rounded-full bg-red-500/40"
          />
        )}
        <span
          aria-hidden
          className={cn(
            'relative size-3 rounded-full',
            low ? 'bg-red-400' : 'bg-emerald-400',
          )}
        />
      </button>
    );
  }

  return (
    <div
      role="status"
      className={cn(
        'glass-panel animate-modal-in fixed right-4 bottom-4 z-50 w-[min(20rem,calc(100vw-2rem))] border p-4 shadow-xl sm:right-6 sm:bottom-6',
        low ? 'border-red-500/40' : 'border-emerald-500/40',
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full',
            low ? 'bg-red-500/25 text-red-200' : 'bg-emerald-500/25 text-emerald-200',
          )}
        >
          <Wallet className="size-4" aria-hidden />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold tracking-[0.15em] text-white/45 uppercase">
            Saldo da conta
          </p>
          <p
            className={cn(
              'mt-1 font-display text-2xl leading-none',
              low ? 'text-red-200' : 'text-emerald-200',
            )}
          >
            {formatBRL(balance.remaining)}
          </p>
          {balance.label && (
            <p className="mt-1 text-[11px] text-white/40">{balance.label}</p>
          )}
          <p className={cn('mt-2 text-xs leading-snug', low ? 'text-red-200' : 'text-emerald-200/90')}>
            {low
              ? `Saldo baixo — abaixo de ${formatBRL(LOW_BALANCE_BRL)}. Recarregue para os anúncios não pararem.`
              : `Saldo ok — acima de ${formatBRL(LOW_BALANCE_BRL)}.`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Minimizar aviso de saldo"
          className="shrink-0 text-white/40 transition hover:text-white"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      {/* Aviso no celular. A permissao SO pode ser pedida a partir de um toque,
          por isso e um botao — nao da para ativar sozinho ao abrir a tela. */}
      {push.state !== 'indisponivel' && (
        <div className="mt-3 border-t border-white/10 pt-3">
          {push.state === 'ligado' ? (
            <p className="flex items-center gap-2 text-[11px] text-emerald-200/80">
              <BellRing className="size-3.5 shrink-0" aria-hidden />
              Avisos de saldo ligados neste aparelho.
            </p>
          ) : push.state === 'bloqueado' ? (
            <p className="text-[11px] leading-snug text-white/45">
              As notificações estão bloqueadas para este site. Libere nas configurações do
              navegador para receber o aviso de saldo.
            </p>
          ) : (
            <button
              type="button"
              onClick={() => void push.enable()}
              disabled={push.state === 'ativando'}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white/70 transition hover:text-white disabled:opacity-50"
            >
              <Bell className="size-3.5" aria-hidden />
              {push.state === 'ativando' ? 'Ativando…' : 'Avisar no celular'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
