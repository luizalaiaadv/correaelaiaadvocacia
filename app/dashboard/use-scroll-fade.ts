'use client';

import { useCallback, useEffect, useRef } from 'react';

/** Profundidade maxima do fade, em px. Casa com o respiro das tabs. */
const FADE_SIZE = 32;

/**
 * Alimenta as variaveis lidas pela mask de .scroll-fade-x conforme a rolagem.
 *
 * A versao do shadcn faz o mesmo so com CSS (animation-timeline: scroll()), que
 * e mais elegante e dispensa listener. Optamos pelo hook porque scroll-driven
 * animations ainda dependem de navegador recente — em Safari/iOS antigo o painel
 * cairia num fade estatico nas duas bordas, que e justamente o oposto da pista
 * que queremos dar. Aqui o fade e proporcional a rolagem e igual em todo lugar.
 */
export function useScrollFade<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    const max = el.scrollWidth - el.clientWidth;

    // Conteudo cabe na largura: sem rolagem, sem fade.
    if (max <= 1) {
      el.style.setProperty('--scroll-fade-start', '0px');
      el.style.setProperty('--scroll-fade-end', '0px');
      return;
    }

    const start = Math.min(el.scrollLeft, FADE_SIZE);
    const end = Math.min(max - el.scrollLeft, FADE_SIZE);
    el.style.setProperty('--scroll-fade-start', `${Math.max(0, start)}px`);
    el.style.setProperty('--scroll-fade-end', `${Math.max(0, end)}px`);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    update();
    el.addEventListener('scroll', update, { passive: true });

    // Recalcula quando a largura muda (rotacao do celular, troca de periodo).
    const observer = new ResizeObserver(update);
    observer.observe(el);
    for (const child of Array.from(el.children)) observer.observe(child);

    return () => {
      el.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, [update]);

  return ref;
}
