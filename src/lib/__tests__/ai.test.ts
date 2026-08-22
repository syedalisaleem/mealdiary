import { analyzeFoodPhoto } from '@/lib/ai';

function mockFetchResponse(body: unknown, ok = true, status = 200) {
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  (global as { fetch: unknown }).fetch = jest.fn(async () => ({
    ok,
    status,
    text: async () => text,
  })) as unknown;
}

function geminiResponse(partsText: string) {
  return {
    candidates: [{ content: { parts: [{ text: partsText }] } }],
  };
}

describe('analyzeFoodPhoto', () => {
  afterEach(() => jest.restoreAllMocks());

  it('parses a clean JSON estimate', async () => {
    mockFetchResponse(
      geminiResponse(JSON.stringify({ name: 'Chicken rice bowl', serving: '1 bowl, 400 g', calories: 650, protein_g: 40, carbs_g: 70, fat_g: 20 }))
    );
    const est = await analyzeFoodPhoto('abc123', 'image/jpeg');
    expect(est).toEqual({ name: 'Chicken rice bowl', serving: '1 bowl, 400 g', calories: 650, protein: 40, carbs: 70, fat: 20 });
  });

  it('parses markdown-fenced JSON', async () => {
    mockFetchResponse(geminiResponse('```json\n{"name":"Salad","serving":"1 bowl","calories":320,"protein_g":8,"carbs_g":20,"fat_g":24}\n```'));
    const est = await analyzeFoodPhoto('x', 'image/jpeg');
    expect(est.calories).toBe(320);
    expect(est.name).toBe('Salad');
  });

  it('extracts JSON embedded in prose', async () => {
    mockFetchResponse(
      geminiResponse(
        'Here is your estimate: {"name":"Oatmeal","serving":"1 cup","calories":154,"protein_g":6,"carbs_g":27,"fat_g":3} enjoy!'
      )
    );
    const est = await analyzeFoodPhoto('x', 'image/jpeg');
    expect(est.name).toBe('Oatmeal');
    expect(est.calories).toBe(154);
  });

  it('clamps implausible values and fills missing fields', async () => {
    mockFetchResponse(
      geminiResponse(JSON.stringify({ name: 'X', calories: 999999, protein_g: -5, carbs_g: 'not a number', fat_g: 1.4 }))
    );
    const est = await analyzeFoodPhoto('x', 'image/jpeg');
    expect(est.calories).toBe(3000);
    expect(est.protein).toBe(0);
    expect(est.carbs).toBe(0);
    expect(est.fat).toBe(1);
    expect(est.serving).toBe('1 portion');
  });

  it('falls back to a default name for unnamed results', async () => {
    mockFetchResponse(geminiResponse(JSON.stringify({ calories: 100 })));
    const est = await analyzeFoodPhoto('x', 'image/jpeg');
    expect(est.name).toBe('Unknown meal');
  });

  it('rejects with NOT_FOOD when the AI says the image is not food', async () => {
    mockFetchResponse(geminiResponse(JSON.stringify({ name: 'Not food', calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 })));
    await expect(analyzeFoodPhoto('x', 'image/jpeg')).rejects.toThrow('NOT_FOOD');
  });

  it('throws on an empty response', async () => {
    mockFetchResponse(geminiResponse(''));
    await expect(analyzeFoodPhoto('x', 'image/jpeg')).rejects.toThrow('Empty response from Gemini');
  });

  it('throws a descriptive error on HTTP failure', async () => {
    mockFetchResponse({ error: { message: 'quota exceeded' } }, false, 429);
    await expect(analyzeFoodPhoto('x', 'image/jpeg')).rejects.toThrow(/429/);
    await expect(analyzeFoodPhoto('x', 'image/jpeg')).rejects.toThrow(/quota exceeded/);
  });

  it('throws when no JSON object can be found', async () => {
    mockFetchResponse(geminiResponse('I cannot analyze this image.'));
    await expect(analyzeFoodPhoto('x', 'image/jpeg')).rejects.toThrow('No JSON found in response');
  });
});