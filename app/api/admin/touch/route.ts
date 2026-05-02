import { NextResponse } from "next/server";
import { touchAdminSession } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/touch
 * Called by the client-side idle-guard every ~2 min to extend the session.
 * Returns 200 if session is still valid, 401 if it has already expired.
 */
export async function POST() {
  const ok = await touchAdminSession();
  if (!ok) {
    return NextResponse.json({ expired: true }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
