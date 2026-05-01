import { SiteNav } from "../components/site-nav";
import { SiteFooter } from "../components/site-footer";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <>
      <SiteNav />
      <article className="max-w-3xl mx-auto px-6 py-20 prose prose-lg">
        <h1 className="font-serif text-5xl text-forest-deep mb-2">Privacy Policy</h1>
        <p className="text-char-soft text-sm mb-10">Last updated: {new Date().toLocaleDateString()}</p>

        <Section title="1. What we collect">
          When you book a court we collect your name, email, and phone number.
          When you submit the contact form we collect what you choose to share.
          We collect basic, anonymous traffic data (page views, referrers).
        </Section>

        <Section title="2. Why we collect it">
          To confirm your booking, contact you about it if needed (e.g. a rain
          cancellation), and to keep an internal record of who has played at
          the club. We do not sell or share your information with third
          parties.
        </Section>

        <Section title="3. How long we keep it">
          Bookings are kept for as long as the club operates, for accounting
          and history purposes. You may request deletion of your personal
          information at any time via the contact form.
        </Section>

        <Section title="4. Cookies">
          We use a single session cookie for staff sign-in to the admin area.
          Public pages do not set tracking cookies.
        </Section>

        <Section title="5. Contact">
          For privacy questions or deletion requests, use the <a href="/contact" className="text-forest underline">contact form</a>.
        </Section>
      </article>
      <SiteFooter />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="font-serif text-2xl text-forest-deep mb-3">{title}</h2>
      <p className="text-charcoal leading-relaxed">{children}</p>
    </div>
  );
}
