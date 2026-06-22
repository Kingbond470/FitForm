// Provider-agnostic multimodal JSON call. Default = Google Gemini (free tier,
// no billing). OpenAI retained behind VISION_PROVIDER flag for later swap.
// Returns the parsed JSON object (provider-agnostic) or null on any failure;
// our pure validators (interpret / interpretTags) handle shape enforcement.

export type VisionPart =
  | { text: string }
  | { image: { mime: string; base64: string } };

// A neutral schema shape (OpenAPI subset) understood by Gemini directly and
// adaptable to OpenAI json_schema. Keep schemas in this dialect.
export interface VisionSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  items?: any;
  enum?: any[];
  nullable?: boolean;
}

const PROVIDER = () => Deno.env.get('VISION_PROVIDER') ?? 'gemini';

export async function visionJSON(system: string, parts: VisionPart[], schema: VisionSchema): Promise<any | null> {
  return PROVIDER() === 'openai' ? openaiJSON(system, parts, schema) : geminiJSON(system, parts, schema);
}

// --- Gemini (free tier) ---
async function geminiJSON(system: string, parts: VisionPart[], schema: VisionSchema): Promise<any | null> {
  const key = Deno.env.get('GEMINI_API_KEY');
  const model = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const geminiParts = parts.map((p) =>
    'text' in p ? { text: p.text } : { inline_data: { mime_type: p.image.mime, data: p.image.base64 } },
  );

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: geminiParts }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json', responseSchema: toGemini(schema) },
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== 'string') return null;
  try { return JSON.parse(text); } catch { return null; }
}

// --- OpenAI (retained; needs billing) ---
async function openaiJSON(system: string, parts: VisionPart[], schema: VisionSchema): Promise<any | null> {
  const key = Deno.env.get('OPENAI_API_KEY');
  const model = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o';
  const content = parts.map((p) =>
    'text' in p ? { type: 'text', text: p.text } : { type: 'image_url', image_url: { url: `data:${p.image.mime};base64,${p.image.base64}` } },
  );
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: 'json_schema', json_schema: { name: 'out', strict: true, schema: toStrict(schema) } },
      messages: [{ role: 'system', content: system }, { role: 'user', content }],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== 'string') return null;
  try { return JSON.parse(text); } catch { return null; }
}

// Gemini responseSchema uses OpenAPI uppercase type names + `nullable`.
const GEMINI_TYPE: Record<string, string> = {
  object: 'OBJECT', array: 'ARRAY', string: 'STRING', boolean: 'BOOLEAN', integer: 'INTEGER', number: 'NUMBER',
};
function toGemini(s: any): any {
  const out: any = { type: GEMINI_TYPE[s.type] ?? 'STRING' };
  if (s.nullable) out.nullable = true;
  if (s.enum) out.enum = s.enum;
  if (s.required) out.required = s.required;
  if (s.properties) out.properties = Object.fromEntries(Object.entries(s.properties).map(([k, v]) => [k, toGemini(v)]));
  if (s.items) out.items = toGemini(s.items);
  return out;
}

// OpenAI strict mode wants additionalProperties:false on every object node.
function toStrict(s: any): any {
  if (s && s.type === 'object' && s.properties) {
    return { ...s, additionalProperties: false, properties: Object.fromEntries(Object.entries(s.properties).map(([k, v]) => [k, toStrict(v)])) };
  }
  if (s && s.type === 'array' && s.items) return { ...s, items: toStrict(s.items) };
  return s;
}
