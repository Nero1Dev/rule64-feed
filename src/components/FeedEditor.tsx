import { useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { autocomplete, PRESETS, SOURCES, TagSuggestion } from '../api';
import { Feed, PresetKey, Source } from '../types';
import { ui } from './ui';

type Props = {
  visible: boolean;
  source: Source; // fonte padrão (configurações)
  initial?: Feed;
  onClose: () => void;
  onSave: (feed: Feed) => void;
  onDelete?: (feed: Feed) => void;
};

export default function FeedEditor({ visible, source, initial, onClose, onSave, onDelete }: Props) {
  const [name, setName] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([]);
  const [feedSource, setFeedSource] = useState<Source | undefined>(); // undefined = segue a fonte padrão
  const activeSource = feedSource ?? source;

  useEffect(() => {
    if (!visible) return;
    setName(initial?.name ?? '');
    setTags(initial?.tags.split(/\s+/).filter(Boolean) ?? []);
    setInput('');
    setFeedSource(initial?.source);
  }, [visible, initial]);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      const res = await autocomplete(input, activeSource);
      if (!cancelled) setSuggestions(res);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [input, activeSource]);

  const addTag = (raw: string) => {
    const neg = input.trim().startsWith('-');
    const tag = (neg && !raw.startsWith('-') ? '-' : '') + raw.trim().replace(/\s+/g, '_');
    if (tag && tag !== '-' && !tags.includes(tag)) setTags([...tags, tag]);
    setInput('');
    setSuggestions([]);
  };

  const save = () => {
    const finalTags = input.trim() ? [...tags, input.trim().replace(/\s+/g, '_')] : tags;
    if (!finalTags.length) {
      // Feed pronto sem tags extras: mantém o preset.
      if (initial?.preset) return onSave({ ...initial, name: name.trim() || initial.name, source: feedSource });
      // Sem tags mas com fonte fixa: o feed "em alta"/recentes daquela fonte.
      if (feedSource) {
        return onSave({
          id: initial?.id ?? String(Date.now()),
          name: name.trim() || SOURCES[feedSource].label,
          tags: '',
          source: feedSource,
        });
      }
      return;
    }
    onSave({
      id: initial?.id ?? String(Date.now()),
      name: name.trim() || finalTags.filter((t) => !t.startsWith('-'))[0] || finalTags[0],
      tags: finalTags.join(' '),
      source: feedSource,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={ui.backdrop}>
        <View style={[ui.sheet, { height: '85%' }]}>
          <Text style={ui.title}>{initial ? 'Editar feed' : 'Novo feed por tema'}</Text>

          <Text style={ui.label}>Fonte do feed</Text>
          <View style={styles.chips}>
            {([undefined, ...Object.keys(SOURCES)] as (Source | undefined)[]).map((k) => (
              <Pressable
                key={k ?? 'default'}
                style={[styles.chip, feedSource !== k && styles.chipOff]}
                onPress={() => setFeedSource(k)}
              >
                <Text style={styles.chipText}>{k ? SOURCES[k].label : `Padrão (${SOURCES[source].label})`}</Text>
              </Pressable>
            ))}
          </View>

          {!initial && (
            <>
              <Text style={ui.label}>Prontos (tags certas para cada fonte)</Text>
              <View style={styles.chips}>
                {(Object.keys(PRESETS) as PresetKey[]).map((k) => (
                  <Pressable
                    key={k}
                    style={styles.chip}
                    onPress={() =>
                      onSave({ id: String(Date.now()), name: PRESETS[k].label, tags: '', preset: k, source: feedSource })
                    }
                  >
                    <Text style={styles.chipText}>＋ {PRESETS[k].label}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          <Text style={ui.label}>Nome</Text>
          <TextInput style={ui.input} value={name} onChangeText={setName} placeholder="Ex.: Overwatch" placeholderTextColor="#666" />

          <Text style={ui.label}>Tags (prefixo “-” exclui a tag)</Text>
          <View style={styles.chips}>
            {tags.map((t) => (
              <Pressable key={t} style={[styles.chip, t.startsWith('-') && styles.chipNeg]} onPress={() => setTags(tags.filter((x) => x !== t))}>
                <Text style={styles.chipText}>{t}  ✕</Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={ui.input}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => input.trim() && addTag(input.trim().replace(/^-/, ''))}
            placeholder="Buscar tag, personagem, artista..."
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <FlatList
            style={{ flex: 1 }}
            data={suggestions}
            keyExtractor={(s) => s.value}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable style={styles.suggestion} onPress={() => addTag(item.value)}>
                <Text style={styles.suggestionText}>{item.label}</Text>
              </Pressable>
            )}
          />

          <View style={ui.row}>
            {initial && onDelete && (
              <Pressable style={[ui.button, ui.danger]} onPress={() => onDelete(initial)}>
                <Text style={ui.buttonText}>Excluir</Text>
              </Pressable>
            )}
            <Pressable style={[ui.button, ui.secondary]} onPress={onClose}>
              <Text style={ui.buttonText}>Cancelar</Text>
            </Pressable>
            <Pressable style={ui.button} onPress={save}>
              <Text style={ui.buttonText}>Salvar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  chip: { backgroundColor: '#ff2d55', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
  chipNeg: { backgroundColor: '#555' },
  chipOff: { backgroundColor: '#2a2a2a' },
  chipText: { color: '#fff', fontSize: 13 },
  suggestion: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#333' },
  suggestionText: { color: '#eee', fontSize: 15 },
});
