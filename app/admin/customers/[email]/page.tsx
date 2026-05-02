import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { formatUsd } from "@/lib/pricing";
import { formatTime, formatDateLong } from "@/lib/booking";
import { PhoneInput } from "@/app/components/phone-input";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ email: string }> }) {
  const { email } = await params;
  return { title: `Admin · Customer · ${decodeURIComponent(email)}` };
}

// ── server action ─────────────────────────────────────────────────────────────
async function updateCustomer(formData: FormData): Promise<void> {
  "use server";
  const oldEmail   = String(formData.get("_oldEmail") ?? "").trim();
  const newName    = String(formData.get("customerName")  ?? "").trim();
  const newPhone   = String(formData.get("customerPhone") ?? "").trim();
  const newEmail   = String(formData.get("customerEmail") ?? "").trim().toLowerCase();

  if (!oldEmail || !newName || !newPhone || !newEmail) throw new Error("Missing fields");

  await db
    .update(schema.bookings)
    .set({ customerName: newName, customerPhone: newPhone, customerEmail: newEmail })
    .where(eq(schema.bookings.customerEmail, oldEmail));

  redirect(`/admin/customers?updated=1`);
}

// ── styles ────────────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  fontFamily: "system-ui, sans-serif", fontSize: 14, color: "#111827",
  background: "#fff", border: "1px solid rgba(22,163,74,0.22)",
  borderRadius: 9, padding: "11px 14px", outline: "none",
};
const labelStyle: React.CSSProperties = {
  display: "block", fontFamily: "system-ui, sans-serif", fontSize: 11,
  fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
  color: "#6b7280", marginBottom: 7,
};
const statusBadge = (s: string): React.CSSProperties => {
  if (s === "confirmed") return { background: "rgba(22,163,74,0.10)", color: "#15803d", border: "1px solid rgba(22,163,74,0.22)" };
  if (s === "completed") return { background: "rgba(37,99,235,0.09)", color: "#1d4ed8", border: "1px solid rgba(37,99,235,0.20)" };
  if (s === "cancelled") return { background: "rgba(220,38,38,0.09)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.20)" };
  if (s === "no_show")   return { background: "rgba(217,119,6,0.09)",  color: "#b45309", border: "1px solid rgba(217,119,6,0.22)" };
  return { background: "rgba(107,114,128,0.09)", color: "#6b7280", border: "1px solid rgba(107,114,128,0.18)" };
};
const courtColor: Record<string, { text: string; bg: string }> = {
  Laurel: { text: "#15803d", bg: "rgba(22,163,74,0.10)" },
  Oak:    { text: "#b45309", bg: "rgba(217,119,6,0.10)" },
  Olive:  { text: "#0369a1", bg: "rgba(3,105,161,0.10)" },
};

