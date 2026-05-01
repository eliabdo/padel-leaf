import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import Link from "next/link";
import { db, schema } from "@/lib/db";
import { ALLOWED_DURATIONS } from "@/lib/booking";
import { getActiveHourlyRateCents, priceForDuration } from "@/lib/pricing";

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

  if (!courtId || !startsAtStr || !durationMinutes || !customerName || !customerPhone || !customerEmail) {
    throw new Error("Missing fields");
  }
  if (!(ALLOWED_DURATIONS as readonly number[]).includes(durationMinutes)) {
    throw new Error("Invalid duration");
  }

  const startsAt = new Date(startsAtStr);
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60 * 1000);
  const hourlyRateCents = await getActiveHourlyRateCents();
  const totalCents = priceForDuration(hourlyRateCents, durationMinutes);

  await db.insert(schema.bookings).values({
    courtId,
    customerName,
    customerEmail,
    customerPhone,
    startsAt,
    endsAt,
    durationMinutes,
    totalCents,
    status: "confirmed",
    notes,
  });

  redirect("/admin/bookings");
}

export default async function AdminNewBookingPage() {
  const courts = await db.select().from(schema.courts).orderBy(asc(schema.courts.sortOrder));

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <Link href="/admin/bookings" className="text-sm text-forest hover:underline">← Bookings</Link>
      <h1 className="font-serif text-4xl text-forest-deep mt-3 mb-8">
        Add a booking manually
      </h1>

      <form action={createManualBooking} className="space-y-5 bg-cream rounded-2xl border border-forest/15 p-8">
        <Field label="Customer name" name="customerName" type="text"  required />
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Phone" name="customerPhone" type="tel"   required />
          <Field label="Email" name="customerEmail" type="email" required />
        </div>

        <div>
          <Label>Court</Label>
          <select
            name="courtId"
            required
            className="w-full px-4 py-3 rounded-lg border border-forest/20 bg-cream"
          >
            {courts.map((c) => (
              <option key={c.id} value={c.id}>Court · {c.name}</option>
            ))}
          </select>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Starts at</Label>
            <input
              name="startsAt"
              type="datetime-local"
              required
              className="w-full px-4 py-3 rounded-lg border border-forest/20 bg-cream"
            />
          </div>
          <div>
            <Label>Duration</Label>
            <select
              name="durationMinutes"
              required
              defaultValue="90"
              className="w-full px-4 py-3 rounded-lg border border-forest/20 bg-cream"
            >
              {ALLOWED_DURATIONS.map((m) => (
                <option key={m} value={m}>{m} min</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <Label>Notes (optional)</Label>
          <textarea
            name="notes"
            rows={3}
            className="w-full px-4 py-3 rounded-lg border border-forest/20 bg-cream"
          />
        </div>

        <button type="submit" className="btn btn-primary w-full justify-center">
          Add booking →
        </button>
      </form>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs uppercase tracking-[0.18em] text-forest font-semibold mb-2">
      {children}
    </div>
  );
}

function Field({ label, name, type, required }: { label: string; name: string; type: string; required?: boolean }) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full px-4 py-3 rounded-lg border border-forest/20 bg-cream"
      />
    </div>
  );
}
