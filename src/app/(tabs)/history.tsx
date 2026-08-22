import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Btn, Card, Chip, EmptyState, EntryRow, Header, Screen, SectionTitle } from '@/components/ui';
import { dayLabel, dayNumber, lastNDays, monthDay, todayKey, weekdayLetter } from '@/lib/dates';
import { fmt } from '@/lib/format';
import { computeTargets, sortedMealSections, sumEntries } from '@/lib/nutrition';
import { MEAL_ICON } from '@/lib/types';
import { useAppData } from '@/lib/storage';
import { Colors, font, radius, space, useTheme } from '@/theme';

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
            <MacroPill label="P" value={totals.protein} color={colors.protein} />
            <MacroPill label="C" value={totals.carbs} color={colors.carbs} />
            <MacroPill label="F" value={totals.fat} color={colors.fat} />
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
            label="Previous day"
            icon="chevron-back"
            variant="secondary"
            onPress={() =>
              setSelected((s) => {
                const i = days.indexOf(s);
                return i > 0 ? days[i - 1]! : s;
              })
            }
          />
          <Btn label="Today" variant="secondary" onPress={() => setSelected(todayKey())} />
        </View>

        {sections.length === 0 ? (
          <Card>
            <EmptyState
              icon="calendar-outline"
              text={`Nothing logged on ${dayLabel(selected).toLowerCase()}`}
              sub="Add a meal from the Today tab."
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

function MacroPill({ label, value, color }: { label: string; value: number; color: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.macroPill, { backgroundColor: colors.input }]}>
      <View style={[styles.macroDot, { backgroundColor: color }]} />
      <Text style={[styles.macroPillText, { color: colors.text }]}>
        {label} <Text style={{ fontWeight: '800', fontVariant: ['tabular-nums'] }}>{fmt(value)}</Text>g
      </Text>
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
    <Pressable onPress={onPress} style={({ pressed }) => [styles.chartCol, pressed && { opacity: 0.7 }]}>
      <Text
        style={[
          styles.chartBarLabel,
          { color: over ? colors.danger : highlighted ? colors.accent : colors.faint },
        ]}
      >
        {kcal > 0 ? kcal : ''}
      </Text>
      <View style={styles.chartBarWrap}>
        <View
          style={[
            styles.chartBar,
            {
              height,
              backgroundColor: over ? colors.danger : highlighted ? colors.accent : colors.faint,
              opacity: highlighted || over ? 1 : 0.45,
            },
          ]}
        />
      </View>
      <Text
        style={[
          styles.chartDay,
          { color: highlighted ? colors.accent : colors.sub, fontWeight: highlighted ? '800' : '600' },
        ]}
      >
        {label}
      </Text>
      <Text style={[styles.chartSub, { color: colors.faint }]}>{sub}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chips: { gap: space.sm, paddingVertical: 2, paddingRight: space.sm },
  dayHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  dayLabel: { fontSize: 19, fontWeight: '800' },
  dayKcal: { fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'] },
  dayMacros: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  macroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  macroDot: { width: 8, height: 8, borderRadius: 4 },
  macroPillText: { fontSize: font.sub, fontWeight: '600' },
  chartTitle: { fontSize: font.body, fontWeight: '800' },
  chart: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-end', justifyContent: 'space-between' },
  chartCol: { flex: 1, alignItems: 'center', gap: 4 },
  chartBarLabel: { fontSize: 9.5, fontWeight: '700', height: 13 },
  chartBarWrap: { height: 116, justifyContent: 'flex-end' },
  chartBar: { width: '100%', maxWidth: 26, borderRadius: 5 },
  chartDay: { fontSize: 12 },
  chartSub: { fontSize: 9 },
  navRow: { flexDirection: 'row', gap: space.sm },
  section: { gap: space.sm },
  entryCard: { paddingVertical: 6, paddingHorizontal: space.md },
});