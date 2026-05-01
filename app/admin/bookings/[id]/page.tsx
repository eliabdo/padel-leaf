import { notFound, redirect } from "next/navigation";
import BackButton from "./back-button";
import SlotPicker from "../slot-picker";
import StatusActions from "./status-actions";
import { db, schema } from "@/lib/db";
import { eq, asc, and, lt, gt, ne } from "drizzle-orm";
import { formatTime, formatDateLong, ALLOWED_DURATIONS } from "@/lib/booking";
import { formatUsd, priceForDuration } from "@/lib/pricing";
import { getActiveHourlyRateCents } from "@/lib/pricing-db";

export const metadata = { title: "Admin · Booking" };
export const dynamic = "force-dynamic";

/* ── helpers ─────────────────────────────────────────────────── */
function toDatetimeLocal(d: Date): string {
  // Display stored UTC time in the datetime-local input
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

/* ── server actions ──────────────────────────────────────────── */
async function cancelBooking(formData: FormData): Promise<void> {
  "use server";
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await db.update(schema.bookings).set({ status: "cancelled", cancelledAt: new Date() }).where(eq(schema.bookings.id, id));
  redirect(`/admin/bookings/${id}`);
}
async function deleteBooking(formData: FormData): Promise<void> {
  "use server";
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await db.delete(schema.bookings).where(eq(schema.bookings.id, id));
  redirect("/admin/bookings");
}
async function markCompleted(formData: FormData): Promise<void> {
  "use server";
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await db.update(schema.bookings).set({ status: "completed" }).where(eq(schema.bookings.id, id));
  redirect(`/admin/bookings/${id}`);
}
async function markNoShow(formData: FormData): Promise<void> {
  "use server";
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await db.update(schema.bookings).set({ status: "no_show" }).where(eq(schema.bookings.id, id));
  redirect(`/admin/bookings/${id}`);
}
async function updateBooking(formData: FormData): Promise<void> {
  "use server";
  const id            = Number(formData.get("id"));
  const courtId       = Number(formData.get("courtId"));
  const startsAtStr   = String(formData.get("startsAt") ?? "");
  const durationMin   = Number(formData.get("durationMinutes"));
  const customerName  = String(formData.get("customerName")  ?? "").trim();
  const customerEmail = String(formData.get("customerEmail") ?? "").trim();
  const customerPhone = String(formData.get("customerPhone") ?? "").trim();
  const notes         = String(formData.get("notes") ?? "").trim() || null;

  if (!id || !courtId || !startsAtStr || !durationMin || !customerName || !customerPhone || !customerEmail)
    throw new Error("Missing fields");
  if (!(ALLOWED_DURATIONS as readonly number[]).includes(durationMin))
    throw new Error("Invalid duration");

  const startsAt = new Date(startsAtStr);
  const endsAt   = new Date(startsAt.getTime() + durationMin * 60 * 1000);

  const overlaps = await db.select({ id: schema.bookings.id })
    .from(schema.bookings)
    .where(and(
      eq(schema.bookings.courtId, courtId),
      eq(schema.bookings.status, "confirmed"),
      ne(schema.bookings.id, id),
      lt(schema.bookings.startsAt, endsAt),
      gt(schema.bookings.endsAt, startsAt),
    )).limit(1);

  if (overlaps.length > 0) redirect(`/admin/bookings/${id}?error=overlap`);

  const hourlyRateCents = await getActiveHourlyRateCents();
  const totalCents = priceForDuration(hourlyRateCents, durationMin);

  await db.update(schema.bookings).set({
    courtId, customerName, customerEmail, customerPhone,
    startsAt, endsAt, durationMinutes: durationMin, totalCents, notes,
  }).where(eq(schema.bookings.id, id));

  redirect(`/admin/bookings/${id}?updated=1`);
}

/* ── styles ──────────────────────────────────────────────────── */
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

/* ── page ────────────────────────────────────────────────────── */
export default async function AdminBookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string; error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const bookingId = Number(id);
  if (!Number.isInteger(bookingId)) notFound();

  const [rows, courts] = await Promise.all([
    db.select({
      id: schema.bookings.id,
      courtId: schema.bookings.courtId,
      customerName: schema.bookings.customerName,
      customerEmail: schema.bookings.customerEmail,
      customerPhone: schema.bookings.customerPhone,
      startsAt: schema.bookings.startsAt,
      endsAt: schema.bookings.endsAt,
      durationMinutes: schema.bookings.durationMinutes,
      totalCents: schema.bookings.totalCents,
      status: schema.bookings.status,
      notes: schema.bookings.notes,
      paymentMethod: schema.bookings.paymentMethod,
      createdAt: schema.bookings.createdAt,
      courtName: schema.courts.name,
    })
    .from(schema.bookings)
    .innerJoin(schema.courts, eq(schema.bookings.courtId, schema.courts.id))
    .where(eq(schema.bookings.id, bookingId)),
    db.select().from(schema.courts).orderBy(asc(schema.courts.sortOrder)),
  ]);

  const b = rows[0];
  if (!b) notFound();
  const s = new Date(b.startsAt);
  const e = new Date(b.endsAt);
  const cc = courtColor[b.courtName];

  const detailRows = [
    { label: "Status",   node: <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" as const, padding: "4px 12px", borderRadius: 20, fontFamily: "system-ui, sans-serif", ...statusBadge(b.status) }}>{b.status === "no_show" ? "No-show" : b.status}</span> },
    { label: "Court",    node: <span style={{ fontSize: 13, fontWeight: 600, padding: "3px 10px", borderRadius: 20, fontFamily: "system-ui, sans-serif", background: cc?.bg, color: cc?.text }}>{b.courtName}</span> },
    { label: "Date",     value: formatDateLong(s) },
    { label: "Time",     value: `${formatTime(s)} — ${formatTime(e)}` },
    { label: "Duration", value: `${b.durationMinutes} min` },
    { label: "Customer", value: b.customerName },
    { label: "Phone",    value: b.customerPhone },
    { label: "Email",    value: b.customerEmail },
    { label: "Total",    value: formatUsd(b.totalCents) },
    { label: "Payment",  node: (() => {
      const pm = b.paymentMethod ?? "venue";
      if (pm === "whish") return <span style={{ display:"inline-flex", alignItems:"center", gap:6 }}><img src="/whish-icon.png" alt="Whish" style={{ width:20, height:20, borderRadius:"50%", objectFit:"cover" }} /><span style={{ fontFamily:"system-ui,sans-serif", fontSize:13, fontWeight:600, color:"#e8192c" }}>Whish</span></span>;
      if (pm === "omt")   return <span style={{ display:"inline-flex", alignItems:"center", gap:6 }}><img src="/omt-logo.svg" alt="OMT" style={{ height:18, width:"auto" }} /><span style={{ fontFamily:"system-ui,sans-serif", fontSize:13, fontWeight:600, color:"#92400e" }}>OMT Pay</span></span>;
      return <span style={{ fontFamily:"system-ui,sans-serif", fontSize:13, color:"#374151" }}>💵 Pay at Venue</span>;
    })() },
    { label: "Created",  value: new Date(b.createdAt).toLocaleString() },
    ...(b.notes ? [{ label: "Notes", value: b.notes }] : []),
  ];

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "36px 28px" }}>
      <BackButton />

      <div style={{ margin: "16px 0 28px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "#16a34a", marginBottom: 6, fontFamily: "system-ui, sans-serif" }}>Booking</div>
        <h1 style={{ fontFamily: "system-ui, sans-serif", fontSize: 26, fontWeight: 700, color: "#0d2010", margin: 0 }}>#{b.id}</h1>
      </div>

      {/* Success / error banners */}
      {sp.updated === "1" && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.25)", borderRadius: 10, padding: "12px 18px", marginBottom: 20 }}>
          <span style={{ fontSize: 16 }}>✓</span>
          <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 600, color: "#15803d" }}>Booking updated successfully.</span>
        </div>
      )}
      {sp.error === "overlap" && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.25)", borderRadius: 10, padding: "12px 18px", marginBottom: 20 }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 600, color: "#dc2626" }}>That time slot overlaps with another confirmed booking. Please choose a different time or court.</span>
        </div>
      )}

      {/* Detail card */}
      <div style={{ background: "#fff", border: "1px solid rgba(22,163,74,0.12)", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)", marginBottom: 20 }}>
        {detailRows.map(({ label, value, node }, i, arr) => (
          <div key={label} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 24px", borderBottom: i < arr.length - 1 ? "1px solid rgba(22,163,74,0.07)" : "none", background: i % 2 === 1 ? "rgba(22,163,74,0.015)" : "#fff" }}>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9ca3af" }}>{label}</div>
            {node ?? <div style={{ fontFamily: "ui-monospace, 'SF Mono', monospace", fontSize: 13, color: "#111827", textAlign: "right" }}>{value}</div>}
          </div>
        ))}
      </div>

      {/* Status actions */}
      <div style={{ background: "#fff", border: "1px solid rgba(22,163,74,0.12)", borderRadius: 14, padding: "24px 28px", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)", marginBottom: 20 }}>
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9ca3af", marginBottom: 16 }}>Status actions</div>
        <StatusActions
          status={b.status}
          id={b.id}
          cancelBooking={cancelBooking}
          deleteBooking={deleteBooking}
          markCompleted={markCompleted}
          markNoShow={markNoShow}
        />
      </div>

      {/* Edit form */}
      <form action={updateBooking} style={{ background: "#fff", border: "1px solid rgba(22,163,74,0.12)", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)" }}>
        <input type="hidden" name="id" value={b.id} />

        {/* Card header */}
        <div style={{ padding: "16px 24px", background: "#fafdfb", borderBottom: "1px solid rgba(22,163,74,0.08)" }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, fontWeight: 700, color: "#0d2010" }}>Edit booking</div>
        </div>

        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Customer name */}
          <div>
            <label style={labelStyle}>Customer name</label>
            <input name="customerName" type="text" required defaultValue={b.customerName} style={inputStyle} />
          </div>

          {/* Phone + Email */}
          <div className="admin-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Phone</label>
              <input name="customerPhone" type="tel" required defaultValue={b.customerPhone} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input name="customerEmail" type="email" required defaultValue={b.customerEmail} style={inputStyle} />
            </div>
          </div>

          {/* Court */}
          <div>
            <label style={labelStyle}>Court</label>
            <select name="courtId" required defaultValue={b.courtId} style={{ ...inputStyle, cursor: "pointer" }}>
              {courts.map(c => <option key={c.id} value={c.id}>Court · {c.name}</option>)}
            </select>
          </div>

          {/* Starts at + Duration */}
          <div className="admin-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Starts at</label>
              <SlotPicker name="startsAt" defaultValue={toDatetimeLocal(s)} />
            </div>
            <div>
              <label style={labelStyle}>Duration</label>
              <select name="durationMinutes" required defaultValue={b.durationMinutes} style={{ ...inputStyle, cursor: "pointer" }}>
                {ALLOWED_DURATIONS.map(m => <option key={m} value={m}>{m} min</option>)}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Notes (optional)</label>
            <textarea name="notes" rows={3} defaultValue={b.notes ?? ""} style={{ ...inputStyle, resize: "vertical" }} />
          </div>

          <div>
            <button type="submit" style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 600, color: "#fff", background: "#16a34a", border: "none", borderRadius: 9, padding: "11px 24px", cursor: "pointer", boxShadow: "0 2px 8px rgba(22,163,74,0.28)" }}>
              Save changes →
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

