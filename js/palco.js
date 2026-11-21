/**
 * ecoa - Prancha Digital de Comunicação Alternativa e Aumentativa (CAA)
 * Projeto Acadêmico - Universidade Federal do Maranhão (UFMA)
 * Módulo: palco.js - "Modo Palco" (exibição em tela cheia com tipografia gigante adaptativa)
 * Versão 2: Busca binária robusta, medição da palavra mais longa, sem quebras indesejadas
 */

import { APP_NAME } from './estado.js';
import { falar, parar, checarSeEstaFalando } from './voz.js';

let containerPalco = null;
let elementoTextoPalco = null;
let elementoAreaLeitura = null;
let botaoFechar = null;
let botaoFalar = null;
let indicadorFala = null;

let fraseAtual = '';
let wakeLockSentinel = null;
let redimensionadorObservador = null;

/**
 * Inicializa referências DOM e escutas de eventos do Modo Palco
 * @param {HTMLElement} raizContainer - Elemento do modal do Modo Palco
 */
export function inicializarPalco(raizContainer) {
  containerPalco = raizContainer;
  elementoTextoPalco = containerPalco.querySelector('#palco-texto');
  elementoAreaLeitura = containerPalco.querySelector('#palco-area-leitura');
  botaoFechar = containerPalco.querySelector('#palco-btn-fechar');
  botaoFalar = containerPalco.querySelector('#palco-btn-falar');
  indicadorFala = containerPalco.querySelector('#palco-onda-fala');

  // Toque na área central repete a fala
  elementoAreaLeitura.addEventListener('click', (evento) => {
    if (evento.target.closest('button')) return;
    repetirFala();
  });

  // Botão dedicado de falar
  botaoFalar.addEventListener('click', (evento) => {
    evento.stopPropagation();
    if (checarSeEstaFalando()) {
      parar();
    } else {
      repetirFala();
    }
  });

  // Botão de fechar
  botaoFechar.addEventListener('click', (evento) => {
    evento.stopPropagation();
    fecharModoPalco();
  });

  // Tecla Escape para fechar
  window.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && containerPalco.classList.contains('ativo')) {
      fecharModoPalco();
    }
  });

  // Reajuste automático com ResizeObserver no container visível
  if (window.ResizeObserver && elementoAreaLeitura) {
    redimensionadorObservador = new ResizeObserver(() => {
      debouncedAjustarFonte();
    });
    redimensionadorObservador.observe(elementoAreaLeitura);
  }

  // Eventos de orientação e redimensionamento da janela e teclado virtual
  window.addEventListener('resize', debouncedAjustarFonte);
  if (window.screen && window.screen.orientation) {
    window.screen.orientation.addEventListener('change', debouncedAjustarFonte);
  }
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', debouncedAjustarFonte);
  }
}

/**
 * Abre o Modo Palco com uma frase específica
 * @param {string} texto - Frase a ser exibida em destaque
 */
export async function abrirModoPalco(texto) {
  if (!containerPalco || !elementoTextoPalco) return;

  fraseAtual = (texto || '').trim();
  if (!fraseAtual) return;

  elementoTextoPalco.textContent = fraseAtual;
  containerPalco.classList.add('ativo');
  containerPalco.setAttribute('aria-hidden', 'false');
  document.body.classList.add('palco-aberto');

  // Mantém a fala no gesto do usuário para navegadores móveis mais restritivos.
  repetirFala();

  // Ajusta o tamanho da fonte via busca binária após renderização do layout
  await ajustarTamanhoFonteBinario();

  // Foco acessível no botão fechar
  botaoFechar?.focus();

  // Ativa Screen Wake Lock para manter a tela do celular acesa
  ativarWakeLock();
}

/**
 * Fecha o Modo Palco e libera recursos
 */
export function fecharModoPalco() {
  if (!containerPalco) return;

  parar();
  liberarWakeLock();

  containerPalco.classList.remove('ativo');
  containerPalco.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('palco-aberto');
  atualizarEstadoVisualFala(false);
}

/**
 * Fala novamente a frase atual exibida no palco
 */
function repetirFala() {
  if (!fraseAtual) return;

  falar(fraseAtual, {
    id: 'palco',
    aoIniciar: () => atualizarEstadoVisualFala(true),
    aoTerminar: () => atualizarEstadoVisualFala(false)
  });
}

/**
 * Atualiza o visual dos botões e onda sonora no Modo Palco quando está falando
 * Mantém a aparência do botão consistente (sempre na cor de acento lima, branco no alto contraste)
 * @param {boolean} falando 
 */
export function atualizarEstadoVisualFala(falando) {
  if (!containerPalco) return;

  if (falando) {
    containerPalco.classList.add('falando');
    if (indicadorFala) indicadorFala.classList.add('ativo');
    if (botaoFalar) {
      botaoFalar.setAttribute('aria-label', 'Parar fala');
      botaoFalar.classList.add('falando');
      const textoSpan = botaoFalar.querySelector('span');
      if (textoSpan) textoSpan.textContent = 'Parar';
      const iconeSvg = botaoFalar.querySelector('svg');
      if (iconeSvg) {
        iconeSvg.innerHTML = '<rect width="18" height="18" x="3" y="3" rx="2" fill="currentColor"></rect>';
      }
    }
  } else {
    containerPalco.classList.remove('falando');
    if (indicadorFala) indicadorFala.classList.remove('ativo');
    if (botaoFalar) {
      botaoFalar.setAttribute('aria-label', 'Falar frase em voz alta');
      botaoFalar.classList.remove('falando');
      const textoSpan = botaoFalar.querySelector('span');
      if (textoSpan) textoSpan.textContent = 'Falar Frase';
      const iconeSvg = botaoFalar.querySelector('svg');
      if (iconeSvg) {
        iconeSvg.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>';
      }
    }
  }
}

