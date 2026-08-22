import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Btn, Card, EmptyState, EntryRow, Header, MacroBar, Screen, SectionTitle } from '@/components/ui';
import { MealDiaryBanner } from '@/lib/ads';
import { dayLabel, mealTypeForTime, todayKey } from '@/lib/dates';
import { fmt } from '@/lib/format';
import { computeTargets, sortedMealSections, sumEntries } from '@/lib/nutrition';
import { MEAL_ICON } from '@/lib/types';
import { useAppData } from '@/lib/storage';
import { font, radius, space, useTheme } from '@/theme';

function CalorieRing({
  pct,
  color,
  trackColor,
  size = 168,
  stroke = 13,
  children,
}: {
  pct: number;
  color: string;
  trackColor: string;
  size?: number;
  stroke?: number;
  children: React.ReactNode;
}) {
  const r = size / 2;
  const deg = Math.max(0, Math.min(1, pct)) * 360;
  // Each half-mask reveals a semicircle of the ring. Inside it, a full circle
  // whose colored border is a 90° arc is rotated around the ring centre so the
  // visible coloured arc sweeps clockwise from 12 o'clock.
  //   right bar: borderTop+borderRight, rotate = deg - 135 (deg in [0,180])
  //   left bar:  borderTop+borderLeft,  rotate = (deg|180) - 45 (deg in [180,360])
  const rightRotate = Math.min(deg, 180) - 135;
  const leftRotate = (deg > 180 ? deg : 180) - 45;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: size,
          height: size,
          borderRadius: r,
          borderWidth: stroke,
          borderColor: trackColor,
        }}
      />
      <View style={{ position: 'absolute', top: 0, left: r, width: r, height: size, overflow: 'hidden' }}>
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: -r,
            width: size,
            height: size,
            borderRadius: r,
            borderWidth: stroke,
            borderTopColor: color,
            borderRightColor: color,
            borderBottomColor: 'transparent',
            borderLeftColor: 'transparent',
            transform: [{ rotate: `${rightRotate}deg` }],
          }}
        />
      </View>
      <View style={{ position: 'absolute', top: 0, left: 0, width: r, height: size, overflow: 'hidden' }}>
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: size,
            height: size,
            borderRadius: r,
            borderWidth: stroke,
            borderTopColor: color,
            borderLeftColor: color,
            borderBottomColor: 'transparent',
            borderRightColor: 'transparent',
            transform: [{ rotate: `${leftRotate}deg` }],
          }}
        />
      </View>
      <View style={{ alignItems: 'center', gap: 2 }}>{children}</View>
    </View>
  );
}

