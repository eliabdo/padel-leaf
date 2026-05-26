// Auto-complete sweep — used by:
//   - GET /api/cron/auto-complete (Vercel Cron, every 5 min in production)
//   - app/admin/layout.tsx (throttled inline sweep so admin pages always
//     show fresh statuses in dev/preview where cron may not run)
//
// A booking is "completed" once its endsAt is in the past, as long as it
// hadn't already been cancelled or marked no-show.

import { db, schema } from "@/lib/db";
import { and, eq, lt } from "drizzle-orm";

export type SweepResult = {
  completed: number;
  at: string;
};

/**
 * One-shot sweep — always hits the DB. Use this from the cron endpoint.
 */
export async function sweepPastConfirmedBookings(): Promise<SweepResult> {
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

  const completed = result.rowCount ?? 0;
  if (completed > 0) {
    console.log(`[auto-complete] ${completed} booking(s) → completed @ ${now.toISOString()}`);
  }
  return { completed, at: now.toISOString() };
}

// ── Throttled in-process variant ──────────────────────────────────────────
// Keeps a module-level timestamp so we don't run the UPDATE on every single
// admin page render. Module state is per server instance, which is fine: in
// the worst case (cold start every request, edge runtime, etc.) we just run
// the sweep more often than 5 min. The UPDATE is idempotent and cheap.
const THROTTLE_MS = 60_000; // run at most once per 60 seconds
let lastRunAt = 0;
let inflight: Promise<SweepResult | null> | null = null;

export async function sweepIfDue(): Promise<SweepResult | null> {
  const now = Date.now();
  if (now - lastRunAt < THROTTLE_MS) return null;

  // Coalesce concurrent admin requests into one sweep.
  if (inflight) return inflight;

  lastRunAt = now;
  inflight = sweepPastConfirmedBookings()
    .catch((e) => {
      console.warn("[auto-complete] sweepIfDue failed:", e);
      return null;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}
