import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Btn, Card, Chip, EmptyState, EntryRow, Header, Screen, SectionTitle } from '@/components/ui';
import { dayLabel, dayNumber, lastNDays, monthDay, todayKey, weekdayLetter } from '@/lib/dates';
import { fmt } from '@/lib/format';
import { computeTargets, sortedMealSections, sumEntries } from '@/lib/nutrition';
import { MEAL_ICON } from '@/lib/types';
import { useAppData } from '@/lib/storage';
import { Colors, useTheme } from '@/theme';

export default function HistoryScreen() {
  const { colors } = useTheme();
  const { diary, profile, goals } = useAppData();
  const [selected, setSelected] = useState(todayKey());

  const targets = goals ?? computeTargets(profile);
  const days = lastNDays(30, todayKey());
  const entries = diary[selected] ?? [];
  const totals = sumEntries(entries);
  const sections = sortedMealSections(entries);

  const week = lastNDays(7);
  const maxKcal = Math.max(...week.map((d) => sumEntries(diary[d] ?? []).calories), targets.calories, 1);

  return (
    <View style={{ flex: 1 }}>
      <Header title="History" />
      <Screen>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {days.map((d) => {
            return (
              <Chip
                key={d}
                label={weekdayLetter(d)}
                sub={`${dayNumber(d)}`}
                active={d === selected}
                onPress={() => setSelected(d)}
              />
            );
          })}
        </ScrollView>

        <Card>
          <View style={styles.dayHead}>
            <Text style={[styles.dayLabel, { color: colors.text }]}>{dayLabel(selected)}</Text>
            <Text style={[styles.dayKcal, { color: colors.text }]}>
              {fmt(totals.calories)} <Text style={{ fontSize: 12, color: colors.faint }}>kcal</Text>
            </Text>
          </View>
          <View style={styles.dayMacros}>
            <Text style={[styles.dayMacro, { color: colors.protein }]}>P {fmt(totals.protein)}g</Text>
            <Text style={[styles.dayMacro, { color: colors.carbs }]}>C {fmt(totals.carbs)}g</Text>
            <Text style={[styles.dayMacro, { color: colors.fat }]}>F {fmt(totals.fat)}g</Text>
          </View>
        </Card>

        <Card>
          <Text style={[styles.chartTitle, { color: colors.text }]}>Last 7 days</Text>
          <View style={styles.chart}>
            {week.map((d) => {
              const kcal = sumEntries(diary[d] ?? []).calories;
              const h = Math.max(4, Math.round((kcal / maxKcal) * 110));
              const isToday = d === selected;
              return (
                <PressableBar
                  key={d}
                  label={weekdayLetter(d)}
                  sub={monthDay(d)}
                  height={h}
                  kcal={kcal}
                  over={kcal > targets.calories}
                  highlighted={isToday}
                  onPress={() => setSelected(d)}
                  colors={colors}
                />
              );
            })}
          </View>
        </Card>

        <View style={styles.navRow}>
          <Btn
            label="← Previous day"
            variant="secondary"
            onPress={() => setSelected((s) => {
              const i = days.indexOf(s);
              return i > 0 ? days[i - 1]! : s;
            })}
          />
          <Btn label="Today" variant="secondary" onPress={() => setSelected(todayKey())} />
        </View>

        {sections.length === 0 ? (
          <Card>
            <EmptyState icon="🗓️" text={`Nothing logged on ${dayLabel(selected).toLowerCase()}.`} />
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
                    onPress={() =>
                      router.push({ pathname: '/entry-edit', params: { mode: 'edit', id: e.id, dateKey: selected } })
                    }
                  />
                ))}
              </Card>
            </View>
          ))
        )}
      </Screen>
    </View>
  );
}

function PressableBar({
  label,
  sub,
  height,
  kcal,
  over,
  highlighted,
  onPress,
  colors,
}: {
  label: string;
  sub: string;
  height: number;
  kcal: number;
  over: boolean;
  highlighted: boolean;
  onPress: () => void;
  colors: Colors;
}) {
  return (
    <Pressable onPress={onPress} style={styles.chartCol}>
      <Text style={[styles.chartBarLabel, { color: over ? colors.danger : colors.faint }]}>{kcal}</Text>
      <View style={styles.chartBarWrap}>
        <View
          style={[
            styles.chartBar,
            {
              height,
              backgroundColor: over ? colors.danger : highlighted ? colors.accent : colors.faint,
              opacity: highlighted ? 1 : 0.55,
            },
          ]}
        />
      </View>
      <Text style={[styles.chartDay, { color: highlighted ? colors.accent : colors.sub, fontWeight: highlighted ? '800' : '600' }]}>
        {label}
      </Text>
      <Text style={[styles.chartSub, { color: colors.faint }]}>{sub}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chips: { gap: 8, paddingVertical: 2, paddingRight: 8 },
  dayHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  dayLabel: { fontSize: 18, fontWeight: '800' },
  dayKcal: { fontSize: 22, fontWeight: '800' },
  dayMacros: { flexDirection: 'row', gap: 14 },
  dayMacro: { fontSize: 13, fontWeight: '700' },
  chartTitle: { fontSize: 14, fontWeight: '800' },
  chart: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', justifyContent: 'space-between' },
  chartCol: { flex: 1, alignItems: 'center', gap: 4 },
  chartBarLabel: { fontSize: 9.5, fontWeight: '600' },
  chartBarWrap: { height: 116, justifyContent: 'flex-end' },
  chartBar: { width: '100%', maxWidth: 26, borderRadius: 5 },
  chartDay: { fontSize: 12 },
  chartSub: { fontSize: 9 },
  navRow: { flexDirection: 'row', gap: 10 },
  section: { gap: 8 },
  entryCard: { paddingVertical: 6, paddingHorizontal: 14 },
});
