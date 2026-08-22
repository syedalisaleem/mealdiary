import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  KeyboardTypeOptions,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { font, radius, space, useTheme } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

export function Icon({
  name,
  size = 20,
  color,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  const { colors } = useTheme();
  return <Ionicons name={name} size={size} color={color ?? colors.sub} />;
}

export function Screen({
  children,
  scroll = true,
  contentStyle,
  avoidKeyboard = false,
}: {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  avoidKeyboard?: boolean;
}) {
  const inner = (
    <View style={[styles.screenInner, contentStyle]}>
      {children}
      <View style={{ height: 48 }} />
    </View>
  );
  const body = scroll ? (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
    >
      {inner}
    </ScrollView>
  ) : (
    inner
  );
  if (!avoidKeyboard) return body;
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {body}
    </KeyboardAvoidingView>
  );
}

export function Header({ title, right }: { title: string; right?: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.header}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
      {right ? <View style={styles.headerRight}>{right}</View> : null}
    </View>
  );
}

export function Card({
  children,
  style,
  padding = 'lg',
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: 'sm' | 'lg' | 'none';
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: colors.shadow,
          elevation: 1,
        },
        padding === 'sm' && styles.cardPadSm,
        padding === 'none' && { padding: 0 },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Btn({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
  icon,
  iconRight,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'soft';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: IconName;
  iconRight?: IconName;
}) {
  const { colors } = useTheme();
  const isSoft = variant === 'soft';
  const isGhost = variant === 'ghost';
  const isDanger = variant === 'danger';
  const isSecondary = variant === 'secondary';
  const bg = variant === 'primary' ? colors.accent : isSoft ? colors.accentSoft : isDanger ? colors.dangerSoft : 'transparent';
  const fg =
    variant === 'primary'
      ? colors.accentText
      : isDanger
        ? colors.danger
        : isSoft
          ? colors.accent
          : colors.text;
  const borderColor = isGhost
    ? colors.border
    : isSecondary
      ? colors.border
      : isDanger
        ? 'transparent'
        : 'transparent';
  const borderWidth = isGhost || isSecondary ? 1 : 0;
  const elevated = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: bg,
          borderColor,
          borderWidth,
          shadowColor: elevated ? colors.accent : 'transparent',
        },
        elevated && { elevation: 3 },
        (disabled || loading) && { opacity: 0.45 },
        pressed && !disabled && !loading && { opacity: 0.9, transform: [{ scale: 0.98 }] },
        style,
      ]}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon && <Icon name={icon} size={18} color={fg} />}
          <Text style={[styles.btnLabel, { color: fg }]}>{label}</Text>
          {iconRight && <Icon name={iconRight} size={18} color={fg} />}
        </>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  keyboard = 'default',
  secure,
  style,
  autoFocus,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboard?: KeyboardTypeOptions;
  secure?: boolean;
  style?: StyleProp<ViewStyle>;
  autoFocus?: boolean;
  hint?: string;
}) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.field, style]}>
      <Text style={[styles.fieldLabel, { color: colors.sub }]}>{label}</Text>
      <View
        style={[
          styles.fieldBox,
          {
            backgroundColor: colors.input,
            borderColor: focused ? colors.accent : 'transparent',
          },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.faint}
          keyboardType={keyboard}
          secureTextEntry={secure}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus={autoFocus}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.fieldInput, { color: colors.text }]}
        />
      </View>
      {hint ? (
        <Text style={[styles.fieldHint, { color: colors.faint }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

export function Seg<T extends string | number>({
  options,
  value,
  onChange,
  iconFor,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
  iconFor?: (v: T) => IconName;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.seg, { backgroundColor: colors.input }]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            style={({ pressed }) => [
              styles.segItem,
              active && { backgroundColor: colors.card },
              active && styles.segItemActive,
              pressed && !active && { opacity: 0.6 },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            {iconFor && <Icon name={iconFor(o.value)} size={16} color={active ? colors.accent : colors.faint} />}
            <Text
              style={[
                styles.segLabel,
                { color: active ? colors.text : colors.sub },
                active && { color: colors.accent, fontWeight: '800' },
              ]}
              numberOfLines={1}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function MacroBar({
  label,
  value,
  target,
  color,
  unit = 'g',
}: {
  label: string;
  value: number;
  target: number;
  color: string;
  unit?: string;
}) {
  const { colors } = useTheme();
  const pct = target > 0 ? Math.min(1, value / target) : 0;
  const over = target > 0 && value > target;
  return (
    <View style={styles.macroBar}>
      <View style={styles.macroBarTop}>
        <View style={styles.macroBarLabelRow}>
          <View style={[styles.macroDot, { backgroundColor: color }]} />
          <Text style={[styles.macroLabel, { color: colors.text }]}>{label}</Text>
        </View>
        <Text style={[styles.macroValue, { color: over ? colors.danger : colors.sub }]}>
          {Math.round(value)}
          <Text style={{ color: colors.faint }}> / {Math.round(target)} {unit}</Text>
        </Text>
      </View>
      <View style={[styles.macroTrack, { backgroundColor: colors.input }]}>
        <View
          style={[
            styles.macroFill,
            { backgroundColor: color, width: `${Math.max(pct * 100, 2)}%` },
          ]}
        />
      </View>
    </View>
  );
}

export function EntryRow({
  name,
  serving,
  calories,
  protein,
  carbs,
  fat,
  photoUri,
  icon,
  onPress,
}: {
  name: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  photoUri?: string;
  icon?: IconName;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.entryRow, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
    >
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.entryThumb} />
      ) : (
        <View style={[styles.entryThumb, { backgroundColor: colors.input }]}>
          <Icon name={icon ?? 'restaurant-outline'} size={20} color={colors.faint} />
        </View>
      )}
      <View style={styles.entryBody}>
        <Text style={[styles.entryName, { color: colors.text }]} numberOfLines={1}>
          {name}
        </Text>
        <Text style={[styles.entryServing, { color: colors.sub }]} numberOfLines={1}>
          {serving}
        </Text>
        <Text style={[styles.entryMacros, { color: colors.faint }]}>
          P {Math.round(protein)} · C {Math.round(carbs)} · F {Math.round(fat)}
        </Text>
      </View>
      <View style={styles.entryKcalWrap}>
        <Text style={[styles.entryKcal, { color: colors.text }]}>{Math.round(calories)}</Text>
        <Text style={[styles.entryKcalUnit, { color: colors.faint }]}>kcal</Text>
      </View>
    </Pressable>
  );
}

export function SectionTitle({ children, icon }: { children: ReactNode; icon?: IconName }) {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionTitleRow}>
      {icon && <Icon name={icon} size={16} color={colors.accent} />}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{children}</Text>
      <View style={[styles.sectionTitleLine, { backgroundColor: colors.border }]} />
    </View>
  );
}

export function EmptyState({ icon, text, sub }: { icon: IconName; text: string; sub?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIconWrap, { backgroundColor: colors.input }]}>
        <Icon name={icon} size={30} color={colors.faint} />
      </View>
      <Text style={[styles.emptyText, { color: colors.sub }]}>{text}</Text>
      {sub ? <Text style={[styles.emptySub, { color: colors.faint }]}>{sub}</Text> : null}
    </View>
  );
}

