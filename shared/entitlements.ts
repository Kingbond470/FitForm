// Feature entitlement gate. v1 launches FREE — everything open — but the seam
// stays so monetization re-enables by flipping ONE flag (no rework, no rip-out).
//
// When FREE_LAUNCH flips to false, wire `canUse` to the real entitlement source
// (RevenueCat subscription status) and the paywall returns exactly where these
// checks already sit.

export const FREE_LAUNCH = true;

// Features that WOULD be paid once monetization turns on. Verdict + share are
// always free (the acquisition hook). Combos + saved profile are the payoff.
export type GatedFeature = 'outfits' | 'wardrobe' | 'saved_profile';

export interface Entitlement {
  isPaid: boolean; // real subscription status when FREE_LAUNCH=false
}

export function canUse(_feature: GatedFeature, ent?: Entitlement): boolean {
  if (FREE_LAUNCH) return true;
  return ent?.isPaid === true;
}
