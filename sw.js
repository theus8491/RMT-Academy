// ==========================================
// SERVICE WORKER - BAIANO STORE PWA
// ==========================================

const CACHE_NAME = 'baiano-store-v1';

// Arquivos essenciais para tentar guardar no cache inicial
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './painel.html',
  './icon.png',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap'
];

// Instalação do Service Worker: Salva os arquivos no cache
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Força o novo SW a assumir o controle imediatamente
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Cache aberto');
      return cache.addAll(ASSETS_TO_CACHE);
    }).catch(err => {
      console.log('SW: Erro ao salvar cache inicial (talvez algum arquivo não exista ainda):', err);
    })
  );
});

// Ativação: Limpa caches antigos se você atualizar a versão
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('SW: Limpando cache antigo:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptação de requisições (Fetch)
self.addEventListener('fetch', (event) => {
  // Ignora requisições que não são GET (ex: POST para o Supabase)
  if (event.request.method !== 'GET') return;

  // Ignora as requisições do Supabase e da PokéAPI (sempre busca dados novos)
  if (event.request.url.includes('supabase.co') || event.request.url.includes('pokeapi.co')) {
    return; 
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Se achou no cache, retorna o cache. Se não, busca na internet.
      return cachedResponse || fetch(event.request).then((networkResponse) => {
        
        // Opcional: Salva imagens e fontes novas no cache enquanto navega
        if (
          event.request.url.match(/\.(png|jpg|jpeg|svg|woff2?|css|js)$/) || 
          event.request.url.includes('fonts.gstatic.com')
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        
        return networkResponse;
      });
    }).catch(() => {
      // Fallback opcional se estiver offline e não tiver no cache
      // return caches.match('./index.html');
    })
  );
});