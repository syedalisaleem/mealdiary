import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardTypeOptions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

export function Screen({
  children,
  scroll = true,
  contentStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
}) {
  const inner = (
    <View style={[styles.screenInner, contentStyle]}>
      {children}
      <View style={{ height: 48 }} />
    </View>
  );
  if (!scroll) return inner;
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      {inner}
    </ScrollView>
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

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}>
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
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  const bg =
    variant === 'primary'
      ? colors.accent
      : variant === 'secondary'
        ? colors.input
        : variant === 'danger'
          ? 'transparent'
          : 'transparent';
  const fg =
    variant === 'primary'
      ? colors.accentText
      : variant === 'danger'
        ? colors.danger
        : colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, borderColor: variant === 'ghost' ? colors.border : 'transparent', borderWidth: variant === 'ghost' ? 1 : 0 },
        variant === 'secondary' && { borderWidth: 1, borderColor: colors.border },
        (disabled || loading) && { opacity: 0.5 },
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[styles.btnLabel, { color: fg }]}>{label}</Text>}
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboard?: KeyboardTypeOptions;
  secure?: boolean;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.field, style]}>
      <Text style={[styles.fieldLabel, { color: colors.sub }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.faint}
        keyboardType={keyboard}
        secureTextEntry={secure}
        autoCapitalize="none"
        autoCorrect={false}
        style={[
          styles.fieldInput,
          {
            backgroundColor: colors.input,
            color: colors.text,
            borderColor: colors.border,
          },
        ]}
      />
    </View>
  );
}

export function Seg<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.seg, { backgroundColor: colors.input, borderColor: colors.border }]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            style={[styles.segItem, active && { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text
              style={[
                styles.segLabel,
                { color: active ? colors.text : colors.sub },
                active && { fontWeight: '700' },
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
  return (
    <View style={styles.macroBar}>
      <View style={styles.macroBarTop}>
        <Text style={[styles.macroLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.macroValue, { color: colors.sub }]}>
          {Math.round(value)} / {Math.round(target)} {unit}
        </Text>
      </View>
      <View style={[styles.macroTrack, { backgroundColor: colors.input }]}>
        <View style={[styles.macroFill, { backgroundColor: color, width: `${pct * 100}%` }]} />
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
  icon?: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.entryRow, pressed && { opacity: 0.75 }]}>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.entryThumb} />
      ) : (
        <View style={[styles.entryThumb, { backgroundColor: colors.input }]}>
          <Text style={styles.entryThumbIcon}>{icon ?? '🍽️'}</Text>
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
      <Text style={[styles.entryKcal, { color: colors.text }]}>{Math.round(calories)}</Text>
      <Text style={[styles.entryKcalUnit, { color: colors.faint }]}>kcal</Text>
    </Pressable>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{children}</Text>
      <View style={[styles.sectionTitleLine, { backgroundColor: colors.border }]} />
    </View>
  );
}

export function EmptyState({ icon, text }: { icon: string; text: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={[styles.emptyText, { color: colors.sub }]}>{text}</Text>
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
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.accent : colors.card,
          borderColor: active ? colors.accent : colors.border,
        },
      ]}
    >
      <Text style={[styles.chipLabel, { color: active ? colors.accentText : colors.sub }]}>{label}</Text>
      <Text style={[styles.chipSub, { color: active ? colors.accentText : colors.faint }]}>{sub}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screenInner: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  btn: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  btnLabel: { fontSize: 16, fontWeight: '700' },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600' },
  fieldInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 16,
  },
  seg: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    gap: 3,
  },
  segItem: {
    flex: 1,
    borderRadius: 9,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  segLabel: { fontSize: 13, fontWeight: '600' },
  macroBar: { gap: 5 },
  macroBarTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  macroLabel: { fontSize: 14, fontWeight: '700' },
  macroValue: { fontSize: 13 },
  macroTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  macroFill: { height: 8, borderRadius: 4 },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  entryThumb: { width: 48, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  entryThumbIcon: { fontSize: 22 },
  entryBody: { flex: 1, gap: 2 },
  entryName: { fontSize: 15, fontWeight: '700' },
  entryServing: { fontSize: 12.5 },
  entryMacros: { fontSize: 11.5 },
  entryKcal: { fontSize: 16, fontWeight: '800' },
  entryKcalUnit: { fontSize: 10, alignSelf: 'flex-end', marginBottom: 3 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  sectionTitleLine: { flex: 1, height: 1 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 40 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 14, textAlign: 'center' },
  chip: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    minWidth: 56,
  },
  chipLabel: { fontSize: 14, fontWeight: '700' },
  chipSub: { fontSize: 11 },
});

export function HeaderBar({ title, onClose, right }: { title: string; onClose: () => void; right?: ReactNode }) {
  const { colors } = useTheme();
  return (
    <SafeAreaView edges={['top']}>
      <View style={[modalHeaderStyles.modalHeader, { borderBottomColor: colors.border }]}>
        <Pressable onPress={onClose} hitSlop={12} style={modalHeaderStyles.modalHeaderBtn}>
          <Text style={[modalHeaderStyles.modalHeaderIcon, { color: colors.sub }]}>✕</Text>
        </Pressable>
        <Text style={[modalHeaderStyles.modalHeaderTitle, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={modalHeaderStyles.modalHeaderBtn}>{right}</View>
      </View>
    </SafeAreaView>
  );
}

const modalHeaderStyles = StyleSheet.create({
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  modalHeaderBtn: { width: 36, alignItems: 'center' },
  modalHeaderIcon: { fontSize: 17, fontWeight: '700' },
  modalHeaderTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700' },
});
