import { computeTargets, groupByMeal, sortedMealSections, sumEntries } from '@/lib/nutrition';
import { Entry, Profile } from '@/lib/types';

const profile: Profile = { sex: 'female', age: 30, heightCm: 165, weightKg: 60, activity: 1.375, goal: 'maintain' };

function entry(overrides: Partial<Entry>): Entry {
  return {
    id: '1',
    dateKey: '2026-08-17',
    mealType: 'lunch',
    name: 'Test',
    serving: '1 bowl',
    calories: 100,
    protein: 10,
    carbs: 10,
    fat: 5,
    source: 'manual',
    createdAt: 1,
    ...overrides,
  };
}

describe('computeTargets', () => {
  it('computes maintenance targets for a female profile', () => {
    const t = computeTargets(profile);
    // Mifflin-St Jeor: 10*60 + 6.25*165 - 5*30 - 161 = 1320.25; *1.375 = 1815
    expect(t.calories).toBe(1815);
    expect(t.protein).toBe(Math.round((1815 * 0.25) / 4));
    expect(t.carbs).toBe(Math.round((1815 * 0.45) / 4));
    expect(t.fat).toBe(Math.round((1815 * 0.3) / 9));
    // macros roughly reconcile to calories
    expect(Math.abs(t.protein * 4 + t.carbs * 4 + t.fat * 9 - t.calories)).toBeLessThan(60);
  });

  it('uses male formula and goal multipliers', () => {
    const male = computeTargets({ ...profile, sex: 'male', goal: 'lose' });
    const maleBase = computeTargets({ ...profile, sex: 'male' });
    const femaleGain = computeTargets({ ...profile, goal: 'gain' });
    expect(male.calories).toBeLessThan(maleBase.calories); // lose < maintain
    expect(femaleGain.calories).toBeGreaterThan(computeTargets(profile).calories); // gain > maintain
    expect(maleBase.calories).toBeGreaterThan(computeTargets(profile).calories); // male > female (same activity)
  });

  it('clamps calories to sane bounds', () => {
    const tiny = computeTargets({ ...profile, weightKg: 30, age: 80, activity: 1.2 });
    const huge = computeTargets({ ...profile, sex: 'male', weightKg: 150, heightCm: 200, activity: 1.9, goal: 'gain' });
    expect(tiny.calories).toBeGreaterThanOrEqual(1200);
    expect(huge.calories).toBeLessThanOrEqual(4500);
  });
});

describe('sumEntries', () => {
  it('sums and rounds all macros', () => {
    const t = sumEntries([entry({ calories: 100.4, protein: 10.4 }), entry({ calories: 50.6, protein: 2.6 }), entry({})]);
    expect(t).toEqual({ calories: 251, protein: 23, carbs: 30, fat: 15, count: 3 });
  });

  it('handles empty input', () => {
    expect(sumEntries([])).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 });
  });
});

describe('groupByMeal / sortedMealSections', () => {
  it('groups entries by meal type', () => {
    const g = groupByMeal([entry({ mealType: 'breakfast' }), entry({ mealType: 'dinner' }), entry({ mealType: 'dinner' })]);
    expect(g.breakfast).toHaveLength(1);
    expect(g.dinner).toHaveLength(2);
    expect(g.lunch).toHaveLength(0);
    expect(g.snack).toHaveLength(0);
  });

  it('returns sections in canonical order, skipping empty meals', () => {
    const sections = sortedMealSections([entry({ mealType: 'snack' }), entry({ mealType: 'breakfast' })]);
    expect(sections.map((s) => s.meal)).toEqual(['breakfast', 'snack']);
  });

  it('returns no sections for empty input', () => {
    expect(sortedMealSections([])).toEqual([]);
  });
});
