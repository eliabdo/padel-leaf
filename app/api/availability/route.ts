import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { and, eq, gte, lt } from "drizzle-orm";
import {
  generateSlotStarts,
  isPastNoticeWindow,
  parseDateKey,
  rangesOverlap,
  ALLOWED_DURATIONS,
} from "@/lib/booking";
import { asc } from "drizzle-orm";

// #region agent log
fetch("http://127.0.0.1:7589/ingest/dca80672-932e-4ef8-bfcb-5f2627301044",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"e69d34"},body:JSON.stringify({sessionId:"e69d34",runId:"prebuild-sweep-1",hypothesisId:"H3",location:"app/api/availability/route.ts:13",message:"availability route module loaded",data:{hasDatabaseUrl:Boolean(process.env.DATABASE_URL)},timestamp:Date.now()})}).catch(()=>{});
// #endregion

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dateKey = searchParams.get("date") ?? "";
  const durationStr = searchParams.get("duration") ?? "90";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  const duration = Number(durationStr);
  if (!ALLOWED_DURATIONS.includes(duration as 60 | 90 | 120)) {
    return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
  }

  const dayStart = parseDateKey(dateKey);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayStart.getDate() + 1);

  const [courts, bookings, blockOuts] = await Promise.all([
    db.select().from(schema.courts).orderBy(asc(schema.courts.sortOrder)),
    db.select().from(schema.bookings).where(
      and(
        gte(schema.bookings.startsAt, dayStart),
        lt(schema.bookings.startsAt, dayEnd),
        eq(schema.bookings.status, "confirmed"),
      ),
    ),
    db.select().from(schema.blockOuts).where(
      and(
        gte(schema.blockOuts.startsAt, dayStart),
        lt(schema.blockOuts.startsAt, dayEnd),
      ),
    ),
  ]);

  const slotStarts = generateSlotStarts(dayStart, duration);

  const result = {
    courts: courts.map((court) => {
      const courtBookings = bookings.filter((b) => b.courtId === court.id);
      const courtBlockOuts = blockOuts.filter((b) => b.courtId === court.id);

      const slots = slotStarts.map((startsAt) => {
        const endsAt = new Date(startsAt.getTime() + duration * 60 * 1000);

        const overlapsBooking = courtBookings.some((b) =>
          rangesOverlap(startsAt, endsAt, new Date(b.startsAt), new Date(b.endsAt)),
        );
        const overlapsBlock = courtBlockOuts.some((b) =>
          rangesOverlap(startsAt, endsAt, new Date(b.startsAt), new Date(b.endsAt)),
        );
        const tooSoon = isPastNoticeWindow(startsAt);

        return {
          startIso: startsAt.toISOString(),
          available: !overlapsBooking && !overlapsBlock && !tooSoon,
          blocked: overlapsBlock,
        };
      });

      return { id: court.id, name: court.name, slots };
    }),
  };

  return NextResponse.json(result);
}
