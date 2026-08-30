// Service worker do painel (trafego pago + leads).
//
// Regra central: os dados dos leads NUNCA sao cacheados. Um dashboard "em tempo
// real" servindo lead antigo do cache seria pior do que nao abrir. O cache cobre
// apenas a casca visual (icones, textura, bundles estaticos).

// A textura de fundo e cacheada por URL: sempre que ela mudar, suba a versao
// aqui, senao apps ja instalados continuam mostrando a imagem antiga.
const CACHE = 'cl-leads-v4';
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