// ── page ──────────────────────────────────────────────────────────────────────
export default async function CustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ email: string }>;
  searchParams: Promise<{ updated?: string }>;
}) {
  const { email } = await params;
  const sp = await searchParams;
  const decodedEmail = decodeURIComponent(email);

  // All bookings for this customer
  const bookings = await db
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
    .where(eq(schema.bookings.customerEmail, decodedEmail))
    .orderBy(desc(schema.bookings.startsAt));

  if (bookings.length === 0) notFound();

  const latest = bookings[0];
  const completedCount = bookings.filter(b => b.status === "completed").length;
  const lifetimeCents  = bookings.filter(b => b.status === "completed").reduce((s, b) => s + b.totalCents, 0);
  const upcomingCount  = bookings.filter(b => b.status === "confirmed").length;

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "36px 28px", display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Back */}
      <Link href="/admin/customers" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 500, color: "#6b7280", textDecoration: "none" }}>
        ← Customers
      </Link>

      {/* Header */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "#16a34a", marginBottom: 6, fontFamily: "system-ui, sans-serif" }}>Customer</div>
        <h1 style={{ fontFamily: "system-ui, sans-serif", fontSize: 26, fontWeight: 700, color: "#0d2010", margin: 0 }}>{latest.customerName}</h1>
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, color: "#6b7280", marginTop: 4 }}>{decodedEmail}</div>
      </div>

      {/* Success banner */}
      {sp.updated === "1" && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.25)", borderRadius: 10, padding: "12px 18px" }}>
          <span style={{ fontSize: 16 }}>✓</span>
          <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 600, color: "#15803d" }}>Customer info updated across all bookings.</span>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[
          { label: "Total bookings",  value: String(bookings.length) },
          { label: "Completed",       value: String(completedCount) },
          { label: "Lifetime value",  value: formatUsd(lifetimeCents) },
        ].map(stat => (
          <div key={stat.label} style={{ background: "#fff", border: "1px solid rgba(22,163,74,0.12)", borderRadius: 12, padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "#9ca3af", marginBottom: 6 }}>{stat.label}</div>
            <div style={{ fontFamily: "ui-monospace, 'SF Mono', monospace", fontSize: 20, fontWeight: 700, color: "#0d2010" }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Edit form */}
      <form action={updateCustomer} style={{ background: "#fff", border: "1px solid rgba(22,163,74,0.12)", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)" }}>
        <input type="hidden" name="_oldEmail" value={decodedEmail} />
        <div style={{ padding: "16px 24px", background: "#fafdfb", borderBottom: "1px solid rgba(22,163,74,0.08)" }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, fontWeight: 700, color: "#0d2010" }}>Edit customer info</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: "#9ca3af", marginTop: 3 }}>Changes apply to all bookings for this customer.</div>
        </div>
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>Full name</label>
            <input name="customerName" type="text" required defaultValue={latest.customerName} style={inputStyle} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Phone</label>
              <PhoneInput name="customerPhone" required defaultValue={latest.customerPhone} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input name="customerEmail" type="email" required defaultValue={decodedEmail} style={inputStyle} />
            </div>
          </div>
          <div>
            <button type="submit" style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 600, color: "#fff", background: "#16a34a", border: "none", borderRadius: 9, padding: "11px 24px", cursor: "pointer", boxShadow: "0 2px 8px rgba(22,163,74,0.28)" }}>
              Save changes →
            </button>
          </div>
        </div>
      </form>

      {/* Booking history */}
      <div style={{ background: "#fff", border: "1px solid rgba(22,163,74,0.12)", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)" }}>
        <div style={{ padding: "14px 20px", background: "#fafdfb", borderBottom: "1px solid rgba(22,163,74,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, fontWeight: 700, color: "#0d2010" }}>Booking history</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: "#9ca3af" }}>{bookings.length} booking{bookings.length !== 1 ? "s" : ""} · {upcomingCount} upcoming</div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(22,163,74,0.08)", background: "#fafdfb" }}>
                {["#", "Date & time", "Court", "Total", "Status", ""].map((h, i) => (
                  <th key={i} style={{ padding: "9px 16px", textAlign: "left", fontFamily: "system-ui, sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#9ca3af" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map((b, idx) => {
                const s = new Date(b.startsAt);
                const e = new Date(b.endsAt);
                const cc = courtColor[b.courtName];
                return (
                  <tr key={b.id} style={{ borderTop: "1px solid rgba(22,163,74,0.07)", background: idx % 2 === 1 ? "rgba(22,163,74,0.015)" : "#fff" }}>
                    <td style={{ padding: "11px 16px", fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 12, fontWeight: 600, color: "#16a34a" }}>#{b.id}</td>
                    <td style={{ padding: "11px 16px" }}>
                      <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: "#111827", fontWeight: 500 }}>{formatDateLong(s)}</div>
                      <div style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{formatTime(s)} — {formatTime(e)}</div>
                    </td>
                    <td style={{ padding: "11px 16px" }}>
                      <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20, fontFamily: "system-ui, sans-serif", background: cc?.bg ?? "rgba(107,114,128,0.08)", color: cc?.text ?? "#6b7280" }}>{b.courtName}</span>
                    </td>
                    <td style={{ padding: "11px 16px", fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 13, fontWeight: 600, color: "#111827" }}>{formatUsd(b.totalCents)}</td>
                    <td style={{ padding: "11px 16px" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 20, fontFamily: "system-ui, sans-serif", ...statusBadge(b.status) }}>
                        {b.status === "no_show" ? "No-show" : b.status}
                      </span>
                    </td>
                    <td style={{ padding: "11px 16px" }}>
                      <Link href={`/admin/bookings/${b.id}`} style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 600, color: "#16a34a", textDecoration: "none", padding: "4px 12px", borderRadius: 8, border: "1px solid rgba(22,163,74,0.30)", background: "rgba(22,163,74,0.06)" }}>View →</Link>
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
