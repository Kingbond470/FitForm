// Fire-and-forget event tracking. Never blocks or breaks the UI — failures are
// swallowed. Sends user_id from the session so it satisfies the RLS check
// (user_id = auth.uid()); the DB default isn't relied on (it resolves null in
// default-context even though auth.uid() works inside RLS).
import { supabase } from '@/lib/supabase';
import type { EventName } from '@shared/analytics';

export function track(event: EventName, props: Record<string, unknown> = {}): void {
  // Not awaited — analytics must never be on the critical path.
  supabase.auth.getSession().then(({ data }) => {
    const user_id = data.session?.user?.id;
    if (!user_id) return;
    supabase.from('analytics_event').insert({ user_id, event, props }).then(() => {}, () => {});
  }, () => {});
}
