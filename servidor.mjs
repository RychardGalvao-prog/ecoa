/**
 * ecoa - Servidor HTTP Local para Desenvolvimento e Testes
 * Execução simples: node servidor.mjs [porta]
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORTA = parseInt(process.argv[2], 10) || 8000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let urlLimpa = req.url.split('?')[0];
  if (urlLimpa === '/') urlLimpa = '/index.html';

  const caminhoArquivo = path.join(__dirname, urlLimpa);

  // Segurança: previne directory traversal
  if (!caminhoArquivo.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Acesso Negado');
    return;
  }

  fs.stat(caminhoArquivo, (erro, stats) => {
    if (erro || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Arquivo Não Encontrado');
      return;
    }

    const extensao = path.extname(caminhoArquivo).toLowerCase();
    const contentType = MIME_TYPES[extensao] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Service-Worker-Allowed': '/',
      'Access-Control-Allow-Origin': '*'
    });

    fs.createReadStream(caminhoArquivo).pipe(res);
  });
});

server.listen(PORTA, '0.0.0.0', () => {
  console.log(`[Ecoa] Servidor local ativo em:`);
  console.log(` > Local:    http://localhost:${PORTA}`);
  console.log(` > Na rede:  http://0.0.0.0:${PORTA}`);
  console.log(`Pressione Ctrl+C para encerrar.`);
});
