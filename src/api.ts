import { Platform } from 'react-native';
import { Feed, MediaKind, Post, PresetKey, Settings, Source } from './types';

const IS_WEB = Platform.OS === 'web';
const UA = 'rule34-feed/1.0 (by nero1dev)';
// No navegador não dá pra definir User-Agent/Referer (e headers extras forçariam preflight CORS).
const HEADERS: Record<string, string> | undefined = IS_WEB ? undefined : { 'User-Agent': UA };

// Sempre bloqueadas, não editáveis pelo usuário.
export const HARD_BLOCKED = ['loli', 'shota', 'child', 'toddler', 'cub', 'young', 'underage'];

// Conteúdo gay masculino, escondido quando "Ocultar conteúdo gay" está ligado (padrão).
export const GAY_TAGS = ['gay', 'yaoi', 'male/male', 'male_only', 'male_on_male', 'bara'];

export const PAGE_SIZE = 20;

// Feeds prontos: cada site usa nomes de tag diferentes para a mesma coisa.
export const PRESETS: Record<PresetKey, { label: string; tags: Record<Source, string> }> = {
  lesbian: { label: 'Lésbico', tags: { paheal: 'lesbian', e621: 'female/female', rule34xxx: 'lesbian' } },
  futa: { label: 'Futa', tags: { paheal: 'futanari', e621: 'gynomorph', rule34xxx: 'futanari' } },
};

export function feedQuery(feed: Pick<Feed, 'tags' | 'preset'>, source: Source): string {
  return feed.preset ? PRESETS[feed.preset].tags[source] : feed.tags;
}

// Tags negativas adicionadas à busca (o resto é filtrado no app depois).
function excludes(s: Settings): string[] {
  return (s.hideGay ? GAY_TAGS : []).map((t) => `-${t}`);
}

export const SOURCES: Record<Source, { label: string; site: string }> = {
  paheal: { label: 'Paheal', site: 'https://rule34.paheal.net' },
  e621: { label: 'e621', site: 'https://e621.net' },
  rule34xxx: { label: 'rule34.xxx', site: 'https://rule34.xxx' },
};

// O paheal não libera CORS: no navegador as chamadas passam pelo proxy do servidor (metro.config.js).
const PAHEAL_API = IS_WEB ? '/proxy/paheal' : 'https://rule34.paheal.net';
const E621_API = 'https://e621.net';
const R34_API = 'https://api.rule34.xxx';

export class ApiError extends Error {}

type Page = { posts: Post[]; rawCount: number };

function kindOf(nameOrUrl: string): MediaKind {
  const ext = nameOrUrl.split('?')[0].split('.').pop()?.toLowerCase();
  if (ext === 'mp4' || ext === 'webm' || ext === 'mov' || ext === 'm4v') return 'video';
  if (ext === 'gif') return 'gif';
  return 'image';
}

function feedTags(tags: string): string[] {
  return tags.trim().split(/\s+/).filter(Boolean);
}

async function getText(url: string): Promise<string> {
  const res = await fetch(url, { headers: HEADERS });
  const text = await res.text();
  if (!res.ok) {
    // Só o proxy usa PROXY_FAIL: a conexão do servidor com o site falhou (rede/DNS).
    if (text.startsWith('PROXY_FAIL')) {
      throw new ApiError(
        `O servidor não conseguiu se conectar ao Paheal (${text.slice(11, 80)}). Troque a fonte para e621 em ⚙.`,
      );
    }
    // O site respondeu, mas com erro: mostra o status e o título da página de erro.
    const title = text.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim();
    const host = url.includes('paheal') ? 'Paheal' : new URL(url).host;
    throw new ApiError(`${host} respondeu HTTP ${res.status}${title ? ` (${title})` : `: ${text.slice(0, 120)}`}`);
  }
  return text;
}

// ---------- rule34.paheal.net (Shimmie, API estilo danbooru em XML) ----------

const decode = (s: string) =>
  s.replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

