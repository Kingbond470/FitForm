// Hero screen — single action "Scan me". Zero setup (anon session already ensured).
// State machine: idle(hero) -> capturing(guided) -> analyzing -> done/retake.
// Trust copy: photo deleted after analysis (raw is never persisted server-side).
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { scan } from '@/api/client';
import CaptureFlow from '@/screens/CaptureFlow';
import type { ScanResponse } from '@shared/types';

type Props = { onVerdict: (r: Extract<ScanResponse, { status: 'ok' }>) => void };
type Phase = 'idle' | 'capturing' | 'analyzing';

export default function ScanScreen({ onVerdict }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [retake, setRetake] = useState<string | null>(null);

  async function analyze(faceUri: string, bodyUri: string) {
    setPhase('analyzing'); setRetake(null);
    const r = await scan(faceUri, bodyUri);
    if (r.status === 'ok') { onVerdict(r); return; }
    setPhase('idle');
    setRetake(r.status === 'retake' ? r.message : 'Something went wrong. Try again.');
  }

  if (phase === 'capturing') {
    return <CaptureFlow onComplete={analyze} onCancel={() => setPhase('idle')} />;
  }

  return (
    <View style={styles.c}>
      <Text style={styles.h}>What suits you</Text>
      <Pressable style={styles.cta} onPress={() => setPhase('capturing')} disabled={phase === 'analyzing'}>
        {phase === 'analyzing' ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaT}>Scan me</Text>}
      </Pressable>
      {phase === 'analyzing' && <Text style={styles.muted}>Reading your features…</Text>}
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
  muted: { color: '#888' },
  retake: { color: '#c0392b', textAlign: 'center' },
  trust: { color: '#888', fontSize: 12 },
});
