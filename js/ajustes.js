/**
 * ecoa - Prancha Digital de Comunicação Alternativa e Aumentativa (CAA)
 * Projeto Acadêmico - Universidade Federal do Maranhão (UFMA)
 * Módulo: ajustes.js - Gerenciamento de preferências, temas, voz e acessibilidade
 */

import { APP_NAME } from './estado.js';
import {
  obterAjustes,
  salvarAjustes,
  salvarNomeUsuario,
  obterNomeUsuario,
  exportarArquivoJSON,
  validarEImportarJSON,
  restaurarPadroesIniciais
} from './armazenamento.js';
import {
  obterVozesDisponiveis,
  definirVozPorURI,
  testarVozAtual,
  possuiVozPtBr
} from './voz.js';

let containerAjustes = null;
let callbackRecarregarInterface = null;
let ouvintesPreferenciasSistemaConfigurados = false;

/**
 * Inicializa a tela de ajustes e vincula todos os controles
 * @param {HTMLElement} raizContainer 
 * @param {Function} onAtualizacaoGeral - Notificação para re-renderizar telas dependentes
 */
export function inicializarAjustes(raizContainer, onAtualizacaoGeral) {
  containerAjustes = raizContainer;
  callbackRecarregarInterface = onAtualizacaoGeral;

  carregarValoresNosControles();
  vincularEventosControles();
  aplicarTemaEAcessibilidadeNoDocumento();
  atualizarPreviaAjustes();
}

/**
 * Preenche os inputs da interface com as preferências salvas
 */
export function carregarValoresNosControles() {
  if (!containerAjustes) return;

  const ajustes = obterAjustes();

  // Tema
  const selectTema = containerAjustes.querySelector('#ajuste-tema');
  if (selectTema) selectTema.value = ajustes.tema || 'auto';

  // Tamanho do texto
  const selectTexto = containerAjustes.querySelector('#ajuste-tamanho-texto');
  if (selectTexto) selectTexto.value = ajustes.tamanhoTexto || 'normal';

  // Tamanho dos botões
  const selectBotao = containerAjustes.querySelector('#ajuste-tamanho-botao');
  if (selectBotao) selectBotao.value = ajustes.tamanhoBotao || 'confortavel';

  // Colunas da grade
  const selectColunas = containerAjustes.querySelector('#ajuste-colunas-grade');
  if (selectColunas) selectColunas.value = String(ajustes.colunasGrade || 1);

  // Personalização de nome e paleta
  const inputNome = containerAjustes.querySelector('#ajuste-nome');
  if (inputNome) inputNome.value = ajustes.nomeUsuario || '';

  containerAjustes.querySelectorAll('[data-paleta]').forEach(botao => {
    botao.classList.toggle('ativo', botao.dataset.paleta === (ajustes.paletaDestaque || 'cacto'));
    botao.setAttribute('aria-pressed', String(botao.dataset.paleta === (ajustes.paletaDestaque || 'cacto')));
  });

  containerAjustes.querySelectorAll('[data-ajuste-tema]').forEach(botao => {
    const ativo = botao.dataset.ajusteTema === ajustes.tema;
    botao.classList.toggle('ativo', ativo);
    botao.setAttribute('aria-pressed', String(ativo));
  });
  containerAjustes.querySelectorAll('[data-ajuste-texto]').forEach(botao => {
    const ativo = botao.dataset.ajusteTexto === ajustes.tamanhoTexto;
    botao.classList.toggle('ativo', ativo);
    botao.setAttribute('aria-pressed', String(ativo));
  });
  containerAjustes.querySelectorAll('[data-ajuste-botao]').forEach(botao => {
    const ativo = botao.dataset.ajusteBotao === ajustes.tamanhoBotao;
    botao.classList.toggle('ativo', ativo);
    botao.setAttribute('aria-pressed', String(ativo));
  });
  containerAjustes.querySelectorAll('[data-ajuste-colunas]').forEach(botao => {
    const ativo = botao.dataset.ajusteColunas === String(ajustes.colunasGrade);
    botao.classList.toggle('ativo', ativo);
    botao.setAttribute('aria-pressed', String(ativo));
  });

  // Sliders de voz
  const sliderVelocidade = containerAjustes.querySelector('#ajuste-velocidade-voz');
  const valorVelocidade = containerAjustes.querySelector('#valor-velocidade-voz');
  if (sliderVelocidade) {
    sliderVelocidade.value = ajustes.velocidade || 1.0;
    if (valorVelocidade) valorVelocidade.textContent = `${parseFloat(sliderVelocidade.value).toFixed(1)}x`;
  }

  const sliderTom = containerAjustes.querySelector('#ajuste-tom-voz');
  const valorTom = containerAjustes.querySelector('#valor-tom-voz');
  if (sliderTom) {
    sliderTom.value = ajustes.tom || 1.0;
    if (valorTom) valorTom.textContent = `${parseFloat(sliderTom.value).toFixed(1)}x`;
  }

  // Toggles de acessibilidade
  const checkAnimacoes = containerAjustes.querySelector('#ajuste-reduzir-animacoes');
  if (checkAnimacoes) checkAnimacoes.checked = Boolean(ajustes.reduzirAnimacoes);

  const checkVibracao = containerAjustes.querySelector('#ajuste-vibracao');
  if (checkVibracao) checkVibracao.checked = Boolean(ajustes.vibracao);

  const checkPictogramas = containerAjustes.querySelector('#ajuste-mostrar-pictogramas');
  if (checkPictogramas) checkPictogramas.checked = Boolean(ajustes.mostrarPictogramas);

  // Popula lista de vozes
  atualizarSelectVozes();
}

