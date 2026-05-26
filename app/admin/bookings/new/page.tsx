import { redirect } from "next/navigation";
import { asc, and, eq, lt, gt } from "drizzle-orm";
import Link from "next/link";
import { db, schema } from "@/lib/db";
import { ALLOWED_DURATIONS } from "@/lib/booking";
import SlotPicker from "../slot-picker";
import { getActiveHourlyRateCents } from "@/lib/pricing-db";
import { priceForDuration } from "@/lib/pricing";
import { PhoneInput } from "@/app/components/phone-input";
import { sendBookingConfirmation } from "@/lib/email";

export const metadata = { title: "Admin · Add booking" };
export const dynamic = "force-dynamic";

async function createManualBooking(formData: FormData): Promise<void> {
  "use server";
  const courtId = Number(formData.get("courtId"));
  const startsAtStr = String(formData.get("startsAt") ?? "");
  const durationMinutes = Number(formData.get("durationMinutes"));
  const firstName     = String(formData.get("firstName")    ?? "").trim();
  const lastName      = String(formData.get("lastName")     ?? "").trim();
  const customerName  = `${firstName} ${lastName}`.trim();
  // Normalise email so the customers GROUP BY treats variations of the
  // same address ("J@x.com" vs "j@x.com") as one customer with a higher
  // booking count instead of two separate rows.
  const customerEmail = String(formData.get("customerEmail") ?? "").trim().toLowerCase();
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
  const [createdRow] = await db.insert(schema.bookings)
    .values({ courtId, customerName, customerEmail, customerPhone, startsAt, endsAt, durationMinutes, totalCents, status: "confirmed", notes, readAt: new Date() })
    .returning({ id: schema.bookings.id });

  // Look up court name for the email.
  const [courtRow] = await db.select({ name: schema.courts.name })
    .from(schema.courts)
    .where(eq(schema.courts.id, courtId));

  // Mirror the customer into the customers table. Resilient to missing
  // table (pre db:push) - booking still succeeds either way.
  try {
    await db
      .insert(schema.customers)
      .values({
        email: customerEmail.toLowerCase(),
        name: customerName,
        phone: customerPhone,
        source: "booking",
      })
      .onConflictDoUpdate({
        target: schema.customers.email,
        set: { name: customerName, phone: customerPhone },
      });
  } catch (e) {
    console.warn("[admin/bookings/new] customers upsert skipped (run db:push):", e);
  }

  // Fire-and-forget confirmation email. Never throws - failures are logged.
  void sendBookingConfirmation({
    bookingId: createdRow.id,
    customerName,
    customerEmail,
    courtName: courtRow?.name ?? `Court ${courtId}`,
    startsAt,
    endsAt,
    durationMinutes,
    totalCents,
    paymentMethod: "venue",
  });

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

        <div className="admin-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div><label style={labelStyle}>First name</label><input name="firstName" type="text" required style={inputStyle} /></div>
          <div><label style={labelStyle}>Last name</label><input name="lastName" type="text" required style={inputStyle} /></div>
        </div>

        <div className="admin-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div><label style={labelStyle}>Phone</label><PhoneInput name="customerPhone" required /></div>
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
            <SlotPicker name="startsAt" defaultValue={params.startsAt ?? ""} hasError={hasOverlap} />
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
