import Image from "next/image";
import Link from "next/link";

export function SiteNav() {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-cream/90 border-b border-forest/10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.jpg"
            alt="Padel Leaf"
            width={40}
            height={40}
            className="rounded-full border border-sage"
          />
          <span className="font-serif font-bold text-lg text-forest">
            Padel Leaf
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-charcoal">
          <Link href="/courts"   className="hover:text-forest transition">Courts</Link>
          <Link href="/about"    className="hover:text-forest transition">The Club</Link>
          <Link href="/pricing"  className="hover:text-forest transition">Pricing</Link>
          <Link href="/find-us"  className="hover:text-forest transition">Find us</Link>
          <Link href="/contact"  className="hover:text-forest transition">Contact</Link>
        </div>

        <Link href="/book" className="btn btn-primary">
          Reserve a court →
        </Link>
      </div>
    </nav>
  );
}
