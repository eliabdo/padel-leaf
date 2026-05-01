import Link from "next/link";
import BookingsSearch from "./bookings-search";
import { db, schema } from "@/lib/db";
import { eq, desc, ne, inArray } from "drizzle-orm";
import { formatTime, formatDateLong } from "@/lib/booking";
import { formatUsd } from "@/lib/pricing";

export const metadata = { title: "Admin · Bookings" };
export const dynamic = "force-dynamic";

const TABS = [
  { key: "all",       label: "All" },
  { key: "confirmed", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "no_show",   label: "No-show" },
] as const;
type TabKey = typeof TABS[number]["key"];

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
const tabAccent: Record<TabKey, string> = {
  all:       "#16a34a",
  confirmed: "#16a34a",
  completed: "#2563eb",
  cancelled: "#dc2626",
  no_show:   "#b45309",
};

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const sp        = await searchParams;
  const rawStatus = sp.status ?? "all";
  const searchQ   = (sp.q ?? "").trim().toLowerCase();
  const activeTab: TabKey = (TABS.some(t => t.key === rawStatus) ? rawStatus : "all") as TabKey;

  // Fetch all so we can show per-tab counts without extra queries
  const allRows = await db
    .select({
      id:            schema.bookings.id,
      customerName:  schema.bookings.customerName,
      customerEmail: schema.bookings.customerEmail,
      customerPhone: schema.bookings.customerPhone,
      startsAt:      schema.bookings.startsAt,
      endsAt:        schema.bookings.endsAt,
      totalCents:    schema.bookings.totalCents,
      status:        schema.bookings.status,
      paymentMethod: schema.bookings.paymentMethod,
      paymentReceivedAt: schema.bookings.paymentReceivedAt,
      courtName:     schema.courts.name,
    })
    .from(schema.bookings)
    .innerJoin(schema.courts, eq(schema.bookings.courtId, schema.courts.id))
    .orderBy(desc(schema.bookings.startsAt))
    .limit(500);

  const counts: Record<TabKey, number> = {
    all:       allRows.length,
    confirmed: allRows.filter(r => r.status === "confirmed").length,
    completed: allRows.filter(r => r.status === "completed").length,
    cancelled: allRows.filter(r => r.status === "cancelled").length,
    no_show:   allRows.filter(r => r.status === "no_show").length,
  };

  const byTab   = activeTab === "all" ? allRows : allRows.filter(r => r.status === activeTab);
  const rows = searchQ
    ? byTab.filter(r => r.customerName.toLowerCase().includes(searchQ))
    : byTab;

  const accent = tabAccent[activeTab];

  return (
    <div style={{ maxWidth: 1360, margin: "0 auto", padding: "36px 28px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "#16a34a", marginBottom: 6, fontFamily: "system-ui, sans-serif" }}>Admin</div>
          <h1 style={{ fontFamily: "system-ui, sans-serif", fontSize: 26, fontWeight: 700, color: "#0d2010", margin: 0 }}>Bookings</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <BookingsSearch status={activeTab} />
          <Link href="/admin/bookings/new" style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 600, color: "#fff", background: "#16a34a", borderRadius: 9, padding: "10px 22px", textDecoration: "none", boxShadow: "0 2px 8px rgba(22,163,74,0.30)" }}>
            + Add booking
          </Link>
        </div>
      </div>

      {/* Status tabs */}
      <div className="admin-tabs-bar" style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "nowrap", overflowX: "auto", paddingBottom: 2 }}>
        {TABS.map(({ key, label }) => {
          const isActive = key === activeTab;
          const color = tabAccent[key];
          return (
            <Link
              key={key}
              href={key === "all" ? "/admin/bookings" : `/admin/bookings?status=${key}`}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: isActive ? 700 : 500,
                textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0,
                padding: "8px 16px", borderRadius: 10,
                background: isActive ? `${color}18` : "#fff",
                color: isActive ? color : "#6b7280",
                border: `1px solid ${isActive ? `${color}44` : "rgba(22,163,74,0.12)"}`,
                boxShadow: isActive ? `0 1px 4px ${color}22` : "none",
                transition: "all 0.15s",
              }}
            >
              {label}
              <span style={{
                fontSize: 11, fontWeight: 700,
                padding: "1px 7px", borderRadius: 20,
                background: isActive ? `${color}22` : "rgba(107,114,128,0.10)",
                color: isActive ? color : "#9ca3af",
              }}>
                {counts[key]}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid rgba(22,163,74,0.12)", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(22,163,74,0.10)", background: "#fafdfb" }}>
                {["When", "Court", "Customer", "Contact", "Total", "Payment", "Status", ""].map((h, i) => (
                  <th key={i} style={{ padding: "11px 16px", textAlign: "left", fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9ca3af" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={8} style={{ padding: "52px 24px", textAlign: "center", color: "#9ca3af", fontFamily: "system-ui, sans-serif" }}>
                  No {activeTab === "all" ? "" : TABS.find(t => t.key === activeTab)?.label.toLowerCase() + " "}bookings yet.
                </td></tr>
              )}
              {rows.map((b, idx) => {
                const s = new Date(b.startsAt);
                const e = new Date(b.endsAt);
                const cc = courtColor[b.courtName];
                return (
                  <tr key={b.id} style={{ borderTop: "1px solid rgba(22,163,74,0.07)", background: idx % 2 === 1 ? "rgba(22,163,74,0.015)" : "#fff" }}>
                    <td style={{ padding: "13px 16px", verticalAlign: "top" }}>
                      <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: "#111827", fontWeight: 500 }}>{formatDateLong(s)}</div>
                      <div style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{formatTime(s)} — {formatTime(e)}</div>
                    </td>
                    <td style={{ padding: "13px 16px", verticalAlign: "top" }}>
                      <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20, fontFamily: "system-ui, sans-serif", background: cc?.bg ?? "rgba(107,114,128,0.08)", color: cc?.text ?? "#6b7280" }}>{b.courtName}</span>
                    </td>
                    <td style={{ padding: "13px 16px", fontFamily: "system-ui, sans-serif", fontSize: 13, color: "#111827", fontWeight: 500, verticalAlign: "top" }}>{b.customerName}</td>
                    <td style={{ padding: "13px 16px", verticalAlign: "top" }}>
                      <div style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 12, color: "#374151" }}>{b.customerPhone}</div>
                      <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{b.customerEmail}</div>
                    </td>
                    <td style={{ padding: "13px 16px", fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 13, fontWeight: 600, color: "#111827", verticalAlign: "top" }}>{formatUsd(b.totalCents)}</td>
                    <td style={{ padding: "13px 16px", verticalAlign: "top" }}>
                      {b.paymentMethod === "whish" ? (
                        <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                            <img src="/whish-icon.png" alt="Whish" style={{ width: 18, height: 18, borderRadius: "50%", objectFit: "cover" }} />
                            <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 600, color: "#e8192c" }}>Whish</span>
                          </span>
                          {b.paymentReceivedAt
                            ? <span style={{ fontSize: 10, fontWeight: 600, color: "#15803d", background: "rgba(22,163,74,0.10)", border: "1px solid rgba(22,163,74,0.22)", borderRadius: 10, padding: "1px 7px" }}>✓ Received</span>
                            : <span style={{ fontSize: 10, fontWeight: 600, color: "#b45309", background: "rgba(217,119,6,0.09)", border: "1px solid rgba(217,119,6,0.22)", borderRadius: 10, padding: "1px 7px" }}>⏳ Pending</span>
                          }
                        </div>
                      ) : b.paymentMethod === "omt" ? (
                        <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                            <img src="/omt-logo.svg" alt="OMT" style={{ height: 16, width: "auto" }} />
                            <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 600, color: "#92400e" }}>OMT Pay</span>
                          </span>
                          {b.paymentReceivedAt
                            ? <span style={{ fontSize: 10, fontWeight: 600, color: "#15803d", background: "rgba(22,163,74,0.10)", border: "1px solid rgba(22,163,74,0.22)", borderRadius: 10, padding: "1px 7px" }}>✓ Received</span>
                            : <span style={{ fontSize: 10, fontWeight: 600, color: "#b45309", background: "rgba(217,119,6,0.09)", border: "1px solid rgba(217,119,6,0.22)", borderRadius: 10, padding: "1px 7px" }}>⏳ Pending</span>
                          }
                        </div>
                      ) : (
                        <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: "#6b7280" }}>💵 Venue</span>
                      )}
                    </td>
                    <td style={{ padding: "13px 16px", verticalAlign: "top" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 20, fontFamily: "system-ui, sans-serif", ...statusBadge(b.status) }}>
                        {b.status === "no_show" ? "No-show" : b.status}
                      </span>
                    </td>
                    <td style={{ padding: "13px 16px", verticalAlign: "top" }}>
                      <Link href={`/admin/bookings/${b.id}`} style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 600, color: "#16a34a", textDecoration: "none", display: "inline-block", padding: "5px 14px", borderRadius: 8, border: "1px solid rgba(22,163,74,0.30)", background: "rgba(22,163,74,0.06)" }}>Manage →</Link>
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
