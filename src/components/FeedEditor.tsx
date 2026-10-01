import { useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { autocomplete, PRESETS, TagSuggestion } from '../api';
import { Feed, PresetKey, Source } from '../types';
import { ui } from './ui';

type Props = {
  visible: boolean;
  source: Source;
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

  useEffect(() => {
    if (!visible) return;
    setName(initial?.name ?? '');
    setTags(initial?.tags.split(/\s+/).filter(Boolean) ?? []);
    setInput('');
  }, [visible, initial]);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      const res = await autocomplete(input, source);
      if (!cancelled) setSuggestions(res);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [input, source]);

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
      // Feed pronto sem tags extras: mantém o preset (só renomeia).
      if (initial?.preset) onSave({ ...initial, name: name.trim() || initial.name });
      return;
    }
    onSave({
      id: initial?.id ?? String(Date.now()),
      name: name.trim() || finalTags.filter((t) => !t.startsWith('-'))[0] || finalTags[0],
      tags: finalTags.join(' '),
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={ui.backdrop}>
        <View style={[ui.sheet, { height: '85%' }]}>
          <Text style={ui.title}>{initial ? 'Editar feed' : 'Novo feed por tema'}</Text>

          {!initial && (
            <>
              <Text style={ui.label}>Prontos (tags certas para cada fonte)</Text>
              <View style={styles.chips}>
                {(Object.keys(PRESETS) as PresetKey[]).map((k) => (
                  <Pressable
                    key={k}
                    style={styles.chip}
                    onPress={() => onSave({ id: String(Date.now()), name: PRESETS[k].label, tags: '', preset: k })}
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
  chipText: { color: '#fff', fontSize: 13 },
  suggestion: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#333' },
  suggestionText: { color: '#eee', fontSize: 15 },
});
