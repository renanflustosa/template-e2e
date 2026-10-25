// Servidor de demonstração: simula um "sistema do cliente" para os exemplos rodarem sem nada externo.
// Apague este arquivo (e o webServer do playwright.config.ts) ao usar o template num projeto real.
import { createServer } from 'node:http';

const port = Number(process.argv[2] || 3999);
const pedidos = [];
const mensagens = new Map();

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'",
};

function send(res, status, body, type = 'text/html; charset=utf-8', extra = {}) {
  res.writeHead(status, { 'Content-Type': type, ...SECURITY_HEADERS, ...extra });
  res.end(body);
}

const json = (res, status, data) => send(res, status, JSON.stringify(data), 'application/json');
const escape = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

async function readBody(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 10_000) throw new Error('corpo grande demais');
  }
  return raw;
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (req.method === 'GET' && url.pathname === '/') {
      return send(res, 200, `<h1>Pedidos</h1>
        <form method="post" action="/pedido">
          <label>Nome <input id="nome" name="nome" required></label>
          <button type="submit">Enviar</button>
        </form>`);
    }
    if (req.method === 'POST' && url.pathname === '/pedido') {
      const nome = new URLSearchParams(await readBody(req)).get('nome')?.trim();
      if (!nome) return send(res, 400, 'nome obrigatório');
      pedidos.push({ nome, criadoEm: new Date().toISOString() });
      return send(res, 303, '', 'text/plain', { Location: '/pedidos' });
    }
    if (req.method === 'GET' && url.pathname === '/pedidos') {
      return send(res, 200, `<h1>Pedidos recebidos</h1><ul>${pedidos.map((p) => `<li>${escape(p.nome)}</li>`).join('')}</ul>`);
    }
    // Simula uma automação assíncrona (ex.: webhook de WhatsApp processado por fila/n8n).
    if (req.method === 'POST' && url.pathname === '/webhook') {
      const { id, texto } = JSON.parse(await readBody(req) || '{}');
      if (!id || !texto) return json(res, 400, { erro: 'id e texto obrigatórios' });
      mensagens.set(id, { status: 'recebida' });
      setTimeout(() => mensagens.set(id, { status: 'respondida', resposta: `Olá! Recebemos: ${texto}` }), 1500);
      return json(res, 202, { ok: true });
    }
    if (req.method === 'GET' && url.pathname.startsWith('/api/mensagens/')) {
      const msg = mensagens.get(decodeURIComponent(url.pathname.split('/').pop()));
      return msg ? json(res, 200, msg) : json(res, 404, { erro: 'não encontrada' });
    }
    if (req.method === 'GET' && url.pathname === '/api/relatorio') {
      return json(res, 200, { total_pedidos: pedidos.length });
    }
    if (req.method === 'GET' && url.pathname === '/painel') {
      return send(res, 200, `<h1>Painel</h1><p>Total de pedidos: <strong data-testid="total">${pedidos.length}</strong></p>`);
    }
    return send(res, 404, 'não encontrado');
  } catch (err) {
    return send(res, 400, `requisição inválida: ${err.message}`, 'text/plain');
  }
}).listen(port, () => console.log(`demo em http://localhost:${port}`));
