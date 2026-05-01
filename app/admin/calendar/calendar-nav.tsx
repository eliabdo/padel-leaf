"use client";

import { useRouter } from "next/navigation";

type CalView = "day" | "week" | "month";

interface Props {
  dateKey:  string;
  todayKey: string;
  view:     CalView;
}

function parseKey(key: string): [number, number, number] {
  return key.split("-").map(Number) as [number, number, number];
}
function fmtKey(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function shiftDay(key: string, days: number): string {
  const [y, m, d] = parseKey(key);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return fmtKey(date.getFullYear(), date.getMonth() + 1, date.getDate());
}
function shiftMonth(key: string, months: number): string {
  const [y, m] = parseKey(key);
  const date = new Date(y, m - 1 + months, 1);
  return fmtKey(date.getFullYear(), date.getMonth() + 1, 1);
}

export default function CalendarNav({ dateKey, todayKey, view }: Props) {
  const router = useRouter();
  const go = (date: string, v: CalView = view) => router.push(`/admin/calendar?view=${v}&date=${date}`);

  const prev = () => {
    if (view === "day")   go(shiftDay(dateKey, -1));
    if (view === "week")  go(shiftDay(dateKey, -7));
    if (view === "month") go(shiftMonth(dateKey, -1));
  };
  const next = () => {
    if (view === "day")   go(shiftDay(dateKey,  1));
    if (view === "week")  go(shiftDay(dateKey,  7));
    if (view === "month") go(shiftMonth(dateKey, 1));
  };

  const isToday = dateKey === todayKey;

  // ── Styles ──────────────────────────────────────────────────────────────────
  const base: React.CSSProperties = {
    fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 500,
    padding: "7px 14px", borderRadius: 8, cursor: "pointer",
    border: "1px solid #e5e7eb", background: "#fff", color: "#374151",
    transition: "all 0.15s ease",
  };
  const active: React.CSSProperties = {
    ...base,
    border: "1px solid rgba(22,163,74,0.40)",
    background: "rgba(22,163,74,0.08)",
    color: "#15803d", fontWeight: 600,
  };
  const todayBtn: React.CSSProperties = {
    ...active, padding: "7px 18px",
    background: "#16a34a", color: "#fff", border: "none",
    boxShadow: "0 2px 6px rgba(22,163,74,0.30)",
  };
  const arrow: React.CSSProperties = { ...base, padding: "7px 12px" };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>

      {/* View switcher */}
      <div style={{ display: "flex", gap: 2, padding: "3px", borderRadius: 10, background: "#f3f4f6", border: "1px solid #e5e7eb" }}>
        {(["day", "week", "month"] as CalView[]).map(v => (
          <button key={v} onClick={() => go(dateKey, v)} style={view === v ? active : base}>
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 26, background: "#e5e7eb", flexShrink: 0 }} />

      {/* Navigation */}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <button onClick={prev} style={arrow} aria-label="Previous">← Prev</button>
        {!isToday && (
          <button onClick={() => go(todayKey)} style={todayBtn}>Today</button>
        )}
        <button onClick={next} style={arrow} aria-label="Next">Next →</button>
      </div>
    </div>
  );
}
