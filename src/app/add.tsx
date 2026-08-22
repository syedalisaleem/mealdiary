import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card, HeaderBar, Icon, Screen } from '@/components/ui';
import { searchFoods, FoodItem } from '@/lib/foods';
import { fmt } from '@/lib/format';
import { mealTypeForTime, todayKey } from '@/lib/dates';
import { MealType } from '@/lib/types';
import { font, radius, space, useTheme } from '@/theme';

export default function AddScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ mealType?: string }>();
  const defaultMeal = (params.mealType as MealType) || mealTypeForTime(new Date());
  const [q, setQ] = useState('');
  const results = searchFoods(q, 30);

  const addFood = (f: FoodItem) => {
    router.replace({
      pathname: '/entry-edit',
      params: {
        mode: 'new',
        dateKey: todayKey(),
        mealType: defaultMeal,
        data: JSON.stringify({
          name: f.name,
          serving: f.serving,
          calories: f.calories,
          protein: f.protein,
          carbs: f.carbs,
          fat: f.fat,
          source: 'manual',
          photoUri: '',
        }),
      },
    });
  };

  const custom = () =>
    router.replace({
      pathname: '/entry-edit',
      params: {
        mode: 'new',
        dateKey: todayKey(),
        mealType: defaultMeal,
        data: JSON.stringify({ name: '', serving: '', calories: 0, protein: 0, carbs: 0, fat: 0, source: 'manual', photoUri: '' }),
      },
    });

  return (
    <View style={{ flex: 1 }}>
      <HeaderBar title="Add food" onClose={() => router.back()} />
      <Screen avoidKeyboard>
        <View style={[styles.searchRow, { backgroundColor: colors.input, borderColor: colors.border }]}>
          <Icon name="search" size={18} color={colors.faint} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search foods — chicken, rice, apple…"
            placeholderTextColor={colors.faint}
            autoFocus
            style={[styles.searchInput, { color: colors.text }]}
          />
          {q.length > 0 && (
            <Pressable onPress={() => setQ('')} hitSlop={10} style={({ pressed }) => pressed && { opacity: 0.5 }}>
              <Icon name="close-circle" size={18} color={colors.faint} />
            </Pressable>
          )}
        </View>

        <Card padding="sm">
          <Pressable onPress={custom} style={({ pressed }) => [styles.customRow, pressed && { opacity: 0.7 }]}>
            <View style={[styles.rowIcon, { backgroundColor: colors.accentSoft }]}>
              <Icon name="create-outline" size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.customName, { color: colors.text }]}>Custom entry</Text>
              <Text style={[styles.customSub, { color: colors.sub }]}>Enter name, calories and macros yourself</Text>
            </View>
            <Icon name="chevron-forward" size={18} color={colors.faint} />
          </Pressable>
        </Card>

        <Text style={[styles.sectionLabel, { color: colors.sub }]}>
          {q.trim() ? `${results.length} result${results.length === 1 ? '' : 's'}` : 'Common foods'}
        </Text>

        <Card padding="sm">
          {results.length === 0 ? (
            <Text style={[styles.noResults, { color: colors.faint }]}>No matches — try the custom entry above.</Text>
          ) : (
            results.map((f) => (
              <Pressable key={f.name} onPress={() => addFood(f)} style={({ pressed }) => [styles.foodRow, pressed && { opacity: 0.7 }]}>
                <View style={[styles.rowIcon, { backgroundColor: colors.input }]}>
                  <Icon name="restaurant-outline" size={18} color={colors.faint} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.foodName, { color: colors.text }]} numberOfLines={1}>
                    {f.name}
                  </Text>
                  <Text style={[styles.foodServing, { color: colors.sub }]} numberOfLines={1}>
                    {f.serving} · P {fmt(f.protein)}g C {fmt(f.carbs)}g F {fmt(f.fat)}g
                  </Text>
                </View>
                <Text style={[styles.foodKcal, { color: colors.text }]}>{fmt(f.calories)}</Text>
                <Text style={[styles.foodKcalUnit, { color: colors.faint }]}>kcal</Text>
              </Pressable>
            ))
          )}
        </Card>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    gap: space.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 12 },
  customRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md },
  rowIcon: { width: 40, height: 40, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  customName: { fontSize: font.body, fontWeight: '700' },
  customSub: { fontSize: 12.5 },
  sectionLabel: { fontSize: font.sub, fontWeight: '700', marginTop: space.xs },
  foodRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 10, paddingHorizontal: space.sm },
  foodName: { fontSize: font.body, fontWeight: '600' },
  foodServing: { fontSize: 12 },
  foodKcal: { fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] },
  foodKcalUnit: { fontSize: 10, alignSelf: 'flex-end', marginBottom: 3 },
  noResults: { textAlign: 'center', paddingVertical: 18, fontSize: 13.5 },
});