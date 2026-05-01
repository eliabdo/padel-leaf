import Link from "next/link";
import { db, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { formatTime, formatDateLong } from "@/lib/booking";
import { formatUsd } from "@/lib/pricing";

export const metadata = { title: "Admin · Bookings" };
export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  const rows = await db
    .select({
      id: schema.bookings.id,
      customerName:  schema.bookings.customerName,
      customerEmail: schema.bookings.customerEmail,
      customerPhone: schema.bookings.customerPhone,
      startsAt: schema.bookings.startsAt,
      endsAt:   schema.bookings.endsAt,
      totalCents: schema.bookings.totalCents,
      status: schema.bookings.status,
      courtName: schema.courts.name,
    })
    .from(schema.bookings)
    .innerJoin(schema.courts, eq(schema.bookings.courtId, schema.courts.id))
    .orderBy(desc(schema.bookings.startsAt))
    .limit(200);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-baseline justify-between mb-6 flex-wrap gap-4">
        <h1 className="font-serif text-4xl text-forest-deep">All bookings</h1>
        <Link href="/admin/bookings/new" className="btn btn-primary">
          Add booking
        </Link>
      </div>

      <div className="bg-cream rounded-2xl border border-forest/15 overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-cream-deep text-xs uppercase tracking-wider text-char-soft">
            <tr>
              <Th>When</Th>
              <Th>Court</Th>
              <Th>Customer</Th>
              <Th>Contact</Th>
              <Th>Total</Th>
              <Th>Status</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-char-soft">No bookings yet.</td></tr>
            )}
            {rows.map((b) => {
              const s = new Date(b.startsAt);
              const e = new Date(b.endsAt);
              return (
                <tr key={b.id} className="border-t border-forest/10">
                  <Td>
                    <div>{formatDateLong(s)}</div>
                    <div className="text-char-soft text-xs">{formatTime(s)} — {formatTime(e)}</div>
                  </Td>
                  <Td>Court {b.courtName}</Td>
                  <Td>{b.customerName}</Td>
                  <Td>
                    <div>{b.customerPhone}</div>
                    <div className="text-char-soft text-xs">{b.customerEmail}</div>
                  </Td>
                  <Td>{formatUsd(b.totalCents)}</Td>
                  <Td>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                      b.status === "confirmed" ? "bg-sage-soft text-forest-deep" :
                      b.status === "cancelled" ? "bg-clay/15 text-clay" :
                      "bg-cream-deep text-char-soft"
                    }`}>{b.status}</span>
                  </Td>
                  <Td>
                    <Link href={`/admin/bookings/${b.id}`} className="text-forest hover:underline">Manage →</Link>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="px-4 py-3 text-left font-semibold">{children}</th>;
}
function Td({ children }: { children?: React.ReactNode }) {
  return <td className="px-4 py-3 align-top">{children}</td>;
}
