import { db, schema } from "@/lib/db";
import { sql, desc } from "drizzle-orm";
import { formatUsd } from "@/lib/pricing";

export const metadata = { title: "Admin · Customers" };
export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const customers = await db
    .select({ email: schema.bookings.customerEmail, lastName: sql<string>`max(${schema.bookings.customerName})`, lastPhone: sql<string>`max(${schema.bookings.customerPhone})`, total: sql<number>`count(*)::int`, lifetimeSpentCents: sql<number>`coalesce(sum(case when ${schema.bookings.status} = 'completed' then ${schema.bookings.totalCents} else 0 end), 0)::int`, lastBookingAt: sql<Date>`max(${schema.bookings.startsAt})` })
    .from(schema.bookings).groupBy(schema.bookings.customerEmail).orderBy(desc(sql`max(${schema.bookings.startsAt})`));

  return (
    <div style={{ maxWidth: 1360, margin: "0 auto", padding: "36px 28px" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "#16a34a", marginBottom: 6, fontFamily: "system-ui, sans-serif" }}>Admin</div>
        <h1 style={{ fontFamily: "system-ui, sans-serif", fontSize: 26, fontWeight: 700, color: "#0d2010", margin: 0 }}>Customers</h1>
      </div>

      <div style={{ background: "#fff", border: "1px solid rgba(22,163,74,0.12)", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(22,163,74,0.10)", background: "#fafdfb" }}>
                {["Name", "Email", "Phone", "Bookings", "Lifetime value", "Last visit"].map((h, i) => (
                  <th key={i} style={{ padding: "11px 16px", textAlign: "left", fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9ca3af" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 && (
                <tr><td colSpan={6} style={{ padding: "52px 24px", textAlign: "center", color: "#9ca3af", fontFamily: "system-ui, sans-serif" }}>No customers yet.</td></tr>
              )}
              {customers.map((c, idx) => (
                <tr key={c.email} style={{ borderTop: "1px solid rgba(22,163,74,0.07)", background: idx % 2 === 1 ? "rgba(22,163,74,0.015)" : "#fff" }}>
                  <td style={{ padding: "13px 16px", fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 600, color: "#111827" }}>{c.lastName}</td>
                  <td style={{ padding: "13px 16px", fontFamily: "system-ui, sans-serif", fontSize: 13, color: "#374151" }}>{c.email}</td>
                  <td style={{ padding: "13px 16px", fontFamily: "ui-monospace, 'SF Mono', monospace", fontSize: 12, color: "#374151" }}>{c.lastPhone}</td>
                  <td style={{ padding: "13px 16px" }}>
                    <span style={{ fontFamily: "ui-monospace, 'SF Mono', monospace", fontSize: 14, fontWeight: 700, color: "#16a34a" }}>{c.total}</span>
                  </td>
                  <td style={{ padding: "13px 16px", fontFamily: "ui-monospace, 'SF Mono', monospace", fontSize: 13, fontWeight: 600, color: "#111827" }}>{formatUsd(c.lifetimeSpentCents)}</td>
                  <td style={{ padding: "13px 16px", fontFamily: "system-ui, sans-serif", fontSize: 13, color: "#6b7280" }}>{new Date(c.lastBookingAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
