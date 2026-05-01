import { NextRequest, NextResponse } from "next/server";
import ical from "ical-generator";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";


export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const bookingId = Number(id);
  if (!Number.isInteger(bookingId)) {
    return new NextResponse("Invalid id", { status: 400 });
  }

  const rows = await db
    .select({
      id: schema.bookings.id,
      customerName: schema.bookings.customerName,
      startsAt: schema.bookings.startsAt,
      endsAt: schema.bookings.endsAt,
      courtName: schema.courts.name,
    })
    .from(schema.bookings)
    .innerJoin(schema.courts, eq(schema.bookings.courtId, schema.courts.id))
    .where(eq(schema.bookings.id, bookingId));

  const booking = rows[0];
  if (!booking) return new NextResponse("Not found", { status: 404 });

  const cal = ical({ name: "Padel Leaf" });
  cal.createEvent({
    start: new Date(booking.startsAt),
    end: new Date(booking.endsAt),
    summary: `Padel Leaf · Court ${booking.courtName}`,
    description: `Reservation #${booking.id} for ${booking.customerName}. Pay at the venue on arrival.`,
    location: "Padel Leaf, Mezher, Bsalim, Mount Lebanon",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://padel-leaf.vercel.app",
  });

  return new NextResponse(cal.toString(), {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="padel-leaf-booking-${booking.id}.ics"`,
    },
  });
}
