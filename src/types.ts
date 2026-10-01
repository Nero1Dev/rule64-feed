// Identifica um post entre fontes diferentes (ids podem coincidir entre sites).
export const postKey = (p: Pick<Post, 'origin' | 'id'>) => `${p.origin ?? ''}:${p.id}`;

export type MediaKind = 'image' | 'gif' | 'video';

export type Post = {
  id: number | string; // RedGIFs usa ids de texto
  origin?: Source; // site de onde veio

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
  tags: string; // tags separadas por espaço, sintaxe do site (ex.: "overwatch -ai_generated")
  preset?: PresetKey; // feed pronto: as tags certas são escolhidas conforme a fonte
  source?: Source; // fonte fixa deste feed (sem isso, usa a fonte padrão das configurações)
};

// Uma busca concreta: tags + site.
export type Query = { source: Source; tags: string };

export type PresetKey = 'lesbian' | 'futa';

export type MediaFilter = 'all' | 'video' | 'image';
export type SortMode = 'random' | 'recent' | 'score';
export type Source = 'paheal' | 'e621' | 'redgifs' | 'rule34xxx';

export type Settings = {
  source: Source;
  apiKey: string;
  userId: string;
  blacklist: string[];
  mediaFilter: MediaFilter;
  sort: SortMode;
  hideGay: boolean;
  muted: boolean;
};
