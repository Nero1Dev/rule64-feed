import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import FeedView from './src/components/FeedView';
import FeedEditor from './src/components/FeedEditor';
import SettingsSheet from './src/components/SettingsSheet';
import TagsSheet from './src/components/TagsSheet';
import { feedQuery } from './src/api';
import * as store from './src/storage';
import { Feed, Post, postKey, Query, Settings } from './src/types';

const FAVORITES_ID = '__favorites__';
const MIX_ID = '__mix__';

function Main() {
  const insets = useSafeAreaInsets();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [loaded, setLoaded] = useState(false);
  const [feeds, setFeeds] = useState<Feed[]>(store.DEFAULT_FEEDS);
  const [settings, setSettings] = useState<Settings>(store.DEFAULT_SETTINGS);
  const [favorites, setFavorites] = useState<Post[]>([]);
  const [currentId, setCurrentId] = useState(MIX_ID);
  const [editor, setEditor] = useState<{ open: boolean; feed?: Feed }>({ open: false });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tagsPost, setTagsPost] = useState<Post | null>(null);

  useEffect(() => {
    Promise.all([store.loadFeeds(), store.loadSettings(), store.loadFavorites()]).then(([f, s, fav]) => {
      setFeeds(f);
      setSettings(s);
      setFavorites(fav);
      setLoaded(true);
    });
  }, []);

  const updateFeeds = (next: Feed[]) => {
    setFeeds(next);
    store.saveFeeds(next);
  };

  const updateSettings = (next: Settings) => {
    setSettings(next);
    store.saveSettings(next);
  };

  const favoriteKeys = useMemo(() => new Set(favorites.map(postKey)), [favorites]);

  const toggleFavorite = useCallback((post: Post) => {
    setFavorites((prev) => {
      const key = postKey(post);
      const next = prev.some((p) => postKey(p) === key) ? prev.filter((p) => postKey(p) !== key) : [post, ...prev];
      store.saveFavorites(next);
      return next;
    });
  }, []);

  const toggleMute = useCallback(() => {
    setSettings((s) => {
      const next = { ...s, muted: !s.muted };
      store.saveSettings(next);
      return next;
    });
  }, []);

  const saveFeed = (feed: Feed) => {
    const exists = feeds.some((f) => f.id === feed.id);
    updateFeeds(exists ? feeds.map((f) => (f.id === feed.id ? feed : f)) : [...feeds, feed]);
    setCurrentId(feed.id);
    setEditor({ open: false });
  };

  const deleteFeed = (feed: Feed) => {
    const next = feeds.filter((f) => f.id !== feed.id);
    updateFeeds(next);
    if (currentId === feed.id) setCurrentId(MIX_ID);
    setEditor({ open: false });
  };

  const openTag = (tag: string) => {
    // O feed novo fica na fonte de onde veio o post (as tags são daquele site).
    const source = tagsPost?.origin;
    setTagsPost(null);
    const existing = feeds.find((f) => f.tags === tag && f.source === source);
    if (existing) return setCurrentId(existing.id);
    saveFeed({ id: String(Date.now()), name: tag.replace(/_/g, ' '), tags: tag, source });
  };

  const blockTag = (tag: string) => {
    setTagsPost(null);
    if (!settings.blacklist.includes(tag)) updateSettings({ ...settings, blacklist: [...settings.blacklist, tag] });
  };

  const current = feeds.find((f) => f.id === currentId);
  const isFavorites = currentId === FAVORITES_ID;
  // "Para você": mistura até 6 feeds salvos (os com tags) intercalados.
  const allQuery: Query = { source: settings.source, tags: '' };
  // Entram no mix os feeds com tags ou com fonte própria (ex.: RedGIFs em alta).
  const mixQueries = feeds
    .map((f) => feedQuery(f, settings.source))
    .filter((q): q is Query => !!q && (!!q.tags || q.source !== settings.source))
    .slice(0, 6);
  const currentQuery = current ? feedQuery(current, settings.source) : allQuery;
  // [] = este feed não existe na fonte atual (o FeedView mostra o aviso).
  const queries =
    currentId === MIX_ID ? (mixQueries.length ? mixQueries : [allQuery]) : currentQuery === null ? [] : [currentQuery];

  return (
    <View style={styles.root} onLayout={(e) => setSize(e.nativeEvent.layout)}>
      <StatusBar style="light" />

      {loaded && size.height > 0 && (
        <FeedView
          key={currentId}
          queries={queries}
          localPosts={isFavorites ? favorites : undefined}
          settings={settings}
          width={size.width}
          height={size.height}
          favoriteKeys={favoriteKeys}
          onToggleMute={toggleMute}
          onToggleFavorite={toggleFavorite}
          onShowTags={setTagsPost}
        />
      )}

      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          <Tab label="♥ Salvos" active={isFavorites} onPress={() => setCurrentId(FAVORITES_ID)} />
          <Tab label="Para você" active={currentId === MIX_ID} onPress={() => setCurrentId(MIX_ID)} />
          {feeds.map((f) => (
            <Tab
              key={f.id}
              label={f.name}
              active={f.id === currentId}
              onPress={() => setCurrentId(f.id)}
              onLongPress={() => setEditor({ open: true, feed: f })}
            />
          ))}
        </ScrollView>
        <Pressable style={styles.iconButton} onPress={() => setEditor({ open: true })} hitSlop={6}>
          <Text style={styles.iconText}>＋</Text>
        </Pressable>
        <Pressable style={styles.iconButton} onPress={() => setSettingsOpen(true)} hitSlop={6}>
          <Text style={styles.iconText}>⚙</Text>
        </Pressable>
      </View>

      <FeedEditor
        visible={editor.open}
        source={settings.source}
        initial={editor.feed}
        onClose={() => setEditor({ open: false })}
        onSave={saveFeed}
        onDelete={deleteFeed}
      />
      <SettingsSheet
        visible={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onSave={(s) => {
          updateSettings(s);
          setSettingsOpen(false);
        }}
      />
      <TagsSheet post={tagsPost} onClose={() => setTagsPost(null)} onOpenTag={openTag} onBlockTag={blockTag} />
    </View>
  );
}

function Tab({ label, active, onPress, onLongPress }: { label: string; active: boolean; onPress: () => void; onLongPress?: () => void }) {
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} style={styles.tab}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
      {active && <View style={styles.tabUnderline} />}
    </Pressable>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Main />
    </SafeAreaProvider>
  );
}

const shadow = { textShadowColor: 'rgba(0,0,0,0.9)', textShadowRadius: 4 };

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  tabs: { alignItems: 'center', paddingRight: 8 },
  tab: { paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center' },
  tabText: { color: 'rgba(255,255,255,0.65)', fontSize: 16, fontWeight: '600', ...shadow },
  tabTextActive: { color: '#fff', fontWeight: '800' },
  tabUnderline: { marginTop: 4, height: 2, width: 22, borderRadius: 1, backgroundColor: '#fff' },
  iconButton: { paddingHorizontal: 8, paddingVertical: 4 },
  iconText: { color: '#fff', fontSize: 22, ...shadow },
});
