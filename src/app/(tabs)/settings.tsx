import { Alert, StyleSheet, Text, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';

import { Btn, Card, Field, Header, Screen, SectionTitle, Seg } from '@/components/ui';
import { ACTIVITIES, GOALS_OPTIONS, computeTargets } from '@/lib/nutrition';
import { saveGoals, saveProfile, useAppData, wipeAllData } from '@/lib/storage';
import { Goals, Profile } from '@/lib/types';
import { TIER_INFO, Tier, getCurrentTier } from '@/lib/subscriptions';
import { MAX_AD_CREDITS_PER_DAY } from '@/lib/credits';
import { font, space, useTheme } from '@/theme';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { profile: storedProfile, goals: storedGoals, ready } = useAppData();

  // Profile section
  const [sex, setSex] = useState<Profile['sex']>(storedProfile.sex);
  const [age, setAge] = useState(String(storedProfile.age));
  const [heightCm, setHeightCm] = useState(String(storedProfile.heightCm));
  const [weightKg, setWeightKg] = useState(String(storedProfile.weightKg));
  const [activity, setActivity] = useState<number>(storedProfile.activity);
  const [goal, setGoal] = useState<Profile['goal']>(storedProfile.goal);

  // Goals section
  const [gCalories, setGCalories] = useState(String(storedGoals?.calories ?? ''));
  const [gProtein, setGProtein] = useState(String(storedGoals?.protein ?? ''));
  const [gCarbs, setGCarbs] = useState(String(storedGoals?.carbs ?? ''));
  const [gFat, setGFat] = useState(String(storedGoals?.fat ?? ''));

  const synced = useRef(false);
  const [tier, setTier] = useState<Tier>('free');

  useEffect(() => {
    getCurrentTier().then(setTier);
  }, []);

  useEffect(() => {
    if (!ready || synced.current) return;
    synced.current = true;
    setSex(storedProfile.sex);
    setAge(String(storedProfile.age));
    setHeightCm(String(storedProfile.heightCm));
    setWeightKg(String(storedProfile.weightKg));
    setActivity(storedProfile.activity);
    setGoal(storedProfile.goal);
    setGCalories(storedGoals?.calories != null ? String(storedGoals.calories) : '');
    setGProtein(storedGoals?.protein != null ? String(storedGoals.protein) : '');
    setGCarbs(storedGoals?.carbs != null ? String(storedGoals.carbs) : '');
    setGFat(storedGoals?.fat != null ? String(storedGoals.fat) : '');
  }, [ready, storedProfile, storedGoals]);

  const num = (s: string) => {
    const n = parseFloat(s);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };

  const saveProfileSection = async () => {
    const p: Profile = {
      sex,
      age: Math.round(num(age)) || 30,
      heightCm: num(heightCm) || 165,
      weightKg: num(weightKg) || 60,
      activity,
      goal,
    };
    await saveProfile(p);
    Alert.alert('Saved', 'Profile updated. Targets will be recalculated.');
  };

  const recalcGoals = () => {
    const t = computeTargets({ sex, age: num(age), heightCm: num(heightCm), weightKg: num(weightKg), activity, goal });
    setGCalories(String(t.calories));
    setGProtein(String(t.protein));
    setGCarbs(String(t.carbs));
    setGFat(String(t.fat));
  };

  const saveGoalsSection = async () => {
    if (!gCalories.trim()) {
      await saveGoals(null);
      Alert.alert('Saved', 'Goals now come from your profile.');
      return;
    }
    const g: Goals = {
      calories: Math.round(num(gCalories)),
      protein: Math.round(num(gProtein)),
      carbs: Math.round(num(gCarbs)),
      fat: Math.round(num(gFat)),
    };
    await saveGoals(g);
    Alert.alert('Saved', 'Manual goals saved.');
  };

  const confirmWipe = () => {
    Alert.alert(
      'Delete all data?',
      'This permanently removes your diary, profile, goals, AI settings, API key and scan credits from this device. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete everything', style: 'destructive', onPress: () => wipeAllData().then(() => Alert.alert('Done', 'All local data has been erased.')) },
      ]
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title="Settings" />
      <Screen>
        <Card>
          <SectionTitle icon="diamond-outline">MealDiary Plus</SectionTitle>
          <Text style={[styles.note, { color: colors.sub }]}>
            You’re on the {TIER_INFO[tier].label} plan — {TIER_INFO[tier].blurb}. The scan screen also lets you watch a
            short ad for one extra scan (up to {MAX_AD_CREDITS_PER_DAY} per day).
          </Text>
          <Btn label={tier === 'free' ? 'Upgrade now' : 'Manage plan'} icon="arrow-forward" onPress={() => router.push('/paywall')} />
        </Card>

        <Card>
          <SectionTitle icon="sparkles-outline">AI photo analysis</SectionTitle>
          <Text style={[styles.note, { color: colors.sub }]}>
            Meal scanning is powered by Google Gemini — no setup or API key needed. When you scan a meal, the photo is
            sent to Gemini for calorie and macro estimates. Everything else stays on your phone.
          </Text>
        </Card>

        <Card>
          <SectionTitle icon="person-outline">Profile</SectionTitle>
          <Text style={[styles.note, { color: colors.sub }]}>Used to calculate your daily calorie and macro targets.</Text>
          <Text style={[styles.fieldLabel, { color: colors.sub }]}>Sex</Text>
          <Seg options={[{ label: 'Female', value: 'female' }, { label: 'Male', value: 'male' }]} value={sex} onChange={(v) => setSex(v)} />
          <View style={styles.row2}>
            <Field label="Age" value={age} onChange={setAge} keyboard="number-pad" style={{ flex: 1 }} />
            <Field label="Height (cm)" value={heightCm} onChange={setHeightCm} keyboard="number-pad" style={{ flex: 1 }} />
          </View>
          <Field label="Weight (kg)" value={weightKg} onChange={setWeightKg} keyboard="decimal-pad" />
          <Text style={[styles.fieldLabel, { color: colors.sub }]}>Activity</Text>
          <Seg options={ACTIVITIES} value={activity} onChange={(v) => setActivity(v as number)} />
          <Text style={[styles.fieldLabel, { color: colors.sub }]}>Goal</Text>
          <Seg options={GOALS_OPTIONS} value={goal} onChange={(v) => setGoal(v as Profile['goal'])} />
          <Btn label="Save profile" icon="checkmark" onPress={saveProfileSection} />
        </Card>

        <Card>
          <SectionTitle icon="flag-outline">Daily goals</SectionTitle>
          <Text style={[styles.note, { color: colors.sub }]}>
            Leave calories empty to auto-compute targets from your profile.
          </Text>
          <View style={styles.row2}>
            <Field label="Calories" value={gCalories} onChange={setGCalories} keyboard="number-pad" style={{ flex: 1 }} />
            <Field label="Protein (g)" value={gProtein} onChange={setGProtein} keyboard="decimal-pad" style={{ flex: 1 }} />
          </View>
          <View style={styles.row2}>
            <Field label="Carbs (g)" value={gCarbs} onChange={setGCarbs} keyboard="decimal-pad" style={{ flex: 1 }} />
            <Field label="Fat (g)" value={gFat} onChange={setGFat} keyboard="decimal-pad" style={{ flex: 1 }} />
          </View>
          <View style={styles.row2}>
            <Btn label="Recalculate" icon="refresh" variant="secondary" onPress={recalcGoals} style={{ flex: 1 }} />
            <Btn label="Save goals" icon="checkmark" onPress={saveGoalsSection} style={{ flex: 1 }} />
          </View>
        </Card>

        <Card>
          <SectionTitle icon="trash-outline">Data</SectionTitle>
          <Text style={[styles.note, { color: colors.sub }]}>
            All diary entries, settings and the API key live only on this device. No account, no cloud, no backend.
          </Text>
          <Btn label="Delete all data on this device" icon="trash-outline" variant="danger" onPress={confirmWipe} />
          <Btn label="Privacy policy" icon="shield-checkmark-outline" variant="ghost" onPress={() => router.push('/privacy-policy')} />
        </Card>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  note: { fontSize: font.sub, lineHeight: 19 },
  fieldLabel: { fontSize: font.sub, fontWeight: '600' },
  row2: { flexDirection: 'row', gap: space.sm },
});