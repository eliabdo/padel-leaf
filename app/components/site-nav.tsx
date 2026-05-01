"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/courts",  label: "Courts" },
  { href: "/about",   label: "The Club" },
  { href: "/pricing", label: "Pricing" },
  { href: "/find-us", label: "Find us" },
  { href: "/contact", label: "Contact" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-cream/90 border-b border-forest/10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <Image
            src="/logo.jpg"
            alt="Padel Leaf"
            width={40}
            height={40}
            className="rounded-full border border-sage"
          />
          <span className="font-serif font-bold text-lg text-forest">Padel Leaf</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-charcoal">
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href} className="hover:text-forest transition">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link href="/book" className="btn btn-primary">
            Reserve a court →
          </Link>

          {/* Hamburger – mobile only */}
          <button
            className="md:hidden ml-1 p-2 rounded-lg text-forest hover:bg-forest/5 transition"
            onClick={() => setOpen(o => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-forest/10 bg-cream/98 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col">
            {NAV_LINKS.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-center text-charcoal hover:text-forest hover:bg-forest/5 rounded-xl px-3 py-3 text-base font-medium transition"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-3 pt-3 border-t border-forest/10">
              <Link
                href="/book"
                onClick={() => setOpen(false)}
                className="btn btn-primary w-full text-center justify-center"
              >
                Reserve a court →
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
