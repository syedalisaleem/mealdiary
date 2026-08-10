import { Tabs } from 'expo-router';
import { ColorValue, Text } from 'react-native';

import { useTheme } from '@/theme';

function TabIcon({ glyph, color, size }: { glyph: string; color: ColorValue; size: number }) {
  return <Text style={{ fontSize: size - 2, color }}>{glyph}</Text>;
}

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.faint,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => <TabIcon glyph="🍽️" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => <TabIcon glyph="📅" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <TabIcon glyph="⚙️" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
