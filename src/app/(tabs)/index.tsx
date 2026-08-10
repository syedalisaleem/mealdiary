import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Btn, Card, EmptyState, EntryRow, Header, MacroBar, Screen, SectionTitle } from '@/components/ui';
import { dayLabel, mealTypeForTime, todayKey } from '@/lib/dates';
import { fmt } from '@/lib/format';
import { computeTargets, sortedMealSections, sumEntries } from '@/lib/nutrition';
import { MEAL_ICON } from '@/lib/types';
import { useAppData } from '@/lib/storage';
import { useTheme } from '@/theme';

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

        <Card>
          <View style={styles.calRow}>
            <View style={styles.calMain}>
              <Text style={[styles.calValue, { color: over ? colors.danger : colors.text }]}>
                {fmt(totals.calories)}
              </Text>
              <Text style={[styles.calUnit, { color: colors.faint }]}>kcal eaten · target {fmt(targets.calories)}</Text>
            </View>
            <View style={styles.calRemaining}>
              <Text style={[styles.calRemainingValue, { color: over ? colors.danger : colors.success }]}>
                {over ? 'Over by' : `${fmt(remaining)} left`}
              </Text>
            </View>
          </View>
          <View style={[styles.bigTrack, { backgroundColor: colors.input }]}>
            <View
              style={[
                styles.bigFill,
                { backgroundColor: over ? colors.danger : colors.success, width: `${kcalPct * 100}%` },
              ]}
            />
          </View>
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
          <Btn label="📷 Scan a meal" onPress={() => router.push('/scan')} style={{ flex: 1 }} />
          <Btn
            label="➕ Add food"
            variant="secondary"
            onPress={() => router.push({ pathname: '/add', params: { mealType: defaultMeal } })}
            style={{ flex: 1 }}
          />
        </View>

        {sections.length === 0 ? (
          <Card>
            <EmptyState icon="🥗" text="No meals logged yet. Scan a photo or add food manually." />
          </Card>
        ) : (
          sections.map((s) => (
            <View key={s.meal} style={styles.section}>
              <SectionTitle>
                {MEAL_ICON[s.meal]} {s.label}
              </SectionTitle>
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
          <Pressable style={styles.settingsHint} onPress={() => router.push('/(tabs)/settings')}>
            <Text style={{ color: colors.faint }}>Set up goals →</Text>
          </Pressable>
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  subHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: -4 },
  subHeaderDate: { fontSize: 14, fontWeight: '600' },
  subHeaderLoading: { fontSize: 12 },
  calRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  calMain: { gap: 2 },
  calValue: { fontSize: 44, fontWeight: '800', letterSpacing: -1 },
  calUnit: { fontSize: 12.5, fontWeight: '600' },
  calRemaining: { marginBottom: 6 },
  calRemainingValue: { fontSize: 14, fontWeight: '800' },
  bigTrack: { height: 12, borderRadius: 6, overflow: 'hidden' },
  bigFill: { height: 12, borderRadius: 6 },
  macros: { gap: 10 },
  goalNote: { fontSize: 11.5 },
  actions: { flexDirection: 'row', gap: 10 },
  section: { gap: 8 },
  entryCard: { paddingVertical: 6, paddingHorizontal: 14 },
  settingsHint: { alignItems: 'center', paddingVertical: 8 },
});
