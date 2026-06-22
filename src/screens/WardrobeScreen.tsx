// Lean wardrobe add (R3). Batch-add via library/camera, per-item async cards,
// editable tag chips (<=1 tap), progress toward the 5-item outfit threshold.
// Friction is the enemy here — this is the screen incumbents get wrong.
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { addGarment, listWardrobe, updateGarmentTag } from '@/api/client';
import type { WardrobeItem, ItemCategory } from '@shared/types';

const OUTFIT_THRESHOLD = 5;
const CATEGORIES: ItemCategory[] = ['top', 'bottom', 'outer', 'shoe', 'accessory'];

type Pending = { key: string; uri: string };
type Props = { items: WardrobeItem[]; onItemsChange: (items: WardrobeItem[]) => void; onSeeOutfits: () => void };

export default function WardrobeScreen({ items, onItemsChange, onSeeOutfits }: Props) {
  const [pending, setPending] = useState<Pending[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { listWardrobe().then((rows) => { if (rows.length) onItemsChange(rows); }); }, []);

  async function pickAndAdd() {
    setError(null);
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (res.canceled) return;
    const uri = res.assets[0].uri;
    const key = `${Date.now()}`;
    setPending((p) => [{ key, uri }, ...p]);              // optimistic card + spinner

    const r = await addGarment(uri);
    setPending((p) => p.filter((x) => x.key !== key));
    if (r.status === 'ok') onItemsChange([r.item, ...items]);
    else setError(r.message);
  }

  // <=1-tap correction: cycle the category to the next enum value.
  async function cycleCategory(it: WardrobeItem) {
    const next = CATEGORIES[(CATEGORIES.indexOf(it.category) + 1) % CATEGORIES.length];
    onItemsChange(items.map((x) => (x.id === it.id ? { ...x, category: next, tags_source: 'user-edited' } : x)));
    await updateGarmentTag(it.id, { category: next });
  }

  const enough = items.length >= OUTFIT_THRESHOLD;

  return (
    <View style={styles.c}>
      <Text style={styles.h}>Your closet</Text>
      <Text style={styles.progress}>
        {enough ? 'Ready for outfits' : `${items.length} / ${OUTFIT_THRESHOLD} items to unlock outfits`}
      </Text>

      <FlatList
        data={[...pending, ...items] as (Pending | WardrobeItem)[]}
        keyExtractor={(x: any) => x.id ?? x.key}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ gap: 12, paddingVertical: 12 }}
        ListEmptyComponent={<Text style={styles.empty}>Add a few pieces you own to get outfits built for your look.</Text>}
        renderItem={({ item }: any) =>
          'key' in item ? (
            <View style={styles.card}><ActivityIndicator /></View>
          ) : (
            <View style={styles.card}>
              <Image source={{ uri: item.image_url }} style={styles.img} resizeMode="contain" />
              <Pressable onPress={() => cycleCategory(item)}>
                <Text style={styles.chip}>{item.category}</Text>
              </Pressable>
              <Text style={styles.sub}>{item.color_primary} · f{item.formality}</Text>
            </View>
          )
        }
      />

      {error && <Text style={styles.err}>{error}</Text>}
      <Pressable style={styles.add} onPress={pickAndAdd}><Text style={styles.addT}>+ Add item</Text></Pressable>
      <Pressable style={[styles.go, !enough && styles.goOff]} onPress={onSeeOutfits} disabled={!enough}>
        <Text style={styles.goT}>See outfits</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, padding: 20, gap: 8 },
  h: { fontSize: 26, fontWeight: '800' },
  progress: { color: '#666' },
  empty: { color: '#999', textAlign: 'center', padding: 24 },
  card: { flex: 1, backgroundColor: '#f4f4f5', borderRadius: 14, padding: 10, minHeight: 150, alignItems: 'center', justifyContent: 'center', gap: 6 },
  img: { width: '100%', height: 90 },
  chip: { backgroundColor: '#111', color: '#fff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, overflow: 'hidden', textTransform: 'capitalize' },
  sub: { color: '#888', fontSize: 12, textTransform: 'capitalize' },
  err: { color: '#c0392b' },
  add: { borderWidth: 1, borderColor: '#111', borderRadius: 28, padding: 14, alignItems: 'center' },
  addT: { fontWeight: '700' },
  go: { backgroundColor: '#111', borderRadius: 28, padding: 16, alignItems: 'center' },
  goOff: { opacity: 0.35 },
  goT: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
