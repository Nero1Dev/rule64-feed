import { useEffect, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { HARD_BLOCKED, SOURCES } from '../api';
import { MediaFilter, Settings, SortMode, Source } from '../types';
import { ui } from './ui';

type Props = {
  visible: boolean;
  settings: Settings;
  onClose: () => void;
  onSave: (s: Settings) => void;
};

function Segment<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <View style={ui.segment}>
      {options.map(([v, label]) => (
        <Pressable key={v} style={[ui.segmentItem, value === v && ui.segmentActive]} onPress={() => onChange(v)}>
          <Text style={ui.segmentText}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function SettingsSheet({ visible, settings, onClose, onSave }: Props) {
  const [draft, setDraft] = useState(settings);
  const [blacklist, setBlacklist] = useState('');

  useEffect(() => {
    if (!visible) return;
    setDraft(settings);
    setBlacklist(settings.blacklist.join(' '));
  }, [visible, settings]);

  const save = () =>
    onSave({
      ...draft,
      apiKey: draft.apiKey.trim(),
      userId: draft.userId.trim(),
      blacklist: blacklist.split(/\s+/).filter(Boolean),
    });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={ui.backdrop}>
        <View style={[ui.sheet, { maxHeight: '90%' }]}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={ui.title}>Configurações</Text>

            <Text style={ui.label}>Fonte</Text>
            <Segment<Source>
              value={draft.source}
              options={(Object.keys(SOURCES) as Source[]).map((k) => [k, SOURCES[k].label])}
              onChange={(source) => setDraft({ ...draft, source })}
            />

            <Text style={ui.label}>Tipo de mídia</Text>
            <Segment<MediaFilter>
              value={draft.mediaFilter}
              options={[['all', 'Tudo'], ['video', 'Vídeos'], ['image', 'Imagens']]}
              onChange={(mediaFilter) => setDraft({ ...draft, mediaFilter })}
            />

            <Text style={ui.label}>Ordem</Text>
            <Segment<SortMode>
              value={draft.sort}
              options={[['random', 'Aleatório'], ['recent', 'Recentes'], ['score', 'Mais votados']]}
              onChange={(sort) => setDraft({ ...draft, sort })}
            />

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
              <Text style={{ color: '#fff', fontSize: 15 }}>Ocultar conteúdo gay (masculino)</Text>
              <Switch
                value={draft.hideGay}
                onValueChange={(hideGay) => setDraft({ ...draft, hideGay })}
                trackColor={{ true: '#ff2d55', false: '#444' }}
              />
            </View>

            <Text style={ui.label}>Blacklist (tags separadas por espaço)</Text>
            <TextInput
              style={[ui.input, { minHeight: 70, textAlignVertical: 'top' }]}
              value={blacklist}
              onChangeText={setBlacklist}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={[ui.label, { fontSize: 11 }]}>Sempre bloqueadas: {HARD_BLOCKED.join(', ')}</Text>

            {draft.source === 'rule34xxx' && (
            <>
            <Text style={ui.label}>API do rule34.xxx (My Account → Options → API Access Credentials)</Text>
            <TextInput
              style={ui.input}
              value={draft.userId}
              onChangeText={(userId) => setDraft({ ...draft, userId })}
              placeholder="user_id"
              placeholderTextColor="#666"
              keyboardType="number-pad"
            />
            <View style={{ height: 8 }} />
            <TextInput
              style={ui.input}
              value={draft.apiKey}
              onChangeText={(apiKey) => setDraft({ ...draft, apiKey })}
              placeholder="api_key"
              placeholderTextColor="#666"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
            />
            <Pressable onPress={() => Linking.openURL('https://rule34.xxx/index.php?page=account&s=options')}>
              <Text style={[ui.label, { color: '#ff6b8a' }]}>Abrir página de credenciais ↗</Text>
            </Pressable>
            </>
            )}

            <View style={ui.row}>
              <Pressable style={[ui.button, ui.secondary]} onPress={onClose}>
                <Text style={ui.buttonText}>Cancelar</Text>
              </Pressable>
              <Pressable style={ui.button} onPress={save}>
                <Text style={ui.buttonText}>Salvar</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
