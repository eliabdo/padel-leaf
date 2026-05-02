import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { and, eq, lt } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/auto-complete
 *
 * Called by Vercel Cron every 5 minutes (see vercel.json).
 * Marks any "confirmed" booking whose endsAt is in the past as "completed".
 *
 * Protected by a CRON_SECRET env var — Vercel sends it automatically as
 *   Authorization: Bearer <CRON_SECRET>
 * If the secret is not set we allow the call (safe for local dev / preview).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();

  const result = await db
    .update(schema.bookings)
    .set({ status: "completed" })
    .where(
      and(
        eq(schema.bookings.status, "confirmed"),
        lt(schema.bookings.endsAt, now),
      ),
    );

  const count = result.rowCount ?? 0;
  console.log(`[auto-complete] ${count} booking(s) marked completed at ${now.toISOString()}`);

  return NextResponse.json({ ok: true, completed: count, at: now.toISOString() });
}
