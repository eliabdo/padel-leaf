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
  await db
    .update(schema.bookings)
    .set({ status: "cancelled", cancelledAt: new Date() })
    .where(eq(schema.bookings.id, id));
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
  await db
    .update(schema.bookings)
    .set({ status: "completed" })
    .where(eq(schema.bookings.id, id));
  redirect(`/admin/bookings/${id}`);
}

async function markNoShow(formData: FormData): Promise<void> {
  "use server";
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await db
    .update(schema.bookings)
    .set({ status: "no_show" })
    .where(eq(schema.bookings.id, id));
  redirect(`/admin/bookings/${id}`);
}

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bookingId = Number(id);
  if (!Number.isInteger(bookingId)) notFound();

  const rows = await db
    .select({
      id: schema.bookings.id,
      customerName:  schema.bookings.customerName,
      customerEmail: schema.bookings.customerEmail,
      customerPhone: schema.bookings.customerPhone,
      startsAt: schema.bookings.startsAt,
      endsAt:   schema.bookings.endsAt,
      durationMinutes: schema.bookings.durationMinutes,
      totalCents: schema.bookings.totalCents,
      status: schema.bookings.status,
      notes: schema.bookings.notes,
      createdAt: schema.bookings.createdAt,
      courtName: schema.courts.name,
    })
    .from(schema.bookings)
    .innerJoin(schema.courts, eq(schema.bookings.courtId, schema.courts.id))
    .where(eq(schema.bookings.id, bookingId));

  const b = rows[0];
  if (!b) notFound();

  const s = new Date(b.startsAt);
  const e = new Date(b.endsAt);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <Link href="/admin/bookings" className="text-sm text-forest hover:underline">
        ← All bookings
      </Link>
      <h1 className="font-serif text-4xl text-forest-deep mt-3 mb-8">
        Booking #{b.id}
      </h1>

      <div className="bg-cream rounded-2xl border border-forest/15 p-8 mb-8">
        <Row label="Status">
          <span className={`inline-block px-2 py-0.5 rounded text-xs ${
            b.status === "confirmed" ? "bg-sage-soft text-forest-deep" :
            b.status === "cancelled" ? "bg-clay/15 text-clay" :
            "bg-cream-deep text-char-soft"
          }`}>{b.status}</span>
        </Row>
        <Row label="Court"    value={`Court · ${b.courtName}`} />
        <Row label="Date"     value={formatDateLong(s)} />
        <Row label="Time"     value={`${formatTime(s)} — ${formatTime(e)}`} />
        <Row label="Duration" value={`${b.durationMinutes} min`} />
        <Row label="Customer" value={b.customerName} />
        <Row label="Phone"    value={b.customerPhone} />
        <Row label="Email"    value={b.customerEmail} />
        <Row label="Total"    value={formatUsd(b.totalCents)} />
        <Row label="Created"  value={new Date(b.createdAt).toLocaleString()} />
      </div>

      <div className="bg-cream-deep rounded-2xl p-6">
        <h2 className="font-serif text-xl text-forest-deep mb-4">Actions</h2>
        <div className="flex flex-wrap gap-3">
          {b.status === "confirmed" && (
            <>
              <form action={markCompleted}>
                <input type="hidden" name="id" value={b.id} />
                <button className="btn btn-outline">Mark completed</button>
              </form>
              <form action={markNoShow}>
                <input type="hidden" name="id" value={b.id} />
                <button className="btn btn-outline">Mark no-show</button>
              </form>
              <form action={cancelBooking}>
                <input type="hidden" name="id" value={b.id} />
                <button className="btn btn-outline border-clay text-clay hover:bg-clay hover:text-cream">
                  Cancel booking
                </button>
              </form>
            </>
          )}
          <form action={deleteBooking}>
            <input type="hidden" name="id" value={b.id} />
            <button className="btn btn-outline border-clay text-clay hover:bg-clay hover:text-cream">
              Delete (permanent)
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-4 py-3 border-b border-forest/10 last:border-0">
      <div className="text-xs uppercase tracking-[0.18em] text-forest font-semibold">{label}</div>
      <div className="font-serif text-lg text-forest-deep text-right">{value ?? children}</div>
    </div>
  );
}
