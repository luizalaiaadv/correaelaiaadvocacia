'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { Check, MessageCircle, X } from 'lucide-react';
import type { Lead } from '@/lib/typebot';
import { cn } from '@/lib/utils';
import { formatDateTime, whatsappLink } from './lead-utils';

/**
 * Textarea somente leitura que cresce conforme o conteudo. A resposta vem do
 * Typebot em texto livre: pode ser uma palavra ou um paragrafo inteiro.
 */
function AutoResizeTextarea({ value }: { value: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // useLayoutEffect evita o "pulo" de uma linha para N no primeiro paint.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    // Com box-sizing: border-box a altura inclui as bordas, mas scrollHeight nao.
    // Sem somar a borda, a ultima linha fica cortada por alguns pixels.
    const borderY = el.offsetHeight - el.clientHeight;
    el.style.height = `${el.scrollHeight + borderY}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      readOnly
      rows={1}
      value={value}
      className="glass-soft w-full resize-none overflow-hidden px-3 py-2 text-sm text-white/90 outline-none focus:border-secondary/50"
    />
  );
}

function Field({
  label,
  value,
  href,
  onLinkClick,
}: {
  label: string;
  value: string | null;
  href?: string | null;
  onLinkClick?: () => void;
}) {
  const text = value?.trim();

  return (
    <div>
      <dt className="mb-1.5 text-[10px] font-semibold tracking-[0.15em] text-secondary uppercase">{label}</dt>
      <dd>
        {!text ? (
          <span className="glass-soft inline-block px-3 py-2 text-sm text-white/30">--</span>
        ) : href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onLinkClick}
            className="glass-soft inline-flex max-w-full items-center gap-1.5 px-3 py-2 text-sm break-all text-emerald-300 transition hover:border-emerald-400/40 hover:text-emerald-200"
          >
            <MessageCircle className="size-3.5 shrink-0" aria-hidden />
            {text}
          </a>
        ) : (
          // inline-block faz a caixa acompanhar o tamanho do conteudo.
          <span className="glass-soft inline-block max-w-full px-3 py-2 text-sm break-words text-white/90">
            {text}
          </span>
        )}
      </dd>
    </div>
  );
}

export default function LeadDetailsModal({
  lead,
  onClose,
  isContacted,
  onToggleContacted,
  onWhatsappClick,
}: {
  lead: Lead;
  onClose: () => void;
  isContacted: boolean;
  onToggleContacted: () => void;
  onWhatsappClick: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', onKeyDown);
    // Trava o scroll do fundo enquanto o modal esta aberto.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  const message = lead.message?.trim();

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-modal-title"
        onClick={(event) => event.stopPropagation()}
        className="glass-panel animate-modal-in my-auto w-full max-w-lg p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id="lead-modal-title" className="truncate font-display text-xl text-accent">
              {lead.name?.trim() || 'Lead sem nome'}
            </h2>
            <p className="mt-0.5 text-[11px] tracking-wide text-white/40 uppercase">Dados completos do lead</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={isContacted}
              onClick={onToggleContacted}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition',
                isContacted
                  ? 'border-emerald-400/50 bg-emerald-500/25 text-emerald-200'
                  : 'border-white/20 bg-white/5 text-white/50 hover:text-white',
              )}
            >
              <Check className="size-3" aria-hidden />
              {isContacted ? 'Contatado' : 'Marcar contatado'}
            </button>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Fechar detalhes"
              className="glass-soft p-2 text-white/60 transition hover:text-white"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        </div>

        <dl className="space-y-4">
          <Field label="Data" value={formatDateTime(lead.createdAt)} />
          <Field label="Nome" value={lead.name} />
          <Field
            label="Whatsapp"
            value={lead.whatsapp}
            href={whatsappLink(lead.whatsapp)}
            onLinkClick={onWhatsappClick}
          />

          <div>
            <dt className="mb-1.5 text-[10px] font-semibold tracking-[0.15em] text-secondary uppercase">Resposta</dt>
            <dd>
              {message ? (
                <AutoResizeTextarea value={message} />
              ) : (
                <span className="glass-soft inline-block px-3 py-2 text-sm text-white/30">--</span>
              )}
            </dd>
          </div>

          <Field label="UTM Source" value={lead.utmSource} />
          <Field label="UTM Medium" value={lead.utmMedium} />
          <Field label="UTM Campaign" value={lead.utmCampaign} />
          <Field label="UTM Content" value={lead.utmContent} />
        </dl>
      </div>
    </div>
  );
}
