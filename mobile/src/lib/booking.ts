export const ALLOWED_DURATIONS = [60, 90, 120] as const;
export type Duration = (typeof ALLOWED_DURATIONS)[number];

export function next14Days(): Date[] {
  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

export function dateOnlyKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function formatDateLong(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short",
  });
}