async function fetchPaheal(tags: string, page: number, s: Settings, seed: number): Promise<Page> {
  // Sem tags negativas aqui: busca só com exclusões pesa demais no paheal. Os ocultos são filtrados no app.
  const parts = feedTags(tags);
  if (s.mediaFilter === 'video') parts.push('ext:mp4');
  if (s.sort === 'score') parts.push('order:score_desc');
  if (s.sort === 'random') parts.push(`order:random_${seed}`); // semente fixa = páginas sem repetição
  const params = new URLSearchParams({ limit: String(PAGE_SIZE), page: String(page + 1), tags: parts.join(' ') });
  const xml = await getText(`${PAHEAL_API}/api/danbooru/find_posts?${params}`);

  const posts: Post[] = [];
  for (const m of xml.matchAll(/<tag ([^>]*)>/g)) {
    const a: Record<string, string> = {};
    for (const [, k, v] of m[1].matchAll(/(\w+)='([^']*)'/g)) a[k] = decode(v);
    posts.push({
      id: Number(a.id),
      kind: kindOf(a.file_name ?? ''),
      fileUrl: a.file_url,
      displayUrl: a.file_url,
      previewUrl: a.preview_url,
      width: Number(a.width),
      height: Number(a.height),
      score: Number(a.score) || 0,
      tags: (a.tags ?? '').split(/\s+/).filter(Boolean),
      source: a.source ?? '',
    });
  }
  return { posts, rawCount: posts.length };
}

// ---------- e621.net (JSON, libera CORS) ----------

type E621Post = {
  id: number;
  file: { url: string | null; ext: string; width: number; height: number };
  sample: { has: boolean; url: string | null };
  preview: { url: string | null };
  score: { total: number };
  tags: Record<string, string[]>;
  sources: string[];
};

async function fetchE621(tags: string, page: number, s: Settings, seed: number): Promise<Page> {
  const parts = [...feedTags(tags), ...excludes(s)];
  if (s.mediaFilter === 'video') parts.push('~type:webm', '~type:mp4');
  if (s.mediaFilter === 'image') parts.push('-animated');
  if (s.sort === 'score') parts.push('order:score');
  if (s.sort === 'random') parts.push('order:random', `randseed:${seed}`);
  const params = new URLSearchParams({ limit: String(PAGE_SIZE), page: String(page + 1), tags: parts.join(' ') });
  if (IS_WEB) params.set('_client', UA);
  const data = JSON.parse(await getText(`${E621_API}/posts.json?${params}`)) as { posts: E621Post[] };

  const posts = data.posts
    .filter((p) => p.file.url)
    .map((p): Post => {
      const kind = kindOf(`x.${p.file.ext}`);
      return {
        id: p.id,
        kind,
        fileUrl: p.file.url!,
        displayUrl: kind === 'image' && p.sample.has && p.sample.url ? p.sample.url : p.file.url!,
        previewUrl: p.preview.url ?? p.file.url!,
        width: p.file.width,
        height: p.file.height,
        score: p.score.total,
        tags: Object.values(p.tags).flat(),
        source: p.sources[0] ?? '',
      };
    });
  return { posts, rawCount: data.posts.length };
}

// ---------- api.rule34.xxx (exige api_key + user_id) ----------

type R34Post = {
  id: number;
  file_url: string;
  sample_url: string;
  preview_url: string;
  sample: boolean | number;
  width: number;
  height: number;
  score: number;
  tags: string;
  source: string;
};

