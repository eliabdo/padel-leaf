import { SiteNav } from "../components/site-nav";
import { SiteFooter } from "../components/site-footer";
import { SectionHeader } from "../components/section-header";
import { ContactForm } from "./contact-form";

import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Padelleaf. Reach us by phone, WhatsApp, or email. Located in Mezher, Mount Lebanon.",
  openGraph: {
    title: "Contact Padelleaf",
    description: "Reach us by phone, WhatsApp, or email. Located in Mezher, Mount Lebanon.",
  },
};



export default function ContactPage() {
  return (
    <>
      <SiteNav />

      <header className="bg-forest text-cream py-14 sm:py-20">
        <div className="max-w-4xl mx-auto px-5 sm:px-6">
          <div className="text-[11px] sm:text-xs font-semibold tracking-[0.18em] uppercase text-sage mb-4 sm:mb-5">
            — Contact
          </div>
          <h1 className="text-[2.25rem] sm:text-5xl md:text-6xl leading-[1.08] mb-5 sm:mb-6">
            Drop us a <em className="italic font-medium text-sage">note.</em>
          </h1>
          <p className="text-base sm:text-lg text-cream/80 max-w-xl">
            Questions, group bookings, lessons, or anything else. We read
            every message.
          </p>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-5 sm:px-6 py-12 sm:py-16">
        <SectionHeader number="01" label="Send a Message" title="Tell us what you need." />
        <ContactForm />
      </section>

      <SiteFooter />
    </>
  );
}
