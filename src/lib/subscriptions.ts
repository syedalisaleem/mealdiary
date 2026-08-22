import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  PurchasesPackage,
} from 'react-native-purchases';

export type Tier = 'free' | 'intermediate' | 'pro';

export interface TierInfo {
  tier: Tier;
  label: string;
  limit: number; // scans per day; Infinity = unlimited
  blurb: string;
}

export const TIER_INFO: Record<Tier, TierInfo> = {
  free: { tier: 'free', label: 'Free', limit: 3, blurb: '3 AI scans per day' },
  intermediate: { tier: 'intermediate', label: 'Intermediate', limit: 15, blurb: '15 AI scans per day' },
  pro: { tier: 'pro', label: 'Pro', limit: Infinity, blurb: 'Unlimited AI scans' },
};

// RevenueCat public SDK key for Android (Google). Get it from app.revenuecat.com.
// Leave empty to run in dev mode: the active tier is controlled locally via
// setDevTier, so the whole app is testable before RevenueCat + Play Billing are live.
export const RC_ANDROID_API_KEY = '';

// Product IDs as they must exist in Google Play Console and RevenueCat dashboard.
export const PRODUCT_IDS = {
  intermediate: 'mealdiary_intermediate_monthly',
  pro: 'mealdiary_pro_monthly',
};

const DEV_TIER_KEY = 'mealdiary/dev-tier/v1';
export const DEV_TIER_ENABLED = RC_ANDROID_API_KEY === '';

let configured = false;
let cachedInfo: import('react-native-purchases').CustomerInfo | null = null;

function tierFromInfo(info: import('react-native-purchases').CustomerInfo | null): Tier {
  if (!info) return 'free';
  const active = info.entitlements.active;
  if (active.pro) return 'pro';
  if (active.intermediate) return 'intermediate';
  return 'free';
}

/**
 * Call once at app startup (root layout). No-op in dev mode and on web.
 */
export async function initSubscriptions(): Promise<void> {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return;
  if (configured || DEV_TIER_ENABLED) return;
  configured = true;
  try {
    Purchases.setLogLevel(LOG_LEVEL.WARN);
    await Purchases.configure({ apiKey: RC_ANDROID_API_KEY });
    cachedInfo = await Purchases.getCustomerInfo();
  } catch {
    // Billing unavailable (e.g. no Play Store on device): stay on free tier.
  }
}

let devTierCache: Tier | null = null;

export async function getCurrentTier(): Promise<Tier> {
  if (!DEV_TIER_ENABLED) {
    try {
      if (!cachedInfo) cachedInfo = await Purchases.getCustomerInfo();
      return tierFromInfo(cachedInfo);
    } catch {
      return 'free';
    }
  }
  if (devTierCache) return devTierCache;
  const raw = await AsyncStorage.getItem(DEV_TIER_KEY);
  devTierCache = raw === 'intermediate' || raw === 'pro' ? raw : 'free';
  return devTierCache;
}

export async function setDevTier(tier: Tier): Promise<void> {
  devTierCache = tier;
  await AsyncStorage.setItem(DEV_TIER_KEY, tier);
}

export function clearDevTierCache(): void {
  devTierCache = null;
}

export async function getTierInfo(): Promise<TierInfo> {
  return TIER_INFO[await getCurrentTier()];
}

export async function getUpgradePackages(): Promise<PurchasesPackage[]> {
  if (DEV_TIER_ENABLED) return [];
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current?.availablePackages ?? [];
  } catch {
    return [];
  }
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<Tier> {
  const result = await Purchases.purchasePackage(pkg);
  cachedInfo = result.customerInfo;
  return tierFromInfo(result.customerInfo);
}

export async function restorePurchases(): Promise<Tier> {
  if (DEV_TIER_ENABLED) return 'free';
  try {
    const info = await Purchases.restorePurchases();
    cachedInfo = info;
    return tierFromInfo(info);
  } catch {
    return 'free';
  }
}

export async function refreshSubscriptionState(): Promise<void> {
  if (DEV_TIER_ENABLED) return;
  try {
    cachedInfo = await Purchases.getCustomerInfo();
  } catch {
    // ignore
  }
}