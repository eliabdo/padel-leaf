// Point to your deployed site — change to http://localhost:3000 for local dev
export const API_BASE = "https://padel-leaf.vercel.app";

export type Court = { id: number; name: string; surface: string };

export type AvailabilityResp = {
  courts: {
    id: number;
    name: string;
    slots: { startIso: string; available: boolean }[];
    allBlocked: boolean;
    blockOutReasons: string[];
  }[];
};

export async function fetchCourts(): Promise<Court[]> {
  const res = await fetch(`${API_BASE}/api/courts`);
  if (!res.ok) throw new Error("Failed to fetch courts");
  return res.json();
}

export async function fetchAvailability(
  dateKey: string,
  duration: number
): Promise<AvailabilityResp> {
  const res = await fetch(
    `${API_BASE}/api/availability?date=${dateKey}&duration=${duration}`
  );
  if (!res.ok) throw new Error("Failed to fetch availability");
  return res.json();
}

export async function createBooking(body: {
  courtId: number;
  startsAtIso: string;
  durationMinutes: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod: string;
}): Promise<{ id: number }> {
  const res = await fetch(`${API_BASE}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Booking failed");
  return data;
}
