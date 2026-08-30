'use client';

import { useEffect, useState } from 'react';

/**
 * Relogio do CLIENTE: `null` no primeiro render, `Date.now()` depois de montar.
 *
 * Por que nao usar `Date.now()` direto: as paginas do painel sao pre-renderizadas
 * (HTML gerado no build), entao um `Date.now()` no corpo do componente congela a
 * data do build no HTML enquanto o navegador calcula a data de hoje — os dois nao
 * batem e o React acusa erro de hidratacao. Comecando em `null`, servidor e
 * cliente renderizam a mesma coisa; as datas entram logo apos a montagem.
 *
 * `refreshMs` mantem o valor atualizado (ex.: rotulos "ha 3 min").
 */
export function useClientNow(refreshMs?: number): number | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    if (!refreshMs) return;
    const interval = setInterval(() => setNow(Date.now()), refreshMs);
    return () => clearInterval(interval);
  }, [refreshMs]);

  return now;
}
