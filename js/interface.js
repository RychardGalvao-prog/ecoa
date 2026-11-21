/**
 * ecoa - Prancha Digital de Comunicação Alternativa e Aumentativa (CAA)
 * Projeto Acadêmico - Universidade Federal do Maranhão (UFMA)
 * Módulo: interface.js - Renderização do DOM, navegação, cartões de frase, digitação e modais
 */

import { APP_NAME, CONTEXTOS, RESPOSTAS_RAPIDAS, CATALOGO_ICONES } from './estado.js';
import {
  obterFrases,
  salvarFrases,
  incrementarUsoFrase,
  obterFraseAbertura,
  salvarFraseAbertura,
  obterHistoricoDigitado,
  adicionarAoHistoricoDigitado,
  limparHistoricoDigitado,
  obterNomeUsuario,
  salvarNomeUsuario,
  obterRespostasRapidas,
  salvarRespostasRapidas,
  restaurarRespostasRapidas
} from './armazenamento.js';
import {
  falar,
  parar,
  checarSeEstaFalando,
  obterIdFalando,
  inscreverEstadoFala,
  possuiVozPtBr
} from './voz.js';
import { abrirModoPalco } from './palco.js';
import { vibrarSeAtivo } from './ajustes.js';
import { renderIcone } from './icones.js';

// Estado da interface
let contextoAtivo = 'todas';
let modoEdicaoAtivo = false;
let fraseExcluidaRecente = null;
let timeoutDesfazerExclusao = null;

// Elementos de referência
let secaoFrases = null;
let secaoDigitar = null;
let secaoAjustes = null;
let navInferior = null;
let gradeFrases = null;
let containerFaixaContextos = null;
let cartaoAberturaTexto = null;
let bannerAvisoVoz = null;
let toastDesfazer = null;

// Monta a frase de abertura com o nome opcional do usuário
function obterFraseAberturaPersonalizada() {
  const nome = obterNomeUsuario();
  const fraseBase = obterFraseAbertura();
  return nome ? `Meu nome é ${nome}. ${fraseBase}` : fraseBase;
}

/**
 * Inicializa a interface gráfica do Ecoa
 */
export function inicializarInterface() {
  secaoFrases = document.getElementById('secao-frases');
  secaoDigitar = document.getElementById('secao-digitar');
  secaoAjustes = document.getElementById('secao-ajustes');
  navInferior = document.getElementById('navegacao-inferior');
  gradeFrases = document.getElementById('grade-frases');
  containerFaixaContextos = document.getElementById('faixa-contextos');
  cartaoAberturaTexto = document.getElementById('cartao-abertura-texto');
  bannerAvisoVoz = document.getElementById('banner-aviso-voz');
  toastDesfazer = document.getElementById('toast-desfazer');

  configurarNavegacao();
  configurarCartaoAbertura();
  renderizarFaixaContextos();
  renderizarGradeFrases();
  renderizarRespostasRapidas();
  configurarTelaDigitar();
  configurarModais();
  configurarRespostasRapidas();
  configurarAvisoVoz();
  configurarOndulacaoDeToque();
  configurarBoasVindas();
  atualizarSaudacaoHorario();

  // Inscreve no estado de fala para animar o cartão ativo
  inscreverEstadoFala((estado) => {
    atualizarVisualCartaoFalando(estado);
  });
}

/**
 * Atualiza a saudação por horário na faixa do cabeçalho
 */
function atualizarSaudacaoHorario() {
  const elemento = document.getElementById('saudacao-cabecalho');
  if (!elemento) return;
  const hora = new Date().getHours();
  elemento.textContent = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
}

/**
 * Cria uma ondulação curta no ponto do toque, sem depender de animações externas
 */
function configurarOndulacaoDeToque() {
  document.addEventListener('pointerdown', (evento) => {
    if (document.documentElement.hasAttribute('data-reduced-motion')) return;
    if (document.documentElement.dataset.theme === 'alto-contraste') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const onda = document.createElement('span');
    onda.className = 'onda-toque';
    onda.style.left = `${evento.clientX}px`;
    onda.style.top = `${evento.clientY}px`;
    document.body.appendChild(onda);
    onda.addEventListener('animationend', () => onda.remove(), { once: true });
  });
}

/**
 * Exibe a folha curta de boas-vindas apenas na primeira abertura
 * e permite revisá-la em Ajustes
 */
