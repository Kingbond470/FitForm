// Hero screen — single action "Scan me". Zero setup. Value before account.
// Guided capture (face + body overlay) prevents bad photos at source. Trust copy: photo deleted after analysis.
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { scan } from '@/api/client';
import type { ScanResponse } from '@shared/types';

type Props = { onVerdict: (r: Extract<ScanResponse, { status: 'ok' }>) => void };

export default function ScanScreen({ onVerdict }: Props) {
  const [busy, setBusy] = useState(false);
  const [retake, setRetake] = useState<string | null>(null);

  async function onScan() {
    setBusy(true); setRetake(null);
    // TODO: guided capture flow -> faceUri, bodyUri (expo-camera with overlay)
    const faceUri = '', bodyUri = '';
    const r = await scan(faceUri, bodyUri);
    setBusy(false);
    if (r.status === 'ok') onVerdict(r);
    else if (r.status === 'retake') setRetake(r.message);
    else setRetake('Something went wrong. Try again.');
  }

  return (
    <View style={styles.c}>
      <Text style={styles.h}>What suits you</Text>
      <Pressable style={styles.cta} onPress={onScan} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaT}>Scan me</Text>}
      </Pressable>
      {retake && <Text style={styles.retake}>{retake}</Text>}
      <Text style={styles.trust}>Your photo is deleted after analysis.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 20 },
  h: { fontSize: 32, fontWeight: '800' },
  cta: { backgroundColor: '#111', paddingVertical: 18, paddingHorizontal: 48, borderRadius: 32 },
  ctaT: { color: '#fff', fontSize: 18, fontWeight: '700' },
  retake: { color: '#c0392b', textAlign: 'center' },
  trust: { color: '#888', fontSize: 12 },
});
