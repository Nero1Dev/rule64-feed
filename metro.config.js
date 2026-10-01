// Proxy para a versão web: o paheal não libera CORS, então o navegador chama
// /proxy/paheal/... neste servidor, que repassa para rule34.paheal.net.
// Só encaminha GET para os hosts listados (não é um proxy aberto).
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const PROXIES = {
  '/proxy/paheal/': 'https://rule34.paheal.net/',
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
        headers: { 'User-Agent': 'rule34-feed/1.0 (by nero1dev)' },
      })
        .then(async (r) => {
          res.statusCode = r.status;
          res.setHeader('Content-Type', r.headers.get('content-type') || 'text/plain');
          res.end(Buffer.from(await r.arrayBuffer()));
        })
        .catch((e) => {
          res.statusCode = 502;
          res.end(`Proxy falhou: ${e.cause?.code || e.message}`);
        });
    };
  },
};

module.exports = config;
