import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import {
  ALLOWED_DURATIONS,
  isPastNoticeWindow,
  rangesOverlap,
} from "@/lib/booking";
import { getActiveHourlyRateCents } from "@/lib/pricing-db";
import { priceForDuration } from "@/lib/pricing";


const Schema = z.object({
  courtId: z.number().int().positive(),
  startsAtIso: z.string().datetime(),
  durationMinutes: z.number().int().refine(
    (n) => (ALLOWED_DURATIONS as readonly number[]).includes(n),
    "Invalid duration",
  ),
  customerName:  z.string().min(1).max(120),
  customerEmail: z.string().email().max(200),
  customerPhone: z.string().min(4).max(40),
  paymentMethod: z.enum(["venue", "whish", "omt"]).default("venue"),
});


const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = Schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { courtId, startsAtIso, durationMinutes, customerName, customerEmail, customerPhone, paymentMethod } = parsed.data;
  const startsAt = new Date(startsAtIso);
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60 * 1000);

  if (isPastNoticeWindow(startsAt)) {
    return NextResponse.json(
      { error: "Bookings need at least 1 hour notice." },
      { status: 400 },
    );
  }

  // Confirm court exists
  const [court] = await db.select().from(schema.courts).where(eq(schema.courts.id, courtId));
  if (!court) {
    return NextResponse.json({ error: "Court not found" }, { status: 404 });
  }

  // Soft check for overlap (the DB EXCLUDE constraint is the source of truth)
  const sameDayBookings = await db
    .select()
    .from(schema.bookings)
    .where(and(eq(schema.bookings.courtId, courtId), eq(schema.bookings.status, "confirmed")));
  const conflict = sameDayBookings.some((b) =>
    rangesOverlap(startsAt, endsAt, new Date(b.startsAt), new Date(b.endsAt)),
  );
  if (conflict) {
    return NextResponse.json({ error: "That slot just got booked. Pick another." }, { status: 409 });
  }

  const blockOuts = await db
    .select()
    .from(schema.blockOuts)
    .where(eq(schema.blockOuts.courtId, courtId));
  const blocked = blockOuts.some((b) =>
    rangesOverlap(startsAt, endsAt, new Date(b.startsAt), new Date(b.endsAt)),
  );
  if (blocked) {
    return NextResponse.json({ error: "That court is unavailable for that time." }, { status: 409 });
  }

  const hourlyRateCents = await getActiveHourlyRateCents();
  const totalCents = priceForDuration(hourlyRateCents, durationMinutes);

  try {
    const [created] = await db
      .insert(schema.bookings)
      .values({
        courtId,
        customerName,
        customerEmail,
        customerPhone,
        startsAt,
        endsAt,
        durationMinutes,
        totalCents,
        status: "confirmed",
        paymentMethod,
      })
      .returning({ id: schema.bookings.id });

    return NextResponse.json({ id: created.id }, { status: 201, headers: CORS });
  } catch (err) {
    // The EXCLUDE constraint will throw on race-condition double-bookings
    if (err instanceof Error && /no_overlap/.test(err.message)) {
      return NextResponse.json(
        { error: "That slot just got booked. Pick another." },
        { status: 409, headers: CORS },
      );
    }
    console.error("Booking insert failed", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500, headers: CORS });
  }
}
