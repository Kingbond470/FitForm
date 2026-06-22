// Personalized combos (R4). Renders ranker output as outfit cards (item images
// stacked). Handles the 'insufficient' state by routing back to the wardrobe
// with the gap. Occasion filter control = P1 (stubbed).
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, Image, ActivityIndicator } from 'react-native';
import { getOutfits } from '@/api/client';
import type { WardrobeItem, Outfit, OutfitsResponse } from '@shared/types';

type Props = { items: WardrobeItem[]; onBack: () => void };

export default function OutfitsScreen({ items, onBack }: Props) {
  const [state, setState] = useState<OutfitsResponse | null>(null);
  const byId = new Map(items.map((i) => [i.id, i]));

  useEffect(() => { getOutfits().then(setState); }, []);

  if (!state) return <Center><ActivityIndicator /><Text style={styles.muted}>Building your outfits…</Text></Center>;

  if (state.status === 'insufficient') {
    return (
      <Center>
        <Text style={styles.h}>Add a few more pieces</Text>
        <Text style={styles.muted}>
          Need ≥{state.need.min_items} items across ≥{state.need.min_categories} categories.
          You have {state.have.items} in {state.have.categories}.
        </Text>
        <Pressable style={styles.back} onPress={onBack}><Text style={styles.backT}>Back to closet</Text></Pressable>
      </Center>
    );
  }

  return (
    <View style={styles.c}>
      <Text style={styles.h}>Outfits for you</Text>
      <FlatList
        data={state.outfits}
        keyExtractor={(o: Outfit) => o.id}
        contentContainerStyle={{ gap: 14, paddingVertical: 12 }}
        renderItem={({ item: o }: { item: Outfit }) => (
          <View style={styles.outfit}>
            <View style={styles.row}>
              {o.item_ids.map((id) => {
                const it = byId.get(id);
                return it ? <Image key={id} source={{ uri: it.image_url }} style={styles.thumb} resizeMode="contain" /> : null;
              })}
            </View>
            {o.occasion && <Text style={styles.muted}>{o.occasion}</Text>}
          </View>
        )}
      />
      <Pressable style={styles.back} onPress={onBack}><Text style={styles.backT}>Back to closet</Text></Pressable>
    </View>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <View style={[styles.c, { alignItems: 'center', justifyContent: 'center', gap: 12 }]}>{children}</View>;
}

const styles = StyleSheet.create({
  c: { flex: 1, padding: 20, gap: 8 },
  h: { fontSize: 26, fontWeight: '800' },
  muted: { color: '#777', textAlign: 'center' },
  outfit: { backgroundColor: '#f4f4f5', borderRadius: 16, padding: 14, gap: 8 },
  row: { flexDirection: 'row', gap: 10, justifyContent: 'space-around' },
  thumb: { width: 80, height: 100 },
  back: { borderWidth: 1, borderColor: '#111', borderRadius: 28, padding: 14, alignItems: 'center' },
  backT: { fontWeight: '700' },
});
