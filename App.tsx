// v1 launches FREE — no paywall in the flow. Verdict -> Wardrobe <-> Outfits,
// all open. Monetization re-enables via shared/entitlements.ts (FREE_LAUNCH).
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native';
import ScanScreen from '@/screens/ScanScreen';
import VerdictScreen from '@/screens/VerdictScreen';
import WardrobeScreen from '@/screens/WardrobeScreen';
import OutfitsScreen from '@/screens/OutfitsScreen';
import { ensureSession } from '@/lib/auth';
import { track } from '@/lib/analytics';
import { EVENTS } from '@shared/analytics';
import type { StyleProfile, WardrobeItem } from '@shared/types';

type Route = 'scan' | 'verdict' | 'wardrobe' | 'outfits';

export default function App() {
  const [route, setRoute] = useState<Route>('scan');
  const [profile, setProfile] = useState<StyleProfile | null>(null);
  const [items, setItems] = useState<WardrobeItem[]>([]); // lifted: shared by wardrobe + outfits

  // Invisible anon session before anything hits an authed endpoint, then log open.
  useEffect(() => { ensureSession().then(() => track(EVENTS.APP_OPEN)); }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {route === 'scan' && (
        <ScanScreen onVerdict={(r) => { setProfile(r.profile); setRoute('verdict'); }} />
      )}
      {route === 'verdict' && profile && (
        <VerdictScreen profile={profile} onUnlockWardrobe={() => setRoute('wardrobe')} />
      )}
      {route === 'wardrobe' && (
        <WardrobeScreen items={items} onItemsChange={setItems} onSeeOutfits={() => setRoute('outfits')} />
      )}
      {route === 'outfits' && (
        <OutfitsScreen items={items} onBack={() => setRoute('wardrobe')} />
      )}
    </SafeAreaView>
  );
}
