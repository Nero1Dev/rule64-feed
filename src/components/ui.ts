import { StyleSheet } from 'react-native';

export const ui = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#141414', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 18, paddingBottom: 30 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 12 },
  label: { color: '#aaa', fontSize: 13, marginTop: 10, marginBottom: 6 },
  input: { backgroundColor: '#222', color: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 12 },
  button: { backgroundColor: '#ff2d55', paddingHorizontal: 18, paddingVertical: 11, borderRadius: 22 },
  secondary: { backgroundColor: '#333' },
  danger: { backgroundColor: '#7a1020', marginRight: 'auto' },
  buttonText: { color: '#fff', fontWeight: '700' },
  segment: { flexDirection: 'row', backgroundColor: '#222', borderRadius: 10, padding: 3 },
  segmentItem: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  segmentActive: { backgroundColor: '#ff2d55' },
  segmentText: { color: '#fff', fontSize: 13 },
});
