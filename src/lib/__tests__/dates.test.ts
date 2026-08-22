import { addDaysKey, dateKey, dayLabel, dayNumber, lastNDays, mealTypeForTime, monthDay, todayKey, weekdayLetter } from '@/lib/dates';

describe('dates', () => {
  it('formats dateKey with zero padding', () => {
    expect(dateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(dateKey(new Date(2026, 11, 31))).toBe('2026-12-31');
  });

  it('todayKey returns current local date', () => {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    expect(todayKey()).toBe(`${d.getFullYear()}-${m}-${day}`);
  });

  it('addDaysKey handles month and year boundaries', () => {
    expect(addDaysKey('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDaysKey('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDaysKey('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDaysKey('2026-08-17', 0)).toBe('2026-08-17');
  });

  it('lastNDays returns n consecutive days ending at endKey', () => {
    const days = lastNDays(3, '2026-08-17');
    expect(days).toEqual(['2026-08-15', '2026-08-16', '2026-08-17']);
  });

  it('dayLabel uses relative labels for today/yesterday/tomorrow', () => {
    const t = todayKey();
    expect(dayLabel(t)).toBe('Today');
    expect(dayLabel(addDaysKey(t, -1))).toBe('Yesterday');
    expect(dayLabel(addDaysKey(t, 1))).toBe('Tomorrow');
    // a distant date falls back to the weekday format
    expect(dayLabel(addDaysKey(t, -10))).toMatch(/^[A-Z][a-z]{2}, [A-Z][a-z]{2} \d+$/);
  });

  it('weekdayLetter / dayNumber / monthDay derive from the key', () => {
    // 2026-08-17 is a Monday
    expect(weekdayLetter('2026-08-17')).toBe('Mon');
    expect(dayNumber('2026-08-17')).toBe('17');
    expect(monthDay('2026-08-17')).toBe('Aug 17');
  });

  it('mealTypeForTime picks meals by hour', () => {
    expect(mealTypeForTime(new Date(2026, 0, 1, 8))).toBe('breakfast');
    expect(mealTypeForTime(new Date(2026, 0, 1, 12))).toBe('lunch');
    expect(mealTypeForTime(new Date(2026, 0, 1, 18))).toBe('dinner');
    expect(mealTypeForTime(new Date(2026, 0, 1, 22))).toBe('snack');
    expect(mealTypeForTime(new Date(2026, 0, 1, 10))).toBe('breakfast');
    expect(mealTypeForTime(new Date(2026, 0, 1, 14))).toBe('lunch');
    expect(mealTypeForTime(new Date(2026, 0, 1, 20))).toBe('dinner');
  });
});
