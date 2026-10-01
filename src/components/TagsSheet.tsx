import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Post } from '../types';
import { ui } from './ui';

type Props = {
  post: Post | null;
  onClose: () => void;
  onOpenTag: (tag: string) => void;
  onBlockTag: (tag: string) => void;
};

export default function TagsSheet({ post, onClose, onOpenTag, onBlockTag }: Props) {
  return (
    <Modal visible={!!post} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={ui.backdrop} onPress={onClose}>
        <Pressable style={[ui.sheet, { maxHeight: '70%' }]}>
          <Text style={ui.title}>Tags</Text>
          <Text style={styles.hint}>Toque para abrir um feed dessa tag · segure para bloquear</Text>
          <ScrollView contentContainerStyle={styles.wrap}>
            {post?.tags.map((t) => (
              <Pressable key={t} style={styles.tag} onPress={() => onOpenTag(t)} onLongPress={() => onBlockTag(t)}>
                <Text style={styles.tagText}>{t}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  hint: { color: '#888', fontSize: 12, marginBottom: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: '#262626', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7 },
  tagText: { color: '#eee', fontSize: 13 },
});
