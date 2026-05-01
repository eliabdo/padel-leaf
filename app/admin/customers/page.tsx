import { db, schema } from "@/lib/db";
import { sql, desc, eq } from "drizzle-orm";
import { formatUsd } from "@/lib/pricing";

export const metadata = { title: "Admin · Customers" };
export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  // Group bookings by email — quick aggregate over the bookings table.
  const customers = await db
    .select({
      email:    schema.bookings.customerEmail,
      lastName: sql<string>`max(${schema.bookings.customerName})`,
      lastPhone: sql<string>`max(${schema.bookings.customerPhone})`,
      total:    sql<number>`count(*)::int`,
      lifetimeSpentCents: sql<number>`coalesce(sum(case when ${schema.bookings.status} = 'completed' then ${schema.bookings.totalCents} else 0 end), 0)::int`,
      lastBookingAt: sql<Date>`max(${schema.bookings.startsAt})`,
    })
    .from(schema.bookings)
    .groupBy(schema.bookings.customerEmail)
    .orderBy(desc(sql`max(${schema.bookings.startsAt})`));

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <h1 className="font-serif text-4xl text-forest-deep mb-8">Customers</h1>

      <div className="bg-cream rounded-2xl border border-forest/15 overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-cream-deep text-xs uppercase tracking-wider text-char-soft">
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Phone</Th>
              <Th>Bookings</Th>
              <Th>Lifetime</Th>
              <Th>Last visit</Th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-char-soft">No customers yet.</td></tr>
            )}
            {customers.map((c) => (
              <tr key={c.email} className="border-t border-forest/10">
                <Td>{c.lastName}</Td>
                <Td>{c.email}</Td>
                <Td>{c.lastPhone}</Td>
                <Td>{c.total}</Td>
                <Td>{formatUsd(c.lifetimeSpentCents)}</Td>
                <Td>{new Date(c.lastBookingAt).toLocaleDateString()}</Td>
              </tr>
            ))}
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
  return <td className="px-4 py-3">{children}</td>;
}
