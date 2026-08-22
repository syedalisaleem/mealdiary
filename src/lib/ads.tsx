import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import {
  AdEventType,
  BannerAd,
  BannerAdSize,
  MobileAds,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

export const ADS_ENABLED = Platform.OS === 'android' || Platform.OS === 'ios';

// Dev/debug builds use Google's test ads; release builds (EAS preview/production)
// use the real AdMob units so they don't pollute dashboard stats.
const USE_TEST_ADS = __DEV__;
const UNIT_IDS = {
  banner: USE_TEST_ADS ? TestIds.BANNER : 'ca-app-pub-7129470803481646/8576096180',
  rewarded: USE_TEST_ADS ? TestIds.REWARDED : 'ca-app-pub-7129470803481646/1954847515',
};

let initStarted = false;
function ensureAdsInitialized() {
  if (!ADS_ENABLED || initStarted) return;
  initStarted = true;
  MobileAds().initialize();
}

export function MealDiaryBanner() {
  useEffect(() => {
    ensureAdsInitialized();
  }, []);
  if (!ADS_ENABLED) return null;
  return (
    <View style={{ alignItems: 'center', marginVertical: 6 }}>
      <BannerAd unitId={UNIT_IDS.banner} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
    </View>
  );
}

/**
 * Shows a rewarded ad and resolves with true if the user earned the reward
 * (watched the ad to completion) and false otherwise (closed early, error,
 * or no fill). Never throws.
 */
export function showRewardedAd(): Promise<boolean> {
  if (!ADS_ENABLED) return Promise.resolve(false);
  ensureAdsInitialized();
  return new Promise((resolve) => {
    const ad = RewardedAd.createForAdRequest(UNIT_IDS.rewarded);
    let rewarded = false;
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      subs.forEach((u) => u());
      clearTimeout(guard);
      resolve(ok);
    };
    const subs = [
      ad.addAdEventListener(RewardedAdEventType.LOADED, () => ad.show()),
      ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        rewarded = true;
      }),
      ad.addAdEventListener(AdEventType.CLOSED, () => finish(rewarded)),
      ad.addAdEventListener(AdEventType.ERROR, () => finish(false)),
    ];
    ad.load();
    const guard = setTimeout(() => finish(false), 20000);
  });
}
