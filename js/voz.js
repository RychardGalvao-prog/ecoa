/**
 * ecoa - Prancha Digital de Comunicação Alternativa e Aumentativa (CAA)
 * Projeto Acadêmico - Universidade Federal do Maranhão (UFMA)
 * Módulo: voz.js - Integração com Web Speech API (speechSynthesis) em pt-BR
 */

import { APP_NAME } from './estado.js';
import { obterAjustes } from './armazenamento.js';

// Estado interno do subsistema de voz
let vozesDisponiveis = [];
let vozSelecionada = null;
let estaFalando = false;
let idItemFalando = null;
let ouvintesEstado = [];
let sintetizador = typeof window !== 'undefined' ? window.speechSynthesis : null;
let observadoresVozesConfigurados = false;

/**
 * Registra um ouvinte para alterações no estado de fala (início, fim, erro)
 * @param {Function} callback - Recebe ({ falando: boolean, id: string|null, texto: string })
 * @returns {Function} Função para remover o ouvinte
 */
export function inscreverEstadoFala(callback) {
  ouvintesEstado.push(callback);
  return () => {
    ouvintesEstado = ouvintesEstado.filter(fn => fn !== callback);
  };
}

/**
 * Notifica todos os ouvintes sobre o estado atual
 */
function notificarEstado(texto = '') {
  const estado = {
    falando: estaFalando,
    id: idItemFalando,
    texto
  };
  ouvintesEstado.forEach(fn => {
    try {
      fn(estado);
    } catch (e) {
      console.warn(`[${APP_NAME}] Erro em ouvinte de voz:`, e);
    }
  });
}

/**
 * Carrega e filtra a lista de vozes sintetizadas do navegador
 * Prioriza vozes em português do Brasil (pt-BR)
 * @returns {Promise<Array<SpeechSynthesisVoice>>}
 */
export function carregarVozes() {
  if (!sintetizador) return Promise.resolve([]);
  configurarObservadoresVozes();

  if (atualizarListaVozes()) return Promise.resolve(vozesDisponiveis);

  return new Promise(resolve => {
    let resolvida = false;
    const concluir = () => {
      if (resolvida) return;
      resolvida = true;
      clearTimeout(timeout);
      window.removeEventListener('ecoa-vozes-atualizadas', concluir);
      resolve(vozesDisponiveis);
    };
    const timeout = setTimeout(() => {
      atualizarListaVozes();
      concluir();
    }, 1000);

    window.addEventListener('ecoa-vozes-atualizadas', concluir);
  });
}

function atualizarListaVozes() {
  if (!sintetizador) return false;

  let todasVozes;
  try {
    todasVozes = sintetizador.getVoices() || [];
  } catch (erro) {
    console.warn(`[${APP_NAME}] Não foi possível consultar as vozes do aparelho:`, erro);
    return false;
  }
  if (todasVozes.length === 0) return false;

  vozesDisponiveis = todasVozes.slice().sort((a, b) => {
    const idiomaA = (a.lang || '').toLowerCase();
    const idiomaB = (b.lang || '').toLowerCase();
    const aBr = idiomaA === 'pt-br' || idiomaA.startsWith('pt_br');
    const bBr = idiomaB === 'pt-br' || idiomaB.startsWith('pt_br');
    if (aBr !== bBr) return aBr ? -1 : 1;

    const aPt = idiomaA.startsWith('pt');
    const bPt = idiomaB.startsWith('pt');
    if (aPt !== bPt) return aPt ? -1 : 1;

    return (a.name || '').localeCompare(b.name || '');
  });

  definirVozPadrao();
  window.dispatchEvent(new CustomEvent('ecoa-vozes-atualizadas'));
  return true;
}

function configurarObservadoresVozes() {
  if (observadoresVozesConfigurados || !sintetizador) return;
  observadoresVozesConfigurados = true;

  if (typeof sintetizador.addEventListener === 'function') {
    sintetizador.addEventListener('voiceschanged', atualizarListaVozes);
  } else {
    sintetizador.onvoiceschanged = atualizarListaVozes;
  }

  window.addEventListener('focus', atualizarListaVozes);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) atualizarListaVozes();
  });
}

/**
 * Define a melhor voz padrão:
 * 1. Respeita a voz salva nos ajustes se ela existir
 * 2. Seleciona a primeira voz pt-BR disponível
 * 3. Não escolhe idioma diferente do português silenciosamente
 */
function definirVozPadrao() {
  if (vozesDisponiveis.length === 0) return;

  const ajustes = obterAjustes();
  if (ajustes.vozURI) {
    const encontrada = vozesDisponiveis.find(v => v.voiceURI === ajustes.vozURI);
    if (encontrada) {
      vozSelecionada = encontrada;
      return;
    }
  }

  // Busca voz pt-BR
  const vozPtBr = vozesDisponiveis.find(v => {
    const lang = (v.lang || '').toLowerCase();
    return lang === 'pt-br' || lang.startsWith('pt_br');
  });

  if (vozPtBr) {
    vozSelecionada = vozPtBr;
    return;
  }

  // Busca qualquer voz em português
  const vozPt = vozesDisponiveis.find(v => (v.lang || '').toLowerCase().startsWith('pt'));
  if (vozPt) {
    vozSelecionada = vozPt;
    return;
  }

  vozSelecionada = null;
}

/**
 * Retorna as vozes carregadas
 * @returns {Array<SpeechSynthesisVoice>}
 */
export function obterVozesDisponiveis() {
  return vozesDisponiveis;
}

