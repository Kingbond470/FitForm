// Typed client for the 3 Edge Functions. All vision/ranking server-side.
import { supabase } from '@/lib/supabase';
import type { ScanResponse, GarmentResponse, OutfitsResponse, Occasion } from '@shared/types';

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
