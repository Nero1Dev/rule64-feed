import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feed, Post, Settings } from './types';

const KEYS = { feeds: 'feeds', settings: 'settings', favorites: 'favorites' };

export const DEFAULT_FEEDS: Feed[] = [
  { id: 'all', name: 'Tudo', tags: '' },
  { id: 'genshin', name: 'Genshin', tags: 'genshin_impact' },
  { id: 'overwatch', name: 'Overwatch', tags: 'overwatch' },
];

export const DEFAULT_SETTINGS: Settings = {
  source: 'paheal',
  apiKey: '',
  userId: '',
  blacklist: ['ai_generated', 'gore', 'scat'],
  mediaFilter: 'all',
  sort: 'recent',
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

export const loadFeeds = () => loadArray(KEYS.feeds, DEFAULT_FEEDS);
export const saveFeeds = (feeds: Feed[]) => save(KEYS.feeds, feeds);
export const loadSettings = () => load(KEYS.settings, DEFAULT_SETTINGS);
export const saveSettings = (s: Settings) => save(KEYS.settings, s);
export const loadFavorites = () => loadArray<Post>(KEYS.favorites, []);
export const saveFavorites = (f: Post[]) => save(KEYS.favorites, f);
