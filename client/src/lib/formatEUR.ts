/**
 * Format a price stored in cents (e.g. 150 → €1.50)
 * All monetary values in the database are stored as cents (integer).
 */
export function formatEUR(cents: number | string | null | undefined): string {
  if (cents == null || cents === '') return '€0.00';
  const value = Number(cents);
  if (isNaN(value)) return '€0.00';
  return `€${(value / 100).toFixed(2)}`;
}
