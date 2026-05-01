import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { isNull } from "drizzle-orm";
import { getAdminSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session.valid) return NextResponse.json({ count: 0 });

  const rows = await db
    .select({ id: schema.bookings.id })
    .from(schema.bookings)
    .where(isNull(schema.bookings.readAt));

  return NextResponse.json({ count: rows.length });
}
