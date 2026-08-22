import { Ionicons } from '@expo/vector-icons';
import * as Font from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, useColorScheme, View } from 'react-native';

import { initSubscriptions } from '@/lib/subscriptions';
import { ThemeProvider, themes } from '@/theme';

const IONICONS_CDN = 'https://cdn.jsdelivr.net/npm/react-native-vector-icons@10.0.0/Fonts/Ionicons.ttf';

function injectIoniconsFontFace() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const styleId = 'expo-generated-fonts';
  let styleEl = document.getElementById(styleId);
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  const sheet = styleEl.sheet || (styleEl as HTMLStyleElement).styleSheet;
  if (!sheet) return;
  const css = `@font-face{font-family:"ionicons";src:url(${IONICONS_CDN});font-display:auto}`;
  try { sheet.insertRule(css, sheet.cssRules.length); } catch {}
}

export default function RootLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      injectIoniconsFontFace();
      await Font.loadAsync(Ionicons.font);
      initSubscriptions();
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: themes[isDark ? 'dark' : 'light'].bg }}>
        <ActivityIndicator size="large" color={themes[isDark ? 'dark' : 'light'].accent} />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: themes[isDark ? 'dark' : 'light'].bg },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="scan" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="add" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="entry-edit" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="paywall" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="privacy-policy" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </ThemeProvider>
  );
}