export type MediaKind = 'image' | 'gif' | 'video';

export type Post = {
  id: number;
  kind: MediaKind;
  fileUrl: string;
  displayUrl: string; // versão mais leve para exibir (sample) quando existir
  previewUrl: string;
  width: number;
  height: number;
  score: number;
  tags: string[];
  source: string;
};

export type Feed = {
  id: string;
  name: string;
  tags: string; // tags separadas por espaço, sintaxe do rule34 (ex.: "overwatch -ai_generated")
};

export type MediaFilter = 'all' | 'video' | 'image';
export type SortMode = 'recent' | 'score';

export type Settings = {
  apiKey: string;
  userId: string;
  blacklist: string[];
  mediaFilter: MediaFilter;
  sort: SortMode;
  muted: boolean;
};
