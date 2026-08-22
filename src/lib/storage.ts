import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Directory, Paths } from 'expo-file-system';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { AIConfig, Diary, Entry, Goals, Profile } from './types';
import { computeTargets } from './nutrition';
import { clearCreditCache } from './credits';
import { clearDevTierCache } from './subscriptions';

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
let profileCache: Profile | null = null;
let goalsCache: Goals | null | undefined = undefined;
let aiConfigCache: AIConfig | null = null;
let apiKeyCache: string | null = null;
let apiKeyLoaded = false;

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
  const i = arr ? arr.findIndex((x) => x.id === entry.id) : -1;
  if (i >= 0) {
    arr[i] = entry;
  } else {
    (d[entry.dateKey] ??= []).push(entry);
    for (const k of Object.keys(d)) {
      if (k === entry.dateKey) continue;
      const other = d[k];
      if (!other) continue;
      const j = other.findIndex((x) => x.id === entry.id);
      if (j >= 0) {
        other.splice(j, 1);
        if (other.length === 0) delete d[k];
      }
    }
  }
  await writeJson(K.diary, d);
  emit();
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
  if (profileCache) return profileCache;
  profileCache = await readJson<Profile>(K.profile, DEFAULT_PROFILE);
  return profileCache;
}

export async function saveProfile(p: Profile): Promise<void> {
  profileCache = p;
  await writeJson(K.profile, p);
  emit();
}

export async function loadGoals(): Promise<Goals | null> {
  if (goalsCache !== undefined) return goalsCache;
  goalsCache = await readJson<Goals | null>(K.goals, null);
  return goalsCache;
}

export async function saveGoals(g: Goals | null): Promise<void> {
  goalsCache = g;
  await writeJson(K.goals, g);
  emit();
}

export async function effectiveGoals(profile: Profile, goals: Goals | null): Promise<Goals> {
  return goals ?? computeTargets(profile);
}

// ---- AI settings ----

export async function loadAIConfig(): Promise<AIConfig> {
  if (aiConfigCache) return aiConfigCache;
  aiConfigCache = await readJson<AIConfig>(K.aiconfig, DEFAULT_AI_CONFIG);
  return aiConfigCache;
}

export async function saveAIConfig(cfg: AIConfig): Promise<void> {
  aiConfigCache = cfg;
  await writeJson(K.aiconfig, cfg);
  emit();
}

export async function getApiKey(): Promise<string> {
  if (apiKeyLoaded) return apiKeyCache ?? '';
  apiKeyLoaded = true;
  if (Platform.OS === 'web') {
    apiKeyCache = (await readJson<string | null>(K.aiKeyFallback, null)) ?? '';
    return apiKeyCache;
  }
  try {
    const v = await SecureStore.getItemAsync(K.aiKey);
    if (v) {
      apiKeyCache = v;
      return v;
    }
  } catch {
    // ignore
  }
  apiKeyCache = (await readJson<string | null>(K.aiKeyFallback, null)) ?? '';
  return apiKeyCache;
}

export async function setApiKey(key: string): Promise<void> {
  apiKeyCache = key;
  apiKeyLoaded = true;
  if (Platform.OS === 'web') {
    await writeJson(K.aiKeyFallback, key || null);
  } else {
    try {
      if (key) {
        await SecureStore.setItemAsync(K.aiKey, key);
        await AsyncStorage.removeItem(K.aiKeyFallback);
      } else {
        await SecureStore.deleteItemAsync(K.aiKey);
        await AsyncStorage.removeItem(K.aiKeyFallback);
      }
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
    await AsyncStorage.multiRemove([
      K.diary,
      K.profile,
      K.goals,
      K.aiconfig,
      K.aiKeyFallback,
      'mealdiary/scan-credits/v2',
      'mealdiary/dev-tier/v1',
    ]);
  } catch {
    // ignore
  }
  try {
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync(K.aiKey);
      const dir = new Directory(Paths.document, 'mealphotos');
      if (dir.exists) dir.delete();
    }
  } catch {
    // ignore
  }
  diaryCache = null;
  loaded = false;
  profileCache = null;
  goalsCache = undefined;
  aiConfigCache = null;
  apiKeyCache = null;
  apiKeyLoaded = false;
  clearCreditCache();
  clearDevTierCache();
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
    let inflight = false;
    let queued = false;

    async function reload() {
      if (!alive) return;
      if (inflight) {
        queued = true;
        return;
      }
      inflight = true;
      try {
        do {
          queued = false;
          const [diary, profile, goals, aiConfig, apiKey] = await Promise.all([
            getDiary(),
            loadProfile(),
            loadGoals(),
            loadAIConfig(),
            getApiKey(),
          ]);
          if (alive) setData({ diary, profile, goals, aiConfig, apiKey, ready: true });
        } while (queued && alive);
      } finally {
        inflight = false;
      }
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
