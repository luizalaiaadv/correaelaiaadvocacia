'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Lead } from '@/lib/typebot';

export type Toast = { id: string; name: string; source: string };

const TOAST_TTL_MS = 9000;

/** Ping curto gerado no proprio browser, evita depender de um arquivo de audio. */
function playPing() {
  try {
    const AudioCtx =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const context = new AudioCtx();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, context.currentTime);
    oscillator.frequency.setValueAtTime(1320, context.currentTime + 0.12);
    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.45);

    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.45);
    oscillator.onended = () => void context.close();
  } catch {
    // Audio bloqueado pelo browser: a notificacao visual ainda acontece.
  }
}

export function useLeadNotifications(leads: Lead[] | null, enabled: boolean) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  /** null enquanto o primeiro fetch nao chegou: evita notificar o historico inteiro. */
  const seenIds = useRef<Set<string> | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  useEffect(() => {
    if (!leads) return;

    if (seenIds.current === null) {
      seenIds.current = new Set(leads.map((lead) => lead.id));
      return;
    }

    const fresh = leads.filter((lead) => !seenIds.current?.has(lead.id));
    if (fresh.length === 0) return;

    for (const lead of fresh) seenIds.current.add(lead.id);
    if (!enabled) return;

    const incoming: Toast[] = fresh.map((lead) => ({
      id: lead.id,
      name: lead.name?.trim() || 'Lead sem nome',
      source: lead.utmSource?.trim() || 'direto',
    }));

    setToasts((current) => [...incoming, ...current].slice(0, 4));
    playPing();

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      for (const toast of incoming) {
        new Notification('Novo lead recebido', {
          body: `${toast.name} - origem: ${toast.source}`,
          tag: toast.id,
          icon: '/logo.webp',
        });
      }
    }

    for (const toast of incoming) {
      timers.current.push(setTimeout(() => dismiss(toast.id), TOAST_TTL_MS));
    }
  }, [leads, enabled, dismiss]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending) clearTimeout(timer);
    };
  }, []);

  return { toasts, dismiss };
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  return (await Notification.requestPermission()) === 'granted';
}
