# Ecoa — Prancha Digital de Comunicação Alternativa

O Ecoa é um protótipo acadêmico de Comunicação Alternativa e Aumentativa (CAA) para apoiar pessoas com barreiras na comunicação oral em situações universitárias. Reúne frases organizadas por contexto, respostas rápidas, digitação livre, síntese de voz e exibição ampliada de texto no Modo Palco.

O projeto foi criado por **Rychard Galvão** para a Universidade Federal do Maranhão (UFMA). É um MVP em desenvolvimento, não um produto clínico validado e não substitui avaliação individual, recursos profissionais ou adaptações institucionais.

## Funcionalidades

- Frases para secretaria, biblioteca, restaurante universitário, situações sociais e emergência.
- Reprodução de mensagens usando a Web Speech API e as vozes disponíveis no navegador ou aparelho.
- Modo Palco para exibir uma mensagem em tela cheia, com ajuste de fonte.
- Personalização de frases, nome, voz, tema, tamanho de texto e botões, pictogramas e colunas.
- Armazenamento local das preferências, frases e histórico no navegador.
- Aplicação web progressiva (PWA), com recursos essenciais armazenados em cache para uso offline após o primeiro carregamento bem-sucedido.

## Requisitos

- Um navegador moderno com suporte a módulos JavaScript.
- Conexão inicial para abrir o app e instalar o cache offline.
- Para executar o servidor de desenvolvimento: Node.js 18 ou superior. Não há dependências npm nem etapa de build.

A disponibilidade e a qualidade da síntese de voz dependem do navegador, do sistema operacional e das vozes instaladas. O mecanismo de voz pode ter requisitos próprios de conectividade e privacidade; consulte as informações da plataforma escolhida. O Ecoa não possui backend nem conta de usuário. As frases e preferências do app ficam no armazenamento local do navegador.

Se o aviso de voz continuar aparecendo após baixar uma voz no iPhone, confira se ela aparece em **Ajustes → Voz** no Ecoa e toque em **Testar voz**. O iOS pode não disponibilizar ao navegador toda voz instalada no sistema. Se o Brave não listar ou não reproduzir a voz, teste a mesma página no Safari; o aviso do Ecoa mostra os erros de síntese que o navegador informar.

## Executar localmente

Na pasta do projeto, execute:

```powershell
node servidor.mjs 8000
```

O servidor escuta apenas no próprio computador por padrão. Abra <http://localhost:8000>. Também é possível usar outro número de porta, por exemplo `node servidor.mjs 8080`.

O aplicativo usa módulos ES e Service Worker, portanto não deve ser aberto por `file://`. O Service Worker funciona em contexto seguro: HTTPS ou `localhost`.

### Teste em outro aparelho

Para uma demonstração temporária na mesma rede Wi-Fi, o servidor pode escutar nas interfaces de rede:

```powershell
node servidor.mjs 8000 0.0.0.0
```

Consulte o endereço IPv4 do computador (`ipconfig` no Windows) e abra `http://<IP-DO-COMPUTADOR>:8000` no outro aparelho. Use essa opção somente em uma rede confiável e para testes: HTTP por IP local não é um contexto seguro e, portanto, não habilita o Service Worker/PWA offline. Para testar instalação e uso offline no celular, publique o app em um host HTTPS.

## Uso offline

1. Abra o Ecoa em HTTPS ou em `localhost`, com conexão.
2. Aguarde o carregamento e a confirmação de que o app está pronto para uso offline.
3. Desconecte a rede e recarregue ou reabra o app.

O cache guarda os recursos locais da aplicação; isso não garante que as vozes do aparelho funcionem sem conexão. Os dados salvos no navegador não são sincronizados entre aparelhos e podem ser apagados ao limpar os dados do site. Use os recursos de exportação e importação em Ajustes para fazer uma cópia das frases e configurações.

## Estrutura do projeto

```text
.
├── index.html
├── manifest.webmanifest
├── servidor.mjs
├── sw.js
├── css/
│   ├── base.css
│   ├── components.css
│   ├── layout.css
│   └── variables.css
├── js/
│   ├── ajustes.js
│   ├── armazenamento.js
│   ├── estado.js
│   ├── icones.js
│   ├── interface.js
│   ├── main.js
│   ├── palco.js
│   └── voz.js
├── assets/
│   ├── brand/
│   ├── fonts/
│   └── icons/
└── capturas-validacao/
```

## Verificações antes de publicar

O projeto não possui uma suíte automatizada de testes ou processo de build. Para verificar a sintaxe JavaScript com Node.js no PowerShell:

```powershell
Get-ChildItem .\js\*.js | ForEach-Object { node --check $_.FullName }
node --check .\sw.js
node --check .\servidor.mjs
```

Também confira a aplicação em tamanhos de tela e navegadores diferentes, teste importação/exportação de dados, síntese de voz e instalação/abertura offline por HTTPS ou `localhost`. As imagens em [`capturas-validacao/`](./capturas-validacao/) registram verificações visuais pontuais; não representam certificação de acessibilidade nem testes com usuários.

## Acessibilidade e limitações

O Ecoa inclui recursos como navegação por teclado, estados de foco, opções de contraste e tamanho, redução de movimento e conteúdo em texto e voz. A implementação não foi auditada nem certificada como conforme a WCAG. Uma avaliação com pessoas com deficiência e testes assistivos em dispositivos reais são necessários para verificar sua adequação a diferentes necessidades.

O projeto depende de um aparelho compatível e não oferece uma alternativa física. O modo offline depende da instalação prévia do cache; a fala depende dos recursos do navegador e do sistema. O uso de um aparelho compartilhado também pode expor frases e preferências armazenadas localmente.

## Créditos e licenças de recursos

- Ícones Lucide: <https://lucide.dev/> — licença ISC.
- Fonte Atkinson Hyperlegible: <https://www.brailleinstitute.org/atkinson-hyperlegible-font> — SIL Open Font License.
- As marcas Ecoa/UFMA são recursos visuais do projeto; consulte `assets/brand/LEIA-ME.txt`.

Não há um arquivo de licença do código-fonte neste repositório. Não presuma permissão para redistribuir ou reutilizar o código até que uma licença seja definida pelos responsáveis.
