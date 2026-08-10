export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return dateKey(new Date());
}

export function keyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function addDaysKey(key: string, n: number): string {
  const d = keyToDate(key);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function dayLabel(key: string): string {
  const t = todayKey();
  if (key === t) return 'Today';
  if (key === addDaysKey(t, -1)) return 'Yesterday';
  if (key === addDaysKey(t, 1)) return 'Tomorrow';
  const d = keyToDate(key);
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function monthDay(key: string): string {
  const d = keyToDate(key);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function weekdayLetter(key: string): string {
  return WEEKDAYS[keyToDate(key).getDay()];
}

export function dayNumber(key: string): string {
  return String(keyToDate(key).getDate());
}

export function lastNDays(n: number, endKey?: string): string[] {
  const end = endKey ?? todayKey();
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(addDaysKey(end, -i));
  return out;
}

export function mealTypeForTime(d: Date): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
  const h = d.getHours();
  if (h < 11) return 'breakfast';
  if (h < 15) return 'lunch';
  if (h < 21) return 'dinner';
  return 'snack';
}
