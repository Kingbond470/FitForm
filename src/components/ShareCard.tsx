// Dedicated EXPORT card — fixed dimensions, branding baked INTO the composition
// (not an edge overlay) so it can't be trivially cropped out. Rendered off-screen
// and captured via react-native-view-shot. Kept separate from the on-screen card
// so "looks right on screen" never diverges from "looks right in the export".
import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BRANDING } from '@shared/share';
import type { StyleProfile } from '@shared/types';

// Logical export size; device pixel ratio upscales to ~EXPORT_SIZE on capture.
const W = 360;
const H = 450;

const ShareCard = forwardRef<View, { profile: StyleProfile }>(({ profile }, ref) => (
  <View ref={ref} collapsable={false} style={styles.card}>
    <Text style={styles.kicker}>{BRANDING.wordmark} · {BRANDING.tagline}</Text>
    <Text style={styles.headline}>{profile.headline}</Text>
    <Text style={styles.meta}>{profile.face_shape} · {profile.body_type} · {profile.color_season.replace(/_/g, ' ')}</Text>

    <View style={styles.rules}>
      {profile.rules.slice(0, 5).map((r, i) => (
        <Text key={i} style={r.type === 'wear' ? styles.wear : styles.avoid} numberOfLines={1}>
          {r.type === 'wear' ? '✓' : '✕'} {r.target}
        </Text>
      ))}
    </View>

    {/* Branding baked mid-composition, not a croppable edge bar. */}
    <View style={styles.brandRow}>
      <Text style={styles.brandMark}>{BRANDING.wordmark}</Text>
      <Text style={styles.brandHandle}>{BRANDING.handle}</Text>
    </View>
  </View>
));

export default ShareCard;

const styles = StyleSheet.create({
  card: { width: W, height: H, backgroundColor: '#111', borderRadius: 28, padding: 28, justifyContent: 'space-between' },
  kicker: { color: '#9a9a9a', fontSize: 13, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  headline: { color: '#fff', fontSize: 30, fontWeight: '800', marginTop: 8 },
  meta: { color: '#bdbdbd', fontSize: 15, textTransform: 'capitalize', marginTop: 6 },
  rules: { gap: 10, marginTop: 18 },
  wear: { color: '#2ecc71', fontSize: 17, fontWeight: '600' },
  avoid: { color: '#e67e22', fontSize: 17, fontWeight: '600' },
  brandRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#2a2a2a', paddingTop: 14 },
  brandMark: { color: '#fff', fontSize: 20, fontWeight: '900' },
  brandHandle: { color: '#9a9a9a', fontSize: 14, fontWeight: '600' },
});
