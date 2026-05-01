import { db, schema } from "@/lib/db";
import { asc, and, lt, gt } from "drizzle-orm";
import { SiteNav } from "../components/site-nav";
import { SiteFooter } from "../components/site-footer";
import { BookingFlow } from "./booking-flow";
import { getActiveHourlyRateCents } from "@/lib/pricing-db";
import {
  next14Days,
  dateOnlyKey,
  generateSlotStarts,
  rangesOverlap,
} from "@/lib/booking";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reserve a Court",
  description: "Book an outdoor padel court in Mezher, Bsalim online. Choose your date, court, and duration — pay at the venue. 3 courts, 30-min slots, easy cancellation.",
  openGraph: {
    title: "Reserve a Padel Court · Padel Leaf",
    description: "Book online in seconds. Three outdoor courts in Mezher, Bsalim — pay at the venue.",
  },
};

export const dynamic = "force-dynamic";

export default async function BookPage() {
  const courts = await db
    .select()
    .from(schema.courts)
    .orderBy(asc(schema.courts.sortOrder));

  const hourlyRateCents = await getActiveHourlyRateCents();

  // ── Compute which of the next 14 days are fully blocked ──────────────────
  const dates    = next14Days();
  const rangeStart = dates[0];
  const rangeEnd   = new Date(dates[dates.length - 1]);
  rangeEnd.setDate(rangeEnd.getDate() + 1);

  const blockOuts = await db
    .select()
    .from(schema.blockOuts)
    .where(and(lt(schema.blockOuts.startsAt, rangeEnd), gt(schema.blockOuts.endsAt, rangeStart)));

  const blockedDates: string[] = [];
  for (const date of dates) {
    const dayStart = date;
    const dayEnd   = new Date(date);
    dayEnd.setDate(dayEnd.getDate() + 1);

    // Use 60-min slots — if all are blocked on every court, the day is blocked
    const slots = generateSlotStarts(dayStart, 60);

    const allCourtsBlocked = courts.length > 0 && courts.every((court) => {
      const courtBOs = blockOuts.filter(
        (bo) =>
          bo.courtId === court.id &&
          new Date(bo.startsAt) < dayEnd &&
          new Date(bo.endsAt)   > dayStart,
      );
      if (courtBOs.length === 0) return false;
      return slots.every((slotStart) => {
        const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);
        return courtBOs.some((bo) =>
          rangesOverlap(slotStart, slotEnd, new Date(bo.startsAt), new Date(bo.endsAt)),
        );
      });
    });

    if (allCourtsBlocked) blockedDates.push(dateOnlyKey(date));
  }

  return (
    <>
      <SiteNav />

      <header className="bg-forest text-cream py-10 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-xs font-semibold tracking-[0.18em] uppercase text-sage mb-4">
            — Reserve
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl mb-3">
            Pick a date, court, <em className="italic font-medium text-sage">and play.</em>
          </h1>
          <p className="text-cream/75 max-w-md">
            $20 / hour, paid at the venue. Cancel up to 24 hours before — free.
          </p>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <BookingFlow
          courts={courts}
          hourlyRateCents={hourlyRateCents}
          blockedDates={blockedDates}
        />
      </section>

      <SiteFooter />
    </>
  );
}
