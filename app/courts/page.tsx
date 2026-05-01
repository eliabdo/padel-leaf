import Link from "next/link";
import { SiteNav } from "../components/site-nav";
import { SiteFooter } from "../components/site-footer";
import { SectionHeader } from "../components/section-header";

export const metadata = { title: "Our Courts" };

const COURTS = [
  {
    name: "Laurel",
    tag: "LAUREL",
    surface: "Synthetic turf",
    description:
      "Our flagship court. Slightly faster surface, favoured by competitive players. Closest to the entrance.",
  },
  {
    name: "Oak",
    tag: "OAK",
    surface: "Synthetic turf",
    description:
      "The all-rounder. The court most regulars default to — perfect for social games, league matches, and most lessons.",
  },
  {
    name: "Olive",
    tag: "OLIVE",
    surface: "Synthetic turf",
    description:
      "The quieter end of the venue. Easier on the knees, recommended for beginners, juniors, and longer sessions.",
  },
];

export default function CourtsPage() {
  return (
    <>
      <SiteNav />

      <header className="bg-forest text-cream py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-xs font-semibold tracking-[0.18em] uppercase text-sage mb-5">
            — The Courts
          </div>
          <h1 className="text-5xl md:text-6xl mb-6 max-w-3xl">
            Three courts, <em className="italic font-medium text-sage">named for the trees</em> that frame them.
          </h1>
          <p className="text-lg text-cream/80 max-w-xl">
            All three are full-size 10×20m, synthetic turf, with LED lighting
            for evening sessions and panoramic glass walls.
          </p>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-20">
        <SectionHeader number="01" label="The Lineup" title="Pick your court," italic="or rotate." />
        <div className="grid md:grid-cols-3 gap-6 mt-10">
          {COURTS.map((c) => (
            <CourtTile key={c.name} {...c} />
          ))}
        </div>

        <div className="mt-12">
          <Link href="/book" className="btn btn-primary">
            See live availability →
          </Link>
        </div>
      </section>

      <section className="bg-sage-soft py-20">
        <div className="max-w-4xl mx-auto px-6">
          <SectionHeader number="02" label="Specs" title="Same size," italic="same standards." />
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <SpecRow label="Court size"     value="10m × 20m (regulation)" />
            <SpecRow label="Surface"        value="Synthetic turf" />
            <SpecRow label="Walls"          value="Tempered glass + steel mesh" />
            <SpecRow label="Lighting"       value="LED, evening sessions" />
            <SpecRow label="Surface care"   value="Brushed between sessions" />
            <SpecRow label="Weather"        value="Rain cancellations refunded in full" />
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

function CourtTile({ name, tag, surface, description }: typeof COURTS[number]) {
  return (
    <div className="bg-cream rounded-2xl overflow-hidden border border-forest/10 hover:shadow-xl hover:-translate-y-1 transition-all">
      <div className="h-56 bg-gradient-to-br from-forest-mid to-forest flex items-center justify-center">
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
          <h3 className="font-serif text-2xl text-forest-deep">Court · {name}</h3>
          <span className="text-xs tracking-[0.18em] text-forest/60 font-semibold">{tag}</span>
        </div>
        <div className="text-xs uppercase tracking-wider text-forest mb-3">{surface}</div>
        <p className="text-sm text-char-soft leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-forest/15 py-3">
      <span className="text-char-soft text-sm">{label}</span>
      <span className="font-serif text-forest-deep">{value}</span>
    </div>
  );
}
