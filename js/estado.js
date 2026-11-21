/**
 * ecoa - Prancha Digital de Comunicação Alternativa e Aumentativa (CAA)
 * Projeto Acadêmico - Universidade Federal do Maranhão (UFMA)
 * Módulo: estado.js - Constantes, esquema de dados e frases padrão
 */

// Nome único da aplicação para personalização rápida
export const APP_NAME = "Ecoa";

// Versão do esquema de armazenamento no localStorage
export const SCHEMA_VERSION = 1;

// Contextos / Categorias de uso universitário e cotidiano
export const CONTEXTOS = [
  { id: 'mais_usadas', rotulo: 'Mais usadas', icone: 'heart' },
  { id: 'todas', rotulo: 'Todas', icone: 'grid' },
  { id: 'secretaria', rotulo: 'Secretaria', icone: 'file-text' },
  { id: 'biblioteca', rotulo: 'Biblioteca', icone: 'book-open' },
  { id: 'ru', rotulo: 'RU', icone: 'utensils' },
  { id: 'social', rotulo: 'Social', icone: 'smile' },
  { id: 'emergencia', rotulo: 'Emergência', icone: 'life-buoy' }
];

// Respostas rápidas na faixa fixa (4 essenciais para caber sem rolagem em 360px)
export const RESPOSTAS_RAPIDAS = [
  { texto: 'Sim', icone: 'check-circle' },
  { texto: 'Não', icone: 'x-circle' },
  { texto: 'Obrigado(a)', icone: 'heart' },
  { texto: 'Não entendi', icone: 'help-circle' }
];

// Frase inicial do Cartão de Abertura (fixo no topo)
export const FRASE_ABERTURA_PADRAO = "Olá! Eu me comunico por esta tela. Pode aguardar um instante?";

// Frases padrão iniciais para ambientes universitários (UFMA)
// NOTA SOBRE PICTOGRAMAS:
// Atualmente o app utiliza ícones SVG Lucide (licença ISC) e emojis.
// No futuro, este sistema pode ser estendido para carregar pictogramas ARASAAC
// (sob licença Creative Commons BY-NC-SA, exigindo créditos expressos aos autores).
export const FRASES_INICIAIS = [
  // Secretaria
  {
    id: 'sec-1',
    texto: 'Bom dia. Preciso de uma informação.',
    contexto: 'secretaria',
    icone: 'info',
    emoji: '',
    uso: 0,
    ordem: 1
  },
  {
    id: 'sec-2',
    texto: 'Onde posso entregar este documento?',
    contexto: 'secretaria',
    icone: 'file-text',
    emoji: '',
    uso: 0,
    ordem: 2
  },
  {
    id: 'sec-3',
    texto: 'Preciso de uma declaração de matrícula.',
    contexto: 'secretaria',
    icone: 'file-text',
    emoji: '',
    uso: 0,
    ordem: 3
  },
  {
    id: 'sec-4',
    texto: 'Pode escrever para mim, por favor?',
    contexto: 'secretaria',
    icone: 'edit-3',
    emoji: '',
    uso: 0,
    ordem: 4
  },
  {
    id: 'sec-5',
    texto: 'Qual é o prazo?',
    contexto: 'secretaria',
    icone: 'clock',
    emoji: '',
    uso: 0,
    ordem: 5
  },

  // Biblioteca
  {
    id: 'bib-1',
    texto: 'Gostaria de pegar um livro emprestado.',
    contexto: 'biblioteca',
    icone: 'book-open',
    emoji: '',
    uso: 0,
    ordem: 6
  },
  {
    id: 'bib-2',
    texto: 'Onde fica esta seção?',
    contexto: 'biblioteca',
    icone: 'map-pin',
    emoji: '',
    uso: 0,
    ordem: 7
  },
  {
    id: 'bib-3',
    texto: 'Quero renovar o meu empréstimo.',
    contexto: 'biblioteca',
    icone: 'refresh-cw',
    emoji: '',
    uso: 0,
    ordem: 8
  },
  {
    id: 'bib-4',
    texto: 'Preciso de ajuda para encontrar um livro.',
    contexto: 'biblioteca',
    icone: 'search',
    emoji: '',
    uso: 0,
    ordem: 9
  },

  // RU (Restaurante Universitário)
  {
    id: 'ru-1',
    texto: 'Onde eu pago a refeição?',
    contexto: 'ru',
    icone: 'credit-card',
    emoji: '',
    uso: 0,
    ordem: 10
  },
  {
    id: 'ru-2',
    texto: 'Esta refeição tem carne?',
    contexto: 'ru',
    icone: 'utensils',
    emoji: '',
    uso: 0,
    ordem: 11
  },
  {
    id: 'ru-3',
    texto: 'Pode me ajudar a carregar a bandeja?',
    contexto: 'ru',
    icone: 'help-circle',
    emoji: '',
    uso: 0,
    ordem: 12
  },
  {
    id: 'ru-4',
    texto: 'Onde fica a fila preferencial?',
    contexto: 'ru',
    icone: 'users',
    emoji: '',
    uso: 0,
    ordem: 13
  },

  // Social
  {
    id: 'soc-1',
    texto: 'Oi, tudo bem?',
    contexto: 'social',
    icone: 'smile',
    emoji: '',
    uso: 0,
    ordem: 14
  },
  {
    id: 'soc-2',
    texto: 'Meu nome é ____.',
    contexto: 'social',
    icone: 'user',
    emoji: '',
    uso: 0,
    ordem: 15
  },
  {
    id: 'soc-3',
    texto: 'Pode falar mais devagar, por favor?',
    contexto: 'social',
    icone: 'mic',
    emoji: '',
    uso: 0,
    ordem: 16
  },
  {
    id: 'soc-4',
    texto: 'Preciso de um minuto para responder.',
    contexto: 'social',
    icone: 'hourglass',
    emoji: '',
    uso: 0,
    ordem: 17
  },
  {
    id: 'soc-5',
    texto: 'Pode repetir, por favor?',
    contexto: 'social',
    icone: 'refresh-cw',
    emoji: '',
    uso: 0,
    ordem: 18
  },

  // Emergência
  {
    id: 'emg-1',
    texto: 'Preciso de ajuda agora.',
    contexto: 'emergencia',
    icone: 'life-buoy',
    emoji: '',
    uso: 0,
    ordem: 19
  },
  {
    id: 'emg-2',
    texto: 'Chame alguém, por favor.',
    contexto: 'emergencia',
    icone: 'phone',
    emoji: '',
    uso: 0,
    ordem: 20
  },
  {
    id: 'emg-3',
    texto: 'Estou me sentindo mal.',
    contexto: 'emergencia',
    icone: 'heart-pulse',
    emoji: '',
    uso: 0,
    ordem: 21
  }
];

