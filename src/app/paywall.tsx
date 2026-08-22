import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { PurchasesPackage } from 'react-native-purchases';

import { Btn, Card, HeaderBar, Icon, Screen, Seg } from '@/components/ui';
import { space, useTheme } from '@/theme';
import {
  DEV_TIER_ENABLED,
  TIER_INFO,
  Tier,
  getCurrentTier,
  getUpgradePackages,
  purchasePackage,
  restorePurchases,
  setDevTier,
} from '@/lib/subscriptions';

const PERKS: { tier: Tier; perk: string }[] = [
  { tier: 'free', perk: '3 AI photo scans per day' },
  { tier: 'intermediate', perk: '15 AI photo scans per day' },
  { tier: 'pro', perk: 'Unlimited AI photo scans' },
  { tier: 'pro', perk: 'Priority analysis' },
];

export default function PaywallScreen() {
  const { colors } = useTheme();
  const [tier, setTier] = useState<Tier>('free');
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [buying, setBuying] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    getCurrentTier().then(setTier);
    if (!DEV_TIER_ENABLED) getUpgradePackages().then(setPackages);
  }, []);

  const buy = async (pkg: PurchasesPackage) => {
    setBuying(pkg.identifier);
    try {
      const t = await purchasePackage(pkg);
      Alert.alert('Welcome to ' + TIER_INFO[t].label + '!', TIER_INFO[t].blurb + '. Enjoy your scans.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!/cancelled|canceled/i.test(msg)) {
        Alert.alert('Purchase failed', msg);
      }
    } finally {
      setBuying(null);
    }
  };

  const restore = async () => {
    setRestoring(true);
    const t = await restorePurchases();
    setRestoring(false);
    Alert.alert(
      t === 'free' ? 'Nothing to restore' : 'Purchases restored',
      t === 'free' ? 'No previous purchases were found on this account.' : `You're back on the ${TIER_INFO[t].label} plan.`,
      t !== 'free' ? [{ text: 'OK', onPress: () => router.back() }] : undefined
    );
  };

  const saveDevTier = async (t: Tier) => {
    await setDevTier(t);
    setTier(t);
    Alert.alert('Testing mode', `Tier set to ${TIER_INFO[t].label}. This only affects this device.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <HeaderBar title="Upgrade" onClose={() => router.back()} />
      <Screen scroll>
        <Card style={[styles.heroCard, { backgroundColor: colors.accentSoft, borderColor: 'transparent' }]}>
          <View style={styles.heroRow}>
            <View style={[styles.heroIconWrap, { backgroundColor: colors.card }]}>
              <Icon name="diamond" size={24} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.bigLabel, { color: colors.accent }]}>
                Current plan: {TIER_INFO[tier].label}
              </Text>
              <Text style={[styles.blurb, { color: colors.sub }]}>{TIER_INFO[tier].blurb}.</Text>
            </View>
          </View>
          <View style={styles.perks}>
            {PERKS.map((p) => (
              <View key={p.perk} style={styles.perkRow}>
                <Icon name="checkmark-circle" size={16} color={colors.accent} />
                <Text style={[styles.perkText, { color: colors.text }]}>{p.perk}</Text>
              </View>
            ))}
          </View>
        </Card>

        {DEV_TIER_ENABLED ? (
          <Card>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Testing mode</Text>
            <Text style={[styles.blurb, { color: colors.sub }]}>
              RevenueCat isn’t configured yet (RC_ANDROID_API_KEY is empty), so purchases are simulated locally. Pick
              a tier to preview how the app behaves. Production builds will use real subscriptions.
            </Text>
            <Seg
              options={['free', 'intermediate', 'pro'].map((t) => ({ label: TIER_INFO[t as Tier].label, value: t }))}
              value={tier}
              onChange={(v) => saveDevTier(v as Tier)}
            />
          </Card>
        ) : (
          <Card>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Plans</Text>
            {packages.length === 0 ? (
              <Text style={[styles.blurb, { color: colors.sub }]}>
                Plans aren’t available right now. Make sure the app is published to a Play Store test track and
                products are configured in RevenueCat.
              </Text>
            ) : (
              packages.map((pkg) => (
                <View key={pkg.identifier} style={[styles.planRow, { borderColor: colors.border }]}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.planTitle, { color: colors.text }]}>{pkg.product.title}</Text>
                    <Text style={[styles.blurb, { color: colors.sub }]}>{pkg.product.description}</Text>
                  </View>
                  <Btn
                    label={pkg.product.priceString || 'Buy'}
                    onPress={() => buy(pkg)}
                    loading={buying === pkg.identifier}
                    variant="secondary"
                  />
                </View>
              ))
            )}
            <Btn label="Restore purchases" icon="refresh" variant="ghost" onPress={restore} loading={restoring} />
          </Card>
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: { gap: 4 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroIconWrap: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  bigLabel: { fontSize: 17, fontWeight: '800' },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  blurb: { fontSize: 13, lineHeight: 19 },
  perks: { gap: 6, marginTop: space.lg },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  perkText: { fontSize: 14, fontWeight: '600' },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  planTitle: { fontSize: 14, fontWeight: '700' },
});