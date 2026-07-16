'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const LEGACY_STORAGE_KEY = 'cl-leads-contatados';
const REFRESH_MS = 30_000;

/**
 * Marca de "lead contatado", agora persistida no Supabase via /api/contacted:
 * o que for marcado num aparelho aparece nos outros. A interface atualiza na
 * hora (otimista) e o servidor confirma por tras; a cada 30s uma sincronizacao
 * traz marcas feitas em outros aparelhos.
 *
 * Marcas antigas do localStorage (da versao sem banco) sao migradas para o
 * servidor na primeira carga e o registro local e apagado.
 */
export function useContactedLeads() {
  const [contacted, setContacted] = useState<ReadonlySet<string>>(new Set());
  // Evita que uma sincronizacao antiga atropele uma marcacao otimista recente.
  const pendingWrites = useRef(0);

  const send = useCallback(async (payload: { mark?: string[]; unmark?: string[] }) => {
    pendingWrites.current += 1;
    try {
      await fetch('/api/contacted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      // Sem rede: a proxima sincronizacao reconcilia com o que o servidor tem.
    } finally {
      pendingWrites.current -= 1;
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/contacted', { cache: 'no-store' });
      if (!response.ok) return;
      const data = (await response.json()) as { ids?: string[] };
      // Se ha escrita em voo, descarta esta leitura: ela pode ser anterior a escrita.
      if (pendingWrites.current > 0) return;
      setContacted(new Set(data.ids ?? []));
    } catch {
      // silencioso: o estado otimista atual continua valendo
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Migracao unica das marcas locais da versao anterior.
      try {
        const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (raw) {
          const ids = (JSON.parse(raw) as string[]).filter((id) => typeof id === 'string');
          if (ids.length > 0) {
            setContacted((current) => new Set([...current, ...ids]));
            await send({ mark: ids });
          }
          localStorage.removeItem(LEGACY_STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
      if (!cancelled) await refresh();
    })();

    const interval = setInterval(() => void refresh(), REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [refresh, send]);

  const mark = useCallback(
    (id: string) => {
      setContacted((current) => {
        if (current.has(id)) return current;
        const next = new Set(current);
        next.add(id);
        return next;
      });
      void send({ mark: [id] });
    },
    [send],
  );

  const toggle = useCallback(
    (id: string) => {
      // Decide fora do updater: efeito dentro dele dispara em dobro no StrictMode.
      const isOn = contacted.has(id);
      setContacted((current) => {
        const next = new Set(current);
        if (isOn) next.delete(id);
        else next.add(id);
        return next;
      });
      void send(isOn ? { unmark: [id] } : { mark: [id] });
    },
    [contacted, send],
  );

  const markAll = useCallback(
    (ids: string[]) => {
      setContacted((current) => new Set([...current, ...ids]));
      void send({ mark: ids });
    },
    [send],
  );

  const unmarkAll = useCallback(
    (ids: string[]) => {
      setContacted((current) => {
        const next = new Set(current);
        for (const id of ids) next.delete(id);
        return next;
      });
      void send({ unmark: ids });
    },
    [send],
  );

  return { contacted, mark, toggle, markAll, unmarkAll };
}