// Configurações padrão de acessibilidade e sistema
export const AJUSTES_PADRAO = {
  tema: 'auto', // 'auto' | 'claro' | 'escuro' | 'alto-contraste'
  paletaDestaque: 'cacto', // 'cacto' | 'oceano' | 'barro' | 'grafite'
  nomeUsuario: '',
  tamanhoTexto: 'normal', // 'normal' | 'grande' | 'extra' | 'gigante'
  tamanhoBotao: 'confortavel', // 'confortavel' | 'grande'
  colunasGrade: 1, // 1 ou 2 colunas no grid de frases
  vozURI: '', // URI da voz selecionada
  velocidade: 1.0, // 0.5 a 2.0
  tom: 1.0, // 0.5 a 1.5
  reduzirAnimacoes: false, // respeitar / forçar redução de movimento
  vibracao: true, // feedback tátil com navigator.vibrate
  mostrarPictogramas: true // exibir ou ocultar ícones visuais
};

// Catálogo de ícones disponíveis para seleção na edição de frases
export const CATALOGO_ICONES = [
  { id: 'info', rotulo: 'Informação' },
  { id: 'file-text', rotulo: 'Documento' },
  { id: 'edit-3', rotulo: 'Escrever' },
  { id: 'clock', rotulo: 'Relógio / Prazo' },
  { id: 'book-open', rotulo: 'Livro' },
  { id: 'map-pin', rotulo: 'Localização' },
  { id: 'refresh-cw', rotulo: 'Renovar' },
  { id: 'search', rotulo: 'Procurar' },
  { id: 'credit-card', rotulo: 'Cartão / Pagar' },
  { id: 'utensils', rotulo: 'Refeição' },
  { id: 'users', rotulo: 'Pessoas / Fila' },
  { id: 'smile', rotulo: 'Sorriso / Olá' },
  { id: 'user', rotulo: 'Pessoa / Nome' },
  { id: 'mic', rotulo: 'Voz / Falar' },
  { id: 'hourglass', rotulo: 'Aguardar' },
  { id: 'life-buoy', rotulo: 'Socorro / Ajuda' },
  { id: 'phone', rotulo: 'Telefone' },
  { id: 'heart-pulse', rotulo: 'Saúde / Mal-estar' },
  { id: 'check-circle', rotulo: 'Confirmar' },
  { id: 'x-circle', rotulo: 'Cancelar' },
  { id: 'heart', rotulo: 'Coração / Agradecer' },
  { id: 'help-circle', rotulo: 'Dúvida' }
];
