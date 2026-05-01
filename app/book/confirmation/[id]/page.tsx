import Link from "next/link";
import { notFound } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { SiteNav } from "@/app/components/site-nav";
import { SiteFooter } from "@/app/components/site-footer";
import { formatDateLong, formatTime } from "@/lib/booking";
import { formatUsd } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bookingId = Number(id);
  if (!Number.isInteger(bookingId)) notFound();

  const rows = await db
    .select({
      id: schema.bookings.id,
      customerName: schema.bookings.customerName,
      customerEmail: schema.bookings.customerEmail,
      startsAt: schema.bookings.startsAt,
      endsAt: schema.bookings.endsAt,
      durationMinutes: schema.bookings.durationMinutes,
      totalCents: schema.bookings.totalCents,
      status: schema.bookings.status,
      courtName: schema.courts.name,
    })
    .from(schema.bookings)
    .innerJoin(schema.courts, eq(schema.bookings.courtId, schema.courts.id))
    .where(eq(schema.bookings.id, bookingId));

  const booking = rows[0];
  if (!booking) notFound();

  const startsAt = new Date(booking.startsAt);
  const endsAt = new Date(booking.endsAt);

  return (
    <>
      <SiteNav />

      <section className="max-w-2xl mx-auto px-6 py-20">
        <div className="bg-sage-soft border border-sage rounded-2xl p-10 text-center mb-10">
          <div className="text-xs uppercase tracking-[0.18em] text-forest font-semibold mb-3">
            Confirmed
          </div>
          <h1 className="font-serif text-4xl text-forest-deep mb-3">
            See you at the courts.
          </h1>
          <p className="text-char-soft">
            Booking #{booking.id} · we&apos;ll see {booking.customerName.split(" ")[0]} at the venue.
          </p>
        </div>

        <div className="bg-cream border border-forest/15 rounded-2xl p-8 mb-8">
          <Row label="Court"        value={`Court · ${booking.courtName}`} />
          <Row label="Date"         value={formatDateLong(startsAt)} />
          <Row label="Time"         value={`${formatTime(startsAt)} — ${formatTime(endsAt)}`} />
          <Row label="Duration"     value={`${booking.durationMinutes} minutes`} />
          <Row label="Total (pay at venue)" value={formatUsd(booking.totalCents)} />
        </div>

        <div className="flex flex-wrap gap-3 justify-center mb-12">
          <a
            href={`/api/bookings/${booking.id}/ics`}
            className="btn btn-outline"
            download={`padel-leaf-booking-${booking.id}.ics`}
          >
            Add to calendar (.ics) →
          </a>
          <Link href="/book" className="btn btn-primary">
            Book another
          </Link>
        </div>

        <div className="text-sm text-char-soft text-center max-w-md mx-auto leading-relaxed">
          To cancel: just reply to this confirmation or message us on WhatsApp.
          Free up to 24 hours before. Same-day cancellations owe the full fee.
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-4 py-3 border-b border-forest/10 last:border-0">
      <div className="text-xs uppercase tracking-[0.18em] text-forest font-semibold">
        {label}
      </div>
      <div className="font-serif text-lg text-forest-deep text-right">
        {value}
      </div>
    </div>
  );
}
