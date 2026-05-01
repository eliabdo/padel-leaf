import { SiteNav } from "../components/site-nav";
import { SiteFooter } from "../components/site-footer";
import { SectionHeader } from "../components/section-header";

import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "About Padel Leaf",
  description: "Padel Leaf is an outdoor padel club in Mezher, Bsalim, Mount Lebanon. Three courts, a passionate community, and a focus on the game over everything else.",
  openGraph: {
    title: "About Padel Leaf · Our Story",
    description: "An outdoor padel club in Mezher, Bsalim built for players who take the game seriously.",
  },
};



export default function AboutPage() {
  return (
    <>
      <SiteNav />

      <header className="bg-forest text-cream py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-xs font-semibold tracking-[0.18em] uppercase text-sage mb-5">
            — The Club
          </div>
          <h1 className="text-5xl md:text-6xl mb-6">
            A club, not a <em className="italic font-medium text-sage">court rental.</em>
          </h1>
          <p className="text-lg text-cream/80 leading-relaxed max-w-2xl">
            Padel Leaf is a small outdoor club in Mezher, Bsalim. Three courts,
            run with care. We trust the reader to be smart, and we never shout
            to be heard.
          </p>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-6 py-20">
        <SectionHeader number="01" label="Why we built it" title="The booking should be the" italic="easiest part." />
        <p className="text-lg text-char-soft leading-relaxed mb-6">
          Most padel reservations feel like an obstacle. Phone calls, WhatsApp
          back-and-forth, double-bookings the moment you arrive. We started
          Padel Leaf because we wanted somewhere we&apos;d actually want to
          play — and a system that just works.
        </p>
        <p className="text-lg text-char-soft leading-relaxed">
          Pick a time, pick a court, show up, play. The fee is owed at the
          venue when you arrive. No pre-payment friction, no surprise
          cancellation fees, no upsells. If something goes wrong (rain, you
          name it), we&apos;ll handle it.
        </p>
      </section>

      <section className="bg-sage-soft py-20">
        <div className="max-w-4xl mx-auto px-6">
          <SectionHeader number="02" label="What we care about" title="Three things, in" italic="this order." />
          <div className="grid md:grid-cols-3 gap-8 mt-10">
            <Pillar n="i" title="The courts" body="Synthetic turf, well-maintained, lit for evening play. We brush the surfaces between sessions." />
            <Pillar n="ii" title="The people" body="Members, regulars, first-timers — everyone gets the same court time and the same welcome." />
            <Pillar n="iii" title="The booking" body="No queues, no gymnastics. Reserve in under a minute. The system handles the rest." />
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-20">
        <SectionHeader number="03" label="Where" title="Mezher, Bsalim," italic="Mount Lebanon." />
        <p className="text-lg text-char-soft leading-relaxed">
          We&apos;re a 5-minute drive from the Bsalim main road. Free parking,
          open daily from 7am to 11pm. The full address and a map live on our{" "}
          <a href="/find-us" className="text-forest underline underline-offset-4">find us page</a>.
        </p>
      </section>

      <SiteFooter />
    </>
  );
}

function Pillar({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div>
      <div className="font-serif italic text-3xl text-forest mb-3">{n}</div>
      <h3 className="font-serif text-xl text-forest-deep mb-2">{title}</h3>
      <p className="text-sm text-char-soft leading-relaxed">{body}</p>
    </div>
  );
}
