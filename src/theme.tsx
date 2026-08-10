import { createContext, ReactNode, useContext } from 'react';
import { useColorScheme } from 'react-native';

export interface Colors {
  bg: string;
  card: string;
  input: string;
  text: string;
  sub: string;
  faint: string;
  border: string;
  accent: string;
  accentText: string;
  success: string;
  warn: string;
  danger: string;
  protein: string;
  carbs: string;
  fat: string;
  overlay: string;
}

export const themes: Record<'light' | 'dark', Colors> = {
  light: {
    bg: '#F6F5F1',
    card: '#FFFFFF',
    input: '#F3F2EC',
    text: '#1B1A17',
    sub: '#6E6C63',
    faint: '#A5A398',
    border: '#E6E4DB',
    accent: '#E8590C',
    accentText: '#FFFFFF',
    success: '#2F9E44',
    warn: '#E08700',
    danger: '#E03131',
    protein: '#4C6EF5',
    carbs: '#E8920B',
    fat: '#E64980',
    overlay: 'rgba(0,0,0,0.35)',
  },
  dark: {
    bg: '#121210',
    card: '#1D1C18',
    input: '#26251F',
    text: '#F3F2EC',
    sub: '#9C9A8E',
    faint: '#6E6C62',
    border: '#2E2C26',
    accent: '#FF922B',
    accentText: '#1B1A17',
    success: '#51CF66',
    warn: '#FFC34D',
    danger: '#FF6B6B',
    protein: '#748FFC',
    carbs: '#FCC419',
    fat: '#F06595',
    overlay: 'rgba(0,0,0,0.55)',
  },
};

const ThemeContext = createContext<{ isDark: boolean; colors: Colors }>({
  isDark: false,
  colors: themes.light,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return <ThemeContext.Provider value={{ isDark, colors: themes[isDark ? 'dark' : 'light'] }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
