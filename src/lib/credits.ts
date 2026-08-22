import AsyncStorage from '@react-native-async-storage/async-storage';

import { TIER_INFO, getCurrentTier } from './subscriptions';

const KEY = 'mealdiary/scan-credits/v2';

// Max extra scans a user can earn from rewarded ads in one day.
export const MAX_AD_CREDITS_PER_DAY = 5;

interface CreditState {
  date: string; // YYYY-MM-DD (local)
  freeUsed: number; // scans used against the tier's daily limit
  adBalance: number; // extra scans banked from rewarded ads today
  adEarnedToday: number; // total ad-earned scans today (for the cap)
}

function todayKey(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function isNewDay(state: CreditState): boolean {
  return state.date !== todayKey();
}

function freshState(): CreditState {
  return { date: todayKey(), freeUsed: 0, adBalance: 0, adEarnedToday: 0 };
}

let stateCache: CreditState | null = null;

async function readState(): Promise<CreditState> {
  if (stateCache) {
    if (isNewDay(stateCache)) stateCache = freshState();
    return stateCache;
  }
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw !== null) {
      const s = JSON.parse(raw) as CreditState;
      if (typeof s.date === 'string' && isNewDay(s)) {
        stateCache = freshState();
      } else if (typeof s.freeUsed === 'number' && typeof s.adBalance === 'number' && typeof s.adEarnedToday === 'number') {
        stateCache = s;
      } else {
        stateCache = freshState();
      }
      return stateCache;
    }
  } catch {
    // fall through to a fresh state
  }
  stateCache = freshState();
  return stateCache;
}

async function writeState(s: CreditState): Promise<void> {
  stateCache = s;
  await AsyncStorage.setItem(KEY, JSON.stringify(s));
}

export function clearCreditCache(): void {
  stateCache = null;
}

export async function getCreditState(): Promise<CreditState> {
  return readState();
}

export async function getDailyLimit(): Promise<number> {
  return TIER_INFO[await getCurrentTier()].limit;
}

/**
 * Scans the user can still do today (free quota left + ad-earned balance).
 * Returns null when the user's plan is unlimited (Pro).
 */
export async function getRemainingScans(): Promise<number | null> {
  const [tier, state] = await Promise.all([getCurrentTier(), getCreditState()]);
  if (TIER_INFO[tier].limit === Infinity) return null;
  return Math.max(0, TIER_INFO[tier].limit - state.freeUsed) + state.adBalance;
}

export async function consumeScanCredit(): Promise<boolean> {
  const [tier, state] = await Promise.all([getCurrentTier(), getCreditState()]);
  const limit = TIER_INFO[tier].limit;
  if (limit === Infinity) return true;
  if (state.adBalance > 0) {
    state.adBalance -= 1;
    await writeState(state);
    return true;
  }
  if (state.freeUsed < limit) {
    state.freeUsed += 1;
    await writeState(state);
    return true;
  }
  return false;
}

/**
 * Banks one extra scan from a rewarded ad. Respects the per-day cap.
 * Returns true if the credit was granted, false if the cap is reached.
 */
export async function earnAdCredit(): Promise<boolean> {
  const state = await getCreditState();
  if (state.adEarnedToday >= MAX_AD_CREDITS_PER_DAY) return false;
  state.adBalance += 1;
  state.adEarnedToday += 1;
  await writeState(state);
  return true;
}