/**
 * Preenche o elemento <select> de vozes com os dados da Web Speech API
 * Mostra por padrão apenas vozes pt-BR (e outras variantes de português se houver).
 * Outros idiomas ficam ocultos por padrão sob o controle "Mostrar vozes de outros idiomas".
 */
export function atualizarSelectVozes() {
  if (!containerAjustes) return;

  const selects = [
    containerAjustes.querySelector('#ajuste-voz'),
    document.getElementById('boas-vindas-voz')
  ].filter(Boolean);
  if (selects.length === 0) return;

  const toggleOutros = containerAjustes.querySelector('#toggle-outras-vozes');
  const vozes = obterVozesDisponiveis();
  const ajustes = obterAjustes();
  const vozSalva = vozes.find(voz => voz.voiceURI === ajustes.vozURI);
  const idiomaSalvo = (vozSalva?.lang || '').toLowerCase();
  if (vozSalva && !idiomaSalvo.startsWith('pt') && toggleOutros) {
    toggleOutros.checked = true;
  }

  const mostrarOutrosIdiomas = Boolean(toggleOutros?.checked);
  const vozesPtBr = vozes.filter(voz => {
    const idioma = (voz.lang || '').toLowerCase();
    return idioma === 'pt-br' || idioma.startsWith('pt_br');
  });
  const vozesPtOutras = vozes.filter(voz => {
    const idioma = (voz.lang || '').toLowerCase();
    return idioma.startsWith('pt') && !vozesPtBr.includes(voz);
  });
  const vozesOutras = vozes.filter(voz => !(voz.lang || '').toLowerCase().startsWith('pt'));

  const adicionarGrupo = (select, rotulo, lista, sufixo) => {
    if (lista.length === 0) return;
    const grupo = document.createElement('optgroup');
    grupo.label = rotulo;
    lista.forEach(voz => {
      const opcao = document.createElement('option');
      opcao.value = voz.voiceURI;
      opcao.textContent = `${voz.name} (${sufixo(voz)})`;
      grupo.appendChild(opcao);
    });
    select.appendChild(grupo);
  };

  selects.forEach(select => {
    select.replaceChildren();
    adicionarGrupo(select, 'Português do Brasil (pt-BR)', vozesPtBr, () => 'Brasil');
    adicionarGrupo(select, 'Português (outras regiões)', vozesPtOutras, voz => voz.lang || 'Português');
    if (mostrarOutrosIdiomas) {
      adicionarGrupo(select, 'Outros idiomas', vozesOutras, voz => voz.lang || 'idioma não informado');
    }

    if (select.options.length === 0) {
      const opcao = document.createElement('option');
      opcao.value = '';
      opcao.textContent = vozes.length === 0
        ? 'Nenhuma voz foi disponibilizada pelo aparelho'
        : 'Nenhuma voz em português instalada; verifique os ajustes do aparelho';
      select.appendChild(opcao);
      select.disabled = true;
      return;
    }

    select.disabled = false;
    const vozPreferida = vozSalva && Array.from(select.options).some(opcao => opcao.value === vozSalva.voiceURI)
      ? vozSalva
      : vozesPtBr[0] || vozesPtOutras[0] || (!ajustes.vozURI && mostrarOutrosIdiomas ? vozesOutras[0] : null);
    if (vozPreferida) select.value = vozPreferida.voiceURI;
  });

  const vozAtiva = vozSalva || vozesPtBr[0] || vozesPtOutras[0] || null;
  const info = containerAjustes.querySelector('#voz-selecionada-info');
  if (info) {
    info.textContent = vozAtiva
      ? `Voz ativa: ${vozAtiva.name} — ${vozAtiva.lang || 'idioma não informado'}. Para confirmar o timbre, ouça o teste.`
      : 'Nenhuma voz em português foi encontrada neste aparelho. A fala depende das vozes instaladas no sistema.';
  }

  const infoBoasVindas = document.getElementById('boas-vindas-voz-info');
  if (infoBoasVindas) {
    infoBoasVindas.textContent = vozAtiva
      ? `Voz disponível: ${vozAtiva.name} — ${vozAtiva.lang || 'idioma não informado'}.`
      : 'Não há voz em português disponível neste aparelho. Você pode configurar isso depois.';
  }

  if (!vozSalva) {
    const vozPadrao = vozesPtBr[0] || vozesPtOutras[0] || (!ajustes.vozURI && mostrarOutrosIdiomas ? vozesOutras[0] : null);
    salvarAjustes({ vozURI: vozPadrao?.voiceURI || '' });
    definirVozPorURI(vozPadrao?.voiceURI || '');
  }
}

