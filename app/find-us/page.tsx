import { SiteNav } from "../components/site-nav";
import { SiteFooter } from "../components/site-footer";
import { SectionHeader } from "../components/section-header";

import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Find Us",
  description: "Directions to Padel Leaf in Mezher, Bsalim, Mount Lebanon. Easy access, free parking on site.",
  openGraph: {
    title: "Find Padel Leaf · Mezher, Bsalim",
    description: "Directions to Padel Leaf in Mezher, Bsalim. Easy access with free parking.",
  },
};



// Replace this with your real WhatsApp number when ready (international format, no +)
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "9610000000";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}`;

// Google Maps embed for Mezher, Bsalim — swap for your exact pin when you have one
const MAPS_EMBED =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3308.0!2d35.6!3d33.92!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sMezher%2C%20Bsalim!5e0!3m2!1sen!2slb!4v1700000000000!5m2!1sen!2slb";

export default function FindUsPage() {
  return (
    <>
      <SiteNav />

      <header className="bg-forest text-cream py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-xs font-semibold tracking-[0.18em] uppercase text-sage mb-5">
            — Find Us
          </div>
          <h1 className="text-5xl md:text-6xl mb-6">
            Mezher, Bsalim. <em className="italic font-medium text-sage">Five minutes off the main road.</em>
          </h1>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-[1fr_1.5fr] gap-12">
        <div>
          <SectionHeader number="01" label="Visit" title="Open daily." />

          <div className="space-y-6 text-lg">
            <Detail label="Address" value="Mezher, Bsalim, Mount Lebanon, Lebanon" />
            <Detail label="Hours"   value="7:00 — 23:00, every day" />
            <Detail label="Parking" value="Free, on-site" />
            <Detail label="Surface" value="Three outdoor courts, synthetic turf" />
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              WhatsApp us →
            </a>
            <a href="/contact" className="btn btn-outline">
              Contact form
            </a>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden border border-forest/15 shadow-lg">
          <iframe
            src={MAPS_EMBED}
            width="100%"
            height="500"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Padel Leaf · Mezher, Bsalim"
          />
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.18em] text-forest font-semibold mb-1">
        {label}
      </div>
      <div className="text-charcoal">{value}</div>
    </div>
  );
}
