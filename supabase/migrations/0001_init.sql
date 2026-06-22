-- FitForm v1 schema. Extensible records (v2 closet / v3 social need no migration).
-- Raw scan images NOT stored here — transient bucket, auto-purge <24h.

create extension if not exists "pgcrypto";

-- ---- style_profile : permanent asset, derived from scan ----
create table style_profile (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  face_shape    text not null,
  body_type     text not null,
  proportions   jsonb not null,
  color_season  text not null,
  coloring      jsonb not null,
  rules         jsonb not null,            -- [{type,target,reason,category}], >=3
  headline      text not null,
  model_version text not null,
  created_at    timestamptz not null default now()
);
create index on style_profile (user_id, created_at desc);

-- ---- wardrobe_item : tagged garment, feeds ranker ----
create table wardrobe_item (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  image_url     text not null,             -- bg-removed cutout, permanent
  category      text not null,             -- top|bottom|outer|shoe|accessory
  subtype       text,
  color_primary text,
  color_hex     text,
  formality     int  not null default 3 check (formality between 1 and 5),
  pattern       text,
  tags_source   text not null default 'auto' check (tags_source in ('auto','user-edited')),
  created_at    timestamptz not null default now()
);
create index on wardrobe_item (user_id, category);

-- ---- outfit : generated combo, persisted for share/feedback ----
create table outfit (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  item_ids        uuid[] not null,
  occasion        text,                    -- null|casual|work|date (P1)
  score           numeric not null,
  profile_version text not null,
  created_at      timestamptz not null default now()
);
create index on outfit (user_id, created_at desc);

-- ---- RLS : user owns own rows ----
alter table style_profile enable row level security;
alter table wardrobe_item enable row level security;
alter table outfit         enable row level security;

create policy own_profile on style_profile
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy own_items on wardrobe_item
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy own_outfits on outfit
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
