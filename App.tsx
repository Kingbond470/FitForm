// v1 flow: Scan (hero) -> Verdict (share + teaser) -> Paywall -> Wardrobe -> Outfits.
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native';
import ScanScreen from '@/screens/ScanScreen';
import VerdictScreen from '@/screens/VerdictScreen';
import type { StyleProfile } from '@shared/types';

type Route = 'scan' | 'verdict' | 'paywall';

export default function App() {
  const [route, setRoute] = useState<Route>('scan');
  const [profile, setProfile] = useState<StyleProfile | null>(null);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {route === 'scan' && (
        <ScanScreen onVerdict={(r) => { setProfile(r.profile); setRoute('verdict'); }} />
      )}
      {route === 'verdict' && profile && (
        <VerdictScreen profile={profile} onUnlockWardrobe={() => setRoute('paywall')} />
      )}
      {/* TODO: PaywallScreen (RevenueCat) -> WardrobeScreen -> OutfitsScreen */}
    </SafeAreaView>
  );
}
