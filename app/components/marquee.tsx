/**
 * The editorial-style ticker that scrolls along the top of the home page.
 * Pure CSS animation, no JS dependency.
 */
const ITEMS = [
  "Reserve a court",
  "Three outdoor courts",
  "Open 7am — 11pm daily",
  "Pay at the venue",
  "Mezher · Bsalim",
];

export function Marquee() {
  // Repeat the list so the loop has no visible seam
  const doubled = [...ITEMS, ...ITEMS, ...ITEMS, ...ITEMS];

  return (
    <div className="bg-forest text-cream/85 overflow-hidden border-y border-forest-deep py-4">
      <div className="flex gap-12 animate-marquee whitespace-nowrap font-serif italic text-lg">
        {doubled.map((item, i) => (
          <div key={i} className="flex items-center gap-12 shrink-0">
            <span>{item}</span>
            <span className="text-sage">✦</span>
          </div>
        ))}
      </div>
    </div>
  );
}