/**
 * Vincula listeners de mudança para cada controle de ajuste
 */
function vincularEventosControles() {
  if (!containerAjustes) return;

  containerAjustes.querySelectorAll('[data-ajuste-tema]').forEach(botao => {
    botao.addEventListener('click', () => {
      salvarAjustes({ tema: botao.dataset.ajusteTema });
      aplicarTemaEAcessibilidadeNoDocumento();
      carregarValoresNosControles();
      atualizarPreviaAjustes();
      vibrarSeAtivo();
    });
  });

  containerAjustes.querySelectorAll('[data-ajuste-texto]').forEach(botao => {
    botao.addEventListener('click', () => {
      salvarAjustes({ tamanhoTexto: botao.dataset.ajusteTexto });
      aplicarTemaEAcessibilidadeNoDocumento();
      carregarValoresNosControles();
      atualizarPreviaAjustes();
      vibrarSeAtivo();
    });
  });

  containerAjustes.querySelectorAll('[data-ajuste-botao]').forEach(botao => {
    botao.addEventListener('click', () => {
      salvarAjustes({ tamanhoBotao: botao.dataset.ajusteBotao });
      aplicarTemaEAcessibilidadeNoDocumento();
      carregarValoresNosControles();
      atualizarPreviaAjustes();
      vibrarSeAtivo();
    });
  });

  containerAjustes.querySelectorAll('[data-ajuste-colunas]').forEach(botao => {
    botao.addEventListener('click', () => {
      salvarAjustes({ colunasGrade: parseInt(botao.dataset.ajusteColunas, 10) });
      carregarValoresNosControles();
      aplicarTemaEAcessibilidadeNoDocumento();
      atualizarPreviaAjustes();
      if (callbackRecarregarInterface) callbackRecarregarInterface();
      vibrarSeAtivo();
    });
  });

  containerAjustes.querySelector('#btn-restaurar-voz')?.addEventListener('click', () => {
    restaurarControlesVoz();
    vibrarSeAtivo();
  });

  // Nome personalizado
  const inputNome = containerAjustes.querySelector('#ajuste-nome');
  inputNome?.addEventListener('input', () => {
    salvarNomeUsuario(inputNome.value);
    atualizarPreviaAjustes();
    window.dispatchEvent(new CustomEvent('ecoa-personalizacao'));
    if (callbackRecarregarInterface) callbackRecarregarInterface();
  });
  inputNome?.addEventListener('blur', () => {
    inputNome.value = obterNomeUsuario();
  });

  // Escolha das quatro paletas de destaque
  containerAjustes.querySelectorAll('[data-paleta]').forEach(botao => {
    botao.addEventListener('click', () => {
      const paleta = botao.dataset.paleta;
      salvarAjustes({ paletaDestaque: paleta });
      carregarValoresNosControles();
      aplicarTemaEAcessibilidadeNoDocumento();
      atualizarPreviaAjustes();
      vibrarSeAtivo();
    });
  });

  // Pré-visualização responde ao tema e aos tamanhos em tempo real
  containerAjustes.querySelectorAll('[data-ajuste-tema], [data-ajuste-tamanho], [data-ajuste-botao]').forEach(controle => {
    controle.addEventListener('change', atualizarPreviaAjustes);
  });

  // Tema
  const selectTema = containerAjustes.querySelector('#ajuste-tema');
  selectTema?.addEventListener('change', () => {
    salvarAjustes({ tema: selectTema.value });
    aplicarTemaEAcessibilidadeNoDocumento();
    vibrarSeAtivo();
  });

  // Tamanho do texto
  const selectTexto = containerAjustes.querySelector('#ajuste-tamanho-texto');
  selectTexto?.addEventListener('change', () => {
    salvarAjustes({ tamanhoTexto: selectTexto.value });
    aplicarTemaEAcessibilidadeNoDocumento();
    vibrarSeAtivo();
  });

  // Tamanho dos botões
  const selectBotao = containerAjustes.querySelector('#ajuste-tamanho-botao');
  selectBotao?.addEventListener('change', () => {
    salvarAjustes({ tamanhoBotao: selectBotao.value });
    aplicarTemaEAcessibilidadeNoDocumento();
    vibrarSeAtivo();
  });

  // Colunas da grade
  const selectColunas = containerAjustes.querySelector('#ajuste-colunas-grade');
  selectColunas?.addEventListener('change', () => {
    salvarAjustes({ colunasGrade: parseInt(selectColunas.value, 10) || 1 });
    aplicarTemaEAcessibilidadeNoDocumento();
    if (callbackRecarregarInterface) callbackRecarregarInterface();
    vibrarSeAtivo();
  });

  // Voz
  const selectVoz = containerAjustes.querySelector('#ajuste-voz');
  selectVoz?.addEventListener('change', () => {
    salvarAjustes({ vozURI: selectVoz.value });
    definirVozPorURI(selectVoz.value);
    atualizarSelectVozes();
    vibrarSeAtivo();
  });

  const selectVozBoasVindas = document.getElementById('boas-vindas-voz');
  selectVozBoasVindas?.addEventListener('change', () => {
    salvarAjustes({ vozURI: selectVozBoasVindas.value });
    definirVozPorURI(selectVozBoasVindas.value);
    atualizarSelectVozes();
    vibrarSeAtivo();
  });

  const toggleOutrasVozes = containerAjustes.querySelector('#toggle-outras-vozes');
  toggleOutrasVozes?.addEventListener('change', () => {
    atualizarSelectVozes();
  });

  // Velocidade da voz
  const sliderVelocidade = containerAjustes.querySelector('#ajuste-velocidade-voz');
  const valorVelocidade = containerAjustes.querySelector('#valor-velocidade-voz');
  sliderVelocidade?.addEventListener('input', () => {
    const val = parseFloat(sliderVelocidade.value);
    if (valorVelocidade) valorVelocidade.textContent = `${val.toFixed(1)}x`;
  });
  sliderVelocidade?.addEventListener('change', () => {
    salvarAjustes({ velocidade: parseFloat(sliderVelocidade.value) });
  });

  // Tom da voz
  const sliderTom = containerAjustes.querySelector('#ajuste-tom-voz');
  const valorTom = containerAjustes.querySelector('#valor-tom-voz');
  sliderTom?.addEventListener('input', () => {
    const val = parseFloat(sliderTom.value);
    if (valorTom) valorTom.textContent = `${val.toFixed(1)}x`;
  });
  sliderTom?.addEventListener('change', () => {
    salvarAjustes({ tom: parseFloat(sliderTom.value) });
  });

  // Botão Testar Voz
  const btnTestarVoz = containerAjustes.querySelector('#btn-testar-voz');
  btnTestarVoz?.addEventListener('click', () => {
    testarVozAtual();
    vibrarSeAtivo();
  });
  document.getElementById('btn-boas-vindas-testar-voz')?.addEventListener('click', () => {
    testarVozAtual();
    vibrarSeAtivo();
  });

  // Toggles de acessibilidade
  const checkAnimacoes = containerAjustes.querySelector('#ajuste-reduzir-animacoes');
  checkAnimacoes?.addEventListener('change', () => {
    salvarAjustes({ reduzirAnimacoes: checkAnimacoes.checked });
    aplicarTemaEAcessibilidadeNoDocumento();
    vibrarSeAtivo();
  });

  const checkVibracao = containerAjustes.querySelector('#ajuste-vibracao');
  checkVibracao?.addEventListener('change', () => {
    salvarAjustes({ vibracao: checkVibracao.checked });
    vibrarSeAtivo();
  });

  const checkPictogramas = containerAjustes.querySelector('#ajuste-mostrar-pictogramas');
  checkPictogramas?.addEventListener('change', () => {
    salvarAjustes({ mostrarPictogramas: checkPictogramas.checked });
    aplicarTemaEAcessibilidadeNoDocumento();
    if (callbackRecarregarInterface) callbackRecarregarInterface();
    vibrarSeAtivo();
  });

  // Exportar backup JSON
  const btnExportar = containerAjustes.querySelector('#btn-exportar-dados');
  btnExportar?.addEventListener('click', () => {
    exportarArquivoJSON();
    vibrarSeAtivo();
  });

  // Importar backup JSON
  const inputImportar = containerAjustes.querySelector('#input-importar-arquivo');
  const btnImportar = containerAjustes.querySelector('#btn-acionar-importar');

  btnImportar?.addEventListener('click', () => {
    inputImportar?.click();
  });

  inputImportar?.addEventListener('change', (evento) => {
    const arquivo = evento.target.files && evento.target.files[0];
    if (!arquivo) return;

    const leitor = new FileReader();
    leitor.onload = (e) => {
      const conteudo = e.target.result;
      const resultado = validarEImportarJSON(conteudo);

      const areaAviso = containerAjustes.querySelector('#aviso-importacao');
      if (areaAviso) {
        areaAviso.textContent = resultado.mensagem;
        areaAviso.className = resultado.sucesso ? 'aviso-sucesso' : 'aviso-erro';
        areaAviso.hidden = false;
        setTimeout(() => { areaAviso.hidden = true; }, 7000);
      }

      if (resultado.sucesso) {
        carregarValoresNosControles();
        aplicarTemaEAcessibilidadeNoDocumento();
        if (callbackRecarregarInterface) callbackRecarregarInterface();
      }
      // Limpa input para permitir selecionar o mesmo arquivo novamente
      inputImportar.value = '';
    };

    leitor.onerror = () => {
      alert('Erro ao ler arquivo selecionado.');
    };

    leitor.readAsText(arquivo);
  });

  // Restaurar padrões iniciais
  const btnRestaurar = containerAjustes.querySelector('#btn-restaurar-padroes');
  const modalConfirmar = document.querySelector('#modal-confirmar-restauracao');
  const btnConfirmarRestauracao = modalConfirmar?.querySelector('#btn-confirmar-sim');
  const btnCancelarRestauracao = modalConfirmar?.querySelector('#btn-confirmar-nao');

  btnRestaurar?.addEventListener('click', () => {
    if (modalConfirmar) {
      modalConfirmar.classList.add('ativo');
      modalConfirmar.setAttribute('aria-hidden', 'false');
      btnCancelarRestauracao?.focus();
    }
  });

  btnCancelarRestauracao?.addEventListener('click', () => {
    if (modalConfirmar) {
      modalConfirmar.classList.remove('ativo');
      modalConfirmar.setAttribute('aria-hidden', 'true');
    }
  });

  btnConfirmarRestauracao?.addEventListener('click', () => {
    restaurarPadroesIniciais();
    carregarValoresNosControles();
    aplicarTemaEAcessibilidadeNoDocumento();
    if (callbackRecarregarInterface) callbackRecarregarInterface();

    if (modalConfirmar) {
      modalConfirmar.classList.remove('ativo');
      modalConfirmar.setAttribute('aria-hidden', 'true');
    }
    vibrarSeAtivo();
  });
}

