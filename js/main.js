/**
 * ecoa - Prancha Digital de Comunicação Alternativa e Aumentativa (CAA)
 * Projeto Acadêmico - Universidade Federal do Maranhão (UFMA)
 * Módulo Principal: main.js - Inicialização, ciclo de vida e Service Worker PWA
 */

import { APP_NAME } from './estado.js';
import { carregarVozes } from './voz.js';
import { inicializarPalco } from './palco.js';
import {
  inicializarAjustes,
  atualizarSelectVozes,
  aplicarTemaEAcessibilidadeNoDocumento
} from './ajustes.js';
import { inicializarInterface, renderizarGradeFrases } from './interface.js';

// Inicializa a aplicação após o carregamento completo do DOM
document.addEventListener('DOMContentLoaded', async () => {
  console.info(`[${APP_NAME}] Inicializando aplicativo de Comunicação Alternativa (UFMA)...`);

  // Aplica tema e preferências imediatamente para evitar flash de estilo
  aplicarTemaEAcessibilidadeNoDocumento();

  // Inicializa o Modo Palco (tela cheia com texto gigante)
  const modalPalco = document.getElementById('modal-modo-palco');
  if (modalPalco) {
    inicializarPalco(modalPalco);
  }

  // Inicializa o gerenciador de Ajustes e vincula callback de atualização geral
  const containerAjustes = document.getElementById('secao-ajustes');
  if (containerAjustes) {
    inicializarAjustes(containerAjustes, () => {
      renderizarGradeFrases();
    });
  }

  window.addEventListener('ecoa-vozes-atualizadas', atualizarSelectVozes);

  // Inicializa a interface gráfica principal
  inicializarInterface();

  // Carrega assincronamente as vozes da Web Speech API
  try {
    await carregarVozes();
    atualizarSelectVozes();
  } catch (erro) {
    console.warn(`[${APP_NAME}] Aviso ao carregar vozes:`, erro);
  }

  // Registra o Service Worker para funcionamento 100% offline (PWA)
  registrarServiceWorker();
});

/**
 * Registra o Service Worker do PWA se suportado pelo navegador
 */
function registrarServiceWorker() {
  window.addEventListener('offline', () => atualizarStatusOffline('Sem conexão: usando recursos armazenados no aparelho.'));
  window.addEventListener('online', () => atualizarStatusOffline('Conexão restaurada.'));
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('./sw.js')
      .then(async reg => {
        await navigator.serviceWorker.ready;
        console.info(`[${APP_NAME}] Service Worker registrado com escopo:`, reg.scope);
        atualizarStatusOffline('Offline pronto para uso.');
      })
      .catch(erro => {
        console.warn(`[${APP_NAME}] Falha no registro do Service Worker:`, erro);
        atualizarStatusOffline('Offline indisponível neste endereço. Use HTTPS ou localhost.');
      });
  } else {
    atualizarStatusOffline('Este navegador não oferece suporte ao modo offline.');
  }
}

function atualizarStatusOffline(mensagem) {
  const status = document.getElementById('status-offline-app');
  if (status) status.textContent = mensagem;
  document.documentElement.dataset.offlineReady = mensagem.startsWith('Offline pronto') ? 'true' : 'false';
}