function configurarBoasVindas() {
  const modal = document.getElementById('modal-boas-vindas');
  if (!modal) return;

  let etapaAtual = 0;
  const passos = Array.from(modal.querySelectorAll('[data-passo-boas-vindas]'));
  const indicador = modal.querySelector('#boas-vindas-indicador');
  const botaoAvancar = modal.querySelector('#btn-boas-vindas-avancar');
  const campoNome = modal.querySelector('#boas-vindas-nome');
  let focoAnterior = null;

  const mostrarEtapa = () => {
    passos.forEach((passo, indice) => {
      passo.hidden = indice !== etapaAtual;
      const titulo = passo.querySelector('h2');
      if (titulo && titulo.id === 'boas-vindas-titulo') titulo.removeAttribute('id');
    });
    const tituloAtual = passos[etapaAtual]?.querySelector('h2');
    tituloAtual?.setAttribute('id', 'boas-vindas-titulo');
    if (indicador) indicador.textContent = `${etapaAtual + 1} de ${passos.length}`;
    if (botaoAvancar) botaoAvancar.textContent = etapaAtual === passos.length - 1 ? 'Começar' : 'Próximo';
    tituloAtual?.focus({ preventScroll: true });
  };

  const abrir = () => {
    focoAnterior = document.activeElement instanceof HTMLElement && document.activeElement !== document.body
      ? document.activeElement
      : null;
    if (campoNome) campoNome.value = obterNomeUsuario();
    etapaAtual = 0;
    mostrarEtapa();
    modal.classList.add('ativo');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-aberto');
    modal.querySelector('#btn-boas-vindas-fechar')?.focus();
  };

  const fechar = () => {
    localStorage.setItem('ecoa_boas_vindas_vista', 'true');
    modal.classList.remove('ativo');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-aberto');
    focoAnterior?.focus();
  };

  passos.forEach(passo => {
    passo.querySelector('h2')?.setAttribute('tabindex', '-1');
  });

  campoNome?.addEventListener('input', () => {
    salvarNomeUsuario(campoNome.value);
    window.dispatchEvent(new CustomEvent('ecoa-personalizacao'));
  });

  modal.querySelector('#btn-boas-vindas-pular')?.addEventListener('click', fechar);
  botaoAvancar?.addEventListener('click', () => {
    if (etapaAtual < passos.length - 1) {
      etapaAtual += 1;
      mostrarEtapa();
    } else {
      fechar();
    }
  });

  modal.querySelector('#btn-boas-vindas-fechar')?.addEventListener('click', fechar);
  document.getElementById('btn-rever-boas-vindas')?.addEventListener('click', abrir);

  if (localStorage.getItem('ecoa_boas_vindas_vista') !== 'true') {
    requestAnimationFrame(abrir);
  }
}

/**
 * Configura as abas da barra de navegação inferior (Frases, Digitar, Ajustes)
 */
function configurarNavegacao() {
  const botoesNav = navInferior.querySelectorAll('.nav-btn');
  botoesNav.forEach(btn => {
    btn.addEventListener('click', () => {
      const abaDestino = btn.getAttribute('data-aba');
      trocarAba(abaDestino);
      vibrarSeAtivo();
    });
  });

  // Botão de atalho para Ajustes no cabeçalho
  const btnTopoAjustes = document.getElementById('btn-topo-ajustes');
  btnTopoAjustes?.addEventListener('click', () => {
    trocarAba('ajustes');
    vibrarSeAtivo();
  });

  // Botão de alternar Modo Edição no topo
  const btnTopoEditar = document.getElementById('btn-topo-editar');
  btnTopoEditar?.addEventListener('click', () => {
    modoEdicaoAtivo = !modoEdicaoAtivo;
    btnTopoEditar.classList.toggle('ativo', modoEdicaoAtivo);
    btnTopoEditar.setAttribute('aria-pressed', String(modoEdicaoAtivo));
    document.body.classList.toggle('modo-edicao-ativo', modoEdicaoAtivo);

    // O botão flutuante '+' só aparece na tela Frases E quando em Modo Edição
    const fabAdicionar = document.getElementById('fab-adicionar-frase');
    if (fabAdicionar) {
      const telaFrasesAtiva = !secaoFrases.hidden;
      fabAdicionar.hidden = !(telaFrasesAtiva && modoEdicaoAtivo);
    }

    renderizarGradeFrases();
    vibrarSeAtivo();
  });

  // Botão flutuante (FAB) para adicionar nova frase
  const fabAdicionar = document.getElementById('fab-adicionar-frase');
  if (fabAdicionar) {
    fabAdicionar.hidden = true; // Oculto por padrão até ativar o modo edição
  }
  fabAdicionar?.addEventListener('click', () => {
    abrirModalEditarFrase();
    vibrarSeAtivo();
  });
}

/**
 * Troca a tela exibida com sincronização rigorosa de aba ativa e aria-current
 * @param {'frases'|'digitar'|'ajustes'} aba 
 */
