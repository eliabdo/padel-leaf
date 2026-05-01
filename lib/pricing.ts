/**
 * Shared pricing helpers safe for both client and server usage.
 */
export const FALLBACK_HOURLY_CENTS = 2000; // $20.00

export function priceForDuration(hourlyCents: number, durationMinutes: number): number {
  return Math.round((hourlyCents * durationMinutes) / 60);
}

export function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
