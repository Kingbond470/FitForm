// Typed client for the 3 Edge Functions. All vision/ranking server-side.
import { supabase } from '@/lib/supabase';
import type { ScanResponse, GarmentResponse, OutfitsResponse, Occasion, WardrobeItem } from '@shared/types';

const FN = process.env.EXPO_PUBLIC_SUPABASE_URL! + '/functions/v1';

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
}

export async function scan(faceUri: string, bodyUri: string): Promise<ScanResponse> {
  const form = new FormData();
  form.append('face_image', { uri: faceUri, name: 'face.jpg', type: 'image/jpeg' } as any);
  form.append('body_image', { uri: bodyUri, name: 'body.jpg', type: 'image/jpeg' } as any);
  const res = await fetch(`${FN}/scan`, { method: 'POST', headers: await authHeader(), body: form });
  return res.json();
}

export async function addGarment(uri: string): Promise<GarmentResponse> {
  const form = new FormData();
  form.append('garment_image', { uri, name: 'item.jpg', type: 'image/jpeg' } as any);
  const res = await fetch(`${FN}/garment`, { method: 'POST', headers: await authHeader(), body: form });
  return res.json();
}

export async function getOutfits(occasion?: Occasion): Promise<OutfitsResponse> {
  const res = await fetch(`${FN}/outfits`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify({ occasion }),
  });
  return res.json();
}

// Existing wardrobe (returning user). RLS scopes rows to the signed-in user.
export async function listWardrobe(): Promise<WardrobeItem[]> {
  const { data, error } = await supabase
    .from('wardrobe_item')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data ?? []) as WardrobeItem[];
}

// ≤1-tap tag correction. Marks the row user-edited so re-tagging won't overwrite.
export async function updateGarmentTag(
  id: string,
  patch: Partial<Pick<WardrobeItem, 'category' | 'subtype' | 'color_primary' | 'formality' | 'pattern'>>,
): Promise<boolean> {
  const { error } = await supabase
    .from('wardrobe_item')
    .update({ ...patch, tags_source: 'user-edited' })
    .eq('id', id);
  return !error;
}