export function trocarAba(aba) {
  const secoes = [
    { id: 'frases', el: secaoFrases },
    { id: 'digitar', el: secaoDigitar },
    { id: 'ajustes', el: secaoAjustes }
  ];

  secoes.forEach(s => {
    if (s.id === aba) {
      s.el.hidden = false;
      s.el.classList.add('tela-ativa');
    } else {
      s.el.hidden = true;
      s.el.classList.remove('tela-ativa');
    }
  });

  const botoesNav = navInferior.querySelectorAll('.nav-btn');
  botoesNav.forEach(b => {
    const ativo = b.getAttribute('data-aba') === aba;
    b.classList.toggle('ativo', ativo);
    b.setAttribute('aria-selected', String(ativo));
    if (ativo) {
      b.setAttribute('aria-current', 'page');
    } else {
      b.removeAttribute('aria-current');
    }
  });

  // Mostra ou oculta a faixa de respostas rápidas e FAB conforme a tela
  const faixaRespostas = document.getElementById('faixa-respostas-rapidas');
  const fabAdicionar = document.getElementById('fab-adicionar-frase');

  if (faixaRespostas) faixaRespostas.hidden = (aba !== 'frases');
  // O botão '+' só deve aparecer na tela de frases e se o modo de edição estiver ativado
  if (fabAdicionar) fabAdicionar.hidden = !(aba === 'frases' && modoEdicaoAtivo);

  // Ao entrar em Digitar, foca na caixa de texto
  if (aba === 'digitar') {
    const inputTexto = document.getElementById('input-digitar-livre');
    inputTexto?.focus();
    atualizarListaHistoricoDigitado();
  }
}

/**
 * Configura o Cartão de Abertura no topo da tela de frases
 */
function configurarCartaoAbertura() {
  const containerCartao = document.getElementById('cartao-abertura');
  const btnEditar = document.getElementById('btn-editar-abertura');
  const btnFalar = document.getElementById('btn-falar-abertura');
  const btnPalco = document.getElementById('btn-palco-abertura');

  const atualizarTextoExibido = () => {
    if (cartaoAberturaTexto) {
      cartaoAberturaTexto.textContent = obterFraseAberturaPersonalizada();
    }
  };

  atualizarTextoExibido();
  window.addEventListener('ecoa-personalizacao', atualizarTextoExibido);

  // Toque no corpo do cartão fala a frase
  containerCartao?.addEventListener('click', (evento) => {
    if (evento.target.closest('button')) return; // Deixa os botões internos tratarem o clique
    const frase = obterFraseAberturaPersonalizada();
    if (checarSeEstaFalando() && obterIdFalando() === 'cartao-abertura') {
      parar();
    } else {
      falar(frase, { id: 'cartao-abertura' });
      vibrarSeAtivo();
    }
  });

  btnFalar?.addEventListener('click', (evento) => {
    evento.stopPropagation();
    const frase = obterFraseAberturaPersonalizada();
    if (checarSeEstaFalando() && obterIdFalando() === 'cartao-abertura') {
      parar();
    } else {
      falar(frase, { id: 'cartao-abertura' });
      vibrarSeAtivo();
    }
  });

  btnPalco?.addEventListener('click', (evento) => {
    evento.stopPropagation();
    abrirModoPalco(obterFraseAberturaPersonalizada());
    vibrarSeAtivo();
  });

  btnEditar?.addEventListener('click', (evento) => {
    evento.stopPropagation();
    abrirModalEditarAbertura();
    vibrarSeAtivo();
  });
}

/**
 * Renderiza os chips de contexto horizontais com scroll suave
 */
function renderizarFaixaContextos() {
  if (!containerFaixaContextos) return;

  containerFaixaContextos.innerHTML = '';
  CONTEXTOS.forEach(ctx => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `chip-contexto ${ctx.id === contextoAtivo ? 'ativo' : ''}`;
    btn.setAttribute('data-contexto', ctx.id);
    btn.setAttribute('aria-pressed', String(ctx.id === contextoAtivo));
    btn.innerHTML = `${renderIcone(ctx.icone, 'chip-icone', 18)} <span>${ctx.rotulo}</span>`;

    btn.addEventListener('click', () => {
      contextoAtivo = ctx.id;
      renderizarFaixaContextos();
      renderizarGradeFrases();
      vibrarSeAtivo();
    });

    containerFaixaContextos.appendChild(btn);
  });

  let arrastando = false;
  let inicioX = 0;
  let inicioScroll = 0;
  containerFaixaContextos.onpointerdown = (evento) => {
    if (evento.pointerType === 'mouse') {
      arrastando = true;
      inicioX = evento.clientX;
      inicioScroll = containerFaixaContextos.scrollLeft;
      containerFaixaContextos.setPointerCapture?.(evento.pointerId);
    }
  };
  containerFaixaContextos.onpointermove = (evento) => {
    if (!arrastando) return;
    containerFaixaContextos.scrollLeft = inicioScroll - (evento.clientX - inicioX);
  };
  const terminarArraste = () => { arrastando = false; };
  containerFaixaContextos.onpointerup = terminarArraste;
  containerFaixaContextos.onpointercancel = terminarArraste;
}

/**
 * Renderiza a grade de frases conforme o contexto selecionado e modo de edição
 */
