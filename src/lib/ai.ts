import { AIConfig, FoodEstimate } from './types';

export const PROVIDER_DEFAULTS: Record<
  AIConfig['provider'],
  { label: string; baseUrl: string; model: string; keyHint: string }
> = {
  openai: {
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    keyHint: 'sk-...',
  },
  custom: {
    label: 'Custom (OpenAI-compatible)',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    keyHint: 'your key',
  },
  gemini: {
    label: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com',
    model: 'gemini-2.5-flash',
    keyHint: 'AIza...',
  },
};

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
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) throw new Error('No JSON found in response');
  return JSON.parse(cleaned.slice(start, end + 1));
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

export async function analyzeFoodPhoto(
  base64: string,
  mime: string,
  cfg: AIConfig,
  apiKey: string
): Promise<FoodEstimate> {
  if (!apiKey.trim()) throw new Error('NO_KEY');

  const dataUrl = `data:${mime};base64,${base64}`;
  const userContent: { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } } = {
    type: 'image_url',
    image_url: { url: dataUrl },
  };

  let estimate: FoodEstimate;

  if (cfg.provider === 'gemini') {
    const base = PROVIDER_DEFAULTS.gemini.baseUrl.replace(/\/$/, '');
    const model = cfg.model.trim() || PROVIDER_DEFAULTS.gemini.model;
    const url = `${base}/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;
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
        generationConfig: { temperature: 0.2, maxOutputTokens: 300 },
      },
      {}
    );
    const j = JSON.parse(text) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const part = j.candidates?.[0]?.content?.parts?.find((p) => p.text);
    if (!part?.text) throw new Error('Empty response from Gemini');
    estimate = parseEstimate(part.text);
  } else {
    const base = (cfg.baseUrl || PROVIDER_DEFAULTS.openai.baseUrl).replace(/\/$/, '');
    const model = cfg.model.trim() || PROVIDER_DEFAULTS.openai.model;
    const text = await postJson(
      `${base}/chat/completions`,
      {
        model,
        temperature: 0.2,
        max_tokens: 300,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: [{ type: 'text', text: 'Estimate this meal.' }, userContent] },
        ],
      },
      { Authorization: `Bearer ${apiKey.trim()}` }
    );
    const j = JSON.parse(text) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = j.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty response from AI service');
    estimate = parseEstimate(content);
  }

  if (estimate.name.toLowerCase().includes('not food')) {
    throw new Error('NOT_FOOD');
  }
  return estimate;
}

export async function testAiConnection(cfg: AIConfig, apiKey: string): Promise<string> {
  const t0 = Date.now();
  await analyzeFoodPhoto(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'image/png',
    cfg,
    apiKey
  );
  return `Connected in ${Math.max(1, Math.round((Date.now() - t0) / 1000))}s (model: ${cfg.model.trim() || (cfg.provider === 'gemini' ? PROVIDER_DEFAULTS.gemini.model : PROVIDER_DEFAULTS.openai.model)})`;
}
