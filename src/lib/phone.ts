/** Normalizes Tanzanian numbers (0712 345 678, 255712345678, +255 712 345 678) to +255XXXXXXXXX, or null. */
export function normalizeTzPhone(input: string): string | null {
  const digits = input.replace(/[\s\-().]/g, "");
  const m = digits.match(/^(?:\+?255|0)?([2-9]\d{8})$/);
  return m ? `+255${m[1]}` : null;
}