export function renderizarGradeFrases() {
  if (!gradeFrases) return;

  gradeFrases.innerHTML = '';
  const todasFrases = obterFrases();
  let frasesFiltradas = [];

  if (contextoAtivo === 'mais_usadas') {
    // Ordena pela contagem local de uso em ordem decrescente
    frasesFiltradas = todasFrases
      .slice()
      .sort((a, b) => (b.uso || 0) - (a.uso || 0));
  } else if (contextoAtivo === 'todas') {
    frasesFiltradas = todasFrases.slice().sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  } else {
    frasesFiltradas = todasFrases
      .filter(f => f.contexto === contextoAtivo)
      .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  }

  if (frasesFiltradas.length === 0) {
    const vazio = document.createElement('div');
    vazio.className = 'aviso-vazio';
    if (contextoAtivo === 'mais_usadas') {
      vazio.innerHTML = `
        <div class="vazio-onda" aria-hidden="true">eco</div>
        <p>Suas frases mais faladas vão aparecer aqui.</p>
      `;
    } else {
      vazio.innerHTML = `
        <p>Nenhuma frase cadastrada neste contexto.</p>
        <button type="button" class="btn-secundario" id="btn-adicionar-vazio">Adicionar frase</button>
      `;
    }
    vazio.querySelector('#btn-adicionar-vazio')?.addEventListener('click', () => {
      abrirModalEditarFrase(null, contextoAtivo !== 'mais_usadas' && contextoAtivo !== 'todas' ? contextoAtivo : 'secretaria');
    });
    gradeFrases.appendChild(vazio);
    return;
  }

  const idFalando = obterIdFalando();

  frasesFiltradas.forEach((frase, index) => {
    const card = document.createElement('article');
    card.className = `cartao-frase ${idFalando === frase.id ? 'falando' : ''}`;
    card.setAttribute('data-id', frase.id);
    card.setAttribute('data-contexto', frase.contexto);

    const textoExibido = frase.texto === 'Meu nome é ____.' && obterNomeUsuario()
      ? `Meu nome é ${obterNomeUsuario()}.`
      : frase.texto;

    // Pictograma (SVG ou Emoji)
    let pictogramaHtml = '';
    if (frase.emoji) {
      pictogramaHtml = `<span class="cartao-emoji" aria-hidden="true">${frase.emoji}</span>`;
    } else {
      pictogramaHtml = renderIcone(frase.icone || 'message-square', 'cartao-icone', 28);
    }

    // Estrutura de botões de edição se o modo edição estiver ativo
    let acoesEdicaoHtml = '';
    if (modoEdicaoAtivo) {
      acoesEdicaoHtml = `
        <div class="cartao-acoes-edicao" role="toolbar" aria-label="Ações de edição da frase">
          <button type="button" class="btn-acao-edicao btn-subir" data-id="${frase.id}" title="Mover para cima" aria-label="Mover para cima" ${index === 0 ? 'disabled' : ''}>
            ${renderIcone('arrow-up', '', 18)}
          </button>
          <button type="button" class="btn-acao-edicao btn-descer" data-id="${frase.id}" title="Mover para baixo" aria-label="Mover para baixo" ${index === frasesFiltradas.length - 1 ? 'disabled' : ''}>
            ${renderIcone('arrow-down', '', 18)}
          </button>
          <button type="button" class="btn-acao-edicao btn-editar" data-id="${frase.id}" title="Editar frase" aria-label="Editar frase">
            ${renderIcone('pencil', '', 18)}
          </button>
          <button type="button" class="btn-acao-edicao btn-excluir" data-id="${frase.id}" title="Excluir frase" aria-label="Excluir frase">
            ${renderIcone('trash-2', '', 18)}
          </button>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="cartao-onda-fala" aria-hidden="true"></div>
      <div class="cartao-corpo">
        <div class="cartao-pictograma">${pictogramaHtml}</div>
        <p class="cartao-texto">${textoExibido}</p>
      </div>
      <div class="cartao-rodape">
        <button type="button" class="btn-cartao-palco" title="Abrir no Modo Palco" aria-label="Abrir no Modo Palco: ${textoExibido}">
          ${renderIcone('maximize-2', '', 20)}
          <span class="sr-only">Palco</span>
        </button>
        <button type="button" class="btn-cartao-parar" title="Parar voz" aria-label="Parar voz">
          ${renderIcone('square', '', 20)}
        </button>
      </div>
      ${acoesEdicaoHtml}
    `;

    if (modoEdicaoAtivo) {
      card.draggable = true;
      card.addEventListener('dragstart', (evento) => {
        evento.dataTransfer?.setData('text/plain', frase.id);
        card.classList.add('arrastando');
      });
      card.addEventListener('dragend', () => card.classList.remove('arrastando'));
      card.addEventListener('dragover', (evento) => evento.preventDefault());
      card.addEventListener('drop', (evento) => {
        evento.preventDefault();
        const idOrigem = evento.dataTransfer?.getData('text/plain');
        if (!idOrigem || idOrigem === frase.id) return;
        reordenarFrasePorArraste(idOrigem, frase.id);
      });
    }

    // Toque no corpo do cartão fala a frase
    const corpo = card.querySelector('.cartao-corpo');
    corpo?.addEventListener('click', () => {
      if (checarSeEstaFalando() && obterIdFalando() === frase.id) {
        parar();
      } else {
        incrementarUsoFrase(frase.id);
        falar(textoExibido, { id: frase.id });
        vibrarSeAtivo();
      }
    });

    // Botão de parar fala
    const btnParar = card.querySelector('.btn-cartao-parar');
    btnParar?.addEventListener('click', (e) => {
      e.stopPropagation();
      parar();
      vibrarSeAtivo();
    });

    // Botão do Modo Palco
    const btnPalco = card.querySelector('.btn-cartao-palco');
    btnPalco?.addEventListener('click', (e) => {
      e.stopPropagation();
      incrementarUsoFrase(frase.id);
      abrirModoPalco(textoExibido);
      vibrarSeAtivo();
    });

    // Eventos de edição
    if (modoEdicaoAtivo) {
      card.querySelector('.btn-subir')?.addEventListener('click', (e) => {
        e.stopPropagation();
        moverFrase(frase.id, -1);
      });
      card.querySelector('.btn-descer')?.addEventListener('click', (e) => {
        e.stopPropagation();
        moverFrase(frase.id, 1);
      });
      card.querySelector('.btn-editar')?.addEventListener('click', (e) => {
        e.stopPropagation();
        abrirModalEditarFrase(frase);
      });
      card.querySelector('.btn-excluir')?.addEventListener('click', (e) => {
        e.stopPropagation();
        excluirFraseComDesfazer(frase);
      });
    }

    gradeFrases.appendChild(card);
  });
}

/**
 * Atualiza visualmente o cartão que está falando no momento
 * @param {{ falando: boolean, id: string|null }} estado 
 */
function atualizarVisualCartaoFalando(estado) {
  // Cartão de abertura
  const cartaoAbertura = document.getElementById('cartao-abertura');
  if (cartaoAbertura) {
    const falandoAbertura = estado.falando && estado.id === 'cartao-abertura';
    cartaoAbertura.classList.toggle('falando', falandoAbertura);
    const btnFalar = document.getElementById('btn-falar-abertura');
    if (btnFalar) {
      btnFalar.innerHTML = falandoAbertura ? renderIcone('square', '', 20) : renderIcone('volume-2', '', 20);
      btnFalar.setAttribute('aria-label', falandoAbertura ? 'Parar fala' : 'Falar frase de abertura');
    }
  }

  // Cartões da grade
  const cards = gradeFrases?.querySelectorAll('.cartao-frase');
  cards?.forEach(card => {
    const id = card.getAttribute('data-id');
    const falando = estado.falando && estado.id === id;
    card.classList.toggle('falando', falando);
  });

  // Anúncio acessível para leitores de tela
  const ariaLive = document.getElementById('aria-live-anuncios');
  if (ariaLive) {
    if (estado.falando && estado.texto) {
      ariaLive.textContent = `Falando: ${estado.texto}`;
    } else {
      ariaLive.textContent = '';
    }
  }
}

/**
 * Renderiza a faixa fixa de respostas rápidas
 */
function renderizarRespostasRapidas() {
  const container = document.getElementById('grade-respostas-rapidas');
  if (!container) return;

  container.innerHTML = '';
  obterRespostasRapidas().forEach(resp => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-resposta-rapida';
    btn.innerHTML = `${renderIcone(resp.icone, '', 18)} <span>${resp.texto}</span>`;

    btn.addEventListener('click', () => {
      falar(resp.texto, { id: `resp-${resp.texto}` });
      vibrarSeAtivo();
    });

    container.appendChild(btn);
  });
}

