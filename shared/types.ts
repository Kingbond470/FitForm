// Shared contract types — mirror docs/contracts/*. Used by client + Edge Functions.

// ---- /scan ----
export type FaceShape = 'oval' | 'round' | 'square' | 'oblong' | 'heart' | 'diamond' | 'triangle';
export type BodyType = 'ectomorph' | 'mesomorph' | 'endomorph' | 'mixed';
export type RuleType = 'wear' | 'avoid';
export type RuleCategory = 'fit' | 'color' | 'proportion' | 'pattern';

export interface StyleRule {
  type: RuleType;
  target: string;
  reason: string;
  category: RuleCategory;
}

export interface StyleProfile {
  face_shape: FaceShape;
  body_type: BodyType;
  proportions: {
    build: 'slim' | 'average' | 'broad' | 'athletic';
    torso_leg_ratio: 'balanced' | 'long_torso' | 'long_legs';
    shoulder_waist: 'balanced' | 'broad_shoulder' | 'narrow_shoulder';
  };
  color_season: string;
  coloring: {
    skin_undertone: 'warm' | 'cool' | 'neutral';
    contrast: 'low' | 'medium' | 'high';
  };
  rules: StyleRule[]; // >=3, >=1 wear, >=1 avoid
  headline: string;
}

export type ScanResponse =
  | { status: 'ok'; model_version: string; profile: StyleProfile }
  | { status: 'retake'; reason_code: RetakeReason; message: string }
  | { status: 'error'; retryable: boolean };

export type RetakeReason =
  | 'no_face' | 'no_full_body' | 'too_blurry' | 'too_dark' | 'multiple_people';

// ---- /garment ----
export type ItemCategory = 'top' | 'bottom' | 'outer' | 'shoe' | 'accessory';
export type Pattern = 'solid' | 'striped' | 'checked' | 'printed' | 'textured';

export interface WardrobeItem {
  id: string;
  image_url: string;
  category: ItemCategory;
  subtype: string;
  color_primary: string;
  color_hex: string;
  formality: 1 | 2 | 3 | 4 | 5;
  pattern: Pattern;
  tags_source: 'auto' | 'user-edited';
}

export type GarmentResponse =
  | { status: 'ok'; item: WardrobeItem }
  | { status: 'error'; reason_code: 'no_garment_detected' | 'multiple_garments' | 'not_clothing'; message: string };

// ---- /outfits ----
export type Occasion = 'casual' | 'work' | 'date';

export interface Outfit {
  id: string;
  item_ids: string[];
  occasion: Occasion | null;
  score: number;
  profile_version: string;
}

export type OutfitsResponse =
  | { status: 'ok'; outfits: Outfit[] }
  | { status: 'insufficient'; need: { min_items: number; min_categories: number }; have: { items: number; categories: number } };
