import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
  await sql`
    TRUNCATE TABLE
      bookings,
      block_outs,
      customers,
      contact_messages,
      revenue_items
    RESTART IDENTITY CASCADE
  `;
  console.log("Truncated: bookings, block_outs, customers, contact_messages, revenue_items");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
