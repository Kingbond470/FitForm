// Verdict card — the viral artifact. Rating-card format, branding baked into export.
// Share render == screenshot render. Blurred wardrobe teaser (P0) seeds paywall same session.
import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import * as Sharing from 'expo-sharing';
import type { StyleProfile } from '@shared/types';

type Props = { profile: StyleProfile; onUnlockWardrobe: () => void };

export default function VerdictScreen({ profile, onUnlockWardrobe }: Props) {
  async function onShare() {
    // TODO: render card View -> capture to image (react-native-view-shot) w/ baked branding -> share.
    const uri = ''; // captured card image
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
  }

  return (
    <ScrollView contentContainerStyle={styles.c}>
      {/* CARD — this is what travels. Branding non-croppable in export. */}
      <View style={styles.card}>
        <Text style={styles.headline}>{profile.headline}</Text>
        <Text style={styles.meta}>{profile.face_shape} · {profile.body_type} · {profile.color_season}</Text>
        <View style={styles.rules}>
          {profile.rules.map((r, i) => (
            <Text key={i} style={r.type === 'wear' ? styles.wear : styles.avoid}>
              {r.type === 'wear' ? '✓' : '✕'} {r.target}
            </Text>
          ))}
        </View>
        <Text style={styles.brand}>fitform · what suits you</Text>
      </View>

      <Pressable style={styles.share} onPress={onShare}>
        <Text style={styles.shareT}>Share</Text>
      </Pressable>

      {/* BLURRED WARDROBE TEASER (P0) — desire before paywall. */}
      <Pressable style={styles.teaser} onPress={onUnlockWardrobe}>
        <Text style={styles.teaserT}>Build outfits from your closet →</Text>
        <Text style={styles.teaserSub}>Unlock combinations made for your look</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  c: { padding: 20, gap: 16 },
  card: { backgroundColor: '#111', borderRadius: 20, padding: 24, gap: 12 },
  headline: { color: '#fff', fontSize: 24, fontWeight: '800' },
  meta: { color: '#bbb', textTransform: 'capitalize' },
  rules: { gap: 6, marginTop: 8 },
  wear: { color: '#2ecc71' },
  avoid: { color: '#e67e22' },
  brand: { color: '#666', marginTop: 12, fontSize: 12 },
  share: { backgroundColor: '#111', padding: 16, borderRadius: 28, alignItems: 'center' },
  shareT: { color: '#fff', fontWeight: '700', fontSize: 16 },
  teaser: { borderWidth: 1, borderColor: '#ddd', borderRadius: 16, padding: 18, gap: 4 },
  teaserT: { fontWeight: '700', fontSize: 16 },
  teaserSub: { color: '#888' },
});
