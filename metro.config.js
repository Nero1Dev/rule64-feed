// Proxy para a versão web em desenvolvimento (em produção: vercel.json + api/paheal.ts).
// - /proxy/paheal/...: o paheal não libera CORS para a API.
// - /media/e621/...: o CDN do e621 não deixa outros sites embutirem as mídias.
// Só encaminha GET para os hosts listados (não é um proxy aberto).
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const PROXIES = {
  '/proxy/paheal/': 'https://rule34.paheal.net/',
  '/media/e621/': 'https://static1.e621.net/',
};

const originalEnhance = config.server?.enhanceMiddleware;

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware, server) => {
    const base = originalEnhance ? originalEnhance(middleware, server) : middleware;
    return (req, res, next) => {
      const prefix = Object.keys(PROXIES).find((p) => req.url.startsWith(p));
      if (!prefix || req.method !== 'GET') return base(req, res, next);

      fetch(PROXIES[prefix] + req.url.slice(prefix.length), {
        // Range: o navegador pede vídeos em pedaços.
        headers: { 'User-Agent': 'rule34-feed/1.0 (by nero1dev)', ...(req.headers.range && { Range: req.headers.range }) },
      })
        .then(async (r) => {
          res.statusCode = r.status;
          res.setHeader('Content-Type', r.headers.get('content-type') || 'text/plain');
          for (const h of ['content-range', 'accept-ranges']) if (r.headers.get(h)) res.setHeader(h, r.headers.get(h));
          res.end(Buffer.from(await r.arrayBuffer()));
        })
        .catch((e) => {
          // 4xx para a Cloudflare (túnel) não trocar a resposta pela página de erro dela.
          res.statusCode = 424;
          res.end(`PROXY_FAIL ${e.cause?.code || e.message}`);
        });
    };
  },
};

module.exports = config;
