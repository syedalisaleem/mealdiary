import { FOODS, searchFoods } from '@/lib/foods';

describe('searchFoods', () => {
  it('returns a curated default list for an empty query', () => {
    const r = searchFoods('');
    expect(r.length).toBe(12);
    expect(r[0]).toBe(FOODS[0]);
  });

  it('ranks prefix matches before substring matches', () => {
    const r = searchFoods('chicken');
    const names = r.map((f) => f.name);
    expect(names[0]).toBe('Chicken breast');
    expect(names).toContain('Chicken sandwich');
    // all results contain the query
    for (const n of names) expect(n.toLowerCase()).toContain('chicken');
  });

  it('is case-insensitive', () => {
    expect(searchFoods('PIZZA').map((f) => f.name)).toContain('Pizza (cheese)');
    expect(searchFoods('pizza').map((f) => f.name)).toEqual(searchFoods('PIZZA').map((f) => f.name));
  });

  it('respects the limit', () => {
    expect(searchFoods('e', 5).length).toBe(5);
  });

  it('returns empty for no matches', () => {
    expect(searchFoods('zzzznotafood')).toEqual([]);
  });

  it('trims whitespace from the query', () => {
    expect(searchFoods('  apple  ').map((f) => f.name)).toEqual(searchFoods('apple').map((f) => f.name));
  });
});
