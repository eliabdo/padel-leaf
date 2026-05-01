import Link from "next/link";
import { db, schema } from "@/lib/db";
import { and, eq, gte, lt, asc } from "drizzle-orm";
import { formatDateLong } from "@/lib/booking";
import { formatUsd } from "@/lib/pricing";
import TodayTabs, { type BookingRow } from "./today-tabs";

export const metadata = { title: "Admin · Today" };
export const dynamic = "force-dynamic";

export default async function AdminTodayPage() {
  const now = new Date();
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

  const allBookings = await db
    .select({
      id: schema.bookings.id,
      customerName:  schema.bookings.customerName,
      customerPhone: schema.bookings.customerPhone,
      startsAt: schema.bookings.startsAt,
      endsAt:   schema.bookings.endsAt,
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
    .orderBy(asc(schema.bookings.startsAt));

  const toRow = (b: typeof allBookings[0]): BookingRow => ({
    ...b, startsAt: b.startsAt.toISOString(), endsAt: b.endsAt.toISOString(),
  });

  const upcoming  = allBookings.filter(b => b.status === "confirmed").map(toRow);
  const completed = allBookings.filter(b => b.status === "completed").map(toRow);
  const cancelled = allBookings.filter(b => b.status === "cancelled" || b.status === "no_show").map(toRow);
  const completedRevenue = completed.reduce((s, b) => s + b.totalCents, 0);

  return (
    <div style={{ maxWidth: 1360, margin: "0 auto", padding: "36px 28px" }}>

      {/* Header */}
      <div style={{ marginBottom: 32, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "#16a34a", marginBottom: 6 }}>
            Today
          </div>
          <h1 style={{ fontFamily: "system-ui, sans-serif", fontSize: 26, fontWeight: 700, color: "#0d2010", margin: 0 }}>
            {formatDateLong(today)}
          </h1>
        </div>
        <Link href="/admin/bookings/new" style={{
          fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 600,
          color: "#fff", background: "#16a34a",
          border: "none", borderRadius: 9,
          padding: "10px 22px", textDecoration: "none",
          boxShadow: "0 2px 8px rgba(22,163,74,0.30), 0 1px 3px rgba(22,163,74,0.20)",
        }}>
          + Add booking
        </Link>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
        <StatCard label="Total bookings" value={String(allBookings.length)} />
        <StatCard label="Upcoming" value={String(upcoming.length)} accent="#16a34a" bg="rgba(22,163,74,0.06)" />
        <StatCard label="Completed" value={String(completed.length)} accent="#2563eb" bg="rgba(37,99,235,0.06)" />
        <StatCard label="Revenue (completed)" value={formatUsd(completedRevenue)} accent="#0891b2" bg="rgba(8,145,178,0.06)" />
      </div>

      {/* Tabs */}
      <TodayTabs upcoming={upcoming} completed={completed} cancelled={cancelled} />
    </div>
  );
}

function StatCard({ label, value, accent = "#16a34a", bg = "rgba(22,163,74,0.06)" }: {
  label: string; value: string; accent?: string; bg?: string;
}) {
  return (
    <div style={{
      background: "#fff", border: "1px solid rgba(22,163,74,0.12)", borderRadius: 12,
      padding: "22px 24px", borderLeft: `3px solid ${accent}`,
      boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
    }}>
      <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b7280", marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ fontFamily: "ui-monospace, 'SF Mono', monospace", fontSize: 28, fontWeight: 700, color: accent }}>
        {value}
      </div>
    </div>
  );
}