/**
 * Configurações da tela "Digitar"
 */
function configurarTelaDigitar() {
  const input = document.getElementById('input-digitar-livre');
  const btnFalar = document.getElementById('btn-digitar-falar');
  const btnPalco = document.getElementById('btn-digitar-palco');
  const btnSalvar = document.getElementById('btn-digitar-salvar');
  const btnLimpar = document.getElementById('btn-digitar-limpar');

  btnFalar?.addEventListener('click', () => {
    const texto = (input?.value || '').trim();
    if (!texto) return;

    adicionarAoHistoricoDigitado(texto);
    atualizarListaHistoricoDigitado();
    falar(texto, { id: 'digitar' });
    vibrarSeAtivo();
  });

  btnPalco?.addEventListener('click', () => {
    const texto = (input?.value || '').trim();
    if (!texto) return;

    adicionarAoHistoricoDigitado(texto);
    atualizarListaHistoricoDigitado();
    abrirModoPalco(texto);
    vibrarSeAtivo();
  });

  btnSalvar?.addEventListener('click', () => {
    const texto = (input?.value || '').trim();
    if (!texto) return;

    abrirModalEditarFrase({ texto });
    vibrarSeAtivo();
  });

  btnLimpar?.addEventListener('click', () => {
    if (input) {
      input.value = '';
      input.focus();
    }
    vibrarSeAtivo();
  });

  // Enter com Ctrl ou Shift pode acionar a fala
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      btnFalar?.click();
    }
  });

  // Limpar histórico de frases recentes
  const btnLimparHistorico = document.getElementById('btn-limpar-historico');
  btnLimparHistorico?.addEventListener('click', () => {
    limparHistoricoDigitado();
    atualizarListaHistoricoDigitado();
    vibrarSeAtivo();
  });
}

