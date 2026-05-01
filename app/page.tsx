import Image from "next/image";
import Link from "next/link";
import { SiteNav } from "./components/site-nav";
import { SiteFooter } from "./components/site-footer";
import { Marquee } from "./components/marquee";
import { SectionHeader } from "./components/section-header";

export default function Home() {
  return (
    <>
      <SiteNav />

      {/* HERO ─────────────────────────────────── */}
      <header className="bg-forest text-cream relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{
            background:
              "radial-gradient(circle at 80% 20%, rgba(181,230,189,0.18), transparent 50%), radial-gradient(circle at 10% 90%, rgba(181,230,189,0.10), transparent 40%)",
          }}
        />
        <div className="max-w-7xl mx-auto px-6 py-28 md:py-36 grid md:grid-cols-[1.2fr_1fr] gap-16 items-center relative">
          <div>
            <div className="text-xs font-semibold tracking-[0.18em] uppercase text-sage pb-5">
              — Est. Padel Leaf · Mezher · Bsalim
            </div>
            <h1 className="text-5xl md:text-7xl leading-[1.05] mb-6">
              Outdoor padel,<br />
              <em className="italic font-medium text-sage">played right.</em>
            </h1>
            <p className="text-lg leading-relaxed text-cream/80 max-w-md mb-9">
              Three premium outdoor courts in the heart of Bsalim. Reserve by the
              hour, pay at the venue, and play the way it should be.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/book"  className="btn btn-primary bg-cream text-forest hover:bg-sage">
                Reserve a court →
              </Link>
              <Link href="/about" className="btn btn-ghost">
                Discover the club
              </Link>
            </div>
          </div>

          <div className="relative max-w-md mx-auto md:ml-auto w-full">
            <div className="aspect-square rounded-full overflow-hidden shadow-2xl ring-1 ring-sage/30">
              <Image
                src="/logo.jpg"
                alt="Padel Leaf crest"
                width={460}
                height={460}
                className="object-cover w-full h-full"
                priority
              />
            </div>
            <div className="absolute -inset-6 rounded-full border border-dashed border-sage/35 pointer-events-none" />
            <div className="absolute -inset-12 rounded-full border border-dashed border-sage/15 pointer-events-none" />
          </div>
        </div>
      </header>

      {/* MARQUEE ──────────────────────────────── */}
      <Marquee />

      {/* STATS STRIP ─────────────────────────── */}
      <section className="bg-cream-deep border-b border-forest/10">
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          <Stat label="Courts"   value="3 · outdoor" />
          <Stat label="Open"     value="7am — 11pm" />
          <Stat label="Surface"  value="Synthetic turf" />
          <Stat label="Rate"     value="$20 / hour" />
        </div>
      </section>

      {/* SECTION 01 — THE CLUB ───────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <SectionHeader number="01" label="The Club" title="A club, not a" italic="court rental." />
        <p className="max-w-2xl text-lg text-char-soft leading-relaxed">
          Padel Leaf is built around three things: great courts, great people,
          and a booking experience that doesn&apos;t make you want to throw your
          phone. We trust the reader to be smart, and we never shout to be heard.
        </p>
        <Link href="/about" className="inline-block mt-6 text-forest font-medium underline underline-offset-4 decoration-forest/40 hover:decoration-forest">
          Read our principles →
        </Link>
      </section>

      {/* SECTION 02 — THE COURTS ─────────────── */}
      <section className="bg-sage-soft">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <SectionHeader number="02" label="The Courts" title="Three courts," italic="named for the trees." />
          <div className="grid md:grid-cols-3 gap-6 mt-10">
            <CourtCard name="Laurel" tag="LAUREL" desc="Our flagship — slightly faster surface, favoured by competitive players." />
            <CourtCard name="Oak"    tag="OAK"    desc="The all-rounder. Perfect for regulars, social games, and most lessons." />
            <CourtCard name="Olive"  tag="OLIVE"  desc="Easier on the knees. Recommended for beginners, juniors, and longer sessions." />
          </div>
          <Link href="/book" className="inline-block mt-10 text-forest font-medium underline underline-offset-4 decoration-forest/40 hover:decoration-forest">
            See live availability →
          </Link>
        </div>
      </section>

      {/* SECTION 03 — RESERVE ────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <SectionHeader number="03" label="Reserve" title="Reserve a court in" italic="under a minute." />
        <p className="max-w-2xl text-lg text-char-soft leading-relaxed">
          Pick a time, pick a court, play. No upsells, no pop-ups, no asking
          how the booking went.
        </p>

        <div className="mt-10 max-w-2xl">
          <PriceRow label="60 minutes"  price="$20.00" />
          <PriceRow label="90 minutes"  price="$30.00" />
          <PriceRow label="120 minutes" price="$40.00" />
        </div>

        <div className="mt-10 flex gap-3 flex-wrap">
          <Link href="/book"    className="btn btn-primary">Reserve a court →</Link>
          <Link href="/pricing" className="btn btn-outline">See pricing</Link>
        </div>
      </section>

      {/* CTA BAND ────────────────────────────── */}
      <section className="bg-forest text-cream">
        <div className="max-w-7xl mx-auto px-6 py-28 text-center">
          <h2 className="text-5xl md:text-6xl mb-6">
            See you <em className="italic font-medium text-sage">at the courts.</em>
          </h2>
          <p className="text-cream/75 text-lg max-w-md mx-auto mb-9">
            Mezher · Bsalim · Mount Lebanon. Open daily 7am — 11pm.
          </p>
          <Link href="/book" className="btn btn-primary bg-cream text-forest hover:bg-sage">
            Reserve a court →
          </Link>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold tracking-[0.18em] uppercase text-char-soft mb-2">
        {label}
      </div>
      <div className="font-serif text-2xl md:text-3xl text-forest-deep">
        {value}
      </div>
    </div>
  );
}

function CourtCard({ name, tag, desc }: { name: string; tag: string; desc: string }) {
  return (
    <div className="bg-cream rounded-2xl overflow-hidden border border-forest/10 hover:shadow-xl hover:-translate-y-1 transition-all">
      <div className="h-44 bg-gradient-to-br from-forest-mid to-forest flex items-center justify-center">
        <svg viewBox="0 0 200 100" className="w-3/4 h-auto" fill="none">
          <rect x="10" y="10" width="180" height="80" stroke="#B5E6BD" strokeWidth="2" />
          <line x1="100" y1="10" x2="100" y2="90" stroke="#B5E6BD" strokeWidth="1.5" />
          <line x1="10"  y1="50" x2="60"  y2="50" stroke="#B5E6BD" strokeWidth="1" />
          <line x1="140" y1="50" x2="190" y2="50" stroke="#B5E6BD" strokeWidth="1" />
          <line x1="60"  y1="10" x2="60"  y2="90" stroke="#B5E6BD" strokeWidth="1" strokeDasharray="3,3" />
          <line x1="140" y1="10" x2="140" y2="90" stroke="#B5E6BD" strokeWidth="1" strokeDasharray="3,3" />
        </svg>
      </div>
      <div className="p-6">
        <div className="flex items-baseline justify-between mb-2">
          <h3 className="font-serif text-xl text-forest-deep">Court · {name}</h3>
          <span className="text-xs tracking-[0.18em] text-forest/60 font-semibold">{tag}</span>
        </div>
        <p className="text-sm text-char-soft leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function PriceRow({ label, price }: { label: string; price: string }) {
  return (
    <div className="flex items-baseline justify-between py-4 border-b border-forest/10">
      <div className="text-char-soft">{label}</div>
      <div className="font-serif text-xl text-forest-deep">{price}</div>
    </div>
  );
}