export default function TodayScreen() {
  const { colors } = useTheme();
  const { diary, profile, goals, ready } = useAppData();

  const key = todayKey();
  const entries = diary[key] ?? [];
  const totals = sumEntries(entries);
  const targets = goals ?? computeTargets(profile);
  const remaining = Math.max(0, targets.calories - totals.calories);
  const over = totals.calories > targets.calories;
  const kcalPct = targets.calories > 0 ? Math.min(1, totals.calories / targets.calories) : 0;

  const sections = sortedMealSections(entries);
  const defaultMeal = mealTypeForTime(new Date());

  const openEntry = (id: string) =>
    router.push({ pathname: '/entry-edit', params: { mode: 'edit', id, dateKey: key } });

  return (
    <View style={{ flex: 1 }}>
      <Header title="Today" />
      <Screen>
        <View style={styles.subHeader}>
          <Text style={[styles.subHeaderDate, { color: colors.sub }]}>{dayLabel(key)}</Text>
          {!ready && <Text style={[styles.subHeaderLoading, { color: colors.faint }]}>Loading…</Text>}
        </View>

        <Card style={styles.heroCard}>
          <View style={styles.heroTop}>
            <CalorieRing
              pct={over ? 1 : kcalPct}
              color={over ? colors.danger : colors.accent}
              trackColor={colors.border}
            >
              <Text style={[styles.calValue, { color: over ? colors.danger : colors.text }]}>
                {fmt(totals.calories)}
              </Text>
              <Text style={[styles.calUnit, { color: colors.faint }]}>kcal</Text>
              <View
                style={[
                  styles.calRemainingPill,
                  { backgroundColor: over ? colors.dangerSoft : colors.accentSoft },
                ]}
              >
                <Text
                  style={[
                    styles.calRemainingValue,
                    { color: over ? colors.danger : colors.accent },
                  ]}
                >
                  {over ? `Over ${fmt(totals.calories - targets.calories)}` : `${fmt(remaining)} left`}
                </Text>
              </View>
            </CalorieRing>
          </View>
          <Text style={[styles.calTarget, { color: colors.sub }]}>
            Daily target {fmt(targets.calories)} kcal
          </Text>
          <View style={styles.macros}>
            <MacroBar label="Protein" value={totals.protein} target={targets.protein} color={colors.protein} />
            <MacroBar label="Carbs" value={totals.carbs} target={targets.carbs} color={colors.carbs} />
            <MacroBar label="Fat" value={totals.fat} target={targets.fat} color={colors.fat} />
          </View>
          <Text style={[styles.goalNote, { color: colors.faint }]}>
            {goals ? 'Goals set manually in Settings' : 'Targets from your profile (edit in Settings)'}
          </Text>
        </Card>

        <View style={styles.actions}>
          <Btn
            label="Scan a meal"
            icon="camera-outline"
            onPress={() => router.push('/scan')}
            style={{ flex: 1 }}
          />
          <Btn
            label="Add food"
            icon="add"
            variant="secondary"
            onPress={() => router.push({ pathname: '/add', params: { mealType: defaultMeal } })}
            style={{ flex: 1 }}
          />
        </View>

        {sections.length === 0 ? (
          <Card>
            <EmptyState
              icon="restaurant-outline"
              text="Nothing logged yet today"
              sub="Scan a photo of a meal or add it manually."
            />
          </Card>
        ) : (
          sections.map((s) => (
            <View key={s.meal} style={styles.section}>
              <SectionTitle>{s.label}</SectionTitle>
              <Card style={styles.entryCard}>
                {s.entries.map((e) => (
                  <EntryRow
                    key={e.id}
                    name={e.name}
                    serving={e.serving}
                    calories={e.calories}
                    protein={e.protein}
                    carbs={e.carbs}
                    fat={e.fat}
                    photoUri={e.photoUri}
                    icon={MEAL_ICON[e.mealType]}
                    onPress={() => openEntry(e.id)}
                  />
                ))}
              </Card>
            </View>
          ))
        )}

        {ready && !goals && (
          <Pressable
            style={({ pressed }) => [styles.settingsHint, pressed && { opacity: 0.6 }]}
            onPress={() => router.push('/(tabs)/settings')}
          >
            <Text style={{ color: colors.faint, fontWeight: '600' }}>Set up your goals →</Text>
          </Pressable>
        )}
        <MealDiaryBanner />
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  subHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: -4 },
  subHeaderDate: { fontSize: 14, fontWeight: '600' },
  subHeaderLoading: { fontSize: 12 },
  heroCard: { alignItems: 'center', gap: space.md, paddingVertical: space.xl },
  heroTop: { alignItems: 'center' },
  calValue: { fontSize: font.display, fontWeight: '800', letterSpacing: -1.5, fontVariant: ['tabular-nums'] },
  calUnit: { fontSize: 15, fontWeight: '700' },
  calRemainingPill: { borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 7, marginTop: 6 },
  calRemainingValue: { fontSize: 13, fontWeight: '800' },
  calTarget: { fontSize: font.sub, fontWeight: '500' },
  macros: { gap: space.md, alignSelf: 'stretch' },
  goalNote: { fontSize: font.tiny },
  actions: { flexDirection: 'row', gap: space.sm },
  section: { gap: space.sm },
  entryCard: { paddingVertical: 6, paddingHorizontal: space.md },
  settingsHint: { alignItems: 'center', paddingVertical: space.sm },
});
