/**
 * Seeds the 3 courts and a default $20/hour pricing rule.
 * Idempotent — safe to run multiple times.
 *
 * Usage: npm run db:seed
 */
import "dotenv/config";
import { db, schema } from "../lib/db";
import { eq } from "drizzle-orm";

async function main() {
  const courts = [
    { name: "Laurel", surface: "Synthetic turf", description: "Our flagship court — slightly faster surface, favoured by competitive players.", sortOrder: 1 },
    { name: "Oak",    surface: "Synthetic turf", description: "The all-rounder. Perfect for regulars, social games, and most lessons.",      sortOrder: 2 },
    { name: "Olive",  surface: "Synthetic turf", description: "Easier on the knees. Recommended for beginners, juniors, and longer sessions.", sortOrder: 3 },
  ];

  for (const c of courts) {
    const existing = await db.select().from(schema.courts).where(eq(schema.courts.name, c.name));
    if (existing.length === 0) {
      await db.insert(schema.courts).values({ ...c, hasLights: true });
      console.log(`✓ inserted court ${c.name}`);
    } else {
      console.log(`· court ${c.name} already exists`);
    }
  }

  const existingRule = await db.select().from(schema.pricingRules).where(eq(schema.pricingRules.label, "Standard"));
  if (existingRule.length === 0) {
    await db.insert(schema.pricingRules).values({
      label: "Standard",
      hourlyRateCents: 2000, // $20/hr
      active: true,
    });
    console.log("✓ inserted pricing rule: Standard $20/hr");
  } else {
    console.log("· pricing rule already exists");
  }

  console.log("\nDone.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
