/**
 * Pricing helpers — v1 is a flat $20/hour, but reads from DB so the
 * admin can change it without code, and so v2 can layer peak/off-peak rules
 * without refactoring.
 */
import { db, schema } from "./db";
import { eq } from "drizzle-orm";

export const FALLBACK_HOURLY_CENTS = 2000; // $20.00

export async function getActiveHourlyRateCents(): Promise<number> {
  const rows = await db
    .select()
    .from(schema.pricingRules)
    .where(eq(schema.pricingRules.active, true))
    .limit(1);
  return rows[0]?.hourlyRateCents ?? FALLBACK_HOURLY_CENTS;
}

export function priceForDuration(hourlyCents: number, durationMinutes: number): number {
  return Math.round((hourlyCents * durationMinutes) / 60);
}

export function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
