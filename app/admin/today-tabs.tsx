"use client";

import Link from "next/link";
import { useState } from "react";

export interface BookingRow {
  id: number;
  customerName: string;
  customerPhone: string;
  startsAt: string;
  endsAt:   string;
  totalCents: number;
  status: string;
  courtName: string;
}

interface Props {
  upcoming:  BookingRow[];
  completed: BookingRow[];
  cancelled: BookingRow[];
}

const courtColor: Record<string, { text: string; bg: string }> = {
  Laurel: { text: "#15803d", bg: "rgba(22,163,74,0.10)" },
  Oak:    { text: "#b45309", bg: "rgba(217,119,6,0.10)" },
  Olive:  { text: "#0369a1", bg: "rgba(3,105,161,0.10)" },
};

function fmt(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
}
function fmtUsd(cents: number) {
  return "$" + (cents / 100).toFixed(2);
}

type Tab = "upcoming" | "completed" | "cancelled";

const TABS: { id: Tab; label: string; color: string; badgeBg: string }[] = [
  { id: "upcoming",  label: "Upcoming",           color: "#16a34a", badgeBg: "rgba(22,163,74,0.10)" },
  { id: "completed", label: "Completed",           color: "#2563eb", badgeBg: "rgba(37,99,235,0.10)" },
  { id: "cancelled", label: "Cancelled / No-show", color: "#dc2626", badgeBg: "rgba(220,38,38,0.10)" },
];

const statusBadge = (status: string): React.CSSProperties => {
  if (status === "confirmed") return { background: "rgba(22,163,74,0.10)", color: "#15803d", border: "1px solid rgba(22,163,74,0.22)" };
  if (status === "completed") return { background: "rgba(37,99,235,0.09)", color: "#1d4ed8", border: "1px solid rgba(37,99,235,0.20)" };
  if (status === "cancelled") return { background: "rgba(220,38,38,0.09)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.20)" };
  if (status === "no_show")   return { background: "rgba(217,119,6,0.09)",  color: "#b45309", border: "1px solid rgba(217,119,6,0.22)" };
  return { background: "rgba(107,114,128,0.09)", color: "#6b7280", border: "1px solid rgba(107,114,128,0.18)" };
};

export default function TodayTabs({ upcoming, completed, cancelled }: Props) {
  const [active, setActive] = useState<Tab>("upcoming");

  const rows = active === "upcoming" ? upcoming : active === "completed" ? completed : cancelled;
  const counts: Record<Tab, number> = { upcoming: upcoming.length, completed: completed.length, cancelled: cancelled.length };

  const emptyMsg =
    active === "upcoming"  ? "No upcoming bookings today." :
    active === "completed" ? "No completed bookings yet today." :
    "No cancellations or no-shows today.";

  return (
    <div style={{ background: "#fff", border: "1px solid rgba(22,163,74,0.12)", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)" }}>

      {/* Tab bar */}
      <div style={{ display: "flex", alignItems: "stretch", borderBottom: "1px solid rgba(22,163,74,0.10)", padding: "0 4px", background: "#fafdfb" }}>
        {TABS.map(t => {
          const isActive = t.id === active;
          return (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              style={{
                fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: isActive ? 600 : 500,
                padding: "14px 18px", cursor: "pointer", background: "none",
                border: "none", borderBottom: isActive ? `2px solid ${t.color}` : "2px solid transparent",
                color: isActive ? t.color : "#6b7280",
                transition: "all 0.15s ease", marginBottom: -1, display: "flex", alignItems: "center", gap: 8,
              }}
            >
              {t.label}
              <span style={{
                fontSize: 11, fontWeight: 600,
                padding: "2px 8px", borderRadius: 20,
                background: isActive ? t.badgeBg : "rgba(0,0,0,0.05)",
                color: isActive ? t.color : "#9ca3af",
                minWidth: 20, textAlign: "center",
              }}>
                {counts[t.id]}
              </span>
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", paddingRight: 16 }}>
          <Link href="/admin/bookings" style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 500, color: "#6b7280", textDecoration: "none" }}>
            All bookings →
          </Link>
        </div>
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <div style={{ padding: "52px 24px", textAlign: "center", color: "#9ca3af", fontFamily: "system-ui, sans-serif", fontSize: 14 }}>
          {emptyMsg}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(22,163,74,0.10)", background: "#fafdfb" }}>
                {["Time", "Court", "Customer", "Phone", "Total", "Status", ""].map((h, i) => (
                  <th key={i} style={{ padding: "10px 16px", textAlign: "left", fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9ca3af" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((b, idx) => {
                const cc = courtColor[b.courtName];
                return (
                  <tr key={b.id} style={{ borderTop: "1px solid rgba(22,163,74,0.07)", background: idx % 2 === 1 ? "rgba(22,163,74,0.015)" : "#fff", transition: "background 0.1s" }}>
                    <td style={{ padding: "13px 16px", fontFamily: "ui-monospace, 'SF Mono', monospace", fontSize: 12, color: "#111827", whiteSpace: "nowrap" }}>
                      {fmt(b.startsAt)} — {fmt(b.endsAt)}
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: cc?.bg ?? "rgba(107,114,128,0.08)", color: cc?.text ?? "#6b7280" }}>
                        {b.courtName}
                      </span>
                    </td>
                    <td style={{ padding: "13px 16px", fontFamily: "system-ui, sans-serif", fontSize: 13, color: "#111827", fontWeight: 500 }}>{b.customerName}</td>
                    <td style={{ padding: "13px 16px", fontFamily: "ui-monospace, 'SF Mono', monospace", fontSize: 12, color: "#6b7280" }}>{b.customerPhone}</td>
                    <td style={{ padding: "13px 16px", fontFamily: "ui-monospace, 'SF Mono', monospace", fontSize: 13, color: "#111827", fontWeight: 600 }}>{fmtUsd(b.totalCents)}</td>
                    <td style={{ padding: "13px 16px" }}>
                      <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 20, ...statusBadge(b.status) }}>
                        {b.status === "no_show" ? "No-show" : b.status}
                      </span>
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <Link href={`/admin/bookings/${b.id}`} style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 500, color: "#16a34a", textDecoration: "none" }}>
                        Manage →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