export function Chip({
  label,
  sub,
  active,
  onPress,
}: {
  label: string;
  sub: string;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? colors.accent : colors.card,
          borderColor: active ? colors.accent : colors.border,
        },
        active && { shadowColor: colors.accent },
        active && { elevation: 2 },
        pressed && { opacity: 0.8 },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.chipLabel, { color: active ? colors.accentText : colors.sub }]}>{label}</Text>
      <Text style={[styles.chipSub, { color: active ? colors.accentText : colors.faint }]}>{sub}</Text>
    </Pressable>
  );
}

export function HeaderBar({
  title,
  onClose,
  right,
}: {
  title: string;
  onClose: () => void;
  right?: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <SafeAreaView edges={['top']}>
      <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={onClose}
          hitSlop={12}
          style={({ pressed }) => [
            styles.modalHeaderBtn,
            { backgroundColor: colors.input },
            pressed && { opacity: 0.6 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Icon name="close" size={20} color={colors.sub} />
        </Pressable>
        <Text style={[styles.modalHeaderTitle, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.modalHeaderBtn}>{right}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screenInner: { paddingHorizontal: space.lg, paddingTop: space.sm, gap: space.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingTop: space.xs,
    paddingBottom: space.sm,
  },
  headerTitle: { fontSize: font.h1, fontWeight: '800', letterSpacing: -0.6 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.lg,
    gap: space.md,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
  },
  cardPadSm: { paddingVertical: 6, paddingHorizontal: space.md },
  btn: {
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    minHeight: 52,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  btnLabel: { fontSize: font.body, fontWeight: '700', letterSpacing: 0.1 },
  field: { gap: 6 },
  fieldLabel: { fontSize: font.sub, fontWeight: '600' },
  fieldBox: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  fieldInput: {
    paddingVertical: 12,
    fontSize: 16,
  },
  fieldHint: { fontSize: font.tiny },
  seg: {
    flexDirection: 'row',
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },
  segItem: {
    flex: 1,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  segItemActive: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  segLabel: { fontSize: font.sub, fontWeight: '600' },
  macroBar: { gap: 6 },
  macroBarTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  macroBarLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  macroDot: { width: 8, height: 8, borderRadius: 4 },
  macroLabel: { fontSize: 14, fontWeight: '700' },
  macroValue: { fontSize: font.sub, fontWeight: '600' },
  macroTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  macroFill: { height: 8, borderRadius: 4 },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: 11,
  },
  entryThumb: { width: 52, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  entryBody: { flex: 1, gap: 2 },
  entryName: { fontSize: 15, fontWeight: '700' },
  entryServing: { fontSize: 12.5 },
  entryMacros: { fontSize: font.tiny },
  entryKcalWrap: { alignItems: 'flex-end', gap: 0 },
  entryKcal: { fontSize: 17, fontWeight: '800', fontVariant: ['tabular-nums'] },
  entryKcalUnit: { fontSize: 9.5 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  sectionTitle: { fontSize: font.h3, fontWeight: '800', letterSpacing: -0.2 },
  sectionTitleLine: { flex: 1, height: StyleSheet.hairlineWidth },
  empty: { alignItems: 'center', gap: space.sm, paddingVertical: 40 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyText: { fontSize: font.body, textAlign: 'center', fontWeight: '600' },
  emptySub: { fontSize: font.sub, textAlign: 'center' },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingVertical: 9,
    paddingHorizontal: 16,
    alignItems: 'center',
    minWidth: 54,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
  },
  chipLabel: { fontSize: 13, fontWeight: '700' },
  chipSub: { fontSize: 11 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: space.sm,
  },
  modalHeaderBtn: { width: 40, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  modalHeaderTitle: { flex: 1, textAlign: 'center', fontSize: font.h3, fontWeight: '700' },
});

export type { IconName };
