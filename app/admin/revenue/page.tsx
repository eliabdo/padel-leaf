import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq, desc, and, gte, lt, isNull } from "drizzle-orm";
import { formatUsd } from "@/lib/pricing";
import { formatDateLong, formatTime, parseDateKey, dateOnlyKey } from "@/lib/booking";
import Link from "next/link";

export const metadata = { title: "Admin · Revenue" };
export const dynamic = "force-dynamic";

async function addRevenueItem(formData: FormData): Promise<void> {
  "use server";
  const label     = String(formData.get("label")  ?? "").trim();
  const amountStr = String(formData.get("amount") ?? "");
  const notes     = String(formData.get("notes")  ?? "").trim() || null;
  const date      = String(formData.get("_date")  ?? "");
  if (!label || !amountStr) throw new Error("Missing fields");
  const amountCents = Math.round(parseFloat(amountStr) * 100);
  if (isNaN(amountCents) || amountCents <= 0) throw new Error("Invalid amount");
  await db.insert(schema.revenueItems).values({ label, amountCents, notes });
  redirect(date ? `/admin/revenue?date=${date}` : "/admin/revenue");
}

async function deleteRevenueItem(formData: FormData): Promise<void> {
  "use server";
  const id   = Number(formData.get("id"));
  const date = String(formData.get("_date") ?? "");
  if (!id) return;
  await db.delete(schema.revenueItems).where(eq(schema.revenueItems.id, id));
  redirect(date ? `/admin/revenue?date=${date}` : "/admin/revenue");
}

function dayLabel(dateKey: string, todayKey: string): string {
  const now       = new Date();
  const yest      = new Date(now); yest.setDate(now.getDate() - 1);
  const yesterKey = yest.toISOString().slice(0, 10);
  if (dateKey === todayKey)  return "Today";
  if (dateKey === yesterKey) return "Yesterday";
  const d = new Date(dateKey + "T12:00:00Z");
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
}

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  fontFamily: "system-ui, sans-serif", fontSize: 14, color: "#111827",
  background: "#fff", border: "1px solid rgba(22,163,74,0.22)",
  borderRadius: 9, padding: "10px 14px", outline: "none",
};
const labelStyle: React.CSSProperties = {
  display: "block", fontFamily: "system-ui, sans-serif", fontSize: 11,
  fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
  color: "#6b7280", marginBottom: 7,
};
const thStyle: React.CSSProperties = {
  padding: "9px 16px", textAlign: "left",
  fontFamily: "system-ui, sans-serif", fontSize: 11,
  fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9ca3af",
};
const tdStyle: React.CSSProperties = {
  padding: "12px 16px", fontFamily: "system-ui, sans-serif", fontSize: 13,
  color: "#111827", verticalAlign: "top",
};

