"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ALLOWED_DURATIONS,
  type Duration,
  formatDateShort,
  formatTime,
  next14Days,
  dateOnlyKey,
  parseDateKey,
} from "@/lib/booking";
import { formatUsd, priceForDuration } from "@/lib/pricing";

type Court = {
  id: number;
  name: string;
  surface: string;
};

type AvailabilityResp = {
  courts: {
    id: number;
    name: string;
    slots: { startIso: string; available: boolean; blocked?: boolean }[];
  }[];
};

export function BookingFlow({
  courts,
  hourlyRateCents,
}: {
  courts: Court[];
  hourlyRateCents: number;
}) {
  const router = useRouter();
  const dates = useMemo(() => next14Days(), []);
  const [selectedDate, setSelectedDate] = useState<Date>(dates[0]);
  const [duration, setDuration] = useState<Duration>(90);
  const [courtId, setCourtId] = useState<number>(courts[0]?.id ?? 0);
  const [availability, setAvailability] = useState<AvailabilityResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlotIso, setSelectedSlotIso] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalCents = priceForDuration(hourlyRateCents, duration);

  useEffect(() => {
    const url = `/api/availability?date=${dateOnlyKey(selectedDate)}&duration=${duration}`;
    setLoading(true);
    setSelectedSlotIso(null);
    fetch(url)
      .then((r) => r.json())
      .then((data: AvailabilityResp) => setAvailability(data))
      .catch(() => setAvailability(null))
      .finally(() => setLoading(false));
  }, [selectedDate, duration]);

  const courtAvail = availability?.courts.find((c) => c.id === courtId);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedSlotIso) return;
    setSubmitting(true);
    setError(null);

    const f = new FormData(e.currentTarget);
    const body = {
      courtId,
      startsAtIso: selectedSlotIso,
      durationMinutes: duration,
      customerName:  String(f.get("name")  ?? ""),
      customerEmail: String(f.get("email") ?? ""),
      customerPhone: String(f.get("phone") ?? ""),
    };

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");
      router.push(`/book/confirmation/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-10">
      {/* DATE STRIP */}
      <div>
        <Label>Date</Label>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6">
          {dates.map((d) => {
            const isSelected = dateOnlyKey(d) === dateOnlyKey(selectedDate);
            return (
              <button
                key={d.toISOString()}
                onClick={() => setSelectedDate(parseDateKey(dateOnlyKey(d)))}
                className={`shrink-0 px-4 py-3 rounded-xl border text-sm transition ${
                  isSelected
                    ? "bg-forest text-cream border-forest"
                    : "bg-cream text-charcoal border-forest/15 hover:border-forest/40"
                }`}
              >
                <div className="font-medium">{formatDateShort(d)}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* DURATION */}
      <div>
        <Label>Duration</Label>
        <div className="flex gap-2">
          {ALLOWED_DURATIONS.map((m) => (
            <button
              key={m}
              onClick={() => setDuration(m as Duration)}
              className={`px-5 py-3 rounded-xl border text-sm transition ${
                duration === m
                  ? "bg-forest text-cream border-forest"
                  : "bg-cream text-charcoal border-forest/15 hover:border-forest/40"
              }`}
            >
              {m} min
            </button>
          ))}
        </div>
      </div>

      {/* COURT */}
      <div>
        <Label>Court</Label>
        <div className="flex gap-2 flex-wrap">
          {courts.map((c) => (
            <button
              key={c.id}
              onClick={() => { setCourtId(c.id); setSelectedSlotIso(null); }}
              className={`px-5 py-3 rounded-xl border text-sm transition ${
                courtId === c.id
                  ? "bg-forest text-cream border-forest"
                  : "bg-cream text-charcoal border-forest/15 hover:border-forest/40"
              }`}
            >
              Court · {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* TIME SLOTS */}
      <div>
        <Label>Time</Label>
        {loading ? (
          <div className="text-char-soft text-sm">Loading availability…</div>
        ) : !courtAvail ? (
          <div className="text-char-soft text-sm">No courts found.</div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2">
            {courtAvail.slots.map((s) => {
              const isSelected = s.startIso === selectedSlotIso;
              const baseClass =
                "px-3 py-3 rounded-lg border text-sm text-center transition";
              if (!s.available) {
                return (
                  <div
                    key={s.startIso}
                    className={`${baseClass} text-char-soft/50 line-through border-forest/10 cursor-not-allowed bg-cream/40`}
                  >
                    {formatTime(new Date(s.startIso))}
                  </div>
                );
              }
              return (
                <button
                  key={s.startIso}
                  onClick={() => setSelectedSlotIso(s.startIso)}
                  className={`${baseClass} ${
                    isSelected
                      ? "bg-forest text-cream border-forest"
                      : "bg-cream border-forest/30 hover:border-forest"
                  }`}
                >
                  {formatTime(new Date(s.startIso))}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* TOTAL + CONFIRM */}
      <div className="bg-sage-soft rounded-2xl p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-4 mb-6">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-forest font-semibold mb-1">
              Total
            </div>
            <div className="font-serif text-4xl text-forest-deep">
              {formatUsd(totalCents)}
            </div>
            <div className="text-sm text-char-soft mt-1">
              {duration} min · pay at the venue
            </div>
          </div>
        </div>

        {selectedSlotIso ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field name="name"  label="Name"  type="text"  required />
              <Field name="phone" label="Phone" type="tel"   required />
            </div>
            <Field name="email" label="Email" type="email" required />
            {error && <div className="text-sm text-clay">{error}</div>}
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary w-full justify-center disabled:opacity-50"
            >
              {submitting ? "Confirming…" : "Confirm reservation →"}
            </button>
            <p className="text-xs text-char-soft text-center">
              By confirming, you agree to the cancellation policy: full refund
              up to 24h before, full fee owed for same-day cancellations.
            </p>
          </form>
        ) : (
          <div className="text-char-soft text-sm text-center py-4">
            Pick a time slot above to continue.
          </div>
        )}
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs uppercase tracking-[0.18em] text-forest font-semibold mb-3">
      {children}
    </div>
  );
}

function Field({
  name, label, type, required,
}: { name: string; label: string; type: string; required?: boolean }) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs uppercase tracking-[0.18em] text-forest font-semibold mb-2">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="w-full px-4 py-3 rounded-lg border border-forest/20 bg-cream focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest"
      />
    </div>
  );
}