/**
 * Atualiza a lista de frases digitadas recentes
 */
function atualizarListaHistoricoDigitado() {
  const container = document.getElementById('lista-historico-digitado');
  if (!container) return;

  const historico = obterHistoricoDigitado();
  container.innerHTML = '';

  if (historico.length === 0) {
    container.innerHTML = '<p class="texto-secundario-dica">Nenhuma frase digitada recentemente.</p>';
    return;
  }

  historico.forEach(frase => {
    const item = document.createElement('div');
    item.className = 'item-historico';
    item.innerHTML = `
      <button type="button" class="btn-item-historico-texto" title="Falar">${frase}</button>
      <button type="button" class="btn-item-historico-palco" title="Abrir no Palco" aria-label="Abrir no Modo Palco">
        ${renderIcone('maximize-2', '', 18)}
      </button>
    `;

    item.querySelector('.btn-item-historico-texto')?.addEventListener('click', () => {
      const input = document.getElementById('input-digitar-livre');
      if (input) input.value = frase;
      falar(frase, { id: 'historico' });
      vibrarSeAtivo();
    });

    item.querySelector('.btn-item-historico-palco')?.addEventListener('click', () => {
      abrirModoPalco(frase);
      vibrarSeAtivo();
    });

    container.appendChild(item);
  });
}

/**
 * Exclui uma frase exibindo aviso temporário com opção "Desfazer"
 * Atende à exigência técnica de evitar caixas de confirmação intrusivas
 * @param {Object} frase 
 */
function excluirFraseComDesfazer(frase) {
  clearTimeout(timeoutDesfazerExclusao);

  const todasFrases = obterFrases();
  fraseExcluidaRecente = { ...frase };

  // Remove da lista
  const novaLista = todasFrases.filter(f => f.id !== frase.id);
  salvarFrases(novaLista);
  renderizarGradeFrases();
  vibrarSeAtivo();

  // Exibe o Toast com botão "Desfazer"
  if (toastDesfazer) {
    const textoAviso = toastDesfazer.querySelector('#toast-desfazer-texto');
    if (textoAviso) {
      textoAviso.textContent = `Frase "${frase.texto.slice(0, 24)}..." removida.`;
    }
    toastDesfazer.classList.add('ativo');
    toastDesfazer.setAttribute('aria-hidden', 'false');

    // Desaparece após 6 segundos caso o usuário não clique em desfazer
    timeoutDesfazerExclusao = setTimeout(() => {
      toastDesfazer.classList.remove('ativo');
      toastDesfazer.setAttribute('aria-hidden', 'true');
      fraseExcluidaRecente = null;
    }, 6000);
  }
}

/**
 * Reverte a exclusão recente da frase
 */
function desfazerExclusao() {
  if (!fraseExcluidaRecente) return;

  const todasFrases = obterFrases();
  todasFrases.push(fraseExcluidaRecente);
  todasFrases.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  salvarFrases(todasFrases);

  fraseExcluidaRecente = null;
  clearTimeout(timeoutDesfazerExclusao);

  if (toastDesfazer) {
    toastDesfazer.classList.remove('ativo');
    toastDesfazer.setAttribute('aria-hidden', 'true');
  }

  renderizarGradeFrases();
  vibrarSeAtivo();
}

/**
 * Move a ordem da frase para cima (-1) ou para baixo (+1)
 * @param {string} idFrase 
 * @param {-1|1} direcao 
 */
function moverFrase(idFrase, direcao) {
  const todasFrases = obterFrases();
  const index = todasFrases.findIndex(f => f.id === idFrase);
  if (index === -1) return;

  const novoIndex = index + direcao;
  if (novoIndex < 0 || novoIndex >= todasFrases.length) return;

  // Troca posições
  const temp = todasFrases[index];
  todasFrases[index] = todasFrases[novoIndex];
  todasFrases[novoIndex] = temp;

  // Atualiza campo 'ordem'
  todasFrases.forEach((f, i) => {
    f.ordem = i + 1;
  });

  salvarFrases(todasFrases);
  renderizarGradeFrases();
  vibrarSeAtivo();
}

function reordenarFrasePorArraste(idOrigem, idDestino) {
  const todasFrases = obterFrases();
  const origem = todasFrases.findIndex(f => f.id === idOrigem);
  const destino = todasFrases.findIndex(f => f.id === idDestino);
  if (origem === -1 || destino === -1) return;

  const [frase] = todasFrases.splice(origem, 1);
  todasFrases.splice(destino, 0, frase);
  todasFrases.forEach((item, indice) => { item.ordem = indice + 1; });
  salvarFrases(todasFrases);
  renderizarGradeFrases();
  vibrarSeAtivo();
}

/**
 * Configura modais (Adicionar/Editar frase, Editar Abertura e Toast Desfazer)
 */
