import { db, schema } from "@/lib/db";
import { asc } from "drizzle-orm";
import { SiteNav } from "../components/site-nav";
import { SiteFooter } from "../components/site-footer";
import { BookingFlow } from "./booking-flow";
import { getActiveHourlyRateCents } from "@/lib/pricing-db";

export const metadata = { title: "Reserve a court" };
export const dynamic = "force-dynamic";

export default async function BookPage() {
  const courts = await db
    .select()
    .from(schema.courts)
    .orderBy(asc(schema.courts.sortOrder));

  const hourlyRateCents = await getActiveHourlyRateCents();

  return (
    <>
      <SiteNav />

      <header className="bg-forest text-cream py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-xs font-semibold tracking-[0.18em] uppercase text-sage mb-4">
            — Reserve
          </div>
          <h1 className="text-4xl md:text-5xl mb-3">
            Pick a date, court, <em className="italic font-medium text-sage">and play.</em>
          </h1>
          <p className="text-cream/75 max-w-md">
            $20 / hour, paid at the venue. Cancel up to 24 hours before — free.
          </p>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-12">
        <BookingFlow courts={courts} hourlyRateCents={hourlyRateCents} />
      </section>

      <SiteFooter />
    </>
  );
}
