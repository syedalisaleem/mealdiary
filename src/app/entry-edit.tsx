import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Btn, Card, Field, HeaderBar, Screen, Seg } from '@/components/ui';
import { addDaysKey, dayLabel, todayKey } from '@/lib/dates';
import { addEntry, getDiary, newEntryId, removeEntry, updateEntry } from '@/lib/storage';
import { Entry, MEAL_LABEL, MEAL_ORDER, MealType } from '@/lib/types';
import { useTheme } from '@/theme';

interface Prefill {
  name?: string;
  serving?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  source?: 'ai' | 'manual';
  photoUri?: string;
}

export default function EntryEditScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ mode?: string; id?: string; dateKey?: string; mealType?: string; data?: string }>();
  const mode = params.mode === 'edit' ? 'edit' : 'new';

  const [entry, setEntry] = useState<Entry | null>(null);
  const [name, setName] = useState('');
  const [serving, setServing] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [mealType, setMealType] = useState<MealType>((params.mealType as MealType) || 'snack');
  const [dateKey, setDateKey] = useState(params.dateKey || todayKey());
  const [source, setSource] = useState<'ai' | 'manual'>('manual');
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      if (mode === 'edit' && params.id && params.dateKey) {
        const d = await getDiary();
        const found = (d[params.dateKey] ?? []).find((e) => e.id === params.id);
        if (found) {
          setEntry(found);
          setName(found.name);
          setServing(found.serving);
          setCalories(found.calories ? String(found.calories) : '');
          setProtein(found.protein ? String(found.protein) : '');
          setCarbs(found.carbs ? String(found.carbs) : '');
          setFat(found.fat ? String(found.fat) : '');
          setMealType(found.mealType);
          setDateKey(found.dateKey);
          setSource(found.source);
          setPhotoUri(found.photoUri);
        }
      } else if (params.data) {
        try {
          const p = JSON.parse(params.data) as Prefill;
          setName(p.name ?? '');
          setServing(p.serving ?? '');
          setCalories(p.calories != null && p.calories > 0 ? String(p.calories) : '');
          setProtein(p.protein != null && p.protein > 0 ? String(p.protein) : '');
          setCarbs(p.carbs != null && p.carbs > 0 ? String(p.carbs) : '');
          setFat(p.fat != null && p.fat > 0 ? String(p.fat) : '');
          if (p.source) setSource(p.source);
          if (p.photoUri) setPhotoUri(p.photoUri);
        } catch {
          // ignore malformed prefill
        }
      }
      setLoaded(true);
    })();
  }, [mode, params.id, params.dateKey, params.data]);

  const num = (s: string) => {
    const n = parseFloat(s);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };

  const canSave = name.trim().length > 0 && num(calories) > 0;

  const save = async () => {
    const base: Entry = {
      id: entry?.id ?? newEntryId(),
      dateKey,
      mealType,
      name: name.trim(),
      serving: serving.trim() || '1 portion',
      calories: Math.round(num(calories)),
      protein: Math.round(num(protein)),
      carbs: Math.round(num(carbs)),
      fat: Math.round(num(fat)),
      source,
      photoUri,
      createdAt: entry?.createdAt ?? Date.now(),
    };
    if (mode === 'edit') await updateEntry(base);
    else await addEntry(base);
    router.back();
  };

  const confirmDelete = () => {
    if (!entry) return;
    Alert.alert('Delete entry?', `Remove "${entry.name}" from your log?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => removeEntry(entry.id, entry.dateKey).then(() => router.back()),
      },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <HeaderBar
        title={mode === 'edit' ? 'Edit entry' : 'New entry'}
        onClose={() => router.back()}
        right={mode === 'edit' ? <Text onPress={confirmDelete} style={{ color: colors.danger, fontWeight: '700' }}>Delete</Text> : undefined}
      />
      <Screen>
        {!loaded ? null : (
          <>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} />
            ) : (
              <View style={[styles.photoPlaceholder, { backgroundColor: colors.input }]}>
                <Text style={styles.photoIcon}>🍽️</Text>
              </View>
            )}

            {source === 'ai' && (
              <Card style={styles.aiBadge}>
                <Text style={{ fontSize: 12.5, color: colors.sub }}>
                  🤖 Estimate from photo — adjust anything that looks wrong.
                </Text>
              </Card>
            )}

            <Text style={[styles.fieldLabel, { color: colors.sub }]}>Meal</Text>
            <Seg
              options={MEAL_ORDER.map((m) => ({ label: MEAL_LABEL[m], value: m }))}
              value={mealType}
              onChange={(v) => setMealType(v as MealType)}
            />

            <Field label="Food name" value={name} onChange={setName} placeholder="e.g. Chicken rice bowl" />
            <Field label="Serving (optional)" value={serving} onChange={setServing} placeholder="e.g. 1 bowl" />

            <View style={styles.row2}>
              <Field label="Calories" value={calories} onChange={setCalories} keyboard="decimal-pad" style={{ flex: 1 }} />
              <Field label="Protein (g)" value={protein} onChange={setProtein} keyboard="decimal-pad" style={{ flex: 1 }} />
            </View>
            <View style={styles.row2}>
              <Field label="Carbs (g)" value={carbs} onChange={setCarbs} keyboard="decimal-pad" style={{ flex: 1 }} />
              <Field label="Fat (g)" value={fat} onChange={setFat} keyboard="decimal-pad" style={{ flex: 1 }} />
            </View>

            <View style={styles.dayRow}>
              <Text style={[styles.fieldLabel, { color: colors.sub }]}>Day</Text>
              <View style={styles.dayStepper}>
                <Pressable onPress={() => setDateKey((k) => addDaysKey(k, -1))} hitSlop={8} style={[styles.dayBtn, { backgroundColor: colors.input }]}>
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>◀</Text>
                </Pressable>
                <Text style={[styles.dayLabel, { color: colors.text }]}>{dayLabel(dateKey)}</Text>
                <Pressable onPress={() => setDateKey((k) => addDaysKey(k, 1))} hitSlop={8} style={[styles.dayBtn, { backgroundColor: colors.input }]}>
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>▶</Text>
                </Pressable>
              </View>
            </View>

            <Btn label={mode === 'edit' ? 'Save changes' : 'Add to log'} onPress={save} disabled={!canSave} />
            {!canSave && <Text style={[styles.saveHint, { color: colors.faint }]}>Enter a name and calories to save.</Text>}
          </>
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  photo: { width: '100%', aspectRatio: 1, borderRadius: 16 },
  photoPlaceholder: { width: '100%', aspectRatio: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  photoIcon: { fontSize: 48, opacity: 0.4 },
  aiBadge: { padding: 10, borderRadius: 12 },
  fieldLabel: { fontSize: 13, fontWeight: '600' },
  row2: { flexDirection: 'row', gap: 10 },
  dayRow: { gap: 6 },
  dayStepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  dayBtn: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dayLabel: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '700' },
  saveHint: { textAlign: 'center', fontSize: 12.5 },
});
