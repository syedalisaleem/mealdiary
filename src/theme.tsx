import { createContext, ReactNode, useContext } from 'react';
import { useColorScheme } from 'react-native';

export interface Colors {
  bg: string;
  card: string;
  cardAlt: string;
  input: string;
  text: string;
  sub: string;
  faint: string;
  border: string;
  accent: string;
  accentSoft: string;
  accentText: string;
  success: string;
  successSoft: string;
  warn: string;
  danger: string;
  dangerSoft: string;
  protein: string;
  carbs: string;
  fat: string;
  overlay: string;
  shadow: string;
  shadowHigh: string;
}

export const themes: Record<'light' | 'dark', Colors> = {
  light: {
    bg: '#F6F7F9',
    card: '#FFFFFF',
    cardAlt: '#F0F4FB',
    input: '#EEF1F6',
    text: '#172033',
    sub: '#3B4658',
    faint: '#6B7689',
    border: '#D8DEE8',
    accent: '#2563EB',
    accentSoft: '#E7EEFD',
    accentText: '#FFFFFF',
    success: '#16A34A',
    successSoft: '#E6F5EC',
    warn: '#F59E0B',
    danger: '#DC2626',
    dangerSoft: '#FCEBEC',
    protein: '#2563EB',
    carbs: '#F59E0B',
    fat: '#E11D48',
    overlay: 'rgba(23, 32, 51, 0.45)',
    shadow: 'rgba(23, 32, 51, 0.08)',
    shadowHigh: 'rgba(23, 32, 51, 0.16)',
  },
  dark: {
    bg: '#0E1116',
    card: '#171B23',
    cardAlt: '#1D2330',
    input: '#232A37',
    text: '#F0F2F6',
    sub: '#A8B1C1',
    faint: '#6B7689',
    border: '#262D3A',
    accent: '#60A5FA',
    accentSoft: '#1B2A45',
    accentText: '#0B1220',
    success: '#4ADE80',
    successSoft: '#14301F',
    warn: '#FBBF24',
    danger: '#F87171',
    dangerSoft: '#3A1B1B',
    protein: '#60A5FA',
    carbs: '#FBBF24',
    fat: '#FB7185',
    overlay: 'rgba(0, 0, 0, 0.6)',
    shadow: 'rgba(0, 0, 0, 0.4)',
    shadowHigh: 'rgba(0, 0, 0, 0.6)',
  },
};

// Spacing scale (4pt grid)
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 } as const;

// Radius scale
export const radius = { sm: 10, md: 14, lg: 20, xl: 26, pill: 999 } as const;

// Type scale
export const font = {
  display: 52,
  h1: 30,
  h2: 22,
  h3: 17,
  body: 16,
  sub: 13.5,
  tiny: 12,
} as const;

const ThemeContext = createContext<{ isDark: boolean; colors: Colors }>({
  isDark: false,
  colors: themes.light,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return (
    <ThemeContext.Provider value={{ isDark, colors: themes[isDark ? 'dark' : 'light'] }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
