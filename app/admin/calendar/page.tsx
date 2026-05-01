import Link from "next/link";
import { db, schema } from "@/lib/db";
import { and, asc, gte, lt } from "drizzle-orm";
import { formatUsd } from "@/lib/pricing";
import CalendarNav from "./calendar-nav";

export const metadata = { title: "Admin · Calendar" };
export const dynamic = "force-dynamic";

// ─── View type ─────────────────────────────────────────────────────────────────
type CalView = "day" | "week" | "month";

// ─── Grid constants ─────────────────────────────────────────────────────────────
const OPEN_HOUR   = 7;
const CLOSE_HOUR  = 23;
const TOTAL_HOURS = CLOSE_HOUR - OPEN_HOUR;
const PX_PER_HOUR = 64;
const PX_PER_MIN  = PX_PER_HOUR / 60;

// ─── Design tokens ─────────────────────────────────────────────────────────────
const D = {
  bg:        "#f0f5f1",
  panel:     "#ffffff",
  header:    "#fafdfb",
  border:    "rgba(22,163,74,0.12)",
  borderSub: "rgba(22,163,74,0.07)",
  dim:       "#9ca3af",
  mid:       "#6b7280",
  soft:      "#374151",
  bright:    "#0d2010",
  now:       "#ef4444",
  nowGlow:   "rgba(239,68,68,0.50)",
};

const NEON = {
  Laurel: { c: "#15803d", g: "rgba(22,163,74,0.20)", bg: "rgba(22,163,74,0.08)", b: "rgba(22,163,74,0.30)" },
  Oak:    { c: "#b45309", g: "rgba(217,119,6,0.20)",  bg: "rgba(217,119,6,0.08)",  b: "rgba(217,119,6,0.30)"  },
  Olive:  { c: "#0369a1", g: "rgba(3,105,161,0.20)",  bg: "rgba(3,105,161,0.08)",  b: "rgba(3,105,161,0.30)"  },
} as const;
type CourtName = keyof typeof NEON;

// ─── Date/time helpers ──────────────────────────────────────────────────────────
function beirutMinutes(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Beirut", hour: "numeric", minute: "numeric", hour12: false,
  }).formatToParts(date);
  const h = Number(parts.find(p => p.type === "hour")?.value ?? "0");
  const m = Number(parts.find(p => p.type === "minute")?.value ?? "0");
  return (h === 24 ? 0 : h) * 60 + m;
}

function fmtBeirut(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Beirut", hour: "2-digit", minute: "2-digit",
  }).format(date);
}

function toKey(date: Date): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Beirut" }).format(date);
}