/**
 * Aplica as classes e data-attributes no documento HTML conforme os ajustes
 */
export function aplicarTemaEAcessibilidadeNoDocumento() {
  const ajustes = obterAjustes();
  const html = document.documentElement;

  // Resolve o tema automático antes de aplicar os tokens de cor.
  configurarObservacaoPreferenciasSistema();
  const temaPreferido = ajustes.tema || 'auto';
  const prefereContraste = window.matchMedia?.('(prefers-contrast: more)').matches;
  const prefereEscuro = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const temaResolvido = temaPreferido === 'auto'
    ? (prefereContraste ? 'alto-contraste' : prefereEscuro ? 'escuro' : 'claro')
    : temaPreferido;

  html.setAttribute('data-theme', temaResolvido);
  html.setAttribute('data-theme-preference', temaPreferido);
  html.setAttribute('data-palette', ajustes.paletaDestaque || 'cacto');

  // Tamanho do texto: 'normal', 'grande', 'extra', 'gigante'
  html.setAttribute('data-text-size', ajustes.tamanhoTexto || 'normal');

  // Tamanho dos botões: 'confortavel', 'grande'
  html.setAttribute('data-button-size', ajustes.tamanhoBotao || 'confortavel');

  // Colunas da grade
  html.setAttribute('data-grid-cols', String(ajustes.colunasGrade || 1));

  // Redução de movimento
  if (ajustes.reduzirAnimacoes) {
    html.setAttribute('data-reduced-motion', 'true');
  } else {
    html.removeAttribute('data-reduced-motion');
  }

  // Mostrar pictogramas
  if (ajustes.mostrarPictogramas === false) {
    html.setAttribute('data-hide-pictograms', 'true');
  } else {
    html.removeAttribute('data-hide-pictograms');
  }
}

