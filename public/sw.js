// Service worker do painel (trafego pago + leads).
//
// Regra central: os dados dos leads NUNCA sao cacheados. Um dashboard "em tempo
// real" servindo lead antigo do cache seria pior do que nao abrir. O cache cobre
// apenas a casca visual (icones, textura, bundles estaticos).

// O cache e versionado pelo BUILD: o registro passa `?v=<versao>-<commit>`, que
// muda a cada alteracao publicada. Assim cada deploy cria um cache novo e o
// handler de `activate` apaga os antigos — sem precisar subir um numero na mao
// (era `cl-leads-v4`, que so mudava quando alguem lembrava).
const VERSION = new URL(self.location.href).searchParams.get('v') || 'dev';
const CACHE = `cl-painel-${VERSION}`;
const OFFLINE_URL = '/offline.html';

const PRECACHE = [OFFLINE_URL, '/texture-bg.webp', '/icon-192.png', '/icon-512.png', '/logofooter.webp'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Leads e autenticacao: sempre rede, nunca cache.
  if (url.pathname.startsWith('/api/')) return;

  // Navegacao: rede sempre. Nao cacheamos HTML para nao servir uma versao velha
  // do site; offline, mostramos uma pagina de aviso.
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Assets estaticos e casca: REDE PRIMEIRO, cache so como reserva offline.
  // Antes era "cache primeiro", e isso servia o JS antigo quando o bundle mudava
  // — a tela ficava com codigo velho e os dados pareciam nao atualizar.
  const isStatic = url.pathname.startsWith('/_next/static/') || PRECACHE.includes(url.pathname);
  if (!isStatic) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request)),
  );
});

// --- Push de saldo -----------------------------------------------------------
// O servidor manda o titulo pronto ("Saldo do Meta" / "Saldo do Google") e o
// corpo com o valor. Se o payload vier vazio ou quebrado, ainda mostramos um
// aviso generico — melhor avisar de forma vaga do que engolir a notificacao.
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }

  const title = data.title || 'Saldo da conta';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || 'Toque para ver o saldo no painel.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      // Mesma tag por plataforma: um aviso novo substitui o antigo em vez de
      // empilhar varios "Saldo do Meta" na barra de notificacoes.
      tag: data.tag || 'saldo',
      renotify: true,
      data: { url: data.url || '/dash-ads' },
    }),
  );
});

// Tocar na notificacao abre o painel (reaproveita a aba/app ja aberto).
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/dash-ads';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(target) && 'focus' in client) return client.focus();
      }
      return self.clients.openWindow(target);
    }),
  );
});
