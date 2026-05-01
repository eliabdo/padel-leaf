import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { formatTime, formatDateLong } from "@/lib/booking";
import { formatUsd } from "@/lib/pricing";

export const metadata = { title: "Admin · Booking" };
export const dynamic = "force-dynamic";

async function cancelBooking(formData: FormData): Promise<void> {
  "use server";
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await db.update(schema.bookings).set({ status: "cancelled", cancelledAt: new Date() }).where(eq(schema.bookings.id, id));
  redirect("/admin/bookings");
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

export default async function AdminBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bookingId = Number(id);
  if (!Number.isInteger(bookingId)) notFound();

  const rows = await db.select({ id: schema.bookings.id, customerName: schema.bookings.customerName, customerEmail: schema.bookings.customerEmail, customerPhone: schema.bookings.customerPhone, startsAt: schema.bookings.startsAt, endsAt: schema.bookings.endsAt, durationMinutes: schema.bookings.durationMinutes, totalCents: schema.bookings.totalCents, status: schema.bookings.status, notes: schema.bookings.notes, createdAt: schema.bookings.createdAt, courtName: schema.courts.name })
    .from(schema.bookings).innerJoin(schema.courts, eq(schema.bookings.courtId, schema.courts.id)).where(eq(schema.bookings.id, bookingId));

  const b = rows[0];
  if (!b) notFound();
  const s = new Date(b.startsAt); const e = new Date(b.endsAt);
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
    { label: "Created",  value: new Date(b.createdAt).toLocaleString() },
    ...(b.notes ? [{ label: "Notes", value: b.notes }] : []),
  ];

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "36px 28px" }}>
      <Link href="/admin/bookings" style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 500, color: "#16a34a", textDecoration: "none" }}>← All bookings</Link>

      <div style={{ margin: "16px 0 28px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "#16a34a", marginBottom: 6, fontFamily: "system-ui, sans-serif" }}>Booking</div>
        <h1 style={{ fontFamily: "system-ui, sans-serif", fontSize: 26, fontWeight: 700, color: "#0d2010", margin: 0 }}>#{b.id}</h1>
      </div>

      {/* Detail card */}
      <div style={{ background: "#fff", border: "1px solid rgba(22,163,74,0.12)", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)", marginBottom: 20 }}>
        {detailRows.map(({ label, value, node }, i, arr) => (
          <div key={label} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 24px", borderBottom: i < arr.length - 1 ? "1px solid rgba(22,163,74,0.07)" : "none", background: i % 2 === 1 ? "rgba(22,163,74,0.015)" : "#fff" }}>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9ca3af" }}>{label}</div>
            {node ?? <div style={{ fontFamily: "ui-monospace, 'SF Mono', monospace", fontSize: 13, color: "#111827", textAlign: "right" }}>{value}</div>}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ background: "#fff", border: "1px solid rgba(22,163,74,0.12)", borderRadius: 14, padding: "24px 28px", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)" }}>
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9ca3af", marginBottom: 16 }}>Actions</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {b.status === "confirmed" && (<>
            <Btn action={markCompleted} id={b.id} label="Mark completed" />
            <Btn action={markNoShow}   id={b.id} label="Mark no-show" />
            <Btn action={cancelBooking} id={b.id} label="Cancel booking" danger />
          </>)}
          <Btn action={deleteBooking} id={b.id} label="Delete permanently" danger />
        </div>
      </div>
    </div>
  );
}

function Btn({ action, id, label, danger }: { action: (fd: FormData) => Promise<void>; id: number; label: string; danger?: boolean }) {
  const style: React.CSSProperties = danger
    ? { fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 500, color: "#dc2626", background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.25)", borderRadius: 9, padding: "9px 18px", cursor: "pointer" }
    : { fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 600, color: "#fff", background: "#16a34a", border: "none", borderRadius: 9, padding: "9px 18px", cursor: "pointer", boxShadow: "0 2px 6px rgba(22,163,74,0.25)" };
  return (
    <form action={action}><input type="hidden" name="id" value={id} /><button type="submit" style={style}>{label}</button></form>
  );
}
