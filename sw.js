/**
 * ecoa - Prancha Digital de Comunicação Alternativa e Aumentativa (CAA)
 * Projeto Acadêmico - Universidade Federal do Maranhão (UFMA)
 * Service Worker: sw.js - Cache 100% offline para funcionamento sem conexão
 * Versão 2 - Ajustes de experiência
 */

const CACHE_NAME = 'ecoa-app-cache-v4';

// Lista de todos os recursos locais essenciais para o funcionamento offline
const RECURSOS_PARA_CACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './sw.js',
  
  // Estilos CSS
  './css/variables.css',
  './css/base.css',
  './css/layout.css',
  './css/components.css',

  // Módulos JavaScript (ES Modules)
  './js/main.js',
  './js/estado.js',
  './js/armazenamento.js',
  './js/voz.js',
  './js/palco.js',
  './js/ajustes.js',
  './js/interface.js',
  './js/icones.js',

  // Fontes locais (Atkinson Hyperlegible)
  './assets/fonts/atkinson-regular.woff2',
  './assets/fonts/atkinson-bold.woff2',

  // Identidade Visual e Logos Oficiais (Ecoa UFMA)
  './assets/brand/ecoa-logo-horizontal.svg',
  './assets/brand/ecoa-logo-completo.svg',
  './assets/brand/ecoa-simbolo.svg',
  './assets/brand/ecoa-simbolo-escuro.svg',
  './assets/brand/ecoa-simbolo-mono.svg',
  './assets/brand/favicon.svg',
  './assets/brand/favicon-32.png',
  './assets/brand/favicon-48.png',
  './assets/brand/icon-192.png',
  './assets/brand/icon-512.png',
  './assets/brand/icon-maskable-192.png',
  './assets/brand/icon-maskable-512.png',
  './assets/brand/apple-touch-icon.png',

  // Ícones do sistema
  './assets/icons/app-icon.svg',
  './assets/icons/volume-2.svg',
  './assets/icons/square.svg',
  './assets/icons/maximize-2.svg',
  './assets/icons/settings.svg',
  './assets/icons/message-square.svg',
  './assets/icons/keyboard.svg',
  './assets/icons/plus.svg',
  './assets/icons/pencil.svg',
  './assets/icons/trash-2.svg',
  './assets/icons/x.svg',
  './assets/icons/check.svg',
  './assets/icons/rotate-ccw.svg',
  './assets/icons/download.svg',
  './assets/icons/upload.svg',
  './assets/icons/info.svg',
  './assets/icons/help-circle.svg',
  './assets/icons/file-text.svg',
  './assets/icons/edit-3.svg',
  './assets/icons/clock.svg',
  './assets/icons/book-open.svg',
  './assets/icons/map-pin.svg',
  './assets/icons/refresh-cw.svg',
  './assets/icons/search.svg',
  './assets/icons/utensils.svg',
  './assets/icons/credit-card.svg',
  './assets/icons/users.svg',
  './assets/icons/smile.svg',
  './assets/icons/user.svg',
  './assets/icons/mic.svg',
  './assets/icons/hourglass.svg',
  './assets/icons/life-buoy.svg',
  './assets/icons/phone.svg',
  './assets/icons/heart-pulse.svg',
  './assets/icons/check-circle.svg',
  './assets/icons/x-circle.svg',
  './assets/icons/heart.svg',
  './assets/icons/arrow-up.svg',
  './assets/icons/arrow-down.svg',
  './assets/icons/sun.svg',
  './assets/icons/moon.svg',
  './assets/icons/eye.svg',
  './assets/icons/smartphone.svg',
  './assets/icons/sliders.svg',
  './assets/icons/grid.svg',
  './assets/icons/alert-triangle.svg',
  './assets/icons/bookmark.svg'
];

// Evento de instalação: pré-carrega todos os arquivos no cache
self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker Ecoa v2] Pré-armazenando arquivos para uso offline...');
      return cache.addAll(RECURSOS_PARA_CACHE);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Evento de ativação: limpa versões antigas de caches
self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((nomesCaches) => {
      return Promise.all(
        nomesCaches.map((nome) => {
          if (nome !== CACHE_NAME) {
            console.log('[Service Worker Ecoa v2] Removendo cache obsoleto:', nome);
            return caches.delete(nome);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Estratégia de busca (Fetch): Cache-First com fallback de rede
self.addEventListener('fetch', (evento) => {
  if (evento.request.method !== 'GET') return;

  evento.respondWith(
    caches.match(evento.request).then((respostaCache) => {
      if (respostaCache) {
        return respostaCache;
      }

      return fetch(evento.request).then((respostaRede) => {
        if (!respostaRede || respostaRede.status !== 200 || respostaRede.type !== 'basic') {
          return respostaRede;
        }

        const respostaClonada = respostaRede.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(evento.request, respostaClonada);
        });

        return respostaRede;
      }).catch(() => {
        if (evento.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});
