import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  MAX_AD_CREDITS_PER_DAY,
  clearCreditCache,
  consumeScanCredit,
  earnAdCredit,
  getCreditState,
  getRemainingScans,
} from '@/lib/credits';
import { clearDevTierCache, setDevTier } from '@/lib/subscriptions';

const KEY = 'mealdiary/scan-credits/v2';

function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

beforeEach(async () => {
  await AsyncStorage.clear();
  clearCreditCache();
  clearDevTierCache();
});

describe('credits', () => {
  it('starts fresh on a new day with a stale stored state', async () => {
    await AsyncStorage.setItem(KEY, JSON.stringify({ date: yesterday(), freeUsed: 2, adBalance: 1, adEarnedToday: 1 }));
    const state = await getCreditState();
    expect(state).toEqual({ date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/), freeUsed: 0, adBalance: 0, adEarnedToday: 0 });
    expect(await getRemainingScans()).toBe(3); // free tier: 3/day
  });

  it('consumes free quota up to the daily limit', async () => {
    expect(await consumeScanCredit()).toBe(true);
    expect(await consumeScanCredit()).toBe(true);
    expect(await consumeScanCredit()).toBe(true);
    expect(await consumeScanCredit()).toBe(false);
    expect(await getRemainingScans()).toBe(0);
  });

  it('spends banked ad credits before the free quota', async () => {
    await earnAdCredit();
    expect(await getRemainingScans()).toBe(4); // 3 free + 1 banked
    expect(await consumeScanCredit()).toBe(true);
    expect(await getRemainingScans()).toBe(3); // banked spent, quota intact
    expect(await consumeScanCredit()).toBe(true);
    expect(await getRemainingScans()).toBe(2);
  });

  it('caps ad credits earned per day', async () => {
    for (let i = 0; i < MAX_AD_CREDITS_PER_DAY; i++) {
      expect(await earnAdCredit()).toBe(true);
    }
    expect(await earnAdCredit()).toBe(false);
    expect((await getCreditState()).adBalance).toBe(MAX_AD_CREDITS_PER_DAY);
  });

  it('does not decrement quota when the ad cap blocks a credit', async () => {
    for (let i = 0; i < MAX_AD_CREDITS_PER_DAY; i++) await earnAdCredit();
    expect(await earnAdCredit()).toBe(false);
    expect(await consumeScanCredit()).toBe(true); // still has banked balance
  });

  it('gives unlimited scans on the pro tier', async () => {
    await setDevTier('pro');
    expect(await getRemainingScans()).toBeNull();
    expect(await consumeScanCredit()).toBe(true);
    expect(await consumeScanCredit()).toBe(true);
  });

  it('uses the intermediate tier limit of 15', async () => {
    await setDevTier('intermediate');
    let ok = true;
    for (let i = 0; i < 15; i++) ok = (await consumeScanCredit()) && ok;
    expect(ok).toBe(true);
    expect(await consumeScanCredit()).toBe(false);
  });

  it('repairs malformed stored state', async () => {
    await AsyncStorage.setItem(KEY, 'not json');
    expect(await getRemainingScans()).toBe(3);
    await AsyncStorage.setItem(KEY, JSON.stringify({ date: 'bad' }));
    expect(await getRemainingScans()).toBe(3);
  });
});