import { redirect } from "next/navigation";
import { asc, and, eq, lt, gt } from "drizzle-orm";
import Link from "next/link";
import { db, schema } from "@/lib/db";
import { ALLOWED_DURATIONS } from "@/lib/booking";
import { getActiveHourlyRateCents } from "@/lib/pricing-db";
import { priceForDuration } from "@/lib/pricing";

export const metadata = { title: "Admin · Add booking" };
export const dynamic = "force-dynamic";

async function createManualBooking(formData: FormData): Promise<void> {
  "use server";
  const courtId = Number(formData.get("courtId"));
  const startsAtStr = String(formData.get("startsAt") ?? "");
  const durationMinutes = Number(formData.get("durationMinutes"));
  const customerName  = String(formData.get("customerName")  ?? "").trim();
  const customerEmail = String(formData.get("customerEmail") ?? "").trim();
  const customerPhone = String(formData.get("customerPhone") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!courtId || !startsAtStr || !durationMinutes || !customerName || !customerPhone || !customerEmail)
    throw new Error("Missing fields");
  if (!(ALLOWED_DURATIONS as readonly number[]).includes(durationMinutes))
    throw new Error("Invalid duration");

  const startsAt = new Date(startsAtStr);
  const endsAt   = new Date(startsAt.getTime() + durationMinutes * 60 * 1000);

  const overlaps = await db.select({ id: schema.bookings.id }).from(schema.bookings)
    .where(and(eq(schema.bookings.courtId, courtId), eq(schema.bookings.status, "confirmed"), lt(schema.bookings.startsAt, endsAt), gt(schema.bookings.endsAt, startsAt))).limit(1);

  if (overlaps.length > 0)
    redirect(`/admin/bookings/new?error=overlap&courtId=${courtId}&startsAt=${encodeURIComponent(startsAtStr)}&duration=${durationMinutes}`);

  const hourlyRateCents = await getActiveHourlyRateCents();
  const totalCents = priceForDuration(hourlyRateCents, durationMinutes);
  await db.insert(schema.bookings).values({ courtId, customerName, customerEmail, customerPhone, startsAt, endsAt, durationMinutes, totalCents, status: "confirmed", notes });
  redirect("/admin");
}

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  fontFamily: "system-ui, sans-serif", fontSize: 14, color: "#111827",
  background: "#fff", border: "1px solid rgba(22,163,74,0.22)",
  borderRadius: 9, padding: "11px 14px", outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
};
const labelStyle: React.CSSProperties = {
  display: "block", fontFamily: "system-ui, sans-serif", fontSize: 11,
  fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
  color: "#6b7280", marginBottom: 7,
};

export default async function AdminNewBookingPage({
  searchParams,
}: { searchParams: Promise<{ error?: string; courtId?: string; startsAt?: string; duration?: string }> }) {
  const courts = await db.select().from(schema.courts).orderBy(asc(schema.courts.sortOrder));
  const params = await searchParams;
  const hasOverlap = params.error === "overlap";

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "36px 28px" }}>
      <Link href="/admin/bookings" style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 500, color: "#16a34a", textDecoration: "none" }}>← Bookings</Link>

      <div style={{ margin: "16px 0 28px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "#16a34a", marginBottom: 6, fontFamily: "system-ui, sans-serif" }}>New</div>
        <h1 style={{ fontFamily: "system-ui, sans-serif", fontSize: 26, fontWeight: 700, color: "#0d2010", margin: 0 }}>Add a booking</h1>
      </div>

      {/* Overlap alert */}
      {hasOverlap && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.25)", borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
          <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.2 }}>⚠️</span>
          <div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 700, color: "#dc2626", marginBottom: 4 }}>Booking overlap</div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: "#991b1b", lineHeight: 1.6 }}>That court already has a confirmed booking in this time slot. Choose a different time or court.</div>
          </div>
        </div>
      )}

      <form action={createManualBooking} style={{ background: "#fff", border: `1px solid ${hasOverlap ? "rgba(220,38,38,0.30)" : "rgba(22,163,74,0.12)"}`, borderRadius: 14, padding: "32px 28px", display: "flex", flexDirection: "column", gap: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)" }}>

        <div><label style={labelStyle}>Customer name</label><input name="customerName" type="text" required style={inputStyle} /></div>

        <div className="admin-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div><label style={labelStyle}>Phone</label><input name="customerPhone" type="tel" required style={inputStyle} /></div>
          <div><label style={labelStyle}>Email</label><input name="customerEmail" type="email" required style={inputStyle} /></div>
        </div>

        <div>
          <label style={labelStyle}>Court</label>
          <select name="courtId" required defaultValue={params.courtId ?? ""} style={{ ...inputStyle, cursor: "pointer" }}>
            {courts.map(c => <option key={c.id} value={c.id}>Court · {c.name}</option>)}
          </select>
        </div>

        <div className="admin-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>Starts at</label>
            <input name="startsAt" type="datetime-local" required defaultValue={params.startsAt ?? ""} style={{ ...inputStyle, colorScheme: "light", ...(hasOverlap ? { borderColor: "rgba(220,38,38,0.40)" } : {}) }} />
          </div>
          <div>
            <label style={labelStyle}>Duration</label>
            <select name="durationMinutes" required defaultValue={params.duration ?? "90"} style={{ ...inputStyle, cursor: "pointer" }}>
              {ALLOWED_DURATIONS.map(m => <option key={m} value={m}>{m} min</option>)}
            </select>
          </div>
        </div>

        <div><label style={labelStyle}>Notes (optional)</label><textarea name="notes" rows={3} style={{ ...inputStyle, resize: "vertical" }} /></div>

        <button type="submit" style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, fontWeight: 600, color: "#fff", background: "#16a34a", border: "none", borderRadius: 9, padding: "13px 24px", cursor: "pointer", boxShadow: "0 2px 8px rgba(22,163,74,0.30)", marginTop: 4 }}>
          Add booking →
        </button>
      </form>
    </div>
  );
}