/**
 * Atualiza o tema automático quando as preferências do sistema mudam
 */
function configurarObservacaoPreferenciasSistema() {
  if (ouvintesPreferenciasSistemaConfigurados || !window.matchMedia) return;
  ouvintesPreferenciasSistemaConfigurados = true;

  ['(prefers-color-scheme: dark)', '(prefers-contrast: more)'].forEach(consulta => {
    const media = window.matchMedia(consulta);
    const atualizar = () => {
      if ((obterAjustes().tema || 'auto') === 'auto') {
        aplicarTemaEAcessibilidadeNoDocumento();
      }
    };

    if (media.addEventListener) {
      media.addEventListener('change', atualizar);
    } else {
      media.addListener?.(atualizar);
    }
  });

  const sincronizarAoRetornar = () => {
    if ((obterAjustes().tema || 'auto') === 'auto') {
      aplicarTemaEAcessibilidadeNoDocumento();
    }
  };
  window.addEventListener('focus', sincronizarAoRetornar);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) sincronizarAoRetornar();
  });
}

/**
 * Atualiza a pré-visualização ao vivo da tela de Ajustes
 */
function atualizarPreviaAjustes() {
  if (!containerAjustes) return;
  const ajustes = obterAjustes();
  const previa = containerAjustes.querySelector('#previa-ajustes');
  if (!previa) return;

  const nome = ajustes.nomeUsuario ? `Meu nome é ${ajustes.nomeUsuario}.` : 'Olá! Posso falar pela tela.';
  const texto = previa.querySelector('#previa-ajustes-texto');
  if (texto) texto.textContent = nome;

  const textoSize = ajustes.tamanhoTexto || 'normal';
  const botaoSize = ajustes.tamanhoBotao || 'confortavel';
  previa.setAttribute('data-preview-text', textoSize);
  previa.setAttribute('data-preview-button', botaoSize);
  previa.setAttribute('data-preview-palette', ajustes.paletaDestaque || 'cacto');
}

/**
 * Restabelece os valores padrão dos dois controles de voz
 */
export function restaurarControlesVoz() {
  const velocidade = containerAjustes?.querySelector('#ajuste-velocidade-voz');
  const tom = containerAjustes?.querySelector('#ajuste-tom-voz');
  if (velocidade) {
    velocidade.value = '1.0';
    containerAjustes.querySelector('#valor-velocidade-voz').textContent = '1.0x';
  }
  if (tom) {
    tom.value = '1.0';
    containerAjustes.querySelector('#valor-tom-voz').textContent = '1.0x';
  }
  salvarAjustes({ velocidade: 1, tom: 1 });
}

/**
 * Dispara vibração curta háptica se o recurso estiver habilitado
 * e suportado pelo hardware do smartphone
 */
export function vibrarSeAtivo(duracaoMs = 30) {
  const ajustes = obterAjustes();
  if (ajustes.vibracao && 'vibrate' in navigator && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(duracaoMs);
    } catch (_) {}
  }
}
