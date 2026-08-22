import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import {
  DEFAULT_AI_CONFIG,
  DEFAULT_PROFILE,
  addEntry,
  getApiKey,
  getDiary,
  loadAIConfig,
  loadGoals,
  loadProfile,
  newEntryId,
  removeEntry,
  saveAIConfig,
  saveGoals,
  saveProfile,
  setApiKey,
  updateEntry,
  wipeAllData,
} from '@/lib/storage';
import { Entry, Profile } from '@/lib/types';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => {}),
  deleteItemAsync: jest.fn(async () => {}),
}));

jest.mock('expo-file-system', () => ({
  Directory: class {
    exists = false;
    create() {}
    delete() {}
  },
  Paths: { document: '/documents' },
}));

function entry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: 'e1',
    dateKey: '2026-08-17',
    mealType: 'lunch',
    name: 'Chicken bowl',
    serving: '1 bowl',
    calories: 500,
    protein: 30,
    carbs: 40,
    fat: 20,
    source: 'manual',
    createdAt: 123,
    ...overrides,
  };
}

beforeEach(async () => {
  await AsyncStorage.clear();
  await wipeAllData();
  jest.clearAllMocks();
});

describe('diary', () => {
  it('adds entries per day', async () => {
    await addEntry(entry());
    await addEntry(entry({ id: 'e2', mealType: 'dinner' }));
    const d = await getDiary();
    expect(d['2026-08-17']).toHaveLength(2);
  });

  it('updates an existing entry and moves it between days', async () => {
    await addEntry(entry());
    await updateEntry(entry({ dateKey: '2026-08-18' }));
    const d = await getDiary();
    expect(d['2026-08-18']).toHaveLength(1);
    expect(d['2026-08-18']![0]!.dateKey).toBe('2026-08-18');
    expect(d['2026-08-17']).toBeUndefined();
  });

  it('removes an entry and deletes the empty day', async () => {
    await addEntry(entry());
    await removeEntry('e1', '2026-08-17');
    const d = await getDiary();
    expect(d['2026-08-17']).toBeUndefined();
  });

  it('does nothing when removing a missing entry', async () => {
    await addEntry(entry());
    await removeEntry('nope', '2026-08-17');
    expect((await getDiary())['2026-08-17']).toHaveLength(1);
  });

  it('generates unique entry ids', () => {
    expect(newEntryId()).not.toBe(newEntryId());
  });
});

describe('profile & goals', () => {
  it('returns defaults when nothing is stored', async () => {
    expect(await loadProfile()).toEqual(DEFAULT_PROFILE);
    expect(await loadGoals()).toBeNull();
    expect(await loadAIConfig()).toEqual(DEFAULT_AI_CONFIG);
  });

  it('persists profile, goals and ai config', async () => {
    const p: Profile = { sex: 'male', age: 40, heightCm: 180, weightKg: 80, activity: 1.55, goal: 'lose' };
    await saveProfile(p);
    expect(await loadProfile()).toEqual(p);

    await saveGoals({ calories: 2000, protein: 150, carbs: 200, fat: 60 });
    expect(await loadGoals()).toEqual({ calories: 2000, protein: 150, carbs: 200, fat: 60 });
    await saveGoals(null);
    expect(await loadGoals()).toBeNull();

    await saveAIConfig({ provider: 'gemini', baseUrl: 'x', model: 'y' });
    expect(await loadAIConfig()).toEqual({ provider: 'gemini', baseUrl: 'x', model: 'y' });
  });

  it('recovers from corrupt stored JSON', async () => {
    await AsyncStorage.setItem('mealdiary/profile/v1', '{{{');
    expect(await loadProfile()).toEqual(DEFAULT_PROFILE);
  });
});

describe('api key', () => {
  it('returns empty when no key is set', async () => {
    expect(await getApiKey()).toBe('');
    await expect(setApiKey('')).resolves.toBeUndefined();
  });

  it('stores the key in SecureStore and returns it', async () => {
    await setApiKey('sk-test-123');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('mealdiary/ai-key', 'sk-test-123');
    expect(await getApiKey()).toBe('sk-test-123');
  });

  it('falls back to storage when SecureStore fails', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    await setApiKey('fallback-key');
    expect(await getApiKey()).toBe('fallback-key');
  });
});

describe('wipeAllData', () => {
  it('clears storage and resets all caches', async () => {
    await addEntry(entry());
    await saveProfile({ sex: 'male', age: 40, heightCm: 180, weightKg: 80, activity: 1.55, goal: 'lose' });
    await setApiKey('secret');
    await wipeAllData();
    expect(await getDiary()).toEqual({});
    expect(await loadProfile()).toEqual(DEFAULT_PROFILE);
    expect(await getApiKey()).toBe('');
  });
});