async function fetchRule34xxx(tags: string, page: number, s: Settings, _seed: number): Promise<Page> {
  if (!s.apiKey || !s.userId) {
    throw new ApiError('O rule34.xxx exige api_key e user_id. Configure em ⚙ ou troque a fonte.');
  }
  const parts = [...feedTags(tags), ...excludes(s)];
  if (s.mediaFilter === 'video') parts.push('video');
  if (s.mediaFilter === 'image') parts.push('-video', '-animated');
  if (s.sort === 'score') parts.push('sort:score:desc');
  if (s.sort === 'random') parts.push('sort:random');
  for (const t of HARD_BLOCKED) parts.push(`-${t}`);
  const params = new URLSearchParams({
    page: 'dapi',
    s: 'post',
    q: 'index',
    json: '1',
    limit: String(PAGE_SIZE),
    pid: String(page),
    tags: parts.join(' '),
    api_key: s.apiKey,
    user_id: s.userId,
  });
  const text = (await getText(`${R34_API}/index.php?${params}`)).trim();
  if (!text) return { posts: [], rawCount: 0 }; // sem resultados a API devolve corpo vazio
  if (!text.startsWith('[')) throw new ApiError(text.slice(0, 200));

  const raw = JSON.parse(text) as R34Post[];
  const posts = raw.map((p): Post => {
    const kind = kindOf(p.file_url);
    return {
      id: p.id,
      kind,
      fileUrl: p.file_url,
      displayUrl: kind === 'image' && p.sample && p.sample_url ? p.sample_url : p.file_url,
      previewUrl: p.preview_url,
      width: p.width,
      height: p.height,
      score: p.score,
      tags: p.tags.trim().split(/\s+/),
      source: p.source,
    };
  });
  return { posts, rawCount: raw.length };
}

// ---------- API comum ----------

const FETCHERS: Record<Source, (tags: string, page: number, s: Settings, seed: number) => Promise<Page>> = {
  paheal: fetchPaheal,
  e621: fetchE621,
  rule34xxx: fetchRule34xxx,
};

export async function fetchPosts(tags: string, page: number, settings: Settings, seed = 0): Promise<Page> {
  const { posts, rawCount } = await FETCHERS[settings.source](tags, page, settings, seed);
  const blocked = new Set(
    [...HARD_BLOCKED, ...settings.blacklist, ...(settings.hideGay ? GAY_TAGS : [])].map((t) => t.toLowerCase()),
  );
  const filtered = posts.filter(
    (p) =>
      p.fileUrl &&
      !p.tags.some((t) => blocked.has(t.toLowerCase())) &&
      (settings.mediaFilter !== 'image' || p.kind !== 'video'),
  );
  return { posts: filtered.map((p) => ({ ...p, origin: settings.source })), rawCount };
}

export type TagSuggestion = { label: string; value: string };

export async function autocomplete(q: string, source: Source): Promise<TagSuggestion[]> {
  const term = q.trim().replace(/^-/, '');
  if (term.length < 2) return [];
  let list: TagSuggestion[] = [];
  try {
    if (source === 'paheal') {
      // Formato: { "Tag": { count } } (versões antigas: { "Tag": count })
      const data = JSON.parse(await getText(`${PAHEAL_API}/api/internal/autocomplete?s=${encodeURIComponent(term)}`));
      list = Object.entries(data as Record<string, number | { count: number }>).map(([name, v]) => ({
        label: `${name} (${typeof v === 'number' ? v : v.count})`,
        value: name,
      }));
    } else if (source === 'e621') {
      const params = new URLSearchParams({ 'search[name_matches]': term, expiry: '7' });
      if (IS_WEB) params.set('_client', UA);
      const data = JSON.parse(await getText(`${E621_API}/tags/autocomplete.json?${params}`)) as { name: string; post_count: number }[];
      list = data.map((t) => ({ label: `${t.name} (${t.post_count})`, value: t.name }));
    } else {
      list = JSON.parse(await getText(`${R34_API}/autocomplete.php?q=${encodeURIComponent(term)}`));
    }
  } catch {
    return [];
  }
  return list.filter((s) => !HARD_BLOCKED.includes(s.value.toLowerCase())).slice(0, 15);
}

export function postPageUrl(id: number, source: Source): string {
  if (source === 'paheal') return `https://rule34.paheal.net/post/view/${id}`;
  if (source === 'e621') return `https://e621.net/posts/${id}`;
  return `https://rule34.xxx/index.php?page=post&s=view&id=${id}`;
}

export const MEDIA_HEADERS = HEADERS;
