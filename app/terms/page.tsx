import { SiteNav } from "../components/site-nav";
import { SiteFooter } from "../components/site-footer";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <>
      <SiteNav />
      <article className="max-w-3xl mx-auto px-6 py-20 prose prose-lg">
        <h1 className="font-serif text-5xl text-forest-deep mb-2">Terms of Service</h1>
        <p className="text-char-soft text-sm mb-10">Last updated: {new Date().toLocaleDateString()}</p>

        <Section title="1. About">
          Padel Leaf operates an outdoor padel club at Mezher, Bsalim, Mount Lebanon.
          By making a booking on this website you agree to the terms below.
        </Section>

        <Section title="2. Bookings">
          When you book a court you agree to arrive on time and to play within the
          duration reserved. The court fee is due in cash or by card on arrival.
        </Section>

        <Section title="3. Cancellation policy">
          Cancellations more than 24 hours before the booking start are free.
          Same-day cancellations and no-shows owe the full court fee, payable
          on the next visit. We waive the fee for cancellations caused by rain
          or other club-side issues.
        </Section>

        <Section title="4. Conduct">
          We reserve the right to refuse service to anyone behaving in a way
          that endangers other players, staff, or the courts. Standard padel
          etiquette applies — respect the surface, your opponents, and the
          neighbours.
        </Section>

        <Section title="5. Liability">
          Play is at your own risk. Padel Leaf is not responsible for injuries
          sustained during play, lost or damaged personal items, or any
          consequences thereof. We recommend personal insurance for regular
          play.
        </Section>

        <Section title="6. Changes">
          We may update these terms; the effective date above will reflect the
          last change. Continued use of the site after a change constitutes
          acceptance.
        </Section>

        <Section title="7. Contact">
          Questions? Reach us via the <a href="/contact" className="text-forest underline">contact form</a> or WhatsApp.
        </Section>
      </article>
      <SiteFooter />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="font-serif text-2xl text-forest-deep mb-3">{title}</h2>
      <p className="text-charcoal leading-relaxed">{children}</p>
    </div>
  );
}
