# Ecoa — Prancha Digital com Voz para Serviços Universitários

**Ecoa** é um MVP de aplicação web progressiva (PWA) de Comunicação Alternativa e Aumentativa (CAA), concebido como projeto acadêmico para a **Universidade Federal do Maranhão (UFMA)**. O aplicativo permite que estudantes e servidores com dificuldades na fala oral se comuniquem com autonomia em serviços universitários essenciais como a **Secretaria**, a **Biblioteca** e o **Restaurante Universitário (RU)**.

O usuário toca em cartões com frases curtas pré-programadas e o celular vocaliza a frase em voz alta utilizando a Web Speech API nativa. As vozes disponíveis dependem do aparelho; o Ecoa não baixa vozes nem envia frases a serviços externos.

---

## 🎯 Destaques do Projeto

1. **100% Livre de Frameworks e Dependências**: Desenvolvido exclusivamente com HTML5 semântico, CSS3 moderno e JavaScript modular (Módulos ES). Não requer bundlers, npm build, transpiladores ou CDNs externas em tempo de execução.
2. **Offline First (PWA)**: Registra um Service Worker (`sw.js`) e `manifest.webmanifest`. Arquivos, fontes, ícones e preferências ficam localmente; a disponibilidade da fala depende das vozes instaladas no aparelho.
3. **Modo Palco**: Diferencial para comunicação em balcões com ruído (RU, filas) — exibe a frase em tela cheia com tipografia gigante que se ajusta automaticamente ao espaço através de um **algoritmo de busca binária no `font-size`**, mantendo a tela acesa via **Screen Wake Lock API**.
4. **Design Editorial e Acessível**: Quatro paletas com variantes clara, escura e de alto contraste; texto normal com contraste mínimo AA (4,5:1), alvos de toque generosos (≥ 52px), suporte a redução de movimento e feedback háptico (`navigator.vibrate`).
5. **Segurança no iOS e Android**: A síntese de voz dispara estritamente a partir de gestos intencionais do usuário (requisito obrigatório do Safari no iOS).
6. **Configuração inicial**: Boas-vindas opcionais salvam nome e voz escolhida no armazenamento local do navegador, sem cadastro.

---

## 📁 Estrutura de Pastas

```text
ecoa/
├── index.html                  # Marcação semântica com landmarks acessíveis
├── manifest.webmanifest        # Manifesto PWA com metadados e ícones
├── sw.js                       # Service Worker com cache-first offline
├── README.md                   # Documentação do projeto e instruções de execução
├── css/
│   ├── variables.css           # Tokens de design, fontes @font-face e paletas
│   ├── base.css                # Reset moderno, foco visível e acessibilidade
│   ├── layout.css              # Grid mobile-first, cartões, faixa fixa e abas
│   └── components.css          # Cartão de frase, Modo Palco, modais e toast
├── js/
│   ├── main.js                 # Ponto de entrada, ciclo de vida e Service Worker
│   ├── estado.js               # Constante APP_NAME="Ecoa", frases padrão e ajustes
│   ├── voz.js                  # Web Speech API, carregamento assíncrono e detecção pt-BR
│   ├── interface.js            # Renderização de grade, chips, digitação livre e modais
│   ├── palco.js                # Modo Palco com busca binária e Screen Wake Lock
│   ├── ajustes.js              # Temas, tamanhos, velocidade/tom de voz e acessibilidade
│   ├── armazenamento.js        # localStorage versionado, exportação/importação JSON
│   └── icones.js               # Catálogo de ícones SVG (Lucide)
└── assets/
    ├── fonts/                  # Fontes locais em formato WOFF2
    │   ├── atkinson-regular.woff2
    │   └── atkinson-bold.woff2
    └── icons/                  # 47 ícones SVG locais do sistema e PWA
        ├── app-icon.svg
        ├── volume-2.svg
        ├── maximize-2.svg
        └── ...
```

---

## 🚀 Como Rodar o Projeto

Como o aplicativo utiliza **Módulos ES** (`<script type="module">`) e **Service Workers**, os navegadores exigem que ele seja servido por um servidor HTTP local (e não pelo protocolo `file://`).

### Opção 1: Com Python (Recomendado)

Abra o terminal na pasta do projeto e execute:

```bash
cd c:\projetos\ecoa
python -m http.server 8000
```

Abra o navegador no endereço: **`http://localhost:8000`**

### Opção 2: Com Node.js

Caso prefira utilizar Node.js:

```bash
cd c:\projetos\ecoa
npx serve -l 8000
```

---

## 📱 Como Testar no Celular pela Rede Local (Wi-Fi)

Para testar a experiência real no smartphone (com voz, vibração e instalação do PWA):

