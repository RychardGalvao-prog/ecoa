/**
 * ecoa - Prancha Digital de Comunicação Alternativa e Aumentativa (CAA)
 * Projeto Acadêmico - Universidade Federal do Maranhão (UFMA)
 * Módulo: armazenamento.js - Persistência em localStorage, migrações, exportação e importação
 */

import {
  APP_NAME,
  SCHEMA_VERSION,
  FRASES_INICIAIS,
  FRASE_ABERTURA_PADRAO,
  AJUSTES_PADRAO,
  RESPOSTAS_RAPIDAS
} from './estado.js';

const CHAVE_ARMAZENAMENTO = 'ecoa_app_dados_v1';
const LIMITE_HISTORICO_DIGITADO = 12;

/**
 * Estrutura base de dados persistida
 */
function obterDadosPadrao() {
  return {
    schemaVersion: SCHEMA_VERSION,
    dataAtualizacao: new Date().toISOString(),
    fraseAbertura: FRASE_ABERTURA_PADRAO,
    frases: JSON.parse(JSON.stringify(FRASES_INICIAIS)),
    ajustes: { ...AJUSTES_PADRAO },
    respostasRapidas: JSON.parse(JSON.stringify(RESPOSTAS_RAPIDAS)),
    historicoDigitado: []
  };
}

/**
 * Carrega todos os dados do localStorage com migração automática
 * @returns {Object} Dados completos do app
 */
export function carregarTudo() {
  try {
    const raw = localStorage.getItem(CHAVE_ARMAZENAMENTO);
    if (!raw) {
      const padrao = obterDadosPadrao();
      salvarTudo(padrao);
      return padrao;
    }

    const dados = JSON.parse(raw);

    // Validação e migração de versão do esquema
    if (!dados.schemaVersion || dados.schemaVersion < SCHEMA_VERSION) {
      console.info(`[${APP_NAME}] Migrando dados da versão ${dados.schemaVersion} para ${SCHEMA_VERSION}`);
      dados.schemaVersion = SCHEMA_VERSION;
      // Garante que campos novos existam
      if (!dados.fraseAbertura) dados.fraseAbertura = FRASE_ABERTURA_PADRAO;
      if (!Array.isArray(dados.frases)) dados.frases = JSON.parse(JSON.stringify(FRASES_INICIAIS));
      if (!dados.ajustes) dados.ajustes = { ...AJUSTES_PADRAO };
      if (!Array.isArray(dados.respostasRapidas) || dados.respostasRapidas.length !== 4) {
        dados.respostasRapidas = JSON.parse(JSON.stringify(RESPOSTAS_RAPIDAS));
      }
      if (!Array.isArray(dados.historicoDigitado)) dados.historicoDigitado = [];
      salvarTudo(dados);
    }

    // Mescla ajustes para garantir que novas opções estejam presentes
    dados.ajustes = { ...AJUSTES_PADRAO, ...(dados.ajustes || {}) };
    if (!Array.isArray(dados.respostasRapidas) || dados.respostasRapidas.length !== 4) {
      dados.respostasRapidas = JSON.parse(JSON.stringify(RESPOSTAS_RAPIDAS));
    }

    return dados;
  } catch (erro) {
    console.error(`[${APP_NAME}] Erro ao ler localStorage:`, erro);
    return obterDadosPadrao();
  }
}

/**
 * Salva o objeto completo no localStorage
 * @param {Object} dados 
 * @returns {boolean} Sucesso da gravação
 */
export function salvarTudo(dados) {
  try {
    dados.dataAtualizacao = new Date().toISOString();
    localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(dados));
    return true;
  } catch (erro) {
    console.error(`[${APP_NAME}] Erro ao gravar no localStorage:`, erro);
    return false;
  }
}

/**
 * Obtém a lista atual de frases
 * @returns {Array}
 */
export function obterFrases() {
  const dados = carregarTudo();
  return dados.frases || [];
}

/**
 * Salva a lista de frases
 * @param {Array} frases 
 */
export function salvarFrases(frases) {
  const dados = carregarTudo();
  dados.frases = frases;
  return salvarTudo(dados);
}

/**
 * Incrementa a contagem de uso de uma frase (para ordenação "Mais usadas")
 * @param {string} idFrase 
 */
export function incrementarUsoFrase(idFrase) {
  const dados = carregarTudo();
  const frase = dados.frases.find(f => f.id === idFrase);
  if (frase) {
    frase.uso = (frase.uso || 0) + 1;
    frase.ultimoUso = new Date().toISOString();
    salvarTudo(dados);
  }
}

