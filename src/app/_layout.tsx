import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, useColorScheme, View } from 'react-native';

import { initSubscriptions } from '@/lib/subscriptions';
import { ThemeProvider, themes } from '@/theme';

export default function RootLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  useEffect(() => {
    initSubscriptions();
  }, []);

  if (!fontsLoaded) {
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