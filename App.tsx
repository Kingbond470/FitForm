// v1 flow: Scan (hero) -> Verdict (share + teaser) -> Paywall -> Wardrobe -> Outfits.
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native';
import ScanScreen from '@/screens/ScanScreen';
import VerdictScreen from '@/screens/VerdictScreen';
import type { StyleProfile } from '@shared/types';

// v1 launches FREE — no paywall in the flow. Verdict -> Wardrobe -> Outfits,
// all open. Monetization re-enables via shared/entitlements.ts (FREE_LAUNCH).
type Route = 'scan' | 'verdict' | 'wardrobe';

export default function App() {
  const [route, setRoute] = useState<Route>('scan');
  const [profile, setProfile] = useState<StyleProfile | null>(null);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {route === 'scan' && (
        <ScanScreen onVerdict={(r) => { setProfile(r.profile); setRoute('verdict'); }} />
      )}
      {route === 'verdict' && profile && (
        <VerdictScreen profile={profile} onUnlockWardrobe={() => setRoute('wardrobe')} />
      )}
      {/* TODO: WardrobeScreen (add items) -> OutfitsScreen (combos). No paywall. */}
    </SafeAreaView>
  );
}
