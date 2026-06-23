-- Funnel analytics. Own-backend (no third-party SDK) — queryable via service role.
-- Client inserts its own events; user_id defaults to the caller's auth uid.
-- (Paid/influencer attribution SDK is a separate, later concern — see R6.)

create table analytics_event (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  event      text not null,
  props      jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index on analytics_event (event, created_at desc);
create index on analytics_event (user_id, created_at);

alter table analytics_event enable row level security;

-- Insert-only for clients; user_id must be the caller. No select policy ->
-- clients can't read events back; analytics are queried with the service role.
create policy insert_own_events on analytics_event
  for insert with check (user_id = auth.uid());
