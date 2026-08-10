export function fmt(n: number, digits = 0): string {
  if (!Number.isFinite(n)) return '0';
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

export function kcal(n: number): string {
  return fmt(Math.round(n));
}
