'use client';

import { useEffect } from 'react';

import { APP_BUILD_ID } from '@/lib/app-version';

/**
 * Registra o service worker nas telas do painel (/dash-ads e /dashboard): e a parte
 * do projeto que faz sentido instalar como app. O site publico continua sem SW.
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    // O `?v=` amarra o cache do app instalado a esta versao: a cada deploy o
    // navegador ve um script novo, instala e limpa o cache antigo sozinho.
    navigator.serviceWorker.register(`/sw.js?v=${APP_BUILD_ID}`).catch((error) => {
      console.warn('[pwa] falha ao registrar o service worker', error);
    });
  }, []);

  return null;
}
