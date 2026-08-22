import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Card, HeaderBar, Screen } from '@/components/ui';
import { font, useTheme } from '@/theme';

interface PolicySection {
  title: string;
  paragraphs: string[];
  bullets?: { label: string; detail: string }[];
}

const SECTIONS: PolicySection[] = [
  {
    title: 'Data we collect',
    paragraphs: [
      'MealDiary is a local-first app. Everything you enter stays on your device unless you explicitly trigger a network call.',
    ],
    bullets: [
      {
        label: 'Diary entries',
        detail:
          'Food names, portion descriptions, calories, protein, carbs, and fat that you log manually or with the built-in food database.',
      },
      {
        label: 'Photos',
        detail: 'Photos of meals you choose to take or pick for AI calorie estimation.',
      },
      {
        label: 'Profile and goals',
        detail:
          'Optional sex, age, height, weight, activity level, and calorie goal, used only to calculate your target calories.',
      },
      {
        label: 'AI service configuration',
        detail:
          'Your chosen AI provider (OpenAI, Google Gemini, or a custom endpoint) and model. The API key you enter is stored securely on your device.',
      },
    ],
  },
  {
    title: 'How data is used',
    paragraphs: [
      'On-device storage. Diary entries, profile data, goals, and photos are stored locally on your device. They are never uploaded to us, and we have no servers.',
      'AI photo analysis. When you analyze a meal photo, the photo and your chosen AI provider\u2019s key are sent directly from your device to the AI provider you configured. The AI response is parsed on your device and the estimate is added to your local diary. MealDiary does not see, store, or receive your photos or API keys.',
    ],
  },
  {
    title: 'Permissions',
    paragraphs: [
      'Camera \u2014 used only when you take a photo of a meal.',
      'Photo library \u2014 used only when you pick an existing photo of a meal.',
    ],
  },
  {
    title: 'Data retention and deletion',
    paragraphs: [
      'Data stays on your device until you delete it. Deleting all app data in Settings removes diary entries, profile, goals, AI settings, and saved photos.',
      'Uninstalling the app removes all locally stored data.',
    ],
  },
  {
    title: 'Advertising',
    paragraphs: [
      'The app shows ads served by Google AdMob (a service of Google LLC). AdMob may collect and use your device\u2019s advertising ID (AAID on Android) and related usage data to serve and measure ads. See Google\u2019s privacy policy for details.',
      'When you choose to watch a rewarded ad to unlock a free AI photo scan, Google AdMob processes data to serve that ad.',
      'You can reset your advertising ID or limit ad personalization in your device settings.',
    ],
  },
  {
    title: 'Third parties',
    paragraphs: [
      'MealDiary has no analytics or tracking SDKs beyond the Google AdMob SDK used to serve ads.',
      'Photos and API requests are handled by the AI provider you choose; their privacy policies apply to that transmission (e.g., OpenAI, Google).',
    ],
  },
  {
    title: 'Contact',
    paragraphs: [
      'For questions about this policy, contact: syedalisaleem14@gmail.com',
    ],
  },
];

export default function PrivacyPolicyScreen() {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1 }}>
      <HeaderBar title="Privacy Policy" onClose={() => router.back()} />
      <Screen>
        <Text style={[styles.intro, { color: colors.sub }]}>
          Last updated: August 11, 2026
        </Text>
        <Text style={[styles.intro, { color: colors.sub }]}>
          MealDiary is a local-first meal diary app. This policy explains what data the app
          collects, how it is used, and your choices.
        </Text>

        {SECTIONS.map((section) => (
          <Card key={section.title}>
            <Text style={[styles.heading, { color: colors.text }]}>{section.title}</Text>
            {section.paragraphs.map((p, i) => (
              <Text key={i} style={[styles.paragraph, { color: colors.text }]}>
                {p}
              </Text>
            ))}
            {section.bullets?.map((b) => (
              <View key={b.label} style={styles.bullet}>
                <Text style={[styles.bulletLabel, { color: colors.text }]}>• {b.label}</Text>
                <Text style={[styles.paragraph, { color: colors.text }]}>{b.detail}</Text>
              </View>
            ))}
          </Card>
        ))}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: font.sub, lineHeight: 19, marginBottom: 4 },
  heading: { fontSize: 17, fontWeight: '800' },
  paragraph: { fontSize: 14, lineHeight: 21 },
  bullet: { gap: 4 },
  bulletLabel: { fontSize: 14, fontWeight: '700' },
});