/**
 * Extrai a palavra mais longa de uma frase para calcular se ela cabe sem quebrar
 * @param {string} texto 
 * @returns {string}
 */
function extrairPalavraMaisLonga(texto) {
  const palavras = (texto || '').trim().split(/\s+/).filter(Boolean);
  return palavras.reduce((maior, p) => p.length > maior.length ? p : maior, '');
}

/**
 * Algoritmo de Busca Binária para o tamanho de fonte ideal no Modo Palco
 * 
 * Regras implementadas conforme especificação:
 * 1. Só mede após document.fonts.ready e dois requestAnimationFrame.
 * 2. word-break: normal, overflow-wrap: normal, hyphens: none, text-wrap: balance.
 * 3. Mede a palavra mais longa da frase para que ela caiba inteira na largura.
 * 4. scrollWidth <= clientWidth E scrollHeight <= clientHeight.
 * 5. Mínimo de 28px, máximo generoso para frases curtas ocuparem a tela de verdade.
 */
export async function ajustarTamanhoFonteBinario() {
  if (!containerPalco || !elementoTextoPalco || !elementoAreaLeitura) return;
  if (!containerPalco.classList.contains('ativo')) return;

  // 1. Aguarda carregamento de fontes e 2 frames para layout 100% calculado
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch (_) {}
  }
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  // Medições reais do container
  const containerLargura = elementoAreaLeitura.clientWidth;
  const containerAltura = elementoAreaLeitura.clientHeight;

  if (containerLargura <= 0 || containerAltura <= 0) return;

  // Margem de segurança de 24px para respiro visual nas bordas
  const larguraDisponivel = containerLargura - 24;
  const alturaDisponivel = containerAltura - 24;

  const palavraLonga = extrairPalavraMaisLonga(fraseAtual);

  // Canvas context para medição direta da palavra mais longa
  let canvas = document.createElement('canvas');
  let ctx = canvas.getContext('2d');
  const estilo = window.getComputedStyle(elementoTextoPalco);
  const fontFamily = estilo.fontFamily || 'Atkinson Hyperlegible, sans-serif';
  const fontWeight = estilo.fontWeight || '700';

  function palavraCabeNaLargura(palavra, fontSize) {
    if (!palavra) return true;
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    const largura = ctx.measureText(palavra).width;
    return largura <= larguraDisponivel;
  }

  // Limites da busca binária
  let minTamanho = 28;
  // Frases curtas (1 a 3 palavras) podem crescer até 220px ou 85% da largura útil
  let maxTamanho = Math.min(220, Math.max(minTamanho, Math.floor(containerLargura * 0.85)));
  let melhorTamanho = minTamanho;

  // Busca binária precisa (O(log n))
  while (minTamanho <= maxTamanho) {
    const meio = Math.floor((minTamanho + maxTamanho) / 2);

    // Regra da palavra mais longa: nunca quebrar no meio
    if (!palavraCabeNaLargura(palavraLonga, meio)) {
      maxTamanho = meio - 1;
      continue;
    }

    // Aplica no DOM e verifica dimensões de scroll
    elementoTextoPalco.style.fontSize = `${meio}px`;
    elementoTextoPalco.style.lineHeight = meio > 60 ? '1.1' : '1.2';

    const cabeLargura = elementoTextoPalco.scrollWidth <= larguraDisponivel;
    const cabeAltura = elementoTextoPalco.scrollHeight <= alturaDisponivel;

    if (cabeLargura && cabeAltura) {
      melhorTamanho = meio;
      minTamanho = meio + 1; // Cabe! Tenta um tamanho maior
    } else {
      maxTamanho = meio - 1; // Ultrapassou container, reduz
    }
  }

  // Aplica tamanho final com lineHeight balanceado
  elementoTextoPalco.style.fontSize = `${melhorTamanho}px`;
  elementoTextoPalco.style.lineHeight = melhorTamanho > 60 ? '1.1' : '1.2';
}

let timeoutDebounce = null;
function debouncedAjustarFonte() {
  if (!containerPalco || !containerPalco.classList.contains('ativo')) return;
  clearTimeout(timeoutDebounce);
  timeoutDebounce = setTimeout(() => {
    ajustarTamanhoFonteBinario();
  }, 50);
}

/**
 * Ativa o Screen Wake Lock para manter a tela do celular acesa
 */
async function ativarWakeLock() {
  if ('wakeLock' in navigator && navigator.wakeLock) {
    try {
      wakeLockSentinel = await navigator.wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null;
      });
    } catch (erro) {
      console.info(`[${APP_NAME}] Wake Lock indisponível:`, erro.message);
    }
  }
}

/**
 * Libera o Screen Wake Lock quando o usuário sai do Modo Palco
 */
async function liberarWakeLock() {
  if (wakeLockSentinel) {
    try {
      await wakeLockSentinel.release();
    } catch (_) {}
    wakeLockSentinel = null;
  }
}
