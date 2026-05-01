import Link from "next/link";
import { db, schema } from "@/lib/db";
import { and, eq, gte, lt, asc, sql } from "drizzle-orm";
import { formatTime, formatDateLong } from "@/lib/booking";
import { formatUsd } from "@/lib/pricing";

export const metadata = { title: "Admin · Today" };
export const dynamic = "force-dynamic";

export default async function AdminTodayPage() {
  const now = new Date();
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

  const [todayBookings, revenueRow] = await Promise.all([
    db.select({
      id: schema.bookings.id,
      customerName:  schema.bookings.customerName,
      customerPhone: schema.bookings.customerPhone,
      startsAt: schema.bookings.startsAt,
      endsAt:   schema.bookings.endsAt,
      durationMinutes: schema.bookings.durationMinutes,
      totalCents: schema.bookings.totalCents,
      status: schema.bookings.status,
      courtName: schema.courts.name,
    })
    .from(schema.bookings)
    .innerJoin(schema.courts, eq(schema.bookings.courtId, schema.courts.id))
    .where(and(
      gte(schema.bookings.startsAt, today),
      lt(schema.bookings.startsAt, tomorrow),
    ))
    .orderBy(asc(schema.bookings.startsAt)),

    db.select({
      total: sql<number>`coalesce(sum(${schema.bookings.totalCents}), 0)::int`,
    })
    .from(schema.bookings)
    .where(and(
      gte(schema.bookings.startsAt, today),
      lt(schema.bookings.startsAt, tomorrow),
      eq(schema.bookings.status, "confirmed"),
    )),
  ]);

  const todayRevenue = revenueRow[0]?.total ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="text-xs uppercase tracking-[0.18em] text-forest font-semibold mb-2">
        — Today
      </div>
      <h1 className="font-serif text-4xl text-forest-deep mb-8">
        {formatDateLong(today)}
      </h1>

      <div className="grid sm:grid-cols-3 gap-6 mb-12">
        <Card label="Bookings today"  value={String(todayBookings.length)} />
        <Card label="Revenue (today)" value={formatUsd(todayRevenue)} />
        <Card label="Quick action">
          <Link href="/admin/bookings/new" className="btn btn-primary text-sm">
            Add booking
          </Link>
        </Card>
      </div>

      <div className="bg-cream rounded-2xl border border-forest/15 overflow-hidden">
        <div className="px-6 py-4 border-b border-forest/10 flex items-center justify-between">
          <h2 className="font-serif text-xl text-forest-deep">Today&apos;s schedule</h2>
          <Link href="/admin/bookings" className="text-sm text-forest hover:underline">
            All bookings →
          </Link>
        </div>
        {todayBookings.length === 0 ? (
          <div className="p-10 text-center text-char-soft">
            No bookings yet today.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-cream-deep text-xs uppercase tracking-wider text-char-soft">
              <tr>
                <Th>Time</Th>
                <Th>Court</Th>
                <Th>Customer</Th>
                <Th>Phone</Th>
                <Th>Total</Th>
                <Th>Status</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {todayBookings.map((b) => {
                const s = new Date(b.startsAt);
                const e = new Date(b.endsAt);
                return (
                  <tr key={b.id} className="border-t border-forest/10">
                    <Td>{formatTime(s)} — {formatTime(e)}</Td>
                    <Td>Court {b.courtName}</Td>
                    <Td>{b.customerName}</Td>
                    <Td>{b.customerPhone}</Td>
                    <Td>{formatUsd(b.totalCents)}</Td>
                    <Td>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                        b.status === "confirmed" ? "bg-sage-soft text-forest-deep" :
                        b.status === "cancelled" ? "bg-clay/15 text-clay" :
                        "bg-cream-deep text-char-soft"
                      }`}>
                        {b.status}
                      </span>
                    </Td>
                    <Td>
                      <Link href={`/admin/bookings/${b.id}`} className="text-forest hover:underline">
                        Manage →
                      </Link>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Card({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="bg-cream rounded-2xl border border-forest/15 p-6">
      <div className="text-xs uppercase tracking-[0.18em] text-char-soft font-semibold mb-2">
        {label}
      </div>
      {value && <div className="font-serif text-3xl text-forest-deep">{value}</div>}
      {children}
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="px-4 py-3 text-left font-semibold">{children}</th>;
}
function Td({ children }: { children?: React.ReactNode }) {
  return <td className="px-4 py-3">{children}</td>;
}
