/**
 * Versao do que esta no ar. Os valores sao injetados no build pelo next.config.ts
 * (`env`), entao sao constantes — iguais no servidor e no cliente, sem risco de
 * erro de hidratacao.
 *
 * - `APP_VERSION`: semantica, do package.json (sobe com `npm run version:patch`).
 * - `APP_COMMIT`: hash curto do commit publicado — muda a CADA alteracao.
 * - `APP_BUILT_AT`: quando o build foi feito, ja formatado em pt-BR.
 */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.0.0';
export const APP_COMMIT = process.env.NEXT_PUBLIC_APP_COMMIT ?? 'local';
export const APP_BUILT_AT = process.env.NEXT_PUBLIC_APP_BUILT_AT ?? '';

/** Rotulo curto para rodape: "v1.0.0 · a1b2c3d". */
export const APP_BUILD_LABEL = `v${APP_VERSION} · ${APP_COMMIT}`;

/** Identificador unico do build — usado para versionar o cache do app instalado. */
export const APP_BUILD_ID = `${APP_VERSION}-${APP_COMMIT}`;
