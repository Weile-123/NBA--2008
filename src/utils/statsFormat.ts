/**
 * Career-history saves have existed in both ratio (0.456) and percentage
 * (45.6) formats. Normalize both without changing the persisted save.
 */
export function normalizePercentage(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  return numeric <= 1 ? numeric * 100 : numeric;
}

export function formatPercentage(value: unknown): string {
  return `${normalizePercentage(value).toFixed(1)}%`;
}
