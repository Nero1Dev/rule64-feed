import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feed, Post, Settings } from './types';

const KEYS = { feeds: 'feeds', settings: 'settings', favorites: 'favorites', migrations: 'migrations' };

export const DEFAULT_FEEDS: Feed[] = [
  { id: 'lesbian', name: 'Lésbico', tags: '', preset: 'lesbian' },
  { id: 'futa', name: 'Futa', tags: '', preset: 'futa' },
  { id: 'all', name: 'Tudo', tags: '' },
  { id: 'redgifs', name: 'RedGIFs', tags: '', source: 'redgifs' },
];

// Feeds padrão adicionados em versões novas: entram uma vez para quem já tem feeds salvos.
const FEED_MIGRATIONS: { key: string; feed: Feed }[] = [
  { key: 'add-redgifs', feed: { id: 'redgifs', name: 'RedGIFs', tags: '', source: 'redgifs' } },
];

export const DEFAULT_SETTINGS: Settings = {
  source: 'e621', // marca bem o tipo de conteúdo (lésbico, futa, gay...), então os filtros funcionam
  apiKey: '',
  userId: '',
  blacklist: ['ai_generated', 'gore', 'scat'],
  mediaFilter: 'all',
  sort: 'random',
  hideGay: true,
  muted: true,
};

async function load<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

async function loadArray<T>(key: string, fallback: T[]): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

const save = (key: string, value: unknown) => AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});

export async function loadFeeds(): Promise<Feed[]> {
  const feeds = await loadArray(KEYS.feeds, DEFAULT_FEEDS);
  const done = await loadArray<string>(KEYS.migrations, []);
  const pending = FEED_MIGRATIONS.filter((m) => !done.includes(m.key));
  if (!pending.length) return feeds;
  const added = pending.map((m) => m.feed).filter((f) => !feeds.some((x) => x.id === f.id));
  const next = [...feeds, ...added];
  save(KEYS.feeds, next);
  save(KEYS.migrations, [...done, ...pending.map((m) => m.key)]);
  return next;
}
export const saveFeeds = (feeds: Feed[]) => save(KEYS.feeds, feeds);
export const loadSettings = () => load(KEYS.settings, DEFAULT_SETTINGS);
export const saveSettings = (s: Settings) => save(KEYS.settings, s);
export const loadFavorites = () => loadArray<Post>(KEYS.favorites, []);
export const saveFavorites = (f: Post[]) => save(KEYS.favorites, f);