1. Conecte o computador e o smartphone na **mesma rede Wi-Fi**.
2. No computador, descubra o seu endereço IP local:
   - **Windows**: Abra o PowerShell ou Prompt de Comando e execute:
     ```cmd
     ipconfig
     ```
     Procure por `Endereço IPv4` (exemplo: `192.168.1.15`).
   - **Linux / macOS**: Execute `ip a` ou `ifconfig`.
3. Inicie o servidor escutando em todas as interfaces:
   ```bash
   python -m http.server 8000 --bind 0.0.0.0
   ```
4. No navegador do smartphone (Chrome no Android ou Safari no iOS), acesse:
   ```text
   http://192.168.1.15:8000
   ```
   *(Substitua pelo número de IP obtido no passo 2)*

> **Dica PWA no celular:**
> - No **Android (Chrome)**: Toque nos três pontinhos no topo e selecione **"Adicionar à tela inicial"** ou **"Instalar aplicativo"**.
> - No **iOS (Safari)**: Toque no botão de compartilhar (ícone com quadrado e seta para cima) e escolha **"Adicionar à Tela de Início"**.

---

## 🎨 Paletas e contraste WCAG

Os contrastes abaixo foram calculados pela luminância relativa do WCAG 2.1. Texto principal e secundário, botões e bordas atendem ao mínimo AA de 4,5:1; o acento lima é avaliado com o texto escuro que o acompanha.

| Paleta | Tema | Texto principal | Texto secundário | Botão com texto | Acento com texto escuro | Borda |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: |
| Cacto | Claro | 9,22:1 | 5,02:1 | 11,00:1 | 14,83:1 | 5,02:1 |
| Cacto | Escuro | 16,95:1 | 8,19:1 | 9,29:1 | 15,38:1 | 8,19:1 |
| Cacto | Alto contraste | 21,00:1 | 21,00:1 | 21,00:1 | 16,65:1 | 21,00:1 |
| Oceano | Claro | 10,32:1 | 4,87:1 | 7,39:1 | 14,83:1 | 4,87:1 |
| Oceano | Escuro | 17,00:1 | 10,95:1 | 10,45:1 | 14,80:1 | 10,95:1 |
| Oceano | Alto contraste | 21,00:1 | 21,00:1 | 21,00:1 | 16,65:1 | 21,00:1 |
| Barro | Claro | 8,21:1 | 5,21:1 | 7,69:1 | 14,83:1 | 5,21:1 |
| Barro | Escuro | 17,24:1 | 10,01:1 | 8,64:1 | 14,79:1 | 10,01:1 |
| Barro | Alto contraste | 21,00:1 | 21,00:1 | 21,00:1 | 16,65:1 | 21,00:1 |
| Grafite | Claro | 11,22:1 | 4,60:1 | 12,40:1 | 14,83:1 | 4,60:1 |
| Grafite | Escuro | 16,98:1 | 9,77:1 | 9,77:1 | 14,76:1 | 9,77:1 |
| Grafite | Alto contraste | 21,00:1 | 21,00:1 | 21,00:1 | 16,65:1 | 21,00:1 |

> O acento lima (`#D4F25A`) indica estados de fala ativa e foco; a seleção de tema automático acompanha as preferências do sistema.

---

## ♿ Acessibilidade e Tecnologia Assistiva

- **Alvos de toque confortáveis**: Mínimo de 48px de área clicável (padrão de 52px a 64px).
- **Sem Dependência Exclusiva de Cor**: Estados visuais são comunicados por ícones, textos e animações sonoras conjuntas.
- **Exclusão com Desfazer**: Em vez de alertas modais intrusivos que interrompem a navegação, a exclusão remove o item temporariamente e abre um *Toast* acessível com o botão "Desfazer".
- **Semântica HTML e ARIA**: Marcações `role="feed"`, `aria-live="polite"`, `aria-label` e estados `aria-pressed` / `aria-selected` integrados para leitores de tela como TalkBack e VoiceOver.

---

## ⚖️ Licenças e Créditos

- **Projeto**: Desenvolvido para fins acadêmicos na Universidade Federal do Maranhão (UFMA).
- **Ícones**: [Lucide Icons](https://lucide.dev/) (Licença ISC).
- **Tipografia**: [Atkinson Hyperlegible](https://www.brailleinstitute.org/atkinson-hyperlegible-font) (SIL Open Font License).
- **Nota Futura sobre ARASAAC**: O código possui ganchos prontos para integração com o catálogo de pictogramas do [ARASAAC](https://arasaac.org/), sob licença Creative Commons (BY-NC-SA), mediante inclusão dos créditos aos autores.
