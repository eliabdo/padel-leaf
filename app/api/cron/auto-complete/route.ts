import { NextResponse } from "next/server";
import { sweepPastConfirmedBookings } from "@/lib/auto-complete";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/auto-complete
 *
 * Called by Vercel Cron every 5 minutes (see vercel.json).
 * Delegates to lib/auto-complete which is shared with the admin layout's
 * inline sweep, so logic stays in one place.
 *
 * Protected by CRON_SECRET - Vercel Cron sends it as
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

  const result = await sweepPastConfirmedBookings();
  return NextResponse.json({ ok: true, ...result });
}
