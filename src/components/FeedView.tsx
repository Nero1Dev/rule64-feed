import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, Pressable, StyleSheet, Text, View, ViewToken } from 'react-native';
import { fetchPosts, PAGE_SIZE } from '../api';
import { Post, Settings } from '../types';
import MediaItem from './MediaItem';

type Props = {
  tags: string;
  localPosts?: Post[]; // feed local (favoritos) em vez da API
  settings: Settings;
  width: number;
  height: number;
  favoriteIds: Set<number>;
  onToggleMute: () => void;
  onToggleFavorite: (post: Post) => void;
  onShowTags: (post: Post) => void;
};

export default function FeedView(props: Props) {
  const { tags, localPosts, settings, width, height } = props;
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const requestId = useRef(0);
  const listRef = useRef<FlatList<Post>>(null);

  const loadPage = useCallback(
    async (p: number, reset = false) => {
      const id = ++requestId.current;
      setLoading(true);
      setError(null);
      try {
        const { posts: batch, rawCount } = await fetchPosts(tags, p, settings);
        if (id !== requestId.current) return;
        setPosts((prev) => {
          if (reset) return batch;
          const seen = new Set(prev.map((x) => x.id));
          return [...prev, ...batch.filter((x) => !seen.has(x.id))];
        });
        setPage(p);
        // A blacklist local pode filtrar a página inteira, então só para quando a API não retornar nada.
        setDone(rawCount === 0);
      } catch (e) {
        if (id === requestId.current) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [tags, settings.apiKey, settings.userId, settings.mediaFilter, settings.sort, settings.blacklist],
  );

  useEffect(() => {
    if (localPosts) return;
    setPosts([]);
    setDone(false);
    setActiveIndex(0);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
    loadPage(0, true);
  }, [loadPage, localPosts]);

  const loadMore = () => {
    if (localPosts || loading || done || error) return;
    loadPage(page + 1);
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0];
    if (first?.index != null) setActiveIndex(first.index);
  }).current;

  const data = localPosts ?? posts;

  if (!data.length) {
    return (
      <View style={[styles.empty, { width, height }]}>
        {loading ? (
          <ActivityIndicator color="#fff" size="large" />
        ) : error ? (
          <>
            <Text style={styles.emptyText}>Erro: {error}</Text>
            <Pressable style={styles.retry} onPress={() => loadPage(0, true)}>
              <Text style={styles.retryText}>Tentar de novo</Text>
            </Pressable>
          </>
        ) : (
          <Text style={styles.emptyText}>{localPosts ? 'Nada salvo ainda. Toque ♡ para salvar.' : 'Nenhum resultado.'}</Text>
        )}
      </View>
    );
  }

  return (
    <FlatList
      ref={listRef}
      data={data}
      keyExtractor={(p) => String(p.id)}
      renderItem={({ item, index }) => (
        <MediaItem
          post={item}
          width={width}
          height={height}
          active={index === activeIndex}
          near={Math.abs(index - activeIndex) <= 1}
          muted={settings.muted}
          favorite={props.favoriteIds.has(item.id)}
          onToggleMute={props.onToggleMute}
          onToggleFavorite={props.onToggleFavorite}
          onShowTags={props.onShowTags}
        />
      )}
      pagingEnabled
      decelerationRate="fast"
      snapToInterval={height}
      showsVerticalScrollIndicator={false}
      getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
      onEndReached={loadMore}
      onEndReachedThreshold={PAGE_SIZE / 4}
      windowSize={5}
      initialNumToRender={2}
      maxToRenderPerBatch={3}
      removeClippedSubviews={Platform.OS !== 'web'}
      ListFooterComponent={
        error ? (
          <Pressable style={[styles.footer, { width }]} onPress={() => loadPage(page + 1)}>
            <Text style={styles.emptyText}>Erro ao carregar. Toque para tentar de novo.</Text>
          </Pressable>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#000' },
  emptyText: { color: '#ccc', textAlign: 'center', fontSize: 15 },
  retry: { marginTop: 16, backgroundColor: '#ff2d55', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  retryText: { color: '#fff', fontWeight: '700' },
  footer: { padding: 24, alignItems: 'center' },
});