export default async function AdminRevenuePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const sp       = await searchParams;
  const now      = new Date();
  const todayKey = dateOnlyKey(now);
  const viewKey  = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : todayKey;
  const isToday  = viewKey === todayKey;
  const dayStart = parseDateKey(viewKey);
  const dayEnd   = new Date(dayStart.getTime() + 86400000);
  const prevKey  = dateOnlyKey(new Date(dayStart.getTime() - 86400000));
  const nextKey  = dateOnlyKey(new Date(dayStart.getTime() + 86400000));

  const [completedBookings, manualItems] = await Promise.all([
    db.select({
      id:           schema.bookings.id,
      customerName: schema.bookings.customerName,
      startsAt:     schema.bookings.startsAt,
      endsAt:       schema.bookings.endsAt,
      totalCents:   schema.bookings.totalCents,
      courtName:    schema.courts.name,
    })
      .from(schema.bookings)
      .innerJoin(schema.courts, eq(schema.bookings.courtId, schema.courts.id))
      .where(and(
        eq(schema.bookings.status, "completed"),
        gte(schema.bookings.startsAt, dayStart),
        lt(schema.bookings.startsAt, dayEnd),
      ))
      .orderBy(desc(schema.bookings.startsAt)),
    db.select()
      .from(schema.revenueItems)
      .where(and(
        gte(schema.revenueItems.createdAt, dayStart),
        lt(schema.revenueItems.createdAt, dayEnd),
      ))
      .orderBy(desc(schema.revenueItems.createdAt)),
  ]);

  const bookingTotal = completedBookings.reduce((s, b) => s + b.totalCents, 0);
  const manualTotal  = manualItems.reduce((s, i) => s + i.amountCents, 0);
  const dayTotal     = bookingTotal + manualTotal;

  const navBtn = (disabled: boolean): React.CSSProperties => ({
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 32, height: 32, borderRadius: 8, textDecoration: "none",
    fontWeight: 700, fontSize: 16, background: "#fff",
    border: `1px solid ${disabled ? "rgba(22,163,74,0.08)" : "rgba(22,163,74,0.20)"}`,
    color: disabled ? "#d1d5db" : "#16a34a",
    pointerEvents: disabled ? "none" : "auto",
  } as React.CSSProperties);

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "36px 28px", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "#16a34a", marginBottom: 6 }}>Finance</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href={`/admin/revenue?date=${prevKey}`} style={navBtn(false)}>‹</Link>
            <h1 style={{ fontFamily: "system-ui, sans-serif", fontSize: 26, fontWeight: 700, color: "#0d2010", margin: 0 }}>
              {dayLabel(viewKey, todayKey)}
            </h1>
            <Link href={isToday ? "#" : `/admin/revenue?date=${nextKey}`} style={navBtn(isToday)}>›</Link>
          </div>
        </div>
        {/* Day total */}
        <div style={{ background: "rgba(22,163,74,0.07)", border: "1px solid rgba(22,163,74,0.18)", borderRadius: 12, padding: "16px 24px", textAlign: "right" }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b7280", marginBottom: 6 }}>Day total</div>
          <div style={{ fontFamily: "ui-monospace, 'SF Mono', monospace", fontSize: 28, fontWeight: 700, color: "#0d2010" }}>{formatUsd(dayTotal)}</div>
          {manualTotal > 0 && (
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
              {formatUsd(bookingTotal)} bookings · {formatUsd(manualTotal)} other
            </div>
          )}
        </div>
      </div>

      {/* Completed bookings */}
      <div style={{ background: "#fff", border: "1px solid rgba(22,163,74,0.12)", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)" }}>
        <div style={{ padding: "14px 20px", background: "#fafdfb", borderBottom: "1px solid rgba(22,163,74,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, fontWeight: 700, color: "#0d2010" }}>Completed bookings</div>
          <div style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 13, fontWeight: 700, color: "#16a34a" }}>{formatUsd(bookingTotal)}</div>
        </div>
        {completedBookings.length === 0 ? (
          <div style={{ padding: "36px 24px", textAlign: "center", color: "#9ca3af", fontFamily: "system-ui, sans-serif", fontSize: 13 }}>No completed bookings on {dayLabel(viewKey, todayKey).toLowerCase()}.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(22,163,74,0.08)", background: "#fafdfb" }}>
                {["#", "Customer", "Court", "Time", "Amount"].map((h, i) => (
                  <th key={i} style={{ ...thStyle, textAlign: i === 4 ? "right" : "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {completedBookings.map((b, idx) => (
                <tr key={b.id} style={{ borderTop: "1px solid rgba(22,163,74,0.07)", background: idx % 2 === 1 ? "rgba(22,163,74,0.013)" : "#fff" }}>
                  <td style={{ ...tdStyle }}>
                    <Link href={`/admin/bookings/${b.id}`} style={{ color: "#16a34a", textDecoration: "none", fontWeight: 600, fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 12 }}>#{b.id}</Link>
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 500 }}>{b.customerName}</td>
                  <td style={{ ...tdStyle, color: "#6b7280" }}>{b.courtName}</td>
                  <td style={{ ...tdStyle, fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 12, color: "#9ca3af" }}>
                    {formatTime(new Date(b.startsAt))} — {formatTime(new Date(b.endsAt))}
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right", fontFamily: "ui-monospace,'SF Mono',monospace", fontWeight: 700 }}>{formatUsd(b.totalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Manual items */}
      <div style={{ background: "#fff", border: "1px solid rgba(22,163,74,0.12)", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)" }}>
        <div style={{ padding: "14px 20px", background: "#fafdfb", borderBottom: "1px solid rgba(22,163,74,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, fontWeight: 700, color: "#0d2010" }}>Other revenue</div>
          <div style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 13, fontWeight: 700, color: "#0891b2" }}>{formatUsd(manualTotal)}</div>
        </div>
        {manualItems.length === 0 ? (
          <div style={{ padding: "28px 24px", textAlign: "center", color: "#9ca3af", fontFamily: "system-ui, sans-serif", fontSize: 13 }}>No manual items — add one below.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(22,163,74,0.08)", background: "#fafdfb" }}>
                {["Item", "Notes", "Amount", ""].map((h, i) => (
                  <th key={i} style={{ ...thStyle, textAlign: i === 2 ? "right" : "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {manualItems.map((item, idx) => (
                <tr key={item.id} style={{ borderTop: "1px solid rgba(22,163,74,0.07)", background: idx % 2 === 1 ? "rgba(22,163,74,0.013)" : "#fff" }}>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{item.label}</td>
                  <td style={{ ...tdStyle, color: "#6b7280" }}>{item.notes ?? "—"}</td>
                  <td style={{ ...tdStyle, textAlign: "right", fontFamily: "ui-monospace,'SF Mono',monospace", fontWeight: 700 }}>{formatUsd(item.amountCents)}</td>
                  <td style={{ ...tdStyle }}>
                    <form action={deleteRevenueItem}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="_date" value={viewKey} />
                      <button type="submit" style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 500, color: "#dc2626", background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.22)", borderRadius: 7, padding: "3px 10px", cursor: "pointer" }}>Remove</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add item form */}
      <form action={addRevenueItem} style={{ background: "#fff", border: "1px solid rgba(22,163,74,0.12)", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)" }}>
        <div style={{ padding: "14px 20px", background: "#fafdfb", borderBottom: "1px solid rgba(22,163,74,0.08)" }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, fontWeight: 700, color: "#0d2010" }}>Add item</div>
        </div>
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <input type="hidden" name="_date" value={viewKey} />
          <div className="admin-form-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
            <div>
              <label style={labelStyle}>Item description</label>
              <input name="label" type="text" required placeholder="e.g. Equipment rental, Lesson fee…" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Amount ($)</label>
              <input name="amount" type="number" required min="0.01" step="0.01" placeholder="0.00" style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Notes (optional)</label>
            <input name="notes" type="text" placeholder="Any extra context…" style={inputStyle} />
          </div>
          <div>
            <button type="submit" style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 600, color: "#fff", background: "#16a34a", border: "none", borderRadius: 9, padding: "10px 22px", cursor: "pointer", boxShadow: "0 2px 8px rgba(22,163,74,0.28)" }}>
              + Add item
            </button>
          </div>
        </div>
      </form>

    </div>
  );
}
