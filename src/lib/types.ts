import type { IconName } from '@/components/ui';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export const MEAL_LABEL: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
};

export const MEAL_ICON: Record<MealType, IconName> = {
  breakfast: 'cafe-outline',
  lunch: 'restaurant-outline',
  dinner: 'moon-outline',
  snack: 'ice-cream-outline',
};

export interface Entry {
  id: string;
  dateKey: string;
  mealType: MealType;
  name: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: 'ai' | 'manual';
  photoUri?: string;
  createdAt: number;
}

export type Diary = Record<string, Entry[]>;

export type Sex = 'female' | 'male';

export type GoalMode = 'lose' | 'maintain' | 'gain';

export interface Profile {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: number;
  goal: GoalMode;
}

export interface Goals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type AiProvider = 'openai' | 'custom' | 'gemini';

export interface AIConfig {
  provider: AiProvider;
  baseUrl: string;
  model: string;
}

export interface FoodEstimate {
  name: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}
