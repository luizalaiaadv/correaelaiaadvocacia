'use client';

import { useEffect } from 'react';

/**
 * Registra o service worker apenas nas telas do dashboard: e a parte do projeto
 * que faz sentido instalar como app. O site publico continua sem SW.
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('[pwa] falha ao registrar o service worker', error);
    });
  }, []);

  return null;
}
