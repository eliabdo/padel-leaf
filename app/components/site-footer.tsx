import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-forest-deep text-cream/80 mt-auto">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 pt-14 sm:pt-20 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 md:gap-12 pb-10 sm:pb-12 border-b border-sage/15">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <Image
                src="/logo2.png"
                alt="Padelleaf"
                width={48}
                height={48}
                className="rounded-full border border-sage"
              />
              <span className="font-serif font-bold text-xl text-cream">
                Padelleaf
              </span>
            </div>
            <p className="text-sm leading-relaxed text-cream/65 max-w-xs">
              Three outdoor padel courts in Mezher, Bsalim. Built around three
              things: great courts, great people, and a booking experience
              that doesn&apos;t make you want to throw your phone.
            </p>
          </div>

          <div>
            <h4 className="text-sage uppercase text-xs font-semibold tracking-[0.18em] mb-5">
              Visit
            </h4>
            <ul className="space-y-2 text-sm">
              <li>Padelleaf Club</li>
              <li>Mezher, Bsalim</li>
              <li>Mount Lebanon</li>
              <li>Open daily, 8am — midnight</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sage uppercase text-xs font-semibold tracking-[0.18em] mb-5">
              Play
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/book"    className="hover:text-sage transition">Reserve a court</Link></li>
              <li><Link href="/courts"  className="hover:text-sage transition">Our courts</Link></li>
              <li><Link href="/pricing" className="hover:text-sage transition">Pricing</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sage uppercase text-xs font-semibold tracking-[0.18em] mb-5">
              Club
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about"   className="hover:text-sage transition">About</Link></li>
              <li><Link href="/find-us" className="hover:text-sage transition">Find us</Link></li>
              <li><Link href="/contact" className="hover:text-sage transition">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-3 sm:gap-4 text-xs text-cream/50">
          <div>© {new Date().getFullYear()} Padelleaf Club · See you at the courts.</div>
          <div className="flex gap-4">
            <Link href="/terms"   className="hover:text-sage transition">Terms</Link>
            <Link href="/privacy" className="hover:text-sage transition">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
