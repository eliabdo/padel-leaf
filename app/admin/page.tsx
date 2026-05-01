import Link from "next/link";
import { db, schema } from "@/lib/db";
import { and, eq, gte, lt, asc, sum } from "drizzle-orm";
import { formatDateLong, parseDateKey, dateOnlyKey } from "@/lib/booking";
import { formatUsd } from "@/lib/pricing";
import TodayTabs, { type BookingRow } from "./today-tabs";

export const metadata = { title: "Admin · Today" };
export const dynamic = "force-dynamic";

export default async function AdminTodayPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const sp    = await searchParams;
  const now   = new Date();
  const todayKey = dateOnlyKey(now);
  const viewKey  = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : todayKey;
  const isToday  = viewKey === todayKey;
  const today    = parseDateKey(viewKey);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const prevKey  = dateOnlyKey(new Date(today.getTime() - 86400000));
  const nextKey  = dateOnlyKey(new Date(today.getTime() + 86400000));

  const [allBookings, manualRevResult] = await Promise.all([
    db.select({
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
    .orderBy(asc(schema.bookings.startsAt)),
    // Manual revenue items created on this day
    db.select({ total: sum(schema.revenueItems.amountCents) })
      .from(schema.revenueItems)
      .where(and(gte(schema.revenueItems.createdAt, today), lt(schema.revenueItems.createdAt, tomorrow))),
  ]);

  const toRow = (b: typeof allBookings[0]): BookingRow => ({
    ...b, startsAt: b.startsAt.toISOString(), endsAt: b.endsAt.toISOString(),
  });

  const upcoming  = allBookings.filter(b => b.status === "confirmed").map(toRow);
  const completed = allBookings.filter(b => b.status === "completed").map(toRow);
  const cancelled = allBookings.filter(b => b.status === "cancelled" || b.status === "no_show").map(toRow);
  const completedRevenue = completed.reduce((s, b) => s + b.totalCents, 0);
  const manualRevenue    = Number(manualRevResult[0]?.total ?? 0);
  const totalRevenue     = completedRevenue + manualRevenue;

  return (
    <div style={{ maxWidth: 1360, margin: "0 auto", padding: "36px 28px" }}>

      {/* Header */}
      <div style={{ marginBottom: 32, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "#16a34a", marginBottom: 6 }}>
            {isToday ? "Today" : "Past day"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href={`/admin?date=${prevKey}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(22,163,74,0.20)", color: "#16a34a", textDecoration: "none", fontWeight: 700, fontSize: 16, background: "#fff" }}>‹</Link>
            <h1 style={{ fontFamily: "system-ui, sans-serif", fontSize: 26, fontWeight: 700, color: "#0d2010", margin: 0 }}>
              {formatDateLong(today)}
            </h1>
            <Link href={isToday ? "#" : `/admin?date=${nextKey}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, border: `1px solid ${isToday ? "rgba(22,163,74,0.08)" : "rgba(22,163,74,0.20)"}`, color: isToday ? "#d1d5db" : "#16a34a", textDecoration: "none", fontWeight: 700, fontSize: 16, background: "#fff", pointerEvents: isToday ? "none" : "auto" }}>›</Link>
          </div>
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
        <LinkedStatCard href={`/admin/revenue?date=${viewKey}`} label="Total revenue" value={formatUsd(totalRevenue)} accent="#0891b2" bg="rgba(8,145,178,0.06)" />
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

function LinkedStatCard({ href, label, value, accent = "#16a34a", bg = "rgba(22,163,74,0.06)" }: {
  href: string; label: string; value: string; accent?: string; bg?: string;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div style={{
        background: "#fff", border: "1px solid rgba(22,163,74,0.12)", borderRadius: 12,
        padding: "22px 24px", borderLeft: `3px solid ${accent}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
        cursor: "pointer", transition: "box-shadow 0.15s",
      }}>
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b7280", marginBottom: 10 }}>
          {label} ↗
        </div>
        <div style={{ fontFamily: "ui-monospace, 'SF Mono', monospace", fontSize: 28, fontWeight: 700, color: accent }}>
          {value}
        </div>
      </div>
    </Link>
  );
}
