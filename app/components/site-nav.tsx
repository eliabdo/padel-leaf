"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/courts",  label: "Courts" },
  { href: "/about",   label: "The Club" },
  { href: "/pricing", label: "Pricing" },
  { href: "/find-us", label: "Find us" },
  { href: "/contact", label: "Contact" },
];

export function SiteNav() {
  const [open, setOpen]         = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname                = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      className="sticky top-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(247,245,240,0.97)" : "rgba(247,245,240,0.88)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: scrolled
          ? "1px solid rgba(2,90,3,0.14)"
          : "1px solid rgba(2,90,3,0.07)",
        boxShadow: scrolled
          ? "0 4px 24px rgba(2,90,3,0.08), 0 1px 0 rgba(2,90,3,0.06)"
          : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group" onClick={() => setOpen(false)}>
          <div className="relative">
            <div
              className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ boxShadow: "0 0 0 3px rgba(22,163,74,0.25)" }}
            />
            <Image
              src="/logo.jpg"
              alt="Padel Leaf"
              width={40}
              height={40}
              className="rounded-full border border-sage/60 group-hover:border-forest/60 transition-colors duration-200"
            />
          </div>
          <span className="font-serif font-bold text-lg text-forest-deep group-hover:text-forest transition-colors duration-200">
            Padel Leaf
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="relative px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-150 group"
              style={{ color: isActive(l.href) ? "#166534" : "#374151" }}
            >
              <span
                className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                style={{ background: "rgba(22,163,74,0.07)" }}
              />
              <span className="relative">{l.label}</span>
              {isActive(l.href) ? (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-forest" />
              ) : (
                <span className="absolute bottom-0.5 left-3 right-3 h-px bg-forest/40 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
              )}
            </Link>
          ))}
        </div>

        {/* CTA + hamburger */}
        <div className="flex items-center gap-2">
          <Link href="/book" className="btn btn-primary hidden md:inline-flex relative overflow-hidden group">
            <span className="relative z-10">Reserve a court →</span>
            <span
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ background: "rgba(255,255,255,0.12)" }}
            />
          </Link>

          <Link href="/book" className="md:hidden btn btn-primary text-xs px-3 py-2" onClick={() => setOpen(false)}>
            Book
          </Link>

          <button
            className="md:hidden p-2 rounded-lg text-forest transition-colors duration-150"
            style={{ background: open ? "rgba(22,163,74,0.10)" : "transparent" }}
            onClick={() => setOpen(o => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            <span className="flex flex-col gap-1.5 w-5">
              <span
                className="block h-0.5 bg-forest rounded-full transition-all duration-250 origin-center"
                style={{ transform: open ? "translateY(8px) rotate(45deg)" : "none" }}
              />
              <span
                className="block h-0.5 bg-forest rounded-full transition-all duration-250"
                style={{ opacity: open ? 0 : 1, transform: open ? "scaleX(0)" : "scaleX(1)" }}
              />
              <span
                className="block h-0.5 bg-forest rounded-full transition-all duration-250 origin-center"
                style={{ transform: open ? "translateY(-8px) rotate(-45deg)" : "none" }}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile dropdown — animated slide */}
      <div
        className="md:hidden overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: open ? 400 : 0,
          opacity: open ? 1 : 0,
          borderTop: open ? "1px solid rgba(2,90,3,0.09)" : "none",
        }}
      >
        <div className="px-4 py-3 flex flex-col gap-0.5" style={{ background: "rgba(247,245,240,0.99)" }}>
          {NAV_LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition-colors duration-150"
              style={{
                color: isActive(l.href) ? "#166534" : "#374151",
                background: isActive(l.href) ? "rgba(22,163,74,0.07)" : "transparent",
              }}
            >
              {l.label}
              {isActive(l.href) && <span className="w-1.5 h-1.5 rounded-full bg-forest" />}
            </Link>
          ))}
          <div className="mt-2 pt-2" style={{ borderTop: "1px solid rgba(2,90,3,0.09)" }}>
            <Link href="/book" onClick={() => setOpen(false)} className="btn btn-primary w-full text-center justify-center">
              Reserve a court →
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
