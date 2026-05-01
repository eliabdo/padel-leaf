import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { and, eq, gte, lt, gt } from "drizzle-orm";
import {
  generateSlotStarts,
  isPastNoticeWindow,
  parseDateKey,
  rangesOverlap,
  ALLOWED_DURATIONS,
} from "@/lib/booking";
import { asc } from "drizzle-orm";


const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dateKey = searchParams.get("date") ?? "";
  const durationStr = searchParams.get("duration") ?? "90";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400, headers: CORS });
  }
  const duration = Number(durationStr);
  if (!ALLOWED_DURATIONS.includes(duration as 60 | 90 | 120)) {
    return NextResponse.json({ error: "Invalid duration" }, { status: 400, headers: CORS });
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
    // Catch any block-out that overlaps the day (starts before day ends AND ends after day starts)
    db.select().from(schema.blockOuts).where(
      and(
        lt(schema.blockOuts.startsAt, dayEnd),
        gt(schema.blockOuts.endsAt,   dayStart),
      ),
    ),
  ]);

  const slotStarts = generateSlotStarts(dayStart, duration);

  const result = {
    courts: courts.map((court) => {
      const courtBookings  = bookings.filter((b) => b.courtId === court.id);
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

      // Court is fully blocked when every slot is unavailable due to a block-out
      const allBlocked = slots.length > 0 && slots.every((s) => !s.available && s.blocked);
      const blockOutReasons = [...new Set(courtBlockOuts.map((b) => b.reason))];

      return { id: court.id, name: court.name, slots, allBlocked, blockOutReasons };
    }),
  };

  return NextResponse.json(result, { headers: CORS });
}
