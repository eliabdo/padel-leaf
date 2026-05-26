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

/**
 * Lebanese pound conversion.
 *
 * Fixed rate of 89,500 LBP per 1 USD - matches the rate Eli quotes at the
 * venue. If the rate ever needs to change, update USD_TO_LBP_RATE here and
 * every revenue surface picks it up automatically.
 *
 * LBP is displayed as a whole number with thousands separators - fractional
 * LBP isn't meaningful in practice.
 */
export const USD_TO_LBP_RATE = 89_500;

export function centsToLbp(cents: number): number {
  return Math.round((cents / 100) * USD_TO_LBP_RATE);
}

export function formatLbp(cents: number): string {
  const lbp = centsToLbp(cents);
  return `${lbp.toLocaleString("en-US")} LBP`;
}
