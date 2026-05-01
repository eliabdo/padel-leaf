import Link from "next/link";
import { db, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { formatTime, formatDateLong } from "@/lib/booking";
import { formatUsd } from "@/lib/pricing";

export const metadata = { title: "Admin · Bookings" };
export const dynamic = "force-dynamic";

const courtColor: Record<string, { text: string; bg: string }> = {
  Laurel: { text: "#15803d", bg: "rgba(22,163,74,0.10)" },
  Oak:    { text: "#b45309", bg: "rgba(217,119,6,0.10)" },
  Olive:  { text: "#0369a1", bg: "rgba(3,105,161,0.10)" },
};
const statusBadge = (s: string): React.CSSProperties => {
  if (s === "confirmed") return { background: "rgba(22,163,74,0.10)", color: "#15803d", border: "1px solid rgba(22,163,74,0.22)" };
  if (s === "completed") return { background: "rgba(37,99,235,0.09)", color: "#1d4ed8", border: "1px solid rgba(37,99,235,0.20)" };
  if (s === "cancelled") return { background: "rgba(220,38,38,0.09)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.20)" };
  if (s === "no_show")   return { background: "rgba(217,119,6,0.09)",  color: "#b45309", border: "1px solid rgba(217,119,6,0.22)" };
  return { background: "rgba(107,114,128,0.09)", color: "#6b7280", border: "1px solid rgba(107,114,128,0.18)" };
};

export default async function AdminBookingsPage() {
  const rows = await db
    .select({ id: schema.bookings.id, customerName: schema.bookings.customerName, customerEmail: schema.bookings.customerEmail, customerPhone: schema.bookings.customerPhone, startsAt: schema.bookings.startsAt, endsAt: schema.bookings.endsAt, totalCents: schema.bookings.totalCents, status: schema.bookings.status, courtName: schema.courts.name })
    .from(schema.bookings)
    .innerJoin(schema.courts, eq(schema.bookings.courtId, schema.courts.id))
    .orderBy(desc(schema.bookings.startsAt))
    .limit(200);

  return (
    <div style={{ maxWidth: 1360, margin: "0 auto", padding: "36px 28px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "#16a34a", marginBottom: 6, fontFamily: "system-ui, sans-serif" }}>Admin</div>
          <h1 style={{ fontFamily: "system-ui, sans-serif", fontSize: 26, fontWeight: 700, color: "#0d2010", margin: 0 }}>All Bookings</h1>
        </div>
        <Link href="/admin/bookings/new" style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 600, color: "#fff", background: "#16a34a", borderRadius: 9, padding: "10px 22px", textDecoration: "none", boxShadow: "0 2px 8px rgba(22,163,74,0.30)" }}>
          + Add booking
        </Link>
      </div>

      <div style={{ background: "#fff", border: "1px solid rgba(22,163,74,0.12)", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(22,163,74,0.10)", background: "#fafdfb" }}>
                {["When", "Court", "Customer", "Contact", "Total", "Status", ""].map((h, i) => (
                  <th key={i} style={{ padding: "11px 16px", textAlign: "left", fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9ca3af" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={7} style={{ padding: "52px 24px", textAlign: "center", color: "#9ca3af", fontFamily: "system-ui, sans-serif" }}>No bookings yet.</td></tr>
              )}
              {rows.map((b, idx) => {
                const s = new Date(b.startsAt); const e = new Date(b.endsAt);
                const cc = courtColor[b.courtName];
                return (
                  <tr key={b.id} style={{ borderTop: "1px solid rgba(22,163,74,0.07)", background: idx % 2 === 1 ? "rgba(22,163,74,0.015)" : "#fff" }}>
                    <td style={{ padding: "13px 16px", verticalAlign: "top" }}>
                      <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: "#111827", fontWeight: 500 }}>{formatDateLong(s)}</div>
                      <div style={{ fontFamily: "ui-monospace, 'SF Mono', monospace", fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{formatTime(s)} — {formatTime(e)}</div>
                    </td>
                    <td style={{ padding: "13px 16px", verticalAlign: "top" }}>
                      <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20, fontFamily: "system-ui, sans-serif", background: cc?.bg ?? "rgba(107,114,128,0.08)", color: cc?.text ?? "#6b7280" }}>{b.courtName}</span>
                    </td>
                    <td style={{ padding: "13px 16px", fontFamily: "system-ui, sans-serif", fontSize: 13, color: "#111827", fontWeight: 500, verticalAlign: "top" }}>{b.customerName}</td>
                    <td style={{ padding: "13px 16px", verticalAlign: "top" }}>
                      <div style={{ fontFamily: "ui-monospace, 'SF Mono', monospace", fontSize: 12, color: "#374151" }}>{b.customerPhone}</div>
                      <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{b.customerEmail}</div>
                    </td>
                    <td style={{ padding: "13px 16px", fontFamily: "ui-monospace, 'SF Mono', monospace", fontSize: 13, fontWeight: 600, color: "#111827", verticalAlign: "top" }}>{formatUsd(b.totalCents)}</td>
                    <td style={{ padding: "13px 16px", verticalAlign: "top" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 20, fontFamily: "system-ui, sans-serif", ...statusBadge(b.status) }}>{b.status === "no_show" ? "No-show" : b.status}</span>
                    </td>
                    <td style={{ padding: "13px 16px", verticalAlign: "top" }}>
                      <Link href={`/admin/bookings/${b.id}`} style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 500, color: "#16a34a", textDecoration: "none" }}>Manage →</Link>
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
