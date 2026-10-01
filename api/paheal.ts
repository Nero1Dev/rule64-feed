// Vercel Function: proxy do paheal para a versão web (o paheal não libera CORS).
// O vercel.json reescreve /proxy/paheal/<caminho>?... para /api/paheal?path=<caminho>&...
// Em desenvolvimento local o mesmo papel é feito pelo metro.config.js.

const UPSTREAM = 'https://rule34.paheal.net/';
const UA = 'rule34-feed/1.0 (by nero1dev)';
// Só os endpoints que o app usa — não é um proxy aberto.
const ALLOWED = new Set(['api/danbooru/find_posts', 'api/internal/autocomplete']);

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = (url.searchParams.get('path') ?? '').replace(/^\/+/, '');
  if (!ALLOWED.has(path)) return new Response('Not found', { status: 404 });
  url.searchParams.delete('path');

  try {
    const res = await fetch(`${UPSTREAM}${path}?${url.searchParams}`, { headers: { 'User-Agent': UA } });
    return new Response(res.body, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('content-type') ?? 'text/plain',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (e) {
    const err = e as Error & { cause?: { code?: string } };
    // 4xx + prefixo PROXY_FAIL: o app mostra uma mensagem clara (ver src/api.ts).
    return new Response(`PROXY_FAIL ${err.cause?.code ?? err.message}`, { status: 424 });
  }
}
