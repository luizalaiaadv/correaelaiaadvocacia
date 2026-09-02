import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { fetchMetaAds } from '@/lib/meta-ads';
import { fetchGoogleAds } from '@/lib/google-ads';
import { deleteSubscription, listSubscriptions } from '@/lib/push-store';
import { LOW_BALANCE_BRL } from '@/app/_ads/config';

export const dynamic = 'force-dynamic';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/**
 * Checagem periodica do saldo (Vercel Cron). Manda push para os aparelhos
 * inscritos quando alguma conta cai abaixo de LOW_BALANCE_BRL.
 *
 * Nao autentica por senha do painel: quem chama e o cron, entao a protecao e o
 * CRON_SECRET (a Vercel envia em `Authorization: Bearer`).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Nao autorizado.' }, { status: 401 });
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    return NextResponse.json({ error: 'VAPID nao configurado.' }, { status: 500 });
  }
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? 'mailto:contato@correaelaiaadvocacia.com', publicKey, privateKey);

  // O saldo e da CONTA, entao o periodo nao muda o numero — '7d' e so a janela
  // que a leitura exige. Cada conta falha de forma independente.
  const [meta, google] = await Promise.allSettled([fetchMetaAds('7d'), fetchGoogleAds('7d')]);

  const contas: { title: string; remaining: number }[] = [];
  if (meta.status === 'fulfilled' && meta.value.balance) {
    contas.push({ title: 'Saldo do Meta', remaining: meta.value.balance.remaining });
  }
  if (google.status === 'fulfilled' && google.value.balance) {
    contas.push({ title: 'Saldo do Google', remaining: google.value.balance.remaining });
  }

  const baixos = contas.filter((c) => c.remaining < LOW_BALANCE_BRL);
  if (baixos.length === 0) {
    return NextResponse.json({ ok: true, avisos: 0, contas: contas.length });
  }

  const subscriptions = await listSubscriptions();
  let enviados = 0;

  for (const conta of baixos) {
    const payload = JSON.stringify({
      title: conta.title,
      body: `Saldo baixo: ${brl.format(conta.remaining)}. Recarregue para os anuncios nao pararem.`,
      tag: conta.title,
      url: '/dash-ads',
    });

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        );
        enviados += 1;
      } catch (error) {
        // 404/410 = aparelho desinstalou o app ou revogou: limpa a inscricao
        // para nao tentar de novo todo dia.
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) await deleteSubscription(sub.endpoint);
        else console.warn('[push] falha ao enviar', status ?? error);
      }
    }
  }

  return NextResponse.json({ ok: true, avisos: baixos.length, enviados });
}
