import { FoodEstimate } from './types';

// The key lives on the Cloudflare worker (secret GEMINI_API_KEY) — never ship it in the app.
// Local dev fallback: uncomment GEMINI_API_KEY and empty GEMINI_PROXY_URL to call Gemini directly.
export const GEMINI_API_KEY = '';
export const GEMINI_PROXY_URL = 'https://mealdiary-proxy.12next-gaming12.workers.dev';
export const GEMINI_MODEL = 'gemini-3.5-flash';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com';

const SYSTEM_PROMPT = `You are a nutritionist analyzing a photo of a meal. Estimate the calories and macronutrients for the photographed portion as served.
Reply with ONLY a JSON object, no markdown, no extra text, using exactly this schema:
{"name": string, "serving": string, "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number}
Rules:
- "name" is a short dish/food description, e.g. "Chicken rice bowl".
- "serving" is a plain-language portion, e.g. "1 bowl, about 400 g".
- Estimate nutrients for the whole portion in the photo. Protein, carbs and fat are in grams.
- If there are multiple foods, combine them into one meal estimate.
- If the image is NOT food (or you cannot tell), set "name" to "Not food" and all numbers to 0.
- Numbers must be realistic; if unsure, estimate from similar common dishes.`;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

function extractJson(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/gi, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // not clean JSON — fall back to scanning for a balanced object
  }
  const stack: number[] = [];
  let lastValid: unknown = undefined;
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (ch === '{') {
      stack.push(i);
    } else if (ch === '}' && stack.length > 0) {
      const start = stack.pop()!;
      if (stack.length === 0) {
        try {
          lastValid = JSON.parse(cleaned.slice(start, i + 1));
        } catch {
          // keep scanning for a balanced object that does parse
        }
      }
    }
  }
  if (lastValid === undefined) throw new Error('No JSON found in response');
  return lastValid;
}

function toNumber(v: unknown, fallback = 0): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
  return Number.isFinite(n) ? n : fallback;
}

function parseEstimate(text: string): FoodEstimate {
  const raw = extractJson(text) as Record<string, unknown>;
  const name = String(raw.name ?? '').trim();
  const calories = Math.round(clamp(toNumber(raw.calories), 0, 3000));
  const protein = Math.round(clamp(toNumber(raw.protein_g), 0, 300));
  const carbs = Math.round(clamp(toNumber(raw.carbs_g), 0, 400));
  const fat = Math.round(clamp(toNumber(raw.fat_g), 0, 200));
  return {
    name: name || 'Unknown meal',
    serving: String(raw.serving ?? '').trim() || '1 portion',
    calories,
    protein,
    carbs,
    fat,
  };
}

async function postJson(url: string, body: unknown, headers: Record<string, string>, timeoutMs = 90000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();
    if (!res.ok) {
      const detail = (() => {
        try {
          const j = JSON.parse(text) as { error?: { message?: string } };
          return j.error?.message ?? text;
        } catch {
          return text.slice(0, 300);
        }
      })();
      throw new Error(`Request failed (${res.status}): ${detail}`);
    }
    return text;
  } finally {
    clearTimeout(timer);
  }
}

export async function analyzeFoodPhoto(base64: string, mime: string): Promise<FoodEstimate> {
  const useProxy = GEMINI_PROXY_URL.length > 0;
  const url = useProxy
    ? `${GEMINI_PROXY_URL}`
    : `${GEMINI_BASE}/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
  const text = await postJson(
    url,
    {
      contents: [
        {
          parts: [
            { text: SYSTEM_PROMPT },
            { inline_data: { mime_type: mime, data: base64 } },
          ],
        },
      ],
      generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
    },
    {}
  );
  const j = JSON.parse(text) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const parts = (j.candidates?.[0]?.content?.parts ?? []).map((p) => p.text?.trim() ?? '').filter(Boolean);
  const joined = parts.join('\n');
  if (!joined) throw new Error('Empty response from Gemini');
  const estimate = parseEstimate(joined);
  if (estimate.name.toLowerCase().includes('not food')) {
    throw new Error('NOT_FOOD');
  }
  return estimate;
}