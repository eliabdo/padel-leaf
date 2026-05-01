/**
 * Server-only pricing access backed by the database.
 */
import { db, schema } from "./db";
import { eq } from "drizzle-orm";
import { FALLBACK_HOURLY_CENTS } from "./pricing";

export async function getActiveHourlyRateCents(): Promise<number> {
  const rows = await db
    .select()
    .from(schema.pricingRules)
    .where(eq(schema.pricingRules.active, true))
    .limit(1);

  return rows[0]?.hourlyRateCents ?? FALLBACK_HOURLY_CENTS;
}