/**
 * Obtém a frase do Cartão de Abertura
 * @returns {string}
 */
export function obterFraseAbertura() {
  const dados = carregarTudo();
  return dados.fraseAbertura || FRASE_ABERTURA_PADRAO;
}

/**
 * Salva a frase do Cartão de Abertura
 * @param {string} texto 
 */
export function salvarFraseAbertura(texto) {
  const dados = carregarTudo();
  dados.fraseAbertura = (texto || '').trim() || FRASE_ABERTURA_PADRAO;
  return salvarTudo(dados);
}

/**
 * Obtém os ajustes salvos
 * @returns {Object}
 */
export function obterAjustes() {
  const dados = carregarTudo();
  return dados.ajustes || { ...AJUSTES_PADRAO };
}

/**
 * Obtém o nome personalizado exibido em frases de apresentação
 * @returns {string}
 */
export function obterNomeUsuario() {
  const ajustes = obterAjustes();
  return (ajustes.nomeUsuario || '').trim();
}

/**
 * Salva o nome personalizado do usuário
 * @param {string} nome
 * @returns {boolean}
 */
export function salvarNomeUsuario(nome) {
  const limpo = (nome || '')
    .trim()
    .slice(0, 40)
    .toLocaleLowerCase('pt-BR')
    .replace(/(^|[\s'-])(\p{L})/gu, (_, separador, letra) => `${separador}${letra.toLocaleUpperCase('pt-BR')}`);
  return salvarAjustes({ nomeUsuario: limpo });
}

/**
 * Salva os ajustes
 * @param {Object} novosAjustes 
 */
export function salvarAjustes(novosAjustes) {
  const dados = carregarTudo();
  dados.ajustes = { ...dados.ajustes, ...novosAjustes };
  return salvarTudo(dados);
}

/**
 * Obtém o histórico de frases digitadas livremente
 * @returns {Array<string>}
 */
export function obterHistoricoDigitado() {
  const dados = carregarTudo();
  return dados.historicoDigitado || [];
}

/**
 * Adiciona uma frase falada ao histórico de digitação (sem duplicatas consecutivas)
 * @param {string} texto 
 */
export function adicionarAoHistoricoDigitado(texto) {
  const limpo = (texto || '').trim();
  if (!limpo) return;

  const dados = carregarTudo();
  let historico = dados.historicoDigitado || [];

  // Remove ocorrência anterior para trazer a frase para o topo
  historico = historico.filter(item => item.toLowerCase() !== limpo.toLowerCase());
  historico.unshift(limpo);

  // Mantém apenas o limite configurado
  if (historico.length > LIMITE_HISTORICO_DIGITADO) {
    historico = historico.slice(0, LIMITE_HISTORICO_DIGITADO);
  }

  dados.historicoDigitado = historico;
  salvarTudo(dados);
}

/**
 * Limpa todo o histórico de digitação
 */
export function limparHistoricoDigitado() {
  const dados = carregarTudo();
  dados.historicoDigitado = [];
  salvarTudo(dados);
}

export function obterRespostasRapidas() {
  const dados = carregarTudo();
  if (!Array.isArray(dados.respostasRapidas) || dados.respostasRapidas.length !== 4) {
    return JSON.parse(JSON.stringify(RESPOSTAS_RAPIDAS));
  }
  return dados.respostasRapidas.map((item, indice) => ({
    texto: typeof item.texto === 'string' && item.texto.trim()
      ? item.texto.trim().slice(0, 24)
      : RESPOSTAS_RAPIDAS[indice].texto,
    icone: typeof item.icone === 'string' && item.icone.trim()
      ? item.icone.trim()
      : RESPOSTAS_RAPIDAS[indice].icone
  }));
}

export function salvarRespostasRapidas(respostas) {
  const dados = carregarTudo();
  dados.respostasRapidas = Array.from({ length: 4 }, (_, indice) => {
    const item = respostas?.[indice] || RESPOSTAS_RAPIDAS[indice];
    return {
      texto: typeof item.texto === 'string' && item.texto.trim()
        ? item.texto.trim().slice(0, 24)
        : RESPOSTAS_RAPIDAS[indice].texto,
      icone: typeof item.icone === 'string' && item.icone.trim()
        ? item.icone.trim()
        : RESPOSTAS_RAPIDAS[indice].icone
    };
  });
  return salvarTudo(dados);
}

export function restaurarRespostasRapidas() {
  return salvarRespostasRapidas(JSON.parse(JSON.stringify(RESPOSTAS_RAPIDAS)));
}

/**
 * Restaura as frases e abertura aos valores padrão de fábrica
 */
export function restaurarPadroesIniciais() {
  const dados = carregarTudo();
  dados.frases = JSON.parse(JSON.stringify(FRASES_INICIAIS));
  dados.fraseAbertura = FRASE_ABERTURA_PADRAO;
  salvarTudo(dados);
  return dados;
}

/**
 * Exporta as frases e dados de configuração em formato JSON
 * Gera um arquivo para download no dispositivo
 */
export function exportarArquivoJSON() {
  const dados = carregarTudo();
  const pacoteExportacao = {
    app: APP_NAME,
    schemaVersion: SCHEMA_VERSION,
    dataExportacao: new Date().toISOString(),
    fraseAbertura: dados.fraseAbertura,
    ajustes: dados.ajustes,
    frases: dados.frases
  };

  const conteudo = JSON.stringify(pacoteExportacao, null, 2);
  const blob = new Blob([conteudo], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  const dataHoje = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `ecoa-backup-${dataHoje}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Valida e importa um arquivo JSON com frases
 * @param {string} conteudoJSON - Texto bruto lido do arquivo
 * @returns {{ sucesso: boolean, mensagem: string, quantidade?: number }}
 */
export function validarEImportarJSON(conteudoJSON) {
  try {
    if (!conteudoJSON || typeof conteudoJSON !== 'string') {
      return { sucesso: false, mensagem: 'O arquivo está vazio ou ilegível.' };
    }

    const parsed = JSON.parse(conteudoJSON);

    // Validação básica do objeto
    if (!parsed || typeof parsed !== 'object') {
      return { sucesso: false, mensagem: 'Estrutura JSON inválida.' };
    }

    // Suporta tanto o formato completo com metadados quanto um array direto de frases
    let listaFrases = null;
    if (Array.isArray(parsed)) {
      listaFrases = parsed;
    } else if (Array.isArray(parsed.frases)) {
      listaFrases = parsed.frases;
    } else {
      return {
        sucesso: false,
        mensagem: 'Nenhuma lista de frases válida encontrada no arquivo JSON.'
      };
    }

    // Validação detalhada de cada item da lista
    const frasesValidadas = [];
    let ordemAtual = 1;

    for (let i = 0; i < listaFrases.length; i++) {
      const item = listaFrases[i];
      if (!item || typeof item !== 'object') continue;

      const texto = typeof item.texto === 'string' ? item.texto.trim() : '';
      if (!texto) continue; // Frases vazias são descartadas

      const contexto = typeof item.contexto === 'string' && item.contexto.trim()
        ? item.contexto.trim().toLowerCase()
        : 'social';

      const icone = typeof item.icone === 'string' && item.icone.trim()
        ? item.icone.trim()
        : 'message-square';

      const emoji = typeof item.emoji === 'string' ? item.emoji.trim() : '';
      const id = typeof item.id === 'string' && item.id.trim()
        ? item.id.trim()
        : `frase-${Date.now()}-${i}`;
      const uso = typeof item.uso === 'number' && item.uso >= 0 ? Math.floor(item.uso) : 0;

      frasesValidadas.push({
        id,
        texto,
        contexto,
        icone,
        emoji,
        uso,
        ordem: typeof item.ordem === 'number' ? item.ordem : ordemAtual++
      });
    }

    if (frasesValidadas.length === 0) {
      return {
        sucesso: false,
        mensagem: 'O arquivo não continha nenhuma frase válida com o campo "texto".'
      };
    }

    // Salva as novas frases no armazenamento
    const dados = carregarTudo();
    dados.frases = frasesValidadas;

    // Se houver frase de abertura personalizada no backup, importa também
    if (parsed.fraseAbertura && typeof parsed.fraseAbertura === 'string') {
      dados.fraseAbertura = parsed.fraseAbertura.trim();
    }

    salvarTudo(dados);

    return {
      sucesso: true,
      mensagem: `${frasesValidadas.length} frases importadas com sucesso!`,
      quantidade: frasesValidadas.length
    };
  } catch (erro) {
    return {
      sucesso: false,
      mensagem: `Falha ao processar arquivo: ${erro.message || 'JSON corrompido'}`
    };
  }
}
