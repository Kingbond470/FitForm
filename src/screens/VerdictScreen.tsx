// Verdict card — the viral artifact. Rating-card format, branding baked into export.
// Share render == screenshot render. Wardrobe teaser (P0) pulls into the payoff —
// FREE during v1 launch (no paywall); see shared/entitlements.ts.
import React, { useRef } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import ShareCard from '@/components/ShareCard';
import { SHARE_DIALOG_TITLE } from '@shared/share';
import type { StyleProfile } from '@shared/types';

type Props = { profile: StyleProfile; onUnlockWardrobe: () => void };

export default function VerdictScreen({ profile, onUnlockWardrobe }: Props) {
  const cardRef = useRef<View>(null);

  async function onShare() {
    try {
      // Capture the off-screen export card (branding baked in) -> share sheet.
      const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: SHARE_DIALOG_TITLE });
      }
    } catch {
      // capture/share failed (e.g. permission/cancel) — no-op, user can retry.
    }
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

      {/* WARDROBE TEASER (P0) — pulls into the payoff. Free during v1 launch. */}
      <Pressable style={styles.teaser} onPress={onUnlockWardrobe}>
        <Text style={styles.teaserT}>Build outfits from your closet →</Text>
        <Text style={styles.teaserSub}>Combinations made for your look — free</Text>
      </Pressable>

      {/* Off-screen export card — what actually gets captured + shared. */}
      <View style={styles.offscreen} pointerEvents="none">
        <ShareCard ref={cardRef} profile={profile} />
      </View>
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
  offscreen: { position: 'absolute', left: -10000, top: 0 },
});
