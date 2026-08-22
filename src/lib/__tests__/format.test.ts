import { fmt, kcal } from '@/lib/format';

describe('format', () => {
  it('formats integers with thousands separators', () => {
    expect(fmt(1234)).toBe('1,234');
    expect(fmt(0)).toBe('0');
  });

  it('rounds to requested digits', () => {
    expect(fmt(1234.5678, 1)).toBe('1,234.6');
    expect(fmt(1234.5678, 2)).toBe('1,234.57');
  });

  it('defaults to whole numbers', () => {
    expect(fmt(99.9)).toBe('100');
  });

  it('handles non-finite input safely', () => {
    expect(fmt(NaN)).toBe('0');
    expect(fmt(Infinity)).toBe('0');
  });

  it('kcal rounds before formatting', () => {
    expect(kcal(250.6)).toBe('251');
    expect(kcal(0)).toBe('0');
  });
});