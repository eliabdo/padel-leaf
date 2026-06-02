import Link from "next/link";
import { notFound } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { SiteNav } from "@/app/components/site-nav";
import { SiteFooter } from "@/app/components/site-footer";
import { formatDateLong, formatTime } from "@/lib/booking";
import { formatUsd } from "@/lib/pricing";
import {
  PAYMENT_PHONE,
  PAY_FULL_LABEL,
  requiresPrepayment,
  type PaymentMethod,
} from "@/lib/payment-info";

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
      paymentMethod: schema.bookings.paymentMethod,
      courtName: schema.courts.name,
    })
    .from(schema.bookings)
    .innerJoin(schema.courts, eq(schema.bookings.courtId, schema.courts.id))
    .where(eq(schema.bookings.id, bookingId));

  const booking = rows[0];
  if (!booking) notFound();

  const startsAt = new Date(booking.startsAt);
  const endsAt = new Date(booking.endsAt);
  const paymentMethod = (booking.paymentMethod ?? "venue") as PaymentMethod;
  const needsPrepayment = requiresPrepayment(paymentMethod);

  return (
    <>
      <SiteNav />

      <section className="max-w-2xl mx-auto px-5 sm:px-6 py-12 sm:py-20">
        <div className="bg-sage-soft border border-sage rounded-2xl p-6 sm:p-10 text-center mb-7 sm:mb-10">
          <div className="text-[11px] sm:text-xs uppercase tracking-[0.18em] text-forest font-semibold mb-3">
            Confirmed
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl text-forest-deep mb-3">
            See you at the courts.
          </h1>
          <p className="text-sm sm:text-base text-char-soft">
            Booking #{booking.id} · we&apos;ll see {booking.customerName.split(" ")[0]} at the venue.
          </p>
        </div>

        {needsPrepayment && (
          <div className="bg-[#fffbeb] border-[1.5px] border-[#fcd34d] rounded-2xl p-5 sm:p-7 mb-7 sm:mb-8">
            <div className="text-[11px] sm:text-xs uppercase tracking-[0.10em] text-[#b45309] font-bold mb-3">
              Action required · {PAY_FULL_LABEL[paymentMethod]} payment
            </div>
            <p className="text-sm sm:text-base text-char-soft mb-4 leading-relaxed">
              Send <strong className="text-forest-deep">{formatUsd(booking.totalCents)}</strong> via{" "}
              <strong className="text-forest-deep">{PAY_FULL_LABEL[paymentMethod]}</strong> to:
            </p>
            <a
              href={`tel:${PAYMENT_PHONE.replace(/\s+/g, "")}`}
              className="block bg-white border border-[#fcd34d] rounded-xl py-3 sm:py-4 px-4 text-center font-mono text-xl sm:text-2xl font-bold text-forest-deep tracking-wide active:bg-[#fffbeb] transition-colors"
            >
              {PAYMENT_PHONE}
            </a>
            <p className="text-xs sm:text-sm text-char-soft mt-4 leading-relaxed">
              Please send before your booking time. Reply to the confirmation email with a screenshot of the transfer so we can confirm your slot.
            </p>
          </div>
        )}

        <div className="bg-cream border border-forest/15 rounded-2xl p-5 sm:p-8 mb-7 sm:mb-8">
          <Row label="Court"    value={`Court · ${booking.courtName}`} />
          <Row label="Date"     value={formatDateLong(startsAt)} />
          <Row label="Time"     value={`${formatTime(startsAt)} — ${formatTime(endsAt)}`} />
          <Row label="Duration" value={`${booking.durationMinutes} minutes`} />
          <Row
            label={needsPrepayment ? "Total" : "Total (pay at venue)"}
            value={formatUsd(booking.totalCents)}
          />
          <Row label="Payment" value={PAY_FULL_LABEL[paymentMethod]} />
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:justify-center mb-10 sm:mb-12">
          <a
            href={`/api/bookings/${booking.id}/ics`}
            className="btn btn-outline w-full sm:w-auto justify-center"
            download={`padel-leaf-booking-${booking.id}.ics`}
          >
            Add to calendar (.ics) →
          </a>
          <Link href="/book" className="btn btn-primary w-full sm:w-auto justify-center">
            Book another
          </Link>
        </div>

        <div className="text-xs sm:text-sm text-char-soft text-center max-w-md mx-auto leading-relaxed">
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
    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between gap-1 sm:gap-4 py-3 border-b border-forest/10 last:border-0">
      <div className="text-[11px] sm:text-xs uppercase tracking-[0.18em] text-forest font-semibold">
        {label}
      </div>
      <div className="font-serif text-base sm:text-lg text-forest-deep sm:text-right">
        {value}
      </div>
    </div>
  );
}
