import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { AIConfig, Diary, Entry, Goals, Profile } from './types';
import { computeTargets } from './nutrition';

const K = {
  diary: 'mealdiary/diary/v1',
  profile: 'mealdiary/profile/v1',
  goals: 'mealdiary/goals/v1',
  aiconfig: 'mealdiary/aiconfig/v1',
  aiKey: 'mealdiary/ai-key',
  aiKeyFallback: 'mealdiary/aikey-fallback/v1',
};

export const DEFAULT_PROFILE: Profile = {
  sex: 'female',
  age: 30,
  heightCm: 165,
  weightKg: 60,
  activity: 1.375,
  goal: 'maintain',
};

export const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'openai',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
};

let diaryCache: Diary | null = null;
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

// ---- diary ----

export async function getDiary(): Promise<Diary> {
  if (!loaded) {
    diaryCache = await readJson<Diary>(K.diary, {});
    loaded = true;
  }
  return diaryCache ?? {};
}

export async function addEntry(entry: Entry): Promise<void> {
  const d = await getDiary();
  (d[entry.dateKey] ??= []).push(entry);
  await writeJson(K.diary, d);
  emit();
}

export async function updateEntry(entry: Entry): Promise<void> {
  const d = await getDiary();
  const arr = d[entry.dateKey];
  if (arr) {
    const i = arr.findIndex((x) => x.id === entry.id);
    if (i >= 0) arr[i] = entry;
    await writeJson(K.diary, d);
    emit();
  }
}

export async function removeEntry(id: string, dateKey: string): Promise<void> {
  const d = await getDiary();
  const arr = d[dateKey];
  if (arr) {
    d[dateKey] = arr.filter((x) => x.id !== id);
    if (d[dateKey].length === 0) delete d[dateKey];
    await writeJson(K.diary, d);
    emit();
  }
}

export function newEntryId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---- profile & goals ----

export async function loadProfile(): Promise<Profile> {
  return readJson<Profile>(K.profile, DEFAULT_PROFILE);
}

export async function saveProfile(p: Profile): Promise<void> {
  await writeJson(K.profile, p);
  emit();
}

export async function loadGoals(): Promise<Goals | null> {
  return readJson<Goals | null>(K.goals, null);
}

export async function saveGoals(g: Goals | null): Promise<void> {
  await writeJson(K.goals, g);
  emit();
}

export async function effectiveGoals(profile: Profile, goals: Goals | null): Promise<Goals> {
  return goals ?? computeTargets(profile);
}

// ---- AI settings ----

export async function loadAIConfig(): Promise<AIConfig> {
  return readJson<AIConfig>(K.aiconfig, DEFAULT_AI_CONFIG);
}

export async function saveAIConfig(cfg: AIConfig): Promise<void> {
  await writeJson(K.aiconfig, cfg);
  emit();
}

export async function getApiKey(): Promise<string> {
  if (Platform.OS === 'web') {
    return (await readJson<string | null>(K.aiKeyFallback, null)) ?? '';
  }
  try {
    return (await SecureStore.getItemAsync(K.aiKey)) ?? '';
  } catch {
    return '';
  }
}

export async function setApiKey(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    await writeJson(K.aiKeyFallback, key || null);
  } else {
    try {
      if (key) await SecureStore.setItemAsync(K.aiKey, key);
      else await SecureStore.deleteItemAsync(K.aiKey);
    } catch {
      await writeJson(K.aiKeyFallback, key || null);
    }
  }
  emit();
}

export async function hasApiKey(): Promise<boolean> {
  return (await getApiKey()).trim().length > 0;
}

// ---- wipe ----

export async function wipeAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([K.diary, K.profile, K.goals, K.aiconfig, K.aiKeyFallback]);
  } catch {
    // ignore
  }
  try {
    if (Platform.OS !== 'web') await SecureStore.deleteItemAsync(K.aiKey);
  } catch {
    // ignore
  }
  diaryCache = null;
  loaded = false;
  emit();
}

// ---- app state hook ----

export interface AppData {
  diary: Diary;
  profile: Profile;
  goals: Goals | null;
  aiConfig: AIConfig;
  apiKey: string;
  ready: boolean;
}

export function useAppData(): AppData {
  const [data, setData] = useState<AppData>({
    diary: {},
    profile: DEFAULT_PROFILE,
    goals: null,
    aiConfig: DEFAULT_AI_CONFIG,
    apiKey: '',
    ready: false,
  });

  useEffect(() => {
    let alive = true;
    async function reload() {
      const [diary, profile, goals, aiConfig, apiKey] = await Promise.all([
        getDiary(),
        loadProfile(),
        loadGoals(),
        loadAIConfig(),
        getApiKey(),
      ]);
      if (alive) setData({ diary, profile, goals, aiConfig, apiKey, ready: true });
    }
    reload();
    const un = subscribe(reload);
    return () => {
      alive = false;
      un();
    };
  }, []);

  return data;
}
