import Link from "next/link";
import { SiteNav } from "../components/site-nav";
import { SiteFooter } from "../components/site-footer";
import { SectionHeader } from "../components/section-header";

export const metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <>
      <SiteNav />

      <header className="bg-forest text-cream py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-xs font-semibold tracking-[0.18em] uppercase text-sage mb-5">
            — Pricing
          </div>
          <h1 className="text-5xl md:text-6xl mb-6">
            One rate. <em className="italic font-medium text-sage">Pay at the venue.</em>
          </h1>
          <p className="text-lg text-cream/80 max-w-xl">
            Twenty dollars per hour, any court, any time. No peak surcharges,
            no hidden fees, no member tiers to figure out.
          </p>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-6 py-20">
        <SectionHeader number="01" label="Court Rates" title="Pick your duration." />

        <div className="bg-sage-soft rounded-2xl p-10 mt-8">
          <div className="space-y-1">
            <PriceRow duration="60 minutes"  price="$20.00" />
            <PriceRow duration="90 minutes"  price="$30.00" />
            <PriceRow duration="120 minutes" price="$40.00" />
          </div>
          <p className="text-sm text-char-soft mt-8">
            Rate is <strong>$20/hour</strong>, billed proportionally. Same rate
            for all three courts and any time of day.
          </p>
        </div>

        <div className="mt-10 flex gap-3 flex-wrap">
          <Link href="/book" className="btn btn-primary">
            Reserve a court →
          </Link>
        </div>
      </section>

      <section className="bg-cream-deep py-20">
        <div className="max-w-4xl mx-auto px-6">
          <SectionHeader number="02" label="Cancellation Policy" title="Plans change." italic="We get it." />

          <div className="space-y-4 mt-8 text-lg text-char-soft leading-relaxed">
            <p>
              <strong className="text-forest-deep">More than 24 hours ahead:</strong> cancel
              freely, no questions asked. The slot opens back up for someone else.
            </p>
            <p>
              <strong className="text-forest-deep">Same-day cancellations or no-shows:</strong> the
              full court fee is owed at your next visit. Same-day cancels are
              hard for us to refill — please give us as much notice as you can.
            </p>
            <p>
              <strong className="text-forest-deep">Rain or court issues on our end:</strong> no
              charge, period. We&apos;ll either reschedule you or wipe the
              booking — your call.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-20">
        <SectionHeader number="03" label="Payment" title="At the venue, on arrival." />
        <p className="text-lg text-char-soft leading-relaxed">
          We accept cash and card at reception when you arrive for your
          session. Online payment is coming in a future update — for now, the
          booking holds the slot, the payment happens when you walk in.
        </p>
      </section>

      <SiteFooter />
    </>
  );
}

function PriceRow({ duration, price }: { duration: string; price: string }) {
  return (
    <div className="flex items-baseline justify-between py-4 border-b border-forest/15 last:border-0">
      <div className="text-charcoal text-lg">{duration}</div>
      <div className="font-serif text-2xl text-forest-deep">{price}</div>
    </div>
  );
}
