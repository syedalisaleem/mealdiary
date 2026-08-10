import { Alert, StyleSheet, Text, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';

import { Btn, Card, Field, Header, Screen, SectionTitle, Seg } from '@/components/ui';
import { PROVIDER_DEFAULTS, testAiConnection } from '@/lib/ai';
import { ACTIVITIES, GOALS_OPTIONS, computeTargets } from '@/lib/nutrition';
import {
  saveAIConfig,
  saveGoals,
  saveProfile,
  setApiKey,
  useAppData,
  wipeAllData,
} from '@/lib/storage';
import { AIConfig, AiProvider, Goals, Profile } from '@/lib/types';
import { useTheme } from '@/theme';

const PROVIDERS: { label: string; value: AiProvider }[] = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'Custom', value: 'custom' },
  { label: 'Gemini', value: 'gemini' },
];

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { apiKey: storedKey, aiConfig, profile: storedProfile, goals: storedGoals, ready } = useAppData();

  // AI section
  const [provider, setProvider] = useState<AiProvider>(aiConfig.provider);
  const [baseUrl, setBaseUrl] = useState(aiConfig.baseUrl);
  const [model, setModel] = useState(aiConfig.model);
  const [key, setKey] = useState(storedKey);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

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
  useEffect(() => {
    if (!ready || synced.current) return;
    synced.current = true;
    setProvider(aiConfig.provider);
    setBaseUrl(aiConfig.baseUrl);
    setModel(aiConfig.model);
    setKey(storedKey);
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
  }, [ready, aiConfig, storedKey, storedProfile, storedGoals]);

  const num = (s: string) => {
    const n = parseFloat(s);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };

  const saveAISection = async () => {
    const cfg: AIConfig = { provider, baseUrl: baseUrl.trim() || PROVIDER_DEFAULTS[provider].baseUrl, model: model.trim() || PROVIDER_DEFAULTS[provider].model };
    await saveAIConfig(cfg);
    await setApiKey(key.trim());
    Alert.alert('Saved', 'AI settings saved on this device only.');
  };

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const cfg: AIConfig = { provider, baseUrl: baseUrl.trim() || PROVIDER_DEFAULTS[provider].baseUrl, model: model.trim() || PROVIDER_DEFAULTS[provider].model };
      const msg = await testAiConnection(cfg, key.trim());
      setTestResult(msg);
    } catch (e) {
      setTestResult(`Failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setTesting(false);
    }
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
      'This permanently removes your diary, profile, goals, AI settings and API key from this device. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete everything', style: 'destructive', onPress: () => wipeAllData().then(() => Alert.alert('Done', 'All local data has been erased.')) },
      ]
    );
  };

  const onProviderChange = (p: AiProvider) => {
    setProvider(p);
    setBaseUrl(PROVIDER_DEFAULTS[p].baseUrl);
    setModel(PROVIDER_DEFAULTS[p].model);
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title="Settings" />
      <Screen>
        <Card>
          <SectionTitle>🔍 AI photo analysis</SectionTitle>
          <Text style={[styles.note, { color: colors.sub }]}>
            When you scan a meal, the photo is sent to the AI service below for calorie/macro estimation. Everything
            else stays on your phone — no account, no sync.
          </Text>
          <Text style={[styles.fieldLabel, { color: colors.sub }]}>Provider</Text>
          <Seg options={PROVIDERS} value={provider} onChange={onProviderChange} />
          {provider !== 'gemini' && (
            <>
              <Field label="Base URL" value={baseUrl} onChange={setBaseUrl} placeholder={PROVIDER_DEFAULTS.custom.baseUrl} />
              <Field label="Model" value={model} onChange={setModel} placeholder={PROVIDER_DEFAULTS.custom.model} />
            </>
          )}
          {provider === 'gemini' && (
            <Field label="Model" value={model} onChange={setModel} placeholder={PROVIDER_DEFAULTS.gemini.model} />
          )}
          <View>
            <Text style={[styles.fieldLabel, { color: colors.sub }]}>API key</Text>
            <View style={[styles.keyRow, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <TextInputKey
                value={key}
                onChange={setKey}
                secure={!showKey}
                placeholder={PROVIDER_DEFAULTS[provider].keyHint}
                colors={colors}
              />
              <PressableText onPress={() => setShowKey((v) => !v)} label={showKey ? 'Hide' : 'Show'} color={colors.accent} />
            </View>
            <Text style={[styles.hint, { color: colors.faint }]}>
              Stored in the device secure storage. Never sent anywhere except the AI provider when you scan a photo.
            </Text>
          </View>
          <View style={styles.row2}>
            <Btn label={testing ? 'Testing…' : 'Test connection'} variant="secondary" onPress={runTest} loading={testing} style={{ flex: 1 }} />
            <Btn label="Save" onPress={saveAISection} style={{ flex: 1 }} />
          </View>
          {testResult && <Text style={[styles.testResult, { color: testResult.startsWith('Connected') ? colors.success : colors.danger }]}>{testResult}</Text>}
        </Card>

        <Card>
          <SectionTitle>👤 Profile</SectionTitle>
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
          <Btn label="Save profile" onPress={saveProfileSection} />
        </Card>

        <Card>
          <SectionTitle>🎯 Daily goals</SectionTitle>
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
            <Btn label="Recalculate from profile" variant="secondary" onPress={recalcGoals} style={{ flex: 1 }} />
            <Btn label="Save goals" onPress={saveGoalsSection} style={{ flex: 1 }} />
          </View>
        </Card>

        <Card>
          <SectionTitle>🗑️ Data</SectionTitle>
          <Text style={[styles.note, { color: colors.sub }]}>
            All diary entries, settings and the API key live only on this device. No account, no cloud, no backend.
          </Text>
          <Btn label="Delete all data on this device" variant="danger" onPress={confirmWipe} />
        </Card>
      </Screen>
    </View>
  );
}

function TextInputKey({
  value,
  onChange,
  secure,
  placeholder,
  colors,
}: {
  value: string;
  onChange: (v: string) => void;
  secure: boolean;
  placeholder: string;
  colors: import('@/theme').Colors;
}) {
  return (
    <Field
      label=""
      value={value}
      onChange={onChange}
      secure={secure}
      placeholder={placeholder}
      style={{ flex: 1 }}
    />
  );
}

function PressableText({ onPress, label, color }: { onPress: () => void; label: string; color: string }) {
  return (
    <Text onPress={onPress} style={{ color, fontSize: 13, fontWeight: '700', padding: 4 }}>
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  note: { fontSize: 13, lineHeight: 19 },
  fieldLabel: { fontSize: 13, fontWeight: '600' },
  keyRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingLeft: 4, paddingRight: 10 },
  hint: { fontSize: 11.5, marginTop: 4, lineHeight: 16 },
  row2: { flexDirection: 'row', gap: 10 },
  testResult: { fontSize: 13, fontWeight: '600' },
});
