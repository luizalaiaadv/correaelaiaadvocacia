'use client';

import { useEffect, useRef } from 'react';

// Renova a sessao no maximo uma vez a cada 5 min de atividade. Com o timeout de
// inatividade em 30 min, quem interage ao menos uma vez a cada 30 min continua
// logado; quem para, expira.
const THROTTLE_MS = 5 * 60 * 1000;

/**
 * Desliza a sessao em atividade REAL do usuario (clique/tecla/toque). O polling
 * automatico dos paineis nao passa por aqui, entao nao mantem a sessao viva —
 * e por isso que "inatividade" conta so a interacao de verdade.
 */
export function useSessionKeepAlive() {
  const lastTouch = useRef(0);

  useEffect(() => {
    function touch() {
      const now = Date.now();
      if (now - lastTouch.current < THROTTLE_MS) return;
      lastTouch.current = now;
      // Falha (ex.: sessao ja expirada) e ignorada: o proximo fetch de dados
      // recebe 401 e redireciona para o login.
      fetch('/api/dashboard-auth', { method: 'PATCH' }).catch(() => {});
    }

    const options = { passive: true } as const;
    window.addEventListener('pointerdown', touch, options);
    window.addEventListener('keydown', touch, options);
    return () => {
      window.removeEventListener('pointerdown', touch);
      window.removeEventListener('keydown', touch);
    };
  }, []);
}
