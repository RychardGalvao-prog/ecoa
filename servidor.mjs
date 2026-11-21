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
const HOST = process.argv[3] || '127.0.0.1';
const RAIZ_PROJETO = fs.realpathSync(__dirname);

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
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8', Allow: 'GET' });
    res.end('405 Método Não Permitido');
    return;
  }

  let caminhoArquivo;
  try {
    let urlLimpa = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (urlLimpa === '/') urlLimpa = '/index.html';
    caminhoArquivo = path.resolve(RAIZ_PROJETO, `.${urlLimpa}`);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('400 Caminho Inválido');
    return;
  }

  const caminhoRelativo = path.relative(RAIZ_PROJETO, caminhoArquivo);
  if (
    caminhoRelativo === '..' ||
    caminhoRelativo.startsWith(`..${path.sep}`) ||
    path.isAbsolute(caminhoRelativo)
  ) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Acesso Negado');
    return;
  }

  fs.realpath(caminhoArquivo, (erroRealPath, caminhoReal) => {
    if (erroRealPath) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Arquivo Não Encontrado');
      return;
    }

    const caminhoRealRelativo = path.relative(RAIZ_PROJETO, caminhoReal);
    if (
      caminhoRealRelativo === '..' ||
      caminhoRealRelativo.startsWith(`..${path.sep}`) ||
      path.isAbsolute(caminhoRealRelativo)
    ) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('403 Acesso Negado');
      return;
    }

    fs.stat(caminhoReal, (erroStat, stats) => {
      if (erroStat || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Arquivo Não Encontrado');
        return;
      }

      const extensao = path.extname(caminhoReal).toLowerCase();
      const contentType = MIME_TYPES[extensao] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Service-Worker-Allowed': '/',
        'X-Content-Type-Options': 'nosniff'
      });

      fs.createReadStream(caminhoReal).pipe(res);
    });
  });
});

server.listen(PORTA, HOST, () => {
  console.log(`[Ecoa] Servidor local ativo em:`);
  console.log(` > Local:    http://localhost:${PORTA}`);
  if (HOST !== '127.0.0.1' && HOST !== 'localhost') {
    console.log(` > Interface: ${HOST}:${PORTA}`);
  }
  console.log(`Pressione Ctrl+C para encerrar.`);
});
