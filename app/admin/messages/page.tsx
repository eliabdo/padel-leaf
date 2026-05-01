import { db, schema } from "@/lib/db";
import { desc, eq, isNull } from "drizzle-orm";
import { formatDateLong, formatTime } from "@/lib/booking";
import { formatUsd } from "@/lib/pricing";
import Link from "next/link";
import MarkRead from "./mark-read";

async function markAllRead(): Promise<void> {
  "use server";
  await db.update(schema.bookings)
    .set({ readAt: new Date() })
    .where(isNull(schema.bookings.readAt));
}

export const metadata = { title: "Admin · Messages" };
export const dynamic = "force-dynamic";

function dayLabel(iso: string): string {
  const now       = new Date();
  const todayKey  = now.toISOString().slice(0, 10);
  const yest      = new Date(now); yest.setDate(now.getDate() - 1);
  const yesterKey = yest.toISOString().slice(0, 10);
  const key       = new Date(iso).toISOString().slice(0, 10);
  if (key === todayKey)  return "Today";
  if (key === yesterKey) return "Yesterday";
  const d = new Date(key + "T12:00:00Z");
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
}

const statusBadge: Record<string, React.CSSProperties> = {
  confirmed: { background: "rgba(22,163,74,0.10)", color: "#15803d", border: "1px solid rgba(22,163,74,0.22)" },
  completed: { background: "rgba(37,99,235,0.09)", color: "#1d4ed8", border: "1px solid rgba(37,99,235,0.20)" },
  cancelled: { background: "rgba(220,38,38,0.09)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.20)" },
  no_show:   { background: "rgba(217,119,6,0.09)",  color: "#b45309", border: "1px solid rgba(217,119,6,0.22)" },
};

export default async function AdminMessagesPage() {
  // 1. Fetch all unread bookings BEFORE marking them read
  const unread = await db
    .select({
      id:              schema.bookings.id,
      customerName:    schema.bookings.customerName,
      customerEmail:   schema.bookings.customerEmail,
      customerPhone:   schema.bookings.customerPhone,
      startsAt:        schema.bookings.startsAt,
      endsAt:          schema.bookings.endsAt,
      durationMinutes: schema.bookings.durationMinutes,
      totalCents:      schema.bookings.totalCents,
      status:          schema.bookings.status,
      notes:           schema.bookings.notes,
      createdAt:       schema.bookings.createdAt,
      courtName:       schema.courts.name,
    })
    .from(schema.bookings)
    .innerJoin(schema.courts, eq(schema.bookings.courtId, schema.courts.id))
    .where(isNull(schema.bookings.readAt))
    .orderBy(desc(schema.bookings.createdAt));

  // 2. Group by creation day for display (marking as read happens client-side to avoid prefetch issues)
  type Row = typeof unread[number];
  const dayMap = new Map<string, Row[]>();
  for (const b of unread) {
    const key = new Date(b.createdAt).toISOString().slice(0, 10);
    if (!dayMap.has(key)) dayMap.set(key, []);
    dayMap.get(key)!.push(b);
  }
  const days = [...dayMap.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "36px 28px" }}>

      {/* Header */}
      <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "#16a34a", marginBottom: 6, fontFamily: "system-ui, sans-serif" }}>Inbox</div>
          <h1 style={{ fontFamily: "system-ui, sans-serif", fontSize: 26, fontWeight: 700, color: "#0d2010", margin: 0 }}>New reservations</h1>
        </div>
        {unread.length > 0 && (
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: "#6b7280" }}>
            {unread.length} unread
          </div>
        )}
      </div>
      {unread.length > 0 && <MarkRead action={markAllRead} />}

      {/* Empty state */}
      {days.length === 0 && (
        <div style={{ background: "#fff", border: "1px solid rgba(22,163,74,0.12)", borderRadius: 14, padding: "64px 24px", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 15, fontWeight: 600, color: "#0d2010", marginBottom: 6 }}>All caught up</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: "#9ca3af" }}>No new reservations since your last visit.</div>
        </div>
      )}

      {/* Day groups */}
      {days.map(([key, rows]) => (
        <div key={key} style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "#9ca3af", marginBottom: 12, paddingLeft: 4 }}>
            {dayLabel(rows[0].createdAt.toISOString())}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {rows.map((b) => {
              const s     = new Date(b.startsAt);
              const e     = new Date(b.endsAt);
              const badge = statusBadge[b.status] ?? statusBadge.confirmed;
              const statusLabel = b.status === "no_show" ? "No-show" : b.status.charAt(0).toUpperCase() + b.status.slice(1);

              return (
                <div key={b.id} style={{ background: "#fff", border: "1px solid rgba(22,163,74,0.12)", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 14px rgba(0,0,0,0.03)" }}>

                  {/* Email header */}
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "14px 20px", background: "#fafdfb", borderBottom: "1px solid rgba(22,163,74,0.08)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(22,163,74,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, fontWeight: 700, color: "#16a34a" }}>
                          {b.customerName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, fontWeight: 700, color: "#0d2010" }}>
                          New reservation — {b.customerName}
                        </div>
                        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                          {b.customerEmail} · {b.customerPhone}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 20, fontFamily: "system-ui, sans-serif", ...badge }}>{statusLabel}</span>
                      <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 11, color: "#9ca3af" }}>
                        {new Date(b.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ padding: "6px 20px 12px" }}>
                    {([
                      { label: "Court",    value: `Court ${b.courtName}` },
                      { label: "Date",     value: formatDateLong(s) },
                      { label: "Time",     value: `${formatTime(s)} — ${formatTime(e)}` },
                      { label: "Duration", value: `${b.durationMinutes} min` },
                      { label: "Total",    value: formatUsd(b.totalCents), mono: true },
                      ...(b.notes ? [{ label: "Notes", value: b.notes }] : []),
                    ] as { label: string; value: string; mono?: boolean }[]).map(({ label, value, mono }, i, arr) => (
                      <div key={label} style={{ display: "flex", gap: 16, padding: "8px 0", borderBottom: i < arr.length - 1 ? "1px solid rgba(22,163,74,0.06)" : "none" }}>
                        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9ca3af", width: 72, flexShrink: 0, paddingTop: 1 }}>{label}</div>
                        <div style={{ fontFamily: mono ? "ui-monospace,'SF Mono',monospace" : "system-ui,sans-serif", fontSize: 13, color: "#111827", fontWeight: mono ? 700 : 400 }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div style={{ padding: "10px 20px", borderTop: "1px solid rgba(22,163,74,0.07)", background: "#fafdfb" }}>
                    <Link href={`/admin/bookings/${b.id}`} style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 600, color: "#16a34a", textDecoration: "none" }}>
                      Manage booking #{b.id} →
                    </Link>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
