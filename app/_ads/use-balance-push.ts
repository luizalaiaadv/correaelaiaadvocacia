'use client';

import { useCallback, useEffect, useState } from 'react';

/** base64url (formato da chave VAPID) -> Uint8Array, que o navegador exige. */
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export type PushState = 'indisponivel' | 'desligado' | 'ligado' | 'bloqueado' | 'ativando';

/**
 * Aviso de saldo no celular (Web Push). Precisa do service worker ja registrado.
 *
 * No iPhone/iPad so funciona com o painel INSTALADO na tela de inicio (iOS 16.4+)
 * — no Safari em aba o navegador nem oferece a permissao. No Android funciona
 * tanto instalado quanto no Chrome.
 */
export function useBalancePush() {
  const [state, setState] = useState<PushState>('indisponivel');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    if (!supported || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      setState('indisponivel');
      return;
    }
    if (Notification.permission === 'denied') {
      setState('bloqueado');
      return;
    }
    // Ja inscrito neste aparelho?
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setState(sub ? 'ligado' : 'desligado'))
      .catch(() => setState('desligado'));
  }, []);

  /** Precisa ser chamado a partir de um toque/clique — exigencia do navegador. */
  const enable = useCallback(async () => {
    const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!key) return;
    setState('ativando');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'bloqueado' : 'desligado');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
        }));

      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });
      setState(response.ok ? 'ligado' : 'desligado');
    } catch {
      setState('desligado');
    }
  }, []);

  return { state, enable };
}