/**
 * Verifica se o dispositivo possui alguma voz em português instalada
 * @returns {boolean}
 */
export function possuiVozPtBr() {
  return vozesDisponiveis.some(v => {
    const lang = (v.lang || '').toLowerCase();
    return lang === 'pt-br' || lang.startsWith('pt_br');
  });
}

export function suportaSinteseVoz() {
  return Boolean(sintetizador && typeof SpeechSynthesisUtterance !== 'undefined');
}

/**
 * Retorna a voz atualmente ativa
 * @returns {SpeechSynthesisVoice|null}
 */
export function obterVozAtiva() {
  return vozSelecionada;
}

/**
 * Define manualmente a voz ativa (através da tela de Ajustes)
 * @param {string} voiceURI 
 */
export function definirVozPorURI(voiceURI) {
  const encontrada = vozesDisponiveis.find(v => v.voiceURI === voiceURI);
  if (encontrada) {
    vozSelecionada = encontrada;
    return encontrada;
  }
  definirVozPadrao();
  return vozSelecionada;
}

/**
 * Fala um texto em voz alta utilizando a Web Speech API
 * IMPORTANTE: Deve ser chamado apenas dentro de um manipulador de evento de gesto do usuário
 * (requisito rígido para iOS Safari e Android Chrome).
 * 
 * @param {string} texto - Frase a ser falada
 * @param {Object} [opcoes] - Opções adicionais
 * @param {string} [opcoes.id] - Identificador único do elemento que disparou a fala
 * @param {Function} [opcoes.aoIniciar] - Callback de início
 * @param {Function} [opcoes.aoTerminar] - Callback de término
 * @returns {boolean} Se a fala foi iniciada com sucesso
 */
export function falar(texto, { id = null, aoIniciar = null, aoTerminar = null } = {}) {
  const textoLimpo = (texto || '').trim();
  if (!textoLimpo) return false;

  if (!suportaSinteseVoz()) {
    console.warn(`[${APP_NAME}] Web Speech API não suportada neste navegador.`);
    window.dispatchEvent(new CustomEvent('ecoa-voz-erro', {
      detail: { error: 'speech-unavailable', id }
    }));
    return false;
  }

  configurarObservadoresVozes();
  atualizarListaVozes();

  // Evita cancelar o sintetizador vazio, o que pode bloquear a fala no Safari móvel.
  if (estaFalando || sintetizador.speaking || sintetizador.pending) {
    parar();
  }

  const ajustes = obterAjustes();
  try {
    const proferimento = new SpeechSynthesisUtterance(textoLimpo);

    proferimento.lang = vozSelecionada?.lang || 'pt-BR';
    if (vozSelecionada) proferimento.voice = vozSelecionada;
    proferimento.rate = Math.max(0.5, Math.min(2.0, parseFloat(ajustes.velocidade) || 1.0));
    proferimento.pitch = Math.max(0.5, Math.min(1.5, parseFloat(ajustes.tom) || 1.0));

    proferimento.onstart = () => {
      estaFalando = true;
      idItemFalando = id;
      notificarEstado(textoLimpo);
      window.dispatchEvent(new CustomEvent('ecoa-voz-iniciada', {
        detail: { id }
      }));
      if (typeof aoIniciar === 'function') aoIniciar();
    };

    proferimento.onend = () => {
      estaFalando = false;
      idItemFalando = null;
      notificarEstado();
      window.dispatchEvent(new CustomEvent('ecoa-voz-finalizada', {
        detail: { id }
      }));
      if (typeof aoTerminar === 'function') aoTerminar();
    };

    proferimento.onerror = (evento) => {
      console.warn(`[${APP_NAME}] Erro ou cancelamento de fala:`, evento.error);
      estaFalando = false;
      idItemFalando = null;
      notificarEstado();
      if (evento.error !== 'canceled' && evento.error !== 'interrupted') {
        window.dispatchEvent(new CustomEvent('ecoa-voz-erro', {
          detail: { error: evento.error || 'unknown', id }
        }));
      }
      if (typeof aoTerminar === 'function') aoTerminar();
    };

    // No iOS Safari, pode ser necessário um pequeno resume() se o sintetizador estiver pausado
    if (sintetizador.paused) {
      sintetizador.resume();
    }
    sintetizador.speak(proferimento);
    return true;
  } catch (erro) {
    console.error(`[${APP_NAME}] Falha ao executar speak():`, erro);
    estaFalando = false;
    idItemFalando = null;
    notificarEstado();
    window.dispatchEvent(new CustomEvent('ecoa-voz-erro', {
      detail: { error: erro.name || 'unknown', id }
    }));
    return false;
  }
}

/**
 * Interrompe qualquer fala em andamento imediatamente
 */
export function parar() {
  if (!sintetizador) return;
  try {
    sintetizador.cancel();
  } catch (erro) {
    console.warn(`[${APP_NAME}] Erro ao cancelar fala:`, erro);
  } finally {
    estaFalando = false;
    idItemFalando = null;
    notificarEstado();
  }
}

/**
 * Retorna se há fala ocorrendo no momento
 * @returns {boolean}
 */
export function checarSeEstaFalando() {
  return estaFalando;
}

/**
 * Retorna o ID do item que está falando no momento
 * @returns {string|null}
 */
export function obterIdFalando() {
  return idItemFalando;
}

/**
 * Fala uma frase de teste com a voz e ajustes configurados
 */
export function testarVozAtual() {
  const fraseTeste = "Olá! Esta é a voz configurada no aplicativo Ecoa.";
  return falar(fraseTeste, { id: 'teste-voz' });
}
