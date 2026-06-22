// Invisible auth — anonymous session so "Scan me" works with zero setup
// (value before any signup wall). Session persists -> returning users keep
// their wardrobe. Account upgrade (email link) is a later, optional step.
//
// REQUIRES: Supabase project has Anonymous sign-ins enabled
// (Auth -> Providers -> Anonymous).
import { supabase } from './supabase';
import type { Session } from '@supabase/supabase-js';

export async function ensureSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session;
  const { data: anon, error } = await supabase.auth.signInAnonymously();
  if (error) { console.warn('anon sign-in failed', error.message); return null; }
  return anon.session;
}
