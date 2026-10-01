import { MediaKind, Post, Settings } from './types';

const API = 'https://api.rule34.xxx';
const HEADERS = { 'User-Agent': 'rule34-feed/1.0', Referer: 'https://rule34.xxx/' };

// Sempre bloqueadas, não editáveis pelo usuário.
export const HARD_BLOCKED = ['loli', 'shota', 'child', 'toddler', 'cub', 'young', 'underage'];

export const PAGE_SIZE = 20;

type RawPost = {
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
  image: string;
};

function kindOf(url: string): MediaKind {
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
  if (ext === 'mp4' || ext === 'webm' || ext === 'mov') return 'video';
  if (ext === 'gif') return 'gif';
  return 'image';
}

export function buildQuery(feedTags: string, settings: Settings): string {
  const parts = feedTags.trim().split(/\s+/).filter(Boolean);
  if (settings.mediaFilter === 'video') parts.push('video');
  if (settings.mediaFilter === 'image') parts.push('-video', '-animated');
  if (settings.sort === 'score') parts.push('sort:score:desc');
  // A API limita a quantidade de tags por busca; o resto da blacklist é filtrado localmente.
  for (const t of HARD_BLOCKED) parts.push(`-${t}`);
  return parts.join(' ');
}

export class ApiError extends Error {}

export async function fetchPosts(
  feedTags: string,
  page: number,
  settings: Settings,
): Promise<{ posts: Post[]; rawCount: number }> {
  const params = new URLSearchParams({
    page: 'dapi',
    s: 'post',
    q: 'index',
    json: '1',
    limit: String(PAGE_SIZE),
    pid: String(page),
    tags: buildQuery(feedTags, settings),
  });
  if (settings.apiKey && settings.userId) {
    params.set('api_key', settings.apiKey);
    params.set('user_id', settings.userId);
  }

  const res = await fetch(`${API}/index.php?${params}`, { headers: HEADERS });
  const text = await res.text();
  if (!res.ok) throw new ApiError(`HTTP ${res.status}`);
  if (!text.trim()) return { posts: [], rawCount: 0 }; // sem resultados a API devolve corpo vazio
  if (!text.trim().startsWith('[')) {
    throw new ApiError(
      /missing authentication|api_key/i.test(text)
        ? 'A API pediu autenticação. Configure api_key e user_id em Configurações.'
        : text.slice(0, 200),
    );
  }

  const blocked = new Set([...HARD_BLOCKED, ...settings.blacklist]);
  const raw = JSON.parse(text) as RawPost[];
  const posts = raw
    .map((p) => {
      const tags = p.tags.trim().split(/\s+/);
      const kind = kindOf(p.file_url);
      const useSample = kind === 'image' && !!p.sample && !!p.sample_url;
      return {
        id: p.id,
        kind,
        fileUrl: p.file_url,
        displayUrl: useSample ? p.sample_url : p.file_url,
        previewUrl: p.preview_url,
        width: p.width,
        height: p.height,
        score: p.score,
        tags,
        source: p.source,
      };
    })
    .filter((p) => p.fileUrl && !p.tags.some((t) => blocked.has(t)));
  return { posts, rawCount: raw.length };
}

export type TagSuggestion = { label: string; value: string };

export async function autocomplete(q: string): Promise<TagSuggestion[]> {
  const term = q.trim().replace(/^-/, '');
  if (term.length < 2) return [];
  const res = await fetch(`${API}/autocomplete.php?q=${encodeURIComponent(term)}`, { headers: HEADERS });
  if (!res.ok) return [];
  try {
    const data = (await res.json()) as TagSuggestion[];
    return data.filter((s) => !HARD_BLOCKED.includes(s.value)).slice(0, 15);
  } catch {
    return [];
  }
}

export const postPageUrl = (id: number) => `https://rule34.xxx/index.php?page=post&s=view&id=${id}`;
export const MEDIA_HEADERS = HEADERS;
