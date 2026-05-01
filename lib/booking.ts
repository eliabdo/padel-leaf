/**
 * Booking helpers — operating hours, slot generation, availability checks.
 */

export const OPERATING_HOURS = {
  open: 7,    // 07:00
  close: 23,  // 23:00 (last play ends here)
};
export const SLOT_INCREMENT_MINUTES = 30;
export const MIN_BOOKING_NOTICE_MS = 60 * 60 * 1000; // 1 hour
export const ALLOWED_DURATIONS = [60, 90, 120] as const;
export type Duration = (typeof ALLOWED_DURATIONS)[number];

/**
 * Generate every possible slot start time for a given date + duration.
 * Returns array of Date objects in UTC.
 */
export function generateSlotStarts(date: Date, durationMinutes: number): Date[] {
  const starts: Date[] = [];
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);

  // The last possible start time = closing - duration
  const closeMinutes = OPERATING_HOURS.close * 60;
  const openMinutes = OPERATING_HOURS.open * 60;
  const lastStartMinutes = closeMinutes - durationMinutes;

  for (let m = openMinutes; m <= lastStartMinutes; m += SLOT_INCREMENT_MINUTES) {
    const slot = new Date(day);
    slot.setHours(0, m, 0, 0);
    starts.push(slot);
  }
  return starts;
}

export function isPastNoticeWindow(slotStart: Date, now: Date = new Date()): boolean {
  return slotStart.getTime() - now.getTime() < MIN_BOOKING_NOTICE_MS;
}

export function rangesOverlap(
  aStart: Date, aEnd: Date,
  bStart: Date, bEnd: Date,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function formatDateLong(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateShort(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function dateOnlyKey(date: Date): string {
  // YYYY-MM-DD in local time
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateKey(key: string): Date {
  // Treat as local midnight
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

export function next14Days(start: Date = new Date()): Date[] {
  const out: Date[] = [];
  const d0 = new Date(start);
  d0.setHours(0, 0, 0, 0);
  for (let i = 0; i < 14; i++) {
    const d = new Date(d0);
    d.setDate(d0.getDate() + i);
    out.push(d);
  }
  return out;
}