function configurarModais() {
  // Toast Desfazer
  const btnDesfazer = toastDesfazer?.querySelector('#btn-toast-desfazer');
  btnDesfazer?.addEventListener('click', () => {
    desfazerExclusao();
  });

  // Modal Abertura
  const modalAbertura = document.getElementById('modal-editar-abertura');
  const btnSalvarAbertura = modalAbertura?.querySelector('#btn-salvar-abertura');
  const btnCancelarAbertura = modalAbertura?.querySelector('#btn-cancelar-abertura');
  const inputAbertura = modalAbertura?.querySelector('#input-abertura-texto');

  btnSalvarAbertura?.addEventListener('click', () => {
    const novoTexto = (inputAbertura?.value || '').trim();
    if (novoTexto) {
      salvarFraseAbertura(novoTexto);
      window.dispatchEvent(new CustomEvent('ecoa-personalizacao'));
    }
    modalAbertura.classList.remove('ativo');
    modalAbertura.setAttribute('aria-hidden', 'true');
    vibrarSeAtivo();
  });

  btnCancelarAbertura?.addEventListener('click', () => {
    modalAbertura.classList.remove('ativo');
    modalAbertura.setAttribute('aria-hidden', 'true');
  });

  // Modal Adicionar / Editar Frase
  const modalFrase = document.getElementById('modal-editar-frase');
  const formFrase = modalFrase?.querySelector('#form-editar-frase');
  const btnCancelarFrase = modalFrase?.querySelector('#btn-cancelar-frase');

  btnCancelarFrase?.addEventListener('click', () => {
    modalFrase.classList.remove('ativo');
    modalFrase.setAttribute('aria-hidden', 'true');
  });

  formFrase?.addEventListener('submit', (e) => {
    e.preventDefault();
    salvarDadosModalFrase();
  });
}

/**
 * Abre o modal para editar o Cartão de Abertura
 */
function abrirModalEditarAbertura() {
  const modal = document.getElementById('modal-editar-abertura');
  const input = modal?.querySelector('#input-abertura-texto');
  if (!modal || !input) return;

  input.value = obterFraseAbertura();
  modal.classList.add('ativo');
  modal.setAttribute('aria-hidden', 'false');
  input.focus();
}

/**
 * Abre o modal de Adicionar ou Editar Frase
 * @param {Object} [fraseParaEditar] - Se fornecido, edita; se nulo, cria nova
 * @param {string} [contextoPadrao] - Contexto pré-selecionado
 */
export function abrirModalEditarFrase(fraseParaEditar = null, contextoPadrao = 'secretaria') {
  const modal = document.getElementById('modal-editar-frase');
  if (!modal) return;

  const tituloModal = modal.querySelector('#modal-frase-titulo');
  const inputId = modal.querySelector('#input-frase-id');
  const inputTexto = modal.querySelector('#input-frase-texto');
  const selectContexto = modal.querySelector('#select-frase-contexto');
  const inputEmoji = modal.querySelector('#input-frase-emoji');
  const containerIcones = modal.querySelector('#grade-seletor-icones');

  // Popula opções de contexto
  if (selectContexto) {
    selectContexto.innerHTML = '';
    CONTEXTOS.filter(c => c.id !== 'mais_usadas' && c.id !== 'todas').forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.rotulo;
      selectContexto.appendChild(opt);
    });
  }

  // Popula grade de pictogramas selecionáveis
  let iconeSelecionado = fraseParaEditar?.icone || 'info';

  if (containerIcones) {
    containerIcones.innerHTML = '';
    CATALOGO_ICONES.forEach(cat => {
      const btnIcone = document.createElement('button');
      btnIcone.type = 'button';
      btnIcone.className = `btn-escolher-icone ${cat.id === iconeSelecionado ? 'selecionado' : ''}`;
      btnIcone.setAttribute('data-icone', cat.id);
      btnIcone.setAttribute('title', cat.rotulo);
      btnIcone.setAttribute('aria-label', cat.rotulo);
      btnIcone.innerHTML = renderIcone(cat.id, '', 22);

      btnIcone.addEventListener('click', () => {
        containerIcones.querySelectorAll('.btn-escolher-icone').forEach(b => b.classList.remove('selecionado'));
        btnIcone.classList.add('selecionado');
        iconeSelecionado = cat.id;
        vibrarSeAtivo();
      });

      containerIcones.appendChild(btnIcone);
    });
  }

  // Preenche dados se for edição
  if (fraseParaEditar && fraseParaEditar.id) {
    if (tituloModal) tituloModal.textContent = 'Editar frase';
    if (inputId) inputId.value = fraseParaEditar.id;
    if (inputTexto) inputTexto.value = fraseParaEditar.texto || '';
    if (selectContexto) selectContexto.value = fraseParaEditar.contexto || 'secretaria';
    if (inputEmoji) inputEmoji.value = fraseParaEditar.emoji || '';
  } else {
    if (tituloModal) tituloModal.textContent = 'Nova frase';
    if (inputId) inputId.value = '';
    if (inputTexto) inputTexto.value = fraseParaEditar?.texto || '';
    if (selectContexto) selectContexto.value = contextoPadrao;
    if (inputEmoji) inputEmoji.value = '';
  }

  modal.setAttribute('data-icone-selecionado', iconeSelecionado);
  modal.classList.add('ativo');
  modal.setAttribute('aria-hidden', 'false');
  inputTexto?.focus();
}

