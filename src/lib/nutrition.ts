import { Entry, Goals, MealType, MEAL_ORDER, MEAL_LABEL, Profile } from './types';

export const ACTIVITIES: { label: string; value: number }[] = [
  { label: 'Sedentary', value: 1.2 },
  { label: 'Light', value: 1.375 },
  { label: 'Moderate', value: 1.55 },
  { label: 'Active', value: 1.725 },
  { label: 'Very active', value: 1.9 },
];

export const GOALS_OPTIONS: { label: string; value: Profile['goal'] }[] = [
  { label: 'Lose', value: 'lose' },
  { label: 'Maintain', value: 'maintain' },
  { label: 'Gain', value: 'gain' },
];

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function computeTargets(p: Profile): Goals {
  const bmr =
    p.sex === 'male'
      ? 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + 5
      : 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age - 161;
  let tdee = bmr * p.activity;
  if (p.goal === 'lose') tdee *= 0.85;
  else if (p.goal === 'gain') tdee *= 1.12;
  const calories = Math.round(clamp(tdee, 1200, 4500));
  return {
    calories,
    protein: Math.round((calories * 0.25) / 4),
    carbs: Math.round((calories * 0.45) / 4),
    fat: Math.round((calories * 0.3) / 9),
  };
}

export interface Totals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  count: number;
}

export function sumEntries(entries: Entry[]): Totals {
  const t: Totals = { calories: 0, protein: 0, carbs: 0, fat: 0, count: entries.length };
  for (const e of entries) {
    t.calories += e.calories || 0;
    t.protein += e.protein || 0;
    t.carbs += e.carbs || 0;
    t.fat += e.fat || 0;
  }
  t.calories = Math.round(t.calories);
  t.protein = Math.round(t.protein);
  t.carbs = Math.round(t.carbs);
  t.fat = Math.round(t.fat);
  return t;
}

export function groupByMeal(entries: Entry[]): Record<MealType, Entry[]> {
  const g: Record<MealType, Entry[]> = { breakfast: [], lunch: [], dinner: [], snack: [] };
  for (const e of entries) {
    (g[e.mealType] ?? (g[e.mealType] = [])).push(e);
  }
  return g;
}

export function sortedMealSections(entries: Entry[]) {
  const g = groupByMeal(entries);
  return MEAL_ORDER.filter((m) => (g[m] ?? []).length > 0).map((m) => ({
    meal: m,
    label: MEAL_LABEL[m],
    entries: g[m] ?? [],
  }));
}
