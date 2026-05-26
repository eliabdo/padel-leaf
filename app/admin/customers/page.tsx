import Link from "next/link";
import { db, schema } from "@/lib/db";
import { sql, desc } from "drizzle-orm";
import { formatUsd } from "@/lib/pricing";
import { resolveCategory } from "@/lib/customer-categories";
import { resolveGender } from "@/lib/customer-genders";

export const metadata = { title: "Admin · Customers" };
export const dynamic = "force-dynamic";

type CustomerRow = {
  email: string;
  name: string;
  phone: string;
  total: number;
  lifetimeSpentCents: number;
  lastBookingAt: Date | null;
  isManual: boolean;
  categoryRaw: string | null;
  genderRaw: string | null;
};

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string; created?: string }>;
}) {
  const sp = await searchParams;

  // GROUP BY lower(customer_email) so a returning customer who once typed
  // "John@x.com" and another time "john@x.com" merges into ONE row with the
  // combined booking count, lifetime value, and latest visit date.
  const fromBookings = await db
    .select({
      email: sql<string>`lower(${schema.bookings.customerEmail})`,
      lastName: sql<string>`max(${schema.bookings.customerName})`,
      lastPhone: sql<string>`max(${schema.bookings.customerPhone})`,
      total: sql<number>`count(*)::int`,
      lifetimeSpentCents: sql<number>`coalesce(sum(case when ${schema.bookings.status} = 'completed' then ${schema.bookings.totalCents} else 0 end), 0)::int`,
      lastBookingAt: sql<Date>`max(${schema.bookings.startsAt})`,
    })
    .from(schema.bookings)
    .groupBy(sql`lower(${schema.bookings.customerEmail})`)
    .orderBy(desc(sql`max(${schema.bookings.startsAt})`));

  let customersByEmail = new Map<string, { source: string; category: string | null; gender: string | null }>();
  let manualOnly: { email: string; name: string; phone: string; category: string | null; gender: string | null; createdAt: Date }[] = [];
  let tableMissing = false;
  try {
    const allCustomers = await db
      .select({
        email: schema.customers.email,
        name: schema.customers.name,
        phone: schema.customers.phone,
        source: schema.customers.source,
        category: schema.customers.category,
        gender: schema.customers.gender,
        createdAt: schema.customers.createdAt,
      })
      .from(schema.customers)
      .orderBy(desc(schema.customers.createdAt));

    customersByEmail = new Map(
      allCustomers.map((c) => [c.email.toLowerCase(), { source: c.source, category: c.category, gender: c.gender }]),
    );
    manualOnly = allCustomers
      .filter((c) => c.source === "manual")
      .map((c) => ({
        email: c.email,
        name: c.name,
        phone: c.phone,
        category: c.category,
        gender: c.gender,
        createdAt: c.createdAt,
      }));
  } catch (e) {
    tableMissing = true;
    if (process.env.NODE_ENV !== "production") {
      console.warn("[customers] customers table missing — run `npm run db:push`", e);
    }
  }

  const bookingEmails = new Set(fromBookings.map((b) => b.email.toLowerCase()));
  const merged: CustomerRow[] = [
    ...fromBookings.map((b) => {
      const meta = customersByEmail.get(b.email.toLowerCase());
      return {
        email: b.email,
        name: b.lastName,
        phone: b.lastPhone,
        total: b.total,
        lifetimeSpentCents: b.lifetimeSpentCents,
        lastBookingAt: b.lastBookingAt,
        isManual: false,
        categoryRaw: meta?.category ?? null,
        genderRaw: meta?.gender ?? null,
      };
    }),
    ...manualOnly
      .filter((m) => !bookingEmails.has(m.email.toLowerCase()))
      .map((m) => ({
        email: m.email,
        name: m.name,
        phone: m.phone,
        total: 0,
        lifetimeSpentCents: 0,
        lastBookingAt: null as Date | null,
        isManual: true,
        categoryRaw: m.category,
        genderRaw: m.gender,
      })),
  ];

  return (
    <div style={{ maxWidth: 1360, margin: "0 auto", padding: "36px 28px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "#16a34a", marginBottom: 6, fontFamily: "system-ui, sans-serif" }}>Admin</div>
          <h1 style={{ fontFamily: "system-ui, sans-serif", fontSize: 26, fontWeight: 700, color: "#0d2010", margin: 0 }}>Customers</h1>
        </div>
        <Link
          href="/admin/customers/new"
          style={{
            fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 600,
            color: "#fff", background: "#16a34a", textDecoration: "none",
            padding: "10px 20px", borderRadius: 9,
            boxShadow: "0 2px 8px rgba(22,163,74,0.28)",
            display: "inline-flex", alignItems: "center", gap: 6,
          }}
        >
          + New customer
        </Link>
      </div>

      {tableMissing && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.25)", borderRadius: 10, padding: "12px 18px", marginBottom: 20, fontFamily: "system-ui, sans-serif" }}>
          <span style={{ fontSize: 14, lineHeight: 1.3 }}>ℹ️</span>
          <div style={{ fontSize: 13, color: "#b45309", lineHeight: 1.5 }}>
            <strong>Manual customers, categories &amp; genders disabled.</strong> Run <code style={{ background: "rgba(217,119,6,0.10)", padding: "1px 6px", borderRadius: 4, fontFamily: "ui-monospace, monospace", fontSize: 12 }}>npm run db:push</code> to enable. Booking customers below still work normally.
          </div>
        </div>
      )}

      {sp.updated === "1" && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.25)", borderRadius: 10, padding: "12px 18px", marginBottom: 20, fontFamily: "system-ui, sans-serif" }}>
          <span style={{ fontSize: 16 }}>✓</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#15803d" }}>Customer info updated successfully.</span>
        </div>
      )}

      {sp.created === "1" && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.25)", borderRadius: 10, padding: "12px 18px", marginBottom: 20, fontFamily: "system-ui, sans-serif" }}>
          <span style={{ fontSize: 16 }}>✓</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#15803d" }}>Customer added.</span>
        </div>
      )}

      <div style={{ background: "#fff", border: "1px solid rgba(22,163,74,0.12)", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 880 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(22,163,74,0.10)", background: "#fafdfb" }}>
                {["Name", "Category", "Gender", "Email", "Phone", "Bookings", "Lifetime value", "Last visit", ""].map((h, i) => (
                  <th key={i} style={{ padding: "11px 16px", textAlign: "left", fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9ca3af" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {merged.length === 0 && (
                <tr><td colSpan={9} style={{ padding: "52px 24px", textAlign: "center", color: "#9ca3af", fontFamily: "system-ui, sans-serif" }}>No customers yet.</td></tr>
              )}
              {merged.map((c, idx) => {
                const cat = resolveCategory(c.categoryRaw);
                const gen = resolveGender(c.genderRaw);
                return (
                  <tr key={c.email} style={{ borderTop: "1px solid rgba(22,163,74,0.07)", background: idx % 2 === 1 ? "rgba(22,163,74,0.015)" : "#fff" }}>
                    <td style={{ padding: "13px 16px", fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 600, color: "#111827" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        {c.name}
                        {c.isManual && (
                          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 999, background: "rgba(217,119,6,0.10)", color: "#b45309", border: "1px solid rgba(217,119,6,0.22)" }}>
                            Manual
                          </span>
                        )}
                      </span>
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      {cat ? (
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", padding: "2px 9px", borderRadius: 999, background: cat.bg, color: cat.text, border: `1px solid ${cat.border}`, fontFamily: "system-ui, sans-serif", whiteSpace: "nowrap" }}>
                          {cat.short}
                        </span>
                      ) : (
                        <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: "#d1d5db" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      {gen ? (
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", padding: "2px 9px", borderRadius: 999, background: gen.bg, color: gen.text, border: `1px solid ${gen.border}`, fontFamily: "system-ui, sans-serif", whiteSpace: "nowrap" }}>
                          {gen.label}
                        </span>
                      ) : (
                        <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: "#d1d5db" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "13px 16px", fontFamily: "system-ui, sans-serif", fontSize: 13, color: "#374151" }}>{c.email}</td>
                    <td style={{ padding: "13px 16px", fontFamily: "ui-monospace, 'SF Mono', monospace", fontSize: 12, color: "#374151" }}>{c.phone}</td>
                    <td style={{ padding: "13px 16px" }}>
                      <span style={{ fontFamily: "ui-monospace, 'SF Mono', monospace", fontSize: 14, fontWeight: 700, color: c.total > 0 ? "#16a34a" : "#9ca3af" }}>{c.total}</span>
                    </td>
                    <td style={{ padding: "13px 16px", fontFamily: "ui-monospace, 'SF Mono', monospace", fontSize: 13, fontWeight: 600, color: c.total > 0 ? "#111827" : "#9ca3af" }}>{formatUsd(c.lifetimeSpentCents)}</td>
                    <td style={{ padding: "13px 16px", fontFamily: "system-ui, sans-serif", fontSize: 13, color: "#6b7280" }}>
                      {c.lastBookingAt ? new Date(c.lastBookingAt).toLocaleDateString() : <span style={{ color: "#d1d5db" }}>—</span>}
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <Link href={`/admin/customers/${encodeURIComponent(c.email.toLowerCase())}`} className="admin-row-action" style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 600, color: "#16a34a", textDecoration: "none", display: "inline-block", padding: "5px 14px", borderRadius: 8, border: "1px solid rgba(22,163,74,0.30)", background: "rgba(22,163,74,0.06)", whiteSpace: "nowrap" }}>Manage →</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
