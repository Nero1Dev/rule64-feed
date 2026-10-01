import { memo, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { MEDIA_HEADERS, postPageUrl } from '../api';
import { Post } from '../types';

type Props = {
  post: Post;
  width: number;
  height: number;
  active: boolean; // item visível na tela
  near: boolean; // perto o bastante para pré-carregar
  muted: boolean;
  favorite: boolean;
  onToggleMute: () => void;
  onToggleFavorite: (post: Post) => void;
  onShowTags: (post: Post) => void;
};

function VideoMedia({ post, active, muted }: { post: Post; active: boolean; muted: boolean }) {
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const player = useVideoPlayer({ uri: post.fileUrl, headers: MEDIA_HEADERS }, (p) => {
    p.loop = true;
    p.muted = muted;
  });

  useEffect(() => {
    player.muted = muted;
  }, [muted, player]);

  useEffect(() => {
    if (active && !paused) player.play();
    else player.pause();
  }, [active, paused, player]);

  useEffect(() => {
    if (!active) setPaused(false);
  }, [active]);

  return (
    <Pressable style={StyleSheet.absoluteFill} onPress={() => setPaused((v) => !v)}>
      {!ready && (
        <Image source={{ uri: post.previewUrl }} style={StyleSheet.absoluteFill} contentFit="contain" blurRadius={8} />
      )}
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls={false}
        onFirstFrameRender={() => setReady(true)}
      />
      {!ready && <ActivityIndicator style={styles.center} color="#fff" size="large" />}
      {paused && <Text style={[styles.center, styles.pauseIcon]}>▶</Text>}
    </Pressable>
  );
}

function MediaItem(props: Props) {
  const { post, width, height, active, near, muted, favorite } = props;

  return (
    <View style={{ width, height, backgroundColor: '#000' }}>
      {post.kind === 'video' ? (
        near ? (
          <VideoMedia post={post} active={active} muted={muted} />
        ) : (
          <Image source={{ uri: post.previewUrl }} style={StyleSheet.absoluteFill} contentFit="contain" />
        )
      ) : (
        <Image
          source={{ uri: post.displayUrl, headers: MEDIA_HEADERS }}
          placeholder={{ uri: post.previewUrl }}
          placeholderContentFit="contain"
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          autoplay={active}
          transition={150}
        />
      )}

      <View style={styles.actions}>
        <ActionButton label={favorite ? '♥' : '♡'} caption="Salvar" onPress={() => props.onToggleFavorite(post)} highlight={favorite} />
        <ActionButton label="#" caption="Tags" onPress={() => props.onShowTags(post)} />
        {post.kind === 'video' && <ActionButton label={muted ? '🔇' : '🔊'} caption="Som" onPress={props.onToggleMute} />}
        <ActionButton label="↗" caption="Abrir" onPress={() => Linking.openURL(postPageUrl(post.id))} />
      </View>

      <View style={styles.info} pointerEvents="none">
        <Text style={styles.score}>★ {post.score}  ·  #{post.id}</Text>
        <Text style={styles.tags} numberOfLines={2}>
          {post.tags.slice(0, 12).join('  ')}
        </Text>
      </View>
    </View>
  );
}

function ActionButton({ label, caption, onPress, highlight }: { label: string; caption: string; onPress: () => void; highlight?: boolean }) {
  return (
    <Pressable onPress={onPress} style={styles.action} hitSlop={8}>
      <Text style={[styles.actionIcon, highlight && { color: '#ff2d55' }]}>{label}</Text>
      <Text style={styles.actionCaption}>{caption}</Text>
    </Pressable>
  );
}

export default memo(MediaItem);

const shadow = { textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 4 };

const styles = StyleSheet.create({
  center: { position: 'absolute', alignSelf: 'center', top: '45%' },
  pauseIcon: { fontSize: 64, color: 'rgba(255,255,255,0.8)' },
  actions: { position: 'absolute', right: 10, bottom: 140, alignItems: 'center', gap: 20 },
  action: { alignItems: 'center' },
  actionIcon: { fontSize: 30, color: '#fff', ...shadow },
  actionCaption: { fontSize: 11, color: '#fff', marginTop: 2, ...shadow },
  info: { position: 'absolute', left: 12, right: 80, bottom: 40 },
  score: { color: '#fff', fontWeight: '700', fontSize: 14, ...shadow },
  tags: { color: '#ddd', fontSize: 12, marginTop: 4, ...shadow },
});
