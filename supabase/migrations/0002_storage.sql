-- Storage for bg-removed garment cutouts. Public read (cutouts are non-sensitive
-- product images); writes go through the service-role Edge Function only.
-- Raw scan selfies/body photos are NEVER stored — no bucket for them by design.

insert into storage.buckets (id, name, public)
values ('wardrobe', 'wardrobe', true)
on conflict (id) do nothing;

-- Owner-scoped read via signed paths is fine too; bucket is public-read for
-- simple <img> rendering. Object paths are namespaced by user id: `${uid}/${uuid}.png`.
create policy "wardrobe read" on storage.objects
  for select using (bucket_id = 'wardrobe');