function localKey(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function parseKey(key: string): [number, number, number] {
  return key.split("-").map(Number) as [number, number, number];
}

function shiftKey(key: string, days: number): string {
  const [y, m, d] = parseKey(key);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return localKey(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

function getBeirutOffsetMs(dateKey: string): number {
  const [y, m, d] = parseKey(dateKey);
  const ref = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const brt = new Date(ref.toLocaleString("en-US", { timeZone: "Asia/Beirut" }));
  const utc = new Date(ref.toLocaleString("en-US", { timeZone: "UTC" }));
  return brt.getTime() - utc.getTime();
}

function keyToUtcBounds(dateKey: string): [Date, Date] {
  const [y, m, d] = parseKey(dateKey);
  const offsetMs = getBeirutOffsetMs(dateKey);
  const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - offsetMs);
  return [start, new Date(start.getTime() + 86_400_000)];
}

function getWeekKeys(dateKey: string): string[] {
  const [y, m, d] = parseKey(dateKey);
  const date = new Date(y, m - 1, d);
  const dow = date.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  return Array.from({ length: 7 }, (_, i) => {
    const d2 = new Date(date);
    d2.setDate(date.getDate() + offset + i);
    return localKey(d2.getFullYear(), d2.getMonth() + 1, d2.getDate());
  });
}

function getMonthCalKeys(dateKey: string): { key: string; inMonth: boolean }[] {
  const [y, m] = parseKey(dateKey);
  const firstDay  = new Date(y, m - 1, 1);
  const daysInMonth = new Date(y, m, 0).getDate();
  const firstDOW  = firstDay.getDay();
  const leading   = firstDOW === 0 ? 6 : firstDOW - 1;
  const lastDOW   = new Date(y, m, 0).getDay();
  const trailing  = lastDOW === 0 ? 0 : 7 - lastDOW;

  const cells: { key: string; inMonth: boolean }[] = [];
  for (let i = leading; i > 0; i--) {
    const d2 = new Date(y, m - 1, 1 - i);
    cells.push({ key: localKey(d2.getFullYear(), d2.getMonth() + 1, d2.getDate()), inMonth: false });
  }
  for (let i = 1; i <= daysInMonth; i++) cells.push({ key: localKey(y, m, i), inMonth: true });
  for (let i = 1; i <= trailing; i++) {
    const d2 = new Date(y, m, i);
    cells.push({ key: localKey(d2.getFullYear(), d2.getMonth() + 1, d2.getDate()), inMonth: false });
  }
  return cells;
}

function fmtHour(h: number): string {
  return `${String(h).padStart(2, "0")}:00`;
}

// ─── Row types (from Drizzle select) ──────────────────────────────────────────
type BkRow = {
  id: number;
  customerName: string;
  startsAt: Date | string;
  endsAt: Date | string;
  durationMinutes: number;
  totalCents: number;
  status: string;
  courtId: number;
};
type BoRow = { id: number; startsAt: Date | string; endsAt: Date | string; reason: string; courtId: number };
type CourtRow = { id: number; name: string; sortOrder: number };

// ─── Positioning helpers ───────────────────────────────────────────────────────
function bkPos(bk: BkRow) {
  const s = new Date(bk.startsAt), e = new Date(bk.endsAt);
  return {
    top:    Math.max((beirutMinutes(s) - OPEN_HOUR * 60) * PX_PER_MIN, 0),
    height: Math.max((beirutMinutes(e) - beirutMinutes(s)) * PX_PER_MIN - 2, 24),
  };
}
function boPos(bo: BoRow) {
  const s = new Date(bo.startsAt), e = new Date(bo.endsAt);
  return {
    top:    Math.max((beirutMinutes(s) - OPEN_HOUR * 60) * PX_PER_MIN, 0),
    height: Math.max((beirutMinutes(e) - beirutMinutes(s)) * PX_PER_MIN - 2, 24),
  };
}

// ─── Shared time-grid column ───────────────────────────────────────────────────
function TimeGutter({ hours }: { hours: number[] }) {
  return (
    <div className="w-14 flex-shrink-0 relative" style={{ borderRight: `1px solid ${D.border}`, background: D.panel }}>
      {hours.map(h => (
        <div key={h} className="absolute right-0 left-0 flex justify-end pr-2"
          style={{ top: `${(h - OPEN_HOUR) * PX_PER_HOUR - 8}px` }}>
          <span className="text-[10px] font-mono whitespace-nowrap" style={{ color: D.dim }}>{fmtHour(h)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Background grid lines for a column ───────────────────────────────────────
function GridLines({ hours }: { hours: number[] }) {
  return (
    <>
      {hours.map(h => (
        <div key={h} className="absolute left-0 right-0"
          style={{ top: `${(h - OPEN_HOUR) * PX_PER_HOUR}px`, borderTop: `1px solid ${D.border}` }} />
      ))}
      {hours.slice(0, -1).map(h => (
        <div key={`${h}h`} className="absolute left-0 right-0"
          style={{ top: `${(h - OPEN_HOUR) * PX_PER_HOUR + PX_PER_HOUR / 2}px`, borderTop: `1px dashed ${D.borderSub}` }} />
      ))}
    </>
  );
}

// ─── Current-time bar ─────────────────────────────────────────────────────────
function NowLine({ top, showDot }: { top: number; showDot: boolean }) {
  return (
    <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: `${top}px` }}>
      {showDot && (
        <div className="absolute -left-1 -top-[5px] w-2.5 h-2.5 rounded-full"
          style={{ background: D.now, boxShadow: `0 0 6px ${D.nowGlow}` }} />
      )}
      <div className="h-px" style={{ background: D.now, boxShadow: `0 0 4px ${D.nowGlow}` }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DAY VIEW
// ─────────────────────────────────────────────────────────────────────────────
function DayView({
  courts, bookings, blockOuts, nowTop, hours, totalHeight,
}: {
  courts: CourtRow[];
  bookings: BkRow[];
  blockOuts: BoRow[];
  nowTop: number | null;
  hours: number[];
  totalHeight: number;
}) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: D.panel, border: `1px solid ${D.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)" }}>

      {/* Court header */}
      <div className="flex sticky top-0 z-30" style={{ background: D.header, borderBottom: `1px solid ${D.border}` }}>
        <div className="w-14 flex-shrink-0" style={{ borderRight: `1px solid ${D.border}` }} />
        {courts.map((court, i) => {
          const n = NEON[court.name as CourtName] ?? NEON.Laurel;
          const count = bookings.filter(b => b.courtId === court.id && b.status !== "cancelled").length;
          return (
            <div key={court.id} className="flex-1 px-5 py-4"
              style={{ borderRight: i < courts.length - 1 ? `1px solid ${D.border}` : undefined }}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: n.c }} />
                <span className="text-[11px] font-mono font-bold uppercase tracking-[0.25em]" style={{ color: n.c }}>
                  {court.name}
                </span>
              </div>
              <div className="text-[10px] font-mono" style={{ color: D.dim }}>
                {count === 0 ? "no bookings" : `${count} booking${count !== 1 ? "s" : ""}`}
              </div>
            </div>
          );
        })}
      </div>

      {/* Scrollable time grid */}
      <div className="overflow-y-auto" style={{ maxHeight: "70vh" }}>
        <div className="flex" style={{ height: `${totalHeight}px` }}>
          <TimeGutter hours={hours} />
          {courts.map((court, ci) => {
            const n = NEON[court.name as CourtName] ?? NEON.Laurel;
            const cBk = bookings.filter(b => b.courtId === court.id);
            const cBo = blockOuts.filter(b => b.courtId === court.id);
            return (
              <div key={court.id} className="flex-1 relative"
                style={{ borderRight: ci < courts.length - 1 ? `1px solid ${D.border}` : undefined, background: D.panel }}>
                {/* Subtle column wash */}
                <div className="absolute inset-0 pointer-events-none" style={{ background: n.bg, opacity: 0.25 }} />
                <GridLines hours={hours} />
                {nowTop !== null && <NowLine top={nowTop} showDot={ci === 0} />}

                {/* Block-outs */}
                {cBo.map(bo => {
                  const { top, height } = boPos(bo);
                  return (
                    <div key={bo.id} className="absolute left-1 right-1 rounded-lg px-2 py-1 z-10 overflow-hidden"
                      style={{ top: `${top}px`, height: `${height}px`, background: "rgba(107,114,128,0.07)", border: "1px solid rgba(107,114,128,0.18)" }}>
                      <div className="text-[10px] font-mono truncate" style={{ color: D.dim }}>⊘ {bo.reason}</div>
                    </div>
                  );
                })}

                {/* Bookings */}
                {cBk.map(bk => {
                  const { top, height } = bkPos(bk);
                  const cancelled = bk.status === "cancelled";
                  return (
                    <Link key={bk.id} href={`/admin/bookings/${bk.id}`}
                      className="absolute left-1 right-1 rounded-xl z-10 overflow-hidden transition-all hover:brightness-95 hover:scale-[1.01]"
                      style={{
                        top: `${top}px`, height: `${height}px`,
                        background: cancelled ? "rgba(107,114,128,0.05)" : n.bg,
                        border: `1px solid ${cancelled ? "rgba(107,114,128,0.18)" : n.b}`,
                        boxShadow: cancelled ? "none" : `0 2px 8px ${n.g}`,
                        opacity: cancelled ? 0.5 : 1,
                      }}>
                      {!cancelled && (
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
                          style={{ background: n.c }} />
                      )}
                      <div className="pl-3 pr-2 pt-1.5 pb-1">
                        <div className="text-[11px] font-mono font-bold leading-tight truncate"
                          style={{ color: cancelled ? D.dim : n.c, textDecoration: cancelled ? "line-through" : "none" }}>
                          {bk.customerName}
                        </div>
                        <div className="text-[10px] font-mono leading-tight truncate mt-0.5" style={{ color: D.mid }}>
                          {fmtBeirut(new Date(bk.startsAt))}–{fmtBeirut(new Date(bk.endsAt))}
                        </div>
                        {height >= 64 && (
                          <div className="text-[10px] font-mono leading-tight truncate mt-0.5"
                            style={{ color: cancelled ? D.dim : n.c, opacity: 0.7 }}>
                            {formatUsd(bk.totalCents)}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WEEK VIEW
// ─────────────────────────────────────────────────────────────────────────────
function WeekView({
  courts, weekKeys, bookingsByDay, blockOutsByDay, todayKey, nowTop, hours, totalHeight,
}: {
  courts: CourtRow[];
  weekKeys: string[];
  bookingsByDay: Map<string, BkRow[]>;
  blockOutsByDay: Map<string, BoRow[]>;
  todayKey: string;
  nowTop: number | null;
  hours: number[];
  totalHeight: number;
}) {
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: D.panel, border: `1px solid ${D.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)" }}>

      {/* Day headers */}
      <div className="flex sticky top-0 z-30" style={{ background: D.header, borderBottom: `1px solid ${D.border}` }}>
        <div className="w-14 flex-shrink-0" style={{ borderRight: `1px solid ${D.border}` }} />
        {weekKeys.map((key, i) => {
          const [y, m, d] = parseKey(key);
          const isToday = key === todayKey;
          const dayBk   = bookingsByDay.get(key) ?? [];
          const confirmed = dayBk.filter(b => b.status !== "cancelled");
          return (
            <Link key={key} href={`/admin/calendar?view=day&date=${key}`}
              className="flex-1 px-3 py-3 transition-all hover:bg-gray-50"
              style={{ borderRight: i < 6 ? `1px solid ${D.border}` : undefined }}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[9px] font-mono uppercase tracking-[0.2em]" style={{ color: D.dim }}>
                  {dayNames[i]}
                </span>
                <span className="text-[13px] font-mono font-bold"
                  style={{ color: isToday ? "#16a34a" : D.bright }}>
                  {String(d).padStart(2, "0")}
                </span>
                {isToday && (
                  <div className="w-1 h-1 rounded-full flex-shrink-0"
                    style={{ background: "#16a34a" }} />
                )}
              </div>
              {/* Court booking indicators */}
              <div className="flex gap-0.5">
                {courts.map(c => {
                  const n = NEON[c.name as CourtName] ?? NEON.Laurel;
                  const cnt = confirmed.filter(b => b.courtId === c.id).length;
                  return (
                    <div key={c.id} className="h-1 rounded-full flex-1 transition-all"
                      style={{ background: cnt > 0 ? n.c : D.dim, opacity: cnt > 0 ? 0.8 : 0.20 }} />
                  );
                })}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="overflow-y-auto" style={{ maxHeight: "70vh" }}>
        <div className="flex" style={{ height: `${totalHeight}px` }}>
          <TimeGutter hours={hours} />
          {weekKeys.map((key, di) => {
            const isToday   = key === todayKey;
            const dayBk     = bookingsByDay.get(key) ?? [];
            const dayBo     = blockOutsByDay.get(key) ?? [];
            return (
              <div key={key} className="flex-1 relative"
                style={{ borderRight: di < 6 ? `1px solid ${D.border}` : undefined, background: D.panel }}>
                {/* Today tint */}
                {isToday && (
                  <div className="absolute inset-0 pointer-events-none"
                    style={{ background: "rgba(22,163,74,0.035)" }} />
                )}
                <GridLines hours={hours} />
                {isToday && nowTop !== null && <NowLine top={nowTop} showDot={di === 0} />}

                {/* Block-outs */}
                {dayBo.map(bo => {
                  const { top, height } = boPos(bo);
                  return (
                    <div key={bo.id} className="absolute left-0.5 right-0.5 rounded px-1.5 py-0.5 z-10 overflow-hidden"
                      style={{ top: `${top}px`, height: `${height}px`, background: "rgba(107,114,128,0.07)", border: "1px solid rgba(107,114,128,0.18)" }}>
                      <div className="text-[9px] font-mono truncate" style={{ color: D.dim }}>⊘</div>
                    </div>
                  );
                })}

                {/* Bookings — use track layout for same-time overlap */}
                {(() => {
                  const sorted = [...dayBk].sort((a, b) =>
                    new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
                  // Assign each booking a track so overlapping bookings sit side-by-side
                  type Tracked = BkRow & { track: number; trackSpan: number };
                  const tracks: Date[] = [];
                  const tracked: Tracked[] = sorted.map(bk => {
                    const s = new Date(bk.startsAt);
                    const e = new Date(bk.endsAt);
                    let t = tracks.findIndex(end => end <= s);
                    if (t === -1) { t = tracks.length; tracks.push(e); }
                    else tracks[t] = e;
                    return { ...bk, track: t, trackSpan: 1 };
                  });
                  const maxTracks = tracks.length || 1;
                  return tracked.map(bk => {
                    const { top, height } = bkPos(bk);
                    const cancelled = bk.status === "cancelled";
                    const n = NEON[(courts.find(c => c.id === bk.courtId)?.name ?? "Laurel") as CourtName];
                    const w = 100 / maxTracks;
                    return (
                      <Link key={bk.id} href={`/admin/bookings/${bk.id}`}
                        className="absolute z-10 overflow-hidden rounded-lg transition-all hover:brightness-95"
                        style={{
                          top: `${top}px`, height: `${height}px`,
                          left: `${bk.track * w + 0.5}%`, width: `${w - 1}%`,
                          background: cancelled ? "rgba(107,114,128,0.05)" : n.bg,
                          border: `1px solid ${cancelled ? "rgba(107,114,128,0.18)" : n.b}`,
                          boxShadow: cancelled ? "none" : `0 2px 6px ${n.g}`,
                          opacity: cancelled ? 0.5 : 1,
                        }}>
                        <div className="absolute left-0 top-0 bottom-0 w-0.5"
                          style={{ background: cancelled ? "transparent" : n.c }} />
                        <div className="pl-2 pr-1 pt-1">
                          <div className="text-[10px] font-mono font-bold truncate leading-tight"
                            style={{ color: cancelled ? D.dim : n.c }}>
                            {bk.customerName}
                          </div>
                          {height >= 40 && (
                            <div className="text-[9px] font-mono truncate leading-tight" style={{ color: D.dim }}>
                              {fmtBeirut(new Date(bk.startsAt))}
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  });
                })()}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MONTH VIEW
// ─────────────────────────────────────────────────────────────────────────────
function MonthView({
  courts, cells, bookingsByDay, todayKey,
}: {
  courts: CourtRow[];
  cells: { key: string; inMonth: boolean }[];
  bookingsByDay: Map<string, BkRow[]>;
  todayKey: string;
}) {
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: D.panel, border: `1px solid ${D.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)" }}>

      {/* Day-of-week header */}
      <div className="grid grid-cols-7" style={{ borderBottom: `1px solid ${D.border}`, background: D.header }}>
        {dayLabels.map(label => (
          <div key={label} className="py-3 text-center">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: D.dim }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-7">
        {cells.map(({ key, inMonth }, idx) => {
          const [, , d]   = parseKey(key);
          const isToday   = key === todayKey;
          const dayBk     = bookingsByDay.get(key) ?? [];
          const confirmed = dayBk.filter(b => b.status !== "cancelled");
          const isLastRow = idx >= cells.length - 7;

          return (
            <Link key={key} href={`/admin/calendar?view=day&date=${key}`}
              className="relative min-h-[96px] p-2 transition-all hover:bg-green-50"
              style={{
                borderRight:  (idx % 7) < 6 ? `1px solid ${D.border}` : undefined,
                borderBottom: !isLastRow ? `1px solid ${D.border}` : undefined,
                background:   isToday ? "rgba(22,163,74,0.05)" : D.panel,
                ...(isToday ? { boxShadow: `inset 0 0 0 1.5px rgba(22,163,74,0.35)` } : {}),
              }}>

              {/* Date number */}
              <div className={`text-[12px] font-mono font-bold mb-1.5 w-6 h-6 flex items-center justify-center rounded-full`}
                style={{
                  color: isToday ? "#16a34a" : inMonth ? D.soft : D.dim,
                  background: isToday ? "rgba(22,163,74,0.12)" : "transparent",
                }}>
                {d}
              </div>

              {/* Booking pills */}
              <div className="flex flex-col gap-0.5">
                {courts.map(court => {
                  const n = NEON[court.name as CourtName] ?? NEON.Laurel;
                  const courtBk = confirmed.filter(b => b.courtId === court.id);
                  if (courtBk.length === 0) return null;
                  return (
                    <div key={court.id} className="flex items-center gap-1 rounded px-1.5 py-0.5 overflow-hidden"
                      style={{ background: n.bg, border: `1px solid ${n.b}` }}>
                      <div className="w-1 h-1 rounded-full flex-shrink-0"
                        style={{ background: n.c, boxShadow: `0 0 4px ${n.c}` }} />
                      <span className="text-[9px] font-mono truncate" style={{ color: n.c }}>
                        {courtBk.length > 1 ? `${court.name} ×${courtBk.length}` : courtBk[0].customerName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; view?: string }>;
}) {
  const params  = await searchParams;
  const now     = new Date();
  const todayKey = toKey(now);

  const view: CalView =
    params.view === "day" ? "day" : params.view === "week" ? "week" : "month";
  const dateKey =
    params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : todayKey;

  // ── Build fetch range ───────────────────────────────────────────────────────
  let fetchStart: Date, fetchEnd: Date;
  let weekKeys:  string[] = [];
  let monthCells: { key: string; inMonth: boolean }[] = [];

  if (view === "day") {
    [fetchStart, fetchEnd] = keyToUtcBounds(dateKey);
  } else if (view === "week") {
    weekKeys = getWeekKeys(dateKey);
    [fetchStart] = keyToUtcBounds(weekKeys[0]);
    [, fetchEnd]  = keyToUtcBounds(weekKeys[6]);
  } else {
    monthCells = getMonthCalKeys(dateKey);
    const allKeys = monthCells.map(c => c.key);
    [fetchStart] = keyToUtcBounds(allKeys[0]);
    [, fetchEnd]  = keyToUtcBounds(allKeys[allKeys.length - 1]);
  }

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const [courts, bookings, blockOuts] = await Promise.all([
    db.select().from(schema.courts).orderBy(asc(schema.courts.sortOrder)),

    db.select({
      id: schema.bookings.id,
      customerName:    schema.bookings.customerName,
      startsAt:        schema.bookings.startsAt,
      endsAt:          schema.bookings.endsAt,
      durationMinutes: schema.bookings.durationMinutes,
      totalCents:      schema.bookings.totalCents,
      status:          schema.bookings.status,
      courtId:         schema.bookings.courtId,
    })
    .from(schema.bookings)
    .where(and(gte(schema.bookings.startsAt, fetchStart), lt(schema.bookings.startsAt, fetchEnd)))
    .orderBy(asc(schema.bookings.startsAt)),

    db.select({
      id: schema.blockOuts.id,
      startsAt: schema.blockOuts.startsAt,
      endsAt:   schema.blockOuts.endsAt,
      reason:   schema.blockOuts.reason,
      courtId:  schema.blockOuts.courtId,
    })
    .from(schema.blockOuts)
    .where(and(gte(schema.blockOuts.startsAt, fetchStart), lt(schema.blockOuts.startsAt, fetchEnd))),
  ]);

  // ── Group by date key ────────────────────────────────────────────────────────
  const bookingsByDay  = new Map<string, BkRow[]>();
  const blockOutsByDay = new Map<string, BoRow[]>();
  for (const bk of bookings) {
    const k = toKey(new Date(bk.startsAt));
    if (!bookingsByDay.has(k)) bookingsByDay.set(k, []);
    bookingsByDay.get(k)!.push(bk);
  }
  for (const bo of blockOuts) {
    const k = toKey(new Date(bo.startsAt));
    if (!blockOutsByDay.has(k)) blockOutsByDay.set(k, []);
    blockOutsByDay.get(k)!.push(bo);
  }

  // ── Current-time position ────────────────────────────────────────────────────
  const curMin = beirutMinutes(now);
  const nowTop =
    view !== "month" && curMin >= OPEN_HOUR * 60 && curMin < CLOSE_HOUR * 60
      ? (curMin - OPEN_HOUR * 60) * PX_PER_MIN
      : null;
  const showNow = view !== "month" && (view === "day" ? dateKey === todayKey : weekKeys.includes(todayKey));

  const hours       = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => OPEN_HOUR + i);
  const totalHeight = TOTAL_HOURS * PX_PER_HOUR;

  // ── Display label ────────────────────────────────────────────────────────────
  const [dy, dm, dd] = parseKey(dateKey);
  let displayLabel: string;
  if (view === "day") {
    displayLabel = new Date(dy, dm - 1, dd).toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  } else if (view === "week") {
    const [wy, wm, wd] = parseKey(weekKeys[0]);
    const [ey, em, ed] = parseKey(weekKeys[6]);
    const s = new Date(wy, wm - 1, wd).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const e = new Date(ey, em - 1, ed).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    displayLabel = `${s} – ${e}`;
  } else {
    displayLabel = new Date(dy, dm - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  }

  return (
    <div style={{ background: D.bg, minHeight: "100vh" }} className="px-6 py-10">
      <div className="max-w-7xl mx-auto">

        {/* ── Page header ─────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
          <div>
            <div className="text-[9px] font-mono uppercase tracking-[0.35em] mb-2" style={{ color: D.dim }}>
              ◈ COURT CALENDAR
            </div>
            <h1 className="font-mono text-2xl font-bold tracking-tight" style={{ color: D.bright }}>
              {displayLabel}
            </h1>
            {view !== "month" && dateKey === todayKey && (
              <div className="text-[10px] font-mono mt-1 flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: D.now }} />
                <span style={{ color: D.mid }}>LIVE · {fmtBeirut(now)}</span>
              </div>
            )}
          </div>
          <CalendarNav dateKey={dateKey} todayKey={todayKey} view={view} />
        </div>

        {/* ── Views ────────────────────────────────────────────────────────────── */}
        {view === "day" && (
          <DayView
            courts={courts}
            bookings={bookingsByDay.get(dateKey) ?? []}
            blockOuts={blockOutsByDay.get(dateKey) ?? []}
            nowTop={showNow ? nowTop : null}
            hours={hours}
            totalHeight={totalHeight}
          />
        )}
        {view === "week" && (
          <WeekView
            courts={courts}
            weekKeys={weekKeys}
            bookingsByDay={bookingsByDay}
            blockOutsByDay={blockOutsByDay}
            todayKey={todayKey}
            nowTop={showNow ? nowTop : null}
            hours={hours}
            totalHeight={totalHeight}
          />
        )}
        {view === "month" && (
          <MonthView
            courts={courts}
            cells={monthCells}
            bookingsByDay={bookingsByDay}
            todayKey={todayKey}
          />
        )}

        {/* ── Footer legend ─────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-5">
          <div className="flex flex-wrap items-center gap-5">
            {courts.map(c => {
              const n = NEON[c.name as CourtName] ?? NEON.Laurel;
              return (
                <div key={c.id} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full"
                    style={{ background: n.c }} />
                  <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: D.soft }}>{c.name}</span>
                </div>
              );
            })}
            {showNow && nowTop !== null && (
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-px" style={{ background: D.now }} />
                <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: D.soft }}>Now</span>
              </div>
            )}
          </div>
          <Link href="/admin/bookings/new"
            className="font-mono text-[11px] uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all hover:brightness-95"
            style={{ background: "#16a34a", border: "none", color: "#fff", boxShadow: "0 2px 8px rgba(22,163,74,0.30)" }}>
            + New Booking
          </Link>
        </div>

      </div>
    </div>
  );
}
