// Vercel Function: proxy da API do RedGIFs para a versão web.
// A API exige um token temporário (GET /v2/auth/temporary); ele fica guardado na instância
// e é renovado quando a API responde 401.
// O vercel.json reescreve /proxy/redgifs/<caminho>?... para /api/redgifs?path=<caminho>&...

const API = 'https://api.redgifs.com/';
const UA = 'Mozilla/5.0 (compatible; rule34-feed/1.0)';
// Só os endpoints que o app usa — não é um proxy aberto.
const ALLOWED = new Set(['v2/gifs/search', 'v2/search/suggest']);

let token: string | null = null;

async function getToken(): Promise<string> {
  if (token) return token;
  const res = await fetch(`${API}v2/auth/temporary`, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`auth HTTP ${res.status}`);
  token = ((await res.json()) as { token: string }).token;
  return token;
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = (url.searchParams.get('path') ?? '').replace(/^\/+/, '');
  if (!ALLOWED.has(path)) return new Response('Not found', { status: 404 });
  url.searchParams.delete('path');

  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await fetch(`${API}${path}?${url.searchParams}`, {
        headers: { 'User-Agent': UA, Authorization: `Bearer ${await getToken()}` },
      });
      if (res.status === 401 && attempt === 0) {
        token = null; // token vencido (ou de outro IP): pega outro e tenta de novo
        continue;
      }
      return new Response(res.body, {
        status: res.status,
        headers: {
          'Content-Type': res.headers.get('content-type') ?? 'application/json',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      });
    }
    return new Response('PROXY_FAIL token recusado', { status: 424 });
  } catch (e) {
    const err = e as Error & { cause?: { code?: string } };
    // 4xx + prefixo PROXY_FAIL: o app mostra uma mensagem clara (ver src/api.ts).
    return new Response(`PROXY_FAIL ${err.cause?.code ?? err.message}`, { status: 424 });
  }
}