/**
 * Salva a frase a partir dos campos do modal
 */
function salvarDadosModalFrase() {
  const modal = document.getElementById('modal-editar-frase');
  if (!modal) return;

  const inputId = modal.querySelector('#input-frase-id');
  const inputTexto = modal.querySelector('#input-frase-texto');
  const selectContexto = modal.querySelector('#select-frase-contexto');
  const inputEmoji = modal.querySelector('#input-frase-emoji');
  const btnIconeSelecionado = modal.querySelector('.btn-escolher-icone.selecionado');

  const texto = (inputTexto?.value || '').trim();
  if (!texto) {
    alert('Por favor, informe o texto da frase.');
    inputTexto?.focus();
    return;
  }

  const id = (inputId?.value || '').trim();
  const contexto = selectContexto?.value || 'secretaria';
  const emoji = (inputEmoji?.value || '').trim();
  const icone = btnIconeSelecionado?.getAttribute('data-icone') || 'info';

  const todasFrases = obterFrases();

  if (id) {
    // Atualização de frase existente
    const index = todasFrases.findIndex(f => f.id === id);
    if (index !== -1) {
      todasFrases[index].texto = texto;
      todasFrases[index].contexto = contexto;
      todasFrases[index].icone = icone;
      todasFrases[index].emoji = emoji;
    }
  } else {
    // Nova frase
    const novaFrase = {
      id: `frase-${Date.now()}`,
      texto,
      contexto,
      icone,
      emoji,
      uso: 0,
      ordem: todasFrases.length + 1
    };
    todasFrases.push(novaFrase);
  }

  salvarFrases(todasFrases);
  modal.classList.remove('ativo');
  modal.setAttribute('aria-hidden', 'true');

  renderizarGradeFrases();
  vibrarSeAtivo();
}

function configurarRespostasRapidas() {
  const modal = document.getElementById('modal-respostas-rapidas');
  const lista = document.getElementById('lista-editar-respostas');
  const abrir = document.getElementById('btn-editar-respostas');
  const cancelar = document.getElementById('btn-cancelar-respostas');
  const salvar = document.getElementById('btn-salvar-respostas');
  const restaurar = document.getElementById('btn-restaurar-respostas');
  if (!modal || !lista) return;

  const preencher = (respostas) => {
    lista.innerHTML = '';
    respostas.forEach((item, indice) => {
      const linha = document.createElement('div');
      linha.className = 'item-editar-resposta';
      linha.innerHTML = `
        <label for="resposta-texto-${indice}">Resposta ${indice + 1}</label>
        <input id="resposta-texto-${indice}" type="text" maxlength="24" value="${item.texto.replace(/"/g, '&quot;')}">
        <select id="resposta-icone-${indice}" aria-label="Ícone da resposta ${indice + 1}">
          ${CATALOGO_ICONES.map(cat => `<option value="${cat.id}" ${cat.id === item.icone ? 'selected' : ''}>${cat.rotulo}</option>`).join('')}
        </select>
      `;
      lista.appendChild(linha);
    });
  };

  abrir?.addEventListener('click', () => {
    preencher(obterRespostasRapidas());
    modal.classList.add('ativo');
    modal.setAttribute('aria-hidden', 'false');
  });
  cancelar?.addEventListener('click', () => {
    modal.classList.remove('ativo');
    modal.setAttribute('aria-hidden', 'true');
  });
  restaurar?.addEventListener('click', () => {
    restaurarRespostasRapidas();
    preencher(obterRespostasRapidas());
    renderizarRespostasRapidas();
  });
  salvar?.addEventListener('click', () => {
    const respostas = Array.from({ length: 4 }, (_, indice) => ({
      texto: document.getElementById(`resposta-texto-${indice}`)?.value || '',
      icone: document.getElementById(`resposta-icone-${indice}`)?.value || 'check-circle'
    }));
    salvarRespostasRapidas(respostas);
    renderizarRespostasRapidas();
    modal.classList.remove('ativo');
    modal.setAttribute('aria-hidden', 'true');
    vibrarSeAtivo();
  });
}

/**
 * Mostra aviso de ausência de voz pt-BR caso o navegador não suporte
 */
function configurarAvisoVoz() {
  if (!bannerAvisoVoz) return;

  // Verifica após carregamento das vozes
  setTimeout(() => {
    if (!possuiVozPtBr()) {
      bannerAvisoVoz.hidden = false;
      const fecharAviso = bannerAvisoVoz.querySelector('#btn-fechar-aviso-voz');
      fecharAviso?.addEventListener('click', () => {
        bannerAvisoVoz.hidden = true;
      });
    } else {
      bannerAvisoVoz.hidden = true;
    }
  }, 1200);
}
